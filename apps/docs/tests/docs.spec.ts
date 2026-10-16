import { readFileSync } from 'node:fs';
import { expect, test, type Locator, type Page } from '@playwright/test';
import {
  axeViolations,
  expectTableFace,
  hitSize,
  hitsAt,
  settled,
  sideways,
  withoutClipboard,
} from './support';

const PAGE = '/docs/components/button';

/** Whether the focused element is inside the open drawer. */
const focusInRail = (page: Page): Promise<boolean> =>
  page.evaluate(() => document.activeElement?.closest('#rail') != null);

/** Whether the drawer is shut: the page is not held still and the menu button says so. */
const expectDrawerClosed = async (page: Page): Promise<void> => {
  await expect(page.locator('html')).not.toHaveAttribute('data-drawer', 'open');
  await expect(page.locator('.workspace')).not.toHaveAttribute('inert');
  await expect(page.getByRole('button', { name: 'Open the menu' })).toHaveAttribute('aria-expanded', 'false');
  await expect(page.getByRole('dialog', { name: 'Menu' })).toHaveCount(0);
};

/** Opens a page and waits for hydration, so the keys and clicks a test sends are not lost to a page still booting. */
const visit = async (page: Page, url = PAGE): Promise<void> => {
  await page.goto(url);
  await settled(page);
};

/**
 * Brings a link in the open drawer into view and waits until the drawer holding it has stopped sliding.
 * The rail lists every page, so any one link can sit below the fold of a drawer that scrolls.
 */
const railLinkInView = async (link: Locator): Promise<void> => {
  await link.scrollIntoViewIfNeeded();
  await expect(link).toBeInViewport({ ratio: 1 });
};

for (const width of [375, 768, 1024, 1440]) {
  test(`a docs page fits ${String(width)}px with no sideways scroll`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await visit(page);
    expect(await sideways(page)).toBe(0);
  });
}

/** How far the header and the content sit in from the workspace's left and right edges. */
const workspaceGutters = (page: Page): Promise<number[][]> =>
  page.locator('.workspace').evaluate((workspace) => {
    const outer = workspace.getBoundingClientRect();
    return ['.header-inner', '.content'].map((selector) => {
      const inner = workspace.querySelector(selector)?.getBoundingClientRect();
      return inner ? [inner.left - outer.left, outer.right - inner.right] : [];
    });
  });

