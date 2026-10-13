import type { Meta, StoryObj } from '@storybook/react-vite';
import { useEffect, useRef, useState, type ReactElement } from 'react';
import { expect, waitFor, within } from 'storybook/test';
import { Button } from '../button';
import { Card, CardBody } from '../card';
import { tokenColor } from '../stories/paint';
import { ConfirmDialog, type ConfirmDialogProps } from './ConfirmDialog';
import { Dialog, DialogTrigger } from './Dialog';
import { useConfirm } from './useConfirm';

/** The one element on the page that matches `selector`, wherever the overlay portaled it. */
function only(selector: string): HTMLElement {
  const found = document.querySelectorAll<HTMLElement>(selector);
  const [first] = found;
  if (found.length !== 1 || !first)
    throw new Error(`Expected one ${selector}, found ${String(found.length)}`);
  return first;
}

/**
 * Resolves once the open panel has entered and every transition on it and inside it has finished, so a play
 * reads it at rest.
 */
async function atRest(): Promise<HTMLElement> {
  const panel = await waitFor(async () => {
    const found = only('.dialog');
    await expect(found).not.toHaveAttribute('data-entering');
    return found;
  });
  await Promise.all(
    panel.getAnimations({ subtree: true }).map((animation) => animation.finished.catch(() => null)),
  );
  return panel;
}

/** A trigger and its confirm dialog, open on the first render. */
function Opened({ trigger = 'Delete', ...args }: ConfirmDialogProps & { trigger?: string }): ReactElement {
  return (
    <DialogTrigger defaultOpen>
      <Button variant="secondary">{trigger}</Button>
      <ConfirmDialog {...args} />
    </DialogTrigger>
  );
}

const meta = {
  title: 'Components/ConfirmDialog',
  component: ConfirmDialog,
  args: {
    title: 'Delete these transactions?',
    description: 'They leave every report, with their notes. This cannot be undone.',
    confirmLabel: 'Delete 3 transactions',
    tone: 'danger',
  },
  parameters: {
    // Every story opens a modal, and a docs page that drew them inline would open them all at once.
    docs: { story: { inline: false, height: '400px' } },
  },
} satisfies Meta<typeof ConfirmDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * A question that loses something: the warning triangle in the error well, Cancel first and focused, and the
 * danger Button named by what it does.
 */
export const Danger: Story = {
  render: (args) => <Opened {...args} />,
  play: async () => {
    const body = within(document.body);
    await waitFor(() => expect(body.getByRole('button', { name: 'Cancel' })).toHaveFocus());
    await expect(body.getByRole('button', { name: 'Delete 3 transactions' })).toHaveClass('button-danger');
    await expect(body.getByRole('alertdialog')).toHaveAccessibleDescription(
      'They leave every report, with their notes. This cannot be undone.',
    );
  },
};

/** A question that loses nothing: no well, and the primary Button, focused. */
export const Default: Story = {
  args: {
    title: 'Send the invoice now?',
    description: 'The client gets it by email at once, and it can no longer be edited.',
    confirmLabel: 'Send invoice',
    tone: 'default',
  },
  render: (args) => <Opened {...args} trigger="Send" />,
  play: async () => {
    const body = within(document.body);
    await waitFor(() => expect(body.getByRole('button', { name: 'Send invoice' })).toHaveFocus());
    await expect(body.getByRole('button', { name: 'Send invoice' })).toHaveClass('button-primary');
    await expect(document.querySelector('.dialog-well')).toBeNull();
  },
};

/**
 * Pending from outside: the spinner in the confirm button with its label kept, Cancel disabled, and Escape
 * leaving it open. The safe answer cannot take focus, so the alert dialog itself does: its title and
 * description are read, and Tab reaches the pending button.
 */
export const Pending: Story = {
  args: { isPending: true, pendingLabel: 'Deleting' },
  render: (args) => <Opened {...args} />,
  play: async ({ userEvent }) => {
    const body = within(document.body);
    const confirm = body.getByRole('button', { name: /Delete 3 transactions/ });
    await expect(confirm).toHaveAttribute('data-pending', 'true');
    await expect(confirm).toHaveAccessibleName('Delete 3 transactions Deleting');
    await expect(body.getByRole('button', { name: 'Cancel' })).toBeDisabled();
    await waitFor(() => expect(body.getByRole('alertdialog')).toHaveFocus());
    await userEvent.keyboard('{Escape}');
    await expect(body.getByRole('alertdialog')).toBeInTheDocument();
  },
};

/**
 * A confirm opened from a trigger in a dark card is dark, and square, while the page is light, though a
 * button inside takes focus as it opens. The play opens it from the keyboard, so the trigger holds focus when
 * the panel attaches: that is the origin the panel copies its scope from.
 */
