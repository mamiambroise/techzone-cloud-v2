param([ValidateSet('start', 'stop', 'status')][string]$Action = 'start')

$ErrorActionPreference = 'Stop'
$localDbRoot = Join-Path $env:LOCALAPPDATA 'TechzoneLocalPostgres'
$pgCtl = 'C:\Program Files\PostgreSQL\18\bin\pg_ctl.exe'
$dataDirectory = Join-Path $localDbRoot 'data'
if (!(Test-Path -LiteralPath $dataDirectory)) {
    throw "Local PostgreSQL cluster not found: $dataDirectory"
}
if ($Action -eq 'start') {
    & $pgCtl -D $dataDirectory status *> $null
    if ($LASTEXITCODE -eq 0) { Write-Output 'Local PostgreSQL is already running on port 55432.'; exit 0 }
    & $pgCtl -D $dataDirectory -l (Join-Path $localDbRoot 'postgres.log') -w start
} elseif ($Action -eq 'stop') {
    & $pgCtl -D $dataDirectory -m fast -w stop
} else {
    & $pgCtl -D $dataDirectory status
}
exit $LASTEXITCODE
