// @vitest-environment node
import type { ReactElement } from 'react';
import { renderToString } from 'react-dom/server';
import { I18nProvider } from 'react-aria-components';
import { describe, expect, it } from 'vitest';
import { outermostClasses, proseRoots } from './prose-roots';
import { AppShell } from '../src/app-shell';
import { Avatar } from '../src/avatar';
import { Breadcrumb, Breadcrumbs } from '../src/breadcrumbs';
import { StatTile } from '../src/stat-tile';
import { BottomTabBar, BottomTabBarItem } from '../src/bottom-tab-bar';
import { Button } from '../src/button';
import { Calendar, RangeCalendar } from '../src/calendar';
import { Checkbox, CheckboxGroup } from '../src/checkbox';
import { DataTable } from '../src/data-table';
import { DatePicker } from '../src/date-picker';
import { DateRangePicker } from '../src/date-range-picker';
import { Card, CardActions, CardBody, CardHeader, CardNote, CardTitle } from '../src/card';
import { CollapsibleCard } from '../src/collapsible-card';
import { ComboBox } from '../src/combo-box';
import { CommandPalette } from '../src/command-palette';
import { ConfirmDialog, Dialog, DialogTrigger } from '../src/dialog';
import { Drawer } from '../src/drawer';
import { FileButton, FileDropZone, PageDropZone } from '../src/file-drop-zone';
import { FilterBar } from '../src/filter-bar';
import { FilterChip } from '../src/filter-chip';
import { IconButton } from '../src/icon-button';
import { Link } from '../src/link';
import { Menu, MenuItem, MenuTrigger } from '../src/menu';
import { MultiSelect } from '../src/multi-select';
import { NumberField } from '../src/number-field';
import { Shortcut } from '../src/overlay/Shortcut';
import { Pagination } from '../src/pagination';
import { PickerOption } from '../src/picker';
import { Popover } from '../src/popover';
import { Radio, RadioGroup } from '../src/radio-group';
import { SaveBar } from '../src/save-bar';
import { SearchField } from '../src/search-field';
import { SegmentedControl, SegmentedControlItem } from '../src/segmented-control';
import { Select } from '../src/select';
import { Sheet, SheetTrigger } from '../src/sheet';
import { SidePanel, SidePanelLayout } from '../src/side-panel';
import {
  Sidebar,
  SidebarBrand,
  SidebarGroup,
  SidebarItem,
  SidebarSearch,
  SidebarTrigger,
} from '../src/sidebar';
import { Spinner } from '../src/spinner';
import { DescriptionList, DescriptionListItem } from '../src/description-list';
import { Gauge } from '../src/gauge';
import { MonthGrid } from '../src/month-grid';
import {
  COVERAGE_STATES,
  COVERAGE_YEARS,
  MONTH_NAMES,
  PERSIAN_LABELS,
  PERSIAN_MONTH_NAMES,
  PERSIAN_SHORT_MONTHS,
  PERSIAN_STATES,
  PERSIAN_SUMMARY,
  PERSIAN_YEARS,
  SHORT_MONTHS,
} from '../src/stories/coverage';
import { COLUMNS, columnsWithTotal, groupOf, hrefOf, keyOf, TRANSACTIONS } from '../src/stories/transactions';
import { Switch } from '../src/switch';
import { Tab, TabList, TabPanel, Tabs } from '../src/tabs';
import { TextArea } from '../src/text-area';
import { Input, TextField } from '../src/text-field';
import { Description, Label } from '../src/field';
import { ToastRegion } from '../src/toast';
import { Tooltip, TooltipTrigger } from '../src/tooltip';
import { UploadList, UploadTray, type UploadItem } from '../src/upload-tray';

/**
 * The client components, rendered on the server. A Next.js server page imports them as client references and
 * the server renders them once to HTML before the browser takes over, so each must render with no window, no
 * document and no layout. This file runs in Node, which has none of the three: a component that reads one
 * while it renders throws here. (Effects and observers do not run during a server render, so they may.)
 *
 * An overlay renders nothing until it opens, so its row also names what must stay out of the HTML: closed, a
 * dialog draws its trigger and none of its own parts.
 */
/** Six files, one in each status, as an app's uploads provider holds them. */
const UPLOADS: UploadItem[] = [
  { id: 1, name: 'receipt-march.pdf', status: 'waiting' },
  { id: 2, name: 'invoice.pdf', status: 'uploading', progress: 0.45, progressLabel: '1.8 of 4 MB' },
  { id: 3, name: 'statement.pdf', status: 'reading' },
  { id: 4, name: 'lease.pdf', status: 'saved', href: '/documents/lease' },
  { id: 5, name: 'corner-mart.jpg', status: 'review', reason: 'The total could not be read' },
  { id: 6, name: 'video.mov', status: 'failed', reason: 'Not a PDF, JPG or PNG' },
];

