---
'@snapshot-ui/core': minor
'@snapshot-ui/react': minor
---

Add `isChanged` and `changedLabel` to a standalone Checkbox, which shows the clay Changed chip beside its label and has a screen reader read it with the checkbox, as a Switch does. Invalid outranks changed. A Checkbox inside a CheckboxGroup ignores `isChanged`, because the group's own chip covers it.
