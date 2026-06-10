# PrismWall — Setup & Run Guide

Everything you need to go from zero to a running app.

---

## Prerequisites

Install these before anything else.

### 1. Node.js (v18 or later)

Download from https://nodejs.org — grab the LTS version.

Verify it installed:
```bash
node --version   # should print v18.x.x or higher
npm --version    # should print 9.x.x or higher
```

### 2. Git

Download from https://git-scm.com if you don't have it.

```bash
git --version
```

### 3. Windows only — Windows Build Tools

The `wallpaper` and `sharp` packages have native Node addons that need to compile.
Run this once in an **Administrator** PowerShell:

```powershell
npm install --global windows-build-tools
```

Or install Visual Studio Build Tools manually from:
https://visualstudio.microsoft.com/visual-cpp-build-tools/
(select "Desktop development with C++" workload)

### 4. macOS only — Xcode Command Line Tools

```bash
xcode-select --install
```

---

## First-time setup

### Step 1 — Clone the repo

```bash
git clone https://github.com/YOUR_USERNAME/prismwall.git
cd prismwall
```

### Step 2 — Install dependencies

```bash
npm install
```

This installs everything in `package.json` including Electron, React, Vite,
electron-store, and the wallpaper package.

> If you see errors about native modules (node-gyp), make sure you completed
> the Windows Build Tools / Xcode step above, then run `npm install` again.

### Step 3 — Run in development mode

```bash
npm start
```

This does two things simultaneously:
1. Starts the **Vite dev server** for the React renderer (hot reload on save)
2. Launches **Electron** pointing at the dev server

The app window will open. The system tray icon appears in your hidden icons area.

---

## Spotify setup (optional — needed for media detection)

To use the media wallpaper swap feature with Spotify:

1. Go to https://developer.spotify.com/dashboard
2. Log in with your Spotify account (free tier is fine)
3. Click **Create App**
4. Fill in any name/description
5. Under **Redirect URIs**, add exactly: `prismwall://spotify-callback`
6. Save — copy your **Client ID**
7. In PrismWall, go to **Media triggers** → paste your Client ID → click **Connect Spotify**
8. A browser window opens for Spotify login — authorize PrismWall
9. Done — PrismWall will now swap wallpapers when music plays

---

## Building for distribution

### Package for your current OS

```bash
npm run package
```

Output goes to `out/` folder.

### Build installers

```bash
npm run build
```

- **Windows**: produces `out/make/squirrel.windows/PrismWall Setup.exe`
- **macOS**: produces `out/make/PrismWall.dmg`

### Build for a specific platform (cross-compile)

```bash
# Windows installer
npm run build -- --platform win32

# macOS DMG
npm run build -- --platform darwin
```

> Note: macOS DMGs can only be properly signed when building on macOS.
> For full cross-platform CI builds, see the GitHub Actions section below.

---

## GitHub Actions — auto-build on tag push

Create `.github/workflows/build.yml`:

```yaml
name: Build & Release

on:
  push:
    tags: ['v*']

jobs:
  build:
    strategy:
      matrix:
        os: [windows-latest, macos-latest]

    runs-on: ${{ matrix.os }}

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 18

      - run: npm install

      - run: npm run build
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}

      - uses: actions/upload-artifact@v4
        with:
          name: prismwall-${{ matrix.os }}
          path: out/make/**/*
```

To trigger a release:
```bash
git tag v1.0.0
git push --tags
```

GitHub Actions will build `.exe` and `.dmg` and attach them to the release automatically.

---

## Project structure reminder

```
prismwall/
├── src/
│   ├── main/
│   │   ├── main.js               ← Electron entry point
│   │   ├── preload.js            ← IPC bridge (contextBridge)
│   │   ├── wallpaperManager.js   ← wallpaper.set() + mode logic
│   │   ├── trayManager.js        ← system tray + context menu
│   │   ├── mediaWatcher.js       ← Spotify polling
│   │   └── store.js              ← electron-store config schema
│   └── renderer/
│       ├── main.jsx              ← React entry
│       ├── App.jsx               ← routing + app shell
│       ├── pages/                ← Wallpapers, XRay, Media, Settings
│       ├── components/           ← Sidebar, TopBar, StatusBar, SlotCard
│       └── styles/               ← CSS modules + global.css
├── assets/
│   └── tray-icon.png             ← 22x22 tray icon
├── index.html                    ← renderer entry HTML
├── forge.config.js               ← electron-forge config
├── vite.main.config.js
├── vite.preload.config.js
├── vite.renderer.config.js
├── package.json
├── README.md
├── ARCHITECTURE.md
└── SETUP.md                      ← this file
```

---

## Common errors & fixes

### `Error: Cannot find module 'wallpaper'`
```bash
npm install
```

### `node-gyp` errors on Windows
Make sure Windows Build Tools are installed (see Prerequisites above).
Then:
```bash
npm install --global node-gyp
npm install
```

### Tray icon doesn't appear
The `assets/tray-icon.png` file must exist. A placeholder is included.
Replace it with your own 22×22 PNG for a polished look.
On macOS, name it `tray-iconTemplate.png` for automatic light/dark adaptation.

### App opens multiple windows
The single-instance lock in `main.js` prevents this — if you're seeing it,
make sure `app.requestSingleInstanceLock()` is running before `app.whenReady()`.

### Wallpaper doesn't change on macOS
macOS may require Screen Recording or Accessibility permission for some wallpaper
methods. If prompted, grant permission in System Preferences → Privacy & Security.

### Hot reload not working
Make sure `npm start` is running (not `electron .` directly).
electron-forge's Vite plugin manages the dev server — running Electron separately
won't connect to Vite's HMR.

---

## Development tips

**Open DevTools in the renderer:**
```js
// Temporarily add this inside createWindow() in main.js
mainWindow.webContents.openDevTools();
```

**Inspect the electron-store config file:**
- Windows: `%APPDATA%\prismwall\config.json`
- macOS: `~/Library/Application Support/prismwall/config.json`

**Reset config to defaults:**
Delete the `config.json` file above and restart the app.

**Test media detection without Spotify:**
Temporarily set `global.mediaPlaying = true` in `main.js` after `app.whenReady()`
and call `applyWallpaper()` — this simulates media playing without Spotify.
