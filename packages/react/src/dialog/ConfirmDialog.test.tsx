import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Trash2 } from 'lucide-react';
import type { ReactElement } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { expectNoA11yViolations } from '../../test/a11y';
import { Button } from '../button';
import { ConfirmDialog, type ConfirmDialogProps } from './ConfirmDialog';
import { Dialog, DialogTrigger } from './Dialog';

/** The open dialog's scrim, which React Aria portals to the body. */
function scrim(): HTMLElement {
  const element = document.querySelector<HTMLElement>('.dialog-overlay');
  if (!element) throw new Error('No scrim');
  return element;
}

/** The open dialog's panel. */
function panel(): HTMLElement {
  const element = document.querySelector<HTMLElement>('.dialog');
  if (!element) throw new Error('No panel');
  return element;
}

/** The question every test asks unless it says otherwise. */
const QUESTION = {
  title: 'Delete these transactions?',
  description: 'They leave every report, with their notes. This cannot be undone.',
  confirmLabel: 'Delete 3 transactions',
  tone: 'danger',
} satisfies ConfirmDialogProps;

/** An open confirm dialog, controlled, with whatever the test gives it. */
function open(props: Partial<ConfirmDialogProps> = {}): ReturnType<typeof render> {
  return render(<ConfirmDialog isOpen {...QUESTION} {...props} />);
}

/** A trigger and its confirm dialog, closed until the trigger is pressed. */
function Triggered(props: Partial<ConfirmDialogProps>): ReactElement {
  return (
    <DialogTrigger>
      <Button variant="danger">Delete</Button>
      <ConfirmDialog {...QUESTION} {...props} />
    </DialogTrigger>
  );
}

/** Renders a trigger and its confirm dialog, presses the trigger, and returns the two buttons in the dialog. */
async function ask(
  user: ReturnType<typeof userEvent.setup>,
  props: Partial<ConfirmDialogProps> = {},
): Promise<{ cancel: HTMLElement; confirm: HTMLElement }> {
  render(<Triggered {...props} />);
  await user.click(screen.getByRole('button', { name: 'Delete' }));
  return {
    cancel: screen.getByRole('button', { name: 'Cancel' }),
    confirm: screen.getByRole('button', { name: 'Delete 3 transactions' }),
  };
}

/** A promise and the two functions that settle it, so a test decides when an `onConfirm` finishes. */
function deferred(): { promise: Promise<void>; resolve: () => void; reject: (error: unknown) => void } {
  let resolve: () => void = () => undefined;
  let reject: (error: unknown) => void = () => undefined;
  const promise = new Promise<void>((done, fail) => {
    resolve = done;
    reject = fail;
  });
  return { promise, resolve, reject };
}

/** The ways out that are not the confirm button, each taken on an open dialog. */
const EXITS: [name: string, take: (user: ReturnType<typeof userEvent.setup>) => Promise<void>][] = [
  ['Escape', (user) => user.keyboard('{Escape}')],
  ['a press on the scrim', (user) => user.click(scrim())],
  ['the Cancel button', (user) => user.click(screen.getByRole('button', { name: 'Cancel' }))],
];

afterEach(() => {
  vi.unstubAllGlobals();
  // React Aria's Button announces its pending state through a live region it keeps on the body across tests.
  // Its messages point at the button by id, so one left from an earlier test points at nothing.
  for (const log of document.querySelectorAll('[data-live-announcer] [role="log"]')) log.replaceChildren();
});

