import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outputPath = path.join(root, 'index.html');
const templatePath = path.join(root, 'src', 'game.template.html');
const dataPath = path.join(root, 'data', 'pinyin-chart-syllables.json');

const output = fs.readFileSync(outputPath, 'utf8');
const template = fs.readFileSync(templatePath, 'utf8');
const chart = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

const scripts = [...output.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)];
scripts.forEach((match, index) => {
  new vm.Script(match[1], { filename: `inline-script-${index + 1}.js` });
});

const banned = [
  /minecraft/i,
  /pomelodaddy/i,
  /\bsteve\b/i,
  /\bcreeper\b/i,
  /\benderman\b/i,
  /苦力怕|末影人|末影龙/,
  /bilibili/i,
  /\/Users\//,
  /gho_[A-Za-z0-9]+/,
  /window\.__(?:G|api)/,
  /location\.hash/,
];

const findings = banned.flatMap((pattern) => {
  const hits = [];
  if (pattern.test(template)) hits.push(`template: ${pattern}`);
  pattern.lastIndex = 0;
  if (pattern.test(output)) hits.push(`index: ${pattern}`);
  return hits;
});

if (chart.length !== 411) throw new Error(`Expected 411 pinyin entries, got ${chart.length}`);
if (output.includes('__PINYIN_CHART__')) throw new Error('Built file still contains a data placeholder');
if (findings.length) throw new Error(`Sanitization check failed:\n${findings.join('\n')}`);
if (!template.includes("wai:'ai'") || !template.includes("wei:'ei'")) {
  throw new Error('Pinyin spelling overrides for wai/wei are missing');
}
if (!template.includes("APP_MODE==='pinyin'?'?':ch")) {
  throw new Error('Pinyin questions must hide answer blocks before selection');
}

console.log(`Checks passed: ${scripts.length} scripts, ${chart.length} pinyin entries, no banned identifiers`);
