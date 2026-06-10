import React from 'react';
import { useLocation } from 'react-router-dom';
import styles from './TopBar.module.css';

const PAGE_TITLES = {
  '/wallpapers': 'Wallpapers',
  '/xray':       'X-ray layers',
  '/media':      'Media triggers',
  '/settings':   'Settings',
};

export default function TopBar({ mode, onModeChange }) {
  const { pathname } = useLocation();
  const title = PAGE_TITLES[pathname] ?? 'PrismWall';

  return (
    <header className={styles.topbar}>
      <h1 className={styles.title}>{title}</h1>

      <div className={styles.modeSwitcher}>
        <button
          className={`${styles.modeBtn} ${mode === 'day' ? styles.active : ''}`}
          onClick={() => onModeChange('day')}
        >
          ☀ Day
        </button>
        <button
          className={`${styles.modeBtn} ${styles.night} ${mode === 'night' ? styles.activeNight : ''}`}
          onClick={() => onModeChange('night')}
        >
          ☾ Night
        </button>
      </div>
    </header>
  );
}
