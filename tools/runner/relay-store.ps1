. (Join-Path $PSScriptRoot '../contracts/relay-schema.ps1')
. (Join-Path $PSScriptRoot '../contracts/relay-identity.ps1')

function Get-RelayRunPaths([string]$Root, [string]$RunId) {
  $runRoot = [IO.Path]::GetFullPath((Join-Path $Root $RunId))
  @{
    root = $runRoot
    plans = Join-Path $runRoot 'plans'
    launches = Join-Path $runRoot 'launches'
    attempts = Join-Path $runRoot 'attempts'
    events = Join-Path $runRoot 'events.jsonl'
    state = Join-Path $runRoot 'relay-state.json'
    active_plan = Join-Path $runRoot 'active-plan.json'
    authority = Join-Path $runRoot 'authority.json'
  }
}

function ConvertTo-RelayJson([hashtable]$Value) {
  $Value | ConvertTo-Json -Depth 100 -Compress
}

function Write-RelayJsonAtomic([string]$Path, [hashtable]$Value) {
  $parent = Split-Path -Parent $Path
  if (-not (Test-Path -LiteralPath $parent)) { [void](New-Item -ItemType Directory -Path $parent -Force) }
  $tmp = "$Path.tmp"
  [IO.File]::WriteAllText($tmp, (ConvertTo-RelayJson $Value), [Text.UTF8Encoding]::new($false))
  for ($attempt = 1; $attempt -le 10; $attempt++) {
    try {
      [IO.File]::Move($tmp, $Path, $true)
      break
    } catch {
      if ($attempt -eq 10) { throw }
      [Threading.Thread]::Sleep(10)
    }
  }
  @{ ok = $true }
}

function Write-RelayJsonCreateNew([string]$Path, [hashtable]$Value) {
  $parent = Split-Path -Parent $Path
  if (-not (Test-Path -LiteralPath $parent)) { [void](New-Item -ItemType Directory -Path $parent -Force) }
  $tmp = "$Path.tmp-$([Guid]::NewGuid().ToString('N'))"
  [IO.File]::WriteAllText($tmp, (ConvertTo-RelayJson $Value), [Text.UTF8Encoding]::new($false))
  try {
    [IO.File]::Move($tmp, $Path)
    return @{ ok = $true }
  } catch [IO.IOException] {
    if (Test-Path -LiteralPath $tmp) { Remove-Item -LiteralPath $tmp -Force }
    return @{ ok = $false; reason = 'file-exists' }
  }
}

function Read-RelayJson([string]$Path) {
  $value = Get-Content -LiteralPath $Path -Raw -ErrorAction Stop | ConvertFrom-Json -AsHashtable -DateKind String -ErrorAction Stop
  if ($value -isnot [hashtable]) { throw 'json-not-object' }
  $value
}

function Add-RelayEvent([hashtable]$Run, [string]$Kind, [hashtable]$Identity, [string]$Reason = '', [hashtable]$Extra = $null) {
  $event = New-RelayEvent $Kind $Identity $Reason
  $count = if (Test-Path -LiteralPath $Run.paths.events) { @(Get-Content -LiteralPath $Run.paths.events | Where-Object { $_.Length -gt 0 }).Count } else { 0 }
  $event.event_id = "EV-$($Run.run_id)-$('{0:d6}' -f ($count + 1))"
  $event.occurred_at = (& $Run.clock).ToString('o')
  if ($null -ne $Extra) {
    foreach ($key in $Extra.Keys) {
      if ($key -cnotin @('probe_error','consecutive_probe_failures','terminal_state')) { throw "event-extra-not-allowed:$key" }
      $event[$key] = $Extra[$key]
    }
  }
  $check = Test-RelayEvent $event
  if (-not $check.ok) { throw "event-invalid:$($check.reason)" }
  [IO.File]::AppendAllText($Run.paths.events, "$(ConvertTo-RelayJson $event)`n", [Text.UTF8Encoding]::new($false))
  $event
}

function Read-RelayEvents([hashtable]$Run) {
  if (-not (Test-Path -LiteralPath $Run.paths.events)) { return @() }
  $events = @(Get-Content -LiteralPath $Run.paths.events | Where-Object { $_.Length -gt 0 } | ForEach-Object { $_ | ConvertFrom-Json -AsHashtable -DateKind String })
  return $events
}

function New-RelayStateSnapshot([string]$RunId) {
  @{
    schema_version = 'relay/v1'
    run_id = $RunId
    plan_version = 0
    plan_hash = ''
    authority_generation = 0
    replan_required = $false
    launch_seq = 0
    nodes = @{}
  }
}

function Test-RelayStateSnapshot([hashtable]$State) {
  $topFields = @('schema_version','run_id','plan_version','plan_hash','authority_generation','replan_required','launch_seq','nodes')
  $nodeFields = @('attempt_id','launch_id','session_id','terminal_state','result_status','final_committed','task_state','scheduling','frozen_by','next_action','last_progress_at','consecutive_probe_failures','launch_deadline_at','pause_reason')
  foreach ($key in $State.Keys) { if ($key -cnotin $topFields) { return @{ ok = $false; reason = "unknown-field:$key" } } }
  foreach ($key in $topFields) { if (-not $State.ContainsKey($key)) { return @{ ok = $false; reason = "missing-field:$key" } } }
  if ($State.schema_version -cne 'relay/v1') { return @{ ok = $false; reason = 'bad-value:schema_version' } }
  if ($State.nodes -isnot [hashtable]) { return @{ ok = $false; reason = 'bad-type:nodes' } }
  foreach ($node in $State.nodes.Values) {
    foreach ($key in $node.Keys) { if ($key -cnotin $nodeFields) { return @{ ok = $false; reason = "unknown-field:$key" } } }
    foreach ($key in $nodeFields) { if (-not $node.ContainsKey($key)) { return @{ ok = $false; reason = "missing-field:$key" } } }
    if ($node.task_state -cnotin @('active','paused')) { return @{ ok = $false; reason = 'unknown-enum:task_state' } }
    if ($node.scheduling -cnotin @('waiting','launched','succeeded','blocked','paused')) { return @{ ok = $false; reason = 'unknown-enum:scheduling' } }
  }
  @{ ok = $true }
}

function Save-RelayState([hashtable]$Run) {
  $check = Test-RelayStateSnapshot $Run.state
  if (-not $check.ok) { throw "state-invalid:$($check.reason)" }
  Write-RelayJsonAtomic $Run.paths.state $Run.state
}

function Read-RelayState([hashtable]$Run) { Read-RelayJson $Run.paths.state }
function Read-RelayActivePlan([hashtable]$Run) { if (Test-Path -LiteralPath $Run.paths.active_plan) { Read-RelayJson $Run.paths.active_plan } else { $null } }
function Read-RelayAuthority([hashtable]$Run) { if (Test-Path -LiteralPath $Run.paths.authority) { Read-RelayJson $Run.paths.authority } else { $null } }
function Read-RelayActivePlanBody([hashtable]$Run) {
  $active = Read-RelayActivePlan $Run
  if ($null -eq $active) { return $null }
  $body = Read-RelayJson (Join-Path $Run.paths.plans "relay-plan.v$($active.plan_version).proposal.json")
  if ((Get-RelayPlanHash $body) -cne $active.plan_hash) { throw 'active-plan-hash-drift' }
  $body
}
