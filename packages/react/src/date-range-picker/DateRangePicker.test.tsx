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
import type { DateRange, DateRangePreset } from '../calendar';
import { DateRangePicker } from './DateRangePicker';

afterEach(() => {
  vi.restoreAllMocks();
});

const SEPTEMBER = { start: '2026-09-01', end: '2026-09-30' };

/** The app's presets, computed from its own today, 2026-09-18, with its own words. */
const PRESETS: DateRangePreset[] = [
  { id: 'this-month', label: 'This month', range: SEPTEMBER },
  { id: 'last-month', label: 'Last month', range: { start: '2026-08-01', end: '2026-08-31' } },
];

/** The editable segments of the field, in DOM order: the start's month, day and year, then the end's. */
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

/** The day of the open calendar's month whose number is `number`. */
function day(number: number): HTMLElement {
  const found = [...dialog().querySelectorAll<HTMLElement>('.calendar-day:not([data-outside-month])')].find(
    (each) => each.textContent === String(number),
  );
  if (!found) throw new Error(`No day ${String(number)}`);
  return found;
}

/** The numbers of the days the open calendar marks selected. */
const chosenDays = (): string[] =>
  [...dialog().querySelectorAll('[aria-selected="true"] > .calendar-day')].map((each) => each.textContent);

const button = (name = /^Choose dates/): HTMLElement => screen.getByRole('button', { name });

/** Focuses `element` as a tab would. */
const focus = (element: HTMLElement): void => {
  act(() => {
    element.focus();
  });
};

