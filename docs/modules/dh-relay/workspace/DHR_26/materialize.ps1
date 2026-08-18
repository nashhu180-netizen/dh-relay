[CmdletBinding()]
param(
  [string]$ExperimentRoot = 'D:\MyFiles\ai-workflow\dh-relay-p4-pilot',
  [switch]$Force
)

$ErrorActionPreference = 'Stop'
$source = Join-Path $PSScriptRoot 'artifacts\relay-control-pilot\src\dsh-host'
$pilotRoot = Join-Path $ExperimentRoot 'relay-control-pilot'
$fixtureRoot = Join-Path $pilotRoot 'testdata\fake'
$target = Join-Path $pilotRoot 'src\dsh-host'

if (-not (Test-Path -LiteralPath $source -PathType Container)) {
  throw "DHR_26 artifact mirror is missing: $source"
}
if (-not (Test-Path -LiteralPath $fixtureRoot -PathType Container)) {
  throw "DHR_25 fixture root is missing; refusing to create a second fixture source: $fixtureRoot"
}
if (Test-Path -LiteralPath $target) {
  if (-not $Force) {
    throw "Target already exists. Re-run with -Force after reviewing local changes: $target"
  }
  Remove-Item -LiteralPath $target -Recurse -Force
}
New-Item -ItemType Directory -Path (Split-Path -Parent $target) -Force | Out-Null
Copy-Item -LiteralPath $source -Destination $target -Recurse -Force
Write-Output "DHR_26 materialized: $target"
Write-Output "Fixture source retained: $fixtureRoot"
