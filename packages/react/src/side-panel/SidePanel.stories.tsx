import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState, type ComponentType, type CSSProperties, type ReactElement, type ReactNode } from 'react';
import { renderToString } from 'react-dom/server';
import { I18nProvider, type Key } from 'react-aria-components';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { AppShell } from '../app-shell';
import { Button } from '../button';
import { DataTable } from '../data-table';
import { RouterProvider } from '../link';
import { NumberField } from '../number-field';
import { PickerOption } from '../picker';
import { Select } from '../select';
import { focusOn } from '../stories/focus';
import { DemoHeader, DemoNav } from '../stories/shell-fixture';
import {
  COLUMNS,
  groupOf,
  hrefOf,
  keyOf,
  manyTransactions,
  TRANSACTIONS,
  type Transaction,
} from '../stories/transactions';
import { DESKTOP, PHONE, VIEWPORT_OPTIONS } from '../stories/viewports';
import { TextField } from '../text-field';
import { Heading } from '../typography';
import { SidePanel, type SidePanelProps } from './SidePanel';
import { SidePanelLayout, type SidePanelLayoutProps } from './SidePanelLayout';

/** The args the stories take: each story renders its own page, so none. */
type StoryArgs = Record<string, never>;

/**
 * A list page's content and its detail: the household's transactions in a DataTable, and the open one's detail in
 * a SidePanel beside it from 1024px, a Sheet under it. The open row is in the story's state, as an app keeps it in
 * its URL; a row's link writes it through the router, Close and Escape clear it, and the panel is keyed by it.
 */
const meta = {
  title: 'Components/SidePanel',
  component: SidePanel as unknown as ComponentType<StoryArgs>,
  parameters: { layout: 'padded', viewport: { options: VIEWPORT_OPTIONS } },
  tags: ['viewport-desktop'],
} satisfies Meta<StoryArgs>;

export default meta;
type Story = StoryObj<typeof meta>;

const EIGHT = TRANSACTIONS.slice(0, 8);

/** The first row, Corner Mart. */
const CORNER_MART: Transaction = (() => {
  const [first] = EIGHT;
  if (first === undefined) throw new Error('No transactions');
  return first;
})();

const CATEGORIES = ['Groceries', 'Transport', 'Rent', 'Salary', 'Utilities', 'Dining', 'Internet'];

/** A transaction's detail: its payee, its category and its amount, each a field the reader can change. */
function Detail({ row }: { row: Transaction }): ReactElement {
  return (
    <div style={{ display: 'grid', gap: 'var(--spacing-peer)' }}>
      <TextField label="Payee" defaultValue={row.payee} />
      <Select label="Category" defaultValue={row.category}>
        {CATEGORIES.map((name) => (
          <PickerOption key={name} id={name}>
            {name}
          </PickerOption>
        ))}
      </Select>
      <NumberField label="Amount" money={{ symbol: '$' }} allowsNegative defaultValue={row.minor} />
    </div>
  );
}

const ACTIONS: ReactNode = (
  <>
    <Button variant="secondary">Delete</Button>
    <Button>Save</Button>
  </>
);

interface PageProps {
  /** The row open first, or none. */
  initial?: string | null;
  rows?: readonly Transaction[];
  /** What the panel takes besides its title, its state and its body. */
  panel?: Partial<SidePanelProps>;
  /** The panel's body, instead of the row's fields. */
  body?: ReactNode;
  layout?: Partial<SidePanelLayoutProps>;
  /** Selection in the table, as the page keeps it. */
  selectable?: boolean;
}

