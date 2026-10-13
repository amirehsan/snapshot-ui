import type { Meta, StoryObj } from '@storybook/react-vite';
import { Pencil, TriangleAlert } from 'lucide-react';
import type { ReactElement, ReactNode } from 'react';
import { expect, waitFor, within } from 'storybook/test';
import { Button } from '../button';
import { Card, CardBody } from '../card';
import { tokenColor } from '../stories/paint';
import { TextField } from '../text-field';
import { Dialog, DialogTrigger, type DialogProps } from './Dialog';

/** The one element on the page that matches `selector`, wherever the overlay portaled it. */
function only(selector: string): HTMLElement {
  const found = document.querySelectorAll<HTMLElement>(selector);
  const [first] = found;
  if (found.length !== 1 || !first)
    throw new Error(`Expected one ${selector}, found ${String(found.length)}`);
  return first;
}

/**
 * The alpha of a computed color, 1 when it has none. A `color-mix()` computes to `color(srgb r g b / a)`, and
 * a plain color to `rgb()` or `rgba()`.
 */
function alphaOf(color: string): number {
  const slashed = /\/\s*([\d.]+)\s*\)$/.exec(color)?.[1];
  if (slashed !== undefined) return Number(slashed);
  const parts = /rgba?\(([^)]+)\)/.exec(color)?.[1]?.split(',') ?? [];
  return parts.length === 4 ? Number(parts[3]) : 1;
}

/**
 * Resolves once the open panel has entered and every transition on it and inside it has finished, so a play
 * reads its box at rest and not 8px low and transparent.
 */
async function atRest(): Promise<HTMLElement> {
  const panel = await waitFor(async () => {
    const found = only('.dialog');
    await expect(found).not.toHaveAttribute('data-entering');
    return found;
  });
  await Promise.all(
    panel.getAnimations({ subtree: true }).map((animation) => animation.finished.catch(() => null)),
  );
  return panel;
}

/** Twenty paragraphs, more than any viewport the suite shoots holds. */
const LONG_BODY: ReactNode = Array.from({ length: 20 }, (_, index) => (
  <p key={index} style={{ margin: '0 0 1em' }}>
    {`Paragraph ${String(index + 1)}. A workspace keeps its projects, its members and their history. Renaming it changes how it shows in the header, in every invite and in the address of its pages.`}
  </p>
));

/** A trigger and its dialog, open on the first render. */
function Opened({
  trigger = 'Rename the workspace',
  ...args
}: DialogProps & { trigger?: string }): ReactElement {
  return (
    <DialogTrigger defaultOpen>
      <Button variant="secondary">{trigger}</Button>
      <Dialog {...args} />
    </DialogTrigger>
  );
}

const meta = {
  title: 'Components/Dialog',
  component: Dialog,
  args: {
    title: 'Rename the workspace',
    description: 'The new name shows in the header and in every invite.',
  },
  parameters: {
    // Every story opens a modal, and a docs page that drew them inline would open them all at once.
    docs: { story: { inline: false, height: '480px' } },
  },
} satisfies Meta<typeof Dialog>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * The parts in order: the icon well, the title, the description, a one-field body and the action row. The
 * panel is float with the stadium corner, centred on the scrim with 16px clear on every side.
 */
export const Default: Story = {
  args: {
    icon: <Pencil />,
    children: <TextField label="Workspace name" defaultValue="Northwind Studio" />,
    actions: <Button slot="close">Rename</Button>,
  },
  render: (args) => <Opened {...args} />,
  play: async () => {
    const body = within(document.body);
    const dialog = body.getByRole('dialog', { name: 'Rename the workspace' });
    await expect(dialog).toHaveAccessibleDescription('The new name shows in the header and in every invite.');
    // The inset is declared on the scrim as well as the panel, so the scrim pads by it.
    await expect(getComputedStyle(only('.dialog-overlay')).paddingTop).toBe('16px');
    await expect(only('.dialog')).toHaveAttribute('data-size', 'md');
    // A body that fits is no tab stop: the field is the first thing Tab reaches.
    await expect(only('.dialog-body')).not.toHaveAttribute('tabindex');
  },
};

/** A question that loses something: the well tints with error, and the row ends in a danger Button. */
export const Danger: Story = {
  args: {
    tone: 'danger',
    icon: <TriangleAlert />,
    title: 'Delete the workspace?',
    description: 'Its 12 projects and their history go with it. This cannot be undone.',
    actions: (
      <>
        <Button variant="tertiary" slot="close">
          Cancel
        </Button>
        <Button variant="danger" slot="close">
          Delete the workspace
        </Button>
      </>
    ),
  },
  render: (args) => <Opened {...args} trigger="Delete the workspace" />,
  play: async () => {
    await expect(only('.dialog')).toHaveAttribute('data-tone', 'danger');
    await expect(getComputedStyle(only('.dialog-well')).color).toBe(tokenColor('--color-error'));
  },
};

