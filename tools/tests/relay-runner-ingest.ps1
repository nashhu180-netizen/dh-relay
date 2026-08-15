$ErrorActionPreference='Stop'; [Console]::OutputEncoding=[Text.Encoding]::UTF8
$script:failed=0; $script:assertions=0; $script:roots=[Collections.Generic.List[string]]::new()
function Assert-True([bool]$cond,[string]$name){$script:assertions++;if($cond){Write-Host "PASS  $name"}else{Write-Host "FAIL  $name";$script:failed++}}
function RF([string]$p){Get-Content -Raw -LiteralPath (Join-Path $PSScriptRoot "fixtures/runner/$p")|ConvertFrom-Json -AsHashtable -DateKind String}
function New-StartedRun([switch]$OnlyActivate){
  $script:t=[DateTimeOffset]::Parse('2026-08-15T09:00:00Z'); $clock={$script:t}
  $root=Join-Path ([IO.Path]::GetTempPath()) "relay-test-ingest-$([guid]::NewGuid().ToString('N'))"; $script:roots.Add($root)
  $adapter=New-RelayFakeAdapter (RF 'adapter/probe-running-forever.json'); $run=New-RelayRun $root 'RUN-FAKE-DHR02' $adapter $clock
  [void](Submit-RelayProposal $run (RF 'plans/plan-v1-single-A.json') 0)
  if(-not $OnlyActivate){[void](Start-RelayNodeAttempt $run 'A');[void](Invoke-RelayTick $run)}
  @{run=$run;adapter=$adapter}
}
. (Join-Path $PSScriptRoot '../runner/relay-runner.ps1'); . (Join-Path $PSScriptRoot '../adapters/fake-adapter.ps1')
try {
  $x=New-StartedRun; $run=$x.run
  $ok=Submit-RelayResultFile $run 'A' (Join-Path $PSScriptRoot 'fixtures/runner/results/result-A1-succeeded-review.json')
  Assert-True $ok.ok 'succeeded result accepted'
  Assert-True ($run.state.nodes.A.final_committed -and $run.state.nodes.A.result_status -eq 'succeeded') 'final projected as succeeded'
  Assert-True ($run.state.nodes.A.scheduling -eq 'succeeded' -and $run.state.nodes.A.task_state -eq 'active') 'succeeded review keeps task active'
  Assert-True ($run.state.nodes.A.next_action -eq 'review') 'next action review preserved'
  $nodeKeys=@($run.state.nodes.A.Keys|Sort-Object)-join ','
  Assert-True ($nodeKeys -eq ((@('attempt_id','launch_id','session_id','terminal_state','result_status','final_committed','task_state','scheduling','frozen_by','next_action','last_progress_at','consecutive_probe_failures','launch_deadline_at','pause_reason')|Sort-Object)-join ',')) 'node has exactly fourteen fields'
  $finalPath=Join-Path $run.paths.attempts 'A/1/result.json'; Assert-True (Test-Path $finalPath) 'final result stored'
  Assert-True (Test-RelayResult (Read-RelayJson $finalPath)).ok 'stored final validates'
  Assert-True ((Read-RelayEvents $run)[-1].kind -eq 'result_accepted') 'accepted result event appended'
  Assert-True (@(Get-RelayReadyNodes $run).Count -eq 0) 'succeeded single node is not ready'
  Assert-True ((Apply-RelayObservation $run 'A' @{ok=$true;terminal_state='running';probe_error=$false}).reason -eq 'node-not-observable') 'closed node is not observable'
  $finalHash=(Get-FileHash $finalPath).Hash; $dup=Submit-RelayResultFile $run 'A' (Join-Path $PSScriptRoot 'fixtures/runner/results/result-A1-duplicate.json')
  Assert-True (-not $dup.ok -and $dup.reason -eq 'final-immutable') 'duplicate final rejected immutable'
  Assert-True ((Get-FileHash $finalPath).Hash -eq $finalHash) 'duplicate leaves final bytes unchanged'

  $x=New-StartedRun; $bad=Submit-RelayResultFile $x.run 'A' (Join-Path $PSScriptRoot 'fixtures/runner/results/result-A1-taskstate-key.json')
  Assert-True ($bad.reason -eq 'unknown-field:task_state') 'result task state key rejected'
  $x=New-StartedRun; $before=@($x.run.paths.state,$x.run.paths.active_plan,$x.run.paths.authority|ForEach-Object{(Get-FileHash $_).Hash})
  $stale=Submit-RelayResultFile $x.run 'A' (Join-Path $PSScriptRoot 'fixtures/runner/results/result-A1-wrong-generation.json')
  Assert-True (-not $stale.ok -and $stale.reason -eq 'stale-generation' -and (Read-RelayEvents $x.run)[-1].kind -eq 'result_stale') 'wrong generation classified stale'
  Assert-True ($x.run.state.nodes.A.result_status -eq 'working') 'stale result does not advance status'
  $after=@($x.run.paths.state,$x.run.paths.active_plan,$x.run.paths.authority|ForEach-Object{(Get-FileHash $_).Hash});Assert-True (($before-join',') -eq ($after-join',')) 'stale result leaves state authority bytes unchanged'
  $x=New-StartedRun; $wrong=Submit-RelayResultFile $x.run 'A' (Join-Path $PSScriptRoot 'fixtures/runner/results/result-A1-wrong-session.json')
  Assert-True ($wrong.reason -eq 'identity-mismatch:session_id' -and (Read-RelayEvents $x.run)[-1].kind -eq 'result_rejected') 'wrong session result rejected'
  $x=New-StartedRun -OnlyActivate; $none=Submit-RelayResultFile $x.run 'A' (Join-Path $PSScriptRoot 'fixtures/runner/results/result-A1-succeeded-review.json')
  Assert-True ($none.reason -eq 'no-attempt') 'result without attempt rejected'
  $x=New-StartedRun; $half=Submit-RelayResultFile $x.run 'A' (Join-Path $PSScriptRoot 'fixtures/failures/result-halfwritten.json')
  Assert-True ($half.reason -eq 'unparseable-result') 'halfwritten result rejected'
  $unknownNode=Submit-RelayResultFile $x.run 'FAKE-MISSING' (Join-Path $PSScriptRoot 'fixtures/runner/results/result-A1-succeeded-review.json')
  Assert-True ($unknownNode.reason -eq 'unknown-node') 'unknown node result rejected'
  $badJson=Submit-RelayResultFile $x.run 'A' (Join-Path $PSScriptRoot 'fixtures/failures/result-badjson.json')
  Assert-True ($badJson.reason -eq 'unknown-enum:result_status') 'bad result enum rejected'
  $ckWrong=Submit-RelayCheckpointFile $x.run 'A' (Join-Path $PSScriptRoot 'fixtures/runner/checkpoints/ckpt-A1-wrong-session.json')
  Assert-True ($ckWrong.reason -eq 'identity-mismatch:session_id') 'checkpoint wrong session rejected'
  $ckAnswer=Submit-RelayCheckpointFile $x.run 'A' (Join-Path $PSScriptRoot 'fixtures/runner/checkpoints/ckpt-A1-answer-key.json')
  Assert-True ($ckAnswer.reason -eq 'unknown-field:answer') 'checkpoint answer key rejected'
  $ckBroken=Submit-RelayCheckpointFile $x.run 'A' (Join-Path $PSScriptRoot 'fixtures/failures/result-halfwritten.json')
  Assert-True ($ckBroken.reason -eq 'unparseable-checkpoint') 'halfwritten checkpoint rejected'
  $x=New-StartedRun;$stateBefore=[IO.File]::ReadAllBytes($x.run.paths.state);$emptyResult=Submit-RelayResultFile $x.run 'A' (Join-Path $PSScriptRoot 'fixtures/runner/results/result-empty.json');$emptyResultEvent=(Read-RelayEvents $x.run)[-1]
  Assert-True (-not $emptyResult.ok -and $emptyResult.reason -eq 'unparseable-result' -and $emptyResultEvent.kind -eq 'result_rejected' -and $emptyResultEvent.reason -eq 'unparseable-result' -and [Linq.Enumerable]::SequenceEqual([byte[]]$stateBefore,[byte[]][IO.File]::ReadAllBytes($x.run.paths.state))) 'empty result rejects without throw or state change'
  $x=New-StartedRun;$stateBefore=[IO.File]::ReadAllBytes($x.run.paths.state);$arrayResult=Submit-RelayResultFile $x.run 'A' (Join-Path $PSScriptRoot 'fixtures/runner/results/result-array.json');$arrayResultEvent=(Read-RelayEvents $x.run)[-1]
  Assert-True (-not $arrayResult.ok -and $arrayResult.reason -eq 'unparseable-result' -and $arrayResultEvent.kind -eq 'result_rejected' -and $arrayResultEvent.reason -eq 'unparseable-result' -and [Linq.Enumerable]::SequenceEqual([byte[]]$stateBefore,[byte[]][IO.File]::ReadAllBytes($x.run.paths.state))) 'array result rejects without throw or state change'
  $x=New-StartedRun;$stateBefore=[IO.File]::ReadAllBytes($x.run.paths.state);$emptyCheckpoint=Submit-RelayCheckpointFile $x.run 'A' (Join-Path $PSScriptRoot 'fixtures/runner/checkpoints/ckpt-empty.json');$emptyCheckpointEvent=(Read-RelayEvents $x.run)[-1]
  Assert-True (-not $emptyCheckpoint.ok -and $emptyCheckpoint.reason -eq 'unparseable-checkpoint' -and $emptyCheckpointEvent.kind -eq 'checkpoint_rejected' -and $emptyCheckpointEvent.reason -eq 'unparseable-checkpoint' -and [Linq.Enumerable]::SequenceEqual([byte[]]$stateBefore,[byte[]][IO.File]::ReadAllBytes($x.run.paths.state))) 'empty checkpoint rejects without throw or state change'
  $xProbe=New-StartedRun;$probeError=Apply-RelayObservation $xProbe.run 'A' @{ok=$false;probe_error=$true}
  Assert-True ($probeError.reason -eq 'probe-error') 'single probe error remains below threshold'

  $script:t=$script:t.AddMinutes(3);$work=Submit-RelayCheckpointFile $x.run 'A' (Join-Path $PSScriptRoot 'fixtures/runner/checkpoints/ckpt-A1-working.json')
  Assert-True $work.ok 'same state working checkpoint accepted'
  Assert-True (Test-Path (Join-Path $x.run.paths.attempts 'A/1/checkpoint.json')) 'checkpoint snapshot stored'
  Assert-True ((Read-RelayEvents $x.run)[-1].kind -eq 'checkpoint_accepted') 'checkpoint accepted event appended'
  Assert-True ($x.run.state.nodes.A.last_progress_at -eq $script:t.ToString('o')) 'checkpoint refreshes progress time'
  $dec=Submit-RelayCheckpointFile $x.run 'A' (Join-Path $PSScriptRoot 'fixtures/runner/checkpoints/ckpt-A1-decision.json');Assert-True ($dec.ok -and $x.run.state.nodes.A.result_status -eq 'decision_required') 'decision checkpoint projected'
  $follow=Submit-RelayCheckpointFile $x.run 'A' (Join-Path $PSScriptRoot 'fixtures/runner/checkpoints/ckpt-A1-working-followup.json');Assert-True ($follow.ok -and $x.run.state.nodes.A.result_status -eq 'working') 'working followup resumes projection'
  $done=Submit-RelayResultFile $x.run 'A' (Join-Path $PSScriptRoot 'fixtures/runner/results/result-A1-succeeded-review.json');Assert-True $done.ok 'final after decision sequence accepted'
  $closed=Submit-RelayCheckpointFile $x.run 'A' (Join-Path $PSScriptRoot 'fixtures/runner/checkpoints/ckpt-A1-working.json');Assert-True ($closed.reason -eq 'attempt-closed') 'checkpoint after final rejected'

  $x=New-StartedRun; $callsBefore=$x.adapter.calls.Count; $blocked=Submit-RelayResultFile $x.run 'A' (Join-Path $PSScriptRoot 'fixtures/runner/results/result-A1-blocked.json')
  Assert-True ($blocked.ok -and $x.run.state.nodes.A.scheduling -eq 'blocked' -and $x.run.state.replan_required) 'blocked result requests replan'
  Assert-True ($x.adapter.calls.Count -eq $callsBefore+1 -and $x.adapter.calls[-1].verb -eq 'stop') 'blocked ack followed by stop'
  Assert-True (@(Read-RelayEvents $x.run | Where-Object kind -eq 'result_accepted').Count -eq 1) 'blocked result accepted before stop return'
  $acceptedAt=[Array]::FindIndex([object[]]@(Read-RelayEvents $x.run),[Predicate[object]]{param($e)$e.kind -eq 'result_accepted'})+1
  Assert-True ($x.adapter.calls[-1].events_lines -ge $acceptedAt) 'stop call observes accepted result event already persisted'
  [void](Invoke-RelayTick $x.run);Assert-True ($x.run.state.nodes.A.terminal_state -eq 'exited' -and $x.run.state.nodes.A.task_state -eq 'active') 'blocked final probes stopped session to exited without pausing task'
  Assert-True (@(Get-RelayReadyNodes $x.run).Count -eq 0) 'replan required suppresses ready nodes'
  Assert-True (@($x.adapter.calls|Where-Object verb -in @('suspend','resume')).Count -eq 0) 'runner never invokes suspend or resume'
  $hits=@(Select-String -Path (Join-Path $PSScriptRoot '../runner/*.ps1'),(Join-Path $PSScriptRoot '../adapters/fake-adapter.ps1') -Pattern 'answer|question|options|input')
  Assert-True ($hits.Count -eq 0) 'runner and fake adapter expose no input API'
  $x=New-StartedRun;[void]$x.adapter.sessions.Remove('S-0001');$failedStop=Submit-RelayResultFile $x.run 'A' (Join-Path $PSScriptRoot 'fixtures/runner/results/result-A1-blocked.json')
  Assert-True ($failedStop.ok -and @(Read-RelayEvents $x.run|Where-Object{$_.kind-eq'observation'-and$_.reason-eq'stop-failed:unknown-session'}).Count -eq 1) 'blocked stop failure is recorded without changing accepted state'
} finally {foreach($root in $script:roots){if(Test-Path $root){Remove-Item -LiteralPath $root -Recurse -Force}}}
Write-Host "ASSERTIONS $script:assertions";if($script:failed){Write-Host "SUITE FAIL ($script:failed)";exit 1};Write-Host 'SUITE PASS';exit 0
