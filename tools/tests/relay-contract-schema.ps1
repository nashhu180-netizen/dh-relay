$ErrorActionPreference = 'Stop'
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$script:failed = 0
function Assert-True([bool]$cond, [string]$name) {
  if ($cond) { Write-Host "PASS  $name" } else { Write-Host "FAIL  $name"; $script:failed++ }
}
function Assert-Reason([hashtable]$actual, [string]$reason, [string]$name) {
  Assert-True (-not $actual.ok -and $actual.reason -eq $reason) $name
}
function Read-Fixture([string]$RelativePath) {
  Get-Content -Raw (Join-Path $PSScriptRoot "fixtures/$RelativePath") | ConvertFrom-Json -AsHashtable -DateKind String
}
function Copy-Object([hashtable]$Value) {
  $Value | ConvertTo-Json -Depth 20 | ConvertFrom-Json -AsHashtable -DateKind String
}

. (Join-Path $PSScriptRoot '../contracts/relay-schema.ps1')
$params = Import-PowerShellDataFile (Join-Path $PSScriptRoot '../contracts/relay-params.psd1')

Assert-True ($params.SchemaVersion -is [string]) 'params SchemaVersion is string'
Assert-True ($params.SessionTailMaxBytes -is [int] -and $params.SessionTailMaxBytes -gt 0) 'params tail bytes is positive int'
Assert-True ($params.ProbeMaxConsecutiveFailures -is [int] -and $params.ProbeMaxConsecutiveFailures -gt 0) 'params probe threshold is positive int'
Assert-True ($params.StallThresholdSeconds -is [int] -and $params.StallThresholdSeconds -gt 0) 'params stall threshold is positive int'

$good = Read-Fixture 'plans/plan-v1-good.json'
Assert-True (Test-RelayPlanProposal $good).ok 'good plan accepted'
Assert-Reason (Test-RelayPlanProposal (Read-Fixture 'plans/plan-v1-cycle.json')) 'dependency-cycle' 'cycle rejected'
Assert-Reason (Test-RelayPlanProposal (Read-Fixture 'plans/plan-v1-badhash.json')) 'plan-hash-mismatch' 'bad hash rejected'
Assert-Reason (Test-RelayPlanProposal (Read-Fixture 'plans/plan-v1-unknown-field.json')) 'unknown-field:extra' 'unknown plan field rejected'
$withGeneration = Copy-Object $good; $withGeneration.authority_generation = 1
Assert-Reason (Test-RelayPlanProposal $withGeneration) 'unknown-field:authority_generation' 'proposal generation rejected'
$badVersion = Copy-Object $good; $badVersion.plan_version = 0
Assert-Reason (Test-RelayPlanProposal $badVersion) 'bad-value:plan_version' 'non-positive plan version rejected'
$badCase = Copy-Object $good; $badCase.proposed_by = 'Orchestrator'
Assert-Reason (Test-RelayPlanProposal $badCase) 'unknown-enum:proposed_by' 'enum tokens are case sensitive'
$dateOnly = Copy-Object $good; $dateOnly.proposed_at = '2026-08-15'
Assert-Reason (Test-RelayPlanProposal $dateOnly) 'bad-value:proposed_at' 'date without time is not ISO timestamp'
$badRole = Copy-Object $good; $badRole.nodes[0].role = 'alien'
Assert-Reason (Test-RelayPlanProposal $badRole) 'unknown-enum:role' 'node role enum rejected'
$badAction = Copy-Object $good; $badAction.nodes[0].next_action = 'complete'
Assert-Reason (Test-RelayPlanProposal $badAction) 'unknown-enum:next_action' 'node next action enum rejected'
$nodeExtra = Copy-Object $good; $nodeExtra.nodes[0].extra = 1
Assert-Reason (Test-RelayPlanProposal $nodeExtra) 'unknown-field:extra' 'unknown node field rejected'
$badResume = Copy-Object $good; $badResume.nodes[0].resume_from = @{ node_id='B'; attempt_id=0 }
Assert-Reason (Test-RelayPlanProposal $badResume) 'bad-value:attempt_id' 'bad resume attempt rejected'
$badDepType = Copy-Object $good; $badDepType.nodes[2].depends_on = @('A', 7)
Assert-Reason (Test-RelayPlanProposal $badDepType) 'bad-type:depends_on' 'non-string dependency rejected'
$duplicateNode = Copy-Object $good; $duplicateNode.nodes[1].node_id = 'A'
Assert-Reason (Test-RelayPlanProposal $duplicateNode) 'duplicate-node:A' 'duplicate node rejected'
$unknownDep = Copy-Object $good; $unknownDep.nodes[2].depends_on = @('A','Z')
Assert-Reason (Test-RelayPlanProposal $unknownDep) 'unknown-dep:Z' 'unknown dependency rejected'

$ptr = @{ schema_version='relay/v1'; plan_version=1; plan_hash=('a' * 64); authority_generation=1; activated_at='2026-08-15T09:02:00Z' }
Assert-True (Test-RelayActivePlan $ptr).ok 'good active plan accepted'
$ptrMissing = Copy-Object $ptr; $ptrMissing.Remove('plan_hash')
Assert-Reason (Test-RelayActivePlan $ptrMissing) 'missing-field:plan_hash' 'active plan missing hash rejected'

