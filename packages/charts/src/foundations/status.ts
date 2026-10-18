/*
 * The three states a chart draws in its own space, and their strings: types only, shared by the charts. Private
 * to the package; each chart exports the strings' type as its own.
 */

/** Which face a chart draws: its data, or a state in the data's place. */
export type ChartStatus = 'ready' | 'loading' | 'empty' | 'error';

/** The strings of the three states, shared by BarChart and LineChart. Give all three. */
export interface ChartStatusLabels {
  /** The polite status while loading: "Loading". */
  loading: string;
  /** Drawn in the chart when `status` is 'empty' and no `statusContent` is given: "Nothing to show for this period". */
  empty: string;
  /** Drawn in the chart when `status` is 'error' and no `statusContent` is given: "The chart could not be loaded". */
  error: string;
}
