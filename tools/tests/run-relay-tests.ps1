$ErrorActionPreference = 'Stop'
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$suites = @(
  'relay-contract-schema.ps1',
  'relay-contract-identity.ps1',
  'relay-contract-transitions.ps1',
  'relay-contract-redaction.ps1',
  'relay-contract-failures.ps1',
  'relay-runner-authority.ps1',
  'relay-runner-ingest.ps1',
  'relay-runner-failures.ps1',
  'relay-runner-replay-blocked.ps1',
  'relay-runner-replay-decision.ps1',
  'relay-psmux-adapter.ps1',
  'relay-psmux-real.ps1',
  'relay-host-loop.ps1',
  'relay-agent-tool.ps1',
  'relay-policy.ps1',
  'relay-contract-reason-coverage.ps1',
  'relay-light-log.ps1'
)
$failed = 0
$skipped = 0
foreach ($suite in $suites) {
  Write-Host "=== $suite ==="
  $output=@(& pwsh -NoProfile -File (Join-Path $PSScriptRoot $suite))
  $output|ForEach-Object{Write-Host $_}
  if(@($output|Where-Object{$_ -like 'SUITE SKIP *'}).Count-gt0){$skipped++}
  if ($LASTEXITCODE -ne 0) { $failed++ }
}
if ($failed -gt 0) {
  Write-Host "RELAY TESTS FAIL ($failed)"
  exit 1
}
Write-Host "RELAY ALL PASS (SKIPPED: $skipped)"
exit 0
