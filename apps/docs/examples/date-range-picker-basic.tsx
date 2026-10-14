import { DateRangePicker } from '@snapshot-ui/react';
import type { ReactElement } from 'react';

export default function DateRangePickerBasic(): ReactElement {
  return (
    <div className="stack" style={{ width: '100%', maxWidth: '24rem' }}>
      <DateRangePicker
        label="Statement period"
        description="Type the dates, or choose them on the calendar."
        defaultValue={{ start: '2026-09-01', end: '2026-09-30' }}
        // The app's own words for the range, shown before the page hydrates.
        valueLabel="1 to 30 Sep 2026"
        today="2026-09-18"
        startName="from"
        endName="to"
      />
    </div>
  );
}
