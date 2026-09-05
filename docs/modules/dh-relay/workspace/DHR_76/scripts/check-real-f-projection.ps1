$ErrorActionPreference = 'Stop'
$tokens = $null; $errors = $null
$ast = [Management.Automation.Language.Parser]::ParseFile((Join-Path $PSScriptRoot 'run-real-f.ps1'), [ref]$tokens, [ref]$errors)
if ($errors.Count) { throw 'Runner syntax error' }
$functions = @('Get-OptionalProperty', 'Read-EventProjection', 'Read-LeaseProjection', 'Select-LeaseSampleForEvent', 'New-EventLeaseSample')
foreach ($definition in $ast.FindAll({param($node) $node -is [Management.Automation.Language.FunctionDefinitionAst]}, $true)) {
  if ($definition.Name -in $functions) { . ([scriptblock]::Create($definition.Extent.Text)) }
}
$scratch = Join-Path ([IO.Path]::GetTempPath()) ('dhr76-projection-' + [guid]::NewGuid().ToString('N'))
[void](New-Item -ItemType Directory -Path $scratch)
try {
  [IO.File]::WriteAllText((Join-Path $scratch 'events.jsonl'), @'
{"seq":0,"kind":"run_created","at":"2026-09-05T00:00:00Z"}
{"seq":1,"kind":"attempt_started","at":"2026-09-05T00:00:02Z","detail":"must-not-be-exported"}
{"seq":2,"kind":"host_observation_changed","at":"2026-09-05T00:00:03Z"}
'@)
  [IO.File]::WriteAllText((Join-Path $scratch 'host-lease.json'), '{"epoch":1,"acquired_at":"2026-09-05T00:00:00Z","expires_at":"2026-09-05T00:00:15Z","expires_at_epoch_ms":1788566415000}')
  $events = @(Read-EventProjection (Join-Path $scratch 'events.jsonl'))
  if ($events.Count -ne 3 -or $events[1].at -isnot [string] -or $events[1].Contains('detail') -or $events[2].seq -ne 2) { throw 'Event projection is not faithful and restricted' }
  $lease = Read-LeaseProjection $scratch ([DateTimeOffset]::Parse('2026-09-05T00:00:01Z'))
  if ($null -eq $lease) { throw 'Lease timestamp was dropped' }
  $timeline = [Collections.Generic.List[object]]::new()
  $timeline.Add($lease)
  $sample = New-EventLeaseSample $events[1] (Select-LeaseSampleForEvent $events[1] $timeline)
  if (-not $sample.lease.fresh_at_event -or $sample.lease.proof -ne 'sample-before-event') { throw 'Prior lease must cover the event' }
  $lease.sampled_at_epoch_ms += 30000
  $lease.expires_at_epoch_ms += 30000
  if ($null -ne (Select-LeaseSampleForEvent $events[1] $timeline)) { throw 'Later renewal cannot prove earlier freshness' }
  'PASS: all three events retained; JSON timestamps retained; dictionary fields read; prior lease accepted; later renewal rejected; detail excluded.'
} finally {
  # Only the two files and exact temporary directory created above are removed.
  Remove-Item -LiteralPath (Join-Path $scratch 'events.jsonl'), (Join-Path $scratch 'host-lease.json') -Force
  Remove-Item -LiteralPath $scratch -Force
}
