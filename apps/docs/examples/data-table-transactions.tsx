'use client';

import {
  Button,
  DataTable,
  EmptyState,
  FilterBar,
  FilterChip,
  Heading,
  Pagination,
  PickerOption,
  RouterProvider,
  SidePanel,
  SidePanelLayout,
  type DataTableBulkAction,
  type DataTableColumn,
  type Key,
} from '@snapshot-ui/react';
import { Download, SearchX, Tag, Trash2 } from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useId, useRef, useState, type CSSProperties, type ReactElement } from 'react';
import {
  amountLabel,
  dateLabel,
  dayLabel,
  totalLabel,
  TRANSACTIONS,
  type Transaction,
} from './transactions-data';

/** The rows a page shows: `?size=` holds another of PAGE_SIZES; the first writes no parameter. */
const PAGE_SIZES = [5, 10, 25] as const;
const PAGE_SIZE = PAGE_SIZES[0];

/** The page size the URL asks for, if it is one the page offers. */
function sizeOf(raw: string | null): number {
  const asked = Number(raw ?? PAGE_SIZE);
  return PAGE_SIZES.find((size) => size === asked) ?? PAGE_SIZE;
}

interface Sort {
  column: 'date' | 'amount';
  direction: 'ascending' | 'descending';
}

/** The categories the chip offers, by the id the URL holds. */
const CATEGORIES: Record<string, string> = {
  groceries: 'Groceries',
  transport: 'Transport',
  rent: 'Rent',
  dining: 'Dining',
};

/** `?sort=amount` is ascending and `?sort=amount-` descending; no `sort` is the newest first. */
function sortOf(raw: string | null): Sort {
  const descending = raw === null || raw.endsWith('-');
  const column = raw?.replace(/-$/, '') === 'amount' ? 'amount' : 'date';
  return { column, direction: descending ? 'descending' : 'ascending' };
}

/** What the server does with the URL: filter, sort and cut one page, as a query would. */
function rowsFor(params: URLSearchParams): {
  rows: Transaction[];
  sort: Sort;
  page: number;
  pageCount: number;
  pageSize: number;
  total: number;
} {
  const category = CATEGORIES[params.get('category') ?? ''];
  const sort = sortOf(params.get('sort'));
  const pageSize = sizeOf(params.get('size'));
  const matching = TRANSACTIONS.filter((row) => category === undefined || row.category === category).sort(
    (a, b) => {
      const order = sort.column === 'amount' ? a.minor - b.minor : a.date.localeCompare(b.date);
      return sort.direction === 'ascending' ? order : -order;
    },
  );
  const pageCount = Math.max(1, Math.ceil(matching.length / pageSize));
  const asked = Number(params.get('page') ?? '1');
  const page = Number.isInteger(asked) && asked >= 1 && asked <= pageCount ? asked : 1;
  const rows = matching.slice((page - 1) * pageSize, page * pageSize);
  return { rows, sort, page, pageCount, pageSize, total: matching.length };
}

/** The columns, with the amount's total for the rows shown: one page's, so the totals row says "Page total". */
const columnsFor = (rows: readonly Transaction[]): DataTableColumn<Transaction>[] => [
  { id: 'date', header: 'Date', cell: (row) => dateLabel(row.date), allowsSorting: true, width: '18%' },
  { id: 'payee', header: 'Payee', cell: (row) => row.payee, isRowHeader: true },
  { id: 'category', header: 'Category', cell: (row) => row.category, hideBelow: 'md', listSlot: 'meta' },
  {
    id: 'amount',
    header: 'Amount',
    cell: (row) => amountLabel(row.minor),
    align: 'end',
    allowsSorting: true,
    width: '26%',
    listSlot: 'end',
    total: totalLabel(rows),
  },
];

/** A transaction's fields, as the detail shows them. */
function Detail({ row }: { row: Transaction }): ReactElement {
  const fields: [string, string][] = [
    ['Category', row.category],
    ['Account', row.account],
    ['Amount', amountLabel(row.minor)],
  ];
  return (
    <dl style={{ display: 'grid', gap: 'var(--spacing-part)', margin: 0 }}>
      {fields.map(([term, value]) => (
        <div key={term} style={{ display: 'grid', gap: '0.25rem' }}>
          <dt style={{ color: 'var(--color-slate)', fontSize: 'var(--text-small)' }}>{term}</dt>
          <dd style={{ margin: 0 }}>{value}</dd>
        </div>
      ))}
    </dl>
  );
}

