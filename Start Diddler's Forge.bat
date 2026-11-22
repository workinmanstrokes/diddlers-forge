@echo off
setlocal
title Diddler's Forge
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo.
  echo   Node.js is needed to run Diddler's Forge. It's free.
  echo   Opening nodejs.org - install the LTS version, then double-click this again.
  echo.
  start "" https://nodejs.org/en/download
  pause
  exit /b 1
)
rem Already running? Just open it.
curl -s -o nul -m 2 http://localhost:4848/api/health
if not errorlevel 1 (
  start "" http://localhost:4848
  exit /b 0
)
start "Diddler's Forge" /min cmd /k node server.js --open %*
exit /b 0
