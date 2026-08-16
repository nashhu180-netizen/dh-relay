. (Join-Path $PSScriptRoot '../runner/relay-runner.ps1')

function Write-RelayHostState([hashtable]$Context) {
  [void](Write-RelayJsonAtomic $Context.host_state_path $Context.host_state)
}

function New-RelayHostContext([hashtable]$Config) {
  foreach($key in @('Root','RunId','Adapter')){if(-not$Config.ContainsKey($key)){throw "relay-host missing setting $key"}}
  $clockInjected=$Config.ContainsKey('Clock');$clock=if($clockInjected){$Config.Clock}else{{[DateTimeOffset]::Now.ToUniversalTime()}}
  $params=if($Config.ContainsKey('Params')){$Config.Params}else{Import-PowerShellDataFile (Join-Path $PSScriptRoot '../contracts/relay-params.psd1')}
  $root=[IO.Path]::GetFullPath($Config.Root);$paths=Get-RelayRunPaths $root $Config.RunId
  $run=if(Test-Path -LiteralPath $paths.state){Open-RelayRun $root $Config.RunId $Config.Adapter $clock}else{New-RelayRun $root $Config.RunId $Config.Adapter $clock $params}
  $inbox=Join-Path $run.paths.root 'inbox';[void](New-Item -ItemType Directory -Path $inbox -Force)
  $statePath=Join-Path $run.paths.root 'host-state.json'
  $hostState=if(Test-Path -LiteralPath $statePath){Read-RelayJson $statePath}else{@{tick=0;replanner_spawned_for_generation=0;orchestrator_spawned=$false;consumed=@()}}
  $expected=@('consumed','orchestrator_spawned','replanner_spawned_for_generation','tick')
  if((@($hostState.Keys|Sort-Object)-join',')-cne($expected-join',')){throw 'relay-host state shape invalid'}
  $context=@{
    run=$run;host_state=$hostState;host_state_path=$statePath;inbox=$inbox;clock=$clock;clock_injected=$clockInjected
    tick_seconds=if($Config.ContainsKey('TickSeconds')){[double]$Config.TickSeconds}else{5.0}
    max_ticks=if($Config.ContainsKey('MaxTicks')){[int]$Config.MaxTicks}else{120}
    orchestrator_spawner=if($Config.ContainsKey('OrchestratorSpawner')){$Config.OrchestratorSpawner}else{$null}
    replanner_spawner=if($Config.ContainsKey('ReplannerSpawner')){$Config.ReplannerSpawner}else{$null}
    screenshot_on_launch=[bool]($Config.ContainsKey('ScreenshotOnLaunch')-and$Config.ScreenshotOnLaunch)
    screenshot_on_stop=[bool]($Config.ContainsKey('ScreenshotOnStop')-and$Config.ScreenshotOnStop)
    evidence_dir=if($Config.ContainsKey('EvidenceDir')){$Config.EvidenceDir}else{''}
    spawner_in_flight=$false
  }
  Write-RelayHostState $context;$context
}

function Move-RelayHostConsumed([hashtable]$Context,[string]$Path,[string]$LogicalPath=$Path) {
  $stamp=(& $Context.clock).Ticks;$destination="$LogicalPath.consumed-$stamp";[IO.File]::Move($Path,$destination,$true)
  $Context.host_state.consumed=@($Context.host_state.consumed)+@($destination);$destination
}

function Get-RelayHostPendingProposals([hashtable]$Context) {
  return @(Get-ChildItem -LiteralPath $Context.inbox -Filter 'proposal-*.json' -File -ErrorAction SilentlyContinue|Sort-Object Name)
}

