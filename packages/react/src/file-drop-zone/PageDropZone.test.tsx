import { act, render, waitFor } from '@testing-library/react';
import type { ReactElement } from 'react';
import { renderToString } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import * as library from '../index';
import { expectNoA11yViolations } from '../../test/a11y';
import { PageDropZone } from './PageDropZone';

const modal = vi.hoisted(() => ({ open: false }));

vi.mock('../overlay/useOverlayStack', async (original) => ({
  ...(await original<typeof import('../overlay/useOverlayStack')>()),
  isAnotherModalOpen: () => modal.open,
}));

afterEach(() => {
  modal.open = false;
  vi.restoreAllMocks();
});

const pdf = (): File => new File(['%PDF'], 'invoice.pdf', { type: 'application/pdf' });

/**
 * A drag event of `type` on `target` whose transfer holds `files`, or text when given none. jsdom has no
 * DragEvent and no DataTransfer, so the event is a plain Event given a `dataTransfer` by defineProperty.
 */
function drag(type: string, target: EventTarget, files: File[] | 'text' = []): Event {
  const event = new Event(type, { bubbles: true, cancelable: true });
  const text = files === 'text';
  const held = text ? [] : files;
  Object.defineProperty(event, 'dataTransfer', {
    value: {
      types: text ? ['text/plain'] : ['Files'],
      items: held.map((file) => ({ kind: 'file', type: file.type, getAsFile: () => file })),
      files: held,
      effectAllowed: 'all',
      dropEffect: 'none',
    },
  });
  act(() => {
    target.dispatchEvent(event);
  });
  return event;
}

const overlay = (): Element | null => document.querySelector('.page-drop-zone');

const ZONE = (props: { isDisabled?: boolean; onFiles?: () => void } = {}): ReactElement => (
  <PageDropZone
    title="Drop files to upload"
    description="To Documents, 2026"
    acceptedFileTypes={['application/pdf']}
    allowsMultiple
    onFiles={props.onFiles ?? (() => undefined)}
    isDisabled={props.isDisabled}
  />
);

