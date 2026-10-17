import type { Meta, StoryObj } from '@storybook/react-vite';
import { useEffect, type ReactElement } from 'react';
import { expect, waitFor, within } from 'storybook/test';
import { Button } from '../button';
import { Card, CardBody } from '../card';
import { Dialog } from '../dialog';
import { BOTTOM, frameAround } from '../stories/corner';
import { tokenColor } from '../stories/paint';
import { toast, type ToastOptions } from './toast';
import { ToastRegion, type ToastRegionProps } from './ToastRegion';

/** The viewport's width without a scrollbar, which is what the fixed region is placed against. */
const viewportWidth = (): number => document.documentElement.clientWidth;

/**
 * Resolves with the toasts on the page, newest first, once there are `count` of them and every rise on them
 * has finished, so a play reads them at rest and not 8px low and transparent.
 */
async function atRest(count: number): Promise<HTMLElement[]> {
  const shown = await waitFor(async () => {
    const found = within(document.body).queryAllByRole('alertdialog');
    await expect(found).toHaveLength(count);
    return found;
  });
  await Promise.all(
    shown.flatMap((each) =>
      each.getAnimations({ subtree: true }).map((animation) => animation.finished.catch(() => null)),
    ),
  );
  return shown;
}

/** The toast region React Aria portals to the body. */
function region(): HTMLElement {
  const element = document.querySelector<HTMLElement>('.toast-region');
  if (!element) throw new Error('No toast region');
  return element;
}

/**
 * A region and the toasts it shows from its first render, oldest first. They are added once, on mount, so a
 * baseline never catches one mid-way, and dropped when the story leaves, since the queue outlives it.
 */
function Shown({ toasts, ...props }: ToastRegionProps & { toasts: readonly ToastOptions[] }): ReactElement {
  useEffect(() => {
    for (const options of toasts) toast(options);
    return () => {
      toast.clear();
    };
  }, [toasts]);
  return <ToastRegion {...props} />;
}

/** One toast of each tone, oldest first, so the newest, the error, sits nearest the corner. */
const TONES: readonly ToastOptions[] = [
  {
    title: 'Sync started',
    description: 'New transactions show up in a minute or two.',
    tone: 'info',
    timeout: null,
  },
  {
    title: 'Saved',
    description: 'The budget for October is live for everyone in the workspace.',
    tone: 'success',
    timeout: null,
  },
  {
    title: 'The bank connection expires in 3 days',
    description: 'Reconnect it in Settings to keep importing.',
    tone: 'warning',
    timeout: null,
  },
  {
    title: 'The import failed',
    description: 'The file is not a CSV. Choose another one and try again.',
    tone: 'error',
    timeout: null,
  },
];

/** The token each tone's stripe is drawn in. */
const STRIPES = {
  info: '--color-slate',
  success: '--color-success',
  warning: '--color-warning',
  error: '--color-error',
} as const;

/** A toast an Undo can take back. It has no timeout of its own: the action keeps it. */
const WITH_ACTION: readonly ToastOptions[] = [
  {
    title: 'Groceries deleted',
    description: 'It is gone from every report.',
    tone: 'success',
    action: { label: 'Undo', onAction: () => undefined },
  },
];

const SHORT: readonly ToastOptions[] = [{ title: 'Saved', tone: 'success', timeout: null }];

/** Sixty letters with nowhere to break. */
const WORD = `${'Reconciliation'.repeat(4)}Done`;

const LONG: readonly ToastOptions[] = [
  {
    title: `Skipped 3 rows in ${WORD}`,
    description:
      'Their dates are in a format the import does not read. Fix them in the file and import it again, or add the three by hand from the transactions page.',
    tone: 'warning',
    timeout: null,
  },
];

const DISMISS: readonly ToastOptions[] = [
  { title: 'Saved', description: 'Your changes are live.', tone: 'success', timeout: null },
];

/** An info toast on a short timer of its own; the unit tests pin the default 6 seconds. */
const TIMED: readonly ToastOptions[] = [
  {
    title: 'Sync started',
    description: 'New transactions show up in a minute or two.',
    tone: 'info',
    timeout: 3000,
  },
];

/** No toast on mount: the story raises its own. */
const NONE: readonly ToastOptions[] = [];

