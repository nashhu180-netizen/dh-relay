$ErrorActionPreference = 'Stop'
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$script:failed = 0
function Assert-True([bool]$cond, [string]$name) {
  if ($cond) { Write-Host "PASS  $name" } else { Write-Host "FAIL  $name"; $script:failed++ }
}
function Read-Tail([string]$Name) { Get-Content -Raw (Join-Path $PSScriptRoot "fixtures/tails/$Name") }
function Read-Artifact([string]$Name) { Get-Content -Raw (Join-Path $PSScriptRoot "fixtures/artifacts/$Name") }

. (Join-Path $PSScriptRoot '../contracts/relay-redaction.ps1')

$apiSecrets = @{ api_key=@('sk-FAKE0000000000000000','FAKEKEY12345678') }
$api = Invoke-RelayTailSanitize (Read-Tail 'tail-api-key.txt')
Assert-True (Test-RelayArtifactClean $api.text $apiSecrets).ok 'api key values leave no residue'
Assert-True ($api.text.Contains('<REDACTED:api_key>')) 'api key marker emitted'
Assert-True ('api_key' -in $api.hits.kind) 'api key hit counted'
Assert-True (-not $api.text.Contains('sk-FAKE')) 'sk token prefix removed with full value'

$private = Invoke-RelayTailSanitize (Read-Tail 'tail-private-key.txt')
Assert-True (Test-RelayArtifactClean $private.text @{ private_key=@('RkFLRUZBS0VQUklWQVRFS0VZ') }).ok 'private key content leaves no residue'
Assert-True ($private.text.Contains('<REDACTED:private_key>')) 'private key marker emitted'
Assert-True (-not $private.text.Contains('BEGIN FAKE PRIVATE KEY')) 'PEM block removed as a whole'
Assert-True ('private_key' -in $private.hits.kind) 'private key hit counted'

$password = Invoke-RelayTailSanitize (Read-Tail 'tail-password.txt')
Assert-True (Test-RelayArtifactClean $password.text @{ password=@('hunter2-fake') }).ok 'password leaves no residue'
Assert-True ($password.text.Contains('<REDACTED:password>')) 'password marker emitted'
Assert-True ('password' -in $password.hits.kind) 'password hit counted'

$oversize = Invoke-RelayTailSanitize (Read-Tail 'tail-oversize-boundary.txt')
Assert-True ([Text.Encoding]::UTF8.GetByteCount($oversize.text) -le 65536) 'default output obeys byte limit'
Assert-True (Test-RelayArtifactClean $oversize.text @{ api_key=@('FAKEBOUNDARYSECRET999999') }).ok 'sanitize before truncate removes boundary residue'
$small = Invoke-RelayTailSanitize (Read-Tail 'tail-oversize-boundary.txt') -MaxBytes 1024
Assert-True ([Text.Encoding]::UTF8.GetByteCount($small.text) -le 1024) 'explicit MaxBytes override obeyed'
$plainText = "FAKE harmless output`nsecond line"
$plain = Invoke-RelayTailSanitize $plainText
Assert-True ($plain.text -eq $plainText -and $plain.hits.Count -eq 0) 'plain text passes unchanged'

$artifactCases = @(
  @{ name='handoff'; fixture='handoff-with-secret.md'; secrets=@{ api_key=@('FAKEHANDOFFKEY123') } },
  @{ name='result'; fixture='result-with-secret.json'; secrets=@{ password=@('FAKE-RESULT-PASSWORD') } },
  @{ name='event'; fixture='event-with-secret.jsonl'; secrets=@{ api_key=@('sk-FAKEEVENTTOKEN123456') } }
)
foreach ($case in $artifactCases) {
  $sanitized = Invoke-RelayTailSanitize (Read-Artifact $case.fixture)
  Assert-True (Test-RelayArtifactClean $sanitized.text $case.secrets).ok "$($case.name) fixture sanitize leaves no residue"
}

$dirty = Test-RelayArtifactClean 'session-tail contains FAKEKEY12345678' @{ api_key=@('FAKEKEY12345678') }
Assert-True (-not $dirty.ok -and $dirty.reason -eq 'secret-residue:api_key') 'session-tail residue fails closed'

if ($script:failed -gt 0) { Write-Host "SUITE FAIL ($script:failed)"; exit 1 } else { Write-Host 'SUITE PASS'; exit 0 }
