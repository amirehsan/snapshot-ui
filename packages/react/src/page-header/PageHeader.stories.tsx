import type { Meta, StoryObj } from '@storybook/react-vite';
import { Download, Ellipsis, FolderInput, Trash2 } from 'lucide-react';
import type { ReactElement, ReactNode } from 'react';
import { I18nProvider } from 'react-aria-components';
import { expect, fn, userEvent, waitFor } from 'storybook/test';
import { AppShell } from '../app-shell';
import { Breadcrumb, Breadcrumbs } from '../breadcrumbs';
import { DataTable } from '../data-table';
import { FileButton } from '../file-drop-zone';
import { IconButton } from '../icon-button';
import { RouterProvider } from '../link';
import { Menu, MenuItem, MenuTrigger } from '../menu';
import { focusOn } from '../stories/focus';
import { DemoNav } from '../stories/shell-fixture';
import { COLUMNS, hrefOf, keyOf, manyTransactions } from '../stories/transactions';
import { DESKTOP, VIEWPORT_OPTIONS } from '../stories/viewports';
import { Text } from '../typography';
import { PageColumn } from './PageColumn';
import { PageHeader, type PageHeaderProps } from './PageHeader';

const noop = (): void => undefined;

/** Home, Documents and the current page. */
const TRAIL: ReactElement = (
  <Breadcrumbs>
    <Breadcrumb href="#home">Home</Breadcrumb>
    <Breadcrumb href="#documents">Documents</Breadcrumb>
    <Breadcrumb>Receipts, 2026</Breadcrumb>
  </Breadcrumbs>
);

/** An Upload FileButton, and the rest in a Menu, the last action. */
const ACTIONS: ReactElement = (
  <>
    <FileButton acceptedFileTypes={['application/pdf', '.pdf', 'image/*']} allowsMultiple onFiles={fn()}>
      Upload
    </FileButton>
    <MenuTrigger>
      <IconButton aria-label="More actions" variant="outline">
        <Ellipsis />
      </IconButton>
      <Menu>
        <MenuItem id="export" icon={<Download />}>
          Export all
        </MenuItem>
        <MenuItem id="move" icon={<FolderInput />}>
          Move to another year
        </MenuItem>
        <MenuItem id="delete" icon={<Trash2 />}>
          Delete the year
        </MenuItem>
      </Menu>
    </MenuTrigger>
  </>
);

/** The header and, under it, the page's content in a page column, so the two edges can be compared. */
function Page({ children, ...header }: PageHeaderProps & { children?: ReactNode }): ReactElement {
  return (
    <RouterProvider navigate={noop}>
      <PageHeader {...header} />
      <PageColumn className="content">
        {children ?? <Text>Corner Mart, 14 Oct. Northside Rent, 1 Oct. Acme Payroll, 30 Sep.</Text>}
      </PageColumn>
    </RouterProvider>
  );
}

const rect = (element: Element): DOMRect => element.getBoundingClientRect();

function find(scope: ParentNode, selector: string): HTMLElement {
  const element = scope.querySelector<HTMLElement>(selector);
  if (!element) throw new Error(`Nothing matches ${selector}`);
  return element;
}

/** The inline content box of an element: its border box less its inline padding. */
function contentEdges(element: HTMLElement): { left: number; right: number } {
  const style = getComputedStyle(element);
  return {
    left: rect(element).left + parseFloat(style.paddingLeft),
    right: rect(element).right - parseFloat(style.paddingRight),
  };
}

/** Whether the viewport is under the small breakpoint, 768px, where the actions take a line of their own. */
const isPhone = (): boolean => window.innerWidth < 768;

const meta = {
  title: 'Components/PageHeader',
  component: PageHeader,
  args: { title: 'Receipts, 2026' },
  parameters: { layout: 'fullscreen', viewport: { options: VIEWPORT_OPTIONS } },
  render: (args) => <Page {...args} />,
} satisfies Meta<PageHeaderProps>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Every slot: the trail, the eyebrow, the 36px title (28px at 375), a sentence and the actions at the title's end,
 * an Upload FileButton and a Menu; the content under it starts and ends where the header's row does.
 */
