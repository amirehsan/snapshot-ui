import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CalendarDate } from '@internationalized/date';
import { createRef, type ReactElement } from 'react';
import { hydrateRoot, type Root } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { I18nProvider } from 'react-aria-components';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { expectNoA11yViolations } from '../../test/a11y';
import { root } from '../../test/dom';
import { Calendar } from './Calendar';

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

/** The month React Aria shows, from its heading. */
const heading = (container: HTMLElement): string =>
  container.querySelector('.calendar-heading')?.textContent ?? '';

/** The day of the shown month whose number is `day`, the cell's inner button. */
function day(container: HTMLElement, number: number): HTMLElement {
  const found = [...container.querySelectorAll<HTMLElement>('.calendar-day:not([data-outside-month])')].find(
    (each) => each.textContent === String(number),
  );
  if (!found) throw new Error(`No day ${String(number)}`);
  return found;
}

/** That day's number, which carries the library's today mark. */
function numberOf(container: HTMLElement, number: number): HTMLElement {
  const found = day(container, number).querySelector<HTMLElement>('.calendar-day-number');
  if (!found) throw new Error(`No number in day ${String(number)}`);
  return found;
}

/** Puts focus on the chosen day, as a Tab into the grid does. */
function focusChosen(container: HTMLElement): void {
  const chosen = container.querySelector<HTMLElement>('[aria-selected="true"] > .calendar-day');
  if (!chosen) throw new Error('No chosen day');
  act(() => {
    chosen.focus();
  });
}

