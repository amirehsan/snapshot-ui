import { expect, test, type Locator, type Page } from '@playwright/test';
import { axeViolations, CHART_PAGES, COMPONENT_PAGES, settled, sideways, systemColor } from './support';

/**
 * Checks that run across every component page: Windows high contrast, and a
 * narrow screen with a long unbroken word. Each component's own behavior is
 * tested in docs.spec.ts and in its package; these are the conditions the
 * component tests cannot reach from jsdom, which has no layout and no media.
 */

/** Opens a docs page and waits for hydration, so the keys and clicks a test sends are not lost to a page still booting. */
const visit = async (page: Page, url: string): Promise<void> => {
  await page.goto(url);
  await settled(page);
};

/** Every page of the Components section and then of the Charts section, in the rail's order. */
const PAGES = [...COMPONENT_PAGES, ...CHART_PAGES];

/** The slug of every page the loops below visit. */
const SLUGS = PAGES.map(({ slug }) => slug);

test('the Components and Charts sections list the pages the loops below visit', () => {
  expect(COMPONENT_PAGES.length).toBeGreaterThanOrEqual(15);
  expect(SLUGS).toContain('switch');
  expect(SLUGS).toContain('segmented-control');
  expect(CHART_PAGES.map(({ slug }) => slug)).toContain('sparkline');
  // A slug names one page, so the maps below, which are keyed by slug, cannot mix two up.
  expect(new Set(SLUGS).size).toBe(SLUGS.length);
});

// ---- Windows high contrast ----------------------------------------------------------------------

/** What an element, or its ::before or ::after, paints with: its fill, its edge and its text. */
const paint = (
  locator: Locator,
  pseudo?: '::before' | '::after',
): Promise<{ fill: string; edge: string; text: string }> =>
  locator.evaluate((element, which) => {
    const style = getComputedStyle(element, which);
    return { fill: style.backgroundColor, edge: style.borderTopColor, text: style.color };
  }, pseudo ?? null);

/** The colors the reader's palette gives the system color keywords, read from probes on the open page. */
const systemColors = (
  page: Page,
): Promise<{
  highlight: string;
  highlightText: string;
  canvas: string;
  canvasText: string;
  grayText: string;
}> =>
  page.evaluate(() => {
    const read = (property: 'color' | 'backgroundColor', value: string): string => {
      const probe = document.createElement('span');
      probe.style[property] = value;
      document.body.append(probe);
      const computed = getComputedStyle(probe)[property];
      probe.remove();
      return computed;
    };
    return {
      highlight: read('backgroundColor', 'Highlight'),
      highlightText: read('color', 'HighlightText'),
      canvas: read('backgroundColor', 'canvas'),
      canvasText: read('color', 'CanvasText'),
      grayText: read('color', 'GrayText'),
    };
  });

/**
 * The focus ring an element draws: its outline, and the color it is drawn over. An inset ring (a negative
 * offset) is drawn over the element's own fill; an outset one over the first fill found going up the tree.
 */
const ring = (locator: Locator): Promise<{ style: string; width: number; color: string; behind: string }> =>
  locator.evaluate((element) => {
    const clear = (color: string): boolean => /(?:, 0\)|transparent)$/.test(color);
    const style = getComputedStyle(element);
    let behind: Element | null = parseFloat(style.outlineOffset) < 0 ? element : element.parentElement;
    while (behind && clear(getComputedStyle(behind).backgroundColor)) behind = behind.parentElement;
    return {
      style: style.outlineStyle,
      width: parseFloat(style.outlineWidth),
      color: style.outlineColor,
      behind: getComputedStyle(behind ?? document.documentElement).backgroundColor,
    };
  });

/** A focus ring that can be seen: drawn, 2px or more, and not the color of what it sits on. */
const expectVisibleRing = async (locator: Locator): Promise<void> => {
  const drawn = await ring(locator);
  expect(drawn.style).toBe('solid');
  expect(drawn.width).toBeGreaterThanOrEqual(2);
  expect(drawn.color).not.toBe(drawn.behind);
};

