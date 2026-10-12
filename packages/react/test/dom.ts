/*
 * DOM helpers the tests share. Test code only: the build starts from
 * src/index.ts and never reaches this folder.
 */

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
