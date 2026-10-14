import { RangeCalendar, type DateRangePreset } from '@snapshot-ui/react';
import type { ReactElement } from 'react';

/** The app's presets, computed on the server from its own today, 2026-09-18, with its own words. */
const PRESETS: DateRangePreset[] = [
  { id: 'last-7', label: 'Last 7 days', range: { start: '2026-09-12', end: '2026-09-18' } },
  { id: 'this-month', label: 'This month', range: { start: '2026-09-01', end: '2026-09-30' } },
  { id: 'last-month', label: 'Last month', range: { start: '2026-08-01', end: '2026-08-31' } },
];

export default function CalendarRange(): ReactElement {
  return (
    <RangeCalendar
      aria-label="Statement period"
      defaultValue={{ start: '2026-09-12', end: '2026-09-18' }}
      today="2026-09-18"
      presets={PRESETS}
    />
  );
}
