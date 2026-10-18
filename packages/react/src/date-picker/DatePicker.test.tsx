import { CalendarDate } from '@internationalized/date';
import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef, useState, type ReactElement } from 'react';
import { hydrateRoot, type Root } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { I18nProvider } from 'react-aria-components';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { expectNoA11yViolations } from '../../test/a11y';
import { root, visibleParts } from '../../test/dom';
import { DatePicker, type DatePreset } from './DatePicker';

afterEach(() => {
  vi.restoreAllMocks();
});

/** The app's today, 2026-10-16, and its presets computed from it with its own words. */
const TODAY = '2026-10-16';
const PRESETS: DatePreset[] = [
  { id: 'today', label: 'Today', date: '2026-10-16' },
  { id: 'yesterday', label: 'Yesterday', date: '2026-10-15' },
];

/** The editable segments of the field, in DOM order: month, day and year in en-US. */
const segments = (container: ParentNode = document.body): HTMLElement[] => [
  ...container.querySelectorAll<HTMLElement>('.date-segment:not([data-type="literal"])'),
];

/** The segment at `index`, which must exist. */
function segment(index: number, container: ParentNode = document.body): HTMLElement {
  const found = segments(container)[index];
  if (!found) throw new Error(`No segment ${String(index)}`);
  return found;
}

/** The text of each editable segment. */
const texts = (container: ParentNode = document.body): string[] =>
  segments(container).map((each) => each.textContent);

/** The open calendar's dialog. */
const dialog = (): HTMLElement => screen.getByRole('dialog');

/** The open calendar's month and year. */
const heading = (): string => dialog().querySelector('.calendar-heading')?.textContent ?? '';

/** The day of the open calendar's month whose number is `number`. */
function day(number: number): HTMLElement {
  const found = [...dialog().querySelectorAll<HTMLElement>('.calendar-day:not([data-outside-month])')].find(
    (each) => each.textContent === String(number),
  );
  if (!found) throw new Error(`No day ${String(number)}`);
  return found;
}

const button = (name = /^Choose date/): HTMLElement => screen.getByRole('button', { name });

/** Focuses `element` as a tab would. */
const focus = (element: HTMLElement): void => {
  act(() => {
    element.focus();
  });
};

