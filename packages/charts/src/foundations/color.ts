/*
 * The colors a chart's series may take, by name, which the chart writes as `data-color` and charts.css draws.
 * Types only. Private to the package; BarChart exports it as its own (spec 7.2).
 */

/** A series' color: a role, a meaning, or a palette slot (spec 5.4). */
export type ChartColor = 'ink' | 'slate' | 'gain' | 'chart-1' | 'chart-2' | 'chart-3' | 'chart-4';
