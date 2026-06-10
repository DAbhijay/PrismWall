import React, { useState, useEffect } from 'react';
import styles from './XRay.module.css';

export default function XRay({ config, refreshConfig }) {
  const xray = config?.xray ?? {};

  const [enabled,     setEnabled]     = useState(xray.enabled     ?? false);
  const [topLayer,    setTopLayer]    = useState(xray.topLayer     ?? null);
  const [bottomLayer, setBottomLayer] = useState(xray.bottomLayer ?? null);
  const [opacity,     setOpacity]     = useState(xray.opacity     ?? 0.5);

  useEffect(() => {
    if (!config) return;
    setEnabled(config.xray?.enabled     ?? false);
    setTopLayer(config.xray?.topLayer   ?? null);
    setBottomLayer(config.xray?.bottomLayer ?? null);
    setOpacity(config.xray?.opacity     ?? 0.5);
  }, [config]);

  async function pickLayer(which) {
    const filePath = await window.prismAPI.pickFile();
    if (!filePath) return;
    const update = which === 'top'
      ? { topLayer: filePath }
      : { bottomLayer: filePath };
    await window.prismAPI.setXray(update);
    refreshConfig();
  }

  async function handleToggle() {
    const next = !enabled;
    setEnabled(next);
    await window.prismAPI.setXray({ enabled: next });
    refreshConfig();
  }

  async function handleOpacity(val) {
    setOpacity(val);
    await window.prismAPI.setXray({ opacity: val });
  }

  const filename = (p) => p ? p.split(/[\\/]/).pop() : null;

  return (
    <div className={styles.page}>
      <div className={styles.experimentalBanner}>
        ⚗ Experimental feature — available in v1.5
      </div>

      <div className={styles.headerRow}>
        <div>
          <h2 className={styles.heading}>X-ray layers</h2>
          <p className={styles.sub}>Composite two images together on your desktop.</p>
        </div>
        <button
          className={`${styles.toggleBtn} ${enabled ? styles.on : ''}`}
          onClick={handleToggle}
        >
          {enabled ? 'Enabled' : 'Disabled'}
        </button>
      </div>

      <div className={`${styles.composer} ${!enabled ? styles.disabled : ''}`}>
        {/* Top layer */}
        <div className={styles.layerSlot}>
          <div className={styles.layerLabel}>Top layer (foreground)</div>
          <div
            className={`${styles.layerBox} ${topLayer ? styles.filled : ''}`}
            onClick={() => enabled && pickLayer('top')}
          >
            {topLayer ? (
              <img src={`file://${topLayer}`} alt="Top layer" className={styles.layerThumb} />
            ) : (
              <span className={styles.layerEmpty}>＋ Choose image</span>
            )}
          </div>
          {topLayer && <div className={styles.layerFile}>{filename(topLayer)}</div>}
        </div>

        <div className={styles.blendIcon}>＋</div>

        {/* Bottom layer */}
        <div className={styles.layerSlot}>
          <div className={styles.layerLabel}>Bottom layer (background)</div>
          <div
            className={`${styles.layerBox} ${bottomLayer ? styles.filled : ''}`}
            onClick={() => enabled && pickLayer('bottom')}
          >
            {bottomLayer ? (
              <img src={`file://${bottomLayer}`} alt="Bottom layer" className={styles.layerThumb} />
            ) : (
              <span className={styles.layerEmpty}>＋ Choose image</span>
            )}
          </div>
          {bottomLayer && <div className={styles.layerFile}>{filename(bottomLayer)}</div>}
        </div>
      </div>

      {/* Opacity slider */}
      <div className={`${styles.opacityRow} ${!enabled ? styles.disabled : ''}`}>
        <label className={styles.opacityLabel}>
          Top layer opacity: <strong>{Math.round(opacity * 100)}%</strong>
        </label>
        <input
          type="range"
          min={0} max={1} step={0.01}
          value={opacity}
          disabled={!enabled}
          onChange={(e) => handleOpacity(parseFloat(e.target.value))}
          className={styles.slider}
        />
      </div>

      <p className={styles.hint}>
        The compositor blends the two layers together and sets the result as your wallpaper.
        The output file is saved to your system temp folder and cleaned up automatically.
      </p>
    </div>
  );
}
