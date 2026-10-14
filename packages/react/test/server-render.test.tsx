// @vitest-environment node
import type { ReactElement } from 'react';
import { renderToString } from 'react-dom/server';
import { I18nProvider } from 'react-aria-components';
import { describe, expect, it } from 'vitest';
import { AppShell } from '../src/app-shell';
import { Avatar } from '../src/avatar';
import { StatTile } from '../src/stat-tile';
import { BottomTabBar, BottomTabBarItem } from '../src/bottom-tab-bar';
import { Button } from '../src/button';
import { Checkbox, CheckboxGroup } from '../src/checkbox';
import { CollapsibleCard } from '../src/collapsible-card';
import { ComboBox } from '../src/combo-box';
import { CommandPalette } from '../src/command-palette';
import { ConfirmDialog, Dialog, DialogTrigger } from '../src/dialog';
import { Drawer } from '../src/drawer';
import { IconButton } from '../src/icon-button';
import { Link } from '../src/link';
import { Menu, MenuItem, MenuTrigger } from '../src/menu';
import { Shortcut } from '../src/overlay/Shortcut';
import { PickerOption } from '../src/picker';
import { Popover } from '../src/popover';
import { Radio, RadioGroup } from '../src/radio-group';
import { SearchField } from '../src/search-field';
import { SegmentedControl, SegmentedControlItem } from '../src/segmented-control';
import { Select } from '../src/select';
import { Sheet, SheetTrigger } from '../src/sheet';
import {
  Sidebar,
  SidebarBrand,
  SidebarGroup,
  SidebarItem,
  SidebarSearch,
  SidebarTrigger,
} from '../src/sidebar';
import { Spinner } from '../src/spinner';
import { Switch } from '../src/switch';
import { TextArea } from '../src/text-area';
import { TextField } from '../src/text-field';
import { ToastRegion } from '../src/toast';
import { Tooltip, TooltipTrigger } from '../src/tooltip';

/**
 * The client components, rendered on the server. A Next.js server page imports them as client references and
 * the server renders them once to HTML before the browser takes over, so each must render with no window, no
 * document and no layout. This file runs in Node, which has none of the three: a component that reads one
 * while it renders throws here. (Effects and observers do not run during a server render, so they may.)
 *
 * An overlay renders nothing until it opens, so its row also names what must stay out of the HTML: closed, a
 * dialog draws its trigger and none of its own parts.
 */
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
      'aria-expanded="true"',
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
