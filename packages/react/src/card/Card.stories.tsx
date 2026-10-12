import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';
import { tokenPixels } from '../stories/paint';
import { Card, CardBody, CardHeader, CardNote, CardTitle } from './Card';

const meta = {
  title: 'Components/Card',
  component: Card,
  decorators: [
    (Story) => (
      <div style={{ width: 'min(480px, calc(100vw - 48px))' }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The top-left corner in pixels, so a story reads the shape the toolbar has chosen. */
const radius = (element: HTMLElement): number => parseFloat(getComputedStyle(element).borderTopLeftRadius);

/** A word of 75 letters with no hyphen and no space, so the only way to fit it is to break it. */
const UNBROKEN_WORD = 'workspacenotificationpreferencesforeverymemberandeveryprojectyoucreatelater';

/** A lifted surface with 32px of padding and a stadium corner. */
export const Basic: Story = {
  render: (args) => (
    <Card {...args}>
      <p style={{ margin: 0 }}>Anything can sit in a card: a form, a list, a paragraph.</p>
    </Card>
  ),
};

/** The title is the card's heading and names the region when the card is a section. */
export const WithHeaderAndNote: Story = {
  render: (args) => (
    <Card {...args} as="section" aria-labelledby="notifications-title">
      <CardHeader>
        <CardTitle id="notifications-title">Notifications</CardTitle>
        <CardNote>Where we reach you, and how often.</CardNote>
      </CardHeader>
      <CardBody>
        <p>Product updates, when something ships.</p>
        <p>A weekly digest, every Tuesday morning.</p>
        <p>Security alerts, always on for owners.</p>
      </CardBody>
    </Card>
  ),
};

/**
 * A card inside a card steps its corner down one place, from the stadium to the
 * surface radius, and takes an outline, since in light a card on a card has no
 * tone step to separate it.
 */
export const Nested: Story = {
  render: (args) => (
    <Card {...args} as="section" aria-labelledby="workspace-title" data-testid="outer-card">
      <CardHeader>
        <CardTitle id="workspace-title">Workspace</CardTitle>
        <CardNote>Shown in the header and in every invite.</CardNote>
      </CardHeader>
      <CardBody>
        <p>Northwind Studio</p>
        <Card as="section" aria-labelledby="danger-title" data-testid="inner-card">
          <CardHeader>
            <CardTitle id="danger-title" level={3}>
              Danger zone
            </CardTitle>
            <CardNote>Deleting a workspace cannot be undone.</CardNote>
          </CardHeader>
          <CardBody>
            <p>Every member loses access at once.</p>
          </CardBody>
        </Card>
      </CardBody>
    </Card>
  ),
  play: async ({ canvas }) => {
    await expect(radius(canvas.getByTestId('outer-card'))).toBe(tokenPixels('--radius-stadium'));
    const inner = canvas.getByTestId('inner-card');
    await expect(radius(inner)).toBe(tokenPixels('--radius-surface'));
    await expect(getComputedStyle(inner).borderTopColor).not.toBe('rgba(0, 0, 0, 0)');
  },
};

/** A card placed directly in a card, with no body between them, steps down too. */
export const NestedWithoutBody: Story = {
  // The corner is the whole point and the visual suite already shoots Nested, so no screenshot.
  tags: ['no-visual'],
  render: (args) => (
    <Card {...args} data-testid="outer-card">
      <Card data-testid="inner-card">A card inside a card.</Card>
    </Card>
  ),
  play: async ({ canvas }) => {
    await expect(radius(canvas.getByTestId('outer-card'))).toBe(tokenPixels('--radius-stadium'));
    await expect(radius(canvas.getByTestId('inner-card'))).toBe(tokenPixels('--radius-surface'));
  },
};

/**
 * Nested means placed in a card or in its body, not anywhere inside one. A card
 * on a well of its own, as the docs preview stage is, keeps its stadium corner
 * and its own edge even when the well sits in a card. A selector for any
 * descendant would step it down and fail this story.
 */
export const OnAWell: Story = {
  // The corner is the whole point and the visual suite already shoots Nested, so no screenshot.
  tags: ['no-visual'],
  render: (args) => (
    <Card {...args} data-testid="outer-card">
      <div
        style={{
          padding: 24,
          borderRadius: 'var(--radius-surface)',
          background: 'var(--color-canvas)',
        }}
      >
        <Card data-testid="well-card">A card on a well, inside a card.</Card>
      </div>
    </Card>
  ),
  play: async ({ canvas }) => {
    const outer = canvas.getByTestId('outer-card');
    const onWell = canvas.getByTestId('well-card');
    await expect(radius(onWell)).toBe(tokenPixels('--radius-stadium'));
    // The edge is the card's own hairline, the same as the outer card's, and not the nested outline.
    await expect(getComputedStyle(onWell).borderTopColor).toBe(getComputedStyle(outer).borderTopColor);
  },
};

/**
 * The tokens decide, so a card takes the theme of the block it sits in. A card
 * with its own data-theme takes that one instead, and its text follows.
 */
export const InsideDarkBlock: Story = {
  render: (args) => (
    <div
      data-theme="dark"
      style={{
        display: 'grid',
        gap: 16,
        padding: 24,
        borderRadius: 'var(--radius-stadium)',
        background: 'var(--color-canvas)',
      }}
    >
      <Card {...args} as="section" aria-labelledby="dark-title" data-testid="dark-card">
        <CardHeader>
          <CardTitle id="dark-title">Notifications</CardTitle>
          <CardNote>A card inside a dark block.</CardNote>
        </CardHeader>
        <CardBody>
          <p>It takes the dark tokens without being told to.</p>
        </CardBody>
      </Card>
      <Card {...args} as="section" aria-labelledby="light-title" data-theme="light" data-testid="light-card">
        <CardHeader>
          <CardTitle id="light-title">Workspace</CardTitle>
          <CardNote>A light card inside the same block.</CardNote>
        </CardHeader>
        <CardBody>
          <p>It asks for light, and its text follows.</p>
        </CardBody>
      </Card>
    </div>
  ),
  play: async ({ canvas }) => {
    const dark = canvas.getByTestId('dark-card');
    await expect(dark).toHaveStyle({ backgroundColor: 'rgb(26, 26, 25)' });
    await expect(canvas.getByRole('heading', { name: 'Notifications' })).toHaveStyle({
      color: 'rgb(255, 255, 255)',
    });
    const light = canvas.getByTestId('light-card');
    await expect(light).toHaveStyle({ backgroundColor: 'rgb(252, 251, 250)' });
    await expect(canvas.getByRole('heading', { name: 'Workspace' })).toHaveStyle({
      color: 'rgb(20, 20, 19)',
    });
  },
};

/**
 * Titles, notes and bodies wrap inside the card, and so does a word with no
 * break in it: the card breaks it anywhere. The visual suite shoots every story
 * at 375px.
 */
export const LongContent: Story = {
  render: (args) => (
    <Card {...args} as="section" aria-labelledby="long-title" data-testid="long-card">
      <CardHeader>
        <CardTitle id="long-title">Notification preferences for every workspace you belong to</CardTitle>
        <CardNote>
          Choose how each workspace reaches you. Changes apply to all of them at once, including workspaces
          you join later, and you can always override one from its own settings page at
          https://example.com/settings/notifications/workspaces.
        </CardNote>
      </CardHeader>
      <CardBody>
        <p>
          Product updates are a short note when something ships. The weekly digest arrives every Tuesday
          morning and lists what changed across every workspace you can see, grouped by project.
        </p>
        <p>
          Security alerts are always on for owners, because a sign-in from a new device or a changed billing
          contact is something an owner needs to know about the same day.
        </p>
        <p>
          The key for every workspace you create later is {UNBROKEN_WORD}, and it never has a space in it.
        </p>
      </CardBody>
    </Card>
  ),
  play: async ({ canvas }) => {
    const card = canvas.getByTestId('long-card');
    // Nothing the card holds reaches past it: not the card, and not any text inside it.
    await expect(card.scrollWidth).toBeLessThanOrEqual(card.clientWidth);
    for (const text of card.querySelectorAll<HTMLElement>('.card-title, .card-note, .card-body > p')) {
      await expect(text.scrollWidth).toBeLessThanOrEqual(text.clientWidth);
    }
  },
};
