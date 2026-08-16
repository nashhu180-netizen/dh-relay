param(
  [Parameter(Position=0)][ValidateSet('checkpoint','result','propose')][string]$Command,
  [string]$Status,
  [string]$Note,
  [string]$Question,
  [string[]]$Options,
  [string[]]$Tried,
  [string]$Summary,
  [ValidateSet('review','next_stage','none')][string]$NextAction='none',
  [string]$HandoffBody,
  [string]$TailFrom,
  [string[]]$ChangedPaths,
  [string[]]$TestsRun,
  [string]$PlanFile,
  [string]$InboxDir
)

. (Join-Path $PSScriptRoot '../contracts/relay-schema.ps1')
. (Join-Path $PSScriptRoot '../contracts/relay-redaction.ps1')

function Get-RelayAgentIdentity {
  if([string]::IsNullOrWhiteSpace($env:RELAY_RECEIPT)-or-not(Test-Path -LiteralPath $env:RELAY_RECEIPT)){throw 'relay-agent-tool: RELAY_RECEIPT missing'}
  $receiptPath=[IO.Path]::GetFullPath($env:RELAY_RECEIPT)
  $receipt=Get-Content -LiteralPath $receiptPath -Raw|ConvertFrom-Json -AsHashtable -DateKind String
  $check=Test-RelayLaunchReceipt $receipt
  if(-not$check.ok){throw "relay-agent-tool: receipt invalid: $($check.reason)"}
  $runRoot=Split-Path -Parent (Split-Path -Parent $receiptPath)
  @{
    plan_version=$receipt.plan_version;plan_hash=$receipt.plan_hash;authority_generation=$receipt.authority_generation
    node_id=$receipt.node_id;attempt_id=$receipt.attempt_id;launch_id=$receipt.launch_id;session_id=$receipt.session_id
    run_root=$runRoot
  }
}

function Get-RelayAgentAttemptDir([hashtable]$Identity) {
  [IO.Path]::GetFullPath((Join-Path $Identity.run_root "attempts/$($Identity.node_id)/$($Identity.attempt_id)"))
}

function Write-RelayAgentTextAtomic([string]$Path,[string]$Text) {
  $parent=Split-Path -Parent $Path;if(-not(Test-Path -LiteralPath $parent)){[void](New-Item -ItemType Directory -Path $parent -Force)}
  $partial="$Path.partial";[IO.File]::WriteAllText($partial,$Text,[Text.UTF8Encoding]::new($false));[IO.File]::Move($partial,$Path,$true);$Path
}

function Write-RelayAgentJsonTmp([string]$Path,[hashtable]$Value) {
  $parent=Split-Path -Parent $Path;if(-not(Test-Path -LiteralPath $parent)){[void](New-Item -ItemType Directory -Path $parent -Force)}
  $partial=if($Path.EndsWith('.json.tmp')){$Path.Substring(0,$Path.Length-9)+'.partial'}else{"$Path.partial"}
  [IO.File]::WriteAllText($partial,($Value|ConvertTo-Json -Depth 100 -Compress),[Text.UTF8Encoding]::new($false));[IO.File]::Move($partial,$Path,$true);$Path
}

function Get-RelayAgentIdentityFields([hashtable]$Identity) {
  @{schema_version='relay/v1';plan_version=$Identity.plan_version;plan_hash=$Identity.plan_hash;authority_generation=$Identity.authority_generation;node_id=$Identity.node_id;attempt_id=$Identity.attempt_id;launch_id=$Identity.launch_id;session_id=$Identity.session_id}
}

function Expand-RelayAgentList([string[]]$Values) {
  if($null-eq$Values){return @()}
  return @($Values|ForEach-Object{$_ -split ','}|ForEach-Object{$_.Trim()}|Where-Object{-not[string]::IsNullOrWhiteSpace($_)})
}

