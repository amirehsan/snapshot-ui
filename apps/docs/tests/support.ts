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

/**
 * Fails unless the data table holding `inside` draws its table face: its box is 40rem or wider, where its list
 * face never takes over, so a test of rows, headers and cells cannot pass by finding a face nobody sees. The
 * data table page's examples have a wide stage for this (plan, spec correction 23).
 */
export const expectTableFace = async (inside: Locator): Promise<void> => {
  const width = await inside.evaluate(
    (element) => element.closest('.data-table')?.getBoundingClientRect().width ?? 0,
  );
  expect(width, 'the data table box, 40rem or wider for its table face').toBeGreaterThanOrEqual(640);
};

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
  let builder = new AxeBuilder({ page }).options({
    rules: { 'label-content-name-mismatch': { enabled: true } },
  });
  if (disableRules.length > 0) builder = builder.disableRules([...disableRules]);
  const { violations } = await builder.analyze();
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

/** `color` laid over `under`, as the browser composites a translucent fill: Chromium's forced Highlight is one. */
export const over = (color: string, under: string): string => {
  const parse = (value: string): number[] => (value.match(/[\d.]+/g) ?? []).map(Number);
  const [r = 0, g = 0, b = 0, alpha = 1] = parse(color);
  const [ur = 0, ug = 0, ub = 0] = parse(under);
  const mix = (top: number, bottom: number): number => Math.round(top * alpha + bottom * (1 - alpha));
  return `rgb(${String(mix(r, ur))}, ${String(mix(g, ug))}, ${String(mix(b, ub))})`;
};

/** What the browser drew in a box: its most common color, the color farthest from it, and their contrast. */
export interface Drawn {
  /** The most common color, the fill behind the text. */
  fill: string;
  /** The color with the highest contrast against the fill: the text, or a ring. */
  ink: string;
  /** The WCAG contrast ratio of the two, to two decimals. */
  ratio: number;
}

/**
 * The colors the browser drew, read from a screenshot of `locator`, or of `clip` on the page, decoded in the page:
 * computed values say what a stylesheet asked for, and this says what a reader sees, a forced repaint and
 * Chromium's text backplate included. Colors are written as `getComputedStyle` writes them, `rgb(r, g, b)`.
 */
export const drawn = async (
  page: Page,
  target: Locator | { x: number; y: number; width: number; height: number },
): Promise<Drawn> => {
  const shot =
    'screenshot' in target
      ? await target.screenshot({ animations: 'disabled' })
      : await page.screenshot({ clip: target, animations: 'disabled' });
  return page.evaluate(async (data) => {
    const image = new Image();
    image.src = `data:image/png;base64,${data}`;
    await image.decode();
    const canvas = document.createElement('canvas');
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    const context = canvas.getContext('2d');
    if (context === null) throw new Error('No 2D context');
    context.drawImage(image, 0, 0);
    const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
    const counts = new Map<number, number>();
    for (let index = 0; index < pixels.length; index += 4) {
      const key = ((pixels[index] ?? 0) << 16) | ((pixels[index + 1] ?? 0) << 8) | (pixels[index + 2] ?? 0);
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    const channel = (value: number): number => {
      const c = value / 255;
      return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
    };
    const luminance = (key: number): number =>
      0.2126 * channel((key >> 16) & 255) + 0.7152 * channel((key >> 8) & 255) + 0.0722 * channel(key & 255);
    const contrast = (a: number, b: number): number => {
      const [high, low] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
      return (high + 0.05) / (low + 0.05);
    };
    const fill = [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? 0;
    let ink = fill;
    for (const key of counts.keys()) if (contrast(fill, key) > contrast(fill, ink)) ink = key;
    const css = (key: number): string =>
      `rgb(${String((key >> 16) & 255)}, ${String((key >> 8) & 255)}, ${String(key & 255)})`;
    return { fill: css(fill), ink: css(ink), ratio: Math.round(contrast(fill, ink) * 100) / 100 };
  }, shot.toString('base64'));
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
