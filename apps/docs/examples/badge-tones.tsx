import { Badge } from '@snapshot-ui/react';
import type { ReactElement } from 'react';

export default function BadgeTones(): ReactElement {
  return (
    <div className="row" style={{ justifyContent: 'center', gap: 12 }}>
      <Badge>Beta</Badge>
      <Badge tone="info">New</Badge>
      <Badge tone="success">Published</Badge>
      <Badge tone="warning">Needs review</Badge>
      <Badge tone="error">Failed</Badge>
    </div>
  );
}
