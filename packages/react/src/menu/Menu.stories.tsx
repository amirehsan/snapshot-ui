import type { Meta, StoryObj } from '@storybook/react-vite';
import { Copy, Ellipsis, LogOut, Pencil, Settings, User } from 'lucide-react';
import type { ReactElement } from 'react';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { Button } from '../button';
import { Card, CardBody } from '../card';
import { Dialog, DialogTrigger } from '../dialog';
import { IconButton } from '../icon-button';
import { tokenColor, washColor } from '../stories/paint';
import { Menu, MenuTrigger, type MenuProps } from './Menu';
import { MenuItem } from './MenuItem';
import { MenuSection } from './MenuSection';
import { MenuSeparator } from './MenuSeparator';

/** The one element on the page that matches `selector`, wherever the overlay portaled it. */
function only(selector: string): HTMLElement {
  const found = document.querySelectorAll<HTMLElement>(selector);
  const [first] = found;
  if (found.length !== 1 || !first)
    throw new Error(`Expected one ${selector}, found ${String(found.length)}`);
  return first;
}

/**
 * Resolves once the open menu's popover has been placed and has entered, and every transition on it has
 * finished, so a play reads its boxes at rest.
 */
async function atRest(): Promise<HTMLElement> {
  const popover = await waitFor(async () => {
    const found = only('.menu-popover');
    await expect(found).toHaveAttribute('data-placement');
    await expect(found).not.toHaveAttribute('data-entering');
    return found;
  });
  await Promise.all(
    popover.getAnimations({ subtree: true }).map((animation) => animation.finished.catch(() => null)),
  );
  return popover;
}

/** The menu item with this name, whichever of the three item roles its menu's selection gives it. */
function item(name: string): HTMLElement {
  for (const role of ['menuitem', 'menuitemradio', 'menuitemcheckbox'] as const) {
    const found = within(document.body).queryByRole(role, { name });
    if (found) return found;
  }
  throw new Error(`No menu item named ${name}`);
}

/** An account menu: icons, a key, a description, a disabled item, a section, a rule and a danger item. */
const ACCOUNT = (
  <>
    <MenuSection title="Ada Lovelace">
      <MenuItem id="profile" icon={<User />}>
        Profile
      </MenuItem>
      <MenuItem id="settings" icon={<Settings />} description="Account and billing" shortcut="Mod ,">
        Settings
      </MenuItem>
      <MenuItem id="duplicate" icon={<Copy />} isDisabled>
        Duplicate workspace
      </MenuItem>
    </MenuSection>
    <MenuSeparator />
    <MenuItem id="logout" icon={<LogOut />} shortcut="Q" variant="danger">
      Log out
    </MenuItem>
  </>
);

/** An icon button and its menu, open on the first render. */
function Opened({ children = ACCOUNT, ...args }: Partial<MenuProps<object>>): ReactElement {
  return (
    <MenuTrigger defaultOpen>
      <IconButton aria-label="More" variant="outline">
        <Ellipsis />
      </IconButton>
      <Menu {...args}>{children}</Menu>
    </MenuTrigger>
  );
}

/** A theme menu in single selection, "Dark" chosen. */
const THEMES = (
  <MenuSection title="Theme" selectionMode="single" defaultSelectedKeys={['dark']}>
    <MenuItem id="light">Light</MenuItem>
    <MenuItem id="dark">Dark</MenuItem>
    <MenuItem id="system" description="Follows the device">
      System
    </MenuItem>
  </MenuSection>
);

/** What a view shows, in multiple selection, two of three on. */
const TOGGLES = (
  <MenuSection title="Show" selectionMode="multiple" defaultSelectedKeys={['grid', 'rulers']}>
    <MenuItem id="grid">Grid</MenuItem>
    <MenuItem id="rulers">Rulers</MenuItem>
    <MenuItem id="guides">Guides</MenuItem>
  </MenuSection>
);

/**
 * Axe's label-in-name check, skipped on menu rows alone. A row is named by its label and described by its
 * second line and its key chip, through the ids React Aria gives them, so a screen reader hears "Settings"
 * and then "Account and billing, Command comma", and a voice user says the label. The check asks for every
 * visible word in the name, the description and the key included; WCAG 2.5.3 asks it of the label. Every
 * other rule, and this one everywhere else on the page, still runs. Recorded in docs/design-system.md
 * ("Menu").
 */
