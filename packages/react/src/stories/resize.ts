/*
 * How a play resizes the browser, as a tablet turning does, shared by every story file. It is story code only and
 * never ships: the build starts from src/index.ts, which never imports this folder, tsconfig.build.json leaves it
 * out, and the 'use client' guard skips it.
 */

/**
 * Resizes the browser's viewport to `width` by `height` in a Vitest story run, as the Storybook Vitest addon sizes
 * it before a story renders, and resolves true; in Storybook's own UI, where a play cannot resize the window, it
 * does nothing and resolves false. `vitest/browser` is a module Vitest serves only in its browser mode, so it is
 * imported only there.
 */
export async function resizeViewport(width: number, height: number): Promise<boolean> {
  if (!(globalThis as { __vitest_browser__?: unknown }).__vitest_browser__) return false;
  // Untyped on purpose: the module's types declare its own matchers globally, which the unit tests' types refuse.
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion -- a literal would load those types
  const browser = (await import('vitest/browser' as string)) as {
    page: { viewport: (width: number, height: number) => Promise<void> };
  };
  await browser.page.viewport(width, height);
  return true;
}
