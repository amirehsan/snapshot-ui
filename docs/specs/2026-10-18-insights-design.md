# Insights: BarChart, the chart palette and Prose: design

Status: written for review on 2026-10-18. Nothing here is approved yet. The owner's calls are the open questions in section 15, each with a recommended answer; everything else is decided here and listed in section 13.
Parent spec: `docs/specs/2026-10-10-snapshot-ui-design.md`. This document takes the next slice of phase 6, "Charts" (its bar chart and the chart palette derivation the parent spec requires before any chart with a palette is built), and adds Prose, which the parent spec does not list. It answers batch 6 ("Insights") of the first consumer's roadmap, agreed with the consumer as BarChart and Prose. The design authority remains `docs/design-system.md`.
Released before this: batch 5 ("Accounts"), `@snapshot-ui/core` and `@snapshot-ui/react` 0.8.0 (`docs/specs/2026-10-18-accounts-design.md`, on `docs/accounts-spec` at the time of writing), with the `@snapshot-ui/charts` patch that moves its core peer to `^0.8.0`. This batch is the 0.9.0 minor release of core and react and a minor release of `@snapshot-ui/charts`. Section 2 lists what it takes from batches 1 to 5.

## Summary for the owner

What this batch adds, in plain words:

- **BarChart**, the third chart. Bars standing up (months, categories) or lying down (merchants, budgets with long names), bars below a zero line for negative figures such as a month that cost more than it brought in, and bars split into stacked parts (spending by category) or set side by side (this month against last month). It shows figures on the bars when asked, a table of the same figures behind a button, a legend, and a loading, empty or error state in the chart's own space. A keyboard user moves from bar to bar with the arrow keys, and each bar says its category, its series and its figure.
- **The chart palette.** Four new colors for charts with several series: a teal, a violet, an olive and a magenta, each chosen to stay clear of the colors that already mean something (red for failure, green for success and money in, amber for warning, orange for consent and unsaved, blue for links), and checked for color-blind readers and for contrast in light and dark. A fifth series is slate, read as "Other". One series is still drawn in ink, and two series compared over time are still ink and slate, as the line chart draws them.
- **Prose**, a style for long-form text the app does not write by hand: a help article, a monthly summary, Markdown or a CMS's HTML. One class, `prose`, or the `Prose` wrapper, gives every heading, paragraph, list, link, quote, code block, table, image and rule the library's type scale and spacing, at a comfortable line length, in both directions and both color modes.
- **Under the hood**, the line chart's table, legend, readout, keys and naming move into shared pieces both charts use, with no change to the line chart a reader or an app can see.

Why: the consumer's next page is Insights, which explains where the money went over a month and a year, in charts and in a written summary.

What it does not add: area and donut charts, a bar that is a link or opens a detail on Enter, a 100% stacked bar, charts that switch orientation on their own, a small size of Prose, and a heading step between 14px and 24px. Section 15 lists each as a question with a recommendation.

## 1. Goal

Give an insights page its parts: a bar chart for amounts by category or by period, in either orientation, with negatives, stacks and comparisons, that a keyboard and a screen reader can read bar by bar and that renders on the server; the categorical palette it needs, derived and measured; and a long-form text style for the words around the charts. Ship them as the batch 6 release: core and react 0.9.0, charts 0.2.0.

The hard parts. A bar chart is the chart most often drawn badly: a truncated axis, red for down, a label rotated 45 degrees, a number on every bar, a palette nobody checked. Each has a rule here (section 4). The library's own rules make two more: nothing may be measured before the first paint, so a long label, a value label and a bar's thickness are laid out by CSS from known numbers; and every figure is the app's string, so a stack's total is the app's too. Prose's hard part is the opposite of a component's: it styles HTML the library never sees, written by a CMS or a Markdown renderer, so its rules must be safe for any order and nesting of elements and must never reach a component placed inside it.

Build order, which is also the plan's order:

1. **The chart palette** (section 5): four tokens with light and dark values, the validator ported into core's tests, the Appendix B record.
2. **The shared chart foundations** (section 6): LineChart's table, legend, readout placement, keys, naming and active state moved to `src/foundations/`, with LineChart's tests and baselines unchanged as the proof.
3. **BarChart, vertical** (section 7): one series, then grouped and stacked, negatives, value labels, the table, the states.
4. **BarChart, horizontal** (section 7): the row grid, long labels, the narrow layout.
5. **Prose** (section 8): `prose.css` and the `Prose` wrapper.

Out of scope, each recorded where it is deferred:

- Area and donut charts (parent spec, phase 6). The donut's arc helper waits for the gauge's (accounts spec, section 7.4), which it can copy.
- A bar that navigates or opens a detail on Enter or a press (open question 13).
- A 100% (normalized) stack, a waterfall, a histogram, a bullet chart and a dual axis. The dual axis is never: two measures take two charts.
- Animation of bars, on first paint or on change. Every chart renders what it is given (home spec, section 1).
- Number and date formatting, as everywhere: every figure, tick, total and category is the app's string.
- Sanitizing HTML for Prose. The library never parses or injects HTML; the app sanitizes what it renders (section 8.1).
- A small size of Prose, and syntax highlighting inside it (open questions 19 and 21).

## 2. Depends on

| From batch 5 or earlier | Used here as |
| --- | --- |
| `@snapshot-ui/charts` 0.1.x: `scale.ts` (`linearScale`, `extent`, `niceDomain`), `path.ts`, `line-chart/geometry.ts` (`chartDomain`, `moveFrom`, `nearestWithData`, `defaultTicks`, `readingsAt`), `AriaName`, `cx` | BarChart's value scale and domain; the shared foundations of section 6 |
| LineChart's view (`LineChart.tsx`): the table and its toggle, the `noscript` copy, the legend, the readout and its placement from known values, the tab stop set after mount, the Escape that is stopped as well as prevented, the modifier-key guard, the touch hold, the direction read from the nearest `dir` attribute, the naming chain with its blank fallback | Moved to `src/foundations/` and shared (section 6) |
| `charts.css`: `--chart-flip` and `--chart-direction` from `:where([dir='ltr' i])` and `:where([dir='rtl' i])`, `--chart-surface` with Lifted as its fallback, the gridline and baseline strokes, `print-color-adjust: exact`, the toolbar's corner inset in a card | BarChart's direction, rings, gaps, gridlines and toolbar |
| Meter's legend swatch (`meter.css`): 12px, `--radius-micro`, a fill or a 45 degree hatch | BarChart's legend key and its texture (section 7.11) |
| The numeral rule (`copy.css`): `direction: ltr`, `unicode-bidi: isolate`, `text-align: match-parent`, tabular figures | Value labels and ticks in right to left |
| `.skeleton` and `.empty-state` (core, batch 3c), as a class contract | BarChart's loading and empty states, drawn without importing `@snapshot-ui/react` |
| `--holder-radius`, `--holder-border`, `--holder-pad`, `--holder-corner-inset` (Nested radii, derived) | Prose's framed blocks in a Card; BarChart's toolbar in a Card |
| `PageColumn` and `--container-page` (batch 4) | Prose's place in a page (section 8.8) |
| The Link record: link blue, the 1px underline at 0.25em, 2px on hover, the focus ring, `--radius-micro` | Prose's links |
| The Kbd record | Prose's `kbd` |
| The heading steps and their phone sizes (`heading.css`), the body and small steps | Prose's type |
| The docs site's code block (`apps/docs/app/site.css`, `.code`): bone, the frame edge, the surface radius, 1.25rem by 1.5rem, 0.875rem at 1.7, and its Shiki css-variables mapping onto the palette | Prose's `pre` |
| The concentric audit (`apps/storybook/tests/concentric`) | Run on every new story in three shapes |
| `Heading`, `Card`, `EmptyState`, `Skeleton` in `@snapshot-ui/react` | Composed by the app around a chart, and in the docs |

React Aria parts used for the first time: none. BarChart is a client part because it holds the active bar and the view, as LineChart is; it imports nothing from React Aria. Prose imports nothing and is a server part.

## 3. What the consumer needs

The repository holds no verbatim batch 6 request. The specs and plans name Insights among the consumer's destinations (the app shell spec measures "Insights" among Home, Transactions, Documents, Accounts, Goals and Settings, section 8, and the sidebar docs group Reports and Budgets under it), and batch 6 was agreed with the consumer as BarChart (vertical, horizontal, negatives, stacked) and Prose (styles for long-form rendered content, such as Markdown or CMS HTML, in the library's type scale). What follows is the page those parts serve, written as input; open question 1 asks the consumer to confirm it before the plan.

1. **Spending by category, month by month.** Twelve months, each a stacked bar of four or five categories with an "Other", a total over each bar, a legend, and the table.
2. **Money in against money out.** Twelve months, two bars per month side by side: income and spending. Income is money that arrived, so `gain` is its color by meaning; spending is ink.
3. **Net cash flow.** One bar per month, above zero when more arrived than left and below it otherwise, the sign carried by the bar's side of the zero line and by the figure, never by red and green.
4. **Top merchants and budgets.** Horizontal bars with long names ("Whole Foods Market, Mission Street"), sorted by the app, a figure at each bar's end.
5. **This month by day.** Thirty-one daily bars on a time axis, with the newest at the inline end (at the left in the Persian guide, home spec ruling 3).
6. **The written summary.** A monthly summary and help articles rendered from Markdown or the app's CMS: headings, paragraphs, lists, links, a quote, a table of figures, now and then a code sample or an image, in a Card or straight in the page column.
7. **Every state.** A chart that is loading, has nothing for the period, or failed to load, keeping its place on the page in each.

Its rules for every part, unchanged from batch 5: `'use client'` only on interactive parts; no `Intl` formatting and no `window` at render, and no first-paint measurement; no external request and no injected script; light and dark, all three shapes, right to left (the Persian guide), comfortable and compact density; WCAG 2.2 AA including 2.5.8; navigation through `RouterProvider`; everything exported from the package index, with the CSS in `core/styles.css`.

## 4. Approach

**Bars are HTML; the drawing that stretches is SVG.** LineChart's rule is that anything that must keep its shape is HTML over a stretched svg (home spec, section 4). A bar must keep its shape: its end is rounded by a radius token, its thickness is capped in pixels, its focus ring follows its corners. An svg `rect` in a `viewBox` stretched by `preserveAspectRatio="none"` would turn a 6px corner into an ellipse and could not take a token. So every bar is an absolutely positioned `span` placed by percentages and logical insets, its corners from `--radius-micro`, and the gridlines stay in the svg with non-scaling strokes, as in LineChart. Right to left mirrors the bars by their logical insets and the svg by `--chart-flip`, from the same attribute.

**The layout is CSS arithmetic on known numbers.** The number of bands, the number of bars in a band and each value's place on the scale are known in render; a bar's thickness is `min(1.5rem, ...)` of its band, written as a `calc()` on custom properties the render writes, resolved by the browser against the plot's box. Nothing is measured, so the server's HTML is the final picture. A long category label wraps in its own grid cell; a value label sits outside the bar's end in room reserved from the longest label's length in characters.

