'use client';

import { Description, FieldCounter, Label } from '@snapshot-ui/react';
import { useState, type ReactElement } from 'react';

export default function LengthCounter(): ReactElement {
  const [value, setValue] = useState('A shared space for the design team');
  return (
    <div className="field" style={{ marginInline: 'auto', maxWidth: '24rem' }}>
      <Label htmlFor="field-counter-text">Short description</Label>
      <input
        id="field-counter-text"
        className="input"
        value={value}
        aria-describedby="field-counter-hint"
        onChange={(event) => {
          setValue(event.target.value);
        }}
      />
      <Description id="field-counter-hint">Keep typing past 40. Nothing stops you.</Description>
      <FieldCounter count={value.length} budget={40} />
    </div>
  );
}
