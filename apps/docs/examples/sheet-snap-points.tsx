import { Button, Sheet, SheetTrigger, Text } from '@snapshot-ui/react';
import type { ReactElement } from 'react';

const PAYEES = ['Northwind Supplies', 'City Water', 'Corner Bakery', 'Metro Transit', 'Paper and Ink'];

/** Thirty payments, more than a phone's screen holds. */
const PAYMENTS = Array.from({ length: 30 }, (_, index) => ({
  payee: PAYEES[index % PAYEES.length] ?? 'Northwind Supplies',
  day: `October ${String(30 - index)}`,
}));

export default function SheetSnapPoints(): ReactElement {
  return (
    <SheetTrigger>
      <Button variant="secondary">Show every transaction</Button>
      <Sheet
        title="Transactions"
        description="Everything this month, newest first."
        snapPoints={['40%', '100%']}
      >
        <ul style={{ display: 'grid', gap: 12, margin: 0, padding: 0, listStyle: 'none' }}>
          {PAYMENTS.map(({ payee, day }) => (
            <li key={day}>
              <Text as="span" style={{ display: 'block' }}>
                {payee}
              </Text>
              <Text as="span" size="small" tone="muted" style={{ display: 'block' }}>
                {day}
              </Text>
            </li>
          ))}
        </ul>
      </Sheet>
    </SheetTrigger>
  );
}
