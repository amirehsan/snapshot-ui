import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { NON_TEXT, contrastRatio, paletteFor } from '../scripts/contrast.js';
import {
  ACHROMATIC,
  CHART_GROUNDS,
  CHART_SLOTS,
  CHROMA_FLOOR,
  CVD_KINDS,
  CVD_MIN,
  LIGHTNESS,
  NORMAL_MIN,
  RESERVED,
  RESERVED_DISTANCE_MIN,
  RESERVED_HUE_MIN,
  chartColors,
  cvdDistance,
  distance,
  hueGap,
  neighbours,
  oklab,
  oklch,
  opaque,
  paletteFailures,
} from '../scripts/palette.js';

const tokens = JSON.parse(readFileSync(new URL('../tokens/tokens.json', import.meta.url), 'utf8'));
const MODES = /** @type {const} */ (['light', 'dark']);
const colorsIn = (mode) => chartColors(paletteFor(tokens, mode));
/** A figure as the spec writes it, so a recomputed value is compared at the spec's precision. */
const at = (value, digits = 1) => value.toFixed(digits);

describe('the method', () => {
  // The validator's own fixtures: black and white are 100 apart in OKLab, a gray has no chroma, and the Machado
  // matrices keep a gray gray, since each row sums to 1.
  it('measures OKLab distance, OKLCH and the simulations as the validator does', () => {
    const black = opaque('#000000');
    const white = opaque('#ffffff');
    const gray = opaque('#777777');
    expect(distance(black, white)).toBeCloseTo(100, 4);
    expect(oklch(white).l).toBeCloseTo(1, 4);
    expect(oklch(gray).c).toBeLessThan(1e-4);
    for (const kind of CVD_KINDS) {
      const [l, a, b] = oklab(gray, kind);
      const [l0, a0, b0] = oklab(gray);
      expect(100 * Math.hypot(l - l0, a - a0, b - b0), kind).toBeLessThan(0.01);
    }
    // A pure red and a pure green, which a protan or deutan reader confuses, close up under simulation.
    const red = opaque('#ff0000');
    const green = opaque('#00a000');
    expect(cvdDistance(red, green)).toBeLessThan(distance(red, green) / 3);
    expect(hueGap(350, 10)).toBe(20);
    expect(hueGap(10, 190)).toBe(180);
  });

  it('paints a translucent color over its base before measuring, and refuses one with none', () => {
    expect(opaque('rgb(255 255 255 / 0.5)', '#000000').r).toBeCloseTo(127.5);
    expect(() => opaque('rgb(255 255 255 / 0.5)')).toThrow(/translucent/);
  });

  it('keeps the thresholds of spec 5.1', () => {
    expect(LIGHTNESS).toEqual({ light: [0.43, 0.77], dark: [0.48, 0.67] });
    expect([CHROMA_FLOOR, CVD_MIN, NORMAL_MIN, RESERVED_DISTANCE_MIN, RESERVED_HUE_MIN, NON_TEXT]).toEqual([
      0.1, 8, 15, 10, 30, 3,
    ]);
    expect(CHART_GROUNDS).toEqual(['lifted', 'canvas', 'float']);
    expect(RESERVED).toEqual([
      'error',
      'success',
      'gain',
      'warning',
      'clay',
      'signal',
      'signal-light',
      'link',
      'taupe',
    ]);
  });
});

