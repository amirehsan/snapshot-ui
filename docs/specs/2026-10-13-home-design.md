# Home: StatTile, Meter, Avatar, Sparkline and LineChart: design

Status: written for review on 2026-10-13. The four rulings in section 10.1 were taken by the owner on 2026-10-13; everything else is decided here and listed in section 10.2.
Parent spec: `docs/specs/2026-10-10-snapshot-ui-design.md`. This document pulls forward the phase 4 rows "StatTile", "Avatar, AvatarGroup" (Avatar only) and "ProgressBar, Meter" (Meter only), and a first slice of phase 6, "Charts" (a line chart and a sparkline). It answers batch 2 of the first consumer's roadmap, its Home page. The design authority remains `docs/design-system.md`.
Released before this: batch 1, `@snapshot-ui/core` and `@snapshot-ui/react` 0.2.0 (the overlays, compact density and the shell). Section 2 lists what this document takes from it.

## 1. Goal

Give an app's Home page its figures: a tile for one headline number and its change, a meter for spending against a budget, an avatar for a person, a merchant or a bank, a sparkline for a tile's trend, and a line chart for the month. Ship them as the batch 2 minor release.

Build order, which is also the plan's order:

1. **Avatar** (section 5): no dependencies, and the smallest.
2. **StatTile** (section 6): takes a sparkline in a slot, so it ships before the sparkline exists and is tested with any node there.
3. **Meter** (section 7).
4. **Sparkline** (section 8), the first chart part, and the chart foundations it brings: the scale helpers, the series colors and the chart tokens.
5. **LineChart** (section 9), on the same foundations, with the interactive layer and the table view.

Out of scope, each recorded where it is deferred:

