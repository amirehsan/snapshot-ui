'use client';

import { Button, toast } from '@snapshot-ui/react';
import { useEffect, useRef, useState, type ReactElement } from 'react';

const ACCOUNTS = ['Checking', 'Savings', 'Credit card'];

export default function ToastAction(): ReactElement {
  const [rows, setRows] = useState(ACCOUNTS);
  // Each row's Remove button, so focus can be put on a row that stays.
  const buttons = useRef(new Map<string, HTMLButtonElement>());
  const restore = useRef<HTMLButtonElement>(null);
  // The row to focus once the render that changes the list is done, or null for the button that restores all.
  const next = useRef<string | null | undefined>(undefined);
  // The toast that offers the last Undo: one at a time, so a newer removal replaces the older offer.
  const offer = useRef<string | null>(null);

  useEffect(() => {
    const name = next.current;
    if (name === undefined) return;
    next.current = undefined;
    (name === null ? restore.current : buttons.current.get(name))?.focus();
  }, [rows]);

  const remove = (name: string): void => {
    const index = rows.indexOf(name);
    const rest = rows.filter((row) => row !== name);
    next.current = rest[index] ?? rest[index - 1] ?? null;
    setRows(rest);
    if (offer.current !== null) toast.dismiss(offer.current);
    const id = toast({
      title: `${name} removed`,
      description: 'Its transactions stay in your reports.',
      tone: 'success',
      // An action keeps the toast until it is used or dismissed.
      action: {
        label: 'Undo',
        onAction: () => {
          next.current = name;
          setRows((current) => ACCOUNTS.filter((row) => row === name || current.includes(row)));
        },
      },
      onClose: () => {
        if (offer.current === id) offer.current = null;
      },
    });
    offer.current = id;
  };

  return (
    <div style={{ width: '100%', maxWidth: '24rem' }}>
      {rows.length > 0 ? (
        <ul
          aria-label="Accounts"
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
                aria-label={`Remove ${row}`}
                ref={(element) => {
                  if (element) buttons.current.set(row, element);
                  else buttons.current.delete(row);
                }}
                onPress={() => {
                  remove(row);
                }}
              >
                Remove
              </Button>
            </li>
          ))}
        </ul>
      ) : (
        <Button
          ref={restore}
          variant="secondary"
          onPress={() => {
            // Everything is back, so the last Undo has nothing left to offer.
            if (offer.current !== null) toast.dismiss(offer.current);
            setRows(ACCOUNTS);
          }}
        >
          Put them back
        </Button>
      )}
    </div>
  );
}