const CLIENT: [name: string, element: ReactElement, contains: string[], excludes?: string[]][] = [
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
    // The face: the plain figure, the decimal keyboard and no role description, and the minor units in the
    // field's own hidden input.
    'NumberField',
    <NumberField label="Amount" money={{ symbol: '$' }} value={123450} name="amount" />,
    [
      'class="field number-field"',
      'data-money',
      'data-symbol="start"',
      'class="input number-field-input"',
      'value="1234.50"',
      'inputMode="decimal"',
      'class="number-field-symbol"',
      'type="hidden"',
      'name="amount"',
      'value="123450"',
    ],
    ['aria-roledescription', 'role="spinbutton"'],
  ],
  // The field's parts on their own, as a custom layout places them, and a range calendar's face.
  ['Label', <Label htmlFor="amount">Amount</Label>, ['class="field-label"']],
  ['Description', <Description>In dollars</Description>, ['class="field-description"']],
  ['Input', <Input aria-label="Amount" />, ['class="input"']],
  ['RangeCalendar', <RangeCalendar aria-label="Dates" />, ['class="calendar range-calendar"']],
  [
    // The face: an empty frame of the calendar's final size; React Aria's month, weekdays and days, all from Intl
    // and the device's zone, mount after hydration.
    'Calendar',
    <Calendar aria-label="Date" value="2026-09-14" />,
    ['class="calendar"', 'data-face'],
    ['role="grid"', 'September'],
  ],
  [
    // The face: the frame, the app's valueLabel and the button, and the two hidden ISO dates; the segments, from
    // Intl, arrive after hydration, and the calendar renders nothing until it opens.
    'DateRangePicker',
    <DateRangePicker
      label="Statement period"
      value={{ start: '2026-09-01', end: '2026-09-30' }}
      valueLabel="1 to 30 Sep 2026"
      startName="from"
      endName="to"
      today="2026-09-18"
    />,
    [
      'class="field date-range-picker"',
      'class="input date-range-control"',
      'class="date-range-face"',
      '1 to 30 Sep 2026',
      'name="from"',
      'value="2026-09-01"',
      'name="to"',
      'value="2026-09-30"',
      'aria-label="Choose dates"',
    ],
    ['role="spinbutton"', 'role="dialog"', 'date-range-arrow'],
  ],
  [
    // The face: the frame, the app's valueLabel, the button and the hidden ISO date; the segments, from Intl,
    // arrive after hydration, and the calendar renders nothing until it opens.
    'DatePicker',
    <DatePicker label="Date" value="2026-10-14" valueLabel="14 Oct 2026" name="day" today="2026-10-16" />,
    [
      'class="field date-picker"',
      'class="input date-picker-control"',
      'class="date-picker-face"',
      '14 Oct 2026',
      'name="day"',
      'value="2026-10-14"',
      'aria-label="Choose date"',
    ],
    ['role="spinbutton"', 'role="dialog"', 'field-changed-mark'],
  ],
  [
    // A changed field with no label writes its changed mark on the server.
    'DatePicker unlabelled and changed',
    <DatePicker aria-label="Date, Corner Mart" value="2026-10-14" isChanged />,
    ['data-unlabelled=""', 'data-changed=""', 'class="field-changed-mark"', '>Changed</span>'],
    ['class="field-head"', 'role="spinbutton"'],
  ],
  [
    // The summary from React Aria's hidden pass, in list order, and the clear button; no list and no filter.
    'FilterChip',
    <FilterChip label="Category" selectionMode="multiple" value={['rent', 'food']} onChange={() => undefined}>
      <PickerOption id="food">Food</PickerOption>
      <PickerOption id="rent">Rent</PickerOption>
      <PickerOption id="salary">Salary</PickerOption>
    </FilterChip>,
    [
      'class="filter-chip"',
      'data-active',
      'class="filter-chip-label"',
      '>Category<',
      'class="filter-chip-value"',
      '>Food, Rent<',
      'aria-label="Clear Category"',
    ],
    ['role="listbox"', 'select-filter', 'search-field'],
  ],
  [
    // The row with each primary and each active chip, More, Clear all and the Filters button with its count; the
    // More panel and the sheet render nothing until they open.
    'FilterBar',
    <FilterBar search={<SearchField aria-label="Search transactions" />} onClearAll={() => undefined}>
      <FilterChip label="Category" selectionMode="single" value="food" onChange={() => undefined}>
        <PickerOption id="food">Food</PickerOption>
        <PickerOption id="rent">Rent</PickerOption>
      </FilterChip>
      <FilterChip label="Tags" selectionMode="multiple" isSecondary value={[]} onChange={() => undefined}>
        <PickerOption id="food">Food</PickerOption>
      </FilterChip>
      <FilterChip label="Amount" valueLabel="Over $100" onClear={() => undefined}>
        <p>Two amounts</p>
      </FilterChip>
    </FilterBar>,
    [
      'class="filter-bar"',
      'role="group"',
      'aria-label="Filters"',
      'class="filter-chip"',
      'filter-bar-more',
      'filter-bar-clear-all',
      'filter-bar-sheet-button',
      'class="badge"',
      '>2<',
    ],
    ['filter-section', 'role="dialog"'],
  ],
  [
    // React Aria writes data-empty as "true" in the HTML. A labelled field is not data-unlabelled.
    'SearchField',
    <SearchField label="Search transactions" placeholder="Merchant or note" />,
    [
      'class="field search-field"',
      'data-empty="true"',
      'type="search"',
      'class="input search-field-input"',
      'placeholder="Merchant or note"',
      'class="search-field-icon"',
      'aria-label="Clear search"',
    ],
    ['data-unlabelled'],
  ],
  [
    // The trigger draws the chosen option's icon and label; the list renders nothing until it opens.
    'Select',
    <Select label="Category" defaultValue="food">
      <PickerOption id="food" icon={<svg />}>
        Food
      </PickerOption>
      <PickerOption id="rent">Rent</PickerOption>
    </Select>,
    [
      'class="field select"',
      'class="input select-trigger"',
      'aria-haspopup="listbox"',
      'class="select-value-label"',
      '>Food<',
      '<select',
    ],
    ['role="listbox"', 'menu-item-end'],
  ],
  [
    // The input holds the chosen option's text; the list renders nothing until it opens, and the Spinner shows
    // only while options load.
    'ComboBox',
    <ComboBox label="Merchant" defaultValue="cafe">
      <PickerOption id="cafe">Café Luna</PickerOption>
      <PickerOption id="mart">Corner Mart</PickerOption>
    </ComboBox>,
    [
      'class="field combo-box"',
      'role="combobox"',
      'class="input combo-box-input"',
      'value="Café Luna"',
      'class="input-button combo-box-button"',
      'aria-label="Show options"',
    ],
    ['role="listbox"', 'combo-box-spinner'],
  ],
  [
    // The frame holds a tag per chosen option and the form a hidden input per key; the list renders nothing
    // until it opens, and an option not chosen is nowhere.
    'MultiSelect',
    <MultiSelect label="Categories" name="categories" defaultValue={['food', 'rent']}>
      <PickerOption id="food">Food</PickerOption>
      <PickerOption id="rent">Rent</PickerOption>
      <PickerOption id="fun">Fun</PickerOption>
    </MultiSelect>,
    [
      'class="field multi-select"',
      'class="input multi-select-control"',
      'role="grid"',
      'class="multi-select-tag"',
      '>Food<',
      '>Rent<',
      'type="hidden"',
      'name="categories"',
      'value="food"',
      'value="rent"',
    ],
    ['role="listbox"', '>Fun<'],
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
  [
    'CollapsibleCard',
    <CollapsibleCard title="Notifications" note="Where we reach you.">
      <p>Product updates</p>
    </CollapsibleCard>,
    [
      'class="card card-collapsible"',
      'data-expanded=""',
      'class="card-toggle"',
      'aria-expanded="true"',
      'class="card-note"',
      'class="card-fold"',
      '<div class="card-body"><p>Product updates</p></div>',
    ],
  ],
  [
    // The server cannot see the browser's storage, so a card that remembers its fold renders open, and holds
    // every transition off until hydration has caught up with the fold.
    'CollapsibleCard with a storageKey',
    <CollapsibleCard title="Notifications" storageKey="notifications">
      <p>Product updates</p>
    </CollapsibleCard>,
    ['class="card card-collapsible"', 'data-expanded=""', 'data-instant=""', 'aria-expanded="true"'],
  ],
  [
    // Folded from the server's HTML, with no data-expanded on the root and the fold hidden, so nothing shows
    // the body before the page hydrates.
    'CollapsibleCard, folded',
    <CollapsibleCard title="Notifications" defaultExpanded={false}>
      <p>Product updates</p>
    </CollapsibleCard>,
    [
      'class="card card-collapsible" data-instant="">',
      'aria-expanded="false"',
      'aria-hidden="true" hidden=""><div class="card-body"><p>Product updates</p></div>',
    ],
  ],
  [
    // A folded card that says it holds a change draws its marker on the server, which has no fold to watch.
    'CollapsibleCard, folded and changed',
    <CollapsibleCard title="Notifications" defaultExpanded={false} isChanged>
      <p>Product updates</p>
    </CollapsibleCard>,
    [
      'class="card card-collapsible" data-instant="" data-changed=""',
      'aria-expanded="false"',
      'aria-describedby="',
      '<span class="card-toggle-text">Notifications<span class="card-marker" aria-hidden="true"></span></span>',
      '</h2><span id="',
      'class="card-marker-label" hidden="">Changed</span>',
    ],
  ],
  [
    'Dialog, closed',
    <DialogTrigger>
      <Button>Rename</Button>
      <Dialog title="Rename the workspace" />
    </DialogTrigger>,
    ['<button', '>Rename<'],
    ['dialog-content'],
  ],
  [
    'ConfirmDialog, closed',
    <DialogTrigger>
      <Button>Delete</Button>
      <ConfirmDialog
        title="Delete these?"
        description="They go for good."
        confirmLabel="Delete 3 transactions"
        tone="danger"
      />
    </DialogTrigger>,
    ['<button', '>Delete<'],
    ['alertdialog'],
  ],
  [
    'Drawer, closed',
    <DialogTrigger>
      <Button>Menu</Button>
      <Drawer title="Menu" isTitleHidden>
        <Link href="/overview">Overview</Link>
      </Drawer>
    </DialogTrigger>,
    ['<button', '>Menu<'],
    ['drawer-content'],
  ],
  [
    'Sheet, closed',
    <SheetTrigger>
      <Button>More</Button>
      <Sheet title="More" isTitleHidden>
        <Link href="/reports">Reports</Link>
      </Sheet>
    </SheetTrigger>,
    ['<button', '>More<'],
    ['sheet-content'],
  ],
  [
    'Popover, closed',
    <DialogTrigger>
      <Button>Filter</Button>
      <Popover isPadded>Panel</Popover>
    </DialogTrigger>,
    ['<button', '>Filter<'],
    ['popover'],
  ],
  [
    // React Aria marks a menu trigger with aria-haspopup="true", which assistive technology reads as a menu.
    'Menu, closed',
    <MenuTrigger>
      <IconButton aria-label="More">
        <svg />
      </IconButton>
      <Menu>
        <MenuItem id="a">Settings</MenuItem>
      </Menu>
    </MenuTrigger>,
    ['<button', 'aria-label="More"', 'aria-haspopup="true"', 'aria-expanded="false"'],
    ['role="menu"', 'Settings'],
  ],
  [
    // The key chip Menu, CommandPalette and Tooltip share knows no platform on the server, so it says Mod.
    'Shortcut',
    <Shortcut keys="Mod ," className="menu-item-shortcut" />,
    ['<kbd', 'dir="ltr"', 'class="menu-item-shortcut"', '>Mod ,<'],
    ['\u2318', 'Ctrl'],
  ],
  [
    // The polite status host is in the page's HTML, empty, before any toast; React Aria's region mounts in the
    // browser with the first toast.
    'ToastRegion',
    <ToastRegion />,
    ['class="toast-status-host"', 'role="status"', 'aria-live="polite"', 'data-react-aria-top-layer'],
    ['toast-region'],
  ],
  [
    // The palette has no trigger of its own, so closed it renders nothing, and its shortcut listener is an
    // effect, which a server render never runs.
    'CommandPalette, closed',
    <CommandPalette label="Search" items={[]} onAction={() => undefined} />,
    [],
    ['command-palette'],
  ],
  [
    // A tip opens on hover or focus, which a server render never sees, so closed it draws its trigger alone.
    'Tooltip, closed',
    <TooltipTrigger>
      <IconButton aria-label="Search">
        <svg />
      </IconButton>
      <Tooltip>Search</Tooltip>
    </TooltipTrigger>,
    ['<button', 'aria-label="Search"'],
    ['role="tooltip"'],
  ],
  [
    // The collapsed width is painted from the prop, so the attribute is in the server's HTML; the drawer state's
    // listeners are effects, which a server render never runs.
    'AppShell, collapsed',
    <AppShell
      defaultSidebarCollapsed
      sidebar={<div>rail</div>}
      header={<div>head</div>}
      bottomBar={<div>bar</div>}
    >
      page
    </AppShell>,
    [
      'class="app-shell"',
      'data-sidebar="collapsed"',
      'data-has-sidebar',
      'data-has-bottom-bar',
      'class="app-shell-skip"',
      '<main',
      'tabindex="-1"',
      'class="app-shell-header"',
    ],
  ],
  [
    // Expanded writes no attribute at all, never "expanded", so one set higher up is not reset.
    'AppShell, expanded',
    <AppShell sidebar={<div>rail</div>} header={<div>head</div>} bottomBar={<div>bar</div>}>
      page
    </AppShell>,
    ['class="app-shell"', 'data-has-sidebar', 'data-has-bottom-bar', '<main'],
    ['data-sidebar'],
  ],
  [
    // The rail renders at every width, and the drawer copy renders nothing until the drawer opens. The key chip
    // knows no platform on the server, so it says Mod.
    'Sidebar',
    <AppShell
      header={<SidebarTrigger />}
      sidebar={
        <Sidebar
          aria-label="Main"
          brand={
            <SidebarBrand href="/" mark={<svg />}>
              Snapshot
            </SidebarBrand>
          }
          search={<SidebarSearch shortcut="Mod K">Search or jump to</SidebarSearch>}
          footer={<span>Ada Lovelace</span>}
        >
          <SidebarGroup label="Overview" isCurrent>
            <SidebarItem href="/transactions" icon={<svg />} isCurrent count={12} countLabel="to review">
              Transactions
            </SidebarItem>
          </SidebarGroup>
        </Sidebar>
      }
    >
      page
    </AppShell>,
    [
      'class="sidebar"',
      'aria-current="page"',
      'class="sidebar-item-count"',
      // The collapse button's two names, one for the rail as the stylesheet draws it: a SidePanel may fold it.
      'class="sidebar-collapse-name" data-name="collapse"',
      'class="sidebar-collapse-name" data-name="expand"',
      'aria-haspopup="dialog"',
      'class="kbd sidebar-search-shortcut"',
      'Mod K',
    ],
    ['role="dialog"', 'sidebar-drawer'],
  ],
  [
    // Pure CSS and links: nothing is measured, and the count warning is an effect, which a server never runs.
    'BottomTabBar',
    <BottomTabBar aria-label="Main">
      <BottomTabBarItem href="/" icon={<svg />} isCurrent>
        Home
      </BottomTabBarItem>
      <BottomTabBarItem href="/transactions" icon={<svg />} count={12} countLabel="to review">
        Transactions
      </BottomTabBarItem>
      <BottomTabBarItem href="/goals" icon={<svg />}>
        Goals
      </BottomTabBarItem>
      <BottomTabBarItem icon={<svg />}>More</BottomTabBarItem>
    </BottomTabBar>,
    [
      '<nav',
      'class="tab-bar"',
      'aria-current="page"',
      'class="tab-bar-count"',
      '<button',
      'class="tab-bar-item',
    ],
  ],
  [
    // The image is drawn invisible over the initials; whether it loaded is learned in the browser, never here.
    'Avatar',
    <Avatar name="Ada Lovelace" src="/ada.png" />,
    [
      'class="avatar"',
      'data-size="md"',
      'data-shape="circle"',
      'role="img"',
      'aria-label="Ada Lovelace"',
      'class="avatar-initials"',
      '>AL<',
      'class="avatar-image"',
      'alt=""',
    ],
    ['data-loaded'],
  ],
  [
    // The linked tile is React Aria's Link, rendered in Node with its content; the nested-focusable warning is
    // an effect, which never runs here.
    'StatTile, linked',
    <StatTile
      href="/spending"
      label="Spending"
      value="$1,284.50"
      change={{ direction: 'down', label: 'Down 4% from last month', tone: 'gain' }}
    />,
    ['<a', 'href="/spending"', 'class="stat-tile"', 'data-direction="down"', 'data-tone="gain"'],
  ],
  [
    // A static card whose header holds CardActions with client leaves, a Button and a Link, and whose body is a
    // static list: the leaves render in Node inside the header's markup, after the title and the note.
    'Card with CardActions and a DescriptionList',
    <Card as="section" aria-labelledby="details-title">
      <CardHeader>
        <CardTitle id="details-title" level={3}>
          Details
        </CardTitle>
        <CardNote>Updated from your bank feed</CardNote>
        <CardActions>
          <Button variant="secondary" aria-label="Edit details">
            Edit
          </Button>
          <Link href="/accounts/visa/merge">Merge</Link>
        </CardActions>
      </CardHeader>
      <CardBody>
        <DescriptionList>
          <DescriptionListItem term="Name">Everyday Visa</DescriptionListItem>
          <DescriptionListItem term="Credit limit" isNumeric>
            $5,000.00
          </DescriptionListItem>
        </DescriptionList>
      </CardBody>
    </Card>,
    [
      '<p class="card-note">Updated from your bank feed</p><div class="card-actions"><button',
      'class="button button-secondary"',
      'aria-label="Edit details"',
      'href="/accounts/visa/merge"',
      '</div></div><div class="card-body"><dl class="description-list"',
    ],
    ['role='],
  ],
  [
    // A static gauge in each row of a client DataTable, as the consumer's utilization column draws it: each renders
    // in Node inside its cell, named with its row, its value text beside it.
    'DataTable with a Gauge per row',
    <DataTable
      aria-label="Cards"
      items={[
        { id: 'visa', name: 'Everyday Visa ending 4821', used: 23 },
        { id: 'master', name: 'Travel Mastercard ending 0937', used: 47 },
      ]}
      columns={[
        { id: 'name', header: 'Card', cell: (card) => card.name, isRowHeader: true },
        {
          id: 'utilization',
          header: 'Utilization',
          cell: (card) => (
            <Gauge
              aria-label={`Utilization, ${card.name}`}
              size="sm"
              value={card.used}
              valueLabel={`${String(card.used)}%`}
              tone={card.used > 30 ? 'warning' : 'neutral'}
              marks={[
                { value: 10, label: 'Best under 10%' },
                { value: 30, label: 'Keep it under 30%' },
              ]}
            />
          ),
          textValue: (card) => `${String(card.used)}%`,
        },
      ]}
      getKey={(card) => card.id}
    />,
    [
      '<div class="gauge" data-size="sm" data-form="ring" data-tone="neutral">',
      'aria-label="Utilization, Everyday Visa ending 4821"',
      '<div class="gauge" data-size="sm" data-form="ring" data-tone="warning">',
      'role="meter"',
      'viewBox="0 0 32 32"',
      'style="stroke-dasharray:',
      '<span class="gauge-value-label" aria-hidden="true">47%</span>',
    ],
    ['gauge-figure', 'gauge-label'],
  ],
  [
    // A static list holding a client leaf, React Aria's Link, as a row's action: the leaf renders in Node inside
    // the list's own markup, and an empty and a numeric value are the library's attributes.
    'DescriptionList with a Link as an action',
    <DescriptionList>
      <DescriptionListItem term="Name">Everyday Visa</DescriptionListItem>
      <DescriptionListItem term="Nickname" actions={<Link href="/accounts/visa/nickname">Add</Link>} />
      <DescriptionListItem term="Credit limit" isNumeric>
        $5,000.00
      </DescriptionListItem>
      <DescriptionListItem term="APR" isNumeric>
        24.9%
      </DescriptionListItem>
    </DescriptionList>,
    [
      '<dl class="description-list" data-layout="auto" data-dividers="">',
      '<dd class="description-list-value" data-empty="">Not set</dd>',
      '<dd class="description-list-actions"><a',
      'href="/accounts/visa/nickname"',
      'class="link"',
      '<dd class="description-list-value" data-numeric="">$5,000.00</dd>',
    ],
    ['role='],
  ],
  [
    // Two years of coverage in a client Tabs panel, as the credit tab holds it: the grid, the table and the
    // English summary render in Node with no browser, and nothing reads a locale or a date.
    'MonthGrid in a Tabs panel',
    <Tabs defaultSelectedKey="credit">
      <TabList aria-label="Account">
        <Tab id="details">Details</Tab>
        <Tab id="credit">Credit</Tab>
      </TabList>
      <TabPanel id="credit">
        <MonthGrid
          label="Statement coverage"
          states={COVERAGE_STATES}
          years={COVERAGE_YEARS}
          monthLabels={SHORT_MONTHS}
          monthNames={MONTH_NAMES}
        />
      </TabPanel>
    </Tabs>,
    [
      '<figure aria-labelledby=',
      'class="month-grid"',
      '<div class="month-grid-grid" aria-hidden="true" style="--month-grid-columns:12;--month-grid-half:6">',
      '<span class="month-grid-cell" data-look="empty"></span>',
      '<span class="month-grid-cell" data-look="none"></span>',
      '<caption>Statement coverage</caption>',
      '<th scope="row">2025</th>',
      '-summary">Missing: March and April 2025. Partial: June 2025.</p><div class="month-grid-alternative">',
    ],
  ],
  [
    // The Persian guide's grid: the app's years, months, words and summary, written as given.
    'MonthGrid in Persian',
    <div dir="rtl" lang="fa">
      <MonthGrid
        label="صورت‌حساب‌ها"
        states={PERSIAN_STATES}
        years={PERSIAN_YEARS}
        monthLabels={PERSIAN_SHORT_MONTHS}
        monthNames={PERSIAN_MONTH_NAMES}
        summary={PERSIAN_SUMMARY}
        labels={PERSIAN_LABELS}
      />
    </div>,
    [
      '<span class="month-grid-year">۱۴۰۴</span>',
      '<th scope="col">سال</th>',
      '<td>خارج از بازه</td>',
      `-summary">${PERSIAN_SUMMARY}</p>`,
    ],
    ['Missing', 'every month'],
  ],
  [
    // The selected tab and its panel are in the HTML; the panel of a tab not selected is not mounted. The scroll
    // that brings the selected tab into view is an effect, which never runs here.
    'Tabs',
    <Tabs defaultSelectedKey="income">
      <TabList aria-label="Views">
        <Tab id="all">All</Tab>
        <Tab id="income" isChanged>
          Income
        </Tab>
      </TabList>
      <TabPanel id="all">Everything</TabPanel>
      <TabPanel id="income">Money in</TabPanel>
    </Tabs>,
    [
      'class="tabs"',
      'role="tablist"',
      'class="tab-list"',
      'aria-selected="true"',
      'class="tab-changed"',
      'role="tabpanel"',
      '>Money in<',
    ],
    ['>Everything<'],
  ],
  [
    // Button mode, from a client component: the controls are React Aria's buttons, the status region is empty
    // and nothing is a link.
    'Pagination, buttons',
    <Pagination page={2} pageCount={5} rangeLabel="51 to 100 of 230" onPageChange={() => undefined} />,
    ['<button', 'aria-current="true"', 'role="status"', '>51 to 100 of 230<'],
    ['href='],
  ],
  [
    // The page size picker is a native select in the server's HTML, its label tied to it and the size chosen, so
    // it works before the script; nothing of React Aria's Select or its hidden pass is drawn.
    'Pagination, with a page size picker',
    <Pagination
      page={3}
      pageCount={10}
      rangeLabel="51 to 75 of 240"
      onPageChange={() => undefined}
      pageSize={25}
      onPageSizeChange={() => undefined}
    />,
    [
      '<label class="pagination-size-label" for="',
      '<select id="',
      'class="input pagination-size-select"',
      '<option value="25" selected="">25</option>',
      '<option value="100">100</option>',
      'class="pagination-size-chevron"',
    ],
    ['select-trigger', 'listbox', '<template'],
  ],
  [
    // Every row and its link, the current row, the sort marks, the figures and the totals, from a client
    // component; nothing is busy and the status is empty.
    'DataTable',
    <DataTable
      aria-label="Transactions"
      items={TRANSACTIONS.slice(0, 5)}
      columns={columnsWithTotal(TRANSACTIONS.slice(0, 5))}
      getKey={keyOf}
      getRowHref={hrefOf}
      currentKey="t2"
      sortDescriptor={{ column: 'date', direction: 'descending' }}
      onSortChange={() => undefined}
    />,
    [
      'class="data-table"',
      'role="grid"',
      'aria-sort="descending"',
      'class="link data-table-link"',
      'aria-current="true"',
      'data-current=""',
      '<tfoot',
      'data-align="end"',
      'class="data-table-figure"',
      '>Total<',
    ],
    ['aria-busy'],
  ],
  [
    // The list face after the table's, from a client component: a section per day under its heading, each item
    // with its title, the row's link in it; with selection off, no head above it.
    'DataTable list',
    <DataTable
      aria-label="Transactions"
      items={TRANSACTIONS.slice(0, 5)}
      columns={COLUMNS}
      getKey={keyOf}
      getRowHref={hrefOf}
      getGroup={groupOf}
    />,
    [
      'class="data-table-list"',
      'class="data-table-section"',
      'role="rowgroup"',
      'class="data-table-item"',
      'class="data-table-item-title"',
      '>Monday 12 October<',
    ],
    ['data-table-list-head'],
  ],
  [
    // Loading with no rows: skeleton rows in React Aria's one empty cell, the grid busy, no totals.
    'DataTable loading',
    <DataTable aria-label="Transactions" items={[]} columns={COLUMNS} getKey={keyOf} isLoading />,
    ['aria-busy="true"', 'class="data-table-skeleton-row"', 'class="skeleton"', 'class="data-table-loading"'],
    ['<tfoot', 'aria-selected'],
  ],
  [
    // Two rows selected, from a client component: the checkbox column, the bar with its count and an empty
    // count status; React Aria's 'all' never appears.
    'DataTable selected',
    <DataTable
      aria-label="Transactions"
      items={TRANSACTIONS.slice(0, 5)}
      columns={COLUMNS}
      getKey={keyOf}
      getRowHref={hrefOf}
      selectedKeys={['t1', 't3']}
      onSelectionChange={() => undefined}
      bulkActions={<Button variant="secondary">Categorize</Button>}
    />,
    [
      'aria-multiselectable="true"',
      'aria-label="Select all"',
      'aria-label="Select"',
      'aria-selected="true"',
      'class="data-table-bar"',
      'role="toolbar"',
      'aria-label="Bulk actions"',
      '>2 selected<',
      'class="data-table-status data-table-count"',
    ],
    ["'all'"],
  ],
  [
    // Open, from a client component: the layout, the aside named by its heading, which takes focus, the close
    // button and the footer; nothing of the sheet, which mounts only after hydration under 1024px.
    'SidePanel',
    <SidePanelLayout
      panel={
        <SidePanel
          title="Groceries"
          description="12 October"
          isOpen
          onClose={() => undefined}
          footer={<Button>Save</Button>}
        >
          <p>Corner Mart</p>
        </SidePanel>
      }
    >
      <p>The transactions</p>
    </SidePanelLayout>,
    [
      'class="side-panel-layout"',
      // The stylesheet folds an AppShell's rail beside an open panel from this, before any script runs.
      'class="side-panel-layout" data-collapses-rail=""',
      '<aside',
      'class="side-panel"',
      'aria-labelledby',
      'class="side-panel-title"',
      'tabindex="-1"',
      'aria-label="Close"',
      'class="side-panel-footer"',
    ],
    ['role="dialog"', 'sheet'],
  ],
  [
    // Open in an AppShell with a rail: the server writes no fold, since scripts make it, but the layout's
    // data-collapses-rail and its open aside are what app-shell.css and sidebar.css fold the rail from, under
    // 1440px, before any script runs (spec correction 94).
    'SidePanel in an AppShell',
    <AppShell sidebar={<nav aria-label="Main">rail</nav>}>
      <SidePanelLayout
        panel={
          <SidePanel title="Groceries" isOpen onClose={() => undefined}>
            <p>Corner Mart</p>
          </SidePanel>
        }
      >
        <p>The transactions</p>
      </SidePanelLayout>
    </AppShell>,
    [
      'data-has-sidebar=""',
      'class="side-panel-layout" data-collapses-rail=""',
      '</div><aside class="side-panel"',
    ],
    ['data-sidebar="collapsed"', 'data-sidebar-folded', 'data-sidebar-unfolded'],
  ],
  [
    // The label, the box with both lines, the button and FileTrigger's hidden input, the description and the
    // empty status, so the page is laid out before scripts run; no name, so nothing submits natively.
    'FileDropZone',
    <FileDropZone
      label="Receipts"
      description="PDF, JPG or PNG, up to 10 MB"
      acceptedFileTypes={['application/pdf']}
      allowsMultiple
      onFiles={() => undefined}
    />,
    [
      'class="file-drop-zone field"',
      'role="group"',
      'class="file-drop-zone-box"',
      'class="file-drop-zone-hint"',
      'class="file-drop-zone-drop"',
      'Choose files',
      'type="file"',
      'class="field-description"',
      'role="status"',
    ],
    ['name=', 'data-drop-target'],
  ],
  [
    'FileButton',
    <FileButton capture="environment" onFiles={() => undefined}>
      Take a photo
    </FileButton>,
    ['class="button button-primary', 'type="file"', 'capture="environment"'],
  ],
  [
    // Nothing on the server: the overlay exists only while files are dragged over the page.
    'PageDropZone',
    <div className="host">
      <PageDropZone title="Drop files to upload" onFiles={() => undefined} />
    </div>,
    ['<div class="host"></div>'],
    ['page-drop-zone'],
  ],
  [
    // A plain list, every row with its icon, its name, its words and its buttons; the bars are ProgressBar's.
    'UploadList',
    <UploadList
      aria-label="Uploads"
      items={UPLOADS}
      onRetry={() => undefined}
      onRemove={() => undefined}
      onCancel={() => undefined}
    />,
    [
      'class="upload-list"',
      'data-status="waiting"',
      'data-status="failed"',
      'class="upload-row-stem">invoice</span><span class="upload-row-ext">.pdf</span>',
      'href="/documents/lease"',
      'role="progressbar"',
      '1.8 of 4 MB',
      'aria-label="Retry video.mov"',
    ],
  ],
  [
    // With no items, the empty polite host alone: the faces wait for the app's first item.
    'UploadTray empty',
    <div className="host">
      <UploadTray items={[]} />
    </div>,
    [
      '<div class="host"><div class="upload-tray-status" role="status" aria-live="polite" aria-atomic="true" data-react-aria-top-layer="true"></div></div>',
    ],
    ['upload-tray"', 'upload-tray-bar'],
  ],
  [
    // Items the server already knows: both faces, which a media query picks between, and no offset of its own.
    'UploadTray',
    <UploadTray items={UPLOADS} description="About a minute left" />,
    [
      'class="upload-tray-status"',
      'class="overlay upload-tray"',
      'class="overlay upload-tray-bar"',
      'Uploading 4 of 6',
      'role="region"',
    ],
    ['--upload-tray-offset', 'role="dialog"'],
  ],
  [
    // The bar, the sentence that names it, the chip, the empty polite host and the buttons; no question and no offset.
    'SaveBar',
    <SaveBar
      message="2 changes to Corner Mart, 14 Oct"
      isDirty
      actionLabel="Save"
      onAction={() => undefined}
      onCancel={() => undefined}
    />,
    [
      '<div role="group" aria-labelledby="',
      'class="save-bar">',
      'class="save-bar-message"',
      '>2 changes to Corner Mart, 14 Oct<',
      'class="field-changed save-bar-chip">Unsaved changes<',
      '<div class="save-bar-status" role="status" aria-live="polite" aria-atomic="true" data-tone="neutral"></div>',
      '>Cancel<',
      '>Save<',
    ],
    ['--save-bar-offset', 'alertdialog', 'style='],
  ],
  [
    // Real links, one per crumb above the current page, the current page last; the parent's link holds the phone
    // face's back chevron and words, which the stylesheet draws under 768px.
    'Breadcrumbs',
    <Breadcrumbs>
      <Breadcrumb href="/">Home</Breadcrumb>
      <Breadcrumb href="/documents">Documents</Breadcrumb>
      <Breadcrumb>Receipts, 2026</Breadcrumb>
    </Breadcrumbs>,
    [
      '<nav aria-label="Breadcrumbs" class="breadcrumbs">',
      '<ol class="breadcrumbs-list">',
      '<a class="link breadcrumbs-link"',
      'href="/documents"',
      '<span class="breadcrumbs-current" aria-current="page">',
      '<span class="breadcrumbs-back-words">Back to </span>',
      '<span class="breadcrumbs-text" title="Documents">Documents</span>',
    ],
    ['role="link"', 'aria-disabled', 'data-collection'],
  ],
];