for (const width of [1920, 2560]) {
  for (const rail of ['open', 'collapsed'] as const) {
    test(`a docs page is centered beside the ${rail} rail at ${String(width)}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await visit(page);
      if (rail === 'collapsed') {
        await page.getByRole('button', { name: 'Collapse the menu' }).click();
        await expect(page.locator('html')).toHaveAttribute('data-rail', 'collapsed');
      }
      // Past its cap the column stays whole, and the room left over is shared out evenly on
      // both sides, so the header and the content keep one left edge.
      await expect
        .poll(async () => {
          const [header = [], content = []] = await workspaceGutters(page);
          return [...header, ...content].every((gutter) => Math.abs(gutter - (header[0] ?? 0)) <= 1);
        })
        .toBe(true);
      const [[left = 0] = []] = await workspaceGutters(page);
      expect(left).toBeGreaterThan(0);
    });
  }
}

test('a docs page fills the workspace below its cap', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await visit(page);
  expect(await workspaceGutters(page)).toEqual([
    [0, 0],
    [0, 0],
  ]);
});

for (const theme of ['light', 'dark'] as const) {
  test(`a docs page has no axe violations in ${theme}`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: theme });
    await visit(page);
    await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
    expect(await axeViolations(page)).toEqual([]);
  });
}

for (const theme of ['light', 'dark'] as const) {
  test(`a docs page has no axe violations at 1440px in ${theme}, with the rail drawn whole`, async ({
    page,
  }) => {
    // At 1440px the rail draws the search button with its label and its key, and axe checks that a
    // control's accessible name holds the text it shows.
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.emulateMedia({ colorScheme: theme });
    await visit(page);
    await expect(page.getByRole('button', { name: 'Search docs' })).toBeVisible();
    expect(await axeViolations(page)).toEqual([]);
  });
}

test('the open drawer has no axe violations', async ({ page }) => {
  await page.setViewportSize({ width: 768, height: 900 });
  await visit(page);
  await page.getByRole('button', { name: 'Open the menu' }).click();
  await expect(page.getByRole('dialog', { name: 'Menu' })).toBeVisible();
  // Let the slide finish: axe reads colors, and a half-open drawer is a moving target.
  await railLinkInView(page.getByRole('link', { name: 'Spinner' }));
  expect(await axeViolations(page)).toEqual([]);
});

test('the rail collapses to icons and remembers it', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await visit(page);
  await page.getByRole('button', { name: 'Collapse the menu' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-rail', 'collapsed');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-rail', 'collapsed');
  await expect(page.getByRole('navigation').getByRole('link', { name: 'Spinner' })).toBeVisible();
  await page.getByRole('button', { name: 'Expand the menu' }).click();
  await expect(page.locator('html')).not.toHaveAttribute('data-rail', 'collapsed');
});

test('under 1024px the closed rail is out of the tab order and the accessibility tree', async ({ page }) => {
  await page.setViewportSize({ width: 768, height: 900 });
  await visit(page);
  await expect(page.getByRole('navigation')).toHaveCount(0);
  await expect(page.getByRole('complementary', { name: 'Documentation' })).toHaveCount(0);

  // The skip link is first, the menu button second, and no off-screen rail link ever takes focus.
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'Skip to content' })).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.getByRole('button', { name: 'Open the menu' })).toBeFocused();
  for (let press = 0; press < 12; press += 1) {
    await page.keyboard.press('Tab');
    expect(await focusInRail(page)).toBe(false);
  }
});

test('under 1024px the rail is a drawer that holds focus and Escape closes', async ({ page }) => {
  await page.setViewportSize({ width: 768, height: 900 });
  await visit(page);
  const menu = page.getByRole('button', { name: 'Open the menu' });
  await expect(menu).toHaveAttribute('aria-expanded', 'false');
  await expect(menu).toHaveAttribute('aria-controls', 'rail');
  await menu.click();

  const drawer = page.getByRole('dialog', { name: 'Menu' });
  await expect(drawer).toBeVisible();
  await expect(drawer).toHaveAttribute('aria-modal', 'true');
  await expect(menu).toHaveAttribute('aria-expanded', 'true');
  await expect(page.locator('html')).toHaveAttribute('data-drawer', 'open');
  await railLinkInView(page.getByRole('navigation').getByRole('link', { name: 'Spinner' }));
  await expect(page.locator('.workspace')).toHaveAttribute('inert', '');
  // The page behind the drawer does not scroll.
  await expect(page.locator('html')).toHaveCSS('overflow', 'hidden');
  // Focus starts on the link to the current page, not on the first link.
  await expect(page.getByRole('link', { name: 'Button', exact: true })).toBeFocused();

  // Tab and Shift+Tab stay inside the drawer, past both ends of it.
  for (let press = 0; press < 12; press += 1) {
    await page.keyboard.press('Tab');
    expect(await focusInRail(page)).toBe(true);
  }
  for (let press = 0; press < 12; press += 1) {
    await page.keyboard.press('Shift+Tab');
    expect(await focusInRail(page)).toBe(true);
  }

  await page.keyboard.press('Escape');
  await expect(page.locator('html')).not.toHaveAttribute('data-drawer', 'open');
  await expect(page.locator('html')).not.toHaveCSS('overflow', 'hidden');
  await expect(page.locator('.workspace')).not.toHaveAttribute('inert');
  await expect(menu).toBeFocused();
  await expect(menu).toHaveAttribute('aria-expanded', 'false');
  await expect(page.getByRole('navigation')).toHaveCount(0);
});

test('Escape in search opened from the drawer closes only the search', async ({ page }) => {
  await page.setViewportSize({ width: 768, height: 900 });
  await visit(page);
  await page.getByRole('button', { name: 'Open the menu' }).click();
  const searchButton = page.getByRole('button', { name: 'Search docs' });
  await searchButton.click();
  const search = page.getByRole('dialog', { name: 'Search the docs' });
  await expect(search).toBeVisible();

  await page.keyboard.press('Escape');
  await expect(search).toBeHidden();
  await expect(page.locator('html')).toHaveAttribute('data-drawer', 'open');
  await expect(searchButton).toBeFocused();

  await page.keyboard.press('Escape');
  await expect(page.locator('html')).not.toHaveAttribute('data-drawer', 'open');
  await expect(page.getByRole('button', { name: 'Open the menu' })).toBeFocused();
});

test('the drawer closes when the window grows past 1024px', async ({ page }) => {
  await page.setViewportSize({ width: 768, height: 900 });
  await visit(page);
  await page.getByRole('button', { name: 'Open the menu' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-drawer', 'open');
  await page.setViewportSize({ width: 1280, height: 900 });
  await expect(page.locator('html')).not.toHaveAttribute('data-drawer', 'open');
  await expect(page.locator('.workspace')).not.toHaveAttribute('inert');
  await expect(page.getByRole('complementary', { name: 'Documentation' })).toBeVisible();
});

test('the drawer has a close button that returns focus to the menu button', async ({ page }) => {
  await page.setViewportSize({ width: 768, height: 900 });
  await visit(page);
  const menu = page.getByRole('button', { name: 'Open the menu' });
  await menu.click();
  const close = page.getByRole('button', { name: 'Close menu' });
  await expect(close).toBeVisible();
  const box = await close.boundingBox();
  expect(box?.width).toBeGreaterThanOrEqual(40);
  expect(box?.height).toBeGreaterThanOrEqual(40);
  // It is near the top of the drawer, with the brand.
  expect(box?.y).toBeLessThan(80);

  await close.click();
  await expect(page.locator('html')).not.toHaveAttribute('data-drawer', 'open');
  await expect(menu).toBeFocused();
  await expect(menu).toHaveAttribute('aria-expanded', 'false');
});

test('the close button is drawn only while the rail is a drawer', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await visit(page);
  const close = page.getByRole('button', { name: 'Close menu' });
  await expect(close).toHaveCount(0);
  await expect(page.locator('.rail-close')).toHaveCSS('display', 'none');
  await page.getByRole('button', { name: 'Collapse the menu' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-rail', 'collapsed');
  await expect(close).toHaveCount(0);
  await expect(page.locator('.rail-close')).toHaveCSS('display', 'none');

  // A closed drawer is out of the accessibility tree, close button included.
  await page.setViewportSize({ width: 768, height: 900 });
  await expect(close).toHaveCount(0);
});

test('choosing the page that is already open closes the drawer', async ({ page }) => {
  await page.setViewportSize({ width: 768, height: 900 });
  await visit(page);
  const menu = page.getByRole('button', { name: 'Open the menu' });
  await menu.click();
  await expect(page.getByRole('link', { name: 'Button', exact: true })).toBeFocused();
  await page.getByRole('link', { name: 'Button', exact: true }).click();
  await expect(page.locator('html')).not.toHaveAttribute('data-drawer', 'open');
  await expect(page).toHaveURL(/\/docs\/components\/button$/);
  await expect(menu).toBeFocused();
});

test('Back to the page the drawer was opened on finds the drawer closed', async ({ page }) => {
  await page.setViewportSize({ width: 768, height: 900 });
  await visit(page);
  await page.getByRole('button', { name: 'Open the menu' }).click();
  await expect(page.getByRole('dialog', { name: 'Menu' })).toBeVisible();
  await page.getByRole('link', { name: 'Spinner' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Spinner' })).toBeVisible();
  await expectDrawerClosed(page);

  await page.goBack();
  await expect(page).toHaveURL(/\/docs\/components\/button$/);
  await expect(page.getByRole('heading', { level: 1, name: 'Button' })).toBeVisible();
  await expectDrawerClosed(page);
});

test('Back and Forward with the drawer open leave it closed', async ({ page }) => {
  await page.setViewportSize({ width: 768, height: 900 });
  await visit(page, '/docs');
  // Two pages in the history, reached by a link and not a reload, so the shell keeps its state.
  await page.getByRole('button', { name: 'Open the menu' }).click();
  await page.getByRole('link', { name: 'Button', exact: true }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Button' })).toBeVisible();
  await expectDrawerClosed(page);

  await page.getByRole('button', { name: 'Open the menu' }).click();
  await expect(page.getByRole('dialog', { name: 'Menu' })).toBeVisible();
  // The browser's own Back, with nothing clicked in the page.
  await page.goBack();
  await expect(page).toHaveURL(/\/docs$/);
  await expect(page.getByRole('heading', { level: 1, name: 'Introduction' })).toBeVisible();
  await expectDrawerClosed(page);

  await page.goForward();
  await expect(page).toHaveURL(/\/docs\/components\/button$/);
  await expect(page.getByRole('heading', { level: 1, name: 'Button' })).toBeVisible();
  await expectDrawerClosed(page);
});

test('a collapsed rail chosen on a wide screen leaves the drawer with its labels', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await visit(page);
  await page.getByRole('button', { name: 'Collapse the menu' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-rail', 'collapsed');

  await page.setViewportSize({ width: 768, height: 900 });
  await page.getByRole('button', { name: 'Open the menu' }).click();
  await expect(page.getByRole('dialog', { name: 'Menu' })).toBeVisible();
  // The preference is still stored, and the drawer ignores it: names, version and search key all show.
  await expect(page.locator('html')).toHaveAttribute('data-rail', 'collapsed');
  const label = page.locator('#rail .rail-link', { hasText: 'Spinner' }).locator('.rail-label');
  const labelBox = await label.boundingBox();
  expect(labelBox?.width).toBeGreaterThan(30);
  expect(labelBox?.height).toBeGreaterThan(10);
  await expect(page.locator('#rail .rail-version')).toBeVisible();
  await expect(page.locator('#rail .rail-key')).toBeVisible();
  expect((await page.locator('#rail .rail-search').boundingBox())?.width).toBeGreaterThan(200);
});

test('the first Tab lands on a skip link that jumps to the content', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await visit(page);
  const skip = page.getByRole('link', { name: 'Skip to content' });
  // Out of sight until focused: a 1px box, then a pill.
  expect((await skip.boundingBox())?.width).toBeLessThanOrEqual(1);
  await page.keyboard.press('Tab');
  await expect(skip).toBeFocused();
  expect((await skip.boundingBox())?.width).toBeGreaterThan(80);
  await expect(skip).toBeInViewport();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/#main$/);
  await page.keyboard.press('Tab');
  expect(await page.evaluate(() => document.activeElement?.closest('main') != null)).toBe(true);
});

test('the color mode switch themes the page and persists', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'light' });
  await visit(page);
  await page.locator('label', { hasText: 'Dark' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(14, 14, 13)');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
});

test('the corner switch recuts the page and persists', async ({ page }) => {
  await visit(page);
  await page.locator('label', { hasText: 'Square' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-shape', 'square');
  await expect(page.getByRole('button', { name: 'Delete site' })).toHaveCSS('border-top-left-radius', '0px');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-shape', 'square');
});

/** The height an element draws, in CSS pixels. */
const drawnHeight = async (locator: Locator): Promise<number> => {
  const box = await locator.boundingBox();
  if (!box) throw new Error('The element is not drawn');
  return box.height;
};

test('the theming page draws compact controls at 36px beside comfortable ones at 40', async ({ page }) => {
  await visit(page, '/docs/theming');
  const compact = page.locator('.density-sample[data-density="compact"]');
  const comfortable = page.locator('.density-sample:not([data-density])');
  await expect(compact).toHaveCount(1);
  await expect(comfortable).toHaveCount(1);
  expect(await drawnHeight(compact.locator('.button'))).toBe(36);
  expect(await drawnHeight(compact.locator('.input'))).toBe(36);
  expect(await drawnHeight(comfortable.locator('.button'))).toBe(40);
  expect(await drawnHeight(comfortable.locator('.input'))).toBe(48);
});

test('the theming page hits a bordered compact control at 40px, though it draws at 36', async ({ page }) => {
  await visit(page, '/docs/theming');
  const compact = page.locator('.density-sample[data-density="compact"]');
  // A positioned hit area measures from inside the border, so a formula on the token alone fell short of 40.
  for (const [locator, selector] of [
    [compact.locator('.button'), '.button'],
    [compact.locator('.icon-button'), '.icon-button'],
  ] as const) {
    // A point outside the viewport hits nothing, and the compact sample sits below the fold.
    await locator.scrollIntoViewIfNeeded();
    expect(await drawnHeight(locator), selector).toBe(36);
    expect(await hitsAt(locator, selector, -19.5), `${selector} above`).toBe(true);
    expect(await hitsAt(locator, selector, 19.5), `${selector} below`).toBe(true);
  }
});

for (const theme of ['light', 'dark'] as const) {
  test(`the theming page has no axe violations in ${theme}`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: theme });
    await visit(page, '/docs/theming');
    await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
    expect(await axeViolations(page)).toEqual([]);
  });
}

test('the theming page fits 320px, 375px and 1280px with no sideways scroll', async ({ page }) => {
  for (const width of [320, 375, 1280]) {
    await page.setViewportSize({ width, height: 800 });
    await visit(page, '/docs/theming');
    expect(await sideways(page), `${String(width)}px`).toBe(0);
  }
});

test.describe('the theming page without JavaScript', () => {
  test.use({ javaScriptEnabled: false });

  test('arrives from the server with both density samples drawn', async ({ page }) => {
    await page.goto('/docs/theming');
    for (const sample of ['.density-sample:not([data-density])', '.density-sample[data-density="compact"]']) {
      for (const part of ['.button', '.icon-button', '.segmented-option', '.input', '.card']) {
        expect(await page.locator(`${sample} ${part}`).count(), `${part} in ${sample}`).toBeGreaterThan(0);
      }
    }
  });
});

test('the routing page is in the rail after Theming, has no axe violations and fits 320px', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await visit(page, '/docs/routing');
  const titles = await page
    .locator('#rail .rail-link')
    .evaluateAll((links) => links.map((link) => link.getAttribute('data-label')));
  const theming = titles.indexOf('Theming');
  expect(theming).toBeGreaterThan(-1);
  expect(titles[theming + 1]).toBe('Routing');
  await expect(page.locator('pre', { hasText: 'RouterProvider' }).first()).toBeVisible();
  expect(await axeViolations(page)).toEqual([]);
  await page.setViewportSize({ width: 320, height: 800 });
  await visit(page, '/docs/routing');
  expect(await sideways(page)).toBe(0);
  // One home: the pages that had their own copy now link here and hold no provider snippet in their text. An
  // example's Code tab is the example's own source, and the menu's link example routes through a provider.
  for (const slug of ['link', 'menu']) {
    await visit(page, `/docs/components/${slug}`);
    await expect(page.locator('main a[href="/docs/routing"]').first(), slug).toBeAttached();
    await expect(page.locator('pre:not(.preview pre)', { hasText: 'RouterProvider' }), slug).toHaveCount(0);
  }
});

/** The docs card that holds the second-level heading `name`. */
const guideSection = (page: Page, name: string): Locator =>
  page.locator('.docs-section', { has: page.getByRole('heading', { level: 2, name, exact: true }) });

test('the installation page names Pagination among the parts a server component renders', async ({
  page,
}) => {
  await visit(page, '/docs/installation');
  const section = guideSection(page, 'Next.js server components');
  await expect(section).toHaveCount(1);
  await expect(section).toContainText('Pagination');
  await expect(section).toContainText('getPageHref');
});

test('the installation page explains the server face and the date library', async ({ page }) => {
  await visit(page, '/docs/installation');
  const section = guideSection(page, 'Next.js server components');
  await expect(section).toHaveCount(1);
  await expect(section).toContainText('valueLabel');
  await expect(section).toContainText('today');
  await expect(page.locator('main')).toContainText('@internationalized/date');
  await expect(page.locator('main')).toContainText('^3.12.4');
});

test('the chart pages name the core version charts needs', async ({ page }) => {
  for (const slug of ['line-chart', 'sparkline']) {
    await visit(page, `/docs/charts/${slug}`);
    await expect(page.locator('main'), slug).toContainText('0.6 for charts 0.1.3');
  }
});

test('the routing page names the tabs and the page links among the parts that navigate', async ({ page }) => {
  await visit(page, '/docs/routing');
  const section = guideSection(page, 'What goes through it');
  await expect(section).toHaveCount(1);
  await expect(section.locator('a[href="/docs/components/tabs"]')).toHaveCount(1);
  await expect(section.locator('a[href="/docs/components/pagination"]')).toHaveCount(1);
  await expect(section.locator('a[href="/docs/components/data-table"]')).toHaveCount(1);
});

test('the installation page names EmptyState and Skeleton among the static parts and DataTable among the client ones', async ({
  page,
}) => {
  await visit(page, '/docs/installation');
  const section = guideSection(page, 'Next.js server components');
  await expect(section).toHaveCount(1);
  for (const text of ['EmptyState', 'Skeleton', 'DataTable', 'getRowHref', 'SidePanel']) {
    await expect(section, text).toContainText(text);
  }
});

test('a docs card pads 20px on a phone through --spacing-card', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 800 });
  await visit(page, '/docs/theming');
  // The section is a library card, and its note's band bleeds through the same padding.
  const section = page.locator('.docs-section').first();
  const note = page.locator('.docs-section > h2 + p').first();
  await expect(section).toHaveCSS('padding-top', '20px');
  await expect(note).toHaveCSS('margin-left', '-20px');
  await page.setViewportSize({ width: 1280, height: 800 });
  await expect(section).toHaveCSS('padding-top', '32px');
  await expect(note).toHaveCSS('margin-left', '-32px');
});

test('Cmd or Ctrl and K opens search and finds a component', async ({ page }) => {
  await visit(page, '/docs');
  await page.keyboard.press('ControlOrMeta+k');
  const dialog = page.getByRole('dialog', { name: 'Search the docs' });
  await expect(dialog).toBeVisible();
  await dialog.getByRole('searchbox', { name: 'Search' }).fill('Spinner');
  await dialog
    .getByRole('link', { name: /Spinner/ })
    .first()
    .click();
  await expect(page).toHaveURL(/\/docs\/components\/spinner$/);
});

test('Enter in the search field opens the first result', async ({ page }) => {
  await visit(page, '/docs');
  await page.keyboard.press('ControlOrMeta+k');
  const dialog = page.getByRole('dialog', { name: 'Search the docs' });
  const field = dialog.getByRole('searchbox', { name: 'Search' });
  await field.fill('Spinner');
  await expect(dialog.getByRole('link', { name: /Spinner/ }).first()).toBeVisible();
  await field.press('Enter');
  await expect(page).toHaveURL(/\/docs\/components\/spinner/);
  await expect(dialog).toBeHidden();
});

test('search announces its outcome through a status region that is already mounted', async ({ page }) => {
  await visit(page, '/docs');
  await page.keyboard.press('ControlOrMeta+k');
  const dialog = page.getByRole('dialog', { name: 'Search the docs' });
  const status = dialog.getByRole('status');
  // Present and empty before anything is typed, so the first change is announced.
  await expect(status).toHaveCount(1);
  await expect(status).toHaveText('');
  const element = await status.elementHandle();
  await dialog.getByRole('searchbox', { name: 'Search' }).fill('Spinner');
  await expect(status).toHaveText(/\d+ results?/);
  await dialog.getByRole('searchbox', { name: 'Search' }).fill('zzzzqx');
  await expect(status).toHaveText('Nothing matches "zzzzqx"');
  // The same node throughout: its text changed, it was never remounted.
  expect(await element.evaluate((node) => node.isConnected)).toBe(true);
});

test('Enter never opens a result that belongs to an earlier query', async ({ page }) => {
  await visit(page, '/docs');
  await page.keyboard.press('ControlOrMeta+k');
  const dialog = page.getByRole('dialog', { name: 'Search the docs' });
  const field = dialog.getByRole('searchbox', { name: 'Search' });
  await field.fill('Spinner');
  await expect(dialog.getByRole('link', { name: /Spinner/ }).first()).toBeVisible();

  // The second query is still loading when Enter lands, and Spinner's results are
  // still in memory. Enter may do nothing, or open the right page once it has
  // loaded. It must never open Spinner's.
  await field.fill('Button');
  await field.press('Enter');
  await expect(
    dialog
      .getByRole('link', { name: /Button/ })
      .first()
      .or(page.getByRole('heading', { level: 1, name: 'Button' })),
  ).toBeVisible();
  await expect(page).not.toHaveURL(/spinner/);

  // With results for what was typed, Enter opens the first of them.
  if (!page.url().includes('/components/button')) await field.press('Enter');
  await expect(page).toHaveURL(/\/docs\/components\/button$/);
});

test('the results and their count only ever belong to the current query', async ({ page }) => {
  await visit(page, '/docs');
  await page.keyboard.press('ControlOrMeta+k');
  const dialog = page.getByRole('dialog', { name: 'Search the docs' });
  const field = dialog.getByRole('searchbox', { name: 'Search' });
  await field.fill('Spinner');
  await expect(dialog.getByRole('link', { name: /Spinner/ }).first()).toBeVisible();

  // Read straight after typing, without retrying: the new search has not come back yet,
  // and nothing of Spinner's may still be listed or counted.
  await field.fill('zzzzqx');
  expect(await dialog.locator('.search-result').count()).toBe(0);
  expect(await dialog.getByRole('status').textContent()).not.toMatch(/\d+ results?/);
  await expect(dialog.getByRole('status')).toHaveText('Nothing matches "zzzzqx"');
});

test('the search dialog never shrinks below its resting height while the query changes', async ({ page }) => {
  await visit(page, '/docs');
  await page.keyboard.press('ControlOrMeta+k');
  const dialog = page.getByRole('dialog', { name: 'Search the docs' });
  const field = dialog.getByRole('searchbox', { name: 'Search' });
  const height = async (): Promise<number> => (await dialog.boundingBox())?.height ?? 0;

  // Nothing typed yet: the floor under the results, 20rem, plus the field and the footer.
  const resting = await height();
  await expect(dialog.locator('.search-body')).toHaveCSS('min-height', '320px');
  expect(resting).toBeGreaterThan(320);
  await field.fill('zzzzqx');
  await expect(dialog.getByRole('status')).toHaveText('Nothing matches "zzzzqx"');
  expect(await height()).toBeCloseTo(resting, 0);

  // Typing never takes it under that floor: not while a search is still out and its results are not
  // listed, and not once they have come back.
  for (const text of ['S', 'Sp', 'Spi', 'Spin', 'Spinn', 'Spinne', 'Spinner']) {
    await field.fill(text);
    expect(await height()).toBeGreaterThanOrEqual(resting - 0.5);
  }
  await expect(dialog.getByRole('link', { name: /Spinner/ }).first()).toBeVisible();
  expect(await height()).toBeGreaterThanOrEqual(resting - 0.5);
});

test('choosing a search result for a heading on the open page closes the drawer', async ({ page }) => {
  await page.setViewportSize({ width: 768, height: 900 });
  await visit(page);
  await page.getByRole('button', { name: 'Open the menu' }).click();
  await page.getByRole('button', { name: 'Search docs' }).click();
  const dialog = page.getByRole('dialog', { name: 'Search the docs' });
  await dialog.getByRole('searchbox', { name: 'Search' }).fill('Pass isPending');
  // Only the hash changes: the path is the one already open, so nothing the shell watches for moves.
  await dialog.locator('a.search-result[href="/docs/components/button#usage"]').click();
  await expect(page).toHaveURL(/\/docs\/components\/button#usage$/);
  await expect(dialog).toBeHidden();
  await expectDrawerClosed(page);
  await expect(page.getByRole('button', { name: 'Open the menu' })).toBeFocused();
});

test('Enter on a search result for the open page closes the drawer, with or without a hash', async ({
  page,
}) => {
  await page.setViewportSize({ width: 768, height: 900 });
  await visit(page);
  const menu = page.getByRole('button', { name: 'Open the menu' });
  await menu.click();
  await page.getByRole('button', { name: 'Search docs' }).click();
  const dialog = page.getByRole('dialog', { name: 'Search the docs' });
  const field = dialog.getByRole('searchbox', { name: 'Search' });
  await field.fill('Pass isPending');
  // The first result is the page itself: not even the hash changes.
  await expect(dialog.locator('a.search-result').first()).toHaveAttribute('href', '/docs/components/button');
  await field.press('Enter');
  await expect(dialog).toBeHidden();
  await expectDrawerClosed(page);
  await expect(page).toHaveURL(/\/docs\/components\/button$/);

  // A result reached with the arrow keys is the link's own Enter, and takes the hash.
  await menu.click();
  await page.getByRole('button', { name: 'Search docs' }).click();
  await field.fill('Pass isPending');
  await expect(dialog.locator('a.search-result[href="/docs/components/button#usage"]')).toBeVisible();
  await field.press('ArrowDown');
  await page.keyboard.press('ArrowDown');
  await expect(dialog.locator('a.search-result[href="/docs/components/button#usage"]')).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/\/docs\/components\/button#usage$/);
  await expect(dialog).toBeHidden();
  await expectDrawerClosed(page);
});

test('a server-rendered MDX page renders library components and props', async ({ page }) => {
  await visit(page);
  await expect(page.getByRole('button', { name: 'Delete site' })).toBeVisible();
  await expect(page.getByText("Default: 'primary'")).toBeVisible();
});

/** The field whose control has this name, on the page that is open. */
const fieldNamed = (page: Page, name: string): Locator =>
  page.locator('.field').filter({ has: page.getByRole('textbox', { name, exact: true }) });

test('the field parts page shows the Changed chip on a changed field and hides it on an invalid one', async ({
  page,
}) => {
  await page.emulateMedia({ colorScheme: 'light' });
  await visit(page, '/docs/components/field');
  const edited = fieldNamed(page, 'Workspace name');
  await expect(edited.locator('.field-changed')).toHaveCount(1);
  await expect(edited.locator('.field-changed')).toBeHidden();
  await edited.getByRole('textbox').fill('Northwind Studio East');
  await expect(edited.locator('.field-changed')).toBeVisible();
  await edited.getByRole('textbox').fill('Northwind Studio');
  await expect(edited.locator('.field-changed')).toHaveCount(1);
  await expect(edited.locator('.field-changed')).toBeHidden();

  // A changed field draws the light signal orange edge and its chip.
  const changed = fieldNamed(page, 'Display name');
  await expect(changed.locator('.field-changed')).toBeVisible();
  await expect(changed.getByRole('textbox')).toHaveCSS('border-top-color', 'rgb(243, 115, 56)');
  // An invalid field draws the error edge and the error line, and no chip.
  const invalid = fieldNamed(page, 'Short description');
  await expect(invalid.locator('.field-changed')).toHaveCount(0);
  await expect(invalid.locator('.field-error')).toBeVisible();
  await expect(invalid.getByRole('textbox')).toHaveCSS('border-top-color', 'rgb(163, 35, 27)');
});

test('the length count on the field parts page appears near the budget and never blocks typing', async ({
  page,
}) => {
  await visit(page, '/docs/components/field');
  const field = fieldNamed(page, 'About the workspace');
  const counter = field.locator('.field-counter');
  await expect(counter).toHaveText('34 of about 40');
  await expect(counter).not.toHaveAttribute('data-over');
  await expect(counter).toHaveCSS('font-weight', '450');
  const longer = 'A shared space for the design team and its guests';
  await field.getByRole('textbox').fill(longer);
  await expect(field.getByRole('textbox')).toHaveValue(longer);
  await expect(counter).toHaveText(`${String(longer.length)} of about 40`);
  await expect(counter).toHaveAttribute('data-over');
  await expect(counter).toHaveCSS('font-weight', '700');
  await field.getByRole('textbox').fill('Short');
  await expect(counter).toHaveText('');
});

test('the text field page shows a failed submit as an error line and sends once the value is fixed', async ({
  page,
}) => {
  await page.emulateMedia({ colorScheme: 'light' });
  await visit(page, '/docs/components/text-field');
  const field = fieldNamed(page, 'Work email');
  const input = field.getByRole('textbox');
  const send = page.getByRole('button', { name: 'Send invite' });

  await send.click();
  await expect(field.locator('.field-error')).toHaveText('Enter your work email.');
  await expect(field).toHaveAttribute('data-invalid');
  await expect(input).toBeFocused();
  await expect(input).toHaveCSS('border-top-color', 'rgb(163, 35, 27)');

  await input.fill('ada@example.com');
  await send.click();
  await expect(field.locator('.field-error')).toHaveText('Use an address at northwind.studio.');

  // Enter submits. A click would miss: the error line collapses when the field loses focus, and the button moves.
  await input.fill('ada@northwind.studio');
  await input.press('Enter');
  await expect(page.getByText('Invite sent to ada@northwind.studio.')).toBeVisible();
  await expect(field.locator('.field-error')).toHaveCount(0);
});

test('a focused text field firms its edge and keeps the ring, and a changed one keeps its own edge', async ({
  page,
}) => {
  await page.emulateMedia({ colorScheme: 'light' });
  await visit(page, '/docs/components/text-field');
  const plain = page.getByRole('textbox', { name: 'Workspace name' });
  await plain.focus();
  await expect(plain).toHaveCSS('border-top-color', 'rgb(20, 20, 19)');
  await expect(plain).toHaveCSS('outline-style', 'solid');
  await expect(plain).toHaveCSS('outline-width', '2px');
  const changed = page.getByRole('textbox', { name: 'Display name', exact: true });
  await changed.focus();
  await expect(changed).toHaveCSS('border-top-color', 'rgb(243, 115, 56)');
  await expect(changed).toHaveCSS('outline-style', 'solid');
});

test('a search field clears with Escape and with its button, and the button leaves while it is empty', async ({
  page,
}) => {
  await visit(page, '/docs/components/search-field');
  // The basic example's field, the one the page names "Search transactions".
  const field = page.getByRole('searchbox', { name: 'Search transactions', exact: true });
  const clear = page.locator('.stage .search-field').filter({ has: field }).locator('.search-field-clear');
  await expect(clear).toBeHidden();
  await field.fill('coffee');
  await expect(clear).toBeVisible();
  await field.press('Escape');
  await expect(field).toHaveValue('');
  await expect(clear).toBeHidden();
  await field.fill('rent');
  await clear.click();
  await expect(field).toHaveValue('');
  await expect(field).toBeFocused();
  await expect(clear).toBeHidden();
});

test('the docs search keeps its own row, and the library search field draws none of it', async ({ page }) => {
  await visit(page, '/docs/components/search-field');
  await page.keyboard.press('ControlOrMeta+k');
  const dialog = page.getByRole('dialog', { name: 'Search the docs' });
  await expect(dialog).toBeVisible();
  const row = dialog.locator('.search-dialog-field');
  await expect(row).toHaveCSS('padding-top', '16px');
  await expect(row).toHaveCSS('border-bottom-style', 'solid');
  await expect(row).toHaveCSS('border-bottom-width', '1px');
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  const library = page
    .locator('.stage .search-field')
    .filter({ has: page.getByRole('searchbox', { name: 'Search transactions', exact: true }) });
  await expect(library).toHaveCSS('padding-top', '0px');
  await expect(library).toHaveCSS('border-bottom-style', 'none');
  await library.getByRole('searchbox').fill('coffee');
  const glyph = library.locator('.search-field-clear svg');
  expect((await glyph.boundingBox())?.width).toBe(16);
});

test('a select with nine options or more opens to a filter that keeps an option when every word matches, accents aside', async ({
  page,
}) => {
  await visit(page, '/docs/components/select');
  // The filter example's select, the one whose value is Home rent.
  const trigger = page.getByRole('button', { name: 'Home rent Category', exact: true });
  await trigger.click();
  const filter = page.getByRole('searchbox', { name: 'Filter' });
  await expect(filter).toBeFocused();
  await expect(page.getByRole('option')).toHaveCount(12);
  await filter.fill('cafe');
  await expect(page.getByRole('option')).toHaveCount(1);
  await expect(page.getByRole('option', { name: 'Café' })).toBeVisible();
  await filter.press('Enter');
  await expect(page.getByRole('listbox')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Café Category', exact: true })).toBeFocused();
});

test.describe('the select page, on a touch screen', () => {
  test.use({ hasTouch: true, viewport: { width: 375, height: 760 } });

  test('a filterable select opens with its filter unfocused and 44px rows', async ({ page }) => {
    await visit(page, '/docs/components/select');
    await page.getByRole('button', { name: 'Home rent Category', exact: true }).tap();
    const filter = page.getByRole('searchbox', { name: 'Filter' });
    await expect(filter).toBeVisible();
    await expect(filter).not.toBeFocused();
    // The popover scales in, so the row is measured once its entering animation has finished, and to the
    // nearest pixel, since layout can land a fraction of a pixel off a whole one.
    await expect(page.locator('.select-popover')).not.toHaveAttribute('data-entering');
    const row = page.getByRole('option', { name: 'Groceries' });
    const box = await row.boundingBox();
    if (!box) throw new Error('No row');
    expect(Math.round(box.height)).toBeGreaterThanOrEqual(44);
    expect(await sideways(page)).toBe(0);
  });
});

/**
 * Scrolls a field into view and waits two frames past it. React Aria closes a combo box's list when the page
 * scrolls and puts the text back as it closes, so the scroll that reaching the field takes must be over before
 * typing opens the list.
 */
const scrolledTo = async (field: Locator): Promise<void> => {
  await field.scrollIntoViewIfNeeded();
  await field.evaluate(
    () =>
      new Promise<void>((resolve) => {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            resolve();
          });
        });
      }),
  );
};

test('a combo box filters as you type and keeps its list open with a no-matches line', async ({ page }) => {
  await visit(page, '/docs/components/combo-box');
  // The basic example's field, the one whose hint says to type part of the name.
  const field = page
    .locator('.stage .combo-box')
    .filter({ hasText: 'Type part of the name' })
    .getByRole('combobox', { name: 'Merchant' });
  await scrolledTo(field);
  await field.fill('co');
  // The rows, by their class: React Aria wraps the no-matches line in an option role of its own.
  const options = page.getByRole('listbox').locator('.picker-option');
  await expect(options).toHaveText(['Coastline Rail', 'Cobalt Coffee', 'Corner Mart']);
  await expect(field).toBeFocused();
  await field.fill('zzz');
  await expect(page.getByRole('listbox')).toBeVisible();
  await expect(options).toHaveCount(0);
  await expect(page.getByRole('listbox')).toContainText('No matches');
  await field.press('Escape');
  await expect(page.getByRole('listbox')).toHaveCount(0);
  await expect(field).toHaveValue('');
});

test('a combo box in manual mode shows the spinner while the app loads, then the results', async ({
  page,
}) => {
  await visit(page, '/docs/components/combo-box');
  const example = page.locator('.stage .combo-box').filter({ hasText: 'Searched on the server' });
  const field = example.getByRole('combobox', { name: 'Merchant' });
  await scrolledTo(field);
  await field.fill('co');
  // While the list is open React Aria hides the rest of the page from assistive technology, the spinner too.
  const spinner = example.getByRole('progressbar', { name: 'Loading', includeHidden: true });
  await expect(spinner).toBeVisible();
  await expect(example).toHaveAttribute('data-loading', '');
  // The server's results: the names that start with the text first, then those that hold it.
  await expect(page.getByRole('listbox').locator('.picker-option')).toHaveText([
    'Coastline Rail',
    'Cobalt Coffee',
    'Corner Mart',
    'Cove Seafood',
    'Railway Records',
  ]);
  await expect(spinner).toHaveCount(0);
  await expect(example).not.toHaveAttribute('data-loading');
  // Choose, then search for something with no results: Escape still puts the chosen text back.
  await page.getByRole('listbox').locator('.picker-option', { hasText: 'Corner Mart' }).click();
  await expect(field).toHaveValue('Corner Mart');
  await expect(example).not.toHaveAttribute('data-loading');
  await field.press('End');
  await field.pressSequentially('zz');
  await expect(example).toHaveAttribute('data-loading', '');
  await expect(example).not.toHaveAttribute('data-loading');
  await field.press('Escape');
  await expect(page.getByRole('listbox')).toHaveCount(0);
  await expect(field).toHaveValue('Corner Mart');
});

test('a multi-select keeps its list open, empties its input, and removes a tag on the second Backspace', async ({
  page,
}) => {
  await visit(page, '/docs/components/multi-select');
  // The basic example's field, the one whose hint says to type to filter.
  const example = page.locator('.stage .multi-select').filter({ hasText: 'Type to filter' });
  const field = example.getByRole('combobox', { name: 'Categories' });
  await scrolledTo(field);
  await field.fill('fo');
  await expect(page.getByRole('listbox').locator('.picker-option')).toHaveText(['Food']);
  await field.press('ArrowDown');
  await field.press('Enter');
  await expect(page.getByRole('listbox')).toBeVisible();
  await expect(field).toHaveValue('');
  await expect(field).toBeFocused();
  await expect(example.locator('.multi-select-tag-text')).toHaveText(['Food']);
  // The first Backspace closes the list and only focuses the tag; the second removes it.
  await field.press('Backspace');
  await expect(page.getByRole('listbox')).toHaveCount(0);
  const tag = example.getByRole('row', { name: 'Food' });
  await expect(tag).toBeFocused();
  await expect(example.locator('.multi-select-tag-text')).toHaveText(['Food']);
  await tag.press('Backspace');
  await expect(example.locator('.multi-select-tag')).toHaveCount(0);
  await expect(field).toBeFocused();
});

test('link tabs follow their link through the router, and the arrows only move focus', async ({ page }) => {
  await visit(page, '/docs/components/tabs');
  // A marker on the window survives a client-side navigation and is lost to a full page load.
  await page.evaluate(() => {
    (window as Window & { tabsMarker?: boolean }).tabsMarker = true;
  });
  const example = page.locator('.stage .tabs').filter({ has: page.locator('a.tab') });
  const all = example.getByRole('tab', { name: 'All' });
  const income = example.getByRole('tab', { name: 'Income' });
  await expect(income).toHaveAttribute('href', '/docs/components/tabs?view=income');
  await scrolledTo(all);
  await expect(all).toHaveAttribute('aria-selected', 'true');
  await all.focus();
  await page.keyboard.press('ArrowRight');
  await expect(example.getByRole('tab', { name: 'Spending' })).toBeFocused();
  await page.keyboard.press('ArrowRight');
  await expect(income).toBeFocused();
  await expect(page).toHaveURL(/\/docs\/components\/tabs$/);
  await expect(all).toHaveAttribute('aria-selected', 'true');
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/\/docs\/components\/tabs\?view=income$/);
  await expect(income).toHaveAttribute('aria-selected', 'true');
  await expect(example.getByRole('tabpanel', { name: 'Income' })).toContainText('Money in');
  expect(await page.evaluate(() => (window as Window & { tabsMarker?: boolean }).tabsMarker)).toBe(true);
});

test('Space on a link tab follows its link and never scrolls the page down', async ({ page }) => {
  await visit(page, '/docs/components/tabs');
  const example = page.locator('.stage .tabs').filter({ has: page.locator('a.tab') });
  const all = example.getByRole('tab', { name: 'All' });
  const income = example.getByRole('tab', { name: 'Income' });
  await scrolledTo(all);
  await all.focus();
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('ArrowRight');
  await expect(income).toBeFocused();
  // The furthest the page goes while the key is handled: Space's default on an anchor would scroll it a screen down.
  const before = await page.evaluate(() => {
    const own = window as Window & { furthest?: number };
    own.furthest = window.scrollY;
    window.addEventListener('scroll', () => {
      own.furthest = Math.max(own.furthest ?? 0, window.scrollY);
    });
    return window.scrollY;
  });
  await page.keyboard.press('Space');
  await expect(page).toHaveURL(/\/docs\/components\/tabs\?view=income$/);
  await expect(income).toHaveAttribute('aria-selected', 'true');
  expect(await page.evaluate(() => (window as Window & { furthest?: number }).furthest)).toBe(before);
});

test('a tab row that does not fit scrolls inside itself to its selected tab', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 800 });
  await visit(page, '/docs/components/tabs');
  const example = page.locator('.stage .tabs').filter({ has: page.getByRole('tab', { name: 'Archived' }) });
  const list = example.locator('.tab-list');
  await scrolledTo(list);
  await expect.poll(() => list.evaluate((element) => Math.abs(element.scrollLeft))).toBeGreaterThan(0);
  const room = await list.boundingBox();
  const last = await example.getByRole('tab', { name: 'Archived' }).boundingBox();
  if (!room || !last) throw new Error('No tab row drawn');
  expect(last.x).toBeGreaterThanOrEqual(room.x);
  expect(last.x + last.width).toBeLessThanOrEqual(room.x + room.width);
  expect(await sideways(page)).toBe(0);
});

test.describe('the tabs page without JavaScript', () => {
  test.use({ javaScriptEnabled: false });

  test('a tab row arrives from the server starting at its first tab', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 800 });
    await page.goto('/docs/components/tabs');
    const example = page.locator('.stage .tabs').filter({ has: page.getByRole('tab', { name: 'Archived' }) });
    await expect(example.getByRole('tab', { name: 'Archived' })).toHaveAttribute('aria-selected', 'true');
    const room = await example.locator('.tab-list').boundingBox();
    const first = await example.getByRole('tab', { name: 'All' }).boundingBox();
    const last = await example.getByRole('tab', { name: 'Archived' }).boundingBox();
    if (!room || !first || !last) throw new Error('No tab row drawn');
    expect(first.x).toBeGreaterThanOrEqual(room.x);
    expect(last.x + last.width).toBeGreaterThan(room.x + room.width);
  });
});

test('page links navigate through the router, and the status speaks the new range once', async ({ page }) => {
  await visit(page, '/docs/components/pagination');
  // A marker on the window survives a client-side navigation and is lost to a full page load.
  await page.evaluate(() => {
    (window as Window & { pagesMarker?: boolean }).pagesMarker = true;
  });
  const example = page.locator('.stage .pagination').first();
  const status = example.getByRole('status');
  await expect(status).toBeEmpty();
  await expect(example.getByRole('link', { name: 'Page 1', exact: true })).toHaveAttribute(
    'aria-current',
    'page',
  );
  const next = example.getByRole('link', { name: 'Next' });
  await expect(next).toHaveAttribute('href', '/docs/components/pagination?page=2');
  await scrolledTo(next);
  // The region is the same element after the navigation: the client leaves stay mounted, so it can speak (R5).
  await status.evaluate((element) => {
    element.setAttribute('data-marker', 'kept');
  });
  await next.click();
  await expect(page).toHaveURL(/\/docs\/components\/pagination\?page=2$/);
  await expect(example.getByRole('link', { name: 'Page 2', exact: true })).toHaveAttribute(
    'aria-current',
    'page',
  );
  await expect(example.locator('.pagination-range')).toHaveText('51 to 100 of 1,284');
  expect(await page.evaluate(() => (window as Window & { pagesMarker?: boolean }).pagesMarker)).toBe(true);
  await expect(status).toHaveText('51 to 100 of 1,284', { timeout: 1000 });
  await expect(status).toHaveAttribute('data-marker', 'kept');
});

test('a narrow pagination row keeps two 40px steps around the range', async ({ page }) => {
  await visit(page, '/docs/components/pagination');
  // The narrow example sits in a 20rem column, so its own container query lays it out at any viewport.
  const example = page.locator('.stage .pagination').filter({ hasText: '551 to 600 of 1,284' });
  await scrolledTo(example);
  for (const control of await example.locator('.pagination-page').all()) await expect(control).toBeHidden();
  const previous = await example.locator('.pagination-step[data-step="previous"]').boundingBox();
  const next = await example.locator('.pagination-step[data-step="next"]').boundingBox();
  const range = await example.locator('.pagination-range').boundingBox();
  if (!previous || !next || !range) throw new Error('No narrow row drawn');
  for (const step of [previous, next]) {
    expect(step.width).toBe(40);
    expect(step.height).toBe(40);
  }
  expect(previous.x + previous.width).toBeLessThanOrEqual(range.x);
  expect(range.x + range.width).toBeLessThanOrEqual(next.x);
  await expect(example.getByRole('link', { name: 'Previous' })).toBeVisible();
});

/**
 * The siblings example: 26 pages, two siblings each side, in a 30.5rem column, just above the narrow row. The
 * numbers stay, the step words hide as names, and nothing in the row, its column or the page scrolls sideways.
 */
const siblingsFit = async (page: Page, size: number): Promise<void> => {
  const example = page.getByRole('navigation', { name: 'Ledger pages' });
  await scrolledTo(example);
  const box = await example.boundingBox();
  if (!box) throw new Error('No siblings row drawn');
  expect(box.width).toBe(30.5 * 16);
  // 2 times 2 plus 5 slots: 1, a gap, 11 to 15, a gap, 26.
  await expect(example.locator('.pagination-page')).toHaveCount(7);
  for (const control of await example.locator('.pagination-page').all()) await expect(control).toBeVisible();
  const next = example.getByRole('link', { name: 'Next' });
  await expect(next).toBeVisible();
  const step = await next.boundingBox();
  if (!step) throw new Error('No Next drawn');
  expect(step.width).toBe(size);
  expect(step.height).toBe(size);
  for (const control of await example.locator('.pagination-control').all()) {
    const each = await control.boundingBox();
    if (!each) throw new Error('A control is not drawn');
    expect(each.x).toBeGreaterThanOrEqual(box.x);
    expect(each.x + each.width).toBeLessThanOrEqual(box.x + box.width);
  }
  expect(await example.evaluate((nav) => nav.scrollWidth - nav.clientWidth)).toBeLessThanOrEqual(0);
  expect(
    await example.evaluate((nav) => {
      const column = nav.parentElement;
      return column ? column.scrollWidth - column.clientWidth : 1;
    }),
  ).toBeLessThanOrEqual(0);
  expect(await sideways(page)).toBe(0);
};

test('a pagination row with two siblings at 30.5rem stays inside its column', async ({ page }) => {
  await visit(page, '/docs/components/pagination');
  await siblingsFit(page, 40);
});

test.describe('the pagination page, on a touch screen', () => {
  // Wide enough for the 30.5rem column, with a coarse pointer, under which a compact control is 44px.
  test.use({ hasTouch: true, viewport: { width: 900, height: 760 } });

  test('a pagination row with two siblings at 30.5rem and 44px controls stays inside its column', async ({
    page,
  }) => {
    await visit(page, '/docs/components/pagination');
    expect(await page.evaluate(() => matchMedia('(pointer: coarse)').matches)).toBe(true);
    await page.evaluate(() => {
      document.documentElement.dataset.density = 'compact';
    });
    await siblingsFit(page, 44);
  });
});

test('a cursor-paged row enables Next while there is more and disables it on the last page', async ({
  page,
}) => {
  await visit(page, '/docs/components/pagination');
  const example = page.getByRole('navigation', { name: 'Activity pages' });
  await scrolledTo(example);
  await expect(example.locator('.pagination-page')).toHaveCount(0);
  await expect(example.locator('.pagination-range')).toHaveText('1 to 25');
  const next = example.getByRole('button', { name: 'Next' });
  for (const range of ['26 to 50', '51 to 75', '76 to 87']) {
    await next.click();
    await expect(example.locator('.pagination-range')).toHaveText(range);
  }
  await expect(next).toBeDisabled();
  await expect(example.getByRole('button', { name: 'Previous' })).toBeEnabled();
});

test('a money field writes minor units to the URL and reads them back after a reload', async ({ page }) => {
  await visit(page, '/docs/components/number-field');
  const input = page.getByRole('textbox', { name: 'Minimum amount' });
  await scrolledTo(input);
  await input.fill('20');
  await input.press('Enter');
  await expect(page).toHaveURL(/\/docs\/components\/number-field\?min=2000$/);
  await page.reload();
  await settled(page);
  await expect(page.getByRole('textbox', { name: 'Minimum amount' })).toHaveValue('20.00');
});

test('a money field shows the decimal keyboard and keeps Home and End for the caret', async ({ page }) => {
  await visit(page, '/docs/components/number-field');
  const input = page.getByRole('textbox', { name: 'Amount' }).first();
  await expect(input).toHaveAttribute('inputmode', 'decimal');
  await scrolledTo(input);
  await input.fill('234.50');
  await input.press('Home');
  await input.press('1');
  await expect(input).toHaveValue('1234.50');
  await input.press('End');
  await input.press('Backspace');
  await expect(input).toHaveValue('1234.5');
});

test('a multiple filter chip stays open as it toggles, and its clear button clears it and focuses the chip', async ({
  page,
}) => {
  await visit(page, '/docs/components/filter-chip');
  const chip = page.locator('.stage .filter-chip').filter({ hasText: 'Tags' }).first();
  await scrolledTo(chip);
  await expect(chip.locator('.filter-chip-value')).toHaveText('Rent');
  await chip.locator('.filter-chip-trigger').click();
  const popover = page.locator('.select-popover');
  await expect(popover).toBeVisible();
  await expect(popover).not.toHaveAttribute('data-entering');
  await popover.getByRole('option', { name: 'Groceries' }).click();
  await popover.getByRole('option', { name: 'Health' }).click();
  // Still open, and the chip behind it summarizes in the list's order.
  await expect(popover).toBeVisible();
  await expect(chip.locator('.filter-chip-value')).toHaveText('Groceries, Rent and 1 more');
  await page.keyboard.press('Escape');
  await expect(popover).toHaveCount(0);
  await chip.getByRole('button', { name: 'Clear Tags' }).click();
  await expect(chip).not.toHaveAttribute('data-active');
  await expect(chip.locator('.filter-chip-trigger')).toBeFocused();
});

test('a closed filter chip ignores a letter', async ({ page }) => {
  await visit(page, '/docs/components/filter-chip');
  const chip = page.locator('.stage .filter-chip').filter({ hasText: 'Category' }).first();
  await scrolledTo(chip);
  const trigger = chip.locator('.filter-chip-trigger');
  await trigger.focus();
  await page.keyboard.press('r');
  await page.keyboard.press('ArrowRight');
  await expect(chip).not.toHaveAttribute('data-active');
  await expect(page.locator('.select-popover')).toHaveCount(0);
  await expect(trigger).toHaveAccessibleName('Category');
  await page.keyboard.press('ArrowDown');
  await expect(page.locator('.select-popover')).toBeVisible();
});

test('a date range picker writes from and to to the URL and reads them back after a reload', async ({
  page,
}) => {
  await visit(page, '/docs/components/date-range-picker');
  const field = page
    .locator('.date-range-picker')
    .filter({ has: page.getByRole('group', { name: 'Statement period' }) })
    .last();
  await scrolledTo(field);
  await field.getByRole('button', { name: /^Choose dates/ }).click();
  const popover = page.locator('.date-range-popover');
  await expect(popover).toBeVisible();
  await expect(popover).not.toHaveAttribute('data-entering');
  await popover.getByRole('button', { name: 'Last month' }).click();
  await expect(popover).toHaveCount(0);
  await expect(page).toHaveURL(/\/docs\/components\/date-range-picker\?from=2026-08-01&to=2026-08-31$/);
  await page.reload();
  await settled(page);
  const reloaded = page
    .locator('.date-range-picker')
    .filter({ has: page.getByRole('group', { name: 'Statement period' }) })
    .last();
  await expect(reloaded.locator('.date-segment:not([data-type="literal"])')).toHaveText([
    '8',
    '1',
    '2026',
    '8',
    '31',
    '2026',
  ]);
});

/** The filter bar page's URL example, the last bar on the page. */
const urlBar = (page: Page): Locator => page.locator('.stage .filter-bar').last();

/** The trigger of the chip, or More, whose label is `label`, in `bar`'s row. */
const chipIn = (bar: Locator, label: string): Locator =>
  bar
    .locator('.filter-bar-row .filter-chip-trigger')
    .filter({ has: bar.page().locator('.filter-chip-label', { hasText: new RegExp(`^${label}$`) }) });

test('a filter bar writes its chips to the URL and reads them back after a reload', async ({ page }) => {
  await visit(page, '/docs/components/filter-bar');
  const bar = urlBar(page);
  await scrolledTo(bar);
  await chipIn(bar, 'Category').click();
  await page.getByRole('option', { name: 'Rent' }).click();
  await expect(page).toHaveURL(/\/docs\/components\/filter-bar\?category=rent$/);
  // The secondary Tags chip is behind More.
  await chipIn(bar, 'More').click();
  const panel = page.locator('.filter-bar-more-panel');
  await expect(panel).toBeVisible();
  await expect(panel).not.toHaveAttribute('data-entering');
  await panel.getByRole('button', { name: 'Any Tags' }).click();
  await page.getByRole('option', { name: 'Shared' }).click();
  await expect(page).toHaveURL(/\/docs\/components\/filter-bar\?category=rent&tag=shared$/);
  // Escape closes the list, and then the panel, which kept Tags as it was chosen.
  await page.keyboard.press('Escape');
  await expect(page.locator('.select-popover')).toHaveCount(0);
  await expect(panel.getByRole('region', { name: 'Tags' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(panel).toHaveCount(0);
  await page.reload();
  await settled(page);
  const reloaded = urlBar(page);
  await expect(reloaded.locator('.filter-bar-row .filter-chip[data-active] .filter-chip-label')).toHaveText([
    'Category',
    'Tags',
  ]);
  await expect(reloaded.locator('.filter-bar-sheet-button .badge')).toHaveText('2');
});

test('Clear all clears every filter in one URL write', async ({ page }) => {
  await visit(page, '/docs/components/filter-bar?category=rent&tag=shared&tag=refund');
  const bar = urlBar(page);
  await scrolledTo(bar);
  await expect(bar.locator('.filter-bar-row .filter-chip[data-active]')).toHaveCount(2);
  const entries = await page.evaluate(() => history.length);
  const urls: string[] = [];
  page.on('framenavigated', (frame) => {
    if (frame === page.mainFrame()) urls.push(frame.url());
  });
  await bar.getByRole('button', { name: 'Clear all' }).click();
  await expect(page).toHaveURL(/\/docs\/components\/filter-bar$/);
  await expect(bar.locator('.filter-bar-row .filter-chip[data-active]')).toHaveCount(0);
  await expect(chipIn(bar, 'Category')).toBeFocused();
  // One write: the history keeps its length, and the address changed once.
  expect(await page.evaluate(() => history.length)).toBe(entries);
  expect(urls.filter((url) => !url.endsWith('/docs/components/filter-bar'))).toEqual([]);
});

test.describe('the filter bar on a phone', () => {
  test.use({ viewport: { width: 320, height: 720 } });

  test('shows the search and the Filters button, opens one sheet with every filter, and never scrolls the page sideways', async ({
    page,
  }) => {
    await visit(page, '/docs/components/filter-bar');
    const bar = page.locator('.stage .filter-bar').first();
    await scrolledTo(bar);
    await expect(bar.locator('.filter-bar-row')).toBeHidden();
    await expect(bar.getByRole('searchbox', { name: 'Search transactions' })).toBeVisible();
    const button = bar.locator('.filter-bar-sheet-button');
    await expect(button).toBeVisible();
    await expect(button).toHaveAccessibleName('Filters 2');
    await button.click();
    const overlay = page.locator('.sheet-overlay');
    await expect(overlay).toBeVisible();
    await expect(overlay).not.toHaveAttribute('data-entering');
    const sheet = page.getByRole('dialog', { name: 'Filters' });
    await expect(sheet.getByRole('heading', { level: 3 })).toHaveText([
      'Category',
      'Account',
      'Date',
      'Tags',
    ]);
    await expect(sheet.getByRole('button', { name: 'Done' })).toBeVisible();
    // The calendar section fits inside the sheet, and the page never scrolls sideways.
    const calendar = sheet.locator('.calendar');
    await calendar.scrollIntoViewIfNeeded();
    const sheetBox = await page.locator('.sheet').boundingBox();
    const calendarBox = await calendar.boundingBox();
    if (!sheetBox || !calendarBox) throw new Error('No box');
    expect(calendarBox.x).toBeGreaterThanOrEqual(sheetBox.x);
    expect(calendarBox.x + calendarBox.width).toBeLessThanOrEqual(sheetBox.x + sheetBox.width + 0.5);
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth),
    ).toBe(0);
    expect(await sideways(page)).toBe(0);
  });
});

test('switches to the Filters button at 767px and back to the row at 768px', async ({ page }) => {
  await page.setViewportSize({ width: 767, height: 900 });
  await visit(page, '/docs/components/filter-bar');
  const bar = page.locator('.stage .filter-bar').first();
  await expect(bar.locator('.filter-bar-row')).toBeHidden();
  await expect(bar.locator('.filter-bar-sheet-button')).toBeVisible();
  await page.setViewportSize({ width: 768, height: 900 });
  await expect(bar.locator('.filter-bar-row')).toBeVisible();
  await expect(bar.locator('.filter-bar-sheet-button')).toBeHidden();
  await expect(bar.locator('.filter-bar-clear-all')).toBeVisible();
});

test('gives focus to the first chip when the sheet closes after the phone turns wide', async ({ page }) => {
  await page.setViewportSize({ width: 767, height: 900 });
  await visit(page, '/docs/components/filter-bar');
  const bar = page.locator('.stage .filter-bar').first();
  await bar.locator('.filter-bar-sheet-button').click();
  const overlay = page.locator('.sheet-overlay');
  await expect(overlay).toBeVisible();
  await expect(overlay).not.toHaveAttribute('data-entering');
  const sheet = page.getByRole('dialog', { name: 'Filters' });
  await expect(sheet).toBeFocused();
  // Turned wide with the sheet open: the Filters button it would give focus back to is hidden.
  await page.setViewportSize({ width: 900, height: 767 });
  await expect(bar.locator('.filter-bar-sheet-button')).toBeHidden();
  await page.keyboard.press('Escape');
  await expect(page.locator('.sheet')).toHaveCount(0);
  await expect(bar.locator('.filter-bar-row .filter-chip-trigger').first()).toBeFocused();
});

test('a range calendar chooses a range in two presses and a preset in one', async ({ page }) => {
  await visit(page, '/docs/components/calendar');
  const calendar = page.getByRole('application', { name: /^Statement period/ });
  await scrolledTo(calendar);
  const dayOf = (number: string): Locator =>
    calendar
      .locator('.calendar-day:not([data-outside-month])')
      .filter({ hasText: new RegExp(`^${number}$`) });
  // It opens on the app's range, the last seven days, with that preset pressed.
  await expect(calendar.getByRole('button', { name: 'Last 7 days' })).toHaveAttribute('aria-pressed', 'true');
  await dayOf('3').click();
  await expect(dayOf('3')).toHaveAttribute('data-selection-start');
  await expect(calendar.getByRole('button', { name: 'Last 7 days' })).toHaveAttribute('aria-pressed', 'true');
  await dayOf('9').click();
  await expect(dayOf('3')).toHaveAttribute('data-selection-start');
  await expect(dayOf('9')).toHaveAttribute('data-selection-end');
  await expect(calendar.locator('[aria-selected="true"]')).toHaveCount(7);
  await expect(calendar.getByRole('button', { name: 'Last 7 days' })).toHaveAttribute(
    'aria-pressed',
    'false',
  );
  await calendar.getByRole('button', { name: 'Last month' }).click();
  await expect(calendar.getByRole('button', { name: 'Last month' })).toHaveAttribute('aria-pressed', 'true');
  await expect(calendar.locator('.calendar-heading')).toHaveText('August 2026');
  await expect(calendar.locator('[aria-selected="true"]')).toHaveCount(31);
});

test('the Persian calendar draws Persian digits, and the two locale extensions draw the Gregorian calendar and Latin digits', async ({
  page,
}) => {
  await visit(page, '/docs/components/calendar');
  const example = page.locator('[data-calendar-persian]');
  await scrolledTo(example);
  const headings = example.locator('.calendar-heading');
  await expect(headings).toHaveCount(3);
  // fa-IR: Shahrivar 1405 in Persian digits; fa-IR-u-ca-gregory: September 2026 in Persian digits;
  // fa-IR-u-nu-latn: Shahrivar 1405 in Latin digits.
  await expect(headings.nth(0)).toHaveText(/۱۴۰۵/);
  await expect(headings.nth(1)).toHaveText(/۲۰۲۶/);
  await expect(headings.nth(2)).toHaveText(/1405/);
  await expect(headings.nth(0)).not.toHaveText(/\d/);
});

test('a calendar fits a 320px screen without scrolling the page sideways', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await visit(page, '/docs/components/calendar');
  expect(await sideways(page)).toBe(0);
  // Each calendar shrinks with the room its stage gives it, with square days, and stays inside the stage.
  for (const calendar of await page.locator('.stage .calendar').all()) {
    await scrolledTo(calendar);
    const box = await calendar.boundingBox();
    const stage = await calendar.locator('xpath=ancestor::*[contains(@class, "stage")][1]').boundingBox();
    expect((box?.x ?? 0) + (box?.width ?? 0)).toBeLessThanOrEqual(
      (stage?.x ?? 0) + (stage?.width ?? 0) + 0.5,
    );
    // Inline, a day shrinks with the stage but never below the 24px target minimum.
    const day = await calendar.locator('.calendar-day').first().boundingBox();
    expect(day?.width ?? 0).toBeGreaterThanOrEqual(24);
    expect(day?.width ?? 0).toBeCloseTo(day?.height ?? -1, 0);
  }
  expect(await sideways(page)).toBe(0);
});

test('the text area page takes lines with Enter, counts them and never blocks typing', async ({ page }) => {
  await visit(page, '/docs/components/text-area');
  const field = fieldNamed(page, 'About the workspace');
  const area = field.getByRole('textbox');
  const counter = field.locator('.field-counter');
  await expect(counter).toHaveText('93 of about 120');

  // fill puts the caret at the end, so Enter starts a new line there and does not send the form.
  const lines = 'A shared space for the design team.\nBriefs and reviews live here.';
  await area.fill(lines);
  await area.press('Enter');
  await area.pressSequentially('Notes too, and a long tail of other words to pass the budget.');
  const value = await area.inputValue();
  expect(value).toBe(`${lines}\nNotes too, and a long tail of other words to pass the budget.`);
  // A line break counts as one character.
  await expect(counter).toHaveText(`${String(value.length)} of about 120`);
  await expect(counter).toHaveAttribute('data-over');
  await expect(counter).toHaveCSS('font-weight', '700');
  await area.fill('Short');
  await expect(counter).toHaveText('');
});

test('a text area draws a control corner, a 6rem floor and vertical resize, and keeps the field edges', async ({
  page,
}) => {
  await page.emulateMedia({ colorScheme: 'light' });
  await visit(page, '/docs/components/text-area');
  const plain = page.getByRole('textbox', { name: 'Short description' });
  await expect(plain).toHaveCSS('border-top-left-radius', '20px');
  await expect(plain).toHaveCSS('min-height', '96px');
  await expect(plain).toHaveCSS('resize', 'vertical');
  expect((await plain.boundingBox())?.height).toBeGreaterThanOrEqual(96);
  await expect(plain).toHaveCSS('border-top-color', 'rgba(20, 20, 19, 0.5)');

  // The changed and invalid edges of the field hold on the taller box.
  const changed = page.getByRole('textbox', { name: 'Welcome message' });
  await expect(changed).toHaveCSS('border-top-color', 'rgb(243, 115, 56)');
  await expect(changed).toHaveCSS('border-top-left-radius', '20px');
  const invalid = page.getByRole('textbox', { name: 'Invite note' });
  await expect(invalid).toHaveCSS('border-top-color', 'rgb(163, 35, 27)');

  // Focus firms the edge and draws the ring; a changed field keeps its own edge and shows the ring alone.
  await plain.focus();
  await expect(plain).toHaveCSS('border-top-color', 'rgb(20, 20, 19)');
  await expect(plain).toHaveCSS('outline-style', 'solid');
  await expect(plain).toHaveCSS('outline-width', '2px');
  await changed.focus();
  await expect(changed).toHaveCSS('border-top-color', 'rgb(243, 115, 56)');
  await expect(changed).toHaveCSS('outline-style', 'solid');
});

/** The form on the checkbox page that asks for a group and a single checkbox. */
const preferencesForm = (page: Page): Locator =>
  page.locator('form').filter({ has: page.getByRole('button', { name: 'Save preferences' }) });

test('the checkbox page blocks an empty submit, names the problem and saves once it is fixed', async ({
  page,
}) => {
  await page.emulateMedia({ colorScheme: 'light' });
  await visit(page, '/docs/components/checkbox');
  const form = preferencesForm(page);
  const group = form.getByRole('group', { name: /Notify me by/ });
  const save = form.getByRole('button', { name: 'Save preferences' });

  await save.click();
  await expect(group.locator('.field-error')).toHaveText('Pick at least one way to be notified.');
  await expect(group).toHaveAttribute('data-invalid');
  await expect(group.getByRole('checkbox', { name: 'Email' })).toBeFocused();
  // Every box of an invalid group draws the error edge.
  await expect(group.locator('.checkbox-box')).toHaveCount(3);
  for (const box of await group.locator('.checkbox-box').all()) {
    await expect(box).toHaveCSS('border-top-color', 'rgb(163, 35, 27)');
  }

  // The label is the target: press the text, as a reader does.
  await form.getByText('Push notification', { exact: true }).click();
  await form.getByText('I accept the terms', { exact: true }).click();
  await save.click();
  await expect(form.getByRole('status')).toHaveText('Saved: push.');
  await expect(form.locator('.field-error')).toHaveCount(0);
});

test('the arrow keys do not move between the checkboxes of a group, and Tab does', async ({ page }) => {
  await visit(page, '/docs/components/checkbox');
  const group = page.getByRole('group', { name: /Notify me by/ }).first();
  const email = group.getByRole('checkbox', { name: 'Email' });
  const sms = group.getByRole('checkbox', { name: 'Text message' });
  await email.focus();
  await expect(email).toBeFocused();
  for (const key of ['ArrowDown', 'ArrowRight', 'ArrowUp', 'ArrowLeft']) await page.keyboard.press(key);
  await expect(email).toBeFocused();
  await expect(email).toBeChecked();
  await page.keyboard.press('Tab');
  await expect(sms).toBeFocused();
  await page.keyboard.press('Space');
  await expect(sms).toBeChecked();
  await expect(email).toBeChecked();
});

test('the whole checkbox row is the target, and it is at least 40px tall', async ({ page }) => {
  await visit(page, '/docs/components/checkbox');
  const label = page.locator('label.checkbox').filter({ hasText: 'Show service descriptions' });
  const input = label.getByRole('checkbox');
  await label.evaluate((element) => {
    element.scrollIntoView({ block: 'center' });
  });
  const row = await label.boundingBox();
  const box = await label.locator('.checkbox-box').boundingBox();
  const text = await label.locator('.checkbox-text').boundingBox();
  if (!row || !box || !text) throw new Error('The row is not on screen');
  expect(row.height).toBeGreaterThanOrEqual(40);
  expect(box.width).toBe(20);
  // A press in the gap between the box and the text, which is neither of them, still toggles.
  await expect(input).not.toBeChecked();
  await page.mouse.click((box.x + box.width + text.x) / 2, row.y + row.height / 2);
  await expect(input).toBeChecked();
  // So does one in the padding above the box.
  await page.mouse.click(box.x + box.width / 2, row.y + 2);
  await expect(input).not.toBeChecked();
});

for (const theme of ['light', 'dark'] as const) {
  test(`a checked box draws its mark in canvas on ink in ${theme}`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: theme });
    await visit(page, '/docs/components/checkbox');
    await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
    const label = page.locator('label.checkbox').filter({ hasText: 'Remember me on this device' });
    await expect(label.getByRole('checkbox')).toBeChecked();
    const colors = await label.locator('.checkbox-box').evaluate((box) => ({
      fill: getComputedStyle(box).backgroundColor,
      mark: getComputedStyle(box, '::after').backgroundColor,
    }));
    // Ink is dark in light and white in dark, and canvas is the other way round, so the mark always shows.
    expect(colors).toEqual(
      theme === 'light'
        ? { fill: 'rgb(20, 20, 19)', mark: 'rgb(243, 240, 238)' }
        : { fill: 'rgb(255, 255, 255)', mark: 'rgb(14, 14, 13)' },
    );
  });
}

test('a select-all checkbox is mixed while some of its children are checked', async ({ page }) => {
  await visit(page, '/docs/components/checkbox');
  const all = page.getByRole('checkbox', { name: 'Select all channels' });
  const channels = page.getByRole('group', { name: 'Channels' });
  await expect(all).toBeChecked({ indeterminate: true });
  await page.locator('label.checkbox', { hasText: 'Select all channels' }).click();
  await expect(all).toBeChecked();
  await expect(channels.getByRole('checkbox', { checked: true })).toHaveCount(3);
  await channels.locator('label.checkbox', { hasText: 'Email' }).click();
  await expect(all).toBeChecked({ indeterminate: true });
  await expect(channels.getByRole('checkbox', { checked: true })).toHaveCount(2);
});

test('the radio group page shows a failed submit as an error line on every row, and sends once a plan is chosen', async ({
  page,
}) => {
  await page.emulateMedia({ colorScheme: 'light' });
  await visit(page, '/docs/components/radio-group');
  const group = page.getByRole('radiogroup', { name: 'Plan', exact: true });
  const rows = group.locator('label.radio');
  const submit = page.getByRole('button', { name: 'Continue' });

  await submit.click();
  await expect(group.locator('.field-error')).toHaveText('Choose a plan to continue.');
  await expect(group).toHaveAttribute('data-invalid');
  await expect(group.getByRole('radio').first()).toBeFocused();
  for (const row of await rows.all()) await expect(row).toHaveCSS('border-top-color', 'rgb(163, 35, 27)');

  // Choosing an option clears the error, and the form then sends the value.
  await group.getByText('Team').click();
  await expect(group.locator('.field-error')).toHaveCount(0);
  await expect(rows.first()).toHaveCSS('border-top-color', 'rgba(0, 0, 0, 0)');
  await submit.click();
  await expect(page.getByText('You chose the team plan.')).toBeVisible();
});

test('the arrow keys move the choice of a radio group, and the chosen row draws its focus ring in canvas inside the ink', async ({
  page,
}) => {
  await page.emulateMedia({ colorScheme: 'light' });
  await visit(page, '/docs/components/radio-group');
  const group = page.getByRole('radiogroup', { name: 'Newsletter frequency' });
  const weekly = group.getByRole('radio', { name: 'Weekly' });
  const monthly = group.getByRole('radio', { name: 'Monthly' });
  // `has` is resolved inside each row, so the radio is looked up from the page and not from the group.
  const rowOf = (name: string): Locator =>
    group.locator('label.radio', { has: page.getByRole('radio', { name }) });

  // A change from the saved choice shows the chip, and going back hides it.
  await expect(group.locator('.field-changed')).toHaveCount(1);
  await expect(group.locator('.field-changed')).toBeHidden();
  await weekly.focus();
  await page.keyboard.press('ArrowDown');
  await expect(monthly).toBeFocused();
  await expect(monthly).toBeChecked();
  await expect(group.locator('.field-changed')).toBeVisible();
  const chosen = rowOf('Monthly');
  await expect(chosen).toHaveCSS('background-color', 'rgb(20, 20, 19)');
  await expect(chosen).toHaveCSS('color', 'rgb(243, 240, 238)');
  await expect(chosen).toHaveCSS('outline-style', 'solid');
  await expect(chosen).toHaveCSS('outline-color', 'rgb(243, 240, 238)');
  await expect(chosen).toHaveCSS('outline-offset', '-4px');
  await page.keyboard.press('ArrowUp');
  await expect(weekly).toBeChecked();
  await expect(group.locator('.field-changed')).toHaveCount(1);
  await expect(group.locator('.field-changed')).toBeHidden();
  // The row that lost the choice is plain again.
  await expect(rowOf('Monthly')).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
});

test('every option of a radio group is a target of 40px or more, across the whole row', async ({ page }) => {
  await visit(page, '/docs/components/radio-group');
  const group = page.getByRole('radiogroup', { name: 'Newsletter frequency' });
  const { height } = await hitSize(group.locator('label.radio').first());
  expect(height).toBeGreaterThanOrEqual(40);
  // A stacked row fills the group, so the empty end of the row is part of the target.
  const [row, field] = await Promise.all([
    group.locator('label.radio').first().boundingBox(),
    group.locator('.radio-items').boundingBox(),
  ]);
  expect(row?.width).toBeCloseTo(field?.width ?? 0, 0);
});

/** The gaps, in px, between the thumb and the two ends of the track of the switch row `row`. */
const thumbGaps = (row: Locator): Promise<{ start: number; end: number }> =>
  row.evaluate((element) => {
    const track = element.querySelector('.switch-track')?.getBoundingClientRect();
    const thumb = element.querySelector('.switch-thumb')?.getBoundingClientRect();
    if (!track || !thumb) throw new Error('No switch drawn');
    return { start: thumb.left - track.left, end: track.right - thumb.right };
  });

/** The switch row whose control has this name, on the page that is open. */
const switchNamed = (page: Page, name: string): Locator =>
  page.locator('.switch').filter({ has: page.getByRole('switch', { name, exact: true }) });

test('a switch flips by a press on its label and by Space, and its thumb keeps the same gap at both ends', async ({
  page,
}) => {
  await page.emulateMedia({ colorScheme: 'light' });
  await visit(page, '/docs/components/switch');
  const control = page.getByRole('switch', { name: 'Notify me about replies', exact: true });
  const row = switchNamed(page, 'Notify me about replies');
  await expect(control).toBeChecked();
  await expect.poll(async () => (await thumbGaps(row)).end).toBeCloseTo(3, 1);

  await row.click();
  await expect(control).not.toBeChecked();
  await expect.poll(async () => (await thumbGaps(row)).start).toBeCloseTo(3, 1);

  await control.focus();
  await page.keyboard.press('Space');
  await expect(control).toBeChecked();
  await expect.poll(async () => (await thumbGaps(row)).end).toBeCloseTo(3, 1);
  // The 30px track is drawn inside a row that is hit at 40px.
  expect((await hitSize(row)).height).toBeGreaterThanOrEqual(40);
});

test('a disabled switch looks different when it is on and when it is off, and neither looks enabled', async ({
  page,
}) => {
  await page.emulateMedia({ colorScheme: 'light' });
  await visit(page, '/docs/components/switch');
  const fill = (name: string): Promise<string> =>
    switchNamed(page, name)
      .locator('.switch-track')
      .evaluate((track) => getComputedStyle(track).backgroundColor);
  const [on, off, disabledOn, disabledOff] = [
    await fill('On'),
    await fill('Off'),
    await fill('Disabled and on'),
    await fill('Disabled and off'),
  ];
  expect(new Set([on, off, disabledOn, disabledOff]).size).toBe(4);
  await expect(page.getByRole('switch', { name: 'Disabled and on', exact: true })).toBeDisabled();
  await expect(switchNamed(page, 'Disabled and off')).toHaveCSS('cursor', 'not-allowed');
  await expect(switchNamed(page, 'Read-only')).toHaveCSS('cursor', 'default');
});

test('the unsaved changes example shows the chip and the ring until the setting is saved or discarded', async ({
  page,
}) => {
  await page.emulateMedia({ colorScheme: 'light' });
  await visit(page, '/docs/components/switch');
  const digest = page.getByRole('switch', { name: 'Weekly digest', exact: true });
  const field = page.locator('.field').filter({ has: digest });
  /** The changed ring around the track, as its width and color. It has no width until the switch is changed. */
  const ring = (): Promise<string> =>
    field.locator('.switch-track').evaluate((track) => {
      const { borderTopWidth, borderTopColor } = getComputedStyle(track, '::before');
      return `${borderTopWidth} ${borderTopColor}`;
    });
  const save = page.getByRole('button', { name: 'Save changes' });
  const discard = page.getByRole('button', { name: 'Discard' });
  await expect(field.locator('.field-changed')).toHaveCount(1);
  await expect(field.locator('.field-changed')).toBeHidden();
  await expect(save).toBeDisabled();
  expect(await ring()).toMatch(/^0px /);

  await switchNamed(page, 'Weekly digest').click();
  await expect(digest).toBeChecked();
  await expect(field.locator('.field-changed')).toBeVisible();
  await expect(digest).toHaveAccessibleDescription('Every Tuesday morning. Changed');
  expect(await ring()).toBe('2px rgb(243, 115, 56)');
  await expect(save).toBeEnabled();

  await discard.click();
  await expect(digest).not.toBeChecked();
  await expect(field.locator('.field-changed')).toHaveCount(1);
  await expect(field.locator('.field-changed')).toBeHidden();

  await switchNamed(page, 'Weekly digest').click();
  await save.click();
  await expect(digest).toBeChecked();
  await expect(field.locator('.field-changed')).toHaveCount(1);
  await expect(field.locator('.field-changed')).toBeHidden();
  await expect(save).toBeDisabled();
});

for (const width of [375, 1440]) {
  test(`the props and the keys are real tables with a header cell for each row, at ${String(width)}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await visit(page);
    const props = page.getByRole('table', { name: 'Props' });
    const rows = await props.getByRole('row').count();
    expect(rows).toBeGreaterThan(0);
    await expect(props.getByRole('rowheader')).toHaveCount(rows);
    await expect(props.getByRole('cell')).toHaveCount(rows);
    await expect(props.getByRole('rowheader').first()).toContainText('isDisabled');
    const keys = page.getByRole('table', { name: 'Keyboard' });
    await expect(keys.getByRole('row')).toHaveCount(2);
    await expect(keys.getByRole('rowheader').first()).toContainText('Space');
    await expect(keys.getByRole('cell').first()).toHaveText('Activates the button.');

    // Side by side from 768px: the name and its description share a line. On a phone each row stacks.
    const [name, description] = await Promise.all([
      props.getByRole('rowheader').first().boundingBox(),
      props.getByRole('cell').first().boundingBox(),
    ]);
    if (!name || !description) throw new Error('The first prop is not on screen');
    if (width < 768) {
      expect(description.y).toBeGreaterThanOrEqual(name.y + name.height - 1);
      expect(description.x).toBeCloseTo(name.x, 0);
    } else {
      expect(description.x).toBeGreaterThan(name.x + name.width - 1);
      expect(description.y).toBeCloseTo(name.y, 0);
    }
  });
}

