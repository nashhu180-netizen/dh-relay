function New-RelayFakeAdapter([hashtable]$Script) {
  $state = @{
    script = $Script
    launch_index = 0
    calls = [Collections.Generic.List[hashtable]]::new()
    sessions = @{}
  }
  $launch = {
    param($Receipt, $Node, $Run)
    $entry = if ($state.launch_index -lt @($state.script.launches).Count) { $state.script.launches[$state.launch_index] } else { $null }
    $state.launch_index++
    $state.calls.Add(@{ verb='launch'; session_id=$Receipt.session_id; args=@{}; receipt_present=(Test-Path -LiteralPath (Join-Path $Run.paths.launches "$($Receipt.launch_id).json")); node_resume_from=$Node.resume_from })
    if ($null -eq $entry) { return @{ ok=$false; reason='fake-script-exhausted' } }
    if ($entry.launch_result -ceq 'fail') { return @{ ok=$false; reason='fake-launch-failed' } }
    if ($entry.launch_result -ceq 'handle-mismatch') { return @{ ok=$true; session_id="$($Receipt.session_id)-X" } }
    $tape = [Collections.Generic.List[object]]::new()
    foreach ($item in @($entry.probes)) { $tape.Add($item) }
    $host = [Collections.Generic.List[hashtable]]::new()
    foreach ($item in @($entry.host_observations)) { $copy=$item.Clone(); $copy.emitted=$false; $host.Add($copy) }
    $state.sessions[$Receipt.session_id] = @{ tape=$tape; index=0; stopped=$false; on_stop=$entry.on_stop; host=$host; events_path=$Run.paths.events }
    @{ ok=$true; session_id=$Receipt.session_id }
  }.GetNewClosure()
  $probe = {
    param($SessionId)
    $state.calls.Add(@{ verb='probe'; session_id=$SessionId; args=@{}; receipt_present=$false })
    if (-not $state.sessions.ContainsKey($SessionId)) { return @{ ok=$false; probe_error=$true; reason='unknown-session' } }
    $session = $state.sessions[$SessionId]
    if ($session.tape.Count -eq 0) { return @{ ok=$false; probe_error=$true; reason='empty-fake-tape' } }
    $at = [Math]::Min($session.index, $session.tape.Count - 1); $item = $session.tape[$at]; $session.index++
    if ($item -is [hashtable] -and $item.probe_error) { return @{ ok=$false; probe_error=$true } }
    @{ ok=$true; terminal_state=[string]$item; probe_error=$false }
  }.GetNewClosure()
  $stop = {
    param($SessionId)
    $eventsLines=0
    if ($state.sessions.ContainsKey($SessionId)) { $eventsLines=@([IO.File]::ReadAllLines($state.sessions[$SessionId].events_path)).Count }
    $state.calls.Add(@{ verb='stop'; session_id=$SessionId; args=@{}; receipt_present=$false; events_lines=$eventsLines })
    if (-not $state.sessions.ContainsKey($SessionId)) { return @{ ok=$false; reason='unknown-session' } }
    $session=$state.sessions[$SessionId]; $session.stopped=$true; $session.host.Clear()
    if ($session.on_stop -ceq 'exited') { $session.tape=[Collections.Generic.List[object]]::new(); $session.tape.Add('exited'); $session.index=0 }
    @{ ok=$true }
  }.GetNewClosure()
  $suspend = { param($SessionId); $state.calls.Add(@{verb='suspend';session_id=$SessionId;args=@{};receipt_present=$false}); @{ok=$false;reason='not-used-in-p1'} }.GetNewClosure()
  $resume = { param($SessionId); $state.calls.Add(@{verb='resume';session_id=$SessionId;args=@{};receipt_present=$false}); @{ok=$false;reason='not-used-in-p1'} }.GetNewClosure()
  $emit = {
    param($Run)
    $state.calls.Add(@{ verb='emit_observation'; session_id=''; args=@{}; receipt_present=$false })
    $items = [Collections.Generic.List[hashtable]]::new()
    foreach ($sessionId in $state.sessions.Keys) {
      $session=$state.sessions[$sessionId]
      foreach ($entry in $session.host) {
        if (-not $entry.emitted -and $entry.after_probe_index -le $session.index) {
          $entry.emitted=$true; $items.Add(@{session_id=$sessionId;terminal_state=$entry.terminal_state})
        }
      }
    }
    return @($items)
  }.GetNewClosure()
  @{ backend='fake'; launch=$launch; probe=$probe; suspend=$suspend; resume=$resume; stop=$stop; emit_observation=$emit; calls=$state.calls; sessions=$state.sessions }
}
