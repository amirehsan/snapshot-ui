import { expect, test, type Locator, type Page } from '@playwright/test';
import {
  axeViolations,
  COMPONENT_PAGES,
  cornersSettled,
  hitSize,
  sideways,
  withoutClipboard,
} from './support';

/** Opens the homepage and waits for its Corners switch to settle, which happens once the page has hydrated. */
const visit = async (page: Page): Promise<void> => {
  await page.goto('/');
  await cornersSettled(page);
};

/** Opens the phone menu and waits for its dialog. */
const openMenu = async (page: Page): Promise<Locator> => {
  await page.getByRole('button', { name: 'Open menu' }).click();
  const menu = page.getByRole('dialog', { name: 'Site menu' });
  await expect(menu).toBeVisible();
  return menu;
};

/** Whether focus is inside the open menu. */
const focusInMenu = (page: Page): Promise<boolean> =>
  page.evaluate(() => document.activeElement?.closest('#nav-overlay') != null);

/** Opens every footer column, as a phone's visitor would. */
const openFooterColumns = async (page: Page): Promise<void> => {
  await expect(page.locator('.footer-col[open]')).toHaveCount(0);
  for (const summary of await page.locator('.footer-col summary').all()) await summary.click();
  await expect(page.locator('.footer-col[open]')).toHaveCount(4);
};

for (const width of [375, 768, 1024, 1440]) {
  test(`the homepage fits ${String(width)}px with no sideways scroll`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await visit(page);
    expect(await sideways(page)).toBe(0);
  });
}

for (const theme of ['light', 'dark'] as const) {
  test(`the homepage has no axe violations in ${theme}`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: theme });
    await visit(page);
    await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
    expect(await axeViolations(page)).toEqual([]);
  });
}

for (const theme of ['light', 'dark'] as const) {
  test(`the open phone menu has no axe violations in ${theme}`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: theme });
    await page.setViewportSize({ width: 375, height: 812 });
    await visit(page);
    await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
    await openMenu(page);
    expect(await axeViolations(page)).toEqual([]);
  });

  test(`the footer columns opened on a phone have no axe violations in ${theme}`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: theme });
    await page.setViewportSize({ width: 375, height: 812 });
    await visit(page);
    await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
    await openFooterColumns(page);
    expect(await axeViolations(page)).toEqual([]);
  });
}

test('the workspace field is labelled, shows its Changed chip and reads it with the field', async ({
  page,
}) => {
  await visit(page);
  const input = page.getByRole('textbox', { name: 'Workspace name' });
  await expect(input).toHaveValue('Northwind Studio');
  await expect(input).toHaveAccessibleDescription('Pick a name your team will recognize. Changed');
  await expect(page.locator('.field').filter({ has: input }).locator('.field-changed')).toBeVisible();
  // The card is a light card on a dark frame: the edge is light signal orange in both themes.
  await expect(input).toHaveCSS('border-top-color', 'rgb(243, 115, 56)');
  // Each axis tile has a named input of its own.
  await expect(page.getByRole('textbox', { name: 'Search settings' })).toHaveCount(6);
});

test('the homepage switches are real switches: named, described, on or off as drawn, and hit at 40px', async ({
  page,
}) => {
  await visit(page);
  const frame = page.locator('.frame-card').first();
  const product = frame.getByRole('switch', { name: 'Product updates', exact: true });
  const digest = frame.getByRole('switch', { name: 'Weekly digest', exact: true });
  const alerts = frame.getByRole('switch', { name: 'Security alerts', exact: true });
  await expect(product).toBeChecked();
  await expect(digest).not.toBeChecked();
  await expect(alerts).toBeChecked();
  await expect(product).toHaveAccessibleDescription('A short note when something ships.');
  // A press on the label flips the switch, and the row keeps its 40px target.
  await frame.getByText('Weekly digest', { exact: true }).click();
  await expect(digest).toBeChecked();
  const row = frame
    .locator('.switch')
    .filter({ has: page.getByRole('switch', { name: 'Weekly digest', exact: true }) });
  expect((await hitSize(row)).height).toBeGreaterThanOrEqual(40);
  // Each axis tile has one, named Sample and on.
  const samples = page.getByRole('switch', { name: 'Sample', exact: true });
  await expect(samples).toHaveCount(6);
  for (const sample of await samples.all()) await expect(sample).toBeChecked();
});

