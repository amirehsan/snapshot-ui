import { Card, MonthGrid, type MonthGridState } from '@snapshot-ui/react';
import type { ReactElement } from 'react';

/**
 * Other words for the same three looks: a statement reconciled is filled, one uploaded and not yet checked is
 * partial, and one not received is an outline. None of them is a color of warning or error.
 */
const STATES: MonthGridState[] = [
  { id: 'reconciled', label: 'Reconciled', look: 'filled' },
  { id: 'uploaded', label: 'Uploaded, not checked', look: 'partial' },
  { id: 'unreceived', label: 'Not received', look: 'empty' },
];

const R = 'reconciled';
const U = 'uploaded';
const N = 'unreceived';

export default function MonthGridLooks(): ReactElement {
  return (
    // The grid takes no width from its months, so a holder sized by its content, as this card is here, gives it one.
    <Card style={{ width: '100%', maxWidth: '40rem' }}>
      <MonthGrid
        label="Savings statements"
        states={STATES}
        years={[
          // Opened in May 2025: January to April are outside the range, and blank.
          { id: 2026, label: '2026', months: [R, R, R, R, R, R, U, U, N, U, null, null] },
          { id: 2025, label: '2025', months: [null, null, null, null, R, R, R, R, R, R, R, R] },
        ]}
        monthLabels={['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']}
        monthNames={[
          'January',
          'February',
          'March',
          'April',
          'May',
          'June',
          'July',
          'August',
          'September',
          'October',
          'November',
          'December',
        ]}
      />
    </Card>
  );
}
