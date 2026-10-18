import type { ReactElement } from 'react';
import type { ChartBlock } from './ChartTable';

/** One key and its label. The chart's CSS draws the key from the data attributes the item is given. */
export interface ChartLegendItem {
  /** The series' name, the app's string. */
  label: string;
  /** The series' place, 1 or 2, which LineChart's keys are drawn by. */
  series?: number;
  /** The series' color by name, which a bar's key is drawn by. */
  color?: string;
  /** The key's shape: a stroke, a filled swatch or the hatched swatch of a previous period. */
  look?: 'line' | 'swatch' | 'hatched';
}

/** A list of keys and their labels. No state of its own. */
export function ChartLegend({
  block,
  items,
}: {
  block: ChartBlock;
  items: readonly ChartLegendItem[];
}): ReactElement {
  return (
    <ul className={`${block}-legend`}>
      {items.map((item, at) => (
        <li
          key={at}
          className={`${block}-legend-item`}
          data-series={item.series}
          data-color={item.color}
          data-look={item.look}
        >
          <span className={`${block}-key`} aria-hidden="true" />
          <span className={`${block}-legend-label`}>{item.label}</span>
        </li>
      ))}
    </ul>
  );
}
