---
'@snapshot-ui/core': minor
'@snapshot-ui/react': minor
---

Add Meter, for spending against a budget: `segments` stacked in one bar (`look` `fill` for spent, `hatched` for held), a `max`, the app's `valueLabel` as the visible text and the accessible value, a `pace` marker for where spending would be today, an optional legend (`hasLegend`), and a `label` or an `aria-label`. Over the limit both looks turn the warning color, and `valueLabel` must say "over" in words, such as "$1,340 of $1,200, $140 over": color is never the only signal. The meter is static, so a server component renders it with no client JavaScript. On a surface other than a card, set `--meter-surface` to that surface's color. Every figure, each segment's `valueLabel`, the meter's `valueLabel` and the pace's `label`, is the app's formatted string. `MeterProps` and `MeterSegment` are exported, and `MeterBaseProps` for wrappers. `meter.css` in `styles.css`.
