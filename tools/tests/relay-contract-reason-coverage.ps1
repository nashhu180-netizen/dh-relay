$ErrorActionPreference = 'Stop'
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

# Compound proposal rejection codes retain their literal subcode. Dynamic schema
# subcodes normalize to proposal-rejected:<dynamic> and require a real literal
# proposal-rejected subcode assertion elsewhere in the Runner tests.
function Add-NormalizedReason([Collections.Generic.HashSet[string]]$Set, [string]$Candidate) {
  $code = $Candidate.TrimEnd(':')
  if ($code -cmatch '^proposal-rejected:\$') { $code='proposal-rejected:<dynamic>' }
  elseif ($code -cmatch '^proposal-rejected:(?<sub>[a-z][a-z0-9-]*)') { $code="proposal-rejected:$($Matches.sub)" }
  elseif ($code.Contains(':')) { $code = $code.Split(':', 2)[0] }
  if ($code -cmatch '^[a-z][a-z0-9]*(?:-[a-z0-9]+)+(?:\:(?:[a-z][a-z0-9-]*|<dynamic>))?$') { [void]$Set.Add($code) }
}

function Add-QuotedKebabCodes([Collections.Generic.HashSet[string]]$Set, [string]$Text) {
  foreach ($match in [regex]::Matches($Text, '[''"](?<code>[a-z][a-z0-9]*(?:-[a-z0-9]+)+(?:\:[^''"]*)?)[''"]')) {
    Add-NormalizedReason $Set $match.Groups['code'].Value
  }
}

