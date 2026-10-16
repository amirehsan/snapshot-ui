'use client';

import { DataTable, IconButton, type DataTableColumn } from '@snapshot-ui/react';
import { Ellipsis } from 'lucide-react';
import { useState, type ReactElement } from 'react';
import { amountLabel, dateLabel, TRANSACTIONS, type Transaction } from './transactions-data';

interface Sort {
  column: string;
  direction: 'ascending' | 'descending';
}

const COLUMNS: readonly DataTableColumn<Transaction>[] = [
  { id: 'date', header: 'Date', cell: (row) => dateLabel(row.date), width: '16%' },
  { id: 'payee', header: 'Payee', cell: (row) => row.payee, isRowHeader: true, width: '22%' },
  {
    id: 'memo',
    header: 'Memo',
    // A memo a reader wants to read without opening the row: two lines, then an ellipsis.
    cell: (row) =>
      `${row.category} from ${row.account.toLowerCase()}, matched to the October statement and the receipt the bank sent`,
    overflow: 'wrap',
  },
  {
    id: 'amount',
    header: 'Amount',
    cell: (row) => amountLabel(row.minor),
    align: 'end',
    width: '20%',
    allowsSorting: true,
    // Largest first on the first press.
    firstSortDirection: 'descending',
  },
  {
    id: 'actions',
    // Named for a screen reader, drawn as nothing.
    header: 'Actions',
    isHeaderHidden: true,
    width: '4rem',
    cell: (row) => (
      <IconButton aria-label={`More for ${row.payee}`}>
        <Ellipsis />
      </IconButton>
    ),
  },
];

export default function DataTableColumnOptions(): ReactElement {
  const [sort, setSort] = useState<Sort | undefined>(undefined);
  const rows = [...TRANSACTIONS.slice(0, 4)].sort((a, b) =>
    sort === undefined ? 0 : sort.direction === 'ascending' ? a.minor - b.minor : b.minor - a.minor,
  );
  return (
    <div style={{ width: '100%' }}>
      <DataTable
        aria-label="Transactions"
        items={rows}
        columns={COLUMNS}
        getKey={(row) => row.id}
        sortDescriptor={sort}
        onSortChange={setSort}
      />
    </div>
  );
}
