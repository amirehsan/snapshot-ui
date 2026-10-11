import type { Meta, StoryObj } from '@storybook/react-vite';
import { Badge } from './Badge';

const meta = {
  title: 'Components/Badge',
  component: Badge,
  args: { children: 'Beta' },
  argTypes: {
    tone: { control: 'inline-radio', options: ['neutral', 'info', 'success', 'error'] },
  },
} satisfies Meta<typeof Badge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Neutral: Story = {};

export const Info: Story = { args: { tone: 'info', children: 'New' } };

export const Success: Story = { args: { tone: 'success', children: 'Published' } };

export const ErrorTone: Story = { args: { tone: 'error', children: 'Failed' } };

/** Tabular figures keep a column of counts lined up, whatever the digits. */
export const Counts: Story = {
  render: () => (
    <div style={{ display: 'grid', gap: 8, width: 'max-content' }}>
      {(
        [
          ['Inbox', 12],
          ['Drafts', 8],
          ['Sent', 1204],
        ] as const
      ).map(([name, count]) => (
        <div key={name} style={{ display: 'flex', justifyContent: 'space-between', gap: 24 }}>
          <span>{name}</span>
          <Badge>{count}</Badge>
        </div>
      ))}
    </div>
  ),
};

/** A long label wraps inside its outline, even an unbroken run, instead of pushing a narrow screen sideways. */
export const LongText: Story = {
  args: {
    tone: 'info',
    children:
      'A label long enough to wrap onto several lines on a phone, with an unbroken run of lettersaftertheendwithnothingtobreakatsothelabelmustwrapinsidetheoutline',
  },
};