/** The page: the table, its open row in state, and the open row's detail beside it. */
function Page({
  initial = 't1',
  rows = EIGHT,
  panel = {},
  body,
  layout = {},
  selectable = false,
}: PageProps): ReactElement {
  const [open, setOpen] = useState<string | null>(initial);
  const [selected, setSelected] = useState<Key[]>([]);
  const row = rows.find((each) => each.id === open);
  return (
    <RouterProvider
      navigate={(href) => {
        setOpen(href.split('/').at(-1) ?? null);
      }}
    >
      <SidePanelLayout
        {...layout}
        panel={
          <SidePanel
            key={open ?? 'none'}
            title={row?.payee ?? ''}
            description={row?.dayLabel}
            isOpen={row !== undefined}
            onClose={() => {
              setOpen(null);
            }}
            {...panel}
          >
            {body ?? (row === undefined ? null : <Detail row={row} />)}
          </SidePanel>
        }
      >
        {selectable ? (
          <DataTable
            aria-label="Transactions"
            items={rows}
            columns={COLUMNS}
            getKey={keyOf}
            getRowHref={hrefOf}
            getGroup={groupOf}
            currentKey={open}
            selectedKeys={selected}
            onSelectionChange={setSelected}
          />
        ) : (
          <DataTable
            aria-label="Transactions"
            items={rows}
            columns={COLUMNS}
            getKey={keyOf}
            getRowHref={hrefOf}
            getGroup={groupOf}
            currentKey={open}
          />
        )}
      </SidePanelLayout>
    </RouterProvider>
  );
}

function only(scope: ParentNode, selector: string): HTMLElement {
  const found = scope.querySelector<HTMLElement>(selector);
  if (found === null) throw new Error(`Nothing matches ${selector}`);
  return found;
}

const bodyRows = (scope: ParentNode): HTMLElement[] => [
  ...scope.querySelectorAll<HTMLElement>('.data-table-table .data-table-body > [role="row"]'),
];

/** The panel beside the table, which has given up its room and still draws its table face. */
export const Open: Story = {
  globals: DESKTOP,
  render: () => <Page />,
  play: async ({ canvasElement }) => {
    const panel = within(canvasElement).getByRole('complementary', { name: 'Corner Mart' });
    await expect(panel.getBoundingClientRect().width).toBeCloseTo(384, 0);
    const content = only(canvasElement, '.side-panel-layout-content');
    await expect(content.getBoundingClientRect().right).toBeLessThanOrEqual(
      panel.getBoundingClientRect().left,
    );
  },
};

/** Closed: the table alone, at the layout's full width. */
export const Closed: Story = {
  globals: DESKTOP,
  render: () => <Page initial={null} />,
  play: async ({ canvasElement }) => {
    await expect(canvasElement.querySelector('.side-panel')).toBeNull();
    const layout = only(canvasElement, '.side-panel-layout');
    const content = only(canvasElement, '.side-panel-layout-content');
    await expect(content.getBoundingClientRect().width).toBeCloseTo(layout.getBoundingClientRect().width, 0);
  },
};

/** Delete and Save pinned under the body, under a divider. */
export const WithFooter: Story = {
  globals: DESKTOP,
  render: () => <Page panel={{ footer: ACTIONS }} />,
};

/** The title for assistive technology only, and the body opening with its own heading. */
export const TitleHidden: Story = {
  globals: DESKTOP,
  render: () => (
    <Page
      panel={{ isTitleHidden: true, title: 'Transaction' }}
      body={
        <div style={{ display: 'grid', gap: 'var(--spacing-peer)' }}>
          <Heading level={3}>Corner Mart</Heading>
          <Detail row={CORNER_MART} />
        </div>
      }
    />
  ),
};

/**
 * On a phone: the detail in a sheet over the list. The play waits until the sheet has risen, so the picture is it
 * at rest.
 */
export const PhoneSheet: Story = {
  tags: ['!viewport-desktop', 'viewport-phone'],
  globals: PHONE,
  render: () => <Page panel={{ footer: ACTIONS }} />,
  play: async () => {
    await waitFor(
      async () => {
        await expect(only(document, '.sheet-overlay')).not.toHaveAttribute('data-entering');
        const dialog = within(document.body).getByRole('dialog', { name: 'Corner Mart' });
        await expect(dialog.contains(document.activeElement)).toBe(true);
      },
      { timeout: 5000 },
    );
    await expect(document.querySelector('.side-panel')).toBeNull();
  },
};

