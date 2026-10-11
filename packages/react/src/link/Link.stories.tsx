import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn } from 'storybook/test';
import { Link } from './Link';

const meta = {
  title: 'Components/Link',
  component: Link,
  args: { href: '#example', children: 'Read the guide', onPress: fn() },
} satisfies Meta<typeof Link>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** Where a link is almost always found: inside a sentence, in the text color around it. */
export const InSentence: Story = {
  render: (args) => (
    <p style={{ maxWidth: '40ch', margin: 0 }}>
      Every color pairing is checked in both modes. <Link {...args}>Read how it is measured</Link>, or go
      straight to the tokens.
    </p>
  ),
};

export const Disabled: Story = { args: { isDisabled: true } };

/**
 * A long link wraps with its sentence, and its underline follows every line.
 * It ends in an address with nothing to break at, which wraps anywhere
 * instead of pushing a narrow screen sideways.
 */
export const LongText: Story = {
  args: {
    children:
      'A link whose text is long enough to wrap onto several lines in a narrow column, ending in averyveryverylongaddresswithnohyphensorslashesinitsoitcannotbreakanywhereelse',
  },
  render: (args) => (
    <p style={{ margin: 0 }}>
      <Link {...args} />
    </p>
  ),
};

export const Pressed: Story = {
  // A press is transient, so no screenshot can hold it. The story test still asserts it.
  // With no href it is not an anchor, so the click navigates nowhere.
  tags: ['no-visual'],
  args: { href: undefined },
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('link', { name: 'Read the guide' }));
    await expect(args.onPress).toHaveBeenCalledOnce();
  },
};

/** The ring sits outside the text, with the corners of the micro radius. */
export const KeyboardFocus: Story = {
  play: async ({ canvas, userEvent }) => {
    await userEvent.tab();
    await expect(canvas.getByRole('link')).toHaveFocus();
  },
};

/** Link Blue lifts in dark, so a link inside a dark scope reads on its own ground. */
export const NestedThemes: Story = {
  render: (args) => (
    <div data-theme="dark" style={{ padding: 24, background: 'var(--color-canvas)' }}>
      <Link {...args} />
      <div data-theme="light" style={{ marginTop: 16, padding: 24, background: 'var(--color-lifted)' }}>
        <Link {...args} />
      </div>
    </div>
  ),
};
