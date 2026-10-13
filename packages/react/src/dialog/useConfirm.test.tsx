import { act, render, renderHook, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StrictMode, useLayoutEffect, type ReactElement } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { Button } from '../button';
import { useConfirm, type ConfirmHandle, type ConfirmOptions } from './useConfirm';

/** The question the probe asks. */
const QUESTION: ConfirmOptions = {
  title: 'Delete Groceries?',
  description: 'It leaves every report, with its notes.',
  confirmLabel: 'Delete Groceries',
  tone: 'danger',
};

/** A question that loses nothing, asked after the first is confirmed. */
const FOLLOW_UP: ConfirmOptions = {
  title: 'Tell the bookkeeper?',
  description: 'They get an email saying Groceries was removed.',
  confirmLabel: 'Send the email',
  tone: 'default',
};

/**
 * Asks the question and, when it is confirmed, chains the follow-up, from a button in a dark, square scope.
 * Hands the follow-up's answer, or `false` when the first is not confirmed, to `onAnswer`.
 */
function Chained({ onAnswer }: { onAnswer: (answer: boolean) => void }): ReactElement {
  const { confirm, dialog } = useConfirm();
  const ask = async (): Promise<void> => {
    const isSure = await confirm(QUESTION);
    onAnswer(isSure ? await confirm(FOLLOW_UP) : false);
  };
  return (
    <div data-theme="dark" data-shape="square">
      <Button
        variant="secondary"
        onPress={() => {
          void ask();
        }}
      >
        Delete
      </Button>
      {dialog}
    </div>
  );
}

/** The open dialog's panel. */
function panel(): HTMLElement {
  const element = document.querySelector<HTMLElement>('.dialog');
  if (!element) throw new Error('No panel');
  return element;
}

/**
 * Calls the hook, renders its dialog beside a button that asks, hands every answer to `onAnswer`, and hands
 * the latest handle to `onHandle` after each render, so a test can ask while a dialog holds the page.
 */
function Probe({
  onAnswer,
  onHandle,
}: {
  onAnswer: (answer: boolean) => void;
  onHandle?: (handle: ConfirmHandle) => void;
}): ReactElement {
  const handle = useConfirm();
  useLayoutEffect(() => {
    onHandle?.(handle);
  });
  return (
    <>
      <Button
        variant="secondary"
        onPress={() => {
          void handle.confirm(QUESTION).then(onAnswer);
        }}
      >
        Delete
      </Button>
      {handle.dialog}
    </>
  );
}

/** Renders the probe, presses its button and returns the answer mock and the render result. */
async function asked(user: ReturnType<typeof userEvent.setup>): Promise<{
  onAnswer: ReturnType<typeof vi.fn<(answer: boolean) => void>>;
  view: ReturnType<typeof render>;
  latest: () => ConfirmHandle;
}> {
  const onAnswer = vi.fn<(answer: boolean) => void>();
  let handle: ConfirmHandle | null = null;
  const view = render(
    <Probe
      onAnswer={onAnswer}
      onHandle={(next) => {
        handle = next;
      }}
    />,
  );
  await user.click(screen.getByRole('button', { name: 'Delete' }));
  const latest = (): ConfirmHandle => {
    if (!handle) throw new Error('No handle');
    return handle;
  };
  return { onAnswer, view, latest };
}

