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
} from '@snapshot-ui/react';
import type { ReactElement } from 'react';

/**
 * An account's Details card with Edit, Merge and Remove in its header, each opening its own dialog, which
 * gives focus back to the button that opened it. They end the title's line and stand clear of the card's
 * rounded corner; in a header under 24rem they follow the note.
 */
export default function CardActionsExample(): ReactElement {
  return (
    <Card
      as="section"
      aria-labelledby="card-actions-title"
      style={{ width: '100%', maxWidth: 640, marginInline: 'auto' }}
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
              actions={({ close }) => (
                <>
                  <Button variant="secondary" onPress={close}>
                    Cancel
                  </Button>
                  <Button onPress={close}>Save details</Button>
                </>
              )}
            />
          </DialogTrigger>
          <DialogTrigger>
            <Button variant="secondary" aria-label="Merge account">
              Merge
            </Button>
            <Dialog
              title="Merge Everyday Visa"
              description="Its transactions move into the account you choose, and this one closes."
              actions={({ close }) => (
                <>
                  <Button variant="secondary" onPress={close}>
                    Cancel
                  </Button>
                  <Button onPress={close}>Merge accounts</Button>
                </>
              )}
            />
          </DialogTrigger>
          <DialogTrigger>
            <Button variant="secondary" aria-label="Remove account">
              Remove
            </Button>
            <ConfirmDialog
              tone="danger"
              title="Remove Everyday Visa?"
              description="Its transactions and its history leave every report. This cannot be undone."
              confirmLabel="Remove Everyday Visa"
            />
          </DialogTrigger>
        </CardActions>
      </CardHeader>
      <CardBody>
        <p>Everyday Visa, a credit card with Northwind Bank.</p>
      </CardBody>
    </Card>
  );
}
