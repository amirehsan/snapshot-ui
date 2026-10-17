import { afterEach, describe, expect, it, vi } from 'vitest';
import { holdMissedDrops } from './missed-drop';

/**
 * A drag event on `target` whose transfer holds these types. jsdom has no DragEvent and no DataTransfer, so the
 * event is a plain Event given a `dataTransfer`, which is all the hold reads.
 */
function drag(type: 'dragover' | 'drop', target: EventTarget, types: string[] = ['Files']): Event {
  const event = new Event(type, { bubbles: true, cancelable: true });
  Object.defineProperty(event, 'dataTransfer', { value: { types } });
  target.dispatchEvent(event);
  return event;
}

const releases: (() => void)[] = [];

afterEach(() => {
  for (const release of releases.splice(0)) release();
  document.body.replaceChildren();
  vi.restoreAllMocks();
});

const hold = (): (() => void) => {
  const release = holdMissedDrops();
  releases.push(release);
  return release;
};

describe('holdMissedDrops', () => {
  it('prevents a files dragover and drop on the document while held, and not after the last release', () => {
    const beside = document.body.appendChild(document.createElement('p'));
    expect(drag('drop', beside).defaultPrevented).toBe(false);
    const release = hold();
    expect(drag('dragover', beside).defaultPrevented).toBe(true);
    expect(drag('drop', beside).defaultPrevented).toBe(true);
    release();
    expect(drag('dragover', beside).defaultPrevented).toBe(false);
    expect(drag('drop', beside).defaultPrevented).toBe(false);
  });

  it('leaves a drop whose default is already prevented, a drop into an input or editable element, and a drag without files', () => {
    hold();
    const taken = document.body.appendChild(document.createElement('div'));
    const spy = vi.fn((event: Event) => {
      event.preventDefault();
    });
    taken.addEventListener('drop', spy);
    const prevented = vi.spyOn(Event.prototype, 'preventDefault');
    drag('drop', taken);
    // Prevented once, by the part that took it, and not again by the hold.
    expect(spy).toHaveBeenCalledTimes(1);
    expect(prevented).toHaveBeenCalledTimes(1);
    prevented.mockRestore();

    const field = document.body.appendChild(document.createElement('input'));
    expect(drag('drop', field).defaultPrevented).toBe(false);
    const picker = document.body.appendChild(document.createElement('input'));
    picker.type = 'file';
    expect(drag('drop', picker).defaultPrevented).toBe(false);
    const area = document.body.appendChild(document.createElement('textarea'));
    expect(drag('dragover', area).defaultPrevented).toBe(false);
    const editor = document.body.appendChild(document.createElement('div'));
    editor.setAttribute('contenteditable', 'true');
    const inside = editor.appendChild(document.createElement('span'));
    expect(drag('drop', inside).defaultPrevented).toBe(false);
    const plain = document.body.appendChild(document.createElement('p'));
    expect(drag('drop', plain, ['text/plain']).defaultPrevented).toBe(false);
  });

  it('adds one listener pair for two holders and removes it after both release', () => {
    const add = vi.spyOn(document, 'addEventListener');
    const remove = vi.spyOn(document, 'removeEventListener');
    const first = hold();
    const second = hold();
    expect(add.mock.calls.map(([type]) => type)).toEqual(['dragover', 'drop']);
    first();
    // Releasing twice does nothing the second time.
    first();
    expect(remove).not.toHaveBeenCalled();
    const beside = document.body.appendChild(document.createElement('p'));
    expect(drag('drop', beside).defaultPrevented).toBe(true);
    second();
    expect(remove.mock.calls.map(([type]) => type)).toEqual(['dragover', 'drop']);
  });
});
