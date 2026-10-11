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
  });
});
