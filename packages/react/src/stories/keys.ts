/*
 * Keys the browser acts on itself, shared by every story file. It is story code only and never ships: the build
 * starts from src/index.ts, which never imports this folder, tsconfig.build.json leaves it out, and the
 * 'use client' guard skips it.
 */

/**
 * Presses `keys` (user-event syntax, such as `{ArrowRight}`) as the real keyboard does, in a Vitest story run,
 * and resolves true; in Storybook's own UI it does nothing and resolves false. A key event a script dispatches is
 * untrusted, so the browser takes no default action for it: it never scrolls a focused box. Vitest's browser
 * mode sends the keys through the engine's own input, which does. `vitest/browser` is a module Vitest serves
 * only in its browser mode, so it is imported only there.
 */
export async function pressRealKeys(keys: string): Promise<boolean> {
  if (!(globalThis as { __vitest_browser__?: unknown }).__vitest_browser__) return false;
  // Untyped on purpose: the module's types declare its own matchers globally, which the unit tests' types refuse.
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion -- a literal would load those types
  const browser = (await import('vitest/browser' as string)) as {
    userEvent: { keyboard: (text: string) => Promise<void> };
  };
  await browser.userEvent.keyboard(keys);
  return true;
}
