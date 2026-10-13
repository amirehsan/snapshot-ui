import { Button, CollapsibleCard } from '@snapshot-ui/react';
import type { ReactElement } from 'react';

export default function CollapsibleCardBasic(): ReactElement {
  return (
    <div className="stack" style={{ width: '100%', maxWidth: 480 }}>
      <CollapsibleCard title="Notifications" level={3} note="Where we reach you, and how often.">
        <p>Product updates, when something ships.</p>
        <p>A weekly digest, every Tuesday morning.</p>
        <div className="row">
          <Button variant="secondary">Send a test email</Button>
        </div>
      </CollapsibleCard>
      <CollapsibleCard title="Billing" level={3} note="Paid by card, every month." defaultExpanded={false}>
        <p>The next invoice is on the first of the month.</p>
      </CollapsibleCard>
    </div>
  );
}
