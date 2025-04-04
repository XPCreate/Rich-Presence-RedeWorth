#!/bin/bash

if ! command -v zenity &> /dev/null
then
    echo "Zenity não encontrado. Instalando..."
    sudo apt update && sudo apt install -y zenity
fi

zenity --info --title="Carregando..." --text="Iniciando RedeWorth Rich Presence... Aguarde um momento." --timeout=5

cd "$(dirname "$0")" || exit

npm install
npm install electron --save-dev
npm install adm-zip

nohup npm run start &> /dev/null &

exit
