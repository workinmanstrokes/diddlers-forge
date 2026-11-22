@echo off
cd /d "%~dp0"
powershell -NoProfile -ExecutionPolicy Bypass -Command "$d=[Environment]::GetFolderPath('Desktop'); $s=(New-Object -ComObject WScript.Shell).CreateShortcut($d+'\App Creator Studio.lnk'); $s.TargetPath='%~dp0Start App Creator Studio.bat'; $s.WorkingDirectory='%~dp0'; $s.IconLocation='%~dp0public\icons\studio.ico'; $s.WindowStyle=7; $s.Description='Make apps and games with your local AI'; $s.Save()"
if errorlevel 1 (echo   Could not create the shortcut.) else (echo   Done - "App Creator Studio" is on your Desktop.)
pause
