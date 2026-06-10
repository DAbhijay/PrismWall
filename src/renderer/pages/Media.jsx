import React, { useState, useEffect } from 'react';
import styles from './Media.module.css';

export default function Media({ config, refreshConfig, mediaPlaying }) {
  const [connecting,   setConnecting]   = useState(false);
  const [clientId,     setClientId]     = useState(config?.spotify?.clientId ?? '');
  const [isConnected,  setIsConnected]  = useState(!!config?.spotify?.accessToken);
  const [statusMsg,    setStatusMsg]    = useState('');

  useEffect(() => {
    setIsConnected(!!config?.spotify?.accessToken);
    setClientId(config?.spotify?.clientId ?? '');
  }, [config]);

  async function handleConnect() {
    if (!clientId.trim()) {
      setStatusMsg('Enter your Spotify Client ID first.');
      return;
    }
    await window.prismAPI.setSpotifyClientId(clientId.trim());
    setConnecting(true);
    setStatusMsg('Opening Spotify login...');
    const result = await window.prismAPI.connectSpotify();
    setConnecting(false);
    if (result.success) {
      setIsConnected(true);
      setStatusMsg('Connected! PrismWall will now swap wallpapers when music plays.');
      refreshConfig();
    } else {
      setStatusMsg(`Connection failed: ${result.error}`);
    }
  }

  async function handleDisconnect() {
    await window.prismAPI.disconnectSpotify();
    setIsConnected(false);
    setStatusMsg('Disconnected from Spotify.');
    refreshConfig();
  }

  return (
    <div className={styles.page}>
      <h2 className={styles.heading}>Media triggers</h2>
      <p className={styles.sub}>
        PrismWall watches for music or video playback and swaps to your media wallpaper slot automatically.
      </p>

      {/* Live status */}
      <div className={`${styles.statusCard} ${mediaPlaying ? styles.playing : ''}`}>
        <span className={styles.statusDot} />
        <span className={styles.statusText}>
          {mediaPlaying ? 'Media playing — media wallpaper active' : 'No media playing — default wallpaper active'}
        </span>
      </div>

      {/* Spotify section */}
      <div className={styles.section}>
        <div className={styles.sectionTitle}>
          <span className={styles.spotifyIcon}>♫</span> Spotify
        </div>
        <p className={styles.sectionDesc}>
          Connects via the Spotify Web API. You need a free Spotify Developer account
          to get a Client ID — it takes about 2 minutes.
        </p>

        {!isConnected ? (
          <>
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Spotify Client ID</label>
              <input
                className={styles.input}
                type="text"
                placeholder="Paste your client ID here"
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
              />
              <p className={styles.fieldHint}>
                Get one at{' '}
                <span
                  className={styles.link}
                  onClick={() => window.open?.('https://developer.spotify.com/dashboard')}
                >
                  developer.spotify.com/dashboard
                </span>
                {' '}→ Create App → Redirect URI: <code>prismwall://spotify-callback</code>
              </p>
            </div>

            <button
              className={styles.connectBtn}
              onClick={handleConnect}
              disabled={connecting}
            >
              {connecting ? 'Connecting...' : '♫ Connect Spotify'}
            </button>
          </>
        ) : (
          <div className={styles.connectedRow}>
            <span className={styles.connectedBadge}>✓ Connected</span>
            <button className={styles.disconnectBtn} onClick={handleDisconnect}>
              Disconnect
            </button>
          </div>
        )}

        {statusMsg && (
          <p className={styles.statusMsg}>{statusMsg}</p>
        )}
      </div>

      {/* YouTube — v1.5 placeholder */}
      <div className={`${styles.section} ${styles.comingSoon}`}>
        <div className={styles.sectionTitle}>
          ▶ YouTube / browser detection
          <span className={styles.badge}>v1.5</span>
        </div>
        <p className={styles.sectionDesc}>
          Detects YouTube playback via window title monitoring. Coming in v1.5.
        </p>
      </div>
    </div>
  );
}
