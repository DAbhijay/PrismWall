import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig({
  plugins: [react()],
  root: join(__dirname, 'src/renderer'),
  base: './',
  build: {
    outDir: join(__dirname, '.vite/renderer/main_window'),
    emptyOutDir: true,
  },
});