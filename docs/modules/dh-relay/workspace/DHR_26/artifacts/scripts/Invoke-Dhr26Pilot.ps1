[CmdletBinding()]
param(
    [string]$ExperimentRoot = 'D:\MyFiles\ai-workflow\dh-relay-p4-pilot',
    [string]$Profile = 'relay-pilot',
    [switch]$SkipUpgrade
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Invoke-Captured {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)][string]$File,
        [Parameter(Mandatory)][string[]]$Arguments,
        [Parameter(Mandatory)][string]$OutFile
    )

    $lines = @(& $File @Arguments 2>&1 | ForEach-Object { $_.ToString() })
    $exit = $LASTEXITCODE
    $lines | Set-Content -LiteralPath $OutFile -Encoding utf8
    if ($exit -ne 0) {
        throw "$File exited $exit; see $OutFile"
    }
    return $lines
}

function Get-DshVersion {
    $raw = @(& dsh --version 2>&1 | ForEach-Object { $_.ToString() })
    if ($LASTEXITCODE -ne 0) { throw "dsh --version failed: $($raw -join ' ')" }
    $text = ($raw -join "`n").Trim()
    $match = [regex]::Match($text, '\b\d+\.\d+\.\d+-rc\.\d+\b')
    if (-not $match.Success) { throw "could not parse dsh version from: $text" }
    return $match.Value
}

function Get-NpmRoot {
    $raw = @(& npm root -g 2>&1 | ForEach-Object { $_.ToString() })
    if ($LASTEXITCODE -ne 0) { throw "npm root -g failed: $($raw -join ' ')" }
    return ($raw -join "`n").Trim()
}

function Get-DshInstallRoot {
    param([Parameter(Mandatory)][string]$NpmRoot)
    $root = Join-Path (Join-Path $NpmRoot '@deepseek-ai') 'dsh'
    $manifest = Join-Path $root 'package.json'
    if (-not (Test-Path -LiteralPath $manifest)) {
        throw "globally npm-installed @deepseek-ai/dsh not found at $manifest"
    }
    return $root
}

function Write-DshSnapshot {
    param(
        [Parameter(Mandatory)][string]$Label,
        [Parameter(Mandatory)][string]$OutJson,
        [Parameter(Mandatory)][string]$Version,
        [Parameter(Mandatory)][string]$HostRoot,
        [Parameter(Mandatory)][string]$EvidenceRoot
    )

    $npmRoot = Get-NpmRoot
    $installRoot = Get-DshInstallRoot -NpmRoot $npmRoot
    $logName = "snapshot-$Label.log"
    Invoke-Captured -File 'node' -Arguments @(
        (Join-Path $HostRoot 'scripts\snapshot-dsh.mjs'),
        '--label', $Label,
        '--out', $OutJson,
        '--dsh-version', $Version,
        '--npm-root', $npmRoot,
        '--install-root', $installRoot
    ) -OutFile (Join-Path $EvidenceRoot $logName) | Out-Null

    $snapshot = Get-Content -LiteralPath $OutJson -Raw | ConvertFrom-Json
    if ([int]$snapshot.unresolved_dependency_count -ne 0) {
        throw "DSH inventory has unresolved @deepseek-ai dependencies; see $OutJson"
    }
    return $snapshot
}

$pilotRoot = Join-Path $ExperimentRoot 'relay-control-pilot'
$hostRoot = Join-Path $pilotRoot 'src\dsh-host'
$fixtureRoot = Join-Path $pilotRoot 'testdata\fake'
$evidenceRoot = Join-Path $ExperimentRoot 'evidence\dhr26'
$dshHome = Join-Path $ExperimentRoot 'dsh-home'
$baselineRoot = Join-Path $ExperimentRoot 'evidence\dsh-version-baseline'
New-Item -ItemType Directory -Force -Path $evidenceRoot, $dshHome, $baselineRoot | Out-Null

