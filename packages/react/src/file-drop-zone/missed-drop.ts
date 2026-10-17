// No directive: a pure module, imported only by the client parts.
import { holdsFiles } from './accept';

/** How many mounted zones hold missed drops; the listeners are on the document while it is above zero. */
let holders = 0;

/** A target that takes a drop of its own: a text field, a native file input or editable content. */
function isEditable(target: EventTarget | null): boolean {
  if (typeof Element === 'undefined' || !(target instanceof Element)) return false;
  return target.closest('input, textarea, [contenteditable]:not([contenteditable="false"])') !== null;
}

/**
 * A files drag that lands beside every drop target: its default is prevented, so the browser never opens the
 * file in the tab and the reader keeps the page (ruling 4). A drop a part already took, a drop into an editable
 * element or a native file input, and a drag without files are left alone.
 */
function hold(event: DragEvent): void {
  if (event.defaultPrevented || !holdsFiles(event.dataTransfer) || isEditable(event.target)) return;
  event.preventDefault();
}

/**
 * Holds missed drops on the document while any zone is mounted: one listener pair however many zones hold, added
 * with the first and removed after the last releases. Called in an effect; returns the release, which does
 * nothing the second time.
 */
export function holdMissedDrops(): () => void {
  if (typeof document === 'undefined') return () => undefined;
  holders += 1;
  if (holders === 1) {
    document.addEventListener('dragover', hold);
    document.addEventListener('drop', hold);
  }
  let released = false;
  return () => {
    if (released) return;
    released = true;
    holders -= 1;
    if (holders === 0) {
      document.removeEventListener('dragover', hold);
      document.removeEventListener('drop', hold);
    }
  };
}
