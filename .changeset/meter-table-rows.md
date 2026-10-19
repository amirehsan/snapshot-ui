---
'@snapshot-ui/core': patch
---

A Meter in a DataTable row cuts its segments apart and rings its pace marker in the row's own fill, on a plain, a hovered and a selected row, where it drew pale Lifted blocks. DataTable sets `--meter-surface` from its fill, and each washed row from its wash. A meter on any other surface still reads `--meter-surface`, with Lifted as its fallback, so set it to that surface where it is not Lifted.