const MENU_ROW_A11Y = {
  config: { rules: [{ id: 'label-content-name-mismatch', selector: '*:not(.menu-item)' }] },
};

const meta = {
  title: 'Components/Menu',
  component: Menu,
  parameters: {
    // Every story opens a menu, and a docs page that drew them inline would open them all at once.
    docs: { story: { inline: false, height: '480px' } },
    a11y: MENU_ROW_A11Y,
  },
} satisfies Meta<typeof Menu>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * An account menu under its button: icons at the start, a key chip at the end, a description, a disabled
 * item, a section heading, a rule and a danger item last. Opened by its default, React Aria focuses the list
 * itself, so no row looks chosen until the pointer or the keyboard picks one.
 */
export const Basic: Story = {
  render: (args) => <Opened {...args} />,
  play: async () => {
    const popover = await atRest();
    const menu = within(document.body).getByRole('menu', { name: 'More' });
    await waitFor(() => expect(menu).toHaveFocus());
    await expect(popover.querySelector('.menu-item[data-focused]')).toBeNull();
    for (const row of popover.querySelectorAll('.menu-item')) {
      await expect(row.getBoundingClientRect().height).toBeGreaterThanOrEqual(40);
    }
    await expect(['\u2318 ,', 'Ctrl ,']).toContain(item('Settings').querySelector('kbd')?.textContent);
    const rem = parseFloat(getComputedStyle(document.documentElement).fontSize);
    await expect(popover.getBoundingClientRect().width).toBeGreaterThanOrEqual(12 * rem);
    await expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(window.innerWidth);
  },
};

/** A single selection is the ink pill with a canvas check; every row keeps the check's room. */
export const SingleSelection: Story = {
  render: (args) => <Opened {...args}>{THEMES}</Opened>,
  play: async () => {
    await atRest();
    const dark = item('Dark');
    await expect(getComputedStyle(dark).backgroundColor).toBe(tokenColor('--color-ink'));
    const label = dark.querySelector('.menu-item-label');
    if (!label) throw new Error('No label');
    await expect(getComputedStyle(label).color).toBe(tokenColor('--color-canvas'));
    for (const name of ['Light', 'Dark', 'System']) {
      const check = item(name).querySelector('.menu-item-check');
      if (!check) throw new Error(`No check on ${name}`);
      await expect(getComputedStyle(check).visibility).toBe(name === 'Dark' ? 'visible' : 'hidden');
    }
    // The room is kept, so the rows are as wide as each other.
    await expect(item('Light').getBoundingClientRect().width).toBe(
      item('Dark').getBoundingClientRect().width,
    );
  },
};

/** A multiple selection is the check alone: no row is filled, and two checks show. */
export const MultipleSelection: Story = {
  render: (args) => <Opened {...args}>{TOGGLES}</Opened>,
  play: async () => {
    await atRest();
    for (const name of ['Grid', 'Rulers']) {
      await expect(getComputedStyle(item(name)).backgroundColor, name).toBe('rgba(0, 0, 0, 0)');
    }
    const visible = within(document.body)
      .getAllByRole('menuitemcheckbox')
      .filter((row) => {
        const check = row.querySelector('.menu-item-check');
        return check !== null && getComputedStyle(check).visibility === 'visible';
      });
    await expect(visible.map((row) => row.textContent)).toEqual(['Grid', 'Rulers']);
  },
};

/** The second row, reached by Arrow Down: the wash and the inset focus ring. */
export const KeyboardFocus: Story = {
  render: (args) => <Opened {...args} />,
  play: async () => {
    await atRest();
    const menu = within(document.body).getByRole('menu');
    await waitFor(() => expect(menu).toHaveFocus());
    await userEvent.keyboard('{ArrowDown}{ArrowDown}');
    const settings = item('Settings');
    await waitFor(() => expect(settings).toHaveFocus());
    await expect(settings).toHaveAttribute('data-focus-visible', 'true');
    const style = getComputedStyle(settings);
    await expect(parseFloat(style.outlineOffset)).toBeLessThan(0);
    await expect(style.outlineStyle).toBe('solid');
    await expect(style.backgroundColor).toBe(washColor());
  },
};

/**
 * A menu opened from a trigger in a dark card is dark while the page is light, as its popover takes the
 * scope of the trigger React Aria hands it.
 */