/** A Persian page: the panel's column at the inline end, on the left, and its close button at the header's left. */
export const RightToLeft: Story = {
  globals: DESKTOP,
  render: () => (
    <I18nProvider locale="fa-IR">
      <div dir="rtl" lang="fa">
        <Page panel={{ title: 'فروشگاه سر کوچه', description: 'سه‌شنبه ۲۲ مهر', closeLabel: 'بستن' }} />
      </div>
    </I18nProvider>
  ),
  play: async ({ canvasElement }) => {
    const panel = only(canvasElement, '.side-panel');
    const content = only(canvasElement, '.side-panel-layout-content');
    await expect(panel.getBoundingClientRect().right).toBeLessThanOrEqual(
      content.getBoundingClientRect().left,
    );
  },
};

/**
 * In an AppShell at 1280px: the open panel folds the rail to its icons (spec 10.3, amendment 1), so the table
 * beside the panel keeps its table face. The fold is the panel's, not the reader's: no setting changed.
 */
export const InAppShell: Story = {
  globals: DESKTOP,
  parameters: { layout: 'fullscreen' },
  render: () => (
    <AppShell sidebar={<DemoNav />} header={<DemoHeader title="Transactions" />}>
      <div style={{ padding: 'var(--spacing-inset)' }}>
        <Page />
      </div>
    </AppShell>
  ),
  play: async ({ canvasElement }) => {
    const shell = only(canvasElement, '.app-shell');
    await expect(shell).toHaveAttribute('data-sidebar', 'collapsed');
    await expect(only(canvasElement, '.sidebar').getBoundingClientRect().width).toBeCloseTo(72, 0);
    // The table face is the one drawn: its box is 40rem or more.
    await expect(getComputedStyle(only(canvasElement, '.data-table-grid')).display).not.toBe('none');
    await expect(getComputedStyle(only(canvasElement, '.data-table-list')).display).toBe('none');
  },
};

// ---- Checks, not shot ------------------------------------------------------------------------------------------

/**
 * Enter on a row opens its panel and focus lands on the panel's heading; Escape in the panel closes it and focus
 * goes back to the row. Three engines.
 */
export const FocusOnOpen: Story = {
  tags: ['no-visual', 'webkit', 'firefox'],
  globals: DESKTOP,
  render: () => <Page initial={null} />,
  play: async ({ canvasElement }) => {
    const grid = only(canvasElement, '.data-table-table');
    for (let step = 0; step < 8 && !grid.contains(document.activeElement); step += 1) await userEvent.tab();
    const row = bodyRows(canvasElement)[1];
    if (row === undefined) throw new Error('No row');
    for (let step = 0; step < 6 && document.activeElement !== row; step += 1) {
      await userEvent.keyboard('{ArrowDown}');
    }
    await expect(row).toHaveFocus();
    await userEvent.keyboard('{Enter}');
    const heading = await within(canvasElement).findByRole('heading', { level: 2, name: 'City Transit' });
    await waitFor(() => expect(heading).toHaveFocus());
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(canvasElement.querySelector('.side-panel')).toBeNull());
    await waitFor(() => expect(row).toHaveFocus());
  },
};

/** Escape in the table is the table's: it clears the selection and the panel stays open. */
export const EscapeInTableKeepsPanel: Story = {
  tags: ['no-visual'],
  globals: DESKTOP,
  render: () => <Page selectable />,
  play: async ({ canvasElement }) => {
    const row = bodyRows(canvasElement)[2];
    if (row === undefined) throw new Error('No row');
    row.focus();
    await userEvent.keyboard('x');
    await waitFor(() => expect(row).toHaveAttribute('aria-selected', 'true'));
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(row).toHaveAttribute('aria-selected', 'false'));
    await expect(within(canvasElement).getByRole('complementary', { name: 'Corner Mart' })).toBeVisible();
  },
};

/** A page header the app sticks at the top, 64px tall, whose height it writes to `--page-sticky-top`. */
function PageHeader(): ReactElement {
  return (
    <div
      style={{
        position: 'fixed',
        insetBlockStart: 0,
        insetInline: 0,
        zIndex: 'var(--z-header)',
        blockSize: 64,
        backgroundColor: 'var(--color-canvas)',
      }}
    />
  );
}

