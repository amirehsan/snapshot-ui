'use client';

import { Radio, RadioGroup } from '@snapshot-ui/react';
import type { ReactElement } from 'react';

export default function RadioGroupStates(): ReactElement {
  return (
    <div className="stack" style={{ width: '100%', maxWidth: '24rem' }}>
      <RadioGroup label="Changed" defaultValue="monthly" isChanged>
        <Radio value="weekly">Weekly</Radio>
        <Radio value="monthly">Monthly</Radio>
      </RadioGroup>
      <RadioGroup label="Invalid" isInvalid errorMessage="Choose a frequency.">
        <Radio value="weekly">Weekly</Radio>
        <Radio value="monthly">Monthly</Radio>
      </RadioGroup>
      <RadioGroup label="Disabled group" defaultValue="weekly" isDisabled>
        <Radio value="weekly">Weekly</Radio>
        <Radio value="monthly">Monthly</Radio>
      </RadioGroup>
      <RadioGroup label="Disabled option" defaultValue="free">
        <Radio value="free">Free</Radio>
        <Radio value="team" isDisabled>
          Team
        </Radio>
      </RadioGroup>
    </div>
  );
}
