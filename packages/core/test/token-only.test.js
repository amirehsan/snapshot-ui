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
  ])('rejects %s', async (decl, expected) => {
    const warnings = await lint(`a { ${decl} }`);
    expect(warnings.length).toBeGreaterThan(0);
    expect(warnings.join('\n')).toContain(expected);
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

  it('rejects classes that collide with Tailwind utilities or are not kebab-case', async () => {
    expect(await lintWith('.text-big { color: var(--color-ink); }')).toContain('selector-class-pattern');
    expect(await lintWith('.rounded-card { color: var(--color-ink); }')).toContain('selector-class-pattern');
    expect(await lintWith('.buttonPrimary { color: var(--color-ink); }')).toContain('selector-class-pattern');
  });
});
