import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactElement } from 'react';
import { renderToString } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { expectNoA11yViolations } from '../../test/a11y';
import { root } from '../../test/dom';
import type { DateRangePreset } from './CalendarParts';
import { RangeCalendar } from './RangeCalendar';

afterEach(() => {
  vi.restoreAllMocks();
});

/** The ranges an app computes from its own today, 2026-09-18, with its own words. */
const PRESETS: DateRangePreset[] = [
  { id: 'this-month', label: 'This month', range: { start: '2026-09-01', end: '2026-09-30' } },
  { id: 'last-month', label: 'Last month', range: { start: '2026-08-01', end: '2026-08-31' } },
  { id: 'last-7', label: 'Last 7 days', range: { start: '2026-09-12', end: '2026-09-18' } },
];

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

/** The numbers of the days React Aria marks selected, in order. */
const selected = (container: HTMLElement): string[] =>
  [...container.querySelectorAll('[aria-selected="true"] > .calendar-day')].map((each) => each.textContent);

describe('RangeCalendar', () => {
  it('anchors on the first choice and completes on the second, calling onChange once with ISO dates', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const { container } = render(
      <RangeCalendar aria-label="Statement period" today="2026-09-18" onChange={onChange} />,
    );
    expect(root(container)).toHaveClass('calendar', 'range-calendar');
    expect(screen.getByRole('application', { name: 'Statement period, September 2026' })).toBe(
      root(container),
    );
    await user.click(day(container, 7));
    expect(onChange).not.toHaveBeenCalled();
    expect(day(container, 7)).toHaveAttribute('data-selection-start');
    await user.click(day(container, 18));
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith({ start: '2026-09-07', end: '2026-09-18' });
    expect(selected(container)).toHaveLength(12);
    expect(day(container, 7)).toHaveAttribute('data-selection-start');
    expect(day(container, 18)).toHaveAttribute('data-selection-end');
  });

  it('anchors on Enter and moves to the next day, as React Aria does from the keyboard, then completes on Enter', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const { container } = render(
      <RangeCalendar aria-label="Statement period" today="2026-09-18" onChange={onChange} />,
    );
    const seventh = day(container, 7);
    act(() => {
      seventh.focus();
    });
    await user.keyboard('{Enter}');
    expect(seventh).toHaveAttribute('data-selection-start');
    expect(day(container, 8)).toHaveFocus();
    expect(onChange).not.toHaveBeenCalled();
    await user.keyboard('{ArrowRight}{ArrowRight} ');
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith({ start: '2026-09-07', end: '2026-09-10' });
  });

  it('allows a one-day range', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const { container } = render(
      <RangeCalendar aria-label="Statement period" today="2026-09-18" onChange={onChange} />,
    );
    await user.click(day(container, 7));
    await user.click(day(container, 7));
    expect(onChange).toHaveBeenCalledWith({ start: '2026-09-07', end: '2026-09-07' });
    expect(day(container, 7)).toHaveAttribute('data-selection-start');
    expect(day(container, 7)).toHaveAttribute('data-selection-end');
  });

  it('drops a half-chosen range on blur, on a press outside, and on a press on the month heading', async () => {
    const user = userEvent.setup();
    const leave: [string, (container: HTMLElement) => Promise<void>][] = [
      ['blur', () => user.tab()],
      ['a press outside', () => user.click(screen.getByRole('button', { name: 'Elsewhere' }))],
      [
        'a press on the heading',
        async (container) => {
          const heading = container.querySelector<HTMLElement>('.calendar-heading');
          if (!heading) throw new Error('No heading');
          await user.click(heading);
        },
      ],
    ];
    for (const [name, away] of leave) {
      const onChange = vi.fn();
      const { container, unmount } = render(
        <>
          <RangeCalendar aria-label="Statement period" today="2026-09-18" onChange={onChange} />
          <button type="button">Elsewhere</button>
        </>,
      );
      await user.click(day(container, 7));
      expect(day(container, 7), name).toHaveAttribute('data-selection-start');
      await away(container);
      expect(selected(container), name).toEqual([]);
      // The next press anchors again rather than completing the dropped range.
      await user.click(day(container, 18));
      expect(onChange, name).not.toHaveBeenCalled();
      await user.click(day(container, 18));
      expect(onChange, name).toHaveBeenLastCalledWith({ start: '2026-09-18', end: '2026-09-18' });
      unmount();
    }
  });

  it('drops an anchor on Escape and lets the key through', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const onKeyDown = vi.fn<(key: string) => void>();
    const { container } = render(
      // eslint-disable-next-line jsx-a11y/no-static-element-interactions -- a test's listener for the key the calendar lets through
      <div
        onKeyDown={(event) => {
          onKeyDown(event.key);
        }}
      >
        <RangeCalendar aria-label="Statement period" today="2026-09-18" onChange={onChange} />
      </div>,
    );
    await user.click(day(container, 7));
    await user.keyboard('{Escape}');
    expect(onKeyDown).toHaveBeenCalledWith('Escape');
    expect(selected(container)).toEqual([]);
    await user.click(day(container, 18));
    expect(onChange).not.toHaveBeenCalled();
  });

  it('reads a reversed range as none, warns once, and never throws', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const reversed = { start: '2026-09-18', end: '2026-09-07' };
    const { container, rerender } = render(<RangeCalendar aria-label="Statement period" value={reversed} />);
    expect(selected(container)).toEqual([]);
    rerender(<RangeCalendar aria-label="Statement period" value={reversed} />);
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0]?.[0]).toMatch(/2026-09-18/);
  });

  it('sets a preset range and moves the view to its start, and shows the preset pressed while the value equals it', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const { container } = render(
      <RangeCalendar
        aria-label="Statement period"
        today="2026-09-18"
        defaultValue={{ start: '2026-09-01', end: '2026-09-30' }}
        presets={PRESETS}
        onChange={onChange}
      />,
    );
    const thisMonth = screen.getByRole('button', { name: 'This month' });
    const lastMonth = screen.getByRole('button', { name: 'Last month' });
    expect(thisMonth).toHaveAttribute('aria-pressed', 'true');
    expect(thisMonth).toHaveClass('calendar-preset');
    expect(lastMonth).toHaveAttribute('aria-pressed', 'false');
    await user.click(lastMonth);
    expect(onChange).toHaveBeenLastCalledWith({ start: '2026-08-01', end: '2026-08-31' });
    expect(heading(container)).toBe('August 2026');
    expect(lastMonth).toHaveAttribute('aria-pressed', 'true');
    expect(thisMonth).toHaveAttribute('aria-pressed', 'false');
    expect(selected(container)).toHaveLength(31);
    // A preset pressed over a half-chosen range replaces it.
    await user.click(screen.getByRole('button', { name: 'Next month' }));
    await user.click(day(container, 7));
    await user.click(screen.getByRole('button', { name: 'Last 7 days' }));
    expect(onChange).toHaveBeenLastCalledWith({ start: '2026-09-12', end: '2026-09-18' });
    expect(selected(container)).toEqual(['12', '13', '14', '15', '16', '17', '18']);
  });

  it('names the presets group Presets, or labels.presets, and each preset by its label', () => {
    const { container, rerender } = render(
      <RangeCalendar aria-label="Statement period" today="2026-09-18" presets={PRESETS} />,
    );
    const group = screen.getByRole('group', { name: 'Presets' });
    expect(group).toHaveClass('calendar-presets');
    expect([...group.querySelectorAll('button')].map((button) => button.textContent)).toEqual([
      'This month',
      'Last month',
      'Last 7 days',
    ]);
    // The presets sit between the header and the grid.
    expect([...root(container).children].map((child) => child.className).filter(Boolean)).toEqual([
      'calendar-header',
      'calendar-presets',
      'calendar-grid',
    ]);
    rerender(
      <RangeCalendar
        aria-label="Statement period"
        today="2026-09-18"
        presets={PRESETS}
        labels={{ presets: 'Quick ranges' }}
      />,
    );
    expect(screen.getByRole('group', { name: 'Quick ranges' })).toBeInTheDocument();
  });

  it('leaves out a preset with an invalid range, with one warning', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const presets: DateRangePreset[] = [
      ...PRESETS,
      { id: 'broken', label: 'Broken', range: { start: '2026-09-18', end: '2026-09-01' } },
    ];
    const { rerender } = render(
      <RangeCalendar aria-label="Statement period" today="2026-09-18" presets={presets} />,
    );
    expect(screen.queryByRole('button', { name: 'Broken' })).toBeNull();
    expect(screen.getAllByRole('button', { pressed: false })).toHaveLength(3);
    rerender(<RangeCalendar aria-label="Statement period" today="2026-09-18" presets={presets} />);
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0]?.[0]).toMatch(/Broken/);
  });

  it('disables a preset that starts or ends outside the bounds, or spans an unavailable day', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const presets: DateRangePreset[] = [
      { id: 'inside', label: 'Inside', range: { start: '2026-09-07', end: '2026-09-11' } },
      { id: 'early', label: 'Early', range: { start: '2026-08-31', end: '2026-09-04' } },
      { id: 'late', label: 'Late', range: { start: '2026-09-21', end: '2026-10-02' } },
      { id: 'weekend', label: 'Over a weekend', range: { start: '2026-09-10', end: '2026-09-15' } },
      { id: 'saturday', label: 'Ends on Saturday', range: { start: '2026-09-14', end: '2026-09-19' } },
    ];
    render(
      <RangeCalendar
        aria-label="Statement period"
        today="2026-09-18"
        minValue="2026-09-01"
        maxValue="2026-09-30"
        isDateUnavailable={(date) => ['2026-09-12', '2026-09-13', '2026-09-19'].includes(date)}
        presets={presets}
        onChange={onChange}
      />,
    );
    expect(screen.getByRole('button', { name: 'Inside' })).toBeEnabled();
    for (const label of ['Early', 'Late', 'Over a weekend', 'Ends on Saturday']) {
      const preset = screen.getByRole('button', { name: label });
      expect(preset, label).toBeDisabled();
      await user.click(preset);
    }
    expect(onChange).not.toHaveBeenCalled();
    await user.click(screen.getByRole('button', { name: 'Inside' }));
    expect(onChange).toHaveBeenLastCalledWith({ start: '2026-09-07', end: '2026-09-11' });
  });

  it('draws the presets in its face, the app words, out of reach of the pointer, the keys and a reader', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const presets: DateRangePreset[] = [
      ...PRESETS,
      { id: 'broken', label: 'Broken', range: { start: '2026-09-18', end: '2026-09-01' } },
    ];
    const container = document.createElement('div');
    container.innerHTML = renderToString(
      <RangeCalendar aria-label="Statement period" today="2026-09-18" presets={presets} />,
    );
    document.body.append(container);
    try {
      const face = container.querySelector<HTMLElement>('.calendar.range-calendar[data-face]');
      if (!face) throw new Error('No face');
      expect(face).toHaveAttribute('aria-hidden', 'true');
      expect(face).toHaveAttribute('inert');
      expect([...face.children].map((child) => child.className)).toEqual([
        'calendar-header',
        'calendar-presets',
        'calendar-grid',
      ]);
      const drawn = [...face.querySelectorAll<HTMLElement>('.calendar-presets > .calendar-preset')];
      expect(drawn.map((each) => each.textContent)).toEqual(['This month', 'Last month', 'Last 7 days']);
      for (const each of drawn) expect(each).toHaveAttribute('tabindex', '-1');
      expect(face.querySelectorAll('tbody tr')).toHaveLength(6);
      await expectNoA11yViolations(container);
    } finally {
      container.remove();
    }
    // With no presets, no row.
    const bare = renderToString(<RangeCalendar aria-label="Statement period" today="2026-09-18" />);
    expect(bare).not.toContain('calendar-presets');
  });

  it('disables the presets with the calendar', () => {
    const { rerender } = render(
      <RangeCalendar aria-label="Statement period" today="2026-09-18" presets={PRESETS} isDisabled />,
    );
    for (const preset of PRESETS) expect(screen.getByRole('button', { name: preset.label })).toBeDisabled();
    rerender(<RangeCalendar aria-label="Statement period" today="2026-09-18" presets={PRESETS} isReadOnly />);
    for (const preset of PRESETS) expect(screen.getByRole('button', { name: preset.label })).toBeDisabled();
  });

  // Each row: the calendar, and what to do to it before axe runs.
  const AXE_CASES: [
    name: string,
    calendar: () => ReactElement,
    then?: (container: HTMLElement) => Promise<void>,
  ][] = [
    [
      'a range',
      () => (
        <RangeCalendar
          aria-label="Statement period"
          defaultValue={{ start: '2026-09-07', end: '2026-09-18' }}
        />
      ),
    ],
    [
      'a half-chosen range',
      () => <RangeCalendar aria-label="Statement period" today="2026-09-18" />,
      async (container) => {
        const seventh = day(container, 7);
        await userEvent.setup().click(seventh);
        expect(seventh).toHaveAttribute('data-selection-start');
      },
    ],
    [
      'presets with one pressed',
      () => (
        <RangeCalendar
          aria-label="Statement period"
          defaultValue={{ start: '2026-09-01', end: '2026-09-30' }}
          presets={PRESETS}
        />
      ),
    ],
    [
      'disabled',
      () => (
        <RangeCalendar
          aria-label="Statement period"
          defaultValue={{ start: '2026-09-07', end: '2026-09-18' }}
          presets={PRESETS}
          isDisabled
        />
      ),
    ],
  ];

  it.each(AXE_CASES)('has no axe violations %s', async (_name, calendar, then) => {
    const { container } = render(calendar());
    await then?.(container);
    await expectNoA11yViolations(container);
  });
});