- `AvatarGroup` (parent spec, phase 4). An app stacks avatars itself until a page needs the overlap rule.
- `ProgressBar` (parent spec, phase 4). The Meter is a measurement against a range; a progress bar is a task finishing, with different semantics, and no Home part needs one.
- Bar, area and donut charts, and the categorical chart palette (parent spec, phase 6). Batch 2 draws at most two series, both from the existing ink and slate tokens, so it needs no categorical palette (section 8.3).
- Number and date formatting. Nothing in the library formats: every figure, axis label and tooltip value is a string the app passes, already formatted for its locale (the consumer's rule).
- Live updating and animation of values. Every part renders what it is given, with no transition on the data.

## 2. Depends on

| From batch 1 or earlier | Used here as |
| --- | --- |
| The numeral steps, `--text-numeral` and `--text-numeral-sm`, and the classes `copy-numeral` and `copy-numeral-sm` (tabular, `nowrap`, left to right with the sign kept in place) | The StatTile's value (section 6.3) |
| `--color-gain` and `--color-warning`, with their meaning rules | The tile's change line (gain), the meter's over-limit state (warning) |
| `Tooltip` and `TooltipTrigger`, React Aria's positioned tip with the library's delays | Not used for chart points: a chart point's readout is its own element (section 9.2), because a tooltip on 31 focusable points would be 31 tab stops |
| `Card`'s surface: Lifted, `--radius-stadium`, `--spacing-card` | The StatTile's surface (section 6.3) |
| `--spacing-card` and `data-density` | A tile's padding follows density with no new token |
| `RouterProvider` and React Aria's `Link` | A StatTile with `href` (section 6.2) |
| `AriaName` in `packages/react/src/utils/accessible-name.ts` | The required names of Meter, Sparkline and LineChart |
| `present()`, `cx`, `composeRenderProps` | As everywhere |

## 3. What the consumer needs

The consumer's Home page, from its roadmap:

- **StatTile:** a label, a hero-size value, a change line with an arrow and a word (never color alone), a caption, an optional sparkline slot, and the whole tile as a link.
- **Meter:** several segments in one bar (spent, and held, hatched), a marker for where spending would be today, an over-limit state, and label and value text.
- **Avatar:** an image with an initials fallback at 24, 32 and 40px, squarish for merchant and bank logos.
- **Line and sparkline charts:** SVG rendered on the server, points reachable by keyboard with tooltips, a table alternative, and labels passed in already formatted.

And its rules for every part, unchanged from batch 1: `'use client'` only on interactive parts; no `Intl` formatting and no `window` at render, and no first-paint measurement; no external requests or injected scripts; light and dark, all three shapes, right to left (the app has a Persian guide); WCAG 2.2 AA including 2.5.8; anything that navigates goes through `RouterProvider`; everything exported from the react index, with the CSS in `core/styles.css`.

## 4. Approach

**Figures are strings.** Every number the reader sees arrives as a formatted string. Where a part also needs the number to draw (a meter's segment, a chart's point), it takes both: `value: number` to place the mark and `valueLabel: string` to say it. The library never formats, so a Persian page, a currency and a compact "12.9K" are the app's, and the server's HTML is final.

**Draw without measuring.** No part reads its own width. A chart's SVG has a fixed `viewBox` and stretches to its container with `preserveAspectRatio="none"`, and every stroke carries `vector-effect: non-scaling-stroke` so a 2px line stays 2px at any width. Anything that must not stretch, a point's dot, a marker or a label, is an HTML element placed over the SVG by percentage. The geometry is computed by pure functions from the data alone, so the server's HTML is the final picture and the client adds only interaction.

**Color by meaning, not decoration.** Batch 2 needs no chart palette. One series is ink. A comparison series ("last month") is slate, in a thinner, recessive treatment, the emphasis form: one line is the story and the other is context. The change line is neutral unless it means money arrived (gain) or needs a look (warning). Red and green are never used for up and down: error means a failure and success means a save, and a rising spending line is neither.

**Interactive only where it must be.** Avatar, StatTile without a link, Meter and Sparkline are static: they render on the server with no client JavaScript. A StatTile with `href` is a React Aria link and so a client part. LineChart is a client part, because its points take focus and show a readout, but its SVG and its table render on the server with everything else.

**The table is the alternative, not an afterthought.** Every LineChart can show its data as a table, with the same strings, through a toggle under the chart (section 9.2). A reader who cannot use the plot loses nothing.

Rejected along the way:

- **A chart library** (Recharts, visx, Chart.js). Each measures its container on the client, renders nothing useful on the server, or brings its own tooltip and focus model. Two forms with at most two series are a few hundred lines of SVG and arithmetic.
- **`<canvas>`.** Not on the server, not in the accessibility tree, not in forced colors.
- **A tooltip per chart point.** Thirty-one points would be thirty-one tab stops. The chart is one tab stop with arrow keys (section 9.2).
- **Formatting helpers in the library** (`formatValue` callbacks). A function cannot cross from a server component to a client one, and formatting is the app's rule anyway.
- **A colored change line by direction.** "Down 12%" is good for spending and bad for income; the color would have to know which, and the reserved colors do not mean "good" and "bad".

## 5. Avatar

### 5.1 API

```ts
export interface AvatarProps extends Omit<HTMLAttributes<HTMLSpanElement>, 'children'> {
  /** The person's or the organization's name. Gives the initials and, unless `isDecorative`, the accessible name. */
  name: string;
  /** The image. When absent, or when it fails to load, the initials show. */
  src?: string;
  /** Override the initials derived from `name`, such as "WF" for a bank. One or two characters. */
  initials?: string;
  /** @default 'md' */
  size?: 'sm' | 'md' | 'lg';
  /** `circle` for a person, `square` for a merchant's or a bank's logo. @default 'circle' */
  shape?: 'circle' | 'square';
  /** The name is already beside it in text, so the avatar is hidden from assistive technology. @default false */
  isDecorative?: boolean;
  ref?: Ref<HTMLSpanElement>;
}
```

### 5.2 Behavior

- **Markup.** `span.avatar[data-size][data-shape]` with `role="img"` and `aria-label={name}`, or `aria-hidden="true"` when `isDecorative`. Inside, `img.avatar-image[alt=""]` while there is a `src` that has not failed, and `span.avatar-initials[aria-hidden="true"]` always, under the image, so a slow or failed image shows the initials and the layout never moves.
- **A failed image.** The image's `onError` hides it, which needs a client hook, so Avatar is a client part with one piece of state. On the server, and before hydration, the image draws over the initials; a broken image shows the initials as soon as the browser reports the error (the image is `opacity: 0` until it loads, through `onLoad`, so a broken-image icon never shows).
- **Initials.** `initials` when given; otherwise the first character of the first two words of `name`, by `Array.from` so a character outside the basic plane counts as one, uppercased with `toUpperCase()` (not locale-aware, which is enough for initials and needs no `Intl`). "Ada Lovelace" gives "AL", "Northwind" gives "N", and "علی رضایی" gives "عر". An app with a stricter rule passes `initials`.
- **No color per name.** The fallback is one neutral look for everyone (section 5.3). A color per name needs a categorical palette, which belongs to phase 6, and a color that identifies a person is a color carrying meaning that the name already carries.

### 5.3 Look and CSS

| Size | Box | Initials |
| --- | --- | --- |
| `sm` | 24px | 12px, weight 700 (the short-uppercase floor) |
| `md` | 32px | 14px, weight 500 |
| `lg` | 40px | 16px, weight 500 |

- **Shape.** `circle` takes `--radius-pill`, so it is a circle in Rounded and follows the shape axis elsewhere, as the parent spec says. `square` takes `--radius-micro` (6px), the nested-radius step for a small mark, so a logo reads as a tile and not a person.
- **Fallback fill and text.** `--color-bone` with `--color-ink` text: 16.76:1 in light and 15.36:1 in dark, measured.
- **Edge.** A 1px inset `--color-frame` ring over the image, so a white logo on a white card has an edge. It is a cue, not a boundary.
- **Forced colors.** The initials are `CanvasText` on `canvas` with a 1px `CanvasText` border; an image is shown as is.

## 6. StatTile

### 6.1 Anatomy

In order: the label, the value, the change line, the caption, and the trend slot. Only the label and the value are required.

```
OVERLINE LABEL
$1,284.50                 [ sparkline ]
↑ Up 12% from last month
Caption in slate
```

### 6.2 API

```ts
export interface StatTileChange {
  /** The arrow, and the word the app writes. */
  direction: 'up' | 'down' | 'flat';
  /** The whole sentence, formatted: "Up 12% from last month". It carries the meaning; the arrow repeats it. */
  label: string;
  /** Color only when the change means one of these. @default 'neutral' */
  tone?: 'neutral' | 'gain' | 'warning';
}

export interface StatTileProps extends Omit<HTMLAttributes<HTMLElement>, 'children'> {
  label: ReactNode;
  /** The figure, formatted. */
  value: ReactNode;
  change?: StatTileChange;
  caption?: ReactNode;
  /** A Sparkline, or any small drawing. Hidden from assistive technology unless it names itself. */
  trend?: ReactNode;
  /** Makes the whole tile a link. */
  href?: string;
  /** The heading level of the label, when the tile should be in the page outline. Omitted, the label is a `p`. */
  level?: 2 | 3 | 4;
  ref?: Ref<HTMLElement>;
}
```

- **The tile as a link.** With `href`, the root is React Aria's `Link` (`a.stat-tile`) and routes through `RouterProvider`. Its accessible name is the label, the value and the change, in that order, read from the content; the caption is in the link's description through `aria-describedby`. A tile with `href` is a client part; without it, the root is a `div` and the tile is static.
- **Nothing else is interactive inside a linked tile.** A link inside a link is invalid HTML, so a linked tile's slots must hold no links or buttons; a development warning says so once, in an effect, if a focusable element is found inside.
- **The change line.** `span.stat-tile-change[data-direction][data-tone]` holding `span.stat-tile-arrow[aria-hidden="true"]` (an arrow up, down, or a dash for flat, Lucide `ArrowUp`, `ArrowDown`, `Minus`) and the label. The arrow is not mirrored in right to left: up and down have no reading direction, and the dash is symmetric.

### 6.3 Look and CSS

- **Surface.** The Card's: Lifted, `--color-hairline` border, `--radius-stadium`, `--spacing-card` padding (32px, 20px in compact). A tile in a card steps down to `--radius-surface` by the same rule as a card in a card.
- **Label.** `--text-overline` (14px, 700, uppercase), slate, as the design document's token table says ("Uppercase column headers in tables and stat tiles").
- **Value.** `copy-numeral-sm` (32px, 500, tabular, `nowrap`, left to right), ink. The design document's guidance prefers proportional figures for a standalone value; the library's numeral record chose tabular for every numeral so tiles in a row align, and this spec keeps that.
- **Change line.** `--text-small`, slate for `neutral`, `--color-gain` for `gain`, `--color-warning` for `warning`, with the arrow at 16px in the same color. 8px under the value.
- **Caption.** `--text-small`, slate, 4px under the change line.
- **Trend slot.** At the inline end of the value's row, 96px wide and 32px tall at most, aligned to the value's baseline row. Below 360px of tile width it moves under the caption, by a container query on the tile (`container-type: inline-size`), not a viewport query, so a tile in a narrow column moves too.
- **As a link.** Hover is the 5% ink wash over Lifted inside `@media (hover: hover)`, press the same; the focus ring is the token ring outside the tile; cursor pointer. No lift or shadow on hover: the tile is a surface, not a button.
- **Forced colors.** The border becomes `CanvasText`; a linked tile's focus ring is `Highlight`.

## 7. Meter

### 7.1 API

```ts
export interface MeterSegment {
  /** In the meter's units, such as dollars. Segments stack in order from the start. */
  value: number;
  /** `fill` is solid ink, `hatched` is ink stripes: spent and held. */
  look: 'fill' | 'hatched';
  /** For the legend and the accessible value: "Spent", "Held". */
  label: string;
  /** Formatted: "$820.00". */
  valueLabel: string;
}

export type MeterProps = Omit<HTMLAttributes<HTMLDivElement>, 'children'> &
  AriaName & {
    /** The visible label, such as "Groceries". When absent, `aria-label` names it. */
    label?: ReactNode;
    /** The limit, in the same units. */
    max: number;
    segments: MeterSegment[];
    /** The visible value text and the accessible value: "$1,020 of $1,200". */
    valueLabel: string;
    /** Where spending would be today if it kept pace, in the same units. */
    pace?: { value: number; label: string };
    /** Draws a legend under the bar for the segments and the pace. @default false */
    hasLegend?: boolean;
    ref?: Ref<HTMLDivElement>;
  };
```

### 7.2 Behavior

- **Semantics.** `role="meter"` with `aria-valuemin="0"`, `aria-valuemax={max}`, `aria-valuenow` the segments' sum (capped at `max`, since a meter's value cannot pass its maximum), and `aria-valuetext={valueLabel}`, so a screen reader reads the app's sentence and never "85%". Named by `label` (through `aria-labelledby`) or by `aria-label`. This is the WAI-ARIA meter pattern written by hand, because React Aria's `Meter` takes one value and builds its own `aria-valuetext` from `Intl.NumberFormat`.
- **Static.** No state, no events: a server part with no `'use client'`.
- **Geometry.** Each segment's width is `value / max` of the track, stacked from the inline start, computed in render as percentages, so no measurement. Segments past `max` are clipped at the end.
- **Over the limit.** When the segments' sum is over `max`, the root carries `data-over`, every segment takes the warning color in its own look, and the app's `valueLabel` says so in words ("$1,340 of $1,200, $140 over"). The color is never the only signal: the words are required by the rule, and the docs say so.
- **Pace.** `pace.value / max` places a marker; `pace.label` ("Where you'd be today: $900") is the marker's legend entry and is appended to the accessible description through `aria-describedby`.
- **Legend.** With `hasLegend`, a row under the bar: a 12px swatch in each segment's look, its label and its value label, then the pace marker's key and label. Without it, the app writes its own text around the meter.

