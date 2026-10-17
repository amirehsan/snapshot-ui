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
    await waitFor(() => expect(find(canvasElement, '.save-bar-status')).toHaveTextContent('Saving'));
  },
};

/** A save that failed: the status in error with its icon. */
export const ErrorStatus: Story = {
  args: { isDirty: true, status: "Couldn't save. Try again.", statusTone: 'error' },
};

/** Two narrow holders: under 36rem the actions take their own line, under 24rem each button the full width. */
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
    const [wide, narrow] = ['.at-30', '.at-22'].map((selector) => find(canvasElement, selector));
    if (!wide || !narrow) throw new Error('Two bars');
    // Under 36rem: the sentence above, the buttons on a line of their own at the end, the action last.
    const text = rect(find(wide, '.save-bar-text'));
    const buttons = within(wide).getAllByRole('button');
    for (const button of buttons) await expect(rect(button).top).toBeGreaterThanOrEqual(text.bottom - 0.5);
    const action = buttons.at(-1);
    if (!action) throw new Error('No action');
    await expect(action).toHaveTextContent('Confirm and review next (2 left)');
    // Under 24rem: each button the actions' full width, stacked in DOM order, the action at the bottom.
    const actions = find(narrow, '.save-bar-actions');
    const stacked = within(narrow).getAllByRole('button');
    for (const [index, button] of stacked.entries()) {
      await expect(rect(button).width).toBeCloseTo(rect(actions).width, 0);
      const next = stacked[index + 1];
      if (next) await expect(rect(next).top).toBeGreaterThan(rect(button).bottom - 0.5);
    }
    // The last button is clear of both bottom corners' curves.
    const radius = parseFloat(getComputedStyle(narrow).borderBottomLeftRadius);
    const last = stacked.at(-1);
    if (!last) throw new Error('No last button');
    await expect(rect(last).left - rect(narrow).left).toBeGreaterThanOrEqual(Math.min(radius, 9999) - 0.5);
    await expect(rect(narrow).right - rect(last).right).toBeGreaterThanOrEqual(Math.min(radius, 9999) - 0.5);
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
    await waitFor(() => expect(window.innerHeight - rect(bar).bottom).toBeCloseTo(16, 0));
    // Some field lies under it, scrolled past by nothing yet.
    const under = [...canvasElement.querySelectorAll('.field')].some(
      (field) => rect(field).bottom > rect(bar).top,
    );
    await expect(under).toBe(true);
  },
};

/** On a phone, in the shell: the bar stuck 16px above the tab bar. */
export const Phone: Story = {
  tags: ['viewport-phone'],
  globals: PHONE,
  args: { isDirty: true },
  parameters: { layout: 'fullscreen' },
  render: (args) => <ShellForm {...args} />,
  play: async () => {
    const bar = await waitFor(() => only('.save-bar'));
    await waitFor(() => expect(rect(only('.tab-bar')).top - rect(bar).bottom).toBeCloseTo(16, 0));
    await expect(rect(bar).left).toBeCloseTo(16, 0);
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
    const bar = await waitFor(() => only('.save-bar'));
    const tray = await atRest('.upload-tray-bar');
    const region = await waitFor(() => only('.toast-region'));
    await waitFor(() => expect(region.querySelectorAll('.toast')).toHaveLength(2));
    await waitFor(async () => {
      await expect(rect(only('.tab-bar')).top - rect(bar).bottom).toBeCloseTo(16, 0);
      await expect(rect(bar).top - rect(tray).bottom).toBeCloseTo(16, 0);
      await expect(rect(tray).top - rect(region).bottom).toBeCloseTo(16, 0);
    });
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
    const bar = await waitFor(() => only('.save-bar'));
    const tray = await atRest('.upload-tray');
    const region = await waitFor(() => only('.toast-region'));
    await waitFor(() => expect(region.querySelectorAll('.toast')).toHaveLength(2));
    await waitFor(async () => {
      await expect(window.innerHeight - rect(bar).bottom).toBeCloseTo(16, 0);
      await expect(rect(bar).top - rect(tray).bottom).toBeCloseTo(16, 0);
      await expect(rect(tray).top - rect(region).bottom).toBeCloseTo(16, 0);
    });
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
    const question = await waitFor(() =>
      within(document.body).getByRole('alertdialog', { name: 'Discard changes?' }),
    );
    // The question starts on the safe answer.
    await waitFor(() => expect(within(question).getByRole('button', { name: 'Keep editing' })).toHaveFocus());
    await press('{Escape}');
    await waitFor(() => expect(within(document.body).queryByRole('alertdialog')).toBeNull());
    await waitFor(() => expect(cancel).toHaveFocus());
    await expect(args.onCancel).not.toHaveBeenCalled();
    await press('{Enter}');
    const again = await waitFor(() => within(document.body).getByRole('alertdialog'));
    const discard = within(again).getByRole('button', { name: 'Discard changes' });
    await waitFor(() => expect(within(again).getByRole('button', { name: 'Keep editing' })).toHaveFocus());
    await press('{Tab}');
    await waitFor(() => expect(discard).toHaveFocus());
    await press('{Enter}');
    await waitFor(() => expect(args.onCancel).toHaveBeenCalledTimes(1));
  },
};

