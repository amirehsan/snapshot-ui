import { act, fireEvent, render, screen } from '@testing-library/react';
import { Pencil } from 'lucide-react';
import { createRef, type ReactElement, type ReactNode } from 'react';
import { I18nProvider } from 'react-aria-components';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { expectNoA11yViolations } from '../../test/a11y';
import * as library from '../index';
import { Button } from '../button';
import { IconButton } from '../icon-button';
import { Link } from '../link';
import { Tooltip, TooltipTrigger, type TooltipProps, type TooltipTriggerProps } from './Tooltip';

/*
 * These tests count milliseconds on a fake clock. Testing Library's user-event waits on a real timer after
 * every step and moves only Jest's fake clock, so on Vitest's it never moves on. The helpers below send the
 * events React Aria listens for instead: a pointer move over the page, which makes the mouse the input it
 * answers, then the pointer entering or leaving; a Tab key down, which makes the keyboard the input, then focus.
 */

/** Lets `ms` of fake time pass, and React catch up. */
function wait(ms: number): void {
  act(() => {
    vi.advanceTimersByTime(ms);
  });
}

/** A mouse moving onto `element`. */
function mouseOnto(element: Element): void {
  act(() => {
    fireEvent.pointerMove(document.body, { pointerType: 'mouse' });
    fireEvent.pointerOver(element, { pointerType: 'mouse' });
  });
}

/** A mouse moving off `element`, onto the page. */
function mouseOff(element: Element): void {
  act(() => {
    fireEvent.pointerOut(element, { pointerType: 'mouse', relatedTarget: document.body });
    fireEvent.pointerOver(document.body, { pointerType: 'mouse' });
  });
}

/** Tab, landing on `element`. */
function tabTo(element: HTMLElement): void {
  act(() => {
    fireEvent.keyDown(document.activeElement ?? document.body, { key: 'Tab' });
    element.focus();
  });
}

/** The open tip, which React Aria portals to the body, or null. */
const tip = (): HTMLElement | null => screen.queryByRole('tooltip');

/** The open tip, which must be there. */
function openTip(): HTMLElement {
  const element = tip();
  if (!element) throw new Error('No tip');
  return element;
}

/** Reports the platform as `platform`, as `navigator.platform` does. */
const onPlatform = (platform: string): void => {
  vi.spyOn(navigator, 'platform', 'get').mockReturnValue(platform);
};

/** An icon button named Edit and its tip. */
function Tipped({
  tip: text = 'Edit',
  tooltip,
  ...props
}: Partial<TooltipTriggerProps> & { tip?: ReactNode; tooltip?: Partial<TooltipProps> }): ReactElement {
  return (
    <TooltipTrigger {...props}>
      <IconButton aria-label="Edit" variant="outline">
        <Pencil />
      </IconButton>
      <Tooltip {...tooltip}>{text}</Tooltip>
    </TooltipTrigger>
  );
}