/**
 * Under a 64px page header, as the window scrolls a long table the panel stays an inset, 16px, under the header and
 * never behind it, and it is no taller than the view under it, an inset clear of the bottom.
 */
export const StickyPanel: Story = {
  tags: ['no-visual'],
  globals: DESKTOP,
  render: () => (
    <div style={{ '--page-sticky-top': '64px', paddingBlockStart: 64 } as CSSProperties}>
      <PageHeader />
      <Page rows={manyTransactions(60)} initial="m1" panel={{ footer: ACTIONS }} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    window.scrollTo(0, 0);
    const panel = only(canvasElement, '.side-panel');
    try {
      window.scrollBy({ top: 1200, behavior: 'instant' });
      await waitFor(() => expect(Math.round(panel.getBoundingClientRect().top)).toBe(64 + 16));
      await expect(panel.getBoundingClientRect().bottom).toBeLessThanOrEqual(window.innerHeight - 16 + 0.5);
    } finally {
      // Back to the top whether or not it held, so the next story starts there.
      window.scrollTo(0, 0);
    }
  },
};

/**
 * A field's focus ring fits inside the body, which scrolls and so clips what it holds: the body is padded a peer
 * step at its sides and an inset at its top, and the ring's width and offset are 4px. Each field in turn, the
 * first at the body's top.
 */
export const FieldRingFits: Story = {
  tags: ['no-visual'],
  globals: DESKTOP,
  render: () => <Page />,
  play: async ({ canvasElement }) => {
    const body = only(canvasElement, '.side-panel-body');
    // From the keyboard, so the ring shows.
    await userEvent.keyboard('{Shift}');
    for (const input of body.querySelectorAll<HTMLElement>('.input, .select-trigger')) {
      input.focus();
      await waitFor(() => expect(getComputedStyle(input).outlineStyle).toBe('solid'));
      const style = getComputedStyle(input);
      const grow = parseFloat(style.outlineWidth) + parseFloat(style.outlineOffset);
      const ring = input.getBoundingClientRect();
      const room = body.getBoundingClientRect();
      const name = input.className;
      await expect(ring.left - grow, name).toBeGreaterThanOrEqual(room.left);
      await expect(ring.right + grow, name).toBeLessThanOrEqual(room.right);
      await expect(ring.top - grow, name).toBeGreaterThanOrEqual(room.top);
    }
  },
};

/** The close button is hit at 40px, the target the system keeps (WCAG 2.5.8). */
export const CloseButtonHit: Story = {
  tags: ['no-visual'],
  globals: DESKTOP,
  render: () => <Page />,
  play: async ({ canvasElement }) => {
    const close = within(canvasElement).getByRole('button', { name: 'Close' });
    const box = close.getBoundingClientRect();
    await expect(box.width).toBeGreaterThanOrEqual(40);
    await expect(box.height).toBeGreaterThanOrEqual(40);
  },
};

/**
 * A list of days in the panel's body, which scrolls: the body sets `--page-sticky-top` to 0px, so a DataTable in it
 * sticks its day headings at the body's top as the body scrolls, not the page header's height down inside it (spec
 * correction 68), with the page's offset set. The panel's 24rem holds a DataTable's list face, whose day headings
 * stick as the table face's header row does.
 */
export const TableInPanel: Story = {
  tags: ['no-visual'],
  globals: DESKTOP,
  render: () => (
    <div style={{ '--page-sticky-top': '64px', paddingBlockStart: 64 } as CSSProperties}>
      <PageHeader />
      <Page
        body={
          <DataTable
            aria-label="Earlier visits"
            items={manyTransactions(30)}
            columns={COLUMNS}
            getKey={keyOf}
            getGroup={groupOf}
          />
        }
      />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const body = only(canvasElement, '.side-panel-body');
    await expect(getComputedStyle(only(body, '.data-table-list')).display).not.toBe('none');
    await expect(body.scrollHeight).toBeGreaterThan(body.clientHeight);
    const headings = [...body.querySelectorAll<HTMLElement>('.data-table-section-header')];
    await expect(headings.length).toBeGreaterThan(2);
    body.scrollTop = 400;
    // The heading of the day at the body's top sits there, the body's top and not 64px below it.
    await waitFor(() => {
      const top = body.getBoundingClientRect().top;
      const stuck = headings.filter((heading) => Math.abs(heading.getBoundingClientRect().top - top) < 1);
      return expect(stuck.length).toBeGreaterThan(0);
    });
    body.scrollTop = 0;
  },
};

