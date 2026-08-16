<#
.SYNOPSIS
  DHR_03 dogfood 场景包装：真实 psmux adapter + 宿主循环 + headless 编排/重编排 agent + 证据落盘。
.EXAMPLE
  pwsh tools/relay/host/run-dogfood.ps1 -Scenario blocked  -ScreenshotOnLaunch -ScreenshotOnStop
  pwsh tools/relay/host/run-dogfood.ps1 -Scenario decision -ScreenshotOnLaunch -ScreenshotOnStop
.NOTES
  - 运行现场：<Root>/<RunId>/（默认 .dh-runtime/relay/RELAY-DF-<scenario>-<ts>）；夹具渲染到 <run>/dogfood/（替换 {{RUN_ID}} {{RUN_ROOT}} {{DOGFOOD}} {{TOOL}}）。
  - Runner 仍是唯一状态写者；本脚本只做：装 adapter、逐 tick 调宿主、回收 succeeded 会话、截图、拷证据。
  - decision 场景需要用户在 `RELAY:relay-<run>-S-000N` 窗口回答一次；本脚本不代答、不往终端注入任何按键（静态扫描守卫见 relay-host-loop 套件）。
#>
[CmdletBinding()]
param(
  [Parameter(Mandatory)][ValidateSet('blocked','decision')][string]$Scenario,
  [string]$RunId,
  [string]$Root,
  [ValidateSet('claude','codex')][string]$WorkerCli='claude',
  [string]$WorkerConfigDir,
  [string]$PlannerConfigDir,
  [double]$TickSeconds=5,
  [int]$MaxTicks=240,
  [int]$SpawnTimeoutSeconds=900,
  [switch]$ScreenshotOnLaunch,
  [switch]$ScreenshotOnStop,
  [string]$EvidenceDir
)
$ErrorActionPreference='Stop';[Console]::OutputEncoding=[Text.Encoding]::UTF8
. (Join-Path $PSScriptRoot 'relay-host.ps1')
. (Join-Path $PSScriptRoot '../runner/relay-replay.ps1')
. (Join-Path $PSScriptRoot '../adapters/psmux-adapter.ps1')

