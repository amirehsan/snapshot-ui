---
'@snapshot-ui/core': minor
'@snapshot-ui/react': minor
---

Add FieldExtras: wrap a field to offer its default ("Default: 24 hours. Reset to default") or a suggested value ("Suggested: $40.00, from your last three months. Use") under it. An offer shows only while the field does not hold it, and taking it calls your setter: it is an ordinary edit, so compare to the saved value for the Changed chip and the SaveBar as you do for typing. Focus goes to the field afterwards, or to `controlRef`, and a polite status says what was set. With `scope="group"` it offers a default for a group of fields, such as a set of rows, and focuses the group's first field after a reset. `field-extras.css` in `styles.css`.
