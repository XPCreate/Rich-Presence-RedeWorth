const path = require('path');
const os = require('os');
const fs = require('fs');

const appName = "rich-presence-redeworth";

const dataDir =
    process.platform === "win32"
        ? path.join(os.homedir(), "AppData", "Roaming", appName)
        : path.join(os.homedir(), ".config", appName);

if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

const filePathRich = path.join(dataDir, "dataRich.json");
const filePath = path.join(dataDir, "data.json");

class db {
    static carregarDados() {
        if (!fs.existsSync(filePath)) return {};
        const dados = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(dados);
    }

    static salvarDados(dados) {
        fs.writeFileSync(filePath, JSON.stringify(dados, null, 2), 'utf8');
    }

    static get(chave) {
        let dados = this.carregarDados();
        return chave.split('/').reduce((obj, key) => obj && obj.hasOwnProperty(key) ? obj[key] : null, dados);
    }

    static update(chave, valor) {
        let dados = this.carregarDados();
        let keys = chave.split('/');
        let obj = dados;

        for (let i = 0; i < keys.length - 1; i++) {
            obj = obj[keys[i]] = obj[keys[i]] || {};
        }

        obj[keys[keys.length - 1]] = valor;
        this.salvarDados(dados);
    }

    static set(chave, valor) {
        let dados = this.carregarDados();
        let keys = chave.split('/');
        let obj = dados;

        if (keys.length === 1) {
            dados[keys[0]] = valor;
        } else {
            let parent = keys.slice(0, -1).reduce((o, k) => o[k] = o[k] || {}, dados);
            parent[keys[keys.length - 1]] = valor;
        }

        this.salvarDados(dados);
    }

    static save(novosDados) {
        this.salvarDados(novosDados);
    }

    static limpar() {
        fs.writeFileSync(filePath, '{}', 'utf8');
    }

    static rich = class {
        static carregarDados() {
            if (!fs.existsSync(filePathRich)) return {};
            const dados = fs.readFileSync(filePathRich, 'utf8');
            return JSON.parse(dados);
        }

        static salvarDados(dados) {
            fs.writeFileSync(filePathRich, JSON.stringify(dados, null, 2), 'utf8');
        }

        static get(chave) {
            let dados = this.carregarDados();
            return chave.split('/').reduce((obj, key) => obj && obj.hasOwnProperty(key) ? obj[key] : null, dados);
        }

        static update(chave, valor) {
            let dados = this.carregarDados();
            let keys = chave.split('/');
            let obj = dados;

            for (let i = 0; i < keys.length - 1; i++) {
                obj = obj[keys[i]] = obj[keys[i]] || {};
            }

            obj[keys[keys.length - 1]] = valor;
            this.salvarDados(dados);
        }

        static set(chave, valor) {
            let dados = this.carregarDados();
            let keys = chave.split('/');
            let obj = dados;

            if (keys.length === 1) {
                dados[keys[0]] = valor;
            } else {
                let parent = keys.slice(0, -1).reduce((o, k) => o[k] = o[k] || {}, dados);
                parent[keys[keys.length - 1]] = valor;
            }

            this.salvarDados(dados);
        }

        static save(novosDados) {
            this.salvarDados(novosDados);
        }

        static limpar() {
            fs.writeFileSync(filePathRich, '{}', 'utf8');
        }

        static discord = class {
            static carregarDados() {
                if (!fs.existsSync(filePath)) return {};
                const dados = fs.readFileSync(filePath, 'utf8');
                return JSON.parse(dados);
            }
            static salvarDados(dados) {
                fs.writeFileSync(filePath, JSON.stringify(dados, null, 2), 'utf8');
            }
            static get(chave) {
                let dados = this.carregarDados();
                return chave.split('/').reduce((obj, key) => obj && obj.hasOwnProperty(key) ? obj[key] : null, dados);
            }
            static update(chave, valor) {
                let dados = this.carregarDados();
                let keys = chave.split('/');
                let obj = dados;
                for (let i = 0; i < keys.length; i++) { }
                i < keys.length - 1; i++
                obj = obj[keys[i]] = obj[keys[i]] || {};
                obj[keys[keys.length - 1]] = valor;
                this.salvarDados(dados);
                return obj;
            }
            static set(chave, valor) {
                let dados = this.carregarDados();
                let keys = chave.split('/');
                let obj = dados;
                if (keys.length === 1) {
                    dados[keys[0]] = valor;
                } else {
                    let parent = keys.slice(0, -1).reduce((o, k) => o[k] = o[k] || {}, dados);
                    parent[keys[keys.length - 1]] = valor;
                }
                this.salvarDados(dados);
                return obj;

            }
            static save(novosDados) {
                let obj = {};
                for (let chave in novosDados) {
                    if (novosDados.hasOwnProperty(chave)) {
                        obj[chave] = this.discord.set(chave, novosDados[chave]);
                    }
                }
                return obj;
            }
        }
    }
}

module.exports.db = db;