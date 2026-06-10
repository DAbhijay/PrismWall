import React from 'react';
import styles from './StatusBar.module.css';

export default function StatusBar({ mode, mediaPlaying }) {
  return (
    <footer className={styles.statusbar}>
      <span className={styles.dot} />
      <span className={styles.label}>Wallpaper active</span>

      <span className={styles.spacer} />

      {mediaPlaying && (
        <span className={styles.mediaBadge}>
          ♫ Media detected
        </span>
      )}

      <span className={styles.modeLabel}>
        {mode === 'day' ? '☀ Day mode' : '☾ Night mode'}
      </span>
    </footer>
  );
}
