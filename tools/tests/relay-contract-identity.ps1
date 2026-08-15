$ErrorActionPreference = 'Stop'
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$script:failed = 0
function Assert-True([bool]$cond, [string]$name) {
  if ($cond) { Write-Host "PASS  $name" } else { Write-Host "FAIL  $name"; $script:failed++ }
}
function Read-Fixture([string]$RelativePath) {
  Get-Content -Raw (Join-Path $PSScriptRoot "fixtures/$RelativePath") | ConvertFrom-Json -AsHashtable -DateKind String
}

. (Join-Path $PSScriptRoot '../contracts/relay-schema.ps1')
. (Join-Path $PSScriptRoot '../contracts/relay-identity.ps1')

$authority = Read-Fixture 'authority/authority-good.json'
$active = Read-Fixture 'authority/active-plan-good.json'
$current = @{ node_id='A'; attempt_id=2; launch_id='L-0002'; session_id='S-0002'; final_committed=$false }
$good = Get-RelayResultVerdict (Read-Fixture 'results/result-good.json') $authority $active $current
Assert-True ($good.verdict -eq 'accept') 'good result accepted'
$wrongPlan = Get-RelayResultVerdict (Read-Fixture 'results/result-wrong-plan.json') $authority $active $current
Assert-True ($wrongPlan.verdict -eq 'rejected' -and $wrongPlan.reason -eq 'stale-plan') 'wrong plan rejected as stale plan'
$wrongHash = Get-RelayResultVerdict (Read-Fixture 'results/result-wrong-hash.json') $authority $active $current
Assert-True ($wrongHash.verdict -eq 'rejected' -and $wrongHash.reason -eq 'stale-plan') 'wrong plan hash rejected as stale plan'
$wrongNode = Get-RelayResultVerdict (Read-Fixture 'results/result-wrong-node.json') $authority $active $current
Assert-True ($wrongNode.verdict -eq 'rejected' -and $wrongNode.reason -eq 'wrong-node') 'wrong node rejected'
$stale = Get-RelayResultVerdict (Read-Fixture 'results/result-stale-attempt.json') $authority $active $current
Assert-True ($stale.verdict -eq 'stale' -and $stale.reason -eq 'stale-attempt') 'stale attempt classified stale'
$futureValue = Read-Fixture 'results/result-good.json'; $futureValue.attempt_id = 3
$future = Get-RelayResultVerdict $futureValue $authority $active $current
Assert-True ($future.verdict -eq 'rejected' -and $future.reason -eq 'identity-mismatch:attempt_id') 'future attempt with current launch and session rejected'
$generation = Get-RelayResultVerdict (Read-Fixture 'results/result-wrong-generation.json') $authority $active $current
Assert-True ($generation.verdict -eq 'rejected' -and $generation.reason -eq 'stale-generation') 'wrong generation rejected'
$session = Get-RelayResultVerdict (Read-Fixture 'results/result-wrong-session.json') $authority $active $current
Assert-True ($session.verdict -eq 'rejected' -and $session.reason -eq 'identity-mismatch:session_id') 'wrong session rejected'
$launch = Get-RelayResultVerdict (Read-Fixture 'results/result-wrong-launch.json') $authority $active $current
Assert-True ($launch.verdict -eq 'rejected' -and $launch.reason -eq 'identity-mismatch:launch_id') 'wrong launch rejected'
$closed = $current.Clone(); $closed.final_committed = $true
$duplicate = Get-RelayResultVerdict (Read-Fixture 'results/result-duplicate.json') $authority $active $closed
Assert-True ($duplicate.verdict -eq 'rejected' -and $duplicate.reason -eq 'final-immutable') 'duplicate final rejected'
$decision = Get-RelayResultVerdict (Read-Fixture 'results/result-final-decision.json') $authority $active $current
Assert-True ($decision.verdict -eq 'rejected' -and $decision.reason -eq 'illegal-final-status:decision_required') 'decision final rejected by schema'
$workingFinal = Get-RelayResultVerdict (Read-Fixture 'results/result-final-working.json') $authority $active $current
Assert-True ($workingFinal.verdict -eq 'rejected' -and $workingFinal.reason -eq 'illegal-final-status:working') 'working final rejected by schema'

