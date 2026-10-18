import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Archive, Download, Tag, Trash2 } from 'lucide-react';
import { useState, type ReactElement, type ReactNode } from 'react';
import type { Key } from 'react-aria-components';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { expectNoA11yViolations } from '../../test/a11y';
import { holdFrames, showFace } from '../../test/dom';
import { Button } from '../button';
import { SaveBar } from '../save-bar';
import { COLUMNS, keyOf, TRANSACTIONS, type Transaction } from '../stories/transactions';
import { DataTable, type DataTableBulkAction, type DataTableProps } from '.';

const FIVE = TRANSACTIONS.slice(0, 5);

type Props = Partial<DataTableProps<Transaction>>;

/** The four actions of the bulk stories: two promoted, two in More. */
function actionsWith(spy: (id: string, keys: Key[]) => void): DataTableBulkAction[] {
  return [
    {
      id: 'categorize',
      label: 'Categorize',
      icon: <Tag />,
      isPromoted: true,
      onAction: (keys) => {
        spy('categorize', keys);
      },
    },
    {
      id: 'export',
      label: 'Export',
      icon: <Download />,
      isPromoted: true,
      onAction: (keys) => {
        spy('export', keys);
      },
    },
    {
      id: 'archive',
      label: 'Archive',
      icon: <Archive />,
      onAction: (keys) => {
        spy('archive', keys);
      },
    },
    {
      id: 'delete',
      label: 'Delete',
      icon: <Trash2 />,
      onAction: (keys) => {
        spy('delete', keys);
      },
    },
  ];
}

/** The table with selection in state, as a page holds it. */
function Selecting({ initial = [], ...props }: Props & { initial?: Key[] }): ReactElement {
  const [keys, setKeys] = useState<Key[]>(initial);
  return (
    <DataTable
      aria-label="Transactions"
      items={FIVE}
      columns={COLUMNS}
      getKey={keyOf}
      onSortChange={() => undefined}
      {...(props as object)}
      selectedKeys={keys}
      onSelectionChange={setKeys}
    />
  );
}

const bar = (): HTMLElement => screen.getByRole('toolbar', { name: 'Bulk actions' });

/**
 * Lays the page out as far as `isDrawn` reads it: jsdom draws nothing, so every element would have no client
 * rect. Here an element has one unless it or an ancestor is `display: none` by the page's styles.
 */
function layOut(): void {
  const hidden = (element: Element): boolean => {
    for (let node: Element | null = element; node !== null; node = node.parentElement) {
      if (getComputedStyle(node).display === 'none') return true;
    }
    return false;
  };
  vi.spyOn(Element.prototype, 'getClientRects').mockImplementation(function (this: Element) {
    return (hidden(this) ? [] : [new DOMRect(0, 0, 40, 40)]) as unknown as DOMRectList;
  });
}

/** A narrow bar, as its container query under 40rem draws it: the promoted buttons are not drawn. */
function narrowBar(): () => void {
  const style = document.createElement('style');
  style.dataset.narrowBar = '';
  style.textContent = '.data-table-bar-actions > [data-action-id] { display: none; }';
  document.head.append(style);
  return () => {
    style.remove();
  };
}

/** The names of the items of the open More menu. */
const moreItems = (): string[] =>
  within(screen.getByRole('menu'))
    .getAllByRole('menuitem')
    .map((item) => item.textContent);

beforeEach(() => {
  showFace('table');
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  // A narrow bar a test left behind would hide the next test's promoted buttons.
  for (const style of document.head.querySelectorAll('style[data-narrow-bar]')) style.remove();
});

