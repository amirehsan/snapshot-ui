'use client';

import { FileButton, Text } from '@snapshot-ui/react';
import { useState, type ReactElement } from 'react';

export default function FileButtonBasic(): ReactElement {
  const [chosen, setChosen] = useState<string[]>([]);
  const take = (accepted: File[]): void => {
    setChosen(accepted.map((file) => file.name));
  };
  return (
    <div className="stack">
      <div className="row">
        <FileButton acceptedFileTypes={['application/pdf']} allowsMultiple onFiles={take}>
          Upload
        </FileButton>
        <FileButton variant="secondary" acceptedFileTypes={['image/*', '.heic']} onFiles={take}>
          Choose a photo
        </FileButton>
      </div>
      <Text size="small" tone="muted">
        {chosen.length === 0 ? 'No file chosen.' : `Chosen: ${chosen.join(', ')}`}
      </Text>
    </div>
  );
}
