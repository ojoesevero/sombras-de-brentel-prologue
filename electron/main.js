import { app, BrowserWindow, ipcMain, shell } from 'electron';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Garante que o diretório de dados do usuário e logs/ existam
const userDataDir = app.getPath('userData');
const logsDir = path.join(userDataDir, 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

ipcMain.on('write-log', (event, logEntry) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const logFile = path.join(logsDir, `${today}.log`);
    const line = typeof logEntry === 'string' ? logEntry : JSON.stringify(logEntry);
    fs.appendFileSync(logFile, `[${new Date().toLocaleTimeString()}] ${line}\n`, 'utf8');
  } catch (err) {
    console.error('Erro ao escrever log:', err);
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
    width: 1024,
    height: 768,
    useContentSize: true,
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  mainWindow.setMenu(null);
  mainWindow.setAspectRatio(4 / 3);

  if (isDev) {
    const devServerUrl = 'http://localhost:3000';
    
    // Tratamento de retry resiliente para o loadURL durante o boot do Vite
    const loadWithRetry = (retries = 10, delay = 500) => {
      mainWindow.loadURL(devServerUrl).catch((err) => {
        if (retries > 0) {
          console.log(`[Electron] Vite dev server ainda não respondeu, tentando novamente em ${delay}ms... (${retries} tentativas restantes)`);
          setTimeout(() => loadWithRetry(retries - 1, delay), delay);
        } else {
          console.error('[Electron] Falha persistente ao conectar ao servidor Vite:', err);
        }
      });
    };

    loadWithRetry();
    mainWindow.webContents.openDevTools({ mode: 'detach' });
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
