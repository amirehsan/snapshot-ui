import { readFileSync } from 'node:fs';
import { expect, test, type Page } from '@playwright/test';
import { auditConcentric, type Finding } from './audit';

interface IndexEntry {
  id: string;
  title: string;
  type: 'story' | 'docs';
}

interface PreviewWindow {
  __STORYBOOK_PREVIEW__?: { currentRender?: { id?: string; phase?: string } };
  __STORYBOOK_ADDONS_CHANNEL__?: { emit: (event: string, ...args: unknown[]) => void };
}

// storybook-static must be built first.
const index = JSON.parse(
  readFileSync(new URL('../../storybook-static/index.json', import.meta.url), 'utf8'),
) as { entries: Record<string, IndexEntry> };

const groups = new Map<string, string[]>();
for (const entry of Object.values(index.entries)) {
  if (entry.type !== 'story') continue;
  groups.set(entry.title, [...(groups.get(entry.title) ?? []), entry.id]);
}

const SHAPES = ['rounded', 'soft', 'square'] as const;

/** The rail (Sidebar and AppShell) takes this rule in its own change; until then its parts are not checked. */
const PENDING = /\b(?:sidebar|app-shell)/;

/** Resolves once the story has rendered and run its play function; rejects if Storybook reports an error. */
const rendered = async (page: Page, id: string): Promise<void> => {
  const settled = await page.waitForFunction((storyId) => {
    const render = (window as PreviewWindow).__STORYBOOK_PREVIEW__?.currentRender;
    if (render?.id !== storyId) return false;
    const { phase } = render;
    return phase === 'completed' || phase === 'finished' || phase === 'errored' ? phase : false;
  }, id);
  if ((await settled.jsonValue()) === 'errored') throw new Error(`Storybook reported ${id} as errored`);
  await page.evaluate(async () => {
    await document.fonts.ready;
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  });
};

/*
 * Every story in every shape: a rounded part whose corner lies inside its holder's corner curve takes the
 * holder's radius less the gap between them. One test per component: each shape loads the first story once,
 * then the preview switches story in place, which is far quicker than loading the page for every story.
 */
for (const [title, ids] of groups) {
  test(`${title} has concentric corners`, async ({ page }) => {
    test.setTimeout(30_000 + ids.length * SHAPES.length * 5_000);
    await page.setViewportSize({ width: 1280, height: 720 });
    // No transition is measured halfway.
    await page.emulateMedia({ reducedMotion: 'reduce' });
    const found: (Finding & { story: string; shape: string })[] = [];
    for (const shape of SHAPES) {
      for (const [position, id] of ids.entries()) {
        if (position === 0) {
          await page.goto(`/iframe.html?id=${id}&viewMode=story&globals=theme:light;shape:${shape};a11y.manual:!true`);
        } else {
          await page.evaluate((storyId) => {
            (window as PreviewWindow).__STORYBOOK_ADDONS_CHANNEL__?.emit('setCurrentStory', {
              storyId,
              viewMode: 'story',
            });
          }, id);
        }
        await rendered(page, id);
        await expect(page.locator('html')).toHaveAttribute('data-shape', shape);
        const findings = await page.evaluate(auditConcentric);
        found.push(
          ...findings
            .filter(({ part, holder }) => !PENDING.test(part) && !PENDING.test(holder))
            .map((finding) => ({ story: id, shape, ...finding })),
        );
      }
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
