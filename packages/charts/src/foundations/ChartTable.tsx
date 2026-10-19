import type { ReactElement, ReactNode } from 'react';
import type { ChartName } from './naming';

/** The class prefix of the chart a part belongs to. */
export type ChartBlock = 'line-chart' | 'bar-chart';

/** The strings the table's toggle and its noscript note write. */
export interface ChartTableLabels {
  showTable: string;
  showChart: string;
  noScript: string;
}

export interface ChartTableProps {
  /** The chart's class prefix: the table is `${block}-table`, the toggle `${block}-toggle`. */
  block: ChartBlock;
  /**
   * The column headers after the empty corner cell: one per series, then any total column, such as a stack's
   * total, which is a column like any other. LineChart passes its series only.
   */
  columns: readonly string[];
  /** The row headers: one per x label or category, the app's string, or a link with it. */
  rows: readonly ReactNode[];
  /** The cell at a row and a column, the app's string or a link with it; undefined leaves the cell empty. */
  cell: (row: number, column: number) => ReactNode;
  /**
   * The id the shown table writes on a cell, so a mark can be named by its cells: a column's header is row -1,
   * a row's header column -1. The noscript copy writes none. @default none
   */
  id?: (row: number, column: number) => string | undefined;
  /** The chart's name, from `chartName`: the table takes its `aria-labelledby`, or its `aria-label` as the caption. */
  name: Partial<Pick<ChartName, 'labelledBy' | 'label'>>;
  /** Which view is shown: the table is hidden in the chart view. */
  view: 'chart' | 'table';
  labels: ChartTableLabels;
  /** Called when the toggle is pressed. */
  onToggle: () => void;
  /**
   * Draws the toggle and, with scripts off, the note and the shown copy. A chart with nothing to show as a
   * table, such as an empty or a failed one, passes false and keeps only the hidden table, which a caller that
   * wants none leaves out with the whole part. @default true
   */
  hasToggle?: boolean;
}

/**
 * The table of a chart's strings, the toggle that swaps it for the plot, and with scripts off a note and a
 * shown copy of the table. The copy carries no ids, so the page has one of each. No state of its own.
 */
export function ChartTable({
  block,
  columns,
  rows,
  cell,
  id,
  name,
  view,
  labels,
  onToggle,
  hasToggle = true,
}: ChartTableProps): ReactElement {
  const table = (isCopy: boolean): ReactElement => {
    const idOf = (row: number, column: number): string | undefined =>
      isCopy ? undefined : id?.(row, column);
    return (
      <table
        className={`${block}-table`}
        hidden={!isCopy && view === 'chart'}
        aria-labelledby={name.labelledBy}
      >
        {name.label === undefined ? null : <caption>{name.label}</caption>}
        <thead>
          <tr>
            <td />
            {columns.map((column, at) => (
              <th key={at} scope="col" id={idOf(-1, at)}>
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={index}>
              <th scope="row" id={idOf(index, -1)}>
                {row}
              </th>
              {columns.map((_, at) => (
                <td key={at} id={idOf(index, at)}>
                  {cell(index, at)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

  return (
    <>
      {table(false)}
      {hasToggle ? (
        <>
          <div className={`${block}-toolbar`}>
            <button type="button" className={`button button-tertiary ${block}-toggle`} onClick={onToggle}>
              {view === 'chart' ? labels.showTable : labels.showChart}
            </button>
          </div>
          <noscript>
            <p className={`${block}-noscript`}>{labels.noScript}</p>
            {table(true)}
          </noscript>
        </>
      ) : null}
    </>
  );
}
