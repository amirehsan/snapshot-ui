import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useValueLength } from './useValueLength';

describe('useValueLength', () => {
  it('starts from the default value, and from nothing without one', () => {
    const empty = renderHook(() => useValueLength({}));
    expect(empty.result.current.length).toBe(0);
    const started = renderHook(() => useValueLength({ defaultValue: 'abcdefgh' }));
    expect(started.result.current.length).toBe(8);
  });

  it('follows what is typed', () => {
    const { result } = renderHook(() => useValueLength({ defaultValue: 'abc' }));
    act(() => {
      result.current.onChange('abcdef');
    });
    expect(result.current.length).toBe(6);
    act(() => {
      result.current.onChange('');
    });
    expect(result.current.length).toBe(0);
  });

  it('counts a line break as one character', () => {
    const { result } = renderHook(() => useValueLength({}));
    act(() => {
      result.current.onChange('one\ntwo');
    });
    expect(result.current.length).toBe(7);
  });

  it('tells the caller what was typed, after it has counted it', () => {
    const calls: string[] = [];
    const onChange = vi.fn((value: string) => {
      calls.push(value);
    });
    const { result } = renderHook(() => useValueLength({ onChange }));
    act(() => {
      result.current.onChange('abc');
    });
    expect(onChange).toHaveBeenCalledOnce();
    expect(calls).toEqual(['abc']);
  });

  it('works when the caller passes no change handler', () => {
    const { result } = renderHook(() => useValueLength({}));
    expect(() => {
      act(() => {
        result.current.onChange('abc');
      });
    }).not.toThrow();
    expect(result.current.length).toBe(3);
  });

  it('counts the controlled value and not what was typed', () => {
    const { result, rerender } = renderHook((props) => useValueLength(props), {
      initialProps: { value: 'abcdefgh' },
    });
    expect(result.current.length).toBe(8);
    act(() => {
      result.current.onChange('abcdefghxyz');
    });
    expect(result.current.length).toBe(8);
    rerender({ value: 'abcdefghij' });
    expect(result.current.length).toBe(10);
  });
});