export const InDarkScope: Story = {
  render: (args) => (
    <div
      data-theme="dark"
      data-testid="dark-scope"
      style={{ padding: 24, borderRadius: 'var(--radius-stadium)', background: 'var(--color-canvas)' }}
    >
      <Card>
        <CardBody>
          <p>A card in a dark block.</p>
          <div>
            <Opened {...args}>{THEMES}</Opened>
          </div>
        </CardBody>
      </Card>
    </div>
  ),
  play: async ({ canvas }) => {
    const popover = await atRest();
    await expect(popover).toHaveAttribute('data-theme', 'dark');
    const scope = canvas.getByTestId('dark-scope');
    await expect(getComputedStyle(popover).backgroundColor).toBe(tokenColor('--color-float', scope));
    await expect(getComputedStyle(item('Dark')).backgroundColor).toBe(tokenColor('--color-ink', scope));
  },
};

/**
 * Every key, from the keyboard alone: Arrow Down opens on the first row, Arrow Up from it stays, End and
 * Home jump, a letter moves to the row it starts, Tab stays inside, Escape closes and gives focus back,
 * and Arrow Up opens on the last row.
 */
export const Keys: Story = {
  tags: ['no-visual'],
  render: (args) => (
    <MenuTrigger>
      <Button variant="secondary">Account</Button>
      <Menu {...args}>{ACCOUNT}</Menu>
    </MenuTrigger>
  ),
  play: async ({ canvas }) => {
    const trigger = canvas.getByRole('button', { name: 'Account' });
    await userEvent.tab();
    await expect(trigger).toHaveFocus();
    await userEvent.keyboard('{ArrowDown}');
    await waitFor(() => expect(item('Profile')).toHaveFocus());
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    await userEvent.keyboard('{ArrowUp}');
    await expect(item('Profile')).toHaveFocus();
    await userEvent.keyboard('{End}');
    await expect(item('Log out')).toHaveFocus();
    await userEvent.keyboard('{Home}');
    await expect(item('Profile')).toHaveFocus();
    await userEvent.keyboard('s');
    await expect(item('Settings')).toHaveFocus();
    // React Aria holds focus in the open menu's popover, so Tab stays on the row.
    await userEvent.tab();
    await expect(item('Settings')).toHaveFocus();
    await expect(within(document.body).getByRole('menu')).toBeInTheDocument();
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(within(document.body).queryByRole('menu')).not.toBeInTheDocument());
    await waitFor(() => expect(trigger).toHaveFocus());
    await userEvent.keyboard('{ArrowUp}');
    await waitFor(() => expect(item('Log out')).toHaveFocus());
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(trigger).toHaveFocus());
  },
};

/**
 * The pointer: a hovered row takes the wash and no ring, a danger row keeps its error icon, a choice in single
 * mode closes the menu and a choice in multiple mode leaves it open.
 */
export const PointerWash: Story = {
  tags: ['no-visual'],
  render: (args) => (
    <MenuTrigger>
      <Button variant="secondary">View</Button>
      <Menu {...args}>
        {THEMES}
        <MenuSeparator />
        {TOGGLES}
        <MenuSeparator />
        <MenuItem id="reset" icon={<LogOut />} variant="danger">
          Reset the view
        </MenuItem>
      </Menu>
    </MenuTrigger>
  ),
  play: async ({ canvas }) => {
    const trigger = canvas.getByRole('button', { name: 'View' });
    await userEvent.click(trigger);
    await atRest();
    const light = item('Light');
    await userEvent.hover(light);
    await waitFor(() => expect(light).toHaveAttribute('data-focused', 'true'));
    await expect(light).not.toHaveAttribute('data-focus-visible');
    await expect(getComputedStyle(light).backgroundColor).toBe(washColor());
    await expect(getComputedStyle(light).outlineStyle).toBe('none');
    const reset = item('Reset the view');
    await userEvent.hover(reset);
    await waitFor(() => expect(reset).toHaveAttribute('data-focused', 'true'));
    const icon = reset.querySelector('.menu-item-icon');
    if (!icon) throw new Error('No icon');
    await expect(getComputedStyle(icon).color).toBe(tokenColor('--color-error'));
    await userEvent.click(light);
    await waitFor(() => expect(within(document.body).queryByRole('menu')).not.toBeInTheDocument());

    await userEvent.click(trigger);
    await atRest();
    await userEvent.click(item('Guides'));
    await expect(item('Guides')).toHaveAttribute('aria-checked', 'true');
    await expect(within(document.body).getByRole('menu')).toBeInTheDocument();
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(within(document.body).queryByRole('menu')).not.toBeInTheDocument());
  },
};

