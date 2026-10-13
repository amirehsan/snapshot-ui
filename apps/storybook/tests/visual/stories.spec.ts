import { readFileSync } from 'node:fs';
import { expect, test } from '@playwright/test';
import { ready } from './ready';

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

const THEME_SHAPES = [
  { theme: 'light', shape: 'rounded' },
  { theme: 'dark', shape: 'rounded' },
  { theme: 'light', shape: 'soft' },
  { theme: 'light', shape: 'square' },
] as const;

interface Mode {
  theme: 'light' | 'dark';
  shape: 'rounded' | 'soft' | 'square';
  density: 'comfortable' | 'compact';
  width: 1280 | 375;
}

/**
 * The modes a story is shot in, from its tags. Untagged: the four theme and shape modes at 1280 and light
 * Rounded at 375. `viewport-phone`: the four at 375 and nothing at 1280; `viewport-desktop`: the four at 1280
 * and nothing at 375. `density` adds light Rounded compact at the story's width, with the `-compact` suffix.
 */
function modesOf(id: string, tags: readonly string[] = []): Mode[] {
  const phone = tags.includes('viewport-phone');
  const desktop = tags.includes('viewport-desktop');
  if (phone && desktop) throw new Error(`${id} is tagged viewport-phone and viewport-desktop; pick one`);
  const width = phone ? 375 : 1280;
  const modes: Mode[] = THEME_SHAPES.map((mode) => ({ ...mode, density: 'comfortable', width }));
  if (!phone && !desktop)
    modes.push({ theme: 'light', shape: 'rounded', density: 'comfortable', width: 375 });
  if (tags.includes('density')) modes.push({ theme: 'light', shape: 'rounded', density: 'compact', width });
  return modes;
}

const suffixOf = ({ width, density }: Mode): string =>
  `${width === 1280 ? '' : `-${width}`}${density === 'compact' ? '-compact' : ''}`;

for (const story of stories) {
  for (const mode of modesOf(story.id, story.tags)) {
    const { theme, shape, density, width } = mode;
    test(`${story.id} [${theme}/${shape}${suffixOf(mode)}]`, async ({ page }) => {
      await page.setViewportSize({ width, height: 720 });
      await page.goto(
        `/iframe.html?id=${story.id}&viewMode=story&globals=theme:${theme};shape:${shape};density:${density}`,
      );
      await ready(page);
      await page.evaluate(() => document.fonts.ready);
      await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
      await expect(page.locator('html')).toHaveAttribute('data-shape', shape);
      await expect(page.locator('html')).toHaveAttribute('data-density', density);
      await expect(page).toHaveScreenshot(`${story.id}--${theme}-${shape}${suffixOf(mode)}.png`, {
        fullPage: true,
      });
    });
  }
}
