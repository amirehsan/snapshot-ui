import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const components = readdirSync(new URL('../src/components', import.meta.url)).filter((f) =>
  f.endsWith('.css'),
);

const stripComments = (css) => css.replace(/\/\*[\s\S]*?\*\//g, '');

/**
 * An `outline` or `outline-color` declaration that reads ink, in CSS without
 * comments. The lookbehind keeps `.badge-outline` and `--outline` out, the
 * `[^;{}]` stops at the end of the declaration or the rule, and the closing
 * `[,)]` also catches `var(--color-ink, fallback)` but not `var(--color-inkwell)`.
 */
const INK_RING = /(?<![\w-])outline(?:-color)?\s*:[^;{}]*var\(\s*--color-ink\s*[,)]/i;

/** The text between the braces that follow `header`, nested blocks included. */
function blockAfter(css, header) {
  const start = css.indexOf(header);
  if (start === -1) return '';
  const open = css.indexOf('{', start) + 1;
  let depth = 1;
  let close = open;
  while (depth > 0 && close < css.length) {
    const char = css[close++];
    if (char === '{') depth += 1;
    else if (char === '}') depth -= 1;
  }
  return css.slice(open, close - 1);
}

describe('src/styles.css', () => {
  const entry = read('src/styles.css');

  it('imports every component file, and nothing that does not exist', () => {
    const imported = [...entry.matchAll(/@import '\.\/components\/([^']+)';/g)].map((m) => m[1]);
    expect(imported.sort()).toEqual([...components].sort());
  });

  it('declares the layer order before anything else', () => {
    const statement = entry.indexOf('@layer theme, base, components, utilities;');
    expect(statement).toBeGreaterThanOrEqual(0);
    expect(statement).toBeLessThan(entry.indexOf('@import'));
  });
});

describe.each(components)('src/components/%s', (file) => {
  const source = read(`src/components/${file}`);

  it('keeps every rule inside @layer components', () => {
    const withoutComments = stripComments(source).trim();
    expect(withoutComments.startsWith('@layer components {')).toBe(true);
    expect(withoutComments.endsWith('}')).toBe(true);
  });

  it('honors reduced motion wherever it moves', () => {
    if (/\b(transition|animation)\s*:/.test(source)) {
      expect(source).toContain('prefers-reduced-motion: reduce');
    }
  });

  it('is built to dist', () => {
    expect(existsSync(new URL(`../dist/components/${file}`, import.meta.url))).toBe(true);
  });

  it('draws its focus ring in the focus ring token, never in ink', () => {
    // An inset ring on an ink fill inverts to the canvas color, which is allowed.
    expect(stripComments(source)).not.toMatch(INK_RING);
  });
});

describe('the ink ring guard', () => {
  it('matches an outline that reads ink, however it is written', () => {
    for (const css of [
      'outline: 2px solid var(--color-ink);',
      'outline-color: var(--color-ink, red)',
      'OUTLINE: 1px solid VAR( --color-ink )',
      'outline:\n    var(--focus-ring-width)\n    solid\n    var(--color-ink);',
      '.a { outline: var(--focus-ring-offset) solid var(--color-ink) }',
    ]) {
      expect(css, css).toMatch(INK_RING);
    }
  });

  it('leaves everything else alone', () => {
    for (const css of [
      '.badge-outline:hover { background: var(--color-ink); }',
      'outline: var(--focus-ring-width) solid var(--focus-ring-color); color: var(--color-ink)',
      'outline-color: var(--color-canvas);',
      'outline: 2px solid var(--color-inkwell);',
      stripComments('/* outline: var(--color-ink) */ .a { color: var(--color-ink); }'),
    ]) {
      expect(css, css).not.toMatch(INK_RING);
    }
  });
});

describe('type components', () => {
  it.each(['copy.css', 'eyebrow.css'])(
    '%s sets text the reader has to read in slate, never taupe',
    (file) => {
      // Taupe is for placeholders and disabled text. Everything else is read.
      const source = read(`src/components/${file}`);
      expect(source).toContain('var(--color-slate)');
      expect(source).not.toContain('--color-taupe');

      if (file === 'eyebrow.css') {
        const css = stripComments(source);
        // The label is tracked at its own token.
        expect(blockAfter(css, '.eyebrow {')).toContain(
          'letter-spacing: var(--text-eyebrow--letter-spacing);',
        );
        // The dot is light signal orange, the attention cue. Signal orange is consent only.
        expect(blockAfter(css, '.eyebrow::before {')).toContain(
          'background-color: var(--color-signal-light);',
        );
        expect(css).not.toContain('var(--color-signal)');
        // The inset variant keeps the dot inside the box, and it comes after the rule it overrides.
        expect(blockAfter(css, '.eyebrow-inset::before {')).toContain('margin-inline-start: 0;');
        expect(css.indexOf('.eyebrow-inset::before')).toBeGreaterThan(css.indexOf('.eyebrow::before'));
      }
    },
  );
});

describe('dist/components/heading.css', () => {
  it.each([1, 2, 3, 4])('draws heading-%i from its own type token', (step) => {
    const rule = blockAfter(read('dist/components/heading.css'), `.heading-${step} `);
    expect(rule).toContain(`font-size: var(--text-h${step});`);
    expect(rule).toContain(`line-height: var(--text-h${step}--line-height);`);
    // The subhead has no tracking token, so it resets to normal and does not inherit.
    const tracking = step === 4 ? 'normal' : `var(--text-h${step}--letter-spacing)`;
    expect(rule).toContain(`letter-spacing: ${tracking};`);
    expect(rule).toContain(`font-weight: var(--text-h${step}--font-weight);`);
  });

  // A media query cannot read a custom property, so the breakpoints are written
  // out in the CSS. They must stay the token values.
  const queries = async () => {
    const { tokens } = await import('../dist/tokens.js');
    return {
      tablet: `@media (width < ${tokens.breakpoint.md.value})`,
      phone: `@media (width < ${tokens.breakpoint.sm.value})`,
    };
  };

  it('scales the display step to 48px under 1024px and 40px under 768px, and the section step to 28px under 768px', async () => {
    const built = read('dist/components/heading.css');
    const { tablet, phone } = await queries();
    expect(blockAfter(built, tablet)).toMatch(/\.heading-1\s*\{\s*font-size:\s*3rem;\s*\}/);
    expect(blockAfter(built, phone)).toMatch(/\.heading-1\s*\{\s*font-size:\s*2\.5rem;\s*\}/);
    expect(blockAfter(built, phone)).toMatch(/\.heading-2\s*\{\s*font-size:\s*1\.75rem;\s*\}/);
  });

  it('leaves the card title and subhead steps alone at every width, and the section step above 768px', async () => {
    const built = read('dist/components/heading.css');
    const { tablet, phone } = await queries();
    for (const query of [tablet, phone]) {
      expect(blockAfter(built, query)).not.toMatch(/\.heading-[34]/);
    }
    expect(blockAfter(built, tablet)).not.toContain('.heading-2');
  });
});

describe('src/components/link.css', () => {
  const source = () => stripComments(read('src/components/link.css')).replace(/\s+/g, ' ');

  it('breaks a long address anywhere, so a narrow screen is never pushed sideways', () => {
    expect(blockAfter(source(), '.link {')).toContain('overflow-wrap: anywhere;');
  });

  it('treats aria-disabled like data-disabled, so a plain anchor can be switched off', () => {
    const css = source();
    expect(css).toContain(".link:is([data-disabled], [aria-disabled='true']) {");
    // A disabled link keeps its 1px underline: neither hover nor press may thicken it.
    expect(css).toContain(".link:is(:hover, [data-hovered]):not([data-disabled], [aria-disabled='true']) {");
    expect(css).toContain(".link:is(:active, [data-pressed]):not([data-disabled], [aria-disabled='true']) {");
  });
});

describe('src/components/button.css', () => {
  const source = () => stripComments(read('src/components/button.css')).replace(/\s+/g, ' ');

  it('draws a plain anchor with aria-disabled as disabled, but never a pending button', () => {
    // React Aria marks a pending button aria-disabled too, and a pending button keeps its fill.
    const disabled = ":is(:disabled, [data-disabled], :where([aria-disabled='true']:not([data-pending])))";
    const css = source();
    expect(css).toContain(`.button-tertiary${disabled} {`);
    const rule = blockAfter(css, `.button${disabled} {`);
    expect(rule).toContain('color: var(--color-taupe);');
    expect(rule).toContain('cursor: not-allowed;');
  });
});

describe('src/components/icon-button.css', () => {
  const source = () => stripComments(read('src/components/icon-button.css')).replace(/\s+/g, ' ');

  it('draws a plain anchor with aria-disabled as disabled, and leaves it no hover or press', () => {
    const css = source();
    const rule = blockAfter(css, ".icon-button:is(:disabled, [data-disabled], [aria-disabled='true']) {");
    expect(rule).toContain('border-color: var(--icon-button-border-disabled);');
    expect(rule).toContain('color: var(--color-taupe);');
    expect(rule).toContain('cursor: not-allowed;');
    // The hover and press rules skip the same three, so the two stay in step.
    const skipped = ":not(:disabled, [data-disabled], [aria-disabled='true']) {";
    expect(css).toContain(`.icon-button:is(:hover, [data-hovered])${skipped}`);
    expect(css).toContain(`.icon-button:is(:active, [data-pressed])${skipped}`);
  });
});

describe('src/components/field.css', () => {
  const source = () => stripComments(read('src/components/field.css')).replace(/\s+/g, ' ');
  // The label, the hint and the error line (which share one rule) and the count.
  const wrapping = ['.field-label {', '.field-description, .field-error {', '.field-counter {'];

  it('breaks a long unbroken word in the label, hint, error line and count, so a narrow screen is never pushed sideways', () => {
    for (const header of wrapping) {
      expect(blockAfter(source(), header), header).toContain('overflow-wrap: anywhere;');
    }
  });

  it('sets every text part in the library font, so a page without base.css keeps the controls and their labels alike', () => {
    for (const header of [...wrapping, '.field-changed {']) {
      expect(blockAfter(source(), header), header).toContain('font-family: var(--font-sans);');
    }
  });
});

describe('src/components/badge.css', () => {
  const source = () => read('src/components/badge.css').replace(/\/\*[\s\S]*?\*\//g, '');

  it('draws no fill, so its text stays on the surface behind it and every pair is a measured one', () => {
    expect(source()).not.toMatch(/background/);
  });

  it('is never clay or signal, which mean unsaved work and consent', () => {
    expect(source()).not.toMatch(/--color-(?:clay|signal)/);
  });
});

describe('src/components/input.css', () => {
  // The rules without their comments, which quote selectors of their own.
  const rules = () => read('src/components/input.css').replace(/\/\*[\s\S]*?\*\//g, '');

  it('declares the invalid border after the changed one, so invalid outranks changed', () => {
    const source = rules();
    const changed = source.indexOf('.field[data-changed] .input');
    const invalid = source.indexOf('.field[data-invalid] .input');
    expect(changed).toBeGreaterThan(-1);
    expect(invalid).toBeGreaterThan(changed);
  });

  it('draws hover only where hover exists', () => {
    const source = rules();
    const media = source.indexOf('@media (hover: hover)');
    expect(media).toBeGreaterThan(-1);
    expect(source.indexOf(':hover')).toBeGreaterThan(media);
  });
});

describe('src/components/textarea.css', () => {
  /** The innermost blocks of a stylesheet, as { selector, properties }, comments left out. */
  const blocks = (file) =>
    [
      ...read(file)
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .matchAll(/([^{}]+)\{([^{}]*)\}/g),
    ].map(([, selector = '', body = '']) => ({
      selector: selector.trim(),
      properties: body
        .split(';')
        .map((declaration) => declaration.split(':')[0]?.trim() ?? '')
        .filter(Boolean),
    }));
  const textarea = () => blocks('src/components/textarea.css');

  it('is one rule on the input, so it outranks the input without depending on import order', () => {
    expect(textarea().map(({ selector }) => selector)).toEqual(['.input.textarea']);
  });

  it('overrides only the seven things a multi-line box changes', () => {
    expect(textarea()[0]?.properties.sort()).toEqual([
      'border-radius',
      'height',
      'line-height',
      'min-height',
      'padding-block',
      'padding-inline',
      'resize',
    ]);
  });

  it('never sets what the input draws for its states, so no state rule wins or loses against it', () => {
    // Everything but the base .input rule is a state: the placeholder, hover, focus, disabled, changed and invalid.
    const states = blocks('src/components/input.css')
      .filter(({ selector }) => selector !== '.input')
      .flatMap(({ properties }) => properties);
    expect(states).toContain('border');
    expect(states).toContain('border-color');
    const overrides = textarea()[0]?.properties ?? [];
    expect(overrides.filter((property) => states.includes(property))).toEqual([]);
  });

  it('keeps the changed and invalid borders on the input, where the textarea inherits them', () => {
    const selectors = blocks('src/components/input.css').map(({ selector }) => selector);
    expect(selectors).toContain('.field[data-changed] .input');
    expect(selectors).toContain('.field[data-invalid] .input');
    expect(textarea().map(({ selector }) => selector)).not.toContain('.field[data-changed] .textarea');
  });

  it('is drawn in tokens: the control radius, a 6rem floor and vertical resize only', () => {
    const source = read('src/components/textarea.css');
    expect(source).toContain('border-radius: var(--radius-control);');
    expect(source).toContain('min-height: 6rem;');
    expect(source).toContain('resize: vertical;');
    expect(source).toContain('height: auto;');
  });
});

describe('src/components/checkbox.css', () => {
  // The rules without their comments, which quote selectors of their own.
  const rules = () => read('src/components/checkbox.css').replace(/\/\*[\s\S]*?\*\//g, '');
  const SELECTED =
    '.checkbox:is([data-selected], :has(:checked), [data-indeterminate], :has(:indeterminate)) {';

  it('draws the mark with a mask over the canvas color, not an image with a color of its own', () => {
    const source = rules();
    expect(source).toContain('--checkbox-mark: var(--color-canvas);');
    expect(source).toContain('background-color: var(--checkbox-mark);');
    expect(source).toMatch(/mask-image: url\("data:image\/svg\+xml,/);
    // A background image would carry its own literal color, which is the source's invisible dark check.
    expect(source).not.toMatch(/background-image/);
  });

  it('orders the states hover, selected, invalid and disabled, so each outranks the one before', () => {
    const source = rules();
    const hover = source.indexOf('.checkbox:where(:hover');
    const selected = source.indexOf(SELECTED);
    const invalid = source.indexOf('.checkbox[data-invalid] {');
    const disabled = source.indexOf('.checkbox:is(:has(:disabled), [data-disabled]) {');
    expect(hover).toBeGreaterThan(-1);
    expect(selected).toBeGreaterThan(hover);
    expect(invalid).toBeGreaterThan(selected);
    expect(disabled).toBeGreaterThan(invalid);
  });

  it('draws hover only where hover exists', () => {
    const source = rules();
    const media = source.indexOf('@media (hover: hover)');
    expect(media).toBeGreaterThan(-1);
    expect(source.indexOf(':hover')).toBeGreaterThan(media);
  });

  it('keeps the row at least 40px tall, so the whole row is the target', () => {
    const row = blockAfter(rules(), '.checkbox {\n    --checkbox-fill');
    expect(row).toContain('min-height: 40px;');
    expect(row).toContain('cursor: pointer;');
    // A row with no text is only as wide as the box, so the box grows a 40px square hit area around itself.
    const bare = blockAfter(rules(), '.checkbox:not(:has(.checkbox-text)) .checkbox-box::before {');
    expect(bare).toContain("content: '';");
    expect(bare).toContain('position: absolute;');
    expect(bare).toContain('width: 40px;');
    expect(bare).toContain('height: 40px;');
    expect(bare).toContain('translate: -50% -50%;');
  });

  it('leaves the boxes alone when the group is changed: the chip is the cue', () => {
    expect(rules()).not.toContain('data-changed');
    expect(rules()).not.toContain('--color-signal');
  });

  it('keeps the mark and the fill visible in forced colors, with system colors', () => {
    const forced = blockAfter(rules(), '@media (forced-colors: active)');
    expect(forced).toContain('--checkbox-fill: Highlight;');
    expect(forced).toContain('--checkbox-mark: HighlightText;');
    expect(forced).toContain('--checkbox-mark: GrayText;');
  });
});

describe('src/components/radio.css', () => {
  // The rules without their comments, which quote selectors of their own.
  const rules = () => read('src/components/radio.css').replace(/\/\*[\s\S]*?\*\//g, '');
  // Every state also matches the native twin, so plain HTML draws the same row.
  const SELECTED = ':is([data-selected], :has(:checked))';
  const FOCUSED = ':is([data-focus-visible], :has(:focus-visible))';
  const DISABLED = ':is([data-disabled], :has(:disabled))';

  it('puts the error edge on every row of an invalid group', () => {
    const invalid = blockAfter(rules(), '.field[data-invalid] .radio {');
    expect(invalid).toContain('--radio-edge: var(--color-error);');
  });

  it('leaves the rows alone when the group is changed: the chip is the cue', () => {
    expect(rules()).not.toContain('data-changed');
    expect(rules()).not.toContain('--color-signal');
  });

  it('draws hover only where hover exists', () => {
    const source = rules();
    const media = source.indexOf('@media (hover: hover)');
    expect(media).toBeGreaterThan(-1);
    expect(source.indexOf(':hover')).toBeGreaterThan(media);
  });

  it('cuts rows as pills and indicators as dots, which keep their shape in every corner shape', () => {
    const source = rules();
    expect(blockAfter(source, '.radio {')).toContain('border-radius: var(--radius-pill);');
    expect(blockAfter(source, '.radio-indicator {')).toContain('border-radius: var(--radius-dot);');
  });

  it('inverts the focus ring to the canvas color inside a selected ink row, and keeps the token ring outside', () => {
    const source = rules();
    const selected = blockAfter(source, `.radio${SELECTED}${FOCUSED} {`);
    expect(selected).toContain('outline-color: var(--color-canvas);');
    expect(selected).toMatch(/outline-offset:\s*calc\(var\(--focus-ring-offset\) \* -2\);/);
    const plain = blockAfter(source, `.radio${FOCUSED} {`);
    expect(plain).toContain('outline: var(--focus-ring-width) solid var(--focus-ring-color);');
    expect(plain).toContain('outline-offset: var(--focus-ring-offset);');
  });

  it('draws the check as a mask over a token color, never as an image with a fixed color', () => {
    const source = rules();
    expect(source).toMatch(/mask:\s*url\(/);
    // A fixed stroke color in the image is what left the source's check invisible in dark.
    expect(source).not.toMatch(/background-image/);
    expect(source).not.toMatch(/%23[\da-f]{3,6}/i);
  });

  it('gives a disabled row a look of its own, with the not-allowed cursor', () => {
    const disabled = blockAfter(rules(), `.radio${DISABLED} {`);
    expect(disabled).toContain('cursor: not-allowed;');
    expect(disabled).toContain('var(--color-taupe)');
  });

  it('gives every state a native twin, so a plain label with a checked input is drawn the same', () => {
    const source = rules();
    for (const selector of [
      `.radio${SELECTED} {`,
      `.radio${FOCUSED} {`,
      `.radio${SELECTED}${FOCUSED} {`,
      `.radio${DISABLED} {`,
      `.radio${DISABLED}${SELECTED} {`,
    ]) {
      expect(source, selector).toContain(selector);
    }
    // The :not() lists of hover and pressed leave out the same three kinds of row, twins included.
    // Prettier breaks the long list over lines, so the whitespace is closed up first.
    const flat = source.replace(/\s+/g, ' ').replace(/\( /g, '(').replace(/ \)/g, ')');
    const excluded =
      ':not([data-selected], :has(:checked), [data-disabled], :has(:disabled), [data-readonly]) {';
    expect(flat.split(excluded)).toHaveLength(3);
    // No selector keys on the data attribute alone: a row from plain HTML carries none.
    expect(source).not.toMatch(/\.radio\[data-(?:selected|focus-visible|disabled)\]/);
    expect(flat).not.toContain(':not([data-selected], [data-disabled]');
  });

  it('keeps the states in the order that carries their precedence: selected, focus, disabled, invalid', () => {
    const source = rules();
    const selected = source.indexOf(`.radio${SELECTED} {`);
    const focused = source.indexOf(`.radio${FOCUSED} {`);
    const selectedFocused = source.indexOf(`.radio${SELECTED}${FOCUSED} {`);
    const disabled = source.indexOf(`.radio${DISABLED} {`);
    const disabledSelected = source.indexOf(`.radio${DISABLED}${SELECTED} {`);
    const invalid = source.indexOf('.field[data-invalid] .radio {');
    expect(selected).toBeGreaterThan(-1);
    expect(focused).toBeGreaterThan(selected);
    expect(selectedFocused).toBeGreaterThan(focused);
    expect(disabled).toBeGreaterThan(selectedFocused);
    expect(disabledSelected).toBeGreaterThan(disabled);
    expect(invalid).toBeGreaterThan(disabledSelected);
  });

  it('boxes the label text, so one long word wraps in the row and inline markup stays one run', () => {
    const source = rules();
    const text = blockAfter(source, '.radio-text {');
    expect(text).toContain('min-width: 0;');
    expect(text).toContain('overflow-wrap: anywhere;');
    // A row with no text has no box, and is held to the target by the row's own height and padding.
    expect(blockAfter(source, '.radio {')).toContain('min-height: 40px;');
    expect(blockAfter(source, '.radio {')).toContain('padding-inline: 1rem;');
  });

  it('takes the hint out of the width of an option in a horizontal group, so the pill hugs its label', () => {
    const hint = blockAfter(
      rules(),
      ".radio-group[data-orientation='horizontal'] .radio-items .field-description {",
    );
    expect(hint).toContain('contain: inline-size;');
  });

  it('draws a disabled row in GrayText in forced colors, chosen or not, and the check in CanvasText', () => {
    const forced = blockAfter(rules(), '@media (forced-colors: active)');
    expect(blockAfter(forced, `.radio${SELECTED} {`)).toContain('--radio-glyph: CanvasText;');
    const disabled = blockAfter(forced, `.radio${DISABLED} {`);
    expect(disabled).toContain('--radio-fg: GrayText;');
    expect(disabled).toContain('--radio-ring: GrayText;');
    // The base rule for a disabled, chosen row is more specific, so the forced one sets its own ring and check.
    const chosen = blockAfter(forced, `.radio${DISABLED}${SELECTED} {`);
    expect(chosen).toContain('--radio-ring: GrayText;');
    expect(chosen).toContain('--radio-glyph: GrayText;');
    // A disabled row that is not chosen never gets a check.
    expect(disabled).not.toContain('--radio-glyph');
  });
});

describe('src/components/switch.css', () => {
  // The rules without their comments, which quote selectors of their own.
  const rules = () => read('src/components/switch.css').replace(/\/\*[\s\S]*?\*\//g, '');

  it('stops the track and the thumb moving under reduced motion', () => {
    const reduced = blockAfter(rules(), '@media (prefers-reduced-motion: reduce)');
    expect(reduced).toContain('.switch-track');
    expect(reduced).toContain('.switch-thumb');
    expect(reduced).toMatch(/transition:\s*none;/);
  });

  it('never animates the corners, which belong to the shape axis', () => {
    expect(rules()).not.toMatch(/transition[^;]*radius/);
  });

  it('derives the thumb travel from the track, the thumb and the gap, so the gaps match', () => {
    // Off, the thumb sits one gap from the start. On, it has moved the track
    // width less the thumb and two gaps, which leaves one gap at the end.
    expect(rules()).toMatch(
      /--switch-travel:\s*calc\(var\(--switch-width\) - var\(--switch-thumb-size\) - 2 \* var\(--switch-inset\)\);/,
    );
  });

  it('draws a disabled switch that is on differently from one that is off', () => {
    const on =
      /\.switch:is\(\[data-disabled\][^{]*\):is\(\[data-selected\][^{]*\)\s*\{[^}]*--switch-track-fill:\s*var\(--color-taupe\);/;
    const off =
      /\.switch:is\(\[data-disabled\][^{]*\)\s*\{[^}]*--switch-track-fill:\s*var\(--color-disabled\);/;
    expect(rules()).toMatch(on);
    expect(rules()).toMatch(off);
  });

  it('boxes the label text, so one long word wraps in the row and inline markup stays one run', () => {
    const text = blockAfter(rules(), '.switch-text {');
    expect(text).toContain('min-width: 0;');
    expect(text).toContain('overflow-wrap: anywhere;');
    // The row's hit area is a positioned pseudo-element over the whole row, so the text sits above it
    // and a link in the label can be pressed.
    expect(text).toContain('position: relative;');
  });

  it('keys the changed ring on the field root, as the field contract asks', () => {
    expect(rules()).toContain('.field[data-changed] .switch-track::before');
  });

  it('draws the changed ring outside the track and never recolors the off track, whose boundary is a measured edge', () => {
    const changed = [...rules().matchAll(/([^{}]*\[data-changed\][^{}]*)\{([^}]*)\}/g)];
    expect(changed.length).toBeGreaterThan(0);
    for (const [, selector = '', body = ''] of changed) {
      expect(body, selector.trim()).not.toMatch(/background|--switch-track-fill|--switch-edge/);
    }
  });
});

describe('src/components/segmented.css', () => {
  // The rules without their comments, which quote selectors of their own.
  const rules = () => read('src/components/segmented.css').replace(/\/\*[\s\S]*?\*\//g, '');
  const SELECTED = ':is([data-selected], :has(:checked))';
  const FOCUSED = ':is([data-focus-visible], :has(:focus-visible))';

  it('declares the invalid edge after the changed one, and both after the disabled one', () => {
    const source = rules();
    const disabled = source.indexOf('.segmented[data-disabled] .segmented-track');
    const changed = source.indexOf('.segmented[data-changed] .segmented-track');
    const invalid = source.indexOf('.segmented[data-invalid] .segmented-track');
    expect(disabled).toBeGreaterThan(-1);
    expect(changed).toBeGreaterThan(disabled);
    expect(invalid).toBeGreaterThan(changed);
  });

  it('sets the track height to 40px of option and 4px each side, so a firmer edge moves nothing', () => {
    const source = rules();
    const track = blockAfter(source, '.segmented-track {');
    expect(track).toContain('--segmented-option-height: 2.5rem;');
    expect(track).toContain('height: calc(var(--segmented-option-height) + 0.5rem);');
    expect(track).toContain('border: 1px solid var(--color-boundary);');
    // The firmer edge is a width only: the track's height never reads it.
    for (const state of ['changed', 'invalid']) {
      const edge = blockAfter(source, `.segmented[data-${state}] .segmented-track`);
      expect(edge).toContain('border-width: 1.5px;');
      expect(edge).not.toContain('height');
    }
    // Stacked, the track is as tall as its rows.
    expect(blockAfter(source, '.segmented[data-stacked] .segmented-track')).toContain('height: auto;');
  });

  it('turns every option to 40px when it stacks, in both sizes', () => {
    const source = rules();
    const stacked = blockAfter(source, '.segmented[data-stacked] .segmented-track');
    expect(stacked).toContain('--segmented-option-height: 2.5rem;');
    // A pill's corner is half the height, which on a column is a blob, so a stacked track takes the surface step.
    expect(stacked).toContain('--segmented-radius: var(--radius-surface);');
    expect(blockAfter(source, '.segmented-sm .segmented-track')).toContain(
      '--segmented-option-height: 2rem;',
    );
    // The compact option reaches its 40px hit area only while it sits in a row.
    expect(source).toContain('.segmented-sm:not([data-stacked]) .segmented-option::before');
  });

  it('fills the selected option with ink and inverts its focus ring to the canvas color', () => {
    const source = rules();
    expect(blockAfter(source, `.segmented-option${SELECTED} {`)).toContain(
      'background-color: var(--color-ink);',
    );
    const ring = blockAfter(source, `.segmented-option${SELECTED}${FOCUSED} {`);
    expect(ring).toContain('outline-color: var(--color-canvas);');
    expect(ring).toMatch(/outline-offset: calc\(-1 \* /);
    // The standard ring, for every other option, is the token ring outside the pill.
    const standard = blockAfter(source, `.segmented-option${FOCUSED} {`);
    expect(standard).toContain('outline: var(--focus-ring-width) solid var(--focus-ring-color);');
    expect(standard).toContain('outline-offset: var(--focus-ring-offset);');
  });

  it('draws hover only where hover exists, and before the selected fill so selection wins', () => {
    const source = rules();
    const media = source.indexOf('@media (hover: hover)');
    expect(media).toBeGreaterThan(-1);
    expect(source.indexOf(':hover')).toBeGreaterThan(media);
    expect(source.indexOf(`.segmented-option${SELECTED} {`)).toBeGreaterThan(media);
  });

  it('gives a read-only control no hover wash and no pointer, and the disabled cursor still wins', () => {
    const source = rules();
    // The exclusion is in :where(), so hover keeps the weight of the selected rule written after it.
    const hover = blockAfter(
      source,
      '.segmented-option:is(:hover, [data-hovered]):where(:not([data-readonly])) {',
    );
    expect(hover).toContain('background-color: color-mix(in srgb, var(--color-ink) 5%, transparent);');
    expect(source).not.toContain('.segmented-option:is(:hover, [data-hovered]) {');
    const readOnly = source.indexOf('.segmented-option[data-readonly] {');
    expect(blockAfter(source, '.segmented-option[data-readonly] {')).toContain('cursor: default;');
    // After the chosen fill, before the disabled rule: a disabled option is still not-allowed.
    expect(readOnly).toBeGreaterThan(source.indexOf(`.segmented-option${SELECTED} {`));
    expect(readOnly).toBeLessThan(source.indexOf('.segmented-option:is([data-disabled], :has(:disabled)) {'));
  });

  it('keeps every option at least 40px wide, so a one-glyph label is still a target', () => {
    const source = rules();
    expect(blockAfter(source, '.segmented-option {')).toContain('min-width: 2.5rem;');
  });
});

describe('dist/styles.css', () => {
  const built = read('dist/styles.css');

  it('keeps the layers in the order theme, base, components, utilities', () => {
    // The bundler may split the order statement around the layer blocks, so
    // read the order in which each layer name first appears.
    const order = [];
    for (const [, names = ''] of built.matchAll(/@layer\s+([\w\s,.-]+?)\s*[;{]/g)) {
      for (const name of names.split(',').map((s) => s.trim())) if (!order.includes(name)) order.push(name);
    }
    expect(order).toEqual(['theme', 'base', 'components', 'utilities']);
  });

  it('is lowered for the browser floor and keeps case-insensitive shape selectors', () => {
    expect(built).not.toMatch(/&[\s.:[]/);
    expect(built).toContain('[data-shape="soft" i]');
    expect(built).not.toContain('--lightningcss');
  });
});

describe('dist/base.css', () => {
  const built = read('dist/base.css');

  it('keeps the WebKit text size adjust prefix that iOS Safari needs', () => {
    expect(built).toContain('-webkit-text-size-adjust');
  });

  it('draws the focus ring for anything focusable, inside the base layer', () => {
    // The text between the braces of the first `@layer base`, nested blocks included.
    const start = built.indexOf('@layer base {');
    expect(start).toBeGreaterThan(-1);
    const open = start + '@layer base {'.length;
    let depth = 1;
    let close = open;
    while (depth > 0 && close < built.length) {
      const char = built[close++];
      if (char === '{') depth += 1;
      else if (char === '}') depth -= 1;
    }
    expect(built.slice(open, close)).toMatch(
      /:focus-visible\s*\{\s*outline:\s*var\(--focus-ring-width\) solid var\(--focus-ring-color\);\s*outline-offset:\s*var\(--focus-ring-offset\);\s*\}/,
    );
  });
});
