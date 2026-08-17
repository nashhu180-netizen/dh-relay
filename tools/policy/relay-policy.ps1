. (Join-Path $PSScriptRoot '../contracts/relay-schema.ps1')

function Get-RelayPolicyPath([string]$Path) {
  if ([string]::IsNullOrWhiteSpace($Path)) { throw 'policy-path-empty' }
  $trimmed = $Path.Trim()
  # Rejection precedence, outermost first. Each layer answers a different
  # question, so the order is not arbitrary:
  #   1 empty          -- there is no path at all
  #   2 control-char   -- this is not ONE list entry (NUL/CR-glued list, etc.)
  #   3 quoted         -- this is not a raw path (git core.quotePath output)
  #   4 not-relative   -- this is a path, but not a repo-relative one
  #   5 dotdot         -- this is a repo-relative path with illegal content
  # 2 and 3 are "malformed list entry"; 4 and 5 are "malformed path". A blob
  # that is both must be reported as the outer defect, else the caller fixes
  # the wrong thing. Callers must never receive a pass for any of them.
  # Regex, not a Where-Object filter: a filter emits the offending char, and
  # [bool][char]0 is $false -- so a NUL, the very case this guard exists for,
  # would silently test false while CR/LF tested true.
  if ($trimmed -match '[\x00-\x1F\x7F]') {
    throw "policy-path-control-char: $Path"
  }
  if ($trimmed.StartsWith('"') -or $trimmed.EndsWith('"')) {
    # Do not strip: half-stripping cannot undo \xxx octal escapes, and this
    # guard's contract is repo-relative raw paths. Reject and let the caller
    # regenerate the list with -z / core.quotePath=false.
    throw "policy-path-quoted: $Path"
  }
  $normalized = $trimmed -replace '\\', '/'
  # Non-relative forms fail-closed before segment walk. Priority vs .. :
  # not-relative wins, because this check runs first. A path that is both
  # rooted/~ /drive-letter AND contains .. is first a non-repo-relative input.
  # The tilde arm covers every home-directory form -- bare ~, ~/… and POSIX
  # ~user/… -- but not a leading ~ that is merely part of a file name in the
  # repo root (Office lock files ~$x.docx). The discriminator is the slash:
  # ~<anything>/ is a home reference, ~<anything> with no slash is a name.
  # Swallowing the latter would exit 3 a whole evidence list over one stray
  # temp file; letting ~user/ through would classify a home path as relative.
  if ($normalized.StartsWith('/') -or
      $normalized -match '^~($|[^/]*/)' -or
      $normalized -match '^[A-Za-z]:' -or
      [IO.Path]::IsPathRooted($trimmed)) {
    throw "policy-path-not-relative: $Path"
  }
  $kept = [Collections.Generic.List[string]]::new()
  foreach ($part in $normalized.Split('/', [StringSplitOptions]::None)) {
    if ($part -eq '.') { continue }
    if ($part -eq '..') { throw "policy-path-dotdot: $Path" }
    $kept.Add($part)
  }
  if ($kept.Count -eq 0) { throw 'policy-path-empty' }
  ($kept -join '/').ToLowerInvariant()
}

function Test-RelayPolicyUnderRoot([string]$Path, [string]$Root) {
  if ([string]::IsNullOrWhiteSpace($Path)) { return $false }
  if ([string]::IsNullOrWhiteSpace($Root)) { return $false }
  $normalized = Get-RelayPolicyPath $Path
  $rootNorm = Get-RelayPolicyPath $Root
  if (-not $rootNorm.EndsWith('/')) { $rootNorm = $rootNorm + '/' }
  if ([string]::Equals($normalized.TrimEnd('/'), $rootNorm.TrimEnd('/'), [StringComparison]::OrdinalIgnoreCase)) {
    return $true
  }
  $normalized.StartsWith($rootNorm, [StringComparison]::OrdinalIgnoreCase)
}

