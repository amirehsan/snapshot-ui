---
'@snapshot-ui/core': minor
'@snapshot-ui/react': minor
---

Add MonthGrid: which months you have, one row per year. Name your `states` ("Held", "Partial", "Missing") and map each to a look, `filled`, `partial` or `empty`; give each year's `months` as state ids, or null for a month outside the range, which stays blank. `monthLabels` head the columns and `monthNames` are read in the summary and the table, in your calendar and your digits. Under the grid a sentence says what is missing or partial ("Missing: March, April 2025."), in English unless you pass `summary`; a legend names your states; a hidden table gives screen readers every month by row and column. Only quarter labels show under 28rem of its width. The looks are shapes, never a warning or error color: say what needs attention in your summary. It takes the width of its box and has none of its own, so give it a width in a holder sized to its content. It is static, so a server component renders it. `month-grid.css` in `styles.css`.
