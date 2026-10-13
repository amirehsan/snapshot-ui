import { Button, ConfirmDialog, DialogTrigger } from '@snapshot-ui/react';
import type { ReactElement } from 'react';

export default function ConfirmDialogDanger(): ReactElement {
  return (
    <DialogTrigger>
      <Button variant="danger">Delete the workspace</Button>
      <ConfirmDialog
        tone="danger"
        title="Delete the workspace?"
        description="Its 12 projects and their history go with it. This cannot be undone."
        confirmLabel="Delete the workspace"
      />
    </DialogTrigger>
  );
}
