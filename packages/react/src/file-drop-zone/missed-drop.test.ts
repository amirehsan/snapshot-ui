import { afterEach, describe, expect, it, vi } from 'vitest';
import { holdMissedDrops } from './missed-drop';

/**
 * A drag event on `target` whose transfer holds these types. jsdom has no DragEvent and no DataTransfer, so the
 * event is a plain Event given a `dataTransfer`, which is all the hold reads.
 */
function drag(type: 'dragover' | 'drop', target: EventTarget, types: string[] = ['Files']): Event {
  const event = new Event(type, { bubbles: true, cancelable: true });
  Object.defineProperty(event, 'dataTransfer', { value: { types, dropEffect: 'copy' } });
  target.dispatchEvent(event);
  return event;
}

const effectOf = (event: Event): unknown =>
  (event as unknown as { dataTransfer: DataTransfer }).dataTransfer.dropEffect;

/** An element of `tag` added to the body, with `attributes`. */
function add(tag: string, attributes: Record<string, string> = {}): HTMLElement {
  const element = document.body.appendChild(document.createElement(tag));
  for (const [name, value] of Object.entries(attributes)) element.setAttribute(name, value);
  return element;
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
    const over = drag('dragover', beside);
    expect(over.defaultPrevented).toBe(true);
    // The pointer says no drop.
    expect(effectOf(over)).toBe('none');
    expect(drag('drop', beside).defaultPrevented).toBe(true);
    release();
    expect(drag('dragover', beside).defaultPrevented).toBe(false);
    expect(drag('drop', beside).defaultPrevented).toBe(false);
  });

  it('leaves a drop whose default is already prevented, a file input, and a drag without files', () => {
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

    const picker = add('input', { type: 'file' });
    expect(drag('dragover', picker).defaultPrevented).toBe(false);
    expect(drag('drop', picker).defaultPrevented).toBe(false);
    const plain = add('p');
    expect(drag('drop', plain, ['text/plain']).defaultPrevented).toBe(false);
  });

  const TEXT_ENTRIES: [name: string, make: () => Element][] = [
    ['a text field', () => add('input')],
    ['a search field', () => add('input', { type: 'search' })],
    ['a text area', () => add('textarea')],
    [
      'editable content',
      () => add('div', { contenteditable: 'true' }).appendChild(document.createElement('span')),
    ],
  ];

  it.each(TEXT_ENTRIES)(
    'holds a drag of files alone on %s, and leaves one that also holds text',
    (_name, make) => {
      hold();
      const target = make();
      // Files alone would open the first file in the tab and lose the form.
      expect(drag('dragover', target).defaultPrevented).toBe(true);
      expect(drag('drop', target).defaultPrevented).toBe(true);
      // A link or a selection with its files is the field's to insert.
      expect(drag('drop', target, ['Files', 'text/plain']).defaultPrevented).toBe(false);
      expect(drag('dragover', target, ['Files', 'text/uri-list']).defaultPrevented).toBe(false);
    },
  );

  it.each(['checkbox', 'radio', 'range'])('holds a drop on a %s, even with text', (type) => {
    hold();
    const control = add('input', { type });
    expect(drag('drop', control).defaultPrevented).toBe(true);
    expect(drag('drop', control, ['Files', 'text/plain']).defaultPrevented).toBe(true);
  });

  it('leaves editable content with contenteditable="false" to its holder', () => {
    hold();
    const off = add('div', { contenteditable: 'false' });
    expect(drag('drop', off, ['Files', 'text/plain']).defaultPrevented).toBe(true);
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
