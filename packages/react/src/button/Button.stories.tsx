import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState, useTransition, type ReactElement } from 'react';
import { expect, fn, waitFor, within } from 'storybook/test';
import { Dialog } from '../dialog';
import { Button } from './Button';

const meta = {
  title: 'Components/Button',
  component: Button,
  args: { children: 'Save changes', onPress: fn() },
  argTypes: {
    variant: { control: 'inline-radio', options: ['primary', 'secondary', 'tertiary', 'danger'] },
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = { tags: ['density'] };

export const Secondary: Story = { tags: ['density'], args: { variant: 'secondary', children: 'Preview' } };

export const Tertiary: Story = { args: { variant: 'tertiary', children: 'Discard' } };

export const Danger: Story = { args: { variant: 'danger', children: 'Delete site' } };

export const Disabled: Story = { args: { isDisabled: true } };

export const Pending: Story = { args: { isPending: true, pendingLabel: 'Saving' } };

export const Pressed: Story = {
  // A press is transient, so no screenshot can hold it. The story test still asserts it.
  tags: ['no-visual'],
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Save changes' }));
    await expect(args.onPress).toHaveBeenCalledOnce();
  },
};

/** The ring sits outside the pill, so ink still reads against the page. */
export const KeyboardFocus: Story = {
  play: async ({ canvas, userEvent }) => {
    await userEvent.tab();
    await expect(canvas.getByRole('button')).toHaveFocus();
  },
};

/** A light card inside a dark page takes its own tokens and its own text color. */
export const NestedThemes: Story = {
  render: (args) => (
    <div data-theme="dark" style={{ padding: 24, background: 'var(--color-canvas)' }}>
      <Button {...args} />
      <div data-theme="light" style={{ marginTop: 16, padding: 24, background: 'var(--color-lifted)' }}>
        <p data-testid="nested-text" style={{ margin: '0 0 12px' }}>
          A light card inside a dark page
        </p>
        <Button {...args} variant="secondary" />
      </div>
    </div>
  ),
};

const LONG = { timeout: 5000 };

/**
 * A Dialog rendered only while open, whose Save is pending while it saves; a save that settles closes the
 * Dialog, which unmounts the Save.
 */
function SaveClosesDialog(): ReactElement {
  const [isOpen, setIsOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  return (
    <>
      <Button
        variant="secondary"
        onPress={() => {
          setIsOpen(true);
        }}
      >
        Add a note
      </Button>
      {isOpen ? (
        <Dialog
          isOpen
          onOpenChange={setIsOpen}
          title="Add a note"
          actions={
            <Button
              isPending={pending}
              pendingLabel="Saving"
              onPress={() => {
                startTransition(async () => {
                  await new Promise((resolve) => setTimeout(resolve, 300));
                  setIsOpen(false);
                });
              }}
            >
              Save note
            </Button>
          }
        >
          <p style={{ margin: 0 }}>The note is kept with the transaction.</p>
        </Dialog>
      ) : null}
    </>
  );
}

/**
 * A pending Save that holds focus is said by React Aria's live announcer through the button's ids, and the
 * announcer keeps the sentence for seconds. The save closes the Dialog, which takes those ids away, so the
 * Button writes the sentence's words onto it in their place: axe, run after the play, reads a named sentence.
 */
export const PendingSaveClosesDialog: Story = {
  tags: ['no-visual', 'webkit', 'firefox'],
  render: () => <SaveClosesDialog />,
  play: async ({ canvas, userEvent }) => {
    const page = within(document.body);
    await userEvent.click(canvas.getByRole('button', { name: 'Add a note' }));
    const save = await page.findByRole('button', { name: 'Save note' }, LONG);
    await userEvent.click(save);
    await waitFor(() => expect(save).toHaveAttribute('data-pending', 'true'), LONG);
    const ids = save.getAttribute('aria-labelledby') ?? '';
    await expect(ids).not.toBe('');
    // The start, said by the pending button's ids while it holds focus.
    const sentence = await waitFor(() => {
      const found = document.querySelector(
        `[data-live-announcer] [role="img"][aria-labelledby="${CSS.escape(ids)}"]`,
      );
      if (!found) throw new Error(`Nothing said by ${ids}`);
      return found;
    }, LONG);
    await waitFor(() => expect(page.queryByRole('dialog')).toBeNull(), LONG);
    await waitFor(() => expect(sentence).toHaveAttribute('aria-label', 'Save note Saving'), LONG);
    await expect(sentence).not.toHaveAttribute('aria-labelledby');
    await expect(sentence.isConnected).toBe(true);
  },
};
