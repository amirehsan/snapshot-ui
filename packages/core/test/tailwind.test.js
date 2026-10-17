import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const dir = path.join(import.meta.dirname, '.tailwind');
const cli = path.join(import.meta.dirname, '..', 'node_modules', '.bin', 'tailwindcss');

const USED =
  'bg-canvas text-ink rounded-control text-body p-part max-w-field md:flex shadow-float text-gain bg-warning text-numeral p-card gap-inset max-w-sidebar';
const CLEARED = 'rounded-lg text-sm bg-red-500 shadow-md font-serif xl:flex';

/** Compiles a Tailwind entry that imports the tokens and the theme in `order`. */
function compile(name, order) {
  mkdirSync(dir, { recursive: true });
  const imports = {
    tokens: '@import "../../dist/tokens.css";',
    tailwind: '@import "tailwindcss" source(none);',
    theme: '@import "../../dist/tailwind.css";',
  };
  const input = path.join(dir, `${name}.css`);
  const output = path.join(dir, `${name}.out.css`);
  writeFileSync(
    input,
    [...order.map((key) => imports[key]), `@source inline("${USED} ${CLEARED}");`].join('\n'),
  );
  execFileSync(cli, ['-i', input, '-o', output], { stdio: 'pipe' });
  return readFileSync(output, 'utf8');
}

describe.each([
  ['tokens before Tailwind', ['tokens', 'tailwind', 'theme']],
  ['Tailwind before tokens', ['tailwind', 'theme', 'tokens']],
])('the Tailwind theme, %s', (name, order) => {
  const out = compile(name.replaceAll(' ', '-'), order);

  it('builds utilities that read the runtime tokens', () => {
    expect(out).toMatch(/\.bg-canvas \{\s*background-color: var\(--color-canvas\);/);
    expect(out).toMatch(/\.rounded-control \{\s*border-radius: var\(--radius-control\);/);
    expect(out).toMatch(/\.text-body \{\s*font-size: var\(--text-body\);/);
    expect(out).toMatch(/\.p-part \{\s*padding: var\(--spacing-part\);/);
    expect(out).toMatch(/\.max-w-field \{\s*max-width: var\(--container-field\);/);
    expect(out).toMatch(/\.text-gain \{\s*color: var\(--color-gain\);/);
    expect(out).toMatch(/\.bg-warning \{\s*background-color: var\(--color-warning\);/);
    expect(out).toMatch(/\.text-numeral \{\s*font-size: var\(--text-numeral\);/);
    expect(out).toMatch(/\.p-card \{\s*padding: var\(--spacing-card\);/);
    expect(out).toMatch(/\.gap-inset \{\s*gap: var\(--spacing-inset\);/);
    expect(out).toMatch(/\.max-w-sidebar \{\s*max-width: var\(--container-sidebar\);/);
    expect(out).toContain('@media (width >= 1024px)');
  });

  it("clears Tailwind's off-system defaults", () => {
    for (const cls of ['.rounded-lg', '.text-sm', '.bg-red-500', '.shadow-md', '.font-serif', '.xl\\:flex']) {
      expect(out, cls).not.toContain(`${cls} {`);
    }
  });

  it('never writes a self-referencing variable', () => {
    expect(out).not.toMatch(/--color-canvas: var\(--color-canvas\)/);
    expect(out).not.toMatch(/--radius-control: var\(--radius-control\)/);
  });
});

describe('dist/tailwind.css', () => {
  it('keeps size and z out of the theme, which Tailwind has no namespaces for', () => {
    const theme = readFileSync(path.join(import.meta.dirname, '..', 'dist', 'tailwind.css'), 'utf8');
    expect(theme).toContain('--spacing-inset: var(--spacing-inset);');
    expect(theme).toContain('--container-sidebar: var(--container-sidebar);');
    // A Tailwind user reads a size as an arbitrary value: h-(--size-control).
    expect(theme).not.toContain('--size-');
    expect(theme).not.toContain('--z-');
    // Nor the motion tokens: a component reads them by name, as a transition's duration and curve.
    expect(theme).not.toContain('--ease-');
    expect(theme).not.toContain('--duration-');
  });
});
