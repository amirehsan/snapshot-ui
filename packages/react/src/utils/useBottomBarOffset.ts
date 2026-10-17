import { useEffect, type RefObject } from 'react';

/** The custom property the tray and the toasts read to sit above a sticky bar. */
const OFFSET = '--save-bar-offset';

/**
 * Each holder's mounted bars and the height each last measured, so two bars on one page (a save bar and a bulk-action
 * bar) never overwrite each other: the holder takes the tallest, and loses the property only with its last bar.
 */
const records = new WeakMap<HTMLElement, Map<HTMLElement, number>>();

/** Writes the tallest bar `holder` records, `0px` while every one measures nothing, or removes it with no bar. */
function write(holder: HTMLElement): void {
  const heights = records.get(holder);
  if (heights === undefined || heights.size === 0) {
    records.delete(holder);
    holder.style.removeProperty(OFFSET);
    return;
  }
  const tallest = Math.max(...heights.values());
  // A hidden bar measures nothing: `0px` rather than no value, so the stylesheet's one-line value, declared while a
  // bar is in the page, does not lift the tray and the toasts over a bar that is not drawn.
  holder.style.setProperty(OFFSET, tallest > 0 ? `calc(${String(tallest)}px + var(--spacing-inset))` : '0px');
}

/**
 * While the bar in `ref` is mounted, writes its border-box height plus the inset as `--save-bar-offset` inline on
 * the root and on the closest `.app-shell`, so the tray and the toasts sit above a bar that wraps to two lines.
 * Until the first measurement the stylesheet's own value holds, the one-line bar's height from the tokens, so no
 * first paint waits on this. With two bars on a page each holder takes the taller, and a bar that measures nothing,
 * as a hidden one does, counts as `0px`. The property is removed when the holder's last bar unmounts (spec
 * correction 13). Needs `ResizeObserver`, which jsdom lacks. Internal: SaveBar's, and DataTable's bulk-action bar's.
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
        const heights = records.get(holder) ?? new Map<HTMLElement, number>();
        records.set(holder, heights);
        heights.set(bar, height);
        write(holder);
      }
    });
    observer.observe(bar);
    return () => {
      observer.disconnect();
      for (const holder of holders) {
        const heights = records.get(holder);
        // A bar that never measured left nothing of its own; the holder keeps what another bar wrote.
        if (!heights?.delete(bar)) continue;
        write(holder);
      }
    };
  }, [ref]);
}
