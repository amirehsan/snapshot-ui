// WCAG 2 contrast for the token palette, in both color modes.
// Ported from the source app's contrast check and extended to translucent
// colors: a value like rgb(255 255 255 / 0.6) is composited over the surface it
// sits on before it is measured, because that is the color a reader sees.

/** WCAG's minimum for text at body size (1.4.3). */
export const TEXT = 4.5;
/** WCAG's minimum for a control boundary or focus ring (1.4.11). */
export const NON_TEXT = 3;

/**
 * Every pairing the components draw. `over` composites a translucent `text`
 * (or a translucent fill) onto that surface first. `shows` names the use, for
 * the failure message.
 * @type {Array<{ text: string; ground: string; minimum: number; shows: string; over?: string; fill?: string }>}
 */
export const CONTRAST_PAIRS = [
  ...['canvas', 'lifted', 'bone', 'float', 'raised'].map((ground) => ({
    text: 'ink',
    ground,
    minimum: TEXT,
    shows: `primary text on ${ground}`,
  })),
  ...['canvas', 'lifted', 'bone', 'float', 'raised'].map((ground) => ({
    text: 'slate',
    ground,
    minimum: TEXT,
    shows: `hints and notes on ${ground}`,
  })),
  ...['canvas', 'lifted', 'bone'].map((ground) => ({
    text: 'granite',
    ground,
    minimum: TEXT,
    shows: `small uppercase text on ${ground}`,
  })),
  ...['canvas', 'lifted'].map((ground) => ({
    text: 'charcoal',
    ground,
    minimum: TEXT,
    shows: `alternate text on ${ground}`,
  })),
  ...['canvas', 'lifted', 'float', 'raised'].map((ground) => ({
    text: 'link',
    ground,
    minimum: TEXT,
    shows: `an inline link on ${ground}`,
  })),
  ...['canvas', 'lifted', 'bone', 'float', 'raised'].map((ground) => ({
    text: 'clay',
    ground,
    minimum: TEXT,
    shows: `the changed marker on ${ground}`,
  })),
  // The folded collapsible card's dot, a graphic that carries meaning, on the card it sits on.
  { text: 'clay', ground: 'lifted', minimum: NON_TEXT, shows: 'the folded card marker on lifted' },
  ...['canvas', 'lifted', 'bone', 'float', 'raised'].map((ground) => ({
    text: 'error',
    ground,
    minimum: TEXT,
    shows: `an error message on ${ground}`,
  })),
  ...['canvas', 'lifted', 'float', 'raised'].map((ground) => ({
    text: 'success',
    ground,
    minimum: TEXT,
    shows: `a success message on ${ground}`,
  })),
  { text: 'canvas', ground: 'ink', minimum: TEXT, shows: 'the primary button label' },
  {
    text: 'canvas',
    ground: 'charcoal',
    over: 'lifted',
    minimum: TEXT,
    shows: 'the primary button label on hover',
  },
  { text: 'canvas', ground: 'error', minimum: TEXT, shows: 'the danger button label' },
  ...['canvas', 'lifted', 'float', 'raised', 'bone'].map((ground) => ({
    text: 'ink',
    ground,
    minimum: NON_TEXT,
    shows: `the focus ring on ${ground}`,
  })),
  { text: 'canvas', ground: 'ink', minimum: NON_TEXT, shows: 'the inverted focus ring on an ink fill' },
  ...['raised', 'lifted', 'canvas', 'float'].map((ground) => ({
    text: 'boundary',
    ground,
    fill: 'raised',
    minimum: NON_TEXT,
    shows: `a control boundary against ${ground}`,
  })),
  {
    text: 'raised',
    ground: 'boundary',
    over: 'lifted',
    minimum: NON_TEXT,
    shows: 'the switch thumb on its off track',
  },
  {
    text: 'boundary',
    ground: 'bone',
    fill: 'raised',
    minimum: NON_TEXT,
    shows: 'a control boundary against bone',
  },
  {
    text: 'boundary',
    ground: 'disabled',
    fill: 'disabled',
    minimum: NON_TEXT,
    shows: 'the check of a disabled, selected radio',
  },
  // The off track is the boundary color painted on the surface itself, so it is
  // measured against each surface a switch can sit on. The thumb on it is
  // measured on each too (lifted is the entry above). The on state is covered by
  // canvas on ink, the primary button label, at the text minimum.
  ...['canvas', 'lifted', 'bone', 'float', 'raised'].map((ground) => ({
    text: 'boundary',
    ground,
    minimum: NON_TEXT,
    shows: `the switch off track on ${ground}`,
  })),
  ...['canvas', 'bone', 'float', 'raised'].map((surface) => ({
    text: 'raised',
    ground: 'boundary',
    over: surface,
    minimum: NON_TEXT,
    shows: `the switch thumb on its off track on ${surface}`,
  })),
];

