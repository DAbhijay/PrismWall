// The bridge between main process and renderer.
// contextBridge.exposeInMainWorld() is the ONLY way the React app should
// talk to the OS. Never enable nodeIntegration — this is the secure pattern.
//
// Everything exposed here becomes window.prismAPI in React components.

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('prismAPI', {

  // ── Wallpaper slots ────────────────────────────────────────────────────────

  // Opens native file picker, returns chosen path or null if cancelled
  pickFile: () =>
    ipcRenderer.invoke('pick-file'),

  // Save a wallpaper path to a named slot (dayDefault, dayMedia, etc.)
  setSlot: (slot, filePath) =>
    ipcRenderer.invoke('set-slot', slot, filePath),

  // Get the full config object from electron-store
  getConfig: () =>
    ipcRenderer.invoke('get-config'),

  // ── Mode ───────────────────────────────────────────────────────────────────

  // Cycle day → night → day
  toggleMode: () =>
    ipcRenderer.invoke('toggle-mode'),

  // Set mode explicitly ('day' | 'night')
  setMode: (mode) =>
    ipcRenderer.invoke('set-mode', mode),

  // ── X-ray ──────────────────────────────────────────────────────────────────

  // Update X-ray config { enabled, topLayer, bottomLayer, opacity }
  setXray: (config) =>
    ipcRenderer.invoke('set-xray', config),

  // ── Spotify ────────────────────────────────────────────────────────────────

  connectSpotify: () =>
    ipcRenderer.invoke('spotify-connect'),

  disconnectSpotify: () =>
    ipcRenderer.invoke('spotify-disconnect'),

  setSpotifyClientId: (clientId) =>
    ipcRenderer.invoke('spotify-set-client-id', clientId),

  // ── Settings ───────────────────────────────────────────────────────────────

  setKeybind: (keybind) =>
    ipcRenderer.invoke('set-keybind', keybind),

  // ── Event listeners ────────────────────────────────────────────────────────

  onModeChange: (callback) => {
    const handler = (_, mode) => callback(mode);
    ipcRenderer.on('mode-changed', handler);
    
    return () => ipcRenderer.removeListener('mode-changed', handler);
  },

  onMediaChange: (callback) => {
    const handler = (_, isPlaying) => callback(isPlaying);
    ipcRenderer.on('media-changed', handler);
    return () => ipcRenderer.removeListener('media-changed', handler);
  },

  onXrayChange: (callback) => {
    const handler = (_, enabled) => callback(enabled);
    ipcRenderer.on('xray-changed', handler);
    return () => ipcRenderer.removeListener('xray-changed', handler);
  },

  onNavigate: (callback) => {
    const handler = (_, route) => callback(route);
    ipcRenderer.on('navigate', handler);
    return () => ipcRenderer.removeListener('navigate', handler);
  },
});
