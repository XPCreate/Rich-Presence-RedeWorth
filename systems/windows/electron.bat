@echo off
cd /d "%~dp0"

call npm install
call npm install electron --save-dev
call npm install electron-updater

start /B "" npm run start
exit