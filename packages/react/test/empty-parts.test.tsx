import { act, render, screen } from '@testing-library/react';
import type { ReactElement, ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { AppShell } from '../src/app-shell';
import { Button } from '../src/button';
import { RangeCalendar } from '../src/calendar';
import { Checkbox, CheckboxGroup } from '../src/checkbox';
import { ComboBox } from '../src/combo-box';
import { DataTable } from '../src/data-table';
import { DateRangePicker } from '../src/date-range-picker';
import { DescriptionList, DescriptionListItem } from '../src/description-list';
import { Dialog } from '../src/dialog';
import { Drawer } from '../src/drawer';
import { EmptyState } from '../src/empty-state';
import { FileDropZone } from '../src/file-drop-zone';
import { UploadList, UploadTray } from '../src/upload-tray';
import { FilterBar } from '../src/filter-bar';
import { FilterChip } from '../src/filter-chip';
import { Menu, MenuItem, MenuTrigger } from '../src/menu';
import { Meter } from '../src/meter';
import { MultiSelect } from '../src/multi-select';
import { NumberField } from '../src/number-field';
import { PageHeader } from '../src/page-header';
import { PickerOption } from '../src/picker';
import { ProgressBar } from '../src/progress-bar';
import { Radio, RadioGroup } from '../src/radio-group';
import { SaveBar } from '../src/save-bar';
import { SearchField } from '../src/search-field';
import { SegmentedControl, SegmentedControlItem } from '../src/segmented-control';
import { Select } from '../src/select';
import { Sheet } from '../src/sheet';
import { SidePanel } from '../src/side-panel';
import { Sidebar, SidebarGroup, SidebarItem } from '../src/sidebar';
import { StatTile } from '../src/stat-tile';
import { COLUMNS, keyOf, TRANSACTIONS } from '../src/stories/transactions';
import { Switch } from '../src/switch';
import { TextArea } from '../src/text-area';
import { TextField } from '../src/text-field';
import { toast, ToastRegion } from '../src/toast';
import { Tooltip, TooltipTrigger } from '../src/tooltip';

/**
 * Every part that a label, a hint or a row's text renders into, the chip beside a label, a range calendar's row
 * of presets, a filter chip's value and the clear button that comes with one, and a filter bar's search slot,
 * its More, its Clear all and its count.
 */
const PARTS = [
  '.field-label',
  '.field-changed',
  '.field-description',
  '.checkbox-text',
  '.radio-text',
  '.switch-text',
  '.calendar-presets',
  '.filter-chip-value',
  '.filter-chip-clear',
  '.filter-bar-search',
  '.filter-bar-more',
  '.filter-bar-clear-all',
  '.filter-bar-sheet-button .badge',
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
    'DateRangePicker',
    <DateRangePicker aria-label="Period" label="" description={false} valueLabel="" isChanged />,
  ],
  [
    // An empty valueLabel is no value: the chip is inactive, with no value span and no clear button.
    'FilterChip',
    <FilterChip label="Amount" valueLabel="" onClear={() => undefined}>
      <p>Two amounts</p>
    </FilterChip>,
  ],
  [
    // No search slot, no chip and so no More, no Clear all and no count.
    'FilterBar',
    <FilterBar search={false}>{false}</FilterBar>,
  ],
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

  it('draws nothing after the workspace for a floating slot of false, an empty string or null', () => {
    for (const floating of [false, '', null]) {
      const { container, unmount } = render(<AppShell floating={floating}>page</AppShell>);
      expect(container.querySelector('.app-shell')?.lastElementChild).toHaveClass('app-shell-workspace');
      unmount();
    }
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

describe('an empty accounts part slot', () => {
  it('draws no actions dd for an actions node of false, null or an empty string', () => {
    for (const actions of [false, null, '']) {
      const { container, unmount } = render(
        <DescriptionList>
          <DescriptionListItem term="Nickname" actions={actions}>
            Travel card
          </DescriptionListItem>
        </DescriptionList>,
      );
      // The term and the value, and nothing after them.
      expect(container.querySelector('.description-list-item')?.children).toHaveLength(2);
      expect(container.querySelector('.description-list-actions')).toBeNull();
      unmount();
    }
  });
});

describe('an empty data part slot', () => {
  it('draws no icon, description or action in an EmptyState given false, an empty string or null', () => {
    const { container } = render(<EmptyState title="Nothing" icon={false} description="" action={null} />);
    expect(container.querySelector('.empty-state')).not.toBeNull();
    expect(container.querySelector('.empty-state-title')).toHaveTextContent('Nothing');
    expect(
      container.querySelector('.empty-state-icon, .empty-state-description, .empty-state-action'),
    ).toBeNull();
  });

  it('draws no empty state for an emptyState of false, an empty string or null', () => {
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    for (const emptyState of [false, '', null]) {
      const { container, unmount } = render(
        <DataTable
          aria-label="Transactions"
          items={[]}
          columns={COLUMNS}
          getKey={keyOf}
          emptyState={emptyState}
        />,
      );
      const cell = container.querySelector('tbody td');
      expect(cell, String(emptyState)).toBeEmptyDOMElement();
      unmount();
    }
  });

  it('draws no description or footer in a SidePanel given false, an empty string or null', () => {
    // The aside: jsdom's matchMedia answers false, so the wide face is drawn from the server's first value only
    // in a server render; here a query that matches keeps it.
    const media = vi.spyOn(window, 'matchMedia').mockImplementation(
      (query: string) =>
        ({
          matches: query === '(width >= 1024px)',
          media: query,
          addEventListener: () => undefined,
          removeEventListener: () => undefined,
        }) as unknown as MediaQueryList,
    );
    for (const empty of [false, '', null]) {
      const { container, unmount } = render(
        <SidePanel title="Groceries" isOpen onClose={() => undefined} description={empty} footer={empty}>
          <p>Corner Mart</p>
        </SidePanel>,
      );
      expect(container.querySelector('.side-panel'), String(empty)).not.toBeNull();
      expect(
        container.querySelector('.side-panel-description, .side-panel-footer'),
        String(empty),
      ).toBeNull();
      unmount();
    }
    media.mockRestore();
    // The sheet, under 1024px.
    for (const empty of [false, '', null]) {
      const { unmount } = render(
        <SidePanel title="Groceries" isOpen onClose={() => undefined} description={empty} footer={empty}>
          <p>Corner Mart</p>
        </SidePanel>,
      );
      expect(document.querySelector('.side-panel-sheet'), String(empty)).not.toBeNull();
      expect(document.querySelector('.sheet-description, .sheet-footer'), String(empty)).toBeNull();
      expect(screen.getByRole('dialog')).not.toHaveAttribute('aria-describedby');
      unmount();
    }
  });

  it('draws no actions in the bar for bulkActions of false, an empty string or null', () => {
    for (const bulkActions of [false, '', null]) {
      const { container, unmount } = render(
        <DataTable
          aria-label="Transactions"
          items={TRANSACTIONS.slice(0, 3)}
          columns={COLUMNS}
          getKey={keyOf}
          selectedKeys={['t1']}
          onSelectionChange={() => undefined}
          bulkActions={bulkActions}
        />,
      );
      expect(container.querySelector('.data-table-bar'), String(bulkActions)).not.toBeNull();
      expect(container.querySelector('.data-table-bar-actions'), String(bulkActions)).toBeNull();
      unmount();
    }
  });
});

describe('an empty documents part slot', () => {
  it('draws no label span for a ProgressBar given an empty label and an aria-label', () => {
    const { container } = render(<ProgressBar label="" aria-label="Uploading invoice.pdf" value={45} />);
    expect(container.querySelector('.progress-bar')).not.toBeNull();
    expect(container.querySelector('.progress-bar-label')).toBeNull();
    const track = screen.getByRole('progressbar', { name: 'Uploading invoice.pdf' });
    expect(track).not.toHaveAttribute('aria-labelledby');
    // The value still shows in the head, alone.
    expect(container.querySelector('.progress-bar-head')?.children).toHaveLength(1);
  });

  it('draws no label row or description for a FileDropZone given an empty label and description', () => {
    const { container } = render(
      <FileDropZone label="" description="" aria-label="Receipt" onFiles={() => undefined} />,
    );
    const zone = screen.getByRole('group', { name: 'Receipt' });
    expect(zone.querySelector('.field-head')).toBeNull();
    expect(zone.querySelector('.field-description')).toBeNull();
    expect(zone).not.toHaveAttribute('aria-labelledby');
    // The button describes itself by nothing that is not drawn.
    expect(screen.getByRole('button', { name: 'Choose a file' })).not.toHaveAttribute('aria-describedby');
    expect(container.querySelector('.file-drop-zone-box')).not.toBeNull();
  });

  it('draws no reason, progress or link in an UploadList row given empty strings', () => {
    const { container } = render(
      <UploadList
        aria-label="Uploads"
        items={[
          { id: 1, name: 'review.pdf', status: 'review', reason: '', href: '' },
          { id: 2, name: 'upload.pdf', status: 'uploading', progressLabel: '' },
        ]}
      />,
    );
    expect(container.querySelector('.upload-row-reason')).toBeNull();
    expect(container.querySelector('.upload-row-progress')).toBeNull();
    expect(container.querySelector('a')).toBeNull();
    // The empty progress label leaves the bar without value text, so it is indeterminate and named.
    expect(screen.getByRole('progressbar')).toHaveAccessibleName('Uploading upload.pdf');
  });

  it('draws no description in an UploadTray given an empty one', () => {
    const { container } = render(
      <UploadTray items={[{ id: 1, name: 'lease.pdf', status: 'saved' }]} description="" />,
    );
    expect(container.querySelector('.upload-tray-description')).toBeNull();
    expect(container.querySelector('.upload-tray-title')).toHaveTextContent('1 upload complete');
  });

  it('draws no secondary actions and no status text in a SaveBar given false, an empty string or null', () => {
    for (const empty of [false, '', null]) {
      const { container, unmount } = render(
        <SaveBar
          message="2 changes to Corner Mart"
          actionLabel="Save"
          onAction={() => undefined}
          onCancel={() => undefined}
          secondaryActions={empty}
          status={empty}
          statusTone="error"
        />,
      );
      // Cancel and the action, with nothing between them.
      const actions = container.querySelector('.save-bar-actions');
      expect(actions?.children).toHaveLength(2);
      expect(actions?.childNodes).toHaveLength(2);
      // The host stays, empty and polite, with no icon for a status that is not there.
      expect(container.querySelector('.save-bar-status')).toBeEmptyDOMElement();
      unmount();
    }
  });

  it('draws no trail, eyebrow, description or actions in a PageHeader given false, an empty string or null', () => {
    for (const empty of [false, '', null]) {
      const { container, unmount } = render(
        <PageHeader
          title="Documents"
          breadcrumbs={empty}
          eyebrow={empty}
          description={empty}
          actions={empty}
        />,
      );
      // The title alone in the titles, and no actions wrapper beside them.
      const titles = container.querySelector('.page-header-titles');
      expect(titles?.childNodes).toHaveLength(1);
      expect(container.querySelector('.page-header-row')?.children).toHaveLength(1);
      unmount();
    }
  });
});