test('the footer lists every component page in the rail order, and a catalog chip with a page links to it', async ({
  page,
}) => {
  await visit(page);
  const column = page
    .locator('.footer-col')
    .filter({ has: page.locator('summary', { hasText: 'Components' }) });
  const listed = await column
    .locator('.footer-links a')
    .evaluateAll((links) =>
      links.map((link) => ({ href: link.getAttribute('href'), name: link.textContent })),
    );
  expect(listed).toEqual(
    COMPONENT_PAGES.map(({ slug, title }) => ({ href: `/docs/components/${slug}`, name: title })),
  );

  // A chip is a link when the catalog's component has a page, and plain text while it does not.
  const slugs = new Map(COMPONENT_PAGES.map(({ slug, title }) => [title.toLowerCase(), slug]));
  const chips = await page
    .locator('.catalog .chip')
    .evaluateAll((elements) =>
      elements.map((element) => ({ name: element.textContent.trim(), href: element.getAttribute('href') })),
    );
  for (const chip of chips) {
    const slug = slugs.get(chip.name.toLowerCase());
    expect(chip.href, chip.name).toBe(slug ? `/docs/components/${slug}` : null);
  }
  // Button, Icon button and the six form controls have pages.
  expect(chips.filter((chip) => chip.href)).toHaveLength(8);
});

test('the homepage switches corners and remembers them', async ({ page }) => {
  await visit(page);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'Calm interfaces for settings, dashboards and apps.',
  );
  await page.locator('label', { hasText: 'Square' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-shape', 'square');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-shape', 'square');
});

test('on a phone the menu opens full screen and Escape closes it', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await visit(page);
  const open = page.getByRole('button', { name: 'Open menu' });
  await open.click();
  const menu = page.getByRole('navigation', { name: 'Menu' });
  await expect(menu).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(menu).toBeHidden();
  await expect(open).toBeFocused();
});

test('the open phone menu is a modal dialog: Tab stays inside it and the page behind is inert', async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await visit(page);
  const menu = await openMenu(page);
  await expect(menu).toHaveAttribute('aria-modal', 'true');
  await expect(page.getByRole('navigation', { name: 'Menu' })).toBeVisible();
  // Each part of the page is inert on its own: the bar is sticky, so nothing wraps them.
  for (const behind of ['.nav-wrap', 'main', 'footer']) {
    await expect(page.locator(behind)).toHaveAttribute('inert', '');
  }
  await expect(page.getByRole('button', { name: 'Close menu' })).toBeFocused();

  // Tab and Shift+Tab stay inside the menu, past both ends of it.
  for (let press = 0; press < 12; press += 1) {
    await page.keyboard.press('Tab');
    expect(await focusInMenu(page)).toBe(true);
  }
  for (let press = 0; press < 12; press += 1) {
    await page.keyboard.press('Shift+Tab');
    expect(await focusInMenu(page)).toBe(true);
  }

  await page.keyboard.press('Escape');
  await expect(menu).toBeHidden();
  for (const behind of ['.nav-wrap', 'main', 'footer']) {
    await expect(page.locator(behind)).not.toHaveAttribute('inert');
  }
  await expect(page.getByRole('button', { name: 'Open menu' })).toBeFocused();
});

test('widening the window past 1024px closes the menu and leaves focus in the bar', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await visit(page);
  const menu = await openMenu(page);
  await expect(page.locator('body')).toHaveCSS('overflow', 'hidden');

  await page.setViewportSize({ width: 1300, height: 900 });
  await expect(menu).toBeHidden();
  await expect(page.locator('body')).not.toHaveCSS('overflow', 'hidden');
  await expect(page.locator('main')).not.toHaveAttribute('inert');
  // The menu button is gone at this width, so focus goes to the first link in the bar.
  expect(await page.evaluate(() => document.activeElement === document.body)).toBe(false);
  await expect(page.locator('.nav-links a').first()).toBeFocused();
});