function New-RelayAgentCheckpoint([hashtable]$Identity,[string]$CheckpointStatus,[string]$ProgressNote,[string[]]$Attempted,[string]$DecisionPrompt,[string[]]$DecisionChoices) {
  # F-018（decision dogfood run1 A worker 逮到）：不带 -Note 时 progress_note 为空被 schema 拒（bad-type:progress_note）→ 给确定性默认值
  if([string]::IsNullOrWhiteSpace($ProgressNote)){$ProgressNote="checkpoint $CheckpointStatus"}
  $value=Get-RelayAgentIdentityFields $Identity;$value.status=$CheckpointStatus;$value.progress_note=$ProgressNote;$value.written_at=[DateTimeOffset]::UtcNow.ToString('o')
  if($null-ne$Attempted-and$Attempted.Count-gt0){$value.tried=@($Attempted)}
  if($CheckpointStatus-ceq'decision_required'){$value.question=$DecisionPrompt;$value.options=@($DecisionChoices)}
  $check=Test-RelayCheckpoint $value;if(-not$check.ok){return @{ok=$false;validation_error=$check.reason}}
  $path=Join-Path (Get-RelayAgentAttemptDir $Identity) 'checkpoint.json.tmp';[void](Write-RelayAgentJsonTmp $path $value);@{ok=$true;path=$path;value=$value}
}

function Write-RelayAgentHandoff([hashtable]$Identity,[string]$BodyPath) {
  if([string]::IsNullOrWhiteSpace($BodyPath)-or-not(Test-Path -LiteralPath $BodyPath)){throw 'relay-agent-tool: handoff body file missing'}
  $header="<!-- dh:relay-handoff v1 plan_version=$($Identity.plan_version) plan_hash=$($Identity.plan_hash) authority_generation=$($Identity.authority_generation) node_id=$($Identity.node_id) attempt_id=$($Identity.attempt_id) launch_id=$($Identity.launch_id) session_id=$($Identity.session_id) -->"
  $text="$header`n$(Get-Content -LiteralPath $BodyPath -Raw)";$check=Test-RelayHandoffHeader $text
  if(-not$check.ok){return @{ok=$false;validation_error=$check.reason}}
  $path=Join-Path (Get-RelayAgentAttemptDir $Identity) 'handoff.md';[void](Write-RelayAgentTextAtomic $path $text);@{ok=$true;path=$path}
}

function Write-RelayAgentTail([hashtable]$Identity,[string]$SourcePath) {
  $text=if([string]::IsNullOrWhiteSpace($SourcePath)){''}else{if(-not(Test-Path -LiteralPath $SourcePath)){throw 'relay-agent-tool: tail source file missing'};Get-Content -LiteralPath $SourcePath -Raw}
  $params=Import-PowerShellDataFile (Join-Path $PSScriptRoot '../contracts/relay-params.psd1');$clean=Invoke-RelayTailSanitize $text $params.SessionTailMaxBytes
  $path=Join-Path (Get-RelayAgentAttemptDir $Identity) 'session-tail.txt';[void](Write-RelayAgentTextAtomic $path $clean.text);@{ok=$true;path=$path;hits=@($clean.hits)}
}

function Get-RelayAgentGitSnapshot([string]$WorkDir) {
  try{
    $commit=@(& git -C $WorkDir rev-parse HEAD 2>$null);if($LASTEXITCODE-ne0-or$commit.Count-eq0){throw 'git unavailable'}
    $status=@(& git -C $WorkDir status --short 2>$null);if($LASTEXITCODE-ne0){throw 'git unavailable'}
    $paths=@($status|ForEach-Object{if($_.Length-gt3){$_.Substring(3)}else{$_}}|Where-Object{-not[string]::IsNullOrWhiteSpace($_)})
    $stat=(@(& git -C $WorkDir diff --stat 2>$null)-join"`n").Trim();if($LASTEXITCODE-ne0){throw 'git unavailable'};if([string]::IsNullOrWhiteSpace($stat)){$stat='clean'}
    @{commit="$($commit[0])";changed_paths=@($paths);diff_stat=$stat}
  }catch{@{commit='n/a';changed_paths=@();diff_stat='n/a'}}
}

