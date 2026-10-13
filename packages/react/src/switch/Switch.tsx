'use client';

import type { ReactElement, ReactNode, Ref } from 'react';
import {
  SwitchButton as RACSwitchButton,
  SwitchField as RACSwitchField,
  type SwitchFieldProps as RACSwitchFieldProps,
  type SwitchFieldRenderProps,
  composeRenderProps,
} from 'react-aria-components';
import { Description } from '../field/Description';
import { FieldChanged } from '../field/FieldChanged';
import { useChangedDescription } from '../field/useChangedDescription';
import type { AccessibleName } from '../utils/accessible-name';
import { cx } from '../utils/cx';
import { present } from '../utils/present';

export interface SwitchBaseProps extends Omit<
  RACSwitchFieldProps,
  'children' | 'className' | 'isRequired' | 'isInvalid' | 'validate' | 'validationBehavior'
> {
  /**
   * The label, beside the track. Required unless the switch has an `aria-label` or an
   * `aria-labelledby`.
   */
  children?: ReactNode;
  /** A hint under the label. It becomes the switch's accessible description. */
  description?: ReactNode;
  /**
   * Whether the setting differs from the saved one. Shows the clay Changed chip
   * beside the label and a light signal orange ring around the track, and has a
   * screen reader read the chip with the switch. A switch without a visible
   * label draws the ring and no chip.
   */
  isChanged?: boolean;
  /**
   * The text of the Changed chip.
   * @default 'Changed'
   */
  changedLabel?: string;
  /**
   * A class name, or a function of the switch's state, merged after the library's own class. It goes
   * on the field's root, the element with the `field` class that also holds the hint, and not on the
   * row, which carries `switch`.
   */
  className?:
    string | ((values: SwitchFieldRenderProps & { defaultClassName: string | undefined }) => string);
  /** A ref to the field's root element, the one `className` goes on. */
  ref?: Ref<HTMLDivElement>;
  /** A ref to the input element. */
  inputRef?: Ref<HTMLInputElement>;
}

/**
 * The props of a switch. A name is required: its `children`, an `aria-label` or an `aria-labelledby`.
 */
export type SwitchProps = SwitchBaseProps & AccessibleName<'children'>;

/**
 * A setting that is on or off and takes effect as soon as it is flipped: a
 * 52px track with a round thumb, a label, an optional hint and the Changed
 * chip. It submits its `value` in a form only while it is on. Built on React
 * Aria's SwitchField and SwitchButton, so the control is a native checkbox with
 * the `switch` role. It has no required or invalid state; for a choice that is
 * confirmed later, use a Checkbox.
 */
export function Switch({
  children,
  description,
  isChanged = false,
  changedLabel,
  className,
  ...props
}: SwitchProps): ReactElement {
  const hasLabel = present(children);
  const { chipId, describedBy } = useChangedDescription({
    // Only a switch with a visible label has a chip to read.
    isChanged: isChanged && hasLabel,
    describedBy: props['aria-describedby'],
  });
  return (
    <RACSwitchField
      {...props}
      aria-describedby={describedBy}
      data-changed={isChanged ? '' : undefined}
      className={composeRenderProps(className, (userClassName) => cx('field', userClassName))}
    >
      <div className="field-head">
        <RACSwitchButton className="switch">
          <span className="switch-track" aria-hidden="true">
            <span className="switch-thumb" />
          </span>
          {hasLabel ? <span className="switch-text">{children}</span> : null}
        </RACSwitchButton>
        {hasLabel ? <FieldChanged id={chipId}>{changedLabel}</FieldChanged> : null}
      </div>
      {present(description) ? <Description>{description}</Description> : null}
    </RACSwitchField>
  );
}
