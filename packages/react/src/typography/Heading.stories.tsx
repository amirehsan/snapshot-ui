import type { Meta, StoryObj } from '@storybook/react-vite';
import { Heading } from './Heading';

const meta = {
  title: 'Components/Heading',
  component: Heading,
  args: { children: 'Notification settings' },
  argTypes: {
    level: { control: 'inline-radio', options: [1, 2, 3, 4] },
    size: { control: 'inline-radio', options: [1, 2, 3, 4] },
  },
} satisfies Meta<typeof Heading>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Level 2, drawn in the 36px section step. */
export const Section: Story = {};

/** The 64px display step. It is 48px under 1024px and 40px under 768px. */
export const Display: Story = { args: { level: 1 } };

/** The 24px step, for the title of a card. */
export const CardTitle: Story = { args: { level: 3 } };

/** The 14px bold subhead. */
export const Subhead: Story = { args: { level: 4 } };

/** The element places the heading in the outline and the size sets the look, so they can differ. */
export const LevelAndSizeApart: Story = { args: { level: 3, size: 1 } };

/** A long title wraps and keeps its tight line height. */
export const LongTitle: Story = {
  args: { level: 1, children: 'Calm interfaces for settings, dashboards and apps.' },
};
