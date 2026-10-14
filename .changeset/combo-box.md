---
'@snapshot-ui/core': minor
'@snapshot-ui/react': minor
---

Add ComboBox: a text field that filters its list as you type (case and accents aside) and chooses one option, with a field button that shows every option, the Select's list and its `PickerOption` rows, a list that stays open with a no-matches line, and `isLoading` for a server search, where you pass `items` and `inputValue`, fetch in `onInputChange` and filter and cap on the server, since React Aria does not filter controlled items. It takes `value`, `defaultValue` and `onChange`, never `selectedKey`, and `labels` (`open`, `empty`, `loading`) for its own words. React Aria announces the option count and the choice in its own strings, which have no Persian. React Aria builds a collator for the filter while a ComboBox renders, on the server too; it compares and writes nothing, so the HTML is the same in every locale. `combo-box.css` in `styles.css`.
