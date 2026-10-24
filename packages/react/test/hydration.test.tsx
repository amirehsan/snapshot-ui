import { act } from '@testing-library/react';
import { Monitor, Moon, Sun } from 'lucide-react';
import type { ReactElement } from 'react';
import { hydrateRoot, type Root } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Breadcrumb, Breadcrumbs } from '../src/breadcrumbs';
import { Calendar, RangeCalendar } from '../src/calendar';
import { Button } from '../src/button';
import { DataTable } from '../src/data-table';
import { DatePicker } from '../src/date-picker';
import { DateRangePicker } from '../src/date-range-picker';
import { FileButton, FileDropZone } from '../src/file-drop-zone';
import { FilterBar } from '../src/filter-bar';
import { FilterChip } from '../src/filter-chip';
import { NumberField } from '../src/number-field';
import { PageHeader } from '../src/page-header';
import { Pagination } from '../src/pagination';
import { Prose, ProseScroll } from '../src/prose';
import { PickerOption } from '../src/picker';
import { SaveBar } from '../src/save-bar';
import { SearchField } from '../src/search-field';
import { Select } from '../src/select';
import { SidePanel, SidePanelLayout } from '../src/side-panel';
import { Switch } from '../src/switch';
import { TextField } from '../src/text-field';
import { UploadList, UploadTray, type UploadItem } from '../src/upload-tray';
import { columnsWithTotal, groupOf, hrefOf, keyOf, TRANSACTIONS } from '../src/stories/transactions';
import { Card, CardActions, CardBody, CardHeader, CardNote, CardTitle } from '../src/card';
import { ConditionalFields } from '../src/conditional-fields';
import { CopyButton } from '../src/copy-button';
import { FieldExtras } from '../src/field-extras';
import { Repeater } from '../src/repeater';
import { settingsPage } from './panel-layout-fixture';
import { accountRail } from './account-menu-fixture';
import { ThemeSwitch } from '../src/theme-switch';
import { DescriptionList, DescriptionListItem } from '../src/description-list';
import { Link } from '../src/link';
import { Accordion, AccordionItem } from '../src/accordion';
import { TagInput, emailPreset } from '../src/tag-input';
import { ChoiceCard, ChoiceCards } from '../src/choice-cards';
import { Gauge } from '../src/gauge';
import { MonthGrid } from '../src/month-grid';
import {
  COVERAGE_STATES,
  COVERAGE_YEARS,
  MONTH_NAMES,
  PERSIAN_LABELS,
  PERSIAN_MONTH_NAMES,
  PERSIAN_SHORT_MONTHS,
  PERSIAN_STATES,
  PERSIAN_SUMMARY,
  PERSIAN_YEARS,
  SHORT_MONTHS,
} from '../src/stories/coverage';

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

/** Six files, one in each status. */
const UPLOADS: UploadItem[] = [
  { id: 1, name: 'receipt-march.pdf', status: 'waiting' },
  { id: 2, name: 'invoice.pdf', status: 'uploading', progress: 0.45, progressLabel: '1.8 of 4 MB' },
  { id: 3, name: 'statement.pdf', status: 'reading' },
  { id: 4, name: 'lease.pdf', status: 'saved', href: '/documents/lease' },
  { id: 5, name: 'corner-mart.jpg', status: 'review', reason: 'The total could not be read' },
  { id: 6, name: 'video.mov', status: 'failed', reason: 'Not a PDF, JPG or PNG' },
];

/** The consumer's three default wait tiers, as a controlled Repeater draws them, for the server suites. */
function ServerTiers({ rows }: { rows: { id: string; amount: number; wait: string }[] }): ReactElement {
  return (
    <Repeater
      label="Wait tiers"
      description="A payment waits by its amount."
      value={rows}
      onChange={() => undefined}
      createRow={() => ({ id: 'new', amount: 0, wait: 'three' })}
      rowLabel={(index) => `Tier ${String(index + 1)}`}
      maxRows={3}
      labels={{ add: 'Add a tier', empty: 'No tiers. The coach never waits.' }}
    >
      {(tier) => (
        <>
          <NumberField label="Up to" money={{ symbol: '$' }} value={tier.amount} />
          <Select label="Wait" value={tier.wait}>
            <PickerOption id="three">3 days</PickerOption>
            <PickerOption id="week">A week</PickerOption>
            <PickerOption id="month">A month</PickerOption>
          </Select>
        </>
      )}
    </Repeater>
  );
}

