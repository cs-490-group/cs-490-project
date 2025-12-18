const fs = require('fs');
const path = require('path');

function getArgValue(name) {
  const idx = process.argv.indexOf(name);
  if (idx === -1) return null;
  return process.argv[idx + 1] || null;
}

const thresholdArg = getArgValue('--threshold');
const thresholdEnv = process.env.COVERAGE_THRESHOLD;
const threshold = Number(thresholdArg || thresholdEnv || 90);

if (!Number.isFinite(threshold)) {
  console.error('Invalid coverage threshold');
  process.exit(2);
}

const summaryPath = path.join(__dirname, '..', 'coverage', 'coverage-summary.json');

if (!fs.existsSync(summaryPath)) {
  console.error(`Coverage summary not found: ${summaryPath}`);
  process.exit(1);
}

const summary = JSON.parse(fs.readFileSync(summaryPath, 'utf8'));
const total = summary.total;

if (!total) {
  console.error('Invalid coverage summary: missing total');
  process.exit(1);
}

const metrics = ['statements', 'branches', 'functions', 'lines'];
const failures = [];

for (const metric of metrics) {
  const pct = total[metric]?.pct;
  if (typeof pct !== 'number') {
    failures.push(`${metric}: missing`);
    continue;
  }
  if (pct < threshold) {
    failures.push(`${metric}: ${pct}% < ${threshold}%`);
  }
}

if (failures.length > 0) {
  console.error('Coverage threshold not met');
  for (const f of failures) console.error(`- ${f}`);
  process.exit(1);
}

console.log(`Coverage OK (>= ${threshold}%)`);
