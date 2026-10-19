---
'@snapshot-ui/core': minor
'@snapshot-ui/charts': minor
---

Add BarChart, starting with horizontal bars for a ranked list (`orientation="horizontal"`): each row's label at the start, its bar from a zero line, and its amount in a column at the end, so amounts align. Refunds that net a row below zero draw toward the start and keep their amount in the column. Long names wrap and never rotate; under 24rem of the chart's own width the names move above their bars. The chart is one tab stop on the active bar, and the arrow keys move bar to bar; each bar is named by its category and its value. A toggle shows the same figures as a table. `status` draws loading, empty and error in the chart's own space, with `statusLabels` and `statusContent`. Every figure is your string, and the value axis always includes zero. Exports `BarChart` and its types. Its CSS is in `charts.css`, which `styles.css` already imports.