describe('Calendar', () => {
  it('is an application named by its aria-label, with a grid of days and the month buttons named by labels', () => {
    const { container, rerender } = render(<Calendar aria-label="Date" defaultValue="2026-09-14" />);
    expect(screen.getByRole('application', { name: 'Date, September 2026' })).toBe(root(container));
    expect(root(container)).toHaveClass('calendar');
    expect(root(container)).not.toHaveClass('range-calendar');
    const grid = screen.getByRole('grid', { name: 'Date, September 2026' });
    expect(grid).toHaveClass('calendar-grid');
    expect(grid.tagName).toBe('TABLE');
    expect(screen.getByRole('button', { name: 'Previous month' })).toHaveClass('icon-button');
    expect(screen.getByRole('button', { name: 'Next month' })).toHaveClass('icon-button');
    const header = container.querySelector('.calendar-header');
    // A plain element: a header outside a section would be a banner landmark inside the calendar.
    expect(header?.tagName).toBe('DIV');
    expect([...(header?.children ?? [])].map((child) => child.className)).toEqual([
      'icon-button',
      'calendar-heading',
      'icon-button',
    ]);
    // React Aria's month title, hidden from the reader, who hears it in the root's and the grid's names.
    expect(heading(container)).toBe('September 2026');
    expect(container.querySelector('.calendar-heading')).toHaveAttribute('aria-hidden', 'true');
    expect(container.querySelectorAll('.calendar-weekday')).toHaveLength(7);
    expect(day(container, 14).querySelector('.calendar-day-number')).not.toBeNull();
    // No presets on a single calendar.
    expect(container.querySelector('.calendar-presets')).toBeNull();

    rerender(
      <Calendar
        aria-label="Date"
        defaultValue="2026-09-14"
        labels={{ previous: 'Earlier', next: 'Later' }}
      />,
    );
    expect(screen.getByRole('button', { name: 'Earlier' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Later' })).toBeInTheDocument();
  });

  it('reads and writes ISO dates, and fa-IR writes Gregorian ones', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const { container, unmount } = render(
      <Calendar aria-label="Date" defaultValue="2026-09-14" onChange={onChange} />,
    );
    expect(day(container, 14).parentElement).toHaveAttribute('aria-selected', 'true');
    await user.click(day(container, 15));
    expect(onChange).toHaveBeenLastCalledWith('2026-09-15');
    unmount();

    const persian = vi.fn();
    const { container: fa } = render(
      <I18nProvider locale="fa-IR">
        <Calendar aria-label="تاریخ" defaultValue="2026-09-14" onChange={persian} />
      </I18nProvider>,
    );
    // The Persian calendar: 14 September 2026 is 23 Shahrivar 1405, and a week down is 30 Shahrivar.
    expect(heading(fa)).toMatch(/۱۴۰۵/);
    focusChosen(fa);
    await user.keyboard('{ArrowDown}{Enter}');
    expect(persian).toHaveBeenLastCalledWith('2026-09-21');
  });

  it('reads an invalid value as none, warns once, and never throws', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const { container, rerender } = render(<Calendar aria-label="Date" value="2026-02-30" />);
    expect(container.querySelector('[aria-selected="true"]')).toBeNull();
    rerender(<Calendar aria-label="Date" value="2026-02-30" />);
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0]?.[0]).toMatch(/2026-02-30/);
    expect(() =>
      render(<Calendar aria-label="Date" defaultValue="tomorrow" minValue="soon" />),
    ).not.toThrow();
  });

  it('opens on the value month, then on today month, then on the device month', () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-05-15T12:00:00Z'));
    const { container: valued } = render(<Calendar aria-label="Date" defaultValue="2026-03-10" />);
    expect(heading(valued)).toBe('March 2026');
    const { container: todayed } = render(<Calendar aria-label="Date" today="2026-09-18" />);
    expect(heading(todayed)).toBe('September 2026');
    const { container: device } = render(<Calendar aria-label="Date" />);
    expect(heading(device)).toBe('May 2026');
  });

  it('opens on the value month even with today given', () => {
    const { container } = render(<Calendar aria-label="Date" value="2026-03-10" today="2026-09-18" />);
    expect(heading(container)).toBe('March 2026');
  });

  it('marks today from the today prop under a mocked clock in another zone, not the device day', () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    // 22:30 on the 18th in UTC is already the 19th in the app's zone east of it.
    vi.setSystemTime(new Date('2026-09-18T22:30:00Z'));
    const { container, unmount } = render(<Calendar aria-label="Date" today="2026-09-19" />);
    expect(numberOf(container, 19)).toHaveAttribute('data-today');
    expect(numberOf(container, 18)).not.toHaveAttribute('data-today');
    expect(container.querySelectorAll('.calendar-day-number[data-today]')).toHaveLength(1);
    unmount();

    vi.setSystemTime(new Date('2026-09-30T21:00:00Z'));
    const { container: october } = render(<Calendar aria-label="Date" today="2026-10-01" />);
    expect(heading(october)).toBe('October 2026');
    expect(numberOf(october, 1)).toHaveAttribute('data-today');
  });

  it('marks the device today when no today is given', () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-09-18T12:00:00Z'));
    const { container } = render(<Calendar aria-label="Date" />);
    expect(numberOf(container, 18)).toHaveAttribute('data-today');
    expect(container.querySelectorAll('.calendar-day-number[data-today]')).toHaveLength(1);
  });

  it('passes ISO dates to isDateUnavailable, and marks those days unavailable', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const isDateUnavailable = vi.fn((date: string) => date === '2026-09-20');
    const { container } = render(
      <Calendar
        aria-label="Date"
        defaultValue="2026-09-14"
        isDateUnavailable={isDateUnavailable}
        onChange={onChange}
      />,
    );
    expect(isDateUnavailable).toHaveBeenCalledWith('2026-09-20');
    for (const [date] of isDateUnavailable.mock.calls) expect(date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(day(container, 20)).toHaveAttribute('data-unavailable');
    expect(day(container, 21)).not.toHaveAttribute('data-unavailable');
    await user.click(day(container, 20));
    expect(onChange).not.toHaveBeenCalled();
  });

  it('keeps days outside minValue and maxValue from being chosen', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const { container } = render(
      <Calendar
        aria-label="Date"
        defaultValue="2026-09-14"
        minValue="2026-09-03"
        maxValue="2026-09-26"
        onChange={onChange}
      />,
    );
    expect(day(container, 2)).toHaveAttribute('data-disabled');
    expect(day(container, 27)).toHaveAttribute('data-disabled');
    expect(day(container, 3)).not.toHaveAttribute('data-disabled');
    await user.click(day(container, 2));
    await user.click(day(container, 27));
    expect(onChange).not.toHaveBeenCalled();
    // Neither month button leaves the bounds.
    expect(screen.getByRole('button', { name: 'Previous month' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Next month' })).toBeDisabled();
  });

  // From Monday 14 September 2026, the chosen day. Each row: the keys, then the day focus lands on.
  const KEYS: [keys: string, focused: string][] = [
    ['{ArrowRight}', 'Tuesday, September 15, 2026'],
    ['{ArrowLeft}', 'Sunday, September 13, 2026'],
    ['{ArrowDown}', 'Monday, September 21, 2026'],
    ['{ArrowUp}', 'Monday, September 7, 2026'],
    ['{Home}', 'Tuesday, September 1, 2026'],
    ['{End}', 'Wednesday, September 30, 2026'],
    ['{PageUp}', 'Friday, August 14, 2026'],
    ['{PageDown}', 'Wednesday, October 14, 2026'],
    ['{Shift>}{PageUp}{/Shift}', 'Sunday, September 14, 2025'],
    ['{Shift>}{PageDown}{/Shift}', 'Tuesday, September 14, 2027'],
  ];

  it.each(KEYS)('moves by the keys of the table: %s', async (keys, focused) => {
    const user = userEvent.setup();
    const { container } = render(<Calendar aria-label="Date" defaultValue="2026-09-14" />);
    focusChosen(container);
    await user.keyboard(keys);
    expect(document.activeElement).toHaveClass('calendar-day');
    // The name is the full date, after "Today, " on the device's today.
    expect(document.activeElement).toHaveAccessibleName(new RegExp(`(^|, )${focused}`));
  });

  it.each(['{Enter}', ' '])('moves by the keys of the table: %s chooses the focused day', async (key) => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const { container } = render(
      <Calendar aria-label="Date" defaultValue="2026-09-14" onChange={onChange} />,
    );
    focusChosen(container);
    await user.keyboard(`{ArrowRight}${key}`);
    expect(onChange).toHaveBeenLastCalledWith('2026-09-15');
  });

  it('lets Escape through to its parent', async () => {
    const user = userEvent.setup();
    const onKeyDown = vi.fn<(key: string) => void>();
    const { container } = render(
      // eslint-disable-next-line jsx-a11y/no-static-element-interactions -- a test's listener for the key the calendar lets through
      <div
        onKeyDown={(event) => {
          onKeyDown(event.key);
        }}
      >
        <Calendar aria-label="Date" defaultValue="2026-09-14" />
      </div>,
    );
    focusChosen(container);
    await user.keyboard('{Escape}');
    expect(onKeyDown).toHaveBeenCalledWith('Escape');
  });

  it('renders the face before hydration and the calendar after', () => {
    const ref = createRef<HTMLDivElement>();
    const element = <Calendar aria-label="Date" value="2026-09-14" className="mine" ref={ref} />;
    const html = renderToString(element);
    expect(html).toContain('data-face');
    expect(html).toContain('class="calendar mine"');
    expect(html).not.toContain('role="grid"');
    expect(html).not.toContain('September');
    const container = document.createElement('div');
    container.innerHTML = html;
    document.body.append(container);
    const recoverable = vi.fn();
    let hydrated: Root | undefined;
    act(() => {
      hydrated = hydrateRoot(container, element, { onRecoverableError: recoverable });
    });
    expect(recoverable).not.toHaveBeenCalled();
    expect(container.querySelector('[data-face]')).toBeNull();
    expect(container.querySelector('[role="grid"]')).not.toBeNull();
    expect(ref.current).toBe(container.querySelector('.calendar'));
    act(() => {
      hydrated?.unmount();
    });
    container.remove();
  });

  it('passes className, ref and data attributes', () => {
    const ref = createRef<HTMLDivElement>();
    const { container } = render(
      <Calendar aria-label="Date" className="mine" ref={ref} data-testid="date" defaultValue="2026-09-14" />,
    );
    expect(root(container)).toHaveClass('calendar', 'mine');
    expect(root(container)).toHaveAttribute('data-testid', 'date');
    expect(ref.current).toBe(root(container));
  });

  // Each row: the calendar, and what to do to it before axe runs.
  const AXE_CASES: [name: string, calendar: () => ReactElement, then?: (container: HTMLElement) => void][] = [
    ['a value', () => <Calendar aria-label="Date" defaultValue="2026-09-14" />],
    ['today', () => <Calendar aria-label="Date" today="2026-09-18" />],
    [
      'unavailable days',
      () => (
        <Calendar
          aria-label="Date"
          defaultValue="2026-09-14"
          minValue="2026-09-03"
          isDateUnavailable={(date) => date.endsWith('-20')}
        />
      ),
    ],
    ['disabled', () => <Calendar aria-label="Date" defaultValue="2026-09-14" isDisabled />],
    ['a focused day', () => <Calendar aria-label="Date" defaultValue="2026-09-14" />, focusChosen],
  ];

  it.each(AXE_CASES)('has no axe violations %s', async (_name, calendar, then) => {
    const { container } = render(calendar());
    then?.(container);
    await expectNoA11yViolations(container);
  });

  it('refuses in its types a calendar with no name and a value that is not an ISO string', () => {
    // Each @ts-expect-error line below fails `pnpm typecheck` if the type stops refusing it.
    // @ts-expect-error a calendar shows no label of its own, so it needs an aria-label or aria-labelledby
    const nameless = <Calendar defaultValue="2026-09-14" />;
    // @ts-expect-error the value is an ISO string, which a server component can pass and a URL can hold
    const instance = <Calendar aria-label="Date" value={new CalendarDate(2026, 9, 14)} />;
    const labelled = <Calendar aria-labelledby="date-label" value={null} />;
    expect([nameless, instance, labelled]).toHaveLength(3);
  });
});
