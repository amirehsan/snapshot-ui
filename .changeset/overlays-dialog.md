---
'@snapshot-ui/core': minor
'@snapshot-ui/react': minor
---

Add Dialog, a modal panel on React Aria's Modal and Dialog: a required title, a description, an icon well with a danger tone, `md` and `lg` widths, a scrolling body under a pinned action row, an optional close button, and Escape and scrim dismissal. `DialogTrigger` is re-exported. The shared overlay layer ships with it: every overlay copies its theme, shape and density from what it opened from, and one scrim paints when modals stack. ConfirmDialog is the alert dialog on top of it: a required description and tone, a confirm label that names the outcome, Cancel first, a pending state from a promise or `isPending`, and `useConfirm()`, which returns a promise that is true only when the confirm button is pressed.
