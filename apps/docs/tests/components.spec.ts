import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, test, type Locator, type Page } from '@playwright/test';
import { icons } from 'lucide-react';
import {
  axeViolations,
  CHART_PAGES,
  COMPONENT_PAGES,
  drawn,
  expectTableFace,
  over,
  settled,
  sideways,
  systemColor,
} from './support';

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

test('every docs page names a rail icon the icon set has', () => {
  // The rail draws a page's icon by its name in Lucide's `icons` record, which holds each icon under its
  // current name only: an older alias such as CircleHelp is missing from it, and the rail draws no icon.
  const root = join(process.cwd(), 'content', 'docs');
  const pages = readdirSync(root, { recursive: true })
    .map(String)
    .filter((file) => file.endsWith('.mdx'));
  expect(pages.length).toBeGreaterThan(20);
  const missing = pages.flatMap((file) => {
    const name = /^icon: (\w+)$/m.exec(readFileSync(join(root, file), 'utf8'))?.[1];
    return name !== undefined && !(name in icons) ? [`${file}: ${name}`] : [];
  });
  expect(missing).toEqual([]);
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

/**
 * A drag holding a PDF entering and moving over `target`, as the pointer brings a file from the desktop. The
 * transfer is made in the page; a transfer a script makes allows no operation, so it is made to allow every one,
 * as a drag from another app does (the drop spike's finding).
 */
const dragFilesOver = (target: Locator): Promise<void> =>
  target.evaluate((element) => {
    const data = new DataTransfer();
    data.items.add(new File(['%PDF'], 'invoice.pdf', { type: 'application/pdf' }));
    Object.defineProperty(data, 'effectAllowed', { value: 'all' });
    for (const type of ['dragenter', 'dragover']) {
      element.dispatchEvent(new DragEvent(type, { bubbles: true, cancelable: true, dataTransfer: data }));
    }
  });

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

  test('a chosen range is Highlight at its ends with a Highlight band edge', async ({ page }) => {
    await visit(page, '/docs/components/calendar');
    const system = await systemColors(page);
    const calendar = page
      .locator('.stage .range-calendar')
      .filter({ has: page.locator('[data-selection-start]') })
      .first();
    for (const end of ['[data-selection-start]', '[data-selection-end]']) {
      const drawn = await paint(calendar.locator(`.calendar-day${end} .calendar-day-number`).first());
      expect(drawn.fill, end).toBe(system.highlight);
      expect(drawn.text, end).toBe(system.highlightText);
    }
    const middle = calendar
      .locator('[aria-selected="true"] > .calendar-day:not([data-selection-start]):not([data-selection-end])')
      .first();
    expect(await middle.evaluate((element) => getComputedStyle(element).borderTopColor)).toBe(
      system.highlight,
    );
    expect(await middle.evaluate((element) => getComputedStyle(element).borderBottomColor)).toBe(
      system.highlight,
    );
  });

  test('a focused date segment is Highlight', async ({ page }) => {
    await visit(page, '/docs/components/date-range-picker');
    const system = await systemColors(page);
    const segment = page
      .locator('.stage .date-range-picker .date-segment:not([data-type="literal"])')
      .first();
    await segment.focus();
    const drawn = await paint(segment);
    expect(drawn.fill).toBe(system.highlight);
    expect(drawn.text).toBe(system.highlightText);
  });

  test('an active filter chip is Highlight with HighlightText, and a disabled one GrayText on canvas', async ({
    page,
  }) => {
    // The ink fill is repainted away, so the system's own "on" carries the state; at rest the pill keeps a
    // CanvasText edge, and a disabled one is GrayText.
    await visit(page, '/docs/components/filter-chip');
    const system = await systemColors(page);
    const active = page.locator('.stage .filter-chip[data-active]:not([data-disabled])').first();
    const drawn = await paint(active);
    expect(drawn.fill).toBe(system.highlight);
    expect(drawn.edge).toBe(system.highlight);
    expect(drawn.text).toBe(system.highlightText);
    expect((await paint(active.locator('.filter-chip-clear'))).text).toBe(system.highlightText);
    const rest = page.locator('.stage .filter-chip:not([data-active], [data-disabled])').first();
    expect((await paint(rest)).edge).toBe(system.canvasText);
    const disabled = page.locator('.stage .filter-chip[data-disabled]').first();
    expect((await paint(disabled)).text).toBe(system.grayText);
    // A disabled active chip leaves Highlight, which would say "on" for a control that is off: GrayText on canvas.
    const disabledActive = page.locator('.stage .filter-chip[data-disabled][data-active]').first();
    const off = await paint(disabledActive);
    expect(off.fill).toBe(system.canvas);
    expect(off.text).toBe(system.grayText);
    expect(off.edge).toBe(system.grayText);
  });

  test('a pressed sign button is Highlight and the symbol CanvasText', async ({ page }) => {
    await visit(page, '/docs/components/number-field');
    const system = await systemColors(page);
    const field = page
      .locator('.stage .number-field[data-signed]')
      .filter({ has: page.locator('[aria-pressed="true"]') })
      .first();
    const pressed = await paint(field.locator('.number-field-sign'));
    expect(pressed.fill).toBe(system.highlight);
    expect(pressed.text).toBe(system.highlightText);
    const symbol = await paint(field.locator('.number-field-symbol'));
    expect(symbol.text).toBe(system.canvasText);
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

  test('a progress bar keeps its track outline and fill', async ({ page }) => {
    // The fill is a background, which the repaint would drop: it is drawn in the reader's text color, and the
    // track is outlined so its end shows, as Meter's are.
    await visit(page, '/docs/components/progress-bar');
    const text = await systemColor(page, 'CanvasText');
    const bar = page
      .locator('.stage .progress-bar')
      .filter({ has: page.getByRole('progressbar', { name: 'Uploading invoice.pdf', exact: true }) });
    await expect(bar).toHaveCount(1);
    const track = bar.locator('.progress-bar-track');
    expect(await track.evaluate((element) => getComputedStyle(element).outlineStyle)).toBe('solid');
    expect(await track.evaluate((element) => getComputedStyle(element).outlineColor)).toBe(text);
    expect((await paint(bar.locator('.progress-bar-fill'))).fill).toBe(text);
    // The indeterminate segment too.
    const segment = page.locator('.stage .progress-bar-track[data-indeterminate] .progress-bar-fill');
    await expect(segment).toHaveCount(1);
    expect((await paint(segment)).fill).toBe(text);
  });

  test('a drop zone keeps its dashed edge and its drop target edge', async ({ page }) => {
    // The edges are borders, which the repaint keeps in a system color: the dashed edge in the text color, and a
    // drag holding files over the box in the highlight color, since the 5% wash is gone.
    await visit(page, '/docs/components/file-drop-zone');
    const box = page.locator('.stage .file-drop-zone-box').first();
    const edge = (): Promise<{ style: string; color: string }> =>
      box.evaluate((element) => {
        const style = getComputedStyle(element);
        return { style: style.borderTopStyle, color: style.borderTopColor };
      });
    expect(await edge()).toEqual({ style: 'dashed', color: await systemColor(page, 'CanvasText') });
    await dragFilesOver(box);
    await expect(box).toHaveAttribute('data-drop-target', '');
    expect(await edge()).toEqual({ style: 'solid', color: await systemColor(page, 'Highlight') });
    // On an invalid zone too: the error color is gone, so the solid highlight edge is the only sign of the drag.
    const zone = page.getByRole('group', { name: 'Receipt', exact: true });
    await zone
      .locator('input[type="file"]')
      .setInputFiles({ name: 'blank.pdf', mimeType: 'application/pdf', buffer: Buffer.alloc(0) });
    await expect(zone).toHaveAttribute('data-invalid', '');
    const invalidBox = zone.locator('.file-drop-zone-box');
    await dragFilesOver(invalidBox);
    await expect(invalidBox).toHaveAttribute('data-drop-target', '');
    expect(
      await invalidBox.evaluate((element) => {
        const style = getComputedStyle(element);
        return { style: style.borderTopStyle, color: style.borderTopColor };
      }),
    ).toEqual({ style: 'solid', color: await systemColor(page, 'Highlight') });
  });

  test('a failed row keeps its icon and word', async ({ page }) => {
    // The tone is a color the repaint drops: the icon keeps its shape in the reader's text color, and the word,
    // which carries the status, stays.
    await visit(page, '/docs/components/upload-tray');
    const text = await systemColor(page, 'CanvasText');
    const row = page.locator('.stage .upload-row[data-status="failed"]');
    await expect(row).toHaveCount(1);
    await expect(row.locator('.upload-row-word')).toHaveText('Failed');
    await expect(row.locator('.upload-row-word')).toBeVisible();
    const icon = row.locator('.upload-row-icon svg');
    await expect(icon).toBeVisible();
    expect(await icon.evaluate((element) => getComputedStyle(element).color)).toBe(text);
  });

  test("the recipe's failed row and current crumb keep their words and colors", async ({ page }) => {
    // The Documents recipe on the same page: a file over 10 MB fails in the tray, whose row keeps its word and
    // its icon's shape in the reader's text color; the trail's current page is text in that color too.
    await visit(page, '/docs/components/upload-tray');
    const text = await systemColor(page, 'CanvasText');
    const recipe = page.locator('.stage').filter({ has: page.locator('.page-header') });
    const current = recipe.locator('.breadcrumbs-current');
    await expect(current).toHaveText('Documents');
    expect(await current.evaluate((element) => getComputedStyle(element).color)).toBe(text);
    const chooser = page.waitForEvent('filechooser');
    await recipe.getByRole('button', { name: 'Upload', exact: true }).click();
    await (
      await chooser
    ).setFiles({
      name: 'statement-large.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.alloc(11 * 1024 * 1024),
    });
    const row = page.locator('.upload-tray .upload-row[data-status="failed"]');
    await expect(row).toHaveCount(1, { timeout: 15_000 });
    await expect(row.locator('.upload-row-word')).toHaveText('Failed');
    await expect(row.locator('.upload-row-word')).toBeVisible();
    await expect(row).toContainText('Over 10 MB');
    const icon = row.locator('.upload-row-icon svg');
    await expect(icon).toBeVisible();
    expect(await icon.evaluate((element) => getComputedStyle(element).color)).toBe(text);
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

  test('a description list keeps its rules between rows', async ({ page }) => {
    await visit(page, '/docs/components/description-list');
    const { canvasText } = await systemColors(page);
    const rows = page
      .locator('.stage .description-list[data-dividers]')
      .first()
      .locator('.description-list-item');
    expect(await rows.count()).toBeGreaterThan(1);
    // The rule is on every row after the first, drawn in the reader's text color; none above the first.
    const edges = await rows.evaluateAll((items) =>
      items.map((item) => {
        const style = getComputedStyle(item);
        return { width: style.borderTopWidth, style: style.borderTopStyle, color: style.borderTopColor };
      }),
    );
    expect(edges[0]?.style).toBe('none');
    for (const edge of edges.slice(1)) {
      expect(edge).toEqual({ width: '1px', style: 'solid', color: canvasText });
    }
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

  test('the changed dot of a field with no label is CanvasText', async ({ page }) => {
    // Out of the repaint, so the dot keeps a fill, the reader's text color, and its word stays unseen.
    await visit(page, '/docs/components/field');
    const canvasText = await systemColor(page, 'CanvasText');
    const marks = page.locator('.stage .field-changed-mark');
    expect(await marks.count()).toBeGreaterThan(0);
    for (const mark of await marks.all()) await expect(mark).toHaveCSS('background-color', canvasText);
  });

  test('the selected tab is Highlight and its changed dot HighlightText', async ({ page }) => {
    // The ink fill is repainted away, so the selected tab takes the reader's selection colors; the clay dot is
    // CanvasText on a resting tab and HighlightText on the selected one.
    await visit(page, '/docs/components/tabs');
    const colors = await systemColors(page);
    const example = page.locator('.stage .tabs').filter({ has: page.getByRole('tab', { name: 'Rules' }) });
    const rules = example.getByRole('tab', { name: 'Rules' });
    const dot = rules.locator('.tab-changed');
    await expect(dot).toHaveCSS('background-color', colors.canvasText);
    await rules.click();
    await expect(rules).toHaveAttribute('aria-selected', 'true');
    expect(await paint(rules)).toMatchObject({ fill: colors.highlight, text: colors.highlightText });
    await expect(dot).toHaveCSS('background-color', colors.highlightText);
    const unselected = example.getByRole('tab', { name: 'General' });
    expect((await paint(unselected)).fill).not.toBe(colors.highlight);
  });

  test('the current page is Highlight and a disabled step GrayText', async ({ page }) => {
    // The ink fill is repainted away, so the current page takes the reader's selection colors, and the taupe of a
    // disabled step becomes the reader's disabled color.
    await visit(page, '/docs/components/pagination');
    const example = page.locator('.stage .pagination').first();
    const current = await paint(example.locator('.pagination-page[aria-current]'));
    expect(current.fill).toBe(await systemColor(page, 'Highlight'));
    expect(current.text).toBe(await systemColor(page, 'HighlightText'));
    const previous = example.locator('.pagination-step[data-step="previous"]');
    await expect(previous).toHaveAttribute('aria-disabled', 'true');
    expect((await paint(previous)).text).toBe(await systemColor(page, 'GrayText'));
  });

  test('a skeleton keeps a fill and an empty state icon is CanvasText', async ({ page }) => {
    // A skeleton is only a fill, which the repaint would drop: it opts out and draws CanvasText at 20% over the
    // reader's canvas, so the shape stays. The empty state's text takes the palette on its own, and its icon
    // is named CanvasText so it follows the text.
    await visit(page, '/docs/components/skeleton');
    const canvas = await systemColor(page, 'canvas');
    const skeletons = page.locator('.stage .skeleton');
    expect(await skeletons.count()).toBeGreaterThan(0);
    for (const skeleton of await skeletons.all()) {
      const { fill } = await paint(skeleton);
      expect(fill).not.toMatch(/(?:, 0\)|transparent)$/);
      expect(fill).not.toBe(canvas);
    }
    await visit(page, '/docs/components/empty-state');
    const canvasText = await systemColor(page, 'CanvasText');
    const icons = page.locator('.stage .empty-state-icon');
    expect(await icons.count()).toBeGreaterThan(0);
    for (const icon of await icons.all()) await expect(icon).toHaveCSS('color', canvasText);
    await expect(page.locator('.stage .empty-state-title').first()).toHaveCSS('color', canvasText);
  });

  test('a data table current row draws its bar in CanvasText', async ({ page }) => {
    // The bar is a border at the first shown cell's start, so the repaint keeps it; it is named CanvasText, as the
    // rules are, and the row header's weight still marks the row.
    await visit(page, '/docs/components/data-table');
    const canvasText = await systemColor(page, 'CanvasText');
    const current = page.locator('.stage .data-table-row[data-current]').first();
    await expect(current).toHaveCount(1);
    await expectTableFace(current);
    const first = current.locator('> :first-child');
    await expect(first).toHaveCSS('border-left-color', canvasText);
    await expect(first).toHaveCSS('border-left-width', '3px');
    await expect(current.locator('[role="rowheader"]')).toHaveCSS('font-weight', '700');
    await expect(current.locator('.data-table-link')).toHaveAttribute('aria-current', 'true');
  });

  test('a selected data table row is Highlight with HighlightText as drawn, its text and its ring legible', async ({
    page,
  }) => {
    // A selected row's 8% wash would be repainted away; Highlight is the reader's own selection color, and the
    // checked box still marks the row. The row is drawn out of the forced repaint, so Chromium's backplate never
    // blanks its text, and a focused selected row is ringed HighlightText, which shows on Highlight.
    await visit(page, '/docs/components/data-table');
    const [highlight, highlightText] = [
      await systemColor(page, 'Highlight'),
      await systemColor(page, 'HighlightText'),
    ];
    const stage = page
      .locator('.stage')
      .filter({ has: page.getByRole('checkbox', { name: 'Select all' }) })
      // The selection example, before the recipe's, which selects too.
      .first();
    const row = stage.locator('tbody [role="row"]').first();
    await expectTableFace(row);
    await row.focus();
    await page.keyboard.press('x');
    await expect(row).toHaveAttribute('aria-selected', 'true');
    await expect(row).toHaveCSS('background-color', highlight);
    await expect(row).toHaveCSS('color', highlightText);
    await expect(row.getByRole('checkbox')).toBeChecked();
    // What the reader sees: the payee drawn HighlightText on Highlight, at the system pair's own contrast.
    // Chromium's forced Highlight is translucent, so it is drawn over the canvas behind the table.
    const fill = over(highlight, await systemColor(page, 'canvas'));
    const payee = await drawn(page, row.locator('[role="rowheader"]'));
    expect(payee.fill).toBe(fill);
    expect(payee.ink).toBe(over(highlightText, fill));
    expect(payee.ratio).toBeGreaterThanOrEqual(4.5);
    // The focused row's inset ring along its top edge is HighlightText, not Highlight on Highlight.
    await expect(row).toBeFocused();
    const box = await row.boundingBox();
    if (box === null) throw new Error('No row box');
    const ring = await drawn(page, { x: box.x + 24, y: box.y, width: box.width - 48, height: 2 });
    expect(ring.fill).toBe(over(highlightText, fill));
    // The checked box is drawn inverted, HighlightText with a Highlight mark, and shows on the Highlight fill.
    const checkbox = await drawn(page, row.locator('.checkbox-box'));
    expect(checkbox.fill).toBe(over(highlightText, fill));
    expect(checkbox.ratio).toBeGreaterThanOrEqual(3);
    await expect(stage.locator('.data-table-bar')).toHaveCSS(
      'border-top-color',
      await systemColor(page, 'CanvasText'),
    );
  });

  test('the bulk actions example draws its X and More in CanvasText terms, legible in forced colors', async ({
    page,
  }) => {
    await visit(page, '/docs/components/data-table');
    const stage = page.locator('.stage').filter({ has: page.getByRole('button', { name: 'More actions' }) });
    const bar = stage.getByRole('toolbar', { name: 'Bulk actions' });
    await expect(bar).toHaveCSS('border-top-color', await systemColor(page, 'CanvasText'));
    await expect(bar.getByRole('button', { name: 'More actions' })).toBeVisible();
    await expect(bar.getByRole('button', { name: 'Clear selection' })).toBeVisible();
  });

  test('a selected data table list item is Highlight with HighlightText as drawn, its mark and its box legible', async ({
    page,
  }) => {
    // The list face's selected item is drawn as a selected row is (spec correction 39): out of the forced repaint,
    // the reader's selection pair, its title HighlightText on Highlight. Out of Select mode its mark, and in it
    // its checked box, is drawn inverted, HighlightText with a Highlight check.
    await page.setViewportSize({ width: 375, height: 800 });
    await visit(page, '/docs/components/data-table');
    const [highlight, highlightText] = [
      await systemColor(page, 'Highlight'),
      await systemColor(page, 'HighlightText'),
    ];
    const list = page
      .locator('.stage .data-table-list')
      .filter({ has: page.locator('.data-table-list-mode') });
    const item = list.first().locator('.data-table-item').first();
    await item.scrollIntoViewIfNeeded();
    await item.focus();
    await page.keyboard.press('x');
    await expect(item).toHaveAttribute('aria-selected', 'true');
    await expect(item).toHaveCSS('background-color', highlight);
    await expect(item).toHaveCSS('color', highlightText);
    const fill = over(highlight, await systemColor(page, 'canvas'));
    const title = await drawn(page, item.locator('.data-table-item-title'));
    expect(title.fill).toBe(fill);
    expect(title.ink).toBe(over(highlightText, fill));
    expect(title.ratio).toBeGreaterThanOrEqual(4.5);
    const mark = await drawn(page, item.locator('.data-table-item-mark'));
    expect(mark.fill).toBe(over(highlightText, fill));
    expect(mark.ratio).toBeGreaterThanOrEqual(3);
    // In Select mode the checked box is drawn the same way.
    await list.first().locator('.data-table-list-mode').click();
    const box = await drawn(page, item.locator('.checkbox-box'));
    expect(box.fill).toBe(over(highlightText, fill));
    expect(box.ratio).toBeGreaterThanOrEqual(3);
  });

  /**
   * The parts that draw their text HighlightText on a Highlight fill, each opened to that state: the text as it is
   * drawn. Inside the forced repaint Chromium draws a backplate in the system's background color behind each run of
   * text, which blanked these, so each is drawn out of the repaint, as a selected data table row is.
   */
  const ON_HIGHLIGHT: { name: string; url: string; open: (page: Page) => Promise<Locator> }[] = [
    {
      name: 'the chosen menu row',
      url: '/docs/components/menu',
      open: async (page) => {
        await page.getByRole('button', { name: 'View options' }).click();
        return page.getByRole('menuitemradio', { name: 'System' }).locator('.menu-item-label');
      },
    },
    {
      name: 'the active palette row',
      url: '/docs/components/command-palette',
      open: async (page) => {
        await page.getByRole('button', { name: 'Search the app' }).click();
        await page.getByRole('textbox', { name: 'Search the app' }).pressSequentially('checking');
        return page.getByRole('menuitem', { name: 'Checking' }).locator('.menu-item-label');
      },
    },
    {
      name: 'an active filter chip',
      url: '/docs/components/filter-chip',
      open: (page) =>
        Promise.resolve(
          page.locator('.stage .filter-chip[data-active]:not([data-disabled]) .filter-chip-label').first(),
        ),
    },
    {
      name: "the calendar's chosen day",
      url: '/docs/components/calendar',
      open: (page) =>
        Promise.resolve(
          page
            .locator(
              '.stage .calendar:not(.range-calendar) .calendar-day[data-selected] .calendar-day-number',
            )
            .first(),
        ),
    },
    {
      name: "a range's end",
      url: '/docs/components/calendar',
      open: (page) =>
        Promise.resolve(
          page
            .locator('.stage .range-calendar .calendar-day[data-selection-start] .calendar-day-number')
            .first(),
        ),
    },
    {
      name: 'the chosen preset',
      url: '/docs/components/calendar',
      open: (page) => Promise.resolve(page.locator('.stage .calendar-preset[aria-pressed="true"]').first()),
    },
    {
      name: 'a focused date segment',
      url: '/docs/components/date-range-picker',
      open: async (page) => {
        const segment = page
          .locator('.stage .date-range-picker .date-segment:not([data-type="literal"])')
          .first();
        await segment.focus();
        return segment;
      },
    },
    {
      name: 'the selected tab',
      url: '/docs/components/tabs',
      open: (page) => Promise.resolve(page.locator('.stage .tab[aria-selected="true"] .tab-label').first()),
    },
    {
      name: 'the chosen segmented option',
      url: '/docs/components/segmented-control',
      open: (page) => Promise.resolve(page.locator('.stage .segmented-option[data-selected]').first()),
    },
    {
      name: 'the current page',
      url: '/docs/components/pagination',
      open: (page) => Promise.resolve(page.locator('.stage .pagination-page[aria-current]').first()),
    },
    {
      name: 'the current rail item',
      url: '/docs/components/sidebar',
      open: (page) =>
        Promise.resolve(page.locator('.stage .sidebar-item[aria-current] .sidebar-item-label').first()),
    },
    {
      name: 'the current bottom tab',
      url: '/docs/components/bottom-tab-bar',
      open: (page) =>
        Promise.resolve(page.locator('.stage .tab-bar-item[aria-current] .tab-bar-item-label').first()),
    },
  ];

  for (const { name, url, open } of ON_HIGHLIGHT) {
    test(`${name} draws its text HighlightText on Highlight, with no backplate`, async ({ page }) => {
      await visit(page, url);
      const text = await open(page);
      // Out of the repaint, where no backplate is drawn: forced-color-adjust is inherited by the text.
      await expect(text).toHaveCSS('forced-color-adjust', 'none');
      const fill = over(await systemColor(page, 'Highlight'), await systemColor(page, 'canvas'));
      const drawnText = await drawn(page, text);
      // The fill, not a backplate, is what the text's box mostly shows, and the glyphs are the pair's own color.
      expect(drawnText.fill).toBe(fill);
      expect(drawnText.ink).toBe(over(await systemColor(page, 'HighlightText'), fill));
      expect(drawnText.ratio).toBeGreaterThanOrEqual(4.5);
      expect(drawnText.inkShare).toBeLessThan(0.3);
    });
  }

  test('the rings of a chosen menu row and an active chip show beside the Highlight fill', async ({
    page,
  }) => {
    // Out of the repaint the rings are named: inside the fill HighlightText, outside it on the page Highlight.
    await visit(page, '/docs/components/menu');
    const [highlight, highlightText, canvas] = [
      await systemColor(page, 'Highlight'),
      await systemColor(page, 'HighlightText'),
      await systemColor(page, 'canvas'),
    ];
    const fill = over(highlight, canvas);
    const trigger = page.getByRole('button', { name: 'View options' });
    await trigger.focus();
    await page.keyboard.press('Enter');
    const chosen = page.getByRole('menuitemradio', { name: 'System' });
    // The keyboard opened it, so focus moved onto the chosen row from the keyboard shows the ring.
    await chosen.focus();
    await expect(chosen).toHaveAttribute('data-focus-visible', 'true');
    const row = await chosen.boundingBox();
    if (row === null) throw new Error('No row box');
    const top = await drawn(page, { x: row.x + 12, y: row.y, width: row.width - 24, height: 2 });
    expect(top.fill).toBe(over(highlightText, fill));
    await page.keyboard.press('Escape');
    await visit(page, '/docs/components/filter-chip');
    const chip = page.locator('.stage .filter-chip[data-active]:not([data-disabled])').first();
    await chip.locator('.filter-chip-trigger').focus();
    const box = await chip.boundingBox();
    if (box === null) throw new Error('No chip box');
    // The ring stands 2px out from the pill, 2px wide, over the page.
    const ring = await drawn(page, { x: box.x + 12, y: box.y - 4, width: box.width - 24, height: 2 });
    expect(ring.fill).toBe(fill);
  });

  test('a tag keeps a CanvasText edge', async ({ page }) => {
    // The bone fill is repainted away, so the edge is what draws the pill; a disabled tag is GrayText.
    await visit(page, '/docs/components/multi-select');
    const canvasText = await systemColor(page, 'CanvasText');
    const grayText = await systemColor(page, 'GrayText');
    const tags = page.locator('.stage .multi-select:not([data-disabled]) .multi-select-tag');
    expect(await tags.count()).toBeGreaterThan(0);
    for (const tag of await tags.all()) {
      await expect(tag).toHaveCSS('border-top-color', canvasText);
      await expect(tag).toHaveCSS('border-top-style', 'solid');
      await expect(tag.locator('.multi-select-tag-remove')).toHaveCSS('color', canvasText);
    }
    const disabled = page.locator('.stage .multi-select[data-disabled] .multi-select-tag').first();
    await expect(disabled).toHaveCSS('border-top-color', grayText);
    await expect(disabled).toHaveCSS('color', grayText);
  });

  test('a side panel draws its edge and its footer rule in CanvasText, and rings its heading in Highlight', async ({
    page,
  }) => {
    // The float fill and the lift are repainted away, so the edge is what draws the panel beside the content.
    await visit(page, '/docs/components/side-panel');
    const canvasText = await systemColor(page, 'CanvasText');
    const highlight = await systemColor(page, 'Highlight');
    const panel = page.locator('.stage .side-panel').first();
    await expect(panel).toBeVisible();
    for (const side of ['top', 'right', 'bottom', 'left']) {
      await expect(panel).toHaveCSS(`border-${side}-color`, canvasText);
      await expect(panel).toHaveCSS(`border-${side}-style`, 'solid');
    }
    // The ring a keyboard lands on as the panel opens.
    await page.keyboard.press('Tab');
    const heading = panel.locator('.side-panel-title');
    await heading.focus();
    await expect(heading).toHaveCSS('outline-color', highlight);
    // The footer's divider, in the example with actions, once a row there is opened.
    const second = page.locator('.stage').nth(1);
    await second.locator('.data-table-table .data-table-link').first().click();
    const footer = second.locator('.side-panel-footer');
    await expect(footer).toHaveCSS('border-top-color', canvasText);
  });

  test('the current crumb is canvastext and the links linktext', async ({ page }) => {
    await visit(page, '/docs/components/breadcrumbs');
    const trail = page.locator('.stage .breadcrumbs').first();
    const [linkText, canvasText] = [
      await systemColor(page, 'LinkText'),
      await systemColor(page, 'CanvasText'),
    ];
    for (const link of await trail.locator('.breadcrumbs-link').all())
      expect((await paint(link)).text).toBe(linkText);
    expect((await paint(trail.locator('.breadcrumbs-current'))).text).toBe(canvasText);
    expect((await paint(trail.locator('.breadcrumbs-separator').first())).text).toBe(canvasText);
  });

  test("a page header draws the system's background color with no blur", async ({ page }) => {
    await visit(page, '/docs/components/page-header');
    const header = page.locator('.stage .page-header').first();
    expect((await paint(header)).fill).toBe(await systemColor(page, 'canvas'));
    expect(await header.evaluate((element) => getComputedStyle(element).backdropFilter)).toBe('none');
  });
});

// ---- File drop zone -----------------------------------------------------------------------------

test('the date picker example opens on today and closes with focus on its button', async ({ page }) => {
  await visit(page, '/docs/components/date-picker');
  const field = page.locator('.stage .date-picker').filter({ hasText: 'Paid on' });
  const button = field.getByRole('button', { name: /^Choose date/ });
  await button.click();
  const dialog = page.getByRole('dialog');
  await expect(dialog.locator('.calendar-heading')).toHaveText('October 2026');
  await expect(dialog.locator('.calendar-day-number[data-today]')).toHaveText('16');
  await expect(dialog.getByRole('button', { name: 'Today', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await dialog.getByRole('button', { name: 'Yesterday', exact: true }).click();
  await expect(dialog).toBeHidden();
  await expect(button).toBeFocused();
  await expect(field.locator('.date-segment:not([data-type="literal"])')).toHaveText(['10', '15', '2026']);
});

// ---- Page header and breadcrumbs ---------------------------------------------------------------------

test('a crumb navigates through the router, and at 375 the trail is one back link', async ({ page }) => {
  await visit(page, '/docs/components/page-header');
  const trail = page.locator('.stage').nth(1).getByRole('navigation', { name: 'Breadcrumbs' });
  // The current page is text, the links are the two above it, named by their text: the back words are not drawn.
  const links = trail.getByRole('link');
  await expect(links).toHaveCount(2);
  await expect(links.nth(0)).toHaveAccessibleName('Home');
  await expect(links.nth(1)).toHaveAccessibleName('Documents');
  await expect(trail.locator('.breadcrumbs-current')).toHaveAttribute('aria-current', 'page');
  // A client navigation keeps the page's window: a full load would lose this mark.
  const mark = (): Promise<void> =>
    page.evaluate(() => {
      (window as unknown as { kept: boolean }).kept = true;
    });
  const kept = (): Promise<boolean | undefined> =>
    page.evaluate(() => (window as unknown as { kept?: boolean }).kept);
  await mark();
  await trail.getByRole('link', { name: 'Documents' }).click();
  await expect(page).toHaveURL(/[/]docs[/]components[/]upload-tray$/);
  expect(await kept()).toBe(true);

  await page.setViewportSize({ width: 375, height: 800 });
  await visit(page, '/docs/components/page-header');
  const narrow = page.locator('.stage').nth(1).getByRole('navigation', { name: 'Breadcrumbs' });
  await expect(narrow.getByRole('link')).toHaveCount(1);
  const back = narrow.getByRole('link', { name: 'Back to Documents', exact: true });
  await expect(back).toHaveAttribute('href', '/docs/components/upload-tray');
  // "Back to" is said, not shown: the line draws the chevron and the parent's text.
  await expect(back.locator('.breadcrumbs-text')).toBeVisible();
  expect(
    await back.locator('.breadcrumbs-back-words').evaluate((words) => words.getBoundingClientRect().width),
  ).toBeLessThanOrEqual(1);
  await mark();
  await back.click();
  await expect(page).toHaveURL(/[/]docs[/]components[/]upload-tray$/);
  expect(await kept()).toBe(true);
});

// ---- Save bar -------------------------------------------------------------------------------------

/** The field a control belongs to, its label, description and error line included. */
const fieldOf = (control: Locator): Locator =>
  control.locator('xpath=ancestor::*[contains(concat(" ", normalize-space(@class), " "), " field ")][1]');

test('Cancel on a dirty save bar asks, and Keep editing returns focus to Cancel', async ({ page }) => {
  await visit(page, '/docs/components/save-bar');
  const stage = page.locator('.stage').first();
  const bar = stage.locator('.save-bar');
  await stage.getByRole('textbox', { name: 'Merchant' }).fill('Corner Mart and Co');
  await expect(bar.locator('.save-bar-chip')).toHaveText('Unsaved changes');
  const cancel = bar.getByRole('button', { name: 'Cancel' });
  await cancel.click();
  const question = page.getByRole('alertdialog', { name: 'Discard changes?' });
  await expect(question).toBeVisible();
  await question.getByRole('button', { name: 'Keep editing' }).click();
  await expect(question).toBeHidden();
  await expect(cancel).toBeFocused();
  await expect(bar.locator('.save-bar-chip')).toHaveText('Unsaved changes');
});

test('a focused last field scrolls clear of the save bar', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 640 });
  await visit(page, '/docs/components/save-bar');
  const stage = page.locator('.stage').first();
  const bar = stage.locator('.save-bar');
  const last = stage.locator('input, textarea').last();
  // The example's top in view, so its bar sticks over the fields under it.
  await stage.evaluate((element) => {
    element.scrollIntoView({ block: 'start' });
  });
  // The bar is stuck over the last field before it takes focus.
  const [field, cover] = await Promise.all([last.boundingBox(), bar.boundingBox()]);
  expect((field?.y ?? 0) + (field?.height ?? 0)).toBeGreaterThan(cover?.y ?? 0);
  await last.focus();
  // Its whole field ends 16px, the inset, above the bar; a pixel is allowed for an engine's rounding.
  await expect
    .poll(async () => {
      const [field, cover] = await Promise.all([fieldOf(last).boundingBox(), bar.boundingBox()]);
      return (field?.y ?? 0) + (field?.height ?? 0) - (cover?.y ?? 0);
    })
    .toBeLessThanOrEqual(-16 + 1);
});

test('Tab onto a field under the save bar brings it clear of the bar with a gap', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 640 });
  await visit(page, '/docs/components/save-bar');
  const stage = page.locator('.stage').first();
  const bar = stage.locator('.save-bar');
  await stage.evaluate((element) => {
    element.scrollIntoView({ block: 'start' });
  });
  // The first field the stuck bar covers, and the field before it, which is clear of it.
  const fields = stage.locator('input, textarea');
  const barTop = (await bar.boundingBox())?.y ?? 0;
  let under = -1;
  for (let index = 0; index < (await fields.count()); index += 1) {
    const box = await fields.nth(index).boundingBox();
    if (box && box.y + box.height > barTop) {
      under = index;
      break;
    }
  }
  expect(under).toBeGreaterThan(0);
  await fields.nth(under - 1).focus();
  await page.keyboard.press('Tab');
  const target = fields.nth(under);
  await expect(target).toBeFocused();
  await expect
    .poll(async () => {
      const [field, cover] = await Promise.all([fieldOf(target).boundingBox(), bar.boundingBox()]);
      return (field?.y ?? 0) + (field?.height ?? 0) - (cover?.y ?? 0);
    })
    .toBeLessThanOrEqual(-16 + 1);
});

test('a choice through the receipt field reaches the example and a refusal is said', async ({ page }) => {
  await visit(page, '/docs/components/file-drop-zone');
  const zone = page.getByRole('group', { name: 'Receipt', exact: true });
  const input = zone.locator('input[type="file"]');
  // The field takes one file: a PDF, then an empty one, which the check refuses.
  await input.setInputFiles({
    name: 'invoice.pdf',
    mimeType: 'application/pdf',
    buffer: Buffer.from('%PDF-1.7'),
  });
  await expect(page.locator('.stage .receipt-added')).toHaveText('Added invoice.pdf');
  await expect(zone).not.toHaveAttribute('data-invalid');
  await input.setInputFiles({ name: 'blank.pdf', mimeType: 'application/pdf', buffer: Buffer.alloc(0) });
  await expect(zone.getByRole('status')).toHaveText('1 file was not added: it is empty');
  await expect(zone).toHaveAttribute('data-invalid', '');
  await expect(page.locator('.stage .receipt-added')).toHaveText('Added invoice.pdf');
});

test('the page zone example shows its overlay only while its switch is on', async ({ page }) => {
  await visit(page, '/docs/components/file-drop-zone');
  const enter = (): Promise<void> =>
    page.evaluate(() => {
      const data = new DataTransfer();
      data.items.add(new File(['%PDF'], 'invoice.pdf', { type: 'application/pdf' }));
      document.body.dispatchEvent(
        new DragEvent('dragenter', { bubbles: true, cancelable: true, dataTransfer: data }),
      );
    });
  const leave = (): Promise<void> =>
    page.evaluate(() => {
      document.body.dispatchEvent(new DragEvent('dragend', { bubbles: true }));
    });
  await enter();
  await expect(page.locator('.page-drop-zone')).toHaveCount(0);
  const toggle = page.getByRole('switch', { name: 'Drop anywhere on this page' });
  await page.locator('.stage .switch-text', { hasText: 'Drop anywhere on this page' }).click();
  await expect(toggle).toBeChecked();
  await enter();
  const overlay = page.locator('.page-drop-zone');
  await expect(overlay).toHaveCount(1);
  await expect(overlay).toHaveAttribute('aria-hidden', 'true');
  await expect(overlay.locator('.page-drop-zone-title')).toHaveText('Drop files to upload');
  await leave();
  await expect(overlay).toHaveCount(0);
  await page.locator('.stage .switch-text', { hasText: 'Drop anywhere on this page' }).click();
  await expect(toggle).not.toBeChecked();
  await enter();
  await expect(page.locator('.page-drop-zone')).toHaveCount(0);
});

/**
 * Real files on disk for a real drop, in the test's own output folder: a PDF, an empty PDF, a program and a
 * folder holding a PDF.
 */
const filesOnDisk = (): { pdf: string; blank: string; program: string; folder: string } => {
  const root = test.info().outputPath('drop');
  const folder = join(root, 'scans');
  mkdirSync(folder, { recursive: true });
  const write = (path: string, text: string): string => {
    writeFileSync(path, text);
    return path;
  };
  write(join(folder, 'statement.pdf'), '%PDF-1.7\n');
  return {
    pdf: write(join(root, 'invoice.pdf'), '%PDF-1.7\n'),
    blank: write(join(root, 'blank.pdf'), ''),
    program: write(join(root, 'setup.exe'), 'MZ'),
    folder,
  };
};

/**
 * A real drag of `files` from outside the window, through Chromium's own drag and drop processing by the
 * DevTools protocol: it enters at `at`, moves a few pixels and ends with `end`. This is the only harness that
 * runs the browser's dispatch, which runs the microtasks between one listener and the next as a user's drop
 * does; an event a script dispatches does not, so a play cannot see a part that hides its drop target in a
 * listener before the target's own handler (spec correction 30).
 */
const realDrag = async (
  page: Page,
  at: { x: number; y: number },
  files: string[],
  end: 'drop' | 'dragCancel' | null = 'drop',
): Promise<void> => {
  const cdp = await page.context().newCDPSession(page);
  const data = { items: [], files, dragOperationsMask: 1 };
  const send = (type: string, x: number, y: number): Promise<unknown> =>
    cdp.send('Input.dispatchDragEvent', { type: type as 'dragEnter', x, y, data });
  await send('dragEnter', at.x, at.y);
  for (const step of [1, 2, 3]) await send('dragOver', at.x + step, at.y + step);
  if (end !== null) await send(end, at.x + 3, at.y + 3);
  await cdp.detach();
};

/** The middle of `target` in the viewport, scrolled into view. */
const middleOf = async (target: Locator): Promise<{ x: number; y: number }> => {
  await target.scrollIntoViewIfNeeded();
  const box = await target.boundingBox();
  if (box === null) throw new Error('Not drawn');
  return { x: Math.round(box.x + box.width / 2), y: Math.round(box.y + box.height / 2) };
};

test.describe('a real drop', () => {
  test.skip(({ browserName }) => browserName !== 'chromium', 'The DevTools protocol drives Chromium only.');

  test('on the receipt field adds a PDF, and says why an empty file and a folder were not added', async ({
    page,
  }) => {
    await visit(page, '/docs/components/file-drop-zone');
    const url = page.url();
    const files = filesOnDisk();
    const zone = page.getByRole('group', { name: 'Receipt', exact: true });
    const box = zone.locator('.file-drop-zone-box');
    await realDrag(page, await middleOf(box), [files.pdf], null);
    await expect(box).toHaveAttribute('data-drop-target', '');
    await realDrag(page, await middleOf(box), [files.pdf]);
    await expect(page.locator('.stage .receipt-added')).toHaveText('Added invoice.pdf');
    await expect(box).not.toHaveAttribute('data-drop-target');
    await realDrag(page, await middleOf(box), [files.blank]);
    await expect(zone.getByRole('status')).toHaveText('1 file was not added: it is empty');
    await realDrag(page, await middleOf(box), [files.folder]);
    await expect(zone.getByRole('status')).toHaveText('1 file was not added: its type is not accepted');
    await expect(page.locator('.stage .receipt-added')).toHaveText('Added invoice.pdf');
    expect(page.url()).toBe(url);
  });

  test('on the page overlay reaches the example with the accepted and refused files, and the overlay leaves', async ({
    page,
  }) => {
    await visit(page, '/docs/components/file-drop-zone');
    const url = page.url();
    const files = filesOnDisk();
    await page.locator('.stage .switch-text', { hasText: 'Drop anywhere on this page' }).click();
    await expect(page.getByRole('switch', { name: 'Drop anywhere on this page' })).toBeChecked();
    const added = page.locator('.stage .page-zone-added');
    const at = await middleOf(added);
    // Over the page: the overlay is drawn under the pointer and takes the drag.
    await realDrag(page, at, [files.pdf], null);
    const overlay = page.locator('.page-drop-zone');
    await expect(overlay).toHaveAttribute('data-drop-target', '');
    await realDrag(page, at, [files.pdf, files.program, files.folder]);
    await expect(added).toHaveText('Added invoice.pdf');
    await expect(page.locator('.stage .page-zone-refused')).toHaveText('Not added: setup.exe, scans');
    await expect(overlay).toHaveCount(0);
    expect(page.url()).toBe(url);
  });

  test('cancelled, as with Escape, leaves no overlay once the pointer moves', async ({ page }) => {
    await visit(page, '/docs/components/file-drop-zone');
    const files = filesOnDisk();
    await page.locator('.stage .switch-text', { hasText: 'Drop anywhere on this page' }).click();
    const at = await middleOf(page.locator('.stage .page-zone-added'));
    await realDrag(page, at, [files.pdf], 'dragCancel');
    await page.mouse.move(at.x + 40, at.y + 40);
    await expect(page.locator('.page-drop-zone')).toHaveCount(0);
    // The next drag still shows it, and a drop still lands.
    await realDrag(page, at, [files.pdf]);
    await expect(page.locator('.stage .page-zone-added')).toHaveText('Added invoice.pdf');
    await expect(page.locator('.page-drop-zone')).toHaveCount(0);
  });

  test('over an element that leaves mid-drag, as a toast does, leaves no overlay stuck', async ({ page }) => {
    await visit(page, '/docs/components/file-drop-zone');
    const files = filesOnDisk();
    await page.locator('.stage .switch-text', { hasText: 'Drop anywhere on this page' }).click();
    // A toast above the overlay's layer, in the corner, that goes away while the drag is over it.
    await page.evaluate(() => {
      const toast = document.createElement('div');
      toast.id = 'leaving';
      Object.assign(toast.style, {
        position: 'fixed',
        insetBlockEnd: '0',
        insetInlineEnd: '0',
        width: '200px',
        height: '80px',
        zIndex: '2147483647',
      });
      document.body.append(toast);
    });
    const corner = await middleOf(page.locator('#leaving'));
    const cdp = await page.context().newCDPSession(page);
    const data = { items: [], files: [files.pdf], dragOperationsMask: 1 };
    const send = (type: string, x: number, y: number): Promise<unknown> =>
      cdp.send('Input.dispatchDragEvent', { type: type as 'dragEnter', x, y, data });
    await send('dragEnter', corner.x, corner.y);
    await send('dragOver', corner.x, corner.y);
    await expect(page.locator('.page-drop-zone')).toHaveCount(1);
    await page.evaluate(() => document.getElementById('leaving')?.remove());
    await send('dragOver', corner.x - 300, corner.y - 200);
    await send('dragOver', corner.x - 310, corner.y - 210);
    // Out of the window: the drag's last leave.
    await send('dragOver', -20, -20);
    await expect(page.locator('.page-drop-zone')).toHaveCount(0);
    await cdp.detach();
  });
});

// ---- Props tables -------------------------------------------------------------------------------

/** The data table page's bulk actions example: its stage, with the More button only it starts with. */
const bulkExample = (page: Page): Locator =>
  page.locator('.stage').filter({ has: page.getByRole('button', { name: 'More actions' }) });

/** The names of the open menu's items. */
const menuItems = (page: Page): Promise<string[]> => page.getByRole('menuitem').allTextContents();

test('the bulk actions example puts the rest in More, and every action in More at 375', async ({ page }) => {
  await visit(page, '/docs/components/data-table');
  const stage = bulkExample(page);
  const bar = stage.getByRole('toolbar', { name: 'Bulk actions' });
  await expect(bar).toContainText('2 selected');
  await expect(bar.getByRole('button', { name: 'Categorize' })).toBeVisible();
  await expect(bar.getByRole('button', { name: 'Export' })).toBeVisible();
  await bar.getByRole('button', { name: 'More actions' }).click();
  expect(await menuItems(page)).toEqual(['Archive', 'Delete']);
  await page.getByRole('menuitem', { name: 'Archive' }).click();
  await expect(stage.getByRole('status').filter({ hasText: 'Archived' })).toHaveText(
    'Archived 2 transactions',
  );
  await expect(bar.getByRole('button', { name: 'More actions' })).toBeFocused();
  // On a phone the bar draws no promoted button, and More holds every action, read as it opens.
  await page.setViewportSize({ width: 375, height: 812 });
  await expect(bar.getByRole('button', { name: 'Categorize' })).toBeHidden();
  await bar.getByRole('button', { name: 'More actions' }).click();
  expect(await menuItems(page)).toEqual(['Categorize', 'Export', 'Archive', 'Delete']);
  await page.keyboard.press('Escape');
  // Delete clears the selection, and focus goes to the table, never to the page. The stage is held by its
  // element, since the locator finds it by the More button, which leaves with the bar.
  const held = await stage.elementHandle();
  await bar.getByRole('button', { name: 'More actions' }).click();
  await page.getByRole('menuitem', { name: 'Delete' }).click();
  await expect
    .poll(() => held.evaluate((element) => element.querySelector('.data-table-bar') === null))
    .toBe(true);
  await expect
    .poll(() =>
      held.evaluate((element) => element.querySelector('.data-table')?.contains(document.activeElement)),
    )
    .toBe(true);
});

test('the bulk actions example offers every match once the page is selected', async ({ page }) => {
  await visit(page, '/docs/components/data-table');
  const stage = bulkExample(page);
  await stage.locator('thead .checkbox-box').click();
  const bar = stage.getByRole('toolbar', { name: 'Bulk actions' });
  const all = bar.getByRole('button', { name: 'Select all 24 matching' });
  // The sentence's polite status is mounted empty beside the button, so the sentence is announced once it comes.
  const said = bar.getByRole('status');
  await expect(said).toHaveText('');
  await all.focus();
  await page.keyboard.press('Enter');
  await expect(said).toHaveText('All 24 matching are selected');
  // The button left with focus on it: the next control in the bar has focus.
  await expect(bar.getByRole('button', { name: 'Categorize' })).toBeFocused();
  await bar.getByRole('button', { name: 'Export' }).click();
  await expect(stage.getByRole('status').filter({ hasText: 'Exported' })).toHaveText(
    'Exported 24 transactions',
  );
});

test('the page size example writes the size and the page that keeps the first row to the URL', async ({
  page,
}) => {
  await visit(page, '/docs/components/pagination');
  const nav = page.getByRole('navigation', { name: 'Payment pages' });
  await nav.getByRole('link', { name: 'Page 3', exact: true }).click();
  await expect(page).toHaveURL(/[?&]page=3(&|$)/);
  await expect(nav.locator('.pagination-range')).toHaveText('51 to 75 of 240');
  // By keyboard: Up on the native select chooses 10 in Chromium, and row 51 is on page 6.
  const picker = nav.getByRole('combobox', { name: 'Rows per page' });
  await expect(picker).toHaveValue('25');
  await picker.focus();
  await page.keyboard.press('ArrowUp');
  await expect(page).toHaveURL(/[?&]size=10(&|$)/);
  await expect(page).toHaveURL(/[?&]page=6(&|$)/);
  await expect(nav.locator('.pagination-range')).toHaveText('51 to 60 of 240');
  await expect(picker).toBeFocused();
  await expect(picker).toHaveValue('10');
  // The default size on page 1 writes no parameter, and never a bare ?.
  await picker.selectOption('100');
  await expect(page).toHaveURL(/[?&]size=100(&|$)/);
  expect(new URL(page.url()).searchParams.get('page')).toBeNull();
  await picker.selectOption('25');
  await expect(page).not.toHaveURL(/[?&](size|page)=/);
  expect(page.url()).not.toMatch(/\?$/);
});

test('the page size example puts its picker above the steps at 320 with nothing scrolling sideways', async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 700 });
  await visit(page, '/docs/components/pagination');
  const nav = page.getByRole('navigation', { name: 'Payment pages' });
  const picker = await nav.locator('.pagination-size').boundingBox();
  const next = await nav.locator('.pagination-step[data-step="next"]').boundingBox();
  if (picker === null || next === null) throw new Error('No picker or Next');
  expect(picker.y + picker.height).toBeLessThanOrEqual(next.y + 0.5);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
});

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
  // A crumb's text is the app's and ellipsizes past 16rem on one line, so a long one never pushes the page.
  breadcrumbs: ['.stage .breadcrumbs-text'],
  card: ['.stage .card-title', '.stage .card-note'],
  checkbox: [
    '.stage .field-label',
    '.stage .field-description',
    '.stage .field-error',
    '.stage .checkbox-text',
  ],
  'collapsible-card': [
    '.stage .card-toggle-text',
    '.stage .card-note',
    '.stage .card-collapsible .card-body p',
  ],
  'combo-box': ['.stage .field-label', '.stage .field-description', '.stage .field-error'],
  // At 320px and 375px the examples draw the list face, whose title and meta line ellipsize on one line; a table
  // cell, in the columns example's frame, does too, so a long payee leaves either face inside 320px.
  'data-table': ['.stage .data-table-cell', '.stage .data-table-item-title', '.stage .data-table-item-meta'],
  'date-picker': ['.stage .date-picker .field-label'],
  'date-range-picker': ['.stage .field-label', '.stage .field-description', '.stage .field-error'],
  // A value wraps and breaks a long word anywhere inside its column, in both layouts; nothing truncates.
  'description-list': ['.stage .description-list-value'],
  // The title and the line are the app's sentences, and both wrap at any character inside the column.
  'empty-state': ['.stage .empty-state-title', '.stage .empty-state-description'],
  field: ['.stage .field-label', '.stage .field-description', '.stage .field-error', '.stage .field-changed'],
  // The label and the rules are the app's; the hint and the button are the library's short words.
  'file-drop-zone': ['.stage .file-drop-zone .field-label', '.stage .file-drop-zone .field-description'],
  // A chip's value stays on one line and ellipsizes past 16rem, so the pill stays inside 320px.
  'filter-chip': ['.stage .filter-chip-value'],
  kbd: ['.stage .kbd'],
  // The legend names the series in the app's words, and wraps at any character, as the meter's legend does.
  'line-chart': ['.stage .line-chart-legend-label'],
  link: ['.stage .link'],
  meter: ['.stage .meter-label', '.stage .meter-value', '.stage .meter-legend-label'],
  'multi-select': ['.stage .field-label', '.stage .field-description', '.stage .multi-select-tag-text'],
  'number-field': ['.stage .field-label', '.stage .field-description', '.stage .field-error'],
  // The title wraps at any character and is never cut; the sentence wraps inside its measure.
  'page-header': ['.stage .page-header-title', '.stage .page-header-description'],
  // The range is the app's sentence; the page numbers and the step words are the library's and never long.
  pagination: ['.stage .pagination-range'],
  // The label is the app's sentence, a file name among it, and wraps at any character, as the meter's does.
  'progress-bar': ['.stage .progress-bar-label'],
  'radio-group': [
    '.stage .field-label',
    '.stage .field-description',
    '.stage .field-error',
    '.stage .radio-text',
  ],
  // The sentence is the app's, clamped to two lines, and wraps at any character inside them.
  'save-bar': ['.stage .save-bar-message'],
  'search-field': ['.stage .field-label', '.stage .field-description', '.stage .field-error'],
  'segmented-control': ['.stage .field-label', '.stage .segmented-label'],
  // The chosen option's label stays on one line in the trigger and ellipsizes, so it never pushes the page.
  select: ['.stage .field-label', '.stage .field-description', '.stage .select-value-label'],
  sidebar: ['.stage .sidebar-item-label'],
  'stat-tile': ['.stage .stat-tile-label', '.stage .stat-tile-change-label', '.stage .stat-tile-caption'],
  switch: ['.stage .switch-text', '.stage .field-description'],
  // A long name scrolls the row inside its track; a panel's text wraps by the page's own rules.
  tabs: ['.stage .tab-label', '.stage .tab-panel p'],
  'text-area': ['.stage .field-label', '.stage .field-description', '.stage .field-error'],
  'text-field': ['.stage .field-label', '.stage .field-description', '.stage .field-error'],
  // A numeral is a figure and never wraps (white-space: nowrap), so a web address is not put into one.
  typography: ['.stage .heading', '.stage .copy:not(.copy-numeral, .copy-numeral-sm)', '.stage .eyebrow'],
  // A file name is the reader's; its stem ellipsizes and its extension stays.
  'upload-tray': ['.stage .upload-row-stem'],
};

