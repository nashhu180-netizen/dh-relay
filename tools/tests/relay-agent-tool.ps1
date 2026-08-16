$ErrorActionPreference='Stop';[Console]::OutputEncoding=[Text.Encoding]::UTF8;$script:failed=0;$script:assertions=0
function Assert-True([bool]$Condition,[string]$Name){$script:assertions++;if($Condition){Write-Host "PASS  $Name"}else{Write-Host "FAIL  $Name";$script:failed++}}
function Invoke-AgentTool([string[]]$CommandArgs){$output=@(& pwsh -NoProfile -File $tool @CommandArgs 2>&1);@{exit=$LASTEXITCODE;output=($output-join"`n")}}
. (Join-Path $PSScriptRoot '../contracts/relay-schema.ps1')
$tool=Join-Path $PSScriptRoot '../host/relay-agent-tool.ps1';$entry=Join-Path $PSScriptRoot '../host/relay-worker-entry.ps1';$fixtures=Join-Path $PSScriptRoot 'fixtures/host'
$root=Join-Path ([IO.Path]::GetTempPath()) "relay-test-agent-tool-$([guid]::NewGuid().ToString('N'))";$oldReceipt=$env:RELAY_RECEIPT
try{
  [void](New-Item -ItemType Directory -Path (Join-Path $root 'FAKE-RUN/launches') -Force)
  $receipt=Join-Path $root 'FAKE-RUN/launches/L-0001.json';Copy-Item -LiteralPath (Join-Path $fixtures 'receipt-A1.json') -Destination $receipt
  Remove-Item Env:RELAY_RECEIPT -ErrorAction SilentlyContinue
  $missing=Invoke-AgentTool @('checkpoint','-Status','working','-Note','FAKE note')
  Assert-True ($missing.exit-eq3) 'missing receipt exits 3'
  Assert-True ($missing.output-match'RELAY_RECEIPT missing'-and$missing.output-match'relay-agent-tool') 'missing receipt prints fixed diagnostic'

  $env:RELAY_RECEIPT=$receipt
  $working=Invoke-AgentTool @('checkpoint','-Status','working','-Note','FAKE working','-Tried','FAKE-one,FAKE-two')
  $attempt=Join-Path $root 'FAKE-RUN/attempts/A/1';$checkpointPath=Join-Path $attempt 'checkpoint.json.tmp'
  Assert-True ($working.exit-eq0-and$working.output-match'wrote .+checkpoint\.json\.tmp') 'working checkpoint reports success'
  Assert-True (Test-Path -LiteralPath $checkpointPath) 'working checkpoint written to attempt directory'
  $checkpoint=Get-Content -LiteralPath $checkpointPath -Raw|ConvertFrom-Json -AsHashtable -DateKind String
  Assert-True ((Test-RelayCheckpoint $checkpoint).ok) 'working checkpoint passes frozen schema'
  $identity=@('plan_version','plan_hash','authority_generation','node_id','attempt_id','launch_id','session_id')
  $receiptValue=Get-Content -LiteralPath $receipt -Raw|ConvertFrom-Json -AsHashtable -DateKind String
  Assert-True (@($identity|Where-Object{$checkpoint[$_] -cne $receiptValue[$_]}).Count-eq0) 'checkpoint identity has seven exact receipt fields'
  Assert-True ($checkpoint.progress_note-ceq'FAKE working'-and($checkpoint.tried-join',')-ceq'FAKE-one,FAKE-two') 'checkpoint carries note and tried list'
  Assert-True (@(Get-ChildItem -LiteralPath $attempt -Filter '*.partial' -Recurse).Count-eq0) 'checkpoint leaves no partial file'

  $decision=Invoke-AgentTool @('checkpoint','-Status','decision_required','-Note','FAKE waiting','-Question','FAKE choice?','-Options','FAKE-A,FAKE-B','-Tried','FAKE check')
  $decisionValue=Get-Content -LiteralPath $checkpointPath -Raw|ConvertFrom-Json -AsHashtable -DateKind String
  Assert-True ($decision.exit-eq0-and(Test-RelayCheckpoint $decisionValue).ok) 'decision checkpoint passes frozen schema'
  Assert-True ($decisionValue.question-ceq'FAKE choice?'-and($decisionValue.options-join',')-ceq'FAKE-A,FAKE-B') 'decision checkpoint preserves prompt fields'
  # F-018：decision checkpoint 不带 -Note 也必须能写（默认 progress_note）
  $noNote=Invoke-AgentTool @('checkpoint','-Status','decision_required','-Question','FAKE choice?','-Options','FAKE-A,FAKE-B')
  $noNoteValue=Get-Content -LiteralPath $checkpointPath -Raw|ConvertFrom-Json -AsHashtable -DateKind String
  Assert-True ($noNote.exit-eq0-and(Test-RelayCheckpoint $noNoteValue).ok-and-not[string]::IsNullOrWhiteSpace($noNoteValue.progress_note)) 'decision checkpoint without note gets a default progress note'
  $before=(Get-FileHash -LiteralPath $checkpointPath).Hash
  $invalidDecision=Invoke-AgentTool @('checkpoint','-Status','decision_required','-Note','FAKE waiting','-Options','FAKE-A')
  Assert-True ($invalidDecision.exit-eq4) 'invalid decision exits 4'
  Assert-True ((Get-FileHash -LiteralPath $checkpointPath).Hash-ceq$before) 'invalid decision does not replace valid checkpoint'

  $longTail=Join-Path $root 'long-tail.txt';$tailText=('FAKE-PREFIX-'*7000)+(Get-Content -LiteralPath (Join-Path $fixtures 'session-tail.txt') -Raw);[IO.File]::WriteAllText($longTail,$tailText,[Text.UTF8Encoding]::new($false))
  $resultRun=Invoke-AgentTool @('result','-Status','succeeded','-Summary','FAKE finished','-NextAction','none','-HandoffBody',(Join-Path $fixtures 'handoff-body.md'),'-TailFrom',$longTail,'-ChangedPaths','FAKE/A.txt','-TestsRun','FAKE suite')
  $handoff=Join-Path $attempt 'handoff.md';$tail=Join-Path $attempt 'session-tail.txt';$resultPath=Join-Path $attempt 'result.json.tmp'
  Assert-True ($resultRun.exit-eq0-and(Test-Path $handoff)-and(Test-Path $tail)-and(Test-Path $resultPath)) 'result writes handoff tail and tmp result'
  $handoffText=Get-Content -LiteralPath $handoff -Raw
  Assert-True ((Test-RelayHandoffHeader $handoffText).ok) 'handoff first line passes frozen header validator'
  Assert-True ($handoffText-match'FAKE handoff') 'handoff includes supplied body'
  $tailTextOut=Get-Content -LiteralPath $tail -Raw
  Assert-True ($tailTextOut-match'<REDACTED:api_key>'-and$tailTextOut-notmatch'FAKE1234567890') 'tail is sanitized before persistence'
  $max=(Import-PowerShellDataFile (Join-Path $PSScriptRoot '../contracts/relay-params.psd1')).SessionTailMaxBytes
  Assert-True ([Text.Encoding]::UTF8.GetByteCount($tailTextOut)-le$max) 'tail is bounded by SessionTailMaxBytes'
  $resultValue=Get-Content -LiteralPath $resultPath -Raw|ConvertFrom-Json -AsHashtable -DateKind String
  Assert-True ((Test-RelayResult $resultValue).ok) 'result passes frozen schema'
  Assert-True ($resultValue.git_snapshot.Keys.Count-eq3-and-not[string]::IsNullOrWhiteSpace($resultValue.git_snapshot.commit)) 'result contains complete git snapshot metadata'
  Assert-True (@(Get-ChildItem -LiteralPath $attempt -Filter '*.partial' -Recurse).Count-eq0) 'result leaves no partial file'
  # F-013：不带 -ChangedPaths/-TestsRun（worker 没改文件、没跑测试）也必须能交棒，且两列表为空数组而非 [null]
  $bare=Invoke-AgentTool @('result','-Status','succeeded','-Summary','FAKE bare','-NextAction','none','-HandoffBody',(Join-Path $fixtures 'handoff-body.md'))
  $bareValue=Get-Content -LiteralPath $resultPath -Raw|ConvertFrom-Json -AsHashtable -DateKind String
  Assert-True ($bare.exit-eq0-and(Test-RelayResult $bareValue).ok-and@($bareValue.changed_paths).Count-eq0-and@($bareValue.tests_run).Count-eq0) 'result without changed paths or tests passes with empty arrays'

  $inbox=Join-Path $root 'FAKE-RUN/inbox'
  $proposalRun=Invoke-AgentTool @('propose','-PlanFile',(Join-Path $fixtures 'inbox/proposal-v1-no-hash.json'),'-InboxDir',$inbox)
  $proposalPath=Join-Path $inbox 'proposal-v1.json';$proposal=Get-Content -LiteralPath $proposalPath -Raw|ConvertFrom-Json -AsHashtable -DateKind String
  Assert-True ($proposalRun.exit-eq0-and(Test-RelayPlanProposal $proposal).ok) 'proposal fills hash and passes frozen schema'
  Assert-True ($proposal.plan_hash-ceq(Get-RelayPlanHash $proposal)) 'proposal hash equals canonical hash'
  Assert-True (@(Get-ChildItem -LiteralPath $inbox -Filter '*.partial').Count-eq0) 'proposal leaves no partial file'
  $bad=Invoke-AgentTool @('propose','-PlanFile',(Join-Path $fixtures 'inbox/proposal-bad.json'),'-InboxDir',$inbox)
  Assert-True ($bad.exit-eq4) 'invalid proposal exits 4'
  Assert-True (-not(Test-Path -LiteralPath (Join-Path $inbox 'proposal-v9.json'))) 'invalid proposal writes no inbox artifact'
  # orchestrator/replanner 没有 receipt：propose 靠 RELAY_RUN_ROOT 定位 inbox（主控 2026-08-15 补：dogfood 接线所需）
  Remove-Item Env:RELAY_RECEIPT -ErrorAction SilentlyContinue;$oldRunRoot=$env:RELAY_RUN_ROOT;$env:RELAY_RUN_ROOT=Join-Path $root 'FAKE-RUN2'
  try{$noReceipt=Invoke-AgentTool @('propose','-PlanFile',(Join-Path $fixtures 'inbox/proposal-v1-no-hash.json'))}finally{if($null-eq$oldRunRoot){Remove-Item Env:RELAY_RUN_ROOT -ErrorAction SilentlyContinue}else{$env:RELAY_RUN_ROOT=$oldRunRoot}}
  Assert-True ($noReceipt.exit-eq0-and(Test-Path -LiteralPath (Join-Path $root 'FAKE-RUN2/inbox/proposal-v1.json'))) 'propose without receipt uses RELAY_RUN_ROOT inbox'
  $noWhere=Invoke-AgentTool @('propose','-PlanFile',(Join-Path $fixtures 'inbox/proposal-v1-no-hash.json'))
  Assert-True ($noWhere.exit-eq4-and$noWhere.output-match'inbox location missing') 'propose without receipt and run root fails closed'
  $env:RELAY_RECEIPT=$receipt

  $dry=@(& pwsh -NoProfile -File $entry -Receipt $receipt -BriefRef (Join-Path $fixtures 'brief-A.md') -Cli codex -WorkDir (Join-Path $root 'work') -DryRun 2>&1);$dryText=$dry-join"`n"
  Assert-True ($LASTEXITCODE-eq0) 'worker entry dry run exits 0'
  Assert-True ($dryText-match'RELAY_RECEIPT='-and$dryText-match'RELAY_RUN_ROOT='-and$dryText-match'RELAY_ATTEMPT_DIR=') 'worker entry prints injected environment'
  Assert-True ($dryText-match'FAKE worker brief'-and$dryText-match'codex --yolo') 'worker entry prints brief-derived command without launch'
}finally{if($null-eq$oldReceipt){Remove-Item Env:RELAY_RECEIPT -ErrorAction SilentlyContinue}else{$env:RELAY_RECEIPT=$oldReceipt};if(Test-Path $root){Remove-Item -LiteralPath $root -Recurse -Force}}
Write-Host "ASSERTIONS $script:assertions";if($script:failed){Write-Host "SUITE FAIL ($script:failed)";exit 1};Write-Host 'SUITE PASS';exit 0
