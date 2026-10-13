import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef, type ReactElement } from 'react';
import { RouterProvider } from 'react-aria-components';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { expectNoA11yViolations } from '../../test/a11y';
import * as library from '../index';
import { AppShell, type AppShellProps } from '../app-shell';
import {
  Sidebar,
  SidebarBrand,
  SidebarGroup,
  SidebarItem,
  SidebarSearch,
  SidebarTrigger,
  useSidebar,
  type SidebarProps,
} from '.';

/** A stand-in icon: the parts hide it from assistive technology. */
const Icon = (): ReactElement => <svg data-testid="icon" />;

/** Reports what `useSidebar()` says in the copy of the rail it is rendered in. */
function Probe(): ReactElement {
  const { isCollapsed, inDrawer } = useSidebar();
  return (
    <span data-testid="sidebar-probe" data-collapsed={String(isCollapsed)} data-drawer={String(inDrawer)} />
  );
}

/** Two groups: Overview, current, with Home current and Transactions counted; Settings with Account. */
const GROUPS = (
  <>
    <SidebarGroup label="Overview" isCurrent>
      <SidebarItem href="#home" icon={<Icon />} isCurrent>
        Home
      </SidebarItem>
      <SidebarItem href="#transactions" icon={<Icon />} count={12} countLabel="to review">
        Transactions
      </SidebarItem>
    </SidebarGroup>
    <SidebarGroup label="Settings">
      <SidebarItem href="#account" icon={<Icon />}>
        Account
      </SidebarItem>
    </SidebarGroup>
  </>
);

type NavProps = Partial<Omit<SidebarProps, 'aria-label' | 'aria-labelledby'>> & {
  'aria-label'?: string;
  'aria-labelledby'?: string;
};

/** A full rail named Main: the brand, the search with its shortcut, the groups and a footer probe. */
function Nav({
  brand = (
    <SidebarBrand href="#home" mark={<Icon />}>
      Snapshot
    </SidebarBrand>
  ),
  search = <SidebarSearch shortcut="Mod K">Search or jump to</SidebarSearch>,
  footer = <Probe />,
  children = GROUPS,
  ...props
}: NavProps): ReactElement {
  const name =
    props['aria-labelledby'] === undefined
      ? { 'aria-label': props['aria-label'] ?? 'Main' }
      : { 'aria-labelledby': props['aria-labelledby'] };
  return (
    <Sidebar {...props} {...name} brand={brand} search={search} footer={footer}>
      {children}
    </Sidebar>
  );
}

/** The shell with the rail and a header holding the trigger. */
function Shell({
  sidebar = <Nav />,
  header = <SidebarTrigger />,
  ...props
}: Partial<AppShellProps>): ReactElement {
  return (
    <AppShell sidebar={sidebar} header={header} {...props}>
      {props.children ?? <p>The page</p>}
    </AppShell>
  );
}

/** The rail copy, the one that never sits in the drawer. */
function rail(container: HTMLElement): HTMLElement {
  const element = container.querySelector<HTMLElement>('.sidebar:not(.sidebar-drawer)');
  if (!element) throw new Error('No rail');
  return element;
}

/** The drawer copy, which only exists while the drawer is open. */
function drawerCopy(): HTMLElement {
  const element = document.querySelector<HTMLElement>('.sidebar.sidebar-drawer');
  if (!element) throw new Error('No drawer copy');
  return element;
}

/** The shell's root. */
function shellRoot(container: HTMLElement): HTMLElement {
  const element = container.querySelector<HTMLElement>('.app-shell');
  if (!element) throw new Error('No shell');
  return element;
}

