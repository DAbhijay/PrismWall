// Watches for media playback (Spotify + YouTube) and updates global.mediaPlaying.
// When state changes, it calls applyWallpaper() to swap to the media slot.
//
// Spotify: uses the Web API /me/player endpoint, polled every 5 seconds.
// YouTube: watches active window titles for the "▶" play indicator (v1.5).

const { BrowserWindow, shell } = require('electron');
const store = require('./store');
const { applyWallpaper } = require('./wallpaperManager');

// ─── State ────────────────────────────────────────────────────────────────────
let spotifyToken     = null;  // OAuth access token
let spotifyRefresh   = null;  // refresh token (to get new access tokens)
let pollInterval     = null;  // setInterval handle
let mainWindow       = null;  // ref to push media-changed events to renderer

// Spotify app credentials — user registers their own app at developer.spotify.com
// These are read from electron-store so the user can enter them in Settings.
// We use PKCE flow so no client secret is needed.
const SPOTIFY_CLIENT_ID    = () => store.get('spotify.clientId') ?? '';
const REDIRECT_URI         = 'prismwall://spotify-callback';
const SPOTIFY_SCOPES       = 'user-read-playback-state user-read-currently-playing';
const SPOTIFY_AUTH_URL     = 'https://accounts.spotify.com/authorize';
const SPOTIFY_TOKEN_URL    = 'https://accounts.spotify.com/api/token';

// ─── Init ─────────────────────────────────────────────────────────────────────

function init(win) {
  mainWindow = win;
  global.mediaPlaying = false;

  // If the user already has a saved token, start polling immediately
  const savedToken = store.get('spotify.accessToken');
  if (savedToken) {
    spotifyToken   = savedToken;
    spotifyRefresh = store.get('spotify.refreshToken');
    startPolling();
  }
}

// ─── Spotify OAuth (PKCE) ─────────────────────────────────────────────────────

// Generates a random code verifier string for PKCE
function generateCodeVerifier(length = 64) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
  return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

async function generateCodeChallenge(verifier) {
  const encoder = new TextEncoder();
  const data     = encoder.encode(verifier);
  const digest   = await crypto.subtle.digest('SHA-256', data);
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function connectSpotify() {
  const clientId     = SPOTIFY_CLIENT_ID();
  if (!clientId) {
    console.error('[PrismWall] Spotify client ID not set — go to Settings to add it.');
    return { error: 'no_client_id' };
  }

  const verifier   = generateCodeVerifier();
  const challenge  = await generateCodeChallenge(verifier);
  const state      = Math.random().toString(36).substring(2);

  const authUrl = new URL(SPOTIFY_AUTH_URL);
  authUrl.searchParams.set('client_id',             clientId);
  authUrl.searchParams.set('response_type',         'code');
  authUrl.searchParams.set('redirect_uri',          REDIRECT_URI);
  authUrl.searchParams.set('scope',                 SPOTIFY_SCOPES);
  authUrl.searchParams.set('state',                 state);
  authUrl.searchParams.set('code_challenge_method', 'S256');
  authUrl.searchParams.set('code_challenge',        challenge);

  return new Promise((resolve) => {
    const authWindow = new BrowserWindow({
      width: 500, height: 700,
      webPreferences: { nodeIntegration: false, contextIsolation: true },
    });

    authWindow.loadURL(authUrl.toString());

    authWindow.webContents.on('will-redirect', async (event, url) => {
      if (!url.startsWith('prismwall://spotify-callback')) return;

      event.preventDefault();
      authWindow.close();

      const params = new URL(url).searchParams;
      const code   = params.get('code');
      if (!code) return resolve({ error: 'no_code' });

      const body = new URLSearchParams({
        grant_type:    'authorization_code',
        code,
        redirect_uri:  REDIRECT_URI,
        client_id:     clientId,
        code_verifier: verifier,
      });

      try {
        const res  = await fetch(SPOTIFY_TOKEN_URL, {
          method:  'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body:    body.toString(),
        });
        const data = await res.json();

        spotifyToken   = data.access_token;
        spotifyRefresh = data.refresh_token;

        store.set('spotify.accessToken',  spotifyToken);
        store.set('spotify.refreshToken', spotifyRefresh);

        startPolling();
        resolve({ success: true });
      } catch (err) {
        console.error('[PrismWall] Token exchange failed:', err.message);
        resolve({ error: err.message });
      }
    });

    authWindow.on('closed', () => resolve({ error: 'window_closed' }));
  });
}

async function refreshAccessToken() {
  if (!spotifyRefresh) return false;

  const body = new URLSearchParams({
    grant_type:    'refresh_token',
    refresh_token: spotifyRefresh,
    client_id:     SPOTIFY_CLIENT_ID(),
  });

  try {
    const res  = await fetch(SPOTIFY_TOKEN_URL, {
      method:  'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body:    body.toString(),
    });
    const data = await res.json();

    spotifyToken = data.access_token;
    store.set('spotify.accessToken', spotifyToken);
    if (data.refresh_token) {
      spotifyRefresh = data.refresh_token;
      store.set('spotify.refreshToken', spotifyRefresh);
    }
    return true;
  } catch {
    return false;
  }
}

// ─── Polling ──────────────────────────────────────────────────────────────────

function startPolling() {
  if (pollInterval) clearInterval(pollInterval);
  pollInterval = setInterval(checkSpotify, 5000);
  checkSpotify();
}

function stopPolling() {
  if (pollInterval) {
    clearInterval(pollInterval);
    pollInterval = null;
  }
}

async function checkSpotify() {
  if (!spotifyToken) return;

  try {
    let res = await fetch('https://api.spotify.com/v1/me/player', {
      headers: { Authorization: `Bearer ${spotifyToken}` },
    });

    // 401 = token expired — try refreshing once
    if (res.status === 401) {
      const refreshed = await refreshAccessToken();
      if (!refreshed) { stopPolling(); return; }
      res = await fetch('https://api.spotify.com/v1/me/player', {
        headers: { Authorization: `Bearer ${spotifyToken}` },
      });
    }

    // 204 = no active device / nothing playing
    if (res.status === 204) {
      setMediaState(false);
      return;
    }

    const data      = await res.json();
    const isPlaying = data?.is_playing ?? false;
    setMediaState(isPlaying);

  } catch (err) {
    console.error('[PrismWall] Spotify poll error:', err.message);
  }
}

function setMediaState(isPlaying) {
  if (global.mediaPlaying === isPlaying) return;
  global.mediaPlaying = isPlaying;
  applyWallpaper();
  if (mainWindow) {
    mainWindow.webContents.send('media-changed', isPlaying);
  }
}

function disconnectSpotify() {
  stopPolling();
  spotifyToken   = null;
  spotifyRefresh = null;
  store.delete('spotify.accessToken');
  store.delete('spotify.refreshToken');
  global.mediaPlaying = false;
}

function isConnected() {
  return !!spotifyToken;
}

module.exports = { init, connectSpotify, disconnectSpotify, isConnected, stopPolling };
