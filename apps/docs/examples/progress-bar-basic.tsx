import { ProgressBar } from '@snapshot-ui/react';
import type { ReactElement } from 'react';

export default function ProgressBarBasic(): ReactElement {
  return (
    <div className="sample-column">
      <ProgressBar label="Uploading invoice.pdf" value={45} />
      <ProgressBar label="Uploading statement.pdf" value={1.2} maxValue={4} valueLabel="1.2 of 4 MB" />
    </div>
  );
}