describe('Sidebar', () => {
  it('names its nav by aria-label, and each list by its group label, which is a paragraph', () => {
    const { container } = render(<Shell />);
    const nav = within(rail(container)).getByRole('navigation', { name: 'Main' });
    expect(nav).toHaveClass('sidebar-nav');
    expect(within(nav).getByRole('list', { name: 'Overview' })).toHaveClass('sidebar-list');
    expect(within(nav).getByRole('list', { name: 'Settings' })).toHaveClass('sidebar-list');
    const label = within(nav).getByText('Overview').closest('.sidebar-group-label');
    expect(label?.tagName).toBe('P');
    expect(within(nav).queryAllByRole('heading')).toHaveLength(0);
  });

  it('names its nav by aria-labelledby when given that instead', () => {
    const { container } = render(
      <>
        <span id="rail-name">Workspace</span>
        <Shell sidebar={<Nav aria-labelledby="rail-name" />} />
      </>,
    );
    expect(within(rail(container)).getByRole('navigation')).toHaveAccessibleName('Workspace');
  });

  it('draws the head, the collapse button, the search, the nav and the footer in that order', () => {
    const { container } = render(<Shell />);
    expect([...rail(container).children].map((child) => child.className)).toEqual([
      'sidebar-head',
      'sidebar-collapse',
      'sidebar-search',
      'sidebar-nav',
      'sidebar-footer',
    ]);
    const group = rail(container).querySelector('.sidebar-group');
    expect(group).toHaveAttribute('data-current');
    expect(rail(container).querySelectorAll('.sidebar-group')[1]).not.toHaveAttribute('data-current');
    const item = within(rail(container)).getByRole('link', { name: 'Home' });
    expect(item.tagName).toBe('A');
    expect(item.parentElement?.tagName).toBe('LI');
    expect(item.querySelector('.sidebar-item-icon')).toHaveAttribute('aria-hidden', 'true');
    expect(item.querySelector('.sidebar-item-label')).toHaveTextContent('Home');
  });

  it('marks an item current with aria-current="page" and data-current only when isCurrent', () => {
    const { container } = render(
      <Shell
        sidebar={
          <Nav>
            <SidebarGroup label="Overview">
              <SidebarItem href="#home" icon={<Icon />} isCurrent>
                Home
              </SidebarItem>
              <SidebarItem href="#goals" icon={<Icon />} isCurrent={false}>
                Goals
              </SidebarItem>
              <SidebarItem href="#reports" icon={<Icon />}>
                Reports
              </SidebarItem>
            </SidebarGroup>
          </Nav>
        }
      />,
    );
    const nav = within(rail(container));
    const home = nav.getByRole('link', { name: 'Home' });
    expect(home).toHaveAttribute('aria-current', 'page');
    expect(home).toHaveAttribute('data-current');
    for (const name of ['Goals', 'Reports']) {
      const item = nav.getByRole('link', { name });
      expect(item, name).not.toHaveAttribute('aria-current');
      expect(item, name).not.toHaveAttribute('data-current');
    }
  });

  it('names a counted item "Transactions, 12 to review", with the number shown and the words hidden', () => {
    const { container } = render(<Shell />);
    const item = within(rail(container)).getByRole('link', { name: 'Transactions, 12 to review' });
    // The comma ends the label, drawn at no size by sidebar.css, so a browser adds no space before it.
    expect(item.querySelector('.sidebar-item-label .sidebar-comma')).toHaveTextContent(',');
    const count = item.querySelector('.sidebar-item-count');
    expect(count?.querySelector('.sidebar-item-count-number')).toHaveTextContent('12');
    expect(count?.querySelector('.sidebar-item-count-number')).toBeVisible();
    // Visually hidden: React Aria's VisuallyHidden clips the box, so the words have no area to show in.
    const words = [...(count?.children ?? [])].find((child) => child.textContent === 'to review');
    expect(words).toBeDefined();
    expect((words as HTMLElement).style.clipPath).toBe('inset(50%)');
    // An item with no count has no comma.
    expect(
      within(rail(container)).getByRole('link', { name: 'Account' }).querySelector('.sidebar-comma'),
    ).toBeNull();
  });

  it('collapses through its button, which names what it does and points at the rail', async () => {
    const user = userEvent.setup();
    const { container } = render(<Shell />);
    const button = within(rail(container)).getByRole('button', { name: 'Collapse the menu' });
    expect(button).toHaveAttribute('aria-expanded', 'true');
    expect(button).toHaveAttribute('aria-controls', rail(container).id);
    expect(rail(container).id).not.toBe('');
    await user.click(button);
    expect(button).toHaveAccessibleName('Expand the menu');
    expect(button).toHaveAttribute('aria-expanded', 'false');
    expect(shellRoot(container)).toHaveAttribute('data-sidebar', 'collapsed');
    await user.click(button);
    expect(button).toHaveAccessibleName('Collapse the menu');
    expect(shellRoot(container)).not.toHaveAttribute('data-sidebar');
  });

  it('replaces the collapse button names with collapseLabel and expandLabel', async () => {
    const user = userEvent.setup();
    const { container } = render(<Shell sidebar={<Nav collapseLabel="Fold" expandLabel="Unfold" />} />);
    const button = within(rail(container)).getByRole('button', { name: 'Fold' });
    await user.click(button);
    expect(button).toHaveAccessibleName('Unfold');
  });

  it('keeps every name and every tab stop while collapsed', async () => {
    const user = userEvent.setup();
    const { container } = render(<Shell defaultSidebarCollapsed />);
    const nav = within(rail(container));
    expect(nav.getByRole('link', { name: 'Snapshot' })).toHaveClass('sidebar-brand');
    expect(nav.getByRole('button', { name: /^Search or jump to/ })).toHaveClass('sidebar-search');
    const items = ['Home', 'Transactions, 12 to review', 'Account'].map((name) =>
      nav.getByRole('link', { name }),
    );
    const visited: Element[] = [];
    for (let step = 0; step < 12; step += 1) {
      await user.tab();
      if (document.activeElement) visited.push(document.activeElement);
    }
    for (const item of items) expect(visited).toContain(item);
  });

  it('walks the brand, the collapse button, the search, the items and the footer in order with Tab', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <Shell header={false} sidebar={<Nav footer={<button type="button">Ada Lovelace</button>} />} />,
    );
    const nav = within(rail(container));
    await user.tab(); // the skip link
    const expected = [
      nav.getByRole('link', { name: 'Snapshot' }),
      nav.getByRole('button', { name: 'Collapse the menu' }),
      nav.getByRole('button', { name: /^Search or jump to/ }),
      nav.getByRole('link', { name: 'Home' }),
      nav.getByRole('link', { name: 'Transactions, 12 to review' }),
      nav.getByRole('link', { name: 'Account' }),
      nav.getByRole('button', { name: 'Ada Lovelace' }),
    ];
    for (const element of expected) {
      await user.tab();
      expect(element).toHaveFocus();
    }
  });

  it('opens the drawer copy in a dialog named Menu, with the current item focused', async () => {
    render(<Shell defaultDrawerOpen />);
    const dialog = screen.getByRole('dialog', { name: 'Menu' });
    expect(dialog).toContainElement(drawerCopy());
    expect(drawerCopy()).toHaveClass('sidebar', 'sidebar-drawer');
    expect(document.querySelector('.sidebar-drawer-panel')).toContainElement(dialog);
    await waitFor(() => {
      expect(within(drawerCopy()).getByRole('link', { name: 'Home' })).toHaveFocus();
    });
  });

  it('names the drawer with drawerLabel and its close button with closeLabel', () => {
    render(<Shell defaultDrawerOpen sidebar={<Nav drawerLabel="Navigation" closeLabel="Done" />} />);
    const dialog = screen.getByRole('dialog', { name: 'Navigation' });
    expect(within(dialog).getByRole('button', { name: 'Done' })).toHaveClass('icon-button', 'sidebar-close');
  });

  it('closes the drawer from its close button, which sits in the head and only in the drawer', async () => {
    const user = userEvent.setup();
    const onDrawerOpenChange = vi.fn();
    const { container } = render(<Shell defaultDrawerOpen onDrawerOpenChange={onDrawerOpenChange} />);
    expect(rail(container).querySelector('.sidebar-close')).toBeNull();
    const close = within(drawerCopy()).getByRole('button', { name: 'Close menu' });
    expect(close.parentElement).toHaveClass('sidebar-head');
    await user.click(close);
    expect(onDrawerOpenChange).toHaveBeenCalledWith(false);
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).toBeNull();
    });
  });

  it('closes the drawer when any item in it is pressed, the page already open included', async () => {
    const user = userEvent.setup();
    for (const name of ['Account', 'Home']) {
      const onDrawerOpenChange = vi.fn();
      const onPress = vi.fn();
      const { unmount } = render(
        <Shell
          defaultDrawerOpen
          onDrawerOpenChange={onDrawerOpenChange}
          sidebar={
            <Nav>
              <SidebarGroup label="Overview">
                <SidebarItem href="#home" icon={<Icon />} isCurrent onPress={onPress}>
                  Home
                </SidebarItem>
                <SidebarItem href="#account" icon={<Icon />} onPress={onPress}>
                  Account
                </SidebarItem>
              </SidebarGroup>
            </Nav>
          }
        />,
      );
      await user.click(within(drawerCopy()).getByRole('link', { name }));
      expect(onPress, name).toHaveBeenCalledTimes(1);
      expect(onDrawerOpenChange, name).toHaveBeenCalledWith(false);
      unmount();
    }
  });

  it('closes the drawer on Escape', async () => {
    const user = userEvent.setup();
    const onDrawerOpenChange = vi.fn();
    render(<Shell defaultDrawerOpen onDrawerOpenChange={onDrawerOpenChange} />);
    await waitFor(() => {
      expect(within(drawerCopy()).getByRole('link', { name: 'Home' })).toHaveFocus();
    });
    await user.keyboard('{Escape}');
    expect(onDrawerOpenChange).toHaveBeenCalledWith(false);
  });

  it('never collapses the drawer copy, whatever data-sidebar says above it, on <html> included', () => {
    document.documentElement.dataset.sidebar = 'collapsed';
    try {
      const { container } = render(<Shell defaultDrawerOpen defaultSidebarCollapsed />);
      expect(drawerCopy().querySelector('.sidebar-collapse')).toBeNull();
      const inDrawer = within(drawerCopy()).getByTestId('sidebar-probe');
      expect(inDrawer).toHaveAttribute('data-collapsed', 'false');
      expect(inDrawer).toHaveAttribute('data-drawer', 'true');
      const inRail = rail(container).querySelector('[data-testid="sidebar-probe"]');
      expect(inRail).toHaveAttribute('data-collapsed', 'true');
      expect(inRail).toHaveAttribute('data-drawer', 'false');
    } finally {
      delete document.documentElement.dataset.sidebar;
    }
  });

  it('gives the drawer copy ids of its own, and puts the rail id on the rail alone', () => {
    const { container } = render(<Shell defaultDrawerOpen sidebar={<Nav id="app-rail" />} />);
    expect(rail(container)).toHaveAttribute('id', 'app-rail');
    expect(document.querySelectorAll('#app-rail')).toHaveLength(1);
    expect(drawerCopy()).not.toHaveAttribute('id');
    const railLabels = [...rail(container).querySelectorAll('.sidebar-group-label')].map((label) => label.id);
    const drawerLabels = [...drawerCopy().querySelectorAll('.sidebar-group-label')].map((label) => label.id);
    expect(railLabels).toHaveLength(2);
    for (const id of [...railLabels, ...drawerLabels])
      expect(document.querySelectorAll(`[id="${id}"]`)).toHaveLength(1);
    expect(within(drawerCopy()).getByRole('list', { name: 'Overview' })).toBeInTheDocument();
  });

  it('navigates through RouterProvider, with the routerOptions given', async () => {
    const user = userEvent.setup();
    const navigate = vi.fn();
    const { container } = render(
      <RouterProvider navigate={navigate}>
        <Shell
          sidebar={
            <Nav>
              <SidebarGroup label="Overview">
                <SidebarItem href="/transactions" icon={<Icon />} routerOptions={{ scroll: false } as never}>
                  Transactions
                </SidebarItem>
              </SidebarGroup>
            </Nav>
          }
        />
      </RouterProvider>,
    );
    await user.click(within(rail(container)).getByRole('link', { name: 'Transactions' }));
    expect(navigate).toHaveBeenCalledWith('/transactions', { scroll: false });
  });

  it('hands its anchor to a render prop', () => {
    const { container } = render(
      <Shell
        sidebar={
          <Nav>
            <SidebarGroup label="Overview">
              <SidebarItem
                href="#home"
                icon={<Icon />}
                render={({ children, ...props }) =>
                  'href' in props ? (
                    <a {...props} data-custom="">
                      {children}
                    </a>
                  ) : (
                    <span {...props}>{children}</span>
                  )
                }
              >
                Home
              </SidebarItem>
            </SidebarGroup>
          </Nav>
        }
      />,
    );
    const item = within(rail(container)).getByRole('link', { name: 'Home' });
    expect(item).toHaveAttribute('data-custom');
    expect(item).toHaveClass('sidebar-item');
  });

  describe('the reveal on mount', () => {
    const restore: (() => void)[] = [];

    /** Gives every element the box jsdom cannot lay out: the nav's height and the current item's place. */
    function stubLayout({ height, top }: { height: number; top: number }): void {
      for (const [name, read] of [
        ['clientHeight', (element: HTMLElement) => (element.classList.contains('sidebar-nav') ? height : 0)],
        ['offsetTop', (element: HTMLElement) => (element.getAttribute('aria-current') === 'page' ? top : 0)],
        ['offsetHeight', () => 40],
      ] as const) {
        const original = Object.getOwnPropertyDescriptor(HTMLElement.prototype, name);
        Object.defineProperty(HTMLElement.prototype, name, {
          configurable: true,
          get(this: HTMLElement) {
            return read(this);
          },
        });
        restore.push(() => {
          if (original) Object.defineProperty(HTMLElement.prototype, name, original);
          else Reflect.deleteProperty(HTMLElement.prototype, name);
        });
      }
    }

    afterEach(() => {
      for (const undo of restore.splice(0)) undo();
    });

    /** The rail's nav after mounting with the layout given. */
    function mountedNav(layout: { height: number; top: number }): HTMLElement {
      stubLayout(layout);
      const { container } = render(<Shell />);
      const nav = rail(container).querySelector<HTMLElement>('.sidebar-nav');
      if (!nav) throw new Error('No nav');
      return nav;
    }

    it('scrolls the nav so the current item shows 40px under its top when it is below the fold', () => {
      expect(mountedNav({ height: 200, top: 600 }).scrollTop).toBe(560);
    });

    it('leaves the nav alone when the current item already shows', () => {
      expect(mountedNav({ height: 200, top: 100 }).scrollTop).toBe(0);
    });

    it('leaves a nav with no height alone, as the hidden rail has', () => {
      expect(mountedNav({ height: 0, top: 600 }).scrollTop).toBe(0);
    });
  });

  it('throws useSidebar outside a Sidebar, and Sidebar outside an AppShell', () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    expect(() => render(<Probe />)).toThrow('useSidebar must be used inside a Sidebar');
    expect(() =>
      render(
        <Sidebar aria-label="Main">
          <SidebarGroup label="Overview">
            <SidebarItem href="#home" icon={<Icon />}>
              Home
            </SidebarItem>
          </SidebarGroup>
        </Sidebar>,
      ),
    ).toThrow('useAppShell must be used inside an AppShell');
    vi.restoreAllMocks();
  });

  it('puts className and ref on the rail root, and the class on the drawer copy too', () => {
    const ref = createRef<HTMLDivElement>();
    const { container } = render(<Shell defaultDrawerOpen sidebar={<Nav className="mine" ref={ref} />} />);
    expect(rail(container)).toHaveClass('sidebar', 'mine');
    expect(ref.current).toBe(rail(container));
    expect(drawerCopy()).toHaveClass('sidebar', 'sidebar-drawer', 'mine');
  });

  it('puts className and ref on each part', () => {
    const refs = {
      group: createRef<HTMLDivElement>(),
      item: createRef<HTMLAnchorElement>(),
      brand: createRef<HTMLAnchorElement>(),
      search: createRef<HTMLButtonElement>(),
      trigger: createRef<HTMLButtonElement>(),
    };
    const seen = vi.fn();
    const { container } = render(
      <Shell
        header={<SidebarTrigger className="t" ref={refs.trigger} />}
        sidebar={
          <Nav
            brand={
              <SidebarBrand href="#home" mark={<Icon />} className="b" ref={refs.brand}>
                Snapshot
              </SidebarBrand>
            }
            search={
              <SidebarSearch className="s" ref={refs.search}>
                Search
              </SidebarSearch>
            }
          >
            <SidebarGroup label="Overview" className="g" ref={refs.group}>
              <SidebarItem
                href="#home"
                icon={<Icon />}
                isCurrent
                ref={refs.item}
                className={({ isCurrent, defaultClassName }) => {
                  seen(isCurrent, defaultClassName);
                  return 'i';
                }}
              >
                Home
              </SidebarItem>
            </SidebarGroup>
          </Nav>
        }
      />,
    );
    const nav = rail(container);
    expect(refs.group.current).toBe(nav.querySelector('.sidebar-group'));
    expect(refs.group.current).toHaveClass('sidebar-group', 'g');
    expect(refs.item.current).toBe(within(nav).getByRole('link', { name: 'Home' }));
    expect(refs.item.current).toHaveClass('sidebar-item', 'i');
    expect(seen).toHaveBeenCalledWith(true, expect.anything());
    expect(refs.brand.current).toBe(within(nav).getByRole('link', { name: 'Snapshot' }));
    expect(refs.brand.current).toHaveClass('sidebar-brand', 'b');
    expect(refs.search.current).toBe(within(nav).getByRole('button', { name: 'Search' }));
    expect(refs.search.current).toHaveClass('sidebar-search', 's');
    expect(refs.trigger.current).toBe(screen.getByRole('button', { name: 'Open the menu' }));
    expect(refs.trigger.current?.className).toBe('icon-button icon-button-outline sidebar-trigger t');
  });

  it('draws the brand as a mark and a name, and the search as an icon, a label and its key chip', () => {
    const { container } = render(<Shell />);
    const brand = within(rail(container)).getByRole('link', { name: 'Snapshot' });
    expect(brand.querySelector('.sidebar-brand-mark')).toHaveAttribute('aria-hidden', 'true');
    expect(brand.querySelector('.sidebar-brand-name')).toHaveTextContent('Snapshot');
    const search = within(rail(container)).getByRole('button', { name: /^Search or jump to/ });
    expect(search.querySelector('.sidebar-search-icon')).toHaveAttribute('aria-hidden', 'true');
    expect(search.querySelector('.sidebar-search-label')).toHaveTextContent('Search or jump to');
    const chip = search.querySelector('kbd');
    expect(chip).toHaveClass('kbd', 'sidebar-search-shortcut');
    expect(chip?.textContent).toMatch(/K$/);
  });

  it('is exported from the package with its parts and its hook', () => {
    for (const name of [
      'Sidebar',
      'SidebarGroup',
      'SidebarItem',
      'SidebarBrand',
      'SidebarSearch',
      'SidebarTrigger',
      'useSidebar',
    ]) {
      expect(library, name).toHaveProperty(name);
    }
  });

  it('requires a name for the rail, the words with a count, and an href on an item, in the types', () => {
    const unchecked = (): ReactElement => (
      <>
        {/* @ts-expect-error: a rail names its nav */}
        <Sidebar>
          <SidebarGroup label="Overview">
            {/* @ts-expect-error: a count comes with its words */}
            <SidebarItem href="#home" icon={<Icon />} count={12}>
              Home
            </SidebarItem>
            {/* @ts-expect-error: an item is a link */}
            <SidebarItem icon={<Icon />}>Goals</SidebarItem>
          </SidebarGroup>
        </Sidebar>
      </>
    );
    expect(unchecked).toBeTypeOf('function');
  });

  it('has no axe violations expanded, collapsed, and with the drawer open', async () => {
    const expanded = render(<Shell />);
    await expectNoA11yViolations(expanded.container);
    expanded.unmount();
    const collapsed = render(<Shell defaultSidebarCollapsed />);
    await expectNoA11yViolations(collapsed.container);
    collapsed.unmount();
    render(<Shell defaultDrawerOpen />);
    await expectNoA11yViolations(document.body);
  });
});

