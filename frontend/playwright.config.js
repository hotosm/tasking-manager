// @ts-check
const { defineConfig, devices } = require('@playwright/test');

const isRealBackend = process.env.E2E_BACKEND === 'real';

module.exports = defineConfig({
  testDir: './e2e',
  globalSetup: require.resolve('./e2e/global-setup.js'),
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: 'list',
  use: {
    baseURL: 'http://127.0.0.1:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 15000,
    navigationTimeout: 15000,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npx craco start',
    url: 'http://127.0.0.1:3000',
    reuseExistingServer: true,
    timeout: 300_000,
    env: {
      E2E_BACKEND: process.env.E2E_BACKEND || '',
      TM_APP_API_URL: isRealBackend
        ? 'http://127.0.0.1:5000/api'
        : 'http://127.0.0.1:3000/api',
    },
  },
});