test('the footer columns fold and unfold with the window width', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await visit(page);
  const summaries = page.locator('.footer-col summary');
  await expect(page.locator('.footer-col[open]')).toHaveCount(0);
  for (const summary of await summaries.all()) await expect(summary).not.toHaveAttribute('tabindex');

  // Widened, or turned to landscape: every column opens, and its summary is no focus stop.
  await page.setViewportSize({ width: 900, height: 812 });
  await expect(page.locator('.footer-col[open]')).toHaveCount(4);
  for (const summary of await summaries.all()) await expect(summary).toHaveAttribute('tabindex', '-1');
  for (const name of ['GitHub', 'Discussions', 'Changelog', 'Security', 'MIT License']) {
    await expect(page.locator('footer').getByRole('link', { name })).toBeVisible();
  }

  await page.setViewportSize({ width: 375, height: 812 });
  await expect(page.locator('.footer-col[open]')).toHaveCount(0);
  for (const summary of await summaries.all()) await expect(summary).not.toHaveAttribute('tabindex');
});

test('the install command is a keyboard stop only where it scrolls sideways', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await visit(page);
  const command = page.getByRole('group', { name: 'Install command' });
  await expect(command).toHaveAttribute('tabindex', '0');
  expect(await command.evaluate((element) => element.scrollWidth > element.clientWidth)).toBe(true);
  await command.focus();
  await expect(command).toBeFocused();

  await page.setViewportSize({ width: 900, height: 812 });
  await expect(command).not.toHaveAttribute('tabindex');
  expect(await command.evaluate((element) => element.scrollWidth > element.clientWidth)).toBe(false);
});

test('the footer arrows are hidden from screen readers', async ({ page }) => {
  await visit(page);
  await expect(page.locator('footer').getByRole('link', { name: 'GitHub', exact: true })).toBeVisible();
  await expect(page.locator('footer').getByRole('link', { name: 'Discussions', exact: true })).toBeVisible();
});

test('the copy button reports that the install command was copied', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await visit(page);
  const install = page.locator('.install');
  await expect(install.getByRole('status')).toHaveText('');
  await install.getByRole('button', { name: 'Copy install command' }).click();
  await expect(install.getByRole('status')).toHaveText('Copied');
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
    'pnpm add @snapshot-ui/react @snapshot-ui/core',
  );
  await expect(install.getByRole('status')).toHaveText('', { timeout: 5000 });
});

for (const mode of ['missing', 'refusing'] as const) {
  test(`the copy button reports a failure when the clipboard is ${mode}`, async ({ page }) => {
    await withoutClipboard(page, mode);
    await visit(page);
    const install = page.locator('.install');
    await install.getByRole('button', { name: 'Copy install command' }).click();
    await expect(install.getByRole('status')).toHaveText('Copy failed');
  });
}

test('choosing a link in the open menu leaves the next page able to scroll', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await visit(page);
  await page.getByRole('button', { name: 'Open menu' }).click();
  await expect(page.locator('body')).toHaveCSS('overflow', 'hidden');
  await page.getByRole('navigation', { name: 'Menu' }).getByRole('link', { name: 'Docs' }).click();
  await expect(page).toHaveURL(/\/docs$/);
  await expect(page.locator('body')).not.toHaveCSS('overflow', 'hidden');
  await page.mouse.wheel(0, 600);
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(0);
});

/**
 * What a pointer or finger must be able to hit on the homepage. No link here sits inside a sentence.
 * A switch is its row, a label that holds a visually hidden input, so the row is what is counted. The
 * three in the settings card are the exception: each lends its parts to the row's grid and has no box
 * of its own, so it is skipped here, and the switch test above measures the hit area it draws instead.
 */
const CONTROLS = 'a[href], button, summary, .segmented-option, .switch';

/**
 * The fewest controls the page and the open menu have on a phone and on a desktop. On a production
 * build the page has 76 on a phone, with the footer open, and 77 on a desktop, the settings card's
 * switches aside; the floor is 3 under the smaller.
 */