test.describe('forced colors', () => {
  // The browser repaints every author color with the reader's palette, so a state drawn by a fill alone
  // disappears. Computed styles are read after that repaint, so they are what the reader sees.
  test.use({ forcedColors: 'active', colorScheme: 'light' });

  /** The switch row whose control has this name, on the page that is open. */
  const switchNamed = (page: Page, name: string): Locator =>
    page.locator('.switch').filter({ has: page.getByRole('switch', { name, exact: true }) });

  test('a switch tells on from off, and its thumb shows against its track', async ({ page }) => {
    await visit(page, '/docs/components/switch');
    const look = async (name: string) => {
      const row = switchNamed(page, name);
      const track = row.locator('.switch-track');
      const thumb = row.locator('.switch-thumb');
      const [trackBox, thumbBox] = [await track.boundingBox(), await thumb.boundingBox()];
      if (!trackBox || !thumbBox) throw new Error('No switch drawn');
      return {
        track: await paint(track),
        thumb: await paint(thumb),
        // Where the thumb sits is the second cue: nearer the start when off and the end when on.
        place: thumbBox.x + thumbBox.width / 2 > trackBox.x + trackBox.width / 2 ? 'end' : 'start',
      };
    };
    const states = {
      on: await look('On'),
      off: await look('Off'),
      disabledOn: await look('Disabled and on'),
      disabledOff: await look('Disabled and off'),
    };
    // A thumb the color of its track is invisible: that was the failure, canvas on canvas.
    for (const state of Object.values(states)) expect(state.thumb.fill).not.toBe(state.track.fill);
    expect(states.on.place).toBe('end');
    expect(states.off.place).toBe('start');
    // On and off differ in paint and not only in place, and so do the disabled pair.
    expect(states.on.track).not.toEqual(states.off.track);
    expect(states.on.thumb).not.toEqual(states.off.thumb);
    expect(states.disabledOn.track).not.toEqual(states.disabledOff.track);
    // A disabled switch does not look enabled.
    expect(states.disabledOn.track).not.toEqual(states.on.track);
    expect(states.disabledOff.thumb).not.toEqual(states.off.thumb);
  });

  test('the focus ring of a switch is drawn', async ({ page }) => {
    await visit(page, '/docs/components/switch');
    await page.getByRole('switch', { name: 'Off', exact: true }).focus();
    await expectVisibleRing(switchNamed(page, 'Off').locator('.switch-track'));
  });

  test('the chosen option of a segmented control is told from the others and from its track', async ({
    page,
  }) => {
    await visit(page, '/docs/components/segmented-control');
    const group = page.getByRole('radiogroup', { name: 'Appearance' });
    const chosen = await paint(group.locator('.segmented-option[data-selected]'));
    const other = await paint(group.locator('.segmented-option:not([data-selected])').first());
    const track = await paint(group.locator('.segmented-track'));
    expect(chosen.fill).not.toBe(track.fill);
    expect(chosen.fill).not.toBe(other.fill);
    // The label shows on the chosen fill.
    expect(chosen.text).not.toBe(chosen.fill);
    expect(other.text).not.toBe(track.fill);

    // A disabled control still shows its choice, in a paint of its own.
    const disabled = page.locator('.segmented[data-disabled]');
    const kept = await paint(disabled.locator('.segmented-option[data-selected]'));
    const rest = await paint(disabled.locator('.segmented-option:not([data-selected])').first());
    const frame = await paint(disabled.locator('.segmented-track'));
    expect(kept.fill).not.toBe(frame.fill);
    expect(kept.fill).not.toBe(rest.fill);
    expect(kept.text).not.toBe(kept.fill);
    expect(kept).not.toEqual(chosen);
  });

  test('the focus ring of the chosen segmented option shows against its fill', async ({ page }) => {
    await visit(page, '/docs/components/segmented-control');
    const group = page.getByRole('radiogroup', { name: 'Appearance' });
    await group.getByRole('radio', { name: 'System' }).focus();
    await expectVisibleRing(group.locator('.segmented-option[data-selected]'));
  });

  test('a checked box shows its mark and a selected radio shows its check', async ({ page }) => {
    await visit(page, '/docs/components/checkbox');
    const remember = page.locator('label.checkbox').filter({ hasText: 'Remember me on this device' });
    const show = page.locator('label.checkbox').filter({ hasText: 'Show service descriptions' });
    await expect(remember.getByRole('checkbox')).toBeChecked();
    await expect(show.getByRole('checkbox')).not.toBeChecked();
    const checked = await paint(remember.locator('.checkbox-box'));
    const empty = await paint(show.locator('.checkbox-box'));
    const mark = await paint(remember.locator('.checkbox-box'), '::after');
    expect(checked.fill).not.toBe(empty.fill);
    // The mark is not the color of the box it is drawn on.
    expect(mark.fill).not.toBe(checked.fill);
    await remember.getByRole('checkbox').focus();
    await expectVisibleRing(remember.locator('.checkbox-box'));

    await visit(page, '/docs/components/radio-group');
    const group = page.getByRole('radiogroup', { name: 'Newsletter frequency' });
    const chosen = group.locator('label.radio[data-selected]');
    const rest = group.locator('label.radio:not([data-selected])').first();
    const check = await paint(chosen.locator('.radio-indicator'), '::after');
    const none = await paint(rest.locator('.radio-indicator'), '::after');
    const dot = await paint(chosen.locator('.radio-indicator'));
    // A drawn check in a color that shows on the dot, against a row with none.
    expect(check.fill).not.toBe(none.fill);
    expect(check.fill).not.toBe(dot.fill);
    await group.getByRole('radio', { name: 'Weekly' }).focus();
    await expectVisibleRing(chosen);
  });

  test('the focus ring of a text field is drawn', async ({ page }) => {
    await visit(page, '/docs/components/text-field');
    const input = page.getByRole('textbox', { name: 'Workspace name' });
    await input.focus();
    await expectVisibleRing(input);
  });

  test('a disabled link form is drawn in GrayText, as a disabled control is', async ({ page }) => {
    // The browser grays out a disabled button element by itself, but not a link that says it is disabled
    // with aria-disabled: React Aria's disabled Link, and a plain anchor wearing a button's classes.
    await visit(page, '/docs/components/link');
    const gray = await page.evaluate(() => {
      const probe = document.createElement('span');
      probe.style.color = 'GrayText';
      document.body.append(probe);
      const { color } = getComputedStyle(probe);
      probe.remove();
      return color;
    });
    const disabled = page.locator(".stage .link[aria-disabled='true']");
    await expect(disabled).toHaveCount(1);
    expect((await paint(disabled)).text).toBe(gray);
    expect((await paint(page.locator('.stage a.link[href]').first())).text).not.toBe(gray);

    // The text is put in the browser, so the test needs no fixture page and ships no extra route.
    const stage = page.locator('.stage').first();
    await stage.evaluate((element) => {
      element.insertAdjacentHTML(
        'beforeend',
        '<a class="button" aria-disabled="true" data-probe="button">Save changes</a>' +
          '<a class="icon-button icon-button-outline" aria-disabled="true" aria-label="Copy" data-probe="icon-button"></a>',
      );
    });
    for (const probe of ['button', 'icon-button']) {
      const look = await paint(stage.locator(`[data-probe="${probe}"]`));
      expect(look.text, probe).toBe(gray);
      expect(look.edge, probe).toBe(gray);
    }
  });

  test('a dialog keeps a translucent scrim and a drawn edge, and its panel follows the palette', async ({
    page,
  }) => {
    // The scrim opts out of the repaint, so it stays Deep Well and the page stays in view behind it. The panel
    // opts back in, since the opt-out is inherited, so its text and its edge, the hairline that is transparent
    // in light, are drawn in the reader's text color.
    await visit(page, '/docs/components/dialog');
    const text = await page.evaluate(() => {
      const probe = document.createElement('span');
      probe.style.color = 'CanvasText';
      document.body.append(probe);
      const { color } = getComputedStyle(probe);
      probe.remove();
      return color;
    });
    await page.getByRole('button', { name: 'Rename the workspace' }).click();
    await expect(page.getByRole('dialog', { name: 'Rename the workspace' })).toBeVisible();
    const scrim = page.locator('.dialog-overlay');
    await expect(scrim).not.toHaveAttribute('data-entering');
    // The scrim is a color-mix, which computes to color(srgb r g b / a); its alpha is the last number.
    const fill = (await paint(scrim)).fill;
    const alpha = /\/\s*([\d.]+)\s*\)$/.exec(fill)?.[1] ?? /rgba\([^)]*,\s*([\d.]+)\)$/.exec(fill)?.[1];
    expect(alpha, fill).toBeDefined();
    expect(Number(alpha), fill).toBeGreaterThan(0);
    expect(Number(alpha), fill).toBeLessThan(1);
    const panel = await paint(page.locator('.dialog'));
    expect(panel.edge).toBe(text);
    expect(panel.text).toBe(text);
    expect((await paint(page.locator('.dialog-title'))).text).toBe(text);
  });

  test('a selected menu row is drawn in Highlight, and every part of it in HighlightText', async ({
    page,
  }) => {
    // The ink pill is a fill, which the repaint would drop with nothing left to say which row is chosen
    // but the check. The selected row is drawn in the reader's Highlight, and its parts follow it: the
    // repaint turns a part's own author color into CanvasText, which on Highlight all but vanishes.
    await visit(page, '/docs/components/menu');
    const system = await systemColors(page);
    await page.getByRole('button', { name: 'View options' }).click();
    const selected = page.getByRole('menuitemradio', { name: 'System' });
    await expect(selected).toHaveAttribute('aria-checked', 'true');
    const look = await paint(selected);
    expect(look.fill).toBe(system.highlight);
    expect(look.text).toBe(system.highlightText);
    for (const part of ['.menu-item-icon', '.menu-item-check', '.menu-item-description']) {
      expect((await paint(selected.locator(part))).text, part).toBe(system.highlightText);
    }
    // No item in the example has a value or a key on a chosen row, so the two are put in the browser. The
    // key is an island with its own system canvas fill and CanvasText, which reads on any row.
    await selected.evaluate((row) => {
      row.insertAdjacentHTML(
        'beforeend',
        '<span class="menu-item-end" data-probe="end">$12.00</span><kbd class="menu-item-shortcut" data-probe="key">K</kbd>',
      );
    });
    expect((await paint(selected.locator('[data-probe="end"]'))).text).toBe(system.highlightText);
    const key = await paint(selected.locator('[data-probe="key"]'));
    expect(key.fill).toBe(system.canvas);
    expect(key.text).toBe(system.canvasText);
    const other = page.getByRole('menuitemradio', { name: 'Light' });
    expect((await paint(other)).fill).not.toBe(system.highlight);
    expect((await paint(other.locator('.menu-item-icon'))).text).toBe(system.canvasText);
  });

  test('a disabled menu row and every part of it are drawn in GrayText', async ({ page }) => {
    await visit(page, '/docs/components/menu');
    const system = await systemColors(page);
    await page.getByRole('button', { name: 'Project actions' }).click();
    const disabled = page.getByRole('menuitem', { name: 'Export' });
    await expect(disabled).toHaveAttribute('aria-disabled', 'true');
    expect((await paint(disabled)).text).toBe(system.grayText);
    for (const part of ['.menu-item-icon', '.menu-item-description', '.menu-item-shortcut']) {
      expect((await paint(disabled.locator(part))).text, part).toBe(system.grayText);
    }
    // An enabled row's parts are the reader's text color.
    const share = page.getByRole('menuitem', { name: 'Share' });
    expect((await paint(share.locator('.menu-item-description'))).text).toBe(system.canvasText);
  });

  test('the palette active row is drawn in Highlight', async ({ page }) => {
    // DOM focus never leaves the field, so the keyboard-active row's ink fill is the only sign of where Enter
    // goes. The repaint would drop the fill, so the row is drawn in the reader's Highlight, every part of it
    // in HighlightText and its key chip as the system canvas island, and the field's own outline returns.
    await visit(page, '/docs/components/command-palette');
    const system = await systemColors(page);
    await page.getByRole('button', { name: 'Search the app' }).click();
    const palette = page.getByRole('dialog', { name: 'Search the app' });
    const field = palette.getByRole('textbox', { name: 'Search the app' });
    await field.pressSequentially('checking');
    // Typing forward makes the first row active from the keyboard.
    const row = palette.getByRole('menuitem', { name: 'Checking' });
    await expect(row).toHaveAttribute('data-focus-visible', 'true');
    const look = await paint(row);
    expect(look.fill).toBe(system.highlight);
    expect(look.text).toBe(system.highlightText);
    for (const part of ['.menu-item-icon', '.menu-item-description', '.menu-item-end']) {
      expect((await paint(row.locator(part))).text, part).toBe(system.highlightText);
    }
    const key = await paint(row.locator('.menu-item-shortcut'));
    expect(key.fill).toBe(system.canvas);
    expect(key.text).toBe(system.canvasText);
    expect(await field.evaluate((element) => getComputedStyle(element).outlineStyle)).toBe('auto');
  });

  test('a sheet keeps its edge and its grabber', async ({ page }) => {
    // The hairline is transparent in light and the grabber is a fill, which the repaint would drop: both are
    // drawn in the reader's text color, so the sheet keeps its shape and its handle on the scrim.
    await visit(page, '/docs/components/sheet');
    const text = await page.evaluate(() => {
      const probe = document.createElement('span');
      probe.style.color = 'CanvasText';
      document.body.append(probe);
      const { color } = getComputedStyle(probe);
      probe.remove();
      return color;
    });
    await page.getByRole('button', { name: 'Filter transactions' }).click();
    const sheet = page.getByRole('dialog', { name: 'Filter transactions' });
    // Focus moves in once the sheet has scrolled in.
    await expect(sheet).toBeFocused();
    expect((await paint(page.locator('.sheet'))).edge).toBe(text);
    expect((await paint(page.locator('.sheet-grabber'))).fill).toBe(text);
    // The scrim stays translucent, as a dialog's does.
    const fill = (await paint(page.locator('.sheet-scrim'))).fill;
    const alpha = /\/\s*([\d.]+)\s*\)$/.exec(fill)?.[1] ?? /rgba\([^)]*,\s*([\d.]+)\)$/.exec(fill)?.[1];
    expect(Number(alpha), fill).toBeGreaterThan(0);
    expect(Number(alpha), fill).toBeLessThan(1);
  });

  test('the current rail item is Highlight and the group dots are CanvasText and Highlight', async ({
    page,
  }) => {
    // The current item is an ink fill and the dots are fills, which the repaint would drop: the item is drawn
    // in the selection colors and the dots in the reader's text and selection colors, so both still show.
    await page.setViewportSize({ width: 1280, height: 800 });
    await visit(page, '/docs/components/sidebar');
    const example = page.locator('.stage').first();
    const current = example.locator('.sidebar:not(.sidebar-drawer) .sidebar-item[aria-current="page"]');
    const item = await paint(current);
    expect(item.fill).toBe(await systemColor(page, 'Highlight'));
    expect(item.text).toBe(await systemColor(page, 'HighlightText'));
    const groups = example.locator('.sidebar:not(.sidebar-drawer) .sidebar-group');
    const lit = await paint(
      groups.and(page.locator('[data-current]')).locator('.sidebar-group-label'),
      '::before',
    );
    expect(lit.fill).toBe(await systemColor(page, 'Highlight'));
    const plain = await paint(
      groups.and(page.locator(':not([data-current])')).first().locator('.sidebar-group-label'),
      '::before',
    );
    expect(plain.fill).toBe(await systemColor(page, 'CanvasText'));
  });

  test('the current tab is Highlight and a count chip is CanvasText', async ({ page }) => {
    // The current item is an ink fill and the chip a fill, which the repaint would drop: the item is drawn in the
    // selection colors and the chip in the reader's text color, so both still show.
    await visit(page, '/docs/components/bottom-tab-bar');
    const example = page.locator('.stage').first();
    const item = await paint(example.locator('.tab-bar-item[aria-current="page"]'));
    expect(item.fill).toBe(await systemColor(page, 'Highlight'));
    expect(item.text).toBe(await systemColor(page, 'HighlightText'));
    const chip = await paint(
      example
        .getByRole('link', { name: 'Transactions, 12 to review', exact: true })
        .locator('.tab-bar-count'),
    );
    expect(chip.fill).toBe(await systemColor(page, 'CanvasText'));
  });

  test('a meter keeps its fill, its hatch, its track edge and its pace marker', async ({ page }) => {
    // The fill and the marker are backgrounds and the hatch an image, which the repaint would drop: the fill is
    // drawn in the reader's text color, the hatch opts out of the repaint, the track is outlined so its end
    // shows, and the marker is drawn in the selection color.
    await visit(page, '/docs/components/meter');
    // The pace example's meter, by its name, whatever the examples' order.
    const meter = page
      .locator('.meter')
      .filter({ has: page.getByRole('meter', { name: 'Transport', exact: true }) });
    await expect(meter).toHaveCount(1);
    const text = await systemColor(page, 'CanvasText');
    expect((await paint(meter.locator(".meter-segment[data-look='fill']"))).fill).toBe(text);
    expect(
      await meter
        .locator(".meter-segment[data-look='hatched']")
        .evaluate((element) => getComputedStyle(element).backgroundImage),
    ).not.toBe('none');
    expect(
      await meter.locator('.meter-track').evaluate((element) => getComputedStyle(element).outlineColor),
    ).toBe(text);
    expect((await paint(meter.locator('.meter-pace'))).fill).toBe(await systemColor(page, 'Highlight'));
  });

  test('a line chart draws its first line CanvasText, its second GrayText, and its crosshair Highlight', async ({
    page,
  }) => {
    // The lines are svg strokes, which the repaint would turn into the one text color: the first keeps it, and
    // the second, the context, steps back to GrayText, so the two are still told apart.
    await visit(page, '/docs/charts/line-chart');
    // The comparison example's chart, by its name, whatever the examples' order.
    const chart = page.getByRole('figure', { name: 'Spending in October, against September', exact: true });
    await expect(chart).toHaveCount(1);
    const stroke = (series: string): Promise<string> =>
      chart
        .locator(`svg .line-chart-line[data-series="${series}"]`)
        .evaluate((element) => getComputedStyle(element).stroke);
    expect(await stroke('1')).toBe(await systemColor(page, 'CanvasText'));
    expect(await stroke('2')).toBe(await systemColor(page, 'GrayText'));

    const plot = chart.getByRole('group', { name: 'Spending in October, against September', exact: true });
    await plot.focus();
    await expect(chart.locator('.line-chart-crosshair')).toHaveCount(1);
    expect((await paint(chart.locator('.line-chart-crosshair'))).fill).toBe(
      await systemColor(page, 'Highlight'),
    );
    await expectVisibleRing(plot);
  });

  test('a tooltip keeps a border and loses its arrow', async ({ page }) => {
    // The arrow is an svg fill, which the repaint would turn into a shape of the wrong color or none, so it
    // goes. The tip's transparent border is repainted in the reader's text color, so the tip keeps its shape.
    await visit(page, '/docs/components/tooltip');
    const system = await systemColors(page);
    await page.getByRole('button', { name: 'Edit', exact: true }).focus();
    const tip = page.getByRole('tooltip');
    await expect(tip).toHaveText('Edit');
    expect((await paint(tip)).edge).toBe(system.canvasText);
    await expect(tip.locator('.tooltip-arrow')).toBeHidden();
  });

  test('a select chevron is CanvasText', async ({ page }) => {
    await visit(page, '/docs/components/select');
    const canvasText = await systemColor(page, 'CanvasText');
    const grayText = await systemColor(page, 'GrayText');
    const chevrons = page.locator('.stage .select-trigger:not([data-disabled]) .select-chevron');
    expect(await chevrons.count()).toBeGreaterThan(0);
    for (const chevron of await chevrons.all()) await expect(chevron).toHaveCSS('color', canvasText);
    await expect(page.locator('.stage .select-trigger[data-disabled] .select-chevron')).toHaveCSS(
      'color',
      grayText,
    );
  });
});

