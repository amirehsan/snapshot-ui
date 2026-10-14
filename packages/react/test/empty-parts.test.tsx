import { act, render, screen } from '@testing-library/react';
import type { ReactElement, ReactNode } from 'react';
import { describe, expect, it } from 'vitest';
import { AppShell } from '../src/app-shell';
import { Button } from '../src/button';
import { RangeCalendar } from '../src/calendar';
import { Checkbox, CheckboxGroup } from '../src/checkbox';
import { ComboBox } from '../src/combo-box';
import { Dialog } from '../src/dialog';
import { Drawer } from '../src/drawer';
import { Menu, MenuItem, MenuTrigger } from '../src/menu';
import { Meter } from '../src/meter';
import { MultiSelect } from '../src/multi-select';
import { NumberField } from '../src/number-field';
import { PickerOption } from '../src/picker';
import { Radio, RadioGroup } from '../src/radio-group';
import { SearchField } from '../src/search-field';
import { SegmentedControl, SegmentedControlItem } from '../src/segmented-control';
import { Select } from '../src/select';
import { Sheet } from '../src/sheet';
import { Sidebar, SidebarGroup, SidebarItem } from '../src/sidebar';
import { StatTile } from '../src/stat-tile';
import { Switch } from '../src/switch';
import { TextArea } from '../src/text-area';
import { TextField } from '../src/text-field';
import { toast, ToastRegion } from '../src/toast';
import { Tooltip, TooltipTrigger } from '../src/tooltip';

/**
 * Every part that a label, a hint or a row's text renders into, the chip beside a label, and a range calendar's
 * row of presets.
 */
const PARTS = [
  '.field-label',
  '.field-changed',
  '.field-description',
  '.checkbox-text',
  '.radio-text',
  '.switch-text',
  '.calendar-presets',
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
  ['SearchField', <SearchField aria-label="Search" label={false} description="" />],
  ['NumberField', <NumberField aria-label="Amount" label={false} description="" isChanged />],
  // An empty list of presets draws no group.
  ['RangeCalendar', <RangeCalendar aria-label="Period" presets={[]} />],
  [
    'Select',
    <Select aria-label="Category" label="" description={false} isChanged>
      <PickerOption id="a">A</PickerOption>
    </Select>,
  ],
  [
    'ComboBox',
    <ComboBox aria-label="Merchant" label={false} description="" isChanged>
      <PickerOption id="a">A</PickerOption>
    </ComboBox>,
  ],
  [
    'MultiSelect',
    <MultiSelect aria-label="Categories" label="" description={false} isChanged>
      <PickerOption id="a">A</PickerOption>
    </MultiSelect>,
  ],
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
  '.tooltip-shortcut',
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
  [
    // The label is always drawn, since it names the option; the icon, the hint and the end value only when given.
    'PickerOption',
    <Select aria-label="Category" defaultOpen>
      <PickerOption id="a" icon={false} description="" end={null}>
        A
      </PickerOption>
    </Select>,
  ],
  [
    // The text is always drawn; the key chip only when a shortcut is given.
    'Tooltip',
    <TooltipTrigger isOpen>
      <Button>Search</Button>
      <Tooltip shortcut="">Search</Tooltip>
    </TooltipTrigger>,
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

describe('an empty shell slot', () => {
  it('draws no header wrapper and marks no sidebar or bottom bar for false, an empty string or null', () => {
    const { container } = render(
      <AppShell header={false} sidebar="" bottomBar={null}>
        page
      </AppShell>,
    );
    const shell = container.querySelector('.app-shell');
    expect(shell).not.toBeNull();
    expect(container.querySelector('.app-shell-header')).toBeNull();
    expect(shell).not.toHaveAttribute('data-has-sidebar');
    expect(shell).not.toHaveAttribute('data-has-bottom-bar');
  });

  it('draws no head, no footer and nothing for the search in a Sidebar given false, an empty string or null', () => {
    // A Sidebar throws outside an AppShell, so the row wraps it in one.
    const { container } = render(
      <AppShell
        sidebar={
          <Sidebar aria-label="Main" brand={false} search="" footer={null}>
            <SidebarGroup label="Overview">
              <SidebarItem href="#home" icon={<svg />}>
                Home
              </SidebarItem>
            </SidebarGroup>
          </Sidebar>
        }
      >
        page
      </AppShell>,
    );
    const rail = container.querySelector('.sidebar');
    expect(rail).not.toBeNull();
    expect(container.querySelector('.sidebar-head')).toBeNull();
    expect(container.querySelector('.sidebar-footer')).toBeNull();
    expect(container.querySelector('.sidebar-collapse')?.nextElementSibling).toHaveClass('sidebar-nav');
  });
});

describe('an empty stat tile slot', () => {
  it('draws no trend and no caption for false or an empty string', () => {
    const { container } = render(<StatTile label="Spending" value="$1" trend={false} caption="" />);
    expect(container.querySelector('.stat-tile')).not.toBeNull();
    expect(container.querySelector('.stat-tile-trend')).toBeNull();
    expect(container.querySelector('.stat-tile-caption')).toBeNull();
  });
});

describe('an empty meter label', () => {
  it('draws no label for an empty string, and the bar is named by aria-label', () => {
    const { container } = render(
      <Meter
        label=""
        aria-label="Groceries"
        max={1200}
        segments={[{ value: 820, look: 'fill', label: 'Spent', valueLabel: '$820.00' }]}
        valueLabel="$820 of $1,200"
      />,
    );
    expect(container.querySelector('.meter')).not.toBeNull();
    expect(container.querySelector('.meter-label')).toBeNull();
    expect(screen.getByRole('meter', { name: 'Groceries' })).not.toHaveAttribute('aria-labelledby');
  });
});
