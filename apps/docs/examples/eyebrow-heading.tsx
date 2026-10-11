import { Eyebrow, Heading } from '@snapshot-ui/react';
import type { ReactElement } from 'react';

export default function EyebrowHeading(): ReactElement {
  return (
    <div style={{ display: 'grid', gap: 8, maxWidth: 420 }}>
      <Eyebrow>Foundations</Eyebrow>
      <Heading level={3} size={2}>
        One voice, measured rather than chosen by eye.
      </Heading>
    </div>
  );
}
