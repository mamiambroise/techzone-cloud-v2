param([ValidateSet('start','stop','restart','status','test')][string]$Action = 'status', [ValidateSet('local','remote')][string]$Mode = $(if ($env:APP_ENV) { $env:APP_ENV } else { 'local' }))
$ErrorActionPreference = 'Stop'
$projectRoot = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../..'))
$runtimeRoot = Join-Path $projectRoot '.runtime'
$node = (Get-Command node -ErrorAction Stop).Source
$env:APP_ENV = $Mode
New-Item -ItemType Directory -Force -Path $runtimeRoot | Out-Null

function Port-Open([int]$Port) {
    $client = New-Object Net.Sockets.TcpClient
    try { return ($client.ConnectAsync('127.0.0.1', $Port).Wait(300) -and $client.Connected) } catch { return $false } finally { $client.Dispose() }
}
function Http-Status([string]$Url) {
    try { return [int](Invoke-WebRequest -UseBasicParsing -Uri $Url -TimeoutSec 10).StatusCode } catch { if ($_.Exception.Response) { return [int]$_.Exception.Response.StatusCode }; return 0 }
}
function Owned-Process([string]$Name) {
    $file = Join-Path $runtimeRoot "$Name.pid"
    if (!(Test-Path -LiteralPath $file)) { return $null }
    $record = Get-Content -Raw -LiteralPath $file | ConvertFrom-Json
    $proc = Get-CimInstance Win32_Process -Filter "ProcessId = $($record.pid)"
    if (!$proc) { return $null }
    if ($proc.ExecutablePath -ne $record.executable -or $proc.CreationDate.ToUniversalTime().ToString('o') -ne $record.created -or $proc.CommandLine -ne $record.commandLine) { throw "PID_IDENTITY_MISMATCH: $Name; process left untouched" }
    return $proc
}
function Start-ServiceProcess([string]$Name, [string]$Entry, [string]$Arguments, [int]$Port, [string]$WorkingDirectory) {
    $owned = Owned-Process $Name
    if ($owned) {
        $record = Get-Content -Raw (Join-Path $runtimeRoot "$Name.pid") | ConvertFrom-Json
        if ($record.mode -ne $Mode) { throw 'MODE_MISMATCH: use windows:restart with the desired profile' }
        return
    }
    if (Port-Open $Port) { throw "PORT_IN_USE: $Port; unowned process left untouched" }
    if (!(Test-Path -LiteralPath $Entry)) { throw "BUILD_OR_DEPENDENCIES_MISSING: $Name" }
    $proc = Start-Process -FilePath $node -ArgumentList ('"' + $Entry + '" ' + $Arguments) -WorkingDirectory $WorkingDirectory -WindowStyle Hidden -PassThru -RedirectStandardOutput (Join-Path $runtimeRoot "$Name.out.log") -RedirectStandardError (Join-Path $runtimeRoot "$Name.err.log")
    $identity = Get-CimInstance Win32_Process -Filter "ProcessId = $($proc.Id)"
    if (!$identity) { throw "PROCESS_EXITED: $Name" }
    @{ pid=$proc.Id; executable=$identity.ExecutablePath; created=$identity.CreationDate.ToUniversalTime().ToString('o'); commandLine=$identity.CommandLine; mode=$Mode } | ConvertTo-Json | Set-Content -Encoding UTF8 (Join-Path $runtimeRoot "$Name.pid")
}
function Wait-Http([string]$Url) {
    $deadline = (Get-Date).AddSeconds(60)
    do { if ((Http-Status $Url) -eq 200) { return }; Start-Sleep -Milliseconds 600 } while ((Get-Date) -lt $deadline)
    throw "READINESS_FAILED: $Url"
}
function Stop-Techzone {
    foreach ($name in @('frontend','backend')) {
        $owned = Owned-Process $name
        if ($owned) { Stop-Process -Id $owned.ProcessId; Wait-Process -Id $owned.ProcessId -Timeout 15 -ErrorAction SilentlyContinue }
        $file = Join-Path $runtimeRoot "$name.pid"
        if (Test-Path -LiteralPath $file) { Remove-Item -LiteralPath $file }
    }
    $deadline = (Get-Date).AddSeconds(15)
    while (((Port-Open 3000) -or (Port-Open 3003)) -and (Get-Date) -lt $deadline) { Start-Sleep -Milliseconds 300 }
    if ((Port-Open 3000) -or (Port-Open 3003)) { throw 'PORT_IN_USE: another process is listening; left untouched' }
    Write-Output "TECHZONE CLOUD STOP`n========================`nFrontend : STOPPED`nBackend  : STOPPED`n========================"
}
function Status-Techzone {
    Write-Output "TECHZONE CLOUD STATUS`n================================"
    foreach ($name in @('frontend','backend')) {
        $owned = Owned-Process $name
        $port = if ($name -eq 'frontend') { 3000 } else { 3003 }
        Write-Output "$name`nProcess = $(if ($owned) { $owned.ProcessId } else { 'NOT_OWNED_OR_STOPPED' })`nPort = $port $(Port-Open $port)"
    }
    Write-Output "Frontend HTTP = $(Http-Status 'http://localhost:3000')`nBackend Health = $(Http-Status 'http://localhost:3003/health')`nBackend Ready = $(Http-Status 'http://localhost:3003/ready')"
    & $node (Join-Path $PSScriptRoot 'database.cjs')
    Write-Output "Authentication endpoint = $(Http-Status 'http://localhost:3003/api/iam/auth/me') (401 expected without session)`nMode = $Mode`n================================"
}
function Start-Techzone {
    # Validate the selected profile before starting any service. Never fall back to another DB.
    & $node -e "require('./scripts/windows/environment.cjs').environment(); console.log('ENVIRONMENT_VALID')"
    if ($LASTEXITCODE -ne 0) { throw 'CONFIG_MISSING' }
    if (!(Test-Path -LiteralPath (Join-Path $projectRoot 'backend/dist/main.js'))) { throw 'BUILD_MISSING: run npm --prefix backend run build before starting' }
    if ($Mode -eq 'local') {
        $managed = & $node -e "const e=require('./scripts/windows/environment.cjs').environment(); const u=new URL(e.DATABASE_URL); console.log(['localhost','127.0.0.1'].includes(u.hostname)&&u.port==='55432'?'yes':'no')"
        if ($managed -eq 'yes') {
            & powershell.exe -NoProfile -ExecutionPolicy Bypass -File (Join-Path $projectRoot 'scripts/local-postgres.ps1') start
            if ($LASTEXITCODE -ne 0) { throw 'DATABASE_UNAVAILABLE' }
        }
    }
    & $node (Join-Path $PSScriptRoot 'database.cjs')
    if ($LASTEXITCODE -ne 0) { throw 'DATABASE_CHECK_FAILED' }
    Start-ServiceProcess 'backend' (Join-Path $PSScriptRoot 'backend.cjs') '' 3003 (Join-Path $projectRoot 'backend')
    Wait-Http 'http://localhost:3003/health'
    Wait-Http 'http://localhost:3003/ready'
    Start-ServiceProcess 'frontend' (Join-Path $projectRoot 'frontend/node_modules/vite/bin/vite.js') '--mode dev --host 127.0.0.1 --port 3000 --strictPort' 3000 (Join-Path $projectRoot 'frontend')
    Wait-Http 'http://localhost:3000'
    Status-Techzone
    $passwordStatus = & $node -e "console.log(require('./scripts/windows/environment.cjs').environment().TEST_USER_PASSWORD ? 'CONFIGURED' : 'MISSING')"
    Write-Output "TECHZONE CLOUD READY`nFrontend: http://localhost:3000`nLogin: http://localhost:3000/login`nBackend: http://localhost:3003`nHealth: http://localhost:3003/health`nReady: http://localhost:3003/ready`nTest account: techzonetest`nPassword: $passwordStatus (run windows:test to validate)`nTenant: Techzone Test / techzone-test`nCommands: npm run windows:start | windows:status | windows:test | windows:restart | windows:stop`nMode: $Mode`nRUNTIME_STATUS = READY`nE2E_STATUS = NOT_RUN_BY_START`nNEXT_PHASE = STOP_AFTER_P0_5"
}
Push-Location $projectRoot
try {
    switch ($Action) {
        'start' { Start-Techzone }
        'stop' { Stop-Techzone }
        'restart' { Stop-Techzone; Start-Techzone }
        'status' { Status-Techzone }
        'test' { & $node (Join-Path $PSScriptRoot 'test.cjs'); if ($LASTEXITCODE -ne 0) { throw 'RUNTIME_TEST_FAILED' } }
    }
} catch { Write-Error $_.Exception.Message; exit 1 } finally { Pop-Location }