export const InDarkScope: Story = {
  tags: ['no-visual'],
  render: (args) => (
    <div
      data-theme="dark"
      data-shape="square"
      data-testid="dark-scope"
      style={{ padding: 24, background: 'var(--color-canvas)' }}
    >
      <Card>
        <CardBody>
          <p>Three transactions are selected.</p>
          <DialogTrigger>
            <Button variant="danger">Delete</Button>
            <ConfirmDialog {...args} />
          </DialogTrigger>
        </CardBody>
      </Card>
    </div>
  ),
  play: async ({ canvas, userEvent }) => {
    await userEvent.tab();
    await expect(canvas.getByRole('button', { name: 'Delete' })).toHaveFocus();
    await userEvent.keyboard('{Enter}');
    const panel = await atRest();
    await expect(panel).toHaveAttribute('data-theme', 'dark');
    await expect(panel).toHaveAttribute('data-shape', 'square');
    await expect(only('.dialog-overlay')).not.toHaveAttribute('data-theme');
    await expect(within(document.body).getByRole('button', { name: 'Cancel' })).toHaveFocus();
    const scope = canvas.getByTestId('dark-scope');
    await expect(getComputedStyle(panel).backgroundColor).toBe(tokenColor('--color-float', scope));
  },
};

/**
 * A confirm opened from a dialog's action row: two dialogs, one scrim, focus on Cancel, and Escape answers the
 * confirm only and gives focus back to its trigger in the dialog, which stays open.
 */
export const FromADialog: Story = {
  tags: ['no-visual'],
  args: { title: 'Delete the rule?', description: 'Payments it sorted keep their category.' },
  render: (args) => (
    <DialogTrigger defaultOpen>
      <Button variant="secondary">Edit the rule</Button>
      <Dialog
        title="Edit the rule"
        description="Payments from this merchant are filed under Groceries."
        actions={
          <>
            <DialogTrigger>
              <Button variant="danger">Delete</Button>
              <ConfirmDialog {...args} confirmLabel="Delete the rule" tone="danger" />
            </DialogTrigger>
            <Button slot="close">Save</Button>
          </>
        }
      />
    </DialogTrigger>
  ),
  play: async ({ userEvent }) => {
    const body = within(document.body);
    const trigger = body.getByRole('button', { name: 'Delete' });
    await waitFor(() => expect(body.getByRole('dialog', { name: 'Edit the rule' })).toHaveFocus());
    await userEvent.tab();
    await expect(trigger).toHaveFocus();
    await userEvent.keyboard('{Enter}');
    await waitFor(() => expect(document.querySelectorAll('.dialog')).toHaveLength(2));
    await expect(body.getByRole('alertdialog', { name: 'Delete the rule?' })).toBeInTheDocument();
    const [, confirmScrim] = [...document.querySelectorAll<HTMLElement>('.dialog-overlay')];
    if (!confirmScrim) throw new Error('No second scrim');
    await waitFor(() => expect(confirmScrim).not.toHaveAttribute('data-entering'));
    await expect(confirmScrim).toHaveAttribute('data-stacked');
    await expect(getComputedStyle(confirmScrim).backgroundColor).toBe('rgba(0, 0, 0, 0)');
    await waitFor(() => expect(body.getByRole('button', { name: 'Cancel' })).toHaveFocus());
    await userEvent.keyboard('{Escape}');
    // Focus is on Delete as soon as the confirm has left the page, not a frame later: the dialog takes focus
    // from the body 500ms after it opens, and on a slow machine the confirm leaves near that moment.
    await waitFor(() => expect(document.querySelectorAll('.dialog')).toHaveLength(1));
    await expect(trigger).toHaveFocus();
    await expect(body.getByRole('dialog', { name: 'Edit the rule' })).toBeInTheDocument();
  },
};

/** The rows the hook story asks about. */
const ROWS = ['Rent', 'Groceries', 'Insurance'];

/**
 * A list whose rows each ask before they go, through `useConfirm`. A removed row takes its Delete button with
 * it, so the list puts focus on the next row's button, or the one before when the last row goes.
 */
