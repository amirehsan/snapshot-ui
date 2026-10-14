import { describe, expect, it } from 'vitest';
import { faceOfMinor, toMinor, toUnits } from './money';

describe('money', () => {
  it('converts minor units to whole units and back with no drift: 1999, 1, -1, 123450, 0', () => {
    for (const minor of [1999, 1, -1, 123450, 0, 1005]) {
      for (const digits of [0, 1, 2, 3]) {
        const back = toMinor(toUnits(minor, digits), digits);
        expect(back, `${String(minor)} at ${String(digits)}`).toBe(minor);
        expect(Number.isInteger(back), `${String(minor)} at ${String(digits)}`).toBe(true);
      }
    }
    expect(toUnits(1999, 2)).toBe(19.99);
    expect(toUnits(-1, 2)).toBe(-0.01);
    // 19.99 * 100 is 1998.9999999999998 in floating point; the rounding makes it exact.
    expect(toMinor(19.99, 2)).toBe(1999);
    expect(toMinor(1.01, 3)).toBe(1010);
  });

  it('never returns -0: a negative zero, or a negative that rounds to zero, is 0', () => {
    expect(Object.is(toMinor(-0, 2), 0)).toBe(true);
    expect(Object.is(toMinor(-0.001, 2), 0)).toBe(true);
    expect(Object.is(toMinor(-0, 0), 0)).toBe(true);
  });

  it('reads NaN as null and null as NaN', () => {
    expect(toMinor(Number.NaN, 2)).toBeNull();
    expect(toUnits(null, 2)).toBeNaN();
    expect(toUnits(undefined, 2)).toBeNaN();
  });

  it('writes the face with ASCII digits, no grouping and the hyphen-minus, for 0 to 3 digits', () => {
    expect(faceOfMinor(-123450, 2)).toBe('-1234.50');
    expect(faceOfMinor(5, 2)).toBe('0.05');
    expect(faceOfMinor(-0, 2)).toBe('0.00');
    expect(faceOfMinor(1234, 0)).toBe('1234');
    expect(faceOfMinor(1, 3)).toBe('0.001');
    expect(faceOfMinor(12345678, 1)).toBe('1234567.8');
    expect(faceOfMinor(null, 2)).toBe('');
  });
});
