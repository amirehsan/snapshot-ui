# Filters: FilterChip, FilterBar, Calendar, RangeCalendar, DateRangePicker and NumberField: design

Status: approved on 2026-10-14. The owner took the ten rulings in section 10.1 as recommended; everything else is decided here and listed in section 10.2.
Parent spec: `docs/specs/2026-10-10-snapshot-ui-design.md`. This document pulls forward the phase 3 rows "NumberField", "DatePicker, DateTimePicker, Calendar" (its Calendar only) and "DateRangePicker", and adds FilterChip and FilterBar, which the parent spec does not list. It answers batch 3b, the second third of batch 3 of the first consumer's roadmap, its Transactions page. The design authority remains `docs/design-system.md`.
Released before this: batch 3a, `@snapshot-ui/core` and `@snapshot-ui/react` 0.4.0 and `@snapshot-ui/charts` 0.1.1 (the pickers). Section 2 lists what this document takes from batches 1 to 3a.

## 1. Goal

Give a list page its filters: a number field that takes an amount of money, a calendar that chooses a day or a range, a date range field, a filter chip that opens a choice or a panel from a pill, and a filter bar that lays the chips out, puts the rest behind "More" and gathers every filter into one sheet on a phone. Ship them as the batch 3b minor release, 0.5.0.

Batch 3 ("Transactions") stays split in three: 3a, released; **3b, this document**; 3c, DataTable and SidePanel.

The hard part of 3b is the consumer's rule against `Intl` at render. React Aria's date and number parts format with `Intl` inside their render, read the device's time zone to find today, and in one place read the platform. Section 4 states how the library keeps all of that out of the server's HTML and the hydration pass; rulings 1 to 6 are the calls it rests on.

Build order, which is also the plan's order:

1. **The server face and NumberField** (sections 4 and 5): the smallest part, and the one that proves the server face on one input.
2. **Calendar and RangeCalendar** (section 6): the grid, its look, the Persian calendar and the `today` rule.
3. **DateRangePicker** (section 7), on RangeCalendar and React Aria's date segments.
4. **FilterChip** (section 8), on Select's list, extracted from 3a into a shared internal module, and on `Popover`.
5. **FilterBar** (section 9): the row, "More", the active count and the Filters sheet.

Out of scope, each recorded where it is deferred:

- DataTable and SidePanel: batch 3c.
- `DatePicker`, `DateTimePicker` and `TimeField` (parent spec, phase 3): built later on this batch's Calendar, its date segments and its server face. A single day is chosen here only with the inline `Calendar`.
- Month and year pickers in the calendar header (React Aria 1.22's `CalendarMonthPicker` and `CalendarYearPicker`), two months side by side, and times in a range. A far date is typed into the segments.
- Saved filter sets, filter views and a filter builder ("where amount is greater than"). The app composes those from these parts.
- Currency conversion, `Intl`'s currency style and any formatting helper (section 4, rulings 4 to 6).
- A measured overflow of the filter row (ruling 8).
- A Persian string table for React Aria's own announcements (risk R5): upstream work, as 3a's open question 1 recorded.

## 2. Depends on

| From batch 3a or earlier | Used here as |
| --- | --- |
| `Popover` (`packages/react/src/popover/Popover.tsx`): the float surface, `isPadded`, the scope copy (`useOverlayScope`), the focus return (`useGiveFocusBack`), the trigger read from `PopoverContext` | The list chip's popover (from React Aria's Select), the custom chip's and "More"'s panel (from `DialogTrigger`), and DateRangePicker's calendar, which React Aria's DateRangePicker hands its group through `PopoverContext` |
| Select's list (`select/Select.tsx`): `SelectList` with the filter past 8 options, the guarded `matchMedia('(pointer: coarse)')` read in the open handler, and `SelectPopover`'s hidden-pass guard (a bare `ListBox` while `SelectStateContext` is null) | The list chip's popover. Both move to `picker/SelectList.tsx`, internal, so Select and FilterChip draw one list |
| `PickerOption`, `PickerSection`, `PickerValueContext` and `menu.css`'s rows | The list chip's options, with no new row CSS |
| `Sheet` and React Aria's `SheetTrigger` (`sheet/Sheet.tsx`): the title, the `footer`, the body that scrolls once open | The one Filters sheet on a phone |
| `DialogTrigger` (`dialog`) and React Aria's `Dialog` | The custom chip's panel and the "More" panel: a popover that is a dialog named by its trigger |
| `Button` (primary, tertiary) and `IconButton` (ghost) | The sheet's Done and Clear all, the row's Clear all, the calendar's previous and next month |
| `Badge` (neutral) | The active count on the phone's Filters button: the design document's "short label for a state or a count" |
| The field parts: `FieldHead`, `Label`, `Description`, `FieldError`, `useChangedDescription`; `data-changed` and `data-invalid` on `.field` | NumberField's and DateRangePicker's label row, Changed chip, hint and error line |
| `Input`, the `.input` rules and `.input-button` (`input.css`) | NumberField's input, its sign and stepper buttons; DateRangePicker's frame and its calendar button |
| `SearchField` | The FilterBar's `search` slot, which the app fills |
| `AriaName`, `AccessibleName<'label'>`, the `Key` type | Names and values, as in 3a |
| `useHydrated` (`collapsible-card/useFolding.ts`) and `useModifierKey`'s server snapshot (`overlay/Shortcut.tsx`): false, or "Mod", on the server and while the page hydrates, the browser's answer from the render after | The server face (section 4). `useHydrated` moves to `utils/useHydrated.ts`, internal |
| BottomTabBar's count of its items through fragments (`bottom-tab-bar/BottomTabBar.tsx`) | FilterBar's count of its active chips, read from props on the server |
| The numeral rule in `copy.css` and the design document's "Numerals": `direction: ltr`, `unicode-bidi: isolate`, tabular figures | The number input's text and the calendar's day numbers |
| The chevron mirror in `sidebar.css`, `[dir='rtl'] ... svg { scale: -1 1 }` | The calendar's month chevrons and the range field's arrow |
| `I18nProvider` | The locale, which sets the calendar system and the digits |
| `present()`, `cx`, `composeRenderProps`, `mergeRefs`, `useControllableState` | As everywhere |

Nothing in 3b renders a link, so `RouterProvider` is not used by a part; the URL recipes in the docs write through the app's router, as 3a's did.

## 3. What the consumer needs

The consumer's roadmap lines for this batch, kept verbatim as input:

> FilterChip and FilterBar: a pill that opens a popover with single choice, multiple choice or custom content; a clear control; a "More" overflow; and one Filters sheet on phones.
> SearchField, DateRangePicker, and a NumberField money mode (dollars and cents, negatives, a decimal keyboard).

SearchField shipped in 3a. The owner's ruling from 3a binds here: lists stay popovers on every screen, and the phone case for filters is **one** Filters sheet, from FilterBar, holding every filter, not a sheet per control.

Its rules for every part, unchanged: `'use client'` only on interactive parts; no `Intl` formatting and no `window` at render, and no first-paint measurement; no external requests; light and dark, all three shapes, right to left (the Persian guide), comfortable and compact density; WCAG 2.2 AA including 2.5.8; navigation through `RouterProvider`; everything exported from the react index, with the CSS in `core/styles.css`. The Transactions page keeps all its state in the URL, so every filter's value, a date range and an amount must be a value a search parameter can hold and a server component can pass.

