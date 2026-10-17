'use client';

import { FileButton, PageDropZone, PageHeader, Switch, Text, type FileRejection } from '@snapshot-ui/react';
import { useState, type ReactElement } from 'react';

const TYPES = ['application/pdf', '.pdf', 'image/*', '.heic'];

export default function FileDropZonePage(): ReactElement {
  const [isOn, setOn] = useState(false);
  const [added, setAdded] = useState<string[]>([]);
  const [refused, setRefused] = useState<string[]>([]);
  const take = (accepted: File[], rejected: FileRejection[]): void => {
    setAdded((names) => [...accepted.map((file) => file.name), ...names].slice(0, 5));
    setRefused(rejected.map(({ file }) => file.name));
  };
  return (
    <div className="stack" style={{ width: '100%', maxWidth: '32rem' }}>
      {/* The page zone's keyboard twin: every page zone has a button in the page header's actions. */}
      <PageHeader
        title="Documents"
        actions={
          <FileButton acceptedFileTypes={TYPES} allowsMultiple onFiles={take}>
            Upload
          </FileButton>
        }
      />
      <Switch isSelected={isOn} onChange={setOn}>
        Drop anywhere on this page
      </Switch>
      <Text size="small" tone="muted" className="page-zone-added">
        {added.length === 0 ? 'Nothing added yet.' : `Added ${added.join(', ')}`}
      </Text>
      {refused.length === 0 ? null : (
        <Text size="small" tone="muted" className="page-zone-refused">
          {`Not added: ${refused.join(', ')}`}
        </Text>
      )}
      {/* In an app, mount the page zone at the page's root, beside its header: it draws its overlay in the shell. */}
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
