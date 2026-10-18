---
'@snapshot-ui/core': minor
'@snapshot-ui/react': minor
---

Add CardActions: buttons in a plain card's header, after its CardTitle and CardNote, such as Edit, Merge and Remove on a Details card. They sit at the end of the title's line, level with its first line, and move under the note in a header narrower than 24rem. The header's first row is at least a control's height and its top grows by the card's corner inset, so the buttons stand clear of the rounded corner; a card without CardActions is unchanged, and so is CollapsibleCard. It is static, so a server component renders it.