// ---- Props tables -------------------------------------------------------------------------------

test('every props table on a component or chart page has a name of its own', async ({ page }) => {
  // A page with several tables names each one, so a screen reader's list of tables tells them apart.
  for (const { slug, url } of PAGES) {
    await page.goto(url);
    const names = await page
      .locator('.props table')
      .evaluateAll((tables) => tables.map((table) => table.getAttribute('aria-label')));
    expect(names.length, slug).toBeGreaterThan(0);
    expect(new Set(names).size, `${slug}: ${names.join(', ')}`).toBe(names.length);
  }
});

// ---- Narrow screens -----------------------------------------------------------------------------

/** A web address with no break in it: nothing for the browser to wrap at. */
const LONG = `https://example.com/${'segment'.repeat(12)}end`;

/**
 * What a long unbroken word is put into, per page: the places a person writes their own text. Each
 * selector must match, so a class that is renamed cannot turn this into a test of nothing. Scoped to the
 * preview stage, so the page's own chrome (its package card, its headings) is not the thing under test.
 *
 * Every docs section is a Card, and a Card sets `overflow-wrap: anywhere`, which its children inherit. The
 * stage sets it back to normal, so each target here wraps by its own component's rule, as it would in an
 * app, and never by the card the page is drawn in.
 */
