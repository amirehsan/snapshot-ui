'use client';

import { SegmentedControl, SegmentedControlItem } from '@snapshot-ui/react';
import type { ReactElement } from 'react';

const PLANS = (
  <>
    <SegmentedControlItem value="free">Free</SegmentedControlItem>
    <SegmentedControlItem value="team">Team</SegmentedControlItem>
    <SegmentedControlItem value="business">Business</SegmentedControlItem>
  </>
);

export default function SegmentedControlStates(): ReactElement {
  return (
    <div className="stack" style={{ width: '100%', maxWidth: '28rem' }}>
      <SegmentedControl label="Billing plan" defaultValue="team" isChanged>
        {PLANS}
      </SegmentedControl>
      <SegmentedControl
        label="Plan for the new workspace"
        isInvalid
        errorMessage="Choose a plan to continue."
      >
        {PLANS}
      </SegmentedControl>
      <SegmentedControl label="Plan while billing is paused" defaultValue="business" isDisabled>
        {PLANS}
      </SegmentedControl>
      <SegmentedControl label="Plan for a trial" defaultValue="free">
        <SegmentedControlItem value="free">Free</SegmentedControlItem>
        <SegmentedControlItem value="team">Team</SegmentedControlItem>
        <SegmentedControlItem value="business" isDisabled>
          Business
        </SegmentedControlItem>
      </SegmentedControl>
      <SegmentedControl aria-label="Corners" size="sm" defaultValue="soft">
        <SegmentedControlItem value="rounded">Rounded</SegmentedControlItem>
        <SegmentedControlItem value="soft">Soft</SegmentedControlItem>
        <SegmentedControlItem value="square">Square</SegmentedControlItem>
      </SegmentedControl>
    </div>
  );
}
