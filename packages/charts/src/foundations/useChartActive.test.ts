import { act, fireEvent, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useChartActive, type ChartMark } from './useChartActive';

/** A holder with a mark inside it and a place outside it, in the document. */
const setUp = (): { holder: HTMLElement; inside: HTMLElement; outside: HTMLElement } => {
  const holder = document.createElement('div');
  const inside = document.createElement('span');
  const outside = document.createElement('p');
  holder.append(inside);
  document.body.append(holder, outside);
  return { holder, inside, outside };
};

/** The hook over marks `available`, with the newest as the first focus, inside `holder`. */
const useMarks = <T extends ChartMark>(available: readonly T[], holder: HTMLElement | null = null) =>
  useChartActive<T>({
    onFirstFocus: () => available.at(-1) ?? null,
    isAvailable: (mark) => available.includes(mark),
    within: { current: holder },
  });

describe('useChartActive', () => {
  it('is interactive once mounted, with nothing active and no stop', () => {
    const { result } = renderHook(() => useMarks([0, 1, 2]));
    expect(result.current.isInteractive).toBe(true);
    expect(result.current).toMatchObject({ active: null, current: null, source: null, stop: null });
  });

  it('does not draw a mark that new props took the data from, and a move back to it shows a hidden readout again', () => {
    const { result, rerender } = renderHook(({ available }) => useMarks(available), {
      initialProps: { available: [0, 1, 2] },
    });
    act(() => {
      result.current.activate(2, 'key');
    });
    act(() => {
      result.current.hideReadout();
    });
    expect(result.current).toMatchObject({ active: 2, current: 2, isReadoutHidden: true });

    // The data at 2 is gone: the mark is still set, and it is not current, so nothing is drawn for it.
    rerender({ available: [0, 1] });
    expect(result.current).toMatchObject({ active: 2, current: null, isReadoutHidden: true });

    // Its data is back, and a move to it is a move from nothing current: the readout shows again.
    rerender({ available: [0, 1, 2] });
    act(() => {
      result.current.activate(2, 'key');
    });
    expect(result.current).toMatchObject({ current: 2, isReadoutHidden: true });
    act(() => {
      result.current.hideReadout();
    });
    rerender({ available: [0, 1] });
    act(() => {
      result.current.activate(2, 'key');
    });
    expect(result.current).toMatchObject({ active: 2, isReadoutHidden: false });
  });

  it('shows a hidden readout again only on a move to a different mark', () => {
    const { result } = renderHook(() => useMarks(['a:1', 'b:1', 'c:1']));
    act(() => {
      result.current.activate('b:1', 'key');
    });
    act(() => {
      result.current.hideReadout();
    });
    // A key that goes nowhere, or a pointer over the same mark, leaves the Escape standing.
    act(() => {
      result.current.activate('b:1', 'key');
    });
    act(() => {
      result.current.activate('b:1', 'pointer');
    });
    expect(result.current.isReadoutHidden).toBe(true);
    act(() => {
      result.current.activate('c:1', 'key');
    });
    expect(result.current).toMatchObject({ current: 'c:1', isReadoutHidden: false });
  });

  it('keeps the mark a pointer holds when focus arrives, and lands on the first focus when nothing is held', () => {
    const { result } = renderHook(() => useMarks([0, 1, 2]));
    act(() => {
      result.current.activate(1, 'pointer');
    });
    act(() => {
      result.current.onFocus();
    });
    expect(result.current).toMatchObject({ active: 1, source: 'pointer' });

    act(() => {
      result.current.clear();
    });
    act(() => {
      result.current.onFocus();
    });
    expect(result.current).toMatchObject({ active: 2, source: 'key' });
  });

  it('makes the mark that took focus active, whatever a pointer holds', () => {
    const { result } = renderHook(() => useMarks(['a:1', 'b:1']));
    act(() => {
      result.current.activate('b:1', 'pointer');
    });
    act(() => {
      result.current.onFocus('a:1');
    });
    expect(result.current).toMatchObject({ active: 'a:1', source: 'key', stop: 'a:1' });
  });

  it('keeps the last active mark as the stop when it clears, for a roving tab stop', () => {
    const { result } = renderHook(() => useMarks([0, 1, 2]));
    act(() => {
      result.current.activate(1, 'key');
    });
    act(() => {
      result.current.clear();
    });
    expect(result.current).toMatchObject({ active: null, source: null, stop: 1 });
  });

  it('holds a touch until a press outside the holder, and only a touch', () => {
    const { holder, inside, outside } = setUp();
    const { result } = renderHook(() => useMarks([0, 1, 2], holder));

    act(() => {
      result.current.activate(1, 'touch');
    });
    fireEvent.pointerDown(inside, { pointerType: 'touch' });
    fireEvent.pointerDown(holder, { pointerType: 'touch' });
    expect(result.current).toMatchObject({ active: 1, source: 'touch' });
    fireEvent.pointerDown(outside, { pointerType: 'touch' });
    expect(result.current).toMatchObject({ active: null, source: null, stop: 1 });

    // A mark a mouse set is the pointer's to clear: a press outside leaves it.
    act(() => {
      result.current.activate(2, 'pointer');
    });
    fireEvent.pointerDown(outside, { pointerType: 'mouse' });
    expect(result.current).toMatchObject({ active: 2, source: 'pointer' });
    holder.remove();
    outside.remove();
  });
});
