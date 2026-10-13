'use client';

import { ChevronDown } from 'lucide-react';
import {
  createElement,
  useRef,
  useState,
  type HTMLAttributes,
  type ReactElement,
  type ReactNode,
  type Ref,
} from 'react';
import {
  Button as RACButton,
  Disclosure as RACDisclosure,
  DisclosurePanel as RACDisclosurePanel,
} from 'react-aria-components';
import { useChangedDescription } from '../field/useChangedDescription';
import { cx } from '../utils/cx';
import { present } from '../utils/present';
import { useStoredFold } from './foldStore';
import { useHoldsChange, useOpenOnInvalid } from './useFoldedFields';
import { useFolding } from './useFolding';

export interface CollapsibleCardProps extends Omit<HTMLAttributes<HTMLElement>, 'title'> {
  /** The title, drawn as the card title. It is the toggle's text and its accessible name. */
  title: ReactNode;
  /**
   * The heading element of the title, `h1` to `h4`, so the card fits the page's outline. The look is
   * the same at every level.
   * @default 2
   */
  level?: 1 | 2 | 3 | 4;
  /** The line under the title, drawn as a card note. It stays visible while the card is folded. */
  note?: ReactNode;
  /**
   * Controls at the end of the header row, such as a Reset button. They are never inside the toggle,
   * and they stay visible and usable while the card is folded.
   */
  actions?: ReactNode;
  /**
   * Whether the card is open on the first render, when neither `isExpanded` nor `storageKey` decides it.
   * @default true
   */
  defaultExpanded?: boolean;
  /**
   * Whether the card is open. Given, it controls the card: pair it with `onExpandedChange`. It wins over
   * `storageKey`, and the card then reads and stores nothing.
   */
  isExpanded?: boolean;
  /**
   * Called with the new state when someone opens or folds this card, by its toggle or by find-in-page. A
   * card that follows another card or tab with the same `storageKey` is syncing state, not being used, and
   * does not call it.
   */
  onExpandedChange?: (isExpanded: boolean) => void;
  /**
   * Remembers the fold in this browser under this key, so the card is folded again the next time the page
   * opens. Cards with the same key fold together, on the page and in other tabs. A card whose key the
   * browser has not stored is open, whatever `defaultExpanded` says. Ignored when `isExpanded` is given.
   * The server cannot see the browser's storage, so a server-rendered card is drawn open and folds, with no
   * transition, once the page has hydrated. Where the browser blocks storage or refuses a write, a fold lasts
   * only while a card with a `storageKey` is on the page.
   */
  storageKey?: string;
  /**
   * Marks a folded card as holding a change even when no field inside says so. A folded card already marks
   * itself while any element in its body carries `data-changed`, as every library field's root does while
   * it is changed, so this is for a change the card's fields do not report. While folded, the marker is a
   * clay dot after the title, and the toggle is described by `changedLabel`. Open, the card shows no marker,
   * and each field shows its own Changed chip. While it is true, the card's root carries `data-changed`, as a
   * field's does, so a collapsible card around this one counts the change too.
   */
  isChanged?: boolean;
  /**
   * The words a screen reader reads with the toggle while the folded marker shows.
   * @default 'Changed'
   */
  changedLabel?: string;
  /**
   * The element to render. A `section` with an accessible name is a region landmark. An `article` is
   * not a landmark, named or not, and a `div` is neither.
   * @default 'div'
   */
  as?: 'div' | 'section' | 'article';
  /** A ref to the card's root element, the one `className` goes on. */
  ref?: Ref<HTMLElement>;
  /** The body, which folds. */
  children?: ReactNode;
}

/**
 * Whether the card is open: `isExpanded` when the caller controls it, the fold the browser remembers when
 * it has a `storageKey`, and otherwise the card's own state, starting from `defaultExpanded`. Every change
 * goes through the setter, a press of the toggle and find-in-page alike, which stores it under the key and
 * tells `onExpandedChange`. This is the one place the state is decided.
 */
function useExpanded(
  isExpanded: boolean | undefined,
  defaultExpanded: boolean,
  onExpandedChange: ((isExpanded: boolean) => void) | undefined,
  storageKey: string | undefined,
): [isExpanded: boolean, setExpanded: (isExpanded: boolean) => void] {
  const [own, setOwn] = useState(defaultExpanded);
  // A controlled card reads and stores nothing.
  const key = isExpanded === undefined ? storageKey : undefined;
  const [isFolded, setFolded] = useStoredFold(key);
  const setExpanded = (next: boolean): void => {
    if (key === undefined) setOwn(next);
    else setFolded(!next);
    onExpandedChange?.(next);
  };
  return [isExpanded ?? (key === undefined ? own : !isFolded), setExpanded];
}