# 主控会话残留的 CLAUDE* 标记会被 psmux 会话与 headless 子进程继承（F-012）：本进程先清掉
foreach($inherited in @('CLAUDECODE','CLAUDE_CODE_CHILD_SESSION','CLAUDE_CODE_ENTRYPOINT','CLAUDE_CODE_SESSION_ID','CLAUDE_PID','PSMUX_SESSION')){Remove-Item "Env:$inherited" -ErrorAction SilentlyContinue}
if([string]::IsNullOrWhiteSpace($env:CLAUDE_CONFIG_DIR)){Remove-Item Env:CLAUDE_CONFIG_DIR -ErrorAction SilentlyContinue}
$repoRoot=[IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../../..'))
if([string]::IsNullOrWhiteSpace($Root)){$Root=Join-Path $repoRoot '.dh-runtime/relay'}
if([string]::IsNullOrWhiteSpace($RunId)){$RunId="RELAY-DF-$($Scenario.ToUpperInvariant())-$(Get-Date -Format yyyyMMddHHmmss)"}
if([string]::IsNullOrWhiteSpace($EvidenceDir)){$EvidenceDir=Join-Path $repoRoot "docs/modules/dh-relay/workspace/DHR_03/evidence/$Scenario"}
$paths=Get-RelayRunPaths $Root $RunId;$runRoot=$paths.root
[void](New-Item -ItemType Directory -Path $runRoot -Force)
$toolPath=[IO.Path]::GetFullPath((Join-Path $PSScriptRoot 'relay-agent-tool.ps1'))
$workerEntry=[IO.Path]::GetFullPath((Join-Path $PSScriptRoot 'relay-worker-entry.ps1'))

# 1. 渲染夹具（静态模板 → 现场副本，brief_ref 指向现场副本，跨 attempt 不变）
$fixtureDir=[IO.Path]::GetFullPath((Join-Path $PSScriptRoot "../dogfood/$Scenario"))
$renderDir=Join-Path $runRoot 'dogfood';[void](New-Item -ItemType Directory -Path $renderDir -Force)
$tokens=@{'{{RUN_ID}}'=$RunId;'{{RUN_ROOT}}'=($runRoot -replace '\\','/');'{{DOGFOOD}}'=($renderDir -replace '\\','/');'{{TOOL}}'=($toolPath -replace '\\','/')}
foreach($file in Get-ChildItem -LiteralPath $fixtureDir -Filter '*.md' -File){
  $text=Get-Content -LiteralPath $file.FullName -Raw;foreach($k in $tokens.Keys){$text=$text.Replace($k,$tokens[$k])}
  [IO.File]::WriteAllText((Join-Path $renderDir $file.Name),$text,[Text.UTF8Encoding]::new($false))
}
foreach($k in $tokens.Keys){$dangling=@(Get-ChildItem -LiteralPath $renderDir -File|Where-Object{(Get-Content -LiteralPath $_.FullName -Raw).Contains($k)});if($dangling.Count){throw "dogfood: unrendered token $k in $($dangling.Name -join ',')"}}

# 2. 真实 psmux adapter（worker 走 worker-entry；可选 ConfigDir/WorkDir）
$workDir=Join-Path $runRoot 'work';[void](New-Item -ItemType Directory -Path $workDir -Force)
$launchCommand={param($Receipt,$Node,$Run)
  $argv=@('pwsh','-NoProfile','-NoExit','-File',$workerEntry,'-Receipt',(Join-Path $Run.paths.launches "$($Receipt.launch_id).json"),'-BriefRef',$Node.brief_ref,'-Cli',$WorkerCli,'-WorkDir',$workDir)
  if(-not[string]::IsNullOrWhiteSpace($WorkerConfigDir)){$argv+=@('-ConfigDir',$WorkerConfigDir)}
  $argv
}.GetNewClosure()
$adapter=New-RelayPsmuxAdapter @{HandleRoot=(Join-Path $runRoot 'psmux-handles');LaunchCommand=$launchCommand}

# 3. headless 一次性 agent（orchestrator / replanner）：prompt 走 stdin，同步等待，日志落 <run>/spawns/
$spawnDir=Join-Path $runRoot 'spawns';[void](New-Item -ItemType Directory -Path $spawnDir -Force)
$script:spawnCount=0
function Invoke-DogfoodSpawn([string]$Role,[string]$PromptPath){
  $script:spawnCount++;$log=Join-Path $spawnDir "$Role-$script:spawnCount.log"
  $oldReceipt=$env:RELAY_RECEIPT;$oldRunRoot=$env:RELAY_RUN_ROOT;$oldTool=$env:RELAY_TOOL;$oldCfg=$env:CLAUDE_CONFIG_DIR
  try{
    Remove-Item Env:RELAY_RECEIPT -ErrorAction SilentlyContinue;$env:RELAY_RUN_ROOT=$runRoot;$env:RELAY_TOOL=$toolPath
    if(-not[string]::IsNullOrWhiteSpace($PlannerConfigDir)){$env:CLAUDE_CONFIG_DIR=$PlannerConfigDir}
    Write-Host "[dogfood] spawn $Role (headless claude -p) prompt=$PromptPath log=$log"
    $psi=[Diagnostics.ProcessStartInfo]::new();$psi.FileName='pwsh';$psi.UseShellExecute=$false;$psi.WorkingDirectory=$runRoot
    $inner="Get-Content -Raw -LiteralPath '$PromptPath' | claude -p --dangerously-skip-permissions *> '$log'"
    foreach($a in @('-NoProfile','-Command',$inner)){[void]$psi.ArgumentList.Add($a)}
    $sw=[Diagnostics.Stopwatch]::StartNew();$p=[Diagnostics.Process]::Start($psi)
    if(-not $p.WaitForExit($SpawnTimeoutSeconds*1000)){try{$p.Kill($true)}catch{};Write-Host "[dogfood] spawn $Role TIMEOUT after ${SpawnTimeoutSeconds}s";return}
    Write-Host "[dogfood] spawn $Role exit=$($p.ExitCode) in $([int]$sw.Elapsed.TotalSeconds)s; tail: $((Get-Content -LiteralPath $log -Tail 1 -ErrorAction SilentlyContinue))"
  }finally{
    if($null-eq$oldReceipt){Remove-Item Env:RELAY_RECEIPT -ErrorAction SilentlyContinue}else{$env:RELAY_RECEIPT=$oldReceipt}
    if($null-eq$oldRunRoot){Remove-Item Env:RELAY_RUN_ROOT -ErrorAction SilentlyContinue}else{$env:RELAY_RUN_ROOT=$oldRunRoot}
    if($null-eq$oldTool){Remove-Item Env:RELAY_TOOL -ErrorAction SilentlyContinue}else{$env:RELAY_TOOL=$oldTool}
    if($null-eq$oldCfg){Remove-Item Env:CLAUDE_CONFIG_DIR -ErrorAction SilentlyContinue}else{$env:CLAUDE_CONFIG_DIR=$oldCfg}
  }
}
$orchestratorSpawner={param($Run) Invoke-DogfoodSpawn 'orchestrator' (Join-Path $renderDir 'orchestrator-prompt.md')}.GetNewClosure()
$replannerSpawner={param($Run) Invoke-DogfoodSpawn 'replanner' (Join-Path $renderDir 'replanner-prompt.md')}.GetNewClosure()

# 4. 宿主循环（逐 tick 调宿主；本脚本额外做：succeeded 会话回收、decision 态截图）
$config=@{Root=$Root;RunId=$RunId;Adapter=$adapter;TickSeconds=$TickSeconds;MaxTicks=$MaxTicks;OrchestratorSpawner=$orchestratorSpawner;EvidenceDir=$EvidenceDir}
if($Scenario-ceq'blocked'){$config.ReplannerSpawner=$replannerSpawner}
if($ScreenshotOnLaunch){$config.ScreenshotOnLaunch=$true};if($ScreenshotOnStop){$config.ScreenshotOnStop=$true}
$context=New-RelayHostContext $config
Write-Host "[dogfood] scenario=$Scenario run_id=$RunId run_root=$runRoot evidence=$EvidenceDir"
$stopAttempts=@{};$stopMaxAttempts=3;$decisionSeen=@{};$outcome=$null
# 截图文件名 = <最新 event_id>-<tick 序号>-<label>-<阶段>.png：event_id 可能被同一 tick 内多张图复用（R2-07），tick 序号保证唯一可排序
function Get-DogfoodShotPath([string]$Suffix){$last=@(Read-RelayEvents $context.run)[-1];Join-Path $EvidenceDir ("shots/{0}-t{1:D4}-{2}.png" -f $last.event_id,$i,$Suffix)}
for($i=0;$i-lt$MaxTicks;$i++){
  $tick=Invoke-RelayHostTick $context;Write-Host $tick.status_line
  foreach($nodeId in @($context.run.state.nodes.Keys)){
    $node=$context.run.state.nodes[$nodeId]
    # succeeded 节点：Runner 不负责回收终端（只回收 dependency_blocked），宿主包装在此回收；stop 失败有界重试 3 次（R2-04：瞬态失联不该永久留下窗口）
    if($node.scheduling-ceq'succeeded'-and-not[string]::IsNullOrWhiteSpace($node.session_id)){
      $sid=$node.session_id;$tries=if($stopAttempts.ContainsKey($sid)){$stopAttempts[$sid]}else{0}
      if($tries-lt$stopMaxAttempts-and$tries-ge0){
        if($tries-eq0-and$ScreenshotOnStop){$label=Get-RelayHostSessionLabel $context $sid;[void](Save-RelayScreenshot (Get-DogfoodShotPath "$label-before-stop"))}
        $r=& $adapter.stop $sid;Write-Host "[dogfood] stop succeeded node $nodeId session=$sid try=$($tries+1) ok=$($r.ok) $(if($r.ok){"exited_after_ms=$($r.exited_after_ms)"}else{$r.reason})"
        $stopAttempts[$sid]=if($r.ok){-1}else{$tries+1}
        if(-not$r.ok-and$stopAttempts[$sid]-ge$stopMaxAttempts){Write-Warning "[dogfood] session $sid of node $nodeId could not be stopped after $stopMaxAttempts tries (last=$($r.reason)); window may still be open"}
      }
    }
    # decision 态进出各截一张（文件名含当时最新 event_id）
    $decisionKey="$nodeId/$($node.attempt_id)"
    if($node.result_status-ceq'decision_required'-and-not$decisionSeen.ContainsKey($decisionKey)){$decisionSeen[$decisionKey]='waiting';$last=@(Read-RelayEvents $context.run)[-1];$label=Get-RelayHostSessionLabel $context $node.session_id;[void](Save-RelayScreenshot (Get-DogfoodShotPath "$label-decision-waiting"));[void](New-Item -ItemType Directory -Path $EvidenceDir -Force);Copy-Item -LiteralPath $context.run.paths.state -Destination (Join-Path $EvidenceDir "state-at-decision-$($last.event_id).json") -Force;Write-Host "[dogfood] $nodeId 挂起等用户回答：请在标题 RELAY:$label 的窗口回答一次（本脚本不代答）"}
    elseif($decisionSeen.ContainsKey($decisionKey)-and$decisionSeen[$decisionKey]-ceq'waiting'-and$node.result_status-cne'decision_required'){$decisionSeen[$decisionKey]='resumed';$label=Get-RelayHostSessionLabel $context $node.session_id;[void](Save-RelayScreenshot (Get-DogfoodShotPath "$label-decision-resumed"))}
  }
  # 宿主判"无事可做"不等于全成：有 paused/blocked 节点（如 launch-failed）时 exit 3，留给人/编排层处理（F-014 run2 教训；判定抽在 Get-RelayHostOutcome，离线套件覆盖）
  if($tick.done){$outcome=Get-RelayHostOutcome $context $true;break}
  Start-Sleep -Milliseconds ([int]($TickSeconds*1000))
}
if($null-eq$outcome){$outcome=Get-RelayHostOutcome $context $false}
$exitCode=$outcome.exit_code
if($exitCode-ne0){Write-Host "[dogfood] finished with exit=$exitCode unfinished=$($outcome.unfinished-join',')"}
$unstopped=@($stopAttempts.Keys|Where-Object{$stopAttempts[$_]-ge0}|Sort-Object);if($unstopped.Count-gt0){Write-Warning "[dogfood] sessions not confirmed stopped: $($unstopped-join',')"}

# 5. 证据
$dest=Copy-RelayEvidence $context $EvidenceDir
$signature=@(Get-RelayEventSignature @(Read-RelayEvents $context.run) -SkipHeartbeat)
[IO.File]::WriteAllLines((Join-Path $dest 'signature.txt'),$signature,[Text.UTF8Encoding]::new($false))
# R1-03：-LiteralPath 不展开通配符，之前渲染夹具从未拷进证据；改成逐目录整拷，失败不吞
foreach($pair in @(@($renderDir,'dogfood'),@($spawnDir,'spawns'),@($workDir,'work'))){
  if(Test-Path -LiteralPath $pair[0]){$target=Join-Path $dest $pair[1];if(Test-Path -LiteralPath $target){Remove-Item -LiteralPath $target -Recurse -Force};Copy-Item -LiteralPath $pair[0] -Destination $target -Recurse -Force}
  else{Write-Warning "[dogfood] evidence source missing: $($pair[0])"}
}
Write-Host "[dogfood] evidence -> $dest";Write-Host "[dogfood] signature:";$signature|ForEach-Object{Write-Host "  $_"}
Write-Host "[dogfood] exit=$exitCode run_id=$RunId"
exit $exitCode
