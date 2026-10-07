# The product suite is now owned by the independent relay-lite repository.
# This source-repository suite proves retirement explicitly; it never skips.
$ErrorActionPreference = 'Stop'
$repo = (Resolve-Path (Join-Path $PSScriptRoot '..' '..')).Path
if (Test-Path (Join-Path $repo 'tools/relay-light')) {
  throw 'Retired relay-light product remains in source repository'
}
$planRoot = Join-Path $repo 'docs/relay'
if (@(Get-ChildItem $planRoot -Recurse -File -Filter relay_plan.md).Count -ne 0) {
  throw 'Source repository still contains duplicate active plans'
}
$guide = Get-Content (Join-Path $planRoot 'README.md') -Raw -Encoding utf8
if (-not $guide.Contains('https://github.com/nashhu180-netizen/relay-lite')) {
  throw 'Independent relay-lite migration destination missing'
}
Write-Host 'SUITE PASS relay-lite retirement boundary'
exit 0
