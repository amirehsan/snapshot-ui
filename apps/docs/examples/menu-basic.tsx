'use client';

import {
  IconButton,
  Menu,
  MenuItem,
  MenuSection,
  MenuSeparator,
  MenuTrigger,
  Text,
} from '@snapshot-ui/react';
import { Copy, Download, Ellipsis, Pencil, Share2, Trash2 } from 'lucide-react';
import { useState, type ReactElement } from 'react';

const LABELS: Record<string, string> = {
  rename: 'Rename',
  duplicate: 'Duplicate',
  share: 'Share',
  delete: 'Delete the project',
};

export default function MenuBasic(): ReactElement {
  const [chosen, setChosen] = useState<string | null>(null);
  return (
    <div style={{ display: 'grid', gap: 16, justifyItems: 'center' }}>
      <MenuTrigger>
        <IconButton aria-label="Project actions" variant="outline">
          <Ellipsis />
        </IconButton>
        <Menu
          onAction={(key) => {
            setChosen(LABELS[String(key)] ?? null);
          }}
        >
          <MenuSection title="Project">
            <MenuItem id="rename" icon={<Pencil />}>
              Rename
            </MenuItem>
            <MenuItem id="duplicate" icon={<Copy />} shortcut="Mod D">
              Duplicate
            </MenuItem>
            <MenuItem id="share" icon={<Share2 />} description="Anyone with the link can view">
              Share
            </MenuItem>
            <MenuItem id="export" icon={<Download />} isDisabled>
              Export
            </MenuItem>
          </MenuSection>
          <MenuSeparator />
          <MenuItem id="delete" icon={<Trash2 />} variant="danger">
            Delete the project
          </MenuItem>
        </Menu>
      </MenuTrigger>
      <Text tone="muted">{chosen === null ? 'Nothing chosen yet.' : `Chose ${chosen}.`}</Text>
    </div>
  );
}
