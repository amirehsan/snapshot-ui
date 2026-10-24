import { PositionPad } from '@snapshot-ui/react';
import type { ReactElement } from 'react';

export default function PositionPadBasic(): ReactElement {
  return (
    <PositionPad
      label="Text position"
      description="Use the arrow keys to move between positions."
      name="text-position"
      defaultValue="center"
      style={{ width: '100%', minWidth: 0, maxWidth: '36rem' }}
    />
  );
}