$auth = @{ schema_version='relay/v1'; run_id='RUN-FAKE-001'; authority_generation=1; plan_version=1; plan_hash=('a' * 64); granted_at='2026-08-15T09:03:00Z' }
Assert-True (Test-RelayAuthority $auth).ok 'good authority accepted'
$authZero = Copy-Object $auth; $authZero.authority_generation = 0
Assert-Reason (Test-RelayAuthority $authZero) 'bad-value:authority_generation' 'zero generation rejected'

$receipt = @{ schema_version='relay/v1'; plan_version=1; plan_hash=('a' * 64); authority_generation=1; node_id='A'; attempt_id=1; launch_id='L-FAKE-1'; session_id='S-FAKE-1'; role='worker'; backend='fake'; issued_at='2026-08-15T09:04:00Z'; launch_deadline_at='2026-08-15T09:05:00Z' }
Assert-True (Test-RelayLaunchReceipt $receipt).ok 'good receipt accepted'
$receiptMissing = Copy-Object $receipt; $receiptMissing.Remove('launch_id')
Assert-Reason (Test-RelayLaunchReceipt $receiptMissing) 'missing-field:launch_id' 'receipt missing launch rejected'
$receiptExtra = Copy-Object $receipt; $receiptExtra.session_note = 'not allowed'
Assert-Reason (Test-RelayLaunchReceipt $receiptExtra) 'unknown-field:session_note' 'receipt session field rejected'
$receiptBadAttempt = Copy-Object $receipt; $receiptBadAttempt.attempt_id = '1'
Assert-Reason (Test-RelayLaunchReceipt $receiptBadAttempt) 'bad-type:attempt_id' 'receipt attempt type rejected'

$result = Read-Fixture 'results/result-good.json'
Assert-True (Test-RelayResult $result).ok 'good result schema accepted'
$resultCase = Copy-Object $result; $resultCase.result_status = 'Succeeded'
Assert-Reason (Test-RelayResult $resultCase) 'unknown-enum:result_status' 'result enum is case sensitive'
$resultPatch = Copy-Object $result; $resultPatch.git_snapshot.patch = 'FAKE patch'
Assert-Reason (Test-RelayResult $resultPatch) 'unknown-field:patch' 'git snapshot extra field rejected'
Assert-Reason (Test-RelayResult (Read-Fixture 'results/result-final-decision.json')) 'illegal-final-status:decision_required' 'non-final result status rejected'
$checkpoint = Read-Fixture 'checkpoints/ckpt-decision.json'
Assert-True (Test-RelayCheckpoint $checkpoint).ok 'decision checkpoint schema accepted'
$workingQuestion = Read-Fixture 'checkpoints/ckpt-working-followup.json'; $workingQuestion.question = 'not allowed'
Assert-Reason (Test-RelayCheckpoint $workingQuestion) 'unknown-field:question' 'working checkpoint question rejected'
$checkpointAnswer = Read-Fixture 'checkpoints/ckpt-decision.json'; $checkpointAnswer.answer = 'FAKE answer'
Assert-Reason (Test-RelayCheckpoint $checkpointAnswer) 'unknown-field:answer' 'checkpoint answer field rejected'
$eventObservation = @{ schema_version='relay/v1'; event_id='E-FAKE-1'; kind='observation'; occurred_at='2026-08-15T09:40:00Z'; probe_error=$true; consecutive_probe_failures=3; terminal_state='unknown' }
Assert-True (Test-RelayEvent $eventObservation).ok 'observation event accepted'
$eventCase = @{ schema_version='relay/v1'; event_id='E-FAKE-CASE'; kind='Observation'; occurred_at='2026-08-15T09:40:00Z' }
Assert-Reason (Test-RelayEvent $eventCase) 'unknown-enum:kind' 'event kind is case sensitive'
$userAnswered = @{ schema_version='relay/v1'; event_id='E-FAKE-ANSWER'; kind='user_answered'; occurred_at='2026-08-15T09:40:00Z' }
Assert-Reason (Test-RelayEvent $userAnswered) 'unknown-enum:kind' 'user answered event kind rejected'
$eventNonce = Copy-Object $eventObservation; $eventNonce.nonce = 'N-FAKE-1'
Assert-Reason (Test-RelayEvent $eventNonce) 'unknown-field:nonce' 'non-control nonce rejected'
$controlMissing = @{ schema_version='relay/v1'; event_id='E-FAKE-2'; kind='control'; occurred_at='2026-08-15T09:41:00Z'; actor='operator'; source='user' }
Assert-Reason (Test-RelayEvent $controlMissing) 'missing-field:nonce' 'control missing nonce rejected'
$control = Copy-Object $controlMissing; $control.nonce = 'N-FAKE-2'
Assert-True (Test-RelayEvent $control).ok 'complete control event accepted'
$header = "<!-- dh:relay-handoff v1 plan_version=1 plan_hash=$($result.plan_hash) authority_generation=1 node_id=A attempt_id=2 launch_id=L-0002 session_id=S-0002 -->"
Assert-True (Test-RelayHandoffHeader $header).ok 'handoff header schema accepted'

if ($script:failed -gt 0) { Write-Host "SUITE FAIL ($script:failed)"; exit 1 } else { Write-Host 'SUITE PASS'; exit 0 }
