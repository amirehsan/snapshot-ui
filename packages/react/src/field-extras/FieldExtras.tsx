'use client';

import {
  useEffect,
  useId,
  useImperativeHandle,
  useRef,
  useState,
  type HTMLAttributes,
  type ReactElement,
  type ReactNode,
  type Ref,
  type RefObject,
} from 'react';
import { Button } from '../button/Button';
import { cx } from '../utils/cx';
import {
  afterCommit,
  firstFocusable,
  focusIsLost,
  focusNamedPlace,
  takesFocus,
} from '../utils/focus-after-commit';
import { useWarnOnce } from '../utils/useWarnOnce';

export interface FieldOffer {
  /**
   * The offered value as the app writes it: "24 hours", "$40.00". A string, so a figure among words of another
   * script is isolated with U+2068 and U+2069, which do in a string what `bdi` does in markup.
   */
  value: string;
  /** Whether the field already holds it. The offer is drawn only when it does not. */
  isCurrent: boolean;
  /** Sets the field to the offered value: the app's setter, the one the field's `onChange` calls. Nothing is saved. */
  onTake: () => void;
  /** Why it is offered, after the value: "from your last three months". Suggestion only. */
  reason?: ReactNode;
}

export interface FieldExtrasLabels {
  /** @default (value) => `Default: ${value}` */
  default: (value: string) => string;
  /** @default 'Reset to default' */
  reset: string;
  /** @default (value) => `Suggested: ${value}` */
  suggested: (value: string) => string;
  /** @default 'Use' */
  use: string;
  /**
   * Said politely after a default is taken, once focus is on the field, whose own words give its label and value.
   * @default 'Set to the default'
   */
  resetStatus: string;
  /**
   * Said politely after a suggestion is taken, once focus is on the field, whose own words give its label and
   * value. @default 'Set to the suggestion'
   */
  usedStatus: string;
}

export interface FieldExtrasProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  /** One field, or a group of fields (with scope="group"): a NumberField, a Select, a Switch, a Repeater. */
  children: ReactNode;
  /** The field's or the group's label as text, which ends each button's name: "Reset to default, Wait tiers". */
  fieldLabel: string;
  /** The control that takes focus after an offer is taken. Without it, the first control in `children` that takes focus. */
  controlRef?: RefObject<HTMLElement | null>;
  /** `field` stops at the field's measure; `group` spans the group and puts its offers under the whole of it. @default 'field' */
  scope?: 'field' | 'group';
  /** The default, and Reset to default. */
  defaultOffer?: FieldOffer;
  /** A suggested value, and Use. */
  suggestion?: FieldOffer;
  labels?: Partial<FieldExtrasLabels>;
  ref?: Ref<HTMLDivElement>;
}

const LABELS: FieldExtrasLabels = {
  default: (value) => `Default: ${value}`,
  reset: 'Reset to default',
  suggested: (value) => `Suggested: ${value}`,
  use: 'Use',
  resetStatus: 'Set to the default',
  usedStatus: 'Set to the suggestion',
};

/** How long a take's words stay in the status: long enough to be read, gone before a reader browses to stale news. */
const HOLD_MS = 5000;

const BUSY_WARNING =
  'A FieldExtras is inside aria-busy="true", so a screen reader may not say what an offer set: move it out of the busy part.';

type Kind = 'suggestion' | 'default';

/**
 * What the last take said, of which offer, and whether it spoke inside `aria-busy="true"`. Each take writes its
 * words as a new node with no key of its own: to be taken again an offer must be drawn again, which empties the
 * status, and taking the other offer draws the first one again, which empties it too.
 */
interface Said {
  words: string;
  kind: Kind;
  busy: boolean;
}

/**
 * The control a take leaves focused, read in the frame after the commit: `controlRef`'s element when it takes
 * focus, else the first control of the field or the group, else an offer still drawn, the field coming first in
 * the wrapper. A signed NumberField draws its sign button before its text box, so its text box, which reads the
 * value taken, stands in for the sign.
 */
function placeAfterTake(wrapper: HTMLElement, control: HTMLElement | null): HTMLElement | null {
  if (takesFocus(control)) return control;
  const first = firstFocusable(wrapper);
  return first?.closest('.number-field')?.querySelector<HTMLElement>('.number-field-input') ?? first;
}