describe('DatePicker', () => {
  it('is a group named by its label, with its segments, its button and its hidden input in the frame', () => {
    const { container } = render(<DatePicker label="Date" defaultValue="2026-10-14" today={TODAY} />);
    expect(root(container)).toHaveClass('field', 'date-picker');
    const group = screen.getByRole('group', { name: 'Date' });
    expect(group).toHaveClass('input', 'date-picker-control');
    // The frame is the library's div, not React Aria's Group, which writes data-rac.
    expect(group).not.toHaveAttribute('data-rac');
    const spins = screen.getAllByRole('spinbutton');
    expect(spins).toHaveLength(3);
    expect(spins[0]).toHaveAccessibleName(/^month, Date$/);
    expect(texts(container)).toEqual(['10', '14', '2026']);
    expect(visibleParts(group)).toEqual(['date-picker-input', 'input-button date-picker-button']);
    expect(screen.getByRole('button', { name: 'Choose date Date' })).toHaveClass(
      'input-button',
      'date-picker-button',
    );
  });

  it('commits a typed complete date as ISO and null when cleared', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const { container } = render(<DatePicker label="Date" onChange={onChange} />);
    focus(segment(0, container));
    await user.keyboard('1016');
    expect(onChange).not.toHaveBeenCalled();
    expect(segment(2, container)).toHaveFocus();
    await user.keyboard('2026');
    // React Aria takes each digit of a year as it is typed; the field holds years 2, 20 and 202 back.
    expect(onChange.mock.calls).toEqual([['2026-10-16']]);
    onChange.mockClear();
    // An emptied segment keeps the date, as React Aria holds it; clearing every segment sends null, once.
    focus(segment(1, container));
    await user.keyboard('{Backspace}{Backspace}');
    expect(segment(1, container)).toHaveAttribute('data-placeholder');
    expect(onChange).toHaveBeenLastCalledWith('2026-10-01');
    focus(segment(2, container));
    await user.keyboard('{Backspace}{Backspace}{Backspace}{Backspace}');
    focus(segment(0, container));
    await user.keyboard('{Backspace}{Backspace}');
    expect(onChange).toHaveBeenLastCalledWith(null);
    expect(onChange.mock.calls.filter(([date]) => date === null)).toHaveLength(1);
  });

  it('holds a year back while it is typed, and sends the day once the year is whole', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const { container } = render(
      <form>
        <DatePicker label="Date" onChange={onChange} name="day" />
      </form>,
    );
    const form = container.querySelector('form');
    if (!form) throw new Error('No form');
    focus(segment(0, container));
    await user.keyboard('1016202');
    // Month, day and three digits of the year: React Aria holds 0202-10-16, which goes nowhere.
    expect(texts(container)).toEqual(['10', '16', '202']);
    expect(onChange).not.toHaveBeenCalled();
    await user.keyboard('6');
    expect(onChange.mock.calls).toEqual([['2026-10-16']]);
    expect(new FormData(form).get('day')).toBe('2026-10-16');
  });

  it('holds a year back while it is erased, and commits null once it is gone', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const { container } = render(
      <form>
        <DatePicker label="Date" defaultValue="2026-10-16" onChange={onChange} name="day" />
      </form>,
    );
    const form = container.querySelector('form');
    if (!form) throw new Error('No form');
    focus(segment(2, container));
    await user.keyboard('{Backspace}{Backspace}{Backspace}');
    expect(texts(container)).toEqual(['10', '16', '2']);
    expect(onChange).not.toHaveBeenCalled();
    await user.keyboard('{Backspace}');
    // No day: the app, the hidden input and the face agree.
    expect(onChange.mock.calls).toEqual([[null]]);
    expect(new FormData(form).get('day')).toBe('');
    expect(segments(container).every((each) => each.hasAttribute('data-placeholder'))).toBe(true);
  });

  it('holds a year back in a controlled field too, and types over a whole year', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    function Controlled(): ReactElement {
      const [day, setDay] = useState<string | null>('2026-10-16');
      return (
        <DatePicker
          label="Date"
          value={day}
          onChange={(next) => {
            onChange(next);
            setDay(next);
          }}
        />
      );
    }
    const { container } = render(<Controlled />);
    focus(segment(2, container));
    await user.keyboard('202');
    expect(texts(container)).toEqual(['10', '16', '202']);
    expect(onChange).not.toHaveBeenCalled();
    await user.keyboard('5');
    expect(onChange.mock.calls).toEqual([['2025-10-16']]);
    expect(texts(container)).toEqual(['10', '16', '2025']);
    onChange.mockClear();
    await user.keyboard('{Backspace}{Backspace}{Backspace}{Backspace}');
    expect(onChange.mock.calls).toEqual([[null]]);
    expect(segments(container).every((each) => each.hasAttribute('data-placeholder'))).toBe(true);
  });

  it('commits null on leaving a year short, and shows a required field invalid', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const { container } = render(
      <>
        <DatePicker label="Date" defaultValue="2026-10-16" onChange={onChange} isRequired />
        <button type="button">After</button>
      </>,
    );
    focus(segment(2, container));
    await user.keyboard('{Backspace}{Backspace}');
    expect(texts(container)).toEqual(['10', '16', '20']);
    expect(onChange).not.toHaveBeenCalled();
    await user.click(screen.getByRole('button', { name: 'After' }));
    expect(onChange.mock.calls).toEqual([[null]]);
    expect(segments(container).every((each) => each.hasAttribute('data-placeholder'))).toBe(true);
    expect(root(container)).toHaveAttribute('data-invalid');
  });

  it('holds a Persian year back as it is typed and erased', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const { container } = render(
      <I18nProvider locale="fa-IR">
        <DatePicker label="تاریخ" defaultValue="2026-10-14" onChange={onChange} />
      </I18nProvider>,
    );
    // The year leads: 1405/7/22. Typed over, 1404 passes through Persian years 1, 14 and 140, before 1000 in the
    // Gregorian calendar too.
    focus(segment(0, container));
    await user.keyboard('140');
    expect(onChange).not.toHaveBeenCalled();
    await user.keyboard('4');
    expect(onChange.mock.calls).toEqual([['2025-10-14']]);
    onChange.mockClear();
    // The whole year moved focus on to the month; back on the year, it is erased digit by digit.
    focus(segment(0, container));
    await user.keyboard('{Backspace}{Backspace}{Backspace}');
    expect(texts(container)).toEqual(['۱', '۷', '۲۲']);
    expect(onChange).not.toHaveBeenCalled();
    await user.keyboard('{Backspace}');
    expect(onChange.mock.calls).toEqual([[null]]);
  });

  it('takes a value as an ISO date and stays controlled', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const { container, rerender } = render(
      <DatePicker label="Date" value="2026-10-14" onChange={onChange} />,
    );
    focus(segment(1, container));
    await user.keyboard('{ArrowUp}');
    expect(onChange).toHaveBeenLastCalledWith('2026-10-15');
    expect(texts(container)).toEqual(['10', '14', '2026']);
    rerender(<DatePicker label="Date" value="2026-09-01" onChange={onChange} />);
    expect(texts(container)).toEqual(['9', '1', '2026']);
    rerender(<DatePicker label="Date" value={null} onChange={onChange} />);
    expect(segments(container).every((each) => each.hasAttribute('data-placeholder'))).toBe(true);
  });

  it("opens the calendar on Alt+Arrow Down and on the button, on the value's month else today's", async () => {
    const user = userEvent.setup();
    const { container, unmount } = render(
      <DatePicker label="Date" defaultValue="2026-06-03" today={TODAY} />,
    );
    await user.click(button());
    expect(heading()).toBe('June 2026');
    expect(root(container)).toHaveAttribute('data-open');
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).toBeNull();
    focus(segment(0, container));
    await user.keyboard('{Alt>}{ArrowDown}{/Alt}');
    expect(heading()).toBe('June 2026');
    await user.keyboard('{Escape}');
    unmount();
    render(<DatePicker label="Date" today={TODAY} />);
    await user.click(button());
    expect(heading()).toBe('October 2026');
    const marked = [...dialog().querySelectorAll('.calendar-day-number[data-today]')];
    expect(marked.map((each) => each.textContent)).toEqual(['16']);
  });

  it('closes on a day and on a preset, with focus on the button', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const { container } = render(
      <DatePicker label="Date" today={TODAY} presets={PRESETS} onChange={onChange} />,
    );
    await user.click(button());
    await user.click(day(7));
    expect(onChange).toHaveBeenLastCalledWith('2026-10-07');
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(button()).toHaveFocus();
    expect(texts(container)).toEqual(['10', '7', '2026']);
    await user.click(button());
    const presets = within(dialog()).getByRole('group', { name: 'Presets' });
    await user.click(within(presets).getByRole('button', { name: 'Yesterday' }));
    expect(onChange).toHaveBeenLastCalledWith('2026-10-15');
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(button()).toHaveFocus();
    expect(texts(container)).toEqual(['10', '15', '2026']);
    await user.click(button());
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(button()).toHaveFocus();
  });

  it('draws presets pressed for the chosen day and disabled out of bounds', async () => {
    const user = userEvent.setup();
    render(
      <DatePicker
        label="Date"
        defaultValue="2026-10-16"
        today={TODAY}
        presets={[...PRESETS, { id: 'closed', label: 'Last Sunday', date: '2026-10-11' }]}
        minValue="2026-10-10"
        maxValue="2026-10-15"
        isDateUnavailable={(date) => date === '2026-10-11'}
      />,
    );
    await user.click(button());
    const today = within(dialog()).getByRole('button', { name: 'Today' });
    expect(today).toHaveAttribute('aria-pressed', 'true');
    // After maxValue, and refused by isDateUnavailable.
    expect(today).toBeDisabled();
    expect(within(dialog()).getByRole('button', { name: 'Last Sunday' })).toBeDisabled();
    const yesterday = within(dialog()).getByRole('button', { name: 'Yesterday' });
    expect(yesterday).toHaveAttribute('aria-pressed', 'false');
    expect(yesterday).toBeEnabled();
  });

  it('moves the view to a preset day in another month', async () => {
    const user = userEvent.setup();
    render(
      <DatePicker
        label="Date"
        defaultValue="2026-06-03"
        today={TODAY}
        presets={PRESETS}
        shouldCloseOnSelect={false}
      />,
    );
    await user.click(button());
    expect(heading()).toBe('June 2026');
    await user.click(within(dialog()).getByRole('button', { name: 'Today' }));
    expect(heading()).toBe('October 2026');
  });

  it('writes the hidden ISO input, Gregorian under fa-IR', () => {
    const { container } = render(
      <I18nProvider locale="fa-IR">
        <form>
          <DatePicker label="تاریخ" defaultValue="2026-10-14" name="day" />
        </form>
      </I18nProvider>,
    );
    const form = container.querySelector('form');
    if (!form) throw new Error('No form');
    expect(new FormData(form).get('day')).toBe('2026-10-14');
    // The segments show the Persian calendar in its own order: 14 October 2026 is 1405/7/22.
    expect(texts(container)).toEqual(['۱۴۰۵', '۷', '۲۲']);
  });

  it('shows valueLabel and no segments on the server, and segments after hydration', () => {
    const element = <DatePicker label="Date" value="2026-10-14" valueLabel="14 Oct 2026" name="day" />;
    const container = document.createElement('div');
    container.innerHTML = renderToString(element);
    document.body.append(container);
    try {
      expect(container.querySelector('.date-picker-face')).toHaveTextContent('14 Oct 2026');
      expect(container.querySelectorAll('.date-segment')).toHaveLength(0);
      expect(container.querySelector('.date-picker-control')).not.toBeNull();
      expect(container.querySelector('.date-picker-button')).not.toBeNull();
      expect(container.querySelector('input[name="day"]')).toHaveValue('2026-10-14');
      let hydrated: Root | undefined;
      act(() => {
        hydrated = hydrateRoot(container, element);
      });
      expect(container.querySelector('.date-picker-face')).toBeNull();
      expect(texts(container)).toEqual(['10', '14', '2026']);
      expect(container.querySelector('input[name="day"]')).toHaveValue('2026-10-14');
      act(() => {
        hydrated?.unmount();
      });
    } finally {
      container.remove();
    }
    const bare = renderToString(<DatePicker label="Date" value="2026-10-14" />);
    expect(bare).toContain('class="input date-picker-control"');
    expect(bare).toContain('<span class="date-picker-face"></span>');
  });

  it('warns once for an invalid value, defaultValue or preset date', async () => {
    const user = userEvent.setup();
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const { container, rerender } = render(<DatePicker label="Date" value="2026-02-30" />);
    expect(segments(container).every((each) => each.hasAttribute('data-placeholder'))).toBe(true);
    rerender(<DatePicker label="Date" value="2026-02-30" />);
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0]?.[0]).toMatch(/DatePicker reads value "2026-02-30" as no date/);
    render(<DatePicker label="Other" defaultValue="soon" />);
    expect(warn).toHaveBeenCalledTimes(2);
    expect(warn.mock.calls[1]?.[0]).toMatch(/defaultValue "soon"/);
    render(
      <DatePicker
        aria-label="Third"
        today={TODAY}
        presets={[...PRESETS, { id: 'broken', label: 'Someday', date: '16/10/2026' }]}
      />,
    );
    await user.click(screen.getByRole('button', { name: /^Choose date Third/ }));
    expect(warn).toHaveBeenCalledTimes(3);
    expect(warn.mock.calls[2]?.[0]).toMatch(/leaves out the preset "Someday"/);
    expect(within(dialog()).queryByRole('button', { name: 'Someday' })).toBeNull();
    expect(within(dialog()).getByRole('button', { name: 'Today' })).toBeInTheDocument();
  });

  it('passes validate an ISO date', async () => {
    const user = userEvent.setup();
    const validate = vi.fn((date: string | null) =>
      date !== null && date > TODAY ? 'Not after today' : true,
    );
    const { container } = render(
      <DatePicker label="Date" defaultValue="2026-10-20" validate={validate} validationBehavior="aria" />,
    );
    expect(validate).toHaveBeenLastCalledWith('2026-10-20');
    expect(screen.getByText('Not after today')).toBeInTheDocument();
    focus(segment(1, container));
    await user.keyboard('{Backspace}');
    expect(validate).toHaveBeenLastCalledWith('2026-10-02');
    expect(screen.queryByText('Not after today')).toBeNull();
    expect(validate.mock.calls.every(([date]) => date === null || typeof date === 'string')).toBe(true);
  });

  it('draws the chip with a label, and the mark and its description without one', () => {
    const { container, rerender } = render(<DatePicker label="Date" isChanged changedLabel="Edited" />);
    const group = screen.getByRole('group', { name: 'Date' });
    expect(group).toHaveAccessibleDescription('Edited');
    expect(container.querySelector('.field-changed')).toHaveTextContent('Edited');
    expect(container.querySelector('.field-changed-mark')).toBeNull();
    expect(root(container)).not.toHaveAttribute('data-unlabelled');
    rerender(<DatePicker aria-label="Date, Corner Mart" isChanged />);
    const field = root(container);
    expect(field).toHaveAttribute('data-changed');
    expect(field).toHaveAttribute('data-unlabelled', '');
    const mark = container.querySelector('.field-changed-mark');
    // Inside the frame, after the button, holding the word.
    expect(mark?.parentElement).toHaveClass('date-picker-control');
    expect(mark?.previousElementSibling).toHaveClass('date-picker-button');
    expect(mark).toHaveTextContent('Changed');
    expect(screen.getByRole('group', { name: 'Date, Corner Mart' })).toHaveAccessibleDescription('Changed');
    expect(container.querySelector('.field-changed')).toBeNull();
    // Invalid takes the mark and its description away.
    rerender(<DatePicker aria-label="Date, Corner Mart" isChanged isInvalid errorMessage="Pick a day" />);
    expect(container.querySelector('.field-changed-mark')).toBeNull();
    expect(screen.getByRole('group', { name: 'Date, Corner Mart' })).toHaveAccessibleDescription(
      'Pick a day',
    );
  });

  it('passes className, popoverClassName, ref and data attributes', async () => {
    const user = userEvent.setup();
    const ref = createRef<HTMLDivElement>();
    const { container, rerender } = render(
      <DatePicker ref={ref} aria-label="Date" className="mine" popoverClassName="my-popover" isDisabled />,
    );
    const field = root(container);
    expect(ref.current).toBe(field);
    expect(field).toHaveClass('field', 'date-picker', 'mine');
    expect(field).toHaveAttribute('data-disabled');
    expect(container.querySelector('.date-picker-control')).toHaveAttribute('data-disabled', '');
    expect(button()).toBeDisabled();
    rerender(
      <DatePicker
        ref={ref}
        label="Date"
        className={({ isOpen }) => (isOpen ? 'is-open' : 'is-shut')}
        popoverClassName="my-popover"
        labels={{ open: 'Pick a day' }}
      />,
    );
    expect(field).toHaveClass('is-shut');
    await user.click(button(/^Pick a day/));
    expect(field).toHaveClass('field', 'date-picker', 'is-open');
    const popover = document.querySelector('.popover');
    expect(popover).toHaveClass('date-picker-popover', 'my-popover', 'popover-padded');
    expect(popover).toHaveAttribute('data-trigger', 'DatePicker');
  });

  // Each row: the picker, and what to do to it before axe runs.
  const AXE_CASES: [name: string, picker: () => ReactElement, then?: () => Promise<void>][] = [
    ['default', () => <DatePicker label="Date" description="The day on the receipt." />],
    ['with a value', () => <DatePicker label="Date" defaultValue="2026-10-14" />],
    [
      'invalid',
      () => <DatePicker label="Date" defaultValue="2026-10-14" isInvalid errorMessage="Pick a weekday." />,
    ],
    ['disabled', () => <DatePicker label="Date" defaultValue="2026-10-14" isDisabled />],
    [
      'open',
      () => <DatePicker label="Date" defaultValue="2026-10-14" today={TODAY} />,
      async () => {
        await userEvent.setup().click(button());
        expect(dialog()).toBeInTheDocument();
      },
    ],
    [
      'open with presets',
      () => <DatePicker label="Date" defaultValue="2026-10-16" today={TODAY} presets={PRESETS} />,
      async () => {
        await userEvent.setup().click(button());
        expect(within(dialog()).getByRole('group', { name: 'Presets' })).toBeInTheDocument();
      },
    ],
    ['unlabelled and changed', () => <DatePicker aria-label="Date" defaultValue="2026-10-14" isChanged />],
  ];

  it.each(AXE_CASES)('has no axe violations %s', async (_name, picker, then) => {
    render(picker());
    await then?.();
    await expectNoA11yViolations(document.body);
  });

  it('refuses in its types what one day does not take', () => {
    // Each @ts-expect-error line below fails `pnpm typecheck` if the type stops refusing it.
    // @ts-expect-error day granularity only
    const granular = <DatePicker label="Date" granularity="hour" />;
    // @ts-expect-error the value is an ISO string, never React Aria's CalendarDate
    const typed = <DatePicker label="Date" value={new CalendarDate(2026, 10, 14)} />;
    // @ts-expect-error a field with no label, aria-label or aria-labelledby has no name
    const nameless = <DatePicker defaultValue="2026-10-14" />;
    const named = <DatePicker aria-label="Date" name="day" />;
    expect([granular, typed, nameless, named]).toHaveLength(4);
  });
});
