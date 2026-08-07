const { app, BrowserWindow, dialog } = require('electron');
const { autoUpdater } = require('electron-updater');
const path = require('path');
const url = require('url');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    title: 'Romaneio OCR Reader',
    icon: path.join(__dirname, 'public/favicon.ico'), // Ensure you have an icon
    autoHideMenuBar: true, // Hides the ugly native menu bar
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  // Completely remove the default menu (File, Edit, View...)
  mainWindow.removeMenu();

  // Decide if we load the dev server URL or the built local index.html
  const startUrl = process.env.ELECTRON_START_URL || url.format({
    pathname: path.join(__dirname, 'dist/index.html'),
    protocol: 'file:',
    slashes: true
  });

  mainWindow.loadURL(startUrl);

  // mainWindow.webContents.openDevTools(); // Uncomment for debugging

  mainWindow.on('closed', function () {
    mainWindow = null;
  });
}

app.on('ready', () => {
  createWindow();

  // Check for updates on startup
  autoUpdater.checkForUpdatesAndNotify();
});

// Auto Updater Events
autoUpdater.on('update-available', (info) => {
  dialog.showMessageBox({
    type: 'info',
    title: 'Atualização Encontrada',
    message: `Uma nova versão (${info.version}) está disponível. O download começará em segundo plano.`
  });
});

autoUpdater.on('update-downloaded', (info) => {
  dialog.showMessageBox({
    type: 'question',
    buttons: ['Reiniciar Agora', 'Depois'],
    defaultId: 0,
    title: 'Atualização Pronta',
    message: 'A nova versão foi baixada. Deseja reiniciar o aplicativo para instalar agora?'
  }).then((result) => {
    if (result.response === 0) {
      autoUpdater.quitAndInstall();
    }
  });
});

autoUpdater.on('error', (err) => {
  console.error('Erro na atualização automática:', err);
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', function () {
  if (mainWindow === null) {
    createWindow();
  }
});
