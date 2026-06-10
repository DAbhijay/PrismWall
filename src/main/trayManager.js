// Builds the system tray icon and its right-click context menu.
//
// Important: Electron's native Menu doesn't support updating individual
// items dynamically — you have to rebuild the entire menu and call
// tray.setContextMenu() again. That's what updateTray() does.

const { Tray, Menu, app, nativeImage } = require('electron');
const path = require('path');
const store = require('./store');
const { toggleMode, setMode } = require('./wallpaperManager');

let tray = null;
let mainWindow = null;

function buildTray(win) {
  mainWindow = win;

  const iconPath = path.join(__dirname, '../../assets/tray-icon.png');
  const icon = nativeImage.createFromPath(iconPath);

  tray = new Tray(icon);
  tray.setToolTip('PrismWall');

  updateTray(store.get('mode'));

  tray.on('click', () => {
    if (mainWindow) {
      mainWindow.show();
      mainWindow.focus();
    }
  });
}

function updateTray(currentMode) {
  if (!tray) return;

  const wallpapers   = store.get('wallpapers');
  const activeSlot   = currentMode === 'day' ? 'dayDefault' : 'nightDefault';
  const activePath   = wallpapers[activeSlot];

  const statusLabel  = activePath
    ? `${currentMode === 'day' ? 'Day' : 'Night'} mode — ${path.basename(activePath)}`
    : `${currentMode === 'day' ? 'Day' : 'Night'} mode — no wallpaper set`;

  const menu = Menu.buildFromTemplate([
    { label: '◈ PrismWall', enabled: false },
    { label: statusLabel,   enabled: false },
    { type: 'separator' },

    // Mode toggle — radio style
    {
      label:   '☀  Day mode',
      type:    'radio',
      checked: currentMode === 'day',
      click:   () => handleModeChange('day'),
    },
    {
      label:   '☾  Night mode',
      type:    'radio',
      checked: currentMode === 'night',
      click:   () => handleModeChange('night'),
    },
    { type: 'separator' },

    // X-ray toggle — checkbox style
    {
      label:   '▣  X-ray layer',
      type:    'checkbox',
      checked: store.get('xray.enabled'),
      click:   (menuItem) => {
        store.set('xray.enabled', menuItem.checked);
        // Notify renderer so the toggle in the UI stays in sync
        if (mainWindow) {
          mainWindow.webContents.send('xray-changed', menuItem.checked);
        }
      },
    },
    { type: 'separator' },

    // App actions
    {
      label: '⊞  Open PrismWall',
      click: () => {
        if (mainWindow) {
          mainWindow.show();
          mainWindow.focus();
        }
      },
    },
    {
      label:       '⚙  Settings',
      accelerator: 'CommandOrControl+,',
      click:       () => {
        if (mainWindow) {
          mainWindow.show();
          mainWindow.focus();
          mainWindow.webContents.send('navigate', '/settings');
        }
      },
    },
    { type: 'separator' },

    // Quit — restore system default wallpaper before exiting
    {
      label: '⏻  Quit PrismWall',
      click: () => {
        app.isQuitting = true;
        app.quit();
      },
    },
  ]);

  tray.setContextMenu(menu);
}

function handleModeChange(mode) {
  setMode(mode);
  updateTray(mode);
  if (mainWindow) {
    mainWindow.webContents.send('mode-changed', mode);
  }
}

module.exports = { buildTray, updateTray };
