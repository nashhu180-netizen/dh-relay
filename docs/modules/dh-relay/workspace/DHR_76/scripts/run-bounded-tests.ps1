[CmdletBinding()]
param(
  [Parameter(Mandatory)][string[]]$TestFiles,
  [Parameter(Mandatory)][ValidatePattern('^[A-Za-z0-9._-]+$')][string]$EvidenceName,
  [string]$NamePattern
)
$ErrorActionPreference = 'Stop'
$repoRoot = (& git -C $PSScriptRoot rev-parse --show-toplevel).Trim()
if ($LASTEXITCODE -ne 0) { throw 'Cannot locate candidate worktree.' }
$evidenceRoot = Join-Path (Split-Path $PSScriptRoot) 'evidence'
New-Item -ItemType Directory -Path $evidenceRoot -Force | Out-Null
$outputPath = Join-Path $evidenceRoot "$EvidenceName.stdout.txt"
$errorPath = Join-Path $evidenceRoot "$EvidenceName.stderr.txt"
$summaryPath = Join-Path $evidenceRoot "$EvidenceName.json"
if ((Test-Path $outputPath) -or (Test-Path $errorPath) -or (Test-Path $summaryPath)) {
  throw 'Evidence name already exists; use a new name to preserve prior output.'
}
$info = [Diagnostics.ProcessStartInfo]::new()
$info.FileName = (Get-Command node -CommandType Application | Select-Object -First 1).Source
$info.WorkingDirectory = Join-Path $repoRoot 'relay-core'
$info.UseShellExecute = $false
$info.CreateNoWindow = $true
$info.RedirectStandardOutput = $true
$info.RedirectStandardError = $true
$arguments = @('--test', '--test-concurrency=1')
if ($NamePattern) { $arguments += @('--test-name-pattern', $NamePattern) }
$arguments += $TestFiles
foreach ($argument in $arguments) { $info.ArgumentList.Add($argument) }
$process = [Diagnostics.Process]::new()
$process.StartInfo = $info
$watch = [Diagnostics.Stopwatch]::StartNew()
$timedOut = $false
try {
  [void]$process.Start()
  $stdoutTask = $process.StandardOutput.ReadToEndAsync()
  $stderrTask = $process.StandardError.ReadToEndAsync()
  if (-not $process.WaitForExit(120000)) {
    $timedOut = $true
    $process.Kill($true)
    if (-not $process.WaitForExit(10000)) { throw 'Test process did not close after outer timeout.' }
  }
  [IO.File]::WriteAllText($outputPath, $stdoutTask.GetAwaiter().GetResult(), [Text.UTF8Encoding]::new($false))
  [IO.File]::WriteAllText($errorPath, $stderrTask.GetAwaiter().GetResult(), [Text.UTF8Encoding]::new($false))
  $exitCode = if ($timedOut) { 124 } else { $process.ExitCode }
  $watch.Stop()
  $summary = [ordered]@{
    arguments = $arguments; candidate = (& git -C $repoRoot rev-parse HEAD).Trim()
    exit_code = $exitCode; outer_timeout = $timedOut; elapsed_ms = $watch.ElapsedMilliseconds
    stdout = [IO.Path]::GetFileName($outputPath); stderr = [IO.Path]::GetFileName($errorPath)
  }
  $json = $summary | ConvertTo-Json -Depth 4
  [IO.File]::WriteAllText($summaryPath, $json, [Text.UTF8Encoding]::new($false))
  $json
} finally {
  if ($process.Id -and -not $process.HasExited) { $process.Kill($true) }
  $process.Dispose()
}
exit $exitCode
