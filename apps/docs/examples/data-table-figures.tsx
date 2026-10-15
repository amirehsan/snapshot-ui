'use client';

import { Card, CardBody, CardHeader, CardTitle, DataTable, type DataTableColumn } from '@snapshot-ui/react';
import type { CSSProperties, ReactElement } from 'react';
import { amountLabel, dateLabel, totalLabel, TRANSACTIONS, type Transaction } from './transactions-data';

const ROWS = TRANSACTIONS.slice(0, 5);

const COLUMNS: readonly DataTableColumn<Transaction>[] = [
  { id: 'date', header: 'Date', cell: (row) => dateLabel(row.date), width: '18%' },
  { id: 'payee', header: 'Payee', cell: (row) => row.payee, isRowHeader: true },
  {
    id: 'amount',
    header: 'Amount',
    cell: (row) => amountLabel(row.minor),
    align: 'end',
    width: '30%',
    total: totalLabel(ROWS),
  },
];

export default function DataTableFigures(): ReactElement {
  return (
    <Card as="section" aria-labelledby="data-table-figures-title" style={{ width: '100%' }}>
      <CardHeader>
        <CardTitle id="data-table-figures-title" level={3}>
          This week
        </CardTitle>
      </CardHeader>
      <CardBody>
        {/* In a card the sticky header takes the card's fill. */}
        <div style={{ '--data-table-surface': 'var(--color-lifted)' } as CSSProperties}>
          <DataTable
            aria-labelledby="data-table-figures-title"
            items={ROWS}
            columns={COLUMNS}
            getKey={(row) => row.id}
          />
        </div>
      </CardBody>
    </Card>
  );
}
