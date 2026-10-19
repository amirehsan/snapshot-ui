# Lists: ReorderList, TreeBuilder, AvatarGroup, MasterDetailList and TransferList: design

Status: approved on 2026-10-20. Written for the owner's review with a recommended answer to each open question of section 19; the owner took every recommendation, all 31, and section 23 records the rulings. Everything else is decided here and listed in section 15. The plan for batch 10a is `docs/plans/2026-10-20-ordering.md`; 10b gets its own plan when 10a has merged.
Parent spec: `docs/specs/2026-10-10-snapshot-ui-design.md`. This document takes the phase 4 rows of the parent spec's catalog, "Lists and data", that are not yet built or taken: ReorderList, SortableList, TreeBuilder, MasterDetailList, TransferList and the AvatarGroup half of "Avatar, AvatarGroup". Repeater, the seventh row, moved to batch 7 ("Settings", `docs/specs/2026-10-19-settings-design.md`, section 6) and is not in this phase. The design authority remains `docs/design-system.md`.
Released before this: `main` is at 0.8.0 (batch 5, "Accounts") as this is written. In flight: batch 6 ("Insights", 0.9.0), batch 7 ("Settings", 0.10.0), the choices batch (0.11.0) and the inputs phase (batches 9a, 9b and 9c, `docs/specs/2026-10-20-inputs-design.md`). This phase takes Repeater's focus and announcement rules and PanelLayout's two faces from batch 7, and the corner helpers every batch since 0.6.1 uses; it takes nothing from batch 9. Section 2 recommends two batches, 10a and 10b, each a minor release.

## Summary for the owner

What this phase adds, in plain words, in the order recommended:

**Batch 10a, "Ordering"** (one minor release of core and react):

- **ReorderList**: a short list a reader puts in order, such as the sections of a home page or the columns of a report. Each row has a grip to drag it and Move up and Move down buttons, and the keyboard moves a row with Alt and the arrow keys or by picking it up and putting it down. Optionally each row has a switch to turn it on or off, and some rows can be locked in place. After every move a screen reader hears where the row went: "Pricing moved to position 2 of 6". This one part covers both of the parent spec's rows, ReorderList and SortableList (section 6 explains why one part is right).
- **TreeBuilder**: a navigation menu built as a tree: items that hold items, up to a depth the app sets (three levels by default). Items move by drag, by a Move menu on each row (Move up, Move down, Move into "Products", Move out of "Products") and by keys. Pressing an item opens the app's own fields for it (a label and a link, say) in an editor beside the tree on a wide screen and under it on a phone.

**Batch 10b, "Choosing"** (one minor release of core and react):

- **AvatarGroup**: a row of overlapping avatars with "+3" for the rest, for "shared with" or "members". It draws no buttons and needs no script of its own.
- **MasterDetailList**: a list of records (profiles, locations, slots) beside the selected record's fields. Add shows "3 of 5", Remove asks first, some records can be locked against removal, and a filter box appears once there are more than 8. On a phone the list is one view and the record another, with Back between them, as the settings page does.
- **TransferList**: choosing several items from a long, searchable, paged list, such as the datasets a report uses: tick items in the "Available" list, see them gather in the "Chosen" list, remove them there, up to a limit ("5 of 5 chosen. Remove one to choose another."). The chosen list can be put in order with ReorderList's moves.

Why: these are the parent spec's phase 4 rows not yet built. No consumer has asked for them yet; the first consumer's next needs may reorder section 2 (owner action 6).

The overlap the owner asked about: ReorderList and SortableList are the same list with different extras, so they become **one part, ReorderList**, with a switch per row by option and locked rows by row. TreeBuilder and TransferList's chosen list use the same move model inside, so a move is announced, focused and refused the same way in all three.

What it does not add: dragging between two lists (TransferList chooses by checkbox), reordering in Repeater, a virtualized list for thousands of rows, an interactive "+3" that opens a list of everyone, multi-row drag, and copying by drag. Section 1 lists where each is deferred, and section 19 asks about each.

## 1. Goal

Finish phase 4 with the five parts it still lists, each held to the bar the later batches set: React Aria's behavior where React Aria has the part, real form submission and reset, the changed, invalid and disabled states the field contract asks for, a server face that is final, right to left, compact density and a coarse pointer, forced colors, the concentric corner rule and the intrinsic size rule of the design record, and the standing rule that focus never falls to the body. Ship them as two minor releases.

The hard parts:

- **Moving is new to the library.** No part yet drags. React Aria's `useDragAndDrop` gives drag by pointer, touch, keyboard and screen reader on `GridList` and `Tree`, with its own announcements, but it does not give buttons, shortcuts, locked rows, depth limits, or the position words after a drop. Section 7 is the one move model the three moving parts share.
- **Focus when a row moves.** React keeps a row's DOM node when its key moves, but it moves the node with `insertBefore`, and a focused node that is moved loses focus in the browsers this library supports (to verify per engine in the spike). Every move therefore puts focus back, by key, after the commit.
- **Escape inside a dialog.** A keyboard drag is cancelled by Escape; a list inside a Dialog must cancel the drag and leave the dialog open. A part stops the Escape it handles and leaves every other Escape alone (React Aria's `GridList` clears its selection on Escape by default, which here would empty a TransferList, so it is turned off).
- **A tree with fields.** A menu item has fields to edit, and fields inside a `treegrid` fight its arrow keys, the reason Repeater refused `GridList` (settings spec, section 6.1). TreeBuilder's editor lives beside the tree, not in it.
- **Two faces, again.** MasterDetailList is PanelLayout's list and page, inside a card and driven by state rather than the address.
- **Long lists from a server.** TransferList's available list is searched and paged by the app, while its chosen list holds items no current page shows.

Build order inside each batch, from the least risk to the most, so the shared rules land first:

1. **10a.** The drag spike and the move model (section 7), then ReorderList (section 8), then TreeBuilder on the same model with React Aria's `Tree` (section 9).
2. **10b.** AvatarGroup (section 10), which is static and small; MasterDetailList (section 11); TransferList (section 12), whose reorderable chosen list uses 10a's ReorderList.

Out of scope, each recorded where it is deferred:

- **Dragging between lists,** from TransferList's available list to its chosen list (open question 30).
- **Reordering in Repeater.** Repeater's rows hold fields, and its tiers sort by amount (settings spec, section 6.6). The move model of section 7 makes Move up and Move down a small later addition (open question 31).
- **Several rows dragged at once.** Every moving part here has no selection; one row moves at a time.
- **Copying or linking by drag** (`dropOperation` other than `move`), and drops of files or text from outside the page.
- **Virtualized lists.** ReorderList and TreeBuilder are for lists a person orders by hand, tens of rows; TransferList pages its long list (risk R9).
- **An interactive overflow in AvatarGroup** (open question 28).
- Number formatting, as everywhere: every position, count and range the library writes is ASCII digits in the app's strings, and the server writes no `Intl` text.

## 2. The batch split

The phase is five parts after the merge of section 6. Two of them move rows and share a spike, a model and a new React Aria feature (drag and drop); three of them choose and show, on parts the library already has. One release would hold about 54 stories and 281 baselines (section 21), more than any batch so far except 9b, and its riskiest work, drag in three engines and on touch, would hold back the three parts that need none. So it is two batches, each a minor release with its own plan.

| Batch | Parts | Package releases | Why together |
| --- | --- | --- | --- |
| **10a, Ordering** | ReorderList (with SortableList's switches and locked rows), TreeBuilder | core and react, minor | Both drag and move by keys and buttons on one model, announce moves the same way, and depend on one spike of React Aria's `useDragAndDrop` on `GridList` and `Tree` |
| **10b, Choosing** | AvatarGroup, MasterDetailList, TransferList | core and react, minor | Lists that show and choose rather than order: GridList with selection, SearchField, Pagination, ConfirmDialog, Avatar, PanelLayout's faces; TransferList's optional reorder reuses 10a |

**Recommended order: 10a, then 10b** (open question 1).

- **10a first.** It carries the phase's largest unknown, drag on touch and in three engines (risk R1), so the spike reports early, and TransferList's reorderable chosen list in 10b builds on it.
- **10b second.** Every part in it rests on tested parts; it can ship without TransferList's `allowsReordering` if 10a slips, adding it in a later minor without changing this spec.
- **Or 10b first,** if the first consumer needs MasterDetailList or TransferList sooner: drop `allowsReordering` from 10b and add it when 10a ships.

**Versions.** The changesets say "minor" and name no number, as every batch does. If nothing else releases between, after the inputs phase (9c is core 0.14.0), 10a is 0.15.0 and 10b 0.16.0. `@snapshot-ui/charts` takes a patch for its core peer with each, as every batch since 3a has done.

**If a batch must shrink.** TreeBuilder is the largest part of 10a and depends only on the move model; it can move to the minor after 10a if its spike (risk R7) finds trouble. AvatarGroup is independent of everything and can ship in any release.

## 3. What it takes from earlier batches

| From an earlier batch | Used here as |
| --- | --- |
| `Avatar` (on `main`, `avatar/`): the 24, 32 and 40px sizes on `--avatar-size`, the two shapes, the bone fill with ink initials, the 1px frame ring, `isDecorative`, the initials shown until hydration | AvatarGroup's items and its "+3" chip (section 10); the avatar at a MasterDetailList row's start and a TransferList row's start |
| `DataTable` (on `main`, `data-table/`): its list face's `GridList` (`ListFace.tsx`), "Dense data" (the 48, 40 and 44px row, the divider rules, the 5% and 8% washes, slate turned granite on a wash, the inset focus ring, the current row's 3px ink bar and 700 label), the polite status outside the busy part, skeleton rows while loading | Every list's rows; MasterDetailList's selected row (the current row's mark); TransferList's loading rows |
| `Repeater` (batch 7, `feat/settings`): focus after an add to the new row's first field and after a remove to the row now in its place, the polite status mounted empty, Add disabled at the maximum with the reason as visible text and its description (ruling 2.3), `value`, `onChange(rows)` and `createRow()` (ruling 2.5), repeated names read with `FormData.getAll` | ReorderList's and TreeBuilder's value and form names; MasterDetailList's Add, its count and its full line; TransferList's chosen list's Remove focus |
| `PanelLayout` (batch 7): two faces in one HTML, picked by a container query on the part's own box; Back on the narrow face; focus to the heading on an opening, back to the row on Back; the 16rem side column | MasterDetailList's faces (section 11.4) |
| `SidePanel` (on `main`): focus to the heading on an opening and back to the opener on a close; its 24rem column | TreeBuilder's editor's focus (section 9.4); the alternative of open question 14 |
| `GridList` as `DataTable`'s list face uses it, with `disallowTypeAhead` off here | ReorderList, MasterDetailList, both of TransferList's lists |
| The field parts: `FieldHead`, `Description`, `FieldError`, `FieldChanged`, `useChangedDescription`, `data-unlabelled` | Every part's label row, hint, error line and Changed chip |
| `Switch` | ReorderList's switch per row |
| `Checkbox` (the box and its check in forced colors) | TransferList's available rows, through `GridList`'s `slot="selection"` checkbox |
| `Button` (secondary, tertiary, danger), `IconButton` (ghost), `Tooltip` | Move up, Move down, the drag handle, Add, Remove, Done, Back; icon-only names as tooltips |
| `Menu`, `MenuItem`, `MenuTrigger` | ReorderList's `moveControls="menu"`; TreeBuilder's row actions |
| `ConfirmDialog`, `useConfirm` | MasterDetailList's Remove; TreeBuilder's Remove of an item with children |
| `SearchField` | MasterDetailList's filter; TransferList's search |
| `Pagination` with the app's `rangeLabel` | TransferList's pager |
| `EmptyState`, `Skeleton` | Empty lists; TransferList's loading rows |
| `Card` and the holder properties, `packages/react/src/stories/corner.ts`, `HOLDER_CORNER`, `CLEAR_OF_FOOT` and the concentric audit (`apps/storybook/tests/concentric`) | Every new story, in three shapes |
| The choices batch's Accordion rule: a folded section opens itself when a field in it fails on submit | MasterDetailList with `keepsDetailsMounted` selects the record whose hidden field failed (section 11.4) |
| The choices batch's TagInput form value: hidden inputs written by the library, with a `reset` listener on the form | Every part's hidden inputs (sections 8.3, 9.3, 12.3) |
| `useControllableState`, `useWarnOnce`, `cx`, `present`, `mergeRefs`, `AccessibleName`, the status host pattern (`QUIET_MS`), focus moved in a frame after the commit (settings spec, section 12) | As everywhere |

React Aria 1.22.1 parts used for the first time: `useDragAndDrop`, `DropIndicator` and `GridList`'s `dragAndDropHooks` (10a); `Tree`, `TreeItem`, `TreeItemContent` and their `dragAndDropHooks` (10a); `GridList`'s `escapeKeyBehavior`, `disabledBehavior` and `GridListItem`'s `allowsArrowNavigation` (10a and 10b). All are client parts; each part draws its server face from the same tree.

## 4. What this phase answers

The parent spec's phase 4 rows, as input:

| Row | Source | React Aria basis | Notes in the parent spec | Here |
| --- | --- | --- | --- | --- |
| ReorderList | `js/order-list.js` | GridList, drag and drop | Up and down buttons plus drag. | 10a, ReorderList |
| SortableList | `js/section-list.js`, `js/section-list-model.js`, `styles/primitives/section-list.css` | GridList, drag and drop | A switch per row. Locked rows. | 10a, folded into ReorderList (section 6) |
| TreeBuilder | `js/menu-builder.js`, `src/shared/menu.js`, `styles/primitives/menu.css` | Tree, drag and drop | Depth limit by prop. An item editor slot. | 10a |
| MasterDetailList | `js/slot-switcher.js`, `styles/primitives/slots.css` | GridList | Add shows "n of N". Remove confirms. Locked items. Filter past 8. | 10b |
| TransferList | `js/dataset-picker.js`, `js/dataset-picker-model.js`, `styles/primitives/dataset.css` | ListBox, SearchField | Search, chosen rows, pager, limit. | 10b, on GridList rather than ListBox (section 12.1) |
| Avatar, AvatarGroup | slot avatars in `slots.css` | none, static | `--radius-pill`: a circle in Rounded. | Avatar shipped; AvatarGroup in 10b |
| Repeater | `js/special-hours.js` | GridList | Rows of app-defined fields, added and removed. | Moved to batch 7, on fieldsets rather than GridList; not here |
| DataTable, EmptyState, StatTile, Skeleton, ProgressBar, Meter, DescriptionList | | | | Shipped; not changed here |

The list the owner gave for this phase (AvatarGroup, ReorderList, SortableList, TreeBuilder, MasterDetailList and TransferList) matches the parent spec's rows not yet built or taken, exactly. Repeater is confirmed as batch 7's.

The source paths are relative to the source app, which `.local/SOURCE.md` locates. That file is gitignored and is not in the worktree this spec was written in, so this spec works from the parent spec's descriptions and the library's own records. Each plan reads the source files before the parts that port them and records every difference from this spec as a correction (risk R11). AvatarGroup, and the drag handle, drop indicator and drag preview, are new and get a recorded derivation in Appendix B of the design record before they are built (parent spec, section 3); every other part here is new to the library too and gets its Appendix B section first, as every batch has done.

The rules for every part, unchanged: `'use client'` as the first line of every file that imports `react-aria-components`, and only on interactive parts; no `Intl` formatting and no `window` at render, and no first-paint measurement; no external request and no injected script; light and dark, all three shapes, right to left (the Persian guide), comfortable and compact density; WCAG 2.2 AA including 2.5.7 and 2.5.8; weights 400, 450, 500 and 700 only; tokens only in `@layer components`, unprefixed kebab-case classes, states as data attributes that also match the native pseudo-class; every size container declares `contain-intrinsic-inline-size: 0`; focus never falls to the body; a part's Escape stops the key it handles; everything exported from the package index, with the CSS in `core/styles.css`; no new tokens without a measured reason.

## 5. Approach

**React Aria where it has the part.** ReorderList is React Aria's `GridList` with `useDragAndDrop`; TreeBuilder is its `Tree` with the same hooks; MasterDetailList and TransferList are `GridList`s with single and multiple selection. Their roles, arrow keys, typeahead, keyboard drag and drag announcements are React Aria's. The library adds what React Aria lacks: move buttons and menus, Alt and arrow shortcuts, locked rows, a depth limit, the position words after every move, focus kept through a move, the switch per row, the editor beside the tree, the two faces, the filter past 8, the limit and its reason, and the form values.

**One move model.** Every move, whether by drag, by a button, by a menu item or by a key, goes through one pure function that takes the order and returns the new order or a refusal (section 7). So a locked row and a depth limit hold for a drag exactly as for a button, and one status line reports every move.

**Rows are the value.** As Repeater's ruling 2.5 settled: each part takes `value` and `onChange` with the app's own row objects, in order, and `defaultValue` uncontrolled. The library reads `id`, `label` and a few flags from each row and keeps the rest of the object as it was given, so a typed row comes back typed.

**Strings in and out of the form.** A plain `<form>` and a server action read hidden inputs: ids in order under `name`, read with `getAll`; for a tree, parent ids under `parentName` beside them (open question 12). Nothing is JSON.

**The server face is the whole part.** None of these parts writes `Intl` text before hydration: positions, counts and ranges are the app's strings or ASCII digits. So the server's HTML is final, and what arrives after hydration is behavior only.

| Part | In the server's HTML | After hydration |
| --- | --- | --- |
| ReorderList | The label, every row with its handle, switch and move buttons (or Move menu button), the locked marks, the hidden inputs, the empty status | Drag, keys, moves, React Aria's drag descriptions |
| TreeBuilder | The label, every row with its level's indent, the expanded rows' children from `defaultExpandedKeys`, each row's actions button, the editor when `defaultEditingKey` is set, Add, the hidden inputs, the empty status | Expand and collapse, drag, keys, the menus |
| AvatarGroup | Everything: the list, the avatars with their initials, the "+3" chip | Each Avatar's image, Avatar's own rule |
| MasterDetailList | Both faces: the list with the selected row marked, the selected record's detail, Add with its count, the filter field when past 8, Back on the narrow face, the empty status | Selection, filtering, Add and Remove, focus between faces |
| TransferList | The legend, the chosen list with its count, the search field, the available rows with their checks, the pager with the app's range label, the hidden inputs, the empty status | Search, choosing, removing, paging, reordering |

**Colors keep their meanings.** Clay is the Changed chip only, beside a label whose order, set or tree differs from the saved one; signal orange appears nowhere, not even as a drop indicator; error is an invalid value only (too few chosen, a tree too deep after the app changes `maxDepth`); success appears nowhere; taupe is disabled text only, never a locked row, an off row, an overflow count or a position. The drop indicator and the drop target are ink.

Rejected along the way:

- **SortableList as a second part.** Section 6.
- **A drag library other than React Aria's** (dnd-kit, Pragmatic drag and drop). React Aria's is already a dependency, is wired into `GridList` and `Tree`, and has keyboard and screen reader drag with localized strings (in every locale but Persian, risk R5); another library would bring a second focus model into the same rows.
- **Drag only.** WCAG 2.5.7 asks for a single-pointer way to do what a drag does; Move buttons or a Move menu are always there.
- **ListBox for TransferList,** the parent spec's basis. A `listbox` option cannot hold a Remove button, and the chosen rows need one; `GridList` with checkboxes is the same choice with room for it, and both lists then share one row (section 12.1).
- **Fields inside TreeBuilder's rows,** as WordPress's menu screen does (to verify its current markup). Text fields in `treegrid` cells fight the arrow keys (section 9.1).
- **A size container for ReorderList.** Its rows wrap their controls under the label with flex alone (section 13).

## 6. ReorderList and SortableList: where they overlap

The owner asked whether these are one part. They are.

| | ReorderList (parent spec) | SortableList (parent spec) | One part |
| --- | --- | --- | --- |
| What it holds | Rows in an order | Rows in an order | Rows in an order |
| How rows move | Up and down buttons plus drag | Drag (the source's keyboard path to verify) | Drag, buttons or a Move menu, Alt and the arrows, React Aria's keyboard drag |
| A switch per row | No | Yes | `hasSwitches` |
| Locked rows | No | Yes | `isLocked` on a row |
| Value | The order | The order and which rows are on | The rows, in order, each with `isEnabled` when `hasSwitches` |
| Basis | GridList, drag and drop | GridList, drag and drop | GridList, `useDragAndDrop` |

**Decided as recommended (open question 2): one part, `ReorderList`.**

- **Everything that is hard is shared.** The move, the refusal, the announcement, focus through a move, the drag look and the keyboard paths are the same code; two parts would be one part twice with two names in the docs.
- **The extras are additive.** A switch is a control in the row; a locked row is a flag the move model reads. Neither changes the other's behavior.
- **SortableList needs the buttons too.** A list that only drags fails WCAG 2.5.7, so SortableList would have grown ReorderList's buttons anyway.
- **The name.** "Sortable" reads as sorting by a key, which DataTable does by column; "reorder" says the reader puts the rows in an order by hand (open question 3). The docs page carries "sortable list" as a search term, and its second section is "Rows that switch on and off", SortableList's case, with the source's section list as its example.

**What else overlaps, and how it is kept apart.**

| Part | Shares with ReorderList | Stays its own because |
| --- | --- | --- |
| TreeBuilder | The move model, the drag look, the announcements, the handle, the Move menu, Alt and the arrows | It nests: `Tree` not `GridList`, a depth limit, indent and outdent, an editor |
| TransferList's chosen list | With `allowsReordering`, it is a ReorderList without switches | Its rows also have Remove, and its value is chosen, not only ordered |
| Repeater (batch 7) | Nothing yet; open question 31 would give it the move model's buttons | Its rows are fieldsets of fields read with Tab, not grid rows |
| MasterDetailList | The row look and its avatar | It selects, it does not order |

The move model lives in `packages/react/src/list/` as internal modules, not exported, except two pure helpers TreeBuilder exports for server actions (section 9.2).

## 7. The move model (10a)

Shared by ReorderList, TreeBuilder and TransferList's chosen list.

### 7.1 Moves and refusals

- **A move** is `{ key, to }`, where `to` is a place: in a list, an index; in a tree, a parent key (or none for the root) and an index among its children. Every way of moving makes one: a drop (`onReorder` for a list, `onMove` for a tree, from React Aria's drop event), a Move button, a Move menu item, an Alt and arrow key.
- **One pure function decides.** `planMove(rows, move, rules)` in `list/moves.ts` (no directive, so tests and server code can import it) returns the new rows or a refusal with its reason: the row is locked, the place is the row's own, the depth would pass `maxDepth`, or the move would put the row inside itself. Drops, buttons, menus and keys all call it, so they cannot disagree.
- **Locked rows hold their places** (decided here, item 6; open question 6). A locked row keeps its index; a move reorders the unlocked rows among the remaining places. Move down on the row just above a locked row swaps it with the next unlocked row, past the locked one; a drag that drops a row anywhere is read as a new order of the unlocked rows, into which the locked rows are put back at their indexes. A header pinned first and a footer pinned last are the common case, and for them "skip" and "cannot cross" are the same; the rule only differs for a locked row in the middle, where skipping keeps every drop valid.
- **In a tree,** a locked item keeps its parent and its index among its siblings, and its children can still move inside it; nothing can be moved into a locked item unless the app says so (`allowsChildren` on the node, section 9.2).
- **Refused moves never happen half way.** A drag over a refused place shows no indicator there (React Aria's `getDropOperation` returns `cancel`); a button or menu item that would be refused is disabled, with its reason in the item's description (a menu) or not drawn (a button at an end, section 7.3); a key that would be refused moves nothing and says why in the status.

### 7.2 Announcements

One status host per part, `div[role="status"][aria-live="polite"]`, mounted empty in the server's HTML, never inside an `aria-busy` subtree (the design record's rule, with Repeater's development warning). It says, after every move by any means, in the frame after the commit:

| After | The status says (English defaults, every string a label) |
| --- | --- |
| A move in a list | "Pricing moved to position 2 of 6." |
| A move in a tree, same parent | "Pricing moved to position 2 of 3 in Products." |
| A move into another item | "Pricing moved into Products, position 3 of 3." |
| A move to the top level | "Pricing moved to the top level, position 2 of 5." |
| A key at an end | "Pricing is already first." / "Pricing is already last." |
| A key that is refused | "Pricing is locked." / "Products can hold items 3 levels deep at most." |
| A switch | Nothing: the switch says its own state. |
| A cancelled drag | Nothing of the library's: React Aria says "Drop canceled." |

- **Alongside React Aria's.** During a keyboard or screen reader drag React Aria speaks its own words: "Started dragging. Press Tab to navigate to a drop target, then press Enter to drop, or press Escape to cancel.", each target as "Insert between Hero and Pricing" or "Drop on Products", and "Drop complete." (React Aria 1.22.1's `en-US` strings, read in its `intl/dnd`). The library's position line follows "Drop complete." because it is written a frame after the drop's commit; whether two polite messages so close are both read is to verify in VoiceOver and NVDA (risk R4, open question 7).
- **After a pointer drag too.** A screen magnifier or screen reader user who drags with a mouse hears where the row went; for everyone else the status is silent text.
- **Persian.** React Aria ships its drag strings in 34 locales and Persian is not one of them (checked in 1.22.1's `private/intl/dnd`), so a Persian page hears React Aria's drag guidance in its fallback language, to verify which. The library's own words, the buttons, the menu, the shortcuts and the position line, are the app's labels and are Persian there (risk R5, open question 8).

### 7.3 Focus through a move

Decided here, item 8; the standing rule that focus never falls to the body.

| After | Focus goes to |
| --- | --- |
| A move by Alt and an arrow | The moved row, or the control in it that had focus |
| A move by Move up or Move down | The same button on the moved row; if that button is now disabled (the row reached an end), the row's other move button |
| A move by the Move menu | The moved row's Move menu button (React Aria returns focus to the trigger, and the trigger moved) |
| A keyboard drag's drop | The dropped row (React Aria focuses the drop target's item, to verify in 1.22.1); the library checks and puts it there if not |
| A pointer drag's drop | Nothing moves; focus stays where it was, unless it was on the dragged row's handle, which then keeps it |
| A cancelled drag | The dragged row's handle (React Aria, to verify) |

- **Why every move puts focus back.** React moves a keyed node with `insertBefore`, which takes focus from a focused node in Chromium and Firefox and may in WebKit (to verify each in the spike). So after each move the part finds the row by its key (`[data-key]`) in a frame after the commit, never in a layout effect (the settings spec's rule, section 12), and focuses the control that had focus, by its slot, or the row.
- **At an end, the button stays drawn and is disabled.** The first row's Move up and the last row's Move down are drawn with `isDisabled`, so the row's layout never shifts; the focus rule above keeps focus off a disabled button. A list of one row draws no move buttons.

### 7.4 Keyboard reordering

Three keyboard paths, each complete on its own:

1. **Alt and the arrows** (open question 5). On a focused row, or on any control inside one, Alt+Arrow Up and Alt+Arrow Down move the row one place, skipping locked rows; in TreeBuilder, Alt+Arrow Right moves the item into the sibling above it, as its last child, and Alt+Arrow Left moves it out of its parent, to just after it, in the drawn direction (mirrored in right to left). A capture-phase `keydown` handler on the collection's root finds the row from the target (`closest('[data-key]')`), calls the move model, and calls `preventDefault()` and `stopPropagation()` for the keys it handles. It ignores the keys during composition and with Control or Meta held.
2. **React Aria's keyboard drag.** Enter on the row's drag handle picks the row up (Enter on the row itself where the row has no action, and Alt+Enter where it has one, React Aria's `dragDescriptionKeyboardAlt`; to verify which applies to a row with a handle in 1.22.1). The arrow keys or Tab move between drop places, each announced; Enter drops; Escape cancels.
3. **The buttons or the Move menu,** reached with the grid's Arrow Right into the row (React Aria's `keyboardNavigationBehavior="arrow"`, the APG grid pattern) and pressed with Enter or Space.

**Escape.** While a keyboard drag is active, the Escape that cancels it is stopped as well as prevented, as LineChart's readout Escape is (design record, LineChart), so a ReorderList in a Dialog cancels the drag and a second Escape closes the dialog. React Aria's drag manager listens for the key itself (to verify where: on the window in the capture phase or on the drop target); if it does not stop it, the part registers a capture listener on its document while `isDragging` is true, after React Aria's, that stops it. Outside a drag no moving part handles Escape: `GridList` has no selection in ReorderList, and React Aria's `Tree` none in TreeBuilder, so Escape passes to whatever holds the part.

### 7.5 Drag and drop, pointer and touch

All through React Aria's `useDragAndDrop`, configured by the part:

- **`getItems`** returns one item per dragged key, typed `text/plain` with the row's label and a private type, `application/x-snapshot-ui-row`, carrying the key, so a drop from another part or another tab is refused by `acceptedDragTypes` (only the private type), and a row dragged out to a text editor drops its label.
- **`onReorder`** (ReorderList, TransferList) and **`onMove`** (TreeBuilder) call the move model; **`getDropOperation`** returns `cancel` for a place the model refuses and `move` otherwise; `getAllowedDropOperations` is `['move']`.
- **The handle.** A `Button slot="drag"` at the row's inline start, Lucide `GripVertical` at 24px in slate, React Aria's name "Drag Pricing" in the locale. It is the only place a pointer drag starts, so text in a row can still be selected and a press on the row's other controls never drags. It carries `touch-action: none`, and nothing else in the row does, so a finger that starts elsewhere scrolls the page.
- **Mouse and pen.** The browser's native drag, started from the handle: a press and a move of a few pixels. While dragging, the dragged row keeps its place and content and draws a 1px dashed `--color-boundary` edge on its row shape (`data-dragging`), so the gap it left reads as a place, and its text stays at full contrast.
- **Touch.** React Aria starts a drag on touch with a long press on the handle (React Aria's `dragDescriptionLongPress`, "Long press to start dragging"), relying on the browser's native touch drag, which iOS Safari and Android Chrome support differently (to verify both on devices; risk R1). The move buttons are always drawn, so a phone never depends on the drag (2.5.7).
- **The drag preview** (`renderDragPreview`). A copy of the row's label, and its avatar when it has one, on the float surface with the hairline, `--radius-control`, `--shadow-float` and `--text-body` at 450 in ink, at most 20rem wide with an ellipsis. A native drag image is a bitmap the browser may draw translucent and clip at its box, so the 1px `--color-frame` edge carries its outline where the shadow is lost (to verify per engine; risk R8). In dark mode the edge is what shows, as for every floating surface.
- **The drop indicator** (`renderDropIndicator`, React Aria's `DropIndicator`). A 2px ink line with `--radius-dot` ends across the row's inline extent, drawn by a `::before` on a 0-height indicator element so no row moves while dragging; in a tree it starts at the target level's indent, so the level reads before the drop. It shows only for an accepted place. It is ink, never signal orange (consent only) or the link color.
- **The drop target** (a tree item a row will go into, `isDropTarget`). The 8% ink wash with the inset 2px ink ring of the focus ring's width: during a keyboard drag focus is on the target, and the ring is where it will land.
- **Auto-scroll.** React Aria scrolls the collection's scrolling ancestor when a drag nears its edge (to verify for a page that scrolls, not the list); the lists here do not scroll in their own box, except TransferList's available pane.
- **Reduced motion.** Rows do not animate into place in any case: a row appears in its new place at once. A transition would need a measured layout (FLIP), which the library does not do before or after the first paint.

## 8. ReorderList (10a)

### 8.1 Anatomy

```
Home page sections                                          Changed
Drag a section, or use the arrows, to change the order.
+--------------------------------------------------------------------+
| (lock)  Header                      Always first          [on ]    |
|--------------------------------------------------------------------|
|  ::     Hero                                       [on ]  (^) (v)  |
|  ::     Features                                   [off]  (^) (v)  |
|  ::     Pricing                                    [on ]  (^) (v)  |
|--------------------------------------------------------------------|
| (lock)  Footer                      Always last           [on ]    |
+--------------------------------------------------------------------+

:: the drag handle   [on ] the switch, with hasSwitches   (^) (v) Move up and Move down
```

The frame drawn above marks the list's extent for the sketch; the list draws only the rules between rows (section 8.8). At a narrow width the switch and the buttons wrap under the label, at the row's inline end.

### 8.2 API

```ts
export interface ReorderListItem {
  /** Stable across moves and saves. */
  id: Key;
  /** The row's name: its text, its typeahead, its handle's name and the words of every announcement. */
  label: string;
  /** A line under the label, in slate. */
  description?: string;
  /** Holds its place: no handle, no move buttons, its switch fixed; other rows move around it. */
  isLocked?: boolean;
  /** On or off, with `hasSwitches`. Ignored without it. @default true */
  isEnabled?: boolean;
}

export interface ReorderListRowRender {
  /** The row's place, from 0, as drawn now. */
  index: number;
  count: number;
  isLocked: boolean;
  isEnabled: boolean;
}

export interface ReorderListLabels {
  /** @default 'Move up' */
  moveUp: string;
  /** @default 'Move down' */
  moveDown: string;
  /** The menu's items, with `moveControls="menu"`. @default 'Move to top' */
  moveToTop: string;
  /** @default 'Move to bottom' */
  moveToBottom: string;
  /** The menu button's name, before the row's label: "Move, Pricing". @default 'Move' */
  moveMenu: string;
  /** The switch's name. @default (label) => `Show ${label}` */
  toggle: (label: string) => string;
  /** Read after a locked row's label, and shown as its mark's tooltip text. @default 'Locked' */
  locked: string;
  /** @default (label, position, count) => `${label} moved to position ${position} of ${count}.` */
  moved: (label: string, position: number, count: number) => string;
  /** @default (label) => `${label} is already first.` */
  atStart: (label: string) => string;
  /** @default (label) => `${label} is already last.` */
  atEnd: (label: string) => string;
  /** A move refused because the row is locked. @default (label) => `${label} is locked.` */
  lockedMove: (label: string) => string;
  /** Drawn in place of the rows when there are none. @default 'Nothing to order yet' */
  empty: string;
}

export type ReorderListBaseProps<T extends ReorderListItem> = Omit<
  HTMLAttributes<HTMLDivElement>,
  'children' | 'onChange' | 'defaultValue' | 'aria-label' | 'aria-labelledby'
> & {
  label?: ReactNode;
  description?: ReactNode;
  errorMessage?: ReactNode;
  /** The rows, in order. Controlled. */
  value?: readonly T[];
  defaultValue?: readonly T[];
  /** Called after every move and every switch, with the rows in their new order. */
  onChange?: (rows: T[]) => void;
  /** Draws a row's content between the handle and the controls. @default the label and the description */
  children?: (row: T, render: ReorderListRowRender) => ReactNode;
  /** A switch per row, writing `isEnabled`. @default false */
  hasSwitches?: boolean;
  /** Move up and Move down buttons, or one Move menu per row. @default 'buttons' */
  moveControls?: 'buttons' | 'menu';
  /** Drag by the handle. Off, the handle is not drawn; buttons and keys still move. @default true */
  allowsDragging?: boolean;
  /** The light signal orange edge is not drawn on a list; the clay Changed chip shows beside the label. */
  isChanged?: boolean;
  /** @default 'Changed' */
  changedLabel?: string;
  /** Nothing moves or switches; the rows stay readable and focusable. */
  isDisabled?: boolean;
  /** One hidden input per row, holding its id, in order. */
  name?: string;
  /** With `hasSwitches`, one hidden input per enabled row, holding its id. */
  enabledName?: string;
  form?: string;
  labels?: Partial<ReorderListLabels>;
  className?: string;
  ref?: Ref<HTMLDivElement>;
};

export type ReorderListProps<T extends ReorderListItem> = ReorderListBaseProps<T> & AccessibleName<'label'>;
```

`value` and `onChange` follow Repeater's ruling: the rows are the app's objects, given back in the new order with `isEnabled` updated, everything else as given. A row with a repeated `id` is warned about once and drawn; moves then act on the first.

### 8.3 Markup and roles

- `div.field.reorder-list` holding the `FieldHead` (a `span` label, since the list is named by `aria-labelledby`, and the Changed chip), the `Description`, then React Aria's `GridList.reorder-list-rows` (`role="grid"`, named by the label, described by the hint and the error line, `selectionMode="none"`, `keyboardNavigationBehavior="arrow"`, `dragAndDropHooks` from section 7.5), then the `FieldError`, the hidden inputs, and `div.reorder-list-status[role="status"]`.
- Each row is `GridListItem.reorder-list-row` (`role="row"`, `textValue` the label, `allowsArrowNavigation`, `data-key`, `data-locked`, `data-enabled`, `data-dragging` while dragged) holding one `gridcell` with: the handle `Button.reorder-list-handle` (`slot="drag"`), or for a locked row `span.reorder-list-lock` (Lucide `Lock`, 20px, slate, `aria-hidden`) in its place; `div.reorder-list-content` (the app's content, or `span.reorder-list-label` and `span.reorder-list-description`), with a visually hidden ", Locked" after a locked row's label; the library's `Switch.reorder-list-switch` with `aria-label={labels.toggle(label)}`; and `div.reorder-list-moves` with two ghost `IconButton`s, Lucide `ChevronUp` and `ChevronDown`, named `labels.moveUp` and `labels.moveDown` with a visually hidden ", Pricing" after (Repeater's Remove names), or one `MenuTrigger` with an `IconButton` (Lucide `ArrowUpDown`) named "Move, Pricing" opening a `Menu` of Move to top, Move up, Move down and Move to bottom.
- **The empty list** draws `p.reorder-list-empty`, `labels.empty`, in slate in place of the grid's rows, through `GridList`'s `renderEmptyState`, so the grid keeps its name and role.
- **Hidden inputs.** One `input[type="hidden"]` per row under `name`, holding its id as a string, in the drawn order; with `hasSwitches` and `enabledName`, one per enabled row under `enabledName`. A `reset` listener on the form puts back the first render's rows, as TagInput's does. `FormData.getAll(name)` is the order.

### 8.4 Behavior

- **Moves** go through the move model (section 7): a drop, a button, a menu item, Alt and an arrow. A disabled list moves nothing and draws its handles and move buttons disabled; its switches are disabled too.
- **Switches** write `isEnabled` on the row through `onChange`. A locked row's switch is drawn and disabled, so a pinned row's state can still be seen ("Header, on"); an app that wants a locked row switchable leaves `isLocked` off and refuses the move itself, which the docs show.
- **An off row is not a disabled row.** It keeps its ink label, its handle and its move buttons; only its switch says it is off. Taupe is for disabled text, and an off row can still be ordered.
- **Changed** is the app's: it compares the rows to the saved ones and passes `isChanged`, which draws the Changed chip beside the label (a list has no frame for an edge).
- **Invalid** is the app's too, through `errorMessage` (for example, "Turn on at least one section"): the error line under the list, named in the grid's `aria-describedby`; the Changed chip steps aside while it shows (invalid outranks changed).

### 8.5 Keys

| Key | Does |
| --- | --- |
| Tab, Shift+Tab | Into the list on the last focused row (one stop, React Aria's grid), and out. |
| Arrow Up, Arrow Down | The previous or next row. From a control in a row, the same control's row above or below (`allowsArrowNavigation`). |
| Home, End | The first or the last row. |
| Page Up, Page Down | React Aria's page of rows. |
| Arrow Right, Arrow Left | Into the row's controls in the drawn direction: the handle, the switch, Move up, Move down; and back to the row. |
| Characters | Typeahead to a row by its label (React Aria). |
| Alt+Arrow Up, Alt+Arrow Down | Move the row one place, skipping locked rows; focus stays on what had it (section 7.3). At an end, or on a locked row, nothing moves and the status says why. |
| Enter on the handle | Picks the row up (React Aria's keyboard drag). |
| While dragging: Arrow Up, Arrow Down, Tab | Between drop places, each announced. |
| While dragging: Enter | Drops. |
| While dragging: Escape | Cancels, stopped (section 7.4). |
| Space on the switch | Turns the row on or off. |
| Enter or Space on Move up or Move down | Moves the row; focus as section 7.3. |
| Enter, Space or Arrow Down on the Move menu button | Opens the menu (React Aria's); its items move the row and close it. |

### 8.6 Screen readers and announcements

- The grid is named by the label and described by the hint; a row reads its label and description, ", Locked" for a locked row, and React Aria's row position where the reader reports it (to verify `aria-rowindex` in VoiceOver and NVDA). The handle reads "Drag Pricing, button" and React Aria's description, "Press Enter to start dragging." The switch reads "Show Pricing, switch, on". The buttons read "Move up, Pricing, button".
- Moves are announced as section 7.2. A reader who never drags hears a position after each button press or shortcut, which is how a sighted reader sees it.
- The hint the app writes is the place to teach the shortcut: the docs' examples write "Drag a section, use the arrows, or press Alt with Arrow Up or Down", since a shortcut nobody is told about is not a path.

### 8.7 Drag and drop

Section 7.5 entire. One list only: `acceptedDragTypes` is the private type, and `shouldAcceptItemDrop` refuses a drop from another list's rows (checked by the drag's source collection, to verify how React Aria exposes it; the private type carries the list's id as a fallback). `onReorder` reads `keys` (one key) and `target` (`before` or `after` a row) into a move.

### 8.8 Look and CSS

- **The list** draws no frame and no surface of its own: rows on whatever holds it, a 1px `--color-divider` rule under each row but the last, Dense data's rule (no zebra, no rule above the first).
- **A row** is `min-block-size: max(var(--size-target), var(--size-field))`, 48px, 40px compact and 44px compact on a coarse pointer, padded the inset step, 16px, at its inline ends and Dense data's block padding, a flex row with `gap: var(--spacing-part)`, `align-items: center`, `flex-wrap: wrap`. The handle and the lock are `flex: none`; the content is `flex: 1 1 10rem; min-inline-size: 0`; the switch and the move buttons are a `flex: none` group with `margin-inline-start: auto`, so below about 10rem of content they wrap under it, at the inline end, with no container query (section 13).
- **Text.** The label `--text-body` at 450 in ink, wrapping (a row is a setting, not a cell, so it is not ellipsized); the description `--text-small` at 450 in slate. A locked row's label is ink too, and its lock glyph slate.
- **States.** Hover on a row (where hover exists) is the 5% ink wash on the row's shape; a focused row the inset 2px ring in the focus ring token (Dense data's rule); slate inside a hovered row turns granite. A row with focus inside (a control focused) draws no row ring; the control has its own.
- **The row's shape** is `--list-row-radius`, set by section 13's shared rule: the holder formula with the micro floor inside a holder (7px, 6px, 0 in a card), `--radius-control` outside one. The wash and the ring follow it.
- **The handle** is a 40px hit area (a ghost IconButton's box) around the 24px glyph, `cursor: grab`, and `grabbing` while dragging: a recorded deviation from "one cursor rule", since a grab cursor tells a pointer user the handle drags rather than presses (open question 9). Disabled, `not-allowed` and the glyph in taupe.
- **Move buttons** are ghost IconButtons at `--size-control`, 40px, 36px compact with 40px hit areas, a part step apart; disabled at an end in the IconButton's disabled look.
- **The empty line** `--text-body` in slate, padded as a row.
- **Weights.** 450 for the label and the description, 700 for the field label: no 600.
- **The drag look** is section 7.5's: the dashed `--color-boundary` edge on the dragged row, the float preview, the 2px ink indicator.
- **Contrast.** Ink, slate and granite on canvas, lifted and the washes are Dense data's, gated already. The divider is a cue, recorded at 1.23 and 1.28 over canvas. The dashed boundary edge is the boundary color, 3:1 against canvas and lifted in both themes as the field edges measure (to cite the gate). The drop indicator is ink, gated as a graphic. Nothing new to gate.

### 8.9 Forced colors, right to left, density and pointer

- **Forced colors.** Rules are `CanvasText` borders; the dragged row's dashed edge `CanvasText`; the drop indicator `Highlight` under `forced-color-adjust: none` on the indicator only; the drop target's ring `Highlight`; the focus ring the system's; the lock glyph and the handle's glyph `CanvasText` (`currentColor`), disabled ones `GrayText`.
- **Right to left.** Logical properties: the handle at the right, the buttons at the left; Up and Down chevrons do not mirror; Alt+Arrow Up and Down are the same keys; Arrow Right and Left into the row follow the drawn order (React Aria's grid). A Persian story orders sections named in Persian, with the drag strings' fallback recorded as found (risk R5).
- **Compact density.** Rows 40px, buttons 36px drawn with 40px hit areas, the switch Switch's compact size; padding stays the inset step.
- **Coarse pointer.** Rows 44px in compact, every target 44px in compact; the handle's hit area 44px; the handle is always drawn, never only on hover.

### 8.10 Corners

The rows take the holder formula with the micro floor in a holder, so in a Card every row's wash and ring is 7px in Rounded (19px compact), 6px in Soft and 0 in Square, one value for every row, since a row's corner lies within the card's curve when it starts or ends the card. The handle, the switch and the move buttons are controls: when the list starts a card with no label above it, or ends a card, its first or last row's block padding grows by the corner inset less the card's padding (7px, 19px compact, 0 in Soft and Square), the existing row "Card, the list's first or last row's controls, down" of the record's table, reached through `:is(.card, .card > .card-body:last-child, .card > .card-disclosure > .card-fold > .card-body:last-child) > .reorder-list:last-child .reorder-list-row:last-child` and its first-child twin. The Move menu is a popover and starts its own ladder. The drag preview is a floating surface and starts its own (`--radius-control`, not stepped).

### 8.11 Server rendering

A client part. On the server and through hydration it renders every row with its handle (disabled until hydration, so a native drag cannot start on a page with no script to receive it), its lock, its content, its switch and its move buttons or menu button, the empty line, the hidden inputs and the empty status; no text comes from `Intl`. React Aria's drag descriptions are attached after hydration (to verify that `useDragAndDrop` renders no description text on the server). It joins `server-render.test.tsx`, `server-face.test.tsx` (three locales, two zones) and `hydration.test.tsx` with a mocked iPhone.

### 8.12 How others do it

| System | Part | Moves by | Keyboard | Announced | What this spec takes |
| --- | --- | --- | --- | --- | --- |
| React Spectrum | `ListView` with `useDragAndDrop` | A drag handle; no buttons (to verify) | Enter on the handle, arrows between drop places, Enter, Escape | React Aria's strings | The basis: the handle, keyboard drag, the strings |
| Atlassian | Pragmatic drag and drop's list guidance (to verify the current page) | Drag, plus a "Move" menu: Move to top, Move up, Move down, Move to bottom | Through the menu; no drag by keyboard | A live region after each move (to verify the words) | The Move menu and its four items; the position after a move |
| Salesforce Lightning | Dual listbox's selected list (to verify) | Up and Down buttons beside the list | Arrow keys select; buttons move | The listbox's state | Up and down as buttons |
| Material Design 3 | Lists with a drag handle icon in the guidelines; no reorder component in Material Web (to verify) | Drag | Not specified (to verify) | Not specified | The handle at the start |
| Polaris | No reorder part; the admin reorders product media by drag (to verify a keyboard path) | Drag | Not observed | Not observed | Nothing beyond the handle |
| GOV.UK, MOJ | No reorder part (to verify MOJ's backlog) | | | | The reason to keep buttons: plain controls first |
| Apple | `UITableView`'s reorder control in edit mode; `onMove` in SwiftUI `List` | A grip at the trailing edge (to verify per platform) | Full Keyboard Access moves by an actions menu (to verify) | VoiceOver's "Move up" and "Move down" custom actions | Move up and Move down as named actions |
| react-beautiful-dnd (Atlassian, archived) | Its announcements | Drag; Space to lift, arrows to move | Space, arrows, Space, Escape | "You have moved the item from position 1 to position 2" (to verify) | Positions as numbers in the words |

## 9. TreeBuilder (10a)

### 9.1 Basis

React Aria's `Tree` (`role="treegrid"`) with `useDragAndDrop` and its tree drop target delegate (`TreeDropTargetDelegate`, which reads the pointer's inline position for the level, to verify), driven by the move model's tree form. The editor is outside the tree, because:

- A `treegrid` row's arrow keys move, expand and collapse; a text field in a row would need an edit mode to keep its caret, as the grid pattern asks and Repeater refused (settings spec, section 6.1).
- A menu item's fields (a label, a link, a "new tab" switch) are a small form, read and filled with Tab in a region of their own.

### 9.2 API

```ts
export interface TreeBuilderNode {
  id: Key;
  label: string;
  /** A line under the label, in slate: the link, say. */
  description?: string;
  /** Keeps its parent and its place among its siblings; its children can still move inside it. */
  isLocked?: boolean;
  /** Whether rows can be moved into it. @default true, false for a locked node */
  allowsChildren?: boolean;
  children?: readonly TreeBuilderNode[];
}

export interface TreeBuilderNodeRender {
  /** From 1. */
  level: number;
  /** The node's place among its siblings, from 0. */
  index: number;
  siblingCount: number;
  hasChildren: boolean;
  isExpanded: boolean;
  isEditing: boolean;
}

export interface TreeBuilderEditorRender<T> {
  level: number;
  parent: T | null;
  /** Writes the node back into the value: its label and fields as the editor changes them. */
  update: (node: T) => void;
  /** Closes the editor; focus goes back to the node's row. */
  close: () => void;
  /** Removes the node, asking first if it has children. */
  remove: () => void;
}

export interface TreeBuilderLabels {
  /** The row's actions button: "Actions, Pricing". @default 'Actions' */
  actions: string;
  /** @default 'Edit' */
  edit: string;
  moveUp: string;
  moveDown: string;
  /** @default (parent) => `Move into ${parent}` */
  moveInto: (parent: string) => string;
  /** @default (parent) => `Move out of ${parent}` */
  moveOut: (parent: string) => string;
  /** A refused Move into, as its description. @default (max) => `${max} levels at most` */
  depthLimit: (max: number) => string;
  /** @default 'Remove' */
  remove: string;
  /** @default 'Add item' */
  add: string;
  /** The editor's heading. @default (label) => `Edit ${label}` */
  editorTitle: (label: string) => string;
  /** @default 'Done' */
  done: string;
  /** ConfirmDialog's words for a node with children. */
  removeTitle: (label: string) => string;
  removeBody: (label: string, count: number) => string;
  removeConfirm: string;
  moved: (move: { label: string; parent: string | null; position: number; count: number }) => string;
  added: (label: string) => string;
  removed: (label: string, count: number) => string;
  atStart: (label: string) => string;
  atEnd: (label: string) => string;
  tooDeep: (label: string, max: number) => string;
  lockedMove: (label: string) => string;
  locked: string;
  /** Add's description with `maxNodes`. @default (count, max) => `${count} of ${max}` */
  count: (count: number, max: number) => string;
  /** After a disabled Add at `maxNodes`. @default (max) => `${max} of ${max}. Remove one to add another.` */
  full: (max: number) => string;
  /** @default 'No items yet' */
  empty: string;
}

export type TreeBuilderBaseProps<T extends TreeBuilderNode> = {
  label?: ReactNode;
  description?: ReactNode;
  errorMessage?: ReactNode;
  value?: readonly T[];
  defaultValue?: readonly T[];
  onChange?: (nodes: T[]) => void;
  /** A row's content beside its chevron and handle. @default the label and the description */
  children?: (node: T, render: TreeBuilderNodeRender) => ReactNode;
  /** The item editor slot: the app's fields for one node. No editor, no Edit. */
  editor?: (node: T, render: TreeBuilderEditorRender<T>) => ReactNode;
  editingKey?: Key | null;
  defaultEditingKey?: Key | null;
  onEditingChange?: (key: Key | null) => void;
  /** React Aria's expansion. */
  expandedKeys?: Iterable<Key>;
  defaultExpandedKeys?: Iterable<Key>;
  onExpandedChange?: (keys: Set<Key>) => void;
  /** The deepest level a node may sit at; 1 is a flat list. @default 3 */
  maxDepth?: number;
  /** Makes a node for Add, at the end of the top level, opened in the editor. No function, no Add. */
  createNode?: () => T;
  /** Nodes Add stops at, counted at every level. */
  maxNodes?: number;
  /** The editor's heading level. @default 3 */
  headingLevel?: 2 | 3 | 4;
  isChanged?: boolean;
  changedLabel?: string;
  isDisabled?: boolean;
  /** One hidden input per node, its id, depth first. */
  name?: string;
  /** One hidden input per node beside `name`, its parent's id or '' at the top level. */
  parentName?: string;
  form?: string;
  labels?: Partial<TreeBuilderLabels>;
  className?: string;
  ref?: Ref<HTMLDivElement>;
};

export type TreeBuilderProps<T extends TreeBuilderNode> = TreeBuilderBaseProps<T> & AccessibleName<'label'>;

/** What `buildTree` returns: the posted tree, ids only. */
export interface BuiltTreeNode {
  id: string;
  children: BuiltTreeNode[];
}

/** Pure, in `tree-builder/tree.ts` with no directive, for server actions. Throws on a bad post. */
export function buildTree(ids: readonly string[], parentIds: readonly string[]): BuiltTreeNode[];
export function flattenTree<T extends TreeBuilderNode>(nodes: readonly T[]): { id: string; parentId: string }[];
```

A server action reads `formData.getAll('menu')` and `formData.getAll('menuParent')` and calls `buildTree`, which refuses a parent that comes after its child or does not exist (a value posted by anything, not only this part).

### 9.3 Markup and roles

- `div.field.tree-builder`, a size container named `tree-builder`, holding the `FieldHead`, the `Description`, then `div.tree-builder-body` (the tree and the editor), then Add, the `FieldError`, the hidden inputs and `div.tree-builder-status[role="status"]`.
- **The tree** is React Aria's `Tree.tree-builder-tree` (`role="treegrid"`, named by the label, `selectionMode="none"`, `onAction` opening the editor when there is one), of `TreeItem.tree-builder-row`s (`role="row"`, `aria-level`, `aria-expanded` on a parent, `aria-posinset` and `aria-setsize` by React Aria, `data-key`, `data-locked`) each holding `TreeItemContent` with: the chevron `Button.tree-builder-chevron` (`slot="chevron"`, Lucide `ChevronRight`, turned a quarter when expanded, mirrored in right to left, not drawn for a leaf but its space kept so labels line up), the handle (`slot="drag"`) or the lock, the content, and the actions `MenuTrigger` with a ghost `IconButton` (Lucide `Ellipsis`) named "Actions, Pricing" opening a `Menu`: Edit, Move up, Move down, Move into "Features", Move out of "Products", a separator, Remove.
- **The editor** is `section.tree-builder-editor` (`aria-labelledby` its heading) after the tree in the DOM: a heading at `headingLevel` (`labels.editorTitle(label)`, focusable with `tabIndex={-1}`, never a tab stop), the app's `editor` render, and a footer with Done (a secondary Button). It is drawn only while a node is being edited.
- **Hidden inputs** under `name` and `parentName`, in depth-first order, with a reset listener as section 8.3.

### 9.4 Behavior

- **Moves** go through the move model's tree form: a drop before or after a row (at the level the indicator shows) or onto a row, a menu item, Alt and an arrow. A move is refused if the moved subtree's deepest node would pass `maxDepth`, into a node with `allowsChildren` false, into its own subtree, or of a locked node. A refused menu item is disabled with its reason as its description ("3 levels at most").
- **Moving into a collapsed node** expands it, so the moved row stays visible and focus can stay on it.
- **The editor.** Edit (or Enter on a row, React Aria's `onAction`) sets the editing key and, in the frame after the commit, focuses the editor's heading, as SidePanel focuses its title. Done, or Escape inside the editor, closes it and focuses the node's row. Escape inside the editor is stopped once it closes the editor; an Escape inside a popup within the editor (a Select's list) is that popup's, which stops it first. Pressing Edit on another row while one is open swaps the editor and moves focus to its heading. Editing writes back through `update(node)`, so the row's label changes as the reader types.
- **Add** (with `createNode`) appends the new node at the end of the top level, opens its editor and focuses the editor's heading, and the status says "New item added". At `maxNodes`, Add is disabled with `labels.full` after it, Repeater's ruling 2.3.
- **Remove** (from the menu or the editor's `remove`) asks with ConfirmDialog when the node has children ("Remove Products and its 3 items?"), never for a leaf, since the tree is unsaved until the SaveBar saves it and Cancel brings it back (open question 15). After a removal focus goes to the next sibling's row, else the previous sibling's, else the parent's, else Add, else the tree's empty line's container (the tree, `tabIndex={-1}`); the status says "Pricing removed" or "Products and 3 items removed". If the removed node was being edited, the editor closes.
- **Expansion** is React Aria's; `defaultExpandedKeys` defaults to every node with children, so a menu opens whole.
- **Changed and invalid** as ReorderList's (section 8.4). A value deeper than `maxDepth` (the app lowered it) is drawn as it is, every move into a too-deep place refused, and the docs show the app's error for it.

### 9.5 Keys

| Key | Does |
| --- | --- |
| Tab, Shift+Tab | Into the tree (one stop), then the editor when open, then Add, out. |
| Arrow Up, Arrow Down | The previous or next visible row (React Aria). |
| Arrow Right | Expands a collapsed parent; on an expanded one, to its first child; from a row, into its controls once expanded or on a leaf (React Aria's treegrid, to verify the order of these in 1.22.1). Mirrored in right to left. |
| Arrow Left | Collapses an expanded parent; on a child, to its parent. Mirrored. |
| Home, End | The first or the last visible row. |
| Characters | Typeahead by label. |
| Enter | Opens the editor (`onAction`); with no editor, nothing. |
| Alt+Arrow Up, Alt+Arrow Down | Moves the item among its siblings, skipping locked ones; at an end, nothing moves and the status says so. |
| Alt+Arrow Right | Moves the item into the sibling above it, as its last child, expanding that sibling (open question 16). Mirrored. |
| Alt+Arrow Left | Moves the item out of its parent, to just after it. Mirrored. |
| Enter on the handle | React Aria's keyboard drag (Alt+Enter on the row, since the row has an action; to verify). |
| While dragging: arrows, Tab | Between drop places: before, after, and onto ("Drop on Products"). |
| While dragging: Enter, Escape | Drop; cancel, stopped. |
| In the editor: Escape | Closes the editor, focus to the row; stopped. |

### 9.6 Screen readers and announcements

A row reads "Pricing, level 2, 2 of 3" from React Aria's `aria-level`, `aria-posinset` and `aria-setsize` (to verify the wording in VoiceOver, NVDA and TalkBack), "expanded" or "collapsed" for a parent, and ", Locked" after a locked label. Moves are announced as section 7.2, with the parent's name and the level implied by it. The editor's heading is read on opening, as SidePanel's is; Done and Escape return to the row, which is read again with its new label if it changed.

### 9.7 Drag and drop

Section 7.5, with `onMove` for every drop: React Aria's event carries the target (`before`, `after` or `on` an item); the delegate maps the pointer's inline position to a level at a row's end (to verify that 1.22.1's `TreeDropTargetDelegate` lets a drop after the last child of a parent land at the parent's level by moving left). The indicator starts at the target level's indent; a drop onto a row draws section 7.5's drop target. Hovering a collapsed parent during a drag expands it after 800ms (React Aria's `onDropActivate`, to verify the delay), so a row can be dropped among its children.

### 9.8 Look and CSS

- **Rows** are ReorderList's rows (section 8.8), the chevron's 40px hit area before the handle, the content indented by `calc((var(--tree-level) - 1) * var(--spacing-peer))`, 24px a level, from `aria-level` written as `--tree-level` by the part (a style attribute with a number, not a measured value). No guide lines: the document's rhythm comes "from tone and whitespace, not lines".
- **The editor** is a nested card (`.card` inside the card around the part, the record's "a card in a card is concentric with it"), not a new surface, with its heading at the h4 step at 700, the app's fields a peer step apart, and Done at its foot. Outside a card it is a Card.
- **The body.** From 48rem of the part's own box, `div.tree-builder-body` is a grid of the tree and the editor, `minmax(0, 1fr) minmax(0, 22rem)`, a peer step apart, the editor sticky at `--page-sticky-top` while the tree scrolls past it; under 48rem one column, the editor under the tree. The tree takes the whole width while no editor is open.
- **Add** is a secondary Button with a Plus icon, a peer step under the tree, with its count when `maxNodes` is set ("7 of 20"), Repeater's.
- **Weights.** Row labels 450, the editor heading 700, the field label 700, Done 500 (the Button's): no 600.

### 9.9 Forced colors, right to left, density and pointer

ReorderList's (section 8.9), and: the chevron mirrors in right to left and indentation is `padding-inline-start`, so levels step in from the right; the editor's frame is `CanvasText`. Compact rows 40px; the indent stays a peer step a level, since the levels must read; at 320px three levels take 48px of indent and the row's controls wrap under its label.

### 9.10 Corners

The rows take the holder formula with the micro floor, as ReorderList's. The nested editor card is concentric with the card around it (7px, 6px, 0 in Rounded, Soft and Square, the record's "Card, a card or tile in it"); its Done moves down by its own corner inset when it is the card's last control (the record's rule for a control at a card's foot). Add at the tree's foot, when it ends a card, moves down by the corner inset, as Repeater's Add does. The menus are popovers with their own ladders.

### 9.11 Server rendering

A client part, rendering every row React Aria's `Tree` draws for the server's expanded keys, the chevrons, handles (disabled until hydration), action buttons, the editor for `defaultEditingKey`, Add with its count, the hidden inputs and the empty status. The collapsed rows' children are not in the DOM (React Aria's), and their hidden inputs are, since the form value is the whole tree. No `Intl` text.

### 9.12 How others do it

| System | Part | Nesting | Keyboard and single-pointer path | Editor | What this spec takes |
| --- | --- | --- | --- | --- | --- |
| WordPress | The menus screen (classic) | Drag right to nest, depth by setting (to verify) | Each item's "Move" links: Up one, Down one, Under the item above, Out from under its parent, To the top (to verify the words) | Inline under the item, expanded in place | Move into and Move out of, named after the item; the editor per item |
| Shopify admin | Navigation menus (to verify) | Drag to nest, three levels (to verify) | Not observed | A panel per item | The three-level default |
| Atlassian Confluence | The page tree, on Pragmatic drag and drop (to verify) | Drag before, after or onto | A "Move" dialog choosing a parent and a place (to verify) | The page itself | Onto as nesting; a menu as the single-pointer path |
| React Spectrum | `TreeView` with drag and drop (to verify its status in 1.22.1) | Before, after, onto | React Aria's keyboard drag | None | The basis |
| Notion | The sidebar (to verify) | Drag before, after, onto | Not observed by keyboard | The page | Onto as nesting |
| Webflow | The navigator (to verify) | Drag with an indent preview | Not observed | A settings panel | The indicator at the target level's indent |

## 10. AvatarGroup (10b)

### 10.1 Anatomy

```
  (AL)(GH)(KJ)(MJ)(+3)       "Shared with": seven people, four drawn and three in the chip

  Each ( ) overlaps the next by a quarter of its width; the first sits on top.
```

Each avatar overlaps the next by a quarter of its size and is cut from it by a 2px ring of the surface behind; the first is on top.

### 10.2 API

```ts
export interface AvatarGroupItem {
  id: Key;
  name: string;
  src?: string;
  initials?: string;
  shape?: 'circle' | 'square';
}

export interface AvatarGroupLabels {
  /** The overflow chip's name. @default (count, names) => `${count} more: ${names.join(', ')}` */
  more: (count: number, names: readonly string[]) => string;
}

export interface AvatarGroupBaseProps extends Omit<HTMLAttributes<HTMLUListElement>, 'children'> {
  items: readonly AvatarGroupItem[];
  /** Avatars drawn before "+N". A single hidden avatar is drawn instead of "+1". @default 4 */
  max?: number;
  /** Avatar's sizes. @default 'md' */
  size?: 'sm' | 'md' | 'lg';
  labels?: Partial<AvatarGroupLabels>;
  ref?: Ref<HTMLUListElement>;
}

/** The list needs a name, "Shared with", by `aria-label` or `aria-labelledby`, as IconButton takes them. */
export type AvatarGroupProps = AvatarGroupBaseProps &
  ({ 'aria-label': string; 'aria-labelledby'?: never } | { 'aria-labelledby': string; 'aria-label'?: never });
```

### 10.3 Markup and roles

`ul.avatar-group[role="list"]` (the role restated, since Safari drops a list's role when its markers are removed) named by the app, `data-size`; `li.avatar-group-item` per drawn avatar, holding the library's `Avatar` (`role="img"` named by the person's name, not decorative, since nothing beside it names them); then, with an overflow, `li.avatar-group-item` holding `span.avatar.avatar-group-more` (`role="img"`, named `labels.more(count, names)`), its visible text "+3" `aria-hidden`.

### 10.4 Behavior

- **The count.** With `items.length > max + 1`, the first `max` are drawn and "+N" stands for the rest; with `max + 1` or fewer, all are drawn, since "+1" would take the space of the avatar it hides (open question 29). `max` below 1 is read as 1 with a warning.
- **Names.** Every person is named once to assistive technology: the drawn ones by their avatars, the hidden ones in the chip's name, joined with ", " by the default label, which the app replaces for its language (a list in words needs `Intl.ListFormat`, which the server face does not use).
- **Static.** No press, no focus, no tooltip: a tooltip needs a focusable trigger, and an app that opens a list of everyone wraps the group in its own Button or Link (the docs show it), so the group stays a server part (open question 28).

### 10.5 Keys and screen readers

No keys: nothing in the group is focusable. A screen reader reads "Shared with, list, 5 items, Ada Lovelace, image, Grace Hopper, image, ... 3 more: Katherine Johnson, Mary Jackson and Dorothy Vaughan, image" (to verify the list and image wording in VoiceOver and NVDA).

### 10.6 Look and CSS

- **Overlap.** Each item after the first has `margin-inline-start` of minus a quarter of the avatar, written per size as `calc(1.5rem / -4)`, `calc(2rem / -4)` and `calc(2.5rem / -4)`, 6, 8 and 10px, beside Avatar's own sizes (a quarter keeps three quarters of each face and both initials visible at 24px). Items are `display: flex; flex-wrap: nowrap`, so the group never wraps; at `lg` with four and a chip it is 170px wide, inside a 288px phone column.
- **Order.** The first item is on top: each `li` sets `--avatar-group-index` from its place and takes `z-index: calc(var(--avatar-group-count) - var(--avatar-group-index))` inside `isolation: isolate` on the list, so the reading order and the visual order agree and no layer escapes the group (open question 30).
- **The ring.** Each `li` is padded 2px with `background-color: var(--avatar-group-surface)`, canvas by default and set to `--color-lifted` by an app for a group in a card, as DataTable's `--data-table-surface` is. Its corner is the avatar's run outward, the concentric rule from the inside: `calc(var(--radius-pill) + min(var(--radius-pill), 0.125rem))`, a circle in Rounded, 14px around Soft's 12px pill, and 0 in Square, where the avatar is 0; for a square avatar `--radius-micro` takes the place of the pill. The margins above are measured from the ring's edge, so the overlap stays a quarter of the face.
- **The chip.** An Avatar's box (`.avatar`, so it takes `--avatar-size`, the bone fill, the frame ring and the shape) with "+3" in ink at Avatar's initials step: 12px at 700 in `sm`, 14 and 16px at 500 in `md` and `lg`, tabular figures. Ink on bone is 16.76 in light and 15.36 in dark, Avatar's pair. Never taupe: a reader reads it.
- **Weights.** 500 and 700, Avatar's: no 600.

### 10.7 Forced colors, right to left, density and pointer

- **Forced colors.** The ring's background is repainted to the reader's canvas, which still cuts each avatar from the next; each avatar's own `CanvasText` frame ring (Avatar's) keeps its edge. The chip is Avatar's: `CanvasText` on the canvas.
- **Right to left.** Logical margins: the first avatar at the right, overlapping to the left; the "+" and the digit stay in their order as one isolated run (`unicode-bidi: isolate`), the numeral rule.
- **Density and pointer.** Neither changes anything: the group is not a control and Avatar's sizes are the app's choice.

### 10.8 Corners

The ring's corner is derived outward from the avatar's, above, so the avatar and its ring are concentric in every shape. In a holder's corner the group is content, not a control or a surface that fills to an edge: an app places it, and a group at a card's foot follows the record's rule for app content (a control-sized row stops at the corner inset), which the story `OnLifted` does.

### 10.9 Server rendering

A server part: `avatar-group/AvatarGroup.tsx` has no directive and imports no React Aria; it renders `Avatar`, a client part, so the server's HTML has every avatar with its initials and the chip, and Avatar shows each image once loaded, its own rule. It joins the server components suite's static rows.

### 10.10 How others do it

| System | Part | Overflow | Order and overlap | Names | What this spec takes |
| --- | --- | --- | --- | --- | --- |
| Atlassian | `AvatarGroup` (to verify props) | `maxCount` and a "+N" button opening a menu of the rest | Stack or grid appearance (to verify) | Each avatar's name; the button "N more people" (to verify) | The stack and the count; not the button (open question 28) |
| Primer | `AvatarStack` (to verify) | None; an app limits | Later under earlier, spread on hover (to verify) | Alt text per avatar | The order, first on top |
| Fluent 2 | `AvatarGroup` (to verify) | An overflow button with a popover list | Spread, stack or pie layouts | Each avatar's name; the overflow's | The overflow's names in its own name |
| Material Design 3 | No avatar group (to verify) | | | | |
| Carbon, Polaris | Avatar or user avatar only (to verify) | | | | |
| Chakra UI | `AvatarGroup` with `max` and `spacing` (to verify) | "+N" as an avatar | Negative margin with a ring in the background color | Per avatar | The ring in the surface color as the cut |

## 11. MasterDetailList (10b)

### 11.1 Anatomy

Wide (its own box 40rem or more):

```
Locations                                      +-------------------------------------+
[ Filter ......................... ]            | Downtown                  [Remove]  |
+------------------------------+               |                                     |
| (DT) Downtown            |   |  selected     | Name       [ Downtown           ]   |
|      12 Main St              |               | Address    [ 12 Main St          ]  |
| (HB) Harbor                  |               | Hours      [ ... ]                  |
| (AP) Airport      (lock)     |               |                                     |
+------------------------------+               +-------------------------------------+
[ + Add a location ]  3 of 5
```

Narrow: the list face (the filter, the rows, Add) or the detail face (Back, the heading, Remove, the fields), one at a time.

### 11.2 API

```ts
export interface MasterDetailItem {
  id: Key;
  label: string;
  description?: string;
  /** Cannot be removed. Still selected and edited. */
  isLocked?: boolean;
  /** An Avatar at the row's start, decorative since the label names it. */
  avatar?: { src?: string; initials?: string; shape?: 'circle' | 'square' };
}

export interface MasterDetailRender<T> {
  index: number;
  count: number;
  isSelected: boolean;
  update: (item: T) => void;
  /** Asks first, then removes. */
  remove: () => void;
}

export interface MasterDetailListLabels {
  /** @default 'Add' */
  add: string;
  /** Add's description. @default (count, max) => `${count} of ${max}` */
  count: (count: number, max: number) => string;
  /** After a disabled Add at the maximum. @default (max) => `${max} of ${max}. Remove one to add another.` */
  full: (max: number) => string;
  /** @default 'Remove' */
  remove: string;
  removeTitle: (label: string) => string;
  removeBody: (label: string) => string;
  removeConfirm: string;
  added: (label: string) => string;
  removed: (label: string) => string;
  /** Back on the narrow detail face, named by the list's label after it: "Back, Locations". @default 'Back' */
  back: string;
  /** @default 'Filter' */
  filter: string;
  /** @default (shown, total) => `${shown} of ${total} shown` */
  filterStatus: (shown: number, total: number) => string;
  /** @default 'No matches' */
  noMatches: string;
  locked: string;
  /** @default 'Nothing here yet' */
  empty: string;
}

export type MasterDetailListBaseProps<T extends MasterDetailItem> = Omit<
  HTMLAttributes<HTMLDivElement>,
  'children' | 'onChange' | 'defaultValue' | 'aria-label' | 'aria-labelledby'
> & {
  /** The list's name, drawn as its heading. */
  label?: ReactNode;
  description?: ReactNode;
  value?: readonly T[];
  defaultValue?: readonly T[];
  onChange?: (items: T[]) => void;
  /** Makes a new item for Add. No function, no Add. */
  createItem?: () => T;
  selectedKey?: Key | null;
  defaultSelectedKey?: Key | null;
  onSelectionChange?: (key: Key | null) => void;
  /** The detail: the app's fields for one item. */
  children: (item: T, render: MasterDetailRender<T>) => ReactNode;
  /** A row's content. @default the avatar, the label and the description */
  renderItem?: (item: T) => ReactNode;
  /** Remove is not drawn at this count. @default 0 */
  minItems?: number;
  maxItems?: number;
  /** The filter field shows past this many items. @default 8 */
  filterThreshold?: number;
  /** Renders every item's detail, the others hidden, so a plain form posts them all. @default false */
  keepsDetailsMounted?: boolean;
  /** The detail's heading level. @default 3 */
  headingLevel?: 2 | 3 | 4;
  isChanged?: boolean;
  changedLabel?: string;
  isDisabled?: boolean;
  labels?: Partial<MasterDetailListLabels>;
  ref?: Ref<HTMLDivElement>;
};

export type MasterDetailListProps<T extends MasterDetailItem> = MasterDetailListBaseProps<T> & AccessibleName<'label'>;
```

With no `selectedKey`, the first item is selected (the iPad's and PanelLayout's default section); with no items, none.

### 11.3 Markup and roles

- `div.master-detail-list`, a size container named `master-detail-list`, `data-view="list"` or `"detail"` for the narrow face, holding `div.master-detail-list-nav` and `section.master-detail-list-detail`.
- **The nav.** The label as `h{headingLevel}` with the Changed chip, the hint, the library's `SearchField.master-detail-list-filter` (named `labels.filter`) once the items pass `filterThreshold`, React Aria's `GridList.master-detail-list-items` (`role="grid"`, named by the heading, `selectionMode="single"`, `disallowEmptySelection`, `selectionBehavior="toggle"`, `escapeKeyBehavior="none"`, `onAction` selecting, so Enter and Space and a press select and the arrows only move), of `GridListItem.master-detail-list-row`s (`aria-selected`, `data-key`, `data-locked`) holding the decorative Avatar, the label, the description and, when locked, the lock glyph with a visually hidden ", Locked"; then Add (a secondary Button, Plus) described by its count, or disabled with the full line; then `div.master-detail-list-status[role="status"]`.
- **The detail.** `section` named by its heading, `h{headingLevel}.master-detail-list-title` (the selected item's label, `tabIndex={-1}`); Back (a tertiary Button with Lucide `ChevronLeft`, mirrored, named "Back, Locations", drawn on the narrow face only); Remove (a danger tertiary Button, "Remove", named "Remove, Downtown", not drawn for a locked item or at `minItems`); then the app's `children`. With `keepsDetailsMounted`, one `div.master-detail-list-panel` per item, the unselected ones `hidden`.

### 11.4 Behavior

- **Selecting** (open question 17). A press, Enter or Space on a row selects it; the arrow keys move focus only, so the detail does not swap on every arrow press under a screen reader. On the wide face focus stays on the row (open question 18), and the detail, next in the tab order, has swapped; the row reads "selected". On the narrow face the detail face shows and focus goes to its heading in the frame after the commit, PanelLayout's rule.
- **Back** (narrow face only) shows the list face and focuses the selected row.
- **The faces** (open question 19). Both are in one HTML; from 40rem of its own box the nav (16rem, PanelLayout's side column) and the detail stand side by side and `data-view` is ignored; under 40rem `data-view` shows one, `list` by default. A face that is `display: none` is out of the tab order and the accessibility tree. Every focus move checks that its target is drawn (`checkVisibility()`) and else focuses the other face's equal, so a resize between a selection and its focus move never lands on a hidden element.
- **Filter.** Past `filterThreshold`, typing narrows the rows to those whose label or description contains the text, by React Aria's `useFilter` with `sensitivity: 'base'` (an `Intl.Collator`, used only once the reader types, after hydration). The status says `labels.filterStatus(shown, total)` after `QUIET_MS`. The selected item stays selected and its detail stays shown when the filter hides its row. No match draws `labels.noMatches` through the grid's empty state. Escape in the field is SearchField's (clears the text, React Aria's; to verify that an Escape in an empty field is not stopped, so it reaches a dialog).
- **Add** (with `createItem`) appends the item, selects it, shows the detail face on a narrow box, and focuses the detail's first focusable field (Repeater's rule, `data-autofocus` to choose another), and the status says `labels.added(label)`. At `maxItems`, Add is disabled and `labels.full(maxItems)` follows it, described by it, and the add that reached the maximum says it in the status (Repeater's ruling 2.3).
- **Remove** asks with ConfirmDialog, danger tone (`useConfirm`): `removeTitle`, `removeBody`, `removeConfirm` and Cancel (the parent spec's "Remove confirms", open question 20). Cancel returns focus to Remove (ConfirmDialog's). Confirmed: the item leaves, the item now in its place is selected (else the previous, else none), and focus goes to that row on the wide face, or to that row on the list face of the narrow box (the removed item's face is gone); with no items left, to Add, else to the nav's heading (`tabIndex={-1}`). The status says `labels.removed(label)`.
- **Locked items** have no Remove and read ", Locked"; they are selected and edited like any other.
- **Details mounted** (open question 21). By default only the selected item's detail is rendered: the app holds every item's values (a controlled form, or its own state) and the part never reads them. With `keepsDetailsMounted`, every detail is in the DOM, the others `hidden` (not `inert` and not disabled, so they submit); an `invalid` event in a hidden panel, caught in the capture phase on the root, selects that item, shows its face, and lets the browser focus the field, the choices batch's Accordion rule.
- **Disabled.** Add and Remove disabled; selecting still works, so every record can be read.

### 11.5 Keys

| Key | Does |
| --- | --- |
| Tab, Shift+Tab | The filter, the list (one stop), Add, then the detail: Back (narrow), Remove, the app's fields. |
| Arrow Up, Arrow Down, Home, End, Page Up, Page Down | Move focus among rows (React Aria). |
| Characters | Typeahead by label, when the filter is not shown (with it, the filter is the way to find). |
| Enter, Space | Select the focused row. |
| Escape | Not handled by the list (`escapeKeyBehavior="none"`), so it reaches what holds the part; in the filter, SearchField's. |

### 11.6 Screen readers and announcements

"Locations, grid, Downtown, 12 Main St, selected, 1 of 3" (to verify the count's wording). Adds, removals and filter counts through the status, as above. The detail's heading is read when focus moves to it on the narrow face. Back reads "Back, Locations, button". The ConfirmDialog is an `alertdialog`, read with its title and body.

### 11.7 Drag and drop

None. The items' order is the app's (alphabetical, by date, or as added); a MasterDetailList whose order matters is a case for open question 31's later work, not this part.

### 11.8 Look and CSS

- **Rows** are ReorderList's rows without handle or controls: the decorative Avatar (`sm` in compact, `md` otherwise), the label at 450 in ink, the description at the small step in slate, a lock glyph at the inline end. **The selected row** is DataTable's current row, the closest recorded rule: a 3px ink bar at its inline start, its label at 700 and the 8% wash, never an ink fill and never color alone.
- **The nav** column is 16rem wide from 40rem, the full box under it; the heading at the h4 step at 700; Add a peer step under the list.
- **The detail** stands a peer step from the nav, with its heading at the h3 step at 500 and Remove at its inline end, the app's fields a peer step under it. It draws no surface: the card holding the part is the surface, and a divider rule at the nav's inline end separates the columns on the wide face (`border-inline-end: 1px solid var(--color-divider)` on the nav).
- **Weights.** 450, 500 and 700: no 600.

### 11.9 Forced colors, right to left, density and pointer

- **Forced colors.** The selected row's bar is a border in `Highlight`, its label 700, so it survives the repaint; the divider is `CanvasText`.
- **Right to left.** The nav is at the right, the bar at the row's right edge, Back's chevron mirrored.
- **Compact density.** Rows 40px with `sm` avatars; the detail's fields follow `--size-field`.
- **Coarse pointer.** Rows 44px in compact; every button at its coarse size.

### 11.10 Corners

The rows take the holder formula with the micro floor (7px, 6px, 0 in a card). Add at the nav's foot and Remove at the detail's top end are controls: Add moves down when the part ends a card; Remove, when the part starts a card with no label above it, takes CardActions' top margin (the record's "Card, CardActions beside the title, down"), since it sits beside a title at the card's top end.

### 11.11 Server rendering

A client part, rendering both faces, the nav's rows with the selected one marked, the selected detail (or all with `keepsDetailsMounted`), the filter field when past the threshold, Add with its count or full line, Back and Remove, and the empty status. `data-view="list"` in the server's HTML, so a phone shows the list first; nothing measures.

### 11.12 How others do it

| System | Part | Narrow | Selection | What this spec takes |
| --- | --- | --- | --- | --- |
| Material Design 3 | The list-detail canonical layout (to verify the current guidance) | The list, then the detail with Back | A tap opens the detail | The two faces and Back |
| Apple | `NavigationSplitView` (SwiftUI), `UISplitViewController` | Collapses to a stack with Back (to verify per size class) | Selection drives the detail | The default first item on a wide view |
| Salesforce Lightning | Split view in record lists (to verify) | Not observed | A press opens the record beside the list | The list beside the record |
| Atlassian | No component; Jira's issue list beside the issue (to verify) | Not observed | A press | Nothing beyond the layout |
| Polaris, Carbon, GOV.UK | No list-detail component (to verify each) | | | |
| Fluent 2 | No component; Outlook's list and reading pane (to verify) | Not observed | Arrows move focus and selection in Outlook (to verify) | The opposite of open question 17's recommendation, recorded |

## 12. TransferList (10b)

### 12.1 Basis

Two `GridList`s, one row look. The parent spec named `ListBox`; this spec uses `GridList` for both lists:

- The chosen rows need Remove, a button inside the row, which a `listbox` option cannot hold.
- The available rows are checkboxes in a list, which `GridList` draws with `slot="selection"` and reads as "checkbox, checked" in each row (to verify the reading in VoiceOver and NVDA), with `disabledBehavior="selection"`, so a row at the limit stays focusable and readable while its box cannot be ticked.
- One row look and one keyboard model for both lists.

No "Add" and "Remove" arrow buttons between the lists, the classic dual listbox: ticking a box adds and Remove removes, so each action is one press on the item itself (open question 23).

### 12.2 API

```ts
export interface TransferItem {
  id: Key;
  label: string;
  description?: string;
  /** Cannot be chosen; shown and read. */
  isDisabled?: boolean;
  avatar?: { src?: string; initials?: string; shape?: 'circle' | 'square' };
}

export interface TransferListLabels {
  /** @default 'Available' */
  available: string;
  /** @default 'Chosen' */
  chosen: string;
  /** @default 'Search' */
  search: string;
  /** Beside the chosen heading. @default (count, max) => max === undefined ? `${count}` : `${count} of ${max}` */
  count: (count: number, max: number | undefined) => string;
  /** @default (max) => `${max} of ${max} chosen. Remove one to choose another.` */
  full: (max: number) => string;
  /** @default 'Remove' */
  remove: string;
  added: (label: string) => string;
  removed: (label: string) => string;
  /** @default (count) => `${count} results` */
  results: (count: number) => string;
  /** @default (query) => `Nothing matches "${query}"` */
  noResults: (query: string) => string;
  /** @default 'Loading' */
  loading: string;
  /** @default 'Nothing chosen yet' */
  emptyChosen: string;
  /** The error for too few. @default (min) => `Choose at least ${min}` */
  tooFew: (min: number) => string;
}

export type TransferListBaseProps<T extends TransferItem> = {
  label?: ReactNode;
  description?: ReactNode;
  errorMessage?: ReactNode;
  /** The available items to show now: this page, after the search. */
  items: readonly T[];
  /** The chosen items, in order. Controlled. */
  value?: readonly T[];
  defaultValue?: readonly T[];
  onChange?: (chosen: T[]) => void;
  searchValue?: string;
  defaultSearchValue?: string;
  /** Given, the app searches (a server, say) and passes the results as `items`; absent, the part filters `items`. */
  onSearchChange?: (text: string) => void;
  /** Pagination's props, for an app that pages; absent, no pager. */
  page?: number;
  pageCount?: number;
  /** Pagination's range, in the app's words: "1 to 20 of 134". */
  rangeLabel?: string;
  onPageChange?: (page: number) => void;
  /** Skeleton rows in the available list, and "Loading" in the status. */
  isLoading?: boolean;
  minChosen?: number;
  maxChosen?: number;
  /** The chosen list orders, as a ReorderList. @default false */
  allowsReordering?: boolean;
  isRequired?: boolean;
  isChanged?: boolean;
  changedLabel?: string;
  isDisabled?: boolean;
  /** One hidden input per chosen item, its id, in order. */
  name?: string;
  form?: string;
  labels?: Partial<TransferListLabels>;
  className?: string;
  ref?: Ref<HTMLFieldSetElement>;
};

export type TransferListProps<T extends TransferItem> = TransferListBaseProps<T> & AccessibleName<'label'>;
```

`isRequired` is `minChosen` of 1 when `minChosen` is not given. The chosen items are objects, not ids, because a chosen item may be on no page the reader can see now; the app keeps them in its state, as a form keeps a field's value.

### 12.3 Markup and roles

- `fieldset.transfer-list` with `legend` (the label and the Changed chip), the hint and the error line under it, then `div.transfer-list-panes`, a size container named `transfer-list`, then the hidden inputs, the validity input, and `div.transfer-list-status[role="status"]`.
- **The chosen pane** first in the DOM (open question 22): `section.transfer-list-chosen` named by its heading, `h4` with `labels.chosen` and the count (`labels.count`), then a `GridList` (`selectionMode="none"`, named by the heading) of rows with the decorative avatar, the label, the description and a ghost `IconButton` (Lucide `X`) named "Remove, Revenue by month"; with `allowsReordering`, this list is ReorderList's internals with Remove added to each row's controls and no switch. Empty, `labels.emptyChosen` in slate.
- **The available pane** second: `section.transfer-list-available` named by its heading (`labels.available`), the library's `SearchField` (named `labels.search`), a `GridList` (`selectionMode="multiple"`, `selectionBehavior="toggle"`, `escapeKeyBehavior="none"`, `disabledBehavior="selection"`, `disabledKeys` the disabled items and, at the limit, every unchosen one; its selected keys the chosen ids present in `items`) of rows with a `Checkbox slot="selection"`, the avatar, the label and the description; its empty state `labels.noResults(query)` or, with no search, the app's own through the docs' EmptyState recipe; then `Pagination` when `pageCount` is given.
- **Hidden inputs** under `name`, one per chosen item in order, with a reset listener. **Validity** lives on a visually hidden `input` (not `type="hidden"`, which is barred from constraint validation) with `tabIndex={-1}` and `aria-hidden`, whose `setCustomValidity` carries `labels.tooFew(min)` while too few are chosen; its `invalid` event shows the error line and moves focus to the search field (open question 27; risk R10).

### 12.4 Behavior

- **Choosing.** Ticking an available row (a press, Space, Enter) adds the item at the end of the chosen list; unticking it, or Remove on its chosen row, takes it out. Focus stays on the available row after a tick. The status says `labels.added(label)` or `labels.removed(label)`, and at the limit adds `labels.full(max)`.
- **The limit.** At `maxChosen`, every unchosen available row's box is disabled and the row stays focusable (`disabledBehavior="selection"`); the available list's description and the chosen heading's count say `labels.full(max)`, so the reason is read on entering the list and seen beside the count.
- **Search.** Without `onSearchChange` the part filters `items` by label and description with React Aria's `useFilter`; with it, the part reports each change and the app passes new `items`, setting `isLoading` while it fetches. `labels.results(count)` goes to the status after `QUIET_MS` (the count of `items`, or the app's total through `rangeLabel` when it pages). A search resets nothing in the chosen list.
- **Paging.** Pagination's own: its buttons move pages and its live region reads the app's `rangeLabel`; focus stays on the pressed page button, and a chosen item on another page stays chosen and in the chosen list.
- **Loading.** `isLoading` draws Skeleton rows, as many as the last page had (at least three), in the available list, sets `aria-busy` on that list only, and says `labels.loading` once in the status, which sits outside it (Dense data's rule).
- **Remove and focus** (decided here, item 22). After Remove in the chosen list, focus goes to the chosen row now in its place, else the previous one, else the search field; never to another Remove, so a held Enter does not empty the list (Repeater's reason).
- **Reordering** (`allowsReordering`, open question 25). The chosen list is section 8's ReorderList without switches: handles, Move up and Move down (or the menu), Alt and the arrows, keyboard drag, the position line; Remove keeps its place after the move buttons.
- **Changed, invalid, disabled.** Changed is the app's. Too few on submit is invalid with `labels.tooFew`, or the app's `errorMessage`. Disabled: no ticks, no Remove, no moves; search and paging still work, so the reader can see what is there.

### 12.5 Keys

| Key | Does |
| --- | --- |
| Tab, Shift+Tab | The chosen list (one stop), the search field, the available list (one stop), the pager's buttons, out. |
| In a list: arrows, Home, End, Page Up, Page Down, characters | React Aria's grid moves and typeahead. |
| In the available list: Space, Enter | Ticks or unticks the focused row. |
| In the chosen list: Arrow Right, Arrow Left | Into the row's Remove (and its move controls when reordering), and back. |
| Enter or Space on Remove | Removes; focus as section 12.4. |
| With `allowsReordering`: Alt+Arrow Up, Alt+Arrow Down, the handle | Section 8.5. |
| Escape | Not handled by either list; in the search field, SearchField's. |

### 12.6 Screen readers and announcements

The fieldset's legend names the whole; each pane's heading names its list ("Chosen, 3 of 5, grid"). An available row reads "Revenue by month, checkbox, checked" (to verify); at the limit an unchosen row reads "dimmed" or "unavailable" and the list's description gives the reason. Adds, removes, results, loading and moves are polite status lines; paging is Pagination's.

### 12.7 Drag and drop

Only inside the chosen list, with `allowsReordering` (section 7.5). Dragging from the available list to the chosen list is out of scope (open question 30): ticking is one press and needs no target.

### 12.8 Look and CSS

- **The panes** are framed lists: each is a surface with a 1px `--color-frame` edge, the surface radius as a holder (section 13), no fill of its own (the card shows through), and rows flush to its inner edge, clipped by it (`overflow: clip`), the record's "flush edges are clipped, not rounded". The available pane's list scrolls in its own box at `max-block-size: 24rem`, with the search field and pager outside the scroller, so they stay in view; the chosen pane grows with its rows.
- **Rows** are Dense data's rows: 48px, 40px compact, 44px compact coarse, divider rules, the 5% and 8% washes (a ticked row is the 8% wash with its checked box), slate turned granite on a wash, the inset focus ring, square corners (flush, clipped).
- **Panes side by side** from 44rem of `transfer-list-panes`, `grid-template-columns: repeat(2, minmax(0, 1fr))`, a peer step apart, the chosen pane at the inline start; under 44rem one column, the chosen pane first.
- **Text.** Pane headings at the h4 step at 700, the count after the heading at the small step at 450 in slate with tabular figures; labels 450 ink; descriptions small slate.
- **Weights.** 450 and 700: no 600.

### 12.9 Forced colors, right to left, density and pointer

- **Forced colors.** Pane edges and rules `CanvasText`; the checkbox is Checkbox's (its check in a system color); a ticked row's wash is dropped, so its checked box carries the state.
- **Right to left.** The chosen pane at the right; the `X` does not mirror; the count's digits isolated.
- **Compact density.** Rows 40px, the search field and the pager at their compact sizes.
- **Coarse pointer.** Rows 44px in compact; Remove's hit area 44px in compact.

### 12.10 Corners

The panes are holders: each declares `--holder-radius`, `--holder-border` 1px and `--holder-pad` 0, and draws its corner by the formula from the card around it with the micro floor (7px, 6px, 0 in a card, `--radius-surface` outside one), since a pane's corner lies within the card's curve. Rows are flush, clipped, square. The search field and the pager inside the available pane are controls clear of the pane's small curve (padded a part step). Remove in the chosen list's first or last row is a control within the pane's curve only when the pane's radius exceeds its row padding, which it never does (7px against 16px), so nothing moves.

### 12.11 Server rendering

A client part: the legend, both panes, the chosen rows, the search field with `defaultSearchValue`, the available rows with their checks from `value`, the pager with the app's `rangeLabel`, the hidden inputs and the empty status are in the server's HTML; the part filters `items` on the server too when it owns the search, with a plain lowercase `includes`, and React Aria's collator only after hydration (to verify that the two agree for the sample data, or the server face shows `items` unfiltered until hydration; risk R12).

### 12.12 How others do it

| System | Part | Moving between lists | Search and paging | Limit | What this spec takes |
| --- | --- | --- | --- | --- | --- |
| Salesforce Lightning | Dual listbox (to verify) | Select, then a button between the lists; reorder buttons on the selected list | None (to verify) | `min` and `max` with messages | The limit and its words; the reorder on the chosen list |
| Ant Design | `Transfer` (to verify) | Checkboxes, then arrow buttons; a one-way mode removes from the right | Search per list; pagination per list | None of its own | Search in the available list; one-way removal |
| MUI | Transfer list (a demo, not a component; to verify) | Checkboxes and arrow buttons | None | None | Nothing beyond checkboxes |
| PatternFly | Dual list selector (to verify) | Select, then buttons; a tree variant | Search per list | None | Search |
| Carbon, Atlassian, Polaris | No transfer part (to verify each); a multi-select or a combobox with tags | | | | The case for ticking in place over moving between |
| GOV.UK | Checkboxes, with "Select all that apply" | | | | Plain checkboxes as the way to choose |

## 13. The corner rule and the intrinsic size rule, together

The design record's "Nested radii, derived" and the "A width of its own" and "No width of its own" records apply to each part as follows.

| Part | Rounded parts it holds | In a holder | Size container |
| --- | --- | --- | --- |
| ReorderList | Rows: the holder formula with the micro floor (7px, 6px, 0 in a card; `--radius-control` outside a holder); the handle and buttons are controls; the menu a popover | The list fills its column; its first or last row's controls move down where it starts or ends a card | No: rows wrap their controls under the label by `flex-wrap` and a `10rem` basis on the content, so a 320px column draws two lines per row and an `auto` column one |
| TreeBuilder | Rows as ReorderList's; the editor a nested card, concentric (7px, 6px, 0); Done and Add move down at a card's foot | As ReorderList | Yes: `tree-builder` puts the editor beside the tree at 48rem of its own box, with `contain-intrinsic-inline-size: 0`; a holder sized by its content gives it a width, which the docs say |
| AvatarGroup | The ring around each avatar, run outward from the avatar's corner | Content an app places | No: a row that never wraps, 170px at most at `lg` with the default `max` |
| MasterDetailList | Rows as ReorderList's; Add moves down at a card's foot; Remove takes CardActions' top margin at a card's top | A part of the card's body | Yes: `master-detail-list` switches faces at 40rem, with `contain-intrinsic-inline-size: 0` |
| TransferList | Each pane a holder taking the card's formula (7px, 6px, 0); rows flush and clipped | A field: its fieldset fills the column | Yes: `transfer-list` pairs the panes at 44rem, with `contain-intrinsic-inline-size: 0` |

**Why three size containers and not five** (decided here, item 26). TreeBuilder's editor, MasterDetailList's faces and TransferList's panes each need about 40rem or more side by side, and a viewport query would pair them in a 24rem SidePanel on a wide screen; their own width decides, as DescriptionList's does. ReorderList and AvatarGroup fit or wrap without a query, which keeps the intrinsic size rule's trap (a stand-in width that becomes a holder's min-content and pushes a 320px page sideways) out of them. Each container declares `contain-intrinsic-inline-size: 0`, and its `Narrow` story and an `InAFlexRow` play (no-visual) hold it at 320px and in a content-sized flex row in three engines. The fieldset of TransferList resets `min-inline-size: min-content` to 0, Repeater's reason.

**New rows in the record's tables:** "Card, a list's row (ReorderList, TreeBuilder, MasterDetailList), 7px (19px compact), 6px, 0"; "Card, a TransferList pane, 7px (19px compact), 6px, 0"; "AvatarGroup's ring, around an avatar, the avatar's radius plus the lesser of it and 2px"; and in the table of controls that move: "Card, a ReorderList's or TreeBuilder's first or last row's controls, down, 7px", "Card, TreeBuilder's and MasterDetailList's Add at its foot, down, 7px", "Card, MasterDetailList's Remove beside its title, down, as CardActions".

**The audit.** Every new story runs through `apps/storybook/tests/concentric` in Rounded, Soft and Square, the open menus and a mid-drag state included.

## 14. Accessibility

- **Roles and names.** ReorderList: a `grid` named by its label, `row`s with a drag `button`, a `switch`, two `button`s or a menu `button`. TreeBuilder: a `treegrid` of `row`s with `aria-level`, a chevron, a drag `button` and a menu `button`; the editor a `region` named by its heading. AvatarGroup: a `list` of `img`s. MasterDetailList: a `grid` with one selected `row`, a `region` for the detail named by its heading, `alertdialog` for Remove. TransferList: a `group` (the fieldset) named by its legend, two `grid`s named by their headings, `checkbox`es in rows, Remove `button`s, a `searchbox`, a `navigation` for the pager.
- **Focus never falls to the body.** Every part names where focus goes when what holds it moves or goes away:

| When | Focus goes to |
| --- | --- |
| A row moves by Alt and an arrow | The moved row, or its control that had focus |
| A row moves by Move up or Move down | That button on the moved row, or the row's other move button at an end |
| A row moves by the Move menu | The moved row's menu button |
| A keyboard drag drops or is cancelled | The dropped row; the dragged row's handle |
| TreeBuilder's editor opens | Its heading |
| TreeBuilder's editor closes (Done, Escape, `close`) | The edited row |
| A TreeBuilder node is removed | The next sibling, else the previous, else the parent, else Add, else the tree |
| A TreeBuilder node is added | The new node's editor heading |
| MasterDetailList: an item is selected on the narrow face | The detail's heading |
| MasterDetailList: Back | The selected row |
| MasterDetailList: an item is added | The detail's first field |
| MasterDetailList: Remove is cancelled | Remove (ConfirmDialog's) |
| MasterDetailList: an item is removed | The row now in its place, else the previous, else Add, else the nav's heading |
| TransferList: a chosen item is removed | The chosen row now in its place, else the previous, else the search field |
| A filter or search hides the focused row | Focus stays in the field the reader is typing in; the grid's last focused key falls back to its first row (React Aria) |

Each is a test that reads `document.activeElement` after the move, in three engines in the plays, and fails on `body`; the docs' end-to-end tests walk each recipe doing the same.

- **Escape.** Each part handles Escape only where it has something to undo and stops it there: a keyboard drag (cancel), TreeBuilder's editor (close). `GridList`'s Escape clearing selection is off in MasterDetailList and TransferList. A play puts each part in a Dialog and checks that one Escape does the part's thing and the next closes the dialog, and that an Escape with nothing to do closes it at once.
- **Live regions** are mounted empty from the server's first render, polite, never inside `aria-busy`.
- **Never color alone.** A move is words; a locked row is a glyph and the word; an off row is a switch's state; the selected record is a bar, a weight and `aria-selected`; a ticked item is a checked box; the limit is words. Clay is the Changed chip only; signal orange appears nowhere; error is an invalid value only; success appears nowhere; taupe is disabled text only.
- **Targets (2.5.8).** Rows 48px (40px compact, 44px compact on a coarse pointer); handles, move buttons, chevrons, Remove and menu buttons 40px hit areas (44px compact coarse).
- **Dragging movements (2.5.7).** Every drag has a single-pointer equal: Move up and Move down or the Move menu in ReorderList and TransferList's ordered list, the actions menu in TreeBuilder. Nothing needs a drag.
- **Label in name (2.5.3).** "Move up, Pricing", "Remove, Downtown", "Back, Locations", "Show Pricing": each name starts with its visible text or tooltip's text.
- **Focus order (2.4.3) and meaningful sequence (1.3.2).** The DOM order is the visual order at every width: TransferList draws the chosen pane first in both layouts, MasterDetailList the nav before the detail.
- **Axe** passes in light and dark for every story, mid-drag and open menus included.
- **Screen readers.** Not yet verified with VoiceOver, NVDA and TalkBack for the five parts (owner action 3), with the questions marked "to verify" in sections 7 to 12.

## 15. Decided here

1. Phase 4's remaining rows ship as two batches, 10a (Ordering: ReorderList, TreeBuilder) and 10b (Choosing: AvatarGroup, MasterDetailList, TransferList), each a minor release, in that order.
2. ReorderList and SortableList are one part, `ReorderList`, with `hasSwitches` and `isLocked`; no `SortableList` export.
3. Every move, by any means, goes through one pure move model in `list/moves.ts`; drops, buttons, menus and keys cannot disagree.
4. Drag is React Aria's `useDragAndDrop` on `GridList` and `Tree`, with a private drag type, `move` only, from a handle only.
5. Every moving part has a single-pointer path: Move buttons or a Move menu.
6. Locked rows hold their places; other rows move among the remaining places.
7. After every move the part's polite status says the position in words; React Aria's drag strings are kept.
8. After every move focus is put back by key in a frame after the commit, on the control that had it, or its row.
9. Alt+Arrow Up and Down move a row; in TreeBuilder, Alt+Arrow Right and Left indent and outdent in the drawn direction; each handled key is stopped.
10. The Escape that cancels a keyboard drag is stopped; outside a drag the moving parts handle no Escape.
11. Rows are the value (`value`, `defaultValue`, `onChange(rows)`), Repeater's ruling 2.5; flags the library writes are `isEnabled` only.
12. Form values are repeated hidden inputs of ids, read with `getAll`; TreeBuilder adds parent ids under `parentName`; `buildTree` and `flattenTree` are exported pure helpers.
13. The drag handle takes `cursor: grab`, a recorded deviation from the one cursor rule.
14. The drop indicator is a 2px ink line on a 0-height element; the drop target the 8% wash and an inset ink ring; the dragged row a dashed boundary edge; the preview the float surface with the frame edge.
15. TreeBuilder's editor is a region outside the tree, beside it from 48rem of its own box and under it below; its Escape closes it.
16. TreeBuilder's `maxDepth` defaults to 3; a refused menu move is disabled with its reason as its description.
17. TreeBuilder asks before removing a node with children and never for a leaf.
18. AvatarGroup is a server part over Avatar: first on top, a quarter overlap, a 2px ring in `--avatar-group-surface`, "+N" with every hidden name in its name, no "+1".
19. MasterDetailList selects on press, Enter or Space; arrows move focus only; focus stays on the row on the wide face and goes to the heading on the narrow one.
20. MasterDetailList draws PanelLayout's two faces from 40rem of its own box, by state, `list` first.
21. MasterDetailList's Remove always asks; Add is disabled at the maximum with the reason, Repeater's ruling 2.3.
22. TransferList is two `GridList`s: ticking in the available list chooses, Remove in the chosen list removes, focus after Remove to the row now in its place.
23. TransferList's chosen pane comes first in the DOM and at the inline start; the panes pair at 44rem.
24. `GridList`'s `escapeKeyBehavior` is `none` wherever a list selects.
25. No new tokens. `--avatar-group-surface`, `--list-row-radius` and `--tree-level` are component custom properties; 10rem, 16rem, 20rem, 22rem, 24rem, 40rem, 44rem and 48rem are literals in their files, as SidePanel's 24rem is.
26. Size containers: `tree-builder`, `master-detail-list`, `transfer-list`, each with `contain-intrinsic-inline-size: 0`; ReorderList and AvatarGroup are not.
27. New CSS files: `reorder-list.css` (with the shared row, handle, indicator and preview rules in `list-row.css`), `tree-builder.css` (10a); `avatar-group.css`, `master-detail-list.css`, `transfer-list.css` (10b). Each in `@layer components`, tokens only, unprefixed kebab-case classes, states as data attributes that also match the native pseudo-class, hover in `@media (hover: hover)`, logical properties, and a forced-colors block with system colors only there; imported after the last file of the batch before.
28. Every file that imports `react-aria-components` starts with `'use client';`; `list/moves.ts`, `tree-builder/tree.ts` and `avatar-group/AvatarGroup.tsx` have no directive.

## 16. Testing

- **Core (`css.test.js`, `token-only.test.js`, `contrast.test.js`).** Each new file is tokens only, in `@layer components`, imported in order, with a forced-colors block, logical properties and system colors only there; the three containers declare `contain-intrinsic-inline-size: 0`; the new corner rows are in the shared `CLEAR` list; the handle's `grab` cursor is the one allowed exception to the cursor test, named. Contrast: no new pair is gated; the dashed boundary edge cites the boundary's gate, the indicator ink's.
- **React (Vitest, jsdom), per batch.**
  - 10a. The move model: every move in a list and a tree against a table of cases, locked rows skipped and restored, depth refused, a node into itself refused, ends. ReorderList: rows in and out with `isEnabled`, a repeated id's warning; Move up and Down with focus kept and handed to the other button at an end; the Move menu's four items and focus to its trigger; Alt+Arrow Up and Down, stopped, ignored during composition and with Control or Meta; a drop through React Aria's test utilities (`onReorder` with a target) applying the model and refusing a locked place; the status's words for each; switches and a locked switch; hidden inputs in order, `enabledName`, reset; changed, invalid, disabled; the empty line; a Dialog with a keyboard drag where Escape cancels and does not close. TreeBuilder: the tree's moves by menu and keys with the words and focus; depth refusals and the disabled items' descriptions; expanding a collapsed target; the editor's open, focus, Done, Escape stopped, swap; Add with `createNode` and `maxNodes`; Remove with and without children, the ConfirmDialog, focus after; `name` and `parentName`; `buildTree` refusing a bad post.
  - 10b. AvatarGroup: the count rule (no "+1"), names in the chip, `max` below 1, the list's role and name, sizes. MasterDetailList: selection by press, Enter and Space and not by arrows; the default first item; both faces and `data-view`; Back; Add's focus and status; the full line; Remove's ConfirmDialog, cancel focus, confirmed focus; locked items; the filter at 8 and 9 items, its status, the hidden selected item; `keepsDetailsMounted` and an invalid hidden field selecting its item; Escape not handled. TransferList: ticking and unticking, Remove's focus, the limit's disabled boxes still focusable with the reason; search owned and delegated; paging keeping chosen items; loading's busy list and status; validity with `minChosen` and the focus on `invalid`; hidden inputs and reset; `allowsReordering` with ReorderList's tests on the chosen list.
  - Server suites: every part in `server-render.test.tsx`, `server-face.test.tsx` (three locales, two zones) and `hydration.test.tsx` with a mocked iPhone, `onRecoverableError` failing the test; AvatarGroup in the server components suite.
- **The drag spike** (10a's first task; risk R1). React Aria's `GridList` and `Tree` with `useDragAndDrop`, the library's handle and indicator, in Chromium, WebKit and Firefox: a mouse drag by Playwright's mouse API reorders; Playwright's touch emulation long-presses the handle (and the result is recorded as found, with real devices for owner action 3); a keyboard drag with Enter, arrows, Enter; Escape in a Dialog; a focused row moved down keeps or loses focus per engine; Alt+Arrow keys reach the page and Alt+Arrow Left does not navigate back; the drag image's shape. The results go in the design record before ReorderList is built.
- **Storybook.** Section 17's stories, baselined in the four theme and shape modes and at 375px, and in compact where tagged. Plays in the four story projects (Chromium in light and dark, WebKit and Firefox): every part's keys (`no-visual`); a pointer drag in each moving part; a keyboard drag; focus after every move and removal read from `document.activeElement`; Escape in a Dialog; the `InAFlexRow` plays for the three containers. The concentric audit runs every new story in three shapes. Baselines change only through `pnpm --filter @snapshot-ui/storybook visual:docker`.
- **Docs e2e.** Completeness maps for the new pages; 320px and 375px with no sideways scroll; forced colors on a drop indicator, a selected record and a ticked item; each batch's recipe at 375 and 1280, failing on focus on `body` after each move and removal.

## 17. Docs, stories and design record

- **Pages:** `reorder-list` (leading with "Three ways to move", then "Rows that switch on and off", the sortable case, and "Locked rows"), `tree-builder` (leading with "Moving without dragging", then "The editor", "Depth" and "Reading the form on the server" with `buildTree`), `avatar-group` (leading with "Names, not faces"), `master-detail-list` (leading with "MasterDetailList, PanelLayout or SidePanel"), `transfer-list` (leading with "Choosing from a long list", with the server search and paging recipe). Each with Usage, Props, Accessibility with its Keys table, and Design rules. The `avatar` page links AvatarGroup; `data-table` and `side-panel` link MasterDetailList; `repeater` links ReorderList; `checkbox` links TransferList.
- **Recipes,** one per batch, with the Next App Router and a server action:
  - 10a, **Navigation:** a Card "Menu" with a TreeBuilder of a site's menu (Products with Pricing and Features under it, Docs, Company with About and Careers, three levels at most) and its editor of a label, a link and a "new tab" Switch; a Card "Home page" with a ReorderList with switches (Header locked first, Hero, Features, Pricing, Testimonials, Footer locked last); a SaveBar; the server action reading `getAll` and `buildTree`.
  - 10b, **Sharing:** a Card "Locations" with a MasterDetailList of places with their fields; a Card "Report data" with a TransferList of datasets from a paged server search, at most five, ordered; a PageHeader whose actions hold an AvatarGroup "Shared with". Sample content keeps the reservations: no signal orange, no success color for a saved list.
- **Stories:**
  - 10a: `Components/ReorderList`: `Default` (density), `WithSwitches` (density), `Locked`, `MoveMenu`, `Dragging`, `KeyboardDrag`, `Changed`, `Disabled`, `Empty`, `InCard` (density). `Components/TreeBuilder`: `Default` (density), `Collapsed`, `DepthLimit`, `Editing`, `EditingNarrow`, `Dragging`, `DropInto`, `Changed`, `Disabled`, `Empty`, `InCard` (density). `Pages/Navigation` (density). `rtl`: `ReorderList`, `TreeBuilder`. No-visual: `InAFlexRow` for TreeBuilder.
  - 10b: `Components/AvatarGroup`: `Sizes`, `Overflow`, `Mixed` (images, initials and squares), `OnLifted`. `Components/MasterDetailList`: `Default` (density), `WithAvatars`, `Locked`, `Filter`, `NoMatches`, `NarrowList`, `NarrowDetail`, `ConfirmRemove`, `AtLimit`, `Empty`, `InCard` (density). `Components/TransferList`: `Default` (density), `Search`, `NoResults`, `Loading`, `AtLimit`, `Paged`, `Reorderable`, `Narrow`, `Invalid`, `Changed`, `InCard` (density). `Pages/Sharing` (density). `rtl`: `AvatarGroup`, `MasterDetailList`, `TransferList`. No-visual: `InAFlexRow` for MasterDetailList and TransferList.
- **Design record:** a section per part in Appendix B of `docs/design-system.md` before it is built, each with every derived value, its reason and its pairs; a "Moving rows" section first in 10a for the handle, the grab cursor's deviation, the indicator, the drop target, the dragged row and the preview, with the spike's results; AvatarGroup's overlap, ring and order before 10b; the rows of section 13 in "Nested radii, derived".
- **Guides:** the forms guide gains "Lists people put in order" (ReorderList, TreeBuilder, Repeater, and which to use) and "Choosing many" (TransferList, MultiSelect, CheckboxGroup, TagInput, and which to use); the patterns guide gains "A list beside its record" (MasterDetailList, PanelLayout, SidePanel with DataTable).

## 18. Risks

- **R1. Drag on touch and in three engines.** Native drag differs by engine, and touch drag depends on the browser's support, which iOS Safari and Android Chrome give differently. Mitigation: 10a's first task is the spike of section 16; the move buttons and menus are always drawn, so no task depends on a drag working; a device pass (owner action 3).
- **R2. Focus lost when a focused row's node moves.** React's `insertBefore` blurs it in some engines. Mitigation: every move puts focus back by key after the commit (section 7.3); plays read `document.activeElement` in three engines.
- **R3. Escape during a keyboard drag in a Dialog.** React Aria's drag manager may let the key reach the dialog. Mitigation: the spike checks it; the capture listener of section 7.4 while dragging; a play in each moving part.
- **R4. Two polite messages at a drop.** React Aria's "Drop complete." and the library's position line may be merged, reordered or one dropped by a screen reader. Mitigation: the library's line is written a frame later; VoiceOver and NVDA passes (owner action 3); open question 7 can drop the line after drags if it doubles.
- **R5. React Aria's drag strings in Persian.** 1.22.1 ships none for `fa`, so a Persian page hears its fallback. Mitigation: the library's words carry the moves and positions; the gap is recorded in the docs and reported upstream; the right-to-left story records what is heard (open question 8).
- **R6. Alt and arrow conflicts.** Alt+Arrow Left is the browser's Back on Windows and Linux, screen readers take some chords, and macOS's Option+Arrow moves by word in text. Mitigation: the handler prevents the keys it handles and only on a row (no text field); the spike checks Back is not taken in three engines; if any engine still navigates, TreeBuilder's indent keys become Alt+Shift+Arrow Right and Left, recorded as a correction.
- **R7. React Aria's tree drag is the newest of its drag support.** The level from the pointer's position, the drop after a last child, and expanding on hover are what TreeBuilder rests on. Mitigation: the spike runs TreeBuilder's cases; the actions menu and the keys do every move without a drag; TreeBuilder can move to the next minor (section 2).
- **R8. The drag image.** A native drag image may be translucent, clipped at its box and drawn without its shadow. Mitigation: the preview carries a frame edge; the docs record each engine's look; nothing reads from the image.
- **R9. Long lists.** `GridList` and `Tree` here are not virtualized, and a drag over hundreds of rows is slow to do and to read. Mitigation: ReorderList and TreeBuilder are documented for lists ordered by hand, tens of rows, with a development warning over 200; TransferList pages its long list; virtualization with drag is a later question.
- **R10. Validity on a hidden part of a form.** A required TransferList and a MasterDetailList with hidden mounted details rely on `invalid` events and custom validity on an element the reader cannot focus. Mitigation: the `invalid` listener moves focus to a visible control before the browser reports; plays submit a plain form in three engines.
- **R11. The source's behaviors.** `.local/SOURCE.md` was absent when this spec was written, so the order list's buttons, the section list's switches and locks, the menu builder's depth and editor, the slot switcher's count, confirmation, locks and filter, and the dataset picker's search, pager and limit are this spec's reading of the parent spec. Mitigation: each plan reads `js/order-list.js`, `js/section-list.js`, `js/section-list-model.js`, `js/menu-builder.js`, `src/shared/menu.js`, `js/slot-switcher.js`, `js/dataset-picker.js` and `js/dataset-picker-model.js` before the tasks that port them, and records every difference as a correction for the owner.
- **R12. TransferList's filter before and after hydration.** The server's plain match and React Aria's collator may disagree on accents. Mitigation: the hydration test with accented sample data; if they disagree, the server face shows `items` unfiltered and the filter applies after hydration, which the docs say.
- **R13. React Aria internals by name.** `allowsArrowNavigation`, `escapeKeyBehavior`, `disabledBehavior`, `TreeDropTargetDelegate`'s behavior, `isDropTarget` and the drag manager's Escape are used by name and some are lightly documented. Mitigation: each is pinned by a test that fails on an upgrade that renames it; React Aria stays pinned at 1.22.1.
- **R14. Two releases while four batches are in flight.** 10a starts after the settings, choices and inputs batches merge, and baselines and versions shift with each. Mitigation: changesets name no number; each plan starts from the merged `main` and recounts the baselines.

## 19. Open questions

Each has a recommended answer.

1. **The split and the order.** Recommended: two batches, 10a Ordering (ReorderList, TreeBuilder) then 10b Choosing (AvatarGroup, MasterDetailList, TransferList), so the drag risk reports first and 10b's reorderable chosen list builds on it. Alternatives: one batch of about 281 baselines; or 10b first if the first consumer needs it sooner, with TransferList's reordering added later.
2. **ReorderList and SortableList.** Recommended: one part, ReorderList, with `hasSwitches` and `isLocked` (section 6). Alternative: two exports over one internal model, SortableList a preset with switches and locks on.
3. **The name.** Recommended: ReorderList, since "sortable" reads as sorting by a key, which DataTable does. Alternative: SortableList, the more common name in other libraries.
4. **Move controls by default.** Recommended: visible Move up and Move down buttons on each row, with `moveControls="menu"` for long or narrow lists. Alternative: the Move menu by default (Atlassian's), quieter rows, one more press per move.
5. **Keyboard shortcuts for moving.** Recommended: Alt+Arrow Up and Down to move, Alt+Arrow Right and Left to indent and outdent in TreeBuilder, beside React Aria's keyboard drag. Alternative: no shortcuts, only React Aria's keyboard drag and the buttons or menus, which avoids every key conflict and is slower.
6. **Locked rows in the middle.** Recommended: they hold their places and other rows skip over them. Alternative: a locked row is a wall that no row crosses, which splits the list into parts.
7. **The position line after drags.** Recommended: say it after every move, drags included, after React Aria's "Drop complete." Alternative: only after buttons, menus and shortcuts, leaving drags to React Aria's words, if the screen reader pass finds the two messages collide.
8. **Persian drag strings.** Recommended: accept React Aria's fallback, document it, report it upstream; the library's own words cover every move. Alternatives: patch React Aria's strings in the library (a fork to maintain); or turn off React Aria's keyboard drag in locales without strings, leaving buttons and shortcuts.
9. **The grab cursor.** Recommended: `grab` and `grabbing` on the handle, a recorded deviation from the one cursor rule. Alternative: `pointer`, as every control, and the grip glyph alone says it drags.
10. **ReorderList's value.** Recommended: the rows themselves, `value` and `onChange(rows)`, as Repeater's ruling. Alternative: an array of ids, with the rows passed separately as `items`.
11. **Form names for an order.** Recommended: one hidden input per row under `name`, in order, read with `getAll`, and `enabledName` for the rows switched on. Alternative: one hidden input of JSON, which a server action must parse and check.
12. **TreeBuilder's form value.** Recommended: ids depth first under `name` and parent ids beside them under `parentName`, rebuilt by the exported `buildTree`. Alternative: one hidden input of JSON.
13. **TreeBuilder's default depth.** Recommended: 3, a site menu's usual limit. Alternatives: 2; or no limit by default, the app setting one.
14. **Where TreeBuilder's editor goes.** Recommended: a region of the part, beside the tree from 48rem of its box and under it below. Alternatives: inline under the row, as WordPress does, which puts fields inside a `treegrid`; or the app's SidePanel, which the docs can still show.
15. **Removing a tree node.** Recommended: ask when it has children, not for a leaf, since the tree is unsaved until the SaveBar. Alternatives: always ask; never ask.
16. **Where an indented node lands.** Recommended: the last child of the sibling above it, as an outline editor does. Alternative: the first child.
17. **MasterDetailList's selection.** Recommended: a press, Enter or Space selects, and the arrows only move focus. Alternative: selection follows focus, as tabs and Outlook do, which swaps the detail on every arrow press.
18. **Focus after a selection on the wide face.** Recommended: it stays on the row; the detail is next by Tab. Alternative: to the detail's heading, PanelLayout's rule, which makes browsing the list one item per round trip.
19. **MasterDetailList on a narrow box.** Recommended: PanelLayout's two faces with Back, driven by state. Alternative: the list stacked over the detail, simpler, with the detail far below a long list.
20. **Remove in MasterDetailList.** Recommended: always ask with ConfirmDialog, the parent spec's row, since a record holds many fields. Alternative: no question, as Repeater, since nothing is saved until the SaveBar.
21. **Mounted details.** Recommended: only the selected record's detail by default, `keepsDetailsMounted` for a plain form that posts every record. Alternative: every detail mounted by default, the source's way, heavier and with hidden invalid fields to handle on every page.
22. **TransferList's layout.** Recommended: the chosen pane first in the DOM and at the inline start, the panes paired from 44rem, so the value is read first at every width. Alternative: the classic available at the start and chosen at the end, which puts the chosen list last on a phone.
23. **Choosing in TransferList.** Recommended: tick in the available list, Remove in the chosen list, no buttons between. Alternative: the classic dual listbox, select then a button to move, two presses per item.
24. **Who searches.** Recommended: the part filters `items` itself unless the app passes `onSearchChange`, then the app searches. Alternative: always the app.
25. **The chosen list's order.** Recommended: unordered by default, `allowsReordering` for an ordered value. Alternative: always reorderable.
26. **Paging in TransferList.** Recommended: the library's Pagination under the available list, the source's pager. Alternative: "Load more" at the list's end, which keeps one scroll but loses a page's place.
27. **Too few chosen.** Recommended: validity on submit through a visually hidden input, focus to the search field on `invalid`. Alternative: the app's own check before submit, with only `errorMessage` from the library.
28. **An interactive "+3".** Recommended: static, with every hidden name in its accessible name; an app wraps the group in its own Button or Link to open a list. Alternative: a button that opens a Popover listing everyone, Atlassian's, which makes AvatarGroup a client part.
29. **AvatarGroup's `max`.** Recommended: 4, drawing all when only one would hide. Alternatives: 3 or 5; or always "+1" for consistency.
30. **Dragging between TransferList's lists.** Recommended: no, ticking is one press. Alternative: allow a drag from available to chosen, a second way with a second set of drop targets to explain.
31. **Reordering in Repeater.** Recommended: not in this phase; the move model makes Move up and Move down a small later addition to Repeater's rows when a consumer asks. Alternative: add them now, while the model is fresh.

## 20. Size budget

Measured as the others, without React, React Aria, Lucide and `@internationalized/date`, to start at:

| Entry | Batch | Budget | Reason |
| --- | --- | --- | --- |
| `{ ReorderList }` | 10a | 4.5 kB | The move model, the handle, buttons and menu, the shortcuts, the focus restore, the status, the switch, the hidden inputs |
| `{ TreeBuilder, buildTree, flattenTree }` | 10a | 6 kB | The tree form of the model, the actions menu, the editor region, Add and Remove with ConfirmDialog; the list's shared code counted again, since an app may import only this |
| `{ AvatarGroup }` | 10b | 1.5 kB | Avatar's 616 B and the group's count and names |
| `{ MasterDetailList }` | 10b | 4.5 kB | Two faces, selection, the filter, Add, Remove with ConfirmDialog, the focus rules, the invalid listener |
| `{ TransferList }` | 10b | 5 kB | Two lists, search, Pagination, the limit, validity; ReorderList's code when `allowsReordering` is used is shared and measured with it in a second entry, `{ TransferList, ReorderList }`, at 7 kB |

The CSS adds about 8 kB to `styles.css` before compression over the two batches: 10a about 4 kB (`list-row.css` 1.5 kB, `reorder-list.css` 1 kB, `tree-builder.css` 1.5 kB), 10b about 4 kB (`avatar-group.css` 0.5 kB, `master-detail-list.css` 2 kB, `transfer-list.css` 1.5 kB). A part over its budget is reported with the number, and the limit follows the rule: the measured entry rounded up to the next 0.5 kB, plus 0.5 kB; each entry is measured also with React Aria not ignored, and the commit records both.

## 21. Baseline estimate

Each visual story is baselined in five modes (Rounded light, Rounded dark, Soft light, Square light, Rounded light at 375px), and a story tagged `density` adds compact, six.

| Batch | Group | Visual stories | Of them with compact | Baselines |
| --- | --- | --- | --- | --- |
| 10a | ReorderList | 10 | 3 | 53 |
| 10a | TreeBuilder | 11 | 2 | 57 |
| 10a | Pages/Navigation | 1 | 1 | 6 |
| 10a | Right to left | 2 | 0 | 10 |
| **10a** | | **24** | **6** | **126** |
| 10b | AvatarGroup | 4 | 0 | 20 |
| 10b | MasterDetailList | 11 | 2 | 57 |
| 10b | TransferList | 11 | 2 | 57 |
| 10b | Pages/Sharing | 1 | 1 | 6 |
| 10b | Right to left | 3 | 0 | 15 |
| **10b** | | **30** | **5** | **155** |
| **All** | | **54** | **11** | **281** |

The `Dragging`, `KeyboardDrag` and `DropInto` stories are captured mid-drag by their plays; if an engine's native drag cannot be held for a screenshot, the story draws the same state through React Aria's drag state in a story-only wrapper, and the plan records which. Existing baselines: none should change. Avatar's are untouched (AvatarGroup wraps Avatar and changes no rule of `avatar.css`); DataTable's row rules are reused by class or copied into `list-row.css` without changing `data-table.css`. Any change to an existing baseline is investigated before it is committed, and every new one goes through `pnpm --filter @snapshot-ui/storybook visual:docker`.

## 22. Release

- **Changesets,** minor for `@snapshot-ui/core` and `@snapshot-ui/react`, released together, naming no number:
  - 10a: `reorder-list.md`, `tree-builder.md`; a charts patch for its core peer.
  - 10b: `avatar-group.md`, `master-detail-list.md`, `transfer-list.md`; a charts patch.
- **Release notes,** short, per batch: what each part is for, its value's shape, the one prop most apps need (`hasSwitches`, `moveControls`, `maxDepth`, `editor`, `max`, `createItem`, `keepsDetailsMounted`, `onSearchChange`, `maxChosen`, `allowsReordering`), that SortableList is ReorderList with `hasSwitches`, and "Upgrade `@snapshot-ui/core` and `@snapshot-ui/react` together".

## 23. Owner rulings (owner, 2026-10-20)

The owner approved this spec on 2026-10-20 and took every recommendation of section 19, all 31 open questions, as written. Each ruling names the open question it settles; batch 10a's plan (`docs/plans/2026-10-20-ordering.md`) names the task that builds rulings 1 to 16 and 31, and 10b's plan will name the rest.

1. **The split and the order** (open question 1). Two batches, each a minor release: 10a Ordering (ReorderList, TreeBuilder), then 10b Choosing (AvatarGroup, MasterDetailList, TransferList).
2. **ReorderList and SortableList** (open question 2). One part, ReorderList, with `hasSwitches` and `isLocked`; no SortableList export.
3. **The name** (open question 3). ReorderList.
4. **Move controls by default** (open question 4). Visible Move up and Move down buttons on each row; `moveControls="menu"` for long or narrow lists.
5. **Keyboard shortcuts** (open question 5). Alt+Arrow Up and Down move a row; Alt+Arrow Right and Left indent and outdent in TreeBuilder, in the drawn direction; React Aria's keyboard drag stays.
6. **Locked rows in the middle** (open question 6). They hold their places, and other rows skip over them.
7. **The position line after drags** (open question 7). Said after every move, drags included, after React Aria's "Drop complete."
8. **Persian drag strings** (open question 8). React Aria's fallback is accepted, documented and reported upstream; the library's own words cover every move.
9. **The grab cursor** (open question 9). `grab` and `grabbing` on the handle, a recorded deviation from the one cursor rule.
10. **ReorderList's value** (open question 10). The rows themselves, `value` and `onChange(rows)`.
11. **Form names for an order** (open question 11). One hidden input per row under `name`, in order, read with `getAll`; `enabledName` for the rows switched on.
12. **TreeBuilder's form value** (open question 12). Ids depth first under `name`, parent ids under `parentName`, rebuilt by the exported `buildTree`.
13. **TreeBuilder's default depth** (open question 13). 3.
14. **Where TreeBuilder's editor goes** (open question 14). A region of the part, beside the tree from 48rem of its box and under it below.
15. **Removing a tree node** (open question 15). Ask when it has children; never for a leaf.
16. **Where an indented node lands** (open question 16). The last child of the sibling above it.
17. **MasterDetailList's selection** (open question 17). A press, Enter or Space selects; the arrows only move focus.
18. **Focus after a selection on the wide face** (open question 18). It stays on the row.
19. **MasterDetailList on a narrow box** (open question 19). PanelLayout's two faces with Back, driven by state.
20. **Remove in MasterDetailList** (open question 20). Always asks with ConfirmDialog.
21. **Mounted details** (open question 21). Only the selected record's detail by default; `keepsDetailsMounted` for a plain form that posts every record.
22. **TransferList's layout** (open question 22). The chosen pane first in the DOM and at the inline start; the panes paired from 44rem.
23. **Choosing in TransferList** (open question 23). Tick in the available list, Remove in the chosen list, no buttons between.
24. **Who searches** (open question 24). The part filters `items` unless the app passes `onSearchChange`.
25. **The chosen list's order** (open question 25). Unordered by default; `allowsReordering` for an ordered value.
26. **Paging in TransferList** (open question 26). The library's Pagination under the available list.
27. **Too few chosen** (open question 27). Validity on submit through a visually hidden input, focus to the search field on `invalid`.
28. **An interactive "+3"** (open question 28). Static, with every hidden name in its accessible name.
29. **AvatarGroup's `max`** (open question 29). 4, drawing all when only one would hide.
30. **Dragging between TransferList's lists** (open question 30). No.
31. **Reordering in Repeater** (open question 31). Not in this phase.

## Owner actions

1. **Review this spec** and rule on the open questions of section 19. Done on 2026-10-20: section 23.
2. **Merge the settings, choices and inputs batches first,** each with its Version Packages pull request, so 10a starts from their release and the baseline count is known; 10a's ReorderList and MasterDetailList rest on batch 7's Repeater and PanelLayout rules.
3. **Devices and screen readers before each release:** VoiceOver on macOS and iOS, NVDA on Windows and TalkBack on Android for the questions marked "to verify" in sections 7 to 12, above all React Aria's keyboard and screen reader drag and the position line after it (risk R4); a drag by touch on an iPhone and an Android phone (risk R1); Alt+Arrow keys on Windows (risk R6); Windows' contrast themes for the drop indicator, the selected record and a ticked item. Recorded in each Appendix B section; until then "not yet verified".
4. **Docker, for the baselines,** once after the last task of each batch.
5. **Upstream:** if the spike confirms them, report React Aria's missing Persian drag strings and any Escape that reaches a dialog during a drag.
6. **Ask the first consumer** whether it needs any of these parts soon, and which: a menu builder, an ordered list with switches, a list of records beside their fields, a long list to choose from; the answers may reorder section 2.
