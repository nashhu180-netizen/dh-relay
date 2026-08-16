$ErrorActionPreference = 'Stop'
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$script:failed = 0
$script:assertions = 0
function Assert-True([bool]$cond, [string]$name) {
  $script:assertions++
  if ($cond) { Write-Host "PASS  $name" } else { Write-Host "FAIL  $name"; $script:failed++ }
}
function Read-Fixture([string]$RelativePath) {
  Get-Content -Raw (Join-Path $PSScriptRoot "fixtures/runner/$RelativePath") | ConvertFrom-Json -AsHashtable -DateKind String
}
function New-TestRoot { Join-Path ([IO.Path]::GetTempPath()) "relay-test-authority-$([Guid]::NewGuid().ToString('N'))" }

. (Join-Path $PSScriptRoot '../contracts/relay-schema.ps1')
. (Join-Path $PSScriptRoot '../runner/relay-runner.ps1')
. (Join-Path $PSScriptRoot '../adapters/fake-adapter.ps1')

$clock = { [DateTimeOffset]::Parse('2026-08-15T09:00:00Z') }
$roots = [Collections.Generic.List[string]]::new()
try {
  $params = Import-PowerShellDataFile (Join-Path $PSScriptRoot '../contracts/relay-params.psd1')
  # DHR_03 K-16：params 由五键扩为八键（追加 IdleAfterSeconds/StopDeadlineSeconds/AttachDeadlineSeconds），守卫同步迁移并逐键点名
  Assert-True (($params.Keys.Count -eq 8) -and $params.ContainsKey('LaunchDeadlineSeconds') -and $params.ContainsKey('IdleAfterSeconds') -and $params.ContainsKey('StopDeadlineSeconds') -and $params.ContainsKey('AttachDeadlineSeconds')) 'params have eight keys including launch deadline and psmux keys'
  Assert-True ($params.LaunchDeadlineSeconds -is [int] -and $params.LaunchDeadlineSeconds -gt 0) 'launch deadline is positive integer'

  $root = New-TestRoot; $roots.Add($root); $adapter = New-RelayFakeAdapter (Read-Fixture 'adapter/launch-ok.json')
  $run = New-RelayRun $root 'RUN-FAKE-DHR02' $adapter $clock
  $v1 = Read-Fixture 'plans/plan-v1-single-A.json'
  $first = Submit-RelayProposal $run $v1 0
  Assert-True ($first.ok -and $first.authority_generation -eq 1) 'first proposal activates generation one'
  Assert-True (Test-RelayAuthority (Read-RelayAuthority $run)).ok 'authority validates'
  Assert-True (Test-RelayActivePlan (Read-RelayActivePlan $run)).ok 'active plan validates'
  Assert-True (Test-Path (Join-Path $run.paths.plans 'relay-plan.v1.proposal.json')) 'immutable proposal stored'
  $events = @(Read-RelayEvents $run)
  Assert-True (($events.kind -join ',') -eq 'plan_proposed,plan_activated') 'activation event order is deterministic'
  Assert-True ($events[0].occurred_at -eq ([DateTimeOffset]::Parse('2026-08-15T09:00:00Z')).ToString('o')) 'event occurred_at uses injected clock'
  $before = @($run.paths.active_plan,$run.paths.authority,$run.paths.state | ForEach-Object { (Get-FileHash -LiteralPath $_).Hash })
  $cas = Submit-RelayProposal $run $v1 0
  Assert-True (-not $cas.ok -and $cas.reason -eq 'proposal-rejected:cas-conflict') 'CAS conflict rejected'
  $after = @($run.paths.active_plan,$run.paths.authority,$run.paths.state | ForEach-Object { (Get-FileHash -LiteralPath $_).Hash })
  Assert-True (($before -join ',') -eq ($after -join ',')) 'CAS conflict leaves authority state bytes unchanged'
  Assert-True ((Read-RelayEvents $run)[-1].reason -eq 'proposal-rejected:cas-conflict') 'CAS rejection event recorded'
  Assert-True ((Submit-RelayProposal $run (Read-Fixture 'plans/plan-v3-skip.json') 1).reason -eq 'proposal-rejected:plan-version-not-next') 'skipped plan version rejected'
  Assert-True ((Submit-RelayProposal $run (Read-Fixture 'plans/plan-v1-wrong-run.json') 1).reason -eq 'proposal-rejected:wrong-run') 'wrong run rejected'
  Assert-True ((Submit-RelayProposal $run (Read-Fixture 'plans/plan-v2-bad-orchestrator.json') 1).reason -eq 'proposal-rejected:wrong-proposer') 'wrong proposer rejected'
  Assert-True ((Submit-RelayProposal $run (Read-Fixture 'plans/plan-v2-bad-drops-A.json') 1).reason -eq 'proposal-rejected:replan-incompatible:A') 'dropping old node rejected'
  $run.state.nodes.A.scheduling='blocked';$run.state.nodes.A.attempt_id=1;[void](Save-RelayState $run)
  Assert-True ((Submit-RelayProposal $run (Read-Fixture 'plans/plan-v2-bad-role.json') 1).reason -eq 'proposal-rejected:replan-incompatible:A') 'changed old role rejected'
  Assert-True ((Submit-RelayProposal $run (Read-Fixture 'plans/plan-v2-bad-next-action.json') 1).reason -eq 'proposal-rejected:replan-incompatible:A') 'changed old next action rejected'
  Assert-True ((Submit-RelayProposal $run (Read-Fixture 'plans/plan-v2-bad-resume-other.json') 1).reason -eq 'proposal-rejected:replan-incompatible:A') 'resume from another node rejected'
  Assert-True ((Submit-RelayProposal $run (Read-Fixture 'plans/plan-v2-bad-resume-attempt.json') 1).reason -eq 'proposal-rejected:replan-incompatible:A') 'resume from wrong attempt rejected'
  $second = Submit-RelayProposal $run (Read-Fixture 'plans/plan-v2-replan-B-before-A.json') 1
  Assert-True ($second.ok -and $run.state.nodes.ContainsKey('B')) 'compatible replan activates'

  $decRoot=New-TestRoot;$roots.Add($decRoot);$decRun=New-RelayRun $decRoot 'RUN-FAKE-DHR02-DEC' (New-RelayFakeAdapter (Read-Fixture 'adapter/decision.json')) $clock
  [void](Submit-RelayProposal $decRun (Read-Fixture 'plans/plan-v1-decision-ABC.json') 0)
  Assert-True ((Submit-RelayProposal $decRun (Read-Fixture 'plans/plan-v2-bad-dep-to-old.json') 1).reason -eq 'proposal-rejected:replan-incompatible:B') 'new dependency pointing to old node rejected at B'
  Assert-True ((Submit-RelayProposal $decRun (Read-Fixture 'plans/plan-v2-bad-drop-dep.json') 1).reason -eq 'proposal-rejected:replan-incompatible:C') 'dropping old dependency rejected at C'

  $openInvalidRoot=New-TestRoot;$roots.Add($openInvalidRoot);$openInvalidRun=New-RelayRun $openInvalidRoot 'RUN-FAKE-DHR02' (New-RelayFakeAdapter (Read-Fixture 'adapter/launch-ok.json')) $clock
  $openInvalidState=Read-RelayJson $openInvalidRun.paths.state;$openInvalidState.extra_key=1;[void](Write-RelayJsonAtomic $openInvalidRun.paths.state $openInvalidState)
  $openInvalidError='';try{[void](Open-RelayRun $openInvalidRoot 'RUN-FAKE-DHR02' $openInvalidRun.adapter $clock)}catch{$openInvalidError=$_.Exception.Message}
  Assert-True ($openInvalidError -like 'state-invalid:*') 'open run rejects invalid state snapshot'

  $submitInvalidRoot=New-TestRoot;$roots.Add($submitInvalidRoot);$submitInvalidRun=New-RelayRun $submitInvalidRoot 'RUN-FAKE-DHR02' (New-RelayFakeAdapter (Read-Fixture 'adapter/launch-ok.json')) $clock
  $submitInvalidRun.state.extra_key=1;$eventsBefore=@(Read-RelayEvents $submitInvalidRun).Count
  $submitInvalid=Submit-RelayProposal $submitInvalidRun $v1 0;$submitInvalidEvents=@(Read-RelayEvents $submitInvalidRun)
  Assert-True (-not $submitInvalid.ok -and $submitInvalid.reason -eq 'proposal-rejected:state-invalid') 'proposal rejects invalid candidate state'
  Assert-True (-not(Test-Path $submitInvalidRun.paths.authority) -and -not(Test-Path $submitInvalidRun.paths.active_plan)) 'invalid candidate writes no authority files'
  Assert-True (-not(Test-Path (Join-Path $submitInvalidRun.paths.plans 'relay-plan.v1.proposal.json'))) 'invalid candidate writes no proposal file'
  Assert-True ($submitInvalidEvents.Count -eq $eventsBefore+1 -and $submitInvalidEvents[-1].kind -eq 'plan_proposed' -and $submitInvalidEvents[-1].reason -eq 'proposal-rejected:state-invalid') 'invalid candidate records one rejection event'

  $badRoot=New-TestRoot;$roots.Add($badRoot);$badRun=New-RelayRun $badRoot 'RUN-FAKE-001' (New-RelayFakeAdapter (Read-Fixture 'adapter/launch-ok.json')) $clock
  $badHash=Get-Content -Raw (Join-Path $PSScriptRoot 'fixtures/plans/plan-v1-badhash.json')|ConvertFrom-Json -AsHashtable -DateKind String
  Assert-True ((Submit-RelayProposal $badRun $badHash 0).reason -eq 'proposal-rejected:plan-hash-mismatch' -and -not(Test-Path $badRun.paths.active_plan)) 'bad plan hash rejected before activation'
  $immutableRoot=New-TestRoot;$roots.Add($immutableRoot);$immutableRun=New-RelayRun $immutableRoot 'RUN-FAKE-DHR02' (New-RelayFakeAdapter (Read-Fixture 'adapter/launch-ok.json')) $clock
  Copy-Item (Join-Path $PSScriptRoot 'fixtures/runner/plans/plan-v1-single-A-variant.json') (Join-Path $immutableRun.paths.plans 'relay-plan.v1.proposal.json')
  Assert-True ((Submit-RelayProposal $immutableRun $v1 0).reason -eq 'proposal-rejected:proposal-immutable') 'existing different proposal is immutable when CAS passes'

  $root2 = New-TestRoot; $roots.Add($root2); $adapter2 = New-RelayFakeAdapter (Read-Fixture 'adapter/launch-ok.json')
  $run2 = New-RelayRun $root2 'RUN-FAKE-DHR02' $adapter2 $clock
  [void](Submit-RelayProposal $run2 $v1 0)
  Assert-True ((Get-RelayReadyNodes $run2) -join ',' -eq 'A') 'single node is ready'
  $started = Start-RelayNodeAttempt $run2 'A'
  Assert-True ($started.ok -and $started.launch_id -eq 'L-0001' -and $started.session_id -eq 'S-0001' -and $started.attempt_id -eq 1) 'first attempt identifiers deterministic'
  Assert-True ($run2.state.nodes.A.terminal_state -eq 'launching') 'launch projects launching before first tick'
  $reopened=Open-RelayRun $root2 'RUN-FAKE-DHR02' $adapter2 $clock
  Assert-True (($reopened.state|ConvertTo-Json -Depth 20 -Compress) -ceq ((Read-RelayJson $run2.paths.state)|ConvertTo-Json -Depth 20 -Compress)) 'open run restores state exactly from file'
  $receipt = Read-RelayJson (Join-Path $run2.paths.launches 'L-0001.json')
  Assert-True ((Test-RelayLaunchReceipt $receipt).ok -and $receipt.backend -eq 'fake') 'receipt validates with fake backend'
  Assert-True ($receipt.launch_deadline_at -eq '2026-08-15T09:02:00.0000000+00:00') 'launch deadline derived from injected clock'
  Assert-True ($adapter2.calls[0].verb -eq 'launch' -and $adapter2.calls[0].receipt_present) 'receipt exists before adapter launch'
  Assert-True ((Read-RelayEvents $run2).kind -contains 'launch_receipt') 'launch receipt event exists'
  Assert-True ((Start-RelayNodeAttempt $run2 'A').reason -eq 'node-not-ready') 'launched node cannot start again'

  foreach ($case in @(@('launch-mismatch.json','launch-handle-mismatch'),@('launch-fail.json','adapter-launch-failed:fake-launch-failed'))) {
    $caseRoot = New-TestRoot; $roots.Add($caseRoot); $caseAdapter = New-RelayFakeAdapter (Read-Fixture "adapter/$($case[0])")
    $caseRun = New-RelayRun $caseRoot 'RUN-FAKE-DHR02' $caseAdapter $clock; [void](Submit-RelayProposal $caseRun $v1 0)
    $caseResult = Start-RelayNodeAttempt $caseRun 'A'; $last = (Read-RelayEvents $caseRun)[-1]
    Assert-True (-not $caseResult.ok -and $caseRun.state.nodes.A.terminal_state -eq 'unknown' -and $caseRun.state.nodes.A.task_state -eq 'paused') "$($case[0]) fail closes"
    Assert-True ($last.kind -eq 'launch_failed' -and $last.reason -eq $case[1]) "$($case[0]) reason recorded"
    Assert-True ($caseRun.state.nodes.A.pause_reason -eq 'launch-failed') "$($case[0]) pause reason is launch-failed"
    if ($case[0] -eq 'launch-mismatch.json') { Assert-True ($last.reason -eq 'launch-handle-mismatch') 'launch handle mismatch literal covered' }
    if ($case[0] -eq 'launch-fail.json') { Assert-True ($last.reason -eq 'adapter-launch-failed:fake-launch-failed') 'adapter and fake launch failure literals covered' }
  }
  $keys = @($adapter.Keys | Sort-Object) -join ','
  Assert-True ($keys -eq 'backend,calls,emit_observation,launch,probe,resume,sessions,stop,suspend') 'fake adapter has exactly nine keys'
  $badState = Read-RelayJson $run2.paths.state; $badState.nodes.A.completed = $true
  Assert-True ((Test-RelayStateSnapshot $badState).reason -eq 'unknown-field:completed') 'state rejects unknown completion field'
  $badState = Read-RelayJson $run2.paths.state; $badState.nodes.A.task_state = 'done'
  Assert-True ((Test-RelayStateSnapshot $badState).reason -eq 'unknown-enum:task_state') 'state rejects done task state'
  $createPath = Join-Path $root2 'create-new.json'; [void](Write-RelayJsonCreateNew $createPath @{ value='FAKE' })
  Assert-True ((Write-RelayJsonCreateNew $createPath @{ value='FAKE2' }).reason -eq 'file-exists') 'create new refuses overwrite'
  Assert-True ((Read-RelayEvents $run2)[0].event_id -eq 'EV-RUN-FAKE-DHR02-000001') 'event id is deterministic'
  $script:advancedClock=[DateTimeOffset]::Parse('2026-08-15T09:01:00Z');$clock2={$script:advancedClock};$run2.clock=$clock2
  [void](Add-RelayEvent $run2 'observation' (Get-RelayNodeIdentity $run2 'A') '' @{terminal_state='launching'})
  Assert-True ((Read-RelayEvents $run2)[-1].occurred_at -eq $script:advancedClock.ToString('o')) 'event occurred_at changes with stepped injected clock'
  $planNode=(Read-RelayActivePlanBody $run2).nodes[0]
  $exhausted=& $adapter2.launch $receipt $planNode $run2
  Assert-True ($exhausted.reason -eq 'fake-script-exhausted') 'fake launch script exhaustion rejected'
  $unknownProbe=& $adapter2.probe 'S-UNKNOWN-FAKE'
  Assert-True ($unknownProbe.reason -eq 'unknown-session') 'fake unknown session rejected'
  $unused=& $adapter2.suspend 'S-0001'
  Assert-True ($unused.reason -eq 'not-used-in-p1') 'unused P1 adapter verb rejected'
  $emptyAdapter=New-RelayFakeAdapter (Read-Fixture 'adapter/empty-tape.json');[void](& $emptyAdapter.launch $receipt $planNode $run2);$empty=& $emptyAdapter.probe 'S-0001'
  Assert-True ($empty.reason -eq 'empty-fake-tape') 'empty fake tape fails closed'
  $failAdapter=New-RelayFakeAdapter (Read-Fixture 'adapter/launch-fail.json');$directFail=& $failAdapter.launch $receipt $planNode $run2
  Assert-True ($directFail.reason -eq 'fake-launch-failed') 'fake adapter exposes launch failure reason'
  $eventError='';try{[void](Add-RelayEvent $run2 'FAKE-invalid-kind' @{})}catch{$eventError=$_.Exception.Message}
  Assert-True ($eventError -like 'event-invalid:*') 'invalid internal event throws event-invalid'
  $invalidRun=$run2.Clone();$invalidRun.state=Read-RelayJson $run2.paths.state;$invalidRun.state.extra='FAKE';$stateError='';try{[void](Save-RelayState $invalidRun)}catch{$stateError=$_.Exception.Message}
  Assert-True ($stateError -like 'state-invalid:*') 'invalid internal state throws state-invalid'
} finally {
  foreach ($root in $roots) { if (Test-Path -LiteralPath $root) { Remove-Item -LiteralPath $root -Recurse -Force } }
}
Write-Host "ASSERTIONS $script:assertions"
if ($script:failed -gt 0) { Write-Host "SUITE FAIL ($script:failed)"; exit 1 }
Write-Host 'SUITE PASS'; exit 0
