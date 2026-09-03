import { app, BrowserWindow, ipcMain, shell } from 'electron';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = 'true';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Garante que o diretório de dados do usuário e a pasta raiz logs/ existam
const userDataDir = app.getPath('userData');
const rootLogsDir = path.join(process.cwd(), 'logs');
const userLogsDir = path.join(userDataDir, 'logs');

[rootLogsDir, userLogsDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    try {
      fs.mkdirSync(dir, { recursive: true });
    } catch (e) {
      console.warn('Falha ao criar diretório de logs:', dir, e);
    }
  }
});

ipcMain.on('write-log', (event, logEntry) => {
  try {
    const line = typeof logEntry === 'string' ? logEntry : JSON.stringify(logEntry);
    const formattedLine = line.endsWith('\n') ? line : `${line}\n`;

    // 1. Gravação física contínua em logs/game_interactions.log (raiz do projeto)
    const interactionLog = path.join(rootLogsDir, 'game_interactions.log');
    fs.appendFileSync(interactionLog, formattedLine, 'utf8');

    // 2. Gravação diária no diretório userData do usuário
    const today = new Date().toISOString().split('T')[0];
    const userLog = path.join(userLogsDir, `${today}.log`);
    fs.appendFileSync(userLog, formattedLine, 'utf8');
  } catch (err) {
    console.error('Erro ao escrever log físico:', err);
  }
});

const savePath = path.join(userDataDir, 'savegame.dat');

// Migração graciosa de save anterior em process.cwd() se ainda não existir no userData
const legacySavePath = path.join(process.cwd(), 'savegame.dat');
if (fs.existsSync(legacySavePath) && !fs.existsSync(savePath)) {
  try {
    fs.copyFileSync(legacySavePath, savePath);
    console.log('[Electron] Save legado migrado com sucesso para userData:', savePath);
  } catch (err) {
    console.warn('[Electron] Falha ao migrar save legado:', err);
  }
}

// Handlers IPC para Persistência
ipcMain.on('save-game-sync', (event, encodedData) => {
  try {
    fs.writeFileSync(savePath, encodedData, 'utf8');
    event.returnValue = { success: true };
  } catch (err) {
    console.error('Erro ao salvar jogo:', err);
    event.returnValue = { success: false, error: err.message };
  }
});

ipcMain.on('load-game-sync', (event) => {
  try {
    if (fs.existsSync(savePath)) {
      const data = fs.readFileSync(savePath, 'utf8');
      event.returnValue = { success: true, data };
    } else {
      event.returnValue = { success: true, data: null };
    }
  } catch (err) {
    console.error('Erro ao carregar jogo:', err);
    event.returnValue = { success: false, error: err.message, data: null };
  }
});

ipcMain.on('has-save-sync', (event) => {
  try {
    event.returnValue = fs.existsSync(savePath);
  } catch (err) {
    event.returnValue = false;
  }
});

// Handler IPC para Abertura Segura de URLs Externas
ipcMain.on('open-external', (event, url) => {
  try {
    if (url && (url.startsWith('https://') || url.startsWith('http://'))) {
      shell.openExternal(url);
    }
  } catch (err) {
    console.error('Erro ao abrir URL externa:', err);
  }
});

const isDev = process.env.NODE_ENV !== 'production' || process.argv.includes('--dev') || !app.isPackaged;

function createWindow() {
  const preloadPath = fs.existsSync(path.join(__dirname, 'preload.cjs')) 
    ? path.join(__dirname, 'preload.cjs') 
    : path.join(__dirname, 'preload.js');

  const mainWindow = new BrowserWindow({
    width: isDev ? 1360 : 1024,
    height: 768,
    useContentSize: true,
    show: true,
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true,
      allowRunningInsecureContent: false
    }
  });

  mainWindow.setMenu(null);
  if (!isDev) {
    mainWindow.setAspectRatio(4 / 3);
  }

  // Prevenção contra abertura indevida de janelas filhas ou popups
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https://') || url.startsWith('http://')) {
      shell.openExternal(url);
    }
    return { action: 'deny' };
  });

  // Prevenção contra navegações não autorizadas para fora do jogo
  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (isDev && url.startsWith('http://127.0.0.1:3000')) {
      return;
    }
    if (!url.startsWith('file://')) {
      event.preventDefault();
      if (url.startsWith('https://') || url.startsWith('http://')) {
        shell.openExternal(url);
      }
    }
  });

  if (isDev) {
    const devServerUrl = 'http://127.0.0.1:3000';
    
    // Tratamento de retry resiliente para o loadURL durante o boot do Vite
    const loadWithRetry = (retries = 15, delay = 400) => {
      mainWindow.loadURL(devServerUrl).catch((err) => {
        if (retries > 0) {
          console.log(`[Electron] Vite dev server ainda inicializando, reconectando em ${delay}ms... (${retries} restantes)`);
          setTimeout(() => loadWithRetry(retries - 1, delay), delay);
        } else {
          console.error('[Electron] Falha persistente ao conectar ao servidor Vite:', err);
        }
      });
    };

    loadWithRetry();
    // Abre as ferramentas de desenvolvedor (DevTools) acopladas à direita para visualização de logs/erros
    mainWindow.webContents.openDevTools({ mode: 'right' });
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