### 7.3 Look and CSS

- **Track.** 8px tall, `--radius-pill`, `--color-frame` (ink at 12%) as the unfilled remainder. Full width of its container.
- **Fill.** `--color-ink`. **Hatched.** Ink stripes 2px wide every 6px at 45 degrees on the frame color, a `repeating-linear-gradient` from tokens, so held reads as committed but not gone. Over the limit, both use `--color-warning` in place of ink.
- **Spacers.** A 2px gap in the surface color between two segments, drawn as a `box-shadow` inset on the segment's start edge in the surface color the meter reads from `--meter-surface` (default Lifted, the card surface it sits on most), so touching segments read as distinct without a stroke.
- **The ends.** The first segment's start and the last segment's end take the track's radius; inner joins are square.
- **Pace marker.** A 2px ink line 16px tall, centered on the track, with a 2px surface ring (the spacer rule), so it reads over both fill and track. It is HTML, placed by `inset-inline-start: calc(pace / max * 100%)`, so it mirrors in right to left with the segments.
- **Label row.** The label at `--text-small` weight 500, ink, at the start, and `valueLabel` at the end in `--text-small` slate with tabular figures, 8px above the bar.
- **Contrast**, measured over Lifted. The fill against the track: 13.88:1 in light and 12.19:1 in dark, far past the 3:1 a graphic needs. Warning against the track: 4.77:1 and 6.24:1. The track against the card is a cue (1.28 and 1.43) and not a boundary: the meter's extent is carried by the value text, which is required. The plan re-measures each with `contrast.js` and records them in Appendix B.
- **Forced colors.** The fill becomes `CanvasText`, hatched becomes `CanvasText` stripes on `canvas`, the track gets a 1px `CanvasText` border so its end shows, the over state keeps its words, and the pace marker is `Highlight`.
- **Right to left.** Every offset is logical, so the bar fills from the right. The hatch keeps its 45-degree angle in both directions: it is a texture, not an arrow.

