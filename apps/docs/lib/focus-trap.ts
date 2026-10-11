/**
 * Keeps Tab and Shift+Tab inside the modal element matching `selector`. Everything
 * behind a modal is inert, so Tab would otherwise leave the page for the browser's own
 * controls: this wraps at both ends, and pulls focus back in if it has already escaped.
 * Call it from a keydown handler, for the Tab key.
 */
export function wrapTab(event: KeyboardEvent, selector: string): void {
  const stops = [
    ...document.querySelectorAll<HTMLElement>(`${selector} a[href], ${selector} button:not([disabled])`),
  ];
  const first = stops[0];
  const last = stops.at(-1);
  if (!first || !last) return;
  const active = document.activeElement;
  const inside = active instanceof HTMLElement && active.closest(selector) !== null;
  if (!inside || (event.shiftKey && active === first) || (!event.shiftKey && active === last)) {
    event.preventDefault();
    (event.shiftKey ? last : first).focus();
  }
}
