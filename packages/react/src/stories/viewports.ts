/*
 * The two screens the shell's stories are shot at, shared by every story file that sets a viewport. It is story
 * code only and never ships: the build starts from src/index.ts, which never imports this folder,
 * tsconfig.build.json leaves it out, and the 'use client' guard skips it.
 *
 * The Storybook Vitest addon sizes the browser from `parameters.viewport.options` and `globals.viewport.value`
 * before a story renders, so a phone play really runs at 375px; with no viewport it uses 1200 by 900. The story
 * setup rests the pointer on a pad in the viewport's corner before that resize, so the pad's earlier point must
 * fall outside the next frame: 375 by 812 and 1280 by 800 keep it out whichever comes first.
 */

/** A story's `parameters.viewport.options`. */
export const VIEWPORT_OPTIONS = {
  phone: { name: 'Phone', styles: { width: '375px', height: '812px' } },
  desktop: { name: 'Desktop', styles: { width: '1280px', height: '800px' } },
} as const;

/** A story's `globals` for the phone, 375 by 812. */
export const PHONE = { viewport: { value: 'phone' } } as const;

/** A story's `globals` for the desktop, 1280 by 800. */
export const DESKTOP = { viewport: { value: 'desktop' } } as const;