function Get-RelayHostStatusLine([hashtable]$Context) {
  $parts=[Collections.Generic.List[string]]::new()
  foreach($id in @($Context.run.state.nodes.Keys|Sort-Object)){
    $node=$Context.run.state.nodes[$id];$terminal=if([string]::IsNullOrWhiteSpace($node.terminal_state)){'waiting'}else{$node.terminal_state}
    $business=if([string]::IsNullOrWhiteSpace($node.result_status)){$node.scheduling}else{$node.result_status};$parts.Add("$id=$terminal/$business")
  }
  if($parts.Count-eq0){$parts.Add('waiting-for-plan')}
  "[relay-host] tick=$($Context.host_state.tick) $($parts-join' ')"
}

function Get-RelayHostSessionLabel([hashtable]$Context,[string]$SessionId) {
  if($Context.run.adapter.ContainsKey('sessions')-and$Context.run.adapter.sessions.ContainsKey($SessionId)){
    $entry=$Context.run.adapter.sessions[$SessionId];if($entry-is[hashtable]-and$entry.ContainsKey('session_name')){return "$($entry.session_name)"}
  }
  $SessionId
}

function Invoke-RelayHostTick([hashtable]$Context) {
  $Context.host_state.tick=[int]$Context.host_state.tick+1;$ingested=[Collections.Generic.List[hashtable]]::new();$launched=[Collections.Generic.List[string]]::new();$spawned=[Collections.Generic.List[string]]::new()
  foreach($nodeId in @($Context.run.state.nodes.Keys|Sort-Object)){
    $node=$Context.run.state.nodes[$nodeId];if($node.scheduling-cne'launched'-or$node.attempt_id-lt1){continue}
    $attempt=Join-Path $Context.run.paths.attempts "$nodeId/$($node.attempt_id)"
    $checkpoint=Join-Path $attempt 'checkpoint.json.tmp'
    if(Test-Path -LiteralPath $checkpoint){
      # Runner atomically writes checkpoint.json through checkpoint.json.tmp.
      # Stage the worker file under a private name so that write cannot consume it.
      $readCopy="$checkpoint.host-read-$([Guid]::NewGuid().ToString('N'))";[IO.File]::Move($checkpoint,$readCopy)
      try{$submit=Submit-RelayCheckpointFile $Context.run $nodeId $readCopy}finally{$consumed=Move-RelayHostConsumed $Context $readCopy $checkpoint}
      $ingested.Add(@{kind='checkpoint';node_id=$nodeId;ok=[bool]$submit.ok;path=$consumed})
    }
    $result=Join-Path $attempt 'result.json.tmp'
    if(Test-Path -LiteralPath $result){$submit=Submit-RelayResultFile $Context.run $nodeId $result;$consumed=Move-RelayHostConsumed $Context $result;$ingested.Add(@{kind='result';node_id=$nodeId;ok=[bool]$submit.ok;path=$consumed})
      if($Context.screenshot_on_stop-and$Context.evidence_dir-and$submit.ok-and$submit.result_status-ceq'dependency_blocked'){$last=@(Read-RelayEvents $Context.run)[-1];$label=Get-RelayHostSessionLabel $Context $node.session_id;$shot=Join-Path $Context.evidence_dir "shots/$($last.event_id)-$label.png";[void](Save-RelayScreenshot $shot)}
    }
  }
  foreach($file in @(Get-RelayHostPendingProposals $Context)){
    try{$proposal=Read-RelayJson $file.FullName;$submit=Submit-RelayProposal $Context.run $proposal ([int]$Context.run.state.authority_generation);$ok=[bool]$submit.ok}catch{$ok=$false}
    $consumed=Move-RelayHostConsumed $Context $file.FullName;$ingested.Add(@{kind='proposal';node_id='';ok=$ok;path=$consumed})
  }
  [void](Invoke-RelayTick $Context.run)
  foreach($nodeId in @(Get-RelayReadyNodes $Context.run)){
    $started=Start-RelayNodeAttempt $Context.run $nodeId
    if($started.ok){$launched.Add($nodeId);if($Context.screenshot_on_launch-and$Context.evidence_dir){$last=@(Read-RelayEvents $Context.run)[-1];$label=Get-RelayHostSessionLabel $Context $started.session_id;$shot=Join-Path $Context.evidence_dir "shots/$($last.event_id)-$label.png";[void](Save-RelayScreenshot $shot)}}
  }
  if($Context.run.state.replan_required-and$Context.host_state.replanner_spawned_for_generation-ne$Context.run.state.authority_generation-and$null-ne$Context.replanner_spawner){
    $Context.spawner_in_flight=$true;try{$null=& $Context.replanner_spawner $Context.run;$Context.host_state.replanner_spawned_for_generation=$Context.run.state.authority_generation;$spawned.Add('replanner')}finally{$Context.spawner_in_flight=$false}
  }
  $pending=@(Get-RelayHostPendingProposals $Context)
  if($null-eq(Read-RelayActivePlan $Context.run)-and$pending.Count-eq0-and-not$Context.host_state.orchestrator_spawned-and$null-ne$Context.orchestrator_spawner){
    $Context.spawner_in_flight=$true;try{$null=& $Context.orchestrator_spawner $Context.run;$Context.host_state.orchestrator_spawned=$true;$spawned.Add('orchestrator')}finally{$Context.spawner_in_flight=$false}
  }
  $pending=@(Get-RelayHostPendingProposals $Context);$ready=@(Get-RelayReadyNodes $Context.run);$active=@($Context.run.state.nodes.Values|Where-Object{$_.scheduling-ceq'launched'})
  $done=$null-ne(Read-RelayActivePlan $Context.run)-and$active.Count-eq0-and$ready.Count-eq0-and-not$Context.run.state.replan_required-and$pending.Count-eq0-and-not$Context.spawner_in_flight
  Write-RelayHostState $Context;$line=Get-RelayHostStatusLine $Context
  @{tick=$Context.host_state.tick;ingested=@($ingested);launched=@($launched);spawned=@($spawned);done=$done;status_line=$line}
}

