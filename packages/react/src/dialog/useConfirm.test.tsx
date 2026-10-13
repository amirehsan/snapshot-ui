import { act, render, renderHook, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useLayoutEffect, type ReactElement } from 'react';
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

  it('has no dialog again once the question is answered', async () => {
    const user = userEvent.setup();
    const { latest } = await asked(user);
    expect(latest().dialog).not.toBeNull();
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(latest().dialog).toBeNull();
    expect(document.querySelector('.dialog-overlay')).not.toBeInTheDocument();
  });
});
