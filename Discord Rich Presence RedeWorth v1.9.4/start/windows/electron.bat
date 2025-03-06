@echo off
cd /d "%~dp0"
call npm install
call npm install electron --save-dev

:: Inicia o Electron sem exibir o terminal
start /B "" npm run start
exit