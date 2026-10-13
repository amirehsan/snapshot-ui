import { Button, Checkbox, CheckboxGroup, DialogTrigger, Popover, Switch } from '@snapshot-ui/react';
import type { ReactElement } from 'react';

export default function PopoverBasic(): ReactElement {
  return (
    <DialogTrigger>
      <Button variant="secondary">Filter the projects</Button>
      <Popover isPadded>
        <div style={{ display: 'grid', gap: 24 }}>
          <CheckboxGroup label="Status" defaultValue={['active']}>
            <Checkbox value="active">Active</Checkbox>
            <Checkbox value="paused">Paused</Checkbox>
            <Checkbox value="archived">Archived</Checkbox>
          </CheckboxGroup>
          <Switch defaultSelected>Only projects I own</Switch>
        </div>
      </Popover>
    </DialogTrigger>
  );
}