/** A body taller than the viewport scrolls inside the panel, and the head and the action row stay. */
export const LongBody: Story = {
  args: {
    children: LONG_BODY,
    actions: <Button slot="close">Rename</Button>,
  },
  render: (args) => <Opened {...args} />,
  play: async () => {
    const panel = await atRest();
    const scroller = only('.dialog-body');
    await expect(scroller.scrollHeight).toBeGreaterThan(scroller.clientHeight);
    // It holds nothing to focus, so it is a tab stop of its own while it scrolls.
    await expect(scroller).toHaveAttribute('tabindex', '0');
    await expect(only('.dialog-actions').getBoundingClientRect().bottom).toBeLessThanOrEqual(
      window.innerHeight,
    );
    await expect(panel.getBoundingClientRect().bottom).toBeLessThanOrEqual(window.innerHeight - 16);
  },
};

/** The large width, 40rem, for a dialog that holds a table or a form of two columns. */
export const Large: Story = {
  args: {
    size: 'lg',
    children: <TextField label="Workspace name" defaultValue="Northwind Studio" />,
    actions: <Button slot="close">Rename</Button>,
  },
  render: (args) => <Opened {...args} />,
  play: async () => {
    const panel = await atRest();
    await expect(panel).toHaveAttribute('data-size', 'lg');
    // 640px wherever the viewport holds it and the 16px on each side, as at 1280, and the viewport less 32px
    // where it does not.
    await expect(panel.getBoundingClientRect().width).toBeCloseTo(Math.min(640, window.innerWidth - 32), 1);
  },
};

/** The close button sits in the top end corner, and the head keeps clear of it. */
export const WithCloseButton: Story = {
  args: {
    hasCloseButton: true,
    children: <TextField label="Workspace name" defaultValue="Northwind Studio" />,
    actions: <Button slot="close">Rename</Button>,
  },
  render: (args) => <Opened {...args} />,
  play: async () => {
    const panel = await atRest();
    const close = within(document.body).getByRole('button', { name: 'Close' });
    const style = getComputedStyle(panel);
    const edge = panel.getBoundingClientRect();
    const box = close.getBoundingClientRect();
    // 24px in from the panel's padding edge, at the top and at the end, inside its 1px border.
    await expect(edge.right - parseFloat(style.borderRightWidth) - box.right).toBeCloseTo(24, 1);
    await expect(box.top - edge.top - parseFloat(style.borderTopWidth)).toBeCloseTo(24, 1);
    // The title stops short of the button.
    await expect(only('.dialog-title').getBoundingClientRect().right).toBeLessThanOrEqual(box.left);
  },
};

/**
 * A dialog opened from a trigger in a dark card is dark while the page is light, and the scrim keeps the
 * page's opacity. The play opens it from the keyboard, so the trigger holds focus when the dialog opens:
 * that is the origin the panel copies its theme from.
 */
export const InDarkScope: Story = {
  args: {
    icon: <Pencil />,
    children: <TextField label="Workspace name" defaultValue="Northwind Studio" />,
    actions: <Button slot="close">Rename</Button>,
  },
  render: (args) => (
    <div
      data-theme="dark"
      data-testid="dark-scope"
      style={{ padding: 24, borderRadius: 'var(--radius-stadium)', background: 'var(--color-canvas)' }}
    >
      <Card>
        <CardBody>
          <p>A card in a dark block.</p>
          <DialogTrigger>
            <Button variant="secondary">Rename the workspace</Button>
            <Dialog {...args} />
          </DialogTrigger>
        </CardBody>
      </Card>
    </div>
  ),
  play: async ({ canvas, userEvent }) => {
    await userEvent.tab();
    await expect(canvas.getByRole('button', { name: 'Rename the workspace' })).toHaveFocus();
    await userEvent.keyboard('{Enter}');
    const panel = await atRest();
    await expect(panel).toHaveAttribute('data-theme', 'dark');
    await expect(only('.dialog-overlay')).not.toHaveAttribute('data-theme');
    const scope = canvas.getByTestId('dark-scope');
    await expect(getComputedStyle(panel).backgroundColor).toBe(tokenColor('--color-float', scope));
  },
};

