'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import {
  useEffect,
  useId,
  useRef,
  useState,
  type HTMLAttributes,
  type ReactElement,
  type ReactNode,
  type Ref,
} from 'react';
import {
  Link as RACLink,
  composeRenderProps,
  type Key,
  type LinkProps as RACLinkProps,
} from 'react-aria-components';
import type { AriaName } from '../utils/accessible-name';
import { cx } from '../utils/cx';
import { afterCommit, focusIsLost, focusNamedPlace, useFocusWatch } from '../utils/focus-after-commit';
import { mergeRefs } from '../utils/merge-refs';
import { present } from '../utils/present';
import { useHydrated } from '../utils/useHydrated';

export type PanelLayoutView = 'index' | 'section';

export interface PanelLayoutProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  /** The section list: a PanelNav. */
  nav: ReactNode;
  /**
   * The open section, a PanelSection. In the index view, what the split face shows beside the list (the default
   * section); the list face does not show it.
   */
  children?: ReactNode;
  /** `index` at the list's own address, `section` at a section's. Read from the URL by the app. */
  view: PanelLayoutView;
  /** The open section's key, from the URL. A change after hydration moves focus to the section's heading. */
  sectionKey?: Key;
  /** Where the list face's Back goes: the index's address, "/settings". Through RouterProvider. */
  backHref: string;
  /** Back's text: the index's name, "Settings". It is the link's whole name. */
  backLabel: string;
  ref?: Ref<HTMLDivElement>;
}

export type PanelNavProps = Omit<HTMLAttributes<HTMLElement>, 'aria-label' | 'aria-labelledby'> &
  AriaName & {
    /** PanelNavItem elements, in order. */
    children: ReactNode;
    ref?: Ref<HTMLElement>;
  };

export interface PanelNavItemProps extends Omit<
  RACLinkProps,
  'children' | 'className' | 'href' | 'aria-current'
> {
  /** The section's address. Required: a section is a page. */
  href: string;
  /** The section's name: "Bank sync". */
  children: ReactNode;
  /** A line under the name on the list face: "Connected accounts and how often they sync". */
  description?: ReactNode;
  /** A short state at the end, on both faces: "On", "2 connected". Text, never a color. */
  end?: ReactNode;
  /** A 16px icon at the start, hidden from assistive technology. */
  icon?: ReactNode;
  /** This section is open: `aria-current="page"` and the ink pill. */
  isCurrent?: boolean;
  /**
   * This section is what the index shows on the split face: drawn as current there and only there, and never
   * `aria-current`, since on a phone the index shows the list and no section.
   */
  isDefault?: boolean;
  /** Merged after the library's class on the link. */
  className?: string;
  ref?: Ref<HTMLAnchorElement>;
}

/** What a layout committed last: its view, its section and the href of its current link. */
interface Committed {
  view: PanelLayoutView;
  sectionKey: Key | undefined;
  href: string | null;
}

/**
 * What the last layout in this window committed, kept across unmounts, so a layout an app mounts per route
 * compares itself with the one before it. Written in effects only, so the server never touches it.
 */
let lastInWindow: Committed | null = null;

/** How many layouts are mounted: the note above stands for the layout before only when none is. */
let mounted = 0;

/** Forgets what the last layout committed, as a fresh window would. Internal: not exported from the package. */
export function forgetLastLayout(): void {
  lastInWindow = null;
}

/** The href of the nav's current link, read after a commit. */
function currentHref(root: HTMLElement): string | null {
  return (
    root.querySelector('.panel-layout-side .panel-nav-link[aria-current="page"]')?.getAttribute('href') ??
    null
  );
}

/** Where focus goes after a change to `view`, read in the frame after the commit, when the face is drawn. */
function placeAfterChange(root: HTMLElement, view: PanelLayoutView, left: string | null): HTMLElement | null {
  const heading = root.querySelector<HTMLElement>('.panel-layout-main .panel-section-heading');
  if (view === 'section') return heading;
  const side = root.querySelector('.panel-layout-side');
  // The list face: the side column has a box. Read now, never for the first paint.
  if (side === null || side.getClientRects().length === 0) return heading;
  const links = [...side.querySelectorAll<HTMLElement>('.panel-nav-link')];
  return links.find((link) => left !== null && link.getAttribute('href') === left) ?? links[0] ?? heading;
}

/**
 * A settings page's frame: a named list of linked sections beside the open section from 48rem of its own width,
 * and under it a list at the index and a page with Back at a section, both faces in the server's HTML and one
 * drawn by a container query. The URL is the state: the app passes `view` and `sectionKey`. After a change, when
 * focus was in the layout or is lost, the open section's heading takes it, or back at the index on the list face
 * the link of the section left.
 */
