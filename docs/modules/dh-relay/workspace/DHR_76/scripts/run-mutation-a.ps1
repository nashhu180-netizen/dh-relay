[CmdletBinding()]
param([ValidateSet('A')][string]$Mutation='A', [string]$EvidenceName='E-7629-mutation-a')
$ErrorActionPreference='Stop'
$root=(Get-Location).Path
$path=Join-Path $root 'relay-core/profiles/validate-profiles.mjs'
$bytes=[IO.File]::ReadAllBytes($path)
$before=(Get-FileHash -LiteralPath $path -Algorithm SHA256).Hash
$source=[Text.Encoding]::UTF8.GetString($bytes)
$cut=$source.IndexOf('export async function validateProfilesAsync')
if($cut -lt 0){throw 'async anchor absent'}
$tail=$source.Substring($cut)
$from='for (const profile of json.profiles) {'
if(([regex]::Matches($tail,[regex]::Escape($from))).Count -ne 1){throw 'ambiguous anchor'}
$changed=$source.Substring(0,$cut)+$tail.Replace($from,'for (const profile of json.profiles.slice(0, -1)) {')
try {
 [IO.File]::WriteAllText($path,$changed,[Text.UTF8Encoding]::new($false))
 $mutated=(Get-FileHash -LiteralPath $path -Algorithm SHA256).Hash
 & pwsh -NoProfile -File docs/modules/dh-relay/workspace/DHR_76/scripts/run-bounded-tests.ps1 -TestFiles test/dhr76-profile-validation-lease.test.mjs -NamePattern 'DHR_76/A: a non-target invalid alias remains' -EvidenceName $EvidenceName
 $red=$LASTEXITCODE
} finally {
 [IO.File]::WriteAllBytes($path,$bytes)
 $restored=(Get-FileHash -LiteralPath $path -Algorithm SHA256).Hash
 @{mutation='A';reviewer='/root/dhr76_code2';anchor='validate-profiles.mjs async loop';before=$before;mutated=$mutated;restored=$restored;red_shell_exit=$red} | ConvertTo-Json | Set-Content -Encoding utf8 ("docs/modules/dh-relay/workspace/DHR_76/evidence/$EvidenceName-hashes.json")
 if($restored -ne $before){throw 'restore mismatch'}
}
if($red -ne 1){throw 'expected assertion failure exit 1'}