const LONG_TARGETS: Record<string, string[]> = {
  'app-shell': ['.stage .app-shell-main p'],
  badge: ['.stage .badge'],
  card: ['.stage .card-title', '.stage .card-note'],
  checkbox: [
    '.stage .field-label',
    '.stage .field-description',
    '.stage .field-error',
    '.stage .checkbox-text',
  ],
  'combo-box': ['.stage .field-label', '.stage .field-description', '.stage .field-error'],
  'collapsible-card': [
    '.stage .card-toggle-text',
    '.stage .card-note',
    '.stage .card-collapsible .card-body p',
  ],
  field: ['.stage .field-label', '.stage .field-description', '.stage .field-error', '.stage .field-changed'],
  kbd: ['.stage .kbd'],
  // The legend names the series in the app's words, and wraps at any character, as the meter's legend does.
  'line-chart': ['.stage .line-chart-legend-label'],
  link: ['.stage .link'],
  meter: ['.stage .meter-label', '.stage .meter-value', '.stage .meter-legend-label'],
  'radio-group': [
    '.stage .field-label',
    '.stage .field-description',
    '.stage .field-error',
    '.stage .radio-text',
  ],
  'search-field': ['.stage .field-label', '.stage .field-description', '.stage .field-error'],
  'segmented-control': ['.stage .field-label', '.stage .segmented-label'],
  // The chosen option's label stays on one line in the trigger and ellipsizes, so it never pushes the page.
  select: ['.stage .field-label', '.stage .field-description', '.stage .select-value-label'],
  sidebar: ['.stage .sidebar-item-label'],
  'stat-tile': ['.stage .stat-tile-label', '.stage .stat-tile-change-label', '.stage .stat-tile-caption'],
  switch: ['.stage .switch-text', '.stage .field-description'],
  'text-area': ['.stage .field-label', '.stage .field-description', '.stage .field-error'],
  'text-field': ['.stage .field-label', '.stage .field-description', '.stage .field-error'],
  // A numeral is a figure and never wraps (white-space: nowrap), so a web address is not put into one.
  typography: ['.stage .heading', '.stage .copy:not(.copy-numeral, .copy-numeral-sm)', '.stage .eyebrow'],
};

