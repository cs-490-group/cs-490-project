#!/usr/bin/env node

const { spawnSync } = require('child_process');
const path = require('path');
const os = require('os');
const fs = require('fs');

// Color codes
const c = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
};

// Pretty print utilities
const print = {
  header: (title) => {
    console.log(`\n${c.bright}${c.blue}╔${'═'.repeat(title.length + 4)}╗${c.reset}`);
    console.log(`${c.bright}${c.blue}║  ${title}  ║${c.reset}`);
    console.log(`${c.bright}${c.blue}╚${'═'.repeat(title.length + 4)}╝${c.reset}\n`);
  },
  section: (title, color = c.cyan) => {
    console.log(`\n${c.bright}${color}━ ${title}${c.reset}`);
  },
  row: (label, value, valueColor = c.white) => {
    console.log(`  ${c.dim}•${c.reset} ${label.padEnd(20)} ${valueColor}${value}${c.reset}`);
  },
  success: (msg) => console.log(`${c.green}✅ ${msg}${c.reset}`),
  warning: (msg) => console.log(`${c.yellow}⚠️  ${msg}${c.reset}`),
  error: (msg) => console.log(`${c.red}❌ ${msg}${c.reset}`),
  info: (msg) => console.log(`${c.cyan}ℹ️  ${msg}${c.reset}`),
};

let results = {
  frontend: null,
  backend: null,
};

// Run frontend tests
function runFrontendTests() {
  print.section('FRONTEND TESTS', c.cyan);
  
  const result = spawnSync('npm', ['test', '--', '--watchAll=false', '--passWithNoTests'], {
    cwd: path.join(__dirname, '..'),
    stdio: 'pipe',
    encoding: 'utf-8',
  });

  const output = 
    (result.stdout ? result.stdout.toString() : '') +
    (result.stdeer ? result.stdout.toString() : '');
  
  const testMatch = output.match(/Tests:\s+(\d+) passed, (\d+) total/);
  const timeMatch = output.match(/Time:\s+([\d.]+\s+s)/);

  results.frontend = {
    passed: testMatch ? parseInt(testMatch[1]) : 0,
    total: testMatch ? parseInt(testMatch[2]) : 0,
    time: timeMatch ? timeMatch[1] : '0s',
    exitCode: result.status,
  };

  // Print progress
  console.log(output);

  return result.status;
}

// Run backend tests
function runBackendTests() {
  print.section('BACKEND TESTS', c.magenta);
  
  const backendDir = path.join(__dirname, '../../backend');
  const venvDir = path.join(backendDir, '.venv');
  const isWindows = os.platform() === 'win32';
  const testFile = path.join(backendDir, 'test_backend_comprehensive.py');
  
  let result;
  
  try {
    if (isWindows) {
      // Windows: Direct python execution with venv python.exe
      const pythonExe = path.join(venvDir, 'Scripts', 'python.exe');
      if (!fs.existsSync(pythonExe)) {
        throw new Error(`Python not found at: ${pythonExe}. Run: python -m venv .venv`);
      }
      result = spawnSync(pythonExe, ['-m', 'pytest', testFile, '-v', '--tb=line'], {
        cwd: backendDir,
        stdio: 'pipe',
        encoding: 'utf-8',
      });
    } else {
      // Unix/macOS bash activation
      const activatePath = path.join(venvDir, 'bin', 'activate');
      const cmd = `cd "${backendDir}" && source "${activatePath}" && python -m pytest "${testFile}" -v --tb=line 2>&1`;
      result = spawnSync('bash', ['-c', cmd], {
        stdio: 'pipe',
        encoding: 'utf-8',
      });
    }
  } catch (error) {
    print.error(`Backend test error: ${error.message}`);
    return 1;
  }

  const output = (result.stdout || '') + (result.stderr || '');

  // Safe regex matching with null checks
  const passMatch = output ? output.match(/(\d+) passed/) : null;
  const failMatch = output ? output.match(/(\d+) failed/) : null;
  const timeMatch = output ? output.match(/in ([\d.]+)s/) : null;

  results.backend = {
    passed: passMatch ? parseInt(passMatch[1]) : 0,
    failed: failMatch ? parseInt(failMatch[1]) : 0,
    total: (passMatch ? parseInt(passMatch[1]) : 0) + (failMatch ? parseInt(failMatch[1]) : 0),
    time: timeMatch ? `${timeMatch[1]}s` : '0s',
    exitCode: result.status || 0,
  };

  // Print output
  if (output) {
    console.log(output);
  } else {
    print.warning('No test output received. Check if pytest is installed and venv is accessible.');
  }

  return result.status || 0;
}

