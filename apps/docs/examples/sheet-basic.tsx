import { Button, Checkbox, CheckboxGroup, Sheet, SheetTrigger, TextField } from '@snapshot-ui/react';
import type { ReactElement } from 'react';

export default function SheetBasic(): ReactElement {
  return (
    <SheetTrigger>
      <Button variant="secondary">Filter transactions</Button>
      <Sheet
        title="Filter transactions"
        description="Narrow the list to what you are looking for."
        footer={
          <Button slot="close" style={{ width: '100%' }}>
            Show 24 transactions
          </Button>
        }
      >
        <div style={{ display: 'grid', gap: 24 }}>
          <TextField label="Payee" />
          <CheckboxGroup label="Status" defaultValue={['cleared']}>
            <Checkbox value="cleared">Cleared</Checkbox>
            <Checkbox value="pending">Pending</Checkbox>
          </CheckboxGroup>
        </div>
      </Sheet>
    </SheetTrigger>
  );
}
