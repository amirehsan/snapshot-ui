'use client';

import { Button, DataTable, EmptyState, SearchField, type DataTableColumn } from '@snapshot-ui/react';
import { SearchX } from 'lucide-react';
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
    width: '26%',
    listSlot: 'end',
  },
];

export default function DataTableFiltered(): ReactElement {
  // A filter that matches nothing yet, so the example opens on what a reader sees then.
  const [query, setQuery] = useState('Gym');
  const needle = query.trim().toLowerCase();
  const rows = TRANSACTIONS.slice(0, 6).filter(
    (row) => needle === '' || `${row.payee} ${row.category}`.toLowerCase().includes(needle),
  );
  return (
    <div style={{ display: 'grid', gap: 'var(--spacing-peer)', width: '100%' }}>
      <SearchField label="Search transactions" value={query} onChange={setQuery} />
      <DataTable
        aria-label="Transactions"
        items={rows}
        columns={COLUMNS}
        getKey={(row) => row.id}
        emptyState={
          // Rows exist and the filters hide them all: say so, and offer the way back.
          <EmptyState
            icon={<SearchX />}
            title="No transactions match"
            description="Try another search, or clear the filters to see every transaction."
            action={
              <Button
                variant="secondary"
                onPress={() => {
                  setQuery('');
                }}
              >
                Clear filters
              </Button>
            }
          />
        }
      />
    </div>
  );
}
