# Insights: BarChart, the chart palette and Prose: design

Status: approved on 2026-10-18. Written for review and revised the same day with the consumer's answers to open question 1 (section 3); the owner then took every recommendation of section 15, and section 19 records the rulings. Everything else is decided here and listed in section 13.
Parent spec: `docs/specs/2026-10-10-snapshot-ui-design.md`. This document takes the next slice of phase 6, "Charts" (its bar chart and the chart palette derivation the parent spec requires before any chart with a palette is built), and adds Prose, which the parent spec does not list. It answers batch 6 ("Insights") of the first consumer's roadmap, agreed with the consumer as BarChart and Prose. The design authority remains `docs/design-system.md`.
Released before this: batch 5 ("Accounts"), `@snapshot-ui/core` and `@snapshot-ui/react` 0.8.0 (`docs/specs/2026-10-18-accounts-design.md`, on `docs/accounts-spec` at the time of writing), with the `@snapshot-ui/charts` patch that moves its core peer to `^0.8.0`. This batch is the 0.9.0 minor release of core and react and a minor release of `@snapshot-ui/charts`. Section 2 lists what it takes from batches 1 to 5.

## Summary for the owner

What this batch adds, in plain words, in the order the consumer needs it:

- **BarChart**, the third chart, first. Bars lying down for a ranked list (spending by category, merchant or account: the top 8 to 12 and an "Other", the name at the start of each row and the amount at the end, refunds pulling a row below zero), and bars standing up for months (income beside spending, or net cash flow above and below a zero line). Any view can be compared with the previous period: this period's bar beside last period's, drawn in the same color but striped, so "this and last" never reads as two categories. A table of the same figures sits behind a button, and the chart has a loading, empty or error state in its own space. A keyboard user moves from bar to bar with the arrow keys, and each bar says its category, its series and its figure.
- **Prose**, second: a style for long-form text the app does not write by hand, here a monthly report and a weekly coaching note written by a model in Markdown, later Ask answers, and a goals guide in English and Persian. One class, `prose`, or the `Prose` wrapper, gives every heading, paragraph, list, quote, code block, table and rule the library's type scale and spacing, at a comfortable line length, in both directions and both color modes, with no client JavaScript. Wide tables scroll inside it on a phone, and links and images the app has turned into plain text have a documented look.
- **Stacked bars and the chart palette**, last: a month's spending split into its top four categories and "Other", which needs four new colors (a teal, a violet, an olive and a magenta), each chosen to stay clear of the colors that already mean something and checked for color-blind readers and for contrast in light and dark. The consumer uses it in a later phase; it is built last in this batch.
- **Under the hood**, the line chart's table, legend, readout, keys and naming move into shared pieces both charts use, with no change to the line chart a reader or an app can see.

Why: the consumer's next page is Insights: a strip of figures, a filter bar, one chart card whose grouping (month, category, merchant, account) is a segmented control, a table under it, and a written report.

What it does not add: a bar that is a link or responds to a press (the table under the chart links to the transactions), area and donut charts, a 100% stacked bar, charts that switch orientation on their own, a small size of Prose, and a heading step between 14px and 24px. Section 15 lists each as a question with a recommendation.

## 1. Goal

Give an insights page its parts: a bar chart for amounts by category or by period, in either orientation, with negatives, a comparison with the previous period and stacks, that a keyboard and a screen reader can read bar by bar and that renders on the server; the categorical palette its stacks need, derived and measured; and a long-form text style for the report around the chart. Ship them as the batch 6 release: core and react 0.9.0, charts 0.2.0.

The hard parts. A bar chart is the chart most often drawn badly: a truncated axis, red for down, a label rotated 45 degrees, a number on every bar, a palette nobody checked. Each has a rule here (section 4). The library's own rules make two more: nothing may be measured before the first paint, so a long label, a value label and a bar's thickness are laid out by CSS from known numbers; and every figure is the app's string, so a stack's total is the app's too. Prose's hard part is the opposite of a component's: it styles HTML the library never sees, written by a model through a Markdown renderer, so its rules must be safe for any order and nesting of elements, must never reach a component placed inside it, and must not rely on the links and images the app strips out.

Build order, which is also the plan's order. It is the consumer's order of need: BarChart's horizontal and grouped month views, then Prose, then stacked bars. The palette moves next to the stacks, the only part that needs it:

1. **The shared chart foundations** (section 6): LineChart's table, legend, readout placement, keys, naming and active state moved to `src/foundations/`, with LineChart's tests and baselines unchanged as the proof.
2. **BarChart, horizontal** (section 7): one series, the row grid with labels at the start and amounts at the end, negatives, long labels, the narrow layout, the table, the states.
3. **BarChart, vertical and grouped** (section 7): months, negatives split at zero, two series side by side (income in `gain` beside spending in ink), and the previous-period look in both orientations.
4. **Prose** (section 8): `prose.css`, the `Prose` wrapper and `ProseScroll`, and the documented spans for neutralized links and images.
5. **The chart palette** (section 5): four tokens with light and dark values, the validator ported into core's tests, the Appendix B record.
6. **BarChart, stacked** (section 7): the stacks by sign, totals, the palette and "Other", textures.

Out of scope, each recorded where it is deferred:

- A press on a bar, `onBarPress` or an `href` per bar: the consumer's table under the chart links to the transactions, so neither is needed now. A later candidate (open question 13).
- Area and donut charts (parent spec, phase 6). The donut's arc helper waits for the gauge's (accounts spec, section 7.4), which it can copy.
- A 100% (normalized) stack, a waterfall, a histogram, a bullet chart and a dual axis. The dual axis is never: two measures take two charts.
- Grouped bars of three or more series: the consumer groups two at most (open question 2).
- Animation of bars, on first paint or on change. Every chart renders what it is given (home spec, section 1).
- Number and date formatting, as everywhere: every figure, tick, total and category is the app's string.
- Sanitizing HTML for Prose. The library never parses or injects HTML; the consumer renders model output with `skipHtml` (section 8.1).
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
| `StatTile`'s `change` line, `SegmentedControl`, `Switch`, `FilterBar`, `DataTable`, `PageHeader` | The consumer's Insights page around the chart, unchanged (section 3; StatTile's line checked in section 7.16) |
| Meter's hatch (`repeating-linear-gradient(45deg, ...)` 2px every 6px, with a 1px border, and its forced-colors block) | The previous-period look (section 5.5) |

React Aria parts used for the first time: none. BarChart is a client part because it holds the active bar and the view, as LineChart is; it imports nothing from React Aria. Prose imports nothing and is a server part.

## 3. What the consumer needs

The consumer answered open question 1 on 2026-10-18. Its Insights page, as input:

1. **Above the chart, parts that exist.** A health strip of StatTiles and a FilterBar. A tile's change ("Up $120 vs September") is StatTile's existing change line (section 7.16).
2. **One chart card, grouped by a SegmentedControl.** The control picks Month, Category, Merchant or Account; the card holds one BarChart and swaps its props.
3. **Month.** Vertical bars, one band per month. "Both" is grouped: income beside spending, two series at most. Net cash flow by month goes below zero, so vertical bars split at zero.
4. **Category, Merchant, Account.** Horizontal bars sorted by amount (the app sorts), the top 8 to 12 and then "Other", the label at the start of the row and the amount at its end. These can net negative too, from refunds.
5. **Compare to previous period.** Grouped, this period beside the last, in any grouping. The previous period needs a muted look, the same hue lighter or hatched, so "this and last" is not read as two categories (section 5.5).
6. **A table under the chart** links each row to its transactions. So bars need no press and no `href` now; both are recorded as a later candidate.
7. **Later (the consumer's phase 9).** Stacked vertical bars, the top four categories and "Other" per month, five series at most. Four palette colors and a slate "Other" are enough.
8. **Colors.** Income in `gain`, spending in ink, as section 5.4 says.
9. **Order of need.** BarChart (horizontal with negatives, and the grouped vertical month view) first, then Prose, then stacked. Stacked stays in this batch, built last.

And for Prose:

1. **Where.** A monthly report and a weekly coaching note, model output in Markdown; Ask answers later; a goals guide in English and in Persian, right to left, set in Vazirmatn.
2. **How.** Rendered on the server with react-markdown in a server component; Prose must need no client JavaScript.
3. **What reaches it.** Model output renders with `skipHtml`, and links and images are neutralized into plain spans. So Prose must not depend on `a` or `img` for its layout, and needs a documented class for the spans they become (section 8.10).
4. **Wide tables** scroll inside Prose on a phone (section 8.11).

Its rules for every part, unchanged from batch 5: `'use client'` only on interactive parts; no `Intl` formatting and no `window` at render, and no first-paint measurement; no external request and no injected script; light and dark, all three shapes, right to left (the Persian guide), comfortable and compact density; WCAG 2.2 AA including 2.5.8; navigation through `RouterProvider`; everything exported from the package index, with the CSS in `core/styles.css`.

## 4. Approach

**Bars are HTML; the drawing that stretches is SVG.** LineChart's rule is that anything that must keep its shape is HTML over a stretched svg (home spec, section 4). A bar must keep its shape: its end is rounded by a radius token, its thickness is capped in pixels, its focus ring follows its corners. An svg `rect` in a `viewBox` stretched by `preserveAspectRatio="none"` would turn a 6px corner into an ellipse and could not take a token. So every bar is an absolutely positioned `span` placed by percentages and logical insets, its corners from `--radius-micro`, and the gridlines stay in the svg with non-scaling strokes, as in LineChart. Right to left mirrors the bars by their logical insets and the svg by `--chart-flip`, from the same attribute.

**The layout is CSS arithmetic on known numbers.** The number of bands, the number of bars in a band and each value's place on the scale are known in render; a bar's thickness is `min(1.5rem, ...)` of its band, written as a `calc()` on custom properties the render writes, resolved by the browser against the plot's box. Nothing is measured, so the server's HTML is the final picture. A long category label wraps in its own grid cell; an amount sits in a horizontal row's end column, which the grid sizes from the amounts themselves, or outside a vertical bar's end in room reserved by a line's height.

**Bars start at zero, always.** A bar's length is its value, so the value axis always includes zero; a `valueDomain` that leaves it out is widened to it, with a development warning. Negatives hang below (or before) the zero line, which is drawn firmer than a gridline whenever the domain crosses it.

**Color by meaning, then by identity.** One series is ink; two grouped series take their colors by meaning (income in `gain` beside spending in ink, the consumer's month view) or by emphasis (ink and slate, LineChart's form); a previous period is the current period's color, striped (section 5.5); and only a stack of categories takes the categorical palette. `gain` is allowed on a series only when the series is money that arrived. There is no loss color: a negative is ink below the line, as NumberField's record says of a negative amount ("never error, since nothing failed, and never gain; the sign carries it").

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
- **Value labels inside the bar.** Whether a label fits inside a bar is a measurement. Amounts sit in the end column of a horizontal row or outside a vertical bar's end (section 7.5).
- **Rotated category labels.** A label at 45 degrees is read with a tilted head and still collides; long labels wrap, or the chart is horizontal (section 7.5).
- **Red and green by sign.** Error means a failure and success a save (the meaning rules in "Six colors added"); a month that cost more than it brought in is neither.
- **The chart's own live region**, LineChart's model (section 7.6 and open question 6).
- **Tailwind Typography as a dependency for Prose.** It is a Tailwind plugin, so a non-Tailwind app could not use it, and its defaults (65ch, a 600 weight, its own grays) are not the system's.

## 5. The chart palette

The parent spec asks for "a categorical chart palette, which the design system lacks, derived and measured for contrast in both themes before any chart is built", and Appendix B's "Charts" says the categorical validator of the data-visualization method is run "when it adds one". Batch 6 adds one, because a stack of categories is the first chart with more than two series. Only the stacks use it, so it is built fifth, just before them (section 1); the horizontal and grouped views the consumer needs first draw in ink, slate, `gain` and the previous-period look of section 5.5, none of which needs it.

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
| Two to five, stacked | `chart-1`, `chart-2`, `chart-3`, `chart-4`, then slate |
| A series with `look: 'hatched'` | The color of the first series with `look: 'fill'`, striped (section 5.5) |

`color` takes `'ink' | 'slate' | 'gain' | 'chart-1' | 'chart-2' | 'chart-3' | 'chart-4'`. `gain` is for a series that is money that arrived (the meaning rule: "an amount that arrived"), drawn with its legend label saying so ("Income"); the docs show it beside an ink "Spending" and never beside a palette color, so a reader never compares a meaning with an identity in one chart (the method's collision rule). `error`, `success`, `warning`, `clay` and both signal oranges are not in the type. The consumer's month view sets `color: 'gain'` on Income and `color: 'ink'` on Spending, so the two keep their colors when the control shows one of them alone.

### 5.5 The previous-period look

The consumer compares a period with the one before it in every grouping: this month's bar beside last month's, this period's merchants beside the last period's. Two colors would read as two categories, so the previous period takes the same color as the current one in a second look. `look: 'hatched'` on a series draws its bars as stripes of the series' color, 2px every 6px at 45 degrees, over the surface, inside a 1px border in the series' color: Meter's "held" segment, so the library's one striped look keeps one meaning, "the same thing, not the main amount". The legend's key is Meter's hatched swatch. The series' `label` is the app's ("September", "Previous period"), and each bar's name says it, so the stripes are never the only cue.

**Why stripes and not a lighter fill.** A lighter step of the same hue has to clear 3:1 against the surface, to be seen, and stay apart from the solid bar beside it. Measured against Lifted, mixing the color with the surface:

| Color, mode | 40% | 50% | 60% |
| --- | --- | --- | --- |
| ink, light: against Lifted, against solid ink | 2.56, 6.96 | 3.43, 5.20 | 4.78, 3.73 |
| ink, dark | 3.83, 4.55 | 5.24, 3.32 | 6.90, 2.52 |
| gain, light | 1.92, 3.75 | 2.33, 3.09 | 2.86, 2.51 |
| gain, dark | 2.37, 3.40 | 2.99, 2.69 | 3.70, 2.17 |

Ink has a band that works (about 50% in light, 40% to 50% in dark), but `gain` has none in either mode: a light enough green to differ from `gain` is too light to see. Slate, LineChart's context color, is a different hue from `gain` and a second color beside ink, which is what the consumer asked to avoid. The hatched bar's extent is drawn by its border, which is the series' color at full strength (ink 17.84 and 17.42, `gain` 7.20 and 8.04 against Lifted), and its stripes average about a third of the color (2.14 and 3.03 for ink, 1.71 and 2.02 for `gain`), a texture and not an edge, so it reads as the same color, lighter, with no contrast lost (open question 25 keeps the lighter fill for ink as the alternative).

**Rules.** A hatched series without `color` takes the color of the first series with a fill, so `[{ label: 'October' }, { label: 'September', look: 'hatched' }]` is ink beside striped ink, and `[{ label: 'Income', color: 'gain' }, { label: 'Income, September', color: 'gain', look: 'hatched' }]` is green beside striped green. It is drawn after its current bar in the group (to the inline end in a vertical chart, under it in a horizontal row), and its amount, in the end column of a horizontal chart, is slate. It is for grouped charts, two series at most; a stacked series with `look: 'hatched'` warns once and draws as a fill, since stripes in a stack already mean texture (section 7.11). In forced colors the stripes are `CanvasText` on the system background and the border `CanvasText`, Meter's block, while the current bar is solid `CanvasText`; so solid against striped survives every palette.

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
- **Horizontal:** `div.bar-chart-rows`, a grid with one row per category and three columns: `span.bar-chart-category` at the start, `div.bar-chart-track` holding that category's bars, and `span.bar-chart-amounts` at the end with one amount per bar (all three hidden from assistive technology, since each bar's name says them); a gridline layer spans every row's track column; the value tick labels sit under the last row.
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
  /** "Groceries", "October", "Income". Names the series in the legend, the readout, each bar's name and the table. */
  label: string;
  /** One per category, aligned with `categories`. `null` is no value: no bar, skipped by the keys, an empty cell. */
  values: readonly (BarValue | null)[];
  /** Pins the series to a color, so it keeps it when another series is filtered out. @default by place, section 5.4 */
  color?: ChartColor;
  /** 'hatched' draws the series as the previous period: the color of the first filled series, striped (section 5.5). Grouped charts only. @default 'fill' */
  look?: 'fill' | 'hatched';
}

/** Grouped bars hold one or two series (the consumer's limit, open question 2); stacked bars up to five. */
export type BarChartSeries =
  | { layout?: 'grouped'; series: readonly [BarSeries] | readonly [BarSeries, BarSeries] }
  | { layout: 'stacked'; series: readonly BarSeries[] };

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
  AriaName &
  BarChartSeries & {
    /** The bands' labels, formatted: "Groceries", "Oct", "Whole Foods Market", "Other". In the app's order: a ranked list is sorted by the app. */
    categories: readonly string[];
    /** @default 'vertical' */
    orientation?: 'vertical' | 'horizontal';
    /** Whether the bands are periods in order or peers. @default 'category' */
    bands?: 'category' | 'time';
    /** Which category labels show, by index. @default every one for 'category'; first, middle and last for 'time' */
    categoryTicks?: readonly number[];
    /** The value gridlines and their labels, formatted. Absent, no gridlines but the zero line and no value axis labels. */
    valueTicks?: readonly { value: number; label: string }[];
    /** The value domain. Always widened to include zero. @default from the least to the greatest stacked sum, zero included, rounded out by niceDomain */
    valueDomain?: readonly [number, number];
    /** Amounts: none, every bar, or the bands at these indexes. Stacked bars show `totals`. @default 'all' for horizontal, 'none' for vertical */
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
- **Series count in the types.** `BarChartSeries` makes a third grouped series a type error, as LineChart's tuple does; a stacked chart past five series warns once in development and draws the sixth and later in slate (section 5.2).
- **One chart, four groupings.** The consumer's card swaps `categories`, `series` and `orientation` when its SegmentedControl changes; the chart keeps no state that depends on them except the active bar, which resets to the first stop when `categories` changes, so focus never rests on a bar that is gone.

### 7.3 Layout and geometry

**The value scale.** `valueDomain(values)` over every value for grouped bars, or over each band's positive sum and negative sum for stacked bars, zero included, rounded out by `niceDomain`; `linearScale(domain, [100, 0])` for a vertical plot (y down) and `[0, 100]` for a horizontal track (from the inline start). A given `valueDomain` without zero is widened to it and warns once in development: a bar that starts anywhere but zero misstates its value. A value outside a given domain is clamped to 1e6 past the plot, as LineChart's are.

**A bar's extent along the value axis.** For a value `v`, the bar runs from `scale(0)` to `scale(v)`: `inset-block-start` and `block-size` in percent for a vertical bar, `inset-inline-start` and `inline-size` for a horizontal one, each written in render with three decimals. A stacked bar's segments run from the running sum of the values of the same sign before it in series order, so positives stack up (or toward the inline end) from zero and negatives stack down (or toward the inline start), each sign in series order; this is the "diverging" stack (Recharts' `stackOffset="sign"`, Observable Plot's default stacking by sign, both to verify). A value of exactly zero has a bar of no length, still in the DOM and reachable by the keys; any other value draws at least 1px (`min-block-size` or `min-inline-size` under `[data-nonzero]`), so a small amount never vanishes.

**Bands.** `n` categories divide the category axis into equal bands, band `i` centred at `(i + 0.5) / n` of it, from the inline start (vertical) or the block start (horizontal). No band padding is configurable: the bars take a share of the band and the rest is air.

**Thickness, with no measurement.** The render writes `--bar-chart-bands: n` and `--bar-chart-group: k` (the bars side by side in a band: the series count when grouped, 1 when stacked) on the plot, and the CSS computes:

```css
--bar-chart-thickness: min(1.5rem, calc((100% / var(--bar-chart-bands) * 0.6 - (var(--bar-chart-group) - 1) * 2px) / var(--bar-chart-group)));
```

A percentage inside a custom property resolves where it is used, on the bar, against the plot it is positioned in, so `100%` is the plot's width (vertical). Each bar's inline start is its band's centre less half its group, plus its place in the group: `calc(var(--bar-chart-centre) - (k * t + (k - 1) * 2px) / 2 + j * (t + 2px))`, with `t` the thickness, `j` its place and `--bar-chart-centre` written in render as a percent. So bars are at most 24px thick, the method's cap, take 60% of their band at most, sit 2px apart in a group (the method's surface gap between touching marks, here air on the surface), and thin as the box narrows: 31 daily bars in a 280px plot are about 5px.

**Horizontal rows.** A horizontal chart is a CSS grid, `grid-template-columns: fit-content(var(--bar-chart-label-size, 40%)) minmax(0, 1fr) max-content`: the label column at the start is as wide as the longest label up to 40% of the chart (an app sets `--bar-chart-label-size`), the amount column at the end is as wide as the widest amount, which the grid finds from the content itself with no script, and the track takes the rest. Each row is at least 2.5rem tall (`--size-target`, so the row is a 40px target for the pointer) or as tall as its wrapped label. Bars in a row are `min(1.5rem, calc((2rem - (k - 1) * 2px) / k))` thick, centred in the row, so a grouped row is two 15px bars. The gridline layer is one element in the track column spanning every row (`grid-row: 1 / -1`), so the lines run unbroken behind the rows. The consumer's ranked list of 8 to 12 rows and an "Other" is 13 rows at most, 520px at the least; "Other" is a category like the rest, last because the app puts it last.

**Grouped or stacked** (open question 2, answered). Grouped places a band's two bars side by side, for income beside spending or this period beside the last. Stacked places up to five end to end, for a total and its parts, the consumer's later month view. One series ignores `layout`.

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

**Value labels, horizontal: the amount column.** On by default (`'all'`): a ranked list reads as a list, name at the start and amount at the end, the consumer's layout and the method's "bars: value at the tip" made a column so the amounts align. Each row's amounts sit in the end column, one line per bar in group order, end-aligned, `--text-small`, tabular, left to right with the sign kept by the numeral rule, `white-space: nowrap`: the current period in ink, a hatched series' amount in slate. A refund that nets a row below zero draws its bar toward the start from the zero line and keeps its amount in the same column, so a sorted list's negatives at the bottom still line up. Stacked rows show `totals[i]`.

**Value labels, vertical.** Off by default; the method's rule is "never a number on every point", and the table, the readout and the bars' names carry every value. `'all'` labels every bar and an index list the bands the story is about. Each label has the horizontal column's look and sits outside the bar's data end with a 4px gap, above a positive bar and below a negative one. Stacked bars label the stack, with `totals[i]`, at each sign's outer end; a stacked chart asked for labels without `totals` warns once and draws none.

**Room for value labels, reserved without measuring.** Vertical: the plot gains 1.25rem above (positives) and below (negatives) when labels show, the space LineChart reserves for its top tick label, and the scale maps the domain inside it. Horizontal: the amount column is `max-content`, so the grid sizes it from the amounts themselves; the track narrows to fit (risk R10).

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

Section 5.4 assigns colors. In use: a bar is its series' color, solid; the legend key is a 12px swatch, Meter's, at `--radius-micro`; the readout's swatches are the same. Text never takes a chart color. A hatched series is its first filled series' color, striped (section 5.5). A negative bar is its series' color, below the line. A bar with `gain` keeps `gain` on both sides of zero: money that arrived and was then reversed is still drawn as the series it belongs to, and the sign and the figure say which way.

### 7.11 Look and CSS

- **Bars.** `background-color` from `--bar-chart-color`, set per series by `data-color` on the bar: `--color-ink`, `--color-slate`, `--color-gain` or `--color-chart-1` to `-4`. Under `[data-look='hatched']` the fill is Meter's stripes in `--bar-chart-color` (`repeating-linear-gradient(45deg, ...)`, 2px every 6px) with a 1px border in the same color; the stripes keep their 45 degrees in right to left, as Meter's do, since they are a texture and not an arrow.
- **Texture** (`hasTexture`, and always in forced colors), for stacks. Slot by series position, the method's two directions only: the first series solid, the second 45 degree stripes, the third 135 degree stripes, the fourth both, the fifth solid in slate; stripes 2px every 6px, Meter's hatch, with a 1px border in the series' color so a textured bar keeps its outline when stripes do not print. For readers who cannot tell the colors apart, a printout without color, and forced colors.
- **Legend.** Two or more series: the shared legend at the top inline start, `--text-small`, ink labels, swatch keys.
- **Contrast.** Each bar color against Lifted, the canvas and Float: ink 17.84, 16.25, 18.43 light and 17.42, 19.31, 17.42 dark (the Sparkline record's values); slate 5.31, 4.84, 5.49 and 6.94, 7.26, 6.94 (LineChart's); gain 7.20, 6.55, 7.44 and 8.04, 8.92, 8.04 (its record's); the palette in section 5.2. All past 3:1. A hatched bar's border is its color at full strength and its stripes a texture (section 5.5). The zero line in boundary, 3.36 light and 5.59 dark on Lifted; gridlines and the frame baseline are cues (1.23 and 1.28, LineChart's). Value labels and category labels are ink or slate, gated as text. The palette's pairs join the contrast gate as graphics (3:1) against canvas, Lifted and Float in both modes, twenty-four pairs, and the categorical checks become a test.
- **Forced colors.** Bars opt out of the repaint (`forced-color-adjust: none`), as Skeleton does, and draw in `CanvasText` with the textures on, since a system palette has one text color and a stack needs four looks; a grouped comparison is solid `CanvasText` beside `CanvasText` stripes in a `CanvasText` border; the gaps between segments become the system background color through `--chart-surface`; the zero line is `CanvasText`, the gridlines `GrayText`; the focused bar's ring and the active band's bars are `Highlight`. The swatches follow the bars.
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
| Under 24rem | `bands="category"` labels hide under the bands past every third; time ticks stay first, middle and last | Each label on its own line above its bar; the track and the amount column share the line under it |

Thickness narrows by itself (section 7.3). At 320px with a Card's 20px padding the plot is 248px: twelve monthly bars are 12px, grouped pairs 5.2px each, thirty-one daily bars 4.8px, each reachable by keys and by its band with the pointer. A horizontal list at 248px puts its labels above the bars, and an amount of 12 characters ("-$12,345.67") takes about 80px, leaving the track about 168px. Nothing scrolls sideways; a docs e2e checks 320px.

### 7.14 Server rendering

BarChart is a client part (`'use client'`), for the active bar, the view and the pointer, as LineChart is, and imports nothing from React Aria. On the server it renders the final picture: every bar's position, size and corner, the labels, the legend, the hidden table, the toggle, the status host, the `noscript` copy. No `Intl`, no `window`, no measurement: the amount column is a grid track sized by its content, the thickness a `calc()`. The ids that name each bar come from `useId`, so the server and the client agree. After mount it sets the active bar's tab stop. The hydration suite renders it under `en-US`, `de-DE` and `fa-IR` in UTC and Asia/Tehran with `onRecoverableError` failing the test; it writes nothing from a locale, so it has no server face of its own ("The server face" record).

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

### 7.16 StatTile's change line, checked

The consumer's health strip wants "Up $120 vs September" on a tile. StatTile already has it: `change: { direction: 'up' | 'down' | 'flat', label, tone?: 'neutral' | 'gain' | 'warning' }` draws an arrow and the app's sentence under the value (home spec, section 6.2), and the `WithTrend` story shows it beside a sparkline (its default args carry "Up 12% from last month"). It is a line of text in slate, or `gain` or `warning` by meaning, not a chip: no fill and no pill. So `change={{ direction: 'up', label: 'Up $120 vs September' }}` gives the consumer what it asked for today. Whether it wants the line drawn as a chip (a filled pill, as some dashboards draw a delta) is open question 26; recommended: keep the line.

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

It renders the element with `className={cx('prose', className)}` and its children. No state, no hook, no client directive, so the consumer's server component renders react-markdown's output inside it with no client JavaScript. `ProseScroll`, its one companion, holds a wide table (section 8.11). Ask answers, later, may stream into a client component; Prose renders there unchanged, since it imports nothing client-only.

- **Markdown and HTML.** The library never parses or injects HTML. The consumer's path is the recommended one: Markdown rendered by react-markdown in a server component, with `skipHtml` for model output and its links and images mapped to plain spans (section 8.10). An app that has HTML from a CMS passes it to React its own way, which React names `dangerouslySetInnerHTML` and which reaches the element as any attribute does; the docs say to sanitize it first (DOMPurify or sanitize-html, to verify current names). There is no `html` prop (open question 20).
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
| `a` | The Link record: link blue, 1px underline at 0.25em offset, 2px on hover and press, the focus ring with `--radius-micro`, breaks anywhere | Restated in `prose.css` on the same tokens; the CSS test pins it to `link.css`. Paint only: nothing is laid out by `a` (section 8.10) |
| `strong`, `b` | 700 | 500 against 450 is a step a reader barely sees at 16px (open question 17) |
| `em`, `i` | The italic face | `base.css` turns synthesis off, so the app must load the italic (risk R9) |
| `ul`, `ol` | `padding-inline-start: 1.25rem`, items 8px apart (a part step), markers slate, `ol` markers tabular; nested `ul` disc, circle, square; nested `ol` decimal, lower-alpha, lower-roman | The docs' lists; markers are not the text the reader reads first |
| `li > p` | 8px apart inside an item | Parts of one thing |
| `blockquote` | `border-inline-start: 2px solid var(--color-frame)`, `padding-inline-start: 1.25rem`, ink text, no italics, no quote marks drawn | The rule is a cue; the indent equals a list's, so a quote's text and a list's text share an edge |
| `code` (inline) | `--font-mono` at 0.875em, `--color-bone`, `--radius-micro`, `padding: 1px 6px`, `direction: ltr`, `unicode-bidi: isolate` | The docs' inline code |
| `pre` | The docs' `.code`: `--color-bone`, a 1px `--color-frame` edge, the frame radius below, `padding: 1.25rem 1.5rem`, `--font-mono` at 0.875rem and 1.7, `overflow-x: auto`, `tab-size: 2`, `white-space: pre`, `overflow-wrap: normal`, left to right, the focus ring on `:focus-visible`, and the docs' `--shiki-*` mapping onto the palette | Moved from `apps/docs/app/site.css`, so highlighted code never borrows a reserved color |
| `table` | In a `ProseScroll` for a phone (section 8.11); full width of the prose box, `border-collapse: collapse`, `--text-small`, tabular figures; `th` 500 in slate, `td` ink; cells `padding: 0.5rem 0.75rem` with a 1px `--color-divider` rule under each row; text from the cell's `align` or `style` (GFM writes one); `caption` slate at the start; cells break anywhere | LineChart's table, so a table in an article and a chart's table are one look |
| `figure`, `img`, `video` | `figure` no margin of its own; `img` and `video` `max-inline-size: 100%`, `block-size: auto`, the frame radius; `figcaption` `--text-small` slate, 8px under | A picture is a framed block; `img` stays inline as the browser draws it, so a neutralized image changes no layout (section 8.10) |
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
- **The font.** Sofia Sans has no Arabic script, so the consumer's goals guide sets `--font-sans` to Vazirmatn first under `:lang(fa)`, loaded by the app through `next/font` (Vazirmatn is under the OFL and has a variable weight axis, so 450 and 500 draw; to verify both). The 1.6 line height leaves room for Persian's taller marks. Vazirmatn has no italic, and `base.css` turns synthesis off, so under `:lang(fa)` and `:lang(ar)` `em` draws at weight 500 instead, upright, the emphasis a Persian text uses.
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

### 8.10 Neutralized links and images

The consumer renders model output with react-markdown's `skipHtml`, and turns every link and image into a plain span, so a model can never send the reader to an address or load a picture from one. Prose therefore lays nothing out by `a` or `img`: every rule on them is paint (a color, an underline, a radius), and no spacing, column or measure depends on their being there. A paragraph that held a link holds a span and reads the same.

The documented spans, which the docs' recipe writes through react-markdown's `components` map (open question 27):

| Becomes | Class | Look | Why |
| --- | --- | --- | --- |
| A link, `[text](url)` | `span.prose-unlinked` holding the link's text | The surrounding text's look exactly: no blue, no underline, no pointer, and `overflow-wrap: anywhere`, since model text often makes a bare address its link text | A neutralized link is not a link, and anything that looks like one but does nothing breaks the reader's trust; the Link record's blue and underline mean "this goes somewhere" |
| An image, `![alt](url)` | `span.prose-image` holding the alt text, or nothing when there is none | `--text-small` in slate, inline, in a `--color-bone` box with `--radius-micro` and `padding: 1px 6px`, the inline code's box in the sans face; empty, it is not drawn (`:empty { display: none }`) | The reader learns a picture was described, in the model's words, without a request; slate, since it is read |

The CSS test asserts that `.prose` rules never select `a` or `img` with a property that changes layout (margin, padding, display, width, position), so the guarantee holds as the file grows. An app that keeps real links for its own content (the goals guide) gets the Link record's look on `a`, as section 8.2 says.

### 8.11 Wide tables on a phone

A table is wider than a phone's column as soon as it has four columns of figures. It must scroll inside Prose and keep its table semantics, and a scrolling region must be reachable by keys and named.

- **`ProseScroll`**, a second static part in `@snapshot-ui/react`: `div.prose-scroll[role="region"][tabindex="0"]` with a required name (`AriaName`), `overflow-x: auto`, `max-inline-size: 100%`, and the focus ring on `:focus-visible`. It draws no frame of its own, since it cannot know whether its table overflows; the table's row rules carry the shape. The table inside keeps `display: table`, so a screen reader still reads rows and columns.
- **With react-markdown in a server component,** the app maps `table` to `<ProseScroll aria-label={labels.table}><table {...props} /></ProseScroll>` in its `components`; it is a server part, so the report stays free of client JavaScript. The docs' recipe does exactly this, with a Persian label on the Persian guide.
- **Without a wrapper,** `.prose table` cells break anywhere (section 8.2), so a table never pushes the page sideways; it only gets tall. The docs say to wrap.
- **Why not `display: block` on the table.** It scrolls with no wrapper, but some engines drop table semantics when a table's display changes (to verify current WebKit with VoiceOver), and the box still needs a `tabindex` and a name, which CSS cannot add.
- **`pre`** scrolls in its own box already; the recipe maps it to add `tabIndex={0}` for the same reason, since only Chromium makes a scrolling region focusable by itself (section 9).

## 9. Accessibility

- **Roles and names.** BarChart: a `figure` named by the app; a `group` with `aria-roledescription` (`labels.roleDescription`) holding the bars, named as the figure; each bar `role="img"` with `aria-roledescription` (`labels.bar`) and a name from its table cells; a `table` named as the chart; a `button` toggling it; a polite `status`. Prose: the app's own elements; `Prose` adds none, or an `article` or `section` when asked (an `article` is not a landmark; a `section` is a region only when named, which the docs explain); `ProseScroll` a named `region` that takes focus; a neutralized link is text and not a link, so it is no stop and has no role.
- **Keyboard (2.1.1, 2.4.3).** Every bar is reachable; one tab stop; the order follows the drawing; Escape never traps; keys not used are not prevented. A scrolling `pre` or table must be focusable to be scrolled by keys: Chromium makes scrollable regions focusable by itself since version 130 (to verify), so `ProseScroll` carries `tabindex="0"` and the docs' react-markdown map gives `pre` one, for the other engines.
- **Focus visible (2.4.7) and not obscured (2.4.11).** The ring on the bar, concentric; the readout never covers the active bar.
- **Never color alone (1.4.1).** Two or more series have a legend with labels; each bar's name says its series; the previous period is striped as well as named; textures on request and in forced colors; the zero line and the figures say the sign; links in prose are underlined.
- **Non-text contrast (1.4.11).** Every bar color 3:1 or more on every surface (sections 5.2 and 7.11); the pointer's dimming is a transient emphasis, recorded.
- **Text spacing and reflow (1.4.12, 1.4.10).** Prose at 1.6 line height and margins in rem; nothing in either part scrolls sideways at 320px except a `pre` or a table inside its own box.
- **Targets (2.5.8).** A bar is reached by its whole band, never only its drawn width; a horizontal row is at least 40px; the toggle is a Button. Inline links in prose are exempt, as the Link record says.
- **Screen readers.** `role="img"` on a focusable element, `aria-roledescription` and names from hidden cells are read by VoiceOver and NVDA as expected in principle; the pass with both is owed before the release (risk R3), as it is for LineChart.
- **Axe** passes in light and dark for every story, with the table open and closed, in every status.

## 10. Testing

- **Core (`css.test.js`, `token-only.test.js`, `contrast.test.js`).** No `.prose` rule selects `a` or `img` with a layout property (margin, padding, display, width, position). `prose.css` and the new rules in `charts.css` are tokens only, in `@layer components`, with system colors only in their forced-colors blocks and logical properties throughout; `prose.css` rules all use `:where()` and the `not-prose` guard; the prose link values equal `link.css`'s and the `pre` values the docs' `.code`; no chart token in a `color:` declaration. The contrast test gains the palette's twenty-four graphic pairs, and a palette test ports the method's checks (lightness band, chroma floor, adjacent CVD at least 8 under Machado 2009, normal at least 15, at least 10 from every reserved color) and fails if a token edit breaks one.
- **Charts (Vitest, jsdom).**
  - The foundations: `valueDomain`, `placeReadout`, `moveFrom`, `chartName` with fixed inputs; the stacking function by sign; the band and thickness custom properties written for each layout.
  - LineChart, unchanged: its suite passes untouched after the move.
  - BarChart: bars' insets and sizes as percentages for positives, negatives, stacks of mixed sign and zero; `[data-nonzero]`; the domain widened to zero with its warning; colors by section 5.4 and by `color`; `look: 'hatched'` taking the first filled series' color, its slate amount, its warning in a stack; a third grouped series refused by the types (a `@ts-expect-error` test); the sixth stacked series' warning; the active bar reset when `categories` change; each bar's `aria-labelledby` resolving to category, series and value; the roving tab index after mount and none in the server's HTML; every key in both orientations, both layouts and both directions, Escape stopped once, modifiers ignored, unused keys not prevented; the first stop for time and category bands; the pointer snapping to bands; the amount column on by default for horizontal and off for vertical, a negative row's amount in the column; `totals` in the labels, the readout and the table, and their warning; each status's markup, `aria-busy` and the status text; `statusContent`; the table and the toggle; axe in each state.
  - Server render: BarChart in the server-render and hydration suites under three locales and two zones.
- **React.** `Prose`: the element by `as`, the class merged, attributes passed through (including React's raw HTML attribute), a server render with no client code; `ProseScroll`: its role, name, `tabindex` and class, and the types requiring a name; a react-markdown fixture rendered in a server component with `skipHtml` and the docs' `components` map, asserting no `a` and no `img` in the output and the two spans present; axe over a fixture of every element in section 8.2.
- **Storybook.** Section 11's stories, baselined in the four theme and shape modes and at 375px, compact where tagged. Play tests in the four story projects (Chromium light and dark, WebKit, Firefox): the keys of every layout and orientation, in right to left too (`no-visual`); the pointer's band snapping and dimming; the readout's placement at both ends; the table toggle; the concentric audit on every new story in three shapes; a story putting library components in `.prose` asserting their computed styles equal the same components outside; the focus ring's corner radius equal to the bar's plus the offset, measured in three engines (risk R12).
- **Docs e2e.** Completeness maps for the new pages; 320px with no sideways scroll for both parts and the recipe; the chart's table with scripts on and off; forced colors on a stacked chart (textures) and on prose (inline code edge, `mark`); a Persian prose page's markers at the right and code left to right; at 375px a wide report table scrolls inside its `ProseScroll` and the page does not; forced colors on a hatched comparison (solid against stripes).

## 11. Docs and stories

- **Pages.** `charts/bar-chart` beside the line chart in the "Charts" group, leading with "Bar, line or stat tile" (a bar compares amounts across categories or periods, a line shows a change over continuous time, a tile says one figure); sections for a ranked list (horizontal, the amount column, "Other", refunds below zero), months (vertical, negatives), two series side by side, comparing with the previous period, stacked, time bands, long labels, states, color and the palette, keys and accessibility. `charts/palette` (or a section of `theming`, the plan decides) with the four tokens, the previous-period look, the rules of section 5.3 and the measurements. `components/prose` with every element, rhythm and measure, `not-prose`, the neutralized spans, `ProseScroll`, in a Card, in a PageColumn, right to left in Vazirmatn, and "Rendering Markdown safely" (react-markdown in a server component, `skipHtml`, the `components` map of section 8.10). The `line-chart` page gains its states; the `stat-tile` page gains "A change against a period" with "Up $120 vs September".
- **The Insights recipe**, the consumer's page, with the Next App Router: a PageHeader "Insights"; a health strip of StatTiles with change lines; a FilterBar; one Card whose header holds a SegmentedControl (Month, Category, Merchant, Account) and a "Compare to previous period" Switch, and whose body holds one BarChart: Month draws vertical bars with Income (`gain`) beside Spending (ink) or Net alone with negatives, and Category, Merchant and Account draw a horizontal list of the top ten and "Other" with a refund row below zero; comparing adds the hatched previous period; under the chart, a DataTable whose rows link to the transactions. Then an `article` with the month's report as Prose, rendered from Markdown by react-markdown in a server component with `skipHtml`, neutralized links and images, and a wide table in a `ProseScroll`. A second page shows the goals guide in Persian, right to left, in Vazirmatn. The docs site makes no request, so the Markdown is a fixture. Sample content keeps the reservations: no red or green for down and up, `gain` only on Income.
- **Stories:**
  - `Charts/BarChart`, horizontal: `Horizontal` (ten merchants and Other, amounts at the end), `HorizontalNegatives` (refunds), `LongLabelsHorizontal`, `Narrow` (a 20rem frame, labels above), `CompareHorizontal` (hatched previous period).
  - `Charts/BarChart`, vertical: `Default` (twelve months), `Negatives` (net cash flow), `IncomeAndSpending` (`gain` beside ink), `CompareToPrevious` (ink beside hatched ink), `TimeBands` (31 days), `ValueLabels`, `LongLabels` (clamped).
  - `Charts/BarChart`, shared: `ActiveBar` (a play focuses a bar: ring and readout), `PointerBand` (dimming), `TableView`, `Loading`, `Empty`, `Error`, `InCard` (density, the consumer's card with its SegmentedControl).
  - `Charts/BarChart`, stacked: `Stacked` (four categories and Other, totals), `StackedNegatives`, `Textures`.
  - `Charts/BarChart`, `no-visual`: `Keys`, `KeysHorizontal`, `KeysCompare`, `GroupingChange` (a play switches the SegmentedControl and asserts the tab stop moved to the new first bar), `NoScript`.
  - `Charts/LineChart`: `Loading`, `Empty`, `Error`.
  - `Components/Prose`: `Default` (every element), `InCard` (density), `InPageColumn`, `Nested`, `CodeBlocks` (a long line), `WideTable` (in a `ProseScroll`; scrolls at 375px), `Figures`, `ModelOutput` (neutralized links and images, `skipHtml` output), `WithComponents`.
  - `Components/StatTile`: no new story; `WithTrend` already shows the change line.
  - `Pages/Insights`: the recipe's page.
  - `rtl/RightToLeft.stories.tsx`: `BarChart` (months, negatives), `BarChartHorizontal` (a ranked list with a refund) and `Prose` (the goals guide in Persian, in Vazirmatn).
- **Vazirmatn in the stories.** The visual baselines run in a Docker image with no network, so the plan adds Vazirmatn's variable woff2 (OFL, with its license) to the Storybook static folder and loads it in the preview under `:lang(fa)`; until it is there, the right-to-left baselines would draw the image's fallback Arabic face.
- **Design record:** Appendix B sections "Chart palette" (with the previous-period look), "BarChart" and "Prose", with every derived value, its reason and the measured pairs; "Charts" loses "There is no palette" and gains the color table of section 5.4; "Nested radii, derived" names a bar's data end among the parts that keep the micro step; "Meter" notes that its hatch now also means a previous period in a chart.

## 12. Responsive, right to left and server rendering, together

- **320px.** BarChart in a Card at 248px: vertical bars thin, labels follow section 7.13; horizontal labels go above bars, with the amounts at the end of the bar's line. Prose at 248px: text wraps, `pre` and a table in a `ProseScroll` scroll in their own boxes, images shrink.
- **Right to left.** Sections 7.12 and 8.6; the stories in `rtl/RightToLeft.stories.tsx`.
- **Server.** BarChart's server HTML is its final picture (section 7.14); Prose and ProseScroll are static, so the consumer's report sends no client JavaScript. Neither reads `window`, formats or measures before the first paint.

## 13. Decided here

1. Build order: the shared foundations, BarChart horizontal, BarChart vertical and grouped with the previous-period look, Prose, the chart palette, stacked bars; the consumer's order of need.
2. Four chart tokens, `chart-1` to `chart-4` (teal, violet, olive, magenta), with light and dark values, at least 30 degrees of hue and 10 of distance from every reserved color, passing the method's checks on adjacent pairs in both modes, and 3:1 on every surface; slate as the fifth, "Other". Only stacks use them.
3. One series ink; two grouped ink and slate unless set; stacks from the palette; `color` pins a series; `gain` only for money that arrived (Income), spending ink; no loss color.
4. The previous period is `look: 'hatched'`: the current series' color in Meter's stripes inside a 1px border of that color, its amount in slate, grouped charts only; solid against striped in forced colors.
5. Grouped holds two series at most, in the types; stacked up to five.
6. LineChart's table, legend, readout placement, keys, naming and active state move to `src/foundations/`, with no change LineChart's tests or baselines can see.
7. Bars are HTML over an svg of gridlines; thickness and placement are CSS `calc()` on values written in render; nothing is measured.
8. Bars at most 24px thick and 60% of their band, 2px apart in a group; horizontal rows at least 40px tall.
9. The value axis always includes zero; a domain without it is widened with a warning; any nonzero value draws at least 1px.
10. Stacks diverge by sign.
11. The data end takes `--radius-micro` (6px, 6px, 0), the baseline end is square, inner joins are square with a 2px surface gap; the focus ring is concentric by the outline's offset.
12. The zero line is `--color-boundary` when the domain crosses zero and `--color-frame` otherwise.
13. Horizontal: labels at the start in a `fit-content(40%)` column, amounts at the end in a `max-content` column, on by default; a negative row's amount stays in the column. Vertical: value labels off by default, outside the data end, with 1.25rem reserved.
14. Category labels never rotate: vertical clamps at two lines, time bands show ticks, horizontal wraps and goes above the bar under 24rem.
15. One tab stop that is the active bar, a roving tab index set after mount and reset when `categories` change, each bar `role="img"` named by its table cells; arrow keys move to the bar drawn in that direction; no live region.
16. No press and no `href` on a bar in this batch; the consumer's table under the chart links to the transactions.
17. The pointer's hit area is the band; the other bands dim to 40% under a pointer only.
18. `status` with loading (skeleton bars, `aria-busy`, one polite word), empty and error (the app's content or a sentence), keeping the figure's size, with their strings in `ChartStatusLabels`; LineChart gains the same.
19. Textures for stacks, on request and always in forced colors: solid, 45, 135, both, slate.
20. StatTile's change line already says "Up $120 vs September"; nothing is added to StatTile.
21. `.prose` with `:where()` rules and `not-prose`; `Prose` a static wrapper with `as`; `ProseScroll` a static, named, focusable region for a wide table; no `html` prop.
22. Prose lays nothing out by `a` or `img`; a neutralized link is `span.prose-unlinked` in the text's own look and a neutralized image `span.prose-image` with its alt text in a small slate box.
23. Prose type: `h1` to `h3` take the heading steps two to four, `h4` to `h6` the fourth, `h5` and `h6` slate; body at 1.6; `strong` 700; `em` at 500 under `:lang(fa)` and `:lang(ar)`.
24. Prose rhythm from the system's steps (8, 24, 32), top margins only, first and last trimmed; measure 70ch on text blocks only.
25. Prose's `pre` is the docs' code block moved to core, with its Shiki mapping; framed blocks take the holder's concentric radius or the surface step.
26. Prose code is left to right in right-to-left pages; headings lose tracking under `:lang(fa)` and `:lang(ar)`; ordered lists count in Persian digits under `:lang(fa)`; the app's `--font-sans` names Vazirmatn first under `:lang(fa)`.
27. The docs site has no `.bar-chart`, `.prose` or `.prose-*` classes outside the library's to collide with; its `.docs-section` prose rules stay (open question 21). The plan checks again.
28. One 0.9.0 minor release of core and react and a 0.2.0 minor release of charts with its core peer at `^0.9.0` (section 18).

## 14. Risks

- **R1. Class collisions.** `.prose` is also Tailwind Typography's class, and an app with both gets both. Mitigation: the docs say not to load the plugin beside the library's prose, and the library's rules sit in `@layer components`, where an app's unlayered plugin output would win, which the docs show; the parent spec's R1 covers unprefixed classes in general (open question 15).
- **R2. Many elements.** 31 bands by two series is 62 bars and the consumer's later stacks 12 by five, 60; 365 daily bars is a list, not a chart. Mitigation: the docs cap a vertical chart at about 60 bands and point to LineChart past that; a story renders 120 bands to bound the cost.
- **R3. Screen reader support for focusable images.** `role="img"` with a roving tab index and `aria-roledescription` is read as intended in principle, but readers differ on the description and on images in focus mode. Mitigation: the names carry everything without the description; a VoiceOver and NVDA pass before release, recorded as not yet verified until then.
- **R4. Names from hidden cells.** The accessible name computation includes hidden content referenced by `aria-labelledby`, which every engine implements (to verify in WebKit with VoiceOver). Mitigation: a play test reads each bar's computed name in three engines; the fallback is an `aria-label` joined from the three strings with a space, as the live region's parts were.
- **R5. A container in a shrink-to-fit parent.** As StatTile and the accounts list. Mitigation: `contain-intrinsic-inline-size: 20rem` and a story in a flex row.
- **R6. The refactor.** Moving LineChart's insides could change it. Mitigation: the move is its own commit with LineChart's tests and baselines unchanged and its size within 0.1 kB.
- **R7. The palette's near neighbors.** Olive is 4.4 from warning under deuteranopia in light, violet 2.9 from link blue under deuteranopia in dark, teal 10.2 from success in dark. Mitigation: no chart draws a status or a link beside a series (the meaning rules, enforced by the `ChartColor` type), every series has a legend label and a bar name, and textures are one prop away.
- **R8. Untrusted content.** Prose styles what an app renders. Model output can carry links and markup meant to mislead. Mitigation: the consumer renders with `skipHtml` and neutralizes links and images (section 8.10), which the docs make the recommended path; no `html` prop; the docs' safe rendering section for CMS HTML.
- **R9. No italic face.** `base.css` sets `font-synthesis: none`, so `em` in prose draws upright if the app loaded only the roman face. Mitigation: the installation docs load the italic axis too, and the Prose page says so; a story draws `em` and the baseline shows it; Persian, whose face has no italic, takes weight 500 instead.
- **R10. A wide amount column.** The `max-content` amount column takes its width from the widest amount, so a long figure ("-$123,456.78", about 85px at 14px) narrows every row's track. Mitigation: under 24rem the labels leave the row, so the track keeps at least about 160px at 320px; the docs advise compact figures ("$12.3K") in a narrow card; a story pins the widest figure the consumer expects.
- **R11. Tracking and cursive scripts.** Headings' -2% tracking spaces Persian letters in engines that apply it. Mitigation: prose resets it under `:lang(fa)` and `:lang(ar)`; the same reset for `Heading` is a follow-up the plan records, since it changes a shipped part.
- **R12. The outline's corner.** An outline follows `border-radius` in Chromium, Firefox and WebKit at the browser floor (to verify for Safari 16.4). Mitigation: the play test measures the ring in three engines; the fallback is a ring drawn as a pseudo-element border with the radius plus the offset.
- **R13. Hatched read as a category.** Stripes might still read as a second thing. Mitigation: the same color, the legend's hatched key, the period in the series' label and in each bar's name, and slate amounts; the consumer reviews `CompareToPrevious` and `CompareHorizontal` before the release, and the lighter fill for ink stays the alternative (open question 25).
- **R14. The neutralized spans depend on the app.** Prose cannot see react-markdown's `components` map; an app that forgets it renders real links in model output. Mitigation: the recipe and the Prose page show the map first, and the docs' `ModelOutput` story is the reference; the library cannot enforce it.
- **R15. A scrolling region per table.** Every `ProseScroll` is a tab stop and a named region, so a report with many tables adds stops and landmarks. Mitigation: the docs wrap only tables wider than three columns, and the label names the table ("Spending by category, table").

## 15. Open questions

Each has a recommended answer. The owner took every recommendation on 2026-10-18 (section 19).

1. **The consumer's Insights page.** Answered by the consumer on 2026-10-18; section 3 records the answers and sections 1, 5.5, 7, 8.10 and 8.11 apply them.
2. **Grouped bars.** Settled: included, two series at most (income beside spending, this period beside the last), enforced by the types (section 7.2).
3. **The palette.** Recommended: the four hues of section 5.2, as tokens, with slate as "Other", built just before the stacks. Alternative: no new hues, stacks drawn as an ink ramp, which keeps the system monochrome but encodes an order the categories do not have.
4. **The palette's size.** Recommended: four, which the consumer confirms is enough for its top four and Other. Alternative: six, adding a sky and a raspberry; it passes the adjacent checks (9.5 worst) but puts the sky 5.7 from the teal for normal vision and the raspberry 10.4 from error.
5. **Bar ends.** Recommended: `--radius-micro` at the data end in Rounded and Soft, square in Square, square at the baseline. Alternative: Meter's pill (a half circle at the data end in Rounded and Soft), closer to the system's stadium language but hiding the value at the top of a curve and turning short bars into dots.
6. **The focus model.** Recommended: per-bar roving focus for BarChart, LineChart unchanged in this batch, and LineChart's points reconsidered after the screen reader pass of risk R3. Alternative: BarChart on LineChart's model (one focusable plot, a live region), one model for both charts but no ring on the bar and a live region a screen reader may cut short.
7. **Pointer emphasis.** Recommended: dim the other bands to 40% under a pointer. Alternative: a band wash behind the active band (Carbon's and Recharts' cursor, to verify), which adds a shape whose corners must be concentric with bars of varying height and gap.
8. **Value labels inside bars.** Recommended: never; the amount column (horizontal) or outside the end (vertical). Alternative: inside when the app says it fits (`valueLabelPlacement`), which the library cannot check without measuring.
9. **Long category labels in a vertical chart.** Recommended: two lines then an ellipsis, with the docs steering long labels to a horizontal chart (the consumer's month labels are short). Alternative: wrap without a limit, which can make the label area taller than the plot.
10. **States on LineChart too.** Recommended: yes, in this batch, from the shared frame. Alternative: BarChart only, leaving LineChart's states to the app.
11. **Textures.** Recommended: `hasTexture` off by default and always on in forced colors. Alternative: textures on by default for stacks, safer for color-blind readers but busier than the system's quiet surfaces.
12. **A color for money out.** Settled by the consumer: none; income is `gain`, spending ink, and a negative is ink below zero, the NumberField record's rule.
13. **Bars that act.** Settled: later. The consumer's table under the chart links to the transactions, so `onBarPress` and an `href` per bar are not built now. Recorded as a later candidate: Enter, Space and a press on the focused bar, through `RouterProvider` for an `href`, with the bar's role becoming `link` or `button`, when a consumer asks for drill-down from the chart itself.
14. **Orientation by width.** Recommended: no; the app picks `orientation` per grouping, as the consumer's SegmentedControl does, and a narrow horizontal chart puts labels above its bars. Alternative: vertical over 30rem and horizontal under, by container query, which the HTML bars make possible but which changes the keys and the reading order with the box.
15. **The class name `prose`.** Recommended: `prose`, as agreed, with the docs' note about Tailwind Typography (risk R1). Alternative: `article-body` or `rich-text`, free of the collision but unfamiliar to every Tailwind user.
16. **A heading step for `h3`.** Recommended: no new step; `h3` takes the 14px, 700 subhead, the docs' own MDX rule. Alternative: a 20px step for prose `h3` (Tailwind's and Primer's 1.25em, to verify), which needs a measured reason in the type scale and a token.
17. **Bold.** Recommended: `strong` at 700. Alternative: 500, the headings' weight, which keeps bold quieter but which readers can barely tell from 450 at 16px.
18. **The measure.** Recommended: 70ch on text blocks, the docs' value. Alternative: 65ch on the whole box, Tailwind's, which also narrows tables and code.
19. **A small size.** Recommended: one size now; Ask answers, which may sit in a narrower panel, are later. Alternative: a `prose-small` variant at the small step for side panels and help popovers, added when Ask needs it.
20. **HTML input.** Recommended: children only; React's raw HTML attribute passes through for an app that has sanitized HTML. Alternative: an `html` prop, shorter to use but an invitation to render unsanitized strings.
21. **Dogfooding Prose in the docs.** Recommended: move the docs' code block to core's `pre` look now (one source of truth), and move the docs' MDX sections onto `.prose` in the next batch, after the consumer has used it, since the docs' section notes and preview stages need their own exceptions. Alternative: move the MDX sections now, one docs task with no screenshot baselines but a check of every page.
22. **Persian list numbers.** Recommended: Persian digits under `:lang(fa)` by default, for the goals guide. Alternative: decimal everywhere unless the app sets `list-style-type`, which leaves Latin digits in a Persian article.
23. **Mixed-direction paragraphs.** Recommended: the renderer writes `dir="auto"` per paragraph; Prose sets nothing. Alternative: `unicode-bidi: plaintext` on text blocks, automatic but with alignment that differs by engine (to verify).
24. **The next charts.** Recommended: area (LineChart's `hasArea` grown into stacked areas) before donut, since a donut's arcs are the gauge's and an area's paths are already in `path.ts`. Alternative: donut first, if a later Insights view wants a share of the month at a glance.
25. **The previous-period look.** Recommended: `look: 'hatched'`, Meter's stripes in the series' color inside a full-strength border, because it keeps one color, clears 3:1 for both ink and `gain` in both modes by its border, and survives forced colors as solid against striped. Alternative: the same hue lighter, which works for ink at about 50% in light and 40% to 50% in dark but has no step for `gain` that is both visible and apart from solid `gain` (section 5.5), so Income compared with the last period would need stripes anyway.
26. **A change chip on StatTile.** StatTile has a change line (an arrow, the app's sentence, a neutral, `gain` or `warning` tone), not a chip. Recommended: keep the line; "Up $120 vs September" is `change={{ direction: 'up', label: 'Up $120 vs September' }}` today, and a filled chip would add a second look for the same words and a fill whose tone must stay neutral by the color rules. Alternative: `change.look: 'chip'`, a pill in a 12% wash of the tone's color, as some dashboards draw a delta, added in a later batch if the consumer's design asks for it.
27. **The neutralized spans' classes.** Recommended: `span.prose-unlinked` (the text's own look) and `span.prose-image` (the alt text in a small slate box), documented on the Prose page with the react-markdown `components` map. Alternative: no classes, the spans drawn as plain text by default, simpler but leaving a dropped image invisible and a bare address unbreakable.
28. **`ProseScroll` as a part.** Recommended: a static part in `@snapshot-ui/react` with a required name, so the scrolling region is named and focusable by construction. Alternative: only the `.prose-scroll` class, documented with the attributes it needs, smaller but easy to use without a name or a `tabindex`.

## 16. Size budget

Measured as the others, without React, React Aria and Lucide, to start at:

| Entry | Budget | Reason |
| --- | --- | --- |
| `{ BarChart }` | 5.5 kB | LineChart's entry measures 3.25 kB with its table, keys and readout; BarChart shares those through the foundations and adds stacking, two orientations, the amount column, the hatched look (CSS only), the roving focus and the states, estimated at 4.5 to 5 kB; the rule rounds up and adds 0.5 kB. Grouped at two series removes no code, since stacks keep the series loop |
| `{ LineChart }` | 4 kB, unchanged | The refactor may not grow it by more than 0.1 kB; the states add about 0.3 kB, inside the same limit |
| `{ LineChart, BarChart }` | 7.5 kB | The shared foundations counted once; a new entry, so an app that uses both sees the saving |
| `{ Prose, ProseScroll }` | 0.5 kB | Two elements |

The CSS adds about 7 kB to `styles.css` before compression: the bar chart about 3.8 kB in `charts.css` (the hatched look and the amount column included; shared selectors keep LineChart's rules from being written twice), `prose.css` about 3.2 kB (the neutralized spans and `prose-scroll` included), and eight color declarations in the tokens. A part over its budget is reported with the number, as 3c's SidePanel was, and the limit follows the rule: the measured entry rounded up to 0.5 kB, plus 0.5 kB.

## 17. Visual baseline estimate

Each visual story is baselined in five modes (Rounded light, Rounded dark, Soft light, Square light, Rounded light at 375px), and a story tagged `density` adds compact, six.

| Group | Visual stories | Of them with compact | Baselines |
| --- | --- | --- | --- |
| BarChart, horizontal | 5 | 0 | 25 |
| BarChart, vertical and grouped | 7 | 0 | 35 |
| BarChart, shared | 7 | 1 (`InCard`) | 36 |
| BarChart, stacked | 3 | 0 | 15 |
| LineChart states | 3 | 0 | 15 |
| Prose | 9 | 1 (`InCard`) | 46 |
| Pages/Insights | 1 | 1 | 6 |
| Right to left (`BarChart`, `BarChartHorizontal`, `Prose`) | 3 | 0 | 15 |
| **New** | **38** | **3** | **193** |

Existing baselines: none should change. LineChart's 40 are the refactor's proof (section 6) and must stay byte-identical; `charts.css`'s shared selectors draw the same values; StatTile gains no story; no existing story draws `.prose` or a chart token. Expect 180 to 205 new files, depending on how the plan splits BarChart's layouts and states into stories; the stacked group's 15 come last, with the palette. Any change to an existing baseline is investigated before it is committed, and every new one goes through `pnpm --filter @snapshot-ui/storybook visual:docker`.

## 18. Release

- **Changesets.** For `@snapshot-ui/core` and `@snapshot-ui/react`, minor, released together as 0.9.0: `prose.md` (`prose.css`, `Prose`, `ProseScroll` and their props types, the `prose-unlinked` and `prose-image` classes), `chart-palette.md` (the four tokens and their Tailwind names). For `@snapshot-ui/charts`, minor, 0.2.0: `bar-chart.md` (BarChart and its types: `BarChartProps`, `BarChartSeries`, `BarSeries`, `BarValue`, `BarChartLabels`, `ChartStatusLabels`, `ChartColor`), `line-chart-status.md` (LineChart's `status`, `statusContent` and `statusLabels`).
- **One release, built in the consumer's order.** The batch ships as one release even though stacked bars come last; if the stacks slip, the horizontal and grouped chart and Prose can ship first as 0.9.0 and charts 0.2.0, with the palette and stacks as a later minor of each (charts 0.3.0, core 0.10.0), since nothing before them depends on the palette.
- **The core peer.** Charts' `@snapshot-ui/core` peer is `workspace:^`, which publishes as a caret on core's version at release, `^0.9.0`. A 0.x caret accepts only its own minor, so charts 0.2.0 needs core 0.9, and it must: BarChart reads the bar rules that only core 0.9.0's `charts.css` has, and its stacks the `--color-chart-*` tokens. The charts changeset says so, as each earlier peer patch did; and from here every core minor needs a charts release that moves the peer again, as batches 3a to 5 did.
- **`LineChartLabels` does not grow.** The type requires all its labels together (the LineChart record), so adding `loading`, `empty` and `error` to it would break every app that passes `labels`. The three live in `ChartStatusLabels`, a separate optional prop with English defaults on both charts, so LineChart's change is additive and stays inside a minor.
- **Release note for the consumer:**
  - Upgrade `@snapshot-ui/core` and `@snapshot-ui/react` to 0.9.0 and `@snapshot-ui/charts` to 0.2.0 together; charts 0.2.0 refuses core 0.8.
  - Every figure is your string, including amounts and a stack's `totals`; the chart never sums, sorts or formats. Sort a ranked list and put "Other" last yourself.
  - Month view: `orientation="vertical"`, Income with `color: 'gain'` beside Spending with `color: 'ink'`, or Net alone; negatives split at zero by themselves.
  - Category, Merchant and Account: `orientation="horizontal"`; amounts sit at the end by default; refunds below zero keep their amount in the column.
  - Compare: a second series with `look: 'hatched'` and the previous period's name as its `label`; it takes the first series' color.
  - Two series at most when grouped; the types refuse a third. Stacks take up to five, the fifth your "Other".
  - Bars always start at zero; a `valueDomain` without zero is widened.
  - Pass `labels` (all six) and `statusLabels` (all three) on a Persian page, and Persian digits in every string.
  - StatTile's `change` already draws "Up $120 vs September".
  - Prose: render Markdown with react-markdown in a server component, `skipHtml` for model output, map `a` to `span.prose-unlinked` and `img` to `span.prose-image`, wrap `table` in `ProseScroll` with a name, and give `pre` a `tabIndex`; set `--font-sans` to Vazirmatn first under `:lang(fa)`; shift Markdown headings so the page keeps one `h1`; load Sofia Sans's italic.

## 19. Owner rulings (owner, 2026-10-18)

The owner approved this spec on 2026-10-18 and took every recommendation. Each ruling names the section it settles; the plan, `docs/plans/2026-10-18-insights.md`, names the task that builds it.

1. **Scope and release.** The whole batch ships as one release: `@snapshot-ui/core` and `@snapshot-ui/react` 0.9.0 and `@snapshot-ui/charts` 0.2.0, in the build order of section 1, with stacked bars and their palette last. The fallback of section 18 (stacks in a later minor if they slip) stays a fallback, not the plan.
2. **The consumer's page** (open question 1). Section 3 is the input, as the consumer answered it.
3. **Grouped bars** (open question 2). In scope, two series at most, enforced by `BarChartSeries`.
4. **The palette** (open questions 3 and 4). Four tokens, teal, violet, olive and magenta, with the values of section 5.2, and slate as "Other"; built just before the stacks.
5. **Bar ends** (open question 5). `--radius-micro` at the data end in Rounded and Soft, square in Square, square at the baseline.
6. **The focus model** (open question 6). Per-bar roving focus for BarChart; LineChart's model unchanged in this batch, and reconsidered after the screen reader pass.
7. **Pointer emphasis** (open question 7). The other bands dim to 40% under a pointer only.
8. **Value labels** (open question 8). Never inside a bar: the amount column for a horizontal chart, outside the data end for a vertical one.
9. **Long vertical labels** (open question 9). Two lines and an ellipsis; the docs steer long labels to a horizontal chart.
10. **States on LineChart** (open question 10). Yes, in this batch, with `ChartStatusLabels` as a separate prop.
11. **Textures** (open question 11). `hasTexture` off by default, always on in forced colors.
12. **Money out** (open question 12). No color of its own: spending is ink, a negative is ink below zero.
13. **Bars that act** (open question 13). Later; no `onBarPress` and no `href` in this batch.
14. **Orientation** (open question 14). The app's choice; no switch by width.
15. **The class name** (open question 15). `prose`, with the docs' note about Tailwind Typography.
16. **Prose's `h3`** (open question 16). No new step: the 14px, 700 subhead.
17. **Bold** (open question 17). `strong` at 700.
18. **The measure** (open question 18). 70ch on text blocks only.
19. **A small Prose** (open question 19). Not in this batch.
20. **HTML input** (open question 20). Children only; no `html` prop.
21. **Dogfooding** (open question 21). The docs' code block look moves to core's `pre` in this batch; the docs' MDX sections move onto `.prose` in the next.
22. **Persian list numbers** (open question 22). Persian digits under `:lang(fa)` by default.
23. **Mixed-direction paragraphs** (open question 23). The renderer writes `dir="auto"`; Prose sets nothing.
24. **The next charts** (open question 24). Area before donut, in a later batch.
25. **The previous-period look** (open question 25). `look: 'hatched'`: Meter's stripes in the series' color inside a full-strength border, amounts in slate, solid against striped in forced colors.
26. **StatTile's change** (open question 26). Keep the line; no chip.
27. **The neutralized spans** (open question 27). `span.prose-unlinked` and `span.prose-image`, documented with the react-markdown `components` map.
28. **`ProseScroll`** (open question 28). A static part in `@snapshot-ui/react` with a required name.
