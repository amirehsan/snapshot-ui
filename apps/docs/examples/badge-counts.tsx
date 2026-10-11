import { Badge } from '@snapshot-ui/react';
import type { ReactElement } from 'react';

const FOLDERS = [
  ['Inbox', 12],
  ['Drafts', 8],
  ['Sent', 1204],
] as const;

export default function BadgeCounts(): ReactElement {
  return (
    <div style={{ display: 'grid', gap: 8, width: 220, margin: '0 auto' }}>
      {FOLDERS.map(([name, count]) => (
        <div key={name} className="row" style={{ justifyContent: 'space-between' }}>
          <span>{name}</span>
          <Badge>{count}</Badge>
        </div>
      ))}
    </div>
  );
}
