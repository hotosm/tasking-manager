// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';

export default defineConfig({
  plugins: [react()],
  envPrefix: 'REACT_APP_',
  server: {
    port: 3000
  }
});
