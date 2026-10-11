import type { Meta, StoryObj } from '@storybook/react-vite';
import { Bell, ExternalLink, Menu, Search, Settings, X } from 'lucide-react';
import { expect, fn } from 'storybook/test';
import { IconButton } from './IconButton';

const meta = {
  title: 'Components/IconButton',
  component: IconButton,
  args: { 'aria-label': 'Search', children: <Search />, onPress: fn() },
  argTypes: {
    variant: { control: 'inline-radio', options: ['ghost', 'outline'] },
  },
} satisfies Meta<typeof IconButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Ghost: Story = {};

export const Outline: Story = { args: { variant: 'outline' } };

export const Disabled: Story = {
  render: (args) => (
    <div style={{ display: 'flex', gap: 12 }}>
      <IconButton {...args} isDisabled />
      <IconButton {...args} variant="outline" isDisabled />
    </div>
  ),
};

/** Given an `href` it renders an anchor with the same classes. */
export const AsLink: Story = {
  args: {
    href: 'https://github.com/amirehsan/snapshot-ui',
    'aria-label': 'Snapshot UI on GitHub',
    children: <ExternalLink />,
  },
};

const ICONS = [
  ['Search', Search],
  ['Notifications', Bell],
  ['Settings', Settings],
  ['Menu', Menu],
  ['Close', X],
] as const;

export const Row: Story = {
  render: () => (
    <div style={{ display: 'grid', gap: 16 }}>
      {(['ghost', 'outline'] as const).map((variant) => (
        <div key={variant} style={{ display: 'flex', gap: 12 }}>
          {ICONS.map(([name, Icon]) => (
            <IconButton key={name} variant={variant} aria-label={name}>
              <Icon />
            </IconButton>
          ))}
        </div>
      ))}
    </div>
  ),
};

export const Pressed: Story = {
  // A press is transient, so no screenshot can hold it. The story test still asserts it.
  tags: ['no-visual'],
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Search' }));
    await expect(args.onPress).toHaveBeenCalledOnce();
  },
};

/** The ring sits outside the circle, so ink still reads against the page. */
export const KeyboardFocus: Story = {
  play: async ({ canvas, userEvent }) => {
    await userEvent.tab();
    await expect(canvas.getByRole('button')).toHaveFocus();
  },
};
