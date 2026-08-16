function Get-RelayPsmuxSessionName([string]$RunId,[string]$SessionId) {
  "relay-$(($RunId -replace '[^A-Za-z0-9-]','-'))-$(($SessionId -replace '[^A-Za-z0-9-]','-'))"
}

function Invoke-RelayPsmux([scriptblock]$Exec,[string[]]$CommandArgs) {
  $result=& $Exec -CommandArgs $CommandArgs
  if($result -isnot [hashtable] -or -not $result.ContainsKey('exit')){throw 'psmux-command-failed'}
  $result
}

function Get-RelayPsmuxSessions([scriptblock]$Exec) {
  $result=Invoke-RelayPsmux $Exec @('list-sessions','-F','#{session_name}|#{session_id}|#{session_attached}')
  if($result.exit -ne 0){if("$($result.stderr)" -match '(?i)no server running|no sessions'){return @()};throw 'psmux-command-failed'}
  $items=[Collections.Generic.List[hashtable]]::new()
  foreach($line in @("$($result.stdout)" -split "`r?`n"|Where-Object{$_ -ne ''})){$parts=$line -split '\|',3;if($parts.Count-ne3){throw 'psmux-command-failed'};$attached=0;if(-not[int]::TryParse($parts[2],[ref]$attached)){throw 'psmux-command-failed'};$items.Add(@{name=$parts[0];id=$parts[1];attached=$attached})}
  return @($items)
}

function Test-RelayPsmuxSessionExists([object[]]$Sessions,[string]$Name) {
  $matches=@($Sessions|Where-Object{$_.name -ceq $Name})
  @{count=$matches.Count;match=if($matches.Count-eq1){$matches[0]}else{$null}}
}

function Get-RelayPsmuxPane([scriptblock]$Exec,[string]$Name) {
  $result=Invoke-RelayPsmux $Exec @('list-panes','-t',$Name,'-F','#{session_name}|#{window_id}|#{pane_id}|#{pane_pid}|#{pane_dead}|#{pane_current_command}|#{window_activity}|#{cursor_y}|#{cursor_x}|#{history_size}|#{pane_title}')
  if($result.exit-ne0){throw 'psmux-command-failed'}
  $lines=@("$($result.stdout)" -split "`r?`n"|Where-Object{$_ -ne ''});if($lines.Count-ne1){throw 'psmux-command-failed'}
  $p=$lines[0] -split '\|',11;if($p.Count-ne11){throw 'psmux-command-failed'}
  @{session_name=$p[0];window_id=$p[1];pane_id=$p[2];pane_pid=[int]$p[3];pane_dead=[int]$p[4];command=$p[5];window_activity=[long]$p[6];cursor="$($p[7])|$($p[8])|$($p[9])";pane_title=$p[10]}
}

# K-5（DHR_03 实测修订）：psmux 的 #{window_activity} 只在建会话时写一次、不随 pane 输出更新（F-009），
# 且会话拉起后的**首个** probe 一律报 running（活着=launching→running 合法边；F-015：启动慢时首 probe 判 idle 会撞 launching→idle 非法边），
# 故活动判据改为「屏幕内容指纹」：capture-pane 文本 + 光标行 的哈希；指纹变了=有输出=running，
# 指纹持续不变超过 IdleAfterSeconds=idle。指纹与最近变化时刻存进 handle registry，跨宿主进程可续。
function Get-RelayPsmuxActivityFingerprint([scriptblock]$Exec,[hashtable]$Pane) {
  $captured=Invoke-RelayPsmux $Exec @('capture-pane','-p','-t',$Pane.session_name)
  if($captured.exit-ne0){throw 'psmux-command-failed'}
  $text="$($captured.stdout)`n$($Pane.cursor)"
  $sha=[Security.Cryptography.SHA256]::Create();try{[BitConverter]::ToString($sha.ComputeHash([Text.Encoding]::UTF8.GetBytes($text))).Replace('-','').ToLowerInvariant()}finally{$sha.Dispose()}
}