test('the copy button reports that the code was copied', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await visit(page);
  const block = page.locator('.code').filter({ has: page.getByRole('button', { name: 'Copy code' }) });
  await expect(block.getByRole('status')).toHaveText('');
  await block.getByRole('button', { name: 'Copy code' }).click();
  await expect(block.getByRole('status')).toHaveText('Copied');
  expect(await page.evaluate(() => navigator.clipboard.readText())).toContain('SaveBar');
  await expect(block.getByRole('status')).toHaveText('', { timeout: 5000 });
});

test('a code block keeps the indentation it is written with, on the page and in what the copy button copies', async ({
  page,
  context,
}) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await visit(page);
  const block = page.locator('.code').filter({ hasText: 'export function SaveBar' });
  // MDX strips two columns from every continuation line of a JS expression, so code written inside
  // <Code code={`...`} /> lost them and "return (" came out flush left. A fenced block is not an expression.
  const indented =
    'export function SaveBar({ isSaving }: { isSaving: boolean }) {\n' +
    '  return (\n' +
    '    <Button type="submit" isPending={isSaving} pendingLabel="Saving">\n' +
    '      Save changes\n' +
    '    </Button>\n' +
    '  );\n' +
    '}';
  expect(await block.locator('pre').textContent()).toContain(indented);
  await block.getByRole('button', { name: 'Copy code' }).click();
  await expect(block.getByRole('status')).toHaveText('Copied');
  expect(await page.evaluate(() => navigator.clipboard.readText())).toContain(indented);
});

