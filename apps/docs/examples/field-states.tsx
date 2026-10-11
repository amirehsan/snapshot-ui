'use client';

import { Description, FieldChanged, Label } from '@snapshot-ui/react';
import type { ReactElement } from 'react';

export default function FieldStates(): ReactElement {
  return (
    <div className="stack" style={{ marginInline: 'auto', maxWidth: '24rem' }}>
      <div className="field" data-changed="">
        <div className="field-head">
          <Label htmlFor="field-states-changed">Workspace name</Label>
          <FieldChanged />
        </div>
        <input
          id="field-states-changed"
          className="input"
          defaultValue="Northwind Studio"
          aria-describedby="field-states-changed-hint"
        />
        <Description id="field-states-changed-hint">Shown in the header and in every invite.</Description>
      </div>
      <div className="field" data-changed="" data-invalid="">
        <div className="field-head">
          <Label htmlFor="field-states-invalid">Short description</Label>
          <FieldChanged />
        </div>
        <input
          id="field-states-invalid"
          className="input"
          defaultValue="!"
          aria-invalid="true"
          aria-describedby="field-states-invalid-error"
        />
        <span id="field-states-invalid-error" className="field-error">
          Enter a short description.
        </span>
      </div>
    </div>
  );
}
