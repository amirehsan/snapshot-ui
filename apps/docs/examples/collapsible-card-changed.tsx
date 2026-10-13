'use client';

import { Button, CollapsibleCard, TextField } from '@snapshot-ui/react';
import { useState, type ReactElement } from 'react';

const SAVED = 'Northwind Studio';

export default function CollapsibleCardChanged(): ReactElement {
  const [name, setName] = useState('Northwind Design');
  return (
    <CollapsibleCard
      title="Workspace"
      level={3}
      note="Folded over a changed field, the card marks the change after its title."
      defaultExpanded={false}
      actions={
        <Button
          variant="secondary"
          isDisabled={name === SAVED}
          onPress={() => {
            setName(SAVED);
          }}
        >
          Reset
        </Button>
      }
      style={{ width: '100%', maxWidth: 480 }}
    >
      <TextField label="Workspace name" value={name} onChange={setName} isChanged={name !== SAVED} />
    </CollapsibleCard>
  );
}
