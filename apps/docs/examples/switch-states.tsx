'use client';

import { Switch } from '@snapshot-ui/react';
import type { ReactElement } from 'react';

export default function SwitchStates(): ReactElement {
  return (
    <div className="stack" style={{ width: '100%', maxWidth: '24rem' }}>
      <Switch defaultSelected>On</Switch>
      <Switch>Off</Switch>
      <Switch isChanged>Changed</Switch>
      <Switch isDisabled defaultSelected>
        Disabled and on
      </Switch>
      <Switch isDisabled>Disabled and off</Switch>
      <Switch isReadOnly defaultSelected>
        Read-only
      </Switch>
    </div>
  );
}
