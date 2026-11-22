@echo off
setlocal
cd /d "%~dp0"
echo.
echo   A PIN protects the studio on Wi-Fi and lets your phone use the terminal.
set /p STUDIO_PIN=  Choose a PIN (numbers are easiest): 
if "%STUDIO_PIN%"=="" exit /b 1
curl -s -X POST -m 3 http://localhost:4848/api/shutdown >nul 2>nul
timeout /t 1 /nobreak >nul
call "Start App Creator Studio.bat" --pin %STUDIO_PIN%
