import { expect, test, type Locator, type Page } from '@playwright/test';
import { axeViolations, hitSize, hitsAt, settled, sideways, withoutClipboard } from './support';

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

for (const theme of ['light', 'dark'] as const) {
  test(`a docs page has no axe violations in ${theme}`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: theme });
    await visit(page);
    await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
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

test('a server-rendered MDX page renders library components and props', async ({ page }) => {
  await visit(page);
  await expect(page.getByRole('button', { name: 'Delete site' })).toBeVisible();
  await expect(page.getByText("Default: 'primary'")).toBeVisible();
});

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
  for (const selector of ['.rail', '.workspace', '.scrim', '.tabs', '.icon-button']) {
    await expect(page.locator(selector).first()).toHaveCSS('transition-duration', '0s');
  }
});

for (const width of [375, 1440]) {
  test(`brand link, preview tabs and contents links are hit at 40px at ${String(width)}px`, async ({
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
