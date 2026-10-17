import type { Meta, StoryObj } from '@storybook/react-vite';
import type { CSSProperties, ReactElement } from 'react';
import { expect, waitFor, within } from 'storybook/test';
import { Button } from '../button';
import { Card, CardBody } from '../card';
import { Checkbox, CheckboxGroup } from '../checkbox';
import { DialogTrigger } from '../dialog';
import { BOTTOM, frameAround } from '../stories/corner';
import { tokenColor, tokenPixels } from '../stories/paint';
import { Popover, type PopoverProps } from './Popover';

/** The one element on the page that matches `selector`, wherever the overlay portaled it. */
function only(selector: string): HTMLElement {
  const found = document.querySelectorAll<HTMLElement>(selector);
  const [first] = found;
  if (found.length !== 1 || !first)
    throw new Error(`Expected one ${selector}, found ${String(found.length)}`);
  return first;
}

/**
 * Resolves once the open popover has been placed and has entered, and every transition on it has finished,
 * so a play reads its box at rest and not 4px short of it.
 */
async function atRest(): Promise<HTMLElement> {
  const popover = await waitFor(async () => {
    const found = only('.popover');
    await expect(found).toHaveAttribute('data-placement');
    await expect(found).not.toHaveAttribute('data-entering');
    return found;
  });
  await Promise.all(
    popover.getAnimations({ subtree: true }).map((animation) => animation.finished.catch(() => null)),
  );
  return popover;
}

/** A filter panel: three statuses and the action that applies them. */
const FILTERS = (
  <div style={{ display: 'grid', gap: 24 }}>
    <CheckboxGroup label="Status" defaultValue={['active']}>
      <Checkbox value="active">Active</Checkbox>
      <Checkbox value="paused">Paused</Checkbox>
      <Checkbox value="archived">Archived</Checkbox>
    </CheckboxGroup>
    <Button>Show 12 projects</Button>
  </div>
);

/** A trigger and its popover, open on the first render. */
function Opened({
  trigger = 'Filter the projects',
  triggerStyle,
  ...args
}: PopoverProps & { trigger?: string; triggerStyle?: CSSProperties }): ReactElement {
  return (
    <DialogTrigger defaultOpen>
      <Button variant="secondary" style={triggerStyle}>
        {trigger}
      </Button>
      <Popover {...args} />
    </DialogTrigger>
  );
}

/** The trigger's box, by its name. */
const triggerBox = (name: string): DOMRect =>
  within(document.body).getByRole('button', { name }).getBoundingClientRect();

const meta = {
  title: 'Components/Popover',
  component: Popover,
  args: {
    isPadded: true,
    children: FILTERS,
  },
  parameters: {
    // Every story opens a popover, and a docs page that drew them inline would open them all at once.
    docs: { story: { inline: false, height: '480px' } },
  },
} satisfies Meta<typeof Popover>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * A padded filter panel under its trigger: the float fill, the frame, the surface corner and the float
 * shadow, 8px below the button, at its start edge.
 */
export const Below: Story = {
  render: (args) => <Opened {...args} />,
  play: async () => {
    const popover = await atRest();
    await expect(popover).toHaveAttribute('data-placement', 'bottom');
    await expect(within(document.body).getByRole('dialog', { name: 'Filter the projects' })).toBe(popover);
    const trigger = triggerBox('Filter the projects');
    const box = popover.getBoundingClientRect();
    await expect(Math.abs(box.top - trigger.bottom - 8)).toBeLessThanOrEqual(1);
    await expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(window.innerWidth);
  },
};

/**
 * A trigger at the bottom of the window has no room under it, so the popover flips above it, 8px clear.
 */
export const Flipped: Story = {
  render: (args) => (
    <div style={{ position: 'fixed', bottom: 16, left: '50%' }}>
      <Opened {...args} />
    </div>
  ),
  play: async () => {
    const popover = await atRest();
    await expect(popover).toHaveAttribute('data-placement', 'top');
    const trigger = triggerBox('Filter the projects');
    const box = popover.getBoundingClientRect();
    await expect(Math.abs(trigger.top - box.bottom - 8)).toBeLessThanOrEqual(1);
    // Shifted to stay on screen, inside React Aria's 12px container padding.
    await expect(box.left).toBeGreaterThanOrEqual(12 - 0.5);
    await expect(box.right).toBeLessThanOrEqual(document.documentElement.clientWidth - 12 + 0.5);
  },
};

/**
 * Free content takes the 24px of a peer gap all round, and a long word in it, such as a share link, breaks
 * anywhere instead of scrolling the surface sideways.
 */
