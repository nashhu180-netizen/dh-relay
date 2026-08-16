#requires -Version 7.0
<#
  tools/relay/adapters/preflight/Invoke-RelayBackendPreflight.ps1 — DHR_03 批0/A6：终端后端 preflight（A7 判据）

  同一判据表对 psmux（默认后端）与 orca（纯终端宿主候选）各做一次实测，产出机器可读 JSON + 截图。
  判据（design/01 A7）：
    P1 1:1        receipt.launch_id ↔ 宿主返回的完整唯一 session handle 一一对应（全等恰 1 条）
    P2 visible    界面可见（psmux：user32 EnumWindows 找到标题全等 `RELAY:<name>` 的可见顶层窗口；orca：terminal list 含该 handle 且 surface/tab 可寻址）
    P3 interactive 界面可交互（psmux：session_attached>=1 ∧ list-clients 含 name ∧ send-keys 回显；orca：terminal send 后 read 回显）
    P4 probe 全值  连续 3 次 probe 每字段与首次登记全等
    P5 exact-exit 按该 handle 回收后在有界期限内确认 exited（psmux：list-sessions 全等不存在 + 客户端进程消失；orca：read.status=exited / wait --for exit）
    P6 trap       （仅 psmux·不计 pass/fail）`kill-session -t =<name>` 静默无效的陷阱复现留痕
  用法：
    pwsh -File Invoke-RelayBackendPreflight.ps1 -Backend psmux -Level primitives -Out <dir>
    pwsh -File Invoke-RelayBackendPreflight.ps1 -Backend orca  -Level primitives -Out <dir> [-OrcaWorktree <path>]
    pwsh -File Invoke-RelayBackendPreflight.ps1 -Backend psmux -Level adapter    -Out <dir>   # 走 psmux-adapter.ps1（批A 后可用）
  退出码：0 全部 pass / 3 有 fail / 4 环境缺失
  注意：send-keys 只在本 preflight 的 P3 里用（证明可交互）；adapter 本体禁止任何输入 API。
#>
param(
  [Parameter(Mandatory)][ValidateSet('psmux','orca')][string]$Backend,
  [ValidateSet('primitives','adapter')][string]$Level = 'primitives',
  [Parameter(Mandatory)][string]$Out,
  [string]$SessionTag = ('PF-' + (Get-Date).ToString('yyyyMMddHHmmss')),
  [int]$AttachDeadlineSeconds = 10,
  [int]$StopDeadlineSeconds = 10,
  [string]$OrcaWorktree = ''
)
[Console]::OutputEncoding = [Text.Encoding]::UTF8
$ErrorActionPreference = 'Stop'
$script:Checks = [Collections.Generic.List[hashtable]]::new()
$script:Shots = [Collections.Generic.List[string]]::new()
New-Item -ItemType Directory -Path $Out -Force | Out-Null

