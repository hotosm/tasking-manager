const fs = require('fs');
const path = require('path');

function loadE2ESeed() {
  try {
    const seedPath = path.join(__dirname, '..', '.e2e-seed.json');
    return JSON.parse(fs.readFileSync(seedPath, 'utf8'));
  } catch (err) {
    return null;
  }
}

const seed = loadE2ESeed();
const isRealBackend = process.env.E2E_BACKEND === 'real' && seed != null;

module.exports = { seed, isRealBackend };
