import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import { pathToFileURL } from 'node:url';
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
    // '' not undefined: undefined would fall back to the host's PRIVATE_NAMES.
    assert.equal(loadRules(path.join(dir, 'missing.txt'), ''), null);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

const SCRIPT = path.join(import.meta.dirname, 'check-public.js');

/** The host environment without what could steer the check or the git calls under test. */
function cleanEnv(base) {
  const scrubbed = new Set(['PRIVATE_NAMES', 'CI', 'CHECK_PUBLIC_REQUIRED']);
  return Object.fromEntries(
    Object.entries(base).filter(([key]) => !scrubbed.has(key) && !key.startsWith('GIT_')),
  );
}

test('cli: the test environment drops the check settings and every GIT_ variable', () => {
  const base = {
    PATH: '/bin',
    PRIVATE_NAMES: '/acme/',
    CI: '1',
    CHECK_PUBLIC_REQUIRED: 'true',
    GIT_DIR: '/host/.git',
    GIT_INDEX_FILE: '/host/.git/index',
  };
  assert.deepEqual(cleanEnv(base), { PATH: '/bin' });
});

/** Runs git in `cwd` without anything from the host's own git environment. */
function git(cwd, ...args) {
  return execFileSync('git', args, { cwd, env: cleanEnv(process.env), stdio: 'pipe' });
}

/**
 * Runs the command line in a fresh git repository holding `files`. The host's
 * PRIVATE_NAMES, CI, CHECK_PUBLIC_REQUIRED and GIT_* variables never reach it
 * or the git calls that build it; `env` sets what a case needs.
 */
function runCli(files, env = {}, setup = undefined) {
  const dir = mkdtempSync(path.join(tmpdir(), 'check-public-cli-'));
  try {
    git(dir, 'init', '-q');
    for (const [name, text] of Object.entries(files)) writeFileSync(path.join(dir, name), text);
    setup?.(dir);
    return spawnSync(process.execPath, [SCRIPT], {
      cwd: dir,
      env: { ...cleanEnv(process.env), ...env },
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
    git(dir, 'add', 'gone.md');
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

test('cli: checks the name of a binary file but never reads its contents', () => {
  const named = runCli({ 'acme-shot.png': 'bytes' }, { PRIVATE_NAMES: '/acme/i' });
  assert.equal(named.status, 1);
  assert.ok(named.stderr.includes('acme-shot.png (file name) matches private name 1'), named.stderr);
  const plain = runCli({ 'shot.png': 'Built for acme.' }, { PRIVATE_NAMES: '/acme/i' });
  assert.equal(plain.status, 0, plain.stderr);
});

test('cli: importing the module does not run it, even when argv[1] is not a file', () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'check-public-import-'));
  try {
    const code = `import(${JSON.stringify(pathToFileURL(SCRIPT).href)}).then(() => console.log('imported'))`;
    const result = spawnSync(process.execPath, ['-e', code, 'not-a-file'], {
      cwd: dir,
      env: cleanEnv(process.env),
      encoding: 'utf8',
    });
    assert.equal(result.status, 0, result.stderr);
    assert.equal(result.stdout.trim(), 'imported');
    assert.equal(result.stderr, '');
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
