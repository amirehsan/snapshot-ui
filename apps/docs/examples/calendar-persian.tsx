import { Calendar, I18nProvider } from '@snapshot-ui/react';
import type { ReactElement } from 'react';

/** The three locales: the Persian calendar, the Gregorian calendar in Persian digits, and Latin digits. */
const LOCALES = ['fa-IR', 'fa-IR-u-ca-gregory', 'fa-IR-u-nu-latn'];

export default function CalendarPersian(): ReactElement {
  return (
    <div data-calendar-persian="" dir="rtl" lang="fa" style={{ display: 'flex', flexWrap: 'wrap', gap: 32 }}>
      {LOCALES.map((locale) => (
        <I18nProvider key={locale} locale={locale}>
          <Calendar
            aria-label="تاریخ"
            defaultValue="2026-09-14"
            today="2026-09-18"
            labels={{ previous: 'ماه قبل', next: 'ماه بعد' }}
          />
        </I18nProvider>
      ))}
    </div>
  );
}
