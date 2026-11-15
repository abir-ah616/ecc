import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  root: path.resolve(import.meta.dirname, 'mobile/poster-src'),
  base: './',
  plugins: [react(), tailwindcss()],
  build: {
    outDir: path.resolve(import.meta.dirname, 'mobile/assets/poster'),
    emptyOutDir: true,
    assetsInlineLimit: 0,
  },
});
