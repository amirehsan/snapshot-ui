---
'@snapshot-ui/react': patch
---

NumberField no longer makes React log a flushSync warning when focus leaves it while React draws, as when a Save disables a Dialog's fields while the field holds focus, or an app moves focus from a layout effect. The field defers React Aria's commit on blur by one microtask: the value still commits before the next click or submit, and a corrected value is still announced. Your `onBlur` and `onFocusChange(false)` now run one microtask after the blur, and a script that calls `requestSubmit()` in the same task as a blur reads the form before the commit. If you still see the warning, send us the steps.
