import { Skeleton } from '@snapshot-ui/react';
import type { ReactElement } from 'react';

export default function SkeletonShapes(): ReactElement {
  return (
    <div
      style={{ display: 'grid', gap: 'var(--spacing-part)', width: 'min(28rem, 100%)', marginInline: 'auto' }}
    >
      <Skeleton />
      <Skeleton width="12rem" />
      <Skeleton shape="block" />
      <Skeleton shape="circle" />
    </div>
  );
}
