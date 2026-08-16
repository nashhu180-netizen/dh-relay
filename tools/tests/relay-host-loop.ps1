$ErrorActionPreference='Stop';[Console]::OutputEncoding=[Text.Encoding]::UTF8;$script:failed=0;$script:assertions=0
function Assert-True([bool]$Condition,[string]$Name){$script:assertions++;if($Condition){Write-Host "PASS  $Name"}else{Write-Host "FAIL  $Name";$script:failed++}}
function Copy-Fixture([string]$Relative,[string]$Destination){$parent=Split-Path -Parent $Destination;if(-not(Test-Path $parent)){[void](New-Item -ItemType Directory -Path $parent -Force)};Copy-Item -LiteralPath (Join-Path $fixtures $Relative) -Destination $Destination -Force}
. (Join-Path $PSScriptRoot '../adapters/fake-adapter.ps1')
. (Join-Path $PSScriptRoot '../host/relay-host.ps1')
$fixtures=Join-Path $PSScriptRoot 'fixtures/host';$root=Join-Path ([IO.Path]::GetTempPath()) "relay-test-host-$([guid]::NewGuid().ToString('N'))"
try{
  $script:clockAt=[DateTimeOffset]::Parse('2026-08-15T00:00:00Z');$clock={$script:clockAt=$script:clockAt.AddSeconds(1);$script:clockAt}
  $adapter=New-RelayFakeAdapter @{launches=@(
    @{launch_result='ok';probes=@('running','running','running','running','running');host_observations=@();on_stop='exited'},
    @{launch_result='ok';probes=@('running','running','running','running');host_observations=@();on_stop='exited'},
    @{launch_result='ok';probes=@('running','running','running');host_observations=@();on_stop='exited'},
    @{launch_result='ok';probes=@('running','running','running');host_observations=@();on_stop='exited'}
  )}
  $script:orchestratorCalls=0;$script:replannerCalls=0
  $orchestrator={param($Run)$script:orchestratorCalls++;Copy-Fixture 'inbox/proposal-v1.json' (Join-Path $Run.paths.root 'inbox/proposal-v1.json')}
  $replanner={param($Run)$script:replannerCalls++;Copy-Fixture 'inbox/proposal-v2.json' (Join-Path $Run.paths.root 'inbox/proposal-v2.json')}
  $ctx=New-RelayHostContext @{Root=$root;RunId='FAKE-HOST';Adapter=$adapter;Clock=$clock;TickSeconds=0;MaxTicks=30;OrchestratorSpawner=$orchestrator;ReplannerSpawner=$replanner}

  $t1=Invoke-RelayHostTick $ctx
  Assert-True ($script:orchestratorCalls-eq1-and$t1.spawned-ccontains'orchestrator') 'first tick spawns orchestrator exactly once'
  Assert-True (-not$t1.done-and(Test-Path (Join-Path $ctx.run.paths.root 'inbox/proposal-v1.json'))) 'spawned proposal keeps host active'
  $t2=Invoke-RelayHostTick $ctx;$events=Read-RelayEvents $ctx.run
  Assert-True ($ctx.run.state.plan_version-eq1-and@($events|Where-Object kind -CEQ 'plan_activated').Count-eq1) 'next tick CAS activates proposal v1'
  Assert-True (@(Get-ChildItem (Join-Path $ctx.run.paths.root 'inbox') -Filter 'proposal-v1.json.consumed-*').Count-eq1) 'proposal is renamed consumed'
  Assert-True ($ctx.run.state.nodes.A.scheduling-ceq'launched'-and@($events|Where-Object kind -CEQ 'launch_receipt').Count-eq1) 'ready A launches after activation'

  $a1=Join-Path $ctx.run.paths.attempts 'A/1'
  Copy-Fixture 'tmp/checkpoint-A1-working.json.tmp' (Join-Path $a1 'checkpoint.json.tmp');$t3=Invoke-RelayHostTick $ctx
  Assert-True (@(Read-RelayEvents $ctx.run|Where-Object kind -CEQ 'checkpoint_accepted').Count-eq1) 'working checkpoint is ingested'
  Assert-True (@(Get-ChildItem $a1 -Filter 'checkpoint.json.tmp.consumed-*').Count-eq1) 'checkpoint tmp is renamed consumed'
  Copy-Fixture 'tmp/checkpoint-A1-decision.json.tmp' (Join-Path $a1 'checkpoint.json.tmp');$t4=Invoke-RelayHostTick $ctx
  Assert-True ($ctx.run.state.nodes.A.result_status-ceq'decision_required') 'decision checkpoint is projected'
  Assert-True (($ctx.run.state.nodes.C.frozen_by-join',')-ceq'A') 'decision freezes dependent C'

  Copy-Fixture 'tmp/result-A1-blocked.json.tmp' (Join-Path $a1 'result.json.tmp');$t5=Invoke-RelayHostTick $ctx
  Assert-True ($ctx.run.state.replan_required-and$ctx.run.state.nodes.A.scheduling-ceq'blocked') 'blocked result requests replan'
  Assert-True (@($adapter.calls|Where-Object{$_.verb-ceq'stop'-and$_.session_id-ceq'S-0001'}).Count-eq1) 'blocked result stops exact A session'
  Assert-True (@(Get-ChildItem $a1 -Filter 'result.json.tmp.consumed-*').Count-eq1) 'blocked result tmp is renamed consumed'
  Assert-True ($script:replannerCalls-eq1-and$t5.spawned-ccontains'replanner') 'replanner spawns once for generation one'

  $t6=Invoke-RelayHostTick $ctx;$t7=Invoke-RelayHostTick $ctx;$t8=Invoke-RelayHostTick $ctx
  Assert-True ($ctx.run.state.plan_version-eq2-and-not$ctx.run.state.replan_required) 'proposal v2 activates and clears replan flag'
  Assert-True ($script:replannerCalls-eq1) 'replanner remains deduplicated across later ticks'
  Assert-True ($ctx.run.state.nodes.B.scheduling-ceq'launched') 'v2 launches new prerequisite B'
  Assert-True (@($adapter.calls|Where-Object{$_.verb-ceq'launch'-and$_.session_id-ceq'S-0002'}).Count-eq1) 'B launch is recorded by adapter'

  $b1=Join-Path $ctx.run.paths.attempts 'B/1';Copy-Fixture 'tmp/result-B1-succeeded.json.tmp' (Join-Path $b1 'result.json.tmp');$t9=Invoke-RelayHostTick $ctx
  Assert-True ($ctx.run.state.nodes.B.scheduling-ceq'succeeded'-and$ctx.run.state.nodes.A.attempt_id-eq2) 'B success launches fresh A attempt two'
  $a2Launch=@($adapter.calls|Where-Object{$_.verb-ceq'launch'-and$_.session_id-ceq'S-0003'})[0]
  Assert-True ($a2Launch.node_resume_from.node_id-ceq'A'-and$a2Launch.node_resume_from.attempt_id-eq1) 'fresh A receives resume_from identity'
  $a2=Join-Path $ctx.run.paths.attempts 'A/2';Copy-Fixture 'tmp/result-A2-succeeded.json.tmp' (Join-Path $a2 'result.json.tmp');$t10=Invoke-RelayHostTick $ctx
  Assert-True ($ctx.run.state.nodes.A.scheduling-ceq'succeeded'-and$ctx.run.state.nodes.C.scheduling-ceq'launched') 'A2 success launches dependent C'

  $c1=Join-Path $ctx.run.paths.attempts 'C/1';Copy-Fixture 'tmp/result-bad.json.tmp' (Join-Path $c1 'result.json.tmp');$t11=Invoke-RelayHostTick $ctx
  $rejectedBefore=@(Read-RelayEvents $ctx.run|Where-Object kind -CEQ 'result_rejected').Count
  Assert-True ($rejectedBefore-eq1-and@(Get-ChildItem $c1 -Filter 'result.json.tmp.consumed-*').Count-eq1) 'bad result is rejected and still consumed'
  $t12=Invoke-RelayHostTick $ctx;$rejectedAfter=@(Read-RelayEvents $ctx.run|Where-Object kind -CEQ 'result_rejected').Count
  Assert-True ($rejectedAfter-eq$rejectedBefore) 'consumed bad result is not ingested twice'
  Copy-Fixture 'tmp/result-C1-succeeded.json.tmp' (Join-Path $c1 'result.json.tmp');$t13=Invoke-RelayHostTick $ctx
  Assert-True ($t13.done-and@('A','B','C'|Where-Object{$ctx.run.state.nodes[$_].scheduling-cne'succeeded'}).Count-eq0) 'all succeeded makes host tick terminal'
  Assert-True ((Invoke-RelayHost $ctx)-eq0) 'host loop returns 0 when terminal'

  $allTicks=@($t1,$t2,$t3,$t4,$t5,$t6,$t7,$t8,$t9,$t10,$t11,$t12,$t13)
  Assert-True (@($allTicks|Where-Object{[string]::IsNullOrWhiteSpace($_.status_line)-or$_.status_line-notmatch'^\[relay-host\] tick='}).Count-eq0) 'every tick returns one status line'
  $hostState=Get-Content -LiteralPath (Join-Path $ctx.run.paths.root 'host-state.json') -Raw|ConvertFrom-Json -AsHashtable -DateKind String
  Assert-True ((@($hostState.Keys|Sort-Object)-join',')-ceq'consumed,orchestrator_spawned,replanner_spawned_for_generation,tick') 'host state has exactly four contract fields'
  Assert-True ($hostState.orchestrator_spawned-and$hostState.replanner_spawned_for_generation-eq1) 'host state persists spawner generations'
  Assert-True ($hostState.consumed.Count-ge8) 'host state records consumed artifact paths'

  $timeline=Join-Path $root 'timeline.md';Export-RelayTimeline $ctx.run $timeline $null;$timelineLines=@(Get-Content -LiteralPath $timeline)
  Assert-True ((Test-Path $timeline)-and$timelineLines.Count-eq(@(Read-RelayEvents $ctx.run).Count+2)) 'timeline has two header lines plus one row per event'
  Assert-True ($timelineLines[-1]-match'EV-FAKE-HOST-' -and$timelineLines[-1]-match'\|') 'timeline rows include event identity columns'

  $timeoutAdapter=New-RelayFakeAdapter @{launches=@()};$timeout=New-RelayHostContext @{Root=$root;RunId='FAKE-TIMEOUT';Adapter=$timeoutAdapter;Clock=$clock;TickSeconds=0;MaxTicks=1}
  Assert-True ((Invoke-RelayHost $timeout)-eq2) 'MaxTicks returns 2 for unfinished run'
  # R1-04/R2-08：宿主 done 但有 paused 节点（launch 失败）→ Invoke-RelayHost 返回 3，不许把失败当成功返 0
  $pausedAdapter=New-RelayFakeAdapter @{launches=@(@{launch_result='fail';probes=@();host_observations=@();on_stop='exited'})}
  $paused=New-RelayHostContext @{Root=(Join-Path $root 'paused');RunId='FAKE-HOST';Adapter=$pausedAdapter;Clock=$clock;TickSeconds=0;MaxTicks=6;OrchestratorSpawner=$orchestrator}
  $pausedCode=Invoke-RelayHost $paused;$pausedOutcome=Get-RelayHostOutcome $paused $true
  Assert-True ($paused.run.state.nodes.A.scheduling-ceq'paused'-and$paused.run.state.nodes.A.pause_reason-ceq'launch-failed') 'failed launch pauses node A'
  Assert-True ($pausedCode-eq3-and-not$pausedOutcome.all_succeeded-and@($pausedOutcome.unfinished|Where-Object{$_-clike'A=paused/launch-failed'}).Count-eq1) 'host loop returns 3 when done with a paused node (R1-04)'
  Assert-True ((Get-RelayHostOutcome $ctx $true).exit_code-eq0-and(Get-RelayHostOutcome $ctx $false).exit_code-eq2) 'outcome maps all-succeeded to 0 and not-done to 2'
  # R1-06：禁词静态扫描覆盖宿主、worker 入口与 dogfood 包装三个文件，模式含终端按键注入命令
  $sourceHits=@(Select-String -Path (Join-Path $PSScriptRoot '../host/relay-host.ps1'),(Join-Path $PSScriptRoot '../host/relay-worker-entry.ps1'),(Join-Path $PSScriptRoot '../host/run-dogfood.ps1') -Pattern '\.resume\b|\.suspend\b|question|options|answer|send-keys|paste-buffer|load-buffer')
  Assert-True ($sourceHits.Count-eq0) 'host, worker entry and dogfood wrapper expose no forbidden control or input path'
}finally{if(Test-Path $root){Remove-Item -LiteralPath $root -Recurse -Force}}
Write-Host "ASSERTIONS $script:assertions";if($script:failed){Write-Host "SUITE FAIL ($script:failed)";exit 1};Write-Host 'SUITE PASS';exit 0