# R1-04/R2-08：宿主 done（无事可做）≠ 全成——paused/blocked 节点让 active/ready 同时为空也会 done。
# 统一出口判定抽成纯函数：0=done 且全 succeeded；3=done 但有非 succeeded 节点（launch-failed 等，留给人/编排层）；2=MaxTicks 未完。
function Get-RelayHostOutcome([hashtable]$Context,[bool]$Done) {
  $unfinished=@($Context.run.state.nodes.Keys|Sort-Object|Where-Object{$Context.run.state.nodes[$_].scheduling-cne'succeeded'}|ForEach-Object{"$_=$($Context.run.state.nodes[$_].scheduling)/$($Context.run.state.nodes[$_].pause_reason)"})
  $code=if(-not$Done){2}elseif($unfinished.Count-eq0){0}else{3}
  @{exit_code=$code;done=$Done;all_succeeded=($unfinished.Count-eq0);unfinished=$unfinished}
}

function Invoke-RelayHost([hashtable]$Context) {
  for($index=0;$index-lt$Context.max_ticks;$index++){
    $tick=Invoke-RelayHostTick $Context;Write-Host $tick.status_line
    if($tick.done){$outcome=Get-RelayHostOutcome $Context $true;if($outcome.exit_code-ne0){Write-Host "[relay-host] done with unfinished=$($outcome.unfinished-join',')"};return $outcome.exit_code}
    if($Context.tick_seconds-gt0-and-not$Context.clock_injected){Start-Sleep -Milliseconds ([int]($Context.tick_seconds*1000))}
  }
  $outcome=Get-RelayHostOutcome $Context $false
  Write-Host "[relay-host] max ticks reached; unfinished=$($outcome.unfinished-join',')";return $outcome.exit_code
}

