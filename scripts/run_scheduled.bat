@echo off
REM Convenience wrapper so the refresh can be launched by double-click or by a
REM Task Scheduler action that expects a .bat file.
setlocal
set "SCRIPT_DIR=%~dp0"
powershell.exe -NoProfile -NonInteractive -ExecutionPolicy Bypass -File "%SCRIPT_DIR%run_scheduled.ps1" %*
exit /b %ERRORLEVEL%
