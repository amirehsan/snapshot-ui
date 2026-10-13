import { Button, DialogTrigger, Popover, Radio, RadioGroup } from '@snapshot-ui/react';
import type { ReactElement } from 'react';

export default function PopoverMatchWidth(): ReactElement {
  return (
    <DialogTrigger>
      <Button variant="secondary" style={{ width: '100%', maxWidth: '15rem' }}>
        Sort the projects
      </Button>
      <Popover isPadded matchTriggerWidth>
        <RadioGroup label="Sort by" defaultValue="recent">
          <Radio value="recent">Most recent</Radio>
          <Radio value="name">Name</Radio>
          <Radio value="owner">Owner</Radio>
        </RadioGroup>
      </Popover>
    </DialogTrigger>
  );
}