foreach ($command in 'node', 'npm', 'pnpm', 'dsh') {
    if (-not (Get-Command $command -ErrorAction SilentlyContinue)) {
        throw "required command is unavailable: $command"
    }
}
if (-not (Test-Path -LiteralPath $hostRoot)) { throw "Host package missing: $hostRoot" }
if (-not (Test-Path -LiteralPath $fixtureRoot)) { throw "DHR_25 fixture root missing: $fixtureRoot" }

$env:DSH_HOME = $dshHome
$currentVersion = Get-DshVersion
$currentVersion | Set-Content -LiteralPath (Join-Path $evidenceRoot 'version-at-entry.txt') -Encoding utf8
if ($currentVersion -notin @('0.1.0-rc.6', '0.1.0-rc.7')) {
    throw "expected rc.6 or rc.7 at entry, got $currentVersion"
}

$preExisting = Join-Path $baselineRoot 'rc6-before-upgrade.txt'
$baselineValidationPath = Join-Path $baselineRoot 'rc6-precollected-validation.json'
$preSourceUsable = $false
$validation = [ordered]@{
    source_path = $preExisting
    source_exists = (Test-Path -LiteralPath $preExisting)
    expected_line_count = 245
    expected_package_count = 194
    actual_line_count = $null
    contains_rc6 = $false
    contains_expected_package_count = $false
    sha256 = $null
    disposition = 'absent-fresh-capture-required'
}
if ($validation['source_exists']) {
    $preLines = @(Get-Content -LiteralPath $preExisting)
    $preText = $preLines -join "`n"
    $validation['actual_line_count'] = $preLines.Count
    $validation['contains_rc6'] = $preText -match '0\.1\.0-rc\.6'
    $validation['contains_expected_package_count'] = $preText -match '(?m)(package_count\s*[=:]\s*194\b|\b194\s+(built-in\s+)?packages?\b|\b194\s*个)'
    $validation['sha256'] = (Get-FileHash -LiteralPath $preExisting -Algorithm SHA256).Hash.ToLowerInvariant()
    $generatedSnapshot = (
        $preText -match '(?m)^label=before-upgrade$' -and
        $preText -match '(?m)^package_count=\d+$'
    )
    $preSourceUsable = (
        $validation['contains_rc6'] -and
        ($validation['actual_line_count'] -eq $validation['expected_line_count'] -or $generatedSnapshot)
    )
    if ($preSourceUsable) {
        $validation['disposition'] = if ($generatedSnapshot) {
            'validated-as-generated-rc6-source'
        } else {
            'validated-as-precollected-rc6-source'
        }
    } else {
        $stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
        $invalidated = Join-Path $baselineRoot "rc6-before-upgrade.invalidated-$stamp.txt"
        Copy-Item -LiteralPath $preExisting -Destination $invalidated -Force
        $validation['disposition'] = "invalidated-copy=$invalidated; fresh-capture-required"
    }
}
$validation | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath $baselineValidationPath -Encoding utf8
$precollectedSourceUsable = $preSourceUsable
$rc6SourceAvailable = $preSourceUsable

