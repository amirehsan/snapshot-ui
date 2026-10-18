import { isValidElement } from 'react';
import type { DataTableBulkAction } from './DataTable';

/** An object that no node is: not a React element, a portal or any other value React draws, nor an array. */
const isPlainObject = (entry: unknown): entry is Record<string, unknown> =>
  typeof entry === 'object' &&
  entry !== null &&
  !Array.isArray(entry) &&
  !isValidElement(entry) &&
  !('$$typeof' in entry);

/** One action of the data form: a plain object with a string `id`, a string `label` and a function `onAction`. */
const isAction = (entry: unknown): entry is DataTableBulkAction =>
  isPlainObject(entry) &&
  typeof entry.id === 'string' &&
  typeof entry.label === 'string' &&
  typeof entry.onAction === 'function';

/**
 * Whether `bulkActions` is the data form: an array whose every entry is a plain object, not a React element,
 * with a string `id`, a string `label` and a function `onAction`. `ReactNode` holds arrays too, so `Array.isArray`
 * cannot tell the forms apart; anything else is a node, drawn as 0.6.0 drew it (spec correction 18). An empty
 * array is data with no actions.
 */
export function isBulkActionData(value: unknown): value is readonly DataTableBulkAction[] {
  return Array.isArray(value) && value.every(isAction);
}

/** `bulkActions` read once: a node to draw as it is, or the data form's actions. */
export type BulkActionsRead =
  | { kind: 'node' }
  | {
      kind: 'data';
      /** The well-formed actions, in the app's order. */
      actions: readonly DataTableBulkAction[];
      /** The place of the first entry that is not a well-formed action, or null when every one is. */
      firstInvalid: number | null;
    };

/**
 * How the bar draws `bulkActions`: as data when every entry is an action, and also when any entry is a plain
 * object, which no node can be, so an array of actions with a field missing or mistyped draws its well-formed
 * actions and nothing for the rest, with a warning, rather than reaching React as a child it cannot draw (spec
 * correction 118). Anything else is a node.
 */
export function readBulkActions(value: unknown): BulkActionsRead {
  if (isBulkActionData(value)) return { kind: 'data', actions: value, firstInvalid: null };
  if (!Array.isArray(value) || !value.some(isPlainObject)) return { kind: 'node' };
  return {
    kind: 'data',
    actions: value.filter(isAction),
    firstInvalid: value.findIndex((entry) => !isAction(entry)),
  };
}

/**
 * Whether `element` is drawn: in the document with a box. False under `display: none`, as a promoted button is
 * in a narrow bar, in every engine; `checkVisibility()` is above the Safari 16.4 floor and jsdom lacks it (spec
 * correction 14). Read at an event, never at render.
 */
export function isDrawn(element: Element): boolean {
  return element.isConnected && element.getClientRects().length > 0;
}
