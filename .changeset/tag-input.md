---
'@snapshot-ui/core': minor
'@snapshot-ui/react': minor
---

Add TagInput: a field for a list of values typed or pasted. Enter or a comma adds one, a pasted list is split at once, and Backspace in the empty box, or Enter on a tag, takes a value back into the text to fix it. Pass `preset={emailPreset}`, `domainPreset` or `pathPreset`, or your own object. The value only holds values the preset accepts; what fails stays in the box with the error line, and the form will not submit while it does. `maxValues` sets a limit with a counter. Each value submits as its own entry under `name`; read them with `formData.getAll(name)`, and check them again on the server with the same preset, which imports there too. MultiSelect's frame and tag rules now also draw TagInput; MultiSelect looks and behaves as before. `tag-input.css` in `styles.css`.
