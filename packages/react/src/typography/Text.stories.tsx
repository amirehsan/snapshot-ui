import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';
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

/** A word of 75 letters with no hyphen and no space, so the only way to fit it is to break it. */
const UNBROKEN_WORD = 'workspacenotificationpreferencesforeverymemberandeveryprojectyoucreatelater';

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

/**
 * A word with no break in it breaks anywhere, so it stays inside the width it
 * is given. The visual suite shoots every story at 375px.
 */
export const LongWord: Story = {
  args: { children: UNBROKEN_WORD },
  render: (args) => (
    <div data-testid="frame" style={{ width: 'min(480px, calc(100vw - 48px))' }}>
      <Text {...args} />
    </div>
  ),
  play: async ({ canvas }) => {
    const frame = canvas.getByTestId('frame');
    const text = canvas.getByText(UNBROKEN_WORD);
    // A word that cannot break pokes out of its box, or widens the box past the frame that holds it.
    await expect(text.scrollWidth).toBeLessThanOrEqual(text.clientWidth);
    await expect(frame.scrollWidth).toBeLessThanOrEqual(frame.clientWidth);
  },
};
