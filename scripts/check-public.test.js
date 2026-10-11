import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import { findViolations, loadRules, parseRules } from './check-public.js';

// Stand-in names: the real list never enters the repository.
const RULES_TEXT = [
  '# stand-ins for the private names',
  '/\\bacme\\b/i',
  '/(?<!Dark )\\bGlobex\\b(?! [Cc]ream)/',
].join('\n');

test('parses /source/flags lines and skips comments', () => {
  const rules = parseRules(RULES_TEXT);
  assert.equal(rules.length, 2);
  assert.equal(rules[0].pattern.flags, 'i');
  assert.throws(() => parseRules('not a regex'), /not \/source\/flags/);
});

test('finds a private name and reports only where it is', () => {
  const rules = parseRules(RULES_TEXT);
  assert.deepEqual(findViolations('docs/a.md', 'fine\nBuilt for ACME.', rules), [
    { path: 'docs/a.md', line: 2, rule: 'private name 1' },
  ]);
});

test('respects the exceptions a pattern spells out', () => {
  const rules = parseRules(RULES_TEXT);
  assert.deepEqual(findViolations('a.md', 'Globex Cream and Dark Globex', rules), []);
  assert.equal(findViolations('a.md', 'saved in Globex first', rules).length, 1);
});

test('loads rules from the local file first, then the environment, else nothing', () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'check-public-'));
  const file = path.join(dir, 'names.txt');
  writeFileSync(file, '/\\bacme\\b/i\n');
  assert.equal(loadRules(file, '/\\bother\\b/')?.length, 1);
  assert.equal(loadRules(path.join(dir, 'missing.txt'), '/\\bother\\b/\n/x/')?.length, 2);
  assert.equal(loadRules(path.join(dir, 'missing.txt'), undefined), null);
});
