import type { Meta, StoryObj } from '@storybook/react-vite';
import { Ellipsis } from 'lucide-react';
import { useState, type CSSProperties, type KeyboardEvent, type ReactElement } from 'react';
import {
  Cell,
  Column,
  Row,
  Table,
  TableBody,
  TableHeader,
  type Key,
  type Selection,
} from 'react-aria-components';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { Checkbox } from '../checkbox';
import { IconButton } from '../icon-button';
import { Link, RouterProvider } from '../link';
import { Menu, MenuItem, MenuTrigger } from '../menu';
import { MENU_ROW_A11Y } from '../stories/a11y';

/**
 * The spike that DataTable is built on (plan Task 2, Step 1; spec risks R1 and R2), kept as the record of what
 * the table relies on in Chromium, WebKit and Firefox. Each story is React Aria's own Table, not DataTable,
 * wearing data-table.css's classes: selection on, the library's Checkbox in the selection slot, the library's
 * Link in the row header cell stretched over the row by its ::after, a Menu in the last cell, a router whose
 * navigate is a spy, and a capture-phase key handler on a wrapping div, `spikeKeys`, which DataTable's keys.ts
 * replaces. Every story is `no-visual` and runs in all three engines.
 */
const meta = {
  title: 'Checks/React Aria table',
  tags: ['no-visual', 'webkit', 'firefox'],
  parameters: { layout: 'padded', a11y: MENU_ROW_A11Y },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const navigate = fn();

interface Spend {
  id: string;
  payee: string;
  category: string;
  account: string;
  amount: string;
}

const PAYEES = ['Alpha', 'Bravo', 'Charlie', 'Delta', 'Echo'];
const CATEGORIES = ['Groceries', 'Rent', 'Transport', 'Dining', 'Utilities'];

const spends = (count: number): Spend[] =>
  Array.from({ length: count }, (_, index) => ({
    id: `t${String(index + 1)}`,
    payee: `${PAYEES[index % PAYEES.length] ?? 'Alpha'}${index < PAYEES.length ? '' : ` ${String(index + 1)}`}`,
    category: CATEGORIES[index % CATEGORIES.length] ?? 'Groceries',
    account: index % 2 === 0 ? 'Checking' : 'Savings',
    amount: `-$${String(12 + index * 7)}.50`,
  }));

const hrefOf = (spend: Spend): string => `/transactions/${spend.id}`;

/** A cell React Aria's delegate would reach and the CSS hid. Read at key time only. */
const isShown = (cell: Element): boolean => getComputedStyle(cell).display !== 'none';

/** The row's cells, in DOM order. */
const cellsOf = (row: Element): HTMLElement[] => [
  ...row.querySelectorAll<HTMLElement>(':scope > [role="gridcell"], :scope > [role="rowheader"]'),
];

/**
 * The spike's key handler, on the wrapper in the capture phase, so it runs before React Aria's own handlers on
 * the grid, its rows and its cells: Enter on a row clicks the row's link, and stops, so React Aria never
 * selects; a single printable key other than Space stops, so typeahead never moves focus; and an arrow that
 * React Aria would send to a hidden cell focuses the nearest shown one instead. Keys from a portal (an open
 * menu) and keys with a modifier pass.
 */
function spikeKeys(event: KeyboardEvent<HTMLDivElement>): void {
  const target = event.target as Element;
  if (!event.currentTarget.contains(target)) return;
  if (event.ctrlKey || event.altKey || event.metaKey || event.nativeEvent.isComposing) return;
  if (event.key === 'Enter' && target.getAttribute('role') === 'row') {
    const link = target.querySelector<HTMLAnchorElement>('.data-table-link');
    if (link === null) return;
    event.preventDefault();
    event.stopPropagation();
    link.click();
    return;
  }
  if (event.key.length === 1 && event.key !== ' ') {
    event.stopPropagation();
    return;
  }
  if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return;
  const active = document.activeElement;
  const from = active?.closest('[role="gridcell"], [role="rowheader"]') ?? active;
  if (from === null) return;
  const row = from.getAttribute('role') === 'row' ? from : from.closest('[role="row"]');
  if (row === null) return;
  const cells = cellsOf(row);
  const rtl = getComputedStyle(row).direction === 'rtl';
  const step = (event.key === 'ArrowRight') !== rtl ? 1 : -1;
  const start = from === row ? (step === 1 ? -1 : cells.length) : cells.indexOf(from as HTMLElement);
  const reached = cells[start + step];
  if (reached === undefined || isShown(reached)) return;
  for (let index = start + step; index >= 0 && index < cells.length; index += step) {
    const cell = cells[index];
    if (cell !== undefined && isShown(cell)) {
      event.preventDefault();
      event.stopPropagation();
      cell.focus();
      return;
    }
  }
}

interface SpikeProps {
  rows?: number;
  /** Hides the third column, Category, as a container query would. */
  hideCategory?: boolean;
}

/** React Aria's Table with the library's parts and data-table.css's classes, as DataTable will draw it. */
function Spike({ rows = 5, hideCategory = false }: SpikeProps): ReactElement {
  const [selected, setSelected] = useState<Selection>(new Set<Key>());
  const items = spends(rows);
  const hidden = hideCategory ? { display: 'none' } : undefined;
  return (
    <RouterProvider navigate={navigate}>
      {/* The spike's key guard: a capture listener jsx-a11y does not read, as DataTable's root will be. */}
      <div className="data-table" onKeyDownCapture={spikeKeys} style={{ width: 'min(48rem, 100%)' }}>
        <div className="data-table-grid">
          <Table
            aria-label="Spending"
            className="data-table-table"
            selectionMode="multiple"
            selectionBehavior="toggle"
            selectedKeys={selected}
            onSelectionChange={setSelected}
          >
            <TableHeader className="data-table-header">
              <Column className="data-table-column" style={{ width: '3.5rem' }}>
                <Checkbox slot="selection" aria-label="Select all" />
              </Column>
              <Column className="data-table-column" isRowHeader>
                Payee
              </Column>
              <Column className="data-table-column" style={hidden}>
                Category
              </Column>
              <Column className="data-table-column">Account</Column>
              <Column className="data-table-column">Amount</Column>
              <Column className="data-table-column" style={{ width: '4rem' }}>
                Actions
              </Column>
            </TableHeader>
            <TableBody className="data-table-body">
              {items.map((item) => (
                <Row
                  key={item.id}
                  id={item.id}
                  textValue={item.payee}
                  className="data-table-row"
                  data-link=""
                >
                  <Cell className="data-table-cell">
                    <Checkbox slot="selection" aria-label="Select" />
                  </Cell>
                  <Cell className="data-table-cell">
                    <Link href={hrefOf(item)} className="data-table-link">
                      {item.payee}
                    </Link>
                  </Cell>
                  <Cell className="data-table-cell" style={hidden}>
                    {item.category}
                  </Cell>
                  <Cell className="data-table-cell">{item.account}</Cell>
                  <Cell className="data-table-cell" data-testid={`amount-${item.id}`}>
                    {item.amount}
                  </Cell>
                  <Cell className="data-table-cell">
                    <MenuTrigger>
                      <IconButton aria-label={`More for ${item.payee}`}>
                        <Ellipsis />
                      </IconButton>
                      <Menu>
                        <MenuItem id="split">Split</MenuItem>
                        <MenuItem id="delete">Delete</MenuItem>
                      </Menu>
                    </MenuTrigger>
                  </Cell>
                </Row>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </RouterProvider>
  );
}

const bodyRows = (scope: ParentNode): HTMLElement[] => [
  ...scope.querySelectorAll<HTMLElement>('tbody [role="row"]'),
];

function rowAt(scope: ParentNode, index: number): HTMLElement {
  const row = bodyRows(scope)[index];
  if (row === undefined) throw new Error(`No row ${String(index)}`);
  return row;
}

const centerOf = (element: Element): { x: number; y: number } => {
  const box = element.getBoundingClientRect();
  return { x: box.left + box.width / 2, y: box.top + box.height / 2 };
};

/** What the browser's hit test finds at the center of `element`, as a finger or the pointer would. */
function hitAt(element: Element): Element {
  const { x, y } = centerOf(element);
  const hit = document.elementFromPoint(x, y);
  if (hit === null) throw new Error('Nothing under the point');
  return hit;
}

const noneSelected = async (scope: ParentNode): Promise<void> => {
  await expect(scope.querySelectorAll('[role="row"][aria-selected="true"]')).toHaveLength(0);
};

/** Tabs into the table and arrows down to body row `index`, as a keyboard reader arrives. */
async function focusRow(scope: ParentNode, index: number): Promise<HTMLElement> {
  const row = rowAt(scope, index);
  const grid = scope.querySelector('[role="grid"]');
  if (grid === null) throw new Error('No grid');
  for (let step = 0; step < 6 && !grid.contains(document.activeElement); step += 1) await userEvent.tab();
  await expect(grid.contains(document.activeElement)).toBe(true);
  for (let step = 0; step < 8 && document.activeElement !== row; step += 1) {
    await userEvent.keyboard('{ArrowDown}');
  }
  await expect(row).toHaveFocus();
  return row;
}

/**
 * A press on a row's amount cell lands on the row header's link, stretched over the row: the browser's hit test
 * finds the link there, the router opens the row's href, and no row is selected (risk R1).
 */
export const RowPressOpens: Story = {
  render: () => <Spike />,
  play: async ({ canvasElement }) => {
    navigate.mockClear();
    const second = rowAt(canvasElement, 1);
    const link = within(second).getByRole('link', { name: 'Bravo' });
    const amount = within(canvasElement).getByTestId('amount-t2');
    const hit = hitAt(amount);
    await expect(hit).toBe(link);
    await userEvent.click(hit);
    await expect(navigate).toHaveBeenCalledTimes(1);
    await expect(navigate.mock.calls[0]?.[0]).toBe('/transactions/t2');
    await noneSelected(canvasElement);
  },
};

/** Enter on a focused row opens its link through the capture handler, and never selects it (risk R1). */
export const EnterOpens: Story = {
  render: () => <Spike />,
  play: async ({ canvasElement }) => {
    navigate.mockClear();
    const row = await focusRow(canvasElement, 1);
    await userEvent.keyboard('{Enter}');
    await expect(navigate).toHaveBeenCalledTimes(1);
    await expect(navigate.mock.calls[0]?.[0]).toBe('/transactions/t2');
    await expect(row).not.toHaveAttribute('aria-selected', 'true');
    await noneSelected(canvasElement);
  },
};

/** The checkbox and a cell's Menu sit above the stretched link and take their own press. */
export const CellControls: Story = {
  render: () => <Spike />,
  play: async ({ canvasElement }) => {
    navigate.mockClear();
    const third = rowAt(canvasElement, 2);
    const box = third.querySelector('.checkbox-box');
    if (box === null) throw new Error('No checkbox');
    const boxHit = hitAt(box);
    await expect(third.querySelector('.checkbox-field')?.contains(boxHit)).toBe(true);
    await userEvent.click(boxHit);
    await waitFor(() => expect(third).toHaveAttribute('aria-selected', 'true'));
    await expect(navigate).not.toHaveBeenCalled();
    const trigger = within(third).getByRole('button', { name: 'More for Charlie' });
    const triggerHit = hitAt(trigger);
    await expect(trigger.contains(triggerHit)).toBe(true);
    await userEvent.click(triggerHit);
    const menu = await within(document.body).findByRole('menu');
    await expect(navigate).not.toHaveBeenCalled();
    // The menu takes focus as it opens, which runs late on a busy runner; Escape is the menu's once it has.
    await waitFor(() => expect(menu.contains(document.activeElement)).toBe(true));
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(document.querySelector('[role="menu"]')).toBeNull(), { timeout: 3000 });
    await expect(navigate).not.toHaveBeenCalled();
    await expect(
      bodyRows(canvasElement).filter((row) => row.getAttribute('aria-selected') === 'true'),
    ).toEqual([third]);
  },
};

/** A letter never moves focus: the capture handler stops it before React Aria's typeahead (risk R2). */
export const TypeaheadStopped: Story = {
  render: () => <Spike />,
  play: async ({ canvasElement }) => {
    navigate.mockClear();
    const first = await focusRow(canvasElement, 0);
    await userEvent.keyboard('c');
    await expect(first).toHaveFocus();
    await userEvent.keyboard('d');
    await expect(first).toHaveFocus();
    await expect(navigate).not.toHaveBeenCalled();
    await noneSelected(canvasElement);
  },
};

/** The arrows step over a column the CSS hid, which React Aria's delegate would reach (spec correction 8). */
export const HiddenCellSkipped: Story = {
  render: () => <Spike hideCategory />,
  play: async ({ canvasElement }) => {
    const first = await focusRow(canvasElement, 0);
    const cells = cellsOf(first);
    await expect(cells).toHaveLength(6);
    const category = cells[2];
    if (category === undefined) throw new Error('No Category cell');
    await expect(isShown(category)).toBe(false);
    // From the row into its checkbox cell, then into the row header's cell.
    await userEvent.keyboard('{ArrowRight}');
    await waitFor(() => expect(cells[0]?.contains(document.activeElement)).toBe(true));
    await userEvent.keyboard('{ArrowRight}');
    await waitFor(() => expect(cells[1]?.contains(document.activeElement)).toBe(true));
    // The next is Category, hidden: the handler focuses Account.
    await userEvent.keyboard('{ArrowRight}');
    await waitFor(() => expect(cells[3]?.contains(document.activeElement)).toBe(true));
    // And back over it.
    await userEvent.keyboard('{ArrowLeft}');
    await waitFor(() => expect(cells[1]?.contains(document.activeElement)).toBe(true));
  },
};

/**
 * The header cells stick at --page-sticky-top under a 64px header fixed at the top of the page, in all three
 * engines (spec correction 16): the cells stick, not the thead.
 */
export const StickyHeaderEngines: Story = {
  render: () => (
    <div style={{ '--page-sticky-top': '64px' } as CSSProperties}>
      <div
        aria-hidden="true"
        data-testid="page-header"
        style={{
          position: 'fixed',
          insetBlockStart: 0,
          insetInline: 0,
          blockSize: 64,
          zIndex: 30,
          background: 'var(--color-lifted)',
        }}
      />
      <div style={{ paddingBlockStart: 80 }}>
        <Spike rows={60} />
      </div>
    </div>
  ),
  play: async ({ canvasElement }) => {
    window.scrollTo(0, 0);
    const headers = [...canvasElement.querySelectorAll<HTMLElement>('[role="columnheader"]')];
    await expect(headers.length).toBeGreaterThan(0);
    window.scrollTo(0, 800);
    await waitFor(() => expect(window.scrollY).toBe(800));
    await new Promise((resolve) => requestAnimationFrame(resolve));
    for (const header of headers) {
      await expect(Math.round(header.getBoundingClientRect().top)).toBe(64);
    }
    // The first body row has scrolled under the header.
    await expect(rowAt(canvasElement, 0).getBoundingClientRect().top).toBeLessThan(64);
    window.scrollTo(0, 0);
  },
};