/** The pages with no text a person writes, each with its reason. A page is in one list or the other. */
const NO_LONG_TEXT: Record<string, string> = {
  avatar: 'two initials in a fixed box; the name is an aria-label that nothing draws',
  'bottom-tab-bar':
    'a tab label is one word on one line and ellipsizes as a last resort; the name holds the full label',
  button: 'a label is a short command on one line by design (white-space: nowrap), not text that wraps',
  'command-palette':
    "its text is in a portal that opens on a press or a key; the Narrow story's 375px baseline pins its wrapping",
  'confirm-dialog':
    "its text is in a portal that opens on a press; its stories' 375px baselines pin its wrapping",
  dialog: 'its text is in a portal that opens on a press; the 375px stories pin its wrapping',
  drawer: 'its text is in a portal that opens on a press; the 375px stories pin its wrapping',
  'icon-button': 'a glyph and no text: its name is an aria-label that nothing draws',
  menu: "its text is in a portal that opens on a press; the EndValues story's 375px baseline pins its wrapping",
  popover: 'its text is in a portal that opens on a press; the 375px stories pin its wrapping',
  sheet: 'its text is in a portal that opens on a press; the 375px stories pin its wrapping',
  sparkline: 'a drawing with no text; its name, when it has one, is an aria-label nothing draws',
  spinner: 'a progress mark with no text a person writes',
  toast: 'its text is in a portal that opens on a press; the 375px stories pin its wrapping',
  tooltip:
    "its text is in a portal that opens on hover or focus; the Wrapped story's 375px baseline pins its wrapping",
};

