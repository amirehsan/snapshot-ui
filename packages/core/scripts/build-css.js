// Bundles src/styles.css -> dist/styles.css and transforms each standalone
// stylesheet (base, components/*) with Lightning CSS. Run after build-tokens.js
// because src/styles.css imports the generated dist/tokens.css.
import { readFileSync } from 'node:fs';
import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { bundleAsync, Features, transform } from 'lightningcss';
import { componentRoots, withParts } from './component-roots.js';

const version = (major, minor = 0) => (major << 16) | (minor << 8);
// iOS Safari is its own target: without ios_saf, Lightning CSS drops the
// -webkit-text-size-adjust prefix that iOS Safari needs.
const targets = {
  safari: version(16, 4),
  ios_saf: version(16, 4),
  chrome: version(111),
  firefox: version(128),
};

// tokens.css sets `color-scheme`; without this exclude Lightning CSS injects
// --lightningcss-light/--lightningcss-dark polyfill variables we never use.
const exclude = Features.LightDark;

const write = async (file, code) => {
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, code);
  console.log(`wrote ${file} (${code.length} bytes)`);
};

// prose.css names every component's root in one rule, which the build writes from the component stylesheets.
const roots = componentRoots('src/components');
const source = (file, code) => (path.basename(file) === 'prose.css' ? withParts(code, roots) : code);

const bundled = await bundleAsync({
  filename: 'src/styles.css',
  targets,
  exclude,
  minify: false,
  resolver: { read: (file) => source(file, readFileSync(file, 'utf8')) },
});
for (const w of bundled.warnings) console.warn(w.message);
await write('dist/styles.css', bundled.code);

/** @type {Array<[from: string, to: string]>} */
const standalone = [
  ['src/base.css', 'dist/base.css'],
  ...(await readdir('src/components'))
    .filter((f) => f.endsWith('.css'))
    .map((f) => /** @type {[string, string]} */ ([`src/components/${f}`, `dist/components/${f}`])),
];
for (const [from, to] of standalone) {
  const { code, warnings } = transform({
    filename: from,
    code: Buffer.from(source(from, await readFile(from, 'utf8'))),
    targets,
    exclude,
    minify: false,
  });
  for (const w of warnings) console.warn(w.message);
  await write(to, code);
}

// Type stub for the CSS entry points (package.json maps each CSS export's
// "types" condition here) so `import "@snapshot-ui/core/styles.css"` passes
// TypeScript's noUncheckedSideEffectImports (default on in TS 6/7) without a
// consumer-side `declare module "*.css"`.
await write('dist/css.d.ts', '// Side-effect-only stylesheet entry point.\nexport {};\n');
