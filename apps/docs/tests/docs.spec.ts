import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Locator, type Page } from '@playwright/test';

const PAGE = '/docs/components/button';

const sideways = (page: Page): Promise<number> =>
  page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);

/** The color and corner switches settle after hydration: one radio is checked in each. */
const settled = (page: Page): Promise<void> =>
  expect(page.locator('.header input[type="radio"]:checked')).toHaveCount(2);

/** Whether the focused element is inside the open drawer. */
const focusInRail = (page: Page): Promise<boolean> =>
  page.evaluate(() => document.activeElement?.closest('#rail') != null);

/** Opens a page and waits for hydration, so the keys and clicks a test sends are not lost to a page still booting. */
const visit = async (page: Page, url = PAGE): Promise<void> => {
  await page.goto(url);
  await settled(page);
};

const axeViolations = async (page: Page): Promise<string[]> => {
  const { violations } = await new AxeBuilder({ page }).analyze();
  return violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`);
};

/** The size a pointer can hit: the element's box, or its ::after hit area when that is larger. */
const hitSize = (locator: Locator): Promise<{ width: number; height: number }> =>
  locator.evaluate((element) => {
    const box = element.getBoundingClientRect();
    const hit = getComputedStyle(element, '::after');
    return {
      width: Math.max(box.width, parseFloat(hit.width) || 0),
      height: Math.max(box.height, parseFloat(hit.height) || 0),
    };
  });

/** Whether a point `dy` pixels from the element's center, past its drawn edge, still hits it. */
const hitsAt = (locator: Locator, selector: string, dy: number): Promise<boolean> =>
  locator.evaluate(
    (element, [target, offset]) => {
      const box = element.getBoundingClientRect();
      const hit = document.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2 + offset);
      return hit?.closest(target) === element;
    },
    [selector, dy] as const,
  );

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
  await expect(page.getByRole('link', { name: 'Spinner' })).toBeInViewport({ ratio: 1 });
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
  await expect(page.getByRole('navigation').getByRole('link', { name: 'Spinner' })).toBeInViewport();
  await expect(page.locator('.workspace')).toHaveAttribute('inert', '');
  // The page behind the drawer does not scroll.
  await expect(page.locator('html')).toHaveCSS('overflow', 'hidden');
  // Focus starts on the link to the current page, not on the first link.
  await expect(page.getByRole('link', { name: 'Button' })).toBeFocused();

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
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'clipboard', { value: undefined, configurable: true });
  });
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
      await expect(page.getByRole('link', { name: 'Spinner' })).toBeInViewport({ ratio: 1 });
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
