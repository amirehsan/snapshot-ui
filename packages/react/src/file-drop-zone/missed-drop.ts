// No directive: a pure module, imported only by the client parts.
import { holdsFiles } from './accept';

/** How many mounted zones hold missed drops; the listeners are on the document while it is above zero. */
let holders = 0;

/** The input types that take no typed text: a file dropped on one has nowhere to go but the tab. */
const NOT_TEXT = new Set([
  'button',
  'checkbox',
  'color',
  'file',
  'hidden',
  'image',
  'radio',
  'range',
  'reset',
  'submit',
]);

function elementOf(target: EventTarget | null): Element | null {
  if (typeof Element === 'undefined' || !(target instanceof Element)) return null;
  return target;
}

/** Whether `target` is a native file input, which takes a dropped file itself. */
function isFileInput(target: EventTarget | null): boolean {
  const element = elementOf(target);
  return element?.tagName === 'INPUT' && (element as HTMLInputElement).type === 'file';
}

/**
 * Whether `target` takes typed text: a text field, a text area or editable content. A checkbox, a radio, a range
 * and a button take none.
 */
export function isTextEntry(target: EventTarget | null): boolean {
  const field = elementOf(target)?.closest(
    'input, textarea, [contenteditable]:not([contenteditable="false"])',
  );
  if (field == null) return false;
  if (field.tagName === 'INPUT') return !NOT_TEXT.has((field as HTMLInputElement).type);
  return true;
}

/**
 * Whether the drop's target takes it itself: a native file input always, and a text field or editable content
 * only when the drag also holds text, a link or a selection, which it inserts. A drag of files alone onto a text
 * field would open the first file in the tab and lose the form, so it is held; an editor that takes files
 * prevents the default itself, and a drop already prevented is never touched.
 */
function takesDrop(event: DragEvent): boolean {
  if (isFileInput(event.target)) return true;
  const types = Array.from(event.dataTransfer?.types ?? []);
  return isTextEntry(event.target) && (types.includes('text/plain') || types.includes('text/uri-list'));
}

/**
 * A files drag that lands beside every drop target: its default is prevented, so the browser never opens the
 * file in the tab and the reader keeps the page (ruling 4), and its `dragover` says no drop, so the pointer shows
 * it. A drop a part already took, a drop a target takes itself (`takesDrop`) and a drag without files are left
 * alone.
 */
function hold(event: DragEvent): void {
  if (event.defaultPrevented || !holdsFiles(event.dataTransfer) || takesDrop(event)) return;
  event.preventDefault();
  if (event.type === 'dragover' && event.dataTransfer != null) event.dataTransfer.dropEffect = 'none';
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
