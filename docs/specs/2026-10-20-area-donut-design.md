# Charts: AreaChart and DonutChart: design

Status: approved on 2026-10-20. Written for the owner's review with a recommended answer to each open question of section 15; the owner took every recommendation, all 27, as written. Because 1.0 now ships after phase 7 (the templates spec's ruling 1.0), every version here is a 0.x minor; section 19 records the rulings and the versions.
Date: 2026-10-20
Parent spec: `docs/specs/2026-10-10-snapshot-ui-design.md`. This document finishes phase 6 of the parent spec's catalog, "Charts" (`@snapshot-ui/charts`: line, bar, area and donut, plus the chart palette derivation). Line shipped in batch 2 ("Home"), bar and the palette in batch 6 ("Insights", `docs/specs/2026-10-18-insights-design.md`); this document takes the last two, **area** and **donut**, in the order the insights spec's ruling 24 set ("area before donut"). The design authority remains `docs/design-system.md`.
Released before this: `main` is at 0.8.0 as this is written, with `@snapshot-ui/charts` 0.1.5. Batch 6 (core and react 0.9.0, charts 0.2.0) is on `feat/insights` and brings the shared chart foundations, BarChart and the four palette tokens this document builds on. The batches in flight after it are listed in the lists spec (`docs/specs/2026-10-20-lists-design.md`), and phase 5 (`docs/specs/2026-10-20-templates-design.md`) ends with batch 11b, a docs-only change; 1.0 comes after phase 7, in the final batch of `docs/specs/2026-10-20-html-design.md`. This phase is one batch, 12, after phase 5 (section 2).

## Summary for the owner

What this batch adds, in plain words, in the order recommended:

**Batch 12, "Parts of a whole"** (a minor release of `@snapshot-ui/charts`, and a minor of core and react for the CSS):

- **AreaChart**: a total over time split into its parts, such as a month's daily spending stacked by its top four categories and "Other". Each part is a band of color laid on the one below it, so the top edge is the total and each band's thickness is that part. It uses the same four chart colors as the stacked bars, in the same order, with "Other" in slate, and each band can also carry a stripe texture so color is never the only way to tell them apart. A keyboard user moves along time with Left and Right and between the bands with Up and Down, and each stop says its day, its part and its amount. A table of the same figures sits behind a button, and the chart has a loading, empty or error state in its own space. Any value can be a link, such as to that day's transactions in that category.
- **DonutChart**: a whole split into at most five shares, such as a month's spending by category, with the total written in the hole ("$2,140, spent in October"). Beside the ring (or under it on a narrow card) a list gives each share its name, amount and percentage, so nothing depends on reading an angle. At most four colors and a slate "Other" that the app adds up and labels; the chart never adds, sorts or formats a figure itself. Pointing at or moving to a slice shows that slice's figures in the hole; Escape puts the total back. Slices can be links. It never uses the colors that mean something else (signal orange, clay, error, success, warning, the money-in green or link blue).

Both reuse what BarChart and LineChart built: the table and its toggle, the three states, the roving focus with each mark named by its table cells, the readout's placement, the textures, links on marks through the app's router, the server drawing the whole picture with no measurement, and forced colors.

One finding the owner should know: the four chart colors were chosen and checked for marks that touch in a row (a stack). A donut is a row whose ends meet, so its last slice touches its first, and that pair was never checked. Measured here: in the stack order, a four-slice donut puts magenta beside teal, which a color-blind reader in dark mode can barely tell apart (3.7 where 8 is the floor). Starting the donut on violet instead (violet, teal, olive, magenta, then slate) makes the common five-slice donut pass every check in both modes. The donut therefore uses that order by default, slices never touch (a 2px gap of the surface between them), and the cases that still fall short are recorded (section 6).