## 4. Approach

**The server face.** Every date and number part renders React Aria's component on the server and in the browser, so the label, hint, error line, hidden form inputs and every id are in the server's HTML. What React Aria derives from `Intl`, the time zone or the platform never is. On the server and through the hydration pass (`useHydrated()` false), each part draws its face: the same element tree with that text left out or replaced by an `Intl`-free string, and from the first render after hydration React Aria's own text. This is the 3a reading of the rule, as risk R1 put it there: the rule is about what a render writes, and React Aria may build a formatter inside one as long as nothing it formats reaches the server's HTML or the hydration pass (ruling 1). Per part:

| Part | What React Aria writes from `Intl`, the clock or the platform | The face |
| --- | --- | --- |
| NumberField | The input's text (`NumberFormatter`); `inputMode` from an iPhone or Android check; `aria-roledescription`, left off on iOS | The value written by integer arithmetic in ASCII digits with no grouping ("-1234.50"), passed as the `Input`'s `value`, which React Aria's `mergeProps` lets win; `inputMode` set by the wrapper from props in both passes; React Aria's `aria-roledescription` removed in both |
| DateRangePicker | Each segment's text, their order and their names (`DateFormatter`, `Intl.DisplayNames`) | No segments: the frame, the calendar button and the app's `valueLabel` |
| Calendar, RangeCalendar | The month heading, weekday names, day numbers, every cell's name, the root's name (its visible month), and which month shows and which day is today, from `today(timeZone)` with the device's zone | The frame at its final size with nothing in it; the calendar mounts after hydration. In a popover or a sheet it only ever mounts in the browser |
| FilterChip, multiple | `SelectValue`'s `selectedText`, joined by `Intl.ListFormat` | Never drawn: the chip writes its summary through `labels.summary` (ruling 7) |

React Aria also reads the locale: with no `I18nProvider` it is `en-US` on the server and in the hydration pass and the browser's from the next render, so the face is right under either.

**Values the URL can hold.** A date is an ISO string, `'2026-09-01'`, and a range is `{ start, end }` of two (ruling 2); an amount is an integer count of minor units, `123450` for $1,234.50 (ruling 4); a chip's value is a `Key` or a `Key[]`, as 3a's pickers take. Each is a plain value a server component can pass to a client part, which a `CalendarDate` instance is not.

**Strings are the app's.** The library formats no date, no amount and no list. A chip's summary comes from a function the app may replace, a range field's server text and a custom chip's value from the app, and every name the library writes has an English default in `labels`. The locale reaches React Aria through `I18nProvider`, which also chooses the calendar system and the digits: `fa-IR` draws the Persian calendar in Persian digits, `fa-IR-u-ca-gregory` the Gregorian calendar in Persian digits, and `fa-IR-u-nu-latn` Latin digits.

**One filter, two faces.** A `FilterChip` draws as a pill in the filter row and as a labelled section in the "More" panel and the Filters sheet. FilterBar renders its children in each place under a context that says which; the chip's value is the app's, so the copies agree.

**Client where it must be.** Every part here takes focus and keys, so each is a client part. FilterBar's active count is read from its children's props, so the server's HTML already shows it.

Rejected along the way:

- **Native `<input type="date">` and `<input type="number">`.** No range, no Persian calendar on most engines, no styling of the picker, and `type="number"` takes no grouping and drops a trailing zero.
- **`Intl`'s currency style in the input** (ruling 6), and any `formatMoney` or `formatDate` helper: the app formats its own strings, as it did for 3a's range text.
- **A client-only mount for the fields.** Ruling 1's alternative: the label, hint and hidden inputs would leave the server's HTML.
- **A measured overflow of the chip row** (ruling 8).
- **A draft model in the Filters sheet** (ruling 9).
- **A second month beside the first** on wide screens. It needs a width at render or a measurement, and one month fits every popover and the sheet.

## 5. NumberField and money mode

### 5.1 API

```ts
export interface NumberFieldLabels {
  /** The sign button's name. A toggle, pressed while the value is under zero. @default 'Negative' */
  negative: string;
  /** @default 'Increase' */
  increment: string;
  /** @default 'Decrease' */
  decrement: string;
}

export interface MoneyFormat {
  /** The currency's symbol or word, drawn beside the figure and never typed: '$', 'تومان'. */
  symbol: string;
  /** The side of the figure it sits on, in the field's direction (ruling 6). @default 'start' */
  symbolPosition?: 'start' | 'end';
  /** Digits after the decimal separator; the value counts in these minor units. @default 2 */
  fractionDigits?: 0 | 1 | 2 | 3;
}

interface NumberFieldShared extends Omit<
  RACNumberFieldProps,
  'children' | 'className' | 'value' | 'defaultValue' | 'onChange' | 'formatOptions' | 'step' | 'isWheelDisabled'
> {
  label?: ReactNode;
  description?: ReactNode;
  errorMessage?: ReactNode | ((validation: ValidationResult) => ReactNode);
  /** Example text while empty. Taupe under a visible label, slate without one. */
  placeholder?: string;
  isChanged?: boolean;
  /** @default 'Changed' */
  changedLabel?: string;
  /** The number, or null while empty. In money mode an integer count of minor units. */
  value?: number | null;
  defaultValue?: number | null;
  onChange?: (value: number | null) => void;
  /** Values under zero, and the sign button (ruling 5). @default false */
  allowsNegative?: boolean;
  labels?: Partial<NumberFieldLabels>;
  className?: string | ((values: NumberFieldRenderProps & { defaultClassName: string | undefined }) => string);
  ref?: Ref<HTMLDivElement>;
  inputRef?: Ref<HTMLInputElement>;
}

type NumberMode = {
  money?: undefined;
  /** `Intl` options for a plain number, applied after hydration. Not `style: 'currency'`. */
  formatOptions?: Omit<Intl.NumberFormatOptions, 'style' | 'currency'> & { style?: 'decimal' | 'percent' | 'unit' };
  step?: number;
  /** Minus and plus buttons at the inline end. @default false */
  hasStepper?: boolean;
};
type MoneyMode = { money: MoneyFormat; formatOptions?: never; step?: never; hasStepper?: never };

export type NumberFieldBaseProps = NumberFieldShared & (NumberMode | MoneyMode);
export type NumberFieldProps = NumberFieldBaseProps & AccessibleName<'label'>;
```

`minValue`, `maxValue`, `name`, `isRequired`, `isDisabled`, `isReadOnly`, `isInvalid` and `validate` are React Aria's; in money mode the bounds are minor units too.

### 5.2 Behavior

