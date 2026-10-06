@echo off
setlocal
title Arreter Techzone Cloud
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts/windows/runtime.ps1" stop %*
if errorlevel 1 (
  echo L'arret a echoue. Consultez les messages ci-dessus.
  pause
  exit /b 1
)
endlocal
