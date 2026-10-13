import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef, type ReactElement } from 'react';
import { I18nProvider } from 'react-aria-components';
import { describe, expect, it, vi } from 'vitest';
import { expectNoA11yViolations } from '../../test/a11y';
import { holdFrames } from '../../test/dom';
import * as library from '../index';
import { Button } from '../button';
import { ConfirmDialog, DialogTrigger } from '../dialog';
import { Link } from '../link';
import { openModals } from '../overlay/useOverlayStack';
import { Drawer, type DrawerProps } from './Drawer';

/** The open drawer's scrim, which React Aria portals to the body. */
function scrim(): HTMLElement {
  const element = document.querySelector<HTMLElement>('.drawer-overlay');
  if (!element) throw new Error('No scrim');
  return element;
}

/** The open drawer's panel. */
function panel(): HTMLElement {
  const element = document.querySelector<HTMLElement>('.drawer');
  if (!element) throw new Error('No panel');
  return element;
}

/** An open drawer with a title, and whatever else the test gives it. */
function open(props: Partial<DrawerProps> = {}): ReturnType<typeof render> {
  return render(<Drawer isOpen title="Menu" {...props} />);
}

/** A trigger and its drawer, closed until the trigger is pressed. */
function Triggered(props: Partial<DrawerProps>): ReactElement {
  return (
    <DialogTrigger>
      <Button>Open the menu</Button>
      <Drawer title="Menu" {...props} />
    </DialogTrigger>
  );
}

/** A short navigation list, the drawer's main use. */
const NAVIGATION = (
  <nav aria-label="Workspace">
    <Link href="/overview">Overview</Link>
    <Link href="/projects">Projects</Link>
  </nav>
);

