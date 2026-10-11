import AxeBuilder from '@axe-core/playwright';
import { expect, type Locator, type Page } from '@playwright/test';

/** How far the page overflows the window sideways. Zero means it fits. */
export const sideways = (page: Page): Promise<number> =>
  page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);

/** The color and corner switches in the docs header settle after hydration: one radio is checked in each. */
export const settled = (page: Page): Promise<void> =>
  expect(page.locator('.header input[type="radio"]:checked')).toHaveCount(2);

/** The homepage's Corners switch settles after hydration: exactly one of its radios is checked. */
export const cornersSettled = (page: Page): Promise<void> =>
  expect(page.locator('.shape-switch input[type="radio"]:checked')).toHaveCount(1);

/**
 * Takes the clipboard away before the page loads: `missing` as outside a secure context, `refusing`
 * as when permission is denied. Either way a copy button must report a failure rather than throw.
 */
export const withoutClipboard = async (page: Page, mode: 'missing' | 'refusing'): Promise<void> => {
  await page.addInitScript((how) => {
    const clipboard =
      how === 'missing' ? undefined : { writeText: () => Promise.reject(new Error('denied')) };
    Object.defineProperty(navigator, 'clipboard', { value: clipboard, configurable: true });
  }, mode);
};

/** Every axe violation on the page, as "rule: selectors". An empty list is a pass. */
export const axeViolations = async (page: Page): Promise<string[]> => {
  const { violations } = await new AxeBuilder({ page }).analyze();
  return violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`);
};

/** The size a pointer can hit: the element's box, or its ::before or ::after hit area when that is larger. */
export const hitSize = (locator: Locator): Promise<{ width: number; height: number }> =>
  locator.evaluate((element) => {
    const box = element.getBoundingClientRect();
    const areas = [getComputedStyle(element, '::before'), getComputedStyle(element, '::after')];
    return {
      width: Math.max(box.width, ...areas.map((area) => parseFloat(area.width) || 0)),
      height: Math.max(box.height, ...areas.map((area) => parseFloat(area.height) || 0)),
    };
  });

/** Whether a point `dy` pixels from the element's center, past its drawn edge, still hits it. */
export const hitsAt = (locator: Locator, selector: string, dy: number): Promise<boolean> =>
  locator.evaluate(
    (element, [target, offset]) => {
      const box = element.getBoundingClientRect();
      const hit = document.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2 + offset);
      return hit?.closest(target) === element;
    },
    [selector, dy] as const,
  );
