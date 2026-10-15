'use client';

import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';
import type { ReactElement, ReactNode } from 'react';
import {
  Cell,
  Column,
  Row,
  Table,
  TableBody,
  TableFooter,
  TableHeader,
  type Key,
} from 'react-aria-components';
import { Link } from '../link/Link';
import { Skeleton } from '../skeleton/Skeleton';
import { present } from '../utils/present';
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
  isLoading: boolean;
  loadingRowCount: number;
  emptyState: ReactNode;
  totalLabel: string;
  loadingLabel: string;
}

/** The figure span for an end-aligned column, so its digits are tabular, unbroken and an isolated run. */
const figure = (column: DataTableColumn<unknown>, content: ReactNode): ReactNode =>
  column.align === 'end' ? <span className="data-table-figure">{content}</span> : content;

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

interface TableRowProps<T> {
  row: FaceRow<T>;
  columns: readonly DataTableColumn<T>[];
  rowHeader: DataTableColumn<T> | undefined;
  isCurrent: boolean;
  isDisabled: boolean;
}

/** One row of the table face. Cells are static children, one per column, keyed by the column's id. */
function TableRow<T>({ row, columns, rowHeader, isCurrent, isDisabled }: TableRowProps<T>): ReactElement {
  const hasLink = row.href !== undefined && !isDisabled;
  return (
    <Row
      id={row.key}
      textValue={row.text}
      className="data-table-row"
      // React Aria passes data-* to the tr and drops aria-current (spec correction 2).
      data-link={hasLink ? '' : undefined}
      data-current={isCurrent ? '' : undefined}
    >
      {columns.map((column) => {
        const body = figure(column as DataTableColumn<unknown>, column.cell(row.value));
        return (
          <Cell
            key={column.id}
            className="data-table-cell"
            data-align={column.align === 'end' ? 'end' : undefined}
            data-hide-below={hideBelowOf(column, rowHeader)}
          >
            {column === rowHeader && hasLink ? (
              <Link href={row.href} className="data-table-link" aria-current={isCurrent ? 'true' : undefined}>
                {body}
              </Link>
            ) : (
              body
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
}: {
  count: number;
  columns: readonly DataTableColumn<T>[];
  rowHeader: DataTableColumn<T> | undefined;
  label: string;
}): ReactElement {
  return (
    <>
      {/* React Aria's empty cell is a row header, so it holds the loading words, hidden from sight. */}
      <span className="data-table-loading">{label}</span>
      {Array.from({ length: count }, (_, row) => (
        <div key={row} className="data-table-skeleton-row">
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
  isLoading,
  loadingRowCount,
  emptyState,
  totalLabel,
  loadingLabel,
  ...name
}: TableFaceProps<T>): ReactElement {
  const hasTotals = rows.length > 0 && columns.some((column) => present(column.total));
  return (
    <Table
      {...name}
      className="data-table-table"
      sortDescriptor={sortDescriptor}
      onSortChange={
        onSortChange === undefined
          ? undefined
          : (sort) => {
              onSortChange({ column: String(sort.column), direction: sort.direction });
            }
      }
      disabledKeys={disabledKeys}
    >
      <TableHeader className="data-table-header">
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
            // React Aria's width acts only in a resizable container (spec correction 1).
            style={column.width === undefined ? undefined : { width: column.width }}
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
            isDisabled={disabledKeys.has(row.key)}
          />
        ))}
      </TableBody>
      {hasTotals ? (
        <TableFooter className="data-table-footer">
          {/* A row of the grid, reached by the arrows, never selected and never opened (spec correction 3). */}
          <Row
            id="__total"
            isDisabled
            disabledBehavior="selection"
            textValue={totalLabel}
            className="data-table-row"
          >
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