export const Padded: Story = {
  args: {
    children: (
      <p style={{ margin: 0, maxWidth: '20rem' }}>
        Projects you archive leave the list and their members lose access. Bring one back from Settings at any
        time, or share it read-only: snapshotui.com/share/QXJjaGl2ZWRQcm9qZWN0c1JlYWRPbmx5TGlua0Zvck1lbWJlcnM
      </p>
    ),
  },
  render: (args) => <Opened {...args} trigger="About archiving" />,
  play: async () => {
    const popover = await atRest();
    // The link's token has no break opportunity, so only overflow-wrap keeps it inside the 343px of a 375px
    // screen, and inside the surface at any width.
    await expect(popover.scrollWidth).toBeLessThanOrEqual(popover.clientWidth);
    await expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(window.innerWidth);
    const padding = getComputedStyle(popover);
    const peer = tokenPixels('--spacing-peer');
    await expect(peer).toBeGreaterThan(0);
    for (const side of [
      padding.paddingTop,
      padding.paddingRight,
      padding.paddingBottom,
      padding.paddingLeft,
    ]) {
      await expect(parseFloat(side)).toBe(peer);
    }
  },
};

/** A 240px trigger makes its width the popover's minimum, so the panel never sits narrower than it. */
export const MatchTriggerWidth: Story = {
  args: {
    matchTriggerWidth: true,
    children: (
      <CheckboxGroup label="Owner" defaultValue={['me']}>
        <Checkbox value="me">Me</Checkbox>
        <Checkbox value="team">My team</Checkbox>
      </CheckboxGroup>
    ),
  },
  render: (args) => <Opened {...args} trigger="Owner" triggerStyle={{ width: 240 }} />,
  play: async () => {
    const popover = await atRest();
    const trigger = triggerBox('Owner');
    await expect(trigger.width).toBeCloseTo(240, 0);
    await expect(popover.getBoundingClientRect().width).toBeGreaterThanOrEqual(trigger.width - 0.5);
  },
};

/**
 * A popover opened from a trigger in a dark card is dark while the page is light, and takes the corner of
 * the soft scope around the trigger. React Aria gives the popover its trigger, so the copy starts there and
 * not at whatever holds focus.
 */
export const InDarkScope: Story = {
  render: (args) => (
    <div
      data-theme="dark"
      data-testid="dark-scope"
      style={{ ...frameAround(24), background: 'var(--color-canvas)' }}
    >
      <Card>
        <CardBody>
          <p>A card in a dark block.</p>
          <div data-shape="soft">
            <Opened {...args} triggerStyle={BOTTOM} />
          </div>
        </CardBody>
      </Card>
    </div>
  ),
  play: async ({ canvas }) => {
    const popover = await atRest();
    await expect(popover).toHaveAttribute('data-theme', 'dark');
    await expect(popover).toHaveAttribute('data-shape', 'soft');
    const scope = canvas.getByTestId('dark-scope');
    await expect(getComputedStyle(popover).backgroundColor).toBe(tokenColor('--color-float', scope));
  },
};

/**
 * Opened from the keyboard, focus moves to the popover, Tab reaches the controls inside and comes back to
 * the first after the last, and Escape closes it and gives focus back to the trigger. Opened by a press, a
 * press outside closes it.
 */
export const Dismissal: Story = {
  tags: ['no-visual'],
  render: (args) => (
    <DialogTrigger>
      <Button variant="secondary">Filter the projects</Button>
      <Popover {...args} />
    </DialogTrigger>
  ),
  play: async ({ canvas, userEvent }) => {
    const trigger = canvas.getByRole('button', { name: 'Filter the projects' });
    await userEvent.tab();
    await expect(trigger).toHaveFocus();
    await userEvent.keyboard('{Enter}');
    const body = within(document.body);
    const dialog = await body.findByRole('dialog', { name: 'Filter the projects' });
    await waitFor(() => expect(dialog).toHaveFocus());
    const first = body.getByRole('checkbox', { name: 'Active' });
    await userEvent.tab();
    await expect(first).toHaveFocus();
    for (const name of ['Paused', 'Archived']) {
      await userEvent.tab();
      await expect(body.getByRole('checkbox', { name })).toHaveFocus();
    }
    await userEvent.tab();
    await expect(body.getByRole('button', { name: 'Show 12 projects' })).toHaveFocus();
    // Past the last control, Tab comes back to the first and never reaches the page.
    await userEvent.tab();
    await expect(first).toHaveFocus();
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(body.queryByRole('dialog')).not.toBeInTheDocument());
    await waitFor(() => expect(trigger).toHaveFocus());

    await userEvent.click(trigger);
    await body.findByRole('dialog', { name: 'Filter the projects' });
    await atRest();
    // The page itself, outside the popover.
    await userEvent.click(document.body);
    await waitFor(() => expect(body.queryByRole('dialog')).not.toBeInTheDocument());
  },
};
