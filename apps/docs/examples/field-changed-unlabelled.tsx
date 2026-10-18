import { NumberField, TextField } from '@snapshot-ui/react';
import type { ReactElement } from 'react';

export default function FieldChangedUnlabelled(): ReactElement {
  return (
    <div className="stack" style={{ width: '100%', maxWidth: '20rem' }}>
      {/* Named by aria-label alone, as a cell of a review grid is by its column and row. */}
      <TextField aria-label="Memo, Corner Mart" defaultValue="Milk, bread and eggs" isChanged />
      <NumberField aria-label="Amount, Corner Mart" money={{ symbol: '$' }} defaultValue={4218} isChanged />
      <TextField aria-label="Memo, City Transit" defaultValue="Bus fare" />
    </div>
  );
}