test('the copy button reports a failure when there is no clipboard', async ({ page }) => {
  await withoutClipboard(page, 'missing');
  await visit(page);
  const block = page.locator('.code').filter({ has: page.getByRole('button', { name: 'Copy code' }) });
  await block.getByRole('button', { name: 'Copy code' }).click();
  await expect(block.getByRole('status')).toHaveText('Copy failed');
});

test('reduced motion stops the shell transitions', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await visit(page);
  await expect(page.locator('.rail')).not.toHaveCSS('transition-duration', '0s');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  for (const selector of ['.rail', '.workspace', '.scrim', '.tab-list', '.icon-button']) {
    await expect(page.locator(selector).first()).toHaveCSS('transition-duration', '0s');
  }
});

for (const width of [375, 1440]) {
  test(`brand link, preview tabs, contents links and package links are hit at 40px at ${String(width)}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await visit(page);

    // The rail is a drawer on a phone: open it, and the brand is on screen to be hit.
    if (width < 1024) {
      await page.getByRole('button', { name: 'Open the menu' }).click();
      await railLinkInView(page.getByRole('link', { name: 'Spinner' }));
    }
    const brand = page.locator('.brand');
    const size = await hitSize(brand);
    expect(size.height).toBeGreaterThanOrEqual(40);
    expect(size.width).toBeGreaterThanOrEqual(40);
    expect(await hitsAt(brand, '.brand', -19)).toBe(true);
    expect(await hitsAt(brand, '.brand', 19)).toBe(true);

    if (width < 1024) {
      await page.keyboard.press('Escape');
      // Closed means the page is no longer inert and the rail has finished sliding out.
      await expect(page.locator('html')).not.toHaveAttribute('data-drawer', 'open');
      await expect(page.locator('.workspace')).not.toHaveAttribute('inert');
      await expect(page.locator('#rail')).toBeHidden();
    }
    for (const tab of await page.locator('.tab:visible').all()) {
      // Hit-testing needs the tab on screen and clear of the sticky header.
      await tab.evaluate((element) => {
        element.scrollIntoView({ block: 'center' });
      });
      const tabSize = await hitSize(tab);
      expect(tabSize.height).toBeGreaterThanOrEqual(40);
      expect(tabSize.width).toBeGreaterThanOrEqual(40);
      expect(await hitsAt(tab, '.tab', -19)).toBe(true);
      expect(await hitsAt(tab, '.tab', 19)).toBe(true);
    }

    // The package card's links, "Edit this page" and "React Aria", are 14px text in a row.
    const packageLinks = page.locator('.meta-row .link');
    await expect(packageLinks).toHaveCount(2);
    for (const link of await packageLinks.all()) {
      await link.evaluate((element) => {
        element.scrollIntoView({ block: 'center' });
      });
      const linkSize = await hitSize(link);
      expect(linkSize.height).toBeGreaterThanOrEqual(40);
      expect(linkSize.width).toBeGreaterThanOrEqual(40);
      expect(await hitsAt(link, '.meta-row .link', -19)).toBe(true);
      expect(await hitsAt(link, '.meta-row .link', 19)).toBe(true);
    }

    // The contents list is a desktop aside: under 1440px it folds away.
    const links = page.locator('.toc a:visible');
    if (width < 1440) {
      await expect(links).toHaveCount(0);
    } else {
      expect(await links.count()).toBeGreaterThan(0);
      for (const link of await links.all()) {
        const linkSize = await hitSize(link);
        expect(linkSize.height).toBeGreaterThanOrEqual(40);
        expect(linkSize.width).toBeGreaterThanOrEqual(40);
      }
    }
  });
}

for (const width of [375, 1440]) {
  test(`the header switches are segmented controls, named for what they set and hit at 40px at ${String(width)}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await visit(page);
    for (const [name, options] of [
      ['Color mode', ['Light', 'Dark']],
      ['Corners', ['Rounded', 'Soft', 'Square']],
    ] as const) {
      const group = page.getByRole('radiogroup', { name, exact: true });
      await expect(group).toHaveClass(/segmented-sm/);
      await expect(group.getByRole('radio')).toHaveCount(options.length);
      for (const text of options) {
        const option = group.locator('.segmented-option', { hasText: text });
        // The option is drawn at 32px and hit at 40px, with the extra area on the option itself.
        const size = await hitSize(option);
        expect(size.height).toBeGreaterThanOrEqual(40);
        expect(size.width).toBeGreaterThanOrEqual(40);
        expect(await hitsAt(option, '.segmented-option', -18)).toBe(true);
        expect(await hitsAt(option, '.segmented-option', 18)).toBe(true);
      }
    }
  });
}

test('the segmented control page keeps a wide room in one row and stacks a narrow one, and follows the window', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await visit(page, '/docs/components/segmented-control');
  const wide = page.getByRole('radiogroup', { name: 'Report cadence in a wide room' });
  const narrow = page.getByRole('radiogroup', { name: 'Report cadence in a narrow room' });
  await expect(wide).not.toHaveAttribute('data-stacked');
  await expect(narrow).toHaveAttribute('data-stacked');
  const options = await narrow.locator('.segmented-option').all();
  expect(options).toHaveLength(5);
  for (const option of options) expect((await option.boundingBox())?.height).toBeCloseTo(40, 1);
  // The window narrows and the wide room no longer fits its row. Widened, the row comes back.
  await page.setViewportSize({ width: 375, height: 900 });
  await expect(wide).toHaveAttribute('data-stacked');
  // The shell eases into the narrow layout, so the page settles a moment after the control does.
  await expect.poll(() => sideways(page)).toBe(0);
  await page.setViewportSize({ width: 1440, height: 900 });
  await expect(wide).not.toHaveAttribute('data-stacked');
});