const meta = {
  title: 'Components/Toast',
  component: ToastRegion,
  parameters: {
    // Every story fills the one queue, and a docs page that drew them inline would stack them all together.
    docs: { story: { inline: false, height: '480px' } },
  },
} satisfies Meta<typeof ToastRegion>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * The four tones, each with a second line: a float card with the frame and a 4px stripe at its inline start,
 * slate for info, then success, warning and error. The newest sits nearest the bottom end corner, 16px in,
 * and the older ones rise above it.
 */
export const Tones: Story = {
  render: (args) => <Shown {...args} maxVisibleToasts={4} toasts={TONES} />,
  play: async () => {
    const shown = await atRest(4);
    // React Aria lists the newest first, and the column is reversed, so the first in the DOM is the lowest.
    const bottoms = shown.map((each) => each.getBoundingClientRect().bottom);
    await expect(Math.max(...bottoms)).toBe(bottoms[0]);
    await expect(shown.map((each) => each.getAttribute('data-tone'))).toEqual([
      'error',
      'warning',
      'success',
      'info',
    ]);
    for (const each of shown) {
      const tone = each.getAttribute('data-tone') as keyof typeof STRIPES;
      const style = getComputedStyle(each);
      await expect(style.borderInlineStartWidth, tone).toBe('4px');
      await expect(style.borderInlineStartColor, tone).toBe(tokenColor(STRIPES[tone]));
    }
    // The corner: 16px from the end edge and the bottom of the viewport.
    const box = region().getBoundingClientRect();
    await expect(viewportWidth() - box.right).toBeCloseTo(16, 1);
    await expect(window.innerHeight - box.bottom).toBeCloseTo(16, 1);
  },
};

/**
 * A toast with an Undo stays until it is used or dismissed. The action is a secondary Button and the dismiss
 * the 40px ghost IconButton, at the toast's end.
 */
export const WithAction: Story = {
  render: (args) => <Shown {...args} toasts={WITH_ACTION} />,
  play: async () => {
    const [shown] = await atRest(1);
    if (!shown) throw new Error('No toast');
    const undo = within(shown).getByRole('button', { name: 'Undo' });
    await expect(undo).toHaveClass('button', 'button-secondary');
    const dismiss = within(shown).getByRole('button', { name: 'Dismiss' });
    const box = dismiss.getBoundingClientRect();
    await expect(box.width).toBeCloseTo(40, 1);
    await expect(box.height).toBeCloseTo(40, 1);
  },
};

/**
 * A one-line toast. The dismiss pulls in by 8px at each end, so its 40px target sets a 24px band and not a
 * 40px one: the toast is its 1px frame, 16px of padding, that band, 16px and 1px, 58px in all.
 */
export const Short: Story = {
  render: (args) => <Shown {...args} toasts={SHORT} />,
  play: async () => {
    const [shown] = await atRest(1);
    if (!shown) throw new Error('No toast');
    await expect(Math.abs(shown.getBoundingClientRect().height - 58)).toBeLessThanOrEqual(1);
    const dismiss = within(shown).getByRole('button', { name: 'Dismiss' });
    await expect(dismiss.getBoundingClientRect().height).toBeCloseTo(40, 1);
    await expect(dismiss.getBoundingClientRect().width).toBeCloseTo(40, 1);
  },
};

/**
 * A title with a sixty-letter word and a long second line break inside the card, which never grows past the
 * viewport less 2rem, so nothing scrolls sideways at 375px.
 */
export const LongText: Story = {
  render: (args) => <Shown {...args} toasts={LONG} />,
  play: async () => {
    const [shown] = await atRest(1);
    if (!shown) throw new Error('No toast');
    const box = region().getBoundingClientRect();
    await expect(viewportWidth() - box.right).toBeCloseTo(16, 1);
    await expect(box.width).toBeCloseTo(Math.min(448, viewportWidth() - 32), 1);
    for (const part of [
      shown,
      shown.querySelector('.toast-title'),
      shown.querySelector('.toast-description'),
    ]) {
      if (!part) throw new Error('A part is missing');
      await expect(part.scrollWidth).toBeLessThanOrEqual(part.clientWidth);
    }
    await expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(window.innerWidth);
  },
};

/**
 * Keyboard focus on the dismiss draws the ring around it. F6 reaches the region from the keyboard, which a
 * play function cannot send, so a Tab gives the keyboard the modality and focus goes to the dismiss directly.
 */
