# Accounts: DescriptionList, CardActions, Gauge and MonthGrid: design

Status: approved on 2026-10-18. Written for review and revised the same day with the consumer's answers to open question 1 (section 3); the owner then took every open question of section 18 as recommended, question 4 among them: both low score bands are warning. Section 14.2 records the rulings; everything else is decided here and listed in section 14.1. The plan is `docs/plans/2026-10-18-accounts.md`.
Parent spec: `docs/specs/2026-10-10-snapshot-ui-design.md`. This document pulls forward the phase 4 row "DescriptionList" and adds CardActions, Gauge and MonthGrid, which the parent spec does not list. Gauge is the circular sibling of the phase 4 Meter that batch 2 built (`docs/specs/2026-10-13-home-design.md`, section 7). It answers batch 5 ("Accounts") of the first consumer's roadmap, agreed with the consumer as DescriptionList and Gauge, to which the consumer's answers add CardActions and a month grid. The design authority remains `docs/design-system.md`.
Released before this: batch 4, `@snapshot-ui/core` and `@snapshot-ui/react` 0.7.0 (the documents parts, on `feat/documents` at the time of writing). This batch is the 0.8.0 minor release of core and react. Section 2 lists what it takes from batches 1 to 4.

## Summary for the owner

What this batch adds, in plain words, in the consumer's order of need:

- **DescriptionList**: a read-only list of named values, such as an account's name, type, institution, last four digits, bank feed status, credit limit and APR. Each row shows a name and its value side by side where there is room and one above the other where there is not, decided by the space the list itself has, not by the screen. A row can carry its own buttons, shows "Not set" for a missing value, wraps a long value, and keeps amounts and percentages left to right on a Persian page.
- **CardActions**: a place for buttons in a plain card's header, such as the Edit on the account's Details card.
- **Gauge**: one figure against a range, drawn as a ring or a half ring: a credit score from 300 to 850 with a word under it ("Good") and up to five marks for the score bands, or credit utilization from 0 to 100% as a small ring in each table row and a larger one for the total. It sits beside the existing Meter (a straight bar) as one family: the same thickness, the same ink, the same rule that words, not color, say what the state is.
- **MonthGrid**: a compact grid of months, twelve to a row and one row per year, each month held, partial or missing, with a sentence such as "Missing: March, April 2025" and a hidden table for screen readers. The consumer uses it to show which months of statements an account has; the part is generic, so any "which months do we have" view can use it.
- **Carried from batch 4**: the docs site's hand-built page header moves to the library's PageHeader, as the owner ruled for "the next batch" (documents spec, section 13.3 item 7).

Why: the consumer's next pages are its accounts list, an account's detail page and its credit tab. The list page is already covered by StatTile, Avatar, Badge and DataTable; the detail page and the credit tab need these four parts. Every one is static and renders on the server with no client JavaScript.

What it no longer adds: a Copy button. The consumer masks account numbers, so nothing on these pages is copied; the design is kept in section 5.6 for a later batch. Also not added, on the consumer's word: several values in one gauge, avatar groups, account menus and theme switches.

## 1. Goal

Give an account's pages their parts: a list of details that reads well at every width, in a card with an Edit in its header; a gauge for a score or a share of a limit, from a table row to a hero; and a grid of months that says, in shapes and in words, which months are held. Ship them as the batch 5 minor release, 0.8.0.

The hard parts are small but exact. A description list must stay a real `dl` while it carries buttons, switch layouts without a measurement, and keep its buttons out of a card's rounded corner. A gauge must draw an arc whose length is the value on any range, caps included, on the server, in both directions, in forced colors, and never let a color say alone what only words may say. A month grid must say the same thing to a reader who sees it, one who hears it and one who sees it in forced colors, in any calendar the app counts in.

Build order, which is also the plan's order and the consumer's order of need:

1. **DescriptionList and DescriptionListItem** (section 5).
2. **CardActions** (section 6).
3. **Gauge** (section 7).
4. **MonthGrid** (section 8), last, as the consumer recommends.
5. **The docs header on PageHeader** (section 9), carried from batch 4.
6. **The Accounts recipe, the guides and the changesets** (section 16).

Out of scope, each recorded where it is deferred:

- **CopyButton and copyable values** (section 5.6). Deferred at the consumer's request: its numbers are masked.
- Editing a value in place, Atlassian's inline edit. The consumer's Edit opens a Dialog (open question 10).
- `AccountMenu` and `ThemeSwitch` (parent spec, phase 5), `AvatarGroup` (phase 4), and several values in one gauge: not needed by the consumer (open questions 14 to 16).
- A circular progress bar. Work getting done is ProgressBar's (batch 4); Gauge is a measurement (section 7.3).
- Calendars with thirteen months in some years (the Hebrew calendar's leap years) in MonthGrid: every row of one grid has the same number of months (section 8.3).
- Number, date and month-name formatting, as everywhere: every figure, year and month name is the app's string.

## 2. Depends on

| From batch 4 or earlier | Used here as |
| --- | --- |
| `Card` and its holder properties (`card.css`): `--holder-radius`, `--holder-border`, `--holder-pad`, `--holder-corner-inset` | The list's controls at a card's first and last row move clear of the corner (section 5.5); MonthGrid's cells keep the text-sized step (section 8.5) |
| `CollapsibleCard`'s `.card-actions` and its header layout (`card.css`) | CardActions (section 6) |
| The Dense data rule (design record, "Dense data"): a row of `max(var(--size-target), var(--size-field))`, text padded `(row - line - 1px) / 2`, one `--color-divider` rule between rows | The list's row (section 5.5); a 32px gauge fits DataTable's 48px and 40px rows |
| `Meter` (`meter/Meter.tsx`, `meter.css`): the hand-written `meter` role on the bar, the naming chain (a non-blank `aria-labelledby`, else `aria-label`, else the label, else the value text), `valueLabel` as `aria-valuetext`, the 8px track in `--color-frame`, `--meter-ink`, `--meter-surface`, the hatch (ink stripes 2px wide every 6px at 45 degrees with a 1px ink edge) and the legend's swatches | Gauge's semantics, track, tones and marks' ring (section 7); MonthGrid's partial look and legend (section 8) |
| `ProgressBar` (batch 4): React Aria's prop names (`value`, `minValue`, `maxValue`, `valueLabel`), the 200ms move and its reduced-motion rule, a range whose `maxValue` is not above `minValue` | Gauge's props and motion |
| `Spinner`: a circular stroke with round caps, "the ends of a stroke are dots, and dots stay round in every shape" | Gauge's caps (section 7.5, open question 5) |
| The charts' direction rule (`charts.css`): `--chart-flip` from `:where([dir='ltr' i])` and `:where([dir='rtl' i])`, mirroring an svg with `scale` | Gauge's mirror in right to left (section 7.6) |
| `copy.css`'s numerals: tabular figures, `nowrap`, `direction: ltr`, `unicode-bidi: isolate`, `text-align: match-parent` | A numeric value in the list (`isNumeric`), Gauge's figure, MonthGrid's year labels |
| `LineChart`'s table view and its visually hidden live copy (`charts`) | MonthGrid's hidden table alternative (section 8.4) |
| `StatTile`'s trend slot (96 by 32 at most) and `DataTable`'s cells | A 32px gauge in a tile or a table row (section 7.5) |
| `Badge` and its tones (`neutral`, `info`, `success`, `warning`, `error`) | The bank feed status and a duplicate warning in the consumer's rows and lists |
| `PageHeader` and `Breadcrumbs` (batch 4) | The docs header (section 9) |
| `useId`, `cx`, `present`, `AccessibleName`, `AriaName` | As everywhere |

React Aria parts used for the first time: none. All four new parts import nothing from React Aria and are server parts. `@internationalized/date` is not imported by the library; the recipe uses it in the app to place statements in Persian months (section 8.3).

## 3. What the consumer needs

The consumer answered open question 1 on 2026-10-18. Its answers, as input:

1. **The accounts list.** Summary StatTiles exist already. The list is grouped by account type; each row has an Avatar logo, "Name ending 1234", a coverage line, the balance with its date, and the bank feed status or a failure with a link to fix it. A duplicate shows as a Badge. Each row links to the account's detail page. It is built from DataTable or a plain list; nothing new is needed there.
2. **The account's detail page.** A balance LineChart, then a Details card holding a DescriptionList: Name, Type, Institution, Last four, Bank feed status, and for a card the Credit limit and APR. "Edit" sits in the Details card's header and opens a Dialog. Merge opens a Dialog and Remove a ConfirmDialog. Amounts, limits and percentages are numeric and stay left to right on a Persian page.
3. **The credit tab.**
   - A score card: a Gauge from 300 to 850, a 160px semicircle, the score as the centre numeral with a word under it, and four marks at 580, 670, 740 and 800. Higher is better; the app asked for neutral for good scores, warning from 580 to 669 and error under 580. The owner's ruling (section 14.2 item 2) draws both lower bands in warning, told apart by the word under the figure and by the marks.
   - Utilization: 0 to 100%, lower is better, with marks at 10% and 30%: a 32px ring in each table row and a 96px ring for the overall figure.
4. **Not needed:** CopyButton (numbers are masked; deferred, kept for later), several values in one gauge, AvatarGroup, AccountMenu and ThemeSwitch.
5. **A new request, the coverage strip.** A compact month grid, twelve cells to a row and one row per year, each cell held, missing or partial, with a text alternative such as "Missing: March, April 2025". Asked for as a generic part: the app passes the years and a state per month, its own named states mapped to a small fixed set of library looks (filled, empty, partial); the labels are the app's; it renders on the server; it has a text summary and a visually hidden table or list; it covers right to left, Persian months through the calendar system where feasible, forced colors and the corner rule for its cells. Suggested name MonthGrid (open question 17).
6. **Order of need:** DescriptionList, CardActions, Gauge, then MonthGrid.

Its rules for every part, unchanged from batch 4: `'use client'` only on interactive parts; no `Intl` formatting and no `window` at render, and no first-paint measurement; no external request and no injected script; light and dark, all three shapes, right to left (the Persian guide), comfortable and compact density; WCAG 2.2 AA including 2.5.8; navigation through `RouterProvider`; everything exported from the react index, with the CSS in `core/styles.css`.

## 4. Approach

**The pages are mostly text and figures, so the parts are static.** A description list, a card's actions, a gauge and a month grid draw what they are given and hold no state. All four render on the server with no client JavaScript, as Meter and ProgressBar do. The buttons in a row or a card's header are the app's.

**Layout by the part's own width.** A list beside a side panel, in a third-width card or on a phone has the same problem: too little room for a name column. The list and the month grid are their own size containers and change layout at their own widths, as StatTile, DataTable and FileDropZone do, so the server's HTML is right at every width and nothing is measured.

**A gauge is a meter bent round.** It takes Meter's role, naming, track and ink, and ProgressBar's prop names and motion, so the three read as one family: Meter for a value against a limit in a row, Gauge for a value on a range at a glance, ProgressBar for work getting done.

**Draw without measuring, keep the shape.** The gauge's svg has a fixed `viewBox` per size and scales uniformly, so a circle stays a circle; the arc's length is computed in render from the value and the circumference; the figure, its word and the label are HTML over and under it, in the page's font. The month grid is HTML cells in a CSS grid.

**Words carry the state; shapes repeat it; color only repeats.** A warning or error tone on a gauge has the app's words; the marks show a band by position. A missing month is an outline and a partial month a hatch, beside the sentence and the table that say so. A missing value in a list has words. Nothing is color alone.

**Calendars are the app's.** The library never computes a date. A month grid is twelve columns and as many rows as the app gives, labelled with the app's month names and years, so a Persian page counts in Persian years and months with no calendar code in the library.

| Part | In the server's HTML | After hydration |
| --- | --- | --- |
| DescriptionList, DescriptionListItem | Everything: the `dl`, each `div`, `dt` and `dd`, the app's actions, the empty words | Nothing changes |
| CardActions | Everything | Nothing changes |
| Gauge | Everything: the role and values, the svg with its arc and marks, the figure and its word, the label and the value text | Nothing changes |
| MonthGrid | Everything: the visible grid, the legend, the summary, the hidden table | Nothing changes |

Rejected along the way:

- **A data form for the list** (`items={[{ term, description }]}`, Polaris' shape) as the only API. Composition keeps each value a React node the app can fill with a Badge, an Avatar or a link, and suits server components; open question 8 keeps the data form as the alternative.
- **A table for name and value pairs** (Carbon's StructuredList). A table promises comparison across columns; an account's details are one column of names and one of values, which is what `dl` means.
- **A viewport breakpoint for the list's layout.** A list in a 24rem side panel on a 1440px screen would draw side by side with a 7rem name column.
- **`variant="circular"` on Meter.** Meter stacks segments, places a pace marker and draws a legend; an arc of stacked hatched segments is a different drawing, and the props would split by variant. Two parts with one semantics read more plainly, as SwiftUI's `Gauge` styles share a model and not a drawing.
- **Putting Gauge or MonthGrid in `@snapshot-ui/charts`** (sections 7.1 and 8.1).
- **HTML `<meter>`**. It cannot be drawn as an arc in any engine, and its `low`, `high` and `optimum` regions color themselves green, yellow and red, which the color reservations forbid.
- **A sweep from zero when a gauge first appears.** Apple's rings sweep in; here the server's HTML is final and a sweep would delay the one thing the reader came for (open question 6).
- **A month grid drawn as the real table** (`table` restyled with `display: grid`). Changing a table's `display` has dropped its table semantics in WebKit, so the visible grid is hidden from assistive technology and a plain table carries the data (section 8.4).

## 5. DescriptionList

### 5.1 Anatomy

```
Horizontal (30rem and wider of its own box):

Name               Everyday Visa
Type               Credit card
Institution        Northwind Bank
Last four          4821
Bank feed          [Connected]
Credit limit       $5,000.00
APR                24.9%
Nickname           Not set                                  [Add]

Stacked (under 30rem):

Name
Everyday Visa
Bank feed
[Failed] Reconnect
```

Each row is one `div` holding a `dt` (the term), a `dd` (the value) and, when the row has actions, a second `dd` holding them.

### 5.2 API

```ts
export type DescriptionListLayout = 'auto' | 'horizontal' | 'stacked';

export interface DescriptionListProps extends Omit<HTMLAttributes<HTMLDListElement>, 'children'> {
  /** DescriptionListItem elements, in order. */
  children: ReactNode;
  /**
   * `auto` draws terms beside values from 30rem of the list's own width and above them under it.
   * `horizontal` and `stacked` hold one layout at every width.
   * @default 'auto'
   */
  layout?: DescriptionListLayout;
  /** A rule between rows, never above the first or under the last. @default true */
  hasDividers?: boolean;
  ref?: Ref<HTMLDListElement>;
}

export interface DescriptionListItemProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  /** The name of the value: "Credit limit". */
  term: ReactNode;
  /** The value. Absent, `null`, `false` or an empty string is empty; `0` is a value. */
  children?: ReactNode;
  /** In place of an empty value: words in slate, or a link to add it, as GOV.UK's summary list does. @default 'Not set' */
  emptyValue?: ReactNode;
  /** The row's controls: an Edit button or link, named with the term (section 5.3). */
  actions?: ReactNode;
  /** An amount, a limit, a percentage or an identifier in Latin digits: tabular figures, left to right and isolated in every direction. @default false */
  isNumeric?: boolean;
  ref?: Ref<HTMLDivElement>;
}
```

### 5.3 Behavior

- **Markup.** `dl.description-list[data-layout]` holding the app's `DescriptionListItem`s. Each is `div.description-list-item`, the grouping the HTML standard allows inside a `dl`, holding `dt.description-list-term`, `dd.description-list-value` and, with `actions`, `dd.description-list-actions`. The `div` keeps a row's parts one box for the layout and the rule, and axe's `definition-list` and `dlitem` rules pass with it. No ARIA role is added or overridden: `role="list"` on the `dl` would drop the term and definition semantics that VoiceOver announces.
- **Static.** No `'use client'`, no hooks, no context, since a server component has none. A Persian page passes its own `emptyValue`, or wraps DescriptionListItem in a component that does.
- **Terms with actions** (decided here, item 3). The actions are the app's nodes in their own `dd`, after the value, as GOV.UK's summary list puts its "Change" link. Each control names the row: a visible "Edit" with the term in its name ("Edit Nickname"), written as GOV.UK writes it, `Edit<span class="visually-hidden"> Nickname</span>`, or with `aria-label`. WCAG 2.5.3 (Label in Name) holds because the name starts with the visible word. In the horizontal layout the actions take the row's last column; stacked, they stand at the end of the term's line, as the gear stands beside each heading in GitHub's pull request sidebar. The consumer's Details card puts one Edit in the card's header instead (section 6); both are shown in the docs.
- **Status values.** A value may hold a Badge and a link: the consumer's bank feed row shows "Connected" as a neutral Badge, or "Failed" as an error Badge with a "Reconnect" link after it. A feed that failed to sync is a failure, so error is its right tone; a duplicate account is warning ("needs a look soon"). An account that is active is neutral, never success, which means a save (the reservations extend to sample content).
- **Empty values** (open question 11). A value that is absent, `null`, `false` or `''` is empty: the `dd` carries `data-empty` and shows `emptyValue`, default "Not set", in slate. It is text the reader has to read, so it is never taupe (design record, "Where each text color may go"). It is never a dash, which reads as "dash" or as nothing. An `emptyValue` may be a link to add the value ("Add a nickname"), GOV.UK's guidance for a missing answer.
- **Long values.** A value wraps and a long unbroken word, an IBAN or an email address, breaks anywhere (`overflow-wrap: anywhere`, the Card's rule, set on the value for a list outside a card). Nothing truncates: an ellipsis on a value hides data. A long term wraps within its column.
- **Numeric values.** `isNumeric` gives the value `copy.css`'s numeral rules at the body size: tabular figures, `direction: ltr`, `unicode-bidi: isolate` and `text-align: match-parent`, so "$5,000.00", "24.9%" or "4821" keeps its order and starts at the line's start on a Persian page, as the consumer asks for amounts, limits and percentages. A Persian page that writes its figures in Persian digits still sets it, for the sign and the percent sign's place.
- **Layouts** (open question 7 covers direction; the switch is decided here). `layout="auto"` follows the list's own width: the `dl` is a size container (`container: description-list / inline-size`) and from 30rem of its content box a row is a grid of three columns, the term, the value and the actions; under 30rem the term stands above the value. `horizontal` and `stacked` hold one layout. 30rem is chosen so the term column, 30% of the row, is at least 9rem (144px), which holds "Routing number" (about 105px at 14px, weight 500) on one line; under it, most terms would wrap.
- **No keys of its own.** The list is not a widget. Tab moves through the app's actions in reading order.

| Key | Does |
| --- | --- |
| Tab, Shift+Tab | Through each row's actions, in order. |
| Enter, Space | On an action, what the app gave it. |

### 5.4 How others do it

| System | Part | Layout | Actions | Missing values | What this spec takes |
| --- | --- | --- | --- | --- | --- |
| Shopify Polaris | `DescriptionList`, `items` of term and description, `gap` tight or loose | A `dl`; terms beside descriptions on a wide viewport, above them on a narrow one | None of its own | None of its own | The `dl` and the switch, made on the list's own width |
| GOV.UK Design System | Summary list, and the summary card around it | Key, value and actions in a row `div`, stacked on a phone | "Change" links in a `dd`, with hidden text naming the row; rows without actions; card-level actions on the summary card | A link in the value to add it | The three-part row, actions in a `dd`, names that include the term, the add link as `emptyValue`, card-level actions as CardActions |
| GitHub Primer | No component; the pull request sidebar | A heading above its value | A gear beside the heading | "None yet" in muted text | The stacked layout's actions at the term's line |
| Atlassian | No component; Jira's issue details | Labels beside values | Values edited in place (inline edit) | "None" | Not inline edit (open question 10) |
| IBM Carbon | `StructuredList`, rows and cells with a header row, condensed and flush, optionally selectable | A table | Selection only | None | Nothing: a table is for comparison (section 4) |
| Material 3 | Lists with a headline and supporting text; Android's settings rows | The name above the value | A trailing control | Supporting text | The stacked layout's order: name, then value |

### 5.5 Look and CSS

- **The row** (the Dense data rule, with the value's line). `min-block-size: max(var(--size-target), var(--size-field))`, 48px, 40px compact and 44px compact on a coarse pointer; block padding `calc((row - 1lh - 1px) / 2)` against the value's line, 12.3px in comfortable and 8.3px in compact for one line of body text. A rule of 1px `--color-divider` between rows with `hasDividers`, none above the first and none under the last, so a list in a card ends at the card's padding.
- **Horizontal.** `display: grid; grid-template-columns: minmax(0, var(--description-list-term-size, 30%)) minmax(0, 1fr) auto; column-gap: var(--spacing-peer); align-items: baseline`. Every row has the same template, so the term column lines up down the list without subgrid (above the Chrome 111 floor). An app sets `--description-list-term-size` on the list for a wider or narrower name column. A row with no actions lets its value take the last column.
- **Stacked.** The term and the actions share the first line (`grid-template-columns: minmax(0, 1fr) auto`), the value spans the second, 4px under the term (half the part step, StatTile's caption gap).
- **Term.** `--text-small` at weight 500 in slate: a name, read before its value, so not ink, and set apart from a hint's 450.
- **Value.** `--text-body` at 450 in ink; with `isNumeric`, tabular figures. **Empty.** The same size in slate.
- **Actions.** `display: flex; gap: var(--spacing-part); justify-content: flex-end`. A 40px control sits level with the value's first line through `margin-block: min(0px, calc((1lh - var(--size-control)) / 2))`, the collapsible card toggle's technique, so the row does not grow for its button.
- **In a card: the corner** (design record, "Nested radii, derived"). A control in the last row of a list that ends a card sits inside the card's corner curve: in Rounded comfortable a 40px button centered on a 22.4px line overhangs it by 8.8px, which leaves it 1 + 32 + 3.5 = 36.5px from the card's bottom edge and 33px from its side, both under the 40px radius. The record's rule for a control at a card's foot applies: it moves down, not in, so it stays on the column's end edge. `.card-body > .description-list:last-child > .description-list-item:last-child`, when it holds actions (`:has(.description-list-actions)`), adds `calc(var(--holder-corner-inset) - var(--holder-pad))` to its block-end padding: 7px in Rounded, 19px in Rounded compact, 0 in Soft (the padding already clears the 16px curve) and 0 in Square. The first row of a list that starts a card with no header takes the same at its block start. Only the controls' row grows. The concentric audit (`apps/storybook/tests/concentric`) measures it in the `InCard` stories in all three shapes.
- **No corners of its own.** The list draws no frame, fill or radius, and its rules stop at its content box, so no part of it is a surface in a holder's corner. A card around it is the frame (section 6).
- **Contrast.** Ink and slate on lifted and on the canvas, gated already as text and cited by the contrast test, not added: ink 17.84 light and 17.42 dark on lifted, slate 5.31 and 6.94. The divider is a cue, not a boundary.
- **Forced colors.** The rules are borders, which the repaint keeps in `canvastext`; text takes the reader's colors. The block holds nothing else, and the CSS test's requirement of one is met by naming the rule's color.
- **Right to left.** Logical properties throughout: the term column is on the right, the actions on the left. A numeric value stays left to right and starts at the line's start (`match-parent`).
- **Print.** Rules and text print; the actions are hidden under `@media print`, since a printed page cannot press them.

### 5.6 Deferred: CopyButton

The consumer masks its account numbers, so nothing on its pages is copied, and CopyButton leaves this batch. The design worked out for it is kept here so a later batch starts from it:

- A client part on the ghost IconButton with a Tooltip, calling `navigator.clipboard.writeText` synchronously in the press handler (a press is a user activation, which Safari requires), with no `execCommand` fallback.
- The outcome, "Copied" or "Copy failed", held two seconds (the docs site's `useCopy` and Carbon's `CopyButton` feedback timeout), said in a polite status host mounted empty in the server's HTML, with the glyph swapping to a check on success and the button's name unchanged.
- In a description list, `copyValue` on a row, the button after the value, named "Copy" and the term through `aria-labelledby` so any node can be the term.
- The risk that sets its API: a copied value that the page does not show (a masked number that copies its whole digits) is in the HTML and the React Server Components payload. A later version should copy only what the page may hold, or take an asynchronous getter on a client page.

The docs site keeps its own code copy button (`apps/docs/components/mdx/copy-button.tsx`) until then.

## 6. CardActions

GOV.UK's summary card and the consumer's Details card put one Edit in the card's header. CollapsibleCard already lays out `.card-actions` beside its title; a plain `CardHeader` does not.

```ts
export interface CardActionsProps extends HTMLAttributes<HTMLDivElement> {
  ref?: Ref<HTMLDivElement>;
}
```

- **Markup.** `div.card-actions` placed in a `CardHeader` after the `CardTitle` and `CardNote`. Static, no hooks.
- **Layout.** `card.css` lays out a header holding it as CollapsibleCard's header is laid out (`.card-header:has(> .card-actions)`): a wrapping row, the title and note as one block taking the room left and never less than 12rem, the actions at the end with `var(--spacing-part)` between them, each centered on the other; actions that do not fit wrap under the note, so the order on screen is the reading order. A plain card and a collapsible card look the same.
- **The corner.** The header's actions sit at the card's top end. Their gaps from the card's edges are at most the edge and the padding, 33px in Rounded comfortable, under the 40px radius, on both axes. The record's rule moves a control down, not in, where a column stands under it, and the header's actions end on the body's column edge, so the header's block-start padding becomes the corner inset while it holds actions: `padding-block-start: calc(var(--holder-corner-inset) - var(--holder-pad))` added above, 7px in Rounded, 19px in compact, 0 in Soft and Square, as UploadTray's panel moves its header's trailing button. The concentric audit's `WithActions` story checks it.
- **What goes in it.** The consumer's Edit (a secondary Button that opens a Dialog), or a Menu with Merge and Remove. Merge and Remove are the app's: a Dialog and a ConfirmDialog in the danger tone.

## 7. Gauge

### 7.1 Where it lives

**In `@snapshot-ui/react`, with its CSS in core as `gauge.css`** (open question 2). Reasons:

- **It is a meter, not a chart.** It shows one value on a range, the WAI-ARIA `meter` role, exactly as Meter does. `@snapshot-ui/charts` holds data series on scales with axes, readouts and a table view (Sparkline, LineChart, and phase 6's bar, area and donut), versioned apart from the fixed group and with core only as an optional peer. A gauge has no series, no axis, no palette and no table.
- **Meter and ProgressBar live in react.** An app that draws a meter in a row and a gauge in a tile should import both from one package and read both on one docs group.
- **Industry.** Apple's SwiftUI ships `Gauge` in SwiftUI itself, with linear and circular styles, apart from Swift Charts; Ant Design's dashboard is a `type` of its `Progress`, a core component; Material's circular indicator is a core component. Carbon is the exception, with its gauge in Carbon Charts.
- **Nothing in charts is needed.** The geometry is two arc formulas and a dash length (section 7.4), no scale helper. The direction rule is four lines of CSS, written again in `gauge.css` so an app that imports one component's CSS gets it.

The cost: a later donut chart in charts will draw arcs too. The arc helper is small enough to copy, as charts already copies `cx`.

### 7.2 API

```ts
export interface GaugeMark {
  /** In the gauge's units, between `minValue` and `maxValue`: 670 on a score, 30 on a utilization. */
  value: number;
  /** What the mark means, added to the gauge's description: "Good from 670". */
  label: string;
}

export type GaugeBaseProps = Omit<HTMLAttributes<HTMLDivElement>, 'children' | 'aria-label' | 'aria-labelledby'> & {
  /** The visible name: "Credit score", "Utilization". Without it, `aria-label` or `aria-labelledby` names the gauge. */
  label?: ReactNode;
  /** The measurement, in the range's units. Drawn clamped to the range; above `maxValue` the gauge is over its limit. */
  value: number;
  /** The range's start, in the same units: 300 for a credit score. @default 0 */
  minValue?: number;
  /** The range's end: 850 for a credit score, 100 for a percentage. @default 100 */
  maxValue?: number;
  /**
   * The value in the app's words, shown under or beside the dial and given as the accessible value:
   * "742 of 850, Very good", "23% of your limit". At a warning or error tone, or over the limit, it must say so.
   */
  valueLabel: string;
  /** The short numeral in the middle at `md` and `lg`: "742", "23%". At most 4 characters at `md` and 6 at `lg`. None when absent. */
  figure?: string;
  /** A word under the figure at `md` and `lg`: "Very good". It repeats what `valueLabel` says. */
  figureCaption?: string;
  /** `ring` is a full circle from the top; `semicircle` an arc from the inline start over the top to the end. @default 'ring' */
  form?: 'ring' | 'semicircle';
  /** 32, 96 or 160px. @default 'md' */
  size?: 'sm' | 'md' | 'lg';
  /**
   * What the value means now, the app's choice: `warning` needs a look soon; `error` is a failure (section 7.3).
   * Above `maxValue` a neutral gauge draws as `warning`.
   * @default 'neutral'
   */
  tone?: 'neutral' | 'warning' | 'error';
  /** Up to five marks across the track: band edges, a threshold, a target. */
  marks?: readonly GaugeMark[];
  ref?: Ref<HTMLDivElement>;
};

export type GaugeProps = GaugeBaseProps & AccessibleName<'label'>;
```

The names are React Aria's (`value`, `minValue`, `maxValue`, `valueLabel`), as ProgressBar's are, and `minValue` is first class: the share, the arc, the marks and `aria-valuemin` all read it, so a 300 to 850 score draws 742 at 80.4% of the arc and reports `aria-valuemin="300"`. Meter's `max` is the odd one out, because a stacked meter has no single value; its page says so beside Gauge's.

### 7.3 Behavior

- **`meter`, not `progressbar`.** WAI-ARIA 1.2 defines `meter` as a scalar measurement within a known range and asks authors not to use it for progress, which is `progressbar`'s. A credit score, a utilization, a budget spent and a savings goal saved are measurements: the reader's state, which can go up or down. An upload or an import is work the system is doing, ProgressBar's. The docs page leads with this choice and links ProgressBar and Spinner.
- **Markup.** `div.gauge[data-size][data-form][data-tone]` holding `div.gauge-dial` and `div.gauge-text`. The dial has `role="meter"`, `aria-valuemin` (`minValue`), `aria-valuemax` (`maxValue`), `aria-valuenow` (the value clamped to the range) and `aria-valuetext` (`valueLabel`), and holds the `svg` (`aria-hidden="true"`, `focusable="false"`) and `span.gauge-figure` with `span.gauge-figure-caption`, both `aria-hidden="true"`. The text block holds `span.gauge-label` and `span.gauge-value-label[aria-hidden="true"]`, since the dial reads it. The role is on the dial, not the root, because `meter`'s children are presentational, so the label beside it is not lost, as Meter puts the role on its bar.
- **Name.** Meter's chain: a non-blank `aria-labelledby`, else a non-blank `aria-label`, else the label's id, else the value text's id, so the dial is never unnamed. With marks, the dial is described by a hidden span listing their labels in order of value, joined by full stops, after the caller's own `aria-describedby`.
- **Static.** No `'use client'`, no state; `useId` is the one hook. A server component renders it with no client JavaScript.
- **The range.** The share is `(value - minValue) / (maxValue - minValue)`, clamped to 0 and 1 for the arc. A range whose `maxValue` is not above `minValue` draws an empty track and reports `minValue` for all three numbers, ProgressBar's rule, with no warning, since a static part has no effect to warn from. A value below `minValue` draws an empty arc and reports `minValue`.
- **Over the limit.** A value above `maxValue` sets `data-over`, draws the full arc and turns a `neutral` gauge's arc warning, Meter's rule; `valueLabel` must say "over" in words ("105% of your limit, over"), and the docs and the changeset say so. Exactly `maxValue` is not over. `aria-valuenow` stays at `maxValue`, since a meter's value cannot pass its maximum. A utilization over 100% is the consumer's case.
- **Tones** (open question 4). The app chooses; the gauge never decides that a value is good or bad, StatTile's ruling 4, and the consumer's two gauges show why: a high score is good and a high utilization is not. `neutral` is ink. `warning` is `--color-warning`, "a state that needs the reader's eye soon and is not a failure": a fair score, a utilization above 30%. `error` is `--color-error`, which the design record reserves for a failure or an invalid value: a card declined for being over its limit, a bank feed that stopped. There is no `success` tone: a good score or a goal reached is not a save, and Ant Design's habit of turning a dashboard green at 100% is what the reservation forbids; the words say "Very good" and the arc is ink. There is no `gain`, which is money that arrived. Signal orange, clay and taupe appear nowhere. A threshold that picks the tone (`warnAt`, HTML `<meter>`'s `high`) is rejected: only the app knows which way is good.
- **The non-color cue.** The tone always comes with words: `valueLabel` is required and names the state, and `figureCaption` shows it under the figure. The marks show the bands by position: a reader sees the arc stop between the 580 and 670 marks whatever its color. In forced colors and in grayscale the arc is one color and the words and marks remain.
- **Marks.** Each mark is a radial tick across the track at its share of the range, clamped, with its label in the dial's description. Five at most, enough for a score's four band edges and a target; a sixth is not drawn. Marks are never toned: a band's edge is not over anything. Two marks closer than the stroke's width along the arc overlap; the docs say a 32px gauge holds two or three.
- **The figure and its word.** `figure` is the app's numeral, drawn at the dial's center; `figureCaption` is a word under it. Neither has a default: on a 300 to 850 score a percentage would be wrong, so the library never invents a figure (decided here, item 14). Both are `aria-hidden`: the value text says the value and the word, and the same said twice is noise. At `sm` neither is drawn.
- **Long figures.** The figure does not wrap and is not shrunk; one that passes the dial's inner width overflows it. The docs give the budget per size (4 characters at `md`, 6 at `lg`), a story shows the widest, and a longer figure is the app's to shorten ("$12.3K"). A caption wraps to two lines at most within the inner width, then ellipsizes, since the value text carries it whole. A static part cannot warn.

### 7.4 Geometry

Every number is computed in render from the props, written with at most three decimals (Meter's rounding), and the same on the server and in the browser: `Math.PI`, multiplication and `String(number)` are exact by specification.

| Size | Box | Stroke | Inner width | Figure | Caption | Text |
| --- | --- | --- | --- | --- | --- | --- |
| `sm` | 32px | 4px | 24px | none | none | Beside the dial |
| `md` | 96px | 8px | 80px | `--text-h3` (24px, 500, -2%), tabular | `--text-small`, slate | Under the dial |
| `lg` | 160px | 12px | 136px | `copy-numeral-sm` (32px, 500, -2%), tabular | `--text-small`, slate | Under the dial |

- **The viewBox is the box in pixels.** `viewBox="0 0 S S"` for a ring and `0 0 S (S / 2 + w / 2)` for a semicircle, where `S` is the box and `w` the stroke, so at its own size one user unit is one pixel, and the svg scales uniformly (the default `preserveAspectRatio`) when an app sets `--gauge-size`, so a circle stays a circle. The charts' `preserveAspectRatio="none"` stretch is not used. The consumer's score card is a 160 by 86 semicircle.
- **The track.** A circle of radius `r = (S - w) / 2` about `(S / 2, S / 2)`. A ring is two half arcs from the top, clockwise (`M S/2 w/2 A r r 0 1 1 S/2 S-w/2 A r r 0 1 1 S/2 w/2`), since one arc command cannot draw a whole circle; a semicircle is one arc from the inline start over the top (`M w/2 S/2 A r r 0 0 1 S-w/2 S/2`). Its length `L` is `2 * PI * r` or `PI * r`.
- **The value arc** is the same path with `stroke-dasharray` and `stroke-dashoffset` in user units, so no `pathLength` is needed (R3). Round caps add half the stroke at each end, so a share `s` is drawn as a dash of `max(0, s * L - w)` offset by `w / 2`: the arc, caps included, spans exactly `s * L`. A share whose arc is shorter than the stroke draws a dot of the stroke's width at the start, the least a reader can see; a share of 0 draws nothing, since a zero-length dash with round caps would draw that dot. A full ring's two caps meet at the top. A semicircle's track is drawn the same way at a share of 1, so its caps too end exactly at the arc's ends and a full value covers it; a ring's track is the whole circle and has no ends.
- **Marks.** Two radial `line`s at the mark's share `s` of the arc, `s * 360` degrees clockwise from the top for a ring and `s * 180` degrees from the inline start for a semicircle: a 6px line in the surface, under a 2px line in ink, each reaching 2px past the track on both sides, Meter's pace marker turned radial. On the consumer's score, 580, 670, 740 and 800 fall at 50.9%, 67.3%, 80.0% and 90.9% of the arc.
- **The figure** is HTML over the svg: in a ring, the figure and its caption centered as one block in the inner circle; in a semicircle, the figure's baseline on the arc's chord, in the bowl, and the caption under the chord, between the arc's ends.

### 7.5 Look and CSS

- **One family with Meter.** The `md` track is Meter's 8px, `--color-frame` (ink at 12%); the arc is `--gauge-ink`, which is ink on the root and the tone's color under `[data-tone='warning']`, `[data-over]` and `[data-tone='error']`, as `--meter-ink` turns warning over the limit. The marks' ring reads `var(--meter-surface, var(--color-lifted))`: a gauge is a meter, so one `--meter-surface` an app sets on a canvas section serves both.
- **Caps** (open question 5). Round in every shape, the spinner's rule: "the ends of a stroke are dots, and dots stay round in every shape", and the parent spec's "the ends of a progress stroke take `--radius-dot`". `stroke-linecap` cannot read a radius token, and a gauge under Square drawn with square caps would still be a circle. Meter and ProgressBar square their ends under Square because their ends are a box's corners, which the shape axis reaches.
- **The dial is round in every shape**, as the spinner is: a gauge drawn square would be a different chart. The shape axis changes nothing in the gauge.
- **The concentric rule.** The gauge has no corner a holder steps: the dial is a circle, which the record's rule leaves alone ("a circle's radius is half its side, not a choice, so it is not stepped; where it sits in a corner, its placement sets the band"), and the corner audit skips it. The rule's construction does apply inside the dial: the arc and its track share one center, and the figure sits in the inner circle, `S - 2w` across. In a Card, a StatTile or a table cell the gauge keeps its size and shape.
- **The text.** At `md` and `lg`, under the dial, centered, `var(--spacing-part)` below it: the label at `--text-small` weight 500 in ink, the value text at `--text-small` in slate with tabular figures, Meter's head turned to a column. The text block's width is the dial's or 12rem, whichever is more, and wraps. At `sm` the text is beside the dial, `var(--spacing-part)` from it, the two lines centered on it.
- **In a table row.** The consumer's 32px utilization ring sits in a DataTable cell: the row is 48px (40px compact), so the ring fits in every density. The column header names the cell, so the gauge takes `aria-label` with the row's name ("Utilization, Everyday Visa ending 4821") and no visible label, and its value text beside it ("23%"). Its two marks at 10% and 30% show at 32px. On DataTable's list face the ring sits in the item's meta line the same way.
- **In a tile.** A `sm` gauge fits StatTile's 96 by 32 trend slot.
- **Motion** (open question 6). When the value changes in the browser the arc moves over 200ms (`transition: stroke-dasharray 200ms ease, stroke-dashoffset 200ms ease, stroke 200ms ease`), ProgressBar's timing. A transition never runs on the first style, so a gauge rendered on the server, or mounted with its value, does not sweep in. Under reduced motion nothing moves.
- **Contrast**, computed for this spec from the token values and re-measured by the plan with `contrast.js`, recorded in Appendix B and not gated, since the track is a mix. On lifted: the ink arc against the track 13.85 in light and 12.27 in dark; warning 4.76 and 6.28; error 5.61 and 4.04. On the canvas: ink 12.72 and 14.17, warning 4.37 and 7.26, error 5.15 and 4.67. Each clears the 3:1 a graphic needs. The track against its surface is 1.29 and 1.42 on lifted and 1.28 and 1.36 on the canvas: a cue, not a boundary, since the value text, which is required, carries the extent, as Meter's record says. The figure is ink, the caption, label and value text slate or ink, each gated already as text.
- **Forced colors.** Strokes are not backgrounds, but an svg keeps the colors its author set, so the block names them: the track `graytext`, the arc `canvastext` in every tone, the marks `highlight` with their ring in the system background color. The words carry the tone, as Meter's over state keeps its words.
- **Print.** `print-color-adjust: exact`, as `.meter` sets, so a printed track keeps its tint.

### 7.6 Right to left

The gauge follows the page's direction, as Meter's fill and LineChart's time do (home spec, ruling 3): in right to left a semicircle fills from the right and a ring runs counter-clockwise from the top (open question 7). `gauge.css` sets `--gauge-flip` to `1` under `:where([dir='ltr' i])` and `-1` under `:where([dir='rtl' i])`, the charts' pattern, and the svg takes `scale: var(--gauge-flip, 1) 1`; the nearest `dir` attribute wins. The figure, its caption and the text are HTML and are not mirrored; a figure in Latin digits keeps its order by the numeral rules. The marks' positions mirror with the svg.

### 7.7 How others do it

| System | Part | Form | Tones | In the middle | What this spec takes |
| --- | --- | --- | --- | --- | --- |
| IBM Carbon | Gauge chart, in Carbon Charts | `semi` or `full` | `success`, `warning`, `danger` | The value, and a delta with an arrow | The two forms; not a success tone |
| Shopify Polaris | `ProgressBar`; no gauge | A bar, three sizes | `highlight`, `primary`, `success`, `critical` | None | Nothing new: Meter and ProgressBar already answer it |
| Ant Design | `Progress` with `type="dashboard"` | An arc with a gap at the bottom (`gapDegree`, 75 by default), `strokeLinecap` round by default | `success`, `exception`, `normal`, `active`; turns success by itself at 100% | `format` writes the text | Round caps; not the automatic success |
| Apple Health and Fitness | Activity rings; SwiftUI `Gauge` with `.accessoryCircular` and `.accessoryCircularCapacity` | Concentric full rings; past 100% a ring laps over itself. SwiftUI: an open arc with a marker, or a closed ring | Each ring a fixed color per activity, not a status | SwiftUI's `currentValueLabel`; also `label`, `minimumValueLabel`, `maximumValueLabel` | The label, value text and figure triad; a range that need not start at 0 (`in: 300...850`); the marker as `marks`; not lapping (the arc stops at the limit and the words say over) |
| WAI-ARIA 1.2 and HTML | `meter` role; `<meter>` | Any | `<meter>`'s `low`, `high`, `optimum` regions | `aria-valuetext` | The role on the dial, `aria-valuemin` from the range, the app's value text; not the regions (section 7.3) |
| Material 3 | Circular progress indicator | A ring | One color | None | Nothing: it is for processes, ProgressBar's job |

## 8. MonthGrid

### 8.1 Where it lives and its name

**`MonthGrid`, in `@snapshot-ui/react`, with `month-grid.css` in core** (open question 17). It draws states, not a series on a scale: no axis, no values, no palette, like Meter's segments rather than a chart's lines, so it belongs beside Meter and Gauge. The name says what it draws, months in a grid, and is the consumer's suggestion. Its one risk is that a calendar's grid of days is sometimes called a month grid; the library's calendar parts are `Calendar` and `CalendarDays`, and React Aria's is `CalendarGrid`, so nothing in the library collides, and the docs page opens with a picture. The alternative names are open question 17's.

### 8.2 API

```ts
/** The library's looks. The app's states map onto them. */
export type MonthGridLook = 'filled' | 'partial' | 'empty';

export interface MonthGridState {
  /** The app's key for the state, used in `years[].months`: 'held'. */
  id: string;
  /** The app's word for it, in the legend, the summary and the table: "Held". */
  label: string;
  look: MonthGridLook;
}

export interface MonthGridYear {
  /** Stable across updates. */
  id: Key;
  /** The year as the app writes it, in its calendar and digits: "2025", "۱۴۰۴". */
  label: string;
  /** One entry per month, in the order of `monthLabels`: a state's id, or `null` for a month outside the range (before the account opened, not yet come). */
  months: readonly (string | null)[];
}

export interface MonthGridLabels {
  /** The table's word for a month outside the range. @default 'Not in range' */
  outside: string;
  /** The table's first column header. @default 'Year' */
  year: string;
}

export type MonthGridBaseProps = Omit<HTMLAttributes<HTMLElement>, 'children' | 'aria-label' | 'aria-labelledby'> & {
  /** The visible name: "Statement coverage". Without it, `aria-label` or `aria-labelledby` names the grid. */
  label?: ReactNode;
  /** The app's states, each mapped to a look. Two states may share a look. */
  states: readonly MonthGridState[];
  /** The rows, in the order drawn: newest first or oldest first is the app's choice. */
  years: readonly MonthGridYear[];
  /** The short month labels over the columns, in the app's calendar: "J", "F", or "فر", "ار". Their count sets the columns, 12 for most calendars. */
  monthLabels: readonly string[];
  /** The full month names, for the summary and the table: "January", or "فروردین". Same count as `monthLabels`. */
  monthNames: readonly string[];
  /**
   * The sentence under the grid. A string or node replaces the library's English default, which names the months
   * in every state whose look is not `filled`, grouped by year: "Missing: March, April 2025. Partial: June 2025."
   * `false` draws none.
   */
  summary?: ReactNode | false;
  /** The legend of the states under the grid. @default true */
  hasLegend?: boolean;
  labels?: Partial<MonthGridLabels>;
  ref?: Ref<HTMLElement>;
};

export type MonthGridProps = MonthGridBaseProps & AccessibleName<'label'>;
```

The consumer's coverage strip: `states={[{ id: 'held', label: 'Held', look: 'filled' }, { id: 'partial', label: 'Partial', look: 'partial' }, { id: 'missing', label: 'Missing', look: 'empty' }]}`.

### 8.3 Behavior

- **Markup** (section 8.4 for the alternative). `figure.month-grid` named by its label (`aria-labelledby`) or the caller's name, holding: the label, `span.month-grid-label`; `div.month-grid-grid[aria-hidden="true"]`, the visible grid, a CSS grid of a header row of `monthLabels` and, per year, the year's label and one `span.month-grid-cell[data-look]` per month (`data-look="none"` for `null`); `table.month-grid-table`, the alternative, clipped from sight; `p.month-grid-summary`, the sentence; and `ul.month-grid-legend[aria-hidden="true"]`, one swatch and label per state that appears in the data.
- **Static.** No `'use client'`, no state; `useId` is the one hook. A server component renders it with no client JavaScript.
- **States, not colors.** The app's states are its own words (held, missing, partial, closed, pending), each mapped to one of three looks. The looks are shapes, not meanings: `filled` is a solid cell, `partial` a hatched one, `empty` an outline. None is error, warning or success: a missing statement is the reader's fact, not the library's verdict, and an app that wants attention on it says so in its summary or with a Badge beside the grid.
- **The summary** (open question 18). With no `summary` the library writes English from the app's words: for each state whose look is not `filled`, in the order of `states`, the state's label, a colon, and its months, consecutive months in one year joined by commas with the year once at the end ("Missing: March, April 2025"), years joined by "; " ("Missing: November 2024; March, April 2025"), each state a sentence. Nothing missing or partial gives "{filled state's label}: every month." (or the first filled state's). Any other language passes `summary`: list joining and word order are the language's, and `Intl.ListFormat` is not used at render. The sentence is visible: a sighted reader scanning the page reads it as fast as the grid.
- **Calendars and Persian months.** The grid knows columns and rows, not dates. A Persian page passes Persian years ("۱۴۰۳", "۱۴۰۴"), the twelve Persian month names and their short labels, and its data already placed in Persian months; the docs recipe does the placing in the app with `@internationalized/date` (`toCalendar(date, new PersianCalendar())` gives each statement's Persian year and month), which is feasible because the Persian calendar, like the Gregorian, has twelve months every year. A calendar whose years differ in month count (the Hebrew calendar's thirteen-month leap years) cannot share one column count across rows and is out of scope. `monthLabels` may hold any count, 12 by default in every example; `months` arrays of another length draw what they hold and warn in no way, since a static part cannot.
- **Narrow widths.** The header row shows every label from 28rem of the grid's own box; under it, only the first month of each quarter (labels 1, 4, 7 and 10 of twelve), so one-letter or two-letter labels never collide. A container query on the grid; the server's HTML holds all twelve.
- **No keys.** The grid is not interactive: no cell is a stop, no tooltip. A reader who wants a month's state reads the summary or the table. An app that wants to open a month links from its own list.

### 8.4 The text alternative

- **A table, hidden from sight** (decided here, item 21). `table.month-grid-table` with a `caption` (the grid's name), a header row of `labels.year` and the full `monthNames` as `th scope="col"`, and per year a `th scope="row"` with the year's label and a `td` per month holding the state's label, or `labels.outside`. Clipped as the status hosts are, so it is in browse mode and table navigation: a screen reader user asks "March 2025?" by moving to the row and the column, which a list cannot offer. LineChart's table view is the precedent, there visible by a toggle; here the summary is the visible text and the table the detail.
- **Why not a list.** A list per year ("2025: January held, February held, March missing...") reads every month in turn, 12 per year; a table lets a reader skip to one cell. The sentence covers the reader who wants the gist.
- **The visible grid is `aria-hidden`**, so nothing is said twice, and the legend too, since the table names each state.

### 8.5 Look and CSS

- **Grid.** `display: grid; grid-template-columns: auto repeat(var(--month-grid-columns), minmax(0, 1fr)); gap: 2px var(--spacing-part)` for the year column and `2px` between cells, the Meter spacer's width, so cells read as a strip. `--month-grid-columns` is written on the grid's `style` from `monthLabels.length`. The grid is a size container for the header's quarter labels.
- **Cells.** `block-size: 1rem`, the inline size the column's share. At 320px in a card padded 20px, a grid of 248px less a 3rem year column, its 8px gap and eleven 2px gaps leaves cells about 14px wide by 16px tall; on a 40rem card, about 45px wide: a strip that stretches, never a chart that scrolls.
- **Looks.** `filled`: ink. `partial`: Meter's held look, ink stripes 2px wide every 6px at 45 degrees with a 1px ink edge. `empty`: no fill and a 1px `--color-boundary` edge, the edge of a control, because an empty month carries information and its extent must show at 3:1 (3.36 on lifted and 3.06 on the canvas in light; 5.59 and 6.20 in dark). `none`: no fill and no edge, the slot left blank, so a month outside the range never reads as missing.
- **Corners and the concentric rule.** Cells are text-sized parts, a line tall, so they keep the micro step and are never rounder: `border-radius: min(var(--radius-micro), 0.25rem)`, 4px in Rounded and Soft (6px on a 16px cell reads as a pill and loses the grid), 0 in Square. A grid that ends a card puts its last year's last cell in the card's bottom end corner (33px from both edges in Rounded comfortable, under the 40px curve; 21px in compact). The record's rule for text-sized parts holds there: the cell's 4px is under the formula (7px comfortable, 19px compact), so it keeps its corner, and the concentric audit, which skips text-sized parts sharper than the formula, passes; a cell is never a control, so nothing moves. The first row's cells sit under the header row and the first column's beside the year labels, so no other cell reaches a corner.
- **Header and years.** Month labels at `--text-small` weight 450 in slate, centered over their column, one line, clipped rather than wrapped; year labels at `--text-small` weight 500 in ink with tabular figures, at the inline start, `direction` left to right only for Latin digits (`copy.css`'s numeral rules when the label is digits; the app's Persian digits read right to left as written).
- **Summary.** `--text-small` in slate, `var(--spacing-part)` under the grid, wrapping. **Legend.** Meter's: a 12px swatch per state in its look on the micro radius, the state's label in slate, `var(--spacing-peer)` apart, wrapping.
- **Contrast.** The ink fill and hatch against lifted: 17.84 and 17.42, against the canvas 16.25 and 19.31; the boundary edge as above. The month and year labels and the summary are slate and ink, gated already. Recorded in Appendix B, nothing new gated.
- **Forced colors.** A fill is a background, which the repaint drops: `filled` becomes `canvastext`; `partial`'s stripes opt out of the repaint (`forced-color-adjust: none`) and are drawn again in `canvastext` on the system background with a `canvastext` edge, Meter's rule; `empty`'s edge is a border and stays, in `canvastext`; `none` stays blank. The three looks remain three shapes: solid, striped, outlined.
- **Right to left.** The grid follows the page: the year column is at the right and January (or Farvardin) is the first column from the right, by the grid's own logical flow. The hatch keeps its 45 degrees: it is a texture, not an arrow.
- **Print.** `print-color-adjust: exact`, as `.meter` sets, so fills and stripes print.

### 8.6 How others do it

| System | Part | What it draws | Text alternative | What this spec takes |
| --- | --- | --- | --- | --- |
| GitHub | The contribution graph | A grid of days, weeks as columns, colored by count with a "Less, More" legend | A tooltip per day; a summary line ("1,234 contributions in the last year") | A legend and a summary line; not a color scale, since the states are categories |
| Atlassian Statuspage | Uptime bars | One bar per day, colored by incident level, with an uptime percentage | A tooltip per bar | A strip of equal cells that stretches with its box; not color alone for state |
| IBM Carbon | Heatmap chart, in Carbon Charts | Cells on two axes, colored on a scale | A table in the chart's toolbar | The table as the alternative |
| Meter (this library) | Spent and held segments | Fill and hatch | The value text | The fill and hatch looks, the legend and the spacer's width |

## 9. The docs header on PageHeader

Batch 4 built PageHeader to reproduce the docs site's header and the owner ruled that the docs move to it "in the next batch" (documents spec, section 13.3 item 7; parent spec risk R8). Carried here (open question 3):

- `apps/docs` replaces its hand-built `.header` with `PageHeader` in its shell's header place: the crumb as `Breadcrumbs`, the color mode and corner switches as `actions`, its fill and stickiness as PageHeader's.
- Every docs page changes its header's markup, so the docs e2e completeness maps, the 320px checks and the docs corner audit run on every page. The docs site has no screenshot baselines, so no baseline changes.
- If the docs header differs from PageHeader in a way the reader would see, the difference is fixed in PageHeader, as R8 asks, and recorded.

## 10. Accessibility

- **Roles and names.** DescriptionList: the `dl` with its `dt` and `dd` pairs grouped by `div`, no role added; each action named by the app with the term in it. CardActions: no role; its buttons named by the app ("Edit details"). Gauge: `meter` on the dial, named by its label, valued by the app's words, described by its marks; the figure, its caption and the visible value text hidden, since the role reads them. MonthGrid: a `figure` named by its label, holding a `table` with a caption, column and row headers, the visible grid and legend hidden, and the summary as a paragraph.
- **Screen readers.** Support for `dl` differs: VoiceOver announces a description list and its terms, NVDA and JAWS announce less, and every reader reads the terms and values in order. Support for `meter` differs too: some readers say "progress bar" or no role, and every reader says the name and `aria-valuetext`. The text works where the roles are unsupported. Not yet verified with VoiceOver and NVDA (owner action, as for Meter).
- **Never color alone.** A gauge's tone and over state have the value text's words, the figure's caption and the marks' positions; an empty value has words; a month's state has a shape, the summary and the table.
- **Targets (2.5.8).** Every action is the app's 40px control; the gauge and the month grid are not interactive.
- **Label in name (2.5.3).** "Edit" shown, "Edit Nickname" as a row's name; "Edit" shown, "Edit details" as the card's.
- **Axe** passes in light and dark for every story: each layout, empty values, actions, a list in a card with CardActions; each gauge size, form and tone, over the limit, with five marks, without a label but with `aria-label`, in a table row; each month look, outside months, a Persian grid, with and without a legend and a summary.

## 11. Responsive and right to left

- **320px.** A DescriptionList in a card on a 320px phone, with the page's 16px margins, has 248px of content in a card padded 20px, or about 222px in one padded 32px: under 30rem, so stacked, every value wrapping and breaking anywhere. An `lg` gauge is 160px and its text 12rem, which fits 222px; a row of gauges wraps (`flex-wrap`), as numerals do. A month grid's cells are about 14px wide there (about 12px in a card padded 32px) and its header shows quarters. No part scrolls sideways; a docs e2e checks 320px.
- **Beside a panel.** A list in a 24rem SidePanel stacks; in a card beside the panel at 1440px it is side by side if its box is 30rem or more.
- **Size containment.** A size container takes no width from its content, which StatTile met in 0.6.1. The list and the month grid declare `contain-intrinsic-inline-size: 20rem`, so in a flex row or an `auto` grid column they are 20rem rather than their padding wide (R1). The gauge is not a container.
- **Right to left.** The list mirrors by logical properties and keeps numeric values left to right (section 5.5); the gauge mirrors its arc and not its text (section 7.6); the month grid's columns run from the right (section 8.5). Stories in `rtl/RightToLeft.stories.tsx` show all three in Persian, the month grid with Persian years and months.

## 12. Server rendering

- DescriptionList, DescriptionListItem, CardActions, Gauge and MonthGrid are server parts: no `'use client'`, no state, `useId` at most, nothing from React Aria. They join the server-components suite and send no client code.
- No part reads `window`, formats with `Intl` or measures before the first paint. The list's layout and the month grid's header are container queries, the gauge's geometry is arithmetic on its props, and the month grid's default summary is string joining of the app's words, so the server's HTML is final. The hydration suite runs each part under `en-US`, `de-DE` and `fa-IR` in UTC and Asia/Tehran with `onRecoverableError` failing the test.

## 13. Industry grounding, in one place

Sections 5.4, 7.7 and 8.6 hold the comparisons. In short: the list is GOV.UK's summary list on Polaris' `dl` with its layout switched by its own width; the gauge is SwiftUI's label, value and figure on Carbon's two forms with Ant's round caps, under WAI-ARIA's `meter`; the month grid is Statuspage's strip with Carbon's table alternative, in Meter's looks.

## 14. Decisions

### 14.1 Decided here

1. DescriptionList, DescriptionListItem, CardActions, Gauge and MonthGrid are server parts.
2. The list is a `dl` of `div` rows, each a `dt`, a value `dd` and an actions `dd`, with no ARIA role added.
3. Actions are the app's nodes in their own `dd`; their names include the term; the stacked layout puts them on the term's line.
4. An empty value is absent, `null`, `false` or `''`, never `0`, and shows slate words or an add link, never taupe and never a dash.
5. Values wrap and break anywhere; nothing truncates.
6. The list's row follows the Dense data rule against the value's line; terms at 14px weight 500 in slate, values at 16px weight 450 in ink.
7. The term column is 30% of the row by default, set by `--description-list-term-size`, with the same template on every row and no subgrid; the switch is at 30rem of the list's own box.
8. A control in the first or last row of a list that starts or ends a card, and CardActions in a card's header, move down by the card's corner inset; the audit checks both.
9. CopyButton is deferred; its design is kept in section 5.6.
10. Gauge lives in `@snapshot-ui/react` with `gauge.css` in core.
11. Gauge takes React Aria's prop names with `minValue` first class, Meter's role, naming chain and track, and ProgressBar's motion.
12. Three sizes, 32, 96 and 160px, with 4, 8 and 12px strokes; two forms, ring and semicircle; the figure and its caption at `md` and `lg` only.
13. The arc's length, caps included, is exactly the share of the range; zero draws nothing; below a stroke's width it is a dot.
14. The figure and its caption have no default: on a range that is not a share, a percentage would be wrong.
15. Tones are the app's, `neutral`, `warning` and `error`; over the limit a neutral gauge warns; no success and no gain tone; words required.
16. Up to five marks, never toned, described in the dial's description.
17. Caps are round and the dial is round in every shape.
18. The gauge mirrors in right to left by the charts' `dir` pattern; text is not mirrored.
19. A gauge reads `--meter-surface`, so one property serves Meter and Gauge.
20. MonthGrid maps the app's named states to three looks, `filled`, `partial` and `empty`, plus `none` for a month outside the range; the looks are shapes with no reserved color.
21. MonthGrid's alternative is a hidden table with row and column headers; the visible grid and legend are hidden from assistive technology; the summary is visible text, English by default and the app's in any other language.
22. MonthGrid never computes a date; the app passes years, month names and labels in its calendar, and the column count follows `monthLabels`.
23. MonthGrid's cells keep a text-sized corner, `min(var(--radius-micro), 0.25rem)`, under the concentric formula in every holder.
24. No new tokens. Sizes, strokes, the cell height and the 2px gaps are literals in their files, as Meter's track is in `meter.css`.
25. The docs site has no `.description-list`, `.card-actions`, `.gauge` or `.month-grid` classes outside the library's to collide with; the plan checks again.
26. One 0.8.0 minor release of core and react, and a patch to `@snapshot-ui/charts` for its core peer (section 16).

### 14.2 Owner rulings and answers (owner, 2026-10-18)

The owner approved the spec and took every open question of section 18 as recommended. Each item names the plan task that builds it (`docs/plans/2026-10-18-accounts.md`).

1. **Scope, order and name** (open questions 12 and 17; Tasks 1 to 4). All four parts ship in 0.8.0, in the consumer's order of need: DescriptionList, CardActions, Gauge, then MonthGrid, under that name. CopyButton stays deferred (section 5.6).
2. **The score's bands** (open question 4; Tasks 3 and 5). Both low score bands are warning: from 580 to 669 ("Fair") and under 580 ("Poor"). Error keeps its strict meaning, a failure or an invalid value, such as a limit that stopped a payment. Fair and Poor are told apart by the word under the figure (`figureCaption`) and by the marks at 580 and 670, never by color. The library's `tone` keeps `neutral`, `warning` and `error` as section 7.2 types them; the props' comment, the docs page, the recipe and the changeset say which is which.
3. **Gauge in `@snapshot-ui/react`** (open question 2; Task 3), with `gauge.css` in core.
4. **The docs header moves to PageHeader in this batch** (open question 3; Task 5), as the owner ruled in batch 4.
5. **Round caps in every shape** (open question 5; Task 3), the spinner's rule.
6. **Gauge's motion** (open question 6; Task 3): 200ms when the value changes, no sweep on first appearance, none under reduced motion.
7. **Direction follows the page** (open question 7; Tasks 1, 3 and 4): a ring counter-clockwise, a semicircle from the right and the first month on the right in right to left.
8. **Composition for the list** (open question 8; Task 1): `DescriptionList` holding `DescriptionListItem`s.
9. **"Not set" in slate** for an empty value (open question 11; Task 1), or the app's add link.
10. **MonthGrid's English default summary** (open question 18; Task 4), replaced by the app's `summary` in any other language.
11. **Answered by the consumer and not built:** editing in place (question 10), AccountMenu and ThemeSwitch (14), AvatarGroup (15), several values in one gauge (16). **Withdrawn:** questions 9 and 13, with CopyButton.

## 15. Testing

- **Core (`css.test.js`, `token-only.test.js`, `contrast.test.js`).** `description-list.css`, `gauge.css` and `month-grid.css` are tokens only, in `@layer components`, imported by `styles.css` after `card.css` (the list) and after `meter.css` (the gauge and the month grid), with a forced-colors block and logical properties; system colors only in the forced-colors block; `card.css`'s `.card-header:has(> .card-actions)` rules are covered. Pairs re-measured and recorded, not gated: the ink, warning and error arcs against the track over lifted, the canvas and float in both themes; the track against each surface; the boundary edge of an empty month on lifted and the canvas.
- **React (Vitest, jsdom).**
  - DescriptionList: the `dl`, `div`, `dt`, `dd` structure and axe; `data-layout` for each value; empty for `undefined`, `null`, `false` and `''` and not for `0`; `emptyValue` and the default; the actions `dd` only with actions; `isNumeric`'s attribute; `hasDividers`.
  - CardActions: the class, and a header holding it.
  - Gauge: the role on the dial and its four values on a 300 to 850 range; clamping above and below; `data-over` above `maxValue` and not at it; tone resolution (neutral over the limit is warning, error stays error); the naming chain with blank strings; the description from marks, sorted, five at most; no figure or caption by default and none at `sm`; an empty range.
  - The geometry functions, pure and exported to the tests: the track path and length for each size and form; the dash and offset for shares of 0, one under the stroke, 0.5, 1 and above 1; mark angles on a range that does not start at 0 (580 on 300 to 850 is 50.9%); three-decimal output.
  - MonthGrid: a cell per month with its look, `none` for `null`; the hidden table's caption, headers and cell words; the default summary for runs, gaps, several years and nothing missing; `summary` replacing it and `false` removing it; the legend listing only states in the data; `--month-grid-columns` from the label count.
  - Server render: every part in the server-render, hydration and server-components suites.
- **Storybook.** Section 16's stories, baselined in the four theme and shape modes and at 375px, and in compact where tagged. Play tests in the four story projects (Chromium in light and dark, WebKit and Firefox): the list switching layout at its 30rem box in a resizable frame; the month grid's header switching to quarters at 28rem; the gauge's arc length measured with `getTotalLength()` against the share in three engines (R3); the right-to-left mirror of the gauge and the month grid's column order. The concentric audit runs on every new story in three shapes. Baselines change only through `pnpm --filter @snapshot-ui/storybook visual:docker`.
- **Docs e2e.** Completeness maps for the new pages; 320px with no sideways scroll; forced colors on a toned gauge, a month grid's three looks and a list in a card; the Accounts recipe at 375 and 1280; every docs page's header after section 9.

## 16. Docs, stories and release

- **Pages:** `description-list` (with "In a card"), `gauge` (leading with "Gauge, Meter or ProgressBar", and "A score", "A share of a limit" and "In a table row"), `month-grid` (leading with a picture and "Your states, three looks"), each with Usage, Props, Accessibility with its Keys table where there are keys, and Design rules. The `card` page gains CardActions; the `meter` page gains "Meter or Gauge"; `stat-tile` gains "A gauge as the trend"; `data-table` gains "A gauge in a cell".
- **The Accounts recipe**, with the Next App Router:
  - An accounts list grouped by type in a DataTable, each row an Avatar, "Everyday Visa ending 4821", a coverage line, the balance and its date, and the bank feed status as a Badge or a failure with "Reconnect"; a duplicate as a warning Badge. Existing parts only.
  - An account's page: a PageHeader, a balance LineChart, and a Details Card whose CardTitle is "Details", whose CardActions hold Edit (a Dialog) and a Menu with Merge (a Dialog) and Remove (a ConfirmDialog), and whose body is a DescriptionList: Name, Type, Institution, Last four, Bank feed, Credit limit and APR, the last three `isNumeric`.
  - A credit tab: a score Card with an `lg` semicircle from 300 to 850, the figure "742", the caption "Very good", marks at 580, 670, 740 and 800; an overall utilization `md` ring with marks at 10% and 30%; a DataTable of cards with a `sm` ring per row; and a "Statement coverage" Card with a MonthGrid, placed in Persian months on the Persian guide's version through `@internationalized/date` in the app.
  - Sample content keeps the reservations: an account's status is a neutral Badge, never success.
- **Stories:**
  - `Components/DescriptionList`: `Default` (density), `Stacked` (a 20rem frame), `WithActions` (density), `EmptyValues`, `LongValues` (a long term, a long address, an unbroken IBAN), `NumericValues`, `NoDividers`, `InCard` (density; the Details card with CardActions and a last row with an Edit), `InAFlexRow` (`no-visual`, R1).
  - `Components/Card`: `WithActions` (density).
  - `Components/Gauge`: `Default`, `Sizes`, `Semicircle` (three sizes), `Warning`, `Error`, `OverLimit`, `WithMarks` (five marks), `AcrossTheRange` (0, a share under the stroke, 1%, 50%, 99% and 100%, both forms), `WithoutLabel` (`aria-label`, the `sm` beside layout), `CreditScore` (the consumer's 300 to 850 card), `InStatTile` (density), `InDataTable` (density; the utilization rows), `LongestFigure`.
  - `Components/MonthGrid`: `Default` (three years), `AllLooks` (filled, partial, empty and outside), `Narrow` (a 20rem frame, quarter labels), `ManyYears` (eight years), `InCard` (density; the grid ending a card), `NoLegendCustomSummary`.
  - `Pages/Accounts`: the account's page with its Details card and the credit tab (density).
  - `rtl/RightToLeft.stories.tsx`: `DescriptionList`, `Gauge` and `MonthGrid` in Persian, the grid in Persian years and months.
- **Design record:** a section per part in Appendix B of `docs/design-system.md` (DescriptionList, CardActions, Gauge, MonthGrid), with every derived value, its reason and the measured pairs; lines added to "Nested radii, derived"'s table of controls that move (the list's first and last rows in a Card, a card header's actions) and to its paragraph on text-sized parts (a month grid's cells); and the deferred CopyButton's notes (section 5.6) as a short "Deferred: CopyButton" section.
- **Changesets:** one per part, minor, for `@snapshot-ui/core` and `@snapshot-ui/react` (DescriptionList, CardActions, Gauge, MonthGrid), released together as 0.8.0. `@snapshot-ui/charts`'s core peer publishes as `^0.8.0` and its last release's `^0.7.0` does not admit 0.8, so a patch changeset moves it on, as batches 3a to 4 did.
- **Release note for the consumer:** a gauge's and a meter's `valueLabel` must name a warning, an error or an over-limit state in words, and a gauge's `figureCaption` repeats it; `minValue` sets the range's start for a score; pass `figure` yourself, since there is no default; use Gauge for a measurement and ProgressBar for work; a month grid's states are yours and its looks are shapes, so say in the summary what needs attention; pass `summary` in Persian, and place your data in Persian months yourself.

## 17. Risks

- **R1. A size container in a shrink-to-fit parent.** A list or a month grid in a flex row or an `auto` grid column would take no width from its content and collapse, as StatTile did before 0.6.1. Mitigation: `contain-intrinsic-inline-size: 20rem` and the `InAFlexRow` story.
- **R2. Screen reader support for `dl` and `meter`, and a hidden table's verbosity.** Uneven, as section 10 says; a hidden 12-column table read cell by cell is long. Mitigation: names and value text that read without the roles; the visible summary is the first thing read after the grid's name; a VoiceOver and NVDA pass before release, recorded as not yet verified until then.
- **R3. Dashes and caps across engines.** A dash on a full circle, a zero-length dash with round caps and `getTotalLength()` differ slightly between Chromium, WebKit and Firefox, and `pathLength` was unreliable in older WebKit. Mitigation: no `pathLength`, a share of 0 not drawn, dashes computed from the radius, and the `AcrossTheRange` story measured in three engines.
- **R4. A figure that does not fit.** A static part cannot measure or warn. Mitigation: the per-size character budget in the props' comments and docs, and the `LongestFigure` story.
- **R5. A gauge used for progress.** An upload drawn as a gauge would announce a meter. Mitigation: the docs page leads with the choice, and the props comment names `meter`.
- **R6. The error tone on a score band.** The consumer's first plan drew scores under 580 in error, which the design record reserves for a failure or an invalid value. Resolved by the owner's ruling (section 14.2 item 2): both lower bands are warning, and the props' comment and the docs say that error is for a limit that stopped something.
- **R7. Tiny cells.** At 320px a month cell is 12px to 14px wide, and the stripes of a partial month (2px every 6px) show about two stripes. Mitigation: the outline and the fill stay distinct at any width, the `Narrow` story and the 375px baselines show them, and the table and summary carry every month.
- **R8. The docs header move.** Every docs page changes its header in one task. Mitigation: no screenshot baselines exist for the docs site; the e2e maps, the 320px checks and the docs corner audit run on every page, and differences are fixed in PageHeader and recorded.

## 18. Open questions

Each has a recommended answer. Numbers are kept from the first draft, so the answered and withdrawn ones stay in place. **Settled by the owner, 2026-10-18:** every open question as recommended; section 14.2 records the answers.

1. **The consumer's Accounts page.** Answered by the consumer on 2026-10-18; section 3 records it.
2. **Where Gauge lives.** Recommended: `@snapshot-ui/react`, beside Meter and ProgressBar (section 7.1), because it is a meter with one value and no series, and SwiftUI, Ant Design and Material all keep theirs in the core set. Alternative: `@snapshot-ui/charts`, Carbon's choice, which groups everything drawn in svg but makes an app install a second package for a meter.
3. **The docs header in this batch.** Recommended: keep it in, as the owner ruled in batch 4; it costs one docs task and no baselines. Alternative: defer it to the batch that brings ThemeSwitch, so the header's switches move to the library at the same time.
4. **Gauge's tones, and error on a score.** The library offers `neutral`, `warning` and `error`, chosen by the app, warning by itself over the limit, no success and no gain. The consumer plans warning for scores from 580 to 669 and error under 580. The design record reserves error for a failure or an invalid value, and a poor score is neither: it is a state that needs the reader's eye, which is warning's definition. Recommended: the consumer draws both lower bands in warning, with the caption's word ("Fair", "Poor") and the marks telling them apart, and keeps error for a limit that stopped something, such as a card declined over its limit. Alternative: widen error's reservation to "a value in a band the app names as failing", recorded in the design record, which lets the consumer's plan stand but weakens what error means everywhere, sample content included.
5. **Gauge's caps under Square.** Recommended: round in every shape, the spinner's rule for a circular stroke. Alternative: square caps under Square, so a gauge's ends match Meter's and ProgressBar's ends there, which needs a shape-aware rule no other part has.
6. **Gauge's motion.** Recommended: 200ms when the value changes, none on first appearance, none under reduced motion. Alternative: Apple's sweep from zero on first appearance, livelier, but it delays the reading and needs a client part to start it.
7. **Direction.** Recommended: the list, the gauge and the month grid follow the page, so in right to left a ring runs counter-clockwise, a semicircle fills from the right and the first month is on the right, as Meter and the charts' time axis do. Alternative: a ring always clockwise, as clock faces are never mirrored, with only the semicircle and the grid mirrored.
8. **The list's API.** Recommended: composition, `DescriptionList` holding `DescriptionListItem`s with `term` and the value as children, because values are often nodes (a Badge, a link) and each row has its own props. Alternative: Polaris' `items` array, shorter for plain text and the natural home for list-wide strings.
9. **Copying a value the page does not show.** Withdrawn: CopyButton is deferred (section 5.6), where the question is kept.
10. **Editing in place.** Answered by the consumer's design: Edit in the Details card's header opens a Dialog. Not in this batch.
11. **The empty value's words.** Recommended: "Not set" in slate, or the app's add link. Alternatives: "None", GitHub's "None yet", or leaving the value blank, which a screen reader reads as nothing.
12. **CardActions for a plain card.** Answered by the consumer: needed for the Details card's Edit. In this batch, second in the order (section 6).
13. **CopyButton as a public part.** Withdrawn: deferred at the consumer's request (section 5.6).
14. **AccountMenu and ThemeSwitch.** Answered by the consumer: not needed. Not in this batch.
15. **AvatarGroup.** Answered by the consumer: not needed. Not in this batch.
16. **Several values in one gauge.** Answered by the consumer: not needed. Not in this batch; were rings ever nested, each inner ring's radius would be the outer's less a stroke and a constant gap, the concentric formula with the gap as the holder's padding.
17. **MonthGrid: include it, and its name.** Recommended: include it in 0.8.0, last in the order, as a generic part named `MonthGrid`, because the consumer needs it on the credit tab and its account rows, every part of it is static and small, and the name says what it draws without naming the consumer's use. Alternatives for the name: `CoverageGrid`, plainer for this use but narrower in meaning; `YearGrid`, which names the rows rather than the cells. Alternative for the scope: ship it in a patch after 0.8.0, which releases the three parts the consumer needs first a little sooner.
18. **MonthGrid's default summary.** Recommended: an English sentence built from the app's words when `summary` is absent, so an English app gets a correct alternative for free, and any other language passes its own. Alternative: `summary` required, which no app can forget but every English app writes by hand.

## 19. Size budget

Measured as the others, without React, React Aria and Lucide, to start at:

| Entry | Budget | Reason |
| --- | --- | --- |
| `{ DescriptionList, DescriptionListItem }` | 1 kB | Markup and the empty test; no client code, now that CopyButton is deferred. |
| `{ CardActions }` | 0.5 kB | One element. |
| `{ Gauge }` | 1.5 kB | Meter's 795 B entry took a 1.5 kB limit; Gauge adds the arc arithmetic, five marks and the caption, and drops the segments and legend. |
| `{ MonthGrid }` | 2 kB | The visible grid, the hidden table, the legend and the default summary's grouping. |

The CSS adds about 3.5 kB to `styles.css` before compression (the list about 1 kB, the gauge about 1.2 kB, the month grid about 1 kB, CardActions the rest). A part over its budget is reported with the number, as 3c's SidePanel was, and the limit follows the rule: the measured entry rounded up to 1 kB, plus 0.5 kB.

## 20. Visual baseline estimate

Each visual story is baselined in five modes (Rounded light, Rounded dark, Soft light, Square light, Rounded light at 375px), and a story tagged `density` adds compact, six.

| Group | Visual stories | Of them with compact | Baselines |
| --- | --- | --- | --- |
| DescriptionList | 8 | 3 (`Default`, `WithActions`, `InCard`) | 43 |
| Card (`WithActions`) | 1 | 1 | 6 |
| Gauge | 13 | 2 (`InStatTile`, `InDataTable`) | 67 |
| MonthGrid | 6 | 1 (`InCard`) | 31 |
| Pages/Accounts | 1 | 1 | 6 |
| Right to left (`DescriptionList`, `Gauge`, `MonthGrid`) | 3 | 0 | 15 |
| **New** | **32** | **8** | **168** |

Existing baselines: none should change. `card.css` gains rules that match only a header holding `.card-actions`, which no existing story draws, and the docs header move (section 9) has no screenshot baselines. Expect 155 to 180 new files, depending on how the plan splits the gauge's sizes and forms and the month grid's looks into stories; any change to an existing baseline is investigated before it is committed.