$beforeJson = Join-Path $baselineRoot 'before-upgrade.json'
$beforeSnapshotAvailable = $false
if ($currentVersion -eq '0.1.0-rc.6') {
    $beforeSnapshot = Write-DshSnapshot -Label 'before-upgrade' -OutJson $beforeJson `
        -Version $currentVersion -HostRoot $hostRoot -EvidenceRoot $evidenceRoot
    $beforeSnapshotAvailable = $true
    $validation['fresh_package_count'] = [int]$beforeSnapshot.package_count
    $freshBeforeText = $beforeJson -replace '\.json$', '.txt'
    $freshMatchesExpectedInventory = [int]$beforeSnapshot.package_count -eq 194
    if (-not $freshMatchesExpectedInventory) {
        $validation['disposition'] = "$($validation['disposition']); package inventory drift observed"
    }
    if (-not $precollectedSourceUsable) {
        Copy-Item -LiteralPath $freshBeforeText -Destination $preExisting -Force
        $validation['disposition'] = "$($validation['disposition']); fresh rc6 capture promoted to canonical source"
        $validation['sha256'] = (Get-FileHash -LiteralPath $preExisting -Algorithm SHA256).Hash.ToLowerInvariant()
        $validation['actual_line_count'] = @(Get-Content -LiteralPath $preExisting).Count
        $validation['contains_rc6'] = $true
        $rc6SourceAvailable = $true
    } else {
        $validation['fresh_revalidation_path'] = $freshBeforeText
        $validation['fresh_revalidation_sha256'] = (Get-FileHash -LiteralPath $freshBeforeText -Algorithm SHA256).Hash.ToLowerInvariant()
    }
    $validation | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath $baselineValidationPath -Encoding utf8
} elseif (Test-Path -LiteralPath $beforeJson) {
    $existingBefore = Get-Content -LiteralPath $beforeJson -Raw | ConvertFrom-Json
    $beforeSnapshotAvailable = $existingBefore.dsh_version -eq '0.1.0-rc.6'
}

$upgradeAttempted = $false
$upgradePerformed = $false
$upgradeFailed = $false
$upgradeFailure = $null
if (-not $SkipUpgrade -and $currentVersion -eq '0.1.0-rc.6') {
    $upgradeAttempted = $true
    try {
        Invoke-Captured -File 'npm' -Arguments @('install', '-g', '@deepseek-ai/dsh@0.1.0-rc.7') `
            -OutFile (Join-Path $evidenceRoot 'upgrade-rc7.txt') | Out-Null
        $upgradePerformed = $true
    } catch {
        $upgradeFailed = $true
        $upgradeFailure = $_.Exception.Message
        $upgradeFailure | Set-Content -LiteralPath (Join-Path $evidenceRoot 'upgrade-rc7-failure.txt') -Encoding utf8
    }
}

$afterVersion = Get-DshVersion
$afterVersion | Set-Content -LiteralPath (Join-Path $evidenceRoot 'version-after-upgrade-step.txt') -Encoding utf8
if ($afterVersion -notin @('0.1.0-rc.6', '0.1.0-rc.7')) {
    throw "unsupported DSH version after upgrade step: $afterVersion"
}
if ($upgradeAttempted -and $afterVersion -ne '0.1.0-rc.7') {
    $upgradeFailed = $true
    if (-not $upgradeFailure) {
        $upgradeFailure = "upgrade command returned success but dsh remained at $afterVersion"
        $upgradeFailure | Set-Content -LiteralPath (Join-Path $evidenceRoot 'upgrade-rc7-failure.txt') -Encoding utf8
    }
}

$afterLabel = if ($afterVersion -eq '0.1.0-rc.7') { 'rc7-after-upgrade' } else { 'after-upgrade-step' }
$afterJson = Join-Path $baselineRoot "$afterLabel.json"
$afterSnapshot = Write-DshSnapshot -Label $afterLabel -OutJson $afterJson `
    -Version $afterVersion -HostRoot $hostRoot -EvidenceRoot $evidenceRoot

$diffAvailable = $false
if ($beforeSnapshotAvailable -and $afterVersion -eq '0.1.0-rc.7') {
    Invoke-Captured -File 'node' -Arguments @(
        (Join-Path $hostRoot 'scripts\compare-snapshots.mjs'),
        '--before', $beforeJson,
        '--after', $afterJson,
        '--out', (Join-Path $baselineRoot 'rc6-to-rc7-diff.json')
    ) -OutFile (Join-Path $evidenceRoot 'compare-snapshots.log') | Out-Null
    $diffAvailable = $true
}

Invoke-Captured -File 'npm' -Arguments @('--prefix', $hostRoot, 'test') `
    -OutFile (Join-Path $evidenceRoot 'host-unit-tests.txt') | Out-Null
