#!/bin/bash

# Verificar se o Node.js está instalado
node -v > /dev/null 2>&1
if [ $? -ne 0 ]; then
    echo "Node.js não encontrado. Baixando e instalando..."

    # Baixar o instalador do Node.js
    echo "Baixando instalador do Node.js..."
    curl -o "$HOME/node-v20.8.0-x64.msi" "https://nodejs.org/dist/v20.8.0/node-v20.8.0-x64.msi"

    # Verificar se o instalador foi baixado com sucesso
    if [ -f "$HOME/node-v20.8.0-x64.msi" ]; then
        echo "Instalador do Node.js baixado com sucesso."
        
        # Informar ao usuário para abrir o instalador manualmente
        echo "Abra o instalador para continuar a instalação."
        xdg-open "$HOME/node-v20.8.0-x64.msi"
        
        echo "Depois de concluir a instalação, pressione qualquer tecla para continuar."
        read -p "Pressione Enter para continuar..."

        # Rodar o script 'run.bat' após a instalação
        echo "Executando o script run.bat..."
        ./run.bat
    else
        echo "Falha ao baixar o instalador do Node.js."
        exit 1
    fi
else
    echo "Node.js já está instalado."
fi