'use client';

import {
  Breadcrumb,
  Breadcrumbs,
  FileButton,
  PageColumn,
  PageDropZone,
  PageHeader,
  RouterProvider,
  Switch,
  Text,
} from '@snapshot-ui/react';
import { useRouter } from 'next/navigation';
import { useState, type ReactElement } from 'react';

const TYPES = ['application/pdf', '.pdf', 'image/*', '.heic'];

export default function PageHeaderDocuments(): ReactElement {
  const router = useRouter();
  const [isOn, setOn] = useState(false);
  const [added, setAdded] = useState<string[]>([]);
  const take = (accepted: File[]): void => {
    setAdded((names) => [...accepted.map((file) => file.name), ...names].slice(0, 5));
  };
  return (
    <RouterProvider
      navigate={(href) => {
        router.push(href);
      }}
    >
      <div style={{ width: '100%' }}>
        <PageHeader
          breadcrumbs={
            <Breadcrumbs>
              <Breadcrumb href="/docs">Home</Breadcrumb>
              <Breadcrumb href="/docs/components/upload-tray">Documents</Breadcrumb>
              <Breadcrumb>Receipts, 2026</Breadcrumb>
            </Breadcrumbs>
          }
          eyebrow="Documents"
          title="Receipts, 2026"
          description="Every receipt you uploaded this year, read and filed by month."
          actions={
            // The page zone's keyboard twin, in the header beside the title it uploads to.
            <FileButton acceptedFileTypes={TYPES} allowsMultiple onFiles={take}>
              Upload
            </FileButton>
          }
        />
        <PageColumn className="stack">
          <Switch isSelected={isOn} onChange={setOn}>
            Drop anywhere on this page
          </Switch>
          <Text size="small" tone="muted">
            {added.length === 0 ? 'Nothing added yet.' : `Added ${added.join(', ')}`}
          </Text>
        </PageColumn>
        {/* In an app, mount the page zone at the page's root, beside its header: it draws its overlay in the shell. */}
        {isOn ? (
          <PageDropZone
            title="Drop files to upload"
            description="To Receipts, 2026"
            acceptedFileTypes={TYPES}
            allowsMultiple
            onFiles={take}
          />
        ) : null}
      </div>
    </RouterProvider>
  );
}
