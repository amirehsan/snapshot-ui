'use client';

import { Button, Checkbox, CheckboxGroup, Text } from '@snapshot-ui/react';
import { useState, type ReactElement } from 'react';

export default function CheckboxValidation(): ReactElement {
  const [saved, setSaved] = useState('');
  return (
    <form
      className="stack"
      style={{ width: '100%', maxWidth: '24rem' }}
      onSubmit={(event) => {
        event.preventDefault();
        const channels = new FormData(event.currentTarget)
          .getAll('channels')
          .filter((entry) => typeof entry === 'string');
        setSaved(`Saved: ${channels.join(', ')}.`);
      }}
    >
      <CheckboxGroup
        label="Notify me by"
        name="channels"
        isRequired
        errorMessage="Pick at least one way to be notified."
      >
        <Checkbox value="email">Email</Checkbox>
        <Checkbox value="sms">Text message</Checkbox>
        <Checkbox value="push">Push notification</Checkbox>
      </CheckboxGroup>
      <Checkbox name="terms" isRequired errorMessage="Accept the terms to continue.">
        I accept the terms
      </Checkbox>
      <div className="row">
        <Button type="submit">Save preferences</Button>
      </div>
      <Text tone="muted" role="status">
        {saved}
      </Text>
    </form>
  );
}