/** The pages with no text a person writes, each with its reason. A page is in one list or the other. */
const NO_LONG_TEXT: Record<string, string> = {
  avatar: 'two initials in a fixed box; the name is an aria-label that nothing draws',
  'bottom-tab-bar':
    'a tab label is one word on one line and ellipsizes as a last resort; the name holds the full label',
  button: 'a label is a short command on one line by design (white-space: nowrap), not text that wraps',
  calendar: 'a calendar draws dates and the app preset words, which wrap as pills',
  'command-palette':
    "its text is in a portal that opens on a press or a key; the Narrow story's 375px baseline pins its wrapping",
  'confirm-dialog':
    "its text is in a portal that opens on a press; its stories' 375px baselines pin its wrapping",
  dialog: 'its text is in a portal that opens on a press; the 375px stories pin its wrapping',
  drawer: 'its text is in a portal that opens on a press; the 375px stories pin its wrapping',
  'filter-bar': 'its words are the chips and the app search, which the filter chip page tests long',
  'icon-button': 'a glyph and no text: its name is an aria-label that nothing draws',
  menu: "its text is in a portal that opens on a press; the EndValues story's 375px baseline pins its wrapping",
  popover: 'its text is in a portal that opens on a press; the 375px stories pin its wrapping',
  sheet: 'its text is in a portal that opens on a press; the 375px stories pin its wrapping',
  'side-panel':
    'under 1024px the panel is a sheet that opens on a press; the 1280px baselines pin the aside wrapping',
  skeleton: 'a skeleton draws shapes and no text',
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

test('a description list in a flex: 1 or a 1fr wrapper keeps a 320px page from scrolling sideways', async ({
  page,
}) => {
  // A size container's stand-in width is also its min-content width, which a flex: 1 item or a 1fr track gives
  // the list as its narrowest. 16rem fits the 288px column inside a 320px phone's margins; 20rem did not.
  await page.setViewportSize({ width: 320, height: 800 });
  await visit(page, '/docs/components/description-list');
  const column = page.locator('.panel-main').first();
  const list =
    '<dl class="description-list" data-layout="auto" data-dividers="">' +
    '<div class="description-list-item"><dt class="description-list-term">Name</dt>' +
    '<dd class="description-list-value">Everyday Visa</dd></div></dl>';
  await column.evaluate((element, markup) => {
    element.insertAdjacentHTML(
      'afterbegin',
      `<div data-wrapper="flex" style="display: flex"><div style="flex: 1">${markup}</div></div>` +
        `<div data-wrapper="grid" style="display: grid; grid-template-columns: 1fr"><div>${markup}</div></div>`,
    );
  }, list);
  const columnBox = await column.boundingBox();
  if (!columnBox) throw new Error('No column');
  for (const wrapper of ['flex', 'grid']) {
    const box = await page.locator(`[data-wrapper="${wrapper}"] .description-list`).boundingBox();
    if (!box) throw new Error(`No list in the ${wrapper} wrapper`);
    expect(box.x + box.width, wrapper).toBeLessThanOrEqual(columnBox.x + columnBox.width + 0.5);
  }
  expect(await sideways(page)).toBe(0);
});

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

for (const { slug, url } of PAGES) {
  test(`the ${slug} page has one h1, its own title`, async ({ page }) => {
    // An example of a page's header is not this page's, so it takes a lower level (PageHeader's headingLevel).
    await visit(page, url);
    await expect(page.locator('h1')).toHaveCount(1);
  });
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
  // Real links in the server's HTML, both faces: the trail works before hydration and with scripts off.
  breadcrumbs: ['.stage .breadcrumbs a[href]'],
  button: ['.stage .button'],
  // With scripts off an inline calendar is its face: an empty frame of its final size.
  calendar: ['.stage .calendar[data-face]'],
  card: ['.stage .card', '.stage .card-title', '.stage .card-note'],
  checkbox: ['.stage .checkbox-box'],
  'collapsible-card': ['.stage .card-collapsible', '.stage .card-toggle', '.stage .card-chevron'],
  // The input and its button; the list renders nothing until it opens.
  'combo-box': ['.stage .combo-box-input', '.stage .combo-box-button'],
  'command-palette': ['.stage .button'],
  'confirm-dialog': ['.stage .button'],
  // The header and the row links: every row is in the server's HTML; the loading status waits for a pause.
  // The list face's items are in it too: both faces are, and the box shows one.
  'data-table': [
    '.stage .data-table-table thead',
    '.stage .data-table-link',
    '.stage .data-table-list [role="row"]',
  ],
  // The frame and its button, with the app's valueLabel where the segments go; the calendar waits for a press.
  'date-picker': ['.stage .date-picker-control', '.stage .date-picker-button'],
  'date-range-picker': ['.stage .date-range-control', '.stage .date-range-button'],
  // A static part: the whole list, its empty words and its numeric values are in the server's HTML.
  'description-list': [
    '.stage dl.description-list',
    '.stage .description-list-value[data-empty]',
    '.stage .description-list-value[data-numeric]',
  ],
  dialog: ['.stage .button'],
  drawer: ['.stage .button'],
  // A static part: the whole column is in the server's HTML.
  'empty-state': ['.stage .empty-state', '.stage .empty-state-title'],
  field: ['.stage .field-counter', '.stage .field-changed'],
  // The box with both lines and the zone's button; drag and drop and paste wait for hydration.
  'file-drop-zone': ['.stage .file-drop-zone-box', '.stage .file-drop-zone button'],
  // The row with its chips, and the Filters button a phone shows; More's panel and the sheet wait for a press.
  'filter-bar': ['.stage .filter-bar-row', '.stage .filter-bar-sheet-button'],
  // The pill and an active chip's summary, from React Aria's hidden pass; the list renders nothing until it opens.
  'filter-chip': ['.stage .filter-chip-trigger', '.stage .filter-chip-value'],
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
  'multi-select': ['.stage .multi-select-control', '.stage .multi-select-tag'],
  // The figure is the server face's plain text, and the symbol is drawn beside it.
  'number-field': ['.stage .number-field-input', '.stage .number-field-symbol'],
  // A static part: the header and its h1 are in the server's HTML.
  'page-header': ['.stage .page-header .page-header-title'],
  // The row and the current page are in the server's HTML; the shell is a server component.
  pagination: ['.stage .pagination', '.stage .pagination-page[aria-current]'],
  popover: ['.stage .button'],
  // A static part: the track with its role and values is in the server's HTML.
  'progress-bar': ['.stage .progress-bar-track[role="progressbar"]'],
  'radio-group': ['.stage .radio-indicator'],
  // The bar, its sentence and its buttons, and the polite status host, mounted empty before any status.
  'save-bar': ['.stage .save-bar', '.stage .save-bar-status[role="status"]'],
  'search-field': ['.stage .search-field-input', '.stage .search-field-icon'],
  'segmented-control': ['.stage .segmented-option'],
  // The trigger and the value it shows; the list renders nothing until it opens.
  select: ['.stage .select-trigger', '.stage .select-value'],
  sheet: ['.stage .button'],
  // The layout and the open aside, its heading and its body: the basic example is open, and the aside is in the
  // server's HTML; the sheet mounts only after hydration.
  'side-panel': ['.stage .side-panel-layout', '.stage .side-panel', '.stage .side-panel-title'],
  sidebar: ['.stage .sidebar'],
  // A static part: the shapes are in the server's HTML, hidden from assistive technology.
  skeleton: ['.stage .skeleton'],
  sparkline: ['.stage .sparkline svg .sparkline-line'],
  spinner: ['.stage .spinner'],
  'stat-tile': ['.stage .stat-tile', '.stage .stat-tile-value', '.stage .stat-tile-change'],
  switch: ['.stage .switch-thumb'],
  // The row, the selected tab and its panel: the whole selected state is in the server's HTML.
  tabs: ['.stage .tab-list', '.stage .tab[aria-selected="true"]', '.stage .tab-panel'],
  'text-area': ['.stage .textarea'],
  'text-field': ['.stage .input'],
  // The buttons that raise the toasts, and the polite status host the docs layout mounts, which is in the page
  // before any toast.
  toast: ['.stage .button', '.toast-status-host'],
  // The triggers; a tip opens on hover or focus, so none is in the page before a script runs.
  tooltip: ['.stage .icon-button'],
  typography: ['.stage .heading', '.stage .copy', '.stage .copy-numeral', '.stage .eyebrow'],
  // The list and its rows, links and buttons; the tray itself draws only once an app gives it items.
  'upload-tray': ['.stage .upload-list', '.stage .upload-row'],
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
