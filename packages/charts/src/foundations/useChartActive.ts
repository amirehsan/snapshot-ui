'use client';

import { useEffect, useState, type RefObject } from 'react';

/** What set the active mark: a key or focus, which a chart may announce, or a pointer or a touch, which it does not. */
export type ChartSource = 'key' | 'pointer' | 'touch';

export interface ChartActiveOptions<T> {
  /** The mark focus lands on when nothing is active, such as the newest with data; null when there is none. */
  onFirstFocus: () => T | null;
  /** Whether an active mark still has data, by the current props: one that has lost it is not current. @default every mark */
  isAvailable?: (value: T) => boolean;
  /** The element a touch holds inside: a press anywhere outside it lets the touch go. */
  within: RefObject<Element | null>;
}

export interface ChartActive<T> {
  /** The active mark as set, which new props may have left without data. */
  active: T | null;
  /** The active mark when it still has data, which is what the chart draws; else null. */
  current: T | null;
  source: ChartSource | null;
  /** Escape hid the readout; the next move shows it again. */
  isReadoutHidden: boolean;
  /** True once mounted: the tab stop is the script's, since with scripts off its keys would do nothing. */
  isInteractive: boolean;
  /** Makes a mark active from a source; a move to another mark shows the readout again. */
  activate: (value: T, from: ChartSource) => void;
  clear: () => void;
  hideReadout: () => void;
  /** For the tab stop's focus: a pointer that already holds a mark keeps it, else focus lands on `onFirstFocus`'s. */
  onFocus: () => void;
}

/**
 * The active mark a chart shares between its keys, its pointer and its readout: which mark, what set it, the
 * readout hidden by Escape, a touch held until a press outside, and the tab stop set after mount.
 */
export function useChartActive<T>(options: ChartActiveOptions<T>): ChartActive<T> {
  const { onFirstFocus, isAvailable, within } = options;
  const [active, setActive] = useState<T | null>(null);
  const [source, setSource] = useState<ChartSource | null>(null);
  const [isReadoutHidden, setReadoutHidden] = useState(false);
  const [isInteractive, setInteractive] = useState(false);

  const current = active !== null && (isAvailable?.(active) ?? true) ? active : null;

  const activate = (value: T, from: ChartSource): void => {
    // A move shows the readout again; a key that goes nowhere leaves an Escape standing.
    if (value !== current) setReadoutHidden(false);
    setActive(value);
    setSource(from);
  };

  const clear = (): void => {
    setActive(null);
    setSource(null);
  };

  const hideReadout = (): void => {
    setReadoutHidden(true);
  };

  const onFocus = (): void => {
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

  return { active, current, source, isReadoutHidden, isInteractive, activate, clear, hideReadout, onFocus };
}
