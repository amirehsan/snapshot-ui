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

describe('the tab bar', () => {
  /** A token color painted over `ground` and measured against it, as a reader sees it. */
  const measured = (mode, name, groundName) => {
    const palette = paletteFor(tokens, mode);
    const ground = parseColor(palette[groundName]);
    return contrastRatio(composite(parseColor(palette[name]), ground), ground);
  };

  // The bar is float. A resting label and its icon are slate on it; the current item and a count chip are canvas
  // on ink, and the chip on the current item is ink on canvas. The gate already holds all three as text.
  it('cites slate on float, canvas on ink and ink on canvas, which the gate holds at the text minimum', () => {
    for (const [text, ground] of [
      ['slate', 'float'],
      ['canvas', 'ink'],
      ['ink', 'canvas'],
    ]) {
      expect(CONTRAST_PAIRS).toContainEqual(expect.objectContaining({ text, ground, minimum: TEXT }));
    }
  });

  // Slate on float is 6.94 in dark, as the sidebar's record says; the spec's 6.44 is slate on bone.
  it('measures the pairs Appendix B records, in both modes', () => {
    for (const { text, ground, light, dark } of [
      { text: 'slate', ground: 'float', light: 5.49, dark: 6.94 },
      { text: 'canvas', ground: 'ink', light: 16.25, dark: 19.31 },
      { text: 'ink', ground: 'canvas', light: 16.25, dark: 19.31 },
    ]) {
      expect(measured('light', text, ground), `${text} on ${ground}, light`).toBeCloseTo(light, 2);
      expect(measured('dark', text, ground), `${text} on ${ground}, dark`).toBeCloseTo(dark, 2);
    }
  });
});

describe('the avatar', () => {
  /** A token color painted over `ground` and measured against it, as a reader sees it. */
  const measured = (mode, name, groundName) => {
    const palette = paletteFor(tokens, mode);
    const ground = parseColor(palette[groundName]);
    return contrastRatio(composite(parseColor(palette[name]), ground), ground);
  };

  // The fallback is ink initials on a bone fill, one look for everyone. The gate holds the pair as text.
  it('cites ink on bone, which the gate holds at the text minimum', () => {
    expect(CONTRAST_PAIRS).toContainEqual(
      expect.objectContaining({ text: 'ink', ground: 'bone', minimum: TEXT }),
    );
  });

  // The ring is the translucent frame over the card the avatar sits on: a cue that keeps a white logo's edge on
  // a white card, so it is measured and recorded, not gated.
  it('measures the pairs Appendix B records, in both modes', () => {
    for (const { text, ground, light, dark } of [
      { text: 'ink', ground: 'bone', light: 16.76, dark: 15.36 },
      { text: 'frame', ground: 'lifted', light: 1.28, dark: 1.43 },
    ]) {
      expect(measured('light', text, ground), `${text} on ${ground}, light`).toBeCloseTo(light, 2);
      expect(measured('dark', text, ground), `${text} on ${ground}, dark`).toBeCloseTo(dark, 2);
    }
  });
});

describe('the stat tile', () => {
  /** A token color painted over lifted, or over the 5% ink wash on lifted, and measured against it. */
  const measured = (mode, name, { washed = false } = {}) => {
    const palette = paletteFor(tokens, mode);
    const lifted = parseColor(palette.lifted);
    const ground = washed ? composite({ ...parseColor(palette.ink), a: 0.05 }, lifted) : lifted;
    return contrastRatio(composite(parseColor(palette[name]), ground), ground);
  };

  // The value is ink, the label and the caption slate, and the change line slate, gain or warning, all on the
  // Card's surface. The gate already holds each as text on lifted, so the tile adds no pair.
  it('cites ink, slate, gain and warning on lifted, which the gate holds at the text minimum', () => {
    for (const text of ['ink', 'slate', 'gain', 'warning']) {
      expect(CONTRAST_PAIRS, text).toContainEqual(
        expect.objectContaining({ text, ground: 'lifted', minimum: TEXT }),
      );
    }
  });

  // A linked tile under the pointer or a press is the 5% ink wash over lifted, a mix and not a token, so its
  // pairs are measured here and recorded, not gated. Each stays above the text minimum.
  it('measures the pairs Appendix B records, in both modes', () => {
    for (const { name, light, dark } of [
      { name: 'ink', light: 17.84, dark: 17.42 },
      { name: 'slate', light: 5.31, dark: 6.94 },
      { name: 'gain', light: 7.2, dark: 8.04 },
      { name: 'warning', light: 6.12, dark: 8.92 },
    ]) {
      expect(measured('light', name), `${name} on lifted, light`).toBeCloseTo(light, 2);
      expect(measured('dark', name), `${name} on lifted, dark`).toBeCloseTo(dark, 2);
    }
    for (const { name, light, dark } of [
      { name: 'slate', light: 4.8, dark: 6.41 },
      { name: 'ink', light: 16.11, dark: 15.25 },
      { name: 'gain', light: 6.5, dark: 7.05 },
      { name: 'warning', light: 5.53, dark: 7.81 },
    ]) {
      expect(measured('light', name, { washed: true }), `${name} on the wash, light`).toBeCloseTo(light, 2);
      expect(measured('dark', name, { washed: true }), `${name} on the wash, dark`).toBeCloseTo(dark, 2);
      for (const mode of ['light', 'dark'])
        expect(measured(mode, name, { washed: true }), `${name} ${mode}`).toBeGreaterThanOrEqual(TEXT);
    }
  });
});

describe('the meter', () => {
  /** A token color over the track, the frame composited over `surface`, and measured against the track. */
  const onTrack = (mode, name, surface) => {
    const palette = paletteFor(tokens, mode);
    const track = composite(parseColor(palette.frame), parseColor(palette[surface]));
    return contrastRatio(composite(parseColor(palette[name]), track), track);
  };
  /** The track, the frame composited over `surface`, against that surface. */
  const track = (mode, surface) => {
    const palette = paletteFor(tokens, mode);
    const ground = parseColor(palette[surface]);
    return contrastRatio(composite(parseColor(palette.frame), ground), ground);
  };

  // The label is ink and the value text slate, on the Card's surface. The gate already holds both as text on
  // lifted, so the meter adds no pair.
  it('cites ink and slate on lifted, the label and the value text', () => {
    for (const text of ['ink', 'slate']) {
      expect(CONTRAST_PAIRS, text).toContainEqual(
        expect.objectContaining({ text, ground: 'lifted', minimum: TEXT }),
      );
    }
  });

  // The track is the frame, ink at 12%, over the surface: a mix and not a token, so its pairs are measured here
  // and recorded, not gated. The fills pass the graphic minimum; the track against the surface is a cue, since
  // the value text carries the meter's extent.
  it('measures the pairs Appendix B records, in both modes', () => {
    for (const { surface, mode, ink, warning, edge } of [
      { surface: 'lifted', mode: 'light', ink: 13.88, warning: 4.77, edge: 1.28 },
      { surface: 'lifted', mode: 'dark', ink: 12.19, warning: 6.24, edge: 1.43 },
      { surface: 'canvas', mode: 'light', ink: 12.69, warning: 4.36, edge: 1.28 },
      { surface: 'canvas', mode: 'dark', ink: 14.19, warning: 7.27, edge: 1.36 },
    ]) {
      expect(onTrack(mode, 'ink', surface), `ink on the track on ${surface}, ${mode}`).toBeCloseTo(ink, 2);
      expect(onTrack(mode, 'warning', surface), `warning on the track on ${surface}, ${mode}`).toBeCloseTo(
        warning,
        2,
      );
      expect(track(mode, surface), `the track on ${surface}, ${mode}`).toBeCloseTo(edge, 2);
      for (const name of ['ink', 'warning'])
        expect(onTrack(mode, name, surface), `${name} ${surface} ${mode}`).toBeGreaterThanOrEqual(NON_TEXT);
    }
  });
});