Invoke-Captured -File 'npm' -Arguments @('--prefix', $hostRoot, 'run', 'check') `
    -OutFile (Join-Path $evidenceRoot 'host-syntax-check.txt') | Out-Null
Invoke-Captured -File 'npm' -Arguments @('pack', $hostRoot, '--dry-run') `
    -OutFile (Join-Path $evidenceRoot 'host-pack-dry-run.txt') | Out-Null

$selectionPath = Join-Path $evidenceRoot 'fixture-selection.json'
Invoke-Captured -File 'node' -Arguments @(
    (Join-Path $hostRoot 'scripts\discover-fixtures.mjs'),
    '--root', $fixtureRoot,
    '--out', $selectionPath
) -OutFile (Join-Path $evidenceRoot 'fixture-discovery.txt') | Out-Null
$selection = Get-Content -LiteralPath $selectionPath -Raw | ConvertFrom-Json
$env:RELAY_PILOT_DETAIL_FIXTURE = $selection.detail_fixture
$env:RELAY_PILOT_LIST_FIXTURE = $selection.list_fixture
$env:RELAY_PILOT_HOST_DISABLED = '0'
$env:RELAY_PILOT_PROBE = '1'

Invoke-Captured -File 'dsh' -Arguments @('plugin', '--profile', $Profile, 'add', $hostRoot) `
    -OutFile (Join-Path $evidenceRoot 'install.txt') | Out-Null
Invoke-Captured -File 'dsh' -Arguments @('--profile', $Profile, '--dump-config') `
    -OutFile (Join-Path $evidenceRoot 'config-installed.txt') | Out-Null
$reconNpmRoot = Get-NpmRoot
$reconInstallRoot = Get-DshInstallRoot -NpmRoot $reconNpmRoot
Invoke-Captured -File 'node' -Arguments @(
    (Join-Path $hostRoot 'scripts\recon-client.mjs'),
    '--npm-root', $reconNpmRoot,
    '--install-root', $reconInstallRoot,
    '--dsh-home', $dshHome,
    '--profile', $Profile,
    '--out', (Join-Path $evidenceRoot 'client-recon.json')
) -OutFile (Join-Path $evidenceRoot 'client-recon.txt') | Out-Null
Invoke-Captured -File 'dsh' -Arguments @('--profile', $Profile) `
    -OutFile (Join-Path $evidenceRoot 'host-probe.txt') | Out-Null
Invoke-Captured -File 'node' -Arguments @(
    (Join-Path $hostRoot 'scripts\verify-transcript.mjs'),
    '--transcript', (Join-Path $evidenceRoot 'host-probe.txt'),
    '--list', $selection.list_fixture,
    '--detail', $selection.detail_fixture,
    '--out', (Join-Path $evidenceRoot 'host-probe-report.json')
) -OutFile (Join-Path $evidenceRoot 'host-probe-verify.txt') | Out-Null

'DHR26_EARLY_DELIVERY: first ctx.relayPilot call succeeded' | Write-Output
Get-Content -LiteralPath (Join-Path $evidenceRoot 'host-probe.txt')
Get-Content -LiteralPath (Join-Path $evidenceRoot 'host-probe-report.json')

$absenceModule = (Resolve-Path -LiteralPath (Join-Path $hostRoot 'scripts\service-absence-probe.js')).Path.Replace("'", "''")
$absencePatch = Join-Path $evidenceRoot 'absence-probe.patch.yml'
@"
- insert:
    - id: relay-pilot-absence-probe
      name: '$absenceModule'
"@ | Set-Content -LiteralPath $absencePatch -Encoding utf8

$env:RELAY_PILOT_HOST_DISABLED = '1'
$env:RELAY_PILOT_PROBE = '0'
Invoke-Captured -File 'dsh' -Arguments @('--profile', $Profile, '--patch', $absencePatch) `
    -OutFile (Join-Path $evidenceRoot 'host-disabled.txt') | Out-Null
if (-not (Select-String -LiteralPath (Join-Path $evidenceRoot 'host-disabled.txt') -SimpleMatch '"present":false' -Quiet)) {
    throw 'disabled Host still exposed ctx.relayPilot'
}

