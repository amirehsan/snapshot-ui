import type { HTMLAttributes, ReactElement, ReactNode, Ref } from 'react';
import { cx } from '../utils/cx';

export interface FieldChangedProps extends HTMLAttributes<HTMLSpanElement> {
  /**
   * The text of the chip.
   * @default 'Changed'
   */
  children?: ReactNode;
  ref?: Ref<HTMLSpanElement>;
}

/**
 * The clay "Changed" chip that marks an unsaved field. Put it in the field's
 * label row. It shows while the field's root has `data-changed` and hides
 * while it has `data-invalid`.
 */
export function FieldChanged({ children = 'Changed', className, ...props }: FieldChangedProps): ReactElement {
  return (
    <span {...props} className={cx('field-changed', className)}>
      {children}
    </span>
  );
}