export const DismissFocused: Story = {
  render: (args) => <Shown {...args} toasts={DISMISS} />,
  play: async ({ userEvent }) => {
    const [shown] = await atRest(1);
    if (!shown) throw new Error('No toast');
    const dismiss = within(shown).getByRole('button', { name: 'Dismiss' });
    await userEvent.tab();
    dismiss.focus();
    await expect(dismiss).toHaveFocus();
    await expect(dismiss).toHaveAttribute('data-focus-visible');
    const ring = getComputedStyle(dismiss);
    await expect(ring.outlineStyle).toBe('solid');
    await expect(ring.outlineColor).toBe(tokenColor('--focus-ring-color'));
    // Only the control is ringed, not the toast around it.
    await expect(shown).not.toHaveAttribute('data-focus-visible');
  },
};

/**
 * A toast raised while a dialog is open is announced: the dialog hides the page from assistive technology
 * and leaves the status host out. It sits above the scrim and takes the press, and the press dismisses the
 * toast and leaves the dialog open, with focus still inside it.
 */
export const AboveADialog: Story = {
  tags: ['no-visual'],
  render: (args) => (
    <>
      <main>
        <p>The page behind the dialog.</p>
      </main>
      <Dialog
        defaultOpen
        title="Rename the workspace"
        description="The new name shows in the header and in every invite."
        actions={<Button slot="close">Done</Button>}
      />
      <Shown {...args} toasts={SHORT} />
    </>
  ),
  play: async ({ userEvent }) => {
    const body = within(document.body);
    const dialog = await body.findByRole('dialog', { name: 'Rename the workspace' });
    await waitFor(() => expect(dialog.contains(document.activeElement)).toBe(true));
    const [shown] = await atRest(1);
    if (!shown) throw new Error('No toast');
    // The page is hidden while the dialog is open, and the status host beside it is not, so it is heard.
    const hidden = '[aria-hidden="true"], [inert]';
    await expect(document.querySelector('main')?.closest(hidden)).not.toBeNull();
    const status = body.getByRole('status');
    await expect(status.closest(hidden)).toBeNull();
    await expect(status).toHaveTextContent('Saved');
    const box = shown.getBoundingClientRect();
    const hit = document.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2);
    await expect(shown.contains(hit)).toBe(true);
    await userEvent.click(within(shown).getByRole('button', { name: 'Dismiss' }));
    await waitFor(() => expect(body.queryByRole('alertdialog')).not.toBeInTheDocument());
    await expect(body.getByRole('dialog', { name: 'Rename the workspace' })).toBe(dialog);
    await waitFor(() => expect(dialog.contains(document.activeElement)).toBe(true));
  },
};

/**
 * The pointer over a toast holds it past its timeout, and it leaves once the pointer does. WCAG 2.2.1 for
 * free: a reader who needs longer keeps it by pointing at it, or by moving focus into it. The toast's own
 * 3 seconds keep the story short; the wait under the pointer is longer than the whole timeout, so only the
 * pause explains the toast still being there.
 */
export const PauseOnHover: Story = {
  tags: ['no-visual'],
  render: (args) => <Shown {...args} toasts={TIMED} />,
  play: async ({ userEvent }) => {
    const [shown] = await atRest(1);
    if (!shown) throw new Error('No toast');
    await userEvent.hover(shown);
    await new Promise((resolve) => setTimeout(resolve, 4000));
    await expect(shown).toBeInTheDocument();
    await userEvent.unhover(shown);
    await waitFor(() => expect(shown).not.toBeInTheDocument(), { timeout: 5000 });
  },
};

/**
 * The region follows the page root and copies no scope: a toast raised by a button in a dark card is drawn
 * in the page's theme, since it reports on the app and not on the card.
 */
export const InDarkScope: Story = {
  tags: ['no-visual'],
  render: (args) => (
    <>
      <div
        data-theme="dark"
        style={{ ...frameAround(24), background: 'var(--color-canvas)' }}
      >
        <Card>
          <CardBody>
            <p>A card in a dark block.</p>
            <Button
              style={BOTTOM}
              onPress={() => {
                toast({ title: 'Saved', tone: 'success', timeout: null });
              }}
            >
              Save
            </Button>
          </CardBody>
        </Card>
      </div>
      <Shown {...args} toasts={NONE} />
    </>
  ),
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Save' }));
    const [shown] = await atRest(1);
    if (!shown) throw new Error('No toast');
    await expect(region()).not.toHaveAttribute('data-theme');
    await expect(region()).not.toHaveAttribute('data-shape');
    await expect(getComputedStyle(shown).backgroundColor).toBe(tokenColor('--color-float'));
  },
};