function Get-RelayDevIsolationVerdict([string[]]$ChangedPaths, [hashtable]$Policy) {
  $violations = [Collections.Generic.List[object]]::new()
  $prodExt = @('.ps1', '.mjs', '.js', '.psd1')
  foreach ($raw in @($ChangedPaths)) {
    if ([string]::IsNullOrWhiteSpace($raw)) {
      $violations.Add(@{ path = [string]$raw; reason = 'dev-isolation-violation:unclassified-path' })
      continue
    }
    $hitForbidden = $false
    foreach ($root in @($Policy.forbidden_roots)) {
      if (-not [string]::IsNullOrWhiteSpace($root) -and (Test-RelayPolicyUnderRoot $raw $root)) {
        $hitForbidden = $true
        break
      }
    }
    if ($hitForbidden) {
      $violations.Add(@{ path = $raw; reason = 'dev-isolation-violation:forbidden-root' })
      continue
    }
    $inProd = -not [string]::IsNullOrWhiteSpace($Policy.production_root) -and (Test-RelayPolicyUnderRoot $raw $Policy.production_root)
    $inDoc = $false
    foreach ($root in @($Policy.doc_roots)) {
      if (-not [string]::IsNullOrWhiteSpace($root) -and (Test-RelayPolicyUnderRoot $raw $root)) {
        $inDoc = $true
        break
      }
    }
    if ($inProd -or $inDoc) { continue }
    $norm = Get-RelayPolicyPath $raw
    $isProdFile = $false
    foreach ($ext in $prodExt) {
      if ($norm.EndsWith($ext, [StringComparison]::OrdinalIgnoreCase)) { $isProdFile = $true; break }
    }
    if ($isProdFile) {
      $violations.Add(@{ path = $raw; reason = 'dev-isolation-violation:production-outside-relay' })
      continue
    }
    $violations.Add(@{ path = $raw; reason = 'dev-isolation-violation:unclassified-path' })
  }
  if ($violations.Count -eq 0) {
    $ok = New-RelayValidationOk
    $ok.violations = @()
    return $ok
  }
  $hasForbidden = $false
  $hasOutside = $false
  foreach ($item in $violations) {
    if ($item.reason -eq 'dev-isolation-violation:forbidden-root') { $hasForbidden = $true }
    if ($item.reason -eq 'dev-isolation-violation:production-outside-relay') { $hasOutside = $true }
  }
  if ($hasForbidden) {
    $result = New-RelayValidationError 'dev-isolation-violation:forbidden-root'
    $result.violations = @($violations.ToArray())
    return $result
  }
  if ($hasOutside) {
    $result = New-RelayValidationError 'dev-isolation-violation:production-outside-relay'
    $result.violations = @($violations.ToArray())
    return $result
  }
  $result = New-RelayValidationError 'dev-isolation-violation:unclassified-path'
  $result.violations = @($violations.ToArray())
  return $result
}

function Get-RelayContentAllowSet([hashtable]$Snapshot) {
  if ($null -eq $Snapshot -or -not $Snapshot.ContainsKey('cards') -or $null -eq $Snapshot.cards) {
    throw 'policy-snapshot-missing-cards'
  }
  $set = [Collections.Generic.HashSet[string]]::new([StringComparer]::OrdinalIgnoreCase)
  foreach ($fixed in @('.dh-relay/', 'docs/relay/')) {
    [void]$set.Add((Get-RelayPolicyPath $fixed))
  }
  foreach ($card in @($Snapshot.cards)) {
    if ($card -isnot [System.Collections.IDictionary]) { throw 'policy-snapshot-bad-card' }
    $slug = $card['module_slug']
    $scopes = $card['change_scopes']
    if ([string]::IsNullOrWhiteSpace([string]$slug)) { throw 'policy-snapshot-missing-module-slug' }
    if ($null -eq $scopes) { throw 'policy-snapshot-missing-change-scopes' }
    foreach ($scope in @($scopes)) {
      [void]$set.Add((Get-RelayPolicyPath ([string]$scope)))
    }
    foreach ($tail in @('dev_plan/', 'workspace/', 'knowledge/', 'as-built/')) {
      [void]$set.Add((Get-RelayPolicyPath ("docs/modules/$slug/$tail")))
    }
  }
  @($set | Sort-Object)
}

function Test-RelayPolicyPathInAllowSet([string]$Path, [string[]]$AllowSet) {
  if ([string]::IsNullOrWhiteSpace($Path)) { return $false }
  $norm = Get-RelayPolicyPath $Path
  foreach ($entry in @($AllowSet)) {
    if ([string]::IsNullOrWhiteSpace($entry)) { continue }
    if ($entry.EndsWith('/')) {
      if (Test-RelayPolicyUnderRoot $norm $entry) { return $true }
    } elseif ([string]::Equals($norm, $entry, [StringComparison]::OrdinalIgnoreCase)) {
      return $true
    }
  }
  $false
}

function Get-RelayContentPolicyVerdict([string[]]$WrittenPaths, [hashtable]$Snapshot) {
  if ($null -eq $Snapshot) {
    $result = New-RelayValidationError 'content-policy-violation:missing-authority'
    $result.violations = @()
    return $result
  }
  $allow = Get-RelayContentAllowSet $Snapshot
  $violations = [Collections.Generic.List[object]]::new()
  foreach ($raw in @($WrittenPaths)) {
    if ([string]::IsNullOrWhiteSpace($raw) -or -not (Test-RelayPolicyPathInAllowSet $raw $allow)) {
      $violations.Add(@{ path = [string]$raw; reason = 'content-policy-violation:outside-allow-set' })
    }
  }
  if ($violations.Count -eq 0) {
    $ok = New-RelayValidationOk
    $ok.violations = @()
    return $ok
  }
  $result = New-RelayValidationError 'content-policy-violation:outside-allow-set'
  $result.violations = @($violations.ToArray())
  return $result
}

function Get-RelayPolicyPathSegments([string]$Path) {
  if ([string]::IsNullOrWhiteSpace($Path)) { return @() }
  @(Get-RelayPolicyPath $Path).Split('/', [StringSplitOptions]::RemoveEmptyEntries)
}

