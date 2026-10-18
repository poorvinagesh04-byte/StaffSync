const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const testsDir = path.join(__dirname);
const testFiles = fs
  .readdirSync(testsDir)
  .filter((f) => f.endsWith('.test.js'))
  .map((f) => path.join('tests', f));

if (testFiles.length === 0) {
  console.log('No test files found in tests/');
  process.exit(0);
}

console.log(`Running test files: ${testFiles.join(', ')}`);

const child = spawn(process.execPath, ['--test', ...testFiles], {
  stdio: 'inherit',
  cwd: path.join(__dirname, '..'),
});

child.on('close', (code) => {
  process.exit(code || 0);
});

