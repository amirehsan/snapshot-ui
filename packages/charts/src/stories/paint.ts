/*
 * What the stories read back from the page, shared by every story file. It is
 * story code only and never ships: the build starts from src/index.ts, which
 * never imports this folder, tsconfig.build.json leaves it out, and the
 * 'use client' guard skips it. Copied from the react package's, as far as the
 * charts need it.
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

/** A length token in pixels, read on the root, where the toolbar's data-shape applies. */
export function tokenPixels(name: string): number {
  return parseFloat(getComputedStyle(document.documentElement).getPropertyValue(name));
}
