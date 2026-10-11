import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
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

test('drops the stateful g and y flags so every line is tested alone', () => {
  const rules = parseRules('/acme/gi');
  assert.equal(rules[0].pattern.flags, 'i');
  assert.equal(parseRules('/acme/y')[0].pattern.flags, '');
  assert.equal(findViolations('a.md', 'acme\nacme\nacme', rules).length, 3);
});

test('numbers a bad rule by its line in the file, comments and blanks included', () => {
  assert.throws(() => parseRules('# one\n# two\n\nnot a rule'), { message: 'Line 4 is not /source/flags' });
  assert.deepEqual(
    parseRules('# one\n\n/acme/\n# two\n/other/').map((r) => r.rule),
    ['private name 1', 'private name 2'],
  );
});

test('never quotes a pattern in an error', () => {
  assert.throws(() => parseRules('# one\n/acme(/'), { message: 'Line 2 is not a valid regular expression' });
  assert.throws(() => parseRules('/acme/z'), { message: 'Line 1 is not a valid regular expression' });
});

test('finds a private name and reports only where it is', () => {
  const rules = parseRules(RULES_TEXT);
  assert.deepEqual(findViolations('docs/a.md', 'fine\nBuilt for ACME.', rules), [
    { path: 'docs/a.md', line: 2, rule: 'private name 1' },
  ]);
});

test('finds a private name in a file path and reports it as line 0', () => {
  const rules = parseRules(RULES_TEXT);
  assert.deepEqual(findViolations('notes/acme-plan.md', 'fine', rules), [
    { path: 'notes/acme-plan.md', line: 0, rule: 'private name 1' },
  ]);
});

test('respects the exceptions a pattern spells out', () => {
  const rules = parseRules(RULES_TEXT);
  assert.deepEqual(findViolations('a.md', 'Globex Cream and Dark Globex', rules), []);
  assert.equal(findViolations('a.md', 'saved in Globex first', rules).length, 1);
});

test('loads rules from the local file first, then the environment, else nothing', () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'check-public-'));
  try {
    const file = path.join(dir, 'names.txt');
    writeFileSync(file, '/\\bacme\\b/i\n');
    assert.equal(loadRules(file, '/\\bother\\b/')?.length, 1);
    assert.equal(loadRules(path.join(dir, 'missing.txt'), '/\\bother\\b/\n/x/')?.length, 2);
    assert.equal(loadRules(path.join(dir, 'missing.txt'), undefined), null);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

const SCRIPT = path.join(import.meta.dirname, 'check-public.js');

/**
 * Runs the command line in a fresh git repository holding `files`. The host's
 * PRIVATE_NAMES, CI and CHECK_PUBLIC_REQUIRED never reach it; `env` sets them.
 */
function runCli(files, env = {}, setup = undefined) {
  const dir = mkdtempSync(path.join(tmpdir(), 'check-public-cli-'));
  try {
    execFileSync('git', ['init', '-q'], { cwd: dir, stdio: 'pipe' });
    for (const [name, text] of Object.entries(files)) writeFileSync(path.join(dir, name), text);
    setup?.(dir);
    const hostEnv = Object.fromEntries(
      Object.entries(process.env).filter(
        ([key]) => !['PRIVATE_NAMES', 'CI', 'CHECK_PUBLIC_REQUIRED'].includes(key),
      ),
    );
    return spawnSync(process.execPath, [SCRIPT], {
      cwd: dir,
      env: { ...hostEnv, ...env },
      encoding: 'utf8',
    });
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

test('cli: scans a non-ASCII file name and reports its place, never the match', () => {
  const result = runCli({ 'café.md': 'Built for acme.\n' }, { PRIVATE_NAMES: '/acme/i' });
  assert.equal(result.status, 1);
  assert.ok(result.stderr.includes('café.md:1'), result.stderr);
  assert.ok(!result.stderr.includes('acme'), result.stderr);
});

test('cli: reports a private name in a file name as (file name)', () => {
  const result = runCli({ 'acme-notes.md': 'fine\n' }, { PRIVATE_NAMES: '/acme/i' });
  assert.equal(result.status, 1);
  assert.ok(result.stderr.includes('acme-notes.md (file name) matches private name 1'), result.stderr);
});

test('cli: passes a clean file and counts the files it scanned', () => {
  const result = runCli({ 'clean.md': 'fine\n' }, { PRIVATE_NAMES: '/acme/i' });
  assert.equal(result.status, 0, result.stderr);
  assert.ok(result.stdout.includes('no private names in 1 files'), result.stdout);
});

test('cli: skips a tracked file deleted from the working tree and does not count it', () => {
  const result = runCli({ 'gone.md': 'fine\n', 'kept.md': 'fine\n' }, { PRIVATE_NAMES: '/acme/i' }, (dir) => {
    execFileSync('git', ['add', 'gone.md'], { cwd: dir, stdio: 'pipe' });
    rmSync(path.join(dir, 'gone.md'));
  });
  assert.equal(result.status, 0, result.stderr);
  assert.ok(result.stdout.includes('no private names in 1 files'), result.stdout);
});

test('cli: a list with no rules is an error, not a pass', () => {
  const result = runCli({ 'clean.md': 'fine\n' }, { PRIVATE_NAMES: '# only a comment' });
  assert.equal(result.status, 1);
  assert.ok(result.stderr.includes('check:public: the private-name list has no rules'), result.stderr);
});

test('cli: no list at all fails when the run requires one', () => {
  const result = runCli({ 'clean.md': 'fine\n' }, { CHECK_PUBLIC_REQUIRED: 'true' });
  assert.equal(result.status, 1);
  assert.ok(result.stderr.includes('check:public: PRIVATE_NAMES is required for this run'), result.stderr);
});

test('cli: no list at all only warns when the run does not require one', () => {
  const local = runCli({ 'clean.md': 'fine\n' });
  assert.equal(local.status, 0, local.stderr);
  assert.ok(local.stderr.includes('nothing to check against'), local.stderr);
  const ci = runCli({ 'clean.md': 'fine\n' }, { CI: 'true' });
  assert.equal(ci.status, 0, ci.stderr);
  assert.ok(ci.stderr.includes('::warning::check:public skipped'), ci.stderr);
});
