$ErrorActionPreference='Stop';[Console]::OutputEncoding=[Text.Encoding]::UTF8
$script:failed=0;$script:assertions=0;$script:roots=[Collections.Generic.List[string]]::new()
function Assert-True([bool]$c,[string]$n){$script:assertions++;if($c){Write-Host "PASS  $n"}else{Write-Host "FAIL  $n";$script:failed++}}
. (Join-Path $PSScriptRoot '../adapters/psmux-adapter.ps1')

function New-TestPsmux([string]$Mode='success') {
  $root=Join-Path ([IO.Path]::GetTempPath()) "relay-psmux-$([guid]::NewGuid().ToString('N'))";$script:roots.Add($root);[void](New-Item -ItemType Directory -Path $root)
  $receiptPath=Join-Path $root 'L-0001.json';'{}'|Set-Content -LiteralPath $receiptPath -Encoding utf8NoBOM
  $fake=@{now=[DateTimeOffset]::Parse('2026-08-15T10:00:00Z');execCalls=[Collections.Generic.List[object]]::new();launchNames=[Collections.Generic.List[string]]::new();clearSeen=$false;killed=$false;captures=0;launchArgv=@();created=($Mode -in @('collision','ambiguous'))}
  $exec={
    param([string[]]$CommandArgs)
    $fake.execCalls.Add(@($CommandArgs))
    if($CommandArgs[0] -eq 'kill-session'){$fake.killed=$true;if($Mode -ne 'sticky'){$fake.created=$false};return @{exit=0;stdout='';stderr=''}}
    if($CommandArgs[0] -eq 'list-sessions'){
      if($Mode -eq 'execfail'){return @{exit=2;stdout='';stderr='FAKE broken'}}
      if($Mode -eq 'stage1fail' -and $fake.launchNames.Count -gt 0){return @{exit=2;stdout='';stderr='FAKE broken after client start'}}
      if($Mode -eq 'ambiguous'){return @{exit=0;stdout="relay-RUN-FAKE-1-S-0001|`$7|1`nrelay-RUN-FAKE-1-S-0001|`$8|1";stderr=''}}
      if($Mode -eq 'collision'){return @{exit=0;stdout='relay-RUN-FAKE-1-S-0001|$7|1';stderr=''}}
      if($Mode -eq 'missing' -or -not $fake.created){return @{exit=1;stdout='';stderr='no server running'}}
      $attached=if($Mode -eq 'unattached'){0}else{1};return @{exit=0;stdout="relay-RUN-FAKE-1-S-0001|`$7|$attached";stderr=''}
    }
    if($CommandArgs[0] -eq 'list-panes'){$dead=if($Mode -eq 'dead'){1}else{0};$activity=1786793396;return @{exit=0;stdout="relay-RUN-FAKE-1-S-0001|@1|%1|39180|$dead|pwsh|$activity|3|0|0|FAKE";stderr=''}}
    # 屏幕指纹：idle 模式内容恒定（无输出）；其余模式每次 capture 都变（持续输出）
    if($CommandArgs[0] -eq 'capture-pane'){$fake.captures++;$text=if($Mode -eq 'idle'){'FAKE-BANNER'}else{"FAKE-BANNER`ntick-$($fake.captures)"};return @{exit=0;stdout=$text;stderr=''}}
    @{exit=0;stdout='';stderr=''}
  }.GetNewClosure()
  $clock={ $value=$fake.now;$fake.now=$fake.now.AddSeconds(6);$value }.GetNewClosure()
  $window={param($Title) $Mode -ne 'invisible'}.GetNewClosure()
  # 窗口拥有会话（K-4 修订）：client launcher 收到 new-session argv，模拟建会话；newfail 模式=窗口起了但会话从未出现
  $client={param($Name,$Argv)if($Mode -eq 'launcherthrow'){throw 'FAKE psmux missing'};$fake.launchNames.Add($Name);$fake.launchArgv=@($Argv);$fake.clearSeen=[string]::IsNullOrEmpty($env:PSMUX_SESSION);if($Mode -notin @('newfail','stage1fail')){$fake.created=$true};4242}.GetNewClosure()
  $fake.stopCalls=[Collections.Generic.List[int]]::new();$stopper={param($ProcessId)$fake.stopCalls.Add([int]$ProcessId)}.GetNewClosure()
  $params=@{SchemaVersion='relay/v1';SessionTailMaxBytes=65536;ProbeMaxConsecutiveFailures=3;StallThresholdSeconds=1800;LaunchDeadlineSeconds=120;IdleAfterSeconds=5;StopDeadlineSeconds=10;AttachDeadlineSeconds=10}
  $process={param($ProcessId) $Mode -notin @('missing','dead') -and -not $fake.killed}.GetNewClosure()
  $adapter=New-RelayPsmuxAdapter @{HandleRoot=$root;Params=$params;Exec=$exec;Clock=$clock;WindowProbe=$window;ClientLauncher=$client;ClientStopper=$stopper;ProcessProbe=$process;LaunchCommand={param($Receipt,$Node,$Run)@('pwsh','-NoProfile','-Command','FAKE')}}
  $receipt=@{launch_id='L-0001';session_id='S-0001'};$node=@{node_id='A';brief_ref='FAKE'};$run=@{run_id='RUN FAKE/1';paths=@{launches=$root}}
  @{root=$root;receipt=$receipt;node=$node;run=$run;adapter=$adapter;receipt_path=$receiptPath;exec=$exec;fake=$fake}
}

