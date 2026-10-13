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
import { cx } from '../utils/cx';
import { present } from '../utils/present';
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
   * Whether the card is open on the first render, when `isExpanded` does not control it.
   * @default true
   */
  defaultExpanded?: boolean;
  /** Whether the card is open. Given, it controls the card: pair it with `onExpandedChange`. */
  isExpanded?: boolean;
  /** Called with the new state when the card opens or folds, from its toggle or from find-in-page. */
  onExpandedChange?: (isExpanded: boolean) => void;
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
 * Whether the card is open: `isExpanded` when the caller controls it, and otherwise the card's own state,
 * starting from `defaultExpanded`. Every change goes through the setter, which tells `onExpandedChange`.
 * This is the one place the state is decided.
 */
function useExpanded(
  isExpanded: boolean | undefined,
  defaultExpanded: boolean,
  onExpandedChange: ((isExpanded: boolean) => void) | undefined,
): [isExpanded: boolean, setExpanded: (isExpanded: boolean) => void] {
  const [own, setOwn] = useState(defaultExpanded);
  const setExpanded = (next: boolean): void => {
    setOwn(next);
    onExpandedChange?.(next);
  };
  return [isExpanded ?? own, setExpanded];
}

/**
 * The title, drawn as the card title, holding the toggle: the title's text and the chevron, which is
 * decoration. The title names the toggle and `aria-expanded` gives its state. This is the one place the
 * toggle is built, so anything that comes to describe it is added here.
 */
function CardToggle({ title, level }: { title: ReactNode; level: 1 | 2 | 3 | 4 }): ReactElement {
  const Heading = `h${level}` as const;
  return (
    <Heading className="card-title">
      <RACButton slot="trigger" className="card-toggle">
        <span className="card-toggle-text">{title}</span>
        <ChevronDown className="card-chevron" aria-hidden="true" />
      </RACButton>
    </Heading>
  );
}

/**
 * A card whose body folds under its header. The title is the toggle, a row as wide as the title with a
 * chevron at its end, and the note and the actions stay in the header while the body is folded. It draws
 * with Card's own classes, so the two look alike, and it is built on React Aria's Disclosure, so the toggle
 * is a button that says whether the body is shown, and find-in-page can open a folded card.
 */
export function CollapsibleCard({
  title,
  level = 2,
  note,
  actions,
  defaultExpanded = true,
  isExpanded: isExpandedProp,
  onExpandedChange,
  as: tag = 'div',
  className,
  children,
  ...props
}: CollapsibleCardProps): ReactElement {
  const [isExpanded, setExpanded] = useExpanded(isExpandedProp, defaultExpanded, onExpandedChange);
  const foldRef = useRef<HTMLDivElement>(null);
  useFolding(foldRef, isExpanded);
  // createElement rather than JSX: the three tags take one HTMLElement ref type between them. React Aria's
  // disclosure always renders a div and passes on only global attributes, so the root is the card's own
  // element, which takes any attribute, and the disclosure sits inside it.
  return createElement(
    tag,
    {
      ...props,
      className: cx('card', 'card-collapsible', className),
      'data-expanded': isExpanded ? '' : undefined,
    },
    <RACDisclosure className="card-disclosure" isExpanded={isExpanded} onExpandedChange={setExpanded}>
      <div className="card-header">
        <CardToggle title={title} level={level} />
        {present(note) ? <p className="card-note">{note}</p> : null}
        {present(actions) ? <div className="card-actions">{actions}</div> : null}
      </div>
      <RACDisclosurePanel ref={foldRef} className="card-fold">
        <div className="card-body">{children}</div>
      </RACDisclosurePanel>
    </RACDisclosure>,
  );
}
