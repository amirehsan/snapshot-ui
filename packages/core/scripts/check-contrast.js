// Fails when any documented pairing in tokens/tokens.json falls under its WCAG
// minimum in light or dark mode. test/contrast.test.js enforces the same gate; this prints each failure.
import { readFile } from 'node:fs/promises';
import { contrastFailures } from './contrast.js';

const tokens = JSON.parse(await readFile(new URL('../tokens/tokens.json', import.meta.url), 'utf8'));
const light = {};
const dark = {};
for (const [name, token] of Object.entries(tokens.color)) {
  if (name.startsWith('$')) continue;
  light[name] = token.$value;
  dark[name] = token.$extensions?.['snapshot-ui']?.theme?.dark ?? token.$value;
}

const failures = [...contrastFailures(light, 'light'), ...contrastFailures(dark, 'dark')];
for (const f of failures) {
  console.error(
    `${f.mode}: ${f.text} on ${f.ground} measures ${(Math.floor(f.ratio * 100) / 100).toFixed(2)}:1, under ${f.minimum}:1 (${f.shows})`,
  );
}
if (failures.length > 0) process.exit(1);
console.log('contrast: every pairing passes in light and dark');
