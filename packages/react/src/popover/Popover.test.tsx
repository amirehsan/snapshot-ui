import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef, useRef, type ReactElement } from 'react';
import { I18nProvider, PopoverContext } from 'react-aria-components';
import { describe, expect, it, vi } from 'vitest';
import { expectNoA11yViolations } from '../../test/a11y';
import * as library from '../index';
import { Button } from '../button';
import { Checkbox, CheckboxGroup } from '../checkbox';
import { DialogTrigger } from '../dialog';
import { Popover, type PopoverProps } from './Popover';

/** The open popover's element, which React Aria portals to the body. */
function popover(): HTMLElement {
  const element = document.querySelector<HTMLElement>('.popover');
  if (!element) throw new Error('No popover');
  return element;
}

/** A filter panel, the free content a popover holds. */
const FILTERS = (
  <CheckboxGroup label="Status" defaultValue={['active']}>
    <Checkbox value="active">Active</Checkbox>
    <Checkbox value="paused">Paused</Checkbox>
  </CheckboxGroup>
);

/** A trigger and its popover, closed until the trigger is pressed unless `defaultOpen`. */
function Triggered({
  defaultOpen,
  ...props
}: Partial<PopoverProps> & { defaultOpen?: boolean }): ReactElement {
  return (
    <DialogTrigger defaultOpen={defaultOpen}>
      <Button variant="secondary">Filter</Button>
      <Popover {...props}>{props.children ?? FILTERS}</Popover>
    </DialogTrigger>
  );
}

/**
 * A trigger in a dark, soft scope and another button in a light, square one, with a popover opened by its
 * own state, positioned against the trigger by `triggerRef`, as a filter chip's panel would be.
 */
function Scoped({ isOpen }: { isOpen: boolean }): ReactElement {
  const triggerRef = useRef<HTMLButtonElement>(null);
  return (
    <>
      <div data-theme="dark" data-shape="soft">
        <button ref={triggerRef} type="button">
          Filter
        </button>
      </div>
      <div data-theme="light" data-shape="square">
        <button type="button">Elsewhere</button>
      </div>
      <Popover isOpen={isOpen} triggerRef={triggerRef} aria-label="Filters">
        Panel
      </Popover>
    </>
  );
}

