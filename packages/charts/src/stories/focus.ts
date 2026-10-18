/*
 * How a play puts focus where its keys start, shared by every story file. It is story code only and never
 * ships: the build starts from src/index.ts, which never imports this folder, tsconfig.build.json leaves it
 * out, and the 'use client' guard skips it. Copied from the react package's, since neither package's stories
 * import the other.
 */
import { expect, waitFor } from 'storybook/test';

/**
 * Focuses `element` directly and waits until it holds focus, for a play whose story is about the keys that
 * follow, not about how focus got there. On a busy runner Firefox can let a focus() made soon after a story
 * draws go unheard, leaving focus on the page's body, so the poll asks again while focus is elsewhere; once
 * the element has focus, asking again does nothing. A play that checks a press or Tab moving focus does not
 * use this: it makes that move itself and waits for its result.
 */
export async function focusOn(element: HTMLElement): Promise<void> {
  await waitFor(() => {
    if (element.ownerDocument.activeElement !== element) element.focus();
    return expect(element).toHaveFocus();
  });
}
