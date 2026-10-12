import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it } from 'vitest';

const SCRIPT = resolve(dirname(fileURLToPath(import.meta.url)), '../scripts/check-use-client.js');

const CLIENT_SOURCE = `'use client';\n\nimport { Button } from 'react-aria-components';\n\nexport const Probe = Button;\n`;
const CLIENT_OUTPUT = `"use client";\nimport { Button } from "react-aria-components";\nexport const Probe = Button;\n`;

/** A tree the guard accepts: one client module that kept its directive, and a plain one. */
const GOOD_TREE = {
  'src/index.ts': `export * from './button/Button';\n`,
  'src/button/Button.tsx': CLIENT_SOURCE,
  'dist/index.js': `export * from "./button/Button.js";\n`,
  'dist/button/Button.js': CLIENT_OUTPUT,
};

const roots: string[] = [];

afterEach(() => {
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true });
});

function makeRoot(files: Record<string, string>): string {
  // The real path, because a script run with cwd = root sees the resolved one (/var is /private/var on macOS).
  const root = mkdtempSync(join(realpathSync(tmpdir()), 'check-use-client-'));
  roots.push(root);
  for (const [name, code] of Object.entries(files)) {
    const file = join(root, name);
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, code);
  }
  return root;
}

/** Runs the guard from an unrelated directory so only the root argument can point it at the fixture. */
function guard(
  root: string | undefined,
  cwd: string = tmpdir(),
): { status: number | null; stdout: string; stderr: string } {
  const args = root === undefined ? [SCRIPT] : [SCRIPT, root];
  const { status, stdout, stderr } = spawnSync(process.execPath, args, { cwd, encoding: 'utf8' });
  return { status, stdout, stderr };
}

describe('check-use-client', () => {
  it('passes a tree whose client modules kept their directive and reports the counts', () => {
    const root = makeRoot(GOOD_TREE);
    const { status, stdout } = guard(root);
    expect(stdout).toContain(
      'check-use-client: every client module keeps its directive (2 sources, 1 client modules)',
    );
    expect(status).toBe(0);
  });

  it('leaves the helpers the stories share out of the sources, as it leaves the stories', () => {
    const root = makeRoot({
      ...GOOD_TREE,
      'src/stories/paint.ts': `export const paint = (value: string): string => value;\n`,
      'src/button/Button.stories.tsx': `export default {};\n`,
    });
    const { status, stdout } = guard(root);
    expect(stdout).toContain('(2 sources, 1 client modules)');
    expect(status).toBe(0);
  });

  it('defaults the package root to the current directory', () => {
    const root = makeRoot(GOOD_TREE);
    const { status, stdout } = guard(undefined, root);
    expect(stdout).toContain('(2 sources, 1 client modules)');
    expect(status).toBe(0);
  });

  it('fails a source that imports react-aria-components without the directive', () => {
    const root = makeRoot({
      ...GOOD_TREE,
      'src/button/Button.tsx': CLIENT_SOURCE.replace(`'use client';\n\n`, ''),
    });
    const { status, stderr } = guard(root);
    expect(stderr).toContain(`src/button/Button.tsx imports react-aria-components without 'use client'`);
    expect(status).toBe(1);
  });

  it('fails a source whose directive follows a comment', () => {
    const root = makeRoot({
      ...GOOD_TREE,
      'src/button/Button.tsx': `// Wraps the React Aria button.\n${CLIENT_SOURCE}`,
    });
    const { status, stderr } = guard(root);
    expect(stderr).toContain(`src/button/Button.tsx has 'use client' but not as its first statement`);
    expect(status).toBe(1);
  });

  it('fails an emitted file whose directive is not its first statement', () => {
    const root = makeRoot({
      ...GOOD_TREE,
      'dist/button/Button.js': `//#region src\n${CLIENT_OUTPUT}`,
    });
    const { status, stderr } = guard(root);
    expect(stderr).toContain(`dist/button/Button.js has 'use client' but not as its first statement`);
    expect(status).toBe(1);
  });

  it('fails when the build dropped the directive from a client module', () => {
    const root = makeRoot({
      ...GOOD_TREE,
      'dist/button/Button.js': CLIENT_OUTPUT.replace(`"use client";\n`, ''),
    });
    const { status, stderr } = guard(root);
    expect(stderr).toContain(`dist/button/Button.js lost its 'use client' directive`);
    expect(status).toBe(1);
  });

  it.each([
    ['a bare import', `import "react-aria-components";\n`],
    ['a dynamic import', `const load = () => import("react-aria-components");\nexport { load };\n`],
    ['a static import', `import { Button } from "react-aria-components";\nexport { Button };\n`],
    ['an export from', `export { Button } from "react-aria-components";\n`],
    ['a subpath import', `import { Button } from "react-aria-components/Button";\nexport { Button };\n`],
  ])('fails an emitted file with %s and no directive, whatever its source says', (_form, output) => {
    const root = makeRoot({
      'src/index.ts': `export const plain = 1;\n`,
      'dist/index.js': output,
    });
    const { status, stderr } = guard(root);
    expect(stderr).toContain(`dist/index.js imports react-aria-components without 'use client'`);
    expect(status).toBe(1);
  });

  it('passes an emitted file that imports react-aria-components behind a directive', () => {
    const root = makeRoot({
      'src/index.ts': `export const plain = 1;\n`,
      'dist/index.js': `"use client";\nconst load = () => import("react-aria-components");\nexport { load };\n`,
    });
    const { status } = guard(root);
    expect(status).toBe(0);
  });

  it('accepts a byte order mark before the directive', () => {
    const root = makeRoot({
      ...GOOD_TREE,
      'dist/button/Button.js': `\uFEFF${CLIENT_OUTPUT}`,
    });
    const { status } = guard(root);
    expect(status).toBe(0);
  });

  it('fails when src has no source files instead of passing on nothing', () => {
    const root = makeRoot({ 'dist/index.js': `export {};\n` });
    mkdirSync(join(root, 'src'));
    const { status, stdout, stderr } = guard(root);
    expect(stderr).toContain(`check-use-client: no source files under ${join(root, 'src')}`);
    expect(stdout).not.toContain('keeps its directive');
    expect(status).toBe(1);
  });

  it('fails when run from the wrong directory with no root argument', () => {
    const root = makeRoot({});
    const { status, stdout, stderr } = guard(undefined, root);
    expect(stderr).toContain(`check-use-client: no source files under ${join(root, 'src')}`);
    expect(stdout).not.toContain('keeps its directive');
    expect(status).toBe(1);
  });

  it('fails when the build left no files in dist', () => {
    const root = makeRoot({ 'src/index.ts': `export const plain = 1;\n` });
    const { status, stdout, stderr } = guard(root);
    expect(stderr).toContain(`check-use-client: no built files under ${join(root, 'dist')}`);
    expect(stdout).not.toContain('keeps its directive');
    expect(status).toBe(1);
  });
});
