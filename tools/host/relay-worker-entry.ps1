param(
  [Parameter(Mandatory)][string]$Receipt,
  [Parameter(Mandatory)][string]$BriefRef,
  [Parameter(Mandatory)][ValidateSet('claude','codex')][string]$Cli,
  [string]$ConfigDir,
  [string]$WorkDir,
  [switch]$DryRun
)
$ErrorActionPreference='Stop'
$receiptPath=[IO.Path]::GetFullPath($Receipt);$briefPath=[IO.Path]::GetFullPath($BriefRef)
$value=Get-Content -LiteralPath $receiptPath -Raw|ConvertFrom-Json -AsHashtable -DateKind String
$runRoot=Split-Path -Parent (Split-Path -Parent $receiptPath)
if([string]::IsNullOrWhiteSpace($WorkDir)){$WorkDir=Join-Path $runRoot 'work'}
$WorkDir=[IO.Path]::GetFullPath($WorkDir);if(-not(Test-Path -LiteralPath $WorkDir)){[void](New-Item -ItemType Directory -Path $WorkDir -Force)}
$env:RELAY_RECEIPT=$receiptPath;$env:RELAY_RUN_ROOT=$runRoot
$env:RELAY_ATTEMPT_DIR=[IO.Path]::GetFullPath((Join-Path $runRoot "attempts/$($value.node_id)/$($value.attempt_id)"))
$env:RELAY_TOOL=[IO.Path]::GetFullPath((Join-Path $PSScriptRoot 'relay-agent-tool.ps1'))
# 主控 2026-08-15 实测（F-012）：psmux pane 会继承一个空值 CLAUDE_CONFIG_DIR 与主控会话的 CLAUDECODE/CLAUDE_CODE_CHILD_SESSION 标记，
# 交互 claude 会因此显示"Not logged in"/子会话告警；未显式指定 -ConfigDir 时只清**空值**继承（R1-02/R2-05：非空的他账号 CLAUDE_CONFIG_DIR 是刻意设置，须透传，与 run-dogfood 同一谓词），
# 并清掉主控会话标记，让 CLI 用默认（或透传的）账号配置。
if(-not[string]::IsNullOrWhiteSpace($ConfigDir)){$env:CLAUDE_CONFIG_DIR=[IO.Path]::GetFullPath($ConfigDir)}elseif((Test-Path Env:CLAUDE_CONFIG_DIR)-and[string]::IsNullOrWhiteSpace($env:CLAUDE_CONFIG_DIR)){Remove-Item Env:CLAUDE_CONFIG_DIR -ErrorAction SilentlyContinue}
foreach($inherited in @('CLAUDECODE','CLAUDE_CODE_CHILD_SESSION','CLAUDE_CODE_ENTRYPOINT','CLAUDE_CODE_SESSION_ID','CLAUDE_PID')){Remove-Item "Env:$inherited" -ErrorAction SilentlyContinue}
Set-Location $WorkDir
$brief=Get-Content -LiteralPath $briefPath -Raw
$fixed="你是 relay worker，身份见 `$env:RELAY_RECEIPT；写进度用 pwsh -File `$env:RELAY_TOOL checkpoint，交棒用 pwsh -File `$env:RELAY_TOOL result；不要改 Runner 状态文件；决策问题直接在本窗口问用户并等待回复。"
$prompt="$fixed`n`n$brief"
$banner="[relay-worker] session=$($value.session_id) launch=$($value.launch_id) node=$($value.node_id) attempt=$($value.attempt_id)"
Write-Host $banner
if($DryRun){
  Write-Host "RELAY_RECEIPT=$env:RELAY_RECEIPT";Write-Host "RELAY_RUN_ROOT=$env:RELAY_RUN_ROOT";Write-Host "RELAY_ATTEMPT_DIR=$env:RELAY_ATTEMPT_DIR";Write-Host "RELAY_TOOL=$env:RELAY_TOOL"
  if($Cli-ceq'claude'){Write-Host "claude --dangerously-skip-permissions $prompt"}else{Write-Host "codex --yolo $prompt"}
  exit 0
}
if($Cli-ceq'claude'){& claude --dangerously-skip-permissions $prompt}else{& codex --yolo $prompt}
$code=$LASTEXITCODE;Write-Host "[relay-worker] cli exited $code";Start-Sleep -Seconds 5;exit $code