// Print final summary
function printFinalSummary() {
  const frontend = results.frontend;
  const backend = results.backend;
  
  const totalPassed = frontend.passed + backend.passed;
  const totalTests = frontend.total + backend.total;
  const totalFailed = (frontend.total - frontend.passed) + backend.failed;
  const passRate = ((totalPassed / totalTests) * 100).toFixed(1);

  print.header('TEST RESULTS SUMMARY');

  // Frontend section
  print.section('FRONTEND', c.cyan);
  print.row('Tests Passed', `${frontend.passed}/${frontend.total}`, c.green);
  print.row('Execution Time', frontend.time, c.white);
  if (frontend.total === frontend.passed) {
    print.row('Status', 'ALL PASS', c.green);
  } else {
    print.row('Status', `${frontend.total - frontend.passed} FAILED`, c.yellow);
  }

  // Backend section
  print.section('BACKEND', c.magenta);
  print.row('Tests Passed', `${backend.passed}/${backend.total}`, c.green);
  print.row('Tests Failed', `${backend.failed}`, backend.failed > 0 ? c.yellow : c.green);
  print.row('Execution Time', backend.time, c.white);
  if (backend.failed === 0) {
    print.row('Status', 'ALL PASS', c.green);
  } else {
    print.row('Status', `${backend.failed} FAILED`, c.yellow);
  }

  // Combined stats
  print.section('COMBINED METRICS', c.blue);
  print.row('Total Tests', `${totalTests}`, c.white);
  print.row('Tests Passed', `${totalPassed}`, c.green);
  print.row('Tests Failed', `${totalFailed}`, totalFailed > 0 ? c.yellow : c.green);
  print.row('Pass Rate', `${passRate}%`, passRate >= 99 ? c.green : c.yellow);
  print.row('Total Time', `${(parseFloat(frontend.time) + parseFloat(backend.time)).toFixed(2)}s`, c.white);

  // Overall status
  console.log(`\n${c.bright}${'═'.repeat(50)}${c.reset}`);
  if (totalFailed === 0) {
    console.log(`${c.bright}${c.green}✅  ALL TESTS PASSED${c.reset}`);
  } else {
    console.log(`${c.bright}${c.yellow}⚠️  ${totalFailed} TEST(S) FAILED${c.reset}`);
  }
  console.log(`${c.bright}${'═'.repeat(50)}${c.reset}\n`);

  // Command reference
  print.section('QUICK COMMANDS', c.cyan);
  console.log(`  ${c.dim}npm run test${c.reset}              # Frontend only`);
  console.log(`  ${c.dim}npm run test:watch${c.reset}        # Frontend watch mode`);
  console.log(`  ${c.dim}npm run test:coverage${c.reset}     # Frontend coverage`);
  console.log(`  ${c.dim}npm run test:unified${c.reset}      # All tests (with details)`);
  console.log(`  ${c.dim}npm run test:all${c.reset}          # All tests (with details)\n`);

  // Exit with appropriate code
  const exitCode = frontend.exitCode !== 0 || backend.exitCode !== 0 ? 1 : 0;
  process.exit(exitCode);
}

// Main
print.header('RUNNING UNIFIED TEST SUITE');
const frontendExit = runFrontendTests();
const backendExit = runBackendTests();
printFinalSummary();
