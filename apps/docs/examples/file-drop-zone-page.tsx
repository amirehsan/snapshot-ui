'use client';

import { FileButton, Heading, PageDropZone, Switch, Text } from '@snapshot-ui/react';
import { useState, type ReactElement } from 'react';

const TYPES = ['application/pdf', 'image/*', '.heic'];

export default function FileDropZonePage(): ReactElement {
  const [isOn, setOn] = useState(false);
  const [added, setAdded] = useState<string[]>([]);
  const take = (accepted: File[]): void => {
    setAdded((names) => [...accepted.map((file) => file.name), ...names].slice(0, 5));
  };
  return (
    <div className="stack" style={{ width: '100%', maxWidth: '32rem' }}>
      {/* The page zone's keyboard twin: every page zone has a button beside the page's title. */}
      <div className="row spread">
        <Heading level={3}>Documents</Heading>
        <FileButton acceptedFileTypes={TYPES} allowsMultiple onFiles={take}>
          Upload
        </FileButton>
      </div>
      <Switch isSelected={isOn} onChange={setOn}>
        Drop anywhere on this page
      </Switch>
      <Text size="small" tone="muted" className="page-zone-added">
        {added.length === 0 ? 'Nothing added yet.' : `Added ${added.join(', ')}`}
      </Text>
      {isOn ? (
        <PageDropZone
          title="Drop files to upload"
          description="To Documents, 2026"
          acceptedFileTypes={TYPES}
          allowsMultiple
          onFiles={take}
        />
      ) : null}
    </div>
  );
}
