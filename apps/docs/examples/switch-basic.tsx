'use client';

import { Switch } from '@snapshot-ui/react';
import type { ReactElement } from 'react';

export default function SwitchBasic(): ReactElement {
  return (
    <Switch description="A short email when someone replies to your comment." defaultSelected>
      Notify me about replies
    </Switch>
  );
}
