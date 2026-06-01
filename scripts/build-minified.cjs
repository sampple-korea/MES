const fs = require('fs');
const path = require('path');
const { minify } = require('terser');

const repoRoot = path.resolve(__dirname, '..');
const sourcePath = path.join(repoRoot, 'MES.js');
const outputPath = path.join(repoRoot, 'MES.min.js');
const source = fs.readFileSync(sourcePath, 'utf8');
const headerMatch = source.match(/^\/\/ ==UserScript==[\s\S]*?\/\/ ==\/UserScript==\s*/);

if (!headerMatch) {
  throw new Error('Userscript metadata block was not found in MES.js');
}

const header = headerMatch[0]
  .replace(/(\/\/ @(?:downloadURL|updateURL)\s+.*\/)MES\.js/g, '$1MES.min.js')
  .trimEnd();
const body = source.slice(headerMatch[0].length);

minify(body, {
  compress: {
    passes: 2
  },
  mangle: {
    safari10: true
  },
  format: {
    comments: false
  }
}).then(result => {
  if (!result.code) throw new Error('Terser returned empty output');
  const output = `${header}\n\n${result.code}\n`;
  fs.writeFileSync(outputPath, output, 'utf8');
  const sourceSize = Buffer.byteLength(source);
  const outputSize = Buffer.byteLength(output);
  console.log(`Built MES.min.js: ${sourceSize} -> ${outputSize} bytes`);
}).catch(error => {
  console.error(error);
  process.exit(1);
});
