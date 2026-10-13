'use client';

import { ChevronLeft, X } from 'lucide-react';
import {
  createContext,
  use,
  useEffect,
  useId,
  useMemo,
  useRef,
  type HTMLAttributes,
  type ReactElement,
  type ReactNode,
  type Ref,
} from 'react';
import { Button as RACButton, VisuallyHidden } from 'react-aria-components';
import { useAppShell } from '../app-shell/AppShell';
import { Drawer } from '../drawer/Drawer';
import { IconButton } from '../icon-button/IconButton';
import { Tooltip, TooltipTrigger } from '../tooltip/Tooltip';
import type { AriaName } from '../utils/accessible-name';
import { cx } from '../utils/cx';
import { present } from '../utils/present';

export type SidebarProps = Omit<
  HTMLAttributes<HTMLDivElement>,
  'children' | 'aria-label' | 'aria-labelledby'
> &
  AriaName & {
    /** The brand row at the top: a SidebarBrand, or anything. */
    brand?: ReactNode;
    /** The search action under the brand: a SidebarSearch, or anything. */
    search?: ReactNode;
    /** SidebarGroup elements. */
    children: ReactNode;
    /** The account row at the bottom, ruled off from the list. The app reads `useSidebar().isCollapsed` to draw it icon-only. */
    footer?: ReactNode;
    /** @default 'Collapse the menu' */
    collapseLabel?: string;
    /** @default 'Expand the menu' */
    expandLabel?: string;
    /** The drawer's accessible name. @default 'Menu' */
    drawerLabel?: string;
    /** The drawer's close button. @default 'Close menu' */
    closeLabel?: string;
    ref?: Ref<HTMLDivElement>;
  };

export interface SidebarState {
  /** Whether this copy of the rail is collapsed to icons. Always false inside the drawer. */
  isCollapsed: boolean;
  /** Whether this copy is the drawer. */
  inDrawer: boolean;
}

const SidebarContext = createContext<SidebarState | null>(null);

/** For the brand, search and footer slots. Throws outside a Sidebar. */
export function useSidebar(): SidebarState {
  const state = use(SidebarContext);
  if (state === null) throw new Error('useSidebar must be used inside a Sidebar');
  return state;
}

/** What both copies of the rail draw: the slots, the names, and the rail root's own attributes. */
interface RailProps {
  /** Whether this is the drawer copy, which never collapses, has no collapse button and has a close button. */
  inDrawer: boolean;
  /** The rail copy's id, which the collapse button controls. */
  railId: string;
  brand: ReactNode;
  search: ReactNode;
  children: ReactNode;
  footer: ReactNode;
  collapseLabel: string;
  expandLabel: string;
  closeLabel: string;
  navLabel: string | undefined;
  navLabelledBy: string | undefined;
  className: string | undefined;
  /** The rail root's other attributes and its ref, which only the rail copy takes. */
  rest: HTMLAttributes<HTMLDivElement>;
  rootRef: Ref<HTMLDivElement> | undefined;
}

