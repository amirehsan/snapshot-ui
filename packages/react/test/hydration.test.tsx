import { act } from '@testing-library/react';
import type { ReactElement } from 'react';
import { hydrateRoot, type Root } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Calendar, RangeCalendar } from '../src/calendar';
import { DateRangePicker } from '../src/date-range-picker';
import { FilterBar } from '../src/filter-bar';
import { FilterChip } from '../src/filter-chip';
import { NumberField } from '../src/number-field';
import { PickerOption } from '../src/picker';
import { SearchField } from '../src/search-field';

/**
 * Each part's server HTML, hydrated in the browser on a mocked iPhone (plan, spec corrections 1 and 2). The HTML
 * is written with jsdom's own navigator, which is no phone, as a server's is none; the iPhone is read in the
 * hydration pass, where React Aria's platform checks run. React 19 recovers from a text mismatch through
 * onRecoverableError but only logs a differing attribute with console.error, so the test fails on either. From
 * the render after hydration each part shows React Aria's own text, which `after` checks.
 *
 * Each later part adds its rows to HYDRATED.
 */
const noop = (): void => undefined;

const HYDRATED: [name: string, element: ReactElement, after: (container: HTMLElement) => void][] = [
  [
    'NumberField money',
    <NumberField label="Amount" money={{ symbol: '$' }} allowsNegative value={-123450} name="amount" />,
    (container) => {
      const input = container.querySelector('.number-field-input');
      expect(input).toHaveValue('-1,234.50');
      expect(input).toHaveAttribute('inputmode', 'decimal');
      expect(input).not.toHaveAttribute('aria-roledescription');
    },
  ],
  [
    'NumberField plain',
    <NumberField label="Guests" hasStepper value={2} />,
    (container) => {
      expect(container.querySelector('.number-field-input')).toHaveValue('2');
    },
  ],
  [
    'Calendar',
    <Calendar aria-label="Date" value="2026-09-14" today="2026-09-18" />,
    (container) => {
      expect(container.querySelector('[data-face]')).toBeNull();
      expect(container.querySelector('[role="grid"]')).not.toBeNull();
      expect(container.querySelector('.calendar-heading')).toHaveTextContent('September 2026');
      const marked = [...container.querySelectorAll('.calendar-day-number[data-today]')];
      expect(marked.map((number) => number.textContent)).toEqual(['18']);
    },
  ],
  [
    'RangeCalendar',
    <RangeCalendar
      aria-label="Statement period"
      value={{ start: '2026-09-01', end: '2026-09-30' }}
      today="2026-09-18"
      presets={[{ id: 'this-month', label: 'This month', range: { start: '2026-09-01', end: '2026-09-30' } }]}
    />,
    (container) => {
      expect(container.querySelector('[data-face]')).toBeNull();
      expect(container.querySelector('[role="grid"]')).not.toBeNull();
      expect(container.querySelector('.calendar-heading')).toHaveTextContent('September 2026');
      expect(container.querySelector('.calendar-preset')).toHaveAttribute('aria-pressed', 'true');
      const marked = [...container.querySelectorAll('.calendar-day-number[data-today]')];
      expect(marked.map((number) => number.textContent)).toEqual(['18']);
    },
  ],
  [
    'DateRangePicker',
    <DateRangePicker
      label="Statement period"
      value={{ start: '2026-09-01', end: '2026-09-30' }}
      valueLabel="1 to 30 Sep 2026"
      startName="from"
      endName="to"
      today="2026-09-18"
    />,
    (container) => {
      expect(container.querySelector('.date-range-face')).toBeNull();
      // On an iPhone React Aria makes each segment a text box (useDateSegment.mjs:303-309).
      const segments = [...container.querySelectorAll('.date-segment:not([data-type="literal"])')];
      expect(segments).toHaveLength(6);
      for (const segment of segments) {
        expect(segment).toHaveAttribute('role', 'textbox');
        expect(segment).toHaveAttribute('contenteditable', 'true');
      }
      expect(segments[0]).toHaveAccessibleName(/Start date, Statement period$/);
      expect(segments[0]).toHaveTextContent('9');
      expect(container.querySelector('input[name="from"]')).toHaveValue('2026-09-01');
    },
  ],
  [
    'FilterChip multiple',
    <FilterChip
      label="Category"
      selectionMode="multiple"
      value={['health', 'salary', 'rent', 'food']}
      onChange={noop}
    >
      {['Food', 'Rent', 'Salary', 'Transport', 'Utilities', 'Health'].map((name) => (
        <PickerOption key={name} id={name.toLowerCase()}>
          {name}
        </PickerOption>
      ))}
    </FilterChip>,
    (container) => {
      // The summary is the library's own words, the same before and after hydration.
      expect(container.querySelector('.filter-chip-value')).toHaveTextContent(/^Food, Rent and 2 more$/);
      expect(container.querySelector('.filter-chip-trigger')).toHaveAccessibleName(
        'Category Food, Rent and 2 more',
      );
    },
  ],
  [
    'FilterBar',
    <FilterBar search={<SearchField aria-label="Search transactions" />} onClearAll={noop}>
      <FilterChip label="Category" selectionMode="single" value="food" onChange={noop}>
        {['Food', 'Rent'].map((name) => (
          <PickerOption key={name} id={name.toLowerCase()}>
            {name}
          </PickerOption>
        ))}
      </FilterChip>
      <FilterChip label="Tags" selectionMode="multiple" isSecondary value={[]} onChange={noop}>
        {['Food', 'Rent'].map((name) => (
          <PickerOption key={name} id={name.toLowerCase()}>
            {name}
          </PickerOption>
        ))}
      </FilterChip>
      <FilterChip label="Amount" valueLabel="Over $100" onClear={noop}>
        <p>Two amounts</p>
      </FilterChip>
    </FilterBar>,
    (container) => {
      // The count is the props', the same before and after hydration; the Tags chip is behind More.
      expect(container.querySelector('.filter-bar-sheet-button .badge')).toHaveTextContent(/^2$/);
      expect(container.querySelector('.filter-bar-sheet-button')).toHaveAccessibleName('Filters 2');
      expect(
        [...container.querySelectorAll('.filter-bar-row .filter-chip-label')].map(
          (label) => label.textContent,
        ),
      ).toEqual(['Category', 'Amount', 'More']);
    },
  ],
];

afterEach(() => {
  vi.restoreAllMocks();
});

describe('hydration', () => {
  it.each(HYDRATED)(
    'hydrates %s from its server HTML on a mocked iPhone with no mismatch, then draws React Aria text',
    (_name, element, after) => {
      const html = renderToString(element);
      vi.spyOn(navigator, 'platform', 'get').mockReturnValue('iPhone');
      const container = document.createElement('div');
      container.innerHTML = html;
      document.body.append(container);
      const consoleError = vi.spyOn(console, 'error');
      const recoverable = vi.fn();
      let root: Root | undefined;
      act(() => {
        root = hydrateRoot(container, element, { onRecoverableError: recoverable });
      });
      expect(recoverable).not.toHaveBeenCalled();
      expect(consoleError).not.toHaveBeenCalled();
      after(container);
      act(() => {
        root?.unmount();
      });
      container.remove();
    },
  );
});
