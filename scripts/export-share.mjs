import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const outputFlag = args.indexOf('--output-dir');
if (outputFlag >= 0 && (!args[outputFlag + 1] || args[outputFlag + 1].startsWith('--'))) {
  throw new Error('--output-dir requires a directory path');
}
await import('./build.mjs');
const outputDir = path.resolve(outputFlag >= 0 && args[outputFlag + 1] ? args[outputFlag + 1] : path.join(root, 'dist'));
const source = path.join(root, 'index.html');
const baseName = '方块拼读大作战_开源版';
const pattern = new RegExp(`^${baseName}_v(\\d+)\\.html$`);

fs.mkdirSync(outputDir, { recursive: true });

const latest = fs.readdirSync(outputDir).reduce((max, name) => {
  const match = name.match(pattern);
  return match ? Math.max(max, Number(match[1])) : max;
}, 0);

const version = latest + 1;
const destination = path.join(outputDir, `${baseName}_v${version}.html`);
fs.copyFileSync(source, destination, fs.constants.COPYFILE_EXCL);

console.log(`Exported ${destination}`);
