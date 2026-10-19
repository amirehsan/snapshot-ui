'use client';

import {
  Button,
  Card,
  CardActions,
  CardBody,
  CardHeader,
  CardNote,
  CardTitle,
  ConfirmDialog,
  Dialog,
  DialogTrigger,
  IconButton,
  Menu,
  MenuItem,
  MenuTrigger,
} from '@snapshot-ui/react';
import { Ellipsis } from 'lucide-react';
import { useState, type ReactElement } from 'react';

/**
 * An account's Details card with Edit and a More menu in its header: at most two visible actions, the rest in
 * the menu. Edit opens its Dialog from a DialogTrigger; Merge and Remove open theirs from the menu, and every
 * one gives focus back to the button that opened it. The actions end the title's line and stand clear of the
 * card's rounded corner; in a header under 24rem they follow the note.
 */
export default function CardActionsExample(): ReactElement {
  const [open, setOpen] = useState<'merge' | 'remove' | null>(null);
  const close = (isOpen: boolean): void => {
    if (!isOpen) setOpen(null);
  };
  return (
    <Card
      as="section"
      aria-labelledby="card-actions-title"
      style={{ width: '100%', maxWidth: 560, marginInline: 'auto' }}
    >
      <CardHeader>
        <CardTitle id="card-actions-title" level={3}>
          Account details
        </CardTitle>
        <CardNote>Updated from your bank feed</CardNote>
        <CardActions>
          <DialogTrigger>
            <Button variant="secondary" aria-label="Edit details">
              Edit
            </Button>
            <Dialog
              title="Edit details"
              description="The name and type the account shows everywhere."
              actions={({ close: done }) => (
                <>
                  <Button variant="secondary" onPress={done}>
                    Cancel
                  </Button>
                  <Button onPress={done}>Save details</Button>
                </>
              )}
            />
          </DialogTrigger>
          <MenuTrigger>
            <IconButton aria-label="More actions" variant="outline">
              <Ellipsis />
            </IconButton>
            <Menu
              onAction={(key) => {
                setOpen(key === 'merge' ? 'merge' : 'remove');
              }}
            >
              <MenuItem id="merge">Merge</MenuItem>
              <MenuItem id="remove" variant="danger">
                Remove
              </MenuItem>
            </Menu>
          </MenuTrigger>
        </CardActions>
      </CardHeader>
      <CardBody>
        <p>Everyday Visa, a credit card with Northwind Bank.</p>
      </CardBody>
      <Dialog
        isOpen={open === 'merge'}
        onOpenChange={close}
        title="Merge Everyday Visa"
        description="Its transactions move into the account you choose, and this one closes."
        actions={({ close: done }) => (
          <>
            <Button variant="secondary" onPress={done}>
              Cancel
            </Button>
            <Button onPress={done}>Merge accounts</Button>
          </>
        )}
      />
      <ConfirmDialog
        isOpen={open === 'remove'}
        onOpenChange={close}
        tone="danger"
        title="Remove Everyday Visa?"
        description="Its transactions and its history leave every report. This cannot be undone."
        confirmLabel="Remove Everyday Visa"
      />
    </Card>
  );
}
