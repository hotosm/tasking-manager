// vitest.config.ts
import react from '@vitejs/plugin-react-swc'
import { defineConfig } from 'vitest/config'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  test: {
    globals: true,
    clearMocks: true,
    setupFiles: ['./src/setup.ts', './src/network/tests/server.ts'],
    environment: "happy-dom",
    testTimeout: 20000
  },
  envPrefix: 'REACT_APP_'
})
