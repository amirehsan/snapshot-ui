---
'@snapshot-ui/core': patch
---

DataTable: rows have more room. Every text cell now holds its text as far from the row's rules as a one-line row does, so a row of two lines is 72px with 13.5px above and below, where its lines used to fill a 48px row. One-line rows stay 48px, and compact density gives 64px for two lines. A new `data-table-cell-meta` class sets a second line in a cell, such as a category under a name: slate, granite in a hovered or selected row, a quarter rem under the first line, ending in an ellipsis. On a phone, an item's two lines sit 4px apart with the same room above and below, 72px in all.