describe('SidebarTrigger', () => {
  it('is an outline icon button that opens the drawer and says so', async () => {
    const user = userEvent.setup();
    const onDrawerOpenChange = vi.fn();
    const onPress = vi.fn();
    render(<Shell header={<SidebarTrigger onPress={onPress} />} onDrawerOpenChange={onDrawerOpenChange} />);
    const trigger = screen.getByRole('button', { name: 'Open the menu' });
    expect(trigger).toHaveClass('icon-button', 'icon-button-outline', 'sidebar-trigger');
    expect(trigger).toHaveAttribute('aria-haspopup', 'dialog');
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(trigger).not.toHaveAttribute('aria-controls');
    await user.click(trigger);
    expect(onPress).toHaveBeenCalledTimes(1);
    expect(onDrawerOpenChange).toHaveBeenCalledWith(true);
    expect(screen.getByRole('button', { name: 'Open the menu', hidden: true })).toHaveAttribute(
      'aria-expanded',
      'true',
    );
  });

  it('takes its name from label and its look from variant', () => {
    render(<Shell header={<SidebarTrigger label="Navigation" variant="ghost" />} />);
    const trigger = screen.getByRole('button', { name: 'Navigation' });
    expect(trigger).not.toHaveClass('icon-button-outline');
  });
});

