import { describe, expect, it } from 'vitest';
import { keysOf, presentKeys, staleKeys, toggled } from './selection';

interface Item {
  id: string;
}

const ITEMS: readonly Item[] = [{ id: 'a' }, { id: 'b' }, { id: 'c' }, { id: 'd' }];
const getKey = (item: Item): string => item.id;

describe('selection', () => {
  it('maps all to the given rows enabled keys', () => {
    expect(keysOf('all', ITEMS, getKey, new Set())).toEqual(['a', 'b', 'c', 'd']);
    expect(keysOf('all', ITEMS, getKey, new Set(['b', 'd']))).toEqual(['a', 'c']);
    expect(keysOf('all', [], getKey, new Set())).toEqual([]);
  });

  it('passes a Set on as its keys in order', () => {
    expect(keysOf(new Set(['c', 'a', 'zz']), ITEMS, getKey, new Set())).toEqual(['c', 'a', 'zz']);
    expect(keysOf(new Set(), ITEMS, getKey, new Set())).toEqual([]);
  });

  it('keeps only the keys present in items for the count', () => {
    const present = new Set(['a', 'b', 'c']);
    expect(presentKeys(['c', 'x', 'a', 'y'], present)).toEqual(['c', 'a']);
    expect(presentKeys([], present)).toEqual([]);
    // A number key is not the string with the same digits.
    expect(presentKeys([1, '1'], new Set<string | number>(['1']))).toEqual(['1']);
  });

  it('names the stale keys', () => {
    const present = new Set(['a', 'b', 'c']);
    expect(staleKeys(['c', 'x', 'a', 'y'], present)).toEqual(['x', 'y']);
    expect(staleKeys(['a'], present)).toEqual([]);
  });

  it('toggles a key in and out, keeping the order', () => {
    expect(toggled(['a', 'c'], 'b')).toEqual(['a', 'c', 'b']);
    expect(toggled(['a', 'b', 'c'], 'b')).toEqual(['a', 'c']);
    expect(toggled([], 'a')).toEqual(['a']);
  });
});
