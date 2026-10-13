import { Button, Dialog, DialogTrigger } from '@snapshot-ui/react';
import type { ReactElement } from 'react';

const SECTIONS = [
  'Who can see the workspace',
  'What members can change',
  'How long history is kept',
  'What leaves with a member',
  'How billing follows the owner',
  'When the workspace is archived',
  'How an export is made',
  'What happens on deletion',
];

export default function DialogLong(): ReactElement {
  return (
    <DialogTrigger>
      <Button variant="secondary">Read the workspace terms</Button>
      <Dialog
        size="lg"
        hasCloseButton
        title="Workspace terms"
        description="What every member agrees to when they join."
        actions={<Button slot="close">I agree</Button>}
      >
        {SECTIONS.map((section) => (
          <p key={section}>
            <strong>{section}.</strong> Every workspace keeps its projects, its members and their history, and
            the owner decides who joins. A member sees what the owner shares with them, changes what their
            role allows, and keeps a copy of nothing once they leave.
          </p>
        ))}
      </Dialog>
    </DialogTrigger>
  );
}
