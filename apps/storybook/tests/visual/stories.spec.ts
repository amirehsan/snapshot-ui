import { readFileSync } from 'node:fs';
import { expect, test } from '@playwright/test';

interface IndexEntry {
  id: string;
  type: 'story' | 'docs';
  tags?: string[];
}

// storybook-static must be built first.
const index = JSON.parse(
  readFileSync(new URL('../../storybook-static/index.json', import.meta.url), 'utf8'),
) as { entries: Record<string, IndexEntry> };

const stories = Object.values(index.entries).filter(
  (entry) => entry.type === 'story' && !entry.tags?.includes('no-visual'),
);

const modes = [
  { theme: 'light', shape: 'rounded', width: 1280 },
  { theme: 'dark', shape: 'rounded', width: 1280 },
  { theme: 'light', shape: 'soft', width: 1280 },
  { theme: 'light', shape: 'square', width: 1280 },
  { theme: 'light', shape: 'rounded', width: 375 },
] as const;

for (const story of stories) {
  for (const { theme, shape, width } of modes) {
    const suffix = width === 1280 ? '' : `-${width}`;
    test(`${story.id} [${theme}/${shape}${suffix}]`, async ({ page }) => {
      await page.setViewportSize({ width, height: 720 });
      await page.goto(`/iframe.html?id=${story.id}&viewMode=story&globals=theme:${theme};shape:${shape}`);
      await page.waitForFunction(() => {
        const phase = (window as { __STORYBOOK_PREVIEW__?: { currentRender?: { phase?: string } } })
          .__STORYBOOK_PREVIEW__?.currentRender?.phase;
        return phase === 'completed' || phase === 'finished';
      });
      await page.evaluate(() => document.fonts.ready);
      await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
      await expect(page.locator('html')).toHaveAttribute('data-shape', shape);
      await expect(page).toHaveScreenshot(`${story.id}--${theme}-${shape}${suffix}.png`);
    });
  }
}
