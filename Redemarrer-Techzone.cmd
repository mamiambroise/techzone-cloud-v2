@echo off
setlocal
title Redemarrer Techzone Cloud
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts/windows/runtime.ps1" restart %*
if errorlevel 1 (
  echo Le redemarrage a echoue. Consultez les messages ci-dessus.
  pause
  exit /b 1
)
endlocal
