'use client';

import {
  Button,
  DataTable,
  RouterProvider,
  type DataTableBulkAction,
  type DataTableColumn,
  type Key,
} from '@snapshot-ui/react';
import { Archive, Download, Tag, Trash2 } from 'lucide-react';
import { useState, type ReactElement } from 'react';
import { amountLabel, dateLabel, TRANSACTIONS, type Transaction } from './transactions-data';

const COLUMNS: readonly DataTableColumn<Transaction>[] = [
  { id: 'date', header: 'Date', cell: (row) => dateLabel(row.date), width: '18%' },
  { id: 'payee', header: 'Payee', cell: (row) => row.payee, isRowHeader: true },
  { id: 'category', header: 'Category', cell: (row) => row.category, hideBelow: 'md', listSlot: 'meta' },
  {
    id: 'amount',
    header: 'Amount',
    cell: (row) => amountLabel(row.minor),
    align: 'end',
    listSlot: 'end',
    width: '26%',
  },
];

/** What the search matched on the server: more than the page shows. */
const MATCHING = 24;

/** "1 transaction" or "3 transactions", written by the app. */
const transactions = (count: number): string =>
  count === 1 ? '1 transaction' : `${String(count)} transactions`;

export default function DataTableBulkActions(): ReactElement {
  const rows = TRANSACTIONS.slice(0, 6);
  const [selected, setSelected] = useState<Key[]>(['t2', 't4']);
  // "Select all 24 matching" is the app's: the table selects only the rows it draws.
  const [allMatching, setAllMatching] = useState(false);
  const [done, setDone] = useState('');
  const select = (keys: Key[]): void => {
    setSelected(keys);
    setAllMatching(false);
  };
  /** Each action reports what it did; a real app sends the keys, or the search when every match is chosen. */
  const run =
    (verb: string) =>
    (keys: Key[]): void => {
      setDone(`${verb} ${transactions(allMatching ? MATCHING : keys.length)}`);
    };
  const actions: DataTableBulkAction[] = [
    { id: 'categorize', label: 'Categorize', icon: <Tag />, isPromoted: true, onAction: run('Categorized') },
    { id: 'export', label: 'Export', icon: <Download />, isPromoted: true, onAction: run('Exported') },
    { id: 'archive', label: 'Archive', icon: <Archive />, onAction: run('Archived') },
    {
      id: 'delete',
      label: 'Delete',
      icon: <Trash2 />,
      onAction: (keys) => {
        run('Deleted')(keys);
        // The app deletes the rows, then clears the selection; the table puts focus back on itself.
        select([]);
      },
    },
  ];
  return (
    <div style={{ display: 'grid', gap: 'var(--spacing-part)', width: '100%' }}>
      <RouterProvider navigate={() => undefined}>
        <DataTable
          aria-label="Transactions"
          items={rows}
          columns={COLUMNS}
          getKey={(row) => row.id}
          selectedKeys={selected}
          onSelectionChange={select}
          bulkActions={actions}
          selectAllMatching={
            selected.length === rows.length && !allMatching ? (
              <Button
                variant="tertiary"
                onPress={() => {
                  setAllMatching(true);
                }}
              >
                {`Select all ${String(MATCHING)} matching`}
              </Button>
            ) : allMatching ? (
              <span>{`All ${String(MATCHING)} matching are selected`}</span>
            ) : null
          }
        />
      </RouterProvider>
      <p role="status" style={{ margin: 0, color: 'var(--color-slate)', fontSize: 'var(--text-small)' }}>
        {done}
      </p>
    </div>
  );
}
