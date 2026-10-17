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
          await page.goto(
            `/iframe.html?id=${id}&viewMode=story&globals=theme:light;shape:${shape};a11y.manual:!true`,
          );
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

/**
 * A 24px holder padded 8px inside a 1px edge, holding a 40px button 20px round. Where the button sits, and
 * its corners, are the only things that change between the cases.
 */
const holderWith = (button: string): string => `
  <div style="position: relative; width: 320px; height: 58px; box-sizing: border-box; border: 1px solid; border-radius: 24px; padding: 8px">
    <button style="position: absolute; top: 8px; height: 40px; width: 96px; border: 0; background: #ccc; border-radius: 20px; ${button}"></button>
  </div>`;

test.describe('the audit itself', () => {
  test('fails a control given one smaller corner inside a corner curve', async ({ page }) => {
    await page.setContent(
      holderWith('right: 8px; border-top-right-radius: 15px; border-bottom-right-radius: 15px;'),
    );
    const findings = await page.evaluate(auditConcentric);
    expect(findings.map(({ rule }) => rule)).toContain('one corner');
  });

  test('fails a control that keeps its shape but stays inside a corner curve', async ({ page }) => {
    await page.setContent(holderWith('right: 8px;'));
    const findings = await page.evaluate(auditConcentric);
    expect(findings.map(({ rule, expected }) => [rule, expected])).toContainEqual(['concentric', 15]);
  });

  test('accepts a control moved out of the corner, to the radius less the edge', async ({ page }) => {
    await page.setContent(holderWith('right: 23px;'));
    expect(await page.evaluate(auditConcentric)).toEqual([]);
  });

  test('accepts a row that fills the holder concentric with it', async ({ page }) => {
    await page.setContent(holderWith('left: 8px; right: 8px; width: auto; border-radius: 15px;'));
    expect(await page.evaluate(auditConcentric)).toEqual([]);
  });
});
