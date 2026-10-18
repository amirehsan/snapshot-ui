'use client';

import { Ellipsis } from 'lucide-react';
import { useState, type ReactElement, type RefObject } from 'react';
import type { Key } from 'react-aria-components';
import { IconButton } from '../icon-button/IconButton';
import { Menu, MenuTrigger } from '../menu/Menu';
import { MenuItem } from '../menu/MenuItem';
import { isDrawn } from './bulk-actions';
import type { DataTableBulkAction } from './DataTable';

export interface BulkMenuProps {
  /** Every action of the data form, in the app's order. */
  actions: readonly DataTableBulkAction[];
  /** The ids of the actions the bar draws as buttons. */
  promoted: ReadonlySet<string>;
  /** The selected keys present in `items`, which each action receives. */
  keys: Key[];
  /** `labels.moreActions`: the button's name, and so the menu's. */
  label: string;
  /** The bar, whose promoted buttons are read at the press. */
  barRef: RefObject<HTMLElement | null>;
}

/**
 * The bulk-action bar's More menu (spec 11.2, ruling 25): an ellipsis IconButton named `label` opening a Menu of
 * the actions the bar does not show. Its items are read as it opens, from which promoted buttons are drawn at that
 * moment (`isDrawn` on each `[data-action-id]` button), never at render: a narrow bar draws none, so More holds
 * every action there and the rest on a wide one. With every action promoted it writes `data-promoted-only`, and
 * the stylesheet draws it only while the bar is narrow. Private to the bar.
 */
export function BulkMenu({ actions, promoted, keys, label, barRef }: BulkMenuProps): ReactElement {
  const [items, setItems] = useState<readonly DataTableBulkAction[]>([]);
  const promotedOnly = actions.every((action) => promoted.has(action.id));
  return (
    <MenuTrigger
      onOpenChange={(isOpen) => {
        if (!isOpen) return;
        const drawn = new Set<string>();
        for (const button of barRef.current?.querySelectorAll<HTMLElement>('[data-action-id]') ?? []) {
          if (isDrawn(button)) drawn.add(button.dataset.actionId ?? '');
        }
        setItems(actions.filter((action) => !promoted.has(action.id) || !drawn.has(action.id)));
      }}
    >
      <IconButton
        className="data-table-bar-more"
        aria-label={label}
        data-promoted-only={promotedOnly ? '' : undefined}
      >
        <Ellipsis />
      </IconButton>
      <Menu
        placement="top end"
        disabledKeys={items.filter((action) => action.isDisabled === true).map((action) => action.id)}
      >
        {items.map((action) => (
          <MenuItem
            key={action.id}
            id={action.id}
            icon={action.icon}
            onAction={() => {
              action.onAction(keys);
            }}
          >
            {action.label}
          </MenuItem>
        ))}
      </Menu>
    </MenuTrigger>
  );
}
