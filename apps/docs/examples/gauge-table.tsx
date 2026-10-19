'use client';

import { DataTable, Gauge, type DataTableColumn } from '@snapshot-ui/react';
import type { ReactElement } from 'react';

interface CardRow {
  id: string;
  name: string;
  balance: string;
  used: number;
}

const CARDS: CardRow[] = [
  { id: 'visa', name: 'Everyday Visa ending 4821', balance: '$1,150.00', used: 23 },
  { id: 'master', name: 'Travel Mastercard ending 0937', balance: '$2,350.00', used: 47 },
  { id: 'store', name: 'Store card ending 5512', balance: '$40.00', used: 4 },
];

const COLUMNS: readonly DataTableColumn<CardRow>[] = [
  { id: 'name', header: 'Card', cell: (card) => card.name, isRowHeader: true },
  {
    id: 'utilization',
    header: 'Utilization',
    // The column header names the cell, so the gauge takes the row's name and shows only its value text.
    cell: (card) => (
      <Gauge
        aria-label={`Utilization, ${card.name}`}
        size="sm"
        value={card.used}
        valueLabel={card.used > 30 ? `${String(card.used)}%, above 30%` : `${String(card.used)}%`}
        tone={card.used > 30 ? 'warning' : 'neutral'}
        marks={[
          { value: 10, label: 'Best under 10%' },
          { value: 30, label: 'Keep it under 30%' },
        ]}
      />
    ),
    textValue: (card) => `${String(card.used)}%`,
    listSlot: 'meta',
  },
  { id: 'balance', header: 'Balance', cell: (card) => card.balance, align: 'end', listSlot: 'end' },
];

export default function GaugeTable(): ReactElement {
  return (
    <div style={{ width: '100%' }}>
      <DataTable aria-label="Cards" items={CARDS} columns={COLUMNS} getKey={(card) => card.id} />
    </div>
  );
}