**Bars start at zero, always.** A bar's length is its value, so the value axis always includes zero; a `valueDomain` that leaves it out is widened to it, with a development warning. Negatives hang below (or before) the zero line, which is drawn firmer than a gridline whenever the domain crosses it.

**Color by meaning, then by identity.** One series is ink, two series compared are ink and slate (LineChart's emphasis form), and only a chart of several peers (a stack of categories, three or more series) takes the categorical palette. `gain` is allowed on a series only when the series is money that arrived. There is no loss color: a negative is ink below the line, as NumberField's record says of a negative amount ("never error, since nothing failed, and never gain; the sign carries it").

**A bar is a stop, one at a time.** The chart is one tab stop, as LineChart is, but the stop is the active bar itself, moved by the arrow keys with a roving tab index, so a screen reader reads the bar's own name (its category, its series and its value, from the table's cells) and the focus ring is drawn round the bar. This is the per-bar model the Highcharts and Visa Chart Components keyboard modules take (section 7.15, to verify in detail), and it needs no live region.

**Shared, not copied.** LineChart's table, legend, readout placement, keys, naming chain and active state move into `src/foundations/` before BarChart is written, and LineChart is rebuilt on them with no change to its markup, classes, behavior or baselines (section 6).

**Prose styles what the library does not render.** `.prose` is one class whose descendant rules use `:where()`, so each has the specificity of one class, stop at any `.not-prose` subtree, and never style an element a library component draws inside it. Every value is a token or a value an existing record already uses: the heading steps, the body step at the docs' 1.6 line height and 70ch measure, the Link record, the docs' code block, the system's spacing steps.

| Part | In the server's HTML | After hydration |
| --- | --- | --- |
| BarChart | Everything a reader sees: the svg gridlines, every bar, the labels, the legend, the table (hidden), the toggle, the `noscript` copy, the status | The tab stop on the active bar, the keys, the pointer, the readout, the toggle |
| Prose | Everything | Nothing changes |

Rejected along the way:

- **A chart library** (Recharts, visx, Chart.js, Observable Plot) for bars. The home spec rejected one for lines (section 4): each measures on the client, or renders nothing useful on the server, or brings its own focus model. Bars add two layouts and one orientation, a few hundred lines on the same foundations.
- **SVG `rect` bars with `rx`.** The stretch distorts the corner (above).
- **Value labels inside the bar.** Whether a label fits inside a bar is a measurement. Labels sit outside the end, where the room is reserved (section 7.5).
- **Rotated category labels.** A label at 45 degrees is read with a tilted head and still collides; long labels wrap, or the chart is horizontal (section 7.5).
- **Red and green by sign.** Error means a failure and success a save (the meaning rules in "Six colors added"); a month that cost more than it brought in is neither.
- **The chart's own live region**, LineChart's model (section 7.6 and open question 6).
- **Tailwind Typography as a dependency for Prose.** It is a Tailwind plugin, so a non-Tailwind app could not use it, and its defaults (65ch, a 600 weight, its own grays) are not the system's.

## 5. The chart palette

The parent spec asks for "a categorical chart palette, which the design system lacks, derived and measured for contrast in both themes before any chart is built", and Appendix B's "Charts" says the categorical validator of the data-visualization method is run "when it adds one". Batch 6 adds one, because a stack of categories is the first chart with more than two series.

### 5.1 The rule

- **Fixed hue anchors, away from every reserved color.** The system's colors that carry meaning sit on OKLCH hues 29 to 79 (error, clay, signal, light signal orange, warning), about 160 (success and gain) and about 265 (link blue). A series color must not be read as one of them, so the palette's hues are at least 30 degrees from each: the free arcs are about 110 to 128 (olive), 192 to 233 (teal to sky) and 297 to 359 (violet to raspberry).
- **The method's six checks** (the data-visualization method the home spec cites): OKLCH lightness in the mode's band (0.43 to 0.77 light, 0.48 to 0.67 dark), chroma at least 0.10, adjacent pairs at least 8 apart under simulated protanopia and deuteranopia (OKLab distance times 100, Machado 2009 at full severity) and at least 15 apart for normal vision, at least 3:1 against the surface, and every value written in the token source.
- **Stricter on contrast than the method.** Every slot clears 3:1 against Lifted, the canvas and Float in both modes, so no slot needs the method's relief rule (visible labels or a table) to be legal, though the table is there anyway.
- **At least 10 from every reserved color** by the same distance, for normal vision, so a series never impersonates a state at a glance.
- **Order found by enumeration, not chosen by eye.** Every order of the candidate hues was scored by its worst adjacent pair in both modes, each mode's lightness chosen per slot from a grid, and the best order kept.

### 5.2 The values

Computed for this spec with the method's validator (`validate_palette.js`) and a search script over OKLCH; the plan ports the computation into `packages/core/scripts/contrast.js` and its test, re-measures, and records the result in Appendix B as "Chart palette".

| Token | Hue | Light | Dark | OKLCH light (L, C, H) |
| --- | --- | --- | --- | --- |
| `--color-chart-1` | teal | `#029393` | `#029393` | 0.601, 0.102, 195 |
| `--color-chart-2` | violet | `#7024ab` | `#af6af2` | 0.450, 0.199, 305 |
| `--color-chart-3` | olive | `#697805` | `#7a8a06` | 0.541, 0.124, 118 |
| `--color-chart-4` | magenta | `#910080` | `#c344ae` | 0.450, 0.200, 335 |

Contrast as a graphic (3:1 needed):

| Token | Light: lifted, canvas, float | Dark: lifted, canvas, float |
| --- | --- | --- |
| `chart-1` | 3.63, 3.31, 3.75 | 4.64, 5.15, 4.64 |
| `chart-2` | 8.03, 7.32, 8.30 | 5.11, 5.67, 5.11 |
| `chart-3` | 4.74, 4.32, 4.90 | 4.53, 5.03, 4.53 |
| `chart-4` | 8.08, 7.36, 8.35 | 3.95, 4.38, 3.95 |

Separation, adjacent pairs in slot order:

| Pair | Light, normal | Light, CVD | Dark, normal | Dark, CVD |
| --- | --- | --- | --- | --- |
| 1 and 2 | 29.5 | 20.0 | 26.1 | 13.8 |
| 2 and 3 | 33.6 | 28.1 | 34.2 | 27.8 |
| 3 and 4 | 32.2 | 20.0 | 32.0 | 18.7 |

All six checks pass in both modes on the adjacent pairlist, which is the one bars use (only neighbors in a stack or a group touch). The nearest reserved color to each slot, by normal-vision distance: light, teal to success 17.0, violet to link 14.4, olive to warning 11.2, magenta to error 17.0; dark, teal to success 10.2, violet to link 12.9, olive to success 12.1, magenta to error 18.7. Two are close under color-vision deficiency (olive to warning 4.4 in light, violet to link 2.9 in dark), which matters only if a chart drew a status beside a series, which the meaning rules forbid; risk R7 records it.

**Not for scatter or small multiples.** Under the method's all-pairs test the four do not all pass (the worst pair is violet and magenta in light, 10.3 normal; teal and magenta in dark, 3.7 CVD), so a chart form where any two series can sit side by side carries three slots at most. No such form is in this batch; the record says so for the next.

**The fifth series is slate.** A stack of more than four peers folds the rest into an "Other" that the app sums and labels (the library never sums a figure it must say); it is drawn in `--color-slate`, achromatic, so it reads as the remainder and never as a fifth hue. Slate is gated already as text (5.31 and 6.90 on Lifted). A sixth series draws nothing new: the chart warns once in development and draws it in slate too, with the legend and the table still telling them apart.

**Considered and rejected.** Six slots with a sky blue (225) and a raspberry (355) pass the adjacent checks (worst 9.5) but put a teal and a sky 5.7 apart for normal vision, under any reader's threshold for two different things, and a raspberry 10.4 from error in light. An ink ramp (ink at 100%, 70%, 45%, 25%) is an ordinal ramp, and a stack of categories is nominal: lightness steps would say "more" where there is no order. Link blue as a slot would make a series look like a link and like the info tone.

### 5.3 Tokens and where they may go