Invoke-Captured -File 'dsh' -Arguments @('plugin', '--profile', $Profile, 'remove', '@dh-relay/dsh-relay-pilot-host') `
    -OutFile (Join-Path $evidenceRoot 'uninstall.txt') | Out-Null
Invoke-Captured -File 'dsh' -Arguments @('--profile', $Profile, '--dump-config') `
    -OutFile (Join-Path $evidenceRoot 'config-uninstalled.txt') | Out-Null
if (Select-String -LiteralPath (Join-Path $evidenceRoot 'config-uninstalled.txt') -SimpleMatch 'relay-pilot-host' -Quiet) {
    throw 'Host row remains after uninstall'
}
Invoke-Captured -File 'dsh' -Arguments @('--profile', $Profile, '--patch', $absencePatch) `
    -OutFile (Join-Path $evidenceRoot 'host-after-uninstall.txt') | Out-Null
if (-not (Select-String -LiteralPath (Join-Path $evidenceRoot 'host-after-uninstall.txt') -SimpleMatch '"present":false' -Quiet)) {
    throw 'ctx.relayPilot remains after uninstall'
}

# Leave the isolated profile installed and enabled for DHR_49.
Invoke-Captured -File 'dsh' -Arguments @('plugin', '--profile', $Profile, 'add', $hostRoot) `
    -OutFile (Join-Path $evidenceRoot 'reinstall.txt') | Out-Null
$env:RELAY_PILOT_HOST_DISABLED = '0'
$env:RELAY_PILOT_PROBE = '1'
Invoke-Captured -File 'dsh' -Arguments @('--profile', $Profile) `
    -OutFile (Join-Path $evidenceRoot 'host-final-probe.txt') | Out-Null
Invoke-Captured -File 'node' -Arguments @(
    (Join-Path $hostRoot 'scripts\verify-transcript.mjs'),
    '--transcript', (Join-Path $evidenceRoot 'host-final-probe.txt'),
    '--list', $selection.list_fixture,
    '--detail', $selection.detail_fixture,
    '--out', (Join-Path $evidenceRoot 'host-final-probe-report.json')
) -OutFile (Join-Path $evidenceRoot 'host-final-probe-verify.txt') | Out-Null

$versionEvidenceComplete = (
    $afterVersion -eq '0.1.0-rc.7' -and
    ($beforeSnapshotAvailable -or $rc6SourceAvailable) -and
    ($upgradePerformed -or $currentVersion -eq '0.1.0-rc.7')
)
$resultName = if ($versionEvidenceComplete) {
    'DHR26_RUNTIME_EVIDENCE_COMPLETE'
} else {
    'DHR26_HOST_EVIDENCE_COMPLETE_VERSION_CHAIN_INCOMPLETE'
}
$resultPath = Join-Path $evidenceRoot 'result.json'
[ordered]@{
    result = $resultName
    version_evidence_complete = $versionEvidenceComplete
    version_at_entry = $currentVersion
    dsh_version = $afterVersion
    upgrade_attempted = $upgradeAttempted
    upgrade_performed = $upgradePerformed
    upgrade_failed = $upgradeFailed
    upgrade_failure = $upgradeFailure
    precollected_rc6_source_usable = $precollectedSourceUsable
    rc6_source_available = $rc6SourceAvailable
    before_snapshot_available = $beforeSnapshotAvailable
    snapshot_diff_available = $diffAvailable
    dsh_home = $dshHome
    profile = $Profile
    list_fixture = $selection.list_fixture
    detail_fixture = $selection.detail_fixture
    evidence_root = $evidenceRoot
} | ConvertTo-Json | Set-Content -LiteralPath $resultPath -Encoding utf8
Get-Content -LiteralPath $resultPath

if (-not $versionEvidenceComplete) {
    throw "Host lifecycle evidence passed, but the rc.6 to rc.7 version chain is incomplete; see $resultPath"
}
