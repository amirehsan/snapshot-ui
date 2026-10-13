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
  it.each(['ink', 'slate', 'clay', 'error', 'warning', 'gain'])('gates %s text on every surface', (text) => {
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

  // The folded marker's dot is clay on the card's lifted ground, a card nested in a card included: the color
  // of the Changed chip it stands for. It carries meaning, so it is gated at the 3:1 a graphic asks, in both
  // modes. The numbers here are the record's.
  it('gates the folded marker, a clay dot, on the lifted card at 3:1 in light and dark', () => {
    expect(CONTRAST_PAIRS).toContainEqual(
      expect.objectContaining({ text: 'clay', ground: 'lifted', minimum: NON_TEXT }),
    );
    const measured = (mode) => {
      const palette = paletteFor(tokens, mode);
      return contrastRatio(parseColor(palette.clay), parseColor(palette.lifted));
    };
    expect(measured('light')).toBeCloseTo(6.81, 2);
    expect(measured('dark')).toBeCloseTo(6.82, 2);
  });
});

describe('the dialog', () => {
  // The well is a 48px bone circle holding an ink icon, and the description is slate on the float panel. An
  // icon asks 3:1 and text 4.5:1, and both pairs are gated already as text, at the stricter minimum.
  it('cites ink on bone and slate on float, which the gate already holds, for the well and the description', () => {
    for (const [text, ground] of [
      ['ink', 'bone'],
      ['slate', 'float'],
    ]) {
      expect(CONTRAST_PAIRS).toContainEqual(expect.objectContaining({ text, ground, minimum: TEXT }));
    }
  });

  // The danger well is error at 14% over float, and its icon is error. The wash is a mix and not a token, so
  // the pair cannot join the gate. It is measured here and recorded in the design record instead.
  it('measures the error icon on the 14% error well over float above the 3:1 a graphic needs in both themes, recorded and not gated', () => {
    const measured = (mode) => {
      const palette = paletteFor(tokens, mode);
      const error = parseColor(palette.error);
      const well = composite({ ...error, a: 0.14 }, parseColor(palette.float));
      return contrastRatio(error, well);
    };
    expect(measured('light')).toBeCloseTo(5.88, 2);
    expect(measured('dark')).toBeCloseTo(4.72, 2);
    for (const mode of ['light', 'dark']) expect(measured(mode), mode).toBeGreaterThanOrEqual(NON_TEXT);
  });
});

describe('the sheet', () => {
  // The grabber is a 40px by 4px bar of boundary on the float panel. A graphic asks 3:1, and the gate already
  // holds boundary painted straight on float, the switch's off track there, so the pair is cited, not added.
  it('cites boundary on float, which the gate already holds, for the grabber, at 3.48 in light and 5.21 in dark', () => {
    const cited = CONTRAST_PAIRS.filter(
      (pair) =>
        pair.text === 'boundary' &&
        pair.ground === 'float' &&
        pair.fill === undefined &&
        pair.minimum === NON_TEXT,
    );
    expect(cited).toHaveLength(1);
    const measured = (mode) => {
      const palette = paletteFor(tokens, mode);
      const ground = parseColor(palette.float);
      return contrastRatio(composite(parseColor(palette.boundary), ground), ground);
    };
    expect(measured('light')).toBeCloseTo(3.48, 2);
    expect(measured('dark')).toBeCloseTo(5.21, 2);
  });
});

