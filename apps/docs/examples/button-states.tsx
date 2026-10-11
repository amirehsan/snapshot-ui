'use client';

import { Button } from '@snapshot-ui/react';
import { useState, type ReactElement } from 'react';

export default function ButtonStates(): ReactElement {
  const [isPending, setPending] = useState(false);
  return (
    <div className="row" style={{ justifyContent: 'center', gap: 12 }}>
      <Button
        isPending={isPending}
        pendingLabel="Saving"
        onPress={() => {
          setPending(true);
          setTimeout(() => {
            setPending(false);
          }, 2000);
        }}
      >
        Save changes
      </Button>
      <Button isDisabled>Save changes</Button>
      <Button variant="secondary" isDisabled>
        Preview
      </Button>
    </div>
  );
}
