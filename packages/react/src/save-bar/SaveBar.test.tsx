import { act, fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState, type ReactElement } from 'react';
import { renderToString } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import * as library from '../index';
import { expectNoA11yViolations } from '../../test/a11y';
import { Button } from '../button/Button';
import { QUIET_MS } from '../utils/quiet';
import { SaveBar, type SaveBarProps } from './SaveBar';

/** A promise and the two ends that settle it. */
function deferred(): { promise: Promise<void>; resolve: () => void; reject: (error: unknown) => void } {
  let resolve: () => void = () => undefined;
  let reject: (error: unknown) => void = () => undefined;
  const promise = new Promise<void>((yes, no) => {
    resolve = yes;
    reject = no;
  });
  return { promise, resolve, reject };
}

/** The bar's props for a form with two changes: Save, and Cancel when asked for. */
const BASE: SaveBarProps = {
  message: '2 changes to Corner Mart, 14 Oct',
  actionLabel: 'Save',
  onAction: () => undefined,
};

/** The bar, the group named by its message. */
const group = (name: string | RegExp = '2 changes to Corner Mart, 14 Oct'): HTMLElement =>
  screen.getByRole('group', { name });

/** The polite status host. */
const status = (): HTMLElement => {
  const host = document.querySelector<HTMLElement>('.save-bar-status');
  if (!host) throw new Error('No status host');
  return host;
};

