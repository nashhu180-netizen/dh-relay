function New-RelayValidationOk {
  @{ ok = $true }
}

function New-RelayValidationError([string]$Reason) {
  @{ ok = $false; reason = $Reason }
}

function Test-RelayAllowedFields([hashtable]$Value, [string[]]$Allowed) {
  foreach ($key in $Value.Keys) {
    if ($key -cnotin $Allowed) { return New-RelayValidationError "unknown-field:$key" }
  }
  New-RelayValidationOk
}

function Test-RelayRequiredFields([hashtable]$Value, [string[]]$Required) {
  foreach ($key in $Required) {
    if (-not $Value.ContainsKey($key)) { return New-RelayValidationError "missing-field:$key" }
  }
  New-RelayValidationOk
}

function Test-RelayStringValue([hashtable]$Value, [string]$Name) {
  if ($Value[$Name] -isnot [string] -or [string]::IsNullOrWhiteSpace($Value[$Name])) {
    return New-RelayValidationError "bad-type:$Name"
  }
  New-RelayValidationOk
}

function Test-RelayPositiveInteger([hashtable]$Value, [string]$Name) {
  if (($Value[$Name] -isnot [int] -and $Value[$Name] -isnot [long]) -or $Value[$Name] -lt 1) {
    $reason = if ($Value[$Name] -is [int] -or $Value[$Name] -is [long]) { "bad-value:$Name" } else { "bad-type:$Name" }
    return New-RelayValidationError $reason
  }
  New-RelayValidationOk
}

function Test-RelayHashValue([hashtable]$Value, [string]$Name) {
  if ($Value[$Name] -isnot [string]) { return New-RelayValidationError "bad-type:$Name" }
  if ($Value[$Name] -notmatch '^[0-9a-fA-F]{64}$') { return New-RelayValidationError "bad-value:$Name" }
  New-RelayValidationOk
}

function Test-RelayIsoValue([hashtable]$Value, [string]$Name) {
  if ($Value[$Name] -isnot [string]) { return New-RelayValidationError "bad-type:$Name" }
  if ($Value[$Name] -notmatch '^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}') { return New-RelayValidationError "bad-value:$Name" }
  $parsed = [DateTimeOffset]::MinValue
  if (-not [DateTimeOffset]::TryParse($Value[$Name], [ref]$parsed)) { return New-RelayValidationError "bad-value:$Name" }
  New-RelayValidationOk
}

function Test-RelayEnumValue([hashtable]$Value, [string]$Name, [string[]]$Allowed) {
  if ($Value[$Name] -isnot [string]) { return New-RelayValidationError "bad-type:$Name" }
  if ($Value[$Name] -cnotin $Allowed) { return New-RelayValidationError "unknown-enum:$Name" }
  New-RelayValidationOk
}

function ConvertTo-RelayCanonicalValue($Value) {
  if ($Value -is [System.Collections.IDictionary]) {
    $ordered = [ordered]@{}
    foreach ($key in @($Value.Keys | Sort-Object)) {
      $ordered[$key] = ConvertTo-RelayCanonicalValue $Value[$key]
    }
    return $ordered
  }
  if ($Value -is [System.Collections.IEnumerable] -and $Value -isnot [string]) {
    return @($Value | ForEach-Object { ConvertTo-RelayCanonicalValue $_ })
  }
  $Value
}

function Get-RelayPlanHash([hashtable]$Plan) {
  $withoutHash = [ordered]@{}
  foreach ($key in @($Plan.Keys | Where-Object { $_ -ne 'plan_hash' } | Sort-Object)) {
    $withoutHash[$key] = ConvertTo-RelayCanonicalValue $Plan[$key]
  }
  $json = $withoutHash | ConvertTo-Json -Depth 50 -Compress
  $bytes = [Text.Encoding]::UTF8.GetBytes($json)
  $hash = [Security.Cryptography.SHA256]::HashData($bytes)
  ([Convert]::ToHexString($hash)).ToLowerInvariant()
}

function Test-RelaySchemaVersion([hashtable]$Value) {
  if (-not $Value.ContainsKey('schema_version')) { return New-RelayValidationError 'missing-field:schema_version' }
  if ($Value.schema_version -isnot [string]) { return New-RelayValidationError 'bad-type:schema_version' }
  if ($Value.schema_version -cne 'relay/v1') { return New-RelayValidationError 'bad-value:schema_version' }
  New-RelayValidationOk
}

