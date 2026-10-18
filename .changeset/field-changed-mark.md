---
'@snapshot-ui/core': minor
'@snapshot-ui/react': minor
---

A changed field with no label now says so: TextField, TextArea, NumberField, Select, ComboBox, MultiSelect, DateRangePicker and DatePicker, named only by `aria-label` or `aria-labelledby` and given `isChanged`, draw the Changed chip's 6px dot in clay inside the frame, before its button or at its text's end, with the text padded clear of it, and read "Changed" (`changedLabel`) after their name through `aria-describedby`. So a review grid of unlabelled fields shows which changed in words as well as in the edge. Like the chip, the dot leaves while the field is invalid. TextField, TextArea and Select now write `data-unlabelled` without a label, as the others did.
