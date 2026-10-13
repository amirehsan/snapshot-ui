// @vitest-environment node
import type { ReactElement } from 'react';
import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { Button } from '../src/button';
import { Checkbox, CheckboxGroup } from '../src/checkbox';
import { CollapsibleCard } from '../src/collapsible-card';
import { ConfirmDialog, Dialog, DialogTrigger } from '../src/dialog';
import { Drawer } from '../src/drawer';
import { IconButton } from '../src/icon-button';
import { Link } from '../src/link';
import { Menu, MenuItem, MenuTrigger } from '../src/menu';
import { Popover } from '../src/popover';
import { Radio, RadioGroup } from '../src/radio-group';
import { SegmentedControl, SegmentedControlItem } from '../src/segmented-control';
import { Sheet, SheetTrigger } from '../src/sheet';
import { Spinner } from '../src/spinner';
import { Switch } from '../src/switch';
import { TextArea } from '../src/text-area';
import { TextField } from '../src/text-field';
import { ToastRegion } from '../src/toast';

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
    // The polite status host is in the page's HTML, empty, before any toast; React Aria's region mounts in the
    // browser with the first toast.
    'ToastRegion',
    <ToastRegion />,
    ['class="toast-status-host"', 'role="status"', 'aria-live="polite"', 'data-react-aria-top-layer'],
    ['toast-region'],
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
});
