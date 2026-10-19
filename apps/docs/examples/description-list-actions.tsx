'use client';

import {
  Badge,
  Button,
  DescriptionList,
  DescriptionListItem,
  Dialog,
  Link,
  TextField,
} from '@snapshot-ui/react';
import { useState, type ReactElement } from 'react';

type Field = 'Name' | 'Nickname';

export default function DescriptionListActions(): ReactElement {
  const [values, setValues] = useState<Record<Field, string>>({
    Name: 'Everyday Visa',
    Nickname: 'Travel card',
  });
  // The field stays set while the dialog leaves, so its title does not change on the way out.
  const [field, setField] = useState<Field>('Name');
  const [isOpen, setOpen] = useState(false);
  const [draft, setDraft] = useState('');

  const open = (row: Field): void => {
    setDraft(values[row]);
    setField(row);
    setOpen(true);
  };

  /** An Edit for one row, shown as "Edit" and named with the term, so it reads "Edit Nickname". */
  const edit = (row: Field): ReactElement => (
    <Button
      variant="secondary"
      aria-label={`Edit ${row}`}
      onPress={() => {
        open(row);
      }}
    >
      Edit
    </Button>
  );

  return (
    <>
      <DescriptionList style={{ width: '100%' }}>
        <DescriptionListItem term="Name" actions={edit('Name')}>
          {values.Name}
        </DescriptionListItem>
        <DescriptionListItem term="Nickname" actions={edit('Nickname')}>
          {values.Nickname}
        </DescriptionListItem>
        {/* A status: the word in a Badge, and the fix as a link after it. A failed feed is an error. */}
        <DescriptionListItem term="Bank feed">
          <span className="row">
            <Badge tone="error">Failed</Badge>
            <Link href="#reconnect">Reconnect</Link>
          </span>
        </DescriptionListItem>
        {/* An account that is open is neutral: success means a save, not a state that is merely fine. */}
        <DescriptionListItem term="Status">
          <Badge>Active</Badge>
        </DescriptionListItem>
      </DescriptionList>
      <Dialog
        title={`Edit ${field}`}
        isOpen={isOpen}
        onOpenChange={setOpen}
        actions={({ close }) => (
          <>
            <Button variant="secondary" onPress={close}>
              Cancel
            </Button>
            <Button
              onPress={() => {
                setValues({ ...values, [field]: draft.trim() });
                close();
              }}
            >
              Save
            </Button>
          </>
        )}
      >
        <TextField label={field} value={draft} onChange={setDraft} />
      </Dialog>
    </>
  );
}
