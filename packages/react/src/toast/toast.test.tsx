import { act, fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Profiler, StrictMode } from 'react';
import { hydrateRoot, type Root } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { expectNoA11yViolations } from '../../test/a11y';
import { Dialog } from '../dialog';
import * as library from '../index';
import { toast, type ToastOptions, type ToastTone } from './toast';
import { ToastRegion } from './ToastRegion';

/** What a live region is, to a screen reader: an aria-live attribute or one of the live roles. */
const LIVE = '[aria-live], [role="status"], [role="alert"], [role="log"], [role="marquee"], [role="timer"]';

/** Shows a toast inside act, as a press in an app would, and returns its id. */
function show(options: ToastOptions): string {
  let id = '';
  act(() => {
    id = toast(options);
  });
  return id;
}

/** Moves the fake clock on by `ms`, running every timer that falls due. */
function advance(ms: number): void {
  act(() => {
    vi.advanceTimersByTime(ms);
  });
}

/** Lets the microtasks a commit queued run, as they do before any timer in a browser. */
async function settle(): Promise<void> {
  await act(async () => {
    await Promise.resolve();
  });
}

/** The toasts on the page, newest first, as React Aria lists them. */
const toasts = (): HTMLElement[] => screen.queryAllByRole('alertdialog');

/** The region React Aria portals to the body, which holds the list. */
function region(): HTMLElement {
  const element = document.querySelector<HTMLElement>('.toast-region');
  if (!element) throw new Error('No toast region');
  return element;
}

/** The polite status host ToastRegion renders in place. */
const host = (): HTMLElement => screen.getByRole('status');

/**
 * A user-event on the real clock. Testing Library waits on a real timer between its steps and only moves a
 * fake clock it knows, Jest's, so a test that presses or types runs on real timers; none of them reads time.
 */
function user(): ReturnType<typeof userEvent.setup> {
  vi.useRealTimers();
  return userEvent.setup();
}

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: false });
});