$ckptDecision = Get-RelayCheckpointVerdict (Read-Fixture 'checkpoints/ckpt-decision.json') $authority $active $current
Assert-True ($ckptDecision.verdict -eq 'accept') 'decision checkpoint accepted'
$ckptWorking = Get-RelayCheckpointVerdict (Read-Fixture 'checkpoints/ckpt-working-followup.json') $authority $active $current
Assert-True ($ckptWorking.verdict -eq 'accept') 'working followup accepted'
$ckptSession = Get-RelayCheckpointVerdict (Read-Fixture 'checkpoints/ckpt-wrong-session.json') $authority $active $current
Assert-True ($ckptSession.verdict -eq 'rejected' -and $ckptSession.reason -eq 'identity-mismatch:session_id') 'checkpoint wrong session rejected'
$ckptWrongLaunchValue = Read-Fixture 'checkpoints/ckpt-working-followup.json'; $ckptWrongLaunchValue.launch_id = 'L-WRONG-FAKE'
$ckptLaunch = Get-RelayCheckpointVerdict $ckptWrongLaunchValue $authority $active $current
Assert-True ($ckptLaunch.verdict -eq 'rejected' -and $ckptLaunch.reason -eq 'identity-mismatch:launch_id') 'checkpoint wrong launch rejected'
$ckptStale = Get-RelayCheckpointVerdict (Read-Fixture 'checkpoints/ckpt-stale-attempt.json') $authority $active $current
Assert-True ($ckptStale.verdict -eq 'stale' -and $ckptStale.reason -eq 'stale-attempt') 'checkpoint stale attempt -> stale'
$ckptClosed = Get-RelayCheckpointVerdict (Read-Fixture 'checkpoints/ckpt-working-followup.json') $authority $active $closed
Assert-True ($ckptClosed.verdict -eq 'rejected' -and $ckptClosed.reason -eq 'attempt-closed') 'checkpoint after final rejected'

$identity = @{ plan_version=1; plan_hash=$active.plan_hash; authority_generation=1; node_id='A'; attempt_id=2; launch_id='L-0002'; session_id='S-0002' }
$event = New-RelayEvent 'result_stale' $identity 'stale-attempt'
Assert-True (Test-RelayEvent $event).ok 'generated stale event validates'
$plan = Read-Fixture 'plans/plan-v1-good.json'
$freezeB = @(Get-RelayNodeFreezeSet $plan 'B')
Assert-True ($freezeB.Count -eq 1 -and $freezeB[0] -eq 'C') 'B freezes transitive dependent C'
$freezeA = @(Get-RelayNodeFreezeSet $plan 'A')
Assert-True ($freezeA.Count -eq 1 -and $freezeA[0] -eq 'C') 'A freezes transitive dependent C'
Assert-True ('B' -notin $freezeA) 'independent B remains unfrozen'
$chainPlan = Read-Fixture 'plans/plan-v1-chain.json'
$chainFreezeA = @(Get-RelayNodeFreezeSet $chainPlan 'A')
Assert-True (($chainFreezeA -join ',') -ceq 'B,C,D') 'chain A freezes B C D transitively'
$chainFreezeC = @(Get-RelayNodeFreezeSet $chainPlan 'C')
Assert-True (($chainFreezeC -join ',') -ceq 'D') 'chain C freezes D'
$chainFreezeE = @(Get-RelayNodeFreezeSet $chainPlan 'E')
Assert-True ($chainFreezeE.Count -eq 0) 'independent E has empty freeze set'
$allChainFreezeSets = @('A','B','C','D','E' | ForEach-Object { @(Get-RelayNodeFreezeSet $chainPlan $_) })
Assert-True ('E' -notin $allChainFreezeSets) 'independent E is absent from every freeze set'

$header = "<!-- dh:relay-handoff v1 plan_version=1 plan_hash=$($active.plan_hash) authority_generation=1 node_id=A attempt_id=2 launch_id=L-0002 session_id=S-0002 -->`n# FAKE handoff"
$parsed = Test-RelayHandoffHeader $header
Assert-True ($parsed.ok -and $parsed.identity.session_id -eq 'S-0002') 'complete handoff header parsed'
$missingHeader = $header -replace ' session_id=S-0002', ''
$missing = Test-RelayHandoffHeader $missingHeader
Assert-True (-not $missing.ok -and $missing.reason -eq 'missing-identity:session_id') 'handoff missing session rejected'
$badHeader = Test-RelayHandoffHeader "# FAKE handoff`nNo contract header"
Assert-True (-not $badHeader.ok -and $badHeader.reason -eq 'bad-handoff-header') 'handoff bad first line rejected'

if ($script:failed -gt 0) { Write-Host "SUITE FAIL ($script:failed)"; exit 1 } else { Write-Host 'SUITE PASS'; exit 0 }