export const Full: Story = {
  tags: ['density'],
  args: {
    breadcrumbs: TRAIL,
    eyebrow: 'Documents',
    description: 'Every receipt you uploaded this year, read and filed by month.',
    actions: ACTIONS,
  },
  play: async ({ canvas, canvasElement }) => {
    const title = canvas.getByRole('heading', { level: 1, name: 'Receipts, 2026' });
    await expect(getComputedStyle(title).fontSize).toBe(isPhone() ? '28px' : '36px');
    await expect(getComputedStyle(title).fontWeight).toBe('500');
    // The titles start where the content does, and the actions end where it ends: one column.
    const content = contentEdges(find(canvasElement, '.content'));
    const row = contentEdges(find(canvasElement, '.page-header-row'));
    await expect(Math.abs(row.left - content.left)).toBeLessThan(1);
    await expect(Math.abs(row.right - content.right)).toBeLessThan(1);
    await expect(Math.abs(rect(title).left - content.left)).toBeLessThan(1);
    const actions = find(canvasElement, '.page-header-actions');
    if (isPhone()) {
      // Under 768px the actions take a line of their own, at the start.
      await expect(rect(actions).top).toBeGreaterThanOrEqual(rect(title).bottom - 0.5);
      await expect(Math.abs(rect(actions).left - content.left)).toBeLessThan(1);
    } else {
      // Beside the titles, at the row's end, their bottom on the title's and not the sentence's.
      await expect(Math.abs(rect(actions).right - content.right)).toBeLessThan(1);
      await expect(rect(actions).left).toBeGreaterThan(rect(title).right);
      await expect(Math.abs(rect(actions).bottom - rect(title).bottom)).toBeLessThan(1);
    }
    // The sentence under the title's line, a part step under the title.
    const description = find(canvasElement, '.page-header-description');
    await expect(rect(description).top).toBeGreaterThanOrEqual(
      Math.max(rect(title).bottom, rect(actions).bottom) - 0.5,
    );
    await expect(Math.abs(rect(description).left - content.left)).toBeLessThan(1);
    // No rule beneath it.
    await expect(getComputedStyle(find(canvasElement, '.page-header')).borderBottomWidth).toBe('0px');
  },
};

/** The title alone: the page's one h1, nothing above it and no actions. */
export const TitleOnly: Story = {
  play: async ({ canvas, canvasElement }) => {
    await expect(canvas.getAllByRole('heading')).toHaveLength(1);
    await expect(canvasElement.querySelector('.page-header-actions')).toBeNull();
  },
};

/**
 * A long title in a column too narrow to keep 20rem beside the actions: it wraps, never truncated, and the actions
 * fall under it.
 */
export const LongTitle: Story = {
  args: {
    breadcrumbs: TRAIL,
    title: 'Receipts, statements and invoices from every account you hold, filed for the 2026 tax year',
    description: 'Every receipt you uploaded this year, read and filed by month.',
    actions: ACTIONS,
  },
  render: (args) => (
    <div style={{ width: 'min(30rem, 100%)' }}>
      <Page {...args} />
    </div>
  ),
  play: async ({ canvas, canvasElement }) => {
    const title = canvas.getByRole('heading', { level: 1 });
    // Wrapped onto two lines or more, every word drawn.
    await expect(rect(title).height).toBeGreaterThan(parseFloat(getComputedStyle(title).lineHeight) * 1.5);
    await expect(title.scrollWidth).toBeLessThanOrEqual(title.clientWidth);
    const actions = find(canvasElement, '.page-header-actions');
    await expect(rect(actions).top).toBeGreaterThanOrEqual(rect(title).bottom - 0.5);
    // At the start of their own line.
    await expect(Math.abs(rect(actions).left - rect(title).left)).toBeLessThan(1);
  },
};

/** A Persian page: the titles at the right, the actions at the left, the trail's chevrons pointing left. */
export const RightToLeft: Story = {
  render: () => (
    <I18nProvider locale="fa-IR">
      <div dir="rtl" lang="fa">
        <Page
          breadcrumbs={
            <Breadcrumbs aria-label="مسیر" backLabel="بازگشت به {parent}">
              <Breadcrumb href="#home">خانه</Breadcrumb>
              <Breadcrumb href="#documents">اسناد</Breadcrumb>
              <Breadcrumb>رسیدها، ۱۴۰۵</Breadcrumb>
            </Breadcrumbs>
          }
          eyebrow="اسناد"
          title="رسیدها، ۱۴۰۵"
          description="همه رسیدهایی که امسال بارگذاری کرده‌اید، خوانده و بایگانی شده."
          actions={
            <FileButton allowsMultiple onFiles={fn()}>
              بارگذاری
            </FileButton>
          }
        >
          <Text>فروشگاه محله، ۲۲ مهر.</Text>
        </Page>
      </div>
    </I18nProvider>
  ),
  play: async ({ canvas, canvasElement }) => {
    const content = contentEdges(find(canvasElement, '.content'));
    const title = canvas.getByRole('heading', { level: 1 });
    await expect(Math.abs(rect(title).right - content.right)).toBeLessThan(1);
    const actions = find(canvasElement, '.page-header-actions');
    if (!isPhone()) await expect(Math.abs(rect(actions).left - content.left)).toBeLessThan(1);
    else await expect(Math.abs(rect(actions).right - content.right)).toBeLessThan(1);
  },
};

