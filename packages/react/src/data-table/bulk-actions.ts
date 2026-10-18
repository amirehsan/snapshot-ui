import { isValidElement } from 'react';
import type { DataTableBulkAction } from './DataTable';

/**
 * Whether `bulkActions` is the data form: an array whose every entry is a plain object, not a React element,
 * with a string `id`, a string `label` and a function `onAction`. `ReactNode` holds arrays too, so `Array.isArray`
 * cannot tell the forms apart; anything else is a node, drawn as 0.6.0 drew it (spec correction 18). An empty
 * array is data with no actions.
 */
export function isBulkActionData(value: unknown): value is readonly DataTableBulkAction[] {
  return (
    Array.isArray(value) &&
    value.every(
      (entry: unknown) =>
        typeof entry === 'object' &&
        entry !== null &&
        !isValidElement(entry) &&
        typeof (entry as { id?: unknown }).id === 'string' &&
        typeof (entry as { label?: unknown }).label === 'string' &&
        typeof (entry as { onAction?: unknown }).onAction === 'function',
    )
  );
}

/**
 * Whether `element` is drawn: in the document with a box. False under `display: none`, as a promoted button is
 * in a narrow bar, in every engine; `checkVisibility()` is above the Safari 16.4 floor and jsdom lacks it (spec
 * correction 14). Read at an event, never at render.
 */
export function isDrawn(element: Element): boolean {
  return element.isConnected && element.getClientRects().length > 0;
}