const CHECKED_ON_PAGE = 73;
const CHECKED_IN_MENU = 6;

/**
 * What was checked inside `root`, and which controls are hit smaller than 40px, as "name: WxH". A
 * control is hit at its own box, or at its ::before or ::after when that is larger. Where the box
 * falls short, a point just past the drawn edge must still land on the control, so the extra area
 * is known to sit around it and not somewhere else.
 */
const hitTargets = (page: Page, root: string): Promise<{ checked: number; small: string[] }> =>
  page.evaluate(
    ([scope, selector]) => {
      const small: string[] = [];
      let checked = 0;
      for (const element of document.querySelector(scope)?.querySelectorAll(selector) ?? []) {
        const box = element.getBoundingClientRect();
        const style = getComputedStyle(element);
        if (box.width === 0 || box.height === 0 || style.visibility === 'hidden') continue;
        // A summary that cannot be clicked is not a target.
        if (style.pointerEvents === 'none') continue;
        checked += 1;

        element.scrollIntoView({ block: 'center', inline: 'center' });
        const areas = [getComputedStyle(element, '::before'), getComputedStyle(element, '::after')];
        const width = Math.max(box.width, ...areas.map((area) => parseFloat(area.width) || 0));
        const height = Math.max(box.height, ...areas.map((area) => parseFloat(area.height) || 0));

        const reach = 1;
        const probes: [number, number][] = [];
        if (box.height < 40) probes.push([0, box.height / 2 + reach], [0, -box.height / 2 - reach]);
        if (box.width < 40) probes.push([box.width / 2 + reach, 0], [-box.width / 2 - reach, 0]);
        const now = element.getBoundingClientRect();
        const misses = probes.filter(([dx, dy]) => {
          const hit = document.elementFromPoint(now.left + now.width / 2 + dx, now.top + now.height / 2 + dy);
          return hit?.closest(selector) !== element;
        });

        if (width < 40 || height < 40 || misses.length > 0) {
          const name = (element.getAttribute('aria-label') ?? element.textContent).trim().slice(0, 24);
          small.push(`${name}: ${String(Math.round(width))}x${String(Math.round(height))}`);
        }
      }
      return { checked, small };
    },
    [root, CONTROLS] as const,
  );

for (const width of [375, 1440]) {
  test(`every control on the homepage is hit at 40px at ${String(width)}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await visit(page);
    // The footer folds into columns on a phone; open each so its links count too.
    if (width < 768) await openFooterColumns(page);
    // A count, so a selector that stops matching cannot pass as a page with nothing to fix.
    const body = await hitTargets(page, 'body');
    expect(body.checked).toBeGreaterThanOrEqual(CHECKED_ON_PAGE);
    expect(body.small).toEqual([]);

    if (width < 1024) {
      await openMenu(page);
      const overlay = await hitTargets(page, '.nav-overlay');
      expect(overlay.checked).toBeGreaterThanOrEqual(CHECKED_IN_MENU);
      expect(overlay.small).toEqual([]);
    }
  });
}

test('the homepage frame has a labelled Theme control of its own, and the hero a compact Corners control', async ({
  page,
}) => {
  await page.emulateMedia({ colorScheme: 'light' });
  await visit(page);
  const theme = page.getByRole('radiogroup', { name: 'Theme' });
  await expect(theme.locator('.field-label')).toHaveText('Theme');
  await expect(theme.getByRole('radio')).toHaveCount(3);
  await expect(theme.getByRole('radio', { name: 'System' })).toBeChecked();
  await theme.locator('.segmented-option', { hasText: 'Dark' }).click();
  await expect(theme.getByRole('radio', { name: 'Dark' })).toBeChecked();
  // The picker is a sample of the control. Choosing in it does not theme the page.
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');

  const corners = page.getByRole('radiogroup', { name: 'Corners', exact: true });
  await expect(corners).toHaveClass(/segmented-sm/);
  await expect(corners.getByRole('radio', { name: 'Rounded' })).toBeChecked();
});
