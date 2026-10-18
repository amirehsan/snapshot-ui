---
'@snapshot-ui/core': minor
'@snapshot-ui/react': minor
---

Visible in every existing app with a selection: Clear selection is now an X icon button at the bar's start, before the count, with a tooltip, also when `bulkActions` is a node, in place of the text button after your actions; Tab into the bar lands on the X first, and Escape with its tip open closes the tip before it clears. Your node actions keep the bar's end.

DataTable's bulk-action bar stays on one line. `bulkActions` also takes data, `DataTableBulkAction` (`id`, `label`, `icon`, `onAction(keys)`, `isPromoted`, `isDisabled`): up to three promoted actions are buttons and the rest are in a More menu (`labels.moreActions`, "More actions"); under 40rem of the bar's content the buttons step aside and More holds every action, and a fourth promoted action, or an entry that is not an action, warns. `selectAllMatching` places your "Select all 24 matching" after the count. A control that leaves the bar, or that the narrowing bar hides, hands focus to the one in its place. The bar writes its height as `--save-bar-offset`, as SaveBar does, so the toasts and the upload tray now sit above it. Exports the type `DataTableBulkAction`.
