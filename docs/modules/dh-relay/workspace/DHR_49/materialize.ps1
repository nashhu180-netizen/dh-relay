[CmdletBinding()]
param(
  [string]$ExperimentRoot = 'D:\MyFiles\ai-workflow\dh-relay-p4-pilot',
  [switch]$Force
)

$ErrorActionPreference = 'Stop'
$source = Join-Path $PSScriptRoot 'artifacts\relay-control-pilot\src\dsh-client'
$pilotRoot = Join-Path $ExperimentRoot 'relay-control-pilot'
$fixtureRoot = Join-Path $pilotRoot 'testdata\fake'
$hostRoot = Join-Path $pilotRoot 'src\dsh-host'
$target = Join-Path $pilotRoot 'src\dsh-client'

foreach ($required in @($source, $fixtureRoot, $hostRoot)) {
  if (-not (Test-Path -LiteralPath $required -PathType Container)) {
    throw "DHR_49 prerequisite is missing: $required"
  }
}
if (Test-Path -LiteralPath $target) {
  if (-not $Force) {
    throw "Target already exists. Re-run with -Force after reviewing local changes: $target"
  }
  Remove-Item -LiteralPath $target -Recurse -Force
}
New-Item -ItemType Directory -Path (Split-Path -Parent $target) -Force | Out-Null
Copy-Item -LiteralPath $source -Destination $target -Recurse -Force

Push-Location $target
try {
  & node .\scripts\verify-build.mjs
  if ($LASTEXITCODE -ne 0) { throw "DHR_49 clean rebuild failed with exit $LASTEXITCODE" }
} finally {
  Pop-Location
}

Write-Output "DHR_49 materialized and clean-built: $target"
Write-Output "Expected bundle: $(Join-Path $target 'lib\client.js')"
