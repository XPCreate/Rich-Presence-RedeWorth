require("./plugins/terminalLogInfo");

const fs = require('fs');
const path = require('path');
const { app, BrowserWindow, ipcMain, Menu, Tray } = require('electron');
const Store = require("electron-store");
const { spawn } = require('child_process');
const peq = require('../package.json');
const config = require('./configFile');
const { db } = require('./plugins/dataDB');
const { pipeline } = require('stream');
const { promisify } = require('util');
const streamPipeline = promisify(pipeline);

console.log('[DEBUG_LOG] - Log do terminal sendo registrada com sucesso em', path.dirname(process.cwd()));
console.log("[DEBUG_LOG] - Iniciando sistemas...");

let mainWindow, rpcProcess, splashWindow, tray, timeStart;
let nickname = db.rich.get("configRichPresence/nickname") ?? "";
let noAgain = db.get("config/minimizeToTray") === false;
let tryAgain = false;
var d3 = ""

const formatText = text => text.replace(/\n/g, '<br>');
const formatTextc = text => text.replace(/\n/g, '');

const createTray = () => {
  console.log("[DEBUG_LOG] - Criando ícone da bandeja...");
  tray = new Tray(path.join(__dirname, "./ui/image/imageicon.png"));
  tray.setToolTip("Discord Rich Presence RedeWorth");
  // tray.on("click", () => mainWindow.show());
  tray.on('double-click', () => {
    if (mainWindow.isVisible()) {
      mainWindow.hide();
    } else {
      mainWindow.show();
    }
  });
  updateTrayMenu("stop");
};

const updateTrayMenu = state => {
  d3 = state
  const trayMenu = Menu.buildFromTemplate([
    {
      label: "Verificar Atualização",
      click: () => {
        restartApp();
        db.update("config/reloadStartRichPresence", true);
      }
    },
    {
      label: "Iniciar Atividade",
      click: () => startRPCProcess(nickname),
      enabled: state !== "run"
    },
    {
      label: "Reiniciar Atividade", click: () => {
        stopRPCProcess();
        setTimeout(() => startRPCProcess(nickname), 100);
      }
    },
    {
      label: "Parar Atividade",
      click: () => stopRPCProcess(),
      enabled: state !== "stop"
    },
    {
      label: mainWindow.isVisible() ? "Esconder Aplicativo" : "Mostrar Aplicativo",
      click: () => {
        if (mainWindow.isVisible()) {
          mainWindow.hide();
        } else {
          mainWindow.show();
        }
        updateTrayMenu(d3);
      }
    },
    {
      label: "Fechar Aplicativo",
      click: () => {
        tryAgain = true;
        app.quit();
      }
    }
  ]);

  tray.setContextMenu(trayMenu);
};

const createMainWindow = () => {
  console.log('[DEBUG_LOG] - Inicializando janela principal.');
  mainWindow = new BrowserWindow({
    width: Number(db.get("config/pixelFormatApp1")) ?? 950,
    height: Number(db.get("config/pixelFormatApp2")) ?? 600,
    title: 'Discord Rich Presence RedeWorth',
    icon: path.join(__dirname, "./ui/image/imageicon.png"),
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
    frame: false,
  });

  if (config.environment === "Production") Menu.setApplicationMenu(Menu.buildFromTemplate([]));

  mainWindow.webContents.on('context-menu', (e, params) => {
    const template = [
      {
        label: 'Verificar Atualização',
        click: () => {
          restartApp();
          db.update("config/reloadStartRichPresence", true);
        }
      },
      { type: 'separator' },
      {
        label: 'Minimizar',
        click: () => {
          mainWindow.minimize();
        }
      },
      {
        label: 'Maximizar',
        click: () => {
          if (mainWindow.isMaximized()) {
            mainWindow.unmaximize();
          } else {
            mainWindow.maximize();
          }
        }
      },
      {
        label: 'Esconder Aplicativo',
        click: () => {
          mainWindow.hide();
        }
      },
      {
        label: "Fechar Aplicativo",
        click: () => {
          tryAgain = true;
          app.quit();
        }
      }
    ];

    const menu = Menu.buildFromTemplate(template);
    menu.popup({ window: mainWindow });
  });

  mainWindow.loadFile('ui/index.html');
  mainWindow.setTitle("Discord Rich Presence RedeWorth");

  if (db.get("config/runAppToMin") === true) mainWindow.hide();

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
      updateTrayMenu(d3);
    } else {
      console.log('[DEBUG_LOG] - Saindo da aplicação.');
    }
  });
};

const createSplashWindow = () => {
  splashWindow = new BrowserWindow({
    width: 350,
    height: 450,
    frame: false,
    icon: path.join(__dirname, "./ui/image/imageicon.png"),
    alwaysOnTop: true,
    resizable: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });
  splashWindow.loadFile('ui/splash.html');
  splashWindow.setTitle("Discord Rich Presence RedeWorth");

  if (config.environment === "Production") Menu.setApplicationMenu(Menu.buildFromTemplate([]));
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
    env: {
      ...process.env,
      NICKNAME: nick
    },
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
  if (output.includes("[DEBUG] - Minecraft foi fechado!")) {
    mainWindow.webContents.send('activities-minecraft', 0);
    if (db.get("config/closeAppGameInt") === true) {
      tryAgain = true;
      app.quit();
    }
  };
  if (output.includes("[DEBUG] - Discord desconectado")) setTimeout(() => restartRPCProcess(), 5000);
  if (output.includes("[DEBUG] - Atividade personalizada ativada!")) {
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
  setTimeout(() => {
    if (db.get("config/reloadStartRichPresence") === true || db.get("config/AppStartRich") === true) {
      db.update("config/reloadStartRichPresence", false);
      startRPCProcess(nickname);
    }
  }, 1000)
  splashWindow.close();
})

ipcMain.on("updateVersionApp", async (event, data) => {
  restartApp();
  db.update("config/reloadStartRichPresence", true);
})

ipcMain.on("updateVerify", async (event, data2) => {
  const AdmZip = require("adm-zip");

  const response = await fetch(
    "https://api.github.com/repos/XPCreate/Rich-Presence-RedeWorth/releases/latest"
  );
  if (!response.ok) return splashWindow.webContents.send("firstUpdate", false);;

  const data = await response.json();
  if (!data.tag_name) return splashWindow.webContents.send("firstUpdate", false);;

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

  if (!zipUrl) return splashWindow.webContents.send("firstUpdate", false);

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
      fs.writeFileSync(path.join(__dirname, 'update.flag'), 'true');
      setTimeout(restartApp, 100);

      return splashWindow.webContents.send("firstUpdate", true);
    } catch (error) {
      console.error("Erro:", error);
    }
  }

  setTimeout(async () => {
    await downloadAndExtract()
  }, 500)
});

ipcMain.on('configApp', (event, data) => {
  db.update("config", data);
  noAgain = data.minimizeToTray === false;
});

app.on('window-all-closed', event => {
  event.preventDefault();
  console.log('[DEBUG_LOG] - Tentativa de fechar todas as janelas bloqueada.');
});