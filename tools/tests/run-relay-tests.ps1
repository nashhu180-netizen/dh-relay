$ErrorActionPreference = 'Stop'
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$suites = @(
  'relay-contract-schema.ps1',
  'relay-contract-identity.ps1',
  'relay-contract-transitions.ps1',
  'relay-contract-redaction.ps1',
  'relay-contract-failures.ps1',
  'relay-contract-reason-coverage.ps1'
)
$failed = 0
foreach ($suite in $suites) {
  Write-Host "=== $suite ==="
  & pwsh -NoProfile -File (Join-Path $PSScriptRoot $suite)
  if ($LASTEXITCODE -ne 0) { $failed++ }
}
if ($failed -gt 0) {
  Write-Host "RELAY TESTS FAIL ($failed)"
  exit 1
}
Write-Host 'RELAY ALL PASS'
exit 0
