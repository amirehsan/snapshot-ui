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

  it('gives each field its own chip id', () => {
    const first = renderHook(() => useChangedDescription({ isChanged: true }));
    const second = renderHook(() => useChangedDescription({ isChanged: true }));
    expect(first.result.current.chipId).not.toBe(second.result.current.chipId);
  });
});