/**
 * A line under a field, or under a group with `scope="group"`, that offers its default ("Default: 24 hours. Reset
 * to default") or a suggested value ("Suggested: $2,340, a month of your fixed bills. Use"), each drawn only while
 * the field does not hold it, the suggestion first. Taking one calls the app's setter and nothing else: it is an
 * ordinary edit, so the field's Changed chip, its checks and a SaveBar follow the app's own comparison. Each button
 * is named by its word and the field's label, and described by the offer's words; after a take focus goes to the
 * field's control in the frame after React's commit, never the body, and a polite status says what was set.
 */
export function FieldExtras({
  children,
  fieldLabel,
  controlRef,
  scope = 'field',
  defaultOffer,
  suggestion,
  labels: given,
  className,
  ref,
  ...props
}: FieldExtrasProps): ReactElement {
  const labels: FieldExtrasLabels = { ...LABELS, ...given };
  const wrapperRef = useRef<HTMLDivElement>(null);
  // The app's ref is given the wrapper itself.
  useImperativeHandle<HTMLDivElement | null, HTMLDivElement | null>(ref, () => wrapperRef.current, []);
  const id = useId();
  const [said, setSaid] = useState<Said | null>(null);
  const hold = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  // A take's move, cancelled with the hold if the part leaves first (the plan's rule for every frame).
  const cancelMove = useRef<(() => void) | undefined>(undefined);

  useEffect(
    () => () => {
      clearTimeout(hold.current);
      cancelMove.current?.();
    },
    [],
  );

  useWarnOnce(said?.busy ? BUSY_WARNING : null);

  // The suggestion first: it is about this reader, the default about everyone. One line when they say the same,
  // and none when the field holds the default, which is then the suggestion too.
  const drawn: [Kind, FieldOffer][] = [];
  if (suggestion && !suggestion.isCurrent && suggestion.value !== defaultOffer?.value) {
    drawn.push(['suggestion', suggestion]);
  }
  if (defaultOffer && !defaultOffer.isCurrent) drawn.push(['default', defaultOffer]);

  const take = (kind: Kind, taken: FieldOffer): void => {
    taken.onTake();
    const words = kind === 'default' ? labels.resetStatus : labels.usedStatus;
    cancelMove.current = afterCommit(() => {
      const wrapper = wrapperRef.current;
      if (!wrapper) return;
      // The pressed button or another part of the wrapper, the body (Safari leaves a pressed button unfocused,
      // Chromium blurs one that leaves) or nothing: the take's focus is ours to place. Focus the app took, into a
      // dialog that asks before a reset, means nothing is set yet: it stays there, and the status says nothing.
      if (!focusIsLost() && !wrapper.contains(document.activeElement)) return;
      focusNamedPlace(placeAfterTake(wrapper, controlRef?.current ?? null));
      // Said after the move: a screen reader reads the field focused, its label and new value, at once, and
      // would cut a polite status said before it; this follows with what happened, which those words do not say.
      setSaid({ words, kind, busy: wrapper.closest('[aria-busy="true"]') !== null });
      clearTimeout(hold.current);
      hold.current = setTimeout(() => {
        setSaid(null);
      }, HOLD_MS);
    });
  };

  return (
    <div {...props} ref={wrapperRef} className={cx('field-extras', className)} data-scope={scope}>
      {children}
      {drawn.map(([kind, each]) => {
        const textId = `${id}-${kind}`;
        const word = kind === 'default' ? labels.reset : labels.use;
        return (
          <p key={kind} className="field-offer" data-kind={kind}>
            <span id={textId} className="field-offer-text">
              {kind === 'default' ? labels.default(each.value) : labels.suggested(each.value)}
              {kind === 'suggestion' && each.reason != null ? <>, {each.reason}</> : null}
            </span>
            <Button
              variant="tertiary"
              className="field-offer-button"
              // Its word, then the field's label: the name starts with what is seen, for voice control.
              aria-label={`${word}, ${fieldLabel}`}
              aria-describedby={textId}
              onPress={() => {
                take(kind, each);
              }}
            >
              {word}
            </Button>
          </p>
        );
      })}
      <span className="field-extras-status" role="status" aria-live="polite" aria-atomic="true">
        {/* Only while the field holds what was taken: an offer still or again drawn, refused by the app's
            setter, typed away from or undone by a Cancel, empties it, since its words would be untrue. */}
        {said && !drawn.some(([kind]) => kind === said.kind) ? <span>{said.words}</span> : null}
      </span>
    </div>
  );
}
