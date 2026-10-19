import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState, type ReactElement } from 'react';
import { expect, fn, waitFor } from 'storybook/test';
import { focusOn } from '../stories/focus';
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

/** A Save that goes pending on a press and leaves when its save settles, as a dialog's Save does as it closes. */
function SavesAndLeaves(): ReactElement {
  const [state, setState] = useState<'idle' | 'saving' | 'saved'>('idle');
  if (state === 'saved') return <p style={{ margin: 0 }}>Saved</p>;
  return (
    <Button
      isPending={state === 'saving'}
      pendingLabel="Saving"
      onPress={() => {
        setState('saving');
        setTimeout(() => {
          setState('saved');
        }, 300);
      }}
    >
      Add plan
    </Button>
  );
}

/**
 * A focused Save goes pending and then leaves. React Aria says the pending start by ids in the button and keeps
 * the sentence for seconds; once the button has gone, the sentence still says "Add plan Saving" and names no id
 * that has gone, so the axe check after the play finds nothing.
 */
export const PendingWhenItLeaves: Story = {
  tags: ['no-visual', 'webkit', 'firefox'],
  render: () => <SavesAndLeaves />,
  play: async ({ canvas, userEvent }) => {
    const button = canvas.getByRole('button', { name: 'Add plan' });
    await focusOn(button);
    await userEvent.keyboard('{Enter}');
    await waitFor(() => expect(canvas.getByText('Saved')).toBeVisible(), { timeout: 5000 });
    const sentences = (): Element[] => [...document.querySelectorAll('[data-live-announcer] [role="img"]')];
    await waitFor(
      () => expect(sentences().map((said) => said.getAttribute('aria-label'))).toContain('Add plan Saving'),
      { timeout: 5000 },
    );
    // No sentence names an id that has gone with the button.
    const gone = sentences()
      .flatMap((said) => (said.getAttribute('aria-labelledby') ?? '').split(' ').filter(Boolean))
      .filter((id) => document.getElementById(id) === null);
    await expect(gone).toEqual([]);
  },
};