describe('PageDropZone', () => {
  it('is exported from the package', () => {
    expect(library.PageDropZone).toBe(PageDropZone);
  });

  it('renders nothing on the server and while idle', () => {
    expect(renderToString(<ZONE />)).toBe('');
    const { container } = render(<ZONE />);
    expect(container).toBeEmptyDOMElement();
  });

  it('shows the overlay on a dragenter holding Files, and not for text', () => {
    render(<ZONE />);
    drag('dragenter', document.body, 'text');
    expect(overlay()).toBeNull();
    drag('dragenter', document.body);
    const shown = overlay();
    expect(shown).toHaveAttribute('aria-hidden', 'true');
    expect(shown?.querySelector('.page-drop-zone-card .page-drop-zone-title')).toHaveTextContent(
      'Drop files to upload',
    );
    expect(shown?.querySelector('.page-drop-zone-description')).toHaveTextContent('To Documents, 2026');
    expect(shown?.querySelector('.page-drop-zone-icon svg')).not.toBeNull();
  });

  it('keeps it through child boundaries and hides it when the counter returns to zero', () => {
    render(
      <div>
        <p id="one">One</p>
        <p id="two">Two</p>
        <ZONE />
      </div>,
    );
    const [one, two] = [document.getElementById('one'), document.getElementById('two')];
    if (one === null || two === null) throw new Error('No targets');
    // Firefox's order across a boundary: the enter on the next element before the leave of the last.
    drag('dragenter', document.body);
    drag('dragenter', one);
    drag('dragleave', document.body);
    drag('dragenter', two);
    drag('dragleave', one);
    expect(overlay()).not.toBeNull();
    // The overlay drawn under the pointer takes the next enter, and the leave of the element under it follows.
    const drawn = overlay();
    if (drawn === null) throw new Error('No overlay');
    drag('dragenter', drawn);
    drag('dragleave', two);
    expect(overlay()).not.toBeNull();
    // Out of the window: the last leave.
    drag('dragleave', drawn);
    expect(overlay()).toBeNull();
  });

  it('hides it once a drop has been dispatched, and on dragend at once', async () => {
    render(<ZONE />);
    drag('dragenter', document.body);
    drag('dragenter', document.body);
    drag('drop', document.body);
    // Still drawn as the drop's own listeners run: a browser commits a state set in a listener before the next
    // listener, which would take the overlay away before its drop handler ran (spec correction 30).
    expect(overlay()).not.toBeNull();
    await waitFor(() => {
      expect(overlay()).toBeNull();
    });
    drag('dragenter', document.body);
    expect(overlay()).not.toBeNull();
    drag('dragend', document.body);
    expect(overlay()).toBeNull();
  });

  it('keeps a drag that enters again before the hide a drop scheduled', async () => {
    render(<ZONE />);
    drag('dragenter', document.body);
    drag('drop', document.body);
    drag('dragenter', document.body);
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(overlay()).not.toBeNull();
  });

  it('forgets an element removed under the drag, so the last leave still hides it', () => {
    render(
      <div>
        <p id="page">Page</p>
        <ZONE />
      </div>,
    );
    const toast = document.body.appendChild(document.createElement('div'));
    const page = document.getElementById('page');
    if (page === null) throw new Error('No page');
    drag('dragenter', toast);
    expect(overlay()).not.toBeNull();
    // A toast that leaves under the pointer never gets its dragleave.
    toast.remove();
    drag('dragenter', page);
    drag('dragleave', page);
    expect(overlay()).toBeNull();
  });

  it('hides it on a pointer move or press, which no drag sends, and not on a touch', () => {
    render(<ZONE />);
    const pointer = (type: string, pointerType: string): void => {
      const event = new Event(type, { bubbles: true });
      Object.defineProperty(event, 'pointerType', { value: pointerType });
      act(() => {
        document.body.dispatchEvent(event);
      });
    };
    drag('dragenter', document.body);
    pointer('pointerdown', 'touch');
    expect(overlay()).not.toBeNull();
    pointer('pointermove', 'mouse');
    expect(overlay()).toBeNull();
    drag('dragenter', document.body);
    expect(overlay()).not.toBeNull();
    pointer('pointerdown', 'pen');
    expect(overlay()).toBeNull();
    // The next drag starts afresh.
    drag('dragenter', document.body);
    expect(overlay()).not.toBeNull();
  });

  it('draws the overlay in the closest AppShell, with the scope of where the zone is mounted', () => {
    const { unmount } = render(
      <div className="app-shell" data-theme="dark">
        <header style={{ backdropFilter: 'blur(20px)' }}>
          <ZONE />
        </header>
      </div>,
    );
    drag('dragenter', document.body);
    const shown = overlay();
    expect(shown?.parentElement).toHaveClass('app-shell');
    expect(shown).toHaveAttribute('data-theme', 'dark');
    expect(shown).toHaveAttribute('dir', 'ltr');
    drag('dragend', document.body);
    unmount();
    // Outside a shell, in the body.
    render(<ZONE />);
    drag('dragenter', document.body);
    expect(overlay()?.parentElement).toBe(document.body);
  });

  it('takes a paste of files anywhere but a text field, through the same check', () => {
    const onFiles = vi.fn();
    render(
      <div>
        <p id="page">Page</p>
        <input aria-label="Notes" id="notes" />
        <input aria-label="Done" id="done" type="checkbox" />
        <ZONE onFiles={onFiles} />
      </div>,
    );
    const paste = (target: Element, files: File[]): Event => {
      const event = new Event('paste', { bubbles: true, cancelable: true });
      const items = files.map((file) => ({ kind: 'file', type: file.type, getAsFile: () => file }));
      Object.defineProperty(event, 'clipboardData', { value: { items, files, types: ['Files'] } });
      act(() => {
        target.dispatchEvent(event);
      });
      return event;
    };
    const [page, notes, done] = ['page', 'notes', 'done'].map((id) => {
      const element = document.getElementById(id);
      if (element === null) throw new Error(`No ${id}`);
      return element;
    }) as [HTMLElement, HTMLElement, HTMLElement];
    const file = pdf();
    const blank = new File([], 'blank.pdf', { type: 'application/pdf' });
    expect(paste(page, [file, blank]).defaultPrevented).toBe(true);
    expect(onFiles).toHaveBeenCalledWith([file], [{ file: blank, reason: 'empty' }]);
    expect(paste(done, [file]).defaultPrevented).toBe(true);
    expect(onFiles).toHaveBeenCalledTimes(2);
    // A text field takes its own paste, and a paste with no files is left alone.
    expect(paste(notes, [file]).defaultPrevented).toBe(false);
    expect(paste(page, []).defaultPrevented).toBe(false);
    modal.open = true;
    expect(paste(page, [file]).defaultPrevented).toBe(false);
    expect(onFiles).toHaveBeenCalledTimes(2);
  });

  it('runs the check on a drop on the overlay and reaches onFiles, then leaves', async () => {
    const onFiles = vi.fn();
    render(<ZONE onFiles={onFiles} />);
    drag('dragenter', document.body);
    const drawn = overlay();
    if (drawn === null) throw new Error('No overlay');
    const file = pdf();
    const blank = new File([], 'blank.pdf', { type: 'application/pdf' });
    const drop = drag('drop', drawn, [file, blank]);
    expect(drop.defaultPrevented).toBe(true);
    expect(onFiles).toHaveBeenCalledWith([file], [{ file: blank, reason: 'empty' }]);
    await waitFor(() => {
      expect(overlay()).toBeNull();
    });
  });

  it('stands down while a modal is open', () => {
    render(<ZONE />);
    modal.open = true;
    drag('dragenter', document.body);
    expect(overlay()).toBeNull();
  });

  it('warns once for a second page zone and leaves it idle until the first unmounts', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const first = vi.fn();
    const second = vi.fn();
    const { rerender } = render(
      <>
        <ZONE key="first" onFiles={first} />
        <ZONE key="second" onFiles={second} />
      </>,
    );
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn).toHaveBeenCalledWith(
      'PageDropZone: a page has one page drop zone; this one stays idle while another is mounted.',
    );
    drag('dragenter', document.body);
    expect(document.querySelectorAll('.page-drop-zone')).toHaveLength(1);
    drag('dragend', document.body);

    rerender(<ZONE key="second" onFiles={second} />);
    drag('dragenter', document.body);
    const drawn = overlay();
    if (drawn === null) throw new Error('No overlay');
    drag('drop', drawn, [pdf()]);
    expect(second).toHaveBeenCalledTimes(1);
    expect(first).not.toHaveBeenCalled();
    expect(warn).toHaveBeenCalledTimes(1);
  });

  it('removes its listeners on unmount', () => {
    const remove = vi.spyOn(document, 'removeEventListener');
    const { unmount } = render(<ZONE />);
    unmount();
    const removed = remove.mock.calls.map(([type]) => type);
    for (const type of ['dragenter', 'dragleave', 'drop', 'dragend', 'dragover', 'pointermove', 'paste']) {
      expect(removed, type).toContain(type);
    }
    drag('dragenter', document.body);
    expect(overlay()).toBeNull();
    // The page is the browser's again: a missed drop is no longer prevented.
    expect(drag('drop', document.body).defaultPrevented).toBe(false);
  });

  it('stays idle while disabled', () => {
    render(<ZONE isDisabled />);
    drag('dragenter', document.body);
    expect(overlay()).toBeNull();
    expect(drag('drop', document.body).defaultPrevented).toBe(false);
  });

  it('has no axe violations with the overlay shown', async () => {
    const { container } = render(
      <main>
        <h1>Documents</h1>
        <ZONE />
      </main>,
    );
    drag('dragenter', document.body);
    expect(overlay()).not.toBeNull();
    await expectNoA11yViolations(container);
    await expectNoA11yViolations(document.body);
  });
});
