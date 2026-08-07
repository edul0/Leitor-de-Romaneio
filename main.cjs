const { app, BrowserWindow } = require('electron');
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

app.on('ready', createWindow);

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
