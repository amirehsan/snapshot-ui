'use client';

import { Button, ConditionalFields, Switch, Text } from '@snapshot-ui/react';
import { useId, useState, type ReactElement } from 'react';

export default function ConditionalFieldsEmail(): ReactElement {
  const [isOn, setIsOn] = useState(true);
  const id = useId();
  return (
    <div className="stack" style={{ width: '100%', maxWidth: '24rem' }}>
      <Switch isSelected={isOn} onChange={setIsOn} aria-controls={id}>
        Weekly email
      </Switch>
      {/* No field at all: a status line and a button. While hidden, the button is disabled too, unseen. */}
      <ConditionalFields id={id} isShown={isOn}>
        <Text>Last sent Monday at 9:00, to you@example.com.</Text>
        <div>
          <Button variant="secondary">Send a test</Button>
        </div>
      </ConditionalFields>
    </div>
  );
}
