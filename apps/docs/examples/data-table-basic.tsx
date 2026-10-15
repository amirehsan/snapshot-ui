'use client';

import { DataTable, RouterProvider, type DataTableColumn } from '@snapshot-ui/react';
import { useRouter } from 'next/navigation';
import { useState, type ReactElement } from 'react';
import { amountLabel, dateLabel, TRANSACTIONS, type Transaction } from './transactions-data';

interface Sort {
  column: string;
  direction: 'ascending' | 'descending';
}

const COLUMNS: readonly DataTableColumn<Transaction>[] = [
  { id: 'date', header: 'Date', cell: (row) => dateLabel(row.date), allowsSorting: true, width: '18%' },
  { id: 'payee', header: 'Payee', cell: (row) => row.payee, isRowHeader: true },
  { id: 'category', header: 'Category', cell: (row) => row.category },
  {
    id: 'amount',
    header: 'Amount',
    cell: (row) => amountLabel(row.minor),
    align: 'end',
    allowsSorting: true,
    width: '26%',
  },
];

/** Sorts a copy of the rows as the app's server would, by the URL's sort. */
function sorted(rows: readonly Transaction[], sort: Sort): Transaction[] {
  return [...rows].sort((a, b) => {
    const order = sort.column === 'amount' ? a.minor - b.minor : a.date.localeCompare(b.date);
    return sort.direction === 'ascending' ? order : -order;
  });
}

export default function DataTableBasic(): ReactElement {
  const router = useRouter();
  // An app keeps the sort and the open row in its URL; the example keeps them in state.
  const [sort, setSort] = useState<Sort>({ column: 'date', direction: 'descending' });
  const [current, setCurrent] = useState<string | null>('t2');
  return (
    <div style={{ width: '100%' }}>
      {/* An app wraps its whole tree once; the example wraps only itself. */}
      <RouterProvider
        navigate={(href) => {
          setCurrent(href.slice(1));
          router.push(href, { scroll: false });
        }}
      >
        <DataTable
          aria-label="Transactions"
          items={sorted(TRANSACTIONS.slice(0, 6), sort)}
          columns={COLUMNS}
          getKey={(row) => row.id}
          getRowHref={(row) => `#${row.id}`}
          currentKey={current}
          sortDescriptor={sort}
          onSortChange={setSort}
        />
      </RouterProvider>
    </div>
  );
}
