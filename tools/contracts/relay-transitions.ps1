function Get-RelayTransitionMatrix {
  if ($null -eq $script:RelayTransitionMatrix) {
    $path = Join-Path $PSScriptRoot 'transition-matrix.json'
    $script:RelayTransitionMatrix = Get-Content -Raw $path | ConvertFrom-Json
  }
  $script:RelayTransitionMatrix
}

function Test-RelayMatrixTransition([string]$Dimension, [string]$From, [string]$To) {
  $matrix = Get-RelayTransitionMatrix
  $definition = $matrix.$Dimension
  if ($From -cnotin $definition.states) { return @{ ok=$false; reason="unknown-state:$From" } }
  if ($To -cnotin $definition.states) { return @{ ok=$false; reason="unknown-state:$To" } }
  $edge = @($definition.edges | Where-Object { $_.from -ceq $From -and $_.to -ceq $To })
  if ($edge.Count -eq 0) { return @{ ok=$false; reason='edge-not-listed' } }
  if (-not $edge[0].p1) { return @{ ok=$false; reason='reserved-target-form' } }
  @{ ok=$true }
}

function Test-RelayTerminalTransition([string]$From, [string]$To) {
  Test-RelayMatrixTransition 'terminal_state' $From $To
}

function Test-RelayResultTransition([string]$From, [string]$To) {
  Test-RelayMatrixTransition 'result_status' $From $To
}

function Test-RelayTransitionPair([hashtable]$TerminalMove, [hashtable]$ResultMove) {
  if ($null -ne $TerminalMove) {
    $terminal = Test-RelayTerminalTransition $TerminalMove.from $TerminalMove.to
    if (-not $terminal.ok) { return @{ ok=$false; reason='dual-dimension-fail-closed:terminal' } }
  }
  if ($null -ne $ResultMove) {
    $result = Test-RelayResultTransition $ResultMove.from $ResultMove.to
    if (-not $result.ok) { return @{ ok=$false; reason='dual-dimension-fail-closed:result' } }
  }
  @{ ok=$true }
}

function Get-RelayProbeVerdict(
  [int]$ConsecutiveFailures,
  [hashtable]$Params,
  [string]$CurrentTerminal = 'running',
  [string]$CurrentResult = 'working'
) {
  if ($ConsecutiveFailures -lt $Params.ProbeMaxConsecutiveFailures) { return @{ triggered=$false } }
  @{
    triggered = $true
    terminal_move = @{ from=$CurrentTerminal; to='unknown' }
    result_move = @{ from=$CurrentResult; to='interrupted_unknown' }
  }
}

function Get-RelayStallVerdict([hashtable]$Snapshot, [DateTimeOffset]$Now, [hashtable]$Params) {
  $lastEvent = [DateTimeOffset]::Parse($Snapshot.last_event_at)
  $elapsed = ($Now - $lastEvent).TotalSeconds
  $stalled = $Snapshot.terminal_state -cin @('running','idle') -and $Snapshot.result_status -ceq 'working' -and $elapsed -ge $Params.StallThresholdSeconds
  if (-not $stalled) { return @{ stalled=$false } }
  @{
    stalled = $true
    terminal_move = @{ from=$Snapshot.terminal_state; to='unknown' }
    result_move = @{ from='working'; to='interrupted_unknown' }
  }
}

function Get-RelayExitWithoutResultVerdict([hashtable]$Snapshot) {
  if ($Snapshot.terminal_state -cne 'exited' -or $null -ne $Snapshot.final_result) { return @{ triggered=$false } }
  @{ triggered=$true; result_move=@{ from=$Snapshot.result_status; to='interrupted_unknown' } }
}
