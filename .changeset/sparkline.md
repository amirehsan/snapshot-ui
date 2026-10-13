---
'@snapshot-ui/charts': minor
'@snapshot-ui/core': minor
---

Add `@snapshot-ui/charts`, the library's chart package, drawn on the server in SVG with no measurement and no client JavaScript for a static chart, and its first chart, Sparkline: a tile's trend as a 2px ink line over the data's extent, with an end point (`hasEndPoint`, on by default) and an optional 10% area (`hasArea`). It is hidden from assistive technology unless it is given an `aria-label` or an `aria-labelledby`. Its default box is 96 by 32px, and it stretches to any width with its line kept at 2px. In a right-to-left region the newest value is at the left, from the nearest `dir` attribute. The package depends on nothing but React; its CSS, `charts.css`, is in `@snapshot-ui/core`'s `styles.css`, so it needs `@snapshot-ui/core` 0.3.0 or later. `SparklineProps` is exported for wrappers. On a surface other than a card, set `--chart-surface` to that surface's color, so the end point's ring matches it.
