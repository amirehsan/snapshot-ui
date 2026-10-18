---
'@snapshot-ui/core': minor
'@snapshot-ui/react': minor
---

Add ProgressBar: work getting done, Meter's sibling. A `label`, a `value` from `minValue` to `maxValue` (0 to 100 by default, clamped), and `valueLabel` in your words ("1.2 of 4 MB"), the default a whole percentage in ASCII digits, so a Persian page passes its own. `showValueLabel={false}` hides the value for a bar named by `aria-label` in a row that says its value in its own text, as the upload row does: the track is a cue and not a boundary, so a bar with no head needs its value in words beside it. `isIndeterminate` slides a segment for work of unknown length, such as reading a document; it follows the bar's own direction, a nested `dir` included, slows under reduced motion and never stops, and with animations off it rests before the track, so the track reads empty. An indeterminate bar that nothing else names is named "Loading". It is never a live region: say what matters once in your own status. It is static, so a server component renders it with no client JavaScript. Exports `ProgressBar` and the types `ProgressBarProps` and `ProgressBarBaseProps`. `progress-bar.css` in `styles.css`.
