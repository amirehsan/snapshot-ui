import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef, StrictMode, type ReactElement, type ReactNode } from 'react';
import { Dialog, DialogTrigger, Heading, Modal, RouterProvider } from 'react-aria-components';
import { afterEach, beforeEach, describe, expect, it, vi, type MockInstance } from 'vitest';
import { expectNoA11yViolations } from '../../test/a11y';
import * as library from '../index';
import { BottomTabBar, BottomTabBarItem } from '.';

/** A stand-in icon: the item hides it from assistive technology. */
const Icon = (): ReactElement => <svg data-testid="icon" />;

/** Four items: Home current, Transactions with 12 to review, Goals, and More as a button. */
const FOUR: ReactNode = (
  <>
    <BottomTabBarItem href="#home" icon={<Icon />} isCurrent>
      Home
    </BottomTabBarItem>
    <BottomTabBarItem href="#transactions" icon={<Icon />} count={12} countLabel="to review">
      Transactions
    </BottomTabBarItem>
    <BottomTabBarItem href="#goals" icon={<Icon />} isCurrent={false}>
      Goals
    </BottomTabBarItem>
    <BottomTabBarItem icon={<Icon />}>More</BottomTabBarItem>
  </>
);

/** `n` link items, for the warning. */
const items = (n: number): ReactNode =>
  Array.from({ length: n }, (_, index) => (
    <BottomTabBarItem key={index} href={`#page-${String(index)}`} icon={<Icon />}>
      {`Page ${String(index)}`}
    </BottomTabBarItem>
  ));

