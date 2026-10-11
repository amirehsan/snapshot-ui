'use client';

import { Checkbox } from '@snapshot-ui/react';
import type { ReactElement } from 'react';

export default function CheckboxBasic(): ReactElement {
  return (
    <div style={{ display: 'grid', width: '100%', maxWidth: '24rem' }}>
      <Checkbox name="remember" defaultSelected>
        Remember me on this device
      </Checkbox>
      <Checkbox name="descriptions" description="Off hides the copy under each service card.">
        Show service descriptions
      </Checkbox>
    </div>
  );
}
