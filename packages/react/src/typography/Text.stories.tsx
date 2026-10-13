import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';
import { Eyebrow } from './Eyebrow';
import { Text } from './Text';

const meta = {
  title: 'Components/Text',
  component: Text,
  args: { children: 'Changes apply to everyone in the workspace.' },
  argTypes: {
    as: { control: 'inline-radio', options: ['p', 'span', 'div'] },
    size: { control: 'inline-radio', options: ['body', 'small', 'numeral', 'numeral-sm'] },
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

/**
 * A hero amount: 56px with tabular digits, and 44px under 768px so "$12,345.67" fits a 320px screen. The
 * visual suite shoots 1280px and 375px, so both steps are baselined.
 */
export const Numeral: Story = { args: { size: 'numeral', children: '$12,345.67' } };

/**
 * A figure in a tile beside others is the 32px step. The second tile's plus sign and its word carry the
 * meaning, with the gain color beside them and never alone.
 */
export const NumeralTiles: Story = {
  render: () => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
      <div style={{ display: 'grid', gap: 8 }}>
        <Eyebrow>Spent</Eyebrow>
        <Text as="span" size="numeral-sm">
          $4,210.00
        </Text>
      </div>
      <div style={{ display: 'grid', gap: 8 }}>
        <Eyebrow>Arrived</Eyebrow>
        <Text as="span" size="numeral-sm" style={{ color: 'var(--color-gain)' }}>
          +$1,980.00
        </Text>
      </div>
    </div>
  ),
};

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
