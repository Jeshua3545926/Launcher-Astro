const { app, BrowserWindow, ipcMain } = require('electron/main');
const { exec } = require('child_process');
const path = require('node:path');
const fs = require('fs');

function createWindow () {
  const isWindows = process.platform === 'win32';

  const win = new BrowserWindow({
    width: 1200,
    height: 600,
    autoHideMenuBar: true,
    frame: !isWindows,
    webPreferences: {
      preload: path.join(__dirname, 'index.js')
    }
  });

  win.loadFile('index.html');
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

// 🔍 Buscar automáticamente el ejecutable del emulador
function findEmulatorPath() {
  const home = process.env.HOME || process.env.USERPROFILE;
  const sdkPaths = [
    path.join(home, 'Android', 'Sdk', 'emulator', 'emulator'),
    '/usr/bin/emulator',
    '/usr/local/bin/emulator'
  ];

  for (const emulatorPath of sdkPaths) {
    if (fs.existsSync(emulatorPath)) return emulatorPath;
  }

  return null;
}

// ▶️ Iniciar el emulador AVD
ipcMain.on('start-emulator', (event, avdName) => {
  const emulatorPath = findEmulatorPath();

  if (!emulatorPath) {
    event.sender.send('emulator-status', {
      success: false,
      message: 'No se encontró el emulador. Asegúrate de tener Android Studio y el SDK instalados.'
    });
    return;
  }

  const command = `"${emulatorPath}" -avd ${avdName}`;

  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error ejecutando el emulador: ${error.message}`);
      event.sender.send('emulator-status', { success: false, message: error.message });
      return;
    }

    console.log(`Emulador iniciado: ${stdout}`);
    event.sender.send('emulator-status', {
      success: true,
      message: `Emulador ${avdName} iniciado correctamente.`
    });
  });
});
