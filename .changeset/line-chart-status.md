---
'@snapshot-ui/charts': minor
---

LineChart takes `status` (`'ready'`, `'loading'`, `'empty'` or `'error'`), `statusContent` and `statusLabels`, as BarChart does: loading draws a placeholder in the plot's space and says "Loading" once; empty and error draw your content or a sentence and hide the table toggle. `statusLabels` is a separate prop with English defaults, so the four `labels` you already pass are unchanged.
