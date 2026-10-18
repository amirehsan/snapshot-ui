/*
 * The numbers a chart writes into its HTML: three decimals at most, so a server and a browser write the same
 * string. Pure, with no React, no DOM and no Intl. Private to the package.
 */

/** A number for an svg attribute: three decimals at most, and String writes -0 as 0. */
export function coordinate(value: number): string {
  return String(Math.round(value * 1000) / 1000);
}

/** A percentage of the plot, for an HTML mark placed over the svg. */
export function percent(value: number): string {
  return `${coordinate(value)}%`;
}
