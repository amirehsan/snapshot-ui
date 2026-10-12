import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';
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

/** A word of 75 letters with no hyphen and no space, so the only way to fit it is to break it. */
const UNBROKEN_WORD = 'workspacenotificationpreferencesforeverymemberandeveryprojectyoucreatelater';

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

/** With no gutter beside the label, `inset` keeps the dot inside the label's box, so nothing hangs outside it. */
export const Inset: Story = {
  args: { inset: true },
  render: (args) => (
    <div style={{ overflow: 'hidden', border: '1px solid var(--color-frame)', padding: '12px 0' }}>
      <Eyebrow {...args} />
    </div>
  ),
};

/**
 * A word with no break in it breaks anywhere, so it stays inside the width it
 * is given. The visual suite shoots every story at 375px.
 */
export const LongWord: Story = {
  args: { children: UNBROKEN_WORD },
  render: (args) => (
    <div data-testid="frame" style={{ width: 'min(480px, calc(100vw - 48px))' }}>
      <Eyebrow {...args} />
    </div>
  ),
  play: async ({ canvas }) => {
    const frame = canvas.getByTestId('frame');
    const eyebrow = canvas.getByText(UNBROKEN_WORD);
    // A word that cannot break pokes out of its box, or widens the box past the frame that holds it.
    await expect(eyebrow.scrollWidth).toBeLessThanOrEqual(eyebrow.clientWidth);
    await expect(frame.scrollWidth).toBeLessThanOrEqual(frame.clientWidth);
  },
};
