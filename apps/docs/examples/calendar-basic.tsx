import { Calendar } from '@snapshot-ui/react';
import type { ReactElement } from 'react';

export default function CalendarBasic(): ReactElement {
  return <Calendar aria-label="Due date" defaultValue="2026-09-14" today="2026-09-18" />;
}
