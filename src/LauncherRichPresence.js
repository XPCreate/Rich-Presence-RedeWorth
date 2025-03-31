const { app, BrowserWindow, ipcMain, Menu, Tray } = require('electron');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const peq = require('../package.json');
const config = require('./configFile');
const { db } = require('./plugins/dataDB');
const { pipeline } = require('stream');
const { promisify } = require('util');

const streamPipeline = promisify(pipeline);

require("./plugins/terminalLogInfo");

console.log('[DEBUG_LOG] - Log do terminal sendo registrada com sucesso em', path.dirname(process.cwd()));
console.log("[DEBUG_LOG] - Iniciando sistemas...");

let mainWindow, rpcProcess, splashWindow, tray, timeStart;
let nickname = db.rich.get("configRichPresence/nickname") ?? "";
let tryAgain = false;
let noAgain = db.get("config/minimizeToTray") === false;

const formatText = text => text.replace(/\n/g, '<br>');
const formatTextc = text => text.replace(/\n/g, '');

const createTray = () => {
  console.log("[DEBUG_LOG] - Criando ícone da bandeja...");
  tray = new Tray(path.join(__dirname, "./ui/image/749a8e803f7abea1f44bce4832b18d75.png"));
  tray.setToolTip("Discord Rich Presence RedeWorth");
  tray.on("click", () => mainWindow.show());
  updateTrayMenu("stop");
};

const updateTrayMenu = state => {
  const trayMenu = Menu.buildFromTemplate([
    { label: "Mostrar Painel", click: () => mainWindow.show() },
    { label: "Iniciar Rich Presence", click: () => startRPCProcess(nickname), enabled: state !== "run" },
    { label: "Reiniciar Rich Presence", click: () => restartRPCProcess() },
    { label: "Parar Rich Presence", click: stopRPCProcess, enabled: state !== "stop" },
    { label: "Fechar Rich Presence", click: () => { tryAgain = true; app.quit(); } }
  ]);
  tray.setContextMenu(trayMenu);
};

const createMainWindow = () => {
  console.log('[DEBUG_LOG] - Inicializando janela principal.');
  mainWindow = new BrowserWindow({
    width: 950,
    height: 600,
    title: 'Discord Rich Presence RedeWorth',
    icon: path.join(__dirname, "./ui/image/749a8e803f7abea1f44bce4832b18d75.png"),
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
    frame: false,
  });

  if (config.environment === "Production") Menu.setApplicationMenu(Menu.buildFromTemplate([]));
  mainWindow.loadFile('ui/index.html');
  mainWindow.setTitle("Discord Rich Presence RedeWorth");

  setInterval(() => {
    if (!mainWindow.isDestroyed()) {
      mainWindow.webContents.send('versionAPP', `v${peq.version}`);
      mainWindow.webContents.send('MemoryUsed', process.memoryUsage());
      mainWindow.webContents.send('config', db.rich.get("configRichPresence"));
      mainWindow.webContents.send('configApp', db.get("config"));
    }
  }, 1000);

  ipcMain.on("minimize-window", () => {
    mainWindow.minimize();
  });

  ipcMain.on("maximize-window", () => {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow.maximize();
    }
  });

  ipcMain.on("close-window", () => {
    app.quit();
  });

  mainWindow.on('close', event => {
    if (noAgain) return app.quit();
    if (!tryAgain) {
      event.preventDefault();
      mainWindow.hide();
      console.log("[DEBUG_LOG] - Janela minimizada para a bandeja.");
    } else {
      console.log('[DEBUG_LOG] - Saindo da aplicação.');
    }
  });
};

const createSplashWindow = () => {
  splashWindow = new BrowserWindow({
    width: 950,
    height: 600,
    frame: false,
    alwaysOnTop: true,
    resizable: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });
  splashWindow.loadFile('ui/splash.html');
  splashWindow.setTitle("Discord Rich Presence RedeWorth");
};

function restartApp() {
  console.log("[LOG] Reiniciando a aplicação...");

  app.relaunch();
  app.exit(0);
}

const startRPCProcess = nick => {
  timeStart = Date.now();

  updateTrayMenu("run");
  console.clear();
  mainWindow.webContents.send('startRPC', {
    timeStart
  });
  console.log('[DEBUG_LOG] - Iniciando RPC...');

  if (rpcProcess) console.log('[DEBUG_LOG] - Status do RPC Morto pelo sistema para evitar duplicação.')

  rpcProcess?.kill();


  rpcProcess = spawn('node', ['src/RichPresence.js'], {
    env: { ...process.env, NICKNAME: nick },
    stdio: ['pipe', 'pipe', 'pipe'],
  });

  rpcProcess.stdout.on('data', handleRPCProcessOutput);
  rpcProcess.stderr.on('data', data => console.error(formatTextc(`Erro: ${data}`)));
  rpcProcess.on('close', () => console.log('[DEBUG] - RPC encerrado.'));
};

const restartRPCProcess = () => {
  stopRPCProcess();
  setTimeout(() => startRPCProcess(nickname), 5000);
};

const stopRPCProcess = () => {
  updateTrayMenu("stop");
  if (rpcProcess) {
    rpcProcess.kill();
    rpcProcess = null;
    mainWindow.webContents.send('terminal-output', formatText('[DEBUG] - Atividade desativada com sucesso.'));
  }
};

