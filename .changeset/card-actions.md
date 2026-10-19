---
'@snapshot-ui/core': minor
'@snapshot-ui/react': minor
---

Add CardActions: a card's own actions in a plain card's header, after its CardTitle and CardNote, such as Edit and a More menu holding Merge and Remove on a Details card. Show at most two; put the rest in a More menu. From 24rem of the header they sit at the end of the title's line, level with its first line, and move down by the card's corner inset with the title, so they stand clear of the rounded corner. In a narrower header they follow the note and nothing else moves. A long label wraps inside its button, and the header takes no width from its actions, so a card never scrolls a phone's page sideways. A card without CardActions is unchanged, and so is CollapsibleCard. It is static, so a server component renders it.