describe('Popover', () => {
  it('renders nothing until its trigger opens it, then a dialog named by the trigger, which takes focus', async () => {
    const user = userEvent.setup();
    render(<Triggered />);
    expect(document.querySelector('.popover')).not.toBeInTheDocument();
    const trigger = screen.getByRole('button', { name: 'Filter' });
    await user.click(trigger);
    const dialog = screen.getByRole('dialog', { name: 'Filter' });
    expect(dialog).toBe(popover());
    expect(dialog).toHaveAttribute('aria-labelledby', trigger.id);
    expect(dialog).toHaveAttribute('data-trigger', 'DialogTrigger');
    expect(dialog).toHaveFocus();
    expect(screen.getByRole('group', { name: 'Status' })).toBeInTheDocument();
  });

  it('carries the overlay and popover classes and nothing else by default', () => {
    render(<Triggered defaultOpen />);
    expect(popover().className).toBe('overlay popover');
  });

  it('adds popover-padded with isPadded and popover-match-trigger with matchTriggerWidth', () => {
    const { unmount } = render(<Triggered defaultOpen isPadded />);
    expect(popover().className).toBe('overlay popover popover-padded');
    unmount();
    render(<Triggered defaultOpen isPadded matchTriggerWidth />);
    expect(popover().className).toBe('overlay popover popover-padded popover-match-trigger');
  });

  it('merges a className string after the library classes', () => {
    render(<Triggered defaultOpen matchTriggerWidth className="menu-popover" />);
    expect(popover().className).toBe('overlay popover popover-match-trigger menu-popover');
  });

  it("takes a className function of the popover's state, merged after the library classes", () => {
    render(
      <Triggered
        defaultOpen
        className={({ defaultClassName, trigger }) => `mine ${String(defaultClassName)} ${String(trigger)}`}
      />,
    );
    expect(popover().className).toBe('overlay popover mine react-aria-Popover DialogTrigger');
  });

  it('puts ref on the popover element', () => {
    const ref = createRef<HTMLElement>();
    render(<Triggered defaultOpen ref={ref} />);
    expect(ref.current).toBe(popover());
  });

  it('lands below its trigger by default, which data-placement says', () => {
    // jsdom lays nothing out, so React Aria finds no reason to flip and reports the side it was asked for.
    render(<Triggered defaultOpen />);
    expect(popover()).toHaveAttribute('data-placement', 'bottom');
  });

  it('says where it landed when asked for another side', () => {
    render(<Triggered defaultOpen placement="top end" />);
    expect(popover()).toHaveAttribute('data-placement', 'top');
  });

  it('takes the side the trigger component asks for when the caller names none', () => {
    function FromContext(): ReactElement {
      const triggerRef = useRef<HTMLButtonElement>(null);
      return (
        <>
          <button ref={triggerRef} type="button">
            Pick
          </button>
          <PopoverContext.Provider value={{ placement: 'top', triggerRef }}>
            <Popover isOpen aria-label="Picker">
              Panel
            </Popover>
          </PopoverContext.Provider>
        </>
      );
    }
    render(<FromContext />);
    expect(popover()).toHaveAttribute('data-placement', 'top');
  });

  it('closes on Escape and gives focus back to the trigger', async () => {
    const user = userEvent.setup();
    render(<Triggered />);
    const trigger = screen.getByRole('button', { name: 'Filter' });
    await user.click(trigger);
    expect(popover()).toHaveFocus();
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    // React Aria gives focus back in the next animation frame.
    await waitFor(() => {
      expect(trigger).toHaveFocus();
    });
  });

  it('closes on a press outside it', async () => {
    const user = userEvent.setup();
    render(<Triggered />);
    await user.click(screen.getByRole('button', { name: 'Filter' }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    await user.click(document.body);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('keeps Tab inside: past the last control it comes back to the first', async () => {
    const user = userEvent.setup();
    render(<Triggered />);
    await user.click(screen.getByRole('button', { name: 'Filter' }));
    await user.tab();
    expect(screen.getByRole('checkbox', { name: 'Active' })).toHaveFocus();
    await user.tab();
    expect(screen.getByRole('checkbox', { name: 'Paused' })).toHaveFocus();
    await user.tab();
    expect(screen.getByRole('checkbox', { name: 'Active' })).toHaveFocus();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('copies the scope of the trigger its DialogTrigger gives it, not of what holds focus', () => {
    render(
      <>
        <div data-theme="light" data-shape="square">
          <button type="button">Elsewhere</button>
        </div>
        <div data-theme="dark" data-shape="soft">
          <Triggered defaultOpen />
        </div>
      </>,
    );
    // Opened by its default, before anything was pressed: focus never was on the trigger.
    expect(popover()).toHaveAttribute('data-theme', 'dark');
    expect(popover()).toHaveAttribute('data-shape', 'soft');
    expect(popover()).not.toHaveAttribute('data-density');
  });

  it('copies the scope of the triggerRef it is given, even when focus is elsewhere', () => {
    const { rerender } = render(<Scoped isOpen={false} />);
    const elsewhere = screen.getByRole('button', { name: 'Elsewhere' });
    elsewhere.focus();
    expect(elsewhere).toHaveFocus();
    rerender(<Scoped isOpen />);
    expect(popover()).toHaveAttribute('data-theme', 'dark');
    expect(popover()).toHaveAttribute('data-shape', 'soft');
  });

  it('takes the direction of the locale', () => {
    render(
      <I18nProvider locale="ar-EG">
        <Triggered defaultOpen />
      </I18nProvider>,
    );
    expect(popover()).toHaveAttribute('dir', 'rtl');
  });

  it('names triggerRef when it is opened outside a trigger without one, and renders nothing when closed', () => {
    // React's own report of the error the render throws.
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    for (const open of [{ isOpen: true }, { defaultOpen: true }]) {
      expect(() => render(<Popover {...open}>Panel</Popover>)).toThrow(
        /Popover: .*outside a DialogTrigger or MenuTrigger needs `triggerRef`/,
      );
    }
    error.mockRestore();
    render(<Popover isOpen={false}>Panel</Popover>);
    expect(document.querySelector('.popover')).toBeNull();
  });

  it('is exported from the package', () => {
    expect(library).toHaveProperty('Popover');
  });

  it('exports React Aria’s Placement type, so an app types a placement with no React Aria import', () => {
    // Each line fails `pnpm typecheck` if the package stops exporting the type, or exports a looser one.
    const placement: library.Placement = 'top end';
    // @ts-expect-error a placement is a side and an optional alignment
    const nowhere: library.Placement = 'middle';
    expect([placement, nowhere]).toHaveLength(2);
  });

  it('has no axe violations open', async () => {
    render(<Triggered defaultOpen isPadded />);
    await expectNoA11yViolations(document.body);
  });
});
