// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';

export default defineConfig({
  plugins: [react()],
  envPrefix: 'REACT_APP_',
  server: {
    port: 3000
  },
  resolve: {
    extensions: ['.js', '.jsx', '.ts', '.tsx'],
    alias: {
      '@': new URL('./src/', import.meta.url).pathname,
      '@Api': new URL('./src/api/', import.meta.url).pathname,
      '@Assets': new URL('./src/assets/', import.meta.url).pathname,
      '@Components': new URL('./src/components/', import.meta.url).pathname,
      '@Config': new URL('./src/config/', import.meta.url).pathname,
      '@Hooks': new URL('./src/hooks/', import.meta.url).pathname,
      '@Network': new URL('./src/network/', import.meta.url).pathname,
      '@Store': new URL('./src/store/', import.meta.url).pathname,
      '@Utils': new URL('./src/utils/', import.meta.url).pathname,
      '@Views': new URL('./src/views/', import.meta.url).pathname
    },
  },
});
