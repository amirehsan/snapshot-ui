# @snapshot-ui/charts

## 0.1.0

### Minor Changes

- 4d09265: Add LineChart, with the `LineChartProps`, `LineChartLabels`, `LineSeries` and `LinePoint` types: one or two series (`series`, the first in ink and the second, for context, in slate), with `xLabels`, optional `xTicks`, `yTicks` gridlines with their labels, a `yDomain`, an optional area (`hasArea`) and a `height`, drawn on the server in SVG. Every label and value is your formatted string; `value` only places the point. The plot is one tab stop: Left and Right move a readout and a crosshair through the days with data, Home and End reach the ends, Page Up and Page Down move a week, Escape hides the readout (and stops there, so a dialog or sheet around the chart stays open until a second Escape), a key with Alt, Control or Meta is left to the browser, and a screen reader hears each day once the keys rest, as separate parts with no punctuation added between your words. Every chart has a toggle under it that swaps the plot for a table of the same strings, and with scripts off the table is shown under the plot; `labels` replaces the four strings the chart writes, all four at once: the toggle's two, the note shown with scripts off, and `roleDescription`, the plot's `aria-roledescription`, "chart" by default. The readout sits above the day's dots, or below them near the top of the plot, so it never covers the point it describes, and wraps inside the plot. The plot becomes a tab stop once scripts run. Time follows the page's direction: in a right-to-left region the newest day is at the left and Left moves to newer days, from the nearest `dir="ltr"` or `dir="rtl"` attribute, which the drawing, the marks over it and the keys all read, so they agree even under `dir="auto"`. `null` points are gaps. `charts.css` draws it, and sets `--chart-direction` beside `--chart-flip`. React is the charts package's one required peer: it does not ask for `react-dom`, since no chart imports it.
- e6c2d6b: Add `@snapshot-ui/charts`, the library's chart package, drawn on the server in SVG with no measurement and no client JavaScript for a static chart, and its first chart, Sparkline: a tile's trend as a 2px ink line over the data's extent, with an end point (`hasEndPoint`, on by default) and an optional 10% area (`hasArea`). It is hidden from assistive technology unless it is given an `aria-label` or an `aria-labelledby`. Its default box is 96 by 32px, and it stretches to any width with its line kept at 2px. In a right-to-left region the newest value is at the left, from the nearest `dir` attribute. The package depends on nothing but React; its CSS, `charts.css`, is in `@snapshot-ui/core`'s `styles.css`, so it needs `@snapshot-ui/core` 0.3.0 or later. `SparklineProps` is exported for wrappers. On a surface other than a card, set `--chart-surface` to that surface's color, so the end point's ring matches it.

### Patch Changes

- Updated dependencies [dc43eff]
- Updated dependencies [4d09265]
- Updated dependencies [cf5f1b3]
- Updated dependencies [e6c2d6b]
- Updated dependencies [5faae7a]
  - @snapshot-ui/core@0.3.0