function Test-RelayNode([hashtable]$Node) {
  $allowed = @('node_id','role','brief_ref','depends_on','next_action','resume_from')
  $required = @('node_id','role','brief_ref','depends_on','next_action')
  $check = Test-RelayAllowedFields $Node $allowed; if (-not $check.ok) { return $check }
  $check = Test-RelayRequiredFields $Node $required; if (-not $check.ok) { return $check }
  foreach ($name in @('node_id','brief_ref')) { $check = Test-RelayStringValue $Node $name; if (-not $check.ok) { return $check } }
  $check = Test-RelayEnumValue $Node 'role' @('worker','reviewer','replanner'); if (-not $check.ok) { return $check }
  $check = Test-RelayEnumValue $Node 'next_action' @('review','next_stage','none'); if (-not $check.ok) { return $check }
  if ($Node.depends_on -isnot [array]) { return New-RelayValidationError 'bad-type:depends_on' }
  foreach ($dep in $Node.depends_on) {
    if ($dep -isnot [string] -or [string]::IsNullOrWhiteSpace($dep)) { return New-RelayValidationError 'bad-type:depends_on' }
  }
  if ($Node.ContainsKey('resume_from')) {
    if ($Node.resume_from -isnot [hashtable]) { return New-RelayValidationError 'bad-type:resume_from' }
    $check = Test-RelayAllowedFields $Node.resume_from @('node_id','attempt_id'); if (-not $check.ok) { return $check }
    $check = Test-RelayRequiredFields $Node.resume_from @('node_id','attempt_id'); if (-not $check.ok) { return $check }
    $check = Test-RelayStringValue $Node.resume_from 'node_id'; if (-not $check.ok) { return $check }
    $check = Test-RelayPositiveInteger $Node.resume_from 'attempt_id'; if (-not $check.ok) { return $check }
  }
  New-RelayValidationOk
}

function Test-RelayPlanProposal([hashtable]$Plan) {
  $allowed = @('schema_version','plan_version','plan_hash','run_id','proposed_by','proposed_at','nodes')
  $required = $allowed
  $check = Test-RelayAllowedFields $Plan $allowed; if (-not $check.ok) { return $check }
  $check = Test-RelayRequiredFields $Plan $required; if (-not $check.ok) { return $check }
  $check = Test-RelaySchemaVersion $Plan; if (-not $check.ok) { return $check }
  $check = Test-RelayPositiveInteger $Plan 'plan_version'; if (-not $check.ok) { return $check }
  $check = Test-RelayHashValue $Plan 'plan_hash'; if (-not $check.ok) { return $check }
  $check = Test-RelayStringValue $Plan 'run_id'; if (-not $check.ok) { return $check }
  $check = Test-RelayEnumValue $Plan 'proposed_by' @('orchestrator','replanner'); if (-not $check.ok) { return $check }
  $check = Test-RelayIsoValue $Plan 'proposed_at'; if (-not $check.ok) { return $check }
  if ($Plan.nodes -isnot [array] -or $Plan.nodes.Count -lt 1) { return New-RelayValidationError 'bad-type:nodes' }
  $ids = @{}
  foreach ($node in $Plan.nodes) {
    if ($node -isnot [hashtable]) { return New-RelayValidationError 'bad-type:nodes' }
    $check = Test-RelayNode $node; if (-not $check.ok) { return $check }
    if ($ids.ContainsKey($node.node_id)) { return New-RelayValidationError "duplicate-node:$($node.node_id)" }
    $ids[$node.node_id] = $node
  }
  foreach ($node in $Plan.nodes) {
    foreach ($dep in $node.depends_on) {
      if (-not $ids.ContainsKey($dep)) { return New-RelayValidationError "unknown-dep:$dep" }
    }
  }
  $visiting = @{}; $visited = @{}
  function Test-Cycle([string]$Id) {
    if ($visiting.ContainsKey($Id)) { return $true }
    if ($visited.ContainsKey($Id)) { return $false }
    $visiting[$Id] = $true
    foreach ($dep in $ids[$Id].depends_on) { if (Test-Cycle $dep) { return $true } }
    $visiting.Remove($Id); $visited[$Id] = $true
    $false
  }
  foreach ($id in $ids.Keys) { if (Test-Cycle $id) { return New-RelayValidationError 'dependency-cycle' } }
  if ((Get-RelayPlanHash $Plan) -ne $Plan.plan_hash.ToLowerInvariant()) { return New-RelayValidationError 'plan-hash-mismatch' }
  New-RelayValidationOk
}