function Get-RelayVisibleWindowTitles {
  if(-not('RelayHostNativeWindow' -as[type])){Add-Type -TypeDefinition @'
using System;
using System.Collections.Generic;
using System.Runtime.InteropServices;
using System.Text;
public static class RelayHostNativeWindow {
  public delegate bool EnumProc(IntPtr h, IntPtr p);
  [DllImport("user32.dll")] public static extern bool EnumWindows(EnumProc cb, IntPtr p);
  [DllImport("user32.dll")] public static extern bool IsWindowVisible(IntPtr h);
  [DllImport("user32.dll", CharSet=CharSet.Unicode)] public static extern int GetWindowText(IntPtr h, StringBuilder s, int n);
  [DllImport("user32.dll")] public static extern bool GetWindowRect(IntPtr h, out RECT r);
  [DllImport("user32.dll")] public static extern bool PrintWindow(IntPtr h, IntPtr hdc, uint flags);
  [StructLayout(LayoutKind.Sequential)] public struct RECT { public int Left, Top, Right, Bottom; }
  public static string[] Titles(){var values=new List<string>();EnumWindows((h,p)=>{if(IsWindowVisible(h)){var s=new StringBuilder(1024);GetWindowText(h,s,s.Capacity);if(s.Length>0)values.Add(s.ToString());}return true;},IntPtr.Zero);return values.ToArray();}
  public static List<KeyValuePair<IntPtr,string>> Windows(string prefix){var values=new List<KeyValuePair<IntPtr,string>>();EnumWindows((h,p)=>{if(IsWindowVisible(h)){var s=new StringBuilder(1024);GetWindowText(h,s,s.Capacity);var t=s.ToString();if(t.StartsWith(prefix,StringComparison.Ordinal))values.Add(new KeyValuePair<IntPtr,string>(h,t));}return true;},IntPtr.Zero);return values;}
}
'@}
  @([RelayHostNativeWindow]::Titles())
}

# 截图只拍 RELAY:* 接力窗口自身（PrintWindow PW_RENDERFULLCONTENT，被遮挡也拍得到窗口内容），不再抓整个桌面：
# 整屏截图会把用户其他窗口的内容一并带进进仓证据（2026-08-16 主控查看证据时发现·同 R1-05 隐私面）。
# 多个 RELAY 窗口纵向拼在一张 PNG；一个都没有时写一张带说明文字的占位图。
function Save-RelayScreenshot([string]$Path) {
  Add-Type -AssemblyName System.Drawing;[void](Get-RelayVisibleWindowTitles)
  $full=[IO.Path]::GetFullPath($Path);$parent=Split-Path -Parent $full;if(-not(Test-Path $parent)){[void](New-Item -ItemType Directory -Path $parent -Force)}
  $windows=@([RelayHostNativeWindow]::Windows('RELAY:'));$shots=[Collections.Generic.List[Drawing.Bitmap]]::new()
  try{
    foreach($pair in $windows){
      $rect=New-Object RelayHostNativeWindow+RECT;if(-not[RelayHostNativeWindow]::GetWindowRect($pair.Key,[ref]$rect)){continue}
      $w=[Math]::Max(1,$rect.Right-$rect.Left);$h=[Math]::Max(1,$rect.Bottom-$rect.Top);$bmp=[Drawing.Bitmap]::new($w,$h)
      $g=[Drawing.Graphics]::FromImage($bmp);try{$hdc=$g.GetHdc();try{[void][RelayHostNativeWindow]::PrintWindow($pair.Key,$hdc,2)}finally{$g.ReleaseHdc($hdc)};$g.DrawString($pair.Value,[Drawing.SystemFonts]::DefaultFont,[Drawing.Brushes]::Yellow,4,4)}finally{$g.Dispose()}
      $shots.Add($bmp)
    }
    if($shots.Count-eq0){$bmp=[Drawing.Bitmap]::new(640,60);$g=[Drawing.Graphics]::FromImage($bmp);try{$g.Clear([Drawing.Color]::Black);$g.DrawString('no RELAY:* window visible at capture time',[Drawing.SystemFonts]::DefaultFont,[Drawing.Brushes]::White,8,20)}finally{$g.Dispose()};$shots.Add($bmp)}
    $width=($shots|ForEach-Object{$_.Width}|Measure-Object -Maximum).Maximum;$height=($shots|ForEach-Object{$_.Height}|Measure-Object -Sum).Sum
    $canvas=[Drawing.Bitmap]::new([int]$width,[int]$height);try{$g=[Drawing.Graphics]::FromImage($canvas);try{$g.Clear([Drawing.Color]::Black);$y=0;foreach($s in $shots){$g.DrawImage($s,0,$y);$y+=$s.Height}}finally{$g.Dispose()};$canvas.Save($full,[Drawing.Imaging.ImageFormat]::Png)}finally{$canvas.Dispose()}
  }finally{foreach($s in $shots){$s.Dispose()}}
  # R1-05：窗口标题清单只留 RELAY: 前缀的接力窗口（证据要进仓，其他窗口标题属个人隐私面）；总数只记个数
  $titles=@(Get-RelayVisibleWindowTitles);$relay=@($titles|Where-Object{$_ -clike 'RELAY:*'})
  [IO.File]::WriteAllLines("$full.windows.txt",@("# visible windows total=$($titles.Count) relay=$($relay.Count) (only RELAY:* titles are recorded; png contains only these windows)")+$relay,[Text.UTF8Encoding]::new($false));$full
}

function Export-RelayTimeline([hashtable]$Run,[string]$OutPath,[string]$ShotsDir) {
  $lines=[Collections.Generic.List[string]]::new();$lines.Add('| event_id | occurred_at | kind | node | attempt | session | reason | shot |');$lines.Add('|---|---|---|---|---:|---|---|---|')
  foreach($event in @(Read-RelayEvents $Run)){
    $identity=if($event.ContainsKey('identity')){$event.identity}else{@{}};$shot=''
    if(-not[string]::IsNullOrWhiteSpace($ShotsDir)-and(Test-Path $ShotsDir)){$match=@(Get-ChildItem -LiteralPath $ShotsDir -Filter "$($event.event_id)-*.png" -File -ErrorAction SilentlyContinue|Select-Object -First 1);if($match.Count-eq1){$shot=$match[0].Name}}
    $why=if($event.ContainsKey('reason')){$event.reason}else{''};$lines.Add("| $($event.event_id) | $($event.occurred_at) | $($event.kind) | $($identity.node_id) | $($identity.attempt_id) | $($identity.session_id) | $why | $shot |")
  }
  $parent=Split-Path -Parent $OutPath;if(-not(Test-Path $parent)){[void](New-Item -ItemType Directory -Path $parent -Force)};[IO.File]::WriteAllLines($OutPath,$lines,[Text.UTF8Encoding]::new($false));$OutPath
}

function Copy-RelayEvidence([hashtable]$Context,[string]$Dest) {
  $destination=[IO.Path]::GetFullPath($Dest);[void](New-Item -ItemType Directory -Path $destination -Force)
  foreach($name in @('events.jsonl','relay-state.json','active-plan.json','authority.json','host-state.json')){$source=Join-Path $Context.run.paths.root $name;if(Test-Path $source){Copy-Item -LiteralPath $source -Destination (Join-Path $destination $name) -Force}}
  # R1-07/R2-06：plans/ 提案体（含 resume_from）是接力语义核心证据，一并复制；attempts/ 仍不复制（handoff/tail 不外泄）
  foreach($directory in @('launches','psmux-handles','plans')){$source=Join-Path $Context.run.paths.root $directory;if(Test-Path $source){Copy-Item -LiteralPath $source -Destination (Join-Path $destination $directory) -Recurse -Force}}
  [void](Export-RelayTimeline $Context.run (Join-Path $destination 'timeline.md') (Join-Path $destination 'shots'));$destination
}
