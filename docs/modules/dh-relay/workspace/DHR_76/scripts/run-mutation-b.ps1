[CmdletBinding()]
param([ValidateSet('B','TTL')][string]$Mutation='B', [string]$EvidenceSuffix='')
$ErrorActionPreference='Stop'
$relative=if($Mutation -eq 'B'){'relay-core/profiles/validate-profiles.mjs'}else{'relay-core/test/dhr76-profile-validation-lease.test.mjs'}
$path=Join-Path $PWD $relative
$bytes=[IO.File]::ReadAllBytes($path)
$before=(Get-FileHash -LiteralPath $path -Algorithm SHA256).Hash
$source=[Text.Encoding]::UTF8.GetString($bytes)
if($Mutation -eq 'B') {
 $from='const deadline = Date.now() + validationTimeoutMs;'
 $to="spawnSync(process.execPath, ['-e', 'setTimeout(() => {}, 16_000)'], { stdio: 'ignore', windowsHide: true });`n  $from"
 $name='E-7643-mutation-b'
}else{
 $from='runId: fixture.run_id, tickMs: 1_000'
 $to='runId: fixture.run_id, tickMs: 1_000, ttlMs: 60_000'
 $name='E-7644-ttl-control'
}
$name += $EvidenceSuffix
if(([regex]::Matches($source,[regex]::Escape($from))).Count -ne 1){throw 'ambiguous anchor'}
try {
 [IO.File]::WriteAllText($path,$source.Replace($from,$to),[Text.UTF8Encoding]::new($false))
 $mutated=(Get-FileHash -LiteralPath $path -Algorithm SHA256).Hash
 & pwsh -NoProfile -File docs/modules/dh-relay/workspace/DHR_76/scripts/run-bounded-tests.ps1 -TestFiles test/dhr76-profile-validation-lease.test.mjs -NamePattern 'real Host actor renews' -EvidenceName $name
 $red=$LASTEXITCODE
} finally {
 [IO.File]::WriteAllBytes($path,$bytes)
 $restored=(Get-FileHash -LiteralPath $path -Algorithm SHA256).Hash
 @{mutation=$Mutation;reviewer='/root/dhr76_code2';anchor=$relative;before=$before;mutated=$mutated;restored=$restored;red_shell_exit=$red} | ConvertTo-Json | Set-Content -Encoding utf8 ("docs/modules/dh-relay/workspace/DHR_76/evidence/$name-hashes.json")
 if($restored -ne $before){throw 'restore mismatch'}
}
if($red -ne 1){throw 'expected assertion failure exit 1'}