describe('DateRangePicker', () => {
  it('is a group named by its label, with segments named by their type, Start date or End date, and the label', () => {
    const { container } = render(
      <DateRangePicker label="Statement period" defaultValue={SEPTEMBER} today="2026-09-18" />,
    );
    expect(root(container)).toHaveClass('field', 'date-range-picker');
    const group = screen.getByRole('group', { name: 'Statement period' });
    expect(group).toHaveClass('input', 'date-range-control');
    // Six spin buttons: month, day and year of each date.
    const spins = screen.getAllByRole('spinbutton');
    expect(spins).toHaveLength(6);
    expect(spins[0]).toHaveAccessibleName(/^month, Start date, Statement period$/);
    expect(spins[3]).toHaveAccessibleName(/^month, End date, Statement period$/);
    // Each date field is a presentation element.
    for (const input of container.querySelectorAll('.date-range-input'))
      expect(input).toHaveAttribute('role', 'presentation');
    // The calendar button is named by its label and the field's, React Aria's labelling of itself and the label.
    expect(screen.getByRole('button', { name: 'Choose dates Statement period' })).toHaveClass(
      'input-button',
      'date-range-button',
    );
    // In the frame, in DOM order: the start date, the arrow, the end date, the button. Each date's hidden input
    // follows it and carries no class.
    expect(visibleParts(group)).toEqual([
      'date-range-input',
      'date-range-arrow',
      'date-range-input',
      'input-button date-range-button',
    ]);
    expect(group.querySelector('.date-range-arrow')).toHaveAttribute('aria-hidden', 'true');
  });

  it('names the segments and the button from labels, so a Persian page names them in Persian', () => {
    render(
      <I18nProvider locale="fa-IR">
        <DateRangePicker
          label="دوره"
          defaultValue={SEPTEMBER}
          labels={{ open: 'انتخاب تاریخ', start: 'تاریخ شروع', end: 'تاریخ پایان' }}
        />
      </I18nProvider>,
    );
    const spins = screen.getAllByRole('spinbutton');
    expect(spins[0]).toHaveAccessibleName(/, تاریخ شروع, دوره$/);
    expect(spins[5]).toHaveAccessibleName(/, تاریخ پایان, دوره$/);
    expect(screen.getByRole('button', { name: 'انتخاب تاریخ دوره' })).toBeInTheDocument();
  });

  it('takes a value of ISO dates and calls onChange with ISO dates, and defaultValue alone', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const { rerender, container } = render(
      <DateRangePicker label="Statement period" value={SEPTEMBER} onChange={onChange} />,
    );
    expect(texts(container)).toEqual(['9', '1', '2026', '9', '30', '2026']);
    focus(segment(4, container));
    await user.keyboard('{ArrowDown}');
    expect(onChange).toHaveBeenLastCalledWith({ start: '2026-09-01', end: '2026-09-29' });
    // Controlled: the field shows the app's value until the app passes another.
    expect(texts(container)).toEqual(['9', '1', '2026', '9', '30', '2026']);
    rerender(
      <DateRangePicker
        label="Statement period"
        value={{ start: '2026-08-01', end: '2026-08-31' }}
        onChange={onChange}
      />,
    );
    expect(texts(container)).toEqual(['8', '1', '2026', '8', '31', '2026']);

    const alone = vi.fn();
    rerender(<DateRangePicker label="Other period" defaultValue={SEPTEMBER} onChange={alone} key="b" />);
    focus(segment(1, container));
    await user.keyboard('{ArrowUp}');
    expect(alone).toHaveBeenLastCalledWith({ start: '2026-09-02', end: '2026-09-30' });
    expect(texts(container)).toEqual(['9', '2', '2026', '9', '30', '2026']);
  });

  it('commits a typed range when both ends are complete and valid', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const { container } = render(<DateRangePicker label="Statement period" onChange={onChange} />);
    focus(segment(0, container));
    await user.keyboard('09012026');
    expect(onChange).not.toHaveBeenCalled();
    // The next segment takes focus when one is full, so typing runs on into the end date.
    expect(segment(3, container)).toHaveFocus();
    await user.keyboard('0930');
    expect(onChange).not.toHaveBeenCalled();
    await user.keyboard('2026');
    expect(onChange).toHaveBeenLastCalledWith(SEPTEMBER);
    // React Aria takes each digit of a year as it is typed, so 2, 20 and 202 came first: years before the start,
    // which are no range, and the app was told null for each.
    expect(onChange.mock.calls.slice(0, -1)).toEqual([[null], [null], [null]]);
  });

  it('keeps the range while one segment is cleared, and calls onChange(null) once a whole date is', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const { container } = render(
      <form>
        <DateRangePicker
          label="Statement period"
          defaultValue={SEPTEMBER}
          onChange={onChange}
          startName="from"
          endName="to"
        />
      </form>,
    );
    const sent = (): FormDataEntryValue | null => {
      const form = container.querySelector('form');
      return form ? new FormData(form).get('from') : null;
    };
    focus(segment(1, container));
    await user.keyboard('{Backspace}');
    // React Aria holds the value while a date is part cleared, as it holds February 30 until blur.
    expect(segment(1, container)).toHaveAttribute('data-placeholder');
    expect(onChange).not.toHaveBeenCalled();
    expect(sent()).toBe('2026-09-01');
    // Backspace in the empty day moves to the month, and clears it.
    await user.keyboard('{Backspace}{Backspace}');
    expect(segment(0, container)).toHaveAttribute('data-placeholder');
    expect(onChange).not.toHaveBeenCalled();
    focus(segment(2, container));
    await user.keyboard('{Backspace}{Backspace}{Backspace}{Backspace}');
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith(null);
    expect(sent()).toBe('');
    // The end date stays.
    expect(texts(container).slice(3)).toEqual(['9', '30', '2026']);
  });

  it('tells the app null for a range typed with its end first, and keeps it in a controlled field', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    function Controlled(): ReactElement {
      const [range, setRange] = useState<DateRange | null>(SEPTEMBER);
      return (
        <DateRangePicker
          label="Statement period"
          value={range}
          onChange={(next) => {
            onChange(next);
            setRange(next);
          }}
        />
      );
    }
    const { container } = render(<Controlled />);
    // December 1 to September 30: the start's month typed past the end's.
    focus(segment(0, container));
    await user.keyboard('12');
    expect(onChange).toHaveBeenLastCalledWith(null);
    // The app's null would clear the field; it keeps what is being typed.
    expect(texts(container)).toEqual(['12', '1', '2026', '9', '30', '2026']);
    focus(segment(3, container));
    await user.keyboard('12');
    expect(onChange).toHaveBeenLastCalledWith({ start: '2026-12-01', end: '2026-12-30' });
    expect(texts(container)).toEqual(['12', '1', '2026', '12', '30', '2026']);
  });

  it('reads an invalid or reversed value as none, warns once, and never throws', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const reversed = { start: '2026-09-30', end: '2026-09-01' };
    const { container, rerender } = render(<DateRangePicker label="Statement period" value={reversed} />);
    expect(segments(container).every((each) => each.hasAttribute('data-placeholder'))).toBe(true);
    rerender(<DateRangePicker label="Statement period" value={reversed} />);
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0]?.[0]).toMatch(/DateRangePicker.*2026-09-30/);

    const bad = render(
      <DateRangePicker
        label="Other"
        defaultValue={{ start: '2026-02-30', end: 'soon' }}
        minValue="yesterday"
      />,
    );
    expect(segments(bad.container).every((each) => each.hasAttribute('data-placeholder'))).toBe(true);
    expect(warn).toHaveBeenCalledTimes(2);
  });

  it('opens on the button, on Alt+Arrow Down and on Alt+Arrow Up', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <DateRangePicker label="Statement period" defaultValue={SEPTEMBER} today="2026-09-18" />,
    );
    await user.click(button());
    expect(dialog()).toBeInTheDocument();
    expect(root(container)).toHaveAttribute('data-open');
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).toBeNull();
    for (const keys of ['{Alt>}{ArrowDown}{/Alt}', '{Alt>}{ArrowUp}{/Alt}']) {
      focus(segment(0, container));
      await user.keyboard(keys);
      expect(dialog(), keys).toBeInTheDocument();
      await user.keyboard('{Escape}');
      expect(screen.queryByRole('dialog'), keys).toBeNull();
    }
  });

  it('opens on the value start month, else on today month with today given', async () => {
    const user = userEvent.setup();
    const heading = (): string => dialog().querySelector('.calendar-heading')?.textContent ?? '';
    const { unmount } = render(
      <DateRangePicker
        label="Statement period"
        defaultValue={{ start: '2026-06-03', end: '2026-07-10' }}
        today="2026-09-18"
      />,
    );
    await user.click(button());
    expect(heading()).toBe('June 2026');
    unmount();
    render(<DateRangePicker label="Statement period" today="2027-02-03" />);
    await user.click(button());
    expect(heading()).toBe('February 2027');
    const marked = [...dialog().querySelectorAll('.calendar-day-number[data-today]')];
    expect(marked.map((each) => each.textContent)).toEqual(['3']);
  });

  it('closes when a range is completed and gives focus back to the button', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<DateRangePicker label="Statement period" today="2026-09-18" onChange={onChange} />);
    await user.click(button());
    await user.click(day(7));
    expect(dialog()).toBeInTheDocument();
    await user.click(day(18));
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith({ start: '2026-09-07', end: '2026-09-18' });
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(button()).toHaveFocus();
    expect(texts()).toEqual(['9', '7', '2026', '9', '18', '2026']);
  });

  it('closes on a preset press with the preset range', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <DateRangePicker label="Statement period" today="2026-09-18" presets={PRESETS} onChange={onChange} />,
    );
    await user.click(button());
    const presets = within(dialog()).getByRole('group', { name: 'Presets' });
    await user.click(within(presets).getByRole('button', { name: 'Last month' }));
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith({ start: '2026-08-01', end: '2026-08-31' });
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(button()).toHaveFocus();
    expect(texts()).toEqual(['8', '1', '2026', '8', '31', '2026']);
  });

  it('checks the presets against its own bounds and unavailable days', async () => {
    const user = userEvent.setup();
    render(
      <DateRangePicker
        label="Statement period"
        today="2026-09-18"
        presets={PRESETS}
        minValue="2026-09-01"
        isDateUnavailable={(date) => date === '2026-09-12'}
      />,
    );
    await user.click(button());
    expect(within(dialog()).getByRole('button', { name: 'Last month' })).toBeDisabled();
    expect(within(dialog()).getByRole('button', { name: 'This month' })).toBeDisabled();
  });

  it('gives focus back to the segment where Alt+Arrow Down was pressed on Escape', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <DateRangePicker label="Statement period" defaultValue={SEPTEMBER} today="2026-09-18" />,
    );
    focus(segment(4, container));
    await user.keyboard('{Alt>}{ArrowDown}{/Alt}');
    expect(dialog()).toBeInTheDocument();
    // The calendar takes focus on the start of the range.
    expect(document.activeElement).toHaveClass('calendar-day');
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(segment(4, container)).toHaveFocus();
  });

  it('takes the calendar value from the picker and passes none of its own', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <DateRangePicker
        label="Statement period"
        value={{ start: '2026-09-07', end: '2026-09-10' }}
        onChange={onChange}
      />,
    );
    await user.click(button());
    expect(chosenDays()).toEqual(['7', '8', '9', '10']);
    await user.click(day(14));
    await user.click(day(15));
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith({ start: '2026-09-14', end: '2026-09-15' });
  });

  it('moves through segments with the arrows, and steps a segment with Page Up and Page Down, Home and End', async () => {
    const user = userEvent.setup();
    const { container } = render(<DateRangePicker label="Statement period" defaultValue={SEPTEMBER} />);
    focus(segment(0, container));
    await user.keyboard('{ArrowRight}');
    expect(segment(1, container)).toHaveFocus();
    await user.keyboard('{ArrowRight}{ArrowRight}');
    // From the start's year to the end's month, across the arrow.
    expect(segment(3, container)).toHaveFocus();
    await user.keyboard('{ArrowLeft}');
    expect(segment(2, container)).toHaveFocus();
    const step = async (index: number, keys: string): Promise<string> => {
      focus(segment(index, container));
      await user.keyboard(keys);
      return segment(index, container).textContent;
    };
    expect(await step(1, '{ArrowUp}')).toBe('2');
    expect(await step(1, '{ArrowDown}')).toBe('1');
    // The larger step is 7 days, 2 months or 5 years, a year's landing on a multiple of five
    // (useDateFieldState.mjs, PAGE_STEP; IncompleteDate.mjs, its round for the year).
    expect(await step(1, '{PageUp}')).toBe('8');
    expect(await step(1, '{PageDown}')).toBe('1');
    expect(await step(0, '{PageUp}')).toBe('11');
    expect(await step(2, '{PageDown}')).toBe('2025');
    expect(await step(2, '{PageUp}')).toBe('2030');
    // Home and End set the least and greatest value: 1 and 12 for a month.
    expect(await step(0, '{Home}')).toBe('1');
    expect(await step(0, '{End}')).toBe('12');
  });

  it('moves to the previous segment on Backspace in an empty one', async () => {
    const user = userEvent.setup();
    const { container } = render(<DateRangePicker label="Statement period" />);
    focus(segment(1, container));
    await user.keyboard('{Backspace}');
    expect(segment(0, container)).toHaveFocus();
  });

  it('submits ISO dates under startName and endName, Gregorian under fa-IR', () => {
    const { container } = render(
      <I18nProvider locale="fa-IR">
        <form>
          <DateRangePicker label="دوره" defaultValue={SEPTEMBER} startName="from" endName="to" />
        </form>
      </I18nProvider>,
    );
    const form = container.querySelector('form');
    if (!form) throw new Error('No form');
    const data = new FormData(form);
    expect(data.get('from')).toBe('2026-09-01');
    expect(data.get('to')).toBe('2026-09-30');
    // The segments show the Persian calendar in its own order: 1 September 2026 is 1405/6/10.
    expect(texts(container).slice(0, 3)).toEqual(['۱۴۰۵', '۶', '۱۰']);
  });

  it('positions the popover against the frame, which is not React Aria Group', async () => {
    const user = userEvent.setup();
    const { container } = render(<DateRangePicker label="Statement period" defaultValue={SEPTEMBER} />);
    const frame = container.querySelector('.date-range-control');
    expect(frame).toHaveAttribute('role', 'group');
    // React Aria's Group writes data-rac; the frame is the library's own div.
    expect(frame).not.toHaveAttribute('data-rac');
    await user.tab();
    expect(segment(0, container)).toHaveFocus();
    await user.tab({ shift: false });
    for (let step = 0; step < 5; step += 1) await user.tab();
    expect(button()).toHaveFocus();
    expect(frame).not.toHaveAttribute('data-focus-visible');
    expect(frame).not.toHaveAttribute('data-focus-within');
    await user.keyboard('{Enter}');
    expect(dialog()).toBeInTheDocument();
    // The popover's trigger is the frame, the picker's group: React Aria writes its width as the trigger's.
    const popover = document.querySelector('.date-range-popover');
    expect(popover).toHaveClass('overlay', 'popover', 'popover-padded');
    expect(popover).toHaveAttribute('data-trigger', 'DateRangePicker');
  });

  it('shows valueLabel and no segments before hydration, then segments', () => {
    const element = (
      <DateRangePicker
        label="Statement period"
        value={SEPTEMBER}
        valueLabel="1 to 30 Sep 2026"
        startName="from"
        endName="to"
      />
    );
    const container = document.createElement('div');
    container.innerHTML = renderToString(element);
    document.body.append(container);
    try {
      expect(container.querySelector('.date-range-face')).toHaveTextContent('1 to 30 Sep 2026');
      expect(container.querySelectorAll('.date-segment')).toHaveLength(0);
      expect(container.querySelector('.date-range-arrow')).toBeNull();
      expect(container.querySelector('input[name="from"]')).toHaveValue('2026-09-01');
      expect(container.querySelector('input[name="to"]')).toHaveValue('2026-09-30');
      let hydrated: Root | undefined;
      act(() => {
        hydrated = hydrateRoot(container, element);
      });
      expect(container.querySelector('.date-range-face')).toBeNull();
      expect(texts(container)).toEqual(['9', '1', '2026', '9', '30', '2026']);
      expect(container.querySelector('.date-range-arrow')).not.toBeNull();
      act(() => {
        hydrated?.unmount();
      });
    } finally {
      container.remove();
    }
    // Without valueLabel the face is empty, and the frame is still drawn.
    const bare = renderToString(<DateRangePicker label="Statement period" value={SEPTEMBER} />);
    expect(bare).toContain('class="input date-range-control"');
    expect(bare).toContain('<span class="date-range-face"></span>');
  });

  it('shows the Changed chip and reads it with the group while changed and valid', () => {
    const { rerender } = render(<DateRangePicker label="Statement period" isChanged changedLabel="Edited" />);
    const group = screen.getByRole('group', { name: 'Statement period' });
    expect(group).toHaveAccessibleDescription('Edited');
    expect(group.closest('.date-range-picker')).toHaveAttribute('data-changed');
    rerender(
      <DateRangePicker label="Statement period" isChanged isInvalid errorMessage="End after the start" />,
    );
    expect(screen.getByRole('group', { name: 'Statement period' })).toHaveAccessibleDescription(
      'End after the start',
    );
    expect(screen.queryByText('Changed')).toBeNull();
  });

  it('passes className, popoverClassName, ref and data attributes', async () => {
    const user = userEvent.setup();
    const ref = createRef<HTMLDivElement>();
    const { container, rerender } = render(
      <DateRangePicker
        ref={ref}
        aria-label="Statement period"
        className="mine"
        popoverClassName="my-popover"
        isDisabled
      />,
    );
    const field = root(container);
    expect(ref.current).toBe(field);
    expect(field).toHaveClass('field', 'date-range-picker', 'mine');
    expect(field).toHaveAttribute('data-unlabelled', '');
    expect(field).toHaveAttribute('data-disabled');
    expect(container.querySelector('.date-range-control')).toHaveAttribute('data-disabled', '');
    expect(button(/^Choose dates/)).toBeDisabled();
    rerender(
      <DateRangePicker
        ref={ref}
        label="Statement period"
        className={({ isOpen }) => (isOpen ? 'is-open' : 'is-shut')}
        popoverClassName="my-popover"
      />,
    );
    expect(field).not.toHaveAttribute('data-unlabelled');
    expect(field).toHaveClass('is-shut');
    await user.click(button());
    expect(field).toHaveClass('field', 'date-range-picker', 'is-open');
    expect(document.querySelector('.popover')).toHaveClass('date-range-popover', 'my-popover');
  });

  // Each row: the picker, and what to do to it before axe runs.
  const AXE_CASES: [name: string, picker: () => ReactElement, then?: () => Promise<void>][] = [
    ['empty', () => <DateRangePicker label="Statement period" description="Up to a year." />],
    ['with a value', () => <DateRangePicker label="Statement period" defaultValue={SEPTEMBER} />],
    [
      'open',
      () => <DateRangePicker label="Statement period" defaultValue={SEPTEMBER} presets={PRESETS} />,
      async () => {
        await userEvent.setup().click(button());
        expect(dialog()).toBeInTheDocument();
      },
    ],
    ['changed', () => <DateRangePicker label="Statement period" defaultValue={SEPTEMBER} isChanged />],
    [
      'invalid',
      () => (
        <DateRangePicker
          label="Statement period"
          defaultValue={SEPTEMBER}
          isInvalid
          errorMessage="End the period after it starts."
        />
      ),
    ],
    ['disabled', () => <DateRangePicker label="Statement period" defaultValue={SEPTEMBER} isDisabled />],
    ['unlabelled', () => <DateRangePicker aria-label="Statement period" />],
  ];

  it.each(AXE_CASES)('has no axe violations %s', async (_name, picker, then) => {
    render(picker());
    await then?.();
    await expectNoA11yViolations(document.body);
  });

  it('refuses in its types what a range of days does not take', () => {
    // Each @ts-expect-error line below fails `pnpm typecheck` if the type stops refusing it.
    // @ts-expect-error day granularity only
    const granular = <DateRangePicker label="Period" granularity="hour" />;
    const aria = { start: new CalendarDate(2026, 9, 1), end: new CalendarDate(2026, 9, 30) };
    // @ts-expect-error the value is ISO strings, never React Aria's CalendarDate
    const typed = <DateRangePicker label="Period" value={aria} />;
    // @ts-expect-error a field with no label, aria-label or aria-labelledby has no name
    const nameless = <DateRangePicker defaultValue={SEPTEMBER} />;
    const named = <DateRangePicker aria-label="Period" startName="from" endName="to" />;
    expect([granular, typed, nameless, named]).toHaveLength(4);
  });
});