/** Fires a cancelable beforeunload on the window and returns it, with the string returnValue jsdom lacks. */
function unload(): Event {
  const event = new Event('beforeunload', { cancelable: true });
  Object.defineProperty(event, 'returnValue', { value: undefined, writable: true });
  window.dispatchEvent(event);
  return event;
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe('SaveBar', () => {
  it('is exported from the package', () => {
    expect(library.SaveBar).toBe(SaveBar);
  });

  it('is a group named by its message, in reading order: chip, message, status, Cancel, secondary, action', () => {
    const { container } = render(
      <SaveBar
        {...BASE}
        isDirty
        onCancel={() => undefined}
        status="3 fields need attention"
        secondaryActions={<Button variant="secondary">Skip</Button>}
        className="mine"
      />,
    );
    const bar = group();
    expect(bar).toHaveClass('save-bar', 'mine');
    expect(bar.tagName).toBe('DIV');
    const message = container.querySelector('.save-bar-message');
    expect(message).toHaveTextContent('2 changes to Corner Mart, 14 Oct');
    expect(bar).toHaveAttribute('aria-labelledby', message?.id);
    expect([...bar.children].map((child) => child.className)).toEqual([
      'save-bar-text',
      'save-bar-status',
      'save-bar-actions',
    ]);
    const text = bar.querySelector('.save-bar-text');
    expect([...(text?.children ?? [])].map((child) => child.className)).toEqual([
      'field-changed save-bar-chip',
      'save-bar-message',
    ]);
    expect(status()).toHaveAttribute('role', 'status');
    expect(
      within(bar)
        .getAllByRole('button')
        .map((button) => button.textContent),
    ).toEqual(['Cancel', 'Skip', 'Save']);
    expect(within(bar).getByRole('button', { name: 'Save' })).toHaveClass('button-primary');
    expect(within(bar).getByRole('button', { name: 'Cancel' })).toHaveClass('button-tertiary');
  });

  it('takes a ref on the bar', () => {
    const ref = { current: null as HTMLDivElement | null };
    render(<SaveBar {...BASE} ref={ref} />);
    expect(ref.current).toBe(group());
  });

  it('draws everything but the question on the server, the status host empty', () => {
    const html = renderToString(<SaveBar {...BASE} isDirty onCancel={() => undefined} />);
    expect(html).toContain('class="save-bar"');
    expect(html).toContain('role="group"');
    expect(html).toContain('Unsaved changes');
    expect(html).toContain(
      '<div class="save-bar-status" role="status" aria-live="polite" aria-atomic="true" data-tone="neutral"></div>',
    );
    expect(html).toContain('>Cancel<');
    expect(html).toContain('>Save<');
    expect(html).not.toContain('alertdialog');
  });

  it('shows the chip only while dirty', () => {
    const { rerender, container } = render(<SaveBar {...BASE} />);
    expect(container.querySelector('.save-bar-chip')).toBeNull();
    rerender(<SaveBar {...BASE} isDirty labels={{ unsaved: 'Not saved yet' }} />);
    expect(container.querySelector('.save-bar-chip')).toHaveTextContent('Not saved yet');
    rerender(<SaveBar {...BASE} isDirty={false} />);
    expect(container.querySelector('.save-bar-chip')).toBeNull();
  });

  it('shows Cancel only with onCancel, named by labels.cancel', () => {
    const { rerender } = render(<SaveBar {...BASE} />);
    expect(within(group()).getAllByRole('button')).toHaveLength(1);
    rerender(<SaveBar {...BASE} onCancel={() => undefined} labels={{ cancel: 'Back' }} />);
    expect(within(group()).getByRole('button', { name: 'Back' })).toBeInTheDocument();
  });

  it('calls onCancel at once while clean', async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();
    render(<SaveBar {...BASE} onCancel={onCancel} />);
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('alertdialog')).toBeNull();
  });

  it('asks before onCancel while dirty, and gives focus back to Cancel on no', async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();
    render(<SaveBar {...BASE} isDirty onCancel={onCancel} />);
    const cancel = screen.getByRole('button', { name: 'Cancel' });
    await user.click(cancel);
    const question = await screen.findByRole('alertdialog', { name: 'Discard changes?' });
    expect(question).toHaveTextContent('The changes you made here will be lost.');
    expect(within(question).getByRole('button', { name: 'Discard changes' })).toHaveClass('button-danger');
    await user.click(within(question).getByRole('button', { name: 'Keep editing' }));
    expect(onCancel).not.toHaveBeenCalled();
    await vi.waitFor(() => {
      expect(screen.queryByRole('alertdialog')).toBeNull();
    });
    await vi.waitFor(() => {
      expect(cancel).toHaveFocus();
    });
    // Asked again, yes calls onCancel.
    await user.click(cancel);
    const again = await screen.findByRole('alertdialog');
    await user.click(within(again).getByRole('button', { name: 'Discard changes' }));
    await vi.waitFor(() => {
      expect(onCancel).toHaveBeenCalledTimes(1);
    });
  });

  it('asks in the words of labels', async () => {
    const user = userEvent.setup();
    render(
      <SaveBar
        {...BASE}
        isDirty
        onCancel={() => undefined}
        labels={{
          discardTitle: 'Leave without saving?',
          discardDescription: 'Your edits to this receipt go.',
          discardConfirm: 'Leave',
          discardKeep: 'Stay',
        }}
      />,
    );
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    const question = await screen.findByRole('alertdialog', { name: 'Leave without saving?' });
    expect(question).toHaveTextContent('Your edits to this receipt go.');
    expect(within(question).getByRole('button', { name: 'Leave' })).toBeInTheDocument();
    expect(within(question).getByRole('button', { name: 'Stay' })).toBeInTheDocument();
  });

  it('keeps the action pending while its promise runs and disables Cancel', async () => {
    const user = userEvent.setup();
    const work = deferred();
    const onAction = vi.fn(() => work.promise);
    render(<SaveBar {...BASE} onAction={onAction} onCancel={() => undefined} />);
    const save = screen.getByRole('button', { name: 'Save' });
    await user.click(save);
    expect(onAction).toHaveBeenCalledTimes(1);
    expect(save).toHaveAttribute('data-pending', 'true');
    expect(save).toHaveAccessibleName('Save Saving');
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled();
    await act(async () => {
      work.resolve();
      await work.promise;
    });
    expect(save).not.toHaveAttribute('data-pending');
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeEnabled();
    expect(save).toHaveFocus();
  });

  it('names the spinner by pendingLabel', async () => {
    const user = userEvent.setup();
    const work = deferred();
    render(<SaveBar {...BASE} onAction={() => work.promise} pendingLabel="Confirming" />);
    await user.click(screen.getByRole('button', { name: 'Save' }));
    expect(screen.getByRole('button', { name: 'Save Confirming' })).toBeInTheDocument();
    await act(async () => {
      work.resolve();
      await work.promise;
    });
  });

  it('reports a rejected action through reportError and stays', async () => {
    const reportError = vi.fn();
    vi.stubGlobal('reportError', reportError);
    const user = userEvent.setup();
    const work = deferred();
    render(<SaveBar {...BASE} onAction={() => work.promise} onCancel={() => undefined} />);
    const save = screen.getByRole('button', { name: 'Save' });
    await user.click(save);
    const failure = new Error('The server is away');
    await act(async () => {
      work.reject(failure);
      await work.promise.catch(() => undefined);
    });
    expect(reportError).toHaveBeenCalledExactlyOnceWith(failure);
    expect(group()).toBeInTheDocument();
    expect(save).not.toHaveAttribute('data-pending');
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeEnabled();
  });

  it('tells no one when the action settles after the bar has gone', async () => {
    const reportError = vi.fn();
    vi.stubGlobal('reportError', reportError);
    const user = userEvent.setup();
    const work = deferred();
    const { unmount } = render(<SaveBar {...BASE} onAction={() => work.promise} />);
    await user.click(screen.getByRole('button', { name: 'Save' }));
    unmount();
    await act(async () => {
      work.reject(new Error('Late'));
      await work.promise.catch(() => undefined);
    });
    // The error is still the page's: only the bar's own state is left alone.
    expect(reportError).toHaveBeenCalledTimes(1);
  });

  it('honors isPending', async () => {
    const user = userEvent.setup();
    const onAction = vi.fn();
    const onCancel = vi.fn();
    render(<SaveBar {...BASE} isPending onAction={onAction} onCancel={onCancel} />);
    const save = screen.getByRole('button', { name: 'Save Saving' });
    expect(save).toHaveAttribute('data-pending', 'true');
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled();
    await user.click(save);
    expect(onAction).not.toHaveBeenCalled();
  });

  it('says labels.pending only after QUIET_MS of pending', () => {
    vi.useFakeTimers();
    const { rerender } = render(<SaveBar {...BASE} isPending labels={{ pending: 'Saving the receipt' }} />);
    expect(status()).toBeEmptyDOMElement();
    act(() => {
      vi.advanceTimersByTime(QUIET_MS - 1);
    });
    expect(status()).toBeEmptyDOMElement();
    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(status()).toHaveTextContent('Saving the receipt');
    rerender(<SaveBar {...BASE} />);
    expect(status()).toBeEmptyDOMElement();
    // A fast save says nothing.
    rerender(<SaveBar {...BASE} isPending />);
    act(() => {
      vi.advanceTimersByTime(QUIET_MS / 2);
    });
    rerender(<SaveBar {...BASE} />);
    act(() => {
      vi.advanceTimersByTime(QUIET_MS);
    });
    expect(status()).toBeEmptyDOMElement();
  });

  it('says each change of status politely', () => {
    const { rerender } = render(<SaveBar {...BASE} />);
    const host = status();
    expect(host).toHaveAttribute('aria-live', 'polite');
    expect(host).toBeEmptyDOMElement();
    rerender(<SaveBar {...BASE} status="3 fields need attention" />);
    expect(host).toHaveTextContent('3 fields need attention');
    rerender(<SaveBar {...BASE} status="1 field needs attention" />);
    expect(host).toHaveTextContent('1 field needs attention');
    expect(status()).toBe(host);
    rerender(<SaveBar {...BASE} />);
    expect(host).toBeEmptyDOMElement();
  });

  it('says a status again when a press is answered with the same one, by drawing its text anew', async () => {
    const user = userEvent.setup();
    render(<SaveBar {...BASE} status="Enter a memo." statusTone="error" />);
    const save = screen.getByRole('button', { name: 'Save' });
    const host = status();
    const first = status().querySelector('.save-bar-status-text');
    expect(first).toHaveTextContent('Enter a memo.');
    await user.click(save);
    const second = status().querySelector('.save-bar-status-text');
    expect(second).toHaveTextContent('Enter a memo.');
    expect(second).not.toBe(first);
    await user.click(save);
    const third = status().querySelector('.save-bar-status-text');
    expect(third).not.toBe(second);
    // The live region itself stays, so a screen reader hears the new text in it.
    expect(status()).toBe(host);
  });

  it("leaves the pending to React Aria's Button while the action holds focus as it begins", () => {
    vi.useFakeTimers();
    const { rerender } = render(<SaveBar {...BASE} />);
    const save = screen.getByRole('button', { name: 'Save' });
    act(() => {
      save.focus();
    });
    // The app starts a save of its own with focus on the action: React Aria says "Save Saving" itself.
    rerender(<SaveBar {...BASE} isPending />);
    act(() => {
      vi.advanceTimersByTime(QUIET_MS * 3);
    });
    expect(save).toHaveAttribute('data-pending', 'true');
    expect(status()).toBeEmptyDOMElement();
    rerender(<SaveBar {...BASE} />);
    expect(status()).toBeEmptyDOMElement();
  });

  it('leaves the pending of a pressed action to React Aria too, the press holding focus', async () => {
    vi.useFakeTimers();
    const work = deferred();
    render(<SaveBar {...BASE} onAction={() => work.promise} />);
    const save = screen.getByRole('button', { name: 'Save' });
    act(() => {
      save.focus();
    });
    act(() => {
      fireEvent.keyDown(save, { key: 'Enter' });
      fireEvent.keyUp(save, { key: 'Enter' });
    });
    expect(save).toHaveAttribute('data-pending', 'true');
    act(() => {
      vi.advanceTimersByTime(QUIET_MS * 3);
    });
    expect(status()).toBeEmptyDOMElement();
    await act(async () => {
      work.resolve();
      await work.promise;
    });
    expect(save).toHaveFocus();
  });

  it('says labels.pending in the status when focus is elsewhere as the pending begins', () => {
    vi.useFakeTimers();
    function Page({ isPending }: { isPending: boolean }): ReactElement {
      return (
        <>
          <input aria-label="Memo" />
          <SaveBar {...BASE} isPending={isPending} />
        </>
      );
    }
    const { rerender } = render(<Page isPending={false} />);
    act(() => {
      screen.getByRole('textbox', { name: 'Memo' }).focus();
    });
    rerender(<Page isPending />);
    act(() => {
      vi.advanceTimersByTime(QUIET_MS);
    });
    expect(status()).toHaveTextContent('Saving');
  });

  it('draws the pending over an error status in the neutral tone, and gives the error back after', () => {
    vi.useFakeTimers();
    const error = { status: "Couldn't save. Try again.", statusTone: 'error' as const };
    const { rerender } = render(<SaveBar {...BASE} {...error} />);
    expect(status()).toHaveAttribute('data-tone', 'error');
    rerender(<SaveBar {...BASE} {...error} isPending />);
    // Before the pause the error stands.
    expect(status()).toHaveTextContent("Couldn't save. Try again.");
    act(() => {
      vi.advanceTimersByTime(QUIET_MS);
    });
    expect(status()).toHaveAttribute('data-tone', 'neutral');
    expect(status()).toHaveTextContent('Saving');
    expect(status().querySelector('svg')).toBeNull();
    rerender(<SaveBar {...BASE} {...error} />);
    expect(status()).toHaveAttribute('data-tone', 'error');
    expect(status()).toHaveTextContent("Couldn't save. Try again.");
    expect(status().querySelector('svg.lucide-circle-alert')).not.toBeNull();
  });

  it('draws the error tone with its icon', () => {
    const { rerender } = render(<SaveBar {...BASE} status="3 fields need attention" />);
    expect(status()).toHaveAttribute('data-tone', 'neutral');
    expect(status().querySelector('svg')).toBeNull();
    rerender(<SaveBar {...BASE} status="Couldn't save. Try again." statusTone="error" />);
    expect(status()).toHaveAttribute('data-tone', 'error');
    const icon = status().querySelector('svg.lucide-circle-alert');
    expect(icon).not.toBeNull();
    expect(icon).toHaveAttribute('aria-hidden', 'true');
    expect(status()).toHaveTextContent("Couldn't save. Try again.");
  });

  it('never disables the action', async () => {
    const user = userEvent.setup();
    const onAction = vi.fn();
    render(<SaveBar {...BASE} onAction={onAction} status="3 fields need attention" statusTone="error" />);
    const save = screen.getByRole('button', { name: 'Save' });
    expect(save).toBeEnabled();
    expect(save).not.toHaveAttribute('aria-disabled');
    await user.click(save);
    expect(onAction).toHaveBeenCalledTimes(1);
  });

  it("takes no Mod+S: the shortcut is the app's", async () => {
    const user = userEvent.setup();
    const onAction = vi.fn();
    render(<SaveBar {...BASE} onAction={onAction} />);
    screen.getByRole('button', { name: 'Save' }).focus();
    await user.keyboard('{Control>}s{/Control}{Meta>}s{/Meta}');
    expect(onAction).not.toHaveBeenCalled();
  });

  it('warns before unload only while dirty and warnsOnUnload', () => {
    const { rerender, unmount } = render(<SaveBar {...BASE} />);
    expect(unload().defaultPrevented).toBe(false);
    rerender(<SaveBar {...BASE} isDirty />);
    expect(unload().defaultPrevented).toBe(true);
    rerender(<SaveBar {...BASE} isDirty warnsOnUnload={false} />);
    expect(unload().defaultPrevented).toBe(false);
    rerender(<SaveBar {...BASE} isDirty />);
    unmount();
    expect(unload().defaultPrevented).toBe(false);
  });

  it('gives focus to the action when Cancel is disabled or leaves with focus on it, never to the body', () => {
    function Bar({
      isPending = false,
      hasCancel = true,
    }: {
      isPending?: boolean;
      hasCancel?: boolean;
    }): ReactElement {
      return <SaveBar {...BASE} isPending={isPending} onCancel={hasCancel ? () => undefined : undefined} />;
    }
    const { rerender } = render(<Bar />);
    const cancel = screen.getByRole('button', { name: 'Cancel' });
    act(() => {
      cancel.focus();
    });
    // The app starts a save of its own while the reader is on Cancel.
    rerender(<Bar isPending />);
    expect(screen.getByRole('button', { name: /^Save/ })).toHaveFocus();
    rerender(<Bar />);
    act(() => {
      screen.getByRole('button', { name: 'Cancel' }).focus();
    });
    rerender(<Bar hasCancel={false} />);
    expect(screen.getByRole('button', { name: 'Save' })).toHaveFocus();
  });

  it('gives focus to the action after a yes when the app drops Cancel once nothing is dirty', async () => {
    const user = userEvent.setup();
    function Form(): ReactElement {
      const [isDirty, setDirty] = useState(true);
      return (
        <SaveBar
          {...BASE}
          isDirty={isDirty}
          onCancel={
            isDirty
              ? () => {
                  setDirty(false);
                }
              : undefined
          }
        />
      );
    }
    render(<Form />);
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    const question = await screen.findByRole('alertdialog');
    await user.click(within(question).getByRole('button', { name: 'Discard changes' }));
    await vi.waitFor(() => {
      expect(screen.queryByRole('alertdialog')).toBeNull();
    });
    expect(screen.queryByRole('button', { name: 'Cancel' })).toBeNull();
    await vi.waitFor(() => {
      expect(screen.getByRole('button', { name: 'Save' })).toHaveFocus();
    });
  });

  it('gives focus to the action after Keep editing when a save began while the question was open', async () => {
    const user = userEvent.setup();
    const props = { ...BASE, isDirty: true, onCancel: () => undefined };
    const { rerender } = render(<SaveBar {...props} />);
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    const question = await screen.findByRole('alertdialog');
    // The app starts a save of its own while the reader reads the question: Cancel is disabled under it.
    rerender(<SaveBar {...props} isPending />);
    await user.click(within(question).getByRole('button', { name: 'Keep editing' }));
    await vi.waitFor(() => {
      expect(screen.queryByRole('alertdialog')).toBeNull();
    });
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled();
    await vi.waitFor(() => {
      expect(screen.getByRole('button', { name: /^Save/ })).toHaveFocus();
    });
  });

  it('leaves focus the reader moved elsewhere alone', () => {
    function Page({ hasCancel }: { hasCancel: boolean }): ReactElement {
      return (
        <>
          <input aria-label="Memo" />
          <SaveBar {...BASE} onCancel={hasCancel ? () => undefined : undefined} />
        </>
      );
    }
    const { rerender } = render(<Page hasCancel />);
    act(() => {
      screen.getByRole('button', { name: 'Cancel' }).focus();
    });
    act(() => {
      screen.getByRole('textbox', { name: 'Memo' }).focus();
    });
    rerender(<Page hasCancel={false} />);
    expect(screen.getByRole('textbox', { name: 'Memo' })).toHaveFocus();
  });

  it('runs the whole flow in a form whose Save is answered with a status', async () => {
    const user = userEvent.setup();
    function Form(): ReactElement {
      const [memo, setMemo] = useState('Milk');
      const [problem, setProblem] = useState('');
      return (
        <form>
          <input
            aria-label="Memo"
            value={memo}
            onChange={(event) => {
              setMemo(event.target.value);
            }}
          />
          <SaveBar
            message="1 change to Corner Mart"
            isDirty={memo !== 'Milk'}
            actionLabel="Save"
            onAction={() => {
              setProblem(memo === '' ? 'Enter a memo.' : '');
            }}
            status={problem}
            statusTone="error"
          />
        </form>
      );
    }
    render(<Form />);
    await user.clear(screen.getByRole('textbox', { name: 'Memo' }));
    expect(group('1 change to Corner Mart').querySelector('.save-bar-chip')).not.toBeNull();
    await user.click(screen.getByRole('button', { name: 'Save' }));
    expect(status()).toHaveTextContent('Enter a memo.');
  });

  const AXE_CASES: [string, ReactElement][] = [
    ['clean', <SaveBar key="clean" {...BASE} onCancel={() => undefined} />],
    ['dirty', <SaveBar key="dirty" {...BASE} isDirty onCancel={() => undefined} />],
    ['pending', <SaveBar key="pending" {...BASE} isDirty isPending onCancel={() => undefined} />],
    [
      'error status',
      <SaveBar
        key="error"
        {...BASE}
        isDirty
        onCancel={() => undefined}
        status="Couldn't save. Try again."
        statusTone="error"
      />,
    ],
    [
      'review with a secondary action',
      <SaveBar
        key="review"
        message="Corner Mart, 14 Oct"
        actionLabel="Confirm and review next (2 left)"
        onAction={() => undefined}
        secondaryActions={<Button variant="secondary">Skip</Button>}
      />,
    ],
  ];

  it.each(AXE_CASES)('has no axe violations: %s', async (_, element) => {
    const { container } = render(element);
    await expectNoA11yViolations(container);
  });

  it('has no axe violations: the discard question', async () => {
    const user = userEvent.setup();
    render(<SaveBar {...BASE} isDirty onCancel={() => undefined} />);
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    const question = await screen.findByRole('alertdialog');
    await expectNoA11yViolations(question);
  });
});
