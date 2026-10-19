'use client';

import {
  useEffect,
  useId,
  useMemo,
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
import { mergeRefs } from '../utils/merge-refs';
import { useWarnOnce } from '../utils/useWarnOnce';

export interface FieldOffer {
  /** The offered value as the app writes it: "24 hours", "$40.00". Wrap figures in another script in `bdi`. */
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
  /** Said politely after a default is taken. @default (field, value) => `${field} reset to its default, ${value}` */
  resetStatus: (field: string, value: string) => string;
  /** Said politely after a suggestion is taken. @default (field, value) => `${field} set to ${value}` */
  usedStatus: (field: string, value: string) => string;
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
  resetStatus: (field, value) => `${field} reset to its default, ${value}`,
  usedStatus: (field, value) => `${field} set to ${value}`,
};

/** How long a take's words stay in the status: long enough to be read, gone before a reader browses to stale news. */
const HOLD_MS = 5000;

const BUSY_WARNING =
  'A FieldExtras is inside aria-busy="true", so a screen reader may not say what an offer set: move it out of the busy part.';

type Kind = 'suggestion' | 'default';

/** What the last take said, and which take it was, so each take writes its words as a new node. */
interface Said {
  words: string;
  take: number;
}

/**
 * The control a take leaves focused, read in the frame after the commit: `controlRef`'s element when it takes
 * focus, else the first control of the field or the group (not of the offers), else an offer still drawn.
 */
function placeAfterTake(wrapper: HTMLElement, control: HTMLElement | null): HTMLElement | null {
  if (takesFocus(control)) return control;
  for (const child of wrapper.children) {
    if (child.matches('.field-offer, .field-extras-status')) continue;
    if (child instanceof HTMLElement && takesFocus(child)) return child;
    const found = firstFocusable(child);
    if (found) return found;
  }
  return wrapper.querySelector<HTMLElement>('.field-offer-button');
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
  // Memoized, so React does not detach and attach the root's refs on every render.
  const refs = useMemo(() => mergeRefs<HTMLDivElement>(ref, wrapperRef), [ref]);
  const id = useId();
  const [said, setSaid] = useState<Said | null>(null);
  const [busy, setBusy] = useState(false);
  const takes = useRef(0);
  const hold = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const cancelMove = useRef<(() => void) | undefined>(undefined);

  useEffect(
    () => () => {
      clearTimeout(hold.current);
      cancelMove.current?.();
    },
    [],
  );

  useWarnOnce(busy ? BUSY_WARNING : null);

  // The suggestion first: it is about this reader, the default about everyone. One line when they say the same.
  const drawn: [Kind, FieldOffer][] = [];
  const sameAsDefault =
    defaultOffer !== undefined && !defaultOffer.isCurrent && suggestion?.value === defaultOffer.value;
  if (suggestion && !suggestion.isCurrent && !sameAsDefault) drawn.push(['suggestion', suggestion]);
  if (defaultOffer && !defaultOffer.isCurrent) drawn.push(['default', defaultOffer]);

  const take = (kind: Kind, taken: FieldOffer, button: Element): void => {
    taken.onTake();
    takes.current += 1;
    const wrapper = wrapperRef.current;
    if (wrapper?.closest('[aria-busy="true"]')) setBusy(true);
    setSaid({
      words:
        kind === 'default'
          ? labels.resetStatus(fieldLabel, taken.value)
          : labels.usedStatus(fieldLabel, taken.value),
      take: takes.current,
    });
    clearTimeout(hold.current);
    hold.current = setTimeout(() => {
      setSaid(null);
    }, HOLD_MS);
    cancelMove.current?.();
    cancelMove.current = afterCommit(() => {
      if (!wrapper?.isConnected) return;
      // The pressed button, the body (Safari leaves a pressed button unfocused, Chromium blurs one that leaves),
      // or nothing: the take's focus is ours to place. Focus the app moved elsewhere, into a dialog its setter
      // opened, stays there.
      const active = document.activeElement;
      if (!focusIsLost() && active !== button && !wrapper.contains(active)) return;
      focusNamedPlace(placeAfterTake(wrapper, controlRef?.current ?? null));
    });
  };

  return (
    <div {...props} ref={refs} className={cx('field-extras', className)} data-scope={scope}>
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
              onPress={(event) => {
                take(kind, each, event.target);
              }}
            >
              {word}
            </Button>
          </p>
        );
      })}
      <span className="field-extras-status" role="status" aria-live="polite" aria-atomic="true">
        {said ? <span key={said.take}>{said.words}</span> : null}
      </span>
    </div>
  );
}
