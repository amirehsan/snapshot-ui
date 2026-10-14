import { I18nProvider, NumberField } from '@snapshot-ui/react';
import type { ReactElement } from 'react';

export default function NumberFieldPersian(): ReactElement {
  return (
    <I18nProvider locale="fa-IR">
      <div className="stack" dir="rtl" lang="fa" style={{ width: '100%', maxWidth: '20rem' }}>
        <NumberField
          label="مبلغ"
          money={{ symbol: 'تومان', symbolPosition: 'end', fractionDigits: 0 }}
          defaultValue={1250000}
        />
        <NumberField
          label="بازپرداخت"
          money={{ symbol: '$', symbolPosition: 'end' }}
          allowsNegative
          defaultValue={-4250}
          labels={{ negative: 'منفی' }}
        />
      </div>
    </I18nProvider>
  );
}
