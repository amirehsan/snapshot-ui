'use client';

import { TextArea } from '@snapshot-ui/react';
import type { ReactElement } from 'react';

export default function TextAreaStates(): ReactElement {
  return (
    <div className="stack" style={{ width: '100%', maxWidth: '24rem' }}>
      <TextArea
        label="Welcome message"
        defaultValue={'Welcome to Northwind.\nStart with the brief in the pinned note.'}
        isChanged
      />
      <TextArea
        label="Invite note"
        defaultValue="Hi!"
        isInvalid
        errorMessage="Write at least one full sentence."
      />
      <TextArea label="Archived note" defaultValue="Kept for the 2025 audit." isDisabled />
      <TextArea label="Plan terms" defaultValue="Billed yearly, cancel any time." isReadOnly />
    </div>
  );
}
