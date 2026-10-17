import { expect, test } from '@playwright/test';
import { auditConcentric, type Finding } from '../../storybook/tests/concentric/audit';
import { CHART_PAGES, COMPONENT_PAGES, cornersSettled, settled } from './support';

const SHAPES = ['rounded', 'soft', 'square'] as const;

const PAGES = ['/', '/docs', ...COMPONENT_PAGES.map(({ url }) => url), ...CHART_PAGES.map(({ url }) => url)];

/*
 * Every page in every shape: a rounded part whose corner lies inside its holder's corner curve takes the
 * holder's radius less the gap between them (docs/design-system.md, "Nested radii, derived"). The shape is one
 * attribute on the root, so a page is measured three times from one load, with transitions off so no corner
 * is caught halfway.
 */
for (const url of PAGES) {
  test(`${url} has concentric corners`, async ({ page }) => {
    await page.goto(url);
    // The homepage has its own Corners switch; every docs page has the header's two.
    await (url === '/' ? cornersSettled(page) : settled(page));
    await page.addStyleTag({
      content: '*, *::before, *::after { transition: none !important; animation: none !important; }',
    });
    await page.evaluate(() => document.fonts.ready);
    const found: (Finding & { shape: string })[] = [];
    for (const shape of SHAPES) {
      await page.evaluate(async (next) => {
        document.documentElement.dataset.shape = next;
        await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      }, shape);
      const findings = await page.evaluate(auditConcentric);
      found.push(...findings.map((finding) => ({ shape, ...finding })));
    }
    if (found.length > 0) {
      await test.info().attach('findings', {
        body: JSON.stringify(found, null, 2),
        contentType: 'application/json',
      });
    }
    expect(found).toEqual([]);
  });
}