test('the segmented control page chooses with the arrow keys and draws each state on the track edge', async ({
  page,
}) => {
  await page.emulateMedia({ colorScheme: 'light' });
  await visit(page, '/docs/components/segmented-control');
  const mode = page.getByRole('radiogroup', { name: 'Appearance' });
  await expect(mode.getByRole('radio', { name: 'System' })).toBeChecked();
  await mode.getByRole('radio', { name: 'System' }).focus();
  await page.keyboard.press('ArrowLeft');
  await expect(mode.getByRole('radio', { name: 'Dark' })).toBeChecked();
  await expect(mode.getByRole('radio', { name: 'Dark' })).toBeFocused();
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('ArrowRight');
  await expect(mode.getByRole('radio', { name: 'Light' })).toBeChecked();

  // A changed control draws the light signal orange edge and its chip.
  const changed = page.locator('.segmented[data-changed]');
  await expect(changed.locator('.field-changed')).toBeVisible();
  await expect(changed.locator('.segmented-track')).toHaveCSS('border-top-color', 'rgb(243, 115, 56)');
  // An invalid one draws the error edge and the error line, and no chip.
  const invalid = page.locator('.segmented[data-invalid]');
  await expect(invalid.locator('.field-error')).toHaveText('Choose a plan to continue.');
  await expect(invalid.locator('.field-changed')).toHaveCount(0);
  await expect(invalid.locator('.segmented-track')).toHaveCSS('border-top-color', 'rgb(163, 35, 27)');
  // A disabled one is recessed, and its chosen option is a taupe pill.
  const disabled = page.locator('.segmented[data-disabled]');
  await expect(disabled.getByRole('radio', { name: 'Business' })).toBeDisabled();
  await expect(disabled.locator('.segmented-track')).toHaveCSS('background-color', 'rgb(244, 244, 244)');
  await expect(disabled.locator('.segmented-option[data-selected]')).toHaveCSS(
    'background-color',
    'rgb(209, 205, 199)',
  );
  await expect(disabled.locator('.segmented-option').first()).toHaveCSS('cursor', 'not-allowed');
});

test('a collapsible card folds and opens on its page, by pointer and by keyboard', async ({ page }) => {
  await visit(page, '/docs/components/collapsible-card');
  const toggle = page.getByRole('button', { name: 'Notifications', exact: true });
  const card = page.locator('.card-collapsible').filter({ has: toggle });
  const body = card.locator('.card-body');
  await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  await expect(body).toBeVisible();
  // Open, Tab goes from the toggle into the body.
  await toggle.focus();
  await page.keyboard.press('Tab');
  await expect(page.getByRole('button', { name: 'Send a test email' })).toBeFocused();
  await toggle.click();
  // The card marks the fold while it moves, so the body clips.
  await expect(card).toHaveAttribute('data-folding', '');
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  await expect(card).not.toHaveAttribute('data-expanded');
  await expect(body).toBeHidden();
  // Once the fold has settled, React Aria hides the panel, and the card stops marking the move.
  await expect(card.locator('.card-fold')).toHaveAttribute('hidden', 'until-found');
  await expect(card).not.toHaveAttribute('data-folding');
  // Folded, the body takes no focus: Tab goes from the toggle to the next card's.
  await toggle.focus();
  await page.keyboard.press('Tab');
  await expect(page.getByRole('button', { name: 'Billing', exact: true })).toBeFocused();
  await toggle.press('Enter');
  await expect(card).toHaveAttribute('data-folding', '');
  await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  await expect(body).toBeVisible();
  await expect(card).not.toHaveAttribute('data-folding');
  await toggle.press('Space');
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  await expect(body).toBeHidden();
});

test('a collapsible card remembers its fold over a reload, and folds at hydration with its transitions held off', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  page.on('pageerror', (error) => {
    errors.push(error.message);
  });
  // From before the page's first script: each change to the Shortcuts card's root, in order, and each
  // transition that one of its parts starts. The docs' theme switch also holds every transition off while
  // the page hydrates, so on this page the mark is what is checked.
  await page.addInitScript(() => {
    const changes: string[] = [];
    const runs: string[] = [];
    Object.assign(window, { changes, runs });
    /** The Shortcuts card, if `element` is in it. */
    const shortcuts = (element: unknown): Element | null => {
      const card = element instanceof Element ? element.closest('.card-collapsible') : null;
      return card?.querySelector('.card-toggle-text')?.textContent === 'Shortcuts' ? card : null;
    };
    new MutationObserver((records) => {
      for (const { target, attributeName, oldValue } of records) {
        if (shortcuts(target) === target) {
          changes.push(`${attributeName ?? ''} ${oldValue === null ? 'set' : 'removed'}`);
        }
      }
    }).observe(document, {
      subtree: true,
      attributes: true,
      attributeOldValue: true,
      attributeFilter: ['data-expanded', 'data-instant'],
    });
    window.addEventListener(
      'transitionrun',
      (event) => {
        if (shortcuts(event.target)) runs.push(event.propertyName);
      },
      true,
    );
  });
  const read = (name: 'changes' | 'runs'): Promise<string[]> =>
    page.evaluate((key) => (window as unknown as Record<string, string[]>)[key] ?? [], name);
  const stored = (): Promise<string | null> =>
    page.evaluate(() => localStorage.getItem('snapshot-ui:collapsed'));
  await visit(page, '/docs/components/collapsible-card');
  const toggle = page.getByRole('button', { name: 'Shortcuts', exact: true });
  const card = page.locator('.card-collapsible').filter({ has: toggle });
  await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  expect(await stored()).toBe('["docs-collapsible-card-shortcuts"]');
  const response = await page.reload();
  // The server cannot see the stored fold, so it sent the card open, with the mark that holds every
  // transition off: the root, then the card's own toggle, with no other card's root between them.
  const html = (await response?.text()) ?? '';
  expect(html).toMatch(
    /class="card card-collapsible" data-expanded="" data-instant="">(?:(?!card-collapsible).)*?aria-expanded="true"[^>]*><span class="card-toggle-text">Shortcuts</s,
  );
  await settled(page);
  // Hydrated, the card folded while the mark held its transitions off, and the mark came off after it.
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  await expect(card.locator('.card-fold')).toHaveAttribute('hidden', 'until-found');
  await expect(card).not.toHaveAttribute('data-instant');
  await expect(card).not.toHaveAttribute('data-folding');
  expect(await read('changes')).toEqual(['data-expanded removed', 'data-instant removed']);
  expect(errors).toEqual([]);
  // A press after that moves as usual, and the card is remembered open.
  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  await expect.poll(() => read('runs')).toContain('rotate');
  expect(await read('changes')).toEqual([
    'data-expanded removed',
    'data-instant removed',
    'data-expanded set',
  ]);
  expect(await stored()).toBe('[]');
});

test('a folded collapsible card on its page is hidden until found, so find-in-page can reach it', async ({
  page,
}) => {
  await visit(page, '/docs/components/collapsible-card');
  const toggle = page.getByRole('button', { name: 'Billing', exact: true });
  const fold = page.locator('.card-collapsible').filter({ has: toggle }).locator('.card-fold');
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  await expect(fold).toHaveAttribute('hidden', 'until-found');
  // The site's rule for [hidden] leaves this one to the browser, which keeps the panel in the layout and
  // hides what it holds, instead of taking it out with display: none, where find-in-page cannot look.
  await expect(fold).not.toHaveCSS('display', 'none');
  await expect(fold.locator('.card-body')).toBeHidden();
});

test('a folded collapsible card on its page marks the change it holds, and drops the mark when it is reset', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  page.on('pageerror', (error) => {
    errors.push(error.message);
  });
  await visit(page, '/docs/components/collapsible-card');
  const toggle = page.getByRole('button', { name: 'Workspace', exact: true });
  const card = page.locator('.card-collapsible').filter({ has: toggle });
  const dot = toggle.locator('.card-marker');
  /** Where the title's words sit in the card, wherever the page has scrolled to. */
  const place = (): Promise<number[]> =>
    toggle.locator('.card-toggle-text').evaluate((element) => {
      const box = element.getBoundingClientRect();
      const edge = element.closest('.card-collapsible')?.getBoundingClientRect() ?? box;
      return [box.left - edge.left, box.top - edge.top, box.width, box.height];
    });
  // The server drew the card folded, and once the page has hydrated the card finds the changed field in it,
  // with no hydration warning.
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  await expect(dot).toBeVisible();
  await expect(dot).toHaveCSS('background-color', 'rgb(154, 58, 10)');
  await expect(toggle).toHaveAccessibleDescription('Changed');
  await expect(page.getByRole('heading', { name: 'Workspace', exact: true })).toBeVisible();
  expect(errors).toEqual([]);
  const marked = await place();
  // Open, the field shows its own chip and the card shows no mark. Folded again, the mark is back.
  await toggle.click();
  await expect(dot).toHaveCount(0);
  await expect(card.locator('.field-changed')).toBeVisible();
  await toggle.click();
  await expect(dot).toBeVisible();
  // Reset sits in the header, so it works while the card is folded. The mark goes, and the title stays put.
  await card.getByRole('button', { name: 'Reset' }).click();
  await expect(dot).toHaveCount(0);
  await expect(toggle).not.toHaveAttribute('aria-describedby');
  expect(await place()).toEqual(marked);
});

test('the dialog page opens its dialog, holds focus, locks the page and gives focus back', async ({
  page,
}) => {
  await visit(page, '/docs/components/dialog');
  const trigger = page.getByRole('button', { name: 'Rename the workspace' });
  await trigger.click();
  const dialog = page.getByRole('dialog', { name: 'Rename the workspace' });
  await expect(dialog).toBeVisible();
  await expect(dialog).toBeFocused();
  // React Aria holds the page still while the dialog is open.
  await expect(page.locator('html')).toHaveCSS('overflow', 'hidden');
  // Tab from the last control lands back inside the dialog, never on the page behind it.
  const last = dialog.getByRole('button').last();
  await last.focus();
  await page.keyboard.press('Tab');
  expect(await dialog.evaluate((element) => element.contains(document.activeElement))).toBe(true);
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  await expect(trigger).toBeFocused();
  await expect(page.locator('html')).not.toHaveCSS('overflow', 'hidden');
});

test('the confirm dialog page asks, cancels, confirms and places focus', async ({ page }) => {
  await visit(page, '/docs/components/confirm-dialog');
  const list = page.getByRole('list', { name: 'Transactions' });
  const groceries = list.getByRole('button', { name: 'Delete Groceries' });
  await groceries.click();
  const question = page.getByRole('alertdialog', { name: 'Delete Groceries?' });
  await expect(question).toBeVisible();
  // The danger tone puts focus on the safe answer.
  await expect(question.getByRole('button', { name: 'Cancel' })).toBeFocused();
  await question.getByRole('button', { name: 'Cancel' }).click();
  await expect(question).toHaveCount(0);
  await expect(list.getByRole('listitem')).toHaveCount(3);
  await expect(groceries).toBeFocused();

  await groceries.click();
  await question.getByRole('button', { name: 'Delete Groceries' }).click();
  await expect(question).toHaveCount(0);
  await expect(list.getByRole('listitem')).toHaveCount(2);
  // The row and its button are gone, so the example puts focus on the next row's button.
  await expect(list.getByRole('button', { name: 'Delete Insurance' })).toBeFocused();
});

test('the drawer page opens a navigation drawer that locks the page and closes on Escape', async ({
  page,
}) => {
  await visit(page, '/docs/components/drawer');
  const trigger = page.getByRole('button', { name: 'Browse the workspace' });
  await trigger.click();
  // The title is hidden, since the list names itself, and still names the drawer.
  const drawer = page.getByRole('dialog', { name: 'Workspace', exact: true });
  await expect(drawer).toBeVisible();
  await expect(drawer).toBeFocused();
  const title = drawer.getByRole('heading', { name: 'Workspace', exact: true });
  await expect(title).toBeAttached();
  // Kept for assistive technology in React Aria's visually hidden box, 1px wide and clipped.
  expect(await title.evaluate((element) => element.parentElement?.getBoundingClientRect().width)).toBe(1);
  await expect(drawer.getByRole('navigation', { name: 'Workspace pages' })).toBeVisible();
  // It comes from the start, the left in English, and floats 16px inside the edges once it has slid in.
  const panel = page.locator('.drawer');
  await expect(panel).toHaveAttribute('data-side', 'left');
  await expect(panel).not.toHaveAttribute('data-entering');
  await expect.poll(async () => (await panel.boundingBox())?.x).toBeCloseTo(16, 0);
  await expect.poll(async () => (await panel.boundingBox())?.y).toBeCloseTo(16, 0);
  // React Aria holds the page still while the drawer is open.
  await expect(page.locator('html')).toHaveCSS('overflow', 'hidden');
  // Tab from the last link lands back inside the drawer, never on the page behind it.
  await drawer.getByRole('link').last().focus();
  await page.keyboard.press('Tab');
  expect(await drawer.evaluate((element) => element.contains(document.activeElement))).toBe(true);
  await page.keyboard.press('Escape');
  await expect(drawer).toHaveCount(0);
  await expect(trigger).toBeFocused();
  await expect(page.locator('html')).not.toHaveCSS('overflow', 'hidden');
});

test.describe('the sheet page, on a phone', () => {
  // A phone's screen, with touch, as the sheet spike ran its swipes.
  test.use({ viewport: { width: 375, height: 760 }, hasTouch: true });

  test('the sheet page opens a sheet that a wheel swipe, Escape and its button close', async ({ page }) => {
    await visit(page, '/docs/components/sheet');
    const trigger = page.getByRole('button', { name: 'Filter transactions' });
    const sheet = page.getByRole('dialog', { name: 'Filter transactions' });
    const panel = page.locator('.sheet');

    // React Aria drives the swipe with the browser's own scroll, so a wheel down the sheet is a swipe down.
    await trigger.click();
    // Focus moves in once the sheet has scrolled in, and the page behind is held still.
    await expect(sheet).toBeFocused();
    await expect(page.locator('html')).toHaveCSS('overflow', 'hidden');
    // It sits on the bottom edge, the screen's full width.
    const box = await panel.boundingBox();
    if (!box) throw new Error('No sheet');
    expect(box.y + box.height).toBeCloseTo(760, 0);
    expect(box.width).toBeCloseTo(375, 0);
    // The middle of the sheet is its body, over a field: a swipe there goes on to the sheet's own scroller.
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.wheel(0, -900);
    await expect(sheet).toHaveCount(0);
    await expect(trigger).toBeFocused();
    await expect(page.locator('html')).not.toHaveCSS('overflow', 'hidden');

    await trigger.click();
    await expect(sheet).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(sheet).toHaveCount(0);
    await expect(trigger).toBeFocused();

    await trigger.click();
    await expect(sheet).toBeFocused();
    await sheet.getByRole('button', { name: 'Close' }).click();
    await expect(sheet).toHaveCount(0);
  });

  test('a sheet caps at 92% of the viewport and scrolls inside', async ({ page }) => {
    await visit(page, '/docs/components/sheet');
    await page.getByRole('button', { name: 'Show every transaction' }).click();
    const sheet = page.getByRole('dialog', { name: 'Transactions' });
    await expect(sheet).toBeFocused();
    const panel = page.locator('.sheet');
    const body = panel.locator('.sheet-body');
    // It opens at its first stop, 40% of the sheet, where the body does not scroll and a swipe moves the sheet.
    await expect(panel).not.toHaveAttribute('data-expanded');
    const resting = await panel.boundingBox();
    if (!resting) throw new Error('No sheet');
    expect(760 - resting.y).toBeCloseTo(0.4 * resting.height, -1);
    // A wheel up the sheet carries it to its full height.
    await page.mouse.move(187, 700);
    await page.mouse.wheel(0, 600);
    await expect(panel).toHaveAttribute('data-expanded');
    await expect.poll(async () => (await panel.boundingBox())?.y).toBeCloseTo(760 - resting.height, 0);
    const open = await panel.boundingBox();
    if (!open) throw new Error('No sheet');
    expect(open.height).toBeLessThanOrEqual(0.92 * 760 + 1);
    expect(open.y + open.height).toBeCloseTo(760, 0);
    expect(await body.evaluate((element) => element.scrollHeight > element.clientHeight)).toBe(true);
    // Now a wheel on the body scrolls the body, and the sheet stays where it is.
    const inside = await body.boundingBox();
    if (!inside) throw new Error('No body');
    await page.mouse.move(inside.x + inside.width / 2, inside.y + inside.height / 2);
    await page.mouse.wheel(0, 300);
    await expect.poll(() => body.evaluate((element) => element.scrollTop)).toBeGreaterThan(0);
    expect((await panel.boundingBox())?.y).toBeCloseTo(open.y, 0);
    await expect(sheet).toBeVisible();
    expect(await sideways(page)).toBe(0);
  });
});

test('the popover page opens a padded panel that flips near the bottom of the window', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await visit(page, '/docs/components/popover');
  // The second example's trigger, which sits far enough down the page to be scrolled to the window's bottom.
  const trigger = page.getByRole('button', { name: 'Sort the projects' });
  // The page scrolled so the trigger sits 24px above the bottom of the window, with no room under it.
  await trigger.evaluate((element) => {
    const by = element.getBoundingClientRect().bottom - (window.innerHeight - 24);
    window.scrollBy({ top: by, behavior: 'instant' });
  });
  const box = await trigger.boundingBox();
  if (!box) throw new Error('No trigger');
  expect(720 - (box.y + box.height)).toBeCloseTo(24, 0);
  await trigger.click();
  const popover = page.getByRole('dialog', { name: 'Sort the projects' });
  await expect(popover).toBeFocused();
  await expect(popover).toHaveClass(/\bpopover-padded\b/);
  // React Aria flips it above the trigger, 8px clear of it once it has slid in. Within a pixel, since a trigger
  // at a fractional offset down the page leaves the panel's rounded position up to a pixel off.
  await expect(popover).toHaveAttribute('data-placement', 'top');
  await expect(popover).not.toHaveAttribute('data-entering');
  await expect
    .poll(async () => {
      const panel = await popover.boundingBox();
      return panel ? Math.abs(box.y - (panel.y + panel.height) - 8) : null;
    })
    .toBeLessThan(1);
  await page.keyboard.press('Escape');
  await expect(popover).toHaveCount(0);
  await expect(trigger).toBeFocused();
});

