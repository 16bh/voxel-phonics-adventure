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
if (output.includes('__ROUTE_MAP_BG__')) throw new Error('Built file still contains the route map placeholder');
if (findings.length) throw new Error(`Sanitization check failed:\n${findings.join('\n')}`);
if (!template.includes("wai:'ai'") || !template.includes("wei:'ei'")) {
  throw new Error('Pinyin spelling overrides for wai/wei are missing');
}
if (!template.includes("(APP_MODE==='pinyin'||APP_MODE==='math')?'?':ch")) {
  throw new Error('Pinyin and math questions must hide answer blocks before selection');
}
if (!template.includes('G.weapon=autoWeapon') || !template.includes('equipWeapon(autoWeapon.id)')) {
  throw new Error('Final chest rewards must auto-equip a newly awarded weapon');
}
if (!template.includes("save.equipped[APP_MODE]=autoWeapon.id") || !template.includes('return WMAP[equipped]')) {
  throw new Error('Equipped chest rewards must carry over to the next level');
}
if (!template.includes("ttsSpeak(spokenCharacter,.82)")) {
  throw new Error('Pinyin questions must speak the displayed Chinese character once');
}
if (!template.includes("setScreen('route')") || !template.includes('renderRouteMap(true)')) {
  throw new Error('The route overview flow is missing');
}
if (template.includes('G.wi%5===0')) {
  throw new Error('Intermediate five-question chests must stay disabled');
}
if (!template.includes('var LEVELS_MATH=makeMathLevels()') || !template.includes("$('#bMath').onclick")) {
  throw new Error('Math mode and its mode selector must be present');
}
if (!template.includes("if(op==='+'){b=ri(0,max-a);answer=a+b;}") || !template.includes('else{b=ri(0,a);answer=a-b;}')) {
  throw new Error('Math questions must stay within the configured maximum and avoid negative subtraction results');
}
if (!template.includes('function submitMathAnswer()') || !template.includes("Number(raw)===Number(G.word)")) {
  throw new Error('Math answer submission is missing');
}
if (!template.includes('id="mathKeys"') || !template.includes('data-digit="0"') || !template.includes('data-digit="9"') || !template.includes('function useMathKey(button)')) {
  throw new Error('The on-screen math keypad must include digits 0 through 9');
}
if (!template.includes('MATH_ATTACK_AFTER=15') || !template.includes("APP_MODE==='math'?MATH_ATTACK_AFTER:ATTACK_AFTER")) {
  throw new Error('Math battles must use the 15-second attack timer');
}

console.log(`Checks passed: ${scripts.length} scripts, ${chart.length} pinyin entries, no banned identifiers`);