/** What the next two stories' callbacks were asked, counted from each render. */
const calls = { collapsed: 0, requests: 0, closes: 0 };

/**
 * In an AppShell at 1280px the rail folds at once as the panel opens, with no transition, and comes back as it
 * closes; the reader's choice is never told. The table keeps its table face in both states.
 */
export const RailFold: Story = {
  tags: ['no-visual'],
  globals: DESKTOP,
  parameters: { layout: 'fullscreen' },
  render: () => {
    calls.collapsed = 0;
    return (
      <AppShell
        sidebar={<DemoNav />}
        header={<DemoHeader title="Transactions" />}
        onSidebarCollapsedChange={() => {
          calls.collapsed += 1;
        }}
      >
        <div style={{ padding: 'var(--spacing-inset)' }}>
          <Page initial={null} />
        </div>
      </AppShell>
    );
  },
  play: async ({ canvasElement }) => {
    const rail = only(canvasElement, '.sidebar');
    const table = only(canvasElement, '.data-table-grid');
    await expect(rail.getBoundingClientRect().width).toBeCloseTo(288, 0);
    const link = canvasElement.querySelector<HTMLElement>('.data-table-table .data-table-link');
    if (link === null) throw new Error('No row link');
    link.click();
    await within(canvasElement).findByRole('complementary', { name: 'Corner Mart' });
    // At once: the width is the collapsed one in the frame the panel came in, with no transition running.
    await expect(rail.getBoundingClientRect().width).toBeCloseTo(72, 0);
    await expect(getComputedStyle(rail).transitionDuration).toBe('0s');
    await expect(getComputedStyle(table).display).not.toBe('none');
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(canvasElement.querySelector('.side-panel')).toBeNull());
    await waitFor(() => expect(rail.getBoundingClientRect().width).toBeCloseTo(288, 0), { timeout: 2000 });
    await expect(calls.collapsed).toBe(0);
  },
};

/**
 * Focus given back follows the row while the content settles: the panel closes with the box 40rem or more, so
 * focus lands on the table face's row, and the box then narrows, as it does while a rail beside the page unfolds
 * over a transition, so the list face takes over and hides that row. Focus moves to the same row in the list
 * rather than falling to the page (WCAG 2.4.3). Three engines.
 */
export const FocusFollowsFace: Story = {
  tags: ['no-visual', 'webkit', 'firefox'],
  globals: DESKTOP,
  render: () => (
    <div data-testid="box" style={{ width: '1100px' }}>
      <Page initial={null} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const box = only(canvasElement, '[data-testid="box"]');
    const row = bodyRows(canvasElement)[0];
    if (row === undefined) throw new Error('No row');
    await focusOn(row);
    await userEvent.keyboard('{Enter}');
    const heading = await within(canvasElement).findByRole('heading', { level: 2, name: 'Corner Mart' });
    await waitFor(() => expect(heading).toHaveFocus());
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(row).toHaveFocus());
    // The box narrows under 40rem after focus came back: the list face is drawn and the table row hidden.
    box.style.width = '600px';
    const item = only(canvasElement, '.data-table-list [role="row"][data-key="t1"]');
    await waitFor(() => expect(item).toHaveFocus());
    await expect(getComputedStyle(only(canvasElement, '.data-table-grid')).display).toBe('none');
  },
};

