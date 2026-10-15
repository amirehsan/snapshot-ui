import type { DataTableColumn } from './DataTable';

/**
 * The row header: the column marked `isRowHeader`, else the first. With two marked, the first marked wins and
 * DataTable warns. Undefined only for no columns at all.
 */
export function rowHeaderOf<T>(columns: readonly DataTableColumn<T>[]): DataTableColumn<T> | undefined {
  return columns.find((column) => column.isRowHeader === true) ?? columns[0];
}

/** A row's text in `column`: its `textValue`, else its cell when that is a string or a number, else ''. */
export function textOf<T>(item: T, column: DataTableColumn<T> | undefined): string {
  if (column === undefined) return '';
  if (column.textValue !== undefined) return column.textValue(item);
  const cell = column.cell(item);
  if (typeof cell === 'string') return cell;
  if (typeof cell === 'number') return String(cell);
  return '';
}

/** The skeleton's widths, 40% to 80%, in a fixed order: the server and the browser draw the same (ruling 9). */
export const SKELETON_WIDTHS: readonly string[] = ['72%', '48%', '64%', '56%', '80%', '40%'];

/** The width of the skeleton line in `row` and `column`, cycling through the pattern. */
export const skeletonWidth = (row: number, column: number): string =>
  SKELETON_WIDTHS[(row * 2 + column) % SKELETON_WIDTHS.length] ?? '64%';
