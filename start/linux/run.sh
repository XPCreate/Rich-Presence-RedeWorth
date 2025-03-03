#!/bin/bash

# Verifica se o zenity está instalado
if ! command -v zenity &> /dev/null
then
    echo "Zenity não encontrado. Instalando..."
    sudo apt update && sudo apt install -y zenity
fi

# Exibe uma caixa de mensagem de carregamento
zenity --info --title="Carregando..." --text="Iniciando RedeWorth Rich Presence... Aguarde um momento." --timeout=5

# Move para o diretório do script
cd "$(dirname "$0")" || exit

# Instala as dependências do projeto
npm install
npm install electron --save-dev

# Inicia o Electron sem exibir o terminal
nohup npm run start &> /dev/null &

exit
