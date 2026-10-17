'use client';

import { useContext, type ReactElement } from 'react';
import { FieldErrorContext } from 'react-aria-components';

export interface FieldChangedMarkProps {
  /** The mark's id, from `useChangedDescription`, which the field names in `aria-describedby`. */
  id: string;
  /**
   * The words the mark stands for, read with the field and never shown.
   * @default 'Changed'
   */
  label?: string;
}

/**
 * The changed mark of a field with no label: a clay dot in the field's frame that holds the word
 * "Changed", clipped to the dot, so a review grid of unlabelled fields says which changed in words as well as in
 * the edge. The field names it in `aria-describedby` while it is changed and valid. It leaves the page while the
 * field is invalid, by any cause, as the chip does (`FieldHead`): validation React Aria runs is not something the
 * field's own props can see.
 *
 * Internal: every framed field renders it while changed and unlabelled. Not exported from the package.
 */
export function FieldChangedMark({ id, label = 'Changed' }: FieldChangedMarkProps): ReactElement | null {
  const isInvalid = useContext(FieldErrorContext)?.isInvalid === true;
  if (isInvalid) return null;
  return (
    <span id={id} className="field-changed-mark">
      {label}
    </span>
  );
}
