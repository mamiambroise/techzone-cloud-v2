param([int]$CallerPid = 0, [switch]$RegisterLauncher)
$ErrorActionPreference = 'Stop'
$projectRoot = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../..'))
if ($RegisterLauncher) {
    $launcher = Get-CimInstance Win32_Process -Filter "ProcessId = $CallerPid"
    if (!$launcher) { throw 'LAUNCHER_NOT_FOUND' }
    $runtimeRoot = Join-Path $projectRoot '.runtime'
    New-Item -ItemType Directory -Force -Path $runtimeRoot | Out-Null
    @{ pid=$CallerPid; executable=$launcher.ExecutablePath; created=$launcher.CreationDate.ToUniversalTime().ToString('o'); commandLine=$launcher.CommandLine } |
        ConvertTo-Json | Set-Content -Encoding UTF8 (Join-Path $runtimeRoot 'dev-launcher.pid')
    exit 0
}

# Match executable entrypoints, never an arbitrary process merely using our port.
function Is-ProjectProcess($proc) {
    if ($proc.Name -notin @('node.exe', 'php.exe')) { return $false }
    $command = ([string]$proc.CommandLine).Replace('/', '\').ToLowerInvariant()
    foreach ($entry in @('scripts\dev-all.mjs', 'scripts\dev.mjs', 'scripts\windows\backend.cjs', 'frontend\node_modules\vite\bin\vite.js', 'backend\dist\main.js', 'techzone\htdocs')) {
        $absolute = (Join-Path $projectRoot $entry).ToLowerInvariant()
        if ($command -match ('(?:^|[\s"''])' + [regex]::Escape($absolute) + '(?:$|[\s"''])')) { return $true }
    }
    return $false
}
function Same-Process($before, $after) {
    return $after -and $before.CreationDate -eq $after.CreationDate -and $before.CommandLine -eq $after.CommandLine -and $before.ExecutablePath -eq $after.ExecutablePath
}

$snapshot = @(Get-CimInstance Win32_Process)
$targets = @{}
foreach ($proc in $snapshot) {
    if (Is-ProjectProcess $proc) { $targets[[int]$proc.ProcessId] = $proc }
}
# Older npm launchers use relative paths. A project-specific child proves ownership
# of its launcher; a numeric PID file alone does not (Windows reuses PIDs).
foreach ($proc in @($targets.Values)) {
    $parent = $snapshot | Where-Object { $_.ProcessId -eq $proc.ParentProcessId } | Select-Object -First 1
    if ($parent -and $parent.Name -eq 'node.exe' -and $parent.CreationDate -le $proc.CreationDate -and $parent.CommandLine -match '(?i)(?:^|[\s"''])scripts[/\\]dev(?:-all)?\.mjs(?:[\s"'']|$)') {
        $targets[[int]$parent.ProcessId] = $parent
    }
}
# Also accept the identity-checked records from the Windows runtime.
foreach ($name in @('frontend', 'backend', 'dev-launcher')) {
    $file = Join-Path $projectRoot ".runtime/$name.pid"
    if (Test-Path -LiteralPath $file) {
        try {
            $record = Get-Content -Raw -LiteralPath $file | ConvertFrom-Json
            $proc = $snapshot | Where-Object { $_.ProcessId -eq $record.pid } | Select-Object -First 1
            if ($proc -and $proc.ExecutablePath -eq $record.executable -and $proc.CommandLine -eq $record.commandLine -and $proc.CreationDate.ToUniversalTime().ToString('o') -eq $record.created) { $targets[[int]$proc.ProcessId] = $proc }
        } catch { Write-Warning "Invalid process record: $name" }
    }
}
do {
    $added = $false
    foreach ($proc in $snapshot) {
        # Console hosts can be shared with this stop command. Windows owns their
        # lifetime; terminating one can invalidate the caller's standard handles.
        if ($proc.Name -in @('conhost.exe', 'OpenConsole.exe', 'WindowsTerminal.exe')) { continue }
        $parent = $targets[[int]$proc.ParentProcessId]
        if ($parent -and $parent.CreationDate -le $proc.CreationDate -and !$targets.ContainsKey([int]$proc.ProcessId)) {
            $targets[[int]$proc.ProcessId] = $proc
            $added = $true
        }
    }
} while ($added)

# Stop supervisors first so they cannot respawn children. Exclude this command
# and its caller: Ctrl+C uses this same helper from the running launcher.
foreach ($proc in @($targets.Values | Sort-Object CreationDate)) {
    if ($proc.ProcessId -in @($PID, $CallerPid)) { continue }
    $current = Get-CimInstance Win32_Process -Filter "ProcessId = $($proc.ProcessId)"
    if (Same-Process $proc $current) {
        Stop-Process -Id $proc.ProcessId -Force -ErrorAction SilentlyContinue
        Write-Output "Stopped project process PID $($proc.ProcessId) ($($proc.Name))"
    }
}

$deadline = (Get-Date).AddSeconds(15)
do {
    # netstat covers IPv4, IPv6 and listeners bound to a non-loopback interface.
    $connections = @(netstat -ano)
    if ($LASTEXITCODE -ne 0) { throw 'PORT_CHECK_FAILED: netstat failed' }
    $listeners = @($connections | Select-String '^\s*TCP\s+\S+:(3000|3003|8080)\s+\S+\s+LISTENING\s+\d+\s*$')
    $alive = @($targets.Values | Where-Object { $_.ProcessId -notin @($PID, $CallerPid) } | ForEach-Object {
        $current = Get-CimInstance Win32_Process -Filter "ProcessId = $($_.ProcessId)"
        if (Same-Process $_ $current) { $current }
    })
    if (!$listeners.Count -and !$alive.Count) { break }
    Start-Sleep -Milliseconds 250
} while ((Get-Date) -lt $deadline)
if ($listeners.Count -or $alive.Count) {
    $listeners | ForEach-Object { Write-Output $_.Line.Trim() }
    throw 'STOP_FAILED: process still alive or port occupied by an unidentified process; no unrelated process was killed.'
}
foreach ($relative in @('logs/.dev-pids.json', '.runtime/frontend.pid', '.runtime/backend.pid', '.runtime/dev-launcher.pid')) {
    $file = Join-Path $projectRoot $relative
    if (Test-Path -LiteralPath $file) { Remove-Item -LiteralPath $file }
}
Write-Output 'Project stopped. Ports 3000, 3003 and 8080 are free.'
