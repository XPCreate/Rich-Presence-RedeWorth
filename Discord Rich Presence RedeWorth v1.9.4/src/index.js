const figlet = require('figlet');
// const fetch = require('node-fetch');
const peq = require('../package.json');
const DiscordRPC = require('discord-rpc');
const presence = require('../activities.js');
const CLIENT_ID = '1325483160011804754';
const RPC = new DiscordRPC.Client({ transport: 'ipc' });

let discordIsNotLog = false;
let nickName = process.env.NICKNAME || "DefaultNick";

console.log(`[DEBUG] - Nick registrado: ${nickName}`);

async function verificarAtualizarVersao() {
  try {
    const response = await fetch('https://api.github.com/repos/XPCreate/Rich-Presence-RedeWorth/releases/latest');
    if (!response.ok) throw new Error('Falha ao obter versão mais recente.');

    const data = await response.json();
    if (!data.tag_name) throw new Error('Nenhuma release encontrada no GitHub.');

    const versaoMaisRecente = data.tag_name;
    const versaoLocal = `v${peq.version}`;

    if (versaoLocal !== versaoMaisRecente) {
      if(Number(String(versaoMaisRecente).replaceAll(".", "").replace("v", "")) <= Number(String(versaoLocal).replaceAll(".", "").replace("v", "")))
        console.log(`\x1b[0;32m[💎] Você já está na versão mais recente, uma que nem existe no meu sistema ainda ;-; (seu abuser)\x1b[0m`);
      else if((Number(String(versaoLocal).replaceAll(".", "").replace("v", "")) - Number(String(versaoMaisRecente).replaceAll(".", "").replace("v", ""))) <= 3)
        console.log(`\x1b[0;31m[⚠️] Você se encontra em uma versão muito antiga, recomendo atualizar urgente.\n➡ Baixe aqui a versão ${versaoMaisRecente}: ${data.assets[0]?.browser_download_url}\x1b[0m`);
      else console.log(`\x1b[0;33m[⚠️] Nova versão disponível: ${versaoMaisRecente}.\n➡ Baixe aqui: ${data.assets[0]?.browser_download_url}\x1b[0m`);
    } else {
      console.log('\x1b[0;32m[💎] Você já está na versão mais recente.\x1b[0m');
    }
  } catch (error) {
    console.error('\x1b[0;31m[❌] Não foi possível verificar a versão mais recente.\x1b[0m');
  }
}

function centralizarTexto(texto, largura) {
  return texto.split('\n').map(linha => {
    const espacos = Math.max(Math.floor((largura - linha.length) / 2), 0);
    return ' '.repeat(espacos) + linha;
  }).join('\n');
}

async function exibirBanner() {
  console.clear();
  await verificarAtualizarVersao();

    const largura = 70;
    setTimeout(() => {console.log(`\n\x1b[0;37m---------------------------------------------------------------\x1b[0m`);}, 100)
    setTimeout(() => {console.log(`\x1b[0;36m${centralizarTexto('Criado por: vitorxp', largura)}\x1b[0m`);}, 120)
    setTimeout(() => {console.log(`\x1b[0;33m${centralizarTexto('Para a Rede Worth - Divulgação no Discord.', largura)}\x1b[0m`);}, 140)
    setTimeout(() => {console.log(`\x1b[0;35m${centralizarTexto(`Versão: ${peq.version} - Editado: 05/03/2025`, largura)}\x1b[0m`);}, 160)
    setTimeout(() => {console.log(`\x1b[0;37m--------------------------------------------------------- ------\x1b[0m\n`);}, 180)
}

function customLog(pergunta, callback) {
  process.stdout.write(pergunta);
  process.stdin.once('data', data => callback(data.toString().trim()));
}

async function iniciarRPC() {
  try {
    DiscordRPC.register(CLIENT_ID);
    RPC.login({ clientId: CLIENT_ID })
      .then(async () => {
        discordIsNotLog = false;
      })
      .catch(async err => {
        console.error(err);
        if (discordIsNotLog === false) console.log("[DEBUG] - Discord desconectado, tentando reconectar...");
      });

    console.log('[DEBUG] - Discord RPC Iniciado.');

    RPC.on('ready', async () => {
    console.log('[DEBUG] - Atividade personalizada ativada (atualização a cada 15s)');
    await atualizarAtividade();
    setInterval(atualizarAtividade, 15000);
    });

    RPC.on("disconnected", async () => {
      console.log('[DEBUG] - Discord desconectado, tentando reconectar...');
      discordIsNotLog = true;
    })
  } catch (err) {
    console.error('[ERRO] - Falha na conexão com o Discord:', err);
    if (!discordIsNotLog) console.log('[DEBUG] - Discord desconectado, tentando reconectar...');
  }
}

  process.stdin.on('data', (chunk) => {
    try {
      const jsonStrings = chunk.toString().trim().split("\n").filter(Boolean);
      
      jsonStrings.forEach(jsonStr => {
        const config = JSON.parse(jsonStr);
        process.env.CONFIG_DATA = JSON.stringify(config);
      });
  
    } catch (error) {
      console.error("Erro ao processar JSON:", error.message);
    }
  });

async function atualizarAtividade() {
  const configData = process.env.CONFIG_DATA ? JSON.parse(process.env.CONFIG_DATA) : {};
  if (!RPC) return;
  RPC.setActivity(await presence.presence(nickName, configData));
}

setTimeout(async () => { await exibirBanner() });

async function iniciar() {
  customLog('[SYSTEM] - Qual seu nick no Minecraft?\n- ', async resposta => {
    nickName = resposta;
    console.log(`[DEBUG] - Nick registrado: ${nickName}`);
    setTimeout(async () => {
      await iniciarRPC();
    }, 500)
    process.stdin.pause();
  });
}

setTimeout(async () => { await iniciarRPC() }, 1000);