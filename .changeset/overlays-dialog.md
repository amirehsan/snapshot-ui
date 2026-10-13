---
'@snapshot-ui/core': minor
'@snapshot-ui/react': minor
---

Add Dialog, a modal panel on React Aria's Modal and Dialog: a required title, a description, an icon well with a danger tone, `md` and `lg` widths, a scrolling body under a pinned action row, an optional close button, and Escape and scrim dismissal. `DialogTrigger` is re-exported, and `DialogBody` and `DialogActions` are the parts for a custom layout. The shared overlay layer ships with it: every overlay copies its theme, shape and density from what it opened from, one scrim paints when modals stack, and `--z-modal` and `--z-toast` order the layers.
