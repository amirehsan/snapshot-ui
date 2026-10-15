---
'@snapshot-ui/core': minor
'@snapshot-ui/react': minor
---

Add FilterBar: the filters of a list page. It lays out your `search` and a wrapping row of `FilterChip`s, puts each `isSecondary` chip without a value behind "More" (a chip with a value is always in the row), shows Clear all (`onClearAll`, one URL write) while any filter is active, and under 768px swaps the row for one Filters button with the active count that opens one sheet holding every filter. The sheet is live: each change writes the URL at once, and Done only closes it; name it with your result count through `labels.done`. The count is read from chips that are the bar's children or in fragments, so the server's HTML holds it; pass `activeCount` for chips wrapped in your own components, which stay in the row. `formatCount` writes the count, such as in Persian digits. Exports `FilterBar` and the types `FilterBarProps` and `FilterBarLabels`, with `labels.clear` for the visible word of each section's clear button. `filter-bar.css` in `styles.css`.
