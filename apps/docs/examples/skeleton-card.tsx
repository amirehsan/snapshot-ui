import { Card, CardBody, Skeleton } from '@snapshot-ui/react';
import type { ReactElement } from 'react';

export default function SkeletonCard(): ReactElement {
  return (
    <div style={{ maxWidth: 480, marginInline: 'auto' }}>
      {/* The status sits outside the busy part; visually-hidden is this site's class, so use your own. */}
      <p role="status" className="visually-hidden">
        Loading
      </p>
      <div aria-busy="true">
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
    </div>
  );
}
