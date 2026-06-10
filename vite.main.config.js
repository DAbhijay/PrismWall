import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    rollupOptions: {
      external: ['electron', 'wallpaper', 'electron-store', 'electron-updater'],
    },
  },
});
