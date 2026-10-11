import type { Meta, StoryObj } from '@storybook/react-vite';
import { Eyebrow } from './Eyebrow';
import { Heading } from './Heading';

const meta = {
  title: 'Components/Eyebrow',
  component: Eyebrow,
  args: { children: 'Components' },
  argTypes: {
    as: { control: 'inline-radio', options: ['p', 'span', 'div'] },
  },
} satisfies Meta<typeof Eyebrow>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** The dot hangs into the gutter, so the label lines up with the heading below it. */
export const AboveHeading: Story = {
  render: (args) => (
    <div style={{ display: 'grid', gap: 8 }}>
      <Eyebrow {...args} />
      <Heading level={2}>Everything a dashboard asks for.</Heading>
    </div>
  ),
};
