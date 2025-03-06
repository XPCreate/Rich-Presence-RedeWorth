@echo off
setlocal enabledelayedexpansion

echo Verificando se o Node.js está instalado...

:: Verifica se o Node.js está instalado
node -v >nul 2>&1
if %errorlevel% neq 0 (
    echo Node.js nao encontrado. Iniciando instalacao...
    goto instalar
)

:: Obtém a versão do Node.js instalada
for /f "delims=" %%v in ('node -v') do set NODE_VERSION=%%v
set NODE_VERSION=%NODE_VERSION:~1%

:: Separa a versão em major.minor.patch
for /f "tokens=1-3 delims=." %%a in ("%NODE_VERSION%") do (
    set MAJOR=%%a
    set MINOR=%%b
    set PATCH=%%c
)

echo Versao instalada: %NODE_VERSION%

:: Compara a versão com 20.8.0
if %MAJOR% LSS 20 (
    echo Versao muito antiga. Atualizando...
    goto instalar
)
if %MAJOR% EQU 20 if %MINOR% LSS 8 (
    echo Versao desatualizada. Atualizando...
    goto instalar
)

echo Node.js esta atualizado para a versao correta (%NODE_VERSION%).
echo Iniciando run.vbs...
start "" /B "%~dp0\run.vbs" >nul 2>&1
exit /b

:instalar
echo Baixando instalador do Node.js...
powershell -Command "Invoke-WebRequest -Uri 'https://nodejs.org/dist/v20.8.0/node-v20.8.0-x64.msi' -OutFile '%TEMP%\node-v20.8.0-x64.msi'"

if exist "%TEMP%\node-v20.8.0-x64.msi" (
    echo Instalador baixado com sucesso.
    echo Abra o instalador e conclua a instalacao.
    start "" "%TEMP%\node-v20.8.0-x64.msi"
    echo Depois de concluir a instalacao, pressione qualquer tecla para continuar.
    pause
    echo Tentando iniciar run.vbs...
    start "" /B "%~dp0\run.vbs" >nul 2>&1
) else (
    echo Falha ao baixar o instalador do Node.js.
    pause
    exit /b
)