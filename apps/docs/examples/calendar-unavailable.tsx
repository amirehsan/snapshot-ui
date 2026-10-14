'use client';

import { Calendar } from '@snapshot-ui/react';
import type { ReactElement } from 'react';

/** Saturdays and Sundays, read from the ISO date the calendar passes. */
const isWeekend = (date: string): boolean => {
  const weekday = new Date(`${date}T12:00:00Z`).getUTCDay();
  return weekday === 0 || weekday === 6;
};

export default function CalendarUnavailable(): ReactElement {
  return (
    <Calendar
      aria-label="Delivery date"
      today="2026-09-18"
      minValue="2026-09-03"
      maxValue="2026-09-26"
      isDateUnavailable={isWeekend}
    />
  );
}
