const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  startEmulator: (avdName) => ipcRenderer.send('start-emulator', avdName),
  onEmulatorStatus: (callback) => ipcRenderer.on('emulator-status', (event, data) => callback(data))
});