describe('the charts', () => {
  /** A token color painted over `ground` and measured against it, as a reader sees it. */
  const measured = (mode, name, groundName) => {
    const palette = paletteFor(tokens, mode);
    const ground = parseColor(palette[groundName]);
    return contrastRatio(composite(parseColor(palette[name]), ground), ground);
  };
  /** The 10% ink wash under a sparkline, composited over lifted. */
  const wash = (mode) => {
    const palette = paletteFor(tokens, mode);
    return composite({ ...parseColor(palette.ink), a: 0.1 }, parseColor(palette.lifted));
  };

  // The line and the end point are ink, on the surface a chart sits on: Lifted (a card), Float (a panel) or
  // canvas (the page). The gate already holds ink on each as text, past the 3:1 a graphic needs, so the
  // charts add no pair.
  it('cites ink on lifted, float and canvas, which the gate holds', () => {
    for (const ground of ['lifted', 'float', 'canvas']) {
      expect(CONTRAST_PAIRS, ground).toContainEqual(
        expect.objectContaining({ text: 'ink', ground, minimum: TEXT }),
      );
    }
  });

  // The area is a 10% ink wash, a mix and not a token, so its pairs are measured here and recorded, not
  // gated. The wash is a cue; the line over it stays far past the graphic minimum.
  it('measures the pairs Appendix B records, in both modes', () => {
    for (const { ground, light, dark } of [
      { ground: 'lifted', light: 17.84, dark: 17.42 },
      { ground: 'float', light: 18.43, dark: 17.42 },
      { ground: 'canvas', light: 16.25, dark: 19.31 },
    ]) {
      expect(measured('light', 'ink', ground), `ink on ${ground}, light`).toBeCloseTo(light, 2);
      expect(measured('dark', 'ink', ground), `ink on ${ground}, dark`).toBeCloseTo(dark, 2);
    }
    /** The wash against lifted, and the ink line over the wash, in one mode. */
    const overWash = (mode) => {
      const palette = paletteFor(tokens, mode);
      const ground = wash(mode);
      return {
        area: contrastRatio(ground, parseColor(palette.lifted)),
        line: contrastRatio(composite(parseColor(palette.ink), ground), ground),
      };
    };
    const light = overWash('light');
    const dark = overWash('dark');
    expect(light.area, 'the wash on lifted, light').toBeCloseTo(1.23, 2);
    expect(dark.area, 'the wash on lifted, dark').toBeCloseTo(1.34, 2);
    expect(light.line, 'ink over the wash, light').toBeCloseTo(14.5, 2);
    expect(dark.line, 'ink over the wash, dark').toBeCloseTo(13.04, 2);
    for (const { line } of [light, dark]) expect(line).toBeGreaterThanOrEqual(NON_TEXT);
  });

  // The line chart's second series, its crosshair and its axis labels are slate, and its readout is ink on Float:
  // pairs the gate holds as text, so past the 3:1 of a graphic. The gridline and the baseline are cues, not
  // boundaries, so they are measured and recorded, not gated.
  it("measures the line chart's pairs, in both modes", () => {
    for (const ground of ['lifted', 'float', 'canvas']) {
      expect(CONTRAST_PAIRS, ground).toContainEqual(
        expect.objectContaining({ text: 'slate', ground, minimum: TEXT }),
      );
    }
    for (const { ground, light, dark } of [
      { ground: 'lifted', light: 5.31, dark: 6.94 },
      { ground: 'float', light: 5.49, dark: 6.94 },
      { ground: 'canvas', light: 4.84, dark: 7.26 },
    ]) {
      expect(measured('light', 'slate', ground), `slate on ${ground}, light`).toBeCloseTo(light, 2);
      expect(measured('dark', 'slate', ground), `slate on ${ground}, dark`).toBeCloseTo(dark, 2);
    }
    expect(measured('light', 'ink', 'float'), 'the readout, light').toBeCloseTo(18.43, 2);
    expect(measured('dark', 'ink', 'float'), 'the readout, dark').toBeCloseTo(17.42, 2);
    for (const { name, light, dark } of [
      { name: 'divider', light: 1.23, dark: 1.34 },
      { name: 'frame', light: 1.28, dark: 1.43 },
    ]) {
      expect(measured('light', name, 'lifted'), `${name} on lifted, light`).toBeCloseTo(light, 2);
      expect(measured('dark', name, 'lifted'), `${name} on lifted, dark`).toBeCloseTo(dark, 2);
    }
  });
});

describe('the search field', () => {
  /** A token color painted over `ground` and measured against it, as a reader sees it. */
  const measured = (mode, name, groundName) => {
    const palette = paletteFor(tokens, mode);
    const ground = parseColor(palette[groundName]);
    return contrastRatio(composite(parseColor(palette[name]), ground), ground);
  };
  /** Ink over the 5% ink wash on raised, the hovered or pressed field button's glyph, against the wash. */
  const inkOnWash = (mode) => {
    const palette = paletteFor(tokens, mode);
    const wash = composite({ ...parseColor(palette.ink), a: 0.05 }, parseColor(palette.raised));
    return contrastRatio(composite(parseColor(palette.ink), wash), wash);
  };

  // The field is the input's raised pill. Without a visible label its placeholder is slate, the magnifier and the
  // resting clear glyph are slate, and a hovered glyph is ink. The gate holds slate and ink on raised as text.
  it('cites slate and ink on raised, which the gate holds at the text minimum', () => {
    for (const text of ['slate', 'ink']) {
      expect(CONTRAST_PAIRS, text).toContainEqual(
        expect.objectContaining({ text, ground: 'raised', minimum: TEXT }),
      );
    }
  });

  // The wash is a mix and not a token, so ink over it is measured and recorded, not gated.
  it('measures the pairs Appendix B records, in both modes', () => {
    expect(measured('light', 'slate', 'raised'), 'slate on raised, light').toBeCloseTo(5.49, 2);
    expect(measured('dark', 'slate', 'raised'), 'slate on raised, dark').toBeCloseTo(6.44, 2);
    expect(inkOnWash('light'), 'ink on the wash over raised, light').toBeCloseTo(16.65, 2);
    expect(inkOnWash('dark'), 'ink on the wash over raised, dark').toBeCloseTo(13.24, 2);
    for (const mode of ['light', 'dark']) expect(inkOnWash(mode), mode).toBeGreaterThanOrEqual(TEXT);
  });
});