function Add-Check([string]$Id,[bool]$Pass,[string]$Detail,$Raw=$null,[int]$Ms=0,[bool]$Informational=$false) {
  $script:Checks.Add(@{ id=$Id; pass=$Pass; detail=$Detail; raw=$Raw; ms=$Ms; informational=$Informational })
  $tag = if ($Informational) { 'INFO' } elseif ($Pass) { 'PASS' } else { 'FAIL' }
  Write-Host ("{0,-4} {1,-4} {2}" -f $tag,$Id,$Detail)
}
function Invoke-Exe([string]$Exe,[string[]]$Arguments) {
  $psi = [Diagnostics.ProcessStartInfo]::new()
  $psi.FileName = $Exe; $psi.UseShellExecute = $false; $psi.RedirectStandardOutput = $true; $psi.RedirectStandardError = $true
  $psi.StandardOutputEncoding = [Text.Encoding]::UTF8; $psi.StandardErrorEncoding = [Text.Encoding]::UTF8
  foreach ($a in $Arguments) { $psi.ArgumentList.Add($a) }
  $p = [Diagnostics.Process]::Start($psi)
  $stdout = $p.StandardOutput.ReadToEnd(); $stderr = $p.StandardError.ReadToEnd(); $p.WaitForExit()
  @{ exit=$p.ExitCode; stdout=$stdout; stderr=$stderr; argv=@($Exe)+$Arguments }
}
Add-Type -Namespace RelayPf -Name Win32 -MemberDefinition @'
public delegate bool EnumWindowsProc(IntPtr hWnd, IntPtr lParam);
[DllImport("user32.dll")] public static extern bool EnumWindows(EnumWindowsProc cb, IntPtr lParam);
[DllImport("user32.dll")] public static extern bool IsWindowVisible(IntPtr h);
[DllImport("user32.dll", CharSet=CharSet.Unicode)] public static extern int GetWindowText(IntPtr h, System.Text.StringBuilder sb, int max);
[DllImport("user32.dll")] public static extern uint GetWindowThreadProcessId(IntPtr h, out uint pid);
'@
function Get-VisibleWindows {
  $list = [Collections.Generic.List[hashtable]]::new()
  $cb = [RelayPf.Win32+EnumWindowsProc]{ param($h,$l)
    if ([RelayPf.Win32]::IsWindowVisible($h)) {
      $sb = [Text.StringBuilder]::new(1024); [void][RelayPf.Win32]::GetWindowText($h,$sb,1024)
      $t = $sb.ToString(); if ($t) { $pid2 = 0; [void][RelayPf.Win32]::GetWindowThreadProcessId($h,[ref]$pid2); $list.Add(@{ hwnd=[int64]$h; pid=[int]$pid2; title=$t }) }
    }; $true }
  [void][RelayPf.Win32]::EnumWindows($cb,[IntPtr]::Zero); return @($list)
}
# 截图与窗口清单复用宿主的 Save-RelayScreenshot：只拍/只记 RELAY:* 窗口（R1-05 + 整屏截图带入他人窗口内容的隐私面）
. (Join-Path $PSScriptRoot '../../host/relay-host.ps1')
function Save-Screenshot([string]$Path) {
  [void](Save-RelayScreenshot $Path)
  $full=[IO.Path]::GetFullPath($Path);Move-Item -LiteralPath "$full.windows.txt" -Destination ($full -replace '\.png$','.windows.txt') -Force
  $script:Shots.Add($Path); Write-Host "shot $Path"
}
$receipt = @{ launch_id='L-PF01'; session_id="S-$SessionTag" }
$sw = [Diagnostics.Stopwatch]::new()

