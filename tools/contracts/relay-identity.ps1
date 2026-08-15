function New-RelayVerdict([string]$Verdict, [string]$Reason = '') {
  @{ verdict = $Verdict; reason = $Reason }
}

function Get-RelayIdentityVerdict([hashtable]$Value, [hashtable]$Authority, [hashtable]$ActivePlan, [hashtable]$Current) {
  if ($Value.plan_version -ne $ActivePlan.plan_version -or $Value.plan_hash -cne $ActivePlan.plan_hash) { return New-RelayVerdict 'rejected' 'stale-plan' }
  if ($Value.authority_generation -ne $Authority.authority_generation) { return New-RelayVerdict 'rejected' 'stale-generation' }
  if ($Value.node_id -cne $Current.node_id) { return New-RelayVerdict 'rejected' 'wrong-node' }
  if ($Value.attempt_id -lt $Current.attempt_id) { return New-RelayVerdict 'stale' 'stale-attempt' }
  if ($Value.attempt_id -ne $Current.attempt_id -and $Value.launch_id -ceq $Current.launch_id -and $Value.session_id -ceq $Current.session_id) {
    return New-RelayVerdict 'rejected' 'identity-mismatch:attempt_id'
  }
  foreach ($name in @('launch_id','session_id')) {
    if ($Value[$name] -cne $Current[$name]) { return New-RelayVerdict 'rejected' "identity-mismatch:$name" }
  }
  New-RelayVerdict 'accept'
}

function Get-RelayResultVerdict([hashtable]$Result, [hashtable]$Authority, [hashtable]$ActivePlan, [hashtable]$Current) {
  $schema = Test-RelayResult $Result
  if (-not $schema.ok) { return New-RelayVerdict 'rejected' $schema.reason }
  $identity = Get-RelayIdentityVerdict $Result $Authority $ActivePlan $Current
  if ($identity.verdict -ne 'accept') { return $identity }
  if ($Current.final_committed) { return New-RelayVerdict 'rejected' 'final-immutable' }
  New-RelayVerdict 'accept'
}

function Get-RelayCheckpointVerdict([hashtable]$Checkpoint, [hashtable]$Authority, [hashtable]$ActivePlan, [hashtable]$Current) {
  $schema = Test-RelayCheckpoint $Checkpoint
  if (-not $schema.ok) { return New-RelayVerdict 'rejected' $schema.reason }
  $identity = Get-RelayIdentityVerdict $Checkpoint $Authority $ActivePlan $Current
  if ($identity.verdict -ne 'accept') { return $identity }
  if ($Current.final_committed) { return New-RelayVerdict 'rejected' 'attempt-closed' }
  New-RelayVerdict 'accept'
}

function New-RelayEvent([string]$Kind, [hashtable]$Identity, [string]$Reason) {
  $event = @{
    schema_version = 'relay/v1'
    event_id = "EV-$([Guid]::NewGuid().ToString('N'))"
    kind = $Kind
    occurred_at = [DateTimeOffset]::UtcNow.ToString('o')
    identity = $Identity.Clone()
  }
  if (-not [string]::IsNullOrWhiteSpace($Reason)) { $event.reason = $Reason }
  $event
}

function Get-RelayNodeFreezeSet([hashtable]$Plan, [string]$NodeId) {
  $frozen = [Collections.Generic.HashSet[string]]::new()
  $changed = $true
  while ($changed) {
    $changed = $false
    foreach ($node in $Plan.nodes) {
      if ($node.node_id -ceq $NodeId -or $frozen.Contains($node.node_id)) { continue }
      if ($NodeId -cin $node.depends_on -or @($node.depends_on | Where-Object { $frozen.Contains($_) }).Count -gt 0) {
        $changed = $frozen.Add($node.node_id) -or $changed
      }
    }
  }
  @($frozen | Sort-Object)
}

function Get-RelayResultFileVerdict([string]$Path, [hashtable]$Authority, [hashtable]$ActivePlan, [hashtable]$Current) {
  try {
    $result = Get-Content -Raw $Path -ErrorAction Stop | ConvertFrom-Json -AsHashtable -DateKind String -ErrorAction Stop
  } catch {
    return New-RelayVerdict 'rejected' 'unparseable-result'
  }
  Get-RelayResultVerdict $result $Authority $ActivePlan $Current
}
