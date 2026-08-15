function Invoke-RelayCapturedValueRedaction([string]$Text, [string]$Pattern, [string]$Marker) {
  $regex = [regex]::new($Pattern)
  $count = $regex.Matches($Text).Count
  if ($count -eq 0) { return @{ text=$Text; count=0 } }
  $replaced = $regex.Replace($Text, [Text.RegularExpressions.MatchEvaluator]{
    param($match)
    $value = $match.Groups[1]
    $relativeStart = $value.Index - $match.Index
    $prefix = $match.Value.Substring(0, $relativeStart)
    $suffix = $match.Value.Substring($relativeStart + $value.Length)
    $prefix + $Marker + $suffix
  })
  @{ text=$replaced; count=$count }
}

function Invoke-RelayTailSanitize([string]$Text, [int]$MaxBytes = 0) {
  if ($MaxBytes -le 0) {
    $params = Import-PowerShellDataFile (Join-Path $PSScriptRoot 'relay-params.psd1')
    $MaxBytes = $params.SessionTailMaxBytes
  }
  $hits = @()
  $current = $Text

  $apiPattern = '(?i)\b(?:api[_-]?key|apikey|x-api-key)\b\s*[:=]\s*["'']?([A-Za-z0-9_\-]{8,})["'']?'
  $api = Invoke-RelayCapturedValueRedaction $current $apiPattern '<REDACTED:api_key>'
  $current = $api.text
  $skRegex = [regex]::new('\bsk-[A-Za-z0-9_\-]{10,}\b')
  $skCount = $skRegex.Matches($current).Count
  $current = $skRegex.Replace($current, '<REDACTED:api_key>')
  if (($api.count + $skCount) -gt 0) { $hits += @{ kind='api_key'; count=($api.count + $skCount) } }

  $privateRegex = [regex]::new('(?s)-----BEGIN [A-Z ]*PRIVATE KEY-----.*?-----END [A-Z ]*PRIVATE KEY-----')
  $privateCount = $privateRegex.Matches($current).Count
  $current = $privateRegex.Replace($current, '<REDACTED:private_key>')
  if ($privateCount -gt 0) { $hits += @{ kind='private_key'; count=$privateCount } }

  $passwordPattern = '(?i)\b(?:password|passwd|pwd)\b\s*[:=]\s*["'']?([^\s"'']{4,})["'']?'
  $password = Invoke-RelayCapturedValueRedaction $current $passwordPattern '<REDACTED:password>'
  $current = $password.text
  if ($password.count -gt 0) { $hits += @{ kind='password'; count=$password.count } }

  $bytes = [Text.Encoding]::UTF8.GetBytes($current)
  if ($bytes.Length -gt $MaxBytes) {
    $start = $bytes.Length - $MaxBytes
    while ($start -lt $bytes.Length -and (($bytes[$start] -band 0xC0) -eq 0x80)) { $start++ }
    $current = [Text.Encoding]::UTF8.GetString($bytes, $start, $bytes.Length - $start)
  }
  @{ text=$current; hits=@($hits) }
}

function Test-RelayArtifactClean([string]$Text, [hashtable]$Secrets) {
  foreach ($kind in $Secrets.Keys) {
    foreach ($secret in @($Secrets[$kind])) {
      if ([string]::IsNullOrEmpty($secret)) { continue }
      if ($Text.Contains($secret)) { return @{ ok=$false; reason="secret-residue:$kind" } }
    }
  }
  @{ ok=$true }
}
