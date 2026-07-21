const { spawnSync } = require('child_process');
const http = require('http');
const path = require('path');

function waitForUrl(url, timeoutMs = 60000) {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    const interval = 500;

    const tryConnect = () => {
      http
        .get(url, { timeout: 2000 }, (res) => {
          if (res.statusCode >= 200 && res.statusCode < 400) {
            resolve();
          } else {
            retry();
          }
        })
        .on('error', retry);
    };

    const retry = () => {
      if (Date.now() - start > timeoutMs) {
        reject(new Error(`Timeout waiting for ${url}`));
        return;
      }
      setTimeout(tryConnect, interval);
    };

    tryConnect();
  });
}

async function globalSetup() {
  if (process.env.E2E_BACKEND !== 'real') {
    return;
  }

  const repoRoot = path.resolve(__dirname, '..', '..');
  console.log('[E2E globalSetup] Reseeding real backend database...');

  const result = spawnSync(
    'docker',
    [
      'compose',
      '--env-file',
      'tasking-manager.env',
      '-f',
      'docker-compose.yml',
      '-f',
      'docker-compose.e2e.yml',
      'exec',
      'tm-backend',
      'python',
      'scripts/e2e-seed.py',
    ],
    {
      cwd: repoRoot,
      stdio: 'inherit',
      shell: false,
    },
  );

  if (result.status !== 0) {
    throw new Error(
      `[E2E globalSetup] Seed failed with exit code ${result.status}. ` +
        'Make sure the backend containers are running.',
    );
  }

  console.log('[E2E globalSetup] Seed completed.');
  console.log('[E2E globalSetup] Waiting for frontend dev server to be ready...');
  await waitForUrl('http://127.0.0.1:3000');
  console.log('[E2E globalSetup] Frontend is ready.');
}

module.exports = globalSetup;
