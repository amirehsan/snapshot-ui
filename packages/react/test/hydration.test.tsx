import { act } from '@testing-library/react';
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
import { PickerOption } from '../src/picker';
import { SaveBar } from '../src/save-bar';
import { SearchField } from '../src/search-field';
import { SidePanel, SidePanelLayout } from '../src/side-panel';
import { UploadList, UploadTray, type UploadItem } from '../src/upload-tray';
import { columnsWithTotal, groupOf, hrefOf, keyOf, TRANSACTIONS } from '../src/stories/transactions';

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
