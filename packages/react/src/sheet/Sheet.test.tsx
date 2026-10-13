import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef, type ReactElement } from 'react';
import { I18nProvider } from 'react-aria-components';
import { describe, expect, it, vi } from 'vitest';
import { expectNoA11yViolations } from '../../test/a11y';
import { holdFrames } from '../../test/dom';
import * as library from '../index';
import { Button } from '../button';
import { Link } from '../link';
import { openModals } from '../overlay/useOverlayStack';
import { Sheet, SheetTrigger, type SheetProps } from './Sheet';

/** The one element on the page that matches `selector`, wherever React Aria portaled it. */
function only(selector: string): HTMLElement {
  const found = document.querySelectorAll<HTMLElement>(selector);
  const [first] = found;
  if (found.length !== 1 || !first)
    throw new Error(`Expected one ${selector}, found ${String(found.length)}`);
  return first;
}

/** The open sheet's overlay, the page-sized element React Aria positions. */
const overlay = (): HTMLElement => only('.sheet-overlay');

/** The open sheet's backdrop, which is its scrim. */
const backdrop = (): HTMLElement => only('.sheet-scrim');

/** The open sheet's panel. */
const panel = (): HTMLElement => only('.sheet');

/** An open sheet with a title, and whatever else the test gives it. */
function open(props: Partial<SheetProps> = {}): ReturnType<typeof render> {
  return render(<Sheet isOpen title="Filter transactions" {...props} />);
}

/** A trigger and its sheet, closed until the trigger is pressed. */
function Triggered(props: Partial<SheetProps>): ReactElement {
  return (
    <SheetTrigger>
      <Button>Filter transactions</Button>
      <Sheet title="Filter transactions" {...props} />
    </SheetTrigger>
  );
}

/** A short list of pages, the shell's "More" sheet. */
const MORE = (
  <nav aria-label="More pages">
    <Link href="/reports">Reports</Link>
    <Link href="/settings">Settings</Link>
  </nav>
);

