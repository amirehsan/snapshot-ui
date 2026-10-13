import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { entryFor, push, read, useRecents, write } from './recentsStore';

/**
 * A storage that keeps entries as the browser's does, with no browser around it, holding `value` in the
 * entry for `x` when one is given.
 */
function storage(value?: string): Pick<Storage, 'getItem' | 'setItem'> {
  const held = new Map<string, string>(value === undefined ? [] : [[entryFor('x'), value]]);
  return {
    getItem: (key) => held.get(key) ?? null,
    setItem: (key, item) => {
      held.set(key, item);
    },
  };
}

/** A storage the browser refuses to read or write, as a blocked one or a full one does. */
const refusing: Pick<Storage, 'getItem' | 'setItem'> = {
  getItem() {
    throw new DOMException('The operation is insecure.', 'SecurityError');
  },
  setItem() {
    throw new DOMException('The quota has been exceeded.', 'QuotaExceededError');
  },
};

describe('the recents store', () => {
  it('keeps one entry per storage key, under the library prefix', () => {
    expect(entryFor('x')).toBe('snapshot-ui:recent:x');
    expect(entryFor('app-search')).toBe('snapshot-ui:recent:app-search');
  });

  it('reads the stored ids from one JSON list, newest first', () => {
    expect(read(storage('["budgets","transactions"]'), 'x')).toEqual(['budgets', 'transactions']);
    expect(read(storage('[]'), 'x')).toEqual([]);
  });

  it.each([
    ['no entry', undefined],
    ['unreadable JSON', '["budgets"'],
    ['an object', '{"budgets":true}'],
    ['a string', '"budgets"'],
    ['null', 'null'],
  ])('reads %s as no ids', (_name, value) => {
    expect(read(storage(value), 'x')).toEqual([]);
  });

  it('reads only the entry for its own key', () => {
    expect(read(storage('["budgets"]'), 'y')).toEqual([]);
  });

  it('leaves out anything in the list that is not an id string', () => {
    expect(read(storage('["budgets",3,null,{"id":"rent"},"transactions"]'), 'x')).toEqual([
      'budgets',
      'transactions',
    ]);
  });

  it('reads no ids from a storage the browser refuses, or from none, and throws nothing', () => {
    expect(read(refusing, 'x')).toEqual([]);
    expect(read(null, 'x')).toEqual([]);
  });

  it('writes the ids as one JSON list under the entry for its key', () => {
    const stored = storage();
    write(['budgets', 'transactions'], stored, 'x');
    expect(stored.getItem('snapshot-ui:recent:x')).toBe('["budgets","transactions"]');
    expect(read(stored, 'x')).toEqual(['budgets', 'transactions']);
  });

  it('skips a write the browser refuses, or with no storage, and throws nothing', () => {
    expect(() => {
      write(['budgets'], refusing, 'x');
    }).not.toThrow();
    expect(() => {
      write(['budgets'], null, 'x');
    }).not.toThrow();
  });

  it('moves a chosen id to the front, never twice, and cuts the list to the limit', () => {
    expect(push([], 'budgets', 5)).toEqual(['budgets']);
    expect(push(['transactions', 'budgets', 'rent'], 'budgets', 5)).toEqual([
      'budgets',
      'transactions',
      'rent',
    ]);
    expect(push(['a', 'b', 'c', 'd', 'e'], 'f', 5)).toEqual(['f', 'a', 'b', 'c', 'd']);
    expect(push(['a', 'b', 'c'], 'c', 2)).toEqual(['c', 'a']);
  });

  it('changes nothing it is given', () => {
    const stored = Object.freeze(['transactions', 'budgets']);
    expect(push(stored, 'rent', 5)).toEqual(['rent', 'transactions', 'budgets']);
    expect(stored).toEqual(['transactions', 'budgets']);
  });
});

describe('useRecents', () => {
  const ENTRY = 'snapshot-ui:recent:search';

  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  /** Stores ids the way another tab does, under `entry`, and tells this tab as the browser does. */
  function storeInAnotherTab(entry: string, ids: string[]): void {
    localStorage.setItem(entry, JSON.stringify(ids));
    act(() => {
      window.dispatchEvent(
        new StorageEvent('storage', { key: entry, newValue: JSON.stringify(ids), storageArea: localStorage }),
      );
    });
  }

  it('reads the entry for its key', () => {
    localStorage.setItem(ENTRY, '["budgets","transactions"]');
    const { result } = renderHook(() => useRecents('search', 5));
    expect(result.current[0]).toEqual(['budgets', 'transactions']);
  });

  it('records a chosen id at the front, and writes the entry', () => {
    localStorage.setItem(ENTRY, '["budgets","transactions"]');
    const { result } = renderHook(() => useRecents('search', 5));
    act(() => {
      result.current[1]('transactions');
    });
    expect(result.current[0]).toEqual(['transactions', 'budgets']);
    expect(localStorage.getItem(ENTRY)).toBe('["transactions","budgets"]');
    act(() => {
      result.current[1]('rent');
    });
    expect(result.current[0]).toEqual(['rent', 'transactions', 'budgets']);
  });

  it('cuts what it records to the limit', () => {
    const { result } = renderHook(() => useRecents('search', 2));
    for (const id of ['a', 'b', 'c']) {
      act(() => {
        result.current[1](id);
      });
    }
    expect(result.current[0]).toEqual(['c', 'b']);
    expect(localStorage.getItem(ENTRY)).toBe('["c","b"]');
  });

  it("hears another tab's write to its entry, and not to another key's", () => {
    const { result } = renderHook(() => useRecents('search', 5));
    expect(result.current[0]).toEqual([]);
    storeInAnotherTab('snapshot-ui:recent:other', ['rent']);
    expect(result.current[0]).toEqual([]);
    storeInAnotherTab(ENTRY, ['budgets']);
    expect(result.current[0]).toEqual(['budgets']);
  });

  it('keeps the same list from render to render while nothing changes', () => {
    localStorage.setItem(ENTRY, '["budgets"]');
    const { result, rerender } = renderHook(() => useRecents('search', 5));
    const first = result.current[0];
    rerender();
    expect(result.current[0]).toBe(first);
  });

  it('with no key reads nothing and stores nothing', () => {
    localStorage.setItem(ENTRY, '["budgets"]');
    const setItem = vi.spyOn(Storage.prototype, 'setItem');
    const { result } = renderHook(() => useRecents(undefined, 5));
    expect(result.current[0]).toEqual([]);
    act(() => {
      result.current[1]('transactions');
    });
    expect(result.current[0]).toEqual([]);
    expect(setItem).not.toHaveBeenCalled();
  });

  it('reads no ids and records with no error where the browser blocks storage', () => {
    const error = vi.spyOn(console, 'error');
    vi.spyOn(window, 'localStorage', 'get').mockImplementation(() => {
      throw new DOMException('The operation is insecure.', 'SecurityError');
    });
    const { result } = renderHook(() => useRecents('search', 5));
    expect(result.current[0]).toEqual([]);
    act(() => {
      result.current[1]('budgets');
    });
    expect(error).not.toHaveBeenCalled();
  });
});
