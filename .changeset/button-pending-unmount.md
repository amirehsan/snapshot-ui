---
'@snapshot-ui/react': patch
---

Fix a pending `Button` that unmounts while React Aria's live announcer still holds its pending announcement, as a dialog's Save does when its save settles and closes the dialog. The announcement named the button by ids that had gone with it, so it said nothing and axe reported `role-img-alt`; it now keeps the button's words, such as "Save Saving".
