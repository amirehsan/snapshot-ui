# @snapshot-ui/charts

## 0.2.1

### Patch Changes

- a9c291c: Require @snapshot-ui/core 0.10, which this release of the charts is tested with.
- Updated dependencies [a9c291c]
- Updated dependencies [a9c291c]
- Updated dependencies [a9c291c]
- Updated dependencies [a9c291c]
- Updated dependencies [a9c291c]
- Updated dependencies [a9c291c]
- Updated dependencies [a9c291c]
- Updated dependencies [a9c291c]
  - @snapshot-ui/core@0.10.0

## 0.2.0

### Minor Changes

- ddd350f: BarChart draws vertical bars too, and they are its default orientation: a chart that passes no `orientation` stands up, one band per month or category, with negatives below a zero line, figures outside the bars' ends only where `valueLabels` asks, and labels that wrap to two lines and never rotate. `bands="time"` labels the first, middle and last band and starts the keys at the newest. Two series sit side by side in either orientation, such as income with `color: 'gain'` beside spending with `color: 'ink'`; the types allow two at most. `look: 'hatched'` draws a series as the previous period in Meter's stripes: without a `color`, the first series' color in stripes inside a 1px border of that color at full strength, with its amounts in slate, so this period and the last never read as two categories. A hatched bar under 4px across is its border alone. Pass the previous period second. In forced colors the previous period stays striped against solid bars.
- ddd350f: Link BarChart's bars. Give a `BarValue` an `href`, one per bar of every series, a stack's segments included, and that bar becomes a real anchor to it, named by its table cells as before and announced as a link rather than a bar. The hrefs are data, so a server component passes them with the figures: the server's HTML holds the links, each a stop of its own in drawn order until the chart hydrates, when they become its one roving stop, and a link a reader focused before then keeps focus and becomes the stop. A press anywhere in a bar's band follows its link through a target over the band, `a.bar-chart-hit`, hidden from assistive technology and never a stop: lying down the whole row from its name to its amount, standing up the band's column, the half nearer each bar in a band of two, and each segment's own run in a stack. Since the target is a real anchor, a click with Command, Control or Shift, a middle click and the context menu open a new tab or window as any link does. The readout names the bar under the pointer, so it says what a press opens; a tap follows the link and a touch held half a second shows the readout and follows nothing. Enter follows the focused bar's link and Space does nothing, so it never scrolls the page. The table's category cells link too with one series, and each figure's cell with two or more. Focus on a table link or the toggle that a status or new data takes away or hides goes on to the chart, never the body: to the toggle while the table shows, else to the chart.
  
  `navigate` takes your router's navigate, the function your `RouterProvider` has, since the charts import no React Aria: a plain click or Enter on a bar or a table link goes through it, a modified click stays the browser's, and a link of your own in `statusContent` opens its own way. `onBarPress(category, series)` is called with the band's and the series' index on every press, a link's before it is followed; a bar with no `href` in a chart with `onBarPress` is a button, which Enter and Space press. A bar with no `href` in a band with links keeps its own part of the band, a target with no link, so a press on it never opens its neighbor's link. In a band of two bars without links, a pointer between or beside them now takes the nearer bar, as the targets do, where it took the band's first. `charts.css` gains the target's rules, and `data-table.css` leaves the target out of the cell controls it raises, as it leaves the bar.
- ddd350f: BarChart stacks up to five series with `layout: 'stacked'`, such as a month's top four categories and "Other": positives stack up from zero and negatives down, each sign in series order, with a 2px gap between parts and only the outer end rounded. A series with `look: 'hatched'` warns and draws as a fill in a stack, since stripes there are a texture, not a previous period. Series take the chart palette in order and slate for the fifth; pin "Other" to `color: 'slate'` and it keeps the fifth look in a month of fewer series. Pass `totals` to label each stack and add a Total column to the table. `hasTexture` adds a stripe pattern per series for readers who cannot tell the colors apart, and forced colors always show it. The arrow keys move along a stack segment by segment, and across it to the same series in the band beside.
- ddd350f: Add BarChart, with horizontal bars for a ranked list: pass `orientation="horizontal"`, since the default is vertical (see the vertical changeset). Each row has its label at the start, its bar from a zero line and its amount in a column at the end, so amounts align. Refunds that net a row below zero draw toward the start and keep their amount in the column. Long names wrap and never rotate; under 24rem of the chart's own width the names move above their bars. The chart is a size container, so its holder gives it a width: a block its whole line, a flex item a basis such as `flex: 1 1 20rem`. The chart is one tab stop on the active bar, and the arrow keys move bar to bar; each bar is named by its table cells, its category and its value, and its series when there are two or more. A toggle shows the same figures as a table. `status` draws loading, empty and error in the chart's own space, with `statusLabels` and `statusContent`; while loading, the chart's area is `aria-busy` and the state is said once through a status region outside it. Every figure is your string, and the value axis always includes zero. A BarChart in a DataTable cell keeps its bars' boxes when one takes focus; wrap it in `data-table-control` to put it above the row's link for a pointer. Exports `BarChart`, `BarChartProps`, `BarChartSeries`, `BarSeries`, `BarValue`, `BarChartLabels`, `ChartStatus`, `ChartStatusLabels` and `ChartColor`. Its CSS is in `charts.css`, which `styles.css` already imports.
  
  Charts 0.2.0 needs `@snapshot-ui/core` 0.9: its core peer moves to `^0.9.0`, since BarChart draws with rules and tokens only core 0.9 has. Upgrade `@snapshot-ui/core`, `@snapshot-ui/react` and `@snapshot-ui/charts` together.