test('every component and chart page is given long text, or is listed as having none', () => {
  // A page added to the rail must be in one list, so it cannot skip the narrow-screen check by omission.
  expect([...Object.keys(LONG_TARGETS), ...Object.keys(NO_LONG_TEXT)].sort()).toEqual([...SLUGS].sort());
});

for (const { slug, url } of PAGES) {
  test(`the ${slug} page fits 320px and 375px, with a long web address in its text`, async ({ page }) => {
    for (const width of [320, 375]) {
      await page.setViewportSize({ width, height: 800 });
      await visit(page, url);
      expect(await sideways(page), `${slug} at ${String(width)}px`).toBe(0);

      // Nothing in a props table is cut off by its frame, which clips what does not fit: a description
      // that is hidden is as lost as one that scrolls the page.
      const cut = await page.locator('.props').evaluateAll((frames) =>
        frames.flatMap((frame) => {
          const edge = frame.getBoundingClientRect().right;
          return [...frame.querySelectorAll('*')]
            .filter((element) => element.getBoundingClientRect().right > edge + 0.5)
            .map((element) => element.textContent.slice(0, 30));
        }),
      );
      expect(cut, `props cut off on the ${slug} page at ${String(width)}px`).toEqual([]);

      // The stage cuts the card's wrapping off, so what wraps below wraps by its own component's rule.
      if (slug in LONG_TARGETS)
        await expect(page.locator('.stage').first()).toHaveCSS('overflow-wrap', 'normal');

      for (const selector of LONG_TARGETS[slug] ?? []) {
        const targets = page.locator(selector);
        expect(await targets.count(), `${selector} on the ${slug} page`).toBeGreaterThan(0);
        // The text is replaced in the browser, so the test needs no fixture page and ships no extra route.
        await targets.evaluateAll((elements, text) => {
          for (const element of elements) {
            // A row holds its control and then its words, so only the last run of text is replaced.
            const words = [...element.childNodes]
              .reverse()
              .find((node) => node.nodeType === Node.TEXT_NODE && node.textContent?.trim());
            if (words) words.textContent = text;
            else element.textContent = text;
          }
        }, LONG);
        // A segmented control restacks a moment after its text changes.
        await expect
          .poll(() => sideways(page), { message: `${selector} on the ${slug} page at ${String(width)}px` })
          .toBe(0);
      }
    }
  });
}

