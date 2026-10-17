import type { Meta, StoryObj } from '@storybook/react-vite';
import { ArrowLeftRight, FileText, House, Target } from 'lucide-react';
import { useEffect, useState, type ReactElement, type ReactNode } from 'react';
import { I18nProvider } from 'react-aria-components';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { AppShell } from '../app-shell';
import { BottomTabBar, BottomTabBarItem } from '../bottom-tab-bar';
import { Card, CardBody, CardHeader, CardTitle } from '../card';
import { focusOn } from '../stories/focus';
import { DemoHeader, DemoNav } from '../stories/shell-fixture';
import { DESKTOP, PHONE, VIEWPORT_OPTIONS } from '../stories/viewports';
import { toast, ToastRegion } from '../toast';
import type { UploadItem } from './counts';
import { UploadTray, type UploadTrayProps } from './UploadTray';

/** Five files in mixed states: one saved, one uploading, one being read and two waiting, "Uploading 2 of 5". */
const MIXED: UploadItem[] = [
  { id: 1, name: 'lease-agreement.pdf', status: 'saved', href: '#lease' },
  { id: 2, name: 'invoice-0142.pdf', status: 'uploading', progress: 0.45, progressLabel: '1.8 of 4 MB' },
  { id: 3, name: 'statement-september.pdf', status: 'reading' },
  { id: 4, name: 'receipt-march.pdf', status: 'waiting' },
  { id: 5, name: 'receipt-april.pdf', status: 'waiting' },
];

/** Every row settled: three saved, one needing review and one failed, "5 uploads complete". */
const SETTLED: UploadItem[] = [
  { id: 1, name: 'lease-agreement.pdf', status: 'saved', href: '#lease' },
  { id: 2, name: 'invoice-0142.pdf', status: 'saved', href: '#invoice' },
  { id: 3, name: 'statement-september.pdf', status: 'saved', href: '#statement' },
  {
    id: 4,
    name: 'corner-mart.jpg',
    status: 'review',
    reason: 'The total could not be read',
    href: '#corner-mart',
  },
  { id: 5, name: 'holiday-video.mov', status: 'failed', reason: 'Not a PDF, JPG or PNG' },
];

/** A short page: a card with a line of text. */
function Page(): ReactElement {
  return (
    <div style={{ display: 'grid', gap: 24, padding: 'var(--spacing-inset)' }}>
      <Card>
        <CardHeader>
          <CardTitle>Documents</CardTitle>
        </CardHeader>
        <CardBody>
          <p style={{ margin: 0 }}>Receipts, invoices and statements, newest first.</p>
        </CardBody>
      </Card>
    </div>
  );
}

/** The phone's tab bar: Home current, Transactions, Documents and Goals. */
const TABS: ReactNode = (
  <BottomTabBar aria-label="Main">
    <BottomTabBarItem href="#home" icon={<House />} isCurrent>
      Home
    </BottomTabBarItem>
    <BottomTabBarItem href="#transactions" icon={<ArrowLeftRight />}>
      Transactions
    </BottomTabBarItem>
    <BottomTabBarItem href="#documents" icon={<FileText />}>
      Documents
    </BottomTabBarItem>
    <BottomTabBarItem href="#goals" icon={<Target />}>
      Goals
    </BottomTabBarItem>
  </BottomTabBar>
);

/** The shell with the demo rail and header, the page, and the tray in its floating slot. */
function Shell({ tabs = false, ...tray }: UploadTrayProps & { tabs?: boolean }): ReactElement {
  return (
    <AppShell
      sidebar={<DemoNav />}
      header={<DemoHeader title="Documents" />}
      bottomBar={tabs ? TABS : undefined}
      floating={<UploadTray {...tray} />}
    >
      <Page />
    </AppShell>
  );
}

/** A tray whose rows Remove takes away, as an app's uploads provider does. */
function Removing({
  initial,
  ...props
}: Omit<UploadTrayProps, 'items'> & { initial: UploadItem[] }): ReactElement {
  const [items, setItems] = useState(initial);
  return (
    <Shell
      {...props}
      items={items}
      onRemove={(id) => {
        setItems((each) => each.filter((item) => item.id !== id));
      }}
    />
  );
}

