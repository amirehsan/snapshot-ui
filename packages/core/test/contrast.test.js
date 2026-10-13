import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  CONTRAST_PAIRS,
  NON_TEXT,
  TEXT,
  composite,
  contrastFailures,
  contrastRatio,
  paletteFor,
  parseColor,
} from '../scripts/contrast.js';

const tokens = JSON.parse(readFileSync(new URL('../tokens/tokens.json', import.meta.url), 'utf8'));
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

  it('refuses numbers that are malformed or out of range', () => {
    expect(() => parseColor('rgb(1.2.3 0 0)')).toThrow(/Cannot parse/);
    expect(() => parseColor('rgb(0 0 0 / .)')).toThrow(/Cannot parse/);
    expect(() => parseColor('rgb(300 0 0)')).toThrow(/Cannot parse/);
    expect(() => parseColor('rgb(0 0 0 / 1.5)')).toThrow(/Cannot parse/);
  });
});

describe('composite', () => {
  it('paints a translucent color over an opaque one', () => {
    const half = composite(parseColor('rgb(0 0 0 / 0.5)'), parseColor('#ffffff'));
    expect(half.r).toBeCloseTo(127.5);
    expect(half.a).toBe(1);
  });
});

describe('paletteFor', () => {
  it('reads the dark override in dark and the base value in light', () => {
    expect(paletteFor(tokens, 'dark').boundary).toBe('rgb(255 255 255 / 0.5)');
    expect(paletteFor(tokens, 'light').boundary).toBe('rgb(20 20 19 / 0.5)');
  });
});

describe('CONTRAST_PAIRS', () => {
  const surfaces = ['canvas', 'lifted', 'bone', 'float', 'raised'];

  // The field parts sit on any surface a form can: a page, a card, a note, a
  // floating panel. Each text color they use is gated on all five.
  it.each(['ink', 'slate', 'clay', 'error'])('gates %s text on every surface', (text) => {
    const gated = CONTRAST_PAIRS.filter((pair) => pair.text === text && pair.minimum === TEXT).map(
      (pair) => pair.ground,
    );
    expect(surfaces.filter((surface) => !gated.includes(surface))).toEqual([]);
  });

  // A checkbox box sits on any surface a form can, in its Raised fill, and its
  // empty edge is the boundary: so the boundary is gated on all five.
  it('gates the control boundary on every surface', () => {
    const gated = CONTRAST_PAIRS.filter((pair) => pair.text === 'boundary' && pair.minimum === NON_TEXT).map(
      (pair) => pair.ground,
    );
    expect(surfaces.filter((surface) => !gated.includes(surface))).toEqual([]);
  });

  // The checked mark is canvas on the ink fill. The primary button label is the
  // same pair, measured at the stricter text minimum.
  it('gates canvas on ink, the checked mark and the primary label', () => {
    const pair = CONTRAST_PAIRS.find((entry) => entry.text === 'canvas' && entry.ground === 'ink');
    expect(pair?.minimum).toBe(TEXT);
  });
});

describe('the edges Radio draws', () => {
  const surfaces = ['canvas', 'lifted', 'bone', 'float', 'raised'];

  // A radio's dot sits on whatever surface a form can: a page, a card, a note,
  // a floating panel. Its ring is the boundary, painted over the Raised fill.
  it('gates the boundary ring on all five surfaces', () => {
    const gated = CONTRAST_PAIRS.filter(
      (pair) => pair.text === 'boundary' && pair.fill === 'raised' && pair.minimum === NON_TEXT,
    ).map((pair) => pair.ground);
    expect(surfaces.filter((surface) => !gated.includes(surface))).toEqual([]);
  });

  // The chosen value of a disabled group is still information, so its check is
  // held to the same 3:1 as an edge, over the disabled fill it is drawn on.
  it('gates the check of a disabled, selected row on the disabled fill', () => {
    expect(CONTRAST_PAIRS).toContainEqual(
      expect.objectContaining({ text: 'boundary', ground: 'disabled', fill: 'disabled', minimum: NON_TEXT }),
    );
  });
});

describe('the switch', () => {
  const surfaces = ['canvas', 'lifted', 'bone', 'float', 'raised'];

  // A switch sits on any surface a settings panel can: a page, a card, a note, a floating panel.
  it('gates the off track against every surface it can sit on', () => {
    const gated = CONTRAST_PAIRS.filter((pair) => pair.text === 'boundary' && pair.fill === undefined).map(
      (pair) => pair.ground,
    );
    expect(surfaces.filter((surface) => !gated.includes(surface))).toEqual([]);
  });

  it('gates the raised thumb on the off track, which takes its color from the surface behind it', () => {
    const gated = CONTRAST_PAIRS.filter((pair) => pair.text === 'raised' && pair.ground === 'boundary').map(
      (pair) => pair.over,
    );
    expect(surfaces.filter((surface) => !gated.includes(surface))).toEqual([]);
  });

  it('gates the canvas thumb on the ink track at the text minimum, which covers the on state', () => {
    const pair = CONTRAST_PAIRS.find((entry) => entry.text === 'canvas' && entry.ground === 'ink');
    expect(pair?.minimum).toBe(TEXT);
  });
});

describe('the collapsible card', () => {
  // The chevron is slate at rest and ink under the pointer, on the card's lifted ground. An icon asks
  // 3:1, and both are gated already as text on lifted, at the stricter 4.5:1.
  it('gates its chevron, slate and ink, on the lifted card', () => {
    for (const text of ['slate', 'ink']) {
      expect(CONTRAST_PAIRS).toContainEqual(
        expect.objectContaining({ text, ground: 'lifted', minimum: TEXT }),
      );
    }
  });
});

describe('contrastFailures', () => {
  const palette = (mode) => paletteFor(tokens, mode);

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

  it('throws on a malformed token instead of passing it', () => {
    const broken = { ...palette('light'), ink: 'rgb(1.2.3 0 0)' };
    expect(() => contrastFailures(broken, 'light')).toThrow(/Cannot parse/);
  });

  it('refuses a translucent canvas as the base of a composite', () => {
    const broken = { ...palette('light'), canvas: 'rgb(243 240 238 / 0.5)' };
    expect(() => contrastFailures(broken, 'light')).toThrow(
      'Color "canvas" in the light palette is not opaque and cannot be a base',
    );
  });
});

describe('the text colors Link and Badge draw', () => {
  it('measures link, success, error and slate text on canvas, lifted, float and raised, and slate on bone', () => {
    // Badge has no fill and Link draws none, so these pairs are every pair they need.
    const measured = new Set(
      CONTRAST_PAIRS.filter((pair) => pair.minimum === TEXT).map((pair) => `${pair.text} on ${pair.ground}`),
    );
    // Kbd is slate on its own bone chip. Link and success are not measured on bone.
    expect(measured, 'slate on bone').toContain('slate on bone');
    for (const text of ['link', 'success', 'error', 'slate']) {
      for (const ground of ['canvas', 'lifted', 'float', 'raised']) {
        expect(measured, `${text} on ${ground}`).toContain(`${text} on ${ground}`);
      }
    }
  });
});