describe('ConfirmDialog', () => {
  it('is an alert dialog named by its title and described by its description', () => {
    open();
    const dialog = screen.getByRole('alertdialog', { name: 'Delete these transactions?' });
    expect(dialog).toHaveClass('dialog-content');
    expect(dialog).toHaveAccessibleDescription(QUESTION.description);
    expect(dialog.getAttribute('aria-describedby')).toBe(document.querySelector('.dialog-description')?.id);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('puts Cancel first and the confirm button, named by confirmLabel, second in the action row', () => {
    open();
    const row = document.querySelector('.dialog-actions');
    const buttons = [...(row?.querySelectorAll('button') ?? [])];
    expect(buttons).toEqual([
      screen.getByRole('button', { name: 'Cancel' }),
      screen.getByRole('button', { name: 'Delete 3 transactions' }),
    ]);
    expect(buttons[0]).toHaveClass('button-tertiary');
  });

  it('names the cancel button with cancelLabel', () => {
    open({ cancelLabel: 'Keep them' });
    expect(screen.getByRole('button', { name: 'Keep them' })).toHaveClass('button-tertiary');
    expect(screen.queryByRole('button', { name: 'Cancel' })).not.toBeInTheDocument();
  });

  it('draws the danger Button and a warning triangle in the error well in the danger tone', () => {
    open({ tone: 'danger' });
    expect(screen.getByRole('button', { name: 'Delete 3 transactions' })).toHaveClass(
      'button',
      'button-danger',
    );
    expect(panel()).toHaveAttribute('data-tone', 'danger');
    expect(document.querySelector('.dialog-well svg.lucide-triangle-alert')).toBeInTheDocument();
  });

  it('draws the primary Button and no well in the default tone', () => {
    open({ tone: 'default', confirmLabel: 'Send invoice' });
    expect(screen.getByRole('button', { name: 'Send invoice' })).toHaveClass('button', 'button-primary');
    expect(panel()).toHaveAttribute('data-tone', 'default');
    expect(document.querySelector('.dialog-well')).not.toBeInTheDocument();
  });

  it('draws the icon it is given in place of the triangle, and adds a well for it in the default tone', () => {
    const { unmount } = open({ tone: 'danger', icon: <Trash2 /> });
    expect(document.querySelector('.dialog-well svg.lucide-trash-2')).toBeInTheDocument();
    expect(document.querySelector('.lucide-triangle-alert')).not.toBeInTheDocument();
    unmount();
    open({ tone: 'default', icon: <Trash2 /> });
    expect(document.querySelector('.dialog-well svg.lucide-trash-2')).toBeInTheDocument();
  });

  it('draws no close button and passes size, className and overlayClassName to the dialog', () => {
    open({ size: 'lg', className: 'mine', overlayClassName: 'theirs' });
    expect(document.querySelector('.dialog-close')).not.toBeInTheDocument();
    expect(panel()).toHaveAttribute('data-size', 'lg');
    expect(panel().className).toBe('overlay dialog mine');
    expect(scrim().className).toBe('overlay-scrim dialog-overlay theirs');
  });

  it.each(EXITS)('cancels once on %s and closes, and never confirms', async (_name, take) => {
    const user = userEvent.setup();
    const onCancel = vi.fn();
    const onConfirm = vi.fn();
    await ask(user, { onCancel, onConfirm });
    await take(user);
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('cancels on Escape when it opens from defaultOpen and when it is controlled by isOpen', async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();
    const { unmount } = render(<ConfirmDialog defaultOpen onCancel={onCancel} {...QUESTION} />);
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    expect(onCancel).toHaveBeenCalledTimes(1);
    unmount();

    onCancel.mockClear();
    const onOpenChange = vi.fn();
    open({ onCancel, onOpenChange });
    await user.keyboard('{Escape}');
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onOpenChange).toHaveBeenCalledExactlyOnceWith(false);
    // The caller owns the state, and it still says open.
    expect(screen.getByRole('alertdialog')).toBeInTheDocument();
  });

  it('confirms once on the confirm button and closes, and never cancels', async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();
    const onConfirm = vi.fn();
    const { confirm } = await ask(user, { onCancel, onConfirm });
    await user.click(confirm);
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onCancel).not.toHaveBeenCalled();
  });

  it('stays open and cancels nothing on a press on the scrim when isDismissable is false', async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();
    await ask(user, { onCancel, isDismissable: false });
    await user.click(scrim());
    expect(screen.getByRole('alertdialog')).toBeInTheDocument();
    expect(onCancel).not.toHaveBeenCalled();
    // Escape still answers, once the dialog has taken back the focus the press on the scrim moved.
    await waitFor(() => {
      expect(screen.getByRole('alertdialog')).toContainElement(document.activeElement as HTMLElement);
    });
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('is pending while the promise from onConfirm runs, and closes when it resolves', async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();
    const work = deferred();
    const { cancel, confirm } = await ask(user, { onCancel, onConfirm: () => work.promise });
    await user.click(confirm);
    expect(confirm).toHaveAttribute('data-pending', 'true');
    // The label stays in the tree under the spinner, and in the button's name.
    expect(confirm).toHaveTextContent('Delete 3 transactions');
    expect(confirm).toHaveAccessibleName(/Delete 3 transactions/);
    expect(cancel).toBeDisabled();
    // Nothing abandons a half-finished action: not Escape, not the scrim, not a second press.
    await user.keyboard('{Escape}');
    await user.click(scrim());
    expect(screen.getByRole('alertdialog')).toBeInTheDocument();
    expect(onCancel).not.toHaveBeenCalled();
    await act(async () => {
      work.resolve();
      await work.promise;
    });
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    expect(onCancel).not.toHaveBeenCalled();
  });

  it('stays open and no longer pending when the promise rejects, and reports the error as if uncaught', async () => {
    const reportError = vi.fn();
    vi.stubGlobal('reportError', reportError);
    const user = userEvent.setup();
    const onCancel = vi.fn();
    const work = deferred();
    const { cancel, confirm } = await ask(user, { onCancel, onConfirm: () => work.promise });
    await user.click(confirm);
    expect(confirm).toHaveAttribute('data-pending', 'true');
    const failure = new Error('The server is away');
    await act(async () => {
      work.reject(failure);
      await work.promise.catch(() => undefined);
    });
    expect(screen.getByRole('alertdialog')).toBeInTheDocument();
    expect(confirm).not.toHaveAttribute('data-pending');
    expect(cancel).toBeEnabled();
    expect(reportError).toHaveBeenCalledExactlyOnceWith(failure);
    expect(onCancel).not.toHaveBeenCalled();
    // It can be answered again: Cancel now cancels.
    await user.click(cancel);
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('shows the same pending state from isPending, and nothing closes it', async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();
    const onConfirm = vi.fn();
    const onOpenChange = vi.fn();
    open({ isPending: true, onCancel, onConfirm, onOpenChange });
    const confirm = screen.getByRole('button', { name: /Delete 3 transactions/ });
    expect(confirm).toHaveAttribute('data-pending', 'true');
    expect(confirm).toHaveTextContent('Delete 3 transactions');
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled();
    await user.keyboard('{Escape}');
    await user.click(scrim());
    await user.click(confirm);
    expect(screen.getByRole('alertdialog')).toBeInTheDocument();
    expect(onOpenChange).not.toHaveBeenCalled();
    expect(onCancel).not.toHaveBeenCalled();
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('tells a controlled caller onOpenChange(false) once, after the confirm resolves', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    const onCancel = vi.fn();
    const work = deferred();
    open({ onOpenChange, onCancel, onConfirm: () => work.promise });
    await user.click(screen.getByRole('button', { name: 'Delete 3 transactions' }));
    expect(onOpenChange).not.toHaveBeenCalled();
    await act(async () => {
      work.resolve();
      await work.promise;
    });
    expect(onOpenChange).toHaveBeenCalledExactlyOnceWith(false);
    expect(onCancel).not.toHaveBeenCalled();
  });

  it('names the pending spinner with pendingLabel, read with the confirm label', async () => {
    const user = userEvent.setup();
    const { confirm } = await ask(user, { pendingLabel: 'Deleting', onConfirm: () => deferred().promise });
    await user.click(confirm);
    expect(confirm).toHaveAttribute('data-pending', 'true');
    expect(screen.getByRole('progressbar', { name: 'Deleting' })).toBeInTheDocument();
    expect(confirm).toHaveAccessibleName(/Delete 3 transactions/);
    expect(confirm).toHaveAccessibleName(/Deleting/);
  });

  it('forgets a running confirm when a controlled caller closes it: reopened, it is not pending, and the run ends quietly', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    const onCancel = vi.fn();
    const work = deferred();
    const view = open({ onOpenChange, onCancel, onConfirm: () => work.promise });
    await user.click(screen.getByRole('button', { name: 'Delete 3 transactions' }));
    // The caller closes it while the work runs, then opens the same dialog again before the work ends.
    view.rerender(
      <ConfirmDialog
        isOpen={false}
        {...QUESTION}
        onOpenChange={onOpenChange}
        onCancel={onCancel}
        onConfirm={() => work.promise}
      />,
    );
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    view.rerender(
      <ConfirmDialog
        isOpen
        {...QUESTION}
        onOpenChange={onOpenChange}
        onCancel={onCancel}
        onConfirm={() => work.promise}
      />,
    );
    const confirm = screen.getByRole('button', { name: 'Delete 3 transactions' });
    expect(confirm).not.toHaveAttribute('data-pending');
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeEnabled();
    await act(async () => {
      work.resolve();
      await work.promise;
    });
    // The old run neither closes the reopened question nor tells the caller anything.
    expect(screen.getByRole('alertdialog')).toBeInTheDocument();
    expect(onOpenChange).not.toHaveBeenCalled();
    expect(onCancel).not.toHaveBeenCalled();
  });

  it('tells no one when the confirm settles after the dialog has left the page', async () => {
    const reportError = vi.fn();
    vi.stubGlobal('reportError', reportError);
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    const onCancel = vi.fn();
    const done = deferred();
    const view = open({ onOpenChange, onCancel, onConfirm: () => done.promise });
    await user.click(screen.getByRole('button', { name: 'Delete 3 transactions' }));
    view.unmount();
    await act(async () => {
      done.resolve();
      await done.promise;
    });
    expect(onOpenChange).not.toHaveBeenCalled();
    expect(onCancel).not.toHaveBeenCalled();

    // A failure is still reported: the page should hear of it even when no dialog is left to show it.
    const failed = deferred();
    const again = open({ onOpenChange, onCancel, onConfirm: () => failed.promise });
    await user.click(screen.getByRole('button', { name: 'Delete 3 transactions' }));
    again.unmount();
    const failure = new Error('The server is away');
    await act(async () => {
      failed.reject(failure);
      await failed.promise.catch(() => undefined);
    });
    expect(reportError).toHaveBeenCalledExactlyOnceWith(failure);
    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it('warns once when it is given onOpenChange inside a DialogTrigger, which owns the open state', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    try {
      const user = userEvent.setup();
      const onOpenChange = vi.fn();
      const { unmount } = render(<Triggered onOpenChange={onOpenChange} />);
      await user.click(screen.getByRole('button', { name: 'Delete' }));
      await user.keyboard('{Escape}');
      expect(onOpenChange).not.toHaveBeenCalled();
      unmount();
      render(<Triggered onOpenChange={onOpenChange} />);
      const warnings = warn.mock.calls.filter(([message]) => String(message).includes('DialogTrigger'));
      expect(warnings).toHaveLength(1);
    } finally {
      warn.mockRestore();
    }
  });

  it('warns once when the tone is missing, which the type requires', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    try {
      // Plain JavaScript can leave out what the type requires.
      const untyped = { ...QUESTION, tone: undefined } as unknown as ConfirmDialogProps;
      const { unmount } = render(<ConfirmDialog isOpen {...untyped} />);
      unmount();
      render(<ConfirmDialog isOpen {...untyped} />);
      const warnings = warn.mock.calls.filter(([message]) => String(message).includes('tone'));
      expect(warnings).toHaveLength(1);
    } finally {
      warn.mockRestore();
    }
  });

  it('focuses Cancel when it opens in the danger tone, the safe answer', () => {
    open({ tone: 'danger' });
    expect(screen.getByRole('button', { name: 'Cancel' })).toHaveFocus();
  });

  it('focuses the confirm button when it opens in the default tone', () => {
    open({ tone: 'default', confirmLabel: 'Send invoice' });
    expect(screen.getByRole('button', { name: 'Send invoice' })).toHaveFocus();
  });

  it('copies the scope of what it opened from, a dark trigger or a dialog that copied one, while Cancel takes focus', async () => {
    const user = userEvent.setup();
    render(
      <div data-theme="dark" data-shape="square">
        <DialogTrigger>
          <Button variant="secondary">Edit the rule</Button>
          <Dialog title="Edit the rule" actions={<Triggered />} />
        </DialogTrigger>
      </div>,
    );
    await user.click(screen.getByRole('button', { name: 'Edit the rule' }));
    await user.click(screen.getByRole('button', { name: 'Delete' }));
    const [outer, inner] = [...document.querySelectorAll('.dialog')];
    expect(outer).toHaveAttribute('data-theme', 'dark');
    expect(inner).toHaveAttribute('data-theme', 'dark');
    expect(inner).toHaveAttribute('data-shape', 'square');
    expect(screen.getByRole('button', { name: 'Cancel' })).toHaveFocus();
    // Escape answers the confirm only, and focus goes back to its trigger in the dialog that stays.
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    expect(screen.getByRole('dialog', { name: 'Edit the rule' })).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Delete' })).toHaveFocus();
    });
  });

  it.each(['default', 'danger'] as const)('has no axe violations open in the %s tone', async (tone) => {
    open({ tone, confirmLabel: tone === 'danger' ? 'Delete 3 transactions' : 'Send invoice' });
    await expectNoA11yViolations(document.body);
  });
});
