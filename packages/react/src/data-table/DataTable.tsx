'use client';

import { useMemo, type ReactElement, type ReactNode, type Ref } from 'react';
import type { Key } from 'react-aria-components';
import type { AriaName } from '../utils/accessible-name';
import { cx } from '../utils/cx';
import { present } from '../utils/present';
import { useWarnOnce } from '../utils/useWarnOnce';
import { DataTableStatus } from './DataTableStatus';
import { handleTableKey } from './keys';
import { rowHeaderOf, textOf } from './rows';
import { TableFace, type FaceRow } from './TableFace';

export interface DataTableColumn<T> {
  /** Unique; the sort descriptor's `column`. `__selection` is reserved. */
  id: string;
  /** The header's text, and its name. */
  header: string;
  /** The cell for a row: a string or any node. */
  cell: (item: T) => ReactNode;
  /** The row's name when the row header's cell is not a string. */
  textValue?: (item: T) => string;
  /** Exactly one column is the row header. @default the first column */
  isRowHeader?: boolean;
  /** 'end' sets figures: tabular, unbroken, at the line's end in either direction. @default 'start' */
  align?: 'start' | 'end';
  /** The header is a button that sorts by this column: ascending, then descending. */
  allowsSorting?: boolean;
  /** A CSS width for the column, written on its header cell: '8rem', '20%'. @default shares what is left */
  width?: string;
  /**
   * The column leaves the table face when DataTable's own box is narrower than 48rem ('md') or 40rem ('sm').
   * Container widths, not breakpoints. The row header never leaves.
   */
  hideBelow?: 'sm' | 'md';
  /** The totals row's cell for this column. */
  total?: ReactNode;
}

export interface DataTableLabels {
  /** The status while loading. @default 'Loading' */
  loading: string;
  /** The totals row's header cell. @default 'Total' */
  total: string;
}

export interface DataTableBaseProps<T> {
  /** The rows, in the order to draw them. */
  items: readonly T[];
  /** The columns, in the order to draw them. */
  columns: readonly DataTableColumn<T>[];
  /** Each row's key, stable across renders. `__total` is reserved. */
  getKey: (item: T) => Key;
  /** The row's detail, a URL the router opens (ruling 2). Rows without one do not open. */
  getRowHref?: (item: T) => string;
  /** The row whose detail is open: its link is aria-current and the row draws the current bar. */
  currentKey?: Key | null;
  /** Controlled from the URL: the column's id and its direction. */
  sortDescriptor?: { column: string; direction: 'ascending' | 'descending' };
  /** Called with the next sort when a sortable header is pressed: ascending, or descending when it was ascending. */
  onSortChange?: (sort: { column: string; direction: 'ascending' | 'descending' }) => void;
  /** Rows that can neither be selected nor opened; they draw in taupe. */
  disabledKeys?: readonly Key[];
  /** Shows skeleton rows while there are no items, and marks the table busy (ruling 9). */
  isLoading?: boolean;
  /** @default 8 */
  loadingRowCount?: number;
  /** The empty body: an EmptyState, or any node. */
  emptyState?: ReactNode;
  /** The words the table writes itself, each with an English default. */
  labels?: Partial<DataTableLabels>;
  /** Merged after the library's class on the root. */
  className?: string;
  ref?: Ref<HTMLDivElement>;
}

/** DataTable's props: a name is required, from `aria-label` or `aria-labelledby` (spec correction 21). */
export type DataTableProps<T> = DataTableBaseProps<T> & AriaName;

const DEFAULT_LABELS: DataTableLabels = { loading: 'Loading', total: 'Total' };

/** The first key that repeats, or null. */
function repeatedKey(keys: readonly Key[]): Key | null {
  const seen = new Set<Key>();
  for (const key of keys) {
    if (seen.has(key)) return key;
    seen.add(key);
  }
  return null;
}

/**
 * Rows of data: a grid with sortable columns, a row header that links to the row's detail, a sticky header,
 * columns of figures at the line's end, columns that leave where the table's box is narrow, a totals row, and
 * an empty and a loading body. Every cell and string is the app's; the sort and the open row are controlled.
 * Built on React Aria's Table. Render it from a client component: its props are functions.
 */
export function DataTable<T>(props: DataTableProps<T>): ReactElement {
  const {
    items,
    columns,
    getKey,
    getRowHref,
    currentKey,
    sortDescriptor,
    onSortChange,
    disabledKeys,
    isLoading = false,
    loadingRowCount = 8,
    emptyState,
    labels,
    className,
    ref,
  } = props;
  const words = { ...DEFAULT_LABELS, ...labels };
  const rowHeader = rowHeaderOf(columns);
  const rows: FaceRow<T>[] = items.map((value) => ({
    key: getKey(value),
    value,
    text: textOf(value, rowHeader),
    href: getRowHref?.(value),
  }));
  const disabled = useMemo(() => new Set<Key>(disabledKeys ?? []), [disabledKeys]);

  const marked = columns.filter((column) => column.isRowHeader === true);
  useWarnOnce(
    marked.length > 1
      ? `DataTable: ${String(marked.length)} columns are marked isRowHeader; only one can be. "${marked[0]?.id ?? ''}" is the row header.`
      : null,
  );
  useWarnOnce(
    rowHeader?.hideBelow === undefined
      ? null
      : `DataTable: the row header "${rowHeader.id}" never leaves the table, so its hideBelow is ignored.`,
  );
  useWarnOnce(
    sortDescriptor !== undefined && !columns.some((column) => column.id === sortDescriptor.column)
      ? `DataTable: sortDescriptor names "${sortDescriptor.column}", which is no column's id.`
      : null,
  );
  const repeated = repeatedKey(rows.map((row) => row.key));
  useWarnOnce(
    repeated === null
      ? null
      : `DataTable: getKey gives "${String(repeated)}" to more than one row; every row needs a key of its own.`,
  );
  useWarnOnce(
    items.length === 0 && !isLoading && !present(emptyState)
      ? 'DataTable: the table has no rows and no emptyState. Pass an EmptyState that says what is missing.'
      : null,
  );

  return (
    // The capture handler takes keys before React Aria's grid does (spec 7.2): a capture listener, which
    // jsx-a11y does not read, so the root needs no role of its own.
    <div ref={ref} className={cx('data-table', className)} onKeyDownCapture={handleTableKey}>
      {/* Busy while loading. The status sits outside the busy part and stays mounted, so it is heard. */}
      <div className="data-table-grid" aria-busy={isLoading ? 'true' : undefined}>
        <TableFace
          aria-label={props['aria-label']}
          aria-labelledby={props['aria-labelledby']}
          rows={rows}
          columns={columns}
          rowHeader={rowHeader}
          currentKey={currentKey}
          sortDescriptor={sortDescriptor}
          onSortChange={onSortChange}
          disabledKeys={disabled}
          isLoading={isLoading && items.length === 0}
          loadingRowCount={loadingRowCount}
          emptyState={emptyState}
          totalLabel={words.total}
          loadingLabel={words.loading}
        />
      </div>
      <DataTableStatus message={isLoading ? words.loading : ''} />
    </div>
  );
}
