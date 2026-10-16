import { describe, expect, it } from 'vitest';
import { groupsOf } from './groups';

interface Row {
  id: string;
  day: string;
}

const row = (id: string, day: string): Row => ({ id, day });
const byDay = (item: Row): { id: string; label: string } => ({ id: item.day, label: `Day ${item.day}` });
const ids = (items: readonly Row[]): string[] => items.map((item) => item.id);

describe('groupsOf', () => {
  it('groups adjacent rows with the same id, in items order', () => {
    const groups = groupsOf([row('a', '14'), row('b', '14'), row('c', '13'), row('d', '12')], byDay);
    expect(groups.map((group) => group.label)).toEqual(['Day 14', 'Day 13', 'Day 12']);
    expect(groups.map((group) => ids(group.items))).toEqual([['a', 'b'], ['c'], ['d']]);
  });

  it('starts a new group when an id comes back after another, with a key of its own', () => {
    // Sorted by amount, the days interleave: a run per day, never one group gathered from across the list.
    const groups = groupsOf([row('a', '14'), row('b', '13'), row('c', '14')], byDay);
    expect(groups.map((group) => ids(group.items))).toEqual([['a'], ['b'], ['c']]);
    expect(groups.map((group) => group.label)).toEqual(['Day 14', 'Day 13', 'Day 14']);
    const keys = groups.map((group) => group.key);
    expect(new Set(keys).size).toBe(3);
    expect(keys).toEqual(['0:14', '1:13', '2:14']);
  });

  it('makes one ungrouped group without getGroup', () => {
    const groups = groupsOf([row('a', '14'), row('b', '13')]);
    expect(groups).toHaveLength(1);
    expect(groups[0]?.label).toBeNull();
    expect(groups[0]?.key).toBe('all');
    expect(ids(groups[0]?.items ?? [])).toEqual(['a', 'b']);
  });

  it('makes no group for no items', () => {
    expect(groupsOf([], byDay)).toEqual([]);
    expect(groupsOf([])).toEqual([]);
  });
});
