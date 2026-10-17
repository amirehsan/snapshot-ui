import { useEffect, type RefObject } from 'react';

/** The custom property the tray and the toasts read to sit above a sticky bar. */
const OFFSET = '--save-bar-offset';

/**
 * While the bar in `ref` is mounted, writes its border-box height plus the inset as `--save-bar-offset` inline on
 * the root and on the closest `.app-shell`, so the tray and the toasts sit above a bar that wraps to two lines.
 * Until the first measurement the stylesheet's own value holds, the one-line bar's height from the tokens, so no
 * first paint waits on this; a bar that measures nothing, as a hidden one does, takes its value away. Both are
 * removed when the bar unmounts (spec correction 13). Needs `ResizeObserver`, which jsdom lacks. Internal:
 * SaveBar's, and DataTable's bulk-action bar's.
 */
export function useBottomBarOffset(ref: RefObject<HTMLElement | null>): void {
  useEffect(() => {
    const bar = ref.current;
    if (bar === null || typeof ResizeObserver !== 'function') return;
    // The root holds the toasts' copy; the shell redeclares it from the tokens, so the tray inside reads its own.
    const holders = [document.documentElement, bar.closest<HTMLElement>('.app-shell')].filter(
      (holder) => holder !== null,
    );
    const observer = new ResizeObserver((entries) => {
      const entry = entries.at(-1);
      if (entry === undefined) return;
      const height = entry.borderBoxSize[0]?.blockSize ?? entry.contentRect.height;
      for (const holder of holders) {
        if (height > 0) holder.style.setProperty(OFFSET, `calc(${String(height)}px + var(--spacing-inset))`);
        else holder.style.removeProperty(OFFSET);
      }
    });
    observer.observe(bar);
    return () => {
      observer.disconnect();
      for (const holder of holders) holder.style.removeProperty(OFFSET);
    };
  }, [ref]);
}
