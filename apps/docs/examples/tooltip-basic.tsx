import { IconButton, Tooltip, TooltipTrigger } from '@snapshot-ui/react';
import { CircleHelp, Copy, Pencil, Share2 } from 'lucide-react';
import type { ReactElement } from 'react';

export default function TooltipBasic(): ReactElement {
  return (
    <div className="row" style={{ justifyContent: 'center', gap: 12 }}>
      <TooltipTrigger>
        <IconButton aria-label="Edit" variant="outline">
          <Pencil />
        </IconButton>
        <Tooltip>Edit</Tooltip>
      </TooltipTrigger>
      <TooltipTrigger>
        <IconButton aria-label="Duplicate" variant="outline">
          <Copy />
        </IconButton>
        <Tooltip>Duplicate</Tooltip>
      </TooltipTrigger>
      <TooltipTrigger>
        <IconButton aria-label="Share" variant="outline">
          <Share2 />
        </IconButton>
        <Tooltip>Share</Tooltip>
      </TooltipTrigger>
      <TooltipTrigger>
        <IconButton aria-label="Help" variant="outline" href="/docs">
          <CircleHelp />
        </IconButton>
        <Tooltip>Help</Tooltip>
      </TooltipTrigger>
    </div>
  );
}
