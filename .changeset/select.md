---
'@snapshot-ui/core': minor
'@snapshot-ui/react': minor
---

Add Select, PickerOption and PickerSection. Select chooses one value from a list: the chosen option's icon and label in a field-sized button, the Menu's rows in its popover (a label, a `description` hint, an `icon`, a preformatted `end` value and a check), `PickerSection` groups, a filter field at the top of the list from 9 options (every word must match, case and accents aside; `isFilterable` either way; on a touch screen the filter waits for a tap), a no-matches line, the changed and invalid edges, and `name` for forms. It takes `value`, `defaultValue` and `onChange`, never `selectedKey`. `PickerOption` and `PickerSection` are shared with ComboBox and MultiSelect. React Aria builds a collator while a Select renders, on the server too; it compares and writes nothing, so the HTML is the same in every locale. `select.css` in `styles.css`.
