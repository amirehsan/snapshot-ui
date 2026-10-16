---
'@snapshot-ui/core': patch
'@snapshot-ui/react': patch
---

Pagination keeps a sensible width in any parent. In a flex row beside a link it collapsed to no width, drawing its range one letter per line with the steps stacked; it now takes the room its siblings leave there, in a wrapping row too, fills a block or an `fr` grid column, and draws its narrow row, the range between the two steps, in a column sized by its content. No wrapper is needed. Its range wraps between words and never breaks a word letter by letter. DataTable and StatTile had the same trap: a table in a flex row now draws its table face, and a tile in a flex row is 16rem wide instead of its padding. The nav now carries the range as `data-range` and holds a `div.pagination-box` around its row; markup written by hand needs both.