/**
 * Opened from the keyboard, focus moves to the dialog, Tab stays inside it, and Escape closes it and gives
 * focus back to the trigger.
 */
export const FocusAndRestore: Story = {
  tags: ['no-visual'],
  args: {
    children: <TextField label="Workspace name" defaultValue="Northwind Studio" />,
    actions: <Button slot="close">Rename</Button>,
  },
  render: (args) => (
    <DialogTrigger>
      <Button variant="secondary">Rename the workspace</Button>
      <Dialog {...args} />
    </DialogTrigger>
  ),
  play: async ({ canvas, userEvent }) => {
    const trigger = canvas.getByRole('button', { name: 'Rename the workspace' });
    await userEvent.tab();
    await expect(trigger).toHaveFocus();
    await userEvent.keyboard('{Enter}');
    const body = within(document.body);
    const dialog = await body.findByRole('dialog', { name: 'Rename the workspace' });
    await waitFor(() => expect(dialog).toHaveFocus());
    const field = body.getByRole('textbox', { name: 'Workspace name' });
    await userEvent.tab();
    await expect(field).toHaveFocus();
    await userEvent.tab();
    await expect(body.getByRole('button', { name: 'Rename' })).toHaveFocus();
    // Past the last control, Tab cycles back to the first and never reaches the page.
    await userEvent.tab();
    await expect(field).toHaveFocus();
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(body.queryByRole('dialog')).not.toBeInTheDocument());
    await waitFor(() => expect(trigger).toHaveFocus());
  },
};

/**
 * A dialog opened from a dialog: one scrim paints, Escape closes the top one only, and focus goes back to
 * the trigger inside the first.
 */
export const Stacked: Story = {
  tags: ['no-visual'],
  args: {
    children: (
      <DialogTrigger>
        <Button variant="secondary">Discard the new name</Button>
        <Dialog
          title="Discard the new name?"
          tone="danger"
          icon={<TriangleAlert />}
          actions={
            <Button variant="danger" slot="close">
              Discard
            </Button>
          }
        />
      </DialogTrigger>
    ),
  },
  render: (args) => <Opened {...args} />,
  play: async ({ userEvent }) => {
    const body = within(document.body);
    const inner = body.getByRole('button', { name: 'Discard the new name' });
    await userEvent.click(inner);
    await waitFor(() => expect(body.getAllByRole('dialog')).toHaveLength(2));
    const [outerScrim, innerScrim] = [...document.querySelectorAll<HTMLElement>('.dialog-overlay')];
    if (!outerScrim || !innerScrim) throw new Error('No scrims');
    await waitFor(() => expect(innerScrim).not.toHaveAttribute('data-entering'));
    await expect(innerScrim).toHaveAttribute('data-stacked');
    await expect(getComputedStyle(innerScrim).backgroundColor).toBe('rgba(0, 0, 0, 0)');
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(body.getAllByRole('dialog')).toHaveLength(1));
    await expect(body.getByRole('dialog', { name: 'Rename the workspace' })).toBeInTheDocument();
    await waitFor(() => expect(inner).toHaveFocus());
    // The first dialog's scrim paints Deep Well at the theme's opacity: 0.4 in light and 0.65 in dark.
    const expected = document.documentElement.dataset.theme === 'dark' ? 0.65 : 0.4;
    await waitFor(() =>
      expect(alphaOf(getComputedStyle(outerScrim).backgroundColor)).toBeCloseTo(expected, 2),
    );
  },
};

/** A long body on a 375px screen: nothing scrolls sideways, and the action row stays in view. */
export const ScrollsAt375: Story = {
  tags: ['no-visual'],
  args: {
    children: LONG_BODY,
    actions: <Button slot="close">Rename</Button>,
  },
  render: (args) => (
    <div style={{ width: 375, maxWidth: '100%' }}>
      <Opened {...args} />
    </div>
  ),
  play: async ({ userEvent }) => {
    await atRest();
    await expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(window.innerWidth);
    await expect(within(document.body).getByRole('button', { name: 'Rename' })).toBeVisible();
    const actions = only('.dialog-actions').getBoundingClientRect();
    await expect(actions.bottom).toBeLessThanOrEqual(window.innerHeight);
    await expect(actions.right).toBeLessThanOrEqual(window.innerWidth);
    // The body scrolls and holds only text, so Tab reaches it, and from there the keys scroll it.
    await waitFor(() => expect(within(document.body).getByRole('dialog')).toHaveFocus());
    await userEvent.tab();
    await expect(only('.dialog-body')).toHaveFocus();
  },
};
