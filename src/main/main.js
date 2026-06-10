// Electron entry point. Responsible for:
//  - Creating the BrowserWindow
//  - Registering the global keybind
//  - Setting up all IPC handlers
//  - Starting the tray and media watcher
//  - Wiring up auto-updater

const {
  app,
  BrowserWindow,
  ipcMain,
  globalShortcut,
  dialog,
} = require('electron');
const path = require('path');

const store             = require('./store');
const { applyWallpaper, toggleMode, setMode } = require('./wallpaperManager');
const { buildTray, updateTray }               = require('./trayManager');
const mediaWatcher      = require('./mediaWatcher');

// ── Single instance lock ───────────────────────────────────────────────────────
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
  process.exit(0);
}

app.setAsDefaultProtocolClient('prismwall');

let mainWindow = null;

// ── Window creation ───────────────────────────────────────────────────────────

function createWindow() {
  mainWindow = new BrowserWindow({
    width:     900,
    height:    600,
    minWidth:  700,
    minHeight: 480,
    webPreferences: {
      preload:          path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration:  false,
    },
    titleBarStyle: 'hiddenInset',
    show: false,
  });

  mainWindow.once('ready-to-show', () => mainWindow.show());

  mainWindow.loadURL('http://localhost:5173');

  mainWindow.on('close', (e) => {
    if (!app.isQuitting) {
      e.preventDefault();
      mainWindow.hide();
    }
  });
}

// ── App lifecycle ─────────────────────────────────────────────────────────────

app.whenReady().then(() => {
  createWindow();

  buildTray(mainWindow);

  mediaWatcher.init(mainWindow);

  applyWallpaper();

  registerKeybind();

  app.on('activate', () => mainWindow.show());
});

app.on('second-instance', () => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.show();
    mainWindow.focus();
  }
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
  mediaWatcher.stopPolling();
});

app.on('window-all-closed', (e) => {
  if (process.platform !== 'darwin') e.preventDefault?.();
});

// ── Global keybind ────────────────────────────────────────────────────────────

function registerKeybind() {
  const keybind = store.get('keybind');

  globalShortcut.unregisterAll();

  const registered = globalShortcut.register(keybind, () => {
    const newMode = toggleMode();
    updateTray(newMode);
    if (mainWindow) {
      mainWindow.webContents.send('mode-changed', newMode);
    }
  });

  if (!registered) {
    console.warn(`[PrismWall] Could not register keybind: ${keybind}`);
  }
}

// ── IPC handlers ──────────────────────────────────────────────────────────────

ipcMain.handle('pick-file', async () => {
  const { filePaths } = await dialog.showOpenDialog(mainWindow, {
    title:      'Choose wallpaper image',
    properties: ['openFile'],
    filters: [
      { name: 'Images', extensions: ['jpg', 'jpeg', 'png', 'webp', 'gif'] },
    ],
  });
  return filePaths[0] ?? null;
});

ipcMain.handle('set-slot', (_, slot, filePath) => {
  const validSlots = ['dayDefault', 'dayMedia', 'nightDefault', 'nightMedia'];
  if (!validSlots.includes(slot)) {
    throw new Error(`Invalid slot: ${slot}`);
  }
  store.set(`wallpapers.${slot}`, filePath);
  applyWallpaper();
  return true;
});

ipcMain.handle('get-config', () => store.store);

ipcMain.handle('toggle-mode', () => {
  const newMode = toggleMode();
  updateTray(newMode);
  return newMode;
});

ipcMain.handle('set-mode', (_, mode) => {
  if (!['day', 'night'].includes(mode)) throw new Error(`Invalid mode: ${mode}`);
  setMode(mode);
  updateTray(mode);
  return mode;
});

ipcMain.handle('set-xray', (_, config) => {
  const current = store.get('xray');
  store.set('xray', { ...current, ...config });
  applyWallpaper();
  return store.get('xray');
});

ipcMain.handle('spotify-connect', () => mediaWatcher.connectSpotify());
ipcMain.handle('spotify-disconnect', () => {
  mediaWatcher.disconnectSpotify();
  return true;
});
ipcMain.handle('spotify-set-client-id', (_, clientId) => {
  store.set('spotify.clientId', clientId);
  return true;
});

ipcMain.handle('set-keybind', (_, keybind) => {
  store.set('keybind', keybind);
  registerKeybind();
  return keybind;
});
