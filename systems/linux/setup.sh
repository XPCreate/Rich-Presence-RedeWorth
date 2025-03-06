#!/bin/bash

if ! command -v node &> /dev/null
then
    echo "Node.js não encontrado. Baixando e instalando..."
    
    echo "Baixando instalador do Node.js..."
    wget -O /tmp/node-v20.8.0-linux-x64.tar.xz "https://nodejs.org/dist/v20.8.0/node-v20.8.0-linux-x64.tar.xz"
    
    if [ -f "/tmp/node-v20.8.0-linux-x64.tar.xz" ]; then
        echo "Instalador do Node.js baixado com sucesso."
        
        echo "Extraindo e instalando Node.js..."
        tar -xf /tmp/node-v20.8.0-linux-x64.tar.xz -C /usr/local --strip-components=1
        
        echo "Instalação concluída."
        echo "Depois de concluir a instalação, pressione Enter para continuar."
        read -r
        
        nohup bash "$(dirname "$0")/run.sh" &> /dev/null &
    else
        echo "Falha ao baixar o instalador do Node.js."
        exit 1
    fi
else
    echo "Node.js já está instalado."
    nohup bash "$(dirname "$0")/run.sh" &> /dev/null &
fi
