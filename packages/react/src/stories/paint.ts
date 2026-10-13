/*
 * What the stories read back from the page, shared by every story file. It is
 * story code only and never ships: the build starts from src/index.ts, which
 * never imports this folder, tsconfig.build.json leaves it out, and the
 * 'use client' guard skips it.
 */

/** The color a CSS value paints, read by painting a probe inside `scope`, so the scope's theme applies. */
export function paint(value: string, scope: Element = document.body): string {
  const probe = document.createElement('span');
  probe.style.color = value;
  scope.append(probe);
  const { color } = getComputedStyle(probe);
  probe.remove();
  return color;
}

/** The color a token paints inside `scope`. */
export function tokenColor(name: string, scope: Element = document.body): string {
  return paint(`var(${name})`, scope);
}

/** The color of the 5% wash of ink a control takes under the pointer, read inside `scope`. */
export function washColor(scope: Element = document.body): string {
  const probe = document.createElement('span');
  probe.style.backgroundColor = 'color-mix(in srgb, var(--color-ink) 5%, transparent)';
  scope.append(probe);
  const { backgroundColor } = getComputedStyle(probe);
  probe.remove();
  return backgroundColor;
}

/** A length token in pixels, read on the root, where the toolbar's data-shape applies. */
export function tokenPixels(name: string): number {
  return parseFloat(getComputedStyle(document.documentElement).getPropertyValue(name));
}

/** The y of the middle of an element's box. */
export function middleOf(element: Element): number {
  const { top, height } = element.getBoundingClientRect();
  return top + height / 2;
}

/** How many lines of text `text` draws, from its height and its line height. It must have no padding. */
export function lineCount(text: Element): number {
  return Math.round(text.getBoundingClientRect().height / parseFloat(getComputedStyle(text).lineHeight));
}

/**
 * The px from the middle of the first line of `text` to the middle of `control`, positive when the control
 * is lower. The first line box starts at the top of the text's content box and is one line height tall,
 * which is what the stylesheet aligns to and does not depend on the font that draws the glyphs.
 */
export function firstLineOffset(control: Element, text: Element): number {
  const style = getComputedStyle(text);
  const top =
    text.getBoundingClientRect().top + parseFloat(style.borderTopWidth) + parseFloat(style.paddingTop);
  return middleOf(control) - (top + parseFloat(style.lineHeight) / 2);
}
