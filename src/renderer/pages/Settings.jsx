import React, { useState, useEffect } from 'react';
import styles from './Settings.module.css';

export default function Settings({ config, refreshConfig }) {
  const [keybind,    setKeybind]    = useState(config?.keybind    ?? 'CommandOrControl+Shift+W');
  const [autoUpdate, setAutoUpdate] = useState(config?.autoUpdate ?? true);
  const [saved,      setSaved]      = useState(false);

  useEffect(() => {
    if (!config) return;
    setKeybind(config.keybind       ?? 'CommandOrControl+Shift+W');
    setAutoUpdate(config.autoUpdate ?? true);
  }, [config]);

  async function saveKeybind() {
    await window.prismAPI.setKeybind(keybind.trim());
    showSaved();
  }

  function showSaved() {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className={styles.page}>
      <h2 className={styles.heading}>Settings</h2>

      {/* Keybind */}
      <div className={styles.section}>
        <div className={styles.sectionTitle}>Global keybind</div>
        <p className={styles.sectionDesc}>
          Toggles between Day and Night mode from anywhere on your desktop,
          even when PrismWall is hidden in the tray.
        </p>
        <div className={styles.fieldRow}>
          <input
            className={styles.input}
            type="text"
            value={keybind}
            onChange={(e) => setKeybind(e.target.value)}
            placeholder="e.g. CommandOrControl+Shift+W"
          />
          <button className={styles.saveBtn} onClick={saveKeybind}>
            {saved ? '✓ Saved' : 'Save'}
          </button>
        </div>
        <p className={styles.fieldHint}>
          Use Electron accelerator format: <code>CommandOrControl</code>, <code>Alt</code>,
          <code>Shift</code>, <code>F1</code>–<code>F12</code>, letter keys.
          Example: <code>CommandOrControl+Shift+W</code>
        </p>
      </div>

      {/* About */}
      <div className={styles.section}>
        <div className={styles.sectionTitle}>About</div>
        <div className={styles.aboutRow}>
          <span className={styles.aboutLabel}>Version</span>
          <span className={styles.aboutValue}>0.1.0 (private alpha)</span>
        </div>
        <div className={styles.aboutRow}>
          <span className={styles.aboutLabel}>Platform</span>
          <span className={styles.aboutValue}>{window.navigator.platform}</span>
        </div>
        <div className={styles.aboutRow}>
          <span className={styles.aboutLabel}>Config location</span>
          <span className={styles.aboutValue}>electron-store (JSON)</span>
        </div>
      </div>
    </div>
  );
}
