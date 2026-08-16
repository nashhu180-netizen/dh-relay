<#
.SYNOPSIS
  DHR_03 A3「迟到结果」判据（K-13）：拿 A attempt 1 的旧 receipt，用 relay-agent-tool 生成一份内容合法的 succeeded result，
  走真实入口 Submit-RelayResultFile 提交；期望事件 result_stale（stale-plan / stale-generation），且 relay-state.json /
  active-plan.json / authority.json 字节不变。不直接改 state、不用测试桩。
.EXAMPLE
  pwsh tools/relay/dogfood/Invoke-LateResultCheck.ps1 -Root .dh-runtime/relay -RunId RELAY-DF-BLOCKED-<ts> -Out docs/modules/dh-relay/workspace/DHR_03/evidence/blocked
#>
[CmdletBinding()]
param(
  [Parameter(Mandatory)][string]$Root,
  [Parameter(Mandatory)][string]$RunId,
  [string]$NodeId='A',
  [int]$AttemptId=1,
  [string]$Out
)
$ErrorActionPreference='Stop';[Console]::OutputEncoding=[Text.Encoding]::UTF8
. (Join-Path $PSScriptRoot '../runner/relay-runner.ps1')
. (Join-Path $PSScriptRoot '../adapters/fake-adapter.ps1')
$paths=Get-RelayRunPaths $Root $RunId
$run=Open-RelayRun ([IO.Path]::GetFullPath($Root)) $RunId (New-RelayFakeAdapter @{launches=@()}) {[DateTimeOffset]::UtcNow}
$node=$run.state.nodes[$NodeId];if($null-eq$node){throw "unknown node $NodeId"}
$oldLaunch=@(Get-ChildItem -LiteralPath $paths.launches -Filter '*.json' -File|Where-Object{$r=Get-Content -LiteralPath $_.FullName -Raw|ConvertFrom-Json;$r.node_id-ceq$NodeId-and$r.attempt_id-eq$AttemptId})
if($oldLaunch.Count-ne1){throw "expected exactly one receipt for $NodeId/$AttemptId, found $($oldLaunch.Count)"}
$receiptPath=$oldLaunch[0].FullName
$before=@{};foreach($k in 'state','active_plan','authority'){$before[$k]=(Get-FileHash -LiteralPath $paths[$k] -Algorithm SHA256).Hash}
$eventsBefore=@(Read-RelayEvents $run).Count
# 1. 用旧 receipt 让工具生成合法 result（写到 attempts/<node>/<attempt>/result.json.tmp；该目录已有已提交的 result.json 不受影响）
$tmpDir=Join-Path ([IO.Path]::GetTempPath()) "relay-late-$([guid]::NewGuid().ToString('N'))";[void](New-Item -ItemType Directory -Path $tmpDir)
$body=Join-Path $tmpDir 'handoff-body.md';[IO.File]::WriteAllText($body,"late result from stale attempt $NodeId/$AttemptId (A3 check)`n",[Text.UTF8Encoding]::new($false))
$tool=[IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../host/relay-agent-tool.ps1'))
$oldReceipt=$env:RELAY_RECEIPT
try{
  $env:RELAY_RECEIPT=$receiptPath
  # 先备份 attempt 目录里旧的 handoff/tail（工具会覆写它们）
  $attemptDir=Join-Path $paths.attempts "$NodeId/$AttemptId";$backup=Join-Path $tmpDir 'attempt-backup';[void](New-Item -ItemType Directory -Path $backup)
  foreach($n in 'handoff.md','session-tail.txt'){$p=Join-Path $attemptDir $n;if(Test-Path $p){Copy-Item -LiteralPath $p -Destination (Join-Path $backup $n)}}
  $toolOut=@(& pwsh -NoProfile -File $tool result -Status succeeded -Summary 'LATE stale attempt result (A3 check)' -NextAction none -HandoffBody $body 2>&1);$toolExit=$LASTEXITCODE
  Write-Host "[late-check] tool exit=$toolExit $($toolOut-join' | ')"
  if($toolExit-ne0){throw 'agent tool failed to produce a valid late result'}
  $lateFile=Join-Path $attemptDir 'result.json.tmp';if(-not(Test-Path $lateFile)){throw 'late result.json.tmp missing'}
  $lateValue=Read-RelayJson $lateFile;$schema=Test-RelayResult $lateValue;Write-Host "[late-check] late result schema ok=$($schema.ok) plan_version=$($lateValue.plan_version) generation=$($lateValue.authority_generation) attempt=$($lateValue.attempt_id) session=$($lateValue.session_id)"
  # 2. 真实入口提交
  $submit=Submit-RelayResultFile $run $NodeId $lateFile
  Write-Host "[late-check] Submit-RelayResultFile ok=$($submit.ok) verdict=$($submit.verdict) reason=$($submit.reason)"
  # 恢复 attempt 目录被覆写的交接/tail，删掉迟到 tmp
  foreach($n in 'handoff.md','session-tail.txt'){$b=Join-Path $backup $n;if(Test-Path $b){Copy-Item -LiteralPath $b -Destination (Join-Path $attemptDir $n) -Force}}
  Remove-Item -LiteralPath $lateFile -Force -ErrorAction SilentlyContinue
}finally{if($null-eq$oldReceipt){Remove-Item Env:RELAY_RECEIPT -ErrorAction SilentlyContinue}else{$env:RELAY_RECEIPT=$oldReceipt}}
# 3. 断言
$events=@(Read-RelayEvents $run);$last=$events[-1]
$after=@{};foreach($k in 'state','active_plan','authority'){$after[$k]=(Get-FileHash -LiteralPath $paths[$k] -Algorithm SHA256).Hash}
$checks=@(
  @{id='L1';pass=(-not$submit.ok);detail="submit rejected ok=$($submit.ok)"}
  @{id='L2';pass=($last.kind-ceq'result_stale'-and$last.reason-cin@('stale-plan','stale-generation'));detail="last event kind=$($last.kind) reason=$($last.reason) node=$($last.identity.node_id) attempt=$($last.identity.attempt_id)"}
  @{id='L3';pass=($events.Count-eq$eventsBefore+1);detail="events $eventsBefore -> $($events.Count) (exactly one new event)"}
  @{id='L4';pass=($before.state-ceq$after.state-and$before.active_plan-ceq$after.active_plan-and$before.authority-ceq$after.authority);detail="relay-state/active-plan/authority sha256 unchanged=$($before.state-ceq$after.state)/$($before.active_plan-ceq$after.active_plan)/$($before.authority-ceq$after.authority)"}
  @{id='L5';pass=((Get-Content -LiteralPath (Join-Path $paths.attempts "$NodeId/$AttemptId/result.json") -Raw|ConvertFrom-Json).result_status-ceq'dependency_blocked');detail="committed result.json of $NodeId/$AttemptId still dependency_blocked (final immutable)"}
)
$allPass=$true;foreach($c in $checks){$flag=if($c.pass){'PASS'}else{'FAIL';$allPass=$false};Write-Host "$flag $($c.id)  $($c.detail)"}
$report=@{run_id=$RunId;node_id=$NodeId;attempt_id=$AttemptId;receipt=$receiptPath;submit=$submit;last_event=$last;checks=$checks;hashes_before=$before;hashes_after=$after;checked_at=[DateTimeOffset]::UtcNow.ToString('o')}
if($Out){[void](New-Item -ItemType Directory -Path $Out -Force);$reportPath=Join-Path $Out 'late-result-check.json';[IO.File]::WriteAllText($reportPath,($report|ConvertTo-Json -Depth 20),[Text.UTF8Encoding]::new($false));Write-Host "report $reportPath";Copy-Item -LiteralPath $paths.events -Destination (Join-Path $Out 'events.jsonl') -Force}
Remove-Item -LiteralPath $tmpDir -Recurse -Force -ErrorAction SilentlyContinue
Write-Host "RESULT late-result-check: $(if($allPass){'ALL PASS'}else{'HAS FAIL'})";exit $(if($allPass){0}else{3})
