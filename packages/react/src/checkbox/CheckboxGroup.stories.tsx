import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ComponentType } from 'react';
import { expect } from 'storybook/test';
import { tokenColor } from '../stories/paint';
import { Checkbox } from './Checkbox';
import { CheckboxGroup, type CheckboxGroupBaseProps } from './CheckboxGroup';

const meta = {
  title: 'Components/CheckboxGroup',
  // The component's props are a union, since it needs a name, and Storybook cannot narrow a union.
  // The stories are written against the props every member shares.
  component: CheckboxGroup as ComponentType<CheckboxGroupBaseProps>,
  args: {
    label: 'Notify me by',
    children: [
      <Checkbox key="email" value="email">
        Email
      </Checkbox>,
      <Checkbox key="sms" value="sms">
        Text message
      </Checkbox>,
      <Checkbox key="push" value="push">
        Push notification
      </Checkbox>,
    ],
  },
  argTypes: {
    orientation: { control: 'inline-radio', options: ['vertical', 'horizontal'] },
  },
  decorators: [
    (Story) => (
      <div style={{ width: 'min(28rem, calc(100vw - 2rem))' }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<CheckboxGroupBaseProps>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A label, then the boxes one under the other. Each row is its own tab stop. */
export const Default: Story = {
  args: { defaultValue: ['email'] },
  play: async ({ canvas }) => {
    const group = canvas.getByRole('group', { name: 'Notify me by' });
    await expect(group).toHaveAttribute('data-orientation', 'vertical');
    await expect(canvas.getAllByRole('checkbox')).toHaveLength(3);
    await expect(canvas.getByRole('checkbox', { name: 'Email' })).toBeChecked();
    // The rows stack: each one starts below the one before it.
    const tops = canvas
      .getAllByRole('checkbox')
      .map((box) => box.closest('label')?.getBoundingClientRect().top);
    await expect(tops).toEqual([...tops].sort((a, b) => (a ?? 0) - (b ?? 0)));
    await expect(new Set(tops).size).toBe(3);
  },
};

/** The same group laid out in a row, wrapping when the row is full. */
export const Horizontal: Story = {
  args: { orientation: 'horizontal', defaultValue: ['sms'] },
  play: async ({ canvas }) => {
    const group = canvas.getByRole('group', { name: 'Notify me by' });
    await expect(group).toHaveAttribute('data-orientation', 'horizontal');
    const tops = canvas
      .getAllByRole('checkbox')
      .map((box) => box.closest('label')?.getBoundingClientRect().top);
    await expect(new Set(tops).size).toBe(1);
  },
};

/** A hint for the group and one for a single row. */
export const WithDescription: Story = {
  args: {
    description: 'Security alerts are always sent by email.',
    children: [
      <Checkbox key="email" value="email" description="Receipts, invoices and password resets.">
        Email
      </Checkbox>,
      <Checkbox key="sms" value="sms">
        Text message
      </Checkbox>,
    ],
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('group')).toHaveAccessibleDescription(
      'Security alerts are always sent by email.',
    );
    await expect(canvas.getByRole('checkbox', { name: 'Email' })).toHaveAccessibleDescription(
      'Receipts, invoices and password resets. Security alerts are always sent by email.',
    );
  },
};

/**
 * `isChanged` shows the clay chip beside the label and has a screen reader read
 * it. The boxes keep their edges: the cue marks the field, not each box.
 */
export const Changed: Story = {
  args: { isChanged: true, defaultValue: ['email', 'push'] },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('Changed')).toBeVisible();
    await expect(canvas.getByRole('group')).toHaveAccessibleDescription('Changed');
    const box = canvas
      .getByRole('checkbox', { name: 'Text message' })
      .closest('label')
      ?.querySelector('.checkbox-box');
    if (!box) throw new Error('No box');
    await expect(getComputedStyle(box).borderTopColor).toBe(tokenColor('--color-boundary'));
  },
};

/** Invalid shows the error line and turns every box's edge to the error color. */
export const Invalid: Story = {
  args: { isInvalid: true, errorMessage: 'Pick at least one way to be notified.' },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('Pick at least one way to be notified.')).toBeVisible();
    for (const input of canvas.getAllByRole('checkbox')) {
      await expect(input).toBeInvalid();
      const box = input.closest('label')?.querySelector('.checkbox-box');
      if (!box) throw new Error('No box');
      await expect(getComputedStyle(box).borderTopColor).toBe(tokenColor('--color-error'));
    }
  },
};

/** Invalid outranks changed: the chip leaves and the error shows. */
export const InvalidAndChanged: Story = {
  args: { isInvalid: true, isChanged: true, errorMessage: 'Pick at least one way to be notified.' },
  play: async ({ canvas }) => {
    await expect(canvas.queryByText('Changed')).not.toBeInTheDocument();
    await expect(canvas.getByRole('group')).toHaveAccessibleDescription(
      'Pick at least one way to be notified.',
    );
  },
};

/** Every box is disabled together. */
export const Disabled: Story = {
  args: { isDisabled: true, defaultValue: ['email'] },
  play: async ({ canvas }) => {
    for (const input of canvas.getAllByRole('checkbox')) await expect(input).toBeDisabled();
    const box = canvas
      .getByRole('checkbox', { name: 'Email' })
      .closest('label')
      ?.querySelector('.checkbox-box');
    if (!box) throw new Error('No box');
    await expect(getComputedStyle(box).backgroundColor).toBe(tokenColor('--color-disabled'));
  },
};

/** Long labels in a row wrap inside their own box and drop to the next row, with no sideways scroll at 375px. */
export const LongLabels: Story = {
  args: {
    label: 'Which of these should we include in your weekly summary email?',
    orientation: 'horizontal',
    isChanged: true,
    defaultValue: ['pages'],
    children: [
      <Checkbox key="pages" value="pages">
        Every page that anyone on your team edited
      </Checkbox>,
      <Checkbox key="comments" value="comments">
        Comments and replies from reviewers
      </Checkbox>,
      <Checkbox key="traffic" value="traffic">
        Traffic
      </Checkbox>,
    ],
  },
  play: async ({ canvas }) => {
    const group = canvas.getByRole('group');
    await expect(group.scrollWidth).toBeLessThanOrEqual(group.clientWidth);
  },
};

/** Tab visits each box, Space toggles it, and the arrow keys do nothing. */
export const Keyboard: Story = {
  tags: ['no-visual'],
  args: { defaultValue: [] },
  play: async ({ canvas, userEvent }) => {
    const [email, sms] = canvas.getAllByRole('checkbox');
    await userEvent.tab();
    await expect(email).toHaveFocus();
    await userEvent.keyboard('{ArrowDown}{ArrowRight}');
    await expect(email).toHaveFocus();
    await userEvent.tab();
    await expect(sms).toHaveFocus();
    await userEvent.keyboard(' ');
    await expect(sms).toBeChecked();
    await expect(email).not.toBeChecked();
  },
};