/*
 * The collapsed rail's tips count milliseconds on a fake clock, as the Tooltip's own tests do: user-event waits on
 * a real timer after every step, so these send the pointer events React Aria listens for instead.
 */
describe('the collapsed rail tooltips', () => {
  function wait(ms: number): void {
    act(() => {
      vi.advanceTimersByTime(ms);
    });
  }

  function mouseOnto(element: Element): void {
    act(() => {
      fireEvent.pointerMove(document.body, { pointerType: 'mouse' });
      fireEvent.pointerOver(element, { pointerType: 'mouse' });
    });
  }

  const tip = (): HTMLElement | null => screen.queryByRole('tooltip');

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    // React Aria's warm-up is module state: each test closes what it left open and lets it cool down.
    act(() => {
      fireEvent.keyDown(document.body, { key: 'Escape' });
    });
    wait(1000);
    vi.useRealTimers();
  });

  it("shows an item's label after 400ms of hover, and not at 399", () => {
    const { container } = render(<Shell defaultSidebarCollapsed />);
    mouseOnto(within(rail(container)).getByRole('link', { name: 'Account' }));
    wait(399);
    expect(tip()).toBeNull();
    wait(1);
    expect(tip()).toHaveTextContent('Account');
  });

  it('shows the count and its words on a second line of the tip', () => {
    const { container } = render(<Shell defaultSidebarCollapsed />);
    mouseOnto(within(rail(container)).getByRole('link', { name: 'Transactions, 12 to review' }));
    wait(400);
    expect(tip()).toHaveTextContent('Transactions');
    expect(tip()?.querySelector('.sidebar-tooltip-count')).toHaveTextContent('12 to review');
  });

  it('shows nothing while expanded', () => {
    const { container } = render(<Shell />);
    mouseOnto(within(rail(container)).getByRole('link', { name: 'Account' }));
    wait(1000);
    expect(tip()).toBeNull();
  });

  it("shows the search's shortcut on its tip, and names the collapse button and the brand", () => {
    const { container } = render(<Shell defaultSidebarCollapsed />);
    mouseOnto(within(rail(container)).getByRole('button', { name: /^Search or jump to/ }));
    wait(400);
    expect(tip()).toHaveTextContent('Search or jump to');
    expect(tip()?.querySelector('.tooltip-shortcut')).not.toBeNull();
  });

  it('carries the density of a compact rail onto the tip', () => {
    const { container } = render(
      <div data-density="compact">
        <Shell defaultSidebarCollapsed />
      </div>,
    );
    mouseOnto(within(rail(container)).getByRole('link', { name: 'Account' }));
    wait(400);
    expect(tip()).toHaveAttribute('data-density', 'compact');
  });
});