describe('the chart tokens', () => {
  it('are four, with a light and a dark value and the rule as their description', () => {
    const names = Object.keys(tokens.color).filter((name) => name.startsWith('chart-'));
    expect(names).toEqual(CHART_SLOTS);
    for (const name of CHART_SLOTS) {
      const token = tokens.color[name];
      expect(token.$value, name).toMatch(/^#[\da-f]{6}$/);
      expect(token.$extensions['snapshot-ui'].theme.dark, name).toMatch(/^#[\da-f]{6}$/);
      expect(token.$description, name).toBe(
        'A chart series that is one of several peers. Never a state, never text.',
      );
    }
  });
});

describe.each(MODES)('the chart palette in %s', (mode) => {
  const { slots, reserved, read } = colorsIn(mode);
  const [low, high] = LIGHTNESS[mode];

  it('passes every check', () => {
    expect(paletteFailures(paletteFor(tokens, mode), mode)).toEqual([]);
  });

  it.each(CHART_SLOTS)('keeps %s in the lightness band and past the chroma floor', (name) => {
    const { l, c } = oklch(read(name));
    expect(l).toBeGreaterThanOrEqual(low);
    expect(l).toBeLessThanOrEqual(high);
    expect(c).toBeGreaterThanOrEqual(CHROMA_FLOOR);
  });

  it('keeps each pair of neighbours 8 apart under protanopia and deuteranopia and 15 for normal vision', () => {
    for (const [before, after] of neighbours(slots)) {
      const pair = `${before.name} and ${after.name}`;
      for (const kind of CVD_KINDS) {
        expect(distance(before.color, after.color, kind), `${pair}, ${kind}`).toBeGreaterThanOrEqual(CVD_MIN);
      }
      expect(distance(before.color, after.color), `${pair}, normal`).toBeGreaterThanOrEqual(NORMAL_MIN);
    }
  });

  it.each(CHART_SLOTS)('keeps %s 10 from every reserved color for normal vision', (name) => {
    for (const other of reserved) {
      expect(distance(read(name), other.color), other.name).toBeGreaterThanOrEqual(RESERVED_DISTANCE_MIN);
    }
  });

  it.each(CHART_SLOTS)('keeps %s 30 degrees of hue from every reserved color that has a hue', (name) => {
    const { h } = oklch(read(name));
    for (const other of reserved) {
      if (other.name === 'taupe') continue;
      const hued = oklch(other.color);
      expect(hued.c, `${other.name} has a hue`).toBeGreaterThanOrEqual(ACHROMATIC);
      expect(hueGap(h, hued.h), other.name).toBeGreaterThanOrEqual(RESERVED_HUE_MIN);
    }
  });

  // Taupe is the one reserved color with no hue to keep away from: a warm gray in light and white at 40% over the
  // canvas in dark, whose hue angle is noise (106 degrees in dark, 11 from olive). It is held by distance instead.
  it('finds taupe achromatic, held by distance alone', () => {
    expect(oklch(read('taupe')).c).toBeLessThan(ACHROMATIC);
  });

  it.each(CHART_SLOTS)('keeps %s at 3:1 against lifted, canvas and float', (name) => {
    for (const ground of CHART_GROUNDS) {
      expect(contrastRatio(read(name), read(ground)), ground).toBeGreaterThanOrEqual(NON_TEXT);
    }
  });
});

// Spec 5.2's tables, recomputed at the spec's precision. A changed token, or a changed method, fails here first.
describe("spec 5.2's figures", () => {
  it('measures the light OKLCH of each slot', () => {
    const { read } = colorsIn('light');
    const measured = CHART_SLOTS.map((name) => {
      const { l, c, h } = oklch(read(name));
      return [at(l, 3), at(c, 3), at(h, 0)];
    });
    expect(measured).toEqual([
      ['0.601', '0.102', '195'],
      ['0.450', '0.199', '305'],
      ['0.541', '0.124', '118'],
      ['0.450', '0.200', '335'],
    ]);
  });

  it('measures the neighbours apart, normal and the lesser of the two simulations', () => {
    const measured = Object.fromEntries(
      MODES.map((mode) => {
        const { slots } = colorsIn(mode);
        return [
          mode,
          neighbours(slots).map(([before, after]) => [
            at(distance(before.color, after.color)),
            at(cvdDistance(before.color, after.color)),
          ]),
        ];
      }),
    );
    expect(measured).toEqual({
      light: [
        ['29.5', '20.0'],
        ['33.6', '28.1'],
        ['32.2', '20.0'],
      ],
      dark: [
        ['26.1', '13.8'],
        ['34.2', '27.8'],
        ['32.0', '18.7'],
      ],
    });
  });

  it('measures the nearest reserved color to each slot, for normal vision', () => {
    const nearest = (mode) => {
      const { slots, reserved } = colorsIn(mode);
      return slots.map(({ color }) => {
        const [first] = reserved
          .map((other) => ({ name: other.name, apart: distance(color, other.color) }))
          .sort((a, b) => a.apart - b.apart);
        return first === undefined ? '' : `${first.name} ${at(first.apart)}`;
      });
    };
    expect(nearest('light')).toEqual(['success 17.0', 'link 14.4', 'warning 11.2', 'error 17.0']);
    expect(nearest('dark')).toEqual(['success 10.2', 'link 12.9', 'success 12.1', 'error 18.7']);
  });

  // The two near neighbours under color vision deficiency that risk R7 records: never drawn beside each other,
  // since no chart draws a state or a link beside a series.
  it('measures the close reserved pairs risk R7 records', () => {
    const light = colorsIn('light');
    const dark = colorsIn('dark');
    expect(at(distance(light.read('chart-3'), light.read('warning'), 'deuteranopia'))).toBe('4.4');
    expect(at(distance(dark.read('chart-2'), dark.read('link'), 'deuteranopia'))).toBe('2.9');
  });

  // Not for scatter or small multiples: on every pair, not only neighbours, the four do not all pass.
  it('fails the all-pairs test, as the record says', () => {
    const worst = (mode, measure) => {
      const { slots } = colorsIn(mode);
      let found = { apart: Infinity, pair: '' };
      slots.forEach((first, index) => {
        for (const second of slots.slice(index + 1)) {
          const apart = measure(first.color, second.color);
          if (apart < found.apart) found = { apart, pair: `${first.name} and ${second.name}` };
        }
      });
      return `${found.pair} ${at(found.apart)}`;
    };
    expect(worst('light', (a, b) => distance(a, b))).toBe('chart-2 and chart-4 10.3');
    expect(worst('dark', cvdDistance)).toBe('chart-1 and chart-4 3.7');
  });
});

describe('paletteFailures', () => {
  const light = paletteFor(tokens, 'light');
  const dark = paletteFor(tokens, 'dark');

  it('fails a slot turned toward a reserved hue', () => {
    // Olive turned toward warning's amber.
    const failures = paletteFailures({ ...light, 'chart-3': '#8a6a05' }, 'light');
    expect(failures.some((line) => /chart-3 is \d+ degrees of hue from warning/.test(line))).toBe(true);
  });

  it('fails neighbours a reader cannot tell apart', () => {
    // Olive's slot given violet's value: no distance between them in any vision.
    const failures = paletteFailures({ ...light, 'chart-3': String(light['chart-2']) }, 'light');
    expect(failures).toEqual(
      expect.arrayContaining([
        'light: chart-2 and chart-3 are 0.0 apart, under 15',
        'light: chart-2 and chart-3 are 0.0 apart under protanopia, under 8',
        'light: chart-2 and chart-3 are 0.0 apart under deuteranopia, under 8',
      ]),
    );
  });

  it('fails a slot outside the band, under the chroma floor or under 3:1', () => {
    const failures = paletteFailures({ ...dark, 'chart-4': '#3a2a38' }, 'dark');
    expect(failures).toEqual(
      expect.arrayContaining([
        expect.stringMatching(/^dark: chart-4 has lightness 0\.\d{3}, outside 0\.48 to 0\.67$/),
        expect.stringMatching(/^dark: chart-4 has chroma 0\.\d{3}, under 0\.1$/),
        expect.stringMatching(/^dark: chart-4 measures \d\.\d{2} on lifted, under 3$/),
      ]),
    );
  });

  it("reads the reserved colors from the tokens, so a changed meaning's value is measured as it is", () => {
    const failures = paletteFailures({ ...light, success: String(light['chart-1']) }, 'light');
    expect(failures).toContain('light: chart-1 is 0.0 from success, under 10');
  });
});