test('the menu page opens a menu from the keyboard, moves with the arrows and returns focus on Escape', async ({
  page,
}) => {
  await visit(page, '/docs/components/menu');
  const trigger = page.getByRole('button', { name: 'Project actions' });
  await trigger.focus();
  await page.keyboard.press('ArrowDown');
  const menu = page.getByRole('menu', { name: 'Project actions' });
  await expect(menu).toBeVisible();
  await expect(trigger).toHaveAttribute('aria-expanded', 'true');
  // Arrow Down opens on the first row; the arrows move and stop at the ends, skipping the disabled row.
  await expect(page.getByRole('menuitem', { name: 'Rename' })).toBeFocused();
  await page.keyboard.press('ArrowUp');
  await expect(page.getByRole('menuitem', { name: 'Rename' })).toBeFocused();
  await page.keyboard.press('ArrowDown');
  await expect(page.getByRole('menuitem', { name: 'Duplicate' })).toBeFocused();
  await page.keyboard.press('End');
  await expect(page.getByRole('menuitem', { name: 'Delete the project' })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(menu).toHaveCount(0);
  await expect(trigger).toBeFocused();
  // Enter on a row runs it and closes the menu, and the page says what was chosen.
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Enter');
  await expect(menu).toHaveCount(0);
  await expect(page.getByText('Chose Duplicate.')).toBeVisible();
});

test('a menu link navigates through the router', async ({ page }) => {
  await visit(page, '/docs/components/menu');
  // A marker on the window survives a client-side navigation and is lost to a full page load.
  await page.evaluate(() => {
    (window as Window & { menuMarker?: boolean }).menuMarker = true;
  });
  await page.getByRole('button', { name: 'Jump to a component' }).click();
  const link = page.getByRole('menuitem', { name: 'Button' });
  await expect(link).toHaveAttribute('href', '/docs/components/button');
  await link.click();
  await expect(page).toHaveURL(/\/docs\/components\/button$/);
  await expect(page.getByRole('heading', { level: 1, name: 'Button' })).toBeVisible();
  expect(await page.evaluate(() => (window as Window & { menuMarker?: boolean }).menuMarker)).toBe(true);
});

test.describe('the menu page, on a touch screen', () => {
  test.use({ hasTouch: true, viewport: { width: 375, height: 760 } });

  test('menu rows are 44px on a touch screen', async ({ page }) => {
    await visit(page, '/docs/components/menu');
    await page.getByRole('button', { name: 'Project actions' }).tap();
    const row = page.getByRole('menuitem', { name: 'Rename' });
    await expect(row).toBeVisible();
    const box = await row.boundingBox();
    if (!box) throw new Error('No row');
    expect(box.height).toBeGreaterThanOrEqual(44);
    expect(await sideways(page)).toBe(0);
  });
});

test('the toast page shows a toast that is announced politely and dismissed', async ({ page }) => {
  await visit(page, '/docs/components/toast');
  // The polite host is in the page before any toast, so a screen reader is already listening to it. The docs
  // layout mounts the one region, outside the example's tab panels.
  const host = page.locator('.toast-status-host');
  await expect(host).toHaveCount(1);
  await expect(host).toHaveAttribute('role', 'status');
  await expect(host).toBeEmpty();
  await page.getByRole('button', { name: 'Saved', exact: true }).click();
  const shown = page.getByRole('alertdialog', { name: 'Saved' });
  await expect(shown).toBeVisible();
  await expect(host).toContainText('Saved');
  // The toast's own content is not a second live region.
  await expect(shown.locator('.toast-content')).toHaveAttribute('role', 'group');
  await shown.getByRole('button', { name: 'Dismiss' }).click();
  await expect(shown).toHaveCount(0);

  // Still announced with the first example switched to its code: the host is not in that hidden tab panel.
  await page.getByRole('tab', { name: 'Code' }).first().click();
  await page.getByRole('list', { name: 'Accounts' }).getByRole('button', { name: 'Remove Savings' }).click();
  expect(await host.evaluate((element) => element.closest('[hidden], [data-inert]'))).toBeNull();
  await expect(host).toContainText('Savings removed');
});

test('a page shorter than the viewport does not scroll with the toast region mounted', async ({ page }) => {
  // The workspace is at least the viewport's height, and the layout mounts the region after it, so a status
  // host left at its static position would sit 1px below the viewport and the page would scroll by 1px.
  await page.setViewportSize({ width: 1440, height: 2400 });
  await visit(page, '/docs');
  await expect(page.locator('.toast-status-host')).toHaveCount(1);
  const { scrollHeight, clientHeight } = await page.evaluate(() => ({
    scrollHeight: document.documentElement.scrollHeight,
    clientHeight: document.documentElement.clientHeight,
  }));
  expect(scrollHeight).toBe(clientHeight);
});

test('an error toast is an alert', async ({ page }) => {
  await visit(page, '/docs/components/toast');
  await page.getByRole('button', { name: 'Import failed', exact: true }).click();
  const shown = page.getByRole('alertdialog', { name: 'Import failed' });
  await expect(shown).toBeVisible();
  await expect(shown.getByRole('alert')).toContainText('Import failed');
  // An error speaks for itself, assertively, and the polite host leaves it alone.
  await expect(page.locator('.toast-status-host')).not.toContainText('Import failed');
  await shown.getByRole('button', { name: 'Dismiss' }).click();
  await expect(shown).toHaveCount(0);
});

test('the command palette page opens on its shortcut, filters, moves, and acts after the close', async ({
  page,
}) => {
  await visit(page, '/docs/components/command-palette');
  const trigger = page.getByRole('button', { name: 'Search the app' });
  await trigger.focus();
  // This site's own search owns Cmd or Ctrl+K, so the example listens for Cmd or Ctrl+J.
  await page.keyboard.press('ControlOrMeta+j');
  const palette = page.getByRole('dialog', { name: 'Search the app' });
  await expect(palette).toBeVisible();
  const field = palette.getByRole('textbox', { name: 'Search the app' });
  await expect(field).toBeFocused();
  await field.pressSequentially('bud');
  const budgets = palette.getByRole('menuitem', { name: 'Budgets' });
  await expect(palette.getByRole('menuitem')).toHaveCount(1);
  await page.keyboard.press('ArrowDown');
  // The field keeps DOM focus, and points at the active row.
  await expect(field).toBeFocused();
  await expect(field).toHaveAttribute('aria-activedescendant', (await budgets.getAttribute('id')) ?? '');
  await page.keyboard.press('Enter');
  await expect(palette).toHaveCount(0);
  // Focus is back on what held it before the palette opened, and then the example says what was opened.
  await expect(trigger).toBeFocused();
  await expect(page.getByText('Opened Budgets.')).toBeVisible();
  await expect(trigger).toBeFocused();
});

test.describe('the command palette page, on a touch screen', () => {
  test.use({ hasTouch: true, viewport: { width: 375, height: 760 } });

  test('the palette hides its key hints on a touch screen', async ({ page }) => {
    await visit(page, '/docs/components/command-palette');
    await page.getByRole('button', { name: 'Search the app' }).tap();
    const palette = page.getByRole('dialog', { name: 'Search the app' });
    await expect(palette).toBeVisible();
    await expect(palette.locator('.command-palette-footer')).toBeHidden();
    // The surface is the screen less 16px on each side, and nothing scrolls sideways.
    const box = await page.locator('.command-palette').boundingBox();
    if (!box) throw new Error('No surface');
    expect(box.width).toBeCloseTo(375 - 32, 0);
    expect(await sideways(page)).toBe(0);
  });
});

test('the palette remembers recents across a reload', async ({ page }) => {
  await visit(page, '/docs/components/command-palette');
  const trigger = page.getByRole('button', { name: 'Search the app' });
  await trigger.click();
  const palette = page.getByRole('dialog', { name: 'Search the app' });
  await expect(palette.getByRole('group', { name: 'Recent' })).toHaveCount(0);
  await palette.getByRole('textbox', { name: 'Search the app' }).pressSequentially('rent');
  await palette.getByRole('menuitem', { name: 'Rent' }).click();
  await expect(palette).toHaveCount(0);
  await expect(page.getByText('Opened Rent.')).toBeVisible();
  await page.reload();
  await settled(page);
  await trigger.click();
  const recent = palette.getByRole('group', { name: 'Recent' });
  await expect(recent.getByRole('menuitem', { name: 'Rent' })).toBeVisible();
});

test('the tooltip page shows a tip on hover after a pause and at once on focus', async ({ page }) => {
  await visit(page, '/docs/components/tooltip');
  const edit = page.getByRole('button', { name: 'Edit', exact: true });
  const tip = page.getByRole('tooltip');
  await expect(tip).toHaveCount(0);
  // A resting pointer shows the tip after its pause, and it describes the button while it is open. React Aria
  // answers a hover only once the mouse has moved over the page, as a person's always has by then.
  await page.mouse.move(1, 1);
  await edit.hover();
  await expect(tip).toBeVisible();
  await expect(tip).toHaveText('Edit');
  await expect(edit).toHaveAttribute('aria-describedby', (await tip.getAttribute('id')) ?? '');
  // Moving away closes it.
  await page.mouse.move(0, 0);
  await expect(tip).toHaveCount(0);
  // React Aria counts a script's focus as visible too, so Edit's tip may open here. The key is what is under
  // test, so Tab onwards: the next button's tip is there as the key lands.
  await edit.focus();
  await page.keyboard.press('Tab');
  const duplicate = page.getByRole('button', { name: 'Duplicate', exact: true });
  await expect(duplicate).toBeFocused();
  expect(await page.getByRole('tooltip', { name: 'Duplicate' }).count()).toBe(1);
  await page.keyboard.press('Escape');
  await expect(tip).toHaveCount(0);
  await expect(duplicate).toBeFocused();
  // A link is a trigger too, as a navigation rail's items are: past Share, Help is a link, and Tab shows its tip.
  await page.keyboard.press('Tab');
  await page.keyboard.press('Tab');
  const help = page.getByRole('link', { name: 'Help', exact: true });
  await expect(help).toBeFocused();
  const helpTip = page.getByRole('tooltip', { name: 'Help' });
  expect(await helpTip.count()).toBe(1);
  await expect(help).toHaveAttribute('aria-describedby', (await helpTip.getAttribute('id')) ?? '');
});

// The docs shell's own header and rail use "Open the menu", "Menu", "Close menu", "Collapse the menu" and "Expand
// the menu" too, and Playwright matches names as substrings, so every locator below is scoped to the example.

test('the app shell page collapses its example rail to icons and expands it again', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await visit(page, '/docs/components/app-shell');
  const example = page.locator('.stage').first();
  const shell = example.locator('.app-shell');
  const rail = example.locator('.sidebar:not(.sidebar-drawer)');
  await example.getByRole('button', { name: 'Collapse the menu', exact: true }).click();
  await expect(shell).toHaveAttribute('data-sidebar', 'collapsed');
  await expect.poll(async () => (await rail.boundingBox())?.width).toBeCloseTo(72, 0);
  await example.getByRole('button', { name: 'Expand the menu', exact: true }).click();
  await expect(shell).not.toHaveAttribute('data-sidebar');
  await expect.poll(async () => (await rail.boundingBox())?.width).toBeCloseTo(288, 0);
});

test('the sidebar page names the search the same in the expanded and the collapsed rail', async ({
  page,
}) => {
  // The chip is clipped, not removed, when the rail collapses, so the name keeps its shortcut. jsdom applies no
  // stylesheet, so this is checked in the browser.
  await page.setViewportSize({ width: 1280, height: 800 });
  await visit(page, '/docs/components/sidebar');
  const search = (nav: string): Locator =>
    page
      .locator('.stage')
      .filter({ has: page.getByRole('navigation', { name: nav, exact: true }) })
      .locator('.sidebar-search');
  const expanded = search('Main, groups');
  const collapsed = search('Main, icons');
  await expect(collapsed.locator('xpath=ancestor::*[@data-sidebar="collapsed"]')).toHaveCount(1);
  await expect(expanded).toHaveAccessibleName(/^Search or jump to, (Ctrl|\u2318) K$/);
  await expect(collapsed).toHaveAccessibleName(/^Search or jump to, (Ctrl|\u2318) K$/);
});

test('the sidebar page opens the real drawer from its example and Escape closes it', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await visit(page, '/docs/components/sidebar');
  const example = page
    .locator('.stage')
    .filter({ has: page.getByRole('navigation', { name: 'Main, drawer' }) });
  const button = example.getByRole('button', { name: 'Open the menu', exact: true });
  await button.click();
  const drawer = page.getByRole('dialog', { name: 'Menu', exact: true });
  await expect(drawer).toBeVisible();
  await expect(drawer.getByRole('link', { name: 'Home', exact: true })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(drawer).toHaveCount(0);
  await expect(button).toBeFocused();
});

test.describe('the tab bar on a phone', () => {
  test.use({ viewport: { width: 375, height: 760 } });

  test('the tab bar page names a counted tab with its count, in the browser', async ({ page }) => {
    // A browser joins a link's parts as the page lays them out, so the name is checked here as well as in jsdom.
    await visit(page, '/docs/components/bottom-tab-bar');
    const bar = page.getByRole('navigation', { name: 'Main', exact: true });
    await expect(bar.getByRole('link', { name: 'Transactions, 12 to review', exact: true })).toBeVisible();
    await expect(bar.getByRole('link', { name: 'Home', exact: true })).toHaveAttribute(
      'aria-current',
      'page',
    );
    // The items share one row, whatever the page's prose does to its own lists.
    const tops = await bar
      .locator('.tab-bar-item')
      .evaluateAll((items) => items.map((item) => Math.round(item.getBoundingClientRect().top)));
    expect(tops).toHaveLength(4);
    expect(new Set(tops).size).toBe(1);
  });

  test('the tab bar page opens the More sheet and closes it from the keyboard', async ({ page }) => {
    await visit(page, '/docs/components/bottom-tab-bar');
    const bar = page.getByRole('navigation', { name: 'Main, with More', exact: true });
    const more = bar.getByRole('button', { name: 'More', exact: true });
    await more.click();
    const sheet = page.getByRole('dialog', { name: 'More', exact: true });
    // Focus moves in once the sheet has risen, as on the sheet page.
    await expect(sheet).toBeFocused();
    await expect(more).toHaveAttribute('aria-expanded', 'true');
    await page.keyboard.press('Escape');
    await expect(sheet).toHaveCount(0);
    await expect(more).toBeFocused();
  });

  test('the app shell page reserves room under the page for the tab bar on a phone', async ({ page }) => {
    await visit(page, '/docs/components/app-shell');
    const frame = page.locator('.stage-phone');
    const workspace = frame.locator('.app-shell-workspace');
    await expect(workspace).toHaveCSS('padding-bottom', '64px');
    await expect(frame.locator('.tab-bar')).toBeVisible();
  });
});

test('the phone frame shows the tab bar on a wide screen, and the bar hides itself there without it', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await visit(page, '/docs/components/app-shell');
  // The frame is a phone at every width, so the bar and the reserve show in it on a wide screen too.
  await page.locator('.stage-phone').evaluate((element) => {
    element.setAttribute('data-phone-example', '');
  });
  const frame = page.locator('[data-phone-example]');
  const workspace = frame.locator('.app-shell-workspace');
  await expect(workspace).toHaveCSS('padding-bottom', '64px');
  await expect(frame.locator('.tab-bar')).toBeVisible();
  // Without the frame's class, the component's own rules apply: no bar and no reserve from 1024px up.
  await frame.evaluate((element) => {
    element.classList.remove('stage-phone');
  });
  await expect(workspace).toHaveCSS('padding-bottom', '0px');
  await expect(frame.locator('.tab-bar')).toBeHidden();
});

test('an avatar whose image fails shows its initials and keeps its size', async ({ page }) => {
  await visit(page, '/docs/components/avatar');
  // The one avatar on the page with this name, in the fallback example, whatever the examples' order.
  const failed = page.getByRole('img', { name: 'Mary Ann Evans', exact: true });
  // The image is dropped once the browser reports its error, and the initials under it stay.
  await expect(failed.locator('.avatar-image')).toHaveCount(0);
  await expect(failed.locator('.avatar-initials')).toBeVisible();
  await expect(failed.locator('.avatar-initials')).toHaveText('MA');
  const box = await failed.boundingBox();
  expect(box?.width).toBe(40);
  expect(box?.height).toBe(40);
});

test('a linked stat tile is one link named by everything it shows, and it follows its href', async ({
  page,
}) => {
  await visit(page, '/docs/components/stat-tile');
  // Case-insensitive: Chromium names the label in the capitals text-transform draws.
  const tile = page.getByRole('link', { name: /^spending \$1,284\.50 up 12% from last month/i });
  await expect(tile).toHaveCount(1);
  await expect(tile).toHaveClass('stat-tile');
  await expect(tile).not.toHaveAttribute('aria-describedby');
  await tile.click();
  await expect(page).toHaveURL(/#spending$/);
});

test('an over-limit meter says over in words and draws its fill in the warning color', async ({ page }) => {
  await visit(page, '/docs/components/meter');
  // The over-limit example's meter, by its name, whatever the examples' order.
  const meter = page.getByRole('meter', { name: 'Dining out', exact: true });
  await expect(meter).toHaveAttribute('aria-valuetext', /over/);
  expect(await meter.getAttribute('aria-valuenow')).toBe(await meter.getAttribute('aria-valuemax'));
  const fill = meter.locator(".meter-segment[data-look='fill']");
  // The page's warning color, read with a probe inside the meter, so its theme applies.
  const warning = await meter.evaluate((element) => {
    const probe = document.createElement('span');
    probe.style.backgroundColor = 'var(--color-warning)';
    element.append(probe);
    const { backgroundColor } = getComputedStyle(probe);
    probe.remove();
    return backgroundColor;
  });
  expect(await fill.evaluate((element) => getComputedStyle(element).backgroundColor)).toBe(warning);
});

test('a chart page is in the Charts group and shows its own package version', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await visit(page, '/docs/charts/sparkline');
  // The rail draws a group named Charts that holds the page's link, marked as the page open.
  const group = page
    .locator('#rail .rail-nav > div')
    .filter({ has: page.locator('.rail-group', { hasText: /^Charts$/ }) });
  await expect(group).toHaveCount(1);
  await expect(group.locator('a[href="/docs/charts/sparkline"]')).toHaveAttribute('aria-current', 'page');
  await expect(page.locator('.header-titles .eyebrow')).toHaveText('Docs \u203a Charts');

  // The package card reads @snapshot-ui/charts, which is not built on React Aria.
  const { version } = JSON.parse(
    readFileSync(new URL('../../../packages/charts/package.json', import.meta.url), 'utf8'),
  ) as { version: string };
  const card = page.locator('.panel-side');
  await expect(card.locator('.badge')).toHaveText(version);
  await expect(card.locator('.meta-row', { hasText: 'Built on' })).toHaveCount(0);

  // A component page keeps its group, its own package's version and the React Aria row.
  await visit(page, '/docs/components/meter');
  await expect(page.locator('.header-titles .eyebrow')).toHaveText('Docs \u203a Components');
  const { version: react } = JSON.parse(
    readFileSync(new URL('../../../packages/react/package.json', import.meta.url), 'utf8'),
  ) as { version: string };
  await expect(card.locator('.badge')).toHaveText(react);
  await expect(card.locator('.meta-row', { hasText: 'Built on' })).toHaveCount(1);
});

test('the stat tile page draws its trend as a sparkline hidden from assistive technology', async ({
  page,
}) => {
  await visit(page, '/docs/components/stat-tile');
  // The trend example's tile, by its label, whatever the examples' order.
  const tile = page
    .locator('.stat-tile')
    .filter({ has: page.locator('.stat-tile-label', { hasText: 'Net worth' }) });
  await expect(tile).toHaveCount(1);
  const sparkline = tile.locator('.sparkline');
  await expect(sparkline).toHaveCount(1);
  await expect(sparkline).toHaveAttribute('aria-hidden', 'true');
  await expect(sparkline.locator('svg .sparkline-line')).toHaveCount(1);
  await expect(sparkline.locator('.sparkline-end')).toBeVisible();
});

/** A line chart on its page, found by the name its example gives it, whatever the examples' order. */
const lineChart = (page: Page, name: string): Locator => page.getByRole('figure', { name, exact: true });

test("the line chart's toggle swaps the plot for the table and back, keeping focus", async ({ page }) => {
  await visit(page, '/docs/charts/line-chart');
  const chart = lineChart(page, 'Spending in October, against September');
  const plot = chart.locator('.line-chart-plot');
  const table = chart.getByRole('table', { name: 'Spending in October, against September', exact: true });
  await expect(plot).toBeVisible();
  await expect(chart.locator('table')).toHaveCount(1);
  await expect(chart.locator('table')).toBeHidden();

  // The toggle's name changes with the view, so it is held by its class once its first name is checked.
  await expect(chart.getByRole('button', { name: 'Show as table', exact: true })).toHaveCount(1);
  const toggle = chart.locator('.line-chart-toggle');
  await toggle.focus();
  await page.keyboard.press('Enter');
  await expect(table).toBeVisible();
  await expect(plot).toBeHidden();
  await expect(toggle).toHaveText('Show as chart');
  await expect(toggle).toBeFocused();
  // The table holds the same strings: a row per day, headed by the day, and a column per month.
  await expect(table.locator('tbody tr')).toHaveCount(31);
  await expect(table.getByRole('columnheader')).toHaveText(['This month', 'Last month']);
  await expect(table.getByRole('rowheader').first()).toHaveText('Oct 1');

  await page.keyboard.press('Space');
  await expect(plot).toBeVisible();
  await expect(chart.locator('table')).toBeHidden();
  await expect(toggle).toHaveText('Show as table');
  await expect(toggle).toBeFocused();
});

test('the line chart moves its readout with the arrow keys and reads it out', async ({ page }) => {
  await visit(page, '/docs/charts/line-chart');
  const chart = lineChart(page, 'Spending in October');
  const plot = chart.getByRole('group', { name: 'Spending in October', exact: true });
  const readout = chart.locator('.line-chart-readout .line-chart-readout-x');
  await plot.focus();
  await expect(readout).toHaveText('Oct 31');
  await page.keyboard.press('ArrowLeft');
  await expect(readout).toHaveText('Oct 30');
  await page.keyboard.press('Home');
  await expect(readout).toHaveText('Oct 1');
  // Once the keys rest, the live region holds the day and then each series with its value, each part its own
  // element, so the library adds no punctuation of its own to the app's words.
  const live = chart.locator('.line-chart-live');
  await expect(live).toHaveAttribute('aria-live', 'polite');
  await expect(live.locator('.line-chart-live-part')).toHaveText(['Oct 1', /^This month \$/]);
  await expect(live).not.toHaveText(/[:,]/);
});

test("the line chart's readout leaves the point it describes in view", async ({ page }) => {
  await visit(page, '/docs/charts/line-chart');
  const chart = lineChart(page, 'Spending in October');
  const plot = chart.locator('.line-chart-plot');
  await plot.focus();
  await page.keyboard.press('Home');
  for (let day = 1; day < 18; day++) await page.keyboard.press('ArrowRight');
  // Oct 18, $77.90 on $0 to $100: the dot is near the top, so the panel goes under it.
  await expect(chart.locator('.line-chart-readout .line-chart-readout-x')).toHaveText('Oct 18');
  const panel = await chart.locator('.line-chart-readout').boundingBox();
  const dot = await chart.locator('.line-chart-dot').boundingBox();
  const box = await plot.boundingBox();
  if (!panel || !dot || !box) throw new Error('No readout, dot or plot');
  const apart =
    panel.x + panel.width <= dot.x ||
    dot.x + dot.width <= panel.x ||
    panel.y + panel.height <= dot.y ||
    dot.y + dot.height <= panel.y;
  expect(apart).toBe(true);
  expect(panel.y).toBeGreaterThanOrEqual(box.y);
  expect(panel.y + panel.height).toBeLessThanOrEqual(box.y + box.height);
});

test('the right-to-left line chart draws its newest day at the left, and Left moves to newer days', async ({
  page,
}) => {
  await visit(page, '/docs/charts/line-chart');
  const chart = lineChart(page, 'Spending in October, right to left');
  const first = chart.locator('.line-chart-x-label', { hasText: /^Oct 1$/ });
  const last = chart.locator('.line-chart-x-label', { hasText: /^Oct 31$/ });
  const left = async (locator: Locator): Promise<number> => (await locator.boundingBox())?.x ?? Number.NaN;
  expect(await left(last)).toBeLessThan(await left(first));
  const plot = chart.locator('.line-chart-plot');
  await plot.focus();
  const readout = chart.locator('.line-chart-readout .line-chart-readout-x');
  await expect(readout).toHaveText('Oct 31');
  // The crosshair, an HTML mark, and the newest point of the svg line agree: both at the plot's left.
  const plotBox = await plot.boundingBox();
  const crosshair = await chart.locator('.line-chart-crosshair').boundingBox();
  expect(Math.abs((crosshair?.x ?? Number.NaN) - (plotBox?.x ?? 0))).toBeLessThanOrEqual(1);
  await page.keyboard.press('ArrowRight');
  await expect(readout).toHaveText('Oct 30');
  await page.keyboard.press('ArrowLeft');
  await expect(readout).toHaveText('Oct 31');
});

test.describe('a date range picker without JavaScript', () => {
  test.use({ javaScriptEnabled: false });

  test('with scripts off a date range picker shows its value label and its hidden dates', async ({
    page,
  }) => {
    await page.goto('/docs/components/date-range-picker');
    const field = page
      .locator('.stage .date-range-picker')
      .filter({ has: page.locator('input[name="from"]') });
    await expect(field).toHaveCount(1);
    await expect(field.locator('.date-range-face')).toHaveText('1 to 30 Sep 2026');
    await expect(field.locator('.date-range-face')).toBeVisible();
    await expect(field.locator('.date-segment')).toHaveCount(0);
    await expect(field.locator('input[name="from"]')).toHaveValue('2026-09-01');
    await expect(field.locator('input[name="to"]')).toHaveValue('2026-09-30');
    // The frame is a field tall, with the button at its end: 6px in from the inside of the frame's 1px edge.
    const frame = await field.locator('.date-range-control').boundingBox();
    const button = await field.locator('.date-range-button').boundingBox();
    if (!frame || !button) throw new Error('No frame drawn');
    expect(frame.height).toBe(48);
    expect(frame.x + frame.width - (button.x + button.width)).toBeCloseTo(7, 1);
  });
});

test.describe('a line chart without JavaScript', () => {
  test.use({ javaScriptEnabled: false });

  test('shows its table under the plot', async ({ page }) => {
    await page.goto('/docs/charts/line-chart');
    const chart = lineChart(page, 'Spending in October');
    await expect(chart).toHaveCount(1);
    // The plot is drawn, and the noscript copy of the table is the one shown, under its note.
    await expect(chart.locator('.line-chart-plot svg .line-chart-line')).toHaveCount(1);
    await expect(chart.locator('.line-chart-plot')).toBeVisible();
    // Its keys need scripts, so with them off the plot is no tab stop.
    await expect(chart.locator('.line-chart-plot')).not.toHaveAttribute('tabindex');
    await expect(chart.locator('.line-chart-noscript')).toBeVisible();
    const shown = chart.locator('table:visible');
    await expect(shown).toHaveCount(1);
    await expect(shown.locator('caption')).toHaveText('Spending in October');
    await expect(shown.locator('tbody tr')).toHaveCount(31);
  });
});

