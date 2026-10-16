# Data table: DataTable, EmptyState, Skeleton and SidePanel: design

Status: approved on 2026-10-15. The owner took the twelve rulings in section 10.1 as recommended; everything else is decided here and listed in section 10.2.
Parent spec: `docs/specs/2026-10-10-snapshot-ui-design.md`. This document pulls forward the phase 4 rows "DataTable", "EmptyState" and "Skeleton", and adds SidePanel, which the parent spec does not list (the shell overlays spec deferred "the non-modal desktop side panel (batch 3)"). It answers batch 3c, the last third of batch 3 of the first consumer's roadmap, its Transactions page. The design authority remains `docs/design-system.md`.
Released before this: batch 3b, `@snapshot-ui/core` and `@snapshot-ui/react` 0.5.0 and `@snapshot-ui/charts` 0.1.2 (the filters). Section 2 lists what this document takes from batches 1 to 3b.

## 1. Goal

Give a list page its list: a data table with sorting, selection, a bulk-action bar, a keyboard model, links to a detail view, a sticky header, columns of figures, a totals row, a loading state and an empty state, which turns into a list grouped by day where it is narrow; and a side panel that shows the detail beside the table on a wide screen and as a sheet on a phone, opened and closed by the URL. Ship them as the batch 3c minor release, 0.6.0.

Batch 3 ("Transactions") ends here: 3a and 3b released; **3c, this document**.

The design document has no rules for dense data. Its own appendix says "No data-dense or tabular component patterns are defined", and the parent spec's risk R6 records that "dense data, loading and empty states have no specification in the document. Each gets a recorded derivation before it is built." This document is that derivation's plan: every look below is derived from a part that already has a recorded rule (Menu's rows, the field's sizes, the rail, Sheet, Badge, the numeral rule), and the plan appends the measured record to Appendix B before each part is built.

The hard part of 3c is that React Aria's Table has three defaults the consumer's brief contradicts: a click selects once anything is selected, typeahead cannot be turned off, and every docked overlay is modal. Rulings 2, 3 and 10 are the calls on each.

Build order, which is also the plan's order:

1. **EmptyState and Skeleton** (section 5): two static parts the table and any page can use.
2. **DataTable, the table face** (section 6): columns, sorting, the sticky header, figures, totals, the empty and loading bodies.
3. **Selection** (section 7): the checkbox column, select-all, the bulk-action bar, the row link and the keys.
4. **DataTable, the list face** (section 8): the same rows as a list grouped by day where the table's box is narrow.
5. **SidePanel** (section 9): beside the content on a wide screen, a sheet on a phone, driven by the URL.

Out of scope, each recorded where it is deferred:

- Column resizing, reordering and hiding by the user (parent spec's row says "column resizing"): React Aria's resizable container sets a fixed table layout and measures its width in a layout effect, so the server's HTML draws every column at zero width until hydration. Deferred to a later batch with its own derivation.
- Virtualized rows and infinite scroll (`Virtualizer`, `TableLoadMoreItem`): the Transactions page pages with 3a's Pagination.
- Selection across pages ("select all 1,240 results"): ruling 4. The app can offer it in the bulk-action bar's slot.
- Expandable rows, tree rows and drag and drop.
- Editing in a cell. The detail panel is where a transaction is edited.
- A filter row in the header. 3b's FilterBar is the filter surface.
- Sections in the table face. Only the list face groups (section 8).

## 2. Depends on

| From batch 3b or earlier | Used here as |
| --- | --- |
| `Checkbox` (`checkbox/Checkbox.tsx`), named only by `aria-label` "as a table's row select is", with its 40px hit area and `[data-indeterminate]` | The row and select-all checkboxes, through React Aria's `slot="selection"` context, which `CheckboxField` already reads |
| `Link` and `RouterProvider` (`link/Link.tsx`) | The row's link to its detail (ruling 2), through the app's router |
| `Sheet` (`sheet/Sheet.tsx`): the title, the `footer`, the body that scrolls once open, inert while entering | SidePanel on a phone |
| The rail's surface (`sidebar.css`): float, the hairline, the stadium corner, level 1 | SidePanel beside the content |
| `Menu`, `MenuTrigger`, `MenuItem` | The app's row menu in a cell and the bar's overflow; nothing new |
| `Button` (secondary, tertiary) and `IconButton` (ghost) | The bar's actions and its Clear selection, the panel's close button |
| `Badge` | A status in a cell, as anywhere |
| `Spinner` | Not used: the loading state is skeleton rows (ruling 9) |
| `Pagination`, `Tabs`, `FilterBar`, `SearchField` | Composed around the table by the app; the docs recipe shows the whole page |
| The numeral rule in `copy.css`: tabular figures, `nowrap`, `direction: ltr`, `unicode-bidi: isolate`, `text-align: match-parent` | The end-aligned columns' cells and the totals |
| `--text-overline` ("Uppercase column headers in tables and stat tiles"), slate | The column headers and the list face's day headers |
| Menu's row rules: the 5% ink wash for hover inside `@media (hover: hover)`, the inset focus ring inside a scroller, never ringed under the pointer | Row hover and focus |
| `--size-field` (48px, 36px compact, 44px coarse) and `--size-target` (40px) | The row's height, never under the 40px target |
| `--color-divider` (ink at 10%) and `--color-frame` | The rules between rows and under the header |
| `QUIET_MS` (`utils/quiet.ts`) and Pagination's polite status | The bar's selection count and the table's loading line |
| `useHydrated` (`utils/useHydrated.ts`) | SidePanel's server face (section 9.2) |
| `matchesShortcut`'s `event.code` fallback (`command-palette/shortcut.ts`) | J, K and X on a Persian keyboard layout, where `event.key` is another letter |
| `isAnotherModalOpen` (`overlay/`) | The table's keys stand down while a modal is open |
| `present()`, `cx`, `composeRenderProps`, `mergeRefs`, `useControllableState`, `useWarnOnce` | As everywhere |

React Aria 1.22.1 parts used for the first time: `Table`, `TableHeader`, `Column`, `TableBody`, `TableFooter`, `Row`, `Cell`, `GridList`, `GridListItem`, `GridListSection`, `GridListHeader` and `Toolbar`. Every React Aria entry imports `client-only`, so DataTable is a client part; EmptyState and Skeleton import nothing from React Aria and stay server parts.

## 3. What the consumer needs

The consumer's roadmap lines for this batch, kept verbatim as input:

> DataTable: sorting controlled from outside (from the URL); selection with select-all and a bulk-action bar; arrows or J/K to move, Enter to open, X or Space to select; a row opens a detail panel through a link; a sticky header; right-aligned tabular numbers; a totals row; skeleton rows; an empty slot; and a phone layout as a list grouped by day.
> SidePanel: beside the content on desktop with no scrim, a bottom sheet on phones, with the open state driven by the URL.

From 3a: "the data table pages with Pagination and sits under Tabs". From the parent spec: EmptyState and Skeleton are static parts, "Loading state is unspecified; derive it."

Its rules for every part, unchanged: `'use client'` only on interactive parts; no `Intl` formatting and no `window` at render, and no first-paint measurement; no external requests; light and dark, all three shapes, right to left (the Persian guide), comfortable and compact density; WCAG 2.2 AA including 2.5.8; navigation through `RouterProvider`; everything exported from the react index, with the CSS in `core/styles.css`. The Transactions page keeps all its state in the URL: the sort, the page, the open transaction, and so on. Selection is the one piece of state that stays in the page, since a URL with chosen rows in it is neither shareable nor useful after the rows change.

## 4. Approach

**One data source, two faces.** The table and the list grouped by day draw the same rows, so DataTable takes its rows as data (`items`) and its columns as definitions (`columns`), and renders both faces from them (ruling 1). Each column says how its cell reads in the table and where it sits in a list item. The faces are both in the server's HTML and a container query on DataTable's own box shows one (ruling 8), as FilterBar shows its row or its button, so nothing is measured and the server's HTML is right at every width.

**Strings and figures are the app's.** Every cell is the app's node. An amount, a date, a count and a day's heading arrive as strings; the library formats nothing, and the count in the bulk-action bar is written by the app's `formatCount`, as FilterBar's is. Every name the library writes ("Select all", "Select row", "Clear selection", "Loading") has an English default in `labels`.

**React Aria where it fits, guarded where it does not.** React Aria's Table gives the grid, the row and cell focus, the `aria-sort` headers, the selection model and the select-all checkbox. Three of its defaults contradict the brief, and the library guards each in one place:

| React Aria's default | The brief | The library |
| --- | --- | --- |
| A click on a row selects it once any row is selected, and Enter then does nothing | "Enter to open, X or Space to select"; "a row opens a detail panel through a link" | A row's open target is a real `Link` in its first cell, stretched over the row; selection is the checkbox, X and Space only (ruling 2) |
| Typeahead moves focus on any letter and cannot be turned off | "arrows or J/K to move" | A capture-phase key handler on DataTable's root takes J, K and X and stops every other single printable key (ruling 3) |
| Select-all yields the string `'all'` | A bulk action needs the rows | `onSelectionChange` always receives an array of the given rows' keys (ruling 4) |

**The panel is a layout, not an overlay, where there is room.** On a wide screen the detail sits in a column beside the table, a complementary landmark the page can still be used around; on a narrow one it is 3b's Sheet, modal, since a phone has no room beside (rulings 10 and 11). Both are driven by one `isOpen` that the app reads from the URL.

**Client where it must be.** DataTable takes focus and keys and is a client part, as React Aria requires; its cells may be server-rendered nodes passed in. EmptyState and Skeleton are static and stay server parts. SidePanel is a client part, with its desktop face in the server's HTML.

Rejected along the way:

- **A compositional API** (`<DataTable><Column/><Row/></DataTable>`), React Aria's own shape. It cannot draw a second face from the same rows, and a list item's layout would be a second tree the app keeps in step (ruling 1).
- **Row `href` on React Aria's `Row`.** The row stays a `<tr>` that opens through a made-up `<a>`, so there is no link context menu and no middle click, and a click selects once anything is selected (ruling 2).
- **A horizontally scrolling table.** A sticky header sticks to its nearest scroll box, so inside an `overflow-x: auto` box it no longer sticks under the page's header; and a page that scrolls sideways at 320px fails the parent spec (ruling 6).
- **Column resizing in this batch** (section 1): React Aria sets a fixed layout and measures after hydration.
- **A modal drawer for the desktop panel.** Drawer is modal with a scrim; the brief says "no scrim", and a reader compares the detail with the rows beside it.
- **A spinner for loading.** A table that loads keeps its shape (ruling 9).

## 5. EmptyState and Skeleton

### 5.1 API

```ts
export interface EmptyStateProps {
  /** The line that says what is missing: "No transactions this month". */
  title: string;
  /** What the reader can do about it. */
  description?: ReactNode;
  /** A Lucide icon element, drawn at 24px in slate. */
  icon?: ReactNode;
  /** One action, such as a `Button` that clears the filters. */
  action?: ReactNode;
  /** @default 3, the step under a card's title */
  headingLevel?: 2 | 3 | 4;
  className?: string;
  ref?: Ref<HTMLDivElement>;
}

export interface SkeletonProps {
  /** @default 'line' */
  shape?: 'line' | 'block' | 'circle';
  /** A CSS length; a line defaults to 100% and a circle to 40px. */
  width?: string;
  /** A CSS length; a line is one line of the text it stands for. */
  height?: string;
  className?: string;
}
```

### 5.2 Behavior

- **EmptyState** is `div.empty-state` holding the icon (`aria-hidden`), a heading at `headingLevel`, the description and the action. It is static: no `'use client'`, no state. It is a page's empty card, DataTable's empty body (section 6.2) and the list face's.
- **Skeleton** is `span.skeleton[aria-hidden="true"]`, a shape with no text. It says nothing to a screen reader: the part that shows skeletons says "Loading" once, in its own status (section 6.2). Static, a server part.

### 5.3 Look and CSS

- **EmptyState.** Centered, `padding: var(--spacing-separate) var(--spacing-peer)`, the icon `var(--spacing-part)` over the title. The title at `--text-h4`, weight 700, ink; the description `--text-small` in slate (the design document's "empty state" text color, which overrides its older "placeholder-like" line), `max-width: 32rem`; the action `var(--spacing-peer)` under them. Never taupe: the reader needs to read it.
- **Skeleton.** A line is `1em` tall at `--radius-micro` and sits on the text's line box, so a row of skeletons is the height of a row of text; a block takes `--radius-control`; a circle `--radius-dot`. The fill is `--color-divider` (ink at 10% in light, white at 10% in dark), which reads as a shape once it is a filled bar and not a 1px rule; the plan measures it against canvas and lifted and records it. It pulses between that and half of it over 1.6s (ruling 9), and stands still under `prefers-reduced-motion`.
- **Forced colors.** A skeleton is `canvastext` at 20% through `color-mix`, or a `graytext` fill where `color-mix` is unsupported; an empty state's text keeps the system colors.

## 6. DataTable: the table face

### 6.1 API

```ts
export interface DataTableColumn<T> {
  /** Unique; the sort descriptor's `column`. */
  id: string;
  /** The header's text. Its name too, so a header with no text needs `headerLabel`. */
  header: string;
  /** The cell for a row: a string or any node. */
  cell: (item: T) => ReactNode;
  /** The row's name and typeahead text when the cell is not a string. */
  textValue?: (item: T) => string;
  /** Exactly one column is the row header. @default the first column */
  isRowHeader?: boolean;
  /** 'end' sets figures: tabular, unbroken, at the line's end in either direction. @default 'start' */
  align?: 'start' | 'end';
  allowsSorting?: boolean;
  /** A CSS width for the column, such as '8rem' or '20%'. @default shares what is left */
  width?: string;
  /** The column leaves the table face when DataTable's box is narrower than this (ruling 6). */
  hideBelow?: 'sm' | 'md';
  /** The totals row's cell for this column. */
  total?: ReactNode;
  /** Where the cell goes in a list item (section 8). @default 'hidden', or 'title' for the row header */
  listSlot?: 'title' | 'meta' | 'end' | 'hidden';
}

export interface DataTableLabels {
  /** @default 'Select all' */
  selectAll: string;
  /** The row checkbox's name, given the row's text value. @default (row) => `Select ${row}` */
  selectRow: (row: string) => string;
  /** @default 'Clear selection' */
  clearSelection: string;
  /** The bulk-action bar's count, given the formatted count. @default (count) => `${count} selected` */
  selected: (count: string) => string;
  /** @default 'Loading' */
  loading: string;
  /** The totals row's header cell. @default 'Total' */
  total: string;
  /** The bulk-action bar's name. @default 'Bulk actions' */
  toolbar: string;
}

export interface DataTableProps<T> {
  /** The table's name, from a visible heading by `aria-labelledby` or a string by `aria-label`. */
  'aria-label'?: string;
  'aria-labelledby'?: string;
  items: readonly T[];
  columns: readonly DataTableColumn<T>[];
  /** Each row's key, stable across renders. */
  getKey: (item: T) => Key;
  /** The row's detail, a URL the router opens (ruling 2). Rows without one do not open. */
  getRowHref?: (item: T) => string;
  /** The row whose detail is open: `aria-current` and a mark (section 6.3). */
  currentKey?: Key | null;
  /** Controlled from the URL: the column's id and its direction. */
  sortDescriptor?: { column: string; direction: 'ascending' | 'descending' };
  onSortChange?: (sort: { column: string; direction: 'ascending' | 'descending' }) => void;
  /** Turns selection on (section 7). Always controlled. */
  selectedKeys?: readonly Key[];
  onSelectionChange?: (keys: Key[]) => void;
  disabledKeys?: readonly Key[];
  /** The bulk-action bar's buttons, shown while any row is selected. */
  bulkActions?: ReactNode;
  /** Shows skeleton rows while there are no items, and marks the table busy (ruling 9). */
  isLoading?: boolean;
  /** @default 8 */
  loadingRowCount?: number;
  /** The empty body: an EmptyState, or any node. */
  emptyState?: ReactNode;
  /** The list face's day groups (section 8). Without it the list face is one ungrouped list. */
  getGroup?: (item: T) => { id: Key; label: string };
  /** How counts are written, such as in Persian digits. @default String */
  formatCount?: (count: number) => string;
  labels?: Partial<DataTableLabels>;
  className?: string;
  ref?: Ref<HTMLDivElement>;
}
```

A sort, a selection and an open row are always controlled: the app holds them, in the URL for all but selection.

### 6.2 Behavior

- **Markup.** `div.data-table` (a size container named `data-table`) holding `div.data-table-grid` with React Aria's `Table` (`table.data-table-table`), then `div.data-table-list` with the list face (section 8), then the bulk-action bar (section 7). The `Table` renders a real `<table>` with `thead`, `tbody` and, when any column has `total`, `tfoot`.
- **Columns.** One `Column` per definition, plus the checkbox column first while selection is on. The row header is the first column unless one says `isRowHeader`; more than one is a development warning. A header with `allowsSorting` holds its text and a 16px Lucide `ArrowUp` or `ArrowDown` for the active direction, and an `ArrowUpDown` in slate on the inactive ones, so a sortable column is visible as one before it is used.
- **Sorting** (ruling 12). A press, Enter or Space on a sortable header calls `onSortChange` with that column, ascending, or the other direction when it is already the sorted one: React Aria's cycle, with no unsorted state. The app writes the URL; the table shows what `sortDescriptor` says. React Aria sets `aria-sort` and announces the change.
- **Rows.** Each item is a `Row` keyed by `getKey`, its cells by `column.cell(item)`, its text value by the row header's `textValue` or its string cell. `disabledKeys` rows can neither be selected nor opened, and draw in taupe.
- **Opening** (ruling 2). With `getRowHref`, the row header's cell holds a `Link` (`a.data-table-link`, the library's `Link`, so the router opens it) around the cell's content, stretched over the whole row by a `::after`; the checkbox and any interactive node the app puts in a cell sit above it. A press anywhere else on the row opens the link; Enter on a focused row opens it too (section 7.2). It is a real anchor: middle click, a modifier click and the context menu work. The row is `aria-current="true"` while its key is `currentKey`.
- **The sticky header.** `thead` is `position: sticky` at `var(--page-sticky-top, 0px)`. The app's header is its own content and has no fixed height, so the app sets `--page-sticky-top` to its header's height on an ancestor, once for every sticky part of the page; the docs recipe sets it beside AppShell. The header's fill is `var(--data-table-surface, var(--color-canvas))`, which the docs set to `--color-lifted` for a table in a Card, and its z-index is `var(--z-header)` less one, so it scrolls under the page's chrome and never over it, the design document's rule for "a table's header row".
- **Figures.** A column with `align: 'end'` draws its header and cells at the line's end, `text-align: end`, with the numeral rule's tabular figures, `nowrap` and isolated left-to-right run: right-aligned on an English page, left-aligned on a Persian one, where a column of amounts lines up at its digits' end either way. A figure never wraps; a sign, a currency and a unit are in the app's string.
- **Totals.** With any column's `total`, `TableFooter` adds one row: the row header's cell writes `labels.total` (unless the row-header column has its own `total`), each column with a `total` its node, the rest empty. The totals row is a row of the grid, reached by the arrows, and is never selectable or openable. It is not sticky: it is the end of the list.
- **Empty.** With no items and not loading, the body is React Aria's empty state, one row whose cell spans every column, holding `emptyState`. Without one the body is that row with nothing in it, and a development warning names `emptyState`: what is missing is the app's sentence, not the library's.
- **Loading** (ruling 9). While `isLoading` and there are no items, the body is `loadingRowCount` skeleton rows inside React Aria's empty state, so the grid counts no rows and typeahead and selection see none: each skeleton row draws a Skeleton line per visible column, at the column's alignment and 40% to 80% of its width in a fixed pattern, never random, so the server and the browser draw the same. The table is `aria-busy="true"` and a polite status, outside the table, says `labels.loading` after `QUIET_MS`. While `isLoading` with items (the next page arriving), the rows stay as they are and only `aria-busy` and the status change: rows that flash to skeletons for a 200ms fetch are noise.
- **Columns that leave** (ruling 6). A column with `hideBelow: 'md'` leaves the table face when DataTable's box is narrower than 48rem, `'sm'` when narrower than 40rem, by container query; its cells are `display: none`, and React Aria's grid, which counts DOM cells only for focus, steps over them. The row header never hides.

### 6.3 Look and CSS

- **Surface.** DataTable draws no outer surface: it sits on the canvas or in a `Card`, and the rows take the holder's fill. Flush with its holder's inline edges, so no nested radius applies (the design document's "anything flush with its holder's edge").
- **Rows.** `block-size: max(var(--size-target), var(--size-field))`: 48px, 40px compact, 44px on a coarse pointer, so the 40px checkbox fits in every density. Cells `padding-inline: var(--spacing-inset)` (16px), `vertical-align: middle`, the cell text `--text-small` at weight 450, ink; a row header at weight 500. A long string ellipsizes on one line; the cell's full text is in the row's name.
- **Rules.** A 1px `--color-divider` rule under each row and under the header; none above the first row; a 1px `--color-frame` rule above the totals row. No zebra: the design document's rhythm comes "from tone and whitespace, not lines", and a rule per row is already the most the table draws.
- **Header.** `--text-overline` in slate, 40px tall, the sort icons 16px; a sortable header's whole cell is its button, hit at its full height, ink on hover and while sorted (slate on the 5% wash measures 4.38, as the tabs found).
- **Hover.** The 5% ink wash on the row inside `@media (hover: hover)`, as a menu row. Slate on the wash over canvas measured 4.38 for the tabs, under 4.5, so the plan measures a row's slate text on both washes over canvas and over lifted, and turns it ink where it falls short, as the tabs did.
- **Selected.** The row's checkbox is checked, and the row takes the ink wash at 8%, one step over hover: a selected row is marked by its checkbox, never by color alone, and eight filled ink rows would shout, as Menu's multiple choice found. A hovered selected row stays at 8%.
- **Current.** The row in `currentKey` draws a 3px ink bar at its inline start inside the first cell (an inset `box-shadow` is a literal shadow and is not allowed, so a `::before` on the first cell), and its row-header text at weight 700. In right to left the bar is at the right.
- **Focus.** A focused row draws the inset 2px ink ring on the row; a focused cell on the cell; a focused header on its button. Inset, since the table can sit in a scrolling region and an outset ring is clipped, Menu's rule. Never ringed under the pointer.
- **Totals.** The totals row's cells at weight 700, ink, figures as their column.
- **Disabled row.** Taupe text, no wash, `cursor: not-allowed`.
- **Badge in a cell.** A neutral or toned Badge, as anywhere; on a current row nothing changes, since no row takes an ink fill.
- **Forced colors.** Rules `canvastext`; selected rows `highlight` with `highlighttext`; the current bar `canvastext`; the focus ring `highlight`.
- **Right to left.** Columns run from the right, `align: 'end'` columns sit at the left, the sort arrows are not mirrored (up is ascending in both).

## 7. Selection, the bulk-action bar and the keys

### 7.1 Behavior

- **On.** Passing `selectedKeys` and `onSelectionChange` turns selection on: React Aria's `selectionMode="multiple"` with `selectionBehavior="toggle"`, and a first column of `Checkbox slot="selection"`, the header's named `labels.selectAll` and each row's `labels.selectRow(textValue)`. The checkbox column is 3.5rem wide, enough for the 40px hit area and the 10px of room beside a scroll edge that the checkbox rule asks for.
- **Select-all** (ruling 4). The header checkbox selects every row in `items` that is not disabled, and is indeterminate while some are. React Aria's `'all'` is never passed on: `onSelectionChange` receives the keys of the given rows, so "all" means the rows on this page. A selection keeps keys that are no longer in `items` until the app drops them; the docs recipe clears it when the page, the sort or a filter changes.
- **Pressing a row** opens it (ruling 2) and never selects it. Pressing the checkbox toggles the row. Mod+A selects every row, React Aria's key, which cannot be turned off and matches select-all.
- **The bulk-action bar.** While one or more rows are selected, `div.data-table-bar` shows: React Aria's `Toolbar` named `labels.toolbar`, holding the count, `labels.selected(formatCount(n))`, the app's `bulkActions`, and a tertiary Clear selection button. The count is also said by a polite status after `QUIET_MS`, so a run of X presses says the total once. The bar leaves when the selection is empty; focus that was in it goes to the table.
- **Where the bar sits** (ruling 5): stuck to the bottom of the viewport while the table is in view, `position: sticky; inset-block-end` at the page's tab bar reserve (`--app-shell-inset-block-end`) plus 16px, inside DataTable's box, so it rides with the table and never covers the pager under it once the table has scrolled past.
- **Escape.** In the table, React Aria's: it clears a selection first, and only reaches the page's handlers when nothing is selected. In the bar, the same: Escape clears and focus returns to the table.

### 7.2 The keys

The handler is one capture-phase `keydown` listener on DataTable's root (ruling 3). It ignores a key with Ctrl, Alt or Meta held, a key while composing, a key from inside an editable element (an input, a textarea, `contenteditable`) or from inside the bar, and every key while another modal is open (`isAnotherModalOpen`). It matches by `event.key` and falls back to `event.code` (`KeyJ`), so a Persian layout's J is J.

| Key | Does |
| --- | --- |
| Arrow Down, Arrow Up | Move to the next or previous row (React Aria). From the first row, Arrow Up reaches the headers. |
| J, K | The same as Arrow Down and Arrow Up: the handler dispatches the arrow on the focused element, as React Aria does itself between cells. |
| Arrow Right, Arrow Left | Into and between a row's cells, and back to the row (React Aria). |
| Home, End | The first or last row; in a cell, the row's first or last cell (React Aria). |
| Page Up, Page Down | The first or last row (React Aria measures the whole table as one page when the page scrolls; recorded, R4). |
| Enter | On a row with a link, opens it (the handler clicks the row's `Link`, so the router and a modifier both apply). On a sortable header, sorts. |
| Space, X | Toggle the focused row's selection. On a header, Space sorts. |
| Shift + Arrow Down, Arrow Up | Extend the selection (React Aria). |
| Mod + A | Select every row (React Aria). |
| Escape | Clear the selection (React Aria); with none, nothing. |
| Tab | Into and out of the table, one stop; then the bar. |
| Any other single printable key | Nothing: typeahead is stopped (ruling 3). |

## 8. DataTable: the list face

### 8.1 Behavior

- **When.** The list face shows when DataTable's box is narrower than 40rem (ruling 8): a phone, or a table beside an open panel on a small laptop. The table face is `display: none` then, and the other way round.
- **Markup.** React Aria's `GridList` (`div.data-table-list`), named as the table is, with one `GridListSection` per group from `getGroup`, consecutive rows with the same group id together in `items` order, each headed by a `GridListHeader` holding the group's `label` ("Today", "Monday 13 October"), the app's string. The app sorts; the list groups only what is adjacent, so a list sorted by amount shows one group per run, and the docs say to pass `getGroup` only while sorted by date. Without `getGroup` the list is one section with no header.
- **An item.** `GridListItem` with the row's text value, holding the checkbox while selection is on, then the cells by `listSlot`: `title` on the first line at weight 500, `meta` cells after it on a second line in slate separated by the app's own separators (the library adds none), `end` cells at the item's end, figures by the numeral rule. A row with a link opens it through the same stretched `Link` (ruling 2). The current row is marked as in the table face.
- **Selection** is the same `selectedKeys`: a checkbox per item, the same bar; select-all is a `Checkbox` named `labels.selectAll` above the list, since `GridList` has no select-all slot.
- **Totals** show as one line under the list: `labels.total` and the end columns' `total`s, at weight 700.
- **Empty and loading** are the same bodies: the EmptyState in `renderEmptyState`, and skeleton items, two lines each.
- **Keys.** React Aria's GridList, with the same capture handler: J and K move, X and Space select, Enter opens, typeahead stopped.

### 8.2 Look and CSS

- **Group header.** `--text-overline` in slate, `padding: var(--spacing-peer) var(--spacing-inset) var(--spacing-part)`, sticky at `--page-sticky-top` with the surface's fill, so the day stays in view while its rows scroll.
- **Item.** `min-block-size: max(var(--size-target), 3.5rem)` for two lines, `padding: 0.625rem var(--spacing-inset)`, a `--color-divider` rule between items in a group and none at a group's end; hover, selected, current and focus as the table's rows.

## 9. SidePanel

### 9.1 API

```ts
export interface SidePanelProps {
  /** The panel's heading and the landmark's and the sheet's name. */
  title: string;
  isTitleHidden?: boolean;
  description?: ReactNode;
  children: ReactNode;
  /** Actions pinned under the body, such as Save and Delete. */
  footer?: ReactNode;
  /** Controlled from the URL. */
  isOpen: boolean;
  /** The close button, Escape, and the sheet's swipe and outside press. The app writes the URL. */
  onClose: () => void;
  /** @default 'Close' */
  closeLabel?: string;
  className?: string;
  ref?: Ref<HTMLElement>;
}

export interface SidePanelLayoutProps {
  /** The page's content, such as the filter bar, the table and the pager. */
  children: ReactNode;
  /** One SidePanel. */
  panel: ReactNode;
  className?: string;
  ref?: Ref<HTMLDivElement>;
}
```

### 9.2 Behavior

- **Layout.** `SidePanelLayout` is `div.side-panel-layout`, a grid of the content (`minmax(0, 1fr)`) and, while its panel is open, the panel's column. The panel pushes the content narrower and never covers it; the table under it may change to its list face by its own container query, which is why that query is DataTable's box and not the viewport (ruling 8).
- **Wide** (ruling 10). From 1024px of viewport, the open panel is `aside.side-panel`, a `complementary` landmark named by its title (ruling 11), in the layout's second column, `position: sticky` at `--page-sticky-top`, the same header height the table reads, `max-block-size` the viewport less that, its body scrolling inside it. It is in the server's HTML when `isOpen`, so a link to a transaction shows its detail before any script.
- **Narrow.** Under 1024px the aside face is `display: none`, and after hydration (`useHydrated()` true) the panel is 3b's `Sheet`, controlled by `isOpen`, titled `title`, with `footer`, whose every dismissal calls `onClose`. The sheet is modal: a phone has no room beside. The switch reads `matchMedia('(width >= 1024px)')` after hydration, as AppShell closes its drawer, and moves an open panel between the faces when the viewport crosses it, with focus kept on the panel's heading.
- **Focus** (ruling 11). When `isOpen` turns true in the browser, the element that had focus is remembered (usually the row's link) and focus moves to the panel's heading (`tabIndex={-1}`), so a keyboard user lands in the detail they opened. When it turns false, focus returns to the remembered element if it is still in the document, else to the layout's content. The wide face does not trap focus: Tab leaves it, the page is not inert, and nothing is dimmed.
- **Closing.** The close button (`IconButton` ghost, Lucide `X`, `closeLabel`) and Escape inside the panel call `onClose`; the app removes the parameter from the URL, and Back does the same through the app's router. Escape inside the table is the table's (it clears a selection first), so it never closes the panel by surprise.
- **Changing the row.** With the panel open, opening another row changes the URL and the panel's content in place; focus moves to the heading again, since the reader asked for a new detail.

| Key | Does |
| --- | --- |
| Enter on a row | Opens its panel (the table's link); focus moves to the panel's heading. |
| Tab, Shift + Tab | Move through the panel and out of it into the page, on a wide screen; within the sheet on a phone. |
| Escape | In the panel, closes it; focus returns to the row that opened it. |

### 9.3 Look and CSS

- **Wide surface.** The rail's: float fill, the hairline, the stadium corner (`--radius-stadium`, a panel section's 40px step), shadow level 1, `padding: var(--spacing-peer)`, `inline-size: 24rem` (ruling 10), `margin-block-start: var(--spacing-inset)`. It is one object with the rail on the other side of the page: the design document draws the rail and the drawer as one; this is its third use.
- **Header.** The title at `--text-h3`, weight 700, ink, the description under it in slate, the close button at the inline end; the body under them; the footer pinned at the end with a `--color-divider` rule above, as Sheet's footer.
- **Motion.** None on the wide face: the panel is a column of the layout and the content reflows when it comes; a slide would move the table twice. The narrow face is Sheet's slide. Reduced motion as Sheet.
- **Forced colors.** The surface's edge `canvastext`.
- **Right to left.** The panel's column is at the inline end, so on the left on a Persian page.

## 10. Decisions

### 10.1 Rulings taken by the owner

1. **The API's shape.** Recommended: data-driven, `items` and `columns` with a `cell` function per column and `listSlot` for the list face, because the table and the list grouped by day must draw the same rows, totals and skeletons need to know the columns, and the app writes one definition. Alternative: React Aria's compositional shape (`<Column>`, `<Row>`, `<Cell>` as children), more flexible per row, with the list face as a second component the app fills from the same data.
2. **Opening versus selecting a row.** Recommended: a press anywhere on a row opens its detail through a real link in its first cell, stretched over the row, and selection is only the checkbox, X and Space, so a click always does one thing and the row's link works as any link (middle click, a new tab, the context menu). Alternatives: React Aria's default, where a click opens only while nothing is selected and selects once anything is; or React Aria's "replace" mode, where a click selects and Enter or a double click opens, a file manager's model.
3. **J, K, X and typeahead.** Recommended: a capture-phase handler gives J and K the arrows' meaning and X the selection toggle, and stops every other single printable key, so the table has no typeahead: a key always means the same thing, and a payee starting with J is not unreachable by accident. Alternative: stop only J, K and X, keeping React Aria's typeahead for every other letter.
4. **What select-all selects.** Recommended: the rows given, this page, as an array of keys, with `'all'` never passed on; the app may add "Select all 1,240 results" in the bar. Alternative: pass React Aria's `'all'` through, which every bulk action must then resolve.
5. **Where the bulk-action bar sits.** Recommended: stuck to the bottom of the viewport inside the table's box while any row is selected, a float bar with the count, the app's actions and Clear selection, so it is in reach wherever the reader has scrolled to. Alternative: it replaces the page's toolbar above the table (the filter bar's place), which needs no new surface but scrolls away on a long page.
6. **A table wider than its box.** Recommended: never scroll sideways; columns with `hideBelow` leave at 48rem and 40rem of the table's box, cells ellipsize, and under 40rem the list face takes over, so the header stays sticky under the page's header. Alternative: the table scrolls sideways in its own box, and the header sticks inside a box of fixed height that scrolls on its own, a second scroller on the page.
7. **Hover, selected and current rows.** Recommended: the 5% ink wash for hover, 8% plus the checked box for selected, and a 3px ink bar with weight 700 for the row whose detail is open. Alternative: the ink fill with canvas text for selected, Menu's single-choice look, which on many rows draws a block of ink.
8. **When the table becomes a list.** Recommended: a container query on DataTable's own box at 40rem, so the list face also serves a table beside an open panel, and nothing is measured. Alternative: the viewport at 768px, FilterBar's switch, simpler to reason about but a table squeezed by the panel at 1024px then stays a table.
9. **Loading.** Recommended: skeleton rows in the table's shape while there are no rows yet, pulsing over 1.6s and still under reduced motion, with one spoken "Loading"; rows that are already shown stay while the next page loads. Alternatives: still skeletons with no pulse, the calmest; or a Spinner in the body.
10. **The panel's width and breakpoint.** Recommended: beside the content from 1024px of viewport at 24rem, pushing the content, and a bottom sheet under it. Alternatives: beside from 1440px only, keeping tablets and small laptops on the sheet; or a width that is a third of the workspace, which grows with the screen.
11. **The panel's semantics and focus.** Recommended: a `complementary` landmark named by its title, not a dialog; focus moves to its heading when it opens and back to the row when it closes; Escape inside it closes it; the page stays usable around it. Alternative: a non-modal `dialog`, which a screen reader announces as one but which then never leaves its dialog mode while the reader works in the table beside it.
12. **The sort cycle.** Recommended: React Aria's, ascending then descending on each press, with no unsorted state; the app's default order is what an absent URL parameter means. Alternative: a third press returns to the default order, which needs a library state React Aria does not have.

### 10.2 Decided here

1. EmptyState and Skeleton are server parts; Skeleton is `aria-hidden` and the part using it speaks once.
2. EmptyState's text is slate, never taupe; its title the `--text-h4` step.
3. DataTable draws no outer surface; the sticky header's fill is `--data-table-surface`, defaulting to the canvas, and the app sets it for a table in a Card.
4. The sticky offset is the app's header height, set once as `--page-sticky-top` and read by the table's header, the list's day headers and the panel, since the shell's header is the app's content and has no fixed height; no token is added.
5. Rows are `max(--size-target, --size-field)` tall, rules are the divider color, no zebra.
6. `align: 'end'` is the only figure setting: tabular, unbroken, isolated, at the end in either direction.
7. The totals row is a `tfoot` row, weight 700, not sticky, not selectable.
8. Skeleton rows live in React Aria's empty state, so the grid counts none; their widths follow a fixed pattern so the server and the browser draw the same.
9. The checkbox column is 3.5rem; the select-all checkbox is React Aria's slot in the table face and the library's own Checkbox in the list face.
10. Escape in the table is React Aria's (clears a selection); the panel's Escape is the panel's.
11. SidePanel's wide face is the rail's surface with no motion; its narrow face is 3b's Sheet, mounted only after hydration.
12. Column resizing, virtualization, cross-page selection, tree rows and editing in cells are out of scope (section 1).
13. The docs site has no `.data-table`, `.empty-state`, `.skeleton` or `.side-panel` classes to collide with; the plan checks again.
14. One 0.6.0 minor release of core and react; size budgets to start at 1 kB for EmptyState with Skeleton, 4 kB for DataTable and 2 kB for SidePanel, each measured without React Aria and Lucide.

### 10.3 Amendments after the UX audit (owner, 2026-10-16)

A best-practice audit of the built table face and the planned list face and panel, against the WAI-ARIA Authoring Practices, WCAG 2.2, Nielsen Norman Group and the data table guidance of Carbon, Material, Polaris, Primer, Atlassian, Fluent and GOV.UK, found the rulings sound except where the panel meets the list switch. The owner took these amendments; each names the task that builds it.

1. **The rail folds while the panel is open** (amends ruling 10; Task 5). Under 1440px of viewport, an open SidePanel folds AppShell's rail to its collapsed width and gives it back when the panel closes, unless the reader had folded it already; `SidePanelLayout` takes `collapsesRail` (default true) to opt out. A 1280px window then keeps the table face, about 45rem, beside the detail, where otherwise the 24rem panel squeezed the table under 40rem and into the list face.
2. **An error state** (Task 3's fix round). DataTable takes `error?: ReactNode`: with no rows it is the body in place of the empty state (an EmptyState with a Retry action, in the docs); with rows shown, a failed next page, it shows as a line under the table in the status's place, and its text is spoken by the polite status. `error` wins over `isLoading` and `emptyState`.
3. **A "Select" mode on the list face** (Task 4). The list face draws no checkboxes until the reader presses a Select button above the list, which shows them with select-all in the bar; Done hides them again and keeps the selection. The table face is unchanged.
4. **Wrapping long text** (Task 3's fix round). `DataTableColumn` takes `overflow?: 'truncate' | 'wrap'` (default `'truncate'`); `'wrap'` lets the cell's text run to two lines and clamps it there, so a memo-like column can be read without the detail.
5. **Smaller changes the audit found** (Task 3's fix round, the panel's in Task 5): rows and list items keep clear of the sticky header and the bulk-action bar when focus scrolls them (`scroll-margin`, WCAG 2.4.11); a quiet progress cue after `QUIET_MS` while rows already shown reload; `DataTableColumn.firstSortDirection` for the first press on a column (ruling 12's two states are kept); `isHeaderHidden` for an actions column, its name kept for assistive technology; `disabledBehavior: 'selection' | 'all'` so a row can be unselectable and still open; Page Up and Page Down move by the rows that fit in view (risk R4); Left and Right stop at the header row's ends; Shift with a press on a row's checkbox selects the range; SidePanel takes `isDismissable` and an `onCloseRequest` that can refuse a close while the app holds unsaved edits; and the docs advise "Page total" for a paged total, a real minus sign (U+2212), a filtered-empty state with "Clear filters", and set `--page-sticky-top` on the docs site.
6. **The docs page keeps its side column** (Task 3's fix round). The data table page goes back to the docs' usual layout with "On this page"; examples that need room draw the table at a set width inside the example, which scrolls sideways within itself, so the page never does.

## 11. Accessibility

- **Roles and names.** DataTable's table face: React Aria's `grid` named by `aria-label` or `aria-labelledby`, `columnheader`s with `aria-sort` on the sortable ones, `row`s with `aria-selected` while selection is on, the row header's cell a `rowheader`, the current row `aria-current="true"`, the checkboxes named "Select all" and "Select Groceries, 12 October". The list face: a `grid` of the same name with `rowgroup`s named by their day. The bar: a `toolbar` named "Bulk actions". SidePanel: a `complementary` landmark named by its title on a wide screen, a `dialog` titled by it on a phone.
- **Keys.** Sections 7.2 and 9.2 state React Aria 1.22.1's behavior as its source reads, with the library's capture handler marked.
- **Never color alone.** A selected row has its checked box; the current row has its bar and its weight, and `aria-current`; the sorted column has its arrow and `aria-sort`; a disabled row says so to a screen reader through React Aria.
- **Targets (2.5.8).** Rows 40px or more in every density; checkboxes, sortable headers, the bar's buttons and the close button are hit at 40px. A cell's own controls (the app's row menu) are the app's, and the docs give the rule.
- **Announcements.** The sort (React Aria), the selection count (the bar's status after `QUIET_MS`) and "Loading" (the table's status) are polite. React Aria's sort announcement has no Persian string (R5).
- **Axe** passes in light and dark for every state, one test per state: sorted, selected, current, loading, empty, totals, the list face, the bar, the panel open on each face.

## 12. Testing

- **Core (`css.test.js`, `token-only.test.js`, `contrast.test.js`).** Each new file (`empty-state.css`, `skeleton.css`, `data-table.css`, `side-panel.css`) is tokens only, in `@layer components`, imported by `styles.css`, with hover in `@media (hover: hover)`, a forced-colors block and logical properties; the 1024px literal in `side-panel.css` is compared with `--breakpoint-md`. Pairs pinned or measured and recorded: ink and slate on the 5% and 8% washes over canvas and over lifted; slate overline on the header fill; the skeleton fill against canvas and lifted.
- **React (Vitest, jsdom).**
  - EmptyState and Skeleton: markup, heading level, `aria-hidden`, a server render with no client code.
  - DataTable: columns, the row header, `aria-sort` and `onSortChange`'s cycle; a row's link opens through a mocked router, with a modifier passing through; Enter opens; a click never selects; X and Space toggle; J and K move; other letters do nothing; Mod+A and select-all give the rows' keys, never `'all'`; the bar shows the count through `formatCount` and clears; the status says the count once; `currentKey` sets `aria-current`; totals; the empty body; skeleton rows with `aria-busy` and no grid rows; the keys ignore an input in a cell, a modal open elsewhere and a held Ctrl; the `event.code` fallback.
  - The list face: groups from `getGroup` in `items` order, only adjacent rows together; slots; the same selection and keys.
  - SidePanel: the aside in the server's HTML when open; the sheet after hydration under 1024px with a mocked `matchMedia`; focus to the heading on open and back to the opener on close; Escape and the close button call `onClose`; the face moves across the breakpoint with focus kept.
  - Server render and hydration: every part in the server-render, server-components (EmptyState, Skeleton) and hydration suites, with React's `onRecoverableError` failing the test.
- **Storybook.** Each part's states as stories, baselined in the four theme and shape modes and in compact; DataTable at 1280px and 375px for both faces, with a sticky header story that scrolls; right-to-left stories for the table, the list and the panel; play tests for the keys (`no-visual`), with the key handler also run in WebKit and Firefox (`webkit`, `firefox` tags), since it dispatches events. Baselines change only through `pnpm --filter @snapshot-ui/storybook visual:docker`.
- **Docs e2e.** The completeness maps for each new page; 320px with no sideways scroll for the table, the list and the panel; the Transactions recipe: a sort, a page and an open row written to the URL and read back after a reload, Back closing the panel, and the panel's detail in the server's HTML with scripts off; forced colors on a selected and a current row.

## 13. Docs and release

- **Pages:** `empty-state`, `skeleton`, `data-table` and `side-panel`, each with Usage, Props, Accessibility with its Keys table, and Design rules. The data table page carries the Transactions recipe with the Next App Router: the sort, the page and the open transaction read from the search parameters on the server and passed to a client page; `onSortChange` and the row links writing the URL; selection in the page's state, cleared when the rows change; Pagination under the table and FilterBar above it; SidePanelLayout holding the table and the detail; `--page-sticky-top` set from the app's header.
- **Design record:** a section per part in Appendix B of `docs/design-system.md`, written by the plan, with every derived value, its reason and the measured pairs, and a section "Dense data" that answers the document's own gap for the parts that follow.
- **Changesets:** one per part, minor, for `@snapshot-ui/core` and `@snapshot-ui/react`, released together as 0.6.0. `@snapshot-ui/charts`'s `@snapshot-ui/core` peer publishes as `^0.6.0`, and 0.1.2's `^0.5.0` does not admit 0.6, so a patch changeset takes it to 0.1.3, as 3a's and 3b's did.
- **Release note for the consumer:** DataTable takes rows and column definitions, with every cell and string the app's; sort and the open row are controlled from the URL and selection from the page; a row opens through `getRowHref` and the router; set `--page-sticky-top` to the header's height; `getGroup` only while sorted by date; SidePanelLayout around the content and the panel.

## 14. Risks

- **R1. The stretched link.** A row's press reaches the link's `::after` and not React Aria's row, and the checkbox and the app's cell controls must sit above it. React Aria's row press handler could still fire on the same click and toggle selection. Mitigation: the plan's first DataTable task is a spike that proves, in Chromium, WebKit and Firefox, that a press opens and never selects, that Enter through the capture handler opens, and that a cell's Menu and the checkbox work; the fallback is React Aria's `href` on the row with `selectionBehavior` handled in the capture handler, behind the same behavior.
- **R2. Stopping typeahead.** The capture handler depends on React's event order reaching it before React Aria's `useTypeSelect`, as 3b's guards did. Mitigation: the same spike, in three engines.
- **R3. Two faces in the server's HTML.** Every row is drawn twice, as a `<tr>` and a list item, which doubles the HTML of a 50-row page. Mitigation: the plan measures a 50-row and a 200-row page; the fallback is to mount the hidden face only after hydration, with the server drawing the table face.
- **R4. Page Up and Page Down.** React Aria measures a "page" against the whole table when the page itself scrolls, so they jump to the first and last row. Recorded in the Keys table; the alternative, a table that scrolls in its own box, is what ruling 6 rejects.
- **R5. React Aria's strings.** Its sort and selection announcements have no Persian, as 3a's and 3b's records say.
- **R6. A selection the app does not clear.** Keys of rows that left `items` stay selected until the app drops them, so a bulk action could act on a row not on screen. Mitigation: the bar counts only selected keys present in `items`, the docs recipe clears on every change of the rows, and a development warning names stale keys.
- **R7. The narrow panel before hydration.** Under 1024px the aside face is hidden and the sheet mounts only after hydration, so a phone that opens a link to a transaction sees the list until scripts run. Mitigation: recorded; the docs advise the detail page's own route for a phone link that must work without scripts.
- **R8. The sticky offset is the app's.** A wrong `--page-sticky-top` puts the header under or below the page's header. Mitigation: the docs recipe sets it once from AppShell's header, and a story pins it.
