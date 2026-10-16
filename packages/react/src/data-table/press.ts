/*
 * DataTable's press guard (ruling 2, spec 7.1). React Aria selects a row on a press anywhere in it while
 * selection is on and the row has no action, from the cell's press handler, so a press on a row without a link
 * would select it. A press on the row's link opens it and stops there, and a press on a cell's own control is the
 * control's; only a press on a cell itself, or on text in it, reaches React Aria's cell, and that one the root's
 * capture phase stops, so a press never selects. Pure: every read is of the event's target.
 */

/**
 * What in a cell takes its own press, as data-table.css raises it over the row's link (spec correction 14): every
 * native control and control role, a label, anything in the tab order, a field, a checkbox field, the opt-in
 * `data-table-control`, and the row's own link.
 */
export const CONTROL =
  'a[href], button, input, label, select, summary, textarea, [role="button"], [role="checkbox"], [role="combobox"], [role="menuitem"], [role="radio"], [role="slider"], [role="switch"], [tabindex]:not([tabindex="-1"]), .checkbox-field, .field, .data-table-control';

const BODY_CELL = '[role="gridcell"], [role="rowheader"]';

/** A list face item, whose padding is the item's own and in no cell: a press there reaches React Aria's item. */
const LIST_ITEM = '.data-table-item';

/**
 * Whether a press on `target` would reach React Aria's cell and select its row: it is inside `root`'s DOM (a
 * portal opened from a cell is not), inside a row's cell or on a list item's own padding, and on no control
 * inside that cell. The cell, or the item, may be in the tab order while it holds React Aria's focus, so it is
 * never its own control.
 */
export function selectsOnPress(target: Element, root: Element): boolean {
  if (!root.contains(target)) return false;
  const cell = target.closest(BODY_CELL) ?? target.closest(LIST_ITEM);
  if (cell === null || !root.contains(cell)) return false;
  const control = target.closest(CONTROL);
  return control === null || control === cell || !cell.contains(control);
}