$nonLiteralReasonAllowlist = @(
  # New-RelayValidationError only copies its caller-supplied reason into the validation result.
  @{ File = 'relay-schema.ps1'; Line = '@{ ok = $false; reason = $Reason }' }
  # Test-RelayPositiveInteger selects both candidate literals on the preceding line before forwarding this variable.
  @{ File = 'relay-schema.ps1'; Line = 'return New-RelayValidationError $reason' }
  # New-RelayIdentityVerdict only copies its caller-supplied reason into the verdict result.
  @{ File = 'relay-identity.ps1'; Line = '@{ verdict = $Verdict; reason = $Reason }' }
  # New-RelayStaleEvent only copies its caller-supplied reason into the optional event field.
  @{ File = 'relay-identity.ps1'; Line = 'if (-not [string]::IsNullOrWhiteSpace($Reason)) { $event.reason = $Reason }' }
  # Replay trace copies the already-validated Runner result reason for deterministic diagnostics.
  @{ File = 'relay-replay.ps1'; Line = '$Context.trace.Add(@{tick=$Context.tick;action=$step.action;node=if($step.ContainsKey(''node'')){$step.node}else{''''};ok=[bool]$result.ok;reason=if($result.ContainsKey(''reason'')){$result.reason}else{''''};state_hash_before=$stateBefore;state_hash_after=$stateAfter;current_result_hash_after=$currentResultHash})' }
  # Proposal rejection helper returns the literal reason selected by its callers.
  @{ File = 'relay-runner.ps1'; Line = '@{ok=$false;reason=$Reason}' }
  # Launch failure returns the reason selected from the two literal launch failure forms above it.
  @{ File = 'relay-runner.ps1'; Line = 'return @{ok=$false;reason=$reason}' }
  # Probe pair failure forwards the frozen transition-contract reason.
  @{ File = 'relay-runner.ps1'; Line = 'if(-not $pair.ok){$node.task_state=''paused'';$node.scheduling=''paused'';$node.pause_reason=''probe-lost'';[void](Save-RelayState $Run);[void](Add-RelayEvent $Run ''observation'' $identity '''' @{probe_error=$true;consecutive_probe_failures=$node.consecutive_probe_failures;terminal_state=$node.terminal_state});[void](Add-RelayEvent $Run ''observation'' $identity $pair.reason @{terminal_state=$node.terminal_state});return @{ok=$false;reason=$pair.reason}}' }
  # Illegal observation returns the prefixed transition-contract reason built on the same line.
  @{ File = 'relay-runner.ps1'; Line = '$reason="transition-rejected:$($move.reason)";if(-not $node.final_committed){$node.task_state=''paused'';$node.scheduling=''paused'';$node.pause_reason=''illegal-terminal-transition''};[void](Save-RelayState $Run);[void](Add-RelayEvent $Run ''observation'' $identity $reason @{terminal_state=$node.terminal_state});return @{ok=$false;reason=$reason}' }
  # Result identity rejection forwards the DHR_01 identity verdict reason.
  @{ File = 'relay-runner.ps1'; Line = '[void](Add-RelayEvent $Run $kind (Get-RelayValueIdentity $value) $verdict.reason);return @{ok=$false;verdict=$verdict.verdict;reason=$verdict.reason}' }
  # Result transition rejection forwards the DHR_01 matrix reason.
  @{ File = 'relay-runner.ps1'; Line = 'return @{ok=$false;reason=$transition.reason}' }
  # Checkpoint identity rejection forwards the DHR_01 identity verdict reason.
  @{ File = 'relay-runner.ps1'; Line = 'if($verdict.verdict -cne ''accept''){[void](Add-RelayEvent $Run ''checkpoint_rejected'' (Get-RelayValueIdentity $value) $verdict.reason);return @{ok=$false;verdict=$verdict.verdict;reason=$verdict.reason}}' }
  # Checkpoint transition rejection forwards the DHR_01 matrix reason.
  @{ File = 'relay-runner.ps1'; Line = 'if(-not $transition.ok){[void](Add-RelayEvent $Run ''checkpoint_rejected'' (Get-RelayValueIdentity $value) $transition.reason);return @{ok=$false;reason=$transition.reason}}' }
)

function Test-NonLiteralReasonAllowed([string]$FileName, [string]$Line) {
  $trimmed = $Line.Trim()
  return @($nonLiteralReasonAllowlist | Where-Object { $_.File -ceq $FileName -and $_.Line -ceq $trimmed }).Count -eq 1
}

$productionReasons = [Collections.Generic.HashSet[string]]::new([StringComparer]::Ordinal)
$nonLiteralReasons = [Collections.Generic.List[string]]::new()
$productionRoots = @('../contracts','../runner','../adapters','../host')
foreach ($file in $productionRoots | ForEach-Object { $path=Join-Path $PSScriptRoot $_;if(Test-Path -LiteralPath $path){Get-ChildItem -LiteralPath $path -Filter '*.ps1' -File} }) {
  $lines = @(Get-Content -LiteralPath $file.FullName)
  for ($index = 0; $index -lt $lines.Count; $index++) {
    $line = $lines[$index]
    $reasonSites = @([regex]::Matches($line, 'New-RelayValidationError\s+(?<arg>\S+)'))
    $reasonSites += @([regex]::Matches($line, '(?<![$.\w])reason\s*=\s*(?<arg>\S+)'))
    $reasonSites += @([regex]::Matches($line, '\$\w+\.reason\s*=\s*(?<arg>\S+)'))
    foreach ($match in $reasonSites) {
      if ($match.Groups['arg'].Value -notmatch '^[''"]') {
        if (-not (Test-NonLiteralReasonAllowed $file.Name $line)) {
          $nonLiteralReasons.Add("non-literal-reason:$($file.Name):$($index + 1)")
        }
      }
    }
    if ($reasonSites.Count -gt 0 -or $line -match '(?i)verdict|reason|Add-RelayProposalRejection') {
      Add-QuotedKebabCodes $productionReasons $line
    }
  }
}

if ($nonLiteralReasons.Count -gt 0) {
  foreach ($failure in $nonLiteralReasons) { Write-Host "FAIL  $failure" }
  exit 1
}

$testReasons = [Collections.Generic.HashSet[string]]::new([StringComparer]::Ordinal)
foreach ($file in Get-ChildItem -LiteralPath $PSScriptRoot -Filter '*.ps1' -File | Where-Object { $_.Name -ne 'relay-contract-reason-coverage.ps1' }) {
  foreach ($line in Get-Content -LiteralPath $file.FullName | Where-Object { $_ -cmatch 'Assert' }) {
    Add-QuotedKebabCodes $testReasons $line
  }
}

$uncovered = @($productionReasons | Where-Object { -not $testReasons.Contains($_) } | Sort-Object)
$dynamicProposalCovered = @($testReasons | Where-Object { $_ -cmatch '^proposal-rejected:(?!<dynamic>)[a-z]' }).Count -gt 0
if ($productionReasons.Contains('proposal-rejected:<dynamic>') -and $dynamicProposalCovered) { $uncovered=@($uncovered|Where-Object{$_ -cne 'proposal-rejected:<dynamic>'}) }
if ($uncovered.Count -gt 0) {
  foreach ($reason in $uncovered) { Write-Host "FAIL  uncovered-reason: $reason" }
  exit 1
}

Write-Host "PASS  production reason codes covered: $($productionReasons.Count)"
Write-Host 'SUITE PASS'
exit 0
