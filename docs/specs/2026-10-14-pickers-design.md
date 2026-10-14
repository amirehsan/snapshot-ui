# Pickers: Select, ComboBox, MultiSelect, SearchField, Tabs and Pagination: design

Status: approved on 2026-10-14. The owner took the seven rulings in section 10.1 as recommended; everything else is decided here and listed in section 10.2.
Parent spec: `docs/specs/2026-10-10-snapshot-ui-design.md`. This document pulls forward the phase 2 rows "Select", "ComboBox", "MultiSelect", "Tabs" and "Pagination", and the phase 3 row "SearchField". It answers batch 3a, the first third of batch 3 of the first consumer's roadmap, its Transactions page. The design authority remains `docs/design-system.md`.
Released before this: batch 2, `@snapshot-ui/core` and `@snapshot-ui/react` 0.3.0 and `@snapshot-ui/charts` 0.1.0 (the Home figures). Section 2 lists what this document takes from batches 1 and 2.

## 1. Goal

Give an app the choice and navigation basics a list page is built from: a select for one value from a list, a combo box that filters as you type, a multi-select for several values, a search field, tabs between views, and pagination over pages of rows. Ship them as the batch 3a minor release, 0.4.0.

Batch 3 ("Transactions") is split in three, each with its own spec, plan and minor release:

- **3a, this document:** Select, ComboBox, MultiSelect, Tabs, SearchField and Pagination.
- **3b:** FilterChip and FilterBar, DateRangePicker (with Calendar and RangeCalendar), and NumberField with a money mode.
- **3c:** DataTable and SidePanel.

The reasons for the split:

- **Dependency order.** A filter chip opens the same option list a Select opens, with single or multiple choice, and the filter bar searches with SearchField; the data table pages with Pagination and sits under Tabs. Built first, these parts make 3b and 3c compositions rather than inventions, and a decision about the option row is taken once, here.
- **One kind of risk per review.** 3a is collections in popovers. 3b is dates and number entry without `Intl` at render, the hardest rule the consumer sets. 3c is a keyboard grid with selection and a non-modal panel driven by the URL. Batch 3 in one document would be about three times the home spec, with three unrelated sets of open questions.
- **Earlier use.** The consumer can build the Transactions page's header, view tabs, search and pager against 0.4.0 while 3b and 3c are drawn.

Build order, which is also the plan's order:

1. **SearchField** (section 5): the smallest, and Select's filter row is one.
2. **Select and the option list** (section 6): `PickerOption` and `PickerSection`, the listbox on the Menu's rows, and the filter past 8 options.
3. **ComboBox** (sections 7.1 to 7.3).
4. **MultiSelect** (sections 7.4 to 7.6), on ComboBox's multiple mode and tags.
5. **Tabs** (section 8).
6. **Pagination** (section 9).

Out of scope, each recorded where it is deferred:

- Everything in 3b and 3c above, including the "Filters" sheet on phones, the "More" overflow and the clear control of the filter bar.
- `TagInput` (parent spec, phase 2): free-text tags with paste splitting. MultiSelect chooses from a list only, so it takes no `allowsCustomValue`.
- Vertical tabs, closable or reorderable tabs, and an overflow menu of tabs. The tab row scrolls inside itself instead (section 8.2).
- Load-more and virtualized lists (`ListBoxLoadMoreItem`, `Virtualizer`). A long list is searched on the server through ComboBox's manual mode (section 7.2).
- Number formatting. Page numbers default to the digits `String()` writes and every other figure is a string from the app (section 4).

## 2. Depends on

| From batch 2 or earlier | Used here as |
| --- | --- |
| `Popover` (`packages/react/src/popover/Popover.tsx`): the float surface, `matchTriggerWidth`, the scope copy from the trigger (`useOverlayScope`) and the focus return (`useGiveFocusBack`) | The popover of Select, ComboBox and MultiSelect. React Aria's Select and ComboBox hand it their trigger through `PopoverContext`, as `MenuTrigger` does, so the popover needs no `triggerRef` |
| The Menu's list and rows in `menu.css`: `menu-popover`, `menu`, `menu-section`, `menu-heading`, `menu-item`, `menu-item-icon`, `menu-item-text`, `menu-item-label`, `menu-item-description`, `menu-item-end`, `menu-item-check`; the single-selection ink pill and the multiple-selection check | The option list. `menu.css` already says "the listbox of the choice controls inherits them": no new row CSS |
| The field parts: `FieldHead`, `Label`, `Description`, `FieldError`, `useChangedDescription`; `data-changed` and `data-invalid` on `.field` | Every picker's label row, Changed chip, hint and error line |
| TextField's `Input` and the `.input` rules in `input.css`: the pill on `--color-raised`, `--size-field` (48px, 36px compact), the hover, focus, disabled, changed and invalid edges | SearchField's and ComboBox's input; Select's trigger and MultiSelect's frame wear the class so they take every edge rule as written |
| `IconButton` (ghost) and the hit-area formula `inset-block: min(0px, (100% - var(--size-target)) / 2)` | The small buttons inside a field: the search clear, the combo box button, Pagination's page controls |
| `Spinner` | ComboBox's and MultiSelect's loading state |
| SegmentedControl's track and option (`segmented.css`), and its inset canvas ring on the chosen option | The Tabs, which the design document derives as "the segmented control's row of 40px pills in a padded track" |
| `FieldChanged`'s 6px dot on `--radius-dot`, and the clay meaning rule | The changed dot on a tab |
| `RouterProvider` and React Aria's `Link` | Link tabs and Pagination's page links |
| `AriaName` and `AccessibleName<'label'>` (`packages/react/src/utils/accessible-name.ts`) | The names of an unlabelled field, the tab list and Pagination's navigation |
| The `Key` type re-exported from `menu` | Every value and option id |
| CommandPalette's 600ms quiet period (`QUIET_MS`), which already names "the Pagination digest" | Pagination's spoken range |
| The chevron mirror in `sidebar.css`, `[dir='rtl'] .sidebar-collapse svg { scale: -1 1 }` | Pagination's Previous and Next chevrons |
| `present()`, `cx`, `composeRenderProps`, `mergeRefs`, `useControllableState` | As everywhere |

`Badge` is not used for MultiSelect's chosen values. A badge is a static, uppercase 12px label on the micro radius that states a status; a chosen value is the option's own words, mixed case, and removable (section 7.6).

## 3. What the consumer needs

The consumer's roadmap for batch 3, kept verbatim as input:

> DataTable: sorting controlled from outside (from the URL); selection with select-all and a bulk-action bar; arrows or J/K to move, Enter to open, X or Space to select; a row opens a detail panel through a link; a sticky header; right-aligned tabular numbers; a totals row; skeleton rows; an empty slot; and a phone layout as a list grouped by day.
> SidePanel: beside the content on desktop with no scrim, a bottom sheet on phones, with the open state driven by the URL.
> Tabs, Select, ComboBox, MultiSelect and Pagination.
> FilterChip and FilterBar: a pill that opens a popover with single choice, multiple choice or custom content; a clear control; a "More" overflow; and one Filters sheet on phones.
> SearchField, DateRangePicker, and a NumberField money mode (dollars and cents, negatives, a decimal keyboard).

3a answers the third line and the SearchField of the fifth. From the parent spec's rows: Select filters past 8 options and shows option hints; Tabs carry an optional changed dot per tab; Pagination puts its range text in a polite live region.

And its rules for every part, unchanged from batches 1 and 2: `'use client'` only on interactive parts; no `Intl` formatting and no `window` at render, and no first-paint measurement; no external requests or injected scripts; light and dark, all three shapes, right to left (the app has a Persian guide), comfortable and compact density; WCAG 2.2 AA including 2.5.8; anything that navigates goes through `RouterProvider`; everything exported from the react index, with the CSS in `core/styles.css`. The Transactions page keeps its state in the URL, so a tab, a page, a query and every picker's value must be drivable from it.

## 4. Approach

**One list, three triggers.** Select opens from a button, ComboBox from an input, MultiSelect from an input with tags, and all three open the same thing: React Aria's `ListBox` in the library's `Popover`, wearing the Menu's `menu` classes, with rows from one option part, `PickerOption` (section 6.1). A row reads the same in a menu, a picker and the palette, and 3b's filter chip opens the same list again.

**Current React Aria, current names.** The installed `react-aria-components` is 1.22.1. Its `Select` and `ComboBox` take `value`, `defaultValue` and `onChange`, and both accept `selectionMode="multiple"`; `selectedKey`, `defaultSelectedKey` and `onSelectionChange` are marked deprecated in its types. The wrappers expose only the new names, so the consumer never writes a deprecated prop, and MultiSelect is ComboBox in multiple mode rather than a composition React Aria no longer needs.

**The URL is the app's state.** Every part works controlled or uncontrolled. The parts that navigate render anchors that route through `RouterProvider`: a tab with `href`, and a page link. A link tab is selected because the app passes the key the URL names, and a page is current because the app passes the page the URL names; no part reads `window.location`, so the server's HTML is already right.

**Strings are the app's.** The range text ("1 to 50 of 1,284") arrives formatted, as every figure did in batch 2. Defaults for the library's own words ("Clear search", "No matches", "Previous") are English and replaceable through `labels` or a named prop; React Aria's announcements follow `I18nProvider`.

**Client where it must be.** Every part here takes focus and keys, so each is a client part, except the Pagination shell: it has no hooks and imports no React Aria, so a server page can render it and hand it a function for each page's URL, which runs on the server; only its controls and its live region are client leaves (section 9).

Rejected along the way:

- **A native `<select>`.** It cannot show a hint under an option, filter, or wear the ink pill, and it draws differently on every platform. React Aria's Select already renders a hidden native select for forms and autofill.
- **React Aria's `TokenField` for MultiSelect.** New in 1.22 and built on `contenteditable`: caret, soft-keyboard and right-to-left behavior that the library would have to own, for a field whose tokens only ever come from a list (ruling 1).
- **Formatting helpers** (`formatPage`, `formatRange`). Pagination takes the range as a string; the one function it takes, for page numbers, runs in the server-safe shell (section 9.2).
- **Tabs drawn as an underline.** The design document derives tabs as pills in a canvas track, and the docs site already draws them so.
- **A debounce inside SearchField** (ruling 6).

## 5. SearchField

### 5.1 API

```ts
export interface SearchFieldBaseProps extends Omit<RACSearchFieldProps, 'children' | 'className'> {
  /** The field's name, shown above it. Required unless the field has an `aria-label` or an `aria-labelledby`. */
  label?: ReactNode;
  /** A hint under the field. It becomes the input's accessible description. */
  description?: ReactNode;
  errorMessage?: ReactNode | ((validation: ValidationResult) => ReactNode);
  /** Example text while the field is empty. Taupe under a visible label, slate without one (section 5.3). */
  placeholder?: string;
  /** The clear button's name. @default 'Clear search' */
  clearLabel?: string;
  className?: string | ((values: SearchFieldRenderProps & { defaultClassName: string | undefined }) => string);
  ref?: Ref<HTMLDivElement>;
  inputRef?: Ref<HTMLInputElement>;
}

export type SearchFieldProps = SearchFieldBaseProps & AccessibleName<'label'>;
```

`value`, `defaultValue`, `onChange`, `onSubmit` and `onClear` are React Aria's. There is no `isChanged`: a query is not saved data, so it is never unsaved.

### 5.2 Behavior

- **Markup.** `RACSearchField.field.search-field[data-empty]` holding the `FieldHead` when labelled, then `div.search-field-control` with `span.search-field-icon[aria-hidden="true"]` (Lucide `Search`), the `Input` (`input.input.search-field-input`, `type="search"`, so `role="searchbox"`), and the clear button (`Button.input-button.search-field-clear`, Lucide `X`), then `Description` and `FieldError`. A field with no visible label carries `data-unlabelled` on its root.
- **Keys.** React Aria's: Escape clears the text, Enter calls `onSubmit`. The clear button stays out of the tab order, as React Aria sets it, because Escape does the same from the field; a press clears and puts focus back in the input. It leaves the layout while the field is empty (`.search-field[data-empty] .search-field-clear { display: none }`), so an empty field has no stray target. The browser's own cancel button is hidden (`::-webkit-search-cancel-button { appearance: none }`), so there is one clear control.
- **URL state.** Controlled from the search parameter: the app passes `value` and writes the URL in `onChange` after its own pause, or in `onSubmit`. The docs page shows both with the Next App Router (ruling 6).

### 5.3 Look and CSS

- **Control.** The `.input` pill, unchanged: `--size-field` tall, raised fill, boundary edge, the hover, focus, disabled and invalid edges. `padding-inline-start: 3rem` makes room for the icon and `padding-inline-end: 3rem` for the clear button.
- **Icon.** 20px, slate, at `inset-inline-start: 1rem`, vertically centred. Not mirrored in right to left: a magnifier has no reading direction.
- **The field button.** A new shared class in `input.css`, `.input-button`, used by the clear button here and the combo box button in section 7: a ghost circle `calc(var(--size-field) - 0.75rem)` across (36px, 24px compact) on `--radius-pill`, `inset-inline-end: 0.375rem`, a 16px slate glyph that turns ink on hover, the 5% ink wash on hover inside `@media (hover: hover)`, the standard ring outside it, and the hit area extended to `--size-target` by the formula, so a compact one is still hit at 40px.
- **Placeholder.** Taupe, the input's rule, while a visible label names the field. Under `data-unlabelled` it is slate: a search box in a toolbar has no label row, and its placeholder is then the only words a sighted reader gets, which is the exception CommandPalette recorded (slate 5.49 light, 6.94 dark on float; on raised the plan measures and records both).
- **Forced colors.** The icon and the clear glyph are `CanvasText`; the input keeps `input.css`'s rules.

