import { Button, ConfirmDialog, DialogTrigger } from '@snapshot-ui/react';
import type { ReactElement } from 'react';

export default function ConfirmDialogBasic(): ReactElement {
  return (
    <DialogTrigger>
      <Button variant="secondary">Send the invoice</Button>
      <ConfirmDialog
        tone="default"
        title="Send the invoice now?"
        description="The client gets it by email at once, and it can no longer be edited."
        confirmLabel="Send invoice"
      />
    </DialogTrigger>
  );
}
