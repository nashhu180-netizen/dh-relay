$ErrorActionPreference = 'Stop'
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$script:failed = 0
function Assert-True([bool]$cond, [string]$name) {
  if ($cond) { Write-Host "PASS  $name" } else { Write-Host "FAIL  $name"; $script:failed++ }
}

. (Join-Path $PSScriptRoot '../contracts/relay-transitions.ps1')
$matrix = Get-RelayTransitionMatrix

$terminalStates = @('launching','running','idle','stopped','exited','unknown')
$resultStates = @('working','decision_required','succeeded','dependency_blocked','interrupted_unknown','quota_exhausted')
$terminalOracle = @(
  @{ from='launching'; to='running'; guard='session-observed'; p1=$true },
  @{ from='launching'; to='exited'; guard='trusted-probe-or-diagnosis'; p1=$true },
  @{ from='launching'; to='unknown'; guard='probe-lost'; p1=$true },
  @{ from='running'; to='idle'; guard='host-observed-turn-closed'; p1=$true },
  @{ from='running'; to='stopped'; guard='trusted-stop'; p1=$true },
  @{ from='running'; to='exited'; guard='trusted-probe-or-diagnosis'; p1=$true },
  @{ from='running'; to='unknown'; guard='probe-lost'; p1=$true },
  @{ from='idle'; to='running'; guard='host-observed-new-turn'; p1=$true },
  @{ from='idle'; to='stopped'; guard='trusted-stop'; p1=$true },
  @{ from='idle'; to='exited'; guard='trusted-probe-or-diagnosis'; p1=$true },
  @{ from='idle'; to='unknown'; guard='probe-lost'; p1=$true },
  @{ from='stopped'; to='running'; guard='trusted-resume'; p1=$true },
  @{ from='stopped'; to='exited'; guard='trusted-probe-or-diagnosis'; p1=$true },
  @{ from='stopped'; to='unknown'; guard='probe-lost'; p1=$true },
  @{ from='unknown'; to='running'; guard='trusted-probe-or-diagnosis'; p1=$true },
  @{ from='unknown'; to='idle'; guard='trusted-probe-or-diagnosis'; p1=$true },
  @{ from='unknown'; to='stopped'; guard='trusted-probe-or-diagnosis'; p1=$true },
  @{ from='unknown'; to='exited'; guard='trusted-probe-or-diagnosis'; p1=$true }
)
$resultOracle = @(
  @{ from='working'; to='decision_required'; guard='checkpoint'; p1=$true },
  @{ from='working'; to='succeeded'; guard='final-result'; p1=$true },
  @{ from='working'; to='dependency_blocked'; guard='final-result'; p1=$true },
  @{ from='working'; to='interrupted_unknown'; guard='final-result'; p1=$true },
  @{ from='decision_required'; to='working'; guard='same-chain-working-checkpoint'; p1=$true },
  @{ from='decision_required'; to='succeeded'; guard='same-chain-final-result'; p1=$true },
  @{ from='decision_required'; to='dependency_blocked'; guard='same-chain-final-result'; p1=$true },
  @{ from='decision_required'; to='interrupted_unknown'; guard='probe-lost'; p1=$true },
  @{ from='working'; to='quota_exhausted'; guard='trusted-quota-signal'; p1=$false },
  @{ from='decision_required'; to='quota_exhausted'; guard='same-chain-final-result'; p1=$false },
  @{ from='quota_exhausted'; to='working'; guard='trusted-recovery'; p1=$false }
)

function Get-EdgeKey($Edge) { "$($Edge.from)|$($Edge.to)|$($Edge.guard)|$([bool]$Edge.p1)" }
function Assert-EdgeSetEqual($Actual, $Oracle, [string]$Name) {
  $actualKeys = @($Actual | ForEach-Object { Get-EdgeKey $_ } | Sort-Object -Unique)
  $oracleKeys = @($Oracle | ForEach-Object { Get-EdgeKey $_ } | Sort-Object -Unique)
  Assert-True ($actualKeys.Count -eq $oracleKeys.Count -and (Compare-Object $actualKeys $oracleKeys).Count -eq 0) $Name
}
function Assert-Exhaustive($States, $Oracle, [scriptblock]$Validator) {
  foreach ($from in $States) {
    foreach ($to in $States) {
      $actual = & $Validator $from $to
      $edge = @($Oracle | Where-Object { $_.from -ceq $from -and $_.to -ceq $to })
      if ($edge.Count -eq 0) {
        Assert-True (-not $actual.ok -and $actual.reason -eq 'edge-not-listed') "$from -> $to unlisted"
      } elseif ($edge[0].p1) {
        Assert-True $actual.ok "$from -> $to legal P1 edge"
      } else {
        Assert-True (-not $actual.ok -and $actual.reason -eq 'reserved-target-form') "$from -> $to reserved"
      }
    }
  }
}

