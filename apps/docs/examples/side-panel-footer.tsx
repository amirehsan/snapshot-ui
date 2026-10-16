'use client';

import {
  Button,
  DataTable,
  RouterProvider,
  SidePanel,
  SidePanelLayout,
  TextArea,
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

export default function SidePanelFooter(): ReactElement {
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
              // With edits unsaved, Escape and a swipe do nothing, and the close button asks first.
              isDismissable={!isDirty}
              onCloseRequest={() => {
                if (!isDirty) return true;
                void confirm({
                  title: 'Discard your changes?',
                  description: 'The memo you typed is not saved.',
                  confirmLabel: 'Discard',
                  tone: 'danger',
                }).then((isSure) => {
                  if (isSure) openRow(null);
                });
                return false;
              }}
              footer={
                <>
                  <Button
                    variant="secondary"
                    onPress={() => {
                      openRow(null);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    isDisabled={!isDirty}
                    onPress={() => {
                      if (open !== null) setNotes({ ...notes, [open]: draft });
                    }}
                  >
                    Save
                  </Button>
                </>
              }
            >
              <TextArea label="Memo" value={draft} onChange={setDraft} isChanged={isDirty} />
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
