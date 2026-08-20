<#
.SYNOPSIS
  Fail if the in-repo artifact mirror and the out-of-repo authoritative landing
  spot have drifted apart.

.DESCRIPTION
  The Pilot packages live in two places by design: the mirror under
  `artifacts/relay-control-pilot/src/<pkg>` (what git tracks) and the
  materialized copy at `<ExperimentRoot>/relay-control-pilot/src/<pkg>`
  (what actually runs). `materialize.ps1` copies one onto the other.

  Editing the mirror after materializing silently leaves the running copy stale
  — which already happened twice on this card, once shipping a README that told
  the operator to use an install shape known to fail. This check turns "remember
  to re-materialize" into something a machine says out loud.

  Comparison is over raw bytes: an earlier version decoded as UTF-8 and
  normalized CRLF first, so it could call two different files identical
  (round-2 review, P2).

  Line endings are the one exception, and it is a real one: this repository
  runs with `core.autocrlf=true`, so git rewrites the mirror to CRLF on
  checkout while the materialized copy stays LF. Raw-byte equality across a
  checkout is therefore impossible, and failing on it would make the check
  permanently red for a difference that carries no content. Such files are
  listed as NOTE and do not fail; anything else does.

  This is a collector, not a unit test: run it as part of wiring up and before
  closing the card. Exit 0 = identical. Exit 1 = drift (differing files listed).
#>
[CmdletBinding()]
param(
  [string]$ExperimentRoot = 'D:\MyFiles\ai-workflow\dh-relay-p4-pilot',
  [string[]]$Packages = @('dsh-host', 'dsh-absence-probe')
)

$ErrorActionPreference = 'Stop'

function Get-TreeHashes([string]$Root) {
  $map = @{}
  Get-ChildItem -LiteralPath $Root -Recurse -File | ForEach-Object {
    $relative = $_.FullName.Substring($Root.Length).TrimStart('\')
    $bytes = [System.IO.File]::ReadAllBytes($_.FullName)
    $sha = [System.Security.Cryptography.SHA256]::Create()
    $raw = [System.BitConverter]::ToString($sha.ComputeHash($bytes)).Replace('-', '')
    # Secondary hash, only used to explain a raw-byte difference.
    $text = [System.Text.Encoding]::UTF8.GetString($bytes) -replace "`r`n", "`n"
    $normalized = [System.BitConverter]::ToString(
      $sha.ComputeHash([System.Text.Encoding]::UTF8.GetBytes($text))).Replace('-', '')
    $map[$relative] = [pscustomobject]@{ Raw = $raw; Normalized = $normalized }
  }
  return $map
}

$drift = @()
$eolOnly = @()
$fileCount = 0

foreach ($package in $Packages) {
  $mirror = Join-Path $PSScriptRoot "artifacts\relay-control-pilot\src\$package"
  $target = Join-Path $ExperimentRoot "relay-control-pilot\src\$package"

  if (-not (Test-Path -LiteralPath $mirror -PathType Container)) {
    throw "artifact mirror is missing: $mirror"
  }
  if (-not (Test-Path -LiteralPath $target -PathType Container)) {
    Write-Output "NOT MATERIALIZED: $target"
    Write-Output "Run materialize.ps1 before wiring anything up."
    exit 1
  }

  $left = Get-TreeHashes $mirror
  $right = Get-TreeHashes $target
  $fileCount += $left.Count
  $names = ($left.Keys + $right.Keys | Sort-Object -Unique)

  foreach ($name in $names) {
    if (-not $left.ContainsKey($name)) { $drift += "only in materialized copy: $package\$name"; continue }
    if (-not $right.ContainsKey($name)) { $drift += "only in repo mirror:       $package\$name"; continue }
    if ($left[$name].Raw -ne $right[$name].Raw) {
      if ($left[$name].Normalized -eq $right[$name].Normalized) {
        $eolOnly += "line endings only:  $package\$name"
      } else {
        $drift += "differs (content):  $package\$name"
      }
    }
  }
}

if ($drift.Count -eq 0) {
  if ($eolOnly.Count -eq 0) {
    Write-Output "IN SYNC: $fileCount files byte-identical across $($Packages.Count) package(s) under $ExperimentRoot"
  } else {
    Write-Output "IN SYNC (content): $fileCount files across $($Packages.Count) package(s) under $ExperimentRoot"
    Write-Output "NOTE: $($eolOnly.Count) file(s) differ only in line endings (core.autocrlf rewrites the mirror on checkout):"
    $eolOnly | ForEach-Object { Write-Output "  $_" }
  }
  exit 0
}

Write-Output "DRIFT between repo mirror and materialized copy:"
$drift | ForEach-Object { Write-Output "  $_" }
if ($eolOnly.Count -gt 0) {
  Write-Output "（另有 $($eolOnly.Count) 个文件只差行尾，不计入 drift）"
}
Write-Output ''
Write-Output "Re-run: .\materialize.ps1 -Force"
exit 1