/** Two toasts raised once, on mount, and cleared when the story leaves, since the queue outlives it. */
function Toasts(): ReactElement {
  useEffect(() => {
    toast({
      title: 'Statement saved',
      description: 'September is in your documents.',
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

/** A count in Persian digits, as a Persian app's formatCount writes it. */
const persian = (count: number): string =>
  String(count).replace(/\d/g, (digit) => '۰۱۲۳۴۵۶۷۸۹'.charAt(Number(digit)));

/** The one element on the page that matches `selector`, wherever it was drawn. */
function only(selector: string): HTMLElement {
  const found = document.querySelectorAll<HTMLElement>(selector);
  const [first] = found;
  if (found.length !== 1 || !first)
    throw new Error(`Expected one ${selector}, found ${String(found.length)}`);
  return first;
}

/** Resolves with the wide face once its rise has finished, so a play reads it at rest. */
async function panelAtRest(): Promise<HTMLElement> {
  const panel = await waitFor(() => only('.upload-tray'));
  await Promise.all(panel.getAnimations().map((animation) => animation.finished.catch(() => null)));
  return panel;
}

/** Presses `keys` unless the story has gone: a play that outlived its time limit stops rather than type on. */
function guardedKeys(anchor: Element): (keys: string) => Promise<void> {
  return async (keys) => {
    if (!anchor.isConnected) throw new Error('The story has gone');
    await userEvent.keyboard(keys);
  };
}

const meta = {
  title: 'Components/UploadTray',
  component: UploadTray,
  args: { items: MIXED },
  parameters: { layout: 'fullscreen', viewport: { options: VIEWPORT_OPTIONS } },
  render: (args) => <Shell {...args} />,
} satisfies Meta<UploadTrayProps>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * The float panel 16px from the bottom end corner, 28rem wide: "Uploading 2 of 5", the slate line, the fold and
 * close buttons, and the five rows.
 */
export const Open: Story = {
  tags: ['viewport-desktop'],
  globals: DESKTOP,
  args: { description: 'About a minute left', onCancelAll: fn(), onCancel: fn(), onRemove: fn() },
  play: async () => {
    const panel = await panelAtRest();
    const box = panel.getBoundingClientRect();
    await expect(box.width).toBeCloseTo(448, 0);
    await expect(document.documentElement.clientWidth - box.right).toBeCloseTo(16, 0);
    await expect(window.innerHeight - box.bottom).toBeCloseTo(16, 0);
    await expect(within(panel).getByRole('heading', { level: 2 })).toHaveTextContent('Uploading 2 of 5');
    await expect(within(panel).getAllByRole('listitem')).toHaveLength(5);
    // The phone's bar is not drawn at this width.
    await expect(getComputedStyle(only('.upload-tray-bar')).display).toBe('none');
    // Concentric corners in Rounded: the panel's 24px less its 1px edge and the header's 8px for the header's
    // buttons, 15px; less its edge for the flush rows, then a row's 10px for its buttons and bar, 13px.
    const radius = (element: Element): string => getComputedStyle(element).borderTopLeftRadius;
    await expect(radius(within(panel).getByRole('button', { name: 'Upload details' }))).toBe('15px');
    await expect(radius(within(panel).getByRole('button', { name: 'Cancel invoice-0142.pdf' }))).toBe('13px');
    const track = panel.querySelector('.upload-row .progress-bar-track');
    if (!track) throw new Error('No track');
    await expect(radius(track)).toBe('13px');
  },
};

/** Folded to its header: the title stays in view, and the chevron turns. */
export const Collapsed: Story = {
  tags: ['viewport-desktop'],
  globals: DESKTOP,
  args: { defaultCollapsed: true, description: 'About a minute left' },
  play: async () => {
    const panel = await panelAtRest();
    await expect(only('.upload-tray-body')).not.toBeVisible();
    await expect(within(panel).getByRole('button', { name: 'Upload details' })).toHaveAttribute(
      'aria-expanded',
      'false',
    );
    await expect(window.innerHeight - panel.getBoundingClientRect().bottom).toBeCloseTo(16, 0);
  },
};

/** Three saved, one needing review and one failed: "5 uploads complete", with Close, Retry and Remove. */
export const Settled: Story = {
  tags: ['viewport-desktop'],
  globals: DESKTOP,
  args: { items: SETTLED, onClear: fn(), onRetry: fn(), onRemove: fn() },
  play: async () => {
    const panel = await panelAtRest();
    await expect(within(panel).getByRole('heading', { level: 2 })).toHaveTextContent('5 uploads complete');
    await expect(within(panel).getByRole('button', { name: 'Close' })).toBeVisible();
  },
};

/** On a phone, a pill bar that says the title, 16px above the tab bar. */
export const PhoneBar: Story = {
  tags: ['viewport-phone'],
  globals: PHONE,
  render: (args) => <Shell {...args} tabs />,
  play: async () => {
    const bar = await waitFor(() => only('.upload-tray-bar'));
    await expect(getComputedStyle(only('.upload-tray')).display).toBe('none');
    const box = bar.getBoundingClientRect();
    const tabs = only('.tab-bar').getBoundingClientRect();
    await expect(tabs.top - box.bottom).toBeCloseTo(16, 0);
    await expect(box.left).toBeCloseTo(16, 0);
    await expect(window.innerWidth - box.right).toBeCloseTo(16, 0);
    await expect(box.height).toBeGreaterThanOrEqual(48 - 0.5);
    // The button fills the pill inside its 1px edge: the pill's radius less 1px, never a copy of it.
    await expect(getComputedStyle(within(bar).getByRole('button')).borderTopLeftRadius).toBe('998px');
    await expect(within(bar).getByRole('button')).toHaveTextContent('Uploading 2 of 5');
  },
};

/** The bar pressed: the sheet with the title, the line and the list, at rest. */
export const PhoneSheet: Story = {
  tags: ['viewport-phone'],
  globals: PHONE,
  args: { description: 'About a minute left' },
  render: (args) => <Shell {...args} tabs />,
  play: async () => {
    const button = within(await waitFor(() => only('.upload-tray-bar'))).getByRole('button');
    button.click();
    const sheet = await waitFor(async () => {
      const found = only('.upload-tray-sheet');
      await expect(found).not.toHaveAttribute('data-entering');
      return found;
    });
    // Every finite animation in it: the reading row's slide never ends.
    await Promise.all(
      sheet
        .getAnimations({ subtree: true })
        .filter((animation) => animation.effect?.getTiming().iterations !== Infinity)
        .map((animation) => animation.finished.catch(() => null)),
    );
    const dialog = within(document.body).getByRole('dialog', { name: 'Uploading 2 of 5' });
    await expect(within(dialog).getAllByRole('listitem')).toHaveLength(5);
    await expect(button).toHaveAttribute('aria-expanded', 'true');
  },
};

/** The tray and two toasts in one 28rem column: the toasts 16px above the tray. */
export const WithToasts: Story = {
  tags: ['viewport-desktop'],
  globals: DESKTOP,
  render: (args) => (
    <>
      <Shell {...args} />
      <Toasts />
    </>
  ),
  play: async () => {
    const panel = await panelAtRest();
    const region = await waitFor(() => only('.toast-region'));
    await waitFor(() => expect(region.querySelectorAll('.toast')).toHaveLength(2));
    await waitFor(async () => {
      const tray = panel.getBoundingClientRect();
      const toasts = region.getBoundingClientRect();
      await expect(tray.top - toasts.bottom).toBeCloseTo(16, 0);
      await expect(toasts.left).toBeCloseTo(tray.left, 0);
      await expect(toasts.width).toBeCloseTo(tray.width, 0);
    });
  },
};

/** A Persian page: the panel in the bottom left corner, the rows and the header mirrored. */
export const RightToLeft: Story = {
  tags: ['viewport-desktop'],
  globals: DESKTOP,
  render: () => (
    <I18nProvider locale="fa-IR">
      <div dir="rtl" lang="fa">
        <AppShell
          sidebar={<DemoNav />}
          header={<DemoHeader title="اسناد" />}
          floating={
            <UploadTray
              items={[
                { id: 1, name: 'اجاره‌نامه.pdf', status: 'saved', href: '#lease' },
                {
                  id: 2,
                  name: 'فاکتور-۰۱۴۲.pdf',
                  status: 'uploading',
                  progress: 0.45,
                  progressLabel: '۱٫۸ از ۴ مگابایت',
                },
                { id: 3, name: 'صورت‌حساب-شهریور.pdf', status: 'reading' },
                { id: 4, name: 'رسید-فروشگاه.jpg', status: 'review', reason: 'مبلغ خوانده نشد' },
              ]}
              formatCount={persian}
              labels={{
                status: {
                  waiting: 'در انتظار',
                  uploading: 'در حال بارگذاری',
                  reading: 'در حال خواندن',
                  saved: 'ذخیره شد',
                  review: 'نیاز به بررسی',
                  failed: 'ناموفق',
                },
                title: (counts, format) =>
                  `بارگذاری ${format(counts.saved + counts.review + counts.failed + 1)} از ${format(counts.total)}`,
                details: 'جزئیات بارگذاری',
                region: 'بارگذاری‌ها',
              }}
            />
          }
        >
          <Page />
        </AppShell>
      </div>
    </I18nProvider>
  ),
  play: async () => {
    const panel = await panelAtRest();
    const box = panel.getBoundingClientRect();
    await expect(box.left).toBeCloseTo(16, 0);
    await expect(window.innerHeight - box.bottom).toBeCloseTo(16, 0);
  },
};

/** Enter and Space on the fold button fold and unfold the body; the name stays and aria-expanded says which. */
export const FoldKeys: Story = {
  tags: ['no-visual', 'viewport-desktop', 'webkit', 'firefox'],
  globals: DESKTOP,
  play: async () => {
    const panel = await panelAtRest();
    const fold = within(panel).getByRole('button', { name: 'Upload details' });
    const press = guardedKeys(fold);
    await focusOn(fold);
    await press('{Enter}');
    await waitFor(() => expect(fold).toHaveAttribute('aria-expanded', 'false'));
    await expect(only('.upload-tray-body')).not.toBeVisible();
    await expect(panel).toHaveAttribute('data-collapsed');
    await expect(fold).toHaveFocus();
    await press(' ');
    await waitFor(() => expect(fold).toHaveAttribute('aria-expanded', 'true'));
    await expect(only('.upload-tray-body')).toBeVisible();
    await expect(fold).toHaveAccessibleName('Upload details');
  },
};

/** Remove takes the row away and focus moves to the next row's Remove, then the previous one's, never the body. */
export const FocusAfterRemove: Story = {
  tags: ['no-visual', 'viewport-desktop', 'webkit', 'firefox'],
  globals: DESKTOP,
  render: () => <Removing initial={SETTLED.slice(2)} />,
  play: async () => {
    const panel = await panelAtRest();
    const remove = (name: string): HTMLElement =>
      within(panel).getByRole('button', { name: `Remove ${name}` });
    const first = remove('corner-mart.jpg');
    const press = guardedKeys(panel);
    await focusOn(first);
    await press('{Enter}');
    await waitFor(() => expect(remove('holiday-video.mov')).toHaveFocus());
    await press('{Enter}');
    await waitFor(() => expect(remove('statement-september.pdf')).toHaveFocus());
  },
};

/** The last row removed: the tray leaves, and focus goes to main, never the body. */
export const FocusAfterLeave: Story = {
  tags: ['no-visual', 'viewport-desktop'],
  globals: DESKTOP,
  render: () => <Removing initial={SETTLED.slice(0, 1)} />,
  play: async ({ canvasElement }) => {
    const panel = await panelAtRest();
    const remove = within(panel).getByRole('button', { name: 'Remove lease-agreement.pdf' });
    await focusOn(remove);
    await guardedKeys(panel)('{Enter}');
    await waitFor(() => expect(document.querySelector('.upload-tray')).toBeNull());
    await waitFor(() => expect(within(canvasElement).getByRole('main')).toHaveFocus());
  },
};

/** The tray is the shell's last child, outside the workspace and main, so a client navigation keeps it. */
export const OutsideMain: Story = {
  tags: ['no-visual', 'viewport-desktop'],
  globals: DESKTOP,
  play: async ({ canvasElement }) => {
    const panel = await panelAtRest();
    const shell = only('.app-shell');
    await expect(panel.parentElement).toBe(shell);
    await expect(within(canvasElement).getByRole('main')).not.toContainElement(panel);
    await expect(only('.upload-tray-bar').parentElement).toBe(shell);
  },
};

/** The tray writes its height and the inset on the root, and the toasts sit above its top. */
export const OffsetWritten: Story = {
  tags: ['no-visual', 'viewport-desktop'],
  globals: DESKTOP,
  render: (args) => (
    <>
      <Shell {...args} />
      <Toasts />
    </>
  ),
  play: async () => {
    const panel = await panelAtRest();
    const root = document.documentElement;
    await waitFor(async () => {
      const written = /^calc\(([\d.]+)px \+ var\(--spacing-inset\)\)$/.exec(
        root.style.getPropertyValue('--upload-tray-offset'),
      );
      await expect(Number(written?.[1])).toBeCloseTo(panel.getBoundingClientRect().height, 1);
    });
    const region = only('.toast-region');
    await waitFor(() => expect(region.querySelectorAll('.toast')).toHaveLength(2));
    await waitFor(() =>
      expect(region.getBoundingClientRect().bottom).toBeLessThanOrEqual(panel.getBoundingClientRect().top),
    );
  },
};
