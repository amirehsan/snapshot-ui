import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { tokens } from '../dist/tokens.js';

const css = readFileSync(new URL('../dist/tokens.css', import.meta.url), 'utf8');

/** The declarations of the first block whose selector is exactly `selector`. */
function block(selector) {
  const start = css.indexOf(`${selector} {`);
  if (start === -1) throw new Error(`No block for ${selector}`);
  return css.slice(start, css.indexOf('}', start));
}

describe('tokens.css', () => {
  it('is one theme layer', () => {
    expect(css).toMatch(/@layer theme \{/);
  });

  it('writes the blocks in cascade order', () => {
    // Order is behavior: the later [data-theme="light"] must beat the system
    // media query, and the shape blocks come after both theme scopes.
    const selectors = [...css.matchAll(/^\s*(.+?) \{$/gm)].map((match) => match[1]);
    expect(selectors).toEqual([
      '@layer theme',
      ':root',
      '[data-theme="dark"]',
      '@media (prefers-color-scheme: dark)',
      ':root:not([data-theme="light"])',
      '[data-theme="light"]',
      '[data-shape="soft" i]',
      '[data-shape="square" i]',
      '[data-shape="rounded" i]',
    ]);
  });

  it('declares exactly the variables the components rely on, on :root', () => {
    const textStyles = ['h1', 'h2', 'h3', 'h4', 'eyebrow', 'body', 'action', 'small', 'overline'];
    const withLetterSpacing = ['h1', 'h2', 'h3', 'eyebrow', 'action', 'overline'];
    const contract = [
      ...[
        'canvas',
        'lifted',
        'bone',
        'float',
        'raised',
        'disabled',
        'ink',
        'charcoal',
        'granite',
        'slate',
        'taupe',
        'link',
        'signal',
        'signal-light',
        'clay',
        'error',
        'success',
        'boundary',
        'frame',
        'divider',
        'hairline',
        'scrim',
        'scrollbar',
        'scrollbar-hover',
      ].map((name) => `--color-${name}`),
      '--opacity-scrim',
      '--font-sans',
      '--font-mono',
      ...textStyles.flatMap((name) => [
        `--text-${name}`,
        `--text-${name}--line-height`,
        `--text-${name}--font-weight`,
      ]),
      ...withLetterSpacing.map((name) => `--text-${name}--letter-spacing`),
      ...['micro', 'control', 'surface', 'stadium', 'pill', 'dot'].map((name) => `--radius-${name}`),
      ...['lift', 'float', 'dramatic'].map((name) => `--shadow-${name}`),
      ...['part', 'peer', 'separate', 'page'].map((name) => `--spacing-${name}`),
      '--container-field',
      ...['sm', 'md', 'lg'].map((name) => `--breakpoint-${name}`),
      '--focus-ring-width',
      '--focus-ring-offset',
      '--focus-ring-color',
    ];
    const declared = [...block(':root').matchAll(/^\s*(--[\w-]+):/gm)].map((match) => match[1]);
    // Equality, not inclusion: a variable that leaks into :root fails too.
    expect(declared.sort()).toEqual([...contract].sort());
  });

  it('declares the light values on :root', () => {
    const root = block(':root');
    expect(root).toContain('color-scheme: light;');
    expect(root).toContain('--color-canvas: #f3f0ee;');
    expect(root).toContain('--color-boundary: rgb(20 20 19 / 0.5);');
    expect(root).toContain("--font-sans: 'Sofia Sans', 'Sofia Sans Variable', Inter, Arial, sans-serif;");
    expect(root).toContain('--text-body: 1rem;');
    expect(root).toContain('--text-body--line-height: 1.4;');
    expect(root).toContain('--text-body--font-weight: 450;');
    expect(root).toContain('--radius-control: 20px;');
    expect(root).toContain('--radius-dot: 50%;');
    expect(root).toContain('--shadow-float: 0px 24px 48px 0px rgb(0 0 0 / 0.08);');
    expect(root).toContain('--spacing-peer: 24px;');
    expect(root).toContain('--focus-ring-width: 2px;');
  });

  it('keeps the focus ring a reference to ink, declared again in every theme scope', () => {
    const ring = '--focus-ring-color: var(--color-ink);';
    expect(block(':root')).toContain(ring);
    // A custom property that holds var() resolves where it is declared, so a
    // nested theme scope would otherwise inherit the page's ink, not its own.
    for (const selector of [
      '[data-theme="dark"]',
      '[data-theme="light"]',
      ':root:not([data-theme="light"])',
    ]) {
      expect(block(selector), selector).toContain(ring);
    }
    // Shape never changes ink, so the shape blocks leave it alone.
    for (const selector of ['[data-shape="soft" i]', '[data-shape="square" i]', '[data-shape="rounded" i]']) {
      expect(block(selector), selector).not.toContain('--focus-ring-color');
    }
  });

  it('keeps the alpha of translucent dark colors', () => {
    // Style Dictionary's color/css transform once turned this into #ffffff.
    const dark = block('[data-theme="dark"]');
    expect(dark).toContain('--color-slate: rgb(255 255 255 / 0.6);');
    expect(dark).toContain('--color-taupe: rgb(255 255 255 / 0.4);');
    expect(dark).toContain('--color-hairline: rgb(255 255 255 / 0.12);');
  });

  it('resets text color in every theme scope, so nested themes read', () => {
    for (const selector of [
      '[data-theme="dark"]',
      '[data-theme="light"]',
      ':root:not([data-theme="light"])',
    ]) {
      const lines = block(selector);
      expect(lines, selector).toContain('color: var(--color-ink);');
      expect(lines, selector).toMatch(/color-scheme: (light|dark);/);
    }
  });

  it('follows the system when no theme is set', () => {
    expect(css).toMatch(/@media \(prefers-color-scheme: dark\) \{\s*:root:not\(\[data-theme="light"\]\) \{/);
  });

  it('leaves the reserved accents alone in dark', () => {
    const dark = block('[data-theme="dark"]');
    expect(dark).not.toContain('--color-signal:');
    expect(dark).not.toContain('--color-signal-light:');
    expect(dark).toContain('--color-link: #6c8ee0;');
  });

  it('remaps only the radius scale for each shape, case-insensitively', () => {
    const soft = block('[data-shape="soft" i]');
    expect(soft).toContain('--radius-control: 10px;');
    expect(soft).toContain('--radius-pill: 12px;');
    expect(soft).toContain('--radius-stadium: 16px;');
    const square = block('[data-shape="square" i]');
    expect(square).toContain('--radius-control: 0px;');
    expect(square).toContain('--radius-micro: 0px;');
    const rounded = block('[data-shape="rounded" i]');
    expect(rounded).toContain('--radius-pill: 999px;');
    for (const shape of [soft, square, rounded]) {
      expect(shape).not.toContain('--radius-dot');
      expect(shape).not.toContain('--color-');
    }
  });
});

describe('tokens.js', () => {
  it('exposes values, variables and modes', () => {
    expect(tokens.color.slate.var).toBe('var(--color-slate)');
    expect(tokens.color.slate.modes.theme.dark).toBe('rgb(255 255 255 / 0.6)');
    expect(tokens.radius.pill.modes.shape.soft).toBe('12px');
    expect(tokens.text.body['line-height'].cssVar).toBe('--text-body--line-height');
    expect(tokens['focus-ring'].color.var).toBe('var(--focus-ring-color)');
  });
});
