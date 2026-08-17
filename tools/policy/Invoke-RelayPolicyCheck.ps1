#requires -Version 7.0
# Exit codes: 0=通过 / 1=判违规 / 2=输入错误 / 3=守卫自身异常
# Input contract: a list of repo-relative paths, one entry per path.
# The list may be a JSON array, or plain text separated by NUL, CR, LF or any
# mix (so raw -z output can be fed straight in). Everything else is rejected,
# never silently accepted:
#   malformed entry -> exit 3   NUL/CR inside one entry (policy-path-control-char),
#                               git quotePath output (policy-path-quoted),
#                               non-string JSON entry (policy-list-entry-not-string)
#   malformed path  -> exit 3   drive letter / UNC / leading / / home forms
#                               (~, ~/…, ~user/… -- the discriminator is the
#                               slash, so a bare ~name with no slash such as
#                               the Office lock file ~$x.docx stays a normal
#                               relative path), .. (policy-path-dotdot)
# Quoted entries are rejected rather than stripped: half-stripping cannot undo
# \xxx octal escapes, so the caller must regenerate the list instead.
# Recommended (copy-paste) — all three emit BARE NUL-separated paths, so their
# outputs can be concatenated and fed in as-is:
#   git -c core.quotePath=false diff --name-only -z master...HEAD   # committed on branch
#   git -c core.quotePath=false diff --name-only -z HEAD            # working tree vs HEAD
#   git -c core.quotePath=false ls-files -z --others --exclude-standard  # untracked
# Three-dot compare (master...HEAD), not two-dot.
# Do NOT use `status --porcelain`: its entries are "XY <path>", not paths. The
# status prefix misses every root and shows up as a violation, so the direction
# is fail-closed, but the run is wasted on false positives.
param(
  [ValidateSet('dev-isolation','content','landing','all')][string]$Mode = 'all',
  [string]$RepoRoot,
  [string]$SnapshotPath,
  [string]$BeforePath,
  [string]$AfterPath
)
[Console]::OutputEncoding = [Text.Encoding]::UTF8
$ErrorActionPreference = 'Stop'
. (Join-Path $PSScriptRoot 'relay-policy.ps1')

function Exit-RelayPolicyMissingInput {
  $ErrorActionPreference = 'Continue'
  Write-Error 'relay-policy: missing required input'
  exit 2
}

function Exit-RelayPolicyInputError([string]$Message) {
  $ErrorActionPreference = 'Continue'
  Write-Error $Message
  exit 2
}

function Exit-RelayPolicyGuardError([string]$Message) {
  $ErrorActionPreference = 'Continue'
  Write-Error $Message
  exit 3
}

function Read-RelayPolicyPathFile([string]$File) {
  if ([string]::IsNullOrWhiteSpace($File) -or -not (Test-Path -LiteralPath $File)) { return $null }
  $raw = Get-Content -Raw -LiteralPath $File
  if ([string]::IsNullOrWhiteSpace($raw)) { return @() }
  $raw = $raw.Trim().TrimStart([char]0xFEFF)
  if ($raw.Length -eq 0) { return @() }
  if ($raw.StartsWith('[')) {
    $parsed = @($raw | ConvertFrom-Json)
    foreach ($entry in $parsed) {
      if ($entry -isnot [string]) { throw "policy-list-entry-not-string: $($entry | ConvertTo-Json -Compress -Depth 3)" }
    }
    return $parsed
  }
  # Split on NUL as well as CR/LF. -z output (which this file's header
  # recommends) is NUL-separated, and a lone CR separates nothing under
  # \r?\n -- either way the whole list would glue into one long "path" whose
  # prefix decides the verdict for every entry hiding behind it.
  @($raw -split "[`0`r`n]+" | Where-Object { -not [string]::IsNullOrWhiteSpace($_) })
}

function Read-RelayPolicySnapshotFile([string]$File) {
  if ([string]::IsNullOrWhiteSpace($File) -or -not (Test-Path -LiteralPath $File)) { return $null }
  $parsed = Get-Content -Raw -LiteralPath $File | ConvertFrom-Json -AsHashtable
  if ($parsed -isnot [System.Collections.IDictionary]) { throw 'policy-snapshot-not-object' }
  $parsed
}

function Get-RelayCliDevIsolationPolicy {
  @{
    production_root = 'tools/'
    forbidden_roots = @('docs/modules/dh-crew/', 'skills/', 'tools/protocol/', '.dh-runtime/')
    doc_roots = @('docs/modules/dh-relay/')
  }
}

function Write-RelayPolicyReport($Verdict) {
  $report = [ordered]@{ ok = [bool]$Verdict.ok }
  if ($Verdict.ContainsKey('reason')) { $report['reason'] = $Verdict.reason } else { $report['reason'] = '' }
  if ($Verdict.ContainsKey('violations')) { $report['violations'] = @($Verdict.violations) } else { $report['violations'] = @() }
  $report | ConvertTo-Json -Depth 10
}

$needAfter = $Mode -in @('dev-isolation', 'content', 'landing', 'all')
$needSnap = $Mode -in @('content', 'all')
$needBefore = $Mode -in @('landing', 'all')

if ($needAfter -and ([string]::IsNullOrWhiteSpace($AfterPath) -or -not (Test-Path -LiteralPath $AfterPath))) { Exit-RelayPolicyMissingInput }
if ($needSnap -and ([string]::IsNullOrWhiteSpace($SnapshotPath) -or -not (Test-Path -LiteralPath $SnapshotPath))) { Exit-RelayPolicyMissingInput }
if ($needBefore -and ([string]::IsNullOrWhiteSpace($BeforePath) -or -not (Test-Path -LiteralPath $BeforePath))) { Exit-RelayPolicyMissingInput }

try {
  $afterPaths = @()
  if ($needAfter) {
    $afterPaths = @(Read-RelayPolicyPathFile $AfterPath | Where-Object { -not [string]::IsNullOrWhiteSpace($_) })
    if ($afterPaths.Count -eq 0) { Exit-RelayPolicyInputError 'relay-policy: empty after-path snapshot' }
  }
  $beforePaths = @()
  if ($needBefore) { $beforePaths = @(Read-RelayPolicyPathFile $BeforePath) }
  $snapshot = $null
  if ($needSnap) { $snapshot = Read-RelayPolicySnapshotFile $SnapshotPath }

  $verdicts = [Collections.Generic.List[object]]::new()
  if ($Mode -in @('dev-isolation', 'all')) {
    $verdicts.Add((Get-RelayDevIsolationVerdict $afterPaths (Get-RelayCliDevIsolationPolicy)))
  }
  if ($Mode -in @('content', 'all')) {
    $verdicts.Add((Get-RelayContentPolicyVerdict $afterPaths $snapshot))
  }
  if ($Mode -in @('landing', 'all')) {
    $verdicts.Add((Get-RelayLandingVerdict $afterPaths $beforePaths $null))
  }

  $failed = @($verdicts | Where-Object { -not $_.ok })
  if ($failed.Count -eq 0) { exit 0 }

  $merged = [Collections.Generic.List[object]]::new()
  foreach ($item in $failed) {
    foreach ($v in @($item.violations)) { if ($null -ne $v) { $merged.Add($v) } }
  }
  $report = $failed[0]
  $report.violations = $merged.ToArray()
  if ($failed.Count -gt 1) { $report.reason = 'policy-violation:multi' }
  Write-Output (Write-RelayPolicyReport $report)
  exit 1
} catch {
  Exit-RelayPolicyGuardError ("relay-policy: guard error: " + $_.Exception.Message)
}
