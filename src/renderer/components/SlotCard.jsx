import React from 'react';
import styles from './SlotCard.module.css';

export default function SlotCard({ label, desc, imagePath, onPick, isActive }) {
  const filename = imagePath ? imagePath.split(/[\\/]/).pop() : null;

  return (
    <div
      className={`${styles.card} ${imagePath ? styles.filled : ''}`}
      onClick={onPick}
      title={imagePath ? `Click to change: ${imagePath}` : `Click to choose ${label}`}
    >
      <div className={styles.preview}>
        {imagePath ? (
          <>
            <img
              src={`file://${imagePath}`}
              alt={label}
              className={styles.thumbnail}
            />
            {isActive && <span className={styles.activeDot} title="Currently active" />}
            <span className={styles.filename}>{filename}</span>
          </>
        ) : (
          <div className={styles.empty}>
            <span className={styles.plusIcon}>＋</span>
            <span className={styles.emptyLabel}>Choose image</span>
          </div>
        )}
      </div>

      <div className={styles.meta}>
        <div className={styles.slotLabel}>{label}</div>
        <div className={styles.slotDesc}>{desc}</div>
      </div>
    </div>
  );
}
