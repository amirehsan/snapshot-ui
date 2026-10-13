---
'@snapshot-ui/core': minor
'@snapshot-ui/react': minor
---

Mark a folded CollapsibleCard that holds a change, and open it for an invalid field. While folded, the card shows a clay dot after its title when a field in its body is changed, or when `isChanged` says so, and a screen reader reads `changedLabel`, "Changed" by default, with the toggle. A folded card also opens itself, at once, when a field in its body fails the browser's validation on submit, or when a script calls `checkValidity()` or `reportValidity()`, so the field is in view when it takes focus.
