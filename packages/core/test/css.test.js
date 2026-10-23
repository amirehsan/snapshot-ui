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
 * The charts whose shared rules charts.css writes once, as `:is()` lists of each chart's own class (spec 6). A
 * chart joins every shared rule by joining this list, so the tests below follow with no other change.
 */
const CHART_BLOCKS = ['line-chart', 'bar-chart'];

/** A shared chart rule's selector list: `:is(.line-chart-legend)` for 'legend', `:is(.line-chart)` for ''. */
const chartList = (part, blocks = CHART_BLOCKS) =>
  `:is(${blocks.map((block) => `.${block}${part === '' ? '' : `-${part}`}`).join(', ')})`;

/**
 * An `outline` or `outline-color` declaration that reads ink, in CSS without
 * comments. The lookbehind keeps `.badge-outline` and `--outline` out, the
 * `[^;{}]` stops at the end of the declaration or the rule, and the closing
 * `[,)]` also catches `var(--color-ink, fallback)` but not `var(--color-inkwell)`.
 */
/** The parts of the rail that move with it, besides the rail itself and the group dot. */
const MOVING_PARTS = [
  '.sidebar-collapse svg',
  '.sidebar-head',
  '.sidebar-search',
  '.sidebar-nav',
  '.sidebar-group-label',
  '.sidebar-brand-name',
  '.sidebar-search-label',
  '.sidebar-group-text',
  '.sidebar-item-label',
  '.sidebar-item-count-number',
  '.sidebar-search-shortcut',
];

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

  it('imports the overlay layer before every overlay file and after card.css', () => {
    // Every overlay file builds on the layer. Each one is checked once it exists, so the list holds the
    // files still to come.
    const at = (file) => entry.indexOf(`'./components/${file}'`);
    const overlay = at('overlay.css');
    expect(at('card.css')).toBeGreaterThanOrEqual(0);
    expect(overlay).toBeGreaterThan(at('card.css'));
    for (const file of [
      'dialog.css',
      'drawer.css',
      'sheet.css',
      'popover.css',
      'menu.css',
      'toast.css',
      'command-palette.css',
      'tooltip.css',
    ]) {
      if (components.includes(file)) expect(at(file), file).toBeGreaterThan(overlay);
    }
  });

  it('imports the accounts files after the files they read from, in order', () => {
    // The list reads the card's holder properties, so it follows card.css; the gauge and the month grid read the
    // meter's track and looks, so they follow meter.css, after charts.css, which keeps its place right after the
    // meter (spec correction 22). Each is checked once it exists.
    const at = (file) => entry.indexOf(`'./components/${file}'`);
    expect(at('card.css')).toBeGreaterThanOrEqual(0);
    expect(at('description-list.css')).toBeGreaterThan(at('card.css'));
    expect(at('charts.css')).toBeGreaterThan(at('meter.css'));
    let previous = at('charts.css');
    for (const file of ['gauge.css', 'month-grid.css']) {
      if (!components.includes(file)) continue;
      expect(at(file), file).toBeGreaterThan(previous);
      previous = at(file);
    }
  });

  it('imports the shell files after the last overlay file, in order', () => {
    // app-shell.css is required; the sidebar and the tab bar are checked once they exist.
    const at = (file) => entry.indexOf(`'./components/${file}'`);
    expect(at('tooltip.css')).toBeGreaterThanOrEqual(0);
    expect(at('app-shell.css')).toBeGreaterThan(at('tooltip.css'));
    let previous = at('app-shell.css');
    for (const file of ['sidebar.css', 'tab-bar.css']) {
      if (!components.includes(file)) continue;
      expect(at(file), file).toBeGreaterThan(previous);
      previous = at(file);
    }
  });

  it('imports the home files after the shell files, in order', () => {
    // avatar.css is required; the stat tile, the meter and the charts are checked once they exist.
    const at = (file) => entry.indexOf(`'./components/${file}'`);
    expect(at('tab-bar.css')).toBeGreaterThanOrEqual(0);
    expect(at('avatar.css')).toBeGreaterThan(at('tab-bar.css'));
    let previous = at('avatar.css');
    for (const file of ['stat-tile.css', 'meter.css', 'charts.css']) {
      if (!components.includes(file)) continue;
      expect(at(file), file).toBeGreaterThan(previous);
      previous = at(file);
    }
  });

  it('imports the picker files after the home files, in order', () => {
    // Every picker file is required: the batch is complete. Each comes after input.css, so a one-class override
    // of the input wins by order.
    const at = (file) => entry.indexOf(`'./components/${file}'`);
    expect(at('charts.css')).toBeGreaterThanOrEqual(0);
    expect(at('search-field.css')).toBeGreaterThan(at('charts.css'));
    let previous = at('search-field.css');
    for (const file of ['select.css', 'combo-box.css', 'multi-select.css', 'tabs.css', 'pagination.css']) {
      expect(at(file), file).toBeGreaterThan(previous);
      previous = at(file);
    }
  });

  it('imports the filter files after the picker files, in order', () => {
    // number-field.css, calendar.css and date-range-picker.css are required; the chip and the bar are checked
    // once they exist. Each comes after input.css, so a one-class override of the input wins by order.
    const at = (file) => entry.indexOf(`'./components/${file}'`);
    expect(at('pagination.css')).toBeGreaterThanOrEqual(0);
    expect(at('number-field.css')).toBeGreaterThan(at('pagination.css'));
    expect(at('calendar.css')).toBeGreaterThan(at('number-field.css'));
    expect(at('date-range-picker.css')).toBeGreaterThan(at('calendar.css'));
    let previous = at('date-range-picker.css');
    for (const file of ['filter-chip.css', 'filter-bar.css']) {
      if (!components.includes(file)) continue;
      expect(at(file), file).toBeGreaterThan(previous);
      previous = at(file);
    }
  });

  it('imports the data files after the filter files, in order', () => {
    // The empty state and the skeleton are required; the data table and the side panel are checked once they
    // exist, each after the one before.
    const at = (file) => entry.indexOf(`'./components/${file}'`);
    expect(at('filter-bar.css')).toBeGreaterThanOrEqual(0);
    expect(at('empty-state.css')).toBeGreaterThan(at('filter-bar.css'));
    expect(at('skeleton.css')).toBeGreaterThan(at('empty-state.css'));
    let previous = at('skeleton.css');
    for (const file of ['data-table.css', 'side-panel.css']) {
      if (!components.includes(file)) continue;
      expect(at(file), file).toBeGreaterThan(previous);
      previous = at(file);
    }
  });

  it('imports prose.css with the other component files, which no rule of it depends on', () => {
    // Kept first, though order decides nothing: prose's element rules sit in components.prose under every
    // component's own (spec correction 52), and its gaps are two classes deep (spec correction 89).
    expect(entry).toContain("@import './components/prose.css';");
  });

  it('imports the documents files after the data files, in order', () => {
    // The progress bar is required; the drop zones, the tray, the date picker, the save bar, the page header and
    // the trail are checked once they exist, each after the one before.
    const at = (file) => entry.indexOf(`'./components/${file}'`);
    expect(at('side-panel.css')).toBeGreaterThanOrEqual(0);
    expect(at('progress-bar.css')).toBeGreaterThan(at('side-panel.css'));
    let previous = at('progress-bar.css');
    for (const file of [
      'file-drop-zone.css',
      'upload-tray.css',
      'date-picker.css',
      'save-bar.css',
      'page-header.css',
      'breadcrumbs.css',
    ]) {
      if (!components.includes(file)) continue;
      expect(at(file), file).toBeGreaterThan(previous);
      previous = at(file);
    }
  });

  it("imports the settings files after the last batch's last, in order", () => {
    // The copy button is required; the field extras, the repeater, the panel layout and the account menu are
    // checked once they exist, each after the one before, all after the last file of the batches before.
    const at = (file) => entry.indexOf(`'./components/${file}'`);
    const before = ['breadcrumbs.css', 'month-grid.css', 'description-list.css'].map(at);
    expect(at('copy-button.css')).toBeGreaterThan(Math.max(...before));
    let previous = at('copy-button.css');
    for (const file of ['field-extras.css', 'repeater.css', 'panel-layout.css', 'account-menu.css']) {
      if (!components.includes(file)) continue;
      expect(at(file), file).toBeGreaterThan(previous);
      previous = at(file);
    }
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

  it('writes z-index only through a z token', () => {
    // A var(--z-*), a calc() on one, or auto, which writes no number: the sheet scrim resets its layer with it.
    const values = [...stripComments(source).matchAll(/(?<![\w-])z-index\s*:\s*([^;{}]+)/g)].map((match) =>
      match[1].trim(),
    );
    for (const value of values) {
      expect(value).toMatch(/^(?:auto|var\(--z-[\w-]+\)|calc\(.*var\(--z-[\w-]+\).*\))$/);
    }
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

describe('src/components/copy.css, the numerals', () => {
  // closeUp joins the selector list that Prettier breaks over two lines, and the "} " in front of a header
  // starts the search at the rule before it, so `.copy-numeral-sm {` finds its own rule and not the tail of
  // the shared one.
  const source = () => closeUp(stripComments(read('src/components/copy.css')));

  it('sets tabular digits and no wrapping on both sizes', () => {
    const shared = blockAfter(source(), '.copy-numeral, .copy-numeral-sm {');
    expect(shared).toContain('font-variant-numeric: tabular-nums;');
    expect(shared).toContain('white-space: nowrap;');
  });

  it('keeps a figure reading left to right in any direction, at the start of its parent line', () => {
    // A leading + or - is neutral in a right-to-left block, so without this "+$1,980.00" draws as
    // "$1,980.00+". match-parent resolves start against the parent, so a block figure stays at the start
    // of a right-to-left line instead of jumping to the left with its own direction.
    const shared = blockAfter(source(), '.copy-numeral, .copy-numeral-sm {');
    expect(shared).toContain('direction: ltr;');
    expect(shared).toContain('unicode-bidi: isolate;');
    // Chromium knows only the prefixed name and Firefox only the standard one, so both are written.
    expect(shared).toContain('text-align: -webkit-match-parent;');
    expect(shared).toContain('text-align: match-parent;');
    expect(shared.indexOf('text-align: match-parent;')).toBeGreaterThan(
      shared.indexOf('text-align: -webkit-match-parent;'),
    );
  });

  it.each(['numeral', 'numeral-sm'])('draws copy-%s from its own type token', (name) => {
    const rule = blockAfter(source(), `} .copy-${name} {`);
    expect(rule).toContain(`font-size: var(--text-${name});`);
    expect(rule).toContain(`line-height: var(--text-${name}--line-height);`);
    expect(rule).toContain(`letter-spacing: var(--text-${name}--letter-spacing);`);
    expect(rule).toContain(`font-weight: var(--text-${name}--font-weight);`);
  });

  it('steps the large numeral to 2.75rem under the small breakpoint, written out, and leaves the small one alone', async () => {
    // A media query cannot read a custom property, so the width is written out and must stay the token.
    const { tokens } = await import('../dist/tokens.js');
    const phone = `@media (width < ${tokens.breakpoint.sm.value})`;
    const built = read('dist/components/copy.css');
    expect(blockAfter(built, phone)).toMatch(/\.copy-numeral\s*\{\s*font-size:\s*2\.75rem;\s*\}/);
    expect(blockAfter(built, phone)).not.toContain('.copy-numeral-sm');
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

  it("draws the changed mark as a 6px clay dot on the frame's first line, its text clipped", () => {
    const css = closeUp(source());
    const mark = blockAfter(css, '.field-changed-mark {');
    for (const declaration of [
      'position: absolute;',
      'inset-block-start: calc((var(--size-field) - 0.375rem) / 2);',
      'inset-inline-end: var(--field-changed-mark-end, 1.5rem);',
      'inline-size: 0.375rem;',
      'block-size: 0.375rem;',
      'border-radius: var(--radius-dot);',
      // Clay, which means exactly unsaved, never light signal orange, 2.87 on raised in light (spec correction 2).
      'background-color: var(--color-clay);',
      'overflow: hidden;',
      'color: transparent;',
      'font-size: 0;',
      'white-space: nowrap;',
      'pointer-events: none;',
    ]) {
      expect(mark, declaration).toContain(declaration);
    }
    expect(css).not.toMatch(/--color-signal/);
    // The box it is placed in: the field's root beside a control that is its own frame, or the frame itself.
    expect(
      blockAfter(css, '.field:has(> .field-changed-mark), .input:has(> .field-changed-mark) {'),
    ).toContain('position: relative;');
    // Inside a frame drawn with .input the box starts inside the changed edge, 1.5px.
    expect(blockAfter(css, '.input > .field-changed-mark {')).toContain(
      'inset-block-start: calc((var(--size-field) - 0.375rem) / 2 - 1.5px);',
    );
  });

  it('draws the mark canvastext in forced colors, out of the repaint', () => {
    const forced = blockAfter(closeUp(source()), '@media (forced-colors: active)');
    const mark = blockAfter(forced, '.field-changed-mark {');
    expect(mark).toContain('forced-color-adjust: none;');
    expect(mark).toContain('background-color: canvastext;');
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

  it('draws the warning tone in the warning color and nothing else', () => {
    expect(closeUp(blockAfter(source(), '.badge-warning {')).trim()).toBe('color: var(--color-warning);');
  });

  it('keeps a word whole and the badge its width in a row, and breaks only a word longer than the box', () => {
    const badge = blockAfter(source(), '.badge {');
    // break-word, not anywhere: anywhere lowered the min-content width to one letter, so a flex row squeezed
    // "New" into "NE" over "W". break-word leaves the longest word as the floor a flex row stops at, and still
    // breaks a word only when it is longer than the badge, which max-width holds to its holder.
    expect(badge).toContain('overflow-wrap: break-word;');
    expect(badge).not.toContain('anywhere');
    expect(badge).toContain('max-width: 100%;');
    // An inline block, not an inline flex: the label of a flex box is an anonymous item whose floor is its
    // longest word, so a word longer than the box would spill out of the outline instead of breaking.
    expect(badge).toContain('display: inline-block;');
    expect(badge).not.toMatch(/display:\s*inline-flex/);
    // No floor of its own: flex-shrink 0 would keep a long label on one line and squeeze the title beside it,
    // and min-content as a min-width would beat max-width, so a long word would push the page sideways.
    expect(badge).not.toMatch(/flex-shrink|(?:^|[\s;])flex:|min-width|min-inline-size/);
  });

  it('caps the label at a length, so a long word gives a holder sized by its content a floor that fits a phone', () => {
    // A percentage max-width counts for nothing in the min-content width a holder takes from its content, so
    // only a length caps that floor, and on the label, since the badge's own max-width stays 100%.
    const label = closeUp(blockAfter(source(), '.badge-label {'));
    expect(label).toContain('display: block;');
    expect(label).toMatch(/max-width: \d+(?:\.\d+)?em;/);
    expect(label).not.toContain('%');
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

describe('src/components/input.css, the field button', () => {
  // The rules without their comments, with their whitespace closed up. `.input-button {` is the start of no longer
  // header before the forced-colors block, so the first match is the button's own rule.
  const rules = () => closeUp(stripComments(read('src/components/input.css')));
  const WASH = 'background-color: color-mix(in srgb, var(--color-ink) 5%, transparent);';
  const ENABLED = ':not(:disabled, [data-disabled])';

  it('sizes the field button a field step smaller than the field, concentric with the field', () => {
    const button = blockAfter(rules(), '.input-button {');
    for (const declaration of [
      'position: absolute;',
      'inset-inline-end: 0.375rem;',
      'width: calc(var(--size-field) - 0.75rem);',
      'height: calc(var(--size-field) - 0.75rem);',
      'border-radius: max(0px, calc(var(--input-radius, var(--radius-pill)) - 0.375rem));',
      'background-color: transparent;',
      'color: var(--color-slate);',
    ]) {
      expect(button, declaration).toContain(declaration);
    }
    expect(blockAfter(rules(), '.input-button svg {')).toContain('width: 16px;');
  });

  it('extends its hit area to the target in both axes by the shared formula', () => {
    const area = blockAfter(rules(), '.input-button::before {');
    for (const declaration of [
      "content: '';",
      'position: absolute;',
      'inset-block: min(0px, (100% - var(--size-target)) / 2);',
      'inset-inline: min(0px, (100% - var(--size-target)) / 2);',
    ]) {
      expect(area, declaration).toContain(declaration);
    }
  });

  it('washes it 5% ink and turns its glyph ink on hover, only where hover exists, and on a press', () => {
    const css = rules();
    const HOVER = `.input-button:is(:hover, [data-hovered])${ENABLED} {`;
    // The one hover rule sits in the last hover media block before it, the input's own being the first.
    expect(css.split('.input-button:is(:hover')).toHaveLength(2);
    const media = css.lastIndexOf('@media (hover: hover)', css.indexOf(HOVER));
    expect(media).toBeGreaterThan(-1);
    const hover = blockAfter(blockAfter(css.slice(media), '@media (hover: hover)'), HOVER);
    expect(hover).toContain(WASH);
    expect(hover).toContain('color: var(--color-ink);');
    const press = blockAfter(css, `.input-button:is(:active, [data-pressed])${ENABLED} {`);
    expect(press).toContain(WASH);
    expect(press).toContain('color: var(--color-ink);');
  });

  it('rings it with the token ring outside it, and draws it taupe and not-allowed when disabled', () => {
    const css = rules();
    const ring = blockAfter(css, '.input-button:is(:focus-visible, [data-focus-visible]) {');
    expect(ring).toContain('outline: var(--focus-ring-width) solid var(--focus-ring-color);');
    expect(ring).toContain('outline-offset: var(--focus-ring-offset);');
    const disabled = blockAfter(css, '.input-button:is(:disabled, [data-disabled]) {');
    expect(disabled).toContain('color: var(--color-taupe);');
    expect(disabled).toContain('cursor: not-allowed;');
  });

  it('draws its glyph CanvasText, and GrayText when disabled, in forced colors', () => {
    const forced = blockAfter(rules(), '@media (forced-colors: active)');
    expect(blockAfter(forced, '.input-button {')).toContain('color: CanvasText;');
    expect(blockAfter(forced, '.input-button:is(:disabled, [data-disabled]) {')).toContain(
      'color: GrayText;',
    );
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
  // The box's own rules, without the changed mark's place, which draws another element.
  const textarea = () =>
    blocks('src/components/textarea.css').filter(({ selector }) => !selector.includes('field-changed-mark'));

  it('is one rule on the input, so it outranks the input without depending on import order', () => {
    expect(textarea().map(({ selector }) => selector)).toEqual(['.input.textarea']);
  });

  it("places the changed mark on the box's first line, past its padding and its changed edge", () => {
    const rules = closeUp(stripComments(read('src/components/textarea.css')));
    expect(blockAfter(rules, '.textarea + .field-changed-mark {')).toContain(
      'inset-block-start: calc(0.75rem + 1.5px + (var(--text-body) * var(--text-body--line-height) - 0.375rem) / 2);',
    );
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
    // The field button's rules draw another element, so they are not the input's states.
    const states = blocks('src/components/input.css')
      .filter(({ selector }) => selector !== '.input' && !selector.includes('.input-button'))
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

  it("sizes a row's icon by its own class, 16px on the first line, before the words", () => {
    const icon = blockAfter(rules(), '.radio-icon {');
    for (const declaration of ['width: 16px;', 'height: 16px;', 'margin-inline-end: 0.5rem;']) {
      expect(icon, declaration).toContain(declaration);
    }
  });
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

  it("names its lifted fill as a table's surface, so a table in a card draws its header and cuts in it", () => {
    // Spec correction 74: a DataTable's sticky header and a meter's cuts in its rows take the card's fill.
    expect(blockAfter(rules(), '.card {')).toContain('--data-table-surface: var(--color-lifted);');
  });

  it('makes a card concentric only when it sits in a card or in its body, never for any descendant', () => {
    const source = rules();
    const nested = blockAfter(source, '.card > .card,');
    expect(source).toMatch(/\.card > \.card,\s*\.card-body \.card \{/);
    // The outer card's radius less its edge and padding, on the tokens, since the inner card names its own.
    expect(closeUp(nested)).toContain(
      '--holder-radius: max(var(--radius-micro), calc(var(--radius-stadium) - 1px - var(--spacing-card)));',
    );
    expect(nested).toContain('border-color: var(--color-frame);');
    // A card on a well of its own, such as the docs preview stage, keeps its stadium corner.
    expect(source).not.toMatch(/\.card \.card/);
  });
});

describe('src/components/card.css, CardActions in a plain card header', () => {
  // The rules without their comments, with their whitespace closed up.
  const rules = () => closeUp(stripComments(read('src/components/card.css')));
  const HEADER = '.card > .card-header:has(> .card-actions) {';
  const TITLE = '.card > .card-header:has(> .card-actions) > .card-title {';
  const ACTIONS = '.card > .card-header > .card-actions {';
  const ALONE = '.card > .card-header > .card-actions:first-child {';
  const SPAN = '.card > .card-header:has(> .card-note) > .card-actions {';
  const BUTTON = '.card > .card-header > .card-actions > .button {';
  const WIDE = '@container card-header (inline-size >= 24rem)';
  const EXTRA = 'calc(var(--holder-corner-inset) - var(--holder-pad))';
  /** Every rule that holds declarations, as its selector and its declarations, media blocks included. */
  const all = (css = rules()) =>
    [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map(([, selector = '', body = '']) => ({
      selector: selector.trim(),
      body: body.trim(),
    }));
  /** The CSS with the container query's block taken out, so the narrow layout is read on its own. */
  const narrow = () => {
    const css = rules();
    const start = css.indexOf(WIDE);
    const end = css.indexOf('{', start) + 1 + blockAfter(css, WIDE).length + 1;
    return css.slice(0, start) + css.slice(end);
  };

  it('makes a header holding actions a one-column grid and a size container with no stand-in width', () => {
    const header = blockAfter(rules(), HEADER);
    expect(header).toContain('container: card-header / inline-size;');
    // Any stand-in width becomes the card's min-content and scrolls a phone's page sideways from a 1fr track.
    expect(header).toContain('contain-intrinsic-inline-size: 0;');
    expect(header).toContain('grid-template-columns: minmax(0, 1fr);');
    expect(header).toContain('column-gap: var(--spacing-peer);');
  });

  it('draws a narrow header as a header without actions draws: no row, padding or margin of its own', () => {
    const header = blockAfter(narrow(), HEADER);
    expect(header).not.toMatch(/grid-template-rows|padding|margin|align-items/);
    expect(blockAfter(narrow(), TITLE)).toBe('');
    for (const { selector, body } of all(narrow())) {
      if (!selector.includes('card-actions')) continue;
      // Nothing places the actions, so they follow the note at the inline start.
      expect(body, selector).not.toMatch(/grid-(?:row|column)\s*:|justify-content/);
      // Only actions that start the header, with nothing above them, move down at every width.
      if (body.includes('margin')) expect(selector).toBe(ALONE.slice(0, -2));
    }
    expect(blockAfter(narrow(), ALONE).trim()).toBe(`margin-block-start: ${EXTRA};`);
  });

  it('wraps a long label inside its button rather than widening the card', () => {
    expect(blockAfter(rules(), BUTTON).trim()).toBe('white-space: normal;');
  });

  it('sets the actions beside the title from 24rem, keeping the title 12rem beside them', () => {
    const wide = blockAfter(rules(), WIDE);
    expect(
      blockAfter(wide, '.card > .card-header:has(> .card-actions) > :is(.card-title, .card-note) {'),
    ).toContain('grid-column: 1;');
    const beside = blockAfter(wide, ACTIONS);
    expect(beside).toContain('grid-column: 2;');
    expect(beside).toContain('grid-row: 1;');
    expect(beside).toContain('align-self: start;');
    expect(beside).toContain('justify-content: flex-end;');
    expect(beside).toContain('min-block-size: var(--size-control);');
    // The title keeps 12rem beside them, and a lone button wider than what is left still never overlaps it.
    expect(beside).toContain('max-inline-size: calc(100cqi - 12rem - var(--spacing-peer));');
    expect(beside).toContain('min-inline-size: min-content;');
    // With a note they span its row too, so a second line of actions never parts the note from the title.
    expect(blockAfter(wide, SPAN).trim()).toBe('grid-row: 1 / span 2;');
  });

  it('moves the actions and the title down by the corner inset less the padding beside the title alone', () => {
    const wide = blockAfter(rules(), WIDE);
    expect(blockAfter(wide, ACTIONS)).toContain(`margin-block-start: ${EXTRA};`);
    // The title moves with them, its first line centred on a control's height, level with their first line.
    expect(blockAfter(wide, TITLE).trim()).toBe(
      'margin-block-start: calc(var(--holder-corner-inset) - var(--holder-pad) + max(0px, calc((var(--size-control) - 1lh) / 2)));',
    );
    // Down, never in: the actions end on the body's column edge.
    for (const { selector, body } of all().filter((rule) => rule.selector.includes('card-actions'))) {
      expect(body, selector).not.toMatch(/(?:padding|margin)-inline[^;]*corner-inset/);
    }
  });

  it("matches only a header that is a card's own child, so a collapsible card's header is untouched", () => {
    const placed = all().filter(
      ({ selector }) => selector.includes('card-header') && selector.includes('card-actions'),
    );
    expect(placed).toHaveLength(7);
    for (const { selector } of placed) {
      // A collapsible card's header sits in .card-disclosure, never directly in the card.
      expect(selector).toMatch(/^\.card > \.card-header/);
      expect(selector).not.toContain('card-disclosure');
    }
  });

  it('uses logical properties only', () => {
    for (const { selector, body } of all().filter((rule) =>
      rule.selector.startsWith('.card > .card-header'),
    )) {
      expect(body, selector).not.toMatch(
        /(?:margin|padding|border)-(?:left|right|top|bottom)|(?<![\w-])(?:left|right|width|height)\s*:/,
      );
    }
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
  const COLLAPSIBLE = /card-(?:collapsible|disclosure|toggle|chevron|actions|fold|marker)|\[dir=/;
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

  it('draws in tokens only: a slate chevron that turns ink, and a clay marker', () => {
    const colors = all()
      .filter(({ selector }) => COLLAPSIBLE.test(selector))
      .flatMap(({ body }) => [...body.matchAll(/var\((--color-[a-z-]+)\)/g)].map(([, name]) => name));
    expect([...new Set(colors)].sort()).toEqual(['--color-clay', '--color-ink', '--color-slate']);
    expect(blockAfter(rules(), '.card-chevron {')).toContain('color: var(--color-slate);');
  });

  it('brings the toggle to a 40px target as wide as the title, and gives the room back so the header keeps its height', () => {
    const toggle = blockAfter(rules(), '.card-toggle {');
    expect(toggle).toContain('width: 100%;');
    expect(toggle).toContain('min-height: var(--size-target);');
    expect(toggle).toContain('padding: max(0px, calc((var(--size-target) - 1lh) / 2)) 0;');
    expect(toggle).toContain('margin: min(0px, calc((1lh - var(--size-target)) / 2)) 0;');
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

  it('lays the header out as a row that wraps: the title and the note as one block, then the actions', () => {
    const css = rules();
    const header = blockAfter(css, '.card-disclosure > .card-header {');
    expect(header).toContain('display: flex;');
    expect(header).toContain('flex-wrap: wrap;');
    // 24px between the heading and the actions on one row. A gap is only drawn between two items on a row,
    // so a header with no actions keeps none, and actions that wrap start at the row's start.
    expect(header).toContain('column-gap: var(--spacing-peer);');
    // The heading keeps the note directly under the title, 8px down, as in a card, and takes the room the
    // actions leave, but never less than 12rem beside them.
    const heading = blockAfter(css, '.card-disclosure > .card-header > .card-heading {');
    expect(heading).toContain('display: grid;');
    expect(heading).toContain('flex: 1 1 12rem;');
    expect(heading).toContain('min-inline-size: 0;');
    expect(heading).toContain('gap: var(--spacing-part);');
    const actions = blockAfter(css, '.card-actions {');
    expect(actions).toContain('flex: 0 1 auto;');
    expect(actions).toContain('flex-wrap: wrap;');
    expect(actions).toContain('gap: var(--spacing-part);');
    // Wrapped under the heading, the actions start at the row's start, and so does a second line of them.
    expect(actions).not.toContain('justify-content');
    expect(actions).not.toContain('margin');
    expect(blockAfter(css, '.card-toggle-text {')).toContain('min-width: 0;');
  });

  it('sizes the header from what it holds: no size container, so a card that fits its content fits the title', () => {
    // A size container takes no width from its content. Here the header is all a folded card shows, so a
    // folded card that takes the width of its content shrank to its padding; it also made the header a
    // containing block and a stacking context. A plain card's header holding CardActions is a size container
    // with a stand-in width of 0 (the CardActions describe), so a card that sizes to its content takes its
    // width from its body or from its place, never from that header; none of its rules reaches this header.
    const collapsible = all().filter(({ selector }) => !selector.startsWith('.card > .card-header'));
    for (const { selector, body } of collapsible) {
      expect(body, selector).not.toMatch(/container(?:-type|-name)?\s*:/);
      expect(body, selector).not.toMatch(/grid-(?:row|column)\s*:/);
    }
    expect(rules().match(/@container/g)).toEqual(['@container']);
    expect(rules()).toContain('@container card-header (inline-size >= 24rem)');
  });

  it('sets the chevron level with the first line of a title that wraps', () => {
    const css = rules();
    expect(blockAfter(css, '.card-toggle {')).toContain('align-items: flex-start;');
    expect(blockAfter(css, '.card-chevron {')).toContain('margin-block: calc((1lh - 24px) / 2);');
  });

  it('draws the folded marker as an 8px clay dot after the last word of the title, level with its line', () => {
    const css = rules();
    const dot = blockAfter(css, '.card-marker {');
    expect(dot).toContain('width: 8px;');
    expect(dot).toContain('height: 8px;');
    expect(dot).toContain('border-radius: var(--radius-dot);');
    // Clay, the color of the Changed chip it stands for, which measures over 3:1 on the card in both modes.
    expect(dot).toContain('background-color: var(--color-clay);');
    // Out of the flow, so it never moves a word. With no inset it stays where the flow would put it, after
    // the last word, on the last line, and the margins take it a part step on and centre it on that line.
    expect(dot).toContain('position: absolute;');
    expect(dot).not.toMatch(/(?:^|;\s*)(?:inset|top|left|right|bottom)[a-z-]*\s*:/);
    expect(dot).toContain('margin-inline-start: var(--spacing-part);');
    expect(dot).toContain('margin-block-start: calc((1lh - 8px) / 2);');
    const text = blockAfter(css, '.card-toggle-text {');
    expect(text).toContain('position: relative;');
    // The words take only their own width, and the chevron keeps the end of the row.
    expect(text).toContain('flex: 0 1 auto;');
    expect(blockAfter(css, '.card-chevron {')).toContain('margin-inline-start: auto;');
    // The marker's words are hidden by the hidden attribute, so no rule draws them, and none can undo it.
    expect(css).not.toContain('card-marker-label');
  });

  it('keeps room for the dot beside a folded title, so the title never moves when the dot comes or goes', () => {
    const css = rules();
    const room = blockAfter(
      css,
      '.card-collapsible:not([data-expanded]) > .card-disclosure > .card-header .card-toggle-text {',
    );
    // The dot and the gap before it, whether the dot is drawn or not. An open card keeps no room.
    expect(room.trim()).toBe('margin-inline-end: calc(8px + var(--spacing-part));');
    expect(blockAfter(css, '.card-toggle-text {')).not.toContain('margin');
  });

  it("draws the dot in the reader's text color in forced colors, where a background would be lost", () => {
    expect(blockAfter(blockAfter(rules(), FORCED_COLORS), '.card-marker {')).toContain(
      'background-color: CanvasText;',
    );
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

describe('src/components/description-list.css', () => {
  // The rules without their comments, with their whitespace closed up, so a selector Prettier breaks over
  // lines reads as one line.
  const rules = () => closeUp(stripComments(read('src/components/description-list.css')));
  const CONTAINER = '@container description-list (inline-size >= 30rem)';
  const ROW = '.description-list-item {';
  const PAD = 'calc(var(--description-list-pad) + var(--holder-corner-inset) - var(--holder-pad))';
  /** The holders a list ends: a card, a card's last body, and a collapsible card's body. */
  const FOOT =
    ':is(.card, .card > .card-body:last-child, .card > .card-disclosure > .card-fold > .card-body:last-child)';
  const LAST = (layout) =>
    `${FOOT} > .description-list[data-layout='${layout}']:last-child > .description-list-item:last-child:has(> .description-list-actions) {`;
  const FIRST =
    ':is(.card, .card > .card-body:first-child) > .description-list:first-child > .description-list-item:first-child:has(> .description-list-actions) {';
  const HORIZONTAL = ".description-list[data-layout='horizontal'] > .description-list-item {";
  const AUTO = ".description-list[data-layout='auto'] > .description-list-item {";

  /** The CSS with the container query's block taken out, so the narrow layout is read on its own. */
  const outsideContainer = (css) => {
    const start = css.indexOf(CONTAINER);
    if (start === -1) return css;
    const end = css.indexOf('{', start) + 1 + blockAfter(css, CONTAINER).length + 1;
    return css.slice(0, start) + css.slice(end);
  };

  it('is a size container switching at 30rem, with an intrinsic width of 0', () => {
    const css = rules();
    const list = blockAfter(css, '.description-list {');
    expect(list).toContain('container: description-list / inline-size;');
    // The library's rule: a stand-in width is also the min-content width, which scrolled a phone page sideways.
    expect(list).toContain('contain-intrinsic-inline-size: 0;');
    expect(list).toContain('margin: 0;');
    expect(list).toContain('padding: 0;');
    // Stacked under 30rem: the term and the actions share the first line, the value spans the second.
    const stacked = blockAfter(outsideContainer(css), ROW);
    expect(stacked).toContain('grid-template-columns: minmax(0, 1fr) auto;');
    expect(stacked).toContain("grid-template-areas: 'term actions' 'value value';");
    expect(stacked).toContain('row-gap: calc(var(--spacing-part) / 2);');
    // Side by side from 30rem, and only for the auto layout; horizontal holds it at every width.
    const wide = blockAfter(css, CONTAINER);
    const side = blockAfter(wide, AUTO);
    expect(side).toContain("grid-template-areas: 'term value actions';");
    expect(side).toContain('row-gap: 0;');
    const horizontal = blockAfter(outsideContainer(css), HORIZONTAL);
    expect(horizontal).toContain("grid-template-areas: 'term value actions';");
    expect(horizontal).toContain('row-gap: 0;');
    expect(css).not.toContain("[data-layout='stacked']");
    // A row with no actions gives their column to the term or the value.
    expect(
      blockAfter(outsideContainer(css), '.description-list-item:not(:has(> .description-list-actions)) {'),
    ).toContain("grid-template-areas: 'term term' 'value value';");
    expect(
      blockAfter(
        wide,
        ".description-list[data-layout='auto'] > .description-list-item:not(:has(> .description-list-actions)) {",
      ),
    ).toContain("grid-template-areas: 'term value value';");
  });

  it('draws the Dense data row against the body line, and a divider rule between rows only', () => {
    const css = rules();
    const row = blockAfter(outsideContainer(css), ROW);
    expect(row).toContain('--description-list-row: max(var(--size-target), var(--size-field));');
    expect(row).toContain(
      '--description-list-pad: max(0px, calc((var(--description-list-row) - 1lh - 1px) / 2));',
    );
    expect(row).toContain('min-block-size: var(--description-list-row);');
    expect(row).toContain('padding-block: var(--description-list-pad);');
    expect(row).toContain('box-sizing: border-box;');
    expect(row).toContain('align-items: baseline;');
    expect(row).toContain('column-gap: var(--spacing-peer);');
    // The rule is drawn on a row that follows another, so never above the first or under the last.
    expect(
      blockAfter(css, '.description-list[data-dividers] > .description-list-item + .description-list-item {'),
    ).toContain('border-block-start: 1px solid var(--color-divider);');
    expect(css).not.toMatch(/border(?:-block-end)?:/);
    // The actions take back what a control has over the line, so the row does not grow for its button.
    const actions = blockAfter(css, '.description-list-actions {');
    expect(actions).toContain('margin-block: min(0px, calc((1lh - var(--size-control)) / 2));');
    expect(actions).toContain('gap: var(--spacing-part);');
    expect(actions).toContain('justify-content: flex-end;');
  });

  it('sets terms at the small step 500 in slate and values at the body step 450 in ink, empty values slate', () => {
    const css = rules();
    const row = blockAfter(outsideContainer(css), ROW);
    expect(row).toContain('font-size: var(--text-body);');
    expect(row).toContain('line-height: var(--text-body--line-height);');
    const term = blockAfter(css, '.description-list-term {');
    for (const declaration of [
      'grid-area: term;',
      'font-size: var(--text-small);',
      'line-height: var(--text-small--line-height);',
      'font-weight: 500;',
      'color: var(--color-slate);',
    ]) {
      expect(term, declaration).toContain(declaration);
    }
    const value = blockAfter(css, '.description-list-value {');
    for (const declaration of [
      'grid-area: value;',
      'font-weight: var(--text-body--font-weight);',
      'color: var(--color-ink);',
      // Wraps, and breaks a long word anywhere: nothing truncates.
      'overflow-wrap: anywhere;',
    ]) {
      expect(value, declaration).toContain(declaration);
    }
    expect(blockAfter(css, '.description-list-value[data-empty] {')).toContain('color: var(--color-slate);');
    expect(css).not.toMatch(/text-overflow|line-clamp|--color-taupe|font-weight:\s*600/);
  });

  it('keeps numeric values left to right, isolated and at the line start', () => {
    const numeric = blockAfter(rules(), '.description-list-value[data-numeric] {');
    for (const declaration of [
      'font-variant-numeric: tabular-nums;',
      'direction: ltr;',
      'unicode-bidi: isolate;',
      'text-align: -webkit-match-parent;',
      'text-align: match-parent;',
    ]) {
      expect(numeric, declaration).toContain(declaration);
    }
    // The standard name last, so a browser that knows it uses it.
    expect(numeric.indexOf('text-align: match-parent;')).toBeGreaterThan(
      numeric.indexOf('text-align: -webkit-match-parent;'),
    );
  });

  it('takes the term column from --description-list-term-size, 30% by default', () => {
    const css = rules();
    const template =
      'grid-template-columns: minmax(0, var(--description-list-term-size, 30%)) minmax(0, 1fr) auto;';
    expect(blockAfter(outsideContainer(css), HORIZONTAL)).toContain(template);
    expect(blockAfter(blockAfter(css, CONTAINER), AUTO)).toContain(template);
  });

  it("moves a first or last row's controls by the holder's corner inset less its padding, in a card only", () => {
    const css = rules();
    // The foot: side by side only, horizontal at every width and auto from 30rem, where the controls stand on
    // the last row's first line. Stacked, they are on the term's line at the row's top, clear of the curve.
    expect(blockAfter(outsideContainer(css), LAST('horizontal'))).toContain(`padding-block-end: ${PAD};`);
    const corner = css.slice(css.lastIndexOf(CONTAINER));
    expect(corner).not.toBe(css.slice(css.indexOf(CONTAINER)));
    expect(blockAfter(blockAfter(corner, CONTAINER), LAST('auto'))).toContain(`padding-block-end: ${PAD};`);
    // The head: the first row's controls in every layout, since they stand on its first line either way.
    expect(blockAfter(css, FIRST)).toContain(`padding-block-start: ${PAD};`);
    // Down, never in, so a trailing action keeps the column's end edge; and only in a card.
    expect(css).not.toMatch(/(?:padding|margin)-inline[^;]*corner-inset/);
    const moved = [...css.matchAll(/([^{}]+)\{([^{}]*--holder-corner-inset[^{}]*)\}/g)].map((match) => ({
      selector: match[1].trim(),
      declaration: match[2].trim(),
    }));
    expect(moved).toHaveLength(3);
    for (const { selector, declaration } of moved) {
      expect(selector).toMatch(/^:is\(\.card, \.card > \.card-body/);
      // Every block-end move names a side-by-side layout.
      if (declaration.startsWith('padding-block-end')) expect(selector).toContain('[data-layout=');
    }
    // Logical properties throughout, so the layout mirrors in right to left.
    expect(css).not.toMatch(/(?:margin|padding|border)-(?:left|right|top|bottom)|(?<![\w-])(?:left|right):/);
  });

  it("hides the actions in print and names the rule's color in forced colors", () => {
    const css = rules();
    expect(blockAfter(blockAfter(css, '@media print'), '.description-list-actions {')).toContain(
      'display: none;',
    );
    const forced = blockAfter(css, '@media (forced-colors: active)');
    expect(
      blockAfter(
        forced,
        '.description-list[data-dividers] > .description-list-item + .description-list-item {',
      ),
    ).toContain('border-block-start-color: canvastext;');
  });
});

describe('src/components/gauge.css', () => {
  // The rules without their comments, with their whitespace closed up, so a selector Prettier breaks over
  // lines reads as one line.
  const rules = () => closeUp(stripComments(read('src/components/gauge.css')));
  const SEMICIRCLE = ".gauge[data-form='semicircle']";
  /** The block of the rule whose whole selector is `selector`, not one that lists it among others. */
  const rule = (css, selector) => {
    const found = [...css.matchAll(/(?<=^|[{}])\s*([^{}]+?)\s*\{/g)].find((match) => match[1] === selector);
    return found ? blockAfter(css.slice(found.index), `${selector} {`) : '';
  };

  it('sizes the dial at 2, 6 and 10rem', () => {
    const css = rules();
    expect(rule(css, '.gauge')).toContain('--gauge-size: 6rem;');
    expect(rule(css, ".gauge[data-size='sm']")).toContain('--gauge-size: 2rem;');
    expect(rule(css, ".gauge[data-size='lg']")).toContain('--gauge-size: 10rem;');
    expect(rule(css, '.gauge-dial')).toContain('inline-size: var(--gauge-size);');
    // The stroke's share of each box, 8 of 96, 4 of 32 and 12 of 160, so the figure's inner circle follows an
    // app's own --gauge-size.
    expect(rule(css, '.gauge')).toContain('--gauge-band: calc(var(--gauge-size) / 12);');
    expect(rule(css, ".gauge[data-size='sm']")).toContain('--gauge-band: calc(var(--gauge-size) / 8);');
    expect(rule(css, ".gauge[data-size='lg']")).toContain('--gauge-band: calc(var(--gauge-size) * 3 / 40);');
    // The svg scales uniformly from its viewBox, so a circle stays a circle at any size.
    const svg = rule(css, '.gauge-svg');
    expect(svg).toContain('inline-size: 100%;');
    expect(svg).toContain('block-size: auto;');
    expect(svg).toContain('overflow: visible;');
  });

  it('strokes the track in the frame color and the value in --gauge-ink, round caps on both', () => {
    const css = rules();
    const both = blockAfter(css, '.gauge-track, .gauge-value {');
    expect(both).toContain('fill: none;');
    expect(both).toContain('stroke-linecap: round;');
    expect(rule(css, '.gauge-track')).toContain('stroke: var(--color-frame);');
    expect(rule(css, '.gauge-value')).toContain('stroke: var(--gauge-ink);');
    expect(rule(css, '.gauge')).toContain('--gauge-ink: var(--color-ink);');
    // Round in every shape: nothing here reads the shape axis.
    expect(css).not.toMatch(/data-shape|--radius-|stroke-linecap: square/);
    // Butt caps only where nothing is drawn: an empty arc's zero-length dash.
    expect(css.match(/stroke-linecap: butt/g)).toHaveLength(1);
    expect(rule(css, '.gauge-value[data-empty]')).toContain('stroke-linecap: butt;');
  });

  it('turns --gauge-ink warning for warning and over the limit, and error for error, error last', () => {
    const css = rules();
    const warning = ".gauge:is([data-tone='warning'], [data-over]) {";
    const error = ".gauge[data-tone='error'] {";
    expect(blockAfter(css, warning)).toContain('--gauge-ink: var(--color-warning);');
    expect(blockAfter(css, error)).toContain('--gauge-ink: var(--color-error);');
    // Equal weight, so the later rule wins: an error over the limit stays error.
    expect(css.indexOf(error)).toBeGreaterThan(css.indexOf(warning));
    expect(css).not.toMatch(/--color-(?:success|gain|signal|clay|taupe)/);
  });

  it('moves the value over 200ms and stops under reduced motion', () => {
    const css = rules();
    const value = rule(css, '.gauge-value');
    expect(value).toContain(
      'transition: stroke-dasharray 200ms ease, stroke-dashoffset 200ms ease, stroke 200ms ease;',
    );
    expect(rule(blockAfter(css, '@media (prefers-reduced-motion: reduce)'), '.gauge-value')).toContain(
      'transition: none;',
    );
    // Nothing else moves, and nothing sweeps in: a transition never runs on the first style.
    expect(css.match(/transition:/g)).toHaveLength(2);
    // A share of 0 keeps its path to move from and to: a zero-length dash that butt caps leave unpainted.
    expect(rule(css, '.gauge-value[data-empty]')).toContain('stroke-linecap: butt;');
    expect(css).not.toMatch(/animation|@keyframes/);
  });

  it('mirrors the svg by --gauge-flip from the dir attribute', () => {
    const css = rules();
    expect(rule(css, ":where([dir='ltr' i])")).toContain('--gauge-flip: 1;');
    expect(rule(css, ":where([dir='rtl' i])")).toContain('--gauge-flip: -1;');
    expect(rule(css, '.gauge-svg')).toContain('scale: var(--gauge-flip, 1) 1;');
    // Only the svg mirrors: the figure and the text are HTML and keep their reading order.
    expect(css.match(/--gauge-flip,/g)).toHaveLength(1);
    expect(css).not.toContain(':dir(');
  });

  it('draws marks in ink over gaps the svg cuts, reading no surface color', () => {
    const css = rules();
    // The 6px gap is a mask in the svg, so the real background shows through it on any surface: nothing here
    // names the surface a gauge sits on.
    expect(css).not.toMatch(/--meter-surface|--color-(?:lifted|canvas|float)|gauge-mark-ring/);
    const mark = rule(css, '.gauge-mark');
    expect(mark).toContain('stroke: var(--color-ink);');
    expect(mark).toContain('stroke-width: 2px;');
  });

  it('sets the figure at the h3 step at md and the numeral step at lg, 500, tabular, left to right', () => {
    const css = rules();
    const figure = rule(css, '.gauge-figure-value');
    for (const declaration of [
      'font-size: var(--text-h3);',
      'line-height: var(--text-h3--line-height);',
      'letter-spacing: var(--text-h3--letter-spacing);',
      'font-weight: var(--text-h3--font-weight);',
      'font-variant-numeric: tabular-nums;',
      'white-space: nowrap;',
      'direction: ltr;',
      'unicode-bidi: isolate;',
      'color: var(--color-ink);',
    ]) {
      expect(figure, declaration).toContain(declaration);
    }
    const large = rule(css, ".gauge[data-size='lg'] .gauge-figure-value");
    for (const declaration of [
      'font-size: var(--text-numeral-sm);',
      'line-height: var(--text-numeral-sm--line-height);',
      'letter-spacing: var(--text-numeral-sm--letter-spacing);',
      'font-weight: var(--text-numeral-sm--font-weight);',
    ]) {
      expect(large, declaration).toContain(declaration);
    }
    // The caption is slate, at the small step, never toned, and two lines at most.
    const caption = rule(css, '.gauge-figure-caption');
    for (const declaration of [
      'font-size: var(--text-small);',
      'font-weight: var(--text-small--font-weight);',
      'color: var(--color-slate);',
      '-webkit-line-clamp: 2;',
      'overflow: hidden;',
      'overflow-wrap: anywhere;',
    ]) {
      expect(caption, declaration).toContain(declaration);
    }
    // Weights 500 and the steps' own tokens only: 500 for the figure and the label, 450 for the caption and the
    // value text.
    for (const weight of css.matchAll(/font-weight:\s*([^;]+);/g))
      expect(weight[1]).toMatch(/^(?:500|var\(--text-(?:h3|numeral-sm|small)--font-weight\))$/);
  });

  it("centres the figure in a ring's inner circle and sets a semicircle's on its chord", () => {
    const css = rules();
    // The dial stacks the svg and the figure in one cell, so a semicircle's caption under the chord gives the dial
    // its height.
    expect(rule(css, '.gauge-dial')).toContain('display: grid;');
    expect(blockAfter(css, '.gauge-svg, .gauge-figure {')).toContain('grid-area: 1 / 1;');
    const ring = rule(css, '.gauge-figure');
    expect(ring).toContain('padding: var(--gauge-band);');
    expect(ring).toContain('justify-content: center;');
    // A semicircle: a strut half the box tall, whose baseline is its foot, holds the figure's baseline on the chord.
    const semicircle = rule(css, `${SEMICIRCLE} .gauge-figure`);
    expect(semicircle).toContain('flex-flow: row wrap;');
    expect(semicircle).toContain('align-items: baseline;');
    expect(semicircle).toContain('padding: 0 var(--gauge-band);');
    expect(rule(css, `${SEMICIRCLE} .gauge-figure::before`)).toContain(
      'block-size: calc(var(--gauge-size) / 2);',
    );
    expect(rule(css, `${SEMICIRCLE} .gauge-figure-caption`)).toContain('flex-basis: 100%;');
  });

  it('puts the text under the dial at md and lg, at least the dial or 12rem wide, and beside it at sm', () => {
    const css = rules();
    const text = rule(css, '.gauge-text');
    expect(text).toContain('max-inline-size: max(var(--gauge-size), 12rem);');
    expect(text).toContain('text-align: center;');
    expect(text).toContain('overflow-wrap: anywhere;');
    const small = rule(css, ".gauge[data-size='sm']");
    expect(small).toContain('grid-template-columns: auto minmax(0, 1fr);');
    expect(small).toContain('align-items: center;');
    expect(rule(css, ".gauge[data-size='sm'] .gauge-text")).toContain('text-align: start;');
    const label = rule(css, '.gauge-label');
    expect(label).toContain('font-weight: 500;');
    expect(label).toContain('color: var(--color-ink);');
    const value = rule(css, '.gauge-value-label');
    expect(value).toContain('font-weight: var(--text-small--font-weight);');
    expect(value).toContain('font-variant-numeric: tabular-nums;');
    expect(value).toContain('color: var(--color-slate);');
    // Logical properties throughout.
    expect(css).not.toMatch(
      /(?:margin|padding|border)-(?:left|right|top|bottom)|(?<![\w-])(?:left|right|top|bottom):/,
    );
  });

  it('sizes a ring caption to the inner circle at its line: one line at md and two at lg', () => {
    const css = rules();
    // The figure's line is its own size in a ring, so the block is as short as it can be.
    expect(rule(css, ".gauge[data-form='ring'] .gauge-figure-value")).toContain('line-height: 1;');
    const ring = rule(css, ".gauge[data-form='ring'] .gauge-figure-caption");
    expect(ring).toContain('-webkit-line-clamp: 1;');
    expect(ring).toContain('max-inline-size: calc(var(--gauge-size) * 5 / 8);');
    const large = rule(css, ".gauge[data-form='ring'][data-size='lg'] .gauge-figure-caption");
    expect(large).toContain('-webkit-line-clamp: 2;');
    expect(large).toContain('max-inline-size: calc(var(--gauge-size) * 13 / 20);');
  });

  it('names graytext, canvastext and highlight in forced colors, and keeps the mask out of the repaint', () => {
    const forced = blockAfter(rules(), '@media (forced-colors: active)');
    expect(rule(forced, '.gauge-track')).toContain('stroke: graytext;');
    expect(rule(forced, '.gauge-value')).toContain('stroke: canvastext;');
    expect(rule(forced, '.gauge-mark')).toContain('stroke: highlight;');
    expect(rule(forced, '.gauge-mask')).toContain('forced-color-adjust: none;');
  });

  it('keeps print colors exact', () => {
    const root = rule(rules(), '.gauge');
    expect(root).toContain('-webkit-print-color-adjust: exact;');
    expect(root).toContain('print-color-adjust: exact;');
  });
});

describe('src/components/month-grid.css', () => {
  // The rules without their comments, with their whitespace closed up, so a selector Prettier breaks over
  // lines reads as one line.
  const rules = () => closeUp(stripComments(read('src/components/month-grid.css')));
  const NARROW = '@container month-grid (inline-size < 28rem)';
  /** The block of the rule whose whole selector is `selector`, not one that lists it among others. */
  const rule = (css, selector) => {
    const found = [...css.matchAll(/(?<=^|[{}])\s*([^{}]+?)\s*\{/g)].find((match) => match[1] === selector);
    return found ? blockAfter(css.slice(found.index), `${selector} {`) : '';
  };
  /** The block for a look, written once for the cell and its legend swatch. */
  const look = (css, name) =>
    rule(css, `.month-grid-cell[data-look='${name}'], .month-grid-swatch[data-look='${name}']`);

  it('is a size container with a 0 intrinsic width, hiding all but quarter labels under 28rem', () => {
    const css = rules();
    const grid = rule(css, '.month-grid');
    expect(grid).toContain('container: month-grid / inline-size;');
    // The library-wide ruling (spec corrections 34 and 45): a stand-in width is the holder's min-content, which
    // scrolls a 320px page sideways from a flex: 1 wrapper or a 1fr track, so it is 0 and a content-sized holder
    // gives the grid a width.
    expect(grid).toContain('contain-intrinsic-inline-size: 0;');
    expect(grid).toContain('min-width: 0;');
    expect(grid).toContain('margin: 0;');
    const narrow = blockAfter(css, NARROW);
    expect(rule(narrow, '.month-grid-month:not([data-quarter])')).toContain('visibility: hidden;');
    // A quarter's label may run on over the hidden ones after it, rather than be clipped by its column.
    expect(rule(narrow, '.month-grid-month[data-quarter]')).toContain('overflow: visible;');
    expect(css.match(/@container/g)).toHaveLength(2);
  });

  it('wraps under 12rem instead of shrinking: a year on its own line, then half-years, and no header', () => {
    const css = rules();
    const narrow = blockAfter(css, '@container month-grid (inline-size < 12rem)');
    // The half count is the component's --month-grid-half, never a calc() inside repeat().
    expect(rule(narrow, '.month-grid-grid')).toContain(
      'grid-template-columns: repeat(var(--month-grid-half, 6), minmax(0, 1fr));',
    );
    expect(css).not.toMatch(/repeat\(\s*calc/);
    expect(rule(narrow, '.month-grid-corner, .month-grid-month')).toContain('display: none;');
    const year = rule(narrow, '.month-grid-year');
    expect(year).toContain('grid-column: 1 / -1;');
    expect(year).toContain('padding-inline-end: 0;');
    // It follows the 28rem query, so it wins where both apply.
    expect(css.indexOf('(inline-size < 12rem)')).toBeGreaterThan(css.indexOf('(inline-size < 28rem)'));
  });

  it('lays the grid out as a year column and --month-grid-columns columns 2px apart', () => {
    const css = rules();
    const grid = rule(css, '.month-grid-grid');
    expect(grid).toContain('display: grid;');
    expect(grid).toContain(
      'grid-template-columns: auto repeat(var(--month-grid-columns, 12), minmax(0, 1fr));',
    );
    expect(grid).toContain('gap: 2px;');
    const year = rule(css, '.month-grid-year');
    // Each year starts a row of its own, so a row of the wrong length cannot move the years under it.
    expect(year).toContain('grid-column: 1;');
    expect(year).toContain('padding-inline-end: calc(var(--spacing-part) - 2px);');
    expect(year).toContain('font-weight: 500;');
    expect(year).toContain('font-variant-numeric: tabular-nums;');
    expect(year).toContain('unicode-bidi: isolate;');
    const month = rule(css, '.month-grid-month');
    expect(month).toContain('font-weight: 450;');
    expect(month).toContain('color: var(--color-slate);');
    expect(month).toContain('text-align: center;');
    expect(month).toContain('white-space: nowrap;');
    expect(rule(css, '.month-grid-cell')).toContain('block-size: 1rem;');
    // Logical properties throughout, so the year column and January are at the right on a right-to-left page.
    expect(css).not.toMatch(
      /(?:margin|padding|border)-(?:left|right|top|bottom)|(?<![\w-])(?:left|right|top|bottom|width|height):/,
    );
  });

  it("draws filled, partial and empty as ink, Meter's hatch with its edge, and a boundary outline", () => {
    const css = rules();
    expect(look(css, 'filled')).toContain('background-color: var(--color-ink);');
    const partial = look(css, 'partial');
    expect(partial).toContain('border: 1px solid var(--color-ink);');
    expect(partial).toContain(
      'background-image: repeating-linear-gradient(45deg, var(--color-ink) 0 2px, transparent 2px 6px);',
    );
    expect(look(css, 'empty')).toContain('border: 1px solid var(--color-boundary);');
    // A month outside the range is blank, and no look is a meaning: no reserved color anywhere.
    expect(css).not.toContain("[data-look='none']");
    expect(css).not.toMatch(/--color-(?:error|warning|success|gain|signal|clay|taupe)/);
    // The summary and the legend's labels are slate; the swatch is Meter's 12px, on the cell's corner, since the
    // micro step on 12px is a circle and a key looks like what it stands for (spec correction 46).
    expect(rule(css, '.month-grid-summary')).toContain('color: var(--color-slate);');
    expect(rule(css, '.month-grid-legend-label')).toContain('color: var(--color-slate);');
    const swatch = rule(css, '.month-grid-swatch');
    expect(swatch).toContain('inline-size: 0.75rem;');
    expect(swatch).toContain('block-size: 0.75rem;');
    expect(swatch).toContain('border-radius: calc(var(--radius-micro) * 2 / 3);');
    for (const weight of css.matchAll(/font-weight:\s*([^;]+);/g))
      expect(weight[1]).toMatch(/^(?:450|500|var\(--text-small--font-weight\))$/);
  });

  it('rounds a cell at two thirds of the micro step', () => {
    // 4px in Rounded and Soft and 0 in Square: a text-sized part, under every holder's formula.
    expect(rule(rules(), '.month-grid-cell')).toContain('border-radius: calc(var(--radius-micro) * 2 / 3);');
  });

  it('clips the table from sight inside its own 1px box, as the status host is', () => {
    const host = rule(rules(), '.month-grid-alternative');
    for (const declaration of [
      'position: absolute;',
      'inline-size: 1px;',
      'block-size: 1px;',
      'overflow: hidden;',
      'clip-path: inset(50%);',
      'white-space: nowrap;',
    ])
      expect(host, declaration).toContain(declaration);
    expect(rule(rules(), '.month-grid')).toContain('position: relative;');
  });

  it('keeps three shapes in forced colors', () => {
    const forced = blockAfter(rules(), '@media (forced-colors: active)');
    expect(look(forced, 'filled')).toContain('background-color: canvastext;');
    const partial = look(forced, 'partial');
    expect(partial).toContain('forced-color-adjust: none;');
    expect(partial).toContain('border-color: canvastext;');
    expect(partial).toContain('background-color: canvas;');
    expect(partial).toContain(
      'background-image: repeating-linear-gradient(45deg, canvastext 0 2px, canvas 2px 6px);',
    );
    expect(look(forced, 'empty')).toContain('border-color: canvastext;');
  });

  it('keeps print colors exact', () => {
    const root = rule(rules(), '.month-grid');
    expect(root).toContain('-webkit-print-color-adjust: exact;');
    expect(root).toContain('print-color-adjust: exact;');
  });
});

describe('src/components/segmented.css', () => {
  // The rules without their comments, which quote selectors of their own.
  // Closed up, so a selector Prettier breaks over lines is found as one.
  const rules = () => closeUp(read('src/components/segmented.css').replace(/\/\*[\s\S]*?\*\//g, ''));

  it("sizes an option's icon by its own class, 16px on the word's line, before the word", () => {
    const icon = blockAfter(rules(), '.segmented-icon {');
    for (const declaration of ['width: 16px;', 'height: 16px;', 'margin-inline-end: 0.375rem;']) {
      expect(icon, declaration).toContain(declaration);
    }
    // An icon-only option's svg carries no class and keeps its own size and place.
    expect(rules()).not.toMatch(/\.segmented-label > svg/);
  });
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
    // 40px of option in a 48px field, and 28px in a 36px compact one.
    expect(track).toContain('--segmented-option-height: calc(var(--size-field) - 0.5rem);');
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
    // Never under the target, so neighboring rows' hit areas never overlap: 40px, and 44px in compact on touch.
    expect(stacked).toContain('--segmented-option-height: max(var(--size-target), var(--size-control));');
    // A pill's corner is half the height, which on a column is a blob, so a stacked track takes the surface step.
    expect(stacked).toContain('--segmented-radius: var(--radius-surface);');
    expect(blockAfter(source, '.segmented-sm .segmented-track')).toContain(
      '--segmented-option-height: calc(var(--size-control) - 0.5rem);',
    );
    // An option reaches its 40px hit area only while it sits in a row.
    expect(source).toContain('.segmented:not([data-stacked]) .segmented-option::before');
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

describe('the density tokens in the controls and the card', () => {
  // The rules without their comments, which quote selectors and values of their own.
  const rules = (file) => stripComments(read(`src/components/${file}`));
  // One formula from the target. It reads the padding box, 100%, because a positioned child measures from
  // inside the border: a bordered 36px compact control is hit at 40, not 38, and one at 40px or more at its own
  // border box.
  const HIT_AREA = [
    "content: '';",
    'position: absolute;',
    'inset-inline: 0;',
    'inset-block: min(0px, (100% - var(--size-target)) / 2);',
  ];

  it('sizes the button, the icon button and the input from the tokens, with one hit-area formula', () => {
    const button = rules('button.css');
    const pill = blockAfter(button, '.button {');
    expect(pill).toContain('min-height: var(--size-control);');
    expect(pill).not.toContain('min-height: 40px');
    for (const declaration of HIT_AREA) {
      expect(blockAfter(button, '.button::before {'), declaration).toContain(declaration);
    }
    const iconButton = rules('icon-button.css');
    const circle = blockAfter(iconButton, '.icon-button {');
    for (const declaration of [
      'position: relative;',
      'width: var(--size-control);',
      'height: var(--size-control);',
    ]) {
      expect(circle, declaration).toContain(declaration);
    }
    expect(circle).not.toContain('40px');
    for (const declaration of HIT_AREA) {
      expect(blockAfter(iconButton, '.icon-button::before {'), declaration).toContain(declaration);
    }
    // The browser centers an input's text in its content box, so the padding goes and the height decides.
    const input = blockAfter(rules('input.css'), '.input {');
    expect(input).toContain('height: var(--size-field);');
    expect(input).toContain('padding-block: 0;');
    expect(input).not.toContain('48px');
    // The textarea restates its own padding, so its rows keep their room.
    expect(blockAfter(rules('textarea.css'), '.input.textarea {')).toContain('padding-block: 0.75rem;');
  });

  it('derives both segmented option heights from the size tokens and hits every option through one rule', () => {
    const css = closeUp(rules('segmented.css'));
    expect(blockAfter(css, '.segmented-track {')).toContain(
      '--segmented-option-height: calc(var(--size-field) - 0.5rem);',
    );
    expect(blockAfter(css, '.segmented-sm .segmented-track {')).toContain(
      '--segmented-option-height: calc(var(--size-control) - 0.5rem);',
    );
    expect(blockAfter(css, '.segmented[data-stacked] .segmented-track {')).toContain(
      '--segmented-option-height: max(var(--size-target), var(--size-control));',
    );
    expect(css).toContain('.segmented:not([data-stacked]) .segmented-option::before {');
    const hit = blockAfter(css, '.segmented:not([data-stacked]) .segmented-option::before {');
    for (const declaration of HIT_AREA) {
      expect(hit, declaration).toContain(declaration);
    }
    // The one rule serves both sizes, and no option height is a literal any more.
    expect(css).not.toContain('.segmented-sm:not([data-stacked])');
    expect(css).not.toMatch(/--segmented-option-height:\s*[\d.]+rem/);
  });

  it('pads the card from --spacing-card and keeps 20px under the title in compact', () => {
    const card = rules('card.css');
    expect(blockAfter(card, '.card {')).toContain('--holder-pad: var(--spacing-card);');
    expect(blockAfter(card, '.card {')).toContain('padding: var(--holder-pad);');
    const header = blockAfter(card, '.card-header {');
    expect(header).toContain('margin: 0 calc(var(--spacing-card) * -1) var(--spacing-card);');
    expect(header).toContain('padding: 0 var(--spacing-card) min(var(--spacing-peer), var(--spacing-card));');
    // The body's column gap is the one separate step left: the space across a body, not the card's own padding.
    expect([...card.matchAll(/([\w-]+)\s*:[^;]*--spacing-separate/g)].map((m) => m[1])).toEqual([
      'column-gap',
    ]);
  });

  it('reads the overlay inset from the inset token, never a literal', () => {
    const values = [...rules('overlay.css').matchAll(/--overlay-inset:\s*([^;]+);/g)].map((m) => m[1]);
    expect(values.length).toBeGreaterThan(0);
    for (const value of values) expect(value).toBe('var(--spacing-inset)');
  });
});

describe('src/components/overlay.css', () => {
  // The rules without their comments, with their whitespace closed up, so the selector list Prettier breaks
  // over two lines reads as one. The "} " in front of the scrim's header starts the search at the rule
  // before it, so `.overlay-scrim {` finds the scrim's own rule and not the tail of the shared one.
  const rules = () => closeUp(stripComments(read('src/components/overlay.css')));

  it('declares the overlay inset once, here, and restates the page type on every overlay root', () => {
    const css = rules();
    // On both roots: a modal's scrim is the panel's parent and reads the inset for its own padding.
    expect(blockAfter(css, '.overlay, .overlay-scrim {')).toContain('--overlay-inset: var(--spacing-inset);');
    expect(css.match(/--overlay-inset\s*:/g) ?? []).toHaveLength(1);
    const root = blockAfter(css, '.overlay {');
    for (const declaration of [
      'box-sizing: border-box;',
      'color: var(--color-ink);',
      'font-family: var(--font-sans);',
      'font-size: var(--text-body);',
      'line-height: var(--text-body--line-height);',
      'font-weight: var(--text-body--font-weight);',
      'text-align: start;',
    ]) {
      expect(root, declaration).toContain(declaration);
    }
    // The inset reads its token here, so no other file may write one of its own.
    for (const file of components.filter((each) => each !== 'overlay.css')) {
      expect(stripComments(read(`src/components/${file}`)), file).not.toMatch(/--overlay-inset\s*:/);
    }
  });

  it('paints the scrim in Deep Well at the theme opacity as a background color, fixed at the modal layer, and keeps it translucent in forced colors', () => {
    const scrim = blockAfter(rules(), '} .overlay-scrim {');
    for (const declaration of [
      'position: fixed;',
      'inset: 0;',
      'z-index: var(--z-modal);',
      'display: grid;',
      'height: var(--visual-viewport-height, 100dvh);',
      'background-color: color-mix(in srgb, var(--color-scrim) calc(var(--opacity-scrim) * 100%), transparent);',
      'transition: background-color 180ms ease;',
      'forced-color-adjust: none;',
    ]) {
      expect(scrim, declaration).toContain(declaration);
    }
    // A color and not an opacity, so the panel inside never fades with it.
    expect(scrim).not.toMatch(/(?<![\w-])opacity\s*:/);
    // Its height is the viewport's, so any padding a modal gives it must sit inside, without base.css too.
    expect(scrim).toContain('box-sizing: border-box;');
  });

  it('opts every overlay root back into forced colors, which the scrim would otherwise hand its panel', () => {
    // forced-color-adjust is inherited, and a modal's panel is the scrim's child, so without this the panel
    // and every control in it would keep the author's colors in Windows high contrast.
    const css = rules();
    expect(blockAfter(css, '.overlay {')).toContain('forced-color-adjust: auto;');
    expect(blockAfter(css, '} .overlay-scrim {')).toContain('forced-color-adjust: none;');
  });

  it('goes transparent while entering, exiting or stacked, and stops the transition under reduced motion, after it', () => {
    const css = rules();
    // A sheet's scrim keeps its color while it enters and exits, since its swipe keyframes fade it; stacked, it
    // goes transparent as every other scrim does.
    expect(
      blockAfter(
        css,
        '.overlay-scrim[data-stacked], .overlay-scrim:not(.sheet-scrim):is([data-entering], [data-exiting]) {',
      ),
    ).toContain('background-color: transparent;');
    const reduced = '@media (prefers-reduced-motion: reduce)';
    expect(blockAfter(blockAfter(css, reduced), '.overlay-scrim {')).toContain('transition: none;');
    expect(css.indexOf(reduced)).toBeGreaterThan(css.indexOf('transition: background-color'));
  });

  it("fits the scrim to a sheet's backdrop here, in a variant that outranks the shared rule, so no file order matters", () => {
    const css = rules();
    const variant = '.overlay-scrim.sheet-scrim {';
    // Two classes against one: the variant wins by specificity, whichever file the browser reads first.
    const fitted = blockAfter(css, variant);
    for (const declaration of ['z-index: auto;', 'height: auto;', 'transition: none;']) {
      expect(fitted, declaration).toContain(declaration);
    }
    // And by order inside this one file, after the rule it fits.
    expect(css.indexOf(variant)).toBeGreaterThan(css.indexOf('} .overlay-scrim {'));
    // The scrim's color is written once, here, in all the component files.
    const formula = 'color-mix(in srgb, var(--color-scrim) calc(var(--opacity-scrim) * 100%), transparent)';
    const written = components.flatMap((file) =>
      closeUp(stripComments(read(`src/components/${file}`)))
        .split(formula)
        .slice(1)
        .map(() => file),
    );
    expect(written).toEqual(['overlay.css']);
  });
});

describe('src/components/dialog.css', () => {
  // The rules without their comments, with their whitespace closed up. A header that is the start of a longer
  // one (`.dialog {` and `.dialog-head {`) is looked up with the "} " of the rule before it.
  const rules = () => closeUp(stripComments(read('src/components/dialog.css')));

  it('places the close button with two classes, so the icon button position never wins by load order', () => {
    // The icon button is position: relative for its hit area, in a rule of one class.
    expect(blockAfter(rules(), '.icon-button.dialog-close {')).toContain('position: absolute;');
    expect(rules()).not.toMatch(/(^|[\s}])\.dialog-close \{/);
  });

  it('reserves the close button height beside the head, so a compact one reserves 36px', () => {
    expect(blockAfter(rules(), '.dialog-head-with-close {')).toContain(
      'padding-inline-end: var(--size-control);',
    );
  });

  it('centres the panel on the scrim, the overlay inset clear on every side', () => {
    const overlay = blockAfter(rules(), '.dialog-overlay {');
    expect(overlay).toContain('place-items: center;');
    expect(overlay).toContain('padding: var(--overlay-inset);');
    // The scrim's own rule sizes it by its border box, so the padding stays inside the viewport.
    expect(overlay).not.toContain('box-sizing');
  });

  it('caps the panel at 28rem, or 40rem at lg, and at the room the scrim leaves', () => {
    const css = rules();
    const panel = blockAfter(css, '.dialog {');
    expect(panel).toContain('width: min(28rem, 100%);');
    expect(panel).toContain('max-height: 100%;');
    // Without it, the scrim's row grows to the panel's content and 100% caps nothing.
    expect(panel).toContain('min-height: 0;');
    expect(blockAfter(css, ".dialog[data-size='lg'] {")).toContain('width: min(40rem, 100%);');
  });

  it('draws the panel in the four modal surface tokens, with 32px of padding', () => {
    const panel = blockAfter(rules(), '.dialog {');
    for (const declaration of [
      'background-color: var(--color-float);',
      '--holder-border: 1px;',
      'border: var(--holder-border) solid var(--color-hairline);',
      '--holder-radius: var(--radius-stadium);',
      'border-radius: var(--holder-radius);',
      'box-shadow: var(--shadow-dramatic);',
      '--holder-pad: var(--spacing-separate);',
      // The foot pads to the corner inset, so the last action clears the bottom curve on the column's edge.
      'padding: var(--holder-pad) var(--holder-pad) var(--holder-corner-inset);',
    ]) {
      expect(panel, declaration).toContain(declaration);
    }
  });

  it('rings no focus on the content React Aria focuses, and lets it shrink so the body can scroll', () => {
    const content = blockAfter(rules(), '.dialog-content {');
    expect(content).toContain('outline: none;');
    expect(content).toContain('min-height: 0;');
  });

  it('scrolls the body inside the panel, and only the body', () => {
    const body = blockAfter(rules(), '.dialog-body {');
    for (const declaration of ['min-height: 0;', 'overflow-y: auto;', 'overscroll-behavior: contain;']) {
      expect(body, declaration).toContain(declaration);
    }
  });

  it('rings the body in the focus ring tokens while it is the tab stop, with or without base.css', () => {
    const ring = blockAfter(rules(), '.dialog-body:focus-visible {');
    expect(ring).toContain('outline: var(--focus-ring-width) solid var(--focus-ring-color);');
    expect(ring).toContain('outline-offset: var(--focus-ring-offset);');
  });

  it('keeps the action row at its own height, aligned to the inline end', () => {
    const actions = blockAfter(rules(), '.dialog-actions {');
    expect(actions).toContain('justify-content: flex-end;');
    expect(actions).toContain('flex: none;');
  });

  it('tints the danger well with error at 14% and draws its icon in error', () => {
    const well = blockAfter(rules(), ".dialog[data-tone='danger'] .dialog-well {");
    expect(well).toContain('background-color: color-mix(in srgb, var(--color-error) 14%, transparent);');
    expect(well).toContain('color: var(--color-error);');
  });

  it('fades and rises 8px while entering and exiting, and stops moving under reduced motion, after it', () => {
    const css = rules();
    const moving = '.dialog:is([data-entering], [data-exiting]) {';
    const motion = blockAfter(css, moving);
    expect(motion).toContain('opacity: 0;');
    expect(motion).toContain('translate: 0 8px;');
    const reduced = '@media (prefers-reduced-motion: reduce)';
    expect(blockAfter(blockAfter(css, reduced), '.dialog {')).toContain('transition: none;');
    expect(css.indexOf(reduced)).toBeGreaterThan(css.indexOf(moving));
  });

  it('redraws the edge in CanvasText in forced colors, so the panel keeps its shape', () => {
    const forced = blockAfter(rules(), FORCED_COLORS);
    expect(blockAfter(forced, '.dialog {')).toContain('border-color: CanvasText;');
  });
});

describe('src/components/drawer.css', () => {
  // The rules without their comments, with their whitespace closed up. A header that is the start of a longer
  // one (`.drawer {` and `.drawer-overlay {`) is looked up with the "} " of the rule before it.
  const rules = () => closeUp(stripComments(read('src/components/drawer.css')));

  it('is imported after dialog.css', () => {
    const entry = read('src/styles.css');
    const at = (file) => entry.indexOf(`'./components/${file}'`);
    expect(at('dialog.css')).toBeGreaterThanOrEqual(0);
    expect(at('drawer.css')).toBeGreaterThan(at('dialog.css'));
  });

  it('stretches the panel down the scrim, the overlay inset clear on every side', () => {
    const overlay = blockAfter(rules(), '.drawer-overlay {');
    expect(overlay).toContain('align-items: stretch;');
    expect(overlay).toContain('padding: var(--overlay-inset);');
    // The scrim's own rule sizes it by its border box, so the padding stays inside the viewport.
    expect(overlay).not.toContain('box-sizing');
  });

  it('draws the panel 20rem wide at most, the full height, in the four modal surface tokens', () => {
    const panel = blockAfter(rules(), '} .drawer {');
    for (const declaration of [
      'display: flex;',
      'flex-direction: column;',
      'width: min(20rem, 100%);',
      'height: 100%;',
      // Without it, the scrim's row grows to a long list and 100% is the list's height, not the viewport's.
      'min-height: 0;',
      'background-color: var(--color-float);',
      '--holder-border: 1px;',
      'border: var(--holder-border) solid var(--color-hairline);',
      '--holder-radius: var(--radius-stadium);',
      'border-radius: var(--holder-radius);',
      'box-shadow: var(--shadow-dramatic);',
      'transition: translate 180ms ease;',
    ]) {
      expect(panel, declaration).toContain(declaration);
    }
  });

  it('sets the panel against its own side by data-side, on the physical axis the side names', () => {
    // The scrim carries the locale's dir, so a logical start or end would flip a resolved side back in right to
    // left: a start drawer, data-side right, would sit on the left and slide in from the right.
    const css = rules();
    expect(blockAfter(css, ".drawer[data-side='left'] {")).toContain('justify-self: left;');
    expect(blockAfter(css, ".drawer[data-side='right'] {")).toContain('justify-self: right;');
  });

  it('slides in and out from its own side, past the inset, by data-side', () => {
    const css = rules();
    expect(blockAfter(css, ".drawer[data-side='left']:is([data-entering], [data-exiting]) {")).toContain(
      'translate: calc(-100% - var(--overlay-inset)) 0;',
    );
    expect(blockAfter(css, ".drawer[data-side='right']:is([data-entering], [data-exiting]) {")).toContain(
      'translate: calc(100% + var(--overlay-inset)) 0;',
    );
  });

  it('pads the header, the body and the footer 24px, the footer to the corner inset and clear of the home indicator', () => {
    const css = rules();
    expect(blockAfter(css, '.drawer-header {')).toContain(
      'padding: var(--spacing-peer) var(--spacing-peer) 0;',
    );
    expect(blockAfter(css, '.drawer-body {')).toContain('padding: var(--spacing-peer);');
    expect(blockAfter(css, '.drawer-footer {')).toContain(
      'padding: 0 var(--holder-pad) calc(var(--holder-corner-inset) + env(safe-area-inset-bottom, 0px));',
    );
    // The close button lines its icon up with the padding edge.
    expect(blockAfter(css, '.drawer-close {')).toContain('margin-inline-end: -0.5rem;');
  });

  it('rings no focus on the content React Aria focuses, and scrolls the body inside the panel, and only the body', () => {
    const css = rules();
    const content = blockAfter(css, '.drawer-content {');
    expect(content).toContain('outline: none;');
    expect(content).toContain('min-height: 0;');
    const body = blockAfter(css, '.drawer-body {');
    for (const declaration of [
      'flex: 1 1 auto;',
      'min-height: 0;',
      'overflow-y: auto;',
      'overscroll-behavior: contain;',
      'overflow-wrap: anywhere;',
    ]) {
      expect(body, declaration).toContain(declaration);
    }
    expect(blockAfter(css, '.drawer-header {')).toContain('flex: none;');
    expect(blockAfter(css, '.drawer-footer {')).toContain('flex: none;');
  });

  it('rings the body inside its own box while it is the tab stop, and clips the panel to its corners', () => {
    const css = rules();
    // The body runs flush to the panel's sides, so an outset ring would cross the hairline.
    const ring = blockAfter(css, '.drawer-body:focus-visible {');
    expect(ring).toContain('outline: var(--focus-ring-width) solid var(--focus-ring-color);');
    expect(ring).toContain('outline-offset: calc(-1 * var(--focus-ring-width));');
    // With no footer the body's square corners meet the 40px curve; the panel keeps the ring and the
    // scrolling text inside it.
    expect(blockAfter(css, '} .drawer {')).toContain('overflow: clip;');
  });

  it('wraps a long word in the footer, as in the title and the body', () => {
    expect(blockAfter(rules(), '.drawer-footer {')).toContain('overflow-wrap: anywhere;');
  });

  it('centres the first line of the title on the close button, and only beside one', () => {
    expect(blockAfter(rules(), '.drawer-header:has(> .drawer-close) .drawer-title {')).toContain(
      'margin-block-start: calc((var(--size-control) - 1lh) / 2);',
    );
  });

  it('redraws the edge in CanvasText in forced colors, so the panel keeps its shape', () => {
    const forced = blockAfter(rules(), FORCED_COLORS);
    expect(blockAfter(forced, '.drawer {')).toContain('border-color: CanvasText;');
  });

  it('stops the slide under reduced motion, after it', () => {
    const css = rules();
    const reduced = '@media (prefers-reduced-motion: reduce)';
    expect(blockAfter(blockAfter(css, reduced), '.drawer {')).toContain('transition: none;');
    expect(css.indexOf(reduced)).toBeGreaterThan(css.indexOf('transition: translate 180ms ease;'));
    expect(css.indexOf(reduced)).toBeGreaterThan(
      css.indexOf(".drawer[data-side='right']:is([data-entering], [data-exiting]) {"),
    );
  });
});

describe('src/components/sheet.css', () => {
  // The rules without their comments, with their whitespace closed up. A header that is the start of a longer
  // one (`.sheet {` and `.sheet-overlay {`) is looked up with the "} " of the rule before it.
  const rules = () => closeUp(stripComments(read('src/components/sheet.css')));

  it('is imported after drawer.css', () => {
    const entry = read('src/styles.css');
    const at = (file) => entry.indexOf(`'./components/${file}'`);
    expect(at('drawer.css')).toBeGreaterThanOrEqual(0);
    expect(at('sheet.css')).toBeGreaterThan(at('drawer.css'));
  });

  it('lifts the overlay to the modal layer and leaves its position and its color alone', () => {
    // React Aria positions the overlay at the document's origin, the page's size, and places the sheet's
    // scroller at the page's scroll offset inside it: a fixed overlay drew the sheet off screen on a scrolled
    // page. The scrim is the backdrop's, so a color here would paint a second one under it.
    const overlay = blockAfter(rules(), '.sheet-overlay {');
    expect(overlay.trim()).toBe('z-index: var(--z-modal);');
  });

  it('draws the panel 36rem wide at most, up to 92% of the viewport, in float with the hairline and no shadow', () => {
    const panel = blockAfter(rules(), '} .sheet {');
    for (const declaration of [
      'display: flex;',
      'flex-direction: column;',
      'width: min(100%, 36rem);',
      'margin-inline: auto;',
      'background-color: var(--color-float);',
      '--holder-border: 1px;',
      'border: var(--holder-border) solid var(--color-hairline);',
    ]) {
      expect(panel, declaration).toContain(declaration);
    }
    // The consumer's 92%, in dvh, after a vh line for a browser that has no dvh.
    const vh = panel.indexOf('max-height: 92vh;');
    expect(vh).toBeGreaterThanOrEqual(0);
    expect(panel.indexOf('max-height: 92dvh;')).toBeGreaterThan(vh);
    // Its only free edge is the viewport's bottom, where a shadow shows nothing.
    expect(rules()).not.toMatch(/box-shadow\s*:/);
  });

  it('rounds the top two corners in the stadium radius and leaves the bottom square', () => {
    const panel = blockAfter(rules(), '} .sheet {');
    expect(panel).toContain('--holder-radius: var(--radius-stadium);');
    expect(panel).toContain('border-start-start-radius: var(--holder-radius);');
    expect(panel).toContain('border-start-end-radius: var(--holder-radius);');
    expect(panel).not.toMatch(/border-end-(start|end)-radius|border-radius\s*:/);
  });

  it('caps the content at 92% of the visual viewport React Aria writes, so the sheet shrinks over an on-screen keyboard', () => {
    const content = blockAfter(rules(), '.sheet-content {');
    expect(content).toContain('max-height: calc(var(--visual-viewport-height, 100dvh) * 0.92);');
    expect(content).toContain('min-height: 0;');
    expect(content).toContain('outline: none;');
  });

  it('takes no pointer on the content while the sheet slides in, so no list opens before focus moves in', () => {
    // React Aria hides the page and moves focus in only once the sheet has entered: a list opened during the
    // slide portals outside it and is made inert with focus in it. The rule names the content alone, so a press
    // lands on the sheet inside React Aria's scroller and a swipe still moves it.
    const css = rules();
    expect(blockAfter(css, '.sheet-overlay[data-entering] .sheet-content {').trim()).toBe(
      'pointer-events: none;',
    );
    expect(css.match(/pointer-events\s*:/g)).toHaveLength(1);
  });

  it('draws the grabber 40px by 4px in boundary, as a dot, centred in a 44px band', () => {
    const css = rules();
    const band = blockAfter(css, '.sheet-grabber-band {');
    expect(band).toContain('height: 44px;');
    expect(band).toContain('place-items: center;');
    const grabber = blockAfter(css, '} .sheet-grabber {');
    for (const declaration of [
      'width: 40px;',
      'height: 4px;',
      'border-radius: var(--radius-dot);',
      'background-color: var(--color-boundary);',
    ]) {
      expect(grabber, declaration).toContain(declaration);
    }
  });

  it('pads the header 24px at the sides, and at the top too when no grabber band is above it', () => {
    const css = rules();
    expect(blockAfter(css, '.sheet-header {')).toContain('padding-inline: var(--spacing-peer);');
    expect(blockAfter(css, '.sheet-header:first-child {')).toContain(
      'padding-block-start: var(--spacing-peer);',
    );
    // The icon of the close button lines up with the padding edge, and the title's first line with the button.
    expect(blockAfter(css, '.sheet-close {')).toContain('margin-inline-end: -0.5rem;');
    expect(blockAfter(css, '.sheet-header:has(> .sheet-close) .sheet-title {')).toContain(
      'margin-block-start: calc((var(--size-control) - 1lh) / 2);',
    );
  });

  it('pads the body 24px and scrolls it once the sheet is fully open, and only the body', () => {
    const css = rules();
    const body = blockAfter(css, '.sheet-body {');
    for (const declaration of [
      'flex: 1 1 auto;',
      'min-height: 0;',
      'padding: var(--spacing-peer);',
      'overflow-wrap: anywhere;',
    ]) {
      expect(body, declaration).toContain(declaration);
    }
    // A swipe the body cannot take goes on to React Aria's scroller, which moves the sheet: contain would stop
    // it at the body, and a swipe down a short body would never dismiss the sheet.
    expect(css).not.toMatch(/overscroll-behavior/);
    // At a partial stop a swipe on the content moves the sheet, so the body scrolls only at the full height.
    // Before that it clips, which makes no scroll container, so a long list neither paints over the footer
    // nor stretches React Aria's scroll range.
    expect(body).toContain('overflow-y: clip;');
    expect(blockAfter(css, '.sheet[data-expanded] .sheet-body {')).toContain('overflow-y: auto;');
    expect(blockAfter(css, '.sheet-grabber-band {')).toContain('flex: none;');
    expect(blockAfter(css, '.sheet-header {')).toContain('flex: none;');
    expect(blockAfter(css, '.sheet-footer {')).toContain('flex: none;');
  });

  it('keeps the last part clear of the home indicator, the body when there is no footer', () => {
    const css = rules();
    expect(blockAfter(css, '.sheet-body:last-child {')).toContain(
      'padding-block-end: calc(var(--spacing-peer) + env(safe-area-inset-bottom, 0px));',
    );
    expect(blockAfter(css, '.sheet-footer {')).toContain(
      'padding: var(--spacing-part) var(--spacing-peer) calc(var(--spacing-part) + env(safe-area-inset-bottom, 0px));',
    );
  });

  it('rings the body inside its own box while it is the tab stop', () => {
    // The body runs flush to the panel's sides, so an outset ring would cross the hairline.
    const ring = blockAfter(rules(), '.sheet-body:focus-visible {');
    expect(ring).toContain('outline: var(--focus-ring-width) solid var(--focus-ring-color);');
    expect(ring).toContain('outline-offset: calc(-1 * var(--focus-ring-width));');
  });

  it("overrides nothing of the shared scrim, which overlay.css fits to the backdrop, so the files' order never matters", () => {
    const css = rules();
    const reduced = '@media (prefers-reduced-motion: reduce)';
    const start = css.indexOf(reduced);
    const end = css.indexOf('{', start) + 1 + blockAfter(css, reduced).length + 1;
    // Outside the reduced-motion block no rule names the backdrop: a rule here at the shared rule's specificity
    // would hold only while overlay.css loads first, which a per-component import does not promise.
    expect(css.slice(0, start) + css.slice(end)).not.toMatch(/\.sheet-scrim\b/);
    // Nor does any rule name the shared scrim itself, by a descendant selector or alone.
    expect(css).not.toMatch(/\.overlay-scrim\b/);
    // Inside it, one important declaration, of a property the shared scrim never sets.
    expect(blockAfter(blockAfter(css, reduced), '.sheet-scrim {').trim()).toBe('animation: none !important;');
    expect(stripComments(read('src/components/overlay.css'))).not.toMatch(/(?<![\w-])animation/);
  });

  it('wraps a long word in the title, the description and the footer, as in the body', () => {
    const css = rules();
    for (const part of ['.sheet-title {', '.sheet-description {', '.sheet-footer {']) {
      expect(blockAfter(css, part), part).toContain('overflow-wrap: anywhere;');
    }
  });

  it('fades the backdrop in through sheet-scrim-fade, from transparent to the scrim', () => {
    const fade = blockAfter(rules(), '@keyframes sheet-scrim-fade {');
    expect(blockAfter(fade, 'from {')).toContain('opacity: 0;');
    expect(blockAfter(fade, 'to {')).toContain('opacity: 1;');
  });

  it('redraws the edge and the grabber in CanvasText in forced colors', () => {
    const forced = blockAfter(rules(), FORCED_COLORS);
    expect(blockAfter(forced, '.sheet {')).toContain('border-color: CanvasText;');
    expect(blockAfter(forced, '.sheet-grabber {')).toContain('background-color: CanvasText;');
  });

  it('removes the backdrop animation under reduced motion, over the inline style React Aria writes, after it', () => {
    const css = rules();
    const reduced = '@media (prefers-reduced-motion: reduce)';
    // React Aria writes the swipe animation on the backdrop inline whatever the setting, so only an important
    // declaration outranks it.
    expect(blockAfter(blockAfter(css, reduced), '.sheet-scrim {')).toContain('animation: none !important;');
    expect(css.indexOf(reduced)).toBeGreaterThan(css.indexOf('@keyframes sheet-scrim-fade'));
  });
});

describe('src/components/popover.css', () => {
  // The rules without their comments, with their whitespace closed up. `.popover {` is the start of no longer
  // header, so the first match is the base rule, and the later ones sit inside the two media blocks.
  const rules = () => closeUp(stripComments(read('src/components/popover.css')));

  it('is imported after sheet.css', () => {
    const entry = read('src/styles.css');
    const at = (file) => entry.indexOf(`'./components/${file}'`);
    expect(at('sheet.css')).toBeGreaterThanOrEqual(0);
    expect(at('popover.css')).toBeGreaterThan(at('sheet.css'));
  });

  it('caps the width at the viewport less 2rem and scrolls inside the height React Aria leaves it', () => {
    const popover = blockAfter(rules(), '.popover {');
    for (const declaration of [
      'box-sizing: border-box;',
      'max-width: calc(100vw - 2rem);',
      'max-height: inherit;',
      'overflow: auto;',
    ]) {
      expect(popover, declaration).toContain(declaration);
    }
  });

  it('draws the float surface, the frame in both themes, and rings no focus on the container React Aria focuses', () => {
    const popover = blockAfter(rules(), '.popover {');
    for (const declaration of [
      '--holder-border: 1px;',
      'border: var(--holder-border) solid var(--color-frame);',
      '--holder-radius: var(--radius-surface);',
      'border-radius: var(--holder-radius);',
      'background-color: var(--color-float);',
      'box-shadow: var(--shadow-float);',
      'outline: none;',
    ]) {
      expect(popover, declaration).toContain(declaration);
    }
  });

  it('breaks a long word anywhere, so free content never scrolls the surface sideways', () => {
    expect(blockAfter(rules(), '.popover {')).toContain('overflow-wrap: anywhere;');
  });

  it('pads free content 24px, and only with popover-padded', () => {
    const css = rules();
    expect(blockAfter(css, '.popover-padded {')).toContain('--holder-pad: var(--spacing-peer);');
    expect(blockAfter(css, '.popover-padded {')).toContain('padding: var(--holder-pad);');
    expect(blockAfter(css, '.popover {')).not.toMatch(/(?<![\w-])padding/);
  });

  it("makes the trigger's width the minimum with popover-match-trigger, up to the viewport less 2rem", () => {
    expect(blockAfter(rules(), '.popover-match-trigger {')).toContain(
      'min-width: min(var(--trigger-width), 100vw - 2rem);',
    );
  });

  it('fades in and out over 140ms, sliding 4px from the side of the trigger it opened on', () => {
    const css = rules();
    expect(blockAfter(css, '.popover {')).toContain(
      'transition: opacity 140ms ease-out, translate 140ms ease-out;',
    );
    expect(blockAfter(css, '.popover:is([data-entering], [data-exiting]) {')).toContain('opacity: 0;');
    for (const [placement, translate] of [
      ['bottom', '0 -4px'],
      ['top', '0 4px'],
      ['right', '-4px 0'],
      ['left', '4px 0'],
    ]) {
      expect(
        blockAfter(css, `.popover[data-placement='${placement}']:is([data-entering], [data-exiting]) {`),
        placement,
      ).toContain(`translate: ${translate};`);
    }
  });

  it('redraws the frame in CanvasText in forced colors, so the surface keeps its shape', () => {
    const forced = blockAfter(rules(), FORCED_COLORS);
    expect(blockAfter(forced, '.popover {')).toContain('border-color: CanvasText;');
  });

  it('stops the motion under reduced motion, after it', () => {
    const css = rules();
    const reduced = '@media (prefers-reduced-motion: reduce)';
    expect(blockAfter(blockAfter(css, reduced), '.popover {')).toContain('transition: none;');
    expect(css.indexOf(reduced)).toBeGreaterThan(css.indexOf('transition: opacity 140ms ease-out'));
    expect(css.indexOf(reduced)).toBeGreaterThan(
      css.indexOf(".popover[data-placement='left']:is([data-entering], [data-exiting]) {"),
    );
  });
});

describe('src/components/menu.css', () => {
  // The rules without their comments, with their whitespace closed up. `.menu-item {` is the start of no
  // longer header before the coarse-pointer block, so the first match is the base row.
  const rules = () => closeUp(stripComments(read('src/components/menu.css')));
  const WASH = 'background-color: color-mix(in srgb, var(--color-ink) 5%, transparent);';

  it('draws the submenu chevron only under data-has-submenu, mirrored in right to left', () => {
    const css = rules();
    const outside = outsideForcedColors(css);
    const chevron = blockAfter(outside, '.menu-item-submenu {');
    expect(chevron).toContain('flex: none;');
    expect(chevron).toContain('color: var(--color-slate);');
    expect(blockAfter(outside, '.menu-item-submenu svg {')).toContain('width: 16px;');
    expect(blockAfter(outside, ":where([dir='rtl' i]) .menu-item-submenu svg {")).toContain('scale: -1 1;');
    // The row's room and its kept wash are for a row that opens a submenu alone, so no other row moves.
    expect(blockAfter(outside, '.menu-item[data-has-submenu] {')).toContain('padding-inline-end: 0.5rem;');
    expect(blockAfter(outside, '.menu-item[data-has-submenu][data-open] {')).toContain(WASH);
    for (const match of outside.matchAll(/([^{}]*)\{([^{}]*)\}/g)) {
      const [, selector = '', body = ''] = match;
      if (/padding|background-color/.test(body) && /data-open/.test(selector)) {
        expect(selector, selector).toContain('[data-has-submenu]');
      }
    }
    // Forced colors: the chevron follows its row, and the open row keeps an edge the repaint cannot take.
    const forced = blockAfter(css, FORCED_COLORS);
    expect(blockAfter(forced, '.menu-item-submenu {')).toContain('color: canvastext;');
    expect(blockAfter(forced, '.menu-item[data-disabled] .menu-item-submenu {')).toContain(
      'color: graytext;',
    );
    expect(blockAfter(forced, '.menu-item[data-has-submenu][data-open] {')).toContain(
      'outline: 1px solid canvastext;',
    );
  });

  it('is imported after popover.css', () => {
    const entry = read('src/styles.css');
    const at = (file) => entry.indexOf(`'./components/${file}'`);
    expect(at('popover.css')).toBeGreaterThanOrEqual(0);
    expect(at('menu.css')).toBeGreaterThan(at('popover.css'));
  });

  it('floors the popup at 12rem, or the trigger when it is wider, and never past the viewport less 2rem', () => {
    // A min-width beats a max-width, so the cap is written into the floor itself.
    expect(blockAfter(rules(), '.menu-popover {')).toContain(
      'min-width: min(max(var(--trigger-width), 12rem), 100vw - 2rem);',
    );
  });

  it('pads the list 8px with 4px between rows, and rings no focus on the list React Aria focuses', () => {
    const list = blockAfter(rules(), '.menu {');
    for (const declaration of [
      'padding: var(--spacing-part);',
      'gap: 0.25rem;',
      'outline: none;',
      'overflow: auto;',
    ]) {
      expect(list, declaration).toContain(declaration);
    }
  });

  it('makes the list the one scroller under the height cap: the popover is a column it fills and shrinks into', () => {
    const css = rules();
    const popover = blockAfter(css, '.menu-popover {');
    expect(popover).toContain('display: flex;');
    expect(popover).toContain('flex-direction: column;');
    const list = blockAfter(css, '.menu {');
    for (const declaration of ['box-sizing: border-box;', 'flex: 1 1 auto;', 'min-height: 0;']) {
      expect(list, declaration).toContain(declaration);
    }
    // Inheriting the cap would make the list 2px taller than the room inside the popover's border.
    expect(list).not.toContain('max-height');
  });

  it('draws a row 40px tall, padded 8px by 12px, concentric with the popup, with the pointer cursor', () => {
    const row = blockAfter(rules(), '.menu-item {');
    for (const declaration of [
      'min-height: 40px;',
      'padding: 0.5rem 0.75rem;',
      '--menu-item-radius: max(0px, calc(var(--radius-surface) - 1px - var(--spacing-part)));',
      'border-radius: var(--menu-item-radius);',
      'cursor: pointer;',
      'gap: 0.75rem;',
    ]) {
      expect(row, declaration).toContain(declaration);
    }
  });

  it('grows a row to 44px under a coarse pointer', () => {
    const coarse = blockAfter(rules(), '@media (pointer: coarse)');
    expect(blockAfter(coarse, '.menu-item {')).toContain('min-height: 44px;');
  });

  it('washes a hovered row only where hover exists, and a focused row everywhere, in the 5% ink wash', () => {
    const css = rules();
    const hover = blockAfter(css, '@media (hover: hover)');
    expect(blockAfter(hover, '.menu-item[data-hovered] {')).toContain(WASH);
    // Every data-hovered rule sits inside the hover block.
    const outside = css.replace(`@media (hover: hover) {${hover}}`, '');
    expect(outside).not.toContain('[data-hovered]');
    // Hover focuses the item, so the focused wash is outside it and carries touch and the keyboard.
    expect(blockAfter(outside, '.menu-item[data-focused] {')).toContain(WASH);
    expect(blockAfter(outside, '.menu-item[data-focused] .menu-item-icon {')).toContain(
      'color: var(--color-ink);',
    );
  });

  it('rings keyboard focus inset, and inverts the ring to canvas on the selected ink row', () => {
    const css = rules();
    const ring = blockAfter(css, '.menu-item[data-focus-visible] {');
    expect(ring).toContain('outline: var(--focus-ring-width) solid var(--focus-ring-color);');
    expect(ring).toContain('outline-offset: calc(-1 * var(--focus-ring-width));');
    expect(
      blockAfter(css, ".menu-item[data-selection-mode='single'][data-selected][data-focus-visible] {"),
    ).toContain('outline-color: var(--color-canvas);');
  });

  it('fills a single selection in ink and inverts its icon, check, end, description and key chip to canvas', () => {
    const css = rules();
    // A disabled row is never the pill: it keeps the disabled look and shows its choice by the check.
    const selected = ".menu-item[data-selection-mode='single'][data-selected]:not([data-disabled])";
    const fill = blockAfter(css, `${selected} {`);
    expect(fill).toContain('background-color: var(--color-ink);');
    expect(fill).toContain('color: var(--color-canvas);');
    expect(css).not.toContain(".menu-item[data-selection-mode='single'][data-selected] {");
    expect(blockAfter(css, `${selected} :is(.menu-item-icon, .menu-item-check, .menu-item-end) {`)).toContain(
      'color: var(--color-canvas);',
    );
    expect(blockAfter(css, `${selected} .menu-item-description {`)).toContain(
      'color: color-mix(in srgb, var(--color-canvas) 70%, transparent);',
    );
    const chip = blockAfter(css, `${selected} .menu-item-shortcut {`);
    expect(chip).toContain('background-color: color-mix(in srgb, var(--color-canvas) 20%, transparent);');
    expect(chip).toContain('color: var(--color-canvas);');
  });

  it('keeps the check room on every selectable row and shows the check on a selected one', () => {
    const css = rules();
    expect(blockAfter(css, '.menu-item-check {')).toContain('visibility: hidden;');
    expect(blockAfter(css, '.menu-item[data-selected] .menu-item-check {')).toContain('visibility: visible;');
  });

  it('draws a disabled row in taupe, with no wash and the not-allowed cursor', () => {
    const css = rules();
    const disabled = blockAfter(css, '.menu-item[data-disabled] {');
    for (const declaration of [
      'background-color: transparent;',
      'color: var(--color-taupe);',
      'cursor: not-allowed;',
    ]) {
      expect(disabled, declaration).toContain(declaration);
    }
    expect(
      blockAfter(
        css,
        '.menu-item[data-disabled] :is(.menu-item-icon, .menu-item-check, .menu-item-description, .menu-item-end, .menu-item-shortcut) {',
      ),
    ).toContain('color: var(--color-taupe);');
  });

  it('breaks a long word anywhere in the label and the description, which wrap at 320px inside or outside a popover', () => {
    const css = rules();
    expect(blockAfter(css, '.menu-item-label {')).toContain('overflow-wrap: anywhere;');
    expect(blockAfter(css, '.menu-item-description {')).toContain('overflow-wrap: anywhere;');
    expect(blockAfter(css, '.menu-item-text {')).toContain('min-width: 0;');
  });

  it('draws the end value as small ink tabular figures that keep their width, before the key', () => {
    const end = blockAfter(rules(), '.menu-item-end {');
    for (const declaration of [
      'flex: none;',
      'color: var(--color-ink);',
      'font-size: var(--text-small);',
      'font-variant-numeric: tabular-nums;',
    ]) {
      expect(end, declaration).toContain(declaration);
    }
  });

  it('reads the keys of a chip left to right in either direction, isolated from the row', () => {
    const chip = blockAfter(rules(), '.menu-item-shortcut {');
    expect(chip).toContain('direction: ltr;');
    expect(chip).toContain('unicode-bidi: isolate;');
  });

  it('draws a danger label and icon in the error color, focused or not', () => {
    const css = rules();
    expect(blockAfter(css, '.menu-item-danger {')).toContain('color: var(--color-error);');
    // A focused row turns its icon ink at a higher specificity, so the danger icon names the focused row too.
    expect(
      blockAfter(css, '.menu-item-danger .menu-item-icon, .menu-item-danger[data-focused] .menu-item-icon {'),
    ).toContain('color: var(--color-error);');
  });

  it('sets a section heading in the overline step, uppercase and slate', () => {
    const heading = blockAfter(rules(), '.menu-heading {');
    for (const declaration of [
      'font-size: var(--text-overline);',
      'letter-spacing: var(--text-overline--letter-spacing);',
      'font-weight: var(--text-overline--font-weight);',
      'text-transform: uppercase;',
      'color: var(--color-slate);',
    ]) {
      expect(heading, declaration).toContain(declaration);
    }
  });

  it('draws a separator as a 1px rule in the divider color', () => {
    const rule = blockAfter(rules(), '.menu-separator {');
    expect(rule).toContain('height: 1px;');
    expect(rule).toContain('background-color: var(--color-divider);');
  });

  it('draws a selected row in Highlight with every part in HighlightText, and a disabled one in GrayText, in forced colors', () => {
    const css = rules();
    const forced = blockAfter(css, FORCED_COLORS);
    const parts = ':is(.menu-item-icon, .menu-item-check, .menu-item-description, .menu-item-end)';
    const chosen = '.menu-item[data-selection-mode][data-selected]:not([data-disabled])';
    // As specific as the single row's rules and after them, so they win: a color the repaint turns into
    // CanvasText, or a fill it turns into the page's own background, would hide the choice.
    expect(css.indexOf(FORCED_COLORS)).toBeGreaterThan(
      css.indexOf(
        ".menu-item[data-selection-mode='single'][data-selected]:not([data-disabled]) .menu-item-shortcut {",
      ),
    );
    const row = blockAfter(forced, `${chosen} {`);
    expect(row).toContain('background-color: Highlight;');
    expect(row).toContain('color: HighlightText;');
    expect(blockAfter(forced, `${chosen} ${parts} {`)).toContain('color: HighlightText;');
    expect(blockAfter(forced, `.menu-item ${parts} {`)).toContain('color: CanvasText;');
    // The key chip is an island that keeps its own pair on any row.
    const island = blockAfter(forced, `.menu-item-shortcut, ${chosen} .menu-item-shortcut {`);
    expect(island).toContain('background-color: canvas;');
    expect(island).toContain('color: CanvasText;');
    const disabled = blockAfter(
      forced,
      '.menu-item[data-disabled], .menu-item[data-disabled] :is(.menu-item-icon, .menu-item-check, .menu-item-description, .menu-item-end, .menu-item-shortcut) {',
    );
    expect(disabled).toContain('color: GrayText;');
    // GrayText comes after the chip's CanvasText, so a disabled chip is gray too.
    expect(forced.indexOf('color: GrayText;')).toBeGreaterThan(forced.indexOf('color: CanvasText;'));
  });

  it('animates nothing inside a menu', () => {
    expect(rules()).not.toMatch(/(?<![\w-])(?:transition|animation)\s*:/);
  });
});

describe('src/components/toast.css', () => {
  // The rules without their comments, with their whitespace closed up. `.toast {` is the start of no longer
  // header, so the first match is the base rule, and the later ones sit inside @starting-style and the two
  // media blocks.
  const rules = () => closeUp(stripComments(read('src/components/toast.css')));

  it('is imported after menu.css', () => {
    const entry = read('src/styles.css');
    const at = (file) => entry.indexOf(`'./components/${file}'`);
    expect(at('menu.css')).toBeGreaterThanOrEqual(0);
    expect(at('toast.css')).toBeGreaterThan(at('menu.css'));
  });

  it('keeps the polite status host in the page and out of sight', () => {
    const host = blockAfter(rules(), '.toast-status-host {');
    for (const declaration of [
      'position: absolute;',
      'width: 1px;',
      'height: 1px;',
      'overflow: hidden;',
      'clip-path: inset(50%);',
      'white-space: nowrap;',
    ]) {
      expect(host, declaration).toContain(declaration);
    }
    // Hidden by clipping, never removed: a live region that is not rendered announces nothing.
    expect(host).not.toMatch(/display\s*:\s*none|visibility\s*:\s*hidden/);
  });

  it('pins the status host to the start corner of its containing block, so it never adds to the page scroll', () => {
    // At its static position after the last block, the 1px host lengthens a page that fills the viewport.
    const host = blockAfter(rules(), '.toast-status-host {');
    expect(host).toContain('inset-block-start: 0;');
    expect(host).toContain('inset-inline-start: 0;');
  });

  it('fixes the region in the bottom end corner, the overlay inset in, above every modal', () => {
    const region = blockAfter(rules(), '.toast-region {');
    for (const declaration of [
      'position: fixed;',
      'inset-block-end: calc(var(--overlay-inset) + var(--toast-offset-block, 0px) + var(--save-bar-offset, 0px) + var(--upload-tray-offset, 0px));',
      'inset-inline-end: var(--overlay-inset);',
      'z-index: var(--z-toast);',
    ]) {
      expect(region, declaration).toContain(declaration);
    }
  });

  it('lifts the region above a sticky bar and the upload tray, the top of the bottom edge', () => {
    // The stack runs from the bottom up: the tab bar, a save bar or bulk-action bar, the tray, the toasts. Each
    // offset falls back to 0, so a page with none of them keeps the toasts 16px from the bottom.
    const end = blockAfter(rules(), '.toast-region {').match(/inset-block-end:\s*([^;]+);/)?.[1] ?? '';
    for (const offset of [
      'var(--toast-offset-block, 0px)',
      'var(--save-bar-offset, 0px)',
      'var(--upload-tray-offset, 0px)',
    ]) {
      expect(end, offset).toContain(offset);
    }
  });

  it('caps the region at 28rem and the viewport less 2rem, rings nothing on it and lets presses through around the toasts', () => {
    const region = blockAfter(rules(), '.toast-region {');
    for (const declaration of [
      'width: min(28rem, calc(100vw - 2rem));',
      'outline: none;',
      'pointer-events: none;',
    ]) {
      expect(region, declaration).toContain(declaration);
    }
  });

  it('stacks the list in reverse, so the newest sits nearest the corner, 8px apart, with no list marks', () => {
    const list = blockAfter(rules(), '.toast-list {');
    for (const declaration of [
      'display: flex;',
      'flex-direction: column-reverse;',
      'align-items: flex-end;',
      'gap: var(--spacing-part);',
      'margin: 0;',
      'padding: 0;',
      'list-style: none;',
    ]) {
      expect(list, declaration).toContain(declaration);
    }
  });

  it('takes presses on each toast and draws the float with the frame, the surface corner and the float shadow', () => {
    const toast = blockAfter(rules(), '.toast {');
    for (const declaration of [
      'pointer-events: auto;',
      'width: 100%;',
      '--holder-border: 1px;',
      'border: var(--holder-border) solid var(--color-frame);',
      '--holder-radius: var(--radius-surface);',
      'border-radius: var(--holder-radius);',
      'background-color: var(--color-float);',
      'box-shadow: var(--shadow-float);',
      '--holder-pad: 1rem;',
      'padding: var(--holder-pad) var(--spacing-peer);',
    ]) {
      expect(toast, declaration).toContain(declaration);
    }
  });

  it('draws a 4px stripe at the inline start in --toast-stripe, which is slate unless the tone sets it', () => {
    const toast = blockAfter(rules(), '.toast {');
    expect(toast).toContain('--toast-stripe: var(--color-slate);');
    expect(toast).toContain('border-inline-start: 4px solid var(--toast-stripe);');
    // The stripe follows the writing direction: nothing here names a physical side.
    expect(rules()).not.toMatch(/(?<![\w-])(?:left|right)\s*:|border-(?:left|right)/);
  });

  it('sets the stripe for success, warning and error, and leaves info on the slate base', () => {
    const css = rules();
    for (const [tone, token] of [
      ['success', '--color-success'],
      ['warning', '--color-warning'],
      ['error', '--color-error'],
    ]) {
      expect(blockAfter(css, `.toast[data-tone='${tone}'] {`), tone).toContain(
        `--toast-stripe: var(${token});`,
      );
    }
    expect(css).not.toContain("[data-tone='info']");
  });

  it('sets the title in the body step in ink and the description in the small step in slate, each breaking a long word anywhere', () => {
    const css = rules();
    const title = blockAfter(css, '.toast-title {');
    for (const declaration of [
      'font-size: var(--text-body);',
      'line-height: var(--text-body--line-height);',
      'font-weight: var(--text-body--font-weight);',
      'color: var(--color-ink);',
      'overflow-wrap: anywhere;',
    ]) {
      expect(title, declaration).toContain(declaration);
    }
    const description = blockAfter(css, '.toast-description {');
    for (const declaration of [
      'font-size: var(--text-small);',
      'line-height: var(--text-small--line-height);',
      'font-weight: var(--text-small--font-weight);',
      'color: var(--color-slate);',
      'overflow-wrap: anywhere;',
    ]) {
      expect(description, declaration).toContain(declaration);
    }
    // The text column may shrink below its longest word, so the word breaks instead of widening the stack.
    expect(blockAfter(css, '.toast-content {')).toContain('min-width: 0;');
  });

  it('rises 8px into place through @starting-style over 180ms, and leaves at once', () => {
    const css = rules();
    expect(blockAfter(css, '.toast {')).toContain('transition: opacity 180ms ease, translate 180ms ease;');
    const start = blockAfter(blockAfter(css, '@starting-style'), '.toast {');
    expect(start).toContain('opacity: 0;');
    expect(start).toContain('translate: 0 8px;');
    // React Aria's toast has no exit state: a closed toast is removed at once.
    expect(css).not.toContain('[data-exiting]');
    expect(css).not.toContain('[data-entering]');
  });

  it('rings a toast that keyboard focus reaches, in the focus ring token', () => {
    const ring = blockAfter(rules(), '.toast:is(:focus-visible, [data-focus-visible]) {');
    expect(ring).toContain('outline: var(--focus-ring-width) solid var(--focus-ring-color);');
    expect(ring).toContain('outline-offset: var(--focus-ring-offset);');
  });

  it('pulls the controls in by 8px at the block ends and up to 8px at the inline end, so the 40px dismiss does not grow a one-line toast', () => {
    const controls = blockAfter(rules(), '.toast-controls {');
    for (const declaration of [
      'flex: none;',
      'gap: var(--spacing-part);',
      'margin-block: -0.5rem;',
      // Never past the toast's corner inset: the dismiss stays clear of the end curve.
      'margin-inline-end: max(-0.5rem, calc(var(--holder-radius) - var(--holder-border) - var(--spacing-peer)));',
    ]) {
      expect(controls, declaration).toContain(declaration);
    }
  });

  it('redraws the frame in CanvasText in forced colors, so the words carry the tone', () => {
    const forced = blockAfter(rules(), FORCED_COLORS);
    expect(blockAfter(forced, '.toast {')).toContain('border-color: CanvasText;');
  });

  it('stops the rise under reduced motion, after it', () => {
    const css = rules();
    const reduced = '@media (prefers-reduced-motion: reduce)';
    expect(blockAfter(blockAfter(css, reduced), '.toast {')).toContain('transition: none;');
    expect(css.indexOf(reduced)).toBeGreaterThan(css.indexOf('transition: opacity 180ms ease'));
    expect(css.indexOf(reduced)).toBeGreaterThan(css.indexOf('@starting-style'));
  });
});

describe('src/components/command-palette.css', () => {
  // The rules without their comments, with their whitespace closed up. `.command-palette {` is the start of no
  // longer header, so the first match is the surface's own rule, and the later ones sit in the media blocks.
  const rules = () => closeUp(stripComments(read('src/components/command-palette.css')));
  const ACTIVE = '.command-palette-list .menu-item[data-focus-visible]';

  it('is imported after toast.css', () => {
    const entry = read('src/styles.css');
    const at = (file) => entry.indexOf(`'./components/${file}'`);
    expect(at('toast.css')).toBeGreaterThanOrEqual(0);
    expect(at('command-palette.css')).toBeGreaterThan(at('toast.css'));
  });

  it('anchors the surface 12vh from the top of the scrim, centred, the overlay inset clear at the sides and the bottom', () => {
    const overlay = blockAfter(rules(), '.command-palette-overlay {');
    expect(overlay).toContain('align-content: start;');
    expect(overlay).toContain('justify-items: center;');
    expect(overlay).toContain('padding: 12vh var(--overlay-inset) var(--overlay-inset);');
  });

  it('caps the surface at 40rem wide and at 35rem or the room under the anchor tall, a column that clips', () => {
    const surface = blockAfter(rules(), '.command-palette {');
    for (const declaration of [
      'width: min(40rem, 100%);',
      'max-height: min(35rem, calc(88dvh - 1rem));',
      'display: flex;',
      'flex-direction: column;',
      'overflow: hidden;',
    ]) {
      expect(surface, declaration).toContain(declaration);
    }
  });

  it('draws the surface in the float tokens: the frame edge, the surface corner, the float fill and shadow', () => {
    const surface = blockAfter(rules(), '.command-palette {');
    for (const declaration of [
      '--holder-border: 1px;',
      'border: var(--holder-border) solid var(--color-frame);',
      '--holder-radius: var(--radius-surface);',
      'border-radius: var(--holder-radius);',
      'background-color: var(--color-float);',
      'box-shadow: var(--shadow-float);',
    ]) {
      expect(surface, declaration).toContain(declaration);
    }
  });

  it('rules the field row off with the divider, and draws its focus line as a pseudo-element in the ring color', () => {
    const css = rules();
    const field = blockAfter(css, '.command-palette-field {');
    expect(field).toContain('border-block-end: 1px solid var(--color-divider);');
    expect(field).toContain('position: relative;');
    const line = blockAfter(css, '.command-palette-field::after {');
    expect(line).toContain('height: var(--focus-ring-width);');
    expect(line).toContain('inset-block-end: -1px;');
    expect(
      blockAfter(css, '.command-palette-field:has(.command-palette-input:focus-visible)::after {'),
    ).toContain('background-color: var(--focus-ring-color);');
    // The token-only rule forbids a literal shadow, so the only box-shadow is the surface's token.
    expect([...css.matchAll(/box-shadow:/g)]).toHaveLength(1);
  });

  it('draws the placeholder in slate at full opacity, an exception to the taupe placeholder rule', () => {
    const placeholder = blockAfter(rules(), '.command-palette-input::placeholder {');
    expect(placeholder).toContain('color: var(--color-slate);');
    expect(placeholder).toContain('opacity: 1;');
    expect(rules()).not.toContain('--color-taupe');
  });

  it('gives the body a floor, so the height holds while the text changes, and makes the list in it the one scroller', () => {
    const css = rules();
    const body = blockAfter(css, '.command-palette-body {');
    for (const declaration of [
      'display: flex;',
      'flex-direction: column;',
      'min-height: min(20rem, 50dvh);',
    ]) {
      expect(body, declaration).toContain(declaration);
    }
    expect(body).not.toContain('overflow');
    // The menu's own rule makes the list fill the body and shrink into it (flex: 1 1 auto; min-height: 0).
    const list = blockAfter(css, '.command-palette-list {');
    expect(list).toContain('overflow-y: auto;');
    expect(list).toContain('overscroll-behavior: contain;');
    expect(list).not.toContain('visible');
  });

  it('lets the key hints wrap, so translated words stay on the surface', () => {
    expect(blockAfter(rules(), '.command-palette-footer {')).toContain('flex-wrap: wrap;');
  });

  it('fills the keyboard-active row in ink with no ring, and inverts its icon, end value, description and key to canvas', () => {
    const css = rules();
    const row = blockAfter(css, `${ACTIVE} {`);
    expect(row).toContain('background-color: var(--color-ink);');
    expect(row).toContain('color: var(--color-canvas);');
    expect(row).toContain('outline: none;');
    expect(blockAfter(css, `${ACTIVE} :is(.menu-item-icon, .menu-item-end) {`)).toContain(
      'color: var(--color-canvas);',
    );
    expect(blockAfter(css, `${ACTIVE} .menu-item-description {`)).toContain(
      'color: color-mix(in srgb, var(--color-canvas) 70%, transparent);',
    );
    const chip = blockAfter(css, `${ACTIVE} .menu-item-shortcut {`);
    expect(chip).toContain('background-color: color-mix(in srgb, var(--color-canvas) 20%, transparent);');
    expect(chip).toContain('color: var(--color-canvas);');
    // The end value is the Menu's own part, so the palette draws none of its own.
    expect(css).not.toContain('.command-palette-end');
  });

  it('hides the key hints under a coarse pointer', () => {
    const coarse = blockAfter(rules(), '@media (pointer: coarse)');
    expect(blockAfter(coarse, '.command-palette-footer {')).toContain('display: none;');
  });

  it('restores the field outline and paints the active row and its parts in the system colors, in forced colors', () => {
    const css = rules();
    const forced = blockAfter(css, FORCED_COLORS);
    expect(blockAfter(forced, '.command-palette {')).toContain('border-color: CanvasText;');
    expect(blockAfter(forced, '.command-palette-input:focus-visible {')).toContain('outline: auto;');
    const row = blockAfter(forced, `${ACTIVE} {`);
    expect(row).toContain('background-color: Highlight;');
    expect(row).toContain('color: HighlightText;');
    expect(
      blockAfter(
        forced,
        `${ACTIVE} :is(.menu-item-icon, .menu-item-check, .menu-item-description, .menu-item-end) {`,
      ),
    ).toContain('color: HighlightText;');
    const chip = blockAfter(forced, `${ACTIVE} .menu-item-shortcut {`);
    expect(chip).toContain('background-color: canvas;');
    expect(chip).toContain('color: CanvasText;');
    // As specific as the ink rules and after them, so they win.
    expect(css.indexOf(FORCED_COLORS)).toBeGreaterThan(css.indexOf(`${ACTIVE} .menu-item-shortcut {`));
  });

  it('fades and rises 8px while entering and exiting, and stops moving under reduced motion, after it', () => {
    const css = rules();
    const moving = '.command-palette:is([data-entering], [data-exiting]) {';
    const motion = blockAfter(css, moving);
    expect(motion).toContain('opacity: 0;');
    expect(motion).toContain('translate: 0 8px;');
    const reduced = '@media (prefers-reduced-motion: reduce)';
    expect(blockAfter(blockAfter(css, reduced), '.command-palette {')).toContain('transition: none;');
    expect(css.indexOf(reduced)).toBeGreaterThan(css.indexOf(moving));
  });
});

describe('src/components/tooltip.css', () => {
  // The rules without their comments, with their whitespace closed up. `.tooltip {` is the start of no longer
  // header, so the first match is the tip's own rule, and the later ones sit inside the two media blocks.
  const rules = () => closeUp(stripComments(read('src/components/tooltip.css')));

  it('is the last overlay file imported, right after command-palette.css, with only the shell, home, picker, filter, data, documents and settings files after it', () => {
    const entry = read('src/styles.css');
    const imported = [...entry.matchAll(/@import '\.\/components\/([^']+)';/g)].map((m) => m[1]);
    const tooltip = imported.indexOf('tooltip.css');
    expect(imported[tooltip - 1]).toBe('command-palette.css');
    for (const file of imported.slice(tooltip + 1)) {
      expect([
        'app-shell.css',
        'sidebar.css',
        'tab-bar.css',
        'avatar.css',
        'stat-tile.css',
        'meter.css',
        'charts.css',
        'gauge.css',
        'month-grid.css',
        'search-field.css',
        'select.css',
        'combo-box.css',
        'multi-select.css',
        'tabs.css',
        'pagination.css',
        'number-field.css',
        'calendar.css',
        'date-range-picker.css',
        'filter-chip.css',
        'filter-bar.css',
        'empty-state.css',
        'skeleton.css',
        'data-table.css',
        'side-panel.css',
        'progress-bar.css',
        'file-drop-zone.css',
        'upload-tray.css',
        'date-picker.css',
        'save-bar.css',
        'page-header.css',
        'breadcrumbs.css',
        'copy-button.css',
        'field-extras.css',
        'repeater.css',
        'panel-layout.css',
        'account-menu.css',
      ]).toContain(file);
    }
  });

  it('draws the ink tip with canvas text, a transparent 1px border, the micro corner and the float shadow', () => {
    const tip = blockAfter(rules(), '.tooltip {');
    for (const declaration of [
      'background-color: var(--color-ink);',
      'color: var(--color-canvas);',
      'border: 1px solid transparent;',
      'border-radius: var(--radius-micro);',
      'box-shadow: var(--shadow-float);',
    ]) {
      expect(tip, declaration).toContain(declaration);
    }
  });

  it('caps its width at 20rem or the viewport less 2rem, and breaks a long word anywhere', () => {
    const tip = blockAfter(rules(), '.tooltip {');
    expect(tip).toContain('max-width: min(20rem, calc(100vw - 2rem));');
    expect(tip).toContain('overflow-wrap: anywhere;');
  });

  it('sets its text in the small step, padded 6px by 10px', () => {
    const tip = blockAfter(rules(), '.tooltip {');
    for (const declaration of [
      'font-size: var(--text-small);',
      'line-height: var(--text-small--line-height);',
      'font-weight: var(--text-small--font-weight);',
      'padding: 0.375rem 0.625rem;',
    ]) {
      expect(tip, declaration).toContain(declaration);
    }
  });

  it('fades in and out over 140ms, sliding 4px toward the trigger from the side it opened on', () => {
    const css = rules();
    expect(blockAfter(css, '.tooltip {')).toContain(
      'transition: opacity 140ms ease-out, translate 140ms ease-out;',
    );
    expect(blockAfter(css, '.tooltip:is([data-entering], [data-exiting]) {')).toContain('opacity: 0;');
    for (const [placement, translate] of [
      ['top', '0 4px'],
      ['bottom', '0 -4px'],
      ['left', '4px 0'],
      ['right', '-4px 0'],
    ]) {
      expect(
        blockAfter(css, `.tooltip[data-placement='${placement}']:is([data-entering], [data-exiting]) {`),
        placement,
      ).toContain(`translate: ${translate};`);
    }
  });

  it('draws an 8px arrow filled in ink, pointing down, and turns it for the other three sides', () => {
    const css = rules();
    const arrow = blockAfter(css, '.tooltip-arrow svg {');
    for (const declaration of ['display: block;', 'width: 8px;', 'height: 8px;', 'fill: var(--color-ink);']) {
      expect(arrow, declaration).toContain(declaration);
    }
    for (const [placement, turn] of [
      ['bottom', '180deg'],
      ['left', '-90deg'],
      ['right', '90deg'],
    ]) {
      expect(blockAfter(css, `.tooltip-arrow[data-placement='${placement}'] svg {`), placement).toContain(
        `rotate: ${turn};`,
      );
    }
    // Pointing down is the svg's own shape, so the top placement needs no rule.
    expect(css).not.toContain(".tooltip-arrow[data-placement='top']");
  });

  it('draws the key chip in canvas at 20% over ink, in the 12px overline look, after a logical gap', () => {
    const chip = blockAfter(rules(), '.tooltip-shortcut {');
    for (const declaration of [
      'background-color: color-mix(in srgb, var(--color-canvas) 20%, transparent);',
      'color: var(--color-canvas);',
      'border-radius: var(--radius-micro);',
      'margin-inline-start: 0.5rem;',
      'font-size: 0.75rem;',
      'letter-spacing: var(--text-overline--letter-spacing);',
      'font-weight: var(--text-overline--font-weight);',
      'font-variant-numeric: tabular-nums;',
      'white-space: nowrap;',
    ]) {
      expect(chip, declaration).toContain(declaration);
    }
  });

  it("keeps the chip's gap on the side facing the text in a right-to-left tip, where the chip itself is left to right", () => {
    const css = rules();
    expect(blockAfter(css, ".tooltip[dir='rtl'] .tooltip-shortcut {")).toContain('margin-inline: 0 0.5rem;');
    // After the chip's own rule, at a higher specificity, so it wins in any order.
    expect(css.indexOf(".tooltip[dir='rtl'] .tooltip-shortcut {")).toBeGreaterThan(
      css.indexOf('.tooltip-shortcut {'),
    );
  });

  it('hides the arrow and draws the border in CanvasText in forced colors, so the tip keeps a shape', () => {
    const forced = blockAfter(rules(), FORCED_COLORS);
    expect(blockAfter(forced, '.tooltip {')).toContain('border-color: CanvasText;');
    expect(blockAfter(forced, '.tooltip-arrow {')).toContain('display: none;');
  });

  it('stops the motion under reduced motion, after it', () => {
    const css = rules();
    const reduced = '@media (prefers-reduced-motion: reduce)';
    expect(blockAfter(blockAfter(css, reduced), '.tooltip {')).toContain('transition: none;');
    expect(css.indexOf(reduced)).toBeGreaterThan(css.indexOf('transition: opacity 140ms ease-out'));
    expect(css.indexOf(reduced)).toBeGreaterThan(
      css.indexOf(".tooltip[data-placement='right']:is([data-entering], [data-exiting]) {"),
    );
  });
});

describe('src/components/app-shell.css', () => {
  // The rules without their comments, with their whitespace closed up. `.app-shell {` and
  // `.app-shell[data-has-sidebar] {` first match the base rules, before the narrow block repeats the second.
  const rules = () => closeUp(stripComments(read('src/components/app-shell.css')));
  const NARROW = '@media (width < 1024px)';

  it('declares the offset and the reserve at 0px, and offsets by the rail token while there is a sidebar', () => {
    const css = rules();
    const shell = blockAfter(css, '.app-shell {');
    expect(shell).toContain('--app-shell-sidebar: 0px;');
    expect(shell).toContain('--app-shell-inset-block-end: 0px;');
    expect(blockAfter(css, '.app-shell[data-has-sidebar] {')).toContain(
      '--app-shell-sidebar: var(--container-sidebar);',
    );
  });

  it('reads both in the workspace, which moves its margin, and keeps the header sticky at the header layer', () => {
    const css = rules();
    const workspace = blockAfter(css, '.app-shell-workspace {');
    for (const declaration of [
      'box-sizing: border-box;',
      'min-height: 100dvh;',
      'margin-inline-start: var(--app-shell-sidebar);',
      'padding-block-end: var(--app-shell-inset-block-end);',
      'transition: margin-inline-start var(--duration-expand) var(--ease-emphasized);',
    ]) {
      expect(workspace, declaration).toContain(declaration);
    }
    // Closing takes the collapse duration, as the rail does, so the 16px between the rail and the page holds.
    expect(blockAfter(css, "[data-sidebar='collapsed' i] .app-shell-workspace {")).toBe(
      ' transition-duration: var(--duration-collapse); ',
    );
    const header = blockAfter(css, '.app-shell-header {');
    for (const declaration of ['position: sticky;', 'inset-block-start: 0;', 'z-index: var(--z-header);']) {
      expect(header, declaration).toContain(declaration);
    }
    expect(blockAfter(css, '.app-shell-main {')).toContain('outline: none;');
  });

  it("never pads the root's scroll for the header, which moved the page when focus landed in it (spec correction 121)", () => {
    expect(rules()).not.toMatch(/scroll-padding|app-shell-header-block-size/);
  });

  it('hides the skip link with the clip pattern, and draws it focused as an ink pill above the chrome', () => {
    const css = rules();
    const resting = blockAfter(css, '.app-shell-skip {');
    for (const declaration of [
      'position: absolute;',
      'width: 1px;',
      'height: 1px;',
      'margin: -1px;',
      'overflow: hidden;',
      'clip-path: inset(50%);',
      'white-space: nowrap;',
    ]) {
      expect(resting, declaration).toContain(declaration);
    }
    const focused = blockAfter(css, '.app-shell-skip:focus {');
    for (const declaration of [
      'position: fixed;',
      'inset-block-start: var(--spacing-inset);',
      'inset-inline-start: var(--spacing-inset);',
      'z-index: calc(var(--z-chrome) + 1);',
      'min-height: var(--size-target);',
      'padding-inline: 1.25rem;',
      'clip-path: none;',
      'border-radius: var(--radius-pill);',
      'background-color: var(--color-ink);',
      'color: var(--color-canvas);',
      'font-size: var(--text-action);',
      'outline: var(--focus-ring-width) solid var(--color-canvas);',
      'outline-offset: -4px;',
    ]) {
      expect(focused, declaration).toContain(declaration);
    }
  });

  it('drops the offset and reserves the tab bar under 1024px, the medium breakpoint written out', async () => {
    const css = rules();
    const narrow = blockAfter(css, NARROW);
    expect(blockAfter(narrow, '.app-shell[data-has-sidebar] {')).toContain('--app-shell-sidebar: 0px;');
    expect(blockAfter(narrow, '.app-shell[data-has-bottom-bar] {')).toContain(
      '--app-shell-inset-block-end: calc(4rem + env(safe-area-inset-bottom, 0px));',
    );
    // A media query cannot read a custom property, so the width is written out and must stay the token.
    const { tokens } = await import('../dist/tokens.js');
    const written = /@media \(width < (\d+px)\)/.exec(css)?.[1];
    expect(written).toBe(tokens.breakpoint.md.value);
  });

  it('moves the workspace at once while the rail is folded for a side panel', () => {
    // The panel and the fold land in one frame, so the content's width changes once (spec 10.3 amendment 1).
    expect(blockAfter(rules(), '.app-shell[data-sidebar-folded] .app-shell-workspace {')).toContain(
      'transition: none;',
    );
  });

  it("folds the rail from the server's HTML beside an open side panel, from 1024px to under 1440px", async () => {
    // The layout writes data-collapses-rail and the aside is in the server's HTML, so the fold needs no script.
    const css = rules();
    const FOLD_MEDIA = '@media (1024px <= width < 1440px)';
    const fold = blockAfter(css, FOLD_MEDIA);
    const shell =
      '.app-shell[data-has-sidebar]:has(.side-panel-layout[data-collapses-rail] > .side-panel):not([data-sidebar-unfolded])';
    // The collapsed width is the sidebar token's collapsed value, which only its attribute sets.
    const source = JSON.parse(read('tokens/tokens.json'));
    const collapsed = source.container.sidebar.$extensions['snapshot-ui'].sidebar.collapsed;
    expect(blockAfter(fold, `${shell} {`)).toContain(
      `--container-sidebar: ${String(collapsed.value)}${collapsed.unit};`,
    );
    expect(blockAfter(fold, `${shell} .app-shell-workspace {`)).toContain('transition: none;');
    // A media query cannot read a custom property, so both widths are written out and must stay the tokens.
    const { tokens } = await import('../dist/tokens.js');
    expect(FOLD_MEDIA).toBe(
      `@media (${tokens.breakpoint.md.value} <= width < ${tokens.breakpoint.lg.value})`,
    );
  });

  it('stops the margin moving under reduced motion, after the transition', () => {
    const css = rules();
    const reduced = '@media (prefers-reduced-motion: reduce)';
    expect(blockAfter(blockAfter(css, reduced), '.app-shell-workspace {')).toContain('transition: none;');
    expect(css.indexOf('transition: margin-inline-start var(--duration-expand)')).toBeGreaterThan(-1);
    expect(css.indexOf(reduced)).toBeGreaterThan(
      css.indexOf('transition: margin-inline-start var(--duration-expand)'),
    );
  });
});

describe('src/components/sidebar.css', () => {
  // The rules without their comments, with their whitespace closed up, so a selector Prettier breaks over
  // lines reads as one line.
  const rules = () => closeUp(stripComments(read('src/components/sidebar.css')));
  const WIDE = '@media (width >= 1024px)';
  const NARROW = '@media (width < 1024px)';
  const COLLAPSED = "[data-sidebar='collapsed' i]";
  /** Every part of the rail copy that moves, under `scope`: the selector a rule that stops them all names. */
  const movingSelector = (scope) =>
    [
      `${scope} .sidebar:not(.sidebar-drawer)`,
      `${scope} .sidebar:not(.sidebar-drawer) .sidebar-group-label::before`,
      `${scope} .sidebar:not(.sidebar-drawer) :is(${MOVING_PARTS.join(', ')})`,
    ].join(', ');

  it('fixes the rail 16px clear of the viewport, at the chrome layer, the rail token less its two insets wide', () => {
    const rail = blockAfter(rules(), '.sidebar {');
    for (const declaration of [
      'position: fixed;',
      'inset-block: var(--spacing-inset);',
      'inset-inline-start: var(--spacing-inset);',
      'z-index: var(--z-chrome);',
      'width: calc(var(--container-sidebar) - 2 * var(--spacing-inset));',
      'border: 1px solid var(--color-hairline);',
      'border-radius: var(--radius-stadium);',
      'background-color: var(--color-float);',
      'box-shadow: var(--shadow-lift);',
      'transition: width var(--sidebar-duration) var(--ease-emphasized);',
    ]) {
      expect(rail, declaration).toContain(declaration);
    }
  });

  it('clips the search shortcut when collapsed rather than removing it, so the search keeps its name', () => {
    const css = rules();
    const clip = css.slice(css.indexOf(`${COLLAPSED} .sidebar:not(.sidebar-drawer) :is(`));
    expect(clip.slice(0, clip.indexOf('{'))).toContain('.sidebar-search-shortcut');
    expect(css).not.toContain(`${COLLAPSED} .sidebar:not(.sidebar-drawer) .sidebar-search-shortcut {`);
  });

  it('centers a collapsed item inside the rail border, and outranks the icon button for the close button', () => {
    const css = rules();
    // The 72px rail less its two 1px edges is 70px: 15px a side leaves a 40px item centered. The nav pads by the
    // inset, which the collapsed rail sets, and so does the search pill.
    expect(blockAfter(css, '.sidebar-nav {')).toContain(
      'padding: var(--spacing-peer) var(--sidebar-nav-inset);',
    );
    const collapsedRail = blockAfter(blockAfter(css, WIDE), `${COLLAPSED} .sidebar:not(.sidebar-drawer) {`);
    expect(collapsedRail).toContain('--sidebar-nav-inset: calc(1rem - 1px);');
    expect(collapsedRail).toContain(
      '--sidebar-search-inset: calc((var(--sidebar-inner) - var(--size-target)) / 2);',
    );
    expect(blockAfter(css, '.icon-button.sidebar-close {')).toContain('margin-inline-start: auto;');
    expect(css).not.toMatch(/(^|[\s}])\.sidebar-(close|trigger) \{/);
  });

  it('moves every part on the emphasized curve, for the duration of the state it moves to', () => {
    const css = rules();
    const rail = blockAfter(css, '.sidebar {');
    expect(rail).toContain('--sidebar-duration: var(--duration-expand);');
    expect(rail).toContain(
      '--sidebar-inner: calc(var(--container-sidebar) - 2 * var(--spacing-inset) - 2px);',
    );
    expect(blockAfter(blockAfter(css, WIDE), `${COLLAPSED} .sidebar:not(.sidebar-drawer) {`)).toContain(
      ' --sidebar-duration: var(--duration-collapse);',
    );
    // Every transition the rail draws reads the rail's duration and the one curve: none is written in milliseconds,
    // and none eases on its own, so no two properties fight on the way. The drawer copy and the fold move nothing.
    const transitions = [...css.matchAll(/transition: ([^;]+);/g)].map((match) => match[1]);
    const moving = transitions.filter((value) => value !== 'none');
    expect(moving.length).toBeGreaterThan(6);
    for (const value of moving) {
      expect(value).not.toMatch(/\d(ms|s)\b/);
      for (const part of value.split(/,(?![^(]*\))/)) {
        expect(part, value).toContain('var(--ease-emphasized)');
        expect(part, value).toContain('var(--sidebar-duration)');
      }
    }
    // The labels come back late in the opening and leave early in the closing.
    const LABELS =
      ':is(.sidebar-brand-name, .sidebar-search-label, .sidebar-group-text, .sidebar-item-label, .sidebar-item-count-number, .sidebar-search-shortcut)';
    expect(blockAfter(css, `.sidebar:not(.sidebar-drawer) ${LABELS} {`)).toContain(
      'transition: opacity calc(var(--sidebar-duration) / 2) var(--ease-emphasized) calc(var(--sidebar-duration) / 4);',
    );
    const hidden = blockAfter(css, `${COLLAPSED} .sidebar:not(.sidebar-drawer) ${LABELS} {`);
    expect(hidden).toContain('opacity: 0;');
    expect(hidden).toContain(
      'transition: opacity calc(var(--sidebar-duration) * 0.4) var(--ease-emphasized);',
    );
    // Hidden by opacity in the flow, never taken out of it, so no row changes height as the rail collapses.
    expect(hidden).not.toContain('position: absolute');
  });

  it('never re-centers a collapsed part, so nothing jumps to the middle of the rail while it narrows', () => {
    const collapsed = [...blockAfter(rules(), WIDE).matchAll(/([^{}]+)\{([^{}]*)\}/g)]
      .filter((match) => match[1].trim().startsWith(COLLAPSED) && !match[1].includes('.sidebar-footer'))
      .map((match) => match[2]);
    expect(collapsed.length).toBeGreaterThan(8);
    for (const body of collapsed) {
      expect(body).not.toContain('justify-content: center');
      expect(body).not.toMatch(/margin-inline: auto/);
      expect(body).not.toMatch(/(?<![\w-])width: var\(--size-target\)/);
    }
  });

  it('keeps every label on one line below the expanded width, the token less its insets and edges', () => {
    const css = rules();
    const source = JSON.parse(read('tokens/tokens.json'));
    const { value, unit } = source.container.sidebar.$value;
    const inset = source.spacing.inset.$value;
    // Measured inside the rail's two 1px edges.
    const query = `@container sidebar (width < calc(${String(value)}${unit} - ${String(2 * inset.value + 2)}${inset.unit}))`;
    expect(css).toContain(query);
    const narrow = blockAfter(css, query);
    expect(
      blockAfter(
        narrow,
        '.sidebar:not(.sidebar-drawer) :is(.sidebar-head, .sidebar-search, .sidebar-nav, .sidebar-footer) {',
      ),
    ).toBe(' white-space: nowrap; ');
    expect(blockAfter(blockAfter(css, WIDE), '.sidebar:not(.sidebar-drawer) {')).toBe(
      ' container: sidebar / inline-size; ',
    );
    // The list's one column never grows past the nav for a label that does not wrap.
    expect(blockAfter(css, '.sidebar-list {')).toContain('grid-template-columns: minmax(0, 1fr);');
  });

  it('steps at once under reduced motion: no duration for any part, and no transition on the rail', () => {
    const css = rules();
    const reduced = blockAfter(css, '@media (prefers-reduced-motion: reduce)');
    expect(blockAfter(reduced, `.sidebar, ${COLLAPSED} .sidebar:not(.sidebar-drawer) {`)).toBe(
      ' --sidebar-duration: 0s; ',
    );
    expect(blockAfter(reduced, '.sidebar, .sidebar-collapse svg {')).toBe(' transition: none; ');
    expect(css.lastIndexOf('@media (prefers-reduced-motion: reduce)')).toBeGreaterThan(
      css.lastIndexOf('--sidebar-duration: var(--duration-collapse);'),
    );
  });

  it('draws every rounded part inside the rail concentric with it: its corner less the gap, never past its own', () => {
    const css = rules();
    expect(blockAfter(css, '.sidebar {')).toContain('--sidebar-corner: calc(var(--radius-stadium) - 1px);');
    // A nav item and the search pill: the rail's corner less its edge and their inset, at most a pill, square at 0.
    expect(blockAfter(css, '.sidebar-item {')).toContain(
      'border-radius: min(var(--radius-pill), max(0px, calc(var(--sidebar-corner) - var(--sidebar-nav-inset))));',
    );
    const search = blockAfter(css, '.sidebar-search {');
    expect(search).toContain(
      '--sidebar-search-corner: min(var(--radius-pill), max(0px, calc(var(--sidebar-corner) - var(--sidebar-search-inset))));',
    );
    expect(search).toContain('margin: var(--spacing-part) var(--sidebar-search-inset) 0;');
    expect(search).toContain('border-radius: var(--sidebar-search-corner);');
    // One level further in, the key chip: the search's corner less its 1px edge and its padding, at most a chip.
    expect(blockAfter(css, '.kbd.sidebar-search-shortcut {')).toBe(
      ' border-radius: min(var(--radius-micro), max(0px, calc(var(--sidebar-search-corner) - 1px - var(--sidebar-pill-inset)))); ',
    );
    // No rounded part in the rail copies a token outright, except the shapes that keep theirs: the rail itself, the
    // collapse button outside its edge, and the dots.
    const copied = [...css.matchAll(/([^{}]+)\{[^{}]*border-radius: var\(--radius-(\w+)\);/g)].map(
      (match) => `${match[1].trim()} ${match[2]}`,
    );
    for (const each of copied) expect(each).toMatch(/^(\.sidebar|\.sidebar-collapse) (stadium|pill)$|dot$/);
  });

  it('declares the four rail constants as written', () => {
    const rail = blockAfter(rules(), '.sidebar {');
    for (const declaration of [
      '--sidebar-icon: 1.25rem;',
      '--sidebar-gutter: 0.75rem;',
      '--sidebar-pill-inset: calc((var(--size-target) - var(--sidebar-icon)) / 2);',
      '--sidebar-row: max(var(--size-target), var(--size-control));',
    ]) {
      expect(rail, declaration).toContain(declaration);
    }
  });

  it('moves the rail copy and every part that moves with it at once while it is folded for a side panel', () => {
    expect(blockAfter(rules(), `${movingSelector('[data-sidebar-folded]')} {`)).toBe(' transition: none; ');
  });

  it('copies every collapsed rule into the side panel fold, with the same declarations, under 1440px', async () => {
    // A selector cannot carry a media condition, so the fold's rules are a copy: each collapsed rule's selector
    // with the fold's element in the collapsed attribute's place, and the same declarations, in the same order.
    const css = rules();
    const FOLD =
      '[data-has-sidebar]:where(.app-shell:has(.side-panel-layout[data-collapses-rail] > .side-panel):not([data-sidebar-unfolded]))';
    /** The rules of a block with no nested block in it, as [selector, declarations] pairs. */
    const pairs = (block) =>
      [...block.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map((match) => [match[1].trim(), match[2].trim()]);
    const collapsedOf = (block) => pairs(block).filter(([selector]) => selector.startsWith(COLLAPSED));
    const foldOf = (block) =>
      pairs(block)
        .filter(([selector]) => selector.startsWith(FOLD))
        .map(([selector, body]) => [selector.split(FOLD).join(COLLAPSED), body]);
    const foldBlock = blockAfter(css, '@media (1024px <= width < 1440px)');
    const copies = foldOf(foldBlock).filter(([, body]) => body !== 'transition: none;');
    expect(collapsedOf(blockAfter(css, WIDE))).toHaveLength(13);
    expect(copies).toEqual(collapsedOf(blockAfter(css, WIDE)));
    // The forced-colors pair too, under 1440px only.
    const forced = css.split('@media (forced-colors: active) {')[1] ?? '';
    const forcedFold = blockAfter(css, '@media (forced-colors: active) and (width < 1440px)');
    expect(foldOf(forcedFold)).toEqual(collapsedOf(blockAfter(`{${forced}`, '{')));
    expect(foldOf(forcedFold)).toHaveLength(2);
    // It moves at once, as the scripted fold does.
    expect(blockAfter(foldBlock, `${movingSelector(FOLD)} {`)).toBe(' transition: none; ');
    const { tokens } = await import('../dist/tokens.js');
    expect(css).toContain(`@media (${tokens.breakpoint.md.value} <= width < ${tokens.breakpoint.lg.value})`);
    expect(css).toContain(`@media (forced-colors: active) and (width < ${tokens.breakpoint.lg.value})`);
  });

  it('scopes every collapsed rule to the rail copy, so the drawer copy never collapses', () => {
    const css = rules();
    const occurrences = [...css.matchAll(/\[data-sidebar='collapsed' i\]/g)];
    expect(occurrences.length).toBeGreaterThan(5);
    for (const match of occurrences) {
      const after = css.slice(match.index + COLLAPSED.length, match.index + COLLAPSED.length + 30);
      expect(after).toMatch(/^ \.sidebar:not\(\.sidebar-drawer\)/);
    }
  });

  it('hides the rail copy under 1024px and the trigger from 1024px up, the medium breakpoint written out', async () => {
    const css = rules();
    expect(blockAfter(blockAfter(css, NARROW), '.sidebar:not(.sidebar-drawer) {')).toContain(
      'display: none;',
    );
    expect(blockAfter(blockAfter(css, WIDE), '.icon-button.sidebar-trigger {')).toContain('display: none;');
    // A media query cannot read a custom property, so the width is written out and must stay the token.
    const { tokens } = await import('../dist/tokens.js');
    const written = [...css.matchAll(/@media \(width [<>]=? (\d+px)\)/g)].map((match) => match[1]);
    expect(written).toHaveLength(2);
    for (const width of written) expect(width).toBe(tokens.breakpoint.md.value);
  });

  it('washes an item and the search pill on hover only with a hover pointer, never on the current item', () => {
    const css = rules();
    // Every hover block in the file: the collapse button, the search pill and the items have one each.
    const hover = css
      .split('@media (hover: hover)')
      .slice(1)
      .map((rest) => blockAfter(`@media (hover: hover)${rest}`, '@media (hover: hover)'))
      .join(' ');
    expect(hover).toContain('.sidebar-search:is(:hover, [data-hovered]) {');
    const itemHover = ".sidebar-item:is(:hover, [data-hovered]):not([aria-current='page'], [data-current]) {";
    expect(blockAfter(hover, itemHover)).toContain(
      'background-color: color-mix(in srgb, var(--color-ink) 5%, transparent);',
    );
    // Outside the media block, no rule hovers an item.
    const outside = css.replace(/@media \(hover: hover\) \{(?:[^{}]*\{[^{}]*\})*[^{}]*\}/g, '');
    expect(outside).not.toMatch(/\.sidebar-item:is\(:hover/);
    expect(outside).not.toMatch(/\.sidebar-search:is\(:hover/);
    // The current rule comes after the hover rule, so it holds under the pointer.
    const current = ".sidebar-item:is([aria-current='page'], [data-current]) {";
    const currentBlock = blockAfter(css, current);
    expect(currentBlock).toContain('background-color: var(--color-ink);');
    expect(currentBlock).toContain('color: var(--color-canvas);');
    expect(css.indexOf(current)).toBeGreaterThan(css.indexOf(itemHover));
  });

  it('rings a focused item outside it in the focus ring token, never in ink and never inset', () => {
    const ringed = blockAfter(rules(), '.sidebar-item:is(:focus-visible, [data-focus-visible]) {');
    expect(ringed).toContain('outline: var(--focus-ring-width) solid var(--focus-ring-color);');
    expect(ringed).toContain('outline-offset: var(--focus-ring-offset);');
    expect(ringed).not.toMatch(INK_RING);
    expect(ringed).not.toContain('calc(-1');
  });

  it('draws an item one row tall, and a group label in the overline step with its 25% ink dot', () => {
    const css = rules();
    expect(blockAfter(css, '.sidebar-item {')).toContain('min-height: var(--sidebar-row);');
    expect(blockAfter(css, '.sidebar-group-label {')).toContain('font-size: var(--text-overline);');
    expect(blockAfter(css, '.sidebar-group-label::before {')).toContain(
      'background-color: color-mix(in srgb, var(--color-ink) 25%, transparent);',
    );
    expect(blockAfter(css, '.sidebar-group[data-current] .sidebar-group-label::before {')).toContain(
      'background-color: var(--color-signal-light);',
    );
  });

  it('turns a collapsed count into an 8px ink dot, canvas on the current item', () => {
    const wide = blockAfter(rules(), WIDE);
    const dot = blockAfter(wide, `${COLLAPSED} .sidebar:not(.sidebar-drawer) .sidebar-item-count {`);
    for (const declaration of [
      'position: absolute;',
      'inset-block-start: calc((var(--sidebar-row) - var(--sidebar-icon)) / 2 - 0.25rem);',
      'inset-inline-start: calc(var(--sidebar-pill-inset) + var(--sidebar-icon) - 0.25rem);',
      'width: 0.5rem;',
      'height: 0.5rem;',
      'margin: 0;',
      'overflow: hidden;',
      'border-radius: var(--radius-dot);',
      'background-color: var(--color-ink);',
    ]) {
      expect(dot, declaration).toContain(declaration);
    }
    expect(
      blockAfter(
        wide,
        `${COLLAPSED} .sidebar:not(.sidebar-drawer) .sidebar-item:is([aria-current='page'], [data-current]) .sidebar-item-count {`,
      ),
    ).toContain('background-color: var(--color-canvas);');
  });

  it("restyles the drawer copy and the Drawer's body only, and never the Drawer's header", () => {
    const css = rules();
    const copy = blockAfter(css, '.sidebar-drawer {');
    for (const declaration of [
      'position: static;',
      'inset: auto;',
      'width: auto;',
      'border: 0;',
      'border-radius: 0;',
      'background-color: transparent;',
      'box-shadow: none;',
    ]) {
      expect(copy, declaration).toContain(declaration);
    }
    expect(css.match(/\.sidebar-drawer-panel \.drawer-body \{/g)).toHaveLength(1);
    expect(blockAfter(css, '.sidebar-drawer-panel .drawer-body {')).toContain('padding: 0;');
    // The shipped Drawer draws no header with a hidden title and no close button, and the drawer page leaves
    // the header out of what a class on the panel may restyle.
    expect(css).not.toContain('.drawer-header');
  });

  it('draws the comma a name needs at no size, inline', () => {
    const comma = blockAfter(rules(), '.sidebar-comma {');
    expect(comma).toContain('font-size: 0;');
    // A hidden box would get a space at its edge in a browser's name: the comma stays inline.
    expect(comma).not.toContain('position');
    expect(comma).not.toContain('display');
  });

  it('mirrors the chevron in right to left', () => {
    expect(blockAfter(rules(), "[dir='rtl'] .sidebar-collapse svg {")).toContain('scale: -1 1;');
  });

  it('draws the current item in Highlight and the dots in CanvasText and Highlight in forced colors', () => {
    const forced = blockAfter(rules(), FORCED_COLORS);
    const current = blockAfter(forced, ".sidebar-item:is([aria-current='page'], [data-current]) {");
    expect(current).toContain('background-color: Highlight;');
    expect(current).toContain('color: HighlightText;');
    expect(blockAfter(forced, '.sidebar-group-label::before {')).toContain('background-color: CanvasText;');
    expect(blockAfter(forced, '.sidebar-group[data-current] .sidebar-group-label::before {')).toContain(
      'background-color: Highlight;',
    );
    expect(blockAfter(forced, `${COLLAPSED} .sidebar:not(.sidebar-drawer) .sidebar-item-count {`)).toContain(
      'background-color: CanvasText;',
    );
  });

  it('stops the rail and the chevron moving under reduced motion, after both transitions', () => {
    const css = rules();
    const reduced = '@media (prefers-reduced-motion: reduce)';
    const block = blockAfter(css, reduced);
    expect(block).toContain('.sidebar, .sidebar-collapse svg {');
    expect(block).toContain('transition: none;');
    expect(css.indexOf(reduced)).toBeGreaterThan(css.indexOf('transition: width 200ms ease;'));
    expect(css.indexOf(reduced)).toBeGreaterThan(css.indexOf('transition: rotate 200ms ease;'));
  });

  it('is imported after app-shell.css', () => {
    const entry = read('src/styles.css');
    const at = (file) => entry.indexOf(`'./components/${file}'`);
    expect(at('sidebar.css')).toBeGreaterThan(at('app-shell.css'));
  });
});

describe('src/components/tab-bar.css', () => {
  // The rules without their comments, with their whitespace closed up, so a selector Prettier breaks over
  // lines reads as one line. `.tab-bar {` first matches the bar's own rule, before the wide block repeats it.
  const rules = () => closeUp(stripComments(read('src/components/tab-bar.css')));
  const WIDE = '@media (width >= 1024px)';
  const CURRENT = "[aria-current='page'], [data-current], [data-current-action]";
  const DISABLED = ':disabled, [data-disabled]';

  it('docks the bar flush with the bottom edge at the chrome layer, the safe area padded inside it', () => {
    const bar = blockAfter(rules(), '.tab-bar {');
    for (const declaration of [
      '--tab-bar-height: 4rem;',
      'position: fixed;',
      'inset-block-end: 0;',
      'inset-inline: 0;',
      'z-index: var(--z-chrome);',
      'box-sizing: border-box;',
      'min-height: calc(var(--tab-bar-height) + env(safe-area-inset-bottom, 0px));',
      'padding-top: calc(0.25rem - 1px);',
      'padding-bottom: calc(0.25rem + env(safe-area-inset-bottom, 0px));',
      'padding-left: max(0.25rem, env(safe-area-inset-left, 0px));',
      'padding-right: max(0.25rem, env(safe-area-inset-right, 0px));',
      'border-block-start: 1px solid var(--color-hairline);',
      'background-color: var(--color-float);',
    ]) {
      expect(bar, declaration).toContain(declaration);
    }
    // Docked: no corner, and no shadow, which the shadow tokens would cast downward, off the screen.
    expect(bar).not.toContain('box-shadow');
    expect(bar).not.toContain('border-radius');
  });

  it('draws an item 56px tall as a pill, its label at the small step with the action weight', () => {
    const item = blockAfter(rules(), '.tab-bar-item {');
    for (const declaration of [
      'min-height: 3.5rem;',
      // 4px each side, which the capacity sums in Appendix B count on.
      'padding-inline: 0.25rem;',
      'font-size: var(--text-small);',
      'line-height: var(--text-small--line-height);',
      'font-weight: 500;',
      'border-radius: var(--radius-pill);',
      'color: var(--color-slate);',
      'cursor: pointer;',
    ]) {
      expect(item, declaration).toContain(declaration);
    }
    expect(blockAfter(rules(), '.tab-bar-list > li {')).toContain('flex: 1 1 0;');
  });

  it('keeps a label on one line and ellipsizes it as a last resort', () => {
    const label = blockAfter(rules(), '.tab-bar-item-label {');
    for (const declaration of ['overflow: hidden;', 'text-overflow: ellipsis;', 'white-space: nowrap;']) {
      expect(label, declaration).toContain(declaration);
    }
  });

  it('draws the count as an ink chip at the icon corner, cut from it by a 2px float border, in 12px numerals', () => {
    const count = blockAfter(rules(), '.tab-bar-count {');
    for (const declaration of [
      'position: absolute;',
      'border: 2px solid var(--color-float);',
      'border-radius: var(--radius-pill);',
      'background-color: var(--color-ink);',
      'color: var(--color-canvas);',
      'font-size: 0.75rem;',
      'font-weight: 700;',
    ]) {
      expect(count, declaration).toContain(declaration);
    }
    const current = blockAfter(rules(), `.tab-bar-item:is(${CURRENT}) .tab-bar-count {`);
    expect(current).toContain('border-color: var(--color-ink);');
    expect(current).toContain('background-color: var(--color-canvas);');
    expect(current).toContain('color: var(--color-ink);');
  });

  it('draws the comma a name needs at no size, inline', () => {
    const comma = blockAfter(rules(), '.tab-bar-comma {');
    expect(comma).toContain('font-size: 0;');
    // A hidden box would get a space at its edge in a browser's name: the comma stays inline.
    expect(comma).not.toContain('position');
    expect(comma).not.toContain('display');
  });

  it('washes an item on hover only with a hover pointer and never the current one, and the current rule comes after', () => {
    const css = rules();
    const hover = blockAfter(css, '@media (hover: hover)');
    const itemHover = `.tab-bar-item:is(:hover, [data-hovered]):not(${CURRENT}, ${DISABLED}) {`;
    const washed = blockAfter(hover, itemHover);
    expect(washed).toContain('background-color: color-mix(in srgb, var(--color-ink) 5%, transparent);');
    expect(washed).toContain('color: var(--color-ink);');
    // Outside the media block, no rule hovers an item; a press shows the same wash, never on the current one.
    const outside = css.replace(/@media \(hover: hover\) \{(?:[^{}]*\{[^{}]*\})*[^{}]*\}/g, '');
    expect(outside).not.toMatch(/\.tab-bar-item:is\(:hover/);
    expect(
      blockAfter(css, `.tab-bar-item:is(:active, [data-pressed]):not(${CURRENT}, ${DISABLED}) {`),
    ).toContain('background-color: color-mix(in srgb, var(--color-ink) 5%, transparent);');
    const current = `.tab-bar-item:is(${CURRENT}) {`;
    const fill = blockAfter(css, current);
    expect(fill).toContain('background-color: var(--color-ink);');
    expect(fill).toContain('color: var(--color-canvas);');
    expect(css.indexOf(current)).toBeGreaterThan(css.indexOf(itemHover));
  });

  it('lifts the toasts above the bar on a narrow page, from the root the toast region reads', () => {
    const narrow = blockAfter(rules(), '@media (width < 1024px)');
    expect(blockAfter(narrow, ':root:has(.tab-bar) {')).toContain(
      '--toast-offset-block: calc(4rem + env(safe-area-inset-bottom, 0px));',
    );
  });

  it('draws a disabled item in taupe with no pointer, and gives it no hover or press wash', () => {
    const disabled = blockAfter(rules(), `.tab-bar-item:is(${DISABLED}) {`);
    expect(disabled).toContain('color: var(--color-taupe);');
    expect(disabled).toContain('cursor: default;');
  });

  it('rings an item in the focus ring token, inverted to canvas and inset on the current item', () => {
    const css = rules();
    const ringed = blockAfter(css, '.tab-bar-item:is(:focus-visible, [data-focus-visible]) {');
    expect(ringed).toContain('outline: var(--focus-ring-width) solid var(--focus-ring-color);');
    expect(ringed).toContain('outline-offset: var(--focus-ring-offset);');
    const inverted = blockAfter(
      css,
      `.tab-bar-item:is(${CURRENT}):is(:focus-visible, [data-focus-visible]) {`,
    );
    expect(inverted).toContain('outline-color: var(--color-canvas);');
    expect(inverted).toContain(
      'outline-offset: calc(-1 * (var(--focus-ring-width) + var(--focus-ring-offset)));',
    );
  });

  it('hides the bar from 1024px up, the medium breakpoint written out', async () => {
    const css = rules();
    expect(blockAfter(blockAfter(css, WIDE), '.tab-bar {')).toContain('display: none;');
    // A media query cannot read a custom property, so the width is written out and must stay the token.
    const { tokens } = await import('../dist/tokens.js');
    const written = [...css.matchAll(/@media \(width [<>]=? (\d+px)\)/g)].map((match) => match[1]);
    // The wide block hides the bar, and the narrow one lifts the toasts above it.
    expect(written).toHaveLength(2);
    for (const width of written) expect(width).toBe(tokens.breakpoint.md.value);
  });

  it('is as tall as the room app-shell.css reserves under the page', () => {
    const height = /--tab-bar-height: ([\d.]+rem);/.exec(rules())?.[1];
    const reserve =
      /--app-shell-inset-block-end: calc\(([\d.]+rem) \+ env\(safe-area-inset-bottom, 0px\)\);/.exec(
        closeUp(stripComments(read('src/components/app-shell.css'))),
      )?.[1];
    expect(height).toBe('4rem');
    expect(reserve).toBe(height);
  });

  it('draws the current item in Highlight and the count in CanvasText in forced colors', () => {
    const forced = blockAfter(rules(), FORCED_COLORS);
    const current = blockAfter(forced, `.tab-bar-item:is(${CURRENT}) {`);
    expect(current).toContain('background-color: Highlight;');
    expect(current).toContain('color: HighlightText;');
    expect(
      blockAfter(forced, `.tab-bar-item:is(${CURRENT}):is(:focus-visible, [data-focus-visible]) {`),
    ).toContain('outline-color: HighlightText;');
    const count = blockAfter(forced, '.tab-bar-count {');
    expect(count).toContain('border-color: canvas;');
    expect(count).toContain('background-color: CanvasText;');
    expect(count).toContain('color: canvas;');
    const currentCount = blockAfter(forced, `.tab-bar-item:is(${CURRENT}) .tab-bar-count {`);
    expect(currentCount).toContain('border-color: Highlight;');
    expect(currentCount).toContain('background-color: HighlightText;');
    expect(currentCount).toContain('color: Highlight;');
  });

  it('moves nothing, so it needs no reduced-motion block', () => {
    const css = rules();
    expect(css).not.toMatch(/(?<![\w-])transition\s*:/);
    expect(css).not.toMatch(/(?<![\w-])animation\s*:/);
  });

  it('is imported after sidebar.css', () => {
    const entry = read('src/styles.css');
    const at = (file) => entry.indexOf(`'./components/${file}'`);
    expect(at('tab-bar.css')).toBeGreaterThan(at('sidebar.css'));
  });
});

describe('src/components/avatar.css', () => {
  // The rules without their comments, with their whitespace closed up, so a selector Prettier breaks over
  // lines reads as one line.
  const rules = () => closeUp(stripComments(read('src/components/avatar.css')));
  const FORCED = '@media (forced-colors: active)';

  it('draws the three sizes at 24, 32 and 40px, with initials at 12px 700, 14px 500 and 16px 500', () => {
    const css = rules();
    const avatar = blockAfter(css, '.avatar {');
    for (const declaration of ['--avatar-size: 2rem;', 'font-size: 0.875rem;', 'font-weight: 500;']) {
      expect(avatar, declaration).toContain(declaration);
    }
    expect(avatar).toContain('width: var(--avatar-size);');
    expect(avatar).toContain('height: var(--avatar-size);');
    const small = blockAfter(css, ".avatar[data-size='sm'] {");
    for (const declaration of ['--avatar-size: 1.5rem;', 'font-size: 0.75rem;', 'font-weight: 700;']) {
      expect(small, declaration).toContain(declaration);
    }
    const large = blockAfter(css, ".avatar[data-size='lg'] {");
    for (const declaration of ['--avatar-size: 2.5rem;', 'font-size: 1rem;']) {
      expect(large, declaration).toContain(declaration);
    }
    expect(large).not.toContain('font-weight');
    expect(css).not.toMatch(/font-weight:\s*600/);
  });

  it('cuts a circle on the pill radius and a square on the micro radius', () => {
    const css = rules();
    expect(blockAfter(css, '.avatar {')).toContain('border-radius: var(--radius-pill);');
    expect(blockAfter(css, ".avatar[data-shape='square'] {")).toContain(
      'border-radius: var(--radius-micro);',
    );
  });

  it('fills the fallback with bone and ink, and rings the box with a frame border on a pseudo-element, never a shadow', () => {
    const css = rules();
    const avatar = blockAfter(css, '.avatar {');
    expect(avatar).toContain('background-color: var(--color-bone);');
    expect(avatar).toContain('color: var(--color-ink);');
    // Clipped, so the image takes the box's corners.
    expect(avatar).toContain('overflow: hidden;');
    const ring = blockAfter(css, '.avatar::after {');
    for (const declaration of [
      'position: absolute;',
      'inset: 0;',
      'border: 1px solid var(--color-frame);',
      'border-radius: inherit;',
      'pointer-events: none;',
    ]) {
      expect(ring, declaration).toContain(declaration);
    }
    expect(css).not.toContain('box-shadow');
  });

  it('keeps the image invisible until it is marked loaded, covering the box', () => {
    const css = rules();
    const image = blockAfter(css, '.avatar-image {');
    for (const declaration of [
      'position: absolute;',
      'inset: 0;',
      'width: 100%;',
      'height: 100%;',
      'object-fit: cover;',
      'opacity: 0;',
    ]) {
      expect(image, declaration).toContain(declaration);
    }
    expect(blockAfter(css, '.avatar-image[data-loaded] {')).toContain('opacity: 1;');
  });

  it('draws the initials CanvasText on canvas and the ring CanvasText in forced colors', () => {
    const forced = blockAfter(rules(), FORCED);
    const avatar = blockAfter(forced, '.avatar {');
    expect(avatar).toContain('background-color: canvas;');
    expect(avatar).toContain('color: CanvasText;');
    expect(blockAfter(forced, '.avatar::after {')).toContain('border-color: CanvasText;');
  });

  it('moves nothing, so it needs no reduced-motion block', () => {
    const css = rules();
    expect(css).not.toMatch(/(?<![\w-])transition\s*:/);
    expect(css).not.toMatch(/(?<![\w-])animation\s*:/);
  });
});

describe('src/components/stat-tile.css', () => {
  // The rules without their comments, with their whitespace closed up, so a selector Prettier breaks over
  // lines reads as one line.
  const rules = () => closeUp(stripComments(read('src/components/stat-tile.css')));
  const FORCED = '@media (forced-colors: active)';
  const CONTAINER = '@container stat-tile (width < 18rem)';
  const WASH = 'background-color: color-mix(in srgb, var(--color-ink) 5%, var(--color-lifted));';

  /** The CSS with the container query's block taken out, so the wide layout is read on its own. */
  const outsideContainer = (css) => {
    const start = css.indexOf(CONTAINER);
    if (start === -1) return css;
    const end = css.indexOf('{', start) + 1 + blockAfter(css, CONTAINER).length + 1;
    return css.slice(0, start) + css.slice(end);
  };

  it("draws the Card's surface, padded by --spacing-card", () => {
    const tile = blockAfter(rules(), '.stat-tile {');
    for (const declaration of [
      'padding: var(--spacing-card);',
      'border: 1px solid var(--color-hairline);',
      'border-radius: var(--radius-stadium);',
      'background-color: var(--color-lifted);',
      'color: var(--color-ink);',
      'box-sizing: border-box;',
    ]) {
      expect(tile, declaration).toContain(declaration);
    }
    expect(rules()).not.toContain('box-shadow');
  });

  it('is a size container with an intrinsic inline size of 0, never a stand-in width', () => {
    const tile = blockAfter(rules(), '.stat-tile {');
    expect(tile).toContain('container: stat-tile / inline-size;');
    // The library's rule (spec corrections 30, 34 and 63): a stand-in width is also the tile's min-content width,
    // which a flex: 1 item or a 1fr track keeps as its narrowest, so two tiles scrolled a 320px page sideways.
    expect(tile).toContain('contain-intrinsic-inline-size: 0;');
    // A tile straight in a flex row is a whole 16rem tile, as 0.6.1 drew it, and shrinks from there (correction 69).
    expect(tile).toContain('flex: 0 1 16rem;');
  });

  it('makes a tile in a card concentric with it, with the frame edge', () => {
    const nested = blockAfter(rules(), '.card > .stat-tile, .card-body .stat-tile {');
    expect(nested).toContain('border-color: var(--color-frame);');
    expect(nested).toContain(
      'border-radius: max(var(--radius-micro), calc(var(--holder-radius) - var(--holder-border) - var(--holder-pad)));',
    );
  });

  it('lays the body out as a grid with the trend at the end of the value row', () => {
    const body = blockAfter(outsideContainer(rules()), '.stat-tile-body {');
    expect(body).toContain('display: grid;');
    expect(body).toContain('grid-template-columns: minmax(0, 1fr) auto;');
    expect(body).toContain(
      "grid-template-areas: 'label label' 'value trend' 'change change' 'caption caption';",
    );
    const css = outsideContainer(rules());
    for (const [part, area] of [
      ['.stat-tile-label {', 'label'],
      ['.stat-tile-value {', 'value'],
      ['.stat-tile-trend {', 'trend'],
      ['.stat-tile-change {', 'change'],
      ['.stat-tile-caption {', 'caption'],
    ]) {
      expect(blockAfter(css, part), part).toContain(`grid-area: ${area};`);
    }
    const trend = blockAfter(css, '.stat-tile-trend {');
    expect(trend).toContain('max-width: 6rem;');
    expect(trend).toContain('max-height: 2rem;');
  });

  it('draws the label at the overline step in slate, in capitals', () => {
    const label = blockAfter(rules(), '.stat-tile-label {');
    for (const declaration of [
      'font-size: var(--text-overline);',
      'line-height: var(--text-overline--line-height);',
      'letter-spacing: var(--text-overline--letter-spacing);',
      'font-weight: var(--text-overline--font-weight);',
      'text-transform: uppercase;',
      'color: var(--color-slate);',
      'margin: 0;',
    ]) {
      expect(label, declaration).toContain(declaration);
    }
    expect(rules()).not.toMatch(/font-weight:\s*600/);
  });

  it('colors the change line slate, gain or warning by its tone, and never error, success, clay or signal', () => {
    const css = rules();
    expect(blockAfter(css, '.stat-tile-change {')).toContain('color: var(--color-slate);');
    expect(blockAfter(css, ".stat-tile-change[data-tone='gain'] {")).toContain('color: var(--color-gain);');
    expect(blockAfter(css, ".stat-tile-change[data-tone='warning'] {")).toContain(
      'color: var(--color-warning);',
    );
    for (const reserved of ['--color-error', '--color-success', '--color-clay', '--color-signal']) {
      expect(css, reserved).not.toContain(reserved);
    }
    // The arrow takes the line's color, and the direction never picks one.
    expect(css).not.toContain('data-direction');
  });

  it('moves the trend under the caption below 18rem of content, by a container query on the tile', () => {
    const css = rules();
    expect(blockAfter(css, '.stat-tile {')).toContain('container: stat-tile / inline-size;');
    const narrow = blockAfter(css, CONTAINER);
    expect(narrow).not.toBe('');
    const body = blockAfter(narrow, '.stat-tile-body {');
    expect(body).toContain('grid-template-columns: minmax(0, 1fr);');
    expect(body).toContain("grid-template-areas: 'label' 'value' 'change' 'caption' 'trend';");
    expect(blockAfter(narrow, '.stat-tile-trend {')).toContain('justify-content: flex-start;');
    // A container query, never a viewport query, decides it.
    expect(css).not.toMatch(/@media \((?:min-|max-)?width/);
  });

  it('washes a linked tile 5% ink over Lifted on hover, only where hover exists, and on a press', () => {
    const css = rules();
    const hover = blockAfter(css, '@media (hover: hover)');
    expect(blockAfter(hover, 'a.stat-tile:is(:hover, [data-hovered]) {')).toContain(WASH);
    expect(outsideContainer(css).replace(`@media (hover: hover) {${hover}}`, '')).not.toContain(':hover');
    expect(blockAfter(css, 'a.stat-tile:is(:active, [data-pressed]) {')).toContain(WASH);
    expect(blockAfter(css, 'a.stat-tile {')).toContain('cursor: pointer;');
  });

  it("rings a sparkline's end dot in the washed tile's color on hover and on a press", () => {
    const css = rules();
    const surface = '--chart-surface: color-mix(in srgb, var(--color-ink) 5%, var(--color-lifted));';
    const hover = blockAfter(css, '@media (hover: hover)');
    expect(blockAfter(hover, 'a.stat-tile:is(:hover, [data-hovered]) {')).toContain(surface);
    expect(blockAfter(css, 'a.stat-tile:is(:active, [data-pressed]) {')).toContain(surface);
  });

  it('rings a linked tile with the token ring outside it', () => {
    const ring = blockAfter(rules(), 'a.stat-tile:is(:focus-visible, [data-focus-visible]) {');
    expect(ring).toContain('outline: var(--focus-ring-width) solid var(--focus-ring-color);');
    expect(ring).toContain('outline-offset: var(--focus-ring-offset);');
  });

  it('draws the edge CanvasText and the ring Highlight in forced colors', () => {
    const forced = blockAfter(rules(), FORCED);
    expect(blockAfter(forced, '.stat-tile {')).toContain('border-color: CanvasText;');
    expect(blockAfter(forced, 'a.stat-tile:is(:focus-visible, [data-focus-visible]) {')).toContain(
      'outline-color: Highlight;',
    );
  });

  it('moves nothing, so it needs no reduced-motion block', () => {
    const css = rules();
    expect(css).not.toMatch(/(?<![\w-])transition\s*:/);
    expect(css).not.toMatch(/(?<![\w-])animation\s*:/);
  });
});

describe('src/components/meter.css', () => {
  // The rules without their comments, with their whitespace closed up, so a selector Prettier breaks over
  // lines reads as one line.
  const rules = () => closeUp(stripComments(read('src/components/meter.css')));
  const FORCED = '@media (forced-colors: active)';
  const SURFACE = 'var(--meter-surface, var(--color-lifted))';
  const HATCH = 'repeating-linear-gradient(45deg, var(--meter-ink) 0 2px, transparent 2px 6px)';

  it('is imported right after stat-tile.css', () => {
    const imported = [...read('src/styles.css').matchAll(/@import '\.\/components\/([^']+)';/g)].map(
      (m) => m[1],
    );
    expect(imported.indexOf('meter.css')).toBe(imported.indexOf('stat-tile.css') + 1);
  });

  it('lays the label and the tabular slate value out as one row above the bar', () => {
    const css = rules();
    const head = blockAfter(css, '.meter-head {');
    for (const declaration of [
      'display: flex;',
      'flex-wrap: wrap;',
      'align-items: baseline;',
      'font-size: var(--text-small);',
      'line-height: var(--text-small--line-height);',
      'overflow-wrap: anywhere;',
    ]) {
      expect(head, declaration).toContain(declaration);
    }
    const label = blockAfter(css, '.meter-label {');
    expect(label).toContain('font-weight: 500;');
    expect(label).toContain('color: var(--color-ink);');
    const value = blockAfter(css, '.meter-value {');
    for (const declaration of [
      'margin-inline-start: auto;',
      'font-variant-numeric: tabular-nums;',
      'color: var(--color-slate);',
    ]) {
      expect(value, declaration).toContain(declaration);
    }
    // 8px from the row to the bar.
    expect(blockAfter(css, '.meter {')).toContain('gap: var(--spacing-part);');
    expect(css).not.toMatch(/font-weight:\s*600/);
  });

  it('draws an 8px track on the pill radius in the frame color, clipping the segments', () => {
    const track = blockAfter(rules(), '.meter-track {');
    for (const declaration of [
      'display: flex;',
      'height: 0.5rem;',
      'overflow: hidden;',
      'border-radius: var(--radius-pill);',
      'background-color: var(--color-frame);',
    ]) {
      expect(track, declaration).toContain(declaration);
    }
  });

  it('fills in ink, hatches 2px stripes every 6px at 45 degrees, and turns both warning over the limit, through one property', () => {
    const css = rules();
    expect(blockAfter(css, '.meter {')).toContain('--meter-ink: var(--color-ink);');
    expect(blockAfter(css, '.meter[data-over] {')).toContain('--meter-ink: var(--color-warning);');
    expect(blockAfter(css, ".meter-segment[data-look='fill'] {")).toContain(
      'background-color: var(--meter-ink);',
    );
    expect(blockAfter(css, ".meter-segment[data-look='hatched'] {")).toContain(`background-image: ${HATCH};`);
    expect(blockAfter(css, ".meter-swatch[data-look='fill'] {")).toContain(
      'background-color: var(--meter-ink);',
    );
    expect(blockAfter(css, ".meter-swatch[data-look='hatched'] {")).toContain(`background-image: ${HATCH};`);
    for (const reserved of [
      '--color-error',
      '--color-success',
      '--color-clay',
      '--color-signal',
      '--color-taupe',
    ]) {
      expect(css, reserved).not.toContain(reserved);
    }
  });

  it('cuts touching segments apart with a 2px border of the surface, read with a fallback and never declared outside forced colors', () => {
    const css = rules();
    expect(blockAfter(css, '.meter-segment + .meter-segment {')).toContain(
      `border-inline-start: 2px solid ${SURFACE};`,
    );
    // The fills stop at the border, so the spacer shows the surface.
    expect(blockAfter(css, ".meter-segment[data-look='fill'] {")).toContain('background-clip: padding-box;');
    expect(blockAfter(css, ".meter-segment[data-look='hatched'] {")).toContain(
      'background-clip: padding-box;',
    );
    expect(blockAfter(css, '.meter-segment {')).toContain('box-sizing: border-box;');
    expect(closeUp(outsideForcedColors(read('src/components/meter.css')))).not.toMatch(/--meter-surface\s*:/);
    expect(css).not.toContain('box-shadow');
  });

  it("rounds the last segment's end and leaves the joins square", () => {
    const css = rules();
    const last = blockAfter(css, '.meter-segment:last-child {');
    expect(last).toContain('border-start-end-radius: var(--radius-pill);');
    expect(last).toContain('border-end-end-radius: var(--radius-pill);');
    expect(blockAfter(css, '.meter-segment {')).not.toContain('border-radius');
  });

  it("draws the held segment's 1px edge on a pseudo-element inside the spacer", () => {
    const css = rules();
    expect(blockAfter(css, '.meter-segment {')).toContain('position: relative;');
    const edge = blockAfter(css, ".meter-segment[data-look='hatched']::after {");
    for (const declaration of [
      "content: '';",
      'position: absolute;',
      'inset: 0;',
      'border: 1px solid var(--meter-ink);',
      'border-radius: inherit;',
    ]) {
      expect(edge, declaration).toContain(declaration);
    }
  });

  it('places the pace marker by logical offsets, 2px of ink 16px tall in a 2px surface ring, centred on the track', () => {
    const css = rules();
    expect(blockAfter(css, '.meter-bar {')).toContain('position: relative;');
    const pace = blockAfter(css, '.meter-pace {');
    for (const declaration of [
      'position: absolute;',
      'inset-block-start: 50%;',
      'box-sizing: content-box;',
      'width: 2px;',
      'height: 1rem;',
      'margin-block-start: calc(-0.5rem - 2px);',
      'margin-inline-start: -3px;',
      `border: 2px solid ${SURFACE};`,
      'background-color: var(--color-ink);',
      'background-clip: padding-box;',
    ]) {
      expect(pace, declaration).toContain(declaration);
    }
  });

  it('keeps the fills when the page is printed', () => {
    const meter = blockAfter(rules(), '.meter {');
    expect(meter).toContain('-webkit-print-color-adjust: exact;');
    expect(meter).toContain('print-color-adjust: exact;');
  });

  it('writes no physical offset', () => {
    const css = rules();
    expect(css).not.toMatch(/(?<![\w-])(?:left|right)\s*:/);
    expect(css).not.toMatch(/(?:margin|padding|border)-(?:left|right)\b/);
  });

  it('draws CanvasText fills, CanvasText stripes on canvas, an outlined track and a Highlight marker in forced colors', () => {
    const forced = blockAfter(rules(), FORCED);
    expect(blockAfter(forced, '.meter {')).toContain('--meter-surface: canvas;');
    expect(blockAfter(forced, '.meter-track {')).toContain('outline: 1px solid CanvasText;');
    expect(
      blockAfter(
        forced,
        ".meter-segment[data-look='fill'], .meter-swatch[data-look='fill'], .meter-swatch[data-look='pace'] {",
      ),
    ).toContain('background-color: CanvasText;');
    const hatched = blockAfter(
      forced,
      ".meter-segment[data-look='hatched'], .meter-swatch[data-look='hatched'] {",
    );
    for (const declaration of [
      'forced-color-adjust: none;',
      'background-color: canvas;',
      'background-image: repeating-linear-gradient(45deg, CanvasText 0 2px, canvas 2px 6px);',
    ]) {
      expect(hatched, declaration).toContain(declaration);
    }
    expect(
      blockAfter(forced, ".meter-segment[data-look='hatched']::after, .meter-swatch[data-look='hatched'] {"),
    ).toContain('border-color: CanvasText;');
    expect(blockAfter(forced, '.meter-pace {')).toContain('background-color: Highlight;');
  });

  it('moves nothing, so it needs no reduced-motion block', () => {
    const css = rules();
    expect(css).not.toMatch(/(?<![\w-])transition\s*:/);
    expect(css).not.toMatch(/(?<![\w-])animation\s*:/);
  });
});

describe('src/components/charts.css, the shared rules and the sparkline', () => {
  // The rules without their comments, with their whitespace closed up, so a selector Prettier breaks over
  // lines reads as one line.
  const rules = () => closeUp(stripComments(read('src/components/charts.css')));
  const FORCED = '@media (forced-colors: active)';
  const SURFACE = 'var(--chart-surface, var(--color-lifted))';

  /** Every rule block of `css` that holds no nested block, as [selector, body]. */
  const blocks = (css) => [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map((m) => [m[1].trim(), m[2]]);

  it('is imported right after meter.css', () => {
    const imported = [...read('src/styles.css').matchAll(/@import '\.\/components\/([^']+)';/g)].map(
      (m) => m[1],
    );
    expect(imported.indexOf('charts.css')).toBeGreaterThan(-1);
    expect(imported.indexOf('charts.css')).toBe(imported.indexOf('meter.css') + 1);
  });

  it("sets the flip from the nearest dir attribute, as the card's chevron turn is", () => {
    const css = rules();
    expect(blockAfter(css, ":where([dir='ltr' i]) {")).toContain('--chart-flip: 1;');
    expect(blockAfter(css, ":where([dir='rtl' i]) {")).toContain('--chart-flip: -1;');
    // :dir() is past the browser floor.
    expect(css).not.toContain(':dir(');
  });

  it('lays the HTML over a drawing out in the direction the flip comes from, so the two always agree', () => {
    // The flip reads only an explicit attribute, and logical insets read the computed direction, which
    // dir="auto" or a CSS direction can change alone. Each drawing's HTML takes its direction from the
    // same attribute as the flip, ltr when there is none, as the flip's fallback of 1 is.
    const css = rules();
    expect(blockAfter(css, ":where([dir='ltr' i]) {")).toContain('--chart-direction: ltr;');
    expect(blockAfter(css, ":where([dir='rtl' i]) {")).toContain('--chart-direction: rtl;');
    for (const selector of [
      '.sparkline-plot {',
      '.line-chart-plot {',
      '.line-chart-x {',
      '.bar-chart-rows {',
    ])
      expect(blockAfter(css, selector), selector).toContain('direction: var(--chart-direction, ltr);');
    expect(css).not.toMatch(/--chart-direction\s*:(?!\s*(?:ltr|rtl);)/);
  });

  it('mirrors every chart svg by the flip and lets its strokes overflow the box', () => {
    const svg = blockAfter(rules(), '.sparkline-plot svg {');
    for (const declaration of [
      'display: block;',
      'width: 100%;',
      'height: 100%;',
      'overflow: visible;',
      'scale: var(--chart-flip, 1) 1;',
    ]) {
      expect(svg, declaration).toContain(declaration);
    }
  });

  it('keeps every stroke its width whatever the stretch', () => {
    const stroked = blocks(rules()).filter(([, body]) => /(?<![\w-])stroke-width\s*:/.test(body));
    expect(stroked.length).toBeGreaterThan(0);
    for (const [selector, body] of stroked)
      expect(body, selector).toContain('vector-effect: non-scaling-stroke;');
  });

  it('draws the sparkline 96 by 32 with its plot inset 6px', () => {
    const css = rules();
    const box = blockAfter(css, '.sparkline {');
    for (const declaration of [
      'position: relative;',
      'display: inline-block;',
      'box-sizing: border-box;',
      'width: 6rem;',
      'height: 2rem;',
      'vertical-align: middle;',
    ]) {
      expect(box, declaration).toContain(declaration);
    }
    const plot = blockAfter(css, '.sparkline-plot {');
    expect(plot).toContain('position: absolute;');
    expect(plot).toContain('inset: 0.375rem;');
  });

  it('draws the line 2px ink with round caps and joins, and the area a 10% ink wash', () => {
    const css = rules();
    const line = blockAfter(css, '.sparkline-line {');
    for (const declaration of [
      'fill: none;',
      'stroke: var(--color-ink);',
      'stroke-width: 2px;',
      'stroke-linecap: round;',
      'stroke-linejoin: round;',
      'vector-effect: non-scaling-stroke;',
    ]) {
      expect(line, declaration).toContain(declaration);
    }
    const area = blockAfter(css, '.sparkline-area {');
    expect(area).toContain('fill: color-mix(in srgb, var(--color-ink) 10%, transparent);');
    expect(area).toContain('stroke: none;');
    // No mark takes a reserved color. The one exception is the charts' message for a load that failed, which
    // is a failure, the error color's one meaning (the bar chart's describe checks it is the only one).
    const failed = `${chartList('message')}[data-tone='error'] {`;
    expect(blockAfter(css, failed)).toContain('color: var(--color-error);');
    const marks = css.replace(`${failed}${blockAfter(css, failed)}}`, '');
    for (const reserved of [
      '--color-error',
      '--color-success',
      '--color-clay',
      '--color-signal',
      '--color-taupe',
    ]) {
      expect(marks, reserved).not.toContain(reserved);
    }
  });

  it('rings the end point with a 2px border of the surface, read with a fallback, never a shadow', () => {
    const css = rules();
    const dot = blockAfter(css, '.sparkline-end {');
    for (const declaration of [
      'position: absolute;',
      // The ring is outside the 8px of ink, whatever box-sizing base.css gives every box.
      'box-sizing: content-box;',
      'width: 0.5rem;',
      'height: 0.5rem;',
      'margin-block-start: -0.375rem;',
      'margin-inline-start: -0.375rem;',
      `border: 2px solid ${SURFACE};`,
      'border-radius: var(--radius-dot);',
      'background-color: var(--color-ink);',
    ]) {
      expect(dot, declaration).toContain(declaration);
    }
    // No ring is a shadow: the one shadow in the file is the line chart readout's float token.
    expect(dot).not.toContain('box-shadow');
    expect([...css.matchAll(/box-shadow:\s*([^;]+);/g)].map((m) => m[1])).toEqual(['var(--shadow-float)']);
    expect(css).not.toMatch(/--chart-surface\s*:/);
    expect(css).not.toMatch(/(?<![\w-])z-index\s*:/);
  });

  it('writes no physical offset', () => {
    const css = rules();
    expect(css).not.toMatch(/(?<![\w-])(?:left|right)\s*:/);
    expect(css).not.toMatch(/(?:margin|padding|border)-(?:left|right)\b/);
  });

  it('draws the line and the dot CanvasText and drops the wash in forced colors', () => {
    const forced = blockAfter(rules(), FORCED);
    expect(blockAfter(forced, '.sparkline-line {')).toContain('stroke: CanvasText;');
    expect(blockAfter(forced, '.sparkline-area {')).toContain('fill: none;');
    const dot = blockAfter(forced, '.sparkline-end {');
    expect(dot).toContain('border-color: canvas;');
    expect(dot).toContain('background-color: CanvasText;');
  });

  it('keeps the dots when the page is printed without backgrounds', () => {
    const css = rules();
    for (const selector of ['.sparkline {', '.line-chart {', '.bar-chart {']) {
      const block = blockAfter(css, selector);
      expect(block, selector).toContain('-webkit-print-color-adjust: exact;');
      expect(block, selector).toContain('print-color-adjust: exact;');
    }
  });

  it('moves nothing, so it needs no reduced-motion block', () => {
    const css = rules();
    expect(css).not.toMatch(/(?<![\w-])transition\s*:/);
    expect(css).not.toMatch(/(?<![\w-])animation\s*:/);
  });
});

describe('src/components/charts.css, the line chart', () => {
  const rules = () => closeUp(stripComments(read('src/components/charts.css')));
  const FORCED = '@media (forced-colors: active)';
  const SURFACE = 'var(--chart-surface, var(--color-lifted))';
  /** The rules outside forced colors, where the look is drawn. */
  const look = () => outsideForcedColors(rules());
  const expectAll = (body, declarations, label) => {
    for (const declaration of declarations) expect(body, `${label}: ${declaration}`).toContain(declaration);
  };

  it('hides the two views by [hidden] again, after giving them a display', () => {
    const css = look();
    expect(blockAfter(css, '.line-chart {')).toContain('display: grid;');
    expect(blockAfter(css, '.line-chart-chart {')).toContain('display: grid;');
    const hidden = `${chartList('chart')}[hidden], ${chartList('table')}[hidden] {`;
    expect(blockAfter(css, hidden)).toContain('display: none;');
    // After every rule that gives either view a display, so it wins on order as well.
    expect(css.indexOf(hidden)).toBeGreaterThan(css.indexOf('.line-chart-chart {'));
    expect(css.indexOf(hidden)).toBeGreaterThan(css.indexOf('.line-chart {'));
    expect(blockAfter(css, `${chartList('table')} {`)).not.toContain('display:');
  });

  it('draws the first series 2px ink and the second 1.5px slate, both with round caps and fixed widths', () => {
    const css = look();
    expectAll(
      blockAfter(css, '.line-chart-line {'),
      [
        'fill: none;',
        'stroke-linecap: round;',
        'stroke-linejoin: round;',
        'vector-effect: non-scaling-stroke;',
      ],
      'line',
    );
    expectAll(
      blockAfter(css, ".line-chart-line[data-series='1'] {"),
      ['stroke: var(--color-ink);', 'stroke-width: 2px;', 'vector-effect: non-scaling-stroke;'],
      'first',
    );
    expectAll(
      blockAfter(css, ".line-chart-line[data-series='2'] {"),
      ['stroke: var(--color-slate);', 'stroke-width: 1.5px;', 'vector-effect: non-scaling-stroke;'],
      'second',
    );
    expectAll(
      blockAfter(css, '.line-chart-area {'),
      ['fill: color-mix(in srgb, var(--color-ink) 10%, transparent);', 'stroke: none;'],
      'area',
    );
    // The legend's keys are the lines' colors and strokes.
    expect(blockAfter(css, '.line-chart-key {')).toContain('border-block-start: 2px solid var(--color-ink);');
    expect(blockAfter(css, ".line-chart-legend-item[data-series='2'] .line-chart-key {")).toContain(
      'border-block-start: 1.5px solid var(--color-slate);',
    );
  });

  it('mirrors the plot svg by the flip and lets its strokes overflow the box', () => {
    expectAll(
      blockAfter(look(), '.line-chart-plot svg {'),
      [
        'position: absolute;',
        'inset: 0;',
        'display: block;',
        'width: 100%;',
        'height: 100%;',
        'overflow: visible;',
        'scale: var(--chart-flip, 1) 1;',
      ],
      'svg',
    );
  });

  it('rules the gridlines in the divider color and the baseline in the frame color, 1px and fixed', () => {
    const css = look();
    expectAll(
      blockAfter(css, `${chartList('grid')} {`),
      ['stroke: var(--color-divider);', 'stroke-width: 1px;', 'vector-effect: non-scaling-stroke;'],
      'grid',
    );
    expectAll(
      blockAfter(css, `${chartList('baseline')} {`),
      ['stroke: var(--color-frame);', 'stroke-width: 1px;', 'vector-effect: non-scaling-stroke;'],
      'baseline',
    );
  });

  it('places the axis labels as HTML in tabular slate at the small step', () => {
    const css = look();
    for (const selector of [`${chartList('y-label')} {`, '.line-chart-x {']) {
      expectAll(
        blockAfter(css, selector),
        [
          'font-size: var(--text-small);',
          'line-height: var(--text-small--line-height);',
          'font-variant-numeric: tabular-nums;',
          'color: var(--color-slate);',
        ],
        selector,
      );
    }
    expectAll(
      blockAfter(css, `${chartList('y-label')} {`),
      ['position: absolute;', 'inset-inline-start: 0;', 'translate: 0 -100%;', 'white-space: nowrap;'],
      'y label',
    );
    expect(blockAfter(css, '.line-chart-plot[data-has-y-labels] {')).toContain(
      'margin-block-start: 1.25rem;',
    );
  });

  it('centres the x labels and the readout by the flip, and keeps the end ones inside the plot', () => {
    const css = look();
    for (const name of ['.line-chart-x-label', chartList('readout')]) {
      expect(blockAfter(css, `${name} {`), name).toContain('translate: calc(var(--chart-flip, 1) * -50%) 0;');
    }
    expect(blockAfter(css, ".line-chart-x-label[data-edge='start'] {")).toContain('translate: none;');
    expect(blockAfter(css, ".line-chart-x-label[data-edge='end'] {")).toContain(
      'translate: calc(var(--chart-flip, 1) * -100%) 0;',
    );
    expectAll(
      blockAfter(css, `${chartList('readout')}[data-align='start'] {`),
      [
        'translate: none;',
        'margin-inline-start: var(--spacing-part);',
        'max-width: min(16rem, 75% - var(--spacing-part));',
      ],
      'start',
    );
    expectAll(
      blockAfter(css, `${chartList('readout')}[data-align='end'] {`),
      [
        'translate: calc(var(--chart-flip, 1) * -100%) 0;',
        'margin-inline-start: calc(-1 * var(--spacing-part));',
        'max-width: min(16rem, 75% - var(--spacing-part));',
      ],
      'end',
    );
  });

  it('keeps the readout off its dots and inside the plot: anchored above or below, and wrapping within its width', () => {
    const css = look();
    const panel = blockAfter(css, `${chartList('readout')} {`);
    // Centred in the middle half, so half the plot on either side of the x is all it may take.
    expectAll(
      panel,
      ['width: max-content;', 'max-width: min(16rem, 50%);', 'overflow-wrap: anywhere;'],
      'readout',
    );
    // The component writes its block inset, so the CSS sets none and never stops the text from wrapping.
    expect(panel).not.toContain('inset-block-start');
    expect(panel).not.toContain('nowrap');
    // The gap is the dot's 6px radius and 4px of air, on the side the panel is on.
    expect(blockAfter(css, `${chartList('readout')}[data-place='above'] {`)).toContain(
      'margin-block-end: 0.625rem;',
    );
    expect(blockAfter(css, `${chartList('readout')}[data-place='below'] {`)).toContain(
      'margin-block-start: 0.625rem;',
    );
  });

  it('draws the readout as a float panel: float, frame edge, surface corner, float shadow', () => {
    const css = look();
    expectAll(
      blockAfter(css, `${chartList('readout')} {`),
      [
        'position: absolute;',
        'border: 1px solid var(--color-frame);',
        'border-radius: var(--radius-surface);',
        'background-color: var(--color-float);',
        'box-shadow: var(--shadow-float);',
        'font-size: var(--text-small);',
        'color: var(--color-ink);',
      ],
      'readout',
    );
    expect(blockAfter(css, `${chartList('readout-value')} {`)).toContain('font-weight: 500;');
    expect(blockAfter(css, `${chartList('readout-series')} {`)).toContain('color: var(--color-slate);');
  });

  it('draws the dots as 8px in a 2px border ring of the surface, never a shadow', () => {
    const css = look();
    expectAll(
      blockAfter(css, '.line-chart-dot {'),
      [
        'position: absolute;',
        // The ring is outside the 8px, whatever box-sizing base.css gives every box.
        'box-sizing: content-box;',
        'width: 0.5rem;',
        'height: 0.5rem;',
        'margin-block-start: -0.375rem;',
        'margin-inline-start: -0.375rem;',
        `border: 2px solid ${SURFACE};`,
        'border-radius: var(--radius-dot);',
        'background-color: var(--color-ink);',
      ],
      'dot',
    );
    expect(blockAfter(css, ".line-chart-dot[data-series='2'] {")).toContain(
      'background-color: var(--color-slate);',
    );
    expectAll(
      blockAfter(css, '.line-chart-crosshair {'),
      ['position: absolute;', 'inset-block: 0;', 'width: 1px;', 'background-color: var(--color-slate);'],
      'crosshair',
    );
    const shadows = [...css.matchAll(/box-shadow:\s*([^;]+);/g)].map((m) => m[1]);
    expect(shadows).toEqual(['var(--shadow-float)']);
  });

  it('rings the focused plot with the token ring', () => {
    expectAll(
      blockAfter(look(), '.line-chart-plot:focus-visible {'),
      [
        'outline: var(--focus-ring-width) solid var(--focus-ring-color);',
        'outline-offset: var(--focus-ring-offset);',
      ],
      'ring',
    );
  });

  it('hides the live region visually only, and gives each of its parts a line of its own', () => {
    const css = look();
    const live = blockAfter(css, '.line-chart-live {');
    expectAll(
      live,
      ['position: absolute;', 'width: 1px;', 'height: 1px;', 'overflow: hidden;', 'clip-path: inset(50%);'],
      'live',
    );
    expect(live).not.toContain('display: none');
    expect(live).not.toContain('visibility');
    expect(blockAfter(css, '.line-chart-live-part {')).toContain('display: block;');
  });

  it('rules the table with the divider and right-aligns its values by end', () => {
    const css = look();
    expectAll(
      blockAfter(css, `${chartList('table')} :is(th, td) {`),
      ['border-block-end: 1px solid var(--color-divider);', 'text-align: start;'],
      'cells',
    );
    expect(blockAfter(css, `${chartList('table')} tbody td {`)).toContain('text-align: end;');
    expect(blockAfter(css, `${chartList('table')} thead th {`)).toContain('font-weight: 500;');
    expect(blockAfter(css, `${chartList('table')} caption {`)).toContain('text-align: start;');
    // Weights 400, 450, 500 and 700 only.
    for (const [, weight] of css.matchAll(/font-weight:\s*(\d+);/g))
      expect(['400', '450', '500', '700']).toContain(weight);
  });

  it("writes the shareable rules once, as selector lists, with LineChart's values", () => {
    // Each rule a later chart shares, as a list of LineChart's class alone, so another chart joins it by adding
    // its own class to the list and LineChart's markup and values stay as they were (spec 6, plan Task 1). Each
    // body is LineChart's, declaration for declaration.
    /** @type {[selector: string, declarations: string[]][]} */
    const SHARED = [
      [
        `${chartList('legend')} {`,
        [
          'display: flex;',
          'flex-wrap: wrap;',
          'gap: var(--spacing-part) var(--spacing-peer);',
          'margin: 0;',
          'padding: 0;',
          'list-style: none;',
          'font-size: var(--text-small);',
          'line-height: var(--text-small--line-height);',
          'overflow-wrap: anywhere;',
        ],
      ],
      [
        `${chartList('legend-item')} {`,
        ['display: inline-flex;', 'align-items: center;', 'gap: var(--spacing-part);', 'min-width: 0;'],
      ],
      [`${chartList('legend-label')} {`, ['min-width: 0;', 'color: var(--color-ink);']],
      [
        `${chartList('grid')} {`,
        ['stroke: var(--color-divider);', 'stroke-width: 1px;', 'vector-effect: non-scaling-stroke;'],
      ],
      [
        `${chartList('baseline')} {`,
        ['stroke: var(--color-frame);', 'stroke-width: 1px;', 'vector-effect: non-scaling-stroke;'],
      ],
      [
        `${chartList('y-label')} {`,
        [
          'position: absolute;',
          'inset-inline-start: 0;',
          'translate: 0 -100%;',
          'padding-block-end: 0.125rem;',
          'font-size: var(--text-small);',
          'line-height: var(--text-small--line-height);',
          'font-variant-numeric: tabular-nums;',
          'white-space: nowrap;',
          'color: var(--color-slate);',
        ],
      ],
      [
        `${chartList('readout')} {`,
        [
          'position: absolute;',
          'box-sizing: border-box;',
          'width: max-content;',
          'max-width: min(16rem, 50%);',
          'padding: 0.375rem 0.625rem;',
          'border: 1px solid var(--color-frame);',
          'border-radius: var(--radius-surface);',
          'background-color: var(--color-float);',
          'box-shadow: var(--shadow-float);',
          'font-size: var(--text-small);',
          'line-height: var(--text-small--line-height);',
          'color: var(--color-ink);',
          'overflow-wrap: anywhere;',
          'translate: calc(var(--chart-flip, 1) * -50%) 0;',
        ],
      ],
      [
        `${chartList('readout')}[data-align='start'] {`,
        [
          'max-width: min(16rem, 75% - var(--spacing-part));',
          'translate: none;',
          'margin-inline-start: var(--spacing-part);',
        ],
      ],
      [
        `${chartList('readout')}[data-align='end'] {`,
        [
          'max-width: min(16rem, 75% - var(--spacing-part));',
          'translate: calc(var(--chart-flip, 1) * -100%) 0;',
          'margin-inline-start: calc(-1 * var(--spacing-part));',
        ],
      ],
      [`${chartList('readout')}[data-place='above'] {`, ['margin-block-end: 0.625rem;']],
      [`${chartList('readout')}[data-place='below'] {`, ['margin-block-start: 0.625rem;']],
      [`${chartList('readout-x')} {`, ['margin: 0;', 'color: var(--color-slate);']],
      [`${chartList('readout-list')} {`, ['margin: 0;', 'padding: 0;', 'list-style: none;']],
      [`${chartList('readout-value')} {`, ['font-weight: 500;', 'font-variant-numeric: tabular-nums;']],
      [`${chartList('readout-series')} {`, ['margin-inline-start: 0.25rem;', 'color: var(--color-slate);']],
      [
        `${chartList('table')} {`,
        [
          'width: 100%;',
          'border-collapse: collapse;',
          'font-size: var(--text-small);',
          'line-height: var(--text-small--line-height);',
          'font-variant-numeric: tabular-nums;',
        ],
      ],
      [
        `${chartList('table')} caption {`,
        ['padding-block-end: var(--spacing-part);', 'text-align: start;', 'color: var(--color-slate);'],
      ],
      [
        `${chartList('table')} :is(th, td) {`,
        [
          'padding: 0.5rem 0.75rem;',
          'border-block-end: 1px solid var(--color-divider);',
          'text-align: start;',
          'font-weight: var(--text-small--font-weight);',
          'overflow-wrap: anywhere;',
        ],
      ],
      [`${chartList('table')} thead th {`, ['font-weight: 500;', 'color: var(--color-slate);']],
      [`${chartList('table')} tbody td {`, ['text-align: end;']],
      [`${chartList('toolbar')} {`, ['display: flex;']],
      [
        `:is(.card, .card > .card-body:last-child) > ${chartList('')}:last-child ${chartList('toolbar')} {`,
        ['margin-block-end: calc(var(--holder-corner-inset) - var(--holder-pad));'],
      ],
      [
        `${chartList('noscript')} {`,
        [
          'margin: 0;',
          'font-size: var(--text-small);',
          'line-height: var(--text-small--line-height);',
          'color: var(--color-slate);',
        ],
      ],
    ];
    const css = look();
    /** A rule's declarations, one per entry, as written. */
    const declarations = (body) =>
      body
        .split(';')
        .map((part) => part.trim())
        .filter(Boolean)
        .map((part) => `${part};`);
    for (const [selector, values] of SHARED) {
      // Written once: one rule starts with the list, after the rule before it, and none starts with the lone
      // class. (The toolbar's list also ends the corner rule's selector, which is a rule of its own.)
      const start = `} ${selector}`;
      expect(css.split(start), selector).toHaveLength(2);
      expect(declarations(blockAfter(css, start)), selector).toEqual(values);
      // Each chart's own class alone where the list stands: `.line-chart-legend {` for `:is(.line-chart-legend) {`.
      const [first = ''] = CHART_BLOCKS;
      for (const block of CHART_BLOCKS) {
        const lone = selector.replace(/:is\((\.[\w-]+(?:, \.[\w-]+)*)\)/g, (list, members) =>
          members.startsWith(`.${first}`)
            ? `.${block}${members.split(', ')[0].slice(first.length + 1)}`
            : list,
        );
        expect(lone, selector).not.toBe(selector);
        expect(rules(), lone).not.toContain(lone);
      }
    }
    // The hidden table and the forced-colors rules take the same lists.
    expect(blockAfter(css, `${chartList('chart')}[hidden], ${chartList('table')}[hidden] {`)).toContain(
      'display: none;',
    );
    expect(
      blockAfter(
        blockAfter(rules(), FORCED),
        `.line-chart-line[data-series='2'], ${chartList('grid')}, ${chartList('baseline')} {`,
      ),
    ).toContain('stroke: GrayText;');
  });

  it('draws the first line CanvasText, the second and the rules GrayText, and the crosshair and dots Highlight in forced colors', () => {
    const forced = blockAfter(rules(), FORCED);
    expect(blockAfter(forced, ".line-chart-line[data-series='1'] {")).toContain('stroke: CanvasText;');
    expect(
      blockAfter(
        forced,
        `.line-chart-line[data-series='2'], ${chartList('grid')}, ${chartList('baseline')} {`,
      ),
    ).toContain('stroke: GrayText;');
    expect(blockAfter(forced, '.line-chart-key {')).toContain('border-block-start-color: CanvasText;');
    expect(blockAfter(forced, ".line-chart-legend-item[data-series='2'] .line-chart-key {")).toContain(
      'border-block-start-color: GrayText;',
    );
    expect(blockAfter(forced, '.line-chart-area {')).toContain('fill: none;');
    expect(blockAfter(forced, '.line-chart-crosshair {')).toContain('background-color: Highlight;');
    const dot = blockAfter(forced, '.line-chart-dot {');
    expect(dot).toContain('border-color: canvas;');
    expect(dot).toContain('background-color: Highlight;');
    expect(blockAfter(forced, '.line-chart-plot:focus-visible {')).toContain('outline-color: Highlight;');
  });
});

describe('src/components/charts.css, the bar chart', () => {
  const rules = () => closeUp(stripComments(read('src/components/charts.css')));
  const FORCED = '@media (forced-colors: active)';
  const NARROW = '@container bar-chart (inline-size < 24rem)';
  /** The rules outside forced colors, where the look is drawn. */
  const look = () => outsideForcedColors(rules());
  const HORIZONTAL = ".bar-chart[data-orientation='horizontal'] .bar-chart-bar";
  const expectAll = (body, declarations, label) => {
    for (const declaration of declarations) expect(body, `${label}: ${declaration}`).toContain(declaration);
  };
  /** Every rule block of `css` that holds no nested block, as [selector, body]. */
  const blocks = (css) => [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map((m) => [m[1].trim(), m[2]]);

  it('lays a horizontal chart out as label, track and a max-content amount column', () => {
    const css = look();
    expectAll(
      blockAfter(css, '.bar-chart-rows {'),
      [
        'position: relative;',
        'display: grid;',
        // The label column as wide as the longest label up to 40%, an app's own share by a property.
        'grid-template-columns: fit-content(var(--bar-chart-label-size, 40%)) minmax(0, 1fr) max-content;',
        'column-gap: var(--spacing-part);',
        'direction: var(--chart-direction, ltr);',
      ],
      'rows',
    );
    // No row gap, so the gridlines behind the rows run unbroken.
    expect(blockAfter(css, '.bar-chart-rows {')).not.toMatch(/(?<![\w-])(?:row-)?gap\s*:/);
    expect(blockAfter(css, '.bar-chart-row {')).toContain('display: contents;');
    // A row is a 40px target at least, or as tall as its wrapped label.
    expectAll(
      blockAfter(css, '.bar-chart-track {'),
      ['position: relative;', 'min-block-size: var(--size-target);'],
      'track',
    );
    expectAll(
      blockAfter(css, '.bar-chart-category {'),
      [
        'align-self: center;',
        'color: var(--color-ink);',
        'overflow-wrap: anywhere;',
        'font-size: var(--text-small);',
      ],
      'label',
    );
    expect(blockAfter(css, '.bar-chart-category {')).not.toMatch(/text-overflow|line-clamp|nowrap/);
    expectAll(
      blockAfter(css, '.bar-chart-amounts {'),
      [
        'font-size: var(--text-small);',
        'font-variant-numeric: tabular-nums;',
        'color: var(--color-ink);',
        'text-align: end;',
      ],
      'amounts',
    );
    // The gridlines' layer spans every row's track, absolutely placed so it takes no cell from the rows. An
    // absolutely placed grid child with an auto end reaches the grid's padding edge, so both ends are given.
    expectAll(
      blockAfter(css, '.bar-chart-gridlines {'),
      [
        'position: absolute;',
        'inset: 0;',
        'grid-column: 2 / span 1;',
        'grid-row: 1 / span var(--bar-chart-rows, 1);',
      ],
      'gridlines',
    );
    expect(blockAfter(css, '.bar-chart-gridlines svg {')).toContain('scale: var(--chart-flip, 1) 1;');
    // The value labels and the readout keep to the track column; the readout to its row's track alone.
    expect(blockAfter(css, '.bar-chart-ticks {')).toContain('grid-column: 2;');
    expectAll(
      blockAfter(css, '.bar-chart-readout[data-place] {'),
      ['grid-column: 2 / span 1;', 'grid-row: var(--bar-chart-row, 1) / span 1;', 'pointer-events: none;'],
      'readout',
    );
    // No absolutely placed part leaves an end of its grid area to auto.
    for (const selector of ['.bar-chart-gridlines {', '.bar-chart-readout[data-place] {'])
      for (const [, value] of blockAfter(css, selector).matchAll(/grid-(?:column|row):\s*([^;]+);/g))
        expect(value, selector).toContain('/');
  });

  it('draws a horizontal bar at most 24px thick, centred in its row, and 2px from the other bar of a pair', () => {
    expectAll(
      blockAfter(look(), `${HORIZONTAL} {`),
      [
        '--bar-chart-thickness: min(1.5rem, calc((2rem - (var(--bar-chart-group, 1) - 1) * 2px) / var(--bar-chart-group, 1)));',
        '--bar-chart-offset: calc((var(--bar-chart-index, 0) - (var(--bar-chart-group, 1) - 1) / 2) * (var(--bar-chart-thickness) + 2px));',
        'position: absolute;',
        'inset-block-start: 50%;',
        'block-size: var(--bar-chart-thickness);',
        'translate: 0 calc(-50% + var(--bar-chart-offset, 0px));',
      ],
      'bar',
    );
    expect(blockAfter(look(), '.bar-chart-bar {')).toContain(
      'background-color: var(--bar-chart-color, var(--color-ink));',
    );
  });

  it('colors a bar by its series, never by a state', () => {
    const css = look();
    for (const [name, token] of [
      ['ink', '--color-ink'],
      ['slate', '--color-slate'],
      ['gain', '--color-gain'],
      ['chart-1', '--color-chart-1'],
      ['chart-2', '--color-chart-2'],
      ['chart-3', '--color-chart-3'],
      ['chart-4', '--color-chart-4'],
    ])
      expect(blockAfter(css, `.bar-chart [data-color='${name}'] {`), name).toContain(
        `--bar-chart-color: var(${token});`,
      );
    // The error color is a failed load's message alone; no bar draws a reserved color.
    const reserved = /--color-(?:error|success|warning|clay|signal|taupe)/;
    const uses = blocks(css).filter(([, body]) => reserved.test(body));
    expect(uses.map(([selector]) => selector).filter((selector) => selector.includes('bar-chart'))).toEqual([
      `${chartList('message')}[data-tone='error']`,
    ]);
  });

  // The chart palette is a fill, a legend key or a swatch, never text (spec 5.3): values, labels and legends stay
  // ink and slate, and the mark beside them carries the series. Nothing in core sets a color from a slot.
  it('never sets a text color from the chart palette, anywhere in core', () => {
    const sources = [
      ['src/base.css', read('src/base.css')],
      ...components.map((file) => [file, read(`src/components/${file}`)]),
    ];
    for (const [file, source] of sources) {
      const text = closeUp(stripComments(source));
      expect(text, file).not.toMatch(
        /(?<![\w-])(?:-webkit-text-fill-|caret-|text-decoration-)?color\s*:[^;{}]*--color-chart-/,
      );
      // Nor through the bar's own variable, which holds a slot.
      expect(text, file).not.toMatch(/(?<![\w-])color\s*:[^;{}]*--bar-chart-color/);
    }
    // The slots are read by the series' variable alone, in charts.css and nowhere else.
    const readers = sources.filter(([, source]) => stripComments(source).includes('--color-chart-'));
    expect(readers.map(([file]) => file)).toEqual(['charts.css']);
    expect(closeUp(stripComments(look())).match(/var\(--color-chart-\d\)/g)).toHaveLength(4);
  });

  it('rounds only the data end, with the micro radius, logically', () => {
    const css = look();
    const positive = blockAfter(css, `${HORIZONTAL}[data-sign='positive'] {`);
    const negative = blockAfter(css, `${HORIZONTAL}[data-sign='negative'] {`);
    expectAll(
      positive,
      ['border-start-end-radius: var(--radius-micro);', 'border-end-end-radius: var(--radius-micro);'],
      'positive',
    );
    expectAll(
      negative,
      ['border-start-start-radius: var(--radius-micro);', 'border-end-start-radius: var(--radius-micro);'],
      'negative',
    );
    // The end at zero stays square, and no bar is rounded all round.
    expect(positive).not.toContain('-start-radius');
    expect(negative).not.toContain('-end-radius');
    expect(blockAfter(css, `${HORIZONTAL} {`)).not.toContain('border-radius');
    expect(blockAfter(css, '.bar-chart-bar {')).not.toContain('border-radius');
  });

  it('draws any nonzero bar at least 1px', () => {
    expect(blockAfter(look(), `${HORIZONTAL}[data-nonzero] {`)).toContain('min-inline-size: 1px;');
  });

  it('rings a focused bar with the token ring, which follows its corners, and the group that holds focus', () => {
    for (const selector of [
      '.bar-chart-bar:focus-visible {',
      ':is(.bar-chart-rows, .bar-chart-plot):focus-visible {',
    ])
      expectAll(
        blockAfter(look(), selector),
        [
          'outline: var(--focus-ring-width) solid var(--focus-ring-color);',
          'outline-offset: var(--focus-ring-offset);',
        ],
        selector,
      );
  });

  it('dims other rows and bands to 40% under a pointer only', () => {
    const css = look();
    const dimmed =
      ':is(.bar-chart-rows, .bar-chart-plot)[data-pointer] :is(.bar-chart-row, .bar-chart-band):not([data-active]) .bar-chart-bar {';
    expect(blockAfter(css, dimmed)).toContain('opacity: 0.4;');
    // The only opacity in the bar chart is the pointer's, and nothing moves to it.
    const dims = blocks(css).filter(
      ([selector, body]) => selector.includes('bar-chart') && /(?<![\w-])opacity\s*:/.test(body),
    );
    expect(dims.map(([selector]) => `${selector} {`)).toEqual([dimmed]);
  });

  it('draws the zero line in the boundary color where the domain crosses zero, and the frame otherwise', () => {
    const css = look();
    expect(blockAfter(css, '.bar-chart-baseline[data-crosses] {')).toContain(
      'stroke: var(--color-boundary);',
    );
    // At the domain's edge it is the shared baseline: the frame color, a cue.
    expect(blockAfter(css, `${chartList('baseline')} {`)).toContain('stroke: var(--color-frame);');
  });

  it('folds labels above the bars under 24rem, as a size container with no intrinsic width', () => {
    const css = look();
    // A size container's intrinsic inline size is 0, never a stand-in: its holder gives it a width.
    expectAll(
      blockAfter(css, '.bar-chart {'),
      [
        'container: bar-chart / inline-size;',
        'contain-intrinsic-inline-size: 0;',
        '-webkit-print-color-adjust: exact;',
        'print-color-adjust: exact;',
      ],
      'figure',
    );
    const narrow = blockAfter(css, NARROW);
    expect(narrow).not.toBe('');
    expect(blockAfter(narrow, '.bar-chart-rows {')).toContain(
      'grid-template-columns: minmax(0, 1fr) max-content;',
    );
    expectAll(
      blockAfter(narrow, '.bar-chart-category {'),
      [
        'grid-column: 1 / -1;',
        'justify-self: start;',
        // Over the gridlines it crosses, in the surface it sits on.
        'position: relative;',
        'background-color: var(--chart-surface, var(--color-lifted));',
      ],
      'label',
    );
    expectAll(
      blockAfter(narrow, '.bar-chart-gridlines {'),
      ['grid-column: 1 / span 1;', 'grid-row: 1 / span var(--bar-chart-rows-narrow, 2);'],
      'gridlines',
    );
    expect(blockAfter(narrow, '.bar-chart-ticks {')).toContain('grid-column: 1;');
    expectAll(
      blockAfter(narrow, '.bar-chart-readout[data-place] {'),
      ['grid-column: 1 / span 1;', 'grid-row: var(--bar-chart-row-narrow, 2) / span 1;'],
      'readout',
    );
    // The query reads the chart's own width, never the viewport's.
    expect(css).not.toMatch(/@media[^{]*width/);
  });

  it("places a linked bar's target over its band, drawing nothing, its hold kept from the link menu", () => {
    const css = look();
    expectAll(
      blockAfter(css, '.bar-chart-hit {'),
      ['position: absolute;', '-webkit-touch-callout: none;'],
      'target',
    );
    // A link's target shows the link cursor; a target with no href, a bar's own part of a band of links, the
    // plot's, which is the press cursor only where bars press.
    expect(blockAfter(css, '.bar-chart-hit {')).not.toContain('cursor');
    expect(blockAfter(css, '.bar-chart-hit[href] {')).toContain('cursor: pointer;');
    // It draws nothing in any mode: no fill, border, outline or shadow of its own.
    for (const [selector, body] of blocks(rules()).filter(([selector]) => selector.includes('bar-chart-hit')))
      expect(body, selector).not.toMatch(
        /(?<![\w-])(?:background|border|outline|box-shadow|color)(?:-[\w-]+)?\s*:/,
      );
    // Standing up, through the bars' box and the room above and below it.
    expect(blockAfter(css, ".bar-chart[data-orientation='vertical'] .bar-chart-hit {")).toContain(
      'inset-block: calc(-1 * var(--bar-chart-room-start, 0px)) calc(-1 * var(--bar-chart-room-end, 0px));',
    );
    // Lying down, the row's grid area from the name to the amounts, both ends given: the whole for its first
    // bar, the half under the middle for a second, and the track for a segment on another.
    const lying = ".bar-chart[data-orientation='horizontal'] .bar-chart-hit";
    expectAll(
      blockAfter(css, `${lying} {`),
      ['grid-column: 1 / -1;', 'grid-row: var(--bar-chart-row, 1) / span 1;', 'inset: 50% 0 0;'],
      'second',
    );
    expect(blockAfter(css, `${lying}[data-whole] {`)).toContain('inset: 0;');
    const run =
      ".bar-chart[data-layout='stacked'][data-orientation='horizontal'] .bar-chart-hit:not([data-whole]) {";
    expectAll(blockAfter(css, run), ['grid-column: 2 / span 1;', 'inset: 0;'], 'run');
    const narrow = blockAfter(css, NARROW);
    expect(blockAfter(narrow, `${lying} {`)).toContain('grid-row: var(--bar-chart-row-narrow, 2) / span 1;');
    expect(blockAfter(narrow, `${lying}[data-whole] {`)).toContain('grid-row-end: span 2;');
    expect(blockAfter(narrow, run)).toContain('grid-column: 1 / span 1;');
    // Bars that are buttons show their press over the whole plot.
    expect(blockAfter(css, ':is(.bar-chart-rows, .bar-chart-plot)[data-press] {')).toContain(
      'cursor: pointer;',
    );
  });

  it('keeps amounts left to right and isolated', () => {
    const amount = blockAfter(look(), '.bar-chart-amount {');
    expectAll(
      amount,
      [
        'direction: ltr;',
        'unicode-bidi: isolate;',
        'text-align: -webkit-match-parent;',
        'text-align: match-parent;',
        'white-space: nowrap;',
      ],
      'amount',
    );
    // Chromium knows only the prefixed name and Firefox only the standard one, so both are written, in order.
    expect(amount.indexOf('text-align: match-parent;')).toBeGreaterThan(
      amount.indexOf('text-align: -webkit-match-parent;'),
    );
  });

  it("draws the states in the rows' place, as tall as the rows, and the error in the error color", () => {
    const css = look();
    expectAll(
      blockAfter(css, '.bar-chart-state {'),
      ['grid-column: 1 / -1;', 'min-block-size: calc(var(--bar-chart-rows, 4) * var(--size-target));'],
      'state',
    );
    // The message is shared with the line chart's states.
    expect(blockAfter(css, `${chartList('message')} {`)).toContain('color: var(--color-slate);');
    expect(blockAfter(css, `${chartList('message')}[data-tone='error'] {`)).toContain(
      'color: var(--color-error);',
    );
    // The loading bars are square at zero, as a bar is.
    expectAll(
      blockAfter(css, '.bar-chart-track > .bar-chart-skeleton {'),
      ['border-start-start-radius: 0;', 'border-end-start-radius: 0;', 'inset-inline-start: 0;'],
      'skeleton',
    );
    expectAll(
      blockAfter(css, '.bar-chart-status {'),
      ['position: absolute;', 'width: 1px;', 'height: 1px;', 'overflow: hidden;', 'clip-path: inset(50%);'],
      'status',
    );
  });

  it('names forced colors for bars, the zero line, the gridlines and the focus ring', () => {
    const forced = blockAfter(rules(), FORCED);
    const bars = blockAfter(forced, '.bar-chart-bar, .bar-chart-key {');
    expectAll(bars, ['forced-color-adjust: none;', 'background-color: CanvasText;'], 'bars');
    expect(
      blockAfter(forced, ':is(.bar-chart-row, .bar-chart-band)[data-active] .bar-chart-bar {'),
    ).toContain('background-color: Highlight;');
    expect(
      blockAfter(
        forced,
        '.bar-chart-bar:focus-visible, :is(.bar-chart-rows, .bar-chart-plot):focus-visible {',
      ),
    ).toContain('outline-color: Highlight;');
    expect(blockAfter(forced, '.bar-chart-baseline[data-crosses] {')).toContain('stroke: CanvasText;');
    expect(
      blockAfter(
        forced,
        `.line-chart-line[data-series='2'], ${chartList('grid')}, ${chartList('baseline')} {`,
      ),
    ).toContain('stroke: GrayText;');
  });
});

describe('src/components/charts.css, the bar chart standing up, grouped and hatched', () => {
  const rules = () => closeUp(stripComments(read('src/components/charts.css')));
  const FORCED = '@media (forced-colors: active)';
  const look = () => outsideForcedColors(rules());
  const VERTICAL = ".bar-chart[data-orientation='vertical']";
  const PLACED = `${VERTICAL} :is(.bar-chart-bar, .bar-chart-value, .bar-chart-skeleton)`;
  const STRIPES =
    'repeating-linear-gradient(45deg, var(--bar-chart-color, var(--color-ink)) 0 2px, transparent 2px 6px)';
  const expectAll = (body, declarations, label) => {
    for (const declaration of declarations) expect(body, `${label}: ${declaration}`).toContain(declaration);
  };
  /** The body of the at-rule whose header is `header`, among several of the same kind. */
  const atRule = (css, header) => blockAfter(css, `${header} {`);

  it('computes vertical thickness and group placement from the band and group properties', () => {
    const css = look();
    // The plan's calc, with each property read with a fallback: at most 24px and 60% of the band, 2px between
    // the bars of a group, the group centred on its band. 100% resolves where it is used, on the bar, against
    // the bars' box, which is as wide as the plot.
    expectAll(
      blockAfter(css, `${PLACED} {`),
      [
        '--bar-chart-thickness: min(1.5rem, calc((100% / var(--bar-chart-bands, 1) * 0.6 - (var(--bar-chart-group, 1) - 1) * 2px) / var(--bar-chart-group, 1)));',
        '--bar-chart-start: calc(var(--bar-chart-centre, 50%) - (var(--bar-chart-group, 1) * var(--bar-chart-thickness) + (var(--bar-chart-group, 1) - 1) * 2px) / 2 + var(--bar-chart-index, 0) * (var(--bar-chart-thickness) + 2px));',
        'position: absolute;',
      ],
      'placed',
    );
    expectAll(
      blockAfter(css, `${VERTICAL} .bar-chart-bar {`),
      ['inline-size: var(--bar-chart-thickness);', 'inset-inline-start: var(--bar-chart-start);'],
      'bar',
    );
    // The plot is a grid of the labels' column, as wide as its widest label, and the bars' box beside it, with
    // the category labels under the bars; the bars, the gridlines and the labels share the bars' box's scale.
    expectAll(
      blockAfter(css, '.bar-chart-plot {'),
      [
        'position: relative;',
        'display: grid;',
        'grid-template-columns: max-content minmax(0, 1fr);',
        'direction: var(--chart-direction, ltr);',
      ],
      'plot',
    );
    expectAll(
      blockAfter(css, '.bar-chart-bars {'),
      ['position: relative;', 'grid-column: 2;', 'grid-row: 1;'],
      'bars',
    );
    expectAll(
      blockAfter(css, '.bar-chart-plot > .bar-chart-gridlines {'),
      [
        'grid-column: 1 / span 2;',
        'grid-row: 1 / span 1;',
        'inset-block: var(--bar-chart-room-start, 0) var(--bar-chart-room-end, 0);',
      ],
      'gridlines',
    );
    // No absolutely placed part leaves an end of its grid area to auto.
    for (const [, value] of blockAfter(css, '.bar-chart-plot > .bar-chart-gridlines {').matchAll(
      /grid-(?:column|row):\s*([^;]+);/g,
    ))
      expect(value).toContain('/');
    expectAll(
      blockAfter(css, '.bar-chart-plot > .bar-chart-categories {'),
      ['grid-column: 2;', 'grid-row: 2;'],
      'categories',
    );
    // A band holds its bars and takes no box, so they are placed in the bars' box.
    expect(blockAfter(css, '.bar-chart-band {')).toContain('display: contents;');
    // The loading bands stand in the same places, one to a band, square at zero.
    expectAll(
      blockAfter(css, '.bar-chart-bars > .bar-chart-skeleton {'),
      [
        '--bar-chart-group: 1;',
        '--bar-chart-index: 0;',
        'inset-block-end: 0;',
        'inline-size: var(--bar-chart-thickness);',
        'inset-inline-start: var(--bar-chart-start);',
        'border-end-start-radius: 0;',
        'border-end-end-radius: 0;',
      ],
      'skeleton',
    );
    // An empty or failed vertical chart draws its message over the plot, at the plot's height.
    expectAll(
      blockAfter(css, '.bar-chart-bars > .bar-chart-state {'),
      ['position: absolute;', 'inset: 0;', 'min-block-size: 0;'],
      'state',
    );
  });

  it('rounds only the data end of a vertical bar, with the micro radius, and draws a nonzero bar at least 1px', () => {
    const css = look();
    const positive = blockAfter(css, `${VERTICAL} .bar-chart-bar[data-sign='positive'] {`);
    const negative = blockAfter(css, `${VERTICAL} .bar-chart-bar[data-sign='negative'] {`);
    expectAll(
      positive,
      ['border-start-start-radius: var(--radius-micro);', 'border-start-end-radius: var(--radius-micro);'],
      'positive',
    );
    expectAll(
      negative,
      ['border-end-start-radius: var(--radius-micro);', 'border-end-end-radius: var(--radius-micro);'],
      'negative',
    );
    expect(positive).not.toContain('border-end-');
    expect(negative).not.toContain('border-start-');
    expect(blockAfter(css, `${VERTICAL} .bar-chart-bar[data-nonzero] {`)).toContain('min-block-size: 1px;');
  });

  it("draws hatched bars with Meter's stripes, a border and stripes in forced colors", () => {
    const css = look();
    const hatched = blockAfter(css, ".bar-chart-bar[data-look='hatched'] {");
    expectAll(
      hatched,
      [
        'border: 1px solid var(--bar-chart-color, var(--color-ink));',
        'background-color: transparent;',
        `background-image: ${STRIPES};`,
      ],
      'hatched',
    );
    // Under 4px across, the stripes are noise: their tile is the box scaled from what it has past 4px, nothing
    // at 4px or less, so the bar is its outline alone.
    expect(hatched).toContain('background-size: max(0px, (100% - 4px) * 100) max(0px, (100% - 4px) * 100);');
    // A zero is a bar of no length, so a hatched one draws no border either.
    expect(blockAfter(css, ".bar-chart-bar[data-sign='zero'] {")).toContain('border-width: 0;');
    // Meter's hatch, 2px every 6px at 45 degrees, in the same words.
    const meter = closeUp(stripComments(read('src/components/meter.css')));
    expect(blockAfter(meter, ".meter-swatch[data-look='hatched'] {")).toContain(
      'repeating-linear-gradient(45deg, var(--meter-ink) 0 2px, transparent 2px 6px)',
    );
    // The legend key and the readout swatch of a hatched series are hatched too.
    const key = blockAfter(
      css,
      ":is(.bar-chart-legend-item, .bar-chart-readout-item)[data-look='hatched'] .bar-chart-key {",
    );
    expectAll(
      key,
      ['border: 1px solid var(--bar-chart-color, var(--color-ink));', `background-image: ${STRIPES};`],
      'key',
    );
    expect(blockAfter(css, '.bar-chart-key {')).toContain('box-sizing: border-box;');
    // Its amount and its value label are slate, never a chart color.
    expect(blockAfter(css, ":is(.bar-chart-amount, .bar-chart-value)[data-look='hatched'] {")).toContain(
      'color: var(--color-slate);',
    );
    // Solid against striped in forced colors: the current bar CanvasText, the previous period CanvasText
    // stripes on canvas in a CanvasText border, and Highlight for the active band's.
    const forced = blockAfter(rules(), FORCED);
    expectAll(
      blockAfter(
        forced,
        ".bar-chart-bar[data-look='hatched'], :is(.bar-chart-legend-item, .bar-chart-readout-item)[data-look='hatched'] .bar-chart-key {",
      ),
      [
        'border-color: CanvasText;',
        'background-color: canvas;',
        'background-image: repeating-linear-gradient(45deg, CanvasText 0 2px, canvas 2px 6px);',
      ],
      'forced hatched',
    );
    expectAll(
      blockAfter(
        forced,
        ":is(.bar-chart-row, .bar-chart-band)[data-active] .bar-chart-bar[data-look='hatched'] {",
      ),
      [
        'border-color: Highlight;',
        'background-color: canvas;',
        'background-image: repeating-linear-gradient(45deg, Highlight 0 2px, canvas 2px 6px);',
      ],
      'forced active hatched',
    );
  });

  it('reserves room for value labels by line height only when shown', () => {
    const css = look();
    // A line of the small step and the 4px gap, the room a figure outside a bar's end takes.
    const line = 'calc(0.25rem + var(--text-small) * var(--text-small--line-height));';
    expect(blockAfter(css, '.bar-chart-plot[data-room-start] {')).toContain(
      `--bar-chart-room-start: ${line}`,
    );
    expect(blockAfter(css, '.bar-chart-plot[data-room-end] {')).toContain(`--bar-chart-room-end: ${line}`);
    // The room is outside the bars' box, and the gridlines and their labels keep to the bars' height.
    const room = 'var(--bar-chart-room-start, 0) var(--bar-chart-room-end, 0);';
    expect(blockAfter(css, '.bar-chart-bars {')).toContain(`margin-block: ${room}`);
    expect(blockAfter(css, '.bar-chart-y-labels {')).toContain(`padding-block: ${room}`);
    expect(blockAfter(css, '.bar-chart-plot {')).not.toMatch(/padding|margin/);
    const value = blockAfter(css, '.bar-chart-value {');
    expectAll(
      value,
      [
        'position: absolute;',
        'inset-inline-start: calc(var(--bar-chart-start) + var(--bar-chart-thickness) / 2);',
        'margin-block-end: 0.25rem;',
        'translate: calc(var(--chart-flip, 1) * -50%) 0;',
        'font-size: var(--text-small);',
        'font-variant-numeric: tabular-nums;',
        'white-space: nowrap;',
        'color: var(--color-ink);',
        'pointer-events: none;',
      ],
      'value',
    );
    expect(blockAfter(css, ".bar-chart-value[data-sign='negative'] {")).toContain('margin-block: 0.25rem 0;');
    // The figure reads left to right inside its isolate, while its box is placed in the chart's direction.
    expectAll(
      blockAfter(css, '.bar-chart-value-text {'),
      ['direction: ltr;', 'unicode-bidi: isolate;'],
      'value text',
    );
  });

  it("stands the gridlines' labels in a column of their own, each above its line, as a line chart places them", () => {
    const css = look();
    expectAll(
      blockAfter(css, '.bar-chart-y-labels {'),
      [
        'display: grid;',
        'grid-column: 1;',
        'grid-row: 1;',
        'grid-template-rows: minmax(0, 1fr);',
        'padding-inline-end: var(--spacing-part);',
        'pointer-events: none;',
      ],
      'labels',
    );
    // In flow, so the column is as wide as the widest label, and all in one cell, moved by their percentages.
    expectAll(
      blockAfter(css, '.bar-chart-y-labels > span {'),
      ['position: relative;', 'grid-area: 1 / 1;', 'align-self: start;'],
      'label',
    );
    // The shared rule raises it above its line.
    expect(blockAfter(css, `${chartList('y-label')} {`)).toContain('translate: 0 -100%;');
  });

  it('clamps category labels at two lines', () => {
    const css = look();
    expectAll(
      blockAfter(css, '} .bar-chart-categories {'),
      [
        'display: grid;',
        'grid-template-columns: repeat(var(--bar-chart-bands, 1), minmax(0, 1fr));',
        'direction: var(--chart-direction, ltr);',
        'color: var(--color-slate);',
      ],
      'categories',
    );
    const label = blockAfter(css, '.bar-chart-band-label {');
    expectAll(
      label,
      [
        'display: -webkit-box;',
        '-webkit-box-orient: vertical;',
        '-webkit-line-clamp: 2;',
        'overflow: hidden;',
        'text-align: center;',
      ],
      'label',
    );
    // Never rotated.
    expect(css).not.toMatch(/rotate/);
    // Time ticks are placed on their band's centre on one line, the first and the last kept inside the plot.
    expect(blockAfter(css, ".bar-chart-categories[data-bands='time'] {")).toContain('display: block;');
    expectAll(
      blockAfter(css, ".bar-chart-categories[data-bands='time'] .bar-chart-band-label {"),
      [
        'position: absolute;',
        'display: block;',
        'white-space: nowrap;',
        'translate: calc(var(--chart-flip, 1) * -50%) 0;',
      ],
      'time',
    );
    expect(
      blockAfter(css, ".bar-chart-categories[data-bands='time'] .bar-chart-band-label[data-edge='start'] {"),
    ).toContain('translate: none;');
    expect(
      blockAfter(css, ".bar-chart-categories[data-bands='time'] .bar-chart-band-label[data-edge='end'] {"),
    ).toContain('translate: calc(var(--chart-flip, 1) * -100%) 0;');
  });

  it('runs the vertical container queries at 30rem and 24rem', () => {
    const css = look();
    const under30 = atRule(css, '@container bar-chart (inline-size < 30rem)');
    expect(under30).not.toBe('');
    expect(blockAfter(under30, '.bar-chart-band-label {')).toContain('-webkit-line-clamp: 1;');
    expect(blockAfter(under30, '.bar-chart-value:not([data-keep]) {')).toContain('display: none;');
    // A centred readout takes three quarters of a narrow plot, so a figure keeps to one line.
    expect(blockAfter(under30, ".bar-chart-plot .bar-chart-readout[data-align='center'] {")).toContain(
      'max-width: min(16rem, 75% - var(--spacing-part));',
    );
    const under24 = atRule(css, '@container bar-chart (inline-size < 24rem)');
    // Every third label only past eight bands, which the render marks.
    expect(
      blockAfter(
        under24,
        ".bar-chart-categories[data-dense][data-bands='category'] .bar-chart-band-label:not([data-third]) {",
      ),
    ).toContain('visibility: hidden;');
  });

  it('keeps a readout figure on one line, and breaks a series name only between words', () => {
    const css = look();
    expect(blockAfter(css, '.bar-chart-readout-item > strong {')).toContain('white-space: nowrap;');
    expect(blockAfter(css, '.bar-chart-readout-item > strong + span {')).toContain('overflow-wrap: normal;');
  });

  it('dims other bands under a pointer and lights the active band in forced colors', () => {
    const forced = blockAfter(rules(), FORCED);
    expect(
      blockAfter(forced, ':is(.bar-chart-row, .bar-chart-band)[data-active] .bar-chart-bar {'),
    ).toContain('background-color: Highlight;');
  });
});

describe('src/components/charts.css, the stacked bar chart', () => {
  const rules = () => closeUp(stripComments(read('src/components/charts.css')));
  const FORCED = '@media (forced-colors: active)';
  const look = () => outsideForcedColors(rules());
  const SURFACE = '2px solid var(--bar-chart-gap, var(--chart-surface, var(--color-lifted)));';
  const COLOR = 'var(--bar-chart-color, var(--color-ink))';
  const stripes = (angle) => `repeating-linear-gradient(${angle}deg, ${COLOR} 0 2px, transparent 2px 6px)`;
  const TEXTURED =
    ":is(.bar-chart-bar[data-series]:not([data-sign='zero']), [data-series] > .bar-chart-key) {";
  const expectAll = (body, declarations, label) => {
    for (const declaration of declarations) expect(body, `${label}: ${declaration}`).toContain(declaration);
  };

  it('rounds only outer segments and gaps the rest by 2px of the surface', () => {
    const css = look();
    // Inner joins are square: only the outermost segment of each sign keeps the data end's micro radius. Written
    // after the radius rules of both faces, which it meets at the same specificity.
    const square = ".bar-chart[data-layout='stacked'] .bar-chart-bar:not([data-outer]) {";
    expect(blockAfter(css, square)).toContain('border-radius: 0;');
    for (const rounded of [
      ".bar-chart[data-orientation='horizontal'] .bar-chart-bar[data-sign='negative'] {",
      ".bar-chart[data-orientation='vertical'] .bar-chart-bar[data-sign='negative'] {",
    ])
      expect(css.indexOf(square), rounded).toBeGreaterThan(css.indexOf(rounded));
    // Each segment that stands on another has a 2px border of the surface on its edge toward zero, inside its
    // own length, so the stack's total stays exact; in the stacking direction of its sign and its face.
    // Each gap rule also places the textured outline's zero-ward side: along the block edge standing up, and
    // along the inline edge lying down, its side taken from the chart's direction.
    const gaps = [
      ['vertical', 'positive', 'border-block-end', '0 100%', '100% 1px'],
      ['vertical', 'negative', 'border-block-start', '0 0', '100% 1px'],
      [
        'horizontal',
        'positive',
        'border-inline-start',
        'calc(50% - 50% * var(--chart-flip, 1)) 0',
        '1px 100%',
      ],
      ['horizontal', 'negative', 'border-inline-end', 'calc(50% + 50% * var(--chart-flip, 1)) 0', '1px 100%'],
    ];
    for (const [face, sign, side, at, size] of gaps) {
      const selector = `.bar-chart[data-orientation='${face}'] .bar-chart-bar[data-joined][data-sign='${sign}'] {`;
      expectAll(
        blockAfter(css, selector),
        [`${side}: ${SURFACE}`, `--bar-chart-edge-at: ${at};`, `--bar-chart-edge-size: ${size};`],
        selector,
      );
      // After the textures' outline, so the gap takes its edge at the same specificity.
      expect(css.indexOf(selector), selector).toBeGreaterThan(
        css.indexOf(`.bar-chart[data-texture] ${TEXTURED}`),
      );
    }
    // The bar is a border box, so the gap is inside the length the render writes.
    expect(blockAfter(css, '.bar-chart-bar {')).toContain('box-sizing: border-box;');
    // A segment on another is its gap and at least 1px of its color, 3px, so a small amount is never a gap alone.
    expect(
      blockAfter(css, ".bar-chart[data-orientation='vertical'] .bar-chart-bar[data-joined][data-nonzero] {"),
    ).toContain('min-block-size: 3px;');
    expect(
      blockAfter(
        css,
        ".bar-chart[data-orientation='horizontal'] .bar-chart-bar[data-joined][data-nonzero] {",
      ),
    ).toContain('min-inline-size: 3px;');
  });

  it('draws the four textures and slate, and turns them on in forced colors', () => {
    const css = look();
    // The method's two directions: the first solid, the second 45 degrees, the third 135, the fourth both, and
    // the fifth solid, in slate. Stripes 2px every 6px, Meter's hatch, in the series' own color.
    expectAll(
      blockAfter(css, ".bar-chart [data-series='2'] {"),
      [`--bar-chart-texture: ${stripes(45)};`, '--bar-chart-fill: transparent;'],
      'second',
    );
    expectAll(
      blockAfter(css, ".bar-chart [data-series='3'] {"),
      [`--bar-chart-texture: ${stripes(135)};`, '--bar-chart-fill: transparent;'],
      'third',
    );
    expectAll(
      blockAfter(css, ".bar-chart [data-series='4'] {"),
      [`--bar-chart-texture: ${stripes(45)}, ${stripes(135)};`, '--bar-chart-fill: transparent;'],
      'fourth',
    );
    expect(css).not.toContain(".bar-chart [data-series='1']");
    expect(css).not.toContain(".bar-chart [data-series='5']");
    // On request: a 1px border in the series' color, so a textured bar keeps its outline where stripes do not
    // print, and the keys of the legend and the readout with it. A zero draws nothing.
    const textured = [
      'border: 1px solid var(--bar-chart-color, var(--color-ink));',
      'background-color: var(--bar-chart-fill, var(--bar-chart-color, var(--color-ink)));',
      // First a layer of the color along the zero-ward edge, of no size but on a segment the gap rules place.
      'background-image: linear-gradient(var(--bar-chart-color, var(--color-ink)), var(--bar-chart-color, var(--color-ink))), var(--bar-chart-texture, none);',
      'background-position: var(--bar-chart-edge-at, 0 0), 0 0, 0 0;',
      'background-size: var(--bar-chart-edge-size, 0 0), auto, auto;',
      'background-repeat: no-repeat, repeat, repeat;',
    ];
    expectAll(blockAfter(css, `.bar-chart[data-texture] ${TEXTURED}`), textured, 'on request');
    // Always in forced colors: one text color and four looks, the fifth GrayText, the active band Highlight,
    // and the gaps the page's own color through the surface variable.
    const forced = blockAfter(rules(), FORCED);
    expectAll(blockAfter(forced, `.bar-chart ${TEXTURED}`), textured, 'forced');
    expect(blockAfter(forced, '.bar-chart [data-series] {')).toContain('--bar-chart-color: CanvasText;');
    expect(blockAfter(forced, ".bar-chart [data-series='5'] {")).toContain('--bar-chart-color: GrayText;');
    expect(
      blockAfter(forced, ':is(.bar-chart-row, .bar-chart-band)[data-active] .bar-chart-bar[data-series] {'),
    ).toContain('--bar-chart-color: Highlight;');
    expect(blockAfter(forced, ".bar-chart[data-layout='stacked'] {")).toContain('--bar-chart-gap: canvas;');
    // The active band's fifth is a Highlight outline over the page, so it never merges with the first's fill.
    expect(
      blockAfter(
        forced,
        ":is(.bar-chart-row, .bar-chart-band)[data-active] .bar-chart-bar[data-series='5'] {",
      ),
    ).toContain('--bar-chart-fill: canvas;');
    // Never outside forced colors: there the gap is the surface the app sets.
    expect(css).not.toMatch(/--bar-chart-gap\s*:/);
    // After the bars' CanvasText fill and the active band's Highlight, which it outranks.
    expect(forced.indexOf(`.bar-chart ${TEXTURED}`)).toBeGreaterThan(
      forced.indexOf(':is(.bar-chart-row, .bar-chart-band)[data-active] .bar-chart-bar {'),
    );
  });
});

describe('src/components/charts.css, the line chart states', () => {
  const rules = () => closeUp(stripComments(read('src/components/charts.css')));
  const look = () => outsideForcedColors(rules());

  it("draws a state in the plot's own space, through the shared message", () => {
    const css = look();
    expectAllIn(blockAfter(css, '.line-chart-plot > .line-chart-skeleton {'), [
      'position: absolute;',
      'inset: 0;',
      'inline-size: auto;',
      'block-size: auto;',
    ]);
    expectAllIn(blockAfter(css, '.line-chart-state {'), [
      'position: absolute;',
      'inset: 0;',
      'display: grid;',
      'place-items: center;',
    ]);
    expect(blockAfter(css, `${chartList('message')} {`)).toContain('text-align: center;');
  });
});

/** Each declaration in `body`. */
function expectAllIn(body, declarations) {
  for (const declaration of declarations) expect(body, declaration).toContain(declaration);
}

describe('src/components/search-field.css', () => {
  // The rules without their comments, with their whitespace closed up.
  const rules = () => closeUp(stripComments(read('src/components/search-field.css')));

  it('pads the input 3rem at both ends with one class, as a block without the search appearance', () => {
    // One class, imported after input.css, beats the input's padding by order and none of its states.
    const input = blockAfter(rules(), '.search-field-input {');
    expect(input).toContain('padding-inline: 3rem;');
    // A block, so the control is as tall as the input and no line box around it adds a strut.
    expect(input).toContain('display: block;');
    // WebKit's searchfield appearance can override the pill's padding and corners.
    expect(input).toContain('appearance: none;');
    expect(blockAfter(rules(), '.search-field-control {')).not.toMatch(/line-height|display/);
  });

  it('hides the browser cancel button, so there is one clear control', () => {
    expect(blockAfter(rules(), '.search-field-input::-webkit-search-cancel-button {')).toContain(
      'appearance: none;',
    );
  });

  it('hides the clear button while the field is empty', () => {
    expect(blockAfter(rules(), '.search-field[data-empty] .search-field-clear {')).toContain(
      'display: none;',
    );
  });

  it('hides the clear button on a read-only field, whose text cannot be cleared', () => {
    expect(blockAfter(rules(), '.search-field[data-readonly] .search-field-clear {')).toContain(
      'display: none;',
    );
  });

  it('draws the placeholder slate only without a visible label, and never while disabled', () => {
    const css = rules();
    expect(
      blockAfter(
        css,
        '.search-field[data-unlabelled]:not([data-disabled]) .search-field-input::placeholder {',
      ),
    ).toContain('color: var(--color-slate);');
    expect(css.match(/::placeholder/g)).toHaveLength(1);
  });

  it("keeps the input's hover edge while the pointer is on the clear button, with one class of weight", () => {
    const hover = blockAfter(rules(), '@media (hover: hover)');
    const edge = blockAfter(
      hover,
      '.search-field-input:where(.search-field-control:has(> .search-field-clear:is(:hover, [data-hovered]):not(:disabled, [data-disabled])) > *) {',
    );
    // The value the input's own hover draws, so the edge does not change as the pointer crosses to the button.
    const inputHover = blockAfter(
      blockAfter(closeUp(stripComments(read('src/components/input.css'))), '@media (hover: hover)'),
      '.input:is(:hover, [data-hovered]) {',
    );
    expect(inputHover).toContain('border-color: color-mix(in srgb, var(--color-ink) 65%, transparent);');
    expect(edge.trim()).toBe('border-color: color-mix(in srgb, var(--color-ink) 65%, transparent);');
  });

  it('never mirrors the magnifier', () => {
    const css = rules();
    expect(css).not.toContain('scale');
    expect(css).not.toContain('rtl');
  });

  it('draws the icon CanvasText in forced colors', () => {
    const forced = blockAfter(rules(), '@media (forced-colors: active)');
    expect(blockAfter(forced, '.search-field-icon {')).toContain('color: CanvasText;');
    expect(blockAfter(forced, '.search-field[data-disabled] .search-field-icon {')).toContain(
      'color: GrayText;',
    );
  });
});

describe('src/components/select.css', () => {
  // The rules without their comments, with their whitespace closed up. `.select-trigger {` and `.select-chevron {`
  // are the start of no earlier rule, so the first match is each part's own rule.
  const rules = () => closeUp(stripComments(read('src/components/select.css')));

  it('lays the trigger out as a row of the value and the chevron, in one-class rules', () => {
    const trigger = blockAfter(rules(), '.select-trigger {');
    for (const declaration of [
      'display: flex;',
      'align-items: center;',
      'gap: var(--spacing-part);',
      'padding-inline: 1.5rem 1rem;',
      'text-align: start;',
    ]) {
      expect(trigger, declaration).toContain(declaration);
    }
    // One class, after input.css: it beats the input's padding by order and none of the input's states.
    expect(rules()).not.toMatch(/\.select-trigger\.input|\.input\.select-trigger/);
  });

  it('keeps the not-allowed cursor of a disabled trigger', () => {
    const css = rules();
    expect(blockAfter(css, '.select-trigger:not(:disabled, [data-disabled]) {')).toContain(
      'cursor: pointer;',
    );
    expect(blockAfter(css, '.select-trigger {')).not.toContain('cursor');
  });

  it('ellipsizes the value on one line and draws the placeholder slate', () => {
    const css = rules();
    const value = blockAfter(css, '.select-value {');
    expect(value).toContain('min-width: 0;');
    expect(value).toContain('white-space: nowrap;');
    expect(value).toContain('overflow: hidden;');
    expect(blockAfter(css, '.select-value-label {')).toContain('text-overflow: ellipsis;');
    // The placeholder is the trigger's visible text, so it is slate, which meets text contrast (open question 3).
    expect(blockAfter(css, '.select-value[data-placeholder] {')).toContain('color: var(--color-slate);');
    // Nothing but the changed dot keys on the missing label: the placeholder is slate either way.
    expect(css.replace(/\.select\[data-changed\]\[data-unlabelled\][^{]*\{[^}]*\}/g, '')).not.toContain(
      'data-unlabelled',
    );
  });

  it('draws the value and the placeholder of a disabled trigger taupe, the disabled text', () => {
    const css = rules();
    const disabled = '.select-trigger:is(:disabled, [data-disabled]) .select-value {';
    expect(blockAfter(css, disabled)).toContain('color: var(--color-taupe);');
    // After the placeholder's slate, and heavier, so a disabled placeholder is taupe.
    expect(css.indexOf(disabled)).toBeGreaterThan(css.indexOf('.select-value[data-placeholder] {'));
  });

  it('turns the chevron half a turn while open, in 140ms, and not under reduced motion', () => {
    const css = rules();
    const chevron = blockAfter(css, '.select-chevron {');
    expect(chevron).toContain('color: var(--color-slate);');
    expect(chevron).toContain('transition: rotate 140ms ease;');
    expect(blockAfter(css, '.select-chevron svg {')).toContain('width: 16px;');
    expect(blockAfter(css, '.select[data-open] .select-chevron {')).toContain('rotate: 180deg;');
    const reduced = blockAfter(css, '@media (prefers-reduced-motion: reduce)');
    expect(blockAfter(reduced, '.select-chevron {')).toContain('transition: none;');
  });

  it('never mirrors the chevron', () => {
    const css = rules();
    expect(css).not.toContain('scale');
    expect(css).not.toContain('rtl');
  });

  it('steps the filter row down to the control size, with a divider under it', () => {
    const filter = blockAfter(rules(), '.select-filter {');
    expect(filter).toContain('--size-field: var(--size-control);');
    expect(filter).toContain('border-block-end: 1px solid var(--color-divider);');
    expect(filter).toContain('padding: var(--spacing-part);');
    expect(filter).toContain('flex: none;');
  });

  it('draws the empty line in slate at the small step', () => {
    const empty = blockAfter(rules(), '.picker-empty {');
    for (const declaration of [
      'padding: 0.5rem 0.75rem;',
      'color: var(--color-slate);',
      'font-size: var(--text-small);',
      'line-height: var(--text-small--line-height);',
      'font-weight: var(--text-small--font-weight);',
    ]) {
      expect(empty, declaration).toContain(declaration);
    }
  });

  it('writes no row CSS: the list is menu.css', () => {
    // A row part appears only under the trigger, where the chosen option's icon is drawn.
    const selectors = [...rules().matchAll(/([^{}]+)\{/g)].map((match) => match[1].trim());
    // A selector list split at its own commas, not at those inside :is() or :not().
    const parts = (selector) => selector.split(/,(?![^(]*\))/).map((part) => part.trim());
    const rows = selectors.flatMap(parts).filter((part) => part.includes('.menu-'));
    expect(rows.length).toBeGreaterThan(0);
    for (const part of rows) expect(part).toContain('.select-trigger');
  });

  it('draws the chevron CanvasText, and GrayText when disabled, in forced colors', () => {
    const forced = blockAfter(rules(), '@media (forced-colors: active)');
    expect(blockAfter(forced, '.select-chevron, .select-trigger .menu-item-icon {')).toContain(
      'color: CanvasText;',
    );
    expect(
      blockAfter(
        forced,
        '.select-trigger:is(:disabled, [data-disabled]) :is(.select-chevron, .menu-item-icon) {',
      ),
    ).toContain('color: GrayText;');
  });
});

describe('src/components/combo-box.css', () => {
  // The rules without their comments, with their whitespace closed up.
  const rules = () => closeUp(stripComments(read('src/components/combo-box.css')));
  /** Every selector the file writes, each part of a list on its own. */
  const selectors = () =>
    [...rules().matchAll(/([^{}]+)\{/g)]
      .map((match) => match[1].trim())
      .filter((selector) => !selector.startsWith('@'))
      .flatMap((selector) => selector.split(/,(?![^(]*\))/).map((part) => part.trim()));

  it('pads the input clear of the button, and of the Spinner while loading, with one-class rules', () => {
    const css = rules();
    expect(blockAfter(css, '.combo-box-input {').trim()).toBe('padding-inline-end: 3rem;');
    expect(blockAfter(css, '.combo-box[data-loading] .combo-box-input {').trim()).toBe(
      'padding-inline-end: 4.5rem;',
    );
    // One class for the resting padding, after input.css: it beats the input's padding by order and none of the
    // input's states. Never the two classes together, which would outweigh the hover and focus edges' order.
    expect(css).not.toMatch(/\.combo-box-input\.input|\.input\.combo-box-input/);
  });

  it('sets the Spinner just before the button, from the field size', () => {
    const spinner = blockAfter(rules(), '.combo-box-spinner {');
    for (const declaration of [
      'position: absolute;',
      'inset-block: 0;',
      'inset-inline-end: calc(var(--size-field) - 0.25rem);',
      'display: flex;',
      'align-items: center;',
      'pointer-events: none;',
    ]) {
      expect(spinner, declaration).toContain(declaration);
    }
  });

  it('positions the control and draws nothing else: the button is input.css, the list menu.css', () => {
    expect(blockAfter(rules(), '.combo-box-control {').trim()).toBe('position: relative;');
    expect(selectors().sort()).toEqual(
      [
        '.combo-box-control',
        '.combo-box-input',
        '.combo-box[data-loading] .combo-box-input',
        '.combo-box-spinner',
        '.combo-box[data-unlabelled]:not([data-disabled]) .combo-box-input::placeholder',
        // The changed dot of a field with no label: its place, and the text's padding clear of it.
        '.combo-box[data-changed][data-unlabelled]',
        '.combo-box[data-changed][data-unlabelled] .combo-box-input',
        '.combo-box[data-changed][data-unlabelled][data-loading]',
        '.combo-box[data-changed][data-unlabelled][data-loading] .combo-box-input',
      ].sort(),
    );
    // Only the unlabelled placeholder's color; everything else is input.css's and menu.css's.
    const css = rules().replace(
      /\.combo-box\[data-unlabelled\]:not\(\[data-disabled\]\) \.combo-box-input::placeholder \{[^}]*\}/,
      '',
    );
    for (const part of [
      '.menu',
      '.input-button',
      '.picker-',
      'color',
      'border',
      'background',
      '::placeholder',
    ]) {
      expect(css, part).not.toContain(part);
    }
  });

  it('draws the placeholder slate only without a visible label, and never while disabled', () => {
    const css = rules();
    expect(
      blockAfter(
        css,
        '.combo-box[data-unlabelled]:not([data-disabled]) .combo-box-input::placeholder {',
      ).trim(),
    ).toBe('color: var(--color-slate);');
    expect(css.match(/::placeholder/g)).toHaveLength(1);
  });

  it('writes no physical offset and mirrors nothing', () => {
    const css = rules();
    expect(css).not.toMatch(/(?<![\w-])(left|right)\s*:|padding-(left|right)|margin-(left|right)/);
    expect(css).not.toContain('scale');
    expect(css).not.toContain('rtl');
  });
});

describe('src/components/multi-select.css', () => {
  // The rules without their comments, with their whitespace closed up.
  const rules = () => closeUp(stripComments(read('src/components/multi-select.css')));
  /** Every selector the file writes, each part of a list on its own. */
  const selectors = () =>
    [...rules().matchAll(/([^{}]+)\{/g)]
      .map((match) => match[1].trim())
      .filter((selector) => !selector.startsWith('@'))
      .flatMap((selector) => selector.split(/,(?![^(]*\))/).map((part) => part.trim()));

  it('draws the frame on .input with an auto height and a field-tall minimum, in one-class rules', () => {
    const frame = blockAfter(rules(), '.multi-select-control {');
    for (const declaration of [
      'position: relative;',
      'display: flex;',
      'flex-wrap: wrap;',
      'align-items: center;',
      'gap: 0.25rem;',
      'height: auto;',
      'min-height: var(--size-field);',
      'padding-inline: 0.5rem 3rem;',
      'cursor: text;',
    ]) {
      expect(frame, declaration).toContain(declaration);
    }
    // The edge, the fill and the states are input.css's: the frame's own rule sets none of them.
    for (const property of ['border:', 'border-color', 'background', 'color:']) {
      expect(frame, property).not.toContain(property);
    }
    expect(blockAfter(rules(), '.multi-select[data-loading] .multi-select-control {').trim()).toBe(
      'padding-inline-end: 4.5rem;',
    );
  });

  it('pads one row to exactly a field with either edge', () => {
    const css = rules();
    expect(blockAfter(css, '.multi-select-control {')).toContain('padding-block: calc(0.375rem - 1.5px);');
    for (const part of ['.multi-select-tag {', '.multi-select-input {']) {
      expect(blockAfter(css, part), part).toContain('height: calc(var(--size-field) - 0.75rem);');
    }
  });

  it('cuts the frame at the pill while one row and the surface step once it wraps', () => {
    const frame = blockAfter(rules(), '.multi-select-control {');
    expect(frame).toContain('--input-radius: min(var(--radius-pill), calc(var(--size-field) / 2));');
    expect(frame).toContain('border-radius: var(--input-radius);');
  });

  it('rings the frame only while its input has focus, at two classes with the test in :where()', () => {
    const ring = blockAfter(
      rules(),
      '.multi-select-control.input:where(:has(.multi-select-input:is(:focus-visible, [data-focus-visible]))) {',
    );
    for (const declaration of [
      'border: 1.5px solid var(--color-ink);',
      'outline: var(--focus-ring-width) solid var(--focus-ring-color);',
      'outline-offset: var(--focus-ring-offset);',
    ]) {
      expect(ring, declaration).toContain(declaration);
    }
    // Written plainly, the :has() would weigh three classes, tie the changed edge and replace it by order.
    expect(selectors().filter((selector) => selector.includes(':has('))).toEqual([
      '.multi-select-control.input:where(:has(.multi-select-input:is(:focus-visible, [data-focus-visible])))',
    ]);
  });

  it('never rings the frame through :focus-within', () => {
    expect(rules()).not.toContain('focus-within');
  });

  it('keeps the button and the Spinner level with the first row, with either edge', () => {
    const css = rules();
    const level = blockAfter(css, '.multi-select-control :is(.input-button, .combo-box-spinner) {');
    // Centered between the padding's top and, while the frame is one row, the padding's bottom, or, once it
    // wraps, the first row's bottom: never a fixed offset, which a 1px and a 1.5px edge would put apart.
    expect(level).toContain('inset-block-start: calc(0.375rem - 1.5px);');
    expect(level).toContain(
      'inset-block-end: calc(0.375rem - 1.5px + clamp(0px, (100% + 1px - var(--size-field)) * 100, 100% + 3px - var(--size-field)));',
    );
    expect(level).toContain('margin-block: auto;');
    expect(blockAfter(css, '.multi-select-control .combo-box-spinner {')).toContain(
      'height: calc(var(--size-field) - 0.75rem);',
    );
  });

  it('flows the tags with no box for the value and the group, and keeps the list a box', () => {
    const css = rules();
    expect(blockAfter(css, '.multi-select-value, .multi-select-tags {').trim()).toBe('display: contents;');
    const list = blockAfter(css, '.multi-select-tag-list {');
    expect(list).toContain('display: flex;');
    expect(list).toContain('flex-wrap: wrap;');
    // The grid has a role, and an element with a role never leaves the box tree.
    expect(list).not.toContain('contents');
  });

  it('draws a tag concentric with the frame, on bone, with its text at 500 in ink, ellipsized past 12rem', () => {
    const css = rules();
    const tag = blockAfter(css, '.multi-select-tag {');
    for (const declaration of [
      'border-radius: max(0px, calc(var(--input-radius) - 0.375rem));',
      'background-color: var(--color-bone);',
      'color: var(--color-ink);',
      'font-size: var(--text-small);',
      'font-weight: 500;',
      'padding-inline: 0.75rem 0.25rem;',
    ]) {
      expect(tag, declaration).toContain(declaration);
    }
    const text = blockAfter(css, '.multi-select-tag-text {');
    for (const declaration of [
      'max-width: 12rem;',
      'overflow: hidden;',
      'text-overflow: ellipsis;',
      'white-space: nowrap;',
    ]) {
      expect(text, declaration).toContain(declaration);
    }
    expect(blockAfter(css, '.multi-select-tag[data-focus-visible] {')).toContain(
      'outline: var(--focus-ring-width) solid var(--focus-ring-color);',
    );
  });

  it('hits the remove button at 24px from a 20px circle', () => {
    const css = rules();
    const remove = blockAfter(css, '.multi-select-tag-remove {');
    for (const declaration of [
      'width: 1.25rem;',
      'height: 1.25rem;',
      'border-radius: var(--radius-pill);',
      'color: var(--color-slate);',
    ]) {
      expect(remove, declaration).toContain(declaration);
    }
    expect(blockAfter(css, '.multi-select-tag-remove::before {')).toContain('inset: -0.125rem;');
    expect(blockAfter(css, '@media (hover: hover)')).toContain(
      '.multi-select-tag-remove:is(:hover, [data-hovered])',
    );
    expect(blockAfter(css, '.multi-select-tag-remove:is(:active, [data-pressed]) {')).toContain(
      'color: var(--color-ink);',
    );
  });

  it('draws the placeholder taupe, slate only without a visible label, and never while disabled', () => {
    const css = rules();
    expect(blockAfter(css, '.multi-select-input::placeholder {')).toContain('color: var(--color-taupe);');
    expect(
      blockAfter(
        css,
        '.multi-select[data-unlabelled]:not([data-disabled]) .multi-select-input::placeholder {',
      ).trim(),
    ).toBe('color: var(--color-slate);');
    expect(css.match(/::placeholder/g)).toHaveLength(2);
  });

  it('draws a disabled tag taupe', () => {
    expect(blockAfter(rules(), '.multi-select[data-disabled] .multi-select-tag {').trim()).toBe(
      'color: var(--color-taupe);',
    );
  });

  it('edges a tag CanvasText in forced colors, and its glyph too', () => {
    const forced = blockAfter(rules(), '@media (forced-colors: active)');
    expect(blockAfter(forced, '.multi-select-tag {')).toContain('border-color: CanvasText;');
    expect(blockAfter(forced, '.multi-select-tag-remove {')).toContain('color: CanvasText;');
    const disabled = blockAfter(forced, '.multi-select[data-disabled] .multi-select-tag {');
    expect(disabled).toContain('color: GrayText;');
    expect(disabled).toContain('border-color: GrayText;');
  });

  it('writes no physical offset and mirrors nothing', () => {
    const css = rules();
    expect(css).not.toMatch(/(?<![\w-])(left|right)\s*:|padding-(left|right)|margin-(left|right)/);
    expect(css).not.toContain('scale');
    expect(css).not.toContain('rtl');
  });
});

describe('src/components/tabs.css', () => {
  // The rules without their comments, with their whitespace closed up. `.tab {` is the start of no earlier rule
  // (`.tabs {` and `.tab-list {` differ at the next character), so the first match is the tab's own rule.
  const rules = () => closeUp(stripComments(read('src/components/tabs.css')));
  const SELECTED = "[aria-selected='true'], [data-selected]";
  const DISABLED = "[aria-disabled='true'], [data-disabled]";
  const FOCUS = ':focus-visible, [data-focus-visible]';

  it('draws the track as canvas with no edge, on the surface corner, padded 4px', () => {
    const list = blockAfter(rules(), '.tab-list {');
    for (const declaration of [
      'display: inline-flex;',
      'gap: 0.25rem;',
      'max-width: 100%;',
      '--holder-radius: var(--radius-surface);',
      '--holder-border: 0px;',
      '--holder-pad: 0.25rem;',
      'padding: var(--holder-pad);',
      'border-radius: var(--holder-radius);',
      'background-color: var(--color-canvas);',
    ]) {
      expect(list, declaration).toContain(declaration);
    }
    // A tab switches what is shown and holds no value, so the track never reads as a field.
    expect(list).not.toMatch(/(?<![\w-])border(?!-radius)[\w-]*\s*:/);
    expect(list).not.toContain('box-shadow');
  });

  it('scrolls the row inside its track and never wraps a tab', () => {
    const css = rules();
    const list = blockAfter(css, '.tab-list {');
    for (const declaration of [
      'overflow-x: auto;',
      'overscroll-behavior-inline: contain;',
      'scrollbar-width: thin;',
      'scrollbar-color: var(--color-scrollbar) transparent;',
    ]) {
      expect(list, declaration).toContain(declaration);
    }
    const tab = blockAfter(css, '.tab {');
    expect(tab).toContain('white-space: nowrap;');
    expect(tab).toContain('flex: none;');
    // The root's single column never grows past its container, so a long row scrolls instead of the page.
    const tabs = blockAfter(css, '.tabs {');
    expect(tabs).toContain('grid-template-columns: minmax(0, 1fr);');
    expect(tabs).toContain('min-width: 0;');
  });

  it('draws a tab at the control height, concentric with the track, at the action step', () => {
    const tab = blockAfter(rules(), '.tab {');
    for (const declaration of [
      'min-height: var(--size-control);',
      'padding-inline: 1rem;',
      'border-radius: max(0px, calc(var(--holder-radius) - var(--holder-border) - var(--holder-pad)));',
      'color: var(--color-slate);',
      'font-size: var(--text-action);',
      'line-height: var(--text-action--line-height);',
      'font-weight: var(--text-action--font-weight);',
      'text-decoration: none;',
      'cursor: pointer;',
    ]) {
      expect(tab, declaration).toContain(declaration);
    }
  });

  it('hits a tab at the target by the shared formula', () => {
    const hit = blockAfter(rules(), '.tab::before {');
    expect(hit).toContain('position: absolute;');
    expect(hit).toContain('inset-inline: 0;');
    expect(hit).toContain('inset-block: min(0px, (100% - var(--size-target)) / 2);');
  });

  it('washes and inks an unselected tab on hover, only where hover exists, and on a press, never the selected one', () => {
    const css = rules();
    const wash = 'background-color: color-mix(in srgb, var(--color-ink) 5%, transparent);';
    const hover = blockAfter(
      blockAfter(css, '@media (hover: hover)'),
      `.tab:is(:hover, [data-hovered]):not(${SELECTED}, ${DISABLED}) {`,
    );
    expect(hover).toContain(wash);
    expect(hover).toContain('color: var(--color-ink);');
    const pressed = blockAfter(css, `.tab:is(:active, [data-pressed]):not(${SELECTED}, ${DISABLED}) {`);
    expect(pressed).toContain(wash);
    expect(pressed).toContain('color: var(--color-ink);');
    // Hover is written only inside the media query.
    expect(outsideForcedColors(css).replace(blockAfter(css, '@media (hover: hover)'), '')).not.toContain(
      ':hover',
    );
  });

  it('fills the selected tab ink with canvas text, and inverts its ring inside it', () => {
    const css = rules();
    const selected = blockAfter(css, `.tab:is(${SELECTED}) {`);
    expect(selected).toContain('background-color: var(--color-ink);');
    expect(selected).toContain('color: var(--color-canvas);');
    const ring = blockAfter(css, `.tab:is(${FOCUS}) {`);
    expect(ring).toContain('outline: var(--focus-ring-width) solid var(--focus-ring-color);');
    expect(ring).toContain('outline-offset: var(--focus-ring-offset);');
    const inset = blockAfter(css, `.tab:is(${SELECTED}):is(${FOCUS}) {`);
    expect(inset).toContain('outline-color: var(--color-canvas);');
    expect(inset).toContain(
      'outline-offset: calc(-1 * (var(--focus-ring-width) + var(--focus-ring-offset)));',
    );
  });

  it('draws a disabled tab taupe and not-allowed', () => {
    const disabled = blockAfter(rules(), `.tab:is(${DISABLED}) {`);
    expect(disabled).toContain('color: var(--color-taupe);');
    expect(disabled).toContain('cursor: not-allowed;');
  });

  it('keeps a disabled selected tab in its place as a taupe pill with the disabled fill for its text', () => {
    const css = rules();
    const both = `.tab:is(${SELECTED}):is(${DISABLED}) {`;
    const pill = blockAfter(css, both);
    expect(pill).toContain('background-color: var(--color-taupe);');
    expect(pill).toContain('color: var(--color-disabled);');
    // After the selected and the disabled rules, which it outranks only by coming later.
    expect(css.indexOf(both)).toBeGreaterThan(css.indexOf(`.tab:is(${SELECTED}) {`));
    expect(css.indexOf(both)).toBeGreaterThan(css.indexOf(`.tab:is(${DISABLED}) {`));
    // The dot keeps its canvas ring there, the selected tab's rule.
    expect(css).toContain(`.tab:is(${SELECTED}) .tab-changed {`);
  });

  it('draws a badge in a tab in the tab color, so its text and its edge follow the tab', () => {
    const css = rules();
    expect(blockAfter(css, '.tab .badge {').trim()).toBe('color: inherit;');
    // badge.css draws the edge in currentColor, so the edge follows the text.
    expect(closeUp(stripComments(read('src/components/badge.css')))).toContain(
      'border: 1px solid currentColor;',
    );
  });

  it('draws the changed dot 6px clay, ringed in canvas on the selected tab', () => {
    const css = rules();
    const dot = blockAfter(css, '.tab-changed {');
    for (const declaration of [
      'flex: none;',
      'width: 0.375rem;',
      'height: 0.375rem;',
      'margin-inline-start: var(--spacing-part);',
      'border-radius: var(--radius-dot);',
      'background-color: var(--color-clay);',
    ]) {
      expect(dot, declaration).toContain(declaration);
    }
    expect(blockAfter(css, `.tab:is(${SELECTED}) .tab-changed {`).trim()).toBe(
      'outline: var(--focus-ring-width) solid var(--color-canvas);',
    );
    // Clay is the unsaved color, and the dot is the file's only use of it.
    expect(css.match(/--color-clay/g)).toHaveLength(1);
  });

  it('spans the panel across the root and breaks a long word in it anywhere', () => {
    const panel = blockAfter(rules(), '.tab-panel {');
    expect(panel).toContain('justify-self: stretch;');
    expect(panel).toContain('min-width: 0;');
    expect(panel).toContain('overflow-wrap: anywhere;');
  });

  it('hides a force-mounted panel that is not selected', () => {
    const css = rules();
    expect(blockAfter(css, '.tab-panel[data-inert] {').trim()).toBe('display: none;');
    expect(blockAfter(css, `.tab-panel:is(${FOCUS}) {`)).toContain(
      'outline: var(--focus-ring-width) solid var(--focus-ring-color);',
    );
  });

  it('draws the selected tab Highlight, a disabled one GrayText and the dot CanvasText in forced colors', () => {
    const forced = blockAfter(rules(), '@media (forced-colors: active)');
    const selected = blockAfter(forced, `.tab:is(${SELECTED}) {`);
    expect(selected).toContain('background-color: Highlight;');
    expect(selected).toContain('color: HighlightText;');
    expect(blockAfter(forced, `.tab:is(${SELECTED}):is(${FOCUS}) {`)).toContain(
      'outline-color: HighlightText;',
    );
    expect(blockAfter(forced, `.tab:is(${DISABLED}) {`)).toContain('color: GrayText;');
    const both = blockAfter(forced, `.tab:is(${SELECTED}):is(${DISABLED}) {`);
    expect(both).toContain('background-color: GrayText;');
    expect(both).toContain('color: canvas;');
    expect(forced.indexOf(`.tab:is(${SELECTED}):is(${DISABLED}) {`)).toBeGreaterThan(
      forced.indexOf(`.tab:is(${DISABLED}) {`),
    );
    expect(blockAfter(forced, '.tab-changed {')).toContain('background-color: CanvasText;');
    const onSelected = blockAfter(forced, `.tab:is(${SELECTED}) .tab-changed {`);
    expect(onSelected).toContain('background-color: HighlightText;');
    expect(onSelected).toContain('outline-color: Highlight;');
  });

  it('mirrors nothing', () => {
    const css = rules();
    expect(css).not.toMatch(/(?<![\w-])(left|right)\s*:|padding-(left|right)|margin-(left|right)/);
    expect(css).not.toContain('scale');
    expect(css).not.toContain('rtl');
  });

  it('writes no transition, since nothing in a tab row moves', () => {
    expect(rules()).not.toMatch(/transition|animation/);
  });
});

describe('src/components/pagination.css', () => {
  // The rules without their comments, with their whitespace closed up. `.pagination {` is the start of no other
  // rule (`.pagination-row {` differs at the next character), so the first match is the nav's own rule.
  const rules = () => closeUp(stripComments(read('src/components/pagination.css')));
  const CURRENT = "[aria-current='page'], [aria-current='true'], [data-current]";
  const DISABLED = ":disabled, [data-disabled], [aria-disabled='true']";
  const FOCUS = ':focus-visible, [data-focus-visible]';
  const QUERY = '@container pagination (width < 30rem)';
  const SHORT = ".pagination-row[data-page-numbers='false']";
  const MIDDLE = '@container pagination (width < 36rem)';
  const HIDDEN = [
    'position: absolute;',
    'width: 1px;',
    'height: 1px;',
    'margin: -1px;',
    'overflow: hidden;',
    'clip-path: inset(50%);',
    'white-space: nowrap;',
  ];

  it('makes the box in the nav a size container and re-lays the row inside it', () => {
    const css = rules();
    // The box inside the nav is the container; the nav takes its width from the narrow row (below).
    expect(blockAfter(css, '.pagination-box {')).toContain('container: pagination / inline-size;');
    expect(blockAfter(css, '.pagination {')).not.toContain('container');
    const row = blockAfter(css, '.pagination-row {');
    for (const declaration of [
      'display: flex;',
      'flex-wrap: wrap;',
      'align-items: center;',
      'justify-content: space-between;',
      'gap: var(--spacing-part) var(--spacing-peer);',
    ]) {
      expect(row, declaration).toContain(declaration);
    }
    const query = blockAfter(css, QUERY);
    expect(query).not.toBe('');
    // A container query styles only what is inside the container, so the nav itself is never in it.
    expect(query).not.toContain('.pagination {');
    expect(query).not.toMatch(/\.pagination\s*\{/);
    expect(blockAfter(query, '.pagination-row {')).toContain('display: grid;');
    // The range a slate small line with tabular figures.
    const range = blockAfter(css, '.pagination-range {');
    expect(range).toContain('color: var(--color-slate);');
    expect(range).toContain('font-size: var(--text-small);');
    expect(range).toContain('font-variant-numeric: tabular-nums;');
    // The app's sentence wraps between words inside the row, and breaks a word only when it alone overflows:
    // break-word, which never lowers the range's min-content width to a letter.
    expect(range).toContain('min-width: 0;');
    expect(range).toContain('overflow-wrap: break-word;');
    expect(range).not.toContain('anywhere');
  });

  it('gives the nav the narrow row as its width in a parent that sizes it from its content', () => {
    const css = rules();
    const nav = blockAfter(css, '.pagination {');
    // In a flex row, the room the siblings leave, never under the narrow row's narrowest; in a flex column,
    // never taller than its row.
    expect(nav).toContain('flex: 1 1 0;');
    expect(nav).toContain('max-block-size: max-content;');
    expect(nav).not.toContain('min-inline-size');
    // The narrow row's widths: the range it carries, at the range's step, a control and half a rem each side.
    const sizer = blockAfter(css, '.pagination::before {');
    for (const declaration of [
      'content: attr(data-range);',
      'display: block;',
      'box-sizing: border-box;',
      'max-inline-size: 18rem;',
      'block-size: 0;',
      'padding-inline: calc(var(--size-control) + 0.5rem);',
      'overflow: hidden;',
      'visibility: hidden;',
      'font-size: var(--text-small);',
      'overflow-wrap: break-word;',
    ]) {
      expect(sizer, declaration).toContain(declaration);
    }
  });

  it('draws a control at the control height, on the pill radius, at the action step with tabular figures', () => {
    const control = blockAfter(rules(), '.pagination-control {');
    for (const declaration of [
      'min-width: var(--size-control);',
      'height: var(--size-control);',
      'padding-inline: 0.5rem;',
      'border: 0;',
      'border-radius: var(--radius-pill);',
      'background-color: transparent;',
      'color: var(--color-ink);',
      'font-size: var(--text-action);',
      'line-height: var(--text-action--line-height);',
      'font-weight: var(--text-action--font-weight);',
      'font-variant-numeric: tabular-nums;',
      'text-decoration: none;',
      'cursor: pointer;',
    ]) {
      expect(control, declaration).toContain(declaration);
    }
    const step = blockAfter(rules(), '.pagination-step svg {');
    expect(step).toContain('width: 16px;');
    expect(step).toContain('height: 16px;');
  });

  it('hits a control at the target by the shared formula', () => {
    const hit = blockAfter(rules(), '.pagination-control::before {');
    expect(hit).toContain('position: absolute;');
    expect(hit).toContain('inset-inline: 0;');
    expect(hit).toContain('inset-block: min(0px, (100% - var(--size-target)) / 2);');
  });

  it('isolates a page number, so digits read as one run in any direction', () => {
    expect(blockAfter(rules(), '.pagination-page {').trim()).toBe('unicode-bidi: isolate;');
  });

  it('mirrors the step chevrons under an rtl dir, as the sidebar mirrors its chevron', () => {
    const css = rules();
    expect(blockAfter(css, "[dir='rtl'] .pagination-step svg {").trim()).toBe('scale: -1 1;');
    // Nothing else is mirrored: the list runs from the right by itself, and digits have their own direction.
    expect(css.match(/scale/g)).toHaveLength(1);
    expect(css.match(/rtl/g)).toHaveLength(1);
    expect(css).not.toMatch(/(?<![\w-])(left|right)\s*:|padding-(left|right)|margin-(left|right)/);
  });

  it('washes a control on hover, only where hover exists, and on a press, never the current page or a disabled step', () => {
    const css = rules();
    const wash = 'background-color: color-mix(in srgb, var(--color-ink) 5%, transparent);';
    const hover = blockAfter(
      blockAfter(css, '@media (hover: hover)'),
      `.pagination-control:is(:hover, [data-hovered]):not(${CURRENT}, ${DISABLED}) {`,
    );
    expect(hover.trim()).toBe(wash);
    const pressed = blockAfter(
      css,
      `.pagination-control:is(:active, [data-pressed]):not(${CURRENT}, ${DISABLED}) {`,
    );
    expect(pressed.trim()).toBe(wash);
    expect(outsideForcedColors(css).replace(blockAfter(css, '@media (hover: hover)'), '')).not.toContain(
      ':hover',
    );
  });

  it('fills the current page ink with canvas text and inverts its ring inside it', () => {
    const css = rules();
    const current = blockAfter(css, `.pagination-page:is(${CURRENT}) {`);
    expect(current).toContain('background-color: var(--color-ink);');
    expect(current).toContain('color: var(--color-canvas);');
    expect(current).toContain('cursor: default;');
    const ring = blockAfter(css, `.pagination-control:is(${FOCUS}) {`);
    expect(ring).toContain('outline: var(--focus-ring-width) solid var(--focus-ring-color);');
    expect(ring).toContain('outline-offset: var(--focus-ring-offset);');
    const inset = blockAfter(css, `.pagination-page:is(${CURRENT}):is(${FOCUS}) {`);
    expect(inset).toContain('outline-color: var(--color-canvas);');
    expect(inset).toContain(
      'outline-offset: calc(-1 * (var(--focus-ring-width) + var(--focus-ring-offset)));',
    );
  });

  it('draws a disabled step taupe and not-allowed', () => {
    const disabled = blockAfter(rules(), `.pagination-control:is(${DISABLED}) {`);
    expect(disabled).toContain('color: var(--color-taupe);');
    expect(disabled).toContain('cursor: not-allowed;');
    // Taupe is for disabled text only, and this is the file's one use of it.
    expect(rules().match(/--color-taupe/g)).toHaveLength(1);
  });

  it('hides the numbers and the gaps and keeps the step words as names under 30rem', () => {
    const query = blockAfter(rules(), QUERY);
    expect(blockAfter(query, ".pagination-item:is([data-kind='page'], [data-kind='gap']) {").trim()).toBe(
      'display: none;',
    );
    const label = blockAfter(query, '.pagination-step-label {');
    for (const declaration of HIDDEN) expect(label, declaration).toContain(declaration);
    expect(label).not.toContain('display: none');
    // The range sits between the two steps, which stay 40px targets on the list laid over it.
    const range = blockAfter(query, '.pagination-range {');
    expect(range).toContain('grid-area: 1 / 1;');
    expect(range).toContain('justify-self: center;');
    expect(range).toContain('max-width: calc(100% - 2 * var(--size-control) - 1rem);');
    const list = blockAfter(query, '.pagination-list {');
    expect(list).toContain('grid-area: 1 / 1;');
    expect(list).toContain('justify-content: space-between;');
    expect(list).toContain('pointer-events: none;');
    expect(blockAfter(query, '.pagination-item {')).toContain('pointer-events: auto;');
    expect(blockAfter(query, '.pagination-step {')).toContain('padding-inline: 0;');
  });

  it('hides the step words as names under 36rem, before the worded row can outgrow the nav', () => {
    // 7 slots of 44px (a coarse pointer's compact control), 8 gaps of 0.25rem and two worded steps of about
    // 99 and 75px are 514px, 32.1rem: under 36rem the steps are chevron circles, and 36rem leaves room for
    // longer words in another language.
    const css = outsideForcedColors(rules());
    const band = blockAfter(css, MIDDLE);
    expect(band).not.toBe('');
    expect(band).not.toMatch(/\.pagination\s*\{/);
    expect(blockAfter(band, '.pagination-step {').trim()).toBe('padding-inline: 0;');
    const label = blockAfter(band, '.pagination-step-label {');
    for (const declaration of HIDDEN) expect(label, declaration).toContain(declaration);
    expect(label).not.toContain('display: none');
    // The numbers stay in the band: only the 30rem query takes them out.
    expect(band).not.toContain('data-kind');
    // The band comes before the 30rem query, which re-lays the row on top of it.
    expect(css.indexOf(MIDDLE)).toBeLessThan(css.indexOf(QUERY));
  });

  it('lets the list wrap to the inline end as a last resort, never past the nav', () => {
    const list = blockAfter(rules(), '.pagination-list {');
    expect(list).toContain('flex-wrap: wrap;');
    // flex-end follows the row's direction, so the list ends at the left in right to left.
    expect(list).toContain('justify-content: flex-end;');
  });

  it('draws the short form as the narrow row at every width', () => {
    const css = outsideForcedColors(rules()).replace(blockAfter(rules(), QUERY), '');
    expect(blockAfter(css, `${SHORT} {`)).toContain('display: grid;');
    const range = blockAfter(css, `${SHORT} .pagination-range {`);
    expect(range).toContain('grid-area: 1 / 1;');
    expect(range).toContain('max-width: calc(100% - 2 * var(--size-control) - 1rem);');
    const list = blockAfter(css, `${SHORT} .pagination-list {`);
    expect(list).toContain('grid-area: 1 / 1;');
    expect(list).toContain('justify-content: space-between;');
    expect(blockAfter(css, `${SHORT} .pagination-item {`)).toContain('pointer-events: auto;');
    expect(blockAfter(css, `${SHORT} .pagination-step {`)).toContain('padding-inline: 0;');
    const label = blockAfter(css, `${SHORT} .pagination-step-label {`);
    for (const declaration of HIDDEN) expect(label, declaration).toContain(declaration);
  });

  it('keeps the status region in the tree, visually hidden', () => {
    const status = blockAfter(rules(), '.pagination-status {');
    for (const declaration of HIDDEN) expect(status, declaration).toContain(declaration);
    expect(status).not.toMatch(/display\s*:\s*none|visibility\s*:\s*hidden/);
  });

  it('draws the current page Highlight and a disabled step GrayText in forced colors', () => {
    const forced = blockAfter(rules(), '@media (forced-colors: active)');
    const current = blockAfter(forced, `.pagination-page:is(${CURRENT}) {`);
    expect(current).toContain('background-color: Highlight;');
    expect(current).toContain('color: HighlightText;');
    expect(blockAfter(forced, `.pagination-page:is(${CURRENT}):is(${FOCUS}) {`)).toContain(
      'outline-color: HighlightText;',
    );
    expect(blockAfter(forced, `.pagination-control:is(${DISABLED}) {`)).toContain('color: GrayText;');
  });

  it('writes no transition, since nothing in a pagination row moves', () => {
    expect(rules()).not.toMatch(/transition|animation/);
  });

  it('leads the row with the page size picker, its label beside it in slate, and keeps the controls at the end', () => {
    const css = rules();
    const picker = blockAfter(css, '.pagination .pagination-size {');
    for (const declaration of [
      'display: flex;',
      'flex-wrap: wrap;',
      'align-items: center;',
      'min-inline-size: 0;',
    ]) {
      expect(picker, declaration).toContain(declaration);
    }
    const label = blockAfter(css, '.pagination-size-label {');
    expect(label).toContain('color: var(--color-slate);');
    expect(label).toContain('font-size: var(--text-small);');
    expect(blockAfter(css, '.pagination-row:has(> .pagination-size) {')).toContain(
      'justify-content: flex-start;',
    );
    expect(blockAfter(css, '.pagination-row:has(> .pagination-size) > .pagination-list {')).toContain(
      'margin-inline-start: auto;',
    );
    // A row without the picker keeps the 0.6.1 layout: the range at the start, the list at the end.
    expect(blockAfter(css, '.pagination-row {')).toContain('justify-content: space-between;');
  });

  it('draws the picker as a native select wearing the field, at the control height with a chevron (spec correction 112)', () => {
    const css = rules();
    // One more class than input.css's, so the height and the paddings win; the edge, fill, states and radius
    // are the field's.
    const select = blockAfter(css, '.pagination-size-select.input {');
    for (const declaration of [
      'inline-size: auto;',
      'height: var(--size-control);',
      'padding-inline: 1.5rem calc(1rem + 16px + var(--spacing-part));',
      'appearance: none;',
    ]) {
      expect(select, declaration).toContain(declaration);
    }
    expect(select).not.toMatch(/border-radius|border:|background/);
    expect(blockAfter(css, '.pagination-size-field {')).toContain('position: relative;');
    const chevron = blockAfter(css, '.pagination-size-chevron {');
    for (const declaration of [
      'position: absolute;',
      'inset-inline-end: 1rem;',
      'width: 16px;',
      'color: var(--color-slate);',
      'pointer-events: none;',
    ]) {
      expect(chevron, declaration).toContain(declaration);
    }
    const forced = blockAfter(css, '@media (forced-colors: active)');
    expect(blockAfter(forced, '.pagination-size-chevron {')).toContain('color: CanvasText;');
    // The worded row with the picker hides its step words under 54rem of the box.
    expect(css).toContain('@container pagination (width < 54rem)');
  });

  it('puts the picker on a line of its own above the steps under 30rem and in the short form', () => {
    const css = rules();
    const query = blockAfter(css, QUERY);
    for (const scope of [query, css]) {
      const own = scope === query ? '.pagination-row > .pagination-size {' : `${SHORT} > .pagination-size {`;
      expect(blockAfter(scope, own)).toContain('grid-area: 1 / 1;');
      const below =
        scope === query
          ? '.pagination-row:has(> .pagination-size) > :is(.pagination-range, .pagination-list) {'
          : `${SHORT}:has(> .pagination-size) > :is(.pagination-range, .pagination-list) {`;
      const rest = blockAfter(scope, below);
      expect(rest).toContain('grid-area: 2 / 1;');
      // The steps span the line again, rather than keep the wide row's push to the end.
      expect(rest).toContain('margin-inline-start: 0;');
    }
  });
});

describe('src/components/number-field.css', () => {
  // The rules without their comments, with their whitespace closed up.
  const rules = () => closeUp(stripComments(read('src/components/number-field.css')));
  const PRESSED = ".number-field-sign.input-button:is([data-selected], [aria-pressed='true'])";
  const LEAD = 'calc(var(--number-field-lead) + var(--number-field-symbol-start))';
  const TRAIL = 'calc(var(--number-field-trail) + var(--number-field-symbol-end) + var(--number-field-mark))';

  it('draws the input as a figure: left to right, isolated, tabular', () => {
    const input = blockAfter(rules(), '.number-field-input {');
    expect(input).toContain('direction: ltr;');
    expect(input).toContain('unicode-bidi: isolate;');
    expect(input).toContain('font-variant-numeric: tabular-nums;');
    expect(input).toContain('text-align: start;');
  });

  it('pads the input from the lead, the trail and the symbol, and swaps the paddings under [dir=rtl]', () => {
    // The input is left to right on every page, so its logical start is its left even in a right-to-left line.
    const css = rules();
    expect(blockAfter(css, '.number-field-input {')).toContain(`padding-inline: ${LEAD} ${TRAIL};`);
    const mirrored = blockAfter(css, "[dir='rtl'] .number-field-input {");
    expect(mirrored).toContain(`padding-inline: ${TRAIL} ${LEAD};`);
    expect(mirrored).toContain('text-align: end;');
    const root = blockAfter(css, '.number-field {');
    expect(root).toContain('--number-field-lead: 1.5rem;');
    expect(root).toContain('--number-field-trail: 1.5rem;');
    expect(root).toContain('--number-field-symbol-start: 0px;');
    expect(root).toContain('--number-field-symbol-end: 0px;');
  });

  it('sets the symbol room only from data-symbol, and the lead from data-signed, the trail from data-stepper', () => {
    const css = rules();
    expect(blockAfter(css, ".number-field[data-symbol='start'] {").trim()).toBe(
      '--number-field-symbol-start: var(--number-field-symbol);',
    );
    expect(blockAfter(css, ".number-field[data-symbol='end'] {").trim()).toBe(
      '--number-field-symbol-end: var(--number-field-symbol);',
    );
    expect(blockAfter(css, '.number-field[data-signed] {').trim()).toBe(
      '--number-field-lead: var(--size-field);',
    );
    expect(blockAfter(css, '.number-field[data-stepper] {').trim()).toBe(
      '--number-field-trail: calc(2 * var(--size-field) - 0.75rem);',
    );
    // The room is a property of the string the wrapper writes inline, never set anywhere else here.
    expect(css.match(/--number-field-symbol:/g)).toBeNull();
    expect(css.match(/var\(--number-field-symbol\)/g)).toHaveLength(2);
  });

  it('draws the symbol slate and never interactive, taupe while disabled', () => {
    const css = rules();
    const symbol = blockAfter(css, '.number-field-symbol {');
    expect(symbol).toContain('color: var(--color-slate);');
    expect(symbol).toContain('pointer-events: none;');
    expect(symbol).toContain('position: absolute;');
    expect(symbol).toContain('font-size: var(--text-body);');
    expect(blockAfter(css, ".number-field[data-symbol='start'] .number-field-symbol {")).toContain(
      'inset-inline-start: var(--number-field-lead);',
    );
    expect(blockAfter(css, ".number-field[data-symbol='end'] .number-field-symbol {")).toContain(
      'inset-inline-end: var(--number-field-trail);',
    );
    expect(blockAfter(css, '.number-field[data-disabled] .number-field-symbol {')).toContain(
      'color: var(--color-taupe);',
    );
    expect(blockAfter(css, '.number-field-control {')).toContain('position: relative;');
  });

  it('moves the sign button to the start and fills it ink with a canvas glyph while pressed, keyed on data-selected and aria-pressed', () => {
    const css = outsideForcedColors(read('src/components/number-field.css'));
    const closed = closeUp(css);
    expect(blockAfter(closed, '.number-field-sign {')).toContain('inset-inline: 0.375rem auto;');
    const pressed = blockAfter(closed, `${PRESSED} {`);
    expect(pressed).toContain('background-color: var(--color-ink);');
    expect(pressed).toContain('color: var(--color-canvas);');
    expect(blockAfter(closed, ".number-field-step[slot='decrement'] {")).toContain(
      'inset-inline-end: calc(var(--size-field) - 0.25rem);',
    );
  });

  it('draws a pressed sign button that is disabled, and so read-only, as a 15% ink fill with a taupe glyph, after the pressed fill', () => {
    const css = closeUp(outsideForcedColors(read('src/components/number-field.css')));
    const header = `${PRESSED}:is(:disabled, [data-disabled]) {`;
    const locked = blockAfter(css, header);
    expect(locked).toContain('background-color: color-mix(in srgb, var(--color-ink) 15%, transparent);');
    expect(locked).toContain('color: var(--color-taupe);');
    expect(css.indexOf(header)).toBeGreaterThan(css.indexOf(`${PRESSED} {`));
  });

  it('splits the 2px between the steppers, so neither 40px hit area covers the other button', () => {
    // Each field button's hit area grows to --size-target; in compact the two 24px steppers are 2px apart, so
    // the facing sides stop 1px past each button, half the gap each.
    const css = rules();
    expect(blockAfter(css, ".number-field-step[slot='decrement']::before {").trim()).toBe(
      'inset-inline-end: -1px;',
    );
    expect(blockAfter(css, ".number-field-step[slot='increment']::before {").trim()).toBe(
      'inset-inline-start: -1px;',
    );
  });

  it('rings a pressed sign button with the canvas ring inside it', () => {
    const ring = blockAfter(rules(), `${PRESSED}:is(:focus-visible, [data-focus-visible]) {`);
    expect(ring).toContain('outline-color: var(--color-canvas);');
    expect(ring).toContain(
      'outline-offset: calc(-1 * (var(--focus-ring-width) + var(--focus-ring-offset)));',
    );
  });

  it('draws the placeholder slate only without a label and never while disabled', () => {
    const css = rules();
    expect(
      blockAfter(
        css,
        '.number-field[data-unlabelled]:not([data-disabled]) .number-field-input::placeholder {',
      ),
    ).toContain('color: var(--color-slate);');
    expect(css.match(/::placeholder/g)).toHaveLength(1);
  });

  it('never colors a negative amount: no error or gain in the file', () => {
    const css = stripComments(read('src/components/number-field.css'));
    expect(css).not.toMatch(/--color-(?:error|gain|success|warning|signal|clay)/);
    expect(css).not.toMatch(/data-negative/);
  });

  it('draws the symbol CanvasText, GrayText while disabled, and a pressed sign Highlight in forced colors', () => {
    const forced = blockAfter(rules(), FORCED_COLORS);
    expect(blockAfter(forced, '.number-field-symbol {')).toContain('color: CanvasText;');
    expect(blockAfter(forced, '.number-field[data-disabled] .number-field-symbol {')).toContain(
      'color: GrayText;',
    );
    const pressed = blockAfter(forced, `${PRESSED} {`);
    expect(pressed).toContain('background-color: Highlight;');
    expect(pressed).toContain('color: HighlightText;');
    // Disabled and pressed: a GrayText glyph and edge on the system canvas, as a disabled checked checkbox is.
    const locked = blockAfter(forced, `${PRESSED}:is(:disabled, [data-disabled]) {`);
    expect(locked).toContain('background-color: canvas;');
    expect(locked).toContain('border: 1px solid GrayText;');
    expect(locked).toContain('color: GrayText;');
  });
});

describe('src/components/calendar.css', () => {
  // The rules without their comments, with their whitespace closed up.
  const rules = () => closeUp(stripComments(read('src/components/calendar.css')));
  const outside = () => closeUp(outsideForcedColors(read('src/components/calendar.css')));
  const SINGLE =
    ".calendar:not(.range-calendar) :is(.calendar-day[data-selected], [aria-selected='true'] > .calendar-day)";
  const ENDS = '.range-calendar .calendar-day:is([data-selection-start], [data-selection-end])';
  const MIDDLE =
    ".range-calendar :is(.calendar-day[data-selected], [aria-selected='true'] > .calendar-day):not([data-selection-start], [data-selection-end])";

  it('sizes the calendar seven controls wide at most and seven 24px days at least', () => {
    const css = rules();
    const calendar = blockAfter(css, '.calendar {');
    expect(calendar).toContain('width: min(100%, calc(7 * var(--size-control)));');
    expect(calendar).toContain('min-width: calc(7 * 1.5rem);');
    // A flow root, so the grid's reserved margin stays in the calendar's box.
    expect(calendar).toContain('display: flow-root;');
    expect(calendar).toContain('box-sizing: border-box;');
    expect(calendar).toContain('color: var(--color-ink);');
  });

  it('holds six weeks: a month of five or four reserves the missing rows below the grid, a day each', () => {
    const css = rules();
    // A margin's percentage reads the calendar's width, which is the grid's, so a seventh of it is one day.
    expect(blockAfter(css, '.calendar-grid:not(:has(> tbody > tr:nth-child(6))) {').trim()).toBe(
      'margin-block-end: calc(100% / 7);',
    );
    expect(blockAfter(css, '.calendar-grid:not(:has(> tbody > tr:nth-child(5))) {').trim()).toBe(
      'margin-block-end: calc(2 * 100% / 7);',
    );
    // The face is the same parts, so it takes no size of its own, and nothing in it answers the pointer.
    expect(css).not.toContain('aspect-ratio: 7 / 8');
    const face = blockAfter(css, '.calendar[data-face] {');
    expect(face).toContain('pointer-events: none;');
    expect(face).not.toMatch(/(?:width|height|aspect-ratio):/);
  });

  it('sizes a day by its border box, so the forced-colors band edge never grows it', () => {
    expect(blockAfter(rules(), '.calendar-day {')).toContain('box-sizing: border-box;');
  });

  it('lays the grid out fixed, with square days', () => {
    const css = rules();
    const grid = blockAfter(css, '.calendar-grid {');
    expect(grid).toContain('width: 100%;');
    expect(grid).toContain('table-layout: fixed;');
    expect(grid).toContain('border-collapse: collapse;');
    expect(blockAfter(css, '.calendar-grid :is(th, td) {')).toContain('padding: 0;');
    expect(blockAfter(css, '.calendar-day {')).toContain('aspect-ratio: 1;');
    const number = blockAfter(css, '.calendar-day-number {');
    expect(number).toContain('font-variant-numeric: tabular-nums;');
    expect(number).toContain('unicode-bidi: isolate;');
    expect(number).toContain('font-size: var(--text-small);');
  });

  it('keeps the shape pill on days and presets', () => {
    const css = rules();
    expect(blockAfter(css, '.calendar-day-number {')).toContain('border-radius: var(--radius-pill);');
    const preset = blockAfter(css, '.calendar-preset {');
    expect(preset).toContain('border-radius: var(--radius-pill);');
    expect(preset).toContain('min-height: var(--size-control);');
    expect(preset).toContain('border: 1px solid var(--color-boundary);');
    expect(preset).toContain('font-weight: 500;');
    // Hit at the target in height, the formula every control shares.
    expect(blockAfter(css, '.calendar-preset::before {')).toContain(
      'inset-block: min(0px, (100% - var(--size-target)) / 2);',
    );
    expect(css.match(/border-radius:[^;]*;/g)?.every((each) => each.includes('var(--radius-pill)'))).toBe(
      true,
    );
  });

  it('draws today as a boundary ring and weight 700 on the number data-today, never on the cell data-today', () => {
    const css = rules();
    const today = blockAfter(css, '.calendar-day-number[data-today] {');
    expect(today).toContain('border-color: var(--color-boundary);');
    expect(today).toContain('font-weight: 700;');
    // React Aria's own mark reads the device's zone, so nothing keys on it (plan, spec correction 14).
    expect(css).not.toMatch(/\.calendar-day\[data-today\]/);
    expect(css).not.toMatch(/(?<!-number)\[data-today\]/);
    // The weights the system allows, and nothing else.
    for (const [, weight] of css.matchAll(/font-weight: (\d+);/g))
      expect(['450', '500', '700']).toContain(weight);
  });

  it('fills a single day and the range ends ink with canvas text, keyed on data-selected and aria-selected', () => {
    const css = outside();
    const fill = blockAfter(css, `${SINGLE} .calendar-day-number, ${ENDS} .calendar-day-number {`);
    expect(fill).toContain('border-color: var(--color-ink);');
    expect(fill).toContain('background-color: var(--color-ink);');
    expect(fill).toContain('color: var(--color-canvas);');
    // A chosen today keeps its weight and turns its ring canvas, an outline inside the fill and never a shadow.
    const chosenToday = blockAfter(
      css,
      `${SINGLE} .calendar-day-number[data-today], ${ENDS} .calendar-day-number[data-today] {`,
    );
    expect(chosenToday).toContain('outline: 1px solid var(--color-canvas);');
    expect(chosenToday).toContain('outline-offset: -3px;');
  });

  it('runs a 10% ink band under the middle days and the ends inner halves, with logical insets', () => {
    const css = outside();
    const band = 'background-color: color-mix(in srgb, var(--color-ink) 10%, transparent);';
    expect(blockAfter(css, `${MIDDLE} {`)).toContain(band);
    expect(blockAfter(css, `${MIDDLE} .calendar-day-number {`)).toContain('font-weight: 500;');
    const halves = blockAfter(
      css,
      '.range-calendar .calendar-day[data-selection-start]:not([data-selection-end])::before, .range-calendar .calendar-day[data-selection-end]:not([data-selection-start])::before {',
    );
    expect(halves).toContain(band);
    expect(halves).toContain('inset-block: 0;');
    expect(
      blockAfter(
        css,
        '.range-calendar .calendar-day[data-selection-start]:not([data-selection-end])::before {',
      ),
    ).toContain('inset-inline: 50% 0;');
    // Its own rule, after the shared one, whose selector list ends with the same text.
    expect(
      blockAfter(
        css,
        '} .range-calendar .calendar-day[data-selection-end]:not([data-selection-start])::before {',
      ),
    ).toContain('inset-inline: 0 50%;');
    expect(css).not.toMatch(/(?<![\w-])(left|right)\s*:/);
  });

  it('rings a day inside it, and an ink day with the canvas ring', () => {
    const css = rules();
    const ring = blockAfter(
      css,
      '.calendar-day:is(:focus-visible, [data-focus-visible]) .calendar-day-number {',
    );
    expect(ring).toContain('outline: var(--focus-ring-width) solid var(--focus-ring-color);');
    expect(ring).toContain('outline-offset: calc(-1 * var(--focus-ring-width));');
    const inverted = blockAfter(
      css,
      `.calendar:not(.range-calendar) .calendar-day[data-selected]:is(:focus-visible, [data-focus-visible]) .calendar-day-number, ${ENDS}:is(:focus-visible, [data-focus-visible]) .calendar-day-number {`,
    );
    expect(inverted).toContain('outline-color: var(--color-canvas);');
    expect(inverted).toContain(
      'outline-offset: calc(-1 * (var(--focus-ring-width) + var(--focus-ring-offset)));',
    );
    const preset = blockAfter(css, '.calendar-preset:is(:focus-visible, [data-focus-visible]) {');
    expect(preset).toContain('outline: var(--focus-ring-width) solid var(--focus-ring-color);');
    expect(preset).toContain('outline-offset: var(--focus-ring-offset);');
    expect(
      blockAfter(
        css,
        ".calendar-preset:is([data-selected], [aria-pressed='true']):is(:focus-visible, [data-focus-visible]) {",
      ),
    ).toContain('outline-color: var(--color-canvas);');
    const pressed = blockAfter(outside(), ".calendar-preset:is([data-selected], [aria-pressed='true']) {");
    expect(pressed).toContain('background-color: var(--color-ink);');
    expect(pressed).toContain('color: var(--color-canvas);');
  });

  it('draws unavailable days taupe and struck through, and disabled ones taupe', () => {
    const css = outside();
    expect(
      blockAfter(css, '.calendar-day:is([data-disabled], [data-unavailable]) .calendar-day-number {'),
    ).toContain('color: var(--color-taupe);');
    expect(blockAfter(css, '.calendar-day:is([data-disabled], [data-unavailable]) {')).toContain(
      'cursor: not-allowed;',
    );
    expect(blockAfter(css, '.calendar-day[data-unavailable] .calendar-day-number {')).toContain(
      'text-decoration: line-through;',
    );
    const preset = blockAfter(css, '.calendar-preset:is(:disabled, [data-disabled]) {');
    expect(preset).toContain('color: var(--color-taupe);');
    expect(preset).toContain('cursor: not-allowed;');
    // Taupe is for disabled text only; signal, clay, error and success have no place here.
    expect(css).not.toMatch(/--color-(?:error|gain|success|warning|signal|clay)/);
  });

  it('hides days outside the month and keeps their place', () => {
    expect(blockAfter(rules(), '.calendar-day[data-outside-month] {').trim()).toBe('visibility: hidden;');
  });

  it('mirrors the month chevrons under [dir=rtl] only', () => {
    const css = rules();
    expect(blockAfter(css, "[dir='rtl'] .calendar-header .icon-button svg {").trim()).toBe('scale: -1 1;');
    expect(css.match(/scale:/g)).toHaveLength(1);
  });

  it('hovers inside @media (hover: hover) only, and presses with the hover look', () => {
    const css = rules();
    const wash = 'background-color: color-mix(in srgb, var(--color-ink) 5%, transparent);';
    const hover = blockAfter(css, '@media (hover: hover)');
    expect(hover).toContain(':is(:hover, [data-hovered])');
    expect(
      stripComments(read('src/components/calendar.css')).match(/:is\(:hover, \[data-hovered\]\)/g),
    ).toHaveLength(2);
    expect(
      blockAfter(
        css,
        '.calendar-day:is(:active, [data-pressed]):not([data-disabled], [data-unavailable], [data-selected]) .calendar-day-number {',
      ),
    ).toContain(wash);
    expect(
      blockAfter(
        css,
        '.calendar-preset:is(:active, [data-pressed]):not(:disabled, [data-disabled], [data-selected]) {',
      ),
    ).toContain(wash);
  });

  it('uses no z-index and no box-shadow', () => {
    const css = stripComments(read('src/components/calendar.css'));
    expect(css).not.toMatch(/z-index/);
    expect(css).not.toMatch(/box-shadow/);
  });

  it('draws the chosen days Highlight, the band edges Highlight, today CanvasText and unavailable days GrayText in forced colors', () => {
    const forced = blockAfter(rules(), FORCED_COLORS);
    const chosen = blockAfter(
      forced,
      `.calendar:not(.range-calendar) :is(.calendar-day[data-selected], [aria-selected='true'] > .calendar-day) .calendar-day-number, ${ENDS} .calendar-day-number, .calendar-preset:is([data-selected], [aria-pressed='true']) {`,
    );
    // Out of the forced repaint, whose backplate would blank the text, with its ring HighlightText inside the fill.
    expect(chosen).toContain('forced-color-adjust: none;');
    expect(chosen).toContain('outline-color: HighlightText;');
    expect(chosen).toContain('background-color: Highlight;');
    expect(chosen).toContain('color: HighlightText;');
    expect(chosen).toContain('border-color: Highlight;');
    expect(blockAfter(forced, `${MIDDLE} {`)).toContain('border-block: 1px solid Highlight;');
    expect(blockAfter(forced, '.calendar-day-number[data-today] {')).toContain('border-color: CanvasText;');
    expect(blockAfter(forced, '.calendar-weekday {')).toContain('color: CanvasText;');
    expect(
      blockAfter(
        forced,
        '.calendar-day:is([data-disabled], [data-unavailable]) .calendar-day-number, .calendar-preset:is(:disabled, [data-disabled]) {',
      ),
    ).toContain('color: GrayText;');
  });
});

describe('src/components/date-range-picker.css', () => {
  // The rules without their comments, with their whitespace closed up.
  const rules = () => closeUp(stripComments(read('src/components/date-range-picker.css')));
  const outside = () => closeUp(outsideForcedColors(read('src/components/date-range-picker.css')));
  /** Every selector the file writes, each part of a list on its own. */
  const selectors = () =>
    [...rules().matchAll(/([^{}]+)\{/g)]
      .map((match) => match[1].trim())
      .filter((selector) => !selector.startsWith('@'))
      .flatMap((selector) => selector.split(/,(?![^(]*\))/).map((part) => part.trim()));
  const RING =
    '.date-range-control.input:where(:has(.date-segment:is(:focus-visible, [data-focus-visible])))';

  it('lays the frame out as a row on .input with one-class rules, padded clear of the button', () => {
    const frame = blockAfter(rules(), '.date-range-control {');
    for (const declaration of [
      'position: relative;',
      'display: flex;',
      'align-items: center;',
      'gap: var(--spacing-part);',
      'min-width: 0;',
      'padding-inline: 1.5rem 3rem;',
      'cursor: text;',
    ]) {
      expect(frame, declaration).toContain(declaration);
    }
    // The frame clips nothing, so the button's 40px hit area reaches past it on every side at either density.
    expect(frame).not.toContain('overflow');
    // The dates clip instead, across only, so a date too wide for a narrow frame never spills out of it.
    const dates = blockAfter(rules(), '.date-range-dates {');
    for (const declaration of [
      'display: flex;',
      'flex: auto;',
      'align-items: center;',
      'gap: var(--spacing-part);',
      'min-width: 0;',
      'overflow-x: clip;',
    ]) {
      expect(dates, declaration).toContain(declaration);
    }
    expect(dates).not.toContain('overflow: hidden');
    // The edge, the fill, the height and the states are input.css's: the frame's own rule sets none of them.
    for (const property of ['border', 'background', 'color:', 'height']) {
      expect(frame, property).not.toContain(property);
    }
    // Each date keeps its own box and never shrinks; the face ellipsizes on one line.
    const input = blockAfter(rules(), '.date-range-input {');
    expect(input).toContain('display: inline-flex;');
    expect(input).toContain('flex: none;');
    expect(input).toContain('white-space: nowrap;');
    const face = blockAfter(rules(), '.date-range-face {');
    for (const declaration of [
      'min-width: 0;',
      // A segment's padding, so the app's text starts where the first segment's will.
      'padding-inline: 0.125rem;',
      'overflow: hidden;',
      'text-overflow: ellipsis;',
      'white-space: nowrap;',
      'color: var(--color-ink);',
    ]) {
      expect(face, declaration).toContain(declaration);
    }
  });

  it('rings the frame only for a focused segment, at two classes with the test in :where()', () => {
    const ring = blockAfter(rules(), `${RING} {`);
    for (const declaration of [
      'border: 1.5px solid var(--color-ink);',
      'outline: var(--focus-ring-width) solid var(--focus-ring-color);',
      'outline-offset: var(--focus-ring-offset);',
    ]) {
      expect(ring, declaration).toContain(declaration);
    }
    // Written plainly, the :has() would weigh three classes, tie the changed edge and replace it by order.
    expect(selectors().filter((selector) => selector.includes(':has('))).toEqual([RING]);
  });

  it('never rings the frame through :focus-within or data-focus-visible on the frame', () => {
    const css = rules();
    expect(css).not.toContain('focus-within');
    expect(
      selectors().filter((selector) => /\.date-range-control[^ ]*\[data-focus-visible\]/.test(selector)),
    ).toEqual([]);
    // React Aria's picker writes data-focus-visible on its root while the button holds focus; nothing keys on it.
    expect(selectors().filter((selector) => /\.date-range-picker[^ ]*\[data-focus/.test(selector))).toEqual(
      [],
    );
  });

  it('draws segments ink in tabular figures, the placeholder slate, labelled or not, and taupe only while disabled', () => {
    const css = outside();
    expect(blockAfter(css, '.date-range-input {')).toContain('font-variant-numeric: tabular-nums;');
    const segment = blockAfter(css, '.date-segment {');
    expect(segment).toContain('color: var(--color-ink);');
    expect(segment).toContain('caret-color: transparent;');
    // Empty segments are text axe measures, so slate with a label or without one, as Select's placeholder is.
    expect(blockAfter(css, '.date-segment[data-placeholder] {')).toContain('color: var(--color-slate);');
    expect(
      blockAfter(
        css,
        '.date-range-picker[data-disabled] :is(.date-segment, .date-range-arrow, .date-range-face) {',
      ),
    ).toContain('color: var(--color-taupe);');
    // One placeholder rule, and nothing keys on the missing label.
    expect(selectors().filter((selector) => selector.includes('data-placeholder'))).toEqual([
      '.date-segment[data-placeholder]',
    ]);
    // Nothing but the changed dot keys on the missing label.
    expect(
      css.replace(/\.date-range-picker\[data-changed\]\[data-unlabelled\][^{]*\{[^}]*\}/g, ''),
    ).not.toContain('data-unlabelled');
  });

  it('lets no placeholder rule outrank the focused segment, so a focused empty segment takes the focus colors', () => {
    const FOCUSED = '.date-segment:is(:focus, [data-focused])';
    /** A selector's specificity as [ids, classes, types], :is() and :not() at their heaviest part, :where() at 0. */
    const weigh = (selector) => {
      let weight = [0, 0, 0];
      const add = (other) => {
        weight = weight.map((each, index) => each + other[index]);
      };
      const heaviest = (list) =>
        list
          .split(/,(?![^(]*\))/)
          .map((part) => weigh(part.trim()))
          .reduce((a, b) =>
            a[0] !== b[0]
              ? a[0] > b[0]
                ? a
                : b
              : a[1] !== b[1]
                ? a[1] > b[1]
                  ? a
                  : b
                : a[2] >= b[2]
                  ? a
                  : b,
          );
      let rest = selector;
      for (const match of selector.matchAll(/:(is|not|has|where)\(((?:[^()]|\([^()]*\))*)\)/g)) {
        if (match[1] !== 'where') add(heaviest(match[2]));
        rest = rest.replace(match[0], ' ');
      }
      add([(rest.match(/#[\w-]+/g) ?? []).length, 0, 0]);
      add([0, (rest.match(/\.[\w-]+|\[[^\]]*\]|:(?!:)[\w-]+/g) ?? []).length, 0]);
      add([0, 0, (rest.replace(/\[[^\]]*\]/g, '').match(/(?:^|[\s>+~])[a-z][\w-]*/gi) ?? []).length]);
      return weight;
    };
    const compare = (a, b) => a[0] - b[0] || a[1] - b[1] || a[2] - b[2];
    const order = selectors();
    const focusAt = order.indexOf(FOCUSED);
    expect(focusAt).toBeGreaterThan(-1);
    // Disabled segments take no focus, so the disabled rule may weigh more.
    const placeholders = order
      .map((selector, index) => ({ selector, index }))
      .filter(({ selector }) => selector.includes('data-placeholder'));
    expect(placeholders.length).toBeGreaterThan(0);
    for (const { selector, index } of placeholders) {
      const against = compare(weigh(selector), weigh(FOCUSED));
      expect(against, selector).toBeLessThanOrEqual(0);
      if (against === 0) expect(index, `${selector} comes before the focus rule`).toBeLessThan(focusAt);
    }
    // The calculator itself: the old unlabelled rule outranked the focus rule.
    expect(
      compare(
        weigh('.date-range-picker[data-unlabelled]:not([data-disabled]) .date-segment[data-placeholder]'),
        weigh(FOCUSED),
      ),
    ).toBeGreaterThan(0);
  });

  it('fills the focused segment ink on the micro radius', () => {
    const css = outside();
    expect(blockAfter(css, '.date-segment {')).toContain('border-radius: var(--radius-micro);');
    expect(blockAfter(css, '.date-segment {')).toContain('outline: none;');
    const focused = blockAfter(css, '.date-segment:is(:focus, [data-focused]) {');
    expect(focused).toContain('background-color: var(--color-ink);');
    expect(focused).toContain('color: var(--color-canvas);');
    // The literal separators take no padding of their own.
    expect(blockAfter(css, ".date-segment[data-type='literal'] {")).toContain('padding-inline: 0;');
  });

  it('mirrors the arrow under [dir=rtl] and nothing else', () => {
    const css = rules();
    expect(blockAfter(css, "[dir='rtl'] .date-range-arrow svg {")).toContain('scale: -1 1;');
    expect(css.match(/\[dir='rtl'\]/g)).toHaveLength(1);
    expect(blockAfter(css, '.date-range-arrow {')).toContain('color: var(--color-slate);');
    const glyph = blockAfter(css, '.date-range-arrow svg {');
    expect(glyph).toContain('width: 16px;');
    expect(glyph).toContain('height: 16px;');
    // Logical properties only.
    expect(css).not.toMatch(
      /(?:margin|padding|inset|border)-(?:left|right|top|bottom)\b|(?<![\w-])(?:left|right|top|bottom):/,
    );
  });

  it('pads the calendar popover 16px with two classes, and sizes it to the month', () => {
    const popover = blockAfter(rules(), '.date-range-popover.popover-padded {');
    expect(popover).toContain('padding: var(--spacing-inset);');
    // Seven controls, the padding and the 1px frame on each side; popover.css caps it at the viewport less 2rem.
    expect(popover).toContain('width: calc(7 * var(--size-control) + 2 * var(--spacing-inset) + 2px);');
    expect(blockAfter(closeUp(stripComments(read('src/components/popover.css'))), '.popover {')).toContain(
      'max-width: calc(100vw - 2rem);',
    );
  });

  it('draws the focused segment Highlight and the arrow CanvasText in forced colors', () => {
    const forced = closeUp(
      blockAfter(stripComments(read('src/components/date-range-picker.css')), FORCED_COLORS),
    );
    expect(blockAfter(forced, '.date-range-arrow {')).toContain('color: CanvasText;');
    const focused = blockAfter(forced, '.date-segment:is(:focus, [data-focused]) {');
    expect(focused).toContain('background-color: Highlight;');
    expect(focused).toContain('color: HighlightText;');
    expect(
      blockAfter(
        forced,
        '.date-range-picker[data-disabled] :is(.date-segment, .date-range-arrow, .date-range-face) {',
      ),
    ).toContain('color: GrayText;');
  });

  it('moves nothing, so it needs no reduced-motion block', () => {
    const css = rules();
    expect(css).not.toContain('transition');
    expect(css).not.toContain('animation');
  });
});

describe('src/components/filter-chip.css', () => {
  // The rules without their comments, with their whitespace closed up.
  const rules = () => closeUp(stripComments(read('src/components/filter-chip.css')));
  const outside = () => closeUp(outsideForcedColors(read('src/components/filter-chip.css')));
  /** Every selector the file writes, each part of a list on its own. */
  const selectors = () =>
    [...rules().matchAll(/([^{}]+)\{/g)]
      .map((match) => match[1].trim())
      .filter((selector) => !selector.startsWith('@'))
      .flatMap((selector) => selector.split(/,(?![^(]*\))/).map((part) => part.trim()));
  const WASH = 'background-color: color-mix(in srgb, var(--color-ink) 5%, transparent);';

  it('draws the pill a control tall on the shape pill with the boundary edge on nothing', () => {
    const pill = blockAfter(outside(), '.filter-chip {');
    for (const declaration of [
      'position: relative;',
      'display: inline-flex;',
      'min-width: 0;',
      'max-width: 100%;',
      'min-height: var(--size-control);',
      'border: 1px solid var(--color-boundary);',
      'border-radius: var(--radius-pill);',
      'background-color: transparent;',
      'color: var(--color-ink);',
    ]) {
      expect(pill, declaration).toContain(declaration);
    }
    const trigger = blockAfter(outside(), '.filter-chip-trigger {');
    for (const declaration of [
      'padding-inline: 1rem 0.75rem;',
      'gap: var(--spacing-part);',
      'font-size: var(--text-small);',
      'line-height: var(--text-small--line-height);',
      'font-weight: 500;',
      'border-radius: inherit;',
      'outline: none;',
    ]) {
      expect(trigger, declaration).toContain(declaration);
    }
    // The trigger pads 4px to the clear button, and only where one follows it.
    expect(
      blockAfter(outside(), '.filter-chip[data-active]:has(> .filter-chip-clear) .filter-chip-trigger {'),
    ).toContain('padding-inline-end: 0.25rem;');
    const chevron = blockAfter(outside(), '.filter-chip-chevron {');
    expect(chevron).toContain('color: var(--color-slate);');
    expect(blockAfter(outside(), '.filter-chip-chevron svg {')).toContain('width: 16px;');
  });

  it('takes the Select root out of the box tree', () => {
    expect(blockAfter(rules(), '.filter-chip-select {')).toContain('display: contents;');
  });

  it('hits the trigger at the target in height by the shared formula', () => {
    const hit = blockAfter(rules(), '.filter-chip-trigger::before {');
    expect(hit).toContain("content: '';");
    expect(hit).toContain('position: absolute;');
    expect(hit).toContain('inset-block: min(0px, (100% - var(--size-target)) / 2);');
    expect(hit).toContain('inset-inline: 0;');
  });

  it('washes an inactive chip 5% ink on hover, only where hover exists, on a press and while open', () => {
    const hover = blockAfter(rules(), '@media (hover: hover) {');
    expect(
      blockAfter(
        hover,
        '.filter-chip:not([data-active], [data-disabled]):has(.filter-chip-trigger:is(:hover, [data-hovered])) {',
      ),
    ).toContain(WASH);
    expect(
      blockAfter(
        rules(),
        '.filter-chip:not([data-active], [data-disabled]):is([data-open], :has(.filter-chip-trigger:is(:active, [data-pressed]))) {',
      ),
    ).toContain(WASH);
    // Every hover rule sits inside the hover query.
    const outsideHover = rules().replace(/@media \(hover: hover\) \{(?:[^{}]*\{[^{}]*\})*[^{}]*\}/g, '');
    expect(outsideHover).not.toMatch(/:hover/);
  });

  it('fills an active chip ink with canvas text, the label at 450 and the value at 700, ellipsized past 16rem', () => {
    const css = outside();
    const active = blockAfter(css, '.filter-chip[data-active] {');
    expect(active).toContain('border-color: var(--color-ink);');
    expect(active).toContain('background-color: var(--color-ink);');
    expect(active).toContain('color: var(--color-canvas);');
    expect(blockAfter(css, '.filter-chip[data-active] .filter-chip-label {')).toContain('font-weight: 450;');
    expect(blockAfter(css, '.filter-chip[data-active] .filter-chip-chevron {')).toContain(
      'color: var(--color-canvas);',
    );
    const value = blockAfter(css, '.filter-chip-value {');
    for (const declaration of [
      'min-width: 0;',
      'max-width: 16rem;',
      'overflow: hidden;',
      'font-weight: 700;',
      'text-overflow: ellipsis;',
      'white-space: nowrap;',
    ]) {
      expect(value, declaration).toContain(declaration);
    }
    expect(blockAfter(css, '.filter-chip-label {')).toContain('white-space: nowrap;');
    // Weights 400, 450, 500 and 700 only.
    for (const [, weight] of css.matchAll(/font-weight: (\d+);/g)) {
      expect(['400', '450', '500', '700']).toContain(weight);
    }
  });

  it('never uses signal orange, clay, error or success', () => {
    const css = rules();
    for (const token of [
      '--color-signal',
      '--color-clay',
      '--color-error',
      '--color-success',
      '--color-gain',
    ]) {
      expect(css, token).not.toContain(token);
    }
  });

  it('rings the whole pill for a focused trigger', () => {
    const ring = blockAfter(
      rules(),
      '.filter-chip:has(.filter-chip-trigger:is(:focus-visible, [data-focus-visible])) {',
    );
    expect(ring).toContain('outline: var(--focus-ring-width) solid var(--focus-ring-color);');
    expect(ring).toContain('outline-offset: var(--focus-ring-offset);');
  });

  it('draws the clear button 2rem wide with a 24px circle, a 15% canvas wash and an inset canvas ring', () => {
    const css = rules();
    const clear = blockAfter(css, '.filter-chip-clear {');
    for (const declaration of [
      'display: inline-grid;',
      'flex: none;',
      'place-items: center;',
      'width: 2rem;',
      'padding: 0;',
      'border: 0;',
      'background-color: transparent;',
      'outline: none;',
    ]) {
      expect(clear, declaration).toContain(declaration);
    }
    // Hit at the target in height by the trigger's formula, and only in height, so it never reaches over the
    // trigger: 32 by 40 in every density.
    expect(clear).toContain('position: relative;');
    const hit = blockAfter(css, '.filter-chip-clear::before {');
    expect(hit).toContain("content: '';");
    expect(hit).toContain('position: absolute;');
    expect(hit).toContain('inset-block: min(0px, (100% - var(--size-target)) / 2);');
    expect(hit).toContain('inset-inline: 0;');
    const icon = blockAfter(css, '.filter-chip-clear-icon {');
    expect(icon).toContain('width: 1.5rem;');
    expect(icon).toContain('height: 1.5rem;');
    expect(icon).toContain('border-radius: var(--radius-pill);');
    expect(blockAfter(css, '.filter-chip-clear-icon svg {')).toContain('width: 12px;');
    const WASH15 = 'background-color: color-mix(in srgb, var(--color-canvas) 15%, transparent);';
    expect(
      blockAfter(
        blockAfter(css.slice(css.indexOf('.filter-chip-clear-icon svg')), '@media (hover: hover) {'),
        '.filter-chip-clear:is(:hover, [data-hovered]) .filter-chip-clear-icon {',
      ),
    ).toContain(WASH15);
    expect(
      blockAfter(css, '.filter-chip-clear:is(:active, [data-pressed]) .filter-chip-clear-icon {'),
    ).toContain(WASH15);
    const ring = blockAfter(
      css,
      '.filter-chip-clear:is(:focus-visible, [data-focus-visible]) .filter-chip-clear-icon {',
    );
    expect(ring).toContain('outline: var(--focus-ring-width) solid var(--color-canvas);');
    expect(ring).toContain('outline-offset: calc(-1 * var(--focus-ring-width));');
  });

  it('draws a disabled chip with a 15% ink edge and taupe text', () => {
    const css = outside();
    const disabled = blockAfter(css, '.filter-chip[data-disabled] {');
    expect(disabled).toContain('border-color: color-mix(in srgb, var(--color-ink) 15%, transparent);');
    expect(disabled).toContain('color: var(--color-taupe);');
    expect(blockAfter(css, '.filter-chip[data-disabled][data-active] {')).toContain(
      'background-color: var(--color-disabled);',
    );
    expect(blockAfter(css, '.filter-chip[data-disabled] .filter-chip-trigger {')).toContain(
      'cursor: not-allowed;',
    );
    expect(blockAfter(css, '.filter-chip[data-disabled] .filter-chip-chevron {')).toContain(
      'color: var(--color-taupe);',
    );
    // Taupe only where disabled.
    for (const selector of selectors().filter((each) =>
      blockAfter(css, `${each} {`).includes('--color-taupe'),
    )) {
      expect(selector).toContain('[data-disabled]');
    }
  });

  it('pads the panel 16px with two classes and caps it inside the viewport', () => {
    const panel = blockAfter(rules(), '.filter-chip-panel.popover-padded {');
    expect(panel).toContain('max-width: min(22rem, 100vw - 2rem);');
    expect(panel).toContain('--holder-pad: var(--spacing-inset);');
    expect(panel).toContain('padding: var(--holder-pad);');
    // The dialog React Aria focuses as the panel opens draws no ring of its own.
    expect(blockAfter(rules(), '.filter-chip-dialog {')).toContain('outline: none;');
  });

  it('turns the chevron half a turn while open, in 140ms, and not under reduced motion', () => {
    const css = rules();
    expect(blockAfter(css, '.filter-chip-chevron {')).toContain('transition: rotate 140ms ease;');
    expect(blockAfter(css, '.filter-chip[data-open] .filter-chip-chevron {')).toContain('rotate: 180deg;');
    const reduced = blockAfter(css, '@media (prefers-reduced-motion: reduce) {');
    expect(blockAfter(reduced, '.filter-chip-chevron {')).toContain('transition: none;');
  });

  it('mirrors nothing', () => {
    const css = rules();
    expect(css).not.toContain("[dir='rtl']");
    expect(css).not.toContain('scale: -1');
    expect(css).not.toMatch(
      /(?:margin|padding|inset|border)-(?:left|right|top|bottom)\b|(?<![\w-])(?:left|right|top|bottom):/,
    );
  });

  it('draws the edge CanvasText, an active chip Highlight and HighlightText, and a disabled one GrayText on canvas in forced colors', () => {
    const forced = closeUp(blockAfter(stripComments(read('src/components/filter-chip.css')), FORCED_COLORS));
    expect(blockAfter(forced, '.filter-chip {')).toContain('border-color: CanvasText;');
    expect(blockAfter(forced, '.filter-chip-chevron {')).toContain('color: CanvasText;');
    const active = blockAfter(forced, '.filter-chip[data-active] {');
    expect(active).toContain('border-color: Highlight;');
    expect(active).toContain('background-color: Highlight;');
    expect(active).toContain('color: HighlightText;');
    expect(
      blockAfter(forced, '.filter-chip[data-active] :is(.filter-chip-chevron, .filter-chip-clear) {'),
    ).toContain('color: HighlightText;');
    const disabled = blockAfter(
      forced,
      '.filter-chip[data-disabled], .filter-chip[data-disabled] .filter-chip-chevron {',
    );
    expect(disabled).toContain('border-color: GrayText;');
    expect(disabled).toContain('color: GrayText;');
    // A disabled active chip leaves Highlight for canvas, so GrayText is drawn on the page's own ground.
    expect(blockAfter(forced, '.filter-chip[data-disabled][data-active] {')).toContain(
      'background-color: canvas;',
    );
  });
});

describe('src/components/filter-bar.css', () => {
  // The rules without their comments, with their whitespace closed up.
  const rules = () => closeUp(stripComments(read('src/components/filter-bar.css')));
  const PHONE = '@media (width < 768px)';

  it('lays the bar and its row out as wrapping flex rows with the part gap', () => {
    for (const selector of ['.filter-bar {', '.filter-bar-row {']) {
      const rule = blockAfter(rules(), selector);
      for (const declaration of [
        'display: flex;',
        'flex-wrap: wrap;',
        'align-items: center;',
        'gap: var(--spacing-part);',
      ]) {
        expect(rule, `${selector} ${declaration}`).toContain(declaration);
      }
    }
    expect(blockAfter(rules(), '.filter-bar-row {')).toContain('min-width: 0;');
  });

  it('gives the search 16rem to grow from and 24rem at most', () => {
    const search = blockAfter(rules(), '.filter-bar-search {');
    expect(search).toContain('flex: 1 1 16rem;');
    expect(search).toContain('min-width: 0;');
    expect(search).toContain('max-width: 24rem;');
  });

  it('puts Clear all at the inline end', () => {
    expect(blockAfter(rules(), '.filter-bar-clear-all {')).toContain('margin-inline-start: auto;');
  });

  it('hides the Filters button above the phone width and shows it below, where the row, More and Clear all leave', () => {
    const css = rules();
    expect(blockAfter(css.slice(0, css.indexOf(PHONE)), '.filter-bar-sheet-button {')).toContain(
      'display: none;',
    );
    const icon = blockAfter(css, '.filter-bar-sheet-button svg {');
    expect(icon).toContain('width: 16px;');
    expect(icon).toContain('height: 16px;');
    const phone = blockAfter(css, PHONE);
    expect(blockAfter(phone, '.filter-bar-row, .filter-bar-clear-all {')).toContain('display: none;');
    expect(blockAfter(phone, '.filter-bar-sheet-button {')).toContain('display: inline-flex;');
    const search = blockAfter(phone, '.filter-bar-search {');
    expect(search).toContain('flex: 1 1 0;');
    expect(search).toContain('max-width: none;');
  });

  it('switches at the small breakpoint, written out', async () => {
    // A media query cannot read a custom property, so the width is written out and must stay the token.
    const { tokens } = await import('../dist/tokens.js');
    const css = rules();
    expect(css).toContain(`@media (width < ${tokens.breakpoint.sm.value})`);
    expect([...css.matchAll(/@media \(([^)]*)\)/g)].map((match) => match[1])).toEqual([
      `width < ${tokens.breakpoint.sm.value}`,
    ]);
  });

  it('stacks the panel sections a peer step apart with a divider, and the sheet sections a peer step apart', () => {
    const css = rules();
    const panel = blockAfter(css, '.filter-bar-more-panel .filter-section + .filter-section {');
    expect(panel).toContain('margin-block-start: var(--spacing-peer);');
    expect(panel).toContain('padding-block-start: var(--spacing-peer);');
    expect(panel).toContain('border-block-start: 1px solid var(--color-divider);');
    const sheet = blockAfter(css, '.sheet .filter-section + .filter-section {');
    expect(sheet).toContain('margin-block-start: var(--spacing-peer);');
    expect(sheet).not.toContain('border');
    // The panel pads 16px with two classes, after popover.css's one, and stays inside a phone's margins.
    const padded = blockAfter(css, '.filter-bar-more-panel.popover-padded {');
    expect(padded).toContain('max-width: min(22rem, 100vw - 2rem);');
    expect(padded).toContain('padding: var(--spacing-inset);');
    // The dialog React Aria focuses as the panel opens draws no ring of its own.
    expect(blockAfter(css, '.filter-bar-more-dialog {')).toContain('outline: none;');
  });

  it('heads a section at the h4 step at 700 in ink, its clear word at the inline end and its body a part step under it', () => {
    const css = rules();
    const head = blockAfter(css, '.filter-section-head {');
    expect(head).toContain('display: flex;');
    expect(head).toContain('justify-content: space-between;');
    expect(head).toContain('margin-block-end: var(--spacing-part);');
    const title = blockAfter(css, '.filter-section-title {');
    expect(title).toContain('color: var(--color-ink);');
    expect(title).toContain('font-size: var(--text-h4);');
    expect(title).toContain('line-height: var(--text-h4--line-height);');
    expect(title).toContain('font-weight: 700;');
    for (const [, weight] of css.matchAll(/font-weight: (\d+);/g)) {
      expect(['400', '450', '500', '700']).toContain(weight);
    }
  });

  it('lays the sheet footer out with Clear all at the start and Done at the end', () => {
    const css = rules();
    const actions = blockAfter(css, '.filter-bar-sheet-actions {');
    expect(actions).toContain('display: flex;');
    expect(actions).toContain('justify-content: flex-end;');
    expect(actions).toContain('gap: var(--spacing-part);');
    expect(blockAfter(css, '.filter-bar-sheet-clear-all {')).toContain('margin-inline-end: auto;');
  });

  it('never uses signal orange, clay, error, success or taupe', () => {
    const css = rules();
    for (const token of [
      '--color-signal',
      '--color-clay',
      '--color-error',
      '--color-success',
      '--color-gain',
      '--color-taupe',
    ]) {
      expect(css, token).not.toContain(token);
    }
  });

  it('mirrors nothing and writes only logical sides', () => {
    const css = rules();
    expect(css).not.toContain("[dir='rtl']");
    expect(css).not.toMatch(
      /(?:margin|padding|inset|border)-(?:left|right|top|bottom)\b|(?<![\w-])(?:left|right|top|bottom):/,
    );
  });
});

describe('src/components/empty-state.css', () => {
  // The rules without their comments, with their whitespace closed up.
  const rules = () => closeUp(stripComments(read('src/components/empty-state.css')));
  const FORCED = '@media (forced-colors: active)';

  it('centers a column, padded a separate step by a peer step', () => {
    const root = blockAfter(rules(), '.empty-state {');
    for (const declaration of [
      'box-sizing: border-box;',
      'display: flex;',
      'flex-direction: column;',
      'align-items: center;',
      'padding: var(--spacing-separate) var(--spacing-peer);',
      'color: var(--color-ink);',
      'text-align: center;',
    ]) {
      expect(root, declaration).toContain(declaration);
    }
  });

  it('draws the icon 24px in slate, a part step over the title', () => {
    const css = rules();
    const icon = blockAfter(css, '.empty-state-icon {');
    expect(icon).toContain('display: inline-flex;');
    expect(icon).toContain('margin-block-end: var(--spacing-part);');
    expect(icon).toContain('color: var(--color-slate);');
    const svg = blockAfter(css, '.empty-state-icon svg {');
    expect(svg).toContain('width: 24px;');
    expect(svg).toContain('height: 24px;');
  });

  it('sets the title at the h4 step at 700 in ink', () => {
    const title = blockAfter(rules(), '.empty-state-title {');
    for (const declaration of [
      'margin: 0;',
      'color: var(--color-ink);',
      'font-size: var(--text-h4);',
      'line-height: var(--text-h4--line-height);',
      'font-weight: 700;',
      'overflow-wrap: anywhere;',
    ]) {
      expect(title, declaration).toContain(declaration);
    }
    for (const [, weight] of rules().matchAll(/font-weight: (\d+);/g)) {
      expect(['400', '450', '500', '700']).toContain(weight);
    }
  });

  it('sets the description at the small step in slate, never taupe, 32rem at most', () => {
    const css = rules();
    const description = blockAfter(css, '.empty-state-description {');
    for (const declaration of [
      'max-inline-size: 32rem;',
      'margin: 0;',
      'margin-block-start: 0.25rem;',
      'color: var(--color-slate);',
      'font-size: var(--text-small);',
      'line-height: var(--text-small--line-height);',
      'font-weight: var(--text-small--font-weight);',
      'overflow-wrap: anywhere;',
    ]) {
      expect(description, declaration).toContain(declaration);
    }
    // The reader needs to read it: no taupe and no reserved color anywhere in the part.
    for (const token of [
      '--color-taupe',
      '--color-signal',
      '--color-clay',
      '--color-error',
      '--color-success',
    ]) {
      expect(css, token).not.toContain(token);
    }
  });

  it('puts the action a peer step under the text', () => {
    expect(blockAfter(rules(), '.empty-state-action {')).toContain(
      'margin-block-start: var(--spacing-peer);',
    );
  });

  it('draws the icon CanvasText in forced colors', () => {
    const forced = blockAfter(rules(), FORCED);
    expect(blockAfter(forced, '.empty-state-icon {')).toContain('color: CanvasText;');
  });

  it('mirrors nothing, moves nothing and writes only logical sides', () => {
    const css = rules();
    expect(css).not.toContain("[dir='rtl']");
    expect(css).not.toMatch(/(?<![\w-])(?:transition|animation)\s*:/);
    expect(css).not.toMatch(
      /(?:margin|padding|inset|border)-(?:left|right|top|bottom)\b|(?<![\w-])(?:left|right|top|bottom):/,
    );
  });
});

describe('src/components/skeleton.css', () => {
  // The rules without their comments, with their whitespace closed up.
  const rules = () => closeUp(stripComments(read('src/components/skeleton.css')));
  const FORCED = '@media (forced-colors: active)';
  const REDUCED = '@media (prefers-reduced-motion: reduce)';

  it('fills a line 1em tall at the micro radius with the divider color, on the line box', () => {
    const line = blockAfter(rules(), '.skeleton {');
    for (const declaration of [
      'box-sizing: border-box;',
      'display: inline-block;',
      'inline-size: 100%;',
      'block-size: 1em;',
      'vertical-align: middle;',
      'border-radius: var(--radius-micro);',
      'background-color: var(--color-divider);',
    ]) {
      expect(line, declaration).toContain(declaration);
    }
  });

  it('draws a block a field tall at the control radius and a circle the target at the dot radius', () => {
    const css = rules();
    const block = blockAfter(css, ".skeleton[data-shape='block'] {");
    expect(block).toContain('display: block;');
    expect(block).toContain('block-size: var(--size-field);');
    expect(block).toContain('border-radius: var(--radius-control);');
    const circle = blockAfter(css, ".skeleton[data-shape='circle'] {");
    expect(circle).toContain('inline-size: var(--size-target);');
    expect(circle).toContain('block-size: var(--size-target);');
    expect(circle).toContain('border-radius: var(--radius-dot);');
    // A fixed shape in a flex row, as Avatar's and Spinner's, so lines beside it never squeeze it to an oval.
    expect(circle).toContain('flex: none;');
  });

  it('pulses between the fill and half of it over 1.6s, and stands still under reduced motion', () => {
    const css = rules();
    expect(blockAfter(css, '.skeleton {')).toContain('animation: skeleton-pulse 1.6s ease-in-out infinite;');
    const frames = blockAfter(css, '@keyframes skeleton-pulse {');
    expect(blockAfter(frames, '0%, 100% {')).toContain('opacity: 1;');
    expect(blockAfter(frames, '50% {')).toContain('opacity: 0.5;');
    expect(blockAfter(blockAfter(css, REDUCED), '.skeleton {')).toContain('animation: none;');
    // Only the opacity moves: never a sweep of color across the shape.
    expect(css).not.toContain('linear-gradient');
    expect(css).not.toMatch(/(?<![\w-])transition\s*:/);
  });

  it('opts out of the forced repaint with GrayText and then CanvasText at 20% through color-mix', () => {
    const forced = blockAfter(blockAfter(rules(), FORCED), '.skeleton {');
    expect(forced).toContain('forced-color-adjust: none;');
    const fallback = forced.indexOf('background-color: GrayText;');
    const mixed = forced.indexOf('background-color: color-mix(in srgb, CanvasText 20%, canvas);');
    expect(fallback).toBeGreaterThanOrEqual(0);
    // The mix comes second, so a browser that cannot read it keeps GrayText.
    expect(mixed).toBeGreaterThan(fallback);
  });

  it('mirrors nothing and writes only logical sides', () => {
    const css = rules();
    expect(css).not.toContain("[dir='rtl']");
    expect(css).not.toMatch(
      /(?:margin|padding|inset|border)-(?:left|right|top|bottom)\b|(?<![\w-])(?:left|right|top|bottom|width|height):/,
    );
  });
});

describe('src/components/data-table.css', () => {
  // The rules without their comments, with their whitespace closed up.
  const rules = () => closeUp(stripComments(read('src/components/data-table.css')));
  const FORCED = '@media (forced-colors: active)';
  const HOVER = '@media (hover: hover)';
  /** Every rule block, as [selector, body] pairs, outside the media and container blocks too. */
  const blocks = () =>
    [...rules().matchAll(/([^{};]+)\{([^{}]*)\}/g)].map((match) => [match[1].trim(), match[2]]);

  it('makes the table a size container named data-table, laid out fixed at full width', () => {
    const css = rules();
    const root = blockAfter(css, '.data-table {');
    for (const declaration of [
      '--data-table-row: max(var(--size-target), var(--size-field));',
      '--data-table-fill: var(--data-table-surface, var(--color-canvas));',
      'container: data-table / inline-size;',
      'min-inline-size: 0;',
      'color: var(--color-ink);',
    ]) {
      expect(root, declaration).toContain(declaration);
    }
    const table = blockAfter(css, '.data-table-table {');
    for (const declaration of [
      'inline-size: 100%;',
      'table-layout: fixed;',
      'border-collapse: separate;',
      'border-spacing: 0;',
    ]) {
      expect(table, declaration).toContain(declaration);
    }
    // No surface of its own and never a scroller: the header sticks to the page (ruling 6).
    expect(css).not.toMatch(/overflow(?:-x|-inline)?: (?:auto|scroll)/);
    expect(root).not.toContain('background');
  });

  it('sticks the header cells at --page-sticky-top, one layer under the header token, on the surface fill', () => {
    const column = blockAfter(rules(), '.data-table-column {');
    for (const declaration of [
      'position: sticky;',
      'inset-block-start: var(--page-sticky-top, 0px);',
      'z-index: calc(var(--z-header) - 1);',
      'background-color: var(--data-table-fill);',
    ]) {
      expect(column, declaration).toContain(declaration);
    }
    // The cells stick, not the thead (spec correction 16).
    expect(rules()).not.toMatch(/\.data-table-header \{[^}]*position: sticky/);
  });

  it('draws the header at the overline step in slate, ink while sorted and on hover only where hover exists', () => {
    const css = rules();
    const column = blockAfter(css, '.data-table-column {');
    for (const declaration of [
      'block-size: var(--size-target);',
      'border-block-end: 1px solid var(--color-divider);',
      'color: var(--color-slate);',
      'font-size: var(--text-overline);',
      'line-height: var(--text-overline--line-height);',
      'letter-spacing: var(--text-overline--letter-spacing);',
      'font-weight: var(--text-overline--font-weight);',
      'text-transform: uppercase;',
    ]) {
      expect(column, declaration).toContain(declaration);
    }
    expect(
      blockAfter(
        css,
        ".data-table-column:is([data-sort-direction], [aria-sort='ascending'], [aria-sort='descending']) {",
      ),
    ).toContain('color: var(--color-ink);');
    const sort = blockAfter(css, '.data-table-sort svg {');
    expect(sort).toContain('width: 16px;');
    expect(sort).toContain('height: 16px;');
    expect(blockAfter(css, '.data-table-sort {')).toContain('color: var(--color-slate);');
    const hovered = '.data-table-column[data-allows-sorting]:is(:hover, [data-hovered])';
    expect(blockAfter(blockAfter(css, HOVER), `${hovered} {`)).toContain('color: var(--color-ink);');
    // Outside the hover block, :hover appears only where a selected row or list item holds its 8% wash under
    // the pointer, which changes nothing on a device without hover.
    const outside = outsideForcedColors(css).replace(blockAfter(css, HOVER), '');
    expect(outside.match(/[^{}]*:hover[^{}]*\{/g)).toEqual([
      " .data-table-row:is([data-selected], [aria-selected='true']), .data-table-row:is([data-selected], [aria-selected='true']):is(:hover, [data-hovered]) {",
      " .data-table-item:is([data-selected], [aria-selected='true']), .data-table-item:is([data-selected], [aria-selected='true']):is(:hover, [data-hovered]) {",
    ]);
  });

  it('makes a row max(--size-target, --size-field) tall with a divider under each cell and no zebra', () => {
    const css = rules();
    expect(blockAfter(css, '.data-table-row {')).toContain('block-size: var(--data-table-row);');
    // A cell's block padding is what a one-line row leaves either side of its line and its rule, so a row of
    // two lines holds them as far off the rules: 13.5px in a 48px row.
    expect(blockAfter(css, '.data-table {')).toContain(
      '--data-table-pad-block: calc((var(--data-table-row) - var(--text-small) * var(--text-small--line-height) - 1px) / 2);',
    );
    expect(blockAfter(css, '.data-table-cell {')).toContain('padding-block: var(--data-table-pad-block);');
    expect(blockAfter(css, '.data-table-cell {')).toContain(
      'border-block-end: 1px solid var(--color-divider);',
    );
    expect(css).not.toMatch(/nth-child\((?:odd|even|2n)/);
  });

  it('sets cells at the small step at 450, row headers at 500, and ellipsizes on one line', () => {
    const css = rules();
    const cell = blockAfter(css, '.data-table-cell {');
    for (const declaration of [
      'padding-inline: var(--data-table-pad);',
      'font-size: var(--text-small);',
      'line-height: var(--text-small--line-height);',
      'font-weight: var(--text-small--font-weight);',
      'white-space: nowrap;',
      'overflow: hidden;',
      'text-overflow: ellipsis;',
      'vertical-align: middle;',
    ]) {
      expect(cell, declaration).toContain(declaration);
    }
    expect(cell).toContain('--data-table-pad: var(--spacing-inset);');
    expect(blockAfter(css, ".data-table-cell[role='rowheader'] {")).toContain('font-weight: 500;');
    for (const [, weight] of css.matchAll(/font-weight: (\d+);/g)) {
      expect(['400', '450', '500', '700']).toContain(weight);
    }
  });

  it('sets end columns at the line end with tabular, unbroken, isolated left-to-right figures', () => {
    const css = rules();
    expect(
      blockAfter(css, ".data-table-column[data-align='end'], .data-table-cell[data-align='end'] {"),
    ).toContain('text-align: end;');
    const figure = blockAfter(css, '.data-table-figure {');
    for (const declaration of [
      'font-variant-numeric: tabular-nums;',
      'white-space: nowrap;',
      'direction: ltr;',
      'unicode-bidi: isolate;',
    ]) {
      expect(figure, declaration).toContain(declaration);
    }
  });

  it('stretches the row link over its row, the row positioned and no cell positioned', () => {
    const css = rules();
    expect(blockAfter(css, '.data-table-row {')).toContain('position: relative;');
    const after = blockAfter(css, '.data-table-link::after {');
    expect(after).toContain("content: '';");
    expect(after).toContain('position: absolute;');
    expect(after).toContain('inset: 0;');
    const link = blockAfter(css, '.data-table-link {');
    expect(link).toContain('color: inherit;');
    expect(link).toContain('text-decoration-line: none;');
    // A positioned cell would become the link's containing block and clip it to one cell.
    expect(blockAfter(css, '.data-table-cell {')).not.toContain('position');
    expect(blockAfter(css, ".data-table-cell[role='rowheader'] {")).not.toContain('position');
  });

  it('raises every control a cell or a list item can hold above the link through the header token, and an opt-in class', () => {
    const raised = blocks().filter(([selector]) =>
      selector.includes(':is(.data-table-cell, .data-table-item) :is('),
    );
    expect(raised).toHaveLength(1);
    const [selector = '', body = ''] = raised[0] ?? [];
    for (const control of [
      'a',
      'button',
      'input',
      'label',
      'select',
      'summary',
      'textarea',
      "[role='button']",
      "[role='checkbox']",
      "[role='combobox']",
      "[role='menuitem']",
      "[role='radio']",
      "[role='slider']",
      "[role='switch']",
      "[tabindex]:not([tabindex='-1'])",
      '.checkbox-field',
      '.field',
      '.data-table-control',
    ]) {
      expect(selector, control).toMatch(new RegExp(`[(,] ?${control.replace(/[[\]().*'=-]/g, '\\$&')}[,)]`));
    }
    // The row's own link is never raised: positioned, it would hold its ::after to its own box. Nor is a
    // BarChart's bar, placed absolutely in its track, which a relative position collapses when it takes focus,
    // or a linked bar's target, placed absolutely in its band (insights spec correction 96).
    expect(selector).toContain(':not(.data-table-link, .bar-chart-bar, .bar-chart-hit)');
    expect(body).toContain('position: relative;');
    expect(body).toContain('z-index: calc(var(--z-header) - 2);');
  });

  it('washes a body row with a link or selection 5% ink over the fill, only where hover exists, never the totals', () => {
    const css = rules();
    const hover = blockAfter(css, HOVER);
    expect(
      blockAfter(
        hover,
        ".data-table-body > .data-table-row:is([data-link], [data-selection-mode]):is(:hover, [data-hovered]):not([data-disabled], [data-selected], [aria-selected='true']) {",
      ),
    ).toContain('background-color: color-mix(in srgb, var(--color-ink) 5%, var(--data-table-fill));');
    // Slate in a hovered row, an app's own cell text included, is granite on the wash, which keeps it at 4.5:1.
    expect(
      blockAfter(
        hover,
        ".data-table-body > .data-table-row:is([data-link], [data-selection-mode]):is(:hover, [data-hovered]):not([data-disabled], [data-selected], [aria-selected='true']) {",
      ),
    ).toContain('--color-slate: var(--color-granite);');
    // Outside hover, only a selected row's and a selected list item's 8% wash mixes a color, as the fill and as the
    // surface a meter in the row cuts its segments with (spec correction 64).
    expect(
      outsideForcedColors(css)
        .replace(hover, '')
        .match(/color-mix\([^;]*/g),
    ).toEqual(Array(4).fill('color-mix(in srgb, var(--color-ink) 8%, var(--data-table-fill))'));
  });

  it('makes the checkbox column 3.5rem with a part step of padding', () => {
    const css = rules();
    const column = blockAfter(css, '.data-table-column[data-selection], .data-table-cell[data-selection] {');
    expect(column).toContain('--data-table-pad: var(--spacing-part);');
    expect(column).toContain('inline-size: 3.5rem;');
    // A skeleton row draws the same blank first.
    expect(blockAfter(css, '.data-table-skeleton-cell[data-selection] {')).toContain('flex: 0 0 3.5rem;');
    // The column never leaves.
    expect(css).not.toMatch(/\[data-selection\][^{]*\{[^}]*(?:display: none|visibility: hidden)/);
  });

  it('washes a selected row 8% ink over the fill, held under the pointer', () => {
    const css = outsideForcedColors(rules());
    const selected = blockAfter(
      css,
      ".data-table-row:is([data-selected], [aria-selected='true']), .data-table-row:is([data-selected], [aria-selected='true']):is(:hover, [data-hovered]) {",
    );
    expect(selected).toContain(
      'background-color: color-mix(in srgb, var(--color-ink) 8%, var(--data-table-fill));',
    );
    // Slate in the row, an app's own cell text included, is granite on the wash, which keeps it at 4.5:1.
    expect(selected).toContain('--color-slate: var(--color-granite);');
  });

  it('sticks the bar to the bottom above the tab bar reserve, one layer under the header token', () => {
    const bar = blockAfter(outsideForcedColors(rules()), '.data-table-bar {');
    for (const declaration of [
      'position: sticky;',
      'inset-block-end: calc(var(--app-shell-inset-block-end, 0px) + var(--spacing-inset));',
      'z-index: calc(var(--z-header) - 1);',
      'margin-block-start: var(--spacing-inset);',
    ]) {
      expect(bar, declaration).toContain(declaration);
    }
  });

  it('draws the bar on the float surface with the frame edge, the surface radius and the float shadow', () => {
    const bar = blockAfter(outsideForcedColors(rules()), '.data-table-bar {');
    for (const declaration of [
      '--holder-border: 1px;',
      'border: var(--holder-border) solid var(--color-frame);',
      '--holder-radius: var(--radius-surface);',
      'border-radius: var(--holder-radius);',
      'background-color: var(--color-float);',
      'box-shadow: var(--shadow-float);',
      'color: var(--color-ink);',
      'display: flex;',
      'flex-wrap: wrap;',
      'gap: var(--spacing-part);',
    ]) {
      expect(bar, declaration).toContain(declaration);
    }
  });

  it('sets the count at the small step at 500, tabular, with the actions pushed to the end', () => {
    const css = rules();
    const count = blockAfter(css, '.data-table-bar-count {');
    expect(count).not.toContain('margin-inline-end: auto;');
    for (const declaration of [
      'font-size: var(--text-small);',
      'font-weight: 500;',
      'font-variant-numeric: tabular-nums;',
    ]) {
      expect(count, declaration).toContain(declaration);
    }
    const actions = blockAfter(css, '.data-table-bar-actions {');
    expect(actions).toContain('display: flex;');
    expect(actions).toContain('gap: var(--spacing-part);');
    expect(actions).toContain('margin-inline-start: auto;');
    expect(blockAfter(css, '.data-table-bar-select-all {')).toContain('min-inline-size: 0;');
    expect(blockAfter(css, '.data-table-bar-icon svg {')).toContain('width: 16px;');
  });

  it('makes the bar its own size container: no promoted button under 40rem, select-all on its own line under 24rem', () => {
    const css = rules();
    expect(blockAfter(outsideForcedColors(css), '.data-table-bar {')).toContain(
      'container: data-table-bar / inline-size;',
    );
    const narrow = blockAfter(css, '@container data-table-bar (width < 40rem)');
    expect(blockAfter(narrow, '.data-table-bar-actions > [data-action-id] {')).toContain('display: none;');
    // A More holding only promoted actions is drawn only while their buttons are not.
    const wide = blockAfter(css, '@container data-table-bar (width >= 40rem)');
    expect(blockAfter(wide, '.data-table-bar-more[data-promoted-only] {')).toContain('display: none;');
    const narrowest = blockAfter(css, '@container data-table-bar (width < 24rem)');
    const place = blockAfter(narrowest, '.data-table-bar-select-all {');
    expect(place).toContain('order: 1;');
    expect(place).toContain('flex-basis: 100%;');
  });

  it('declares --save-bar-offset from the tokens while the bar is on the page, as SaveBar does', () => {
    const css = rules();
    const offset = blockAfter(css, ':root:has(.data-table-bar), .app-shell:has(.data-table-bar) {');
    expect(offset).toContain(
      '--save-bar-offset: calc(var(--size-control) + 2 * var(--spacing-part) + 2px + var(--spacing-inset));',
    );
    // The same one-line height as the save bar's, so either bar lifts the tray and the toasts alike.
    expect(closeUp(stripComments(read('src/components/save-bar.css')))).toContain(
      '--save-bar-offset: calc(var(--size-control) + 2 * var(--spacing-part) + 2px + var(--spacing-inset));',
    );
  });

  it('rings a focused row, cell or header inside, in the focus ring token', () => {
    const ring = blockAfter(
      rules(),
      '.data-table-row:is(:focus-visible, [data-focus-visible]), .data-table-cell:is(:focus-visible, [data-focus-visible]), .data-table-column:is(:focus-visible, [data-focus-visible]) {',
    );
    expect(ring).toContain('outline: var(--focus-ring-width) solid var(--focus-ring-color);');
    expect(ring).toContain('outline-offset: calc(-1 * var(--focus-ring-width));');
    expect(blockAfter(rules(), '.data-table-link:is(:focus-visible, [data-focus-visible]) {')).toContain(
      'outline-offset: calc(-1 * var(--focus-ring-width));',
    );
  });

  it('draws the current bar as a 3px ink inline-start border on the first shown cell, its padding 3px less, and its row header at 700', () => {
    const css = outsideForcedColors(rules());
    const BAR = [
      'border-inline-start: 3px solid var(--color-ink);',
      'padding-inline-start: calc(var(--data-table-pad) - 3px);',
    ];
    // At full width the first cell; :where() keeps the rule under a hidden cell's, so a cell that has left never
    // draws it, and under each width the first cell that has not left draws it instead.
    for (const [scope, selector] of [
      [css, '.data-table-row[data-current] > :where(:first-child) {'],
      [
        blockAfter(css, '@container data-table (width < 48rem)'),
        ".data-table-row[data-current] > :where(:not([data-hide-below='md']):not(:not([data-hide-below='md']) ~ *)) {",
      ],
    ]) {
      const bar = blockAfter(scope, selector);
      for (const declaration of BAR) expect(bar, `${selector} ${declaration}`).toContain(declaration);
    }
    expect(css).not.toContain('.data-table-row[data-current] > :first-child');
    expect(blockAfter(css, ".data-table-row[data-current] > .data-table-cell[role='rowheader'] {")).toContain(
      'font-weight: 700;',
    );
    // A border, not a ::before or a box-shadow (spec correction 13).
    expect(css).not.toContain('[data-current] > :first-child::before');
    // The one shadow is the bar's float surface.
    expect(css.match(/box-shadow: [^;]*/g)).toEqual(['box-shadow: var(--shadow-float)']);
  });

  it('draws a disabled row taupe, not-allowed', () => {
    const disabled = blockAfter(
      outsideForcedColors(rules()),
      ".data-table-row:is([data-disabled], [aria-disabled='true']) {",
    );
    expect(disabled).toContain('color: var(--color-taupe);');
    expect(disabled).toContain('cursor: not-allowed;');
    // Taupe is for that and nothing else.
    const taupe = blocks().filter(([, body]) => body.includes('--color-taupe'));
    expect(taupe.map(([selector]) => selector)).toEqual([
      ".data-table-row:is([data-disabled], [aria-disabled='true'])",
      ".data-table-item:is([data-disabled], [aria-disabled='true'])",
    ]);
  });

  it('rules the totals with the frame color at 700, with no divider under the last body row', () => {
    const css = rules();
    const totals = blockAfter(css, '.data-table-footer .data-table-cell {');
    expect(totals).toContain('border-block-start: 1px solid var(--color-frame);');
    expect(totals).toContain('border-block-end: 0;');
    expect(totals).toContain('font-weight: 700;');
    expect(
      blockAfter(
        css,
        '.data-table-table:has(> .data-table-footer) .data-table-body > .data-table-row:last-child > .data-table-cell {',
      ),
    ).toContain('border-block-end: 0;');
    // Not sticky: the totals end the list.
    expect(totals).not.toContain('sticky');
  });

  it('lays out skeleton rows as flex rows a row tall', () => {
    const css = rules();
    expect(blockAfter(css, '.data-table-body[data-empty] > tr > td {')).toContain('padding: 0;');
    const row = blockAfter(css, '.data-table-skeleton-row {');
    for (const declaration of [
      'display: flex;',
      'align-items: center;',
      'block-size: var(--data-table-row);',
      'border-block-end: 1px solid var(--color-divider);',
    ]) {
      expect(row, declaration).toContain(declaration);
    }
    const cell = blockAfter(css, '.data-table-skeleton-cell {');
    expect(cell).toContain('flex: 1 1 0;');
    expect(cell).toContain('padding-inline: var(--spacing-inset);');
    expect(blockAfter(css, ".data-table-skeleton-cell[data-align='end'] {")).toContain('text-align: end;');
  });

  it('hides the status and the loading words from sight, never from a screen reader', () => {
    const hidden = blockAfter(rules(), '.data-table-status, .data-table-loading {');
    for (const declaration of [
      'position: absolute;',
      'width: 1px;',
      'height: 1px;',
      'clip-path: inset(50%);',
    ]) {
      expect(hidden, declaration).toContain(declaration);
    }
    expect(rules()).not.toMatch(
      /\.data-table-(?:status|loading)[^{]*\{[^}]*(?:display: none|visibility: hidden)/,
    );
  });

  it('hides md columns under 48rem of the table box, by container query only, and has no sm width', () => {
    const css = rules();
    for (const [query, size] of [['@container data-table (width < 48rem)', 'md']]) {
      const block = blockAfter(css, query);
      // A header or body cell stays in its row, zero wide and hidden, so every row and React Aria's spanning
      // empty cell count the same columns and the table stays the full width of its box (spec correction 26).
      const cell = blockAfter(block, `.data-table :is(th, td)[data-hide-below='${size}'] {`);
      for (const declaration of [
        'inline-size: 0;',
        'padding-inline: 0;',
        'border-inline-width: 0;',
        'visibility: hidden;',
      ]) {
        expect(cell, `${size}: ${declaration}`).toContain(declaration);
      }
      expect(cell).not.toContain('display');
      // A skeleton row is a flex row inside that one cell, so its cell for the column is not drawn at all.
      expect(
        blockAfter(block, `.data-table .data-table-skeleton-cell[data-hide-below='${size}'] {`),
      ).toContain('display: none;');
    }
    // The header cell takes the column's width from its definition, so a fixed table sizes the column by it.
    expect(blockAfter(css, '.data-table-column {')).toContain(
      'inline-size: var(--data-table-column-width, auto);',
    );
    // Never by the viewport.
    expect(css).not.toMatch(/@media \((?:min-|max-)?width/);
    // The cells that leave, and the current bar that moves past them; under 40rem the list is drawn instead, so
    // nothing leaves at sm (spec correction 70).
    expect(css.match(/\[data-hide-below/g)).toHaveLength(4);
    expect(css).not.toContain("[data-hide-below='sm']");
  });

  it('never uses signal orange, clay or success, and error only for the error line', () => {
    const css = rules();
    for (const token of ['--color-signal', '--color-clay', '--color-success', '--color-gain']) {
      expect(css, token).not.toContain(token);
    }
    // An error is exactly that: the line a failed next page writes under the rows, and nothing else.
    expect(css.match(/var\(--color-error\)/g)).toHaveLength(1);
    expect(blockAfter(css, '.data-table-error:not(:empty) {')).toContain('color: var(--color-error);');
  });

  it('keeps a focused row or cell clear of the sticky header and, while it shows, the bar (WCAG 2.4.11)', () => {
    const css = rules();
    const root = blockAfter(css, '.data-table {');
    // Nothing pads the root's scroll (spec correction 121), so a row's margin holds the page's whole offset, as the
    // grid's own margin does, which the key handler reads.
    expect(root).toContain(
      '--data-table-scroll-start: calc(var(--page-sticky-top, 0px) + var(--size-target));',
    );
    expect(css).not.toContain('app-shell-header-block-size');
    expect(blockAfter(css, '.data-table-table {')).toContain(
      'scroll-margin-block-start: var(--page-sticky-top, 0px);',
    );
    expect(root).toContain('--data-table-scroll-end: 0px;');
    expect(blockAfter(css, '.data-table:has(> .data-table-bar) {')).toContain(
      '--data-table-scroll-end: calc(var(--app-shell-inset-block-end, 0px) + var(--spacing-inset) + var(--size-control) + 2 * var(--spacing-part) + 2px);',
    );
    const margin = 'scroll-margin-block: var(--data-table-scroll-start) var(--data-table-scroll-end);';
    expect(blockAfter(css, '.data-table-row {')).toContain(margin);
    expect(blockAfter(css, '.data-table-body > .data-table-row > .data-table-cell {')).toContain(margin);
  });

  it('wraps a wrapping column to two lines and clamps it there', () => {
    const css = rules();
    const cell = blockAfter(css, ".data-table-cell[data-overflow='wrap'] {");
    expect(cell).toContain('white-space: normal;');
    const clamp = blockAfter(css, '.data-table-wrap {');
    for (const declaration of [
      'display: -webkit-box;',
      'overflow: hidden;',
      '-webkit-box-orient: vertical;',
      '-webkit-line-clamp: 2;',
    ]) {
      expect(clamp).toContain(declaration);
    }
  });

  it('hides a hidden header label from sight, never from a screen reader', () => {
    const label = blockAfter(rules(), '.data-table-column[data-header-hidden] .data-table-column-label {');
    expect(label).toContain('clip-path: inset(50%);');
    expect(label).toContain('position: absolute;');
    expect(label).not.toMatch(/display: none|visibility: hidden/);
  });

  it('draws the reloading cue as a 2px ink line at the foot of the header cells that pulses, still under reduced motion and CanvasText in forced colors', () => {
    const css = rules();
    const cue = '.data-table-grid[data-reloading] .data-table-column::after {';
    const line = blockAfter(css, cue);
    for (const declaration of [
      'position: absolute;',
      'inset-inline: 0;',
      'inset-block-end: 0;',
      'block-size: 2px;',
      'background-color: var(--color-ink);',
      'animation: data-table-reloading 1.6s ease-in-out infinite;',
    ]) {
      expect(line).toContain(declaration);
    }
    expect(blockAfter(blockAfter(css, '@media (prefers-reduced-motion: reduce)'), cue)).toContain(
      'animation: none;',
    );
    expect(blockAfter(blockAfter(css, FORCED), cue)).toContain('background-color: CanvasText;');
    // The header cells are sticky, so positioned: each holds its own part of the line.
    expect(blockAfter(css, '.data-table-column {')).toContain('position: sticky;');
  });

  it('writes the error line at the small step, a part step under the rows and inset as the cells, only while it holds one', () => {
    const line = blockAfter(rules(), '.data-table-error:not(:empty) {');
    for (const declaration of [
      'margin-block-start: var(--spacing-part);',
      'padding-inline: var(--spacing-inset);',
      'font-size: var(--text-small);',
    ]) {
      expect(line).toContain(declaration);
    }
  });

  it('shows the list and hides the grid under 40rem of the table box, or 32rem with listBelow, by container query only', () => {
    const css = rules();
    expect(blockAfter(css, '.data-table-list {')).toContain('display: none;');
    // The one 40rem block is the switch, and it leaves a table with listBelow '32rem' alone.
    const queries = [...css.matchAll(/@container data-table \(width < 40rem\)/g)].map((match) => match.index);
    expect(queries).toHaveLength(1);
    const swap = blockAfter(css, '@container data-table (width < 40rem)');
    expect(blockAfter(swap, ".data-table:not([data-list-below='32rem']) > .data-table-grid {")).toContain(
      'display: none;',
    );
    expect(blockAfter(swap, ".data-table:not([data-list-below='32rem']) > .data-table-list {")).toContain(
      'display: block;',
    );
    // The 32rem block is the same switch, for listBelow '32rem' only (ruling 24).
    const below = [...css.matchAll(/@container data-table \(width < 32rem\)/g)];
    expect(below).toHaveLength(1);
    const narrow = blockAfter(css, '@container data-table (width < 32rem)');
    expect(blockAfter(narrow, ".data-table[data-list-below='32rem'] > .data-table-grid {")).toContain(
      'display: none;',
    );
    expect(blockAfter(narrow, ".data-table[data-list-below='32rem'] > .data-table-list {")).toContain(
      'display: block;',
    );
    // Never by the viewport, so a table beside an open panel is a list too (ruling 8).
    expect(css).not.toMatch(/@media \((?:min-|max-)?width/);
  });

  it('sticks the day heading at --page-sticky-top on the fill, at the overline step in slate', () => {
    const heading = blockAfter(rules(), '.data-table-section-header {');
    for (const declaration of [
      'position: sticky;',
      'inset-block-start: calc(var(--page-sticky-top, 0px) + var(--data-table-list-offset, 0px));',
      'z-index: calc(var(--z-header) - 1);',
      'padding: var(--spacing-peer) var(--spacing-inset) var(--spacing-part);',
      'background-color: var(--data-table-fill);',
      'color: var(--color-slate);',
      'font-size: var(--text-overline);',
      'font-weight: var(--text-overline--font-weight);',
      'text-transform: uppercase;',
    ]) {
      expect(heading, declaration).toContain(declaration);
    }
  });

  it('makes an item two lines tall at least, ruled between items and not at a group end', () => {
    const css = rules();
    const item = blockAfter(css, '.data-table-item {');
    for (const declaration of [
      'position: relative;',
      'display: flex;',
      'gap: 0.75rem;',
      'min-block-size: max(var(--size-target), 3.5rem);',
      'padding-block: var(--data-table-pad-block);',
      'padding-inline: var(--data-table-pad);',
      'border-block-end: 1px solid var(--color-divider);',
      'scroll-margin-block: var(--data-table-scroll-start) var(--data-table-scroll-end);',
    ]) {
      expect(item, declaration).toContain(declaration);
    }
    expect(blockAfter(css, '.data-table-item:last-child {')).toContain('border-block-end: 0;');
    const skeleton = blockAfter(css, '.data-table-skeleton-item {');
    expect(skeleton).toContain('min-block-size: max(var(--size-target), 3.5rem);');
    expect(skeleton).toContain('padding-block: var(--data-table-pad-block);');
    // Its two lines a quarter rem apart, as a two-line cell's.
    expect(blockAfter(css, '.data-table-item-text {')).toContain('gap: 0.25rem;');
    expect(blockAfter(css, '.data-table-item-end {')).toContain('gap: 0.25rem;');
    expect(blockAfter(css, '.data-table-skeleton-text {')).toContain('gap: 0.25rem;');
  });

  it('sets the title at 500 and the meta slate, ellipsized, and turns the meta ink on a hovered or selected item', () => {
    const css = rules();
    expect(blockAfter(css, '.data-table-item-title {')).toContain('font-weight: 500;');
    // A rule of its own, not the hovered item's that turns it ink.
    expect(blockAfter(css, '} .data-table-item-meta {')).toContain('color: var(--color-slate);');
    const lines = blockAfter(css, '.data-table-item-title, .data-table-item-meta {');
    for (const declaration of ['white-space: nowrap;', 'overflow: hidden;', 'text-overflow: ellipsis;']) {
      expect(lines, declaration).toContain(declaration);
    }
    // A line with a wrapping column clamps at two, as the table's wrapping cell.
    const wrap = blockAfter(
      css,
      ":is(.data-table-item-title, .data-table-item-meta)[data-overflow='wrap'] {",
    );
    expect(wrap).toContain('-webkit-line-clamp: 2;');
    expect(wrap).toContain('white-space: normal;');
    expect(
      blockAfter(css, ".data-table-item:is([data-selected], [aria-selected='true']) .data-table-item-meta {"),
    ).toContain('color: var(--color-ink);');
    const hovered = blockAfter(
      blockAfter(css, HOVER),
      ".data-table-item:is([data-link], [data-selection-mode]):is(:hover, [data-hovered]):not([data-disabled], [data-selected], [aria-selected='true']) .data-table-item-meta {",
    );
    expect(hovered).toContain('color: var(--color-ink);');
  });

  it('marks a selected, current, focused and disabled item as the rows are', () => {
    const css = outsideForcedColors(rules());
    const SELECTED = ".data-table-item:is([data-selected], [aria-selected='true'])";
    expect(blockAfter(css, `${SELECTED}, ${SELECTED}:is(:hover, [data-hovered]) {`)).toContain(
      'background-color: color-mix(in srgb, var(--color-ink) 8%, var(--data-table-fill));',
    );
    expect(blockAfter(css, `${SELECTED}, ${SELECTED}:is(:hover, [data-hovered]) {`)).toContain(
      '--color-slate: var(--color-granite);',
    );
    // Out of Select mode a selected item draws its mark, an ink box with a canvas check: never the wash alone. The
    // slot is every item's while anything is selected, so it draws nothing of its own (spec correction 61).
    const mark = blockAfter(css, '.data-table-item-mark {');
    expect(mark).not.toContain('display');
    expect(mark).not.toContain('background-color');
    expect(mark).toContain('inline-size: 20px;');
    expect(blockAfter(css, `${SELECTED} .data-table-item-mark {`)).toContain(
      'background-color: var(--color-ink);',
    );
    // The check is the checkbox's own mask, so the HTML holds no icon.
    const check = blockAfter(css, `${SELECTED} .data-table-item-mark::after {`);
    expect(check).toContain('background-color: var(--color-canvas);');
    expect(check).toContain('mask-image: url("data:image/svg+xml,');
    expect(check).toContain('mask-size: 14px;');
    expect(css).not.toContain('.data-table-item-mark svg');
    const current = blockAfter(css, '.data-table-item[data-current] {');
    expect(current).toContain('padding-inline-start: calc(var(--data-table-pad) - 3px);');
    expect(current).toContain('border-inline-start: 3px solid var(--color-ink);');
    expect(blockAfter(css, '.data-table-item[data-current] .data-table-item-title {')).toContain(
      'font-weight: 700;',
    );
    const focused = blockAfter(css, '.data-table-item:is(:focus-visible, [data-focus-visible]) {');
    expect(focused).toContain('outline: var(--focus-ring-width) solid var(--focus-ring-color);');
    expect(focused).toContain('outline-offset: calc(-1 * var(--focus-ring-width));');
    const disabled = blockAfter(css, ".data-table-item:is([data-disabled], [aria-disabled='true']) {");
    expect(disabled).toContain('color: var(--color-taupe);');
    expect(disabled).toContain('cursor: not-allowed;');
  });

  it('keeps the Select button at the head row end, the row a target tall and ruled', () => {
    const css = rules();
    const head = blockAfter(css, '.data-table-list-head {');
    expect(head).toContain('min-block-size: var(--data-table-list-head);');
    // The head's height: its tallest control and its rule, 44px controls on a coarse pointer.
    expect(blockAfter(css, '.data-table-list {')).toContain(
      '--data-table-list-head: calc(max(var(--size-target), var(--size-control)) + 1px);',
    );
    expect(blockAfter(blockAfter(css, '@media (pointer: coarse)'), '.data-table-list {')).toContain(
      '--data-table-list-head: calc(max(var(--size-target), var(--size-control), 2.75rem) + 1px);',
    );
    expect(head).toContain('border-block-end: 1px solid var(--color-divider);');
    expect(blockAfter(css, '.data-table-list-mode {')).toContain('margin-inline-start: auto;');
  });

  it('rules the totals line with the frame color at 700', () => {
    const total = blockAfter(rules(), '.data-table-list-total {');
    expect(total).toContain('border-block-start: 1px solid var(--color-frame);');
    expect(total).toContain('font-weight: 700;');
    expect(total).toContain('justify-content: space-between;');
  });

  it('sticks the head in Select mode at the page offset on the fill, the headings under it, its controls 44px on touch', () => {
    const css = rules();
    const head = blockAfter(css, '.data-table-list-head[data-selecting] {');
    for (const declaration of [
      'position: sticky;',
      'inset-block-start: var(--page-sticky-top, 0px);',
      'z-index: calc(var(--z-header) - 1);',
      'background-color: var(--data-table-fill);',
    ]) {
      expect(head, declaration).toContain(declaration);
    }
    expect(blockAfter(css, '.data-table-list[data-selecting] {')).toContain(
      '--data-table-list-offset: var(--data-table-list-head);',
    );
    const coarse = [...css.matchAll(/@media \(pointer: coarse\)/g)].map((match) =>
      blockAfter(css.slice(match.index), '@media (pointer: coarse)'),
    );
    expect(
      coarse.some((block) =>
        block.includes(
          '.data-table-list-mode, .data-table-list-all .checkbox { min-block-size: max(var(--size-target), 2.75rem); }',
        ),
      ),
    ).toBe(true);
    // An item keeps clear of the page offset and the head, and of its day heading where there are groups.
    expect(blockAfter(css, '.data-table-list {')).toContain(
      '--data-table-scroll-start: calc(var(--page-sticky-top, 0px) + var(--data-table-list-offset, 0px));',
    );
    const grouped = blockAfter(css, '.data-table-list:has(.data-table-section) {');
    expect(grouped).toContain('calc(var(--page-sticky-top, 0px) + var(--data-table-list-offset, 0px) +');
    expect(grouped).toContain(
      'var(--spacing-peer) + var(--spacing-part) + var(--text-overline) * var(--text-overline--line-height)',
    );
    expect(blockAfter(css, '.data-table-grid-list {')).toContain(
      'scroll-margin-block-start: var(--page-sticky-top, 0px);',
    );
  });

  it('lets a press on an item in Select mode reach the item, its link taking no pointer and stretched over nothing', () => {
    const css = rules();
    expect(blockAfter(css, '.data-table-list[data-selecting] .data-table-link {')).toContain(
      'pointer-events: none;',
    );
    expect(blockAfter(css, '.data-table-list[data-selecting] .data-table-link::after {')).toContain(
      'content: none;',
    );
  });

  it('rings an empty grid inset when it takes focus, in both faces, and Highlight in forced colors', () => {
    const css = rules();
    const EMPTY =
      '.data-table-table:has(> .data-table-body[data-empty]):is(:focus-visible, [data-focus-visible]), .data-table-grid-list[data-empty]:is(:focus-visible, [data-focus-visible]) {';
    const ring = blockAfter(outsideForcedColors(css), EMPTY);
    expect(ring).toContain('outline: var(--focus-ring-width) solid var(--focus-ring-color);');
    expect(ring).toContain('outline-offset: calc(-1 * var(--focus-ring-width));');
    expect(blockAfter(blockAfter(css, FORCED), EMPTY)).toContain('outline-color: Highlight;');
    // Both grids resolve the page offset as their own scroll margin, which the key handler reads in pixels.
    for (const grid of ['.data-table-table {', '.data-table-grid-list {']) {
      expect(blockAfter(css, grid), grid).toContain(
        'scroll-margin-block-start: var(--page-sticky-top, 0px);',
      );
    }
  });

  it('never clips a cell that holds only a control or draws an ellipsis beside it', () => {
    const css = rules();
    const start = css.indexOf('.data-table-cell:has(> :is(button, input, select, textarea,');
    expect(start).toBeGreaterThan(-1);
    const selector = css.slice(start, css.indexOf('{', start));
    expect(selector).toContain('.data-table-control):only-child)');
    const block = blockAfter(css.slice(start), '{');
    expect(block).toContain('overflow: visible;');
    expect(block).toContain('text-overflow: clip;');
    // A control is a target tall, and the row's height centers it: no padding to make its row taller.
    expect(block).toContain('padding-block: 0;');
    expect(blockAfter(css, '} .data-table-cell[data-selection] {')).toContain('padding-block: 0;');
  });

  it('holds the two lines of a wrapping cell as far off the rules as every cell, every cell of its row centered', () => {
    const css = rules();
    const wrap = blockAfter(css, ".data-table-cell[data-overflow='wrap'] {");
    expect(wrap).toContain('white-space: normal;');
    expect(wrap).not.toContain('padding-block');
    expect(blockAfter(css, '.data-table-cell {')).toContain('vertical-align: middle;');
  });

  it('sets a second line in a cell slate at the cell weight, a quarter rem under the first', () => {
    const meta = blockAfter(rules(), '.data-table-cell-meta {');
    for (const declaration of [
      'display: block;',
      'margin-block-start: 0.25rem;',
      'overflow: hidden;',
      'color: var(--color-slate);',
      'font-weight: var(--text-small--font-weight);',
      'text-overflow: ellipsis;',
    ]) {
      expect(meta, declaration).toContain(declaration);
    }
    // The slate token, never a literal, so the granite a hovered or selected row or item sets reaches it.
    expect(meta).not.toMatch(/color: (?!var\(--color-slate\))/);
    const css = rules();
    for (const host of [
      ".data-table-row:is([data-selected], [aria-selected='true']), .data-table-row:is([data-selected], [aria-selected='true']):is(:hover, [data-hovered]) {",
      ".data-table-item:is([data-selected], [aria-selected='true']), .data-table-item:is([data-selected], [aria-selected='true']):is(:hover, [data-hovered]) {",
    ]) {
      expect(blockAfter(css, host), host).toContain('--color-slate: var(--color-granite);');
    }
    // A disabled row's second line is taupe with the rest of its text.
    expect(
      blockAfter(css, ".data-table-row:is([data-disabled], [aria-disabled='true']) .data-table-cell-meta {"),
    ).toContain('color: inherit;');
  });

  it('is a size container with an intrinsic inline size of 0 that takes the room its siblings leave', () => {
    const root = blockAfter(rules(), '.data-table {');
    // The library's rule (spec corrections 30, 34 and 63): a stand-in width is also the table's min-content
    // width, which a flex: 1 item or a 1fr track keeps as its narrowest, so two tables scrolled a 320px page.
    for (const declaration of [
      'container: data-table / inline-size;',
      'contain-intrinsic-inline-size: 0;',
      'flex: 1 1 0;',
      'min-inline-size: 0;',
      'max-block-size: max-content;',
    ]) {
      expect(root, declaration).toContain(declaration);
    }
  });

  it("gives a meter in a row the row's own fill for its cuts, plain, hovered and selected (spec correction 64)", () => {
    // Meter cuts its segments apart and rings its pace marker in --meter-surface, Lifted unless set, which drew a
    // pale block on a canvas row and on every hovered or selected one. Each fill that paints a row sets it too.
    expect(blockAfter(rules(), '.data-table {')).toContain('--meter-surface: var(--data-table-fill);');
    const painted = blocks().filter(
      ([selector, body]) =>
        /\.data-table-(?:row|item)/.test(selector) &&
        /background-color: color-mix\(in srgb, var\(--color-ink\) \d+%, var\(--data-table-fill\)\);/.test(
          body,
        ),
    );
    // The hovered row and item, and the selected row and item.
    expect(painted).toHaveLength(4);
    for (const [selector, body] of painted) {
      const wash = /background-color: (color-mix\([^;]+\));/.exec(body)?.[1];
      expect(body, selector).toContain(`--meter-surface: ${wash};`);
    }
  });

  it('draws the list reloading cue once, at the first day heading or along an ungrouped list top, out of the flow', () => {
    const css = rules();
    const FIRST =
      '.data-table-list[data-reloading] .data-table-grid-list > .data-table-section:not(.data-table-section ~ .data-table-section) .data-table-section-header::after';
    const TOP =
      '.data-table-list[data-reloading] .data-table-grid-list:not(:has(> .data-table-section))::before';
    const line = blockAfter(css, `${FIRST}, ${TOP} {`);
    expect(line).toContain('block-size: 2px;');
    expect(line).toContain('background-color: var(--color-ink);');
    expect(blockAfter(css, `${FIRST} {`)).toContain('position: absolute;');
    // Its own rule, after the shared one, not the shared rule whose selector list ends in it.
    const top = blockAfter(css, `} ${TOP} {`);
    expect(top).toContain('position: sticky;');
    expect(top).toContain('margin-block-end: -2px;');
    // No rule draws the line under every heading.
    expect(css).not.toContain('.data-table-list[data-reloading] .data-table-section-header::after {');
  });

  it('names each total by its column in slate, at the cell weight', () => {
    const css = rules();
    expect(blockAfter(css, '.data-table-list-total-figure {')).toContain('gap: var(--spacing-part);');
    const name = blockAfter(css, '.data-table-list-total-name {');
    expect(name).toContain('color: var(--color-slate);');
    expect(name).toContain('font-weight: var(--text-small--font-weight);');
  });

  it('draws the list rules CanvasText and a selected item Highlight in forced colors', () => {
    const forced = blockAfter(rules(), FORCED);
    expect(
      blockAfter(
        forced,
        '.data-table-list-head, .data-table-item, .data-table-list-total, .data-table-skeleton-item {',
      ),
    ).toContain('border-color: CanvasText;');
    const SELECTED = ".data-table-item:is([data-selected], [aria-selected='true'])";
    const selected = blockAfter(forced, `${SELECTED}, ${SELECTED}:is(:hover, [data-hovered]) {`);
    expect(selected).toContain('forced-color-adjust: none;');
    expect(selected).toContain('background-color: Highlight;');
    expect(selected).toContain('color: HighlightText;');
    expect(blockAfter(forced, `${SELECTED} .data-table-item-mark {`)).toContain(
      'background-color: HighlightText;',
    );
    expect(blockAfter(forced, `${SELECTED} .checkbox {`)).toContain('--checkbox-mark: Highlight;');
    expect(blockAfter(forced, `${SELECTED}:is(:focus-visible, [data-focus-visible]) {`)).toContain(
      'outline-color: HighlightText;',
    );
    expect(blockAfter(forced, '.data-table-item:is(:focus-visible, [data-focus-visible]) {')).toContain(
      'outline-color: Highlight;',
    );
  });

  it('draws rules CanvasText, the current bar CanvasText, the ring Highlight and a disabled row GrayText in forced colors', () => {
    const forced = blockAfter(rules(), FORCED);
    expect(blockAfter(forced, '.data-table-column, .data-table-cell, .data-table-skeleton-row {')).toContain(
      'border-color: CanvasText;',
    );
    expect(blockAfter(forced, '.data-table-row[data-current] > * {')).toContain(
      'border-inline-start-color: CanvasText;',
    );
    expect(
      blockAfter(
        forced,
        '.data-table-row:is(:focus-visible, [data-focus-visible]), .data-table-cell:is(:focus-visible, [data-focus-visible]), .data-table-column:is(:focus-visible, [data-focus-visible]) {',
      ),
    ).toContain('outline-color: Highlight;');
    expect(blockAfter(forced, ".data-table-row:is([data-disabled], [aria-disabled='true']) {")).toContain(
      'color: GrayText;',
    );
  });

  it('draws a selected row Highlight with HighlightText out of the forced repaint, every part in the pair, and the bar edge CanvasText in forced colors', () => {
    const forced = blockAfter(rules(), FORCED);
    const SELECTED_ROW = ".data-table-row:is([data-selected], [aria-selected='true'])";
    // Hovered too, so the 8% wash held under the pointer never shows through.
    const selected = blockAfter(forced, `${SELECTED_ROW}, ${SELECTED_ROW}:is(:hover, [data-hovered]) {`);
    expect(selected).toContain('forced-color-adjust: none;');
    expect(selected).toContain('background-color: Highlight;');
    expect(selected).toContain('color: HighlightText;');
    // Out of the repaint, every part takes the pair by name: rules, rings, no fills, the text.
    const parts = blockAfter(forced, `${SELECTED_ROW} :where(:not(.checkbox-box)) {`);
    for (const declaration of [
      'border-color: HighlightText;',
      'outline-color: HighlightText;',
      'background-color: transparent;',
      'color: inherit;',
    ]) {
      expect(parts).toContain(declaration);
    }
    // The checked box is drawn inverted, so it shows on the Highlight fill.
    const box = blockAfter(forced, `${SELECTED_ROW} .checkbox {`);
    expect(box).toContain('--checkbox-fill: HighlightText;');
    expect(box).toContain('--checkbox-edge: HighlightText;');
    expect(box).toContain('--checkbox-mark: Highlight;');
    // A focused selected row or cell is ringed HighlightText: a Highlight ring on Highlight would not show.
    expect(
      blockAfter(
        forced,
        `${SELECTED_ROW}:is(:focus-visible, [data-focus-visible]), ${SELECTED_ROW} > .data-table-cell:is(:focus-visible, [data-focus-visible]) {`,
      ),
    ).toContain('outline-color: HighlightText;');
    expect(blockAfter(forced, '.data-table-bar {')).toContain('border-color: CanvasText;');
  });
});

describe('src/components/side-panel.css', () => {
  // The rules without their comments, with their whitespace closed up. `.side-panel {` first matches the panel's
  // base rule, before the wide block repeats it.
  const rules = () => closeUp(stripComments(read('src/components/side-panel.css')));
  const WIDE = '@media (width >= 1024px)';
  const FORCED = '@media (forced-colors: active)';

  it('lays the layout out as one column, and the content and a 24rem panel from 1024px while it holds a panel', () => {
    const css = rules();
    const layout = blockAfter(css, '.side-panel-layout {');
    for (const declaration of [
      'display: grid;',
      'grid-template-columns: minmax(0, 1fr);',
      'gap: var(--spacing-peer);',
      'align-items: start;',
    ]) {
      expect(layout, declaration).toContain(declaration);
    }
    const content = blockAfter(css, '.side-panel-layout-content {');
    expect(content).toContain('min-inline-size: 0;');
    expect(content).toContain('outline: none;');
    // The panel pushes the content: a grid column, never a layer over it.
    expect(blockAfter(blockAfter(css, WIDE), '.side-panel-layout:has(> .side-panel) {')).toContain(
      'grid-template-columns: minmax(0, 1fr) 24rem;',
    );
    expect(css).not.toMatch(/(?<![\w-])z-index\s*:/);
  });

  it('draws the panel on the rail surface: float, hairline, stadium corner, the lift shadow, its parts padded a peer step', () => {
    const css = rules();
    const panel = blockAfter(css, '.side-panel {');
    // The parts take the peer padding, so the body that scrolls has room for a field's ring inside its clip.
    expect(panel).not.toMatch(/(?<![\w-])padding:/);
    expect(blockAfter(css, '.side-panel-header {')).toContain(
      'padding: var(--spacing-peer) var(--spacing-peer) 0;',
    );
    expect(blockAfter(css, '.side-panel-body {')).toContain(
      'padding: 0 var(--spacing-peer) var(--spacing-inset);',
    );
    // The inset at its top scrolls with it, so a sticky part in it sticks at the body's own top.
    const spacer = blockAfter(css, '.side-panel-body::before {');
    expect(spacer).toContain('display: block;');
    expect(spacer).toContain('block-size: var(--spacing-inset);');
    expect(blockAfter(css, '.side-panel-body:last-child {')).toContain(
      'padding-block-end: var(--holder-corner-inset);',
    );
    for (const declaration of [
      'box-sizing: border-box;',
      'flex-direction: column;',
      'inline-size: 24rem;',
      'margin-block-start: var(--spacing-inset);',
      'border: 1px solid var(--color-hairline);',
      'border-radius: var(--radius-stadium);',
      'background-color: var(--color-float);',
      'color: var(--color-ink);',
      'font-family: var(--font-sans);',
      'box-shadow: var(--shadow-lift);',
    ]) {
      expect(panel, declaration).toContain(declaration);
    }
    // The rail's own surface, declaration for declaration.
    const rail = blockAfter(closeUp(stripComments(read('src/components/sidebar.css'))), '.sidebar {');
    for (const declaration of [
      'border: 1px solid var(--color-hairline);',
      'border-radius: var(--radius-stadium);',
      'background-color: var(--color-float);',
      'box-shadow: var(--shadow-lift);',
    ]) {
      expect(rail, declaration).toContain(declaration);
    }
  });

  it('sticks the panel an inset under --page-sticky-top, as tall as the viewport allows, its body scrolling', () => {
    const css = rules();
    const panel = blockAfter(css, '.side-panel {');
    expect(panel).toContain('position: sticky;');
    // Floating chrome stays an inset clear of what it floats over: the page header above, the viewport's end below.
    expect(panel).toContain('inset-block-start: calc(var(--page-sticky-top, 0px) + var(--spacing-inset));');
    expect(panel).toContain(
      'max-block-size: calc(100dvh - var(--page-sticky-top, 0px) - 2 * var(--spacing-inset));',
    );
    const body = blockAfter(css, '.side-panel-body {');
    for (const declaration of [
      'flex: 1 1 auto;',
      'min-block-size: 0;',
      'overflow: auto;',
      'overflow-wrap: anywhere;',
    ]) {
      expect(body, declaration).toContain(declaration);
    }
    expect(blockAfter(css, '.side-panel-header {')).toContain('flex: none;');
    expect(blockAfter(css, '.side-panel-footer {')).toContain('flex: none;');
  });

  it('sets the sticky offset to 0px inside the body and the sheet body, which scroll (spec correction 68)', () => {
    const css = rules();
    expect(blockAfter(css, '.side-panel-body {')).toContain('--page-sticky-top: 0px;');
    expect(blockAfter(css, '.side-panel-sheet .sheet-body {')).toContain('--page-sticky-top: 0px;');
  });

  it('sets the title at the h3 step at 700 in ink and the description at the small step in slate', () => {
    const css = rules();
    const title = blockAfter(css, '.side-panel-title {');
    for (const declaration of [
      'margin: 0;',
      'color: var(--color-ink);',
      'font-size: var(--text-h3);',
      'line-height: var(--text-h3--line-height);',
      'letter-spacing: var(--text-h3--letter-spacing);',
      'font-weight: 700;',
      'overflow-wrap: anywhere;',
      'outline: none;',
    ]) {
      expect(title, declaration).toContain(declaration);
    }
    const description = blockAfter(css, '.side-panel-description {');
    for (const declaration of [
      'margin: 0;',
      'margin-block-start: 0.25rem;',
      'color: var(--color-slate);',
      'font-size: var(--text-small);',
      'line-height: var(--text-small--line-height);',
      'font-weight: var(--text-small--font-weight);',
      'overflow-wrap: anywhere;',
    ]) {
      expect(description, declaration).toContain(declaration);
    }
    for (const [, weight] of css.matchAll(/font-weight: (\d+);/g)) {
      expect(['400', '450', '500', '700']).toContain(weight);
    }
    for (const token of [
      '--color-taupe',
      '--color-signal',
      '--color-clay',
      '--color-error',
      '--color-success',
    ]) {
      expect(css, token).not.toContain(token);
    }
  });

  it('rings the heading, the panel and a body that scrolls in the focus ring token when the keyboard lands there', () => {
    const css = rules();
    for (const selector of ['.side-panel-title:focus-visible {', '.side-panel:focus-visible {']) {
      const ring = blockAfter(css, selector);
      expect(ring, selector).toContain('outline: var(--focus-ring-width) solid var(--focus-ring-color);');
      expect(ring, selector).toContain('outline-offset: var(--focus-ring-offset);');
    }
    const body = blockAfter(css, '.side-panel-body:focus-visible {');
    expect(body).toContain('outline: var(--focus-ring-width) solid var(--focus-ring-color);');
    expect(body).toContain('outline-offset: calc(-1 * var(--focus-ring-width));');
  });

  it('puts the close button at the header end, pulled into the corner by a part step', () => {
    const css = rules();
    const header = blockAfter(css, '.side-panel-header {');
    expect(header).toContain('display: flex;');
    expect(header).toContain('align-items: flex-start;');
    expect(header).toContain('gap: var(--spacing-part);');
    expect(blockAfter(css, '.side-panel-header-text {')).toContain('min-inline-size: 0;');
    const close = blockAfter(css, '.side-panel-close {');
    expect(close).toContain('flex: none;');
    expect(close).toContain('margin-block-start: calc(-1 * var(--spacing-part));');
    expect(close).toContain('margin-inline-end: calc(-1 * var(--spacing-part));');
  });

  it('pins the footer under a divider', () => {
    const footer = blockAfter(rules(), '.side-panel-footer {');
    for (const declaration of [
      'display: flex;',
      'flex-wrap: wrap;',
      'justify-content: flex-end;',
      'gap: var(--spacing-part);',
      'margin-inline: var(--spacing-peer);',
      'padding-block: var(--spacing-inset) var(--holder-corner-inset);',
      'border-block-start: 1px solid var(--color-divider);',
    ]) {
      expect(footer, declaration).toContain(declaration);
    }
  });

  it('hides the panel under 1024px, the medium breakpoint written out', async () => {
    const css = rules();
    expect(blockAfter(css, '.side-panel {')).toContain('display: none;');
    expect(blockAfter(blockAfter(css, WIDE), '.side-panel {')).toContain('display: flex;');
    // A media query cannot read a custom property, so the width is written out and must stay the token.
    const { tokens } = await import('../dist/tokens.js');
    const widths = [...css.matchAll(/@media \(width [<>]=? (\d+px)\)/g)].map((match) => match[1]);
    expect(widths.length).toBeGreaterThan(0);
    for (const width of widths) expect(width).toBe(tokens.breakpoint.md.value);
  });

  it('never moves, and writes only logical sides', () => {
    const css = rules();
    expect(css).not.toMatch(/(?<![\w-])(?:transition|animation)\s*:/);
    expect(css).not.toContain("[dir='rtl']");
    expect(css).not.toMatch(
      /(?:margin|padding|inset|border)-(?:left|right|top|bottom)\b|(?<![\w-])(?:left|right|top|bottom):/,
    );
  });

  it('draws the edge CanvasText and the heading ring Highlight in forced colors', () => {
    const forced = blockAfter(rules(), FORCED);
    expect(blockAfter(forced, '.side-panel {')).toContain('border-color: CanvasText;');
    expect(blockAfter(forced, '.side-panel-footer {')).toContain('border-block-start-color: CanvasText;');
    expect(
      blockAfter(
        forced,
        '.side-panel:focus-visible, .side-panel-title:focus-visible, .side-panel-body:focus-visible {',
      ),
    ).toContain('outline-color: Highlight;');
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
    // prose.css's element rules sit in one layer nested in components, under the components' own rules.
    expect(order.filter((name) => name !== 'prose')).toEqual(['theme', 'base', 'components', 'utilities']);
    expect(order.indexOf('prose')).toBeGreaterThan(order.indexOf('components'));
    expect(built).not.toMatch(/^@layer prose/m);
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

describe('src/components/progress-bar.css', () => {
  // The rules without their comments, with their whitespace closed up.
  const rules = () => closeUp(stripComments(read('src/components/progress-bar.css')));
  const FORCED = '@media (forced-colors: active)';
  const REDUCED = '@media (prefers-reduced-motion: reduce)';
  const INDETERMINATE = '.progress-bar-track[data-indeterminate] .progress-bar-fill {';

  it('draws the head as Meter draws its own', () => {
    const css = rules();
    const meter = closeUp(stripComments(read('src/components/meter.css')));
    // The head, the label and the value are Meter's rules under the progress bar's names, declaration for
    // declaration, so the two read as one object.
    for (const part of ['head', 'label', 'value']) {
      expect(blockAfter(css, `.progress-bar-${part} {`), part).toBe(blockAfter(meter, `.meter-${part} {`));
    }
    const root = blockAfter(css, '.progress-bar {');
    for (const declaration of [
      'display: grid;',
      'gap: var(--spacing-part);',
      'min-width: 0;',
      'font-family: var(--font-sans);',
      'color: var(--color-ink);',
      'print-color-adjust: exact;',
    ]) {
      expect(root, declaration).toContain(declaration);
    }
    expect(css).not.toMatch(/font-weight:\s*600/);
  });

  it('draws an 8px frame track at the pill radius and an ink fill at the same radius', () => {
    const css = rules();
    const track = blockAfter(css, '.progress-bar-track {');
    for (const declaration of [
      'position: relative;',
      'height: 0.5rem;',
      'overflow: hidden;',
      'border-radius: var(--radius-pill);',
      'background-color: var(--color-frame);',
    ]) {
      expect(track, declaration).toContain(declaration);
    }
    const fill = blockAfter(css, '.progress-bar-fill {');
    for (const declaration of [
      'position: absolute;',
      'inset-block: 0;',
      'inset-inline-start: 0;',
      'border-radius: var(--radius-pill);',
      'background-color: var(--color-ink);',
    ]) {
      expect(fill, declaration).toContain(declaration);
    }
    // Ink and the frame only: no reserved color means anything here.
    for (const reserved of [
      '--color-signal',
      '--color-clay',
      '--color-error',
      '--color-success',
      '--color-warning',
      '--color-taupe',
    ]) {
      expect(css, reserved).not.toContain(reserved);
    }
    expect(css).not.toContain('box-shadow');
  });

  it('sizes the fill by --progress-bar-value and moves it over 200ms', () => {
    const fill = blockAfter(rules(), '.progress-bar-fill {');
    expect(fill).toContain('inline-size: var(--progress-bar-value, 0%);');
    expect(fill).toContain('transition: inline-size 200ms ease;');
  });

  it("slides a 40% segment over 1.6s by its logical inset, which follows the track's own direction", () => {
    const css = rules();
    const segment = blockAfter(css, INDETERMINATE);
    expect(segment).toContain('inline-size: 40%;');
    expect(segment).toContain('transition: none;');
    expect(segment).toContain('animation: progress-bar-slide 1.6s ease-in-out infinite;');
    // From wholly before the start to wholly past the end, by the logical inset, so the slide follows the
    // direction the track resolves to, whatever set it (an rtl ancestor, a nested dir, dir="auto"). No sign
    // from an ancestor's attribute, and no physical move.
    const frames = blockAfter(css, '@keyframes progress-bar-slide {');
    expect(blockAfter(frames, 'from {').trim()).toBe('inset-inline-start: -40%;');
    expect(blockAfter(frames, 'to {').trim()).toBe('inset-inline-start: 100%;');
    expect(css).not.toContain('--progress-bar-slide');
    expect(css).not.toContain("[dir='rtl']");
    expect(css).not.toMatch(/\btranslate\b|\bleft:|\bright:/);
    // :dir() is above the browser floor.
    expect(css).not.toContain(':dir(');
  });

  it('rests the segment at the first frame, wholly before the start, so a stopped bar reads empty', () => {
    // With animations off (Playwright's screenshots, a reader's own animation: none) the base rule is what
    // draws, so it is the first keyframe's position, never the determinate fill's inline start.
    const css = rules();
    const segment = blockAfter(css, INDETERMINATE);
    const frames = blockAfter(css, '@keyframes progress-bar-slide {');
    expect(segment).toContain('inset-inline-start: -40%;');
    expect(segment).toContain(blockAfter(frames, 'from {').trim());
  });

  it('stops the move and slows the slide to 8/3 of 1.6s under reduced motion, never to none', () => {
    const reduced = blockAfter(rules(), REDUCED);
    expect(blockAfter(reduced, '.progress-bar-fill {')).toContain('transition: none;');
    expect(blockAfter(reduced, INDETERMINATE)).toContain('animation-duration: calc(1.6s * 8 / 3);');
    expect(reduced).not.toMatch(/animation(?:-name)?:\s*none/);
    expect(reduced).not.toContain('animation-play-state');
  });

  it('outlines the track and fills with canvastext in forced colors', () => {
    const forced = blockAfter(rules(), FORCED);
    expect(blockAfter(forced, '.progress-bar-track {')).toMatch(/outline: 1px solid canvastext;/i);
    expect(blockAfter(forced, '.progress-bar-fill {')).toMatch(/background-color: canvastext;/i);
  });
});

describe('src/components/file-drop-zone.css', () => {
  // The rules without their comments, with their whitespace closed up.
  const rules = () => closeUp(stripComments(read('src/components/file-drop-zone.css')));
  const FORCED = '@media (forced-colors: active)';
  const REDUCED = '@media (prefers-reduced-motion: reduce)';
  const TARGET = '.file-drop-zone-box[data-drop-target] {';
  const INVALID = '.file-drop-zone[data-invalid] .file-drop-zone-box {';

  it('draws the box at the surface radius with a 2px dashed boundary edge, the peer padding and 8rem tall', () => {
    const box = blockAfter(rules(), '.file-drop-zone-box {');
    for (const declaration of [
      'container: file-drop-zone / inline-size;',
      'gap: var(--spacing-part);',
      'min-block-size: 8rem;',
      'padding: var(--spacing-peer);',
      'border: 2px dashed var(--color-boundary);',
      'border-radius: var(--radius-surface);',
      // A click anywhere on the box opens the picker: the pointer cursor of a control.
      'cursor: pointer;',
    ]) {
      expect(box, declaration).toContain(declaration);
    }
    // No fill of its own: it takes its holder's.
    expect(box).not.toContain('background');
    const css = rules();
    expect(blockAfter(css, '.file-drop-zone-icon {')).toContain('color: var(--color-slate);');
    expect(blockAfter(css, '.file-drop-zone-icon svg {')).toContain('width: 1.5rem;');
    expect(blockAfter(css, '.file-drop-zone-hint {')).toContain(
      'font-weight: var(--text-body--font-weight);',
    );
    expect(blockAfter(css, '.file-drop-zone-drop {')).toContain('font-weight: 500;');
    expect(css).not.toMatch(/font-weight:\s*600/);
  });

  it('lays the content out as one row under 20rem of its own box', () => {
    const narrow = blockAfter(rules(), '@container file-drop-zone (width < 20rem) {');
    expect(blockAfter(narrow, '.file-drop-zone-icon {')).toContain('flex: none;');
    expect(blockAfter(narrow, '.file-drop-zone-line {')).toContain('flex: 1 1 0;');
  });

  it('turns the edge solid ink over the 5% ink wash as a drop target, and swaps the hint for the drop line', () => {
    const css = rules();
    const target = blockAfter(css, TARGET);
    expect(target).toContain('border-style: solid;');
    expect(target).toContain('border-color: var(--color-ink);');
    expect(target).toContain('background-color: color-mix(in srgb, var(--color-ink) 5%, transparent);');
    expect(blockAfter(css, '.file-drop-zone-box[data-drop-target] .file-drop-zone-hint {')).toContain(
      'display: none;',
    );
    expect(blockAfter(css, '.file-drop-zone-box[data-drop-target] .file-drop-zone-drop {')).toContain(
      'display: inline;',
    );
    // Never signal orange, which is consent, and never link blue.
    expect(css).not.toContain('--color-signal');
    expect(css).not.toContain('--color-link');
  });

  it('draws invalid after the drop target, dashed in the error color, so it wins', () => {
    const css = rules();
    expect(css.indexOf(INVALID)).toBeGreaterThan(css.indexOf(TARGET));
    const invalid = blockAfter(css, INVALID);
    expect(invalid).toContain('border-style: dashed;');
    expect(invalid).toContain('border-color: var(--color-error);');
  });

  it('draws a disabled zone in taupe, edge, text and icon, with the not-allowed cursor', () => {
    const css = rules();
    const box = blockAfter(
      css,
      ".file-drop-zone:is([data-disabled], [aria-disabled='true']) .file-drop-zone-box {",
    );
    expect(box).toContain('border-color: var(--color-taupe);');
    expect(box).toContain('color: var(--color-taupe);');
    expect(box).toContain('cursor: not-allowed;');
    expect(
      blockAfter(css, ".file-drop-zone:is([data-disabled], [aria-disabled='true']) .file-drop-zone-icon {"),
    ).toContain('color: var(--color-taupe);');
  });

  it('draws no hint on a coarse pointer without hover', () => {
    const touch = blockAfter(rules(), '@media (hover: none) and (pointer: coarse) {');
    expect(blockAfter(touch, '.file-drop-zone-hint {')).toContain('display: none;');
    // Only the hint: the button stays.
    expect(touch).not.toContain('button');
  });

  it('insets the overlay past the rail, one layer over the chrome, at the stadium radius over the canvas at 92%', () => {
    const css = rules();
    const overlay = blockAfter(css, '.page-drop-zone {');
    for (const declaration of [
      'position: fixed;',
      'inset: var(--spacing-inset);',
      'inset-inline-start: calc(var(--app-shell-sidebar, 0px) + var(--spacing-inset));',
      'z-index: calc(var(--z-chrome) + 1);',
      'border: 2px dashed var(--color-ink);',
      'border-radius: var(--radius-stadium);',
      'background-color: color-mix(in srgb, var(--color-canvas) 92%, transparent);',
    ]) {
      expect(overlay, declaration).toContain(declaration);
    }
    const card = blockAfter(css, '.page-drop-zone-card {');
    for (const declaration of [
      'padding: var(--spacing-peer) var(--spacing-separate);',
      'border: 1px solid var(--color-frame);',
      'border-radius: var(--radius-surface);',
      'background-color: var(--color-float);',
      'box-shadow: var(--shadow-float);',
    ]) {
      expect(card, declaration).toContain(declaration);
    }
    expect(blockAfter(css, '.page-drop-zone-icon svg {')).toContain('width: 2.5rem;');
    expect(blockAfter(css, '.page-drop-zone-title {')).toContain('font-size: var(--text-h3);');
    expect(blockAfter(css, '.page-drop-zone-description {')).toContain('color: var(--color-slate);');
  });

  it('fades the overlay in over 120ms through @starting-style, and not under reduced motion', () => {
    const css = rules();
    expect(blockAfter(css, '.page-drop-zone {')).toContain('transition: opacity 120ms ease;');
    expect(blockAfter(blockAfter(css, '@starting-style {'), '.page-drop-zone {')).toContain('opacity: 0;');
    expect(blockAfter(blockAfter(css, REDUCED), '.page-drop-zone {')).toContain('transition: none;');
  });

  it('draws the dashed edges canvastext, the drop target highlight and the overlay canvas in forced colors', () => {
    const css = rules();
    const forced = blockAfter(css, FORCED);
    expect(blockAfter(forced, '.file-drop-zone-box {')).toMatch(/border-color: canvastext;/i);
    // The drop target's edge, solid, wins over invalid: as specific as the invalid rule, and after it.
    const target = '.file-drop-zone .file-drop-zone-box[data-drop-target] {';
    expect(blockAfter(forced, target)).toMatch(/border-style: solid;/i);
    expect(blockAfter(forced, target)).toMatch(/border-color: highlight;/i);
    expect(css.indexOf(target, css.indexOf(FORCED))).toBeGreaterThan(css.indexOf(INVALID));
    // A disabled zone in the reader's disabled color: the edge, the text and the icon.
    const disabled = blockAfter(
      forced,
      ".file-drop-zone:is([data-disabled], [aria-disabled='true']) .file-drop-zone-box,",
    );
    expect(disabled).toMatch(/border-color: graytext;/i);
    expect(disabled).toMatch(/(^|[^-])color: graytext;/i);
    expect(forced).toContain(
      ".file-drop-zone:is([data-disabled], [aria-disabled='true']) .file-drop-zone-icon {",
    );
    const overlay = blockAfter(forced, '.page-drop-zone {');
    expect(overlay).toMatch(/border-color: canvastext;/i);
    expect(overlay).toMatch(/background-color: canvas;/i);
    expect(blockAfter(forced, '.page-drop-zone-card {')).toMatch(/border-color: canvastext;/i);
  });
});

describe('text on Highlight in forced colors', () => {
  // Inside the forced repaint Chromium draws a backplate in the system's background color behind each run of
  // text, which blanks HighlightText on a Highlight fill. Every part that sets its text that way is drawn out of
  // the repaint, as a selected DataTable row is, and its ring, which the repaint no longer picks, is named.
  const forced = (file) =>
    closeUp(stripComments(read(`src/components/${file}`)))
      .split(`${FORCED_COLORS} {`)
      .slice(1)
      .join(' ');
  const PARTS = [
    ['menu.css', '.menu-item[data-selection-mode][data-selected]:not([data-disabled]) {'],
    ['command-palette.css', '.command-palette-list .menu-item[data-focus-visible] {'],
    ['filter-chip.css', '.filter-chip[data-active]:not([data-disabled]) {'],
    ['date-range-picker.css', '.date-segment:is(:focus, [data-focused]) {'],
    ['tabs.css', ".tab:is([aria-selected='true'], [data-selected]) {"],
    ['segmented.css', '.segmented-option:is([data-selected], :where(:has(input:checked))) {'],
    ['pagination.css', ".pagination-page:is([aria-current='page'], [aria-current='true'], [data-current]) {"],
    ['sidebar.css', ".sidebar-item:is([aria-current='page'], [data-current]) {"],
    ['tab-bar.css', ".tab-bar-item:is([aria-current='page'], [data-current], [data-current-action]) {"],
  ];

  for (const [file = '', header = ''] of PARTS) {
    it(`draws ${header.slice(0, -2)} out of the repaint in ${file}`, () => {
      const rule = blockAfter(forced(file), header);
      expect(rule).toContain('forced-color-adjust: none;');
      expect(rule).toContain('background-color: Highlight;');
      expect(rule).toContain('color: HighlightText;');
    });
  }

  it('names the rings the repaint no longer picks: HighlightText inside a fill, Highlight outside one', () => {
    const menu = '.menu-item[data-selection-mode][data-selected]:not([data-disabled])[data-focus-visible] {';
    expect(blockAfter(forced('menu.css'), menu)).toContain('outline-color: HighlightText;');
    const palette = '.command-palette-list .menu-item[data-focus-visible] {';
    expect(blockAfter(forced('command-palette.css'), palette)).toContain('outline-color: HighlightText;');
    // The chip's ring and the current rail item's stand outside the pill, on the page.
    const chip = '.filter-chip[data-active]:not([data-disabled]) {';
    expect(blockAfter(forced('filter-chip.css'), chip)).toContain('outline-color: Highlight;');
    const item = ".sidebar-item:is([aria-current='page'], [data-current]) {";
    expect(blockAfter(forced('sidebar.css'), item)).toContain('outline-color: Highlight;');
    const parts = '.filter-chip[data-active]:not([data-disabled]) :where(*) {';
    expect(blockAfter(forced('filter-chip.css'), parts)).toContain('outline-color: HighlightText;');
  });
});

describe('src/components/upload-tray.css', () => {
  // The rules without their comments, with their whitespace closed up.
  const rules = () => closeUp(stripComments(read('src/components/upload-tray.css')));
  const toast = () => closeUp(stripComments(read('src/components/toast.css')));
  const FORCED = '@media (forced-colors: active)';
  const REDUCED = '@media (prefers-reduced-motion: reduce)';
  const BOTTOM =
    'inset-block-end: calc(var(--app-shell-inset-block-end, 0px) + var(--overlay-inset) + var(--save-bar-offset, 0px));';

  it('lays a row out as the list face item: a 24px icon, the text and the buttons, on a divider', () => {
    const css = rules();
    const row = blockAfter(css, '.upload-row {');
    for (const declaration of [
      'display: grid;',
      'grid-template-columns: 24px minmax(0, 1fr) auto;',
      'column-gap: 0.75rem;',
      'min-block-size: max(var(--size-target), 3.5rem);',
      'padding: 0.625rem var(--spacing-inset);',
    ]) {
      expect(row, declaration).toContain(declaration);
    }
    expect(blockAfter(css, '.upload-row + .upload-row {')).toContain(
      'border-block-start: 1px solid var(--color-divider);',
    );
    expect(blockAfter(css, '.upload-list {')).toContain('list-style: none;');
    expect(blockAfter(css, '.upload-row-icon svg {')).toContain('width: 1.5rem;');
  });

  it('sets the name at the small step 500 and the status line at the small step 450, and the bar a part step under it', () => {
    const css = rules();
    const name = blockAfter(css, '.upload-row-name {');
    expect(name).toContain('font-size: var(--text-small);');
    expect(name).toContain('font-weight: 500;');
    expect(blockAfter(css, 'span.upload-row-name {')).toContain('color: var(--color-ink);');
    const status = blockAfter(css, '.upload-row-status {');
    expect(status).toContain('font-size: var(--text-small);');
    expect(status).toContain('font-weight: var(--text-small--font-weight);');
    expect(blockAfter(css, '.upload-row-bar {')).toContain('margin-block-start: var(--spacing-part);');
    expect(css).not.toMatch(/font-weight:\s*600/);
  });

  it('keeps the extension in view: the stem ellipsizes, the extension does not, both isolated', () => {
    const css = rules();
    const stem = blockAfter(css, '.upload-row-stem {');
    expect(stem).toContain('text-overflow: ellipsis;');
    expect(stem).toContain('min-width: 0;');
    expect(stem).toContain('unicode-bidi: isolate;');
    const ext = blockAfter(css, '.upload-row-ext {');
    expect(ext).toContain('flex: none;');
    expect(ext).toContain('unicode-bidi: isolate;');
  });

  it('colors the word and the icon by status, slate in flight, and the reason slate', () => {
    const css = rules();
    expect(blockAfter(css, '.upload-row {')).toContain('--upload-row-tone: var(--color-slate);');
    for (const [status, color] of [
      ['saved', 'success'],
      ['review', 'warning'],
      ['failed', 'error'],
    ]) {
      expect(blockAfter(css, `.upload-row[data-status='${status}'] {`), status).toContain(
        `--upload-row-tone: var(--color-${color});`,
      );
    }
    expect(blockAfter(css, '.upload-row-word {')).toContain('color: var(--upload-row-tone);');
    expect(blockAfter(css, '.upload-row-icon {')).toContain('color: var(--upload-row-tone);');
    expect(blockAfter(css, '.upload-row-reason {')).toContain('color: var(--color-slate);');
    // Reserved colors: no consent and no unsaved work in a row.
    expect(css).not.toContain('--color-signal');
    expect(css).not.toContain('--color-clay');
  });

  it('draws the wide face on the float surface in the toast column, above the bottom reserve, at the chrome layer', () => {
    const css = rules();
    const panel = blockAfter(css, '.upload-tray {');
    for (const declaration of [
      'position: fixed;',
      BOTTOM,
      'z-index: var(--z-chrome);',
      'border: var(--holder-border) solid var(--color-frame);',
      'border-radius: var(--holder-radius);',
      'background-color: var(--color-float);',
      'box-shadow: var(--shadow-float);',
    ]) {
      expect(panel, declaration).toContain(declaration);
    }
    // The toast region's own width and inline end (spec correction 10), so the corner is one column.
    const region = blockAfter(toast(), '.toast-region {');
    for (const declaration of [
      'width: min(28rem, calc(100vw - 2rem));',
      'inset-inline-end: var(--overlay-inset);',
    ]) {
      expect(panel, declaration).toContain(declaration);
      expect(region, declaration).toContain(declaration);
    }
  });

  it('rules the header off while the body shows, and scrolls the body under a 24rem cap', () => {
    const css = rules();
    expect(blockAfter(css, '.upload-tray:not([data-collapsed]) .upload-tray-header {')).toContain(
      'border-block-end: 1px solid var(--color-divider);',
    );
    const title = blockAfter(css, '.upload-tray-title {');
    expect(title).toContain('font-size: var(--text-body);');
    expect(title).toContain('font-weight: 500;');
    expect(title).toContain('font-variant-numeric: tabular-nums;');
    expect(blockAfter(css, '.upload-tray-description {')).toContain('color: var(--color-slate);');
    const body = blockAfter(css, '.upload-tray-body {');
    expect(body).toContain('max-block-size: min(24rem, 50dvh);');
    expect(body).toContain('overflow-y: auto;');
    expect(body).toContain('scrollbar-color: var(--color-scrollbar) transparent;');
    expect(blockAfter(css, '.upload-tray[data-collapsed] .upload-tray-fold svg {')).toContain(
      'rotate: 180deg;',
    );
  });

  it('draws the phone bar as a float pill the field tall, never under the target, nor 44px on a coarse pointer', () => {
    const css = rules();
    const bar = blockAfter(css, '.upload-tray-bar {');
    for (const declaration of [
      'position: fixed;',
      'inset-inline: var(--overlay-inset);',
      BOTTOM,
      'z-index: var(--z-chrome);',
      'block-size: var(--size-field);',
      'min-block-size: var(--size-target);',
      'border-radius: var(--holder-radius);',
      'background-color: var(--color-float);',
      'box-shadow: var(--shadow-float);',
    ]) {
      expect(bar, declaration).toContain(declaration);
    }
    expect(blockAfter(blockAfter(css, '@media (pointer: coarse)'), '.upload-tray-bar {')).toContain(
      'min-block-size: 44px;',
    );
    const button = blockAfter(css, '.upload-tray-bar-button {');
    expect(button).toContain('font-size: var(--text-small);');
    expect(button).toContain('font-weight: 500;');
    expect(blockAfter(css, '.upload-tray-bar-icon svg {')).toContain('width: 1rem;');
    // Hover only where hover exists.
    const outside = css.replace(/@media \(hover: hover\) \{(?:[^{}]*\{[^{}]*\})*[^{}]*\}/g, '');
    expect(outside).not.toMatch(/:hover/);
  });

  it('switches faces at the small breakpoint, written out', async () => {
    const { tokens } = await import('../dist/tokens.js');
    const css = rules();
    const narrow = blockAfter(css, `@media (width < ${tokens.breakpoint.sm.value})`);
    expect(blockAfter(narrow, '.upload-tray {')).toContain('display: none;');
    const wide = blockAfter(css, `@media (width >= ${tokens.breakpoint.sm.value})`);
    expect(blockAfter(wide, '.upload-tray-bar {')).toContain('display: none;');
    // Every width query is the token.
    for (const [, width] of css.matchAll(/@media \(width [<>]=? (\d+px)\)/g)) {
      expect(width).toBe(tokens.breakpoint.sm.value);
    }
  });

  it('rises 8px and fades in through @starting-style, and not at all under reduced motion', () => {
    const css = rules();
    const start = blockAfter(blockAfter(css, '@starting-style'), '.upload-tray {');
    expect(start).toContain('opacity: 0;');
    expect(start).toContain('translate: 0 8px;');
    expect(blockAfter(css, '.upload-tray {')).toContain(
      'transition: opacity 200ms ease, translate 200ms ease;',
    );
    expect(blockAfter(blockAfter(css, REDUCED), '.upload-tray {')).toContain('transition: none;');
  });

  it("redraws the edges and the icons in the reader's text color in forced colors", () => {
    const forced = blockAfter(rules(), FORCED);
    expect(blockAfter(forced, '.upload-tray, .upload-tray-bar {')).toContain('border-color: canvastext;');
    expect(blockAfter(forced, '.upload-row-icon, .upload-tray-alert, .upload-tray-bar-clear {')).toContain(
      'color: canvastext;',
    );
  });

  it('names the panel and the bar as holders, from the radius tokens, and not the sheet, whose bottom is square', () => {
    const css = rules();
    for (const [holder, radius] of [
      ['.upload-tray {', 'var(--radius-surface)'],
      ['.upload-tray-bar {', 'var(--radius-pill)'],
    ]) {
      const rule = blockAfter(css, holder);
      expect(rule, holder).toContain(`--holder-radius: ${radius};`);
      expect(rule, holder).toContain('--holder-border: 1px;');
      expect(rule, holder).toContain('--holder-pad: 0px;');
      expect(rule, holder).toContain(
        '--holder-corner-inset: max(var(--holder-pad), calc(var(--holder-radius) - var(--holder-border)));',
      );
      expect(rule, holder).toContain('border: var(--holder-border) solid var(--color-frame);');
      expect(rule, holder).toContain('border-radius: var(--holder-radius);');
    }
    expect(css).not.toContain('.upload-tray-sheet {');
    expect(css).not.toContain('--radius-stadium');
  });

  it("moves the panel's buttons out of its corners and keeps their round; the bar's fill it concentric", () => {
    const css = rules();
    const INSET = 'calc(var(--holder-corner-inset) - var(--holder-pad))';
    // Down, so the trailing buttons stay on the rows' end edge: the header's under its block-start padding, the
    // last row's over its block-end padding.
    expect(blockAfter(css, '.upload-tray-header {')).toContain(
      `padding-block: max(var(--spacing-part), ${INSET}) var(--spacing-part);`,
    );
    expect(blockAfter(css, '.upload-tray-header {')).toContain(
      'padding-inline: var(--spacing-inset) var(--spacing-part);',
    );
    expect(blockAfter(css, '.upload-tray-body > .upload-list > .upload-row:last-child {')).toContain(
      `padding-block-end: max(0.625rem, ${INSET});`,
    );
    // Folded, the panel is a single row: the trailing button moves in instead.
    const folded = blockAfter(css, '.upload-tray[data-collapsed] .upload-tray-header {');
    expect(folded).toContain('padding-block-start: var(--spacing-part);');
    expect(folded).toContain(`padding-inline-end: max(var(--spacing-part), ${INSET});`);
    expect(blockAfter(css, '.upload-row {')).toContain('padding: 0.625rem var(--spacing-inset);');
    expect(blockAfter(css, '.upload-row-actions {')).toContain('margin-inline-end: -0.5rem;');
    // The list reads no holder, and no button in the panel or the list is given a corner of its own.
    expect(css).not.toMatch(/--upload-(?:list|row|tray-header)-radius/);
    expect(css).not.toMatch(/\.icon-button[^{]*\{[^}]*border-radius/);
    expect(css).not.toMatch(/progress-bar-(?:track|fill)/);
    // The bar's buttons fill it inside its edge.
    for (const button of ['.upload-tray-bar-button {', '.upload-tray-bar-clear {']) {
      expect(blockAfter(css, button), button).toContain(
        'border-radius: max(0px, calc(var(--holder-radius) - var(--holder-border) - var(--holder-pad)));',
      );
    }
    // No corner copies its holder's: only the holders draw theirs, and the bar's buttons subtract the gap.
    expect(css).not.toMatch(/border-radius:\s*inherit/);
    const radii = [...css.matchAll(/(?<![\w-])border-radius:\s*([^;]+);/g)].map((match) => match[1]);
    expect(radii).toEqual([
      'var(--holder-radius)',
      'var(--holder-radius)',
      'max(0px, calc(var(--holder-radius) - var(--holder-border) - var(--holder-pad)))',
      'max(0px, calc(var(--holder-radius) - var(--holder-border) - var(--holder-pad)))',
    ]);
  });

  it("reserves the phone bar's room under the page from tokens while it shows, and never pads the root's scroll", async () => {
    const { tokens } = await import('../dist/tokens.js');
    const narrow = blockAfter(rules(), `@media (width < ${tokens.breakpoint.sm.value})`);
    // A focused control is scrolled clear by the tray's script (spec correction 121).
    expect(rules()).not.toContain('scroll-padding');
    expect(rules()).not.toContain(':root:has(.upload-tray-bar)');
    // In the bottom edge's order: the tab bar's reserve, a sticky bar's offset, then the tray.
    expect(blockAfter(narrow, '.app-shell:has(> .upload-tray-bar) .app-shell-workspace {')).toContain(
      'padding-block-end: calc(var(--app-shell-inset-block-end) + var(--save-bar-offset, 0px) + max(var(--size-field), var(--size-target)) + var(--spacing-inset));',
    );
    // Border-box, so the reserve is the bar's whole height.
    expect(blockAfter(rules(), '.upload-tray-bar {')).toContain('box-sizing: border-box;');
    // The gap a focused control keeps above either face, which the tray's script reads.
    expect(blockAfter(rules(), '.upload-tray-bar {')).toContain(
      'scroll-margin-block-end: var(--spacing-inset);',
    );
    expect(blockAfter(rules(), '.upload-tray {')).toContain('scroll-margin-block-end: var(--spacing-inset);');
    // Nothing reserves room on a wide screen, where the panel sits in the corner.
    expect(blockAfter(rules(), `@media (width >= ${tokens.breakpoint.sm.value})`)).not.toContain('reserve');
  });

  it("draws the bar's clear X and the sheet's action, and presses as the native :active does too", () => {
    const css = rules();
    const clear = blockAfter(css, '.upload-tray-bar-clear {');
    expect(clear).toContain('inline-size: max(var(--size-field), var(--size-target));');
    expect(clear).toContain('color: var(--color-slate);');
    expect(
      blockAfter(css, ':is(.upload-tray-bar-button, .upload-tray-bar-clear):is(:active, [data-pressed]) {'),
    ).toContain('background-color: color-mix(in srgb, var(--color-ink) 5%, transparent);');
    expect(css).not.toMatch(/(?<!:is\(:active, )\[data-pressed\]/);
    expect(
      blockAfter(
        css,
        ':is(.upload-tray-bar-button, .upload-tray-bar-clear):is(:focus-visible, [data-focus-visible]) {',
      ),
    ).toContain('outline: var(--focus-ring-width) solid var(--focus-ring-color);');
    expect(blockAfter(css, '.upload-tray-sheet-action {')).toContain('inline-size: 100%;');
  });

  it('leads the title with the error icon while a row has failed, and rings a row that takes focus inside it', () => {
    const css = rules();
    expect(blockAfter(css, '.upload-tray-alert {')).toContain('color: var(--color-error);');
    expect(blockAfter(css, '.upload-row:focus {')).toContain('outline: none;');
    const ring = blockAfter(css, '.upload-row:is(:focus-visible, [data-focus-visible]) {');
    expect(ring).toContain('outline: var(--focus-ring-width) solid var(--focus-ring-color);');
    expect(ring).toContain('outline-offset: calc(-1 * var(--focus-ring-width));');
    const forced = blockAfter(css, FORCED);
    expect(blockAfter(forced, '.upload-row-icon, .upload-tray-alert, .upload-tray-bar-clear {')).toContain(
      'color: canvastext;',
    );
  });

  it('keeps the status host in the page and out of sight', () => {
    const host = blockAfter(rules(), '.upload-tray-status {');
    for (const declaration of ['position: absolute;', 'overflow: hidden;', 'clip-path: inset(50%);']) {
      expect(host, declaration).toContain(declaration);
    }
    expect(host).not.toMatch(/display\s*:\s*none|visibility\s*:\s*hidden/);
  });
});

describe('src/components/date-picker.css', () => {
  // The rules without their comments, with their whitespace closed up.
  const rules = () => closeUp(stripComments(read('src/components/date-picker.css')));
  const RING =
    '.date-picker-control.input:where(:has(.date-segment:is(:focus-visible, [data-focus-visible])))';

  it("lays the frame out as the range picker's, on .input with one-class rules, never under 12rem", () => {
    const frame = blockAfter(rules(), '.date-picker-control {');
    for (const declaration of [
      'position: relative;',
      'display: flex;',
      'align-items: center;',
      'min-inline-size: 12rem;',
      'padding-inline: 1.5rem 3rem;',
      'cursor: text;',
    ]) {
      expect(frame, declaration).toContain(declaration);
    }
    // The frame clips nothing, so the button's 40px hit area reaches past it at either density.
    expect(frame).not.toContain('overflow');
    // The edge, the fill, the height and the states are input.css's.
    for (const property of ['border', 'background', 'color:', 'height']) {
      expect(frame, property).not.toContain(property);
    }
    const ring = blockAfter(rules(), `${RING} {`);
    expect(ring).toContain('border: 1.5px solid var(--color-ink);');
    expect(ring).toContain('outline: var(--focus-ring-width) solid var(--focus-ring-color);');
  });

  it("writes no segment rule of its own: date-range-picker.css's are shared", () => {
    expect(rules()).not.toMatch(/(?:^|[},]\s*)\.date-segment/);
    expect(rules()).not.toContain('.date-segment[data-placeholder]');
    const input = blockAfter(rules(), '.date-picker-input {');
    expect(input).toContain('font-variant-numeric: tabular-nums;');
    expect(input).toContain('white-space: nowrap;');
  });

  it('pads the face as a segment, cut short on one line, and draws the disabled segments and face taupe', () => {
    const face = blockAfter(rules(), '.date-picker-face {');
    for (const declaration of [
      'min-inline-size: 0;',
      'padding-inline: 0.125rem;',
      'overflow: hidden;',
      'color: var(--color-ink);',
      'text-overflow: ellipsis;',
      'white-space: nowrap;',
    ]) {
      expect(face, declaration).toContain(declaration);
    }
    expect(
      blockAfter(rules(), '.date-picker[data-disabled] :is(.date-segment, .date-picker-face) {'),
    ).toContain('color: var(--color-taupe);');
  });

  it("sizes the popover as the range picker's: the month's width, padded 16px", () => {
    const popover = blockAfter(rules(), '.date-picker-popover.popover-padded {');
    expect(popover).toContain('width: calc(7 * var(--size-control) + 2 * var(--spacing-inset) + 2px);');
    expect(popover).toContain('padding: var(--spacing-inset);');
  });

  it("draws no corner of its own: the button is the shared field button and the calendar keeps Calendar's shapes", () => {
    const css = rules();
    // The days' circles and the presets' pills are calendar.css's, as in Calendar and DateRangePicker, and the
    // button's corner is input.css's, as in every framed field.
    expect(css).not.toContain('border-radius');
    expect(css).not.toContain('--holder-');
    expect(css).not.toMatch(/\.date-picker-button\s*\{/);
    expect(css).not.toMatch(/\.calendar(?:-presets|-preset|-day-number)?\b/);
  });

  it('draws the disabled segments and face graytext in forced colors', () => {
    const forced = blockAfter(rules(), FORCED_COLORS);
    expect(
      blockAfter(forced, '.date-picker[data-disabled] :is(.date-segment, .date-picker-face) {'),
    ).toContain('color: graytext;');
  });
});

describe('the changed dot, in each framed field', () => {
  const rules = (file) => closeUp(stripComments(read(`src/components/${file}`)));
  // A part step before a 36px field button 6px in, and the frame's end padding grown by the dot and a part step.
  const PAST_BUTTON = 'calc(0.375rem + 2.25rem + var(--spacing-part))';
  const GROWN = 'calc(3rem + 0.375rem + var(--spacing-part))';

  it("pads a text input and a text area, which are their own frames, clear of the dot at their text's end", () => {
    // The mark's default place is 1.5rem in, the text's own padding (field.css).
    const rule = blockAfter(
      rules('input.css'),
      '.field[data-changed][data-unlabelled] > :is(input, textarea).input {',
    );
    expect(rule).toContain('padding-inline-end: calc(1.5rem + 0.375rem + var(--spacing-part));');
  });

  it.each([
    ['combo-box.css', '.combo-box', '.combo-box-input'],
    ['multi-select.css', '.multi-select', '.multi-select-control'],
    ['date-range-picker.css', '.date-range-picker', '.date-range-control'],
    ['date-picker.css', '.date-picker', '.date-picker-control'],
  ])('%s places the dot before the field button and pads its frame clear of it', (file, field, frame) => {
    const css = rules(file);
    expect(blockAfter(css, `${field}[data-changed][data-unlabelled] {`)).toContain(
      `--field-changed-mark-end: ${PAST_BUTTON};`,
    );
    expect(blockAfter(css, `${field}[data-changed][data-unlabelled] ${frame} {`)).toContain(
      `padding-inline-end: ${GROWN};`,
    );
  });

  it.each([
    ['combo-box.css', '.combo-box', '.combo-box-input'],
    ['multi-select.css', '.multi-select', '.multi-select-control'],
  ])('%s moves the dot before the Spinner while options load', (file, field, frame) => {
    const css = rules(file);
    expect(blockAfter(css, `${field}[data-changed][data-unlabelled][data-loading] {`)).toContain(
      '--field-changed-mark-end: 4.5rem;',
    );
    expect(blockAfter(css, `${field}[data-changed][data-unlabelled][data-loading] ${frame} {`)).toContain(
      'padding-inline-end: calc(4.5rem + 0.375rem + var(--spacing-part));',
    );
  });

  it('places the dot past the steppers and an end symbol in a number field, and the figure stops short of it', () => {
    const css = rules('number-field.css');
    const changed = blockAfter(css, '.number-field[data-changed][data-unlabelled] {');
    expect(changed).toContain('--number-field-mark: calc(0.375rem + var(--spacing-part));');
    expect(changed).toContain(
      '--field-changed-mark-end: calc(var(--number-field-trail) + var(--number-field-symbol-end));',
    );
    expect(blockAfter(css, '.number-field {')).toContain('--number-field-mark: 0px;');
    // At the figure's end in either direction: the trail side of both padding rules adds the mark.
    const trail =
      'calc(var(--number-field-trail) + var(--number-field-symbol-end) + var(--number-field-mark))';
    expect(blockAfter(css, '.number-field-input {')).toContain(trail);
    expect(blockAfter(css, "[dir='rtl'] .number-field-input {")).toContain(trail);
  });

  it("places the dot before a select's chevron, which keeps the value clear of it", () => {
    const css = rules('select.css');
    expect(blockAfter(css, '.select[data-changed][data-unlabelled] {')).toContain(
      '--field-changed-mark-end: calc(1rem + 16px + var(--spacing-part));',
    );
    expect(blockAfter(css, '.select[data-changed][data-unlabelled] .select-chevron {')).toContain(
      'margin-inline-start: calc(0.375rem + var(--spacing-part));',
    );
  });
});

describe('src/components/save-bar.css', () => {
  // The rules without their comments, with their whitespace closed up.
  const rules = () => closeUp(stripComments(read('src/components/save-bar.css')));
  const FORCED = '@media (forced-colors: active)';
  const OFFSET =
    '--save-bar-offset: calc(var(--size-control) + 2 * var(--spacing-part) + 2px + var(--spacing-inset));';

  it('draws the bar on the float surface with the frame edge, the surface radius and the float shadow', () => {
    const bar = blockAfter(outsideForcedColors(rules()), '.save-bar {');
    for (const declaration of [
      '--holder-radius: var(--radius-surface);',
      '--holder-border: 1px;',
      '--holder-pad: var(--spacing-part);',
      'border: var(--holder-border) solid var(--color-frame);',
      'border-radius: var(--holder-radius);',
      'background-color: var(--color-float);',
      'box-shadow: var(--shadow-float);',
      'color: var(--color-ink);',
      'padding-block: var(--holder-pad);',
      'margin-block-start: var(--spacing-peer);',
      'box-sizing: border-box;',
    ]) {
      expect(bar, declaration).toContain(declaration);
    }
  });

  it("sticks to the bottom above the tab bar reserve, one layer under the header token, as the bulk bar's", () => {
    const bar = blockAfter(outsideForcedColors(rules()), '.save-bar {');
    const table = closeUp(stripComments(read('src/components/data-table.css')));
    const bulk = blockAfter(outsideForcedColors(table), '.data-table-bar {');
    for (const declaration of [
      'position: sticky;',
      'inset-block-end: calc(var(--app-shell-inset-block-end, 0px) + var(--spacing-inset));',
      'z-index: calc(var(--z-header) - 1);',
    ]) {
      expect(bar, declaration).toContain(declaration);
      expect(bulk, declaration).toContain(declaration);
    }
  });

  it("insets the buttons to the corner inset on both sides, so a pill keeps its own round, as the bulk bar's", () => {
    const css = rules();
    const bar = blockAfter(css, '.save-bar {');
    const table = closeUp(stripComments(read('src/components/data-table.css')));
    const bulk = blockAfter(outsideForcedColors(table), '.data-table-bar {');
    // A single row: each side at least the corner inset, the surface radius less the edge, from the inner edge,
    // the action at the inline end and the first button of a line of actions at the start, outside the curve in
    // every shape and in either direction, since the shorthand is logical. The start never under the inset step.
    for (const declaration of [
      '--holder-corner-inset: max(var(--holder-pad), calc(var(--holder-radius) - var(--holder-border)));',
      'padding-inline: max(var(--spacing-inset), var(--holder-corner-inset)) var(--holder-corner-inset);',
    ]) {
      expect(bar, declaration).toContain(declaration);
      expect(bulk, declaration).toContain(declaration);
    }
    expect(bar).not.toMatch(/padding-(left|right)|padding-inline-(start|end):/);
    // No margin of the actions makes up for a start side that falls short.
    expect(css).not.toMatch(/margin-inline-start: max\(/);
    // No button's corner is made to follow the bar's: no radius but the bar's own is written.
    const radii = [...css.matchAll(/(?<![\w-])border-radius:\s*([^;]+);/g)].map((match) => match[1]);
    expect(radii).toEqual(['var(--holder-radius)']);
  });

  it('lays the text, the status and the actions out in one row, the message clamped to two lines', () => {
    const css = rules();
    const bar = blockAfter(css, '.save-bar {');
    for (const declaration of [
      'container: save-bar / inline-size;',
      'display: flex;',
      'flex-wrap: wrap;',
      'align-items: center;',
      'gap: var(--spacing-part);',
    ]) {
      expect(bar, declaration).toContain(declaration);
    }
    const text = blockAfter(css, '.save-bar-text {');
    expect(text).toContain('flex: 1 1 12rem;');
    expect(text).toContain('min-width: 0;');
    const message = blockAfter(css, '.save-bar-message {');
    for (const declaration of [
      'display: -webkit-box;',
      'overflow: hidden;',
      '-webkit-box-orient: vertical;',
      '-webkit-line-clamp: 2;',
      'overflow-wrap: anywhere;',
      'font-size: var(--text-small);',
      'font-weight: var(--text-small--font-weight);',
      'color: var(--color-ink);',
    ]) {
      expect(message, declaration).toContain(declaration);
    }
    const actions = blockAfter(css, '.save-bar-actions {');
    expect(actions).toContain('margin-inline-start: auto;');
    expect(actions).toContain('justify-content: flex-end;');
    expect(css).not.toMatch(/font-weight:\s*600/);
  });

  it('puts the actions on a line of their own under 36rem, side by side and growing, never stacked', () => {
    const css = rules();
    const narrow = blockAfter(css, '@container save-bar (width < 36rem)');
    expect(blockAfter(narrow, '.save-bar-actions {')).toContain('flex: 1 1 100%;');
    expect(blockAfter(narrow, '.save-bar-actions > .button {')).toContain('flex: 1 1 auto;');
    // No column: the buttons keep DOM order along the line and wrap only when a label is too long for it.
    for (const actions of [
      blockAfter(css, '.save-bar-actions {'),
      blockAfter(narrow, '.save-bar-actions {'),
    ]) {
      expect(actions).not.toMatch(/flex-direction/);
    }
    expect(blockAfter(css, '.save-bar-actions {')).toContain('flex-wrap: wrap;');
    // A label longer than the bar wraps inside its button rather than push the page sideways.
    const button = blockAfter(css, '.save-bar-actions > .button {');
    expect(button).toContain('white-space: normal;');
    expect(button).toContain('max-width: 100%;');
    // The one container width, no viewport query: the bar answers to its own box.
    expect(
      [...css.matchAll(/@container save-bar \(width < ([\d.]+rem)\)/g)].map((match) => match[1]),
    ).toEqual(['36rem']);
    expect(css).not.toMatch(/@media \(width/);
  });

  it('draws the status slate at the small step, error with its 16px icon, and clips the host while empty', () => {
    const css = rules();
    const status = blockAfter(css, '.save-bar-status {');
    expect(status).toContain('font-size: var(--text-small);');
    expect(status).toContain('color: var(--color-slate);');
    expect(blockAfter(css, ".save-bar-status[data-tone='error'] {")).toContain('color: var(--color-error);');
    const icon = blockAfter(css, '.save-bar-status svg {');
    expect(icon).toContain('width: 1rem;');
    expect(icon).toContain('height: 1rem;');
    const empty = blockAfter(css, '.save-bar-status:empty {');
    for (const declaration of ['position: absolute;', 'overflow: hidden;', 'clip-path: inset(50%);']) {
      expect(empty, declaration).toContain(declaration);
    }
    expect(empty).not.toMatch(/display\s*:\s*none|visibility\s*:\s*hidden/);
  });

  it('declares --save-bar-offset from tokens on the root and the shell while a bar is on the page', () => {
    expect(blockAfter(rules(), ':root:has(.save-bar), .app-shell:has(.save-bar) {')).toContain(OFFSET);
  });

  it("never pads the root's scroll, which moved the page when focus landed on the stuck bar (spec correction 121)", () => {
    expect(rules()).not.toContain('scroll-padding');
  });

  it("holds the page's sticky offset and the focus gap in the bar's scroll margin, for its scroll clear to read", () => {
    expect(blockAfter(outsideForcedColors(rules()), '.save-bar {')).toContain(
      'scroll-margin-block: var(--page-sticky-top, 0px) var(--spacing-inset);',
    );
  });

  it("redraws the edge in the reader's text color in forced colors", () => {
    expect(blockAfter(blockAfter(rules(), FORCED), '.save-bar {')).toContain('border-color: canvastext;');
  });
});

describe('src/components/page-header.css', () => {
  // The rules without their comments, with their whitespace closed up.
  const rules = () => closeUp(stripComments(read('src/components/page-header.css')));
  const FORCED = '@media (forced-colors: active)';
  const SUPPORTS = '@supports (backdrop-filter: blur(1px))';

  it('draws the page column the page width wide, its padding inside, centered past it', () => {
    const column = blockAfter(rules(), '.page-column {');
    for (const declaration of [
      'box-sizing: border-box;',
      'inline-size: 100%;',
      'max-inline-size: var(--container-page);',
      'margin-inline: auto;',
      'padding-inline: var(--spacing-separate);',
    ]) {
      expect(column, declaration).toContain(declaration);
    }
  });

  it('gives a column inside a column no second cap and no second padding', () => {
    const nested = blockAfter(rules(), '.page-column .page-column {');
    expect(nested).toContain('max-inline-size: none;');
    expect(nested).toContain('padding-inline: 0;');
  });

  it("lays the header's row out as the docs header: a wrapping row, the titles and the actions at the end", () => {
    const css = rules();
    const row = blockAfter(css, '.page-header-row {');
    for (const declaration of [
      '--page-header-gap: var(--spacing-peer);',
      'display: flex;',
      'flex-wrap: wrap;',
      'align-items: flex-end;',
      'justify-content: space-between;',
      ' gap: var(--page-header-gap);',
      // The docs header's 32px top and, where the docs wrote 20px, the peer step beneath.
      'padding-block: var(--spacing-separate) var(--spacing-peer);',
    ]) {
      expect(row, declaration).toContain(declaration);
    }
    const titles = blockAfter(css, '.page-header-titles {');
    expect(titles).toContain('display: grid;');
    expect(titles).toContain('gap: var(--spacing-part);');
    expect(titles).toContain('min-width: 0;');
    // A long crumb ellipsizes rather than hold the column open past the page.
    expect(titles).toContain('grid-template-columns: minmax(0, 1fr);');
    const actions = blockAfter(css, '.page-header-actions {');
    expect(actions).toContain('flex-wrap: wrap;');
    expect(actions).toContain('gap: var(--spacing-part);');
  });

  it('wraps the actions only when the title would keep less than 20rem, whatever the trail or the sentence hold', () => {
    const css = rules();
    // A definite basis: the titles' content never decides the line, and the actions never shrink.
    expect(blockAfter(css, '.page-header-titles {')).toContain('flex: 1 1 20rem;');
    expect(blockAfter(css, '.page-header-actions {')).toContain('flex: none;');
    // A long trail adds nothing to the titles' width, nor to a holder that sizes the header from its content.
    expect(blockAfter(css, '.page-header-titles > .breadcrumbs {')).toContain('contain: inline-size;');
    // The sentence takes its own line under the title's and the actions', a part step under the title.
    const detail = blockAfter(css, '.page-header-detail {');
    expect(detail).toContain('flex: 0 0 100%;');
    expect(detail).toContain('margin-block-start: calc(var(--spacing-part) - var(--page-header-gap));');
  });

  it("pads a phone's header and column by the inset, and puts the actions on their own line, at the small breakpoint", async () => {
    const { tokens } = await import('../dist/tokens.js');
    const css = rules();
    const phone = blockAfter(css, `@media (width < ${tokens.breakpoint.sm.value})`);
    expect(blockAfter(phone, '.page-column {')).toContain('padding-inline: var(--spacing-inset);');
    const row = blockAfter(phone, '.page-header-row {');
    expect(row).toContain('padding-block: var(--spacing-inset);');
    expect(row).toContain('--page-header-gap: var(--spacing-inset);');
    expect(blockAfter(phone, '.page-header-actions {')).toContain('flex-basis: 100%;');
    // Every width query is the token.
    for (const [, width] of css.matchAll(/@media \(width [<>]=? (\d+px)\)/g)) {
      expect(width).toBe(tokens.breakpoint.sm.value);
    }
  });

  it('keeps the title at the section step and wrapping, and the description at the field measure', () => {
    const css = rules();
    // The step, its weight and its -2% tracking are heading-2's; the header only lets it wrap.
    expect(css).not.toMatch(/\.page-header-title \{[^}]*(?:font-size|font-weight|letter-spacing)/);
    expect(css).not.toMatch(/text-overflow|line-clamp/);
    expect(blockAfter(css, '.page-header-description {')).toContain(
      'max-inline-size: var(--container-field);',
    );
    expect(css).not.toMatch(/font-weight:\s*600/);
  });

  it('draws no rule beneath it', () => {
    expect(rules()).not.toMatch(/border(?:-block-end|-bottom)?\s*:/);
  });

  it('fills the canvas, and the canvas at 80% under a blur where the blur is supported', () => {
    const css = rules();
    const header = blockAfter(outsideForcedColors(css), '.page-header {');
    expect(header).toContain('background-color: var(--color-canvas);');
    const blurred = blockAfter(blockAfter(css, SUPPORTS), '.page-header {');
    expect(blurred).toContain('background-color: color-mix(in srgb, var(--color-canvas) 80%, transparent);');
    expect(blurred).toContain('backdrop-filter: blur(20px) saturate(140%);');
    // The header sticks only in the shell's header slot, whose wrapper sticks: it has no position of its own.
    expect(css).not.toMatch(/position\s*:/);
    expect(css).not.toMatch(/z-index\s*:/);
  });

  it('fills the canvas whole, with no blur, for a reader who asks for less transparency or more contrast', () => {
    const css = rules();
    const query = '@media (prefers-reduced-transparency: reduce), (prefers-contrast: more)';
    const header = blockAfter(blockAfter(css, query), '.page-header {');
    expect(header).toContain('background-color: var(--color-canvas);');
    expect(header).toContain('backdrop-filter: none;');
    // After the blur, so it wins over it.
    expect(css.indexOf(query)).toBeGreaterThan(css.indexOf(SUPPORTS));
  });

  it("draws the system's background color with no blur in forced colors", () => {
    const header = blockAfter(blockAfter(rules(), FORCED), '.page-header {');
    expect(header).toContain('background-color: canvas;');
    expect(header).toContain('backdrop-filter: none;');
  });
});

describe('src/components/breadcrumbs.css', () => {
  // The rules without their comments, with their whitespace closed up.
  const rules = () => closeUp(stripComments(read('src/components/breadcrumbs.css')));
  const FORCED = '@media (forced-colors: active)';
  const CURRENT = ":is(.breadcrumbs-current, .breadcrumbs-item > [aria-current='page'])";

  it('sets the trail at the small step, 450, in slate, with the links slate and underlined', () => {
    const css = rules();
    const trail = blockAfter(css, '.breadcrumbs {');
    for (const declaration of [
      'font-size: var(--text-small);',
      'line-height: var(--text-small--line-height);',
      'font-weight: var(--text-small--font-weight);',
      'color: var(--color-slate);',
    ]) {
      expect(trail, declaration).toContain(declaration);
    }
    // Slate, not link blue: a trail is navigation. Link's own underline stays, carried onto the text's box.
    expect(blockAfter(outsideForcedColors(css), '.breadcrumbs-link {')).toContain(
      'color: var(--color-slate);',
    );
    expect(blockAfter(css, '.breadcrumbs-link .breadcrumbs-text {')).toContain('text-decoration: inherit;');
    expect(css).not.toMatch(/text-decoration(?:-line)?:\s*none/);
    expect(css).not.toContain('--color-link');
  });

  it('narrows past what it holds, so a long crumb ellipsizes rather than hold its holder open', () => {
    const trail = blockAfter(rules(), '.breadcrumbs {');
    expect(trail).toContain('display: grid;');
    expect(trail).toContain('grid-template-columns: minmax(0, 1fr);');
  });

  it('turns a link ink on hover, only where hover exists', () => {
    const css = rules();
    expect(blockAfter(css, '@media (hover: hover)')).toContain('color: var(--color-ink);');
    const outside = css.replace(/@media \(hover: hover\) \{(?:[^{}]*\{[^{}]*\})*[^{}]*\}/g, '');
    expect(outside).not.toMatch(/:hover/);
  });

  it('draws the current page, by its state as well as its class, in ink at 500, not underlined and never cut', () => {
    const css = outsideForcedColors(rules());
    const current = blockAfter(css, `${CURRENT} {`);
    expect(current).toContain('color: var(--color-ink);');
    expect(current).toContain('font-weight: 500;');
    // It wraps, at any character, rather than ellipsize.
    const text = blockAfter(css, `${CURRENT} .breadcrumbs-text {`);
    for (const declaration of [
      'max-inline-size: none;',
      'overflow: visible;',
      'white-space: normal;',
      'overflow-wrap: anywhere;',
    ]) {
      expect(text, declaration).toContain(declaration);
    }
    expect(rules()).not.toMatch(/font-weight:\s*600/);
  });

  it('draws 16px slate separators a part step either side, none after the last, mirrored with the back chevron', () => {
    const css = rules();
    expect(blockAfter(css, '.breadcrumbs-separator {')).toContain('margin-inline: var(--spacing-part);');
    expect(blockAfter(css, '.breadcrumbs-item:last-child > .breadcrumbs-separator {')).toContain(
      'display: none;',
    );
    const icon = blockAfter(css, '.breadcrumbs-separator svg, .breadcrumbs-back-icon {');
    expect(icon).toContain('width: 1rem;');
    expect(icon).toContain('height: 1rem;');
    expect(
      blockAfter(css, "[dir='rtl'] .breadcrumbs-separator svg, [dir='rtl'] .breadcrumbs-back-icon {"),
    ).toContain('scale: -1 1;');
  });

  it("ellipsizes a link's text past 16rem, on one line, and shows it whole while the link has keyboard focus", () => {
    const css = rules();
    const text = blockAfter(css, '.breadcrumbs-text {');
    for (const declaration of [
      'max-inline-size: 16rem;',
      'overflow: hidden;',
      'text-overflow: ellipsis;',
      'white-space: nowrap;',
    ]) {
      expect(text, declaration).toContain(declaration);
    }
    expect(
      blockAfter(css, '.breadcrumbs-link:is(:focus-visible, [data-focus-visible]) .breadcrumbs-text {'),
    ).toContain('max-inline-size: none;');
  });

  it('hits each link at 40px tall through ::after, the shared formula', () => {
    const css = rules();
    expect(blockAfter(outsideForcedColors(css), '.breadcrumbs-link {')).toContain('position: relative;');
    const hit = blockAfter(css, '.breadcrumbs-link::after {');
    for (const declaration of [
      "content: '';",
      'position: absolute;',
      'inset-block: min(0px, calc((100% - var(--size-target)) / 2));',
      'inset-inline: 0;',
    ]) {
      expect(hit, declaration).toContain(declaration);
    }
    // Wrapped lines sit a target apart, so the hit areas of two lines meet and never overlap.
    expect(blockAfter(css, '.breadcrumbs-list {')).toContain('row-gap: calc(var(--size-target) - 1lh);');
  });

  it("hides the phone face's chevron and words over the small breakpoint", () => {
    expect(blockAfter(rules(), '.breadcrumbs-back-icon, .breadcrumbs-back-words {')).toContain(
      'display: none;',
    );
  });

  it("draws only the parent's link under the small breakpoint, written out, its words said but not shown", async () => {
    const { tokens } = await import('../dist/tokens.js');
    const css = rules();
    const narrow = blockAfter(css, `@media (width < ${tokens.breakpoint.sm.value})`);
    // Every crumb but the parent, the landmark with no parent's link, and the parent's separator.
    expect(
      blockAfter(
        narrow,
        '.breadcrumbs-item:not(:nth-last-child(2)), .breadcrumbs:not(:has(.breadcrumbs-item:nth-last-child(2) > .breadcrumbs-link)), .breadcrumbs-item:nth-last-child(2) > .breadcrumbs-separator {',
      ),
    ).toContain('display: none;');
    expect(blockAfter(narrow, '.breadcrumbs-item:nth-last-child(2) .breadcrumbs-back-icon {')).toContain(
      'display: block;',
    );
    const words = blockAfter(narrow, '.breadcrumbs-item:nth-last-child(2) .breadcrumbs-back-words {');
    for (const declaration of [
      'position: absolute;',
      'display: block;',
      'width: 1px;',
      'height: 1px;',
      'overflow: hidden;',
      'clip-path: inset(50%);',
      // Its spaces are part of the name: "Back to " and the text.
      'white-space: pre;',
    ]) {
      expect(words, declaration).toContain(declaration);
    }
    // The one link on its line runs to the line's end.
    expect(blockAfter(narrow, '.breadcrumbs-item:nth-last-child(2) .breadcrumbs-text {')).toContain(
      'max-inline-size: none;',
    );
    for (const [, width] of css.matchAll(/@media \(width [<>]=? (\d+px)\)/g)) {
      expect(width).toBe(tokens.breakpoint.sm.value);
    }
  });

  it("draws the links in the reader's link color and the rest in their text color in forced colors", () => {
    const forced = blockAfter(rules(), FORCED);
    expect(blockAfter(forced, '.breadcrumbs-link {')).toContain('color: linktext;');
    expect(blockAfter(forced, `${CURRENT}, .breadcrumbs-separator {`)).toContain('color: canvastext;');
  });
});

describe('src/components/copy-button.css', () => {
  // The rules without their comments, with their whitespace closed up.
  const rules = () => closeUp(stripComments(read('src/components/copy-button.css')));
  const CHECK = ".copy-button[data-outcome='copied'] .copy-button-glyph[data-glyph='check']";
  const HIDDEN =
    ".copy-button-glyph[data-glyph='check'], .copy-button[data-outcome='copied'] .copy-button-glyph[data-glyph='copy'] {";

  it('clips the status host and the copy command source, out of the flow and out of sight', () => {
    const css = rules();
    const clip = blockAfter(css, '.copy-button-status, .copy-button-source {');
    for (const declaration of [
      'position: absolute;',
      'inline-size: 1px;',
      'block-size: 1px;',
      'overflow: hidden;',
      'clip-path: inset(50%);',
    ]) {
      expect(clip, declaration).toContain(declaration);
    }
    // Never display: none or visibility: hidden, which would hide the status from a screen reader too.
    expect(css).not.toMatch(/\.copy-button-status[^{]*\{[^}]*(display: none|visibility: hidden)/);
    // The root holds the status, so the clipped box is placed against it.
    expect(blockAfter(css, '.copy-button {')).toContain('position: relative;');
    // The source is selectable whatever the page says, and keeps the value's spaces and lines.
    const source = blockAfter(css, '} .copy-button-source {');
    expect(source).toContain('user-select: text;');
    expect(source).toContain('white-space: pre;');
  });

  it('shows the check only while copied, in ink', () => {
    const css = rules();
    expect(blockAfter(css, HIDDEN)).toContain('display: none;');
    const check = blockAfter(outsideForcedColors(css), `${CHECK} {`);
    expect(check).toContain('display: inline-flex;');
    expect(check).toContain('color: var(--color-ink);');
    // A copy is not a save: no success or gain color anywhere, and no error color for a failure, which says its
    // words instead.
    expect(css).not.toMatch(/--color-(success|gain|error|signal|clay)/);
  });

  it('has a forced-colors block and no transition', () => {
    const source = read('src/components/copy-button.css');
    expect(blockAfter(closeUp(stripComments(source)), FORCED_COLORS)).toContain(
      `${CHECK} { color: buttontext; }`,
    );
    expect(stripComments(source)).not.toMatch(/\b(transition|animation)\s*:/);
  });

  it('draws the word look glyph at 16px, as the filter bar draws its button icon', () => {
    const glyph = blockAfter(rules(), ".copy-button[data-look='button'] .copy-button-glyph svg {");
    expect(glyph).toContain('inline-size: 16px;');
    expect(glyph).toContain('block-size: 16px;');
  });
});

describe('src/components/field-extras.css, the offers', () => {
  // The rules without their comments, with their whitespace closed up.
  const rules = () => closeUp(stripComments(read('src/components/field-extras.css')));

  it("caps a field's extras at the field's measure and lifts it for a group", () => {
    const css = rules();
    const extras = blockAfter(css, '.field-extras {');
    expect(extras).toContain('display: grid;');
    expect(extras).toContain('gap: var(--spacing-part);');
    expect(extras).toContain('max-inline-size: var(--container-field);');
    // A grid item's min-content width never pushes a 320px page sideways.
    expect(extras).toContain('min-inline-size: 0;');
    expect(blockAfter(css, ".field-extras[data-scope='group'] {")).toContain('max-inline-size: none;');
  });

  it('draws the offer at the small step in slate, never clay, taupe or signal', () => {
    const css = rules();
    const line = blockAfter(css, '.field-offer {');
    for (const declaration of [
      'display: flex;',
      'flex-wrap: wrap;',
      'align-items: baseline;',
      'column-gap: var(--spacing-part);',
      'margin: 0;',
      'font-size: var(--text-small);',
      'line-height: var(--text-small--line-height);',
      'font-weight: var(--text-small--font-weight);',
      'color: var(--color-slate);',
    ]) {
      expect(line, declaration).toContain(declaration);
    }
    // An offer is not unsaved work, not consent, not a good outcome, not an error and not a placeholder.
    expect(css).not.toMatch(/--color-(clay|signal|success|gain|error|info|taupe)/);
  });

  it('breaks only a word wider than the line, so a long value never pushes the page and a figure stays whole', () => {
    const css = rules();
    const text = blockAfter(css, '.field-offer-text {');
    expect(text).toContain('min-inline-size: 0;');
    // break-word, unlike anywhere, keeps the longest word as the line's narrowest, so a holder sized by its
    // content never squeezes a figure into two (the Badge lesson); the wrapper's column is its width where that is
    // known, so a word wider than the page still breaks inside it. A zero minimum on the line instead would let
    // a content-sized holder squeeze the whole wrapper to nothing.
    expect(text).toContain('overflow-wrap: break-word;');
    expect(css).not.toContain('overflow-wrap: anywhere;');
    expect(blockAfter(css, '.field-extras {')).toContain('grid-template-columns: 100%;');
    expect(blockAfter(css, '.field-offer {')).not.toContain('min-inline-size');
  });

  it('levels the button with the line', () => {
    expect(blockAfter(rules(), '.field-offer-button {')).toContain(
      'margin-block: min(0px, calc((1lh - var(--size-control)) / 2));',
    );
  });

  it('clips the status host, out of the flow and out of sight', () => {
    const css = rules();
    const clip = blockAfter(css, '.field-extras-status {');
    for (const declaration of [
      'position: absolute;',
      'inline-size: 1px;',
      'block-size: 1px;',
      'overflow: hidden;',
      'clip-path: inset(50%);',
      'white-space: nowrap;',
    ]) {
      expect(clip, declaration).toContain(declaration);
    }
    expect(css).not.toMatch(/\.field-extras-status[^{]*\{[^}]*(display: none|visibility: hidden)/);
    // The status is placed absolutely in the wrapper's grid, so it names both its lines on both axes (lesson 9).
    expect(clip).toContain('grid-area: 1 / 1 / span 1 / span 1;');
  });

  it('has a forced-colors block, no transition and no physical side', () => {
    const source = stripComments(read('src/components/field-extras.css'));
    expect(source).toContain(FORCED_COLORS);
    expect(source).not.toMatch(/\b(transition|animation)\s*:/);
    expect(source).not.toMatch(/\b(left|right|top|bottom)\s*:|(margin|padding)-(left|right|top|bottom)/);
  });
});

describe('src/components/field-extras.css', () => {
  // The rules without their comments, with their whitespace closed up.
  const rules = () => closeUp(stripComments(read('src/components/field-extras.css')));

  it('resets the conditional fieldset and spaces it from --conditional-fields-gap', () => {
    const group = blockAfter(outsideForcedColors(rules()), '.conditional-fields {');
    for (const declaration of [
      'display: grid;',
      'gap: var(--conditional-fields-gap, var(--spacing-peer));',
      // A fieldset's min-content width would otherwise hold a long field wider than a 320px page.
      'min-inline-size: 0;',
      'margin: 0;',
      'padding: 0;',
      'border: 0;',
    ]) {
      expect(group, declaration).toContain(declaration);
    }
    // No indent: the fields line up with the gate, and nothing dims them.
    expect(group).not.toMatch(/padding-inline|margin-inline|opacity/);
  });

  it('hides [hidden] by its own rule', () => {
    expect(blockAfter(rules(), '.conditional-fields[hidden], .conditional-fields[data-hidden] {')).toContain(
      'display: none;',
    );
  });

  it('names no .field selector, so its classes are roots', () => {
    // Prose's generated guard takes a class that extends another class of its file as a sub-part; `field-extras`
    // and `field-offer` would extend `field` (lesson 12).
    expect(stripComments(read('src/components/field-extras.css'))).not.toMatch(/\.field(?![-\w])/);
  });

  it('has a forced-colors block, and no transition or animation', () => {
    const source = read('src/components/field-extras.css');
    expect(blockAfter(closeUp(stripComments(source)), FORCED_COLORS)).toContain(
      '.conditional-fields { border: 0; }',
    );
    expect(stripComments(source)).not.toMatch(/\b(transition|animation)\s*:/);
  });
});

describe('src/components/repeater.css', () => {
  // The rules without their comments, with their whitespace closed up.
  const rules = () => closeUp(stripComments(read('src/components/repeater.css')));
  const QUERY = '@container repeater-row-fields (inline-size >= 30rem) {';

  it('resets the fieldsets so a 320px page does not scroll', () => {
    const sets = blockAfter(rules(), '.repeater, .repeater-row-set {');
    for (const declaration of [
      'min-inline-size: 0;',
      'margin: 0;',
      'padding: 0;',
      'border: 0;',
      'display: grid;',
    ]) {
      expect(sets, declaration).toContain(declaration);
    }
    // A floated legend is not the fieldset's drawn legend, so it is a grid item and takes the gap.
    expect(blockAfter(rules(), '.repeater-legend {')).toContain('float: left;');
    expect(blockAfter(rules(), '.repeater-row-legend {')).toContain('float: left;');
  });

  it('is a size container switching at 30rem, with an intrinsic inline size of 0, through a frame', () => {
    const css = rules();
    const fields = blockAfter(css, '.repeater-row-fields {');
    expect(fields).toContain('container: repeater-row-fields / inline-size;');
    expect(fields).toContain('contain-intrinsic-inline-size: 0;');
    // The query styles the frame inside the container, never the container itself.
    const query = blockAfter(css, QUERY);
    expect(query).toContain('.repeater-row-grid { grid-template-columns: minmax(0, 1fr) auto; }');
    expect(query).not.toContain('.repeater-row-fields');
    expect(query).toContain('flex: 1 1 10rem;');
    // Remove sits level with the fields' controls: past the label row, centred on the field.
    expect(query).toContain(
      'padding-block-start: calc(1lh + var(--spacing-part) + max(0px, calc((var(--size-field) - var(--size-control)) / 2)));',
    );
    expect(blockAfter(css, '.repeater-row-end {')).toContain('line-height: var(--text-h4--line-height);');
  });

  it("keeps Remove's width at the minimum from 30rem, out of sight, and drops it under", () => {
    const css = rules();
    expect(blockAfter(css, '.repeater-remove-space {')).toContain('display: none;');
    const query = blockAfter(css, QUERY);
    expect(blockAfter(query, '.repeater-remove-space {')).toContain('visibility: hidden;');
  });

  it('places the status host absolutely on both axes with span 1', () => {
    const status = blockAfter(rules(), '.repeater-status {');
    for (const declaration of [
      'grid-area: 1 / 1 / span 1 / span 1;',
      'position: absolute;',
      'inline-size: 1px;',
      'block-size: 1px;',
      'overflow: hidden;',
      'clip-path: inset(50%);',
      'white-space: nowrap;',
    ]) {
      expect(status, declaration).toContain(declaration);
    }
    expect(rules()).not.toMatch(/\.repeater-status[^{]*\{[^}]*(display: none|visibility: hidden)/);
    // The status is placed against the set.
    expect(blockAfter(rules(), '.repeater {')).toContain('position: relative;');
  });

  it('rules rows apart with the divider, none above the first or under the last', () => {
    const css = rules();
    expect(blockAfter(css, '.repeater-row + .repeater-row {')).toContain(
      'border-block-start: 1px solid var(--color-divider);',
    );
    expect(blockAfter(css, '.repeater-row {')).toContain('padding-block: var(--spacing-peer);');
    expect(blockAfter(css, '.repeater-row:first-child {')).toContain('padding-block-start: 0;');
    expect(blockAfter(css, '.repeater-row:last-child {')).toContain('padding-block-end: 0;');
    expect(blockAfter(css, '.repeater-rows {')).toContain('list-style: none;');
  });

  it('moves Add by the corner inset in a card, also under a group offer line that is not drawn', () => {
    const css = rules();
    expect(css).toContain(
      ':is(.card, .card > .card-body:last-child, .card > .card-disclosure > .card-fold > .card-body:last-child) > .repeater:last-child > .repeater-foot,',
    );
    expect(css).toContain(
      '> .field-extras:last-child > .repeater:has(+ .field-extras-status) > .repeater-foot {',
    );
  });

  it('draws the count, the full line and the empty line in slate and errors in the error color', () => {
    const css = rules();
    expect(
      blockAfter(css, '.repeater-description, .repeater-empty, .repeater-count, .repeater-full {'),
    ).toContain('color: var(--color-slate);');
    expect(blockAfter(css, '.repeater-error, .repeater-row-error {')).toContain('color: var(--color-error);');
    expect(blockAfter(css, '.repeater-legend {')).toContain('color: var(--color-ink);');
    expect(blockAfter(css, '.repeater-legend {')).toContain('font-weight: var(--text-h4--font-weight);');
    expect(blockAfter(css, '.repeater-row-legend {')).toContain('font-weight: 500;');
    // Never clay (the chip is the field's own), signal, success or taupe.
    expect(css).not.toMatch(/--color-(clay|signal|success|gain|taupe|info)/);
  });

  it('has a forced-colors block and no transition', () => {
    const source = stripComments(read('src/components/repeater.css'));
    expect(source).toContain(FORCED_COLORS);
    expect(blockAfter(closeUp(source), FORCED_COLORS)).toContain('border-block-start-color: canvastext;');
    expect(source).not.toMatch(/\b(transition|animation)\s*:/);
    // Logical sides only. The legends' float is no side: in a grid nothing floats.
    expect(source).not.toMatch(/\b(left|right|top|bottom)\s*:|(margin|padding)-(left|right|top|bottom)/);
  });
});

describe('src/components/panel-layout.css', () => {
  // The rules without their comments, with their whitespace closed up, so a selector Prettier breaks over lines
  // reads as one line.
  const rules = () => closeUp(stripComments(read('src/components/panel-layout.css')));
  const SPLIT = '@container panel-layout (inline-size >= 48rem)';
  const PAIRS = '@container panel-row (inline-size >= 66rem)';
  const PILL = ".panel-nav-link:is([aria-current='page'], [data-default])";

  /** The CSS with every block under `header` taken out. */
  const without = (css, header) => {
    let rest = css;
    for (;;) {
      const start = rest.indexOf(header);
      if (start === -1) return rest;
      const end = rest.indexOf('{', start) + 1 + blockAfter(rest, header).length + 1;
      rest = rest.slice(0, start) + rest.slice(end);
    }
  };

  it('is a size container at 48rem with an intrinsic inline size of 0, through a frame', () => {
    const css = rules();
    const layout = blockAfter(css, '.panel-layout {');
    expect(layout).toContain('container: panel-layout / inline-size;');
    // The library's rule: a stand-in width is also the min-content width, which scrolls a phone page sideways.
    expect(layout).toContain('contain-intrinsic-inline-size: 0;');
    expect(layout).toContain('min-inline-size: 0;');
    // A container query cannot style its own container, so the frame inside it is the grid.
    expect(layout).not.toContain('display: grid');
    const frame = blockAfter(css, '.panel-layout-frame {');
    expect(frame).toContain('display: grid;');
    expect(frame).toContain('grid-template-columns: minmax(0, 1fr);');
    expect(css).toContain(`${SPLIT} {`);
  });

  it('hides the main column at the index and the side column at a section under 48rem', () => {
    const narrow = without(without(outsideForcedColors(rules()), SPLIT), '@media print');
    expect(
      blockAfter(
        narrow,
        ".panel-layout[data-view='index'] .panel-layout-main, .panel-layout[data-view='section'] .panel-layout-side {",
      ),
    ).toContain('display: none;');
    // Back, the descriptions and the chevrons show on the list face.
    expect(blockAfter(narrow, '.panel-layout-back {')).toContain('display: flex;');
    expect(narrow).not.toMatch(/\.panel-layout-back[^{]*\{[^}]*display: none/);
  });

  it('draws 16rem beside the rest from 48rem and hides Back', () => {
    const split = blockAfter(rules(), SPLIT);
    const frame = blockAfter(split, '.panel-layout-frame {');
    expect(frame).toContain('grid-template-columns: 16rem minmax(0, 1fr);');
    expect(frame).toContain('column-gap: var(--spacing-peer);');
    expect(frame).toContain('align-items: start;');
    // The face rule's specificity, after it: it wins without !important.
    expect(
      blockAfter(
        split,
        '.panel-layout[data-view] .panel-layout-side, .panel-layout[data-view] .panel-layout-main {',
      ),
    ).toContain('display: block;');
    expect(blockAfter(split, '.panel-layout-back, .panel-nav-description, .panel-nav-chevron {')).toContain(
      'display: none;',
    );
    expect(rules()).not.toContain('!important');
  });

  it('sticks the nav under --page-sticky-top on the split face', () => {
    const side = blockAfter(blockAfter(rules(), SPLIT), '.panel-layout-side {');
    expect(side).toContain('position: sticky;');
    // A peer step under the sticky header; the side reaches past its column by a focus ring, so its links stand a
    // peer step under it and its scroll clips no ring.
    expect(side).toContain('--panel-layout-ring: calc(var(--focus-ring-width) + var(--focus-ring-offset));');
    expect(side).toContain(
      'inset-block-start: calc(var(--page-sticky-top, 0px) + var(--spacing-peer) - var(--panel-layout-ring));',
    );
    expect(side).toContain('margin: calc(-1 * var(--panel-layout-ring));');
    expect(side).toContain('padding: var(--panel-layout-ring);');
    expect(side).toContain(
      'max-block-size: calc(100dvh - var(--page-sticky-top, 0px) - 2 * var(--spacing-peer) + 2 * var(--panel-layout-ring));',
    );
    expect(side).toContain('overflow-y: auto;');
    // Not sticky on the list face, where the list is the page.
    expect(without(rules(), SPLIT)).not.toContain('position: sticky');
  });

  it('draws the current and default pill inside the split query only', () => {
    const css = outsideForcedColors(rules());
    const pill = blockAfter(blockAfter(css, SPLIT), `${PILL} {`);
    expect(pill).toContain('background-color: var(--color-ink);');
    expect(pill).toContain('color: var(--color-canvas);');
    // On the list face no row is current: a phone's list is a menu of pages, not a place.
    expect(without(css, SPLIT)).not.toMatch(/aria-current|data-default/);
    // The forced-colors pill is inside the split query too.
    const forced = blockAfter(rules(), FORCED_COLORS);
    expect(blockAfter(blockAfter(forced, SPLIT), `${PILL}, ${PILL} .panel-nav-end {`)).toContain(
      'background-color: highlight;',
    );
    expect(without(forced, SPLIT)).not.toMatch(/aria-current|data-default/);
  });

  it('draws the list face rows at the field size with rules between them, and the split rows at the control size', () => {
    const css = outsideForcedColors(rules());
    const narrow = without(css, SPLIT);
    expect(blockAfter(narrow, '.panel-nav-link {')).toContain('min-block-size: var(--size-field);');
    expect(blockAfter(narrow, '.panel-nav-item + .panel-nav-item {')).toContain(
      'border-block-start: 1px solid var(--color-divider);',
    );
    const name = blockAfter(narrow, '.panel-nav-name {');
    expect(name).toContain('font-size: var(--text-action);');
    expect(name).toContain('font-weight: 500;');
    for (const part of ['.panel-nav-description {', '.panel-nav-end {', '} .panel-nav-chevron {']) {
      expect(blockAfter(narrow, part), part).toContain('color: var(--color-slate);');
    }
    const split = blockAfter(css, SPLIT);
    expect(blockAfter(split, '.panel-nav-link {')).toContain('min-block-size: var(--size-control);');
    expect(blockAfter(split, '.panel-nav-item + .panel-nav-item {')).toContain('border-block-start: 0;');
  });

  it('keeps words whole where a holder sizes a lone nav or section by its content, and breaks only a word wider than the line', () => {
    const css = rules();
    // break-word, not anywhere: anywhere lowered the min-content width to one letter, so a flex row or an auto
    // track squeezed a lone PanelNav or PanelSection to a letter a line (the Badge and FieldExtras lesson).
    for (const part of [
      '.panel-nav-name {',
      '.panel-nav-description {',
      '.panel-nav-end {',
      '.panel-section-heading {',
      '.panel-section-description {',
    ]) {
      expect(blockAfter(css, part), part).toContain('overflow-wrap: break-word;');
    }
    // No zero floor on a part that stands alone: it is what let such a holder squeeze it to nothing.
    expect(blockAfter(css, '.panel-nav {')).not.toContain('min-inline-size');
    const section = blockAfter(css, '.panel-section {');
    expect(section).not.toContain('min-inline-size');
    // One column the section's width where that is known, so a word wider than the page still breaks inside it.
    expect(section).toContain('grid-template-columns: 100%;');
    // The end state counts at its whole width in a holder sized by content, so the words beside it stay whole.
    expect(blockAfter(css, '.panel-nav-end {')).toContain('inline-size: max-content;');
    // The text beside it still shrinks in a row of known width, so a word wider than the row breaks.
    expect(blockAfter(css, '.panel-nav-text {')).toContain('min-inline-size: 0;');
  });

  it("makes a nav row concentric with a card's corner, and a pill on the canvas", () => {
    expect(blockAfter(rules(), '.panel-nav-link {')).toContain(
      'border-radius: min(var(--radius-pill), max(0px, calc(var(--holder-radius, var(--radius-pill)) - var(--holder-border, 0px) - var(--holder-pad, 0px))));',
    );
  });

  it('draws the heading at the h3 step at 500, with no ring when focused by script', () => {
    const css = rules();
    const heading = blockAfter(css, '.panel-section-heading {');
    for (const declaration of [
      'font-size: var(--text-h3);',
      'letter-spacing: var(--text-h3--letter-spacing);',
      'font-weight: 500;',
      'color: var(--color-ink);',
    ]) {
      expect(heading, declaration).toContain(declaration);
    }
    expect(blockAfter(css, '.panel-section-heading:focus:not(:focus-visible) {')).toContain('outline: none;');
    expect(blockAfter(css, '.panel-section-description {')).toContain('color: var(--color-slate);');
    // Weights 400, 450, 500 and 700 only.
    expect(css).not.toMatch(/font-weight: 600/);
  });

  it('pairs PanelRow from 66rem through its grid, keeping heights', () => {
    const css = rules();
    const row = blockAfter(css, '.panel-row {');
    expect(row).toContain('container: panel-row / inline-size;');
    expect(row).toContain('contain-intrinsic-inline-size: 0;');
    expect(row).toContain('min-inline-size: 0;');
    const grid = blockAfter(css, '.panel-row-grid {');
    expect(grid).toContain('display: grid;');
    expect(grid).toContain('gap: var(--spacing-peer);');
    // Cards keep their own heights.
    expect(grid).toContain('align-items: start;');
    const pairs = blockAfter(css, PAIRS);
    expect(blockAfter(pairs, ".panel-row[data-layout='halves'] > .panel-row-grid {")).toContain(
      'grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);',
    );
    expect(blockAfter(pairs, ".panel-row[data-layout='third-two-thirds'] > .panel-row-grid {")).toContain(
      'grid-template-columns: minmax(0, 1fr) minmax(0, 2fr);',
    );
    expect(blockAfter(pairs, ".panel-row[data-layout='two-thirds-third'] > .panel-row-grid {")).toContain(
      'grid-template-columns: minmax(0, 2fr) minmax(0, 1fr);',
    );
  });

  it('mirrors the chevrons in right to left', () => {
    expect(
      blockAfter(rules(), ":where([dir='rtl' i]) :is(.panel-layout-back, .panel-nav-chevron) svg {"),
    ).toContain('scale: -1 1;');
  });

  it('hides the side column and Back in print', () => {
    expect(
      blockAfter(blockAfter(rules(), '@media print'), '.panel-layout-side, .panel-layout-back {'),
    ).toContain('display: none;');
  });

  it('has a forced-colors block and no transition', () => {
    const source = stripComments(read('src/components/panel-layout.css'));
    expect(blockAfter(closeUp(source), FORCED_COLORS)).toContain(
      '.panel-nav-item + .panel-nav-item { border-block-start-color: canvastext; }',
    );
    expect(source).not.toMatch(/\b(transition|animation)\s*:/);
    expect(source).not.toMatch(/\b(left|right|top|bottom)\s*:|(margin|padding)-(left|right|top|bottom)/);
  });
});

describe('src/components/account-menu.css', () => {
  const rules = () => closeUp(stripComments(read('src/components/account-menu.css')));
  const TRIGGER = '.account-menu-trigger {';

  it("is as tall as its two lines or the field size, padded a part step inside its edge, and fills the footer's row", () => {
    const trigger = blockAfter(outsideForcedColors(rules()), TRIGGER);
    for (const declaration of [
      'min-block-size: var(--size-field);',
      'padding: calc(var(--spacing-part) - 1px);',
      'border: 1px solid transparent;',
      'flex: 1 1 auto;',
      'min-inline-size: 0;',
      'color: var(--color-ink);',
      'text-align: start;',
    ]) {
      expect(trigger, declaration).toContain(declaration);
    }
    // No fixed height: a long name or detail grows the row.
    expect(trigger).not.toMatch(/(?:^|[\s;])(?:block-size|height):/);
  });

  it("takes the rail items' corner formula, so its wash follows the rail's curve, and the control corner elsewhere", () => {
    // The rail's corner less the footer's gap, uncapped by the control corner, which in Rounded is less than that
    // and would leave the wash's corner off the rail's center (the concentric audit's finding); outside a rail
    // the two fallbacks give the control corner.
    expect(blockAfter(rules(), TRIGGER)).toContain(
      'border-radius: min(var(--radius-pill), max(0px, calc(var(--sidebar-corner, var(--radius-control)) - var(--sidebar-nav-inset, 0px))));',
    );
    // The same formula as a rail item, read from sidebar.css, with fallbacks for a trigger outside a rail.
    const item = blockAfter(closeUp(stripComments(read('src/components/sidebar.css'))), '.sidebar-item {');
    expect(item).toContain(
      'border-radius: min(var(--radius-pill), max(0px, calc(var(--sidebar-corner) - var(--sidebar-nav-inset))));',
    );
  });

  it('draws the 5% wash on hover, while pressed and while open, and the focus ring', () => {
    const css = rules();
    expect(
      blockAfter(
        css,
        ".account-menu-trigger:is(:hover, [data-hovered], [data-pressed], [aria-expanded='true']) {",
      ),
    ).toContain('background-color: color-mix(in srgb, var(--color-ink) 5%, transparent);');
    const ring = blockAfter(css, '.account-menu-trigger:is(:focus-visible, [data-focus-visible]) {');
    expect(ring).toContain('outline: var(--focus-ring-width) solid var(--focus-ring-color);');
    expect(ring).toContain('outline-offset: var(--focus-ring-offset);');
  });

  it('wraps the name and the detail at any character, the name at the action step and the detail slate', () => {
    const css = rules();
    const name = blockAfter(css, '.account-menu-name {');
    expect(name).toContain('overflow-wrap: anywhere;');
    expect(name).toContain('font-weight: var(--text-action--font-weight);');
    const detail = blockAfter(css, '.account-menu-detail {');
    expect(detail).toContain('overflow-wrap: anywhere;');
    expect(detail).toContain('color: var(--color-slate);');
    expect(detail).toContain('font-weight: var(--text-small--font-weight);');
    expect(blockAfter(css, '.account-menu-text {')).toContain('min-inline-size: 0;');
    // The up-and-down chevron is symmetric and does not mirror.
    expect(blockAfter(css, '.account-menu-chevron {')).toContain('color: var(--color-slate);');
    expect(css).not.toMatch(/account-menu-chevron[^{]*\{[^}]*scale/);
  });

  it('draws the compact face as a control-sized pill, 44px on a coarse pointer', () => {
    const css = rules();
    const compact = blockAfter(outsideForcedColors(css), '.account-menu-trigger[data-compact] {');
    for (const declaration of [
      'inline-size: var(--size-control);',
      'block-size: var(--size-control);',
      'min-block-size: 0;',
      'padding: 0;',
      'border-radius: var(--radius-pill);',
      'flex: none;',
    ]) {
      expect(compact, declaration).toContain(declaration);
    }
    const coarse = blockAfter(
      blockAfter(css, '@media (pointer: coarse)'),
      '.account-menu-trigger[data-compact] {',
    );
    expect(coarse).toContain('inline-size: 44px;');
    expect(coarse).toContain('block-size: 44px;');
  });

  it("caps the menu's width at a phone's", () => {
    expect(blockAfter(rules(), '.account-menu {')).toContain('max-inline-size: min(22rem, 100vw - 2rem);');
  });

  it('gives the open trigger an edge and the detail and chevron the text color in forced colors, with no transition', () => {
    const source = stripComments(read('src/components/account-menu.css'));
    const forced = blockAfter(closeUp(source), FORCED_COLORS);
    expect(blockAfter(forced, ".account-menu-trigger[aria-expanded='true'] {")).toContain(
      'border-color: canvastext;',
    );
    expect(blockAfter(forced, '.account-menu-detail, .account-menu-chevron {')).toContain(
      'color: canvastext;',
    );
    expect(source).not.toMatch(/\b(transition|animation)\s*:/);
    expect(source).not.toMatch(/\b(left|right|top|bottom)\s*:|(margin|padding)-(left|right|top|bottom)/);
  });
});

describe('concentric corners (docs/design-system.md, "Nested radii, derived")', () => {
  const css = (file) => closeUp(stripComments(read(`src/components/${file}`)));
  // The start of the formula: a part may take a further gap of its own after it, as a toast's row does.
  const FORMULA = 'calc(var(--holder-radius) - var(--holder-border) - var(--holder-pad)';
  // How much further in than its padding a control near the holder's corner sits.
  const EXTRA = 'calc(var(--holder-corner-inset) - var(--holder-pad))';

  // Each holder names its corner, its edge and its padding.
  const HOLDERS = [
    ['card.css', '.card {', 'var(--radius-stadium)'],
    ['dialog.css', '.dialog {', 'var(--radius-stadium)'],
    ['drawer.css', '.drawer {', 'var(--radius-stadium)'],
    ['sheet.css', '.sheet {', 'var(--radius-stadium)'],
    ['side-panel.css', '.side-panel {', 'var(--radius-stadium)'],
    ['popover.css', '.popover {', 'var(--radius-surface)'],
    ['command-palette.css', '.command-palette {', 'var(--radius-surface)'],
    ['toast.css', '.toast {', 'var(--radius-surface)'],
    ['data-table.css', '.data-table-bar {', 'var(--radius-surface)'],
    ['tabs.css', '.tab-list {', 'var(--radius-surface)'],
    ['upload-tray.css', '.upload-tray {', 'var(--radius-surface)'],
    ['upload-tray.css', '.upload-tray-bar {', 'var(--radius-pill)'],
    ['save-bar.css', '.save-bar {', 'var(--radius-surface)'],
  ];

  for (const [file = '', header = '', radius = ''] of HOLDERS) {
    it(`names the holder's corner, edge and padding on ${header.slice(0, -2)}`, () => {
      const rule = blockAfter(css(file), header);
      expect(rule).toContain(`--holder-radius: ${radius};`);
      expect(rule).toMatch(/--holder-border: [\d.]+px;/);
      expect(rule).toMatch(/--holder-pad: [^;]+;/);
      expect(rule).toContain(
        '--holder-corner-inset: max(var(--holder-pad), calc(var(--holder-radius) - var(--holder-border)));',
      );
    });
  }

  // A surface, a row or a frame that fills to the holder's edge takes its radius less the gap.
  const FILLS = [
    ['tabs.css', '.tab {'],
    ['stat-tile.css', '.card > .stat-tile, .card-body .stat-tile {'],
    ['select.css', '.select-filter {'],
  ];

  for (const [file = '', header = ''] of FILLS) {
    it(`makes ${header.slice(0, -2)} concentric with its holder in ${file}`, () => {
      expect(blockAfter(css(file), header)).toContain(FORMULA);
    });
  }

  // A control keeps its own shape and moves out of the corner, to the corner inset: the holder's padding or its
  // radius less its edge, whichever is more. Under a content column it moves down, so its end stays on the
  // column's edge; only a single-row holder (the bulk bar, a toast) moves it inward.
  const CLEAR = [
    ['dialog.css', '.dialog {', 'padding: var(--holder-pad) var(--holder-pad) var(--holder-corner-inset);'],
    [
      'side-panel.css',
      '.side-panel-footer {',
      'padding-block: var(--spacing-inset) var(--holder-corner-inset);',
    ],
    ['side-panel.css', '.side-panel-body:last-child {', 'padding-block-end: var(--holder-corner-inset);'],
    ['drawer.css', '.drawer-footer {', 'calc(var(--holder-corner-inset) + env(safe-area-inset-bottom, 0px))'],
    [
      'data-table.css',
      '.data-table-bar {',
      'padding-inline: max(var(--spacing-inset), var(--holder-corner-inset)) var(--holder-corner-inset);',
    ],
    [
      'save-bar.css',
      '.save-bar {',
      'padding-inline: max(var(--spacing-inset), var(--holder-corner-inset)) var(--holder-corner-inset);',
    ],
    [
      'upload-tray.css',
      '.upload-tray-body > .upload-list > .upload-row:last-child {',
      'padding-block-end: max(0.625rem, calc(var(--holder-corner-inset) - var(--holder-pad)));',
    ],
    [
      'charts.css',
      `:is(.card, .card > .card-body:last-child) > ${chartList('')}:last-child ${chartList('toolbar')} {`,
      `margin-block-end: ${EXTRA};`,
    ],
    [
      'description-list.css',
      ":is(.card, .card > .card-body:last-child, .card > .card-disclosure > .card-fold > .card-body:last-child) > .description-list[data-layout='horizontal']:last-child > .description-list-item:last-child:has(> .description-list-actions) {",
      'padding-block-end: calc(var(--description-list-pad) + var(--holder-corner-inset) - var(--holder-pad));',
    ],
    [
      'description-list.css',
      ':is(.card, .card > .card-body:first-child) > .description-list:first-child > .description-list-item:first-child:has(> .description-list-actions) {',
      'padding-block-start: calc(var(--description-list-pad) + var(--holder-corner-inset) - var(--holder-pad));',
    ],
    ['card.css', '.card > .card-header > .card-actions {', `margin-block-start: ${EXTRA};`],
    ['card.css', '.card > .card-header > .card-actions:first-child {', `margin-block-start: ${EXTRA};`],
    [
      'field-extras.css',
      ':is(.card, .card > .card-body:last-child, .card > .card-disclosure > .card-fold > .card-body:last-child) > .field-extras:last-child > .field-offer:last-of-type {',
      'padding-block-end: min(calc((var(--holder-corner-inset) - var(--holder-pad)) * 1000), calc(var(--holder-corner-inset) - var(--holder-pad) + max(0px, calc((var(--size-control) - 1lh) / 2))));',
    ],
    [
      'repeater.css',
      ':is(.card, .card > .card-body:last-child, .card > .card-disclosure > .card-fold > .card-body:last-child) > .repeater:last-child > .repeater-foot,',
      `padding-block-end: ${EXTRA};`,
    ],
    [
      'panel-layout.css',
      ':is(.card, .card > .card-body:first-child) > .panel-layout:first-child > .panel-layout-frame > .panel-layout-main > .panel-layout-back {',
      `margin-block-start: ${EXTRA};`,
    ],
  ];

  it('moves no control inward where a content column stands above it, so a trailing action keeps its edge', () => {
    for (const [file, header] of [
      ['dialog.css', '.dialog-actions {'],
      ['side-panel.css', '.side-panel-footer {'],
      [
        'charts.css',
        `:is(.card, .card > .card-body:last-child) > ${chartList('')}:last-child ${chartList('toolbar')} {`,
      ],
      [
        'description-list.css',
        ":is(.card, .card > .card-body:last-child, .card > .card-disclosure > .card-fold > .card-body:last-child) > .description-list[data-layout='horizontal']:last-child > .description-list-item:last-child:has(> .description-list-actions) {",
      ],
    ]) {
      expect(blockAfter(css(file), header), header).not.toMatch(/(?:padding|margin)-inline[^;]*corner-inset/);
    }
    // The side panel's footer lines up with the body's fields: the same inline margin, the peer step.
    expect(blockAfter(css('side-panel.css'), '.side-panel-footer {')).toContain(
      'margin-inline: var(--spacing-peer);',
    );
  });

  for (const [file = '', header = '', declaration = ''] of CLEAR) {
    it(`keeps the controls in ${header.slice(0, -2)} clear of the corner in ${file}`, () => {
      expect(blockAfter(css(file), header)).toContain(declaration);
    });
  }

  it('gives no control one corner of its own, only a part that fills the holder takes the formula', () => {
    for (const file of components) {
      // A single corner longhand that reads the holder's radius is a control given one smaller corner.
      expect(css(file), file).not.toMatch(
        /border-(?:start|end)-(?:start|end)-radius:[^;]*calc\(var\(--holder-radius/,
      );
      expect(css(file), file).not.toMatch(
        /border-(?:top|bottom)-(?:left|right)-radius:[^;]*calc\(var\(--holder-radius/,
      );
    }
  });

  it('never copies a holder radius onto a part: every read of it subtracts the edge, and every radius the padding too', () => {
    for (const file of components) {
      const source = css(file);
      // A calc that starts from the holder's radius subtracts its edge: the corner inset stops there.
      for (const match of source.matchAll(/calc\(var\(--holder-radius\)[^;]*/g)) {
        expect(match[0], file).toContain('calc(var(--holder-radius) - var(--holder-border)');
      }
      // A radius read from it subtracts the padding as well.
      for (const match of source.matchAll(
        /(?:border(?:-[\w-]+)?-radius|--[\w-]*radius[\w-]*):([^;]*calc\(var\(--holder-radius\)[^;]*);/g,
      )) {
        expect(match[1], file).toContain(FORMULA);
      }
      // The holder's radius is drawn as it is only by the holder that names it.
      for (const match of source.matchAll(
        /([^{}]+)\{([^{}]*border(?:-[\w-]+)?-radius: var\(--holder-radius\)[^{}]*)\}/g,
      )) {
        expect(match[2], `${file} ${match[1].trim()}`).toContain('--holder-radius:');
      }
    }
  });

  it('writes the parts that hold parts on the tokens: a menu row, its key chip and a field button', () => {
    expect(blockAfter(css('menu.css'), '.menu-item {')).toContain(
      '--menu-item-radius: max(0px, calc(var(--radius-surface) - 1px - var(--spacing-part)));',
    );
    expect(blockAfter(css('menu.css'), '.menu-item-shortcut {')).toContain(
      'border-radius: min(var(--radius-micro), max(0px, calc(var(--menu-item-radius) - 0.75rem)));',
    );
    expect(blockAfter(css('input.css'), '.input-button {')).toContain(
      'border-radius: max(0px, calc(var(--input-radius, var(--radius-pill)) - 0.375rem));',
    );
  });
});

describe('src/components/prose.css', () => {
  const css = () => closeUp(stripComments(read('src/components/prose.css')));
  /** The guard every element rule ends with: nothing under not-prose. */
  const GUARD = ':not(:where(.not-prose, .not-prose *))';
  /** An element rule's header: `.prose :where(<inner>)` and the guard. */
  const at = (inner) => `.prose :where(${inner})${GUARD} {`;
  /**
   * A rule on the direct children of the prose box, two classes deep through its last `:not()`, so a gap beats a
   * component root's own `margin: 0` (spec correction 89).
   */
  const child = (inner) => `.prose > :where(${inner})${GUARD}:not(.not-prose) {`;
  /** Every rule block that holds no nested block, as [selector, body]. */
  const blocks = (source) => [...source.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map((m) => [m[1].trim(), m[2]]);
  /** A selector list split at its top-level commas. */
  const splitTop = (list) => {
    const parts = [];
    let depth = 0;
    let start = 0;
    for (let index = 0; index < list.length; index += 1) {
      const char = list[index];
      if (char === '(') depth += 1;
      else if (char === ')') depth -= 1;
      else if (char === ',' && depth === 0) {
        parts.push(list.slice(start, index).trim());
        start = index + 1;
      }
    }
    parts.push(list.slice(start).trim());
    return parts;
  };
  /**
   * An element rule's shape, and a gap's: a gap between the box's own children ends in `:not(.not-prose)` as well,
   * which matches nothing new and makes it two classes deep (spec correction 89).
   */
  const SHAPE =
    /^\.prose (?::where\((.+)\):not\(:where\(\.not-prose, \.not-prose \*\)\)(?:::marker)?|> :where\((.+)\):not\(:where\(\.not-prose, \.not-prose \*\)\):not\(\.not-prose\))$/;
  const expectAll = (body, declarations, label) => {
    for (const declaration of declarations) expect(body, `${label}: ${declaration}`).toContain(declaration);
  };

  it('wraps every element rule in :where() with the not-prose guard', () => {
    const selectors = blocks(css()).flatMap(([selector]) => splitTop(selector));
    expect(selectors.length).toBeGreaterThan(40);
    // The box, the region, the registered measure and the one rule that hands components back.
    const roots = [
      '.prose',
      '.prose-scroll',
      '.prose-scroll:focus-visible',
      '@property --prose-line',
      '.prose :is(.prose-parts)',
      '.prose :is(.prose-parts) *',
      '.prose :is(.prose-parts) *::marker',
    ];
    const unshaped = selectors.filter((selector) => !roots.includes(selector) && !SHAPE.test(selector));
    expect(unshaped).toEqual([]);
  });

  it('never gives a or img a layout property', () => {
    // A model's links and images reach the page as spans (spec 8.10), so nothing may depend on their being there.
    const LAYOUT =
      /^(?:margin|padding|display|position|float|inset|top|right|bottom|left|width|min-width|inline-size|min-inline-size|flex|grid)/;
    const subjects = /(?:^|[\s>+~(])(?:a|img)(?=$|[:.[)\s])/;
    let checked = 0;
    for (const [selector, body] of blocks(css())) {
      for (const one of splitTop(selector)) {
        const shaped = SHAPE.exec(one);
        const inner = shaped?.[1] ?? shaped?.[2];
        if (!inner || !splitTop(inner).some((item) => subjects.test(item))) continue;
        checked += 1;
        const properties = body
          .split(';')
          .map((declaration) => declaration.split(':')[0]?.trim() ?? '')
          .filter(Boolean);
        expect(
          properties.filter((property) => LAYOUT.test(property)),
          one,
        ).toEqual([]);
      }
    }
    // The link, its hover, press and focus, and the framed and sized image rules.
    expect(checked).toBeGreaterThanOrEqual(6);
  });

  it('sets the body at 1.6 and text blocks at one measure, resolved once on the box', () => {
    const source = css();
    expectAll(
      blockAfter(source, at('p, ul, ol, dl, blockquote')),
      ['font-size: var(--text-body);', 'line-height: 1.6;', 'font-weight: var(--text-body--font-weight);'],
      'body',
    );
    expect(
      blockAfter(
        source,
        at('p, li, h1, h2, h3, h4, h5, h6, blockquote, dl, figcaption, [data-footnotes] > *'),
      ),
    ).toBe(' max-inline-size: var(--prose-line); ');
    // A registered length that inherits, so 70ch is computed in the box's own font and a heading shares it.
    expect(blockAfter(source, '@property --prose-line {')).toBe(
      " syntax: '<length> | none'; inherits: true; initial-value: none; ",
    );
    expect(blockAfter(source, '.prose {')).toContain('--prose-line: var(--prose-measure, 70ch);');
    // No measure on a table, a code block, a figure or a rule: they take the whole box.
    for (const [selector, body] of blocks(source)) {
      if (body.includes('--prose-line)')) expect(selector).not.toMatch(/\b(?:table|pre|figure|hr|img)\b/);
    }
    expectAll(
      blockAfter(source, '.prose {'),
      ['color: var(--color-ink);', 'font-family: var(--font-sans);'],
      'root',
    );
  });

  it("spaces blocks from the system's steps: 24, 32 before h1 and h2, 8 after a heading", () => {
    const source = css();
    expect(
      blockAfter(source, at('p, h1, h2, h3, h4, h5, h6, ul, ol, dl, dd, blockquote, figure, pre, hr, table')),
    ).toBe(' margin: 0; ');
    const rhythm = [
      [child('* + *'), 'var(--spacing-peer)'],
      [child('* + :is(h1, h2)'), 'var(--spacing-separate)'],
      [child(':is(h1, h2, h3, h4, h5, h6) + *'), 'var(--spacing-part)'],
      [child('* + hr, hr + *'), 'var(--spacing-separate)'],
    ];
    let previous = -1;
    for (const [header, step] of rhythm) {
      expect(blockAfter(source, header), header).toBe(` margin-block-start: ${step}; `);
      // Each after the one before, so a heading after a heading takes 8px and a rule keeps 32px.
      expect(source.indexOf(header), header).toBeGreaterThan(previous);
      previous = source.indexOf(header);
    }
    expect(blockAfter(source, at('li + li, li > * + *, li > :is(ul, ol), dt + dd, figure > * + *'))).toBe(
      ' margin-block-start: var(--spacing-part); ',
    );
    expect(blockAfter(source, at('blockquote > * + *, [data-footnotes] > * + *'))).toBe(
      ' margin-block-start: var(--spacing-peer); ',
    );
    // Top margins only, so collapsing never decides a gap.
    expect(source).not.toMatch(/margin-block-end|margin-bottom/);
  });

  it('draws headings by the heading steps, h5 and h6 in slate, the h1 at 28px under 768px', () => {
    const source = css();
    for (const [element, step] of [
      ['h1', 'h2'],
      ['h2', 'h3'],
    ]) {
      expectAll(
        blockAfter(source, at(element)),
        [
          `font-size: var(--text-${step});`,
          `line-height: var(--text-${step}--line-height);`,
          `letter-spacing: var(--text-${step}--letter-spacing);`,
          `font-weight: var(--text-${step}--font-weight);`,
        ],
        element,
      );
    }
    expectAll(
      blockAfter(source, at('h3, h4, h5, h6')),
      ['font-size: var(--text-h4);', 'letter-spacing: normal;', 'font-weight: var(--text-h4--font-weight);'],
      'subheads',
    );
    expect(blockAfter(source, at('h5, h6'))).toContain('color: var(--color-slate);');
    expect(blockAfter(blockAfter(source, '@media (width < 768px) {'), at('h1'))).toContain(
      'font-size: 1.75rem;',
    );
    expect(blockAfter(source, at('h1, h2, h3, h4, h5, h6'))).toContain(
      'scroll-margin-block-start: var(--prose-scroll-margin, 0px);',
    );
    expect(blockAfter(source, at('strong, b'))).toContain('font-weight: 700;');
  });

  it("draws links with link.css's values", () => {
    const source = css();
    const link = blockAfter(closeUp(stripComments(read('src/components/link.css'))), '.link {');
    const prose = blockAfter(source, at('a'));
    for (const property of [
      'border-radius',
      'color',
      'text-decoration-line',
      'text-decoration-thickness',
      'text-underline-offset',
      'overflow-wrap',
    ]) {
      const declaration = new RegExp(`(?<![\\w-])${property}: [^;]+;`).exec(link)?.[0];
      expect(declaration, property).toBeDefined();
      expect(prose, property).toContain(declaration);
    }
    expect(blockAfter(blockAfter(source, '@media (hover: hover) {'), at('a:hover'))).toContain(
      'text-decoration-thickness: 2px;',
    );
    expect(blockAfter(source, at('a:active'))).toContain('text-decoration-thickness: 2px;');
    expect(blockAfter(source, at('a:focus-visible'))).toContain(
      'outline: var(--focus-ring-width) solid var(--focus-ring-color);',
    );
  });

  it("draws pre with the docs' code block values and its Shiki mapping", () => {
    const pre = blockAfter(css(), at('pre'));
    expectAll(
      pre,
      [
        'contain: inline-size;',
        'padding: 1.25rem 1.5rem;',
        'overflow-x: auto;',
        'border: 1px solid var(--color-frame);',
        'background-color: var(--color-bone);',
        'color: var(--color-charcoal);',
        'font-family: var(--font-mono);',
        'font-size: 0.875rem;',
        'line-height: 1.7;',
        'tab-size: 2;',
        'white-space: pre;',
        'overflow-wrap: normal;',
      ],
      'pre',
    );
    // The docs' palette for Shiki, with the background the block's own fill, since Shiki writes it on the pre.
    expectAll(
      pre,
      [
        '--shiki-foreground: var(--color-charcoal);',
        '--shiki-background: var(--color-bone);',
        '--shiki-token-keyword: var(--color-link);',
        '--shiki-token-string: var(--color-granite);',
        '--shiki-token-string-expression: var(--color-granite);',
        '--shiki-token-constant: var(--color-ink);',
        '--shiki-token-function: var(--color-ink);',
        '--shiki-token-parameter: var(--color-charcoal);',
        '--shiki-token-comment: var(--color-slate);',
        '--shiki-token-punctuation: var(--color-slate);',
        '--shiki-token-link: var(--color-link);',
      ],
      'shiki',
    );
    // Moved, not copied: the docs site draws its code blocks with this rule and keeps no palette of its own.
    const site = readFileSync(new URL('../../../apps/docs/app/site.css', import.meta.url), 'utf8');
    expect(stripComments(site)).not.toContain('--shiki-');
    expect(blockAfter(css(), at('pre code'))).toBe(' font: inherit; ');
  });

  it('makes framed blocks concentric with a holder, and the surface step outside one', () => {
    expect(blockAfter(css(), at('pre, img, video'))).toBe(
      ' border-radius: max(var(--radius-micro), calc(var(--holder-radius, var(--radius-surface)) - var(--holder-border, 0px) - var(--holder-pad, 0px))); ',
    );
    expectAll(blockAfter(css(), at('img, video')), ['max-inline-size: 100%;', 'block-size: auto;'], 'media');
  });

  it('keeps pre and inline code left to right, drops heading tracking and uses Persian list digits under lang fa', () => {
    const source = css();
    expectAll(blockAfter(source, at('pre')), ['direction: ltr;', 'text-align: left;'], 'pre');
    expectAll(
      blockAfter(source, at('code:not(pre code)')),
      [
        'padding: 1px 6px;',
        'border: 1px solid transparent;',
        'border-radius: var(--radius-micro);',
        'background-color: var(--color-bone);',
        'font-family: var(--font-mono);',
        'font-size: 0.875em;',
        'direction: ltr;',
        'unicode-bidi: isolate;',
      ],
      'code',
    );
    expect(blockAfter(source, at(':is(h1, h2, h3, h4, h5, h6):is(:lang(fa), :lang(ar))'))).toBe(
      ' letter-spacing: normal; ',
    );
    expectAll(
      blockAfter(source, at(':is(em, i):is(:lang(fa), :lang(ar))')),
      ['font-style: normal;', 'font-weight: 500;'],
      'emphasis',
    );
    expect(blockAfter(source, at('ol:lang(fa)'))).toBe(' list-style-type: persian; ');
    // After every other list style, so it wins on order at every level.
    expect(source.indexOf(at('ol:lang(fa)'))).toBeGreaterThan(source.indexOf(at('ol ol ol')));
    // Lists, quotes and definitions indent from the start, whatever the direction.
    expect(blockAfter(source, at('ul, ol'))).toBe(' padding-inline-start: 1.25rem; ');
    expectAll(
      blockAfter(source, at('blockquote')),
      [
        'padding-inline-start: 1.25rem;',
        'border-inline-start: 2px solid var(--color-frame);',
        'quotes: none;',
      ],
      'quote',
    );
    expect(blockAfter(source, at('dd'))).toBe(' margin-inline-start: 1.25rem; ');
  });

  it('draws the neutralized spans: a link as its text, an image as its alt text in a small slate box', () => {
    const source = css();
    expectAll(
      blockAfter(source, at('.prose-unlinked')),
      ['color: inherit;', 'text-decoration: none;', 'overflow-wrap: anywhere;'],
      'unlinked',
    );
    expectAll(
      blockAfter(source, at('.prose-image')),
      [
        'padding: 1px 6px;',
        'border: 1px solid transparent;',
        'border-radius: var(--radius-micro);',
        'background-color: var(--color-bone);',
        'color: var(--color-slate);',
        'font-size: var(--text-small);',
      ],
      'image',
    );
    expect(blockAfter(source, at('.prose-image:empty'))).toBe(' display: none; ');
  });

  it('draws a table as a chart table: small, tabular, slate headers, a divider under each row', () => {
    const source = css();
    expectAll(
      blockAfter(source, at('table')),
      [
        'inline-size: 100%;',
        'border-collapse: collapse;',
        'font-size: var(--text-small);',
        'font-variant-numeric: tabular-nums;',
      ],
      'table',
    );
    expectAll(
      blockAfter(source, at('th, td')),
      ['padding: 0.5rem 0.75rem;', 'border-block-end: 1px solid var(--color-divider);'],
      'cells',
    );
    expect(blockAfter(source, at('th'))).toContain('color: var(--color-slate);');
    expect(blockAfter(source, at('th'))).toContain('font-weight: 500;');
    // Cells break anywhere, except in a scrolling box, where the table keeps its words and scrolls.
    expect(source.indexOf(at('.prose-scroll :is(th, td)'))).toBeGreaterThan(
      source.indexOf(at('p, li, dt, dd, blockquote, figcaption, caption, h1, h2, h3, h4, h5, h6, th, td')),
    );
    expect(blockAfter(source, at('.prose-scroll :is(th, td)'))).toBe(' overflow-wrap: normal; ');
    // The mark is a 20% wash of light signal orange under ink.
    expect(blockAfter(source, at('mark'))).toBe(
      ' background-color: color-mix(in srgb, var(--color-signal-light) 20%, transparent); color: var(--color-ink); ',
    );
  });

  it('makes prose-scroll scroll and show the focus ring', () => {
    const source = css();
    expectAll(
      blockAfter(source, '.prose-scroll {'),
      [
        'contain: inline-size;',
        'max-inline-size: 100%;',
        'overflow-x: auto;',
        'border-radius: var(--radius-micro);',
      ],
      'scroll',
    );
    expect(blockAfter(source, '.prose-scroll {')).not.toMatch(/border:|background/);
    expectAll(
      blockAfter(source, '.prose-scroll:focus-visible {'),
      [
        'outline: var(--focus-ring-width) solid var(--focus-ring-color);',
        'outline-offset: var(--focus-ring-offset);',
      ],
      'ring',
    );
  });

  it("names forced colors for inline code, mark, rules and the scroll's ring, and wraps pre in print", () => {
    const source = css();
    const forced = blockAfter(source, `${FORCED_COLORS} {`);
    expect(blockAfter(forced, at('code:not(pre code)'))).toContain('border-color: CanvasText;');
    expectAll(
      blockAfter(forced, at('mark')),
      ['forced-color-adjust: none;', 'background-color: Highlight;', 'color: HighlightText;'],
      'mark',
    );
    expectAll(
      blockAfter(blockAfter(forced, '@supports (color: Mark) {'), at('mark')),
      ['background-color: Mark;', 'color: MarkText;'],
      'mark',
    );
    expect(blockAfter(forced, at('blockquote'))).toContain('border-inline-start-color: CanvasText;');
    expect(blockAfter(forced, at('hr, [data-footnotes]'))).toContain('border-block-start-color: CanvasText;');
    expect(blockAfter(forced, at('pre:focus-visible'))).toContain('outline-color: Highlight;');
    expect(blockAfter(forced, at('.prose-image'))).toContain('border-color: CanvasText;');
    // The region's ring is the box's own, outside the element layer.
    const rest = source.slice(source.indexOf('.prose-scroll {'));
    expect(blockAfter(blockAfter(rest, `${FORCED_COLORS} {`), '.prose-scroll:focus-visible {')).toContain(
      'outline-color: Highlight;',
    );
    expectAll(
      blockAfter(blockAfter(source, '@media print {'), at('pre')),
      ['white-space: pre-wrap;', 'overflow-wrap: anywhere;'],
      'print',
    );
  });

  it('puts every element rule in the components.prose layer, and the gaps between its children outside it', () => {
    const source = css();
    const layer = blockAfter(source, '@layer prose {');
    const before = source.slice(0, source.indexOf('@layer prose {'));
    const after = source.slice(source.indexOf('@layer prose {') + '@layer prose {'.length + layer.length);
    // Every element rule is in the layer, under every component's own rules whatever their specificity.
    expect(before + after).not.toContain('.prose :where(');
    expect(layer).not.toContain('.prose > :where(');
    // The gaps between the box's own children stay at the components level, so a component spaced as a block
    // keeps them, and the region's rules are a part's own.
    for (const header of [
      child('* + *'),
      child('* + :is(h1, h2)'),
      child(':is(h1, h2, h3, h4, h5, h6) + *'),
    ]) {
      expect(before, header).toContain(header);
    }
    expect(after).toContain('.prose-scroll {');
  });

  it('hands every library component inside the box back to the layer below, as its last rule', () => {
    const source = css();
    const layer = blockAfter(source, '@layer prose {');
    expect(blockAfter(layer, '.prose :is(.prose-parts), .prose :is(.prose-parts) * {')).toBe(
      ' all: revert-layer; ',
    );
    expect(blockAfter(layer, '.prose :is(.prose-parts) *::marker {')).toBe(
      ' color: revert-layer; font-variant-numeric: revert-layer; ',
    );
    // Its two members of two classes outrank every element rule of one, so it wins whatever comes after it.
    expect(layer.trimEnd().endsWith('}')).toBe(true);
  });

  it('writes the roots collected from the component stylesheets into the built rule', async () => {
    const { componentRoots, PARTS_PLACEHOLDER } = await import('../scripts/component-roots.js');
    const roots = componentRoots(new URL('../src/components', import.meta.url).pathname);
    const list = `:is(${roots.map((root) => `.${root}`).join(', ')})`;
    for (const file of ['dist/components/prose.css', 'dist/styles.css']) {
      const built = closeUp(read(file));
      expect(built, file).not.toContain(PARTS_PLACEHOLDER);
      expect(built, file).toContain(`.prose ${list}, .prose ${list} * { all: revert-layer; }`);
    }
    // Whether each component's markup carries one of these is tested where the components render: the react
    // and charts packages' prose-roots tests render every part's server markup against the built list (spec
    // correction 93).
    expect(roots).not.toContain('prose');
    expect(roots).not.toContain('not-prose');
  });

  it("lists the settings batch's roots, and not their sub-parts", async () => {
    const { componentRoots } = await import('../scripts/component-roots.js');
    const roots = componentRoots(new URL('../src/components', import.meta.url).pathname);
    // Each extends no other class its file names, so the guard finds it with no hand-written entry (lesson 12).
    expect(roots).toEqual(
      expect.arrayContaining([
        'copy-button',
        'conditional-fields',
        'field-extras',
        'field-offer',
        'repeater',
        // A lone PanelNav and a PanelSection are outermost elements of their own, and each is a root.
        'panel-layout',
        'panel-nav',
        'panel-section',
        'panel-row',
        // The account menu's popover is its stylesheet's root, and its trigger, the part's outermost element, is
        // listed by hand (OUTERMOST_PARTS).
        'account-menu',
        'account-menu-trigger',
      ]),
    );
    for (const part of [
      'copy-button-status',
      'copy-button-glyph',
      'field-extras-status',
      'field-offer-button',
      'repeater-row',
      'repeater-row-set',
      'repeater-status',
      'repeater-remove-space',
      'panel-layout-frame',
      'panel-layout-back',
      'panel-nav-link',
      'panel-section-heading',
      'panel-row-grid',
      'account-menu-name',
      'account-menu-detail',
      'account-menu-chevron',
      'account-menu-text',
      'menu-item-submenu',
      'segmented-icon',
      'radio-icon',
    ]) {
      expect(roots, part).not.toContain(part);
    }
  });

  it("keeps footnotes' label for screen readers alone, task lists unmarked and Persian emphasis in bold at 700", () => {
    const source = css();
    expectAll(
      blockAfter(source, at("[data-footnotes] > [class~='sr-only']")),
      [
        'position: absolute;',
        'inline-size: 1px;',
        'block-size: 1px;',
        'overflow: hidden;',
        'clip-path: inset(50%);',
      ],
      'label',
    );
    expect(blockAfter(source, at("[data-footnotes] > [class~='sr-only'] + *"))).toBe(
      ' margin-block-start: 0; ',
    );
    expect(blockAfter(source, at('.contains-task-list'))).toBe(
      ' padding-inline-start: 0; list-style: none; ',
    );
    expect(blockAfter(source, at(':is(strong, b, h3, h4, h5, h6) :is(em, i):is(:lang(fa), :lang(ar))'))).toBe(
      ' font-weight: 700; ',
    );
    expect(
      source.indexOf(at(':is(strong, b, h3, h4, h5, h6) :is(em, i):is(:lang(fa), :lang(ar))')),
    ).toBeGreaterThan(source.indexOf(at(':is(em, i):is(:lang(fa), :lang(ar))')));
  });
});
