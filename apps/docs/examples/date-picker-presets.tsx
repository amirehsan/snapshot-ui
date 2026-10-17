import { DatePicker, type DatePreset } from '@snapshot-ui/react';
import type { ReactElement } from 'react';

/** The app's days, computed on the server from its own today, 2026-10-16, with its own words. */
const PRESETS: DatePreset[] = [
  { id: 'today', label: 'Today', date: '2026-10-16' },
  { id: 'yesterday', label: 'Yesterday', date: '2026-10-15' },
];

export default function DatePickerPresets(): ReactElement {
  return (
    <div className="stack" style={{ width: '100%', maxWidth: '20rem' }}>
      <DatePicker
        label="Paid on"
        defaultValue="2026-10-16"
        valueLabel="16 Oct 2026"
        today="2026-10-16"
        presets={PRESETS}
      />
    </div>
  );
}