describe('the menu', () => {
  // The rows sit on the float popup: a label in ink, a description and a resting icon in slate, a danger label
  // and icon in error. A selected row in single mode is the ink pill with canvas on it. All five are gated.
  it('cites ink, slate and error on float, and canvas on ink, which the gate already holds at the text minimum', () => {
    for (const [text, ground] of [
      ['ink', 'float'],
      ['slate', 'float'],
      ['error', 'float'],
      ['canvas', 'ink'],
    ]) {
      expect(CONTRAST_PAIRS).toContainEqual(expect.objectContaining({ text, ground, minimum: TEXT }));
    }
  });

  /** A color painted over the 5% ink wash on float, measured against the wash. */
  const onWash = (mode, name) => {
    const palette = paletteFor(tokens, mode);
    const float = parseColor(palette.float);
    const wash = composite({ ...parseColor(palette.ink), a: 0.05 }, float);
    return contrastRatio(composite(parseColor(palette[name]), wash), wash);
  };

  // The focused row is the wash, a mix and not a token, so its pairs cannot join the gate. They are measured
  // here and recorded in the design record. Each stays above the text minimum.
  it('measures ink, slate and error over the 5% ink wash on float, recorded and not gated', () => {
    for (const { name, light, dark } of [
      { name: 'ink', light: 16.65, dark: 15.25 },
      { name: 'slate', light: 4.96, dark: 6.41 },
      { name: 'error', light: 6.74, dark: 5.02 },
    ]) {
      expect(onWash('light', name), `${name} light`).toBeCloseTo(light, 2);
      expect(onWash('dark', name), `${name} dark`).toBeCloseTo(dark, 2);
      for (const mode of ['light', 'dark'])
        expect(onWash(mode, name), `${name} ${mode}`).toBeGreaterThanOrEqual(TEXT);
    }
  });

  // On the ink pill the description is canvas at 70%, and the key chip is canvas at 20% with canvas text.
  it('measures the description and the key chip on the selected ink row, recorded and not gated', () => {
    const measured = (mode) => {
      const palette = paletteFor(tokens, mode);
      const ink = parseColor(palette.ink);
      const canvas = parseColor(palette.canvas);
      const description = contrastRatio(composite({ ...canvas, a: 0.7 }, ink), ink);
      const chip = contrastRatio(canvas, composite({ ...canvas, a: 0.2 }, ink));
      return { description, chip };
    };
    expect(measured('light').description).toBeCloseTo(8.34, 2);
    expect(measured('dark').description).toBeCloseTo(7.31, 2);
    expect(measured('light').chip).toBeCloseTo(9.13, 2);
    expect(measured('dark').chip).toBeCloseTo(12.37, 2);
    for (const mode of ['light', 'dark']) {
      expect(measured(mode).description, mode).toBeGreaterThanOrEqual(TEXT);
      expect(measured(mode).chip, mode).toBeGreaterThanOrEqual(TEXT);
    }
  });

  // The wash against the float it sits on is a cue that a row is under the pointer or the keyboard, not a
  // boundary: the ring carries keyboard focus, and the row's text carries the item.
  it('measures the wash against float below the 3:1 of a boundary, a cue and not a boundary', () => {
    const measured = (mode) => {
      const palette = paletteFor(tokens, mode);
      const float = parseColor(palette.float);
      return contrastRatio(composite({ ...parseColor(palette.ink), a: 0.05 }, float), float);
    };
    expect(measured('light')).toBeCloseTo(1.11, 2);
    expect(measured('dark')).toBeCloseTo(1.14, 2);
    for (const mode of ['light', 'dark']) expect(measured(mode), mode).toBeLessThan(NON_TEXT);
  });
});

describe('the toast', () => {
  // The stripe is a 4px graphic at the toast's inline start, on the float: slate for info, and success,
  // warning and error. A graphic asks 3:1, and the gate already holds all four on float as text, at the
  // stricter 4.5:1, so the pairs are cited, not added. The numbers here are the record's.
  it('cites the four stripe colors on float, which the gate holds at the text minimum, over the 3:1 a graphic needs', () => {
    const measured = (mode, name) => {
      const palette = paletteFor(tokens, mode);
      const ground = parseColor(palette.float);
      // Slate in dark is white at 60%, so it is painted over the float before it is measured.
      return contrastRatio(composite(parseColor(palette[name]), ground), ground);
    };
    for (const { name, light, dark } of [
      { name: 'slate', light: 5.49, dark: 6.94 },
      { name: 'success', light: 7.44, dark: 6.34 },
      { name: 'warning', light: 6.33, dark: 8.92 },
      { name: 'error', light: 7.46, dark: 5.73 },
    ]) {
      expect(CONTRAST_PAIRS).toContainEqual(
        expect.objectContaining({ text: name, ground: 'float', minimum: TEXT }),
      );
      expect(measured('light', name), `${name} light`).toBeCloseTo(light, 2);
      expect(measured('dark', name), `${name} dark`).toBeCloseTo(dark, 2);
      for (const mode of ['light', 'dark'])
        expect(measured(mode, name), `${name} ${mode}`).toBeGreaterThanOrEqual(NON_TEXT);
    }
  });
});

