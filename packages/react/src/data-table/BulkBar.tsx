'use client';

import type { ReactElement, ReactNode } from 'react';
import { Toolbar } from 'react-aria-components';
import { Button } from '../button/Button';
import { present } from '../utils/present';

export interface BulkBarProps {
  /** The bar's name, `labels.toolbar`. */
  label: string;
  /** The count in the app's words, `labels.selected(formatCount(count))`. */
  count: string;
  /** The app's buttons. */
  actions: ReactNode;
  /** `labels.clearSelection`. */
  clearLabel: string;
  /** Clears the selection and puts focus on the table. */
  onClear: () => void;
}

/**
 * The bulk-action bar (spec 7.1, ruling 5): React Aria's Toolbar named `label`, holding the count, the app's
 * actions and a tertiary Clear selection. The arrows move between its buttons and Tab leaves it, React Aria's
 * toolbar keys. React Aria's Toolbar takes no key or focus handlers, so DataTable's root hears the bar's Escape,
 * which clears and puts focus on the table (spec correction 18), and where focus is. Private to DataTable, which
 * shows it while any row in `items` is selected.
 */
export function BulkBar({ label, count, actions, clearLabel, onClear }: BulkBarProps): ReactElement {
  return (
    <Toolbar aria-label={label} className="data-table-bar">
      <span className="data-table-bar-count">{count}</span>
      {present(actions) ? <div className="data-table-bar-actions">{actions}</div> : null}
      <Button variant="tertiary" className="data-table-bar-clear" onPress={onClear}>
        {clearLabel}
      </Button>
    </Toolbar>
  );
}
