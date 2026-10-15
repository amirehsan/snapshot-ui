'use client';

import { DataTable, SegmentedControl, SegmentedControlItem, type DataTableColumn } from '@snapshot-ui/react';
import { useState, type ReactElement } from 'react';
import { amountLabel, dateLabel, TRANSACTIONS, type Transaction } from './transactions-data';

const COLUMNS: readonly DataTableColumn<Transaction>[] = [
  { id: 'date', header: 'Date', cell: (row) => dateLabel(row.date), width: '18%' },
  { id: 'payee', header: 'Payee', cell: (row) => row.payee, isRowHeader: true },
  { id: 'category', header: 'Category', cell: (row) => row.category, hideBelow: 'md' },
  { id: 'account', header: 'Account', cell: (row) => row.account, hideBelow: 'sm' },
  { id: 'amount', header: 'Amount', cell: (row) => amountLabel(row.minor), align: 'end', width: '26%' },
];

/** The widths of the table's box to try: the page's, then under 48rem, then under 40rem. */
const WIDTHS: Record<string, string> = { full: '100%', medium: '44rem', narrow: '38rem' };

export default function DataTableColumns(): ReactElement {
  const [width, setWidth] = useState('full');
  return (
    <div style={{ display: 'grid', gap: 'var(--spacing-peer)', width: '100%' }}>
      <SegmentedControl label="Width of the table's box" value={width} onChange={setWidth}>
        <SegmentedControlItem value="full">Full</SegmentedControlItem>
        <SegmentedControlItem value="medium">44rem</SegmentedControlItem>
        <SegmentedControlItem value="narrow">38rem</SegmentedControlItem>
      </SegmentedControl>
      {/* A narrower box is drawn as a dashed outline, which takes no room, so its width reads as chosen. */}
      <div
        data-testid="data-table-box"
        style={{
          width: `min(${WIDTHS[width] ?? '100%'}, 100%)`,
          outline: width === 'full' ? undefined : '1px dashed var(--color-frame)',
          outlineOffset: 0,
        }}
      >
        <DataTable
          aria-label="Transactions"
          items={TRANSACTIONS.slice(0, 5)}
          columns={COLUMNS}
          getKey={(row) => row.id}
        />
      </div>
      {width === 'full' ? null : (
        <p
          style={{
            margin: 0,
            color: 'var(--color-slate)',
            fontSize: 'var(--text-small)',
            lineHeight: 'var(--text-small--line-height)',
          }}
        >
          {`The table's box: ${WIDTHS[width] ?? ''}`}
        </p>
      )}
    </div>
  );
}
