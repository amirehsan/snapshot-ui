'use client';

import { useEffect, useState, type RefObject } from 'react';

/** What set the active mark: a key or focus, which a chart may announce, or a pointer or a touch, which it does not. */
export type ChartSource = 'key' | 'pointer' | 'touch';

/**
 * What names a mark: a number (LineChart's x position) or a string (BarChart's `band:series`), compared with
 * `===`, so a mark is the same mark however it was found.
 */
export type ChartMark = number | string;

export interface ChartActiveOptions<T extends ChartMark> {
  /** The mark focus lands on when nothing is active, such as the newest with data; null when there is none. */
  onFirstFocus: () => T | null;
  /** Whether an active mark still has data, by the current props: one that has lost it is not current. @default every mark */
  isAvailable?: (value: T) => boolean;
  /** The element a touch holds inside: a press anywhere outside it lets the touch go. */
  within: RefObject<Element | null>;
}

export interface ChartActive<T extends ChartMark> {
  /** The active mark as set, which new props may have left without data. */
  active: T | null;
  /** The active mark when it still has data, which is what the chart draws; else null. */
  current: T | null;
  source: ChartSource | null;
  /**
   * The last mark made active, kept when the chart clears on blur or a press outside: a roving tab stop's
   * place, so Tab comes back to the bar it left. Null until a mark is first active. LineChart's one stop is the
   * plot, so it reads none.
   */
  stop: T | null;
  /** Escape hid the readout; the next move to another mark shows it again. */
  isReadoutHidden: boolean;
  /** True once mounted: the tab stop is the script's, since with scripts off its keys would do nothing. */
  isInteractive: boolean;
  /** Makes a mark active from a source; a move to another mark shows the readout again. */
  activate: (value: T, from: ChartSource) => void;
  clear: () => void;
  hideReadout: () => void;
  /**
   * For focus. Given the mark that took focus (a bar of a roving tab stop), that mark is active. Given none (a
   * chart that is one tab stop), a mark a pointer already holds stays, and with none focus lands on
   * `onFirstFocus`'s. Wrap it, since a focus event is not a mark: `onFocus={() => chart.onFocus()}`.
   */
  onFocus: (mark?: T) => void;
}

/**
 * The active mark a chart shares between its keys, its pointer and its readout: which mark, what set it, the
 * last one for a roving tab stop, the readout hidden by Escape, a touch held until a press outside, and the tab
 * stop set after mount.
 */
export function useChartActive<T extends ChartMark>(options: ChartActiveOptions<T>): ChartActive<T> {
  const { onFirstFocus, isAvailable, within } = options;
  const [active, setActive] = useState<T | null>(null);
  const [stop, setStop] = useState<T | null>(null);
  const [source, setSource] = useState<ChartSource | null>(null);
  const [isReadoutHidden, setReadoutHidden] = useState(false);
  const [isInteractive, setInteractive] = useState(false);

  // A mark that has lost its data since it was set, by new props, shows nothing.
  const current = active !== null && (isAvailable?.(active) ?? true) ? active : null;

  const activate = (value: T, from: ChartSource): void => {
    // A move shows the readout again; a key that goes nowhere leaves an Escape standing.
    if (value !== current) setReadoutHidden(false);
    setActive(value);
    setStop(value);
    setSource(from);
  };

  const clear = (): void => {
    setActive(null);
    setSource(null);
  };

  const hideReadout = (): void => {
    setReadoutHidden(true);
  };

  const onFocus = (mark?: T): void => {
    if (mark !== undefined) {
      activate(mark, 'key');
      return;
    }
    // A pointer that already holds a mark keeps it.
    if (active !== null) return;
    const first = onFirstFocus();
    if (first !== null) activate(first, 'key');
  };

  // The tab stop is the script's: with scripts off its keys would do nothing, so the server writes none, and the
  // render after mount, hydrated or not, adds it. LineChart's own mount effect, moved here unchanged.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one render after mount, by design: the server's HTML and the first client render must agree
    setInteractive(true);
  }, []);

  // A touch holds its mark until a press anywhere outside the holder.
  useEffect(() => {
    const holder = within.current;
    if (source !== 'touch' || !holder) return;
    const onPress = (event: globalThis.PointerEvent): void => {
      if (!(event.target instanceof Node && holder.contains(event.target))) {
        setActive(null);
        setSource(null);
      }
    };
    holder.ownerDocument.addEventListener('pointerdown', onPress);
    return () => {
      holder.ownerDocument.removeEventListener('pointerdown', onPress);
    };
  }, [source, within]);

  return {
    active,
    current,
    source,
    stop,
    isReadoutHidden,
    isInteractive,
    activate,
    clear,
    hideReadout,
    onFocus,
  };
}