# ============================ psmux ============================
function Invoke-PsmuxPreflightPrimitives {
  if (-not (Get-Command psmux -ErrorAction SilentlyContinue)) { Add-Check 'ENV' $false 'psmux not found'; return }
  $name = "relay-$SessionTag-$($receipt.session_id)"
  $ver = (Invoke-Exe psmux @('-V')).stdout.Trim()
  $cmd = 'Write-Host RELAY-PF-BANNER; while($true){Start-Sleep 1}'
  $clientPid = 0
  try {
    # P1 建会话 + 1:1
    $saved = $env:PSMUX_SESSION; $env:PSMUX_SESSION = $null
    try { $new = Invoke-Exe psmux @('new-session','-d','-s',$name,'-n','pf','--','pwsh','-NoProfile','-NoExit','-Command',$cmd) } finally { if ($null -eq $saved) { Remove-Item Env:PSMUX_SESSION -ErrorAction SilentlyContinue } else { $env:PSMUX_SESSION=$saved } }
    $ls = Invoke-Exe psmux @('list-sessions','-F','#{session_name}|#{session_id}|#{session_attached}')
    $rows = @($ls.stdout -split "`r?`n" | Where-Object { $_ } | ForEach-Object { $p=$_ -split '\|'; @{ name=$p[0]; id=$p[1]; attached=[int]$p[2] } })
    $mine = @($rows | Where-Object { $_.name -ceq $name })
    Add-Check 'P1' ($new.exit -eq 0 -and $mine.Count -eq 1 -and $mine[0].id -match '^\$\d+$') "launch_id=$($receipt.launch_id) ↔ handle {name=$name; psmux_id=$($mine | ForEach-Object id)} exact rows=$($mine.Count)" @{ new=$new; list=$ls }
    # 标题 + 可见客户端
    [void](Invoke-Exe psmux @('set-option','-t',$name,'set-titles','on'))
    [void](Invoke-Exe psmux @('set-option','-t',$name,'set-titles-string','RELAY:#S'))
    $client = Start-Process -FilePath 'psmux' -ArgumentList @('attach','-t',$name) -PassThru -WindowStyle Normal; $clientPid = $client.Id
    $sw.Restart(); $visible=$false; $attached=0
    while ($sw.Elapsed.TotalSeconds -lt $AttachDeadlineSeconds) {
      Start-Sleep -Milliseconds 500
      $visible = [bool](Get-VisibleWindows | Where-Object { $_.title -ceq "RELAY:$name" })
      $ls2 = Invoke-Exe psmux @('list-sessions','-F','#{session_name}|#{session_id}|#{session_attached}')
      $attached = @($ls2.stdout -split "`r?`n" | Where-Object { ($_ -split '\|')[0] -ceq $name } | ForEach-Object { [int](($_ -split '\|')[2]) })[0]
      if ($visible -and $attached -ge 1) { break }
    }
    $ms = [int]$sw.ElapsedMilliseconds
    Save-Screenshot (Join-Path $Out "shot-psmux-visible.png")
    Add-Check 'P2' $visible "visible window title==RELAY:$name found=$visible after ${ms}ms (deadline ${AttachDeadlineSeconds}s)" @{ windows=(Get-VisibleWindows | Where-Object { $_.title -like 'RELAY:*' }) } $ms
    # P3 interactive
    $lc = Invoke-Exe psmux @('list-clients')
    $hasClient = [bool](($lc.stdout -split "`r?`n") | Where-Object { $_ -match [regex]::Escape(": $name`:") -or $_ -match [regex]::Escape($name) })
    [void](Invoke-Exe psmux @('send-keys','-t',$name,'','C-c'))   # 中断 while 循环让 echo 有机会执行
    Start-Sleep 1
    [void](Invoke-Exe psmux @('send-keys','-t',$name,'Write-Host RELAY-PF-OK','Enter'))
    Start-Sleep 2
    $cap = Invoke-Exe psmux @('capture-pane','-p','-t',$name)
    $echoed = $cap.stdout -match 'RELAY-PF-OK'
    Add-Check 'P3' ($attached -ge 1 -and $hasClient -and $echoed) "attached=$attached list-clients=$hasClient send-keys echo=$echoed" @{ clients=$lc; capture=$cap }
    # P4 probe 全值 ×3
    $probes = @(); for ($i=0;$i -lt 3;$i++) { $lp = Invoke-Exe psmux @('list-panes','-t',$name,'-F','#{session_name}|#{window_id}|#{pane_id}|#{pane_pid}|#{pane_dead}'); $probes += $lp.stdout.Trim(); Start-Sleep -Milliseconds 300 }
    $allEq = ($probes | Select-Object -Unique).Count -eq 1 -and $probes[0] -like "$name|*"
    Add-Check 'P4' $allEq "3 probes identical=$allEq first=$($probes[0])" @{ probes=$probes }
    # P6 trap: -t =name
    $trap = Invoke-Exe psmux @('kill-session','-t',"=$name")
    $ls3 = Invoke-Exe psmux @('list-sessions','-F','#{session_name}')
    $stillThere = [bool](($ls3.stdout -split "`r?`n") | Where-Object { $_ -ceq $name })
    Add-Check 'P6' $true "trap: kill-session -t =name exit=$($trap.exit) session_still_exists=$stillThere (expected trap: exit 0 yet still exists)" @{ kill=$trap; list=$ls3 } 0 $true
    # P5 exact exit（裸名）
    $sw.Restart(); $kill = Invoke-Exe psmux @('kill-session','-t',$name)
    $gone=$false; $clientGone=$false
    while ($sw.Elapsed.TotalSeconds -lt $StopDeadlineSeconds) {
      Start-Sleep -Milliseconds 300
      $ls4 = Invoke-Exe psmux @('list-sessions','-F','#{session_name}')
      $gone = -not [bool](($ls4.stdout -split "`r?`n") | Where-Object { $_ -ceq $name })
      $clientGone = -not [bool](Get-Process -Id $clientPid -ErrorAction SilentlyContinue)
      if ($gone -and $clientGone) { break }
    }
    $ms5 = [int]$sw.ElapsedMilliseconds
    Add-Check 'P5' ($kill.exit -eq 0 -and $gone -and $clientGone) "kill exit=$($kill.exit) session_gone=$gone client_pid_gone=$clientGone after ${ms5}ms (deadline ${StopDeadlineSeconds}s)" @{ kill=$kill } $ms5
  } finally {
    [void](Invoke-Exe psmux @('kill-session','-t',$name))
    if ($clientPid) { Stop-Process -Id $clientPid -Force -ErrorAction SilentlyContinue }
  }
  return @{ backend_version=$ver; session_name=$name }
}

