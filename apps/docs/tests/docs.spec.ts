import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

const PAGE = '/docs/components/button';

const sideways = (page: Page): Promise<number> =>
  page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);

for (const width of [375, 768, 1024, 1440]) {
  test(`a docs page fits ${String(width)}px with no sideways scroll`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(PAGE);
    expect(await sideways(page)).toBe(0);
  });
}

for (const theme of ['light', 'dark'] as const) {
  test(`a docs page has no axe violations in ${theme}`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: theme });
    await page.goto(PAGE);
    await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
    const { violations } = await new AxeBuilder({ page }).analyze();
    expect(violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`)).toEqual(
      [],
    );
  });
}

test('the rail collapses to icons and remembers it', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(PAGE);
  await page.getByRole('button', { name: 'Collapse the menu' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-rail', 'collapsed');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-rail', 'collapsed');
  await expect(page.getByRole('navigation').getByRole('link', { name: 'Spinner' })).toBeVisible();
  await page.getByRole('button', { name: 'Expand the menu' }).click();
  await expect(page.locator('html')).not.toHaveAttribute('data-rail', 'collapsed');
});

test('under 1024px the rail is a drawer that Escape closes', async ({ page }) => {
  await page.setViewportSize({ width: 768, height: 900 });
  await page.goto(PAGE);
  const menu = page.getByRole('button', { name: 'Open the menu' });
  await menu.click();
  await expect(page.locator('html')).toHaveAttribute('data-drawer', 'open');
  await expect(page.getByRole('navigation').getByRole('link', { name: 'Spinner' })).toBeInViewport();
  await page.keyboard.press('Escape');
  await expect(page.locator('html')).not.toHaveAttribute('data-drawer', 'open');
  await expect(menu).toBeFocused();
});

test('the color mode switch themes the page and persists', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'light' });
  await page.goto(PAGE);
  await page.locator('label', { hasText: 'Dark' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(14, 14, 13)');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
});

test('the corner switch recuts the page and persists', async ({ page }) => {
  await page.goto(PAGE);
  await page.locator('label', { hasText: 'Square' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-shape', 'square');
  await expect(page.getByRole('button', { name: 'Delete site' })).toHaveCSS('border-top-left-radius', '0px');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-shape', 'square');
});

test('Cmd or Ctrl and K opens search and finds a component', async ({ page }) => {
  await page.goto('/docs');
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

test('a server-rendered MDX page renders library components and props', async ({ page }) => {
  await page.goto(PAGE);
  await expect(page.getByRole('button', { name: 'Delete site' })).toBeVisible();
  await expect(page.getByText("Default: 'primary'")).toBeVisible();
});
