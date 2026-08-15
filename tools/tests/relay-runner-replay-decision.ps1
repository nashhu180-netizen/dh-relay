$ErrorActionPreference='Stop';[Console]::OutputEncoding=[Text.Encoding]::UTF8;$script:failed=0;$script:assertions=0
function Assert-True([bool]$c,[string]$n){$script:assertions++;if($c){Write-Host "PASS  $n"}else{Write-Host "FAIL  $n";$script:failed++}}
function Copy-State($s){$s|ConvertTo-Json -Depth 20|ConvertFrom-Json -AsHashtable -DateKind String}
. (Join-Path $PSScriptRoot '../runner/relay-replay.ps1')
$root=Join-Path ([IO.Path]::GetTempPath()) "relay-test-replay-decision-$([guid]::NewGuid().ToString('N'))"
try{
  $fixtures=Join-Path $PSScriptRoot 'fixtures/runner';$ctx=New-RelayReplayContext $fixtures (Join-Path $fixtures 'replay/decision.json') $root;$snap=@{}
  1..10|ForEach-Object{[void](Invoke-RelayReplayTick $ctx);$snap[$_]=Copy-State $ctx.run.state}
  Assert-True ($snap[1].nodes.A.scheduling-eq'launched'-and$snap[1].nodes.B.scheduling-eq'launched') 'A and B launch in same first tick'
  Assert-True ($snap[1].nodes.C.scheduling-eq'waiting') 'dependent C initially waits'
  Assert-True ($snap[3].nodes.A.result_status-eq'decision_required') 'decision checkpoint accepted at tick three'
  Assert-True (($snap[3].nodes.C.frozen_by-join',')-eq'A') 'decision freezes dependent C'
  Assert-True ($snap[3].nodes.B.scheduling-eq'launched') 'independent B continues during decision'
  Assert-True ('C'-notin@(Get-RelayReadyNodes $ctx.run)) 'C not ready while A unresolved'
  $wrong=@($ctx.run|ForEach-Object{Read-RelayEvents $_}|Where-Object{$_.kind-eq'checkpoint_rejected'-and$_.reason-eq'identity-mismatch:session_id'});Assert-True ($wrong.Count-eq1) 'wrong session followup rejected'
  Assert-True ($snap[4].nodes.A.result_status-eq'decision_required'-and($snap[4].nodes.C.frozen_by-join',')-eq'A') 'wrong followup leaves decision and freeze intact'
  Assert-True ($snap[5].nodes.B.scheduling-eq'succeeded') 'independent B succeeds while A waits'
  Assert-True ($snap[4].nodes.A.terminal_state-eq'idle'-and$snap[5].nodes.A.terminal_state-eq'idle') 'A remains idle during decision wait'
  Assert-True ($snap[6].nodes.A.terminal_state-eq'running') 'host tape observes natural new turn'
  Assert-True (@($ctx.adapter.calls|Where-Object{$_.verb-in@('resume','suspend')}).Count-eq0) 'no resume or suspend call'
  Assert-True ($snap[7].nodes.A.result_status-eq'working') 'same session working followup accepted'
  Assert-True (@($snap[7].nodes.C.frozen_by).Count-eq0) 'working followup unfreezes C'
  $receipt=Read-RelayJson (Join-Path $ctx.run.paths.launches 'L-0003.json');Assert-True ($snap[8].nodes.C.scheduling-eq'launched'-and$receipt.node_id-eq'C') 'A success launches C in same tick'
  Assert-True ($snap[10].nodes.C.scheduling-eq'succeeded') 'C succeeds at tick ten'
  Assert-True (@('A','B','C'|Where-Object{$snap[10].nodes[$_].scheduling-ne'succeeded'}).Count-eq0) 'all nodes end succeeded'
  Assert-True (@('A','B','C'|Where-Object{$snap[10].nodes[$_].task_state-ne'active'}).Count-eq0) 'all tasks remain active overall'
  $events=@(Read-RelayEvents $ctx.run);$sig=@(Get-RelayEventSignature $events -SkipHeartbeat)
  $expected=@('plan_proposed|-|-|-','plan_activated|-|-|-','launch_receipt|A|1|-','launch_receipt|B|1|-','checkpoint_accepted|A|1|-','checkpoint_rejected|A|1|identity-mismatch:session_id','result_accepted|B|1|-','checkpoint_accepted|A|1|-','result_accepted|A|1|-','launch_receipt|C|1|-','result_accepted|C|1|-')
  Assert-True (($sig-join"`n") -ceq ($expected-join"`n")) 'decision replay full signature exact equality'
  Assert-True (@($events|Where-Object{$_.kind-match'answer|user'}).Count-eq0) 'events contain no answer or user kind'
  Assert-True (@($events|Where-Object{-not(Test-RelayEvent $_).ok}).Count-eq0) 'all replay events validate'
  Assert-True ((Read-RelayJson (Join-Path $ctx.run.paths.attempts 'A/1/checkpoint.json')).status-eq'working') 'latest checkpoint snapshot is working'
  $hits=@(Select-String -Path (Join-Path $PSScriptRoot '../runner/relay-replay.ps1'),(Join-Path $PSScriptRoot '../adapters/fake-adapter.ps1') -Pattern 'answer|question|options|input');Assert-True ($hits.Count-eq0) 'replay and fake adapter expose no input API'
}finally{if(Test-Path $root){Remove-Item -LiteralPath $root -Recurse -Force}}
Write-Host "ASSERTIONS $script:assertions";if($script:failed){Write-Host "SUITE FAIL ($script:failed)";exit 1};Write-Host 'SUITE PASS';exit 0
