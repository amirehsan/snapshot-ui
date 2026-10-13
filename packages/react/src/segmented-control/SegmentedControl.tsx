'use client';

import { useRef, type ReactElement, type ReactNode, type Ref } from 'react';
import {
  RadioGroup as RACRadioGroup,
  type RadioGroupProps as RACRadioGroupProps,
  type RadioGroupRenderProps,
  type ValidationResult,
  composeRenderProps,
} from 'react-aria-components';
import { Description } from '../field/Description';
import { FieldError } from '../field/FieldError';
import { FieldHead } from '../field/FieldHead';
import { useChangedDescription } from '../field/useChangedDescription';
import type { AccessibleName } from '../utils/accessible-name';
import { cx } from '../utils/cx';
import { present } from '../utils/present';
import { useStacking } from './useStacking';

export type SegmentedControlSize = 'md' | 'sm';

export interface SegmentedControlBaseProps extends Omit<
  RACRadioGroupProps,
  'children' | 'className' | 'orientation'
> {
  /**
   * The control's name, shown above it with the Changed chip. Required unless the control has an
   * `aria-label` or an `aria-labelledby`.
   */
  label?: ReactNode;
  /** A hint under the control. It becomes the group's accessible description. */
  description?: ReactNode;
  /**
   * The error line, shown only while the control is invalid. A function
   * receives the validation result. Without it the control shows its own
   * validation messages.
   */
  errorMessage?: ReactNode | ((validation: ValidationResult) => ReactNode);
  /**
   * Whether the value differs from the saved one. Shows the clay Changed chip
   * in the label row and the light signal orange edge on the track, and has a
   * screen reader read the chip with the control. An invalid control shows its
   * error instead.
   */
  isChanged?: boolean;
  /**
   * The text of the Changed chip.
   * @default 'Changed'
   */
  changedLabel?: string;
  /**
   * `md` is a 48px track of 40px options. `sm` is a 40px track whose 32px
   * options are still hit at 40px, for a toolbar or a header.
   * @default 'md'
   */
  size?: SegmentedControlSize;
  /** The options: SegmentedControlItem elements, each with its own `value`. */
  children?: ReactNode;
  /** A class name, or a function of the control's state, merged after the library's own classes. */
  className?: string | ((values: RadioGroupRenderProps & { defaultClassName: string | undefined }) => string);
  /** A ref to the control's root element. */
  ref?: Ref<HTMLDivElement>;
}

/**
 * The props of SegmentedControl. The types require a name: a visible `label`, an `aria-label` or an
 * `aria-labelledby`.
 */
export type SegmentedControlProps = SegmentedControlBaseProps & AccessibleName<'label'>;

/**
 * A few short options seen at once, of which one is chosen. Built on React
 * Aria's RadioGroup, so it is a radio group to a screen reader and to a form.
 * When its row of options does not fit the room it has, it stacks them one
 * per row.
 */
export function SegmentedControl({
  label,
  description,
  errorMessage,
  isChanged = false,
  changedLabel,
  size = 'md',
  children,
  className,
  ...props
}: SegmentedControlProps): ReactElement {
  const roomRef = useRef<HTMLSpanElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  useStacking(roomRef, trackRef, size);
  const { chipId, describedBy } = useChangedDescription({
    // Only a label row has a chip, so only a labelled control has one to read.
    isChanged: isChanged && present(label),
    isInvalid: props.isInvalid,
    describedBy: props['aria-describedby'],
  });
  return (
    <RACRadioGroup
      {...props}
      orientation="horizontal"
      aria-describedby={describedBy}
      data-changed={isChanged ? '' : undefined}
      className={composeRenderProps(className, (userClassName) =>
        cx('field', 'segmented', size !== 'md' && `segmented-${size}`, userClassName),
      )}
    >
      {present(label) ? <FieldHead label={label} changedLabel={changedLabel} chipId={chipId} /> : null}
      <div ref={trackRef} className="segmented-track">
        {children}
      </div>
      {present(description) ? <Description>{description}</Description> : null}
      <FieldError>{errorMessage}</FieldError>
      <span ref={roomRef} className="segmented-room" aria-hidden="true" />
    </RACRadioGroup>
  );
}
