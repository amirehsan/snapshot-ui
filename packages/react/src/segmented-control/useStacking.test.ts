import { describe, expect, it } from 'vitest';
import { stacksOptions } from './useStacking';

describe('stacksOptions', () => {
  it('keeps one row while the row fits, and stacks when it does not', () => {
    expect(stacksOptions(200, 300)).toBe(false);
    expect(stacksOptions(300, 300)).toBe(false);
    expect(stacksOptions(400, 300)).toBe(true);
  });

  it('allows a row half a pixel over its room, which still paints inside it', () => {
    expect(stacksOptions(300.5, 300)).toBe(false);
    expect(stacksOptions(300.6, 300)).toBe(true);
  });

  it('keeps the current arrangement when either width is unknown', () => {
    expect(stacksOptions(0, 300, true)).toBe(true);
    expect(stacksOptions(400, 0, true)).toBe(true);
    expect(stacksOptions(0, 300, false)).toBe(false);
    expect(stacksOptions(400, 0, false)).toBe(false);
    expect(stacksOptions(Number.NaN, 300, true)).toBe(true);
  });
});
