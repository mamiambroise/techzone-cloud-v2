[CmdletBinding()]
param()

$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$checks = [ordered]@{
    'Node installé' = [bool](Get-Command node -ErrorAction SilentlyContinue)
    'npm installé' = [bool](Get-Command npm -ErrorAction SilentlyContinue)
    'Frontend/node_modules présent' = Test-Path -LiteralPath (Join-Path $projectRoot 'Frontend/node_modules') -PathType Container
    'Backend/node_modules présent' = Test-Path -LiteralPath (Join-Path $projectRoot 'Backend/node_modules') -PathType Container
    'Backend/.env présent' = Test-Path -LiteralPath (Join-Path $projectRoot 'Backend/.env') -PathType Leaf
    'Port 3000 disponible' = -not [bool](Get-NetTCPConnection -State Listen -LocalPort 3000 -ErrorAction SilentlyContinue)
    'Port 3002 disponible' = -not [bool](Get-NetTCPConnection -State Listen -LocalPort 3002 -ErrorAction SilentlyContinue)
    'PostgreSQL 127.0.0.1:5433 accessible' = (Test-NetConnection -ComputerName '127.0.0.1' -Port 5433 -InformationLevel Quiet)
}

$checks.GetEnumerator() | ForEach-Object {
    $label = if ($_.Value) { 'OK' } else { 'ECHEC' }
    $color = if ($_.Value) { 'Green' } else { 'Red' }
    Write-Host ("[{0}] {1}" -f $label, $_.Key) -ForegroundColor $color
}

if ($checks.Values -contains $false) { exit 1 }
