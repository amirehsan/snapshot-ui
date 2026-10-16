'use client';

import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';
import {
  useCallback,
  useContext,
  useEffect,
  type CSSProperties,
  type ReactElement,
  type ReactNode,
} from 'react';
import {
  Cell,
  Column,
  Row,
  Table,
  TableBody,
  TableFooter,
  TableHeader,
  TableStateContext,
  type Key,
  type Selection,
  type TableState,
} from 'react-aria-components';
import { Checkbox } from '../checkbox/Checkbox';
import { Link } from '../link/Link';
import { Skeleton } from '../skeleton/Skeleton';
import { present } from '../utils/present';
import { usePressAcrossRedraw } from '../utils/press-across-redraw';
import type { DataTableBaseProps, DataTableColumn } from './DataTable';
import { skeletonWidth } from './rows';

/** One row of the table face, its key, text and link worked out once. */
export interface FaceRow<T> {
  key: Key;
  value: T;
  text: string;
  href: string | undefined;
}

type Sort = NonNullable<DataTableBaseProps<unknown>['sortDescriptor']>;

/** React Aria's selection manager for the table, which DataTable's keys reach for X and Shift. */
export type FaceSelectionManager = TableState<unknown>['selectionManager'];

/** Selection on the table face: React Aria's, with the library's checkbox column first. */
export interface FaceSelection {
  /** The selected keys, or React Aria's own selection when it holds the same keys, which keeps its anchor. */
  selectedKeys: Iterable<Key>;
  onChange: (selection: Selection) => void;
  selectAllLabel: string;
  selectLabel: string;
  /** Receives React Aria's selection manager once the table has one, and null when it goes. */
  onManager: (manager: FaceSelectionManager | null) => void;
}

/**
 * Out of the tab order: the table is one tab stop, the row or cell React Aria last focused, and the arrows reach
 * everything in it (spec 7.2). React Aria focuses a cell's link or checkbox with the arrows all the same, and a
 * pointer, a middle click and the context menu are the link's as before. React Aria's Link takes it through its
 * props, though its type does not name it, so it is spread.
 */
export const UNTABBED = { excludeFromTabOrder: true } as const;

export interface TableFaceProps<T> {
  'aria-label'?: string;
  'aria-labelledby'?: string;
  rows: readonly FaceRow<T>[];
  columns: readonly DataTableColumn<T>[];
  rowHeader: DataTableColumn<T> | undefined;
  currentKey: Key | null | undefined;
  sortDescriptor: Sort | undefined;
  onSortChange: ((sort: Sort) => void) | undefined;
  disabledKeys: ReadonlySet<Key>;
  disabledBehavior: 'selection' | 'all';
  selection: FaceSelection | undefined;
  isLoading: boolean;
  loadingRowCount: number;
  emptyState: ReactNode;
  totalLabel: string;
  loadingLabel: string;
}

/** The figure span for an end-aligned column, so its digits are tabular, unbroken and an isolated run. */
export const figure = (column: DataTableColumn<unknown>, content: ReactNode): ReactNode =>
  column.align === 'end' ? <span className="data-table-figure">{content}</span> : content;

/** A cell's content clamped to two lines, for a column that wraps; figures never wrap. */
const wrapped = (column: DataTableColumn<unknown>, content: ReactNode): ReactNode =>
  column.overflow === 'wrap' && column.align !== 'end' ? (
    <span className="data-table-wrap">{content}</span>
  ) : (
    content
  );

/** `data-overflow` for a column that wraps. */
const overflowOf = (column: DataTableColumn<unknown>): 'wrap' | undefined =>
  column.overflow === 'wrap' && column.align !== 'end' ? 'wrap' : undefined;

/** `data-hide-below` for a column, never on the row header (ruling 6). */
const hideBelowOf = <T,>(column: DataTableColumn<T>, rowHeader: DataTableColumn<T> | undefined) =>
  column === rowHeader ? undefined : column.hideBelow;

/** The sort mark: up for ascending, down for descending, and up-down in slate on a sortable column at rest. */
function SortMark({ direction }: { direction: 'ascending' | 'descending' | undefined }): ReactElement {
  return (
    <span className="data-table-sort" aria-hidden="true">
      {direction === 'ascending' ? <ArrowUp /> : direction === 'descending' ? <ArrowDown /> : <ArrowUpDown />}
    </span>
  );
}

/**
 * The select-all checkbox in the checkbox column's header. It also hands DataTable React Aria's selection manager
 * from the table's state, which it can read from here, so X toggles as Space does and Shift past a hidden cell
 * extends as React Aria does.
 */
