import { describe, expect, it } from 'vitest';
import { cx } from './cx';

describe('cx', () => {
  it('joins truthy class names with single spaces', () => {
    expect(cx('a', undefined, 'b', false, null, '', 'c')).toBe('a b c');
  });

  it('returns an empty string when there is nothing to join', () => {
    expect(cx()).toBe('');
  });
});
