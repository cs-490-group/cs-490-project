#!/usr/bin/env node

const { spawnSync } = require('child_process');
const path = require('path');
const os = require('os');

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  
  bgRed: '\x1b[41m',
  bgGreen: '\x1b[42m',
  bgYellow: '\x1b[43m',
  bgBlue: '\x1b[44m',
  bgCyan: '\x1b[46m',
};

const log = (color, text) => console.log(`${color}${text}${colors.reset}`);
const table = (data) => console.table(data);

let frontendResults = null;
let backendResults = null;

// Parse frontend test output
function runFrontendTests() {
  log(colors.cyan + colors.bright, '\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  log(colors.cyan + colors.bright, '🧪 FRONTEND TESTS');
  log(colors.cyan + colors.bright, '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  const result = spawnSync('npm', ['test', '--', '--watchAll=false', '--passWithNoTests'], {
    cwd: path.join(__dirname, '..'),
    stdio: 'pipe',
    encoding: 'utf-8',
  });

  const output = result.stdout + result.stderr;
  
  // Parse results - Jest format can vary, so try multiple patterns
  let suiteMatch = output.match(/Test Suites:.*?(\d+) passed.*?(\d+) total/);
  let testMatch = output.match(/Tests:.*?(\d+) passed.*?(\d+) total/);
  let failedTestMatch = output.match(/Tests:.*?(\d+) failed.*?(\d+) passed/);
  let timeMatch = output.match(/Time:\s+([\d.]+\s+s)/);

  // Calculate actual totals
  let passed = 0;
  let total = 0;
  let suitePassed = 0;
  let suiteTotal = 0;

  if (testMatch) {
    passed = parseInt(testMatch[1]);
    total = parseInt(testMatch[2]);
  }
  if (suiteMatch) {
    suitePassed = parseInt(suiteMatch[1]);
    suiteTotal = parseInt(suiteMatch[2]);
  }
  // Handle failed count in tests
  if (failedTestMatch) {
    const failed = parseInt(failedTestMatch[1]);
    total = passed + failed;
  }

  frontendResults = {
    passed: passed,
    total: total,
    suitePassed: suitePassed,
    suiteTotal: suiteTotal,
    time: timeMatch ? timeMatch[1] : 'N/A',
    exitCode: result.status,
  };

  // Print output
  console.log(output);

  return result.status;
}

