import { act } from '@testing-library/react';
import type { ReactElement } from 'react';
import { hydrateRoot, type Root } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Calendar, RangeCalendar } from '../src/calendar';
import { Button } from '../src/button';
import { DataTable } from '../src/data-table';
import { DateRangePicker } from '../src/date-range-picker';
import { FilterBar } from '../src/filter-bar';
import { FilterChip } from '../src/filter-chip';
import { NumberField } from '../src/number-field';
import { PickerOption } from '../src/picker';
import { SearchField } from '../src/search-field';
import { SidePanel, SidePanelLayout } from '../src/side-panel';
import { columnsWithTotal, groupOf, hrefOf, keyOf, TRANSACTIONS } from '../src/stories/transactions';
import { DescriptionList, DescriptionListItem } from '../src/description-list';
import { Link } from '../src/link';

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

/** A viewport `width` px wide for the width queries a part reads after hydration; every other query is false. */
const viewport = (width: number) => (): void => {
  vi.spyOn(window, 'matchMedia').mockImplementation((query: string) => {
    const match = /^\(width (>=|<) (\d+)px\)$/.exec(query);
    let matches = false;
    if (match) matches = match[1] === '>=' ? width >= Number(match[2]) : width < Number(match[2]);
    const list: MediaQueryList = {
      matches,
      media: query,
      onchange: null,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      addListener: () => undefined,
      removeListener: () => undefined,
      dispatchEvent: () => false,
    };
    return list;
  });
};

/** An open side panel in its layout, as the server writes it at every width. */
const PANEL = (
  <SidePanelLayout
    panel={
      <SidePanel
        title="Groceries"
        description="12 October"
        isOpen
        onClose={noop}
        footer={<Button>Save</Button>}
      >
        <p>Corner Mart</p>
      </SidePanel>
    }
  >
    <button type="button">Corner Mart</button>
  </SidePanelLayout>
);

const HYDRATED: [
  name: string,
  element: ReactElement,
  after: (container: HTMLElement) => void,
  before?: () => void,
][] = [
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
    // Static, with a client leaf as a row's action: the server's HTML is what the browser keeps.
    'DescriptionList',
    <DescriptionList>
      <DescriptionListItem term="Name">Everyday Visa</DescriptionListItem>
      <DescriptionListItem term="Nickname" actions={<Link href="/accounts/visa/nickname">Add</Link>} />
      <DescriptionListItem term="Credit limit" isNumeric>
        $5,000.00
      </DescriptionListItem>
      <DescriptionListItem term="APR" isNumeric>
        24.9%
      </DescriptionListItem>
    </DescriptionList>,
    (container) => {
      expect(container.querySelector('[data-empty]')).toHaveTextContent(/^Not set$/);
      expect([...container.querySelectorAll('[data-numeric]')].map((value) => value.textContent)).toEqual([
        '$5,000.00',
        '24.9%',
      ]);
      expect(container.querySelector('.description-list-actions a')).toHaveAttribute(
        'href',
        '/accounts/visa/nickname',
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
  [
    'DataTable',
    <DataTable
      aria-label="Transactions"
      items={TRANSACTIONS.slice(0, 5)}
      columns={columnsWithTotal(TRANSACTIONS.slice(0, 5))}
      getKey={keyOf}
      getRowHref={hrefOf}
      getGroup={groupOf}
      currentKey="t2"
      sortDescriptor={{ column: 'date', direction: 'descending' }}
      onSortChange={noop}
    />,
    (container) => {
      // Both faces: the table's grid and the list's, its days under their headings.
      expect(container.querySelectorAll('[role="grid"]')).toHaveLength(2);
      expect(
        [...container.querySelectorAll('.data-table-section-header')].map((heading) => heading.textContent),
      ).toEqual(['Wednesday 14 October', 'Tuesday 13 October', 'Monday 12 October']);
      expect(container.querySelector('.data-table-item[data-current] .data-table-link')).toHaveAttribute(
        'aria-current',
        'true',
      );
      expect(container.querySelector('[data-current] .data-table-link')).toHaveAttribute(
        'aria-current',
        'true',
      );
      const date = container.querySelector('[role="columnheader"][aria-sort="descending"]');
      expect(date).toHaveTextContent('Date');
      expect(date?.querySelector('.data-table-sort .lucide-arrow-down')).not.toBeNull();
      expect(container.querySelector('tfoot [role="rowheader"]')).toHaveTextContent('Total');
      // Each item is described by its meta and end parts, by the ids the server wrote (spec correction 59).
      expect(container.querySelector('.data-table-item')).toHaveAccessibleDescription('Groceries -$42.18');
    },
  ],
  [
    'DataTable selected',
    <DataTable
      aria-label="Transactions"
      items={TRANSACTIONS.slice(0, 5)}
      columns={columnsWithTotal(TRANSACTIONS.slice(0, 5))}
      getKey={keyOf}
      getRowHref={hrefOf}
      getGroup={groupOf}
      sortDescriptor={{ column: 'date', direction: 'descending' }}
      onSortChange={noop}
      selectedKeys={['t1', 't3']}
      onSelectionChange={noop}
      bulkActions={<Button variant="secondary">Categorize</Button>}
      formatCount={(count) => String(count)}
    />,
    (container) => {
      expect(container.querySelector('.data-table-bar-count')).toHaveTextContent(/^2 selected$/);
      const all = container.querySelector<HTMLInputElement>('thead input[type="checkbox"]');
      expect(all?.indeterminate).toBe(true);
      expect(container.querySelectorAll('tbody [aria-selected="true"]')).toHaveLength(2);
      expect(container.querySelector('.data-table-count')).toBeEmptyDOMElement();
      // The list face: the same two items selected, the Select button and no box until it is pressed.
      expect(container.querySelectorAll('.data-table-item[aria-selected="true"]')).toHaveLength(2);
      expect(container.querySelector('.data-table-list-mode')).toHaveTextContent(/^Select$/);
      expect(container.querySelector('.data-table-list input[type="checkbox"]')).toBeNull();
    },
  ],
  [
    // At 1280px: the aside stays, no dialog mounts and the hydration moves no focus (spec correction 20).
    'SidePanel',
    PANEL,
    (container) => {
      expect(container.querySelector('aside.side-panel')).toHaveAccessibleName('Groceries');
      expect(document.querySelector('[role="dialog"]')).toBeNull();
      expect(document.activeElement).toBe(document.body);
    },
    viewport(1280),
  ],
  [
    // At 800px: the server's aside hydrates with no mismatch, then gives way to the sheet (10.2 item 11).
    'SidePanel narrow',
    PANEL,
    (container) => {
      expect(container.querySelector('aside.side-panel')).toBeNull();
      expect(document.querySelector('[role="dialog"]')).toHaveAccessibleName('Groceries');
    },
    viewport(800),
  ],
];

afterEach(() => {
  vi.restoreAllMocks();
});

describe('hydration', () => {
  it.each(HYDRATED)(
    'hydrates %s from its server HTML on a mocked iPhone with no mismatch, then draws React Aria text',
    (_name, element, after, before) => {
      const html = renderToString(element);
      before?.();
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