/**
 * The title, drawn as the card title, holding the toggle: the title's text and the chevron, which is
 * decoration. The title names the toggle and `aria-expanded` gives its state. This is the one place the
 * toggle is built, so anything that comes to describe it is added here.
 *
 * While `isMarked`, the toggle carries the folded marker: a dot after the title's words, which is decoration
 * too, and `changedLabel`, which describes the toggle. The words are in a `hidden` element after the heading,
 * which a description may name, so neither the toggle's name nor the heading's text changes.
 */
function CardToggle({
  title,
  level,
  isMarked,
  changedLabel,
  toggleRef,
}: {
  title: ReactNode;
  level: 1 | 2 | 3 | 4;
  isMarked: boolean;
  changedLabel: string;
  toggleRef: Ref<HTMLButtonElement>;
}): ReactElement {
  const Heading = `h${level}` as const;
  const { chipId, describedBy } = useChangedDescription({ isChanged: isMarked });
  return (
    <>
      <Heading className="card-title">
        <RACButton ref={toggleRef} slot="trigger" className="card-toggle" aria-describedby={describedBy}>
          <span className="card-toggle-text">
            {title}
            {isMarked ? <span className="card-marker" aria-hidden="true" /> : null}
          </span>
          <ChevronDown className="card-chevron" aria-hidden="true" />
        </RACButton>
      </Heading>
      {isMarked ? (
        <span id={chipId} className="card-marker-label" hidden>
          {changedLabel}
        </span>
      ) : null}
    </>
  );
}

/**
 * A card whose body folds under its header. The title is the toggle, a row as wide as the title with a
 * chevron at its end, and the note and the actions stay in the header while the body is folded. It draws
 * with Card's own classes, so the two look alike, and it is built on React Aria's Disclosure, so the toggle
 * is a button that says whether the body is shown, and find-in-page can open a folded card in a browser that
 * supports `hidden="until-found"`. Given a `storageKey`, it remembers its fold in the browser. Folded, it
 * marks a change any field in its body holds, and it opens itself when a field in its body fails the
 * browser's validation on submit.
 */
export function CollapsibleCard({
  title,
  level = 2,
  note,
  actions,
  defaultExpanded = true,
  isExpanded: isExpandedProp,
  onExpandedChange,
  storageKey,
  isChanged = false,
  changedLabel = 'Changed',
  as: tag = 'div',
  className,
  children,
  ...props
}: CollapsibleCardProps): ReactElement {
  const [isExpanded, setExpanded] = useExpanded(
    isExpandedProp,
    defaultExpanded,
    onExpandedChange,
    storageKey,
  );
  const foldRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const isInstant = useFolding(foldRef, toggleRef, isExpanded);
  const holdsChange = useHoldsChange(foldRef, !isExpanded);
  useOpenOnInvalid(foldRef, !isExpanded, () => {
    setExpanded(true);
  });
  // createElement rather than JSX: the three tags take one HTMLElement ref type between them. React Aria's
  // disclosure always renders a div and passes on only global attributes, so the root is the card's own
  // element, which takes any attribute, and the disclosure sits inside it. The title and the note are one
  // block, so the note stays under the title wherever the actions go.
  return createElement(
    tag,
    {
      ...props,
      className: cx('card', 'card-collapsible', className),
      'data-expanded': isExpanded ? '' : undefined,
      'data-instant': isInstant ? '' : undefined,
      'data-changed': isChanged ? '' : undefined,
    },
    <RACDisclosure className="card-disclosure" isExpanded={isExpanded} onExpandedChange={setExpanded}>
      <div className="card-header">
        <div className="card-heading">
          <CardToggle
            title={title}
            level={level}
            isMarked={!isExpanded && (isChanged || holdsChange)}
            changedLabel={changedLabel}
            toggleRef={toggleRef}
          />
          {present(note) ? <p className="card-note">{note}</p> : null}
        </div>
        {present(actions) ? <div className="card-actions">{actions}</div> : null}
      </div>
      <RACDisclosurePanel ref={foldRef} className="card-fold">
        <div className="card-body">{children}</div>
      </RACDisclosurePanel>
    </RACDisclosure>,
  );
}
