'use client';

import { Checkbox } from '@snapshot-ui/react';
import type { ReactElement } from 'react';

export default function CheckboxStates(): ReactElement {
  return (
    <div style={{ display: 'grid', width: '100%', maxWidth: '24rem' }}>
      <Checkbox defaultSelected>Publish changes right away</Checkbox>
      <Checkbox isIndeterminate>Select every page</Checkbox>
      <Checkbox isInvalid errorMessage="Accept the terms to continue.">
        I accept the terms
      </Checkbox>
      <Checkbox isDisabled>Publish on a schedule</Checkbox>
      <Checkbox isDisabled defaultSelected>
        Back up every night
      </Checkbox>
      <Checkbox isReadOnly defaultSelected>
        Managed by your workspace admin
      </Checkbox>
      <Checkbox isChanged>Email me a weekly summary</Checkbox>
    </div>
  );
}
