// The repository is public, and this library was extracted from a private app.
// No name from that app may reach a committed file. The names are private too,
// so they are never in this repository: they come from .local/private-names.txt
// (gitignored) on a maintainer's machine, or from the PRIVATE_NAMES secret in
// CI. One regular expression per line, written as /source/flags; lines starting
// with # are comments. A failure reports the file and line only, never the
// match, because CI logs are public.
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';

const LOCAL_FILE = '.local/private-names.txt';

/** Binaries and the lockfile hold no prose. */
const SKIP = [/\.(png|jpe?g|gif|webp|ico|woff2?|pdf)$/i, /^pnpm-lock\.yaml$/];

/** Parses `/source/flags` lines into rules. */
export function parseRules(text) {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#'))
    .map((line, index) => {
      const match = /^\/(.+)\/([a-z]*)$/.exec(line);
      if (!match) throw new Error(`Line ${String(index + 1)} is not /source/flags`);
      return { rule: `private name ${String(index + 1)}`, pattern: new RegExp(match[1], match[2]) };
    });
}

/** The private rules from the local file, else from `env`, else null. */
export function loadRules(file = LOCAL_FILE, env = process.env.PRIVATE_NAMES) {
  if (existsSync(file)) return parseRules(readFileSync(file, 'utf8'));
  if (env) return parseRules(env);
  return null;
}

/** Every rule a file breaks, one entry per matching line. */
export function findViolations(path, text, rules) {
  const found = [];
  text.split('\n').forEach((line, index) => {
    for (const { rule, pattern } of rules) {
      if (pattern.test(line)) found.push({ path, line: index + 1, rule });
    }
  });
  return found;
}

/** Tracked files plus new files git would add, so a check before commit sees them. */
function candidateFiles() {
  const out = execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard'], {
    encoding: 'utf8',
  });
  return out.split('\n').filter((path) => path && !SKIP.some((skip) => skip.test(path)));
}

if (import.meta.main) {
  const rules = loadRules();
  if (!rules) {
    // A fork's pull request has no access to the secret; say so rather than fail it.
    const notice = process.env.CI ? '::warning::check:public skipped, PRIVATE_NAMES is not available' : '';
    console.warn(notice || `check:public: no ${LOCAL_FILE} on this machine, nothing to check against`);
    process.exit(0);
  }
  const violations = candidateFiles().flatMap((path) => {
    try {
      return findViolations(path, readFileSync(path, 'utf8'), rules);
    } catch {
      return [];
    }
  });
  for (const v of violations) console.error(`${v.path}:${String(v.line)} matches ${v.rule}`);
  if (violations.length > 0) process.exit(1);
  console.log(`check:public: no private names in ${String(candidateFiles().length)} files`);
}
