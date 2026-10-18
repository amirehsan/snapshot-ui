import { Breadcrumb, Breadcrumbs } from '@snapshot-ui/react';
import type { ReactElement } from 'react';

export default function BreadcrumbsBasic(): ReactElement {
  return (
    // The trail takes the width it is given, as at the top of a page; the stage would center it at its own.
    <div style={{ width: '100%' }}>
      <Breadcrumbs>
        <Breadcrumb href="/docs">Home</Breadcrumb>
        <Breadcrumb href="/docs/components/upload-tray">Documents</Breadcrumb>
        <Breadcrumb>Receipts, 2026</Breadcrumb>
      </Breadcrumbs>
    </div>
  );
}