- **Markup.** `RACNumberField.field.number-field[data-money]` holding the `FieldHead` when labelled, `Group.number-field-control` with, in order, the sign button (`Button.input-button.number-field-sign`, Lucide `Minus`) while `allowsNegative`, `span.number-field-symbol` while `money.symbolPosition` is `start`, the `Input` (`input.input.number-field-input`), the symbol while it is `end`, and the stepper buttons while `hasStepper`; then `Description`, `FieldError`, and React Aria's hidden input under `name`, which holds the number as `String()` writes it, or the minor units in money mode. An unlabelled field carries `data-unlabelled`.
- **Money mode.** The wrapper sets React Aria's `formatOptions` to `{ style: 'decimal', minimumFractionDigits: d, maximumFractionDigits: d }` with `d` from `money.fractionDigits`, leaves `step` unset so a typed 12.50 is never snapped to a whole step (React Aria snaps a committed value to `step` when one is set), and converts at the edge: React Aria holds `value / 10 ** d` and `onChange` receives `Math.round(n * 10 ** d)`, or null for an empty field (React Aria's `NaN`). The parse runs after React Aria has rounded the text to `d` places, so the product is an exact integer. A `value` that is not a safe integer is rounded with a development warning.
- **The decimal keyboard.** `inputMode` is `decimal` in money mode, and for a plain number `decimal` when its `formatOptions` allow fraction digits and `numeric` when not, set by the wrapper in both passes. React Aria's own choice (`text` on an iPhone when negatives are allowed, since neither iPhone keyboard has a minus key) is overridden, so the keyboard is the same on every device and the attribute never depends on a platform check at render.
- **Negatives** (ruling 5). Off unless `allowsNegative`, which sets the lower bound to 0 when `minValue` is not given (a `minValue` under 0 without it warns in development). With it on, the sign button shows: a toggle (`aria-pressed`) named `labels.negative`, pressed while the value is under zero, that negates the value, or, on an empty field, puts a minus sign in the input and focus there. A minus typed on a hardware keyboard works too, and the button follows it. The input shows the sign as the locale writes it after hydration ("-1,234.50" in `en-US`), and the ASCII hyphen-minus in the face.
- **Keys.** React Aria's arrows step a plain number by `step` (1 by default) and a money amount by one whole unit; Enter commits and formats. React Aria takes Home and End for the minimum and the maximum, so in a field it no longer calls a spin button (it removes the role) they never move the caret, and on a money field with a lower bound of 0 Home would set the amount to zero; the wrapper stops both in the capture phase on the group, before React Aria's handler, so they move the caret as in any text box (R3). The wheel is off in money mode (`isWheelDisabled`), and React Aria's default, on while focused, for a plain number.
- **Paste.** React Aria parses a paste that replaces the whole text. A pasted amount that carries the field's own symbol ("$1,234.50") has it removed before React Aria parses, so a copied figure pastes.
- **Steppers.** For a plain number only, with `hasStepper`: React Aria's increment and decrement buttons as two `.input-button`s, named from `labels`, out of the tab order as React Aria sets them. A money field has none: an amount is typed, never nudged.
- **URL state.** Controlled from a search parameter as an integer, `?min=2000`, parsed with `Number()` and written in `onChange`, which fires when the value commits (blur or Enter), not on each keystroke.

| Key | Does |
| --- | --- |
| Digits, the decimal separator, a minus | Type, in the locale's digits or Latin ones; a minus only where negatives are allowed. |
| Arrow Up, Arrow Down | Step by `step`, or one whole unit in money mode. |
| Home, End | Move the caret. The wrapper keeps them from React Aria, which would set the minimum or maximum. |
| Enter | Commits and formats the value. |
| Tab | Leaves the field; the sign button is its own tab stop, the steppers are not. |

### 5.3 Look and CSS

- **Control.** The `.input` pill, unchanged, with every edge and state. The input's text is a figure: `direction: ltr; unicode-bidi: isolate`, tabular figures, so the sign stays at the left of the digits in every direction, as the numeral rule says. In left to right it sits at the start; under `[dir='rtl']` it takes `text-align: end`, which in a left-to-right box is the right, the start of a right-to-left line.
- **Symbol.** `span.number-field-symbol`: `--text-body` in slate, out of the input but inside the pill, `inset-inline-start: 1.5rem` (or `end`), and the input pads clear of it by the symbol's own width, set as a custom property from its length in `ch` plus 0.5rem: a property of the string, not a measurement. Its id joins the input's `aria-describedby`, so "Amount, 1,234.50, $" is heard.
- **Sign button.** The `.input-button` at the inline start, its 16px `Minus` slate; pressed, the ink fill with a canvas glyph and the inset canvas ring on focus, the design document's rule for an ink fill. It is hit at 40px by the formula.
- **Placeholder.** Taupe under a visible label, slate under `data-unlabelled`, 3a's rule.
- **Negative amounts are ink.** Never error (nothing failed) and never gain (gain is money that arrived, drawn with a plus sign); the sign carries the meaning.
- **Forced colors.** The input keeps `input.css`'s rules; the symbol is `canvastext`; the pressed sign button is `highlight` with `highlighttext`.

## 6. Calendar and RangeCalendar

### 6.1 API

```ts
/** A range of days as ISO dates, 'YYYY-MM-DD', in the Gregorian calendar whatever the calendar shown. */
export interface DateRange {
  start: string;
  end: string;
}

export interface DateRangePreset {
  id: Key;
  /** The preset's words, the app's: "This month". */
  label: string;
  /** Its range, computed by the app from its own today. */
  range: DateRange;
}

export interface CalendarLabels {
  /** @default 'Previous month' */
  previous: string;
  /** @default 'Next month' */
  next: string;
  /** The name of the row of presets. @default 'Presets' */
  presets: string;
}

interface CalendarShared {
  /** The earliest and latest day that can be chosen, as ISO dates. */
  minValue?: string;
  maxValue?: string;
  /** Days that cannot be chosen, such as a closed day. Receives an ISO date. */
  isDateUnavailable?: (date: string) => boolean;
  /** Today in the app's time zone, as an ISO date (ruling 3). Without it, the device's today after hydration. */
  today?: string;
  /** @default from the locale */
  firstDayOfWeek?: 'sun' | 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat';
  /** React Aria's, to ship only the calendar systems the app uses. */
  createCalendar?: (identifier: CalendarIdentifier) => ICalendar;
  isDisabled?: boolean;
  isReadOnly?: boolean;
  labels?: Partial<CalendarLabels>;
  className?: string;
  ref?: Ref<HTMLDivElement>;
}

export type CalendarProps = CalendarShared &
  AriaName & { value?: string | null; defaultValue?: string | null; onChange?: (value: string) => void };

export type RangeCalendarProps = CalendarShared &
  AriaName & {
    value?: DateRange | null;
    defaultValue?: DateRange | null;
    onChange?: (value: DateRange) => void;
    /** A row of preset ranges above the grid. */
    presets?: readonly DateRangePreset[];
  };
```

A calendar shows no label of its own, so `AriaName` is required: "Date", "Statement period".

### 6.2 Behavior

