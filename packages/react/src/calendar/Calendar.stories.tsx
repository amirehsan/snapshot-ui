import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ComponentType } from 'react';
import { renderToString } from 'react-dom/server';
import { I18nProvider } from 'react-aria-components';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { Sheet } from '../sheet';
import { tokenColor, tokenPixels, washColor } from '../stories/paint';
import { Calendar } from './Calendar';
import type { DateRangePreset } from './CalendarParts';
import { RangeCalendar } from './RangeCalendar';

/** Every story's today, fixed so the baselines never move. */
const TODAY = '2026-09-18';

/** The app's presets, computed from its own today with its own words. */
const PRESETS: DateRangePreset[] = [
  { id: 'this-month', label: 'This month', range: { start: '2026-09-01', end: '2026-09-30' } },
  { id: 'last-month', label: 'Last month', range: { start: '2026-08-01', end: '2026-08-31' } },
  { id: 'last-7', label: 'Last 7 days', range: { start: '2026-09-12', end: '2026-09-18' } },
];

/**
 * The args the stories take. The props require an aria-label or an aria-labelledby, a union Storybook's args
 * type collapses, so every story renders its own calendars and takes only the change handler as an arg.
 */
interface StoryArgs {
  onChange?: (value: string) => void;
}

const meta = {
  title: 'Components/Calendar',
  component: Calendar as ComponentType<StoryArgs>,
  decorators: [
    (Story) => (
      <div style={{ width: '20rem', maxWidth: 'calc(100vw - 2rem)' }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<StoryArgs>;

export default meta;
type Story = StoryObj<typeof meta>;

function find(scope: ParentNode, selector: string): HTMLElement {
  const element = scope.querySelector<HTMLElement>(selector);
  if (!element) throw new Error(`Nothing matches ${selector}`);
  return element;
}

const rect = (element: Element): DOMRect => element.getBoundingClientRect();

/** The day of the shown month whose number is `number`, the cell's inner button. */
function day(scope: ParentNode, number: number | string): HTMLElement {
  const found = [...scope.querySelectorAll<HTMLElement>('.calendar-day:not([data-outside-month])')].find(
    (each) => each.textContent === String(number),
  );
  if (!found) throw new Error(`No day ${String(number)}`);
  return found;
}

/** The number inside that day, which carries the fill, the ring and the weight. */
const numberOf = (scope: ParentNode, number: number | string): HTMLElement =>
  find(day(scope, number), '.calendar-day-number');

/** The `percent` ink wash read inside `scope`: 5% under the pointer, 10% for the range band. */
function inkWash(percent: number, scope: Element = document.body): string {
  if (percent === 5) return washColor(scope);
  const probe = document.createElement('span');
  probe.style.backgroundColor = `color-mix(in srgb, var(--color-ink) ${String(percent)}%, transparent)`;
  scope.append(probe);
  const { backgroundColor } = getComputedStyle(probe);
  probe.remove();
  return backgroundColor;
}

/** Tabs from the page into the grid, which is one stop: focus lands on the focused day. */
async function tabToGrid(): Promise<HTMLElement> {
  for (let step = 0; step < 8; step += 1) {
    await userEvent.tab();
    if (document.activeElement?.classList.contains('calendar-day'))
      return document.activeElement as HTMLElement;
  }
  throw new Error('Tab never reached the grid');
}

/** One month with a day chosen: the 14th an ink circle, the 18th ringed and bold. */
export const Default: Story = {
  tags: ['density'],
  render: (args) => (
    <Calendar aria-label="Date" today={TODAY} onChange={args.onChange} defaultValue="2026-09-14" />
  ),
  play: async ({ canvas, canvasElement }) => {
    const calendar = find(canvasElement, '.calendar');
    await expect(canvas.getByRole('application', { name: 'Date, September 2026' })).toBe(calendar);
    // Seven controls wide, and each day a control square.
    await expect(rect(calendar).width).toBeCloseTo(7 * tokenPixels('--size-control'), 1);
    await expect(rect(day(canvasElement, 1)).width).toBeCloseTo(tokenPixels('--size-control'), 1);
    await expect(rect(day(canvasElement, 1)).height).toBeCloseTo(rect(day(canvasElement, 1)).width, 1);
    await expect(find(canvasElement, '.calendar-heading')).toHaveTextContent('September 2026');
    await expect(getComputedStyle(find(canvasElement, '.calendar-heading')).fontWeight).toBe('500');
    const today = numberOf(canvasElement, 18);
    await expect(today).toHaveAttribute('data-today');
    await expect(getComputedStyle(today).fontWeight).toBe('700');
    await expect(getComputedStyle(today).borderTopColor).toBe(tokenColor('--color-boundary'));
    const chosen = numberOf(canvasElement, 14);
    await expect(getComputedStyle(chosen).backgroundColor).toBe(tokenColor('--color-ink'));
    await expect(getComputedStyle(chosen).color).toBe(tokenColor('--color-canvas'));
    await expect(getComputedStyle(find(canvasElement, '.calendar-weekday')).color).toBe(
      tokenColor('--color-slate'),
    );
  },
};

/** A range: two ink ends on a faint band that runs under their inner halves, and the days between at 500. */
export const Range: Story = {
  tags: ['density'],
  render: () => (
    <RangeCalendar
      aria-label="Statement period"
      today={TODAY}
      defaultValue={{ start: '2026-09-07', end: '2026-09-18' }}
    />
  ),
  play: async ({ canvasElement }) => {
    const band = inkWash(10, canvasElement);
    for (const end of [7, 18]) {
      await expect(getComputedStyle(numberOf(canvasElement, end)).backgroundColor).toBe(
        tokenColor('--color-ink'),
      );
      // The band's half under the end's inner side.
      await expect(getComputedStyle(day(canvasElement, end), '::before').backgroundColor).toBe(band);
    }
    await expect(getComputedStyle(day(canvasElement, 7), '::before').left).toBe(
      `${String(rect(day(canvasElement, 7)).width / 2)}px`,
    );
    const middle = day(canvasElement, 10);
    await expect(middle.parentElement).toHaveAttribute('aria-selected', 'true');
    await expect(getComputedStyle(middle).backgroundColor).toBe(band);
    await expect(getComputedStyle(numberOf(canvasElement, 10)).fontWeight).toBe('500');
    // Today inside the chosen end keeps its weight and turns its ring canvas.
    const today = numberOf(canvasElement, 18);
    await expect(getComputedStyle(today).fontWeight).toBe('700');
    await expect(getComputedStyle(today).outlineColor).toBe(tokenColor('--color-canvas'));
  },
};

/** The app's presets above the grid, "This month" pressed: the ink fill. */
export const WithPresets: Story = {
  render: () => (
    <RangeCalendar
      aria-label="Statement period"
      today={TODAY}
      defaultValue={{ start: '2026-09-01', end: '2026-09-30' }}
      presets={PRESETS}
    />
  ),
  play: async ({ canvas }) => {
    const pressed = canvas.getByRole('button', { name: 'This month' });
    await expect(pressed).toHaveAttribute('aria-pressed', 'true');
    await expect(getComputedStyle(pressed).backgroundColor).toBe(tokenColor('--color-ink'));
    const resting = canvas.getByRole('button', { name: 'Last month' });
    await expect(getComputedStyle(resting).borderTopColor).toBe(tokenColor('--color-boundary'));
    await expect(rect(resting).height).toBeGreaterThanOrEqual(tokenPixels('--size-control') - 0.5);
    await expect(getComputedStyle(resting).fontWeight).toBe('500');
  },
};

/** Bounds and weekends: the days outside the bounds taupe, the unavailable weekends taupe and struck through. */
export const Unavailable: Story = {
  render: (args) => (
    <Calendar
      aria-label="Date"
      today={TODAY}
      onChange={args.onChange}
      minValue="2026-09-03"
      maxValue="2026-09-26"
      isDateUnavailable={(date) => {
        const weekday = new Date(`${date}T12:00:00Z`).getUTCDay();
        return weekday === 0 || weekday === 6;
      }}
    />
  ),
  play: async ({ canvasElement }) => {
    const taupe = tokenColor('--color-taupe');
    const weekend = numberOf(canvasElement, 12);
    await expect(day(canvasElement, 12)).toHaveAttribute('data-unavailable');
    await expect(getComputedStyle(weekend).color).toBe(taupe);
    await expect(getComputedStyle(weekend).textDecorationLine).toBe('line-through');
    const outside = numberOf(canvasElement, 2);
    await expect(day(canvasElement, 2)).toHaveAttribute('data-disabled');
    await expect(getComputedStyle(outside).color).toBe(taupe);
    await expect(getComputedStyle(outside).textDecorationLine).toBe('none');
    await expect(getComputedStyle(day(canvasElement, 2)).cursor).toBe('not-allowed');
  },
};

/**
 * Half a range: Enter on the 7th anchors it and, as React Aria does from the keyboard, moves to the 8th; Arrow
 * Right twice then draws the 7th to the 10th as the range to be.
 */
export const HalfChosen: Story = {
  render: () => <RangeCalendar aria-label="Statement period" today={TODAY} />,
  play: async ({ canvasElement }) => {
    await tabToGrid();
    // From today, the 18th: up a week to the 11th, then back four days to the 7th.
    await userEvent.keyboard('{ArrowUp}{ArrowLeft}{ArrowLeft}{ArrowLeft}{ArrowLeft}{Enter}');
    await expect(day(canvasElement, 8)).toHaveFocus();
    await userEvent.keyboard('{ArrowRight}{ArrowRight}');
    await expect(day(canvasElement, 7)).toHaveAttribute('data-selection-start');
    await expect(day(canvasElement, 10)).toHaveAttribute('data-selection-end');
    await expect(day(canvasElement, 10)).toHaveFocus();
  },
};

/** The keyboard's ring on the chosen day: the canvas ring inside the ink. */
export const KeyboardFocus: Story = {
  render: (args) => (
    <Calendar aria-label="Date" today={TODAY} onChange={args.onChange} defaultValue="2026-09-14" />
  ),
  play: async ({ canvasElement }) => {
    const focused = await tabToGrid();
    await expect(focused).toBe(day(canvasElement, 14));
    const number = numberOf(canvasElement, 14);
    await expect(getComputedStyle(number).outlineStyle).toBe('solid');
    await expect(getComputedStyle(number).outlineColor).toBe(tokenColor('--color-canvas'));
  },
};

/** Three rooms: a popover at 320px (254px), the sheet at 320px (272px) and 20rem, where a day is 40px. */
export const Narrow: Story = {
  decorators: [
    (Story) => (
      <div style={{ width: 'min(60rem, calc(100vw - 2rem))' }}>
        <Story />
      </div>
    ),
  ],
  render: () => (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24, alignItems: 'start' }}>
      {['254px', '272px', '20rem'].map((width, index) => (
        <div key={width} className="narrow-box" style={{ width }}>
          <RangeCalendar
            aria-label={`Statement period ${String(index + 1)}`}
            today={TODAY}
            defaultValue={{ start: '2026-09-07', end: '2026-09-18' }}
          />
        </div>
      ))}
    </div>
  ),
  play: async ({ canvasElement }) => {
    for (const box of canvasElement.querySelectorAll('.narrow-box')) {
      await expect(rect(find(box, '.calendar')).width).toBeLessThanOrEqual(rect(box).width + 0.5);
    }
  },
};

/**
 * The page as a browser paints it before the scripts run: the server's HTML of a calendar and a range calendar,
 * two empty frames of their final size, outlined here by a story-only dashed border so the shot shows them
 * (plan, spec correction 12).
 */
export const Face: Story = {
  render: () => {
    const html = renderToString(
      <div style={{ display: 'grid', gap: 24 }}>
        <Calendar aria-label="Date" value="2026-09-14" today={TODAY} />
        <RangeCalendar
          aria-label="Statement period"
          value={{ start: '2026-09-01', end: '2026-09-30' }}
          presets={PRESETS}
        />
      </div>,
    );
    return (
      <>
        <style>
          {'.calendar-face-story .calendar[data-face] { outline: 1px dashed var(--color-boundary); }'}
        </style>
        {/* The library's own server HTML of its own story, never input from a reader. */}
        <div className="calendar-face-story" dangerouslySetInnerHTML={{ __html: html }} />
      </>
    );
  },
  play: async ({ canvasElement }) => {
    const faces = [...canvasElement.querySelectorAll<HTMLElement>('.calendar[data-face]')];
    await expect(faces).toHaveLength(2);
    for (const face of faces) {
      await expect(face).toBeEmptyDOMElement();
      await expect(rect(face).width).toBeCloseTo(7 * tokenPixels('--size-control'), 1);
      await expect(rect(face).height).toBeCloseTo((rect(face).width * 8) / 7, 1);
    }
  },
};

/** fa-IR: the Persian calendar, Shahrivar 1405 from the right in Persian digits, the week from Saturday. */
export const Persian: Story = {
  render: () => (
    <I18nProvider locale="fa-IR">
      <div dir="rtl" lang="fa">
        <RangeCalendar
          aria-label="دوره"
          today={TODAY}
          defaultValue={{ start: '2026-09-07', end: '2026-09-18' }}
          labels={{ previous: 'ماه قبل', next: 'ماه بعد' }}
        />
      </div>
    </I18nProvider>
  ),
  play: async ({ canvasElement }) => {
    await expect(find(canvasElement, '.calendar-heading').textContent).toMatch(/۱۴۰۵/);
    await expect(find(canvasElement, '.calendar-weekday')).toHaveTextContent('ش');
    // 7 September 2026 is 16 Shahrivar, the start of the range.
    await expect(day(canvasElement, '۱۶')).toHaveAttribute('data-selection-start');
    await expect(numberOf(canvasElement, '۲۷')).toHaveAttribute('data-today');
  },
};

/** fa-IR-u-ca-gregory: the Gregorian calendar, September 2026, in Persian digits. */
export const PersianGregorian: Story = {
  render: () => (
    <I18nProvider locale="fa-IR-u-ca-gregory">
      <div dir="rtl" lang="fa">
        <RangeCalendar
          aria-label="دوره"
          today={TODAY}
          defaultValue={{ start: '2026-09-07', end: '2026-09-18' }}
          labels={{ previous: 'ماه قبل', next: 'ماه بعد' }}
        />
      </div>
    </I18nProvider>
  ),
  play: async ({ canvasElement }) => {
    await expect(find(canvasElement, '.calendar-heading').textContent).toMatch(/۲۰۲۶/);
    await expect(day(canvasElement, '۷')).toHaveAttribute('data-selection-start');
    await expect(numberOf(canvasElement, '۱۸')).toHaveAttribute('data-today');
  },
};

/** React Aria's keys, as the docs' table states them. */
export const Keys: Story = {
  tags: ['no-visual'],
  args: { onChange: fn() },
  render: (args) => (
    <Calendar aria-label="Date" today={TODAY} onChange={args.onChange} defaultValue="2026-09-14" />
  ),
  play: async ({ args }) => {
    await tabToGrid();
    const moves: [string, RegExp][] = [
      ['{ArrowRight}', /September 15, 2026/],
      ['{ArrowDown}', /September 22, 2026/],
      ['{ArrowLeft}', /September 21, 2026/],
      ['{ArrowUp}', /September 14, 2026/],
      ['{End}', /September 30, 2026/],
      ['{Home}', /September 1, 2026/],
      ['{PageDown}', /October 1, 2026/],
      ['{PageUp}', /September 1, 2026/],
      ['{Shift>}{PageDown}{/Shift}', /September 1, 2027/],
      ['{Shift>}{PageUp}{/Shift}', /September 1, 2026/],
    ];
    for (const [keys, name] of moves) {
      await userEvent.keyboard(keys);
      await expect(document.activeElement).toHaveAccessibleName(name);
    }
    await userEvent.keyboard('{ArrowRight}{Enter}');
    await expect(args.onChange).toHaveBeenLastCalledWith('2026-09-02');
    await userEvent.keyboard('{ArrowRight} ');
    await expect(args.onChange).toHaveBeenLastCalledWith('2026-09-03');
  },
};

/** The range calendars' change handler, a spy each play clears before it starts. */
const rangeChange = fn();

/** A half range drops when focus leaves the calendar and when a press lands on the month heading. */
export const HalfRangeDrops: Story = {
  tags: ['no-visual'],
  render: () => (
    <div style={{ display: 'grid', gap: 16 }}>
      <RangeCalendar aria-label="Statement period" today={TODAY} onChange={rangeChange} />
      <button type="button">Elsewhere</button>
    </div>
  ),
  play: async ({ canvasElement }) => {
    rangeChange.mockClear();
    await userEvent.click(day(canvasElement, 7));
    await expect(day(canvasElement, 7)).toHaveAttribute('data-selection-start');
    await userEvent.tab();
    await expect(canvasElement.querySelector('[data-selection-start]')).toBeNull();
    await userEvent.click(day(canvasElement, 7));
    await expect(day(canvasElement, 7)).toHaveAttribute('data-selection-start');
    await userEvent.click(find(canvasElement, '.calendar-heading'));
    await expect(canvasElement.querySelector('[data-selection-start]')).toBeNull();
    await expect(rangeChange).not.toHaveBeenCalled();
  },
};

/** A preset sets its range in one press and moves the view to its start. */
export const PresetPress: Story = {
  tags: ['no-visual'],
  render: () => (
    <RangeCalendar aria-label="Statement period" today={TODAY} presets={PRESETS} onChange={rangeChange} />
  ),
  play: async ({ canvas, canvasElement }) => {
    rangeChange.mockClear();
    const lastMonth = canvas.getByRole('button', { name: 'Last month' });
    await userEvent.click(lastMonth);
    await expect(rangeChange).toHaveBeenLastCalledWith({ start: '2026-08-01', end: '2026-08-31' });
    await expect(lastMonth).toHaveAttribute('aria-pressed', 'true');
    await expect(find(canvasElement, '.calendar-heading')).toHaveTextContent('August 2026');
  },
};

/**
 * Days shrink only with the room: 36.29px in a 254px popover at 320px, 38.86px in the 272px sheet at 320px, 40px
 * at 20rem, and 36px there under compact density (R4).
 */
export const Sizes: Story = {
  tags: ['no-visual'],
  decorators: Narrow.decorators,
  render: Narrow.render,
  play: async ({ canvasElement }) => {
    const boxes = [...canvasElement.querySelectorAll('.narrow-box')];
    const widths = boxes.map((box) => rect(day(box, 1)).width);
    await expect(widths[0]).toBeCloseTo(254 / 7, 1);
    await expect(widths[1]).toBeCloseTo(272 / 7, 1);
    await expect(widths[2]).toBeCloseTo(40, 1);
    const root = document.documentElement;
    const density = root.dataset.density;
    root.dataset.density = 'compact';
    try {
      const box = boxes[2];
      if (!box) throw new Error('No box');
      await expect(rect(day(box, 1)).width).toBeCloseTo(36, 1);
    } finally {
      root.dataset.density = density;
    }
  },
};

/** The ISO date of the device's day `offset` days from now. */
function deviceDay(offset: number): string {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  const pad = (value: number): string => String(value).padStart(2, '0');
  return `${String(date.getFullYear())}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** A today that is not the device's day: the mark follows the prop, never React Aria's device today. */
export const TodayZone: Story = {
  tags: ['no-visual'],
  render: (args) => <Calendar aria-label="Date" onChange={args.onChange} today={deviceDay(3)} />,
  play: async ({ canvasElement }) => {
    const marked = [...canvasElement.querySelectorAll('.calendar-day-number[data-today]')];
    await expect(marked).toHaveLength(1);
    await expect(marked[0]?.textContent).toBe(String(Number(deviceDay(3).slice(8))));
    // React Aria's own mark, on the cell, is the device's day, which the library leaves undrawn.
    const device = canvasElement.querySelector('.calendar-day[data-today]');
    if (device) await expect(find(device, '.calendar-day-number')).not.toHaveAttribute('data-today');
  },
};

/** A range calendar in an open sheet at a 320px phone's width: it fits, with no sideways scroll. */
export const InSheet: Story = {
  tags: ['no-visual'],
  render: () => (
    <Sheet title="Statement period" defaultOpen>
      <RangeCalendar
        aria-label="Statement period"
        today={TODAY}
        defaultValue={{ start: '2026-09-07', end: '2026-09-18' }}
        presets={PRESETS}
      />
    </Sheet>
  ),
  play: async () => {
    const sheet = await waitFor(
      async () => {
        const found = document.querySelector<HTMLElement>('.sheet');
        if (!found) throw new Error('No sheet yet');
        await expect(found).toHaveAttribute('data-expanded');
        return found;
      },
      { timeout: 5000 },
    );
    // The play narrows the sheet itself to a 320px phone, and puts it back after.
    sheet.style.width = '320px';
    try {
      const calendar = find(sheet, '.calendar');
      const body = calendar.parentElement;
      if (!body) throw new Error('No body');
      await expect(rect(calendar).right).toBeLessThanOrEqual(rect(sheet).right);
      await expect(rect(calendar).left).toBeGreaterThanOrEqual(rect(sheet).left);
      await expect(body.scrollWidth).toBeLessThanOrEqual(body.clientWidth);
      await expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(
        document.documentElement.clientWidth,
      );
      await expect(rect(day(sheet, 1)).width).toBeGreaterThanOrEqual(36);
      await expect(within(sheet).getByRole('group', { name: 'Presets' })).toBeInTheDocument();
    } finally {
      sheet.style.width = '';
    }
  },
};
