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
import { useState, useSyncExternalStore, type CSSProperties, type ReactElement } from 'react';
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

/**
 * The last field sits in the panel's bottom corners, so its corner is concentric with the panel's: the panel's
 * radius less its edge and padding, set as the field's --input-radius, which its sign button reads too.
 */
const AT_THE_FOOT = {
  '--input-radius':
    'max(var(--radius-micro), calc(var(--holder-radius) - var(--holder-border) - var(--holder-pad)))',
} as CSSProperties;

const CATEGORIES = ['Groceries', 'Transport', 'Rent', 'Salary', 'Utilities', 'Dining'];

const ROWS = TRANSACTIONS.slice(0, 5);

/**
 * Whether the panel stood beside the page when the example first ran in the browser, read once and kept: a later
 * resize moves an open panel between its faces and never opens or closes one. The server and hydration take wide,
 * so the first row's aside is in the server's HTML.
 */
let wideAtFirst: boolean | undefined;
const isWideAtFirst = (): boolean => (wideAtFirst ??= window.matchMedia('(width >= 1024px)').matches);
const isWideOnServer = (): boolean => true;
const subscribeNothing = (): (() => void) => () => undefined;

export default function SidePanelBasic(): ReactElement {
  // An app reads the open row from its URL, such as ?open=t1, and writes it from the row's link and onClose.
  // The example keeps it in state. Until the reader picks a row it shows the first beside the page; on a phone,
  // where the panel is a sheet that covers the page, it waits for a press.
  const [chosen, setOpen] = useState<string | null | undefined>(undefined);
  const isWide = useSyncExternalStore(subscribeNothing, isWideAtFirst, isWideOnServer);
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
                  <div style={AT_THE_FOOT}>
                    <NumberField
                      label="Amount"
                      money={{ symbol: '$' }}
                      allowsNegative
                      defaultValue={row.minor}
                    />
                  </div>
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
