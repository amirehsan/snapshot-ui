import type { LinePoint, LineSeries } from '@snapshot-ui/charts';

/** October, as the app formats its days. Shared by the line chart examples. */
export const DAYS: string[] = Array.from({ length: 31 }, (_, index) => `Oct ${String(index + 1)}`);

/** A day's spending as a point: the number to draw and the app's string to say it. */
const point = (value: number): LinePoint => ({ value, valueLabel: `$${value.toFixed(2)}` });

/** This month, Oct 1 to Oct 31: rising to $84.20 with the dips a real month has. */
export const THIS_MONTH: LineSeries = {
  label: 'This month',
  points: [
    42.1, 38.5, 55, 61.2, 47.8, 33.4, 29.9, 52.6, 64.3, 58, 49.5, 71.2, 66.8, 54.1, 45.7, 39.2, 62.4, 77.9,
    70.3, 58.8, 51.6, 48.2, 66, 73.5, 80.1, 69.4, 57.3, 62.9, 75.6, 81.8, 84.2,
  ].map(point),
};

/** Last month, day by day: the context, flatter. */
export const LAST_MONTH: LineSeries = {
  label: 'Last month',
  points: [
    35, 41.2, 47.5, 44.8, 39.1, 36.6, 42.3, 50.4, 53.7, 49.9, 46.2, 52.8, 58.1, 55.6, 51.3, 47, 53.9, 60.2,
    57.4, 54, 50.7, 56.3, 61.8, 59.5, 63.2, 60, 56.8, 62.5, 66.1, 64.4, 61,
  ].map(point),
};

/** The gridlines, each with the app's label. */
export const TICKS: { value: number; label: string }[] = [
  { value: 0, label: '$0' },
  { value: 50, label: '$50' },
  { value: 100, label: '$100' },
];
