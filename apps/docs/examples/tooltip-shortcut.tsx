import { IconButton, Tooltip, TooltipTrigger } from '@snapshot-ui/react';
import { Search, Settings } from 'lucide-react';
import type { ReactElement } from 'react';

export default function TooltipShortcut(): ReactElement {
  return (
    <div style={{ display: 'grid', gap: 12, justifyItems: 'start' }}>
      <TooltipTrigger>
        <IconButton aria-label="Search">
          <Search />
        </IconButton>
        <Tooltip placement="end" shortcut="Mod K">
          Search
        </Tooltip>
      </TooltipTrigger>
      <TooltipTrigger>
        <IconButton aria-label="Settings">
          <Settings />
        </IconButton>
        <Tooltip placement="end" shortcut="Mod ,">
          Settings
        </Tooltip>
      </TooltipTrigger>
    </div>
  );
}
