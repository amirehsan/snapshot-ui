import { ProgressBar } from '@snapshot-ui/react';
import type { ReactElement } from 'react';

export default function ProgressBarIndeterminate(): ReactElement {
  return (
    <div className="sample-column">
      <ProgressBar label="Reading receipt.jpg" isIndeterminate />
    </div>
  );
}