describe('useConfirm', () => {
  it('has no dialog before the first question', () => {
    const { result } = renderHook(() => useConfirm());
    expect(result.current.dialog).toBeNull();
    expect(typeof result.current.confirm).toBe('function');
  });

  it('opens an alert dialog with the options it is asked with', async () => {
    const user = userEvent.setup();
    await asked(user);
    const dialog = screen.getByRole('alertdialog', { name: 'Delete Groceries?' });
    expect(dialog).toHaveAccessibleDescription('It leaves every report, with its notes.');
    expect(screen.getByRole('button', { name: 'Delete Groceries' })).toHaveClass('button-danger');
  });

  it('answers true when the confirm button is pressed, and closes', async () => {
    const user = userEvent.setup();
    const { onAnswer } = await asked(user);
    await user.click(screen.getByRole('button', { name: 'Delete Groceries' }));
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    await waitFor(() => {
      expect(onAnswer).toHaveBeenCalledExactlyOnceWith(true);
    });
  });

  it.each([
    ['Escape', (user: ReturnType<typeof userEvent.setup>) => user.keyboard('{Escape}')],
    [
      'a press on the scrim',
      (user: ReturnType<typeof userEvent.setup>) => {
        const scrim = document.querySelector('.dialog-overlay');
        if (!scrim) throw new Error('No scrim');
        return user.click(scrim);
      },
    ],
    [
      'the Cancel button',
      (user: ReturnType<typeof userEvent.setup>) =>
        user.click(screen.getByRole('button', { name: 'Cancel' })),
    ],
  ])('answers false on %s, and closes', async (_name, take) => {
    const user = userEvent.setup();
    const { onAnswer } = await asked(user);
    await take(user);
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    await waitFor(() => {
      expect(onAnswer).toHaveBeenCalledExactlyOnceWith(false);
    });
  });

  it('answers an open question false when a second one is asked, and shows the second', async () => {
    const user = userEvent.setup();
    const { onAnswer, latest } = await asked(user);
    let second: Promise<boolean> | undefined;
    act(() => {
      second = latest().confirm({ ...QUESTION, title: 'Delete Rent?', confirmLabel: 'Delete Rent' });
    });
    await waitFor(() => {
      expect(onAnswer).toHaveBeenCalledExactlyOnceWith(false);
    });
    expect(screen.getAllByRole('alertdialog')).toHaveLength(1);
    expect(screen.getByRole('alertdialog', { name: 'Delete Rent?' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Delete Rent' }));
    await expect(second).resolves.toBe(true);
    expect(onAnswer).toHaveBeenCalledTimes(1);
  });

  it('answers an open question false when the component that asked unmounts', async () => {
    const user = userEvent.setup();
    const { onAnswer, view } = await asked(user);
    view.unmount();
    await waitFor(() => {
      expect(onAnswer).toHaveBeenCalledExactlyOnceWith(false);
    });
  });

  it('keeps an answered question rendered, closed, so React Aria can play its exit, and leaves nothing behind', async () => {
    const user = userEvent.setup();
    const { latest } = await asked(user);
    const before = latest().dialog as ReactElement<{ isOpen: boolean }>;
    expect(before.props.isOpen).toBe(true);
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    // jsdom runs no animations, so React Aria removes the overlay at once; a browser plays the exit first.
    const after = latest().dialog as ReactElement<{ isOpen: boolean }> | null;
    expect(after?.props.isOpen).toBe(false);
    expect(document.querySelector('.dialog-overlay')).not.toBeInTheDocument();
  });

  it('gives a question asked over an open one its own content, so its initial focus runs again', async () => {
    const user = userEvent.setup();
    const { latest } = await asked(user);
    // The first question is a danger one, which starts on Cancel.
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Cancel' })).toHaveFocus();
    });
    act(() => {
      void latest().confirm(FOLLOW_UP);
    });
    // The second loses nothing, so it starts on its answer.
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Send the email' })).toHaveFocus();
    });
    expect(screen.getAllByRole('alertdialog')).toHaveLength(1);
  });

  it('gives a question chained after an answer its own initial focus', async () => {
    const user = userEvent.setup();
    render(<Chained onAnswer={vi.fn()} />);
    await user.click(screen.getByRole('button', { name: 'Delete' }));
    await user.click(screen.getByRole('button', { name: 'Delete Groceries' }));
    const follow = await screen.findByRole('alertdialog', { name: 'Tell the bookkeeper?' });
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Send the email' })).toHaveFocus();
    });
    expect(follow).toHaveAccessibleDescription('They get an email saying Groceries was removed.');
  });

  it('opens a question chained after an answer in the scope of the first trigger', async () => {
    const user = userEvent.setup();
    render(<Chained onAnswer={vi.fn()} />);
    await user.click(screen.getByRole('button', { name: 'Delete' }));
    expect(panel()).toHaveAttribute('data-theme', 'dark');
    await user.click(screen.getByRole('button', { name: 'Delete Groceries' }));
    await screen.findByRole('alertdialog', { name: 'Tell the bookkeeper?' });
    // By now the first panel has gone and focus with it, yet the run still opens from the trigger.
    expect(panel()).toHaveAttribute('data-theme', 'dark');
    expect(panel()).toHaveAttribute('data-shape', 'square');
  });

  it('opens a question asked over an open one in the scope of the first trigger', async () => {
    const user = userEvent.setup();
    const latest: { handle: ConfirmHandle | null } = { handle: null };
    render(
      <div data-theme="dark">
        <Probe
          onAnswer={vi.fn()}
          onHandle={(next) => {
            latest.handle = next;
          }}
        />
      </div>,
    );
    await user.click(screen.getByRole('button', { name: 'Delete' }));
    act(() => {
      void latest.handle?.confirm(FOLLOW_UP);
    });
    await screen.findByRole('alertdialog', { name: 'Tell the bookkeeper?' });
    expect(panel()).toHaveAttribute('data-theme', 'dark');
  });

  it('gives focus back to the first trigger when a question asked over the first is answered', async () => {
    const user = userEvent.setup();
    const { latest } = await asked(user);
    const trigger = screen.getByRole('button', { name: 'Delete', hidden: true });
    act(() => {
      void latest().confirm(FOLLOW_UP);
    });
    await user.click(await screen.findByRole('button', { name: 'Cancel' }));
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    await waitFor(() => {
      expect(trigger).toHaveFocus();
    });
  });

  it('gives focus back to the first trigger when a question chained after an answer is answered', async () => {
    const user = userEvent.setup();
    const onAnswer = vi.fn<(answer: boolean) => void>();
    render(<Chained onAnswer={onAnswer} />);
    const trigger = screen.getByRole('button', { name: 'Delete' });
    await user.click(trigger);
    await user.click(screen.getByRole('button', { name: 'Delete Groceries' }));
    await screen.findByRole('alertdialog', { name: 'Tell the bookkeeper?' });
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    await waitFor(() => {
      expect(onAnswer).toHaveBeenCalledExactlyOnceWith(false);
    });
    await waitFor(() => {
      expect(trigger).toHaveFocus();
    });
  });

  it('keeps a chained run in the first trigger’s scope, and gives focus back to it, under Strict Mode', async () => {
    // Strict Mode rehearses an unmount as each panel mounts, which must not end the run.
    const user = userEvent.setup();
    const onAnswer = vi.fn<(answer: boolean) => void>();
    render(
      <StrictMode>
        <Chained onAnswer={onAnswer} />
      </StrictMode>,
    );
    const trigger = screen.getByRole('button', { name: 'Delete' });
    await user.click(trigger);
    expect(panel()).toHaveAttribute('data-theme', 'dark');
    await user.click(screen.getByRole('button', { name: 'Delete Groceries' }));
    await screen.findByRole('alertdialog', { name: 'Tell the bookkeeper?' });
    expect(panel()).toHaveAttribute('data-theme', 'dark');
    expect(panel()).toHaveAttribute('data-shape', 'square');
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    await waitFor(() => {
      expect(onAnswer).toHaveBeenCalledExactlyOnceWith(false);
    });
    await waitFor(() => {
      expect(trigger).toHaveFocus();
    });
  });

  it('gives focus back to the first trigger without scrolling the page to it', async () => {
    const user = userEvent.setup();
    render(<Chained onAnswer={vi.fn()} />);
    const trigger = screen.getByRole('button', { name: 'Delete' });
    const focus = vi.spyOn(trigger, 'focus');
    await user.click(trigger);
    await user.click(screen.getByRole('button', { name: 'Delete Groceries' }));
    await screen.findByRole('alertdialog', { name: 'Tell the bookkeeper?' });
    // The hook's own hand-back as the first panel leaves, as React Aria's restore does it. In jsdom React Aria
    // focuses with no options, so this call is the hook's.
    expect(focus).toHaveBeenCalledWith({ preventScroll: true });
  });

  it('answers false at once when asked after the component has unmounted', async () => {
    const { result, unmount } = renderHook(() => useConfirm());
    const { confirm } = result.current;
    unmount();
    await expect(confirm(QUESTION)).resolves.toBe(false);
  });
});