/** The list page, drawn from the URL's parameters: the server's page in an app, a client one here. */
interface TransactionsProps {
  params: URLSearchParams;
  /** Closes the panel, given the URL without `open`. */
  close: (closedHref: string) => void;
}

function Transactions({ params, close }: TransactionsProps): ReactElement {
  const router = useRouter();
  const pathname = usePathname();
  const titleId = useId();
  const { rows, sort, page, pageCount, pageSize, total } = rowsFor(params);
  const openId = params.get('open');
  const open = TRANSACTIONS.find((row) => row.id === openId) ?? null;

  /** The URL with one parameter changed, starting from the ones already there; never a bare `?`. */
  const hrefWith = (changes: Record<string, string | null>): string => {
    const next = new URLSearchParams(params);
    for (const [name, value] of Object.entries(changes)) {
      if (value === null) next.delete(name);
      else next.set(name, value);
    }
    const query = next.toString();
    return query ? `${pathname}?${query}` : pathname;
  };
  const replace = (changes: Record<string, string | null>): void => {
    router.replace(hrefWith(changes), { scroll: false });
  };

  // Selection is the page's own state, never the URL's. A new page, sort or filter shows other rows: the selection
  // was made on the rows before, so it clears, as the reader moves on.
  const shown = rows.map((row) => row.id).join(' ');
  const [selected, setSelected] = useState<Key[]>([]);
  const [selectedOn, setSelectedOn] = useState(shown);
  if (selectedOn !== shown) {
    setSelectedOn(shown);
    setSelected([]);
  }

  const first = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const last = Math.min(page * pageSize, total);
  const category = params.get('category');
  const clearFilters = (): void => {
    replace({ category: null, page: null });
  };
  // The bar's actions as data: Export and Categorize as buttons while the bar has room, Delete in More. An app
  // sends the selected keys to its server; here each one clears the selection, as the work is done.
  const done = (): void => {
    setSelected([]);
  };
  const bulkActions: DataTableBulkAction[] = [
    { id: 'export', label: 'Export', icon: <Download />, isPromoted: true, onAction: done },
    { id: 'categorize', label: 'Categorize', icon: <Tag />, isPromoted: true, onAction: done },
    { id: 'delete', label: 'Delete', icon: <Trash2 />, onAction: done },
  ];

  return (
    <SidePanelLayout
      panel={
        // Keyed by the open row, so another row is a new opening and focus moves to its heading.
        <SidePanel
          key={openId ?? 'none'}
          title={open?.payee ?? ''}
          description={open === null ? undefined : dayLabel(open.date)}
          isOpen={open !== null}
          onClose={() => {
            close(hrefWith({ open: null }));
          }}
        >
          {open === null ? null : <Detail row={open} />}
        </SidePanel>
      }
    >
      <div style={{ display: 'grid', gap: 'var(--spacing-peer)' }}>
        <Heading level={3} id={titleId}>
          Transactions
        </Heading>
        <FilterBar
          labels={{ done: total === 1 ? 'Show 1 result' : `Show ${String(total)} results` }}
          onClearAll={clearFilters}
        >
          <FilterChip
            label="Category"
            selectionMode="single"
            value={category !== null && category in CATEGORIES ? category : null}
            onChange={(next) => {
              replace({ category: next === null ? null : String(next), page: null });
            }}
          >
            {Object.entries(CATEGORIES).map(([id, name]) => (
              <PickerOption key={id} id={id}>
                {name}
              </PickerOption>
            ))}
          </FilterChip>
        </FilterBar>
        <DataTable
          aria-labelledby={titleId}
          // Its columns that stay under 48rem, the date, the payee and the amount, fit in 32rem, so the table
          // keeps its face beside the open panel.
          listBelow="32rem"
          items={rows}
          columns={columnsFor(rows)}
          getKey={(row) => row.id}
          getRowHref={(row) => hrefWith({ open: row.id })}
          currentKey={openId}
          sortDescriptor={sort}
          onSortChange={(next) => {
            const column = next.column === 'amount' ? 'amount' : 'date';
            const written = `${column}${next.direction === 'descending' ? '-' : ''}`;
            // The newest first is the page's default, so it writes no parameter; a new sort starts at page 1.
            replace({ sort: written === 'date-' ? null : written, page: null });
          }}
          // Sorted by date, each day's rows are next to each other, so the list groups them under the day.
          getGroup={
            sort.column === 'date' ? (row) => ({ id: row.date, label: dayLabel(row.date) }) : undefined
          }
          selectedKeys={selected}
          onSelectionChange={setSelected}
          bulkActions={bulkActions}
          labels={{ total: 'Page total' }}
          emptyState={
            <EmptyState
              icon={<SearchX />}
              title="No transactions match"
              description="Clear the filters to see every transaction."
              action={
                <Button variant="secondary" onPress={clearFilters}>
                  Clear filters
                </Button>
              }
            />
          }
        />
        <Pagination
          page={page}
          pageCount={pageCount}
          rangeLabel={`${String(first)} to ${String(last)} of ${String(total)}`}
          getPageHref={(n) => hrefWith({ page: n === 1 ? null : String(n) })}
          pageSize={pageSize}
          pageSizeOptions={PAGE_SIZES}
          // A new size keeps the first row in view on the page Pagination works out, and is replaced in history,
          // as a sort is; the first size and the first page write no parameter.
          onPageSizeChange={(size, nextPage) => {
            replace({
              size: size === PAGE_SIZE ? null : String(size),
              page: nextPage === 1 ? null : String(nextPage),
            });
          }}
          labels={{ navigation: 'Transactions pages' }}
        />
      </div>
    </SidePanelLayout>
  );
}

