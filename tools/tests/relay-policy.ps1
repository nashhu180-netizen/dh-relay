$ErrorActionPreference='Stop';[Console]::OutputEncoding=[Text.Encoding]::UTF8
$script:failed=0;$script:assertions=0
$script:roots=[Collections.Generic.List[string]]::new()
function Assert-True([bool]$c,[string]$n){$script:assertions++;if($c){Write-Host "PASS  $n"}else{Write-Host "FAIL  $n";$script:failed++}}
. (Join-Path $PSScriptRoot '../policy/relay-policy.ps1')
try{
  Assert-True ((Get-RelayPolicyPath 'Tools\Relay\x.ps1') -ceq 'tools/relay/x.ps1') 'normalize backslash and case'
  Assert-True ((Get-RelayPolicyPath 'src/./alpha/a.ts') -ceq 'src/alpha/a.ts') 'collapse internal ./ segments'
  $notRelMsg=''
  try{ [void](Get-RelayPolicyPath 'D:.dh-runtime/n.json') }catch{ $notRelMsg = $_.Exception.Message }
  Assert-True ($notRelMsg.StartsWith('policy-path-not-relative')) 'Get-RelayPolicyPath throws on drive-relative path'
  $slashModMsg=''; $driveModMsg=''
  try{ [void](Get-RelayPolicyPath '/docs/modules/alpha/relay/x.json') }catch{ $slashModMsg = $_.Exception.Message }
  try{ [void](Get-RelayPolicyPath 'D:/r/docs/modules/alpha/relay/x.json') }catch{ $driveModMsg = $_.Exception.Message }
  Assert-True (($slashModMsg.StartsWith('policy-path-not-relative')) -and ($driveModMsg.StartsWith('policy-path-not-relative'))) 'leading-slash and drive-module forms both throw not-relative'
  $priorityMsg=''
  try{ [void](Get-RelayPolicyPath 'D:/repo/../.dh-runtime/n.json') }catch{ $priorityMsg = $_.Exception.Message }
  Assert-True ($priorityMsg.StartsWith('policy-path-not-relative')) 'non-relative wins over dotdot when both present'
  $dotdotMsg=''
  try{ [void](Get-RelayPolicyPath 'tools/relay/../protocol/evil.ps1') }catch{ $dotdotMsg = $_.Exception.Message }
  Assert-True ($dotdotMsg.StartsWith('policy-path-dotdot') -and $dotdotMsg.Contains('tools/relay/../protocol/evil.ps1')) 'guard error message includes the offending path'
  # R5-03：not-relative 半边同样要钉住路径原文（此前只有 dotdot 半边有 Contains 断言）
  $notRelPathMsg=''
  try{ [void](Get-RelayPolicyPath 'D:/repo/.dh-runtime/n.json') }catch{ $notRelPathMsg = $_.Exception.Message }
  Assert-True ($notRelPathMsg.StartsWith('policy-path-not-relative') -and $notRelPathMsg.Contains('D:/repo/.dh-runtime/n.json')) 'not-relative guard error also includes the offending path'
  # R5-01/R6-01：清单条目里混进控制字符（NUL/CR）= 畸形条目，纵深防御须 throw
  $nulMsg=''
  try{ [void](Get-RelayPolicyPath "src/alpha/a.ts`0.dh-runtime/relay/new.json") }catch{ $nulMsg = $_.Exception.Message }
  Assert-True ($nulMsg.StartsWith('policy-path-control-char')) 'path containing NUL throws control-char'
  $crMsg=''
  try{ [void](Get-RelayPolicyPath "src/alpha/a.ts`r.dh-runtime/relay/new.json") }catch{ $crMsg = $_.Exception.Message }
  Assert-True ($crMsg.StartsWith('policy-path-control-char') -and $crMsg.Contains('.dh-runtime/relay/new.json')) 'path containing bare CR throws control-char with path'
  # R5-02：git quotePath 形态 = 畸形条目，拒绝而非剥离
  $quotedMsg=''
  try{ [void](Get-RelayPolicyPath '".dh-runtime/relay/\346\226\260.json"') }catch{ $quotedMsg = $_.Exception.Message }
  Assert-True ($quotedMsg.StartsWith('policy-path-quoted') -and $quotedMsg.Contains('.dh-runtime/relay/')) 'git-quoted path throws quoted with path'
  # R5-04：~ 判据只拦家目录形态，不得误伤 ~$ 开头的 Office 锁文件（仓库相对真路径）
  # try/catch, not a bare call: if this regresses, a bare call would throw and
  # abort the whole suite, hiding every assertion after it.
  $lockFileNorm=''
  try{ $lockFileNorm = Get-RelayPolicyPath '~$tmp.docx' }catch{ $lockFileNorm = "THREW: $($_.Exception.Message)" }
  Assert-True ($lockFileNorm -ceq '~$tmp.docx') 'tilde-dollar lock file is a normal relative path'
  $tildeRootMsg=''
  try{ [void](Get-RelayPolicyPath '~/.dh-runtime/n.json') }catch{ $tildeRootMsg = $_.Exception.Message }
  Assert-True ($tildeRootMsg.StartsWith('policy-path-not-relative')) 'tilde-slash still throws not-relative'
  # R7-02：POSIX ~user/ 也是家目录形态，不是仓库相对路径。判别子是斜杠，不是 $。
  $tildeUserMsg=''; $tildeBareMsg=''
  try{ [void](Get-RelayPolicyPath '~root/.dh-runtime/n.json') }catch{ $tildeUserMsg = $_.Exception.Message }
  try{ [void](Get-RelayPolicyPath '~') }catch{ $tildeBareMsg = $_.Exception.Message }
  Assert-True ($tildeUserMsg.StartsWith('policy-path-not-relative')) 'posix ~user/ throws not-relative'
  Assert-True ($tildeBareMsg.StartsWith('policy-path-not-relative')) 'bare tilde throws not-relative'

  # R7-03：引号判据两侧各自要有牙——只留 StartsWith 或只留 EndsWith 都必须见红
  $leadQuoteMsg=''; $trailQuoteMsg=''
  try{ [void](Get-RelayPolicyPath '".dh-runtime/relay/a.json') }catch{ $leadQuoteMsg = $_.Exception.Message }
  try{ [void](Get-RelayPolicyPath '.dh-runtime/relay/a.json"') }catch{ $trailQuoteMsg = $_.Exception.Message }
  Assert-True ($leadQuoteMsg.StartsWith('policy-path-quoted')) 'leading-only quote throws quoted'
  Assert-True ($trailQuoteMsg.StartsWith('policy-path-quoted')) 'trailing-only quote throws quoted'

  # R7-04 / R8-01：拒绝优先级分层本身要有断言。注释写的是
  #   控制字符 > 引号 > 非相对 > dotdot
  # 每相邻两层各一条混合夹具；把任意两层对调都必须见红，否则重构可静默改变
  # 调用方拿到的 reason、把排障方向带偏。
  $ctrlVsQuoteMsg=''; $quoteVsRelMsg=''; $relVsDotMsg=''
  try{ [void](Get-RelayPolicyPath "`".dh-runtime/a.json`0hidden`"") }catch{ $ctrlVsQuoteMsg = $_.Exception.Message }
  # 尾随-only 引号 + 盘符：两层谓词都会命中，对调顺序才真的会改变 reason。
  # 用两端包裹的串钉不住这一层——前导 " 让 ^[A-Za-z]: 与 IsPathRooted 双双落空，
  # 只有引号层命中，对调后仍报 quoted（review9 R9-01 实证）。
  try{ [void](Get-RelayPolicyPath 'D:/repo/.dh-runtime/n.json"') }catch{ $quoteVsRelMsg = $_.Exception.Message }
  try{ [void](Get-RelayPolicyPath 'D:/repo/../.dh-runtime/n.json') }catch{ $relVsDotMsg = $_.Exception.Message }
  Assert-True ($ctrlVsQuoteMsg.StartsWith('policy-path-control-char')) 'control-char outranks quoted'
  Assert-True ($quoteVsRelMsg.StartsWith('policy-path-quoted')) 'quoted outranks not-relative'
  Assert-True ($relVsDotMsg.StartsWith('policy-path-not-relative')) 'not-relative outranks dotdot'
  Assert-True (-not (Test-RelayPolicyUnderRoot 'tools/relayX/a' 'tools/relay/')) 'prefix must not swallow relayX'
  Assert-True (Test-RelayPolicyUnderRoot 'TOOLS/RELAY/a' 'tools/relay/') 'under-root is case insensitive'
  $emptyUnder=$true
  try{ $emptyUnder = [bool](Test-RelayPolicyUnderRoot '' 'tools/relay/') }catch{ $emptyUnder=$false }
  $nullUnder=$true
  try{ $nullUnder = [bool](Test-RelayPolicyUnderRoot $null 'tools/relay/') }catch{ $nullUnder=$false }
  Assert-True ((-not $emptyUnder) -and (-not $nullUnder)) 'empty or null path is fail-closed'

  $isoPolicy=@{production_root='tools/relay/';forbidden_roots=@('docs/modules/dh-crew/','skills/','tools/protocol/','.dh-runtime/');doc_roots=@('docs/modules/dh-relay/')}
  $isoOk=Get-RelayDevIsolationVerdict @('tools/relay/policy/relay-policy.ps1','tools/relay/tests/relay-policy.ps1') $isoPolicy
  Assert-True ($isoOk.ok -eq $true) 'all under tools/relay is ok'
  $isoCrew=Get-RelayDevIsolationVerdict @('tools/relay/x.ps1','docs/modules/dh-crew/x.md') $isoPolicy
  Assert-True ((-not $isoCrew.ok) -and $isoCrew.reason -eq 'dev-isolation-violation:forbidden-root') 'dh-crew path is forbidden-root'
  $isoOutside=Get-RelayDevIsolationVerdict @('tools/dh-console/a.mjs') $isoPolicy
  Assert-True ((-not $isoOutside.ok) -and $isoOutside.reason -eq 'dev-isolation-violation:production-outside-relay') 'production file outside relay is rejected'
  $isoRuntime=Get-RelayDevIsolationVerdict @('.dh-runtime/relay/x.json') $isoPolicy
  Assert-True ((-not $isoRuntime.ok) -and $isoRuntime.reason -eq 'dev-isolation-violation:forbidden-root') 'active state path is forbidden-root'
  $isoUnknown=Get-RelayDevIsolationVerdict @('README-新的.md') $isoPolicy
  Assert-True ((-not $isoUnknown.ok) -and $isoUnknown.reason -eq 'dev-isolation-violation:unclassified-path') 'unknown path is unclassified'

  $fixturePath=Join-Path $PSScriptRoot 'fixtures/policy/authority-2cards.json'
  $snap=Get-Content -Raw -LiteralPath $fixturePath | ConvertFrom-Json -AsHashtable
  Assert-True ($snap.cards.Count -eq 2 -and $snap.run_id -eq 'RUN-FAKE-DHR04') 'authority fixture parses'
  $allow=Get-RelayContentAllowSet $snap
  Assert-True ($allow -contains 'src/alpha/') 'allow set includes authorized business code prefix'
  Assert-True ($allow -contains 'docs/modules/beta/workspace/') 'allow set includes derived harness workspace'
  Assert-True ($allow -notcontains 'docs/modules/alpha/') 'allow set excludes bare module root'
  $missingThrew=$false
  try{ [void](Get-RelayContentAllowSet @{schema_version='relay/policy-fixture/v1'}) }catch{ $missingThrew=$true }
  $cardMissingThrew=$false
  try{ [void](Get-RelayContentAllowSet @{cards=@(@{card_id='X';change_scopes=@('src/x/')})}) }catch{ $cardMissingThrew=$true }
  Assert-True ($missingThrew -and $cardMissingThrew) 'incomplete snapshot throws'

  $cAlpha=Get-RelayContentPolicyVerdict @('src/alpha/a.ts') $snap
  Assert-True ($cAlpha.ok -eq $true) 'authorized business code is writable'
  $cExact=Get-RelayContentPolicyVerdict @('src/beta/util.ts') $snap
  Assert-True ($cExact.ok -eq $true) 'exact file scope is writable'
  $cSibling=Get-RelayContentPolicyVerdict @('src/beta/other.ts') $snap
  Assert-True ((-not $cSibling.ok) -and $cSibling.reason -eq 'content-policy-violation:outside-allow-set') 'sibling of exact file scope is rejected'
  $cRelay=Get-RelayContentPolicyVerdict @('.dh-relay/RUN-x/events.jsonl','docs/relay/runs/RUN-x/index.md') $snap
  Assert-True ($cRelay.ok -eq $true) 'fixed relay content roots are writable'
  $cGamma=Get-RelayContentPolicyVerdict @('src/gamma/a.ts') $snap
  Assert-True ((-not $cGamma.ok) -and $cGamma.reason -eq 'content-policy-violation:outside-allow-set') 'unauthorized business path is rejected'
  $cMissing=Get-RelayContentPolicyVerdict @('src/alpha/a.ts') $null
  Assert-True ((-not $cMissing.ok) -and $cMissing.reason -eq 'content-policy-violation:missing-authority') 'null snapshot is missing-authority'
  $cEmpty=Get-RelayContentPolicyVerdict @() $snap
  Assert-True ($cEmpty.ok -eq $true) 'empty written set is ok'

  Assert-True (Test-RelayPolicyModuleRelayFolder 'docs/modules/alpha/relay/x.json') 'module relay folder hits'
  Assert-True (-not (Test-RelayPolicyModuleRelayFolder 'docs/modules/relay/design/01.md')) 'legal module slug relay is not a hit'
  Assert-True (-not (Test-RelayPolicyModuleRelayFolder 'docs/modules/relay/workspace/X/progress.md')) 'legal module workspace is not a hit'
  Assert-True (Test-RelayPolicyWorkspaceRelayFolder 'docs/modules/alpha/workspace/A_01/relay/run.json') 'workspace card relay folder hits'
  Assert-True (-not (Test-RelayPolicyWorkspaceRelayFolder 'docs/modules/relay/workspace/X/progress.md')) 'legal module workspace predicate is not a hit'

  $markTrue={ param($p) $true }
  $markFalse={ param($p) $false }
  $preExist=Get-RelayLandingVerdict @('docs/modules/alpha/relay/x.json') @('docs/modules/alpha/relay/x.json') $markTrue
  Assert-True ($preExist.ok -eq $true) 'pre-existing module relay folder is not a hit'
  $newMod=Get-RelayLandingVerdict @('docs/modules/alpha/relay/x.json') @() $markTrue
  Assert-True ((-not $newMod.ok) -and $newMod.reason -eq 'landing-violation:module-relay-folder') 'new module relay folder with marker is rejected'
  $newWs=Get-RelayLandingVerdict @('docs/modules/alpha/workspace/A_01/relay/run.json') @() $markTrue
  Assert-True ((-not $newWs.ok) -and $newWs.reason -eq 'landing-violation:workspace-relay-folder') 'new workspace relay folder with marker is rejected'
  $legacy=Get-RelayLandingVerdict @('.dh-runtime/relay/new.json') @() $markFalse
  Assert-True ((-not $legacy.ok) -and $legacy.reason -eq 'landing-violation:legacy-root-write') 'new legacy root write is rejected'
  $unprobed=Get-RelayLandingVerdict @('docs/modules/alpha/relay/x.json') @() $null
  Assert-True ((-not $unprobed.ok) -and $unprobed.reason -eq 'landing-violation:marker-unprobed') 'unprobed marker is fail-closed'
  $legalMod=Get-RelayLandingVerdict @('docs/modules/relay/design/01.md') @() $markTrue
  Assert-True ($legalMod.ok -eq $true) 'legal module docs/modules/relay is not killed'
  $legalWs=Get-RelayLandingVerdict @('docs/modules/relay/workspace/X/progress.md') @() $markTrue
  Assert-True ($legalWs.ok -eq $true) 'legal module workspace is not killed by landing'
  $noMark=Get-RelayLandingVerdict @('docs/modules/alpha/relay/x.json') @() $markFalse
  Assert-True ($noMark.ok -eq $true) 'module relay shape without marker is ok'

  $obs=@(
    @{category='content';detail='src/alpha/a.ts'}
    @{category='git';detail='refs/heads/relay-staging'}
    @{category='user-level';detail='~/.dh-relay/runs.json'}
    @{category='cli';detail='claude config dir'}
    @{category='psmux';detail='session RELAY:x'}
  )
  $ledger=Get-RelaySideEffectLedger $obs
  Assert-True ($ledger.ok -eq $true -and $ledger.content.Count -eq 1 -and $ledger.git.Count -eq 1 -and $ledger.user_level.Count -eq 1 -and $ledger.cli.Count -eq 1 -and $ledger.psmux.Count -eq 1) 'five side-effect categories split'
  Assert-True ($ledger.git[0].detail -eq 'refs/heads/relay-staging') 'git observation stays in git bucket'
  $contentOnly=Get-RelayContentPolicyVerdict @($ledger.content | ForEach-Object { $_.detail }) $snap
  Assert-True ($contentOnly.ok -eq $true) 'git ref is not fed to content policy'
  $ifMixed=Get-RelayContentPolicyVerdict @($ledger.git[0].detail) $snap
  Assert-True ((-not $ifMixed.ok) -and $ifMixed.reason -eq 'content-policy-violation:outside-allow-set') 'git ref would violate content policy if mixed'
  $badLedger=Get-RelaySideEffectLedger @(@{category='network';detail='http'})
  Assert-True ((-not $badLedger.ok) -and $badLedger.reason -eq 'side-effect-unclassified') 'unknown category is unclassified'

  $cli=Join-Path $PSScriptRoot '../policy/Invoke-RelayPolicyCheck.ps1'
  & pwsh -NoProfile -File $cli -Mode content | Out-Null
  Assert-True ($LASTEXITCODE -eq 2) 'content mode without args exits 2'
  $tmp=Join-Path ([IO.Path]::GetTempPath()) "relay-policy-cli-$([guid]::NewGuid().ToString('N'))"
  $script:roots.Add($tmp)
  New-Item -ItemType Directory -Path $tmp | Out-Null
  $afterOk=Join-Path $tmp 'after-ok.json'
  Set-Content -LiteralPath $afterOk -Value '["src/alpha/a.ts"]' -Encoding utf8
  & pwsh -NoProfile -File $cli -Mode content -SnapshotPath $fixturePath -AfterPath $afterOk | Out-Null
  Assert-True ($LASTEXITCODE -eq 0) 'content mode with clean input exits 0'

  $afterDotDotIso=Join-Path $tmp 'after-dotdot-iso.txt'
  Set-Content -LiteralPath $afterDotDotIso -Value 'tools/relay/../protocol/evil.ps1' -Encoding utf8
  & pwsh -NoProfile -File $cli -Mode dev-isolation -AfterPath $afterDotDotIso | Out-Null
  Assert-True ($LASTEXITCODE -eq 3) 'dev-isolation rejects path with ..'

  $afterDotDotContent=Join-Path $tmp 'after-dotdot-content.txt'
  Set-Content -LiteralPath $afterDotDotContent -Value 'src/alpha/../gamma/x.ts' -Encoding utf8
  & pwsh -NoProfile -File $cli -Mode content -SnapshotPath $fixturePath -AfterPath $afterDotDotContent | Out-Null
  Assert-True ($LASTEXITCODE -eq 3) 'content rejects path with ..'

  $afterDotDotLanding=Join-Path $tmp 'after-dotdot-landing.txt'
  $beforeDotDotLanding=Join-Path $tmp 'before-dotdot-landing.txt'
  Set-Content -LiteralPath $afterDotDotLanding -Value '.dh-relay/../.dh-runtime/n.json' -Encoding utf8
  Set-Content -LiteralPath $beforeDotDotLanding -Value 'docs/modules/alpha/relay/x.json' -Encoding utf8
  & pwsh -NoProfile -File $cli -Mode landing -BeforePath $beforeDotDotLanding -AfterPath $afterDotDotLanding | Out-Null
  Assert-True ($LASTEXITCODE -eq 3) 'landing rejects path with ..'

  $afterAbsIso=Join-Path $tmp 'after-abs-iso.txt'
  Set-Content -LiteralPath $afterAbsIso -Value 'D:/repo/.dh-runtime/n.json' -Encoding utf8
  & pwsh -NoProfile -File $cli -Mode dev-isolation -AfterPath $afterAbsIso | Out-Null
  Assert-True ($LASTEXITCODE -eq 3) 'dev-isolation rejects absolute drive path with exit 3'

  $afterAbsContent=Join-Path $tmp 'after-abs-content.txt'
  Set-Content -LiteralPath $afterAbsContent -Value '~/.dh-runtime/n.json' -Encoding utf8
  & pwsh -NoProfile -File $cli -Mode content -SnapshotPath $fixturePath -AfterPath $afterAbsContent | Out-Null
  Assert-True ($LASTEXITCODE -eq 3) 'content rejects tilde path with exit 3'

  $afterAbsLanding=Join-Path $tmp 'after-abs-landing.txt'
  $beforeAbsLanding=Join-Path $tmp 'before-abs-landing.txt'
  Set-Content -LiteralPath $afterAbsLanding -Value '/.dh-runtime/n.json' -Encoding utf8
  Set-Content -LiteralPath $beforeAbsLanding -Value 'docs/modules/alpha/relay/x.json' -Encoding utf8
  & pwsh -NoProfile -File $cli -Mode landing -BeforePath $beforeAbsLanding -AfterPath $afterAbsLanding | Out-Null
  Assert-True ($LASTEXITCODE -eq 3) 'landing rejects leading-slash path with exit 3'

  # === 清单条目形态：四个入口都不得静默盖绿章（R5-01 / R5-02 / R6-01 / R6-02） ===
  # R5-01：NUL 分隔（CLI 头部自己推荐的 -z 输出形态）必须被拆开逐条判，不得粘成一条超长路径
  $afterNul=Join-Path $tmp 'after-nul.txt'
  [IO.File]::WriteAllText($afterNul, "docs/modules/dh-relay/workspace/DHR_04/findings.md`0.dh-runtime/relay/new.json`0", [Text.UTF8Encoding]::new($false))
  & pwsh -NoProfile -File $cli -Mode dev-isolation -AfterPath $afterNul | Out-Null
  Assert-True ($LASTEXITCODE -eq 1) 'NUL-separated list is split, forbidden root still caught in dev-isolation'
  $beforeNul=Join-Path $tmp 'before-nul.txt'
  Set-Content -LiteralPath $beforeNul -Value 'seed/README.md' -Encoding utf8
  & pwsh -NoProfile -File $cli -Mode landing -BeforePath $beforeNul -AfterPath $afterNul | Out-Null
  Assert-True ($LASTEXITCODE -eq 1) 'NUL-separated list is split, legacy root still caught in landing'

  # R6-01：纯 CR 分隔同样要拆（\r?\n 拆不开孤立 CR）
  $afterCr=Join-Path $tmp 'after-cr.txt'
  [IO.File]::WriteAllText($afterCr, "docs/modules/dh-relay/workspace/DHR_04/findings.md`r.dh-runtime/relay/new.json`r", [Text.UTF8Encoding]::new($false))
  & pwsh -NoProfile -File $cli -Mode dev-isolation -AfterPath $afterCr | Out-Null
  Assert-True ($LASTEXITCODE -eq 1) 'CR-only separated list is split, forbidden root still caught'
  & pwsh -NoProfile -File $cli -Mode landing -BeforePath $beforeNul -AfterPath $afterCr | Out-Null
  Assert-True ($LASTEXITCODE -eq 1) 'CR-only separated list is split, legacy root still caught in landing'

  # R5-02：git 引号形态在 landing 曾静默 exit 0，现须 fail-closed 到守卫异常
  $afterQuoted=Join-Path $tmp 'after-quoted.txt'
  Set-Content -LiteralPath $afterQuoted -Value '".dh-runtime/relay/\346\226\260.json"' -Encoding utf8
  & pwsh -NoProfile -File $cli -Mode landing -BeforePath $beforeNul -AfterPath $afterQuoted | Out-Null
  Assert-True ($LASTEXITCODE -eq 3) 'git-quoted path in landing exits 3 instead of silently passing'
  & pwsh -NoProfile -File $cli -Mode dev-isolation -AfterPath $afterQuoted | Out-Null
  Assert-True ($LASTEXITCODE -eq 3) 'git-quoted path in dev-isolation exits 3'

  # R6-02：JSON 清单里的非字符串条目属输入畸形，不得降级成 unclassified-path
  $afterJsonBad=Join-Path $tmp 'after-json-bad.json'
  Set-Content -LiteralPath $afterJsonBad -Value '[null,"src/alpha/a.ts"]' -Encoding utf8
  $jsonBadOut=& pwsh -NoProfile -File $cli -Mode dev-isolation -AfterPath $afterJsonBad 2>&1 | Out-String
  Assert-True ($LASTEXITCODE -eq 3 -and $jsonBadOut -match 'policy-list-entry-not-string') 'JSON list with null entry exits 3'
  $afterJsonNest=Join-Path $tmp 'after-json-nested.json'
  Set-Content -LiteralPath $afterJsonNest -Value '["src/alpha/a.ts",["nested"]]' -Encoding utf8
  & pwsh -NoProfile -File $cli -Mode dev-isolation -AfterPath $afterJsonNest | Out-Null
  Assert-True ($LASTEXITCODE -eq 3) 'JSON list with nested array entry exits 3'

  # git status --porcelain emits "XY <path>", not paths. Not silently accepted:
  # the status prefix must miss every root and surface as a violation.
  $afterPorcelain=Join-Path $tmp 'after-porcelain.txt'
  [IO.File]::WriteAllText($afterPorcelain, " M tools/relay/policy/relay-policy.ps1`0", [Text.UTF8Encoding]::new($false))
  & pwsh -NoProfile -File $cli -Mode dev-isolation -AfterPath $afterPorcelain | Out-Null
  Assert-True ($LASTEXITCODE -eq 1) 'porcelain status-prefixed entry is not silently accepted as under tools/relay/'

  $afterMulti=Join-Path $tmp 'after-multi.txt'
  $beforeMulti=Join-Path $tmp 'before-multi.txt'
  Set-Content -LiteralPath $afterMulti -Value "docs/modules/dh-crew/x.md`nsrc/gamma/a.ts" -Encoding utf8
  Set-Content -LiteralPath $beforeMulti -Value 'seed/README.md' -Encoding utf8
  $multiOut=& pwsh -NoProfile -File $cli -Mode all -SnapshotPath $fixturePath -BeforePath $beforeMulti -AfterPath $afterMulti
  $multiText=($multiOut | Out-String)
  Assert-True ($LASTEXITCODE -eq 1 -and $multiText -match '"reason":\s*"policy-violation:multi"') 'mode all multi-verdict reason is policy-violation:multi'

  $afterEmpty=Join-Path $tmp 'after-empty.txt'
  Set-Content -LiteralPath $afterEmpty -Value '' -Encoding utf8
  & pwsh -NoProfile -File $cli -Mode content -SnapshotPath $fixturePath -AfterPath $afterEmpty | Out-Null
  Assert-True ($LASTEXITCODE -eq 2) 'empty after-path file exits 2'

  $badSnapArr=Join-Path $tmp 'snap-array.json'
  Set-Content -LiteralPath $badSnapArr -Value '[]' -Encoding utf8
  $badArrOut=& pwsh -NoProfile -File $cli -Mode content -SnapshotPath $badSnapArr -AfterPath $afterOk 2>&1 | Out-String
  Assert-True ($LASTEXITCODE -eq 3 -and $badArrOut -match 'relay-policy: guard error') 'malformed snapshot array exits 3'

  $badSnapNull=Join-Path $tmp 'snap-null-cards.json'
  Set-Content -LiteralPath $badSnapNull -Value '{"cards":null}' -Encoding utf8
  $badNullOut=& pwsh -NoProfile -File $cli -Mode content -SnapshotPath $badSnapNull -AfterPath $afterOk 2>&1 | Out-String
  Assert-True ($LASTEXITCODE -eq 3 -and $badNullOut -match 'relay-policy: guard error') 'snapshot with null cards exits 3'

  $gitRoot=Join-Path ([IO.Path]::GetTempPath()) "relay-policy-git-$([guid]::NewGuid().ToString('N'))"
  $script:roots.Add($gitRoot)
  New-Item -ItemType Directory -Path $gitRoot | Out-Null
  function Get-PolicyTreeFiles([string]$Root){
    Get-ChildItem -LiteralPath $Root -Recurse -File | Where-Object { $_.FullName -notmatch '[\\/]\.git([\\/]|$)' } | ForEach-Object {
      $_.FullName.Substring($Root.Length).TrimStart('\','/') -replace '\\','/'
    }
  }
  Push-Location $gitRoot
  try{
    git init -q | Out-Null
    git config user.email 'relay-policy@example.com'
    git config user.name 'relay-policy'
    New-Item -ItemType Directory -Path (Join-Path $gitRoot 'seed') | Out-Null
    Set-Content -LiteralPath (Join-Path $gitRoot 'seed/README.md') -Value 'seed' -Encoding utf8
    git add -A
    git commit -qm 'seed'
    $beforeFiles=@(Get-PolicyTreeFiles $gitRoot)
    New-Item -ItemType Directory -Path (Join-Path $gitRoot 'src/alpha') -Force | Out-Null
    New-Item -ItemType Directory -Path (Join-Path $gitRoot 'src/gamma') -Force | Out-Null
    Set-Content -LiteralPath (Join-Path $gitRoot 'src/alpha/a.ts') -Value 'export const a=1' -Encoding utf8
    Set-Content -LiteralPath (Join-Path $gitRoot 'src/gamma/x.ts') -Value 'export const x=1' -Encoding utf8
    $afterFiles=@(Get-PolicyTreeFiles $gitRoot)
    $created=@($afterFiles | Where-Object { $_ -notin $beforeFiles })
    $porcelain=@(git status --porcelain --untracked-files=all | ForEach-Object { $_.Substring(3).Trim('"') -replace '\\','/' })
    $statusSet=[Collections.Generic.HashSet[string]]::new([StringComparer]::OrdinalIgnoreCase)
    foreach($p in $porcelain){[void]$statusSet.Add($p)}
    $createdSet=[Collections.Generic.HashSet[string]]::new([StringComparer]::OrdinalIgnoreCase)
    foreach($p in $created){[void]$createdSet.Add($p)}
    Assert-True ($statusSet.SetEquals($createdSet) -and $statusSet.Contains('src/alpha/a.ts') -and $statusSet.Contains('src/gamma/x.ts')) 'git status matches after-before snapshot'
    $cross=Get-RelayContentPolicyVerdict $created $snap
    $crossPaths=@($cross.violations | ForEach-Object { $_.path -replace '\\','/' })
    Assert-True ((-not $cross.ok) -and $cross.reason -eq 'content-policy-violation:outside-allow-set' -and $crossPaths -contains 'src/gamma/x.ts') 'oracle rejects unauthorized gamma write'
    $alphaOnly=Get-RelayContentPolicyVerdict @('src/alpha/a.ts') $snap
    Assert-True ($alphaOnly.ok -eq $true) 'oracle allows authorized alpha write'
    $afterFile=Join-Path $tmp 'after-cross.json'
    Set-Content -LiteralPath $afterFile -Value '["src/alpha/a.ts","src/gamma/x.ts"]' -Encoding utf8
    $cliOut=& pwsh -NoProfile -File $cli -Mode content -SnapshotPath $fixturePath -AfterPath $afterFile
    $cliText=($cliOut | Out-String)
    Assert-True ($LASTEXITCODE -eq 1 -and $cliText -match 'src/gamma/x.ts') 'CLI independent check matches oracle'

    $lockedDir=Join-Path $gitRoot 'src/gamma/locked'
    New-Item -ItemType Directory -Path $lockedDir -Force | Out-Null
    $lockedUser=$env:USERNAME
    $lockedAclApplied=$false
    try{
      & icacls $lockedDir /deny "${lockedUser}:(W)" | Out-Null
      $lockedAclApplied=($LASTEXITCODE -eq 0)
      Assert-True $lockedAclApplied 'icacls deny write applied'
      $lockedFile=Join-Path $lockedDir 'x.ts'
      $writeDenied=$false
      try{
        Set-Content -LiteralPath $lockedFile -Value 'export const locked=1' -Encoding utf8 -ErrorAction Stop
      }catch{ $writeDenied=$true }
      if(-not $writeDenied){ $writeDenied = -not (Test-Path -LiteralPath $lockedFile) }
      Assert-True $writeDenied 'restricted-write environment actually denies write'
      $lockedVerdict=Get-RelayContentPolicyVerdict @('src/gamma/locked/x.ts') $snap
      Assert-True ((-not $lockedVerdict.ok) -and $lockedVerdict.reason -eq 'content-policy-violation:outside-allow-set' -and $writeDenied) 'policy agrees with denied write on unauthorized path'
    }finally{
      if($lockedAclApplied){ & icacls $lockedDir /remove:d $lockedUser | Out-Null }
      if(Test-Path -LiteralPath $lockedDir){ Remove-Item -LiteralPath $lockedDir -Recurse -Force }
    }
  }finally{Pop-Location}
}finally{foreach($root in $script:roots){if(Test-Path $root){Remove-Item -LiteralPath $root -Recurse -Force}}}
Write-Host "ASSERTIONS $script:assertions";if($script:failed){Write-Host "SUITE FAIL ($script:failed)";exit 1};Write-Host 'SUITE PASS';exit 0
