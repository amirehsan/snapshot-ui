import { act, render, screen } from '@testing-library/react';
import type { ReactElement, ReactNode } from 'react';
import { describe, expect, it } from 'vitest';
import { Button } from '../src/button';
import { Checkbox, CheckboxGroup } from '../src/checkbox';
import { Dialog } from '../src/dialog';
import { Drawer } from '../src/drawer';
import { Menu, MenuItem, MenuTrigger } from '../src/menu';
import { Radio, RadioGroup } from '../src/radio-group';
import { SegmentedControl, SegmentedControlItem } from '../src/segmented-control';
import { Sheet } from '../src/sheet';
import { Switch } from '../src/switch';
import { TextArea } from '../src/text-area';
import { TextField } from '../src/text-field';
import { toast, ToastRegion } from '../src/toast';

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

/** Every optional part an overlay draws around what it is given. */
const OVERLAY_PARTS = [
  '.dialog-well',
  '.dialog-description',
  '.dialog-body',
  '.dialog-actions',
  '.drawer-footer',
  '.sheet-description',
  '.sheet-footer',
  '.menu-item-icon',
  '.menu-item-description',
  '.menu-item-end',
  '.menu-item-shortcut',
].join(', ');

/**
 * Each overlay rendered open and given `false`, `null` or `''` for every optional part. An overlay portals
 * to the body, so the parts are looked for there.
 */
const EMPTY_OVERLAYS: [name: string, element: ReactElement][] = [
  [
    'Dialog',
    <Dialog isOpen title="Rename" description="" icon={false} actions={null}>
      {''}
    </Dialog>,
  ],
  [
    // The body is always drawn, empty or not, since a drawer is its body; the footer only when given.
    'Drawer',
    <Drawer isOpen title="Menu" footer={false}>
      {''}
    </Drawer>,
  ],
  [
    // The body is always drawn, as a drawer's is; the description and the footer only when given.
    'Sheet',
    <Sheet isOpen title="More" description="" footer={false}>
      {''}
    </Sheet>,
  ],
  [
    // The label is always drawn, since it names the item; the icon, the description, the end value and the key
    // only when given.
    'MenuItem',
    <MenuTrigger isOpen>
      <Button>More</Button>
      <Menu>
        <MenuItem id="a" icon={false} description="" end={null} shortcut="">
          Settings
        </MenuItem>
      </Menu>
    </MenuTrigger>,
  ],
];

describe('an optional overlay part of false, null or an empty string', () => {
  it.each(EMPTY_OVERLAYS)('renders no empty part in %s', (_name, element) => {
    render(element);
    expect(document.body.querySelector('.overlay')).not.toBeNull();
    expect(document.body.querySelectorAll(OVERLAY_PARTS)).toHaveLength(0);
  });
});

describe("a toast's description of false, null or an empty string", () => {
  // A toast is raised, not rendered, so its row is a call: the queue outlives the region, and each case drops it.
  it.each<[string, ReactNode]>([
    ['false', false],
    ['null', null],
    ['an empty string', ''],
  ])(
    'renders no second line, no description and no empty block in the status host for %s',
    (_name, description) => {
      render(<ToastRegion />);
      act(() => {
        toast({ title: 'Saved', description, tone: 'success' });
      });
      const shown = screen.getByRole('alertdialog', { name: 'Saved' });
      expect(shown.querySelector('.toast-description')).toBeNull();
      expect(shown).not.toHaveAttribute('aria-describedby');
      expect(screen.getByRole('status').firstElementChild?.children).toHaveLength(1);
      act(() => {
        toast.clear();
      });
    },
  );
});
