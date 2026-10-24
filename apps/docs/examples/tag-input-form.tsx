'use client';

import { Button, TagInput, Text, emailPreset } from '@snapshot-ui/react';
import { useState, type ReactElement } from 'react';

export default function TagInputForm(): ReactElement {
  const [sent, setSent] = useState<string[] | null>(null);
  return (
    // With scripts off the form submits to this page, and the address bar shows one invite entry per tag.
    <form
      method="get"
      className="stack"
      style={{ width: '100%', maxWidth: '36rem' }}
      onSubmit={(event) => {
        event.preventDefault();
        // A server action reads the same entries, and checks each with the same preset.
        const invites = new FormData(event.currentTarget)
          .getAll('invite')
          .map(String)
          .filter((value) => emailPreset.isValid(emailPreset.normalize(value)));
        setSent(invites);
      }}
      onReset={() => {
        setSent(null);
      }}
    >
      <TagInput
        label="Invite people"
        description="Separate addresses with commas or spaces."
        name="invite"
        preset={emailPreset}
        isRequired
        defaultValue={['ana@example.com', 'bo@example.com']}
      />
      <div className="row">
        <Button type="submit">Send invites</Button>
        <Button type="reset" variant="secondary">
          Reset
        </Button>
      </div>
      {sent === null ? null : (
        <Text size="small" tone="muted">
          Sent: {sent.join(', ')}
        </Text>
      )}
    </form>
  );
}