## 8. Sparkline and the chart foundations

### 8.1 Package

Batch 2's two chart parts go in a new package, `@snapshot-ui/charts`, the package the parent spec names for phase 6, rather than in `@snapshot-ui/react` (section 10.1, ruling 1). It takes React as its one required peer and depends on `react-aria-components` only if a later chart needs it (React DOM was dropped as a peer when the package was built, because nothing in it imports `react-dom`); the few helpers it shares with the react package (`cx`, the `AriaName` type) are copied, not imported, so neither package depends on the other; its CSS ships in `@snapshot-ui/core` as `charts.css`, imported by `styles.css` like every other component file, so an app still loads one stylesheet.

### 8.2 Foundations

- **`scale.ts`**, pure: `linearScale(domain, range)`, `extent(values, { includeZero })` and `niceDomain(min, max)`, which rounds the y domain outward to clean steps. The app still writes the tick labels (section 9.1), so the library only chooses where the ticks go when the app does not.
- **`path.ts`**, pure: `linePath(points)` (straight segments, no curve smoothing, because a smoothed line invents values between points) and `areaPath(points, baseline)`.
- **Tokens.** None new for color. The chart parts read `--color-ink` (the series), `--color-slate` (a comparison series and axis text), `--color-divider` (gridlines) and the surface tokens. Two size tokens are not worth adding; the stroke widths are literals in `charts.css`.
- **Series colors.** At most two series in batch 2: the first is ink, the second slate. The validator in the data-visualization method is for categorical palettes and is not needed for two series drawn from gated text colors; phase 6 runs it when it adds a palette.

