@echo off
setlocal
title Techzone Cloud
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\start-windows.ps1" %*
if errorlevel 1 (
  echo.
  echo Le lancement a echoue. Consultez les messages ci-dessus.
  pause
  exit /b 1
)
endlocal