# adapter 须在脚本作用域点源：其动词闭包（GetNewClosure）在自身模块作用域里解析 Get-RelayPsmux* 函数，函数内点源不可见
$script:PsmuxAdapterPath = Join-Path $PSScriptRoot '..\psmux-adapter.ps1'
if (Test-Path $script:PsmuxAdapterPath) { . (Resolve-Path $script:PsmuxAdapterPath) }

function Invoke-PsmuxPreflightAdapter {
  $adapterPath = $script:PsmuxAdapterPath
  if (-not (Test-Path $adapterPath)) { Add-Check 'ENV' $false "psmux-adapter.ps1 not found ($adapterPath) — 批A 后可用"; return }
  $tmp = Join-Path ([IO.Path]::GetTempPath()) "relay-pf-adapter-$SessionTag"; New-Item -ItemType Directory -Path $tmp -Force | Out-Null
  $launches = Join-Path $tmp 'launches'; New-Item -ItemType Directory -Path $launches -Force | Out-Null
  $handleRoot = Join-Path $tmp 'psmux-handles'
  $fullReceipt = @{ schema_version='relay/v1'; plan_version=1; plan_hash=('0'*64); authority_generation=1; node_id='PF'; attempt_id=1; launch_id=$receipt.launch_id; session_id=$receipt.session_id; role='worker'; backend='psmux'; issued_at=(Get-Date).ToUniversalTime().ToString('o'); launch_deadline_at=(Get-Date).ToUniversalTime().AddSeconds(120).ToString('o') }
  [IO.File]::WriteAllText((Join-Path $launches "$($receipt.launch_id).json"), ($fullReceipt | ConvertTo-Json -Depth 5), [Text.UTF8Encoding]::new($false))
  $run = @{ run_id="RUN-$SessionTag"; paths=@{ launches=$launches } }
  $adapter = New-RelayPsmuxAdapter @{ HandleRoot=$handleRoot; LaunchCommand={ param($R,$N,$Ru) @('pwsh','-NoProfile','-NoExit','-Command','Write-Host RELAY-PF-BANNER; while($true){Start-Sleep 1}') } }
  $ver = (Invoke-Exe psmux @('-V')).stdout.Trim()
  try {
    $sw.Restart(); $l = & $adapter.launch $fullReceipt @{ node_id='PF'; brief_ref='n/a' } $run; $msL=[int]$sw.ElapsedMilliseconds
    $reg = if ($l.ok) { Get-Content (Join-Path $handleRoot "$($receipt.session_id).json") -Raw | ConvertFrom-Json -AsHashtable } else { $null }
    $ls = Invoke-Exe psmux @('list-sessions','-F','#{session_name}|#{session_id}|#{session_attached}')
    $rows = @($ls.stdout -split "`r?`n" | Where-Object { $_ } | ForEach-Object { $p=$_ -split '\|'; @{ name=$p[0]; id=$p[1]; attached=[int]$p[2] } })
    $mine = @($rows | Where-Object { $_.name -ceq $l.handle.session_name })
    Add-Check 'P1' ($l.ok -and $l.session_id -ceq $receipt.session_id -and $reg -and $reg.launch_id -ceq $receipt.launch_id -and $mine.Count -eq 1 -and $mine[0].id -ceq $l.handle.psmux_session_id) "adapter.launch ok=$($l.ok) session_id==receipt=$($l.session_id -ceq $receipt.session_id) registry.launch_id==receipt=$($reg.launch_id -ceq $receipt.launch_id) handle=$($l.handle | ConvertTo-Json -Compress) exact rows=$($mine.Count)" @{ launch=$l; registry=$reg; list=$ls } $msL
    $visible = [bool](Get-VisibleWindows | Where-Object { $_.title -ceq $l.handle.window_title })
    Save-Screenshot (Join-Path $Out "shot-psmux-adapter-visible.png")
    Add-Check 'P2' $visible "visible window title==$($l.handle.window_title) found=$visible (adapter waited ${msL}ms within AttachDeadline)" @{ windows=(Get-VisibleWindows | Where-Object { $_.title -like 'RELAY:*' }) }
    $lc = Invoke-Exe psmux @('list-clients'); $hasClient = [bool](($lc.stdout -split "`r?`n") | Where-Object { $_ -match [regex]::Escape($l.handle.session_name) })
    [void](Invoke-Exe psmux @('send-keys','-t',$l.handle.session_name,'','C-c')); Start-Sleep 1
    [void](Invoke-Exe psmux @('send-keys','-t',$l.handle.session_name,'Write-Host RELAY-PF-OK','Enter')); Start-Sleep 2
    $cap = Invoke-Exe psmux @('capture-pane','-p','-t',$l.handle.session_name); $echoed = $cap.stdout -match 'RELAY-PF-OK'
    Add-Check 'P3' ($mine[0].attached -ge 1 -and $hasClient -and $echoed) "attached=$($mine[0].attached) list-clients=$hasClient send-keys echo=$echoed (send-keys 仅 preflight 使用)" @{ clients=$lc; capture=$cap }
    $probes = @(); for ($i=0;$i -lt 3;$i++) { $p = & $adapter.probe $receipt.session_id; $probes += ($p | ConvertTo-Json -Compress); Start-Sleep -Milliseconds 300 }
    $states = @($probes | ForEach-Object { ($_ | ConvertFrom-Json).terminal_state })
    $allOk = ($probes | ForEach-Object { ($_ | ConvertFrom-Json).ok } | Where-Object { -not $_ }).Count -eq 0
    Add-Check 'P4' ($allOk -and ($states | Where-Object { $_ -cnotin @('running','idle') }).Count -eq 0) "3 adapter probes ok=$allOk states=$($states -join ',') (running/idle by IdleAfterSeconds)" @{ probes=$probes }
    $sw.Restart(); $s = & $adapter.stop $receipt.session_id; $msS=[int]$sw.ElapsedMilliseconds
    $after = & $adapter.probe $receipt.session_id
    $clientGone = -not [bool](Get-Process -Id $l.handle.client_pid -ErrorAction SilentlyContinue)
    Add-Check 'P5' ($s.ok -and $after.terminal_state -ceq 'exited' -and $clientGone) "adapter.stop ok=$($s.ok) exited_after_ms=$($s.exited_after_ms) probe_after=$($after.terminal_state) client_pid_gone=$clientGone (deadline StopDeadlineSeconds)" @{ stop=$s; probe_after=$after } $msS
  } finally {
    try { [void](Invoke-Exe psmux @('kill-session','-t',"relay-RUN-$SessionTag-$($receipt.session_id)")) } catch {}
  }
  return @{ backend_version=$ver; session_name="relay-RUN-$SessionTag-$($receipt.session_id)"; adapter_calls=@($adapter.calls | ForEach-Object { $_.verb }) }
}

