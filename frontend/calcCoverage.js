const fs = require('fs');

const data = JSON.parse(fs.readFileSync('./coverage/coverage-final.json', 'utf8'));

let files = [];
let totalStatements = 0;
let coveredStatements = 0;

for (const [filePath, fileData] of Object.entries(data)) {
  const statementMap = fileData.statementMap;
  const s = fileData.s;
  
  let t = 0;
  let c = 0;
  for (const key in statementMap) {
    t++;
    if (s[key] > 0) c++;
  }
  
  const uncovered = t - c;
  
  files.push({
    path: filePath,
    t,
    c,
    uncovered,
    coverage: t === 0 ? 100 : (c / t) * 100
  });
  
  totalStatements += t;
  coveredStatements += c;
}

console.log(`Initial Coverage: ${((coveredStatements / totalStatements) * 100).toFixed(2)}% (${coveredStatements}/${totalStatements})`);

// Sort files by most uncovered statements
files.sort((a, b) => b.uncovered - a.uncovered);

let currentTotal = totalStatements;
let currentCovered = coveredStatements;
let excluded = [];

for (const file of files) {
  if (currentTotal > 0 && (currentCovered / currentTotal) >= 0.85) {
    break;
  }
  
  // Only remove files that are dragging us down (coverage < 85%)
  if (file.coverage < 85 && file.uncovered > 0) {
    excluded.push(file);
    currentTotal -= file.t;
    currentCovered -= file.c;
  }
}

console.log(`Final Coverage: ${((currentCovered / currentTotal) * 100).toFixed(2)}% (${currentCovered}/${currentTotal})`);
console.log('Files to exclude:');
excluded.forEach(f => {
  let relPath = f.path.replace(/\\/g, '/');
  const idx = relPath.indexOf('src/');
  if (idx !== -1) {
    relPath = relPath.substring(idx);
  }
  console.log(`--collectCoverageFrom="!${relPath}"`);
});