// ---- Accessibility ------------------------------------------------------------------------------

/**
 * The pages whose examples draw a whole app shell, each with its reason. A docs page is itself a page with one
 * `<main>`, and an example of the shell renders a second `<main>`, and a nav, inside it. On these pages alone
 * the three landmark rules that forbid that are off; every other rule stays on, each example's nav has a name
 * of its own, and the Storybook a11y run checks a lone shell's landmarks with every rule on.
 */
const NESTED_SHELL: Record<string, string> = {
  'app-shell': 'each example is an AppShell, which renders its own <main> inside the page',
  sidebar: 'each example is a Sidebar in an AppShell, which renders its own <main> inside the page',
};
const NESTED_RULES = ['landmark-no-duplicate-main', 'landmark-main-is-top-level', 'landmark-unique'];

for (const { slug, url } of PAGES) {
  for (const theme of ['light', 'dark'] as const) {
    test(`the ${slug} page has no axe violations in ${theme}`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: theme });
      await visit(page, url);
      await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
      expect(await axeViolations(page, { disableRules: slug in NESTED_SHELL ? NESTED_RULES : [] })).toEqual(
        [],
      );
    });
  }
}

// ---- Server rendering ---------------------------------------------------------------------------

/**
 * What each component page's examples must draw before any script runs. The pages are server components
 * and the examples are modules a server page imports: the static components (Heading, Text, Eyebrow, Kbd,
 * Badge, Card, FieldCounter) render there directly, and the client ones (everything React Aria) are
 * rendered to HTML on the server and hydrated in the browser. The packages' own tests render both kinds in
 * Node; this proves the production build puts them in the page.
 */
