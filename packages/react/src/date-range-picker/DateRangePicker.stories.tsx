import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ComponentType, ReactElement } from 'react';
import { renderToString } from 'react-dom/server';
import { I18nProvider } from 'react-aria-components';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import type { DateRange, DateRangePreset } from '../calendar';
import { DATE_PLACEHOLDER_A11Y } from '../stories/a11y';
import { tokenColor, tokenPixels } from '../stories/paint';
import { DateRangePicker } from './DateRangePicker';

/** Every story's today, fixed so the baselines never move. */
const TODAY = '2026-09-18';

const SEPTEMBER: DateRange = { start: '2026-09-01', end: '2026-09-30' };

/** The app's presets, computed from its own today with its own words. */
const PRESETS: DateRangePreset[] = [
  { id: 'this-month', label: 'This month', range: SEPTEMBER },
  { id: 'last-month', label: 'Last month', range: { start: '2026-08-01', end: '2026-08-31' } },
  { id: 'last-7', label: 'Last 7 days', range: { start: '2026-09-12', end: '2026-09-18' } },
];

/**
 * The args the stories take. The props require a label, an aria-label or an aria-labelledby, a union Storybook's
 * args type collapses, so every story renders its own picker and takes only the change handler as an arg.
 */
interface StoryArgs {
  onChange?: (value: DateRange | null) => void;
}

