import { Prose } from '@snapshot-ui/react';
import type { ReactElement } from 'react';
import { GOALS_GUIDE_FA } from './prose-fixtures';
import { OwnMarkdown } from './prose-markdown';

/**
 * The goals guide in Persian, in Vazirmatn: markers and the quote's rule on the right, Persian digits, emphasis
 * by weight, and code and figures left to right.
 */
export default function ProsePersian(): ReactElement {
  return (
    <div lang="fa" dir="rtl" style={{ width: '100%' }}>
      <Prose as="article">
        <OwnMarkdown tableLabel="پس‌انداز هر ماه، جدول">{GOALS_GUIDE_FA}</OwnMarkdown>
      </Prose>
    </div>
  );
}
