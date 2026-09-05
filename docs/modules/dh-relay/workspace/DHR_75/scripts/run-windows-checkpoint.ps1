[CmdletBinding()]
param(
  [Parameter(Mandatory)]
  [ValidateSet('herdr.codex.main', 'herdr.claude.main')]
  [string]$ProfileId,
  [Parameter(Mandatory)]
  [string]$EvidenceRoot,
  [Parameter(Mandatory)]
  [string]$RelayRoot,
  [int]$TimeoutSeconds = 300
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$relayEnvironmentNames = @(
  'DH_RELAY_CREDENTIAL_ROOT',
  'DH_RELAY_INDEX_PATH',
  'DH_RELAY_HERDR_BIN',
  'DH_RELAY_HERDR_ARGS'
)
$relayEnvironmentPrior = [ordered]@{}
$relayEnvironmentIsolated = $false

function Set-Dhr72IsolatedEnvironment([string]$Root, [string]$HerdrBin) {
  foreach ($name in $relayEnvironmentNames) {
    $script:relayEnvironmentPrior[$name] = [Environment]::GetEnvironmentVariable($name, 'Process')
  }
  $script:relayEnvironmentIsolated = $true
  try {
    [Environment]::SetEnvironmentVariable('DH_RELAY_CREDENTIAL_ROOT', (Join-Path $Root 'private-credentials'), 'Process')
    [Environment]::SetEnvironmentVariable('DH_RELAY_INDEX_PATH', (Join-Path $Root 'private-runtime/runs.json'), 'Process')
    [Environment]::SetEnvironmentVariable('DH_RELAY_HERDR_BIN', $HerdrBin, 'Process')
    [Environment]::SetEnvironmentVariable('DH_RELAY_HERDR_ARGS', '[]', 'Process')
  } catch {
    Restore-Dhr72Environment
    throw
  }
}

function Restore-Dhr72Environment() {
  if (-not $script:relayEnvironmentIsolated) { return }
  foreach ($name in $relayEnvironmentNames) {
    [Environment]::SetEnvironmentVariable($name, $script:relayEnvironmentPrior[$name], 'Process')
  }
}

function Write-Json([string]$Path, $Value) {
  $json = $Value | ConvertTo-Json -Depth 16
  [IO.File]::WriteAllText($Path, $json, [Text.UTF8Encoding]::new($false))
}

function Invoke-RelayText([string[]]$Arguments) {
  $startInfo = [Diagnostics.ProcessStartInfo]::new()
  $startInfo.FileName = 'node'
  $startInfo.Arguments = ((@($script:relayCli) + $Arguments | ForEach-Object {
    '"' + $_.Replace('"', '\"') + '"'
  }) -join ' ')
  $startInfo.UseShellExecute = $false
  $startInfo.RedirectStandardOutput = $true
  $startInfo.RedirectStandardError = $true
  $startInfo.CreateNoWindow = $true
  $process = [Diagnostics.Process]::new()
  $process.StartInfo = $startInfo
  [void]$process.Start()
  $output = $process.StandardOutput.ReadToEnd()
  $errorOutput = $process.StandardError.ReadToEnd()
  $process.WaitForExit()
  $exitCode = $process.ExitCode
  if ($exitCode -ne 0) {
    throw "relay command failed ($exitCode): $errorOutput$output"
  }
  if ([string]::IsNullOrWhiteSpace($output)) {
    throw "relay command produced no JSON: $errorOutput"
  }
  return $output
}

function Invoke-Relay([string[]]$Arguments) {
  return (Invoke-RelayText $Arguments | ConvertFrom-Json)
}

# Herdr only reports `name` for agents it has been told to name; auto-detected agents (a product started
# through `pane run`, before rename) carry no such property at all.  Strict mode turns a direct access on
# those records into a terminating error, so every optional field goes through this accessor.
function Get-HerdrField($Record, [string]$Field) {
  if ($null -eq $Record) { return $null }
  $property = $Record.PSObject.Properties[$Field]
  if ($null -eq $property) { return $null }
  return $property.Value
}

function Stop-Dhr72Service([string]$Root) {
  $escapedRoot = $Root.Replace("'", "''")
  $services = Get-CimInstance Win32_Process -Filter "Name = 'node.exe'" |
    Where-Object { $_.CommandLine -like '*service-main.mjs*' -and $_.CommandLine -like "*$escapedRoot*" }
  foreach ($service in $services) {
    Stop-Process -Id $service.ProcessId -Force
  }
}

if ($env:HERDR_ENV -ne '1') {
  throw 'DHR72 requires the current Herdr-managed pane; no external Herdr control is allowed.'
}
if (@(Get-Process -Name dsh -ErrorAction SilentlyContinue).Count -ne 0) {
  throw 'DHR72 requires DSH to be closed before a real node is started.'
}
$herdrCommand = Get-Command herdr -CommandType Application -ErrorAction Stop | Select-Object -First 1
$herdrBin = $herdrCommand.Source
if ([string]::IsNullOrWhiteSpace($herdrBin)) { throw 'DHR72 requires a resolvable Herdr application path.' }

$repoRoot = (& git -C $RelayRoot rev-parse --show-toplevel).Trim()
if (-not $repoRoot) { throw 'cannot resolve relay repository root' }
$relayCli = Join-Path $repoRoot 'relay-core/cli/main.mjs'
if (-not (Test-Path -LiteralPath $relayCli)) { throw "missing Relay CLI: $relayCli" }

$evidenceDir = Join-Path $EvidenceRoot ($ProfileId -replace '[^A-Za-z0-9._-]', '_')
New-Item -ItemType Directory -Force -Path $evidenceDir | Out-Null
# F-3508: real products refuse to start inside a directory their own trust gate has never seen, and no
# CLI argument turns that gate off.  A per-profile fixture root that keeps its path across runs is
# therefore the only launchable shape: the operator answers the product trust prompt once, and every
# later run starts inside an already-trusted path.  Run data is still wiped before and after each run.
$temporaryRoot = Join-Path ([IO.Path]::GetTempPath()) ("DHR75-fixture-$($ProfileId -replace '[^A-Za-z0-9]', '-')")

function Clear-Dhr72FixtureContent([string]$Root) {
  if (-not (Test-Path -LiteralPath $Root)) { return }
  foreach ($item in Get-ChildItem -LiteralPath $Root -Force) {
    Remove-Item -LiteralPath $item.FullName -Recurse -Force -ErrorAction SilentlyContinue
  }
}
$paneId = $null
$start = $null
$agent = $null
$stage = 'initialize'

try {
  $stage = 'temporary-root'
  Clear-Dhr72FixtureContent $temporaryRoot
  New-Item -ItemType Directory -Force -Path $temporaryRoot | Out-Null
  & git -C $temporaryRoot init -q
  if ($LASTEXITCODE -ne 0) { throw 'temporary Git repository initialization failed' }
  [IO.File]::WriteAllText((Join-Path $temporaryRoot '.gitignore'), ".dh-relay/`n", [Text.UTF8Encoding]::new($false))
  Set-Dhr72IsolatedEnvironment $temporaryRoot $herdrBin

  $runDocument = [ordered]@{
    protocol = 'relay.run/v2'
    run_id = "R001-dhr72-$($ProfileId -replace '[^A-Za-z0-9]', '-')-$((Get-Date).ToUniversalTime().ToString('yyyyMMddHHmmss'))"
    workflow_name = 'relay/dhr72-real-checkpoint@1'
    summary = 'DHR72 isolated Windows checkpoint proof'
    trigger = 'system'
    created_at = (Get-Date).ToUniversalTime().ToString('o')
    labels = @([ordered]@{ key = 'dhr72.profile'; value = $ProfileId })
    nodes = @([ordered]@{
      node_id = 'real-product'
      title = 'DHR72 real product node'
      role = 'executor'
      required = $true
      depends_on = @()
      executor_profiles = @([ordered]@{ kind = 'herdr-agent'; ref = $ProfileId })
    })
  }
  $runPath = Join-Path $temporaryRoot 'run.json'
  Write-Json $runPath $runDocument

  $stage = 'agent-baseline'
  # Herdr agent records carry both `agent` (the product kind, e.g. codex) and `name` (the unique
  # relay-assigned identity).  Every lookup below must key on `name`; keying on `agent` would compare
  # kinds and address the wrong agent.
  $oldAgents = @(((& $herdrBin agent list) | ConvertFrom-Json).result.agents |
    ForEach-Object { Get-HerdrField $_ 'name' } | Where-Object { -not [string]::IsNullOrWhiteSpace($_) })
  $startedAt = Get-Date
  $stage = 'relay-start'
  $start = Invoke-Relay @('start', '--run', $runPath, '--root', $temporaryRoot, '--json')
  Write-Json (Join-Path $evidenceDir 'start.json') $start

  $deadline = (Get-Date).AddSeconds($TimeoutSeconds)
  $agent = $null
  $stage = 'agent-discovery'
  while ((Get-Date) -lt $deadline -and $null -eq $agent) {
    $agents = ((& $herdrBin agent list) | ConvertFrom-Json).result.agents
    # Wait for a named agent: a Claude profile is started through `pane run` and only gains its relay
    # identity once the adapter renames it, so an unnamed record here is simply "not ready yet".
    $agent = @($agents | Where-Object {
      (Get-HerdrField $_ 'cwd') -eq $temporaryRoot -and
      -not [string]::IsNullOrWhiteSpace((Get-HerdrField $_ 'name')) -and
      $oldAgents -notcontains (Get-HerdrField $_ 'name')
    }) | Select-Object -First 1
    if ($null -eq $agent) { Start-Sleep -Milliseconds 250 }
  }
  if ($null -eq $agent) { throw 'no newly launched Herdr agent was observed for the isolated root' }
  $paneId = $agent.pane_id
  Write-Json (Join-Path $evidenceDir 'agent-start.json') ([ordered]@{
    profile_id = $ProfileId; agent_name = $agent.name; pane_id = $paneId; started_at = $startedAt.ToUniversalTime().ToString('o')
  })

  $stage = 'agent-ready'
  $statusName = $null
  $interactive = $false
  while ((Get-Date) -lt $deadline) {
    $listed = @(((& $herdrBin agent list) | ConvertFrom-Json).result.agents |
      Where-Object { (Get-HerdrField $_ 'name') -eq $agent.name })
    $live = $listed | Select-Object -First 1
    if ($null -eq $live) { throw "launched agent disappeared from herdr agent list: $($agent.name)" }
    $statusName = [string](Get-HerdrField $live 'agent_status')
    $interactive = [bool](Get-HerdrField $live 'interactive_ready')
    if ($statusName -in @('idle', 'done') -or $interactive) { break }
    if ($statusName -eq 'blocked') {
      throw "launched agent is blocked before instruction; status=$statusName"
    }
    Start-Sleep -Milliseconds 250
  }
  if ($statusName -notin @('idle', 'done') -and -not $interactive) {
    throw "launched agent did not become promptable before timeout; last=$statusName"
  }

  # DHR72 proves real observation only. It must not submit a Receipt Result or consume DHR35's
  # end-to-end evidence boundary; the harmless command gives Herdr a real working interval to observe.
  $stage = 'checkpoint-instruction'
  $instruction = @(
    'This is a controlled DHR72 checkpoint proof. Do not modify files, inspect user configuration, open credentials, or submit any Receipt Result.',
    'Ignore any earlier completion instruction. Run exactly this harmless command in the isolated temporary Git repository, then stop:',
    'node -e "setTimeout(() => {}, 5000)"',
    'Report only the command exit status. Do not run relay submit-result or any other command.'
  ) -join "`n"
  $stage = 'agent-instruction'
  $promptOutput = & $herdrBin agent prompt $agent.name $instruction
  $promptExitCode = $LASTEXITCODE
  if ($promptExitCode -ne 0) {
    throw "controlled instruction was rejected (exit $promptExitCode)"
  }
  $readyAfterPrompt = $false
  foreach ($unused in 1..2) {
    Start-Sleep -Milliseconds 400
    $listed = @(((& $herdrBin agent list) | ConvertFrom-Json).result.agents |
      Where-Object { (Get-HerdrField $_ 'name') -eq $agent.name }) | Select-Object -First 1
    $statusName = [string](Get-HerdrField $listed 'agent_status')
    if ($statusName -eq 'working') { $readyAfterPrompt = $true; break }
  }
  if (-not $readyAfterPrompt) {
    $listed = @(((& $herdrBin agent list) | ConvertFrom-Json).result.agents |
      Where-Object { (Get-HerdrField $_ 'name') -eq $agent.name }) | Select-Object -First 1
    if ([string](Get-HerdrField $listed 'agent_status') -ne 'working') {
      throw 'failed to deliver controlled completion instruction to the newly launched agent'
    }
  }

  $eventLogPath = Join-Path $temporaryRoot ".dh-relay/$($start.run_id)/events.jsonl"
  $checkpointCount = 0
  $stage = 'checkpoint-observation'
  while ((Get-Date) -lt $deadline) {
    if (Test-Path -LiteralPath $eventLogPath) {
      $checkpointCount = @([IO.File]::ReadAllLines($eventLogPath) | ForEach-Object {
        if ([string]::IsNullOrWhiteSpace($_)) { return $null }
        $_ | ConvertFrom-Json
      } | Where-Object { (Get-HerdrField $_ 'kind') -eq 'checkpoint_recorded' }).Count
      if ($checkpointCount -gt 0) { break }
    }
    Start-Sleep -Milliseconds 250
  }
  if ($checkpointCount -eq 0) {
    throw 'no checkpoint_recorded event was observed before timeout'
  }

  $stage = 'evidence-collection'
  $status = Invoke-Relay @('status', '--root', $temporaryRoot, '--json', $start.run_id)
  $eventsText = Invoke-RelayText @('events', '--root', $temporaryRoot, '--json', $start.run_id)
  $inspectText = Invoke-RelayText @('inspect', '--root', $temporaryRoot, '--json', $start.run_id)
  $focusText = Invoke-RelayText @('focus', '--root', $temporaryRoot, '--json', $start.run_id, 'real-product')
  if ($eventsText -match 'attempt_succeeded|attempt_failed') {
    throw 'DHR72 checkpoint proof must not submit a Receipt Result'
  }
  Write-Json (Join-Path $evidenceDir 'status.json') $status
  # The fixture is wiped in `finally`, so a succeeded run leaves no store behind unless it is copied here.
  # The CLI projections above are the acceptance evidence; this snapshot lets a reviewer re-derive
  # the observed checkpoint from the ledger instead of trusting the projection.
  $checkpointRunDir = Join-Path $evidenceDir 'checkpoint-run'
  $checkpointRunSource = Join-Path $temporaryRoot ".dh-relay/$($start.run_id)"
  if (Test-Path -LiteralPath $checkpointRunSource) {
    if (Test-Path -LiteralPath $checkpointRunDir) { Remove-Item -LiteralPath $checkpointRunDir -Recurse -Force }
    Copy-Item -LiteralPath $checkpointRunSource -Destination $checkpointRunDir -Recurse -Force
  }
  [IO.File]::WriteAllText((Join-Path $evidenceDir 'events.json'), $eventsText, [Text.UTF8Encoding]::new($false))
  [IO.File]::WriteAllText((Join-Path $evidenceDir 'inspect.json'), $inspectText, [Text.UTF8Encoding]::new($false))
  [IO.File]::WriteAllText((Join-Path $evidenceDir 'focus.json'), $focusText, [Text.UTF8Encoding]::new($false))
  Write-Json (Join-Path $evidenceDir 'summary.json') ([ordered]@{
    profile_id = $ProfileId
    run_id = $start.run_id
    receipt = $start
    agent_name = $agent.name
    pane_id = $paneId
    elapsed_ms = [int]((Get-Date) - $startedAt).TotalMilliseconds
    run_status = $status.status.ledger.run_status
    checkpoint_count = $checkpointCount
  })
} catch {
  Write-Json (Join-Path $evidenceDir 'failure.json') ([ordered]@{
    profile_id = $ProfileId; stage = $stage; failure_type = $_.Exception.GetType().FullName
    failed_at = (Get-Date).ToUniversalTime().ToString('o')
  })
  # The stale copy of an earlier failure must never be mistaken for this one, so the destination is
  # replaced rather than merged, and the host view is captured while it is still observable.
  $failedRunDir = Join-Path $evidenceDir 'failed-run'
  if ($null -ne $start -and (Test-Path -LiteralPath (Join-Path $temporaryRoot ".dh-relay/$($start.run_id)"))) {
    if (Test-Path -LiteralPath $failedRunDir) { Remove-Item -LiteralPath $failedRunDir -Recurse -Force }
    Copy-Item -LiteralPath (Join-Path $temporaryRoot ".dh-relay/$($start.run_id)") -Destination $failedRunDir -Recurse -Force
  }
  $hostView = [ordered]@{
    captured_at = (Get-Date).ToUniversalTime().ToString('o')
    expected_agent_name = if ($null -ne $agent) { Get-HerdrField $agent 'name' } else { $null }
    expected_pane_id = $paneId
    agents_in_fixture = @()
    pane_still_present = $false
  }
  try {
    $liveAgents = ((& $herdrBin agent list) | ConvertFrom-Json).result.agents
    $hostView.agents_in_fixture = @($liveAgents |
      Where-Object { (Get-HerdrField $_ 'cwd') -eq $temporaryRoot } |
      ForEach-Object { [ordered]@{ name = Get-HerdrField $_ 'name'; kind = Get-HerdrField $_ 'agent'
                                   status = Get-HerdrField $_ 'agent_status'; pane_id = Get-HerdrField $_ 'pane_id' } })
    if ($null -ne $paneId) {
      & $herdrBin pane get $paneId | Out-Null
      $hostView.pane_still_present = ($LASTEXITCODE -eq 0)
    }
  } catch { }
  Write-Json (Join-Path $evidenceDir 'host-view-at-failure.json') $hostView
  throw "DHR72 runner failed at $stage."
} finally {
  try {
    if ($null -ne $paneId) { & $herdrBin pane close $paneId | Out-Null }
  } finally {
    try {
      Stop-Dhr72Service $temporaryRoot
    } finally {
      try {
        # The fixture directory itself survives so its product trust decision stays valid; only run data goes.
        Clear-Dhr72FixtureContent $temporaryRoot
      } finally {
        Restore-Dhr72Environment
      }
    }
  }
}
