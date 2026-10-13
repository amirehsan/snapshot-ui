/*
 * The chart scales: pure, with no React and no DOM, so a server renders every chart from its props alone.
 * Private to the package in 0.1.0.
 */

/** Maps `domain` onto `range`, each [from, to]. A domain of zero width maps every value to the middle of the range. */
export function linearScale(
  domain: readonly [number, number],
  range: readonly [number, number],
): (value: number) => number {
  const [d0, d1] = domain;
  const [r0, r1] = range;
  if (d0 === d1) return () => (r0 + r1) / 2;
  // A span past the largest number overflows to Infinity, so such a domain is scaled by halves, which fit.
  if (!Number.isFinite(d1 - d0))
    return (value) => r0 + ((value / 2 - d0 / 2) / (d1 / 2 - d0 / 2)) * (r1 - r0);
  return (value) => r0 + ((value - d0) / (d1 - d0)) * (r1 - r0);
}

/** The least and the greatest finite value, with 0 among them when `includeZero`; undefined when there is none. */
export function extent(
  values: readonly number[],
  options: { includeZero?: boolean } = {},
): [number, number] | undefined {
  let min = Number.POSITIVE_INFINITY;
  let max = Number.NEGATIVE_INFINITY;
  for (const value of values) {
    if (!Number.isFinite(value)) continue;
    if (value < min) min = value;
    if (value > max) max = value;
  }
  if (min > max) return undefined;
  return options.includeZero ? [Math.min(0, min), Math.max(0, max)] : [min, max];
}

/** The multiples of a power of ten a step may be, smallest first. */
const STEPS = [1, 2, 2.5, 5, 10];

/** A value with the float noise of its arithmetic taken off, so 0.1 + 0.2 never reaches the page. */
const clean = (value: number): number => Number(value.toPrecision(12));

/** The domain rounded outward to four clean steps of 1, 2, 2.5 or 5 times a power of ten. */
export function niceDomain(min: number, max: number): [number, number] {
  if (min === max) return min === 0 ? [0, 1] : niceDomain(Math.min(0, min), Math.max(0, max));
  const raw = (max - min) / 4;
  const power = 10 ** Math.floor(Math.log10(raw));
  const step = clean((STEPS.find((multiple) => clean(multiple * power) >= raw) ?? 10) * power);
  return [clean(Math.floor(min / step) * step), clean(Math.ceil(max / step) * step)];
}
