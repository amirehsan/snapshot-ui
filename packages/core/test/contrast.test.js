import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { composite, contrastFailures, contrastRatio, parseColor } from '../scripts/contrast.js';

const ratio = (a, b) => contrastRatio(parseColor(a), parseColor(b));

describe('contrastRatio', () => {
  // Fixtures carried over from the source app's own contrast tests.
  it('measures WCAG 2 contrast in either order', () => {
    expect(ratio('#000000', '#ffffff')).toBe(21);
    expect(ratio('#ffffff', '#000000')).toBe(21);
    expect(ratio('#3860be', '#3860BE')).toBe(1);
    expect(ratio('#767676', '#ffffff')).toBeCloseTo(4.54, 2);
    expect(ratio('#777777', '#ffffff')).toBeCloseTo(4.48, 2);
    expect(ratio('#595959', '#ffffff')).toBeCloseTo(7.0, 2);
    expect(ratio('#fcfbfa', '#f3f0ee')).toBeCloseTo(1.1, 2);
  });
});

describe('parseColor', () => {
  it('reads every syntax the tokens use', () => {
    expect(parseColor('#abc')).toEqual({ r: 170, g: 187, b: 204, a: 1 });
    expect(parseColor('#141413')).toEqual({ r: 20, g: 20, b: 19, a: 1 });
    expect(parseColor('rgb(255 255 255 / 0.6)')).toEqual({ r: 255, g: 255, b: 255, a: 0.6 });
    expect(parseColor('rgba(20, 20, 19, 0.5)')).toEqual({ r: 20, g: 20, b: 19, a: 0.5 });
    expect(parseColor('rgb(0 0 0 / 40%)')).toEqual({ r: 0, g: 0, b: 0, a: 0.4 });
    expect(parseColor('transparent')).toEqual({ r: 0, g: 0, b: 0, a: 0 });
  });

  it('refuses what it cannot read', () => {
    expect(() => parseColor('oklch(0.5 0.1 200)')).toThrow(/Cannot parse/);
  });
});

describe('composite', () => {
  it('paints a translucent color over an opaque one', () => {
    const half = composite(parseColor('rgb(0 0 0 / 0.5)'), parseColor('#ffffff'));
    expect(half.r).toBeCloseTo(127.5);
    expect(half.a).toBe(1);
  });
});

describe('contrastFailures', () => {
  const tokens = JSON.parse(readFileSync(new URL('../tokens/tokens.json', import.meta.url), 'utf8'));
  const palette = (mode) =>
    Object.fromEntries(
      Object.entries(tokens.color)
        .filter(([name]) => !name.startsWith('$'))
        .map(([name, token]) => [
          name,
          mode === 'dark' ? (token.$extensions?.['snapshot-ui']?.theme?.dark ?? token.$value) : token.$value,
        ]),
    );

  it('passes every documented pairing in light and dark', () => {
    expect([
      ...contrastFailures(palette('light'), 'light'),
      ...contrastFailures(palette('dark'), 'dark'),
    ]).toEqual([]);
  });

  it('catches taupe used as readable text', () => {
    const broken = { ...palette('light'), slate: '#d1cdc7' };
    const failures = contrastFailures(broken, 'light');
    expect(failures.some((f) => f.text === 'slate' && f.ratio < 4.5)).toBe(true);
  });

  it("catches the source app's 40% control boundary", () => {
    const broken = { ...palette('light'), boundary: 'rgb(20 20 19 / 0.4)' };
    const failures = contrastFailures(broken, 'light');
    expect(failures.some((f) => f.text === 'boundary' && f.ground === 'raised')).toBe(true);
  });
});
