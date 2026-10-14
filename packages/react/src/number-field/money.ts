/*
 * Money as an integer count of minor units (ruling 4), converted at React Aria's edge. Pure, with no Intl: the
 * face is written by integer arithmetic, so it is the same bytes on every server and in every browser.
 */

/** Minor units as whole units for React Aria, NaN for an empty field (React Aria's empty value). */
export const toUnits = (minor: number | null | undefined, digits: number): number =>
  minor == null ? Number.NaN : minor / 10 ** digits;

/**
 * React Aria's committed number as minor units, null for its NaN. React Aria has rounded it to `digits`. Adding 0
 * turns a -0, from "-0" typed or a negative that rounds to zero, into 0.
 */
export const toMinor = (units: number, digits: number): number | null =>
  Number.isNaN(units) ? null : Math.round(units * 10 ** digits) + 0;

/** The face: ASCII digits, no grouping, the hyphen-minus. faceOfMinor(-123450, 2) is "-1234.50". */
export function faceOfMinor(minor: number | null, digits: number): string {
  if (minor === null) return '';
  const sign = minor < 0 ? '-' : '';
  const units = Math.abs(minor);
  if (digits === 0) return `${sign}${String(units)}`;
  const scale = 10 ** digits;
  return `${sign}${String(Math.floor(units / scale))}.${String(units % scale).padStart(digits, '0')}`;
}
