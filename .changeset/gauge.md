---
'@snapshot-ui/core': minor
'@snapshot-ui/react': minor
---

Add Gauge: one figure on a range at a glance, a ring or a semicircle, `sm` (32px), `md` (96px) or `lg` (160px). `value` from `minValue` to `maxValue`, such as a credit score from 300 to 850; `valueLabel` says it in your words and is what a screen reader hears; `figure` and `figureCaption` draw the centre numeral and a word under it ("742", "Very good"), with no default; up to five `marks` show band edges or thresholds. `tone` is yours: `warning` for a state that needs a look, `error` only where a limit stopped something; above `maxValue` a neutral gauge draws warning, and your words must say "over". It is a meter, not a progress bar: use ProgressBar for work getting done. The arc moves over 200ms when the value changes, mirrors on a right-to-left page, and is round in every shape. It is static, so a server component renders it. `gauge.css` in `styles.css`.
