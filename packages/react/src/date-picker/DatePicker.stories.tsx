import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ComponentType, ReactElement } from 'react';
import { renderToString } from 'react-dom/server';
import { I18nProvider } from 'react-aria-components';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { DataTable, type DataTableColumn } from '../data-table';
import { NumberField } from '../number-field';
import { PickerOption } from '../picker';
import { Select } from '../select';
import { focusOn } from '../stories/focus';
import { tokenColor, tokenPixels } from '../stories/paint';
import { TextField } from '../text-field';
import { DatePicker, type DatePreset } from './DatePicker';

/** Every story's today, fixed so the baselines never move. */
const TODAY = '2026-10-16';

/** The app's presets, computed from its own today with its own words. */
const PRESETS: DatePreset[] = [
  { id: 'today', label: 'Today', date: '2026-10-16' },
  { id: 'yesterday', label: 'Yesterday', date: '2026-10-15' },
];

/**
 * The args the stories take. The props require a label, an aria-label or an aria-labelledby, a union Storybook's
 * args type collapses, so every story renders its own picker and takes only the change handler as an arg.
 */
interface StoryArgs {
  onChange?: (value: string | null) => void;
}

const meta = {
  title: 'Components/DatePicker',
  component: DatePicker as ComponentType<StoryArgs>,
  // One field in a field's width; a story whose parameters say `wide` lays out its own width.
  decorators: [
    (Story, { parameters }) =>
      parameters.wide === true ? (
        <Story />
      ) : (
        <div style={{ width: 'min(20rem, 100%)' }}>
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

/** The editable segments in a scope, in DOM order. */
const segments = (scope: ParentNode): HTMLElement[] => [
  ...scope.querySelectorAll<HTMLElement>('.date-segment:not([data-type="literal"])'),
];

function segment(scope: ParentNode, index: number): HTMLElement {
  const found = segments(scope)[index];
  if (!found) throw new Error(`No segment ${String(index)}`);
  return found;
}

/** The open calendar's popover, once its entrance has finished. */
async function atRest(): Promise<HTMLElement> {
  const popover = await waitFor(async () => {
    const found = document.querySelector<HTMLElement>('.date-picker-popover');
    if (!found) throw new Error('No popover yet');
    await expect(found).toHaveAttribute('data-placement');
    await expect(found).not.toHaveAttribute('data-entering');
    return found;
  });
  await Promise.all(
    popover.getAnimations({ subtree: true }).map((animation) => animation.finished.catch(() => null)),
  );
  return popover;
}

/** Waits until no calendar popover is on the page. */
async function closed(): Promise<void> {
  await waitFor(() => expect(document.querySelector('.date-picker-popover')).toBeNull());
}

/** A receipt's date: three segments in tabular figures and the calendar button, in the pill. */
export const Default: Story = {
  tags: ['density'],
  render: (args) => (
    <DatePicker
      label="Date"
      description="The day on the receipt."
      today={TODAY}
      name="date"
      onChange={args.onChange}
    />
  ),
  play: async ({ canvas, canvasElement }) => {
    const frame = find(canvasElement, '.date-picker-control');
    await expect(canvas.getByRole('group', { name: 'Date' })).toBe(frame);
    await expect(rect(frame).height).toBeCloseTo(tokenPixels('--size-field'), 1);
    // Empty segments are slate, labelled or not, since axe measures them as text.
    await expect(getComputedStyle(segment(canvasElement, 0)).color).toBe(tokenColor('--color-slate'));
    // The button sits inside the frame's end padding, clear of the year.
    const button = canvas.getByRole('button', { name: 'Choose date Date' });
    await expect(rect(button).left).toBeGreaterThan(rect(segment(canvasElement, 2)).right);
    await expect(rect(button).right).toBeLessThanOrEqual(rect(frame).right);
  },
};

/** A chosen day: ink segments in tabular figures. */
export const WithValue: Story = {
  render: (args) => (
    <DatePicker label="Date" defaultValue="2026-10-14" today={TODAY} onChange={args.onChange} />
  ),
  play: async ({ canvasElement }) => {
    await expect(segments(canvasElement).map((each) => each.textContent)).toEqual(['10', '14', '2026']);
    const first = segment(canvasElement, 0);
    await expect(getComputedStyle(first).color).toBe(tokenColor('--color-ink'));
    await expect(getComputedStyle(first).fontVariantNumeric).toBe('tabular-nums');
  },
};

/** Opened from the button: October 2026 with the 16th marked, 8px under the frame at its start. */
export const Open: Story = {
  render: (args) => <DatePicker label="Date" today={TODAY} onChange={args.onChange} />,
  play: async ({ canvas, canvasElement }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Choose date Date' }));
    const popover = await atRest();
    const frame = find(canvasElement, '.date-picker-control');
    await expect(rect(popover).top - rect(frame).bottom).toBeCloseTo(8, 0);
    await expect(find(popover, '.calendar-heading')).toHaveTextContent('October 2026');
    const marked = [...popover.querySelectorAll('.calendar-day-number[data-today]')];
    await expect(marked.map((each) => each.textContent)).toEqual(['16']);
    // The month's width: seven controls, the padding and the frame.
    await expect(rect(popover).width).toBeCloseTo(
      7 * tokenPixels('--size-control') + 2 * tokenPixels('--spacing-inset') + 2,
      1,
    );
    await waitFor(() => expect(document.activeElement).toHaveClass('calendar-day'));
  },
};

/** The app's days above the month, "Today" pressed for the chosen day. */
export const WithPresets: Story = {
  render: (args) => (
    <DatePicker label="Date" defaultValue={TODAY} today={TODAY} presets={PRESETS} onChange={args.onChange} />
  ),
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Choose date Date' }));
    const popover = await atRest();
    const group = within(popover).getByRole('group', { name: 'Presets' });
    await expect(within(group).getByRole('button', { name: 'Today' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await expect(within(group).getByRole('button', { name: 'Yesterday' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
    // Calendar's shapes, as in Calendar and DateRangePicker: the presets are pills and the days circles.
    const pill = tokenPixels('--radius-pill');
    for (const part of [find(popover, '.calendar-preset'), find(popover, '.calendar-day-number')]) {
      await expect(Number.parseFloat(getComputedStyle(part).borderTopLeftRadius), part.className).toBeCloseTo(
        pill,
        1,
      );
    }
    await waitFor(() => expect(document.activeElement).toHaveClass('calendar-day'));
  },
};

/** The error edge and the error line. */
export const Invalid: Story = {
  render: (args) => (
    <DatePicker
      label="Date"
      defaultValue="2026-10-18"
      today={TODAY}
      isInvalid
      errorMessage="Choose a day on or before today."
      onChange={args.onChange}
    />
  ),
  play: async ({ canvasElement }) => {
    const frame = find(canvasElement, '.date-picker-control');
    await expect(getComputedStyle(frame).borderTopColor).toBe(tokenColor('--color-error'));
    await expect(find(canvasElement, '.field-error')).toHaveTextContent('Choose a day on or before today.');
  },
};

/** Recessed, its segments in taupe, the disabled text. */
export const Disabled: Story = {
  render: (args) => (
    <DatePicker label="Date" defaultValue="2026-10-14" today={TODAY} isDisabled onChange={args.onChange} />
  ),
  play: async ({ canvas, canvasElement }) => {
    const frame = find(canvasElement, '.date-picker-control');
    await expect(getComputedStyle(frame).backgroundColor).toBe(tokenColor('--color-disabled'));
    await expect(getComputedStyle(segment(canvasElement, 0)).color).toBe(tokenColor('--color-taupe'));
    await expect(canvas.getByRole('button', { name: /^Choose date/ })).toBeDisabled();
  },
};

/** A receipt the reader reviews: each row's saved values beside the ones being edited. */
interface ReviewRow {
  id: string;
  merchant: string;
  date: string;
  minor: number;
  memo: string;
  category: string;
  /** Which fields differ from the saved receipt. */
  changed: readonly ('date' | 'amount' | 'memo' | 'category')[];
  /** The field the server refused. */
  invalid?: 'amount';
}

const REVIEW: readonly ReviewRow[] = [
  {
    id: 'r1',
    merchant: 'Corner Mart',
    date: '2026-10-14',
    minor: 4218,
    memo: 'Milk and bread',
    category: 'food',
    changed: ['date', 'memo'],
  },
  {
    id: 'r2',
    merchant: 'City Transit',
    date: '2026-10-13',
    minor: 275,
    memo: 'Bus fare',
    category: 'transport',
    changed: ['amount', 'category'],
  },
  {
    id: 'r3',
    merchant: 'Green Grocer',
    date: '2026-10-12',
    minor: 0,
    memo: 'Apples',
    category: 'food',
    changed: ['amount'],
    invalid: 'amount',
  },
];

const CATEGORIES = [
  ['food', 'Food'],
  ['transport', 'Transport'],
  ['home', 'Home'],
] as const;

/**
 * A review grid: a field per cell, none labelled, each named by its column's header and its row's merchant through
 * aria-labelledby, so a screen reader hears "Date Corner Mart". Each changed field draws the light signal orange
 * edge and the clay dot, and is described by "Changed"; the invalid amount draws its error edge and no dot.
 */
function ReviewGridFixture(): ReactElement {
  const column = (name: string): string => `review-${name}`;
  return (
    <div style={{ overflowX: 'auto' }}>
      <table className="review-grid" style={{ borderCollapse: 'separate', borderSpacing: '8px 12px' }}>
        <thead>
          <tr>
            {['Merchant', 'Date', 'Amount', 'Memo', 'Category'].map((name) => (
              <th
                key={name}
                id={column(name.toLowerCase())}
                scope="col"
                style={{ textAlign: 'start', font: 'inherit', fontWeight: 500 }}
              >
                {name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {REVIEW.map((row) => {
            const named = (name: string): string => `${column(name)} ${row.id}`;
            return (
              <tr key={row.id} data-row={row.id}>
                <th id={row.id} scope="row" style={{ textAlign: 'start', font: 'inherit', fontWeight: 450 }}>
                  {row.merchant}
                </th>
                <td style={{ minWidth: '12rem' }}>
                  <DatePicker
                    aria-labelledby={named('date')}
                    defaultValue={row.date}
                    today={TODAY}
                    isChanged={row.changed.includes('date')}
                  />
                </td>
                <td style={{ minWidth: '9rem' }}>
                  <NumberField
                    aria-labelledby={named('amount')}
                    money={{ symbol: '$' }}
                    defaultValue={row.minor}
                    isChanged={row.changed.includes('amount')}
                    isInvalid={row.invalid === 'amount'}
                    errorMessage={row.invalid === 'amount' ? 'Enter the amount paid.' : undefined}
                  />
                </td>
                <td style={{ minWidth: '12rem' }}>
                  <TextField
                    aria-labelledby={named('memo')}
                    defaultValue={row.memo}
                    isChanged={row.changed.includes('memo')}
                  />
                </td>
                <td style={{ minWidth: '10rem' }}>
                  <Select
                    aria-labelledby={named('category')}
                    defaultValue={row.category}
                    isChanged={row.changed.includes('category')}
                  >
                    {CATEGORIES.map(([id, name]) => (
                      <PickerOption key={id} id={id}>
                        {name}
                      </PickerOption>
                    ))}
                  </Select>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/** Where a field's own text ends: its last segment, its input's content box, or a select's value. */
function textEnd(field: Element): number {
  const segmentsOf = segments(field);
  const last = segmentsOf[segmentsOf.length - 1];
  if (last) return rect(last).right;
  const value = field.querySelector('.select-value');
  if (value) return rect(value).right;
  const input = find(field, 'input:not([type="hidden"]), textarea');
  const style = getComputedStyle(input);
  return (
    rect(input).right - Number.parseFloat(style.paddingRight) - Number.parseFloat(style.borderRightWidth)
  );
}

/**
 * A review grid of unlabelled fields: a DatePicker, a NumberField, a TextField and a Select in each row, two rows
 * changed and one invalid. Each changed field draws the clay dot on its first line, before its button or at its
 * text's end and never under its text, and says "Changed" after its name.
 */
export const ReviewGrid: Story = {
  tags: ['density'],
  parameters: { wide: true },
  render: () => <ReviewGridFixture />,
  play: async ({ canvasElement }) => {
    const changed = [...canvasElement.querySelectorAll<HTMLElement>('.field[data-changed]')];
    await expect(changed).toHaveLength(5);
    const marks = [...canvasElement.querySelectorAll<HTMLElement>('.field-changed-mark')];
    // Four changed and valid fields draw the dot; the invalid amount draws none.
    await expect(marks).toHaveLength(4);
    const invalid = find(canvasElement, '[data-row="r3"] .number-field');
    await expect(invalid.querySelector('.field-changed-mark')).toBeNull();
    await expect(getComputedStyle(find(invalid, '.number-field-input')).borderTopColor).toBe(
      tokenColor('--color-error'),
    );
    // The chip's own dot, 6px.
    const dot = 6;
    for (const mark of marks) {
      const field = mark.closest('.field');
      if (!field) throw new Error('No field');
      const name = field.className;
      await expect(getComputedStyle(mark).backgroundColor, name).toBe(tokenColor('--color-clay'));
      await expect(rect(mark).width, name).toBeCloseTo(dot, 1);
      await expect(rect(mark).height, name).toBeCloseTo(dot, 1);
      // On the frame's first line: centered on a field-tall control, within the pixel an engine rounds a 1.5px
      // edge to.
      const control = find(field, '.input');
      const middle = rect(control).top + tokenPixels('--size-field') / 2;
      await expect(Math.abs(rect(mark).top + rect(mark).height / 2 - middle), name).toBeLessThanOrEqual(1);
      // Never under the field's text, and before the button where there is one.
      await expect(rect(mark).left, name).toBeGreaterThanOrEqual(textEnd(field) - 0.5);
      const button = field.querySelector('.input-button, .select-chevron');
      if (button) await expect(rect(mark).right, name).toBeLessThanOrEqual(rect(button).left + 0.5);
      await expect(rect(mark).right, name).toBeLessThanOrEqual(rect(control).right);
    }
    // Each is named by its column and row, and described by the hidden word.
    const date = within(canvasElement).getByRole('group', { name: 'Date Corner Mart' });
    await expect(date).toHaveAccessibleDescription(/(^| )Changed$/);
    const memo = within(canvasElement).getByRole('textbox', { name: 'Memo Corner Mart' });
    await expect(memo).toHaveAccessibleDescription('Changed');
    await expect(
      within(canvasElement).getByRole('textbox', { name: 'Memo City Transit' }),
    ).not.toHaveAttribute('aria-describedby');
  },
};

/** fa-IR on a right-to-left page: Mehr 1405 in Persian digits after hydration, the button at the left. */
export const RightToLeft: Story = {
  render: (args) => (
    <I18nProvider locale="fa-IR">
      <div dir="rtl" lang="fa">
        <DatePicker
          label="تاریخ"
          defaultValue="2026-10-14"
          today={TODAY}
          labels={{ open: 'انتخاب تاریخ' }}
          onChange={args.onChange}
        />
      </div>
    </I18nProvider>
  ),
  play: async ({ canvasElement }) => {
    // 14 October 2026 is 22 Mehr 1405, in the Persian calendar's own order.
    await expect(segments(canvasElement).map((each) => each.textContent)).toEqual(['۱۴۰۵', '۷', '۲۲']);
  },
};

/** The server's HTML of a picker, as the page paints it before the scripts run, beside the picker itself. */
function FaceBeside({ id, children }: { id: string; children: ReactElement }): ReactElement {
  return (
    <div data-pair={id} style={{ display: 'grid', gap: 16 }}>
      {/* The library's own server HTML of its own story, never input from a reader. */}
      <div data-side="face" dangerouslySetInnerHTML={{ __html: renderToString(children) }} />
      <div data-side="live">{children}</div>
    </div>
  );
}

/** Nothing moves when the segments arrive: the face's field is the hydrated field's box, at either density. */
export const FaceMatches: Story = {
  tags: ['no-visual'],
  render: () => (
    <div style={{ display: 'grid', gap: 32 }}>
      <FaceBeside id="labelled">
        <DatePicker
          label="Date"
          description="The day on the receipt."
          value="2026-10-14"
          valueLabel="14 Oct 2026"
          today={TODAY}
        />
      </FaceBeside>
      <FaceBeside id="changed">
        <DatePicker aria-label="Date" value="2026-10-14" valueLabel="14 Oct 2026" today={TODAY} isChanged />
      </FaceBeside>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const root = document.documentElement;
    const density = root.dataset.density;
    try {
      for (const level of [density, 'compact']) {
        if (level === undefined) delete root.dataset.density;
        else root.dataset.density = level;
        for (const id of ['labelled', 'changed']) {
          const pair = find(canvasElement, `[data-pair="${id}"]`);
          const face = find(pair, '[data-side="face"] .date-picker');
          const live = find(pair, '[data-side="live"] .date-picker');
          await expect(face.querySelector('.date-picker-face')).not.toBeNull();
          await expect(live.querySelector('.date-picker-face')).toBeNull();
          const parts = ['', ' .date-picker-control', ' .date-picker-button'];
          if (id === 'changed') parts.push(' .field-changed-mark');
          for (const part of parts) {
            const [drawn, hydrated] = [face, live].map((field) =>
              part === '' ? field : find(field, part.trim()),
            );
            if (!drawn || !hydrated) throw new Error('No part');
            await expect(rect(drawn).width, `${id}${part}`).toBeCloseTo(rect(hydrated).width, 1);
            await expect(rect(drawn).height, `${id}${part}`).toBeCloseTo(rect(hydrated).height, 1);
            await expect(rect(drawn).left, `${id}${part}`).toBeCloseTo(rect(hydrated).left, 1);
          }
          // The face's text starts where the first segment's does: the same box and the same padding.
          const text = find(face, '.date-picker-face');
          await expect(rect(text).left).toBeCloseTo(rect(segment(live, 0)).left, 1);
        }
      }
    } finally {
      if (density === undefined) delete root.dataset.density;
      else root.dataset.density = density;
    }
  },
};

/** The change handler of the key and press stories, a spy each play clears before it starts. */
const change = fn();

/**
 * React Aria's keys, as the docs' table states them, in three engines. The play focuses the month directly, since
 * the keys are its subject, and asserts values after each key rather than timing.
 */
export const Keys: Story = {
  tags: ['no-visual', 'webkit', 'firefox'],
  render: () => <DatePicker label="Date" defaultValue="2026-10-14" today={TODAY} onChange={change} />,
  play: async ({ canvas, canvasElement }) => {
    change.mockClear();
    const month = segment(canvasElement, 0);
    const day = segment(canvasElement, 1);
    const year = segment(canvasElement, 2);
    /** A key, unless the story has gone: a play that outlived its time limit stops rather than type into the next. */
    const press = async (keys: string): Promise<void> => {
      if (!month.isConnected) throw new Error('The story has gone');
      await userEvent.keyboard(keys);
    };
    await focusOn(month);
    // Up and Down change the focused segment.
    await press('{ArrowUp}');
    await waitFor(() => expect(month).toHaveTextContent('11'));
    await press('{ArrowDown}');
    await waitFor(() => expect(month).toHaveTextContent('10'));
    await waitFor(() => expect(change).toHaveBeenLastCalledWith('2026-10-14'));
    // Right and Left move between segments.
    await press('{ArrowRight}');
    await waitFor(() => expect(day).toHaveFocus());
    await press('{ArrowLeft}');
    await waitFor(() => expect(month).toHaveFocus());
    // Digits type into a segment, and a full one hands focus on.
    await focusOn(day);
    await press('15');
    await waitFor(() => expect(day).toHaveTextContent('15'));
    await waitFor(() => expect(year).toHaveFocus());
    await waitFor(() => expect(change).toHaveBeenLastCalledWith('2026-10-15'));
    // Tab leaves the last segment for the button.
    await press('{Tab}');
    await waitFor(() => expect(canvas.getByRole('button', { name: /^Choose date/ })).toHaveFocus());
    // Alt+Arrow Down opens the calendar; Escape closes it and gives focus back to the segment.
    await focusOn(day);
    await press('{Alt>}{ArrowDown}{/Alt}');
    await atRest();
    await waitFor(() => expect(document.activeElement).toHaveClass('calendar-day'));
    await press('{Escape}');
    await closed();
    await waitFor(() => expect(day).toHaveFocus());
  },
};

/**
 * Closing on a day, on a preset and on Escape gives focus back to the button that opened the calendar. Three
 * engines: each check waits, as an engine may give focus back a frame after the popover leaves.
 */
export const CloseReturnsFocus: Story = {
  tags: ['no-visual', 'webkit', 'firefox'],
  render: () => <DatePicker label="Date" today={TODAY} presets={PRESETS} onChange={change} />,
  play: async ({ canvas, canvasElement }) => {
    change.mockClear();
    const button = canvas.getByRole('button', { name: /^Choose date/ });
    await userEvent.click(button);
    let popover = await atRest();
    const days = [...popover.querySelectorAll<HTMLElement>('.calendar-day:not([data-outside-month])')];
    const seventh = days.find((each) => each.textContent === '7');
    if (!seventh) throw new Error('No 7th');
    await userEvent.click(seventh);
    await closed();
    await waitFor(() => expect(change).toHaveBeenLastCalledWith('2026-10-07'));
    await waitFor(() => expect(button).toHaveFocus());
    await userEvent.click(button);
    popover = await atRest();
    await userEvent.click(within(popover).getByRole('button', { name: 'Yesterday' }));
    await closed();
    await waitFor(() => expect(change).toHaveBeenLastCalledWith('2026-10-15'));
    await waitFor(() => expect(button).toHaveFocus());
    await waitFor(() =>
      expect(segments(canvasElement).map((each) => each.textContent)).toEqual(['10', '15', '2026']),
    );
    await userEvent.click(button);
    await atRest();
    await userEvent.keyboard('{Escape}');
    await closed();
    await waitFor(() => expect(button).toHaveFocus());
  },
};

/** Three receipts in a DataTable with a DatePicker in each row's date cell. */
interface Receipt {
  id: string;
  merchant: string;
  date: string;
}

const RECEIPTS: readonly Receipt[] = [
  { id: 'a', merchant: 'Corner Mart', date: '2026-10-14' },
  { id: 'b', merchant: 'City Transit', date: '2026-10-13' },
  { id: 'c', merchant: 'Green Grocer', date: '2026-10-12' },
];

const RECEIPT_COLUMNS: readonly DataTableColumn<Receipt>[] = [
  { id: 'merchant', header: 'Merchant', cell: (row) => row.merchant, isRowHeader: true },
  {
    id: 'date',
    header: 'Date',
    width: '16rem',
    cell: (row) => <DatePicker aria-label={`Date, ${row.merchant}`} defaultValue={row.date} today={TODAY} />,
  },
];

/**
 * Inside a DataTable cell the segments are editable spinbuttons, which the table's key guard leaves alone (R8):
 * Arrow Up changes the focused segment, Arrow Right moves between segments, digits type, and J types nothing and
 * moves no row. In three engines.
 */
export const InTableCell: Story = {
  tags: ['no-visual', 'webkit', 'firefox'],
  parameters: { wide: true },
  render: () => (
    <div style={{ width: 'min(40rem, 100%)' }}>
      <DataTable aria-label="Receipts" items={RECEIPTS} columns={RECEIPT_COLUMNS} getKey={(row) => row.id} />
    </div>
  ),
  play: async ({ canvas, canvasElement }) => {
    const group = canvas.getByRole('group', { name: 'Date, Corner Mart' });
    const month = segment(group, 0);
    const day = segment(group, 1);
    const press = async (keys: string): Promise<void> => {
      if (!month.isConnected) throw new Error('The story has gone');
      await userEvent.keyboard(keys);
    };
    await focusOn(month);
    await press('{ArrowUp}');
    await waitFor(() => expect(month).toHaveTextContent('11'));
    await expect(month).toHaveFocus();
    await press('{ArrowRight}');
    await waitFor(() => expect(day).toHaveFocus());
    await press('09');
    await waitFor(() => expect(day).toHaveTextContent('9'));
    const year = segment(group, 2);
    await waitFor(() => expect(year).toHaveFocus());
    // J is the table's Arrow Down outside an editable element; in a segment it types nothing and moves no row.
    await press('j');
    await expect(year).toHaveFocus();
    await expect(year).toHaveTextContent('2026');
    await expect(segments(group).map((each) => each.textContent)).toEqual(['11', '9', '2026']);
    await expect(
      canvas.getByRole('group', { name: 'Date, City Transit' }).contains(document.activeElement),
    ).toBe(false);
    // Escape leaves the field for its row, where the arrows move between the rows again.
    await press('{Escape}');
    const rows = [...canvasElement.querySelectorAll('tbody [role="row"]')];
    await waitFor(() => expect(rows[0]).toHaveFocus());
    await press('{ArrowDown}');
    await waitFor(() => expect(rows[1]).toHaveFocus());
  },
};

/**
 * In the list face, at a phone's width, an editor in an item through its column's listSlot keeps its keys too:
 * Arrow Up changes the focused segment, Arrow Right moves between segments, and Escape leaves the field for its
 * item, where the arrows move between the items again. In three engines.
 */
export const InListItem: Story = {
  tags: ['no-visual', 'webkit', 'firefox'],
  parameters: { wide: true },
  render: () => (
    <div style={{ width: '20rem' }}>
      <DataTable
        aria-label="Receipts"
        items={RECEIPTS}
        columns={RECEIPT_COLUMNS.map((column) =>
          column.id === 'date' ? { ...column, listSlot: 'meta' } : column,
        )}
        getKey={(row) => row.id}
      />
    </div>
  ),
  play: async ({ canvas, canvasElement }) => {
    const group = canvas.getByRole('group', { name: 'Date, City Transit' });
    await expect(group.closest('.data-table-item')).not.toBeNull();
    const month = segment(group, 0);
    const day = segment(group, 1);
    const press = async (keys: string): Promise<void> => {
      if (!month.isConnected) throw new Error('The story has gone');
      await userEvent.keyboard(keys);
    };
    await focusOn(month);
    await press('{ArrowUp}');
    await waitFor(() => expect(month).toHaveTextContent('11'));
    await expect(month).toHaveFocus();
    await press('{ArrowRight}');
    await waitFor(() => expect(day).toHaveFocus());
    await press('{ArrowDown}');
    await waitFor(() => expect(day).toHaveTextContent('12'));
    await expect(day).toHaveFocus();
    await press('{Escape}');
    const items = [...canvasElement.querySelectorAll('.data-table-item')];
    await waitFor(() => expect(items[1]).toHaveFocus());
    await press('{ArrowDown}');
    await waitFor(() => expect(items[2]).toHaveFocus());
  },
};