Assert-EdgeSetEqual $matrix.terminal_state.edges $terminalOracle 'terminal matrix edge set equals design oracle'
Assert-EdgeSetEqual $matrix.result_status.edges $resultOracle 'result matrix edge set equals design oracle'
Assert-Exhaustive $terminalStates $terminalOracle { param($from,$to) Test-RelayTerminalTransition $from $to }
Assert-Exhaustive $resultStates $resultOracle { param($from,$to) Test-RelayResultTransition $from $to }
Assert-True (@($matrix.terminal_state.edges | Where-Object from -eq 'exited').Count -eq 0) 'exited has no outgoing edges'
Assert-True (@($matrix.terminal_state.edges | Where-Object { $_.from -eq $_.to }).Count -eq 0) 'terminal matrix has no self loops'
Assert-True (@($matrix.result_status.edges | Where-Object { $_.from -eq $_.to }).Count -eq 0) 'result matrix has no self loops'
$unknownEdges = @($matrix.terminal_state.edges | Where-Object from -eq 'unknown')
Assert-True ($unknownEdges.Count -eq 4) 'unknown has exactly four outgoing edges'
Assert-True (@($unknownEdges | Where-Object guard -ne 'trusted-probe-or-diagnosis').Count -eq 0) 'unknown edges require trusted probe or diagnosis'
$badResultPair = Test-RelayTransitionPair @{from='launching';to='running'} @{from='succeeded';to='working'}
Assert-True (-not $badResultPair.ok -and $badResultPair.reason -eq 'dual-dimension-fail-closed:result') 'result failure closes pair'
$badTerminalPair = Test-RelayTransitionPair @{from='exited';to='running'} @{from='working';to='succeeded'}
Assert-True (-not $badTerminalPair.ok -and $badTerminalPair.reason -eq 'dual-dimension-fail-closed:terminal') 'terminal failure closes pair'
$goodPair = Test-RelayTransitionPair @{from='launching';to='running'} @{from='working';to='succeeded'}
Assert-True $goodPair.ok 'dual legal pair accepted'
$quota = Test-RelayResultTransition 'working' 'quota_exhausted'
Assert-True (-not $quota.ok -and $quota.reason -eq 'reserved-target-form') 'quota P1 edge reserved'
$decisionQuota = Test-RelayResultTransition 'decision_required' 'quota_exhausted'
Assert-True (-not $decisionQuota.ok -and $decisionQuota.reason -eq 'reserved-target-form') 'decision required quota edge reserved'
$idleRunning = @($matrix.terminal_state.edges | Where-Object { $_.from -ceq 'idle' -and $_.to -ceq 'running' })
Assert-True ($idleRunning.Count -eq 1 -and $idleRunning[0].guard -ceq 'host-observed-new-turn') 'idle to running requires host observed new turn'
$idleResume = @($matrix.terminal_state.edges | Where-Object { $_.from -ceq 'idle' -and $_.guard -match 'resume' })
Assert-True ($idleResume.Count -eq 0) 'idle outgoing guards contain no resume'
$params = Import-PowerShellDataFile (Join-Path $PSScriptRoot '../contracts/relay-params.psd1')
Assert-True ($matrix.schema_version -eq $params.SchemaVersion) 'matrix and params schema versions match'
$unknown = Test-RelayTerminalTransition 'not-a-state' 'running'
Assert-True (-not $unknown.ok -and $unknown.reason -eq 'unknown-state:not-a-state') 'unknown state rejected'
$caseVariant = Test-RelayTerminalTransition 'Running' 'idle'
Assert-True (-not $caseVariant.ok -and $caseVariant.reason -eq 'unknown-state:Running') 'transition states are case sensitive'

if ($script:failed -gt 0) { Write-Host "SUITE FAIL ($script:failed)"; exit 1 } else { Write-Host 'SUITE PASS'; exit 0 }
