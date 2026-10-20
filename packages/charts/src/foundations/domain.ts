/*
 * The value axis's domain, shared by the charts: pure, with no React and no DOM. Private to the package.
 */
import { extent, niceDomain } from './scale';

/** Both ends finite, so a domain can be drawn. */
const finiteDomain = (domain: readonly [number, number] | undefined): domain is readonly [number, number] =>
  domain !== undefined && Number.isFinite(domain[0]) && Number.isFinite(domain[1]);

/**
 * `given` as given, else niceDomain over the values with zero included; [0, 1] with no values. A nice domain
 * that would pass the largest number is the values' own extent instead, and a `given` that is not finite is
 * ignored, so every coordinate stays a number. A domain from the values always holds zero; with `includeZero`
 * a given one is widened to zero at its near end too, in the order it was given.
 */
export function valueDomain(
  values: readonly number[],
  given?: readonly [number, number],
  options: { includeZero?: boolean } = {},
): [number, number] {
  if (finiteDomain(given)) {
    if (!options.includeZero) return [given[0], given[1]];
    const [from, to] = given;
    return from <= to ? [Math.min(from, 0), Math.max(to, 0)] : [Math.max(from, 0), Math.min(to, 0)];
  }
  const range = extent(values, { includeZero: true });
  if (!range) return [0, 1];
  const nice = niceDomain(range[0], range[1]);
  return finiteDomain(nice) ? nice : range;
}