Why: these are the parent spec's last two charts. The insights spec deferred both (its section 1) and ruled area before donut. No consumer has asked for them yet; the first consumer's later Insights views (a month's spending by category over time, and its share at a glance) are the case this spec is drawn from (owner action 2).

What it does not add: a 100% stacked area, overlapping areas, a stream graph, smoothed curves, areas below zero, a pie (a donut with no hole), a half donut, labels on the arcs, slices pulled out of the ring, a donut inside a donut, animation, more than five colored parts, and a library-made "Other". Section 1 lists where each is deferred.

## 1. Goal

Give an app its last two charts: an area chart for a total and its parts over time, and a donut for a whole and its shares, each reading as one system with LineChart and BarChart, each usable by keyboard and screen reader mark by mark, each drawn whole on the server, and each kept to the chart palette's rules: four colors and slate, textures one prop away and always on in forced colors, never a color that carries another meaning. Ship them as one release of `@snapshot-ui/charts`, with the CSS in core's `charts.css`.

The hard parts:

- **A stacked area is the chart most often drawn misleading.** Overlapping translucent areas mix their colors into new ones and hide what is underneath; a smoothed curve invents values between the points; a stack that crosses zero folds over itself. Each has a rule here (section 7.3).
- **Textures on a stretched drawing.** LineChart's svg stretches to its box with `preserveAspectRatio="none"`, so a stripe pattern in the svg would skew with the box's shape: 45 degree stripes become 22 degrees on a wide chart. BarChart drew its textures in HTML for that reason. An area's shape is a polygon, not a box (section 7.4).
- **The palette in a ring.** The palette was checked on neighbours in a row. A ring adds one pair, the last with the first, which the record's all-pairs table shows can fail (section 6).
- **A focus ring on an arc.** CSS outlines do not follow an svg path, and a slice is a path. The ring must still be the token outline at the token offset, concentric with the slice (section 8.4).
- **Nothing measured.** A label in the hole, a legend beside the ring, a band under the pointer: all laid out from known numbers or read in an event handler, never before the first paint.
- **Every figure is the app's.** A donut's percentages, its total and its "Other" are the app's strings; the chart sums only to draw angles, never to say a number.

Build order, which is also the plan's order:

1. **The foundations' additions** (section 9): `positions.ts` and `stack.ts` moved out of LineChart and BarChart, the shared texture slots, the svg pattern set, the table's footer row, and `ChartBlock` grown to four, with LineChart's and BarChart's tests and baselines unchanged as the proof.
2. **AreaChart** (section 7), on the most shared code.
3. **The ring check** (section 6): `palette.js` gains the ring's pairs and the donut's slot order, measured and recorded before any slice is drawn.
4. **DonutChart** (section 8).

Out of scope, each recorded where it is deferred:

- **A 100% stacked area** (each position scaled to the whole) and **a stream graph.** Open question 4.
- **Overlapping areas,** each from zero, see-through. Rejected (section 7.3): mixed colors impersonate a fifth series and hide the lower ones. Two series over time are LineChart's.
- **Smoothed curves.** Straight segments only, `path.ts`'s rule.
- **Areas below zero.** Parts of a whole are not negative; signed series are LineChart's or BarChart's (open question 6).
- **A previous-period comparison on an area.** BarChart's hatched look is for bars; two periods over time are LineChart's two series.
- **A pie, a half donut, a donut in a donut, slices pulled out, labels on the arcs.** Open questions 16 to 18.
- **Animation,** on first paint or on change. Every chart renders what it is given (home spec, section 1).
- **A library-made "Other".** The library never sums a figure it must say; the app folds and labels "Other" (section 8.5).
- Number, date and percentage formatting, as everywhere: every figure, tick, share and total is the app's string.

## 2. The batch split

Two charts on one set of foundations, one palette and one keyboard model. AreaChart is mostly shared code; DonutChart is new geometry and a new focus ring. The estimate is about 25 stories and 128 baselines (section 17), smaller than batch 6's 193, so **one batch, 12, one release** (open question 1).

| Batch | Parts | Package releases | Why together |
| --- | --- | --- | --- |
| **12, Parts of a whole** | AreaChart, DonutChart, the foundations' additions, the ring check | `@snapshot-ui/charts` minor; core and react minor for `charts.css` | Both draw a whole and its parts in the palette with "Other" in slate, share the textures, the table, the states, the roving focus and the links, and finish phase 6 together |

- **If it must shrink.** AreaChart ships first in build order and alone if DonutChart's focus ring (risk R3) or the ring check slips; DonutChart follows in the next charts minor, with no change to this spec.
- **Versions.** The changesets name no number. If nothing else releases between, after 11a (0.17.0) and 11b (no release), core and react are 0.18.0 and charts 0.3.0 with its core peer at `^0.18.0`, since the area and donut rules are in core 0.18's `charts.css`. If this batch ships before 11a, core and react are 0.17.0 and charts 0.3.0 with its peer at `^0.17.0`. Every version is 0.x: 1.0 comes after phase 7 (section 19).

## 3. What it takes from earlier batches

| From an earlier batch | Used here as |
| --- | --- |
| `foundations/scale.ts` (`linearScale`, `extent`, `niceDomain`), `domain.ts` (`valueDomain` with `includeZero`), `format.ts` (`coordinate`, `percent`: three decimals, so server and browser agree), `ticks.ts` (`defaultTicks`) | AreaChart's y scale and domain from the stacked sums; every coordinate both charts write |
| `foundations/path.ts` (`linePath`, `areaPath`, the runs a `null` breaks, straight segments only) | AreaChart's edges, its one-series look and its gaps |
| `foundations/keys.ts` (`moveFrom`, `PAGE`, `hasModifier`, `isRightToLeft`) | Both charts' keys; Left and Right mirrored from the nearest `dir` |
| `foundations/naming.ts` (`chartName`: `aria-labelledby` first, a blank name falls through, the column headers last) | Both charts' names |
| `foundations/ChartTable.tsx` (the table, its caption or `aria-labelledby`, the toggle, the `noscript` note and its shown copy without ids, cell ids so a mark is named by its cells) | Both charts' tables; each mark's name |
| `foundations/ChartLegend.tsx` (`ul` of keys by `data-color` and `look`) | AreaChart's legend; DonutChart's legend, grown by two cells (section 9) |
| `foundations/readout.ts` (`placeReadout`, `readoutAlign`, `READOUT_LINE`, `READOUT_EDGES`, `READOUT_GAP`) | AreaChart's readout; DonutChart's centre content needs no placement |
| `foundations/useChartActive.ts` (the active mark and its source, the tab stop after mount, Escape hiding the readout, the touch hold, the roving `stop`) | Both charts, with string marks (`position:series`, `slice`) as BarChart's `band:series` |
| `foundations/status.ts` (`ChartStatus`, `ChartStatusLabels`, `DEFAULT_STATUS_LABELS`) | Both charts' three states and their strings |
| `foundations/color.ts` (`ChartColor`) | The two narrower types, `AreaColor` and `DonutColor` (sections 7.2 and 8.2) |
| BarChart (batch 6): the roving tab index with each mark `role="img"` named by its table cells, the arrow keys to the mark drawn in that direction, links per mark as anchors that work before hydration with `navigate` for the app's router, `onBarPress`, the band as the pointer's hit area, the other marks at 40% under a pointer, the stack by sign (`stackBySign`), the texture slots by color (`slotOf`: a slot's own number, slate's 5), the 2px surface gap through `--chart-surface` and `--bar-chart-gap`, the states' skeleton and messages, `contain-intrinsic-inline-size: 20rem` | Both charts' focus, keys, links, pointer, gaps, textures and states |
| LineChart (batch 2): the stretched svg with non-scaling strokes, the crosshair, the dot with its surface ring, the one-series area's 10% ink wash, the x tick labels kept inside the plot by `data-edge` | AreaChart's plot, its one-series look, its active stop |
| Gauge (batch 5): a ring in an svg at its own size, one user unit one pixel, two half arcs for a whole ring, three decimals, `--gauge-flip` so a Persian ring runs counter-clockwise from the top, the track in `--color-frame`, the forced-colors block naming every stroke because an svg keeps its author's colors | DonutChart's geometry, direction, empty track and forced colors |
| Meter's legend swatch (12px, `--radius-micro`) and its hatch (2px every 6px at 45 degrees) | Both charts' legend keys and textures |
| The chart palette (batch 6): `chart-1` to `chart-4`, slate as "Other", `palette.js` (`neighbours`, `chartColors`, `paletteFailures`, `CHART_GROUNDS`), the 24 contrast pairs, the record's all-pairs table | Both charts' colors; the ring check of section 6 |
| `.skeleton` and `.empty-state` as a class contract (batch 3c) | Both charts' loading and empty faces without importing `@snapshot-ui/react` |
| `charts.css`: `--chart-flip`, `--chart-direction`, `--chart-surface`, the gridline and baseline strokes, `print-color-adjust: exact`, the toolbar's corner inset in a card | Both charts |
| The numeral rule (`copy.css`) | Values, shares and totals in right to left |
| `Card` and the holder properties, the concentric audit (`apps/storybook/tests/concentric`) | Every new story, in three shapes |
| `AriaName`, `cx`, `useWarnOnce` | As everywhere |

React Aria parts used for the first time: none. `@snapshot-ui/charts` imports nothing from React Aria; both charts are client parts for their active mark, as LineChart and BarChart are.

## 4. What this phase answers

| Row | Parent spec | Here |
| --- | --- | --- |
| Line chart | Phase 6 | Shipped (batch 2); unchanged |
| Bar chart | Phase 6 | Shipped (batch 6); unchanged but for moved helpers |
| The chart palette | "derived and measured for contrast in both themes before any chart is built" | Shipped (batch 6); gains the ring check (section 6) |
| **Area chart** | Phase 6 | **Section 7** |
| **Donut chart** | Phase 6 | **Section 8** |
| "on Recharts" | Section 4 and 7 of the parent spec | Superseded since batch 2: the home spec rejected a chart library (each measures on the client or draws nothing useful on the server), and the insights spec confirmed it. This batch adds no chart dependency. The parent spec's words are amended in the 12 plan's first commit (open question 27) |

Neither chart exists in the source app, so both are new and each gets an Appendix B section of the design record before it is built (parent spec, section 3): "AreaChart" and "DonutChart", and "Chart palette" gains "In a ring".

The rules for every part, unchanged from batch 6: `'use client'` only on interactive parts; no `Intl` formatting and no `window` at render, and no first-paint measurement; no external request and no injected script; light and dark, all three shapes, right to left (the Persian guide), comfortable and compact density; WCAG 2.2 AA including 2.5.8; weights 400, 450, 500 and 700 only; tokens only in `@layer components`; every size container declares `contain-intrinsic-inline-size`; focus never falls to the body; everything exported from the package index, with the CSS in core.

## 5. Approach

**Reuse first.** Both charts are built on `src/foundations/`, and what each needs that a shipped chart already does is moved there before it is used (section 9), with LineChart's and BarChart's tests and baselines unchanged as the proof, the insights spec's rule.

**One keyboard model for marks.** BarChart's: one tab stop that is the active mark, a roving tab index set after mount, each mark `role="img"` named by its table cells, arrows to the mark drawn in that direction, no live region. AreaChart's marks are its values (a part at a time), DonutChart's its slices. LineChart keeps its one-plot model in this batch (insights ruling 6).

**Color by identity, never by meaning.** A part of a whole is a peer: the four palette slots and slate. `ink` draws AreaChart's single series only; `gain`, and every reserved color (signal orange and its light form, clay, error, success, warning, link blue), are outside both charts' color types, so the type system refuses them.

**Textures as the second channel.** Off by default and always on in forced colors (insights ruling 11), in BarChart's slots: solid, stripes at 45 degrees, at 135, both, then solid slate. Drawn where they can keep their 2px every 6px: as CSS gradients on HTML for the area, as svg patterns in an unstretched svg for the donut.

**Drawn whole on the server.** Every coordinate is written in render with three decimals from the app's numbers; the ring's size is a fixed set of sizes, so one user unit is one pixel; the area's polygons are percentages of the plot. Nothing is measured; the pointer reads a box only in its handler.

| Part | In the server's HTML | After hydration |
| --- | --- | --- |
| AreaChart | Everything a reader sees: the gridlines, every layer, the edges, the x and y labels, the legend, the table (hidden), the toggle, the `noscript` copy, the status, the links | The tab stop on the active value, the keys, the pointer, the crosshair and dot, the readout, the toggle |
| DonutChart | Everything: every slice, the gaps, the centre total, the legend with values and shares, the table, the toggle, the `noscript` copy, the status, the links | The tab stop on the active slice, the keys, the pointer, the centre readout, the focus ring, the toggle |

Rejected along the way:

- **A chart library** (Recharts, visx, Chart.js, Observable Plot). Section 4.
- **Tinted area fills** (the color at 60% or 40% over the surface). Measured in section 6.3: they fall under 3:1 and pull neighbours together.
- **Area fills as svg paths with svg patterns.** The stretched svg skews the patterns (section 7.4).
- **A pie.** The hole holds the total, and an angle at the centre is harder to compare than an arc (open question 16).
- **Labels on or beside the arcs.** Placing them without collisions is a measurement; the legend list carries every name and figure.
- **The stack's slot order for the donut.** It fails at the ring's wrap (section 6.2).

## 6. The palette in a stack and in a ring

### 6.1 AreaChart: a stack, as bars are

An area's layers touch only the layer below and the layer above, as a stack's segments do, so AreaChart takes BarChart's order unchanged: `chart-1`, `chart-2`, `chart-3`, `chart-4`, then slate for the fifth, "Other". The record's neighbour figures hold (1 and 2: 29.5 and 20.0 light, 26.1 and 13.8 dark; 2 and 3; 3 and 4; 4 and slate 21.2 and 10.0 light, 22.5 and 12.4 dark). A pinned "Other" on an earlier slot carries the record's recorded, not gated, figures (teal and slate 13.0 and 8.2 in light).

### 6.2 DonutChart: a ring, whose ends meet

A ring of n slices has n neighbouring pairs: the stack's n minus 1, and the last with the first. Measured for this spec with `palette.js` (`distance`, `cvdDistance`, each color painted over Lifted; OKLab distance times 100; the color-blind figure the lesser of protanopia and deuteranopia; the floors 15 and 8):

| Ring | Its wrap pair | Light: normal, color-blind | Dark: normal, color-blind | Passes |
| --- | --- | --- | --- | --- |
| Stack order, four slices: teal, violet, olive, magenta | magenta and teal | 32.3, 15.0 | 28.6, **3.7** | No |
| Stack order, four and "Other": teal, violet, olive, magenta, slate | slate and teal | **13.0**, 8.2 | 15.5, 8.0 | No |
| **Ring order, four and "Other": violet, teal, olive, magenta, slate** | slate and violet | 21.2, 17.8 | 20.9, 17.7 | **Yes**: every pair in both modes, worst 15.2 (teal and olive, dark) and 10.0 (magenta and slate, light) |
| Ring order, four slices: violet, teal, olive, magenta | magenta and violet | **10.3**, **7.7** | **12.0**, 10.3 | No |
| Ring order, three and "Other": violet, teal, olive, slate | slate and violet | 21.2, 17.8 (olive and slate: **12.6**, 10.9) | passes | No, by olive and slate in light |
| Ring order, two and "Other": violet, teal, slate | slate and violet | 21.2, 17.8 (teal and slate: **13.0**, 8.2) | passes | No, by teal and slate in light |
| Ring order, three or two slices | | passes | passes | Yes |
| One slice and "Other": violet, slate | | 21.2, 17.8 | 20.9, 17.7 | Yes |

Slate is translucent in dark, so its figures depend on the surface it is painted over: over Lifted, as here, teal and slate are 15.5 and 8.0 in dark; the palette record's 14.3 and 6.5 were painted over the canvas. The plan settles one surface for both records and re-measures; no recommendation below changes either way.

An exhaustive search of every order of the four slots, for every count with and without "Other", found no single order that passes every ring: a four-slice ring always closes on a pair the record's all-pairs table already marks as weak (violet and magenta, or teal and magenta), and slate sits under 15 from teal and from olive in light whatever is next to it.

**Decided as recommended (open question 12):**

- **The donut assigns slots in ring order:** `chart-2`, `chart-1`, `chart-3`, `chart-4` (violet, teal, olive, magenta), then slate for "Other". It passes the full five-slice ring, the form the docs recommend, and every ring of one to three peers; its worst failure anywhere is 10.3 and 7.7, against the stack order's 3.7.
- **Slices never touch.** A 2px gap of the surface (`--chart-surface`) lies between every pair, the stack's spacer, so the method's neighbour check, which is about marks that touch, is met by construction; the measured pairs are what a reader compares across the gap.
- **The failing rings are recorded, not gated:** four peers without "Other", and two or three peers with "Other" in light. Each slice also has its name in the legend beside it, its own name on focus, the table, and textures one prop away. The docs recommend folding to four and "Other" when there are five or more categories, and pinning colors when the same categories appear in a stack on the same page (so a category keeps one color across both charts).
- **The check joins the tests.** `palette.js` gains `ringNeighbours(list)` (each item with the next, and the last with the first) and `ringFailures(palette, mode, order)`, and `palette.test.js` asserts that the five-slice ring in ring order passes in both modes and that the recorded rings fail exactly as this table says, so a changed token is seen.

### 6.3 Why fills are full strength

A layer or a slice is a graphic and must clear 3:1 against the surface it sits on. Measured against Lifted, the color mixed with the surface:

| Mix | Light: teal, violet, olive, magenta, slate | Dark: the same |
| --- | --- | --- |
| 100% | 3.63, 8.03, 4.74, 8.08, 5.31 | 4.64, 5.11, 4.53, 3.95, 6.94 |
| 60% | **2.13**, 3.22, **2.34**, 3.63, **2.43** | **2.46**, **2.64**, **2.45**, **2.18**, 3.34 |
| 40% | **1.64**, **2.08**, **1.71**, **2.27**, **1.75** | **1.75**, **1.85**, **1.76**, **1.61**, **2.19** |

And neighbours pull together as the mix lightens: at 60%, teal and slate are 8.8 and 3.6 apart in light, under both floors. So a stacked layer and a slice are drawn at full strength, as a stacked bar is; the 2px surface gaps keep the quiet look by separating the bands rather than by washing them out. AreaChart's single series keeps LineChart's look (a 2px ink line over a 10% ink wash, the wash a cue at 1.23 in light and 1.34 in dark, the line the graphic at 17.84 and 17.42).

## 7. AreaChart

### 7.1 Anatomy

`figure.area-chart[data-layout][data-status][data-view]`, named by its `aria-label` or `aria-labelledby`, holds, in order:

- `div.area-chart-chart`, the chart view: the legend (`ul.area-chart-legend`, two or more series), and `div.area-chart-plot`, holding, back to front:
  - `svg.area-chart-grid`: the y gridlines and the baseline, stretched, non-scaling strokes (LineChart's);
  - `div.area-chart-layers`: one `div.area-chart-layer[data-series][data-color]` per series per unbroken run, each the full plot clipped to its polygon;
  - `svg.area-chart-edges`: one polyline per layer's upper edge (the surface gaps, or the series' own line when textured or alone);
  - `div.area-chart-stops`: one `span.area-chart-point` (or `a.area-chart-point`) per value, at its layer's upper edge, and the link targets;
  - the y tick labels, the crosshair, the readout;
- `div.area-chart-x` under the plot, the x tick labels (hidden from assistive technology);
- `table.area-chart-table` (hidden while the chart shows), the toolbar with the toggle, the `noscript` note and table, and `span.area-chart-status`, the polite status.

```
 Spending by category, October
 [#] Groceries  [#] Dining  [#] Transport  [#] Home  [#] Other
 $300 -------------------------------------------------------------
      |                                   ___....----""""        |  <- Other (slate), top band
 $200 -----------------------......----"""                  ------
      |               ..---""     Home (magenta)          |       |
 $100 ---------..--""------------------------------------|--------  <- crosshair at Oct 21, dot on Dining
      |  __..--     Dining, Transport, Groceries ...     ( )       |
 $0   =============================================================
      Oct 1                     Oct 16                       Oct 31
                                                      [Show as table]
```

### 7.2 API

```ts
/** One value: the number places it, the string says it. */
export interface AreaValue {
  /** Zero or more: a part of a whole. A negative draws as zero, with a warning (section 7.3). */
  value: number;
  /** Formatted: "$42.00", "۴۲ دلار". */
  valueLabel: string;
  /** Makes the value a link to what it stands for, such as that day's transactions in that category. */
  href?: string;
}

/** A layer's color: a palette slot or slate. Never ink (a single unpinned series draws in ink), never a meaning. */
export type AreaColor = 'chart-1' | 'chart-2' | 'chart-3' | 'chart-4' | 'slate';

export interface AreaSeries {
  /** "Groceries", "Other". Names the series in the legend, the readout, each value's name and the table. */
  label: string;
  /** One per position, aligned with `xLabels`. `null` is unknown: the whole stack has a gap there (section 7.3). */
  values: readonly (AreaValue | null)[];
  /** Pins the series to a color, so it keeps it when another is filtered out. @default chart-1 to chart-4 by place, then slate */
  color?: AreaColor;
}

/** The strings the chart writes itself. Give all six, so no default in English is left on the page. */
export interface AreaChartLabels {
  showTable: string;
  showChart: string;
  /** Shown with scripts off, above the table: "Scripts are off, so the chart's data is in the table below." */
  noScript: string;
  /** The plot's `aria-roledescription`: "chart". */
  roleDescription: string;
  /** Each value's `aria-roledescription`: "point". */
  point: string;
  /** The table's header for `totals`, and the readout's: "Total". */
  total: string;
}

export type AreaChartProps = Omit<HTMLAttributes<HTMLElement>, 'children' | 'aria-label' | 'aria-labelledby'> &
  AriaName & {
    /** One to five series, stacked from the baseline in this order: the first at the bottom. The fifth is the app's "Other". */
    series: readonly AreaSeries[];
    /** The positions' labels, formatted, oldest first: "Oct 1", "Oct 2". */
    xLabels: readonly string[];
    /** Which x labels show, by index. @default first, middle and last */
    xTicks?: readonly number[];
    /** The y gridlines and their labels, formatted. Absent, only the baseline, and the readout and table carry the values. */
    yTicks?: readonly { value: number; label: string }[];
    /** The y domain. Always widened to include zero. @default zero to the nice ceiling of the greatest stacked sum */
    yDomain?: readonly [number, number];
    /** Each position's total, formatted by the app, for the readout and a Total column. The chart never sums a figure it says. */
    totals?: readonly (string | null)[];
    /** @default 'ready' */
    status?: ChartStatus;
    /** Drawn in the plot's place for 'empty' and 'error', such as an EmptyState with a Retry button. */
    statusContent?: ReactNode;
    /** Draws each layer's texture as well as its color. Always on in forced colors. @default false */
    hasTexture?: boolean;
    /** @default English, as LineChart's and BarChart's */
    labels?: AreaChartLabels;
    statusLabels?: ChartStatusLabels;
    /** The plot's height in px. @default 240 */
    height?: number;
    /** Called with a value's position and series when it is pressed: a click or tap on its part of the plot, or Enter or Space on a value with no `href`. */
    onValuePress?: (position: number, series: number) => void;
    /** Opens a link's href through your router, as RouterProvider's `navigate` does; a click with a modifier key stays the browser's. */
    navigate?: (href: string) => void;
    ref?: Ref<HTMLElement>;
  };
```

- **LineChart's names.** An area chart's axes never swap, so it says `xLabels`, `xTicks`, `yTicks` and `yDomain`, as LineChart does, not BarChart's orientation-neutral names.
- **Five series at most,** in the docs and in a development warning: past five, the sixth and later draw in slate, as BarChart's stack does, and the warning says to fold them into "Other".
- **One series.** Unpinned, it draws LineChart's look: a 2px ink line over a 10% ink wash. Pinned to a slot (one category filtered out of a stack), it draws as a one-layer stack in its color, so a category keeps its color when the app shows it alone.
- **When to use which,** in the docs: LineChart for one or two measures over time; AreaChart for a total and its parts over time; BarChart for parts at a few moments, or for any figure below zero.

### 7.3 Geometry

- **Positions.** LineChart's: `n` positions spread from the plot's inline start (0) to its end (100), the first and last on the edges (`xPosition`, moved to `foundations/positions.ts`).
- **The stack.** At each position, layer `i` runs from the sum of the values below it to that sum plus its own value, in series order, the first on the baseline. `stackBySign` from BarChart (moved to `foundations/stack.ts`) with the positive half only.
- **Domain.** `valueDomain` over the stacked sums with `includeZero`; a given `yDomain` without zero is widened and warns, BarChart's rule, since a stack's thickness is its value.
- **No negatives.** A part of a whole is not below zero. A negative value draws as zero and warns once in development; the table and the value's name keep the app's string, so nothing is hidden (open question 6).
- **Gaps.** A `null` is unknown, so the total there is unknown: a position where any series is `null` is a gap in every layer, the stack's runs broken there, `path.ts`'s rule for lines. A position where only some series are `null` warns once in development, since the app likely meant zero. A position alone between two gaps draws each layer as a 2px column at that position, so its values are seen, LineChart's lone dot made a stack.
- **Straight segments.** Between positions, each edge is a straight line: a smoothed curve invents values.
- **Overlap never.** Every layer stacks; there is no `layout` prop for overlapping areas (section 1).

### 7.4 Fills, edges and textures

- **Fills are HTML, clipped.** Each layer is a `div` covering the plot (`position: absolute; inset: 0`) with `clip-path: polygon(...)`: its upper edge from start to end, then its lower edge back, every point in percent of the plot, written in render with three decimals. The percentages of a `polygon()` resolve against the element's own box, which is the plot's, so they are the svg's 0 to 100 coordinates; the server's HTML is the final picture, and nothing is measured.
- **Why not svg fills.** LineChart's svg stretches with `preserveAspectRatio="none"`. A pattern in a stretched svg is stretched with it: on a 600 by 240 plot, 45 degree stripes 2px apart become stripes at about 22 degrees and of uneven width, and differently on a phone. A CSS gradient on a clipped `div` keeps BarChart's 2px every 6px at 45 and 135 degrees on any box (open question 5).
- **Color.** `background-color: var(--area-chart-color)`, set per layer by `data-color` (the four slots and slate), full strength (section 6.3).
- **Edges.** In `svg.area-chart-edges`, over the layers, each layer's upper edge but the top one's is a 2px polyline in `--chart-surface`, non-scaling: the stack's 2px gap, drawn on the boundary, so each band reads as its own shape and the total's outline is the top layer's own edge against the surface. With one unpinned series, the edge is LineChart's 2px ink line.
- **Textures** (`hasTexture`, and always in forced colors). Each layer's slot by BarChart's `slotOf`: 1 solid, 2 stripes at 45 degrees, 3 at 135, 4 both, 5 (slate) solid. A textured layer draws its stripes in its color over the surface (`--bar-chart-texture`'s gradients, shared under `:is(.bar-chart, .area-chart)`), and its upper edge becomes a 2px line in its own color instead of the surface, so a striped band has a solid outline where stripes do not print.
- **Right to left.** The plot's layers, svg and stops are mirrored with `scale: var(--chart-flip) 1`, the svg's rule, since a `polygon()` has no logical coordinates. A mirrored 45 degree stripe would read as 135, so under `[dir='rtl' i]` the slot 2 and slot 3 gradients are written swapped, and after the flip each layer shows the angle its legend key shows. Text is HTML outside the flipped box and is not mirrored.

### 7.5 Labels and legend

- **x labels** are LineChart's: the labels at `xTicks`, first, middle and last by default, centred on their position and kept inside the plot at the edges by `data-edge`, hidden from assistive technology (each value's name carries its position).
- **y labels** are LineChart's: at the inline start above their gridline, slate, tabular.
- **No value labels on the plot.** The readout, the names and the table carry every value; a number on every layer at every position is the method's "never a number on every point".
- **The legend.** Two or more series: the shared legend at the top inline start, `--text-small`, ink labels, 12px swatch keys (Meter's) in the series' color, textured with the chart. In series order, which is bottom to top in the plot; the docs advise putting the steadiest part first, on the baseline, where its shape reads truest.

### 7.6 Focus and keys

**One stop, on a value.** Each value with a number is `span.area-chart-point[role="img"]` (an `a` with `href`), with `aria-roledescription` from `labels.point`, placed at its position and its layer's upper edge. After mount the active value has `tabIndex={0}` and every other `-1`; the server writes none (with scripts off nothing is a dead stop). Tab lands on the active value; the first time, the newest position with a value, first series. Each value's name is its cells through `aria-labelledby`: the row header (the position), the column header (the series) and the cell: "Oct 21 Dining $64.00, point".

| Key | Does |
| --- | --- |
| Arrow Right, Arrow Left | The same series at the next or previous position with a value, in the drawn direction (mirrored in right to left). |
| Arrow Up, Arrow Down | The series above or below in the stack at the same position, skipping a series with no value there. With one series, nothing, and the key is not prevented. |
| Home, End | The first or last position with a value, same series. |
| Page Up, Page Down | Seven positions back or forward (`PAGE`), landing on the nearest with a value. |
| Enter | Follows the value's link; or presses it with `onValuePress`. |
| Space | Presses a value with no `href` when `onValuePress` is given. |
| Escape | Hides the readout until the next move; stopped as well as prevented, so a chart in a Dialog hides its readout first. |
| Tab, Shift+Tab | Leaves the chart: to the table toggle, or back. |

A key with Alt, Control or Meta is the browser's. A move to nowhere is not a move: the readout stays.

**The active value is drawn** as LineChart's: a 1px crosshair in ink at its position across the plot, and a 12px dot in the layer's color with a 2px surface ring on its layer's upper edge. Focus adds the token ring (2px at 2px offset) around the dot, a circle round a circle, concentric by construction.

### 7.7 Pointer and readout

- **Hit area.** A mouse or pen over the plot activates the position nearest the pointer along x (halfway to each neighbour), and in it the layer whose band holds the pointer's y at that position (read from `getBoundingClientRect` in the handler), the top layer above the stack and the bottom one below it. The hit area is the column and the band, never the dot. Leaving clears it unless a value has focus; a touch press activates and holds until a press outside. A pointer does not move focus.
- **No dimming.** BarChart dims the other bands under a pointer; an area's other layers are the context the active one is read against, so nothing dims. The crosshair and the dot mark the value.
- **The readout.** LineChart's float panel through `placeReadout`, with the marks the active position's upper edges and its lines the series with a value there: the position in slate, then one line per series in legend order with a 12px swatch (textured with the chart), the value at 500 and tabular, then the series' label in slate; with `totals`, a last line with the total and `labels.total`. It sits above the stack's top when its lines fit, else below the baseline, else on the side with more room, aligned by quarter (`readoutAlign`). Hidden from assistive technology: the focused value's name says its part.

### 7.8 Links and presses

As BarChart's (its "Bars that act" record): a value with `href` is an anchor that works before hydration, from a server page and with a modifier key; its table cell links too; `navigate` routes a plain click or Enter through the app's router. Its pointer target is a transparent anchor over its column (halfway to each neighbour) and its band's extent at that position; a band thinner than 24px at a position keeps its link in the table, whose cell is the equivalent control (2.5.8's exception), and the docs say so. `onValuePress` makes a value with no `href` a `button` by role.

### 7.9 The table

The shared `ChartTable`: a row per position with its label as the row header, a column per series with its label as the header, every cell the app's string (empty for `null`), and a "Total" column (`labels.total`) when `totals` is given. Rows oldest first, in any direction. Named as the chart is. The toggle swaps views and keeps focus; with scripts off the `noscript` note and a shown copy follow the chart.

### 7.10 Empty, loading and error

The figure keeps its height in every state.

- **Loading.** The plot holds one `div.skeleton` clipped to a fixed gentle polygon (a low hill across the plot, the same in every chart), with Skeleton's pulse and its reduced-motion stillness, hidden from assistive technology; the figure is `aria-busy="true"` and the status says `statusLabels.loading` once. No legend, toggle or table.
- **Empty.** The gridlines and the baseline draw; the plot holds `statusContent` or `p.area-chart-message` with `statusLabels.empty` in slate. A ready chart whose every value is zero or `null` draws the same, with no warning: it is data.
- **Error.** The same place holds `statusContent` or the message with `statusLabels.error` in `--color-error`, a failure, which a failed load is; the words carry it.

### 7.11 Look and CSS

In `charts.css`, under `.area-chart`, with the rules it shares with LineChart and BarChart written once in selector lists (`:is(.line-chart-y-label, .bar-chart-y-label, .area-chart-y-label)` and so on).

- **Layers** as section 7.4; `print-color-adjust: exact` on the figure.
- **Contrast,** all recorded already: each slot and slate against Lifted, the canvas and Float as the palette record (section 6.3's first row); ink 17.84 and 17.42; the gridlines and baseline cues at 1.23 and 1.28 (LineChart's); the surface gaps are gaps, not graphics. Labels in ink and slate, gated as text. Nothing new joins the gate.
- **Weights.** 450 for labels, 500 for the readout's values.
- **Density.** Nothing changes in compact: the chart's sizes are its own; its Card changes its padding.

### 7.12 Forced colors

Layers opt out of the repaint (`forced-color-adjust: none`), as BarChart's bars do, and draw in `CanvasText` with the textures on, since a system palette has one text color and a stack needs four looks; slot 5 draws in `GrayText`, so "Other" is the remainder there too; the surface gaps become the system background (`canvas`, through `--chart-surface` set there alone); textured layers' edges are `CanvasText`; the gridlines `GrayText`; the crosshair, the active dot and the focus ring `Highlight`; the one-series wash `none` and its line `CanvasText`, LineChart's block. The legend swatches follow their layers.

### 7.13 Right to left

Positions run from the inline start, so in a right-to-left page the oldest is at the right (home spec ruling 3). Section 7.4's flip and stripe swap; Left and Right follow the drawn direction, read at the key press from the nearest `dir`; the app's strings stay left to right inside their isolates by the numeral rule; a Persian page passes Persian digits and Persian `labels`.

### 7.14 Container responsiveness

The figure is an inline-size container with `contain-intrinsic-inline-size: 20rem` (BarChart's lesson). Under 24rem of its own width the x labels show the first and last only and the legend wraps onto as many lines as it needs. At 320px in a Card (a 248px plot), 31 positions sit 8px apart, each reachable by keys and by its column with the pointer. Nothing scrolls sideways; a docs e2e checks 320px.

### 7.15 Corners

Layers have no corners: an area's ends are the plot's edges, square in every shape. The dot is a circle and its ring concentric with it. The readout is LineChart's float surface and starts its own ladder. In a Card the table toggle moves down by the corner inset, the shared rule. The plot never sits within a Card's curve (the card's 32px padding and the y labels keep it clear), so the concentric audit passes it.

### 7.16 Server rendering

A client part (`'use client'`), importing nothing from React Aria. On the server it renders the final picture: every polygon, edge, label, the legend, the hidden table, the toggle, the status host, the `noscript` copy and the links. No `Intl`, no `window`, no measurement; ids from `useId`. After mount it sets the active value's tab stop. It joins `server-render.test.tsx` and the hydration suite under `en-US`, `de-DE` and `fa-IR` in UTC and Asia/Tehran with `onRecoverableError` failing the test; it writes nothing from a locale, so it has no server face of its own.

### 7.17 How others do it

Each claim marked "to verify" is from memory and is checked by the plan before the docs cite it.

| System | Stacking | Fills | Keyboard and screen reader | Table | What this spec takes |
| --- | --- | --- | --- | --- | --- |
| IBM Carbon Charts | Stacked area (to verify) | Tinted fills with a top line (to verify) | Limited mark focus (to verify) | "Show as table" in the toolbar's menu | The table behind a visible control |
| Shopify Polaris Viz | `StackedAreaChart` (to verify) | Gradient fills (to verify) | Tooltips on focus (to verify) | Not built in (to verify) | Not the gradients: a gradient's light end falls under 3:1 |
| Recharts | `Area` with `stackId`; `stackOffset` of `expand` for 100% (to verify) | `fillOpacity` 0.6 by default (to verify) | An accessibility layer with arrow keys (to verify) | None | The stack by series order; not the opacity |
| Observable Plot | `areaY` stacks by default (to verify) | Opaque by default (to verify) | None by default | None | Opaque stacked fills |
| Highcharts (accessibility module) | `stacking: 'normal'` and `'percent'` (to verify) | Tinted with a line (to verify) | Arrow keys between points, Up and Down between series (to verify) | Data table export | Up and Down between series |
| Datawrapper's guidance (to verify) | Stacked areas for parts of a total; few series, the steadiest at the bottom | Opaque | | | The docs' advice on order and count |
| Material Design 3 | No chart components (to verify) | | | | Nothing |

## 8. DonutChart

### 8.1 Anatomy

`figure.donut-chart[data-size][data-legend][data-status][data-view]`, named by its `aria-label` or `aria-labelledby`, holds:

- `div.donut-chart-chart`, the chart view, a grid of the ring and the legend:
  - `div.donut-chart-plot[role="group"]` with `aria-roledescription` from `labels.roleDescription`, named as the chart is and described by the centre's total, holding `svg.donut-chart-ring` (the slices, the gaps, the patterns, the focus ring layer) and `div.donut-chart-centre` over the hole;
  - `ul.donut-chart-legend`, one item per slice with its key, label, value and share, hidden from assistive technology (each slice's name says them);
- `table.donut-chart-table` (hidden while the chart shows) with a footer row for the total, the toolbar with the toggle, the `noscript` note and table, and `span.donut-chart-status`.

```
        .--''''--.                [#] Groceries          $820   38%
      /  .------.  \              [#] Dining             $410   19%
     |  /        \  |             [#] Transport          $330   15%
     | |  $2,140  | |             [#] Home               $290   14%
     | |  Spent in| |             [#] Other              $290   14%
     |  \ October/  |                 12 more categories
      \  '------'  /
        '--....--'                                    [Show as table]
```

### 8.2 API

```ts
/** A slice's color: a palette slot or slate. Never ink, never a meaning. */
export type DonutColor = 'chart-1' | 'chart-2' | 'chart-3' | 'chart-4' | 'slate';

export interface DonutSlice {
  /** "Groceries", "Other". Names the slice in the legend, the centre, its name and the table. */
  label: string;
  /** Zero or more: the slice's angle is its share of the sum of every slice's value. A negative draws as zero, with a warning. */
  value: number;
  /** Formatted: "$820.00". */
  valueLabel: string;
  /** The share, formatted by the app: "38%", "۳۸٪". The chart never formats a percentage. */
  shareLabel?: string;
  /** A line under the label in the legend and the centre: "12 more categories", for "Other". */
  description?: string;
  /** The app's remainder: slate, drawn where given, expected last. Ignores `color`. */
  isOther?: boolean;
  /** Pins the slice to a color, so it keeps it when another is filtered out. @default by ring order, section 6.2 */
  color?: DonutColor;
  /** Makes the slice a link to what it stands for. */
  href?: string;
}

export interface DonutTotal {
  /** The whole, formatted by the app: "$2,140". The chart never sums a figure it says. */
  valueLabel: string;
  /** A line under it: "Spent in October". */
  label?: string;
}

/** The strings the chart writes itself. Give all eight, so no default in English is left on the page. */
export interface DonutChartLabels {
  showTable: string;
  showChart: string;
  noScript: string;
  /** The ring's `aria-roledescription`: "chart". */
  roleDescription: string;
  /** Each slice's `aria-roledescription`: "slice". */
  slice: string;
  /** The table's value column header: "Amount". */
  value: string;
  /** The table's share column header, when any slice has a `shareLabel`: "Share". */
  share: string;
  /** The table's footer row header: "Total". */
  total: string;
}

export type DonutChartProps = Omit<HTMLAttributes<HTMLElement>, 'children' | 'aria-label' | 'aria-labelledby'> &
  AriaName & {
    /** In the app's order, clockwise from the top (counter-clockwise in right to left): largest first and "Other" last reads best. */
    slices: readonly DonutSlice[];
    /** The whole, written in the hole at rest. Required: a donut without its total is a pie with a hole. */
    total: DonutTotal;
    /** The ring's diameter: 'md' 160px, 'lg' 224px. @default 'lg' */
    size?: 'md' | 'lg';
    /** Where the legend goes: beside the ring when the chart's box has room, under it otherwise, or always under. @default 'auto' */
    legend?: 'auto' | 'below';
    /** @default 'ready' */
    status?: ChartStatus;
    statusContent?: ReactNode;
    /** Draws each slice's texture as well as its color. Always on in forced colors. @default false */
    hasTexture?: boolean;
    labels?: DonutChartLabels;
    statusLabels?: ChartStatusLabels;
    /** Called with a slice's index when it is pressed: a click or tap on its arc or legend item, or Enter or Space on a slice with no `href`. */
    onSlicePress?: (slice: number) => void;
    navigate?: (href: string) => void;
    ref?: Ref<HTMLElement>;
  };
```

- **The total is required** and is the app's string. The chart sums the values only to draw angles.
- **`DonutColor`** is the four slots and slate. `ink`, `gain` and every reserved color are not in the type, so a donut can never draw signal orange, clay, error, success, warning or link blue (open question 10).
- **One slice** (100%) warns once in development: a single share against nothing is a Gauge or a Meter, which the warning names.

### 8.3 Geometry

- **Sizes.** `md`: a 160px ring, 20px thick, a 120px hole. `lg`: a 224px ring, 28px thick, a 168px hole. The svg's `viewBox` is the ring's box and it is drawn at that size, so one user unit is one pixel, Gauge's rule: strokes, gaps, patterns and the focus ring are exact on any page (open question 19).
- **Angles.** The sum `S` of the values (negatives as zero); slice `i` spans `value / S * 360` degrees, from the top, clockwise, in the given order. Each slice is a filled annular sector: an outer arc, a radial line in, an inner arc back, closed; a whole ring (one slice, or all others zero) is Gauge's two half arcs on each radius, with `fill-rule: evenodd`. Every number with three decimals.
- **The least slice.** A nonzero slice spans at least the gap plus 1px of arc at the ring's middle radius, so it never vanishes into its gaps; the difference is taken from the largest slice, so the ring stays whole. A slice under 1% of `S` warns once in development and names folding into "Other".
- **The gaps.** Each slice is stroked 2px in `--chart-surface`, drawn over its fill, so 1px falls on each side of every boundary: 2px of surface between neighbours, and the ring's outer and inner edges 1px in. With one slice there is no radial boundary.
- **Direction.** The svg takes `scale: var(--chart-flip) 1`, Gauge's `--gauge-flip` rule, so a Persian ring runs counter-clockwise from the top; the centre and the legend are HTML and are not mirrored. The 45 and 135 degree patterns are referenced through two custom properties the render writes per slice, swapped under `[dir='rtl' i]`, so after the flip each slice shows its legend key's angle.
- **Textures** are svg `pattern`s in the unstretched svg (`patternUnits="userSpaceOnUse"`, 6px tiles, 2px stripes), one per textured slot per chart, named by `useId`, in the slice's color through its `data-color`; slot by `slotOf`, as BarChart's and AreaChart's.

### 8.4 Focus and the ring

- **Each slice is a stop:** a `g.donut-chart-slice[role="img"]` holding its path, or an svg `a` with `href` (which works before hydration), with `aria-roledescription` from `labels.slice` and `aria-labelledby` its table cells: the row header (the label), the value cell and the share cell: "Groceries $820.00 38%, slice". After mount the active slice has `tabIndex={0}` and the rest `-1`; the first time, the first slice.
- **The focus ring is drawn, not outlined.** An outline does not follow an svg path, so the ring is a path: the slice's sector offset outward by 3px on every side (its outer radius plus 3, its inner radius less 3, each radial edge moved 3px away from the slice) and stroked 2px in `--color-focus-ring`. Its centreline is 3px out, so its inner edge is 2px from the slice and its outer 4px: the token outline (2px) at the token offset (2px), concentric with the slice by construction, square corners round square corners. It is drawn in a layer above every slice, so a neighbour drawn later never covers it, for the active slice while it holds focus and `matches(':focus-visible')` in the focus handler.
- **Keys.**

| Key | Does |
| --- | --- |
| Arrow Right, Arrow Down | The next slice in the app's order, clockwise (counter-clockwise in right to left). Arrow Right and Arrow Left are mirrored in right to left; Up and Down are not. |
| Arrow Left, Arrow Up | The previous slice. |
| Home, End | The first or last slice. |
| Page Up, Page Down | Nothing, and not prevented: five slices need no page. |
| Enter | Follows the slice's link; or presses it with `onSlicePress`. |
| Space | Presses a slice with no `href` when `onSlicePress` is given. |
| Escape | Puts the total back in the centre until the next move; stopped as well as prevented. |
| Tab, Shift+Tab | Leaves the chart: to the toggle, or back. |

A zero slice has no arc and is skipped by the keys, but keeps its legend item and its table row.

### 8.5 The centre and the "Other" rule

**The centre.** `div.donut-chart-centre`, HTML over the hole, inside a square inscribed in it (the hole's diameter divided by the square root of 2: 84px at `md`, 118px at `lg`):

- **At rest:** `p.donut-chart-total`, the total's `valueLabel` at `--text-numeral-sm` (32px, 500, tabular) at `lg` and `--text-h3` (24px, 500) at `md`, in ink, `white-space: nowrap`; under it the total's `label` at `--text-small` in slate, up to two lines. It has an id, and the plot group is described by it, so the group reads "Spending by category, chart, $2,140 Spent in October".
- **While a slice is active** (a key, a pointer or a touch): the slice's label at `--text-small` in slate (two lines, clamped), its value at the total's step in ink, its share in slate. This is the chart's readout, in the one place the ring leaves for it (open question 13). The at-rest content is kept in the DOM with `visibility: hidden`, so the group's description still resolves; the active content is hidden from assistive technology, since the focused slice's name says it. Escape puts the total back.
- **Too wide.** A total wider than the square overflows it visibly rather than wrap a number; the docs advise compact figures in a donut ("$2.1K") and a story pins the widest the docs show (risk R6).

**The "Other" rule.**

1. **At most five colored slices:** up to four peers in the four slots, and one remainder in slate.
2. **The app folds.** The library never sums a figure it must say, so "Other" is a slice the app makes: its `value` the sum of what it holds, its `valueLabel` and `shareLabel` the app's strings, its `description` what it holds ("12 more categories"), and `isOther: true`.
3. **`isOther` pins slate** and ignores `color`. It is expected last; given elsewhere it warns once and draws where given, since the chart never re-sorts.
4. **More than four peers** warns once; the fifth and later peers draw in slate, as BarChart's sixth series does, each still named, in the legend and in the table, so nothing is lost, and the warning says to fold.
5. **What to fold,** in the docs: keep the four largest peers (or the four the reader asked about) and fold the rest when there are five or more; fold any slice under about 3% even when there are fewer, since at `lg` a 3% slice is about 18px of arc at the ring's middle; never fold the slice the page is about.
6. **The order,** in the docs: largest first from the top, "Other" last. The chart draws the app's order.

### 8.6 Pointer and legend

- **Hit area.** A mouse or pen over the ring activates the slice whose angle holds the pointer, read from `getBoundingClientRect` and the pointer's angle about the centre in the handler, within a band from 12px inside the hole's edge to 12px outside the ring, so a thin slice is hit by its angle across the whole band; in a gap, the nearer slice. Over the hole's middle, nothing. Leaving clears unless a slice has focus; a touch holds until a press outside. A pointer does not move focus.
- **Emphasis.** While a pointer holds a slice, the others draw at 40% opacity, BarChart's rule; under the keyboard nothing dims, the focus ring marks the slice.
- **The legend.** A list, beside the ring when `legend="auto"` and the chart's box is at least 30rem (`lg`) or 26rem (`md`), under it otherwise or with `legend="below"`. Each item is a four-column row: the 12px key (Meter's swatch, textured with the chart), the label in ink (wrapping, never truncated) with the description under it in slate, the value at 500 in ink, tabular, and the share in slate, tabular; the values and shares align in their columns across items. In the slices' order. A pointer over an item activates its slice, and a press on it presses the slice (or follows its link); items are not focusable, since the slices are.

### 8.7 The table

The shared `ChartTable`: a row per slice with its label as the row header, a value column (`labels.value`), a share column (`labels.share`) when any slice has a `shareLabel`, and a footer row (`tfoot`) with `labels.total` as its header and the total's `valueLabel`, the table's footer row added to the foundations (section 9). Rows in the slices' order. The toggle and the `noscript` copy as every chart's.

### 8.8 Empty, loading and error

The figure keeps its size in every state.

- **Loading.** A `span.skeleton` the ring's size, round, cut to a ring by a radial `mask` (transparent inside the hole's radius, opaque to the edge), with Skeleton's pulse; four skeleton lines in the legend's place; `aria-busy`, and the status says `statusLabels.loading` once. No centre text, toggle or table.
- **Empty.** The ring draws as Gauge's track, `--color-frame`, whole; the legend's place holds `statusContent` or `p.donut-chart-message` with `statusLabels.empty` in slate; the centre is empty. A ready chart whose values are all zero, or with no slices, draws the same.
- **Error.** The same, with `statusLabels.error` in `--color-error`.

### 8.9 Look and CSS

In `charts.css`, under `.donut-chart`.

- **Slices.** `fill: var(--donut-chart-color)` by `data-color`, full strength; `stroke: var(--chart-surface); stroke-width: 2px`; `print-color-adjust: exact` on the figure.
- **The layout.** The figure is an inline-size container with `contain-intrinsic-inline-size: 20rem`; `div.donut-chart-chart` is a grid: the ring and the legend side by side (`grid-template-columns: auto minmax(0, 1fr)`, a `--spacing-separate` gap) from the container widths of section 8.6, else one column with the ring centred and the legend under it at `--spacing-peer`.
- **Contrast.** Each slot and slate against Lifted, the canvas and Float as the palette record; the total and value in ink, labels and shares in slate, gated as text (ink 17.84 and 17.42 on Lifted); the empty track in frame is a cue (1.28 light, 1.43 dark), as Gauge's track, with the words carrying the state; the focus ring is the token's. The ring check of section 6.2 joins `palette.test.js`; no new contrast pair.
- **Weights.** 450 for labels and descriptions, 500 for the total, values and the active value.
- **Density.** Nothing changes in compact.

### 8.10 Forced colors

An svg keeps its author's colors, so the block names them, Gauge's rule: slices `CanvasText` with textures forced on, slot 5 `GrayText`; the gaps the system background (`canvas`, through `--chart-surface`); patterns' stripes `CanvasText` over `canvas`; the focus ring and the active slice `Highlight`; the empty track `GrayText`. The svg takes `forced-color-adjust: none` so the named colors hold; the centre and legend are HTML and repaint by themselves, their keys following their slices.

### 8.11 Right to left

The ring runs counter-clockwise from the top (section 8.3); Arrow Right and Left are mirrored, Up and Down are not; the legend sits at the ring's inline end (its left); figures are the app's strings in their isolates; a Persian page passes Persian digits, a Persian `shareLabel` ("۳۸٪") and Persian `labels`.

### 8.12 Corners

Slices have square corners in every shape: a slice is a share of a circle with a gap on each side, not a bar growing to a value, and a rounded corner on a thin slice would eat its angle (open question 15). The focus ring is concentric with the slice by construction (section 8.4). The legend keys take `--radius-micro`, Meter's. The ring is round and sits well inside a Card's padding, so no corner of it lies within the card's curve; in a Card the toggle moves down by the corner inset, the shared rule. The concentric audit runs every story in three shapes.

### 8.13 Container responsiveness

At 320px in a Card (a 280px box), `lg`'s 224px ring fits and the legend falls under it; `md` fits two to a 320px row of a TileGrid. Nothing scrolls sideways; the legend's label column wraps. A docs e2e checks 320px.

### 8.14 Server rendering

A client part (`'use client'`), no React Aria. On the server it renders the final picture: every slice, gap and pattern, the centre's total, the legend with values and shares, the hidden table with its footer, the toggle, the status host, the `noscript` copy and the links. No `Intl`, no `window`, no measurement; pattern and cell ids from `useId`. After mount it sets the first slice's tab stop. It joins `server-render.test.tsx` and the hydration suite as AreaChart does.

### 8.15 How others do it

| System | Centre | Other and small slices | Keyboard and screen reader | Table | What this spec takes |
| --- | --- | --- | --- | --- | --- |
| IBM Carbon Charts | A centre label with the total (to verify) | Not built in (to verify) | Limited (to verify) | "Show as table" | The total in the hole; the table control |
| Shopify Polaris Viz | `DonutChart` with a total and a comparison in the hole; a legend with values beside it (to verify) | Not built in (to verify) | Focusable legend (to verify) | Not built in | The legend with values beside the ring |
| Recharts | `Pie` with `innerRadius`; `paddingAngle` for gaps (to verify) | None | An accessibility layer (to verify) | None | Gaps between slices |
| Highcharts (accessibility module) | Through a label (to verify) | None | Arrow keys between slices, each announced (to verify) | Data table export | Per-slice focus, arrows in order |
| Visa Chart Components | Pie and donut (to verify) | Grouping small slices (to verify) | Arrow keys between marks, instructions (to verify) | A data table beside every chart; textures | The table and textures as the backup channel |
| Apple Swift Charts | `SectorMark` with `innerRadius` and `angularInset` (to verify) | None | Audio graphs and VoiceOver per sector (to verify) | | The angular inset as the gap |
| GOV.UK and the UK Government Analysis Function's guidance (to verify) | Advises against pie and donut charts for comparison | | | | Values and shares written beside the ring, so no reader depends on an angle |
| Material Design 3 | No chart components (to verify) | | | | Nothing |

## 9. The foundations' additions

| Module | Change | Proof |
| --- | --- | --- |
| `positions.ts` (new) | `xPosition` and `positionsWithData` moved from `line-chart/geometry.ts` | LineChart's tests and 40 baselines unchanged |
| `stack.ts` (new) | `stackBySign` moved from BarChart; AreaChart takes the positive half | BarChart's stacked tests and baselines unchanged |
| `texture.ts` (new) | `slotOf` moved from BarChart; the slot rule written once | The same |
| `ChartPatterns.tsx` (new) | The svg pattern set (45, 135, both) for an unstretched svg, ids from `useId` | DonutChart's tests |
| `ChartTable.tsx` | An optional `footer` row (`{ header, cells }`) in a `tfoot` | Its tests gain the footer; LineChart's and BarChart's tables unchanged |
| `ChartLegend.tsx` | `ChartBlock` grows to `'area-chart' | 'donut-chart'`; items gain optional `value`, `share` and `description` cells for the donut's list | The same |
| `color.ts` | `AreaColor` and `DonutColor` as `Extract<ChartColor, ...>` | Type tests refuse `ink`, `gain` and the reserved names |
| `core/scripts/palette.js` | `ringNeighbours`, `ringFailures`, `DONUT_SLOTS` (the ring order) | `palette.test.js` per section 6.2 |
| `charts.css` | Shared selector lists grow to the two new blocks | No existing baseline changes |

Each move is its own commit, with the moved code's tests and the charts' baselines passing untouched and the size entries within 0.1 kB, before AreaChart starts.

## 10. Accessibility

- **Roles and names.** AreaChart: a `figure` named by the app, a plot `group` with `aria-roledescription`, values `img` (or links) named by their cells, a `table`, a `status`. DonutChart: the same with slices, the plot described by the total.
- **Focus never falls to the body.** The active mark resets to the first stop when the data's keys change (AreaChart's `xLabels`, DonutChart's slice labels), so focus never rests on a mark that is gone; a state change with focus in the chart moves focus to the figure's toggle when one remains, or to the figure (with `tabIndex={-1}`), BarChart's rule; each is a test reading `document.activeElement`.
- **Never color alone.** Each part's name, legend label, readout line and table row; textures one prop away and forced on in forced colors; the total and every share in words.
- **Reserved colors.** None in either type; `css.test.js` fails any chart rule that reads a reserved token.
- **Targets (2.5.8).** The column and band (area) and the angular band (donut) are the hit areas; any link target under 24px has its equivalent in the table.
- **Axe** passes in light and dark for every story, including active and textured states.
- **Screen readers.** Not yet verified with VoiceOver, NVDA and TalkBack (owner action 1); the names carry everything without the role descriptions (insights risk R3).

## 11. Decided here

1. Phase 6 finishes as one batch, 12, AreaChart then DonutChart, with the foundations' moves first; AreaChart can ship alone if the donut slips.
2. AreaChart stacks only: one to five series from the baseline in series order, no overlap, no 100% layout, no negatives (drawn as zero with a warning), straight segments, a `null` a gap across the stack.
3. AreaChart's layers are full-strength palette fills in the stack order, separated by 2px surface edges; one unpinned series takes LineChart's ink line and wash; a pinned one draws as a one-layer stack.
4. AreaChart's fills are HTML clipped by `polygon()` in percent; its gridlines and edges stay in the stretched svg.
5. Both charts take BarChart's roving focus: one tab stop that is the active mark, marks `img` or links named by table cells, no live region.
6. AreaChart's keys: Left and Right along time, Up and Down through the stack, Home, End, Page by seven, Escape; the readout is LineChart's float panel; nothing dims under the pointer.
7. DonutChart draws at most four peers in the ring order violet, teal, olive, magenta, and "Other" in slate; the app folds and labels "Other"; past four peers, slate and a warning.
8. Slices never touch: 2px of the surface between them; the failing rings of section 6.2 are recorded, not gated, and the ring check joins `palette.test.js`.
9. DonutChart's total is required and written in the hole; an active slice's figures replace it until Escape or the pointer leaves.
10. DonutChart's sizes are fixed, 160px and 224px, one user unit one pixel; slices have square corners; the focus ring is a drawn path at the token's width and offset.
11. DonutChart's legend lists label, value and share, beside the ring from 30rem (26rem at `md`) of its own box, under it below; it is hidden from assistive technology.
12. DonutChart's keys: Right and Down next, Left and Up previous, Left and Right mirrored in right to left, Home and End; the ring runs counter-clockwise in right to left.
13. `AreaColor` and `DonutColor` hold the four slots and slate only.
14. Textures off by default, always on in forced colors, in BarChart's slots; HTML gradients for the area, svg patterns for the donut; 45 and 135 swapped under right to left so the flip keeps each slot's angle.
15. Links per mark as BarChart's: anchors before hydration, `navigate`, table cells linked, `onValuePress` and `onSlicePress`.
16. States as BarChart's: a skeleton in the chart's shape, the empty track or gridlines with words, the error words in the error color.
17. No new tokens. `--area-chart-color` and `--donut-chart-color` are component custom properties; 160px, 224px, 26rem and 30rem are literals in `charts.css`.
18. Both charts start with `'use client';` and import nothing from React Aria; the moved foundations keep their directives as they were.
19. One release: charts minor; core and react minor for `charts.css`.

## 12. Testing

- **Core.** `charts.css` stays tokens only, in its layer, with its forced-colors block; `css.test.js` fails a chart rule reading a reserved token or a `color` declaration reading a chart token; the ring check in `palette.test.js` (section 6.2).
- **Charts (Vitest, jsdom).** Foundations: each moved module's tests unchanged; the footer row; the pattern set's ids. AreaChart: stacking and the domain from sums; a negative drawn as zero with its warning and its string kept; a partial `null` warning and the gap; a lone position's columns; the polygons' percentages; pinned and unpinned single series; colors by place and by pin; six series warning; the keys table, including no move at an edge and no prevention for Up and Down with one series; names from cells; Escape stopped; links before hydration and through `navigate`, modifier clicks left to the browser; `onValuePress`; the states with `aria-busy` and the status's one word; the toggle keeping focus. DonutChart: angles, the least slice, a whole ring, a negative warned, one slice warned; ring-order colors, pins, `isOther` as slate and its warning when not last, a fifth peer warned and in slate; the centre at rest and active, Escape restoring it; the focus ring path's geometry (its radii and edges 3px out); the keys and their mirroring; names from cells including the share; the legend's place by container width; links and `onSlicePress`; the states. Server suites for both.
- **Storybook.** Section 13's stories in the four theme and shape modes and at 375px, compact where tagged; plays in three engines for the keys, the pointer's band, the focus ring drawn round the focused slice, the touch hold, links, and Escape in a Dialog; a play reads each mark's computed name in three engines (insights risk R4). The concentric audit on every story. A story renders 366 positions by five series to bound the area's cost (risk R2).
- **Docs e2e.** Both pages at 320px and 375px with no sideways scroll; forced colors on a textured stack and a ring; scripts off showing the table; the recipe at 375 and 1280.

## 13. Docs, stories and design record

- **Pages.** `charts/area-chart` (leading with "A total and its parts", then "Order and Other", "Textures", "Links", "Area, line or bar"), `charts/donut-chart` (leading with "Shares in words, not angles", then "Folding into Other", "The total", "Colors in a ring", "Links"). Each with Usage, Props, Accessibility with its Keys table, and Design rules. `line-chart` links AreaChart; `bar-chart` links both; the theming page's chart palette section gains the ring order.
- **Recipe: Composition,** on the donut page: a Card "October" with a DonutChart of spending by category (four and "Other") beside an AreaChart of the same categories by day, both pinned to the same colors so a category is one color across both, with links to a transactions route; the server component computing the fold and formatting every string.
- **Stories:**
  - `Charts/AreaChart`: `Default` (four and "Other"), `OneSeries`, `PinnedAlone`, `Textured`, `Gaps`, `Active`, `Linked`, `Loading`, `Empty`, `Error`, `InCard` (density).
  - `Charts/DonutChart`: `Default` (four and "Other"), `Few` (two peers), `Medium`, `LegendBelow`, `Textured`, `Active`, `Linked`, `Loading`, `Empty`, `Error`, `InCard` (density).
  - `Pages/Composition` (density). `rtl`: `AreaChart`, `DonutChart`. No-visual: `ManyPositions` (366 by five), `InAFlexRow` for both.
- **Design record.** Appendix B: "AreaChart" (the stack, the clipped fills and why, the edges, the textures under a flip, the keys, the states) and "DonutChart" (sizes, the sector, the least slice, the gaps, the drawn focus ring and its geometry, the centre, the Other rule, the legend), each before it is built; "Chart palette" gains "In a ring" with section 6.2's table and the ring order.

## 14. Risks

- **R1. `clip-path: polygon()` at the browser floor.** Percent polygons are supported in the three engines the library targets (to verify the versions), and an engine that fails would draw full rectangles. Mitigation: the plays compare a layer's painted pixels against its polygon in three engines; the fallback is svg fills with textures dropped outside forced colors, recorded as a correction.
- **R2. Many stops.** 31 positions by five series is 155 focusable spans and 155 table cells; a year of days is 1,830. Mitigation: the docs cap AreaChart at about 90 positions and point to LineChart past that; the `ManyPositions` story bounds the cost; a development warning over 120 positions.
- **R3. Focus on svg elements.** Focusable `g` and svg `a` elements with roving `tabIndex`, and `:focus-visible` on them, vary by engine (to verify Safari). Mitigation: the plays focus every slice in three engines and read `document.activeElement`; the fallback is an HTML button per slice laid over its arc's middle, named the same.
- **R4. Two readouts.** AreaChart's float panel and DonutChart's centre are different places for the same job. Mitigation: each is where its chart has room; the docs show both; the record says why.
- **R5. The ring's recorded failures.** Four peers without "Other", and two or three with "Other" in light, fall under a floor. Mitigation: the gap, the legend's words, each slice's name, the table, textures one prop away, and the docs' folding advice; the test pins the recorded figures so a token change is seen.
- **R6. A wide total.** `nowrap` lets a long figure overflow the hole. Mitigation: the docs' compact figures, a story with the widest, and `md` recommended only for short totals.
- **R7. The refactor.** Moving LineChart's and BarChart's helpers could change them. Mitigation: each move its own commit with their tests and baselines unchanged and sizes within 0.1 kB.
- **R8. Texture angles under a flip.** Swapping the 45 and 135 gradients and patterns under right to left depends on the `dir` attribute the flip reads. Mitigation: the right-to-left stories baseline both charts textured; `dir="auto"` sets neither, as the CSS looks past it.
- **R9. Readers who compare angles anyway.** Mitigation: every share in words in the legend and the table; the docs prefer BarChart when exact comparison matters.
- **R10. Sample content.** The recipe's categories and figures must not echo the first consumer's data. Mitigation: invented figures; the repo's public check.

## 15. Open questions

Each has a recommended answer.

1. **The split.** Recommended: one batch, 12, AreaChart then DonutChart, about 128 baselines. Alternative: 12a AreaChart and 12b DonutChart as two releases, each smaller, the donut's ring check later.
2. **Stacked only.** Recommended: AreaChart always stacks. Alternative: a `layout="overlap"` with see-through fills, which mixes colors into new ones and hides the lower series.
3. **One series.** Recommended: unpinned, LineChart's ink line and wash; pinned, a one-layer stack in its color. Alternative: always a full fill in `chart-1`.
4. **A 100% stack.** Recommended: not now; a later `layout="expand"` when a consumer asks for shares over time. Alternative: add it now, with the app's percentage labels per position.
5. **How fills are drawn.** Recommended: HTML clipped by `polygon()`, so textures keep their exact stripes. Alternative: svg paths, simpler, with textures only possible in an unstretched svg, so none outside forced colors.
6. **Negatives in an area.** Recommended: drawn as zero with a warning; signed series belong to LineChart or BarChart. Alternative: a diverging stack by sign, BarChart's, which folds over itself where a series changes sign.
7. **A partial null.** Recommended: a gap across the whole stack with a warning. Alternative: a partial `null` drawn as zero, quieter but a guess.
8. **AreaChart's focus model.** Recommended: BarChart's per-value roving focus. Alternative: LineChart's one plot with a live region, one stop per position, the parts read together.
9. **Dimming under the pointer.** Recommended: none for areas, the other layers are context. Alternative: BarChart's 40% on the other layers.
10. **The donut's colors.** Recommended: the four slots and slate only, in the type. Alternative: allow `ink` for one highlighted share against the rest, which is a Gauge's job.
11. **Who makes "Other".** Recommended: the app folds and labels it; `isOther` pins slate. Alternatives: a `maxSlices` prop where the library folds the geometry and the app passes only the label and figure strings; or an exported `foldOther` helper returning numbers for the app to format.
12. **The donut's slot order.** Recommended: violet, teal, olive, magenta, then slate, which passes the five-slice ring in both modes. Alternative: the stack order everywhere, one order for both charts, accepting magenta beside teal at 3.7 for color-blind readers in a dark four-slice ring.
13. **The centre while active.** Recommended: the active slice's figures replace the total until Escape. Alternatives: the total stays and LineChart's float panel shows the slice; or the total stays and nothing else shows, the legend being enough.
14. **Textures by default.** Recommended: off, on in forced colors, as BarChart. Alternative: on by default for the donut, since its ring has recorded weak pairs.
15. **Slice corners.** Recommended: square in every shape. Alternative: `--radius-micro` in Rounded and Soft, as a bar's data end, which eats a thin slice's angle.
16. **A pie.** Recommended: never; the hole holds the total. Alternative: `innerRadius` 0 as an option.
17. **A half donut.** Recommended: not now; Gauge's semicircle covers one share. Alternative: a semicircle layout for a compact card.
18. **Labels on the arcs.** Recommended: never; the legend list. Alternative: labels outside the ring with leader lines, which need measuring.
19. **Fixed sizes.** Recommended: `md` 160px and `lg` 224px, exact pixels. Alternative: a fluid ring sized by its container, with strokes and patterns scaling.
20. **The legend for assistive technology.** Recommended: hidden; each slice's name and the table say the same. Alternative: a visible list read in browse mode, so the figures are read twice by a reader who tabs.
21. **Percentages.** Recommended: the app's `shareLabel`; the chart never formats. Alternative: the chart writes ASCII percentages from the values, which a Persian page would have to override.
22. **The least slice.** Recommended: gap plus 1px of arc, taken from the largest; a warning under 1%. Alternative: draw true angles and let tiny slices vanish into their gaps.
23. **Five peers or more.** Recommended: slate past four with a warning. Alternative: refuse to draw past five slices, showing the table instead.
24. **Keys in the donut.** Recommended: Right and Down next, Left and Up previous, Left and Right mirrored in right to left. Alternative: Right and Left only, in data order, never mirrored.
25. **The ring's direction in right to left.** Recommended: counter-clockwise, Gauge's rule. Alternative: clockwise everywhere, as a clock face.
26. **Charts' version.** Recommended: 0.3.0 now, and 1.0.0 in the next charts release with no API change once the screen reader pass is done; it stays outside core's fixed group, with its core peer a caret on 1.x. Alternatives: 1.0.0 now, finishing phase 6; or join the fixed group at core's next minor.
27. **The parent spec's "on Recharts".** Recommended: amend the parent spec's sections 4 and 7 to "drawn in SVG and HTML by the library, no chart dependency", recording the home spec's ruling. Alternative: leave the parent spec as written and let the specs since supersede it.

## 16. Size budget

Measured as the others, with React ignored. Today's limits: `{ LineChart }` 5 kB, `{ BarChart }` 8 kB, `{ LineChart, BarChart }` 9 kB.

| Entry | Budget | Reason |
| --- | --- | --- |
| `{ AreaChart }` | 7 kB | The foundations (shared with LineChart), the stack, polygons, the edges, the stops and links, the readout; estimated at 6 to 6.5 kB, rounded up plus 0.5 kB |
| `{ DonutChart }` | 6.5 kB | The sector geometry, the patterns, the drawn focus ring, the centre, the legend's cells, the stops and links; the foundations counted, since an app may import only this |
| `{ LineChart, AreaChart }` | 9 kB | A new entry: the time charts together, the shared code once |
| `{ LineChart, BarChart, AreaChart, DonutChart }` | 16 kB | A new entry: the whole package's charts |
| `{ LineChart }`, `{ BarChart }` | Unchanged | The moves may not grow either by more than 0.1 kB |

The CSS adds about 5 kB to `styles.css` before compression: AreaChart about 2.5 kB and DonutChart about 2.5 kB in `charts.css`, the shared selector lists keeping no rule written twice. A part over its budget is reported with the number, and the limit follows the rule: the measured entry rounded up to the next 0.5 kB, plus 0.5 kB.

## 17. Baseline estimate

Each visual story is baselined in five modes (Rounded light, Rounded dark, Soft light, Square light, Rounded light at 375px), and a story tagged `density` adds compact, six.

| Group | Visual stories | Of them with compact | Baselines |
| --- | --- | --- | --- |
| AreaChart | 11 | 1 | 56 |
| DonutChart | 11 | 1 | 56 |
| Pages/Composition | 1 | 1 | 6 |
| Right to left | 2 | 0 | 10 |
| **New** | **25** | **3** | **128** |

Existing baselines: none should change. LineChart's and BarChart's are the foundations' proof and must stay byte-identical; the shared selector lists draw the same values. Any change to an existing baseline is investigated before it is committed, and every new one goes through `pnpm --filter @snapshot-ui/storybook visual:docker`.

## 18. Release

- **Changesets.** `@snapshot-ui/charts`, minor: `area-chart.md` (AreaChart and its types: `AreaChartProps`, `AreaSeries`, `AreaValue`, `AreaColor`, `AreaChartLabels`), `donut-chart.md` (DonutChart and its types: `DonutChartProps`, `DonutSlice`, `DonutTotal`, `DonutColor`, `DonutChartLabels`). `@snapshot-ui/core` and `@snapshot-ui/react`, minor (fixed group): `charts-area-donut.md` (the `charts.css` rules); `palette.js`'s ring check is a test script and ships nothing.
- **Versions,** if nothing else releases between: core and react 0.18.0 and charts 0.3.0 with its core peer at `^0.18.0`; before 11a, core and react 0.17.0 and charts 0.3.0 with its peer at `^0.17.0`. All 0.x (section 19); charts 1.0.0 is taken up in the final 1.0 batch.
- **The core peer.** Charts' peer is `workspace:^`, a caret on core's version at release. While core is 0.x a caret accepts only its own minor, so every core minor until 1.0 still needs a charts patch moving the peer, as since batch 3a. Once core is 1.x a caret accepts every later 1.x minor, and that chore ends.
- **Release note, short:**
  - Upgrade `@snapshot-ui/charts` with core; charts 0.3.0 needs core 0.18 (or 0.17) for its CSS.
  - AreaChart: a total and its parts over time, stacked, up to five series, the fifth your "Other"; values zero or more; every figure and total your string.
  - DonutChart: at most four shares and your "Other" (`isOther`), a required `total` written in the hole, `shareLabel` your percentage string; the chart never sums, sorts or formats.
  - Pin `color` when the same categories appear in a stack and a donut, so each keeps one color; the donut's default order differs from the stack's on purpose (section 6.2).
  - `hasTexture` for a second channel; always on in forced colors.
  - `href` on a value or slice, and `navigate` from your router.
  - Pass `labels` (all of them) and `statusLabels` on a Persian page, with Persian digits in every string.

## 19. Owner rulings (owner, 2026-10-20)

The owner approved this spec on 2026-10-20 and took every recommendation of section 15, all 27, as written. Each ruling names the open question it settles.

**Versions.** 1.0 ships after phase 7 (the templates spec's ruling 1.0), so this batch's releases are 0.x minors: if nothing else releases between, core and react 0.18.0 and `@snapshot-ui/charts` 0.3.0 with its core peer at `^0.18.0` (0.17.0 and `^0.17.0` if it ships before 11a). Sections 2 and 18 are written to match.

1. **The split** (question 1). One batch, 12, AreaChart then DonutChart; AreaChart may ship alone if the donut slips.
2. **Stacked only** (question 2). AreaChart always stacks; no overlapping areas.
3. **One series** (question 3). Unpinned, LineChart's ink line and wash; pinned, a one-layer stack in its color.
4. **A 100% stack** (question 4). Not now; a later `layout="expand"` when a consumer asks.
5. **How fills are drawn** (question 5). HTML clipped by `polygon()`, so textures keep their exact stripes.
6. **Negatives in an area** (question 6). Drawn as zero with a warning; signed series belong to LineChart or BarChart.
7. **A partial null** (question 7). A gap across the whole stack, with a warning.
8. **AreaChart's focus model** (question 8). BarChart's per-value roving focus.
9. **Dimming under the pointer** (question 9). None for areas.
10. **The donut's colors** (question 10). The four slots and slate only, in the type.
11. **Who makes "Other"** (question 11). The app folds and labels it; `isOther` pins slate.
12. **The donut's slot order** (question 12). Violet, teal, olive, magenta, then slate.
13. **The centre while active** (question 13). The active slice's figures replace the total until Escape.
14. **Textures by default** (question 14). Off, and always on in forced colors.
15. **Slice corners** (question 15). Square in every shape.
16. **A pie** (question 16). Never.
17. **A half donut** (question 17). Not now.
18. **Labels on the arcs** (question 18). Never; the legend list.
19. **Fixed sizes** (question 19). `md` 160px and `lg` 224px.
20. **The legend for assistive technology** (question 20). Hidden; each slice's name and the table say the same.
21. **Percentages** (question 21). The app's `shareLabel`.
22. **The least slice** (question 22). The gap plus 1px of arc, taken from the largest; a warning under 1%.
23. **Five peers or more** (question 23). Slate past four, with a warning.
24. **Keys in the donut** (question 24). Right and Down next, Left and Up previous, Left and Right mirrored in right to left.
25. **The ring's direction in right to left** (question 25). Counter-clockwise, Gauge's rule.
26. **Charts' version** (question 26). 0.3.0 in this batch, outside core's fixed group. Charts 1.0.0 follows the screen reader pass with no API change; since 1.0 now comes after phase 7, that step is taken up in the final 1.0 batch (`docs/specs/2026-10-20-html-design.md`), and the core peer stays a 0.x caret until then.
27. **The parent spec's "on Recharts"** (question 27). Amend the parent spec's sections 4 and 7 to "drawn in SVG and HTML by the library, no chart dependency", in batch 12's plan's first commit.

## Owner actions

1. A VoiceOver, NVDA and TalkBack pass over both charts before charts 1.0.0, in or before the final 1.0 batch.
2. Ask the first consumer whether its later Insights views want an area over time, a donut of the month, or both, and which first.
3. Approve the amendment to the parent spec's "on Recharts" (open question 27).
4. Review the ring order's colors in the `DonutChart` stories in light and dark before the release.
