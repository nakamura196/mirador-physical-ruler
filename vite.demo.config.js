import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { demoBase } from './site.config.mjs';

// GitHub Pages デモ用ビルド設定 (公開先は site.config.mjs の SITE_URL)
export default defineConfig({
  plugins: [
    react({
      include: ['**/*.jsx', '**/*.js'],
    }),
  ],
  base: demoBase(),
  optimizeDeps: {
    esbuildOptions: {
      loader: { '.js': 'jsx' },
    },
  },
  build: {
    outDir: 'docs',
  },
});