- ddd350f: LineChart takes `status` (`'ready'`, `'loading'`, `'empty'` or `'error'`), `statusContent` and `statusLabels`, as BarChart does: loading draws a placeholder in the plot's space with no table, and says "Loading" once; empty and error draw your content or a sentence and hide the table toggle; the x labels and gridlines you pass stay. The figure carries `data-status` only while it shows a state, so a ready chart's markup is unchanged, and LineChart sets no `aria-busy` anywhere: the state is said through the plot's own polite region, which a busy subtree could silence. `statusLabels` is a separate prop with English defaults, so the four `labels` you already pass are unchanged.

### Patch Changes

- Updated dependencies [ddd350f]
- Updated dependencies [ddd350f]
- Updated dependencies [ddd350f]
- Updated dependencies [ddd350f]
- Updated dependencies [ddd350f]
- Updated dependencies [ddd350f]
- Updated dependencies [ddd350f]
  - @snapshot-ui/core@0.9.0

## 0.1.5

### Patch Changes

- 3e05863: The `@snapshot-ui/core` peer now asks for `^0.8.0`, the release that draws the account parts, so charts 0.1.5 needs core 0.8. A 0.x caret range accepts only its own minor: charts needs the same 0.x minor of `@snapshot-ui/core`, whose `styles.css` draws the charts.
- Updated dependencies [3e05863]
- Updated dependencies [3e05863]
- Updated dependencies [3e05863]
- Updated dependencies [3e05863]
- Updated dependencies [3e05863]
- Updated dependencies [3e05863]
  - @snapshot-ui/core@0.8.0

## 0.1.4

### Patch Changes

- f076799: The `@snapshot-ui/core` peer now asks for `^0.7.0`, the release that draws the documents parts, so charts 0.1.4 needs core 0.7. A 0.x caret range accepts only its own minor: charts needs the same 0.x minor of `@snapshot-ui/core`, whose `styles.css` draws the charts.
- Updated dependencies [f076799]
- Updated dependencies [f076799]
- Updated dependencies [f076799]
- Updated dependencies [f076799]
- Updated dependencies [f076799]
- Updated dependencies [f076799]
- Updated dependencies [f076799]
- Updated dependencies [f076799]
- Updated dependencies [f076799]
- Updated dependencies [f076799]
- Updated dependencies [f076799]
- Updated dependencies [f076799]
- Updated dependencies [f076799]
  - @snapshot-ui/core@0.7.0

## 0.1.3

### Patch Changes

- 7aa13e9: The `@snapshot-ui/core` peer now asks for `^0.6.0`, the release that draws the data table, so charts 0.1.3 needs core 0.6. A 0.x caret range accepts only its own minor: charts needs the same 0.x minor of `@snapshot-ui/core`, whose `styles.css` draws the charts.
- Updated dependencies [7aa13e9]
- Updated dependencies [7aa13e9]
- Updated dependencies [7aa13e9]
- Updated dependencies [7aa13e9]
  - @snapshot-ui/core@0.6.0

## 0.1.2

### Patch Changes

- e057652: The `@snapshot-ui/core` peer now asks for `^0.5.0`, the release that draws the filters, so charts 0.1.2 needs core 0.5. A 0.x caret range accepts only its own minor: charts needs the same 0.x minor of `@snapshot-ui/core`, whose `styles.css` draws the charts.
- Updated dependencies [d9f683a]
- Updated dependencies [a224f54]
- Updated dependencies [7394e7b]
- Updated dependencies [ef012c5]
- Updated dependencies [6af2f59]
- Updated dependencies [a467ed5]
  - @snapshot-ui/core@0.5.0

## 0.1.1

### Patch Changes

- 565f76e: The `@snapshot-ui/core` peer now asks for `^0.4.0`, the release that draws the pickers, so charts 0.1.1 needs core 0.4. A 0.x caret range accepts only its own minor: charts needs the same 0.x minor of `@snapshot-ui/core`, whose `styles.css` draws the charts.
- Updated dependencies [75f8555]
- Updated dependencies [97bc27a]
- Updated dependencies [2e37dbc]
- Updated dependencies [e33cf6d]
- Updated dependencies [58a5984]
- Updated dependencies [1f8ef57]
  - @snapshot-ui/core@0.4.0

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
