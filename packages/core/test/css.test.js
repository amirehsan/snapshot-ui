import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const components = readdirSync(new URL('../src/components', import.meta.url)).filter((f) =>
  f.endsWith('.css'),
);

const stripComments = (css) => css.replace(/\/\*[\s\S]*?\*\//g, '');

/**
 * An `outline` or `outline-color` declaration that reads ink, in CSS without
 * comments. The lookbehind keeps `.badge-outline` and `--outline` out, the
 * `[^;{}]` stops at the end of the declaration or the rule, and the closing
 * `[,)]` also catches `var(--color-ink, fallback)` but not `var(--color-inkwell)`.
 */
const INK_RING = /(?<![\w-])outline(?:-color)?\s*:[^;{}]*var\(\s*--color-ink\s*[,)]/i;

/** The text between the braces that follow `header`, nested blocks included. */
function blockAfter(css, header) {
  const start = css.indexOf(header);
  if (start === -1) return '';
  const open = css.indexOf('{', start) + 1;
  let depth = 1;
  let close = open;
  while (depth > 0 && close < css.length) {
    const char = css[close++];
    if (char === '{') depth += 1;
    else if (char === '}') depth -= 1;
  }
  return css.slice(open, close - 1);
}

describe('src/styles.css', () => {
  const entry = read('src/styles.css');

  it('imports every component file, and nothing that does not exist', () => {
    const imported = [...entry.matchAll(/@import '\.\/components\/([^']+)';/g)].map((m) => m[1]);
    expect(imported.sort()).toEqual([...components].sort());
  });

  it('declares the layer order before anything else', () => {
    const statement = entry.indexOf('@layer theme, base, components, utilities;');
    expect(statement).toBeGreaterThanOrEqual(0);
    expect(statement).toBeLessThan(entry.indexOf('@import'));
  });
});

describe.each(components)('src/components/%s', (file) => {
  const source = read(`src/components/${file}`);

  it('keeps every rule inside @layer components', () => {
    const withoutComments = stripComments(source).trim();
    expect(withoutComments.startsWith('@layer components {')).toBe(true);
    expect(withoutComments.endsWith('}')).toBe(true);
  });

  it('honors reduced motion wherever it moves', () => {
    if (/\b(transition|animation)\s*:/.test(source)) {
      expect(source).toContain('prefers-reduced-motion: reduce');
    }
  });

  it('is built to dist', () => {
    expect(existsSync(new URL(`../dist/components/${file}`, import.meta.url))).toBe(true);
  });

  it('draws its focus ring in the focus ring token, never in ink', () => {
    // An inset ring on an ink fill inverts to the canvas color, which is allowed.
    expect(stripComments(source)).not.toMatch(INK_RING);
  });
});

describe('the ink ring guard', () => {
  it('matches an outline that reads ink, however it is written', () => {
    for (const css of [
      'outline: 2px solid var(--color-ink);',
      'outline-color: var(--color-ink, red)',
      'OUTLINE: 1px solid VAR( --color-ink )',
      'outline:\n    var(--focus-ring-width)\n    solid\n    var(--color-ink);',
      '.a { outline: var(--focus-ring-offset) solid var(--color-ink) }',
    ]) {
      expect(css, css).toMatch(INK_RING);
    }
  });

  it('leaves everything else alone', () => {
    for (const css of [
      '.badge-outline:hover { background: var(--color-ink); }',
      'outline: var(--focus-ring-width) solid var(--focus-ring-color); color: var(--color-ink)',
      'outline-color: var(--color-canvas);',
      'outline: 2px solid var(--color-inkwell);',
      stripComments('/* outline: var(--color-ink) */ .a { color: var(--color-ink); }'),
    ]) {
      expect(css, css).not.toMatch(INK_RING);
    }
  });
});

describe('type components', () => {
  it.each(['copy.css', 'eyebrow.css'])(
    '%s sets text the reader has to read in slate, never taupe',
    (file) => {
      // Taupe is for placeholders and disabled text. Everything else is read.
      const source = read(`src/components/${file}`);
      expect(source).toContain('var(--color-slate)');
      expect(source).not.toContain('--color-taupe');

      if (file === 'eyebrow.css') {
        const css = stripComments(source);
        // The label is tracked at its own token.
        expect(blockAfter(css, '.eyebrow {')).toContain(
          'letter-spacing: var(--text-eyebrow--letter-spacing);',
        );
        // The dot is light signal orange, the attention cue. Signal orange is consent only.
        expect(blockAfter(css, '.eyebrow::before {')).toContain(
          'background-color: var(--color-signal-light);',
        );
        expect(css).not.toContain('var(--color-signal)');
        // The inset variant keeps the dot inside the box, and it comes after the rule it overrides.
        expect(blockAfter(css, '.eyebrow-inset::before {')).toContain('margin-inline-start: 0;');
        expect(css.indexOf('.eyebrow-inset::before')).toBeGreaterThan(css.indexOf('.eyebrow::before'));
      }
    },
  );
});

describe('dist/components/heading.css', () => {
  it.each([1, 2, 3, 4])('draws heading-%i from its own type token', (step) => {
    const rule = blockAfter(read('dist/components/heading.css'), `.heading-${step} `);
    expect(rule).toContain(`font-size: var(--text-h${step});`);
    expect(rule).toContain(`line-height: var(--text-h${step}--line-height);`);
    // The subhead has no tracking token, so it resets to normal and does not inherit.
    const tracking = step === 4 ? 'normal' : `var(--text-h${step}--letter-spacing)`;
    expect(rule).toContain(`letter-spacing: ${tracking};`);
    expect(rule).toContain(`font-weight: var(--text-h${step}--font-weight);`);
  });

  // A media query cannot read a custom property, so the breakpoints are written
  // out in the CSS. They must stay the token values.
  const queries = async () => {
    const { tokens } = await import('../dist/tokens.js');
    return {
      tablet: `@media (width < ${tokens.breakpoint.md.value})`,
      phone: `@media (width < ${tokens.breakpoint.sm.value})`,
    };
  };

  it('scales the display step to 48px under 1024px and 40px under 768px, and the section step to 28px under 768px', async () => {
    const built = read('dist/components/heading.css');
    const { tablet, phone } = await queries();
    expect(blockAfter(built, tablet)).toMatch(/\.heading-1\s*\{\s*font-size:\s*3rem;\s*\}/);
    expect(blockAfter(built, phone)).toMatch(/\.heading-1\s*\{\s*font-size:\s*2\.5rem;\s*\}/);
    expect(blockAfter(built, phone)).toMatch(/\.heading-2\s*\{\s*font-size:\s*1\.75rem;\s*\}/);
  });

  it('leaves the card title and subhead steps alone at every width, and the section step above 768px', async () => {
    const built = read('dist/components/heading.css');
    const { tablet, phone } = await queries();
    for (const query of [tablet, phone]) {
      expect(blockAfter(built, query)).not.toMatch(/\.heading-[34]/);
    }
    expect(blockAfter(built, tablet)).not.toContain('.heading-2');
  });
});

describe('dist/styles.css', () => {
  const built = read('dist/styles.css');

  it('keeps the layers in the order theme, base, components, utilities', () => {
    // The bundler may split the order statement around the layer blocks, so
    // read the order in which each layer name first appears.
    const order = [];
    for (const [, names = ''] of built.matchAll(/@layer\s+([\w\s,.-]+?)\s*[;{]/g)) {
      for (const name of names.split(',').map((s) => s.trim())) if (!order.includes(name)) order.push(name);
    }
    expect(order).toEqual(['theme', 'base', 'components', 'utilities']);
  });

  it('is lowered for the browser floor and keeps case-insensitive shape selectors', () => {
    expect(built).not.toMatch(/&[\s.:[]/);
    expect(built).toContain('[data-shape="soft" i]');
    expect(built).not.toContain('--lightningcss');
  });
});

describe('dist/base.css', () => {
  const built = read('dist/base.css');

  it('keeps the WebKit text size adjust prefix that iOS Safari needs', () => {
    expect(built).toContain('-webkit-text-size-adjust');
  });

  it('draws the focus ring for anything focusable, inside the base layer', () => {
    // The text between the braces of the first `@layer base`, nested blocks included.
    const start = built.indexOf('@layer base {');
    expect(start).toBeGreaterThan(-1);
    const open = start + '@layer base {'.length;
    let depth = 1;
    let close = open;
    while (depth > 0 && close < built.length) {
      const char = built[close++];
      if (char === '{') depth += 1;
      else if (char === '}') depth -= 1;
    }
    expect(built.slice(open, close)).toMatch(
      /:focus-visible\s*\{\s*outline:\s*var\(--focus-ring-width\) solid var\(--focus-ring-color\);\s*outline-offset:\s*var\(--focus-ring-offset\);\s*\}/,
    );
  });
});