describe('the client components on the server', () => {
  it('has neither a window nor a document, so the renders below prove something', () => {
    expect(typeof window).toBe('undefined');
    expect(typeof document).toBe('undefined');
  });

  it.each(CLIENT)('%s renders to HTML with no browser', (_name, element, contains, excludes = []) => {
    const html = renderToString(element);
    for (const part of contains) expect(html).toContain(part);
    for (const part of excludes) expect(html).not.toContain(part);
  });

  // Prose hands a component back to the layer below its own rules by its root class, from a list core's build
  // writes (insights spec correction 52); a part whose outermost element carries none of them would be drawn by
  // prose's element rules inside a prose box (spec correction 93).
  const roots = proseRoots();
  it.each(CLIENT)('%s has a component root prose hands back on its outermost element', (_name, element) => {
    const classes = outermostClasses(renderToString(element));
    if (classes === null) return;
    expect(
      classes.filter((name) => roots.has(name)),
      classes.join(' '),
    ).not.toEqual([]);
  });

  // React Aria makes a collator while a Select renders, for its closed type-to-select, and while a ComboBox
  // renders, for its filter; it compares and writes nothing, so the HTML is the same in every locale (spec
  // correction 5, risk R1).
  it('renders a Select and a ComboBox to the same HTML in two locales', () => {
    const parts: [name: string, element: ReactElement][] = [
      [
        'Select',
        <Select label="Category" defaultValue="food">
          <PickerOption id="food">Food</PickerOption>
          <PickerOption id="rent">Rent</PickerOption>
        </Select>,
      ],
      [
        // React Aria's ComboBox builds its filter's collator while it renders (ComboBox.mjs:101).
        'ComboBox',
        <ComboBox label="Merchant" defaultValue="cafe">
          <PickerOption id="cafe">Café Luna</PickerOption>
          <PickerOption id="mart">Corner Mart</PickerOption>
        </ComboBox>,
      ],
    ];
    for (const [name, element] of parts) {
      const english = renderToString(<I18nProvider locale="en-US">{element}</I18nProvider>);
      const persian = renderToString(<I18nProvider locale="fa-IR">{element}</I18nProvider>);
      expect(persian, name).toBe(english);
    }
  });

  // React Aria renders a Select's children once more, hidden, to build its collection, and its Popover renders
  // its content there too. Only the options belong in that pass: no filter, so no collator for it, and no
  // focus handling of the library's popover.
  it("keeps a closed Select's filter out of React Aria's hidden pass", () => {
    const html = renderToString(
      <Select label="Category" isFilterable>
        <PickerOption id="food">Food</PickerOption>
        <PickerOption id="rent">Rent</PickerOption>
      </Select>,
    );
    expect(html).toContain('Food');
    for (const part of ['search-field', 'select-filter', 'select-list', 'select-popover']) {
      expect(html, part).not.toContain(part);
    }
  });

  // A closed ComboBox's popover renders its content in the hidden pass too, where only the options belong:
  // no library popover and no list of its own. The options write nothing to the HTML.
  it("keeps a closed ComboBox's popover and list out of React Aria's hidden pass", () => {
    const html = renderToString(
      <ComboBox label="Merchant">
        <PickerOption id="cafe">Café Luna</PickerOption>
        <PickerOption id="mart">Corner Mart</PickerOption>
      </ComboBox>,
    );
    expect(html).toContain('class="input combo-box-input"');
    for (const part of ['menu-popover', 'combo-box-list', 'picker-empty', 'role="listbox"']) {
      expect(html, part).not.toContain(part);
    }
  });

  it('names triggerRef for a Popover opened outside a trigger without one, with no browser', () => {
    expect(() => renderToString(<Popover isOpen>Panel</Popover>)).toThrow(/needs `triggerRef`/);
  });
});
