const { app, BrowserWindow, ipcMain } = require('electron');
const { exec, spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

function createWindow() {
  const isWindows = process.platform === 'win32';

  const win = new BrowserWindow({
    width: 1200,
    height: 600,
    autoHideMenuBar: true,
    frame: !isWindows,
    webPreferences: {
      preload: path.join(__dirname, 'index.js'), // cambia por tu archivo preload si es otro
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  win.loadFile('index.html');
}

app.whenReady().then(() => {
  createWindow();

  // ✅ Usa la ruta del ejecutable de Node actual (para que funcione en todos los SO)
  const serverPath = path.join(__dirname, 'server.js');
  const nodeExecutable = process.execPath;

  const serverProcess = spawn(nodeExecutable, [serverPath], {
    cwd: path.dirname(serverPath),
    detached: true,
    stdio: ['ignore', 'inherit', 'inherit']
  });

  serverProcess.unref();

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

// ==========================================
// ✅ Ruta multiplataforma para el emulador
// ==========================================
function findEmulatorPath() {
  const home = process.env.HOME || process.env.USERPROFILE;

  const emulatorPaths = {
    win32: path.join(home, 'AppData', 'Local', 'Android', 'Sdk', 'emulator', 'emulator.exe'),
    linux: path.join(home, 'Android', 'Sdk', 'emulator', 'emulator'),
    darwin: path.join(home, 'Library', 'Android', 'sdk', 'emulator', 'emulator')
  };

  const platform = process.platform;
  const emulatorPath = emulatorPaths[platform];

  return (emulatorPath && fs.existsSync(emulatorPath)) ? emulatorPath : null;
}

// ==========================================
// ✅ Ruta para ADB multiplataforma
// ==========================================
function findAdbPath() {
  const home = process.env.HOME || process.env.USERPROFILE;

  const adbPaths = {
    win32: path.join(home, 'AppData', 'Local', 'Android', 'Sdk', 'platform-tools', 'adb.exe'),
    linux: path.join(home, 'Android', 'Sdk', 'platform-tools', 'adb'),
    darwin: path.join(home, 'Library', 'Android', 'sdk', 'platform-tools', 'adb')
  };

  const platform = process.platform;
  const adbPath = adbPaths[platform];

  return (adbPath && fs.existsSync(adbPath)) ? adbPath : 'adb'; // fallback por si está en PATH
}

// ==========================================
// 🚀 Iniciar emulador
// ==========================================
ipcMain.on('start-emulator', (event, avdName) => {
  const emulatorPath = findEmulatorPath();

  if (!emulatorPath) {
    event.sender.send('emulator-status', {
      success: false,
      message: 'No se encontró el emulador. Verifica tu instalación del SDK de Android.'
    });
    return;
  }

  const command = `"${emulatorPath}" -avd ${avdName}`;
  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error al iniciar el emulador: ${error.message}`);
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

