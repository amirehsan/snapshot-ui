---
'@snapshot-ui/charts': minor
---

LineChart takes `status` (`'ready'`, `'loading'`, `'empty'` or `'error'`), `statusContent` and `statusLabels`, as BarChart does: loading draws a placeholder in the plot's space with no table, and says "Loading" once; empty and error draw your content or a sentence and hide the table toggle; the x labels and gridlines you pass stay. The figure carries `data-status` only while it shows a state, so a ready chart's markup is unchanged, and LineChart sets no `aria-busy` anywhere: the state is said through the plot's own polite region, which a busy subtree could silence. `statusLabels` is a separate prop with English defaults, so the four `labels` you already pass are unchanged.
