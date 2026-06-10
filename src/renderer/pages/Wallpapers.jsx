import React from 'react';
import SlotCard from '../components/SlotCard';
import styles   from './Wallpapers.module.css';

// Slot definitions per mode — keeps the render logic clean
const SLOTS = {
  day: [
    { key: 'dayDefault', label: 'Default wallpaper', desc: 'Active all the time' },
    { key: 'dayMedia',   label: 'Media wallpaper',   desc: 'Swaps in when music or video is playing' },
  ],
  night: [
    { key: 'nightDefault', label: 'Default wallpaper', desc: 'Active all the time (night mode)' },
    { key: 'nightMedia',   label: 'Media wallpaper',   desc: 'Swaps in when music or video is playing' },
  ],
};

export default function Wallpapers({ mode, config, refreshConfig, mediaPlaying }) {
  const slots      = SLOTS[mode] ?? SLOTS.day;
  const wallpapers = config?.wallpapers ?? {};

  function activeSlotKey() {
    if (mode === 'day')   return mediaPlaying && wallpapers.dayMedia   ? 'dayMedia'   : 'dayDefault';
    if (mode === 'night') return mediaPlaying && wallpapers.nightMedia ? 'nightMedia' : 'nightDefault';
  }
  const currentKey = activeSlotKey();

  async function handlePick(slotKey) {
    const filePath = await window.prismAPI.pickFile();
    if (!filePath) return; // user cancelled dialog
    await window.prismAPI.setSlot(slotKey, filePath);
    refreshConfig();       // re-fetch config so thumbnail updates
  }

  return (
    <div className={styles.page}>
      <p className={styles.sectionLabel}>
        {mode === 'day' ? '☀ Day mode slots' : '☾ Night mode slots'}
      </p>

      <div className={styles.grid}>
        {slots.map(({ key, label, desc }) => (
          <SlotCard
            key={key}
            label={label}
            desc={desc}
            imagePath={wallpapers[key] ?? null}
            isActive={key === currentKey}
            onPick={() => handlePick(key)}
          />
        ))}
      </div>

      <p className={styles.hint}>
        Click a card to choose an image from your computer.
        {mode === 'night' && (
          <> Night mode is intended for your personal/NSFW wallpapers — it never activates automatically.</>
        )}
      </p>
    </div>
  );
}
