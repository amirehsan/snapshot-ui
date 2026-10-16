import type { CSSProperties, ReactElement } from 'react';
import { cx } from '../utils/cx';

export interface SkeletonProps {
  /** @default 'line' */
  shape?: 'line' | 'block' | 'circle';
  /** A CSS length; a line defaults to 100% and a circle to 40px. A circle takes it as its diameter. */
  width?: string;
  /** A CSS length; a line is one line of the text it stands for. A circle without `width` takes it as its diameter. */
  height?: string;
  className?: string;
}

/**
 * A placeholder shape where content will be, so a loading page keeps its layout. It holds no text and is hidden from
 * assistive technology: the part that shows skeletons says "Loading" once, in its own status. Static, so a
 * server component renders it.
 */
export function Skeleton({ shape = 'line', width, height, className }: SkeletonProps): ReactElement {
  // Only the sizes given, so a skeleton with neither writes no style attribute.
  const sizes: CSSProperties = {};
  if (shape === 'circle') {
    // One diameter for both sides, so a circle given one size stays round.
    const diameter = width ?? height;
    if (diameter !== undefined) {
      sizes.inlineSize = diameter;
      sizes.blockSize = diameter;
    }
  } else {
    if (width !== undefined) sizes.inlineSize = width;
    if (height !== undefined) sizes.blockSize = height;
  }
  return (
    <span
      className={cx('skeleton', className)}
      data-shape={shape}
      aria-hidden="true"
      style={width === undefined && height === undefined ? undefined : sizes}
    />
  );
}