## 6. Select and the option list

### 6.1 The option part

```ts
export interface PickerOptionProps<T extends object = object>
  extends Omit<RACListBoxItemProps<T>, 'className' | 'children' | 'style' | 'href'> {
  /** The label. A string is also the option's text value, for typeahead, filtering and the trigger. */
  children: ReactNode;
  /** A hint under the label, in slate. It becomes the option's accessible description. */
  description?: ReactNode;
  /** A 16px icon at the start, hidden from assistive technology. Shown in Select's trigger too. */
  icon?: ReactNode;
  /** A preformatted value at the end, such as a count or an amount. Never formatted here. */
  end?: ReactNode;
  className?: string | ((values: ListBoxItemRenderProps & { defaultClassName: string | undefined }) => string);
  ref?: Ref<HTMLDivElement>;
}

export interface PickerSectionProps<T extends object = object>
  extends Omit<RACListBoxSectionProps<T>, 'className' | 'style'> {
  /** The heading above the section's options, in the overline style. */
  title?: ReactNode;
  className?: string;
  ref?: Ref<HTMLElement>;
}
```

- **Markup.** `ListBoxItem.menu-item.picker-option` with `span.menu-item-icon`, `span.menu-item-text` holding `Text slot="label"` (`menu-item-label`) and `Text slot="description"` (`menu-item-description`), `span.menu-item-end`, and `span.menu-item-check` (Lucide `Check`). It is MenuItem's anatomy without the key hint and the danger variant, so it takes every row rule in `menu.css` with no new CSS: the 40px row (44px on a coarse pointer), the wash, the inset ring, the single ink pill with its check, the multiple check alone, taupe when disabled, and the forced-colors rules.
- **Names.** The label names the option; React Aria describes it by the hint, and the end value's id joins `aria-describedby` ahead of it, exactly as on MenuItem. The stories reuse `MENU_ROW_A11Y` for the label-in-name rule.
- **No `href`.** An option that navigates is a menu item, not a choice; `PickerOption` omits it.
- **`PickerSection`** is `ListBoxSection.menu-section` with a `Header.menu-heading`, MenuSection's look.

### 6.2 Select API

```ts
export interface SelectLabels {
  /** The filter field's name and placeholder. @default 'Filter' */
  filter: string;
  /** The line shown when the filter matches nothing. @default 'No matches' */
  empty: string;
}

export interface SelectBaseProps<T extends object = object>
  extends Omit<
    RACSelectProps<T, 'single'>,
    'children' | 'className' | 'selectionMode' | 'selectedKey' | 'defaultSelectedKey' | 'onSelectionChange'
  > {
  label?: ReactNode;
  description?: ReactNode;
  errorMessage?: ReactNode | ((validation: ValidationResult) => ReactNode);
  /** Shown in taupe while nothing is chosen. @default 'Choose an option' */
  placeholder?: string;
  /** Shows the clay Changed chip and the light signal orange edge. */
  isChanged?: boolean;
  /** @default 'Changed' */
  changedLabel?: string;
  /** The options as data, rendered by a function child. Omit it for static `PickerOption` children. */
  items?: Iterable<T>;
  children: ReactNode | ((item: T) => ReactElement);
  /** A filter field at the top of the list. @default true at 9 options or more, false under (ruling 7) */
  isFilterable?: boolean;
  labels?: Partial<SelectLabels>;
  /** @default 'bottom start' */
  placement?: Placement;
  popoverClassName?: string;
  className?: string | ((values: SelectRenderProps & { defaultClassName: string | undefined }) => string);
  ref?: Ref<HTMLDivElement>;
}

export type SelectProps<T extends object = object> = SelectBaseProps<T> & AccessibleName<'label'>;
```

`value: Key | null`, `defaultValue` and `onChange(value: Key | null)` come from React Aria, as do `name`, `isRequired`, `isDisabled`, `isInvalid`, `validate`, `disabledKeys`, `isOpen` and `onOpenChange`.

### 6.3 Behavior

- **Markup.** `RACSelect.field.select` (React Aria sets `data-open`, `data-invalid`, `data-disabled`; the wrapper sets `data-changed`) holding the `FieldHead`, then `Button.input.select-trigger` with `SelectValue.select-value` and `span.select-chevron[aria-hidden="true"]` (Lucide `ChevronDown`), then `Description`, `FieldError`, and `Popover.menu-popover.select-popover` (with `matchTriggerWidth`) holding the list: `ListBox.menu.select-list`, or, when filterable, `Autocomplete` around `div.select-filter` (a `SearchField`) and the list.
- **The trigger's value.** `SelectValue` renders the chosen option's own content, so the trigger shows its icon and label; its hint, end value and check are hidden there by CSS (`.select-value :is(.menu-item-description, .menu-item-end, .menu-item-check) { display: none }`). With nothing chosen it shows the placeholder and React Aria sets `data-placeholder`.
- **Keys, closed.** Enter, Space, Arrow Down and Arrow Up open the list; typing a letter chooses the next option starting with it without opening, as React Aria does.
- **Keys, open.** The arrows move, Home and End jump, Page Up and Page Down move a page, letters find an option when there is no filter, Enter or Space chooses and closes, Escape and Tab close and focus returns to the trigger. The arrows stop at the ends, as the Menu's do.
- **The filter past 8 options.** Inside the popover the wrapper counts the options, not sections or headings, from React Aria's collection (`SelectStateContext`). At 9 or more, or with `isFilterable`, the list sits in React Aria's `Autocomplete` under a `SearchField` named `labels.filter`. Focus goes to the field, the arrows move a virtual focus through the list (`aria-activedescendant`), Enter chooses the active option, and Escape clears the text first and closes on the second press. An option stays when every whitespace-separated word of the query appears in its text value, through `useFilter({ sensitivity: 'base' }).contains`, CommandPalette's rule, so case and accents do not count; a section with nothing left hides. The text empties each time the list opens. With nothing matching, `renderEmptyState` draws `div.picker-empty` with `labels.empty`. The collator is made only once the popover opens, in the browser, as the palette's is.
- **On a coarse pointer** the filter field does not take focus when the list opens, so a phone's keyboard does not cover the list for a short scroll; the field is one tap away. The check is `matchMedia('(pointer: coarse)')` in the open handler, an event and not render (ruling 7).
- **Phones.** The list stays a popover at every width (ruling 2): React Aria flips it above the trigger when there is more room there, caps its height to the room left, and keeps it 12px inside the viewport, and the popover's width caps at the viewport less 2rem.
- **Forms and URL state.** `name` submits the chosen key through React Aria's hidden select. For URL state the app passes `value` from the search parameter and writes the URL in `onChange`. A Select has no clear action of its own: an app that needs "Any" adds it as an option, and 3b's filter chip brings the clear control.