### 8.3 Sparkline API and look

```ts
export type SparklineProps = Omit<SVGAttributes<SVGSVGElement>, 'children'> &
  Partial<AriaName> & {
    /** The values, oldest first. */
    data: number[];
    /** Marks the last point with a dot. @default true */
    hasEndPoint?: boolean;
    /** Fills under the line with a 10% ink wash. @default false */
    hasArea?: boolean;
  };
```

- **Static and decorative by default.** An SVG with `aria-hidden="true"`, since its tile says what it means. Given an `aria-label` ("Spending, last 30 days, rising"), it becomes `role="img"` with that name.
- **Look.** A 2px ink line, round caps and joins, `vector-effect: non-scaling-stroke`; an optional area wash of ink at 10%; the end point an 8px ink dot with a 2px surface ring, drawn as HTML over the SVG so it stays round at any width. Default box 96 by 32px, stretching to its container's width when the app sizes it.
- **Domain.** The data's extent, not from zero: a sparkline shows shape, not magnitude. A flat line (all values equal) draws at mid-height.
- **Forced colors.** The line and the dot become `CanvasText`.

## 9. LineChart

### 9.1 API

```ts
export interface LinePoint {
  /** The y value, to draw. */
  value: number;
  /** The y value, formatted, for the readout and the table: "$84.20". */
  valueLabel: string;
}

export interface LineSeries {
  /** "This month", "Last month". Required: it names the series in the legend, the readout and the table. */
  label: string;
  /** One point per x position, aligned with `xLabels`. `null` is a gap, such as a future day. */
  points: (LinePoint | null)[];
}

export type LineChartProps = Omit<HTMLAttributes<HTMLElement>, 'children'> &
  AriaName & {
    /** One or two series. The first is the story, drawn in ink; the second is context, drawn in slate. */
    series: [LineSeries] | [LineSeries, LineSeries];
    /** The x positions' labels, formatted: "Oct 1", "Oct 2". */
    xLabels: string[];
    /** Which x labels the axis shows, by index. @default first, middle and last */
    xTicks?: number[];
    /** The y gridlines and their labels, formatted. When absent the chart draws no y labels and relies on the readout and the table. */
    yTicks?: { value: number; label: string }[];
    /** The y domain. @default from zero to the nice ceiling of the data */
    yDomain?: [number, number];
    /** Fills under the first series. @default false */
    hasArea?: boolean;
    /** The table toggle's labels. @default { showTable: 'Show as table', showChart: 'Show as chart' } */
    labels?: { showTable: string; showChart: string };
    /** Height of the plot in px. @default 240 */
    height?: number;
    ref?: Ref<HTMLElement>;
  };
```

