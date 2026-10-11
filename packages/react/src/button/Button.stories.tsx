import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn } from 'storybook/test';
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

export const Primary: Story = {};

export const Secondary: Story = { args: { variant: 'secondary', children: 'Preview' } };

export const Tertiary: Story = { args: { variant: 'tertiary', children: 'Discard' } };

export const Danger: Story = { args: { variant: 'danger', children: 'Delete site' } };

export const Disabled: Story = { args: { isDisabled: true } };

export const Pending: Story = { args: { isPending: true, pendingLabel: 'Saving' } };

export const Pressed: Story = {
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
