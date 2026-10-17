'use client';

import { DatePicker, NumberField, PickerOption, SaveBar, Select, TextField } from '@snapshot-ui/react';
import { useState, type CSSProperties, type ReactElement } from 'react';

interface Receipt {
  id: string;
  merchant: string;
  /** An ISO date, or null once the reader has erased it. */
  date: string | null;
  /** In cents. */
  amount: number;
  memo: string;
  category: string;
}

/** What the server holds: the reader edits a copy, and each field compares its value with this one. */
const [CORNER_MART, CITY_TRANSIT, GREEN_GROCER]: readonly [Receipt, Receipt, Receipt] = [
  {
    id: 'r1',
    merchant: 'Corner Mart',
    date: '2026-10-14',
    amount: 4218,
    memo: 'Milk and bread',
    category: 'food',
  },
  {
    id: 'r2',
    merchant: 'City Transit',
    date: '2026-10-13',
    amount: 275,
    memo: 'Bus fare',
    category: 'transport',
  },
  { id: 'r3', merchant: 'Green Grocer', date: '2026-10-12', amount: 1890, memo: 'Apples', category: 'food' },
];

/** Each saved receipt beside the reader's edits so far: a date and a memo, an amount and a category, and one
    amount cleared. */
const REVIEW: readonly { saved: Receipt; edited: Receipt }[] = [
  { saved: CORNER_MART, edited: { ...CORNER_MART, date: '2026-10-15', memo: 'Milk, bread and eggs' } },
  { saved: CITY_TRANSIT, edited: { ...CITY_TRANSIT, amount: 550, category: 'home' } },
  { saved: GREEN_GROCER, edited: { ...GREEN_GROCER, amount: 0 } },
];

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** The app's own words for a day, "15 Oct 2026", for the server's HTML: twelve month names, no Intl. */
const dayLabel = (iso: string): string => {
  const [year, month, day] = iso.split('-').map(Number);
  return `${String(day)} ${MONTHS[(month ?? 1) - 1] ?? ''} ${String(year)}`;
};

const COLUMNS = ['Merchant', 'Date', 'Amount', 'Memo', 'Category'];
const head: CSSProperties = { textAlign: 'start', fontWeight: 500, paddingBlockEnd: 4 };

export default function DatePickerReviewGrid(): ReactElement {
  const [rows, setRows] = useState(REVIEW);
  const change = (id: string, patch: Partial<Receipt>): void => {
    setRows((current) =>
      current.map((each) =>
        each.edited.id === id ? { ...each, edited: { ...each.edited, ...patch } } : each,
      ),
    );
  };
  // How many fields differ from the server's, and how many invalid: the save bar's sentence and its status.
  const fields = ['date', 'amount', 'memo', 'category'] as const;
  const changes = rows.reduce(
    (sum, { saved, edited }) => sum + fields.filter((key) => edited[key] !== saved[key]).length,
    0,
  );
  const invalid = rows.filter(({ edited }) => edited.amount <= 0).length;
  const [left, setLeft] = useState(2);
  const [problem, setProblem] = useState('');
  return (
    // The holder of the grid and its save bar, whose last child the bar is; never wider than the stage, so the
    // grid scrolls inside it.
    <div style={{ width: '100%', minWidth: 0 }}>
      {/* The grid scrolls sideways inside its own box on a narrow screen; the page never does. */}
      <div style={{ width: '100%', overflowX: 'auto' }}>
        <table style={{ borderCollapse: 'separate', borderSpacing: '8px 12px', marginInline: -8 }}>
          <thead>
            <tr>
              {COLUMNS.map((name) => (
                <th key={name} id={`receipt-${name.toLowerCase()}`} scope="col" style={head}>
                  {name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map(({ saved, edited: row }) => {
              // Each field is named by its column's header and its row's merchant: "Date Corner Mart".
              const named = (column: string): string => `receipt-${column} ${row.id}`;
              return (
                <tr key={row.id}>
                  <th id={row.id} scope="row" style={{ ...head, fontWeight: 450, whiteSpace: 'nowrap' }}>
                    {row.merchant}
                  </th>
                  <td style={{ minWidth: '12rem' }}>
                    <DatePicker
                      aria-labelledby={named('date')}
                      value={row.date}
                      valueLabel={row.date === null ? undefined : dayLabel(row.date)}
                      today="2026-10-16"
                      isChanged={row.date !== saved.date}
                      // A year being typed is held back, so null means the reader erased the day.
                      isInvalid={row.date === null}
                      errorMessage="Enter the date on the receipt."
                      onChange={(date) => {
                        change(row.id, { date });
                      }}
                    />
                  </td>
                  <td style={{ minWidth: '9rem' }}>
                    <NumberField
                      aria-labelledby={named('amount')}
                      money={{ symbol: '$' }}
                      value={row.amount}
                      isChanged={row.amount !== saved.amount}
                      isInvalid={row.amount <= 0}
                      errorMessage="Enter the amount paid."
                      onChange={(amount) => {
                        change(row.id, { amount: amount ?? 0 });
                      }}
                    />
                  </td>
                  <td style={{ minWidth: '12rem' }}>
                    <TextField
                      aria-labelledby={named('memo')}
                      value={row.memo}
                      isChanged={row.memo !== saved.memo}
                      onChange={(memo) => {
                        change(row.id, { memo });
                      }}
                    />
                  </td>
                  <td style={{ minWidth: '10rem' }}>
                    <Select
                      aria-labelledby={named('category')}
                      value={row.category}
                      isChanged={row.category !== saved.category}
                      onChange={(category) => {
                        if (typeof category === 'string') change(row.id, { category });
                      }}
                    >
                      <PickerOption id="food">Food</PickerOption>
                      <PickerOption id="transport">Transport</PickerOption>
                      <PickerOption id="home">Home</PickerOption>
                    </Select>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <SaveBar
        message={`${String(changes)} ${changes === 1 ? 'change' : 'changes'} to 3 receipts`}
        isDirty={changes > 0}
        actionLabel={`Confirm and review next (${String(left)} left)`}
        // Never disabled: a press with an invalid field is answered in the status.
        onAction={() => {
          if (invalid > 0) {
            setProblem(`${String(invalid)} ${invalid === 1 ? 'field needs' : 'fields need'} attention.`);
            return;
          }
          setProblem('');
          setRows((current) => current.map(({ edited }) => ({ saved: edited, edited })));
          setLeft((count) => Math.max(0, count - 1));
        }}
        onCancel={() => {
          setProblem('');
          setRows((current) => current.map(({ saved }) => ({ saved, edited: saved })));
        }}
        status={problem}
        statusTone="error"
      />
    </div>
  );
}
