const { spawnSync } = require('child_process');
const path = require('path');

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
}

module.exports = globalSetup;
