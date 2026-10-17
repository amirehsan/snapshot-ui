'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import {
  Children,
  Fragment,
  isValidElement,
  useEffect,
  type ReactElement,
  type ReactNode,
  type Ref,
} from 'react';
import { Link } from '../link/Link';
import { cx } from '../utils/cx';
import { useWarnOnce } from '../utils/useWarnOnce';

export interface BreadcrumbsProps {
  /** Breadcrumb elements, from the top of the trail to the current page. */
  children: ReactNode;
  /** The navigation landmark's name. @default 'Breadcrumbs' */
  'aria-label'?: string;
  /** The narrow face's link name, given the parent's text. @default (parent) => `Back to ${parent}` */
  backLabel?: (parent: string) => string;
  className?: string;
  ref?: Ref<HTMLElement>;
}

export interface BreadcrumbProps {
  /** The page's URL. The last crumb, the current page, takes none and draws as text. */
  href?: string;
  /** The crumb's text. */
  children: string;
  className?: string;
}

const defaultBackLabel = (parent: string): string => `Back to ${parent}`;

/**
 * One crumb of a Breadcrumbs trail. It renders nothing by itself: Breadcrumbs reads its props and draws the trail,
 * so outside a Breadcrumbs it draws nothing and warns once.
 */
export const Breadcrumb: (props: BreadcrumbProps) => ReactElement | null = () => {
  useWarnOnce('Breadcrumb draws nothing by itself: put it inside Breadcrumbs.');
  return null;
};

/**
 * Keeps focus in a trail as the viewport crosses 768px and the face that holds it is hidden, which would drop focus
 * to the page: a crumb's link gives it to the back link, and the back link to the parent's link in the list. The
 * change is heard before the new face is drawn, while focus is still on the old one; each trail's listener does the
 * same for whichever trail holds focus, so a second one finds focus already moved. Guarded, because a test
 * environment may lack matchMedia. 768px is the --breakpoint-sm token, as breadcrumbs.css writes it.
 */
function useFocusAcrossFaces(): void {
  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return;
    const narrow = window.matchMedia('(width < 768px)');
    const onChange = (): void => {
      const nav = document.activeElement?.closest('.breadcrumbs');
      const twin = nav?.querySelector<HTMLElement>(
        narrow.matches ? '.breadcrumbs-back' : '.breadcrumbs-item:nth-last-child(2) .breadcrumbs-link',
      );
      twin?.focus();
    };
    narrow.addEventListener('change', onChange);
    return () => {
      narrow.removeEventListener('change', onChange);
    };
  }, []);
}

/**
 * Whether `child` is a crumb. A Breadcrumb that a server component renders reaches this client module as a
 * reference React resolves lazily, not as the Breadcrumb function, so a crumb is also told by what it carries: an
 * element of a component, not of a tag, whose children are its text.
 */
function isCrumb(child: ReactElement<{ children?: unknown }>): boolean {
  return (
    child.type === Breadcrumb || (typeof child.type !== 'string' && typeof child.props.children === 'string')
  );
}

/** The crumbs among `children`, through fragments and arrays, and whether anything else was there. */
function crumbsOf(children: ReactNode): { crumbs: BreadcrumbProps[]; hasStray: boolean } {
  const crumbs: BreadcrumbProps[] = [];
  let hasStray = false;
  const visit = (nodes: ReactNode): void => {
    for (const child of Children.toArray(nodes)) {
      if (!isValidElement<{ children?: ReactNode }>(child)) hasStray = true;
      else if (child.type === Fragment) visit(child.props.children);
      else if (isCrumb(child)) crumbs.push(child.props as BreadcrumbProps);
      else hasStray = true;
    }
  };
  visit(children);
  return { crumbs, hasStray };
}

/**
 * Where a page sits: a navigation landmark holding an ordered list of links to the pages above it, the current
 * page last as text with `aria-current="page"`, a chevron between crumbs. Under 768px of viewport the list gives
 * way to one link to the parent, "Back to Documents". Both faces are in the server's HTML as real links, so the
 * trail works before hydration and with scripts off, and the library's Link takes a press through your
 * RouterProvider once hydrated. Written by hand rather than on React Aria's Breadcrumbs, which names its list as
 * well as the landmark, draws the current page as a disabled link and is a collection drawn again after hydration.
 */
export function Breadcrumbs({
  children,
  'aria-label': ariaLabel = 'Breadcrumbs',
  backLabel = defaultBackLabel,
  className,
  ref,
}: BreadcrumbsProps): ReactElement | null {
  useFocusAcrossFaces();
  const { crumbs, hasStray } = crumbsOf(children);
  const last = crumbs.length - 1;
  useWarnOnce(hasStray ? 'Breadcrumbs draws only Breadcrumb children; the rest is left out.' : null);
  useWarnOnce(
    crumbs.slice(0, last).some((crumb) => crumb.href === undefined)
      ? 'A Breadcrumb above the current page has no href, so it is drawn as text.'
      : null,
  );
  useWarnOnce(
    crumbs[last]?.href !== undefined
      ? 'The last Breadcrumb is the current page: its href is not used.'
      : null,
  );
  if (crumbs.length === 0) return null;
  const parent = crumbs.length > 1 ? crumbs[last - 1] : undefined;
  return (
    <nav ref={ref} aria-label={ariaLabel} className={cx('breadcrumbs', className)}>
      <ol className="breadcrumbs-list">
        {crumbs.map((crumb, index) => {
          const text = (
            <span className="breadcrumbs-text" title={crumb.children}>
              {crumb.children}
            </span>
          );
          return (
            // A crumb has no id but its place in the trail, which the app writes from the top down.
            <li key={index} className={cx('breadcrumbs-item', crumb.className)}>
              {index === last ? (
                <span className="breadcrumbs-current" aria-current="page">
                  {text}
                </span>
              ) : crumb.href === undefined ? (
                text
              ) : (
                <Link href={crumb.href} className="breadcrumbs-link">
                  {text}
                </Link>
              )}
              {index !== last && (
                <span className="breadcrumbs-separator" aria-hidden="true">
                  <ChevronRight />
                </span>
              )}
            </li>
          );
        })}
      </ol>
      {parent?.href !== undefined && (
        <Link href={parent.href} className="breadcrumbs-back">
          <ChevronLeft aria-hidden="true" />
          <span className="breadcrumbs-text" title={backLabel(parent.children)}>
            {backLabel(parent.children)}
          </span>
        </Link>
      )}
    </nav>
  );
}
