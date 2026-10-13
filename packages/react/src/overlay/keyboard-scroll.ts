'use client';

/** Everything Tab can reach on its own. */
const TABBABLE = [
  'a[href]',
  'area[href]',
  'button:not(:disabled)',
  'input:not(:disabled):not([type="hidden"])',
  'select:not(:disabled)',
  'textarea:not(:disabled)',
  'iframe',
  'audio[controls]',
  'video[controls]',
  'summary',
  '[contenteditable]:not([contenteditable="false"])',
  '[tabindex]:not([tabindex^="-"])',
].join(', ');

/**
 * Makes the body a tab stop while it scrolls and holds nothing Tab reaches, and only then. A body with a
 * control in it is reached through the control, so a long form gains no extra stop before its first field.
 */
function markScrolling(body: HTMLElement): void {
  if (body.scrollHeight > body.clientHeight && body.querySelector(TABBABLE) === null) body.tabIndex = 0;
  else body.removeAttribute('tabindex');
}

/**
 * A ref for an overlay's scrolling body that keeps it a tab stop while it scrolls and holds nothing to focus,
 * so a keyboard can reach it and scroll its text. Chrome and Firefox do this for such a scroller and Safari
 * does not. The body, what it holds and changes to it are watched, so a body that comes to scroll, or stops,
 * follows. A stable module function, so React attaches it once; it returns its own cleanup.
 *
 * Dialog's and Drawer's bodies use it. Internal: not exported from the package.
 */
export function keyboardScroll(body: HTMLElement | null): (() => void) | undefined {
  if (!body) return undefined;
  markScrolling(body);
  if (typeof ResizeObserver === 'undefined') return undefined;
  const sizes = new ResizeObserver(() => {
    markScrolling(body);
  });
  const watch = (): void => {
    sizes.disconnect();
    sizes.observe(body);
    for (const child of body.children) sizes.observe(child);
    markScrolling(body);
  };
  const content = new MutationObserver(watch);
  watch();
  content.observe(body, { childList: true, subtree: true, characterData: true });
  return () => {
    sizes.disconnect();
    content.disconnect();
  };
}