test('the installation page installs the charts package and names the core version it needs', async ({
  page,
}) => {
  await visit(page, '/docs/installation');
  await expect(page.locator('pre', { hasText: 'pnpm add @snapshot-ui/charts' })).toHaveCount(1);
  const section = page
    .locator('.docs-section')
    .filter({ has: page.getByRole('heading', { name: 'Charts', exact: true }) });
  await expect(section).toContainText('0.6 for charts 0.1.3');
  await expect(section.getByRole('link', { name: 'Line chart', exact: true })).toHaveAttribute(
    'href',
    '/docs/charts/line-chart',
  );
  await expect(section.getByRole('link', { name: 'Sparkline', exact: true })).toHaveAttribute(
    'href',
    '/docs/charts/sparkline',
  );
});

test('a data table header sorts on a press, writing aria-sort', async ({ page }) => {
  await visit(page, '/docs/components/data-table');
  const table = page.locator('.stage').first().getByRole('grid', { name: 'Transactions' });
  await expectTableFace(table);
  const amount = table.getByRole('columnheader', { name: 'Amount' });
  const date = table.getByRole('columnheader', { name: 'Date' });
  await expect(date).toHaveAttribute('aria-sort', 'descending');
  await expect(amount).toHaveAttribute('aria-sort', 'none');
  await amount.click();
  await expect(amount).toHaveAttribute('aria-sort', 'ascending');
  await expect(date).toHaveAttribute('aria-sort', 'none');
  await expect(table.locator('tbody [role="rowheader"]').first()).toHaveText('Northside Rent');
  await amount.click();
  await expect(amount).toHaveAttribute('aria-sort', 'descending');
  await expect(table.locator('tbody [role="rowheader"]').first()).toHaveText('Acme Payroll');
});

test('a press anywhere on a data table row opens its link, and a middle click opens a new tab', async ({
  page,
  context,
}) => {
  await visit(page, '/docs/components/data-table');
  const table = page.locator('.stage').first().getByRole('grid', { name: 'Transactions' });
  await expectTableFace(table);
  /** The middle of a row's amount cell, brought to the middle of the window, as a pointer finds it. */
  const amountOf = async (payee: string): Promise<{ x: number; y: number }> => {
    const cell = table
      .locator('tbody [role="row"]')
      .filter({ hasText: payee })
      .locator('[role="gridcell"]')
      .last();
    await cell.evaluate((element) => {
      element.scrollIntoView({ block: 'center' });
    });
    const box = await cell.boundingBox();
    if (!box) throw new Error(`No amount for ${payee}`);
    return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
  };
  const corner = await amountOf('Corner Mart');
  // The stretched link is what the browser finds under the amount cell.
  const hit = await page.evaluate(({ x, y }) => document.elementFromPoint(x, y)?.textContent, corner);
  expect(hit).toBe('Corner Mart');
  await page.mouse.click(corner.x, corner.y);
  await expect(page).toHaveURL(/#t1$/);
  const row = table.locator('tbody [role="row"]').filter({ hasText: 'Corner Mart' });
  await expect(row).toHaveAttribute('data-current', '');
  await expect(row.getByRole('link', { name: 'Corner Mart' })).toHaveAttribute('aria-current', 'true');
  // A middle click is the browser's own: a new tab with the row's address.
  const transit = await amountOf('City Transit');
  const opened = context.waitForEvent('page');
  await page.mouse.click(transit.x, transit.y, { button: 'middle' });
  const tab = await opened;
  await tab.waitForURL(/#t2$/);
  await tab.close();
});

/** The data table page's selection example: its stage and its grid, drawn as a table. */
const selectionTable = async (page: Page): Promise<{ stage: Locator; table: Locator }> => {
  await visit(page, '/docs/components/data-table');
  const stage = page
    .locator('.stage')
    .filter({ has: page.getByRole('checkbox', { name: 'Select all' }) })
    // The selection example, before the recipe's, which selects too.
    .first();
  const table = stage.getByRole('grid', { name: 'Transactions' });
  await expectTableFace(table);
  return { stage, table };
};

test('a data table selects with X and Space, shows the bar with the count, and opens a row on Enter without selecting it', async ({
  page,
}) => {
  const { stage, table } = await selectionTable(page);
  const rows = table.locator('tbody [role="row"]');
  await expect(stage.getByRole('toolbar')).toHaveCount(0);
  await rows.first().focus();
  await page.keyboard.press('x');
  await expect(rows.first()).toHaveAttribute('aria-selected', 'true');
  const bar = stage.getByRole('toolbar', { name: 'Bulk actions' });
  await expect(bar).toContainText('1 selected');
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press(' ');
  await expect(rows.nth(1)).toHaveAttribute('aria-selected', 'true');
  await expect(bar).toContainText('2 selected');
  // X again unselects the row.
  await page.keyboard.press('x');
  await expect(rows.nth(1)).toHaveAttribute('aria-selected', 'false');
  await expect(bar).toContainText('1 selected');
  const id = await rows.nth(1).getAttribute('data-key');
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(new RegExp(`#${id ?? ''}$`));
  await expect(rows.nth(1)).toHaveAttribute('aria-selected', 'false');
  await expect(rows.nth(1)).toHaveAttribute('data-current', '');
  await expect(bar).toContainText('1 selected');
  // The count is said politely, in the bar's words, once it has held.
  await expect(stage.locator('.data-table-count')).toHaveText('1 selected');
});

test('a data table keeps focus on its row when a letter is typed', async ({ page }) => {
  const { table } = await selectionTable(page);
  const first = table.locator('tbody [role="row"]').first();
  await first.focus();
  for (const letter of ['c', 'n', 'a', 'g']) {
    await page.keyboard.press(letter);
    await expect(first).toBeFocused();
  }
  // J and K move as the arrows.
  await page.keyboard.press('j');
  await expect(table.locator('tbody [role="row"]').nth(1)).toBeFocused();
  await page.keyboard.press('k');
  await expect(first).toBeFocused();
});

test('a data table is one tab stop with the real Tab key, then the bar, and Shift+Tab returns to its row', async ({
  page,
}) => {
  const { stage, table } = await selectionTable(page);
  const rows = table.locator('tbody [role="row"]');
  const inTable = (): Promise<boolean> => table.evaluate((grid) => grid.contains(document.activeElement));
  // React Aria gives its links and checkboxes tabindex 0; the table takes them out of the tab order.
  const controls = table.locator('a.data-table-link, input');
  expect(await controls.count()).toBeGreaterThan(0);
  for (const control of await controls.all()) await expect(control).toHaveAttribute('tabindex', '-1');
  await rows.nth(2).focus();
  await page.keyboard.press('Shift+Tab');
  expect(await inTable()).toBe(false);
  // Back in, one stop, on the row last focused; the next Tab leaves the table.
  await page.keyboard.press('Tab');
  await expect(rows.nth(2)).toBeFocused();
  await page.keyboard.press('Tab');
  expect(await inTable()).toBe(false);
  await page.keyboard.press('Shift+Tab');
  await expect(rows.nth(2)).toBeFocused();
  // With a row selected the next stop is the bar, and Shift+Tab comes back to the row.
  await page.keyboard.press('x');
  await page.keyboard.press('Tab');
  await expect(stage.getByRole('button', { name: 'Categorize' })).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await expect(rows.nth(2)).toBeFocused();
});

test('select all selects the rows on the page and Clear selection puts focus back in the table', async ({
  page,
}) => {
  const { stage, table } = await selectionTable(page);
  const rows = table.locator('tbody [role="row"]');
  // The box is the target, as a reader presses it; the input under it is hidden from sight.
  await stage.locator('thead .checkbox-box').click();
  await expect(table.locator('tbody [aria-selected="true"]')).toHaveCount(await rows.count());
  const bar = stage.getByRole('toolbar', { name: 'Bulk actions' });
  await expect(bar).toContainText(`${String(await rows.count())} selected`);
  // The bar sticks to the bottom of the window inside the table's box, so it is in reach wherever the reader is.
  await expect(bar).toBeInViewport();
  await bar.getByRole('button', { name: 'Clear selection' }).click();
  await expect(table.locator('tbody [aria-selected="true"]')).toHaveCount(0);
  await expect(stage.getByRole('toolbar')).toHaveCount(0);
  expect(await table.evaluate((grid) => grid.contains(document.activeElement))).toBe(true);
});

test('a data table drops its md column under 48rem of its box, and under 40rem draws its list', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await visit(page, '/docs/components/data-table');
  const box = page.getByTestId('data-table-box');
  const shown = (): Promise<string[]> =>
    box
      .locator('[role="columnheader"]')
      .evaluateAll((cells) =>
        cells
          .filter((cell) => getComputedStyle(cell).visibility !== 'hidden')
          .map((cell) => cell.textContent),
      );
  // The widths are the table's own box, not the window's: the box is set on each side of 48rem and 40rem.
  const setWidth = (width: string): Promise<void> =>
    box.evaluate((element, value) => {
      (element as HTMLElement).style.width = value;
    }, width);
  await setWidth('60rem');
  await expect.poll(shown).toEqual(['Date', 'Payee', 'Category', 'Account', 'Amount']);
  await setWidth('47.5rem');
  await expect.poll(shown).toEqual(['Date', 'Payee', 'Account', 'Amount']);
  await setWidth('40rem');
  await expect.poll(shown).toEqual(['Date', 'Payee', 'Account', 'Amount']);
  // The table is the full width of its box, its last header cell ending at the box's end (spec correction 26).
  const ends = await box.evaluate((element) => {
    const right = (selector: string): number =>
      Math.round(element.querySelector(selector)?.getBoundingClientRect().right ?? 0);
    return {
      box: Math.round(element.getBoundingClientRect().right),
      table: right('.data-table-table'),
      header: right('thead [role="columnheader"]:last-child'),
    };
  });
  expect(ends.table).toBe(ends.box);
  expect(ends.header).toBe(ends.box);
  // Under 40rem the list is the face drawn, an item per row, and the table is not.
  await setWidth('39.5rem');
  await expect(box.getByRole('grid')).toHaveCount(1);
  await expect(box.locator('.data-table-list')).toBeVisible();
  await expect(box.locator('.data-table-grid')).toBeHidden();
  await expect(box.locator('.data-table-item')).toHaveCount(5);
  // The example's own control narrows the box the same way, within its frame.
  await setWidth('');
  const widths = page.getByRole('radiogroup', { name: "Width of the table's box" });
  await widths.getByRole('radio', { name: '56rem' }).focus();
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('ArrowRight');
  await expect(widths.getByRole('radio', { name: '38rem' })).toBeChecked();
  await expect(box.locator('.data-table-list')).toBeVisible();
  // The narrower box is drawn and named, so its width reads as chosen; its edge takes no room.
  await expect(box).toHaveCSS('outline-style', 'dashed');
  await expect(box).toHaveCSS('outline-width', '1px');
  await expect(page.getByText("The table's box: 38rem")).toBeVisible();
  expect(await sideways(page)).toBe(0);
});

test('a data table switches to the list under 40rem of its box and back at 40rem', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await visit(page, '/docs/components/data-table');
  const box = page.getByTestId('data-table-box');
  const setWidth = (width: string): Promise<void> =>
    box.evaluate((element, value) => {
      (element as HTMLElement).style.width = value;
    }, width);
  // One face at a time, so a reader and a screen reader meet one grid.
  for (const [width, face] of [
    ['40rem', 'table'],
    ['39.9rem', 'list'],
    ['40rem', 'table'],
  ] as const) {
    await setWidth(width);
    await expect(box.getByRole('grid')).toHaveCount(1);
    await expect(box.locator(face === 'table' ? '.data-table-grid' : '.data-table-list')).toBeVisible();
    await expect(box.locator(face === 'table' ? '.data-table-list' : '.data-table-grid')).toBeHidden();
  }
});

test.describe('the data table on a phone', () => {
  test.use({ viewport: { width: 320, height: 720 }, hasTouch: true });

  test('shows the list grouped by day and never scrolls the page sideways', async ({ page }) => {
    await visit(page, '/docs/components/data-table');
    const list = page.locator('.stage .data-table-list').filter({ has: page.locator('.data-table-section') });
    await list.first().scrollIntoViewIfNeeded();
    await expect(list.first()).toBeVisible();
    const grid = list.first().getByRole('grid', { name: 'Transactions' });
    await expect(grid.getByRole('rowgroup')).toHaveCount(4);
    await expect(grid.getByRole('rowgroup').first()).toHaveAccessibleName('Wednesday 14 October');
    // Each item's title, its meta line and its amount, inside the item.
    const item = grid.locator('.data-table-item').first();
    await expect(item.locator('.data-table-item-title')).toHaveText('Corner Mart');
    await expect(item.locator('.data-table-item-meta')).toHaveText('Groceries');
    await expect(item.locator('.data-table-item-end')).toHaveText('\u2212$42.18');
    const edges = await item.evaluate((element) => {
      const own = element.getBoundingClientRect();
      const end = element.querySelector('.data-table-item-end')?.getBoundingClientRect();
      return { right: own.right, end: end?.right ?? 0 };
    });
    expect(edges.end).toBeLessThanOrEqual(edges.right);
    // The table face is in the page, hidden; no example scrolls the page sideways.
    await expect(page.locator('.stage .data-table-grid').first()).toBeHidden();
    expect(await sideways(page)).toBe(0);
  });

  test('opens an item on a tap, and in Select mode selects it on its checkbox or a tap on the item', async ({
    page,
  }) => {
    await visit(page, '/docs/components/data-table');
    const root = page.locator('.stage .data-table').filter({ has: page.locator('.data-table-section') });
    const list = root.first().locator('.data-table-list');
    const item = list.first().locator('.data-table-item').nth(1);
    await item.evaluate((element) => {
      element.scrollIntoView({ block: 'center' });
    });
    // A tap on the item's amount lands on its link, stretched over the item: it opens, and selects nothing. The
    // tap goes to the point, since the link covers the amount and Playwright would wait for the amount itself.
    const end = await item.locator('.data-table-item-end').boundingBox();
    if (end === null) throw new Error('No amount');
    await page.touchscreen.tap(end.x + end.width / 2, end.y + end.height / 2);
    await expect(page).toHaveURL(/#t2$/);
    await expect(item).toHaveAttribute('data-current');
    await expect(item).toHaveAttribute('aria-selected', 'false');
    // No box until Select; then a tap on the box selects the item and the bar shows.
    await expect(item.getByRole('checkbox')).toHaveCount(0);
    await list.first().getByRole('button', { name: 'Select', exact: true }).tap();
    await expect(list.first().getByRole('button', { name: 'Done' })).toBeVisible();
    // The box drawn, centered in the view so the docs header does not cover it; its 40px area takes the tap.
    const box = item.locator('.checkbox-box');
    await box.evaluate((element) => {
      element.scrollIntoView({ block: 'center' });
    });
    await box.tap();
    await expect(item).toHaveAttribute('aria-selected', 'true');
    await expect(root.first().getByRole('toolbar', { name: 'Bulk actions' })).toContainText('1 selected');
    // In Select mode a tap anywhere on an item toggles it and opens nothing (spec correction 69).
    const third = list.first().locator('.data-table-item').nth(2);
    await third.evaluate((element) => {
      element.scrollIntoView({ block: 'center' });
    });
    const amount = await third.locator('.data-table-item-end').boundingBox();
    if (amount === null) throw new Error('No amount');
    await page.touchscreen.tap(amount.x + amount.width / 2, amount.y + amount.height / 2);
    await expect(third).toHaveAttribute('aria-selected', 'true');
    await expect(page).toHaveURL(/#t2$/);
    await expect(root.first().getByRole('toolbar', { name: 'Bulk actions' })).toContainText('2 selected');
    await page.touchscreen.tap(amount.x + amount.width / 2, amount.y + amount.height / 2);
    await expect(third).toHaveAttribute('aria-selected', 'false');
    // Done hides the boxes and keeps the selection.
    await list.first().getByRole('button', { name: 'Done' }).tap();
    await expect(item.getByRole('checkbox')).toHaveCount(0);
    await expect(item).toHaveAttribute('aria-selected', 'true');
    await expect(item.locator('.data-table-item-mark')).toBeVisible();
  });
});

test('the data table page keeps its side column, and draws each box of its columns example at its width in a frame that scrolls on its own', async ({
  page,
}) => {
  for (const width of [1280, 1440, 1920]) {
    await page.setViewportSize({ width, height: 900 });
    await visit(page, '/docs/components/data-table');
    // The usual layout: no stage of its own, and from 1440px the side column beside the content with its outline.
    await expect(page.locator('.stage-wide')).toHaveCount(0);
    if (width >= 1440) {
      const main = await page.locator('.panel-main').boundingBox();
      const side = await page.locator('.panel-side').boundingBox();
      expect((main?.x ?? 0) + (main?.width ?? 0)).toBeLessThan(side?.x ?? 0);
      await expect(page.locator('.toc-card')).toBeVisible();
    }
    const box = page.getByTestId('data-table-box');
    const frame = page.getByRole('region', { name: 'The table at the width chosen' });
    const shown = (): Promise<string[]> =>
      box
        .locator('[role="columnheader"]')
        .evaluateAll((cells) =>
          cells
            .filter((cell) => getComputedStyle(cell).visibility !== 'hidden')
            .map((cell) => cell.textContent),
        );
    const widths = page.getByRole('radiogroup', { name: "Width of the table's box" });
    // Each box is the width it names, whatever the page's width, and its own columns leave.
    for (const [name, pixels, columns] of [
      ['56rem', 896, ['Date', 'Payee', 'Category', 'Account', 'Amount']],
      ['44rem', 704, ['Date', 'Payee', 'Account', 'Amount']],
      ['38rem', 608, null],
    ] as const) {
      await widths.locator('.segmented-option', { hasText: name }).click();
      await expect(widths.getByRole('radio', { name })).toBeChecked();
      await expect.poll(async () => Math.round((await box.boundingBox())?.width ?? 0)).toBe(pixels);
      // Under 40rem the box draws the list instead of the table.
      if (columns === null) await expect(box.locator('.data-table-list')).toBeVisible();
      else await expect.poll(shown).toEqual(columns);
    }
    // The frame scrolls where the page is narrower than the box; the page never scrolls sideways.
    await widths.locator('.segmented-option', { hasText: '56rem' }).click();
    const fit = await frame.evaluate((element) => {
      const stage = element.closest('.stage')?.getBoundingClientRect();
      const own = element.getBoundingClientRect();
      return {
        inside: stage !== undefined && own.left >= stage.left && own.right <= stage.right,
        scrolls: element.scrollWidth > element.clientWidth,
      };
    });
    // The frame stays inside the stage, and the 56rem table, wider than the stage here, scrolls in it.
    expect(fit).toEqual({ inside: true, scrolls: true });
    expect(await sideways(page)).toBe(0);
  }
  // A keyboard scrolls the frame: it is a tab stop, and the arrows move it.
  await page.setViewportSize({ width: 1440, height: 900 });
  await visit(page, '/docs/components/data-table');
  const frame = page.getByRole('region', { name: 'The table at the width chosen' });
  await expect(frame).toHaveAttribute('tabindex', '0');
  await frame.focus();
  await page.keyboard.press('ArrowRight');
  await expect.poll(() => frame.evaluate((element) => element.scrollLeft)).toBeGreaterThan(0);
});

test('a loading data table draws its skeleton cells under its header cells, at full width', async ({
  page,
}) => {
  await visit(page, '/docs/components/data-table');
  const state = page.getByRole('radiogroup', { name: 'State' });
  await state.getByRole('radio', { name: 'Rows' }).focus();
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('ArrowRight');
  await expect(state.getByRole('radio', { name: 'Loading' })).toBeChecked();
  const root = page.locator('.stage .data-table').filter({ has: page.locator('.data-table-skeleton-row') });
  await expect(root).toHaveCount(1);
  await expectTableFace(root);
  const layout = await root.evaluate((element) => {
    const edges = (cell: Element): [number, number] => {
      const { left, right } = cell.getBoundingClientRect();
      return [Math.round(left), Math.round(right)];
    };
    const shown = (cell: Element): boolean =>
      getComputedStyle(cell).display !== 'none' && getComputedStyle(cell).visibility !== 'hidden';
    return {
      root: edges(element),
      table: edges(element.querySelector('.data-table-table') ?? element),
      headers: [...element.querySelectorAll('thead [role="columnheader"]')].filter(shown).map(edges),
      skeleton: [...(element.querySelector('.data-table-skeleton-row')?.children ?? [])]
        .filter(shown)
        .map(edges),
    };
  });
  expect(layout.table).toEqual(layout.root);
  expect(layout.headers.at(-1)?.[1]).toBe(layout.root[1]);
  expect(layout.skeleton).toEqual(layout.headers);
});

test('a data table that did not load says so in its body, with a Retry that brings the rows back', async ({
  page,
}) => {
  await visit(page, '/docs/components/data-table');
  const state = page.getByRole('radiogroup', { name: 'State' });
  await state.locator('.segmented-option', { hasText: 'Error' }).click();
  await expect(state.getByRole('radio', { name: 'Error' })).toBeChecked();
  const stage = page.locator('.stage').filter({ has: state });
  const table = stage.getByRole('grid', { name: 'Transactions' });
  await expectTableFace(table);
  const body = table.locator('tbody');
  await expect(body.getByRole('heading', { name: 'The transactions did not load' })).toBeVisible();
  await expect(stage.locator('.data-table-skeleton-row')).toHaveCount(0);
  await body.getByRole('button', { name: 'Retry' }).click();
  await expect(table.locator('tbody [role="rowheader"]')).toHaveCount(4);
});

test('a data table filtered to nothing says so and clears its filters on Clear filters', async ({ page }) => {
  await visit(page, '/docs/components/data-table');
  const search = page.getByRole('searchbox', { name: 'Search transactions' });
  const stage = page.locator('.stage').filter({ has: search });
  const table = stage.getByRole('grid', { name: 'Transactions' });
  await expectTableFace(table);
  await expect(table.getByRole('heading', { name: 'No transactions match' })).toBeVisible();
  await table.getByRole('button', { name: 'Clear filters' }).click();
  await expect(search).toHaveValue('');
  await expect(table.locator('tbody [role="rowheader"]')).toHaveCount(6);
});

test('a data table column wraps to two lines, sorts largest first on its first press, and hides an actions header but keeps its name', async ({
  page,
}) => {
  await visit(page, '/docs/components/data-table');
  const stage = page.locator('.stage').filter({ has: page.getByRole('columnheader', { name: 'Memo' }) });
  const table = stage.getByRole('grid', { name: 'Transactions' });
  await expectTableFace(table);
  // The memo runs to two lines and stops there.
  const memo = table.locator('tbody .data-table-wrap').first();
  const lines = await memo.evaluate((element) => {
    const { lineHeight } = getComputedStyle(element);
    return Math.round(element.getBoundingClientRect().height / parseFloat(lineHeight));
  });
  expect(lines).toBe(2);
  expect(await memo.evaluate((element) => element.scrollHeight > element.clientHeight)).toBe(true);
  // Amount sorts descending on its first press.
  const amount = table.getByRole('columnheader', { name: 'Amount' });
  await amount.click();
  await expect(amount).toHaveAttribute('aria-sort', 'descending');
  await expect(table.locator('tbody [role="rowheader"]').first()).toHaveText('Acme Payroll');
  await amount.click();
  await expect(amount).toHaveAttribute('aria-sort', 'ascending');
  // The actions header is named and draws nothing.
  const actions = table.getByRole('columnheader', { name: 'Actions' });
  await expect(actions).toHaveAttribute('data-header-hidden', '');
  expect((await actions.locator('.data-table-column-label').boundingBox())?.width ?? 0).toBeLessThanOrEqual(
    1,
  );
  // The row menu's cell holds its 40px button whole, with no ellipsis after it (spec correction 66).
  const room = await table
    .locator('tbody [role="row"]')
    .first()
    .evaluate((row) => {
      const cell = row.lastElementChild;
      const button = cell?.querySelector('button');
      if (!(cell instanceof HTMLElement) || button === null || button === undefined) return null;
      const own = cell.getBoundingClientRect();
      const drawn = button.getBoundingClientRect();
      return {
        clip: getComputedStyle(cell).textOverflow,
        width: Math.round(drawn.width),
        inside: drawn.left >= own.left && drawn.right <= own.right,
      };
    });
  expect(room).toEqual({ clip: 'clip', width: 40, inside: true });
  // A row with a wrapping memo keeps a part step of room above and below its two lines (spec correction 67).
  const gaps = await table
    .locator('tbody [role="row"]')
    .first()
    .evaluate((row) => {
      const text = row.querySelector('.data-table-wrap')?.getBoundingClientRect();
      const own = row.getBoundingClientRect();
      return text === undefined
        ? null
        : [Math.round(text.top - own.top), Math.round(own.bottom - text.bottom)];
    });
  expect(gaps?.[0] ?? 0).toBeGreaterThanOrEqual(8);
  expect(gaps?.[1] ?? 0).toBeGreaterThanOrEqual(8);
});

test('the columns example draws its header row at the top of its table at every width, before and after the page scrolls', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await visit(page, '/docs/components/data-table');
  const box = page.getByTestId('data-table-box');
  const widths = page.getByRole('radiogroup', { name: "Width of the table's box" });
  // The first row of the face shown starts at the face's top: the header row in the table, the first item in the
  // list. A header stuck inside the frame, at the docs header's height, would sit over the third row instead.
  const offset = (): Promise<number> =>
    box.evaluate((element) => {
      const table = element.querySelector<HTMLElement>('.data-table-table');
      const shown = table !== null && table.getBoundingClientRect().height > 0;
      const face = shown ? table : element.querySelector('.data-table-grid-list');
      const first = shown ? element.querySelector('thead th') : element.querySelector('.data-table-item');
      return Math.round(
        (first?.getBoundingClientRect().top ?? -1) - (face?.getBoundingClientRect().top ?? 0),
      );
    });
  for (const name of ['56rem', '44rem', '38rem']) {
    await widths.locator('.segmented-option', { hasText: name }).click();
    await expect(widths.getByRole('radio', { name })).toBeChecked();
    await page.evaluate(() => {
      window.scrollTo(0, 0);
    });
    await box.scrollIntoViewIfNeeded();
    await expect.poll(offset, `${name} at rest`).toBe(0);
    // The page scrolled until the table's top is under the docs header: the header row stays at the table's top,
    // since the frame is where it sticks and the frame sets the offset to 0.
    await box.evaluate((element) => {
      window.scrollBy(0, element.getBoundingClientRect().top - 20);
    });
    await expect.poll(offset, `${name} scrolled`).toBe(0);
  }
  // The frame says so: its own offset is 0, the page's the docs header's height.
  const frame = page.getByRole('region', { name: 'The table at the width chosen' });
  expect(
    await frame.evaluate((element) => getComputedStyle(element).getPropertyValue('--page-sticky-top').trim()),
  ).toBe('0px');
});

test('the docs header sets --page-sticky-top, so a data table header sticks under it, and amounts use a real minus sign', async ({
  page,
}) => {
  await visit(page, '/docs/components/data-table');
  const header = page.locator('.header');
  const height = (await header.boundingBox())?.height ?? 0;
  expect(height).toBeGreaterThan(0);
  const sticky = await page.evaluate(() =>
    parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--page-sticky-top')),
  );
  expect(sticky).toBeCloseTo(height, 0);
  // Scroll the basic example's table under the header: its header row stops at the header's foot.
  const table = page.locator('.stage').first().getByRole('grid', { name: 'Transactions' });
  await expectTableFace(table);
  await table.evaluate((element, offset) => {
    window.scrollBy(0, element.getBoundingClientRect().top - offset + 60);
  }, height);
  const column = table.getByRole('columnheader', { name: 'Payee' });
  await expect.poll(async () => Math.round((await column.boundingBox())?.y ?? 0)).toBe(Math.round(height));
  // A negative amount is written with U+2212, not a hyphen.
  await expect(table.locator('tbody').getByText('\u2212$42.18')).toHaveCount(1);
});

/** The side panel page's basic example: its stage, the open aside, and the list items beside it. */
const sidePanelExample = (page: Page): { stage: Locator; items: Locator } => {
  const stage = page.locator('.stage').first();
  // Beside the 24rem panel the table's box is under 40rem, so its list is the face drawn.
  return { stage, items: stage.locator('.data-table-list [role="row"]') };
};

test('a side panel sits beside the content from 1024px and becomes a sheet under it, keeping focus', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await visit(page, '/docs/components/side-panel');
  const { stage, items } = sidePanelExample(page);
  // In the server's HTML and hydrated open, beside the content, without taking focus.
  const panel = stage.getByRole('complementary', { name: 'Corner Mart' });
  await expect(panel).toBeVisible();
  const content = stage.locator('.side-panel-layout-content');
  expect((await content.boundingBox())?.x ?? 0).toBeLessThan((await panel.boundingBox())?.x ?? 0);
  // Another row: a new opening, and focus on its heading.
  await items.nth(1).focus();
  await page.keyboard.press('Enter');
  const heading = stage.getByRole('heading', { level: 2, name: 'City Transit' });
  await expect(heading).toBeFocused();
  // Narrower than 1024px: the same panel as a sheet, which takes focus once it has risen.
  await page.setViewportSize({ width: 800, height: 800 });
  await expect(stage.locator('.side-panel')).toHaveCount(0);
  const sheet = page.getByRole('dialog', { name: 'City Transit' });
  await expect(sheet).toBeVisible();
  await expect.poll(() => sheet.evaluate((element) => element.contains(document.activeElement))).toBe(true);
  // Wide again: the aside, with focus back on its heading.
  await page.setViewportSize({ width: 1280, height: 800 });
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(heading).toBeFocused();
});