describe('Sheet', () => {
  it('is a dialog named by its title, which is an h2', () => {
    open();
    const dialog = screen.getByRole('dialog', { name: 'Filter transactions' });
    const heading = screen.getByRole('heading', { level: 2 });
    expect(heading).toHaveTextContent('Filter transactions');
    expect(heading).toHaveClass('sheet-title');
    expect(dialog).toHaveClass('sheet-content');
    expect(dialog).toHaveAttribute('tabindex', '-1');
    expect(dialog).toHaveAttribute('aria-labelledby', heading.id);
  });

  it('draws the grabber band, the header, the body and the footer in that order, in the sheet on its overlay', () => {
    open({ description: 'Narrow the list.', children: <p>Payee</p>, footer: <Button>Show 24</Button> });
    const dialog = screen.getByRole('dialog');
    expect(dialog.closest('.sheet')).toBe(panel());
    expect(overlay()).toContainElement(panel());
    expect(overlay()).toContainElement(backdrop());
    expect(backdrop()).not.toContainElement(panel());
    expect([...dialog.children].map((child) => child.className)).toEqual([
      'sheet-grabber-band',
      'sheet-header',
      'sheet-body',
      'sheet-footer',
    ]);
    const header = only('.sheet-header');
    expect(header.firstElementChild).toHaveClass('sheet-header-text');
    expect(header.lastElementChild).toHaveClass('sheet-close');
    const text = only('.sheet-header-text');
    expect([...text.children].map((child) => child.className)).toEqual(['sheet-title', 'sheet-description']);
    expect(only('.sheet-body')).toHaveTextContent('Payee');
    expect(only('.sheet-footer')).toContainElement(screen.getByRole('button', { name: 'Show 24' }));
  });

  it('keeps a hidden title as the name, in a visually hidden wrapper that is still in the tree', () => {
    open({ title: 'More', isTitleHidden: true, children: MORE });
    expect(screen.getByRole('dialog', { name: 'More' })).toBeInTheDocument();
    const heading = screen.getByRole('heading', { level: 2, name: 'More' });
    const wrapper = heading.parentElement;
    if (!wrapper) throw new Error('No wrapper');
    expect(wrapper).not.toHaveClass('sheet-header-text');
    expect(wrapper.parentElement).toHaveClass('sheet-header-text');
    // React Aria's visually hidden pattern: a 1px box, clipped, out of the flow.
    expect(wrapper.style.position).toBe('absolute');
    expect(wrapper.style.width).toBe('1px');
    expect(wrapper.style.height).toBe('1px');
    expect(wrapper.style.clipPath).toBe('inset(50%)');
  });

  it('shows the title in place when it is not hidden', () => {
    open();
    expect(screen.getByRole('heading', { level: 2 }).parentElement).toHaveClass('sheet-header-text');
  });

  it('is described by its description, a paragraph under the title', () => {
    open({ description: 'Narrow the list to what you are looking for.' });
    const description = only('.sheet-description');
    expect(description.tagName).toBe('P');
    expect(screen.getByRole('dialog')).toHaveAttribute('aria-describedby', description.id);
    expect(screen.getByRole('dialog')).toHaveAccessibleDescription(
      'Narrow the list to what you are looking for.',
    );
  });

  it('draws no description and no aria-describedby without one', () => {
    open();
    expect(document.querySelector('.sheet-description')).not.toBeInTheDocument();
    expect(screen.getByRole('dialog')).not.toHaveAttribute('aria-describedby');
  });

  it('draws a decorative grabber, hidden from assistive technology, and none with hasGrabber false', () => {
    const { unmount } = open();
    const grabber = only('.sheet-grabber');
    expect(grabber).toHaveAttribute('aria-hidden', 'true');
    expect(grabber.parentElement).toHaveClass('sheet-grabber-band');
    unmount();
    open({ hasGrabber: false });
    expect(document.querySelector('.sheet-grabber-band, .sheet-grabber')).not.toBeInTheDocument();
    expect(screen.getByRole('dialog').firstElementChild).toHaveClass('sheet-header');
  });

  it('draws a close button named Close by default, which closes the sheet', async () => {
    const user = userEvent.setup();
    render(<Triggered />);
    await user.click(screen.getByRole('button', { name: 'Filter transactions' }));
    const close = screen.getByRole('button', { name: 'Close' });
    expect(close).toHaveClass('icon-button', 'sheet-close');
    expect(close.querySelector('svg')).toBeInTheDocument();
    await user.click(close);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('names the close button with closeLabel', () => {
    open({ closeLabel: 'Fermer' });
    expect(screen.getByRole('button', { name: 'Fermer' })).toHaveClass('sheet-close');
  });

  it('draws no close button with hasCloseButton false', () => {
    open({ hasCloseButton: false });
    // React Aria's own visually hidden Dismiss button stays, for screen readers; the X is gone.
    expect(screen.queryByRole('button', { name: 'Close' })).not.toBeInTheDocument();
    expect(document.querySelector('.sheet-close')).not.toBeInTheDocument();
  });

  it('draws no header when nothing in it would show, and the hidden title still names the sheet', () => {
    open({ title: 'More', isTitleHidden: true, hasCloseButton: false, children: MORE });
    const dialog = screen.getByRole('dialog', { name: 'More' });
    expect(document.querySelector('.sheet-header')).not.toBeInTheDocument();
    const heading = screen.getByRole('heading', { level: 2, name: 'More' });
    expect(heading.parentElement?.parentElement).toBe(dialog);
    expect(heading.parentElement?.style.position).toBe('absolute');
    expect([...dialog.children].map((child) => child.className)).toEqual([
      'sheet-grabber-band',
      '',
      'sheet-body',
    ]);
  });

  it('keeps the header for a description when the title is hidden and there is no close button', () => {
    open({ isTitleHidden: true, hasCloseButton: false, description: 'Pick what to show.' });
    expect(only('.sheet-header')).toContainElement(only('.sheet-description'));
  });

  it('draws the footer only when given one, and the body always', () => {
    const { unmount } = open();
    expect(document.querySelector('.sheet-footer')).not.toBeInTheDocument();
    expect(document.querySelector('.sheet-body')).toBeInTheDocument();
    unmount();
    open({ footer: <Button>Sign out</Button> });
    expect(only('.sheet-footer')).toContainElement(screen.getByRole('button', { name: 'Sign out' }));
  });

  it('hands children given as a function a close that closes the sheet', async () => {
    const user = userEvent.setup();
    const children = vi.fn(({ close }: { close: () => void }) => (
      <Button variant="secondary" onPress={close}>
        Clear the filters
      </Button>
    ));
    render(<Triggered>{children}</Triggered>);
    await user.click(screen.getByRole('button', { name: 'Filter transactions' }));
    expect(typeof children.mock.lastCall?.[0].close).toBe('function');
    expect(only('.sheet-body')).toContainElement(screen.getByRole('button', { name: 'Clear the filters' }));
    await user.click(screen.getByRole('button', { name: 'Clear the filters' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('closes on Escape', async () => {
    const user = userEvent.setup();
    render(<Triggered />);
    await user.click(screen.getByRole('button', { name: 'Filter transactions' }));
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('closes on a press on the scrim', async () => {
    const user = userEvent.setup();
    render(<Triggered />);
    await user.click(screen.getByRole('button', { name: 'Filter transactions' }));
    await user.click(backdrop());
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('stays open on Escape and a press on the scrim with isDismissable false, and its close button closes it', async () => {
    const user = userEvent.setup();
    render(<Triggered isDismissable={false} />);
    await user.click(screen.getByRole('button', { name: 'Filter transactions' }));
    await user.keyboard('{Escape}');
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    await user.click(backdrop());
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    // React Aria draws no hidden Dismiss button for a sheet that cannot be dismissed; the X is the way out.
    expect(screen.queryByRole('button', { name: 'Dismiss' })).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Close' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('stays open for a press inside the toast region', async () => {
    const user = userEvent.setup();
    const region = document.createElement('div');
    region.className = 'toast-region';
    const undo = region.appendChild(document.createElement('button'));
    undo.type = 'button';
    undo.textContent = 'Undo';
    render(<Triggered />);
    await user.click(screen.getByRole('button', { name: 'Filter transactions' }));
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
    const { rerender } = render(<Sheet isOpen onOpenChange={onOpenChange} title="More" />);
    expect(screen.getByRole('dialog')).toHaveFocus();
    await user.keyboard('{Escape}');
    expect(onOpenChange).toHaveBeenCalledExactlyOnceWith(false);
    // The caller owns the state, and it still says open.
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    rerender(<Sheet isOpen={false} onOpenChange={onOpenChange} title="More" />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('opens from defaultOpen and closes on its own', async () => {
    const user = userEvent.setup();
    render(<Sheet defaultOpen title="More" />);
    expect(screen.getByRole('dialog')).toHaveFocus();
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('puts className on the sheet and overlayClassName on the backdrop, after the library classes, and ref on the dialog', () => {
    const ref = createRef<HTMLDivElement>();
    open({ className: 'mine', overlayClassName: 'theirs', ref });
    expect(panel().className).toBe('overlay sheet mine');
    expect(backdrop().className).toBe('overlay-scrim sheet-scrim theirs');
    expect(ref.current).toBe(screen.getByRole('dialog'));
  });

  it('takes a className function of the sheet state', () => {
    open({
      className: ({ defaultClassName, position }) => `mine ${String(defaultClassName)} ${position}`,
    });
    expect(panel().className).toBe('overlay sheet mine react-aria-Modal bottom');
  });

  it('puts the scrim on the backdrop only, and nothing but its own class and the direction on the overlay', () => {
    open();
    expect(overlay().className).toBe('sheet-overlay');
    expect(overlay()).toHaveAttribute('dir', 'ltr');
    expect(overlay()).toHaveAttribute('data-position', 'bottom');
    expect(backdrop()).toHaveClass('overlay-scrim');
    // React Aria keeps its own position on the overlay, at the document's origin.
    expect(overlay().style.position).toBe('absolute');
  });

  it('sets the direction of the locale on the overlay', () => {
    render(
      <I18nProvider locale="ar-EG">
        <Sheet isOpen title="More" />
      </I18nProvider>,
    );
    expect(overlay()).toHaveAttribute('dir', 'rtl');
    // It still rises from the bottom.
    expect(overlay()).toHaveAttribute('data-position', 'bottom');
  });

  it('passes snapPoints to React Aria, which marks one stop per point inside the sheet, the first the one it opens at', () => {
    open({ snapPoints: ['40%', '100%'] });
    const stops = panel().querySelectorAll<HTMLElement>('[data-sheet-detent]');
    expect(stops).toHaveLength(2);
    expect(stops[0]).toHaveAttribute('data-sheet-initial');
    expect(stops[1]).not.toHaveAttribute('data-sheet-initial');
    expect(stops[0]?.style.top).toBe('40%');
    expect(stops[1]?.style.top).toBe('100%');
  });

  it('marks no stops without snapPoints', () => {
    open();
    expect(panel().querySelector('[data-sheet-detent]')).toBeNull();
  });

  it('copies the theme of the trigger onto the sheet, and not onto the backdrop or the overlay', async () => {
    const user = userEvent.setup();
    render(
      <div data-theme="dark">
        <Triggered />
      </div>,
    );
    await user.click(screen.getByRole('button', { name: 'Filter transactions' }));
    expect(panel()).toHaveAttribute('data-theme', 'dark');
    expect(backdrop()).not.toHaveAttribute('data-theme');
    expect(overlay()).not.toHaveAttribute('data-theme');
  });

  it('holds the page still while open and lets it go on close', async () => {
    const user = userEvent.setup();
    render(<Triggered />);
    expect(document.documentElement.style.overflow).toBe('');
    await user.click(screen.getByRole('button', { name: 'Filter transactions' }));
    expect(document.documentElement.style.overflow).toBe('hidden');
    await user.keyboard('{Escape}');
    expect(document.documentElement.style.overflow).toBe('');
  });

  it('hides the page behind it from assistive technology while open', async () => {
    const user = userEvent.setup();
    render(<Triggered />);
    const trigger = screen.getByRole('button', { name: 'Filter transactions' });
    await user.click(trigger);
    expect(trigger.closest('[aria-hidden="true"]')).not.toBeNull();
    await user.keyboard('{Escape}');
    expect(trigger.closest('[aria-hidden="true"]')).toBeNull();
  });

  it('moves focus into the sheet, holds it there, and gives it back to the trigger on close', async () => {
    const user = userEvent.setup();
    render(<Triggered title="More">{MORE}</Triggered>);
    const trigger = screen.getByRole('button', { name: 'Filter transactions' });
    await user.click(trigger);
    const dialog = screen.getByRole('dialog', { name: 'More' });
    expect(dialog).toHaveFocus();
    await user.tab();
    expect(screen.getByRole('button', { name: 'Close' })).toHaveFocus();
    await user.tab();
    expect(screen.getByRole('link', { name: 'Reports' })).toHaveFocus();
    await user.tab();
    expect(screen.getByRole('link', { name: 'Settings' })).toHaveFocus();
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

  it('makes the body a tab stop while it scrolls and holds nothing to focus, and only then', () => {
    // jsdom lays nothing out, so the body's heights are given: taller inside than it shows, then not.
    const inside = vi.spyOn(HTMLElement.prototype, 'scrollHeight', 'get').mockReturnValue(900);
    const shown = vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(300);
    const body = (): HTMLElement | null => document.querySelector<HTMLElement>('.sheet-body');
    try {
      const { unmount } = open({ children: <p>Long words</p> });
      expect(body()).toHaveAttribute('tabindex', '0');
      unmount();
      inside.mockReturnValue(300);
      const { unmount: unmountShort } = open({ children: <p>Short words</p> });
      expect(body()).not.toHaveAttribute('tabindex');
      unmountShort();
      inside.mockReturnValue(900);
      open({ children: MORE });
      expect(body()).not.toHaveAttribute('tabindex');
    } finally {
      inside.mockRestore();
      shown.mockRestore();
    }
  });

  it('stacks a second sheet over the first: one scrim paints, and Escape closes the top one only', async () => {
    const user = userEvent.setup();
    // Every frame held back, as on a loaded machine whose next frame comes late. React Aria gives focus back in
    // a frame, so only the library's own restore, as the top panel leaves, can put it back on the trigger
    // before the dialog under it finds focus on the body and takes it.
    holdFrames();
    render(
      <Sheet defaultOpen title="More">
        <SheetTrigger>
          <Button variant="secondary">Filter transactions</Button>
          <Sheet title="Filter transactions" />
        </SheetTrigger>
      </Sheet>,
    );
    const inner = screen.getByRole('button', { name: 'Filter transactions' });
    await user.click(inner);
    expect(screen.getByRole('dialog', { name: 'Filter transactions' })).toBeInTheDocument();
    expect(openModals()).toHaveLength(2);
    const [first, second] = [...document.querySelectorAll<HTMLElement>('.sheet-scrim')];
    expect(first).not.toHaveAttribute('data-stacked');
    expect(second).toHaveAttribute('data-stacked', '');
    const [, top] = [...document.querySelectorAll<HTMLElement>('.sheet-overlay')];
    expect(top).toHaveAttribute('data-stack-index', '1');
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog', { name: 'Filter transactions' })).not.toBeInTheDocument();
    expect(screen.getByRole('dialog', { name: 'More' })).toBeInTheDocument();
    expect(inner).toHaveFocus();
    expect(openModals()).toHaveLength(1);
  });

  it('is exported from the package with its trigger', () => {
    expect(library).toHaveProperty('Sheet');
    expect(library).toHaveProperty('SheetTrigger');
  });

  it('has no axe violations open with a visible title', async () => {
    open({
      description: 'Narrow the list to what you are looking for.',
      children: <p>Payee</p>,
      footer: <Button>Show 24 transactions</Button>,
    });
    await expectNoA11yViolations(document.body);
  });

  it('has no axe violations open with a hidden title', async () => {
    open({ title: 'More', isTitleHidden: true, children: MORE, footer: <Button>Sign out</Button> });
    await expectNoA11yViolations(document.body);
  });
});
