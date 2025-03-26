const { app, BrowserWindow, ipcMain, Menu, Tray } = require('electron');
const { spawn } = require('child_process');
const path = require('path');
const peq = require('../package.json');
const config = require('./configFile');
const { db } = require('./plugins/dataDB');
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
    webPreferences: { nodeIntegration: true, contextIsolation: false }
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
  splashWindow = new BrowserWindow({ width: 950, height: 600, frame: false, alwaysOnTop: true, resizable: false });
  splashWindow.loadFile('ui/splash.html');
  splashWindow.setTitle("Discord Rich Presence RedeWorth");
};

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
  setTimeout(() => {
    createMainWindow();
    createTray();
    splashWindow.close();
  }, 3000);
};

app.whenReady().then(initializeApp);

ipcMain.on('startRPC', (event, nick) => startRPCProcess(nick));
ipcMain.on('stopRPC', stopRPCProcess);
ipcMain.on('config', (event, data) => {
  nickname = data.nickname ?? nickname;
  rpcProcess?.stdin.write(JSON.stringify(data) + '\n');
  db.rich.set("configRichPresence", data);
});

ipcMain.on('configApp', (event, data) => {
  db.set("config", data);
  noAgain = data.minimizeToTray === false;
});

app.on('window-all-closed', event => {
  event.preventDefault();
  console.log('[DEBUG_LOG] - Tentativa de fechar todas as janelas bloqueada.');
});