test('Escape in a side panel closes it and puts focus back on what opened it', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await visit(page, '/docs/components/side-panel');
  const { stage, items } = sidePanelExample(page);
  const row = items.nth(2);
  await row.focus();
  await page.keyboard.press('Enter');
  const heading = stage.getByRole('heading', { level: 2, name: 'Northside Rent' });
  await expect(heading).toBeFocused();
  // The wide face traps nothing: Tab moves on through the panel.
  await page.keyboard.press('Tab');
  await expect(stage.getByRole('button', { name: 'Close' })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(stage.locator('.side-panel')).toHaveCount(0);
  // Without the panel the box is wider and draws its table, so focus goes to the same row there.
  await expect(stage.locator('.data-table-table [role="row"][data-key="t3"]')).toBeFocused();
});

test('a side panel with unsaved edits asks before it closes, on Escape and on its close button, and gives focus back to the row', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await visit(page, '/docs/components/side-panel');
  const stage = page.locator('.stage').nth(1);
  // Closed, the example's box is 40rem or more and draws its table face.
  const firstRow = stage.locator('.data-table-table .data-table-body [role="row"]').first();
  await firstRow.focus();
  await page.keyboard.press('Enter');
  const panel = stage.getByRole('complementary', { name: 'Corner Mart' });
  await expect(panel).toBeVisible();
  await panel.getByLabel('Memo').fill('Split with Sam');
  // Unsaved: Escape asks, and Cancel in the question keeps the panel and the memo.
  await page.keyboard.press('Escape');
  const question = page.getByRole('alertdialog', { name: 'Discard your changes?' });
  await expect(question).toBeVisible();
  await question.getByRole('button', { name: 'Cancel' }).click();
  await expect(question).toHaveCount(0);
  await expect(panel).toBeVisible();
  await expect(panel.getByLabel('Memo')).toHaveValue('Split with Sam');
  // The close button asks too; Discard closes the panel, and focus goes back to the row that opened it.
  await panel.getByRole('button', { name: 'Close' }).focus();
  await page.keyboard.press('Enter');
  await page.getByRole('alertdialog').getByRole('button', { name: 'Discard' }).click();
  await expect(stage.locator('.side-panel')).toHaveCount(0);
  await expect(firstRow).toBeFocused();
  // Saved, Save keeps focus, and Escape closes with no question.
  await firstRow.focus();
  await page.keyboard.press('Enter');
  await panel.getByLabel('Memo').fill('Split with Sam');
  const save = panel.getByRole('button', { name: 'Save' });
  await save.focus();
  await page.keyboard.press('Enter');
  await expect(save).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('alertdialog')).toHaveCount(0);
  await expect(stage.locator('.side-panel')).toHaveCount(0);
  await expect(firstRow).toBeFocused();
});

test('resizing across 1024px with the side panel example untouched opens and closes nothing, and moves no focus', async ({
  page,
}) => {
  await page.setViewportSize({ width: 800, height: 800 });
  await visit(page, '/docs/components/side-panel');
  const stage = page.locator('.stage').first();
  // On a phone the example waits for a press; the page loaded with nothing open.
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.getByRole('heading', { name: 'Design rules' }).scrollIntoViewIfNeeded();
  await page.setViewportSize({ width: 1280, height: 800 });
  await expect(stage.locator('.side-panel-layout')).toBeVisible();
  await expect(stage.locator('.side-panel')).toHaveCount(0);
  // Nothing opened, so nothing took focus or scrolled the page to a row.
  expect(await page.evaluate(() => document.activeElement === document.body)).toBe(true);
});

test('an open side panel that moves across 1024px while the reader is elsewhere on the page leaves focus there', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await visit(page, '/docs/components/side-panel');
  const stage = page.locator('.stage').first();
  await expect(stage.locator('.side-panel')).toBeVisible();
  // The reader is further down the page, with nothing focused.
  await page.getByRole('heading', { name: 'Design rules' }).click();
  await page.setViewportSize({ width: 800, height: 800 });
  // The sheet covers the page, so it holds focus while it does.
  const sheet = page.getByRole('dialog', { name: 'Corner Mart' });
  await expect.poll(() => sheet.evaluate((element) => element.contains(document.activeElement))).toBe(true);
  await page.setViewportSize({ width: 1280, height: 800 });
  await expect(stage.locator('.side-panel')).toBeVisible();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  // Back beside the page, the panel does not take focus or scroll the reader to it.
  await expect.poll(() => page.evaluate(() => document.activeElement === document.body)).toBe(true);
});

/** The data table page's Transactions recipe: its stage, and its table face's header and body rows. */
const transactionsRecipe = (
  page: Page,
): { stage: Locator; table: Locator; rows: Locator; pages: Locator } => {
  const stage = page
    .locator('.stage')
    .filter({ has: page.getByRole('heading', { level: 3, name: 'Transactions', exact: true }) });
  const table = stage.locator('.data-table-table');
  return {
    stage,
    table,
    rows: table.locator('.data-table-body [role="row"]'),
    pages: stage.getByRole('navigation', { name: 'Transactions pages' }),
  };
};

test('the transactions recipe writes the sort, the page and the open row to the URL and reads them back after a reload', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await visit(page, '/docs/components/data-table');
  const { stage, table, rows, pages } = transactionsRecipe(page);
  await expectTableFace(table);
  await table.getByRole('columnheader', { name: 'Amount' }).click();
  await expect(page).toHaveURL(/[?&]sort=amount(&|$)/);
  await pages.getByRole('link', { name: 'Page 2', exact: true }).click();
  await expect(page).toHaveURL(/[?&]page=2(&|$)/);
  // Sorted by amount, smallest first, page 2 starts with the 31.25 at Corner Mart.
  await expect(rows.first()).toContainText('−$31.25');
  await rows.first().locator('.data-table-link').click();
  await expect(page).toHaveURL(/[?&]open=t10(&|$)/);
  await expect(stage.getByRole('complementary', { name: 'Corner Mart' })).toBeVisible();
  expect(new URL(page.url()).searchParams.get('sort')).toBe('amount');
  expect(new URL(page.url()).searchParams.get('page')).toBe('2');
  await page.reload();
  await settled(page);
  // Read back: the sort, the page and the open row, its heading drawn beside the rows.
  // Beside the panel the box draws its list, so the table's sorted header is read hidden.
  await expect(table.locator('[role="columnheader"][aria-sort="ascending"]')).toContainText('Amount');
  await expect(pages.getByRole('link', { name: 'Page 2', exact: true })).toHaveAttribute(
    'aria-current',
    'page',
  );
  const panel = stage.getByRole('complementary', { name: 'Corner Mart' });
  await expect(panel).toBeVisible();
  await expect(panel.getByRole('heading', { level: 2, name: 'Corner Mart' })).toBeVisible();
  await expect(panel).toContainText('−$31.25');
});

test('Back closes the panel the recipe opened', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await visit(page, '/docs/components/data-table');
  const { stage, rows } = transactionsRecipe(page);
  await rows.first().locator('.data-table-link').click();
  await expect(page).toHaveURL(/[?&]open=t1(&|$)/);
  await expect(stage.getByRole('complementary', { name: 'Corner Mart' })).toBeVisible();
  await page.goBack();
  await expect(page).not.toHaveURL(/open=/);
  await expect(stage.locator('.side-panel')).toHaveCount(0);
});

test('closing the recipe panel goes back to the list entry, and another row takes the open row entry', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await visit(page, '/docs/components/data-table');
  const { stage, rows, pages } = transactionsRecipe(page);
  await pages.getByRole('link', { name: 'Page 2', exact: true }).click();
  await expect(page).toHaveURL(/[?&]page=2(&|$)/);
  await rows.first().locator('.data-table-link').click();
  await expect(page).toHaveURL(/[?&]open=t6(&|$)/);
  // Another row, from the list beside the panel: the open row's entry is replaced.
  await stage.locator('.data-table-list [role="row"][data-key="t8"] .data-table-link').click();
  await expect(page).toHaveURL(/[?&]open=t8(&|$)/);
  await stage.getByRole('button', { name: 'Close' }).click();
  await expect(stage.locator('.side-panel')).toHaveCount(0);
  await expect(page).toHaveURL(/[?&]page=2$/);
  // No copy of the list's entry was left behind: Back goes to page 1.
  await page.goBack();
  await expect(page).not.toHaveURL(/page=/);
  await expect(pages.getByRole('link', { name: 'Page 1', exact: true })).toHaveAttribute(
    'aria-current',
    'page',
  );
});

test('the recipe clears its selection when the page changes', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await visit(page, '/docs/components/data-table');
  const { stage, rows, pages } = transactionsRecipe(page);
  await rows.first().focus();
  await page.keyboard.press('x');
  await expect(rows.first()).toHaveAttribute('aria-selected', 'true');
  const bar = stage.getByRole('toolbar', { name: 'Bulk actions' });
  await expect(bar).toContainText('1 selected');
  await pages.getByRole('link', { name: 'Page 2', exact: true }).click();
  await expect(page).toHaveURL(/[?&]page=2(&|$)/);
  await expect(bar).toHaveCount(0);
  // Back on the first page, the rows are as they were and none is selected: the selection was cleared.
  await pages.getByRole('link', { name: 'Page 1', exact: true }).click();
  await expect(page).not.toHaveURL(/page=/);
  await expect(rows.first()).toHaveAttribute('aria-selected', 'false');
  await expect(bar).toHaveCount(0);
});

test('the recipe header sticks under its 4rem header, under the site header', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await visit(page, '/docs/components/data-table');
  const { table } = transactionsRecipe(page);
  await expectTableFace(table);
  const site = Math.round((await page.locator('.header').boundingBox())?.height ?? 0);
  expect(site).toBeGreaterThan(0);
  // Scroll the recipe's table under both headers: its header row stops 64px under the site's header.
  await table.evaluate((element, offset) => {
    window.scrollBy(0, element.getBoundingClientRect().top - offset);
  }, site);
  const column = table.getByRole('columnheader', { name: 'Payee' });
  await expect.poll(async () => Math.round((await column.boundingBox())?.y ?? 0)).toBe(site + 64);
});

test('an example side panel folds the rail to its icons beside the page, and the reader can expand it over the panel', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1024, height: 800 });
  await visit(page, '/docs/components/side-panel');
  const rail = page.locator('#rail');
  const { stage, items } = sidePanelExample(page);
  await expect(stage.locator('.side-panel')).toBeVisible();
  // Folded, the rows beside the panel have room: a title reads whole.
  await expect.poll(async () => Math.round((await rail.boundingBox())?.width ?? 0)).toBe(72);
  expect((await stage.locator('.side-panel-layout-content').boundingBox())?.width).toBeGreaterThan(300);
  const toggle = page.getByRole('button', { name: 'Expand the menu' });
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  // Expanded over the panel, it stays expanded until the panel closes, and the reader's setting is unchanged.
  await toggle.click();
  await expect(page.locator('html')).toHaveAttribute('data-rail-unfolded', '');
  await expect.poll(async () => Math.round((await rail.boundingBox())?.width ?? 0)).toBe(288);
  await expect(page.locator('html')).not.toHaveAttribute('data-rail', 'collapsed');
  await stage.getByRole('button', { name: 'Close' }).click();
  await expect(stage.locator('.side-panel')).toHaveCount(0);
  await expect(page.locator('html')).not.toHaveAttribute('data-rail-unfolded');
  await expect.poll(async () => Math.round((await rail.boundingBox())?.width ?? 0)).toBe(288);
  // A row opened again folds it again.
  await items.first().focus();
  await page.keyboard.press('Enter');
  await expect(stage.locator('.side-panel')).toBeVisible();
  await expect.poll(async () => Math.round((await rail.boundingBox())?.width ?? 0)).toBe(72);
  await expect(page.getByRole('button', { name: 'Expand the menu' })).toBeVisible();
});

test.describe('the side panel page without JavaScript', () => {
  test.use({ javaScriptEnabled: false });

  test('arrives with the rail folded beside the open example panel, at 1024px and 1440px', async ({
    page,
  }) => {
    for (const width of [1024, 1440]) {
      await page.setViewportSize({ width, height: 800 });
      await page.goto('/docs/components/side-panel');
      const stage = page.locator('.stage').first();
      await expect(stage.locator('.side-panel')).toBeVisible();
      expect(Math.round((await page.locator('#rail').boundingBox())?.width ?? 0), String(width)).toBe(72);
      // The rows beside the panel read: the list has room for its titles.
      expect(
        (await stage.locator('.side-panel-layout-content').boundingBox())?.width,
        String(width),
      ).toBeGreaterThan(300);
    }
  });
});

/** The row that holds focus, if it is drawn: its `data-key`, or what holds focus instead. */
const focusedDrawnKey = (page: Page): Promise<string> =>
  page.evaluate(() => {
    const active = document.activeElement;
    if (!(active instanceof HTMLElement) || active === document.body) return 'body';
    for (let node: Element | null = active; node !== null; node = node.parentElement) {
      if (getComputedStyle(node).display === 'none') return `hidden ${active.dataset.key ?? active.tagName}`;
    }
    // A row's link holds focus when a press opened the row: the row is what it belongs to.
    return active.closest<HTMLElement>('[data-key]')?.dataset.key ?? active.tagName;
  });

for (const width of [1024, 1440]) {
  test(`closing a side panel at ${String(width)}px gives focus back to the drawn row, by key and by pointer`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 800 });
    await visit(page, '/docs/components/side-panel');
    const { stage, items } = sidePanelExample(page);
    await items.nth(2).focus();
    await page.keyboard.press('Enter');
    await expect(stage.getByRole('heading', { level: 2, name: 'Northside Rent' })).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(stage.locator('.side-panel')).toHaveCount(0);
    // The rail unfolds as the panel leaves; focus stays on the row as drawn once the page has settled.
    await page.waitForTimeout(400);
    expect(await focusedDrawnKey(page)).toBe('t3');
    // By pointer: a row's link opens it, and the close button closes it.
    await items.nth(1).locator('.data-table-link').click();
    await stage.getByRole('button', { name: 'Close' }).click();
    await expect(stage.locator('.side-panel')).toHaveCount(0);
    await page.waitForTimeout(400);
    expect(await focusedDrawnKey(page)).toBe('t2');
  });

  test(`closing the recipe's panel at ${String(width)}px gives focus back to the drawn row`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 800 });
    await visit(page, '/docs/components/data-table');
    const { stage } = transactionsRecipe(page);
    // Sorted by date, the list's day headings are rows too: the item is found by its key.
    await stage.locator('.data-table-list [role="row"][data-key="t1"]').focus();
    await page.keyboard.press('Enter');
    await expect(stage.getByRole('heading', { level: 2, name: 'Corner Mart' })).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(stage.locator('.side-panel')).toHaveCount(0);
    await page.waitForTimeout(400);
    expect(await focusedDrawnKey(page)).toBe('t1');
  });
}
