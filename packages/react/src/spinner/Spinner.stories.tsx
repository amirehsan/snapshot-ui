import type { Meta, StoryObj } from '@storybook/react-vite';
import { Spinner } from './Spinner';

const meta = {
  title: 'Components/Spinner',
  component: Spinner,
} satisfies Meta<typeof Spinner>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Inline, it takes the size and color of the text around it. */
export const Inline: Story = {
  render: (args) => (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 16 }}>
      Saving <Spinner {...args} />
    </span>
  ),
};

export const Medium: Story = { args: { size: 'md' } };

export const Large: Story = { args: { size: 'lg' } };
