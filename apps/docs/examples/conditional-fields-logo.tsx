'use client';

import { Button, ConditionalFields, PickerOption, Select, Switch, TextField } from '@snapshot-ui/react';
import { useId, useState, type ReactElement } from 'react';

export default function ConditionalFieldsLogo(): ReactElement {
  const [logo, setLogo] = useState(true);
  const [sent, setSent] = useState<string[] | null>(null);
  const id = useId();
  return (
    <form
      className="stack"
      style={{ width: '100%', maxWidth: '24rem' }}
      onSubmit={(event) => {
        event.preventDefault();
        // What a server action would receive: with logos off, no provider and no key.
        setSent([...new FormData(event.currentTarget).keys()]);
      }}
    >
      {/* The gate sends `logos` only while on, so the server reads it to know what an absent key means. */}
      <Switch isSelected={logo} onChange={setLogo} aria-controls={id} name="logos">
        Show bank logos
      </Switch>
      <ConditionalFields id={id} isShown={logo}>
        <Select label="Provider" name="logoProvider" defaultValue="northwind">
          <PickerOption id="northwind">Northwind Logos</PickerOption>
          <PickerOption id="fabrikam">Fabrikam Marks</PickerOption>
        </Select>
        <TextField
          label="API key"
          name="logoKey"
          type="password"
          description="From your provider's dashboard. Kept while logos are off, and never sent."
        />
      </ConditionalFields>
      <div className="row">
        <Button type="submit" variant="secondary">
          Save
        </Button>
        <output>{sent === null ? null : `Sent: ${sent.join(', ')}`}</output>
      </div>
    </form>
  );
}
