import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useChangedDescription } from './useChangedDescription';

describe('useChangedDescription', () => {
  it('leaves aria-describedby alone while the field is not changed', () => {
    const none = renderHook(() => useChangedDescription({ isChanged: false }));
    expect(none.result.current.describedBy).toBeUndefined();
    const caller = renderHook(() => useChangedDescription({ describedBy: 'note' }));
    expect(caller.result.current.describedBy).toBe('note');
  });

  it('names the chip while the field is changed', () => {
    const { result } = renderHook(() => useChangedDescription({ isChanged: true }));
    expect(result.current.chipId).not.toBe('');
    expect(result.current.describedBy).toBe(result.current.chipId);
  });

  it('puts the chip after the id the caller passed', () => {
    const { result } = renderHook(() =>
      useChangedDescription({ isChanged: true, describedBy: 'note other' }),
    );
    expect(result.current.describedBy).toBe(`note other ${result.current.chipId}`);
  });

  it('drops the chip while the field is invalid, and keeps what the caller passed', () => {
    const { result } = renderHook(() =>
      useChangedDescription({ isChanged: true, isInvalid: true, describedBy: 'note' }),
    );
    expect(result.current.describedBy).toBe('note');
    const alone = renderHook(() => useChangedDescription({ isChanged: true, isInvalid: true }));
    expect(alone.result.current.describedBy).toBeUndefined();
  });

  it('follows the field as it changes and becomes invalid, with one id throughout', () => {
    const { result, rerender } = renderHook((props) => useChangedDescription(props), {
      initialProps: { isChanged: false, isInvalid: false, describedBy: 'note' },
    });
    const { chipId } = result.current;
    expect(result.current.describedBy).toBe('note');
    rerender({ isChanged: true, isInvalid: false, describedBy: 'note' });
    expect(result.current.describedBy).toBe(`note ${chipId}`);
    rerender({ isChanged: true, isInvalid: true, describedBy: 'note' });
    expect(result.current.describedBy).toBe('note');
    expect(result.current.chipId).toBe(chipId);
  });

  it.each([
    { isLabelled: true, isChanged: false, names: 'nothing' },
    { isLabelled: true, isChanged: true, names: 'the chip' },
    { isLabelled: false, isChanged: false, names: 'nothing' },
    { isLabelled: false, isChanged: true, names: 'the mark' },
  ])(
    'names $names when labelled is $isLabelled and changed is $isChanged',
    ({ isLabelled, isChanged, names }) => {
      const { result } = renderHook(() =>
        useChangedDescription({ isChanged, isLabelled, describedBy: 'note' }),
      );
      const { chipId, markId, describedBy } = result.current;
      expect(markId).not.toBe(chipId);
      const expected = { nothing: 'note', 'the chip': `note ${chipId}`, 'the mark': `note ${markId}` }[names];
      expect(describedBy).toBe(expected);
    },
  );

  it('names neither the chip nor the mark while the field is invalid', () => {
    for (const isLabelled of [true, false]) {
      const { result } = renderHook(() =>
        useChangedDescription({ isChanged: true, isInvalid: true, isLabelled, describedBy: 'note' }),
      );
      expect(result.current.describedBy, String(isLabelled)).toBe('note');
    }
  });

  it('gives each field its own chip id', () => {
    const first = renderHook(() => useChangedDescription({ isChanged: true }));
    const second = renderHook(() => useChangedDescription({ isChanged: true }));
    expect(first.result.current.chipId).not.toBe(second.result.current.chipId);
  });
});
