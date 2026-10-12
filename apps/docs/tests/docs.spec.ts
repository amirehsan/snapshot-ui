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

/** The field whose control has this name, on the page that is open. */
const fieldNamed = (page: Page, name: string): Locator =>
  page.locator('.field').filter({ has: page.getByRole('textbox', { name, exact: true }) });

test('the field parts page shows the Changed chip on a changed field and hides it on an invalid one', async ({
  page,
}) => {
  await page.emulateMedia({ colorScheme: 'light' });
  await visit(page, '/docs/components/field');
  const edited = fieldNamed(page, 'Workspace name');
  await expect(edited.locator('.field-changed')).toBeHidden();
  await edited.getByRole('textbox').fill('Northwind Studio East');
  await expect(edited.locator('.field-changed')).toBeVisible();
  await edited.getByRole('textbox').fill('Northwind Studio');
  await expect(edited.locator('.field-changed')).toBeHidden();

  // A changed field draws the light signal orange edge and its chip.
  const changed = fieldNamed(page, 'Display name');
  await expect(changed.locator('.field-changed')).toBeVisible();
  await expect(changed.getByRole('textbox')).toHaveCSS('border-top-color', 'rgb(243, 115, 56)');
  // An invalid field draws the error edge and the error line, and no chip.
  const invalid = fieldNamed(page, 'Short description');
  await expect(invalid.locator('.field-changed')).toBeHidden();
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
  await expect(field.locator('.field-changed')).toBeHidden();

  await switchNamed(page, 'Weekly digest').click();
  await save.click();
  await expect(digest).toBeChecked();
  await expect(field.locator('.field-changed')).toBeHidden();
  await expect(save).toBeDisabled();
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
