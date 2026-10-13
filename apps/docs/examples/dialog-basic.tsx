import { Button, Dialog, DialogTrigger, TextField } from '@snapshot-ui/react';
import { Pencil } from 'lucide-react';
import type { ReactElement } from 'react';

export default function DialogBasic(): ReactElement {
  return (
    <DialogTrigger>
      <Button variant="secondary">Rename the workspace</Button>
      <Dialog
        icon={<Pencil />}
        title="Rename the workspace"
        description="The new name shows in the header and in every invite."
        actions={<Button slot="close">Rename</Button>}
      >
        <TextField label="Workspace name" defaultValue="Northwind Studio" />
      </Dialog>
    </DialogTrigger>
  );
}
