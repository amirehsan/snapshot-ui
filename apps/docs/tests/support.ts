import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import AxeBuilder from '@axe-core/playwright';
import { expect, type Locator, type Page } from '@playwright/test';

/** A file under the docs content, read as text. */
const content = (path: string): string =>
  readFileSync(fileURLToPath(new URL(`../content/docs/${path}`, import.meta.url)), 'utf8');

/** A docs page of a section: its slug, the title it gives itself, and where it lives. */
export interface SectionPage {
  slug: string;
  title: string;
  url: string;
}

/**
 * The pages of one section of the rail, `components` or `charts`, in the rail's order: each one's slug, as
 * the section's list gives it, the title its page gives itself, and its address. Read from the content, so a
 * page added to the rail is covered by every test that loops over these lists without anyone remembering to
 * add it.
 */
const pagesOf = (folder: 'components' | 'charts'): SectionPage[] =>
  (JSON.parse(content(`${folder}/meta.json`)) as { pages: string[] }).pages.map((slug) => ({
    slug,
    title: /^title: (.+)$/m.exec(content(`${folder}/${slug}.mdx`))?.[1] ?? slug,
    url: `/docs/${folder}/${slug}`,
  }));

/** The pages of the Components section, in the rail's order. */
export const COMPONENT_PAGES: SectionPage[] = pagesOf('components');

/** The pages of the Charts section, in the rail's order: the charts of `@snapshot-ui/charts`. */
export const CHART_PAGES: SectionPage[] = pagesOf('charts');

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

/**
 * Every axe violation on the page, as "rule: selectors". An empty list is a pass. The check that a control's
 * accessible name holds the text it shows is experimental in this axe and on by default from axe 4.14, the
 * version the packages' own tests run, so it is turned on here too. `disableRules` turns rules off for a page
 * that has a reason, which its caller records.
 */
export const axeViolations = async (
  page: Page,
  { disableRules = [] }: { disableRules?: readonly string[] } = {},
): Promise<string[]> => {
  // A date field's placeholder segments ("mm", "dd", "yyyy") are the field's placeholder, taupe under a visible
  // label as every field's is, which in a text input is a pseudo-element axe never measures. On a page that draws
  // one, contrast runs in a pass of its own that skips them alone and measures everything else, typed segments
  // included (design-system.md, "DateRangePicker").
  const split = (await page.locator('.date-segment[data-placeholder]').count()) > 0;
  const skipped = split ? ['color-contrast'] : [];
  let builder = new AxeBuilder({ page }).options({
    rules: {
      'label-content-name-mismatch': { enabled: true },
      ...Object.fromEntries(skipped.map((rule) => [rule, { enabled: false }])),
    },
  });
  if (disableRules.length > 0) builder = builder.disableRules([...disableRules, ...skipped]);
  const { violations } = await builder.analyze();
  if (split && !disableRules.includes('color-contrast')) {
    const contrast = await new AxeBuilder({ page })
      .withRules(['color-contrast'])
      .exclude('.date-segment[data-placeholder]')
      .analyze();
    violations.push(...contrast.violations);
  }
  return violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`);
};

/**
 * The color the reader's palette gives a system color keyword, such as `Highlight` or `CanvasText`, read from
 * a probe on the open page. Under forced colors this is what an element drawn in that keyword computes to.
 */
export const systemColor = (page: Page, name: string): Promise<string> =>
  page.evaluate((keyword) => {
    const probe = document.createElement('span');
    probe.style.color = keyword;
    document.body.append(probe);
    const { color } = getComputedStyle(probe);
    probe.remove();
    return color;
  }, name);

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
