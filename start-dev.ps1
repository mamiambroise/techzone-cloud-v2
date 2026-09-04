[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$backendPath = Join-Path $projectRoot 'Backend'
$frontendPath = Join-Path $projectRoot 'Frontend'

function Assert-ProjectDirectory {
    param([string]$Path, [string]$Name)

    if (-not (Test-Path -LiteralPath $Path -PathType Container)) {
        throw "Dossier $Name introuvable : $Path"
    }
    if (-not (Test-Path -LiteralPath (Join-Path $Path 'package.json') -PathType Leaf)) {
        throw "package.json introuvable pour $Name : $Path"
    }
    if (-not (Test-Path -LiteralPath (Join-Path $Path 'node_modules') -PathType Container)) {
        throw "Les dépendances de $Name sont absentes. Exécutez 'npm install' dans $Path."
    }
}

Assert-ProjectDirectory -Path $backendPath -Name 'Backend'
Assert-ProjectDirectory -Path $frontendPath -Name 'Frontend'

$backendCommand = "Set-Location -LiteralPath '$($backendPath.Replace("'", "''"))'; npm run start:dev"
$frontendCommand = "Set-Location -LiteralPath '$($frontendPath.Replace("'", "''"))'; npm run dev"

Start-Process -FilePath 'powershell.exe' -ArgumentList @('-NoExit', '-ExecutionPolicy', 'Bypass', '-Command', $backendCommand)
Start-Process -FilePath 'powershell.exe' -ArgumentList @('-NoExit', '-ExecutionPolicy', 'Bypass', '-Command', $frontendCommand)

Write-Host ''
Write-Host 'Environnement de développement lancé :' -ForegroundColor Green
Write-Host '  Backend : http://localhost:3002'
Write-Host '  Frontend: http://localhost:3000'
Write-Host '  Swagger : http://localhost:3002/api/docs'
