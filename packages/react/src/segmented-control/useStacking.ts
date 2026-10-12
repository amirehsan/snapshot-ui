import { useLayoutEffect, type RefObject } from 'react';

/** The attribute the root carries while the options are stacked, one per row. */
const STACKED = 'data-stacked';

/** Half a pixel: how far a row may run over its room and still paint inside it. */
const ROW_SLACK = 0.5;

/**
 * Whether a row of options `rowWidth` wide has to stack to fit `room`. A width
 * that is not known (an element that is not drawn, as when it is hidden) keeps
 * the arrangement the control has.
 */
export function stacksOptions(rowWidth: number, room: number, stacked = false): boolean {
  if (!(rowWidth > 0) || !(room > 0)) return stacked;
  return rowWidth > room + ROW_SLACK;
}

/**
 * Sets `data-stacked` on the control's root while its row of options does not
 * fit the room it has, and takes it off when the row fits again. The options
 * are all in one row or all in a column, never some of each.
 *
 * Two elements are read and nothing is copied. The room marker is a
 * zero-height element as wide as the root. The track is as wide as the row,
 * and at least as wide as the room (see segmented.css), so a track wider than
 * the marker is a row that does not fit. While the options are stacked the
 * track is a column, so the row is measured by taking the attribute off, which
 * lays the options out as a row, reading both widths, and putting the answer
 * back, all inside one frame before anything is drawn.
 *
 * That is done only when something that can change the answer happened: the
 * room changed (a ResizeObserver on the marker, not on the root, whose height
 * stacking changes, which would raise the browser's loop error), a label
 * changed, a font arrived, or the size changed. Selecting an option and moving
 * focus change none of them.
 *
 * Internal: not exported from the package.
 */
export function useStacking(
  roomRef: RefObject<HTMLElement | null>,
  trackRef: RefObject<HTMLElement | null>,
  size: string,
): void {
  useLayoutEffect(() => {
    const room = roomRef.current;
    const track = trackRef.current;
    // The marker is the root's own child, so the root is where the attribute goes.
    const root = room?.parentElement;
    if (!room || !track || !root) return;

    let live = true;
    const arrange = (): void => {
      if (!live) return;
      const wasStacked = root.hasAttribute(STACKED);
      // Ask the layout whether the row fits by laying the options out as a row.
      if (wasStacked) root.removeAttribute(STACKED);
      const next = stacksOptions(
        track.getBoundingClientRect().width,
        room.getBoundingClientRect().width,
        wasStacked,
      );
      root.toggleAttribute(STACKED, next);
    };
    arrange();

    const resize = 'ResizeObserver' in globalThis ? new ResizeObserver(arrange) : undefined;
    resize?.observe(room);
    const text = new MutationObserver(arrange);
    text.observe(track, { childList: true, characterData: true, subtree: true });
    // Not defined everywhere (a DOM emulator has none), and a row measured in a
    // fallback face is the wrong width once the real one arrives.
    const fonts = document.fonts as FontFaceSet | undefined;
    fonts?.addEventListener('loadingdone', arrange);
    void fonts?.ready.then(arrange);

    return () => {
      live = false;
      resize?.disconnect();
      text.disconnect();
      fonts?.removeEventListener('loadingdone', arrange);
    };
  }, [roomRef, trackRef, size]);
}
