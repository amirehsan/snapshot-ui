'use client';

import { Radio, RadioGroup } from '@snapshot-ui/react';
import type { ReactElement } from 'react';

export default function RadioGroupHorizontal(): ReactElement {
  return (
    <RadioGroup label="Text size" name="text-size" orientation="horizontal" defaultValue="medium">
      <Radio value="small">Small</Radio>
      <Radio value="medium">Medium</Radio>
      <Radio value="large">Large</Radio>
    </RadioGroup>
  );
}