describe('DataTable listBelow', () => {
  it('writes data-list-below only for 32rem', () => {
    const { container, rerender } = render(
      <DataTable aria-label="T" items={FIVE} columns={COLUMNS} getKey={keyOf} />,
    );
    const root = container.querySelector('.data-table');
    expect(root).not.toHaveAttribute('data-list-below');
    rerender(<DataTable aria-label="T" items={FIVE} columns={COLUMNS} getKey={keyOf} listBelow="40rem" />);
    expect(root).not.toHaveAttribute('data-list-below');
    rerender(<DataTable aria-label="T" items={FIVE} columns={COLUMNS} getKey={keyOf} listBelow="32rem" />);
    expect(root).toHaveAttribute('data-list-below', '32rem');
  });

  it('takes only a container width the stylesheet has a block for', () => {
    const base = { 'aria-label': 'T', items: FIVE, columns: COLUMNS, getKey: keyOf };
    // @ts-expect-error a breakpoint name is not a container width (spec 11.1)
    const named = <DataTable {...base} listBelow="md" />;
    // @ts-expect-error only the two widths ruling 24 names
    const other = <DataTable {...base} listBelow="36rem" />;
    expect(named).toBeTruthy();
    expect(other).toBeTruthy();
  });
});

describe('DataTable bulk-action bar', () => {
  it('draws Clear selection as an icon named labels.clearSelection, first in the bar', async () => {
    const user = userEvent.setup();
    render(<Selecting initial={['t1', 't2']} bulkActions={actionsWith(vi.fn())} />);
    const clear = within(bar()).getByRole('button', { name: 'Clear selection' });
    expect(clear).toHaveClass('icon-button', 'data-table-bar-clear');
    expect(clear.textContent).toBe('');
    expect(clear.querySelector('svg')).not.toBeNull();
    // First in the bar: the first focusable thing in it.
    expect(within(bar()).getAllByRole('button')[0]).toBe(clear);
    // A tip of the same words while it has keyboard focus: Tab from the grid reaches it first.
    await user.tab();
    expect(screen.getByRole('grid').contains(document.activeElement)).toBe(true);
    await user.tab();
    expect(clear).toHaveFocus();
    await waitFor(() => {
      expect(screen.getByRole('tooltip')).toHaveTextContent('Clear selection');
    });
    // Its own words from labels.
    render(<Selecting initial={['t1']} labels={{ clearSelection: 'Deselect', toolbar: 'Rows' }} />);
    expect(
      within(screen.getByRole('toolbar', { name: 'Rows' })).getByRole('button', { name: 'Deselect' }),
    ).toBeInTheDocument();
  });

  it('draws selectAllMatching after the count', () => {
    render(
      <Selecting
        initial={['t1', 't2', 't3']}
        bulkActions={actionsWith(vi.fn())}
        selectAllMatching={<Button variant="tertiary">Select all 1,240 matching</Button>}
      />,
    );
    const count = bar().querySelector('.data-table-bar-count');
    expect(count).toHaveTextContent(/^3 selected$/);
    const place = count?.nextElementSibling;
    expect(place).toHaveClass('data-table-bar-select-all');
    expect(within(place as HTMLElement).getByRole('button')).toHaveTextContent('Select all 1,240 matching');
    expect(place?.nextElementSibling).toHaveClass('data-table-bar-actions');
  });

  it('draws no select-all place without selectAllMatching', () => {
    render(<Selecting initial={['t1']} bulkActions={actionsWith(vi.fn())} selectAllMatching={false} />);
    expect(bar().querySelector('.data-table-bar-select-all')).toBeNull();
  });

  it('draws up to three promoted actions as buttons and warns once for a fourth', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const promoted = (id: string): DataTableBulkAction => ({
      id,
      label: id.toUpperCase(),
      isPromoted: true,
      onAction: () => undefined,
    });
    const { rerender } = render(
      <Selecting initial={['t1']} bulkActions={[promoted('a'), promoted('b'), promoted('c')]} />,
    );
    const buttons = (): HTMLElement[] => [
      ...bar().querySelectorAll<HTMLElement>('.data-table-bar-actions > [data-action-id]'),
    ];
    expect(buttons().map((button) => [button.dataset.actionId, button.textContent])).toEqual([
      ['a', 'A'],
      ['b', 'B'],
      ['c', 'C'],
    ]);
    for (const button of buttons()) expect(button).toHaveClass('button', 'button-secondary');
    expect(warn).not.toHaveBeenCalled();
    rerender(
      <Selecting
        initial={['t1']}
        bulkActions={[promoted('a'), promoted('b'), promoted('c'), promoted('d'), promoted('e')]}
      />,
    );
    expect(buttons().map((button) => button.dataset.actionId)).toEqual(['a', 'b', 'c']);
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0]?.[0]).toMatch(/at most three/);
    expect(warn.mock.calls[0]?.[0]).toContain('"d"');
  });

  it('draws a promoted action with its icon before its label, and disabled as asked', () => {
    render(
      <Selecting
        initial={['t1']}
        bulkActions={[
          { id: 'export', label: 'Export', icon: <Download />, isPromoted: true, onAction: vi.fn() },
          { id: 'tag', label: 'Tag', isPromoted: true, isDisabled: true, onAction: vi.fn() },
        ]}
      />,
    );
    const exportButton = within(bar()).getByRole('button', { name: 'Export' });
    const icon = exportButton.querySelector('.data-table-bar-icon');
    expect(icon).toHaveAttribute('aria-hidden', 'true');
    expect(icon?.querySelector('svg')).not.toBeNull();
    expect(within(bar()).getByRole('button', { name: 'Tag' })).toBeDisabled();
  });

  it('puts the unpromoted actions in More, and the promoted ones whose buttons are not drawn when it opens', async () => {
    const user = userEvent.setup();
    layOut();
    render(<Selecting initial={['t1', 't2']} bulkActions={actionsWith(vi.fn())} />);
    const more = within(bar()).getByRole('button', { name: 'More actions' });
    expect(more).toHaveClass('icon-button', 'data-table-bar-more');
    expect(more).not.toHaveAttribute('data-promoted-only');
    await user.click(more);
    expect(moreItems()).toEqual(['Archive', 'Delete']);
    await user.keyboard('{Escape}');
    await waitFor(() => {
      expect(screen.queryByRole('menu')).toBeNull();
    });
    // Narrowed: the promoted buttons are not drawn, so More holds every action, read again at the press.
    const widen = narrowBar();
    await user.click(more);
    expect(moreItems()).toEqual(['Categorize', 'Export', 'Archive', 'Delete']);
    await user.keyboard('{Escape}');
    await waitFor(() => {
      expect(screen.queryByRole('menu')).toBeNull();
    });
    widen();
    await user.click(more);
    expect(moreItems()).toEqual(['Archive', 'Delete']);
  });

  it('keeps each action name, icon and disabled state in More', async () => {
    const user = userEvent.setup();
    layOut();
    render(
      <Selecting
        initial={['t1']}
        bulkActions={[
          { id: 'archive', label: 'Archive', icon: <Archive />, onAction: vi.fn() },
          { id: 'delete', label: 'Delete', isDisabled: true, onAction: vi.fn() },
        ]}
      />,
    );
    await user.click(within(bar()).getByRole('button', { name: 'More actions' }));
    const menu = screen.getByRole('menu', { name: 'More actions' });
    expect(within(menu).getByRole('menuitem', { name: 'Archive' }).querySelector('svg')).not.toBeNull();
    expect(within(menu).getByRole('menuitem', { name: 'Delete' })).toHaveAttribute('aria-disabled', 'true');
  });

  it('calls onAction with the selected keys present in items', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const user = userEvent.setup();
    const spy = vi.fn();
    layOut();
    render(<Selecting initial={['t1', 'gone', 't3']} bulkActions={actionsWith(spy)} />);
    await user.click(within(bar()).getByRole('button', { name: 'Categorize' }));
    expect(spy).toHaveBeenLastCalledWith('categorize', ['t1', 't3']);
    await user.click(within(bar()).getByRole('button', { name: 'More actions' }));
    await user.click(screen.getByRole('menuitem', { name: 'Delete' }));
    expect(spy).toHaveBeenLastCalledWith('delete', ['t1', 't3']);
    expect(spy).toHaveBeenCalledTimes(2);
  });

  it('draws no More with nothing to put in it, and marks one that holds only promoted actions', () => {
    const { rerender } = render(<Selecting initial={['t1']} bulkActions={[]} />);
    expect(within(bar()).queryByRole('button', { name: 'More actions' })).toBeNull();
    expect(bar().querySelector('.data-table-bar-actions')).toBeNull();
    rerender(
      <Selecting
        initial={['t1']}
        bulkActions={[{ id: 'export', label: 'Export', isPromoted: true, onAction: vi.fn() }]}
      />,
    );
    // Wide, its one action is a button and More is not drawn (the stylesheet's 40rem query); narrow, More holds it.
    expect(within(bar()).getByRole('button', { name: 'More actions' })).toHaveAttribute(
      'data-promoted-only',
      '',
    );
  });

  it('warns once and draws nothing for an entry of the data form that is not an action, rather than crashing', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const spy = vi.fn();
    const malformed = [
      ...actionsWith(spy).slice(0, 2),
      { id: 'archive', label: 'Archive' },
      { id: 'delete', title: 'Delete', onAction: () => undefined },
    ] as unknown as DataTableBulkAction[];
    render(<Selecting initial={['t1']} bulkActions={malformed} />);
    const named = within(bar())
      .getAllByRole('button')
      .map((button) => button.getAttribute('aria-label') ?? button.textContent);
    expect(named).toEqual(['Clear selection', 'Categorize', 'Export', 'More actions']);
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn).toHaveBeenCalledWith(
      'DataTable: bulkActions[2] is not an action: each needs a string id, a string label and an onAction function. The bar draws nothing for it.',
    );
  });

  it('draws a node bulkActions as 0.6.0 did, beside the icon', () => {
    render(
      <Selecting
        initial={['t1']}
        bulkActions={
          <>
            <Button variant="secondary">Categorize</Button>
            <Button variant="danger">Delete</Button>
          </>
        }
      />,
    );
    const actions = bar().querySelector('.data-table-bar-actions');
    expect(
      within(actions as HTMLElement)
        .getAllByRole('button')
        .map((button) => button.textContent),
    ).toEqual(['Categorize', 'Delete']);
    expect(actions?.querySelector('[data-action-id]')).toBeNull();
    expect(within(bar()).queryByRole('button', { name: 'More actions' })).toBeNull();
    expect(within(bar()).getAllByRole('button')[0]).toHaveAccessibleName('Clear selection');
    // An array of elements is a node too (spec correction 18).
    render(
      <Selecting
        initial={['t1']}
        labels={{ toolbar: 'Array bar' }}
        bulkActions={[<Button key="a">One</Button>, <Button key="b">Two</Button>]}
      />,
    );
    const second = screen.getByRole('toolbar', { name: 'Array bar' });
    expect(within(second).getByRole('button', { name: 'One' })).toBeInTheDocument();
    expect(within(second).queryByRole('button', { name: 'More actions' })).toBeNull();
  });

  it('moves through the bar with the arrows, and clears on Escape', async () => {
    const user = userEvent.setup();
    layOut();
    render(
      <Selecting
        initial={['t1', 't2']}
        bulkActions={actionsWith(vi.fn())}
        selectAllMatching={<Button variant="tertiary">Select all 1,240 matching</Button>}
      />,
    );
    const names = ['Clear selection', 'Select all 1,240 matching', 'Categorize', 'Export', 'More actions'];
    act(() => {
      within(bar()).getByRole('button', { name: 'Clear selection' }).focus();
    });
    for (const name of names.slice(1)) {
      await user.keyboard('{ArrowRight}');
      expect(document.activeElement).toHaveAccessibleName(name);
    }
    await user.keyboard('{ArrowLeft}');
    expect(document.activeElement).toHaveAccessibleName('Export');
    // Enter on More opens its menu; Escape closes it and gives focus back to More, keeping the selection.
    await user.keyboard('{ArrowRight}{Enter}');
    expect(screen.getByRole('menu')).toBeInTheDocument();
    await user.keyboard('{Escape}');
    await waitFor(() => {
      expect(screen.queryByRole('menu')).toBeNull();
    });
    expect(document.activeElement).toHaveAccessibleName('More actions');
    expect(bar()).toBeInTheDocument();
    // Escape in the bar clears, with focus on the table.
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('toolbar')).toBeNull();
    expect(screen.getByRole('grid').contains(document.activeElement)).toBe(true);
  });

  it('puts focus on the table when an action in More empties the selection', async () => {
    const user = userEvent.setup();
    layOut();
    function Emptying(): ReactElement {
      const [keys, setKeys] = useState<Key[]>(['t1', 't2']);
      return (
        <DataTable
          aria-label="Transactions"
          items={FIVE}
          columns={COLUMNS}
          getKey={keyOf}
          selectedKeys={keys}
          onSelectionChange={setKeys}
          bulkActions={[
            {
              id: 'archive',
              label: 'Archive',
              onAction: () => {
                setKeys([]);
              },
            },
          ]}
        />
      );
    }
    const { unmount } = render(<Emptying />);
    await user.click(within(bar()).getByRole('button', { name: 'More actions' }));
    await user.keyboard('{ArrowDown}');
    await user.keyboard('{Enter}');
    expect(screen.queryByRole('toolbar')).toBeNull();
    await waitFor(() => {
      expect(screen.getByRole('grid').contains(document.activeElement)).toBe(true);
    });
    unmount();
    // By pointer too: the item pressed takes focus from the menu, and the table takes it once the menu has gone.
    render(<Emptying />);
    await user.click(within(bar()).getByRole('button', { name: 'More actions' }));
    await user.click(screen.getByRole('menuitem', { name: 'Archive' }));
    expect(screen.queryByRole('toolbar')).toBeNull();
    await waitFor(() => {
      expect(screen.getByRole('grid').contains(document.activeElement)).toBe(true);
    });
  });

  it('puts focus on the table in its passive effect when the grid cannot take it in the layout effect', async () => {
    const user = userEvent.setup();
    function Emptying(): ReactElement {
      const [keys, setKeys] = useState<Key[]>(['t1', 't2']);
      return (
        <DataTable
          aria-label="Transactions"
          items={FIVE}
          columns={COLUMNS}
          getKey={keyOf}
          selectedKeys={keys}
          onSelectionChange={setKeys}
          bulkActions={
            <Button
              onPress={() => {
                setKeys([]);
              }}
            >
              Delete
            </Button>
          }
        />
      );
    }
    render(<Emptying />);
    // The grid refuses its first focus, as a page React Aria's open menu still holds inert does in a browser, and
    // no frame comes: the table's second try is the passive effect of the same commit.
    const grid = screen.getByRole('grid');
    const focusGrid = grid.focus.bind(grid);
    let refused = 0;
    vi.spyOn(grid, 'focus').mockImplementation((options) => {
      if (refused === 0) {
        refused += 1;
        return;
      }
      focusGrid(options);
    });
    holdFrames();
    await user.click(within(bar()).getByRole('button', { name: 'Delete' }));
    expect(screen.queryByRole('toolbar')).toBeNull();
    expect(refused).toBe(1);
    expect(grid.contains(document.activeElement)).toBe(true);
  });

  it('gives focus to the control that takes the place of one that leaves, never the body', async () => {
    const user = userEvent.setup();
    layOut();
    function Matching(): ReactElement {
      const [keys, setKeys] = useState<Key[]>(['t1', 't2']);
      const [all, setAll] = useState(false);
      return (
        <DataTable
          aria-label="Transactions"
          items={FIVE}
          columns={COLUMNS}
          getKey={keyOf}
          selectedKeys={keys}
          onSelectionChange={setKeys}
          bulkActions={actionsWith(vi.fn())}
          selectAllMatching={
            all ? null : (
              <Button
                variant="tertiary"
                onPress={() => {
                  setAll(true);
                }}
              >
                Select all 1,240 matching
              </Button>
            )
          }
        />
      );
    }
    render(<Matching />);
    await user.click(within(bar()).getByRole('button', { name: 'Select all 1,240 matching' }));
    // The app took the button away with focus on it: the next control in the bar has focus.
    await waitFor(() => {
      expect(document.activeElement).toHaveAccessibleName('Categorize');
    });
  });

  it('gives focus to More when the focused promoted button is no longer drawn', () => {
    layOut();
    const observers: ResizeObserverCallback[] = [];
    vi.stubGlobal(
      'ResizeObserver',
      class {
        constructor(callback: ResizeObserverCallback) {
          observers.push(callback);
        }
        observe = (): void => undefined;
        disconnect = (): void => undefined;
        unobserve = (): void => undefined;
      },
    );
    render(<Selecting initial={['t1']} bulkActions={actionsWith(vi.fn())} />);
    const categorize = within(bar()).getByRole('button', { name: 'Categorize' });
    act(() => {
      categorize.focus();
    });
    // The bar narrows under 40rem: its promoted buttons leave, and an engine drops focus to the body.
    narrowBar();
    act(() => {
      categorize.blur();
      for (const observer of observers) observer([], {} as ResizeObserver);
    });
    expect(document.activeElement).toHaveAccessibleName('More actions');
    vi.unstubAllGlobals();
  });

  it('leaves focus on the page when the reader clicked away and then the bar narrows', async () => {
    const user = userEvent.setup();
    layOut();
    const observers: ResizeObserverCallback[] = [];
    vi.stubGlobal(
      'ResizeObserver',
      class {
        constructor(callback: ResizeObserverCallback) {
          observers.push(callback);
        }
        observe = (): void => undefined;
        disconnect = (): void => undefined;
        unobserve = (): void => undefined;
      },
    );
    const narrow = (): void => {
      act(() => {
        for (const observer of observers) observer([], {} as ResizeObserver);
      });
    };
    render(
      <>
        <p>Plain text above the table</p>
        <Selecting initial={['t1']} bulkActions={actionsWith(vi.fn())} />
      </>,
    );
    // A press on Export, then on plain text above the table, which leaves focus on the body.
    await user.click(within(bar()).getByRole('button', { name: 'Export' }));
    await user.click(screen.getByText('Plain text above the table'));
    expect(document.activeElement).toBe(document.body);
    const restore = narrowBar();
    narrow();
    expect(document.activeElement).toBe(document.body);
    restore();
    // By keyboard too, with no press anywhere: focus that left a control still drawn a frame later was moved by the
    // reader, and the bar forgets it.
    act(() => {
      within(bar()).getByRole('button', { name: 'Categorize' }).focus();
    });
    act(() => {
      (document.activeElement as HTMLElement).blur();
    });
    await act(
      () =>
        new Promise<void>((resolve) => {
          requestAnimationFrame(() => {
            resolve();
          });
        }),
    );
    const restoreAgain = narrowBar();
    narrow();
    expect(document.activeElement).toBe(document.body);
    restoreAgain();
    vi.unstubAllGlobals();
  });

  it('leaves focus on the page when the reader clicked away and then the control disables', async () => {
    const user = userEvent.setup();
    layOut();
    const withExport = (isDisabled: boolean): DataTableBulkAction[] =>
      actionsWith(vi.fn()).map((action) => (action.id === 'export' ? { ...action, isDisabled } : action));
    const { rerender } = render(
      <>
        <p>Plain text above the table</p>
        <Selecting initial={['t1']} bulkActions={withExport(false)} />
      </>,
    );
    await user.click(within(bar()).getByRole('button', { name: 'Export' }));
    await user.click(screen.getByText('Plain text above the table'));
    rerender(
      <>
        <p>Plain text above the table</p>
        <Selecting initial={['t1']} bulkActions={withExport(true)} />
      </>,
    );
    expect(within(bar()).getByRole('button', { name: 'Export' })).toBeDisabled();
    expect(document.activeElement).toBe(document.body);
  });

  it('writes its height as --save-bar-offset, the tallest with a save bar, and takes it back when it leaves', () => {
    // Every observer of each element: the bar's offset and its focus mend both watch it.
    const callbacks = new Map<Element, ResizeObserverCallback[]>();
    vi.stubGlobal(
      'ResizeObserver',
      class {
        callback: ResizeObserverCallback;
        constructor(callback: ResizeObserverCallback) {
          this.callback = callback;
        }
        observe = (target: Element): void => {
          callbacks.set(target, [...(callbacks.get(target) ?? []), this.callback]);
        };
        disconnect = (): void => undefined;
        unobserve = (): void => undefined;
      },
    );
    const measure = (element: Element, height: number): void => {
      act(() => {
        for (const callback of callbacks.get(element) ?? []) {
          callback(
            [{ borderBoxSize: [{ blockSize: height, inlineSize: 600 }] } as unknown as ResizeObserverEntry],
            {} as ResizeObserver,
          );
        }
      });
    };
    const root = document.documentElement;
    function Page({ table, save }: { table: boolean; save: boolean }): ReactNode {
      return (
        <>
          {table ? <Selecting initial={['t1']} bulkActions={actionsWith(vi.fn())} /> : null}
          {save ? <SaveBar message="Unsaved" actionLabel="Save" onAction={() => undefined} /> : null}
        </>
      );
    }
    const { rerender } = render(<Page table save={false} />);
    measure(bar(), 58);
    expect(root.style.getPropertyValue('--save-bar-offset')).toBe('calc(58px + var(--spacing-inset))');
    rerender(<Page table save />);
    const saveBar = document.querySelector('.save-bar');
    if (saveBar === null) throw new Error('No save bar');
    measure(saveBar, 100);
    expect(root.style.getPropertyValue('--save-bar-offset')).toBe('calc(100px + var(--spacing-inset))');
    rerender(<Page table save={false} />);
    expect(root.style.getPropertyValue('--save-bar-offset')).toBe('calc(58px + var(--spacing-inset))');
    rerender(<Page table={false} save={false} />);
    expect(root.style.getPropertyValue('--save-bar-offset')).toBe('');
    vi.unstubAllGlobals();
  });

  const AXE_CASES: [string, Props & { initial: Key[] }, 'menu' | undefined][] = [
    [
      'the data bar',
      {
        initial: ['t1', 't2'],
        bulkActions: actionsWith(() => undefined),
        selectAllMatching: <Button variant="tertiary">Select all 1,240 matching</Button>,
      },
      undefined,
    ],
    ['the menu open', { initial: ['t1'], bulkActions: actionsWith(() => undefined) }, 'menu'],
    [
      'the node bar',
      { initial: ['t1'], bulkActions: <Button variant="secondary">Categorize</Button> },
      undefined,
    ],
  ];

  it.each(AXE_CASES)('has no axe violations: %s', async (_state, { initial, ...props }, open) => {
    const user = userEvent.setup();
    layOut();
    const { container } = render(<Selecting initial={initial} {...props} />);
    if (open === 'menu') {
      await user.click(within(bar()).getByRole('button', { name: 'More actions' }));
      expect(screen.getByRole('menu')).toBeInTheDocument();
      await expectNoA11yViolations(document.body);
      return;
    }
    await expectNoA11yViolations(container);
  });
});
