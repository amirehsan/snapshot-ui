import { Card, CardBody, Skeleton } from '@snapshot-ui/react';
import type { ReactElement } from 'react';

export default function SkeletonCard(): ReactElement {
  return (
    <div aria-busy="true" style={{ maxWidth: 480, marginInline: 'auto' }}>
      <p role="status" className="visually-hidden">
        Loading
      </p>
      <Card>
        <CardBody>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-part)' }}>
            <Skeleton shape="circle" />
            <div style={{ flex: 1, display: 'grid', gap: '0.25rem' }}>
              <Skeleton width="60%" />
              <Skeleton width="40%" />
            </div>
          </div>
          <Skeleton shape="block" height="6rem" />
        </CardBody>
      </Card>
    </div>
  );
}
