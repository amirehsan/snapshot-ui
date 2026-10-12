'use client';

import { Button, Text, TextField } from '@snapshot-ui/react';
import { useState, type ReactElement } from 'react';

export default function TextFieldValidation(): ReactElement {
  const [email, setEmail] = useState('');
  const [sentTo, setSentTo] = useState('');
  return (
    <form
      className="stack"
      style={{ width: '100%', maxWidth: '24rem' }}
      onSubmit={(event) => {
        event.preventDefault();
        setSentTo(email);
      }}
    >
      <TextField
        label="Work email"
        description="We send the invite here."
        name="email"
        type="email"
        isRequired
        value={email}
        onChange={setEmail}
        validate={(value) =>
          value === '' || value.endsWith('@northwind.studio') ? null : 'Use an address at northwind.studio.'
        }
        errorMessage={({ validationDetails, validationErrors }) =>
          validationDetails.valueMissing ? 'Enter your work email.' : validationErrors.join(' ')
        }
      />
      <div className="row">
        <Button type="submit">Send invite</Button>
      </div>
      <Text tone="muted" role="status">
        {sentTo ? `Invite sent to ${sentTo}.` : ''}
      </Text>
    </form>
  );
}
