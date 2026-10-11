// Guarantees a Next.js App Router consumer needs from this package:
// 1. every source module that imports react-aria-components declares
//    'use client', because React Aria throws when a server component imports it;
// 2. the build kept that directive as the first statement of the emitted file;
// 3. no emitted file reaches react-aria-components without the directive,
//    whatever its source said (a bare or dynamic import included).
// The guard fails closed: a run that finds nothing to check is an error.
//
// Usage: node scripts/check-use-client.js [packageRoot]  (default: the current directory)
import { glob, readFile } from 'node:fs/promises';
import { join, resolve, sep } from 'node:path';

// The directive must be the very first statement; a comment before it hides it from bundlers.
const DIRECTIVE_FIRST = /^\uFEFF?(['"])use client\1[ \t]*(?:;|\r?\n|$)/;
const DIRECTIVE_ANYWHERE = /^[ \t]*(['"])use client\1/m;
// Matches the specifier in every import form: `from`, bare `import '...'`,
// `import('...')`, `export ... from` and subpaths such as `react-aria-components/foo`.
const ARIA_REFERENCE = /(['"])react-aria-components(?:\/[^'"]*)?\1/;
const NOT_PRODUCTION_SOURCE = /\.(test|stories)\.tsx?$/;

const root = resolve(process.argv[2] ?? process.cwd());
let failed = false;

/** @param {string} message */
function fail(message) {
  console.error(message);
  failed = true;
}

/**
 * @param {string[]} patterns
 * @returns {Promise<string[]>} root-relative paths with forward slashes, sorted
 */
async function find(patterns) {
  const found = [];
  for await (const file of glob(patterns, { cwd: root })) found.push(file.split(sep).join('/'));
  return found.sort();
}

/** @param {string} code */
function hasMisplacedDirective(code) {
  return DIRECTIVE_ANYWHERE.test(code) && !DIRECTIVE_FIRST.test(code);
}

/** @param {string} file */
function misplaced(file) {
  return `${file} has 'use client' but not as its first statement`;
}

/** @param {string} file */
function undeclared(file) {
  return `${file} imports react-aria-components without 'use client'`;
}

/** @returns {Promise<number>} the process exit code */
async function main() {
  const sources = (await find(['src/**/*.ts', 'src/**/*.tsx'])).filter((s) => !NOT_PRODUCTION_SOURCE.test(s));
  if (sources.length === 0) {
    console.error(`check-use-client: no source files under ${join(root, 'src')}`);
    return 1;
  }

  let clientModules = 0;
  for (const src of sources) {
    const code = await readFile(join(root, src), 'utf8');
    if (hasMisplacedDirective(code)) {
      fail(misplaced(src));
      continue;
    }
    if (!DIRECTIVE_FIRST.test(code)) {
      if (ARIA_REFERENCE.test(code)) fail(undeclared(src));
      continue;
    }
    clientModules += 1;
    const out = src.replace(/^src\//, 'dist/').replace(/\.tsx?$/, '.js');
    const emitted = await readFile(join(root, out), 'utf8').catch(() => '');
    if (!DIRECTIVE_FIRST.test(emitted)) fail(`${out} lost its 'use client' directive`);
  }

  // Independent of the sources: whatever the build emitted must be safe on its own.
  const built = await find(['dist/**/*.js', 'dist/**/*.mjs', 'dist/**/*.cjs']);
  if (built.length === 0) fail(`check-use-client: no built files under ${join(root, 'dist')}`);
  for (const file of built) {
    const code = await readFile(join(root, file), 'utf8');
    if (hasMisplacedDirective(code)) fail(misplaced(file));
    else if (ARIA_REFERENCE.test(code) && !DIRECTIVE_FIRST.test(code)) fail(undeclared(file));
  }

  if (failed) return 1;
  console.log(
    `check-use-client: every client module keeps its directive (${String(sources.length)} sources, ${String(clientModules)} client modules)`,
  );
  return 0;
}

process.exitCode = await main();
