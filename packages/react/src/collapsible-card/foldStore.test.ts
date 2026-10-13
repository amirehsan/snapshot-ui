// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { next, read, write } from './foldStore';

/** The entry the store keeps its folds in. */
const ENTRY = 'snapshot-ui:collapsed';

/**
 * A storage that keeps entries as the browser's does, with no browser around it, holding `value` in the
 * entry when one is given.
 */
function storage(value?: string): Pick<Storage, 'getItem' | 'setItem'> {
  const held = new Map<string, string>(value === undefined ? [] : [[ENTRY, value]]);
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

describe('the fold store', () => {
  it('runs with no browser, so the stored folds are read and written by pure functions', () => {
    expect(typeof window).toBe('undefined');
  });

  it('reads the folded keys from one JSON list', () => {
    expect(read(storage('["notifications","billing"]'))).toEqual(['notifications', 'billing']);
    expect(read(storage('[]'))).toEqual([]);
  });

  it.each([
    ['no entry', undefined],
    ['unreadable JSON', '["notifications"'],
    ['an object', '{"notifications":true}'],
    ['a string', '"notifications"'],
    ['null', 'null'],
  ])('reads %s as no folded keys', (_name, value) => {
    expect(read(storage(value))).toEqual([]);
  });

  it('leaves out anything in the list that is not a key', () => {
    expect(read(storage('["notifications",3,null,{"key":"billing"},"billing"]'))).toEqual([
      'notifications',
      'billing',
    ]);
  });

  it('reads no folded keys from a storage the browser refuses, or from none, and throws nothing', () => {
    expect(read(refusing)).toEqual([]);
    expect(read(null)).toEqual([]);
  });

  it('writes the folded keys as one JSON list', () => {
    const stored = storage();
    write(['notifications', 'billing'], stored);
    expect(stored.getItem(ENTRY)).toBe('["notifications","billing"]');
    expect(read(stored)).toEqual(['notifications', 'billing']);
    write([], stored);
    expect(stored.getItem(ENTRY)).toBe('[]');
  });

  it('skips a write the browser refuses, or with no storage, and throws nothing', () => {
    expect(() => {
      write(['notifications'], refusing);
    }).not.toThrow();
    expect(() => {
      write(['notifications'], null);
    }).not.toThrow();
  });

  it('adds the key of a card that folds, after the others', () => {
    expect(next([], 'notifications', true)).toEqual(['notifications']);
    expect(next(['billing'], 'notifications', true)).toEqual(['billing', 'notifications']);
  });

  it('takes out the key of a card that opens, and keeps every other key as it was', () => {
    expect(next(['billing', 'notifications', 'profile'], 'notifications', false)).toEqual([
      'billing',
      'profile',
    ]);
    expect(next(['billing'], 'notifications', false)).toEqual(['billing']);
  });

  it('keeps a key once, however often its card folds', () => {
    expect(next(['notifications', 'billing'], 'notifications', true)).toEqual(['billing', 'notifications']);
    expect(next(['notifications', 'notifications'], 'notifications', false)).toEqual([]);
  });

  it('changes nothing it is given', () => {
    const stored = Object.freeze(['billing', 'notifications']);
    expect(next(stored, 'profile', true)).toEqual(['billing', 'notifications', 'profile']);
    expect(next(stored, 'billing', false)).toEqual(['notifications']);
    expect(stored).toEqual(['billing', 'notifications']);
  });
});
