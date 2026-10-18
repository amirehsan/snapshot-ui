---
'@snapshot-ui/core': minor
'@snapshot-ui/react': minor
---

AppShell takes `floating`: chrome that outlives every page, rendered after the workspace and the tab bar, outside `<main>`, with no wrapper of its own, so a fixed part there reads the shell's `--app-shell-inset-block-end` and `--app-shell-sidebar`. Put an UploadTray there from your root layout, so a client navigation keeps it.
