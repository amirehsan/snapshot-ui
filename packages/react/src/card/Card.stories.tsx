import type { Meta, StoryObj } from '@storybook/react-vite';
import { Ellipsis } from 'lucide-react';
import type { ReactElement } from 'react';
import { expect, waitFor } from 'storybook/test';
import { Button } from '../button';
import { DescriptionList, DescriptionListItem } from '../description-list';
import { Dialog, DialogTrigger } from '../dialog';
import { IconButton } from '../icon-button';
import { Link } from '../link';
import { Menu, MenuItem, MenuTrigger } from '../menu';
import { frameAround, HOLDER_CORNER, nestedCardPixels } from '../stories/corner';
import { firstLineOffset, tokenPixels } from '../stories/paint';
import { DESKTOP, PHONE, VIEWPORT_OPTIONS } from '../stories/viewports';
import { Card, CardActions, CardBody, CardHeader, CardNote, CardTitle } from './Card';

/** The frame every story draws its card in, unless the story names a wider one as `parameters.frame`. */
const FRAME = 'min(480px, calc(100vw - 48px))';

const meta = {
  title: 'Components/Card',
  component: Card,
  decorators: [
    (Story, { parameters }) => (
      <div style={{ width: typeof parameters.frame === 'string' ? parameters.frame : FRAME }}>
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
  tags: ['density'],
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
    await expect(radius(inner)).toBe(nestedCardPixels());
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
    await expect(radius(canvas.getByTestId('inner-card'))).toBe(nestedCardPixels());
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
      <div style={{ padding: 24, borderRadius: HOLDER_CORNER, background: 'var(--color-canvas)' }}>
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
        ...frameAround(24),
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

/** The first element with this class inside `scope`. */
const part = (scope: ParentNode, name: string): HTMLElement => {
  const element = scope.querySelector<HTMLElement>(`.${name}`);
  if (!element) throw new Error(`No .${name}`);
  return element;
};

/** The card's body, whose content box is the column the header's actions end on. */
const body = (card: Element): HTMLElement => part(card, 'card-body');

/** A length on the tokens, in px, as it resolves inside `scope`: the holder's properties included. */
const lengthIn = (scope: Element, value: string): number => {
  const probe = document.createElement('div');
  probe.style.position = 'absolute';
  probe.style.inlineSize = value;
  scope.append(probe);
  const { width } = probe.getBoundingClientRect();
  probe.remove();
  return width;
};

/** The width of an element's content box, in px. */
const contentWidth = (element: Element): number => {
  const style = getComputedStyle(element);
  return element.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
};

/** Whether two boxes share any area, half a pixel of layout rounding allowed. */
const overlaps = (a: DOMRect, b: DOMRect): boolean =>
  a.left < b.right - 0.5 && b.left < a.right - 0.5 && a.top < b.bottom - 0.5 && b.top < a.bottom - 0.5;

/**
 * How far `control` reaches into the nearest of `card`'s four corner curves, in px: 0 when it is clear of
 * all four. A corner is entered only where both gaps there, inline and block, are under the card's radius.
 */
const intoCorner = (card: Element, control: Element): number => {
  const outer = card.getBoundingClientRect();
  const inner = control.getBoundingClientRect();
  const curve = parseFloat(getComputedStyle(card).borderTopLeftRadius);
  const start = inner.left - outer.left;
  const end = outer.right - inner.right;
  const top = inner.top - outer.top;
  const bottom = outer.bottom - inner.bottom;
  const gaps: [number, number][] = [
    [start, top],
    [end, top],
    [end, bottom],
    [start, bottom],
  ];
  return Math.max(0, ...gaps.map(([x, y]) => Math.min(curve - x, curve - y)));
};

/** How many different radii a control draws on its four corners: 1 for a control that keeps its shape. */
const cornerCount = (control: Element): number => {
  const style = getComputedStyle(control);
  return new Set([
    style.borderTopLeftRadius,
    style.borderTopRightRadius,
    style.borderBottomRightRadius,
    style.borderBottomLeftRadius,
  ]).size;
};

/** Every shape in both densities: the corner moves the actions only where its curve is deeper than the padding. */
const THEMES = [
  ['rounded', 'comfortable'],
  ['rounded', 'compact'],
  ['soft', 'comfortable'],
  ['soft', 'compact'],
  ['square', 'comfortable'],
  ['square', 'compact'],
] as const;

/** Runs `check` in every shape and density, then puts the toolbar's back for the next story. */
async function inEveryTheme(check: (shape: string) => Promise<void>): Promise<void> {
  const root = document.documentElement;
  const { shape, density } = root.dataset;
  try {
    for (const [nextShape, nextDensity] of THEMES) {
      root.dataset.shape = nextShape;
      root.dataset.density = nextDensity;
      await check(nextShape);
    }
  } finally {
    root.dataset.shape = shape ?? 'rounded';
    root.dataset.density = density ?? 'comfortable';
  }
}

/** A title long enough to wrap beside the actions, and over its own lines on a phone. */
const LONG_TITLE = 'Details of the Everyday Visa Platinum Rewards card';

/**
 * The first consumer's Details card with Edit, Merge and Remove side by side, each named for what it does to
 * the account. Their Dialog and ConfirmDialog are left out: the corner and the wrap are the point here, and
 * WithActions opens Edit's.
 */
function AccountCard({ title = 'Details', id }: { title?: string; id: string }): ReactElement {
  return (
    <Card as="section" aria-labelledby={id}>
      <CardHeader>
        <CardTitle id={id} level={3}>
          {title}
        </CardTitle>
        <CardNote>Updated from your bank feed</CardNote>
        <CardActions>
          <Button variant="secondary" aria-label="Edit details">
            Edit
          </Button>
          <Button variant="secondary" aria-label="Merge account">
            Merge
          </Button>
          <Button variant="secondary" aria-label="Remove account">
            Remove
          </Button>
        </CardActions>
      </CardHeader>
      <CardBody>
        <DescriptionList>
          <DescriptionListItem term="Name">Everyday Visa</DescriptionListItem>
          <DescriptionListItem term="Credit limit" isNumeric>
            $5,000.00
          </DescriptionListItem>
        </DescriptionList>
      </CardBody>
    </Card>
  );
}

/**
 * Buttons in a plain card's header, after its title and note: Edit opens a Dialog, and a More menu holds
 * Merge and Remove. They sit at the end of the title's line, which is a control high, and the header's top
 * grows by the card's corner inset less its padding, so in Rounded they stand clear of the top end curve and
 * end on the body's column edge. At 375 the header is under 24rem and they follow the note at the start.
 */
export const WithActions: Story = {
  tags: ['density'],
  render: (args) => (
    <Card {...args} as="section" aria-labelledby="details-title">
      <CardHeader>
        <CardTitle id="details-title" level={3}>
          Details
        </CardTitle>
        <CardNote>Updated from your bank feed</CardNote>
        <CardActions>
          <DialogTrigger>
            <Button variant="secondary" aria-label="Edit details">
              Edit
            </Button>
            <Dialog
              title="Edit details"
              description="The name and type the account shows everywhere."
              actions={({ close }) => (
                <>
                  <Button variant="secondary" onPress={close}>
                    Cancel
                  </Button>
                  <Button onPress={close}>Save details</Button>
                </>
              )}
            />
          </DialogTrigger>
          <MenuTrigger>
            <IconButton aria-label="More actions" variant="outline">
              <Ellipsis />
            </IconButton>
            <Menu>
              <MenuItem id="merge">Merge</MenuItem>
              <MenuItem id="remove">Remove</MenuItem>
            </Menu>
          </MenuTrigger>
        </CardActions>
      </CardHeader>
      <CardBody>
        <DescriptionList>
          <DescriptionListItem term="Name">Everyday Visa</DescriptionListItem>
          <DescriptionListItem term="Type">Credit card</DescriptionListItem>
          <DescriptionListItem term="Credit limit" isNumeric>
            $5,000.00
          </DescriptionListItem>
          <DescriptionListItem
            term="Nickname"
            actions={
              <Link href="#nickname" aria-label="Edit Nickname">
                Edit
              </Link>
            }
          >
            Travel card
          </DescriptionListItem>
        </DescriptionList>
      </CardBody>
    </Card>
  ),
};

/**
 * On a phone a long title wraps over its lines and the header is under 24rem, so Edit, Merge and Remove take
 * a row of their own after the note, at the inline start, wrapping among themselves. In every shape and
 * density nothing overlaps the title or the note, each button keeps one radius on its four corners, and none
 * enters a corner curve of the card or passes its padding.
 */
export const ActionsWrap: Story = {
  tags: ['no-visual', 'webkit', 'firefox'],
  globals: PHONE,
  parameters: { viewport: { options: VIEWPORT_OPTIONS } },
  render: () => <AccountCard id="wrap-title" title={LONG_TITLE} />,
  play: async ({ canvasElement }) => {
    const card = part(canvasElement, 'card');
    const header = part(card, 'card-header');
    const title = part(header, 'card-title');
    const note = part(header, 'card-note');
    const actions = part(header, 'card-actions');
    const buttons = [...actions.querySelectorAll('button')];
    await expect(buttons).toHaveLength(3);
    const rem = parseFloat(getComputedStyle(document.documentElement).fontSize);
    await inEveryTheme(async () => {
      // The header is under 24rem on a 375px screen in both densities, so the actions follow the note.
      await waitFor(
        () =>
          expect(actions.getBoundingClientRect().top).toBeGreaterThanOrEqual(
            note.getBoundingClientRect().bottom,
          ),
        { timeout: 5000 },
      );
      await expect(contentWidth(header)).toBeLessThan(24 * rem);
      // The long title wraps, and the note follows its last line.
      await expect(title.getBoundingClientRect().height).toBeGreaterThan(
        1.5 * parseFloat(getComputedStyle(title).lineHeight),
      );
      await expect(note.getBoundingClientRect().top).toBeGreaterThanOrEqual(
        title.getBoundingClientRect().bottom,
      );
      // At the inline start, where the title starts.
      await expect(
        Math.abs(actions.getBoundingClientRect().left - title.getBoundingClientRect().left),
      ).toBeLessThan(1);
      const end = body(card).getBoundingClientRect().right;
      for (const button of buttons) {
        const box = button.getBoundingClientRect();
        await expect(overlaps(box, title.getBoundingClientRect())).toBe(false);
        await expect(overlaps(box, note.getBoundingClientRect())).toBe(false);
        await expect(cornerCount(button)).toBe(1);
        await expect(intoCorner(card, button)).toBeLessThanOrEqual(1);
        await expect(box.right).toBeLessThanOrEqual(end + 1);
      }
    });
  },
};

/**
 * Beside the title, measured in every shape and density in a 40rem card. Edit, Merge and Remove share one
 * line level with the title's first line, within 1px, whether the title takes one line or wraps, and end on
 * the body's column edge. In Rounded the header's top grows by the corner inset less the card's padding, 7px
 * and 19px compact, so the actions start the corner inset under the card's top edge; in Soft and Square the
 * padding already clears the curve and nothing grows. No button overlaps the title or enters a corner curve,
 * and each keeps one radius.
 */
export const ActionsClearOfCorner: Story = {
  tags: ['no-visual', 'webkit', 'firefox'],
  globals: DESKTOP,
  parameters: { viewport: { options: VIEWPORT_OPTIONS }, frame: 'min(40rem, calc(100vw - 48px))' },
  render: () => (
    <div style={{ display: 'grid', gap: 'var(--spacing-separate)' }}>
      <AccountCard id="short-title" />
      <AccountCard id="long-title" title={LONG_TITLE} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const cards = [...canvasElement.querySelectorAll<HTMLElement>('.card')];
    await expect(cards).toHaveLength(2);
    await inEveryTheme(async (shape) => {
      for (const card of cards) {
        const header = part(card, 'card-header');
        const title = part(header, 'card-title');
        const note = part(header, 'card-note');
        const actions = part(header, 'card-actions');
        const buttons = [...actions.querySelectorAll('button')];
        const [first] = buttons;
        if (!first) throw new Error('No actions');
        // Beside the title, above the note.
        await waitFor(
          () =>
            expect(actions.getBoundingClientRect().bottom).toBeLessThanOrEqual(
              note.getBoundingClientRect().top,
            ),
          { timeout: 5000 },
        );
        // On one line, level with the title's first line, and on the body's end edge.
        for (const button of buttons) {
          await expect(
            Math.abs(button.getBoundingClientRect().top - first.getBoundingClientRect().top),
          ).toBeLessThan(1);
        }
        await expect(Math.abs(firstLineOffset(first, title))).toBeLessThanOrEqual(1);
        await expect(
          Math.abs(actions.getBoundingClientRect().right - body(card).getBoundingClientRect().right),
        ).toBeLessThan(1);
        // The header's top grows by the corner inset less the padding: 7px, 19px compact, in Rounded alone.
        const inset = lengthIn(card, 'var(--holder-corner-inset)');
        const extra = inset - lengthIn(card, 'var(--holder-pad)');
        await expect(Math.abs(parseFloat(getComputedStyle(header).paddingTop) - extra)).toBeLessThan(0.5);
        if (shape === 'rounded') {
          await expect(extra).toBeGreaterThan(0);
          await expect(
            first.getBoundingClientRect().top - card.getBoundingClientRect().top,
          ).toBeGreaterThanOrEqual(inset - 1);
        } else {
          await expect(extra).toBe(0);
        }
        for (const button of buttons) {
          await expect(overlaps(button.getBoundingClientRect(), title.getBoundingClientRect())).toBe(false);
          await expect(cornerCount(button)).toBe(1);
          await expect(intoCorner(card, button)).toBeLessThanOrEqual(1);
        }
      }
      // The long title wraps beside the actions, and they stay on its first line.
      const long = part(cards[1] ?? canvasElement, 'card-title');
      await expect(long.getBoundingClientRect().height).toBeGreaterThan(
        1.5 * parseFloat(getComputedStyle(long).lineHeight),
      );
    });
  },
};

/**
 * A header holding actions is a size container, which takes no width from its content, so in a flex row,
 * where a card takes the width of what it holds, the header names the 20rem it stands in for, as a
 * description list and a stat tile do, instead of shrinking the card to its padding.
 */
export const ActionsInAFlexRow: Story = {
  tags: ['no-visual'],
  render: () => (
    <div style={{ display: 'flex' }}>
      <Card as="section" aria-labelledby="flex-title">
        <CardHeader>
          <CardTitle id="flex-title" level={3}>
            Details
          </CardTitle>
          <CardActions>
            <Button variant="secondary" aria-label="Edit details">
              Edit
            </Button>
          </CardActions>
        </CardHeader>
      </Card>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const rem = parseFloat(getComputedStyle(document.documentElement).fontSize);
    await expect(Math.abs(contentWidth(part(canvasElement, 'card-header')) - 20 * rem)).toBeLessThanOrEqual(
      1,
    );
  },
};
