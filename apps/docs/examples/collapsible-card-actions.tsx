'use client';

import { Button, CollapsibleCard, Switch } from '@snapshot-ui/react';
import { useState, type ReactElement } from 'react';

const SAVED = { updates: true, digest: false };

export default function CollapsibleCardActions(): ReactElement {
  const [draft, setDraft] = useState(SAVED);
  const isDirty = draft.updates !== SAVED.updates || draft.digest !== SAVED.digest;
  return (
    <CollapsibleCard
      title="Email"
      level={3}
      note="Fold the card, and Reset is still there."
      actions={
        <Button
          variant="secondary"
          isDisabled={!isDirty}
          onPress={() => {
            setDraft(SAVED);
          }}
        >
          Reset
        </Button>
      }
      style={{ width: '100%', maxWidth: 480 }}
    >
      <Switch
        isSelected={draft.updates}
        onChange={(updates) => {
          setDraft({ ...draft, updates });
        }}
        isChanged={draft.updates !== SAVED.updates}
      >
        Product updates
      </Switch>
      <Switch
        isSelected={draft.digest}
        onChange={(digest) => {
          setDraft({ ...draft, digest });
        }}
        isChanged={draft.digest !== SAVED.digest}
      >
        Weekly digest
      </Switch>
    </CollapsibleCard>
  );
}
