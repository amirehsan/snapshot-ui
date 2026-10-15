'use client';

import {
  Button,
  DataTable,
  EmptyState,
  SegmentedControl,
  SegmentedControlItem,
  type DataTableColumn,
} from '@snapshot-ui/react';
import { Receipt } from 'lucide-react';
import { useState, type ReactElement } from 'react';
import { amountLabel, dateLabel, TRANSACTIONS, type Transaction } from './transactions-data';

const COLUMNS: readonly DataTableColumn<Transaction>[] = [
  { id: 'date', header: 'Date', cell: (row) => dateLabel(row.date), width: '18%' },
  { id: 'payee', header: 'Payee', cell: (row) => row.payee, isRowHeader: true },
  { id: 'category', header: 'Category', cell: (row) => row.category, hideBelow: 'md' },
  { id: 'amount', header: 'Amount', cell: (row) => amountLabel(row.minor), align: 'end', width: '26%' },
];

export default function DataTableStates(): ReactElement {
  const [state, setState] = useState('rows');
  return (
    <div style={{ display: 'grid', gap: 'var(--spacing-peer)', width: '100%' }}>
      <SegmentedControl label="State" value={state} onChange={setState}>
        <SegmentedControlItem value="rows">Rows</SegmentedControlItem>
        <SegmentedControlItem value="empty">Empty</SegmentedControlItem>
        <SegmentedControlItem value="loading">Loading</SegmentedControlItem>
      </SegmentedControl>
      <DataTable
        aria-label="Transactions"
        items={state === 'rows' ? TRANSACTIONS.slice(0, 4) : []}
        columns={COLUMNS}
        getKey={(row) => row.id}
        isLoading={state === 'loading'}
        loadingRowCount={4}
        emptyState={
          <EmptyState
            icon={<Receipt />}
            title="No transactions this month"
            description="Transactions you add or import show here."
            action={<Button variant="secondary">Import transactions</Button>}
          />
        }
      />
    </div>
  );
}
