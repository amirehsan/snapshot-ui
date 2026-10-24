'use client';

import { PositionPad, Text, type PadPosition } from '@snapshot-ui/react';
import { useState, type ReactElement } from 'react';

/** A value's two halves as CSS keywords: the row is the block axis, the column the inline axis. */
function placeOf(position: PadPosition): { block: string; inline: string } {
  const [row = 'center', column = 'center'] = position === 'center' ? [] : position.split('-');
  return { block: row === 'top' ? 'start' : row === 'bottom' ? 'end' : 'center', inline: column };
}

export default function PositionPadCss(): ReactElement {
  const [position, setPosition] = useState<PadPosition>('bottom-start');
  const { block, inline } = placeOf(position);
  return (
    <div className="stack" style={{ width: '100%', minWidth: 0, maxWidth: '36rem' }}>
      <PositionPad label="Badge position" value={position} onChange={setPosition} />
      <div
        aria-hidden="true"
        style={{
          display: 'grid',
          blockSize: '8rem',
          padding: '0.75rem',
          borderRadius: 'var(--radius-surface)',
          backgroundColor: 'var(--color-bone)',
        }}
      >
        <span
          style={{
            placeSelf: `${block} ${inline}`,
            padding: '0.25rem 0.5rem',
            borderRadius: 'var(--radius-micro)',
            backgroundColor: 'var(--color-ink)',
            color: 'var(--color-canvas)',
          }}
        >
          New
        </span>
      </div>
      <Text size="small" tone="muted">
        place-self: {block} {inline}
      </Text>
    </div>
  );
}
