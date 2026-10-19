// The root class of every library component, read from its stylesheet, for the one rule in prose.css that hands
// every component inside a prose box back to the layer below prose's (insights spec 8.5). The list is never
// written by hand: a new component file adds its roots here at the next build, and test/css.test.js checks the
// built rule against this.
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';

/** The placeholder prose.css writes where the list goes, as the only member of an `:is()`. */
export const PARTS_PLACEHOLDER = '.prose-parts';

/** prose.css's own classes, which are prose's and not a component's. */
const PROSE_CLASSES = new Set([
  'prose',
  'prose-parts',
  'prose-scroll',
  'prose-unlinked',
  'prose-image',
  'not-prose',
]);

/**
 * The roots of one stylesheet: every class its selectors name that does not extend another class it names by a
 * hyphen (`.card-title` extends `.card`, so `.card` is the root and its title a part). A class a file borrows
 * from another component, such as `.card` in charts.css, is a root too, which changes nothing.
 * @param {string} css
 * @returns {string[]}
 */
export function rootsOf(css) {
  const rules = css.replace(/\/\*[\s\S]*?\*\//g, '');
  const selectors = [...rules.matchAll(/([^{};]+)\{/g)]
    .map((match) => match[1] ?? '')
    .filter((selector) => !selector.trim().startsWith('@'));
  const classes = new Set(
    selectors.flatMap((selector) =>
      [...selector.matchAll(/\.([a-z][a-z0-9-]*)/g)].map((match) => match[1] ?? ''),
    ),
  );
  return [...classes].filter(
    (name) =>
      !PROSE_CLASSES.has(name) &&
      ![...classes].some((other) => other !== name && name.startsWith(`${other}-`)),
  );
}

/**
 * Every component root in `dir` (src/components), sorted, prose.css left out.
 * @param {string} dir
 * @returns {string[]}
 */
export function componentRoots(dir) {
  const roots = new Set();
  for (const file of readdirSync(dir)) {
    if (!file.endsWith('.css') || file === 'prose.css') continue;
    for (const root of rootsOf(readFileSync(path.join(dir, file), 'utf8'))) roots.add(root);
  }
  return [...roots].sort();
}

/**
 * The stylesheet with its placeholder replaced by the roots, as `:is(.a, .b, ...)` takes them.
 * @param {string} css
 * @param {string[]} roots
 * @returns {string}
 */
export function withParts(css, roots) {
  return css.replaceAll(`:is(${PARTS_PLACEHOLDER})`, `:is(${roots.map((root) => `.${root}`).join(', ')})`);
}