function Test-RelayActivePlan([hashtable]$Ptr) {
  $fields = @('schema_version','plan_version','plan_hash','authority_generation','activated_at')
  $check = Test-RelayAllowedFields $Ptr $fields; if (-not $check.ok) { return $check }
  $check = Test-RelayRequiredFields $Ptr $fields; if (-not $check.ok) { return $check }
  $check = Test-RelaySchemaVersion $Ptr; if (-not $check.ok) { return $check }
  foreach ($name in @('plan_version','authority_generation')) { $check = Test-RelayPositiveInteger $Ptr $name; if (-not $check.ok) { return $check } }
  $check = Test-RelayHashValue $Ptr 'plan_hash'; if (-not $check.ok) { return $check }
  Test-RelayIsoValue $Ptr 'activated_at'
}

function Test-RelayAuthority([hashtable]$Auth) {
  $fields = @('schema_version','run_id','authority_generation','plan_version','plan_hash','granted_at')
  $check = Test-RelayAllowedFields $Auth $fields; if (-not $check.ok) { return $check }
  $check = Test-RelayRequiredFields $Auth $fields; if (-not $check.ok) { return $check }
  $check = Test-RelaySchemaVersion $Auth; if (-not $check.ok) { return $check }
  $check = Test-RelayStringValue $Auth 'run_id'; if (-not $check.ok) { return $check }
  foreach ($name in @('authority_generation','plan_version')) { $check = Test-RelayPositiveInteger $Auth $name; if (-not $check.ok) { return $check } }
  $check = Test-RelayHashValue $Auth 'plan_hash'; if (-not $check.ok) { return $check }
  Test-RelayIsoValue $Auth 'granted_at'
}

function Test-RelayIdentityFields([hashtable]$Value) {
  foreach ($name in @('plan_version','authority_generation','attempt_id')) { $check = Test-RelayPositiveInteger $Value $name; if (-not $check.ok) { return $check } }
  $check = Test-RelayHashValue $Value 'plan_hash'; if (-not $check.ok) { return $check }
  foreach ($name in @('node_id','launch_id','session_id')) { $check = Test-RelayStringValue $Value $name; if (-not $check.ok) { return $check } }
  New-RelayValidationOk
}

function Test-RelayLaunchReceipt([hashtable]$Receipt) {
  $fields = @('schema_version','plan_version','plan_hash','authority_generation','node_id','attempt_id','launch_id','session_id','role','backend','issued_at','launch_deadline_at')
  $check = Test-RelayAllowedFields $Receipt $fields; if (-not $check.ok) { return $check }
  $check = Test-RelayRequiredFields $Receipt $fields; if (-not $check.ok) { return $check }
  $check = Test-RelaySchemaVersion $Receipt; if (-not $check.ok) { return $check }
  $check = Test-RelayIdentityFields $Receipt; if (-not $check.ok) { return $check }
  $check = Test-RelayEnumValue $Receipt 'role' @('worker','reviewer','replanner'); if (-not $check.ok) { return $check }
  $check = Test-RelayEnumValue $Receipt 'backend' @('fake','psmux'); if (-not $check.ok) { return $check }
  foreach ($name in @('issued_at','launch_deadline_at')) { $check = Test-RelayIsoValue $Receipt $name; if (-not $check.ok) { return $check } }
  New-RelayValidationOk
}

function Test-RelayStringArray([hashtable]$Value, [string]$Name, [bool]$RequireNonEmpty = $false) {
  if ($Value[$Name] -isnot [array] -or ($RequireNonEmpty -and $Value[$Name].Count -lt 1)) {
    return New-RelayValidationError "bad-type:$Name"
  }
  foreach ($item in $Value[$Name]) {
    if ($item -isnot [string] -or [string]::IsNullOrWhiteSpace($item)) { return New-RelayValidationError "bad-type:$Name" }
  }
  New-RelayValidationOk
}

