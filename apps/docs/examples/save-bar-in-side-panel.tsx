'use client';

import {
  DataTable,
  RouterProvider,
  SaveBar,
  SidePanel,
  SidePanelLayout,
  TextArea,
  TextField,
  useConfirm,
  type DataTableColumn,
} from '@snapshot-ui/react';
import { useState, type ReactElement } from 'react';
import { amountLabel, dayLabel, TRANSACTIONS, type Transaction } from './transactions-data';

const COLUMNS: readonly DataTableColumn<Transaction>[] = [
  { id: 'payee', header: 'Payee', cell: (row) => row.payee, isRowHeader: true },
  {
    id: 'amount',
    header: 'Amount',
    cell: (row) => amountLabel(row.minor),
    align: 'end',
    width: '30%',
    listSlot: 'end',
  },
];

const ROWS = TRANSACTIONS.slice(0, 4);

export default function SaveBarInSidePanel(): ReactElement {
  const [open, setOpen] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});
  // The memo as typed, until Save keeps it: the panel holds unsaved edits while it differs.
  const [draft, setDraft] = useState('');
  const { confirm, dialog } = useConfirm();
  const row = ROWS.find((each) => each.id === open);
  const saved = open === null ? '' : (notes[open] ?? '');
  const isDirty = draft !== saved;

  const openRow = (id: string | null): void => {
    setOpen(id);
    setDraft(id === null ? '' : (notes[id] ?? ''));
  };

  return (
    <div style={{ width: '100%' }}>
      <RouterProvider
        navigate={(href) => {
          openRow(href.slice(1));
        }}
      >
        <SidePanelLayout
          panel={
            <SidePanel
              key={open ?? 'none'}
              title={row?.payee ?? ''}
              description={row === undefined ? undefined : dayLabel(row.date)}
              isOpen={row !== undefined}
              onClose={() => {
                openRow(null);
              }}
              // The bar guards its own Cancel; the panel's close button and Escape ask the same question while
              // edits are unsaved, and a swipe or a press outside the sheet does nothing.
              isDismissable={!isDirty}
              onCloseRequest={() => {
                if (!isDirty) return true;
                void confirm({
                  title: 'Discard changes?',
                  description: 'The changes you made here will be lost.',
                  confirmLabel: 'Discard changes',
                  cancelLabel: 'Keep editing',
                  tone: 'danger',
                }).then((isSure) => {
                  if (isSure) openRow(null);
                });
                return false;
              }}
            >
              {row === undefined ? null : (
                // The body scrolls, so the bar sticks to its bottom, the last child of the form in it.
                <form
                  style={{ display: 'grid', gap: 'var(--spacing-peer)' }}
                  onSubmit={(event) => {
                    event.preventDefault();
                  }}
                >
                  <TextField label="Payee" value={row.payee} isReadOnly />
                  <TextArea label="Memo" value={draft} onChange={setDraft} isChanged={isDirty} />
                  <SaveBar
                    message={isDirty ? `1 change to ${row.payee}` : row.payee}
                    isDirty={isDirty}
                    actionLabel="Save"
                    onAction={() => {
                      if (open !== null) setNotes({ ...notes, [open]: draft });
                    }}
                    onCancel={() => {
                      openRow(null);
                    }}
                  />
                </form>
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
      {dialog}
    </div>
  );
}