/** The trigger of `Tipped`. */
const trigger = (): HTMLElement => screen.getByRole('button', { name: 'Edit' });

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  // React Aria's warm-up is module state: once a tip has opened, the next opens at once until 500ms after one
  // starts to close. Each test closes what it left open and lets that time pass, so the next one starts cold.
  act(() => {
    fireEvent.keyDown(document.body, { key: 'Escape' });
  });
  wait(1000);
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('TooltipTrigger and Tooltip', () => {
  it('render the tip only while it is open, a role="tooltip" in the overlay and tooltip classes', () => {
    render(<Tipped />);
    expect(tip()).toBeNull();
    tabTo(trigger());
    expect(openTip().className).toBe('overlay tooltip');
    expect(openTip()).toHaveTextContent('Edit');
    act(() => {
      trigger().blur();
    });
    expect(tip()).toBeNull();
  });

  it('describe the trigger by the tip while it is open, and not while it is closed', () => {
    render(<Tipped tip="Edit the project" />);
    expect(trigger()).not.toHaveAttribute('aria-describedby');
    tabTo(trigger());
    expect(trigger()).toHaveAttribute('aria-describedby', openTip().id);
    expect(trigger()).toHaveAccessibleDescription('Edit the project');
    act(() => {
      trigger().blur();
    });
    expect(trigger()).not.toHaveAttribute('aria-describedby');
  });

  it('open on hover after 400ms, and not at 399', () => {
    render(<Tipped />);
    mouseOnto(trigger());
    wait(399);
    expect(tip()).toBeNull();
    wait(1);
    expect(tip()).not.toBeNull();
  });

  it('open on hover after the delay they are given', () => {
    render(<Tipped delay={100} />);
    mouseOnto(trigger());
    wait(99);
    expect(tip()).toBeNull();
    wait(1);
    expect(tip()).not.toBeNull();
  });

  it('close 120ms after the pointer leaves, and not at 119', () => {
    render(<Tipped />);
    mouseOnto(trigger());
    wait(400);
    mouseOff(trigger());
    wait(119);
    expect(tip()).not.toBeNull();
    wait(1);
    expect(tip()).toBeNull();
  });

  it('close at once when the pointer leaves, with a closeDelay of 0', () => {
    render(<Tipped closeDelay={0} />);
    mouseOnto(trigger());
    wait(400);
    expect(tip()).not.toBeNull();
    mouseOff(trigger());
    expect(tip()).toBeNull();
  });

  it('keep the tip open while the pointer crosses onto it, and close it when the pointer leaves the tip', () => {
    render(<Tipped />);
    mouseOnto(trigger());
    wait(400);
    mouseOff(trigger());
    wait(60);
    mouseOnto(openTip());
    wait(300);
    expect(tip()).not.toBeNull();
    mouseOff(openTip());
    wait(120);
    expect(tip()).toBeNull();
  });

  it('open at once on keyboard focus', () => {
    render(<Tipped />);
    tabTo(trigger());
    expect(tip()).not.toBeNull();
  });

  it("open nothing on a click's focus, which is not visible", () => {
    render(<Tipped />);
    act(() => {
      fireEvent.pointerDown(trigger(), { pointerType: 'mouse' });
      trigger().focus();
    });
    expect(trigger()).toHaveFocus();
    wait(1000);
    expect(tip()).toBeNull();
  });

  it('open nothing for a touch pointer', () => {
    render(<Tipped />);
    act(() => {
      fireEvent.pointerOver(trigger(), { pointerType: 'touch' });
    });
    wait(1000);
    expect(tip()).toBeNull();
  });

  it('open nothing on hover or focus while the trigger is disabled', () => {
    render(<Tipped isDisabled />);
    mouseOnto(trigger());
    wait(1000);
    expect(tip()).toBeNull();
    tabTo(trigger());
    expect(trigger()).toHaveFocus();
    expect(tip()).toBeNull();
  });

  it('take a link as the trigger', () => {
    render(
      <TooltipTrigger>
        <Link href="/docs/components/button">Button</Link>
        <Tooltip>A control that runs an action</Tooltip>
      </TooltipTrigger>,
    );
    const link = screen.getByRole('link', { name: 'Button' });
    mouseOnto(link);
    wait(400);
    expect(link).toHaveAccessibleDescription('A control that runs an action');
    mouseOff(link);
    wait(1000);
    expect(tip()).toBeNull();
    tabTo(link);
    expect(link).toHaveAttribute('aria-describedby', openTip().id);
  });

  it('draw the shortcut as one key chip after the text, with Mod resolved', () => {
    onPlatform('MacIntel');
    render(<Tipped tip="Search" tooltip={{ shortcut: 'Mod K' }} />);
    tabTo(trigger());
    const chip = openTip().querySelector('kbd.tooltip-shortcut');
    expect(chip).toHaveTextContent('⌘ K');
    expect(openTip().lastElementChild).toBe(chip);
  });

  it('draw Mod as Ctrl off Apple platforms', () => {
    onPlatform('Win32');
    render(<Tipped tip="Search" tooltip={{ shortcut: 'Mod K' }} />);
    tabTo(trigger());
    expect(openTip().querySelector('kbd.tooltip-shortcut')).toHaveTextContent('Ctrl K');
  });

  it('draw no chip without a shortcut, or with an empty one', () => {
    const { unmount } = render(<Tipped />);
    tabTo(trigger());
    expect(openTip().querySelector('kbd')).toBeNull();
    unmount();
    render(<Tipped tooltip={{ shortcut: '' }} />);
    tabTo(trigger());
    expect(openTip().querySelector('kbd')).toBeNull();
  });

  it('draw an 8px arrow first, hidden from assistive technology, on the side React Aria placed the tip', () => {
    render(<Tipped />);
    tabTo(trigger());
    const arrow = openTip().firstElementChild;
    expect(arrow).toHaveClass('tooltip-arrow');
    expect(arrow).toHaveAttribute('data-placement', 'top');
    const svg = arrow?.querySelector('svg');
    expect(svg).toHaveAttribute('aria-hidden', 'true');
    expect(svg).toHaveAttribute('viewBox', '0 0 8 8');
    expect(svg?.querySelector('path')).toHaveAttribute('d', 'M0 0 4 4 8 0');
  });

  it('open above the trigger, 12px off, and pass placement and offset to React Aria', () => {
    // jsdom lays nothing out, so React Aria finds no reason to flip and reports the side it was asked for,
    // and the gap is the whole of the distance it writes.
    const { unmount } = render(<Tipped isOpen />);
    expect(openTip()).toHaveAttribute('data-placement', 'top');
    expect(openTip().style.bottom).toBe('12px');
    unmount();
    render(<Tipped isOpen tooltip={{ placement: 'bottom', offset: 20 }} />);
    expect(openTip()).toHaveAttribute('data-placement', 'bottom');
    expect(openTip().style.top).toBe('20px');
  });

  it('take the direction of the locale, which puts the end on the left in right to left', () => {
    const { unmount } = render(<Tipped isOpen tooltip={{ placement: 'end' }} />);
    expect(openTip()).toHaveAttribute('dir', 'ltr');
    expect(openTip()).toHaveAttribute('data-placement', 'right');
    unmount();
    render(
      <I18nProvider locale="ar-EG">
        <Tipped isOpen tooltip={{ placement: 'end' }} />
      </I18nProvider>,
    );
    expect(openTip()).toHaveAttribute('dir', 'rtl');
    expect(openTip()).toHaveAttribute('data-placement', 'left');
  });

  it("copy the theme, shape and density of the trigger's scope, not of what holds focus", () => {
    const page = (isOpen: boolean): ReactElement => (
      <>
        <div data-theme="light" data-shape="square">
          <button type="button">Elsewhere</button>
        </div>
        <div data-theme="dark" data-shape="soft" data-density="compact">
          <Tipped isOpen={isOpen} />
        </div>
      </>
    );
    const { rerender } = render(page(false));
    screen.getByRole('button', { name: 'Elsewhere' }).focus();
    rerender(page(true));
    expect(openTip()).toHaveAttribute('data-theme', 'dark');
    expect(openTip()).toHaveAttribute('data-shape', 'soft');
    expect(openTip()).toHaveAttribute('data-density', 'compact');
  });

  it('close on Escape', () => {
    render(<Tipped />);
    tabTo(trigger());
    expect(tip()).not.toBeNull();
    act(() => {
      fireEvent.keyDown(trigger(), { key: 'Escape' });
    });
    expect(tip()).toBeNull();
    expect(trigger()).toHaveFocus();
  });

  it('close on a press of the trigger, by the pointer or by a key', () => {
    render(<Tipped />);
    tabTo(trigger());
    act(() => {
      fireEvent.pointerDown(trigger(), { pointerType: 'mouse' });
    });
    expect(tip()).toBeNull();
    act(() => {
      trigger().blur();
    });
    wait(1000);
    tabTo(trigger());
    expect(tip()).not.toBeNull();
    act(() => {
      fireEvent.keyDown(trigger(), { key: 'Enter' });
    });
    expect(tip()).toBeNull();
  });

  it('close when the window resizes', () => {
    render(<Tipped />);
    tabTo(trigger());
    expect(tip()).not.toBeNull();
    act(() => {
      window.dispatchEvent(new Event('resize'));
    });
    expect(tip()).toBeNull();
  });

  it("merge a className string, or a function of the tip's state, after the library classes", () => {
    const { unmount } = render(<Tipped isOpen tooltip={{ className: 'rail-tip' }} />);
    expect(openTip().className).toBe('overlay tooltip rail-tip');
    unmount();
    render(
      <Tipped
        isOpen
        tooltip={{
          className: ({ placement, defaultClassName }) => `${String(defaultClassName)} ${String(placement)}`,
        }}
      />,
    );
    expect(openTip().className).toBe('overlay tooltip react-aria-Tooltip top');
  });

  it('put ref on the tip', () => {
    const ref = createRef<HTMLDivElement>();
    render(<Tipped isOpen tooltip={{ ref }} />);
    expect(ref.current).toBe(openTip());
  });

  it('are exported from the package', () => {
    expect(library).toHaveProperty('Tooltip');
    expect(library).toHaveProperty('TooltipTrigger');
  });

  it('have no axe violations open, on a button with a tip', async () => {
    vi.useRealTimers();
    render(
      <TooltipTrigger>
        <Button variant="secondary">Save</Button>
        <Tooltip shortcut="Mod S">Saves the draft</Tooltip>
      </TooltipTrigger>,
    );
    tabTo(screen.getByRole('button', { name: 'Save' }));
    expect(tip()).not.toBeNull();
    await expectNoA11yViolations(document.body);
    vi.useFakeTimers();
  });
});