describe('the select', () => {
  /** A token color painted over `ground` and measured against it, as a reader sees it. */
  const measured = (mode, name, groundName) => {
    const palette = paletteFor(tokens, mode);
    const ground = parseColor(palette[groundName]);
    return contrastRatio(composite(parseColor(palette[name]), ground), ground);
  };

  // The trigger is the input's raised pill: its value is ink, its placeholder, its chevron and an option's icon
  // slate. The placeholder is the button's text, which axe measures, so it is slate and held as text, not taupe.
  // The list is the Menu's float panel, its rows ink and slate, the chosen row canvas on the ink pill. The gate
  // holds all of it.
  it('cites ink and slate on raised and on float, and canvas on ink, which the gate holds at the text minimum', () => {
    for (const ground of ['raised', 'float']) {
      for (const text of ['ink', 'slate']) {
        expect(CONTRAST_PAIRS, `${text} on ${ground}`).toContainEqual(
          expect.objectContaining({ text, ground, minimum: TEXT }),
        );
      }
    }
    expect(CONTRAST_PAIRS).toContainEqual(
      expect.objectContaining({ text: 'canvas', ground: 'ink', minimum: TEXT }),
    );
  });

  // The filter's divider is a separator inside the panel, not a control's boundary, so it is recorded and not gated.
  it('measures the pairs Appendix B records, in both modes', () => {
    expect(measured('light', 'ink', 'raised'), 'the value, light').toBeCloseTo(18.43, 2);
    expect(measured('dark', 'ink', 'raised'), 'the value, dark').toBeCloseTo(15.36, 2);
    expect(
      measured('light', 'slate', 'raised'),
      'the placeholder, the chevron and the icon, light',
    ).toBeCloseTo(5.49, 2);
    expect(
      measured('dark', 'slate', 'raised'),
      'the placeholder, the chevron and the icon, dark',
    ).toBeCloseTo(6.44, 2);
    // Taupe, the placeholder's color before, fails the text minimum on the trigger; it is left to a disabled one.
    expect(measured('light', 'taupe', 'raised'), 'taupe, light').toBeLessThan(TEXT);
    expect(measured('light', 'divider', 'float'), 'the filter divider, light').toBeCloseTo(1.23, 2);
    expect(measured('dark', 'divider', 'float'), 'the filter divider, dark').toBeCloseTo(1.34, 2);
  });
});

describe('the combo box', () => {
  /** A token color painted over `ground` and measured against it, as a reader sees it. */
  const measured = (mode, name, groundName) => {
    const palette = paletteFor(tokens, mode);
    const ground = parseColor(palette[groundName]);
    return contrastRatio(composite(parseColor(palette[name]), ground), ground);
  };
  /** Ink over the 5% ink wash on raised, the pressed field button's glyph while the list is open. */
  const inkOnWash = (mode) => {
    const palette = paletteFor(tokens, mode);
    const wash = composite({ ...parseColor(palette.ink), a: 0.05 }, parseColor(palette.raised));
    return contrastRatio(composite(parseColor(palette.ink), wash), wash);
  };

  // The field is the input's raised pill: its text is ink, the button's resting glyph slate. The list is the
  // Select's, the Menu's float panel, its rows ink and slate and the no-matches line slate. The gate holds all of
  // it at the text minimum.
  it('cites ink and slate on raised and on float, which the gate holds at the text minimum', () => {
    for (const ground of ['raised', 'float']) {
      for (const text of ['ink', 'slate']) {
        expect(CONTRAST_PAIRS, `${text} on ${ground}`).toContainEqual(
          expect.objectContaining({ text, ground, minimum: TEXT }),
        );
      }
    }
  });

  // The placeholder is the input's own, an attribute axe never measures, so under a visible label it keeps the
  // whisper, taupe, which is recorded and not gated; without one it is slate, the only words shown, and gated with
  // the button's glyph. The text, the Spinner, the button's glyph and the rows are gated. The wash under the
  // pressed button is a mix, not a token, so ink over it is measured and recorded.
  it('measures the pairs Appendix B records, in both modes', () => {
    expect(measured('light', 'ink', 'raised'), 'the text, light').toBeCloseTo(18.43, 2);
    expect(measured('dark', 'ink', 'raised'), 'the text, dark').toBeCloseTo(15.36, 2);
    expect(measured('light', 'slate', 'raised'), 'the glyph, light').toBeCloseTo(5.49, 2);
    expect(measured('dark', 'slate', 'raised'), 'the glyph, dark').toBeCloseTo(6.44, 2);
    for (const mode of ['light', 'dark']) {
      expect(measured(mode, 'slate', 'raised'), `the unlabelled placeholder, ${mode}`).toBeGreaterThanOrEqual(
        TEXT,
      );
    }
    expect(measured('light', 'taupe', 'raised'), 'the placeholder, light').toBeCloseTo(1.58, 2);
    expect(measured('dark', 'taupe', 'raised'), 'the placeholder, dark').toBeCloseTo(3.68, 2);
    expect(inkOnWash('light'), 'the pressed glyph, light').toBeCloseTo(16.65, 2);
    expect(inkOnWash('dark'), 'the pressed glyph, dark').toBeCloseTo(13.24, 2);
  });
});

describe('the multi-select', () => {
  /** A token color painted over `ground` and measured against it, as a reader sees it. */
  const measured = (mode, name, groundName) => {
    const palette = paletteFor(tokens, mode);
    const ground = parseColor(palette[groundName]);
    return contrastRatio(composite(parseColor(palette[name]), ground), ground);
  };
  /** Ink over the 5% ink wash on bone, the hovered or pressed remove glyph. */
  const inkOnWash = (mode) => {
    const palette = paletteFor(tokens, mode);
    const wash = composite({ ...parseColor(palette.ink), a: 0.05 }, parseColor(palette.bone));
    return contrastRatio(composite(parseColor(palette.ink), wash), wash);
  };

  // A tag is a bone pill: its text ink, its remove glyph slate, a graphic that needs 3:1 and gets the text
  // minimum. The frame is the input's raised pill, whose pairs the combo box cites.
  it('cites ink and slate on bone, which the gate holds at the text minimum', () => {
    for (const text of ['ink', 'slate']) {
      expect(CONTRAST_PAIRS, `${text} on bone`).toContainEqual(
        expect.objectContaining({ text, ground: 'bone', minimum: TEXT }),
      );
    }
  });

  // The wash is a mix, not a token, so ink over it is measured and recorded; bone against raised is a cue the
  // tag's own text carries, never a boundary anyone has to find.
  it('measures the pairs Appendix B records, in both modes', () => {
    expect(measured('light', 'ink', 'bone'), 'the tag text, light').toBeCloseTo(16.76, 2);
    expect(measured('dark', 'ink', 'bone'), 'the tag text, dark').toBeCloseTo(15.36, 2);
    expect(measured('light', 'slate', 'bone'), 'the glyph, light').toBeCloseTo(4.99, 2);
    expect(measured('dark', 'slate', 'bone'), 'the glyph, dark').toBeCloseTo(6.44, 2);
    expect(inkOnWash('light'), 'the hovered glyph, light').toBeCloseTo(15.15, 2);
    expect(inkOnWash('dark'), 'the hovered glyph, dark').toBeCloseTo(13.24, 2);
    expect(measured('light', 'bone', 'raised'), 'the pill on the frame, light').toBeCloseTo(1.1, 2);
    expect(measured('dark', 'bone', 'raised'), 'the pill on the frame, dark').toBeCloseTo(1.0, 2);
  });
});

