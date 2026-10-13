import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { tokens } from '../dist/tokens.js';

const css = readFileSync(new URL('../dist/tokens.css', import.meta.url), 'utf8');

/** The declarations of the first block in `source` whose selector is exactly `selector`. */
function blockOf(source, selector) {
  const start = source.indexOf(`${selector} {`);
  if (start === -1) throw new Error(`No block for ${selector}`);
  return source.slice(start, source.indexOf('}', start));
}

/** The declarations of the first block in the built tokens.css for `selector`. */
const block = (selector) => blockOf(css, selector);

/** The names of the custom properties a block declares. */
const declaredIn = (text) => [...text.matchAll(/^\s*(--[\w-]+):/gm)].map((match) => match[1]);

const buildScript = fileURLToPath(new URL('../scripts/build-tokens.js', import.meta.url));

/**
 * Runs the real build script on a fixture, in a directory of its own. The
 * script reads tokens/ and writes dist/ relative to its working directory, so
 * the repository's own build is never touched. Returns the exit status, stderr
 * and, when the build passed, the generated tokens.css and tokens.js.
 */
function buildFixture(fixture) {
  const dir = mkdtempSync(path.join(tmpdir(), 'snapshot-ui-tokens-'));
  try {
    mkdirSync(path.join(dir, 'tokens'));
    writeFileSync(path.join(dir, 'tokens', 'tokens.json'), JSON.stringify(fixture));
    const run = spawnSync(process.execPath, [buildScript], { cwd: dir, encoding: 'utf8' });
    const built = run.status === 0;
    return {
      status: run.status,
      stderr: run.stderr,
      css: built ? readFileSync(path.join(dir, 'dist', 'tokens.css'), 'utf8') : '',
      js: built ? readFileSync(path.join(dir, 'dist', 'tokens.js'), 'utf8') : '',
    };
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
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
    const textStyles = [
      'h1',
      'h2',
      'h3',
      'h4',
      'eyebrow',
      'body',
      'action',
      'small',
      'overline',
      'numeral',
      'numeral-sm',
    ];
    const withLetterSpacing = ['h1', 'h2', 'h3', 'eyebrow', 'action', 'overline', 'numeral', 'numeral-sm'];
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
        'warning',
        'gain',
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
      '--z-modal',
      '--z-toast',
    ];
    const declared = declaredIn(block(':root'));
    // Equality, not inclusion: a variable that leaks into :root fails too. The
    // three lists name the culprit instead of printing a diff of every variable.
    expect({
      missing: contract.filter((name) => !declared.includes(name)),
      extra: declared.filter((name) => !contract.includes(name)),
      duplicates: declared.filter((name, index) => declared.indexOf(name) !== index),
    }).toEqual({ missing: [], extra: [], duplicates: [] });
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
    expect(root).toContain('--color-warning: #8a5300;');
    expect(root).toContain('--color-gain: #2a5f46;');
    expect(root).toContain('--text-numeral: 3.5rem;');
    expect(root).toContain('--text-numeral--letter-spacing: -0.03em;');
    expect(root).toContain('--text-numeral-sm--line-height: 1.1;');
    expect(root).toContain('--z-modal: 1000;');
    expect(root).toContain('--z-toast: 1100;');
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

  it('declares every token that refers to a changing token in every scope of that axis', () => {
    // The general rule behind the focus ring: a custom property that holds var()
    // resolves where it is declared, so a root declaration that refers to a
    // variable an axis redeclares must be redeclared in every scope of that axis.
    const selectors = [...css.matchAll(/^\s*(.+?) \{$/gm)].map(([, selector = '']) => selector);
    const axes = new Map();
    for (const selector of selectors) {
      const axis = /\[(data-[\w-]+)=/.exec(selector)?.[1];
      if (axis) axes.set(axis, [...(axes.get(axis) ?? []), selector]);
    }
    expect([...axes.keys()].sort()).toEqual(['data-shape', 'data-theme']);
    const checked = [];
    for (const [axis, scopes] of axes) {
      const declaredByScope = new Map(scopes.map((scope) => [scope, declaredIn(block(scope))]));
      const changing = new Set([...declaredByScope.values()].flat());
      for (const [, name, value] of block(':root').matchAll(/^\s*(--[\w-]+):\s*(.+);$/gm)) {
        const refers = [...value.matchAll(/var\((--[\w-]+)\)/g)].some((match) => changing.has(match[1]));
        if (!refers) continue;
        checked.push(name);
        for (const [scope, declared] of declaredByScope) {
          expect(declared, `${name} in ${scope} (${axis})`).toContain(name);
        }
      }
    }
    // The rule must have found something to hold to.
    expect(checked).toContain('--focus-ring-color');
  });

  it('keeps the alpha of translucent dark colors', () => {
    // Style Dictionary's color/css transform once turned this into #ffffff.
    const dark = block('[data-theme="dark"]');
    expect(dark).toContain('--color-slate: rgb(255 255 255 / 0.6);');
    expect(dark).toContain('--color-taupe: rgb(255 255 255 / 0.4);');
    expect(dark).toContain('--color-hairline: rgb(255 255 255 / 0.12);');
  });

  it('gives warning and gain their dark values', () => {
    const dark = block('[data-theme="dark"]');
    expect(dark).toContain('--color-warning: #e8b04f;');
    expect(dark).toContain('--color-gain: #6cc195;');
    // The system-preference scope declares the same values, so an unset page follows the system.
    const system = block(':root:not([data-theme="light"])');
    expect(system).toContain('--color-warning: #e8b04f;');
    expect(system).toContain('--color-gain: #6cc195;');
  });

  it('declares warning and gain again in the light scope, for a light card inside a dark page', () => {
    const light = block('[data-theme="light"]');
    expect(light).toContain('--color-warning: #8a5300;');
    expect(light).toContain('--color-gain: #2a5f46;');
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
      expect(shape).not.toContain('--z-');
      expect(shape).not.toContain('--text-numeral');
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
    expect(tokens.color.warning.modes.theme.dark).toBe('#e8b04f');
    expect(tokens.z.modal.var).toBe('var(--z-modal)');
    expect(tokens.z.modal.value).toBe(1000);
    expect(tokens.z.toast.value).toBe(1100);
  });

  it('gives a token that refers to ink the modes of ink', () => {
    // Its CSS is var(--color-ink), so a reader of `modes.theme.dark ?? value`
    // must get the dark ink, not the light value.
    expect(tokens['focus-ring'].color.modes).toEqual(tokens.color.ink.modes);
    expect(tokens['focus-ring'].color.modes.theme.dark).toBe('#ffffff');
    expect(tokens['focus-ring'].color.value).toBe(tokens.color.ink.value);
  });
});

describe('build-tokens.js', () => {
  const ink = { $value: '#111111', $extensions: { 'snapshot-ui': { theme: { dark: '#eeeeee' } } } };
  const px = (value) => ({ value, unit: 'px' });
  const SOFT = '[data-shape="soft" i]';
  const SQUARE = '[data-shape="square" i]';
  const ROUNDED = '[data-shape="rounded" i]';
  const THEME = ['[data-theme="dark"]', '[data-theme="light"]', ':root:not([data-theme="light"])'];

  it('rejects a reference inside a composite value, naming the token', () => {
    const run = buildFixture({
      color: { $type: 'color', ink },
      border: {
        edge: {
          $type: 'border',
          $value: { color: '{color.ink}', width: '1px', style: 'solid' },
        },
      },
    });
    expect(run.status).not.toBe(0);
    expect(run.stderr).toContain('border.edge');
    expect(run.stderr).toContain('{color.ink}');
  });

  it('rejects a mode value that is a reference, naming the token, axis and variant', () => {
    const run = buildFixture({
      color: {
        $type: 'color',
        canvas: { $value: '#ffffff', $extensions: { 'snapshot-ui': { theme: { dark: '{color.canvas}' } } } },
      },
    });
    expect(run.status).not.toBe(0);
    expect(run.stderr).toContain('color.canvas');
    expect(run.stderr).toContain('theme dark');
    expect(run.stderr).toContain('{color.canvas}');
  });

  it('rejects a mode value that contains a reference', () => {
    const run = buildFixture({
      border: {
        $type: 'border',
        edge: {
          $value: { color: '#000000', width: '1px', style: 'solid' },
          $extensions: {
            'snapshot-ui': {
              shape: { soft: { color: '{border.edge}', width: '2px', style: 'solid' } },
            },
          },
        },
      },
    });
    expect(run.status).not.toBe(0);
    expect(run.stderr).toContain('border.edge');
    expect(run.stderr).toContain('shape soft');
  });

  it('builds a fixture whose references it can follow', () => {
    const run = buildFixture({
      color: {
        $type: 'color',
        // A follower of a follower, declared before the token it follows.
        outer: { $value: '{color.middle}' },
        middle: { $value: '{color.ink}' },
        ink,
      },
      radius: {
        $type: 'dimension',
        control: {
          $value: px(20),
          $extensions: { 'snapshot-ui': { shape: { soft: px(10), square: px(0) } } },
        },
      },
      ring: {
        // A follower of a token the shape axis changes.
        $type: 'dimension',
        radius: { $value: '{radius.control}' },
      },
    });
    expect(run.stderr).toBe('');
    expect(run.status).toBe(0);

    const colorLines = ['--color-outer: var(--color-middle);', '--color-middle: var(--color-ink);'];
    const radiusLine = '--ring-radius: var(--radius-control);';
    expect(blockOf(run.css, ':root')).toContain(radiusLine);
    for (const selector of THEME) {
      for (const line of colorLines) expect(blockOf(run.css, selector), selector).toContain(line);
      expect(blockOf(run.css, selector), selector).not.toContain('--ring-radius');
    }
    for (const selector of [SOFT, SQUARE, ROUNDED]) {
      expect(blockOf(run.css, selector), selector).toContain(radiusLine);
      expect(blockOf(run.css, selector), selector).not.toContain('--color-');
    }

    // tokens.js reads the same way the CSS does, in each variant of the axis.
    const fixtureTokens = JSON.parse(run.js.slice(run.js.indexOf('{'), run.js.lastIndexOf('}') + 1));
    expect(fixtureTokens.color.outer.modes).toEqual({ theme: { dark: '#eeeeee' } });
    expect(fixtureTokens.color.middle.modes).toEqual({ theme: { dark: '#eeeeee' } });
    expect(fixtureTokens.ring.radius.modes).toEqual({ shape: { soft: '10px', square: '0px' } });
  });

  it('repeats a follower whose string value embeds a reference in every scope of its axis', () => {
    const run = buildFixture({
      // A theme token, so the theme scopes exist and the follower can be seen to stay out of them.
      color: { $type: 'color', ink },
      radius: {
        $type: 'dimension',
        control: {
          $value: px(20),
          $extensions: { 'snapshot-ui': { shape: { soft: px(10), square: px(0) } } },
        },
      },
      ring: {
        // The reference is part of a longer string, not the whole value.
        $type: 'dimension',
        inner: { $value: 'calc({radius.control} - 4px)' },
      },
    });
    expect(run.stderr).toBe('');
    expect(run.status).toBe(0);

    const line = '--ring-inner: calc(var(--radius-control) - 4px);';
    for (const selector of [':root', SOFT, SQUARE, ROUNDED]) {
      expect(blockOf(run.css, selector), selector).toContain(line);
    }
    for (const selector of THEME) expect(blockOf(run.css, selector), selector).not.toContain('--ring-inner');

    const fixtureTokens = JSON.parse(run.js.slice(run.js.indexOf('{'), run.js.lastIndexOf('}') + 1));
    expect(fixtureTokens.ring.inner.modes).toEqual({
      shape: { soft: 'calc(10px - 4px)', square: 'calc(0px - 4px)' },
    });
  });
});
