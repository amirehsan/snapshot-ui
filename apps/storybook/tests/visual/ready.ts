import type { Page } from '@playwright/test';

interface PreviewWindow {
  __STORYBOOK_PREVIEW__?: { currentRender?: { phase?: string } };
}

/**
 * Resolves once Storybook has rendered the story and run its play function:
 * `completed`, or `finished` when the afterEach hooks have run too.
 * Rejects as soon as Storybook reports the render as errored, so a broken story
 * fails with a clear message instead of timing out.
 */
export const ready = async (page: Page): Promise<void> => {
  const settled = await page.waitForFunction(() => {
    const phase = (window as PreviewWindow).__STORYBOOK_PREVIEW__?.currentRender?.phase;
    return phase === 'completed' || phase === 'finished' || phase === 'errored' ? phase : false;
  });
  if ((await settled.jsonValue()) === 'errored') {
    throw new Error('Storybook reported the story render as errored');
  }
};
