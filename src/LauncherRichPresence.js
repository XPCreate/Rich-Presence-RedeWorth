const { app, BrowserWindow, ipcMain, Menu, dialog, Tray } = require('electron');
const { spawn } = require('child_process');
const path = require('path');
const peq = require('../package.json');
const config = require('./configFile');
const { autoUpdater } = require('electron-updater');
require("./plugins/terminalLogInfo");

console.log('[DEBUG_LOG] - Log do terminal sendo registrada com sucesso para ' + path.join(path.dirname(process.cwd())));
console.log("[DEBUG_LOG] - Iniciando sistemas...");

let mainWindow, rpcProcess, splashWindow, tray;
let nickname = "", backupConfig;
let beforeRPCProcess = false;
let tryAgain = false;

const formatText = (text) => text.replace(/\n/g, '<br>');
const formatTextc = (text) => text.replace(/\n/g, '');

const createTray = () => {
    console.log("[DEBUG_LOG] - Criando ícone da bandeja...");
    tray = new Tray(path.join(__dirname, "./ui/image/749a8e803f7abea1f44bce4832b18d75.png"));
    tray.setToolTip("Discord Rich Presence RedeWorth");
    
    tray.on("click", () => mainWindow.show());
    console.log("[DEBUG_LOG] - Ícone da bandeja configurado com sucesso.");

    updateTrayMenu("stop")
};

const updateTrayMenu = (state) => {
  const trayMenu = Menu.buildFromTemplate([
      { label: "Mostrar Painel", click: () => mainWindow.show() },
      { label: "Iniciar Rich Presence", click: () => {
          startRPCProcess(nickname);
          updateTrayMenu("run");
      }, enabled: state !== "run" },
      { label: "Reiniciar Rich Presence", click: () => {
          startRPCProcess(nickname);
          updateTrayMenu("restart");
          setTimeout(() => updateTrayMenu("run"), 5000);
      } },
      { label: "Parar Rich Presence", click: () => {
          stopRPCProcess();
          updateTrayMenu("stop");
      }, enabled: state !== "stop" },
      { label: "Fechar Rich Presence", click: () => {
          tryAgain = true;
          app.quit();
      } }
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
    console.log("[DEBUG_LOG] - Aplicação iniciada em modo de " + config.environment);
    
    mainWindow.loadFile('ui/index.html');
    mainWindow.setTitle("Discord Rich Presence RedeWorth");
    mainWindow.setIcon(path.join(__dirname, "./ui/image/749a8e803f7abea1f44bce4832b18d75.png"))
    console.log('[DEBUG_LOG] - Janela principal inicializada.');

    const interval = setInterval(() => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('versionAPP', `v${peq.version}`);
        mainWindow.webContents.send('MemoryUsed', process.memoryUsage());
      } else {
        clearInterval(interval);
  
        console.log(`[DEBUG_LOG] - Sistema inteiro desativado por completo.`)
      }
    }, 1000);

    mainWindow.on('close', (event) => {
      if(tryAgain === false) {
        event.preventDefault();
        mainWindow.hide(); 
        console.log("[DEBUG_LOG] - Janela minimizada para a bandeja.");
      } else {
        console.log('[DEBUG_LOG] - Saindo da aplicação.');
      }
    });
};

const createSplashWindow = () => {
    console.log('[DEBUG_LOG] - Inicializando janela de carregamento.');
    splashWindow = new BrowserWindow({
        width: 950, height: 600, frame: false, alwaysOnTop: true,
        resizable: false, transparent: false,
        webPreferences: { nodeIntegration: false }
    });
    splashWindow.loadFile('ui/splash.html');
    console.log('[DEBUG_LOG] - Janela de carregamento inicializada.');
    splashWindow.setTitle("Discord Rich Presence RedeWorth");
    splashWindow.setIcon(path.join(__dirname, "./ui/image/749a8e803f7abea1f44bce4832b18d75.png"))

};

const startRPCProcess = (nick) => {
  updateTrayMenu("run")
    console.clear();
    mainWindow.webContents.send('startRPC', "ok");
    console.log('[DEBUG_LOG] - Iniciando RPC...');
    if (rpcProcess) rpcProcess.kill();

    if (rpcProcess) console.log('[DEBUG_LOG] - Status do RPC Morto pelo sistema para evitar duplicação.')

    rpcProcess = spawn('node', ['src/RichPresence.js'], {
        env: { ...process.env, NICKNAME: nick },
        stdio: ['pipe', 'pipe', 'pipe'],
    });

    rpcProcess.stdout.on('data', (data) => handleRPCProcessOutput(data));
    rpcProcess.stderr.on('data', (data) => console.error(formatTextc(`Erro: ${data}`)));
    rpcProcess.on('close', () => console.log('[DEBUG] - RPC encerrado.'));
};

const stopRPCProcess = () => {
  updateTrayMenu("stop")
  if (rpcProcess) {
    rpcProcess.kill();
    rpcProcess = null;
    mainWindow.webContents.send('terminal-output', formatText('[DEBUG] - Atividade desativada com sucesso.'));
    console.log('[DEBUG_LOG] - Status do RPC parado.')
  }
};

const handleRPCProcessOutput = (data) => {
  const output = data.toString();
  if (output.includes("[DEBUG] - Minecraft foi aberto!")) {
    mainWindow.webContents.send('activities-minecraft', Date.now());
  } else if (output.includes("[DEBUG] - Minecraft foi fechado!")) {
    mainWindow.webContents.send('activities-minecraft', 0);
  }

  if (output.includes("[DEBUG] - Atividade personalizada ativada (atualização a cada 15s)")) {
    mainWindow.webContents.send('activities-reload-time-active', 15);
  }

  if (output.includes("[DEBUG] - Discord desconectado, tentando reconectar...")) {
    var intervalV = setInterval(() => {
      stopRPCProcess()
      startRPCProcess(nickname)
      // if (rpcProcess) rpcProcess.stdin.write(backupConfig);
      clearInterval(intervalV);
    }, 5000)
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
        setTimeout(() => {
          splashWindow.close();
        }, 800);
    }, 3000);
    autoUpdater.checkForUpdatesAndNotify();
};

app.whenReady().then(initializeApp);

ipcMain.on('startRPC', (event, nick) => { startRPCProcess(nick); nickname === nick });
  ipcMain.on('stopRPC', stopRPCProcess);
  ipcMain.on('config', (event, data) => {
    if (data.nickname) nickname = data.nickname;
    if (rpcProcess) rpcProcess.stdin.write(JSON.stringify(data) + '\n');
    backupConfig = JSON.stringify(JSON.stringify(data) + '\n');

    console.log('[DEBUG_LOG] - Configurações salvas com sucesso.')
    console.log('[DEBUG_LOG] - Nome do jogador: ', nickname);
    console.log('[DEBUG_LOG] - Configurações: ', JSON.stringify(data));
  });

app.on('window-all-closed', (event) => {
    event.preventDefault();
    console.log('[DEBUG_LOG] - Tentativa de fechar todas as janelas bloqueada.');
});