const meta = {
  title: 'Components/DateRangePicker',
  component: DateRangePicker as ComponentType<StoryArgs>,
  decorators: [
    (Story) => (
      <div style={{ width: 'min(24rem, 100%)' }}>
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

/** Tabs from the page to the first segment, as a keyboard reader arrives. */
async function tabToFirstSegment(scope: ParentNode): Promise<HTMLElement> {
  const first = segment(scope, 0);
  for (let step = 0; step < 6 && document.activeElement !== first; step += 1) await userEvent.tab();
  await expect(first).toHaveFocus();
  return first;
}

/** The open calendar's popover, once its entrance has finished. */
async function atRest(): Promise<HTMLElement> {
  const popover = await waitFor(async () => {
    const found = document.querySelector<HTMLElement>('.date-range-popover');
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
  await waitFor(() => expect(document.querySelector('.date-range-popover')).toBeNull());
}

/** A statement period, September 2026: two dates in tabular figures, a slate arrow and the calendar button. */
export const Default: Story = {
  tags: ['density'],
  render: (args) => (
    <DateRangePicker
      label="Statement period"
      description="Transactions posted in these days."
      defaultValue={SEPTEMBER}
      today={TODAY}
      onChange={args.onChange}
    />
  ),
  play: async ({ canvas, canvasElement }) => {
    const frame = find(canvasElement, '.date-range-control');
    await expect(canvas.getByRole('group', { name: 'Statement period' })).toBe(frame);
    await expect(rect(frame).height).toBeCloseTo(tokenPixels('--size-field'), 1);
    await expect(segments(canvasElement).map((each) => each.textContent)).toEqual([
      '9',
      '1',
      '2026',
      '9',
      '30',
      '2026',
    ]);
    const first = segment(canvasElement, 0);
    await expect(getComputedStyle(first).color).toBe(tokenColor('--color-ink'));
    await expect(getComputedStyle(first).fontVariantNumeric).toBe('tabular-nums');
    await expect(getComputedStyle(find(canvasElement, '.date-range-arrow')).color).toBe(
      tokenColor('--color-slate'),
    );
    // The button sits inside the frame's end padding, clear of the end date.
    const button = canvas.getByRole('button', { name: 'Choose dates Statement period' });
    const end = segment(canvasElement, 5);
    await expect(rect(button).left).toBeGreaterThan(rect(end).right);
    await expect(rect(button).right).toBeLessThanOrEqual(rect(frame).right);
  },
};

/** Nothing chosen: the placeholder segments in taupe under the label. */
export const Empty: Story = {
  parameters: { a11y: DATE_PLACEHOLDER_A11Y },
  render: (args) => <DateRangePicker label="Statement period" today={TODAY} onChange={args.onChange} />,
  play: async ({ canvasElement }) => {
    const placeholder = segment(canvasElement, 0);
    await expect(placeholder).toHaveAttribute('data-placeholder');
    await expect(getComputedStyle(placeholder).color).toBe(tokenColor('--color-taupe'));
  },
};

/**
 * Opened from the keyboard with Alt+Arrow Down: the range calendar 8px under the frame at its start, padded 16px
 * in the float panel, with the presets above the month and "This month" pressed.
 */
export const Open: Story = {
  tags: ['density'],
  render: (args) => (
    <DateRangePicker
      label="Statement period"
      defaultValue={SEPTEMBER}
      today={TODAY}
      presets={PRESETS}
      onChange={args.onChange}
    />
  ),
  play: async ({ canvasElement }) => {
    await tabToFirstSegment(canvasElement);
    await userEvent.keyboard('{Alt>}{ArrowDown}{/Alt}');
    const popover = await atRest();
    const frame = find(canvasElement, '.date-range-control');
    await expect(rect(popover).top - rect(frame).bottom).toBeCloseTo(8, 0);
    // At the frame's start, or 12px in from the screen's edge, React Aria's container padding, if that is further.
    await expect(rect(popover).left).toBeCloseTo(Math.max(rect(frame).left, 12), 0);
    // The month's width: seven controls, the padding and the frame.
    await expect(rect(popover).width).toBeCloseTo(
      7 * tokenPixels('--size-control') + 2 * tokenPixels('--spacing-inset') + 2,
      1,
    );
    await expect(getComputedStyle(popover).paddingTop).toBe(`${String(tokenPixels('--spacing-inset'))}px`);
    const dialog = within(popover).getByRole('dialog');
    await expect(within(dialog).getByRole('button', { name: 'This month' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await waitFor(() => expect(document.activeElement).toHaveClass('calendar-day'));
  },
};

/** Named by an aria-label alone: the placeholders slate, the only words shown. */
export const Unlabelled: Story = {
  render: (args) => <DateRangePicker aria-label="Statement period" today={TODAY} onChange={args.onChange} />,
  play: async ({ canvasElement }) => {
    await expect(getComputedStyle(segment(canvasElement, 0)).color).toBe(tokenColor('--color-slate'));
  },
};

/** Changed with its chip and edge, invalid with its error edge and line, and disabled with a value. */
export const States: Story = {
  render: (args) => (
    <div style={{ display: 'grid', gap: 24 }}>
      <DateRangePicker
        label="Changed"
        defaultValue={SEPTEMBER}
        today={TODAY}
        isChanged
        onChange={args.onChange}
      />
      <DateRangePicker
        label="Invalid"
        defaultValue={SEPTEMBER}
        today={TODAY}
        isInvalid
        errorMessage="End the period after it starts."
        onChange={args.onChange}
      />
      <DateRangePicker
        label="Disabled"
        defaultValue={SEPTEMBER}
        today={TODAY}
        isDisabled
        onChange={args.onChange}
      />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const [changed, invalid, disabled] = [...canvasElement.querySelectorAll('.date-range-control')];
    if (!changed || !invalid || !disabled) throw new Error('Three frames');
    await expect(getComputedStyle(changed).borderTopColor).toBe(tokenColor('--color-signal-light'));
    await expect(getComputedStyle(invalid).borderTopColor).toBe(tokenColor('--color-error'));
    await expect(getComputedStyle(disabled).backgroundColor).toBe(tokenColor('--color-disabled'));
    await expect(getComputedStyle(segment(disabled, 0)).color).toBe(tokenColor('--color-taupe'));
    await expect(getComputedStyle(find(disabled, '.date-range-arrow')).color).toBe(
      tokenColor('--color-taupe'),
    );
  },
};

/** The start's month segment from the keyboard: the ink chip, and the frame's edge and ring. */
export const SegmentFocus: Story = {
  render: (args) => (
    <DateRangePicker
      label="Statement period"
      defaultValue={SEPTEMBER}
      today={TODAY}
      onChange={args.onChange}
    />
  ),
  play: async ({ canvasElement }) => {
    const month = await tabToFirstSegment(canvasElement);
    await expect(getComputedStyle(month).backgroundColor).toBe(tokenColor('--color-ink'));
    await expect(getComputedStyle(month).color).toBe(tokenColor('--color-canvas'));
    const frame = find(canvasElement, '.date-range-control');
    await expect(getComputedStyle(frame).outlineStyle).toBe('solid');
    await expect(getComputedStyle(frame).borderTopColor).toBe(tokenColor('--color-ink'));
  },
};

/**
 * The page as a browser paints it before the scripts run: the server's HTML, the frame, the button and the app's
 * "1 to 30 Sep 2026" where the segments go (plan, spec correction 12).
 */
export const Face: Story = {
  render: () => {
    const html = renderToString(
      <DateRangePicker
        label="Statement period"
        value={SEPTEMBER}
        valueLabel="1 to 30 Sep 2026"
        today={TODAY}
        startName="from"
        endName="to"
      />,
    );
    // The library's own server HTML of its own story, never input from a reader.
    return <div dangerouslySetInnerHTML={{ __html: html }} />;
  },
  play: async ({ canvasElement }) => {
    await expect(find(canvasElement, '.date-range-face')).toHaveTextContent('1 to 30 Sep 2026');
    await expect(canvasElement.querySelectorAll('.date-segment')).toHaveLength(0);
    await expect(rect(find(canvasElement, '.date-range-control')).height).toBeCloseTo(
      tokenPixels('--size-field'),
      1,
    );
  },
};

/** fa-IR on a right-to-left page: Shahrivar 1405 in Persian digits, the start date at the right. */
export const RightToLeft: Story = {
  render: (args) => (
    <I18nProvider locale="fa-IR">
      <div dir="rtl" lang="fa">
        <DateRangePicker
          label="دوره"
          defaultValue={SEPTEMBER}
          today={TODAY}
          labels={{ open: 'انتخاب تاریخ', start: 'تاریخ شروع', end: 'تاریخ پایان' }}
          onChange={args.onChange}
        />
      </div>
    </I18nProvider>
  ),
  play: async ({ canvasElement }) => {
    await expect(segments(canvasElement).map((each) => each.textContent)).toEqual([
      '۱۴۰۵',
      '۶',
      '۱۰',
      '۱۴۰۵',
      '۷',
      '۸',
    ]);
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
        <DateRangePicker
          label="Statement period"
          description="Transactions posted in these days."
          value={SEPTEMBER}
          valueLabel="1 to 30 Sep 2026"
          today={TODAY}
        />
      </FaceBeside>
      <FaceBeside id="unlabelled">
        <DateRangePicker aria-label="Statement period" value={null} today={TODAY} />
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
        for (const id of ['labelled', 'unlabelled']) {
          const pair = find(canvasElement, `[data-pair="${id}"]`);
          const face = find(pair, '[data-side="face"] .date-range-picker');
          const live = find(pair, '[data-side="live"] .date-range-picker');
          await expect(face.querySelector('.date-range-face')).not.toBeNull();
          await expect(live.querySelector('.date-range-face')).toBeNull();
          for (const part of ['', ' .date-range-control', ' .date-range-button']) {
            const [drawn, hydrated] = [face, live].map((field) =>
              part === '' ? field : find(field, part.trim()),
            );
            if (!drawn || !hydrated) throw new Error('No part');
            await expect(rect(drawn).width, `${id}${part}`).toBeCloseTo(rect(hydrated).width, 1);
            await expect(rect(drawn).height, `${id}${part}`).toBeCloseTo(rect(hydrated).height, 1);
            await expect(rect(drawn).left, `${id}${part}`).toBeCloseTo(rect(hydrated).left, 1);
          }
          // The face's text starts where the first segment's does: the same box and the same padding.
          if (id === 'labelled') {
            const text = find(face, '.date-range-face');
            const first = segment(live, 0);
            await expect(rect(text).left).toBeCloseTo(rect(first).left, 1);
            await expect(getComputedStyle(text).paddingInlineStart).toBe(
              getComputedStyle(first).paddingInlineStart,
            );
          }
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

/** React Aria's keys, as the docs' table states them. */
export const Keys: Story = {
  tags: ['no-visual'],
  render: () => (
    <DateRangePicker label="Statement period" defaultValue={SEPTEMBER} today={TODAY} onChange={change} />
  ),
  play: async ({ canvas, canvasElement }) => {
    change.mockClear();
    await tabToFirstSegment(canvasElement);
    // Tab runs through each segment of the start date, then the end date, then the button.
    for (let index = 1; index < 6; index += 1) {
      await userEvent.tab();
      await expect(segment(canvasElement, index)).toHaveFocus();
    }
    await userEvent.tab();
    await expect(canvas.getByRole('button', { name: /^Choose dates/ })).toHaveFocus();
    await userEvent.tab({ shift: true });
    await expect(segment(canvasElement, 5)).toHaveFocus();
    // Left and Right move between segments, across the arrow.
    await userEvent.keyboard('{ArrowLeft}{ArrowLeft}{ArrowLeft}');
    await expect(segment(canvasElement, 2)).toHaveFocus();
    await userEvent.keyboard('{ArrowRight}');
    await expect(segment(canvasElement, 3)).toHaveFocus();
    // Up and Down by one, Page Up and Page Down by two months, Home and End to the least and greatest.
    const steps: [string, string][] = [
      ['{ArrowUp}', '10'],
      ['{ArrowDown}', '9'],
      ['{PageUp}', '11'],
      ['{PageDown}', '9'],
      ['{End}', '12'],
      ['{Home}', '1'],
    ];
    for (const [keys, text] of steps) {
      await userEvent.keyboard(keys);
      await expect(segment(canvasElement, 3), keys).toHaveTextContent(text);
    }
    // A full segment hands focus on: 9 is the only month that starts with 9.
    await userEvent.keyboard('9');
    await expect(segment(canvasElement, 4)).toHaveFocus();
    await expect(change).toHaveBeenLastCalledWith(SEPTEMBER);
    // Backspace in an empty segment moves to the one before.
    await userEvent.keyboard('{Backspace}{Backspace}{Backspace}');
    await expect(segment(canvasElement, 3)).toHaveFocus();
    // The day typed back, so the field ends whole.
    await userEvent.keyboard('{ArrowRight}30');
    await expect(change).toHaveBeenLastCalledWith(SEPTEMBER);
  },
};

/** A preset press sets the range and closes the calendar, and focus goes back to the button. */
export const PresetCloses: Story = {
  tags: ['no-visual'],
  render: () => (
    <DateRangePicker label="Statement period" today={TODAY} presets={PRESETS} onChange={change} />
  ),
  play: async ({ canvas, canvasElement }) => {
    change.mockClear();
    const button = canvas.getByRole('button', { name: /^Choose dates/ });
    await userEvent.click(button);
    const popover = await atRest();
    await userEvent.click(within(popover).getByRole('button', { name: 'Last month' }));
    await closed();
    await expect(change).toHaveBeenCalledWith({ start: '2026-08-01', end: '2026-08-31' });
    await expect(button).toHaveFocus();
    await expect(segments(canvasElement).map((each) => each.textContent)).toEqual([
      '8',
      '1',
      '2026',
      '8',
      '31',
      '2026',
    ]);
  },
};

/** Escape gives focus back to the segment where Alt+Arrow Down was pressed; a completed range, to it as well. */
export const FocusBack: Story = {
  tags: ['no-visual'],
  render: () => (
    <DateRangePicker label="Statement period" defaultValue={SEPTEMBER} today={TODAY} onChange={change} />
  ),
  play: async ({ canvasElement }) => {
    change.mockClear();
    await tabToFirstSegment(canvasElement);
    await userEvent.keyboard('{ArrowRight}{ArrowRight}{ArrowRight}{ArrowRight}');
    const endDay = segment(canvasElement, 4);
    await expect(endDay).toHaveFocus();
    await userEvent.keyboard('{Alt>}{ArrowDown}{/Alt}');
    await atRest();
    await userEvent.keyboard('{Escape}');
    await closed();
    await expect(endDay).toHaveFocus();
    // Again, completing a range from the keyboard: 1 September is focused; Enter, then Arrow Right twice and Enter.
    await userEvent.keyboard('{Alt>}{ArrowDown}{/Alt}');
    await atRest();
    await waitFor(() => expect(document.activeElement).toHaveClass('calendar-day'));
    await userEvent.keyboard('{Enter}{ArrowRight}{Enter}');
    await closed();
    await expect(change).toHaveBeenLastCalledWith({ start: '2026-09-01', end: '2026-09-03' });
    await expect(endDay).toHaveFocus();
  },
};

/** The button rings itself and the frame draws no ring and no focus edge while it has focus. */
export const ButtonFocusNoFrameRing: Story = {
  tags: ['no-visual'],
  render: () => <DateRangePicker label="Statement period" defaultValue={SEPTEMBER} today={TODAY} />,
  play: async ({ canvas, canvasElement }) => {
    await tabToFirstSegment(canvasElement);
    for (let step = 0; step < 6; step += 1) await userEvent.tab();
    const button = canvas.getByRole('button', { name: /^Choose dates/ });
    await expect(button).toHaveFocus();
    await expect(getComputedStyle(button).outlineStyle).toBe('solid');
    const frame = find(canvasElement, '.date-range-control');
    await expect(getComputedStyle(frame).outlineStyle).toBe('none');
    await expect(getComputedStyle(frame).borderTopColor).toBe(tokenColor('--color-boundary'));
    // React Aria's picker writes focus-visible on its root meanwhile, which nothing draws.
    await expect(find(canvasElement, '.date-range-picker')).toHaveAttribute('data-focus-visible');
  },
};

/** At a 320px viewport the open calendar fits beside the margins, with no sideways scroll, days 36px or more. */
export const NoSideScroll320: Story = {
  tags: ['no-visual'],
  render: () => (
    <div style={{ width: 'calc(320px - 2rem)' }}>
      <DateRangePicker label="Statement period" defaultValue={SEPTEMBER} today={TODAY} presets={PRESETS} />
    </div>
  ),
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: /^Choose dates/ }));
    const popover = await atRest();
    // The play narrows the popover's room to a 320px screen's, as the viewport would: max-width less 2rem.
    popover.style.maxWidth = 'calc(320px - 2rem)';
    try {
      const calendar = find(popover, '.calendar');
      await expect(rect(popover).width).toBeLessThanOrEqual(288.5);
      await expect(rect(calendar).right).toBeLessThanOrEqual(rect(popover).right);
      await expect(popover.scrollWidth).toBeLessThanOrEqual(popover.clientWidth);
      const day = find(popover, '.calendar-day');
      await expect(rect(day).width).toBeGreaterThanOrEqual(36);
      await expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(
        document.documentElement.clientWidth,
      );
    } finally {
      popover.style.maxWidth = '';
      await userEvent.keyboard('{Escape}');
      await closed();
    }
  },
};
