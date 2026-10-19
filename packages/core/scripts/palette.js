// The chart palette's checks, as pure functions: OKLab and OKLCH from sRGB, color vision deficiency simulated by
// Machado, Oliveira and Fernandes (2009) at full severity, and the distances the data-visualization method
// measures (insights spec, section 5). The thresholds are the method's; the reserved colors are read from
// tokens.json by name, so a changed token is measured as it is.
import { NON_TEXT, composite, contrastRatio, parseColor } from './contrast.js';

/** @typedef {{ r: number; g: number; b: number }} Rgb An opaque sRGB color, each channel 0 to 255. */
/** @typedef {[number, number, number]} Triple */
/** @typedef {'protanopia' | 'deuteranopia'} CvdKind */

/** The palette's tokens, in slot order. A stack draws them in this order and slate after them. */
export const CHART_SLOTS = ['chart-1', 'chart-2', 'chart-3', 'chart-4'];

/** The colors that carry a meaning, which no slot may be read as. Taupe is placeholder and disabled text. */
export const RESERVED = [
  'error',
  'success',
  'gain',
  'warning',
  'clay',
  'signal',
  'signal-light',
  'link',
  'taupe',
];

/** The surfaces a chart sits on: a card, the page and a panel. Each slot is a graphic on all three. */
export const CHART_GROUNDS = ['lifted', 'canvas', 'float'];

/**
 * OKLCH lightness each slot keeps to, per mode: the method's bands.
 * @type {Record<'light' | 'dark', [number, number]>}
 */
export const LIGHTNESS = { light: [0.43, 0.77], dark: [0.48, 0.67] };
/** OKLCH chroma under which a hue reads as gray. */
export const CHROMA_FLOOR = 0.1;
/** OKLab distance times 100 between neighbouring slots under simulated protanopia and deuteranopia. */
export const CVD_MIN = 8;
/** OKLab distance times 100 between neighbouring slots for normal vision. */
export const NORMAL_MIN = 15;
/** OKLab distance times 100 from every reserved color, for normal vision. */
export const RESERVED_DISTANCE_MIN = 10;
/** Degrees of OKLCH hue from every reserved color that has a hue. */
export const RESERVED_HUE_MIN = 30;
/**
 * The chroma under which a color has no hue a reader sees, so no hue to keep away from. Taupe is a warm gray
 * (0.009 in light) and white at 40% over the canvas in dark (0.001); the least of the others is success in light,
 * 0.071.
 */
export const ACHROMATIC = 0.03;

/**
 * Machado 2009, severity 1.0, applied to linear RGB.
 * @type {Record<CvdKind, [Triple, Triple, Triple]>}
 */
const MACHADO = {
  protanopia: [
    [0.152286, 1.052583, -0.204868],
    [0.114503, 0.786281, 0.099216],
    [-0.003882, -0.048116, 1.051998],
  ],
  deuteranopia: [
    [0.367322, 0.860646, -0.227968],
    [0.280085, 0.672501, 0.047413],
    [-0.01182, 0.04294, 0.968881],
  ],
};

/**
 * The simulated kinds of color vision the neighbour check runs under.
 * @type {CvdKind[]}
 */
export const CVD_KINDS = ['protanopia', 'deuteranopia'];

/** @param {number} value A channel from 0 to 255. */
const toLinear = (value) => {
  const c = value / 255;
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
};

/** @param {number} value */
const clamp = (value) => Math.max(0, Math.min(1, value));

/** @param {Triple} row @param {Triple} rgb */
const dot = (row, rgb) => row[0] * rgb[0] + row[1] * rgb[1] + row[2] * rgb[2];

/**
 * A CSS color as an opaque sRGB color, a translucent one painted over `base` first, as a reader sees it.
 * @param {string} value
 * @param {string} [base]
 * @returns {Rgb}
 */
export function opaque(value, base) {
  const color = parseColor(value);
  if (color.a === 1) return color;
  if (base === undefined) throw new Error(`"${value}" is translucent and needs a base to be measured on`);
  return composite(color, parseColor(base));
}

/**
 * Linear RGB, simulated under `kind` when one is given.
 * @param {Rgb} color
 * @param {CvdKind} [kind]
 * @returns {Triple}
 */
function linear(color, kind) {
  /** @type {Triple} */
  const rgb = [toLinear(color.r), toLinear(color.g), toLinear(color.b)];
  if (kind === undefined) return rgb;
  const [red, green, blue] = MACHADO[kind];
  return [clamp(dot(red, rgb)), clamp(dot(green, rgb)), clamp(dot(blue, rgb))];
}

/**
 * OKLab of an opaque sRGB color, as seen under `kind` when one is given.
 * @param {Rgb} color
 * @param {CvdKind} [kind]
 * @returns {Triple}
 */
export function oklab(color, kind) {
  const [r, g, b] = linear(color, kind);
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ];
}