/** The rows of a long page under the header, so it scrolls. */
const ROWS = Array.from({ length: 36 }, (_, index) => `Receipt ${String(index + 1)}: Corner Mart, $42.18`);

/**
 * In the shell's header slot at 1280px, the page scrolled under it: the header sticks with the shell's wrapper, the
 * page shows through its fill under the blur, and its height is the page's `--page-sticky-top`.
 */
export const InAppShell: Story = {
  tags: ['viewport-desktop'],
  globals: DESKTOP,
  render: () => (
    <RouterProvider navigate={noop}>
      <AppShell
        sidebar={<DemoNav />}
        header={<PageHeader breadcrumbs={TRAIL} title="Receipts, 2026" actions={ACTIONS} className="stuck" />}
      >
        <PageColumn>
          {ROWS.map((row) => (
            <Text key={row} style={{ paddingBlock: 'var(--spacing-part)' }}>
              {row}
            </Text>
          ))}
        </PageColumn>
      </AppShell>
    </RouterProvider>
  ),
  play: async ({ canvasElement }) => {
    const header = find(canvasElement, '.stuck');
    const main = find(canvasElement, '.app-shell-main');
    // The header is the first part of main, so the skip link lands on the page's title.
    await expect(main.firstElementChild?.contains(header)).toBe(true);
    // The scroll stays: the page under the stuck header is the picture.
    window.scrollTo(0, 240);
    await waitFor(() => expect(window.scrollY).toBe(240));
    await waitFor(() => expect(rect(header).top).toBeCloseTo(0, 0));
    // The header's height is the page's sticky offset, written on main once measured, and the root's scroll padding.
    await waitFor(() =>
      expect(parseFloat(main.style.getPropertyValue('--page-sticky-top'))).toBeCloseTo(
        rect(header).height,
        0,
      ),
    );
    await expect(parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop)).toBeCloseTo(
      rect(header).height,
      0,
    );
  },
};

// ---- Checks, not shot ------------------------------------------------------------------------------------------

/**
 * A DataTable under a stuck PageHeader in the shell: once scrolled, its header row sits at the header's bottom, the
 * shell's measured `--page-sticky-top`, never behind it.
 */
export const StickyOffset: Story = {
  tags: ['no-visual'],
  globals: DESKTOP,
  render: () => (
    <RouterProvider navigate={noop}>
      <AppShell
        sidebar={<DemoNav />}
        header={<PageHeader breadcrumbs={TRAIL} title="Transactions" className="stuck" />}
      >
        <PageColumn>
          <DataTable
            aria-label="Transactions"
            items={manyTransactions(30)}
            columns={COLUMNS}
            getKey={keyOf}
            getRowHref={hrefOf}
          />
        </PageColumn>
      </AppShell>
    </RouterProvider>
  ),
  play: async ({ canvasElement }) => {
    const header = find(canvasElement, '.stuck');
    try {
      await waitFor(() =>
        expect(find(canvasElement, '.app-shell-main').style.getPropertyValue('--page-sticky-top')).not.toBe(
          '',
        ),
      );
      window.scrollTo(0, 600);
      await waitFor(() => expect(window.scrollY).toBe(600));
      const bottom = rect(header).bottom;
      const cells = (): HTMLElement[] =>
        [...canvasElement.querySelectorAll<HTMLElement>('.data-table-table [role="columnheader"]')].filter(
          (cell) => getComputedStyle(cell).visibility !== 'hidden',
        );
      await waitFor(async () => {
        await expect(cells().length).toBeGreaterThan(0);
        for (const cell of cells()) await expect(Math.abs(rect(cell).top - bottom)).toBeLessThan(1);
      });
      // A row scrolled to the view's start stops under the table's header row, not a header's height lower: the
      // root's scroll padding holds the page header, and the row's margin only the header row beyond it.
      const row = [...canvasElement.querySelectorAll<HTMLElement>('.data-table-body > [role="row"]')][9];
      if (row === undefined) throw new Error('No tenth row');
      const above = Math.round(window.scrollY + rect(row).bottom + 120);
      window.scrollTo(0, above);
      await waitFor(() => expect(window.scrollY).toBe(above));
      await expect(rect(row).bottom).toBeLessThan(0);
      row.scrollIntoView({ block: 'start', behavior: 'instant' });
      const headerRow = cells()[0];
      if (headerRow === undefined) throw new Error('No header row');
      await waitFor(() => expect(Math.abs(rect(row).top - rect(headerRow).bottom)).toBeLessThan(1.5));
    } finally {
      window.scrollTo(0, 0);
    }
  },
};