function Transactions(): ReactElement {
  const [rows, setRows] = useState(ROWS);
  const { confirm, dialog } = useConfirm();
  const buttons = useRef(new Map<string, HTMLButtonElement>());
  // Where the removed row was, until the render without it has put focus on the row in its place.
  const removed = useRef<number | null>(null);
  useEffect(() => {
    const index = removed.current;
    if (index === null) return;
    removed.current = null;
    const next = rows[index] ?? rows[index - 1];
    if (next !== undefined) buttons.current.get(next)?.focus();
  }, [rows]);
  const remove = async (name: string): Promise<void> => {
    const isSure = await confirm({
      title: `Delete ${name}?`,
      description: 'It leaves every report, with its notes.',
      confirmLabel: `Delete ${name}`,
      tone: 'danger',
    });
    if (!isSure) return;
    removed.current = rows.indexOf(name);
    setRows(rows.filter((row) => row !== name));
  };
  return (
    <>
      <ul
        aria-label="Transactions"
        style={{ display: 'grid', gap: 8, margin: 0, padding: 0, listStyle: 'none' }}
      >
        {rows.map((row) => (
          <li key={row} style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            <span style={{ minWidth: '8rem' }}>{row}</span>
            <Button
              variant="secondary"
              aria-label={`Delete ${row}`}
              ref={(element) => {
                if (element) buttons.current.set(row, element);
                else buttons.current.delete(row);
              }}
              onPress={() => {
                void remove(row);
              }}
            >
              Delete
            </Button>
          </li>
        ))}
      </ul>
      {dialog}
    </>
  );
}

/** The second question of a run, which loses nothing. */
const FOLLOW_UP = {
  title: 'Tell the bookkeeper?',
  description: 'They get an email saying the transactions were removed.',
  confirmLabel: 'Send the email',
  tone: 'default',
} as const;

/** A button in a dark scope that asks, and when the answer is yes, chains a second question. */
function ChainedQuestions(props: ConfirmDialogProps): ReactElement {
  const { confirm, dialog } = useConfirm();
  const ask = async (): Promise<void> => {
    if (await confirm(props)) await confirm(FOLLOW_UP);
  };
  return (
    <div data-theme="dark" style={{ padding: 24, background: 'var(--color-canvas)' }}>
      <Button
        variant="danger"
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

/**
 * A run of two questions from code, the second chained after the first is confirmed: it opens in the dark
 * scope of the trigger and starts on its own answer. When it is answered, the panel and the scrim play their
 * exit before they leave, and focus goes back to the trigger.
 */
export const HookChain: Story = {
  tags: ['no-visual'],
  render: (args) => <ChainedQuestions {...args} />,
  play: async ({ canvas, userEvent }) => {
    const body = within(document.body);
    const trigger = canvas.getByRole('button', { name: 'Delete' });
    await userEvent.click(trigger);
    const first = await body.findByRole('alertdialog', { name: 'Delete these transactions?' });
    // Answer once the panel has come in, as a person does, so the first one's exit is still playing when the
    // second is asked: the overlay stays, and only the question in it changes.
    await atRest();
    await userEvent.click(within(first).getByRole('button', { name: 'Delete 3 transactions' }));
    const second = await body.findByRole('alertdialog', { name: 'Tell the bookkeeper?' });
    await waitFor(() => expect(within(second).getByRole('button', { name: 'Send the email' })).toHaveFocus());
    const panel = await atRest();
    await expect(panel).toHaveAttribute('data-theme', 'dark');

    // Watch the overlay leave: each part must be drawn exiting before it goes.
    const exiting = new Set<string>();
    const watch = new MutationObserver(() => {
      if (document.querySelector('.dialog[data-exiting]')) exiting.add('panel');
      if (document.querySelector('.dialog-overlay[data-exiting]')) exiting.add('scrim');
    });
    watch.observe(document.body, { subtree: true, childList: true, attributes: true });
    try {
      await userEvent.click(within(second).getByRole('button', { name: 'Cancel' }));
      await waitFor(() => expect(document.querySelector('.dialog-overlay')).toBeNull());
    } finally {
      watch.disconnect();
    }
    await expect([...exiting].sort()).toEqual(['panel', 'scrim']);
    await waitFor(() => expect(trigger).toHaveFocus());
  },
};

/**
 * Asking from code: Cancel keeps the row and focus goes back to its button; the confirm removes it and the
 * list puts focus on the next row's button.
 */
export const HookFlow: Story = {
  tags: ['no-visual'],
  render: () => <Transactions />,
  play: async ({ canvas, userEvent }) => {
    const body = within(document.body);
    const groceries = canvas.getByRole('button', { name: 'Delete Groceries' });
    await userEvent.click(groceries);
    const dialog = await body.findByRole('alertdialog', { name: 'Delete Groceries?' });
    await userEvent.click(within(dialog).getByRole('button', { name: 'Cancel' }));
    await waitFor(() => expect(body.queryByRole('alertdialog')).not.toBeInTheDocument());
    await expect(canvas.getAllByRole('listitem')).toHaveLength(3);
    await waitFor(() => expect(groceries).toHaveFocus());

    await userEvent.click(groceries);
    const again = await body.findByRole('alertdialog', { name: 'Delete Groceries?' });
    await userEvent.click(within(again).getByRole('button', { name: 'Delete Groceries' }));
    await waitFor(() => expect(canvas.getAllByRole('listitem')).toHaveLength(2));
    await waitFor(() => expect(canvas.getByRole('button', { name: 'Delete Insurance' })).toHaveFocus());
  },
};
