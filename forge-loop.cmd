@echo off
rem Runs the studio and restarts it after an update. Keep this file tiny: Windows reads .cmd files while they run.
set FORGE_LAUNCHER=1
:loop
node server.js %*
if %errorlevel%==75 goto loop