/**
 * OKLCH of an opaque sRGB color: lightness, chroma and hue in degrees from 0 to 360.
 * @param {Rgb} color
 */
export function oklch(color) {
  const [l, a, b] = oklab(color);
  const hue = ((Math.atan2(b, a) * 180) / Math.PI + 360) % 360;
  return { l, c: Math.hypot(a, b), h: hue };
}

/**
 * The OKLab distance between two opaque colors, times 100, as seen under `kind` when one is given.
 * @param {Rgb} first
 * @param {Rgb} second
 * @param {CvdKind} [kind]
 */
export function distance(first, second, kind) {
  const a = oklab(first, kind);
  const b = oklab(second, kind);
  return 100 * Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
}

/**
 * The lesser distance between two colors under the simulated kinds, the method's CVD figure.
 * @param {Rgb} first
 * @param {Rgb} second
 */
export function cvdDistance(first, second) {
  return Math.min(...CVD_KINDS.map((kind) => distance(first, second, kind)));
}

/**
 * The angle between two hues in degrees, from 0 to 180.
 * @param {number} first
 * @param {number} second
 */
export function hueGap(first, second) {
  const gap = Math.abs(first - second) % 360;
  return gap > 180 ? 360 - gap : gap;
}

/**
 * Each item with the one after it: the pairs a stack or a group puts side by side.
 * @template T
 * @param {readonly T[]} list
 * @returns {[T, T][]}
 */
export function neighbours(list) {
  return list.slice(1).map((after, index) => /** @type {[T, T]} */ ([list[index], after]));
}

/**
 * Every color the checks read in one mode, opaque: the four slots, the reserved colors and the surfaces. A
 * translucent reserved color (taupe in dark) is painted over the canvas, the page it is drawn on.
 * @param {Record<string, string>} palette One mode's token values, from `paletteFor`.
 */
export function chartColors(palette) {
  /** @param {string} name */
  const read = (name) => {
    const value = palette[name];
    if (value === undefined) throw new Error(`No color "${name}" in the palette`);
    return opaque(value, palette.canvas);
  };
  return {
    slots: CHART_SLOTS.map((name) => ({ name, color: read(name) })),
    reserved: RESERVED.map((name) => ({ name, color: read(name) })),
    read,
  };
}

/**
 * Every check a slot fails in one mode, as sentences: the lightness band, the chroma floor, its neighbours under
 * simulated and normal vision, its distance and hue from each reserved color, and 3:1 on each surface. Empty when
 * the palette passes.
 * @param {Record<string, string>} palette One mode's token values, from `paletteFor`.
 * @param {'light' | 'dark'} mode
 * @returns {string[]}
 */
export function paletteFailures(palette, mode) {
  const { slots, reserved, read } = chartColors(palette);
  const [low, high] = LIGHTNESS[mode];
  /** @type {string[]} */
  const failures = [];
  /** @param {string} line */
  const fail = (line) => failures.push(`${mode}: ${line}`);
  /** @param {number} value @param {number} [digits] */
  const fixed = (value, digits = 1) => value.toFixed(digits);
  for (const { name, color } of slots) {
    const { l, c, h } = oklch(color);
    if (l < low || l > high) {
      fail(`${name} has lightness ${fixed(l, 3)}, outside ${String(low)} to ${String(high)}`);
    }
    if (c < CHROMA_FLOOR) fail(`${name} has chroma ${fixed(c, 3)}, under ${String(CHROMA_FLOOR)}`);
    for (const other of reserved) {
      const apart = distance(color, other.color);
      if (apart < RESERVED_DISTANCE_MIN) {
        fail(`${name} is ${fixed(apart)} from ${other.name}, under ${String(RESERVED_DISTANCE_MIN)}`);
      }
      const hued = oklch(other.color);
      const gap = hueGap(h, hued.h);
      if (hued.c >= ACHROMATIC && gap < RESERVED_HUE_MIN) {
        fail(
          `${name} is ${fixed(gap, 0)} degrees of hue from ${other.name}, under ${String(RESERVED_HUE_MIN)}`,
        );
      }
    }
    for (const ground of CHART_GROUNDS) {
      const ratio = contrastRatio(color, read(ground));
      if (ratio < NON_TEXT)
        fail(`${name} measures ${fixed(ratio, 2)} on ${ground}, under ${String(NON_TEXT)}`);
    }
  }
  for (const [before, after] of neighbours(slots)) {
    const pair = `${before.name} and ${after.name}`;
    const normal = distance(before.color, after.color);
    if (normal < NORMAL_MIN) fail(`${pair} are ${fixed(normal)} apart, under ${String(NORMAL_MIN)}`);
    for (const kind of CVD_KINDS) {
      const apart = distance(before.color, after.color, kind);
      if (apart < CVD_MIN) fail(`${pair} are ${fixed(apart)} apart under ${kind}, under ${String(CVD_MIN)}`);
    }
  }
  return failures;
}
