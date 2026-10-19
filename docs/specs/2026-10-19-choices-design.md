# Choices: Accordion, TagInput, ChoiceCards and PositionPad: design

Status: approved on 2026-10-19. Written for the owner's review with a recommended answer to each open question of section 15; the owner took every recommendation, and section 19 records the rulings. Everything else is decided here and listed in section 11.
Parent spec: `docs/specs/2026-10-10-snapshot-ui-design.md`. This document completes phase 2 of the parent spec's catalog, "Choice controls and overlays", by taking its last four rows: TagInput, ChoiceCards, PositionPad and Accordion. Every other phase 2 row has shipped. It answers no consumer request: it is the library's own roadmap, so the parent spec's rows and the source app's behaviors they name are the input (section 3). The design authority remains `docs/design-system.md`.
Released before this: batch 4 ("Documents"), `@snapshot-ui/core` and `@snapshot-ui/react` 0.7.0. In flight at the time of writing: batch 5 ("Accounts", 0.8.0, `docs/specs/2026-10-18-accounts-design.md`) and batch 6 ("Insights", 0.9.0 and `@snapshot-ui/charts` 0.2.0, `docs/specs/2026-10-18-insights-design.md`). This batch takes nothing from either and builds on whichever has merged when its plan starts. It is the next minor release of core and react after those two: 0.10.0 if they release as 0.8.0 and 0.9.0.

## Summary for the owner

What this batch adds, in plain words:

- **Accordion**: a stack of sections, each a title you press to show or hide what is under it, for a long settings form split into sections or a page of questions and answers. Several sections can be open at once by default, or one at a time. A folded section that holds an unsaved change shows the same clay dot a folded card shows, opens itself when a field in it fails on submit, and opens when the browser's find-in-page lands in it. It is built from the CollapsibleCard you already have, as rows rather than cards.
- **TagInput**: a field where a reader types or pastes a list, each value becoming a small tag: email addresses to invite, domains to allow, paths to exclude. Pasting "ana@example.com, bo@example.com" adds two tags at once. Backspace in the empty field takes the last tag back into the text so it can be fixed. Three presets clean and check emails, domains and paths; a value that does not pass stays in the text with an error, so nothing invalid is ever saved. It looks and behaves like MultiSelect, without the list of options.
- **ChoiceCards**: a single choice drawn as cards instead of radio rows, each with a title, an optional sentence, an optional icon or picture and an optional detail such as a price. The chosen card has a firm ink edge and a filled check. It is a radio group underneath, so it submits in a plain form and the arrow keys work as they do in every radio group.
- **PositionPad**: a small 3 by 3 grid for choosing where something sits (top left, center, bottom right), with arrow keys that move in two directions. It is also a radio group underneath, with nine named options.

Why: these are the four parts of phase 2 not yet built, and each is a pattern a settings app reaches for often. None of them needs anything new from React Aria beyond what 1.22.1 already ships.

What it does not add: suggestions while typing in TagInput (MultiSelect covers choosing from a list), several choices at once in ChoiceCards, content revealed under a chosen card, remembering which accordion sections were open, and a PositionPad that shows a preview of the alignment. Section 15 asks about each.

## 1. Goal

Finish phase 2 with the four choice and disclosure parts it lists, each held to the bar the later batches set: React Aria's behavior, real form submission and reset, the changed, invalid and disabled states the field contract asks for, server HTML that is final or close to it, right to left, compact density and a coarse pointer, forced colors, and the concentric corner and intrinsic size rules of the design record. Ship them as one minor release of core and react.

The hard parts:

- **Accordion** must reuse CollapsibleCard's fold (the grid row, `hidden="until-found"`, the folded marker, the open on an invalid field) under React Aria's `DisclosureGroup`, whose state decides which item is open, without forking that code. The fold's hooks were written for one card that owns its own state.
- **TagInput** owns text that turns into values: paste that splits, a delimiter typed on an Android keyboard that reports no key, an input method composing Persian or Chinese text that must not commit half a word, duplicates, a limit, and a form value that the browser can submit and reset with no React Aria hidden input to lean on.
- **ChoiceCards** puts rich content inside a radio's `label`, where every word would join the radio's name unless the name is pointed at the title alone, and puts rounded tiles inside rounded cards, where the corner rule applies.
- **PositionPad** gives a radio group two-dimensional arrow keys, which the WAI-ARIA radio group pattern does not describe, and must still read correctly to a screen reader that expects a radio group.

Build order, which is also the plan's order, from the least risk to the most, so the shared rules land first:

1. **ChoiceCards** (section 7): on RadioGroup and Radio, with the rule for a tile inside a holder (section 9).
2. **PositionPad** (section 8): on RadioGroup, the two-dimensional keys proved in a spike first (risk R4).
3. **Accordion** (section 5): on `DisclosureGroup` and CollapsibleCard's hooks, after a spike that runs them under the group (risk R1).
4. **TagInput** (section 6): on `TextField` and `TagGroup`, after a spike of the input, the tags, paste and composition (risks R2 and R3), sharing MultiSelect's frame.
5. **The Settings recipe, the guides and the changesets** (section 13).

Out of scope, each recorded where it is deferred:

- **Suggestions in TagInput** (MUI's `freeSolo` with options). Choosing from a list is MultiSelect's; a list that also takes new values is a later `allowsCustomValue` on MultiSelect or a `suggestions` prop here (open question 12).
- **Several choices in ChoiceCards** (Polaris' `allowMultiple`). A later CheckboxGroup twin that reuses the same CSS (open question 15).
- **Content revealed under a chosen card or radio** (GOV.UK's conditional reveal, Polaris' `renderChildren`). It belongs to ConditionalFields (parent spec, phase 5), which makes hidden fields inert rather than unmounting them (open question 18).
- **Remembering open accordion sections** across visits (GOV.UK's session memory, CollapsibleCard's `storageKey`). Open question 4.
- **Rich previews in PositionPad** (Figma's alignment bars, a thumbnail of the element being placed). Open question 23.
- Number, list and plural formatting, as everywhere: every count and every sentence is the app's string or an English default the app replaces.

## 2. Depends on

| From batch 4 or earlier | Used here as |
| --- | --- |
| `CollapsibleCard`'s hooks (`collapsible-card/`): `useFolding(foldRef, toggleRef, isExpanded)` and its `data-instant` and `data-folding` marks, `useHoldsChange(foldRef, isFolded)`, `useOpenOnInvalid(foldRef, isFolded, open)`; the fold's CSS in `card.css` (the `1fr` to `0fr` grid row over 200ms, `hidden="until-found"`, the clip while folding), the chevron and its `--card-chevron-turn` from the nearest `dir`, the clay folded marker and its hidden "Changed" description | Accordion's fold, its marker, its open on an invalid field, its find-in-page reveal (section 5) |
| `RadioGroup` and `Radio` (`radio-group/`): React Aria's `RadioGroup`, `RadioField` and `RadioButton`, the `field radio-group` root, the 20px `radio-indicator` dot with its masked check, the native twins (`:has(input:checked)`, `:has(input:focus-visible)`, `:has(input:disabled)`), the error edge on every option while invalid, the chip with no edge while changed, React Aria's form reset in `useRadio` | ChoiceCards' and PositionPad's group, form value and reset (sections 7 and 8) |
| `SegmentedControl`'s track (`segmented.css`): Raised fill, 1px `--color-boundary` edge, options 4px inside it and concentric with it, the ink chosen fill with canvas content, the inset canvas focus ring on ink, the changed and invalid edges on the track, `highlight` for the chosen option in forced colors with `forced-color-adjust: none` | PositionPad's track and cells (section 8) |
| `MultiSelect`'s frame and tags (`multi-select.css`): `.input` on a `div` that grows a row at a time, `min-height: var(--size-field)`, the 4.5px block padding, the corner `min(var(--radius-pill), calc(var(--size-field) / 2))`, the bone tags concentric with the frame, the 20px remove circle hit at 24px, the tags as one tab stop before the input, the focus ring keyed on the input in `:where()`, the read-only and disabled rules | TagInput's frame and tags, shared by selector rather than copied (section 6.7) |
| The field parts: `FieldHead`, `Description`, `FieldError`, `useChangedDescription`, `FieldChanged`, `FieldChangedMark` (the unlabelled changed dot, documents ruling 16), `FieldCounter`, `data-unlabelled` | Every part's label row, hint, error line and Changed chip; TagInput's count against `maxValues` |
| `Card` and the holder properties (`card.css`): `--holder-radius`, `--holder-border`, `--holder-pad`, `--holder-corner-inset`; the rule for a card or tile in a card, `max(var(--radius-micro), calc(var(--radius-stadium) - 1px - var(--spacing-card)))` | A choice card's corner in a holder (section 9); every part in the `InCard` stories |
| `packages/react/src/stories/corner.ts` and the concentric audit (`apps/storybook/tests/concentric`) | Every new story, in three shapes |
| `Button` (tertiary) | Accordion's "Show all sections" (open question 3) |
| The status host pattern (`ToastRegion`, UploadTray): a polite `role="status"` mounted empty in the server's HTML, keyed messages, `QUIET_MS` (600ms) | TagInput's announcements |
| `useControllableState`, `useWarnOnce`, `useHydrated`, `cx`, `present`, `mergeRefs`, `composeRenderProps`, `AccessibleName` | As everywhere |

React Aria 1.22.1 parts used for the first time: `DisclosureGroup` (and `DisclosureStateContext`, `DisclosureGroupStateContext`), `TextField` around a frame that also holds a `TagGroup`, and `RadioGroupStateContext` for PositionPad's keys. `TokenField`, which 1.22.1 also ships, is considered and rejected for TagInput (section 6.9). Every part is a client part.

## 3. What this batch answers

The parent spec's phase 2 rows, as input:

| Row | Source | React Aria basis | Notes in the parent spec |
| --- | --- | --- | --- |
| TagInput | `js/value-list.js` | TagGroup, TextField | Paste splits a list. Backspace takes the last tag back. Presets for emails, domains and paths. |
| ChoiceCards | `js/choice-cards.js` | RadioGroup | Icon and picture variants. |
| PositionPad | `js/position-pad.js` | RadioGroup | 3x3 grid with two-dimensional arrow keys. |
| Accordion | new, from CollapsibleCard | DisclosureGroup | |

The source paths are relative to the source app, which `.local/SOURCE.md` locates. That file is gitignored and is not in the worktree this spec was written in, so this spec works from the parent spec's descriptions and the library's own records. The plan reads the three source files before the parts that port them and records every difference from this spec as a correction, as earlier plans did (risk R9). Accordion is new and needs a recorded derivation in the design record before it is built (parent spec, section 3).

The rules for every part, unchanged from batch 4: `'use client'` only on interactive parts; no `Intl` formatting and no `window` at render, and no first-paint measurement; no external request and no injected script; light and dark, all three shapes, right to left (the Persian guide), comfortable and compact density; WCAG 2.2 AA including 2.5.8; everything exported from the react index, with the CSS in `core/styles.css`; no new tokens without a measured reason.

## 4. Approach

**Build on the parts that already behave.** Two of the four are radio groups with a different face, so they take React Aria's `RadioGroup` whole: its single tab stop, its arrow keys, its native radio inputs, its form value and its form reset. The third is a disclosure group, so it takes CollapsibleCard's fold, already measured in three engines, rather than writing a second one. The fourth is MultiSelect without a list, so it takes MultiSelect's frame and tags by selector and adds only what turns text into values.

**Native first, then enhanced.** ChoiceCards and PositionPad draw every state from their native inputs as well as React Aria's attributes, as RadioGroup does, so before hydration a press on a card checks its radio, the card draws chosen, and the form submits it. TagInput's tags and hidden inputs are in the server's HTML, so a form submitted before hydration sends the values already there.

**The value is always valid.** TagInput never puts a value it could not clean and check into its value: what fails stays in the text box, with the error line saying why (open question 8). An app reads `value` and saves it.

**Layout without containment.** None of the four is a size container. ChoiceCards lays its cards out with an auto-filling grid, which wraps without a query; the others are fields that fill their column. So the intrinsic size rule (a size container takes no width from its content) does not arise, and section 9 says why each part was kept free of it.

| Part | In the server's HTML | After hydration |
| --- | --- | --- |
| Accordion | Every item's heading and toggle with `aria-expanded`; open panels with their content; folded panels with `hidden` | Toggling, the fold's motion, `hidden="until-found"`, the arrow keys, the folded marker |
| TagInput | The label, the frame, a tag per value, a hidden input per value, the text box, the empty status host | Typing, delimiters, paste, Backspace, removing, announcements |
| ChoiceCards | Every card as a `label` around a native radio, the chosen one `checked` and drawn chosen | React Aria's focus and keys; before then the browser's own radio keys and the native twins draw every state |
| PositionPad | The track, nine cells as native radios, the chosen one `checked` | The two-dimensional keys; before then the browser's own radio keys |

Rejected along the way:

- **Accordion as a group of CollapsibleCards** (one card per section): each card has its own state and its own heading look, and a group that forces one open would have to control every card from outside, while `DisclosureGroup` already owns that. The rows look is the accordion's; a column of CollapsibleCards stays the pattern for a settings page whose sections are cards (open question 5).
- **React Aria's `TokenField` for TagInput.** It is a `contenteditable` field with inline tokens, made for prompt fields and mentions: its value is a list of text and token segments, it has no `name` or hidden inputs, its role is `textbox` with tokens inside the editable text, and it is new in 1.22.1 with no record in this library. A tag input's value is a list of strings and the frame of tags and a plain input is already proven by MultiSelect (section 6.9).
- **A `grid` role for PositionPad.** Section 8.5 and open question 20.
- **ChoiceCards as a ListBox with single selection.** A listbox is a widget a screen reader enters in focus mode and it submits nothing; a radio group is what the choice is, and it submits by itself.
- **A container query for ChoiceCards' layout** (cards in a row from some width, stacked under it): an auto-filling grid does the same with no containment and no stand-in width (section 9).

## 5. Accordion

### 5.1 Anatomy

```
Show all sections                                          (optional)
--------------------------------------------------------------------
Billing address                                                  v
--------------------------------------------------------------------
Notifications  o                                                 >
Email, push and digest settings
--------------------------------------------------------------------
Danger zone                                                      >
```

The `o` is the folded marker; `v` and `>` are the chevron open and folded (in right to left the folded chevron points left, toward the title). Rules sit between items only.

### 5.2 API

```ts
export interface AccordionLabels {
  /** The "show all" button while any item is folded. @default 'Show all sections' */
  showAll: string;
  /** The same button while every item is open. @default 'Hide all sections' */
  hideAll: string;
}

export interface AccordionProps extends Omit<RACDisclosureGroupProps, 'className' | 'children' | 'allowsMultipleExpanded'> {
  /** AccordionItem elements, in order. */
  children: ReactNode;
  /**
   * Several items open at once. Off, opening one folds the one that was open.
   * @default true (React Aria's own default is false; open question 1)
   */
  allowsMultipleExpanded?: boolean;
  /** The heading element of every item's title. The look is the same at every level. @default 3 */
  level?: 2 | 3 | 4 | 5 | 6;
  /** Shows a tertiary "Show all sections" button above the items. Needs `allowsMultipleExpanded`. @default false */
  hasExpandAll?: boolean;
  labels?: Partial<AccordionLabels>;
  className?: string;
  ref?: Ref<HTMLDivElement>;
}

export interface AccordionItemProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title' | 'id'> {
  /** The item's key, matching `expandedKeys`. Required, so a controlled accordion can name it. */
  id: Key;
  /** The title: the toggle's text and its accessible name. */
  title: ReactNode;
  /** A line under the title in slate, shown open or folded: "Email, push and digest settings". */
  note?: ReactNode;
  isDisabled?: boolean;
  /** Marks the folded item as changed when no field in its panel reports `data-changed`. */
  isChanged?: boolean;
  /** Read with the toggle while the folded marker shows. @default 'Changed' */
  changedLabel?: string;
  /** The panel's content. */
  children?: ReactNode;
  ref?: Ref<HTMLDivElement>;
}
```

`expandedKeys`, `defaultExpandedKeys`, `onExpandedChange` (a `Set<Key>`) and `isDisabled` are React Aria's `DisclosureGroup` props, so an app that knows React Aria's accordion reads this one. An item is folded unless its key is in `defaultExpandedKeys` or `expandedKeys`.

### 5.3 Behavior

- **Markup.** `div.accordion` is React Aria's `DisclosureGroup`. With `hasExpandAll`, `div.accordion-controls` holds the tertiary Button first. Each `AccordionItem` is React Aria's `Disclosure` as `div.accordion-item[data-expanded]`, holding `hN.accordion-heading` (the level from the accordion, through context) with React Aria's `Button slot="trigger"` as `button.accordion-toggle` (`span.accordion-toggle-text` with the title and, while marked, `span.accordion-marker`; then the 24px Lucide `ChevronDown`, `aria-hidden`), then `p.accordion-note` when given, then React Aria's `DisclosurePanel` as `div.accordion-fold` holding `div.accordion-body`. The note sits outside the button, under the heading, as CollapsibleCard's does, so the toggle's name is the title alone.
- **One fold, two parts** (decided here, item 2). The item reads its expanded state from React Aria's `DisclosureStateContext` in a child component and hands it to the same `useFolding`, `useHoldsChange` and `useOpenOnInvalid` CollapsibleCard calls; nothing in those hooks assumes the card owns the state, since each takes the state and a setter. The setter is the group's `toggleKey(id)` through the item's own state. Risk R1 holds the spike that proves it.
- **Single or several.** With `allowsMultipleExpanded` (the default here, open question 1) items open and fold on their own. Without it, opening an item folds the open one, both moving at once in 200ms; React Aria lets the open item fold too, leaving none open, which this spec keeps (Radix's `collapsible`, the WAI-ARIA pattern's optional rule against it is not taken).
- **Show all sections** (open question 3). With `hasExpandAll` and several allowed, the button opens every enabled item, or folds every item once all are open, and changes its words between `labels.showAll` and `labels.hideAll`; it carries `aria-expanded` (true once every enabled item is open) and `aria-controls` naming every panel, as GOV.UK's "Show all sections" does (to verify that GOV.UK sets `aria-controls`). Without several allowed it is not drawn and warns once in development.
- **The folded marker.** CollapsibleCard's, unchanged: a folded item that holds a change (`isChanged`, or any element in its panel carrying `data-changed`) shows the 8px clay dot after the title's last word, and the toggle is described by a hidden `changedLabel`. A folded title keeps the dot's room, so the title never moves when the dot comes and goes.
- **Opening for an invalid field.** CollapsibleCard's: a field in a folded panel that fails the browser's validation on submit opens its item, drawn at once (`data-instant`), before the field takes focus. Without several allowed, opening it folds the item that was open; the browser focuses only the first field that failed, so only its item opens.
- **Find-in-page.** React Aria sets `hidden="until-found"` on a folded panel once its transitions end; a match opens the item through the group's state, drawn at once. Without several allowed, the item that was open folds. The qualification CollapsibleCard records for a server-rendered folded panel applies (it carries `hidden=""` until hydration, which no browser searches).
- **Focus.** An item that folds while focus is in its panel moves focus to its toggle, CollapsibleCard's rule. "Show all" keeps focus on itself.
- **Disabled.** A disabled item's toggle is disabled (React Aria), its panel keeps the state it had; a disabled accordion disables every toggle and "Show all".
- **Nested accordions** work (each item reads its own nearest state), and the docs advise against them, as GOV.UK and the Nielsen Norman Group do.
- **When not to use it** (docs). Content most readers need belongs on the page, not folded; GOV.UK's guidance says to test whether an accordion helps before using one. A form split into sections that each need their own heading and actions is a column of CollapsibleCards; a choice between views is Tabs.

### 5.4 Keys and screen readers

Against the WAI-ARIA Authoring Practices' accordion pattern:

- **Required parts, met.** Each header is a `button` inside an element with role `heading` and a level; the button has `aria-expanded` and `aria-controls` naming its panel (React Aria writes both); Enter and Space toggle; Tab moves through the toggles and into an open panel's content in page order.
- **Optional keys, taken** (open question 2). Arrow Down and Arrow Up move focus to the next and previous enabled toggle of the same accordion, and Home and End to the first and last, without wrapping and without changing any item. The handler sits on the accordion and acts only when the event's target is one of its own toggles, so a nested accordion handles its own and a field in a panel keeps its arrows. React Aria's `DisclosureGroup` has no arrow keys (checked in the 1.22.1 source), so the library adds them, as Radix's accordion has them.
- **Optional parts, not taken.** The pattern allows `aria-disabled="true"` on the open toggle of an accordion that may not be all folded; this one may be all folded, so no toggle is locked. The panel keeps React Aria's role (`group` by default in 1.22.1, named by its toggle) rather than `region`, since the pattern warns against many regions and an accordion of FAQs can have dozens.
- **What a reader hears.** "Notifications, button, collapsed, Changed" on a folded, marked toggle in NVDA (to verify), the heading's level from the heading list, and the note as the next line in browse mode. "Show all sections, button, collapsed" until every item is open.

| Key | Does |
| --- | --- |
| Tab, Shift+Tab | Through "Show all", each toggle, and the content of open panels, in page order. |
| Enter, Space | On a toggle, opens or folds its item; on "Show all", opens or folds every item. |
| Arrow Down, Arrow Up | On a toggle, to the next or previous enabled toggle of the same accordion; no wrap. |
| Home, End | On a toggle, to the first or last enabled toggle. |

### 5.5 Forms, changed, validation and disabled

- **No value of its own.** The accordion holds no form value, takes no `name`, and a form's reset does not fold or open anything. Fields in a folded panel stay in the form and submit: a folded panel is `hidden`, and hidden controls still submit (only `disabled` ones do not).
- **Changed** is the folded marker (section 5.3); an open item shows nothing of its own, since each changed field shows its own chip and edge.
- **Invalid** opens the item (section 5.3); the accordion draws no invalid state of its own.
- **Disabled** as section 5.3.

### 5.6 Look and CSS

- **Rows, no frame.** The accordion draws no fill, edge or corner. A 1px `--color-divider` rule sits between items, none above the first and none under the last, the DescriptionList's rule, so an accordion ends flush at a card's padding and an app frames one on the page with a Card.
- **The toggle row.** `min-block-size: max(var(--size-target), var(--size-field))`, 48px, 40px compact and 44px compact on a coarse pointer (the Dense data row); block padding that centers one line of the title in it, and a title that wraps grows the row. The title is `--text-body` at weight 500 in ink, `overflow-wrap: anywhere`; the chevron is CollapsibleCard's 24px slate chevron at the row's end, level with the first line, ink on hover where hover exists and on a press, turned toward the title while folded by `--card-chevron-turn`. No hover wash: the row is not a surface (section 9).
- **The note.** `--text-small` in slate, `var(--spacing-part)` under the title, inside the row's padding, shown open or folded.
- **The body.** Its content starts at the title's start, `padding-block-end: var(--spacing-peer)`, with the Card body's grid (24px between peers), so fields in a panel take the same rhythm as fields in a card.
- **The fold.** CollapsibleCard's technique in `accordion.css`'s own selectors (decided here, item 3): the grid row from `1fr` to `0fr` in 200ms `ease`, the chevron's turn and the body's end padding moving with it, the clip only while folded or folding, `data-instant` drawing at once. A core test asserts the duration and easing equal `card.css`'s, so the two cannot drift. Reduced motion stops all three.
- **Focus.** The ring on the toggle is the standard 2px ink ring at 2px, with `--radius-micro` (the title's ring, a text-sized part).
- **Disabled.** Title and chevron taupe, `cursor: not-allowed`, no hover.
- **"Show all sections".** A tertiary Button at the inline end above the first item, `margin-block-end: var(--spacing-part)`.
- **Contrast.** Every color is gated already on lifted (CollapsibleCard): ink 17.84 and 17.42, slate 5.31 and 6.94, clay 6.81 and 6.82. An accordion also sits on the canvas, where CollapsibleCard never does: ink 16.25, slate 4.84 and clay 6.20 in light, from the design record's text color table; the plan measures the dark values and adds clay on canvas at 3:1 to the gate, since the dot carries meaning there too.

### 5.7 Server rendering, direction, density, pointer and forced colors

- **Server.** The server's HTML has every heading and toggle with `aria-expanded`, the open panels' content, and folded panels with `hidden=""`; no storage is read, so nothing differs at hydration. React Aria sets `until-found` after hydration.
- **Right to left.** Logical properties throughout; the chevron's folded turn is -90deg under `dir="rtl"` by CollapsibleCard's property; the arrow keys are Up and Down and do not mirror.
- **Compact density.** The row is 40px; the type and the rules do not change.
- **Coarse pointer.** The row is 48px in comfortable and 44px in compact, above the 40px floor; the whole row is the target.
- **Forced colors.** The rules are borders and survive in `canvastext`; the chevron takes the toggle's color (CollapsibleCard's block); the folded marker is drawn in `canvastext`; a disabled toggle is `graytext`.
- **Print** (open question 6). Folded panels print open: under `@media print` the fold's row is `1fr`, the panel is shown, and the chevron is hidden, so a printed FAQ or settings page has every answer. Polaris' `Collapsible` offers the same as `expandOnPrint` (to verify).

### 5.8 How others do it

| System | Part | Several open | Keys | Extras | What this spec takes |
| --- | --- | --- | --- | --- | --- |
| GOV.UK Design System | Accordion | Yes, always | Tab, Enter, Space | "Show all sections"; a summary line under each heading; "Show" and "Hide" words with a chevron in each button; open sections remembered for the session (to verify the default); headings `h2` by default; find-in-page support (to verify the version) | Several open, the "Show all sections" words and its state, the summary line as `note`; not the session memory (open question 4) |
| Shopify Polaris | `Collapsible`, no accordion part (to verify for the newest Polaris) | The app's | The app's trigger | `expandOnPrint`, a `transition` prop | Printing folded content open (open question 6) |
| Radix UI | `Accordion` | `type="single"` or `"multiple"`, `collapsible` for single | Tab, Enter, Space, Arrow Up and Down between triggers, Home, End (to verify whether it wraps) | `Accordion.Header` is an `h3`; the content's height as a CSS variable for animation | The arrow keys and Home and End, the `h3` default |
| React Aria | `DisclosureGroup` and `Disclosure` | `allowsMultipleExpanded`, false by default | Tab, Enter, Space | `hidden="until-found"` and find-in-page | The basis, with several open by default (open question 1) |
| WAI-ARIA APG | Accordion pattern | Either | Required: Enter, Space, Tab. Optional: arrows, Home, End | Optional `region` panels, optional locking of the open header | The required parts, the optional keys, `group` panels |

## 6. TagInput

### 6.1 Anatomy

```
Invite people                                              2/10
+-------------------------------------------------------------+
| (ana@example.com x) (bo@example.com x) [type an address__]  |
+-------------------------------------------------------------+
Separate addresses with commas or spaces.
```

`2/10` is the FieldCounter, shown with `maxValues`. The frame grows a row at a time, as MultiSelect's does.

### 6.2 API

```ts
export interface TagInputLabels {
  /** The tags' group name, read with the field's label: "Added, Invite people". @default 'Added' */
  added: string;
  /** Each tag's remove button, read with the tag's text: "Remove ana@example.com". @default 'Remove' */
  remove: string;
  /** Said after values are added, gathered over QUIET_MS. @default "Added ana@example.com", then "Added 12" */
  addedMessage: (values: readonly string[], format: (count: number) => string) => string;
  /** Said and shown when a value is already there. @default (value) => `${value} is already added` */
  duplicate: (value: string) => string;
  /** The error line past the limit. @default (max) => `You can add up to ${max}` */
  tooMany: (max: string) => string;
  /** Said when Backspace or Enter takes a tag back into the text. @default (value) => `Editing ${value}` */
  editing: (value: string) => string;
}

export interface TagInputPreset {
  /** Splits typed or pasted text into candidates, in order. */
  split: (text: string) => string[];
  /** Cleans one candidate: trims it, lowercases a domain, adds a path's leading slash. An empty result is dropped. */
  normalize: (value: string) => string;
  /** Whether a cleaned value may be added. */
  isValid: (value: string) => boolean;
  /** What makes two values the same. @default the value itself */
  key?: (value: string) => string;
  /** Characters that end a value as it is typed, besides Enter. */
  delimiters: readonly string[];
  /** Joins candidates that could not be added, to leave them in the text box. */
  join: string;
  /** The text box's attributes, so a phone shows the right keyboard and nothing is autocorrected. */
  inputProps?: Pick<InputHTMLAttributes<HTMLInputElement>, 'inputMode' | 'autoComplete' | 'autoCapitalize' | 'spellCheck' | 'dir' | 'enterKeyHint'>;
  /** The error line for candidates left in the text box, given their count as `formatCount` writes it. */
  invalidMessage: (count: string) => string;
}

/** The three presets, plain objects in a module without 'use client', so a server action can check with the same rules. */
export declare const emailPreset: TagInputPreset;
export declare const domainPreset: TagInputPreset;
export declare const pathPreset: TagInputPreset;

export interface TagInputBaseProps extends Omit<RACTextFieldProps, 'children' | 'className' | 'value' | 'defaultValue' | 'onChange' | 'validate' | 'type' | 'pattern' | 'minLength' | 'maxLength'> {
  label?: ReactNode;
  description?: ReactNode;
  errorMessage?: ReactNode | ((validation: ValidationResult) => ReactNode);
  /** Shown only while there are no tags. Taupe under a visible label, slate without one (MultiSelect's rule). */
  placeholder?: string;
  /** Whether the value differs from the saved one: the Changed chip and the changed edge, or the changed dot without a label. */
  isChanged?: boolean;
  /** @default 'Changed' */
  changedLabel?: string;
  /** The values, in the order added. Controlled. */
  value?: readonly string[];
  /** @default [] */
  defaultValue?: readonly string[];
  /** Called with the new values after an add, a removal or a take-back. Never with a value the preset refuses. */
  onChange?: (value: string[]) => void;
  /** The text being typed, which is not part of the value. Controlled and uncontrolled, React Aria's names. */
  inputValue?: string;
  defaultInputValue?: string;
  onInputChange?: (text: string) => void;
  /** How text becomes values. @default split on commas and new lines, trimmed, any non-empty text */
  preset?: TagInputPreset;
  /** The most values. Past it nothing is added, and the error line says so. */
  maxValues?: number;
  /** Adds the typed text when the field loses focus, if it passes. @default true (open question 9) */
  commitsOnBlur?: boolean;
  /** Checks the whole list, as React Aria's `validate` does for one value. */
  validate?: (value: readonly string[]) => ValidationError | true | null | undefined;
  /** How counts are written, such as in Persian digits. @default String */
  formatCount?: (count: number) => string;
  labels?: Partial<TagInputLabels>;
  className?: string | ((values: TextFieldRenderProps & { defaultClassName: string | undefined }) => string);
  ref?: Ref<HTMLDivElement>;
  inputRef?: Ref<HTMLInputElement>;
}

export type TagInputProps = TagInputBaseProps & AccessibleName<'label'>;
```

`name`, `form`, `isRequired`, `isDisabled`, `isReadOnly`, `isInvalid`, `validationBehavior` and `autoFocus` are React Aria's `TextField` props.

### 6.3 The presets

The source app ships these three (parent spec); its exact rules were not available to this spec (section 3), so the rules below are this spec's, to be compared with the source's in the plan (risk R9). Each is a courtesy: the docs say the server checks again, and the presets are importable on the server for that.

| | Emails | Domains | Paths |
| --- | --- | --- | --- |
| Split on | Commas, semicolons and new lines; then, in a piece holding `Name <address>`, the address; then white space | Commas, semicolons, white space and new lines | Commas, white space and new lines |
| Normalize | Trim; drop a `mailto:` and angle brackets; lowercase the domain part only | Trim; lowercase; drop a scheme (`https://`), a port, a path, a query and a trailing dot, so a pasted URL gives its host | Trim; a pasted URL gives its path; add a leading `/`; collapse runs of `/`; drop a trailing `/` except on the root |
| Valid when | The HTML standard's "valid email address" (what `<input type="email">` accepts) and at least one dot in the domain (decided here, item 10) | Two or more labels of 1 to 63 letters, digits or hyphens, no hyphen at a label's ends, a final label not all digits, 253 characters at most; a leading `*.` allowed as a wildcard; letters may be non-Latin, as typed | Starts with `/`, no white space, no `#`; `*` allowed as a wildcard |
| Same as | Case-insensitive | As normalized | Case-sensitive, as servers treat paths |
| Typed delimiters | `,` `;` space | `,` `;` space | `,` space |
| Text box | `inputMode="email"`, `autoComplete="off"`, `autoCapitalize="none"`, `spellCheck={false}`, `dir="ltr"` | `inputMode="url"`, the same | `inputMode="url"`, the same |
| Error words (English default) | "Enter email addresses in the correct format, like name@example.com" | "Enter domains like example.com" | "Enter paths that start with a slash, like /blog" |

The error words follow GOV.UK's pattern for an email field ("Enter an email address in the correct format, like name@example.com"), pluralized. The default with no preset splits on commas and new lines, trims, accepts any non-empty text, and compares exactly.

### 6.4 Behavior

- **Markup.** React Aria's `TextField` as `div.field.tag-input`, holding the `FieldHead` (with `FieldCounter` when `maxValues` is given, decided here, item 11), then `div.input.tag-input-control`, the frame, holding React Aria's `TagGroup.tag-input-tags` (named `labels.added` and the field's label, MultiSelect's naming) with `TagList` of `Tag.tag-input-tag` each with its remove `Button`, then `Input.tag-input-input`, then, while unlabelled and changed, the `FieldChangedMark`; then `Description`, `FieldError`, the hidden inputs (section 6.6) and `div.tag-input-status[role="status"]`, polite and clipped from sight. A press on the frame's empty room focuses the input, as MultiSelect's does.
- **Adding by typing.** Enter, or a delimiter, ends a value. The text is split, each candidate normalized, checked and compared, and the valid new ones are added in order. Delimiters are read from the input's text after each change (`onChange`), not from `keydown`, because Android keyboards report most keys as `Unidentified` (risk R3); Enter is read from `keydown`, which every keyboard reports. While an input method is composing (`isComposing`), nothing is split or committed, so a Persian or Chinese word is never cut in half. Enter in an empty text box is left alone, so a form submits as from any text field; Enter with text never submits.
- **Paste** (the source's behavior). A paste goes into the text box as usual; if the text box then holds a delimiter or a new line, it is split at once as if typed. So pasting "ana@example.com, bo@example.com" adds two tags, and pasting one address leaves it in the box for Enter.
- **What does not pass** (open question 8). A candidate that fails `isValid` is not added. The candidates that failed stay in the text box, joined by the preset's `join` (", " for emails), in their original order, and the field is invalid with the preset's error line, `invalidMessage(formatCount(n))`, until the text changes. The reader fixes the text and presses Enter again. The value never holds a value the preset refuses.
- **Duplicates.** A candidate whose `key` matches a tag, or an earlier candidate in the same paste, is dropped, and the status host says `labels.duplicate(value)` for one, or folds the count into the summary for a paste. The tag it matched is not moved.
- **The limit.** With `maxValues`, candidates past it are not added; they stay in the text box and the error line says `labels.tooMany(formatCount(max))`. The FieldCounter shows the count against the limit, "2/10", and never blocks typing (the parent spec's FieldCounter rule).
- **Backspace takes the last tag back** (the source's behavior). Backspace in an empty text box removes the last tag from the value and puts its text in the box with the caret at the end, and the status host says `labels.editing(value)`. The value is not lost, since it is in the box; Enter, a delimiter or leaving the field adds it again. This differs on purpose from MultiSelect's Backspace, which first focuses the last tag and removes it only on a second press: there a removed value is gone, here it is in the text box in plain sight. A Backspace held down takes back one tag and then deletes its text letter by letter, never a second tag in the same press.
- **Enter on a tag takes it back too** (open question 13). With focus on a tag, Enter removes it and puts its text in the box, with focus moving to the box, so a value in the middle of the list can be corrected without removing it and typing it again. Backspace and Delete on a tag remove it, React Aria's behavior, and focus goes to the next tag, or the previous one, or the box when none is left, MultiSelect's rule.
- **Leaving the field** (open question 9). With `commitsOnBlur`, valid text in the box is added when focus leaves the field (the frame, not a tag inside it), so an address typed and followed by a click on Save is not lost. Text that does not pass stays, with its error.
- **Escape** with text in the box clears the text and stops there, so a dialog around the field does not close on the same press; with an empty box it does nothing and the event goes on.
- **Announcements.** The status host says, through `labels`, once per `QUIET_MS`: what was added ("Added ana@example.com", or "Added 12" for a paste), what was already there, and a take-back. The error line, an `aria-describedby` of the input through `FieldError`, carries refusals and the limit; it is not repeated in the status.
- **Read only.** The tags stay a grid that can be focused and read, with no remove buttons, no Backspace or Enter take-back, and the text box read only, MultiSelect's rule.
- **Disabled.** MultiSelect's: the frame's disabled look, the box disabled, the tags taupe in a `group` with `aria-disabled`, not focusable.
- **Long values.** A tag's text ellipsizes past 12rem and keeps its whole text as its name, MultiSelect's rule. An email, a domain or a path is one word and never wraps.

### 6.5 Keys and screen readers

There is no WAI-ARIA Authoring Practices pattern for a tag input. The parts follow the patterns they are: the text box is a `textbox`, not a `combobox`, since nothing pops up; the tags are React Aria's `TagGroup`, a `grid` of rows each with a remove button, as MultiSelect's are, one tab stop with the arrow keys between tags in the drawn direction.

| Key | Does |
| --- | --- |
| Tab, Shift+Tab | To the tags (one stop, the last focused or the first), then the text box; on to the next field. |
| Characters | Type into the text box; a delimiter ends a value. |
| Enter | In the box with text, adds it; in an empty box, submits the form as a text field does. On a tag, takes it back into the box. |
| Backspace | In an empty box, takes the last tag back into the box. On a tag, removes it. |
| Delete | On a tag, removes it. |
| Arrow Left, Arrow Right | Between tags, in the drawn direction (React Aria's TagGroup). |
| Escape | In the box with text, clears the text. |
| Ctrl+V, Cmd+V | Paste; a list is split at once. |

A screen reader user hears the field's label and hint on the box, with the tags' text described after it (MultiSelect's description of its input by the tag group, recorded in its design record), "Added ana@example.com" after Enter, and the error line when a candidate stays in the box. React Aria's own "Press Delete to remove tag." on a focused tag has no Persian (MultiSelect's record).

### 6.6 Forms, changed, validation and disabled

- **Hidden inputs** (open question 10). One `<input type="hidden" name={name}>` per value, in order, in the server's HTML and after it, so `formData.getAll(name)` is the list. With no values, one empty value under the name, MultiSelect's shape, so a server reading both kinds of field writes one parser and can tell a list emptied by the reader from a field that is not on the form. The text box has no `name`: typed text that is not a value is never submitted.
- **Reset.** A `reset` listener on the input's form puts the value back to the value it had on the first render (`defaultValue`, or the controlled value then, as React Aria's `useFormReset` does) and clears the text box and the error line.
- **Required.** `isRequired` asks for at least one value. With `validationBehavior="native"` (React Aria's default) the text box carries the custom validity, so the browser's submit stops on it and focuses it; with `"aria"` the field is only marked. Text left in the box that did not pass also sets the custom validity, so a form never submits while a refused address sits in the field.
- **`validate`** receives the whole list and returns React Aria's validation result, run as React Aria runs its own on commit; `isInvalid` forces the invalid look.
- **Changed.** `isChanged` gives the Changed chip in the label row and the light signal orange edge on the frame, written once in `input.css` for every frame; without a label, the changed dot (`FieldChangedMark`) inside the frame, before the inline end, as every framed field draws it since 0.7.0. Invalid outranks changed.
- **Disabled and read only** as section 6.4.

### 6.7 Look and CSS

- **One object with MultiSelect** (decided here, item 9). The frame, the tags, the remove button, the focus ring keyed on the input, and the read-only and disabled rules are MultiSelect's, shared by selector: `multi-select.css`'s rules for the frame and the tags gain `.tag-input-control` and `.tag-input-tag` beside their own classes, in `:is()` lists that keep each rule's weight, so no drawn value of MultiSelect changes and its baselines stay byte-identical. `tag-input.css` holds only what differs.
- **What differs.** No field button and no spinner, so the frame's end padding is the text input's own, `1.5rem`, and the text box takes `flex: 1 1 8rem` so it wraps to a new row once less than 8rem is left beside the last tag. A `dir="ltr"` preset gives each tag's text `direction: ltr; unicode-bidi: isolate`, so an address keeps its order on a Persian page while the tags still run from the right.
- **The corner** (Nested radii, derived). The frame's corner is MultiSelect's, a pill while one row and the 24px surface step once it wraps; a tag is concentric with the frame, its corner less the 6px between them: 18px in Rounded, 6px in Soft, 0 in Square, the row MultiSelect already holds in the record's table. The record gains TagInput beside it.
- **Contrast.** MultiSelect's pairs, all gated or recorded: the tag's ink on bone 16.76 and 15.36, the remove glyph's slate on bone 4.99 and 6.44.
- **Density and pointer.** The frame is `--size-field` tall per row and a tag `calc(var(--size-field) - 0.75rem)`: 48 and 36px, 36 and 24px compact, 44 and 32px compact on a coarse pointer. The remove circle is 20px hit at 24px, MultiSelect's record, which meets 2.5.8 with its neighbor 4px away and is recorded as under the library's 40px floor for the same reason MultiSelect's is (a 40px hit would cover the next tag).
- **Forced colors.** MultiSelect's: a tag takes a 1px `canvastext` border and its glyph `canvastext`; disabled tags `graytext`.
- **Right to left.** Logical properties; React Aria's arrows between tags follow the locale.

### 6.8 Server rendering

The server's HTML holds the label, the frame with a tag per value (React Aria's TagGroup renders in Node, as MultiSelect's does), the hidden inputs, the text box and the empty status host, so the page is laid out and a form submitted before hydration sends the values already there. Text typed before hydration stays in the box and is split by the next change, Enter or blur after hydration (to verify that React keeps a user's edit to a controlled input at hydration in the three engines; risk R3).

### 6.9 How others do it

| System | Part | Adding | Paste | Backspace in an empty box | Validation | What this spec takes |
| --- | --- | --- | --- | --- | --- | --- |
| GitHub Primer | `TextInputWithTokens` | The app's: tokens are props, usually from an `Autocomplete` | The app's | Removes the last token and puts its text in the box (to verify) | The app's | The take-back, and tokens as one stop |
| Atlassian | `@atlaskit/select`'s creatable select (on react-select) (to verify the current name) | A "Create" option for typed text, Enter | Not split (to verify) | Removes the last value | The app's (`isValidNewOption`) | Nothing in the API; the take-back is kinder than a removal |
| MUI | `Autocomplete` with `multiple` and `freeSolo` | Enter adds the typed string as a chip | Not split by default; the app tokenizes in `onInputChange` (to verify) | Removes the last chip | None built in | The frame of chips and a box; not the silent removal |
| Gmail | Recipient fields (no public component) | Comma, Enter or blur | Split into recipients | Removes or edits the last (to verify) | An invalid address becomes a chip marked in red (to verify) | Paste that splits, blur that commits; not invalid chips (open question 8) |
| React Aria | `TokenField` (1.22.1) | Tokens inside `contenteditable` text | The app's `onPaste` | Deletes into the token | None | Nothing: rejected in section 4 |

## 7. ChoiceCards

### 7.1 Anatomy

```
List (default):
+--------------------------------------------------------------+
| [icon]  Monthly                              $12 a month  (o) |
|         Billed every month. Cancel any time.                  |
+--------------------------------------------------------------+
+==============================================================+
| [icon]  Yearly                              $120 a year   (v) |   <- chosen: 2px ink edge, filled check
|         Two months free.                                      |
+==============================================================+

Grid, with pictures:
+------------------+  +------------------+  +------------------+
| [   picture    ] |  | [   picture    ] |  | [   picture    ] |
| Light        (o) |  | Dark         (v) |  | System       (o) |
| Warm cream page  |  | For low light    |  | Follows device   |
+------------------+  +------------------+  +------------------+
```

### 7.2 API

```ts
export interface ChoiceCardsBaseProps extends Omit<RACRadioGroupProps, 'children' | 'className' | 'orientation'> {
  label?: ReactNode;
  description?: ReactNode;
  errorMessage?: ReactNode | ((validation: ValidationResult) => ReactNode);
  /** The clay Changed chip in the label row; no edge, as RadioGroup (section 7.5). */
  isChanged?: boolean;
  /** @default 'Changed' */
  changedLabel?: string;
  /**
   * `list` stacks full-width cards with the icon or picture at the start; `grid` lays them out in columns
   * at least `--choice-cards-min` wide (12rem) with the icon or picture on top. @default 'list'
   */
  layout?: 'list' | 'grid';
  /** ChoiceCard elements. */
  children: ReactNode;
  className?: string | ((values: RadioGroupRenderProps & { defaultClassName: string | undefined }) => string);
  ref?: Ref<HTMLDivElement>;
}
export type ChoiceCardsProps = ChoiceCardsBaseProps & AccessibleName<'label'>;

export interface ChoiceCardBaseProps extends Omit<RadioFieldProps, 'children' | 'className' | 'style'> {
  /** The title: the radio's whole accessible name. */
  children?: ReactNode;
  /** A sentence under the title, in slate. The radio's description. */
  description?: ReactNode;
  /** A short value at the title's line end: "$12 a month", "Free". Part of the description, after the sentence. */
  detail?: ReactNode;
  /** A 24px icon, such as a Lucide icon. Decoration: hidden from assistive technology. */
  icon?: ReactNode;
  /** An `<img alt="">` or `<picture>`: on top in the grid, a 4rem thumbnail at the start in the list. Decoration. */
  picture?: ReactNode;
  className?: string | ((values: RadioButtonRenderProps & { defaultClassName: string | undefined }) => string);
  ref?: Ref<HTMLLabelElement>;
  inputRef?: Ref<HTMLInputElement>;
}
export type ChoiceCardProps = ChoiceCardBaseProps & AccessibleName<'children'>;
```

`value`, `defaultValue`, `onChange`, `name`, `form`, `isRequired`, `isDisabled`, `isReadOnly`, `isInvalid`, `validate` and `validationBehavior` are React Aria's, on the group; `value` and `isDisabled` on each card. A card with both `icon` and `picture` draws the picture and warns once in development.

### 7.3 Behavior

- **Markup.** The group is RadioGroup's root, `div.field.radio-group.choice-cards[data-layout]`, holding the `FieldHead`, `div.choice-cards-items`, the `Description` and the `FieldError`. A card is React Aria's `RadioField` holding `RadioButton` as `label.choice-card`, which holds the visually hidden native radio, `span.choice-card-media[aria-hidden="true"]` (the icon or the picture), `span.choice-card-text` (`span.choice-card-title`, `span.choice-card-detail`, `span.choice-card-description`) and `span.radio-indicator[aria-hidden="true"]`, RadioGroup's dot.
- **The name is the title alone** (risk R5). Text inside a `label` joins its input's name, so the sentence and the detail would be read twice. The radio is named by `aria-labelledby` the title's id and described by `aria-describedby` the description's and the detail's ids, in that order. The media is `aria-hidden`, so a picture's `alt` is never read; the docs require `alt=""` and say that a picture that carries information the title does not has the wrong part.
- **Nothing interactive inside.** A card is a `label`; a link or a button inside it would be a control in a control. The docs say so, and a development warning fires once when the card holds an `a[href]`, a `button` or an `input` other than its own.
- **Choosing.** A press anywhere on a card chooses it, the `label`'s own behavior, before and after hydration. The arrow keys move focus and the choice together, React Aria's radio group, in reading order whatever the layout: in a three-column grid, Arrow Down goes to the next card, which may be to the right. This is the WAI-ARIA radio group pattern, and the docs say so beside PositionPad, whose arrows follow the grid (section 8).
- **Equal heights.** Cards in one grid row stretch to one height, so their edges line up; the dot stays at the first line.

| Key | Does |
| --- | --- |
| Tab, Shift+Tab | Into the group, to the chosen card, or with none chosen the first card (the last, by Shift+Tab); out of it. |
| Arrow Down, Arrow Right | To the next card, choosing it; wraps to the first. Arrow Right is the previous card in right to left. |
| Arrow Up, Arrow Left | To the previous card, choosing it; wraps to the last. |
| Space | Chooses the focused card when nothing is chosen. |

### 7.4 Keys and screen readers

Against the WAI-ARIA radio group pattern: one tab stop, the arrows move and choose, wrapping, Space chooses, every option is a `radio` with `aria-checked` from its native input, the group a `radiogroup` named by its label. A reader hears "Yearly, radio button, 2 of 3, checked, Two months free. $120 a year" (to verify the order of the description in VoiceOver and NVDA). Rich content does not change the pattern; GOV.UK's radios with hints are the same structure with a hint per option.

### 7.5 Forms, changed, validation and disabled

- **Native radios.** React Aria's hidden inputs carry `name` and `value`, so the form submits the chosen value with no hidden input of the library's; React Aria's `useRadio` resets the choice on the form's `reset`.
- **Required and invalid.** React Aria's: a required group with nothing chosen fails on submit; an invalid group draws a 1.5px error edge on every card, RadioGroup's rule, with the error line under the cards. The edge is drawn over the card's own edge, so nothing moves.
- **Changed.** The Changed chip in the label row and no edge, RadioGroup's rule for choice groups: the edge of a choice is its own boundary, and the chip carries the word. A group with no visible label shows no chip and sets `data-changed` only, as RadioGroup does.
- **Disabled.** A disabled card or group: the disabled fill, a 1px ink 15% edge, taupe title, detail and description, the icon taupe, a picture at half opacity, `cursor: not-allowed`. A disabled, chosen card keeps its filled check at the boundary strength, RadioGroup's rule. RadioGroup's recorded React Aria limit holds: do not disable the chosen card of a group the reader can still change.
- **Read only.** No hover, no pointer cursor, as RadioGroup.

### 7.6 Look and CSS

- **The card** (open question 16). Raised fill (a control's fill), a 1px `--color-boundary` edge (3.06 on canvas, 3.36 on lifted, above 1.4.11's 3:1), `padding: 1rem` (RadioGroup's row side padding, so a card's text starts where a radio row's dot would), `gap: 0.75rem` between media, text and dot (RadioGroup's 12px between dot and label). The corner, held in `--choice-card-radius` so the parts inside can read it, is `--radius-surface` on the page and the holder formula inside a holder (section 9).
- **Text.** The title `--text-body` at weight 500 in ink; the detail `--text-small` at weight 500 in ink with tabular figures, at the title line's end; the description `--text-small` at 450 in slate, `var(--spacing-part)` under the title. `overflow-wrap: anywhere` on the text, so a long word wraps inside the card at 320px.
- **Media.** An icon is 24px in ink, level with the title's first line. In the list, a picture is a 4rem square thumbnail at the start, level with the title's first line, `object-fit: cover`, with the concentric corner of section 9. In the grid, a picture is flush with the card's top and sides, `aspect-ratio: var(--choice-card-picture-ratio, 16 / 9)`, `object-fit: cover`, square-cornered and clipped by the card (`overflow: clip`), the "flush edges are clipped" rule.
- **The dot.** RadioGroup's 20px `radio-indicator`, `--radius-dot`, at the inline end of the title's first line. Unchosen it is the boundary ring on Raised; chosen it is an ink fill with the canvas check (the checked checkbox's look on a round dot), since the card is not filled ink.
- **Chosen** (open question 16). The edge turns ink and 2px wide, drawn by a `::after` over the content with the card's corner, so a picture at the top does not hide it and nothing moves; the dot fills. Two cues that are not color: the edge's weight and the check's shape. Signal orange is consent only and link blue is for links, so neither marks a choice.
- **Hover** where hover exists, on a card that is not chosen and not read only: the 5% ink wash over Raised and the edge firming to ink at 70%, RadioGroup's hover values, since the wash lowers the boundary's contrast.
- **Focus.** The standard 2px ink ring at 2px outside the card, following its corner. The card is never ink-filled, so the ring never inverts.
- **Layouts.** `list`: a column of cards with `gap: var(--spacing-part)`, each card a row of media, text and dot. `grid`: `grid-template-columns: repeat(auto-fill, minmax(min(var(--choice-cards-min, 12rem), 100%), 1fr))` with `gap: var(--spacing-part)`, each card a column of media, then the text row with the dot. The cards are parts of one control, so the part step separates them.
- **Contrast.** Every pair is gated already: ink and slate on Raised (slate 5.49 and 6.44), canvas on ink 16.25 and 19.31 (the filled check), the boundary 3.06 and over, the error edge 6.58 and 5.06. The hover wash and the 70% edge are RadioGroup's recorded pairs. No pair is added.

### 7.7 Server rendering, direction, density, pointer and forced colors

- **Server.** Every card, its native radio and the chosen one's `checked` are in the server's HTML. Every state also has its native twin (`:has(input:checked)`, `:has(input:focus-visible)`, `:has(input:disabled)`), RadioGroup's rule, so before hydration a press on a card checks it and the card draws chosen.
- **Right to left.** Logical properties: the media at the right, the dot at the left; the arrows mirror (React Aria). A detail that is an amount takes `copy.css`'s numeral rules if the app gives it `dir="ltr"`; the docs show it.
- **Compact density.** A card is content-sized, not a control height, so compact changes only its corner inside a compact card (19px, section 9). The type does not change.
- **Coarse pointer.** A card is at least 56px tall (16px padding each side and a 24px icon or a 22.4px title), above every target.
- **Forced colors.** The edge is a border and survives in `canvastext`; the chosen edge and the dot's fill take `highlight` and the check `highlighttext`, drawn with `forced-color-adjust: none` on the dot, as SegmentedControl's chosen option; a disabled card is `graytext`. The masked check is drawn in a system color, RadioGroup's rule.

### 7.8 How others do it

| System | Part | Look | Hints | Multiple | What this spec takes |
| --- | --- | --- | --- | --- | --- |
| Shopify Polaris | `ChoiceList` | Plain radios or checkboxes, a title (hideable) | `helpText` per choice | `allowMultiple` | The title, the per-choice sentence; several choices later (open question 15) |
| GOV.UK Design System | Radios with hints | Large 40px radios, labels and hints; "or" dividers; conditional reveal | `hint` per item | Checkboxes are a separate part | The hint under the title, read as a description; not the conditional reveal (open question 18) |
| Shopify checkout | Shipping and payment methods (no public component) | Rows in one bordered box, the chosen one with a dark edge and a tint, a price at the end (to verify) | A line under each | No | The detail at the line's end, the firm chosen edge |
| Stripe | Payment Element's tabs and the Dashboard's card choices (no public component) | Bordered tiles with an icon and a label; the chosen one has a firmer, colored edge (to verify) | Some | No | The icon tile, a firmer edge when chosen, in ink rather than a brand color |
| WAI-ARIA APG | Radio group pattern | Any | `aria-describedby` | No | The keys and the naming by the title alone |

## 8. PositionPad

### 8.1 Anatomy

```
Text position
+---------------+
| .   .   .     |      .  a position (a 6px slate dot)
| .  (o)  .     |     (o) the chosen position: an ink circle with a canvas dot
| .   .   .     |
+---------------+
```

Nine cells, 40px each, 2px apart, in a track with a 1px edge and 3px inside it: 132px square.

### 8.2 API

```ts
/** Rows first, then columns, in logical directions: `start` is the left in left to right and the right in right to left. */
export type PadPosition =
  | 'top-start' | 'top-center' | 'top-end'
  | 'center-start' | 'center' | 'center-end'
  | 'bottom-start' | 'bottom-center' | 'bottom-end';

export interface PositionPadBaseProps extends Omit<
  RACRadioGroupProps,
  'children' | 'className' | 'orientation' | 'value' | 'defaultValue' | 'onChange'
> {
  label?: ReactNode;
  description?: ReactNode;
  errorMessage?: ReactNode | ((validation: ValidationResult) => ReactNode);
  /** The Changed chip and the changed edge on the track, as SegmentedControl. */
  isChanged?: boolean;
  /** @default 'Changed' */
  changedLabel?: string;
  value?: PadPosition | null;
  defaultValue?: PadPosition | null;
  onChange?: (value: PadPosition) => void;
  /** Positions that cannot be chosen: drawn disabled and skipped by the arrows. */
  disabledPositions?: readonly PadPosition[];
  /**
   * Each cell's name. English, for a left-to-right page.
   * @default 'Top left', 'Top', 'Top right', 'Left', 'Center', 'Right', 'Bottom left', 'Bottom', 'Bottom right'
   */
  labels?: Partial<Record<PadPosition, string>>;
  className?: string | ((values: RadioGroupRenderProps & { defaultClassName: string | undefined }) => string);
  ref?: Ref<HTMLDivElement>;
}
export type PositionPadProps = PositionPadBaseProps & AccessibleName<'label'>;
```

`name`, `form`, `isRequired`, `isDisabled`, `isReadOnly`, `isInvalid`, `validate` and `validationBehavior` are React Aria's. The values are the form values.

### 8.3 Behavior

- **Markup.** RadioGroup's root, `div.field.radio-group.position-pad`, holding the `FieldHead`, `div.position-pad-track` (a 3 by 3 CSS grid) of nine React Aria `Radio`s as `label.position-pad-cell[data-position]`, each holding its visually hidden native radio, named by its label, and `span.position-pad-dot[aria-hidden="true"]`; then the `Description` and the `FieldError`. The cells are in reading order, top row first, start to end, so the DOM order, the tab order without a choice and the linear arrows agree.
- **Logical values** (open question 22). `start` and `end` follow the page's direction: in right to left the grid mirrors, `top-start` is drawn at the top right, and its default name stays "Top left" only for a left-to-right page; a right-to-left page passes `labels` in its own language, as every Persian page passes its strings. The default names never read the direction, so the server and the browser write the same words. An app placing something that does not mirror (an image's focal point) sets `dir="ltr"` on the pad, and the docs show it.
- **Two-dimensional keys** (open question 21). A capture-phase `keydown` handler on the group, ahead of React Aria's own, handles the four arrows and leaves every other key to React Aria:
  - **Arrow Left and Arrow Right** move along the row and continue to the next or previous row at its end, in reading order, wrapping from the last cell to the first: React Aria's linear order, which keeps the radio group pattern's promise that the arrows reach every option. In right to left they mirror, read from the group's computed direction at the press.
  - **Arrow Up and Arrow Down** move within the column and stop at its top and bottom, as a grid's arrows do.
  - A disabled cell is skipped in the direction of travel; with nothing enabled that way, focus stays. The handler checks the next cell's native radio, focuses it, and calls `preventDefault()` so the browser's own radio arrows do not run, and `stopPropagation()` so React Aria's do not run on the same press. It sets the value through React Aria's `RadioGroupStateContext`, so React Aria's state, `onChange` and the native radios stay one.
- **Before hydration** the browser's own radio keys move linearly through the nine; the two-dimensional keys arrive with the handler.
- **Nothing chosen.** Tab lands on the first enabled cell, and Shift+Tab on the last, without choosing it (React Aria's rule); Space chooses it, or an arrow moves and chooses.

| Key | Does |
| --- | --- |
| Tab, Shift+Tab | Into the pad, to the chosen cell, or with none chosen the first enabled cell (the last, by Shift+Tab); out of it. |
| Arrow Right, Arrow Left | Along the row in the drawn direction, on into the next or previous row; wraps from the last cell to the first. Mirrored in right to left. |
| Arrow Down, Arrow Up | Down or up the column; stops at the edge. |
| Space | Chooses the focused cell when nothing is chosen. |

### 8.4 Keys and screen readers

The pad is a `radiogroup` of nine `radio`s, each named by its position ("Bottom right, radio button, 9 of 9, checked"), so a reader hears where it is in words. The WAI-ARIA radio group pattern's Arrow Down moves to the next radio; here it moves three on, to the cell below, and the name says where focus landed. The group's description, when the app gives one, can say "Use the arrow keys to move between positions"; the docs offer it as the example. `aria-orientation` is meaningless for two axes: the plan leaves it out if React Aria lets the wrapper drop it, and records it as harmless otherwise. Screen readers in browse mode take the arrow keys for themselves; in a form, VoiceOver, NVDA and JAWS pass them to a focused radio (to verify with each; owner action, as for every radio group).

### 8.5 Radio group or grid

The APG's grid pattern (a layout grid of `gridcell`s with roving focus, arrows that stop at the edges, Home and End along a row, `aria-selected` for a choice) fits the shape. It is not taken (open question 20) because: a position is one value in a form, which native radios submit and reset with no code of the library's, and a grid submits nothing; a grid's selection state is read unevenly by screen readers, while `aria-checked` on a radio is read everywhere; and a reader hears the position's name, which carries the second dimension in words. The grid's edge rule is taken for Up and Down, where wrapping from the bottom of a column to its top would surprise a sighted keyboard user.

### 8.6 Forms, changed, validation and disabled

- **Native radios.** The chosen value submits under `name`; React Aria's `useRadio` resets it on the form's `reset`.
- **Required and invalid.** React Aria's validation; an invalid pad draws the 1.5px error edge on its track, SegmentedControl's rule for a composite control, with the error line under it.
- **Changed.** The Changed chip in the label row and the 1.5px light signal orange edge on the track, SegmentedControl's rule (the track is the control, as a segmented track is). Without a visible label no chip shows; the edge and `data-changed` remain, as SegmentedControl's; the docs say a pad whose change should show needs a label (decided here, item 16).
- **Disabled.** A disabled pad: the disabled fill on the track, an ink 15% edge, taupe dots, the chosen cell a taupe circle with a canvas dot, `cursor: not-allowed`. A disabled position: its dot taupe, no hover, skipped by the arrows. RadioGroup's recorded limit holds for a disabled chosen position.
- **Read only.** No hover, no pointer cursor; the arrows move focus without choosing (React Aria's read-only radios), and the two-dimensional handler does the same.

### 8.7 Look and CSS

- **The track** is a holder (Nested radii, derived): Raised fill, 1px `--color-boundary` edge, `--radius-surface`, 3px of padding, declaring `--holder-radius`, `--holder-border` and `--holder-pad`, as SegmentedControl's stacked track is (24px with options 4px inside). `inline-size: max-content`; the field around it fills its column like every field.
- **Cells.** `max(var(--size-target), var(--size-control))` square: 40px in comfortable and compact, 44px compact on a coarse pointer, the stacked segmented row's rule, so a compact pad never drops a cell under the target. `gap: 2px` (the `sm` segmented track's gap). The corner is the formula, `max(0px, calc(var(--holder-radius) - var(--holder-border) - var(--holder-pad)))`, on every cell, so no cell differs by where it falls: 20px in Rounded, which on a 40px cell is a circle; 8px in Soft; 0 in Square. A 44px cell takes the same 20px, a rounded square.
- **The dot.** 6px, `--radius-dot` in every shape, slate (5.49 on Raised in light, 6.44 in dark, above 3:1 for a graphic). The chosen cell is an ink fill with an 8px canvas dot (16.25 and 19.31). Hover where hover exists, on a cell not chosen and not disabled: the 5% ink wash on the cell and the dot ink.
- **Focus** (decided here, item 15). On the chosen cell, the inset canvas ring 4px inside the cell, SegmentedControl's and RadioGroup's rule on ink. On a cell that is not chosen, an inset ink ring 2px inside it: the design document's ring is 2px outside, but here it would draw over the neighbor 2px away, so it is drawn inside, recorded as the pad's deviation. Focus without a choice is rare: the arrows move focus and the choice together.
- **Invalid and changed.** The 1.5px error or light signal orange edge on the track, invalid after changed so a pad that is both shows the error edge, SegmentedControl's rule; the track's size is set, not summed, so a firmer edge moves nothing.
- **Contrast.** No pair is added: slate and ink on Raised, canvas on ink, the boundary, the error edge and light signal orange are gated or recorded by SegmentedControl and RadioGroup.

### 8.8 Server rendering, direction, density, pointer and forced colors

- **Server.** The track, the nine native radios and the chosen one's `checked` are in the server's HTML, with native twins for every state, so the pad draws and submits before hydration.
- **Right to left.** The grid mirrors by direction; the dots and corners are symmetric; the horizontal arrows mirror (section 8.3).
- **Compact density.** Cells keep 40px (section 8.7); the label row and the hint follow the field's own compact rules.
- **Coarse pointer.** 44px cells in compact; 40px in comfortable, which does not change on touch (the Compact density record).
- **Forced colors.** The track's edge `canvastext`; dots `canvastext`; the chosen cell `highlight` with a `highlighttext` dot under `forced-color-adjust: none`, SegmentedControl's rule; a disabled position `graytext`.

### 8.9 How others do it

| System | Part | Shape | Keys | What this spec takes |
| --- | --- | --- | --- | --- |
| Figma | Auto layout's alignment control (no public component) | A 3 by 3 grid of dots in a small square; the chosen cell shows bars for the children's alignment; hover previews | Not reachable as a group by keyboard; alignment has its own shortcuts (to verify) | The 3 by 3 of dots in a square, the chosen cell filled; not the bars (open question 23) |
| Webflow | The background image's position control and flex alignment in the Style panel (no public component) | A 3 by 3 grid of squares beside X and Y fields (to verify) | Unknown (to verify) | The nine positions named in words, with values a CSS position can take |
| WAI-ARIA APG | Grid pattern (layout grid) and radio group pattern | Any | Grid: arrows by row and column without wrapping, Home, End, Ctrl+Home, Ctrl+End. Radio group: arrows in one order, wrapping | The radio group's semantics and linear Left and Right; the grid's Up and Down that stop at the edge (section 8.5) |
| CSS | `object-position`, `background-position`, `place-self` | Keywords `top`, `center`, `bottom`, `left`, `right`, `start`, `end` | | The default names and the logical values |

## 9. The corner rule and the intrinsic size rule, together

The design record's "Nested radii, derived" and the 0.6.1 "A width of its own" records apply to each part as follows.

| Part | Rounded parts it holds | In a holder | Size container |
| --- | --- | --- | --- |
| Accordion | None that fill: no row wash, no frame. The toggle's focus ring is a text-sized part at `--radius-micro`, which the formula allows wherever it binds (7px in a Rounded card, 19px compact; in Soft the toggle is 33px inside a 16px curve and clear of it) | Rows end at the holder's padding; nothing moves. Fields in a panel are the app's controls and follow the record's rule for an app's content | No |
| TagInput | Tags in the frame, concentric: 18px, 6px, 0, MultiSelect's row in the record's table | The field is a control: an app moves it out of a holder's corner (`corner.ts` in the stories) | No |
| ChoiceCards | Cards, as surfaces: `--radius-surface` (24px) on the page; inside a holder, `max(var(--radius-micro), calc(var(--holder-radius) - var(--holder-border) - var(--holder-pad)))`, read from the nearest holder's properties: 7px in a Rounded card, 19px compact, the micro step in Soft, 0 in Square. A grid picture is flush and clipped by the card's padding-box curve, which is concentric by construction. A list thumbnail 17px from the card's top and start edges lies within the card's curve, so it takes the formula with the micro step as a floor and the card's own corner as a ceiling, `min(var(--choice-card-radius), max(var(--radius-micro), calc(var(--choice-card-radius) - 1px - 1rem)))`: 7px on the page in Rounded, 6px in a card or in Soft, 0 in Square | Every card in a holder takes the formula, wherever it falls, as StatTile and a card in a card do (decided here, item 13; open question 19), so no card in a group differs from the next | No: an auto-filling grid wraps without a query |
| PositionPad | Cells in the track, concentric: 20px (a circle on 40px), 8px, 0 | The pad is a control: an app moves it out of a holder's corner | No: 132px, or 144px with 44px cells, set by its cells |

**Why no part is a size container** (decided here, item 14). A size container takes no width from its content, so in a flex row or an `auto` grid column it draws its padding wide unless it names a stand-in width (StatTile's `contain-intrinsic-inline-size`, Pagination's drawn narrow row); and a stand-in width that is too wide pushes a 320px page sideways, as Pagination's first attempt did. ChoiceCards was the one candidate, to switch from cards in a row to stacked cards by its own width; `repeat(auto-fill, minmax(min(var(--choice-cards-min, 12rem), 100%), 1fr))` does that with no containment: in a definite width it fits as many 12rem columns as there is room for, in a box narrower than 12rem it is one column of 100%, and in a shrink-to-fit parent it is one column as wide as its widest card's content (to verify in the `InAFlexRow` story in three engines). The other three are fields that fill their column up to `--container-field`, as every field does.

**The audit.** Every new story runs through `apps/storybook/tests/concentric` in Rounded, Soft and Square: the cards in a card, the tags in the frame, the cells in the track, and a pad and a TagInput at a card's foot moved out of its corner by `corner.ts`. The record's tables gain the rows above.

## 10. Accessibility

- **Roles and names.** Accordion: `heading`s holding `button`s with `aria-expanded` and `aria-controls`, panels as React Aria's `group` named by the toggle (its default role), an optional "Show all sections" `button` with `aria-expanded`. TagInput: a `textbox` named by the label and described by the hint, the tags and the error line; a `grid` of tags named "Added" and the label, each row with a "Remove" and the tag's text button; a polite `status`. ChoiceCards: a `radiogroup` named by its label, `radio`s named by their titles alone and described by their sentence and detail. PositionPad: a `radiogroup` named by its label, nine `radio`s named by position.
- **Never color alone.** A folded change has the dot and a hidden word; a refused value has the error line; a chosen card has a 2px edge and a check's shape; a chosen position has a filled circle and a different dot; invalid states have their error lines; changed states have their chips (TagInput's unlabelled dot holds its word).
- **Targets (2.5.8).** Accordion rows 48px (40 and 44 compact); TagInput's frame and box at `--size-field`, its remove circles 24px with the spacing exception MultiSelect records; cards at least 56px; pad cells 40px (44 compact on a coarse pointer).
- **Focus visible (2.4.7) and not obscured (2.4.11).** Every focusable part draws a ring; none of the four is sticky or floating.
- **Label in name (2.5.3).** Each card's name is its visible title; each cell's name describes the position drawn; each toggle's name is its visible title.
- **Status messages (4.1.3).** TagInput's additions, duplicates and take-backs in a polite host mounted before its text.
- **Axe** passes in light and dark for every story, one test per state: accordion items open, folded, marked, disabled and nested; TagInput empty, with tags, wrapped, with refused text, past the limit, changed, unlabelled and changed, read only, disabled; each card layout with icons and pictures, chosen, invalid, changed, disabled; the pad with each kind of cell, invalid, changed, disabled.
- **Screen readers.** Not yet verified with VoiceOver and NVDA for the four parts (owner action, as for every batch): the toggle's order of name, state and "Changed"; TagInput's description and announcements; a card's description order; the pad's arrows in focus mode.

## 11. Decided here

1. All four parts are client parts; each draws its server face from the same tree (section 4's table).
2. Accordion reuses CollapsibleCard's three fold hooks unchanged, under `DisclosureGroup`'s state read from `DisclosureStateContext`.
3. Accordion's fold is CollapsibleCard's technique in its own selectors, with a core test tying its duration and easing to `card.css`.
4. Accordion draws rows with rules between them, no frame, no row wash; the title at the body step and weight 500; the note outside the toggle.
5. An accordion may be all folded, in either mode.
6. Folded panels keep their fields in the form; a reset neither opens nor folds.
7. TagInput's value only ever holds values its preset accepts; refused text stays in the text box with the error line.
8. Delimiters are read from the text after each change, never from `keydown`; nothing commits during composition; Enter in an empty box submits.
9. TagInput shares MultiSelect's frame and tag rules by selector, leaving MultiSelect's drawn values and baselines unchanged.
10. The email preset takes the HTML standard's rule and requires a dot in the domain; presets live in a module without `'use client'` and are exported for server checks.
11. TagInput shows a FieldCounter in its label row when `maxValues` is given.
12. ChoiceCards names each radio by its title alone and describes it by its sentence and detail; media is hidden; nothing interactive goes inside a card.
13. A choice card in a holder takes the holder formula wherever it falls; on the page it takes `--radius-surface`.
14. No part is a size container; ChoiceCards' grid wraps by `auto-fill`.
15. PositionPad's focus ring on a cell that is not chosen is drawn inside the cell, a recorded deviation; on the chosen cell it is the inset canvas ring.
16. PositionPad follows SegmentedControl for changed and invalid edges on its track; an unlabelled pad shows no chip.
17. PositionPad's cells are `max(var(--size-target), var(--size-control))`, 40px or 44px, and concentric with a 3px-padded surface track: circles in Rounded.
18. No new tokens. `--choice-cards-min`, `--choice-card-picture-ratio` and `--choice-card-radius` are component custom properties with defaults, as `--description-list-term-size` is.
19. The docs site has no `.accordion`, `.tag-input`, `.choice-card`, `.choice-cards` or `.position-pad` classes of its own to collide with; the plan checks again.
20. One minor release of core and react for all four (section 18).

## 12. Testing

- **Core (`css.test.js`, `token-only.test.js`, `contrast.test.js`).** `accordion.css`, `tag-input.css`, `choice-cards.css` and `position-pad.css` are tokens only, in `@layer components`, imported by `styles.css` (the accordion after `card.css`, TagInput after `multi-select.css`, the other two after `radio.css` and `segmented.css`), with hover in `@media (hover: hover)`, a forced-colors block, logical properties, and system colors only in that block. The accordion's fold duration and easing equal `card.css`'s. `multi-select.css`'s shared selectors keep their specificity (a test compares the computed weight of each rule before and after). Clay on canvas at 3:1 joins the gate (section 5.6); the dark value is measured first.
- **React (Vitest, jsdom).**
  - Accordion: several and single modes; `defaultExpandedKeys`, controlled `expandedKeys` and `onExpandedChange`; all folded allowed; "Show all sections" opening and folding, its words and `aria-expanded`, its warning in single mode; the arrow keys, Home and End, no wrap, disabled skipped, only on its own toggles, nested accordions apart; the folded marker from `isChanged` and from a changed field; opening for an invalid field, drawn at once; focus to the toggle on a fold from inside; heading levels; axe.
  - The presets, pure: split, normalize, validity and key for each, with tables of accepted and refused inputs (named addresses, pasted URLs, wildcards, non-Latin domain labels, trailing slashes, case).
  - TagInput: Enter and each delimiter commit; a delimiter inside a composition does not; a value typed through a `beforeinput` with no `key` commits (the Android path); paste splitting; refused text kept, joined, with the error and the custom validity; duplicates dropped and announced; `maxValues` and the counter; Backspace's take-back and its single step when held; Enter on a tag; removal and focus; blur commit and `commitsOnBlur={false}`; Escape; the hidden inputs, the single empty value, and reset to the first value; `isRequired` in native and aria validation; `validate`; read only and disabled; the announcements' timing with fake timers; axe.
  - ChoiceCards: the native radios and form value; names by the title alone and descriptions in order; media hidden; the development warnings (interactive content, icon with picture); layouts; invalid, changed and disabled; reset; axe.
  - PositionPad: nine named radios in reading order; Left and Right linear with wrap and mirrored under `dir="rtl"`; Up and Down by column, stopping; disabled positions skipped; read only moves focus only; the native arrows prevented; `onChange` once per move; reset; axe.
  - Server render and hydration: all four in the server-render and hydration suites under `en-US`, `de-DE` and `fa-IR` in UTC and Asia/Tehran, with `onRecoverableError` failing the test.
- **Storybook.** Section 13's stories, baselined in the four theme and shape modes and at 375px, and in compact where tagged. Play tests in the four story projects (Chromium in light and dark, WebKit and Firefox): every part's keys (`no-visual`); the accordion's fold and find-in-page reveal (a text fragment in Chromium and WebKit, `window.find()` in Firefox, CollapsibleCard's method); TagInput's paste from a `DataTransfer`, composition events, and the blur commit before a submit button's press; a pre-hydration press on a choice card drawing it chosen (the native twins); the pad's two-dimensional keys in three engines. The concentric audit runs on every new story in three shapes. Baselines change only through `pnpm --filter @snapshot-ui/storybook visual:docker`.
- **Docs e2e.** Completeness maps for the four pages; 320px with no sideways scroll; forced colors on a chosen card, a chosen cell and a folded marker; the Settings recipe at 375 and 1280, including a no-JavaScript submit of the cards and the pad.

## 13. Docs, stories and design record

- **Pages:** `accordion` (leading with "Accordion, CollapsibleCard or Tabs"), `tag-input` (leading with "TagInput or MultiSelect", and a section per preset with a server check), `choice-cards` (leading with "ChoiceCards or RadioGroup"), `position-pad` (with "Positions and CSS", mapping each value to `place-self`, `object-position` and `background-position`, and `dir="ltr"` for a focal point), each with Usage, Props, Accessibility with its Keys table, and Design rules. The `radio-group` page links ChoiceCards and PositionPad; the `multi-select` page links TagInput; the `collapsible-card` page links Accordion.
- **The Settings recipe**, with the Next App Router and a server action: a "Sharing" card with a TagInput of emails (and the server action re-checking with `emailPreset`), a "Plan" card with ChoiceCards in the list layout with prices as details, an "Appearance" card with ChoiceCards in the grid with pictures, a "Banner" card with a PositionPad for the text's position, and an "Advanced" Accordion of three sections holding fields, one with a field that fails on submit and opens its section; a SaveBar under the form. Sample content keeps the reservations: no success color for a chosen plan, no signal orange anywhere.
- **Stories:**
  - `Components/Accordion`: `Default` (density), `SingleExpanded`, `WithNotes`, `ExpandAll`, `InCard` (density), `DisabledItem`, `LongTitles`, `FoldedChanged`, `FormSections` (density).
  - `Components/TagInput`: `Default` (density), `Emails`, `Domains`, `Paths`, `RefusedText`, `AtTheLimit`, `Changed`, `UnlabelledChanged`, `Disabled`, `ReadOnly`, `ManyTags`, `InCard` (density).
  - `Components/ChoiceCards`: `Default` (density; list, text only), `Icons` (list), `IconGrid` (density), `Pictures` (grid), `Details`, `Invalid`, `Changed`, `Disabled`, `DisabledCard`, `LongContent`, `InCard` (density), `InAFlexRow` (`no-visual`).
  - `Components/PositionPad`: `Default` (density), `AllPositions` (nine pads, each chosen at one position), `DisabledPositions`, `Invalid`, `Changed`, `Disabled`, `InCard` (density).
  - `Pages/Settings`: the recipe's page (density).
  - `rtl/RightToLeft.stories.tsx`: `Accordion`, `TagInput` (Persian labels, LTR addresses), `ChoiceCards` and `PositionPad`, in Persian.
- **Design record:** a section per part in Appendix B of `docs/design-system.md` (Accordion first, since it is new and the parent spec requires its derivation before it is built; then TagInput, ChoiceCards and PositionPad), each with every derived value, its reason and the pairs; rows added to "Nested radii, derived"'s tables (TagInput's tags, a choice card in a holder, the pad's cells); PositionPad's inset focus ring recorded as a deviation; and clay on canvas added to the folded marker's pairs.
- **Guides:** the forms guide gains "Lists of values" (TagInput and MultiSelect) and "Choices with more than a label" (ChoiceCards).

## 14. Risks

- **R1. CollapsibleCard's hooks under a group.** `useFolding` and `useOpenOnInvalid` were written for a card whose setter it owns; under `DisclosureGroup` the setter is the group's `toggleKey`, and in single mode one toggle changes two items in one render. Mitigation: the plan's first Accordion step is a spike that runs the three hooks under `DisclosureGroup` in both modes, with find-in-page and an invalid field in a folded item, in three engines; the fallback is a small adapter that gives the hooks the item's state and setter from the group's context, leaving the hooks unchanged.
- **R2. TagGroup inside TextField.** React Aria's `TextField` expects one input and labels it; the tag group needs its own name and must not be labelled as the input. Mitigation: a spike as MultiSelect's (`multiple-mode.test.tsx`) kept in the suite: the label's `for`, the description's ids, the tag group's name, and focus between tags and the box; the fallback is React Aria's `useTextField` on the library's own markup.
- **R3. Text entry across platforms.** Android keyboards send `keydown` with `Unidentified`; input methods compose; iOS may insert a space after autocompletion; a controlled input's text typed before hydration may be replaced. Mitigation: delimiters read from the text after each change, `isComposing` respected, `autoCorrect` and `autoCapitalize` off in the presets, and play tests with composition events; the hydration case is checked in three engines and recorded.
- **R4. Two-dimensional keys over React Aria's.** The capture handler must run before React Aria's and the browser's radio arrows, set React Aria's state, and keep `onChange` single. Mitigation: a spike in three engines first; the fallback is the library's own `useRadioGroup` call with its keyboard props omitted, keeping React Aria's state and native inputs.
- **R5. A radio's name inside a rich label.** `aria-labelledby` on an input inside a `label` should win over the label's text in every browser and reader. Mitigation: a test of the computed name in jsdom (dom-accessibility-api) and the owner's screen reader pass; the fallback moves the description and detail out of the `label` and positions them over the card.
- **R6. Choice cards before hydration.** The native twins rely on `:has()`, which every engine at the browser floor supports (Firefox 121 and later; the floor is 128). Mitigation: a play test presses a card in a page whose script has not run.
- **R7. Email and domain rules refuse real addresses.** The HTML standard's email rule refuses internationalized local parts, and some systems accept addresses without a dot in the domain. Mitigation: the docs say so, the preset is a plain object an app can extend (`{ ...emailPreset, isValid }`), and the server is the final check.
- **R8. Single mode and find-in-page.** A match in a folded item folds the open one, which may hold the reader's place. Mitigation: several open is the default; the docs say single mode suits short content.
- **R9. The source's behaviors.** `.local/SOURCE.md` was absent when this spec was written, so the presets' exact rules, the source's take-back details and its pad's keys are this spec's reading of the parent spec. Mitigation: the plan reads `js/value-list.js`, `js/choice-cards.js` and `js/position-pad.js` before the tasks that port them, and records every difference as a correction for the owner.
- **R10. Printing folded panels.** Showing a panel that carries `hidden="until-found"` under `@media print` overrides a user agent rule. Mitigation: a print-media play test in Chromium and a manual check of WebKit's and Firefox's print preview; if an engine will not show it, print falls back to the folded look and the docs say so.

## 15. Open questions

Each has a recommended answer.

1. **Accordion: several open by default?** Recommended: yes, `allowsMultipleExpanded` true by default, because readers compare sections and GOV.UK's research-led accordion and the Nielsen Norman Group's guidance favor letting several stay open, and single mode loses a reader's place when find-in-page or an invalid field opens another item. Alternative: React Aria's default, one at a time, which matches React Aria's docs exactly and suits short FAQs.
2. **Accordion: arrow keys between toggles?** Recommended: yes, Up, Down, Home and End, no wrap, the APG's optional keys and Radix's. Alternative: Tab only, React Aria's behavior, which is less code and matches GOV.UK.
3. **Accordion: "Show all sections"?** Recommended: offer it as `hasExpandAll`, off by default, in GOV.UK's words, because a long list of sections benefits from it and GOV.UK shows it on every accordion. Alternative: leave it to the app, which can drive `expandedKeys` from its own button.
4. **Accordion: remember open sections?** Recommended: not in this batch; the app holds `expandedKeys` in its state or URL when it needs to. Alternative: `storageKey` on the accordion through CollapsibleCard's store, as GOV.UK remembers for the session, at the cost of a folded server render that changes at hydration.
5. **Accordion items as cards?** Recommended: rows only, and a column of CollapsibleCards for a page whose sections are cards. Alternative: a `look="cards"` that draws each item as a CollapsibleCard under the group's state, one part for both, but a second look to baseline and two kinds of heading.
6. **Accordion when printed.** Recommended: folded panels print open, as Polaris' `expandOnPrint` offers (to verify). Alternative: print what the screen shows.
7. **Accordion's default heading level.** Recommended: 3, Radix's, since an accordion usually sits under a page's `h1` and a section's `h2`. Alternative: 2, GOV.UK's, or no default, which forces every app to choose.
8. **TagInput: refused values.** Recommended: they stay in the text box with the error, so the value is always valid and an app can save it as is. Alternative: refused values become tags marked invalid (an error edge, an icon and a description), as Gmail marks a bad recipient (to verify), which keeps a pasted list in one place but puts invalid values in `value`.
9. **TagInput: commit on blur.** Recommended: yes for text that passes, so an address followed by a press on Save is not lost. Alternative: commit only on Enter and delimiters, which never adds a value the reader did not finish, and leaves typed text unsaved.
10. **TagInput's form value.** Recommended: one hidden input per value under `name`, and one empty value when there are none, MultiSelect's shape. Alternatives: nothing when empty (cleaner for `getAll`, but a cleared list looks like a missing field), or one input holding the values joined by commas.
11. **TagInput presets: objects or names?** Recommended: exported objects (`preset={emailPreset}`), which tree-shake, extend with a spread and import on the server. Alternative: `preset="emails"`, shorter, but every preset ships with every TagInput.
12. **TagInput suggestions.** Recommended: not in this batch; MultiSelect chooses from a list. Alternative: a `suggestions` prop that opens a list under the box, MUI's `freeSolo`, which makes TagInput a combobox and needs MultiSelect's popover and keys.
13. **TagInput: Enter on a tag to edit it.** Recommended: yes, the same take-back as Backspace, for a value in the middle of the list. Alternative: only Backspace on the last tag, the source's behavior as the parent spec states it, and remove and retype for the rest.
14. **TagInput: a "Clear all" button.** Recommended: no; a form's reset or the app's own button clears it. Alternative: an end button once there are two or more tags, MUI's clear indicator, which helps after a large paste.
15. **ChoiceCards: several choices.** Recommended: later, as a CheckboxGroup twin on the same CSS, when a consumer asks. Alternative: `selectionMode="multiple"` now, Polaris' `allowMultiple`, which doubles the part's states in this batch.
16. **ChoiceCards: the chosen look.** Recommended: a 2px ink edge and a filled ink check, the card's content unchanged, because a picture and a price stay readable and no contrast is re-measured. Alternative: the ink fill with canvas text, RadioGroup's chosen row, the strongest signal but a dark block that a picture sits awkwardly on and that inverts every pair inside the card.
17. **ChoiceCards' default layout.** Recommended: `list`, which reads in one column at every width and suits sentences and prices. Alternative: `grid`, which suits pictures and makes the icon variant look like tiles by default.
18. **Content revealed under a chosen card.** Recommended: not in ChoiceCards; ConditionalFields (parent spec, phase 5) makes hidden fields inert under any choice. Alternative: a `children` slot under each card shown while chosen, Polaris' `renderChildren` and GOV.UK's conditional reveal, which GOV.UK advises keeping short.
19. **A choice card's corner in a holder.** Recommended: the holder formula wherever the group falls, as StatTile and a card in a card do, so a group never changes corner by its position. Alternative: the formula only for cards whose corner lies in the holder's curve, the record's narrowest reading, which keeps 24px cards in the middle of a card but lets cards of one group differ.
20. **PositionPad: radio group or grid.** Recommended: radio group, for native form submission and reset and the reliable "checked" a screen reader reads, with the position's name carrying the second dimension (section 8.5). Alternative: the APG's grid with `aria-selected` cells and a hidden input, whose arrows a reader expects in two dimensions.
21. **PositionPad's arrows.** Recommended: Left and Right linear through all nine with wrap, Up and Down by column stopping at the edge. Alternatives: all four stopping at the edges, a pure grid, which loses the radio group's promise that the arrows reach every option along one axis; or all four wrapping, which sends Down from the bottom row to the top.
22. **PositionPad's values.** Recommended: logical (`start`, `end`), mirrored in right to left, with `dir="ltr"` on the pad for a physical placement such as a focal point. Alternative: physical values (`left`, `right`) that never mirror, which suit images and break text alignment in right to left.
23. **PositionPad's chosen glyph.** Recommended: a dot, the same in every cell, with the position's name as the meaning. Alternative: Figma's alignment bars in the chosen cell, which show what the position does but need a glyph per position and per direction.
24. **One release.** Recommended: all four in one minor. Alternative: Accordion, ChoiceCards and PositionPad first, and TagInput, the largest, in the minor after, if its spike finds trouble.

## 16. Size budget

Measured as the others, without React, React Aria and Lucide, to start at:

| Entry | Budget | Reason |
| --- | --- | --- |
| `{ Accordion, AccordionItem }` | 3 kB | CollapsibleCard's entry takes a 2.5 kB limit; Accordion shares its three hooks and adds the group context, the arrow keys, "Show all sections" and a Button. |
| `{ TagInput }` | 4 kB | MultiSelect's entry measured 2.72 kB under a 3.5 kB limit; TagInput drops the list, the popover and the spinner, and adds splitting, the take-back, the hidden inputs, the reset listener, the status host and the default preset. |
| `{ emailPreset, domainPreset, pathPreset }` | 1 kB | Three objects of small functions; separate exports, so an app pays for the ones it uses. |
| `{ ChoiceCards, ChoiceCard }` | 2 kB | RadioGroup's 1.5 kB limit, plus the naming by title and the development warnings. |
| `{ PositionPad }` | 2 kB | RadioGroup's limit, plus nine cells, the default names and the two-dimensional handler. |

The CSS adds about 6.5 kB to `styles.css` before compression: `accordion.css` about 1.8 kB (the fold's rules included), `tag-input.css` about 0.6 kB (the rest is shared with `multi-select.css`, whose selector lists grow by about 0.3 kB), `choice-cards.css` about 2 kB, `position-pad.css` about 1.8 kB. A part over its budget is reported with the number, as 3c's SidePanel was, and the limit follows the rule: the measured entry rounded up to 0.5 kB, plus 0.5 kB.

## 17. Visual baseline estimate

Each visual story is baselined in five modes (Rounded light, Rounded dark, Soft light, Square light, Rounded light at 375px), and a story tagged `density` adds compact, six.

| Group | Visual stories | Of them with compact | Baselines |
| --- | --- | --- | --- |
| Accordion | 9 | 3 (`Default`, `InCard`, `FormSections`) | 48 |
| TagInput | 12 | 2 (`Default`, `InCard`) | 62 |
| ChoiceCards | 11 | 3 (`Default`, `IconGrid`, `InCard`) | 58 |
| PositionPad | 7 | 2 (`Default`, `InCard`) | 37 |
| Pages/Settings | 1 | 1 | 6 |
| Right to left (`Accordion`, `TagInput`, `ChoiceCards`, `PositionPad`) | 4 | 0 | 20 |
| **New** | **44** | **11** | **231** |

Existing baselines: none should change. MultiSelect's are the proof that the shared selectors draw the same values and must stay byte-identical; CollapsibleCard's hooks are not changed; `card.css` gains nothing. Expect 215 to 245 new files, depending on how the plan splits the pad's positions and the cards' media into stories. Any change to an existing baseline is investigated before it is committed, and every new one goes through `pnpm --filter @snapshot-ui/storybook visual:docker`.

## 18. Release

- **Version.** The next minor release of `@snapshot-ui/core` and `@snapshot-ui/react` after the releases in flight: 0.10.0 if batches 5 and 6 release as 0.8.0 and 0.9.0. The changesets say "minor" and name no number, so they hold whatever the order of merging.
- **Changesets.** For `@snapshot-ui/core` and `@snapshot-ui/react`, minor, released together: `accordion.md` (`Accordion`, `AccordionItem`, `AccordionLabels` and their props types, `accordion.css`), `tag-input.md` (`TagInput`, `TagInputLabels`, `TagInputPreset`, `emailPreset`, `domainPreset`, `pathPreset`, `tag-input.css`, and `multi-select.css`'s shared selectors), `choice-cards.md` (`ChoiceCards`, `ChoiceCard` and their props types, `choice-cards.css`), `position-pad.md` (`PositionPad`, `PadPosition`, its props type, `position-pad.css`). `@snapshot-ui/charts`'s core peer publishes as a caret on core's version, which a 0.x caret limits to one minor, so a charts patch changeset moves it on, as every batch since 3a has done.
- **Release notes:**
  - **Accordion.** New. Sections that open and fold, several at once by default (`allowsMultipleExpanded={false}` for one at a time). Pass `id` on every `AccordionItem`; `defaultExpandedKeys` opens items at first. A folded section shows the clay changed dot for an unsaved field inside and opens itself when a field inside fails on submit. Arrow Up, Arrow Down, Home and End move between titles. `hasExpandAll` adds "Show all sections". Use it for content most readers can skip; keep a column of CollapsibleCards for a settings page whose sections are cards.
  - **TagInput.** New. A field for a list of values typed or pasted: Enter or a comma adds one, a pasted list is split, Backspace in the empty box takes the last value back to edit. Pass `preset={emailPreset}`, `domainPreset` or `pathPreset`, or your own object. The value only holds values the preset accepts; what fails stays in the box with the error line, and the form will not submit while it does. Each value submits as its own entry under `name`; read them with `formData.getAll(name)`, and check them again on the server with the same preset.
  - **ChoiceCards.** New. A single choice drawn as cards, with a title, a sentence, a detail such as a price, and an icon or a picture. It is a radio group: `name`, `value`, `isRequired` and form reset work as on RadioGroup. Pictures are decoration: give them `alt=""`. Put no links or buttons inside a card. `layout="grid"` for tiles, the default `list` for rows.
  - **PositionPad.** New. A 3 by 3 choice of position, submitted as `top-start` through `bottom-end`. Left and Right follow the row; Up and Down follow the column. Values are logical and mirror in right to left; set `dir="ltr"` on the pad for an image's focal point. On a right-to-left page, pass `labels` in your language.
  - **MultiSelect.** No change to how it looks or behaves; its frame and tag rules now also serve TagInput.
  - **Upgrade.** Upgrade `@snapshot-ui/core` and `@snapshot-ui/react` together, and `@snapshot-ui/charts` to the patch that admits the new core.

## 19. Owner rulings (owner, 2026-10-19)

The owner approved this spec on 2026-10-19 and took every recommendation of section 15. Each ruling names the open question it settles; the plan, `docs/plans/2026-10-19-choices.md`, names the task that builds it.

1. **Several open by default** (open question 1). `allowsMultipleExpanded` is true by default; `allowsMultipleExpanded={false}` gives one item at a time, React Aria's own default.
2. **Arrow keys between toggles** (open question 2). Arrow Up, Arrow Down, Home and End move between the enabled toggles of one accordion, with no wrap, the pattern's optional keys and Radix's.
3. **"Show all sections"** (open question 3). Offered as `hasExpandAll`, off by default, in GOV.UK's words, drawn only while several items may be open.
4. **Remembering open sections** (open question 4). Not in this batch; an app that needs it holds `expandedKeys` in its own state or its URL.
5. **Accordion items as cards** (open question 5). Rows only; a page whose sections are cards keeps a column of CollapsibleCards.
6. **Printing** (open question 6). Folded panels print open, as Polaris' `expandOnPrint` offers (to verify).
7. **Heading level** (open question 7). 3 by default, Radix's, and any level from 2 to 6 by `level`.
8. **Refused values** (open question 8). They stay in the text box with the error line, so `value` only ever holds values the preset accepts.
9. **Commit on blur** (open question 9). Text that passes is added when focus leaves the field; `commitsOnBlur` is true by default.
10. **TagInput's form value** (open question 10). One hidden input per value under `name`, and one empty value when there are none, MultiSelect's shape.
11. **Presets** (open question 11). Exported objects, `emailPreset`, `domainPreset` and `pathPreset`, in a module without `'use client'`, so a server action checks with the same rules.
12. **Suggestions** (open question 12). Not in this batch; choosing from a list stays MultiSelect's.
13. **Enter on a tag** (open question 13). Takes the tag back into the text box, as Backspace does for the last one.
14. **"Clear all"** (open question 14). No button; a form's reset or the app's own button clears the list.
15. **Several choices in ChoiceCards** (open question 15). Later, as a CheckboxGroup twin on the same CSS, when a consumer asks.
16. **The chosen card** (open question 16). A 2px ink edge and a filled ink check, the card's content unchanged.
17. **ChoiceCards' default layout** (open question 17). `list`; `grid` by `layout`.
18. **Content under a chosen card** (open question 18). Not in ChoiceCards. ConditionalFields shows fields under a choice; batch 7 ("Settings") brings it forward from phase 5, so the `choice-cards` page points to it.
19. **A choice card's corner in a holder** (open question 19). The holder formula for every card of a group in a holder, wherever it falls, as StatTile and a card in a card take it.
20. **PositionPad's role** (open question 20). A radio group of nine named radios, not a grid.
21. **PositionPad's arrows** (open question 21). Left and Right through all nine in reading order with wrap, mirrored in right to left; Up and Down by column, stopping at the edges.
22. **PositionPad's values** (open question 22). Logical, `top-start` to `bottom-end`, mirrored in right to left; `dir="ltr"` on the pad for a placement that does not mirror.
23. **PositionPad's glyph** (open question 23). A dot in every cell, with the position's name as its meaning.
24. **One release** (open question 24). All four parts in one minor release of `@snapshot-ui/core` and `@snapshot-ui/react`, with the charts patch section 18 describes. Batch 7 ("Settings", 0.10.0) now releases before this batch, so the release is the minor after it, 0.11.0 if nothing else releases between; the changesets say "minor" and name no number, as section 18 asks. TagInput in the minor after the other three stays a fallback, taken only if its spike fails.
