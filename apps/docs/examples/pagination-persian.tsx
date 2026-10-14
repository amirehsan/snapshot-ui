import { Pagination } from '@snapshot-ui/react';
import type { ReactElement } from 'react';

/** Persian digits, written without Intl, so the server and the browser agree. */
const persian = (value: number | string): string =>
  String(value).replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[Number(d)] ?? d);

export default function PaginationPersian(): ReactElement {
  return (
    <div dir="rtl" lang="fa" style={{ width: '100%' }}>
      <Pagination
        page={3}
        pageCount={12}
        rangeLabel={`${persian(101)} تا ${persian(150)} از ${persian('1٬284')}`}
        pageLabel={persian}
        getPageHref={(n) => `#page-${String(n)}`}
        labels={{
          navigation: 'صفحه‌های تراکنش‌ها',
          previous: 'قبلی',
          next: 'بعدی',
          page: (label) => `صفحه ${label}`,
        }}
      />
    </div>
  );
}
