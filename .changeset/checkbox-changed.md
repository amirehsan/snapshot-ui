---
'@snapshot-ui/core': minor
'@snapshot-ui/react': minor
---

Add `isChanged` and `changedLabel` to a standalone Checkbox, which shows the clay Changed chip beside its label and has a screen reader read it with the checkbox, as a Switch does. Invalid outranks changed. A Checkbox inside a CheckboxGroup ignores `isChanged`, because the group's own chip covers it. Every standalone Checkbox with a label now renders a `div.field-head` wrapper around its row and a `.field-changed` element beside it, changed or not (CSS hides the chip while unchanged), so CSS written for the old markup, such as `.checkbox-field > .checkbox`, and tests or snapshots of the checkbox's DOM should check that the row is now a child of `.field-head`; a checkbox in a group, or with no visible label, keeps the old markup.