describe('the tabs', () => {
  /** A token color painted over `ground` and measured against it, as a reader sees it. */
  const measured = (mode, name, groundName) => {
    const palette = paletteFor(tokens, mode);
    const ground = parseColor(palette[groundName]);
    return contrastRatio(composite(parseColor(palette[name]), ground), ground);
  };
  /** A token color over the 5% ink wash on canvas, a hovered or pressed tab, against the wash. */
  const onWash = (mode, name) => {
    const palette = paletteFor(tokens, mode);
    const wash = composite({ ...parseColor(palette.ink), a: 0.05 }, parseColor(palette.canvas));
    return contrastRatio(composite(parseColor(palette[name]), wash), wash);
  };

  // The track is canvas. A resting tab is slate on it, the selected tab canvas on ink, the dot clay on canvas
  // and, on the selected tab, its ring canvas on ink. The gate holds all four at the text minimum.
  it('cites slate, ink and clay on canvas, and canvas on ink, which the gate holds at the text minimum', () => {
    for (const [text, ground] of [
      ['slate', 'canvas'],
      ['ink', 'canvas'],
      ['clay', 'canvas'],
      ['canvas', 'ink'],
    ]) {
      expect(CONTRAST_PAIRS, `${text} on ${ground}`).toContainEqual(
        expect.objectContaining({ text, ground, minimum: TEXT }),
      );
    }
  });

  // The wash is a mix, not a token, so the hovered pairs are measured and recorded, not gated. Clay on ink fails
  // the 3:1 a graphic needs, the reason the dot takes a canvas ring on the selected tab; it is recorded, never
  // gated. The track against lifted is a tint, a cue the pills carry and never a boundary.
  it('measures the pairs Appendix B records, in both modes', () => {
    for (const { what, text, ground, light, dark } of [
      { what: 'a resting tab', text: 'slate', ground: 'canvas', light: 4.84, dark: 7.26 },
      { what: 'the selected tab', text: 'canvas', ground: 'ink', light: 16.25, dark: 19.31 },
      { what: 'the dot', text: 'clay', ground: 'canvas', light: 6.2, dark: 7.57 },
      { what: 'the dot on the ink pill', text: 'clay', ground: 'ink', light: 2.62, dark: 2.55 },
      { what: 'the track on a card', text: 'canvas', ground: 'lifted', light: 1.1, dark: 1.11 },
    ]) {
      expect(measured('light', text, ground), `${what}, light`).toBeCloseTo(light, 2);
      expect(measured('dark', text, ground), `${what}, dark`).toBeCloseTo(dark, 2);
    }
    expect(onWash('light', 'ink'), 'a hovered tab, light').toBeCloseTo(14.7, 2);
    expect(onWash('dark', 'ink'), 'a hovered tab, dark').toBeCloseTo(17.41, 2);
    expect(onWash('light', 'slate'), 'slate on the wash, light').toBeCloseTo(4.38, 2);
    expect(onWash('dark', 'slate'), 'slate on the wash, dark').toBeCloseTo(6.93, 2);
    // Slate on the wash is under the text minimum in light, the reason a hovered tab turns ink.
    expect(onWash('light', 'slate')).toBeLessThan(TEXT);
    for (const mode of ['light', 'dark']) {
      expect(onWash(mode, 'ink'), mode).toBeGreaterThanOrEqual(TEXT);
      expect(measured(mode, 'clay', 'ink'), mode).toBeLessThan(NON_TEXT);
    }
  });

  // A badge in a tab takes the tab's color. Its own slate would sit on the ink pill, 3.36 in light and 1.00 in
  // dark, and on the hover wash, 4.38 in light; in the tab's color it reads at the pairs above.
  it('measures the badge in its own slate on the selected and the hovered tab, under the text minimum', () => {
    expect(measured('light', 'slate', 'ink'), 'slate on the ink pill, light').toBeCloseTo(3.36, 2);
    expect(measured('dark', 'slate', 'ink'), 'slate on the ink pill, dark').toBeCloseTo(1.0, 2);
    for (const mode of ['light', 'dark']) {
      expect(measured(mode, 'slate', 'ink'), mode).toBeLessThan(TEXT);
      expect(measured(mode, 'canvas', 'ink'), mode).toBeGreaterThanOrEqual(TEXT);
    }
    expect(onWash('light', 'slate'), 'slate on the wash, light').toBeLessThan(TEXT);
  });

  /** A token color over the taupe pill on the canvas track, a disabled selected tab, against the pill. */
  const onPill = (mode, name) => {
    const palette = paletteFor(tokens, mode);
    const pill = composite(parseColor(palette.taupe), parseColor(palette.canvas));
    return contrastRatio(composite(parseColor(palette[name]), pill), pill);
  };

  // A disabled selected tab is the taupe pill with the disabled fill for its text, SegmentedControl's rule;
  // disabled is outside the text and the graphic minimums, so these are recorded, never gated. The dot keeps
  // its canvas ring there: in light the clay reads on the pill itself and in dark the ring carries it, and the
  // clay inside the ring is clay on canvas either way.
  it('measures the disabled selected tab and its dot on the taupe pill, in both modes', () => {
    for (const { what, name, light, dark } of [
      { what: 'the text on the pill', name: 'disabled', light: 1.44, dark: 3.43 },
      { what: 'the pill on the track', name: 'canvas', light: 1.4, dark: 3.81 },
      { what: 'the dot on the pill', name: 'clay', light: 4.45, dark: 1.99 },
    ]) {
      expect(onPill('light', name), `${what}, light`).toBeCloseTo(light, 2);
      expect(onPill('dark', name), `${what}, dark`).toBeCloseTo(dark, 2);
    }
    // Clay on the pill in light, or the canvas ring on it in dark, holds the 3:1 a graphic needs.
    expect(onPill('light', 'clay')).toBeGreaterThanOrEqual(NON_TEXT);
    expect(onPill('dark', 'canvas')).toBeGreaterThanOrEqual(NON_TEXT);
    for (const mode of ['light', 'dark']) {
      expect(measured(mode, 'clay', 'canvas'), mode).toBeGreaterThanOrEqual(NON_TEXT);
    }
  });
});

