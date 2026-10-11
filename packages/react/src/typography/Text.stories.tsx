import type { Meta, StoryObj } from '@storybook/react-vite';
import { Text } from './Text';

const meta = {
  title: 'Components/Text',
  component: Text,
  args: { children: 'Changes apply to everyone in the workspace.' },
  argTypes: {
    as: { control: 'inline-radio', options: ['p', 'span', 'div'] },
    size: { control: 'inline-radio', options: ['body', 'small'] },
    tone: { control: 'inline-radio', options: ['default', 'muted'] },
  },
} satisfies Meta<typeof Text>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Body: Story = {};

/** 14px, for hints and helper lines. */
export const Small: Story = { args: { size: 'small' } };

/** Slate, for secondary text. Never taupe, which is for placeholders and disabled text. */
export const Muted: Story = { args: { tone: 'muted' } };

export const SmallMuted: Story = { args: { size: 'small', tone: 'muted' } };

/** A paragraph wraps at the width it is given and keeps the body line height. */
export const LongParagraph: Story = {
  args: {
    children:
      'Notifications are sent to the address on your account. Turn a channel off and its messages stop at once, while anything already queued is still delivered. You can change this at any time from the settings page.',
  },
};
