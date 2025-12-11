#!/usr/bin/env node

const { spawnSync } = require('child_process');
const path = require('path');
const os = require('os');
const fs = require('fs');

console.log('\n🔧 Running Backend Tests...\n');

const backendDir = path.join(__dirname, '../../backend');
const venvDir = path.join(backendDir, '.venv');
const isWindows = os.platform() === 'win32';
const testFile = path.join(backendDir, 'test_backend_comprehensive.py');

console.log('Running from:', backendDir);
console.log('Platform:', isWindows ? 'Windows' : (os.platform() === 'darwin' ? 'macOS' : 'Linux'), '\n');

let result;

try {
  if (isWindows) {
    // Windows: Direct python execution with venv python.exe
    const pythonExe = path.join(venvDir, 'Scripts', 'python.exe');
    if (!fs.existsSync(pythonExe)) {
      throw new Error(`Python not found at: ${pythonExe}\n\nSetup venv with: python -m venv .venv`);
    }
    result = spawnSync(pythonExe, ['-m', 'pytest', testFile, '-v'], {
      cwd: backendDir,
      stdio: 'inherit',
    });
  } else {
    // Unix/macOS bash activation
    const activatePath = path.join(venvDir, 'bin', 'activate');
    const cmd = `cd "${backendDir}" && source "${activatePath}" && python -m pytest "${testFile}" -v`;
    result = spawnSync('bash', ['-c', cmd], {
      stdio: 'inherit',
    });
  }
} catch (error) {
  console.error('\n❌ Error running backend tests:');
  console.error(error.message);
  process.exit(1);
}

// Show test summary
console.log('\n✅ Backend tests completed!\n');

// Exit with the same code as pytest (0 = all pass, 1 = failures/errors)
process.exit(result.status || 0);
