'use client';

import {
  DataTable,
  NumberField,
  PickerOption,
  RouterProvider,
  Select,
  SidePanel,
  SidePanelLayout,
  TextField,
  type DataTableColumn,
} from '@snapshot-ui/react';
import { useState, useSyncExternalStore, type ReactElement } from 'react';
import { amountLabel, dayLabel, TRANSACTIONS, type Transaction } from './transactions-data';

const COLUMNS: readonly DataTableColumn<Transaction>[] = [
  { id: 'payee', header: 'Payee', cell: (row) => row.payee, isRowHeader: true },
  { id: 'category', header: 'Category', cell: (row) => row.category, listSlot: 'meta' },
  {
    id: 'amount',
    header: 'Amount',
    cell: (row) => amountLabel(row.minor),
    align: 'end',
    width: '30%',
    listSlot: 'end',
  },
];

const CATEGORIES = ['Groceries', 'Transport', 'Rent', 'Salary', 'Utilities', 'Dining'];

const ROWS = TRANSACTIONS.slice(0, 5);

/** Whether the panel stands beside the page, read after hydration; the server and hydration take wide. */
const subscribe = (onChange: () => void): (() => void) => {
  const wide = window.matchMedia('(width >= 1024px)');
  wide.addEventListener('change', onChange);
  return () => {
    wide.removeEventListener('change', onChange);
  };
};
const isWideNow = (): boolean => window.matchMedia('(width >= 1024px)').matches;
const isWideOnServer = (): boolean => true;

export default function SidePanelBasic(): ReactElement {
  // An app reads the open row from its URL, such as ?open=t1, and writes it from the row's link and onClose.
  // The example keeps it in state. Until the reader picks a row it shows the first beside the page; under 1024px,
  // where the panel is a sheet that covers the page, it waits for a press.
  const [chosen, setOpen] = useState<string | null | undefined>(undefined);
  const isWide = useSyncExternalStore(subscribe, isWideNow, isWideOnServer);
  const open = chosen === undefined ? (isWide ? 't1' : null) : chosen;
  const row = ROWS.find((each) => each.id === open);
  return (
    <div style={{ width: '100%' }}>
      {/* An app wraps its whole tree once; the example wraps only itself. */}
      <RouterProvider
        navigate={(href) => {
          setOpen(href.slice(1));
        }}
      >
        <SidePanelLayout
          panel={
            // Keyed by the open row, so another row is a new opening and focus moves to its heading.
            <SidePanel
              key={open ?? 'none'}
              title={row?.payee ?? ''}
              description={row === undefined ? undefined : dayLabel(row.date)}
              isOpen={row !== undefined}
              onClose={() => {
                setOpen(null);
              }}
            >
              {row === undefined ? null : (
                <div style={{ display: 'grid', gap: 'var(--spacing-peer)' }}>
                  <TextField label="Payee" defaultValue={row.payee} />
                  <Select label="Category" defaultValue={row.category}>
                    {CATEGORIES.map((name) => (
                      <PickerOption key={name} id={name}>
                        {name}
                      </PickerOption>
                    ))}
                  </Select>
                  <NumberField
                    label="Amount"
                    money={{ symbol: '$' }}
                    allowsNegative
                    defaultValue={row.minor}
                  />
                </div>
              )}
            </SidePanel>
          }
        >
          <DataTable
            aria-label="Transactions"
            items={ROWS}
            columns={COLUMNS}
            getKey={(each) => each.id}
            getRowHref={(each) => `#${each.id}`}
            currentKey={open}
          />
        </SidePanelLayout>
      </RouterProvider>
    </div>
  );
}
