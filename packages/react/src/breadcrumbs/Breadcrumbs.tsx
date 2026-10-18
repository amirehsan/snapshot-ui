'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import {
  Children,
  createContext,
  use,
  useEffect,
  useRef,
  type RefObject,
  type ReactElement,
  type ReactNode,
  type Ref,
} from 'react';
import { Link } from '../link/Link';
import { cx } from '../utils/cx';
import { useWarnOnce } from '../utils/useWarnOnce';

export interface BreadcrumbsProps {
  /** Breadcrumb elements, from the top of the trail to the current page, or components that render them. */
  children: ReactNode;
  /** The navigation landmark's name. @default 'Breadcrumbs' */
  'aria-label'?: string;
  /**
   * The phone face's link name, given the parent's text: a template where `{parent}` stands for it, which a server
   * component can pass, or a function, which only a client component can. @default 'Back to {parent}'
   */
  backLabel?: string | ((parent: string) => string);
  className?: string;
  ref?: Ref<HTMLElement>;
}

export interface BreadcrumbProps {
  /** The page's URL. The current page, the last crumb, takes none: a crumb without one is the current page. */
  href?: string;
  /** The crumb's text. */
  children: string;
  className?: string;
}

/** The trail's back label for a parent's text, which each crumb reads; null outside a Breadcrumbs. */
const BackLabelContext = createContext<((parent: string) => string) | null>(null);

/**
 * The words a back label puts before and after the parent's text, which stays visible: "Back to " and "". A label
 * that does not hold the text says all of it first.
 */
function wordsAround(label: string, parent: string): [before: string, after: string] {
  const at = label.indexOf(parent);
  if (at === -1) return [`${label} `, ''];
  return [label.slice(0, at), label.slice(at + parent.length)];
}

/**
 * One crumb of a Breadcrumbs trail: an item of its list, a link to its `href`, or the current page as text with
 * `aria-current="page"` when it has none. Outside a Breadcrumbs it draws nothing and warns once.
 */
export function Breadcrumb({ href, children, className }: BreadcrumbProps): ReactElement | null {
  const backLabel = use(BackLabelContext);
  useWarnOnce(backLabel === null ? 'Breadcrumb draws nothing outside Breadcrumbs.' : null);
  if (backLabel === null) return null;
  const [before, after] = wordsAround(backLabel(children), children);
  return (
    <li className={cx('breadcrumbs-item', className)}>
      {href === undefined ? (
        <span className="breadcrumbs-current" aria-current="page">
          <span className="breadcrumbs-text">{children}</span>
        </span>
      ) : (
        <Link href={href} className="breadcrumbs-link">
          {/* The phone face's: drawn only for the parent under 768px, its words said and not shown. */}
          <ChevronLeft className="breadcrumbs-back-icon" aria-hidden="true" />
          {before !== '' && <span className="breadcrumbs-back-words">{before}</span>}
          <span className="breadcrumbs-text" title={children}>
            {children}
          </span>
          {after !== '' && <span className="breadcrumbs-back-words">{after}</span>}
        </Link>
      )}
      <span className="breadcrumbs-separator" aria-hidden="true">
        <ChevronRight />
      </span>
    </li>
  );
}

/** Whether `element` is drawn: not in a `display: none` subtree. */
function isShown(element: Element): boolean {
  return typeof element.checkVisibility === 'function'
    ? element.checkVisibility()
    : element.getClientRects().length > 0;
}

/**
 * Keeps focus in a trail as the viewport narrows past 768px and the crumb that holds it is hidden, which would drop
 * focus to the page: it goes to the parent's link, the one crumb the phone face draws. Chromium hides the crumb and
 * moves focus to the body before the change is heard, so the trail remembers the last element focused in it and
 * acts when focus is in it, or on the body while that element is no longer drawn. Guarded, because a test
 * environment may lack matchMedia. 768px is the --breakpoint-sm token, as breadcrumbs.css writes it.
 */
function useFocusAcrossFaces(list: RefObject<HTMLOListElement | null>): void {
  useEffect(() => {
    const trail = list.current;
    if (trail === null || typeof window.matchMedia !== 'function') return;
    let last: Element | null = null;
    const remember = (event: FocusEvent): void => {
      if (event.target instanceof Element) last = event.target;
    };
    const narrow = window.matchMedia('(width < 768px)');
    const onChange = (): void => {
      if (!narrow.matches || last === null || !trail.contains(last)) return;
      const active = document.activeElement;
      const isHeld = active !== null && trail.contains(active);
      const isDropped = (active === null || active === document.body) && !isShown(last);
      if (!isHeld && !isDropped) return;
      trail
        .querySelector<HTMLElement>(':scope > .breadcrumbs-item:nth-last-child(2) > .breadcrumbs-link')
        ?.focus();
    };
    trail.addEventListener('focusin', remember);
    narrow.addEventListener('change', onChange);
    return () => {
      trail.removeEventListener('focusin', remember);
      narrow.removeEventListener('change', onChange);
    };
  }, [list]);
}

/** What a trail's list holds that it should not, in the words of the console warnings. */
function problemsOf(list: HTMLOListElement): string[] {
  const nodes = [...list.childNodes];
  const crumbs = nodes.filter(
    (node): node is HTMLLIElement =>
      node instanceof HTMLLIElement && node.classList.contains('breadcrumbs-item'),
  );
  const isCurrent = (item: Element): boolean => item.querySelector(':scope > [aria-current="page"]') !== null;
  const last = crumbs.at(-1);
  return [
    crumbs.length !== nodes.length && 'Breadcrumbs holds only Breadcrumb elements.',
    crumbs.slice(0, -1).some(isCurrent) &&
      'A Breadcrumb without href is the current page: give the others one.',
    last !== undefined && !isCurrent(last) && 'The last Breadcrumb is the current page: leave out its href.',
  ].filter((message) => message !== false);
}

/**
 * Where a page sits: a navigation landmark holding an ordered list of links to the pages above it, the current
 * page last as text with `aria-current="page"`, a chevron between crumbs. Under 768px of viewport the stylesheet
 * draws only the parent's link, with a back chevron and its back label's words said but not shown: "Back to
 * Documents". Each Breadcrumb draws its own item, so a crumb a server component renders, or one a component of
 * yours wraps, needs no reading of its props. Real links in the server's HTML, so the trail works before hydration
 * and with scripts off, and the library's Link takes a press through your RouterProvider once hydrated. Written by
 * hand rather than on React Aria's Breadcrumbs, which names its list as well as the landmark, draws the current
 * page as a disabled link and is a collection drawn again after hydration.
 */
export function Breadcrumbs({
  children,
  'aria-label': ariaLabel = 'Breadcrumbs',
  backLabel = 'Back to {parent}',
  className,
  ref,
}: BreadcrumbsProps): ReactElement | null {
  const list = useRef<HTMLOListElement>(null);
  useFocusAcrossFaces(list);
  const warned = useRef(new Set<string>());
  useEffect(() => {
    if (list.current === null) return;
    for (const message of problemsOf(list.current)) {
      if (warned.current.has(message)) continue;
      warned.current.add(message);
      console.warn(message);
    }
  });
  const labelOf =
    typeof backLabel === 'function'
      ? backLabel
      : (parent: string) => backLabel.replaceAll('{parent}', parent);
  if (Children.toArray(children).length === 0) return null;
  return (
    <nav ref={ref} aria-label={ariaLabel} className={cx('breadcrumbs', className)}>
      <ol ref={list} className="breadcrumbs-list">
        <BackLabelContext value={labelOf}>{children}</BackLabelContext>
      </ol>
    </nav>
  );
}