try {
  $x=New-TestPsmux
  Assert-True ((@($x.adapter.Keys|Sort-Object)-join',') -ceq 'backend,calls,emit_observation,launch,probe,resume,sessions,stop,suspend') 'adapter has exactly nine keys'
  Assert-True ($x.adapter.backend -ceq 'psmux') 'backend is psmux'
  Assert-True ((Get-RelayPsmuxSessionName 'RUN FAKE/1' 'S-0001') -ceq 'relay-RUN-FAKE-1-S-0001') 'session name is sanitized'
  $env:PSMUX_SESSION='x';$launched=& $x.adapter.launch $x.receipt $x.node $x.run
  Assert-True ($launched.ok -and $launched.session_id -ceq 'S-0001') "launch succeeds with exact receipt session ($($launched.reason))"
  Assert-True ($launched.handle.session_name -ceq 'relay-RUN-FAKE-1-S-0001') 'launch returns session name'
  Assert-True ($launched.handle.psmux_session_id -ceq '$7' -and $launched.handle.pane_id -ceq '%1') 'launch returns psmux ids'
  Assert-True ($launched.handle.pane_pid -eq 39180 -and $launched.handle.client_pid -eq 4242) 'launch returns process ids'
  Assert-True ($launched.handle.window_title -ceq 'RELAY:relay-RUN-FAKE-1-S-0001') 'launch returns exact window title'
  Assert-True ((Test-Path (Join-Path $x.root 'S-0001.json'))) 'registry file exists'
  Assert-True ((Test-Path (Join-Path $x.root 'S-0001.json')) -and (Get-Content -Raw (Join-Path $x.root 'S-0001.json')|ConvertFrom-Json).launch_id -ceq 'L-0001') 'registry binds launch id'
  Assert-True ($x.fake.clearSeen) 'nested-session variable cleared during psmux call'
  Assert-True ($env:PSMUX_SESSION -ceq 'x') 'nested-session variable restored'
  Assert-True ($x.fake.launchNames.Count-eq1-and$x.fake.launchNames[0]-ceq'relay-RUN-FAKE-1-S-0001') 'client launcher receives exact name'
  $verbs=@($x.fake.execCalls|ForEach-Object{$_[0]});Assert-True (($verbs[0..3]-join',') -ceq 'list-sessions,list-sessions,set-option,set-option') 'launch command order is fixed (collision check, wait for session, then titles)'
  Assert-True (@($x.fake.execCalls|Where-Object{$_[0]-eq'new-session'-or$_[0]-like'attach*'}).Count-eq0) 'adapter never runs new-session or attach through exec (window owns the session)'
  Assert-True (($x.fake.launchArgv-join' ') -match '^new-session -s relay-RUN-FAKE-1-S-0001 -n A -- pwsh' -and ($x.fake.launchArgv-join' ') -notmatch ' -d ') 'client launcher receives exact non-detached new-session argv'
  $title=@($x.fake.execCalls|Where-Object{$_[0]-eq'set-option'-and$_[3]-eq'set-titles-string'});Assert-True ($title.Count-eq1-and$title[0][4]-ceq'RELAY:#S') 'title format is fixed'
  $probe=& $x.adapter.probe 'S-0001';Assert-True ($probe.ok-and$probe.terminal_state-eq'running'-and-not$probe.probe_error) 'recent pane probes running'
  $reg=Get-Content -Raw (Join-Path $x.root 'S-0001.json')|ConvertFrom-Json;Assert-True (-not[string]::IsNullOrWhiteSpace($reg.activity_fingerprint) -and -not[string]::IsNullOrWhiteSpace($reg.activity_seen_at)) 'registry records activity fingerprint and time'
  Assert-True (@($x.fake.execCalls|Where-Object{$_[0]-eq'capture-pane'}).Count-ge2) 'probe fingerprints screen via capture-pane'
  $stopped=& $x.adapter.stop 'S-0001';Assert-True ($stopped.ok-and$stopped.exited_after_ms-ge0) 'stop confirms exact exit'
  Assert-True (-not[string]::IsNullOrWhiteSpace((Get-Content -Raw (Join-Path $x.root 'S-0001.json')|ConvertFrom-Json).stopped_at)) 'stop records stopped time'
  Assert-True ((& $x.adapter.stop 'FAKE-UNKNOWN').reason -ceq 'unknown-session') 'unknown stop fails closed'
  Assert-True ((& $x.adapter.suspend 'S-0001').reason -ceq 'not-used-in-p1') 'suspend is unavailable in p1'
  Assert-True ((& $x.adapter.resume 'S-0001').reason -ceq 'not-used-in-p1') 'resume is unavailable in p1'
  Assert-True (@(& $x.adapter.emit_observation $x.run).Count-eq0) 'adapter emits no observations'
  Assert-True (@($x.adapter.calls|Where-Object{@($_.Keys|Sort-Object)-join','-cne'args,receipt_present,session_id,verb'}).Count-eq0) 'every call has four fixed fields'
  Assert-True ($x.adapter.calls[0].receipt_present) 'launch call observes receipt file'

  foreach($case in @(@('collision','session-name-collision'),@('newfail','psmux-new-session-failed'),@('invisible','launch-not-visible'),@('unattached','launch-not-attached'))){$y=New-TestPsmux $case[0];$r=& $y.adapter.launch $y.receipt $y.node $y.run;Assert-True (-not$r.ok-and$r.reason-ceq$case[1]) "$($case[0]) launch fails closed";if($case[0]-eq'collision'){Assert-True (@($y.fake.execCalls|Where-Object{$_[0]-eq'new-session'}).Count-eq0) 'collision does not create session'}else{if($case[0]-in@('invisible','unattached')){Assert-True (@($y.fake.execCalls|Where-Object{$_[0]-eq'kill-session'}).Count-eq1) "$($case[0]) cleanup kills orphan"}}}
  foreach($case in @(@('missing','exited'),@('idle','idle'),@('dead','exited'))){$y=New-TestPsmux $case[0];$null=&$y.adapter.launch $y.receipt $y.node $y.run;if($case[0]-eq'missing'){$handle=@{launch_id='L-0001';session_id='S-0001';session_name='relay-RUN-FAKE-1-S-0001';psmux_session_id='$7';pane_id='%1';pane_pid=39180;client_pid=4242;window_title='RELAY:relay-RUN-FAKE-1-S-0001';launched_at='2026-08-15T10:00:00Z';stopped_at='';client_lost=$false};[void](Write-RelayPsmuxHandle $y.root $handle);$y.adapter.sessions['S-0001']=$handle};$r=&$y.adapter.probe 'S-0001';if($case[0]-eq'idle'){Assert-True ($r.ok-and$r.terminal_state-ceq'running') 'first probe after launch reports running even when screen is quiet (F-015)';$r=&$y.adapter.probe 'S-0001'};Assert-True ($r.ok-and$r.terminal_state-ceq$case[1]) "$($case[0]) probe state";if($case[0]-eq'idle'){$r2=&$y.adapter.probe 'S-0001';Assert-True ($r2.terminal_state-ceq'idle') 'idle stays idle while screen unchanged'}}
  # R2-01（复核轮2）：阶段1 超时 / 中途 psmux 失败，都必须 kill-session + 停窗口进程，不留孤儿窗口
  $y=New-TestPsmux 'newfail';$r=& $y.adapter.launch $y.receipt $y.node $y.run;Assert-True (-not$r.ok-and$r.reason-ceq'psmux-new-session-failed'-and@($y.fake.execCalls|Where-Object{$_[0]-eq'kill-session'}).Count-ge1-and$y.fake.stopCalls.Count-eq1-and$y.fake.stopCalls[0]-eq4242) 'stage-1 timeout kills session and stops the client process (R2-01)'
  $y=New-TestPsmux 'stage1fail';$r=& $y.adapter.launch $y.receipt $y.node $y.run;Assert-True (-not$r.ok-and$r.reason-ceq'psmux-command-failed'-and@($y.fake.execCalls|Where-Object{$_[0]-eq'kill-session'}).Count-ge1-and$y.fake.stopCalls.Count-eq1) 'stage-1 psmux failure after client start also cleans up (R2-01)'
  # R2-03：窗口进程启动本身抛异常（如 psmux 不在 PATH）不许穿透，收敛为 psmux-command-failed
  $y=New-TestPsmux 'launcherthrow';$r=$null;$threw=$false;try{$r=& $y.adapter.launch $y.receipt $y.node $y.run}catch{$threw=$true};Assert-True (-not$threw-and-not$r.ok-and$r.reason-ceq'psmux-command-failed') 'client launcher exception becomes psmux-command-failed instead of escaping (R2-03)'
  # R2-02：stop 时列表瞬态为空但 pane 进程仍活 → 不判 unknown-session，照样 kill 并确认
  $y=New-TestPsmux 'listgone';$null=&$y.adapter.launch $y.receipt $y.node $y.run;$y.fake.created=$false;$r=&$y.adapter.stop 'S-0001';Assert-True ($r.ok-and@($y.fake.execCalls|Where-Object{$_[0]-eq'kill-session'}).Count-eq1) 'stop with transiently empty list but live pane still kills and confirms (R2-02)'
  # F-017：list-sessions 里没有它、但 pane 进程仍活 → 不许判 exited，报 probe_error（有界 fail-closed）
  $y=New-TestPsmux 'listgone';$null=&$y.adapter.launch $y.receipt $y.node $y.run;$y.fake.created=$false;$r=&$y.adapter.probe 'S-0001';Assert-True (-not$r.ok-and$r.probe_error-and$r.reason-ceq'psmux-command-failed') 'session missing from list while pane process alive is a probe error, not exited'
  $y=New-TestPsmux 'execfail';$handle=@{launch_id='L-0001';session_id='S-0001';session_name='relay-RUN-FAKE-1-S-0001';psmux_session_id='$7';pane_id='%1';pane_pid=39180;client_pid=4242;window_title='RELAY:relay-RUN-FAKE-1-S-0001';launched_at='2026-08-15T10:00:00Z';stopped_at='';client_lost=$false};[void](Write-RelayPsmuxHandle $y.root $handle);$y.adapter.sessions['S-0001']=$handle;$r=&$y.adapter.probe 'S-0001';Assert-True (-not$r.ok-and$r.probe_error-and$r.reason-ceq'psmux-command-failed') 'psmux failure becomes probe error'
  $y=New-TestPsmux 'ambiguous';[void](Write-RelayPsmuxHandle $y.root $handle);$y.adapter.sessions['S-0001']=$handle;$r=&$y.adapter.probe 'S-0001';Assert-True (-not$r.ok-and$r.reason-ceq'ambiguous-session') 'ambiguous exact session fails closed'
  $y=New-TestPsmux 'sticky';$null=&$y.adapter.launch $y.receipt $y.node $y.run;$r=&$y.adapter.stop 'S-0001';Assert-True (-not$r.ok-and$r.reason-ceq'stop-not-confirmed') 'stop timeout fails closed'
  $allArgs=@($y.fake.execCalls|ForEach-Object{$_});$badTargets=0;foreach($argv in $allArgs){for($i=0;$i-lt$argv.Count-1;$i++){if($argv[$i]-ceq'-t'-and$argv[$i+1].StartsWith('=')){$badTargets++}}};Assert-True ($badTargets-eq0) 'no equals-prefixed target is used'
  Assert-True (@(Select-String -LiteralPath (Join-Path $PSScriptRoot '../adapters/psmux-adapter.ps1') -Pattern 'send-keys|paste-buffer|load-buffer|has-session').Count-eq0) 'adapter exposes no terminal input or imprecise existence command'
  Assert-True (@(Select-String -LiteralPath (Join-Path $PSScriptRoot '../adapters/psmux-adapter.ps1') -Pattern "'attach'|'attach-session'").Count-eq0) 'adapter never calls attach (F-016: attach -t ignores target)'
  $params=Import-PowerShellDataFile (Join-Path $PSScriptRoot '../contracts/relay-params.psd1');Assert-True ($params.Count-eq8) 'params has exactly eight keys';Assert-True ($params.IdleAfterSeconds-gt0-and$params.StopDeadlineSeconds-gt0-and$params.AttachDeadlineSeconds-gt0) 'new deadlines are positive'
} finally {Remove-Item Env:PSMUX_SESSION -ErrorAction SilentlyContinue;foreach($root in $script:roots){if(Test-Path $root){Remove-Item -LiteralPath $root -Recurse -Force}}}
Write-Host "ASSERTIONS $script:assertions";if($script:failed){Write-Host "SUITE FAIL ($script:failed)";exit 1};Write-Host 'SUITE PASS';exit 0
