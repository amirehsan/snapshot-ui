---
'@snapshot-ui/charts': patch
---

The `@snapshot-ui/core` peer now asks for `^0.4.0`, the release that draws the pickers, so charts 0.1.1 needs core 0.4. A 0.x caret range accepts only its own minor: charts needs the same 0.x minor of `@snapshot-ui/core`, whose `styles.css` draws the charts.
