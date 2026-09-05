[CmdletBinding()]
param(
  [Parameter(Mandatory = $true)]
  [ValidateNotNullOrEmpty()]
  [string]$EvidenceRoot,

  # DHR72's trusted, per-profile fixture is deliberately reused by name.  It
  # must already exist and be empty; this runner never clears an occupied root.
  [string]$FixtureRoot = (Join-Path ([IO.Path]::GetTempPath()) 'DHR72-fixture-herdr-codex-main')
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

# These are deliberately constants.  The F proof has one bounded observation
# window; callers cannot silently turn it into an unbounded product run.
$totalTimeoutSeconds = 150
$nativeCallTimeoutSeconds = 75
$herdrCallTimeoutSeconds = 10
$cleanupTimeoutSeconds = 10
$profileId = 'herdr.codex.main'
$environmentNames = @(
  'DH_RELAY_CREDENTIAL_ROOT',
  'DH_RELAY_INDEX_PATH',
  'DH_RELAY_HERDR_BIN',
  'DH_RELAY_HERDR_ARGS'
)

function Get-ComparablePath([string]$Path) {
  if ([string]::IsNullOrWhiteSpace($Path)) { return '' }
  try {
    return [IO.Path]::GetFullPath($Path).TrimEnd('\').ToLowerInvariant()
  } catch {
    return ''
  }
}

function Test-ExactPathUnderRoot([string]$Path, [string]$Root) {
  $candidate = Get-ComparablePath $Path
  $rootComparable = Get-ComparablePath $Root
  if ([string]::IsNullOrWhiteSpace($candidate) -or [string]::IsNullOrWhiteSpace($rootComparable)) { return $false }
  return $candidate.StartsWith("$rootComparable\", [StringComparison]::OrdinalIgnoreCase)
}

function Test-DirectChildOfRoot([string]$Path, [string]$Root) {
  if (-not (Test-ExactPathUnderRoot $Path $Root)) { return $false }
  $candidate = [IO.Path]::GetFullPath($Path).TrimEnd('\')
  $parent = [IO.Path]::GetFullPath([IO.Path]::GetDirectoryName($candidate)).TrimEnd('\')
  $rootComparable = [IO.Path]::GetFullPath($Root).TrimEnd('\')
  return $parent.Equals($rootComparable, [StringComparison]::OrdinalIgnoreCase)
}

function Get-OptionalProperty($Value, [string]$Name) {
  if ($null -eq $Value) { return $null }
  if ($Value -is [Collections.IDictionary]) { return $Value[$Name] }
  if ($Value -is [Collections.IDictionary] -and $Value.Contains($Name)) { return $Value[$Name] }
  $property = $Value.PSObject.Properties[$Name]
  if ($null -eq $property) { return $null }
  return $property.Value
}

function Write-JsonFile([string]$Path, $Value) {
  $json = $Value | ConvertTo-Json -Depth 20
  [IO.File]::WriteAllText($Path, $json, [Text.UTF8Encoding]::new($false))
}

function Invoke-BoundedProcess {
  [CmdletBinding()]
  param(
    [Parameter(Mandatory = $true)] [string]$FilePath,
    [Parameter(Mandatory = $true)] [string[]]$Arguments,
    [Parameter(Mandatory = $true)] [int]$TimeoutSeconds,
    [Parameter(Mandatory = $true)] [string]$WorkingDirectory,
    [switch]$ParseJson,
    [switch]$ReadSha
  )

  $process = $null
  $stdoutTask = $null
  $stderrTask = $null
  $stdoutText = ''
  $timedOut = $false
  $exitCode = $null
  $parsed = $null
  $started = $false
  $startInfo = [Diagnostics.ProcessStartInfo]::new()
    $startInfo.FileName = $FilePath
    $startInfo.UseShellExecute = $false
    $startInfo.CreateNoWindow = $true
    $startInfo.WindowStyle = [Diagnostics.ProcessWindowStyle]::Hidden
    $startInfo.RedirectStandardOutput = $true
    $startInfo.RedirectStandardError = $true
    foreach ($argument in $Arguments) { [void]$startInfo.ArgumentList.Add([string]$argument) }
    $process = [Diagnostics.Process]::new()
    $process.StartInfo = $startInfo
    try {
      if (-not [string]::IsNullOrWhiteSpace($WorkingDirectory)) { $startInfo.WorkingDirectory = $WorkingDirectory }
      [void]$process.Start()
      $started = $true
    } catch {
      return [pscustomobject]@{
        ok = $false; reason = 'spawn'; timed_out = $false; exit_code = $null; value = $null
      }
    }
    # Read both streams concurrently in memory.  They are never written to an
    # artifact, and only stdout is parsed when a JSON response is required.
    $stdoutTask = $process.StandardOutput.ReadToEndAsync()
    $stderrTask = $process.StandardError.ReadToEndAsync()

    $deadline = [DateTime]::UtcNow.AddSeconds($TimeoutSeconds)
    while (-not $process.HasExited -and [DateTime]::UtcNow -lt $deadline) {
      Start-Sleep -Milliseconds 50
    }
    if (-not $process.HasExited) {
      $timedOut = $true
      try { $process.Kill($true) } catch {
        try { Stop-Process -Id $process.Id -Force -ErrorAction SilentlyContinue } catch { }
      }
      try { $process.WaitForExit(1000) } catch { }
    }
    if ($process.HasExited) { $exitCode = $process.ExitCode }

    # Process exit closes both redirected pipes.  A timed-out child that did
    # not close promptly is bounded here; its output is intentionally dropped.
    if ($null -ne $stdoutTask) {
      if ($stdoutTask.Wait(1000)) { $stdoutText = [string]$stdoutTask.Result }
    }
    if ($null -ne $stderrTask) { [void]$stderrTask.Wait(1000) }

    if ($ParseJson -and -not $timedOut -and $exitCode -eq 0) {
      try {
        if (-not [string]::IsNullOrWhiteSpace($stdoutText)) { $parsed = $stdoutText | ConvertFrom-Json -DateKind String }
      } catch {
        return [pscustomobject]@{
          ok = $false; reason = 'json'; timed_out = $false; exit_code = $exitCode; value = $null
        }
      }
      if ($null -eq $parsed) {
        return [pscustomobject]@{
          ok = $false; reason = 'json'; timed_out = $false; exit_code = $exitCode; value = $null
        }
      }
    }
  return [pscustomobject]@{
    ok = ($started -and -not $timedOut -and $exitCode -eq 0)
    reason = if ($timedOut) { 'timeout' } elseif ($exitCode -ne 0) { 'exit' } else { $null }
    timed_out = $timedOut
    exit_code = $exitCode
    value = $parsed
    sha = if ($ReadSha -and $stdoutText.Trim() -match '^[0-9a-f]{40}$') { $stdoutText.Trim() } else { $null }
  }
}

function Get-HerdrAgents([string]$HerdrBin, [string]$WorkingDirectory) {
  $result = Invoke-BoundedProcess -FilePath $HerdrBin -Arguments @('agent', 'list') `
    -TimeoutSeconds $herdrCallTimeoutSeconds -WorkingDirectory $WorkingDirectory -ParseJson
  if (-not $result.ok) {
    return [pscustomobject]@{ ok = $false; agents = @(); reason = $result.reason }
  }
  $envelopeResult = Get-OptionalProperty $result.value 'result'
  $agents = Get-OptionalProperty $envelopeResult 'agents'
  if ($null -eq $agents) { return [pscustomobject]@{ ok = $false; agents = @(); reason = 'shape' } }
  return [pscustomobject]@{ ok = $true; agents = @($agents); reason = $null }
}

function Get-RootProcessRows([string]$Root) {
  try {
    $rows = @(Get-CimInstance Win32_Process)
  } catch {
    throw 'process-scan-failed'
  }
  $rootText = [IO.Path]::GetFullPath($Root).TrimEnd('\')
  return @($rows | Where-Object {
    if ([int](Get-OptionalProperty $_ 'ProcessId') -eq $PID) { return $false }
    $commandLine = [string](Get-OptionalProperty $_ 'CommandLine')
    return -not [string]::IsNullOrWhiteSpace($commandLine) -and
      $commandLine.IndexOf($rootText, [StringComparison]::OrdinalIgnoreCase) -ge 0
  })
}

function Get-RootServiceRows([string]$Root) {
  $rootText = [IO.Path]::GetFullPath($Root).TrimEnd('\')
  return @(Get-RootProcessRows $Root | Where-Object {
    ([string](Get-OptionalProperty $_ 'Name')).Equals('node.exe', [StringComparison]::OrdinalIgnoreCase) -and
      ([string](Get-OptionalProperty $_ 'CommandLine')).IndexOf('service-main.mjs', [StringComparison]::OrdinalIgnoreCase) -ge 0 -and
      ([string](Get-OptionalProperty $_ 'CommandLine')).IndexOf($rootText, [StringComparison]::OrdinalIgnoreCase) -ge 0
  })
}

function Get-RootRunDirectories([string]$Root) {
  $relayRoot = Join-Path $Root '.dh-relay'
  if (-not (Test-Path -LiteralPath $relayRoot -PathType Container)) { return @() }
  return @(Get-ChildItem -LiteralPath $relayRoot -Force -Directory |
    Where-Object { Test-Path -LiteralPath (Join-Path $_.FullName 'run.json') -PathType Leaf } | Sort-Object Name)
}

function Read-EventProjection([string]$EventsPath) {
  if (-not (Test-Path -LiteralPath $EventsPath -PathType Leaf)) { return @() }
  try { $lines = [IO.File]::ReadAllLines($EventsPath) } catch { return @() }
  $projected = [Collections.Generic.List[object]]::new()
  foreach ($line in $lines) {
    if ([string]::IsNullOrWhiteSpace($line)) { continue }
    try { $event = $line | ConvertFrom-Json -DateKind String } catch { continue }
    $seq = Get-OptionalProperty $event 'seq'
    $kind = Get-OptionalProperty $event 'kind'
    $at = Get-OptionalProperty $event 'at'
    # This is the complete evidence event allow-list.  In particular, detail,
    # node/attempt/executor fields, and the event run_id never leave memory.
    if ($null -eq $seq -or $kind -isnot [string] -or $at -isnot [string]) { continue }
    try { $seqInt = [int]$seq } catch { continue }
    $projected.Add([ordered]@{ seq = $seqInt; kind = [string]$kind; at = [string]$at })
  }
  return $projected.ToArray()
}

function Read-LeaseProjection([string]$RunRoot, [DateTimeOffset]$SampledAt) {
  $leasePath = Join-Path $RunRoot 'host-lease.json'
  if (-not (Test-Path -LiteralPath $leasePath -PathType Leaf)) { return $null }
  try {
    $lease = ([IO.File]::ReadAllText($leasePath) | ConvertFrom-Json -DateKind String)
    $epoch = Get-OptionalProperty $lease 'epoch'
    $expiresAt = Get-OptionalProperty $lease 'expires_at'
    $expiresEpoch = Get-OptionalProperty $lease 'expires_at_epoch_ms'
    $acquiredAt = Get-OptionalProperty $lease 'acquired_at'
    if ($epoch -eq $null -or $expiresAt -isnot [string] -or $expiresEpoch -eq $null -or $acquiredAt -isnot [string]) { return $null }
    try {
      $epochInt = [int]$epoch
      $expiresEpochLong = [int64]$expiresEpoch
    } catch {
      return $null
    }
    $sampledEpoch = $SampledAt.ToUnixTimeMilliseconds()
    return [ordered]@{
      epoch = $epochInt
      acquired_at = [string]$acquiredAt
      expires_at = [string]$expiresAt
      expires_at_epoch_ms = $expiresEpochLong
      sampled_at = $SampledAt.UtcDateTime.ToString('o')
      sampled_at_epoch_ms = $sampledEpoch
      fresh_at_sample = ($sampledEpoch -lt $expiresEpochLong)
    }
  } catch {
    return $null
  }
}

function Select-LeaseSampleForEvent($Event, [Collections.Generic.List[object]]$LeaseTimeline) {
  $eventAt = $null
  try { $eventAt = ([DateTimeOffset]::Parse([string](Get-OptionalProperty $Event 'at'))).ToUnixTimeMilliseconds() } catch { return $null }
  $prior = @($LeaseTimeline | Where-Object {
    [int64](Get-OptionalProperty $_ 'sampled_at_epoch_ms') -le $eventAt -and
      [int64](Get-OptionalProperty $_ 'expires_at_epoch_ms') -gt $eventAt
  } | Sort-Object { $_.sampled_at_epoch_ms } | Select-Object -Last 1)
  if ($prior.Count -eq 1) { return [ordered]@{ lease = $prior[0]; proof = 'sample-before-event' } }

  # If the first lease sample raced the event, retain the bounded default TTL
  # derivation as an explicit, reviewable fallback.  It never treats a later
  # lease epoch as proof for an earlier attempt.
  $latest = @($LeaseTimeline | Sort-Object { $_.sampled_at_epoch_ms } | Select-Object -Last 1)
  if ($latest.Count -eq 1) {
    $lease = $latest[0]
    $expiry = [int64](Get-OptionalProperty $lease 'expires_at_epoch_ms')
    $acquiredAt = $null
    try { $acquiredAt = ([DateTimeOffset]::Parse([string](Get-OptionalProperty $lease 'acquired_at'))).ToUnixTimeMilliseconds() } catch { }
    if ($null -ne $acquiredAt -and $acquiredAt -le $eventAt -and $eventAt -ge ($expiry - 15000) -and $eventAt -lt $expiry) {
      return [ordered]@{ lease = $lease; proof = 'default-ttl-window-derived' }
    }
  }
  return $null
}

function New-EventLeaseSample($Event, $LeaseSelection) {
  $lease = $null
  $proof = 'no-lease-sample'
  if ($null -ne $LeaseSelection) {
    $source = Get-OptionalProperty $LeaseSelection 'lease'
    $proofValue = Get-OptionalProperty $LeaseSelection 'proof'
    if ($null -ne $source) {
      $lease = [ordered]@{
        epoch = [int](Get-OptionalProperty $source 'epoch')
        acquired_at = [string](Get-OptionalProperty $source 'acquired_at')
        expires_at = [string](Get-OptionalProperty $source 'expires_at')
        expires_at_epoch_ms = [int64](Get-OptionalProperty $source 'expires_at_epoch_ms')
        sampled_at = [string](Get-OptionalProperty $source 'sampled_at')
        sampled_at_epoch_ms = [int64](Get-OptionalProperty $source 'sampled_at_epoch_ms')
        fresh_at_sample = [bool](Get-OptionalProperty $source 'fresh_at_sample')
      }
      $proof = if ([string]::IsNullOrWhiteSpace([string]$proofValue)) { 'lease-sample' } else { [string]$proofValue }
      $eventAt = $null
      try { $eventAt = ([DateTimeOffset]::Parse([string](Get-OptionalProperty $Event 'at'))).ToUnixTimeMilliseconds() } catch { }
      if ($null -ne $eventAt) {
        $lease['fresh_at_event'] = $eventAt -lt [int64]$lease.expires_at_epoch_ms
      } else {
        $lease['fresh_at_event'] = $false
      }
      $lease['proof'] = $proof
    }
  }
  return [ordered]@{
    event = [ordered]@{ seq = [int](Get-OptionalProperty $Event 'seq'); kind = [string](Get-OptionalProperty $Event 'kind'); at = [string](Get-OptionalProperty $Event 'at') }
    lease = $lease
  }
}

function Set-ProcessEnvironment([hashtable]$Prior, [string]$CredentialRoot, [string]$IndexPath, [string]$HerdrBin) {
  foreach ($name in $environmentNames) { $Prior[$name] = [Environment]::GetEnvironmentVariable($name, 'Process') }
  [Environment]::SetEnvironmentVariable('DH_RELAY_CREDENTIAL_ROOT', $CredentialRoot, 'Process')
  [Environment]::SetEnvironmentVariable('DH_RELAY_INDEX_PATH', $IndexPath, 'Process')
  [Environment]::SetEnvironmentVariable('DH_RELAY_HERDR_BIN', $HerdrBin, 'Process')
  [Environment]::SetEnvironmentVariable('DH_RELAY_HERDR_ARGS', '[]', 'Process')
}

function Restore-ProcessEnvironment([hashtable]$Prior) {
  foreach ($name in $environmentNames) {
    [Environment]::SetEnvironmentVariable($name, $Prior[$name], 'Process')
  }
}

function Refresh-OwnedPanes([string]$HerdrBin, [string]$WorkingDirectory, [string]$Root, [Collections.Generic.HashSet[string]]$BaselinePaneIds, [Collections.Generic.HashSet[string]]$OwnedPaneIds) {
  $listed = Get-HerdrAgents $HerdrBin $WorkingDirectory
  if (-not $listed.ok) { return }
  $rootComparable = Get-ComparablePath $Root
  foreach ($agent in $listed.agents) {
    $cwd = Get-ComparablePath ([string](Get-OptionalProperty $agent 'cwd'))
    $paneIdValue = Get-OptionalProperty $agent 'pane_id'
    if ([string]::IsNullOrWhiteSpace([string]$paneIdValue)) { continue }
    $paneId = [string]$paneIdValue
    if ($cwd -eq $rootComparable -and -not $BaselinePaneIds.Contains($paneId)) { [void]$OwnedPaneIds.Add($paneId) }
  }
}

function Stop-OwnedPanes([string]$HerdrBin, [string]$WorkingDirectory, [string]$Root, [Collections.Generic.HashSet[string]]$OwnedPaneIds) {
  $outcomes = [Collections.Generic.List[object]]::new()
  $listed = Get-HerdrAgents $HerdrBin $WorkingDirectory
  if ($listed.ok) {
    $rootComparable = Get-ComparablePath $Root
    foreach ($agent in $listed.agents) {
      $paneIdValue = Get-OptionalProperty $agent 'pane_id'
      $paneId = [string]$paneIdValue
      if (-not $OwnedPaneIds.Contains($paneId)) { continue }
      if ((Get-ComparablePath ([string](Get-OptionalProperty $agent 'cwd'))) -ne $rootComparable) { continue }
      $result = Invoke-BoundedProcess -FilePath $HerdrBin -Arguments @('pane', 'close', $paneId) `
        -TimeoutSeconds $herdrCallTimeoutSeconds -WorkingDirectory $WorkingDirectory
      $outcomes.Add([ordered]@{ ok = $result.ok; exit_code = $result.exit_code; timed_out = $result.timed_out })
    }
  }
  return $outcomes.ToArray()
}

function Stop-OwnedServices([string]$Root, [Collections.Generic.HashSet[int]]$OwnedServicePids) {
  $deadline = [DateTime]::UtcNow.AddSeconds($cleanupTimeoutSeconds)
  while ([DateTime]::UtcNow -lt $deadline) {
    $liveRows = @(Get-RootServiceRows $Root | Where-Object { $OwnedServicePids.Contains([int]$_.ProcessId) })
    if ($liveRows.Count -eq 0) { break }
    foreach ($row in $liveRows) {
      try { Stop-Process -Id ([int]$row.ProcessId) -Force -ErrorAction SilentlyContinue } catch { }
    }
    Start-Sleep -Milliseconds 100
  }
  $remaining = @(Get-RootServiceRows $Root | Where-Object { $OwnedServicePids.Contains([int]$_.ProcessId) })
  return [ordered]@{ owned_count = $OwnedServicePids.Count; remaining_count = $remaining.Count }
}

$fixtureRoot = [IO.Path]::GetFullPath($FixtureRoot)
$evidenceBase = [IO.Path]::GetFullPath($EvidenceRoot)
$evidenceDir = $null
$fixtureClaimed = $false
$environmentPrior = @{}
$environmentIsolated = $false
$herdrBin = $null
$nodeBin = $null
$gitBin = $null
$herdrEnvOk = $null
$dshOff = $null
$ownedPaneIds = [Collections.Generic.HashSet[string]]::new([StringComparer]::OrdinalIgnoreCase)
$ownedServicePids = [Collections.Generic.HashSet[int]]::new()
$baselinePaneIds = [Collections.Generic.HashSet[string]]::new([StringComparer]::OrdinalIgnoreCase)
$eventProjectionBySeq = @{}
$leaseTimeline = [Collections.Generic.List[object]]::new()
$leaseSamples = [Collections.Generic.List[object]]::new()
$attemptSample = $null
$observationSample = $null
$runRoot = $null
$failureStage = $null
$failureType = $null
$failureLine = $null
$stopReason = 'timeout-or-failure'
$startResult = [ordered]@{ exit_code = $null; timed_out = $false; reason = $null }
$cleanupResult = [ordered]@{
  pane_close = @(); service_owned_count = 0; service_remaining_count = 0; fixture_empty = $false; performed = $false
}
$verdict = $false
$registryProjection = $null
$registryPath = Join-Path $env:USERPROFILE '.dh-relay/executor-profiles.json'
$candidate = $null

try {
  $failureStage = 'evidence-root'
  if ($evidenceBase.Equals($fixtureRoot, [StringComparison]::OrdinalIgnoreCase) -or (Test-ExactPathUnderRoot $evidenceBase $fixtureRoot)) {
    throw 'evidence-root-under-fixture'
  }
  New-Item -ItemType Directory -Path $evidenceBase -Force | Out-Null
  $evidenceDir = Join-Path $evidenceBase ("DHR76-F-" + (Get-Date).ToUniversalTime().ToString('yyyyMMddTHHmmssfffZ') + '-' + [Guid]::NewGuid().ToString('N').Substring(0, 8))
  New-Item -ItemType Directory -Path $evidenceDir -Force | Out-Null

  $failureStage = 'preflight'
  if (-not (Test-Path -LiteralPath $fixtureRoot -PathType Container)) { throw 'fixture-root-missing' }
  if (@(Get-ChildItem -LiteralPath $fixtureRoot -Force).Count -ne 0) { throw 'fixture-root-not-empty' }
  if (@(Get-RootProcessRows $fixtureRoot).Count -ne 0) { throw 'fixture-root-process-active' }
  $dshOff = @((Get-Process -Name dsh -ErrorAction SilentlyContinue)).Count -eq 0
  if (-not $dshOff) { throw 'dsh-must-be-off' }
  $herdrEnvOk = $env:HERDR_ENV -eq '1'
  if (-not $herdrEnvOk) { throw 'herdr-env-required' }

  $herdrCommand = Get-Command herdr -CommandType Application -ErrorAction Stop | Select-Object -First 1
  $herdrBin = [string]$herdrCommand.Source
  $nodeCommand = Get-Command node -CommandType Application -ErrorAction Stop | Select-Object -First 1
  $nodeBin = [string]$nodeCommand.Source
  $gitCommand = Get-Command git -CommandType Application -ErrorAction Stop | Select-Object -First 1
  $gitBin = [string]$gitCommand.Source
  $sourceRoot = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../../../../../..'))
  $head = Invoke-BoundedProcess -FilePath $gitBin -Arguments @('rev-parse', 'HEAD') -TimeoutSeconds 10 -WorkingDirectory $sourceRoot -ReadSha
  if (-not $head.ok -or [string]::IsNullOrWhiteSpace($head.sha)) { throw 'candidate-unresolved' }
  $candidate = $head.sha
  $registryBytes = [IO.File]::ReadAllBytes($registryPath)
  $registryObject = [Text.Encoding]::UTF8.GetString($registryBytes) | ConvertFrom-Json -DateKind String
  $registryIds = @($registryObject.profiles | ForEach-Object { [string]$_.executor_profile_id } | Sort-Object)
  $expectedIds = @('herdr.claude.account5','herdr.claude.grok','herdr.claude.main','herdr.codex.main','herdr.codex.ninth')
  if ($registryIds.Count -ne 5 -or ($registryIds -join ',') -cne ($expectedIds -join ',')) { throw 'registry-not-complete' }
  $registryProjection = [ordered]@{
    profile_ids = $registryIds
    sha256_before = [Convert]::ToHexString([Security.Cryptography.SHA256]::HashData($registryBytes))
    sha256_after = $null
    unchanged = $false
  }
  if ([string]::IsNullOrWhiteSpace($herdrBin) -or [string]::IsNullOrWhiteSpace($nodeBin) -or [string]::IsNullOrWhiteSpace($gitBin)) { throw 'required-command-unresolved' }

  $baselineAgents = Get-HerdrAgents $herdrBin $fixtureRoot
  if (-not $baselineAgents.ok) { throw 'herdr-agent-list-preflight-failed' }
  foreach ($agent in $baselineAgents.agents) {
    $paneId = [string](Get-OptionalProperty $agent 'pane_id')
    if (-not [string]::IsNullOrWhiteSpace($paneId)) { [void]$baselinePaneIds.Add($paneId) }
    if ((Get-ComparablePath ([string](Get-OptionalProperty $agent 'cwd'))) -eq (Get-ComparablePath $fixtureRoot)) {
      throw 'fixture-root-pane-active'
    }
  }
  $fixtureClaimed = $true

  $failureStage = 'fixture-init'
  $gitignorePath = Join-Path $fixtureRoot '.gitignore'
  [IO.File]::WriteAllText($gitignorePath, "/.dh-relay/`n", [Text.UTF8Encoding]::new($false))
  $gitInit = Invoke-BoundedProcess -FilePath $gitBin -Arguments @('init', '-q') -TimeoutSeconds 10 -WorkingDirectory $fixtureRoot
  if (-not $gitInit.ok) { throw 'git-init-failed' }
  $runDocument = [ordered]@{
    protocol = 'relay.run/v2'
    run_id = 'R001-dhr76-real-f'
    workflow_name = 'relay/dhr76-real-f@1'
    summary = 'DHR76 real Windows Profile F boundary'
    trigger = 'system'
    created_at = [DateTimeOffset]::UtcNow.ToString('o')
    labels = @([ordered]@{ key = 'dhr76.f'; value = 'real-windows' })
    nodes = @([ordered]@{
      node_id = 'real-f'
      title = 'DHR76 real F boundary'
      role = 'executor'
      required = $true
      depends_on = @()
      executor_profiles = @([ordered]@{ kind = 'herdr-agent'; ref = $profileId })
    })
  }
  $runDocumentPath = Join-Path $fixtureRoot 'run.json'
  Write-JsonFile $runDocumentPath $runDocument

  $privateRoot = Join-Path $fixtureRoot '.dhr76-private'
  $credentialRoot = Join-Path $privateRoot 'credentials'
  $indexPath = Join-Path $privateRoot 'runtime/runs.json'
  $failureStage = 'environment-isolation'
  Set-ProcessEnvironment $environmentPrior $credentialRoot $indexPath $herdrBin
  $environmentIsolated = $true

  $runDeadline = [DateTime]::UtcNow.AddSeconds($totalTimeoutSeconds)
  $failureStage = 'relay-start'
  $cliPath = Join-Path $PSScriptRoot '../../../../../../relay-core/cli/main.mjs'
  $cliPath = [IO.Path]::GetFullPath($cliPath)
  if (-not (Test-Path -LiteralPath $cliPath -PathType Leaf)) { throw 'relay-cli-missing' }
  $start = Invoke-BoundedProcess -FilePath $nodeBin -Arguments @($cliPath, 'start', '--run', $runDocumentPath, '--root', $fixtureRoot, '--json') `
    -TimeoutSeconds $nativeCallTimeoutSeconds -WorkingDirectory $fixtureRoot
  $startResult.exit_code = $start.exit_code
  $startResult.timed_out = $start.timed_out
  $startResult.reason = $start.reason

  $failureStage = 'real-observation'
  while ([DateTime]::UtcNow -lt $runDeadline) {
    Refresh-OwnedPanes $herdrBin $fixtureRoot $fixtureRoot $baselinePaneIds $ownedPaneIds
    $runDirectories = @(Get-RootRunDirectories $fixtureRoot)
    if ($runDirectories.Count -gt 1) { throw 'multiple-run-roots' }
    if ($runDirectories.Count -eq 1) {
      $runRoot = [IO.Path]::GetFullPath($runDirectories[0].FullName)
      $loopLease = Read-LeaseProjection $runRoot ([DateTimeOffset]::UtcNow)
      if ($null -ne $loopLease) { $leaseTimeline.Add($loopLease) }
      $eventsPath = Join-Path $runRoot 'events.jsonl'
      foreach ($event in (Read-EventProjection $eventsPath)) {
        $seqKey = [string]$event.seq
        $eventProjectionBySeq[$seqKey] = $event
      }
      $events = @($eventProjectionBySeq.Values | Sort-Object { $_.seq })
      if ($null -eq $attemptSample) {
        $attemptEvent = @($events | Where-Object { $_.kind -eq 'attempt_started' } | Select-Object -First 1)
        if ($attemptEvent.Count -eq 1) {
          $attemptSample = New-EventLeaseSample $attemptEvent[0] (Select-LeaseSampleForEvent $attemptEvent[0] $leaseTimeline)
          $leaseSamples.Add($attemptSample)
        }
      }
      if ($null -ne $attemptSample -and $null -eq $observationSample) {
        $attemptSeq = [int]$attemptSample.event.seq
        $observationEvent = @($events | Where-Object { $_.kind -eq 'host_observation_changed' -and [int]$_.seq -gt $attemptSeq } | Select-Object -First 1)
        if ($observationEvent.Count -eq 1) {
          $observationLease = Read-LeaseProjection $runRoot ([DateTimeOffset]::UtcNow)
          $observationSample = New-EventLeaseSample $observationEvent[0] `
            ([ordered]@{ lease = $observationLease; proof = 'observation-sample' })
          $leaseSamples.Add($observationSample)
          $stopReason = 'host_observation_changed'
          # F ends at the first real host observation.  Do not prompt, poll for
          # checkpoint/Result, or infer completion from any later artifact.
          break
        }
      }
    }
    Start-Sleep -Milliseconds 100
  }

  $attemptFresh = $null -ne $attemptSample -and $null -ne $attemptSample.lease -and [bool]$attemptSample.lease.fresh_at_event
  $observationAfterAttempt = $null -ne $observationSample -and [int]$observationSample.event.seq -gt [int]$attemptSample.event.seq
  $cliSucceeded = $startResult.exit_code -eq 0 -and -not $startResult.timed_out
  $verdict = $cliSucceeded -and $attemptFresh -and $observationAfterAttempt
  if (-not $verdict) { throw 'real-f-acceptance-not-met' }
} catch {
  $failureType = $_.Exception.GetType().FullName
  $failureLine = $_.InvocationInfo.ScriptLineNumber
  if ([string]::IsNullOrWhiteSpace($failureStage)) { $failureStage = 'unknown' }
  $verdict = $false
} finally {
  if ($fixtureClaimed) {
    $cleanupResult.performed = $true
    try {
      Refresh-OwnedPanes $herdrBin $fixtureRoot $fixtureRoot $baselinePaneIds $ownedPaneIds
      $cleanupResult.pane_close = @(Stop-OwnedPanes $herdrBin $fixtureRoot $fixtureRoot $ownedPaneIds)
    } catch {
      $cleanupResult.pane_close = @([ordered]@{ ok = $false; exit_code = $null; timed_out = $false })
    }
    try {
      foreach ($row in @(Get-RootServiceRows $fixtureRoot)) { [void]$ownedServicePids.Add([int]$row.ProcessId) }
      $serviceStop = Stop-OwnedServices $fixtureRoot $ownedServicePids
      $cleanupResult.service_owned_count = $serviceStop.owned_count
      $cleanupResult.service_remaining_count = $serviceStop.remaining_count
    } catch {
      $cleanupResult.service_remaining_count = -1
    }
    $cleanupCanRemove = $true
    try {
      $finalAgents = Get-HerdrAgents $herdrBin $fixtureRoot
      if (-not $finalAgents.ok) { throw 'cleanup-herdr-list-failed' }
      $rootComparable = Get-ComparablePath $fixtureRoot
      if (@($finalAgents.agents | Where-Object {
        (Get-ComparablePath ([string](Get-OptionalProperty $_ 'cwd'))) -eq $rootComparable
      }).Count -ne 0) { throw 'cleanup-root-pane-remains' }
      if (@(Get-RootProcessRows $fixtureRoot).Count -ne 0) { throw 'cleanup-root-process-remains' }
    } catch {
      $cleanupCanRemove = $false
    }
    if ($cleanupCanRemove) {
      try {
        $children = @(Get-ChildItem -LiteralPath $fixtureRoot -Force)
        foreach ($child in $children) {
          if (-not (Test-DirectChildOfRoot $child.FullName $fixtureRoot)) { throw 'cleanup-path-outside-fixture' }
          if (($child.Attributes -band [IO.FileAttributes]::ReparsePoint) -ne 0) { throw 'cleanup-reparse-point' }
          Remove-Item -LiteralPath $child.FullName -Recurse -Force -ErrorAction Stop
        }
        $cleanupResult.fixture_empty = (@(Get-ChildItem -LiteralPath $fixtureRoot -Force).Count -eq 0)
      } catch {
        $cleanupResult.fixture_empty = $false
      }
    } else {
      $cleanupResult.fixture_empty = $false
    }
    $paneFailures = @($cleanupResult.pane_close | Where-Object { $_.ok -ne $true })
    if ($cleanupResult.service_remaining_count -ne 0 -or -not $cleanupResult.fixture_empty -or $paneFailures.Count -ne 0) {
      if ($verdict) { $failureStage = 'cleanup' }
      $verdict = $false
    }
  }
  if ($environmentIsolated) {
    try { Restore-ProcessEnvironment $environmentPrior } catch { }
  }
  if ($null -ne $evidenceDir) {
    try {
      if ($null -ne $registryProjection) {
        $registryProjection.sha256_after = (Get-FileHash -LiteralPath $registryPath -Algorithm SHA256).Hash
        $registryProjection.unchanged = $registryProjection.sha256_before -ceq $registryProjection.sha256_after
        if (-not $registryProjection.unchanged) { $verdict = $false; $failureStage = 'registry-changed' }
      }
      $timeline = [ordered]@{
        protocol = 'dhr76.real-f.timeline/v1'
        profile_id = $profileId
        events = @($eventProjectionBySeq.Values | Sort-Object { $_.seq })
        lease_samples = $leaseSamples.ToArray()
        lease_timeline = $leaseTimeline.ToArray()
      }
      Write-JsonFile (Join-Path $evidenceDir 'timeline.json') $timeline
      $attemptLeaseFresh = if ($null -ne $attemptSample -and $null -ne $attemptSample.lease) { [bool]$attemptSample.lease.fresh_at_sample } else { $false }
      $observationLeaseFresh = if ($null -ne $observationSample -and $null -ne $observationSample.lease) { [bool]$observationSample.lease.fresh_at_sample } else { $false }
      $summary = [ordered]@{
        protocol = 'dhr76.real-f/v1'
        candidate = $candidate
        profile_id = $profileId
        platform = 'win32'
        herdr_env_ok = $herdrEnvOk
        dsh_off = $dshOff
        registry = 'default-user-registry-read-only'
        registry_projection = $registryProjection
        start = $startResult
        observed = [ordered]@{
          attempt_started = if ($null -ne $attemptSample) { $attemptSample.event } else { $null }
          first_host_observation = if ($null -ne $observationSample) { $observationSample.event } else { $null }
          attempt_lease_fresh_at_event = $attemptLeaseFresh
          attempt_lease_sample_before_event = if ($null -ne $attemptSample -and $null -ne $attemptSample.lease) { $attemptSample.lease.proof -eq 'sample-before-event' } else { $false }
          attempt_lease_fresh_at_sample = if ($null -ne $attemptSample -and $null -ne $attemptSample.lease) { [bool]$attemptSample.lease.fresh_at_sample } else { $false }
          observation_lease_fresh_at_sample = $observationLeaseFresh
          observation_after_attempt = ($null -ne $observationSample -and $null -ne $attemptSample -and [int]$observationSample.event.seq -gt [int]$attemptSample.event.seq)
        }
        bounded = [ordered]@{ total_seconds = $totalTimeoutSeconds; start_call_seconds = $nativeCallTimeoutSeconds; herdr_call_seconds = $herdrCallTimeoutSeconds; cleanup_seconds = $cleanupTimeoutSeconds }
        stopped_after = $stopReason
        runner_sent_prompt = $false
        waited_for_checkpoint_or_result = $false
        cleanup = $cleanupResult
        verdict = $verdict
        failure_stage = if ($verdict) { $null } else { $failureStage }
        failure_type = $failureType
        failure_line = $failureLine
      }
      Write-JsonFile (Join-Path $evidenceDir 'summary.json') $summary
    } catch {
      # Evidence writing itself must never print or persist an exception that
      # could contain a path or provider output.
    }
  }
}

if (-not $verdict) {
  throw 'DHR76 real F did not meet the acceptance boundary.'
}
Write-Output ("DHR76 real F evidence written: " + $evidenceDir)
