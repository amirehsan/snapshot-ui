---
'@snapshot-ui/core': minor
'@snapshot-ui/react': minor
---

Add PositionPad: a 3 by 3 choice of position, submitted as `top-start` through `bottom-end`. It is a radio group of nine named radios, so `name`, `isRequired` and form reset work as on RadioGroup. Left and Right follow the row and wrap; Up and Down follow the column and stop at its ends. Values are logical and mirror in right to left; set `dir="ltr"` on the pad for an image's focal point. The cells are named in English by default; on a right-to-left page, pass `labels` in your language. `position-pad.css` in `styles.css`.
