'use client';

import { DataTable, SegmentedControl, SegmentedControlItem, type DataTableColumn } from '@snapshot-ui/react';
import { useState, type CSSProperties, type ReactElement } from 'react';
import { amountLabel, dateLabel, TRANSACTIONS, type Transaction } from './transactions-data';

const COLUMNS: readonly DataTableColumn<Transaction>[] = [
  { id: 'date', header: 'Date', cell: (row) => dateLabel(row.date), width: '18%' },
  { id: 'payee', header: 'Payee', cell: (row) => row.payee, isRowHeader: true },
  { id: 'category', header: 'Category', cell: (row) => row.category, hideBelow: 'md', listSlot: 'meta' },
  { id: 'account', header: 'Account', cell: (row) => row.account },
  {
    id: 'amount',
    header: 'Amount',
    cell: (row) => amountLabel(row.minor),
    align: 'end',
    width: '26%',
    listSlot: 'end',
  },
];

/** The widths of the table's box to try: over 48rem, under 48rem, then under 40rem, where it becomes its list. */
const WIDTHS: Record<string, string> = { wide: '56rem', medium: '44rem', narrow: '38rem' };

export default function DataTableColumns(): ReactElement {
  const [width, setWidth] = useState('wide');
  const box = WIDTHS[width] ?? '56rem';
  return (
    <div style={{ display: 'grid', gap: 'var(--spacing-peer)', width: '100%', minWidth: 0 }}>
      <SegmentedControl label="Width of the table's box" value={width} onChange={setWidth}>
        <SegmentedControlItem value="wide">56rem</SegmentedControlItem>
        <SegmentedControlItem value="medium">44rem</SegmentedControlItem>
        <SegmentedControlItem value="narrow">38rem</SegmentedControlItem>
      </SegmentedControl>
      {/* The table at the width chosen, in a frame that scrolls sideways on its own where the page is narrower,
          so the page never does. The frame is a tab stop, so a keyboard scrolls it too. A frame that scrolls is
          where the table's header sticks, and the page's header is not in it, so it sets the offset to 0. */}
      <div
        role="region"
        aria-label="The table at the width chosen"
        // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- a frame that scrolls must take focus to scroll by keyboard
        tabIndex={0}
        style={{ overflowX: 'auto', maxWidth: '100%', '--page-sticky-top': '0px' } as CSSProperties}
      >
        {/* A narrower box is drawn as a dashed outline inside its edge, so its width reads as chosen. */}
        <div
          data-testid="data-table-box"
          style={{
            width: box,
            outline: width === 'wide' ? undefined : '1px dashed var(--color-frame)',
            outlineOffset: -1,
          }}
        >
          <DataTable
            aria-label="Transactions"
            items={TRANSACTIONS.slice(0, 5)}
            columns={COLUMNS}
            getKey={(row) => row.id}
          />
        </div>
      </div>
      {width === 'wide' ? null : (
        <p
          style={{
            margin: 0,
            color: 'var(--color-slate)',
            fontSize: 'var(--text-small)',
            lineHeight: 'var(--text-small--line-height)',
          }}
        >
          {`The table's box: ${box}`}
        </p>
      )}
    </div>
  );
}