function SelectAll({
  label,
  onManager,
}: {
  label: string;
  onManager: (manager: FaceSelectionManager | null) => void;
}): ReactElement {
  const manager = useContext(TableStateContext)?.selectionManager ?? null;
  useEffect(() => {
    onManager(manager);
    return () => {
      onManager(null);
    };
  }, [manager, onManager]);
  return <Checkbox slot="selection" aria-label={label} {...UNTABBED} />;
}

interface TableRowProps<T> {
  row: FaceRow<T>;
  columns: readonly DataTableColumn<T>[];
  rowHeader: DataTableColumn<T> | undefined;
  isCurrent: boolean;
  /** Whether the row can neither be focused nor opened: disabled, with disabledBehavior 'all'. */
  isDisabled: boolean;
  /** The row checkbox's name, before React Aria adds the row's; undefined while selection is off. */
  selectLabel: string | undefined;
}

/** One row of the table face. Cells are static children, one per column, keyed by the column's id. */
function TableRow<T>({
  row,
  columns,
  rowHeader,
  isCurrent,
  isDisabled,
  selectLabel,
}: TableRowProps<T>): ReactElement {
  const hasLink = row.href !== undefined && !isDisabled;
  // React Aria draws every row again after hydration, so a press on the link that began before is followed.
  const press = usePressAcrossRedraw<HTMLAnchorElement>('[role="grid"]');
  return (
    <Row
      id={row.key}
      textValue={row.text}
      className="data-table-row"
      // React Aria passes data-* to the tr and drops aria-current (spec correction 2).
      data-link={hasLink ? '' : undefined}
      data-current={isCurrent ? '' : undefined}
    >
      {selectLabel === undefined ? null : (
        <Cell className="data-table-cell" data-selection="">
          {/* React Aria names it by its own label and the row header (spec correction 5): "Select Corner Mart". */}
          <Checkbox slot="selection" aria-label={selectLabel} {...UNTABBED} />
        </Cell>
      )}
      {columns.map((column) => {
        const unknown = column as DataTableColumn<unknown>;
        const body = figure(unknown, column.cell(row.value));
        return (
          <Cell
            key={column.id}
            className="data-table-cell"
            data-align={column.align === 'end' ? 'end' : undefined}
            data-overflow={overflowOf(unknown)}
            data-hide-below={hideBelowOf(column, rowHeader)}
          >
            {wrapped(
              unknown,
              column === rowHeader && hasLink ? (
                <Link
                  href={row.href}
                  className="data-table-link"
                  aria-current={isCurrent ? 'true' : undefined}
                  {...UNTABBED}
                  {...press}
                >
                  {body}
                </Link>
              ) : (
                body
              ),
            )}
          </Cell>
        );
      })}
    </Row>
  );
}

/** `count` skeleton rows in React Aria's one empty cell, a flex row of one line per column (spec correction 4). */
function SkeletonRows<T>({
  count,
  columns,
  rowHeader,
  label,
  selectable,
}: {
  count: number;
  columns: readonly DataTableColumn<T>[];
  rowHeader: DataTableColumn<T> | undefined;
  label: string;
  /** Draws the checkbox column's 3.5rem blank first. */
  selectable: boolean;
}): ReactElement {
  return (
    <>
      {/* React Aria's empty cell is a row header, so it holds the loading words, hidden from sight. */}
      <span className="data-table-loading">{label}</span>
      {Array.from({ length: count }, (_, row) => (
        <div key={row} className="data-table-skeleton-row">
          {selectable ? <span className="data-table-skeleton-cell" data-selection="" /> : null}
          {columns.map((column, index) => (
            <span
              key={column.id}
              className="data-table-skeleton-cell"
              data-align={column.align === 'end' ? 'end' : undefined}
              data-hide-below={hideBelowOf(column, rowHeader)}
              style={column.width === undefined ? undefined : { flexBasis: column.width, flexGrow: 0 }}
            >
              <Skeleton width={skeletonWidth(row, index)} />
            </span>
          ))}
        </div>
      ))}
    </>
  );
}

/**
 * The table face: React Aria's Table drawing the columns, the rows, the totals and the empty or loading body.
 * Private to DataTable, which works out the rows and the row header and holds the warnings.
 */
