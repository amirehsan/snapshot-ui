'use client';

import { Button, PositionPad, Text, type PadPosition } from '@snapshot-ui/react';
import { useState, type ReactElement } from 'react';

const SAVED: PadPosition = 'top-start';

export default function PositionPadStates(): ReactElement {
  const [logo, setLogo] = useState<PadPosition | null>(SAVED);
  const [sent, setSent] = useState<string | null>(null);
  return (
    <form
      className="stack"
      style={{ width: '100%', minWidth: 0, maxWidth: '36rem', gridTemplateColumns: 'minmax(0, 1fr)' }}
      onSubmit={(event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        const read = (name: string): string => {
          const entry = data.get(name);
          return typeof entry === 'string' ? entry : 'none';
        };
        setSent(`logo ${read('logo')}, caption ${read('caption')}`);
      }}
      onReset={() => {
        setLogo(SAVED);
        setSent(null);
      }}
    >
      <PositionPad
        label="Logo position"
        description="The middle row holds the headline."
        name="logo"
        value={logo}
        onChange={setLogo}
        isChanged={logo !== SAVED}
        disabledPositions={['center-start', 'center', 'center-end']}
      />
      <PositionPad
        label="Caption position"
        name="caption"
        isRequired
        errorMessage="Choose where the caption sits."
      />
      <div className="row">
        <Button type="submit">Save</Button>
        <Button type="reset" variant="secondary">
          Reset
        </Button>
      </div>
      {sent === null ? null : (
        <Text size="small" tone="muted">
          Sent: {sent}
        </Text>
      )}
    </form>
  );
}