/** Six crumbs above the page, a trail longer than its line. */
const LONG_TRAIL: ReactElement = (
  <Breadcrumbs>
    <Breadcrumb href="#home">Home</Breadcrumb>
    <Breadcrumb href="#accounts">Accounts</Breadcrumb>
    <Breadcrumb href="#household">The household account we share with the whole family</Breadcrumb>
    <Breadcrumb href="#documents">Documents</Breadcrumb>
    <Breadcrumb href="#receipts">Receipts and statements for the tax office</Breadcrumb>
    <Breadcrumb>2026</Breadcrumb>
  </Breadcrumbs>
);

/** Whether the actions sit on the title's line, at its end, their bottom on its bottom. */
async function expectActionsBesideTitle(canvasElement: HTMLElement): Promise<void> {
  const title = find(canvasElement, '.page-header-title');
  const actions = find(canvasElement, '.page-header-actions');
  await expect(rect(actions).left).toBeGreaterThanOrEqual(
    rect(find(canvasElement, '.page-header-titles')).right,
  );
  await expect(Math.abs(rect(actions).bottom - rect(title).bottom)).toBeLessThan(1);
}

/** At 1024px a six-crumb trail over a short title: the trail wraps, and the actions stay beside the title. */
export const ActionsBesideLongTrail: Story = {
  tags: ['no-visual'],
  render: () => (
    <div style={{ width: 1024 }}>
      <Page breadcrumbs={LONG_TRAIL} title="2026" actions={ACTIONS} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    await expectActionsBesideTitle(canvasElement);
    // The trail wrapped within the titles' column rather than push the actions under the title.
    const trail = find(canvasElement, '.breadcrumbs');
    await expect(trail.scrollWidth).toBeLessThanOrEqual(trail.clientWidth);
  },
};

/** At 1024px a sentence under the title: the actions stay beside the title, their bottom on its bottom. */
export const ActionsBesideDescription: Story = {
  tags: ['no-visual'],
  render: () => (
    <div style={{ width: 1024 }}>
      <Page
        breadcrumbs={TRAIL}
        title="Receipts, 2026"
        description="Every receipt you uploaded this year, read and filed by month, with its merchant, its date and its amount, so the year's spending reads at a glance."
        actions={ACTIONS}
      />
    </div>
  ),
  play: async ({ canvasElement }) => {
    await expectActionsBesideTitle(canvasElement);
    const description = find(canvasElement, '.page-header-description');
    await expect(rect(description).top).toBeGreaterThanOrEqual(
      rect(find(canvasElement, '.page-header-actions')).bottom,
    );
  },
};

/** Rows of a long page, far apart, each with a control, so one can sit wholly under the stuck header. */
const RECEIPTS = Array.from({ length: 16 }, (_, index) => `Receipt ${String(index + 1)}`);

/**
 * WCAG 2.4.11: with a control wholly under the stuck header, Shift+Tab to it from the next brings it clear of the
 * header, as the root's scroll padding is the header's measured height.
 */
export const FocusClearOfHeader: Story = {
  tags: ['no-visual'],
  globals: DESKTOP,
  render: () => (
    <RouterProvider navigate={noop}>
      <AppShell
        sidebar={<DemoNav />}
        header={<PageHeader breadcrumbs={TRAIL} title="Receipts, 2026" actions={ACTIONS} className="stuck" />}
      >
        <PageColumn>
          {RECEIPTS.map((receipt) => (
            <div key={receipt} style={{ minBlockSize: 200 }}>
              <button type="button">{`Open ${receipt}`}</button>
            </div>
          ))}
        </PageColumn>
      </AppShell>
    </RouterProvider>
  ),
  play: async ({ canvas, canvasElement }) => {
    const header = find(canvasElement, '.stuck');
    const covered = canvas.getByRole('button', { name: 'Open Receipt 6' });
    const next = canvas.getByRole('button', { name: 'Open Receipt 7' });
    try {
      // Once the shell has measured its header.
      await waitFor(() =>
        expect(document.documentElement.style.getPropertyValue('--app-shell-header-block-size')).not.toBe(''),
      );
      // Scroll the control to the middle of the stuck header, wholly under it, the next one clear below it.
      const height = rect(header).height;
      const target = Math.round(window.scrollY + rect(covered).top - (height - rect(covered).height) / 2);
      window.scrollTo(0, target);
      await waitFor(() => expect(window.scrollY).toBe(target));
      await expect(rect(covered).bottom).toBeLessThanOrEqual(rect(header).bottom);
      await expect(rect(next).top).toBeGreaterThan(rect(header).bottom);
      await focusOn(next);
      await userEvent.tab({ shift: true });
      await waitFor(() => expect(covered).toHaveFocus());
      await waitFor(() => expect(rect(covered).top).toBeGreaterThanOrEqual(rect(header).bottom - 1));
    } finally {
      window.scrollTo(0, 0);
    }
  },
};
