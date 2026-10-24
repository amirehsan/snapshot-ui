'use client';

import { Accordion, AccordionItem, Button, Text, TextField } from '@snapshot-ui/react';
import { useState, type ReactElement } from 'react';

const SAVED = { name: 'Ana Silva', digest: 'ana@example.com' };

export default function AccordionForm(): ReactElement {
  const [name, setName] = useState(SAVED.name);
  const [digest, setDigest] = useState('ana.silva@example.com');
  const [sent, setSent] = useState<string | null>(null);
  return (
    <form
      className="stack"
      style={{ width: '100%', minWidth: 0, maxWidth: '36rem', gridTemplateColumns: 'minmax(0, 1fr)' }}
      onSubmit={(event) => {
        event.preventDefault();
        setSent([...new FormData(event.currentTarget).keys()].join(', '));
      }}
      onReset={() => {
        setName(SAVED.name);
        setDigest(SAVED.digest);
        setSent(null);
      }}
    >
      <Accordion defaultExpandedKeys={['profile']}>
        <AccordionItem id="profile" title="Profile">
          <TextField
            label="Name"
            name="name"
            value={name}
            onChange={setName}
            isChanged={name !== SAVED.name}
          />
        </AccordionItem>
        <AccordionItem id="notifications" title="Notifications" note="Email, push and digest settings">
          <TextField
            label="Digest address"
            name="digest"
            type="email"
            value={digest}
            onChange={setDigest}
            isChanged={digest !== SAVED.digest}
          />
        </AccordionItem>
        <AccordionItem id="tax" title="Tax details" note="Needed before the first invoice">
          <TextField label="Tax number" name="tax" isRequired />
        </AccordionItem>
      </Accordion>
      <div className="row">
        <Button type="submit">Save</Button>
        <Button type="reset" variant="secondary">
          Reset
        </Button>
      </div>
      {sent === null ? null : (
        <Text size="small" tone="muted">
          Sent: {sent}
        </Text>
      )}
    </form>
  );
}
