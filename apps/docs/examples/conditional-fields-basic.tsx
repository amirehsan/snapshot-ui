'use client';

import { ConditionalFields, Switch, TextField } from '@snapshot-ui/react';
import { useId, useState, type ReactElement } from 'react';

export default function ConditionalFieldsBasic(): ReactElement {
  const [isOn, setIsOn] = useState(false);
  // The gate names the group it shows. Any id works; useId keeps two copies on a page apart.
  const id = useId();
  return (
    <div className="stack" style={{ width: '100%', maxWidth: '24rem' }}>
      {/* The gate: the app's own Switch, right before the group, pointing at it. */}
      <Switch
        isSelected={isOn}
        onChange={setIsOn}
        aria-controls={id}
        description="Round each purchase up and move the change to savings."
      >
        Round up purchases
      </Switch>
      <ConditionalFields id={id} isShown={isOn}>
        <TextField
          label="Savings account"
          name="roundUpAccount"
          defaultValue="Rainy day"
          description="Where the change goes. Kept while round-ups are off."
        />
      </ConditionalFields>
    </div>
  );
}
