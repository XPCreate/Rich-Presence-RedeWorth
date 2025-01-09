#!/bin/bash
# Troca para o diretório do script
cd "$(dirname "$0")"

npm install
# Executa o script Node.js
node ../../src/index.js