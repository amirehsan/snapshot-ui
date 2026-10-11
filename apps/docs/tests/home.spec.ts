import { expect, test, type Page } from '@playwright/test';
import { axeViolations, sideways } from './support';

/**
 * Opens the homepage and waits for hydration. React marks a node with its props
 * once it has hydrated it, so a click sent after this is never lost to a page
 * that is still booting. The homepage has no docs header, so the docs pages'
 * `settled` has nothing to wait on here.
 */
const visit = async (page: Page): Promise<void> => {
  await page.goto('/');
  await page.waitForFunction(() =>
    Object.keys(document.querySelector('.shape-switch input') ?? {}).some((key) =>
      key.startsWith('__reactProps$'),
    ),
  );
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

/** What a pointer or finger must be able to hit on the homepage. No link here sits inside a sentence. */
const CONTROLS = 'a[href], button, summary, .segmented-option';

/**
 * The controls inside `root` that are hit smaller than 40px, as "name: WxH". A control is hit at
 * its own box, or at its ::before or ::after when that is larger. Where the box falls short, a
 * point just past the drawn edge must still land on the control, so the extra area is known to
 * sit around it and not somewhere else.
 */
const smallTargets = (page: Page, root: string): Promise<string[]> =>
  page.evaluate(
    ([scope, selector]) => {
      const failures: string[] = [];
      for (const element of document.querySelector(scope)?.querySelectorAll(selector) ?? []) {
        const box = element.getBoundingClientRect();
        const style = getComputedStyle(element);
        if (box.width === 0 || box.height === 0 || style.visibility === 'hidden') continue;
        // A summary that cannot be clicked is not a target.
        if (style.pointerEvents === 'none') continue;

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
          failures.push(`${name}: ${String(Math.round(width))}x${String(Math.round(height))}`);
        }
      }
      return failures;
    },
    [root, CONTROLS] as const,
  );

for (const width of [375, 1440]) {
  test(`every control on the homepage is hit at 40px at ${String(width)}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await visit(page);
    if (width < 768) {
      // The footer folds into columns on a phone; open each so its links count too.
      await expect(page.locator('.footer-col[open]')).toHaveCount(0);
      for (const summary of await page.locator('.footer-col summary').all()) await summary.click();
      await expect(page.locator('.footer-col[open]')).toHaveCount(4);
    }
    expect(await smallTargets(page, 'body')).toEqual([]);

    if (width < 1024) {
      await page.getByRole('button', { name: 'Open menu' }).click();
      await expect(page.getByRole('navigation', { name: 'Menu' })).toBeVisible();
      expect(await smallTargets(page, '.nav-overlay')).toEqual([]);
    }
  });
}
