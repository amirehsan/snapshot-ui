---
'@snapshot-ui/core': minor
'@snapshot-ui/charts': minor
---

BarChart draws vertical bars too, its default orientation: one band per month or category, negatives below a zero line, figures above or below the bars where you ask, and labels that wrap to two lines and never rotate. Two series sit side by side in either orientation, such as income with `color: 'gain'` beside spending with `color: 'ink'`; the types allow two at most. `look: 'hatched'` draws a series as the previous period: the first series' color in stripes inside a border of that color, with its amounts in slate, so this period and the last never read as two categories. In forced colors the previous period stays striped against solid bars.
