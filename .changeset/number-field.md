---
'@snapshot-ui/core': minor
'@snapshot-ui/react': minor
---

Add NumberField: a number or, with `money`, an amount whose value is an integer count of minor units (`123450` for 1,234.50; `fractionDigits` 0 to 3), so it goes into a URL and a database exactly. The currency `symbol` is drawn beside the figure on the side you name and never typed, and a pasted figure carrying it lands. Every phone gets the decimal keyboard; `allowsNegative` adds a sign toggle, since neither phone's decimal keyboard has a minus key. Home and End move the caret. `onChange` fires when the value commits, with `null` for an empty field. Before hydration the field shows the plain figure ("1234.50") and React Aria's formatted text from the next render, so the server's HTML is the same in every locale and zone. `labels` names the sign button and the steppers. `number-field.css` in `styles.css`.
