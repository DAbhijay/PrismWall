// The single place responsible for deciding WHICH wallpaper to show
// and actually setting it on the OS desktop.
//
// Rule: nothing else in the app calls wallpaper.set() directly.
// Everything goes through applyWallpaper() so the logic stays in one place.

const store = require('./store');

let _wallpaper = null;
async function getWallpaperPkg() {
  if (!_wallpaper) {
    _wallpaper = await import('wallpaper');
  }
  return _wallpaper;
}


async function applyWallpaper() {
  const mode       = store.get('mode');
  const wallpapers = store.get('wallpapers');
  const xray       = store.get('xray');
  const isPlaying  = global.mediaPlaying ?? false;

  if (xray.enabled && xray.topLayer && xray.bottomLayer) {
    console.log('[PrismWall] X-ray active — compositor not yet implemented');
    return;
  }

  let targetPath = null;

  if (mode === 'day') {
    targetPath = (isPlaying && wallpapers.dayMedia)
      ? wallpapers.dayMedia
      : wallpapers.dayDefault;
  } else {
    targetPath = (isPlaying && wallpapers.nightMedia)
      ? wallpapers.nightMedia
      : wallpapers.nightDefault;
  }

  if (!targetPath) {
    console.log(`[PrismWall] No wallpaper set for slot (mode=${mode}, media=${isPlaying})`);
    return;
  }

  try {
    const wp = await getWallpaperPkg();
    await wp.setWallpaper(targetPath);
    console.log(`[PrismWall] Wallpaper set → ${targetPath}`);
  } catch (err) {
    console.error('[PrismWall] Failed to set wallpaper:', err.message);
  }
}

function toggleMode() {
  const current = store.get('mode');
  const next    = current === 'day' ? 'night' : 'day';
  store.set('mode', next);
  applyWallpaper();
  return next;
}

function setMode(mode) {
  store.set('mode', mode);
  applyWallpaper();
  return mode;
}

module.exports = { applyWallpaper, toggleMode, setMode };
