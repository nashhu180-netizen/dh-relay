$ErrorActionPreference='Stop'
[Console]::OutputEncoding=[Text.Encoding]::UTF8
$PSNativeCommandUseErrorActionPreference=$false
$python=(Get-Command python -CommandType Application -ErrorAction SilentlyContinue|Select-Object -First 1).Source
if(-not $python){$python=(Get-Command python3 -CommandType Application -ErrorAction SilentlyContinue|Select-Object -First 1).Source}
if(-not $python){Write-Host 'SUITE SKIP relay-light-log (python/python3 missing)';exit 0}
$env:PYTHONUTF8='1'
$env:PYTHONIOENCODING='utf-8'
$repo=(Resolve-Path(Join-Path $PSScriptRoot '..' '..')).Path
& $python -m unittest (Join-Path $repo 'tools/relay-light/test_relay_log.py') -v
if($LASTEXITCODE -ne 0){exit $LASTEXITCODE}
& $python -m unittest (Join-Path $repo 'tools/relay-light/test_install_skill.py') -v
if($LASTEXITCODE -ne 0){exit $LASTEXITCODE}
exit 0
