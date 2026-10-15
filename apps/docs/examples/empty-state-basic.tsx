import { Button, EmptyState } from '@snapshot-ui/react';
import { Receipt } from 'lucide-react';
import type { ReactElement } from 'react';

export default function EmptyStateBasic(): ReactElement {
  return (
    <EmptyState
      icon={<Receipt />}
      title="No transactions this month"
      description="Transactions you add or import show here."
      action={<Button variant="secondary">Import transactions</Button>}
    />
  );
}
