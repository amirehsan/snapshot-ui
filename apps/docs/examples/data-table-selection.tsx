'use client';

import { Button, DataTable, RouterProvider, type DataTableColumn } from '@snapshot-ui/react';
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
  { id: 'category', header: 'Category', cell: (row) => row.category, hideBelow: 'md' },
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

export default function DataTableSelection(): ReactElement {
  const router = useRouter();
  const [sort, setSort] = useState<Sort>({ column: 'date', direction: 'descending' });
  // Selection lives in the page's state, never the URL, and is cleared whenever the rows change.
  const [selected, setSelected] = useState<(string | number)[]>([]);
  const [current, setCurrent] = useState<string | null>(null);
  return (
    <div style={{ width: '100%' }}>
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
          onSortChange={(next) => {
            setSort(next);
            setSelected([]);
          }}
          selectedKeys={selected}
          onSelectionChange={setSelected}
          bulkActions={
            <>
              <Button variant="secondary">Categorize</Button>
              <Button
                variant="danger"
                onPress={() => {
                  // The app deletes the rows, then clears the selection; the table puts focus back on itself.
                  setSelected([]);
                }}
              >
                Delete
              </Button>
            </>
          }
        />
      </RouterProvider>
    </div>
  );
}
