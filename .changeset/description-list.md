---
'@snapshot-ui/core': minor
'@snapshot-ui/react': minor
---

Add DescriptionList and DescriptionListItem: an account's details as a real `dl`. Each item is a `term`, its value as children, and optional `actions`, named with the term ("Edit Nickname"). Terms sit beside values from 30rem of the list's own width and above them under it, or hold one `layout`; `--description-list-term-size` sets the name column. An empty value shows "Not set" in slate, or your `emptyValue`, such as a link to add it. Long values wrap and break anywhere. `isNumeric` keeps amounts, limits and percentages left to right on a Persian page. A row's controls at a card's foot stand clear of its rounded corner. It is static, so a server component renders it. `description-list.css` in `styles.css`.
