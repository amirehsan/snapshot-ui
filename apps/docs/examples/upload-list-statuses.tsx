'use client';

import { Card, UploadList, type UploadItem } from '@snapshot-ui/react';
import { useState, type ReactElement } from 'react';
import { UPLOADS } from './uploads-data';

export default function UploadListStatuses(): ReactElement {
  const [items, setItems] = useState<UploadItem[]>(UPLOADS);
  const drop = (id: UploadItem['id']): void => {
    setItems((each) => each.filter((item) => item.id !== id));
  };
  return (
    <Card style={{ width: '100%', maxWidth: '28rem', paddingInline: 0, paddingBlock: 'var(--spacing-part)' }}>
      <UploadList
        aria-label="Uploads"
        items={items}
        onRemove={drop}
        onCancel={drop}
        onRetry={(id) => {
          // Retried at once, as a fresh upload: the app would send the file again.
          setItems((each) =>
            each.map((item) =>
              item.id === id
                ? { id, name: item.name, status: 'uploading', progress: 0, progressLabel: '0 of 12 MB' }
                : item,
            ),
          );
        }}
      />
    </Card>
  );
}
