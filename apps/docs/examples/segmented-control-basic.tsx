'use client';

import { SegmentedControl, SegmentedControlItem } from '@snapshot-ui/react';
import type { ReactElement } from 'react';

export default function SegmentedControlBasic(): ReactElement {
  return (
    <SegmentedControl
      label="Appearance"
      description="System follows the setting of the device."
      defaultValue="system"
      style={{ width: '100%', maxWidth: '28rem' }}
    >
      <SegmentedControlItem value="light">Light</SegmentedControlItem>
      <SegmentedControlItem value="dark">Dark</SegmentedControlItem>
      <SegmentedControlItem value="system">System</SegmentedControlItem>
    </SegmentedControl>
  );
}
