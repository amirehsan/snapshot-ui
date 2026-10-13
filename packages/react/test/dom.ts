/*
 * DOM helpers the tests share. Test code only: the build starts from
 * src/index.ts and never reaches this folder.
 */

import { onTestFinished, vi } from 'vitest';

/** The element a render put first in its container: the component's root. */
export const root = (container: HTMLElement): Element => {
  const element = container.firstElementChild;
  if (!element) throw new Error('Nothing rendered');
  return element;
};

/** The form a render put in its container. */
export const formOf = (container: HTMLElement): HTMLFormElement => {
  const form = container.querySelector('form');
  if (!form) throw new Error('No form');
  return form;
};

/** The classes of a row's parts that carry one, in order. React Aria's visually hidden input has none. */
export const visibleParts = (row: Element): string[] =>
  [...row.children].map((child) => child.className).filter((name) => name !== '');

/**
 * Holds back every animation frame the page asks for from here to the end of the test, as on a loaded machine
 * whose next frame comes late. What a component does at once is then told apart from what waits for a frame,
 * as React Aria's focus restore after an overlay leaves does. The frames never run, and the test's end puts
 * `requestAnimationFrame` back.
 */
export function holdFrames(): void {
  const request = vi.spyOn(window, 'requestAnimationFrame').mockImplementation(() => 0);
  const cancel = vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => undefined);
  onTestFinished(() => {
    request.mockRestore();
    cancel.mockRestore();
  });
}
