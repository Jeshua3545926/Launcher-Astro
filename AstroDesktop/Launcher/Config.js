const { app, BrowserWindow, ipcMain } = require('electron/main');
const { exec, spawn } = require('child_process'); // ✅ Importa spawn
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

  const serverPath = path.join(__dirname, 'server.js'); // ✅ Usa ruta absoluta
  const serverProcess = spawn('node', [serverPath], {
    cwd: path.dirname(serverPath),
    detached: true,
    stdio: ['ignore', 'inherit', 'inherit']

  });

  serverProcess.unref(); // ✅ Se llama dentro del `then`, después de spawn

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

// 🧠 Código del emulador (no se toca)
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
