'use client';

import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ReactElement,
  type ReactNode,
  type Ref,
} from 'react';
import {
  RadioButton,
  RadioField,
  RadioGroup as RACRadioGroup,
  type RadioButtonRenderProps,
  type RadioFieldProps,
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
import { mergeRefs } from '../utils/merge-refs';
import { present } from '../utils/present';
import { useWarnOnce } from '../utils/useWarnOnce';

export interface ChoiceCardsBaseProps extends Omit<
  RACRadioGroupProps,
  'children' | 'className' | 'orientation'
> {
  /**
   * The group's name, shown above the cards. Required unless the group has an `aria-label` or an
   * `aria-labelledby`.
   */
  label?: ReactNode;
  /** A hint under the cards. It becomes the group's accessible description. */
  description?: ReactNode;
  /**
   * The error line, shown only while the group is invalid. A function receives the validation result. Without
   * it the group shows its own validation messages.
   */
  errorMessage?: ReactNode | ((validation: ValidationResult) => ReactNode);
  /**
   * Whether the choice differs from the saved one. Shows the clay Changed chip in the label row and draws no
   * edge, as RadioGroup does. Without a visible `label` no chip shows, but `data-changed` is still set.
   */
  isChanged?: boolean;
  /**
   * The text of the Changed chip.
   * @default 'Changed'
   */
  changedLabel?: string;
  /**
   * `list` stacks full-width cards with the icon or picture at the start; `grid` lays them out in columns at
   * least `--choice-cards-min` wide (12rem) with the icon or picture on top.
   * @default 'list'
   */
  layout?: 'list' | 'grid';
  /** The choices: `ChoiceCard` elements. */
  children: ReactNode;
  /** A class name, or a function of the group's state, merged after the library's own classes. */
  className?: string | ((values: RadioGroupRenderProps & { defaultClassName: string | undefined }) => string);
  /** A ref to the group's root element. */
  ref?: Ref<HTMLDivElement>;
}

/**
 * The props of a group of choice cards. A name is required: its `label`, an `aria-label` or an
 * `aria-labelledby`.
 */
export type ChoiceCardsProps = ChoiceCardsBaseProps & AccessibleName<'label'>;

export interface ChoiceCardBaseProps extends Omit<RadioFieldProps, 'children' | 'className' | 'style'> {
  /**
   * The title: the radio's whole accessible name. Required unless the card has an `aria-label` or an
   * `aria-labelledby`.
   */
  children?: ReactNode;
  /** A sentence under the title, in slate. The radio's description. */
  description?: ReactNode;
  /** A short value at the title line's end: "$12 a month", "Free". Part of the description, after the sentence. */
  detail?: ReactNode;
  /** A 24px icon, such as a Lucide icon. Decoration: hidden from assistive technology. */
  icon?: ReactNode;
  /**
   * An `<img alt="">` or a `<picture>`: on top in the grid, a 4rem thumbnail at the start in the list.
   * Decoration: hidden from assistive technology, so give it an empty `alt`.
   */
  picture?: ReactNode;
  /** A class name, or a function of the card's state, merged after the library's own class. */
  className?:
    string | ((values: RadioButtonRenderProps & { defaultClassName: string | undefined }) => string);
  /** A ref to the card, the `label` element. */
  ref?: Ref<HTMLLabelElement>;
  /** A ref to the native radio input. */
  inputRef?: Ref<HTMLInputElement>;
}

/**
 * The props of a choice card. A name is required: its `children`, the title, or an `aria-label` or an
 * `aria-labelledby`.
 */
export type ChoiceCardProps = ChoiceCardBaseProps & AccessibleName<'children'>;

/**
 * A single choice drawn as cards: React Aria's radio group, with its one tab stop, its arrow keys, its native
 * radios, its form value and its reset, on RadioGroup's field. Cards stack in a list, or tile in an auto-filling
 * grid with `layout="grid"`.
 */
export function ChoiceCards({
  label,
  description,
  errorMessage,
  isChanged = false,
  changedLabel,
  layout = 'list',
  children,
  className,
  ...props
}: ChoiceCardsProps): ReactElement {
  const { chipId, describedBy } = useChangedDescription({
    // Only a label row has a chip, so only a labelled group has one to read.
    isChanged: isChanged && present(label),
    isInvalid: props.isInvalid,
    describedBy: props['aria-describedby'],
  });
  return (
    <RACRadioGroup
      {...props}
      // A grid runs in rows, so Left and Right mirror in right to left; a list is a stack, as RadioGroup's.
      orientation={layout === 'grid' ? 'horizontal' : 'vertical'}
      aria-describedby={describedBy}
      data-layout={layout}
      data-changed={isChanged ? '' : undefined}
      className={composeRenderProps(className, (userClassName) =>
        cx('field', 'radio-group', 'choice-cards', userClassName),
      )}
    >
      {present(label) ? <FieldHead label={label} changedLabel={changedLabel} chipId={chipId} /> : null}
      <div className="choice-cards-items">{children}</div>
      {present(description) ? <Description>{description}</Description> : null}
      <FieldError>{errorMessage}</FieldError>
    </RACRadioGroup>
  );
}

/** What a card may not hold: a control inside a control. Its own radio is passed over. */
const CONTROLS = 'a[href], button, input, select, textarea';

/**
 * One choice of a `ChoiceCards`: a card that is a `label` around a native radio, named by its title alone and
 * described by its sentence and then its detail, with an icon or a picture as decoration. A press anywhere on it
 * chooses it, before the page's scripts run too.
 */
export function ChoiceCard({
  children,
  description,
  detail,
  icon,
  picture,
  className,
  ref,
  inputRef,
  ...props
}: ChoiceCardProps): ReactElement {
  const id = useId();
  const titleId = `${id}-title`;
  const detailId = `${id}-detail`;
  const descriptionId = `${id}-description`;
  const hasTitle = present(children);
  const hasDetail = present(detail);
  const hasDescription = present(description);
  const hasPicture = present(picture);
  const hasIcon = present(icon);

  // An app's own name wins over the title, so the title only names the radio when the app gave none.
  const named = props['aria-label'] !== undefined || props['aria-labelledby'] !== undefined;
  const labelledBy = named ? props['aria-labelledby'] : hasTitle ? titleId : undefined;
  // The sentence, then the detail, after any description the app gives; React Aria adds the group's own after.
  const describedBy =
    [props['aria-describedby'], hasDescription ? descriptionId : null, hasDetail ? detailId : null]
      .filter(Boolean)
      .join(' ') || undefined;

  const ownCardRef = useRef<HTMLLabelElement>(null);
  const cardRefs = useMemo(() => mergeRefs(ref, ownCardRef), [ref]);

  useWarnOnce(
    hasIcon && hasPicture
      ? 'ChoiceCard: pass an icon or a picture, not both. The card draws the picture.'
      : null,
  );

  // A card is a label, so a link, a button or an input in it is a control inside a control. Read after each
  // commit that changes what the card holds, in development builds and production alike: nothing is removed.
  const [holdsControl, setHoldsControl] = useState(false);
  useEffect(() => {
    const element = ownCardRef.current;
    if (!element) return;
    // The card's own radio is the first input, in React Aria's visually hidden span.
    const own = element.querySelector('input');
    setHoldsControl([...element.querySelectorAll(CONTROLS)].some((control) => control !== own));
  }, [children, description, detail, icon, picture]);
  useWarnOnce(
    holdsControl
      ? 'ChoiceCard: a card is a label, so it must not hold a link, a button or an input. Choosing the card ' +
          'is its only action.'
      : null,
  );

  return (
    <RadioField
      {...props}
      aria-labelledby={labelledBy}
      aria-describedby={describedBy}
      inputRef={inputRef}
      className="choice-card-field"
    >
      <RadioButton
        ref={cardRefs}
        className={composeRenderProps(className, (userClassName) => cx('choice-card', userClassName))}
      >
        {hasPicture || hasIcon ? (
          <span className="choice-card-media" data-media={hasPicture ? 'picture' : 'icon'} aria-hidden="true">
            {hasPicture ? picture : icon}
          </span>
        ) : null}
        <span className="choice-card-text">
          {hasTitle ? (
            <span id={titleId} className="choice-card-title">
              {children}
            </span>
          ) : null}
          {hasDetail ? (
            <span id={detailId} className="choice-card-detail">
              {detail}
            </span>
          ) : null}
          {hasDescription ? (
            <span id={descriptionId} className="choice-card-description">
              {description}
            </span>
          ) : null}
        </span>
        <span className="radio-indicator" aria-hidden="true" />
      </RadioButton>
    </RadioField>
  );
}
