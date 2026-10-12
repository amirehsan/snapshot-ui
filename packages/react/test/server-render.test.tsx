// @vitest-environment node
import type { ReactElement } from 'react';
import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { Button } from '../src/button';
import { Checkbox, CheckboxGroup } from '../src/checkbox';
import { IconButton } from '../src/icon-button';
import { Link } from '../src/link';
import { Radio, RadioGroup } from '../src/radio-group';
import { SegmentedControl, SegmentedControlItem } from '../src/segmented-control';
import { Spinner } from '../src/spinner';
import { Switch } from '../src/switch';
import { TextArea } from '../src/text-area';
import { TextField } from '../src/text-field';

/**
 * The client components, rendered on the server. A Next.js server page imports them as client references and
 * the server renders them once to HTML before the browser takes over, so each must render with no window, no
 * document and no layout. This file runs in Node, which has none of the three: a component that reads one
 * while it renders throws here. (Effects and observers do not run during a server render, so they may.)
 */
const CLIENT: [name: string, element: ReactElement, contains: string[]][] = [
  ['Button', <Button>Save</Button>, ['<button', 'class="button button-primary', '>Save<']],
  ['Spinner', <Spinner aria-label="Loading" />, ['role="progressbar"', 'class="spinner']],
  ['Link', <Link href="/docs">Docs</Link>, ['<a', 'href="/docs"', 'class="link']],
  [
    'IconButton',
    <IconButton aria-label="Search">
      <svg />
    </IconButton>,
    ['<button', 'aria-label="Search"', 'class="icon-button'],
  ],
  [
    'TextField',
    <TextField label="Name" description="Shown to your team." budget={20} defaultValue="Northwind" />,
    [
      'class="field',
      'class="field-label"',
      'value="Northwind"',
      'Shown to your team.',
      'class="field-counter"',
    ],
  ],
  [
    'TextArea',
    <TextArea label="Notes" defaultValue="Hello" />,
    ['<textarea', 'class="input textarea"', '>Hello<'],
  ],
  [
    'Checkbox',
    <Checkbox defaultSelected>Remember me</Checkbox>,
    ['type="checkbox"', 'checked', 'class="checkbox-box"'],
  ],
  [
    'CheckboxGroup',
    <CheckboxGroup label="Notify me by" defaultValue={['email']}>
      <Checkbox value="email">Email</Checkbox>
      <Checkbox value="sms">Text message</Checkbox>
    </CheckboxGroup>,
    ['role="group"', 'class="field checkbox-group"', 'Text message'],
  ],
  [
    'RadioGroup',
    <RadioGroup label="Frequency" defaultValue="weekly">
      <Radio value="weekly">Weekly</Radio>
      <Radio value="monthly">Monthly</Radio>
    </RadioGroup>,
    ['role="radiogroup"', 'class="radio-indicator"', 'Monthly'],
  ],
  [
    'Switch',
    <Switch defaultSelected>Weekly digest</Switch>,
    ['role="switch"', 'class="switch-track"', 'Weekly digest'],
  ],
  [
    'SegmentedControl',
    <SegmentedControl label="Appearance" defaultValue="dark">
      <SegmentedControlItem value="light">Light</SegmentedControlItem>
      <SegmentedControlItem value="dark">Dark</SegmentedControlItem>
    </SegmentedControl>,
    ['role="radiogroup"', 'class="segmented-track"', 'class="segmented-room"', 'Dark'],
  ],
];

describe('the client components on the server', () => {
  it('has neither a window nor a document, so the renders below prove something', () => {
    expect(typeof window).toBe('undefined');
    expect(typeof document).toBe('undefined');
  });

  it.each(CLIENT)('%s renders to HTML with no browser', (_name, element, contains) => {
    const html = renderToString(element);
    for (const part of contains) expect(html).toContain(part);
  });
});
