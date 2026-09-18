# -----------------------------------------------------------------------------
# BASCULER ENTRE LES DEUX MODES
#
# Ouvrir PowerShell dans C:\xampp\htdocs\techzone-erp, puis utiliser :
#
#   .\switch-db.cmd status       Afficher le mode actuellement actif
#   .\switch-db.cmd demo         Basculer vers la base de demonstration
#   .\switch-db.cmd empty        Revenir a la base vide
#
# La premiere fois seulement, preparer la base de demonstration avec :
#
#   .\switch-db.cmd init-demo
#
# Cette commande remplace uniquement "dolibarr_demo" et "documents-demo".
# Elle ne supprime jamais la base principale "dolibarr".
#
# En mode demo, la connexion est : admin / admin
# Apres une bascule, actualiser http://localhost/techzone-erp/htdocs/
# -----------------------------------------------------------------------------

[CmdletBinding()]
param(
    [Parameter(Position = 0)]
    [ValidateSet('status', 'check', 'init-demo', 'demo', 'empty', 'help')]
    [string]$Command = 'status'
)

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

$RootDir = $PSScriptRoot
$ConfFile = Join-Path $RootDir 'htdocs\conf\conf.php'
$EmptyDatabase = 'dolibarr'
$DemoDatabase = 'dolibarr_demo'
$EmptyDocuments = Join-Path $RootDir 'documents'
$DemoDocuments = Join-Path $RootDir 'documents-demo'
$MySql = 'C:\xampp\mysql\bin\mysql.exe'
$Php = 'C:\xampp\php\php.exe'
$Git = 'git.exe'
$DbHost = '127.0.0.1'
$DbPort = '3306'
$DbUser = 'root'
$DbPassword = ''

$OfficialTag = '23.0.3'
$OfficialRepository = 'https://github.com/Dolibarr/dolibarr.git'
$OfficialCheckout = Join-Path $RootDir ".dev\dolibarr-official-$OfficialTag"
$DemoSource = Join-Path $OfficialCheckout 'dev\initdemo'
$DemoSql = Join-Path $DemoSource 'mysqldump_dolibarr_23.0.0.sql'
$DemoSourceDocuments = Join-Path $DemoSource 'documents_demo'
$UpdateScriptSource = Join-Path $DemoSource 'updatedemo.php'
$ExpectedDumpSha256 = '409d91b3439b58f2b825b2c092bec5743528e1b3acb4e4a33d0d99e05f5ec4f5'

function Write-Info([string]$Message) {
    Write-Host "[dolibarr-db] $Message"
}

function Assert-Prerequisites {
    foreach ($Path in @($ConfFile, $MySql, $Php)) {
        if (-not (Test-Path -LiteralPath $Path)) {
            throw "Fichier requis introuvable : $Path"
        }
    }

    if (-not (Get-Command $Git -ErrorAction SilentlyContinue)) {
        throw 'Git est requis mais introuvable dans PATH.'
    }
}

