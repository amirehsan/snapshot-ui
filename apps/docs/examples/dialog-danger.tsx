import { Button, Dialog, DialogTrigger } from '@snapshot-ui/react';
import { TriangleAlert } from 'lucide-react';
import type { ReactElement } from 'react';

export default function DialogDanger(): ReactElement {
  return (
    <DialogTrigger>
      <Button variant="danger">Delete the workspace</Button>
      <Dialog
        tone="danger"
        icon={<TriangleAlert />}
        title="Delete the workspace?"
        description="Its 12 projects and their history go with it. This cannot be undone."
        actions={
          <>
            <Button variant="tertiary" slot="close">
              Cancel
            </Button>
            <Button variant="danger" slot="close">
              Delete the workspace
            </Button>
          </>
        }
      />
    </DialogTrigger>
  );
}