/** Parses #rgb, #rrggbb, rgb(r g b), rgb(r g b / a), rgba(r, g, b, a) and transparent. */
export function parseColor(value) {
  const text = String(value).trim().toLowerCase();
  if (text === 'transparent') return { r: 0, g: 0, b: 0, a: 0 };
  let match = /^#([\da-f]{3}|[\da-f]{6})$/.exec(text);
  if (match) {
    const digits = match[1] ?? '';
    const hex = digits.length === 3 ? [...digits].map((c) => c + c).join('') : digits;
    const n = Number.parseInt(hex, 16);
    return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255, a: 1 };
  }
  match =
    /^rgba?\(\s*(\d+(?:\.\d+)?|\.\d+)[\s,]+(\d+(?:\.\d+)?|\.\d+)[\s,]+(\d+(?:\.\d+)?|\.\d+)\s*(?:[/,]\s*(\d+(?:\.\d+)?%?|\.\d+%?))?\s*\)$/.exec(
      text,
    );
  if (match) {
    const r = Number(match[1]);
    const g = Number(match[2]);
    const b = Number(match[3]);
    const a =
      match[4] === undefined
        ? 1
        : match[4].endsWith('%')
          ? Number.parseFloat(match[4]) / 100
          : Number(match[4]);
    const numbers = [r, g, b, a];
    if (!numbers.every(Number.isFinite) || [r, g, b].some((c) => c > 255) || a > 1) {
      throw new Error(`Cannot parse color "${value}"`);
    }
    return { r, g, b, a };
  }
  throw new Error(`Cannot parse color "${value}"`);
}

/** Paints `top` over an opaque `bottom`. */
export function composite(top, bottom) {
  const a = top.a;
  return {
    r: top.r * a + bottom.r * (1 - a),
    g: top.g * a + bottom.g * (1 - a),
    b: top.b * a + bottom.b * (1 - a),
    a: 1,
  };
}

function channel(value) {
  const v = value / 255;
  return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
}

function luminance({ r, g, b }) {
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

/** WCAG 2 contrast ratio of two opaque colors, in either order. */
export function contrastRatio(first, second) {
  const firstLuminance = luminance(first);
  const secondLuminance = luminance(second);
  return (
    (Math.max(firstLuminance, secondLuminance) + 0.05) / (Math.min(firstLuminance, secondLuminance) + 0.05)
  );
}

/**
 * Every pair under its minimum in one color mode.
 * `palette` maps a color name to its CSS value in that mode.
 */
export function contrastFailures(palette, mode) {
  const color = (name) => {
    if (!(name in palette)) throw new Error(`No color "${name}" in the ${mode} palette`);
    return parseColor(palette[name]);
  };
  const opaque = (name, over) => {
    const value = color(name);
    if (value.a === 1) return value;
    const base = over ?? 'canvas';
    const backdrop = color(base);
    if (backdrop.a !== 1) {
      throw new Error(`Color "${base}" in the ${mode} palette is not opaque and cannot be a base`);
    }
    return composite(value, backdrop);
  };
  const failures = [];
  for (const pair of CONTRAST_PAIRS) {
    const ground = opaque(pair.ground, pair.over);
    const textBase = pair.fill ? opaque(pair.fill) : ground;
    const text = composite(color(pair.text), textBase);
    const ratio = contrastRatio(text, ground);
    if (!(ratio >= pair.minimum)) {
      failures.push({
        mode,
        text: pair.text,
        ground: pair.ground,
        ratio,
        minimum: pair.minimum,
        shows: pair.shows,
      });
    }
  }
  return failures;
}

/**
 * The CSS value of every color token in one mode. Dark reads the token's dark
 * override and falls back to the base value when it has none.
 * @param {{ color: Record<string, any> }} tokens The parsed tokens.json.
 * @param {'light' | 'dark'} mode
 * @returns {Record<string, string>}
 */
export function paletteFor(tokens, mode) {
  const palette = {};
  for (const [name, token] of Object.entries(tokens.color)) {
    if (name.startsWith('$')) continue;
    palette[name] =
      mode === 'dark' ? (token.$extensions?.['snapshot-ui']?.theme?.dark ?? token.$value) : token.$value;
  }
  return palette;
}
