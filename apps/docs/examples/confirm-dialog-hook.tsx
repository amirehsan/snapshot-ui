'use client';

import { Button, useConfirm } from '@snapshot-ui/react';
import { useEffect, useRef, useState, type ReactElement } from 'react';

const TRANSACTIONS = ['Rent', 'Groceries', 'Insurance'];

export default function ConfirmDialogHook(): ReactElement {
  const [rows, setRows] = useState(TRANSACTIONS);
  const { confirm, dialog } = useConfirm();
  // Each row's Delete button, so focus can be put on a row that stays.
  const buttons = useRef(new Map<string, HTMLButtonElement>());
  const restore = useRef<HTMLButtonElement>(null);
  // Where the removed row was, until the render without it has put focus somewhere.
  const removed = useRef<number | null>(null);

  // A removed row takes the button that asked with it, so focus goes to the row now in its place, or the
  // one before it, or the button that puts the list back.
  useEffect(() => {
    const index = removed.current;
    if (index === null) return;
    removed.current = null;
    const next = rows[index] ?? rows[index - 1];
    (next === undefined ? restore.current : buttons.current.get(next))?.focus();
  }, [rows]);

  const remove = async (name: string): Promise<void> => {
    const isSure = await confirm({
      tone: 'danger',
      title: `Delete ${name}?`,
      description: 'It leaves every report, with its notes. This cannot be undone.',
      confirmLabel: `Delete ${name}`,
    });
    if (!isSure) return;
    removed.current = rows.indexOf(name);
    setRows(rows.filter((row) => row !== name));
  };

  return (
    <div style={{ width: '100%', maxWidth: '24rem' }}>
      {rows.length > 0 ? (
        <ul
          aria-label="Transactions"
          style={{ display: 'grid', gap: 8, margin: 0, padding: 0, listStyle: 'none' }}
        >
          {rows.map((row) => (
            <li
              key={row}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}
            >
              <span>{row}</span>
              <Button
                variant="secondary"
                aria-label={`Delete ${row}`}
                ref={(element) => {
                  if (element) buttons.current.set(row, element);
                  else buttons.current.delete(row);
                }}
                onPress={() => {
                  void remove(row);
                }}
              >
                Delete
              </Button>
            </li>
          ))}
        </ul>
      ) : (
        <Button
          ref={restore}
          variant="secondary"
          onPress={() => {
            setRows(TRANSACTIONS);
          }}
        >
          Put them back
        </Button>
      )}
      {dialog}
    </div>
  );
}
