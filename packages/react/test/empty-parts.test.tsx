import { render } from '@testing-library/react';
import type { ReactElement } from 'react';
import { describe, expect, it } from 'vitest';
import { Checkbox, CheckboxGroup } from '../src/checkbox';
import { Radio, RadioGroup } from '../src/radio-group';
import { SegmentedControl, SegmentedControlItem } from '../src/segmented-control';
import { Switch } from '../src/switch';
import { TextArea } from '../src/text-area';
import { TextField } from '../src/text-field';

/** Every part that a label, a hint or a row's text renders into, and the chip beside a label. */
const PARTS = [
  '.field-label',
  '.field-changed',
  '.field-description',
  '.checkbox-text',
  '.radio-text',
  '.switch-text',
].join(', ');

/**
 * Each control given `false` or `''` for its label, its hint and its row's text, as the
 * `{condition && label}` idiom gives while the condition is false. Each is named by `aria-label`
 * and changed, so a label row that still rendered would also bring its chip.
 */
const EMPTY: [name: string, element: ReactElement][] = [
  [
    'Checkbox',
    <Checkbox aria-label="Remember me" description={false} isChanged>
      {''}
    </Checkbox>,
  ],
  [
    'Radio',
    <RadioGroup aria-label="Plan">
      <Radio value="team" aria-label="Team" description="">
        {false}
      </Radio>
    </RadioGroup>,
  ],
  [
    'Switch',
    <Switch aria-label="Weekly digest" description={false} isChanged>
      {''}
    </Switch>,
  ],
  [
    'CheckboxGroup',
    <CheckboxGroup aria-label="Notify me by" label={false} description="" isChanged>
      <Checkbox value="email" aria-label="Email" />
    </CheckboxGroup>,
  ],
  [
    'RadioGroup',
    <RadioGroup aria-label="Plan" label="" description={false} isChanged>
      <Radio value="team" aria-label="Team" />
    </RadioGroup>,
  ],
  [
    'SegmentedControl',
    <SegmentedControl aria-label="Theme" label={false} description="" isChanged>
      <SegmentedControlItem value="light">Light</SegmentedControlItem>
    </SegmentedControl>,
  ],
  ['TextField', <TextField aria-label="Name" label={false} description="" isChanged />],
  ['TextArea', <TextArea aria-label="Notes" label="" description={false} isChanged />],
];

describe('a label, a hint or a row text of false or an empty string', () => {
  it.each(EMPTY)('renders no empty part in %s', (_name, element) => {
    const { container } = render(element);
    expect(container.querySelectorAll(PARTS)).toHaveLength(0);
  });
});
