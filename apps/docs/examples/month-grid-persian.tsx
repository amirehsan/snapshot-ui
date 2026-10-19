import { Card, MonthGrid, type MonthGridState, type MonthGridYear } from '@snapshot-ui/react';
import type { ReactElement } from 'react';

const STATES: MonthGridState[] = [
  { id: 'held', label: 'موجود', look: 'filled' },
  { id: 'partial', label: 'ناقص', look: 'partial' },
  { id: 'missing', label: 'ناموجود', look: 'empty' },
];

const H = 'held';
const P = 'partial';
const M = 'missing';

/**
 * Placed in Persian years and months by the app, as the code under this example shows: 1404 with Khordad and Tir
 * missing and Shahrivar partial, and 1403 from Tir, when the account opened.
 */
const YEARS: MonthGridYear[] = [
  { id: 1404, label: '۱۴۰۴', months: [H, H, M, M, H, P, H, H, H, H, H, H] },
  { id: 1403, label: '۱۴۰۳', months: [null, null, null, H, H, H, H, H, H, H, H, H] },
];

export default function MonthGridPersian(): ReactElement {
  return (
    // The grid takes no width from its months, so a holder sized by its content, as this card is here, gives it one.
    <Card dir="rtl" lang="fa" style={{ width: '100%', maxWidth: '40rem' }}>
      <MonthGrid
        label="صورت‌حساب‌ها"
        states={STATES}
        years={YEARS}
        monthLabels={['فر', 'ار', 'خر', 'تی', 'مر', 'شه', 'مه', 'آب', 'آذ', 'دی', 'به', 'اس']}
        monthNames={[
          'فروردین',
          'اردیبهشت',
          'خرداد',
          'تیر',
          'مرداد',
          'شهریور',
          'مهر',
          'آبان',
          'آذر',
          'دی',
          'بهمن',
          'اسفند',
        ]}
        // The English default does not speak Persian: the app writes its own sentence and table words.
        summary="ناموجود: خرداد و تیر ۱۴۰۴. ناقص: شهریور ۱۴۰۴."
        labels={{ year: 'سال', outside: 'خارج از بازه' }}
      />
    </Card>
  );
}
