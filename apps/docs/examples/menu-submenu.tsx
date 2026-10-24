'use client';

import {
  IconButton,
  Menu,
  MenuItem,
  MenuSeparator,
  MenuTrigger,
  SubmenuTrigger,
  Text,
  type Key,
} from '@snapshot-ui/react';
import { Copy, Ellipsis, FolderInput, Trash2 } from 'lucide-react';
import { useState, type ReactElement } from 'react';

const FOLDERS: Record<string, string> = { inbox: 'Inbox', receipts: 'Receipts', taxes: 'Taxes' };

/** A Move to item opening a submenu of folders: Arrow Right opens it, Arrow Left or Escape closes it. */
export default function MenuSubmenu(): ReactElement {
  const [folder, setFolder] = useState<Key>('inbox');
  return (
    <div style={{ display: 'grid', gap: 16, justifyItems: 'center' }}>
      <MenuTrigger>
        <IconButton aria-label="Document actions" variant="outline">
          <Ellipsis />
        </IconButton>
        <Menu>
          <MenuItem id="duplicate" icon={<Copy />}>
            Duplicate
          </MenuItem>
          <SubmenuTrigger>
            <MenuItem id="move" icon={<FolderInput />} end={FOLDERS[String(folder)]}>
              Move to
            </MenuItem>
            <Menu
              selectionMode="single"
              selectedKeys={[folder]}
              disallowEmptySelection
              onSelectionChange={(keys) => {
                const [next] = keys === 'all' ? [] : [...keys];
                if (next !== undefined) setFolder(next);
              }}
            >
              {Object.entries(FOLDERS).map(([id, name]) => (
                <MenuItem key={id} id={id}>
                  {name}
                </MenuItem>
              ))}
            </Menu>
          </SubmenuTrigger>
          <MenuSeparator />
          <MenuItem id="delete" icon={<Trash2 />} variant="danger">
            Delete
          </MenuItem>
        </Menu>
      </MenuTrigger>
      <Text>In {FOLDERS[String(folder)]}</Text>
    </div>
  );
}
