import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const components = readdirSync(new URL('../src/components', import.meta.url)).filter((f) =>
  f.endsWith('.css'),
);

const stripComments = (css) => css.replace(/\/\*[\s\S]*?\*\//g, '');

/** CSS with its whitespace closed up, so a selector that Prettier breaks over lines reads as one line. */
const closeUp = (css) => css.replace(/\s+/g, ' ').replace(/\( /g, '(').replace(/ \)/g, ')');

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

const FORCED_COLORS = '@media (forced-colors: active)';

/** The CSS without its comments and without its forced-colors blocks. */
function outsideForcedColors(css) {
  let rest = css.replace(/\/\*[\s\S]*?\*\//g, '');
  for (;;) {
    const start = rest.indexOf(FORCED_COLORS);
    if (start === -1) return rest;
    const end = rest.indexOf('{', start) + 1 + blockAfter(rest, FORCED_COLORS).length + 1;
    rest = rest.slice(0, start) + rest.slice(end);
  }
}

// The keywords a reader's own palette is written in: every system color of CSS Color 4, current and
// deprecated. Matching ignores case, as CSS does, and takes whole words only. A token such as
// `--color-canvas` has the keyword after a dash, and `canvas-text` before one, so both are left alone.
const SYSTEM_COLORS = [
  'AccentColor',
  'AccentColorText',
  'ActiveText',
  'ButtonBorder',
  'ButtonFace',
  'ButtonText',
  // As the stylesheets write it.
  'canvas',
  'CanvasText',
  'Field',
  'FieldText',
  'GrayText',
  'Highlight',
  'HighlightText',
  'LinkText',
  'Mark',
  'MarkText',
  'SelectedItem',
  'SelectedItemText',
  'VisitedText',
  // Deprecated, and still honored by browsers.
  'ActiveBorder',
  'ActiveCaption',
  'AppWorkspace',
  'Background',
  'ButtonHighlight',
  'ButtonShadow',
  'CaptionText',
  'InactiveBorder',
  'InactiveCaption',
  'InactiveCaptionText',
  'InfoBackground',
  'InfoText',
  'Menu',
  'MenuText',
  'Scrollbar',
  'ThreeDDarkShadow',
  'ThreeDFace',
  'ThreeDHighlight',
  'ThreeDLightShadow',
  'ThreeDShadow',
  'Window',
  'WindowFrame',
  'WindowText',
];
const SYSTEM_COLOR = new RegExp(`(?<![\\w-])(?:${SYSTEM_COLORS.join('|')})(?![\\w-])`, 'i');

/**
 * Every declaration value outside the forced-colors blocks and the comments. A value ends at `;`, or at
 * the `}` that closes the rule when the last declaration has no `;`. A selector's colon never matches,
 * because a `{` follows it before any `;` or `}`.
 */
const valuesOutsideForcedColors = (css) =>
  [...outsideForcedColors(css).matchAll(/:\s*([^;{}]+)(?:;|(?=\}))/g)].map((match) => match[1].trim());

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

  it('uses a system color only inside a forced-colors block', () => {
    // In forced colors the reader's palette is the point, so a system color is the one literal allowed
    // there. Anywhere else it would be a color that is neither a token nor the reader's choice.
    const values = valuesOutsideForcedColors(source);
    expect(values.length).toBeGreaterThan(0);
    for (const value of values) expect(value).not.toMatch(SYSTEM_COLOR);
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
      '.a { outline: none } .b { color: var(--color-ink) }',
    ]) {
      expect(css, css).not.toMatch(INK_RING);
    }
  });
});