describe('BottomTabBar', () => {
  let warn: MockInstance<typeof console.warn>;
  beforeEach(() => {
    warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  });
  afterEach(() => {
    warn.mockRestore();
  });

  it('is a nav named by aria-label, holding a list of plain links and a button, with no tab roles', () => {
    render(<BottomTabBar aria-label="Main">{FOUR}</BottomTabBar>);
    const nav = screen.getByRole('navigation', { name: 'Main' });
    expect(nav).toHaveClass('tab-bar');
    const list = within(nav).getByRole('list');
    expect(list).toHaveClass('tab-bar-list');
    expect(within(list).getAllByRole('listitem')).toHaveLength(4);
    for (const name of ['Home', 'Transactions, 12 to review', 'Goals']) {
      const link = within(nav).getByRole('link', { name });
      expect(link.tagName).toBe('A');
      expect(link).toHaveClass('tab-bar-item');
      expect(link.parentElement?.tagName).toBe('LI');
      expect(link.parentElement?.parentElement).toBe(list);
    }
    const more = within(nav).getByRole('button', { name: 'More' });
    expect(more.tagName).toBe('BUTTON');
    expect(more).toHaveClass('tab-bar-item');
    expect(more.parentElement?.tagName).toBe('LI');
    expect(within(nav).queryByRole('tab')).toBeNull();
    expect(within(nav).queryByRole('tablist')).toBeNull();
  });

  it('is named by aria-labelledby when given', () => {
    render(
      <>
        <span id="tabs-name">Sections</span>
        <BottomTabBar aria-labelledby="tabs-name">{FOUR}</BottomTabBar>
      </>,
    );
    expect(screen.getByRole('navigation', { name: 'Sections' })).toBeInTheDocument();
  });

  it('hides the icon and marks a current link with aria-current="page", and nothing else', () => {
    render(<BottomTabBar aria-label="Main">{FOUR}</BottomTabBar>);
    const home = screen.getByRole('link', { name: 'Home' });
    expect(home).toHaveAttribute('aria-current', 'page');
    expect(home).toHaveAttribute('data-current');
    const icon = home.querySelector('.tab-bar-item-icon');
    expect(icon).toHaveAttribute('aria-hidden', 'true');
    expect(icon).toContainElement(within(home).getByTestId('icon'));
    expect(home.querySelector('.tab-bar-item-label')).toHaveTextContent('Home');
    // isCurrent={false} and no isCurrent at all set neither.
    for (const name of ['Goals', 'Transactions, 12 to review']) {
      const link = screen.getByRole('link', { name });
      expect(link, name).not.toHaveAttribute('aria-current');
      expect(link, name).not.toHaveAttribute('data-current');
    }
  });

  it('marks a current button with data-current-action and never aria-current', () => {
    render(
      <BottomTabBar aria-label="Main">
        <BottomTabBarItem href="#home" icon={<Icon />}>
          Home
        </BottomTabBarItem>
        <BottomTabBarItem icon={<Icon />} isCurrent>
          More
        </BottomTabBarItem>
        <BottomTabBarItem icon={<Icon />} isCurrent={false}>
          Help
        </BottomTabBarItem>
      </BottomTabBar>,
    );
    const more = screen.getByRole('button', { name: 'More' });
    expect(more).toHaveAttribute('data-current-action', '');
    expect(more).not.toHaveAttribute('aria-current');
    const help = screen.getByRole('button', { name: 'Help' });
    expect(help).not.toHaveAttribute('data-current-action');
    expect(help).not.toHaveAttribute('aria-current');
  });

  it('names a counted item "Transactions, 12 to review", with the chip drawn and the words hidden', () => {
    render(<BottomTabBar aria-label="Main">{FOUR}</BottomTabBar>);
    const item = screen.getByRole('link', { name: 'Transactions, 12 to review' });
    // The chip is decoration inside the hidden icon box; the name's count comes from the hidden words.
    const chip = item.querySelector('.tab-bar-item-icon .tab-bar-count');
    expect(chip).toHaveTextContent('12');
    expect(chip).toBeVisible();
    // The comma ends the label, drawn at no size by tab-bar.css, so a browser adds no space before it.
    expect(item.querySelector('.tab-bar-item-label .tab-bar-comma')).toHaveTextContent(',');
    // Visually hidden: React Aria's VisuallyHidden clips the box, so the words have no area to show in.
    const words = [...item.children].find((child) => child.textContent === '12 to review');
    expect(words).toBeDefined();
    expect((words as HTMLElement).style.clipPath).toBe('inset(50%)');
    // An item with no count has no chip, no comma and no hidden words.
    const home = screen.getByRole('link', { name: 'Home' });
    expect(home.querySelector('.tab-bar-count')).toBeNull();
    expect(home.querySelector('.tab-bar-comma')).toBeNull();
    expect(home.textContent).toBe('Home');
  });

  it('warns once for two items and once for six, and still renders them', () => {
    const two = render(<BottomTabBar aria-label="Main">{items(2)}</BottomTabBar>);
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn).toHaveBeenCalledWith('BottomTabBar holds 2 items; give it three to five.');
    expect(screen.getAllByRole('link')).toHaveLength(2);
    two.unmount();
    warn.mockClear();
    render(<BottomTabBar aria-label="Main">{items(6)}</BottomTabBar>);
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn).toHaveBeenCalledWith('BottomTabBar holds 6 items; give it three to five.');
    expect(screen.getAllByRole('link')).toHaveLength(6);
  });

  it('does not warn for three, four or five items', () => {
    for (const n of [3, 4, 5]) {
      const { unmount } = render(<BottomTabBar aria-label="Main">{items(n)}</BottomTabBar>);
      unmount();
    }
    expect(warn).not.toHaveBeenCalled();
  });

  it('counts the items inside a fragment and skips a slot that renders nothing', () => {
    // Four items in one fragment are four, not one; a false or null slot, such as `{isAdmin && <Item />}`, is none.
    const { unmount } = render(<BottomTabBar aria-label="Main">{FOUR}</BottomTabBar>);
    unmount();
    render(
      <BottomTabBar aria-label="Main">
        {items(5)}
        {false}
        {null}
      </BottomTabBar>,
    );
    expect(warn).not.toHaveBeenCalled();
  });

  it('warns once per mount, through Strict Mode and a re-render with the same wrong count', () => {
    const { rerender } = render(
      <StrictMode>
        <BottomTabBar aria-label="Main">{items(2)}</BottomTabBar>
      </StrictMode>,
    );
    rerender(
      <StrictMode>
        <BottomTabBar aria-label="Main">{items(2)}</BottomTabBar>
      </StrictMode>,
    );
    expect(warn).toHaveBeenCalledTimes(1);
  });

  it('navigates through RouterProvider, with the routerOptions given', async () => {
    const user = userEvent.setup();
    const navigate = vi.fn();
    render(
      <RouterProvider navigate={navigate}>
        <BottomTabBar aria-label="Main">
          <BottomTabBarItem href="/home" icon={<Icon />}>
            Home
          </BottomTabBarItem>
          <BottomTabBarItem href="/transactions" icon={<Icon />} routerOptions={{ scroll: false } as never}>
            Transactions
          </BottomTabBarItem>
          <BottomTabBarItem href="/goals" icon={<Icon />}>
            Goals
          </BottomTabBarItem>
        </BottomTabBar>
      </RouterProvider>,
    );
    await user.click(screen.getByRole('link', { name: 'Transactions' }));
    expect(navigate).toHaveBeenCalledWith('/transactions', { scroll: false });
  });

  it('follows a link on Enter and presses a button on Enter and Space', async () => {
    const user = userEvent.setup();
    const navigate = vi.fn();
    const onPress = vi.fn();
    render(
      <RouterProvider navigate={navigate}>
        <BottomTabBar aria-label="Main">
          <BottomTabBarItem href="/home" icon={<Icon />}>
            Home
          </BottomTabBarItem>
          <BottomTabBarItem href="/goals" icon={<Icon />}>
            Goals
          </BottomTabBarItem>
          <BottomTabBarItem icon={<Icon />} onPress={onPress}>
            More
          </BottomTabBarItem>
        </BottomTabBar>
      </RouterProvider>,
    );
    await user.tab();
    expect(screen.getByRole('link', { name: 'Home' })).toHaveFocus();
    await user.keyboard('{Enter}');
    expect(navigate.mock.calls.map(([href]: unknown[]) => href)).toEqual(['/home']);
    await user.tab();
    await user.tab();
    expect(screen.getByRole('button', { name: 'More' })).toHaveFocus();
    await user.keyboard('{Enter}');
    await user.keyboard(' ');
    expect(onPress).toHaveBeenCalledTimes(2);
  });

  it('hands its anchor to a render prop', () => {
    render(
      <BottomTabBar aria-label="Main">
        <BottomTabBarItem
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
        </BottomTabBarItem>
        <BottomTabBarItem href="#goals" icon={<Icon />}>
          Goals
        </BottomTabBarItem>
        <BottomTabBarItem icon={<Icon />}>More</BottomTabBarItem>
      </BottomTabBar>,
    );
    const item = screen.getByRole('link', { name: 'Home' });
    expect(item).toHaveAttribute('data-custom');
    expect(item).toHaveClass('tab-bar-item');
  });

  // React Aria 1.22 gives a dialog trigger aria-expanded and no aria-haspopup, which it adds for menus and
  // listboxes alone because screen readers announce any value as a menu.
  it('opens a dialog from a button item inside a DialogTrigger, which says whether it is open', async () => {
    const user = userEvent.setup();
    render(
      <BottomTabBar aria-label="Main">
        <BottomTabBarItem href="#home" icon={<Icon />} isCurrent>
          Home
        </BottomTabBarItem>
        <BottomTabBarItem href="#goals" icon={<Icon />}>
          Goals
        </BottomTabBarItem>
        <DialogTrigger>
          <BottomTabBarItem icon={<Icon />}>More</BottomTabBarItem>
          <Modal>
            <Dialog>
              <Heading slot="title">More</Heading>
            </Dialog>
          </Modal>
        </DialogTrigger>
      </BottomTabBar>,
    );
    const more = screen.getByRole('button', { name: 'More' });
    expect(more).toHaveAttribute('aria-expanded', 'false');
    await user.click(more);
    expect(screen.getByRole('dialog', { name: 'More' })).toBeInTheDocument();
    expect(more).toHaveAttribute('aria-expanded', 'true');
  });

  it('calls onPress on a button item', async () => {
    const user = userEvent.setup();
    const onPress = vi.fn();
    render(
      <BottomTabBar aria-label="Main">
        <BottomTabBarItem href="#home" icon={<Icon />}>
          Home
        </BottomTabBarItem>
        <BottomTabBarItem href="#goals" icon={<Icon />}>
          Goals
        </BottomTabBarItem>
        <BottomTabBarItem icon={<Icon />} onPress={onPress}>
          More
        </BottomTabBarItem>
      </BottomTabBar>,
    );
    await user.click(screen.getByRole('button', { name: 'More' }));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('puts className, ref and other attributes on the nav, merged after the library class', () => {
    const ref = createRef<HTMLElement>();
    render(
      <BottomTabBar aria-label="Main" className="mine" ref={ref} id="tabs" data-testid="bar">
        {FOUR}
      </BottomTabBar>,
    );
    const nav = screen.getByRole('navigation', { name: 'Main' });
    expect(nav).toHaveClass('tab-bar', 'mine');
    expect(nav.className).toBe('tab-bar mine');
    expect(nav).toHaveAttribute('id', 'tabs');
    expect(nav).toHaveAttribute('data-testid', 'bar');
    expect(ref.current).toBe(nav);
  });

  it('puts className, as a string or a function, and ref on both item forms', () => {
    const link = createRef<HTMLAnchorElement>();
    const button = createRef<HTMLButtonElement>();
    const seenLink = vi.fn();
    const seenButton = vi.fn();
    render(
      <BottomTabBar aria-label="Main">
        <BottomTabBarItem
          href="#home"
          icon={<Icon />}
          isCurrent
          ref={link}
          className={({ isCurrent, defaultClassName }) => {
            seenLink(isCurrent, defaultClassName);
            return 'l';
          }}
        >
          Home
        </BottomTabBarItem>
        <BottomTabBarItem href="#goals" icon={<Icon />} className="g">
          Goals
        </BottomTabBarItem>
        <BottomTabBarItem
          icon={<Icon />}
          ref={button}
          className={({ isPressed, defaultClassName }) => {
            seenButton(isPressed, defaultClassName);
            return 'b';
          }}
        >
          More
        </BottomTabBarItem>
      </BottomTabBar>,
    );
    const home = screen.getByRole('link', { name: 'Home' });
    expect(home.className).toBe('tab-bar-item l');
    expect(link.current).toBe(home);
    expect(seenLink).toHaveBeenCalledWith(true, 'react-aria-Link');
    expect(screen.getByRole('link', { name: 'Goals' }).className).toBe('tab-bar-item g');
    const more = screen.getByRole('button', { name: 'More' });
    expect(more.className).toBe('tab-bar-item b');
    expect(button.current).toBe(more);
    expect(seenButton).toHaveBeenCalledWith(false, 'react-aria-Button');
  });

  it('is exported from the package index with its types', () => {
    for (const name of ['BottomTabBar', 'BottomTabBarItem']) {
      expect(library, name).toHaveProperty(name);
    }
  });

  it('requires a name for the bar and the words with a count, in the types', () => {
    const unchecked = (): ReactElement => (
      // @ts-expect-error: a bar names its nav
      <BottomTabBar>
        {/* @ts-expect-error: a count comes with its words */}
        <BottomTabBarItem href="#home" icon={<Icon />} count={12}>
          Home
        </BottomTabBarItem>
        {/* @ts-expect-error: a button item takes no routing options */}
        <BottomTabBarItem icon={<Icon />} routerOptions={{}}>
          More
        </BottomTabBarItem>
      </BottomTabBar>
    );
    expect(unchecked).toBeTypeOf('function');
  });

  it('has no axe violations with a current link, a count and a More button', async () => {
    const { container } = render(<BottomTabBar aria-label="Main">{FOUR}</BottomTabBar>);
    await expectNoA11yViolations(container);
  });
});
