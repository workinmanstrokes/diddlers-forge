@echo off
curl -s -X POST -m 3 http://localhost:4848/api/shutdown >nul 2>nul
if errorlevel 1 (echo   Diddler's Forge was not running.) else (echo   Diddler's Forge stopped.)
timeout /t 2 /nobreak >nul
