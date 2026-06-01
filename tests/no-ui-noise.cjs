const fs = require('fs');

const files = ['MES.js', 'README.md'];
const forbiddenPatterns = [
  { name: 'legacy ON text', pattern: new RegExp('>' + 'ON' + '<') },
  { name: 'legacy OFF text', pattern: new RegExp('>' + 'OFF' + '<') },
  { name: 'reference project name', pattern: new RegExp(['P', 'icky'].join(''), 'i') },
  { name: 'emoji or symbol decoration', pattern: /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u }
];

const failures = [];

for (const file of files) {
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
