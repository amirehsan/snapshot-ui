'use client';

import { Description, FieldChanged, Label } from '@snapshot-ui/react';
import { useState, type ReactElement } from 'react';

const SAVED = 'Northwind Studio';

export default function FieldParts(): ReactElement {
  const [value, setValue] = useState(SAVED);
  return (
    <div
      className="field"
      data-changed={value === SAVED ? undefined : ''}
      style={{ marginInline: 'auto', maxWidth: '24rem' }}
    >
      <div className="field-head">
        <Label htmlFor="field-parts-name">Workspace name</Label>
        <FieldChanged />
      </div>
      <input
        id="field-parts-name"
        className="input"
        value={value}
        aria-describedby="field-parts-hint"
        onChange={(event) => {
          setValue(event.target.value);
        }}
      />
      <Description id="field-parts-hint">
        Shown in the header and in every invite. Edit it to see the chip.
      </Description>
    </div>
  );
}