describe('the command palette', () => {
  /** A token color painted over `ground` and measured against it, as a reader sees it. */
  const measured = (mode, name, groundName) => {
    const palette = paletteFor(tokens, mode);
    const ground = parseColor(palette[groundName]);
    return contrastRatio(composite(parseColor(palette[name]), ground), ground);
  };

  // The palette has no visible label, so its placeholder is the field's only visible name and is read: it is
  // slate, not taupe, and slate on the float surface is already gated at the text minimum.
  it('cites slate on float, which the gate holds at the text minimum, for the placeholder', () => {
    expect(CONTRAST_PAIRS).toContainEqual(
      expect.objectContaining({ text: 'slate', ground: 'float', minimum: TEXT }),
    );
    expect(measured('light', 'slate', 'float')).toBeCloseTo(5.49, 2);
    expect(measured('dark', 'slate', 'float')).toBeCloseTo(6.94, 2);
  });

  // DOM focus never leaves the field, so the keyboard-active row is the ink fill with canvas on it, the same
  // pair as the primary button's label, gated at the text minimum.
  it('cites canvas on ink, which the gate holds at the text minimum, for the keyboard-active row', () => {
    expect(CONTRAST_PAIRS).toContainEqual(
      expect.objectContaining({ text: 'canvas', ground: 'ink', minimum: TEXT }),
    );
    expect(measured('light', 'canvas', 'ink')).toBeCloseTo(16.25, 2);
    expect(measured('dark', 'canvas', 'ink')).toBeCloseTo(19.31, 2);
  });

  // An amount at a row's end is ink on the float surface, gated at the text minimum.
  it('cites ink on float, which the gate holds at the text minimum, for the end value', () => {
    expect(CONTRAST_PAIRS).toContainEqual(
      expect.objectContaining({ text: 'ink', ground: 'float', minimum: TEXT }),
    );
    for (const mode of ['light', 'dark'])
      expect(measured(mode, 'ink', 'float'), mode).toBeGreaterThanOrEqual(TEXT);
  });
});

describe('the tooltip', () => {
  /** A token color painted over `ground` and measured against it, as a reader sees it. */
  const measured = (mode, name, groundName) => {
    const palette = paletteFor(tokens, mode);
    const ground = parseColor(palette[groundName]);
    return contrastRatio(composite(parseColor(palette[name]), ground), ground);
  };

  // The tip is ink with canvas text, the same pair as the primary button's label, gated at the text minimum.
  it('cites canvas on ink, which the gate holds at the text minimum, for the text of the tip', () => {
    expect(CONTRAST_PAIRS).toContainEqual(
      expect.objectContaining({ text: 'canvas', ground: 'ink', minimum: TEXT }),
    );
    expect(measured('light', 'canvas', 'ink')).toBeCloseTo(16.25, 2);
    expect(measured('dark', 'canvas', 'ink')).toBeCloseTo(19.31, 2);
  });

  // The key chip is canvas at 20% over ink with canvas text: the composite the menu's selected row records. It
  // is a mix and not a token, so it cannot join the gate; it is measured again here, in both modes.
  it('measures the key chip, canvas on canvas at 20% over ink, recorded and not gated', () => {
    const chip = (mode) => {
      const palette = paletteFor(tokens, mode);
      const ink = parseColor(palette.ink);
      const canvas = parseColor(palette.canvas);
      return contrastRatio(canvas, composite({ ...canvas, a: 0.2 }, ink));
    };
    expect(chip('light')).toBeCloseTo(9.13, 2);
    expect(chip('dark')).toBeCloseTo(12.37, 2);
    for (const mode of ['light', 'dark']) expect(chip(mode), mode).toBeGreaterThanOrEqual(TEXT);
  });

  // The tip opens over any surface, so its own edge is ink against that surface: ink on canvas, lifted, float
  // and raised, which the gate already holds as text at the stricter minimum. No border is needed.
  it('cites ink on canvas, lifted, float and raised, which the gate holds, for the tip against what it opens over', () => {
    const grounds = ['canvas', 'lifted', 'float', 'raised'];
    for (const ground of grounds) {
      expect(CONTRAST_PAIRS).toContainEqual(expect.objectContaining({ text: 'ink', ground, minimum: TEXT }));
    }
    for (const { mode, low, high } of [
      { mode: 'light', low: 16.25, high: 18.43 },
      { mode: 'dark', low: 15.36, high: 19.31 },
    ]) {
      const ratios = grounds.map((ground) => measured(mode, 'ink', ground));
      expect(Math.min(...ratios), mode).toBeCloseTo(low, 2);
      expect(Math.max(...ratios), mode).toBeCloseTo(high, 2);
    }
  });
});