/** One copy of the rail: the fixed one, or the one inside the drawer. */
function SidebarRail({
  inDrawer,
  railId,
  brand,
  search,
  children,
  footer,
  collapseLabel,
  expandLabel,
  closeLabel,
  navLabel,
  navLabelledBy,
  className,
  rest,
  rootRef,
}: RailProps): ReactElement {
  const { isSidebarCollapsed, setSidebarCollapsed, closeDrawer } = useAppShell();
  const nav = useRef<HTMLElement>(null);
  useEffect(() => {
    // Once, on mount: after that the reader chose the item and can see it. The hidden rail has no height.
    // scrollTop only: scrollIntoView would scroll every ancestor too.
    const list = nav.current;
    const current = list?.querySelector<HTMLElement>('[aria-current="page"]');
    if (!list || !current || list.clientHeight === 0) return;
    if (current.offsetTop + current.offsetHeight > list.scrollTop + list.clientHeight) {
      list.scrollTop = Math.max(0, current.offsetTop - 40);
    }
  }, []);
  const isCollapsed = !inDrawer && isSidebarCollapsed;
  const state = useMemo<SidebarState>(() => ({ isCollapsed, inDrawer }), [isCollapsed, inDrawer]);
  const toggleLabel = isCollapsed ? expandLabel : collapseLabel;
  return (
    <SidebarContext value={state}>
      <div
        // Only the rail copy takes the root's attributes, so nothing an app sets on Sidebar is duplicated while
        // the drawer is open; the drawer copy gets the class alone.
        {...(inDrawer ? {} : rest)}
        id={inDrawer ? undefined : railId}
        ref={inDrawer ? undefined : rootRef}
        className={cx('sidebar', inDrawer && 'sidebar-drawer', className)}
      >
        {present(brand) || inDrawer ? (
          <div className="sidebar-head">
            {brand}
            {inDrawer ? (
              <IconButton aria-label={closeLabel} className="sidebar-close" onPress={closeDrawer}>
                <X />
              </IconButton>
            ) : null}
          </div>
        ) : null}
        {inDrawer ? null : (
          <TooltipTrigger isDisabled={!isCollapsed}>
            <RACButton
              className="sidebar-collapse"
              aria-expanded={!isCollapsed}
              aria-controls={railId}
              onPress={() => {
                setSidebarCollapsed(!isSidebarCollapsed);
              }}
            >
              <ChevronLeft aria-hidden="true" />
              <VisuallyHidden elementType="span">{toggleLabel}</VisuallyHidden>
            </RACButton>
            <Tooltip placement="end">{toggleLabel}</Tooltip>
          </TooltipTrigger>
        )}
        {present(search) ? search : null}
        <nav ref={nav} className="sidebar-nav" aria-label={navLabel} aria-labelledby={navLabelledBy}>
          {children}
        </nav>
        {present(footer) ? <div className="sidebar-footer">{footer}</div> : null}
      </div>
    </SidebarContext>
  );
}

/**
 * The floating rail: a brand, a search action, labelled groups of links and an account row. From 1024px up it
 * is fixed beside the page and collapses to a 72px column of icons, whose names show as tooltips; below 1024px
 * it is hidden, and `SidebarTrigger` opens a second copy of it in a Drawer that never collapses. The collapsed
 * and drawer states are the AppShell's, so it throws outside one. Every label stays in the accessibility tree
 * whatever the state, so no name changes as the rail collapses.
 */
export function Sidebar({
  brand,
  search,
  children,
  footer,
  collapseLabel = 'Collapse the menu',
  expandLabel = 'Expand the menu',
  drawerLabel = 'Menu',
  closeLabel = 'Close menu',
  'aria-label': navLabel,
  'aria-labelledby': navLabelledBy,
  className,
  id,
  ref,
  ...rest
}: SidebarProps): ReactElement {
  const { isDrawerOpen, closeDrawer } = useAppShell();
  const generatedId = useId();
  const railId = id ?? generatedId;
  const slots = {
    railId,
    brand,
    search,
    children,
    footer,
    collapseLabel,
    expandLabel,
    closeLabel,
    navLabel,
    navLabelledBy,
    className,
    rest,
    rootRef: ref,
  };
  return (
    <>
      <SidebarRail inDrawer={false} {...slots} />
      {/* Renders nothing while closed and on the server. It draws no header with a hidden title and no close
          button of its own: the drawer copy's head holds the close button. */}
      <Drawer
        placement="start"
        title={drawerLabel}
        isTitleHidden
        hasCloseButton={false}
        isOpen={isDrawerOpen}
        onOpenChange={(open) => {
          if (!open) closeDrawer();
        }}
        className="sidebar-drawer-panel"
      >
        <SidebarRail inDrawer {...slots} />
      </Drawer>
    </>
  );
}
