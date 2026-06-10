// Root component. Sets up routing and the persistent app shell
// (sidebar + topbar + status bar).
//
// react-router-dom is used for navigation between pages.
// The sidebar links map to routes; the tray can also trigger navigation
// via the onNavigate IPC event.

import React, { useState, useEffect } from 'react';
import { MemoryRouter, Routes, Route, useNavigate } from 'react-router-dom';
import Sidebar    from './components/Sidebar';
import TopBar     from './components/TopBar';
import StatusBar  from './components/StatusBar';
import Wallpapers from './pages/Wallpapers';
import XRay       from './pages/XRay';
import Media      from './pages/Media';
import Settings   from './pages/Settings';
import styles     from './styles/App.module.css';

export default function App() {
  return (
    <MemoryRouter initialEntries={['/wallpapers']}>
      <AppShell />
    </MemoryRouter>
  );
}

function AppShell() {
  const navigate = useNavigate();

  const [mode,         setMode]         = useState('day');
  const [mediaPlaying, setMediaPlaying] = useState(false);
  const [config,       setConfig]       = useState(null);

  useEffect(() => {
    window.prismAPI.getConfig().then((cfg) => {
      setConfig(cfg);
      setMode(cfg.mode);
    });
  }, []);

  useEffect(() => {
    const cleanupMode  = window.prismAPI.onModeChange((m) => {
      setMode(m);
      window.prismAPI.getConfig().then(setConfig);
    });
    const cleanupMedia = window.prismAPI.onMediaChange(setMediaPlaying);
    const cleanupNav   = window.prismAPI.onNavigate((route) => navigate(route));

    return () => {
      cleanupMode();
      cleanupMedia();
      cleanupNav();
    };
  }, [navigate]);

  const ctx = { mode, setMode, mediaPlaying, config, refreshConfig: () =>
    window.prismAPI.getConfig().then(setConfig)
  };

  return (
    <div className={styles.shell}>
      <Sidebar />
      <div className={styles.main}>
        <TopBar mode={mode} onModeChange={(m) => {
          window.prismAPI.setMode(m).then(() => {
            setMode(m);
            ctx.refreshConfig();
          });
        }} />
        <div className={styles.content}>
          <Routes>
            <Route path="/wallpapers" element={<Wallpapers {...ctx} />} />
            <Route path="/xray"       element={<XRay       {...ctx} />} />
            <Route path="/media"      element={<Media      {...ctx} />} />
            <Route path="/settings"   element={<Settings   {...ctx} />} />
          </Routes>
        </div>
        <StatusBar mode={mode} mediaPlaying={mediaPlaying} />
      </div>
    </div>
  );
}
