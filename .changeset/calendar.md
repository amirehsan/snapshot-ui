---
'@snapshot-ui/core': minor
'@snapshot-ui/react': minor
---

Add Calendar and RangeCalendar: one month of days that chooses a day or a range, with ISO strings in and out (`'2026-09-01'` and `{ start, end }`) whatever calendar the locale shows, so `fa-IR` draws the Persian calendar in Persian digits and still writes Gregorian dates. Pass `today` from your user's time zone: it marks today and opens the month when there is no value, while React Aria's spoken "Today" follows the device. `presets` adds a row of your ranges with your words, and a preset that leaves the bounds or holds an unavailable day is disabled. A half-chosen range is dropped when focus or a press leaves the calendar. A value that does not parse or is not written `YYYY-MM-DD`, or a reversed range, reads as none with a warning and never throws. The calendar always holds six weeks, so changing months moves nothing, and an inline calendar draws a face of its final size, its parts with no date in them, until the page hydrates. `@internationalized/date` becomes a dependency at React Aria's own range, so it adds no bytes. `calendar.css` in `styles.css`.
