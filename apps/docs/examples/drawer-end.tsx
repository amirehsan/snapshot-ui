import { Button, Checkbox, CheckboxGroup, DialogTrigger, Drawer, Switch } from '@snapshot-ui/react';
import type { ReactElement } from 'react';

export default function DrawerEnd(): ReactElement {
  return (
    <DialogTrigger>
      <Button variant="secondary">Filter the projects</Button>
      <Drawer
        placement="end"
        title="Filters"
        footer={
          <Button slot="close" style={{ width: '100%' }}>
            Show 12 projects
          </Button>
        }
      >
        <div style={{ display: 'grid', gap: 24 }}>
          <CheckboxGroup label="Status" defaultValue={['active']}>
            <Checkbox value="active">Active</Checkbox>
            <Checkbox value="paused">Paused</Checkbox>
            <Checkbox value="archived">Archived</Checkbox>
          </CheckboxGroup>
          <Switch defaultSelected>Only projects I own</Switch>
        </div>
      </Drawer>
    </DialogTrigger>
  );
}