function Test-RelayResult([hashtable]$Result) {
  $fields = @('schema_version','plan_version','plan_hash','authority_generation','node_id','attempt_id','launch_id','session_id','result_status','next_action','summary','handoff_ref','changed_paths','tests_run','git_snapshot','interruption_reason','written_at')
  $required = @('schema_version','plan_version','plan_hash','authority_generation','node_id','attempt_id','launch_id','session_id','result_status','next_action','summary','handoff_ref','changed_paths','tests_run','git_snapshot','written_at')
  $check = Test-RelayAllowedFields $Result $fields; if (-not $check.ok) { return $check }
  $check = Test-RelayRequiredFields $Result $required; if (-not $check.ok) { return $check }
  $check = Test-RelaySchemaVersion $Result; if (-not $check.ok) { return $check }
  $check = Test-RelayIdentityFields $Result; if (-not $check.ok) { return $check }
  if ($Result.result_status -isnot [string]) { return New-RelayValidationError 'bad-type:result_status' }
  if ($Result.result_status -cin @('working','decision_required')) { return New-RelayValidationError "illegal-final-status:$($Result.result_status)" }
  if ($Result.result_status -cnotin @('succeeded','dependency_blocked','interrupted_unknown','quota_exhausted')) { return New-RelayValidationError 'unknown-enum:result_status' }
  $check = Test-RelayEnumValue $Result 'next_action' @('review','next_stage','none'); if (-not $check.ok) { return $check }
  foreach ($name in @('summary','handoff_ref')) { $check = Test-RelayStringValue $Result $name; if (-not $check.ok) { return $check } }
  foreach ($name in @('changed_paths','tests_run')) { $check = Test-RelayStringArray $Result $name; if (-not $check.ok) { return $check } }
  if ($Result.git_snapshot -isnot [hashtable]) { return New-RelayValidationError 'bad-type:git_snapshot' }
  $check = Test-RelayAllowedFields $Result.git_snapshot @('commit','changed_paths','diff_stat'); if (-not $check.ok) { return $check }
  $check = Test-RelayRequiredFields $Result.git_snapshot @('commit','changed_paths','diff_stat'); if (-not $check.ok) { return $check }
  foreach ($name in @('commit','diff_stat')) { $check = Test-RelayStringValue $Result.git_snapshot $name; if (-not $check.ok) { return $check } }
  $check = Test-RelayStringArray $Result.git_snapshot 'changed_paths'; if (-not $check.ok) { return $check }
  if ($Result.ContainsKey('interruption_reason')) {
    if ($Result.result_status -cne 'interrupted_unknown') { return New-RelayValidationError 'unknown-field:interruption_reason' }
    $check = Test-RelayEnumValue $Result 'interruption_reason' @('stopped_by_user','host_lost','unknown'); if (-not $check.ok) { return $check }
  }
  Test-RelayIsoValue $Result 'written_at'
}

function Test-RelayCheckpoint([hashtable]$Checkpoint) {
  $base = @('schema_version','plan_version','plan_hash','authority_generation','node_id','attempt_id','launch_id','session_id','status','progress_note','tried','written_at')
  $allowed = if ($Checkpoint.status -eq 'decision_required') { $base + @('question','options') } else { $base }
  $required = @('schema_version','plan_version','plan_hash','authority_generation','node_id','attempt_id','launch_id','session_id','status','progress_note','written_at')
  if ($Checkpoint.status -eq 'decision_required') { $required += @('question','options') }
  $check = Test-RelayAllowedFields $Checkpoint $allowed; if (-not $check.ok) { return $check }
  $check = Test-RelayRequiredFields $Checkpoint $required; if (-not $check.ok) { return $check }
  $check = Test-RelaySchemaVersion $Checkpoint; if (-not $check.ok) { return $check }
  $check = Test-RelayIdentityFields $Checkpoint; if (-not $check.ok) { return $check }
  $check = Test-RelayEnumValue $Checkpoint 'status' @('working','decision_required'); if (-not $check.ok) { return $check }
  $check = Test-RelayStringValue $Checkpoint 'progress_note'; if (-not $check.ok) { return $check }
  if ($Checkpoint.ContainsKey('tried')) { $check = Test-RelayStringArray $Checkpoint 'tried'; if (-not $check.ok) { return $check } }
  if ($Checkpoint.status -eq 'decision_required') {
    $check = Test-RelayStringValue $Checkpoint 'question'; if (-not $check.ok) { return $check }
    $check = Test-RelayStringArray $Checkpoint 'options' $true; if (-not $check.ok) { return $check }
  }
  Test-RelayIsoValue $Checkpoint 'written_at'
}

