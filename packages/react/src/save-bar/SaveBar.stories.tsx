import type { Meta, StoryObj } from '@storybook/react-vite';
import { ArrowLeftRight, FileText, House, Target } from 'lucide-react';
import { useEffect, type ReactElement, type ReactNode } from 'react';
import { I18nProvider } from 'react-aria-components';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { AppShell } from '../app-shell';
import { BottomTabBar, BottomTabBarItem } from '../bottom-tab-bar';
import { Button } from '../button';
import { focusOn } from '../stories/focus';
import { DemoHeader, DemoNav } from '../stories/shell-fixture';
import { DESKTOP, PHONE, VIEWPORT_OPTIONS } from '../stories/viewports';
import { TextArea } from '../text-area';
import { TextField } from '../text-field';
import { toast, ToastRegion } from '../toast';
import { UploadTray, type UploadItem } from '../upload-tray';
import { SaveBar, type SaveBarProps } from './SaveBar';

/** The receipt's fields, in the order a long form shows them. */
const FIELDS: [label: string, value: string][] = [
  ['Merchant', 'Corner Mart'],
  ['Date', '14 Oct 2026'],
  ['Amount', '$42.18'],
  ['Category', 'Food'],
  ['Memo', 'Milk, bread and eggs'],
  ['Reference', 'R-0142'],
  ['Paid by', 'Ada Lovelace'],
  ['Project', 'Household'],
  ['Tax', '$3.12'],
  ['Notes', 'Kept the paper copy'],
];

/** The form's holder, whose last child is the bar: `width: min(48rem, 100%)`, and `count` fields above it. */
function Form({ count = 2, children }: { count?: number; children: ReactNode }): ReactElement {
  return (
    <form
      style={{ display: 'grid', gap: 'var(--spacing-peer)', width: 'min(48rem, 100%)' }}
      onSubmit={(event) => {
        event.preventDefault();
      }}
    >
      {FIELDS.slice(0, count).map(([label, value]) => (
        <TextField key={label} label={label} defaultValue={value} />
      ))}
      {children}
    </form>
  );
}

/** The phone's tab bar: Documents current, as on a review page. */
const TABS: ReactNode = (
  <BottomTabBar aria-label="Main">
    <BottomTabBarItem href="#home" icon={<House />}>
      Home
    </BottomTabBarItem>
    <BottomTabBarItem href="#transactions" icon={<ArrowLeftRight />}>
      Transactions
    </BottomTabBarItem>
    <BottomTabBarItem href="#documents" icon={<FileText />} isCurrent>
      Documents
    </BottomTabBarItem>
    <BottomTabBarItem href="#goals" icon={<Target />}>
      Goals
    </BottomTabBarItem>
  </BottomTabBar>
);

/** Three files in flight, as the tray holds them while a review page is open. */
const UPLOADS: UploadItem[] = [
  { id: 1, name: 'receipt-march.pdf', status: 'saved', href: '#march' },
  { id: 2, name: 'invoice-0142.pdf', status: 'uploading', progress: 0.45, progressLabel: '1.8 of 4 MB' },
  { id: 3, name: 'statement-september.pdf', status: 'waiting' },
];

/** The shell with a long form whose last child is the bar, the tab bar on a phone and, if asked, the tray. */
function ShellForm({ tray = false, ...bar }: SaveBarProps & { tray?: boolean }): ReactElement {
  return (
    <AppShell
      sidebar={<DemoNav />}
      header={<DemoHeader title="Review receipt" />}
      bottomBar={TABS}
      floating={tray ? <UploadTray items={UPLOADS} /> : undefined}
    >
      <div style={{ padding: 'var(--spacing-inset)' }}>
        <Form count={FIELDS.length}>
          <SaveBar {...bar} />
        </Form>
      </div>
    </AppShell>
  );
}

/** Two toasts raised once, on mount, and cleared when the story leaves, since the queue outlives it. */
function Toasts(): ReactElement {
  useEffect(() => {
    toast({
      title: 'Receipt saved',
      description: 'Corner Mart is in your documents.',
      tone: 'success',
      timeout: null,
    });
    toast({
      title: 'Sync started',
      description: 'New transactions show up in a minute.',
      tone: 'info',
      timeout: null,
    });
    return () => {
      toast.clear();
    };
  }, []);
  return <ToastRegion />;
}