// Parse backend test output
function runBackendTests() {
  log(colors.magenta + colors.bright, '\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  log(colors.magenta + colors.bright, '🔧 BACKEND TESTS');
  log(colors.magenta + colors.bright, '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  const backendDir = path.join(__dirname, '../../backend');
  const rootDir = path.join(__dirname, '../../');
  const venvDir = path.join(rootDir, '.venv');
  const isWindows = os.platform() === 'win32';
  const fs = require('fs');

  let result;

  try {
    if (isWindows) {
      // Windows: Direct python execution with venv python.exe
      const pythonExe = path.join(venvDir, 'Scripts', 'python.exe');
      if (!fs.existsSync(pythonExe)) {
        throw new Error(`Python not found at: ${pythonExe}. Run: python -m venv .venv`);
      }
      result = spawnSync(pythonExe, ['-m', 'pytest', 'test_backend.py', 'test_backend_comprehensive.py', 'test_backend_extended.py', '-v', '--tb=short'], {
        cwd: backendDir,
        stdio: 'pipe',
        encoding: 'utf-8',
      });
    } else {
      // Unix/macOS bash activation - use root venv
      const activatePath = path.join(venvDir, 'bin', 'activate');
      const cmd = `cd "${backendDir}" && source "${activatePath}" && python -m pytest test_backend.py test_backend_comprehensive.py test_backend_extended.py -v --tb=short 2>&1`;
      result = spawnSync('bash', ['-c', cmd], {
        stdio: 'pipe',
        encoding: 'utf-8',
      });
    }
  } catch (error) {
    log(colors.yellow, `Backend test error: ${error.message}`);
    return;
  }

  const output = (result.stdout || '') + (result.stderr || '');

  // Parse results with null safety
  const passMatch = output ? output.match(/(\d+) passed/) : null;
  const failMatch = output ? output.match(/(\d+) failed/) : null;
  const timeMatch = output ? output.match(/in ([\d.]+)s/) : null;

  backendResults = {
    passed: passMatch ? parseInt(passMatch[1]) : 0,
    failed: failMatch ? parseInt(failMatch[1]) : 0,
    total: (passMatch ? parseInt(passMatch[1]) : 0) + (failMatch ? parseInt(failMatch[1]) : 0),
    time: timeMatch ? `${timeMatch[1]}s` : 'N/A',
    exitCode: result.status || 0,
  };

  // Print output
  if (output) {
    console.log(output);
  } else {
    log(colors.yellow, 'No test output received. Check if pytest is installed and venv is accessible.');
  }

  return result.status;
}

// Print unified summary
function printSummary() {
  log(colors.bright + colors.blue, '\n╔════════════════════════════════════════════════════════════════╗');
  log(colors.bright + colors.blue, '║            📊 UNIFIED TEST RESULTS SUMMARY                      ║');
  log(colors.bright + colors.blue, '╚════════════════════════════════════════════════════════════════╝\n');

  // Frontend Summary Table
  log(colors.cyan + colors.bright, '🎨 FRONTEND TEST SUITE');
  const frontendTable = {
    'Test Files': `${frontendResults.suitePassed}/${frontendResults.suiteTotal}`,
    'Total Tests': `${frontendResults.passed}/${frontendResults.total}`,
    'Execution Time': frontendResults.time,
    'Status': frontendResults.passed === frontendResults.total ? 
      `${colors.green}✅ PASSED${colors.reset}` : 
      `${colors.yellow}⚠️ FAILED (${frontendResults.total - frontendResults.passed})${colors.reset}`,
  };
  console.table(frontendTable);

  // Backend Summary Table
  log(colors.magenta + colors.bright, '🔧 BACKEND TEST SUITE');
  const backendTable = {
    'Total Tests': `${backendResults.passed}/${backendResults.total}`,
    'Passed': `${colors.green}${backendResults.passed}${colors.reset}`,
    'Failed': backendResults.failed > 0 ? 
      `${colors.yellow}${backendResults.failed}${colors.reset}` : 
      `${colors.green}0${colors.reset}`,
    'Execution Time': backendResults.time,
    'Status': backendResults.failed === 0 ? 
      `${colors.green}✅ PASSED${colors.reset}` : 
      `${colors.yellow}⚠️ FAILED (${backendResults.failed})${colors.reset}`,
  };
  console.table(backendTable);

  // Combined Statistics with visual emphasis
  log(colors.bright + colors.green, '\n📈 COMBINED STATISTICS\n');
  const totalPassed = frontendResults.passed + backendResults.passed;
  const totalTests = frontendResults.total + backendResults.total;
  const totalFailed = (frontendResults.total - frontendResults.passed) + backendResults.failed;
  const passRate = ((totalPassed / totalTests) * 100).toFixed(1);
  
  const combinedTable = {
    'Frontend Tests': `${frontendResults.passed}/${frontendResults.total} passed`,
    'Backend Tests': `${backendResults.passed}/${backendResults.total} passed`,
    '────────────────': '────────────────────────',
    'Total Tests': `${totalTests}`,
    'Passed': `${colors.green}✅ ${totalPassed}${colors.reset}`,
    'Failed': totalFailed > 0 ? 
      `${colors.yellow}❌ ${totalFailed}${colors.reset}` : 
      `${colors.green}✅ 0${colors.reset}`,
    'Pass Rate': `${passRate}%`,
    'Overall': totalFailed === 0 ? 
      `${colors.bright}${colors.green}✅ ALL TESTS PASSED${colors.reset}` : 
      `${colors.bright}${colors.yellow}⚠️ SOME TESTS FAILED${colors.reset}`,
  };
  console.table(combinedTable);

  // Breakdown by component
  log(colors.bright + colors.cyan, '\n🔍 DETAILED BREAKDOWN\n');
  console.log(`
${colors.cyan}┌─ FRONTEND${colors.reset}
${colors.cyan}│${colors.reset}  Tests Passed: ${colors.green}${frontendResults.passed}${colors.reset}
${colors.cyan}│${colors.reset}  Tests Failed: ${frontendResults.total - frontendResults.passed > 0 ? colors.yellow : colors.green}${frontendResults.total - frontendResults.passed}${colors.reset}
${colors.cyan}│${colors.reset}  Test Suites:  ${frontendResults.suiteTotal}
${colors.cyan}│${colors.reset}  Time:         ${frontendResults.time}
${colors.cyan}└${colors.reset}

${colors.magenta}┌─ BACKEND${colors.reset}
${colors.magenta}│${colors.reset}  Tests Passed: ${colors.green}${backendResults.passed}${colors.reset}
${colors.magenta}│${colors.reset}  Tests Failed: ${backendResults.failed > 0 ? colors.yellow : colors.green}${backendResults.failed}${colors.reset}
${colors.magenta}│${colors.reset}  Total Tests:  ${backendResults.total}
${colors.magenta}│${colors.reset}  Time:         ${backendResults.time}
${colors.magenta}└${colors.reset}

${colors.bright}${colors.blue}┌─ COMBINED TOTAL${colors.reset}
${colors.bright}${colors.blue}│${colors.reset}  All Tests:    ${totalTests}
${colors.bright}${colors.blue}│${colors.reset}  Passed:       ${colors.green}${totalPassed}${colors.reset}
${colors.bright}${colors.blue}│${colors.reset}  Failed:       ${totalFailed > 0 ? colors.yellow : colors.green}${totalFailed}${colors.reset}
${colors.bright}${colors.blue}│${colors.reset}  Pass Rate:    ${passRate}%
${colors.bright}${colors.blue}└${colors.reset}
  `);

  // Final status
  console.log('');
  if (totalFailed === 0) {
    log(colors.bright + colors.green, '╔════════════════════════════════════════════════════════════════╗');
    log(colors.bright + colors.green, '║         ✅ SUCCESS! ALL TESTS PASSED ✅                       ║');
    log(colors.bright + colors.green, '╚════════════════════════════════════════════════════════════════╝');
  } else {
    log(colors.bright + colors.yellow, '╔════════════════════════════════════════════════════════════════╗');
    log(colors.bright + colors.yellow, `║  ⚠️  ${totalFailed} TEST(S) FAILED - SEE DETAILS ABOVE  ⚠️        ║`);
    log(colors.bright + colors.yellow, '╚════════════════════════════════════════════════════════════════╝');
  }

  // Exit code legend
  log(colors.dim, '\n═══════════════════════════════════════════════════════════════');
  console.log(`
${colors.green}✅ PASSED${colors.reset}  = All tests in suite passed
${colors.yellow}⚠️  FAILED${colors.reset}  = One or more tests failed  
${colors.red}❌ ERROR${colors.reset}   = Critical error running tests

${colors.dim}Test Breakdown:${colors.reset}
  • Frontend: ${frontendResults.passed}/${frontendResults.total} tests passing
  • Backend:  ${backendResults.passed}/${backendResults.total} tests passing
  • Overall:  ${totalPassed}/${totalTests} tests passing (${passRate}%)
  `);

  log(colors.dim, '═══════════════════════════════════════════════════════════════\n');

  // Exit with appropriate code
  const exitCode = frontendResults.exitCode !== 0 || backendResults.exitCode !== 0 ? 1 : 0;
  process.exit(exitCode);
}

// Main execution
async function main() {
  log(colors.bright + colors.blue, '\n╔════════════════════════════════════════════════════════════════╗');
  log(colors.bright + colors.blue, '║          RUNNING UNIFIED TEST SUITE (Frontend + Backend)        ║');
  log(colors.bright + colors.blue, '╚════════════════════════════════════════════════════════════════╝');

  const frontendExit = runFrontendTests();
  const backendExit = runBackendTests();

  printSummary();
}

main();