describe('the sidebar', () => {
  /** A token color painted over `ground` and measured against it, as a reader sees it. */
  const measured = (mode, name, groundName) => {
    const palette = paletteFor(tokens, mode);
    const ground = parseColor(palette[groundName]);
    return contrastRatio(composite(parseColor(palette[name]), ground), ground);
  };

  // The rail is float. Its items and the brand are ink on it; the counts, the group labels and the search label
  // are slate on it; the current item is canvas on an ink pill. The gate already holds all three as text.
  it('cites ink on float, slate on float and canvas on ink, which the gate holds at the text minimum', () => {
    for (const [text, ground] of [
      ['ink', 'float'],
      ['slate', 'float'],
      ['canvas', 'ink'],
    ]) {
      expect(CONTRAST_PAIRS).toContainEqual(expect.objectContaining({ text, ground, minimum: TEXT }));
    }
  });

  // Slate on float is 6.94 in dark, as the dialog's description records; 6.44 is slate on bone.
  it('measures the pairs Appendix B records, in both modes', () => {
    for (const { text, ground, light, dark } of [
      { text: 'ink', ground: 'float', light: 18.43, dark: 17.42 },
      { text: 'slate', ground: 'float', light: 5.49, dark: 6.94 },
      { text: 'canvas', ground: 'ink', light: 16.25, dark: 19.31 },
    ]) {
      expect(measured('light', text, ground), `${text} on ${ground}, light`).toBeCloseTo(light, 2);
      expect(measured('dark', text, ground), `${text} on ${ground}, dark`).toBeCloseTo(dark, 2);
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

describe('the warning and gain colors', () => {
  const surfaces = ['canvas', 'lifted', 'bone', 'float', 'raised'];

  // Neither color is ever the label on a fill. Ink is the primary fill, and both measure far under the
  // text minimum on it, so the gate holds neither there and the docs forbid it.
  it('never gates either on an ink fill', () => {
    const onInk = CONTRAST_PAIRS.filter(
      (pair) => (pair.text === 'warning' || pair.text === 'gain') && pair.ground === 'ink',
    );
    expect(onInk).toEqual([]);
  });

  it('measures under the text minimum on an ink fill in both themes, which is why', () => {
    const onInk = (mode, color) => {
      const palette = paletteFor(tokens, mode);
      return contrastRatio(parseColor(palette[color]), parseColor(palette.ink));
    };
    for (const mode of ['light', 'dark']) {
      for (const color of ['warning', 'gain']) {
        expect(onInk(mode, color), `${color} on ink in ${mode}`).toBeLessThan(TEXT);
      }
    }
  });

  it('gates both on exactly the five surfaces, at the text minimum', () => {
    for (const text of ['warning', 'gain']) {
      const gated = CONTRAST_PAIRS.filter((pair) => pair.text === text);
      expect(gated.map((pair) => pair.ground)).toEqual(surfaces);
      expect(gated.every((pair) => pair.minimum === TEXT)).toBe(true);
    }
  });
});

describe('the text colors Link and Badge draw', () => {
  it('measures link, success, error and slate text on canvas, lifted, float and raised, slate on bone, and warning and gain on all five', () => {
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
    // The warning tone of Badge and the amount that arrived draw on those four and on bone.
    for (const text of ['warning', 'gain']) {
      for (const ground of ['canvas', 'lifted', 'bone', 'float', 'raised']) {
        expect(measured, `${text} on ${ground}`).toContain(`${text} on ${ground}`);
      }
    }
  });
});
