import stylelint from 'stylelint';
import { describe, expect, it } from 'vitest';
import tokenOnly from '../stylelint/token-only.js';

const config = { plugins: [tokenOnly], rules: { 'snapshot-ui/token-only': true } };

async function lint(code) {
  const { results } = await stylelint.lint({ code, config });
  return results.flatMap((r) => r.warnings.map((w) => w.text));
}

describe('snapshot-ui/token-only', () => {
  it.each([
    'border-radius: var(--radius-control);',
    'border-radius: calc(var(--radius-surface) - 4px);',
    'border-radius: 0;',
    'border-top-left-radius: max(0px, calc(var(--radius-control) - 2px));',
    'border-radius: var(--radius-control) / 0;',
    'color: var(--color-ink);',
    'color: currentColor;',
    'background-color: transparent;',
    'border-color: inherit;',
    'box-shadow: var(--shadow-raised);',
    'box-shadow: none;',
    'box-shadow: var(--shadow-raised), var(--shadow-ring);',
    'animation-name: tomato;',
    'outline: 2px solid var(--color-ink);',
    'border-radius: 0px;',
    'border-radius: var(--radius-control, 0);',
    'border-radius: var(--radius-control, var(--radius-surface));',
    'border-radius: var(--radius-control, calc(var(--radius-surface) - 4px));',
    'border-radius: min(var(--radius-control), calc(var(--radius-surface) - 4px));',
    'border-radius: clamp(0px, var(--radius-control), var(--radius-surface));',
    '--card-radius: var(--radius-control);',
    '--card-shadow: var(--shadow-raised);',
    'box-shadow: var(--shadow-lift, none);',
    'box-shadow: var(--shadow-lift, var(--shadow-raised));',
    'background-image: linear-gradient(var(--color-canvas), transparent);',
    'background-image: repeating-linear-gradient(to right, var(--color-ink), currentColor);',
    'filter: drop-shadow(0 0 4px var(--color-ink));',
    'filter: blur(2px) brightness(1.1);',
    'filter: url(#fade);',
    'mask-image: url(#fade);',
    'color: color-mix(in srgb, var(--color-ink) 50%, transparent);',
    '-webkit-text-fill-color: transparent;',
  ])('allows %s', async (decl) => {
    expect(await lint(`a { ${decl} }`)).toEqual([]);
  });

  it.each([
    ['border-radius: 20px;', 'literal radius "20px"'],
    ['border-radius: calc(20px - 4px);', 'literal radius'],
    ['border-start-start-radius: 4px;', 'literal radius'],
    ['color: #fff;', 'literal color "#fff"'],
    ['color: rgb(0 0 0 / 50%);', 'literal color "rgb(0 0 0 / 50%)"'],
    ['background: hsl(10deg 50% 50%);', 'literal color "hsl(10deg 50% 50%)"'],
    ['border: 1px solid red;', 'literal color "red"'],
    ['color: var(--color-ink, black);', 'literal color "black"'],
    ['--my-color: oklch(0.5 0.1 200);', 'literal color'],
    ['box-shadow: 0 1px 2px var(--color-ink);', 'literal shadow'],
    // Named colors inside gradients, filters and color functions, whatever the property.
    ['background-image: linear-gradient(red, blue);', 'literal color "red"'],
    ['background-image: radial-gradient(circle, var(--color-ink), tan);', 'literal color "tan"'],
    ['background-image: repeating-conic-gradient(navy, transparent);', 'literal color "navy"'],
    ['mask-image: linear-gradient(black, transparent);', 'literal color "black"'],
    ['mask: linear-gradient(black, transparent);', 'literal color "black"'],
    ['border-image-source: linear-gradient(red, blue);', 'literal color "red"'],
    ['border-image: linear-gradient(red, blue) 1;', 'literal color "red"'],
    ['list-style-image: linear-gradient(red, blue);', 'literal color "red"'],
    ['filter: drop-shadow(0 0 4px black);', 'literal color "black"'],
    ['color: color-mix(in srgb, var(--color-ink), white);', 'literal color "white"'],
    ['color: light-dark(black, white);', 'literal color "black"'],
    ['-webkit-text-fill-color: red;', 'literal color "red"'],
    ['-webkit-text-stroke-color: red;', 'literal color "red"'],
    ['-webkit-text-stroke: 1px red;', 'literal color "red"'],
    // Radii hidden in var() fallbacks, comparison functions and custom properties.
    ['border-radius: var(--radius-control, 20px);', 'literal radius "var(--radius-control, 20px)"'],
    ['border-radius: var(--radius-control, calc(20px - 4px));', 'literal radius'],
    ['border-radius: calc(var(--radius-control, 20px) - 4px);', 'literal radius'],
    ['border-radius: min(20px, var(--radius-control));', 'literal radius'],
    ['border-radius: min(var(--radius-control), 10px);', 'literal radius'],
    ['border-radius: max(10px, 0px);', 'literal radius'],
    ['border-radius: clamp(0px, 10px, var(--radius-control));', 'literal radius'],
    ['--card-radius: 20px;', 'literal radius "20px" in "--card-radius"'],
    ['--card-radius: min(20px, var(--radius-control));', 'literal radius'],
    // Shadows hidden in var() fallbacks and custom properties.
    ['box-shadow: var(--shadow-lift, 0 1px 2px var(--color-ink));', 'literal shadow'],
    [
      '--card-shadow: 0 1px 2px var(--color-ink);',
      'literal shadow "0 1px 2px var(--color-ink)" in "--card-shadow"',
    ],
  ])('rejects %s', async (decl, expected) => {
    const warnings = await lint(`a { ${decl} }`);
    expect(warnings.length).toBeGreaterThan(0);
    expect(warnings.join('\n')).toContain(expected);
  });

  it('keeps the deliberate nested-radius offset: a var() inside calc() may be adjusted by a length', async () => {
    expect(await lint('a { border-radius: calc(var(--radius-surface) - 4px); }')).toEqual([]);
    expect(await lint('a { border-radius: calc(var(--radius-surface) + var(--space-1)); }')).toEqual([]);
  });

  it('reports the exact message for border-radius: 20px', async () => {
    expect(await lint('.x { border-radius: 20px; }')).toEqual([
      'Unexpected literal radius "20px" in "border-radius". Use 0, var(--radius-*) or calc() with a var(). (snapshot-ui/token-only)',
    ]);
  });
});

describe('the shared config', () => {
  const configFile = new URL('../stylelint.config.js', import.meta.url).pathname;
  const lintWith = async (code) => {
    const { results } = await stylelint.lint({ code, configFile });
    return results.flatMap((r) => r.warnings.map((w) => w.rule));
  };

  it('accepts kebab-case component classes', async () => {
    expect(await lintWith('.button-primary { color: var(--color-ink); }')).toEqual([]);
    expect(await lintWith('.field-label::before { color: var(--color-clay); }')).toEqual([]);
  });

  it('rejects light-dark(), which the browser floor does not support', async () => {
    expect(await lintWith('a { color: light-dark(var(--color-ink), var(--color-canvas)); }')).toContain(
      'function-disallowed-list',
    );
    expect(await lintWith('a { color: var(--color-ink); }')).not.toContain('function-disallowed-list');
  });

  it('rejects classes that collide with Tailwind utilities or are not kebab-case', async () => {
    expect(await lintWith('.text-big { color: var(--color-ink); }')).toContain('selector-class-pattern');
    expect(await lintWith('.rounded-card { color: var(--color-ink); }')).toContain('selector-class-pattern');
    expect(await lintWith('.buttonPrimary { color: var(--color-ink); }')).toContain('selector-class-pattern');
  });
});