const DEFAULT_TIERS = [
  { id: 'a', amount: 10000, wait: 'three' },
  { id: 'b', amount: 50000, wait: 'week' },
  { id: 'c', amount: 150000, wait: 'month' },
];

/** Three sections, as a settings page draws them on the server: Billing open, Notifications folded and marked, Danger zone disabled. */
function ServerSections({ multiple = true }: { multiple?: boolean }): ReactElement {
  return (
    <Accordion hasExpandAll={multiple} allowsMultipleExpanded={multiple} defaultExpandedKeys={['billing']}>
      <AccordionItem id="billing" title="Billing address">
        <p>12 Rose Lane</p>
      </AccordionItem>
      <AccordionItem
        id="notifications"
        title="Notifications"
        note="Email, push and digest settings"
        isChanged
      >
        <p>Email, push and digest</p>
      </AccordionItem>
      <AccordionItem id="danger" title="Danger zone" isDisabled>
        <p>Delete the account</p>
      </AccordionItem>
    </Accordion>
  );
}

/** An invite field as a sharing form draws it on the server: two addresses, a limit and a hint. */
function ServerInvite({
  values = ['ana@example.com', 'bo@example.com'],
}: {
  values?: string[];
}): ReactElement {
  return (
    <TagInput
      label="Invite people"
      description="Separate addresses with commas or spaces."
      name="invite"
      preset={emailPreset}
      maxValues={10}
      defaultValue={values}
    />
  );
}

/** A plan choice as a billing page draws it on the server: three cards, the second chosen, each with a price. */
function ServerPlans(): ReactElement {
  return (
    <ChoiceCards label="Plan" name="plan" defaultValue="yearly">
      <ChoiceCard value="monthly" description="Billed every month." detail="$12 a month">
        Monthly
      </ChoiceCard>
      <ChoiceCard value="yearly" description="Two months free." detail="$120 a year">
        Yearly
      </ChoiceCard>
      <ChoiceCard value="starter" description="One account, no exports." detail="Free">
        Starter
      </ChoiceCard>
    </ChoiceCards>
  );
}

