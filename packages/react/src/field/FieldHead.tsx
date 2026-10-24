'use client';

import { useContext, type ReactElement, type ReactNode } from 'react';
import { FieldErrorContext } from 'react-aria-components';
import { FieldChanged } from './FieldChanged';
import { Label } from './Label';

export interface FieldHeadProps {
  /** The field's label. */
  label: ReactNode;
  /**
   * The text of the Changed chip.
   * @default 'Changed'
   */
  changedLabel?: string;
  /** The id of the chip, from `useChangedDescription`. */
  chipId: string;
  /** What else the row holds after the chip, such as TagInput's count against its limit. */
  children?: ReactNode;
}

/**
 * The label row of a field: the Label and the Changed chip, in the `field-head`
 * row. It must sit inside a React Aria field, which is what ties the label to
 * the control. The stylesheet shows the chip while the field's root has
 * `data-changed`. The chip also leaves the page while the field is invalid, by
 * any cause: a chip that is only hidden is still read when `aria-describedby`
 * names it, and validation that React Aria runs (a required field, a `validate`
 * function) is not something the field's own props can see.
 *
 * Internal: every field with a label row renders it. Not exported from the package.
 */
export function FieldHead({ label, changedLabel, chipId, children }: FieldHeadProps): ReactElement {
  const isInvalid = useContext(FieldErrorContext)?.isInvalid === true;
  return (
    <div className="field-head">
      <Label>{label}</Label>
      {isInvalid ? null : <FieldChanged id={chipId}>{changedLabel}</FieldChanged>}
      {children}
    </div>
  );
}