const handleRPCProcessOutput = data => {
  const output = data.toString();
  if (output.includes("[DEBUG] - Minecraft foi aberto!")) mainWindow.webContents.send('activities-minecraft', Date.now());
  if (output.includes("[DEBUG] - Minecraft foi fechado!")) mainWindow.webContents.send('activities-minecraft', 0);
  if (output.includes("[DEBUG] - Discord desconectado")) setTimeout(() => restartRPCProcess(), 5000);
  if (output.includes("[DEBUG] - Atividade personalizada ativada (atualização a cada 15s)")) {
    mainWindow.webContents.send('activities-reload-time-active', 15);
  }

  if (output.includes("[DEBUG_LOG] - ")) {
    return console.log(formatTextc(output))
  }

  mainWindow.webContents.send('terminal-output', formatText(output));
  console.log(formatTextc(output));
};

const initializeApp = () => {
  console.log("[DEBUG_LOG] - Inicializando aplicação...");
  createSplashWindow();
};

app.whenReady().then(initializeApp);

ipcMain.on('startRPC', (event, nick) => startRPCProcess(nick));
ipcMain.on('stopRPC', stopRPCProcess);
ipcMain.on('config', (event, data) => {
  nickname = data.nickname ?? nickname;
  rpcProcess?.stdin.write(JSON.stringify(data) + '\n');
  db.rich.set("configRichPresence", data);
});

ipcMain.on("firstUpdate", (event, data) => {
  createMainWindow();
  createTray();
  splashWindow.close();
})

ipcMain.on("updateVerify", async (event, data2) => {
  const AdmZip = require("adm-zip");

  const response = await fetch(
    "https://api.github.com/repos/XPCreate/Rich-Presence-RedeWorth/releases/latest"
  );
  if (!response.ok) return;

  const data = await response.json();
  if (!data.tag_name) return;

  const versaoMaisRecente = data.tag_name;
  const versaoLocal = `v${peq.version}`;

  console.log(versaoMaisRecente, versaoLocal, Number(versaoMaisRecente.replace(/[^\d]/g, "")), Number(versaoLocal.replace(/[^\d]/g, "")), versaoLocal !== versaoMaisRecente)

  let zipUrl = null;
  if (versaoLocal !== versaoMaisRecente) {
    if (
      Number(versaoMaisRecente.replace(/[^\d]/g, "")) <=
      Number(versaoLocal.replace(/[^\d]/g, ""))
    )
      return splashWindow.webContents.send("firstUpdate", false);
    zipUrl = data.assets[0]?.browser_download_url;
  }

  if(!zipUrl) return splashWindow.webContents.send("firstUpdate", false);

  splashWindow.webContents.send("yepUpdate", true);

  const outputPath = path.join(__dirname, "test.zip");
  const extractPath = path.join(__dirname, "..");

  const writer = fs.createWriteStream(outputPath);

  async function downloadAndExtract() {
    try {
      console.log("[LOG] Baixando arquivo ZIP...");
      const response = await fetch(zipUrl);
      if (!response.ok) {
        throw new Error(
          `[ERROR] Erro ao baixar o arquivo: ${response.status} ${response.statusText}`
        );
      }

      const totalSize = response.headers.get('content-length');
      if (!totalSize) {
        console.warn("[WARN] Não foi possível obter o tamanho do arquivo.");
      }
      const totalBytes = totalSize ? parseInt(totalSize, 10) : null;
      let downloadedSize = 0;

      const { Transform } = require('stream');

      const progressStream = new Transform({
        transform(chunk, encoding, callback) {
          downloadedSize += chunk.length;
          if (totalBytes) {
            const percent = Math.round((downloadedSize / totalBytes) * 100);
            splashWindow.webContents.send('outputPercentUpdate', percent);
          }
          this.push(chunk);
          callback();
        }
      });

      await streamPipeline(response.body, progressStream, writer);

      console.log("[LOG] Download finalizado corretamente.");

      splashWindow.webContents.send('updateDonwloadFirst', true);

      console.log("[LOG] Extraindo arquivos...");

      const zip = new AdmZip(outputPath);
      const zipEntries = zip.getEntries();
      const totalFiles = zipEntries.length;
      let extractedFiles = 0;

      zipEntries.forEach((entry) => {
        zip.extractEntryTo(entry, extractPath, true, true);
        extractedFiles++;

        const percent = Math.round((extractedFiles / totalFiles) * 100);
        splashWindow.webContents.send('outputPercentExtractedFiles', percent);
      });

      console.log("[LOG] Extração concluída.");
      splashWindow.webContents.send('outputExtractedFiles', true);
      console.log("Arquivos extraídos para:", extractPath);

      fs.unlinkSync(outputPath);
      console.log("Arquivo ZIP removido.");

      setTimeout(restartApp, 100);

      return splashWindow.webContents.send("firstUpdate", true);
    } catch (error) {
      console.error("Erro:", error);
    }
  }

  setTimeout(async () => {await downloadAndExtract()}, 500)
});

ipcMain.on('configApp', (event, data) => {
  db.set("config", data);
  noAgain = data.minimizeToTray === false;
});

app.on('window-all-closed', event => {
  event.preventDefault();
  console.log('[DEBUG_LOG] - Tentativa de fechar todas as janelas bloqueada.');
});