function TransactionsFromUrl({ close }: Pick<TransactionsProps, 'close'>): ReactElement {
  const params = useSearchParams();
  return <Transactions params={new URLSearchParams(params)} close={close} />;
}

/** The first state: no parameters, as the static page's server renders it. */
const FIRST = new URLSearchParams();

/** The page's URL as the browser shows it, in the form `hrefWith` writes. */
const here = (): string => `${window.location.pathname}${window.location.search}`;

export default function DataTableTransactions(): ReactElement {
  const router = useRouter();
  // The entry this page pushed as it opened a row, so closing goes back to the list's entry rather than leave a
  // copy of it behind for Back. A row that arrived with the page, from a link or a reload, closes in place.
  const opened = useRef<string | null>(null);
  const close = (closedHref: string): void => {
    if (opened.current === here()) {
      opened.current = null;
      router.back();
    } else {
      router.replace(closedHref, { scroll: false });
    }
  };
  return (
    // Your header's height on an ancestor, once, so the table's header, the list's day headings and the panel
    // stick under it. Here a 4rem header sits under this site's own, so the offset is both.
    <div style={{ width: '100%', '--site-header': 'var(--page-sticky-top, 0px)' } as CSSProperties}>
      <div style={{ '--page-sticky-top': 'calc(var(--site-header) + 4rem)' } as CSSProperties}>
        <div
          style={{
            position: 'sticky',
            top: 'var(--site-header)',
            zIndex: 'var(--z-header)',
            display: 'flex',
            alignItems: 'center',
            blockSize: '4rem',
            marginBlockEnd: 'var(--spacing-inset)',
            borderBlockEnd: '1px solid var(--color-divider)',
            backgroundColor: 'var(--color-canvas)',
            color: 'var(--color-slate)',
            fontSize: 'var(--text-small)',
          }}
        >
          Your app&apos;s header, 4rem tall
        </div>
        {/* An app wraps its whole tree once; the example wraps only itself. */}
        <RouterProvider
          navigate={(href) => {
            const before = new URLSearchParams(window.location.search).get('open');
            const after = new URL(href, window.location.href).searchParams.get('open');
            if (before !== null && after !== null && after !== before) {
              // Another row while one is open takes the open row's entry, so Back and Close return to the list.
              if (opened.current === here()) opened.current = href;
              router.replace(href, { scroll: false });
              return;
            }
            if (before === null && after !== null) opened.current = href;
            router.push(href, { scroll: false });
          }}
        >
          {/* The page is static, so the server renders the fallback: the same page in its first state. */}
          <Suspense fallback={<Transactions params={FIRST} close={close} />}>
            <TransactionsFromUrl close={close} />
          </Suspense>
        </RouterProvider>
      </div>
    </div>
  );
}
