@echo off
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0switch-db.ps1" %*
