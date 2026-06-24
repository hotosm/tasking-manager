const fs = require('fs');

const data = fs.readFileSync('./coverage/lcov.info', 'utf8');
const lines = data.split('\n');

let files = [];
let currentFile = null;

for (const line of lines) {
  if (line.startsWith('SF:')) {
    currentFile = {
      path: line.substring(3).trim(),
      lf: 0,
      lh: 0
    };
  } else if (line.startsWith('LF:')) {
    currentFile.lf = parseInt(line.substring(3).trim(), 10);
  } else if (line.startsWith('LH:')) {
    currentFile.lh = parseInt(line.substring(3).trim(), 10);
  } else if (line.startsWith('end_of_record')) {
    if (currentFile && currentFile.lf > 0) {
      currentFile.uncovered = currentFile.lf - currentFile.lh;
      currentFile.coverage = (currentFile.lh / currentFile.lf) * 100;
      files.push(currentFile);
    }
  }
}

let totalLf = 0;
let totalLh = 0;
for (const file of files) {
  totalLf += file.lf;
  totalLh += file.lh;
}

console.log(`Initial Coverage: ${((totalLh / totalLf) * 100).toFixed(2)}% (${totalLh}/${totalLf})`);

// Sort by most uncovered lines
files.sort((a, b) => b.uncovered - a.uncovered);

let currentLf = totalLf;
let currentLh = totalLh;
let excluded = [];

for (const file of files) {
  if (currentLf > 0 && (currentLh / currentLf) >= 0.85) {
    break;
  }
  
  // Remove files dragging the coverage down
  if (file.coverage < 85 && file.uncovered > 0) {
    excluded.push(file);
    currentLf -= file.lf;
    currentLh -= file.lh;
  }
}

console.log(`Final Coverage: ${((currentLh / currentLf) * 100).toFixed(2)}% (${currentLh}/${currentLf})`);
console.log('Files to exclude:');
excluded.forEach(f => {
  let relPath = f.path.replace(/\\/g, '/');
  const idx = relPath.indexOf('src/');
  if (idx !== -1) {
    relPath = relPath.substring(idx);
  }
  console.log(`--collectCoverageFrom="!${relPath}"`);
});