/** The one element on the page that matches `selector`, wherever it was drawn. */
function only(selector: string): HTMLElement {
  const found = document.querySelectorAll<HTMLElement>(selector);
  const [first] = found;
  if (found.length !== 1 || !first)
    throw new Error(`Expected one ${selector}, found ${String(found.length)}`);
  return first;
}

const rect = (element: Element): DOMRect => element.getBoundingClientRect();

/** How long a play waits for what follows a key or an animation: a busy runner, WebKit's above all, is slow. */
const LONG = { timeout: 5000 };

/**
 * How far a field may still reach under a bar once it counts as clear: WebKit and Firefox round a scroll position to
 * a whole pixel, and the fields sit on fractional lines, so a browser's own scroll can stop up to a pixel short.
 */
const ROUNDING = 1;

/** The gap a focused field keeps above the bars, `--spacing-inset`, so its ring and its last line show whole. */
const GAP = 16;

/** The field a control belongs to, its label, description and error line included, or the control alone. */
const fieldOf = (control: Element): Element => control.closest('.field') ?? control;

/** Presses `keys` unless the story has gone: a play that outlived its time limit stops rather than type on. */
function guardedKeys(anchor: Element): (keys: string) => Promise<void> {
  return async (keys) => {
    if (!anchor.isConnected) throw new Error('The story has gone');
    await userEvent.keyboard(keys);
  };
}

/** Resolves with the tray's phone bar or panel once its rise has finished, so a play reads it at rest. */
async function atRest(selector: string): Promise<HTMLElement> {
  const face = await waitFor(() => only(selector));
  await Promise.all(face.getAnimations().map((animation) => animation.finished.catch(() => null)));
  return face;
}

const meta = {
  title: 'Components/SaveBar',
  component: SaveBar,
  args: {
    message: '2 changes to Corner Mart, 14 Oct',
    actionLabel: 'Save',
    onAction: fn(),
    onCancel: fn(),
  },
  parameters: { layout: 'padded', viewport: { options: VIEWPORT_OPTIONS } },
  render: (args) => (
    <Form>
      <SaveBar {...args} />
    </Form>
  ),
} satisfies Meta<SaveBarProps>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Under a short form: the sentence at the start, Cancel and the ink Save at the end, one line. */
export const Default: Story = {
  tags: ['density'],
  play: async ({ canvas, canvasElement }) => {
    const bar = canvas.getByRole('group', { name: '2 changes to Corner Mart, 14 Oct' });
    const save = canvas.getByRole('button', { name: 'Save' });
    const cancel = canvas.getByRole('button', { name: 'Cancel' });
    // One line: the buttons beside the sentence, the action last, at the end.
    await expect(rect(save).left).toBeGreaterThan(rect(cancel).right);
    await expect(Math.abs(rect(save).top - rect(cancel).top)).toBeLessThan(1);
    await expect(rect(save).top).toBeLessThan(rect(find(canvasElement, '.save-bar-message')).bottom);
    // The action sits clear of the bar's corner curve: its gap to the end edge is at least the bar's radius.
    const radius = parseFloat(getComputedStyle(bar).borderTopRightRadius);
    await expect(rect(bar).right - rect(save).right).toBeGreaterThanOrEqual(Math.min(radius, 9999) - 0.5);
    // A button keeps its own uniform round, never a corner of the bar's.
    const own = getComputedStyle(save);
    await expect(own.borderTopRightRadius).toBe(own.borderTopLeftRadius);
    await expect(own.borderBottomRightRadius).toBe(own.borderTopLeftRadius);
  },
};

/** Unsaved changes: the clay chip over the sentence. */
export const Dirty: Story = {
  args: { isDirty: true },
  play: async ({ canvasElement }) => {
    const chip = find(canvasElement, '.save-bar-chip');
    await expect(chip).toHaveTextContent('Unsaved changes');
    await expect(rect(chip).bottom).toBeLessThanOrEqual(
      rect(find(canvasElement, '.save-bar-message')).top + 0.5,
    );
  },
};

/** A review: the action names its outcome, with Skip between Cancel and it. */
export const Review: Story = {
  args: {
    message: 'Corner Mart, 14 Oct: 1 of 3 to review',
    actionLabel: 'Confirm and review next (2 left)',
    secondaryActions: <Button variant="secondary">Skip</Button>,
  },
};

