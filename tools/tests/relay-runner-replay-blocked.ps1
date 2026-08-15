$ErrorActionPreference='Stop';[Console]::OutputEncoding=[Text.Encoding]::UTF8;$script:failed=0;$script:assertions=0
function Assert-True([bool]$c,[string]$n){$script:assertions++;if($c){Write-Host "PASS  $n"}else{Write-Host "FAIL  $n";$script:failed++}}
. (Join-Path $PSScriptRoot '../runner/relay-replay.ps1')
$root=Join-Path ([IO.Path]::GetTempPath()) "relay-test-replay-blocked-$([guid]::NewGuid().ToString('N'))"
try{
  $fixtures=Join-Path $PSScriptRoot 'fixtures/runner';$out=Invoke-RelayReplay $fixtures (Join-Path $fixtures 'replay/blocked-replan.json') $root
  $sig=@(Get-RelayEventSignature $out.events -SkipHeartbeat)
  $expected=@('plan_proposed|-|-|-','plan_activated|-|-|-','launch_receipt|A|1|-','result_accepted|A|1|-','plan_proposed|-|-|-','plan_activated|-|-|-','launch_receipt|B|1|-','result_accepted|B|1|-','launch_receipt|A|2|-','result_accepted|A|2|-','result_stale|A|1|stale-plan')
  Assert-True (($sig-join"`n") -ceq ($expected-join"`n")) 'blocked replay full signature exact equality'
  $stop=@($out.adapter.calls|Where-Object{$_.verb-eq'stop'-and$_.session_id-eq'S-0001'});Assert-True ($stop.Count-eq1) 'blocked A1 exact session stopped'
  $events=@($out.events);$exitAt=-1;$active2At=-1;for($i=0;$i-lt$events.Count;$i++){if($events[$i].kind-eq'observation'-and$events[$i].terminal_state-eq'exited'-and$events[$i].identity.session_id-eq'S-0001'){$exitAt=$i};if($events[$i].kind-eq'plan_activated'-and$events[$i].identity.plan_version-eq2){$active2At=$i}}
  Assert-True ($exitAt-ge0-and$exitAt-lt$active2At) 'A1 exit observed before v2 activation'
  $r2=Read-RelayJson (Join-Path $out.run.paths.launches 'L-0002.json');$r3=Read-RelayJson (Join-Path $out.run.paths.launches 'L-0003.json')
  Assert-True ($r2.node_id-eq'B'-and$r2.authority_generation-eq2) 'v2 starts B as launch two'
  Assert-True ($r3.node_id-eq'A'-and$r3.attempt_id-eq2-and$r3.authority_generation-eq2) 'v2 starts fresh A attempt two'
  $a2Launch=@($out.adapter.calls|Where-Object{$_.verb-eq'launch'-and$_.session_id-eq'S-0003'})[0]
  Assert-True ($a2Launch.node_resume_from.node_id-eq'A'-and$a2Launch.node_resume_from.attempt_id-eq1) 'fresh A receives resume source'
  Assert-True ($out.state.nodes.A.attempt_id-eq2-and$out.state.nodes.A.result_status-eq'succeeded') 'A2 succeeds'
  Assert-True ($out.state.nodes.A.task_state-eq'active'-and$out.state.nodes.A.scheduling-eq'succeeded') 'A remains active overall after success'
  Assert-True ($out.state.nodes.B.scheduling-eq'succeeded'-and-not$out.state.replan_required) 'B succeeds and replan flag clears'
  Assert-True (@($events|Where-Object{$_.kind-eq'result_stale'-and$_.reason-eq'stale-plan'}).Count-eq1) 'late A1 produces stale plan event'
  $late=@($out.trace|Where-Object{$_.action-eq'submit_result'-and$_.tick-eq8})[0];Assert-True ($late.state_hash_before-eq$late.state_hash_after) 'late A1 leaves state bytes unchanged'
  Assert-True ((Get-FileHash (Join-Path $out.run.paths.attempts 'A/2/result.json')).Hash-eq$late.current_result_hash_after) 'late A1 leaves A2 final unchanged'
  Assert-True (@($out.adapter.calls|Where-Object{$_.verb-eq'stop'-and$_.session_id-eq'S-0003'}).Count-eq0) 'late A1 does not stop current session'
  Assert-True (@($out.adapter.calls|Where-Object{$_.verb-in@('suspend','resume')}).Count-eq0) 'replay never calls suspend or resume'
  $receipts=@(Get-ChildItem -LiteralPath $out.run.paths.launches -Filter '*.json');Assert-True ($receipts.Count-eq3) 'exactly three receipts'
  $sessions=@($receipts|ForEach-Object{(Read-RelayJson $_.FullName).session_id}|Sort-Object -Unique);Assert-True ($sessions.Count-eq3) 'receipt sessions are unique'
  Assert-True ($r3.session_id-ne'S-0001') 'fresh A session differs from A1'
  Assert-True ($out.trace[-1].reason-eq'stale-plan') 'trace records late stale reason'
}finally{if(Test-Path $root){Remove-Item -LiteralPath $root -Recurse -Force}}
Write-Host "ASSERTIONS $script:assertions";if($script:failed){Write-Host "SUITE FAIL ($script:failed)";exit 1};Write-Host 'SUITE PASS';exit 0
