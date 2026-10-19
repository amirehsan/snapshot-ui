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

/**
 * The two thresholds, drawn on every row. Their words would be read again on each row, so the marks carry none
 * and the note above the table says them once.
 */
const MARKS = [
  { value: 10, label: '' },
  { value: 30, label: '' },
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
        marks={MARKS}
      />
    ),
    textValue: (card) => `${String(card.used)}%`,
    listSlot: 'meta',
  },
  { id: 'balance', header: 'Balance', cell: (card) => card.balance, align: 'end', listSlot: 'end' },
];

export default function GaugeTable(): ReactElement {
  return (
    <div className="stack" style={{ width: '100%', gap: 'var(--spacing-part)' }}>
      <p className="copy copy-small" style={{ margin: 0 }}>
        Utilization marks: best under 10%, and keep it under 30%.
      </p>
      <DataTable aria-label="Cards" items={CARDS} columns={COLUMNS} getKey={(card) => card.id} />
    </div>
  );
}
