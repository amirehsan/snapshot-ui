import { SearchField } from '@snapshot-ui/react';
import type { ReactElement } from 'react';

export default function SearchFieldStates(): ReactElement {
  return (
    <div className="stack" style={{ width: '100%', maxWidth: '24rem' }}>
      <SearchField label="Search archived" defaultValue="coffee" isDisabled />
      <SearchField
        label="Search notes"
        defaultValue="c"
        isInvalid
        errorMessage="Search needs two letters or more."
      />
    </div>
  );
}