export function TableFace<T>({
  rows,
  columns,
  rowHeader,
  currentKey,
  sortDescriptor,
  onSortChange,
  disabledKeys,
  disabledBehavior,
  selection,
  isLoading,
  loadingRowCount,
  emptyState,
  totalLabel,
  loadingLabel,
  ...name
}: TableFaceProps<T>): ReactElement {
  const hasTotals = rows.length > 0 && columns.some((column) => present(column.total));
  // React Aria writes aria-selected="false" on every row while selection is on, the totals row's too, which is
  // never selected; the attribute leaves it once it is drawn, and again whenever selection turns on.
  const selectable = selection !== undefined;
  const unselectable = useCallback(
    (row: HTMLTableRowElement | null) => {
      if (selectable) row?.removeAttribute('aria-selected');
    },
    [selectable],
  );
  return (
    <Table
      {...name}
      className="data-table-table"
      selectionMode={selection === undefined ? undefined : 'multiple'}
      selectionBehavior="toggle"
      selectedKeys={selection?.selectedKeys}
      onSelectionChange={selection?.onChange}
      sortDescriptor={sortDescriptor}
      onSortChange={
        onSortChange === undefined
          ? undefined
          : (sort) => {
              const column = String(sort.column);
              // A column's first press takes its firstSortDirection; each later press flips it (ruling 12).
              const first = columns.find((each) => each.id === column)?.firstSortDirection;
              const direction =
                sortDescriptor?.column !== column && first !== undefined ? first : sort.direction;
              onSortChange({ column, direction });
            }
      }
      disabledKeys={disabledKeys}
      disabledBehavior={disabledBehavior}
    >
      <TableHeader className="data-table-header">
        {selection === undefined ? null : (
          <Column
            id="__selection"
            textValue={selection.selectAllLabel}
            className="data-table-column"
            data-selection=""
          >
            <SelectAll label={selection.selectAllLabel} onManager={selection.onManager} />
          </Column>
        )}
        {columns.map((column) => (
          <Column
            key={column.id}
            id={column.id}
            isRowHeader={column === rowHeader}
            allowsSorting={column.allowsSorting === true}
            textValue={column.header}
            className="data-table-column"
            data-align={column.align === 'end' ? 'end' : undefined}
            data-hide-below={hideBelowOf(column, rowHeader)}
            data-header-hidden={column.isHeaderHidden === true ? '' : undefined}
            // React Aria's width acts only in a resizable container (spec correction 1), so the header cell
            // carries it, as a property the stylesheet can set to zero when the column leaves.
            style={
              column.width === undefined
                ? undefined
                : ({ '--data-table-column-width': column.width } as CSSProperties)
            }
          >
            {({ sortDirection }) => (
              <span className="data-table-column-inner">
                <span className="data-table-column-label">{column.header}</span>
                {column.allowsSorting === true ? <SortMark direction={sortDirection} /> : null}
              </span>
            )}
          </Column>
        ))}
      </TableHeader>
      <TableBody
        className="data-table-body"
        renderEmptyState={() =>
          isLoading ? (
            <SkeletonRows
              count={loadingRowCount}
              columns={columns}
              rowHeader={rowHeader}
              label={loadingLabel}
              selectable={selection !== undefined}
            />
          ) : present(emptyState) ? (
            emptyState
          ) : null
        }
      >
        {rows.map((row) => (
          <TableRow
            key={row.key}
            row={row}
            columns={columns}
            rowHeader={rowHeader}
            isCurrent={currentKey !== undefined && currentKey !== null && row.key === currentKey}
            isDisabled={disabledBehavior === 'all' && disabledKeys.has(row.key)}
            selectLabel={selection?.selectLabel}
          />
        ))}
      </TableBody>
      {hasTotals ? (
        <TableFooter className="data-table-footer">
          {/* A row of the grid, reached by the arrows, never selected and never opened (spec correction 3). */}
          <Row
            ref={unselectable}
            id="__total"
            isDisabled
            disabledBehavior="selection"
            textValue={totalLabel}
            className="data-table-row"
          >
            {selection === undefined ? null : <Cell className="data-table-cell" data-selection="" />}
            {columns.map((column) => {
              const own = present(column.total) ? column.total : null;
              const content = own ?? (column === rowHeader ? totalLabel : null);
              return (
                <Cell
                  key={column.id}
                  className="data-table-cell"
                  data-align={column.align === 'end' ? 'end' : undefined}
                  data-hide-below={hideBelowOf(column, rowHeader)}
                >
                  {content === null ? null : figure(column as DataTableColumn<unknown>, content)}
                </Cell>
              );
            })}
          </Row>
        </TableFooter>
      ) : null}
    </Table>
  );
}