- Four tokens in `tokens.json`, `chart-1` to `chart-4`, each with a light and a dark value and a description that names the rule: "A chart series that is one of several peers. Never a state, never text." The generator writes `--color-chart-1` and the Tailwind theme `bg-chart-1`.
- **Never text.** Value labels, legends, ticks and readouts stay in ink and slate; the colored mark beside them carries identity (the method's rule). The CSS test fails any `color:` that reads a chart token.
- **Only in charts.** Avatar's record declined a color per name "until phase 6"; it stays declined, since a person's color would be a color carrying meaning the name already carries.
- **Order is fixed and follows the entity.** A series keeps its slot when a filter removes another: the app pins it with `color` (section 7.2). Without `color`, slots go in series order, so an app that filters series pins them.

### 5.4 Which color a series gets

| The chart | Series colors, in order, unless a series sets `color` |
| --- | --- |
| One series | ink |
| Two series, grouped | ink, slate: the story and its context, LineChart's emphasis form |
| Two or more, stacked; three or more, grouped | `chart-1`, `chart-2`, `chart-3`, `chart-4`, then slate |

`color` takes `'ink' | 'slate' | 'gain' | 'chart-1' | 'chart-2' | 'chart-3' | 'chart-4'`. `gain` is for a series that is money that arrived (the meaning rule: "an amount that arrived"), drawn with its legend label saying so ("Income"); the docs show it beside an ink "Spending" and never beside a palette color, so a reader never compares a meaning with an identity in one chart (the method's collision rule). `error`, `success`, `warning`, `clay` and both signal oranges are not in the type.

## 6. The shared chart foundations

BarChart reuses what LineChart built. Today most of it is inside `LineChart.tsx`, so step 2 moves it to `packages/charts/src/foundations/`, private to the package (nothing new is exported), and rebuilds LineChart on it.

| Module | From LineChart | Shared as |
| --- | --- | --- |
| `domain.ts` | `chartDomain`'s body: `yDomain` if finite, else `niceDomain` over the values with zero included, `[0, 1]` with none, the extent if the nice domain overflows | `valueDomain(values, given)`; BarChart passes stacked sums and always includes zero |
| `keys.ts` | `isRightToLeft` (the nearest `dir="ltr"` or `dir="rtl"`), the modifier guard, `moveFrom` with Page by 7 | The same, plus `PAGE` exported for the docs' Keys tables |
| `naming.ts` | The chain: `aria-labelledby` first, a blank name falls through, the series' column headers as the last resort | `chartName(props, headerIds)` |
| `ChartTable.tsx` | The table, its caption or `aria-labelledby`, the row and column headers, the toggle button, the `noscript` note and its shown copy with no ids | One component that takes rows, columns, cells, an optional total column and an `ids` callback, so BarChart can name each bar by its cells (section 7.6) |
| `ChartLegend.tsx` | The `ul` of keys and labels | `look: 'line' | 'swatch'` for the key, each item's color by `data-color` |
| `readout.ts` | The placement from known values: above the highest active mark when the lines fit, else below the lowest, else the side with more room; the start, center and end alignment by quarter | `placeReadout({ marks, height, lines, along })`; LineChart passes dot positions, BarChart the bars' ends |
| `useChartActive.ts` | The active index and its source, the readout hidden by Escape, the touch hold until a press outside, the tab stop set after mount | A hook both charts use; LineChart adds its live region on top, BarChart its roving focus |

**CSS.** The shared rules are written once in `charts.css` with selector lists, `:is(.line-chart-legend, .bar-chart-legend)` and so on, so each chart keeps its own block's class names (LineChart's are public and unchanged) and no rule is written twice.

**The proof.** The refactor changes no DOM, class or behavior of LineChart: its 885 lines of tests and its 40 visual baselines must pass untouched in the same commit, and its size entry may not grow by more than 0.1 kB. Any difference is a regression, fixed before BarChart starts.

## 7. BarChart

### 7.1 Anatomy

`figure.bar-chart[data-orientation][data-layout][data-view][data-status]`, named by its `aria-label` or `aria-labelledby`, holds, in order:

- `div.bar-chart-chart`, the chart view: the legend (`ul.bar-chart-legend`, two or more series), and the plot.
- **Vertical:** `div.bar-chart-plot` (the svg of gridlines and the zero line, `div.bar-chart-bars` with one `span.bar-chart-bar` per value, the value labels, the y tick labels, the readout) and under it `div.bar-chart-categories`, the category labels, hidden from assistive technology.
- **Horizontal:** `div.bar-chart-rows`, a grid with one row per category: `span.bar-chart-category` (hidden from assistive technology) and `div.bar-chart-track` holding that category's bars and value label; a gridline layer spans every row's track column; the value tick labels sit under the last row.
- `table.bar-chart-table` (hidden while the chart shows), the toolbar with the toggle, the `noscript` note and table, and `span.bar-chart-status`, the polite status.

`className`, `ref` and the other attributes go on the figure.

### 7.2 API

```ts
/** One bar: the number places it, the string says it. */
export interface BarValue {
  value: number;
  /** Formatted: "$420.00", "-$1,240.00", "۴۲۰ دلار". */
  valueLabel: string;
}

/** A series' color: a role, a meaning, or a palette slot (section 5.4). */
export type ChartColor = 'ink' | 'slate' | 'gain' | 'chart-1' | 'chart-2' | 'chart-3' | 'chart-4';

export interface BarSeries {
  /** "Groceries", "This month", "Income". Names the series in the legend, the readout, each bar's name and the table. */
  label: string;
  /** One per category, aligned with `categories`. `null` is no value: no bar, skipped by the keys, an empty cell. */
  values: readonly (BarValue | null)[];
  /** Pins the series to a color, so it keeps it when another series is filtered out. @default by place, section 5.4 */
  color?: ChartColor;
}

/** The strings the chart writes itself. Give all six, so no default in English is left on the page. */
export interface BarChartLabels {
  showTable: string;
  showChart: string;
  noScript: string;
  /** The plot's `aria-roledescription`: "chart". */
  roleDescription: string;
  /** Each bar's `aria-roledescription`: "bar". */
  bar: string;
  /** The table's header for `totals`: "Total". */
  total: string;
}

/** The strings of the three states, shared by BarChart and LineChart. Give all three. */
export interface ChartStatusLabels {
  /** The polite status while loading: "Loading". */
  loading: string;
  /** Drawn in the plot when `status` is 'empty' and no `statusContent` is given: "Nothing to show for this period". */
  empty: string;
  /** Drawn in the plot when `status` is 'error' and no `statusContent` is given: "The chart could not be loaded". */
  error: string;
}

export type BarChartProps = Omit<HTMLAttributes<HTMLElement>, 'children' | 'aria-label' | 'aria-labelledby'> &
  AriaName & {
    /** One to five series; a sixth and later warn and draw in slate (section 5.2). */
    series: readonly BarSeries[];
    /** The bands' labels, formatted: "Groceries", "Oct", "Oct 12". */
    categories: readonly string[];
    /** @default 'vertical' */
    orientation?: 'vertical' | 'horizontal';
    /** How two or more series share a band. @default 'grouped' */
    layout?: 'grouped' | 'stacked';
    /** Whether the bands are periods in order or peers. @default 'category' */
    bands?: 'category' | 'time';
    /** Which category labels show, by index. @default every one for 'category'; first, middle and last for 'time' */
    categoryTicks?: readonly number[];
    /** The value gridlines and their labels, formatted. Absent, no gridlines but the zero line and no value axis labels. */
    valueTicks?: readonly { value: number; label: string }[];
    /** The value domain. Always widened to include zero. @default from the least to the greatest stacked sum, zero included, rounded out by niceDomain */
    valueDomain?: readonly [number, number];
    /** Figures at the bars' ends: none, every bar, or the bands at these indexes. Stacked bars show `totals`. @default 'none' */
    valueLabels?: 'none' | 'all' | readonly number[];
    /** Each band's total, formatted by the app, for a stacked chart's labels, readout and table. */
    totals?: readonly (string | null)[];
    /** @default 'ready' */
    status?: 'ready' | 'loading' | 'empty' | 'error';
    /** Drawn in the plot's place for 'empty' and 'error', such as an EmptyState with a Retry button. */
    statusContent?: ReactNode;
    /** Draws each series' texture as well as its color (section 7.11). Always on in forced colors. @default false */
    hasTexture?: boolean;
    labels?: BarChartLabels;
    statusLabels?: ChartStatusLabels;
    /** The plot's height in px, vertical only; a horizontal chart is as tall as its rows. @default 240 */
    height?: number;
    ref?: Ref<HTMLElement>;
  };
```

- **Orientation-neutral names.** LineChart's `xTicks`, `yTicks` and `yDomain` name axes; a bar chart's axes swap with its orientation, so BarChart says `categoryTicks`, `valueTicks` and `valueDomain`. LineChart keeps its names.
- **`categories` and `values` align by index,** as LineChart's `xLabels` and `points` do. A series' values past the categories are dropped and a value that is not finite is `null`, as in LineChart.
- **Required name,** through `AriaName`, as LineChart.

### 7.3 Layout and geometry

**The value scale.** `valueDomain(values)` over every value for grouped bars, or over each band's positive sum and negative sum for stacked bars, zero included, rounded out by `niceDomain`; `linearScale(domain, [100, 0])` for a vertical plot (y down) and `[0, 100]` for a horizontal track (from the inline start). A given `valueDomain` without zero is widened to it and warns once in development: a bar that starts anywhere but zero misstates its value. A value outside a given domain is clamped to 1e6 past the plot, as LineChart's are.

**A bar's extent along the value axis.** For a value `v`, the bar runs from `scale(0)` to `scale(v)`: `inset-block-start` and `block-size` in percent for a vertical bar, `inset-inline-start` and `inline-size` for a horizontal one, each written in render with three decimals. A stacked bar's segments run from the running sum of the values of the same sign before it in series order, so positives stack up (or toward the inline end) from zero and negatives stack down (or toward the inline start), each sign in series order; this is the "diverging" stack (Recharts' `stackOffset="sign"`, Observable Plot's default stacking by sign, both to verify). A value of exactly zero has a bar of no length, still in the DOM and reachable by the keys; any other value draws at least 1px (`min-block-size` or `min-inline-size` under `[data-nonzero]`), so a small amount never vanishes.

**Bands.** `n` categories divide the category axis into equal bands, band `i` centred at `(i + 0.5) / n` of it, from the inline start (vertical) or the block start (horizontal). No band padding is configurable: the bars take a share of the band and the rest is air.

**Thickness, with no measurement.** The render writes `--bar-chart-bands: n` and `--bar-chart-group: k` (the bars side by side in a band: the series count when grouped, 1 when stacked) on the plot, and the CSS computes:

```css
--bar-chart-thickness: min(1.5rem, calc((100% / var(--bar-chart-bands) * 0.6 - (var(--bar-chart-group) - 1) * 2px) / var(--bar-chart-group)));
```

A percentage inside a custom property resolves where it is used, on the bar, against the plot it is positioned in, so `100%` is the plot's width (vertical). Each bar's inline start is its band's centre less half its group, plus its place in the group: `calc(var(--bar-chart-centre) - (k * t + (k - 1) * 2px) / 2 + j * (t + 2px))`, with `t` the thickness, `j` its place and `--bar-chart-centre` written in render as a percent. So bars are at most 24px thick, the method's cap, take 60% of their band at most, sit 2px apart in a group (the method's surface gap between touching marks, here air on the surface), and thin as the box narrows: 31 daily bars in a 280px plot are about 5px.

**Horizontal rows.** A horizontal chart is a CSS grid, `grid-template-columns: fit-content(var(--bar-chart-label-size, 40%)) minmax(0, 1fr)`: the label column is as wide as the longest label up to 40% of the chart (an app sets `--bar-chart-label-size`), and each row is at least 2.5rem tall (`--size-target`, so the row is a 40px target for the pointer) or as tall as its wrapped label. Bars in a row are `min(1.5rem, calc((2rem - (k - 1) * 2px) / k))` thick, centred in the row, so a grouped row of four is four 6.5px bars. The gridline layer is one element in the track column spanning every row (`grid-row: 1 / -1`), so the lines run unbroken behind the rows.

**Grouped or stacked** (open question 2). Grouped places a band's bars side by side, for comparing series within a band (this month against last month per category). Stacked places them end to end, for a total and its parts. One series ignores `layout`.

**The zero line.** When the domain crosses zero, a 1px line at zero in `--color-boundary`, the edge color the system measures at 3:1 or more (3.36 light and 5.59 dark on Lifted, the record's values), because it separates the two signs and a reader must find it. When zero is the domain's edge, as in a chart with no negatives, the line is `--color-frame`, LineChart's baseline, a cue: the bars' own square ends draw the baseline. Gridlines are LineChart's, 1px `--color-divider` at each `valueTicks` value inside the domain, solid, in the svg with `vector-effect: non-scaling-stroke`; vertical gridlines are never drawn for a vertical chart, and horizontal ones never for a horizontal chart.

### 7.4 Bar ends and the concentric rule

A bar has two ends: the baseline end, at zero, and the data end, at its value.

- **The baseline end is square in every shape.** The bar grows from a line, and a rounded foot would lift it off the line it measures from (the method's "square at the baseline").
- **The data end takes `--radius-micro`:** 6px in Rounded and in Soft, 0 in Square. The corners are written on the data end's two corners only, in logical properties: `border-start-start-radius` and `border-start-end-radius` for a vertical positive bar, the end corners for a negative one, and the inline end corners (`border-start-end-radius`, `border-end-end-radius`) for a horizontal positive bar, so right to left moves them with the bar. A bar thinner than 12px or shorter than 6px has its corners scaled down by the browser to fit (the CSS rule for radii larger than their box), so a thin daily bar ends in a half circle and a 3px bar is a rounded stub, never a corner wider than the bar.
- **Why micro and not the pill.** A bar is a mark, not a surface or a control, and the nested-radii record keeps text-sized and mark-sized parts at the micro step. A pill end (Meter's rule) would turn every bar under 24px into a stadium whose value sits at the top of a curve 12px tall, and a short bar into a dot; the method asks for a small rounded data end (4px; micro is the system's nearest step). Open question 5 keeps the pill as the alternative.
- **Stacked segments.** Only the outermost segment of each sign takes the data end's radius; inner joins are square, with a 2px gap in `--chart-surface` between segments, drawn as a border on the segment's start edge in the stacking direction (Meter's spacer, as a border because no shadow draws a ring). The segment's length includes its gap, so the stack's total stays exact.
- **Concentric by construction.** The focus ring is the token outline at the token offset (2px at 2px), which follows the bar's border radius in every engine of the browser floor, so its curve is the bar's radius plus the offset: the record's formula read outward, and 0 plus the offset's square corner in Square. Nothing holds a bar in a corner: a chart's bars sit at least the card's 32px padding plus the axis labels from a Card's edge, which in Rounded is more than the 40px curve on the block axis, so the record's "further in" rule applies and the bars keep their own corners; the audit, which checks only corners inside a holder's curve, passes them. The table toggle in a Card moves down by the corner inset, LineChart's rule, through the shared selector.

### 7.5 Labels

**Category labels, vertical.** One cell per band in `div.bar-chart-categories`, a grid of `repeat(n, minmax(0, 1fr))` under the plot, so each label is its band's width. `bands="category"`: every label, wrapped onto at most two lines and clamped with an ellipsis (`-webkit-line-clamp: 2`, supported by all three engines), centred under its band. `bands="time"`: the labels at `categoryTicks` (first, middle and last by default, LineChart's), on one line, centred on the band, the first and last kept inside the plot by `data-edge`, as LineChart's x labels are. Never rotated. A label clamped is still whole in the readout, the bar's name and the table; the docs say that labels longer than about 12 characters, or more than eight categories, want a horizontal chart.

**Category labels, horizontal.** In the label column, `--text-small` in ink (the row's name, which the reader scans), wrapping freely with `overflow-wrap: anywhere`, never truncated, aligned to the row's start. At a chart under 24rem (a container query on the chart) the column folds: each label sits on its own line above its bar, at the track's full width (section 7.13).

**Value labels.** Off by default; the method's rule is "never a number on every point", and the table, the readout and the bars' names carry every value. `valueLabels="all"` labels every bar, the right choice for a short horizontal list; an index list labels the bands the story is about. Each label is `--text-small`, ink, tabular, left to right with its sign kept by the numeral rule, `white-space: nowrap`, hidden from assistive technology, and sits outside the bar's data end with a 4px gap: above a vertical positive bar, below a negative one; after a horizontal positive bar, before a negative one. Stacked bars label the stack, with `totals[i]`, at each sign's outer end; a stacked chart asked for labels without `totals` warns once and draws none.

**Room for value labels, reserved without measuring.** Vertical: the plot gains 1.25rem above (positives) and below (negatives) when labels show, the space LineChart reserves for its top tick label, and the scale maps the domain inside it. Horizontal: the track reserves `calc(Nch + 0.25rem)` at each end that has labels, where `N` is the longest label shown, in code points, counted in render. In Sofia Sans `1ch` is a tabular zero, the widest figure, so digits, separators and signs fit; a label of wider letters ("1.2M ريال") may overrun its reserve by a character into the plot's padding, never off the chart (risk R10).

**Value tick labels.** Vertical: LineChart's y labels, at the inline start above their gridline, slate, tabular. Horizontal: under the last row at each tick, centred on it and kept inside the track at either edge, LineChart's x label rule.

### 7.6 Focus and keys

**One stop, on a bar.** Each bar is `span.bar-chart-bar[role="img"]` with `aria-roledescription` from `labels.bar`. After mount (the server writes no `tabindex`, LineChart's rule, so with scripts off nothing is a dead stop) the active bar has `tabIndex={0}` and every other bar `-1`, the WAI-ARIA Authoring Practices' roving tab index. Tab lands on the active bar; the first time, that is the newest band's first bar with a value for `bands="time"` and the first band's for `bands="category"`, and after that the bar last active.

**Each bar's name is its cells.** `aria-labelledby` lists three ids from the table: the row header (the category), the column header (the series) and the cell (the value label). The table is in the DOM while hidden, and the accessible name computation follows `aria-labelledby` into hidden content, so a screen reader hears "Oct Groceries $420.00, bar" from the app's own strings, with no punctuation of the library's and no English beyond `labels.bar` (the LineChart record's lesson). A one-series chart's bars are named by row header and cell only. Because focus moves to an element with a name, the screen reader speaks on every move by itself: no live region, no 150ms rest, nothing for a pointer to clear.

**Arrow keys move to the bar drawn in that direction.**

| Key | Vertical | Horizontal |
| --- | --- | --- |
| Left, Right | The bar beside, in drawn order: in a group, the next bar of the group, then the next band's first; stacked or one series, the same series in the band beside (or the nearest series with a value). Mirrored in right to left. | Stacked: the segment beside along the bar (mirrored in right to left). Otherwise nothing, and the key is not prevented. |
| Up, Down | Stacked: the segment above or below in the stack. Otherwise nothing, and the key is not prevented. | The bar above or below, in drawn order: in a group, the next bar of the row, then the next row's first; stacked or one series, the same series in the row beside. |
| Home, End | The first or last band with a value, same series where it has one. | The same. |
| Page Up, Page Down | Seven bands back or forward, LineChart's `moveFrom`, landing on the nearest band with a value. | The same. |
| Escape | Hides the readout until the next move; stopped as well as prevented, so a chart in a Dialog hides its readout before the Dialog closes; a second Escape goes on. | The same. |
| Tab, Shift Tab | Leaves the chart: to the table toggle, or back. | The same. |

A key with Alt, Control or Meta is left to the browser and the page. A key that does not move is not a move: the readout stays as it was. `null` values are skipped; a zero is a bar and is reached.

**Why per bar, and not LineChart's one plot with a live region.** The consumer asked for "points reachable by keyboard" for lines, and this batch's brief asks for a per-bar model for bars. A bar is a discrete thing with a name; focus on it gives a native announcement in every screen reader, a visible ring on the bar itself, and a browse-mode reading of each bar as an image in order; a line's point is a position on a continuous drawing, which LineChart's crosshair serves. Open question 6 asks whether LineChart should follow later.

### 7.7 Pointer and readout

**Hit area: the whole band.** A mouse or pen over the plot (vertical) or a row (horizontal) activates the band under it, read from `getBoundingClientRect` in the handler, and within it the bar under the pointer or, between bars, the first with a value; the hit area is never only the bar, so a 5px daily bar is as easy to hit as a wide one. Leaving clears it unless a bar has focus; a touch press activates and holds until a press outside, LineChart's rule. A pointer does not move focus.

**Emphasis under the pointer.** While a pointer holds a band, the bars of every other band draw at 40% opacity, so the active band stands out with no new shape (open question 7). Under the keyboard nothing dims: the focus ring marks the bar. An ink bar dimmed so measures 2.56 in light and 3.83 in dark against Lifted, below 3:1 for as long as the pointer rests; the active band is at full strength and the readout says its values.

**The readout.** LineChart's float panel, through the shared placement: the category in slate, then one line per series with a value in the band, a 12px swatch in the series' color, the value in 500 and tabular, then the series' label in slate; the active bar's line first is not reordered, so lines keep legend order; with `totals`, a last line with the total and `labels.total`. It sits above the band's highest bar end when its lines fit, else below the lowest (vertical), or beside the row's longest bar end on the side with room (horizontal), never over the active bar. It is hidden from assistive technology: the focused bar's name already says it.

### 7.8 The table

The shared `ChartTable`: a row per category with the category as its row header, a column per series with the label as its header, every cell the app's value label and empty for `null`, and a "Total" column (`labels.total`) when `totals` is given. Named as the chart is (caption repeating `aria-label`, or the same `aria-labelledby` and no caption). Rows in category order, oldest first for time bands, whatever the orientation or direction. The toggle under the chart swaps views with `hidden` and keeps focus; with scripts off the `noscript` note and a shown copy of the table follow the chart, LineChart's ruling 2.

### 7.9 Empty, loading and error

The figure keeps its size in every state, so the page does not move when the data arrives: the vertical plot keeps its `height`; a horizontal chart keeps the height of `categories.length` rows when the app passes the categories it expects, and four rows otherwise.

- **Loading.** The plot holds a static row of `.skeleton` blocks in place of bars (vertical: bands of heights 60%, 85%, 45%, 70% repeating, so the shape reads as a bar chart and not a list; horizontal: rows of widths 70%, 50%, 85%, 40%), hidden from assistive technology, with Skeleton's pulse and its reduced-motion stillness. The figure is `aria-busy="true"` and `span.bar-chart-status`, a polite status mounted from the first render, says `statusLabels.loading` once, the Skeleton record's "the holder speaks". The legend, the toggle and the table are not drawn. Keys do nothing.
- **Empty.** The plot holds `statusContent`, or `p.bar-chart-message` with `statusLabels.empty` in slate, centred, at the EmptyState's description step. The gridlines and the zero line still draw, so the space reads as an empty chart, not a broken one. The table toggle is not drawn.
- **Error.** The same place holds `statusContent`, or `p.bar-chart-message[data-tone="error"]` with `statusLabels.error` in `--color-error`, which means "a failure", which a failed load is; the status says it once. The words carry the state, never the color alone, and an app that can retry passes a Retry button in `statusContent`.
- **Composition, not import.** The docs pass `@snapshot-ui/react`'s `EmptyState` as `statusContent`; the chart draws `.skeleton` and `.empty-state`-compatible markup by class, so `@snapshot-ui/charts` still depends on React alone.
- **LineChart** gains the same `status`, `statusContent` and `statusLabels` in this batch (open question 10), since the shared frame makes it free. The three strings are a type of their own, `ChartStatusLabels`, with English defaults, so LineChart's `labels`, which the types require whole, keep their four and no app that passes them breaks (section 18).

### 7.10 Color in use

Section 5.4 assigns colors. In use: a bar is its series' color, solid; the legend key is a 12px swatch, Meter's, at `--radius-micro`; the readout's swatches are the same. Text never takes a chart color. A negative bar is its series' color, below the line. A bar with `gain` keeps `gain` on both sides of zero: money that arrived and was then reversed is still drawn as the series it belongs to, and the sign and the figure say which way.

### 7.11 Look and CSS

- **Bars.** `background-color` from `--bar-chart-color`, set per series by `data-color` on the bar: `--color-ink`, `--color-slate`, `--color-gain` or `--color-chart-1` to `-4`.
- **Texture** (`hasTexture`, and always in forced colors). Slot by series position, the method's two directions only: the first series solid, the second 45 degree stripes, the third 135 degree stripes, the fourth both, the fifth solid in slate; stripes 2px every 6px, Meter's hatch, with a 1px border in the series' color so a textured bar keeps its outline when stripes do not print. For readers who cannot tell the colors apart, a printout without color, and forced colors.
- **Legend.** Two or more series: the shared legend at the top inline start, `--text-small`, ink labels, swatch keys.
- **Contrast.** Each bar color against Lifted, the canvas and Float: ink 17.84, 16.25, 18.43 light and 17.42, 19.31, 17.42 dark (the Sparkline record's values); slate 5.31, 4.84, 5.49 and 6.94, 7.26, 6.94 (LineChart's); gain 7.20, 6.55, 7.44 and 8.04, 8.92, 8.04 (its record's); the palette in section 5.2. All past 3:1. The zero line in boundary, 3.36 light and 5.59 dark on Lifted; gridlines and the frame baseline are cues (1.23 and 1.28, LineChart's). Value labels and category labels are ink or slate, gated as text. The palette's pairs join the contrast gate as graphics (3:1) against canvas, Lifted and Float in both modes, twenty-four pairs, and the categorical checks become a test.
- **Forced colors.** Bars opt out of the repaint (`forced-color-adjust: none`), as Skeleton does, and draw in `CanvasText` with the textures on, since a system palette has one text color and a stack needs four looks; the gaps between segments become the system background color through `--chart-surface`; the zero line is `CanvasText`, the gridlines `GrayText`; the focused bar's ring and the active band's bars are `Highlight`. The swatches follow the bars.
- **Reduced motion.** Nothing moves: no bar animates in or on change, the pointer's dimming is instant, the readout appears without a transition. The skeleton stops pulsing.
- **Print.** `print-color-adjust: exact` on the figure, as `.line-chart` and `.meter` set.
- **Density.** Nothing changes in compact: the chart's sizes are its own, and its container (a Card) changes its padding.

### 7.12 Right to left

- **Vertical.** The bands run from the inline start, so in a right-to-left page the first category is at the right and, for `bands="time"`, the newest band is at the left (home spec ruling 3). Bars and labels follow by their logical insets in `--chart-direction`; the svg gridlines are mirrored by `--chart-flip`, though horizontal lines do not change.
- **Horizontal.** The label column is at the right and bars grow from the right toward the left; negatives grow toward the right of zero. The data end's corners are logical, so they move with the bar.
- **Keys.** Left and Right follow the drawn direction, read at the key press from the nearest `dir` attribute, as LineChart's are.
- **Figures.** The app's strings, left to right inside their isolates by the numeral rule; a Persian page passes Persian digits and `labels` in Persian. Category labels read in their own direction.

### 7.13 Container responsiveness

The figure is an inline-size container (`container-type: inline-size`) with `contain-intrinsic-inline-size: 20rem`, so in a flex row or an auto grid column it is 20rem wide rather than nothing, the lesson StatTile met in 0.6.1 and the accounts spec's R1. Its queries, on its own width and never the viewport's, so a chart beside a SidePanel or in a third-width card behaves as on a phone:

| The chart's width | Vertical | Horizontal |
| --- | --- | --- |
| 30rem and up | As drawn | Label column beside the track |
| Under 30rem | Category labels drop to one line, ellipsized, and value labels of `'all'` show only on the first and last band and the bands an index list names | As drawn |
| Under 24rem | `bands="category"` labels hide under the bands past every third; time ticks stay first, middle and last | Each label on its own line above its bar, the track full width |

Thickness narrows by itself (section 7.3). At 320px with a Card's 20px padding the plot is 248px: twelve monthly bars are 12px, thirty-one daily bars 4.8px, each reachable by keys and by its band with the pointer. Nothing scrolls sideways; a docs e2e checks 320px.

### 7.14 Server rendering

BarChart is a client part (`'use client'`), for the active bar, the view and the pointer, as LineChart is, and imports nothing from React Aria. On the server it renders the final picture: every bar's position, size and corner, the labels, the legend, the hidden table, the toggle, the status host, the `noscript` copy. No `Intl`, no `window`, no measurement: the label room is a count of code points, the thickness a `calc()`. The ids that name each bar come from `useId`, so the server and the client agree. After mount it sets the active bar's tab stop. The hydration suite renders it under `en-US`, `de-DE` and `fa-IR` in UTC and Asia/Tehran with `onRecoverableError` failing the test; it writes nothing from a locale, so it has no server face of its own ("The server face" record).

### 7.15 How others do it

Each claim marked "to verify" is from memory and is checked by the plan before the docs cite it.

| System | Bar ends | Thickness and gaps | Negatives, stacks | Keyboard and screen reader | Table | What this spec takes |
| --- | --- | --- | --- | --- | --- | --- |
| IBM Carbon Charts | Square (to verify) | A capped bar width with band padding (to verify) | Negatives from zero; stacked and grouped | Limited keyboard support on marks (to verify) | "Show as table" in the toolbar's overflow menu | The table behind a visible control; not a menu for it |
| Shopify Polaris Viz | Rounded data ends (to verify) | Gaps between grouped bars (to verify) | Stacked and grouped; horizontal bars with labels above them (to verify) | Tooltips on focus (to verify) | Not built in (to verify) | Rounded data ends; labels above bars in a narrow horizontal chart |
| Material Design | Material 3 has no chart components; Material 2's data visualization guidance (to verify) advises bars from zero and minimal ink | | | | | Bars from zero, recessive grid |
| Recharts | Square by default (`radius` prop) | `barCategoryGap` 10%, `barGap` 4 (to verify) | `stackOffset="sign"` for diverging stacks (to verify) | An `accessibilityLayer` with arrow keys, on by default in 3.x (to verify) | None | The diverging stack |
| Observable Plot | Square; rounded corners by option (to verify) | Band padding 0.1 (to verify) | Stacks by sign by default (to verify); `barY` implies a zero baseline | None by default | None | The sign stack and the zero baseline |
| Highcharts (accessibility module) | Rounded `borderRadius` by default since version 11 (to verify) | `pointPadding` 0.1, `groupPadding` 0.2 (to verify) | Stacking with negatives | Arrow keys move point to point and Up and Down move between series; each point is focused and announced; a screen reader section before the chart (to verify) | A data table export option | Per-bar focus; series moved by the cross axis |
| Visa Chart Components | Square (to verify) | | | One tab stop into the chart, arrow keys between marks, Enter and Shift with Enter to move into and out of groups, instructions in a hidden region (to verify) | A data table component beside every chart; textures for accessibility | Per-bar focus; textures as the backup channel |
| WAI-ARIA and the WAI tutorials | | | | No chart pattern in the Authoring Practices; the roving tab index technique from "Developing a Keyboard Interface"; the Graphics ARIA module's `graphics-symbol` with uneven support (to verify); the Images tutorial's "complex images" ask for the data as a table or a long description | The data as a table | The roving tab index, `role="img"` on each bar, the table as the alternative |

## 8. Prose

### 8.1 The class and the wrapper

**`.prose`** in `prose.css` in core, imported by `styles.css` after `heading.css` and `link.css`. Any element with it styles the long-form HTML inside.

**`Prose`** in `@snapshot-ui/react`, a server part:

```ts
export interface ProseProps extends HTMLAttributes<HTMLElement> {
  /** `article` for a piece that stands alone (a help article), `section` for a part of a page with its own heading. @default 'div' */
  as?: 'div' | 'article' | 'section';
  ref?: Ref<HTMLElement>;
}
```

It renders the element with `className={cx('prose', className)}` and its children. No state, no hook, no client directive.

- **HTML from a CMS or a renderer.** The library never parses or injects HTML. An app that has HTML passes it to React its own way, which React names `dangerouslySetInnerHTML` and which reaches the element as any attribute does; the docs say to sanitize it first (DOMPurify or sanitize-html, to verify current names) and to render Markdown on the server where possible. There is no `html` prop (open question 20).
- **`not-prose`.** A subtree under `.not-prose` is left alone, so a Badge, a Button or a chart in an article draws as itself. Every rule's selector is `.prose :where(<element>):not(:where(.not-prose, .not-prose *))`, Tailwind Typography's mechanism.
- **Zero extra specificity.** `:where()` keeps every rule at one class, the specificity of a component's own class, and `prose.css` sits before the components in `styles.css`, so a component inside prose wins on order even without `not-prose`. The test renders every component inside `.prose` and asserts none changes.

### 8.2 The elements

| Element | Look | From |
| --- | --- | --- |
| `p` | `--text-body` size and weight (16px, 450), line height 1.6, ink | The docs' prose rule; WCAG 1.4.12's spacing is met by default |
| `h1` | The `heading-2` step: 36px, 28px under 768px, 500, -2% | A page's display `h1` is a hero, not an article's title; the docs map MDX's `##` one step down the same way |
| `h2` | The `heading-3` step: 24px, 500, -2% | The docs' MDX `h2` |
| `h3` | The `heading-4` step: 14px, 700, ink | The docs' MDX `h3` (open question 16) |
| `h4`, `h5`, `h6` | The `heading-4` step; `h5` and `h6` in slate | No step below; slate is read text |
| `a` | The Link record: link blue, 1px underline at 0.25em offset, 2px on hover and press, the focus ring with `--radius-micro`, breaks anywhere | Restated in `prose.css` on the same tokens; the CSS test pins it to `link.css` |
| `strong`, `b` | 700 | 500 against 450 is a step a reader barely sees at 16px (open question 17) |
| `em`, `i` | The italic face | `base.css` turns synthesis off, so the app must load the italic (risk R9) |
| `ul`, `ol` | `padding-inline-start: 1.25rem`, items 8px apart (a part step), markers slate, `ol` markers tabular; nested `ul` disc, circle, square; nested `ol` decimal, lower-alpha, lower-roman | The docs' lists; markers are not the text the reader reads first |
| `li > p` | 8px apart inside an item | Parts of one thing |
| `blockquote` | `border-inline-start: 2px solid var(--color-frame)`, `padding-inline-start: 1.25rem`, ink text, no italics, no quote marks drawn | The rule is a cue; the indent equals a list's, so a quote's text and a list's text share an edge |
| `code` (inline) | `--font-mono` at 0.875em, `--color-bone`, `--radius-micro`, `padding: 1px 6px`, `direction: ltr`, `unicode-bidi: isolate` | The docs' inline code |
| `pre` | The docs' `.code`: `--color-bone`, a 1px `--color-frame` edge, the frame radius below, `padding: 1.25rem 1.5rem`, `--font-mono` at 0.875rem and 1.7, `overflow-x: auto`, `tab-size: 2`, `white-space: pre`, `overflow-wrap: normal`, left to right, the focus ring on `:focus-visible`, and the docs' `--shiki-*` mapping onto the palette | Moved from `apps/docs/app/site.css`, so highlighted code never borrows a reserved color |
| `table` | Full width of the prose box, `border-collapse: collapse`, `--text-small`, tabular figures; `th` 500 in slate, `td` ink; cells `padding: 0.5rem 0.75rem` with a 1px `--color-divider` rule under each row; text from the cell's `align` or `style` (GFM writes one); `caption` slate at the start; cells break anywhere | LineChart's table, so a table in an article and a chart's table are one look |
| `figure`, `img`, `video` | `figure` no margin of its own; `img` and `video` `display: block`, `max-inline-size: 100%`, `block-size: auto`, the frame radius; `figcaption` `--text-small` slate, 8px under | A picture is a framed block |
| `hr` | No border but a 1px `--color-divider` top, `--spacing-separate` above and below | A rule inside a surface |
| `kbd` | The Kbd record, restated | |
| `mark` | `color-mix(in srgb, var(--color-signal-light) 20%, transparent)` over the surface, ink text: 14.63 on Lifted in light and 12.86 in dark | Light signal orange is the attention cue, which a highlight is; never body color, and here it is a wash under ink |
| `sup`, `sub` | `line-height: 0`, so a footnote mark does not open its line | |
| `dl` | `dt` at 500, `dd` indented 1.25rem, 8px under its `dt` | A list's indent |
| GFM footnotes (`section.footnotes`, `data-footnotes`) | `--text-small`, slate, under an `hr` | Primer's treatment (to verify) |

**The frame radius.** A framed block (`pre`, `img`, `video`) is concentric with a holder it sits in and takes the surface step where nothing holds it: `max(var(--radius-micro), calc(var(--holder-radius, var(--radius-surface)) - var(--holder-border, 0px) - var(--holder-pad, 0px)))`. In a Card that is 7px in Rounded (19px compact), the micro step in Soft and 0 in Square; on a page it is `--radius-surface`. It applies to every framed block in the prose, not only one in the card's corner, the docs' rule for `.code` in a card ("a code block set in a card is concentric with it"), so no block's corner depends on where it falls.

### 8.3 Rhythm and measure

**The gap says how related two things are** ("Vertical rhythm, derived"). Every flow child after the first gets a top margin, and nothing gets a bottom margin, so collapsing never decides a gap:

| Between | Gap | Step |
| --- | --- | --- |
| Two blocks (paragraphs, a paragraph and a list, a table, a figure, a quote) | 24px | peers |
| Anything and a following `h1` or `h2` | 32px | separate |
| Anything and a following `h3` to `h6` | 24px | peers |
| A heading and what follows it | 8px | parts of one thing |
| Two list items, a nested list and its item, paragraphs in an item | 8px | parts |
| An `hr` and its neighbors | 32px each side | separate |
| A figure and its caption | 8px | parts |

The first child takes no top margin and the last none at the bottom, so `.prose` fits a Card's body or a page column with that holder's own rhythm. A heading after a heading takes 8px (the second is part of the first's section). The steps are rem, so they follow the reader's text size.

**The measure.** Text blocks (`p`, `li`, headings, `blockquote`, `dl`, `figcaption`, footnotes) stop at `--prose-measure`, 70ch by default, the docs' prose measure; at 16px in Sofia Sans that is about 75 to 80 characters of running text, inside the 45 to 80 that readability guides give (the plan measures the average line in the docs' example and records it). Tables, code blocks, figures and rules take the prose box's full width, since their lines are not read as sentences. An app sets `--prose-measure: none` for a narrow column, or a smaller value.

**Headings and the outline.** Prose cannot renumber headings. A Markdown `#` in a page that has its own `h1` makes a second `h1`; the docs tell the app to shift headings by one in its renderer (a rehype plugin, to verify the current one) and note that the look follows the element. Headings take `scroll-margin-block-start: var(--prose-scroll-margin, 0px)`, which an app sets to its sticky header's height so an anchor link does not land under it.

### 8.4 Nested content

Lists in lists, quotes in list items, lists and code in quotes, and tables in quotes all take the same rules, since every rule is per element and every gap per sibling. A nested list sits 8px under its item's text. A code block in a list item is indented with the item and keeps its full remaining width. A quote in a quote adds a second rule and indent. The test renders a nesting fixture four levels deep and asserts no horizontal overflow at 320px.

### 8.5 Components inside prose

An app that mixes rendered HTML with components (a chart in a monthly summary, a Badge in a help article) wraps them in `.not-prose`, or relies on `:where()` and order (section 8.1). The docs' example puts a BarChart, a Badge and a Button inside an article; a story asserts each looks as it does outside.

### 8.6 Right to left and Persian

- **Logical properties throughout:** list padding, quote rules, `dd` indents and `text-align: start` all follow the direction, so a Persian article's markers and rules are at the right.
- **Code is left to right.** `pre` is `direction: ltr; text-align: left`; inline `code` is `direction: ltr; unicode-bidi: isolate`, so a path in a Persian sentence keeps its order and does not reorder the words around it.
- **Numbers.** Ordered lists under `:lang(fa)` count in Persian digits (`list-style-type: persian`, supported in Chromium and Firefox, to verify in WebKit; a fallback to decimal is harmless); open question 22. Figures in the text are the app's.
- **Tracking.** The heading steps carry -2% tracking, and spacing letters breaks the joins of a cursive script. Under `:lang(fa)` and `:lang(ar)` prose headings take `letter-spacing: normal` (CSS Text says a browser should not space cursive scripts, and engines differ, to verify); the same fix is owed to `Heading`, recorded as a follow-up in risk R11.
- **The font.** Sofia Sans has no Arabic script, so a Persian page's `--font-sans` names a Persian face first (the docs' example uses Vazirmatn, under the OFL, to verify). The 1.6 line height leaves room for Persian's taller marks.
- **Mixed paragraphs.** A paragraph's direction is its element's. User content that mixes English and Persian paragraphs wants `dir="auto"` on each, which the renderer writes; Prose does not set `unicode-bidi: plaintext` (open question 23).

### 8.7 Dark mode and forced colors

- **Dark.** Every color is a token, so dark mode is the tokens' dark values: ink text white, slate at 60%, link blue lifted, bone `#252523` for code. Charcoal at 85% on dark bone, the code's text, measures 11.41; slate on dark bone 6.45; link blue on dark bone 4.81. In light: charcoal on bone 13.75, slate on bone 4.99, link blue on bone 5.33. Images are not inverted or dimmed.
- **Forced colors.** Text, links and borders take the reader's palette by themselves. Inline code carries a 1px transparent border, which forced colors paints in the text color, so code stays marked when its fill is dropped; `pre` keeps its border; `mark` takes `Mark` and `MarkText` (to verify support; `Highlight` and `HighlightText` as the fallback); the quote's rule and the `hr` take `CanvasText`. The focus ring on a scrolling `pre` is `Highlight`.
- **Print.** `pre` wraps (`white-space: pre-wrap`) under `@media print`, so long lines are not cut.

### 8.8 Card and PageColumn

- **In a Card.** `Prose` is one child of the card body, which spaces its children by its own 24px; prose's first and last children carry no outer margin, so the card's padding is the article's inset. The Card sets `overflow-wrap: anywhere` for everything it holds, and prose's `pre` sets `overflow-wrap: normal` and `white-space: pre` back, so code scrolls rather than breaking mid-token. Framed blocks take the card's concentric radius (section 8.2). A card's own title stays the Card's; an article in a card starts at its first paragraph or at an `h2` (the docs' pattern).
- **In a PageColumn.** An article page is a `PageHeader` and a `PageColumn` holding `Prose as="article"`. The column is `--container-page` wide; the measure keeps text at 70ch from the column's start edge, aligned with the header's title, and tables and figures use the column's width. Prose is not centred in the column: GOV.UK's two-thirds column and the docs both keep reading text on the start edge (GOV.UK's grid, to verify the class name).
- **Beside a SidePanel or in a narrow card,** `--prose-measure` is larger than the box, so nothing changes; nothing in prose is a container query.

### 8.9 How others do it

| System | Shape | Measure and rhythm | Headings | Code and tables | What this spec takes |
| --- | --- | --- | --- | --- | --- |
| Tailwind Typography | A `prose` class on a wrapper, sizes `prose-sm` to `prose-2xl`, `prose-invert` for dark, `not-prose`, element modifiers (`prose-a:`) | `max-width: 65ch`, line height 1.75, paragraph margins 1.25em (to verify) | `h1` 2.25em at 800, `h2` 1.5em, `h3` 1.25em, `h4` 1em (to verify) | Inline code drawn with backticks; `pre` on a dark fill; tables with rules (to verify) | The class, `not-prose`, `:where()` specificity; not its sizes, weights or grays |
| GitHub Primer, `markdown-body` | A wrapper class, styles every element | No max width; 16px at 1.5; blocks 16px apart (to verify) | `h1` 2em and `h2` 1.5em with a rule under each; `h6` muted (to verify) | Code on a subtle fill; tables with borders and striped rows (to verify) | A muted last heading level; footnotes small and muted |
| GOV.UK Frontend | A class per element (`govuk-body`, `govuk-list`, `govuk-heading-l`), no descendant wrapper | Body 19px (16px on a phone) at about 1.32; content in a two-thirds column; spacing on a fixed scale (to verify) | `govuk-heading-xl` 48px to `govuk-heading-s` 19px, bold (to verify) | Tables with a header rule; inset text with a 5px rule (to verify) | The start-edge column; a quote's rule; one spacing scale; not a class per element, since the library styles HTML it does not write |

## 9. Accessibility

- **Roles and names.** BarChart: a `figure` named by the app; a `group` with `aria-roledescription` (`labels.roleDescription`) holding the bars, named as the figure; each bar `role="img"` with `aria-roledescription` (`labels.bar`) and a name from its table cells; a `table` named as the chart; a `button` toggling it; a polite `status`. Prose: the app's own elements; `Prose` adds none, or an `article` or `section` when asked (an `article` is not a landmark; a `section` is a region only when named, which the docs explain).
- **Keyboard (2.1.1, 2.4.3).** Every bar is reachable; one tab stop; the order follows the drawing; Escape never traps; keys not used are not prevented. A scrolling `pre` must be focusable to be scrolled by keys: Chromium makes scrollable regions focusable by itself since version 130 (to verify), and the docs ask the renderer to add `tabindex="0"` to a `pre` for the other engines.
- **Focus visible (2.4.7) and not obscured (2.4.11).** The ring on the bar, concentric; the readout never covers the active bar.
- **Never color alone (1.4.1).** Two or more series have a legend with labels; each bar's name says its series; textures on request and in forced colors; the zero line and the figures say the sign; links in prose are underlined.
- **Non-text contrast (1.4.11).** Every bar color 3:1 or more on every surface (sections 5.2 and 7.11); the pointer's dimming is a transient emphasis, recorded.
- **Text spacing and reflow (1.4.12, 1.4.10).** Prose at 1.6 line height and margins in rem; nothing in either part scrolls sideways at 320px except a `pre` or a table inside its own box.
- **Targets (2.5.8).** A bar is reached by its whole band, never only its drawn width; a horizontal row is at least 40px; the toggle is a Button. Inline links in prose are exempt, as the Link record says.
- **Screen readers.** `role="img"` on a focusable element, `aria-roledescription` and names from hidden cells are read by VoiceOver and NVDA as expected in principle; the pass with both is owed before the release (risk R3), as it is for LineChart.
- **Axe** passes in light and dark for every story, with the table open and closed, in every status.

## 10. Testing

- **Core (`css.test.js`, `token-only.test.js`, `contrast.test.js`).** `prose.css` and the new rules in `charts.css` are tokens only, in `@layer components`, with system colors only in their forced-colors blocks and logical properties throughout; `prose.css` rules all use `:where()` and the `not-prose` guard; the prose link values equal `link.css`'s and the `pre` values the docs' `.code`; no chart token in a `color:` declaration. The contrast test gains the palette's twenty-four graphic pairs, and a palette test ports the method's checks (lightness band, chroma floor, adjacent CVD at least 8 under Machado 2009, normal at least 15, at least 10 from every reserved color) and fails if a token edit breaks one.
- **Charts (Vitest, jsdom).**
  - The foundations: `valueDomain`, `placeReadout`, `moveFrom`, `chartName` with fixed inputs; the stacking function by sign; the band and thickness custom properties written for each layout.
  - LineChart, unchanged: its suite passes untouched after the move.
  - BarChart: bars' insets and sizes as percentages for positives, negatives, stacks of mixed sign and zero; `[data-nonzero]`; the domain widened to zero with its warning; colors by section 5.4 and by `color`; the sixth-series warning; each bar's `aria-labelledby` resolving to category, series and value; the roving tab index after mount and none in the server's HTML; every key in both orientations, both layouts and both directions, Escape stopped once, modifiers ignored, unused keys not prevented; the first stop for time and category bands; the pointer snapping to bands; value labels and the reserved `ch` room; `totals` in the labels, the readout and the table, and their warning; each status's markup, `aria-busy` and the status text; `statusContent`; the table and the toggle; axe in each state.
  - Server render: BarChart in the server-render and hydration suites under three locales and two zones.
- **React.** `Prose`: the element by `as`, the class merged, attributes passed through (including React's raw HTML attribute), a server render with no client code; axe over a fixture of every element in section 8.2.
- **Storybook.** Section 11's stories, baselined in the four theme and shape modes and at 375px, compact where tagged. Play tests in the four story projects (Chromium light and dark, WebKit, Firefox): the keys of every layout and orientation, in right to left too (`no-visual`); the pointer's band snapping and dimming; the readout's placement at both ends; the table toggle; the concentric audit on every new story in three shapes; a story putting library components in `.prose` asserting their computed styles equal the same components outside; the focus ring's corner radius equal to the bar's plus the offset, measured in three engines (risk R12).
- **Docs e2e.** Completeness maps for the new pages; 320px with no sideways scroll for both parts and the recipe; the chart's table with scripts on and off; forced colors on a stacked chart (textures) and on prose (inline code edge, `mark`); a Persian prose page's markers at the right and code left to right.

## 11. Docs and stories

- **Pages.** `charts/bar-chart` beside the line chart in the "Charts" group, leading with "Bar, line or stat tile" (a bar compares amounts across categories or periods, a line shows a change over continuous time, a tile says one figure); sections for orientation, grouped and stacked, negatives, time bands, value labels, long labels, states, color and the palette, keys and accessibility. `charts/palette` (or a section of `theming`, the plan decides) with the four tokens, the rules of section 5.3 and the measurements. `components/prose` with every element, rhythm and measure, `not-prose`, in a Card, in a PageColumn, right to left, and "Rendering Markdown and CMS HTML safely". The `line-chart` page gains its states.
- **The Insights recipe**, with the Next App Router: a PageHeader "Insights"; a Card "Spending by category" (stacked, twelve months, four categories and Other, totals); a Card "Money in and out" (grouped, `gain` Income and ink Spending); a Card "Net" (one series with negatives, zero line, value labels at the ends); a Card "Top merchants" (horizontal, long names, value labels); and an `article` with the month's summary as Prose rendered from Markdown on the server. Sample content keeps the reservations: no red or green for down and up, `gain` only on Income.
- **Stories:**
  - `Charts/BarChart`: `Default` (vertical, one series), `Horizontal`, `Negatives`, `NegativesHorizontal`, `Grouped` (ink and slate), `Stacked` (palette and Other, totals), `StackedNegatives`, `TimeBands` (31 days), `ValueLabels`, `LongLabels` (vertical, clamped), `LongLabelsHorizontal`, `Narrow` (horizontal in a 20rem frame, labels above), `ActiveBar` (a play focuses a bar: ring and readout), `PointerBand` (dimming), `TableView`, `Loading`, `Empty`, `Error`, `Textures`, `GainSeries`, `InCard` (density); `Keys`, `KeysHorizontal` and `NoScript` as `no-visual`.
  - `Charts/LineChart`: `Loading`, `Empty`, `Error`.
  - `Components/Prose`: `Default` (every element), `InCard` (density), `InPageColumn`, `Nested`, `CodeAndTables` (a long line, a wide table), `Figures`, `WithComponents`.
  - `Pages/Insights`: the recipe.
  - `rtl/RightToLeft.stories.tsx`: `BarChart`, `BarChartHorizontal` and `Prose` in Persian.
- **Design record:** Appendix B sections "Chart palette", "BarChart" and "Prose", with every derived value, its reason and the measured pairs; "Charts" loses "There is no palette" and gains the color table of section 5.4; "Nested radii, derived" names a bar's data end among the parts that keep the micro step.

## 12. Responsive, right to left and server rendering, together

- **320px.** BarChart in a Card at 248px: vertical bars thin, labels follow section 7.13; horizontal labels go above bars. Prose at 248px: text wraps, `pre` and wide tables scroll in their own boxes, images shrink.
- **Right to left.** Sections 7.12 and 8.6; the stories in `rtl/RightToLeft.stories.tsx`.
- **Server.** BarChart's server HTML is its final picture (section 7.14); Prose is static. Neither reads `window`, formats or measures before the first paint.

## 13. Decided here

1. Four chart tokens, `chart-1` to `chart-4` (teal, violet, olive, magenta), with light and dark values, at least 30 degrees of hue and 10 of distance from every reserved color, passing the method's checks on adjacent pairs in both modes, and 3:1 on every surface; slate as the fifth, "Other".
2. One series ink; two grouped ink and slate; stacks and three or more from the palette; `color` pins a series; `gain` only for money that arrived; no loss color.
3. LineChart's table, legend, readout placement, keys, naming and active state move to `src/foundations/`, with no change LineChart's tests or baselines can see.
4. Bars are HTML over an svg of gridlines; thickness, placement and room are CSS `calc()` on values written in render; nothing is measured.
5. Bars at most 24px thick and 60% of their band, 2px apart in a group; horizontal rows at least 40px tall.
6. The value axis always includes zero; a domain without it is widened with a warning; any nonzero value draws at least 1px.
7. Stacks diverge by sign; grouped and stacked are both in scope.
8. The data end takes `--radius-micro` (6px, 6px, 0), the baseline end is square, inner joins are square with a 2px surface gap; the focus ring is concentric by the outline's offset.
9. The zero line is `--color-boundary` when the domain crosses zero and `--color-frame` otherwise.
10. Value labels off by default, outside the data end, ink, left to right; stacks label their totals; room reserved by line height (vertical) and by `ch` count (horizontal).
11. Category labels never rotate: vertical clamps at two lines, time bands show ticks, horizontal wraps in a `fit-content(40%)` column and goes above the bar under 24rem.
12. One tab stop that is the active bar, a roving tab index set after mount, each bar `role="img"` named by its table cells; arrow keys move to the bar drawn in that direction; no live region.
13. The pointer's hit area is the band; the other bands dim to 40% under a pointer only.
14. `status` with loading (skeleton bars, `aria-busy`, one polite word), empty and error (the app's content or a sentence), keeping the figure's size, with their strings in `ChartStatusLabels`; LineChart gains the same.
15. Textures on request and always in forced colors: solid, 45, 135, both, slate.
16. `.prose` with `:where()` rules and `not-prose`; `Prose` a static wrapper with `as`; no `html` prop.
17. Prose type: `h1` to `h3` take the heading steps two to four, `h4` to `h6` the fourth, `h5` and `h6` slate; body at 1.6; `strong` 700.
18. Prose rhythm from the system's steps (8, 24, 32), top margins only, first and last trimmed; measure 70ch on text blocks only.
19. Prose's `pre` is the docs' code block moved to core, with its Shiki mapping; framed blocks take the holder's concentric radius or the surface step.
20. Prose code is left to right in right-to-left pages; headings lose tracking under `:lang(fa)` and `:lang(ar)`; ordered lists count in Persian digits under `:lang(fa)`.
21. The docs site has no `.bar-chart` or `.prose` classes outside the library's to collide with; its `.docs-section` prose rules stay (open question 21). The plan checks again.
22. One 0.9.0 minor release of core and react and a 0.2.0 minor release of charts with its core peer at `^0.9.0` (section 18).

## 14. Risks

- **R1. Class collisions.** `.prose` is also Tailwind Typography's class, and an app with both gets both. Mitigation: the docs say not to load the plugin beside the library's prose, and the library's rules sit in `@layer components`, where an app's unlayered plugin output would win, which the docs show; the parent spec's R1 covers unprefixed classes in general (open question 15).
- **R2. Many elements.** 31 bands by five series is 155 bars, fine; 365 daily bars is a list, not a chart. Mitigation: the docs cap a vertical chart at about 60 bands and point to LineChart past that; a story renders 120 bands to bound the cost.
- **R3. Screen reader support for focusable images.** `role="img"` with a roving tab index and `aria-roledescription` is read as intended in principle, but readers differ on the description and on images in focus mode. Mitigation: the names carry everything without the description; a VoiceOver and NVDA pass before release, recorded as not yet verified until then.
- **R4. Names from hidden cells.** The accessible name computation includes hidden content referenced by `aria-labelledby`, which every engine implements (to verify in WebKit with VoiceOver). Mitigation: a play test reads each bar's computed name in three engines; the fallback is an `aria-label` joined from the three strings with a space, as the live region's parts were.
- **R5. A container in a shrink-to-fit parent.** As StatTile and the accounts list. Mitigation: `contain-intrinsic-inline-size: 20rem` and a story in a flex row.
- **R6. The refactor.** Moving LineChart's insides could change it. Mitigation: the move is its own commit with LineChart's tests and baselines unchanged and its size within 0.1 kB.
- **R7. The palette's near neighbors.** Olive is 4.4 from warning under deuteranopia in light, violet 2.9 from link blue under deuteranopia in dark, teal 10.2 from success in dark. Mitigation: no chart draws a status or a link beside a series (the meaning rules, enforced by the `ChartColor` type), every series has a legend label and a bar name, and textures are one prop away.
- **R8. Untrusted HTML.** Prose styles what an app renders, and an app that renders a CMS's HTML unsanitized has a cross-site scripting hole the library cannot see. Mitigation: no `html` prop, the docs' safe rendering section, and the docs' examples render Markdown on the server.
- **R9. No italic face.** `base.css` sets `font-synthesis: none`, so `em` in prose draws upright if the app loaded only the roman face. Mitigation: the installation docs load the italic axis too, and the Prose page says so; a story draws `em` and the baseline shows it.
- **R10. The `ch` estimate.** Room for horizontal value labels is the longest label's code points in `ch`; a label of letters wider than a zero (a currency word) can overrun by a character. Mitigation: the reserve adds 0.25rem, the track's end padding absorbs the rest, and `--bar-chart-value-room` lets an app set it.
- **R11. Tracking and cursive scripts.** Headings' -2% tracking spaces Persian letters in engines that apply it. Mitigation: prose resets it under `:lang(fa)` and `:lang(ar)`; the same reset for `Heading` is a follow-up the plan records, since it changes a shipped part.
- **R12. The outline's corner.** An outline follows `border-radius` in Chromium, Firefox and WebKit at the browser floor (to verify for Safari 16.4). Mitigation: the play test measures the ring in three engines; the fallback is a `box-shadow`-free ring drawn as a pseudo-element border with the radius plus the offset.

## 15. Open questions

Each has a recommended answer; the owner may take it or the alternative.

1. **The consumer's Insights page.** The repository records no verbatim batch 6 request, so section 3 is inferred from the agreed scope. Recommended: send section 3 to the consumer to confirm before the plan, in particular whether it compares periods side by side (grouped) and how many categories a stack holds (four and Other, or more).
2. **Grouped bars.** The agreed scope says stacked, not grouped. Recommended: include grouped, because comparing this month with last month per category is the commonest insight chart, and its cost is layout only (the keys, colors and table already handle several series). Alternative: stacked only now, grouped when the consumer asks, which saves about six stories.
3. **The palette.** Recommended: the four hues of section 5.2, as tokens, with slate as "Other". Alternative: no new hues, stacks drawn as an ink ramp, which keeps the system monochrome but encodes an order the categories do not have.
4. **The palette's size.** Recommended: four. Alternative: six, adding a sky and a raspberry; it passes the adjacent checks (9.5 worst) but puts the sky 5.7 from the teal for normal vision and the raspberry 10.4 from error.
5. **Bar ends.** Recommended: `--radius-micro` at the data end in Rounded and Soft, square in Square, square at the baseline. Alternative: Meter's pill (a half circle at the data end in Rounded and Soft), closer to the system's stadium language but hiding the value at the top of a curve and turning short bars into dots.
6. **The focus model.** Recommended: per-bar roving focus for BarChart, LineChart unchanged in this batch, and LineChart's points reconsidered after the screen reader pass of risk R3. Alternative: BarChart on LineChart's model (one focusable plot, a live region), one model for both charts but no ring on the bar and a live region a screen reader may cut short.
7. **Pointer emphasis.** Recommended: dim the other bands to 40% under a pointer. Alternative: a band wash behind the active band (Carbon's and Recharts' cursor, to verify), which adds a shape whose corners must be concentric with bars of varying height and gap.
8. **Value labels inside bars.** Recommended: never; outside the end only. Alternative: inside when the app says it fits (`valueLabelPlacement`), which the library cannot check without measuring.
9. **Long category labels in a vertical chart.** Recommended: two lines then an ellipsis, with the docs steering long labels to a horizontal chart. Alternative: wrap without a limit, which can make the label area taller than the plot.
10. **States on LineChart too.** Recommended: yes, in this batch, from the shared frame. Alternative: BarChart only, leaving LineChart's states to the app.
11. **Textures.** Recommended: `hasTexture` off by default and always on in forced colors. Alternative: textures on by default for stacks, safer for color-blind readers but busier than the system's quiet surfaces.
12. **A color for money out.** Recommended: none; spending is ink and a negative is ink below zero, the NumberField record's rule. Alternative: a "loss" token, which the system has never had and which would be read as error.
13. **Bars that act.** Recommended: not in this batch; a bar's band links to nothing, and an app puts its links in the table or beside the chart. Alternative: `onBarAction` (Enter, Space and a press) or an `href` per value, a drill-down Highcharts and Visa Chart Components support (to verify), with a router and a second key model.
14. **Orientation by width.** Recommended: no; the app picks `orientation`, and a narrow horizontal chart puts labels above its bars. Alternative: vertical over 30rem and horizontal under, by container query, which the HTML bars make possible but which changes the keys and the reading order with the box.
15. **The class name `prose`.** Recommended: `prose`, as agreed, with the docs' note about Tailwind Typography (risk R1). Alternative: `article-body` or `rich-text`, free of the collision but unfamiliar to every Tailwind user.
16. **A heading step for `h3`.** Recommended: no new step; `h3` takes the 14px, 700 subhead, the docs' own MDX rule. Alternative: a 20px step for prose `h3` (Tailwind's and Primer's 1.25em, to verify), which needs a measured reason in the type scale and a token.
17. **Bold.** Recommended: `strong` at 700. Alternative: 500, the headings' weight, which keeps bold quieter but which readers can barely tell from 450 at 16px.
18. **The measure.** Recommended: 70ch on text blocks, the docs' value. Alternative: 65ch on the whole box, Tailwind's, which also narrows tables and code.
19. **A small size.** Recommended: one size now. Alternative: a `prose-small` variant at the small step for side panels and help popovers, added when the consumer needs it.
20. **HTML input.** Recommended: children only; React's raw HTML attribute passes through for an app that has sanitized HTML. Alternative: an `html` prop, shorter to use but an invitation to render unsanitized strings.
21. **Dogfooding Prose in the docs.** Recommended: move the docs' code block to core's `pre` look now (one source of truth), and move the docs' MDX sections onto `.prose` in the next batch, after the consumer has used it, since the docs' section notes and preview stages need their own exceptions. Alternative: move the MDX sections now, one docs task with no screenshot baselines but a check of every page.
22. **Persian list numbers.** Recommended: Persian digits under `:lang(fa)` by default. Alternative: decimal everywhere unless the app sets `list-style-type`, which leaves Latin digits in a Persian article.
23. **Mixed-direction paragraphs.** Recommended: the renderer writes `dir="auto"` per paragraph; Prose sets nothing. Alternative: `unicode-bidi: plaintext` on text blocks, automatic but with alignment that differs by engine (to verify).
24. **The next charts.** Recommended: area (LineChart's `hasArea` grown into stacked areas) before donut, since a donut's arcs are the gauge's and an area's paths are already in `path.ts`. Alternative: donut first, if the consumer's Insights page wants a share of the month at a glance.

## 16. Size budget

Measured as the others, without React, React Aria and Lucide, to start at:

| Entry | Budget | Reason |
| --- | --- | --- |
| `{ BarChart }` | 5.5 kB | LineChart's entry measures 3.25 kB with its table, keys and readout; BarChart shares those through the foundations and adds stacking, two orientations, the roving focus and the states, estimated at 4.5 to 5 kB; the rule rounds up and adds 0.5 kB |
| `{ LineChart }` | 4 kB, unchanged | The refactor may not grow it by more than 0.1 kB; the states add about 0.3 kB, inside the same limit |
| `{ LineChart, BarChart }` | 7.5 kB | The shared foundations counted once; a new entry, so an app that uses both sees the saving |
| `{ Prose }` | 0.5 kB | One element |

The CSS adds about 6.5 kB to `styles.css` before compression: the bar chart about 3.5 kB in `charts.css` (shared selectors keep LineChart's rules from being written twice), `prose.css` about 3 kB, and eight color declarations in the tokens. A part over its budget is reported with the number, as 3c's SidePanel was, and the limit follows the rule: the measured entry rounded up to 0.5 kB, plus 0.5 kB.

## 17. Visual baseline estimate

Each visual story is baselined in five modes (Rounded light, Rounded dark, Soft light, Square light, Rounded light at 375px), and a story tagged `density` adds compact, six.

| Group | Visual stories | Of them with compact | Baselines |
| --- | --- | --- | --- |
| BarChart | 21 | 1 (`InCard`) | 106 |
| LineChart states | 3 | 0 | 15 |
| Prose | 7 | 1 (`InCard`) | 36 |
| Pages/Insights | 1 | 1 | 6 |
| Right to left (`BarChart`, `BarChartHorizontal`, `Prose`) | 3 | 0 | 15 |
| **New** | **35** | **3** | **178** |

Existing baselines: none should change. LineChart's 40 are the refactor's proof (section 6) and must stay byte-identical; `charts.css`'s shared selectors draw the same values; no existing story draws `.prose` or a chart token. Expect 165 to 190 new files, depending on how the plan splits BarChart's layouts and states into stories; any change to an existing baseline is investigated before it is committed, and every new one goes through `pnpm --filter @snapshot-ui/storybook visual:docker`.

## 18. Release

- **Changesets.** For `@snapshot-ui/core` and `@snapshot-ui/react`, minor, released together as 0.9.0: `chart-palette.md` (the four tokens and their Tailwind names), `prose.md` (`prose.css`, `Prose`, `ProseProps`). For `@snapshot-ui/charts`, minor, 0.2.0: `bar-chart.md` (BarChart and its types: `BarChartProps`, `BarSeries`, `BarValue`, `BarChartLabels`, `ChartStatusLabels`, `ChartColor`), `line-chart-status.md` (LineChart's `status`, `statusContent` and `statusLabels`).
- **The core peer.** Charts' `@snapshot-ui/core` peer is `workspace:^`, which publishes as a caret on core's version at release, `^0.9.0`. A 0.x caret accepts only its own minor, so charts 0.2.0 needs core 0.9, and it must: BarChart reads the `--color-chart-*` tokens and the bar rules that only core 0.9.0's `styles.css` has. The charts changeset says so, as each earlier peer patch did; and from here every core minor needs a charts release that moves the peer again, as batches 3a to 5 did.
- **`LineChartLabels` does not grow.** The type requires all its labels together (the LineChart record), so adding `loading`, `empty` and `error` to it would break every app that passes `labels`. The three live in `ChartStatusLabels`, a separate optional prop with English defaults on both charts, so LineChart's change is additive and stays inside a minor.
- **Release note for the consumer:**
  - Upgrade `@snapshot-ui/core` and `@snapshot-ui/react` to 0.9.0 and `@snapshot-ui/charts` to 0.2.0 together; charts 0.2.0 refuses core 0.8.
  - Every figure is your string, including a stack's `totals`; the chart never sums or formats.
  - Pass `color` on a series whose entity must keep its color when a filter removes another; `gain` only on a series of money that arrived; never red or green for direction.
  - Bars always start at zero; a `valueDomain` without zero is widened.
  - A chart of more than four peers folds the rest into an "Other" you sum and label.
  - Pass `labels` (all six for BarChart) and `statusLabels` (all three) on a Persian page, and Persian digits in every string.
  - Long category names want `orientation="horizontal"`.
  - Prose styles HTML you render: sanitize CMS HTML first, shift Markdown headings so the page keeps one `h1`, load Sofia Sans's italic, and wrap components inside an article in `not-prose` when in doubt.
