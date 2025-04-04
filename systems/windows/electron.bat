@echo off
cd /d "%~dp0"

call npm install
call npm install electron --save-dev
call npm install adm-zip

start /B "" npm run start
exit