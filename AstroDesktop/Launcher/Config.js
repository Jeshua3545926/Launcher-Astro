const { app, BrowserWindow } = require('electron/main')
const path = require('node:path')

function createWindow () {
  // Detectar el OS
  const isWindows = process.platform === 'win32'

  const win = new BrowserWindow({
    width: 1200,
    height: 600,
    autoHideMenuBar: true,
    frame: !isWindows, // Si es Windows: frame false (custom), sino frame true (nativo)
    webPreferences: {
      preload: path.join(__dirname, 'index.js')
    } 
  })

  win.loadFile('index.html')
}

app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
