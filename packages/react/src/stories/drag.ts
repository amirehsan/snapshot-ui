/*
 * How a play drags files, shared by the drop zones' stories. It is story code only and never ships: the build
 * starts from src/index.ts, which never imports this folder, tsconfig.build.json leaves it out, and the
 * 'use client' guard skips it. A test runner's pointer cannot drag a file from the desktop, so a play builds the
 * events itself, as the drop spike found each engine takes them (file-drop-zone/DropSpike.stories.tsx).
 */

/**
 * A `DataTransfer` holding `files`, as a drag from the desktop holds them. A transfer a script makes allows no
 * operation, and Chromium and WebKit ignore the setter outside a real drag, where a drag from another app allows
 * them all; React Aria cancels a drag that allows none, so the transfer is made to allow every one.
 */
export function filesTransfer(files: readonly File[]): DataTransfer {
  const data = new DataTransfer();
  for (const file of files) data.items.add(file);
  allowAll(data);
  return data;
}

/** A transfer holding text only, as a drag of a link, a selection or a row does, or a copied list pasted. */
export function textTransfer(text = 'Not a file'): DataTransfer {
  const data = new DataTransfer();
  data.setData('text/plain', text);
  allowAll(data);
  return data;
}

function allowAll(data: DataTransfer): void {
  data.effectAllowed = 'all';
  if ((data.effectAllowed as string) !== 'all')
    Object.defineProperty(data, 'effectAllowed', { value: 'all' });
}

/**
 * Dispatches a bubbling, cancelable drag event of `type` on `target` holding `data`, through `DragEvent`'s
 * constructor where the engine keeps the transfer there, else with the transfer defined on the event, and
 * returns whether its default was prevented.
 */
export function fireDrag(target: EventTarget, type: string, data: DataTransfer): boolean {
  const init = { bubbles: true, cancelable: true, composed: true, clientX: 10, clientY: 10 };
  let event: Event | null = null;
  if (typeof DragEvent === 'function') {
    const made = new DragEvent(type, { ...init, dataTransfer: data });
    if (made.dataTransfer === data) event = made;
  }
  if (event === null) {
    event = new MouseEvent(type, init);
    Object.defineProperty(event, 'dataTransfer', { value: data });
  }
  target.dispatchEvent(event);
  return event.defaultPrevented;
}

/** A files drag entering `target` and moving over it, as the pointer brings one in. */
export function dragOver(target: EventTarget, data: DataTransfer): void {
  fireDrag(target, 'dragenter', data);
  fireDrag(target, 'dragover', data);
}

/** A drag entering, moving over and dropped on `target`; returns whether the drop's default was prevented. */
export function dropOn(target: EventTarget, data: DataTransfer): boolean {
  dragOver(target, data);
  return fireDrag(target, 'drop', data);
}

/**
 * Dispatches a paste holding `data` on `target`, through `ClipboardEvent`'s constructor where the engine keeps
 * the data there, else defined on the event, and returns whether its default was prevented.
 */
export function firePaste(target: EventTarget, data: DataTransfer): boolean {
  const init = { bubbles: true, cancelable: true, composed: true };
  let event: Event;
  if (typeof ClipboardEvent === 'function') {
    event = new ClipboardEvent('paste', { ...init, clipboardData: data });
    if ((event as ClipboardEvent).clipboardData !== data) {
      Object.defineProperty(event, 'clipboardData', { value: data });
    }
  } else {
    event = new Event('paste', init);
    Object.defineProperty(event, 'clipboardData', { value: data });
  }
  target.dispatchEvent(event);
  return event.defaultPrevented;
}

export const pdf = (name = 'invoice.pdf'): File => new File(['%PDF-1.7'], name, { type: 'application/pdf' });
export const png = (name = 'receipt.png'): File => new File(['PNG'], name, { type: 'image/png' });
export const exe = (name = 'setup.exe'): File => new File(['MZ'], name, { type: 'application/x-msdownload' });
export const blank = (name = 'blank.pdf'): File => new File([], name, { type: 'application/pdf' });
