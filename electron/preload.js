const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  writeLog: (logEntry) => ipcRenderer.send('write-log', logEntry),
  saveGame: (encodedData) => ipcRenderer.sendSync('save-game-sync', encodedData),
  loadGame: () => ipcRenderer.sendSync('load-game-sync'),
  hasSave: () => ipcRenderer.sendSync('has-save-sync'),
  openExternal: (url) => ipcRenderer.send('open-external', url)
 });