/** The server's HTML of a page in an AppShell, its panel open, drawn with no script: nothing hydrates it. */
function ServerHtml(): ReactElement {
  const html = renderToString(
    <AppShell sidebar={<DemoNav />} header={<DemoHeader title="Transactions" />}>
      <div style={{ padding: 'var(--spacing-inset)' }}>
        <Page />
      </div>
    </AppShell>,
  );
  return <div data-testid="server-html" dangerouslySetInnerHTML={{ __html: html }} />;
}

/**
 * A page loaded with its panel open at 1280px draws the rail folded before any script runs (spec correction 94):
 * the stylesheet folds it from the layout's data-collapses-rail and its open aside, so the page does not shift as
 * scripts fold it. The reader's waiver and collapsesRail false stand the fold down.
 */
export const ServerFold: Story = {
  tags: ['no-visual'],
  globals: DESKTOP,
  parameters: { layout: 'fullscreen' },
  render: () => <ServerHtml />,
  play: async ({ canvasElement }) => {
    const shell = only(canvasElement, '.app-shell');
    const rail = only(canvasElement, '.sidebar');
    const workspace = only(canvasElement, '.app-shell-workspace');
    const layout = only(canvasElement, '.side-panel-layout');
    // Nothing ran: no attribute a script writes, and the aside is the server's.
    await expect(shell).not.toHaveAttribute('data-sidebar');
    await expect(only(canvasElement, 'aside.side-panel')).toBeVisible();
    // Folded by the stylesheet alone: the collapsed width, its names clipped, and the workspace offset by it.
    await expect(rail.getBoundingClientRect().width).toBeCloseTo(72, 0);
    await expect(getComputedStyle(workspace).marginInlineStart).toBe('104px');
    await expect(only(rail, '.sidebar-item-label').getBoundingClientRect().width).toBeLessThanOrEqual(1);
    await expect(getComputedStyle(rail).transitionDuration).toBe('0s');
    // The table beside the panel keeps its table face.
    await expect(getComputedStyle(only(canvasElement, '.data-table-grid')).display).not.toBe('none');
    // The reader expanded the rail over the panel: the fold stands down.
    shell.setAttribute('data-sidebar-unfolded', '');
    await waitFor(() => expect(rail.getBoundingClientRect().width).toBeCloseTo(288, 0), { timeout: 2000 });
    shell.removeAttribute('data-sidebar-unfolded');
    await waitFor(() => expect(rail.getBoundingClientRect().width).toBeCloseTo(72, 0));
    // collapsesRail false: no fold.
    layout.removeAttribute('data-collapses-rail');
    await waitFor(() => expect(rail.getBoundingClientRect().width).toBeCloseTo(288, 0), { timeout: 2000 });
  },
};

/**
 * A swipe the app refuses while it holds unsaved edits: the sheet has left the screen before it asks, so it
 * rises again, and onClose is never called. Chromium only: the swipe is the scroll the Sheet's own story drives.
 */
export const RefusedSwipe: Story = {
  tags: ['no-visual', '!viewport-desktop'],
  globals: PHONE,
  render: () => {
    calls.requests = 0;
    calls.closes = 0;
    return (
      <SidePanel
        title="Corner Mart"
        isOpen
        onClose={() => {
          calls.closes += 1;
        }}
        onCloseRequest={() => {
          calls.requests += 1;
          return false;
        }}
      >
        <Detail row={CORNER_MART} />
      </SidePanel>
    );
  },
  play: async () => {
    const atRest = (): Promise<void> =>
      waitFor(
        async () => {
          await expect(only(document, '.sheet-overlay')).not.toHaveAttribute('data-entering');
          await expect(only(document, '.sheet')).toHaveAttribute('data-expanded');
        },
        { timeout: 5000 },
      );
    await atRest();
    only(document, '[data-sheet-scroll]').scrollTo({ top: 0, behavior: 'smooth' });
    await waitFor(() => expect(calls.requests).toBe(1), { timeout: 3000 });
    await atRest();
    await expect(within(document.body).getByRole('dialog', { name: 'Corner Mart' })).toBeVisible();
    await expect(calls.closes).toBe(0);
  },
};
