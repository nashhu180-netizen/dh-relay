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
. (Join-Path $PSScriptRoot '../contracts/relay-transitions.ps1')
$params = Import-PowerShellDataFile (Join-Path $PSScriptRoot '../contracts/relay-params.psd1')
$authority = Read-Fixture 'authority/authority-good.json'
$active = Read-Fixture 'authority/active-plan-good.json'
$current = @{ node_id='A'; attempt_id=2; launch_id='L-0002'; session_id='S-0002'; final_committed=$false }

$half = Get-RelayResultFileVerdict (Join-Path $PSScriptRoot 'fixtures/failures/result-halfwritten.json') $authority $active $current
Assert-True ($half.verdict -eq 'rejected' -and $half.reason -eq 'unparseable-result') 'halfwritten result rejected'
$bad = Get-RelayResultFileVerdict (Join-Path $PSScriptRoot 'fixtures/failures/result-badjson.json') $authority $active $current
Assert-True ($bad.verdict -eq 'rejected' -and $bad.reason -eq 'unknown-enum:result_status') 'unknown result enum rejected'

$probeEvent = Read-Fixture 'failures/event-probe-error.json'
Assert-True (Test-RelayEvent $probeEvent).ok 'probe error event schema accepted'
$probe = Get-RelayProbeVerdict $probeEvent.consecutive_probe_failures $params
Assert-True ($probe.triggered -and $probe.terminal_move.to -eq 'unknown' -and $probe.result_move.to -eq 'interrupted_unknown') 'probe threshold suggests fail-closed pair'
Assert-True (Test-RelayTransitionPair $probe.terminal_move $probe.result_move).ok 'probe suggested pair is legal'
$probeBelow = Get-RelayProbeVerdict ($params.ProbeMaxConsecutiveFailures - 1) $params
Assert-True (-not $probeBelow.triggered) 'probe below threshold does not advance'
$decisionProbe = Get-RelayProbeVerdict $params.ProbeMaxConsecutiveFailures $params -CurrentTerminal 'idle' -CurrentResult 'decision_required'
Assert-True ($decisionProbe.triggered -and $decisionProbe.terminal_move.from -eq 'idle' -and $decisionProbe.terminal_move.to -eq 'unknown' -and $decisionProbe.result_move.from -eq 'decision_required' -and $decisionProbe.result_move.to -eq 'interrupted_unknown') 'decision required probe loss suggests fail-closed pair'
Assert-True (Test-RelayTransitionPair $decisionProbe.terminal_move $decisionProbe.result_move).ok 'decision required probe pair is legal'

$snapshot = Read-Fixture 'failures/state-no-progress.json'
$stall = Get-RelayStallVerdict $snapshot ([DateTimeOffset]'2026-08-15T10:00:01Z') $params
Assert-True ($stall.stalled -and $stall.result_move.to -eq 'interrupted_unknown') 'no progress past threshold is stalled'
Assert-True (Test-RelayTransitionPair $stall.terminal_move $stall.result_move).ok 'stall suggested pair is legal'
$caseSnapshot = $snapshot.Clone(); $caseSnapshot.terminal_state = 'Running'
$caseStall = Get-RelayStallVerdict $caseSnapshot ([DateTimeOffset]'2026-08-15T10:00:01Z') $params
Assert-True (-not $caseStall.stalled) 'stall snapshot state is case sensitive'
$exitSnapshot = Read-Fixture 'failures/exit-no-result.json'
$exit = Get-RelayExitWithoutResultVerdict $exitSnapshot
Assert-True ($exit.triggered -and $exit.result_move.to -eq 'interrupted_unknown') 'exit without result falls back to interrupted unknown'
Assert-True (Test-RelayTransitionPair $null $exit.result_move).ok 'exit fallback result transition is legal'
$caseExitSnapshot = $exitSnapshot.Clone(); $caseExitSnapshot.terminal_state = 'Exited'
$caseExit = Get-RelayExitWithoutResultVerdict $caseExitSnapshot
Assert-True (-not $caseExit.triggered) 'exit snapshot state is case sensitive'

$goodResult = Read-Fixture 'results/result-good.json'
$accepted = Get-RelayResultVerdict $goodResult $authority $active $current
Assert-True ($accepted.verdict -eq 'accept' -and -not $accepted.ContainsKey('task_state')) 'succeeded review result does not complete task'
$withTaskState = $goodResult | ConvertTo-Json -Depth 20 | ConvertFrom-Json -AsHashtable -DateKind String
$withTaskState.task_state = 'completed'
$taskStateCheck = Test-RelayResult $withTaskState
Assert-True (-not $taskStateCheck.ok -and $taskStateCheck.reason -eq 'unknown-field:task_state') 'task completion field rejected'

if ($script:failed -gt 0) { Write-Host "SUITE FAIL ($script:failed)"; exit 1 } else { Write-Host 'SUITE PASS'; exit 0 }