function New-RelayAgentResult([hashtable]$Identity,[string]$ResultStatus,[string]$ResultSummary,[string]$Action,[string]$BodyPath,[string]$TailPath,[string[]]$Paths,[string[]]$Suites) {
  $handoff=Write-RelayAgentHandoff $Identity $BodyPath;if(-not$handoff.ok){return $handoff}
  $tail=Write-RelayAgentTail $Identity $TailPath;if(-not$tail.ok){return $tail}
  $value=Get-RelayAgentIdentityFields $Identity;$value.result_status=$ResultStatus;$value.next_action=$Action;$value.summary=$ResultSummary
  # F-013（dogfood run1 B worker 逮到）：空列表经 [string[]] 参数进来是 $null，@($null) 会变成含 null 的单元素数组被 schema 拒收；过滤 null 保空数组
  $value.handoff_ref="attempts/$($Identity.node_id)/$($Identity.attempt_id)/handoff.md";$value.changed_paths=@($Paths|Where-Object{$null-ne$_});$value.tests_run=@($Suites|Where-Object{$null-ne$_})
  $value.git_snapshot=Get-RelayAgentGitSnapshot (Get-Location).Path;$value.written_at=[DateTimeOffset]::UtcNow.ToString('o')
  $check=Test-RelayResult $value;if(-not$check.ok){return @{ok=$false;validation_error=$check.reason}}
  $path=Join-Path (Get-RelayAgentAttemptDir $Identity) 'result.json.tmp';[void](Write-RelayAgentJsonTmp $path $value);@{ok=$true;path=$path;value=$value}
}

# propose 的调用者是 orchestrator/replanner（一次性 headless agent），它们没有 launch receipt：
# inbox 位置按 -InboxDir → $env:RELAY_RUN_ROOT/inbox → receipt 推出的 run_root/inbox 依次取，都没有则 throw。
function Get-RelayAgentInboxRoot([hashtable]$Identity,[string]$DestinationRoot) {
  if(-not[string]::IsNullOrWhiteSpace($DestinationRoot)){return [IO.Path]::GetFullPath($DestinationRoot)}
  if(-not[string]::IsNullOrWhiteSpace($env:RELAY_RUN_ROOT)){return [IO.Path]::GetFullPath((Join-Path $env:RELAY_RUN_ROOT 'inbox'))}
  if($null-ne$Identity){return (Join-Path $Identity.run_root 'inbox')}
  throw 'relay-agent-tool: inbox location missing (pass -InboxDir or set RELAY_RUN_ROOT)'
}

function New-RelayAgentProposal([hashtable]$Identity,[string]$SourcePath,[string]$DestinationRoot) {
  if([string]::IsNullOrWhiteSpace($SourcePath)-or-not(Test-Path -LiteralPath $SourcePath)){throw 'relay-agent-tool: plan file missing'}
  $value=Get-Content -LiteralPath $SourcePath -Raw|ConvertFrom-Json -AsHashtable -DateKind String
  if(-not$value.ContainsKey('plan_hash')){$value.plan_hash=Get-RelayPlanHash $value}
  $check=Test-RelayPlanProposal $value;if(-not$check.ok){return @{ok=$false;validation_error=$check.reason}}
  $root=Get-RelayAgentInboxRoot $Identity $DestinationRoot
  $path=Join-Path $root "proposal-v$($value.plan_version).json";[void](Write-RelayAgentJsonTmp $path $value);@{ok=$true;path=$path;value=$value}
}

if($MyInvocation.InvocationName-ne'.'){
  try{
    $identity=if($Command-ceq'propose'-and[string]::IsNullOrWhiteSpace($env:RELAY_RECEIPT)){$null}else{Get-RelayAgentIdentity}
    if($Command-ceq'checkpoint'){$out=New-RelayAgentCheckpoint $identity $Status $Note (Expand-RelayAgentList $Tried) $Question (Expand-RelayAgentList $Options)}
    elseif($Command-ceq'result'){$out=New-RelayAgentResult $identity $Status $Summary $NextAction $HandoffBody $TailFrom (Expand-RelayAgentList $ChangedPaths) (Expand-RelayAgentList $TestsRun)}
    else{$out=New-RelayAgentProposal $identity $PlanFile $InboxDir}
    if(-not$out.ok){[Console]::Error.WriteLine("relay-agent-tool: validation failed: $($out.validation_error)");exit 4}
    Write-Host "wrote $($out.path)";exit 0
  }catch{
    [Console]::Error.WriteLine($_.Exception.Message)
    if($_.Exception.Message-ceq'relay-agent-tool: RELAY_RECEIPT missing'){exit 3}
    exit 4
  }
}
