const { app, BrowserWindow, ipcMain, Menu, dialog } = require('electron');
const { spawn } = require('child_process');
const path = require('path');
const peq = require('./package.json');
const config = require('./config');

const formatText = (text) => text.replace(/\n/g, '<br>');
let beforeRPCProcess = false;

let mainWindow, rpcProcess, splashWindow;

const getCurrentDate = () => {
  const currentDate = new Date();
  return currentDate.toLocaleString("en-CA", {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  }).replace(',', '');
};

const createSplashWindow = () => {
  splashWindow = new BrowserWindow({
    width: 500,
    height: 300,
    frame: false,
    alwaysOnTop: true,
    resizable: false,
    transparent: false,
    webPreferences: {
      nodeIntegration: false
    }
  });

  splashWindow.loadFile('ui/splash.html');
};

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

  if (rpcProcess) rpcProcess.kill();

  rpcProcess = spawn('node', ['src/index.js'], {
    env: { ...process.env, NICKNAME: nick },
    stdio: ['pipe', 'pipe', 'pipe'],
  });

  rpcProcess.stdout.on('data', (data) => {
    handleRPCProcessOutput(data);
  });

  rpcProcess.stderr.on('data', (data) => {
    mainWindow.webContents.send('terminal-output', formatText(`Erro: ${data}`));
  });

  rpcProcess.on('close', () => {
    mainWindow.webContents.send('terminal-output', formatText('[DEBUG] - Processo encerrado com sucesso.'));
  });

  mainWindow.on('close', handleWindowClose);
};

const handleRPCProcessOutput = (data) => {
  const output = data.toString();
  if (output.includes("[DEBUG] - Minecraft foi aberto!")) {
    mainWindow.webContents.send('activities-minecraft', Date.now());
  } else if (output.includes("[DEBUG] - Minecraft foi fechado!")) {
    mainWindow.webContents.send('activities-minecraft', 0);
  }

  mainWindow.webContents.send('terminal-output', formatText(output));
};

const handleWindowClose = (event) => {
  if (!beforeRPCProcess) {
    beforeRPCProcess = true;
    event.preventDefault();

    if (mainWindow && !mainWindow.isDestroyed()) {
      dialog.showMessageBox(mainWindow, {
        type: 'question',
        buttons: ['Cancelar', 'Fechar'],
        defaultId: 1,
        title: 'Confirmação',
        message: 'Tem certeza que deseja fechar a aplicação?\nCaso feche, a atividade será parada imediatamente...',
      }).then((result) => {
        beforeRPCProcess = (result.response === 0);
        if (!beforeRPCProcess) app.quit();
      }).catch((err) => {
        console.error("Erro ao exibir a caixa de diálogo:", err);
      });
    } else {
      app.quit();
    }
  }
};

const stopRPCProcess = () => {
  if (rpcProcess) {
    rpcProcess.kill();
    rpcProcess = null;
    mainWindow.webContents.send('terminal-output', formatText('[DEBUG] - Atividade desativada com sucesso.'));
  }
};

const initializeApp = () => {
  createSplashWindow();

  setTimeout(() => {
    createMainWindow();
    splashWindow.close();
  }, 5000);

  ipcMain.on('startRPC', (event, nick) => startRPCProcess(nick));
  ipcMain.on('stopRPC', stopRPCProcess);
  ipcMain.on('config', (event, data) => {
    if (rpcProcess) rpcProcess.stdin.write(JSON.stringify(data) + '\n');
  });

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
  });
};

app.whenReady().then(initializeApp);