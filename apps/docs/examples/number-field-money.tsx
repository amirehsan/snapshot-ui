'use client';

import { NumberField, Text } from '@snapshot-ui/react';
import { useState, type ReactElement } from 'react';

export default function NumberFieldMoney(): ReactElement {
  const [amount, setAmount] = useState<number | null>(123450);
  return (
    <div className="stack" style={{ width: '100%', maxWidth: '20rem' }}>
      <NumberField
        label="Amount"
        description="Before tax"
        money={{ symbol: '$' }}
        value={amount}
        onChange={setAmount}
      />
      {/* The value is what the app stores and puts in its URL: an integer count of cents. */}
      <Text tone="muted">Value: {amount === null ? 'null' : String(amount)}</Text>
    </div>
  );
}
