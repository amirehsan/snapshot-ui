'use client';

import { Check } from 'lucide-react';
import { useEffect, useState, type ReactElement, type ReactNode } from 'react';
import {
  GridList,
  GridListHeader,
  GridListItem,
  GridListSection,
  type Key,
  type ListState,
  type Selection,
} from 'react-aria-components';
import { Button } from '../button/Button';
import { Checkbox } from '../checkbox/Checkbox';
import { Link } from '../link/Link';
import { Skeleton } from '../skeleton/Skeleton';
import { present } from '../utils/present';
import type { DataTableColumn } from './DataTable';
import type { RowGroup } from './groups';
import { figure, UNTABBED, type FaceRow } from './TableFace';

/** React Aria's selection manager for the list, which DataTable's keys reach for X and Shift there. */
export type ListSelectionManager = ListState<unknown>['selectionManager'];

/** Selection on the list face: React Aria's, with the library's own select-all above the list. */
export interface ListSelection {
  /** The selected keys, as the table face is given them. */
  selectedKeys: Iterable<Key>;
  onChange: (selection: Selection) => void;
  /** Whether every enabled row is selected, some are, or none: the select-all box's state. */
  all: 'all' | 'some' | 'none';
  /** Selects every enabled row, or none, as the table's select-all does. */
  onSelectAll: (select: boolean) => void;
  selectAllLabel: string;
  selectLabel: string;
  /** The button that shows the boxes, and the same button while they show. */
  selectItemsLabel: string;
  doneLabel: string;
  /** Receives React Aria's selection manager for the list once it has one, and null when it goes. */
  onManager: (manager: ListSelectionManager | null) => void;
}

/** Where a column's cell goes in a list item: its `listSlot`, or the title for the row header and hidden else. */
type Slot = NonNullable<DataTableColumn<unknown>['listSlot']>;

const slotOf = <T,>(column: DataTableColumn<T>, rowHeader: DataTableColumn<T> | undefined): Slot =>
  column.listSlot ?? (column === rowHeader ? 'title' : 'hidden');

/** `data-overflow` for a line whose columns include one that wraps; figures never wrap. */
const lineOverflow = <T,>(columns: readonly DataTableColumn<T>[]): 'wrap' | undefined =>
  columns.some((column) => column.overflow === 'wrap' && column.align !== 'end') ? 'wrap' : undefined;

export interface ListFaceProps<T> {
  'aria-label'?: string;
  'aria-labelledby'?: string;
  rows: readonly FaceRow<T>[];
  /** The rows in their runs of one group, or one ungrouped run. */
  groups: readonly RowGroup<FaceRow<T>>[];
  columns: readonly DataTableColumn<T>[];
  rowHeader: DataTableColumn<T> | undefined;
  currentKey: Key | null | undefined;
  disabledKeys: ReadonlySet<Key>;
  disabledBehavior: 'selection' | 'all';
  selection: ListSelection | undefined;
  isLoading: boolean;
  loadingRowCount: number;
  emptyState: ReactNode;
  totalLabel: string;
  loadingLabel: string;
}

/** Hands DataTable the list's selection manager, read from an item's render values, as SelectAll does the table's. */
function ManagerProbe({
  manager,
  onManager,
}: {
  manager: ListSelectionManager;
  onManager: (manager: ListSelectionManager | null) => void;
}): null {
  useEffect(() => {
    onManager(manager);
    return () => {
      onManager(null);
    };
  }, [manager, onManager]);
  return null;
}

interface ListItemProps<T> {
  row: FaceRow<T>;
  columns: readonly DataTableColumn<T>[];
  rowHeader: DataTableColumn<T> | undefined;
  isCurrent: boolean;
  /** Whether the item can neither be focused nor opened: disabled, with disabledBehavior 'all'. */
  isDisabled: boolean;
  /** Undefined while selection is off. */
  selection: ListSelection | undefined;
  /** Whether the reader pressed Select: every item draws its box. */
  selecting: boolean;
  /** The first item hands DataTable the list's selection manager. */
  probe: boolean;
}

/** One item: the box or the selected mark, the title over the meta line, and the end cells at its end. */
function ListItem<T>({
  row,
  columns,
  rowHeader,
  isCurrent,
  isDisabled,
  selection,
  selecting,
  probe,
}: ListItemProps<T>): ReactElement {
  const hasLink = row.href !== undefined && !isDisabled;
  const inSlot = (slot: Slot): DataTableColumn<T>[] =>
    columns.filter((column) => slotOf(column, rowHeader) === slot);
  const part = (column: DataTableColumn<T>): ReactNode => {
    const body = figure(column as DataTableColumn<unknown>, column.cell(row.value));
    return (
      <span key={column.id} className="data-table-item-part">
        {column === rowHeader && hasLink ? (
          <Link
            href={row.href}
            className="data-table-link"
            aria-current={isCurrent ? 'true' : undefined}
            {...UNTABBED}
          >
            {body}
          </Link>
        ) : (
          body
        )}
      </span>
    );
  };
  const title = inSlot('title');
  const meta = inSlot('meta');
  const end = inSlot('end');
  return (
    <GridListItem
      id={row.key}
      textValue={row.text}
      className="data-table-item"
      data-link={hasLink ? '' : undefined}
      data-current={isCurrent ? '' : undefined}
    >
      {({ state }) => (
        <>
          {probe && selection !== undefined ? (
            <ManagerProbe manager={state.selectionManager} onManager={selection.onManager} />
          ) : null}
          {selection === undefined ? null : selecting ? (
            <span className="data-table-item-select" data-selection="">
              {/* React Aria names it by its own label and the item (spec correction 5): "Select Corner Mart". */}
              <Checkbox slot="selection" aria-label={selection.selectLabel} {...UNTABBED} />
            </span>
          ) : (
            // Out of Select mode a selected item keeps a mark beside its wash, so its state is never color alone.
            <span className="data-table-item-mark" aria-hidden="true">
              <Check />
            </span>
          )}
          <span className="data-table-item-text">
            <span className="data-table-item-title" data-overflow={lineOverflow(title)}>
              {title.map(part)}
            </span>
            {meta.length > 0 ? (
              <span className="data-table-item-meta" data-overflow={lineOverflow(meta)}>
                {meta.map(part)}
              </span>
            ) : null}
          </span>
          {end.length > 0 ? <span className="data-table-item-end">{end.map(part)}</span> : null}
        </>
      )}
    </GridListItem>
  );
}

