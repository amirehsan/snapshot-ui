---
'@snapshot-ui/core': minor
'@snapshot-ui/charts': minor
---

BarChart draws vertical bars too, and they are its default orientation: a chart that passes no `orientation` stands up, one band per month or category, with negatives below a zero line, figures outside the bars' ends only where `valueLabels` asks, and labels that wrap to two lines and never rotate. `bands="time"` labels the first, middle and last band and starts the keys at the newest. Two series sit side by side in either orientation, such as income with `color: 'gain'` beside spending with `color: 'ink'`; the types allow two at most. `look: 'hatched'` draws a series as the previous period in Meter's stripes: without a `color`, the first series' color in stripes inside a 1px border of that color at full strength, with its amounts in slate, so this period and the last never read as two categories. A hatched bar under 4px across is its border alone. Pass the previous period second. In forced colors the previous period stays striped against solid bars.