describe('the pagination', () => {
  /** A token color painted over `ground` and measured against it, as a reader sees it. */
  const measured = (mode, name, groundName) => {
    const palette = paletteFor(tokens, mode);
    const ground = parseColor(palette[groundName]);
    return contrastRatio(composite(parseColor(palette[name]), ground), ground);
  };
  /** Ink over the 5% ink wash on `groundName`, a hovered or pressed control, against the wash. */
  const onWash = (mode, groundName) => {
    const palette = paletteFor(tokens, mode);
    const wash = composite({ ...parseColor(palette.ink), a: 0.05 }, parseColor(palette[groundName]));
    return contrastRatio(composite(parseColor(palette.ink), wash), wash);
  };

  // A control is ink on the page or on a card, the current page canvas on ink, and the range and the gap slate
  // on either surface. The gate holds every one at the text minimum.
  it('cites ink and slate on canvas and lifted, and canvas on ink, which the gate holds at the text minimum', () => {
    for (const [text, ground] of [
      ['ink', 'canvas'],
      ['ink', 'lifted'],
      ['slate', 'canvas'],
      ['slate', 'lifted'],
      ['canvas', 'ink'],
    ]) {
      expect(CONTRAST_PAIRS, `${text} on ${ground}`).toContainEqual(
        expect.objectContaining({ text, ground, minimum: TEXT }),
      );
    }
  });

  // The wash is a mix, not a token, so a hovered control is measured and recorded, not gated.
  it('measures the pairs Appendix B records, in both modes', () => {
    for (const { what, text, ground, light, dark } of [
      { what: 'a control', text: 'ink', ground: 'canvas', light: 16.25, dark: 19.31 },
      { what: 'a control on a card', text: 'ink', ground: 'lifted', light: 17.84, dark: 17.42 },
      { what: 'the current page', text: 'canvas', ground: 'ink', light: 16.25, dark: 19.31 },
      { what: 'the range and the gap', text: 'slate', ground: 'canvas', light: 4.84, dark: 7.26 },
      { what: 'the range and the gap on a card', text: 'slate', ground: 'lifted', light: 5.31, dark: 6.94 },
    ]) {
      expect(measured('light', text, ground), `${what}, light`).toBeCloseTo(light, 2);
      expect(measured('dark', text, ground), `${what}, dark`).toBeCloseTo(dark, 2);
    }
    expect(onWash('light', 'canvas'), 'a hovered control, light').toBeCloseTo(14.7, 2);
    expect(onWash('dark', 'canvas'), 'a hovered control, dark').toBeCloseTo(17.41, 2);
    expect(onWash('light', 'lifted'), 'a hovered control on a card, light').toBeCloseTo(16.11, 2);
    expect(onWash('dark', 'lifted'), 'a hovered control on a card, dark').toBeCloseTo(15.25, 2);
    for (const mode of ['light', 'dark']) {
      for (const ground of ['canvas', 'lifted']) {
        expect(onWash(mode, ground), `${mode} on ${ground}`).toBeGreaterThanOrEqual(TEXT);
      }
    }
  });
});

describe('the number field', () => {
  /** A token color painted over `ground` and measured against it, as a reader sees it. */
  const measured = (mode, name, groundName) => {
    const palette = paletteFor(tokens, mode);
    const ground = parseColor(palette[groundName]);
    return contrastRatio(composite(parseColor(palette[name]), ground), ground);
  };
  /** Ink over the 5% ink wash on raised, a hovered or pressed field button's glyph, against the wash. */
  const inkOnWash = (mode) => {
    const palette = paletteFor(tokens, mode);
    const wash = composite({ ...parseColor(palette.ink), a: 0.05 }, parseColor(palette.raised));
    return contrastRatio(composite(parseColor(palette.ink), wash), wash);
  };

  // The symbol, the resting sign glyph and an unlabelled placeholder are slate on the raised pill; a pressed sign
  // button is a canvas glyph on ink with the canvas ring inside it. The gate holds all three.
  it('cites slate on raised, canvas on ink and the inverted ring, which the gate holds', () => {
    expect(CONTRAST_PAIRS).toContainEqual(
      expect.objectContaining({ text: 'slate', ground: 'raised', minimum: TEXT }),
    );
    expect(CONTRAST_PAIRS).toContainEqual(
      expect.objectContaining({ text: 'canvas', ground: 'ink', minimum: TEXT }),
    );
    expect(CONTRAST_PAIRS).toContainEqual(
      expect.objectContaining({ text: 'canvas', ground: 'ink', minimum: NON_TEXT }),
    );
  });

  // The wash is a mix and not a token, so ink over it is measured and recorded, not gated.
  it('measures the pairs Appendix B records, in both modes', () => {
    expect(measured('light', 'slate', 'raised'), 'the symbol, light').toBeCloseTo(5.49, 2);
    expect(measured('dark', 'slate', 'raised'), 'the symbol, dark').toBeCloseTo(6.44, 2);
    expect(measured('light', 'canvas', 'ink'), 'the pressed sign, light').toBeCloseTo(16.25, 2);
    expect(measured('dark', 'canvas', 'ink'), 'the pressed sign, dark').toBeCloseTo(19.31, 2);
    expect(inkOnWash('light'), 'a hovered button, light').toBeCloseTo(16.65, 2);
    expect(inkOnWash('dark'), 'a hovered button, dark').toBeCloseTo(13.24, 2);
    for (const mode of ['light', 'dark']) expect(inkOnWash(mode), mode).toBeGreaterThanOrEqual(TEXT);
  });
});