afterEach(() => {
  // The queue is a module singleton, so each test leaves it empty for the next.
  act(() => {
    toast.clear();
  });
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('toast', () => {
  it('returns a string id and shows an alert dialog named by its title, carrying its tone', () => {
    render(<ToastRegion />);
    const id = show({ title: 'Saved', tone: 'success' });
    expect(typeof id).toBe('string');
    expect(id).not.toBe('');
    const shown = screen.getByRole('alertdialog', { name: 'Saved' });
    expect(shown).toHaveClass('toast');
    expect(shown).toHaveAttribute('data-tone', 'success');
    // React Aria's non-modal alert dialog, which Tab reaches.
    expect(shown).toHaveAttribute('aria-modal', 'false');
    expect(shown).toHaveAttribute('tabindex', '0');
    expect(shown.querySelector('.toast-title')).toHaveTextContent('Saved');
  });

  it('is described by its description, a second line, and draws no description without one', () => {
    render(<ToastRegion />);
    show({ title: 'Saved', description: 'Your changes are live.', tone: 'success' });
    const described = screen.getByRole('alertdialog', { name: 'Saved' });
    expect(described.querySelector('.toast-description')).toHaveTextContent('Your changes are live.');
    expect(described).toHaveAccessibleDescription('Your changes are live.');

    show({ title: 'Synced', tone: 'info' });
    const plain = screen.getByRole('alertdialog', { name: 'Synced' });
    expect(plain.querySelector('.toast-description')).not.toBeInTheDocument();
    // React Aria's slot id resolves to nothing when no description renders, so nothing points at a missing id.
    expect(plain).not.toHaveAttribute('aria-describedby');
    expect(plain).toHaveAccessibleDescription('');
  });

  it.each<ToastTone>(['success', 'info', 'warning'])(
    'closes a %s toast after 6 seconds and not before',
    (tone) => {
      render(<ToastRegion />);
      show({ title: 'Noted', tone });
      advance(5999);
      expect(toasts()).toHaveLength(1);
      advance(1);
      expect(toasts()).toHaveLength(0);
    },
  );

  it('keeps an error for 12 seconds', () => {
    render(<ToastRegion />);
    show({ title: 'The import failed', tone: 'error' });
    advance(11999);
    expect(toasts()).toHaveLength(1);
    advance(1);
    expect(toasts()).toHaveLength(0);
  });

  it('keeps a toast with an action until it is used or dismissed', () => {
    render(<ToastRegion />);
    show({ title: 'Row removed', tone: 'success', action: { label: 'Undo', onAction: () => undefined } });
    advance(60000);
    expect(toasts()).toHaveLength(1);
  });

  it('takes a timeout in milliseconds, and null for never', () => {
    render(<ToastRegion />);
    show({ title: 'Copied', tone: 'info', timeout: 2000 });
    advance(1999);
    expect(toasts()).toHaveLength(1);
    advance(1);
    expect(toasts()).toHaveLength(0);

    show({ title: 'Read me', tone: 'error', timeout: null });
    advance(600000);
    expect(toasts()).toHaveLength(1);

    // Zero or less stays as well: React Aria starts no timer for it.
    show({ title: 'Read me too', tone: 'info', timeout: 0 });
    advance(600000);
    expect(toasts()).toHaveLength(2);
  });

  it('closes one toast by its id with toast.dismiss, and calls its onClose', () => {
    render(<ToastRegion />);
    const onClose = vi.fn();
    const other = vi.fn();
    const id = show({ title: 'Saved', tone: 'success', timeout: null, onClose });
    show({ title: 'Synced', tone: 'info', timeout: null, onClose: other });
    act(() => {
      toast.dismiss(id);
    });
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(other).not.toHaveBeenCalled();
    expect(toasts().map((each) => each.getAttribute('data-tone'))).toEqual(['info']);
  });

  it('drops every toast with toast.clear, the ones waiting unseen included, and calls each onClose', () => {
    render(<ToastRegion />);
    const onClose = vi.fn();
    for (const title of ['One', 'Two', 'Three', 'Four'])
      show({ title, tone: 'info', timeout: null, onClose });
    expect(toasts()).toHaveLength(3);
    act(() => {
      toast.clear();
    });
    expect(onClose).toHaveBeenCalledTimes(4);
    expect(toasts()).toHaveLength(0);
  });

  it('shows at most three, newest first, and the oldest waits until one leaves', () => {
    render(<ToastRegion />);
    const ids = ['One', 'Two', 'Three', 'Four'].map((title) => show({ title, tone: 'info', timeout: null }));
    const names = (): string[] =>
      toasts().map((each) => each.querySelector('.toast-title')?.textContent ?? '');
    // React Aria lists the newest first; the stylesheet reverses the column, so it sits nearest the corner.
    expect(names()).toEqual(['Four', 'Three', 'Two']);
    act(() => {
      toast.dismiss(ids[2] ?? '');
    });
    expect(names()).toEqual(['Four', 'Two', 'One']);
  });

  it('announces a polite toast through the status host, the one live element on the page', () => {
    render(<ToastRegion />);
    show({ title: 'Saved', description: 'Your changes are live.', tone: 'success' });
    // The title and the second line are two blocks, so a screen reader pauses between them.
    const said = [...(host().firstElementChild?.children ?? [])].map((each) => each.textContent);
    expect(said).toEqual(['Saved', 'Your changes are live.']);
    expect(host()).toHaveAttribute('aria-live', 'polite');
    expect(host()).toHaveAttribute('aria-atomic', 'true');
    // The toast's own content is a group and not a second live region, so nothing is read twice.
    expect([...document.body.querySelectorAll(LIVE)]).toEqual([host()]);
    const content = screen.getByRole('alertdialog').querySelector('.toast-content');
    expect(content).toHaveAttribute('role', 'group');
  });

  it('leaves an error to its own alert, the one live element in the region, and keeps it out of the host', () => {
    render(<ToastRegion />);
    show({ title: 'The import failed', description: 'Choose a CSV file.', tone: 'error' });
    expect(host()).not.toHaveTextContent('The import failed');
    const content = screen.getByRole('alertdialog').querySelector('.toast-content');
    expect(content).toHaveAttribute('role', 'alert');
    expect([...region().querySelectorAll(LIVE)]).toEqual([content]);
    expect([...document.body.querySelectorAll(LIVE)]).toEqual([host(), content]);
  });

  it('writes each polite toast into a new node, so the same words twice are announced twice', () => {
    render(<ToastRegion />);
    show({ title: 'Saved', tone: 'success' });
    const first = host().firstElementChild;
    expect(first).toHaveTextContent('Saved');
    show({ title: 'Saved', tone: 'success' });
    const second = host().firstElementChild;
    expect(second).toHaveTextContent('Saved');
    expect(second).not.toBe(first);
    expect(first?.isConnected).toBe(false);
    // Only the latest: the host never reads the older toasts again.
    expect(host()).toHaveTextContent(/^Saved$/);
  });

  it('dismisses with a 40px icon button named Dismiss, or the dismissLabel given', async () => {
    const pointer = user();
    const { unmount } = render(<ToastRegion />);
    show({ title: 'Saved', tone: 'success' });
    const dismiss = within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Dismiss' });
    expect(dismiss).toHaveClass('icon-button');
    expect(dismiss.querySelector('svg')).toBeInTheDocument();
    expect(dismiss.closest('.toast-controls')).toBeInTheDocument();
    await pointer.click(dismiss);
    expect(toasts()).toHaveLength(0);
    unmount();

    render(<ToastRegion dismissLabel="Close the notice" />);
    show({ title: 'Saved', tone: 'success' });
    expect(
      within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Close the notice' }),
    ).toHaveClass('icon-button');
  });

  it('runs an action once from a secondary button and then closes the toast', async () => {
    const pointer = user();
    render(<ToastRegion />);
    const onAction = vi.fn();
    const onClose = vi.fn();
    show({ title: 'Row removed', tone: 'success', action: { label: 'Undo', onAction }, onClose });
    const undo = within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Undo' });
    expect(undo).toHaveClass('button', 'button-secondary');
    // The action sits before the dismiss, at the end of the toast.
    expect(undo.nextElementSibling).toHaveClass('icon-button');
    await pointer.click(undo);
    expect(onAction).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(toasts()).toHaveLength(0);
  });
});

describe('ToastRegion', () => {
  it('keeps the region and the status host out of a modal hide, and classes the region as an overlay', () => {
    const { container } = render(<ToastRegion />);
    // The host is in place, where the region is mounted, before any toast.
    expect(container.querySelector('.toast-status-host')).toBe(host());
    expect(host()).toHaveAttribute('data-react-aria-top-layer', 'true');
    expect(host()).toBeEmptyDOMElement();
    show({ title: 'Saved', tone: 'success' });
    expect(region()).toHaveAttribute('data-react-aria-top-layer');
    expect(region()).toHaveClass('overlay', 'toast-region');
    expect(region()).toHaveAttribute('role', 'region');
    expect(region().parentElement).toBe(document.body);
    expect(region().querySelector('ol')).toHaveClass('toast-list');
  });

  it('names the region with aria-label, in place of React Aria’s', () => {
    render(<ToastRegion aria-label="Alerts" />);
    show({ title: 'Saved', tone: 'success' });
    expect(screen.getByRole('region', { name: 'Alerts' })).toBe(region());
  });

  it('puts className on the region, after its own classes', () => {
    render(<ToastRegion className="app-toasts" />);
    show({ title: 'Saved', tone: 'success' });
    expect(region().className).toBe('overlay toast-region app-toasts');
  });

  it('shows maxVisibleToasts at once', () => {
    render(<ToastRegion maxVisibleToasts={1} />);
    show({ title: 'One', tone: 'info' });
    show({ title: 'Two', tone: 'info' });
    expect(toasts()).toHaveLength(1);
    expect(screen.getByRole('alertdialog', { name: 'Two' })).toBeInTheDocument();
  });

  it('warns once when a toast is called with no region mounted, and shows it when one mounts', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    show({ title: 'Saved', tone: 'success' });
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0]?.[0]).toContain('<ToastRegion />');
    show({ title: 'Synced', tone: 'info' });
    expect(warn).toHaveBeenCalledTimes(1);
    expect(toasts()).toHaveLength(0);
    render(<ToastRegion />);
    expect(toasts()).toHaveLength(2);
  });

  it('pauses every timer while the pointer is over the region, and resumes when it leaves', () => {
    render(<ToastRegion />);
    show({ title: 'Saved', tone: 'success' });
    advance(1000);
    // The pointer events a mouse sends crossing into the region and out of it, on the fake clock.
    fireEvent.pointerOver(region(), { pointerType: 'mouse' });
    advance(10000);
    expect(toasts()).toHaveLength(1);
    fireEvent.pointerOut(region(), { pointerType: 'mouse' });
    advance(4999);
    expect(toasts()).toHaveLength(1);
    advance(1);
    expect(toasts()).toHaveLength(0);
  });

  it('pauses every timer while focus is inside the region, and resumes when it leaves', () => {
    render(<ToastRegion />);
    show({ title: 'Saved', tone: 'success' });
    advance(1000);
    const dismiss = within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Dismiss' });
    act(() => {
      dismiss.focus();
    });
    advance(10000);
    expect(toasts()).toHaveLength(1);
    act(() => {
      dismiss.blur();
    });
    advance(4999);
    expect(toasts()).toHaveLength(1);
    advance(1);
    expect(toasts()).toHaveLength(0);
  });

  it('announces a toast raised while a dialog is open, and a press on it leaves the dialog open', async () => {
    const pointer = user();
    const { container } = render(
      <>
        <div>
          <main>The page</main>
          <ToastRegion />
        </div>
        <Dialog defaultOpen title="Rename the workspace" />
      </>,
    );
    show({ title: 'Saved', tone: 'success' });
    // The dialog hides the page from assistive technology: the hide pass ran, and it walked around the status
    // host, which sits beside the hidden page and still holds the toast's words.
    const HIDDEN = '[aria-hidden="true"], [inert]';
    expect(container.querySelector('main')?.closest(HIDDEN)).not.toBeNull();
    expect(host().closest(HIDDEN)).toBeNull();
    expect(host()).toHaveTextContent('Saved');
    // The portaled region stays out of the hide too.
    expect(region().closest(HIDDEN)).toBeNull();
    expect(screen.getByRole('alertdialog', { name: 'Saved' })).toBeInTheDocument();
    await pointer.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Dismiss' }));
    expect(toasts()).toHaveLength(0);
    expect(screen.getByRole('dialog', { name: 'Rename the workspace' })).toBeInTheDocument();
  });

  it('hands focus to the neighbor when a focused toast is dismissed from the keyboard', async () => {
    const keys = user();
    render(<ToastRegion />);
    show({ title: 'Older', tone: 'info', timeout: null });
    show({ title: 'Newer', tone: 'info', timeout: null });
    const older = screen.getByRole('alertdialog', { name: 'Older' });
    act(() => {
      within(older).getByRole('button', { name: 'Dismiss' }).focus();
    });
    await keys.keyboard('{Enter}');
    expect(older).not.toBeInTheDocument();
    const newer = screen.getByRole('alertdialog', { name: 'Newer' });
    expect(newer.contains(document.activeElement)).toBe(true);
  });

  it.each([
    ['the pointer', (): void => void fireEvent.pointerOver(region(), { pointerType: 'mouse' })],
    [
      'focus',
      (): void => {
        act(() => {
          within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Dismiss' }).focus();
        });
      },
    ],
  ])('holds a toast that arrives while %s is in the region', async (_name, enter) => {
    render(<ToastRegion />);
    show({ title: 'Older', tone: 'info' });
    advance(1000);
    enter();
    // The newer toast starts its own timer as it mounts, after React Aria paused the rest.
    show({ title: 'Newer', tone: 'info' });
    await settle();
    advance(10000);
    expect(toasts()).toHaveLength(2);
  });

  it.each([
    ['the pointer', (): void => void fireEvent.pointerOver(region(), { pointerType: 'mouse' })],
    [
      'focus',
      (): void => {
        act(() => {
          within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Dismiss' }).focus();
        });
      },
    ],
  ])('holds a toast that arrives while %s is in the region under Strict Mode', async (_name, enter) => {
    // Strict Mode runs a new toast's effects a second time after the commit's, which restarts its timer.
    render(
      <StrictMode>
        <ToastRegion />
      </StrictMode>,
    );
    show({ title: 'Older', tone: 'info' });
    advance(1000);
    enter();
    show({ title: 'Newer', tone: 'info' });
    await settle();
    advance(10000);
    expect(toasts()).toHaveLength(2);
  });

  it('adds no commit of its own to hydration when no toast is open', () => {
    const container = document.createElement('div');
    document.body.append(container);
    let commits = 0;
    const page = (
      <Profiler
        id="region"
        onRender={() => {
          commits += 1;
        }}
      >
        <ToastRegion />
      </Profiler>
    );
    // The server's own HTML, which hydration adopts.
    container.innerHTML = renderToString(page);
    commits = 0;
    let root: Root | undefined;
    try {
      act(() => {
        root = hydrateRoot(container, page);
      });
      // Hydration, then React Aria's region once more as it learns it is on the client, which a bare React Aria
      // region does too. A client snapshot that differed from the server's empty one would add a third.
      expect(commits).toBe(2);
    } finally {
      act(() => {
        root?.unmount();
      });
      container.remove();
    }
  });

  it('warns once when a second region is mounted', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    render(
      <>
        <ToastRegion />
        <ToastRegion />
      </>,
    );
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0]?.[0]).toContain('Two <ToastRegion />');
  });

  it('has no axe violations with one toast of each tone', async () => {
    // axe waits on real timers.
    vi.useRealTimers();
    render(<ToastRegion maxVisibleToasts={5} />);
    for (const [tone, title] of [
      ['info', 'Sync started'],
      ['success', 'Saved'],
      ['warning', 'The bank connection expires in 3 days'],
      ['error', 'The import failed'],
    ] as const) {
      show({ title, description: 'A second line.', tone, timeout: null });
    }
    show({ title: 'Row removed', tone: 'success', action: { label: 'Undo', onAction: () => undefined } });
    expect(toasts()).toHaveLength(5);
    await expectNoA11yViolations(document.body);
  });

  it('is exported from the package with toast', () => {
    expect(library.toast).toBe(toast);
    expect(library.ToastRegion).toBe(ToastRegion);
  });
});
