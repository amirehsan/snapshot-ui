'use client';

import { SaveBar, TextArea, TextField, toast } from '@snapshot-ui/react';
import { useState, type ReactElement } from 'react';

interface Receipt {
  merchant: string;
  date: string;
  amount: string;
  category: string;
  memo: string;
}

const SAVED: Receipt = {
  merchant: 'Corner Mart',
  date: '14 Oct 2026',
  amount: '$42.18',
  category: 'Food',
  memo: 'Milk and bread',
};

const LABELS: Record<keyof Receipt, string> = {
  merchant: 'Merchant',
  date: 'Date',
  amount: 'Amount',
  category: 'Category',
  memo: 'Memo',
};

export default function SaveBarForm(): ReactElement {
  // What the server holds, and the reader's copy: the bar is dirty while they differ.
  const [saved, setSaved] = useState(SAVED);
  const [draft, setDraft] = useState(SAVED);
  const [problem, setProblem] = useState('');
  const changed = (Object.keys(SAVED) as (keyof Receipt)[]).filter((key) => draft[key] !== saved[key]);
  const count = changed.length;
  const message =
    count === 0
      ? `${saved.merchant}, ${saved.date}`
      : `${String(count)} ${count === 1 ? 'change' : 'changes'} to ${saved.merchant}, ${saved.date}`;

  const field = (key: keyof Receipt): ReactElement => {
    const props = {
      label: LABELS[key],
      value: draft[key],
      isChanged: draft[key] !== saved[key],
      onChange: (value: string) => {
        setDraft((current) => ({ ...current, [key]: value }));
      },
    };
    return key === 'memo' ? <TextArea key={key} {...props} /> : <TextField key={key} {...props} />;
  };

  return (
    // The form is the bar's holder, and the bar its last child: it sticks while the form is in view.
    <form
      style={{ display: 'grid', gap: 'var(--spacing-peer)', width: '100%' }}
      onSubmit={(event) => {
        event.preventDefault();
      }}
    >
      {(Object.keys(SAVED) as (keyof Receipt)[]).map(field)}
      <SaveBar
        message={message}
        isDirty={count > 0}
        actionLabel="Save"
        // A save that cannot go answers the press with a status; a save that worked is a toast.
        onAction={async () => {
          if (draft.merchant.trim() === '') {
            setProblem('Enter the merchant.');
            return;
          }
          setProblem('');
          // Your request goes here; the example waits a moment instead.
          await new Promise((resolve) => setTimeout(resolve, 1000));
          setSaved(draft);
          toast({ title: 'Receipt saved', tone: 'success' });
        }}
        onCancel={() => {
          setDraft(saved);
          setProblem('');
        }}
        status={problem}
        statusTone="error"
      />
    </form>
  );
}
