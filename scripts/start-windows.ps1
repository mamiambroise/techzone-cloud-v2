param([switch]$NoBrowser)
& powershell.exe -NoProfile -ExecutionPolicy Bypass -File (Join-Path $PSScriptRoot 'windows/runtime.ps1') start
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
if (!$NoBrowser) { Start-Process 'http://localhost:3000' }
