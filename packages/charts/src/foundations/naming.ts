/*
 * How a chart is named: pure, with no React and no DOM. Private to the package.
 */

/** A string that names something: given and not only spaces. */
export function named(text: string | undefined): text is string {
  return text !== undefined && text.trim() !== '';
}

/** A chart's names, from the app's `aria-labelledby` and `aria-label`. */
export interface ChartName {
  /** The app's `aria-labelledby`, when it names something: the figure's name and the table's. */
  labelledBy: string | undefined;
  /** The app's `aria-label`, when it names something and no `aria-labelledby` does: the figure's name and the table's caption. */
  label: string | undefined;
  /** The one tab stop's name: the first of the two that names something, else the fallback ids. */
  stop: { 'aria-labelledby': string } | { 'aria-label': string };
}

/**
 * The first name that names something, aria-labelledby first. With neither, the fallback ids (a chart's
 * column headers) name the tab stop, so it is never a chart with no name.
 */
export function chartName(
  name: { 'aria-label'?: string; 'aria-labelledby'?: string },
  fallbackIds: readonly string[],
): ChartName {
  const labelledBy = named(name['aria-labelledby']) ? name['aria-labelledby'] : undefined;
  const label = labelledBy === undefined && named(name['aria-label']) ? name['aria-label'] : undefined;
  const stop =
    labelledBy !== undefined
      ? { 'aria-labelledby': labelledBy }
      : label !== undefined
        ? { 'aria-label': label }
        : { 'aria-labelledby': fallbackIds.join(' ') };
  return { labelledBy, label, stop };
}
