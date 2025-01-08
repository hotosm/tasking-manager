// vitest.config.ts
import react from '@vitejs/plugin-react-swc'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    clearMocks: true,
    setupFiles: ['./src/setup.ts', './src/network/tests/server.ts'],
    environment: "jsdom",
    testTimeout: 20000
  },
})
