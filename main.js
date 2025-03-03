const { app, BrowserWindow, ipcMain, Menu } = require('electron');
const { spawn } = require('child_process');
const path = require('path');
const peq = require('./package.json');
const config = require('./config');

const formatText = (text) => text.replace(/\n/g, '<br>');

let currentDate = new Date();
let formattedDate = currentDate.toLocaleString("en-CA", {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: false
}).replace(',', '');

let configData = JSON.stringify(
  {
    editTimeActivitiesProfile: formattedDate,
    showClient: true,
    showTimeActivities: true,
    nickname: "Desconhecido"
  }
);

process.env.CONFIG_DATA = configData;

let mainWindow;
let rpcProcess;

const createMainWindow = () => {
  mainWindow = new BrowserWindow({
    width: 950,
    height: 600,
    title: 'Discord Rich Presence RedeWorth',
    icon: path.join(__dirname, "image/749a8e803f7abea1f44bce4832b18d75.ico"),
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    }
  });

  if (config.environment === "Production") {
    const menu = Menu.buildFromTemplate([]);
    Menu.setApplicationMenu(menu);
  }


  mainWindow.loadFile('ui/index.html');

  const interval = setInterval(() => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('versionAPP', `v${peq.version}`);
      mainWindow.webContents.send('MemoryUsed', process.memoryUsage());
    } else {
      clearInterval(interval);
    }
  }, 1000);
};

const startRPCProcess = (nick) => {
  
  console.clear();
  mainWindow.webContents.send('startRPC', "ok");

  if (rpcProcess) {
    rpcProcess.kill();
  }

  rpcProcess = spawn('node', ['src/index.js'], {
    env: { ...process.env, NICKNAME: nick },
    stdio: ['pipe', 'pipe', 'pipe'],
  });

  rpcProcess.stdout.on('data', (data) => {
    if (data.toString().includes("[DEBUG] - Minecraft foi aberto!")) {
      mainWindow.webContents.send('activities-minecraft', Date.now());
    } else if (data.toString().includes("[DEBUG] - Minecraft foi fechado!")) {
      mainWindow.webContents.send('activities-minecraft', 0);
    }

    mainWindow.webContents.send('terminal-output', formatText(data.toString()));
  });

  rpcProcess.stderr.on('data', (data) => {
    mainWindow.webContents.send('terminal-output', formatText(`Erro: ${data}`));
  });

  rpcProcess.on('close', () => {
    mainWindow.webContents.send('terminal-output', formatText('[DEBUG] - Processo encerrado com sucesso.'));
  });
};

const stopRPCProcess = () => {
  if (rpcProcess) {
    rpcProcess.kill();
    rpcProcess = null;
    mainWindow.webContents.send('terminal-output', formatText('[DEBUG] - Atividade desativada com sucesso.'));
  }
};

app.whenReady().then(() => {
  createMainWindow();

  ipcMain.on('startRPC', (event, nick) => {
    startRPCProcess(nick);
  });

  ipcMain.on('stopRPC', () => {
    stopRPCProcess();
  });

  ipcMain.on('config', (event, data) => {
    if (rpcProcess) {
      rpcProcess.stdin.write(JSON.stringify(data) + '\n');
    }
  });

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
  });
});