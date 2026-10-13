---
'@snapshot-ui/core': minor
'@snapshot-ui/react': minor
---

Add CollapsibleCard, a card whose body folds under its header. The title is the toggle, a row at least 40px tall with a chevron, and the note and the actions stay in the header while the card is folded. It draws with Card's classes and is built on React Aria's Disclosure. In browsers that support `hidden="until-found"`, find-in-page can open a folded card; in others, a folded body is not searchable.
