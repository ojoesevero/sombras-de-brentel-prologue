const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  writeLog: (logEntry) => ipcRenderer.send('write-log', logEntry)
});