function Get-ConfValue([string]$VariableName) {
    $Content = Get-Content -LiteralPath $ConfFile -Raw
    $Pattern = '(?m)^\$' + [regex]::Escape($VariableName) + "=(?:'([^']*)'|`"([^`"]*)`");"
    $Match = [regex]::Match($Content, $Pattern)
    if (-not $Match.Success) {
        throw "Parametre `$${VariableName} introuvable dans $ConfFile"
    }

    if ($Match.Groups[1].Success) {
        return $Match.Groups[1].Value
    }
    return $Match.Groups[2].Value
}

function Set-ConfValue([string]$VariableName, [string]$Value) {
    if ($Value.Contains("'")) {
        throw "Valeur non prise en charge pour `$${VariableName}."
    }

    $Content = Get-Content -LiteralPath $ConfFile -Raw
    $Pattern = '(?m)^\$' + [regex]::Escape($VariableName) + "=(?:'[^']*'|`"[^`"]*`");"
    $Replacement = '$' + $VariableName + "='" + ($Value -replace '\\', '/') + "';"
    if (-not [regex]::IsMatch($Content, $Pattern)) {
        throw "Impossible de trouver `$${VariableName} dans $ConfFile"
    }
    $Updated = [regex]::Replace(
        $Content,
        $Pattern,
        [System.Text.RegularExpressions.MatchEvaluator]{ param($Match) $Replacement },
        1
    )

    $Utf8WithoutBom = New-Object System.Text.UTF8Encoding($false)
    [System.IO.File]::WriteAllText($ConfFile, $Updated, $Utf8WithoutBom)
}

function Get-MySqlArguments([string[]]$ExtraArguments) {
    $Arguments = @(
        '--host', $DbHost,
        '--port', $DbPort,
        '--user', $DbUser,
        '--default-character-set=utf8mb4'
    )
    if ($DbPassword) {
        $Arguments += "--password=$DbPassword"
    }
    return $Arguments + $ExtraArguments
}

function Invoke-MySql([string]$Sql, [string]$Database = '') {
    $ExtraArguments = @('--batch', '--skip-column-names')
    if ($Database) {
        $ExtraArguments += $Database
    }
    $ExtraArguments += @('--execute', $Sql)

    & $MySql @(Get-MySqlArguments $ExtraArguments)
    if ($LASTEXITCODE -ne 0) {
        throw "La commande MySQL a echoue (code $LASTEXITCODE)."
    }
}

function Import-MySqlDump([string]$DumpPath, [string]$Database) {
    $ImportPath = $DumpPath
    $TemporaryDump = $null

    # MariaDB 10.11 ajoute une directive "sandbox mode" que le client
    # MariaDB 10.4 de XAMPP ne comprend pas. Le dump officiel est verifie par
    # SHA-256 avant cette adaptation et seule cette premiere ligne est retiree.
    $FirstLine = Get-Content -LiteralPath $DumpPath -TotalCount 1
    if ($FirstLine -eq '/*M!999999\- enable the sandbox mode */') {
        $TemporaryDump = Join-Path $RootDir '.dev\demo-xampp-compatible.sql'
        $InputStream = [System.IO.File]::OpenRead($DumpPath)
        try {
            while (($Byte = $InputStream.ReadByte()) -ne -1 -and $Byte -ne 10) {
                # Ignorer la premiere ligne.
            }
            $OutputStream = [System.IO.File]::Create($TemporaryDump)
            try {
                $InputStream.CopyTo($OutputStream)
            } finally {
                $OutputStream.Dispose()
            }
        } finally {
            $InputStream.Dispose()
        }
        $ImportPath = $TemporaryDump
    }

    $ArgumentParts = Get-MySqlArguments @($Database)
    $QuotedArguments = $ArgumentParts | ForEach-Object {
        '"' + ($_ -replace '"', '\"') + '"'
    }

    try {
        $Process = Start-Process `
            -FilePath $MySql `
            -ArgumentList ($QuotedArguments -join ' ') `
            -RedirectStandardInput $ImportPath `
            -NoNewWindow `
            -Wait `
            -PassThru

        if ($Process.ExitCode -ne 0) {
            throw "L'import MySQL a echoue (code $($Process.ExitCode))."
        }
    } finally {
        if ($TemporaryDump) {
            Remove-Item -LiteralPath $TemporaryDump -Force -ErrorAction SilentlyContinue
        }
    }
}

function Test-Database([string]$Database) {
    $Result = & $MySql @(Get-MySqlArguments @(
        '--batch',
        '--skip-column-names',
        '--execute',
        "SELECT SCHEMA_NAME FROM information_schema.SCHEMATA WHERE SCHEMA_NAME = '$Database';"
    ))
    if ($LASTEXITCODE -ne 0) {
        throw 'Impossible de contacter MySQL. Verifiez que MySQL est demarre dans XAMPP.'
    }
    return ($Result -eq $Database)
}

function Get-TableCount([string]$Database) {
    $Result = & $MySql @(Get-MySqlArguments @(
        '--batch',
        '--skip-column-names',
        '--execute',
        "SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA = '$Database';"
    ))
    if ($LASTEXITCODE -ne 0) {
        throw "Impossible de verifier la base $Database."
    }
    return [int]$Result
}

function Get-DemoSource {
    $Parent = Split-Path -Parent $OfficialCheckout
    New-Item -ItemType Directory -Path $Parent -Force | Out-Null

    if (-not (Test-Path -LiteralPath (Join-Path $OfficialCheckout '.git'))) {
        if (Test-Path -LiteralPath $OfficialCheckout) {
            throw "$OfficialCheckout existe mais n'est pas un depot Git."
        }

        Write-Info "Telechargement de la demo officielle Dolibarr $OfficialTag..."
        & $Git clone --depth 1 --branch $OfficialTag --filter=blob:none --sparse $OfficialRepository $OfficialCheckout
        if ($LASTEXITCODE -ne 0) {
            throw 'Echec du telechargement de la demo officielle.'
        }
    }

    & $Git -C $OfficialCheckout sparse-checkout set dev/initdemo
    if ($LASTEXITCODE -ne 0) {
        throw 'Echec de la preparation des fichiers de demonstration.'
    }

    foreach ($Path in @($DemoSql, $DemoSourceDocuments, $UpdateScriptSource)) {
        if (-not (Test-Path -LiteralPath $Path)) {
            throw "Fichier de demonstration absent : $Path"
        }
    }

    $ActualHash = (Get-FileHash -LiteralPath $DemoSql -Algorithm SHA256).Hash.ToLowerInvariant()
    if ($ActualHash -ne $ExpectedDumpSha256) {
        throw "Empreinte SHA-256 incorrecte pour $DemoSql"
    }

    Write-Info 'Source de demonstration telechargee et verifiee.'
}

function Assert-SafeDemoDocumentsPath {
    $ResolvedRoot = [System.IO.Path]::GetFullPath($RootDir).TrimEnd('\') + '\'
    $ResolvedDemo = [System.IO.Path]::GetFullPath($DemoDocuments).TrimEnd('\') + '\'
    if (-not $ResolvedDemo.StartsWith($ResolvedRoot, [System.StringComparison]::OrdinalIgnoreCase)) {
        throw "Chemin de documents refuse : $ResolvedDemo"
    }
    if ((Split-Path -Leaf $ResolvedDemo.TrimEnd('\')) -ne 'documents-demo') {
        throw "Nom de repertoire de demonstration refuse : $ResolvedDemo"
    }
}

function Reset-DemoDocuments {
    Assert-SafeDemoDocumentsPath
    if (Test-Path -LiteralPath $DemoDocuments) {
        Get-ChildItem -LiteralPath $DemoDocuments -Force | Remove-Item -Recurse -Force
    } else {
        New-Item -ItemType Directory -Path $DemoDocuments | Out-Null
    }

    Copy-Item -Path (Join-Path $DemoSourceDocuments '*') -Destination $DemoDocuments -Recurse -Force

    $TemplateTarget = Join-Path $DemoDocuments 'doctemplates'
    $MediaTarget = Join-Path $DemoDocuments 'medias\image'
    New-Item -ItemType Directory -Path $TemplateTarget, $MediaTarget -Force | Out-Null
    Copy-Item -Path (Join-Path $RootDir 'htdocs\install\doctemplates\*') -Destination $TemplateTarget -Recurse -Force
    Copy-Item -Path (Join-Path $RootDir 'htdocs\install\medias\*') -Destination $MediaTarget -Recurse -Force
    New-Item -ItemType File -Path (Join-Path $DemoDocuments 'install.lock') -Force | Out-Null
}

function Switch-Database([ValidateSet('empty', 'demo')][string]$Target) {
    if ($Target -eq 'empty') {
        $Database = $EmptyDatabase
        $Documents = $EmptyDocuments
    } else {
        $Database = $DemoDatabase
        $Documents = $DemoDocuments
    }

    if (-not (Test-Database $Database)) {
        if ($Target -eq 'demo') {
            throw "La base $Database n'existe pas. Lancez d'abord : .\switch-db.ps1 init-demo"
        }
        throw "La base $Database n'existe pas."
    }
    if (-not (Test-Path -LiteralPath $Documents -PathType Container)) {
        throw "Repertoire de documents absent : $Documents"
    }

    Set-ConfValue 'dolibarr_main_db_name' $Database
    Set-ConfValue 'dolibarr_main_data_root' $Documents
    Write-Info "Mode $Target active : base=$Database"
    Write-Info 'Ouvrez ou actualisez http://localhost/techzone-erp/htdocs/'
}

function Initialize-Demo {
    Get-DemoSource

    if (Test-Database $DemoDatabase) {
        $Answer = Read-Host "La base $DemoDatabase existe deja et sera remplacee. Continuer ? [o/N]"
        if ($Answer -notmatch '^(o|oui|y|yes)$') {
            Write-Info 'Operation annulee.'
            return
        }
    }

    Write-Info "Creation de la base $DemoDatabase..."
    Invoke-MySql @"
DROP DATABASE IF EXISTS ``$DemoDatabase``;
CREATE DATABASE ``$DemoDatabase`` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
"@

    Write-Info 'Import du jeu de donnees officiel...'
    Import-MySqlDump $DemoSql $DemoDatabase
    Reset-DemoDocuments

    $OriginalDatabase = Get-ConfValue 'dolibarr_main_db_name'
    $OriginalDocuments = Get-ConfValue 'dolibarr_main_data_root'
    try {
        Set-ConfValue 'dolibarr_main_db_name' $DemoDatabase
        Set-ConfValue 'dolibarr_main_data_root' $DemoDocuments

        $TemporaryUpdateDir = Join-Path $RootDir 'dev\initdemo'
        $TemporaryUpdateScript = Join-Path $TemporaryUpdateDir 'updatedemo.php'
        if (Test-Path -LiteralPath $TemporaryUpdateScript) {
            throw "Fichier temporaire deja present : $TemporaryUpdateScript"
        }

        New-Item -ItemType Directory -Path $TemporaryUpdateDir -Force | Out-Null
        Copy-Item -LiteralPath $UpdateScriptSource -Destination $TemporaryUpdateScript
        try {
            Write-Info 'Actualisation des dates de la demonstration...'
            & $Php $TemporaryUpdateScript confirm
            if ($LASTEXITCODE -ne 0) {
                throw "Le script updatedemo.php a echoue (code $LASTEXITCODE)."
            }
        } finally {
            Remove-Item -LiteralPath $TemporaryUpdateScript -Force -ErrorAction SilentlyContinue
        }

        $PasswordHash = & $Php -r "echo password_hash('admin', PASSWORD_BCRYPT);"
        if ($LASTEXITCODE -ne 0 -or -not $PasswordHash) {
            throw 'Impossible de generer le mot de passe administrateur.'
        }
        $EscapedHash = $PasswordHash -replace "'", "''"

        Invoke-MySql @"
UPDATE llx_user
SET login='admin', pass='', pass_crypted='$EscapedHash', admin=1, entity=0, statut=1
WHERE rowid=(SELECT rowid FROM (SELECT rowid FROM llx_user WHERE admin=1 ORDER BY rowid LIMIT 1) AS selected_admin);
UPDATE llx_const
SET value='$OfficialTag'
WHERE name='MAIN_VERSION_LAST_UPGRADE' AND entity=0;
"@ $DemoDatabase

        $TableCount = Get-TableCount $DemoDatabase
        if ($TableCount -lt 300) {
            throw "Import incomplet : seulement $TableCount tables trouvees."
        }
    } catch {
        Set-ConfValue 'dolibarr_main_db_name' $OriginalDatabase
        Set-ConfValue 'dolibarr_main_data_root' $OriginalDocuments
        throw
    }

    Write-Info "Demo prete ($TableCount tables) et activee."
    Write-Info 'Connexion demo : admin / admin'
    Write-Info 'Retour a la base vide : .\switch-db.ps1 empty'
}

function Show-Status {
    $Database = Get-ConfValue 'dolibarr_main_db_name'
    $Documents = Get-ConfValue 'dolibarr_main_data_root'
    $Mode = if ($Database -eq $DemoDatabase) { 'demo' } elseif ($Database -eq $EmptyDatabase) { 'empty' } else { 'inconnu' }

    Write-Host "Mode actif : $Mode"
    Write-Host "Base       : $Database"
    Write-Host "Documents  : $Documents"
    if (Test-Database $Database) {
        Write-Host "Tables     : $(Get-TableCount $Database)"
    }
}

function Show-Help {
    Write-Host @'
Usage :
  .\switch-db.ps1 status       Affiche la base active
  .\switch-db.ps1 check        Telecharge et verifie la demo officielle
  .\switch-db.ps1 init-demo    Cree/reinitialise dolibarr_demo, puis l'active
  .\switch-db.ps1 demo         Bascule vers la demo deja initialisee
  .\switch-db.ps1 empty        Revient a la base Dolibarr vide

La base "dolibarr" et ses documents ne sont jamais supprimes par ce script.
Seuls "dolibarr_demo" et "documents-demo" sont remplaces par init-demo.
'@
}

Assert-Prerequisites
switch ($Command) {
    'status' { Show-Status }
    'check' { Get-DemoSource }
    'init-demo' { Initialize-Demo }
    'demo' { Switch-Database 'demo' }
    'empty' { Switch-Database 'empty' }
    'help' { Show-Help }
}
