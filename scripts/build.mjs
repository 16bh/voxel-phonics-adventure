import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const templatePath = path.join(root, 'src', 'game.template.html');
const dataPath = path.join(root, 'data', 'pinyin-chart-syllables.json');
const outputPath = path.join(root, 'index.html');

const template = fs.readFileSync(templatePath, 'utf8');
const chart = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

if (chart.length !== 411) {
  throw new Error(`Expected 411 pinyin-chart syllables, got ${chart.length}`);
}
if (!template.includes('/*__PINYIN_CHART__*/')) {
  throw new Error('Pinyin chart placeholder is missing');
}

const output = template.replace('/*__PINYIN_CHART__*/', JSON.stringify(chart));
fs.writeFileSync(outputPath, output);
console.log(`Built ${path.relative(root, outputPath)} (${Buffer.byteLength(output)} bytes)`);