function Test-RelayEvent([hashtable]$Event) {
  $base = @('schema_version','event_id','kind','occurred_at','identity','reason')
  $allowedKinds = @('plan_proposed','plan_activated','launch_receipt','observation','checkpoint_accepted','checkpoint_rejected','result_accepted','result_stale','result_rejected','control','launch_failed','diagnosis')
  if ($Event.kind -eq 'control') { $allowed = $base + @('actor','source','nonce') }
  elseif ($Event.kind -eq 'observation') { $allowed = $base + @('probe_error','consecutive_probe_failures','terminal_state') }
  else { $allowed = $base }
  $check = Test-RelayAllowedFields $Event $allowed; if (-not $check.ok) { return $check }
  $required = @('schema_version','event_id','kind','occurred_at')
  if ($Event.kind -eq 'control') { $required += @('actor','source','nonce') }
  $check = Test-RelayRequiredFields $Event $required; if (-not $check.ok) { return $check }
  $check = Test-RelaySchemaVersion $Event; if (-not $check.ok) { return $check }
  $check = Test-RelayStringValue $Event 'event_id'; if (-not $check.ok) { return $check }
  $check = Test-RelayEnumValue $Event 'kind' $allowedKinds; if (-not $check.ok) { return $check }
  $check = Test-RelayIsoValue $Event 'occurred_at'; if (-not $check.ok) { return $check }
  if ($Event.ContainsKey('identity')) {
    if ($Event.identity -isnot [hashtable]) { return New-RelayValidationError 'bad-type:identity' }
    $identityFields = @('plan_version','plan_hash','authority_generation','node_id','attempt_id','launch_id','session_id')
    $check = Test-RelayAllowedFields $Event.identity $identityFields; if (-not $check.ok) { return $check }
    foreach ($name in $Event.identity.Keys) {
      if ($name -in @('plan_version','authority_generation','attempt_id')) { $check = Test-RelayPositiveInteger $Event.identity $name }
      elseif ($name -eq 'plan_hash') { $check = Test-RelayHashValue $Event.identity $name }
      else { $check = Test-RelayStringValue $Event.identity $name }
      if (-not $check.ok) { return $check }
    }
  }
  if ($Event.ContainsKey('reason')) { $check = Test-RelayStringValue $Event 'reason'; if (-not $check.ok) { return $check } }
  if ($Event.kind -eq 'control') {
    foreach ($name in @('actor','nonce')) { $check = Test-RelayStringValue $Event $name; if (-not $check.ok) { return $check } }
    $check = Test-RelayEnumValue $Event 'source' @('runner','host','user'); if (-not $check.ok) { return $check }
  }
  if ($Event.kind -eq 'observation') {
    if ($Event.ContainsKey('probe_error') -and $Event.probe_error -isnot [bool]) { return New-RelayValidationError 'bad-type:probe_error' }
    if ($Event.ContainsKey('consecutive_probe_failures')) {
      if (($Event.consecutive_probe_failures -isnot [int] -and $Event.consecutive_probe_failures -isnot [long]) -or $Event.consecutive_probe_failures -lt 0) { return New-RelayValidationError 'bad-type:consecutive_probe_failures' }
    }
    if ($Event.ContainsKey('terminal_state')) {
      $check = Test-RelayEnumValue $Event 'terminal_state' @('launching','running','idle','stopped','exited','unknown'); if (-not $check.ok) { return $check }
    }
  }
  New-RelayValidationOk
}

function Test-RelayHandoffHeader([string]$Text) {
  $firstLine = ($Text -split "`r?`n", 2)[0]
  $prefix = '<!-- dh:relay-handoff v1 '
  if (-not $firstLine.StartsWith($prefix) -or -not $firstLine.EndsWith(' -->')) { return New-RelayValidationError 'bad-handoff-header' }
  $body = $firstLine.Substring($prefix.Length, $firstLine.Length - $prefix.Length - 4)
  $identity = @{}
  foreach ($token in ($body -split ' ')) {
    $parts = $token -split '=', 2
    if ($parts.Count -eq 2) { $identity[$parts[0]] = $parts[1] }
  }
  $fields = @('plan_version','plan_hash','authority_generation','node_id','attempt_id','launch_id','session_id')
  foreach ($name in $fields) { if (-not $identity.ContainsKey($name)) { return New-RelayValidationError "missing-identity:$name" } }
  $check = Test-RelayAllowedFields $identity $fields; if (-not $check.ok) { return $check }
  foreach ($name in @('plan_version','authority_generation','attempt_id')) {
    $number = 0
    if (-not [int]::TryParse($identity[$name], [ref]$number) -or $number -lt 1) { return New-RelayValidationError "bad-value:$name" }
    $identity[$name] = $number
  }
  $check = Test-RelayHashValue $identity 'plan_hash'; if (-not $check.ok) { return $check }
  foreach ($name in @('node_id','launch_id','session_id')) { $check = Test-RelayStringValue $identity $name; if (-not $check.ok) { return $check } }
  @{ ok = $true; identity = $identity }
}
