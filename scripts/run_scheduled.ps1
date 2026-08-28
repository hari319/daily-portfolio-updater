<#
.SYNOPSIS
    Refreshes all portfolio data. This is the script Windows Task Scheduler runs.

.DESCRIPTION
    1. Locates the project's Python interpreter (.venv first, then PATH).
    2. Runs scheduled_run.py, which fetches every ticker, rewrites
       data\snapshot.json and bumps data\status.json so an open browser refreshes.
    3. Re-syncs the Task Scheduler triggers with config\settings.json, so a time
       changed in the web UI takes effect from the next run onwards.

.PARAMETER SkipScheduleSync
    Do not attempt to update the scheduled task triggers after the run.

.EXAMPLE
    powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\run_scheduled.ps1
#>
[CmdletBinding()]
param(
    [switch]$SkipScheduleSync
)

$ErrorActionPreference = 'Stop'

$scriptDir = Split-Path -Parent $PSCommandPath
$root      = Split-Path -Parent $scriptDir
Set-Location $root

$logDir = Join-Path $root 'logs'
New-Item -ItemType Directory -Force -Path $logDir | Out-Null
$consoleLog = Join-Path $logDir 'scheduled_run_console.log'

function Write-Log {
    param([string]$Message, [string]$Level = 'INFO')
    $line = '{0} | {1,-8}| runner | {2}' -f (Get-Date -Format 'yyyy-MM-dd HH:mm:ss'), $Level, $Message
    Write-Host $line
    Add-Content -Path $consoleLog -Value $line -Encoding utf8
}

function Resolve-PythonExe {
    $candidates = @(
        (Join-Path $root '.venv\Scripts\python.exe'),
        (Join-Path $root 'venv\Scripts\python.exe')
    )
    foreach ($candidate in $candidates) {
        if (Test-Path $candidate) { return $candidate }
    }
    $onPath = Get-Command python.exe -ErrorAction SilentlyContinue
    if ($onPath) { return $onPath.Source }
    throw 'No Python interpreter found. Create a virtual environment at .venv or add python.exe to PATH.'
}

$exitCode = 0
try {
    $python = Resolve-PythonExe
    Write-Log "Starting scheduled refresh using $python"

    # Native stderr output must not be treated as a terminating error here.
    $previousPreference = $ErrorActionPreference
    $ErrorActionPreference = 'Continue'
    & $python (Join-Path $root 'scheduled_run.py') --quiet 2>&1 |
        Tee-Object -FilePath $consoleLog -Append
    $exitCode = $LASTEXITCODE
    $ErrorActionPreference = $previousPreference

    switch ($exitCode) {
        0 { Write-Log 'Refresh completed successfully.' }
        1 { Write-Log 'Refresh completed but every ticker failed. See logs\scheduler.log.' 'ERROR' }
        default { Write-Log "Refresh failed with exit code $exitCode. See logs\scheduler.log." 'ERROR' }
    }
}
catch {
    Write-Log "Runner error: $($_.Exception.Message)" 'ERROR'
    $exitCode = 2
}

# Pop up the desktop window as a reminder (non-blocking).
if ($exitCode -eq 0) {
    try {
        $showWindow = Join-Path $root 'show_window.py'
        if (Test-Path $showWindow) {
            Write-Log 'Launching reminder window...'
            $pythonw = Join-Path (Split-Path $python) 'pythonw.exe'
            if (Test-Path $pythonw) {
                Start-Process -FilePath $pythonw -ArgumentList "`"$showWindow`""
            } else {
                Start-Process -FilePath $python -ArgumentList "`"$showWindow`""
            }
        }
    }
    catch {
        Write-Log "Could not launch reminder window: $($_.Exception.Message)" 'WARN'
    }
}

if (-not $SkipScheduleSync) {
    # Best effort: keep the task triggers aligned with the times saved in the UI.
    try {
        & (Join-Path $scriptDir 'register_task.ps1') -Sync -Quiet
    }
    catch {
        Write-Log "Could not sync scheduled task times: $($_.Exception.Message)" 'WARN'
    }
}

exit $exitCode