/**
 * Rows grow to 44px under a coarse pointer. The browser here has a fine one, so the rule is found in the
 * stylesheet and the row measured at its 40px floor; the docs test measures 44px on a touch screen.
 */
export const TouchRows: Story = {
  tags: ['no-visual'],
  render: (args) => <Opened {...args} />,
  play: async () => {
    await atRest();
    const coarse: CSSRule[] = [];
    const walk = (rules: CSSRuleList): void => {
      for (const rule of rules) {
        if (rule instanceof CSSMediaRule && rule.conditionText.includes('pointer: coarse')) coarse.push(rule);
        if ('cssRules' in rule) walk((rule as CSSGroupingRule).cssRules);
      }
    };
    for (const sheet of document.styleSheets) walk(sheet.cssRules);
    const touchRow = coarse
      .flatMap((rule) => [...(rule as CSSMediaRule).cssRules])
      .find((rule) => rule instanceof CSSStyleRule && rule.selectorText === '.menu-item');
    await expect(touchRow).toBeDefined();
    await expect((touchRow as CSSStyleRule).style.minHeight).toBe('44px');
    await expect(item('Profile').getBoundingClientRect().height).toBeGreaterThanOrEqual(40);
  },
};

/**
 * A long menu under a short height cap scrolls in one place, the list, and the popover around it does not
 * scroll as well: no second scrollbar.
 */
export const LongMenu: Story = {
  tags: ['no-visual'],
  render: (args) => (
    <Opened {...args}>
      {Array.from({ length: 40 }, (_, index) => (
        <MenuItem key={index} id={`project-${String(index + 1)}`}>
          {`Project ${String(index + 1)}`}
        </MenuItem>
      ))}
    </Opened>
  ),
  play: async () => {
    const popover = await atRest();
    const menu = within(document.body).getByRole('menu');
    // The cap is the room React Aria leaves under the trigger, far less than forty rows.
    await expect(popover.getBoundingClientRect().bottom).toBeLessThanOrEqual(window.innerHeight);
    // Every element that could scroll, by its overflow, and of those the ones with more to show than room.
    const scrollers = [popover, ...popover.querySelectorAll<HTMLElement>('*')].filter((element) => {
      const { overflowY } = getComputedStyle(element);
      return (overflowY === 'auto' || overflowY === 'scroll') && element.scrollHeight > element.clientHeight;
    });
    await expect(scrollers).toEqual([menu]);
    await expect(popover.scrollHeight).toBeLessThanOrEqual(popover.clientHeight);
  },
};

/**
 * A menu opened from inside a dialog sits above it, at React Aria's inline z-index, and Escape closes the
 * menu and leaves the dialog open.
 */
export const FromADialog: Story = {
  tags: ['no-visual'],
  render: (args) => (
    <DialogTrigger defaultOpen>
      <Button variant="secondary">Edit the project</Button>
      <Dialog title="Edit the project" description="Rename it or make a copy.">
        <MenuTrigger>
          <Button variant="secondary">Actions</Button>
          <Menu {...args}>
            <MenuItem id="rename" icon={<Pencil />}>
              Rename
            </MenuItem>
            <MenuItem id="duplicate" icon={<Copy />}>
              Duplicate
            </MenuItem>
          </Menu>
        </MenuTrigger>
      </Dialog>
    </DialogTrigger>
  ),
  play: async () => {
    const body = within(document.body);
    const dialog = await body.findByRole('dialog', { name: 'Edit the project' });
    await userEvent.click(body.getByRole('button', { name: 'Actions' }));
    const popover = await atRest();
    await expect(popover.style.zIndex).toBe('100000');
    const box = popover.getBoundingClientRect();
    const hit = document.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2);
    await expect(popover).toContainElement(hit as HTMLElement);
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(body.queryByRole('menu')).not.toBeInTheDocument());
    await expect(dialog).toBeInTheDocument();
    await waitFor(() => expect(body.getByRole('button', { name: 'Actions' })).toHaveFocus());
  },
};
