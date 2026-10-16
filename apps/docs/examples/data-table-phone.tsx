'use client';

import { Button, DataTable, RouterProvider, type DataTableColumn } from '@snapshot-ui/react';
import { useRouter } from 'next/navigation';
import { useState, type ReactElement } from 'react';
import { amountLabel, dateLabel, dayLabel, TRANSACTIONS, type Transaction } from './transactions-data';

const COLUMNS: readonly DataTableColumn<Transaction>[] = [
  { id: 'date', header: 'Date', cell: (row) => dateLabel(row.date), width: '18%' },
  // The row header is an item's first line, its link stretched over the item.
  { id: 'payee', header: 'Payee', cell: (row) => row.payee, isRowHeader: true },
  // The second line, in slate.
  { id: 'category', header: 'Category', cell: (row) => row.category, listSlot: 'meta' },
  // At the item's end, figures as in the table.
  {
    id: 'amount',
    header: 'Amount',
    cell: (row) => amountLabel(row.minor),
    align: 'end',
    width: '26%',
    listSlot: 'end',
  },
];

export default function DataTablePhone(): ReactElement {
  const router = useRouter();
  const [current, setCurrent] = useState<string | null>('t3');
  const [selected, setSelected] = useState<(string | number)[]>([]);
  return (
    // A box narrower than 40rem, as a phone's screen or a table beside an open panel: the list is drawn.
    <div style={{ width: 'min(22rem, 100%)' }}>
      <RouterProvider
        navigate={(href) => {
          setCurrent(href.slice(1));
          router.push(href, { scroll: false });
        }}
      >
        <DataTable
          aria-label="Transactions"
          // Sorted newest first, so each day's rows are adjacent and group under one heading.
          items={TRANSACTIONS.slice(0, 7)}
          columns={COLUMNS}
          getKey={(row) => row.id}
          getRowHref={(row) => `#${row.id}`}
          getGroup={(row) => ({ id: row.date, label: dayLabel(row.date) })}
          currentKey={current}
          selectedKeys={selected}
          onSelectionChange={setSelected}
          bulkActions={<Button variant="secondary">Categorize</Button>}
        />
      </RouterProvider>
    </div>
  );
}
