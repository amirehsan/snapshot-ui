import { expect, test, type Locator, type Page } from '@playwright/test';
import { axeViolations, COMPONENT_PAGES, settled, sideways } from './support';

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

/** The slug of every page in the Components section, in the rail's order. */
const SLUGS = COMPONENT_PAGES.map(({ slug }) => slug);

test('the Components section lists the pages the loops below visit', () => {
  expect(SLUGS.length).toBeGreaterThanOrEqual(15);
  expect(SLUGS).toContain('switch');
  expect(SLUGS).toContain('segmented-control');
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
});

// ---- Props tables -------------------------------------------------------------------------------

test('every props table on a component page has a name of its own', async ({ page }) => {
  // A page with several tables names each one, so a screen reader's list of tables tells them apart.
  for (const slug of SLUGS) {
    await page.goto(`/docs/components/${slug}`);
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
  badge: ['.stage .badge'],
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
  field: ['.stage .field-label', '.stage .field-description', '.stage .field-error', '.stage .field-changed'],
  kbd: ['.stage .kbd'],
  link: ['.stage .link'],
  'radio-group': [
    '.stage .field-label',
    '.stage .field-description',
    '.stage .field-error',
    '.stage .radio-text',
  ],
  'segmented-control': ['.stage .field-label', '.stage .segmented-label'],
  switch: ['.stage .switch-text', '.stage .field-description'],
  'text-area': ['.stage .field-label', '.stage .field-description', '.stage .field-error'],
  'text-field': ['.stage .field-label', '.stage .field-description', '.stage .field-error'],
  // A numeral is a figure and never wraps (white-space: nowrap), so a web address is not put into one.
  typography: ['.stage .heading', '.stage .copy:not(.copy-numeral, .copy-numeral-sm)', '.stage .eyebrow'],
};

/** The pages with no text a person writes, each with its reason. A page is in one list or the other. */
const NO_LONG_TEXT: Record<string, string> = {
  button: 'a label is a short command on one line by design (white-space: nowrap), not text that wraps',
  'confirm-dialog':
    "its text is in a portal that opens on a press; its stories' 375px baselines pin its wrapping",
  dialog: 'its text is in a portal that opens on a press; the 375px stories pin its wrapping',
  'icon-button': 'a glyph and no text: its name is an aria-label that nothing draws',
  spinner: 'a progress mark with no text a person writes',
};

test('every component page is given long text, or is listed as having none', () => {
  // A page added to the rail must be in one list, so it cannot skip the narrow-screen check by omission.
  expect([...Object.keys(LONG_TARGETS), ...Object.keys(NO_LONG_TEXT)].sort()).toEqual([...SLUGS].sort());
});

for (const slug of SLUGS) {
  test(`the ${slug} page fits 320px and 375px, with a long web address in its text`, async ({ page }) => {
    for (const width of [320, 375]) {
      await page.setViewportSize({ width, height: 800 });
      await visit(page, `/docs/components/${slug}`);
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

for (const slug of SLUGS) {
  for (const theme of ['light', 'dark'] as const) {
    test(`the ${slug} page has no axe violations in ${theme}`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: theme });
      await visit(page, `/docs/components/${slug}`);
      await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
      expect(await axeViolations(page)).toEqual([]);
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
  badge: ['.stage .badge'],
  button: ['.stage .button'],
  card: ['.stage .card', '.stage .card-title', '.stage .card-note'],
  checkbox: ['.stage .checkbox-box'],
  'collapsible-card': ['.stage .card-collapsible', '.stage .card-toggle', '.stage .card-chevron'],
  'confirm-dialog': ['.stage .button'],
  dialog: ['.stage .button'],
  field: ['.stage .field-counter', '.stage .field-changed'],
  'icon-button': ['.stage .icon-button'],
  kbd: ['.stage .kbd'],
  link: ['.stage .link'],
  'radio-group': ['.stage .radio-indicator'],
  'segmented-control': ['.stage .segmented-option'],
  spinner: ['.stage .spinner'],
  switch: ['.stage .switch-thumb'],
  'text-area': ['.stage .textarea'],
  'text-field': ['.stage .input'],
  typography: ['.stage .heading', '.stage .copy', '.stage .copy-numeral', '.stage .eyebrow'],
};

test('every component page is listed as server rendered', () => {
  // A page added to the rail must say what its examples draw, so it cannot skip this check.
  expect(Object.keys(SERVER_RENDERED).sort()).toEqual([...SLUGS].sort());
});

test.describe('without JavaScript', () => {
  test.use({ javaScriptEnabled: false });

  for (const slug of SLUGS) {
    test(`the ${slug} page arrives from the server with its examples drawn`, async ({ page }) => {
      await page.goto(`/docs/components/${slug}`);
      for (const selector of SERVER_RENDERED[slug] ?? []) {
        expect(await page.locator(selector).count(), `${selector} on the ${slug} page`).toBeGreaterThan(0);
      }
      // The page's own chrome comes from server components as well: a static Badge and a client Link.
      await expect(page.locator('.panel-side .badge')).toHaveCount(1);
      await expect(page.locator('.panel-side .link').first()).toHaveAttribute('href', /^https:\/\//);
    });
  }
});