/** The action pending: its spinner, Cancel disabled, and "Saving" in the status once the pause has passed. */
export const Pending: Story = {
  args: { isDirty: true, isPending: true },
  play: async ({ canvasElement }) => {
    await waitFor(() => expect(find(canvasElement, '.save-bar-status')).toHaveTextContent('Saving'), {
      timeout: 5000,
    });
  },
};

/** A save that failed: the status in error with its icon. */
export const ErrorStatus: Story = {
  args: { isDirty: true, status: "Couldn't save. Try again.", statusTone: 'error' },
};

/**
 * Two narrow holders, under 36rem: the actions on a line of their own, side by side in DOM order and growing along
 * it; at 22rem the long action is wider than the line with the others, so it wraps to a line of its own. Never a
 * column of stacked buttons.
 */
export const Narrow: Story = {
  args: {
    message: 'Corner Mart, 14 Oct: 1 of 3 to review',
    actionLabel: 'Confirm and review next (2 left)',
    isDirty: true,
    secondaryActions: <Button variant="secondary">Skip</Button>,
  },
  render: (args) => (
    <div style={{ display: 'grid', gap: 'var(--spacing-separate)' }}>
      <div style={{ width: 'min(30rem, 100%)' }}>
        <SaveBar {...args} className="at-30" />
      </div>
      <div style={{ width: 'min(22rem, 100%)' }}>
        <SaveBar {...args} className="at-22" />
      </div>
    </div>
  ),
  play: async ({ canvasElement }) => {
    for (const bar of ['.at-30', '.at-22'].map((selector) => find(canvasElement, selector))) {
      const text = rect(find(bar, '.save-bar-text'));
      const actions = rect(find(bar, '.save-bar-actions'));
      const buttons = within(bar).getAllByRole('button');
      await expect(buttons.at(-1)).toHaveTextContent('Confirm and review next (2 left)');
      // The sentence above, the buttons on lines of their own under it.
      for (const button of buttons) await expect(rect(button).top).toBeGreaterThanOrEqual(text.bottom - 0.5);
      // DOM order, the reading order: each next button beside the last on its line, or on a later line.
      for (const [index, button] of buttons.entries()) {
        const next = buttons[index + 1];
        if (!next) continue;
        if (Math.abs(rect(next).top - rect(button).top) < 1)
          await expect(rect(next).left).toBeGreaterThan(rect(button).right);
        else await expect(rect(next).top).toBeGreaterThan(rect(button).bottom - 0.5);
      }
      // Each line's buttons grow to fill it, so the last button of every line ends at the actions' end.
      const lines = new Map<number, HTMLElement[]>();
      for (const button of buttons) {
        const top = Math.round(rect(button).top);
        lines.set(top, [...(lines.get(top) ?? []), button]);
      }
      for (const line of lines.values()) {
        const [first, last] = [line[0], line.at(-1)];
        if (!first || !last) continue;
        await expect(rect(first).left).toBeCloseTo(actions.left, 0);
        await expect(rect(last).right).toBeCloseTo(actions.right, 0);
      }
      // Both bottom corners' curves stay clear: the actions sit the surface radius in from either edge.
      const radius = Math.min(parseFloat(getComputedStyle(bar).borderBottomLeftRadius), 9999);
      await expect(actions.left - rect(bar).left).toBeGreaterThanOrEqual(radius - 0.5);
      await expect(rect(bar).right - actions.right).toBeGreaterThanOrEqual(radius - 0.5);
    }
    // At 22rem the long action wraps to a line of its own, below Cancel and Skip, which share theirs.
    const [cancel, skip, action] = within(find(canvasElement, '.at-22')).getAllByRole('button');
    if (!cancel || !skip || !action) throw new Error('Three buttons');
    await expect(Math.abs(rect(skip).top - rect(cancel).top)).toBeLessThan(1);
    await expect(rect(action).top).toBeGreaterThan(rect(cancel).bottom - 0.5);
  },
};

/** A Persian form: the sentence at the right, the actions at the left. */
export const RightToLeft: Story = {
  render: () => (
    <I18nProvider locale="fa-IR">
      <div dir="rtl" lang="fa" style={{ width: 'min(48rem, 100%)' }}>
        <SaveBar
          message="۲ تغییر در فروشگاه محله، ۲۲ مهر"
          isDirty
          actionLabel="ذخیره"
          onAction={() => undefined}
          onCancel={() => undefined}
          labels={{ unsaved: 'تغییرات ذخیره نشده', cancel: 'انصراف' }}
        />
      </div>
    </I18nProvider>
  ),
  play: async ({ canvas, canvasElement }) => {
    const bar = find(canvasElement, '.save-bar');
    const save = canvas.getByRole('button', { name: 'ذخیره' });
    await expect(rect(save).left - rect(bar).left).toBeLessThan(rect(bar).width / 2);
    await expect(rect(find(bar, '.save-bar-text')).right).toBeGreaterThan(rect(save).right);
  },
};

