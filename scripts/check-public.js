// The repository is public, and this library was extracted from a private app.
// No name from that app may reach a committed file, in its contents or its
// path. The names are private too, so they are never in this repository: they
// come from .local/private-names.txt (gitignored) on a maintainer's machine, or
// from the PRIVATE_NAMES secret in CI. One regular expression per line, written
// as /source/flags; lines starting with # are comments. A hit in a file's
// contents is reported as file and line only, never the matched text, because
// CI logs are public. A hit in a file's name has to print the path, which
// contains the name; that path is already public in the commit being checked.
// With no list at all the check skips with a notice, except when
// CHECK_PUBLIC_REQUIRED is "true": CI sets that where the secret must exist,
// and a missing list then fails the run. A list with no rules always fails.
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, realpathSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const LOCAL_FILE = '.local/private-names.txt';

/** Binaries and the lockfile hold no prose: their names are checked, their contents are not. */
const SKIP = [/\.(png|jpe?g|gif|webp|ico|woff2?|pdf)$/i, /^pnpm-lock\.yaml$/];

/**
 * Parses `/source/flags` lines into rules. Errors name the line in the file,
 * comments and blanks counted, and never quote it. The g and y flags are
 * dropped: they make `test` carry state from one line to the next.
 */
export function parseRules(text) {
  const rules = [];
  text.split('\n').forEach((raw, index) => {
    const line = raw.trim();
    if (!line || line.startsWith('#')) return;
    const number = String(index + 1);
    const match = /^\/(.+)\/([a-z]*)$/.exec(line);
    if (!match) throw new Error(`Line ${number} is not /source/flags`);
    try {
      rules.push({
        rule: `private name ${String(rules.length + 1)}`,
        pattern: new RegExp(match[1], match[2].replace(/[gy]/g, '')),
      });
    } catch {
      // The engine's own message, and so a cause, would quote the private pattern.
      throw new Error(`Line ${number} is not a valid regular expression`);
    }
  });
  return rules;
}

/** The private rules from the local file, else from `env`, else null. */
export function loadRules(file = LOCAL_FILE, env = process.env.PRIVATE_NAMES) {
  if (existsSync(file)) return parseRules(readFileSync(file, 'utf8'));
  if (env) return parseRules(env);
  return null;
}

/** Every rule a path breaks, reported as line 0. */
function findPathViolations(path, rules) {
  return rules.filter(({ pattern }) => pattern.test(path)).map(({ rule }) => ({ path, line: 0, rule }));
}

/** Every rule a file breaks: by its path (line 0), then once per matching line. */
export function findViolations(path, text, rules) {
  const found = findPathViolations(path, rules);
  text.split('\n').forEach((line, index) => {
    for (const { rule, pattern } of rules) {
      if (pattern.test(line)) found.push({ path, line: index + 1, rule });
    }
  });
  return found;
}

/**
 * Tracked files plus new files git would add, so a check before commit sees them.
 * NUL-separated: without -z git quotes a non-ASCII path and it cannot be opened.
 */
function candidateFiles() {
  const out = execFileSync('git', ['ls-files', '-z', '--cached', '--others', '--exclude-standard'], {
    encoding: 'utf8',
  });
  return [...new Set(out.split('\0').filter(Boolean))];
}

/** Runs the check and returns the exit code. */
function main() {
  const rules = loadRules();
  if (!rules) {
    if (process.env.CHECK_PUBLIC_REQUIRED === 'true') {
      console.error('check:public: PRIVATE_NAMES is required for this run');
      return 1;
    }
    // A fork's pull request has no access to the secret; say so rather than fail it.
    const notice = process.env.CI ? '::warning::check:public skipped, PRIVATE_NAMES is not available' : '';
    console.warn(notice || `check:public: no ${LOCAL_FILE} on this machine, nothing to check against`);
    return 0;
  }
  if (rules.length === 0) {
    console.error('check:public: the private-name list has no rules');
    return 1;
  }
  let scanned = 0;
  const violations = candidateFiles().flatMap((path) => {
    if (SKIP.some((skip) => skip.test(path))) return findPathViolations(path, rules);
    let text;
    try {
      text = readFileSync(path, 'utf8');
    } catch (error) {
      // A tracked file deleted in the working tree: nothing to read, but its name still counts.
      if (error.code !== 'ENOENT') throw error;
      return findPathViolations(path, rules);
    }
    scanned += 1;
    return findViolations(path, text, rules);
  });
  for (const v of violations) {
    console.error(
      v.line === 0
        ? `${v.path} (file name) matches ${v.rule}`
        : `${v.path}:${String(v.line)} matches ${v.rule}`,
    );
  }
  if (violations.length > 0) return 1;
  console.log(`check:public: no private names in ${String(scanned)} files`);
  return 0;
}

/**
 * Whether this file is the one node was started with. import.meta.main needs
 * Node 24.2 and engines allows 24.0, so compare real paths. Importing the module
 * from a process whose argv[1] is not a file (node -e, a REPL) is not an error.
 */
function isEntryPoint() {
  try {
    return (
      Boolean(process.argv[1]) &&
      realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url))
    );
  } catch {
    return false;
  }
}

if (isEntryPoint()) process.exitCode = main();
