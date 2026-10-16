// @vitest-environment node
import type { ReactElement } from 'react';
import { renderToString } from 'react-dom/server';
import { I18nProvider } from 'react-aria-components';
import { describe, expect, inject, it } from 'vitest';
import { Calendar, RangeCalendar } from '../src/calendar';
import { Button } from '../src/button';
import { DataTable } from '../src/data-table';
import { DateRangePicker } from '../src/date-range-picker';
import { FilterBar } from '../src/filter-bar';
import { FilterChip } from '../src/filter-chip';
import { NumberField } from '../src/number-field';
import { PickerOption } from '../src/picker';
import { SearchField } from '../src/search-field';
import { columnsWithTotal, groupOf, hrefOf, keyOf, TRANSACTIONS } from '../src/stories/transactions';

/**
 * The server face (ruling 1): every date and number part writes one HTML, byte for byte, under en-US, de-DE and
 * fa-IR, and in UTC and Asia/Tehran. This file runs in two Vitest projects, face-utc and face-tehran, which set
 * TZ and write the same test names to one snapshot file, so a zone that changes a byte fails against the other
 * (plan, spec correction 3). The platform is the hydration test's: on the server there is no navigator to read.
 *
 * Each later part adds its rows to FACES.
 */
const LOCALES = ['en-US', 'de-DE', 'fa-IR'] as const;

const PRESETS = [
  { id: 'this-month', label: 'This month', range: { start: '2026-09-01', end: '2026-09-30' } },
  { id: 'last-7', label: 'Last 7 days', range: { start: '2026-09-12', end: '2026-09-18' } },
];

const noop = (): void => undefined;

/** Five of the household's transactions, the data table's rows. */
const FIVE = TRANSACTIONS.slice(0, 5);

/** Six categories, a list chip's options. */
const CATEGORIES = ['Food', 'Rent', 'Salary', 'Transport', 'Utilities', 'Health'].map((name) => (
  <PickerOption key={name} id={name.toLowerCase()}>
    {name}
  </PickerOption>
));

const FACES: [name: string, element: ReactElement][] = [
  [
    'NumberField money',
    <NumberField label="Amount" money={{ symbol: '$' }} allowsNegative value={-123450} name="amount" />,
  ],
  ['NumberField plain', <NumberField label="Guests" hasStepper value={2} />],
  [
    'NumberField unlabelled',
    <NumberField
      aria-label="Minimum"
      money={{ symbol: 'تومان', symbolPosition: 'end', fractionDigits: 0 }}
      value={null}
      placeholder="0"
    />,
  ],
  ['Calendar', <Calendar aria-label="Date" value="2026-09-14" today="2026-09-18" />],
  [
    'RangeCalendar',
    <RangeCalendar
      aria-label="Statement period"
      value={{ start: '2026-09-01', end: '2026-09-30' }}
      presets={PRESETS}
    />,
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
  ],
  [
    'FilterChip single',
    <FilterChip label="Category" selectionMode="single" value="food" onChange={noop}>
      {CATEGORIES}
    </FilterChip>,
  ],
  [
    'FilterChip multiple',
    <FilterChip
      label="Category"
      selectionMode="multiple"
      value={['health', 'salary', 'rent', 'food']}
      onChange={noop}
    >
      {CATEGORIES}
    </FilterChip>,
  ],
  [
    'FilterChip custom',
    <FilterChip label="Amount" valueLabel="Over $100" onClear={noop}>
      <p>Two amounts</p>
    </FilterChip>,
  ],
  [
    // The count in the Filters button's Badge, More and Clear all; no panel and no sheet.
    'FilterBar',
    <FilterBar search={<SearchField aria-label="Search transactions" />} onClearAll={noop}>
      <FilterChip label="Category" selectionMode="single" value="food" onChange={noop}>
        {CATEGORIES}
      </FilterChip>
      <FilterChip label="Tags" selectionMode="multiple" isSecondary value={[]} onChange={noop}>
        {CATEGORIES}
      </FilterChip>
      <FilterChip label="Amount" valueLabel="Over $100" onClear={noop}>
        <p>Two amounts</p>
      </FilterChip>
    </FilterBar>,
  ],
  [
    // The rows, the row header's links, the current row, the sort marks and the totals; the status is empty. The
    // list face follows the table's, its items grouped by day under their headings.
    'DataTable',
    <DataTable
      aria-label="Transactions"
      items={FIVE}
      columns={columnsWithTotal(FIVE)}
      getKey={keyOf}
      getRowHref={hrefOf}
      getGroup={groupOf}
      currentKey="t2"
      sortDescriptor={{ column: 'date', direction: 'descending' }}
      onSortChange={noop}
    />,
  ],
  [
    // Two rows selected: the checked boxes, the header's indeterminate box, and the bar with its count, written
    // by the app's formatCount; the count's status is empty. The list face draws its Select button and no boxes.
    'DataTable selected',
    <DataTable
      aria-label="Transactions"
      items={FIVE}
      columns={columnsWithTotal(FIVE)}
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
  ],
];

describe('the server face', () => {
  it('runs in the zone its project names', () => {
    expect(Intl.DateTimeFormat().resolvedOptions().timeZone).toBe(inject('zone'));
  });

  it.each(FACES)('renders %s to one HTML in en-US, de-DE and fa-IR', (_name, element) => {
    const [first, ...rest] = LOCALES.map((locale) =>
      renderToString(<I18nProvider locale={locale}>{element}</I18nProvider>),
    );
    for (const html of rest) expect(html).toBe(first);
    expect(first).toMatchSnapshot();
  });
});
