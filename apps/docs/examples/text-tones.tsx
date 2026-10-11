import { Text } from '@snapshot-ui/react';
import type { ReactElement } from 'react';

export default function TextTones(): ReactElement {
  return (
    <div style={{ display: 'grid', gap: 12, maxWidth: 420 }}>
      <Text>Changes apply to everyone in the workspace.</Text>
      <Text size="small">Used in invoices, emails and the receipt page.</Text>
      <Text tone="muted">Last saved 4 minutes ago.</Text>
      <Text size="small" tone="muted">
        Only you can see this.
      </Text>
    </div>
  );
}