/** A form taller than the window: the bar stuck 16px above the viewport's bottom, over the fields under it. */
export const InForm: Story = {
  tags: ['viewport-desktop'],
  globals: DESKTOP,
  args: { isDirty: true },
  parameters: { layout: 'padded' },
  render: (args) => (
    <Form count={FIELDS.length}>
      <SaveBar {...args} />
    </Form>
  ),
  play: async ({ canvasElement }) => {
    const bar = find(canvasElement, '.save-bar');
    await waitFor(() => expect(window.innerHeight - rect(bar).bottom).toBeCloseTo(16, 0), LONG);
    // Some field lies under it, scrolled past by nothing yet.
    const under = [...canvasElement.querySelectorAll('.field')].some(
      (field) => rect(field).bottom > rect(bar).top,
    );
    await expect(under).toBe(true);
  },
};

/**
 * On a phone, in the shell: the bar stuck 16px above the tab bar, the sentence over one line of buttons, Cancel and
 * Save side by side and sharing it, never stacked.
 */
export const Phone: Story = {
  tags: ['viewport-phone'],
  globals: PHONE,
  args: { isDirty: true },
  parameters: { layout: 'fullscreen' },
  render: (args) => <ShellForm {...args} />,
  play: async () => {
    const bar = await waitFor(() => only('.save-bar'), LONG);
    await waitFor(() => expect(rect(only('.tab-bar')).top - rect(bar).bottom).toBeCloseTo(16, 0), LONG);
    await expect(rect(bar).left).toBeCloseTo(16, 0);
    const [cancel, save] = within(bar).getAllByRole('button');
    if (!cancel || !save) throw new Error('Two buttons');
    await expect(Math.abs(rect(save).top - rect(cancel).top)).toBeLessThan(1);
    await expect(rect(save).left).toBeGreaterThan(rect(cancel).right);
    await expect(rect(save).right - rect(cancel).left).toBeCloseTo(
      rect(find(bar, '.save-bar-actions')).width,
      0,
    );
  },
};

/**
 * Spec 12's stack at 375 by 812, from the bottom: the tab bar, the save bar, the tray's bar and the toasts, each
 * 16px above the one under it.
 */
export const BottomEdge: Story = {
  tags: ['viewport-phone'],
  globals: PHONE,
  args: { isDirty: true },
  parameters: { layout: 'fullscreen' },
  render: (args) => (
    <>
      <ShellForm {...args} tray />
      <Toasts />
    </>
  ),
  play: async () => {
    const bar = await waitFor(() => only('.save-bar'), LONG);
    const tray = await atRest('.upload-tray-bar');
    const region = await waitFor(() => only('.toast-region'), LONG);
    await waitFor(() => expect(region.querySelectorAll('.toast')).toHaveLength(2), LONG);
    await waitFor(async () => {
      await expect(rect(only('.tab-bar')).top - rect(bar).bottom).toBeCloseTo(16, 0);
      await expect(rect(bar).top - rect(tray).bottom).toBeCloseTo(16, 0);
      await expect(rect(tray).top - rect(region).bottom).toBeCloseTo(16, 0);
    }, LONG);
  },
};

/** The same at 1280: no tab bar, the tray 16px above the save bar's top, and the toasts above the tray. */
export const BottomEdgeWide: Story = {
  tags: ['viewport-desktop'],
  globals: DESKTOP,
  args: { isDirty: true },
  parameters: { layout: 'fullscreen' },
  render: (args) => (
    <>
      <ShellForm {...args} tray />
      <Toasts />
    </>
  ),
  play: async () => {
    const bar = await waitFor(() => only('.save-bar'), LONG);
    const tray = await atRest('.upload-tray');
    const region = await waitFor(() => only('.toast-region'), LONG);
    await waitFor(() => expect(region.querySelectorAll('.toast')).toHaveLength(2), LONG);
    await waitFor(async () => {
      await expect(window.innerHeight - rect(bar).bottom).toBeCloseTo(16, 0);
      await expect(rect(bar).top - rect(tray).bottom).toBeCloseTo(16, 0);
      await expect(rect(tray).top - rect(region).bottom).toBeCloseTo(16, 0);
    }, LONG);
  },
};

