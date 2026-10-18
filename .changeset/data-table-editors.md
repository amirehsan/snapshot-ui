---
'@snapshot-ui/react': patch
---

A field in a DataTable cell, or in a list item through its column's `listSlot`, keeps its own keys while it has focus: its arrows move its caret or step its segments where React Aria's grid took them to move between rows and cells. Escape returns focus to the field's row or item, where the arrows move between rows again, as the grid pattern's editing mode does; an open popover's Escape, such as a DatePicker's calendar, and a field's own come first. Tab still moves on to the next field, row by row.