export function PanelLayout({
  nav,
  children,
  view,
  sectionKey,
  backHref,
  backLabel,
  className,
  ref,
  ...props
}: PanelLayoutProps): ReactElement {
  const rootRef = useRef<HTMLDivElement>(null);
  const watch = useFocusWatch(rootRef);
  const isHydrated = useHydrated();
  // Whether this layout first rendered after the page hydrated, as one an app mounts per route does.
  const [mountedAfterHydration] = useState(isHydrated);
  const last = useRef<Committed | null>(null);

  useEffect(() => {
    mounted += 1;
    return () => {
      mounted -= 1;
    };
  }, []);

  useEffect(() => {
    const element = rootRef.current;
    if (element === null) return;
    const before = last.current ?? (mountedAfterHydration && mounted === 1 ? lastInWindow : null);
    const now: Committed = { view, sectionKey, href: currentHref(element) };
    last.current = now;
    lastInWindow = now;
    // The first render moves nothing, on the server, on hydration, or as the first layout in the window.
    if (before === null || (before.view === view && before.sectionKey === sectionKey)) return;
    // A navigation the reader started elsewhere, from the rail or a command palette, keeps its own focus.
    if (!watch.held() && !focusIsLost()) return;
    return afterCommit(() => {
      if (!watch.held() && !focusIsLost()) return;
      focusNamedPlace(placeAfterChange(element, view, before.href));
    });
  }, [view, sectionKey, mountedAfterHydration, watch]);

  return (
    <div {...props} ref={mergeRefs(rootRef, ref)} className={cx('panel-layout', className)} data-view={view}>
      <div className="panel-layout-frame">
        <div className="panel-layout-side">{nav}</div>
        <div className="panel-layout-main">
          <RACLink href={backHref} className="panel-layout-back">
            <span className="panel-layout-back-icon" aria-hidden="true">
              <ChevronLeft aria-hidden="true" />
            </span>
            {backLabel}
          </RACLink>
          {children}
        </div>
      </div>
    </div>
  );
}

/** The section list: a navigation landmark the app names, holding PanelNavItem links in order. */
export function PanelNav({ children, className, ref, ...props }: PanelNavProps): ReactElement {
  return (
    <nav {...props} ref={ref} className={cx('panel-nav', className)}>
      <ul className="panel-nav-list">{children}</ul>
    </nav>
  );
}

/**
 * One section in a PanelNav, as a link through RouterProvider. Its name is the section's name; the end state then
 * the description describe it. `isCurrent` sets `aria-current="page"`; `isDefault` draws the pill on the split
 * face only and never sets `aria-current`.
 */
export function PanelNavItem({
  href,
  children,
  description,
  end,
  icon,
  isCurrent = false,
  isDefault = false,
  className,
  ref,
  ...props
}: PanelNavItemProps): ReactElement {
  const id = useId();
  const endId = `${id}-end`;
  const descriptionId = `${id}-description`;
  const describedBy =
    [present(end) ? endId : null, present(description) ? descriptionId : null, props['aria-describedby']]
      .filter(Boolean)
      .join(' ') || undefined;
  return (
    <li className="panel-nav-item">
      <RACLink
        {...props}
        ref={ref}
        href={href}
        // React Aria treats any aria-current as current, "false" included, so it is set only when current.
        aria-current={isCurrent ? 'page' : undefined}
        aria-describedby={describedBy}
        data-default={isDefault ? '' : undefined}
        className={composeRenderProps(className, (userClassName) => cx('panel-nav-link', userClassName))}
      >
        {/* The name is the section's name alone, from the link's content. The end state and the description are
            its description, by id, and hidden from that content, so the name holds the label a voice user says
            (WCAG 2.5.3) and nothing is read twice; a description reads the hidden text it names. */}
        {present(icon) ? (
          <span className="panel-nav-icon" aria-hidden="true">
            {icon}
          </span>
        ) : null}
        <span className="panel-nav-text">
          <span className="panel-nav-name">{children}</span>
          {present(description) ? (
            <span className="panel-nav-description" id={descriptionId} aria-hidden="true">
              {description}
            </span>
          ) : null}
        </span>
        {present(end) ? (
          <span className="panel-nav-end" id={endId} aria-hidden="true">
            {end}
          </span>
        ) : null}
        <span className="panel-nav-chevron" aria-hidden="true">
          <ChevronRight aria-hidden="true" />
        </span>
      </RACLink>
    </li>
  );
}
