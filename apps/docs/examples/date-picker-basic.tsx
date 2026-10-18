import { DatePicker } from '@snapshot-ui/react';
import type { ReactElement } from 'react';

export default function DatePickerBasic(): ReactElement {
  return (
    <div className="stack" style={{ width: '100%', maxWidth: '20rem' }}>
      <DatePicker
        label="Date"
        description="The day on the receipt."
        defaultValue="2026-10-14"
        // The app's own words for the day, shown before the page hydrates.
        valueLabel="14 Oct 2026"
        today="2026-10-16"
        name="date"
      />
    </div>
  );
}