/** A theme choice drawn as a grid of icon cards on the server, the second chosen. */
function ServerThemes(): ReactElement {
  return (
    <ChoiceCards label="Theme" name="theme" defaultValue="dark" layout="grid">
      <ChoiceCard value="light" icon={<Sun />}>
        Light
      </ChoiceCard>
      <ChoiceCard value="dark" icon={<Moon />}>
        Dark
      </ChoiceCard>
      <ChoiceCard value="system" icon={<Monitor />}>
        System
      </ChoiceCard>
    </ChoiceCards>
  );
}

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
    'DatePicker',
    <DatePicker
      label="Date"
      value="2026-10-14"
      valueLabel="14 Oct 2026"
      name="day"
      today="2026-10-16"
      isChanged
    />,
    (container) => {
      expect(container.querySelector('.date-picker-face')).toBeNull();
      const segments = [...container.querySelectorAll('.date-segment:not([data-type="literal"])')];
      expect(segments.map((segment) => segment.textContent)).toEqual(['10', '14', '2026']);
      // On an iPhone React Aria makes each segment a text box (useDateSegment.mjs:303-309).
      for (const segment of segments) expect(segment).toHaveAttribute('role', 'textbox');
      expect(segments[0]).toHaveAccessibleName(/Date$/);
      expect(container.querySelector('input[name="day"]')).toHaveValue('2026-10-14');
      expect(container.querySelector('.field-changed')).toHaveTextContent('Changed');
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
    // A static card with client leaves in its header's actions and a static list as its body.
    'Card with CardActions',
    <Card as="section" aria-labelledby="details-title">
      <CardHeader>
        <CardTitle id="details-title" level={3}>
          Details
        </CardTitle>
        <CardNote>Updated from your bank feed</CardNote>
        <CardActions>
          <Button variant="secondary" aria-label="Edit details">
            Edit
          </Button>
          <Link href="/accounts/visa/merge">Merge</Link>
        </CardActions>
      </CardHeader>
      <CardBody>
        <DescriptionList>
          <DescriptionListItem term="Name">Everyday Visa</DescriptionListItem>
        </DescriptionList>
      </CardBody>
    </Card>,
    (container) => {
      const actions = container.querySelector('.card-header > .card-actions');
      expect(actions?.previousElementSibling).toHaveClass('card-note');
      expect(actions?.querySelector('button')).toHaveAccessibleName('Edit details');
      expect(actions?.querySelector('a')).toHaveAttribute('href', '/accounts/visa/merge');
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
    // Static: the dash is inline style the server writes, so hydration changes nothing and nothing sweeps in.
    'Gauge',
    <Gauge
      label="Utilization"
      value={23}
      valueLabel="23% of your limit"
      figure="23%"
      marks={[
        { value: 10, label: 'Best under 10%' },
        { value: 30, label: 'Keep it under 30%' },
      ]}
    />,
    (container) => {
      const dial = container.querySelector('[role="meter"]');
      expect(dial).toHaveAccessibleName('Utilization');
      expect(dial).toHaveAccessibleDescription('Best under 10%. Keep it under 30%.');
      expect(container.querySelector<SVGElement>('.gauge-value')?.style.strokeDasharray).toBe(
        '55.586 276.46',
      );
      expect(container.querySelectorAll('.gauge-mark')).toHaveLength(2);
    },
  ],
  [
    'Gauge score',
    <Gauge
      label="Credit score"
      form="semicircle"
      size="lg"
      minValue={300}
      maxValue={850}
      value={742}
      valueLabel="742 of 850, Very good"
      figure="742"
      figureCaption="Very good"
      marks={[
        { value: 580, label: 'Fair from 580' },
        { value: 670, label: 'Good from 670' },
        { value: 740, label: 'Very good from 740' },
        { value: 800, label: 'Excellent from 800' },
      ]}
    />,
    (container) => {
      const dial = container.querySelector('[role="meter"]');
      expect(dial).toHaveAttribute('aria-valuenow', '742');
      expect(dial).toHaveAttribute('aria-valuetext', '742 of 850, Very good');
      expect(container.querySelector('.gauge-track')).toHaveAttribute('d', 'M6 80A74 74 0 0 1 154 80');
      expect(container.querySelector<SVGElement>('.gauge-value')?.style.strokeDasharray).toBe(
        '174.828 232.478',
      );
      expect(container.querySelector('.gauge-figure-caption')).toHaveTextContent('Very good');
    },
  ],
  [
    // Static: the summary is string joining of the app's words, so the browser writes the server's sentence.
    'MonthGrid',
    <MonthGrid
      label="Statement coverage"
      states={COVERAGE_STATES}
      years={COVERAGE_YEARS}
      monthLabels={SHORT_MONTHS}
      monthNames={MONTH_NAMES}
    />,
    (container) => {
      expect(container.querySelector('figure')).toHaveAccessibleName('Statement coverage');
      expect(container.querySelectorAll('.month-grid-cell')).toHaveLength(24);
      expect(container.querySelector('.month-grid-summary')).toHaveTextContent(
        'Missing: March and April 2025. Partial: June 2025.',
      );
      expect(container.querySelectorAll('.month-grid-table th[scope="row"]')).toHaveLength(2);
    },
  ],
  [
    'MonthGrid Persian',
    <div dir="rtl" lang="fa">
      <MonthGrid
        label="صورت‌حساب‌ها"
        states={PERSIAN_STATES}
        years={PERSIAN_YEARS}
        monthLabels={PERSIAN_SHORT_MONTHS}
        monthNames={PERSIAN_MONTH_NAMES}
        summary={PERSIAN_SUMMARY}
        labels={PERSIAN_LABELS}
      />
    </div>,
    (container) => {
      expect(container.querySelector('.month-grid-summary')).toHaveTextContent(PERSIAN_SUMMARY);
      expect(container.querySelector('.month-grid-year')).toHaveTextContent('۱۴۰۴');
      expect(container.querySelector('.month-grid-table th[scope="col"]')).toHaveTextContent('سال');
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
    'DataTable bulk actions as data, listBelow 32rem',
    <DataTable
      aria-label="Transactions"
      items={TRANSACTIONS.slice(0, 5)}
      columns={columnsWithTotal(TRANSACTIONS.slice(0, 5))}
      getKey={keyOf}
      onSortChange={noop}
      selectedKeys={['t1', 't3']}
      onSelectionChange={noop}
      listBelow="32rem"
      bulkActions={[
        { id: 'export', label: 'Export', isPromoted: true, onAction: noop },
        { id: 'delete', label: 'Delete', onAction: noop },
      ]}
      selectAllMatching={<Button variant="tertiary">Select all 1,240 matching</Button>}
    />,
    (container) => {
      expect(container.querySelector('.data-table')).toHaveAttribute('data-list-below', '32rem');
      const bar = container.querySelector('.data-table-bar');
      expect(bar?.querySelector('.data-table-bar-clear')).toHaveAttribute('aria-label', 'Clear selection');
      expect(bar?.querySelector('[data-action-id="export"]')).toHaveTextContent('Export');
      expect(bar?.querySelector('.data-table-bar-more')).toHaveAttribute('aria-label', 'More actions');
      expect(bar?.querySelector('.data-table-bar-select-all')).toHaveTextContent('Select all 1,240 matching');
    },
  ],
  [
    'Pagination with a page size picker',
    <Pagination
      page={3}
      pageCount={10}
      rangeLabel="51 to 75 of 240"
      onPageChange={noop}
      pageSize={25}
      onPageSizeChange={noop}
    />,
    (container) => {
      const select = container.querySelector('.pagination-size select');
      expect(select).toHaveValue('25');
      expect(select).toHaveAccessibleName('Rows per page');
      expect(container.querySelector('.pagination-page[aria-current="true"]')).toHaveTextContent('3');
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
  [
    // The zone's face is the server's: the group, both lines and the one button, now able to open the picker.
    'FileDropZone',
    <FileDropZone
      label="Receipts"
      description="PDF, JPG or PNG, up to 10 MB"
      acceptedFileTypes={['application/pdf', 'image/*']}
      allowsMultiple
      onFiles={noop}
    />,
    (container) => {
      const zone = container.querySelector('.file-drop-zone');
      expect(zone).toHaveAttribute('role', 'group');
      expect(zone).toHaveAccessibleName('Receipts');
      expect(container.querySelector('.file-drop-zone-hint')).toHaveTextContent('Drag files here or');
      expect(container.querySelectorAll('button')).toHaveLength(1);
      expect(container.querySelector('input[type="file"]')).toHaveAttribute(
        'accept',
        'application/pdf,image/*',
      );
    },
  ],
  [
    'FileButton',
    <FileButton acceptedFileTypes={['image/*']} capture="environment" onFiles={noop}>
      Take a photo
    </FileButton>,
    (container) => {
      expect(container.querySelector('button')).toHaveTextContent('Take a photo');
      expect(container.querySelector('input[type="file"]')).toHaveAttribute('capture', 'environment');
    },
  ],
  [
    // The rows are the server's, links and buttons included.
    'UploadList',
    <UploadList aria-label="Uploads" items={UPLOADS} onRetry={noop} onRemove={noop} onCancel={noop} />,
    (container) => {
      expect(container.querySelectorAll('.upload-row')).toHaveLength(6);
      expect(container.querySelector('a.upload-row-name')).toHaveAttribute('href', '/documents/lease');
      expect(container.querySelectorAll('[role="progressbar"]')).toHaveLength(2);
    },
  ],
  [
    // The host the server wrote, and the faces for items the server already knew; the offset waits for a face.
    'UploadTray',
    <UploadTray items={UPLOADS} />,
    (container) => {
      expect(container.querySelector('.upload-tray-status')).toHaveAttribute('role', 'status');
      expect(container.querySelector('.upload-tray-title')).toHaveTextContent('Uploading 4 of 6');
      expect(container.querySelector('.upload-tray-bar-button')).toHaveTextContent('Uploading 4 of 6');
    },
    viewport(1280),
  ],
  [
    // The bar, its sentence, its chip and its buttons are the server's; the status host stays empty, and the offset
    // waits for a measurement after hydration.
    'SaveBar',
    <SaveBar
      message="2 changes to Corner Mart, 14 Oct"
      isDirty
      actionLabel="Save"
      onAction={noop}
      onCancel={noop}
    />,
    (container) => {
      expect(container.querySelector('.save-bar')).toHaveAttribute('role', 'group');
      expect(container.querySelector('.save-bar-chip')).toHaveTextContent('Unsaved changes');
      expect(container.querySelector('.save-bar-status')).toBeEmptyDOMElement();
      expect([...container.querySelectorAll('button')].map((button) => button.textContent)).toEqual([
        'Cancel',
        'Save',
      ]);
    },
  ],
  [
    // Nothing is a collection, so nothing is drawn again: the server's real links, one per crumb above the current
    // page, which the stylesheet draws as either face, kept as they were.
    'Breadcrumbs in a PageHeader',
    <PageHeader
      title="Receipts, 2026"
      breadcrumbs={
        <Breadcrumbs>
          <Breadcrumb href="/">Home</Breadcrumb>
          <Breadcrumb href="/documents">Documents</Breadcrumb>
          <Breadcrumb>Receipts, 2026</Breadcrumb>
        </Breadcrumbs>
      }
    />,
    (container) => {
      expect([...container.querySelectorAll('a')].map((link) => link.getAttribute('href'))).toEqual([
        '/',
        '/documents',
      ]);
      expect(container.querySelector('.breadcrumbs-current')).toHaveAttribute('aria-current', 'page');
      expect(container.querySelector('h1')).toHaveTextContent('Receipts, 2026');
    },
  ],
  [
    // The server's button and empty status, kept as they were: nothing differs before a press.
    'CopyButton in a DescriptionList row',
    <DescriptionList>
      <DescriptionListItem
        term="Setup address"
        actions={
          <CopyButton value="https://hooks.example.com/ledger" labels={{ copy: 'Copy Setup address' }} />
        }
      >
        https://hooks.example.com/ledger
      </DescriptionListItem>
    </DescriptionList>,
    (container) => {
      expect(container.querySelector('.copy-button button')).toHaveAttribute(
        'aria-label',
        'Copy Setup address',
      );
      expect(container.querySelector('.copy-button-status')).toBeEmptyDOMElement();
      expect(container.querySelector('.copy-button')).not.toHaveAttribute('data-outcome');
    },
  ],
  [
    'CopyButton under an answer',
    <article>
      <div aria-busy="false">
        <p>Spending on food is down 12% this month.</p>
      </div>
      <footer>
        <CopyButton
          value="Spending on food is down 12% this month."
          look="button"
          labels={{ copy: 'Copy answer' }}
        />
      </footer>
    </article>,
    (container) => {
      expect(container.querySelector('footer .copy-button button')).toHaveTextContent('Copy answer');
      expect(container.querySelector('.copy-button-status')).toBeEmptyDOMElement();
    },
  ],
  [
    // The server's offers and empty status, kept as they were: nothing is read before a take.
    'FieldExtras on a money field',
    <FieldExtras
      fieldLabel="Cushion"
      suggestion={{ value: '$2,340', reason: 'a month of your fixed bills', isCurrent: false, onTake: noop }}
      defaultOffer={{ value: '$1,000', isCurrent: false, onTake: noop }}
    >
      <NumberField label="Cushion" money={{ symbol: '$' }} value={50000} />
    </FieldExtras>,
    (container) => {
      expect(
        [...container.querySelectorAll('.field-offer')].map((line) => line.getAttribute('data-kind')),
      ).toEqual(['suggestion', 'default']);
      const use = container.querySelector('.field-offer[data-kind="suggestion"] button');
      expect(use).toHaveAccessibleName('Use, Cushion');
      expect(use).toHaveAccessibleDescription('Suggested: $2,340, a month of your fixed bills');
      expect(container.querySelector('.field-extras-status')).toBeEmptyDOMElement();
    },
  ],
  [
    // Hidden on the server, hidden after hydration, and no focus moved: the group moves focus only on a change.
    'ConditionalFields hidden',
    <form>
      <Switch isSelected={false} aria-controls="logo-fields">
        Show bank logos
      </Switch>
      <ConditionalFields id="logo-fields" isShown={false}>
        <Select label="Provider" name="logoProvider" defaultValue="northwind">
          <PickerOption id="northwind">Northwind Logos</PickerOption>
          <PickerOption id="fabrikam">Fabrikam Marks</PickerOption>
        </Select>
        <TextField label="API key" name="logoKey" type="password" />
      </ConditionalFields>
    </form>,
    (container) => {
      const group = container.querySelector('fieldset.conditional-fields');
      for (const name of ['hidden', 'inert', 'disabled', 'data-hidden']) expect(group).toHaveAttribute(name);
      expect(document.activeElement).toBe(document.body);
    },
  ],
  [
    'ConditionalFields shown',
    <form>
      <Switch isSelected aria-controls="logo-fields">
        Show bank logos
      </Switch>
      <ConditionalFields id="logo-fields" isShown>
        <TextField label="API key" name="logoKey" type="password" />
      </ConditionalFields>
    </form>,
    (container) => {
      const group = container.querySelector('fieldset.conditional-fields');
      for (const name of ['hidden', 'inert', 'disabled', 'data-hidden'])
        expect(group).not.toHaveAttribute(name);
    },
  ],
  [
    // The index: both faces as the server drew them, Coach drawn current by data-default, and no focus moved.
    'PanelLayout at the index',
    settingsPage('index'),
    (container) => {
      expect(container.querySelector('.panel-layout')).toHaveAttribute('data-view', 'index');
      expect(container.querySelector('[aria-current]')).toBeNull();
      expect(container.querySelector('.panel-nav-link[data-default]')).toHaveAttribute(
        'href',
        '/settings/coach',
      );
      expect(document.activeElement).toBe(document.body);
    },
  ],
  [
    // A section: its link current, the region named by its heading, and no focus moved on hydration.
    'PanelLayout at a section',
    settingsPage('section', 'logos'),
    (container) => {
      expect(container.querySelector('[aria-current="page"]')).toHaveAttribute('href', '/settings/logos');
      const region = container.querySelector('section.panel-section');
      const heading = container.querySelector('.panel-section-heading');
      expect(region).toHaveAttribute('aria-labelledby', heading?.id);
      expect(document.activeElement).toBe(document.body);
    },
  ],
  [
    // The given choice, as the server drew it, and nothing written to the page.
    'ThemeSwitch at light',
    <ThemeSwitch value="light" onChange={() => undefined} />,
    (container) => {
      expect(container.querySelector('input[value="light"]')).toBeChecked();
      expect(container.querySelectorAll('input:checked')).toHaveLength(1);
      expect(document.documentElement).not.toHaveAttribute('data-theme');
    },
  ],
  [
    // The full trigger in an expanded rail, named by the visible name and described by the detail.
    'AccountMenu in an expanded rail',
    accountRail(false),
    (container) => {
      const trigger = container.querySelector('.sidebar:not(.sidebar-drawer) .account-menu-trigger');
      expect(trigger).not.toHaveAttribute('data-compact');
      expect(trigger).toHaveAccessibleName('Ada Lovelace');
      expect(trigger).toHaveAccessibleDescription('ada@example.com');
      expect(document.querySelector('[role="menu"]')).toBeNull();
    },
  ],
  [
    // The compact trigger the server drew from the rail's cookie stays compact.
    'AccountMenu in a collapsed rail',
    accountRail(true),
    (container) => {
      const trigger = container.querySelector('.sidebar:not(.sidebar-drawer) .account-menu-trigger');
      expect(trigger).toHaveAttribute('data-compact');
      expect(trigger).toHaveAccessibleName('Ada Lovelace');
    },
  ],
  [
    // Static: nothing is drawn again, so the report and its region are the server's elements, as they were.
    'Prose with a wide table',
    <Prose as="article">
      <h2>October</h2>
      <p>
        You spent <strong>$3,284.10</strong>, and <span className="prose-unlinked">your transactions</span>{' '}
        are listed below.
      </p>
      <ProseScroll aria-label="Spending by category, table">
        <table>
          <tbody>
            <tr>
              <th scope="row">Rent</th>
              <td>$1,450.00</td>
            </tr>
          </tbody>
        </table>
      </ProseScroll>
    </Prose>,
    (container) => {
      expect(container.querySelector('article')).toHaveClass('prose');
      const region = container.querySelector('.prose-scroll');
      expect(region).toHaveAttribute('role', 'region');
      expect(region).toHaveAttribute('tabindex', '0');
      expect(region).toHaveAttribute('aria-label', 'Spending by category, table');
    },
  ],
  [
    // Every row as the server drew it, and no focus moved and nothing said: the Repeater moves focus only after
    // an add or a remove.
    'Repeater three tiers',
    <ServerTiers rows={DEFAULT_TIERS} />,
    (container) => {
      expect(container.querySelectorAll('li.repeater-row')).toHaveLength(3);
      expect(container.querySelector('.repeater-status')).toBeEmptyDOMElement();
      expect(document.activeElement).toBe(document.body);
    },
  ],
  [
    'Repeater empty',
    <ServerTiers rows={[]} />,
    (container) => {
      expect(container.querySelector('.repeater-empty')).toHaveTextContent(
        'No tiers. The coach never waits.',
      );
      expect(document.activeElement).toBe(document.body);
    },
  ],
  [
    // The state the server drew, the marker kept, the transitions held off until two frames after hydration, and
    // no focus moved.
    'Accordion',
    <ServerSections />,
    (container) => {
      const items = [...container.querySelectorAll('.accordion-item')];
      expect(items.map((item) => item.hasAttribute('data-expanded'))).toEqual([true, false, false]);
      expect(items.every((item) => item.hasAttribute('data-instant'))).toBe(true);
      expect(container.querySelector('.accordion-marker')).not.toBeNull();
      const folds = [...container.querySelectorAll('.accordion-fold')].map((fold) => fold.id);
      expect(container.querySelector('.accordion-expand-all')).toHaveAttribute(
        'aria-controls',
        folds.join(' '),
      );
      expect(document.activeElement).toBe(document.body);
    },
  ],
  [
    // The tags, the hidden inputs and the count the server drew, no focus moved and nothing said.
    'TagInput',
    <ServerInvite />,
    (container) => {
      expect([...container.querySelectorAll('.tag-input-tag-text')].map((tag) => tag.textContent)).toEqual([
        'ana@example.com',
        'bo@example.com',
      ]);
      expect(
        [...container.querySelectorAll<HTMLInputElement>('input[type="hidden"]')].map((input) => input.value),
      ).toEqual(['ana@example.com', 'bo@example.com']);
      expect(container.querySelector('.field-counter')).toHaveTextContent('2/10');
      expect(container.querySelector('.tag-input-status')).toBeEmptyDOMElement();
      expect(document.activeElement).toBe(document.body);
    },
  ],
  [
    'TagInput empty',
    <ServerInvite values={[]} />,
    (container) => {
      expect(
        [...container.querySelectorAll<HTMLInputElement>('input[type="hidden"]')].map((input) => input.value),
      ).toEqual(['']);
      expect(container.querySelector('.tag-input-tag')).toBeNull();
    },
  ],
  [
    // The cards, the second chosen, each radio named by its title and described by its sentence then its detail.
    'ChoiceCards',
    <ServerPlans />,
    (container) => {
      const radios = [...container.querySelectorAll<HTMLInputElement>('input[type="radio"]')];
      expect(radios.map((radio) => radio.checked)).toEqual([false, true, false]);
      expect(container.querySelector('label.choice-card[data-selected]')?.textContent).toContain('Yearly');
      for (const radio of radios) {
        const title = document.getElementById(radio.getAttribute('aria-labelledby') ?? '');
        expect(title).toHaveClass('choice-card-title');
        const [sentence, detail] = (radio.getAttribute('aria-describedby') ?? '').split(' ');
        expect(document.getElementById(sentence ?? '')).toHaveClass('choice-card-description');
        expect(document.getElementById(detail ?? '')).toHaveClass('choice-card-detail');
      }
      expect(document.activeElement).toBe(document.body);
    },
  ],
  [
    'ChoiceCards grid of icons',
    <ServerThemes />,
    (container) => {
      expect(container.querySelectorAll('.choice-card-media[data-media="icon"] svg')).toHaveLength(3);
      expect(container.querySelector<HTMLInputElement>('input[value="dark"]')?.checked).toBe(true);
    },
  ],
  [
    'Accordion, one at a time',
    <ServerSections multiple={false} />,
    (container) => {
      expect(container.querySelector('.accordion')).not.toHaveAttribute('data-multiple');
      expect(container.querySelector('.accordion-controls')).toBeNull();
      expect(container.querySelectorAll('.accordion-item[data-expanded]')).toHaveLength(1);
    },
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
