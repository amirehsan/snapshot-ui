'use client';

import { Button, Switch } from '@snapshot-ui/react';
import { useState, type ReactElement } from 'react';

const SAVED = { updates: true, digest: false, alerts: true };
type Setting = keyof typeof SAVED;

const ROWS: { key: Setting; label: string; description: string }[] = [
  { key: 'updates', label: 'Product updates', description: 'A short note when something ships.' },
  { key: 'digest', label: 'Weekly digest', description: 'Every Tuesday morning.' },
  { key: 'alerts', label: 'Security alerts', description: 'Always on for owners.' },
];

export default function SwitchSettings(): ReactElement {
  const [saved, setSaved] = useState(SAVED);
  const [draft, setDraft] = useState(SAVED);
  const isDirty = ROWS.some(({ key }) => draft[key] !== saved[key]);
  return (
    <div className="stack" style={{ width: '100%', maxWidth: '24rem' }}>
      {ROWS.map(({ key, label, description }) => (
        <Switch
          key={key}
          description={description}
          isSelected={draft[key]}
          onChange={(isSelected) => {
            setDraft({ ...draft, [key]: isSelected });
          }}
          isChanged={draft[key] !== saved[key]}
        >
          {label}
        </Switch>
      ))}
      <div className="row">
        <Button
          isDisabled={!isDirty}
          onPress={() => {
            setSaved(draft);
          }}
        >
          Save changes
        </Button>
        <Button
          variant="tertiary"
          isDisabled={!isDirty}
          onPress={() => {
            setDraft(saved);
          }}
        >
          Discard
        </Button>
      </div>
    </div>
  );
}