describe('Drawer', () => {
  it('is a dialog named by its title, which is an h2', () => {
    open();
    const dialog = screen.getByRole('dialog', { name: 'Menu' });
    const heading = screen.getByRole('heading', { level: 2 });
    expect(heading).toHaveTextContent('Menu');
    expect(heading).toHaveClass('drawer-title');
    expect(dialog.tagName).toBe('SECTION');
    expect(dialog).toHaveClass('drawer-content');
    expect(dialog).toHaveAttribute('tabindex', '-1');
    expect(dialog).toHaveAttribute('aria-labelledby', heading.id);
  });

  it('draws the header, the body and the footer in that order, inside the panel on the scrim', () => {
    open({ children: NAVIGATION, footer: <p>Signed in as Ada</p> });
    const dialog = screen.getByRole('dialog');
    expect(dialog.parentElement).toBe(panel());
    expect(panel().parentElement).toBe(scrim());
    expect([...dialog.children].map((child) => child.className)).toEqual([
      'drawer-header',
      'drawer-body',
      'drawer-footer',
    ]);
    const header = dialog.querySelector('.drawer-header');
    expect(header?.firstElementChild).toHaveClass('drawer-title');
    expect(header?.lastElementChild).toHaveClass('drawer-close');
    expect(dialog.querySelector('.drawer-body')).toContainElement(
      screen.getByRole('link', { name: 'Projects' }),
    );
    expect(dialog.querySelector('.drawer-footer')).toHaveTextContent('Signed in as Ada');
  });

  it('keeps a hidden title as the name, in a visually hidden wrapper that is still in the tree', () => {
    open({ isTitleHidden: true, children: NAVIGATION });
    expect(screen.getByRole('dialog', { name: 'Menu' })).toBeInTheDocument();
    const heading = screen.getByRole('heading', { level: 2, name: 'Menu' });
    const wrapper = heading.parentElement;
    if (!wrapper) throw new Error('No wrapper');
    expect(wrapper).not.toHaveClass('drawer-header');
    expect(wrapper.parentElement).toHaveClass('drawer-header');
    // React Aria's visually hidden pattern: a 1px box, clipped, out of the flow.
    expect(wrapper.style.position).toBe('absolute');
    expect(wrapper.style.width).toBe('1px');
    expect(wrapper.style.height).toBe('1px');
    expect(wrapper.style.overflow).toBe('hidden');
    expect(wrapper.style.clipPath).toBe('inset(50%)');
    // The header still ends in the close button.
    expect(wrapper.nextElementSibling).toHaveClass('drawer-close');
  });

  it('shows the title in place when it is not hidden', () => {
    open();
    expect(screen.getByRole('heading', { level: 2 }).parentElement).toHaveClass('drawer-header');
  });

  it('comes from the left by default, and from the right at the end, in left to right', () => {
    const { unmount } = open();
    expect(panel()).toHaveAttribute('data-side', 'left');
    expect(scrim()).toHaveAttribute('dir', 'ltr');
    unmount();
    open({ placement: 'end' });
    expect(panel()).toHaveAttribute('data-side', 'right');
  });

  it('comes from the right at the start and from the left at the end, in right to left', () => {
    const { unmount } = render(
      <I18nProvider locale="ar-EG">
        <Drawer isOpen title="Menu" />
      </I18nProvider>,
    );
    expect(panel()).toHaveAttribute('data-side', 'right');
    expect(scrim()).toHaveAttribute('dir', 'rtl');
    unmount();
    render(
      <I18nProvider locale="ar-EG">
        <Drawer isOpen placement="end" title="Menu" />
      </I18nProvider>,
    );
    expect(panel()).toHaveAttribute('data-side', 'left');
  });

  it('draws a close button named Close by default, which closes the drawer', async () => {
    const user = userEvent.setup();
    render(<Triggered />);
    await user.click(screen.getByRole('button', { name: 'Open the menu' }));
    const close = screen.getByRole('button', { name: 'Close' });
    expect(close).toHaveClass('icon-button', 'drawer-close');
    expect(close.querySelector('svg')).toBeInTheDocument();
    await user.click(close);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('names the close button with closeLabel', () => {
    open({ closeLabel: 'Fermer' });
    expect(screen.getByRole('button', { name: 'Fermer' })).toHaveClass('drawer-close');
  });

  it('draws no close button with hasCloseButton false', () => {
    open({ hasCloseButton: false });
    // React Aria's own visually hidden Dismiss buttons stay, for screen readers; the X is gone.
    expect(screen.queryByRole('button', { name: 'Close' })).not.toBeInTheDocument();
    expect(document.querySelector('.drawer-close')).not.toBeInTheDocument();
  });

  it('draws the footer only when given one, and the body always', () => {
    const { unmount } = open();
    expect(document.querySelector('.drawer-footer')).not.toBeInTheDocument();
    expect(document.querySelector('.drawer-body')).toBeInTheDocument();
    unmount();
    open({ footer: <Button>Sign out</Button> });
    expect(document.querySelector('.drawer-footer')).toContainElement(
      screen.getByRole('button', { name: 'Sign out' }),
    );
  });

  it('hands children given as a function a close that closes the drawer', async () => {
    const user = userEvent.setup();
    const children = vi.fn(({ close }: { close: () => void }) => (
      <Button variant="secondary" onPress={close}>
        Go to projects
      </Button>
    ));
    render(<Triggered>{children}</Triggered>);
    await user.click(screen.getByRole('button', { name: 'Open the menu' }));
    expect(typeof children.mock.lastCall?.[0].close).toBe('function');
    expect(document.querySelector('.drawer-body')).toContainElement(
      screen.getByRole('button', { name: 'Go to projects' }),
    );
    await user.click(screen.getByRole('button', { name: 'Go to projects' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('closes on Escape, unless isKeyboardDismissDisabled', async () => {
    const user = userEvent.setup();
    const { unmount } = render(<Triggered />);
    await user.click(screen.getByRole('button', { name: 'Open the menu' }));
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    unmount();

    render(<Triggered isKeyboardDismissDisabled />);
    await user.click(screen.getByRole('button', { name: 'Open the menu' }));
    await user.keyboard('{Escape}');
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('closes on a press on the scrim, unless isDismissable is false', async () => {
    const user = userEvent.setup();
    const { unmount } = render(<Triggered />);
    await user.click(screen.getByRole('button', { name: 'Open the menu' }));
    await user.click(scrim());
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    unmount();

    render(<Triggered isDismissable={false} />);
    await user.click(screen.getByRole('button', { name: 'Open the menu' }));
    await user.click(scrim());
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('stays open for a press inside the toast region', async () => {
    const user = userEvent.setup();
    const region = document.createElement('div');
    region.className = 'toast-region';
    const undo = region.appendChild(document.createElement('button'));
    undo.type = 'button';
    undo.textContent = 'Undo';
    render(<Triggered />);
    await user.click(screen.getByRole('button', { name: 'Open the menu' }));
    document.body.append(region);
    try {
      await user.click(undo);
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    } finally {
      region.remove();
    }
  });

  it('is controlled by isOpen, and tells onOpenChange when Escape asks to close', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    const { rerender } = render(<Drawer isOpen onOpenChange={onOpenChange} title="Menu" />);
    expect(screen.getByRole('dialog')).toHaveFocus();
    await user.keyboard('{Escape}');
    expect(onOpenChange).toHaveBeenCalledExactlyOnceWith(false);
    // The caller owns the state, and it still says open.
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    // A shell closes its drawer when the viewport widens, by setting the state.
    rerender(<Drawer isOpen={false} onOpenChange={onOpenChange} title="Menu" />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('opens from defaultOpen and closes on its own', async () => {
    const user = userEvent.setup();
    render(<Drawer defaultOpen title="Menu" />);
    expect(screen.getByRole('dialog')).toHaveFocus();
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('puts className on the panel and overlayClassName on the scrim, after the library classes, and ref on the dialog', () => {
    const ref = createRef<HTMLElement>();
    open({ className: 'mine', overlayClassName: 'theirs', ref });
    expect(panel().className).toBe('overlay drawer mine');
    expect(scrim().className).toBe('overlay-scrim drawer-overlay theirs');
    expect(ref.current).toBe(screen.getByRole('dialog'));
  });

  it('takes a className function of the panel state', () => {
    open({ className: ({ defaultClassName }) => `mine ${String(defaultClassName)}` });
    expect(panel().className).toBe('overlay drawer mine react-aria-Modal');
  });

  it('holds the page still while open and lets it go on close', async () => {
    const user = userEvent.setup();
    render(<Triggered />);
    expect(document.documentElement.style.overflow).toBe('');
    await user.click(screen.getByRole('button', { name: 'Open the menu' }));
    expect(document.documentElement.style.overflow).toBe('hidden');
    await user.keyboard('{Escape}');
    expect(document.documentElement.style.overflow).toBe('');
  });

  it('hides the page behind it from assistive technology while open', async () => {
    const user = userEvent.setup();
    render(<Triggered />);
    const trigger = screen.getByRole('button', { name: 'Open the menu' });
    await user.click(trigger);
    expect(trigger.closest('[aria-hidden="true"]')).not.toBeNull();
    await user.keyboard('{Escape}');
    expect(trigger.closest('[aria-hidden="true"]')).toBeNull();
  });

  it('moves focus into the drawer, holds it there, and gives it back to the trigger on close', async () => {
    const user = userEvent.setup();
    render(<Triggered>{NAVIGATION}</Triggered>);
    const trigger = screen.getByRole('button', { name: 'Open the menu' });
    await user.click(trigger);
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveFocus();
    await user.tab();
    expect(screen.getByRole('button', { name: 'Close' })).toHaveFocus();
    await user.tab();
    expect(screen.getByRole('link', { name: 'Overview' })).toHaveFocus();
    await user.tab();
    expect(screen.getByRole('link', { name: 'Projects' })).toHaveFocus();
    // Past the last control, Tab cycles back to the first and never reaches the page.
    await user.tab();
    expect(screen.getByRole('button', { name: 'Close' })).toHaveFocus();
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    // React Aria gives focus back in the next animation frame.
    await waitFor(() => {
      expect(trigger).toHaveFocus();
    });
  });

  it('copies the theme of the trigger onto the panel, and not onto the scrim', async () => {
    const user = userEvent.setup();
    render(
      <div data-theme="dark">
        <Triggered />
      </div>,
    );
    await user.click(screen.getByRole('button', { name: 'Open the menu' }));
    expect(panel()).toHaveAttribute('data-theme', 'dark');
    expect(scrim()).not.toHaveAttribute('data-theme');
  });

  it('is exported from the package with its trigger', () => {
    expect(library).toHaveProperty('Drawer');
    expect(library).toHaveProperty('DialogTrigger');
  });

  it('draws no header when the title is hidden and there is no close button, and the title still names it', () => {
    open({ isTitleHidden: true, hasCloseButton: false, children: NAVIGATION });
    const dialog = screen.getByRole('dialog', { name: 'Menu' });
    expect(document.querySelector('.drawer-header')).not.toBeInTheDocument();
    // The heading sits in its visually hidden box straight inside the content, out of the flow, so the
    // body's own padding is the top of the panel.
    const heading = screen.getByRole('heading', { level: 2, name: 'Menu' });
    const wrapper = heading.parentElement;
    expect(wrapper?.parentElement).toBe(dialog);
    expect(wrapper?.style.position).toBe('absolute');
    expect(dialog).toHaveAttribute('aria-labelledby', heading.id);
    expect([...dialog.children].map((child) => child.className)).toEqual(['', 'drawer-body']);
  });

  it('keeps the header for the close button when the title is hidden', () => {
    open({ isTitleHidden: true });
    expect(document.querySelector('.drawer-header')).toContainElement(
      screen.getByRole('button', { name: 'Close' }),
    );
  });

  it('makes the body a tab stop while it scrolls and holds nothing to focus, and only then', () => {
    // jsdom lays nothing out, so the body's heights are given: taller inside than it shows, then not.
    const inside = vi.spyOn(HTMLElement.prototype, 'scrollHeight', 'get').mockReturnValue(900);
    const shown = vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(300);
    const body = (): HTMLElement | null => document.querySelector<HTMLElement>('.drawer-body');
    try {
      const { unmount } = open({ children: <p>Long words</p> });
      expect(body()).toHaveAttribute('tabindex', '0');
      unmount();
      inside.mockReturnValue(300);
      const { unmount: unmountShort } = open({ children: <p>Short words</p> });
      expect(body()).not.toHaveAttribute('tabindex');
      unmountShort();
      // A body that scrolls and holds a link is reached through the link, so a long list gains no extra
      // stop before its first item.
      inside.mockReturnValue(900);
      open({ children: NAVIGATION });
      expect(body()).not.toHaveAttribute('tabindex');
    } finally {
      inside.mockRestore();
      shown.mockRestore();
    }
  });

  it('stacks a confirm dialog over the drawer: one scrim paints, and Escape closes the top one only', async () => {
    const user = userEvent.setup();
    // Every frame held back, as on a loaded machine whose next frame comes late. React Aria gives focus back in
    // a frame, so only the library's own restore, as the top panel leaves, can put it back on the trigger
    // before the dialog under it finds focus on the body and takes it.
    holdFrames();
    render(
      <Drawer
        defaultOpen
        title="Menu"
        footer={
          <DialogTrigger>
            <Button variant="secondary">Sign out</Button>
            <ConfirmDialog
              tone="default"
              title="Sign out of Northwind?"
              description="You will need your password to come back."
              confirmLabel="Sign out of Northwind"
            />
          </DialogTrigger>
        }
      />,
    );
    const signOut = screen.getByRole('button', { name: 'Sign out' });
    await user.click(signOut);
    expect(screen.getByRole('alertdialog', { name: 'Sign out of Northwind?' })).toBeInTheDocument();
    expect(openModals()).toHaveLength(2);
    expect(scrim()).not.toHaveAttribute('data-stacked');
    expect(document.querySelector('.dialog-overlay')).toHaveAttribute('data-stacked', '');
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    expect(screen.getByRole('dialog', { name: 'Menu' })).toBeInTheDocument();
    expect(signOut).toHaveFocus();
    expect(openModals()).toHaveLength(1);
  });

  it('has no axe violations open with a visible title', async () => {
    open({ children: NAVIGATION, footer: <Button variant="secondary">Sign out</Button> });
    await expectNoA11yViolations(document.body);
  });

  it('has no axe violations open with a hidden title', async () => {
    open({
      isTitleHidden: true,
      children: NAVIGATION,
      footer: <Button variant="secondary">Sign out</Button>,
    });
    await expectNoA11yViolations(document.body);
  });
});
