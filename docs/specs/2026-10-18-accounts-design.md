# Accounts: DescriptionList and Gauge: design

Status: written for review on 2026-10-18. Nothing here is approved yet. The owner's calls are the open questions in section 17, each with a recommended answer; everything else is decided here and listed in section 13.
Parent spec: `docs/specs/2026-10-10-snapshot-ui-design.md`. This document pulls forward the phase 4 row "DescriptionList" and adds Gauge and CopyButton, which the parent spec does not list. Gauge is the circular sibling of the phase 4 Meter that batch 2 built (`docs/specs/2026-10-13-home-design.md`, section 7). It answers batch 5 ("Accounts") of the first consumer's roadmap, agreed with the consumer as DescriptionList and Gauge. The design authority remains `docs/design-system.md`.
Released before this: batch 4, `@snapshot-ui/core` and `@snapshot-ui/react` 0.7.0 (the documents parts, on `feat/documents` at the time of writing). This batch is the 0.8.0 minor release of core and react. Section 2 lists what it takes from batches 1 to 4.

## Summary for the owner

What this batch adds, in plain words:

- **DescriptionList**: a read-only list of named values, such as an account's institution, type, number and opening date. Each row shows a name and its value side by side where there is room and one above the other where there is not, decided by the space the list itself has, not by the screen. A row can carry its own buttons (Edit), show "Not set" for a missing value, wrap a long value, and offer a Copy button for a value people paste elsewhere, such as an account number.
- **CopyButton**: the small Copy button the list uses, also usable on its own. It says "Copied" to screen readers and swaps its icon for a check for two seconds. If the owner agrees, the docs site's own code copy button moves to it (open question 13).
- **Gauge**: one figure against a limit, drawn as a ring or a half ring, such as credit used against a credit limit. It sits beside the existing Meter (a straight bar) as one family: the same thickness, the same ink, the same warning color past the limit, the same rule that words, not color, say what the state is.
- **Carried from batch 4**: the docs site's hand-built page header moves to the library's PageHeader, as the owner ruled for "the next batch" (documents spec, section 13.3 item 7).

Why: the consumer's next page is Accounts, which lists the reader's bank and card accounts, their details and how much of each limit is used. Every part here is static and renders on the server, except the Copy button, which needs the browser's clipboard.

What it does not add: editing values in place, account menus or theme switches, avatar groups, or several values in one ring. Section 17 lists each as a question with a recommendation.

## 1. Goal

Give an accounts page its parts: a list of an account's details that reads well at every width, in a card or on its own, with an action per row and a way to copy a number; and a gauge for how much of a limit is used, beside the Meter the Home page already uses. Ship them as the batch 5 minor release, 0.8.0.

The hard parts are small but exact. A description list must stay a real `dl` while it carries buttons, switch layouts without a measurement, and keep its buttons out of a card's rounded corner. A gauge must draw an arc whose length is the value, caps included, on the server, in both directions, in forced colors, and never let a color say alone what only words may say.

Build order, which is also the plan's order:

1. **DescriptionList and DescriptionListItem** (section 5): static, no copy yet.
2. **CopyButton** (section 6), then the list's copyable value on it.
3. **Gauge** (section 7).
4. **CardActions** (section 8), if open question 12 is taken.
5. **The docs header on PageHeader** (section 9), carried from batch 4.
6. **The Accounts recipe, the guides and the changesets** (section 15).

Out of scope, each recorded where it is deferred:

- Editing a value in place, Atlassian's inline edit (open question 10). A row's Edit opens what the app chooses: a page, a Dialog, a SidePanel.
- `AccountMenu` and `ThemeSwitch` (parent spec, phase 5), and `AvatarGroup` (phase 4): candidates from the consumer's earlier requests, not in this batch (open questions 14 and 15).
- Several values in one gauge: Apple's concentric activity rings, or Meter's spent and held segments on an arc (open question 16).
- A circular progress bar. Work getting done is ProgressBar's (batch 4); Gauge is a measurement (section 7.3).
- Number and date formatting, as everywhere: every figure is the app's string.

## 2. Depends on

| From batch 4 or earlier | Used here as |
| --- | --- |
| `Card` and its holder properties (`card.css`): `--holder-radius`, `--holder-border`, `--holder-pad`, `--holder-corner-inset` | The list's controls at a card's first and last row move clear of the corner (section 5.5) |
| `CollapsibleCard`'s `.card-actions` (`card.css`) | CardActions, a header action for a plain card (section 8) |
| The Dense data rule (design record, "Dense data"): a row of `max(var(--size-target), var(--size-field))`, text padded `(row - line - 1px) / 2`, one `--color-divider` rule between rows | The list's row (section 5.5) |
| `IconButton` (ghost, 40px, a 20px glyph, hit at the target) and `Tooltip`, `TooltipTrigger` | CopyButton's face and its visible name |
| The status host of `ToastRegion` and the docs site's `useCopy` (`apps/docs/lib/use-copy.ts`): a polite region in the server's HTML, the outcome held two seconds | CopyButton's announcement and timing |
| `Meter` (`meter/Meter.tsx`, `meter.css`): the hand-written `meter` role on the bar, the naming chain (a non-blank `aria-labelledby`, else `aria-label`, else the label, else the value text), `valueLabel` as `aria-valuetext`, the 8px track in `--color-frame`, `--meter-ink` and warning over the limit, `--meter-surface` | Gauge's semantics, its track, its tones and its marks' ring (section 7) |
| `ProgressBar` (batch 4): React Aria's prop names (`value`, `minValue`, `maxValue`, `valueLabel`), the ASCII percentage by integer arithmetic, the 200ms move and its reduced-motion rule, a range whose `maxValue` is not above `minValue` | Gauge's props, its default figure and its motion |
| `Spinner`: a circular stroke with round caps, "the ends of a stroke are dots, and dots stay round in every shape" | Gauge's caps (section 7.5, open question 5) |
| The charts' direction rule (`charts.css`): `--chart-flip` from `:where([dir='ltr' i])` and `:where([dir='rtl' i])`, mirroring an svg with `scale` | Gauge's mirror in right to left (section 7.6) |
| `copy.css`'s numerals: tabular figures, `nowrap`, `direction: ltr`, `unicode-bidi: isolate`, `text-align: match-parent` | A numeric value in the list (`isNumeric`) and Gauge's figure |
| `StatTile`'s trend slot (96 by 32 at most) | A small gauge as a tile's trend (section 7.5) |
| `PageHeader` and `Breadcrumbs` (batch 4) | The docs header (section 9) |
| `useId`, `cx`, `present`, `AccessibleName`, `AriaName` | As everywhere |

React Aria parts used for the first time: none. CopyButton is a client part because IconButton and Tooltip are; DescriptionList, DescriptionListItem, Gauge and CardActions import nothing from React Aria and stay server parts.

## 3. What the consumer needs

The repository holds no verbatim batch 5 request. The specs and plans name the consumer's Accounts destination in its navigation (the app shell spec measures "Accounts" among Home, Transactions, Documents, Insights, Goals and Settings, section 8), and batch 5 was agreed with the consumer as DescriptionList and Gauge. What follows is the page those two parts serve, written as input; open question 1 asks the consumer to confirm it before the plan.