describe('the calendar', () => {
  /** A token color painted over `ground` and measured against it, as a reader sees it. */
  const measured = (mode, name, groundName) => {
    const palette = paletteFor(tokens, mode);
    const ground = parseColor(palette[groundName]);
    return contrastRatio(composite(parseColor(palette[name]), ground), ground);
  };
  /** The `percent` ink wash over float: the range band at 10%, a hovered day at 5%. */
  const wash = (mode, percent) => {
    const palette = paletteFor(tokens, mode);
    return composite({ ...parseColor(palette.ink), a: percent / 100 }, parseColor(palette.float));
  };
  /** Ink over a wash, against the wash. */
  const inkOn = (mode, percent) => {
    const ground = wash(mode, percent);
    return contrastRatio(composite(parseColor(paletteFor(tokens, mode).ink), ground), ground);
  };

  // The days and the month are ink, the weekdays slate, today's ring the boundary as a control edge, and a chosen
  // day canvas on ink with the canvas ring inside it. The gate holds every one of them on the surfaces a calendar
  // sits on: canvas, a card and the float popover or sheet.
  it('cites ink, slate and canvas on ink, and the boundary as a track, which the gate holds', () => {
    for (const ground of ['canvas', 'float', 'raised']) {
      expect(CONTRAST_PAIRS).toContainEqual(expect.objectContaining({ text: 'ink', ground, minimum: TEXT }));
      expect(CONTRAST_PAIRS).toContainEqual(
        expect.objectContaining({ text: 'slate', ground, minimum: TEXT }),
      );
      expect(CONTRAST_PAIRS).toContainEqual(
        expect.objectContaining({ text: 'boundary', ground, minimum: NON_TEXT }),
      );
    }
    expect(CONTRAST_PAIRS).toContainEqual(
      expect.objectContaining({ text: 'canvas', ground: 'ink', minimum: TEXT }),
    );
    expect(CONTRAST_PAIRS).toContainEqual(
      expect.objectContaining({ text: 'canvas', ground: 'ink', minimum: NON_TEXT }),
    );
  });

  // The band and the hover wash are mixes and not tokens, so they are measured and recorded, not gated. The band is
  // a cue under 3:1: the filled ends and aria-selected carry the range (R8).
  it('measures the pairs Appendix B records, in both modes', () => {
    expect(measured('light', 'slate', 'float'), 'the weekdays on float, light').toBeCloseTo(5.49, 2);
    expect(measured('dark', 'slate', 'float'), 'the weekdays on float, dark').toBeCloseTo(6.94, 2);
    expect(measured('light', 'slate', 'canvas'), 'the weekdays on canvas, light').toBeCloseTo(4.84, 2);
    expect(measured('dark', 'slate', 'canvas'), 'the weekdays on canvas, dark').toBeCloseTo(7.26, 2);
    expect(measured('light', 'boundary', 'float'), 'the today ring on float, light').toBeCloseTo(3.48, 2);
    expect(measured('dark', 'boundary', 'float'), 'the today ring on float, dark').toBeCloseTo(5.21, 2);
    expect(measured('light', 'boundary', 'canvas'), 'the today ring on canvas, light').toBeCloseTo(3.38, 2);
    expect(measured('dark', 'boundary', 'canvas'), 'the today ring on canvas, dark').toBeCloseTo(5.34, 2);
    expect(measured('light', 'canvas', 'ink'), 'a chosen day, light').toBeCloseTo(16.25, 2);
    expect(measured('dark', 'canvas', 'ink'), 'a chosen day, dark').toBeCloseTo(19.31, 2);
    const float = (mode) => parseColor(paletteFor(tokens, mode).float);
    expect(contrastRatio(wash('light', 10), float('light')), 'the band, light').toBeCloseTo(1.23, 2);
    expect(contrastRatio(wash('dark', 10), float('dark')), 'the band, dark').toBeCloseTo(1.34, 2);
    expect(inkOn('light', 10), 'a day in the band, light').toBeCloseTo(14.97, 2);
    expect(inkOn('dark', 10), 'a day in the band, dark').toBeCloseTo(13.04, 2);
    expect(inkOn('light', 5), 'a hovered day, light').toBeCloseTo(16.65, 2);
    expect(inkOn('dark', 5), 'a hovered day, dark').toBeCloseTo(15.25, 2);
    for (const mode of ['light', 'dark']) {
      expect(inkOn(mode, 10), mode).toBeGreaterThanOrEqual(TEXT);
      expect(inkOn(mode, 5), mode).toBeGreaterThanOrEqual(TEXT);
    }
  });
});

describe('the date range picker', () => {
  /** A token color painted over `ground` and measured against it, as a reader sees it. */
  const measured = (mode, name, groundName) => {
    const palette = paletteFor(tokens, mode);
    const ground = parseColor(palette[groundName]);
    return contrastRatio(composite(parseColor(palette[name]), ground), ground);
  };

  // The segments are ink on the raised pill, the arrow and every empty segment slate on it, labelled or not, and
  // the focused segment canvas on its ink chip, empty or not. The gate holds all three; the calendar it opens is
  // the calendar's record.
  it('cites ink, slate and canvas on ink, which the gate holds, for the segments, the placeholder and the arrow', () => {
    for (const text of ['ink', 'slate']) {
      expect(CONTRAST_PAIRS).toContainEqual(
        expect.objectContaining({ text, ground: 'raised', minimum: TEXT }),
      );
    }
    expect(CONTRAST_PAIRS).toContainEqual(
      expect.objectContaining({ text: 'canvas', ground: 'ink', minimum: TEXT }),
    );
  });

  it('measures the pairs Appendix B records, in both modes', () => {
    expect(measured('light', 'ink', 'raised'), 'a segment, light').toBeCloseTo(18.43, 2);
    expect(measured('dark', 'ink', 'raised'), 'a segment, dark').toBeCloseTo(15.36, 2);
    expect(measured('light', 'slate', 'raised'), 'the arrow, light').toBeCloseTo(5.49, 2);
    expect(measured('dark', 'slate', 'raised'), 'the arrow, dark').toBeCloseTo(6.44, 2);
    for (const mode of ['light', 'dark']) {
      expect(measured(mode, 'slate', 'raised'), `an empty segment, ${mode}`).toBeGreaterThanOrEqual(TEXT);
    }
    expect(measured('light', 'canvas', 'ink'), 'the focused segment, light').toBeCloseTo(16.25, 2);
    expect(measured('dark', 'canvas', 'ink'), 'the focused segment, dark').toBeCloseTo(19.31, 2);
  });
});