function Test-RelayPolicyModuleRelayFolder([string]$Path) {
  if ([string]::IsNullOrWhiteSpace($Path)) { return $false }
  $parts = Get-RelayPolicyPathSegments $Path
  if ($parts.Count -lt 4) { return $false }
  if ($parts[0] -ne 'docs' -or $parts[1] -ne 'modules') { return $false }
  if ([string]::IsNullOrWhiteSpace($parts[2])) { return $false }
  $parts[3] -eq 'relay'
}

function Test-RelayPolicyWorkspaceRelayFolder([string]$Path) {
  if ([string]::IsNullOrWhiteSpace($Path)) { return $false }
  $parts = Get-RelayPolicyPathSegments $Path
  if ($parts.Count -lt 6) { return $false }
  if ($parts[0] -ne 'docs' -or $parts[1] -ne 'modules') { return $false }
  if ([string]::IsNullOrWhiteSpace($parts[2]) -or $parts[3] -ne 'workspace') { return $false }
  if ([string]::IsNullOrWhiteSpace($parts[4])) { return $false }
  $parts[5] -eq 'relay'
}

function Get-RelayLandingVerdict([string[]]$AfterPaths, [string[]]$BeforePaths, [scriptblock]$MarkerProbe) {
  $beforeSet = [Collections.Generic.HashSet[string]]::new([StringComparer]::OrdinalIgnoreCase)
  foreach ($p in @($BeforePaths)) {
    if (-not [string]::IsNullOrWhiteSpace($p)) { [void]$beforeSet.Add((Get-RelayPolicyPath $p)) }
  }
  $violations = [Collections.Generic.List[object]]::new()
  foreach ($raw in @($AfterPaths)) {
    if ([string]::IsNullOrWhiteSpace($raw)) { continue }
    $norm = Get-RelayPolicyPath $raw
    if ($beforeSet.Contains($norm)) { continue }
    if (Test-RelayPolicyUnderRoot $raw '.dh-runtime/') {
      $violations.Add(@{ path = $raw; reason = 'landing-violation:legacy-root-write' })
      continue
    }
    $isModule = Test-RelayPolicyModuleRelayFolder $raw
    $isWorkspace = Test-RelayPolicyWorkspaceRelayFolder $raw
    if (-not $isModule -and -not $isWorkspace) { continue }
    if ($null -eq $MarkerProbe) {
      $violations.Add(@{ path = $raw; reason = 'landing-violation:marker-unprobed' })
      continue
    }
    $marked = [bool](& $MarkerProbe $raw)
    if (-not $marked) { continue }
    if ($isModule) {
      $violations.Add(@{ path = $raw; reason = 'landing-violation:module-relay-folder' })
    } else {
      $violations.Add(@{ path = $raw; reason = 'landing-violation:workspace-relay-folder' })
    }
  }
  if ($violations.Count -eq 0) {
    $ok = New-RelayValidationOk
    $ok.violations = @()
    return $ok
  }
  $hasLegacy = $false
  $hasModule = $false
  $hasWorkspace = $false
  foreach ($item in $violations) {
    if ($item.reason -eq 'landing-violation:legacy-root-write') { $hasLegacy = $true }
    if ($item.reason -eq 'landing-violation:module-relay-folder') { $hasModule = $true }
    if ($item.reason -eq 'landing-violation:workspace-relay-folder') { $hasWorkspace = $true }
  }
  if ($hasLegacy) {
    $result = New-RelayValidationError 'landing-violation:legacy-root-write'
    $result.violations = @($violations.ToArray())
    return $result
  }
  if ($hasModule) {
    $result = New-RelayValidationError 'landing-violation:module-relay-folder'
    $result.violations = @($violations.ToArray())
    return $result
  }
  if ($hasWorkspace) {
    $result = New-RelayValidationError 'landing-violation:workspace-relay-folder'
    $result.violations = @($violations.ToArray())
    return $result
  }
  $result = New-RelayValidationError 'landing-violation:marker-unprobed'
  $result.violations = @($violations.ToArray())
  return $result
}

function Get-RelaySideEffectLedger([hashtable[]]$Observations) {
  $content = [Collections.Generic.List[object]]::new()
  $git = [Collections.Generic.List[object]]::new()
  $userLevel = [Collections.Generic.List[object]]::new()
  $cli = [Collections.Generic.List[object]]::new()
  $psmux = [Collections.Generic.List[object]]::new()
  $unknown = [Collections.Generic.List[object]]::new()
  foreach ($obs in @($Observations)) {
    if ($null -eq $obs) { continue }
    $category = [string]$obs['category']
    switch ($category) {
      'content' { $content.Add($obs) }
      'git' { $git.Add($obs) }
      'user-level' { $userLevel.Add($obs) }
      'cli' { $cli.Add($obs) }
      'psmux' { $psmux.Add($obs) }
      default { $unknown.Add($obs) }
    }
  }
  $ledger = @{
    content = $content.ToArray()
    git = $git.ToArray()
    user_level = $userLevel.ToArray()
    cli = $cli.ToArray()
    psmux = $psmux.ToArray()
    ok = $true
  }
  if ($unknown.Count -gt 0) {
    $ledger.ok = $false
    $ledger.reason = 'side-effect-unclassified'
    $ledger.violations = $unknown.ToArray()
  }
  $ledger
}