1. **Account details.** Per account: the institution, the type, the account number masked to its last four digits with a way to copy it, the routing number, the currency, the date opened, a nickname that may be unset, the holders. An Edit per editable row, or one for the card.
2. **Limits.** How much of a card's credit limit is used, or of an account's monthly transfer limit: a figure in the middle, the label, and the value in words, warning when close to or over the limit.
3. **Layout.** A grid of account cards on a wide screen, one column on a phone, and a details card beside a panel; every list must read in each.

Its rules for every part, unchanged from batch 4: `'use client'` only on interactive parts; no `Intl` formatting and no `window` at render, and no first-paint measurement; no external request and no injected script; light and dark, all three shapes, right to left (the Persian guide), comfortable and compact density; WCAG 2.2 AA including 2.5.8; navigation through `RouterProvider`; everything exported from the react index, with the CSS in `core/styles.css`.

## 4. Approach

**The page is mostly text, so the parts are mostly static.** A description list and a gauge draw what they are given and hold no state. Both render on the server with no client JavaScript, as Meter and ProgressBar do. The one part with behavior, copying, is a small client island inside a static row.

**Layout by the list's own width.** A list beside a side panel, in a third-width card or on a phone has the same problem: too little room for a name column. The list is its own size container and switches at 30rem of its own box, as StatTile, DataTable and FileDropZone switch on theirs, so the server's HTML is right at every width and nothing is measured.

**A gauge is a meter bent round.** It takes Meter's role, naming, track, ink and warning, and ProgressBar's prop names and motion, so the three read as one family: Meter for a value against a limit in a row, Gauge for the same at a glance, ProgressBar for work getting done.

**Draw without measuring, keep the shape.** The gauge's svg has a fixed `viewBox` per size and scales uniformly, so a circle stays a circle; the arc's length is computed in render from the value and the circumference; the figure and the words are HTML over and under it, in the page's font.

**Words carry the state.** A warning or error tone on a gauge, a missing value in a list, a copy that failed: each has words the reader can read and a screen reader can say. Color repeats; it never carries alone.

| Part | In the server's HTML | After hydration |
| --- | --- | --- |
| DescriptionList, DescriptionListItem | Everything: the `dl`, each `div`, `dt` and `dd`, the app's actions, the empty label | Nothing changes |
| CopyButton | The button, its icon, the empty polite status host | Copying, the icon swap, the status, the tooltip |
| Gauge | Everything: the role and values, the svg with its arc, the figure, the label and the value text | Nothing changes |
| CardActions | Everything | Nothing changes |

Rejected along the way:

- **A data form for the list** (`items={[{ term, description }]}`, Polaris' shape) as the only API. Composition keeps each value a React node the app can fill with a Badge, an Avatar or a link, keeps per-row props readable, and suits server components; open question 8 keeps the data form as the alternative.
- **A table for name and value pairs** (Carbon's StructuredList). A table promises comparison across columns; a list of an account's details has one column of names and one of values, which is what `dl` means.
- **A viewport breakpoint for the list's layout.** A list in a 24rem side panel on a 1440px screen would draw side by side with a 7rem name column.
- **`variant="circular"` on Meter.** Meter stacks segments, places a pace marker and draws a legend; an arc of stacked hatched segments with a marker is a different drawing with different geometry, and the props would split by variant. Two parts with one semantics read more plainly, as SwiftUI's `Gauge` and its linear and circular styles share one model but not one drawing.
- **Putting Gauge in `@snapshot-ui/charts`** (section 7.1).
- **HTML `<meter>`**. It cannot be drawn as an arc in any engine, and its `low`, `high` and `optimum` regions color themselves green, yellow and red, which the color reservations forbid.
- **A sweep from zero when a gauge first appears.** Apple's rings sweep in; here the server's HTML is final and a sweep would delay the one thing the reader came for (open question 6).

## 5. DescriptionList

### 5.1 Anatomy

```
Horizontal (30rem and wider of its own box):

Institution        Northwind Bank
Account number     •••• 4821  [copy]                        [Edit]
Nickname           Not set                                  [Add]
Opened             12 March 2021

Stacked (under 30rem):

Institution
Northwind Bank
Account number                                              [Edit]
•••• 4821  [copy]
```

Each row is one `div` holding a `dt` (the term), a `dd` (the value, with a copy button after it when copyable) and, when the row has actions, a second `dd` holding them.

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

export interface DescriptionListLabels {
  /** Shown in slate in place of an empty value. @default 'Not set' */
  empty: string;
  /** The copy button's name, followed by the term through `aria-labelledby`: "Copy Account number". @default 'Copy' */
  copy: string;
  /** Said and shown after a copy. @default 'Copied' */
  copied: string;
  /** Said and shown when the clipboard refuses. @default 'Copy failed' */
  copyFailed: string;
}

export interface DescriptionListItemProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  /** The name of the value: "Account number". */
  term: ReactNode;
  /** The value. Absent, `null`, `false` or an empty string is empty; `0` is a value. */
  children?: ReactNode;
  /** In place of an empty value: words in slate, or a link to add it, as GOV.UK's summary list does. @default labels.empty */
  emptyValue?: ReactNode;
  /** The row's controls: an Edit button or link, named with the term (section 5.3). */
  actions?: ReactNode;
  /** What a Copy button after the value puts on the clipboard. No button for an empty value. */
  copyValue?: string;
  /** Called after a copy succeeds, with the copied text. */
  onCopy?: (text: string) => void;
  /** An amount or an identifier in Latin digits: tabular figures, left to right and isolated in every direction. @default false */
  isNumeric?: boolean;
  labels?: Partial<DescriptionListLabels>;
  ref?: Ref<HTMLDivElement>;
}
```

`onCopy` is a function, and a function cannot cross from a server component to a client one. DescriptionListItem is a server part, so a server page may pass `copyValue` but not `onCopy`; a client page may pass both. The props page says so, and the type comment says it.

### 5.3 Behavior

- **Markup.** `dl.description-list[data-layout]` holding the app's `DescriptionListItem`s. Each is `div.description-list-item`, the grouping the HTML standard allows inside a `dl`, holding `dt.description-list-term[id]`, `dd.description-list-value` and, with `actions`, `dd.description-list-actions`. The `div` keeps a row's three parts one box for the layout and the rule, and axe's `definition-list` and `dlitem` rules pass with it. No ARIA role is added or overridden: `role="list"` on the `dl` would drop the term and definition semantics that VoiceOver announces.
- **Static.** No `'use client'`; `useId` (for the term's id) is the one hook. The list holds no context, since a server component has none: `labels` are per row, and a Persian page wraps DescriptionListItem in its own component that passes its labels, as the docs show.
- **Terms with actions** (decided here, item 3). The actions are the app's nodes in their own `dd`, after the value, as GOV.UK's summary list puts its "Change" link. Each control names the row: a visible "Edit" with the term in its name ("Edit Nickname"), written as GOV.UK writes it, `Edit<span class="visually-hidden"> Nickname</span>`, or with `aria-label`. WCAG 2.5.3 (Label in Name) holds because the name starts with the visible word. In the horizontal layout the actions take the row's last column; stacked, they stand at the end of the term's line, as the gear stands beside each heading in GitHub's pull request sidebar.
- **Empty values** (open question 11). A value that is absent, `null`, `false` or `''` is empty: the `dd` carries `data-empty` and shows `emptyValue`, default "Not set", in slate. It is text the reader has to read, so it is never taupe (design record, "Where each text color may go"). It is never a dash, which reads as "dash" or as nothing. An `emptyValue` may be a link to add the value ("Add a nickname"), GOV.UK's guidance for a missing answer. An empty row draws no copy button.
- **Long values.** A value wraps and a long unbroken word, an IBAN or an email address, breaks anywhere (`overflow-wrap: anywhere`, the Card's rule, set on the value for a list outside a card). Nothing truncates: an ellipsis on a value hides data, and a reader who needs the whole identifier has the copy button. A long term wraps within its column.
- **Numeric values.** `isNumeric` gives the value `copy.css`'s numeral rules at the body size: tabular figures, `direction: ltr`, `unicode-bidi: isolate` and `text-align: match-parent`, so "•••• 4821" or "-$1,240.00" keeps its order and starts at the line's start on a Persian page.
- **Copy.** With `copyValue` and a value, a CopyButton (section 6) follows the value inside its `dd`, named "Copy" followed by the term: `aria-labelledby` points at the button's own hidden "Copy" and the term's id, so the name is "Copy Account number" whatever node the term is. The copied text is `copyValue`, not the drawn value: a masked number may copy its whole digits, which section 16's R5 and open question 9 weigh.
- **Layouts** (open question 7). `layout="auto"` follows the list's own width: the `dl` is a size container (`container: description-list / inline-size`) and from 30rem of its content box a row is a grid of three columns, the term, the value and the actions; under 30rem the term stands above the value. `horizontal` and `stacked` hold one layout. 30rem is chosen so the term column, 30% of the row, is at least 9rem (144px), which holds "Routing number" (about 105px at 14px, weight 500) on one line; under it, most terms would wrap.
- **No keys of its own.** The list is not a widget. Tab moves through the copy buttons and the app's actions in reading order.

| Key | Does |
| --- | --- |
| Tab, Shift+Tab | Through each row's copy button and actions, in order. |
| Enter, Space | On a copy button, copies; on an action, what the app gave it. |

### 5.4 How others do it

| System | Part | Layout | Actions | Missing values | What this spec takes |
| --- | --- | --- | --- | --- | --- |
| Shopify Polaris | `DescriptionList`, `items` of term and description, `gap` tight or loose | A `dl`; terms beside descriptions on a wide viewport, above them on a narrow one | None of its own | None of its own | The `dl` and the switch, made on the list's own width |
| GOV.UK Design System | Summary list, and the summary card around it | Key, value and actions in a row `div`, stacked on a phone | "Change" links in a `dd`, with hidden text naming the row; rows without actions | A link in the value to add it | The three-part row, actions in a `dd`, names that include the term, the add link as `emptyValue` |
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
- **Copy button.** `margin-inline-start: var(--spacing-part)` after the value, level with its line by the same margin.
- **In a card: the corner** (design record, "Nested radii, derived"). A control in the last row of a list that ends a card sits inside the card's corner curve: in Rounded comfortable a 40px button centered on a 22.4px line overhangs it by 8.8px, which leaves it 1 + 32 + 3.5 = 36.5px from the card's bottom edge and 33px from its side, both under the 40px radius. The record's rule for a control at a card's foot applies: it moves down, not in, so it stays on the column's end edge. `.card-body > .description-list:last-child > .description-list-item:last-child`, when it holds a control (`:has(.description-list-actions, .copy-button)`), adds `calc(var(--holder-corner-inset) - var(--holder-pad))` to its block-end padding: 7px in Rounded, 19px in Rounded compact, 0 in Soft (the padding already clears the 16px curve) and 0 in Square. The first row of a list that starts a card with no header takes the same at its block start. Only the controls' row grows; a row without controls is unchanged. The concentric audit (`apps/storybook/tests/concentric`) measures it in the `InCard` stories in all three shapes.
- **No corners of its own.** The list draws no frame, fill or radius, and its rules stop at its content box, so no part of it is a surface in a holder's corner. A card around it is the frame (section 8).
- **Contrast.** Ink and slate on lifted and on the canvas, gated already as text and cited by the contrast test, not added: ink 17.84 light and 17.42 dark on lifted, slate 5.31 and 6.94. The divider is a cue, not a boundary.
- **Forced colors.** The rules are borders, which the repaint keeps in `canvastext`; text takes the reader's colors; the copy glyph is `currentColor`. The block names the check glyph `canvastext` so the copied state survives, and nothing else.
- **Right to left.** Logical properties throughout: the term column is on the right, the actions on the left. A numeric value stays left to right and starts at the line's start (`match-parent`). Icons are not mirrored: Copy and Check have no direction.
- **Print.** Rules and text print; the copy button and the actions are hidden under `@media print`, since a printed page cannot press them.

## 6. CopyButton

### 6.1 API

```ts
export interface CopyButtonLabels {
  /** The button's name and its tooltip. @default 'Copy' */
  copy: string;
  /** @default 'Copied' */
  copied: string;
  /** @default 'Copy failed' */
  copyFailed: string;
}

export type CopyButtonProps = Omit<IconButtonProps, 'children' | 'onPress' | 'href' | 'aria-label' | 'aria-labelledby'> & {
  /** The text to put on the clipboard. */
  text: string;
  /** Called after a copy succeeds. */
  onCopy?: (text: string) => void;
  labels?: Partial<CopyButtonLabels>;
} & Partial<AriaName>;
```

Without `aria-label` or `aria-labelledby` the name is `labels.copy`. DescriptionListItem passes `aria-labelledby` (section 5.3).

### 6.2 Behavior

- **Client.** `'use client'`: React Aria's Button under IconButton, and `navigator.clipboard.writeText` on press. A press is a user activation in every engine, which Safari's clipboard requires; the call is made in the press handler, never after an `await`.
- **The outcome** (open question 13 covers the docs site). `copied` or `copyFailed`, held for two seconds (`COPIED_MS`, 2000, the docs site's `useCopy` timing and Carbon's `CopyButton` feedback timeout). The Clipboard API is missing outside a secure context and can refuse; both are `copyFailed`, never an exception. There is no `execCommand('copy')` fallback, which is deprecated.
- **What changes.** The glyph swaps from Lucide `Copy` to `Check` for `copied`, and stays `Copy` for `copyFailed`; the tooltip, if open, says the outcome; the status host says it once. The button's name does not change, so a screen reader that re-reads the focused button does not hear "Copied" as its name. Focus stays on the button.
- **Status host.** `span.copy-button-status[role="status"]`, polite, clipped from sight, in the server's HTML and empty, so its first message is announced (the toast host's rule). Each outcome is keyed, so two copies say "Copied" twice.
- **Tooltip.** A `TooltipTrigger` with the library's delays names the icon for a pointer, as the bulk bar's Clear selection is named (batch 4, ruling 25).
- **Before hydration.** The button is in the HTML and does nothing until hydrated, as FileButton does.

### 6.3 Look and CSS

The ghost IconButton, unchanged: 40px (36px compact, 44px compact on a coarse pointer), a 20px glyph, hit at the target, `--radius-pill`. `copy-button.css` adds only the status host's clipping and the glyph's forced-colors color; the check is ink, never success, since a copy is not a save.

## 7. Gauge

### 7.1 Where it lives

**In `@snapshot-ui/react`, with its CSS in core as `gauge.css`** (open question 2). Reasons:

- **It is a meter, not a chart.** It shows one value against a range, the WAI-ARIA `meter` role, exactly as Meter does. `@snapshot-ui/charts` holds data series on scales with axes, readouts and a table view (Sparkline, LineChart, and phase 6's bar, area and donut), versioned apart from the fixed group and with core only as an optional peer. A gauge has no series, no axis, no palette and no table.
- **Meter and ProgressBar live in react.** An app that draws a meter in a row and the same meter as a gauge in a tile should import both from one package and read both on one docs group.
- **Industry.** Apple's SwiftUI ships `Gauge` in SwiftUI itself, with linear and circular styles, apart from Swift Charts; Ant Design's dashboard is a `type` of its `Progress`, a core component; Material's circular indicator is a core component. Carbon is the exception, with its gauge in Carbon Charts.
- **Nothing in charts is needed.** The geometry is two arc formulas and a dash length (section 7.4), no scale helper. The direction rule is four lines of CSS, written again in `gauge.css` so an app that imports one component's CSS gets it.

The cost: a later donut chart in charts will draw arcs too. The arc helper is small enough to copy, as charts already copies `cx`.

### 7.2 API

```ts
export interface GaugeMark {
  /** In the gauge's units. */
  value: number;
  /** What the mark means, added to the gauge's description: "Statement balance: $1,200". */
  label: string;
}

export type GaugeBaseProps = Omit<HTMLAttributes<HTMLDivElement>, 'children' | 'aria-label' | 'aria-labelledby'> & {
  /** The visible name: "Credit used". Without it, `aria-label` or `aria-labelledby` names the gauge. */
  label?: ReactNode;
  /** The measurement, from `minValue` to `maxValue`. Drawn clamped to them; over `maxValue` the gauge is over its limit. */
  value: number;
  /** @default 0 */
  minValue?: number;
  /** @default 100 */
  maxValue?: number;
  /**
   * The value in the app's words, shown under or beside the dial and given as the accessible value:
   * "$1,600 of $5,000". Over the limit, or at a warning or error tone, it must say so.
   */
  valueLabel: string;
  /**
   * The short figure in the middle at `md` and `lg`: "32%", "$1.6K". At most 4 characters at `md` and 6 at `lg`.
   * @default the share of the range as an ASCII percentage, "32%"
   */
  figure?: string;
  /** Shows the figure. Ignored at `sm`, which has no middle to show it in. @default true */
  showFigure?: boolean;
  /** `ring` is a full circle from the top; `semicircle` an arc from the inline start over the top to the end. @default 'ring' */
  form?: 'ring' | 'semicircle';
  /** @default 'md' */
  size?: 'sm' | 'md' | 'lg';
  /**
   * What the value means now, the app's choice: `warning` needs a look soon, `error` means the limit has stopped
   * something (a payment declined, an upload refused). Over `maxValue` a neutral gauge draws as `warning`.
   * @default 'neutral'
   */
  tone?: 'neutral' | 'warning' | 'error';
  /** Up to three marks across the track: a threshold, a pace, a statement balance. */
  marks?: readonly GaugeMark[];
  ref?: Ref<HTMLDivElement>;
};

export type GaugeProps = GaugeBaseProps & AccessibleName<'label'>;
```

The names are React Aria's (`value`, `minValue`, `maxValue`, `valueLabel`), as ProgressBar's are. Meter's `max` is the odd one out, because a stacked meter has no single value; its page says so beside Gauge's.

### 7.3 Behavior

- **`meter`, not `progressbar`.** WAI-ARIA 1.2 defines `meter` as a scalar measurement within a known range and asks authors not to use it for progress, which is `progressbar`'s. Credit used, a budget spent, storage held and a savings goal saved are measurements: the reader's state, which can go up or down. An upload or an import is work the system is doing, ProgressBar's. The docs page leads with this choice and its examples, and links ProgressBar and Spinner.
- **Markup.** `div.gauge[data-size][data-form][data-tone]` holding `div.gauge-dial` and `div.gauge-text`. The dial has `role="meter"`, `aria-valuemin`, `aria-valuemax`, `aria-valuenow` (the value clamped to the range) and `aria-valuetext` (`valueLabel`), and holds the `svg` (`aria-hidden="true"`, `focusable="false"`) and `span.gauge-figure[aria-hidden="true"]`. The text block holds `span.gauge-label` and `span.gauge-value-label[aria-hidden="true"]`, since the dial reads it. The role is on the dial, not the root, because `meter`'s children are presentational, so the label beside it is not lost, as Meter puts the role on its bar.
- **Name.** Meter's chain: a non-blank `aria-labelledby`, else a non-blank `aria-label`, else the label's id, else the value text's id, so the dial is never unnamed. With marks, the dial is described by a hidden span listing their labels, joined by full stops, after the caller's own `aria-describedby`.
- **Static.** No `'use client'`, no state; `useId` is the one hook. A server component renders it with no client JavaScript.
- **The range.** The share is `(value - minValue) / (maxValue - minValue)`, clamped to 0 and 1 for the arc. A range whose `maxValue` is not above `minValue` draws an empty track and reports `minValue` for all three numbers, ProgressBar's rule, with no warning, since a static part has no effect to warn from.
- **Over the limit.** A value above `maxValue` sets `data-over`, draws the full arc and turns a `neutral` gauge's arc warning, Meter's rule; `valueLabel` must say "over" in words ("$5,340 of $5,000, $340 over"), and the docs and the changeset say so. Exactly `maxValue` is not over. `aria-valuenow` stays at `maxValue`, since a meter's value cannot pass its maximum.
- **Tones** (open question 4). The app chooses; the gauge never decides that a value is good or bad, StatTile's ruling 4. `neutral` is ink. `warning` is `--color-warning`, "a state that needs the reader's eye soon and is not a failure": a card at 90% of its limit, a budget behind its pace. `error` is `--color-error`, only where the limit has stopped something working: a card declined for being over its limit, storage full and uploads refused. There is no `success` tone: a goal reached or a budget kept is not a save, and Ant Design's habit of turning a dashboard green at 100% is what the reservation forbids; the words say "Goal reached" and the arc is ink. There is no `gain`, which is money that arrived. Signal orange, clay and taupe appear nowhere. A threshold that picks the tone (`warnAt`, HTML `<meter>`'s `high`) is rejected: only the app knows whether high is bad.
- **The non-color cue.** The tone always comes with words: `valueLabel` is required and must name the state. The marks, when given, show a threshold by position: a reader sees the arc pass the 80% mark whatever its color. In forced colors and in grayscale the arc is one color and the words and marks remain.
- **Marks.** Each mark is a radial tick across the track at its share of the range, clamped, with its label in the dial's description. Three at most; a fourth is not drawn. Marks are never toned: a threshold is not over anything.
- **The figure.** `figure`, or the ASCII percentage of the share by integer arithmetic (`Math.round(((value - min) * 100) / (max - min))` and `%`, ProgressBar's default, never `Intl`), unclamped, so a gauge over its limit says "107%". A Persian page passes its own digits. The figure is `aria-hidden`: the value text says the value, and a figure such as "32%" said after "$1,600 of $5,000" is noise. At `sm` it is not drawn.
- **Long figures.** The figure does not wrap and is not shrunk; one that passes the dial's inner width overflows it. The docs give the budget per size (4 characters at `md`, 6 at `lg`), a story shows the widest, and a figure longer than its size allows is the app's to shorten ("$12.3K"). A static part cannot warn.

### 7.4 Geometry

Every number is computed in render from the props, written with at most three decimals (Meter's rounding), and the same on the server and in the browser: `Math.PI`, multiplication and `String(number)` are exact by specification.

| Size | Box | Stroke | Inner width | Figure |
| --- | --- | --- | --- | --- |
| `sm` | 32px | 4px | 24px | none |
| `md` | 96px | 8px | 80px | `--text-h3` (24px, 500, -2%), tabular |
| `lg` | 160px | 12px | 136px | `copy-numeral-sm` (32px, 500, -2%), tabular |

- **The viewBox is the box in pixels.** `viewBox="0 0 S S"` for a ring and `0 0 S (S / 2 + w / 2)` for a semicircle, where `S` is the box and `w` the stroke, so at its own size one user unit is one pixel, and the svg scales uniformly (the default `preserveAspectRatio`) when an app sets `--gauge-size`, so a circle stays a circle. The charts' `preserveAspectRatio="none"` stretch is not used.
- **The track.** A circle of radius `r = (S - w) / 2` about `(S / 2, S / 2)`. A ring is two half arcs from the top, clockwise (`M S/2 w/2 A r r 0 1 1 S/2 S-w/2 A r r 0 1 1 S/2 w/2`), since one arc command cannot draw a whole circle; a semicircle is one arc from the inline start over the top (`M w/2 S/2 A r r 0 0 1 S-w/2 S/2`). Its length `L` is `2 * PI * r` or `PI * r`.
- **The value arc** is the same path with `stroke-dasharray` and `stroke-dashoffset` in user units, so no `pathLength` is needed (R4). Round caps add half the stroke at each end, so a share `s` is drawn as a dash of `max(0, s * L - w)` offset by `w / 2`: the arc, caps included, spans exactly `s * L`. A share whose arc is shorter than the stroke draws a dot of the stroke's width at the start, the least a reader can see; a share of 0 draws nothing, since a zero-length dash with round caps would draw that dot. A full ring's two caps meet at the top. A semicircle's track is drawn the same way at a share of 1, so its caps too end exactly at the arc's ends and a full value covers it; a ring's track is the whole circle and has no ends.
- **Marks.** Two radial `line`s at the mark's share `s` of the arc, `s * 360` degrees clockwise from the top for a ring and `s * 180` degrees from the inline start for a semicircle: a 6px line in the surface, under a 2px line in ink, each reaching 2px past the track on both sides, Meter's pace marker turned radial.
- **The figure** is HTML over the svg: centered in the ring; in a semicircle, its baseline on the arc's chord, in the bowl.

### 7.5 Look and CSS

- **One family with Meter.** The `md` track is Meter's 8px, `--color-frame` (ink at 12%); the arc is `--gauge-ink`, which is ink on the root and the tone's color under `[data-tone='warning']`, `[data-over]` and `[data-tone='error']`, as `--meter-ink` turns warning over the limit. The marks' ring reads `var(--meter-surface, var(--color-lifted))`: a gauge is a meter, so one `--meter-surface` an app sets on a canvas section serves both.
- **Caps** (open question 5). Round in every shape, the spinner's rule: "the ends of a stroke are dots, and dots stay round in every shape", and the parent spec's "the ends of a progress stroke take `--radius-dot`". `stroke-linecap` cannot read a radius token, and a gauge under Square drawn with square caps would still be a circle. Meter and ProgressBar square their ends under Square because their ends are a box's corners, which the shape axis reaches.
- **The dial is round in every shape**, as the spinner is: a gauge drawn square would be a different chart. The shape axis changes nothing in the gauge.
- **The concentric rule.** The gauge has no corner a holder steps: the dial is a circle, which the record's rule leaves alone ("a circle's radius is half its side, not a choice, so it is not stepped; where it sits in a corner, its placement sets the band"), and the corner audit skips it. The rule's construction does apply inside the dial: the arc and its track share one center, and the figure sits in the inner circle, `S - 2w` across. Were rings ever nested (open question 16), each inner ring's radius would be the outer's less a stroke and a constant gap, the record's formula with the gap as the holder's padding. In a Card or a StatTile the gauge keeps its size and shape; the card's corner inset governs only the controls the list beside it holds (section 5.5).
- **The text.** At `md` and `lg`, under the dial, centered, `var(--spacing-part)` below it: the label at `--text-small` weight 500 in ink, the value text at `--text-small` in slate with tabular figures, Meter's head turned to a column. The text block's width is the dial's or 12rem, whichever is more, and wraps. At `sm` the text is beside the dial, `var(--spacing-part)` from it, the two lines centered on it, the layout of a list row or a tile's trend.
- **In a tile.** A `sm` gauge fits StatTile's 96 by 32 trend slot; the docs show a ring and a semicircle there with `showFigure` off and the tile's own value as the figure.
- **Motion** (open question 6). When the value changes in the browser the arc moves over 200ms (`transition: stroke-dasharray 200ms ease, stroke-dashoffset 200ms ease, stroke 200ms ease`), ProgressBar's timing, so a refreshed balance reads as one movement. A transition never runs on the first style, so a gauge rendered on the server, or mounted with its value, does not sweep in. Under reduced motion nothing moves.
- **Contrast**, computed for this spec from the token values and re-measured by the plan with `contrast.js`, recorded in Appendix B and not gated, since the track is a mix. On lifted: the ink arc against the track 13.85 in light and 12.27 in dark; warning 4.76 and 6.28; error 5.61 and 4.04. On the canvas: ink 12.72 and 14.17, warning 4.37 and 7.26, error 5.15 and 4.67. Each clears the 3:1 a graphic needs. The track against its surface is 1.29 and 1.42 on lifted and 1.28 and 1.36 on the canvas: a cue, not a boundary, since the value text, which is required, carries the extent, as Meter's record says. The figure is ink, the label ink and the value text slate, each gated already as text.
- **Forced colors.** Strokes are not backgrounds, but an svg keeps the colors its author set, so the block names them: the track `graytext`, the arc `canvastext` in every tone, the marks `highlight` with their ring in the system background color. The words carry the tone, as Meter's over state keeps its words.
- **Print.** `print-color-adjust: exact`, as `.meter` sets, so a printed track keeps its tint.

### 7.6 Right to left

The gauge follows the page's direction, as Meter's fill and LineChart's time do (home spec, ruling 3): in right to left a semicircle fills from the right and a ring runs counter-clockwise from the top (open question 7). `gauge.css` sets `--gauge-flip` to `1` under `:where([dir='ltr' i])` and `-1` under `:where([dir='rtl' i])`, the charts' pattern, and the svg takes `scale: var(--gauge-flip, 1) 1`; the nearest `dir` attribute wins. The figure and the text are HTML and are not mirrored; a figure in Latin digits keeps its order by the numeral rules. The marks' positions mirror with the svg.

### 7.7 How others do it

| System | Part | Form | Tones | In the middle | What this spec takes |
| --- | --- | --- | --- | --- | --- |
| IBM Carbon | Gauge chart, in Carbon Charts | `semi` or `full` | `success`, `warning`, `danger` | The value, and a delta with an arrow | The two forms; not a success tone |
| Shopify Polaris | `ProgressBar`; no gauge | A bar, three sizes | `highlight`, `primary`, `success`, `critical` | None | Nothing new: Meter and ProgressBar already answer it |
| Ant Design | `Progress` with `type="dashboard"` | An arc with a gap at the bottom (`gapDegree`, 75 by default), `strokeLinecap` round by default | `success`, `exception`, `normal`, `active`; turns success by itself at 100% | `format` writes the text | Round caps; not the automatic success |
| Apple Health and Fitness | Activity rings; SwiftUI `Gauge` with `.accessoryCircular` and `.accessoryCircularCapacity` | Concentric full rings; past 100% a ring laps over itself. SwiftUI: an open arc with a marker, or a closed ring | Each ring a fixed color per activity, not a status | SwiftUI's `currentValueLabel`; also `label`, `minimumValueLabel`, `maximumValueLabel` | The label, value text and figure triad; the marker as `marks`; concentric construction for later rings; not lapping (the arc stops at the limit and the words say over) |
| WAI-ARIA 1.2 and HTML | `meter` role; `<meter>` | Any | `<meter>`'s `low`, `high`, `optimum` regions | `aria-valuetext` | The role on the dial and the app's value text; not the regions (section 7.3) |
| Material 3 | Circular progress indicator | A ring | One color | None | Nothing: it is for processes, ProgressBar's job |

## 8. CardActions

GOV.UK's summary card and most account pages put one Edit on the card's header. CollapsibleCard already lays out `.card-actions` beside its title; a plain `CardHeader` does not. If open question 12 is taken:

```ts
export interface CardActionsProps extends HTMLAttributes<HTMLDivElement> {
  ref?: Ref<HTMLDivElement>;
}
```

- `div.card-actions` placed in a `CardHeader` after the `CardTitle` and `CardNote`. `card.css` lays the header out as CollapsibleCard's is (`.card-header:has(> .card-actions)`: a wrapping row, the heading taking the room left and never under 12rem, the actions at the end), so the two cards look the same. Static.
- The actions sit in the header band, which the card's padding already clears of the top corner on the block axis (1 + 32px from the edge, and the band's own height below the title); the concentric audit's `InCard` story checks it.

## 9. The docs header on PageHeader

Batch 4 built PageHeader to reproduce the docs site's header and the owner ruled that the docs move to it "in the next batch" (documents spec, section 13.3 item 7; parent spec risk R8). Carried here (open question 3):

- `apps/docs` replaces its hand-built `.header` with `PageHeader` in its shell's header place: the crumb as `Breadcrumbs`, the color mode and corner switches as `actions`, its fill and stickiness as PageHeader's.
- Every docs page changes its header's markup, so the docs e2e completeness maps, the 320px checks and the docs corner audit run on every page. The docs site has no screenshot baselines, so no baseline changes.
- If the docs header differs from PageHeader in a way the reader would see, the difference is fixed in PageHeader, as R8 asks, and recorded.

## 10. Accessibility

- **Roles and names.** DescriptionList: the `dl` with its `dt` and `dd` pairs grouped by `div`, no role added; each copy button a `button` named "Copy" and the term; each action named by the app with the term in it. Gauge: `meter` on the dial, named by its label, valued by the app's words, described by its marks; the figure and the visible value text hidden, since the role reads them. CopyButton: a `button` with a polite `status` beside it.
- **Screen readers.** Support for `dl` differs: VoiceOver announces a description list and its terms, NVDA and JAWS announce less, and every reader reads the terms and values in order. Support for `meter` differs too: some readers say "progress bar" or no role, and every reader says the name and `aria-valuetext`. The text works where the role is unsupported. Not yet verified with VoiceOver and NVDA (owner action, as for Meter).
- **Never color alone.** A gauge's tone and over state have the value text's words and the marks' positions; an empty value has words; a copy's outcome has words and a glyph.
- **Targets (2.5.8).** Every copy button and action is 40px or hit at 40px; the gauge is not interactive.
- **Label in name (2.5.3).** "Edit" shown, "Edit Nickname" as the name; "Copy" in the tooltip, "Copy Account number" as the name.
- **Status (4.1.3).** The copy outcome reaches a screen reader without moving focus.
- **Axe** passes in light and dark for every story: each layout, empty values, actions, copyable values before and after a copy, a list in a card; each gauge size, form and tone, over the limit, with marks, without a label but with `aria-label`.

## 11. Responsive and right to left

- **320px.** A DescriptionList in a card on a 320px phone, with the page's 16px margins, has 248px of content in a card padded 20px, or about 222px in one padded 32px: under 30rem, so stacked, every value wrapping and breaking anywhere. An `lg` gauge is 160px and its text 12rem, which fits 222px; a row of gauges wraps (`flex-wrap`), as numerals do. No part scrolls sideways; a docs e2e checks 320px.
- **Beside a panel.** A list in a 24rem SidePanel stacks; in a card beside the panel at 1440px it is side by side if its box is 30rem or more.
- **Size containment.** A size container takes no width from its content, which StatTile met in 0.6.1. The list declares `contain-intrinsic-inline-size: 20rem`, so in a flex row or an `auto` grid column it is 20rem rather than its padding wide (R1). The gauge is not a container.
- **Right to left.** The list mirrors by logical properties and keeps numeric values left to right (section 5.5); the gauge mirrors its arc and not its text (section 7.6). Stories in `rtl/RightToLeft.stories.tsx` show both in Persian.

## 12. Server rendering

- DescriptionList, DescriptionListItem, Gauge and CardActions are server parts: no `'use client'`, no state, `useId` only, nothing from React Aria. They join the server-components suite.
- DescriptionListItem imports CopyButton, a client module, so in a React Server Components tree a copyable row is a static row with a client island; a row without `copyValue` sends no client code of its own.
- No part reads `window`, formats with `Intl` or measures before the first paint. The list's layout is a container query and the gauge's geometry is arithmetic on its props, so the server's HTML is final. The hydration suite runs each part under `en-US`, `de-DE` and `fa-IR` in UTC and Asia/Tehran with `onRecoverableError` failing the test.

## 13. Decided here

1. DescriptionList, DescriptionListItem, Gauge and CardActions are server parts; CopyButton is a client part.
2. The list is a `dl` of `div` rows, each a `dt`, a value `dd` and an actions `dd`, with no ARIA role added.
3. Actions are the app's nodes in their own `dd`; their names include the term; the stacked layout puts them on the term's line.
4. An empty value is absent, `null`, `false` or `''`, never `0`, and shows slate words or an add link, never taupe and never a dash.
5. Values wrap and break anywhere; nothing truncates.
6. The list's row follows the Dense data rule against the value's line; terms at 14px weight 500 in slate, values at 16px weight 450 in ink.
7. The term column is 30% of the row by default, set by `--description-list-term-size`, with the same template on every row and no subgrid.
8. A control in the first or last row of a list that starts or ends a card moves down by the card's corner inset; the audit checks it.
9. CopyButton holds its outcome two seconds, swaps its glyph to a check on success, keeps its name, and says the outcome in a polite status; no `execCommand` fallback.
10. Gauge lives in `@snapshot-ui/react` with `gauge.css` in core.
11. Gauge takes React Aria's prop names, Meter's role, naming chain and track, and ProgressBar's default figure and motion.
12. Three sizes, 32, 96 and 160px, with 4, 8 and 12px strokes; two forms, ring and semicircle; the figure at `md` and `lg` only.
13. The arc's length, caps included, is exactly the share; zero draws nothing; below a stroke's width it is a dot.
14. Tones are the app's, `neutral`, `warning` and `error`; over the limit a neutral gauge warns; no success and no gain tone; words required.
15. Up to three marks, never toned, described in the dial's description.
16. Caps are round and the dial is round in every shape.
17. The gauge mirrors in right to left by the charts' `dir` pattern; text is not mirrored.
18. A gauge reads `--meter-surface`, so one property serves Meter and Gauge.
19. No new tokens. The sizes and strokes are literals in `gauge.css`, as Meter's track is in `meter.css`.
20. The docs site has no `.description-list`, `.gauge`, `.copy-button` or `.card-actions` classes outside the library's to collide with; the plan checks again, since the docs site has its own `.code-copy`.
21. One 0.8.0 minor release of core and react, and a patch to `@snapshot-ui/charts` for its core peer (section 15).

## 14. Testing

- **Core (`css.test.js`, `token-only.test.js`, `contrast.test.js`).** `description-list.css`, `copy-button.css` and `gauge.css` are tokens only, in `@layer components`, imported by `styles.css` after `meter.css` (the gauge) and after `card.css` (the list), with a forced-colors block and logical properties; system colors only in the forced-colors block; `card.css`'s `.card-header:has(> .card-actions)` rule is covered. Pairs re-measured and recorded, not gated: the ink, warning and error arcs against the track over lifted, the canvas and float in both themes, and the track against each surface.
- **React (Vitest, jsdom).**
  - DescriptionList: the `dl`, `div`, `dt`, `dd` structure and axe; `data-layout` for each value; empty for `undefined`, `null`, `false` and `''` and not for `0`; `emptyValue` and the default; the actions `dd` only with actions; `isNumeric`'s attribute; `hasDividers`.
  - Copy in a row: a button only with `copyValue` and a value; its name "Copy" and the term through `aria-labelledby`, with a node as the term.
  - CopyButton: `writeText` called with `text` on press; "Copied" in the status and the check glyph, cleared after `COPIED_MS` with fake timers; a missing clipboard and a rejected promise give "Copy failed" without throwing; the name never changes; `onCopy` only on success; labels.
  - Gauge: the role on the dial and its four values; clamping; `data-over` above `maxValue` and not at it; tone resolution (neutral over the limit is warning, error stays error); the naming chain with blank strings; the description from marks; the default figure in ASCII, unclamped; no figure at `sm`; an empty range.
  - The geometry functions, pure and exported to the tests: the track path and length for each size and form; the dash and offset for shares of 0, one under the stroke, 0.5, 1 and above 1; mark angles; three-decimal output.
  - CardActions: the class, and a header holding it.
  - Server render: every part in the server-render and hydration suites; DescriptionList without copy, Gauge and CardActions in the server-components suite.
- **Storybook.** Section 15's stories, baselined in the four theme and shape modes and at 375px, and in compact where tagged. Play tests in the four story projects (Chromium in light and dark, WebKit and Firefox): copy with a mocked clipboard, success and failure, focus kept (`no-visual` for the failure path); the list switching layout at its 30rem box in a resizable frame; the gauge's arc length measured with `getTotalLength()` against the share in three engines (R4); the right-to-left mirror. The concentric audit runs on every new story in three shapes. Baselines change only through `pnpm --filter @snapshot-ui/storybook visual:docker`.
- **Docs e2e.** Completeness maps for the new pages; 320px with no sideways scroll; copy in Chromium with clipboard permission granted; forced colors on a toned gauge and a list in a card; the Accounts recipe at 375 and 1280; every docs page's header after section 9.

## 15. Docs, stories and release

- **Pages:** `description-list` (with "Copying a value" and "In a card"), `copy-button`, `gauge` (leading with "Gauge, Meter or ProgressBar"), each with Usage, Props, Accessibility with its Keys table where there are keys, and Design rules. The `meter` page gains "Meter or Gauge"; `card` gains CardActions and "A description list in a card"; `stat-tile` gains "A gauge as the trend".
- **The Accounts recipe**, with the Next App Router: a PageHeader "Accounts"; a grid of account cards (`repeat(auto-fit, minmax(min(20rem, 100%), 1fr))`), each a Card with a CardTitle, CardActions holding Edit, and a DescriptionList (institution; type; account number masked, `isNumeric`, copyable; routing number, copyable; opened; a nickname unset with "Add a nickname"; holders with Avatars); a credit card's card with a Gauge "Credit used" and marks for the statement balance; a details page with the list beside a SidePanel. Sample content keeps the reservations: an account's status is a neutral Badge, never success.
- **The docs site's code copy button** moves to CopyButton (open question 13), and `apps/docs/lib/use-copy.ts` goes.
- **Stories:**
  - `Components/DescriptionList`: `Default` (density), `Stacked` (a 20rem frame), `WithActions` (density), `EmptyValues`, `LongValues` (a long term, a long address, an unbroken IBAN), `Copyable`, `Copied` (after a press, the check), `NoDividers`, `InCard` (density; a CardHeader with CardActions and a list whose last row has an Edit), `InAFlexRow` (`no-visual`, R1).
  - `Components/CopyButton`: `Default`, `Copied`; `Failed` and `Keys` as `no-visual`.
  - `Components/Gauge`: `Default`, `Sizes`, `Semicircle` (three sizes), `Warning`, `Error`, `OverLimit`, `WithMarks`, `AcrossTheRange` (0, a share under the stroke, 1%, 50%, 99% and 100%, both forms), `WithoutLabel` (`aria-label`, the `sm` beside layout), `InStatTile` (density), `LongestFigure`.
  - `Pages/Accounts`: the recipe's grid.
  - `rtl/RightToLeft.stories.tsx`: `DescriptionList` and `Gauge` in Persian.
- **Design record:** a section per part in Appendix B of `docs/design-system.md` (DescriptionList, CopyButton, Gauge, CardActions), with every derived value, its reason and the measured pairs, and a line added to "Nested radii, derived"'s table of controls that move: the list's first and last rows in a Card.
- **Changesets:** one per part, minor, for `@snapshot-ui/core` and `@snapshot-ui/react` (DescriptionList, CopyButton, Gauge, CardActions), released together as 0.8.0. `@snapshot-ui/charts`'s core peer publishes as `^0.8.0` and its last release's `^0.7.0` does not admit 0.8, so a patch changeset moves it on, as batches 3a to 4 did.
- **Release note for the consumer:** a gauge's and a meter's `valueLabel` must say "over" and name a warning or error in words; `error` only where the limit stopped something; use Gauge for a measurement and ProgressBar for work; `copyValue` is in the page's HTML, so never pass a value the reader may not see; a Persian page passes `labels` and `figure` in its own digits.

## 16. Risks

- **R1. A size container in a shrink-to-fit parent.** A list in a flex row or an `auto` grid column would take no width from its content and collapse, as StatTile did before 0.6.1. Mitigation: `contain-intrinsic-inline-size: 20rem` and the `InAFlexRow` story.
- **R2. The clipboard.** Missing outside a secure context; Firefox grants writing only in a user activation; iOS Safari needs the call inside the gesture; a browser extension may block it. Mitigation: the press handler calls `writeText` synchronously, every failure is "Copy failed" with the value still selectable, the e2e grants permission in Chromium only and the story plays mock the API; a check on an iPhone is an owner action.
- **R3. Screen reader support for `dl` and `meter`.** Uneven, as section 10 says. Mitigation: names and value text that read without the roles, and a VoiceOver and NVDA pass before release, recorded as not yet verified until then.
- **R4. Dashes and caps across engines.** A dash on a full circle, a zero-length dash with round caps and `getTotalLength()` differ slightly between Chromium, WebKit and Firefox, and `pathLength` was unreliable in older WebKit. Mitigation: no `pathLength`, a share of 0 not drawn, dashes computed from the radius, and the `AcrossTheRange` story measured in three engines.
- **R5. A copied value the page does not show.** A masked account number that copies its whole digits puts them in the HTML and in the React Server Components payload, where a reader's extension or a saved page can read them. Mitigation: the docs say to copy only what the page may hold; open question 9 keeps an asynchronous getter for later.
- **R6. A figure that does not fit.** A static part cannot measure or warn. Mitigation: the per-size character budget in the props' comments and docs, and the `LongestFigure` story.
- **R7. A gauge used for progress.** An upload drawn as a gauge would announce a meter. Mitigation: the docs page leads with the choice, and the props comment names `meter`.
- **R8. The docs header move.** Every docs page changes its header in one task. Mitigation: no screenshot baselines exist for the docs site; the e2e maps, the 320px checks and the docs corner audit run on every page, and differences are fixed in PageHeader and recorded.

## 17. Open questions

Each has a recommended answer; the owner may take it or the alternative.

1. **The consumer's Accounts page.** The repository records no verbatim batch 5 request, so section 3 is the page as inferred from the agreed scope and the consumer's navigation. Recommended: send section 3 to the consumer to confirm before the plan, in particular what its gauges measure (a credit limit, a transfer limit, a budget or a goal), since that settles the tones and marks.
2. **Where Gauge lives.** Recommended: `@snapshot-ui/react`, beside Meter and ProgressBar (section 7.1), because it is a meter with one value and no series, and SwiftUI, Ant Design and Material all keep theirs in the core set. Alternative: `@snapshot-ui/charts`, Carbon's choice, which groups everything drawn in svg but makes an app install a second package for a meter.
3. **The docs header in this batch.** Recommended: keep it in, as the owner ruled in batch 4; it costs one docs task and no baselines. Alternative: defer it again to the batch that brings ThemeSwitch, so the header's switches move to the library at the same time (question 14).
4. **Gauge's tones.** Recommended: `neutral`, `warning` and `error` chosen by the app, warning by itself over the limit, no success and no gain, words required, because the reservations allow error only for a failure and success only for a save. Alternative: `neutral` and `warning` only, Meter's set, adding `error` when a consumer shows a limit that blocks something.
5. **Gauge's caps under Square.** Recommended: round in every shape, the spinner's rule for a circular stroke. Alternative: square caps under Square, so a gauge's ends match Meter's and ProgressBar's ends there, which needs a shape-aware rule no other part has.
6. **Gauge's motion.** Recommended: 200ms when the value changes, none on first appearance, none under reduced motion. Alternative: Apple's sweep from zero on first appearance, livelier, but it delays the reading and needs a client part to start it.
7. **Direction.** Recommended: the list and the gauge follow the page, so in right to left a ring runs counter-clockwise and a semicircle fills from the right, as Meter and the charts' time axis do. Alternative: a ring always clockwise, as clock faces are never mirrored, with only the semicircle mirrored.
8. **The list's API.** Recommended: composition, `DescriptionList` holding `DescriptionListItem`s with `term` and the value as children, because values are often nodes (a Badge, an Avatar, a link) and each row has its own props. Alternative: Polaris' `items` array, shorter for plain text and the natural home for list-wide `labels`.
9. **Copying a value the page does not show.** Recommended: in 0.8.0 `copyValue` is a string and the docs say it is in the HTML. Alternative: an asynchronous `getCopyValue` on CopyButton for a client page that fetches the full number on press, added when the consumer needs it.
10. **Editing in place.** Recommended: not in this batch; a row's Edit opens the app's page, Dialog or SidePanel, with a SaveBar where it holds a form. Alternative: Atlassian's inline edit, a value that becomes its field on press, which needs focus, validation and a save per row.
11. **The empty value's words.** Recommended: "Not set" in slate, or the app's add link. Alternatives: "None", GitHub's "None yet", or leaving the value blank, which a screen reader reads as nothing.
12. **CardActions for a plain card.** Recommended: add it, a small static part that reuses CollapsibleCard's header layout, because GOV.UK's summary card and most account pages put one Edit in the card's header. Alternative: the app lays out its own header actions, or uses CollapsibleCard, which adds a fold the page does not want.
13. **CopyButton as a public part.** Recommended: export it and move the docs site's code copy button to it, so the docs dogfood it. Alternative: keep it internal to DescriptionList, smaller to document, but an app copying a value outside a list writes its own.
14. **Candidates: AccountMenu and ThemeSwitch** (parent spec, phase 5; the app shell spec deferred both and left slots for them). They are the reader's own account and appearance, not the bank accounts this page lists. Recommended: not in this batch; a later "Settings" batch with the shell's account slot, and the docs header's switches if question 3 defers it.
15. **Candidate: AvatarGroup** (parent spec, phase 4; the home spec deferred it "until a page needs the overlap rule"). A joint account's holders could need it. Recommended: not in this batch; the recipe lists holders as Avatars beside their names in the value, and AvatarGroup comes when a consumer page shows more than three faces in a row.
16. **Several values in one gauge.** Apple's concentric rings, or Meter's spent and held as an arc. Recommended: not in this batch; a single value covers a limit, and rings follow the concentric construction in section 7.5 when a consumer asks. Alternative: a `segments` prop now, matching Meter's API, at the cost of the hatched arc's geometry and a legend.

## 18. Size budget

Measured as the others, without React, React Aria and Lucide, to start at:

| Entry | Budget | Reason |
| --- | --- | --- |
| `{ Gauge }` | 1.5 kB | Meter's 795 B entry took a 1.5 kB limit; Gauge adds the arc arithmetic and drops the segments and legend. |
| `{ CopyButton }` | 2.5 kB | IconButton's 1 kB and Tooltip's 1.5 kB limits, less their shared code, plus the clipboard and the status. |
| `{ DescriptionList, DescriptionListItem }` | 3 kB | It carries CopyButton; without it the list would be under 1 kB. |
| `{ CardActions }` | 0.5 kB | One element. |

The CSS adds about 2.5 kB to `styles.css` before compression (the list about 1 kB, the gauge about 1.2 kB, the copy button and CardActions the rest). A part over its budget is reported with the number, as 3c's SidePanel was, and the limit follows the rule: the measured entry rounded up to 1 kB, plus 0.5 kB.

## 19. Visual baseline estimate

Each visual story is baselined in five modes (Rounded light, Rounded dark, Soft light, Square light, Rounded light at 375px), and a story tagged `density` adds compact, six.

| Group | Visual stories | Of them with compact | Baselines |
| --- | --- | --- | --- |
| DescriptionList | 9 | 3 (`Default`, `WithActions`, `InCard`) | 48 |
| CopyButton | 2 | 0 | 10 |
| Gauge | 11 | 1 (`InStatTile`) | 56 |
| Pages/Accounts | 1 | 1 | 6 |
| Right to left (`DescriptionList`, `Gauge`) | 2 | 0 | 10 |
| **New** | **25** | **5** | **130** |

Existing baselines: none should change. `card.css` gains a rule that matches only a header holding `.card-actions`, which no existing story draws, and the docs header move (section 9) has no screenshot baselines. Expect 120 to 140 new files, depending on how the plan splits the gauge's sizes and forms into stories; any change to an existing baseline is investigated before it is committed.