/** Cancel while dirty asks; Escape keeps editing and gives focus back to Cancel; Discard changes calls onCancel. */
export const CancelGuard: Story = {
  tags: ['no-visual', 'webkit', 'firefox'],
  args: { isDirty: true },
  play: async ({ args, canvas }) => {
    const cancel = canvas.getByRole('button', { name: 'Cancel' });
    const press = guardedKeys(cancel);
    await focusOn(cancel);
    await press('{Enter}');
    const question = await waitFor(
      () => within(document.body).getByRole('alertdialog', { name: 'Discard changes?' }),
      LONG,
    );
    // The question starts on the safe answer.
    await waitFor(
      () => expect(within(question).getByRole('button', { name: 'Keep editing' })).toHaveFocus(),
      LONG,
    );
    await press('{Escape}');
    await waitFor(() => expect(within(document.body).queryByRole('alertdialog')).toBeNull(), LONG);
    await waitFor(() => expect(cancel).toHaveFocus(), LONG);
    await expect(args.onCancel).not.toHaveBeenCalled();
    await press('{Enter}');
    const again = await waitFor(() => within(document.body).getByRole('alertdialog'), LONG);
    const discard = within(again).getByRole('button', { name: 'Discard changes' });
    await waitFor(
      () => expect(within(again).getByRole('button', { name: 'Keep editing' })).toHaveFocus(),
      LONG,
    );
    await press('{Tab}');
    await waitFor(() => expect(discard).toHaveFocus(), LONG);
    await press('{Enter}');
    await waitFor(() => expect(args.onCancel).toHaveBeenCalledTimes(1), LONG);
  },
};

/**
 * WCAG 2.4.11 at 375 by 812, with the tab bar, the save bar and the tray's bar on the page: a field that sits under
 * them, reached by Tab and by focus(), ends a gap clear of the topmost (risk R6).
 */
export const FocusClear: Story = {
  tags: ['no-visual', 'viewport-phone', 'webkit', 'firefox'],
  globals: PHONE,
  args: { isDirty: true },
  parameters: { layout: 'fullscreen' },
  render: (args) => <ShellForm {...args} tray />,
  play: async () => {
    const bar = await waitFor(() => only('.save-bar'), LONG);
    const tray = await atRest('.upload-tray-bar');
    const scroller = document.scrollingElement ?? document.documentElement;
    const inputs = [...document.querySelectorAll<HTMLInputElement>('.app-shell-workspace input')];
    /** The top of what covers the page's bottom: the tray's bar, which sits above the save bar. */
    const cover = (): number => Math.min(rect(bar).top, rect(tray).top);
    try {
      scroller.scrollTop = 0;
      await waitFor(() => expect(rect(bar).bottom).toBeLessThan(window.innerHeight), LONG);
      // The first field under the covers, and the one before it, which is clear.
      const index = inputs.findIndex(
        (input) => rect(input).bottom > cover() && rect(input).top < window.innerHeight,
      );
      const [before, under] = [inputs[index - 1], inputs[index]];
      if (!before || !under) throw new Error('No field under the bars');
      await expect(rect(before).bottom).toBeLessThanOrEqual(cover());
      // By Tab: the field ends the gap above the covers, its ring and its last line whole.
      await focusOn(before);
      await guardedKeys(bar)('{Tab}');
      await waitFor(() => expect(under).toHaveFocus(), LONG);
      await waitFor(
        () => expect(rect(fieldOf(under)).bottom).toBeLessThanOrEqual(cover() - GAP + ROUNDING),
        LONG,
      );
      // By focus(), from the top again.
      under.blur();
      scroller.scrollTop = 0;
      await waitFor(() => expect(rect(under).bottom).toBeGreaterThan(cover()), LONG);
      under.focus();
      await waitFor(
        () => expect(rect(fieldOf(under)).bottom).toBeLessThanOrEqual(cover() - GAP + ROUNDING),
        LONG,
      );
    } finally {
      scroller.scrollTop = 0;
    }
  },
};

/** Resolves after `count` frames and a pause, once a focus and the clear it schedules two frames later have run. */
async function settled(count = 4): Promise<void> {
  for (let frame = 0; frame < count; frame += 1) {
    await new Promise((resolve) => requestAnimationFrame(resolve));
  }
  await new Promise((resolve) => setTimeout(resolve, 100));
}

