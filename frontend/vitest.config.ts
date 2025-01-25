// vitest.config.ts
import react from '@vitejs/plugin-react-swc'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    clearMocks: true,
    setupFiles: ['./src/setup.ts', './src/network/tests/server.ts'],
    environment: "happy-dom",
    testTimeout: 20000
  },
  resolve: {
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
  envPrefix: 'REACT_APP_'
})
