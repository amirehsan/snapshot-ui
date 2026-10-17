'use client';

import { FileDropZone, type FileRejection, type FileRejectionReason } from '@snapshot-ui/react';
import { useState, type ReactElement } from 'react';

const TEN_MB = 10 * 1024 * 1024;

/** Each reason in GOV.UK's words for a file upload's errors. */
const WORDS: Record<FileRejectionReason, string> = {
  type: 'must be a PDF, JPG or PNG',
  size: 'must be smaller than 10 MB',
  empty: 'is empty',
  count: 'was one too many: add up to 5 files at a time',
};

export default function FileDropZoneErrors(): ReactElement {
  const [refused, setRefused] = useState<FileRejection[]>([]);
  return (
    <div style={{ width: '100%', maxWidth: '32rem' }}>
      <FileDropZone
        label="Statements"
        description="PDF, JPG or PNG, up to 10 MB each, 5 at a time"
        acceptedFileTypes={['application/pdf', 'image/jpeg', 'image/png']}
        maxFileSize={TEN_MB}
        allowsMultiple
        maxFiles={5}
        errorMessage={refused.map(({ file, reason }, index) => (
          <span key={`${file.name}-${String(index)}`} style={{ display: 'block' }}>
            {`The selected file ${file.name} ${WORDS[reason]}`}
          </span>
        ))}
        onFiles={(_accepted, rejected) => {
          setRefused(rejected);
        }}
      />
    </div>
  );
}
