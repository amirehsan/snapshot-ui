---
'@snapshot-ui/core': minor
'@snapshot-ui/react': minor
---

Add SearchField: a search box with a magnifier, a clear button that shows once there is text, Escape to clear and Enter to submit (`onSubmit`, `onClear`), a `label` or an `aria-label` for a toolbar, where the placeholder is slate because it is the only words shown, and `clearLabel` to name the clear button. It has no debounce and no changed state: drive it from the URL with `value` and write the URL after your own pause in `onChange`, or in `onSubmit`. New exports: `SearchField`, `SearchFieldBaseProps` and `SearchFieldProps`. Adds `.input-button`, the shared button inside a field, to `input.css`, and `search-field.css` to `styles.css`.
