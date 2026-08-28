<#
.SYNOPSIS
    Creates or updates the Windows scheduled task that refreshes portfolio data.

.DESCRIPTION
    Reads the run times from config\settings.json (the same file the web UI
    writes when you change the schedule) and registers one daily trigger per
    time. Run this once after setup, and again whenever you change the times in
    the UI - or let run_scheduled.ps1 sync them automatically after each run.

.PARAMETER Sync
    Only update the task when the configured times differ from the existing
    triggers. Used by run_scheduled.ps1.

.PARAMETER Unregister
    Remove the scheduled task.

.EXAMPLE
    powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\register_task.ps1
#>
[CmdletBinding()]
param(
    [switch]$Sync,
    [switch]$Quiet,
    [switch]$Unregister,
    [string]$TaskName
)

$ErrorActionPreference = 'Stop'

$scriptDir = Split-Path -Parent $PSCommandPath
$root      = Split-Path -Parent $scriptDir
$runner    = Join-Path $scriptDir 'run_scheduled.ps1'
$settings  = Join-Path $root 'config\settings.json'

function Write-Info {
    param([string]$Message)
    if (-not $Quiet) { Write-Host $Message }
}

if (-not (Test-Path $settings)) {
    throw "Settings file not found at $settings. Start the app once (python app.py) to generate it."
}

$config = Get-Content -Path $settings -Raw -Encoding utf8 | ConvertFrom-Json

if (-not $TaskName) {
    $TaskName = $config.schedule.task_name
    if (-not $TaskName) { $TaskName = 'StockMonitor-DailyUpdate' }
}

if ($Unregister) {
    Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false -ErrorAction SilentlyContinue
    Write-Info "Removed scheduled task '$TaskName'."
    exit 0
}

$times = @($config.schedule.run_times)
if ($times.Count -eq 0) { throw 'No run_times configured in config\settings.json.' }

foreach ($time in $times) {
    if ($time -notmatch '^([01]\d|2[0-3]):[0-5]\d$') {
        throw "Invalid run time '$time' in config\settings.json. Expected 24-hour HH:mm."
    }
}

$existing = Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue

if ($Sync -and $existing) {
    $current = @($existing.Triggers | ForEach-Object {
        try { ([datetime]$_.StartBoundary).ToString('HH:mm') } catch { $null }
    } | Where-Object { $_ } | Sort-Object)
    $wanted = @($times | Sort-Object)
    if ($current.Count -gt 0 -and -not (Compare-Object -ReferenceObject $current -DifferenceObject $wanted)) {
        Write-Info "Scheduled task '$TaskName' already matches $($wanted -join ', '). Nothing to do."
        exit 0
    }
    Write-Info "Schedule changed ($($current -join ', ') -> $($wanted -join ', ')). Updating task."
}

$triggers = foreach ($time in $times) {
    $parts = $time.Split(':')
    $at = (Get-Date).Date.AddHours([int]$parts[0]).AddMinutes([int]$parts[1])
    New-ScheduledTaskTrigger -Weekly -DaysOfWeek Monday, Tuesday, Wednesday, Thursday, Friday -At $at
}

$arguments = '-NoProfile -NonInteractive -ExecutionPolicy Bypass -File "{0}"' -f $runner
$action = New-ScheduledTaskAction -Execute 'powershell.exe' -Argument $arguments -WorkingDirectory $root

$taskSettings = New-ScheduledTaskSettingsSet `
    -StartWhenAvailable `
    -AllowStartIfOnBatteries `
    -DontStopIfGoingOnBatteries `
    -MultipleInstances IgnoreNew `
    -ExecutionTimeLimit (New-TimeSpan -Minutes 30)

$principal = New-ScheduledTaskPrincipal -UserId $env:USERNAME -LogonType Interactive

if ($existing) {
    Set-ScheduledTask -TaskName $TaskName -Trigger $triggers -Action $action -Settings $taskSettings -Principal $principal | Out-Null
    Write-Info "Updated scheduled task '$TaskName' -> $($times -join ', ')."
}
else {
    Register-ScheduledTask `
        -TaskName $TaskName `
        -Trigger $triggers `
        -Action $action `
        -Settings $taskSettings `
        -Principal $principal `
        -Description 'Refreshes NSE/BSE portfolio prices and EMAs for the Portfolio EMA Monitor.' | Out-Null
    Write-Info "Registered scheduled task '$TaskName' -> $($times -join ', ')."
}
