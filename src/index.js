const { exec } = require('child_process');
const figlet = require('figlet');
const peq = require("../package.json");

async function verificarAtualizarVersao() {
  try {
    const response = await fetch("https://api.github.com/repos/XPCreate/Rich-Presence-RedeWorth/releases/latest");
    if (!response.ok) {
      throw new Error(`GitHub API Error: ${response.statusText} (status: ${response.status})`);
    }

    const data = await response.json();

    if (!data.tag_name) {
      throw new Error("Nenhuma release encontrada no repositório do GitHub.");
    }

    const versaoMaisRecente = data.tag_name;
    const versaoLocal = `v${peq.version}`;

    if (versaoLocal !== versaoMaisRecente) {
      console.log(`\x1b[0;33m[AVISO] Uma nova versão está disponível: ${versaoMaisRecente}.\x1b[0m`);
    } else {
      console.log("\x1b[0;32m[SUCCESSO] Você já está utilizando a versão mais recente.\x1b[0m");
    }
  } catch (err) {
    console.log("\x1b[0;31m[ERRO] Não foi possível verificar a versão mais recente.\x1b[0m");
    console.error(err);
  }
}

var discordIsNotLog = false;

function centralizarTexto(texto, largura) {
  const linhas = texto.split('\n');
  return linhas.map(linha => {
    const espacos = Math.max(Math.floor((largura - linha.length) / 2), 0);

    const espacosFinal = largura - espacos - linha.length;
    const espacosFinais = Math.max(espacosFinal, 0);

    return ' '.repeat(espacos) + linha + ' '.repeat(espacosFinais);
  }).join('\n');
}

figlet('vitor_xp', async (err, data) => {
  console.clear("")
  await verificarAtualizarVersao();

  if (err) {
    console.log('Algo deu errado...', err);
    return;
  }

  const largura = 60;

  const textoPequeno = "Criado por:";
  const textoPequenoMais = "Para a Rede Worth no intuito de divulgar o servidor no discord.";
  const textoVersao = "Versão: " + peq.version + " - Editado: 09/01/2025";

  console.log(`
\x1b[0;37m---------------------------------------------------------------\x1b[0m
\x1b[0;37m \x1b[0;36m${centralizarTexto(textoPequeno, largura)}\x1b[0m

\x1b[0;37m\x1b[0;32m${centralizarTexto(data, largura)}\x1b[0m

\x1b[0;37m\x1b[0;33m${centralizarTexto(textoPequenoMais, largura)}\x1b[0m
\x1b[0;37m\x1b[0;35m${centralizarTexto(textoVersao, largura)}\x1b[0m
\x1b[0;37m---------------------------------------------------------------\x1b[0m
`);
});

setTimeout(async () => {
  start();
}, 2000)

var nickName = null;

function customLog(pergunta, callback) {
  process.stdout.write(pergunta);
  process.stdin.once('data', (data) => {
    const resposta = data.toString().trim();
    callback(resposta);
  });
}

async function start() {
  try {
    const DiscordRPC = require('discord-rpc');
    const presence = require('../activities.js');

    const client_id = "1325483160011804754";
    const RPC = new DiscordRPC.Client({ transport: 'ipc' });

    DiscordRPC.register(client_id);

    async function setActivity() {
      if (!RPC) return console.log(rpc);
      RPC.setActivity(await presence.presence(nickName));
    }

    RPC.on('ready', async () => {
      console.log('[DEBUG] - Ativado sistema...')

      var adsdf = setInterval(async () => {
        if (RPC) {
          clearInterval(adsdf);
          console.log("[DEBUG] - Sistema ativo, conexão conectado com o Discord.")
          console.log("[DEBUG] - Atividade personalizada ativada com sucesso! (reload a cada 15s)")
          customLog(`Qual seu nick no Minecraft?
`, (a) => {
            nickName = a;
            console.log(`O nick mostrado no status será: ${nickName}.`)
            process.stdin.pause();

          });

          setTimeout(async() => {
            await setActivity();

          setInterval(async () => {
            await setActivity();
          }, 15000);
          }, 1500)
        }
      }, 0);
    });

    RPC.login({ clientId: client_id })
      .then(async () => {
        discordIsNotLog = false;
      })
      .catch(async err => {
        if (discordIsNotLog === false) console.log("[DEBUG] - Discord desconectado, reconectando...");
        discordIsNotLog = true;
        await start();
      });
  } catch (err) {
    console.log(err)
  }
}