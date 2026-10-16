'use client';

import { useMemo, useRef, type ReactElement, type ReactNode, type Ref } from 'react';
import { cx } from '../utils/cx';
import { SidePanelLayoutContext, type SidePanelLayoutState } from './SidePanel';

export interface SidePanelLayoutProps {
  /** The page's content, such as the filter bar, the table and the pager. */
  children: ReactNode;
  /** One SidePanel. */
  panel: ReactNode;
  /**
   * Under 1440px of viewport, an open panel folds an AppShell's rail to its collapsed width and gives it back as
   * it closes, unless the reader had folded it already, so a table beside the panel keeps its table face. `false`
   * leaves the rail as the reader set it.
   * @default true
   */
  collapsesRail?: boolean;
  className?: string;
  ref?: Ref<HTMLDivElement>;
}

/**
 * The page's content and its detail: one column, and from 1024px of viewport, while it holds an open SidePanel,
 * the content and the panel's 24rem column. The panel pushes the content and never covers it; a DataTable in the
 * content may draw its list face by its own box.
 */
export function SidePanelLayout({
  children,
  panel,
  collapsesRail = true,
  className,
  ref,
}: SidePanelLayoutProps): ReactElement {
  const content = useRef<HTMLDivElement>(null);
  const opener = useRef<Element | null>(null);
  // The open panels, and whether the last one left in this task: a panel keyed by the next row ends its
  // predecessor's stretch and begins its own in one commit's layout effects, with no microtask between them.
  const open = useRef({ count: 0, isEnding: false });
  const state = useMemo<SidePanelLayoutState>(
    () => ({
      content: () => content.current,
      opener: () => opener.current,
      setOpener: (element) => {
        opener.current = element;
      },
      begin: () => {
        const stretch = open.current;
        const continues = stretch.count > 0 || stretch.isEnding;
        stretch.count += 1;
        stretch.isEnding = false;
        return continues;
      },
      end: () => {
        const stretch = open.current;
        stretch.count -= 1;
        if (stretch.count > 0) return;
        stretch.isEnding = true;
        queueMicrotask(() => {
          stretch.isEnding = false;
        });
      },
      collapsesRail,
    }),
    [collapsesRail],
  );
  return (
    <SidePanelLayoutContext value={state}>
      {/* data-collapses-rail is in the server's HTML, so AppShell's CSS folds the rail beside an open panel before
          any script runs (app-shell.css, sidebar.css); useRailFold keeps the shell's state in step after. */}
      <div
        ref={ref}
        className={cx('side-panel-layout', className)}
        data-collapses-rail={collapsesRail ? '' : undefined}
      >
        {/* Focus's last resort when what opened the panel has left the page; never a tab stop. */}
        <div ref={content} className="side-panel-layout-content" tabIndex={-1}>
          {children}
        </div>
        {panel}
      </div>
    </SidePanelLayoutContext>
  );
}
