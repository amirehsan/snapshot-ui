'use client';

import { useContext, type KeyboardEvent, type ReactElement, type ReactNode, type Ref } from 'react';
import {
  RadioButton,
  RadioField,
  RadioGroup as RACRadioGroup,
  RadioGroupStateContext,
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
import { PAD_POSITIONS, padMove, type PadKey, type PadPosition } from './moves';

export type { PadPosition } from './moves';

export interface PositionPadBaseProps extends Omit<
  RACRadioGroupProps,
  'children' | 'className' | 'orientation' | 'value' | 'defaultValue' | 'onChange' | 'render'
> {
  /** The pad's name, shown above it with the Changed chip. Required unless the pad has an `aria-label` or an `aria-labelledby`. */
  label?: ReactNode;
  /** A hint under the pad. It becomes the group's accessible description. */
  description?: ReactNode;
  /**
   * The error line, shown only while the pad is invalid. A function receives the validation result. Without it the
   * pad shows its own validation messages.
   */
  errorMessage?: ReactNode | ((validation: ValidationResult) => ReactNode);
  /**
   * Whether the position differs from the saved one: the Changed chip in the label row and the light signal orange
   * edge on the track, as SegmentedControl. Without a visible `label` no chip shows, but the edge and
   * `data-changed` do.
   */
  isChanged?: boolean;
  /**
   * The text of the Changed chip.
   * @default 'Changed'
   */
  changedLabel?: string;
  /** The chosen position, controlled. */
  value?: PadPosition | null;
  /** The position chosen at first. */
  defaultValue?: PadPosition | null;
  /** Called with the new position, once per move. */
  onChange?: (value: PadPosition) => void;
  /** Positions that cannot be chosen: drawn disabled and skipped by the arrows. */
  disabledPositions?: readonly PadPosition[];
  /**
   * Each cell's name. English, for a left-to-right page.
   * @default 'Top left', 'Top', 'Top right', 'Left', 'Center', 'Right', 'Bottom left', 'Bottom', 'Bottom right'
   */
  labels?: Partial<Record<PadPosition, string>>;
  /** A class name, or a function of the pad's state, merged after the library's own classes. */
  className?: string | ((values: RadioGroupRenderProps & { defaultClassName: string | undefined }) => string);
  /** A ref to the pad's root element. */
  ref?: Ref<HTMLDivElement>;
}

/**
 * The props of PositionPad. The types require a name: a visible `label`, an `aria-label` or an `aria-labelledby`.
 */
export type PositionPadProps = PositionPadBaseProps & AccessibleName<'label'>;

/** The default names, for a left-to-right page. They never read the direction, so the server writes the same. */
const DEFAULT_LABELS: Record<PadPosition, string> = {
  'top-start': 'Top left',
  'top-center': 'Top',
  'top-end': 'Top right',
  'center-start': 'Left',
  center: 'Center',
  'center-end': 'Right',
  'bottom-start': 'Bottom left',
  'bottom-center': 'Bottom',
  'bottom-end': 'Bottom right',
};

const PAD_KEYS: readonly string[] = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'];

const isPadKey = (key: string): key is PadKey => PAD_KEYS.includes(key);

interface PadTrackProps {
  labels: Partial<Record<PadPosition, string>> | undefined;
  disabledPositions: readonly PadPosition[];
}

/**
 * The 3 by 3 track and its nine radios. It reads the group's state from React Aria's context, so the arrows it
 * handles set the value React Aria holds, and `onChange` and the native radios stay one with it.
 */
function PadTrack({ labels, disabledPositions }: PadTrackProps): ReactElement {
  const state = useContext(RadioGroupStateContext);
  // The capture phase runs before React Aria's group handler, which listens on the way up, and before the
  // browser's own radio arrows, which are its default action: a handled arrow stops both (spec 8.3, risk R4).
  const onKeyDownCapture = (event: KeyboardEvent<HTMLDivElement>): void => {
    const { key, target, currentTarget } = event;
    // A modified arrow is the browser's or the reader's, and React Aria's shortcuts leave it too.
    if (!isPadKey(key) || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
    if (event.nativeEvent.isComposing || state === null) return;
    if (!(target instanceof HTMLInputElement) || target.type !== 'radio') return;
    const from = PAD_POSITIONS.indexOf(target.value as PadPosition);
    if (from === -1) return;
    event.preventDefault();
    event.stopPropagation();
    const disabled = new Set(disabledPositions.map((position) => PAD_POSITIONS.indexOf(position)));
    // Read at the press, so a pad an app marks dir="ltr" on a right-to-left page keeps left as left.
    const isRtl = getComputedStyle(currentTarget).direction === 'rtl';
    const next = padMove(from, key, isRtl, disabled);
    const position = next === null ? undefined : PAD_POSITIONS[next];
    if (position === undefined) return;
    currentTarget.querySelector<HTMLInputElement>(`input[value="${position}"]`)?.focus();
    // React Aria's state does nothing while read only, so the arrows then move focus alone.
    state.setSelectedValue(position);
  };
  return (
    <div className="position-pad-track" onKeyDownCapture={onKeyDownCapture}>
      {PAD_POSITIONS.map((position) => (
        // React Aria's field wrapper is drawn as display: contents, so each cell is a grid item of the track.
        <RadioField
          key={position}
          value={position}
          className="position-pad-item"
          aria-label={labels?.[position] ?? DEFAULT_LABELS[position]}
          isDisabled={disabledPositions.includes(position)}
        >
          <RadioButton className="position-pad-cell" data-position={position}>
            <span className="position-pad-dot" aria-hidden="true" />
          </RadioButton>
        </RadioField>
      ))}
    </div>
  );
}

/**
 * A 3 by 3 choice of where something sits: nine radios in reading order, each named by its position, in a
 * concentric track. Left and Right run through all nine and wrap, mirrored in right to left; Up and Down follow
 * the column and stop at its ends. Built on React Aria's RadioGroup, so it is a radio group to a screen reader
 * and to a form, and the values, `top-start` to `bottom-end`, are the form values.
 */
export function PositionPad({
  label,
  description,
  errorMessage,
  isChanged = false,
  changedLabel,
  onChange,
  disabledPositions = [],
  labels,
  className,
  ...props
}: PositionPadProps): ReactElement {
  const { chipId, describedBy } = useChangedDescription({
    // Only a label row has a chip, so only a labelled pad has one to read.
    isChanged: isChanged && present(label),
    isInvalid: props.isInvalid,
    describedBy: props['aria-describedby'],
  });
  return (
    <RACRadioGroup
      {...props}
      onChange={
        onChange
          ? (value) => {
              onChange(value as PadPosition);
            }
          : undefined
      }
      aria-describedby={describedBy}
      data-changed={isChanged ? '' : undefined}
      className={composeRenderProps(className, (userClassName) =>
        cx('field', 'radio-group', 'position-pad', userClassName),
      )}
      // React Aria writes aria-orientation on its group, which means nothing for two axes, so the pad draws the
      // group's element without it (spec 8.4).
      render={(group) => <div {...group} aria-orientation={undefined} />}
    >
      {present(label) ? <FieldHead label={label} changedLabel={changedLabel} chipId={chipId} /> : null}
      <PadTrack labels={labels} disabledPositions={disabledPositions} />
      {present(description) ? <Description>{description}</Description> : null}
      <FieldError>{errorMessage}</FieldError>
    </RACRadioGroup>
  );
}
