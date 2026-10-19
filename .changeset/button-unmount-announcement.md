---
'@snapshot-ui/react': patch
---

Button: a pending Button that holds focus and then unmounts, as a Dialog's Save does when the save closes the Dialog, no longer leaves React Aria's live announcer with a sentence that names its removed ids. The Button writes the sentence's words onto it in place of the ids, so a screen reader reads "Save Saving" rather than nothing, and axe no longer reports `role-img-alt`.