/**
 * WCAG 2.4.11 at 375 by 812, with the tab bar, the save bar and the tray's bar on the page: a field that sits under
 * them, reached by Tab and by focus(), ends clear of the topmost (risk R6).
 */
export const FocusClear: Story = {
  tags: ['no-visual', 'viewport-phone', 'webkit', 'firefox'],
  globals: PHONE,
  args: { isDirty: true },
  parameters: { layout: 'fullscreen' },
  render: (args) => <ShellForm {...args} tray />,
  play: async () => {
    const bar = await waitFor(() => only('.save-bar'));
    const tray = await atRest('.upload-tray-bar');
    const scroller = document.scrollingElement ?? document.documentElement;
    const inputs = [...document.querySelectorAll<HTMLInputElement>('.app-shell-workspace input')];
    /** The top of what covers the page's bottom: the tray's bar, which sits above the save bar. */
    const cover = (): number => Math.min(rect(bar).top, rect(tray).top);
    try {
      scroller.scrollTop = 0;
      await waitFor(() => expect(rect(bar).bottom).toBeLessThan(window.innerHeight));
      // The first field under the covers, and the one before it, which is clear.
      const index = inputs.findIndex(
        (input) => rect(input).bottom > cover() && rect(input).top < window.innerHeight,
      );
      const [before, under] = [inputs[index - 1], inputs[index]];
      if (!before || !under) throw new Error('No field under the bars');
      await expect(rect(before).bottom).toBeLessThanOrEqual(cover());
      // By Tab.
      await focusOn(before);
      await guardedKeys(bar)('{Tab}');
      await waitFor(() => expect(under).toHaveFocus());
      await waitFor(() => expect(rect(under).bottom).toBeLessThanOrEqual(cover() + 0.5));
      // By focus(), from the top again.
      under.blur();
      scroller.scrollTop = 0;
      await waitFor(() => expect(rect(under).bottom).toBeGreaterThan(cover()));
      under.focus();
      await waitFor(() => expect(rect(under).bottom).toBeLessThanOrEqual(cover() + 0.5));
    } finally {
      scroller.scrollTop = 0;
    }
  },
};

/**
 * A bar in a box that scrolls, as in a SidePanel's or a Dialog's body: the root's scroll padding does not reach a
 * scroll port of its own, so a field under the bar, reached by Tab and by focus(), is scrolled clear by the bar.
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
    try {
      scroller.scrollTop = 0;
      await waitFor(() => expect(rect(bar).bottom).toBeLessThan(rect(scroller).bottom));
      const index = inputs.findIndex(
        (input) => rect(input).bottom > rect(bar).top && rect(input).top < rect(scroller).bottom,
      );
      const [before, under] = [inputs[index - 1], inputs[index]];
      if (!before || !under) throw new Error('No field under the bar');
      // By Tab.
      await focusOn(before);
      await guardedKeys(bar)('{Tab}');
      await waitFor(() => expect(under).toHaveFocus());
      await waitFor(() => expect(rect(under).bottom).toBeLessThanOrEqual(rect(bar).top + 0.5));
      // By focus(), from the top again.
      under.blur();
      scroller.scrollTop = 0;
      await waitFor(() => expect(rect(under).bottom).toBeGreaterThan(rect(bar).top));
      under.focus();
      await waitFor(() => expect(rect(under).bottom).toBeLessThanOrEqual(rect(bar).top + 0.5));
    } finally {
      scroller.scrollTop = 0;
    }
  },
};

/** A save that takes longer than the pause: "Saving" in the status, then nothing, with focus kept on the action. */
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
    await focusOn(save);
    await guardedKeys(save)('{Enter}');
    await waitFor(() => expect(save).toHaveAttribute('data-pending', 'true'));
    await expect(status).toBeEmptyDOMElement();
    await waitFor(() => expect(status).toHaveTextContent('Saving'));
    await expect(canvas.getByRole('button', { name: 'Cancel' })).toBeDisabled();
    try {
      await waitFor(() => expect(save).not.toHaveAttribute('data-pending'), { timeout: 3000 });
      await expect(status).toBeEmptyDOMElement();
      await expect(save).toHaveFocus();
    } finally {
      // React Aria's Button says its pending start and end while focused, by the ids of its label and spinner,
      // which leave with the spinner; its live region keeps each sentence 7 seconds after it was spoken, which axe,
      // run after this play and after the next story's, reads as a name pointing at nothing. They have been said;
      // the end's is added an effect after the spinner leaves, so the play gives it a moment first.
      await new Promise((resolve) => setTimeout(resolve, 200));
      for (const said of document.querySelectorAll('[data-live-announcer] [role="img"]')) said.remove();
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
    });
    await expect(rect(bar).height).toBeGreaterThan(one);
  },
};

/** The one element under `scope` that matches `selector`. */
function find(scope: ParentNode, selector: string): HTMLElement {
  const found = scope.querySelector<HTMLElement>(selector);
  if (!found) throw new Error(`No ${selector}`);
  return found;
}
