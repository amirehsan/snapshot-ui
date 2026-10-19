---
'@snapshot-ui/core': minor
'@snapshot-ui/charts': minor
---

BarChart stacks up to five series with `layout: 'stacked'`, such as a month's top four categories and "Other": positives stack up from zero and negatives down, each sign in series order, with a 2px gap between parts and only the outer end rounded. A series with `look: 'hatched'` warns and draws as a fill in a stack, since stripes there are a texture, not a previous period. Series take the chart palette in order and slate for the fifth; pin "Other" to `color: 'slate'` and it keeps the fifth look in a month of fewer series. Pass `totals` to label each stack and add a Total column to the table. `hasTexture` adds a stripe pattern per series for readers who cannot tell the colors apart, and forced colors always show it. The arrow keys move along a stack segment by segment, and across it to the same series in the band beside.
