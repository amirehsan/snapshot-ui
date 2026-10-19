import { Card, MonthGrid, type MonthGridState, type MonthGridYear } from '@snapshot-ui/react';
import type { ReactElement } from 'react';

/** Your states, in your words, each mapped to one of three looks. */
const STATES: MonthGridState[] = [
  { id: 'held', label: 'Held', look: 'filled' },
  { id: 'partial', label: 'Partial', look: 'partial' },
  { id: 'missing', label: 'Missing', look: 'empty' },
];

const H = 'held';
const P = 'partial';
const M = 'missing';

/** Newest first. A month outside the range, before the account opened or not yet come, is null and stays blank. */
const YEARS: MonthGridYear[] = [
  { id: 2026, label: '2026', months: [H, H, H, H, H, H, H, H, H, H, null, null] },
  { id: 2025, label: '2025', months: [H, H, M, M, H, P, H, H, H, H, H, H] },
  { id: 2024, label: '2024', months: [null, null, H, H, H, H, H, H, H, H, M, H] },
];

export default function MonthGridBasic(): ReactElement {
  return (
    <Card>
      <MonthGrid
        label="Statement coverage"
        states={STATES}
        years={YEARS}
        monthLabels={['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D']}
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