### 9.2 Behavior

- **Markup.** `figure.line-chart` named by its `aria-label` or `aria-labelledby` (the app's heading), holding the legend (when there are two series), the plot, and the toggle row. The plot is `div.line-chart-plot` with the SVG (`aria-hidden="true"`) and an HTML overlay for the dots, the crosshair and the readout.
- **One tab stop.** The plot is a single focusable element (`tabIndex={0}`, `role="group"`, `aria-roledescription="chart"`, named by the figure). Focus lands on the last point with data, the most recent. Left and Right move one point, Home and End to the first and last, Page Up and Page Down by seven, skipping gaps; in right to left, Left and Right follow the drawn direction. Escape hides the readout until the next move.
- **The readout.** For the active x position: the x label, then each series' value label, values first and strong, the series named after it, as the method asks. It is announced through `aria-live="polite"` on a visually hidden copy in the plot ("Oct 12: This month $84.20, Last month $61.00"), so a screen reader hears each move without a tooltip per point. The visible readout is a small float panel (float surface, `--radius-surface`, `--shadow-float`, `--text-small`) placed above the active x, flipped inward near either end, with no React Aria overlay: it is part of the plot, not a portal.
- **Pointer.** Moving over the plot snaps to the nearest x and shows the crosshair, the dots and the readout; leaving hides them. A touch press does the same and keeps it until the next press outside. The hit area is the whole plot column for each x, never the 2px line.
- **The table.** A button under the plot, "Show as table", swaps the plot for a `table` with a caption (the chart's name), the x labels as row headers and one column per series, every cell the app's value label, and the button becomes "Show as chart". Both views render on the server; the toggle swaps which is visible with `hidden`. The table is the alternative for anyone, not only screen readers, so it is visible when chosen and not visually hidden.
- **Gaps.** A `null` point breaks the line; the readout says the series has no value there by omitting it, and the table's cell is empty.
- **Server.** The SVG paths, the gridlines, the axis labels, the legend and the table all render on the server from the props. The client adds the focus handling, the pointer and the readout. A chart with JavaScript off is a correct picture and a working table toggle is the one thing it lacks, so the table is shown under the plot by default when scripts are off (the toggle row renders a `<noscript>` note pointing to it).

### 9.3 Look and CSS

- **Plot.** Height 240px by default, full width. Gridlines at the `yTicks`, 1px `--color-divider`, solid. The baseline at the domain's minimum, 1px `--color-frame`. No vertical gridlines.
- **Lines.** The first series 2px ink, round caps and joins; the second 1.5px slate. Both `vector-effect: non-scaling-stroke`. The optional area under the first series is ink at 10%.
- **Axis labels.** `--text-small`, slate, tabular figures, HTML positioned over the plot: y labels at the inline start, above their gridline; x labels under the baseline at the `xTicks`. HTML, not SVG text, so they never stretch and they follow the page's font.
- **Crosshair and dots.** A 1px slate vertical line at the active x; an 8px dot per series in its color with a 2px surface ring.
- **Legend.** Two series only: a 16px line key in each series' color and stroke, then its label in `--text-small` ink, at the top inline start. One series has none; the chart's name says what is drawn.
- **Contrast.** Ink lines against Lifted and Float, and slate at 1.5px (5.49 light, 6.94 dark on float): both past the 3:1 of a graphic. The gridline is a cue, not a boundary.
- **Right to left.** The x axis runs from the inline start, so time flows right to left in a right-to-left page (section 10.1, ruling 3). The figures inside labels stay left to right.
- **Forced colors.** The first line is `CanvasText`, the second `GrayText`, the gridlines `GrayText`, the crosshair and active dots `Highlight`.
- **Reduced motion.** Nothing moves; the readout appears without a transition.

## 10. Decisions

### 10.1 Rulings taken by the owner

1. **Where the charts live:** a new `@snapshot-ui/charts` package for Sparkline and LineChart, as the parent spec's phase 6 names, with its CSS in core. Putting them in `@snapshot-ui/react` now was rejected, because phase 6 would then move the imports, a breaking change for the consumer.
2. **The table alternative:** a visible toggle under each chart that swaps the plot for a table (section 9.2). An always-present, visually hidden table was rejected, because it serves only screen readers and gives a sighted keyboard user nothing.
3. **Time in right to left:** the x axis follows the page's direction, so the newest point is at the left in the Persian guide. Keeping time left to right in every language was rejected.
4. **The change line's color:** neutral slate by default, `gain` only for money that arrived and `warning` only for a state that needs a look, never red or green for up and down (section 4). A `sentiment` prop mapping "good" and "bad" to success and error was rejected, because those tokens' meaning rules forbid it.

### 10.2 Decided here

1. Every figure is a string from the app; parts that draw also take the number.
2. No part measures itself: a fixed `viewBox` with `preserveAspectRatio="none"`, non-scaling strokes, and HTML for anything that must keep its shape.
3. Avatar: three sizes (24, 32, 40), `circle` on the pill radius and `square` on the micro radius, initials from the first two words or the `initials` prop, one neutral fallback look, `isDecorative` for an avatar beside its name, a client part for the failed-image state.
4. StatTile: the Card's surface, an overline label, the `numeral-sm` value, a change line with an arrow and the app's sentence, a caption, a trend slot that moves under the caption by container query, and the whole tile as a link through `href`.
5. Meter: the ARIA meter pattern by hand, the app's `valueLabel` as `aria-valuetext`, 8px track, ink fill and ink hatch, warning when over with words required, a pace marker with a surface ring, an optional legend.
6. Sparkline: static and decorative by default, named when given `aria-label`, the data's extent as its domain.
7. LineChart: one or two series (ink, then slate), one tab stop with arrow keys, a live readout instead of per-point tooltips, the crosshair on pointer, straight segments only, gaps for `null`, y labels only when the app passes them, and a table view.
8. No new color tokens. Stroke widths and the track height are literals in the component CSS.
9. `AvatarGroup`, `ProgressBar` and the other chart forms are out of scope.
10. One batch 2 minor release; size budgets to start at 1 kB for Avatar, 1.5 kB for StatTile, 1 kB for Meter, 1 kB for Sparkline and 4 kB for LineChart.

## 11. Accessibility

- **Names.** Avatar: its `name`, or hidden when decorative. StatTile: its text, read in order; as a link, the label, value and change, with the caption as its description. Meter: its label or `aria-label`, with the app's value text. Sparkline: hidden, or its `aria-label`. LineChart: the figure's name, required.
- **Keys, LineChart.**

  | Key | Does |
  | --- | --- |
  | Tab | Moves to the plot, one stop for the whole chart, then to the table toggle. |
  | Left, Right | The previous or next x position with data, in the drawn direction. |
  | Home, End | The first or last position with data. |
  | Page Up, Page Down | Seven positions back or forward. |
  | Escape | Hides the readout until the next move. |
  | Enter, Space on the toggle | Swaps the plot and the table. |

- **Never color alone.** The change line carries a word; the meter's over state carries words; two series carry a legend and the readout names each.
- **Targets.** A linked tile is far past 40px; the table toggle is a Button; a chart point is reached by keys, and by pointer through the whole column.
- **Axe** passes in light and dark for every story, with the table view open and closed.
- **Contrast** is listed in each part's look section and recorded in Appendix B with measured values.

## 12. Testing

- **Core (`css.test.js`, `contrast.test.js`).** Each new file is tokens only, in `@layer components`, with the hover rules in `@media (hover: hover)`, a forced-colors block and logical properties; the meter's hatch and gap read tokens; `charts.css` writes no color literal; the gated pairs each part draws are cited, and any new pair is added to `CONTRAST_PAIRS` with a test.
- **React (Vitest, jsdom).**
  - Avatar: initials from one, two and three words, from a right-to-left name, and from `initials`; `role="img"` and its name; `isDecorative` hides it; a failed image (fire `error`) leaves the initials and removes the image.
  - StatTile: the slots render only when present; the change line's arrow and word and its tone attribute; with `href`, a link whose name is label, value and change, routed through a `RouterProvider` spy; the nested-focusable warning fires once.
  - Meter: `role="meter"` and its four values, the sum capped at `max`; `data-over` when over; segment widths as percentages; the pace marker's position in left to right and right to left; the legend only with `hasLegend`.
  - Sparkline: hidden by default, `role="img"` with a label; a flat series draws at mid-height; paths match the pure functions.
  - LineChart: the SVG and the table render on the server with the app's strings; arrow keys, Home, End, Page Up and Page Down move the active point and skip gaps; the live region announces each move; the toggle swaps the views and its label; right to left reverses Left and Right.
  - The pure functions (`linearScale`, `niceDomain`, `linePath`, `areaPath`) with fixed inputs and outputs.
  - Server render: every part in `server-render.test.tsx`, static parts with no client directive.
- **Storybook.** Each part's states as stories, baselined in the four theme and shape modes, plus compact for StatTile and Meter; right-to-left stories for Meter and LineChart; play tests for the chart's keys and pointer and the table toggle (`no-visual`).
- **Docs e2e.** The completeness maps for each new page; a test that the chart's table toggle works with JavaScript and that the table is shown with JavaScript off; the forced-colors look of the meter and the chart.

## 13. Docs and release

- **Pages:** `avatar`, `stat-tile`, `meter`, `sparkline` and `line-chart`, each with Usage, Props, Accessibility with a Keys table where there are keys, and Design rules. A "Charts" group in the rail holds the last two, which live in the new package (ruling 1).
- **Design record:** a section per part in Appendix B, with every derived value and its reason, and the measured contrast pairs.
- **Changesets:** one per part, minor. `@snapshot-ui/charts` starts at 0.1.0 (ruling 1).
- **Release note for the consumer:** every figure is a formatted string; the meter's `valueLabel` must say "over" in words; the table toggle is on every chart; time direction in right to left, per ruling 3.

## 14. Risks

- **R1. `preserveAspectRatio="none"` and `vector-effect`.** Supported in every target browser, but a stretched SVG with non-scaling strokes is easy to break with a transform. Mitigation: the dots and labels are HTML, and a visual baseline at 375 and 1280 for each chart catches a distorted line.
- **R2. The live readout's verbosity.** A polite region announcing each arrow press can be noisy in some screen readers. Mitigation: announce only after focus has rested on a point for 150ms, and test with VoiceOver and NVDA before release (recorded as not yet verified until then, as batch 1's tooltip was).
- **R3. A new package's release.** Changesets, trusted publishing and the size limits need the new package added to each. Mitigation: the plan's chart task adds it first, before any component, with a dry-run publish in CI.
- **R4. Hatching in forced colors and print.** A gradient can disappear when backgrounds are not printed. Mitigation: the held segment also has a 1px inset border in its color, so it shows as an outlined segment when its stripes do not.
