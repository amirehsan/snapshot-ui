import { Prose } from '@snapshot-ui/react';
import type { ReactElement } from 'react';
import { GOALS_GUIDE_FA } from './prose-fixtures';
import { OwnMarkdown, type MarkdownLabels } from './prose-markdown';

/** The map's names in Persian, and the footnotes' label and back link, which GFM writes in English otherwise. */
const PERSIAN: MarkdownLabels = { table: 'جدول', code: 'کد', image: 'تصویر:' };
const FOOTNOTES = { footnoteLabel: 'پانویس‌ها', footnoteBackLabel: 'بازگشت به متن' };

/**
 * The goals guide in Persian, in Vazirmatn: markers and the quote's rule on the right, Persian digits, emphasis
 * by weight, and code and figures left to right.
 */
export default function ProsePersian(): ReactElement {
  return (
    <div lang="fa" dir="rtl" style={{ width: '100%' }}>
      <Prose as="article">
        <OwnMarkdown labels={PERSIAN} remarkRehypeOptions={FOOTNOTES}>
          {GOALS_GUIDE_FA}
        </OwnMarkdown>
      </Prose>
    </div>
  );
}
