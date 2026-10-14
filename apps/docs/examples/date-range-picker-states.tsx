import { DateRangePicker } from '@snapshot-ui/react';
import type { ReactElement } from 'react';

export default function DateRangePickerStates(): ReactElement {
  return (
    <div className="stack" style={{ width: '100%', maxWidth: '24rem' }}>
      <DateRangePicker
        label="Billing period"
        defaultValue={{ start: '2026-09-01', end: '2026-09-30' }}
        valueLabel="1 to 30 Sep 2026"
        today="2026-09-18"
        isChanged
      />
      <DateRangePicker
        label="Trip"
        defaultValue={{ start: '2026-09-14', end: '2026-09-20' }}
        valueLabel="14 to 20 Sep 2026"
        today="2026-09-18"
        isInvalid
        errorMessage="End the trip after it starts."
      />
      <DateRangePicker
        label="Contract term"
        defaultValue={{ start: '2026-01-01', end: '2026-12-31' }}
        valueLabel="1 Jan to 31 Dec 2026"
        today="2026-09-18"
        isDisabled
      />
    </div>
  );
}