function Find-RelayVisibleWindow([string]$Title) {
  if(-not('RelayPsmuxNativeWindow' -as [type])){Add-Type -TypeDefinition @'
using System;
using System.Runtime.InteropServices;
using System.Text;
public static class RelayPsmuxNativeWindow {
  public delegate bool EnumProc(IntPtr h, IntPtr p);
  [DllImport("user32.dll")] public static extern bool EnumWindows(EnumProc cb, IntPtr p);
  [DllImport("user32.dll")] public static extern bool IsWindowVisible(IntPtr h);
  [DllImport("user32.dll", CharSet=CharSet.Unicode)] public static extern int GetWindowText(IntPtr h, StringBuilder s, int n);
  public static bool Exact(string title) { bool found=false; EnumWindows((h,p)=>{ if(IsWindowVisible(h)){var s=new StringBuilder(1024);GetWindowText(h,s,s.Capacity);if(s.ToString()==title)found=true;} return !found;},IntPtr.Zero);return found; }
}
'@}
  [RelayPsmuxNativeWindow]::Exact($Title)
}

function Write-RelayPsmuxHandle([string]$Root,[hashtable]$Handle) {
  if(-not(Test-Path -LiteralPath $Root)){[void](New-Item -ItemType Directory -Path $Root -Force)}
  $path=Join-Path $Root "$($Handle.session_id).json";$partial="$path.partial"
  [IO.File]::WriteAllText($partial,($Handle|ConvertTo-Json -Depth 20 -Compress),[Text.UTF8Encoding]::new($false))
  # 2026-08-16 真机实测：%TEMP% 下刚写完的文件偶发被扫描器短暂占用，Move 抛 Access denied（一次），有界重试后再让它抛
  $attempt=0;while($true){try{[IO.File]::Move($partial,$path,$true);break}catch{$attempt++;if($attempt-ge5){throw};[Threading.Thread]::Sleep(100)}}
  $path
}

function Read-RelayPsmuxHandle([string]$Root,[string]$SessionId) {
  $path=Join-Path $Root "$SessionId.json";if(-not(Test-Path -LiteralPath $path)){return $null};Get-Content -LiteralPath $path -Raw|ConvertFrom-Json -AsHashtable -DateKind String
}

# R2-01：launch 阶段1（等会话出现）中途失败/超时的清理——会话（若已晚到）与窗口进程都不留下
function Invoke-RelayPsmuxLaunchCleanup([scriptblock]$Exec,[string]$Name,[int]$ClientPid,[scriptblock]$ClientStopper) {
  try{[void](Invoke-RelayPsmux $Exec @('kill-session','-t',$Name))}catch{}
  try{if($ClientPid-gt0){& $ClientStopper $ClientPid}}catch{}
}

function New-RelayPsmuxDefaultExec {
  {param([string[]]$CommandArgs)$psi=[Diagnostics.ProcessStartInfo]::new();$psi.FileName='psmux';$psi.UseShellExecute=$false;$psi.RedirectStandardOutput=$true;$psi.RedirectStandardError=$true;foreach($arg in $CommandArgs){[void]$psi.ArgumentList.Add($arg)};$p=[Diagnostics.Process]::Start($psi);$stdout=$p.StandardOutput.ReadToEnd();$stderr=$p.StandardError.ReadToEnd();$p.WaitForExit();@{exit=$p.ExitCode;stdout=$stdout.TrimEnd();stderr=$stderr.TrimEnd()}}
}

function New-RelayPsmuxAdapter([hashtable]$Options) {
  if(-not$Options.ContainsKey('HandleRoot') -or [string]::IsNullOrWhiteSpace("$($Options.HandleRoot)")){throw 'handle-root-required'}
  $handleRoot=[IO.Path]::GetFullPath($Options.HandleRoot);[void](New-Item -ItemType Directory -Path $handleRoot -Force)
  $params=if($Options.ContainsKey('Params')){$Options.Params}else{Import-PowerShellDataFile (Join-Path $PSScriptRoot '../contracts/relay-params.psd1')}
  $exec=if($Options.ContainsKey('Exec')){$Options.Exec}else{New-RelayPsmuxDefaultExec}
  $clock=if($Options.ContainsKey('Clock')){$Options.Clock}else{{[DateTimeOffset]::UtcNow}}
  $windowProbe=if($Options.ContainsKey('WindowProbe')){$Options.WindowProbe}else{{param($Title)Find-RelayVisibleWindow $Title}}
  # F-017：负载下 psmux 客户端偶发连不上服务器（列表为空/'no server running'），不能据此判 exited；用 pane 进程存活交叉核对（可注入）
  $processProbe=if($Options.ContainsKey('ProcessProbe')){$Options.ProcessProbe}else{{param($ProcessId)[bool](Get-Process -Id $ProcessId -ErrorAction SilentlyContinue)}}
  # R1 附注B：默认窗口进程用 ProcessStartInfo.ArgumentList 逐参传递（与默认 Exec 同一套引号规则），不靠 Start-Process 拼字符串
  $clientLauncher=if($Options.ContainsKey('ClientLauncher')){$Options.ClientLauncher}else{{param($Name,$Argv)$psi=[Diagnostics.ProcessStartInfo]::new();$psi.FileName='psmux';$psi.UseShellExecute=$true;foreach($arg in @($Argv)){[void]$psi.ArgumentList.Add($arg)};([Diagnostics.Process]::Start($psi)).Id}}
  # R2-01：阶段1 中途失败时尽力停掉窗口进程（可注入，离线套件断言被调用）
  $clientStopper=if($Options.ContainsKey('ClientStopper')){$Options.ClientStopper}else{{param($ProcessId)Stop-Process -Id $ProcessId -Force -ErrorAction SilentlyContinue}}
  $workerEntry=[IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../host/relay-worker-entry.ps1'))
  $launchCommand=if($Options.ContainsKey('LaunchCommand')){$Options.LaunchCommand}else{{param($Receipt,$Node,$Run)@('pwsh','-NoProfile','-NoExit','-File',$workerEntry,'-Receipt',(Join-Path $Run.paths.launches "$($Receipt.launch_id).json"),'-BriefRef',$Node.brief_ref,'-Cli','claude')}.GetNewClosure()}
  $calls=[Collections.Generic.List[hashtable]]::new();$sessions=@{}
  # K-4（DHR_03 实测修订·F-016）：psmux `attach -t <name>` 无视目标、总接到服务器"当前会话"（多会话共存必错），
  # 故改为**窗口拥有会话**：可见客户端进程直接执行 `psmux new-session -s <name> -n <node> -- <cmd>`（非 -d），
  # 再轮询 list-sessions 全等出现 → 设标题 → 等 attached≥1 ∧ 窗口标题可见。全程不调 attach。
  $launch={
    param($Receipt,$Node,$Run)
    $receiptPath=Join-Path $Run.paths.launches "$($Receipt.launch_id).json";[void]$calls.Add(@{verb='launch';session_id=$Receipt.session_id;args=@{};receipt_present=(Test-Path -LiteralPath $receiptPath)})
    $name=Get-RelayPsmuxSessionName $Run.run_id $Receipt.session_id
    try{$found=Test-RelayPsmuxSessionExists (Get-RelayPsmuxSessions $exec) $name}catch{return @{ok=$false;reason='psmux-command-failed'}}
    if($found.count-ne0){return @{ok=$false;reason='session-name-collision'}}
    $old=$env:PSMUX_SESSION
    try{
      $env:PSMUX_SESSION=$null
      # R2-03：拉起命令生成 / 窗口进程启动抛异常（如 psmux 不在 PATH）不许穿透 Runner，一律收敛为 psmux-command-failed
      try{$command=@(&$launchCommand $Receipt $Node $Run);$newSessionArgv=@('new-session','-s',$name,'-n',$Node.node_id,'--')+$command;$clientPid=[int](& $clientLauncher $name $newSessionArgv)}catch{return @{ok=$false;reason='psmux-command-failed'}}
      $title="RELAY:$name";$started=&$clock;$match=$null
      # 阶段 1：等会话出现（窗口进程负责建会话）；R2-01：中途失败/超时也要清会话 + 尽力停掉窗口进程，不留无 handle 的孤儿窗口
      do{try{$probe=Test-RelayPsmuxSessionExists (Get-RelayPsmuxSessions $exec) $name}catch{Invoke-RelayPsmuxLaunchCleanup $exec $name $clientPid $clientStopper;return @{ok=$false;reason='psmux-command-failed'}};if($probe.count-gt1){[void](Invoke-RelayPsmux $exec @('kill-session','-t',$name));return @{ok=$false;reason='ambiguous-session'}};if($probe.count-eq1){$match=$probe.match;break};$now=&$clock;if($now-ge$started.AddSeconds($params.AttachDeadlineSeconds)){Invoke-RelayPsmuxLaunchCleanup $exec $name $clientPid $clientStopper;return @{ok=$false;reason='psmux-new-session-failed'}};[Threading.Thread]::Sleep(10)}while($true)
      $titleArgvs=@(@('set-option','-t',$name,'set-titles','on'),@('set-option','-t',$name,'set-titles-string','RELAY:#S'))
      foreach($argv in $titleArgvs){$set=Invoke-RelayPsmux $exec $argv;if($set.exit-ne0){[void](Invoke-RelayPsmux $exec @('kill-session','-t',$name));return @{ok=$false;reason='psmux-command-failed'}}}
      # 阶段 2：等 attached≥1 ∧ 标题全等窗口可见
      $attached=$false;$visible=$false
      do{try{$probe=Test-RelayPsmuxSessionExists (Get-RelayPsmuxSessions $exec) $name}catch{[void](Invoke-RelayPsmux $exec @('kill-session','-t',$name));return @{ok=$false;reason='psmux-command-failed'}};if($probe.count-gt1){[void](Invoke-RelayPsmux $exec @('kill-session','-t',$name));return @{ok=$false;reason='ambiguous-session'}};if($probe.count-eq1){$match=$probe.match;$attached=$match.attached-ge1};$visible=[bool](& $windowProbe $title);$now=&$clock;if($attached-and$visible){break};if($now-ge$started.AddSeconds($params.AttachDeadlineSeconds)){[void](Invoke-RelayPsmux $exec @('kill-session','-t',$name));if(-not$attached){return @{ok=$false;reason='launch-not-attached'}};return @{ok=$false;reason='launch-not-visible'}};[Threading.Thread]::Sleep(10)}while($true)
      try{$pane=Get-RelayPsmuxPane $exec $name;$fingerprint=Get-RelayPsmuxActivityFingerprint $exec $pane}catch{[void](Invoke-RelayPsmux $exec @('kill-session','-t',$name));return @{ok=$false;reason='psmux-command-failed'}}
      $launchedAt=(& $clock).ToString('o')
      $handle=@{launch_id=$Receipt.launch_id;session_id=$Receipt.session_id;session_name=$name;psmux_session_id=$match.id;pane_id=$pane.pane_id;pane_pid=$pane.pane_pid;client_pid=$clientPid;window_title=$title;launched_at=$launchedAt;stopped_at='';client_lost=$false;activity_fingerprint=$fingerprint;activity_seen_at=$launchedAt;observed_running=$false}
      # 注册表落盘失败（磁盘/占用）不许在会话已建成后穿透：清会话与窗口进程再报失败
      try{[void](Write-RelayPsmuxHandle $handleRoot $handle)}catch{Invoke-RelayPsmuxLaunchCleanup $exec $name $clientPid $clientStopper;return @{ok=$false;reason='psmux-command-failed'}}
      $sessions[$Receipt.session_id]=$handle
      @{ok=$true;session_id=$Receipt.session_id;handle=@{session_name=$name;psmux_session_id=$match.id;pane_id=$pane.pane_id;pane_pid=$pane.pane_pid;client_pid=$clientPid;window_title=$title}}
    }finally{if($null-eq$old){Remove-Item Env:PSMUX_SESSION -ErrorAction SilentlyContinue}else{$env:PSMUX_SESSION=$old}}
  }.GetNewClosure()
  $probe={param($SessionId)[void]$calls.Add(@{verb='probe';session_id=$SessionId;args=@{};receipt_present=$false});$handle=if($sessions.ContainsKey($SessionId)){$sessions[$SessionId]}else{Read-RelayPsmuxHandle $handleRoot $SessionId};if($null-eq$handle){return @{ok=$false;probe_error=$true;reason='unknown-session'}};try{$exact=Test-RelayPsmuxSessionExists (Get-RelayPsmuxSessions $exec) $handle.session_name;if($exact.count-gt1){return @{ok=$false;probe_error=$true;reason='ambiguous-session'}};if($exact.count-eq0){if([int]$handle.pane_pid-gt0-and(& $processProbe ([int]$handle.pane_pid))){return @{ok=$false;probe_error=$true;reason='psmux-command-failed'}};return @{ok=$true;terminal_state='exited';probe_error=$false}};if($exact.match.attached-eq0){$handle.client_lost=$true;[void](Write-RelayPsmuxHandle $handleRoot $handle);$sessions[$SessionId]=$handle};$pane=Get-RelayPsmuxPane $exec $handle.session_name;if($pane.pane_dead-eq1){return @{ok=$true;terminal_state='exited';probe_error=$false}};$fingerprint=Get-RelayPsmuxActivityFingerprint $exec $pane;$now=[DateTimeOffset](& $clock);$previous=if($handle.ContainsKey('activity_fingerprint')){"$($handle.activity_fingerprint)"}else{''};$firstAlive=-not($handle.ContainsKey('observed_running')-and[bool]$handle.observed_running);if($firstAlive){$handle.observed_running=$true};if($firstAlive-or$fingerprint-cne$previous-or[string]::IsNullOrWhiteSpace("$($handle.activity_seen_at)")){$handle.activity_fingerprint=$fingerprint;$handle.activity_seen_at=$now.ToString('o');[void](Write-RelayPsmuxHandle $handleRoot $handle);$sessions[$SessionId]=$handle;return @{ok=$true;terminal_state='running';probe_error=$false}};$age=($now-[DateTimeOffset]::Parse($handle.activity_seen_at)).TotalSeconds;$state=if($age-le$params.IdleAfterSeconds){'running'}else{'idle'};@{ok=$true;terminal_state=$state;probe_error=$false}}catch{@{ok=$false;probe_error=$true;reason='psmux-command-failed'}}}.GetNewClosure()
  $stop={param($SessionId)[void]$calls.Add(@{verb='stop';session_id=$SessionId;args=@{};receipt_present=$false});$handle=if($sessions.ContainsKey($SessionId)){$sessions[$SessionId]}else{Read-RelayPsmuxHandle $handleRoot $SessionId};if($null-eq$handle){return @{ok=$false;reason='unknown-session'}};try{$exact=Test-RelayPsmuxSessionExists (Get-RelayPsmuxSessions $exec) $handle.session_name;$paneAlive=([int]$handle.pane_pid-gt0-and(& $processProbe ([int]$handle.pane_pid)));if($exact.count-gt1){return @{ok=$false;reason='ambiguous-session'}};if($exact.count-eq0-and-not$paneAlive){return @{ok=$false;reason='unknown-session'}};$killed=Invoke-RelayPsmux $exec @('kill-session','-t',$handle.session_name);if($killed.exit-ne0){return @{ok=$false;reason='psmux-command-failed'}};$started=&$clock;do{$exact=Test-RelayPsmuxSessionExists (Get-RelayPsmuxSessions $exec) $handle.session_name;$now=&$clock;$paneGone=-not([int]$handle.pane_pid-gt0-and(& $processProbe ([int]$handle.pane_pid)));if($exact.count-eq0-and$paneGone){$ms=[int][Math]::Max(0,($now-$started).TotalMilliseconds);$handle.stopped_at=$now.ToString('o');[void](Write-RelayPsmuxHandle $handleRoot $handle);$sessions[$SessionId]=$handle;return @{ok=$true;exited_after_ms=$ms}};if($now-ge$started.AddSeconds($params.StopDeadlineSeconds)){return @{ok=$false;reason='stop-not-confirmed'}};[Threading.Thread]::Sleep(10)}while($true)}catch{@{ok=$false;reason='psmux-command-failed'}}}.GetNewClosure()
  $suspend={param($SessionId)[void]$calls.Add(@{verb='suspend';session_id=$SessionId;args=@{};receipt_present=$false});@{ok=$false;reason='not-used-in-p1'}}.GetNewClosure()
  $resume={param($SessionId)[void]$calls.Add(@{verb='resume';session_id=$SessionId;args=@{};receipt_present=$false});@{ok=$false;reason='not-used-in-p1'}}.GetNewClosure()
  $emit={param($Run)[void]$calls.Add(@{verb='emit_observation';session_id='';args=@{};receipt_present=$false});return @()}.GetNewClosure()
  @{backend='psmux';launch=$launch;probe=$probe;suspend=$suspend;resume=$resume;stop=$stop;emit_observation=$emit;calls=$calls;sessions=$sessions}
}