### 6.4 Look and CSS

- **Trigger.** The `.input` pill, with `display: flex; align-items: center; gap: var(--spacing-part)`, `padding-inline: 1.5rem 1rem`, `text-align: start` and `cursor: pointer`. It inherits every edge rule, including `.field[data-changed] .input` and `.field[data-invalid] .input`, because the root is a `.field`. The value is `--text-body` in ink on one line, ellipsized (`min-width: 0`); `[data-placeholder]` is taupe. The chevron is 16px slate at the inline end and turns half a turn while open (`.select[data-open] .select-chevron { rotate: 180deg }`, 140ms, none under reduced motion). An option's icon in the trigger is 16px slate.
- **Popover.** `menu-popover`'s width rule, at least the trigger's width (`matchTriggerWidth`) and at least 12rem, capped at the viewport less 2rem; React Aria's `maxHeight` is set to 320px, about seven rows with hints, so a long list scrolls in a panel that does not run to the screen's edge. The list is the one scroller, as in the Menu.
- **Filter row.** `div.select-filter` pads `var(--spacing-part)` with a 1px `--color-divider` rule under it and does not scroll with the list. It sets `--size-field: var(--size-control)` for its subtree, so its input is 40px (36px compact): a field inside a popup is one step smaller than a field on the page, read from the tokens with no literal.
- **List and rows.** The Menu's: 8px of padding, 4px between rows, the ink pill and check on the chosen row.
- **Empty line.** `div.picker-empty`: `padding: 0.5rem 0.75rem`, `--text-small`, slate.
- **Forced colors.** The trigger keeps the input's rules; the chevron is `CanvasText`; the rows keep the Menu's.
- **Right to left.** The chevron is not mirrored (it points down); the popover aligns to the trigger's start through React Aria.

## 7. ComboBox and MultiSelect

### 7.1 ComboBox API

```ts
export interface PickerLabels {
  /** The button's name. @default 'Show options' */
  open: string;
  /** @default 'No matches' */
  empty: string;
  /** @default 'Loading' */
  loading: string;
}

export interface ComboBoxBaseProps<T extends object = object>
  extends Omit<
    RACComboBoxProps<T, 'single'>,
    'children' | 'className' | 'selectionMode' | 'selectedKey' | 'defaultSelectedKey' | 'onSelectionChange'
  > {
  label?: ReactNode;
  description?: ReactNode;
  errorMessage?: ReactNode | ((validation: ValidationResult) => ReactNode);
  placeholder?: string;
  isChanged?: boolean;
  changedLabel?: string;
  children: ReactNode | ((item: T) => ReactElement);
  /** Shows the Spinner in the field while the app loads options. The list keeps what it has. */
  isLoading?: boolean;
  labels?: Partial<PickerLabels>;
  placement?: Placement;
  popoverClassName?: string;
  className?: string | ((values: ComboBoxRenderProps & { defaultClassName: string | undefined }) => string);
  ref?: Ref<HTMLDivElement>;
  inputRef?: Ref<HTMLInputElement>;
}

export type ComboBoxProps<T extends object = object> = ComboBoxBaseProps<T> & AccessibleName<'label'>;
```

### 7.2 ComboBox behavior