/**
 * Tab onto the stuck bar's Cancel, from the last field below the view, leaves the page where it was: the bar's own
 * controls are never scrolled for. The root's scroll padding this replaced moved the page here, as the browser
 * scrolled to bring the stuck Cancel out of the padding (spec correction 121).
 */
export const TabOntoStuckBar: Story = {
  tags: ['no-visual', 'viewport-desktop', 'webkit', 'firefox'],
  globals: DESKTOP,
  args: { isDirty: true },
  parameters: { layout: 'fullscreen' },
  render: (args) => <ShellForm {...args} />,
  play: async () => {
    const bar = await waitFor(() => only('.save-bar'), LONG);
    const cancel = within(bar).getByRole('button', { name: 'Cancel' });
    const last = [...document.querySelectorAll<HTMLInputElement>('.app-shell-workspace input')].at(-1);
    if (!last) throw new Error('No field');
    const scroller = document.scrollingElement ?? document.documentElement;
    try {
      scroller.scrollTop = 120;
      await waitFor(() => expect(Math.abs(scroller.scrollTop - 120)).toBeLessThanOrEqual(ROUNDING), LONG);
      // Stuck its inset above the view's bottom, with the last field below the view.
      await waitFor(() => expect(window.innerHeight - rect(bar).bottom).toBeCloseTo(16, 0), LONG);
      await expect(rect(last).top).toBeGreaterThan(window.innerHeight);
      last.focus({ preventScroll: true });
      await waitFor(() => expect(last).toHaveFocus(), LONG);
      await settled();
      const before = scroller.scrollTop;
      await guardedKeys(bar)('{Tab}');
      await waitFor(() => expect(cancel).toHaveFocus(), LONG);
      await settled();
      await expect(Math.abs(scroller.scrollTop - before)).toBeLessThanOrEqual(ROUNDING);
      await expect(window.innerHeight - rect(bar).bottom).toBeCloseTo(16, 0);
    } finally {
      scroller.scrollTop = 0;
    }
  },
};

/**
 * A bar in a box that scrolls, as in a SidePanel's or a Dialog's body: a field under the bar, reached by Tab and by
 * focus(), is scrolled clear of it in the box's own scroll port.
 */
export const FocusClearInScroller: Story = {
  tags: ['no-visual', 'webkit', 'firefox'],
  args: { isDirty: true },
  render: (args) => (
    <div className="scroller" style={{ blockSize: '24rem', overflowY: 'auto', paddingInline: 4 }}>
      <Form count={FIELDS.length}>
        <SaveBar {...args} />
      </Form>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const scroller = find(canvasElement, '.scroller');
    const bar = find(scroller, '.save-bar');
    const inputs = [...scroller.querySelectorAll<HTMLInputElement>('input')];
    const gapAbove = (): number => rect(bar).top - GAP + ROUNDING;
    try {
      scroller.scrollTop = 0;
      await waitFor(() => expect(rect(bar).bottom).toBeLessThan(rect(scroller).bottom), LONG);
      const index = inputs.findIndex(
        (input) => rect(input).bottom > rect(bar).top && rect(input).top < rect(scroller).bottom,
      );
      const [before, under] = [inputs[index - 1], inputs[index]];
      if (!before || !under) throw new Error('No field under the bar');
      // By Tab: the field ends the gap above the bar.
      await focusOn(before);
      await guardedKeys(bar)('{Tab}');
      await waitFor(() => expect(under).toHaveFocus(), LONG);
      await waitFor(() => expect(rect(fieldOf(under)).bottom).toBeLessThanOrEqual(gapAbove()), LONG);
      // By focus(), from the top again.
      under.blur();
      scroller.scrollTop = 0;
      await waitFor(() => expect(rect(under).bottom).toBeGreaterThan(rect(bar).top), LONG);
      under.focus();
      await waitFor(() => expect(rect(fieldOf(under)).bottom).toBeLessThanOrEqual(gapAbove()), LONG);
    } finally {
      scroller.scrollTop = 0;
    }
  },
};

/**
 * A text area taller than the room above the bar: the bar scrolls it up only until its top meets the view's top,
 * never past it, so the reader sees where it starts. Focused without the browser's own scroll, so the bar's alone
 * is measured.
 */