describe('the filter chip', () => {
  /** A token color painted over `ground` and measured against it, as a reader sees it. */
  const measured = (mode, name, groundName) => {
    const palette = paletteFor(tokens, mode);
    const ground = parseColor(palette[groundName]);
    return contrastRatio(composite(parseColor(palette[name]), ground), ground);
  };
  /** `top` at `percent` painted over `ground`, as color-mix with transparent paints it. */
  const mix = (mode, top, percent, ground) => {
    const palette = paletteFor(tokens, mode);
    return composite({ ...parseColor(palette[top]), a: percent / 100 }, parseColor(palette[ground]));
  };
  /** A token color painted over a mixed ground, against that ground. */
  const on = (mode, name, ground) =>
    contrastRatio(composite(parseColor(paletteFor(tokens, mode)[name]), ground), ground);

  // A chip at rest is the boundary edge on whatever it sits on, its label ink and its chevron slate; active, it is
  // canvas on the ink fill, with the canvas ring inside its clear button. The gate holds each on canvas and a card.
  it('cites canvas on ink, ink and slate on canvas and on a card, and the boundary as a track, which the gate holds', () => {
    for (const ground of ['canvas', 'lifted']) {
      expect(CONTRAST_PAIRS).toContainEqual(expect.objectContaining({ text: 'ink', ground, minimum: TEXT }));
      expect(CONTRAST_PAIRS).toContainEqual(
        expect.objectContaining({ text: 'slate', ground, minimum: TEXT }),
      );
      // The switch's off track: the boundary painted on the surface itself, as the chip's edge is.
      expect(CONTRAST_PAIRS).toContainEqual(
        expect.objectContaining({ text: 'boundary', ground, minimum: NON_TEXT }),
      );
    }
    expect(CONTRAST_PAIRS).toContainEqual(
      expect.objectContaining({ text: 'canvas', ground: 'ink', minimum: TEXT }),
    );
    expect(CONTRAST_PAIRS).toContainEqual(
      expect.objectContaining({ text: 'canvas', ground: 'ink', minimum: NON_TEXT }),
    );
  });

  // The washes are mixes and not tokens, and the disabled edge is a disabled part, so they are measured and
  // recorded, not gated (spec corrections 27 and 31).
  it('measures the pairs Appendix B records, in both modes', () => {
    expect(measured('light', 'boundary', 'canvas'), 'the edge on canvas, light').toBeCloseTo(3.38, 2);
    expect(measured('dark', 'boundary', 'canvas'), 'the edge on canvas, dark').toBeCloseTo(5.34, 2);
    expect(measured('light', 'boundary', 'lifted'), 'the edge on a card, light').toBeCloseTo(3.45, 2);
    expect(measured('dark', 'boundary', 'lifted'), 'the edge on a card, dark').toBeCloseTo(5.21, 2);
    expect(measured('light', 'canvas', 'ink'), 'an active chip, light').toBeCloseTo(16.25, 2);
    expect(measured('dark', 'canvas', 'ink'), 'an active chip, dark').toBeCloseTo(19.31, 2);
    expect(measured('light', 'ink', 'canvas'), 'the label at rest, light').toBeCloseTo(16.25, 2);
    expect(measured('dark', 'ink', 'canvas'), 'the label at rest, dark').toBeCloseTo(19.31, 2);
    expect(measured('light', 'slate', 'canvas'), 'the chevron, light').toBeCloseTo(4.84, 2);
    expect(measured('dark', 'slate', 'canvas'), 'the chevron, dark').toBeCloseTo(7.26, 2);
    expect(on('light', 'ink', mix('light', 'ink', 5, 'canvas')), 'a hovered chip, light').toBeCloseTo(
      14.7,
      2,
    );
    expect(on('dark', 'ink', mix('dark', 'ink', 5, 'canvas')), 'a hovered chip, dark').toBeCloseTo(17.41, 2);
    const ink = (mode) => parseColor(paletteFor(tokens, mode).ink);
    const clearWash = (mode) => mix(mode, 'canvas', 15, 'ink');
    expect(contrastRatio(clearWash('light'), ink('light')), 'the clear wash, light').toBeCloseTo(1.5, 2);
    expect(contrastRatio(clearWash('dark'), ink('dark')), 'the clear wash, dark').toBeCloseTo(1.39, 2);
    expect(on('light', 'canvas', clearWash('light')), 'the clear glyph, light').toBeCloseTo(10.81, 2);
    expect(on('dark', 'canvas', clearWash('dark')), 'the clear glyph, dark').toBeCloseTo(13.93, 2);
    const canvas = (mode) => parseColor(paletteFor(tokens, mode).canvas);
    const disabledEdge = (mode) => contrastRatio(mix(mode, 'ink', 15, 'canvas'), canvas(mode));
    expect(disabledEdge('light'), 'the disabled edge, light').toBeCloseTo(1.37, 2);
    expect(disabledEdge('dark'), 'the disabled edge, dark').toBeCloseTo(1.51, 2);
    for (const mode of ['light', 'dark']) {
      expect(on(mode, 'canvas', clearWash(mode)), mode).toBeGreaterThanOrEqual(TEXT);
      expect(on(mode, 'ink', mix(mode, 'ink', 5, 'canvas')), mode).toBeGreaterThanOrEqual(TEXT);
    }
  });
});

describe('the filter bar', () => {
  /** A token color painted over `ground` and measured against it, as a reader sees it. */
  const measured = (mode, name, groundName) => {
    const palette = paletteFor(tokens, mode);
    const ground = parseColor(palette[groundName]);
    return contrastRatio(composite(parseColor(palette[name]), ground), ground);
  };

  // A section's title is ink on whatever holds it: the float panel of More, the sheet's float, or the canvas
  // behind a row. The Filters button and Clear all are Buttons and More is a chip, each with its own record.
  it('cites ink on float, on raised and on canvas, which the gate holds', () => {
    for (const ground of ['float', 'raised', 'canvas']) {
      expect(CONTRAST_PAIRS).toContainEqual(expect.objectContaining({ text: 'ink', ground, minimum: TEXT }));
    }
  });

  // The divider between the panel's sections is a separator, a mix of ink, measured and recorded, not gated.
  it('measures the pairs Appendix B records, in both modes', () => {
    expect(measured('light', 'ink', 'float'), 'a section title, light').toBeCloseTo(18.43, 2);
    expect(measured('dark', 'ink', 'float'), 'a section title, dark').toBeCloseTo(17.42, 2);
    expect(measured('light', 'divider', 'float'), 'the panel divider, light').toBeCloseTo(1.23, 2);
    expect(measured('dark', 'divider', 'float'), 'the panel divider, dark').toBeCloseTo(1.34, 2);
  });
});

describe('the empty state', () => {
  /** A token color painted over `ground` and measured against it, as a reader sees it. */
  const measured = (mode, name, groundName) => {
    const palette = paletteFor(tokens, mode);
    const ground = parseColor(palette[groundName]);
    return contrastRatio(composite(parseColor(palette[name]), ground), ground);
  };

  // The title is ink and the description and the icon slate, on the page, a card or a floating panel. The gate
  // holds each as text on all three, so the empty state adds no pair.
  it('cites ink and slate on canvas, lifted and float, which the gate holds', () => {
    for (const text of ['ink', 'slate']) {
      for (const ground of ['canvas', 'lifted', 'float']) {
        expect(CONTRAST_PAIRS, `${text} on ${ground}`).toContainEqual(
          expect.objectContaining({ text, ground, minimum: TEXT }),
        );
      }
    }
  });

  it('measures the pairs Appendix B records, in both modes', () => {
    for (const { text, ground, light, dark } of [
      { text: 'ink', ground: 'canvas', light: 16.25, dark: 19.31 },
      { text: 'ink', ground: 'lifted', light: 17.84, dark: 17.42 },
      { text: 'slate', ground: 'canvas', light: 4.84, dark: 7.26 },
      { text: 'slate', ground: 'lifted', light: 5.31, dark: 6.94 },
    ]) {
      expect(measured('light', text, ground), `${text} on ${ground}, light`).toBeCloseTo(light, 2);
      expect(measured('dark', text, ground), `${text} on ${ground}, dark`).toBeCloseTo(dark, 2);
      for (const mode of ['light', 'dark'])
        expect(measured(mode, text, ground), `${text} on ${ground}, ${mode}`).toBeGreaterThanOrEqual(TEXT);
    }
  });
});

describe('the skeleton', () => {
  /** The divider, or the divider at `share` of its opacity, painted over `ground` and measured against it. */
  const fill = (mode, groundName, share = 1) => {
    const palette = paletteFor(tokens, mode);
    const ground = parseColor(palette[groundName]);
    const divider = parseColor(palette.divider);
    return contrastRatio(composite({ ...divider, a: divider.a * share }, ground), ground);
  };

  // The fill is the divider, ink at 10% (white at 10% in dark), and the pulse takes it to half of that. A
  // skeleton is a decoration hidden from assistive technology, so its fill is measured and recorded, not gated.
  it('measures the fill and its pulse against canvas and lifted, recorded and not gated', () => {
    for (const { ground, share, light, dark } of [
      { ground: 'canvas', share: 1, light: 1.23, dark: 1.28 },
      { ground: 'lifted', share: 1, light: 1.23, dark: 1.34 },
      { ground: 'canvas', share: 0.5, light: 1.11, dark: 1.11 },
      { ground: 'lifted', share: 0.5, light: 1.11, dark: 1.14 },
    ]) {
      expect(fill('light', ground, share), `${String(share)} on ${ground}, light`).toBeCloseTo(light, 2);
      expect(fill('dark', ground, share), `${String(share)} on ${ground}, dark`).toBeCloseTo(dark, 2);
    }
    expect(CONTRAST_PAIRS.some((pair) => pair.text === 'divider' || pair.ground === 'divider')).toBe(false);
  });
});

