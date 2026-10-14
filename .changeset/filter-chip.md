---
'@snapshot-ui/core': minor
'@snapshot-ui/react': minor
---

Add FilterChip: a pill that names a filter and opens Select's list in `selectionMode` `'single'` or `'multiple'` (with Select's filter from 9 options), or a padded panel of your own content. It is always controlled (`value`, `onChange`), shows its value as the ink fill once it has one, and clears with its own button (`onChange(null)` or `onChange([])`, or your `onClear`). A list chip writes its summary from the chosen options' text values in list order ("Food, Rent and 2 more"); pass `labels.summary` for another language, or `valueLabel` to write it yourself. A closed chip ignores letters and Left and Right, so no filter is chosen unseen. Inside a FilterBar it also draws as a section of More and the Filters sheet. Select's list now lives in a shared module; Select is unchanged. Exports `FilterChip` and the types `FilterChipProps`, `FilterChipListProps`, `FilterChipCustomProps` and `FilterChipLabels`, with `labels.any` for a section's placeholder. `filter-chip.css` in `styles.css`.