- **Markup.** `RACComboBox.field.combo-box` holding the `FieldHead`, `div.combo-box-control` with `Input` (`input.input.combo-box-input`, `role="combobox"`), the `Spinner` while `isLoading`, and `Button.input-button.combo-box-button` (Lucide `ChevronDown`, named `labels.open`), then `Description`, `FieldError`, and `Popover.menu-popover` holding `ListBox.menu`.
- **Opening.** Typing opens the list filtered by the text (`menuTrigger="input"`, React Aria's default); the button and Arrow Down open it with every option. React Aria keeps focus in the input and moves a virtual focus through the list.
- **Choosing.** Enter or a press chooses and closes, and the input shows the option's text value. Escape closes the list, and a second Escape restores the input to the chosen value. Leaving the field puts the chosen value's text back unless `allowsCustomValue`.
- **Filtering.** React Aria's default, `contains` at base sensitivity on the text value. For options from a server, the app passes `items` and `inputValue`, listens to `onInputChange`, filters and caps, and sets `isLoading` while it waits: React Aria does no filtering of controlled `items`.
- **Nothing matches.** `allowsEmptyCollection` is on, so the list stays open with `div.picker-empty` saying `labels.empty`, or `labels.loading` while loading with nothing yet, instead of vanishing, which reads as a broken field.
- **Announcements.** React Aria announces the number of options when the list opens and the chosen option, in its own localized strings, after interaction.

### 7.3 ComboBox look

The `.input` pill with `padding-inline-end: 3rem` for the button, and 4.5rem while the Spinner shows before it. The button is the shared `.input-button` (section 5.3). The list is Select's. Forced colors and right to left as Select's.

### 7.4 MultiSelect API

```ts
export interface MultiSelectLabels extends PickerLabels {
  /** The name of the group of chosen values. @default 'Selected' */
  selected: string;
  /** Each tag's remove button; React Aria reads it with the tag's text. @default 'Remove' */
  remove: string;
}

export interface MultiSelectBaseProps<T extends object = object>
  extends Omit<
    RACComboBoxProps<T, 'multiple'>,
    'children' | 'className' | 'selectionMode' | 'allowsCustomValue' | 'selectedKey' | 'defaultSelectedKey' | 'onSelectionChange'
  > {
  label?: ReactNode;
  description?: ReactNode;
  errorMessage?: ReactNode | ((validation: ValidationResult) => ReactNode);
  placeholder?: string;
  isChanged?: boolean;
  changedLabel?: string;
  children: ReactNode | ((item: T) => ReactElement);
  isLoading?: boolean;
  labels?: Partial<MultiSelectLabels>;
  placement?: Placement;
  popoverClassName?: string;
  className?: string | ((values: ComboBoxRenderProps & { defaultClassName: string | undefined }) => string);
  ref?: Ref<HTMLDivElement>;
  inputRef?: Ref<HTMLInputElement>;
}

export type MultiSelectProps<T extends object = object> = MultiSelectBaseProps<T> & AccessibleName<'label'>;
```

`value: Key[]`, `defaultValue` and `onChange(value: Key[])` come from React Aria's multiple mode.

### 7.5 MultiSelect behavior

- **Basis.** React Aria's `ComboBox` with `selectionMode="multiple"`, and the chosen values drawn by its `ComboBoxValue` render function as a React Aria `TagGroup` (ruling 1).
- **Markup.** `RACComboBox.field.multi-select` holding the `FieldHead`, `div.input.multi-select-control` (the drawn frame) with the `TagGroup.multi-select-tags` (named `labels.selected`, with the field's label through `aria-labelledby`), a `TagList`, each `Tag.multi-select-tag` holding its text and `Button slot="remove"` (`multi-select-tag-remove`, Lucide `X`), then `Input.multi-select-input`, the `Spinner` while loading, and the `.input-button`; then `Description`, `FieldError`, and the popover and list as ComboBox's.
- **Choosing.** A press or Enter toggles an option, the list stays open for the next, and the input's text empties so the next search starts clean. A chosen option shows the check alone, no ink pill: the Menu's multiple rule.
- **Removing.** A tag's remove button; Backspace or Delete on a focused tag; and Backspace in an empty input, which first moves focus to the last tag and removes it only on a second press, so one key never loses a value unseen. After a removal focus goes to the next tag, the previous one when it was the last, and the input when none is left.
- **Tab order.** The tags are one stop (a grid; the arrows move between them, in the drawn direction in right to left), then the input; the button is out of the tab order, as React Aria sets it. A press on the frame outside a tag focuses the input.
- **Many values.** The frame grows a row at a time; nothing collapses into "and 3 more" in 3a. The filter chip of 3b summarizes in its pill.
- **Forms and URL state.** `name` submits the chosen keys through React Aria's hidden inputs (verified in the plan's first task, R2). For URL state the app passes `value` from a repeated or a comma-joined parameter and writes it in `onChange`.

### 7.6 MultiSelect look

- **Frame.** The `.input` edge, fill and states on a `div`, with `height: auto; min-height: var(--size-field)`, `display: flex; flex-wrap: wrap; align-items: center; gap: 0.25rem`, `padding-block: 0.375rem` and `padding-inline: 0.5rem 3rem`. The corner is `min(var(--radius-pill), var(--size-field) / 2)`: a full pill while it is one row (24px on a 48px frame), and the 24px surface step once it wraps, as TextArea's frame is, instead of a stadium that clips the tags at its ends. Soft and Square take their own smaller pill value. The input itself has no border or fill; while it has keyboard focus the frame draws `.input`'s focus edge and ring (`.multi-select-control:has(.multi-select-input:focus-visible)`), and not through `:focus-within`, so a focused tag rings itself and not the frame.
- **Tag.** `--radius-pill` (a chip takes no nested step), `calc(var(--size-field) - 0.75rem)` tall (36px, 24px compact), `padding-inline: 0.75rem 0.25rem`, `--color-bone` fill, the option's label in `--text-small` at weight 500, ink, one line and ellipsized past 12rem. Ink on bone is gated (16.76 light, 15.36 dark); bone against raised is a cue, and the tag's text carries it. A focused tag takes the standard ring outside it.
- **Remove button.** A 20px ghost circle with a 12px slate `X`, ink on hover, the hit area extended to 24px by a pseudo-element, which meets WCAG 2.5.8 next to a neighbor 4px away because the extension stays inside the tag's own padding; it is not extended to 40px, which would cover the next tag.
- **Disabled.** The frame's disabled look; tags taupe text, no remove buttons.
- **Forced colors.** Tags take a 1px `CanvasText` border, since the bone fill does not survive; the remove glyph is `CanvasText`.

## 8. Tabs

### 8.1 API

```ts
export interface TabsProps extends Omit<RACTabsProps, 'className' | 'orientation'> {
  className?: string;
  ref?: Ref<HTMLDivElement>;
}

export type TabListProps<T extends object = object> =
  Omit<RACTabListProps<T>, 'className' | 'style'> & Partial<AriaName> & { className?: string; ref?: Ref<HTMLDivElement> };

export interface TabProps extends Omit<RACTabProps, 'className' | 'style' | 'children'> {
  id: Key;
  /** The tab's name: a word or two. */
  children: ReactNode;
  /** The tab's panel holds unsaved changes. Shows the clay dot and has a screen reader read `changedLabel`. */
  isChanged?: boolean;
  /** @default 'Changed' */
  changedLabel?: string;
  className?: string;
  ref?: Ref<HTMLDivElement>;
}

export interface TabPanelProps extends Omit<RACTabPanelProps, 'className'> {
  className?: string;
  ref?: Ref<HTMLDivElement>;
}
```

`selectedKey`, `defaultSelectedKey`, `onSelectionChange`, `keyboardActivation`, `isDisabled` and `disabledKeys` are React Aria's, on `Tabs`. A `Tab` takes `href` and the other link props from React Aria.

### 8.2 Behavior

- **Markup.** `RACTabs.tabs` holding `TabList.tab-list` (`role="tablist"`) of `Tab.tab` (`role="tab"`, a `div`, or an `a` when it has `href`, which React Aria renders) with `span.tab-label` and, when changed, `span.tab-changed[aria-hidden="true"]`; then `TabPanel.tab-panel` (`role="tabpanel"`). The whole selected state renders on the server.
- **Keys.** React Aria's: Left and Right move between tabs, in the drawn direction in right to left, Home and End jump, and with automatic activation focus selects. Tab moves into the panel.
- **Tabs that switch a panel.** Automatic activation, React Aria's default; one `TabPanel` per tab, only the selected one mounted unless `shouldForceMount`.
- **Tabs that are links** (ruling 3). Each `Tab` has `href`; the app passes `selectedKey` from the URL and no `onSelectionChange`, and sets `keyboardActivation="manual"`, so the arrows move focus without loading a route per key press and Enter or a press follows the focused tab's link through `RouterProvider`. The app renders one `TabPanel` whose `id` is the selected key, holding the route's content, so `aria-controls` points at the content that is there. A modified or middle click opens the link as the browser would.
- **The changed dot.** `isChanged` is for a tab whose panel holds unsaved edits, and only that: clay means unsaved. The dot is drawn and hidden; `changedLabel` sits in a visually hidden span named by the tab's `aria-describedby`, so a screen reader hears "Rules, tab, 2 of 4, Changed", and the name stays the tab's words. A count or a "new" marker goes in the tab's children (a `Badge` fits), never in clay.
- **A row that does not fit.** The tab list scrolls inline inside itself; the page never scrolls sideways. A focused tab scrolls into view as the browser does for focus; the selected tab is scrolled into view once after mount with `scrollIntoView({ block: 'nearest', inline: 'nearest' })`, an effect and not a measurement before first paint, so the server's HTML shows the start of the row and the selected tab arrives on hydration (R6).

### 8.3 Look and CSS

- **Track.** `.tab-list`: `display: inline-flex; max-width: 100%; gap: 0.25rem; padding: 0.25rem; border-radius: var(--radius-surface)` on `--color-canvas`, with no edge, as the design document derives it ("a tab switches what is shown and holds no value, so it should not read as a field"). `overflow-x: auto; overscroll-behavior-inline: contain; scrollbar-width: thin` with `--color-scrollbar`. On a card the track shows as a tint; on the page's own canvas it disappears and the pills carry the row, which is the design document's choice.
- **Tab.** `min-height: var(--size-control)` (40px, 36px compact, hit at 40px by the formula), `padding-inline: 1rem`, `--radius-pill`, `--text-action` (16px, weight 500), slate, `white-space: nowrap`. Hover is the 5% ink wash inside `@media (hover: hover)`, never on the selected tab. Selected (`[data-selected]`) is the ink fill with canvas text: canvas on ink 16.25 light, 19.31 dark, gated. Keyboard focus on an unselected tab is the standard ring outside; on the selected tab it is SegmentedControl's inset canvas ring. Disabled is taupe with `cursor: not-allowed`.
- **Changed dot.** 6px, `--radius-dot`, `--color-clay`, `margin-inline-start: var(--spacing-part)`, centred on the label's line. Clay against the canvas track is 6.20 light and 7.57 dark, measured; on the selected ink pill it would be 2.62 and 2.55, under the 3:1 a graphic needs, so there it takes a canvas ring the focus-ring width (`outline: var(--focus-ring-width) solid var(--color-canvas)`), which carries its shape at 16.25 and 19.31.
- **Panel.** `.tab-panel` sits `var(--spacing-peer)` under the track; a panel that takes focus (React Aria makes it focusable when it holds nothing focusable) shows the standard ring on `[data-focus-visible]` only.
- **Forced colors.** The selected tab is `Highlight` with `HighlightText`, a disabled tab `GrayText`, the dot `CanvasText`, or `HighlightText` on the selected tab.
- **Right to left.** The row runs from the right with logical properties; nothing is mirrored.

## 9. Pagination

### 9.1 API

```ts
export interface PaginationLabels {
  /** @default 'Pagination' */
  navigation: string;
  /** @default 'Previous' */
  previous: string;
  /** @default 'Next' */
  next: string;
  /** A page control's name, given the page's written label. @default (label) => `Page ${label}` */
  page: (label: string) => string;
}

interface PaginationBase extends Omit<HTMLAttributes<HTMLElement>, 'children' | 'onChange'> {
  /** The current page, counted from 1. */
  page: number;
  /** How many pages there are. */
  pageCount: number;
  /** The range, formatted by the app: "1 to 50 of 1,284". Shown, and spoken after a change. */
  rangeLabel: string;
  /** How a page number is written, such as Persian digits. Runs in the shell. @default String(page) */
  pageLabel?: (page: number) => string;
  /** Page numbers shown each side of the current one. @default 1 */
  siblingCount?: number;
  /** @default true */
  hasPageNumbers?: boolean;
  labels?: Partial<PaginationLabels>;
  ref?: Ref<HTMLElement>;
}

/** Link mode: every control is a link. Pass it from a server component; the function runs there. */
type PaginationLinks = { getPageHref: (page: number) => string; onPageChange?: undefined };
/** Button mode: every control is a button. Use it from a client component. */
type PaginationButtons = { onPageChange: (page: number) => void; getPageHref?: undefined };

export type PaginationProps = PaginationBase & (PaginationLinks | PaginationButtons);
```

### 9.2 Behavior

- **Markup.** `nav.pagination[aria-label]` holding `p.pagination-range` (the visible `rangeLabel`), `ol.pagination-list` of `li` items (the Previous step, the page controls and gaps, the Next step), and `span.pagination-status`, the visually hidden live region.
- **A server-safe shell** (ruling 4). `Pagination.tsx` has no hooks, no `'use client'` and no React Aria import. It computes the page items with a pure function and calls `getPageHref`, `pageLabel` and `labels.page` itself, so a server page passes functions and the client leaves receive only strings and numbers. The leaves are `PaginationLink` and `PaginationButton` (React Aria's `Link` and `Button`) and `PaginationStatus`, each a client file and none exported.
- **Which pages show.** `pageItems(page, pageCount, siblingCount)` in `pagination/pages.ts`: the first page, the last, the current one with `siblingCount` each side, and a gap where pages are left out; a gap of a single page shows that page instead. The number of slots is the same wherever the current page is (7 with the default), so the controls do not move under the pointer as the page changes.
- **Controls.** The current page carries `aria-current="page"` (link mode) or `aria-current="true"` (button mode). A page control's visible text is `pageLabel(n)` and its name is `labels.page(pageLabel(n))`, which contains the visible text. A gap is `span.pagination-gap[aria-hidden="true"]` holding an ellipsis character. Previous and Next go to `page - 1` and `page + 1`; at either end the step is disabled, a React Aria `Link` with `isDisabled` and no `href`, or a disabled `Button`.
- **The spoken range.** `PaginationStatus` (`role="status"`) is empty at first render, so loading a page says nothing, and takes `rangeLabel` 600ms after it last changed, CommandPalette's quiet period: three quick presses of Next say one range. The visible range is not itself live, so it is never read twice.
- **Focus.** A step that becomes disabled while it holds focus (Next on reaching the last page) hands focus to the current page's control, or to the other step when numbers are hidden, so focus is never lost to the body.
- **URL state.** Link mode is the Transactions page's: the server page builds each URL from its search parameters, and the app's router keeps the client leaves mounted across the soft navigation so the status region speaks (R5).
- **Edges.** With `pageCount` of 1 or less the list is not drawn and the range shows alone. A `page` outside 1 to `pageCount` is clamped, with a development warning.

### 9.3 Look and CSS

- **Row.** `.pagination`: `display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: var(--spacing-part) var(--spacing-peer)` and `container-type: inline-size`. The range at the inline start in `--text-small`, slate, tabular figures; the list at the inline end, `display: flex; gap: 0.25rem`.
- **Page control.** `min-width: var(--size-control); height: var(--size-control)` (40px, 36px compact, hit at 40px by the formula), `padding-inline: 0.5rem`, `--radius-pill`, transparent, ink, `--text-action` at weight 500 with tabular figures, and its digits isolated (`unicode-bidi: isolate`). Hover is the 5% wash inside `@media (hover: hover)`. The current page is the ink fill with canvas text and the inset canvas ring on keyboard focus; the others take the standard ring outside.
- **Steps.** The same box with a 16px chevron (Lucide `ChevronLeft` and `ChevronRight`, mirrored by `[dir='rtl'] .pagination-step svg { scale: -1 1 }`, the sidebar's rule) and the word beside it. Disabled is taupe with `cursor: not-allowed` and no wash.
- **Narrow.** Under a 30rem container, a container query and not a viewport query: the numbers and gaps leave (`display: none`), the step words become visually hidden but stay their names, and the row is Previous, the range, Next. A phone keeps two 40px targets and the range.
- **Forced colors.** The current page is `Highlight` with `HighlightText`; disabled steps are `GrayText`.
- **Right to left.** The list runs from the right, so Previous is at the right; the chevrons point the way they go.

## 10. Decisions

### 10.1 Rulings taken by the owner

1. **MultiSelect's basis.** Recommended: React Aria's `ComboBox` in `selectionMode="multiple"` with the chosen values as a `TagGroup` in the field, as the parent spec's "ComboBox, TagGroup" row asked, now with React Aria's own multiple mode and `ComboBoxValue` instead of a hand-kept selection. Alternatives: `Select` in multiple mode with the filter inside the popover and a summary in the trigger ("Food, Rent and 2 more"), which suits a compact toolbar and is what 3b's filter chip will draw, but cannot hold removable tags in a button; or `TokenField`, new in 1.22 and `contenteditable`, rejected in section 4.
2. **The list on phones.** Recommended: the popover at every width (section 6.3); React Aria flips and caps it, and the rows are 44px on a coarse pointer. A Sheet under 768px was considered: it is a modal with a title and a second focus model for one control, React Aria's Select and ComboBox hand their list to a `PopoverContext` and not to a sheet, and a combo box's input would be covered by the soft keyboard under a bottom sheet. 3b's single Filters sheet covers the phone case the consumer named.
3. **Tabs that navigate.** Recommended: React Aria's tabs with `href`, `role="tab"`, `selectedKey` from the URL and manual activation (section 8.2): one component, the arrow keys of a tab list, and React Aria's documented link pattern. The alternative is a separate `TabNav` of plain links with `aria-current="page"` and Tab between them, which is what a site's top navigation is; choose it if the consumer's tabs switch whole pages rather than views of one page.
4. **Pagination's form.** Recommended: Previous, numbered pages with gaps, and Next, with the numbers leaving under a 30rem container, and a server-safe shell that takes `getPageHref` (section 9.2). The alternative is Previous, the range and Next only, which needs no page count from the server and suits an endless or cursor-paged list; it remains available as `hasPageNumbers={false}`.
5. **The option part's name.** Recommended: one shared `PickerOption` and `PickerSection` for Select, ComboBox, MultiSelect and 3b's filter chip. The alternatives are a pair per picker (`SelectItem`, `ComboBoxItem` and so on, three names for one row), or `Option`, which shadows the DOM's global `Option` constructor.
6. **Debounce in SearchField.** Recommended: none; the app pauses before writing the URL, or writes on `onSubmit`, and the docs give the recipe. A `debounceMs` prop would hide a timing the app's router and its data fetching already own, and React Aria's SearchField has none to wrap.
7. **"Past 8 options" and touch.** Recommended: the filter shows at 9 options or more (more than 8), `isFilterable` overrides it either way, and on a coarse pointer the filter field does not take focus when the list opens (section 6.3). The alternative is to focus it everywhere, which opens a phone's keyboard over a list of nine.

### 10.2 Decided here

1. The wrappers expose React Aria 1.22's `value`, `defaultValue` and `onChange` and omit the deprecated `selectedKey`, `defaultSelectedKey` and `onSelectionChange`.
2. One option list: React Aria's `ListBox` in the library's `Popover`, wearing `menu.css`'s classes with no new row CSS; `PickerOption` has MenuItem's anatomy without a key hint, a danger variant or `href`.
3. Select's trigger, ComboBox's input, SearchField's input and MultiSelect's frame all wear `.input`, so every edge and state rule (hover, focus, disabled, changed, invalid) is written once.
4. One new shared class, `.input-button`, for a button inside a field: `calc(var(--size-field) - 0.75rem)`, ghost, hit at 40px.
5. Select's filter: React Aria's `Autocomplete` with a `SearchField` at 40px (`--size-field: var(--size-control)` in the filter row), every word must match at base sensitivity, emptied on each open, `No matches` when empty; the popover's `maxHeight` is 320px.
6. ComboBox keeps its list open when nothing matches (`allowsEmptyCollection`) and shows a loading line and the Spinner while `isLoading`; manual mode is controlled `items`.
7. MultiSelect: the list stays open after a choice and the input empties; Backspace in an empty input focuses the last tag first; the frame's corner is `min(var(--radius-pill), var(--size-field) / 2)`; tags are bone pills; the remove button is hit at 24px.
8. SearchField: the clear button leaves while empty and stays out of the tab order; the browser's cancel button is hidden; slate placeholder only when unlabelled (`data-unlabelled`), the palette's recorded exception.
9. Tabs: the pill row in a canvas track, horizontal only, scrolling inside itself; the selected tab scrolled into view after mount; the clay dot only for unsaved panels, read through `aria-describedby`, ringed in canvas on the ink pill.
10. Pagination: the shell renders on the server and calls the app's functions there; seven constant slots; the range spoken 600ms after it settles; focus handed on when a step disables; numbers leave under a 30rem container.
11. The docs site's own `.tabs`, `.tab` and `.search-field` classes in `apps/docs/components/shell/shell.css` collide with the library's names: the docs preview tabs move to the library's `Tabs`, and the search dialog's row is renamed `search-dialog-field`, in the plan's first task.
12. One 0.4.0 minor release of core and react; size budgets to start at 1.5 kB for SearchField, 3 kB for Select with the option part, 2.5 kB for ComboBox, 3.5 kB for MultiSelect, 1.5 kB for Tabs and 1.5 kB for Pagination, each measured without React Aria, as the existing budgets are.

## 11. Accessibility

- **Roles and names.** SearchField: `searchbox`, named by its label or `aria-label`. Select: a button with `aria-haspopup="listbox"` showing its value, named by the label and the value, opening a `listbox` of `option`s. ComboBox and MultiSelect: `combobox` with `aria-expanded` and `aria-controls`, the list a `listbox`; MultiSelect's tags a `grid` named `labels.selected` and the field's label. Tabs: `tablist`, `tab` with `aria-selected`, `tabpanel` named by its tab. Pagination: `nav` named `labels.navigation`, a list of links or buttons, the current one with `aria-current`.
- **Keys.**

  | Part | Key | Does |
  | --- | --- | --- |
  | Select, closed | Enter, Space, Arrow Down, Arrow Up | Opens the list. |
  | Select, closed | A letter | Chooses the next option starting with it. |
  | Select, ComboBox, MultiSelect, open | Arrows, Home, End, Page Up, Page Down | Move through the options, stopping at the ends. |
  | Select, ComboBox, open | Enter | Chooses and closes. |
  | MultiSelect, open | Enter | Toggles the option; the list stays open. |
  | Any picker, open | Escape | Clears the filter or restores the input first, then closes. |
  | MultiSelect | Backspace in an empty input | Focuses the last tag; again, removes it. |
  | MultiSelect, a tag | Backspace, Delete | Removes it; focus goes to its neighbor or the input. |
  | SearchField | Escape, Enter | Clears; submits. |
  | Tabs | Left, Right, Home, End | Move between tabs, in the drawn direction. |
  | Link tabs | Enter, Space | Follow the focused tab's link. |
  | Pagination | Tab, Enter | Moves between the controls; goes to the page. |

- **Never color alone.** The chosen option has a check as well as the pill; the changed dot is read as a word; the current page is a filled shape and `aria-current`; disabled steps are not focusable.
- **Targets (2.5.8).** Rows 40px, 44px on a coarse pointer; field buttons, tabs and page controls hit at 40px in every density; a tag's remove button hit at 24px, inside the tag.
- **Axe** passes in light and dark for every story, open and closed, with the Menu's `MENU_ROW_A11Y` exception on option rows only.

## 12. Testing

- **Core (`css.test.js`, `token-only.test.js`, `contrast.test.js`).** Each new file (`select.css`, `combo-box.css`, `multi-select.css`, `search-field.css`, `tabs.css`, `pagination.css`) is tokens only, in `@layer components`, imported by `styles.css`, with hover in `@media (hover: hover)`, a forced-colors block and logical properties; `.input-button` joins `input.css`. New pairs pinned: clay on canvas and on ink, the canvas ring on ink, ink on bone for tags, slate on raised for the unlabelled placeholder.
- **React (Vitest, jsdom).**
  - SearchField: Escape clears; Enter submits; the clear button leaves while empty and returns focus; `data-unlabelled` without a label.
  - PickerOption: name from the label, description from the hint and the end value; the check's room in every row.
  - Select: `value`, `defaultValue` and `onChange`; the trigger hides the hint and end value; the filter appears at 9 options and not at 8, and by `isFilterable`; the word filter is accent insensitive; the empty line; no focus in the filter on a coarse pointer (a mocked `matchMedia`); the hidden select submits.
  - ComboBox: typing filters; the button shows every option; the list stays open with nothing matching; manual mode does not filter controlled `items`; `isLoading` shows the Spinner.
  - MultiSelect: toggling keeps the list open and empties the input; the tags render the chosen labels; each removal path and where focus lands; Backspace twice; the form submits every key.
  - Tabs: arrows move and select with automatic activation; link tabs route through a `RouterProvider` spy and do not navigate on arrows with manual activation; the changed dot's description; right to left reverses the arrows.
  - Pagination: `pageItems` for the first, middle and last pages, with a one-page gap shown as a page; `aria-current`; disabled steps at the ends; focus handed on; the status region empty at first, then the range once after 600ms of quiet (fake timers); link mode renders with no client function crossing (a server render with `getPageHref`).
  - Server render: every part in `packages/react/test/server-render.test.tsx`, the Pagination shell with no client directive and no hooks.
- **Storybook.** Each part's states as stories, baselined in the four theme and shape modes and in compact, with the lists open; right-to-left stories for each part in `packages/react/src/rtl/RightToLeft.stories.tsx`; play tests for the keys above (`no-visual`). Baselines change only through `pnpm --filter @snapshot-ui/storybook visual:docker`.
- **Docs e2e.** The completeness maps for each new page; the link tabs and page links navigate client side; a phone-width check that the pagination row and the tab row never scroll the page sideways at 320px; forced colors on the selected tab, the current page and a tag.

## 13. Docs and release

- **Pages:** `search-field`, `select`, `combo-box`, `multi-select`, `tabs` and `pagination`, each with Usage, Props, Accessibility with its Keys table, and Design rules. Tabs, Pagination and SearchField each show the URL-state recipe with the Next App Router (reading the search parameters on the server, writing them with the router on change), which is the consumer's pattern.
- **Design record:** a section per part in Appendix B of `docs/design-system.md`, written by the plan, with every derived value, its reason and the measured pairs.
- **Changesets:** one per part, minor, for `@snapshot-ui/core` and `@snapshot-ui/react`; the batch releases as 0.4.0. `@snapshot-ui/charts` is unchanged.
- **Release note for the consumer:** the pickers take `value` and `onChange`, never `selectedKey`; link tabs need `selectedKey` from the URL and `keyboardActivation="manual"`; Pagination in link mode belongs in a server component and in button mode in a client one; `rangeLabel` arrives formatted; the changed dot is for unsaved panels only.

## 14. Risks

- **R1. React Aria builds a collator at render.** Its `ComboBox` calls `useFilter` on every render, which makes an `Intl.Collator`, on the server too. A collator compares and writes nothing, so no markup depends on the locale and nothing can mismatch on hydration; the consumer's rule is about formatting, and this document reads it so. Mitigation: a server-render test asserts the HTML is the same under two locales, and the release note says it plainly.
- **R2. Multiple selection is new in React Aria's ComboBox.** Its hidden inputs, its announcements and its interplay with `TagGroup` focus are less exercised than single mode. Mitigation: the plan's first MultiSelect task is a spike that tests form submission and focus after removal, with React Aria's single mode plus a hand-kept list as the fallback behind the same props.
- **R3. Virtual focus and mobile screen readers.** The filter field and ComboBox move `aria-activedescendant`, which VoiceOver on iOS follows unevenly. Mitigation: on a coarse pointer Select's focus stays in the list (ruling 7); ComboBox is tested with VoiceOver and TalkBack before release and recorded as not yet verified until then.
- **R4. Class collisions on the docs site.** `apps/docs/components/shell/shell.css` already styles `.tabs`, `.tab` and `.search-field` in the components layer. Mitigation: decision 11, done before the first component so the docs never draw two tab looks.
- **R5. The spoken range across a route change.** If the router remounts the page, the status region is new and says nothing. Mitigation: the docs e2e checks that a soft navigation keeps the region mounted under the Next App Router; if it does not, the docs advise rendering Pagination in the layout segment that persists.
- **R6. The tab row before hydration.** A selected tab past the visible end of a scrolling row is out of view until the effect runs. Mitigation: views are few on the consumer's pages; a visual baseline at 320px with the last tab selected records how it looks before and after.