/** `count` skeleton items in React Aria's empty row: a title line and a meta line, and an end line. */
function SkeletonItems({ count, label }: { count: number; label: string }): ReactElement {
  return (
    <>
      {/* The skeletons say nothing, so the empty cell holds the loading words, hidden from sight. */}
      <span className="data-table-loading">{label}</span>
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className="data-table-skeleton-item">
          <span className="data-table-skeleton-text">
            <Skeleton width="60%" />
            <Skeleton width="40%" />
          </span>
          <Skeleton width="24%" />
        </div>
      ))}
    </>
  );
}

/**
 * The list face (spec 8): the same rows as React Aria's GridList, in sections by `groups` under sticky day
 * headings, each item laid out from its columns' `listSlot`, with the same link, selection and keys as the
 * table face. With selection on, the list draws no boxes until the reader presses Select above it, which shows
 * every item's box and Select all beside a Done button; Done hides them and keeps the selection, a selected
 * item keeping its mark (amendment 3). Private to DataTable.
 */
export function ListFace<T>({
  rows,
  groups,
  columns,
  rowHeader,
  currentKey,
  disabledKeys,
  disabledBehavior,
  selection,
  isLoading,
  loadingRowCount,
  emptyState,
  totalLabel,
  loadingLabel,
  ...name
}: ListFaceProps<T>): ReactElement {
  const [selecting, setSelecting] = useState(false);
  const totals = columns.filter((column) => slotOf(column, rowHeader) === 'end' && present(column.total));
  const first = rows[0]?.key;
  const item = (row: FaceRow<T>): ReactElement => (
    <ListItem
      key={row.key}
      row={row}
      columns={columns}
      rowHeader={rowHeader}
      isCurrent={currentKey !== undefined && currentKey !== null && row.key === currentKey}
      isDisabled={disabledBehavior === 'all' && disabledKeys.has(row.key)}
      selection={selection}
      selecting={selecting}
      probe={row.key === first}
    />
  );
  return (
    <>
      {selection !== undefined && rows.length > 0 ? (
        // Select all leads and the button trails, iOS Mail's order; the button keeps its place, and its focus,
        // as its words change.
        <div className="data-table-list-head" data-selecting={selecting ? '' : undefined}>
          {selecting ? (
            <Checkbox
              className="data-table-list-all"
              isSelected={selection.all === 'all'}
              isIndeterminate={selection.all === 'some'}
              onChange={selection.onSelectAll}
            >
              {selection.selectAllLabel}
            </Checkbox>
          ) : null}
          <Button
            variant="tertiary"
            className="data-table-list-mode"
            onPress={() => {
              setSelecting(!selecting);
            }}
          >
            {selecting ? selection.doneLabel : selection.selectItemsLabel}
          </Button>
        </div>
      ) : null}
      <GridList
        {...name}
        className="data-table-grid-list"
        selectionMode={selection === undefined ? 'none' : 'multiple'}
        selectionBehavior="toggle"
        selectedKeys={selection?.selectedKeys}
        onSelectionChange={selection?.onChange}
        disabledKeys={disabledKeys}
        disabledBehavior={disabledBehavior}
        // Letters never move focus (spec correction 10); the Table strips this prop, the GridList takes it.
        disallowTypeAhead
        renderEmptyState={() =>
          isLoading ? (
            <SkeletonItems count={loadingRowCount} label={loadingLabel} />
          ) : present(emptyState) ? (
            emptyState
          ) : null
        }
      >
        {groups.map((group) =>
          group.label === null ? (
            // Ungrouped, the items are the list's own: a rowgroup with no heading would have no name.
            group.items.map(item)
          ) : (
            <GridListSection key={group.key} id={group.key} className="data-table-section">
              <GridListHeader className="data-table-section-header">{group.label}</GridListHeader>
              {group.items.map(item)}
            </GridListSection>
          ),
        )}
      </GridList>
      {totals.length > 0 && rows.length > 0 ? (
        <div className="data-table-list-total">
          <span>{totalLabel}</span>
          <span className="data-table-list-total-figures">
            {totals.map((column) => (
              <span key={column.id}>{figure(column as DataTableColumn<unknown>, column.total)}</span>
            ))}
          </span>
        </div>
      ) : null}
    </>
  );
}
