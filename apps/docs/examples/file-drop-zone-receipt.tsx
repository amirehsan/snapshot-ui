'use client';

import { FileButton, FileDropZone, Text } from '@snapshot-ui/react';
import { useState, type ReactElement } from 'react';

const TEN_MB = 10 * 1024 * 1024;

/** Each type by its MIME type and its extensions, since systems disagree on types; HEIC for a phone's photos. */
const TYPES = [
  'application/pdf',
  '.pdf',
  'image/jpeg',
  '.jpg',
  '.jpeg',
  'image/png',
  '.png',
  'image/heic',
  '.heic',
];

export default function FileDropZoneReceipt(): ReactElement {
  const [added, setAdded] = useState<string | null>(null);
  const take = (accepted: File[]): void => {
    if (accepted[0] !== undefined) setAdded(accepted[0].name);
  };
  return (
    <div className="stack" style={{ width: '100%', maxWidth: '28rem' }}>
      <FileDropZone
        label="Receipt"
        description="PDF, JPG, PNG or HEIC, up to 10 MB"
        acceptedFileTypes={TYPES}
        maxFileSize={TEN_MB}
        onFiles={take}
      />
      {/* On a phone only, beside the zone rather than on its button, which would then take photos only: a desktop
          browser ignores capture and opens the file picker. */}
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
