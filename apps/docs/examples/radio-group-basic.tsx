'use client';

import { Radio, RadioGroup } from '@snapshot-ui/react';
import { useState, type ReactElement } from 'react';

const SAVED = 'weekly';

export default function RadioGroupBasic(): ReactElement {
  const [value, setValue] = useState<string | null>(SAVED);
  return (
    <RadioGroup
      label="Newsletter frequency"
      description="You can change this at any time. Choose another option to see the chip."
      name="frequency"
      value={value}
      onChange={setValue}
      isChanged={value !== SAVED}
      style={{ width: '100%', maxWidth: '24rem' }}
    >
      <Radio value="weekly" description="Every Tuesday morning.">
        Weekly
      </Radio>
      <Radio value="monthly" description="The first Tuesday of the month.">
        Monthly
      </Radio>
      <Radio value="never">Never</Radio>
    </RadioGroup>
  );
}
