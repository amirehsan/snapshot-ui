---
'@snapshot-ui/core': minor
'@snapshot-ui/react': minor
---

Add MultiSelect: choose several values from a list, built on React Aria's ComboBox in multiple mode. The chosen values are bone tags in a frame that wears the field's edges and grows a row at a time; the list stays open after each choice and the input empties; a tag is removed by its button, by Backspace or Delete, or by Backspace twice from an empty input, which first focuses the last tag. `value` is `readonly Key[]` and `onChange` receives `Key[]`, never `selectedKey`; `name` submits one value per chosen key; a tag shows its option's text value, so an option whose label is not a string needs `textValue`. With `inputValue` controlled too, empty it in `onChange`. `labels` adds `selected` and `remove` to ComboBox's. One Escape closes the list and empties the input; Tab toggles the active option and moves on. While the list is open the tags rest, out of the tab order. Without a visible label the placeholder is slate. React Aria announces in its own strings, which have no Persian. New exports: `MultiSelect`, `MultiSelectBaseProps`, `MultiSelectProps` and `MultiSelectLabels`. `multi-select.css` in `styles.css`.