# ============================ orca ============================
function Invoke-OrcaPreflightPrimitives {
  if (-not (Get-Command orca -ErrorAction SilentlyContinue)) { Add-Check 'ENV' $false 'orca not found'; return }
  $st = Invoke-Exe orca @('status','--json'); $stj = try { $st.stdout | ConvertFrom-Json } catch { $null }
  if (-not $stj -or -not $stj.ok) { Add-Check 'ENV' $false "orca status not ok: $($st.stdout.Substring(0,[Math]::Min(200,$st.stdout.Length)))"; return }
  $wt = if ($OrcaWorktree) { $OrcaWorktree } else { (Resolve-Path (Join-Path $PSScriptRoot '..\..\..\..')).Path -replace '\\','/' }
  $title = "RELAY:$($receipt.session_id)"
  $handle = $null
  try {
    $sw.Restart(); $c = Invoke-Exe orca @('terminal','create','--worktree',"path:$wt",'--title',$title,'--command','pwsh -NoProfile -NoExit -Command Write-Host RELAY-PF-BANNER','--json')   # 实测 --focus 会让 create 超时（Timed out waiting for terminal handle）; $msC=[int]$sw.ElapsedMilliseconds
    $cj = try { $c.stdout | ConvertFrom-Json } catch { $null }
    if ($cj -and $cj.ok) { $handle = $cj.result.terminal.handle }
    $lst = Invoke-Exe orca @('terminal','list','--worktree',"path:$wt",'--json'); $lj = try { $lst.stdout | ConvertFrom-Json } catch { $null }
    $matches = @(); if ($lj -and $lj.ok) { $matches = @($lj.result.terminals | Where-Object { $_.title -ceq $title }) }
    Add-Check 'P1' ([bool]$handle -and $matches.Count -eq 1 -and $matches[0].handle -ceq $handle) "create ok=$([bool]$handle) handle=$handle list title-exact rows=$($matches.Count) worktree=$wt (${msC}ms)" @{ create=$c; list=$lst } $msC
    if (-not $handle) { Add-Check 'P2' $false 'no handle (create failed)'; Add-Check 'P3' $false 'no handle'; Add-Check 'P4' $false 'no handle'; Add-Check 'P5' $false 'no handle'; return @{ backend_version=$stj.result.runtime.appVersion; handle=$null } }
    $show = Invoke-Exe orca @('terminal','show','--terminal',$handle,'--json'); $sj = try { $show.stdout | ConvertFrom-Json } catch { $null }
    [void](Invoke-Exe orca @('terminal','switch','--terminal',$handle,'--json')); Start-Sleep 1
    Save-Screenshot (Join-Path $Out "shot-orca-visible.png")
    $surfaceVisible = ($cj.result.terminal.surface -ceq 'visible') -and ($matches.Count -eq 1) -and ($stj.result.app.desktopWindowStatus -ceq 'available')
    Add-Check 'P2' $surfaceVisible "surface=$($cj.result.terminal.surface) app.desktopWindowStatus=$($stj.result.app.desktopWindowStatus) list-visible=$($matches.Count -eq 1)（无 OS 级窗口标题可证·仅 app 内 tab）" @{ show=$show }
    [void](Invoke-Exe orca @('terminal','send','--terminal',$handle,'--text','Write-Host RELAY-PF-OK','--enter','--json')); Start-Sleep 2
    $rd = Invoke-Exe orca @('terminal','read','--terminal',$handle,'--json'); $echoed = $rd.stdout -match 'RELAY-PF-OK'
    Add-Check 'P3' ($sj.result.terminal.writable -eq $true -and $echoed) "writable=$($sj.result.terminal.writable) send→read echo=$echoed" @{ read=$rd }
    $probes = @(); for ($i=0;$i -lt 3;$i++) { $p = Invoke-Exe orca @('terminal','show','--terminal',$handle,'--json'); $pj = $p.stdout | ConvertFrom-Json; $probes += "$($pj.result.terminal.handle)|$($pj.result.terminal.ptyId)|$($pj.result.terminal.title)|$($pj.result.terminal.connected)"; Start-Sleep -Milliseconds 300 }
    Add-Check 'P4' (($probes | Select-Object -Unique).Count -eq 1) "3 probes identical first=$($probes[0])" @{ probes=$probes }
    $sw.Restart(); $cl = Invoke-Exe orca @('terminal','close','--terminal',$handle,'--json'); $clj = try { $cl.stdout | ConvertFrom-Json } catch { $null }
    $exited=$false
    while ($sw.Elapsed.TotalSeconds -lt $StopDeadlineSeconds) {
      Start-Sleep -Milliseconds 300
      $r2 = Invoke-Exe orca @('terminal','read','--terminal',$handle,'--json'); $r2j = try { $r2.stdout | ConvertFrom-Json } catch { $null }
      if ($r2j -and $r2j.ok -and $r2j.result.terminal.status -ceq 'exited') { $exited=$true; break }
    }
    $ms5=[int]$sw.ElapsedMilliseconds
    $lst2 = Invoke-Exe orca @('terminal','list','--worktree',"path:$wt",'--json'); $lj2 = try { $lst2.stdout | ConvertFrom-Json } catch { $null }
    $stillListed = $lj2 -and $lj2.ok -and (@($lj2.result.terminals | Where-Object { $_.handle -ceq $handle }).Count -gt 0)
    Add-Check 'P5' (($clj -and $clj.ok) -and $exited -and -not $stillListed) "close ok=$($clj -and $clj.ok) err=$($clj.error.message) read.status=exited=$exited still_listed=$stillListed after ${ms5}ms" @{ close=$cl } $ms5
  } finally {
    if ($handle) { try { [void](Invoke-Exe orca @('terminal','close','--terminal',$handle,'--json')) } catch {} }
  }
  return @{ backend_version=$stj.result.runtime.appVersion; handle=$handle; worktree=$wt }
}