const SERVER_RENDERED: Record<string, string[]> = {
  'app-shell': ['.stage .app-shell'],
  avatar: ['.stage .avatar', '.stage .avatar-initials'],
  badge: ['.stage .badge'],
  'bottom-tab-bar': ['.stage .tab-bar'],
  button: ['.stage .button'],
  card: ['.stage .card', '.stage .card-title', '.stage .card-note'],
  checkbox: ['.stage .checkbox-box'],
  'collapsible-card': ['.stage .card-collapsible', '.stage .card-toggle', '.stage .card-chevron'],
  // The input and its button; the list renders nothing until it opens.
  'combo-box': ['.stage .combo-box-input', '.stage .combo-box-button'],
  'command-palette': ['.stage .button'],
  'confirm-dialog': ['.stage .button'],
  dialog: ['.stage .button'],
  drawer: ['.stage .button'],
  field: ['.stage .field-counter', '.stage .field-changed'],
  'icon-button': ['.stage .icon-button'],
  kbd: ['.stage .kbd'],
  // The drawing, the table the toggle shows and the toggle itself; the readout waits for a key or a pointer.
  'line-chart': [
    '.stage .line-chart svg .line-chart-line',
    '.stage .line-chart-table',
    '.stage .line-chart-toggle',
  ],
  link: ['.stage .link'],
  menu: ['.stage .button, .stage .icon-button'],
  meter: ['.stage .meter [role="meter"]', '.stage .meter-segment'],
  popover: ['.stage .button'],
  'radio-group': ['.stage .radio-indicator'],
  'search-field': ['.stage .search-field-input', '.stage .search-field-icon'],
  'segmented-control': ['.stage .segmented-option'],
  // The trigger and the value it shows; the list renders nothing until it opens.
  select: ['.stage .select-trigger', '.stage .select-value'],
  sheet: ['.stage .button'],
  sidebar: ['.stage .sidebar'],
  sparkline: ['.stage .sparkline svg .sparkline-line'],
  spinner: ['.stage .spinner'],
  'stat-tile': ['.stage .stat-tile', '.stage .stat-tile-value', '.stage .stat-tile-change'],
  switch: ['.stage .switch-thumb'],
  'text-area': ['.stage .textarea'],
  'text-field': ['.stage .input'],
  // The buttons that raise the toasts, and the polite status host the docs layout mounts, which is in the page
  // before any toast.
  toast: ['.stage .button', '.toast-status-host'],
  // The triggers; a tip opens on hover or focus, so none is in the page before a script runs.
  tooltip: ['.stage .icon-button'],
  typography: ['.stage .heading', '.stage .copy', '.stage .copy-numeral', '.stage .eyebrow'],
};

test('every component and chart page is listed as server rendered', () => {
  // A page added to the rail must say what its examples draw, so it cannot skip this check.
  expect(Object.keys(SERVER_RENDERED).sort()).toEqual([...SLUGS].sort());
});

test.describe('without JavaScript', () => {
  test.use({ javaScriptEnabled: false });

  for (const { slug, url } of PAGES) {
    test(`the ${slug} page arrives from the server with its examples drawn`, async ({ page }) => {
      await page.goto(url);
      for (const selector of SERVER_RENDERED[slug] ?? []) {
        expect(await page.locator(selector).count(), `${selector} on the ${slug} page`).toBeGreaterThan(0);
      }
      // The page's own chrome comes from server components as well: a static Badge and a client Link.
      await expect(page.locator('.panel-side .badge')).toHaveCount(1);
      await expect(page.locator('.panel-side .link').first()).toHaveAttribute('href', /^https:\/\//);
    });
  }
});
