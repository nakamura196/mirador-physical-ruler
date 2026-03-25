import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// GitHub Pages デモ用ビルド設定
export default defineConfig({
  plugins: [
    react({
      include: ['**/*.jsx', '**/*.js'],
    }),
  ],
  base: '/mirador-physical-ruler/',
  optimizeDeps: {
    esbuildOptions: {
      loader: { '.js': 'jsx' },
    },
  },
  build: {
    outDir: 'docs',
  },
});