describe('the data table', () => {
  /** A token color over `ground`, or over the 5% ink wash on it, measured against what it sits on. */
  const measured = (mode, name, groundName, { washed = false } = {}) => {
    const palette = paletteFor(tokens, mode);
    const base = parseColor(palette[groundName]);
    const ground = washed ? composite({ ...parseColor(palette.ink), a: 0.05 }, base) : base;
    return contrastRatio(composite(parseColor(palette[name]), ground), ground);
  };

  // A cell is ink and a header slate, on the page or in a card. The gate holds each as text on both, so the
  // table adds no pair.
  it('cites ink and slate on canvas and lifted, which the gate holds', () => {
    for (const text of ['ink', 'slate']) {
      for (const ground of ['canvas', 'lifted']) {
        expect(CONTRAST_PAIRS, `${text} on ${ground}`).toContainEqual(
          expect.objectContaining({ text, ground, minimum: TEXT }),
        );
      }
    }
  });

  // The hover wash is a mix and not a token, so its pairs are measured and recorded, not gated. Slate falls
  // under 4.5 on it over canvas in light, so a sorted or hovered header is ink, and no slate text sits on a
  // washed row. The rules are the divider and the frame, recorded as drawn.
  it('measures the pairs Appendix B records, in both modes', () => {
    for (const { text, ground, washed, light, dark } of [
      { text: 'ink', ground: 'canvas', washed: false, light: 16.25, dark: 19.31 },
      { text: 'ink', ground: 'lifted', washed: false, light: 17.84, dark: 17.42 },
      { text: 'slate', ground: 'canvas', washed: false, light: 4.84, dark: 7.26 },
      { text: 'slate', ground: 'lifted', washed: false, light: 5.31, dark: 6.94 },
      { text: 'ink', ground: 'canvas', washed: true, light: 14.7, dark: 17.41 },
      { text: 'ink', ground: 'lifted', washed: true, light: 16.11, dark: 15.25 },
      { text: 'slate', ground: 'canvas', washed: true, light: 4.38, dark: 6.93 },
      { text: 'slate', ground: 'lifted', washed: true, light: 4.8, dark: 6.41 },
      { text: 'divider', ground: 'canvas', washed: false, light: 1.23, dark: 1.28 },
      { text: 'frame', ground: 'canvas', washed: false, light: 1.28, dark: 1.36 },
    ]) {
      const what = `${text} on ${washed ? 'the wash over ' : ''}${ground}`;
      expect(measured('light', text, ground, { washed }), `${what}, light`).toBeCloseTo(light, 2);
      expect(measured('dark', text, ground, { washed }), `${what}, dark`).toBeCloseTo(dark, 2);
    }
    expect(measured('light', 'slate', 'canvas', { washed: true })).toBeLessThan(TEXT);
    for (const mode of ['light', 'dark']) {
      for (const ground of ['canvas', 'lifted']) {
        expect(
          measured(mode, 'ink', ground, { washed: true }),
          `ink washed ${ground} ${mode}`,
        ).toBeGreaterThanOrEqual(TEXT);
      }
    }
  });

  // A selected row is the 8% wash, one step over hover, measured and recorded as the 5% is. No slate text sits
  // on a selected table row. The bar's count is ink on the float surface, which the gate holds.
  it('measures a selected row and the bar, in both modes', () => {
    const selectedOn = (mode, name, groundName) => {
      const palette = paletteFor(tokens, mode);
      const ground = composite({ ...parseColor(palette.ink), a: 0.08 }, parseColor(palette[groundName]));
      return contrastRatio(composite(parseColor(palette[name]), ground), ground);
    };
    for (const { text, ground, light, dark } of [
      { text: 'ink', ground: 'canvas', light: 13.81, dark: 16.06 },
      { text: 'ink', ground: 'lifted', light: 15.13, dark: 13.92 },
      { text: 'slate', ground: 'canvas', light: 4.11, dark: 6.62 },
      { text: 'slate', ground: 'lifted', light: 4.51, dark: 6.04 },
    ]) {
      expect(selectedOn('light', text, ground), `${text} on 8% over ${ground}, light`).toBeCloseTo(light, 2);
      expect(selectedOn('dark', text, ground), `${text} on 8% over ${ground}, dark`).toBeCloseTo(dark, 2);
    }
    expect(CONTRAST_PAIRS).toContainEqual(
      expect.objectContaining({ text: 'ink', ground: 'float', minimum: TEXT }),
    );
    expect(measured('light', 'ink', 'float')).toBeCloseTo(18.43, 2);
    expect(measured('dark', 'ink', 'float')).toBeCloseTo(17.42, 2);
  });

  // The list face's meta line is slate on the page or in a card, which the gate holds; on a hovered or selected
  // item it turns ink, which the 5% and 8% washes keep over 13. A selected item's mark out of Select mode is a
  // canvas check on an ink box, the checked checkbox's own pair.
  it('measures the list face, in both modes', () => {
    for (const { text, ground, washed, light, dark } of [
      { text: 'slate', ground: 'canvas', washed: false, light: 4.84, dark: 7.26 },
      { text: 'slate', ground: 'lifted', washed: false, light: 5.31, dark: 6.94 },
      { text: 'ink', ground: 'canvas', washed: true, light: 14.7, dark: 17.41 },
      { text: 'canvas', ground: 'ink', washed: false, light: 16.25, dark: 19.31 },
    ]) {
      const what = `${text} on ${washed ? 'the wash over ' : ''}${ground}`;
      expect(measured('light', text, ground, { washed }), `${what}, light`).toBeCloseTo(light, 2);
      expect(measured('dark', text, ground, { washed }), `${what}, dark`).toBeCloseTo(dark, 2);
    }
  });

  // The error line under the rows is error text on the page or in a card, which the gate holds; the reloading
  // cue is an ink line that dims no text, so no row's pair changes while rows reload.
  it('cites the error line on canvas and lifted, which the gate holds, and measures it', () => {
    for (const ground of ['canvas', 'lifted']) {
      expect(CONTRAST_PAIRS, `error on ${ground}`).toContainEqual(
        expect.objectContaining({ text: 'error', ground, minimum: TEXT }),
      );
    }
    for (const { ground, light, dark } of [
      { ground: 'canvas', light: 6.58, dark: 6.36 },
      { ground: 'lifted', light: 7.22, dark: 5.73 },
    ]) {
      expect(measured('light', 'error', ground), `error on ${ground}, light`).toBeCloseTo(light, 2);
      expect(measured('dark', 'error', ground), `error on ${ground}, dark`).toBeCloseTo(dark, 2);
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
