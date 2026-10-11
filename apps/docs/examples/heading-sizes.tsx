import { Heading } from '@snapshot-ui/react';
import type { ReactElement } from 'react';

export default function HeadingSizes(): ReactElement {
  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <Heading level={3} size={1}>
        Display
      </Heading>
      <Heading level={3} size={2}>
        Section
      </Heading>
      <Heading level={3} size={3}>
        Card title
      </Heading>
      <Heading level={3} size={4}>
        Subhead
      </Heading>
    </div>
  );
}
