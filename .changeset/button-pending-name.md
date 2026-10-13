---
'@snapshot-ui/core': minor
'@snapshot-ui/react': minor
---

A pending Button named by its text now always carries the spinner's `pendingLabel` in its accessible name, so "Save" reads "Save Saving" while it waits, instead of leaving each browser to find the spinner inside the button's content. While pending it is named by its label through `aria-labelledby`, and at rest by its text again, as before. A button named by `aria-label` or `aria-labelledby` already read both and is unchanged.
