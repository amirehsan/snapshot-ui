import { expect, test, type Page } from '@playwright/test';
import { PREVIEW_PAGES, settled } from './support';

/**
 * Every example on a stage keeps the width it is drawn for. The stage centers its example, so the example's root
 * takes the width of its content, and a size container takes none from its content: its intrinsic inline size is
 * 0, the library's ruling (design record, "An intrinsic inline size of 0"). A holder that takes the width of its
 * content gives it one, and an example that does not collapses to its padding: a month grid in a card was 66px
 * wide at 1280px, its title broken letter by letter. Two checks find that, on every page that shows a Preview, at
 * a desktop's width and a phone's.
 */

/**
 * The narrowest a size container may be drawn when its width comes from the stage centering the example: 8rem.
 * A container narrower than this whose width the example's root gives, such as the collapsed sidebar's 72px
 * rail, keeps its width when the stage stretches the root, and passes.
 */
const NARROWEST = 128;

/** The longest word the second check looks at: a longer one, such as an IBAN or a web address, may wrap. */
const LONGEST_WORD = 15;

/** Each collapse on the page's stages, written as "example N: what collapsed". An empty list is a pass. */
const collapses = (page: Page): Promise<string[]> =>
  page.locator('.stage').evaluateAll(
    (stages, [narrowest, longest]) =>
      stages.flatMap((stage, index) => {
        const example = `example ${String(index + 1)}`;
        const found: string[] = [];
        const style = getComputedStyle(stage);
        const room = stage.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);

        // 1. A size container drawn narrower than 8rem, with room for it, that widens when the stage stretches
        // its example: its width came from the example's content, which is none, and not from a holder.
        const containers = [...stage.querySelectorAll('*')].filter(
          (element) =>
            ['size', 'inline-size'].includes(getComputedStyle(element).containerType) &&
            element.checkVisibility(),
        );
        const centered = containers.map((element) => element.getBoundingClientRect().width);
        (stage as HTMLElement).style.placeItems = 'stretch';
        const stretched = containers.map((element) => element.getBoundingClientRect().width);
        (stage as HTMLElement).style.placeItems = '';
        containers.forEach((element, at) => {
          const width = centered[at] ?? 0;
          const given = stretched[at] ?? 0;
          if (width < Math.min(narrowest, room) && given > width + 1) {
            const name = element.classList[0] ?? element.tagName.toLowerCase();
            found.push(
              `${example}: .${name} is ${String(Math.round(width))}px wide, and ${String(Math.round(given))}px when its holder has a width`,
            );
          }
        });

        // 2. A short word broken across lines: a box narrower than one word. Text a screen reader alone reads,
        // clipped out of sight, is left out, as is a word longer than 15 letters, which may wrap by design.
        const clipped = (node: Node): boolean => {
          for (
            let element = node.parentElement;
            element && element !== stage;
            element = element.parentElement
          ) {
            const { clip, clipPath, overflow } = getComputedStyle(element);
            const box = element.getBoundingClientRect();
            if (clipPath !== 'none' || (clip !== 'auto' && clip !== '')) return true;
            if (overflow !== 'visible' && (box.width <= 1 || box.height <= 1)) return true;
          }
          return false;
        };
        const walker = document.createTreeWalker(stage, NodeFilter.SHOW_TEXT);
        const broken = new Set<string>();
        for (let node = walker.nextNode(); node; node = walker.nextNode()) {
          if (!node.parentElement?.checkVisibility() || clipped(node)) continue;
          const text = node.textContent ?? '';
          for (const match of text.matchAll(/[\p{L}\p{N}\p{M}‌]+/gu)) {
            const word = match[0];
            if (word.length < 2 || word.length > longest) continue;
            const range = document.createRange();
            range.setStart(node, match.index);
            range.setEnd(node, match.index + word.length);
            const lines = new Set(
              [...range.getClientRects()]
                .filter((rect) => rect.width > 0)
                .map((rect) => Math.round(rect.top)),
            );
            if (lines.size > 1) broken.add(word);
          }
        }
        if (broken.size > 0) found.push(`${example}: words broken across lines: ${[...broken].join(', ')}`);
        return found;
      }),
    [NARROWEST, LONGEST_WORD] as const,
  );

const check = async (page: Page, url: string): Promise<void> => {
  await page.goto(url);
  await settled(page);
  await page.evaluate(() => document.fonts.ready);
  await expect(page.locator('.stage').first()).toBeVisible();
  expect(await collapses(page), `collapsed examples on ${url}`).toEqual([]);
};

test('the pages with a Preview include the month grid, a chart and the theming page', () => {
  expect(PREVIEW_PAGES.length).toBeGreaterThanOrEqual(50);
  expect(PREVIEW_PAGES).toContain('/docs/components/month-grid');
  expect(PREVIEW_PAGES).toContain('/docs/charts/line-chart');
  expect(PREVIEW_PAGES).toContain('/docs/theming');
});

test.describe('at 1280px', () => {
  test.use({ viewport: { width: 1280, height: 800 } });
  for (const url of PREVIEW_PAGES) {
    test(`no example collapses on ${url}`, async ({ page }) => {
      await check(page, url);
    });
  }
});

test.describe('at 375px', () => {
  test.use({ viewport: { width: 375, height: 812 } });
  for (const url of PREVIEW_PAGES) {
    test(`no example collapses on ${url}`, async ({ page }) => {
      await check(page, url);
    });
  }
});
