'use client';

import { FileButton, FileDropZone, Text } from '@snapshot-ui/react';
import { useState, type ReactElement } from 'react';

const TEN_MB = 10 * 1024 * 1024;

export default function FileDropZoneReceipt(): ReactElement {
  const [added, setAdded] = useState<string | null>(null);
  const take = (accepted: File[]): void => {
    if (accepted[0] !== undefined) setAdded(accepted[0].name);
  };
  return (
    <div className="stack" style={{ width: '100%', maxWidth: '28rem' }}>
      <FileDropZone
        label="Receipt"
        description="PDF, JPG or PNG, up to 10 MB"
        acceptedFileTypes={['application/pdf', 'image/jpeg', 'image/png', '.heic']}
        maxFileSize={TEN_MB}
        labels={{
          rejected: (count) => (count === '1' ? '1 file was not added' : `${count} files were not added`),
        }}
        onFiles={take}
      />
      {/* On a phone only: a desktop browser ignores capture and opens the file picker. */}
      <span className="touch-only">
        <FileButton
          variant="secondary"
          capture="environment"
          acceptedFileTypes={['image/*', '.heic']}
          maxFileSize={TEN_MB}
          onFiles={take}
        >
          Take a photo
        </FileButton>
      </span>
      {added === null ? null : (
        <Text size="small" tone="muted" className="receipt-added">
          Added {added}
        </Text>
      )}
    </div>
  );
}
