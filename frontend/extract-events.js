const fs = require('fs');
const path = require('path');

const frontendDir = path.join(__dirname, 'src'); // Adjust if your code is in a different folder
const eventRegex = /posthog\.capture\(['"](.+?)['"]/g;
const foundEvents = new Set();

function walkDir(dir) {
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      walkDir(filePath);
    } else if (file.endsWith('.js') || file.endsWith('.jsx')) {
      const content = fs.readFileSync(filePath, 'utf8');
      let match;
      while ((match = eventRegex.exec(content)) !== null) {
        foundEvents.add(match[1]);
      }
    }
  });
}

console.log('🔍 Scanning frontend for PostHog captures...');
walkDir(frontendDir);

const eventList = Array.from(foundEvents);

if (eventList.length === 0) {
  console.log('❌ No events found. Make sure you are using posthog.capture("event_name") syntax.');
} else {
  console.log('\n🚀 COPY AND PASTE THE CODE BELOW INTO YOUR BROWSER CONSOLE:\n');
  console.log('------------------------------------------------------------');
  console.log(`const events = ${JSON.stringify(eventList, null, 2)};`);
  console.log(`events.forEach(e => { window.posthog.capture(e); console.log("✅ Fired: " + e); });`);
  console.log('------------------------------------------------------------');
}