- **Markup.** `RACCalendar.calendar` (or `RACRangeCalendar.calendar.range-calendar`) holding `header.calendar-header` with `IconButton slot="previous"`, `Heading.calendar-heading` and `IconButton slot="next"`; for a range with presets, `div.calendar-presets[role="group"]` named `labels.presets`, of `Button.calendar-preset[aria-pressed]`; then `CalendarGrid.calendar-grid` (`role="grid"`) with `CalendarGridHeader` of `CalendarHeaderCell.calendar-weekday` and `CalendarGridBody` of `CalendarCell.calendar-day`, each holding `span.calendar-day-number`.
- **The face.** On the server and through hydration the root renders `div.calendar[data-face]` at its final size with nothing in it; React Aria's calendar mounts on the next render. Its root name joins the visible month to the `aria-label` with `Intl`, which is why nothing of it renders earlier.
- **Values.** The wrapper parses with `@internationalized/date`'s `parseDate` and writes `toString()` of the Gregorian date, so the app reads and writes ISO strings whatever calendar the locale shows. A string that does not parse, or a range whose end is before its start, reads as no value with a development warning: a hand-edited URL never throws.
- **Which month shows.** The value's month (a range's start), else `today`'s, else the device's. `today` is passed to React Aria as `defaultFocusedValue`, and the today mark compares each cell with it, ignoring React Aria's `isToday`, which reads the device's zone (ruling 3).
- **A range.** The first choice anchors, the second completes; until then moving or hovering shows the range that would be chosen. A range of one day is allowed. Leaving the grid with a half-chosen range drops it (React Aria's `commitBehavior` `'select'` keeps it; the wrapper passes `'reset'`, so no range the person did not finish is written to the URL). `allowsNonContiguousRanges` stays off.
- **Presets.** A press sets the range to the preset's and moves the view to its start. A preset is pressed while the value equals its range. The library computes no range: "This month" is the app's, from its own today.
- **The Persian calendar.** With `fa-IR`, React Aria draws the Persian calendar, its month names and Persian digits, with the week from Saturday, all from `Intl` in the browser; the ISO values stay Gregorian. React Aria's default `createCalendar` brings every calendar system; an app that uses only Gregorian and Persian passes one that returns `GregorianCalendar` or `PersianCalendar`.

| Key | Does |
| --- | --- |
| Arrow Left, Arrow Right | The previous or next day, in the drawn direction in right to left. |
| Arrow Up, Arrow Down | The same day a week before or after. |
| Home, End | The first or last day of the month. |
| Page Up, Page Down | The same day a month before or after. |
| Shift+Page Up, Shift+Page Down | The same day a year before or after. |
| Enter, Space | Chooses the day; in a range, anchors and then completes it. |
| Escape | Drops a half-chosen range; in a popover it also closes it, since React Aria lets the key through. |
| Tab | Moves between the month buttons, the presets and the grid, which is one tab stop. |

### 6.3 Look and CSS

- **Size.** `width: min(100%, calc(7 * var(--size-control)))`; the grid is `repeat(7, minmax(0, 1fr))` and each day square (`aspect-ratio: 1`), so days are `--size-control` (40px, 36px compact) wherever there is room and shrink with the room under it: 38.86px in the sheet at 320px, 36.3px in a popover there (R4).
- **Header.** The month in `--text-action` at weight 500, ink, centred between two ghost `IconButton`s with 16px chevrons, mirrored in right to left by the sidebar's rule. `var(--spacing-part)` under it.
- **Weekdays.** `--text-small`, slate, React Aria's narrow names, not interactive.
- **Day.** `--radius-pill` (days keep their pill wherever they sit, the design document's rule), the number in `--text-small` with tabular figures and `unicode-bidi: isolate`, ink. Hover is the 5% ink wash inside `@media (hover: hover)`. Keyboard focus is the standard ring inside the cell (`outline-offset: calc(-1 * var(--focus-ring-width))`), since the cells touch.
- **Today.** A 1px `--color-boundary` ring on the number's circle and weight 700: shape and weight, never color alone.
- **Chosen.** A single day and a range's two ends are the ink fill with canvas text, gated (16.25 light, 19.31 dark), and the inset canvas ring on focus. The days between sit on a band of `color-mix(in srgb, var(--color-ink) 10%, transparent)` that runs under the ends' inner halves, so the range reads as one shape; their numbers take weight 500. The band is a cue (measured in the plan, under 3:1): the ends and `aria-selected` carry the state (R8).
- **Unavailable and out of bounds.** Taupe; an unavailable day also has `text-decoration: line-through`. `cursor: not-allowed`.
- **Outside the month.** `visibility: hidden`: React Aria still lays the week out, and the cell holds nothing.
- **Presets.** A wrapping row, `gap: var(--spacing-part)`, of pills `--size-control` tall, `padding-inline: 1rem`, a 1px `--color-boundary` edge, `--text-small` at weight 500, ink; pressed, the ink fill with canvas text. They are FilterChip's look (section 8.3).
- **The face.** `div.calendar[data-face]` takes the width rule above and `aspect-ratio: 7 / 8` (six weeks, a weekday row and the header), so nothing moves when the grid arrives.
- **Forced colors.** Chosen days `highlight` with `highlighttext`; the band a 1px `highlight` edge on its top and bottom; today's ring `canvastext`; unavailable days `graytext`.

## 7. DateRangePicker

### 7.1 API

```ts
export interface DateRangePickerLabels extends CalendarLabels {
  /** The calendar button's name. @default 'Choose dates' */
  open: string;
  /** The two date fields' names, read with the field's label. */
  start: string; // @default 'Start date'
  end: string; // @default 'End date'
}

export interface DateRangePickerBaseProps extends Omit<
  RACDateRangePickerProps<CalendarDate>,
  | 'children' | 'className' | 'value' | 'defaultValue' | 'onChange' | 'minValue' | 'maxValue'
  | 'placeholderValue' | 'isDateUnavailable' | 'granularity' | 'hourCycle' | 'hideTimeZone'
  | 'shouldForceLeadingZeros' | 'allowsNonContiguousRanges'
> {
  label?: ReactNode;
  description?: ReactNode;
  errorMessage?: ReactNode | ((validation: ValidationResult) => ReactNode);
  isChanged?: boolean;
  changedLabel?: string;
  value?: DateRange | null;
  defaultValue?: DateRange | null;
  onChange?: (value: DateRange | null) => void;
  minValue?: string;
  maxValue?: string;
  isDateUnavailable?: (date: string) => boolean;
  today?: string;
  presets?: readonly DateRangePreset[];
  /** The range as the app writes it, shown on the server and until hydration: "1 to 30 Sep 2026". */
  valueLabel?: string;
  labels?: Partial<DateRangePickerLabels>;
  /** @default 'bottom start' */
  placement?: Placement;
  popoverClassName?: string;
  className?: string | ((values: DateRangePickerRenderProps & { defaultClassName: string | undefined }) => string);
  ref?: Ref<HTMLDivElement>;
}

export type DateRangePickerProps = DateRangePickerBaseProps & AccessibleName<'label'>;
```

`startName`, `endName`, `isRequired`, `isDisabled`, `isReadOnly`, `isInvalid`, `validate`, `firstDayOfWeek`, `isOpen`, `onOpenChange` and `shouldCloseOnSelect` are React Aria's; the hidden inputs under `startName` and `endName` hold ISO dates.

### 7.2 Behavior

- **Markup.** `RACDateRangePicker.field.date-range-picker` holding the `FieldHead`, then `Group.input.date-range-control` (the drawn frame) with `DateInput slot="start".date-range-input` of `DateSegment.date-segment`s, `span.date-range-arrow[aria-hidden="true"]` (Lucide `ArrowRight`), `DateInput slot="end"`, and `Button.input-button.date-range-button` (Lucide `CalendarDays`, named `labels.open`); then `Description`, `FieldError`, and `Popover.date-range-popover` holding React Aria's `Dialog` and the `RangeCalendar` of section 6, with `presets`.
- **The face.** On the server and through hydration each `DateInput` renders no segments, and `span.date-range-face` shows `valueLabel`, or nothing; the frame is its full width and the field's height, so nothing moves when the segments arrive. The app that wants the server's HTML to show the range passes `valueLabel`, which it formats as it formats every other string.
- **Typing.** Each segment is React Aria's: digits type, the arrows change it, Backspace clears it, and the next segment takes focus when one is full. Day granularity only. A typed range commits when both ends are complete and valid.
- **Choosing.** The button or Alt+Arrow Down opens the calendar on the value's month, or `today`'s; completing a range or pressing a preset closes it (`shouldCloseOnSelect`), and focus returns to the button.
- **Phones.** The calendar stays a popover (3a's ruling 2): one month fits a 320px screen (section 6.3), and React Aria flips and caps it.
- **URL state.** Two parameters, `?from=2026-09-01&to=2026-09-30`, passed as `value` and written in `onChange`; a value that does not parse reads as none (section 6.2).

| Key | Does |
| --- | --- |
| Tab | Into the start segments, then the end segments, then the button. |
| Arrow Left, Arrow Right | Move between segments, in the drawn direction. |
| Arrow Up, Arrow Down | Change the focused segment. |
| Digits, Backspace | Type into or clear the focused segment. |
| Alt+Arrow Down | Opens the calendar. |
| Escape | Closes the calendar; focus returns to the button. |

### 7.3 Look and CSS

- **Frame.** The `.input` pill on the group, MultiSelect's way: `display: flex; align-items: center; gap: var(--spacing-part)`, `padding-inline: 1.5rem 3rem`, every edge and state through the field's root. While a segment has keyboard focus the frame draws the focus edge and ring (`:has(.date-segment:focus-visible)`).
- **Segments.** Ink, tabular figures, the two inputs isolated so a right-to-left page keeps each date in its locale's order. A placeholder segment is taupe under a visible label and slate under `data-unlabelled`. The focused segment is the ink fill with canvas text on `--radius-micro`, the text-sized chip's radius.
- **Arrow.** 16px slate, mirrored in right to left, since it points from the start to the end.
- **Popover.** `isPadded` steps down to `--spacing-inset` (16px) for the calendar, so a 280px grid fits beside 320px less 2rem.
- **Forced colors.** As TextField; the arrow `canvastext`; the focused segment `highlight` with `highlighttext`.

## 8. FilterChip

### 8.1 API

```ts
export interface FilterChipLabels {
  /** The clear button's name, given the chip's label. @default (label) => `Clear ${label}` */
  clear: (label: string) => string;
  /** A list chip's value, given the chosen options' text values in list order (ruling 7). */
  summary: (texts: readonly string[]) => string;
  /** Select's: the filter's name, and the line when it keeps nothing. */
  filter: string;
  empty: string;
}

interface FilterChipBaseProps {
  /** The filter's name, always shown: "Category". It names the chip, its panel and its section. */
  label: string;
  /** The value as the chip shows it. A custom chip needs it to show a value; a list chip computes one. */
  valueLabel?: string;
  /** Clears the value. A list chip clears through `onChange` without it; a custom chip needs it. */
  onClear?: () => void;
  /** Starts behind "More" in a FilterBar, and joins the row once it has a value (ruling 8). */
  isSecondary?: boolean;
  isDisabled?: boolean;
  labels?: Partial<FilterChipLabels>;
  /** @default 'bottom start' */
  placement?: Placement;
  popoverClassName?: string;
  className?: string;
  ref?: Ref<HTMLDivElement>;
}

type ListChoice =
  | { selectionMode: 'single'; value: Key | null; onChange: (value: Key | null) => void }
  | { selectionMode: 'multiple'; value: readonly Key[]; onChange: (value: Key[]) => void };

export type FilterChipListProps<T extends object = object> = FilterChipBaseProps &
  ListChoice & {
    items?: Iterable<T>;
    children: ReactNode | ((item: T) => ReactElement);
    /** @default true at 9 options or more, Select's rule */
    isFilterable?: boolean;
  };

export type FilterChipCustomProps = FilterChipBaseProps & {
  selectionMode?: undefined;
  /** Free content: a RangeCalendar, two NumberFields, a SegmentedControl. */
  children: ReactNode | ((opts: { close: () => void }) => ReactNode);
};

export type FilterChipProps<T extends object = object> = FilterChipListProps<T> | FilterChipCustomProps;
```

A chip is always controlled: its value is in the URL, and a FilterBar renders it twice (section 9).

### 8.2 Behavior

- **Markup, in the row.** `div.filter-chip[data-active]` holding, for a list chip, `RACSelect` with `selectionMode` whose `Button.filter-chip-trigger` holds `span.filter-chip-label` (React Aria's `Label` for the Select, so the trigger is named by it and then the value), `SelectValue.filter-chip-value` while active, and `span.filter-chip-chevron[aria-hidden="true"]` (Lucide `ChevronDown`); the popover is Select's, through the shared `SelectPopover`. A custom chip is a `DialogTrigger` with the same `Button` and a `Popover.filter-chip-panel` (`isPadded` at `--spacing-inset`) holding React Aria's `Dialog`, named by the trigger, around `children`. While active and clearable, `Button.filter-chip-clear` (Lucide `X`, named `labels.clear(label)`) follows the trigger inside the pill: a sibling, never nested in the trigger.
- **Active.** A list chip is active while `value` is not null or not empty; a custom chip while `valueLabel` is present. An inactive chip shows its label alone.
- **The value it shows** (ruling 7). For a list chip, `labels.summary` of the chosen options' text values, read from React Aria's collection (`state.selectedItems`, built in the hidden pass on the server too, as 3a's Select trigger is), in list order. The default writes "Food", "Food, Rent", or "Food, Rent and 2 more" with string concatenation and `String()`; a Persian page passes its own. `valueLabel` overrides it ("Over $100"). React Aria's `selectedText`, which `Intl.ListFormat` writes, is never drawn.
- **Choosing.** Single: Enter or a press chooses and closes, as Select. Multiple: a press or Enter toggles, the list stays open (React Aria's Select keeps it open in multiple mode), and each toggle calls `onChange`. Single mode has no empty choice in the list (React Aria disallows it there); the clear button is the way back to none.
- **Clearing.** The clear button calls `onClear`, or `onChange(null)` or `onChange([])`, and puts focus on the trigger, since the button leaves with the value. It is a tab stop: for a single chip it is the only keyboard way back to no value.
- **A closed chip's keys.** React Aria's Select chooses the next option on a letter, or on Left and Right, without opening (3a's correction 4). On a filter that is a silent query and a URL write, so the chip stops those keys in the capture phase while closed; Enter, Space, Arrow Down and Arrow Up open it (R3).
- **Modality** (ruling 10). React Aria's popover makes the page inert while open, as the Menu's and Select's do, so a press on the next chip first closes this one. Escape and an outside press close it and focus returns to the trigger.
- **On its own.** A chip outside a FilterBar is a pill in the row's look; in a FilterBar it also draws as a section (section 9.2).

| Key | Does |
| --- | --- |
| Enter, Space, Arrow Down, Arrow Up | Open the list or the panel. A closed chip ignores letters and Left and Right. |
| Arrows, Home, End, Page Up, Page Down | In an open list, as Select's: move, stopping at the ends. |
| Enter | Chooses and closes (single), or toggles and stays open (multiple). |
| Escape | Clears the list's filter first, then closes; closes a panel. Focus returns to the trigger. |
| Tab | In a panel, moves through its content; from the trigger, to the clear button. |
| Enter, Space on the clear button | Clears; focus goes to the trigger. |

### 8.3 Look and CSS

- **Pill.** `.filter-chip`: `display: inline-flex; max-width: 100%`, `min-height: var(--size-control)` (40px, 36px compact, hit at 40px by the formula), `--radius-pill` (a chip keeps its pill in every shape's ladder), a 1px `--color-boundary` edge (gated: 3.06 on canvas, 3.36 on a card), transparent. The trigger: `padding-inline: 1rem 0.75rem`, `gap: var(--spacing-part)`, the label in `--text-small` at weight 500, ink, a 16px slate chevron that turns half a turn while open, Select's rule. Hover and an open chip take the 5% ink wash, hover inside `@media (hover: hover)`. Keyboard focus on the trigger rings the whole pill (`.filter-chip:has(.filter-chip-trigger:focus-visible)`).
- **Active.** The ink fill with canvas text, the system's "on" (the selected tab, the chosen option, the chosen segment): canvas on ink 16.25 light and 19.31 dark, gated. The label stays at weight 450 and the value follows at weight 700, one line, ellipsized past 16rem; the full text is the trigger's name. Never signal orange, never clay: a filter is neither consent nor unsaved.
- **Clear.** The pill's last 2rem, the trigger padding to it: the button is the pill's full height and 2rem wide, so its target is 32 by 40 and touches the trigger without overlapping it, which meets 2.5.8 at its own size. It draws a 24px circle with a 12px canvas `X`, the wash of canvas at 15% on hover, and the inset canvas ring on focus.
- **Disabled.** Taupe text, the edge at ink 15%, `cursor: not-allowed`.
- **Panel.** Popover's float, frame and corner, padded 16px, `max-width: min(22rem, 100vw - 2rem)`.
- **Forced colors.** The edge `canvastext`; active, `highlight` with `highlighttext` and the clear glyph `highlighttext`; disabled `graytext`.
- **Right to left.** The pill runs from the right; the chevron and the `X` are not mirrored.

## 9. FilterBar

### 9.1 API

```ts
export interface FilterBarLabels {
  /** The row's name, the phone button's text and the sheet's title. @default 'Filters' */
  filters: string;
  /** @default 'More' */
  more: string;
  /** @default 'Clear all' */
  clearAll: string;
  /** The sheet's closing button; the app may pass "Show 128 results". @default 'Done' */
  done: string;
}

export interface FilterBarProps {
  /** `FilterChip`s, directly or in fragments, in the order they show. */
  children: ReactNode;
  /** A SearchField, first in the row and kept beside the Filters button on a phone. */
  search?: ReactNode;
  /** Clears every filter in one URL write. Shows Clear all while any filter is active. */
  onClearAll?: () => void;
  /** The number of active filters, for chips wrapped in the app's own components. @default counted from children */
  activeCount?: number;
  /** How the count is written, such as in Persian digits. @default String */
  formatCount?: (count: number) => string;
  labels?: Partial<FilterBarLabels>;
  className?: string;
  ref?: Ref<HTMLDivElement>;
}
```

### 9.2 Behavior

- **Markup.** `div.filter-bar` holding `div.filter-bar-search` (the slot), `div.filter-bar-row[role="group"]` named `labels.filters` with the chips, `DialogTrigger` with `Button.filter-bar-more` and its panel, `Button.filter-bar-clear-all` (tertiary), and `SheetTrigger` with `Button.filter-bar-sheet-button` holding Lucide `ListFilter`, `labels.filters` and a `Badge` with `formatCount(count)` while any filter is active, and the `Sheet`.
- **Two faces.** The children render under `FilterBarContext`: in the row each chip draws as a pill; in the "More" panel and the sheet each draws as `section.filter-section`, named by its `h3.filter-section-title` (the chip's `label`), with a tertiary "Clear" button in its head while active, and its body: for a list chip the same React Aria Select, its trigger drawn as the `.input` pill, Select's look, showing the summary or a slate placeholder; for a custom chip its `children`. The copies share the app's value, so they agree; nothing is copied between them.
- **"More"** (ruling 8). A chip with `isSecondary` and no value is not in the row; it is a section in the "More" panel, a padded popover dialog from the More button. A secondary chip with a value is in the row, after the primary ones in declared order, so an active filter is always visible with its clear button. With no inactive secondary chip, More is not drawn. Nothing is measured: the row wraps when it does not fit.
- **The active count.** Counted from the children's props, through fragments, as BottomTabBar counts its items (a list chip with a value, a custom chip with `valueLabel`), so the server's HTML holds it; `activeCount` overrides it for wrapped chips.
- **Phones** (rulings 8 and 9). Under 768px of viewport the row, More and Clear all leave (`display: none`) and the Filters button shows beside the search: a sheet is a phone surface, so this is the viewport's `--breakpoint-sm`, written out as `copy.css` writes it, with the test that keeps them equal. The button opens one `Sheet` titled `labels.filters` holding every filter as a section in declared order, primary and secondary alike. Its footer holds Clear all (tertiary) while any filter is active, and Done (primary), which closes it.
- **Live** (ruling 9). A change in a chip, a panel or the sheet calls the app's `onChange` at once, so the URL and the results behind the scrim follow; Done only closes, and the app may name it with the new count, which it formats. Swipe, Escape and the close button close the sheet the same way.
- **Clear all.** Calls `onClearAll`; focus goes to the first chip's trigger in the row, or stays on the sheet's Done.

| Key | Does |
| --- | --- |
| Tab | Through the search, each chip's trigger and clear button, More, and Clear all; on a phone, the search and the Filters button. |
| Enter, Space | Open a chip, the More panel or the sheet. |
| Escape | Closes the open panel or the sheet; focus returns to what opened it. |

### 9.3 Look and CSS

- **Row.** `.filter-bar`: `display: flex; flex-wrap: wrap; align-items: center; gap: var(--spacing-part)`. The search slot `flex: 1 1 16rem; max-width: 24rem`; the chip group a wrapping flex row of its own with the same gap, so its `role="group"` box holds every chip; Clear all at the inline end (`margin-inline-start: auto`).
- **More.** An inactive chip's look with the label `labels.more` and the chevron. Its panel holds the sections stacked `var(--spacing-peer)` apart with a `--color-divider` rule between.
- **Sections.** The head is the field label's step (`--text-h4`, weight 700, ink) and the tertiary Clear button at the inline end; the body sits `var(--spacing-part)` under it. In the sheet sections are `var(--spacing-peer)` apart.
- **Filters button.** `Button` secondary with a 16px icon and the Badge; its name is its text, "Filters 2", so the label is the name. Never signal orange.
- **Phone.** `@media (width < 48rem)` swaps the row for the button; the search takes the rest of the line.
- **Forced colors and right to left.** As the parts it holds; the row runs from the right.

## 10. Decisions

### 10.1 Rulings taken by the owner

1. **What "no `Intl` at render" allows for dates and money.** Recommended: the server face (section 4): React Aria's parts render on the server and hydrate with every `Intl`-, clock- and platform-derived text left out or replaced by an `Intl`-free string, and React Aria's text arrives in the first render after hydration; React Aria may build formatters inside a render, as 3a's R1 accepted its collator, and a server-render test pins the HTML byte for byte across locales, time zones and a mocked iPhone. Alternatives: mount the fields only in the browser, which drops the label, hint and hidden inputs from the server's HTML; or render React Aria's text on the server under a pinned locale and zone, which breaks the rule's letter and still differs where Node's and a browser's `Intl` data differ (`fa-IR` currency output carries bidi marks and a U+2212 minus).
2. **The date value type.** Recommended: ISO strings, `'YYYY-MM-DD'` and `{ start, end }`, with `@internationalized/date` a direct dependency of the react package at React Aria's own range (`^3.12.4`), so it adds no bytes, and the first new dependency since 3a's plan recorded none. A server component can pass a string, a URL holds one, and the app never imports a date library. Alternative: React Aria's `CalendarDate`, which a server component cannot pass and every app must construct.
3. **Today and its time zone.** Recommended: an optional `today` ISO date from the app, which knows its user's zone; without it, React Aria's device-zone today, read only in the browser since no calendar renders on the server. Alternative: the device's today always, which near midnight can mark a day that differs from the app's server-computed "This month" preset.
4. **The money value type.** Recommended: an integer count of minor units (`123450`), exact in arithmetic, in the URL and in a database, with `fractionDigits` for a currency of 0 or 3 decimals. Alternatives: a float of whole units (`1234.5`), which invites rounding errors in the app's sums; or a decimal string (`'1234.50'`), exact and readable in a URL but a type every caller must parse.
5. **Negatives and the decimal keyboard.** Recommended: `inputMode="decimal"` on every device and, with `allowsNegative`, a sign toggle at the field's start, because neither the iPhone's nor Android's decimal keyboard has a minus key. Alternative: React Aria's own choice, a text keyboard on an iPhone and a numeric one on Android whenever negatives are allowed, decided by a platform check at render, which also breaks hydration.
6. **The currency symbol.** Recommended: an affix the app supplies (`money.symbol`), drawn beside the input and never typed, on the side the app names in the field's direction: `start` for "$" in English, `end` for a word such as "تومان" on a Persian page, and `end` for "$" there, where Persian writing puts it left of the digits. Alternative: `Intl`'s currency style inside the editable text, where the caret can land in the symbol, a paste must match it, and the locale data decides placement at render.
7. **The list chip's basis and summary.** Recommended: React Aria's Select in single or multiple mode with a chip trigger, which reuses 3a's list and filter whole, keeps typeahead and the list's keys, and builds its collection in the server pass, so the chip writes its summary there from the chosen options' text values through `labels.summary` (an English default, replaceable), with `valueLabel` as an override. Alternative: a `DialogTrigger` and a `ListBox` for every mode, one popover model, with every summary written by the app.
8. **The "More" overflow.** Recommended: declared, not measured: `isSecondary` chips start behind More and an active one joins the row, the row wraps, and a phone gets the sheet at 768px. Alternative: measure the row after hydration with a `ResizeObserver`, as SegmentedControl's stacking does, and move what does not fit into More, which reorders the row as the window, a label or a value changes, and draws every chip in the server's HTML until the measure.
9. **The phone sheet's semantics.** Recommended: live: each change writes the URL at once, the results behind the scrim follow, and Done only closes, named by the app with the new count if it likes. Alternative: a draft with Apply and Cancel, which needs a second copy of every filter's value held by the app and leaves the URL stale while the sheet is open.
10. **The chip's popover modality.** Recommended: React Aria's default, a modal popover that makes the page inert, so a press on the next chip first closes the open one, as the shell spec's Popover correction recorded; it holds focus and hides the page from a screen reader while a filter is chosen. Alternative: `isNonModal` for one-press switching, which drops the focus move, the outside-press dismissal and the inert page, and was kept for controls whose focus stays in a field.

### 10.2 Decided here

1. The server face: one internal `useHydrated()` in `utils/`, moved from `useFolding.ts`; the face is the same element tree, never a second component, so nothing remounts on hydration except an inline calendar, which holds no focus then.
2. Every name React Aria would write with its own localized strings, and which a part shows or renders in the server pass, comes from the library's `labels`, as in 3a: the calendar's month buttons, the calendar button, the steppers, the sign button.
3. NumberField: one component with a `money` mode; money has no steppers, no wheel and no `step`; Home and End move the caret in every mode; negatives are opt-in (`allowsNegative`) in both modes; negative amounts are ink.
4. The number input's text is a figure: `direction: ltr`, isolated, tabular, at the start of the line in either direction.
5. Calendars: one month, days on `--radius-pill`, square cells that shrink under 40px only where the room does, today as a ring and weight, the range as two ink ends on a 10% band, outside days hidden, unavailable days struck through.
6. A half-chosen range is dropped on blur (`commitBehavior: 'reset'`); a range of one day is allowed; no non-contiguous ranges.
7. Presets are the app's ranges with the app's words, on RangeCalendar and DateRangePicker; the library computes no date.
8. DateRangePicker: day granularity only; the face shows `valueLabel`; the arrow between the dates is mirrored.
9. FilterChip: always controlled; no `name`, since filters live in the URL and a FilterBar renders each chip twice; the clear button is a sibling of the trigger, 32 by 40, and a tab stop; a closed chip ignores letters and Left and Right.
10. FilterChip's active look is the ink fill; inactive is the boundary edge on nothing; the value is weight 700 after a weight 450 label.
11. FilterBar: children read through fragments; an active filter is always a chip in the row; More holds only inactive secondary chips; the phone switch is the viewport at 768px; the count is a neutral Badge.
12. The shared list: `SelectList` and `SelectPopover` move from `select/Select.tsx` to `picker/SelectList.tsx`, internal, with Select's behavior unchanged, in the plan's FilterChip task.
13. The docs site's `.chip` and `.chips` classes (`apps/docs/app/site.css`, `apps/docs/app/(home)/home.css`) do not collide: the library's classes are `filter-chip`, `filter-bar`, `filter-section`, `calendar`, `date-range-` and `number-field`, none of which the docs use.
14. One 0.5.0 minor release of core and react; size budgets to start at 2.5 kB for NumberField, 3 kB for Calendar with RangeCalendar, 2.5 kB for DateRangePicker beyond them, 2.5 kB for FilterChip and 2 kB for FilterBar, each measured without React Aria, Lucide and `@internationalized/date`, which the `ignore` list gains.

## 11. Accessibility

- **Roles and names.** NumberField: a `textbox` (React Aria removes the spin button role), named by its label, described by the symbol, the hint and the Changed chip; the sign button a toggle with `aria-pressed`. Calendar: React Aria's `application` root named by `aria-label` and the visible month, a `grid` of `gridcell`s whose buttons are named with the full date and described as today, selected or unavailable. DateRangePicker: a `group` named by the label, two groups of `spinbutton` segments named `labels.start` and `labels.end`, a button opening a `dialog`. FilterChip: a list chip's trigger a button with `aria-haspopup="listbox"`, named by its label and its value; a custom chip's a button opening a `dialog` named by it; the clear button "Clear Category". FilterBar: a `group` named "Filters"; the sheet a `dialog` titled "Filters".
- **Keys.** Each part's table (sections 5.2, 6.2, 7.2, 8.2 and 9.2) states React Aria 1.22.1's behavior as its source reads, with the two capture-phase guards marked as the library's.
- **Never color alone.** An active chip is filled and shows its value; today is a ring and a weight; chosen days are filled and `aria-selected`; unavailable days are struck through; a negative amount has its sign.
- **Targets (2.5.8).** Chips, the clear control (32 by 40), the field buttons, the month buttons, presets and the Filters button are hit at 40px or more in every density. Calendar days are 40px where there is room and no less than 36px at 320px, above the 24px minimum, recorded as the one place the 40px rule gives way (R4).
- **Announcements.** React Aria announces the visible month as it changes and the chosen range, in its strings, which have no Persian (R5).
- **Axe** passes in light and dark for every state, one test per state, open and closed, with no exemption beyond `MENU_ROW_A11Y` on option rows with a hint or an end value, which the list chip inherits from 3a.

## 12. Testing

- **Core (`css.test.js`, `token-only.test.js`, `contrast.test.js`).** Each new file (`number-field.css`, `calendar.css`, `date-range-picker.css`, `filter-chip.css`, `filter-bar.css`) is tokens only, in `@layer components`, imported by `styles.css`, with hover in `@media (hover: hover)`, a forced-colors block and logical properties; the 768px literal in `filter-bar.css` is compared with `--breakpoint-sm`. Pairs pinned: canvas on ink (active chip, chosen day), boundary on canvas and on a card (chip edge), slate on raised (symbol, unlabelled placeholder); measured and recorded: the 10% band, the 15% canvas wash on ink.
- **React (Vitest, jsdom).**
  - NumberField: money converts to and from minor units with no float drift (19.99, 1.005, -0.01); `onChange(null)` when emptied; no snapping; the sign button negates and follows a typed minus; Home and End move the caret; the symbol is in the description and a pasted symbol is dropped; `inputMode` is `decimal` with a mocked iPhone.
  - Calendar and RangeCalendar: ISO in and out, Gregorian under `fa-IR`; an invalid or reversed range reads as none; `today` marks its day and opens its month with a mocked clock in another zone; a half range drops on blur; presets press and show pressed; each key in the table.
  - DateRangePicker: typing commits a range; the calendar opens on Alt+Arrow Down and closes on completion with focus on the button; the hidden inputs hold ISO dates.
  - FilterChip: the summary from text values in list order, overridden by `valueLabel`; single closes and multiple stays open; the clear button clears through `onChange` or `onClear` and focus lands on the trigger; a closed chip ignores letters and Left and Right; the hidden-pass guard holds.
  - FilterBar: the count through fragments and by `activeCount`; More holds only inactive secondary chips and an active one is in the row; the sheet holds every filter and Done closes it; Clear all.
  - Server render: every part in `packages/react/test/server-render.test.tsx`, and a new test that renders each with values under `I18nProvider` `en-US`, `de-DE` and `fa-IR`, with `TZ` set to `UTC` and to `Asia/Tehran` in two Vitest projects, and with a mocked iPhone `navigator`, and asserts the HTML is identical in every case.
  - Hydration: each part hydrated from its server HTML with React's `onRecoverableError` failing the test, then showing React Aria's text after the next render.
- **Storybook.** Each part's states as stories, baselined in the four theme and shape modes and in compact, with popovers open; right-to-left stories for each part in `packages/react/src/rtl/RightToLeft.stories.tsx`, including a Persian calendar in Persian digits, a Gregorian one under `fa-IR-u-ca-gregory` and a money field with the symbol at its end; the face of each field as its own story; play tests for the keys (`no-visual`). Baselines change only through `pnpm --filter @snapshot-ui/storybook visual:docker`.
- **Docs e2e.** The completeness maps for each new page; a phone-width check at 320px that the filter bar, the sheet and a calendar never scroll the page sideways; a filter bar example whose chips write the URL and read it back after a reload; forced colors on an active chip and a chosen range.

## 13. Docs and release

- **Pages:** `number-field`, `calendar`, `date-range-picker`, `filter-chip` and `filter-bar`, each with Usage, Props, Accessibility with its Keys table, and Design rules. The filter bar page carries the Transactions recipe with the Next App Router: every filter read from the search parameters on the server, passed to a client FilterBar, written with the router on change, Clear all as one write, and the sheet's Done naming the result count. The calendar page shows the Persian calendar, Persian digits and both locale extensions. The number field page shows money in the URL as minor units.
- **Design record:** a section per part in Appendix B of `docs/design-system.md`, written by the plan, with every derived value, its reason and the measured pairs, and a section "The server face" for the rule all of them share.
- **Changesets:** one per part, minor, for `@snapshot-ui/core` and `@snapshot-ui/react`, released together as 0.5.0. `@snapshot-ui/charts` has no change of its own, but its `@snapshot-ui/core` peer (`workspace:^`) publishes as `^0.5.0`, and 0.1.1's `^0.4.0` does not admit 0.5, so a patch changeset takes it to 0.1.2, as 3a's did.
- **Release note for the consumer:** dates are ISO strings and amounts are integer minor units; pass `today` from the user's zone; pass `valueLabel` where the server's HTML should show a range; wrap the app in `I18nProvider` with the user's locale, which also chooses the calendar and the digits; a chip is controlled and its summary text replaceable; FilterBar counts chips that are its direct children or in fragments, and `activeCount` covers the rest.

## 14. Risks

- **R1. React Aria runs `Intl`, the clock and a platform check inside its render.** Its number and date state build formatters on the server, Select's value builds an `Intl.ListFormat` in multiple mode, and `useNumberField` checks for an iPhone. None of it reaches the HTML under the server face, but a React Aria update could start writing one into an attribute. Mitigation: the byte-identical server test across three locales, two zones and a mocked iPhone, and the hydration test, both run on every change to React Aria's version.
- **R2. The face changes on hydration.** A Persian page sees Latin digits in an amount, and a range field shows only `valueLabel`, until the first render after hydration. Mitigation: `valueLabel` for the range; the face stories record both states; for an amount the change is the digits and the grouping, in place, with nothing moving.
- **R3. Capture-phase guards.** Home and End in a number field and a closed chip's letters and arrows are stopped before React Aria's handlers by a capture listener on an ancestor, which depends on React's event order. Mitigation: the plan's first NumberField task is a spike that proves both guards in Chromium, WebKit and Firefox; the fallback is a keydown wrapper around React Aria's input props behind the same behavior.
- **R4. Calendar days under 40px.** At 320px a day is 36.3px in a popover and 38.86px in the sheet, since seven cells and their padding do not fit. They meet 2.5.8's 24px and are recorded as the exception; the docs advise the sheet, which is wider, for a phone.
- **R5. React Aria has no Persian strings** for the calendar ("Today", "selected", the range announcement) or the date segments' names, as 3a's open question 1 recorded for the combo box. The library's `labels` name every button it draws; React Aria's cell descriptions and announcements stay English on a Persian page until a string table goes upstream.
- **R6. Every chip renders twice in a FilterBar.** The row and the sheet each hold a React Aria Select, so a long list builds two collections. Mitigation: the sheet's sections mount only while it is open, the row's hidden chips build only their collection, and the plan measures a 200-option chip in both.
- **R7. Two todays.** With `today` from the app, the mark and the opening month follow it, while React Aria's spoken "Today" follows the device's zone; near midnight across zones they can name different days. Mitigation: recorded; the docs say to pass `today` when the app has a zone, and the release note names the edge.
- **R8. The range band is a cue.** A 10% ink band measures under 3:1 against float. The ends are filled and gated, every chosen day is `aria-selected`, and the band takes a `highlight` edge in forced colors; the plan records the measured values and a stronger band is the fallback if review finds the range unreadable.
