import React from 'react';
import { NavLink } from 'react-router-dom';
import styles from './Sidebar.module.css';

const NAV = [
  { to: '/wallpapers', icon: '⊞', label: 'Wallpapers' },
  { to: '/xray',       icon: '▣', label: 'X-ray layers' },
  { to: '/media',      icon: '♫', label: 'Media triggers' },
  { to: '/settings',   icon: '⚙', label: 'Settings' },
];

export default function Sidebar() {
  return (
    <aside className={styles.sidebar}>
      <div className={styles.logo}>
        <span className={styles.logoMark}>◈</span>
        <div>
          <div className={styles.logoName}>PrismWall</div>
          <div className={styles.logoVersion}>v0.1.0</div>
        </div>
      </div>

      <nav className={styles.nav}>
        {NAV.map(({ to, icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `${styles.navItem} ${isActive ? styles.active : ''}`
            }
          >
            <span className={styles.icon}>{icon}</span>
            {label}
          </NavLink>
        ))}
      </nav>

      <div className={styles.spacer} />
      <div className={styles.bottom}>
        <div className={styles.privateLabel}>private project</div>
      </div>
    </aside>
  );
}
