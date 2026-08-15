$ErrorActionPreference = 'Stop'
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

function Add-NormalizedReason([Collections.Generic.HashSet[string]]$Set, [string]$Candidate) {
  $code = $Candidate.TrimEnd(':')
  if ($code.Contains(':')) { $code = $code.Split(':', 2)[0] }
  if ($code -cmatch '^[a-z][a-z0-9]*(?:-[a-z0-9]+)+$') { [void]$Set.Add($code) }
}

function Add-QuotedKebabCodes([Collections.Generic.HashSet[string]]$Set, [string]$Text) {
  foreach ($match in [regex]::Matches($Text, '[''"](?<code>[a-z][a-z0-9]*(?:-[a-z0-9]+)+(?:\:[^''"]*)?)[''"]')) {
    Add-NormalizedReason $Set $match.Groups['code'].Value
  }
}

$nonLiteralReasonAllowlist = @(
  # New-RelayValidationError only copies its caller-supplied reason into the validation result.
  @{ File = 'relay-schema.ps1'; Line = '@{ ok = $false; reason = $Reason }' }
  # Test-RelayPositiveInteger selects both candidate literals on the preceding line before forwarding this variable.
  @{ File = 'relay-schema.ps1'; Line = 'return New-RelayValidationError $reason' }
  # New-RelayIdentityVerdict only copies its caller-supplied reason into the verdict result.
  @{ File = 'relay-identity.ps1'; Line = '@{ verdict = $Verdict; reason = $Reason }' }
  # New-RelayStaleEvent only copies its caller-supplied reason into the optional event field.
  @{ File = 'relay-identity.ps1'; Line = 'if (-not [string]::IsNullOrWhiteSpace($Reason)) { $event.reason = $Reason }' }
)

function Test-NonLiteralReasonAllowed([string]$FileName, [string]$Line) {
  $trimmed = $Line.Trim()
  return @($nonLiteralReasonAllowlist | Where-Object { $_.File -ceq $FileName -and $_.Line -ceq $trimmed }).Count -eq 1
}

$productionReasons = [Collections.Generic.HashSet[string]]::new([StringComparer]::Ordinal)
$nonLiteralReasons = [Collections.Generic.List[string]]::new()
$contractRoot = Join-Path $PSScriptRoot '../contracts'
foreach ($file in Get-ChildItem -LiteralPath $contractRoot -Filter '*.ps1' -File) {
  $lines = @(Get-Content -LiteralPath $file.FullName)
  for ($index = 0; $index -lt $lines.Count; $index++) {
    $line = $lines[$index]
    $reasonSites = @([regex]::Matches($line, 'New-RelayValidationError\s+(?<arg>\S+)'))
    $reasonSites += @([regex]::Matches($line, '(?<![$.\w])reason\s*=\s*(?<arg>\S+)'))
    $reasonSites += @([regex]::Matches($line, '\$\w+\.reason\s*=\s*(?<arg>\S+)'))
    foreach ($match in $reasonSites) {
      if ($match.Groups['arg'].Value -notmatch '^[''"]') {
        if (-not (Test-NonLiteralReasonAllowed $file.Name $line)) {
          $nonLiteralReasons.Add("non-literal-reason:$($file.Name):$($index + 1)")
        }
      }
    }
    if ($reasonSites.Count -gt 0 -or $line -match '(?i)verdict|reason') {
      Add-QuotedKebabCodes $productionReasons $line
    }
  }
}

if ($nonLiteralReasons.Count -gt 0) {
  foreach ($failure in $nonLiteralReasons) { Write-Host "FAIL  $failure" }
  exit 1
}

$testReasons = [Collections.Generic.HashSet[string]]::new([StringComparer]::Ordinal)
foreach ($file in Get-ChildItem -LiteralPath $PSScriptRoot -Filter '*.ps1' -File | Where-Object { $_.Name -ne 'relay-contract-reason-coverage.ps1' }) {
  foreach ($line in Get-Content -LiteralPath $file.FullName | Where-Object { $_ -cmatch 'Assert' }) {
    Add-QuotedKebabCodes $testReasons $line
  }
}

$uncovered = @($productionReasons | Where-Object { -not $testReasons.Contains($_) } | Sort-Object)
if ($uncovered.Count -gt 0) {
  foreach ($reason in $uncovered) { Write-Host "FAIL  uncovered-reason: $reason" }
  exit 1
}

Write-Host "PASS  production reason codes covered: $($productionReasons.Count)"
Write-Host 'SUITE PASS'
exit 0