export const FocusClearTall: Story = {
  tags: ['no-visual'],
  args: { isDirty: true },
  render: (args) => (
    <Form count={1}>
      <TextArea label="Notes" defaultValue="Kept the paper copy" rows={60} />
      <SaveBar {...args} />
    </Form>
  ),
  play: async ({ canvasElement }) => {
    const bar = find(canvasElement, '.save-bar');
    const notes = find(canvasElement, 'textarea');
    const scroller = document.scrollingElement ?? document.documentElement;
    try {
      scroller.scrollTop = 0;
      await waitFor(() => expect(window.innerHeight - rect(bar).bottom).toBeCloseTo(16, 0), LONG);
      const start = rect(notes).top;
      await expect(start).toBeGreaterThan(8);
      await expect(rect(notes).bottom).toBeGreaterThan(rect(bar).top);
      notes.focus({ preventScroll: true });
      await waitFor(() => expect(rect(notes).top).toBeLessThan(start - 1), LONG);
      // Its top at the view's top, never above it, though its end is still under the bar.
      await expect(rect(notes).top).toBeGreaterThanOrEqual(-ROUNDING / 2);
      await expect(rect(notes).top).toBeLessThanOrEqual(ROUNDING);
    } finally {
      scroller.scrollTop = 0;
    }
  },
};

/**
 * A save that takes longer than the pause, pressed by keyboard, focus kept on the action. React Aria's Button says
 * the pending's start and end itself, assertively, while it holds focus, so the status says nothing of it; the
 * `Pending` story, with focus elsewhere, shows "Saving" there. React Aria's live region keeps each sentence 7
 * seconds, so axe, run after this play and after the next story's, reads them: once the story has gone, the
 * Button has written their words onto them in place of its ids.
 */
export const PendingStatus: Story = {
  tags: ['no-visual'],
  args: {
    onAction: fn(
      () =>
        new Promise<void>((resolve) => {
          setTimeout(resolve, 1500);
        }),
    ),
  },
  play: async ({ canvas, canvasElement }) => {
    const save = canvas.getByRole('button', { name: 'Save' });
    const status = find(canvasElement, '.save-bar-status');
    // Whether the status ever said anything while the save ran.
    let spoke = false;
    const watch = new MutationObserver(() => {
      if (status.textContent !== '') spoke = true;
    });
    watch.observe(status, { childList: true, subtree: true, characterData: true });
    await focusOn(save);
    await guardedKeys(save)('{Enter}');
    try {
      await waitFor(() => expect(save).toHaveAttribute('data-pending', 'true'), LONG);
      await expect(canvas.getByRole('button', { name: 'Cancel' })).toBeDisabled();
      await waitFor(() => expect(save).not.toHaveAttribute('data-pending'), LONG);
      await expect(save).toHaveFocus();
      await expect(spoke).toBe(false);
      await expect(status).toBeEmptyDOMElement();
      // The end is said by the action's own id, once it has settled with focus on it.
      await waitFor(
        () =>
          expect(
            document.querySelector(`[data-live-announcer] [aria-labelledby="${CSS.escape(save.id)}"]`),
          ).not.toBeNull(),
        LONG,
      );
    } finally {
      watch.disconnect();
    }
  },
};

/** A bar on two lines writes its measured height on the root, taller than the one-line value the tokens give. */
export const OffsetMeasured: Story = {
  tags: ['no-visual'],
  args: {
    message: 'Corner Mart, 14 Oct: 1 of 3 to review',
    actionLabel: 'Confirm and review next (2 left)',
    isDirty: true,
  },
  render: (args) => (
    <div style={{ width: 'min(30rem, 100%)' }}>
      <SaveBar {...args} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const bar = find(canvasElement, '.save-bar');
    const root = document.documentElement;
    const one = parseFloat(getComputedStyle(root).getPropertyValue('--size-control')) + 2 * 8 + 2;
    await waitFor(async () => {
      const written = /^calc\(([\d.]+)px \+ var\(--spacing-inset\)\)$/.exec(
        root.style.getPropertyValue('--save-bar-offset'),
      );
      await expect(Number(written?.[1])).toBeCloseTo(rect(bar).height, 1);
    }, LONG);
    await expect(rect(bar).height).toBeGreaterThan(one);
  },
};

/** The one element under `scope` that matches `selector`. */
function find(scope: ParentNode, selector: string): HTMLElement {
  const found = scope.querySelector<HTMLElement>(selector);
  if (!found) throw new Error(`No ${selector}`);
  return found;
}
