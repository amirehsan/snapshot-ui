import type { Meta, StoryObj } from '@storybook/react-vite';
import { Kbd } from './Kbd';

const meta = {
  title: 'Components/Kbd',
  component: Kbd,
  args: { children: 'Esc' },
} satisfies Meta<typeof Kbd>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** One key per element, so a shortcut is as many keys as it has. */
export const Shortcut: Story = {
  render: () => (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
      <Kbd>&#8984;</Kbd>
      <Kbd>K</Kbd>
    </span>
  ),
};

/** The search palette's footer: arrows, then Enter, each a key of the same height. */
export const Arrows: Story = {
  render: () => (
    <p style={{ margin: 0, display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
      <Kbd>&#8593;</Kbd>
      <Kbd>&#8595;</Kbd>
      <span>to move</span>
      <Kbd>&#8629;</Kbd>
      <span>to open</span>
    </p>
  ),
};

/** A key with a long name wraps instead of pushing a narrow screen sideways. */
export const LongText: Story = {
  args: { children: 'Control Option Shift Command Return Escape Backspace Delete Tab Home End' },
  render: (args) => (
    <p style={{ margin: 0 }}>
      Press <Kbd {...args} /> to carry on.
    </p>
  ),
};
