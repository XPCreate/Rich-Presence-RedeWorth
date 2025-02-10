@echo off
cd /d "%~dp0"

:: Instala as dependências se necessário
call npm install

:: Executa o bot em segundo plano e sem janela
@REM echo Iniciando o bot em segundo plano...
@REM powershell -WindowStyle Hidden -Command "Start-Process cmd -ArgumentList '/c node ../../src/index.js' -NoNewWindow"

node ../../src/index.js

:: Finaliza o script principal para evitar deixar a janela aberta
exit
