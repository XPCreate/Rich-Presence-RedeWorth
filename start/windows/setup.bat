@echo off
setlocal enabledelayedexpansion

:: Verificar se o Node.js está instalado
node -v >nul 2>&1
if %errorlevel% neq 0 (
    echo Node.js nao encontrado. Baixando e instalando...
    
    :: Baixando o instalador do Node.js
    echo Baixando instalador do Node.js...
    powershell -Command "Invoke-WebRequest -Uri 'https://nodejs.org/dist/v20.8.0/node-v20.8.0-x64.msi' -OutFile '%TEMP%\node-v20.8.0-x64.msi'"

    :: Verificar se o instalador foi baixado com sucesso
    if exist "%TEMP%\node-v20.8.0-x64.msi" (
        echo Instalador do Node.js baixado com sucesso.
        
        :: Abrindo o instalador para instalação manual
        echo Abra o instalador para continuar a instalação.
        start "" "%TEMP%\node-v20.8.0-x64.msi"
        
        echo Depois de concluir a instalação, pressione qualquer tecla para continuar.
        pause
        
        :: Iniciar uma nova janela para continuar a execução após a instalação
        start "" /D "%~dp0" run.bat
    ) else (
        echo Falha ao baixar o instalador do Node.js.
        exit /b
    )
) else (
    echo Node.js ja esta instalado.
)
