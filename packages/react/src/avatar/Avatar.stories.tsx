import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, waitFor } from 'storybook/test';
import { Avatar } from './Avatar';

/** An SVG as a `data:` URI, so no story sends a request off the page. */
const svg = (markup: string): string =>
  `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40">${markup}</svg>`)}`;

/** A simple portrait: a head and shoulders on a pale ground. */
const PORTRAIT = svg(
  '<rect width="40" height="40" fill="#c9d6df"/><circle cx="20" cy="16" r="8" fill="#3f4e5a"/>' +
    '<path d="M4 40c0-9 7-15 16-15s16 6 16 15z" fill="#3f4e5a"/>',
);

/** A two-color mark for a merchant: a white square with a dark tile, so the ring's edge shows on a white card. */
const LOGO = svg(
  '<rect width="40" height="40" fill="#ffffff"/><rect x="10" y="10" width="20" height="20" fill="#1d3b53"/>',
);

/** A PNG that cannot be decoded, so the browser reports an error and the initials stay. */
const BROKEN = 'data:image/png;base64,AAAA';

const SIZES = ['sm', 'md', 'lg'] as const;

const meta = {
  title: 'Components/Avatar',
  component: Avatar,
  args: { name: 'Ada Lovelace' },
  argTypes: {
    size: { control: 'inline-radio', options: SIZES },
    shape: { control: 'inline-radio', options: ['circle', 'square'] },
  },
} satisfies Meta<typeof Avatar>;

export default meta;
type Story = StoryObj<typeof meta>;

const row = { display: 'flex', alignItems: 'center', gap: 16 } as const;

/** Every avatar in the canvas has finished with its image: loaded, or dropped for its initials. */
const imagesLoaded = async (canvasElement: HTMLElement): Promise<void> => {
  await waitFor(async () => {
    const images = [...canvasElement.querySelectorAll('.avatar-image')];
    await expect(images.length).toBeGreaterThan(0);
    for (const image of images) await expect(image).toHaveAttribute('data-loaded', '');
  });
};

/** 24, 32 and 40px, with initials: the small one bolder, at the 12px floor. */
export const Sizes: Story = {
  render: (args) => (
    <div style={row}>
      {SIZES.map((size) => (
        <Avatar key={size} {...args} size={size} />
      ))}
    </div>
  ),
};

/** A circle for a person and a square for a merchant or a bank, each with initials and with an image. */
export const Shapes: Story = {
  render: () => (
    <div style={row}>
      <Avatar name="Ada Lovelace" />
      <Avatar name="Ada Lovelace" src={PORTRAIT} />
      <Avatar name="Northwind" shape="square" />
      <Avatar name="Northwind" shape="square" src={LOGO} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    await imagesLoaded(canvasElement);
  },
};

/** The portrait at the three sizes, shown once it has loaded, under the frame ring. */
export const WithImage: Story = {
  render: (args) => (
    <div style={row}>
      {SIZES.map((size) => (
        <Avatar key={size} {...args} size={size} src={PORTRAIT} />
      ))}
    </div>
  ),
  play: async ({ canvasElement }) => {
    await imagesLoaded(canvasElement);
  },
};

/** An image that fails is removed, so the row is drawn as the initials row is. */
export const FailedImage: Story = {
  render: (args) => (
    <div style={row}>
      {SIZES.map((size) => (
        <Avatar key={size} {...args} size={size} src={BROKEN} />
      ))}
    </div>
  ),
  play: async ({ canvasElement }) => {
    await waitFor(async () => {
      await expect(canvasElement.querySelector('.avatar-image')).toBeNull();
    });
    for (const initials of canvasElement.querySelectorAll('.avatar-initials')) {
      await expect(initials).toBeVisible();
      await expect(initials).toHaveTextContent('AL');
    }
  },
};
