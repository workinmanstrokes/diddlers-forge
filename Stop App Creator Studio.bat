@echo off
curl -s -X POST -m 3 http://localhost:4848/api/shutdown >nul 2>nul
if errorlevel 1 (echo   The studio was not running.) else (echo   Studio stopped.)
timeout /t 2 /nobreak >nul