# ============================ main ============================
Write-Host "=== relay backend preflight backend=$Backend level=$Level tag=$SessionTag ==="
$extra = switch ("$Backend/$Level") {
  'psmux/primitives' { Invoke-PsmuxPreflightPrimitives }
  'psmux/adapter'    { Invoke-PsmuxPreflightAdapter }
  'orca/primitives'  { Invoke-OrcaPreflightPrimitives }
  'orca/adapter'     { Add-Check 'ENV' $false 'orca adapter 不在 DHR_03 范围（K-1）'; $null }
}
$judged = @($script:Checks | Where-Object { -not $_.informational })
$allPass = ($judged.Count -gt 0) -and (($judged | Where-Object { -not $_.pass }).Count -eq 0)
$report = @{
  schema='relay-preflight/v1'; backend=$Backend; level=$Level; session_tag=$SessionTag
  ran_at=(Get-Date).ToUniversalTime().ToString('o'); machine=$env:COMPUTERNAME
  deadlines=@{ attach_seconds=$AttachDeadlineSeconds; stop_seconds=$StopDeadlineSeconds }
  receipt=$receipt; extra=$extra; checks=@($script:Checks); screenshots=@($script:Shots); all_pass=$allPass
}
$outFile = Join-Path $Out "preflight-$Backend-$Level.json"
[IO.File]::WriteAllText($outFile, ($report | ConvertTo-Json -Depth 8), [Text.UTF8Encoding]::new($false))
Write-Host "report $outFile"
Write-Host ("RESULT {0} {1}/{2}: {3}" -f $Backend, ($judged | Where-Object pass).Count, $judged.Count, $(if ($allPass) {'ALL PASS'} else {'HAS FAIL'}))
if ($judged.Count -eq 0) { exit 4 }
exit $(if ($allPass) { 0 } else { 3 })
