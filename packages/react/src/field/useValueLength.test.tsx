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

  it('counts every position of the string it is given, a line break included', () => {
    const { result } = renderHook(() => useValueLength({}));
    act(() => {
      result.current.onChange('one\ntwo');
    });
    expect(result.current.length).toBe(7);
  });

  it('counts UTF-16 code units: an emoji counts 2, and so does an accent built from two code points', () => {
    const emoji = renderHook(() => useValueLength({ defaultValue: '\u{1F44D}' }));
    expect(emoji.result.current.length).toBe(2);
    const typed = renderHook(() => useValueLength({}));
    act(() => {
      typed.result.current.onChange('e\u0301');
    });
    expect(typed.result.current.length).toBe(2);
    const controlled = renderHook(() => useValueLength({ value: 'a\u{1F44D}b' }));
    expect(controlled.result.current.length).toBe(4);
  });

  it('tells the caller what was typed', () => {
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

  it('counts an empty controlled value as empty, and not the length of what was typed', () => {
    const { result } = renderHook((props) => useValueLength(props), {
      initialProps: { value: '' },
    });
    act(() => {
      result.current.onChange('abc');
    });
    expect(result.current.length).toBe(0);
  });
});
