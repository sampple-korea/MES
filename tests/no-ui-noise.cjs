const fs = require('fs');

const sharedForbiddenPatterns = [
  { name: 'legacy ON text', pattern: new RegExp('>' + 'ON' + '<') },
  { name: 'legacy OFF text', pattern: new RegExp('>' + 'OFF' + '<') },
  { name: 'emoji or symbol decoration', pattern: /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u }
];
const fileChecks = {
  'MES.js': sharedForbiddenPatterns,
  ...(fs.existsSync('MES.min.js') ? { 'MES.min.js': sharedForbiddenPatterns } : {}),
  'README.md': sharedForbiddenPatterns
};

const failures = [];

for (const [file, forbiddenPatterns] of Object.entries(fileChecks)) {
  const text = fs.readFileSync(file, 'utf8');
  for (const { name, pattern } of forbiddenPatterns) {
    if (pattern.test(text)) {
      failures.push(`${file}: ${name}`);
    }
  }
}

if (failures.length) {
  console.error(failures.join('\n'));
  process.exit(1);
}

console.log('UI noise check passed');