describe('the system color guard', () => {
  const stray = (css) => valuesOutsideForcedColors(css).filter((value) => SYSTEM_COLOR.test(value));

  it('matches every system color, current and deprecated, in any case', () => {
    // Written out again, so a misspelled entry in the list is caught here and not tested against itself.
    expect(SYSTEM_COLORS).toEqual([
      'AccentColor',
      'AccentColorText',
      'ActiveText',
      'ButtonBorder',
      'ButtonFace',
      'ButtonText',
      'canvas',
      'CanvasText',
      'Field',
      'FieldText',
      'GrayText',
      'Highlight',
      'HighlightText',
      'LinkText',
      'Mark',
      'MarkText',
      'SelectedItem',
      'SelectedItemText',
      'VisitedText',
      'ActiveBorder',
      'ActiveCaption',
      'AppWorkspace',
      'Background',
      'ButtonHighlight',
      'ButtonShadow',
      'CaptionText',
      'InactiveBorder',
      'InactiveCaption',
      'InactiveCaptionText',
      'InfoBackground',
      'InfoText',
      'Menu',
      'MenuText',
      'Scrollbar',
      'ThreeDDarkShadow',
      'ThreeDFace',
      'ThreeDHighlight',
      'ThreeDLightShadow',
      'ThreeDShadow',
      'Window',
      'WindowFrame',
      'WindowText',
    ]);
    for (const color of SYSTEM_COLORS) {
      for (const written of [color, color.toLowerCase(), color.toUpperCase()]) {
        expect(stray(`.x { background-color: ${written}; }`), written).toEqual([written]);
      }
    }
    for (const css of [
      '.x { background: Field; }',
      '.x { background: Mark; }',
      '.x { background: Window; }',
      '.x { background: CANVAS; }',
      '.x { border: 1px solid var(--edge, GrayText); }',
      '@media (prefers-contrast: more) { .x { color: Highlight; } }',
      '@layer components { .x { color: ink; } .y:hover { color: LinkText; } }',
    ]) {
      expect(stray(css), css).toHaveLength(1);
    }
  });

  it('catches the last declaration of a rule that has no semicolon', () => {
    expect(stray('.x { color: var(--color-ink); background: Field }')).toEqual(['Field']);
    expect(stray('.x{background:Mark}')).toEqual(['Mark']);
    expect(stray('.x { color: var(--color-ink) } .y { background: Window }')).toEqual(['Window']);
  });

  it('leaves tokens, comments, selectors and forced-colors blocks alone', () => {
    for (const css of [
      '.x { background-color: var(--color-canvas); }',
      '.x { color: var(--color-highlight-text) }',
      '.x { color: var(--canvas); background: var(--field-fill); border-color: var(--window-edge) }',
      '.x { background-color: canvas-fill; }',
      '.x { transition: background-color 150ms ease, box-shadow 150ms ease; }',
      '/* color: Highlight; */ .x { color: var(--color-ink); }',
      '.field:hover .mark { color: var(--color-ink); }',
      '.x { content: ""; }\n@media (forced-colors: active) { .x { color: Highlight; background: Field } }',
      '@media (forced-colors: active) { .x { background: Window } } .y { color: var(--color-ink) }',
    ]) {
      expect(stray(css), css).toEqual([]);
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
    },
  );

  it('tracks the eyebrow at its own token, dots it in light signal orange and keeps the inset dot inside', () => {
    const css = stripComments(read('src/components/eyebrow.css'));
    // The label is tracked at its own token.
    expect(blockAfter(css, '.eyebrow {')).toContain('letter-spacing: var(--text-eyebrow--letter-spacing);');
    // The dot is light signal orange, the attention cue. Signal orange is consent only.
    expect(blockAfter(css, '.eyebrow::before {')).toContain('background-color: var(--color-signal-light);');
    expect(css).not.toContain('var(--color-signal)');
    // The inset variant keeps the dot inside the box, and it comes after the rule it overrides.
    expect(blockAfter(css, '.eyebrow-inset::before {')).toContain('margin-inline-start: 0;');
    expect(css.indexOf('.eyebrow-inset::before')).toBeGreaterThan(css.indexOf('.eyebrow::before'));
  });

  it.each([
    ['heading.css', '.heading {'],
    ['copy.css', '.copy {'],
    ['eyebrow.css', '.eyebrow {'],
  ])('%s breaks a long word anywhere, so a narrow screen is never pushed sideways', (file, header) => {
    // Anywhere, not break-word: only anywhere also lowers the min-content width a grid parent sizes by.
    const css = stripComments(read(`src/components/${file}`));
    expect(blockAfter(css, header)).toContain('overflow-wrap: anywhere;');
  });
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

describe('the disabled link forms in forced colors', () => {
  // The browser grays out a disabled button element by itself, but not a span or an anchor that says it with
  // aria-disabled, which is how React Aria draws a disabled link. Each file grays those out in GrayText.
  const forced = (file) => blockAfter(closeUp(stripComments(read(`src/components/${file}`))), FORCED_COLORS);

  it('draws a disabled button in GrayText, edge and label, and keeps the tertiary edgeless and a pending one as it is', () => {
    const disabled = ":is(:disabled, [data-disabled], :where([aria-disabled='true']:not([data-pending])))";
    const rule = blockAfter(forced('button.css'), `.button${disabled} {`);
    expect(rule).toContain('border-color: GrayText;');
    expect(rule).toContain('color: GrayText;');
    expect(blockAfter(forced('button.css'), `.button-tertiary${disabled} {`)).toContain(
      'border-color: transparent;',
    );
  });

  it('draws a disabled icon button in GrayText, and the outline variant its edge too', () => {
    const css = forced('icon-button.css');
    expect(
      blockAfter(css, ".icon-button:is(:disabled, [data-disabled], [aria-disabled='true']) {"),
    ).toContain('color: GrayText;');
    expect(blockAfter(css, '.icon-button-outline {')).toContain('--icon-button-border-disabled: GrayText;');
  });

  it('draws a disabled link in GrayText', () => {
    expect(blockAfter(forced('link.css'), ".link:is([data-disabled], [aria-disabled='true']) {")).toContain(
      'color: GrayText;',
    );
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

  it('centres the chip dot on the first line, so a wrapped chip keeps it beside its first word', () => {
    const dot = blockAfter(source(), '.field-changed::before {');
    expect(dot).toContain('inset-block-start: calc((1lh - 0.375rem) / 2);');
    expect(dot).not.toContain('translate');
    expect(dot).not.toContain('50%');
  });

  it('lets a long Changed label wrap inside the label row, even inside a word', () => {
    const chip = blockAfter(source(), '.field-changed {');
    expect(chip).toContain('max-width: 100%;');
    expect(chip).toContain('overflow-wrap: anywhere;');
    // A chip that cannot wrap is as wide as its text, which one long word can push past the screen.
    expect(chip).not.toContain('nowrap');
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
  const INVALID = ":is(.field[data-invalid] .input, .input[aria-invalid='true']) {";

  it('declares the invalid border after the changed one, so invalid outranks changed', () => {
    const source = rules();
    const changed = source.indexOf('.field[data-changed] .input {');
    const invalid = source.indexOf(INVALID);
    expect(changed).toBeGreaterThan(-1);
    expect(invalid).toBeGreaterThan(changed);
  });

  it('draws the invalid border for a plain input with aria-invalid, at the weight of the changed rule', () => {
    // :is() weighs both forms as its heaviest, the field's rule, so the twin also wins over changed by order.
    expect(blockAfter(rules(), INVALID)).toContain('border: 1.5px solid var(--color-error);');
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
    expect(selectors).toContain(":is(.field[data-invalid] .input, .input[aria-invalid='true'])");
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
    '.checkbox:is([data-selected], :where(:has(input:checked)), [data-indeterminate], :where(:has(input:indeterminate))) {';
  // Plain HTML says invalid on the input, and the test weighs nothing, so disabled still wins by order.
  const INVALID = ".checkbox:is([data-invalid], :where(:has(input[aria-invalid='true']))) {";

  it('draws the mark with a mask over the canvas color, not an image with a color of its own', () => {
    const source = rules();
    expect(source).toContain('--checkbox-mark: var(--color-canvas);');
    expect(source).toContain('background-color: var(--checkbox-mark);');
    expect(source).toMatch(/mask-image: url\("data:image\/svg\+xml,/);
    // A background image would carry its own literal color, which is the source's invisible dark check.
    expect(source).not.toMatch(/background-image/);
  });

  it('orders the states hover, selected, invalid and disabled, so each outranks the one before', () => {
    const source = closeUp(rules());
    const hover = source.indexOf('.checkbox:where(:hover');
    const selected = source.indexOf(SELECTED);
    const invalid = source.indexOf(INVALID);
    const disabled = source.indexOf('.checkbox:is(:where(:has(input:disabled)), [data-disabled]) {');
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

  it('draws a disabled label in taupe, and sets the box on the first line of a label that wraps', () => {
    const disabled = blockAfter(
      closeUp(rules()),
      '.checkbox:is(:where(:has(input:disabled)), [data-disabled]) {',
    );
    expect(disabled).toContain('color: var(--color-taupe);');
    // The row starts its items at the top, and the box's margin is half of what the line has over the box.
    expect(blockAfter(rules(), '.checkbox {\n    --checkbox-fill')).toContain('align-items: flex-start;');
    expect(blockAfter(rules(), '.checkbox-box {')).toContain(
      'margin-block-start: calc((1lh - var(--checkbox-size)) / 2);',
    );
  });

  it('turns only the edge for an invalid box, from React Aria or from a plain input with aria-invalid', () => {
    const rule = blockAfter(closeUp(rules()), INVALID);
    expect(rule.trim()).toBe('--checkbox-edge: var(--color-error);');
  });

  it('boxes the label text, so one long word breaks anywhere in the row and inline markup stays one run', () => {
    const text = blockAfter(rules(), '.checkbox-text {');
    expect(text).toContain('min-width: 0;');
    expect(text).toContain('overflow-wrap: anywhere;');
  });

  it('leaves the boxes alone when a checkbox or a group is changed: the chip is the cue', () => {
    // The one rule keyed on data-changed shows or hides the chip, and nothing is drawn on a box.
    const keyed = [...rules().matchAll(/[^{};]*data-changed[^{};]*(?=\{)/g)].map((match) =>
      closeUp(match[0]).trim(),
    );
    expect(keyed).toEqual([
      '.checkbox-field:not([data-changed]) .field-changed, .checkbox-field[data-invalid] .field-changed',
    ]);
    expect(rules()).not.toContain('--color-signal');
  });

  it('sets the Changed chip level with the first line of a label that wraps, from a label row that starts its items at the top', () => {
    // The chip is the row's sibling, so it reads the body line from the field, which declares it for the row too.
    expect(blockAfter(rules(), '.checkbox-field,\n  .checkbox {')).toContain(
      '--checkbox-line: calc(var(--text-body) * var(--text-body--line-height));',
    );
    expect(rules()).toMatch(/\.field-head:has\(> \.checkbox\)\s*\{\s*align-items: flex-start;\s*\}/);
    // The row's 8px of padding, and half of what its line has over the chip's own 14px line.
    const chip = blockAfter(rules(), '.field-head:has(> .checkbox) > .field-changed {');
    expect(chip).toContain('margin-block-start: calc(0.5rem + (var(--checkbox-line) - 1lh) / 2);');
  });

  it('shows the Changed chip only while the checkbox is changed and not invalid, and keeps the label row out of the closing padding', () => {
    const source = closeUp(rules());
    const hidden = blockAfter(
      source,
      '.checkbox-field:not([data-changed]) .field-changed, .checkbox-field[data-invalid] .field-changed {',
    );
    expect(hidden).toContain('display: none;');
    // Only a hint or an error line closes the field with the row's padding: the label row is the row.
    const closing = blockAfter(source, '.checkbox-field > :not(.checkbox, .field-head):last-child {');
    expect(closing).toContain('padding-block-end: 0.5rem;');
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
  // Closed up, so a selector Prettier breaks over lines is found as one.
  const rules = () => closeUp(read('src/components/radio.css').replace(/\/\*[\s\S]*?\*\//g, ''));
  // Every state also matches the native twin, so plain HTML draws the same row.
  const SELECTED = ':is([data-selected], :where(:has(input:checked)))';
  const FOCUSED = ':is([data-focus-visible], :where(:has(input:focus-visible)))';
  const DISABLED = ':is([data-disabled], :where(:has(input:disabled)))';

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

  it('draws a disabled label in taupe, through the property the row reads its text color from', () => {
    expect(blockAfter(rules(), '.radio {')).toContain('color: var(--radio-fg);');
    expect(blockAfter(rules(), `.radio${DISABLED} {`)).toContain('--radio-fg: var(--color-taupe);');
  });

  it('sets the dot on the first line of a label that wraps, and keeps a row with no text centred', () => {
    // The dot is 20px, so its margin is half of what the line has over it.
    const dot = blockAfter(rules(), '.radio:has(.radio-text) > .radio-indicator {');
    expect(dot).toContain('align-self: flex-start;');
    expect(dot).toContain('margin-block-start: calc((1lh - 20px) / 2);');
    // The row stays centred, so a row with no text keeps the dot in the middle of its 40px.
    expect(blockAfter(rules(), '.radio {')).toContain('align-items: center;');
    expect(blockAfter(rules(), '.radio-indicator {')).not.toContain('margin');
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
    const excluded =
      ':not([data-selected], :where(:has(input:checked)), [data-disabled], :where(:has(input:disabled)), [data-readonly]) {';
    expect(source.split(excluded)).toHaveLength(3);
    // No selector keys on the data attribute alone: a row from plain HTML carries none.
    expect(source).not.toMatch(/\.radio\[data-(?:selected|focus-visible|disabled)\]/);
    expect(source).not.toContain(':not([data-selected], [data-disabled]');
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

  it('draws a disabled label in taupe, and in GrayText in forced colors, as a disabled checkbox does', () => {
    const header = '.switch:is([data-disabled], :has(input:disabled)) {';
    expect(blockAfter(rules(), header)).toContain('color: var(--color-taupe);');
    expect(blockAfter(blockAfter(rules(), FORCED_COLORS), header)).toContain('color: GrayText;');
  });

  it('sets the track on the first line of a label that wraps, and keeps a row of one line 30px tall', () => {
    // The track is taller than a line, so the row pads the text down by half the difference and the track
    // takes the same half back as a negative margin: one line fills the 30px, and more lines push past it.
    const size = blockAfter(rules(), '.switch,\n  .field-head:has(> .switch) {');
    expect(size).toContain('--switch-height: calc(var(--switch-thumb-size) + 2 * var(--switch-inset));');
    const row = blockAfter(rules(), '.switch {');
    expect(row).toContain('align-items: flex-start;');
    expect(row).toContain('padding-block: max(0px, calc((var(--switch-height) - 1lh) / 2));');
    const track = blockAfter(rules(), '.switch-track {');
    expect(track).toContain('height: var(--switch-height);');
    expect(track).toContain('margin-block: calc((1lh - var(--switch-height)) / 2);');
  });

  it('sets the Changed chip level with the first line, as the track is, from a head that starts its items at the top', () => {
    // The chip is the row's sibling, so the head carries the track's size for it to read.
    expect(rules()).toMatch(/\.field-head:has\(> \.switch\)\s*\{\s*align-items: flex-start;\s*\}/);
    const chip = blockAfter(rules(), '.field-head:has(> .switch) > .field-changed {');
    expect(chip).toContain('margin-block-start: calc((var(--switch-height) - 1lh) / 2);');
    // The old rule centred the head's items on the row, which is the middle of a label that wraps.
    expect(rules()).not.toMatch(/\.field-head:has\(> \.switch\)\s*\{[^}]*align-items: center/);
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

  it('breaks a long word in the label inside the row instead of widening it', () => {
    const row = blockAfter(rules(), '.switch {');
    expect(row).toContain('min-width: 0;');
    expect(row).toContain('max-width: 100%;');
    expect(row).toContain('overflow-wrap: anywhere;');
  });

  it('gives the track and the thumb system colors in forced colors, so on and off stay apart', () => {
    // The browser paints every background canvas: without these a canvas thumb sits on a canvas track.
    const forced = blockAfter(rules(), FORCED_COLORS);
    expect(blockAfter(forced, '.switch {')).toMatch(
      /--switch-track-fill: canvas;\s*--switch-thumb-fill: CanvasText;\s*--switch-edge: CanvasText;/,
    );
    expect(blockAfter(forced, '.switch:is([data-selected], :has(input:checked)) {')).toMatch(
      /--switch-track-fill: Highlight;\s*--switch-thumb-fill: HighlightText;/,
    );
    expect(forced).toContain('--switch-thumb-fill: GrayText;');
    expect(forced).toContain('--switch-track-fill: GrayText;');
  });

  it('draws the changed ring outside the track and never recolors the off track, whose boundary is a measured edge', () => {
    const changed = [...rules().matchAll(/([^{}]*\[data-changed\][^{}]*)\{([^}]*)\}/g)];
    expect(changed.length).toBeGreaterThan(0);
    for (const [, selector = '', body = ''] of changed) {
      expect(body, selector.trim()).not.toMatch(/background|--switch-track-fill|--switch-edge/);
    }
  });
});

describe('src/components/card.css', () => {
  // The rules without their comments, which quote selectors and values of their own.
  const rules = () => stripComments(read('src/components/card.css'));

  it('breaks a long unbroken word anywhere, on the card, so every part and its content inherit it', () => {
    const source = rules();
    expect(blockAfter(source, '.card {')).toContain('overflow-wrap: anywhere;');
    // A part that set its own value would beat the inherited one, and break-word does not lower
    // the min-content width that a flex or grid parent sizes the card by.
    expect(source).not.toContain('break-word');
    expect(blockAfter(source, '.card-title {')).not.toContain('overflow-wrap');
    expect(blockAfter(source, '.card-note {')).not.toContain('overflow-wrap');
  });

  it('steps a card down only when it sits in a card or in its body, never for any descendant', () => {
    const source = rules();
    const nested = blockAfter(source, '.card > .card,');
    expect(source).toMatch(/\.card > \.card,\s*\.card-body \.card \{/);
    expect(nested).toContain('border-radius: var(--radius-surface);');
    expect(nested).toContain('border-color: var(--color-frame);');
    // A card on a well of its own, such as the docs preview stage, keeps its stadium corner.
    expect(source).not.toMatch(/\.card \.card/);
  });
});

describe('src/components/card.css, the collapsible card', () => {
  // The rules without their comments, with their whitespace closed up.
  const rules = () => closeUp(stripComments(read('src/components/card.css')));
  /** Every rule that holds declarations, as its selector and its declarations, media blocks included. */
  const all = () =>
    [...rules().matchAll(/([^{}]+)\{([^{}]*)\}/g)].map(([, selector = '', body = '']) => ({
      selector: selector.trim(),
      body: body.trim(),
    }));
  /** A part only the collapsible card draws, or the dir attribute its chevron reads. */
  const COLLAPSIBLE = /card-(?:collapsible|disclosure|toggle|chevron|actions|fold)|\[dir=/;
  /** The rules a plain card is drawn with, by selector. */
  const CARD = [
    '.card',
    '.card > .card, .card-body .card',
    '.card-header',
    '.card-title',
    '.card-note',
    '.card-body',
    '.card-body > *',
    '.card-header > *, .card-body > *',
  ];

  it('leaves a plain card alone: every other rule names a part only the collapsible card draws', () => {
    expect(all().filter(({ selector }) => CARD.includes(selector))).toHaveLength(CARD.length);
    for (const { selector } of all()) {
      if (!CARD.includes(selector)) expect(selector).toMatch(COLLAPSIBLE);
    }
  });

  it('draws in tokens only: a slate chevron that turns ink', () => {
    const colors = all()
      .filter(({ selector }) => COLLAPSIBLE.test(selector))
      .flatMap(({ body }) => [...body.matchAll(/var\((--color-[a-z-]+)\)/g)].map(([, name]) => name));
    expect([...new Set(colors)].sort()).toEqual(['--color-ink', '--color-slate']);
    expect(blockAfter(rules(), '.card-chevron {')).toContain('color: var(--color-slate);');
  });

  it('brings the toggle to a 40px target as wide as the title, and gives the room back so the header keeps its height', () => {
    const toggle = blockAfter(rules(), '.card-toggle {');
    expect(toggle).toContain('width: 100%;');
    expect(toggle).toContain('min-height: 40px;');
    expect(toggle).toContain('padding: max(0px, calc((40px - 1lh) / 2)) 0;');
    expect(toggle).toContain('margin: min(0px, calc((1lh - 40px) / 2)) 0;');
    expect(toggle).toContain('cursor: pointer;');
  });

  it("draws the standard focus ring on the toggle, for the native state and React Aria's", () => {
    const ring = blockAfter(rules(), '.card-toggle:is(:focus-visible, [data-focus-visible]) {');
    expect(ring).toContain('outline: var(--focus-ring-width) solid var(--focus-ring-color);');
    expect(ring).toContain('outline-offset: var(--focus-ring-offset);');
  });

  it('turns the chevron from slate to ink on hover only where hover exists, and on a press', () => {
    const css = rules();
    const hover = blockAfter(css, '@media (hover: hover)');
    expect(blockAfter(hover, '.card-toggle:is(:hover, [data-hovered]) .card-chevron {')).toContain(
      'color: var(--color-ink);',
    );
    // Hover is never drawn outside the media query, where a touch screen would keep it after a tap. The
    // forced-colors block names it only to give the chevron the reader's color.
    const forced = blockAfter(css, FORCED_COLORS);
    const outside = css
      .replace(`@media (hover: hover) {${hover}}`, '')
      .replace(`${FORCED_COLORS} {${forced}}`, '');
    expect(outside).not.toContain(':hover');
    expect(blockAfter(outside, '.card-toggle:is(:active, [data-pressed]) .card-chevron {')).toContain(
      'color: var(--color-ink);',
    );
  });

  it("draws the chevron in the toggle's own color in forced colors, at rest, hovered and pressed", () => {
    const forced = blockAfter(rules(), FORCED_COLORS);
    // The hover and press rules weigh as much as this one, and come before it, so it wins.
    expect(
      blockAfter(
        forced,
        '.card-chevron, .card-toggle:is(:hover, [data-hovered], :active, [data-pressed]) .card-chevron {',
      ),
    ).toContain('color: inherit;');
    expect(rules().indexOf(FORCED_COLORS)).toBeGreaterThan(rules().indexOf('@media (hover: hover)'));
  });

  it('turns the folded chevron a quarter toward the inline start, the other way under an rtl dir', () => {
    const css = rules();
    expect(blockAfter(css, ":where([dir='ltr' i]) {")).toContain('--card-chevron-turn: 90deg;');
    expect(blockAfter(css, ":where([dir='rtl' i]) {")).toContain('--card-chevron-turn: -90deg;');
    expect(
      blockAfter(
        css,
        '.card-collapsible:not([data-expanded]) > .card-disclosure > .card-header .card-chevron {',
      ),
    ).toContain('rotate: var(--card-chevron-turn, 90deg);');
    // :dir() is past the browser floor, and Lightning CSS would rewrite it as a list of languages.
    expect(css).not.toContain(':dir(');
    // The turn inherits from the nearest dir attribute, so no part of the card sets it.
    for (const { selector, body } of all()) {
      if (!selector.includes('[dir=')) expect(body).not.toContain('--card-chevron-turn:');
    }
  });

  it('folds the body with a grid row from 1fr to 0fr in 200ms, and draws the grid only while the fold is shown', () => {
    const css = rules();
    const fold = blockAfter(css, '.card-fold {');
    expect(fold).toContain('grid-template-rows: 1fr;');
    expect(fold).toContain('transition: grid-template-rows 200ms ease;');
    // React Aria hides a folded panel with hidden="until-found". A browser without until-found falls back
    // to the display: none of hidden, which only works while no rule sets display on the panel.
    expect(fold).not.toContain('display');
    expect(blockAfter(css, '.card-fold:not([hidden]) {')).toContain('display: grid;');
    expect(
      blockAfter(css, '.card-collapsible:not([data-expanded]) > .card-disclosure > .card-fold {'),
    ).toContain('grid-template-rows: 0fr;');
    // Find-in-page cannot reach text that visibility hides, so the fold never hides its body that way.
    expect(css).not.toContain('visibility');
  });

  it('folds the space between the header and the body with the body', () => {
    const css = rules();
    const folded = blockAfter(
      css,
      '.card-collapsible:not([data-expanded]) > .card-disclosure > .card-header {',
    );
    for (const declaration of ['margin-bottom: 0;', 'padding-bottom: 0;', 'border-bottom-width: 0;']) {
      expect(folded).toContain(declaration);
    }
    expect(blockAfter(css, '.card-disclosure > .card-header {')).toContain(
      'transition: margin-bottom 200ms ease, padding-bottom 200ms ease, border-bottom-width 200ms ease;',
    );
  });

  it('clips the body only while the card is folded or folding', () => {
    const clipping = all().filter(({ body }) => /(?:^|;\s*)overflow(?:-[xy])?\s*:/.test(body));
    expect(clipping.map(({ selector }) => selector)).toEqual([
      '.card-collapsible:is(:not([data-expanded]), [data-folding]) > .card-disclosure > .card-fold > .card-body',
    ]);
    expect(clipping[0]?.body).toContain('overflow: hidden;');
  });

  it('turns off every transition it draws while the root carries data-instant, for this card alone', () => {
    const instant = all().filter(({ selector }) => selector.includes('[data-instant]'));
    expect(instant).toHaveLength(1);
    expect(instant[0]?.body).toBe('transition: none;');
    const selectors = instant[0]?.selector.split(', ') ?? [];
    // Reached from the card's own root, part by part, so a card nested in the body keeps its own motion.
    for (const selector of selectors) {
      expect(selector).toMatch(/^\.card-collapsible\[data-instant\] > \.card-disclosure > /);
    }
    const moving = all().filter(
      ({ body }) => /(?:^|;\s*)transition\s*:/.test(body) && !body.includes('transition: none'),
    );
    expect(moving.length).toBeGreaterThan(0);
    for (const { selector } of moving) {
      // The part that moves, the last class in its selector, ends one of the selectors that stop it.
      const part = /\.[a-z-]+$/.exec(selector)?.[0] ?? selector;
      expect(selectors.some((stop) => stop.endsWith(` ${part}`))).toBe(true);
    }
  });

  it('lays the header out as a grid: the title and the actions on one row, the note under the title', () => {
    const css = rules();
    const header = blockAfter(css, '.card-disclosure > .card-header {');
    expect(header).toContain('grid-template-columns: minmax(0, 1fr) auto;');
    // No column gap: an empty actions column must leave the toggle the whole row.
    expect(header).toContain('column-gap: 0;');
    expect(
      blockAfter(
        css,
        '.card-disclosure > .card-header > .card-title, .card-disclosure > .card-header > .card-note {',
      ),
    ).toContain('grid-column: 1;');
    const actions = blockAfter(css, '.card-actions {');
    expect(actions).toContain('grid-row: 1;');
    expect(actions).toContain('grid-column: 2;');
    expect(actions).toContain('margin-inline-start: var(--spacing-peer);');
    expect(actions).toContain('flex-wrap: wrap;');
    expect(blockAfter(css, '.card-toggle-text {')).toContain('min-width: 0;');
  });

  it('moves the actions under the note, to the row start, when the header is narrower than 18rem', () => {
    const css = rules();
    expect(blockAfter(css, '.card-disclosure > .card-header {')).toContain(
      'container: card-header / inline-size;',
    );
    const narrow = blockAfter(blockAfter(css, '@container card-header (width < 18rem)'), '.card-actions {');
    expect(narrow).toContain('grid-row: auto;');
    expect(narrow).toContain('grid-column: 1;');
    expect(narrow).toContain('justify-content: flex-start;');
    expect(narrow).toContain('margin-inline-start: 0;');
  });

  it('sets the chevron level with the first line of a title that wraps', () => {
    const css = rules();
    expect(blockAfter(css, '.card-toggle {')).toContain('align-items: flex-start;');
    expect(blockAfter(css, '.card-chevron {')).toContain('margin-block: calc((1lh - 24px) / 2);');
  });

  it('stops every transition it draws under reduced motion, from a block that comes after them', () => {
    const css = rules();
    const start = css.indexOf('@media (prefers-reduced-motion: reduce)');
    const reduced = blockAfter(css, '@media (prefers-reduced-motion: reduce)');
    const moving = all().filter(
      ({ body }) => /(?:^|;\s*)transition\s*:/.test(body) && !body.includes('transition: none'),
    );
    expect(moving.length).toBeGreaterThan(0);
    for (const { selector } of moving) {
      // The same selector, so the same weight, later in the file: it wins.
      expect(reduced).toContain(selector);
      expect(css.indexOf(`${selector} {`)).toBeLessThan(start);
    }
    expect(reduced).toContain('transition: none;');
  });
});

describe('src/components/segmented.css', () => {
  // The rules without their comments, which quote selectors of their own.
  // Closed up, so a selector Prettier breaks over lines is found as one.
  const rules = () => closeUp(read('src/components/segmented.css').replace(/\/\*[\s\S]*?\*\//g, ''));
  const SELECTED = ':is([data-selected], :where(:has(input:checked)))';
  const FOCUSED = ':is([data-focus-visible], :where(:has(input:focus-visible)))';

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
    expect(readOnly).toBeLessThan(
      source.indexOf('.segmented-option:is([data-disabled], :where(:has(input:disabled))) {'),
    );
  });

  it('keeps every option at least 40px wide, so a one-glyph label is still a target', () => {
    const source = rules();
    expect(blockAfter(source, '.segmented-option {')).toContain('min-width: 2.5rem;');
  });

  it('draws hover only where hover exists, and before the selected fill so selection wins', () => {
    const source = rules();
    const media = source.indexOf('@media (hover: hover)');
    expect(media).toBeGreaterThan(-1);
    expect(source.indexOf(':hover')).toBeGreaterThan(media);
    expect(source.indexOf(`.segmented-option${SELECTED} {`)).toBeGreaterThan(media);
  });

  it('fills the selected option with Highlight in forced colors, and keeps its ring visible on it', () => {
    // The browser paints every background canvas: without this the chosen option is the color of the track.
    const forced = blockAfter(rules(), FORCED_COLORS);
    const chosen = blockAfter(forced, `.segmented-option${SELECTED} {`);
    expect(chosen).toContain('background-color: Highlight;');
    expect(chosen).toContain('color: HighlightText;');
    expect(blockAfter(forced, `.segmented-option${SELECTED}${FOCUSED} {`)).toContain(
      'outline-color: HighlightText;',
    );
    // A disabled option still shows which one was chosen.
    expect(forced).toContain('background-color: GrayText;');
  });
});

describe.each(['checkbox.css', 'radio.css', 'segmented.css'])(
  'src/components/%s, read from plain HTML',
  (file) => {
    const source = () => closeUp(stripComments(read(`src/components/${file}`)));

    it('reads each native state from its own input, so a focused link in the label never rings the control', () => {
      const css = source();
      for (const state of ['checked', 'disabled', 'focus-visible', 'indeterminate']) {
        expect(css, state).not.toContain(`:has(:${state})`);
      }
      expect(css).toContain(':has(input:focus-visible)');
    });

    it('weighs each native test as nothing, so naming the input moves no state past another', () => {
      // The data attribute beside it carries the weight, as it did before the input was named.
      const css = source();
      const named = css.match(/:has\(input(?::[\w-]+|\[[^\]]*\])\)/g) ?? [];
      const weightless = css.match(/:where\(:has\(input(?::[\w-]+|\[[^\]]*\])\)\)/g) ?? [];
      expect(named.length).toBeGreaterThan(0);
      expect(weightless).toHaveLength(named.length);
    });
  },
);

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
