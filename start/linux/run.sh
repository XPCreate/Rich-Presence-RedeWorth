#!/bin/bash

# Move para o diretório do script
cd "$(dirname "$0")" || exit

# Instala as dependências do projeto
npm install
npm install electron --save-dev

# Inicia o Electron sem exibir o terminal
nohup npm run start &> /dev/null &
exit