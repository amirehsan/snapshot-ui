# Inputs: TimeField, TimeRangeField, DateTimePicker, Slider, ColorField, PhoneField, IconPicker, MediaInput and RichTextEditor: design

Status: draft for the owner's review. Written with a recommended answer to each open question of section 22; nothing here is approved. Everything else is decided here and listed in section 18.
Parent spec: `docs/specs/2026-10-10-snapshot-ui-design.md`. This document completes phase 3 of the parent spec's catalog, "Specialised inputs", by taking its nine rows not yet built: DateTimePicker, TimeField, TimeRangeField, PhoneField, ColorField, IconPicker, MediaInput, Slider and RichTextEditor. The phase's other six rows have shipped: NumberField and SearchField (batch 3a), Calendar and DateRangePicker (batch 3b), DatePicker and FileDropZone (batch 4, "Documents"). The design authority remains `docs/design-system.md`.
Released before this: `main` is at 0.8.0 (batch 5, "Accounts") as this is written. In flight: batch 6 ("Insights", 0.9.0 and `@snapshot-ui/charts` 0.2.0), batch 7 ("Settings", 0.10.0) and the choices batch (`docs/specs/2026-10-19-choices-design.md`, 0.11.0). This phase takes nothing from the choices batch, one part from Insights (`Prose`, for the editor's content) and the corner helpers every batch since 0.6.1 uses. It is too large for one release, so section 2 splits it into three batches, 9a, 9b and 9c, each a minor release.

## Summary for the owner

What this phase adds, in plain words, in the order recommended:

**Batch 9a, "Time"** (one minor release of core and react):

- **TimeField**: a time typed into boxes for the hour, the minute and, in 12 hour regions, AM or PM, in the reader's own order and digits. The arrow keys move the minute by the field's step (1, 5, 10, 15, 20 or 30 minutes), and a clock button opens a short list of times at that step to pick from. It is React Aria's time field, drawn in the library's pill like DatePicker.
- **TimeRangeField**: opening hours for one day, "09:00 to 17:00", as two time fields under one label. Both empty means closed, and the field says "Closed" in words. A range that ends after midnight, "22:00 to 02:00", is allowed when the app says so.
- **DateTimePicker**: DatePicker with a time: the day and the time typed in one field, or the day chosen on the calendar with the time under it in the same popup. The value is a local date and time, "2026-10-20T14:30"; an app that needs a fixed moment passes a time zone.

**Batch 9b, "Pickers"** (one minor release of core and react):

- **Slider** and **RangeSlider**: a value, or a low and a high value, chosen by dragging a round handle along a track, or by the arrow keys. Marks with words under the track are optional.
- **ColorField**: a color as a hex code in a text box, with a swatch at its start that opens a picker (a square for shade, a strip for hue, the app's palette as swatches). An optional chip shows "Aa" in the color and the contrast against a color the app names, in words: "4.8:1, passes AA".
- **PhoneField**: a phone number box that formats the number when the reader leaves it, "(415) 555-0123", and submits it in the international form, "+14155550123". It ships the North American pattern; others are patterns the app passes, and an app that needs every country plugs in its own library through one prop. The library does not ship a phone number database.
- **IconPicker**: a field showing the chosen icon and its name, opening a searchable grid of icons. The app passes the icons it allows. A saved icon name the set no longer has stays chosen and says so, so nothing is lost silently.
- **MediaInput**: one image or file for a setting, such as a logo: a preview with Replace and Remove, a drop zone while empty, the upload's progress, an alt text box for an image, and an optional button that opens the app's own media library.

**Batch 9c, "Rich text"** (a new package, `@snapshot-ui/editor` 0.1.0, and a minor of core for its CSS):

- **RichTextEditor**: formatted text with a toolbar: a paragraph style (paragraph and two heading levels), bold, italic, links, bulleted and numbered lists, a quote, undo and redo, and a view of the HTML source. Built on Tiptap, which the parent spec already chose, in its own package so an app that never edits rich text never downloads it. The heavy editor engine loads after the page is drawn; before then the page shows the field at its final size, and a form submitted before it loads sends the saved text unchanged.

Why: these are the nine rows of phase 3 not yet built. The first consumer's batch 4 named DateTimePicker, TimeField, MediaInput and Slider as later needs (documents spec, section 1), so 9a and 9b serve it first.

Decisions the owner is asked to approve, in short (section 22 has each with its alternative): three batches in the order Time, Pickers, Rich text; no phone number library shipped, with an adapter prop; Tiptap kept for the editor, in its own package; Lucide passed in by the app rather than bundled, with a virtualized grid above 200 icons; MediaInput built on FileDropZone's checks and UploadList's row, holding one value; and the time field's sliders from the source dropped in favor of a list of times.

What it does not add: a time zone chooser, a duration field, vertical sliders, an eyedropper, colors other than sRGB hex, a country list for phone numbers, several files in MediaInput (FileDropZone with UploadList does that), image cropping, tables, images, mentions or collaboration in the editor, and Markdown in or out. Section 1 lists where each is deferred.

## 1. Goal

Finish phase 3 with the nine inputs it lists, each held to the bar the later batches set: React Aria's behavior where React Aria has the part, real form submission and reset, the changed, invalid and disabled states the field contract asks for, a server face that is final or close to it, right to left, compact density and a coarse pointer, forced colors, and the concentric corner and intrinsic size rules of the design record. Ship them as three minor releases.

The hard parts:

- **Time has no step in React Aria.** React Aria's `TimeField` moves the minute by one on an arrow key and has no step prop (checked against 1.22.1's `TimeFieldProps`; to verify that no internal option exists). The source steps by 1 to 30 minutes, so the library adds the step over React Aria's segment without forking it.
- **A range of times is not a React Aria part.** TimeRangeField is two `TimeField`s, a group, a closed state that is the absence of a value, and an overnight rule.
- **The server face.** Every time and date segment is written by `Intl`. TimeField and DateTimePicker take DatePicker's face (section 5); Slider's output and its `aria-valuetext` are written by `Intl.NumberFormat`, so it needs a face too; ColorField's hex text does not.
- **Phone numbers vary by country,** and a full set of rules is about a hundred kilobytes that most apps never need (section 6.2).
- **An icon set can be two thousand icons.** Lucide 1.55.0 has 2,141 names in its dynamic import map, aliases included; drawing them all is slow and bundling them all is huge (section 6.4).
- **A rich text editor is the largest dependency the library would ever take,** with its own accessibility, server and license questions (section 6.3), and the source's editor carried a license the library cannot (parent spec, section 7).
- **Focus never falls to the body.** A MediaInput whose file is removed, a picker that closes, an editor that swaps to its source view and back, a link popup that is dismissed: each names where focus goes.

Build order inside each batch, from the least risk to the most, so the shared rules land first:

1. **9a.** TimeField (section 7), then TimeRangeField on it (section 8), then DateTimePicker on TimeField and DatePicker (section 9).
2. **9b.** Slider and RangeSlider (section 10), whose track and thumb ColorField's picker reuses; ColorField (section 11); PhoneField (section 12); IconPicker (section 13); MediaInput (section 14).
3. **9c.** The package, the engine spike, then RichTextEditor (section 15).

Out of scope, each recorded where it is deferred:

- **A time zone chooser.** DateTimePicker takes a zone from the app and can show it; choosing one is a Select of the app's zones (open question 9).
- **A duration field** ("1 h 30 min"). NumberField with a unit covers most; a later part if a consumer asks.
- **Vertical sliders, sliders with more than two thumbs, and a slider with a number box beside it** (Carbon's). Open question 13.
- **An eyedropper, color spaces other than sRGB, and named colors.** The `EyeDropper` API is in Chromium only (to verify), and every value here is a hex code.
- **A built-in country list for phone numbers.** The app passes the patterns it supports (open question 17).
- **Several files in MediaInput.** FileDropZone with UploadList holds a list; MediaInput holds one value (section 6.5).
- **Cropping and focal points.** A focal point is a later use of the choices batch's PositionPad with `dir="ltr"` (its section 8.3).
- **In the editor:** tables, images, embeds, mentions, comments, collaboration, Markdown input or output, and paste from a word processor beyond what the schema keeps (open question 26).
- Number, date and time formatting, as everywhere: every figure the library writes before hydration is the app's string or ASCII digits.

## 2. The batch split

The phase is nine parts, three of them new kinds of control (a slider, a color picker, a rich text editor) and one a new package. One release would hold about 90 new stories and 485 baselines (section 24), and its slowest part, the editor, would hold back the time fields the consumer named first. So it is three batches, each a minor release with its own plan.

| Batch | Parts | Package releases | Why together |
| --- | --- | --- | --- |
| **9a, Time** | TimeField, TimeRangeField, DateTimePicker | core and react, minor | One family on React Aria's date segments, DatePicker's frame and its server face; TimeRangeField and DateTimePicker are built from TimeField |
| **9b, Pickers** | Slider, RangeSlider, ColorField, PhoneField, IconPicker, MediaInput | core and react, minor | Single-value fields with a popup or a preview, each on a part that exists (Popover, SelectPopover, FileDropZone's checks, UploadList's row) or a React Aria part new to the library (Slider, the color parts) |
| **9c, Rich text** | RichTextEditor | `@snapshot-ui/editor` 0.1.0; core minor for `rich-text-editor.css`; react patch only if a shared part changes | A new package with its own dependency, size budget and server story |

**Recommended order: 9a, then 9b, then 9c** (open question 1).

- **9a first.** It is the smallest risk: React Aria's `TimeField` and DatePicker's tested frame, segments, year hold and face carry most of it, and the consumer named DateTimePicker and TimeField first. Its spike is the minute step (risk R1).
- **9b second.** Slider is new but small and settles the track and thumb that ColorField's picker reuses, so it goes first in 9b. MediaInput comes last because it composes the most (FileDropZone's checks, UploadList's row, a TextField for alt text, the app's adapter).
- **9c last.** It has the largest dependency decision and its own package, release pipeline entry and size budget, and nothing else waits on it. Its engine spike (risk R10) can run during 9b.

**Versions.** The changesets say "minor" and name no number, as every batch does. If nothing else releases between, 9a is 0.12.0, 9b 0.13.0, and 9c is core 0.14.0 with `@snapshot-ui/editor` 0.1.0. `@snapshot-ui/charts` takes a patch for its core peer with each, as every batch since 3a has done. Whether the editor joins the fixed group of core and react is open question 27.

**If a batch must shrink.** 9b is the largest. IconPicker and MediaInput are independent of the rest; either can move to the minor after 9b if its spike finds trouble, without changing anything in this spec.

## 3. Depends on

| From an earlier batch | Used here as |
| --- | --- |
| `DatePicker` (`date-picker/`): React Aria's `DatePicker` controlled with the app's ISO value or its own, the year hold (`wholeYear`, `YearWatch`, spec correction 68), `valueLabel` for the face, the `date-picker-control` frame at `min-inline-size: 12rem` and `padding-inline: 1.5rem 3rem`, the padded popover the month's width | DateTimePicker's whole field and popover (section 9); TimeField's frame (section 7) |
| `DateFrame`, `drawSegment`, `noSegment` (`calendar/DateFrame.tsx`) and `.date-segment` in `date-range-picker.css` | The frame and the segments of TimeField, TimeRangeField and DateTimePicker |
| `Calendar`'s parts (`CalendarHeader`, `CalendarDays`, `CalendarDatePresets`, `useCalendarDates`), `parseIso` and `toIso` (`calendar/iso.ts`) | DateTimePicker's calendar and its date half |
| The server face (design record, "The server face"): `useHydrated`, the `server-face` and `hydration` suites under `en-US`, `de-DE`, `fa-IR`, UTC and Asia/Tehran, and a mocked iPhone | Every part's face (section 5) |
| `NumberField`'s ASCII writing of a value with no grouping, and its money mode | Slider's face; MediaInput's file size words in the app's strings |
| `Select`'s `SelectPopover` (`picker/SelectList.tsx`): React Aria's `Autocomplete` with the library's `SearchField` as the filter row, the popover's rows on the holder formula, `isCoarsePointer` and the rule that the filter does not take focus on a coarse pointer | TimeField's list of times (section 7.4); PhoneField's country list (section 12); IconPicker's search and grid (section 13) |
| `Popover` (`popover/`): a holder declaring `--holder-radius`, `--holder-border`, `--holder-pad` and `--holder-corner-inset`; `isPadded`; React Aria's flip and cap | Every popup here |
| The field parts: `FieldHead`, `Description`, `FieldError`, `FieldChanged`, `FieldChangedMark`, `useChangedDescription`, `FieldCounter`, `data-unlabelled`; `.input` and `.input-button` with `--input-radius` in `input.css` | Every field's label row, hint, error line, Changed chip and unlabelled dot; the frames and their buttons |
| `TextField` and `TextArea` | PhoneField's input; MediaInput's alt text; the editor's source view and its fallback |
| `FileDropZone`'s `acceptFiles` and `FileAcceptance` (`file-drop-zone/accept.ts`), `useFileDrop`, `FileButton`, the missed-drop guard, the paste on the button, the coarse-pointer rule that draws no drag hint | MediaInput's ways in and its one check (section 14) |
| `UploadList`'s row (`upload-tray/UploadList.tsx`): `UploadItem`, `UploadStatus`, the status glyphs, the ProgressBar row, Retry and Cancel, `useUploadAnnouncements` | MediaInput's upload state (section 14.4) |
| `ProgressBar`'s track: 8px of `--color-frame` at the pill radius, the ink fill | Slider's track and fill (section 10) |
| `RadioGroup`'s dot and `SegmentedControl`'s chosen ink fill with the inset canvas ring | The slider's thumb focus; the editor's pressed toolbar buttons |
| `IconButton`, `Button` (tertiary, secondary), `Tooltip`, `Badge` (warning) | Toolbar buttons and their names; MediaInput's Replace and Remove; ColorField's contrast note |
| `Prose` (batch 6, `feat/insights`) | The editor's content typography |
| `Skeleton` | The editor's content before its engine loads |
| Card and the holder properties, `packages/react/src/stories/corner.ts`, `HOLDER_CORNER`, `CLEAR_OF_FOOT` and the concentric audit (`apps/storybook/tests/concentric`) | Every new story, in three shapes |
| `useControllableState`, `useWarnOnce`, `cx`, `present`, `mergeRefs`, `composeRenderProps`, `AccessibleName`, the status host pattern (`QUIET_MS`) | As everywhere |

React Aria 1.22.1 parts used for the first time: `TimeField` (9a); `Slider`, `SliderTrack`, `SliderThumb`, `SliderOutput`, `ColorField`, `ColorPicker`, `ColorArea`, `ColorSlider`, `ColorThumb`, `ColorSwatch`, `ColorSwatchPicker`, `parseColor`, `Virtualizer` with `GridLayout`, and `ListBox` with `layout="grid"` (9b); `Toolbar` and `ToggleButton` in a toolbar (9c). `SliderFill`, which 1.22.1 also exports, is considered for Slider's fill (section 10.4; to verify its markup). Every part is a client part; each draws its server face from the same tree.

## 4. What this phase answers

The parent spec's phase 3 rows, as input:

| Row | Source | React Aria basis | Notes in the parent spec | Here |
| --- | --- | --- | --- | --- |
| DatePicker, DateTimePicker, Calendar | `js/date-picker.js`, `styles/primitives/date-picker.css` | DatePicker, DateField, Calendar | Replaces the source's third-party calendar | DatePicker and Calendar shipped; DateTimePicker in 9a |
| TimeField | `js/time-input.js` | TimeField, Popover | Steps of 1, 5, 10, 15, 20 or 30 minutes. 12 or 24 hour. Typed boxes and sliders. | 9a; the sliders become a list (open question 3) |
| TimeRangeField | `js/hours-input.js` | two TimeFields | An empty range means closed. | 9a |
| PhoneField | `js/phone-input.js` | TextField | Pattern-based mask. Ships the North American pattern; others by prop. | 9b |
| ColorField | `js/color-input.js` | ColorField, ColorSwatch, ColorPicker | Swatch plus hex box. Contrast preview chip. | 9b |
| IconPicker | `js/icon-picker.js` | ComboBox, ListBox | The app passes in any icon set. Stale-value state for unknown names. | 9b, on Select's popover rather than ComboBox (section 13.1) |
| MediaInput | `js/media-input.js` | DropZone, FileTrigger | Image or file mode, fit or fill. An adapter prop plugs in an external file picker. | 9b, on FileDropZone's checks |
| Slider | new | Slider | | 9b, with RangeSlider |
| RichTextEditor | `js/richtext.js`, `js/code-highlight.js`, `styles/primitives/code.css` | none, Tiptap | Ships as `@snapshot-ui/editor`. | 9c |
| NumberField, SearchField, DateRangePicker, FileDropZone | | | | Shipped; not changed here |

The list the owner gave for this phase (DateTimePicker, TimeField, TimeRangeField, PhoneField, ColorField, IconPicker, MediaInput, Slider, RichTextEditor) matches the parent spec's rows not yet built exactly; RangeSlider is added as the second export of the Slider row (open question 12).

The source paths are relative to the source app, which `.local/SOURCE.md` locates. That file is gitignored and is not in the worktree this spec was written in, so this spec works from the parent spec's descriptions and the library's own records. Each plan reads the source files before the parts that port them and records every difference from this spec as a correction (risk R12). Slider is new and needs a recorded derivation in the design record before it is built (parent spec, section 3); every other part here is new to the library too and gets an Appendix B section first, as every batch has done.

The rules for every part, unchanged: `'use client'` as the first line of every file that imports `react-aria-components`, and only on interactive parts; no `Intl` formatting and no `window` at render, and no first-paint measurement; no external request and no injected script; light and dark, all three shapes, right to left (the Persian guide), comfortable and compact density; WCAG 2.2 AA including 2.5.8; weights 400, 450, 500 and 700 only; tokens only in `@layer components`, unprefixed kebab-case classes, states as data attributes that also match the native pseudo-class; everything exported from the package index, with the CSS in `core/styles.css`; no new tokens without a measured reason.

## 5. Approach

**React Aria where it has the part.** TimeField, DateTimePicker's field, Slider, RangeSlider and ColorField's field and picker are React Aria's components with the library's face, so their roles, keys, form values and resets are React Aria's, already used by thousands of apps. The library adds only what React Aria lacks: the minute step, the time list, the range of times, the closed state, the contrast chip, and the server faces.

**Compose the parts that exist.** PhoneField is a TextField with rules. IconPicker is Select's popover with a grid in it. MediaInput is FileDropZone's checks, UploadList's row and a TextField under one label. DateTimePicker is DatePicker with a TimeField in its popover.

**Strings in and out.** Every value is a plain string or number an app can store and a server action can read: a time is `"14:30"`, a date and time `"2026-10-20T14:30"`, a color `"#1f6feb"`, a phone number `"+14155550123"`, an icon its name, a media value the app's own id and URL, rich text its HTML. React Aria's objects (`Time`, `CalendarDateTime`, `Color`) never cross the API, as DatePicker's `CalendarDate` does not.

**The server face, as the date parts draw it.** On the server and through the hydration pass a part renders its element tree at its final size with every `Intl`-written text left out or replaced by the app's string or ASCII digits, and React Aria's text arrives in the first render after hydration (design record, "The server face").

| Part | In the server's HTML | After hydration |
| --- | --- | --- |
| TimeField | The label, the frame, the clock button, the app's `valueLabel` where the segments go, the hidden input with the ISO time | React Aria's segments, the step, the list |
| TimeRangeField | The group, both frames with their `valueLabel`s, "to", the closed word when empty, both hidden inputs | Segments, the overnight note, validation |
| DateTimePicker | DatePicker's face with a date and time `valueLabel`, the hidden input | Segments, the calendar and the time in the popover |
| Slider, RangeSlider | The label, the track, the fill and thumbs placed by arithmetic, the output as the app's `formatValue` or ASCII digits, the hidden inputs | React Aria's output and `aria-valuetext`, dragging, keys |
| ColorField | The label, the frame, the swatch in the value's color, the hex text, the contrast chip computed without `Intl` | The picker, color names for screen readers |
| PhoneField | The label, the input with the value as formatted by the pattern (pure string work), the hidden E.164 input | Formatting on blur, the country list |
| IconPicker | The label, the trigger with the chosen icon drawn by the app's set and its name, the hidden input | The popover, search, the grid |
| MediaInput | The label, the preview or the empty drop zone, Replace and Remove, the alt text field, the hidden input | Drops, paste, the picker, the adapter, uploads |
| RichTextEditor | The label, the frame, the toolbar at its size with every button disabled, the content area as Skeleton lines at its minimum height, the hidden input with the HTML | The engine loads, the content and the toolbar come alive |

**Forms submit the value, not the face.** Each part writes one hidden input per value under `name` (two for a range), holding the canonical string, so a plain `<form>`, a server action and React Hook Form's controller read the same thing, and a form submitted before hydration sends the value the server drew. A form's `reset` puts back the value of the first render, as React Aria's `useFormReset` does.

**Colors keep their meanings.** Clay is the Changed chip and the changed edge or dot only; signal orange appears nowhere; error is an invalid value or a failed upload only; success is a saved upload only, as UploadList already draws it; taupe is placeholders and disabled text only, never a hint or a stale value; a low contrast is a warning, which the palette defines as "a state that needs a look soon and is not a failure" (Appendix B, "Six colors added").

Rejected along the way:

- **One `DateTimeField` part with a `mode` prop for date, time and both.** React Aria keeps `DateField`, `TimeField` and `DatePicker` apart because their keys, popups and values differ; one part would carry three APIs.
- **The source's hour and minute sliders for TimeField.** Section 7.4 and open question 3.
- **ComboBox for IconPicker,** the parent spec's basis. A combobox filters a list of words; an icon grid is a listbox of glyphs, and the text box of a combobox would hold the icon's name, which is not what the reader chooses by. Select's popover with its filter row is already the library's searchable choice (section 13.1).
- **A phone number database in the library.** Section 6.2.
- **Lexical or Slate instead of Tiptap.** Section 6.3.
- **A size container for TimeRangeField.** A wrapping flex row stacks the two times without containment (section 16).

## 6. Dependency decisions

### 6.1 React Aria parts

| Part | React Aria 1.22.1 | What the library adds |
| --- | --- | --- |
| TimeField | `TimeField`, `DateInput`, `DateSegment`, `TimeFieldStateContext` | The minute step on the arrows and on commit, the time list in a popover, ISO strings, the face |
| TimeRangeField | none; two `TimeField`s in a `Group` | The range, closed, overnight, the end-after-start check, two hidden inputs |
| DateTimePicker | `DatePicker` with `granularity="minute"`, `Calendar`, a `TimeField` in the popover | ISO strings, the year hold (DatePicker's), the step, the time in the popover, the face |
| Slider, RangeSlider | `Slider`, `SliderTrack`, `SliderThumb`, `SliderOutput` (and `SliderFill`, to verify) | Marks, the face, the look |
| ColorField | `ColorField`, `ColorSwatch`, `ColorPicker`, `ColorArea`, `ColorSlider`, `ColorThumb`, `ColorSwatchPicker`, `parseColor` | The swatch button and popover, the contrast chip, hex strings in and out |
| PhoneField | `TextField`, `Input`; `Select`'s popover for a country list | The patterns, the adapter, E.164 |
| IconPicker | `Select`, `Autocomplete`, `ListBox` with `layout="grid"`, `Virtualizer`, `GridLayout` | The icon set interface, the stale value |
| MediaInput | `DropZone`, `FileTrigger` through FileDropZone's hooks | One value, the preview, the adapter, the upload row, alt text |
| RichTextEditor | `Toolbar`, `ToggleButton`, `Button`, `Popover`, `Dialog`, `TextField` | Everything inside the content, from Tiptap |

React Aria's `Virtualizer` module imports `client-only`, so IconPicker's grid lives in a file that is only ever imported by a client part, which `scripts/check-use-client.js` already enforces.

### 6.2 PhoneField: no phone number library in the box (open question 16)

The question is whether PhoneField depends on a phone number library to format and check numbers for every country.

| Option | Size | What it gives | Against |
| --- | --- | --- | --- |
| `libphonenumber-js` with its `min` metadata | About 80 kB minified and about 30 kB compressed for the core and metadata (the README's figures, to verify with size-limit) | Formatting as typed (`AsYouType`), parsing, validity by country, E.164 for about 240 regions | Thirty times the 2.5 kB budget of a field; metadata goes stale with every numbering plan change, so the library would release for data; MIT |
| `libphonenumber-js` with `max` or `mobile` metadata | About 145 kB and 95 kB minified (to verify) | Number types (mobile, fixed line) | Larger still |
| `google-libphonenumber` | About 550 kB minified (to verify) | Google's full library | Far too large; Apache 2.0 |
| **Patterns, the source's model, plus an adapter (recommended)** | Under 1 kB for the North American pattern and the code | A mask per country the app supports, E.164 when the pattern has a calling code; an app plugs any library in through `rules` | No validity beyond length and leading digits unless the app plugs one in |

**Decided as recommended:** PhoneField ships patterns and an adapter. `northAmericanPattern` is the one pattern in the box (the parent spec's row). A pattern is a plain object (section 12.2), so an app writes its own for the countries it serves, and `rules` takes a `PhoneRules` object of `format`, `parse` and `isValid` functions, which a recipe fills from `libphonenumber-js/min` for an app that needs every country. That app pays for the library knowingly, in its own bundle, and updates its metadata on its own schedule. The library never imports it, so `pnpm verify`'s size budgets stay honest.

### 6.3 RichTextEditor: Tiptap, in its own package (open questions 23 and 24)

The parent spec fixed Tiptap (section 7) to replace the source's CKEditor, whose GPL or commercial license would bind every user of an MIT library. The owner asked for the choice to be weighed again against Lexical and Slate.

| | Tiptap 3 on ProseMirror | Lexical | Slate |
| --- | --- | --- | --- |
| License | MIT (core, React bindings, starter kit, link, placeholder). Tiptap's Pro extensions and cloud services are commercial and never used | MIT | MIT |
| Size, compressed, for this toolbar (to verify with size-limit in the spike) | About 90 to 120 kB: ProseMirror's model, state, view, transform, keymap, history and lists, Tiptap's core and the extensions used | About 45 to 60 kB: the core (published as about 22 kB) with the React, rich text, list, link, history and HTML packages | About 40 to 55 kB: `slate`, `slate-react`, `slate-history`, `slate-dom`, and `immer` |
| Document model | A schema: invalid documents cannot exist, pasted HTML is parsed through it, and the output is the schema's tags only | Nodes with a JSON state; HTML in and out through `@lexical/html`, which needs a DOM | Plain JSON trees with no schema; normalization is the app's code |
| Accessibility | `contenteditable` with no roles of its own; the app adds `role="textbox"`, `aria-multiline` and a name through `editorProps.attributes`. Used under Atlassian's editor (to verify that it is still ProseMirror) and many others, with years of screen reader and input method fixes | `contenteditable` with ARIA props on `ContentEditable`; Meta's editor for its products, with good screen reader reports (to verify) | `contenteditable`; known trouble with Android input methods and some screen readers, and the project still calls itself beta (to verify the current wording) |
| Input methods and Android | ProseMirror's view has handled composition and Android's keyboards for years (to verify the current open issues) | Good, with Android work since 0.12 (to verify) | The weakest of the three on Android (to verify) |
| Server rendering | Nothing renders in Node; `immediatelyRender: false` avoids a hydration mismatch in Next; HTML from JSON on the server through `@tiptap/html` or the static renderer (to verify which needs a DOM) | `@lexical/headless` runs in Node; HTML export needs a DOM such as jsdom | Renders in Node through React, but its `Editable` is client-only in practice |
| The parent spec's features | Toolbar, link, lists, headings, history, placeholder, character count, and a source view through `getHTML()` and `setContent()` | All, through plugins | All, written by the app |
| Maturity | ProseMirror since 2015; Tiptap 3 stable since 2025 (to verify the date) | 0.x, its API still moving between minors (to verify) | 0.x for years |

**Recommended: keep Tiptap.** The schema is the deciding reason: an editor whose output an app stores and renders elsewhere must only ever produce the tags the app expects, and ProseMirror's schema guarantees it for typing, paste and the source view alike, where Lexical's HTML import and Slate's normalization leave it to code. Its handling of input methods is the most proven, which matters for the Persian guide. It costs about twice Lexical's bytes, which the separate package and the late load (section 15.9) keep off every page that does not edit rich text. Lexical is the alternative if the owner weighs size first (open question 23).

**A separate package: yes,** as the parent spec planned. `@snapshot-ui/editor` depends on `@snapshot-ui/react` and `@snapshot-ui/core` as peers and on Tiptap; `@snapshot-ui/react` never imports Tiptap, so its size budgets and its dependency list are unchanged. The editor's CSS lives in core, as every component's CSS does, in `rich-text-editor.css`, included in `styles.css` (about 3 kB) so the one-line setup still works (open question 25).

**The source view's highlighting.** The source app highlights the HTML of its source view with its own small highlighter (`js/code-highlight.js`, `styles/primitives/code.css`). It is ported, not replaced with highlight.js or Prism, both of which are far larger than the HTML tokens this needs (risk R12 holds the reading of the source first).

### 6.4 IconPicker: the icon source and virtualization (open questions 19 and 20)

**The app passes the set.** The parent spec's row says "the app passes in any icon set", and the bundle decides it too: `lucide-react` 1.55.0 ships 2,141 icon modules, and an `icons` object that imports them all costs the whole set in any bundle that imports it. So IconPicker takes an `IconSet` (section 13.2), and the library ships one helper, `createIconSet`, that turns a record of components into a set:

- **A curated set (the docs' first recipe).** `createIconSet({ wallet: Wallet, 'piggy-bank': PiggyBank, ... })` from named `lucide-react` imports: the app pays for the icons it offers, usually a few dozen, and they tree-shake.
- **All of Lucide (the second recipe).** `lucide-react/dynamic`'s `DynamicIcon` and `iconNames`: the set's `names` are `iconNames` and `render` draws a `DynamicIcon`, which imports each icon's module when it is first drawn. With the grid virtualized only the visible icons load, about 40 at a time. The import map itself is about 127 kB before minification (measured in 1.55.0's `dynamicIconImports.mjs`), so the docs say it suits an admin screen, not a public page.
- **Any other set.** The interface is names and a render function; the docs show a Heroicons set too.

The library does not export a Lucide set of its own, so it never chooses which icons an app offers and never ships the map in `@snapshot-ui/react` (open question 19).

**Virtualization.** The grid uses React Aria's `Virtualizer` with `GridLayout` around a `ListBox layout="grid"` when the set has more than 200 names (a prop overrides it), and draws every cell otherwise. React Aria's virtualized listbox keeps keyboard focus on an item that scrolls out of view, sets `aria-setsize` and `aria-posinset` so a screen reader hears "12 of 2,141", and scrolls the focused item into view (to verify each on 1.22.1's `GridLayout`). 200 is where a grid of 40px cells passes about 5,000 DOM nodes with their glyphs, at which a phone's first open is measurably slow (to verify with the spike's measurement; risk R8). Search narrows the list before it is drawn, so a search for "card" draws a few dozen cells either way.

### 6.5 MediaInput: FileDropZone's ways in, UploadList's row, one value (open question 21)

FileDropZone (batch 4) is the way files come in: a drop, a paste on its button, the picker, one check (`acceptFiles`) and `onFiles` with the accepted files and the refusals. UploadList shows files on their way up, with status, progress, Retry and Cancel. Neither holds a value: FileDropZone forgets a file once it hands it over, and UploadList's items are the app's.

MediaInput is the field that holds one: the image or file a setting points to, such as a logo, a cover picture or a terms PDF. So:

- **It reuses FileDropZone's hooks, not its box.** `useFileDrop` and `acceptFiles` give the drop, the paste, the picker and the check unchanged, so a refusal says the same words in both parts. While empty, MediaInput draws FileDropZone's box by its class, `file-drop-zone-box`, with one file and its own line ("Drag an image here or"). Once it holds a value, the box becomes the preview frame (section 14.6).
- **It reuses UploadList's row for the upload.** While the app uploads the chosen file, the frame shows one UploadList row (status, progress bar, Cancel, Retry on failure) from an `upload` prop of type `UploadItem`, drawn by the internal `BaseUploadList` with one item, so the glyphs, words and announcements are UploadList's.
- **The value is the app's, not a `File`.** The library never reads or sends a file (FileDropZone's rule). The app uploads what `onFiles` hands it, then sets `value` to its own `MediaValue`: an id, a URL, a name, and for an image its size.
- **The adapter is the app's picker.** `picker` takes a label and an async `open()` that resolves to a `MediaValue` or null, so a "Choose from library" button opens the app's own media library (the source's "external file picker"). The library draws the button and keeps focus right; the app draws its library, usually a Dialog.

## 7. TimeField (9a)

### 7.1 Anatomy

```
Reminder time
+-----------------------------------------+
|  09 : 15  AM                        (c) |     (c) the clock button, the shared field button
+-----------------------------------------+
Steps of 15 minutes.

Open:
+-----------------------+
|  9:00 AM              |
|  9:15 AM          v   |     v the chosen time's check
|  9:30 AM              |
|  ...                  |
+-----------------------+
```

### 7.2 API

```ts
/** The minute steps the source offers. */
export type MinuteStep = 1 | 5 | 10 | 15 | 20 | 30;

export interface TimeFieldLabels {
  /** The clock button's name; the field's label follows it. @default 'Choose time' */
  open: string;
  /** The error line for a typed time off the step. @default (step) => `Enter a time in steps of ${step} minutes` */
  offStep: (step: string) => string;
}

export interface TimeFieldBaseProps extends Omit<
  RACTimeFieldProps<Time>,
  | 'children' | 'className' | 'value' | 'defaultValue' | 'onChange' | 'validate'
  | 'minValue' | 'maxValue' | 'placeholderValue' | 'granularity' | 'hideTimeZone' | 'shouldForceLeadingZeros'
> {
  label?: ReactNode;
  description?: ReactNode;
  errorMessage?: ReactNode | ((validation: ValidationResult) => ReactNode);
  /** The light signal orange edge with the clay Changed chip, or the changed dot without a label. */
  isChanged?: boolean;
  /** @default 'Changed' */
  changedLabel?: string;
  /** The time as 'HH:mm' (or 'HH:mm:ss' with seconds), 24 hour, or null for none. */
  value?: string | null;
  defaultValue?: string | null;
  /** Called with the ISO time once every segment is typed, and null once every segment is cleared. */
  onChange?: (value: string | null) => void;
  /** Checks the time as `onChange` sends it, beside React Aria's checks and the step. */
  validate?: (value: string | null) => ValidationError | true | null | undefined;
  /** The earliest and latest times, as 'HH:mm'. */
  minValue?: string;
  maxValue?: string;
  /** The minute step: the arrows land on it, the list offers it, a typed time off it is invalid. @default 1 */
  step?: MinuteStep;
  /** Seconds are typed too. The step applies to minutes only. @default 'minute' */
  granularity?: 'minute' | 'second';
  /** The clock button and its list of times. @default true */
  hasTimeList?: boolean;
  /** The list's step. @default the step when it is 15, 20 or 30, else 30 */
  listStep?: MinuteStep;
  /** The time the list scrolls to and the segments' placeholder start from when there is no value. @default '09:00' */
  placeholderValue?: string;
  /** The time as the app writes it, shown on the server and until hydration: "9:15 AM". */
  valueLabel?: string;
  labels?: Partial<TimeFieldLabels>;
  placement?: Placement;
  popoverClassName?: string;
  className?: string | ((values: TimeFieldRenderProps & { defaultClassName: string | undefined }) => string);
  ref?: Ref<HTMLDivElement>;
}

export type TimeFieldProps = TimeFieldBaseProps & AccessibleName<'label'>;
```

`hourCycle` (12 or 24, the locale's by default), `name`, `form`, `isRequired`, `isDisabled`, `isReadOnly`, `isInvalid`, `validationBehavior` and `autoFocus` are React Aria's `TimeField` props. ISO strings in and out, as DatePicker's; a value that is not `HH:mm` or `HH:mm:ss` is read as none with one warning.

### 7.3 Markup and roles

- React Aria's `TimeField` as `div.field.time-field`, holding the `FieldHead`, then `div.input.time-field-control` (the frame: `DateFrame` cannot serve, since a time field is not a picker and has no group context, so the frame is a plain `div` holding React Aria's `DateInput`, which is itself the `group`), holding `DateInput.time-field-input` of `DateSegment.date-segment`s (each a `spinbutton` named "hour", "minute", "AM/PM" by React Aria in the locale's language), the clock button `Button.input-button.time-field-button` (named `labels.open` and the field's label, `aria-haspopup="listbox"`, `aria-expanded`), and, while unlabelled and changed, the `FieldChangedMark`; then the `Description`, the `FieldError`, and the hidden input.
- **The hidden input.** One `input[type="hidden"]` under `name` holding 'HH:mm', or empty. React Aria's own hidden input for a `Time` writes 'HH:mm:ss' (to verify in 1.22.1); if it does, React Aria is given no `name` and the library writes its own, with a `reset` listener on the form putting back the first render's value, as TagInput does.
- **The list.** `Popover.time-field-popover` around React Aria's `ListBox.time-field-list` (`role="listbox"`, named by the field's label), of `ListBoxItem`s, one per time from `minValue` (or 00:00) to `maxValue` (or the last step before 24:00), each named by its text as `Intl.DateTimeFormat` writes it in the locale and hour cycle, the chosen one `aria-selected` with Select's check. The popover only ever renders after hydration, so its `Intl` text never reaches the server's HTML.

### 7.4 Behavior

- **Typing** is React Aria's: each segment takes digits, moves on when full, and Backspace empties it; AM and PM take A and P. `onChange` fires once every segment holds a value, and with null once every segment is empty.
- **The step on the arrows** (decided here, item 3; risk R1). Arrow Up and Arrow Down on the minute segment move to the next or previous multiple of `step`, from the current minute (07 goes up to 15 and down to 00 with a step of 15), wrapping within the hour as React Aria's minute does. A capture-phase `keydown` handler on the minute segment, ahead of React Aria's, computes the minute and sets it through `TimeFieldStateContext`'s `setSegment('minute', n)` (to verify the name in 1.22.1), then calls `preventDefault()` and `stopPropagation()`. An empty minute takes the step's first multiple at or after the `placeholderValue`'s minute. The hour, seconds and AM/PM keep React Aria's keys. Page Up and Page Down keep React Aria's larger moves (to verify their size) and the result is then held to the step by the next arrow.
- **A typed minute off the step** (open question 2). It stays as typed; the field is invalid with `labels.offStep(String(step))` once the value is committed (React Aria's validation timing: on blur with `validationBehavior="native"` at submit), so nothing changes under the reader's hands. Arrows and the list always land on the step.
- **The list of times** (open question 3). The clock button, or Alt+Arrow Down in a segment (the picker's key, added by the library's handler on the group), opens the list. It scrolls the chosen time into view, or the first time at or after `placeholderValue`, and moves focus to it; Enter or a press sets the value and closes it, and focus goes back to the button, React Aria's popover rule. Typing a time's first characters moves to it (React Aria's typeahead). Escape closes without a change. The list is not filtered by the segments: typing in the field is already the fast path.
- **Bounds.** `minValue` and `maxValue` bound the list and are React Aria's validation for typed times (React Aria's own message, "Value must be 9:00 AM or later", in the locale).
- **Placeholder.** React Aria's segment placeholders ("hh", "mm" in the locale) in slate, as DatePicker's empty segments are (they are read, so they are slate, not taupe; spec correction 4 of the filters batch).
- **Disabled and read only.** React Aria's: disabled takes the segments and the button out of the tab order, taupe; read only keeps the segments focusable and unchanged and the button disabled.

### 7.5 Keys

| Key | Does |
| --- | --- |
| Tab, Shift+Tab | Into the first segment (React Aria makes the segments one stop each, in the locale's order), through the segments, to the clock button, out. |
| Digits | Type the focused segment; a full segment moves on. |
| A, P | Set AM or PM in the AM/PM segment. |
| Arrow Up, Arrow Down | On the minute, to the next or previous multiple of the step; on another segment, React Aria's step of one. |
| Arrow Left, Arrow Right | Between segments, in the drawn direction. |
| Backspace, Delete | Empty the focused segment. |
| Alt+Arrow Down | Opens the list. |
| In the list: Arrow Up, Arrow Down, Home, End, Page Up, Page Down, characters | React Aria's listbox: move, jump, typeahead. |
| In the list: Enter | Sets the time, closes the list, focus to the clock button. |
| In the list: Escape | Closes without a change, focus to the clock button. |

### 7.6 Screen readers

Each segment is a `spinbutton` with its name and value ("minute, 15"), the group named by the label and described by the hint and the error line, as DatePicker's. React Aria's live announcement of the whole time on a change (to verify that 1.22.1 announces on a segment change) reads "9:15 AM". The step is told in the hint the app writes ("Steps of 15 minutes"), and the docs' examples write it, since a screen reader user otherwise learns it only by pressing the arrows. The list reads "9:15 AM, selected, 38 of 96" (to verify the count in VoiceOver and NVDA).

### 7.7 Look and CSS

- **The frame** is DatePicker's: `.input` with `padding-inline: 1.5rem 3rem`, `min-inline-size: 9rem` (a "12:30 PM" in tabular figures and the button at the compact size, to measure in the plan), `cursor: text`, and the focus ring only while a segment has keyboard focus, never for the button, by `date-picker.css`'s `:has(.date-segment:focus-visible)` rule, which `time-field.css` extends to `.time-field-control` by adding it to that rule's selector list rather than copying it.
- **Segments** are `.date-segment`, shared: ink in tabular figures, empty slate, the focused one the ink fill with canvas text on `--radius-micro`, taupe while disabled.
- **The clock button** is the shared field button, Lucide `Clock`, 24px, slate, ink on hover where hover exists.
- **The list** is Select's list: rows of `--text-body` at 450 in ink, 44px on a coarse pointer, the chosen row's check, the popover the trigger's width or 10rem, whichever is wider, with `max-block-size: 18rem` and React Aria's cap to the room left.
- **Weights.** Segments 450, the list's rows 450, the label 700 (the field's): nothing new.

### 7.8 Forms, changed, validation and disabled

- **Form value** as section 7.3; reset to the first render's value.
- **Required** is React Aria's: an empty required field fails on submit; with `"native"` the browser focuses the first segment.
- **Changed** is the field contract: the Changed chip in the label row and the 1.5px light signal orange edge on the frame, or the changed dot in the frame without a label, a part step before the button, DatePicker's place.
- **Invalid** is the 1.5px error edge and the error line; invalid outranks changed.

### 7.9 Forced colors, right to left, density and pointer

- **Forced colors.** DatePicker's: the frame's edge `canvastext`, the focused segment `highlight` with `highlighttext` under `forced-color-adjust: none` (shared), disabled segments and the face `graytext`, the list's chosen row `highlight`.
- **Right to left.** React Aria orders the segments by the locale and isolates the time; in Persian the digits are Persian and the hour comes first. The button is at the inline end, the frame's padding logical. Arrow Left and Arrow Right follow the drawn order.
- **Compact density.** The frame is `--size-field`, 36px compact and 44px compact on a coarse pointer; the list's rows follow Select's (40px, 44px coarse).
- **Coarse pointer.** Segments are text-sized inside a 48px frame (44px compact): the frame is the target and a press on it focuses the nearest segment (React Aria's); the button's hit area is 40px, 44px coarse in compact.

### 7.10 Corners

The frame is a pill, `--input-radius`, the field's own corner; the clock button is the shared field button, concentric by `input.css`. The list's rows take the popover's formula through Select's list (15px, 3px, 0). In a holder's corner the field moves out (`corner.ts`), as every field does. No new row in the record's tables.

### 7.11 Server rendering

The face is DatePicker's: on the server and through hydration the `DateInput` renders no segments and `span.time-field-face` shows `valueLabel`, padded as a segment is, in a frame at its final size; the hidden input holds 'HH:mm' in both passes. The HTML is one string under `en-US`, `de-DE` and `fa-IR`, in UTC and Asia/Tehran. A time never depends on a zone, so the two zones are a guard, not a case.

### 7.12 How others do it

| System | Part | Entry | Step | Popup | What this spec takes |
| --- | --- | --- | --- | --- | --- |
| Material Design 3 | Time picker (Android and the guidelines; no Material Web part, to verify) | A dial, or an input mode of two boxes, switchable | None on the dial's minutes beyond 5-minute ticks (to verify) | The dial in a dialog | Typed boxes as the main entry; not the dial |
| Carbon | `TimePicker` | One text input "hh:mm" with an AM/PM `Select` and an optional time zone `Select` beside it (to verify) | None | None | Not the separate AM/PM select: React Aria's segment carries it |
| Atlassian | `@atlaskit/datetime-picker`'s `TimePicker` | A select of times; typed times with `timeIsEditable` (to verify the prop) | `timeInterval`, 30 minutes by default (to verify) | A list of times | The list of times at a step, as a second way in |
| Shopify Polaris | No time picker (to verify for the newest Polaris) | | | | |
| React Spectrum | `TimeField` | Segments | None; arrows by one (to verify) | None | The basis: segments, locale order, hour cycle |
| Apple | `DatePicker` with `.hourAndMinute`, `UIDatePicker.minuteInterval` | A wheel, or a compact field opening a wheel (to verify per platform) | `minuteInterval` from 1 to 30 (to verify) | The wheel | The step's values, 1 to 30, which match the source's |

## 8. TimeRangeField (9a)

### 8.1 Anatomy

```
Monday                                                   Changed
+--------------------+       +--------------------+
|  09:00         (c) |  to   |  17:00         (c) |
+--------------------+       +--------------------+

Sunday
+--------------------+       +--------------------+
|  --:--         (c) |  to   |  --:--         (c) |      Closed
+--------------------+       +--------------------+

Friday
+--------------------+       +--------------------+
|  22:00         (c) |  to   |  02:00         (c) |      Ends the next day
+--------------------+       +--------------------+
```

At a narrow width the end field wraps under the start, with "to" staying after the start.

### 8.2 API

```ts
export interface TimeRange {
  /** 'HH:mm', 24 hour. */
  start: string;
  /** 'HH:mm', 24 hour. Before `start` only with `allowsOvernight`. */
  end: string;
}

export interface TimeRangeFieldLabels {
  /** Between the two times, drawn, not read. @default 'to' */
  to: string;
  /** The start field's name, read after the group's: "Monday, Start". @default 'Start' */
  start: string;
  /** @default 'End' */
  end: string;
  /** Beside the fields while both are empty, and read with the group. @default 'Closed' */
  closed: string;
  /** Beside the fields while the end is before the start. @default 'Ends the next day' */
  overnight: string;
  /** One time without the other. @default 'Enter both times, or leave both empty for closed' */
  incomplete: string;
  /** The end before the start without `allowsOvernight`. @default 'The end must be after the start' */
  order: string;
  /** The same time twice. @default 'The end must differ from the start' */
  same: string;
}

export interface TimeRangeFieldBaseProps {
  label?: ReactNode;
  description?: ReactNode;
  errorMessage?: ReactNode | ((validation: ValidationResult) => ReactNode);
  isChanged?: boolean;
  /** @default 'Changed' */
  changedLabel?: string;
  /** The range, or null for closed. */
  value?: TimeRange | null;
  defaultValue?: TimeRange | null;
  /** Called with a whole range, or null once both times are empty. Never with half a range. */
  onChange?: (value: TimeRange | null) => void;
  validate?: (value: TimeRange | null) => ValidationError | true | null | undefined;
  /** An end before the start means the next day: "22:00 to 02:00". @default false */
  allowsOvernight?: boolean;
  /** Both empty is a value, closed. Off, an empty range is invalid when required. @default true */
  allowsClosed?: boolean;
  step?: MinuteStep;
  hourCycle?: 12 | 24;
  /** The hidden inputs' names. Closed submits both empty. */
  startName?: string;
  endName?: string;
  form?: string;
  isRequired?: boolean;
  isDisabled?: boolean;
  isReadOnly?: boolean;
  isInvalid?: boolean;
  /** The two times as the app writes them, for the server and until hydration. */
  startValueLabel?: string;
  endValueLabel?: string;
  labels?: Partial<TimeRangeFieldLabels>;
  className?: string;
  ref?: Ref<HTMLDivElement>;
}

export type TimeRangeFieldProps = TimeRangeFieldBaseProps & AccessibleName<'label'>;
```

`startName` and `endName` follow React Aria's `DateRangePicker` names, so the library's two range fields submit alike.

### 8.3 Markup and roles

- `div.field.time-range-field[role="group"]`, named by the label (a `span` in the `FieldHead`, since a group has no single control for a `label` to point at) and described by the hint, the closed or overnight note, and the error line. Inside: `div.time-range-field-row` holding two library `TimeField`s without their own heads, each named by `aria-labelledby` of the group's label and its own hidden word ("Monday, Start", "Monday, End"), with `span.time-range-field-to[aria-hidden="true"]` between them; then `span.time-range-field-note` while closed or overnight; the `Description`; the `FieldError`; and the two hidden inputs.
- Each inner TimeField keeps its clock button and list, so the range is set entirely from lists if the reader likes.

### 8.4 Behavior

- **Half a range is held, not sent.** While one time is set and the other empty, `onChange` is not called and the hidden inputs keep the last whole range (or closed); the group is invalid with `labels.incomplete` once focus leaves the group (not when focus moves from the start to the end), and on submit. So a reader typing the start never sees an error before reaching the end.
- **Closed.** Both empty is `null`, drawn with the `labels.closed` note in slate beside the fields and read with the group ("Sunday, group, Closed"). With `isRequired` and `allowsClosed` (the default), closed satisfies it: an opening-hours day may be closed. With `allowsClosed={false}`, an empty required range fails, React Aria's wording through the start field.
- **Overnight.** With `allowsOvernight`, an end before the start is valid and draws `labels.overnight` in slate; without it, the group is invalid with `labels.order`. An end equal to the start is invalid with `labels.same` either way: "open all day" is the app's own control (open question 5).
- **Focus.** Nothing in this part removes what holds focus; validation never moves focus. The browser's submit focuses the first invalid segment.
- **Emptying a day** (open question 6). Backspace through each segment, React Aria's way, as for any time. No clear button: the recipe pairs each day with a Switch "Open" through ConditionalFields when an app wants one action.

### 8.5 Keys and screen readers

Each TimeField's keys (section 7.5), in order: the start's segments, its clock button, the end's segments, its clock button. A reader hears "Monday, group" on entering, then "Start, hour, 9" (to verify how NVDA joins the group's and the field's names), and the note as part of the group's description. The error line is the group's `aria-describedby` and each field's too, so it is heard from either field.

### 8.6 Look and CSS

- **The row** is `display: flex; flex-wrap: wrap; align-items: center; gap: var(--spacing-part)`. Each frame is `flex: 1 1 9rem` up to `max-inline-size: 14rem`, so two times sit side by side down to about 20rem of column and wrap below that, with no container query (section 16). "to" is `--text-body` in slate, `flex: none`.
- **The note** is `--text-small` in slate, `flex-basis: auto`, wrapping to its own line when it does not fit.
- **Changed and invalid** draw on both frames, by the field contract on the group's root: `.field[data-changed] .input` and `.field[data-invalid] .input` already reach both, since both are `.input` inside the `.field`.
- **Forced colors.** Each frame's; the note is text.
- **Right to left.** The row runs from the right; "to" is the app's word ("تا" in the Persian story); the times are isolated by React Aria.
- **Density and pointer.** Each frame is `--size-field`; nothing else changes.
- **Corners.** Two pill frames, no holder; in a holder's corner the group moves out, as every field.

### 8.7 Server rendering

Both frames render their faces from `startValueLabel` and `endValueLabel`, the "to" word, the closed note when the server's value is null, and both hidden inputs. The overnight note is computed from the ISO strings without `Intl`, so it is in the server's HTML too.

### 8.8 How others do it

| System | Part | Closed | Overnight | What this spec takes |
| --- | --- | --- | --- | --- |
| Material, Carbon, Atlassian, Spectrum | No time range part (to verify each); apps place two time pickers | | | Two time fields under one group name |
| Shopify Polaris | No time part; store hours are app-built (to verify) | | | |
| Apple | Two `DatePicker`s in a `Form` row (to verify a system pattern in Settings' Downtime) | | Downtime runs past midnight and says "Next day" (to verify the words) | The overnight note in words |
| Google Business Profile | Hours per day with an "Open" or "Closed" toggle and "Open 24 hours" in the list (no public component; to verify) | A toggle per day | Allowed, shown as a time past midnight (to verify) | Closed as a state of its own; the toggle left to the app |

## 9. DateTimePicker (9a)

### 9.1 Anatomy

```
Publish at
+--------------------------------------------------+
|  20 / 10 / 2026, 14 : 30                    [cal] |
+--------------------------------------------------+

Open:
+------------------------------+
|  <   October 2026   >        |
|  Mo Tu We Th Fr Sa Su        |
|  ...  (20) ...               |
|                              |
|  Time                        |
|  +------------------------+  |
|  |  14 : 30           (c) |  |
|  +------------------------+  |
+------------------------------+
```

### 9.2 API

```ts
export interface DateTimePickerLabels extends CalendarLabels {
  /** The calendar button's name. @default 'Choose date and time' */
  open: string;
  /** The time field's label in the popover. @default 'Time' */
  time: string;
}

export interface DateTimePickerBaseProps extends Omit<DatePickerBaseProps, 'value' | 'defaultValue' | 'onChange' | 'validate' | 'minValue' | 'maxValue' | 'isDateUnavailable' | 'labels' | 'presets'> {
  /**
   * The date and time as 'YYYY-MM-DDTHH:mm' (or with ':ss'), a wall time with no zone; with `timeZone`, an instant
   * in UTC, 'YYYY-MM-DDTHH:mm:ssZ'. Null for none. Gregorian whatever the calendar shown.
   */
  value?: string | null;
  defaultValue?: string | null;
  /** Called once the date and the time are whole, with DatePicker's year hold. */
  onChange?: (value: string | null) => void;
  validate?: (value: string | null) => ValidationError | true | null | undefined;
  /** As date-times, or as dates for whole days. */
  minValue?: string;
  maxValue?: string;
  isDateUnavailable?: (date: string) => boolean;
  /**
   * An IANA zone, 'Asia/Tehran'. The field shows the wall time there with the zone's short name, and the value is
   * the instant in UTC. Without it the value is a wall time and the app owns its zone.
   */
  timeZone?: string;
  /** The time set when a day is chosen with no time yet. @default '00:00', React Aria's */
  defaultTime?: string;
  step?: MinuteStep;
  granularity?: 'minute' | 'second';
  hourCycle?: 12 | 24;
  /** Moments the app names, in a row above the calendar: "Tomorrow 9:00". Values as `value`. */
  presets?: readonly { label: string; value: string }[];
  labels?: Partial<DateTimePickerLabels>;
}

export type DateTimePickerProps = DateTimePickerBaseProps & AccessibleName<'label'>;
```

Everything else is DatePicker's props, unchanged: `today`, `valueLabel`, `placement`, `popoverClassName`, `isChanged`, the field states, `name`.

### 9.3 Markup, behavior and roles

- **It is DatePicker's tree** with `granularity="minute"` (or `"second"`), so the frame, the segments (now with hour, minute and AM/PM after the date's), the button, the face and the year hold are DatePicker's, shared by moving the body of `DatePicker.tsx` into an internal `PickerField` both render, rather than copied (decided here, item 8). The minute step of section 7.4 applies to the field's minute segment by the same handler.
- **The popover** holds React Aria's `Dialog` with the bare `Calendar.calendar`, the presets row when given, and then `div.date-time-picker-time` holding a library `TimeField` labelled `labels.time` and bound to the picker's time: React Aria's `DatePicker` provides its state through `DatePickerStateContext`, whose `timeValue` and `setTimeValue` the time field reads and writes (to verify both names in 1.22.1). Spectrum's date picker with a time granularity draws the same layout (to verify).
- **Choosing a day keeps the popover open** (`shouldCloseOnSelect={false}`), since the time is next; focus stays on the day, and Tab moves to the time field. Without a time yet, React Aria holds the day until a time is set (to verify in `useDatePickerState`); with `defaultTime`, choosing a day sets that time at once, so the value commits on the day's press. The popover closes on Escape, a press outside, or Tab past the time field's clock button, and focus goes back to the calendar button, React Aria's rule.
- **A preset** sets the date and the time and closes the popover, as DatePicker's presets do.
- **With `timeZone`.** React Aria's `ZonedDateTime` draws a time zone segment after the time, its short name from `Intl` (read only), so the reader sees which zone they are typing in; the value is converted to a UTC instant on commit through `@internationalized/date`'s `toZoned` and back, with the default disambiguation for a time that a clock change skips or repeats (to verify the default, 'compatible'). A time in a skipped hour moves forward by the gap (risk R3).
- **Bounds.** `minValue` and `maxValue` as date-times bound the calendar's days and validate the time; as dates they bound only the days.

### 9.4 Keys

DatePicker's keys, with the time segments after the date's in the field, and in the popover the calendar's grid keys (React Aria's), Tab to the presets, the calendar and then the time field, whose keys are section 7.5's.

| Key | Does |
| --- | --- |
| Tab, Shift+Tab | Through the date segments, the time segments, the calendar button. In the popover: the presets, the calendar's month buttons, the grid, the time field's segments and its clock button. |
| Alt+Arrow Down | In the field, opens the popover. |
| Arrow keys, Page Up, Page Down, Home, End | In the grid, React Aria's day moves. On the minute segment, the step. |
| Enter, Space | In the grid, chooses the day; the popover stays open. |
| Escape | Closes the time list if open, else the popover; focus to the calendar button. |

### 9.5 Screen readers

The field is one group named by the label with the date and time segments in order ("Publish at, group", then "day, 20", "month, 10", and so on). In the popover the calendar is React Aria's grid with its heading, and the time field is named "Time". React Aria's selected date announcement in the calendar reads the day; the time field's announcement reads the time (to verify both in VoiceOver and NVDA). With a zone, the zone segment reads its name.

### 9.6 Look and CSS

- **The frame** is DatePicker's, with `min-inline-size: 16rem` (a date, a comma, a 12 hour time and the button at the compact size; to measure), capped by `--container-field`.
- **The popover** is DatePicker's, the month's width; the time row sits under the calendar with `margin-block-start: var(--spacing-peer)`, its label `--text-small` at 700 (the field label's), the time field filling the popover's content width.
- **Corners.** The time field's frame is at the popover's foot, inside its curve (17px from its edges, under the 24px corner), so it is a frame in a holder's corner and takes the formula on `--input-radius`, as the filter row in a popup does, with the micro step as its floor (section 16): 7px in Rounded, 6px in Soft, 0 in Square. Its clock button follows `--input-radius` by `input.css`.
- **Forced colors, right to left, density, pointer.** DatePicker's and TimeField's.

### 9.7 Server rendering

DatePicker's face, with the app's `valueLabel` ("20 Oct 2026, 14:30"). With `timeZone`, the server never formats the zone: the face is the app's string. The hidden input holds the ISO value in both passes.

### 9.8 How others do it

| System | Part | Shape | Time | Zone | What this spec takes |
| --- | --- | --- | --- | --- | --- |
| Material Design 3 | Date picker and time picker, separate (to verify a combined pattern) | Two dialogs in sequence on Android (to verify) | Dial or input | No | Not two dialogs: one popover |
| Carbon | `DatePicker` beside `TimePicker`, separate fields (to verify) | Two fields | `TimePicker` | Zone select | One field is fewer stops; the zone shown, not chosen |
| Atlassian | `DateTimePicker` | A date picker and a time picker side by side in one frame | Times at an interval | `timeZone` handled as an offset in the value (to verify) | One frame for both |
| Shopify Polaris | No date-time part; `DatePicker` is a calendar only (to verify) | | | | |
| React Spectrum | `DatePicker` with `granularity` | One field; the popover has the calendar and a time field under it (to verify) | Segments | `ZonedDateTime` shows the zone | The basis and the popover layout |
| Apple | `DatePicker` with `[.date, .hourAndMinute]` | A compact row with a date button and a time button (to verify) | Wheel | The device's | One part for both |

## 10. Slider and RangeSlider (9b)

### 10.1 Anatomy

```
Volume                                                    40%
 ======================O-----------------------------------
 .          .          .          .          .
 Off       Low                              High

Price                                            $20 to $80
 ----------O===========================O-------------------
```

`=` is the ink fill, `-` the rail, `O` a thumb, `.` a mark with an optional word under it. The value sits at the label row's end.

### 10.2 API

```ts
export interface SliderMark {
  value: number;
  /** A word under the mark: "Off", "High". Drawn, and given to the thumb's value text when the thumb is on it. */
  label?: string;
}

interface SliderShared {
  label?: ReactNode;
  description?: ReactNode;
  /** Shown while `isInvalid`: a slider holds only values in its range, so this is the app's own check. */
  errorMessage?: ReactNode;
  isInvalid?: boolean;
  isChanged?: boolean;
  /** @default 'Changed' */
  changedLabel?: string;
  /** @default 0 */
  minValue?: number;
  /** @default 100 */
  maxValue?: number;
  /** @default 1 */
  step?: number;
  /** Marks along the track, with optional words under them. */
  marks?: readonly SliderMark[];
  /**
   * Writes a value for the output and for the thumb's value text, on the server and after: "40%", "$20".
   * Without it the server writes ASCII digits and React Aria writes `formatOptions` after hydration.
   */
  formatValue?: (value: number) => string;
  /** React Aria's number format for the output, after hydration only. */
  formatOptions?: Intl.NumberFormatOptions;
  /** The value at the label row's end. @default true */
  hasOutput?: boolean;
  isDisabled?: boolean;
  form?: string;
  className?: string;
  ref?: Ref<HTMLDivElement>;
}

export interface SliderBaseProps extends SliderShared {
  value?: number;
  defaultValue?: number;
  /** While dragging and on every key. */
  onChange?: (value: number) => void;
  /** Once the reader lets go, or after a key. */
  onChangeEnd?: (value: number) => void;
  name?: string;
}
export type SliderProps = SliderBaseProps & AccessibleName<'label'>;

export interface RangeSliderLabels {
  /** The low thumb's name, after the label: "Price, Minimum". @default 'Minimum' */
  start: string;
  /** @default 'Maximum' */
  end: string;
  /** Between the two values in the output. @default 'to' */
  to: string;
}
export interface RangeSliderBaseProps extends SliderShared {
  value?: readonly [number, number];
  defaultValue?: readonly [number, number];
  onChange?: (value: [number, number]) => void;
  onChangeEnd?: (value: [number, number]) => void;
  startName?: string;
  endName?: string;
  labels?: Partial<RangeSliderLabels>;
}
export type RangeSliderProps = RangeSliderBaseProps & AccessibleName<'label'>;
```

Two parts rather than one with a number-or-tuple value (open question 12): the types stay plain, and an app reading `onChange` never checks which it got.

### 10.3 Markup and roles

- React Aria's `Slider` as `div.field.slider` (`div.field.slider.range-slider` for two thumbs), holding `div.slider-head` (the `FieldHead`'s label and, at the row's end, `SliderOutput.slider-output`), then `SliderTrack.slider-track`, which is the hit area, holding `div.slider-rail`, `div.slider-fill`, `span.slider-mark`s, and one or two `SliderThumb.slider-thumb`s; then `div.slider-marks` with the marks' words; then the `Description` and the error line.
- **Each thumb** holds React Aria's visually hidden `input[type="range"]`, which carries the `slider` role, `aria-valuemin`, `aria-valuemax`, `aria-valuenow`, `aria-valuetext`, `aria-orientation="horizontal"`, the name (the label, and for a range the thumb's own word, "Price, Minimum"), and `name`. So the form submits each value natively, and React Aria resets it on the form's reset (to verify that 1.22.1's thumb input listens for reset; if not, the library's `reset` listener does it).
- **The value text.** `aria-valuetext` is `formatValue(value)` when given, else React Aria's formatted number; on a mark with a label, the label is added: "0, Off". A range thumb's value text is its own value only; the output reads both, "$20 to $80".
- **Marks** are `aria-hidden`: the value text carries a mark's word when the thumb is on it.

### 10.4 Behavior

- **Pointer.** React Aria's: a press on the track moves the nearest thumb there and starts a drag; a drag moves it; the value snaps to `step`. `onChange` fires on every move, `onChangeEnd` on release.
- **Range.** Two thumbs that cannot cross: React Aria clamps each to the other. A press on the track between them moves the nearer.
- **The fill** runs from the minimum to the thumb, or between the two thumbs. React Aria 1.22.1's `SliderFill` draws it from the state (to verify its markup and whether it renders on the server); the fallback is a `div` whose inset is computed from `getThumbPercent`, as the thumbs are.
- **Keys** (section 10.5). Page Up and Page Down move by a tenth of the range rounded to the step (React Aria's page size; to verify).
- **Changed.** The Changed chip in the label row; no edge, since a slider has no frame (RadioGroup's rule for a control whose edge is its own boundary). Without a visible label, the changed dot after the output, or at the head's end without one, `FieldChangedMark`, with its word.
- **Disabled.** React Aria's: the inputs disabled, the thumbs not focusable.
- **No vertical orientation** in this batch (open question 13).

### 10.5 Keys

Against the WAI-ARIA slider pattern and its multi-thumb variant:

| Key | Does |
| --- | --- |
| Tab, Shift+Tab | To each thumb in order (start, then end), then out. |
| Arrow Right, Arrow Up | Increase by `step`. In right to left, Arrow Right decreases (React Aria follows the drawn direction; to verify). |
| Arrow Left, Arrow Down | Decrease by `step`. |
| Page Up, Page Down | Increase or decrease by the page size. |
| Home, End | To the minimum or maximum (for a range thumb, as far as the other thumb allows). |

### 10.6 Screen readers

"Volume, slider, 40%" (to verify the order of name, role and value in VoiceOver and NVDA). A range reads "Price, Minimum, slider, $20" and "Price, Maximum, slider, $80". The output is not a live region: the thumb's value text is what a reader hears as it moves, and a second announcement would repeat it.

### 10.7 Look and CSS

- **The track** is the hit area: `block-size: max(var(--size-target), var(--size-control))`, 40px, 44px compact on a coarse pointer, with the rail centered in it. The rail is ProgressBar's: 8px of `--color-frame` at `--radius-pill`, square under Square. The fill is ink at the same radius, flush with the rail's ends and clipped by it (the "flush edges are clipped" rule).
- **The thumb** (Nested radii: dots keep their shape). 20px, `--radius-dot` in every shape, Raised fill with a 2px ink edge and `--shadow-lift`, centered on its value. The ink edge is 16.25:1 on canvas and 17.84:1 on lifted, so the thumb meets 1.4.11 everywhere; the fill is ink too. The rail's 12% ink is below 3:1, as ProgressBar's is, recorded on the same reasoning: the thumb and the fill carry the value, the rail only shows the range (recorded in the Slider section of Appendix B; open question 14 offers a firmer rail). Under a coarse pointer the thumb is 24px.
- **States.** Hover where hover exists: `cursor: grab` on the thumb, the thumb's shadow at `--shadow-float`. Dragging (`data-dragging`): `cursor: grabbing`. Focus: the standard 2px ink ring at 2px outside the thumb, a circle. Disabled: the fill and the thumb's edge ink at 15%, the thumb's fill `--color-disabled`, the output taupe (disabled text).
- **Marks.** 4px dots, `--radius-dot`, slate on the rail and canvas on the fill, centered on their values; the words `--text-small` at 450 in slate, centered under their marks, the first and last aligned to the track's ends so they never overflow it.
- **The output** is `--text-small` in slate with tabular figures, at the head row's end, as ProgressBar's value.
- **Width.** The slider fills its column up to `--container-field`; the thumbs are inset by half their size so their centers reach the ends.

### 10.8 Forced colors, right to left, density and pointer

- **Forced colors.** The rail takes a 1px `canvastext` border (its fill becomes the system background); the fill is `highlight` and the thumb `canvas` with a 2px `canvastext` edge, under `forced-color-adjust: none` on the track so the fill keeps its system color; a focused thumb's ring `highlight`; disabled `graytext`. Marks `canvastext`.
- **Right to left.** React Aria reverses a horizontal slider: the minimum at the right, the fill from the right. Positions use `inset-inline-start`, so the CSS needs no direction rule.
- **Compact density.** The track keeps its 40px hit area; the head row follows the field's compact rules.
- **Coarse pointer.** 44px track in compact, 24px thumb at every density.

### 10.9 Corners

No holder parts: the rail is a pill, the fill is flush and clipped, the thumb and the marks are dots. In a holder's corner the slider is a control and moves out (`corner.ts`). No new row in the record's tables.

### 10.10 Server rendering

React Aria's `Slider` renders in Node with the thumbs placed by arithmetic (percentages from the value, no measurement). The face: the output writes `formatValue(value)` or the value in ASCII digits with no grouping (NumberField's face) until the first render after hydration, and the thumb's `aria-valuetext` the same, passed through the thumb input's props, which React Aria's `mergeProps` lets win, as NumberField's face passes its input's `value` (risk R4: to verify that React Aria writes `aria-valuetext` on the server). The hidden range inputs hold the values in both passes. With `formatValue`, nothing changes at hydration.

### 10.11 How others do it

| System | Part | Range | Marks | Value shown | What this spec takes |
| --- | --- | --- | --- | --- | --- |
| Material Design 3 | Slider (continuous, discrete, range; to verify a centered variant) | Yes | Tick marks on discrete sliders | A value label over the thumb while dragging | Marks as dots on the track; not the floating label, which a finger covers |
| Carbon | `Slider` | Yes, two thumbs (to verify the version) | Min and max labels at the ends | A number input beside the track | Not the number box (open question 13) |
| Atlassian | `@atlaskit/range` | No (to verify) | None | The app's | Nothing more |
| Shopify Polaris | `RangeSlider` | Single or dual by the value's type | None | Output while dragging; prefix and suffix | Two thumbs; not the one part with two value types |
| React Spectrum | `Slider` and `RangeSlider` | `RangeSlider` | None (to verify) | The value at the label's end | The basis, two parts, the value at the label row's end |
| Apple | `Slider` with `minimumValueLabel` and `maximumValueLabel` | No in SwiftUI (to verify) | None | The app's | The labels at the ends as marks with words |

## 11. ColorField (9b)

### 11.1 Anatomy

```
Brand color                                               Changed
+---------------------------------------------------------+
| (#)  #1f6feb                                            |     (#) the swatch button, the value's color
+---------------------------------------------------------+
[Aa] 4.8:1 with white text. Passes AA.
Used for buttons and links.

Open:
+-----------------------------+
|  +-----------------------+  |
|  |   saturation and      |  |     the area: saturation across, brightness up
|  |   brightness     O    |  |
|  +-----------------------+  |
|  [=====hue=========O====]   |
|  ( ) ( ) ( ) ( ) ( ) ( )    |     the app's swatches
+-----------------------------+
```

### 11.2 API

```ts
export interface ContrastTarget {
  /** The color the chosen one is measured against, as hex. */
  color: string;
  /** What it is, in the chip's sentence: "white text", "the page". */
  name: string;
}

export interface ColorSwatchOption {
  color: string;
  /** Its name, read instead of React Aria's description of the color: "Brand blue". */
  name?: string;
}

export interface ColorFieldLabels {
  /** The swatch button's name, before the field's label. @default 'Choose color' */
  open: string;
  /** The hue strip. @default 'Hue' */
  hue: string;
  /** The opacity strip, with `hasAlpha`. @default 'Opacity' */
  alpha: string;
  /** The swatches' group. @default 'Swatches' */
  swatches: string;
  /** The chip's sentence. @default (ratio, target, level) => `${ratio}:1 with ${target}. ${LEVEL_WORDS[level]}.` */
  contrast: (ratio: string, target: string, level: 'aaa' | 'aa' | 'large' | 'below') => string;
  /** The warning badge below `minContrast`. @default 'Low contrast' */
  lowContrast: string;
}

export interface ColorFieldBaseProps {
  label?: ReactNode;
  description?: ReactNode;
  errorMessage?: ReactNode | ((validation: ValidationResult) => ReactNode);
  isChanged?: boolean;
  /** @default 'Changed' */
  changedLabel?: string;
  /** '#rrggbb', lowercase, or '#rrggbbaa' with `hasAlpha`; null for none. */
  value?: string | null;
  defaultValue?: string | null;
  /** Called with the hex on commit (Enter or blur in the box), and as the picker moves. */
  onChange?: (value: string | null) => void;
  validate?: (value: string | null) => ValidationError | true | null | undefined;
  /** An alpha channel, in the picker and the value. @default false */
  hasAlpha?: boolean;
  /** The swatch button and its picker. Off, a plain hex box with the swatch drawn, not pressable. @default true */
  hasPicker?: boolean;
  /** The app's palette, under the picker. */
  swatches?: readonly (string | ColorSwatchOption)[];
  /** The contrast chip under the field: one target, or several, one line each. */
  contrastWith?: ContrastTarget | readonly ContrastTarget[];
  /** Below this ratio the chip shows the warning badge. @default 4.5 */
  minContrast?: number;
  /** How a ratio is written, such as in Persian digits. @default one decimal, rounded down, ASCII */
  formatRatio?: (ratio: number) => string;
  name?: string;
  form?: string;
  isRequired?: boolean;
  isDisabled?: boolean;
  isReadOnly?: boolean;
  isInvalid?: boolean;
  labels?: Partial<ColorFieldLabels>;
  placement?: Placement;
  className?: string;
  ref?: Ref<HTMLDivElement>;
}
export type ColorFieldProps = ColorFieldBaseProps & AccessibleName<'label'>;

/** The WCAG 2 contrast ratio of two opaque sRGB hex colors. Pure, exported for a server check. */
export declare function contrastRatio(a: string, b: string): number;
```

### 11.3 Markup and roles

- React Aria's `ColorField` as `div.field.color-field`, holding the `FieldHead`, then `div.input.color-field-control` (the frame), holding at its inline start the swatch button, `Button.input-button.color-field-swatch-button` (named `labels.open` and the label, described by the swatch's color name, `aria-haspopup="dialog"`), which holds a `ColorSwatch.color-field-swatch` (`role="img"`, named by React Aria's color name in the locale, "dark vibrant blue", or the matching swatch's `name`); then React Aria's `Input.color-field-input` (`textbox`, `dir="ltr"`, `spellCheck={false}`, `autoComplete="off"`); then the changed dot when unlabelled. Then `div.color-field-contrast` (section 11.5), the `Description`, the `FieldError`, and React Aria's hidden input under `name`.
- **The picker** is `Popover.color-field-popover` (padded) around React Aria's `Dialog` (named by the field's label), holding React Aria's `ColorPicker` bound to the field's value, with `ColorArea.color-area` (two `slider`s in a `group`, saturation and brightness, each named by React Aria in the locale), `ColorSlider.color-slider` for hue (a `slider` named `labels.hue`), with `hasAlpha` a second for alpha, and with `swatches` a `ColorSwatchPicker.color-swatches` (a `listbox` named `labels.swatches` of `option`s, each holding a `ColorSwatch` named by its `name` or React Aria's color name).

### 11.4 Behavior

- **Typing.** React Aria's: the box takes `#1f6feb`, `1f6feb`, `#1f6` (expanded), commits on Enter or blur, and a text that is not a color returns to the last value on blur (to verify React Aria's exact rule) and marks nothing invalid. Arrow Up and Arrow Down step the hex value by one (React Aria's; to verify) which is rarely useful, and the docs say so.
- **Hex in and out.** The value is lowercase `#rrggbb` (or `#rrggbbaa`); an input in another notation is converted, and one that is not a color warns once and reads as none.
- **The picker.** The swatch button or Alt+Arrow Down in the box opens it; focus goes to the area's thumb. Moving any part sets the value at once, so the field, the swatch and the chip follow live. Choosing a swatch sets the value and keeps the picker open. Escape or a press outside closes it, and focus goes back to the swatch button. A hex box inside the picker is not drawn: the field's own box is one Tab away once the picker closes (open question 18 offers it).
- **The contrast chip** (section 11.5) computes from the value and each target with `contrastRatio`, pure arithmetic.
- **Changed, invalid, required, disabled** are the field contract's on the frame. Read only: the box read only, the swatch button disabled.

### 11.5 The contrast chip

- One line per target: `span.color-field-sample` (a 2rem by 1.5rem pill showing "Aa" at `--text-small` and 500 in the target's color on the value's color, `aria-hidden`), then the sentence, `labels.contrast(formatRatio(ratio), target.name, level)`: "4.8:1 with white text. Passes AA." The levels: 7 or more "Passes AAA", 4.5 or more "Passes AA", 3 or more "Passes AA for large text only", below 3 "Below AA".
- **Rounded down,** to one decimal: 4.49 is "4.4:1", never "4.5:1", so the words never claim a pass the ratio misses.
- **Below `minContrast`,** a `Badge` in the warning tone, `labels.lowContrast`, starts the line: warning is "a state that needs a look soon and is not a failure", which a low contrast is; it is not an error, since the value is valid, and never success, which means a saved change. The sentence is in slate and the ratio in ink with tabular figures.
- **With alpha,** the color is composited over the target first, since a translucent color's contrast depends on what is under it.
- **Read with the field.** The line is part of the field's description, after the hint, so a screen reader hears "Brand color, #1f6feb, 4.8:1 with white text. Passes AA." It is not a live region: it changes as the reader types, and reading it on every keystroke would drown the typing.
- **The sample's colors are the app's values,** set as inline style properties (`--color-field-value`, `--color-field-target`) the CSS reads; the token-only rule binds the library's CSS, not an app's values.

### 11.6 Keys

| Key | Does |
| --- | --- |
| Tab, Shift+Tab | The swatch button, then the box. In the picker: the area, the hue strip, the alpha strip, the swatches (one stop). |
| Characters | Type in the box. |
| Enter | In the box, commits. On the swatch button, opens the picker. |
| Alt+Arrow Down | In the box, opens the picker. |
| In the area: Arrow keys | Saturation (left and right) and brightness (up and down) by one step; Shift+Arrow and Page keys by a larger step (React Aria's; to verify). |
| In a strip: Arrow keys, Page Up, Page Down, Home, End | The slider pattern's moves. |
| In the swatches: Arrow keys | Between swatches (React Aria's grid listbox), choosing on Enter or Space. |
| Escape | Closes the picker; focus to the swatch button. |

### 11.7 Screen readers

The swatch button reads "Choose color, Brand color, button, dark vibrant blue" (to verify the description's place in each reader). The area reads as two sliders, "Saturation, 74%" and "Brightness, 92%", with React Aria's color name as their value text in the locale (to verify). Swatches read their names. The chip is read once with the field's description.

### 11.8 Look and CSS

- **The frame** is `.input` with `padding-inline: 3.5rem 1.5rem`, the swatch button at the start (the mirror of a field button at the end), the box's text in the body face with tabular figures, not `--font-mono`: hex digits in Sofia Sans with tabular figures line up, and the library keeps the mono face for code (decided here, item 18).
- **The swatch** is a 24px circle of the value's color, centered in the 36px field button, with a 1px `--color-boundary` ring so a color close to the field's fill still shows its edge (white on Raised would otherwise vanish). No value: the swatch is empty, a 1px dashed slate ring.
- **The picker.** The popover padded, `inline-size: 16rem`; the area `aspect-ratio: 1`, the full content width; the strips 24px tall, a pill, the hue gradient or the alpha checkerboard drawn by React Aria's style, with the thumbs 20px dots with a 2px Raised edge and an ink outer ring (`box-shadow`) so they read on any color; the swatches 32px drawn, 40px hit, in rows with `gap: var(--spacing-part)`, the chosen one with a 2px ink ring at 2px.
- **The chip.** `display: flex; flex-wrap: wrap; align-items: center; gap: var(--spacing-part)`, `margin-block-start: var(--spacing-part)`, `--text-small`.
- **Weights.** "Aa" at 500, the sentence at 450, the ratio at 500: no 600.

### 11.9 Forced colors, right to left, density and pointer

- **Forced colors.** The swatch, the sample, the area, the strips and the swatches keep their colors with `forced-color-adjust: none` (their color is the content) and take a 1px `canvastext` border; thumbs a `canvastext` ring; the chosen swatch `highlight`. The badge and words follow the system.
- **Right to left.** The swatch button sits at the inline start (the right); the hex box is `dir="ltr"` so "#1f6feb" reads in order; the hue strip runs from the right (React Aria's slider direction; to verify for `ColorSlider`); the area's axes are physical (saturation grows to the right), as every color tool draws it (to verify React Aria's behavior in right to left).
- **Compact density.** The frame 36px, the swatch 20px; the picker does not change.
- **Coarse pointer.** Swatches 40px drawn on a coarse pointer, the strips 32px tall, the thumbs 24px.

### 11.10 Corners

- **The swatch button** is a field button at the start: the shared rule in `input.css`, `--input-radius` less its 6px gap, a circle in Rounded, 6px in Soft, 0 in Square; the swatch inside it is a circle in Rounded and follows the button's corner less its gap otherwise (the record's "a part that is a circle in Rounded and a rounded square in Soft takes the formula").
- **The area** is a surface flush with the padded popover's top, inside its curve: the formula with the micro floor, 7px in Rounded, 6px in Soft, 0 in Square (section 16).
- **The strips** are pills: controls in the middle of the popover, clear of its curve.
- **The swatches** are controls: when they are the last row they sit in the popover's foot curve, so the popover's block-end padding becomes its corner inset, "a control moves down", 23px in Rounded (a new row in the record's table of controls that move).

### 11.11 Server rendering

React Aria's `ColorField` renders its hex text without `Intl`, so the box, the swatch (an inline `background` from the value) and the hidden input are final in the server's HTML. The swatch's color name, written by React Aria from the locale, is left out of the server's HTML and the hydration pass (the face): the swatch's name and the button's description arrive in the first render after (risk R4). The contrast chip is arithmetic and `formatRatio`, final on the server.

### 11.12 How others do it

| System | Part | Entry | Picker | Contrast | What this spec takes |
| --- | --- | --- | --- | --- | --- |
| Material Design 3 | No color picker part (to verify); Material Theme Builder is a tool | | | Tonal palettes guarantee contrast by tone | Nothing |
| Carbon | No color picker (to verify) | | | | |
| Atlassian | No public color picker in the current system (an older `@atlaskit/color-picker` is a palette menu; to verify its status) | | A palette of swatches | | A palette as swatches |
| Shopify Polaris | `ColorPicker` | None; the app adds a text field (to verify) | Saturation and brightness area, hue strip, optional alpha | None | The area and strips; the hex box in the field |
| React Spectrum | `ColorField`, `ColorPicker`, `ColorArea`, `ColorWheel`, `ColorSlider`, `ColorSwatchPicker` | Hex or channel field | A swatch button opening an editor of area and strips (to verify the default layout) | None | The basis: the field, the swatch, the editor's parts |
| Apple | `ColorPicker` (SwiftUI) and the system color panel | A well that opens the system picker | The system's grid, spectrum and sliders, with an eyedropper | None | A swatch that opens a picker; not an eyedropper |
| Figma, Adobe Color (no public components) | | Hex box beside a swatch | | Adobe Color has a contrast checker with AA and AAA words (to verify) | The ratio in words with the level |

## 12. PhoneField (9b)

### 12.1 Anatomy

```
Phone
+---------------------------------------------------------+
|  (415) 555-0123                                          |
+---------------------------------------------------------+
For example (415) 555-0123.

With several patterns:
+---------------------------------------------------------+
| [+44 v]  020 7946 0958                                   |
+---------------------------------------------------------+
```

### 12.2 API

```ts
export interface PhonePattern {
  /** ISO 3166 region code: 'US'. Several regions may share a pattern's calling code. */
  region: string;
  /** The calling code without '+': '1'. */
  callingCode: string;
  /** The region's name in the country list: 'United States and Canada'. */
  name: string;
  /** The national number's shape, one # per digit: '(###) ###-####'. */
  format: string;
  /** Whether a national number's digits are a number here: /^[2-9]\d{2}[2-9]\d{6}$/ */
  national: RegExp;
  /** A national prefix a reader may type, dropped before checking: '1' in North America, '0' in the UK. */
  trunkPrefix?: string;
  /** For the hint and the error line: '(415) 555-0123'. */
  example: string;
}

/** An app's own rules, such as libphonenumber-js's, replacing the patterns' checks and formatting. */
export interface PhoneRules {
  /** Reads typed text in a region: the E.164 number if it is one, else null. */
  parse: (text: string, region: string) => string | null;
  /** Writes an E.164 number for display in its own region's format. */
  format: (e164: string) => string;
  /** The region an E.164 number belongs to, to show in the country button. */
  regionOf?: (e164: string) => string | null;
}

/** The North American Numbering Plan: +1, '(###) ###-####'. The one pattern the library ships. */
export declare const northAmericanPattern: PhonePattern;

export interface PhoneFieldLabels {
  /** The country button's name. @default 'Country code' */
  country: string;
  /** The error line for text that is not a number. @default (example) => `Enter a phone number, like ${example}` */
  invalid: (example: string) => string;
}

export interface PhoneFieldBaseProps extends Omit<RACTextFieldProps, 'children' | 'className' | 'value' | 'defaultValue' | 'onChange' | 'validate' | 'type' | 'inputMode' | 'pattern' | 'minLength' | 'maxLength'> {
  label?: ReactNode;
  description?: ReactNode;
  errorMessage?: ReactNode | ((validation: ValidationResult) => ReactNode);
  isChanged?: boolean;
  /** @default 'Changed' */
  changedLabel?: string;
  /** The number in E.164, '+14155550123', or null. */
  value?: string | null;
  defaultValue?: string | null;
  /** Called with an E.164 number when the text is one, and null when it is empty or is not one. */
  onChange?: (value: string | null) => void;
  validate?: (value: string | null) => ValidationError | true | null | undefined;
  /** The patterns offered. With more than one, a country button at the field's start. @default [northAmericanPattern] */
  patterns?: readonly PhonePattern[];
  /** The region chosen at first when there is no value. @default the first pattern's */
  defaultRegion?: string;
  /** Numbers starting with '+' outside the patterns' codes are kept, as 8 to 15 digits. @default true */
  allowsInternational?: boolean;
  /** An app's own rules, replacing the patterns' checks. */
  rules?: PhoneRules;
  placeholder?: string;
  labels?: Partial<PhoneFieldLabels>;
  className?: string | ((values: TextFieldRenderProps & { defaultClassName: string | undefined }) => string);
  ref?: Ref<HTMLDivElement>;
  inputRef?: Ref<HTMLInputElement>;
}
export type PhoneFieldProps = PhoneFieldBaseProps & AccessibleName<'label'>;
```

`name`, `form`, `isRequired`, `isDisabled`, `isReadOnly`, `isInvalid`, `validationBehavior` and `autoFocus` are React Aria's `TextField` props; `name` goes on the library's hidden input, not on the visible one (section 12.4).

### 12.3 Markup and roles

React Aria's `TextField` as `div.field.phone-field`, the `FieldHead`, then `div.input.phone-field-control` holding, with several patterns, `Button.input-button.phone-field-country` (text "+44" and a chevron; named `labels.country`, described by the region's name, opening a `SelectPopover` listbox of the patterns, "United Kingdom, +44", with the filter past 8), then `Input.phone-field-input` (`type="tel"`, `inputMode="tel"`, `autoComplete="tel"`, `dir="ltr"`, `spellCheck={false}`), the changed dot; then the `Description`, the `FieldError` and `input[type="hidden"]` under `name` holding the E.164 number or empty. With one pattern there is no button: the frame is a plain text field.

No flags (decided here, item 21): a flag is an emoji pair of regional indicators, which this repo does not write and Windows draws as two letters, or an image the library does not ship; the calling code and the region's name carry the choice in words.

### 12.4 Behavior

- **Typing is free** (open question 15). The box takes what is typed, as typed: digits, spaces, dashes, brackets, a leading '+'. Nothing is inserted or blocked while typing, so the caret never jumps, an Android keyboard's composition is never cut, and a screen reader never hears the text change under the reader.
- **On blur, and at once on a paste or an autofill,** the text is read: with `rules`, `rules.parse(text, region)`; else every character that is not a digit or a leading '+' is dropped; a leading '+' and a calling code of one of the patterns switches to that pattern's region; the trunk prefix is dropped; the national digits are checked against `national`; a match is formatted by `format` into the box and becomes the value, '+' + calling code + national digits. A '+' number outside the patterns' codes, with `allowsInternational`, is kept as typed and its digits become the value if there are 8 to 15 (E.164's length; to verify the minimum in ITU-T E.164).
- **Text that is not a number** stays as typed, the field is invalid with `labels.invalid(pattern.example)`, the value is null, the hidden input is empty, and the input carries the custom validity so a native submit stops on it (TagInput's model: the value is always a number or none).
- **Choosing a region** reformats a valid number into the new region's format if its digits fit, and otherwise leaves the text and re-checks it; focus goes back to the input, since the reader chose a country to type a number.
- **A value from the app** is drawn in its region's format, found by calling code (or `rules.regionOf`), and the country button shows that region.
- **Read only and disabled** are TextField's; the country button is disabled with them.

### 12.5 Keys and screen readers

TextField's keys; with several patterns, Tab reaches the country button first, and its list is Select's (section 7.5's list rows). The box reads "Phone, edit text, For example (415) 555-0123" (the hint) and, when invalid, the error line. The country button reads "Country code, +44, button, United Kingdom". The reformat on blur is not announced: focus has left, and the new text is read when the reader returns.

### 12.6 Look and CSS

The frame is `.input`; with the country button, `padding-inline-start` makes room for it at its text's width (`min-inline-size: 4.5rem`, a pill button 36px tall with "+1" or "+880" and a 16px chevron, measured in the plan), not a fixed 36px circle, since it holds text. The box's text is `--text-body` with tabular figures. Nothing else is new.

### 12.7 Forced colors, right to left, density, pointer, corners

- **Forced colors.** TextField's; the country button's text `buttontext`.
- **Right to left.** The box is `dir="ltr"` so a number reads in order on a Persian page; the country button sits at the inline start, the right, and its "+98" is isolated (`unicode-bidi: isolate`).
- **Density and pointer.** The frame `--size-field`; the country button 36px in comfortable, 28px compact with a 40px hit area, 36px compact on a coarse pointer (the field button's rule).
- **Corners.** The country button is a field button holding text, a pill: its corner is `--input-radius` less its 6px gap, as every field button's, so it is a stadium in Rounded, 6px in Soft and 0 in Square. No new row.

### 12.8 Server rendering

The patterns' formatting is string work with no `Intl`, so the server's HTML holds the formatted number in the box, the country button's code, and the hidden E.164 input. With `rules`, the app's `format` runs on the server too; the docs say it must not use `Intl` there, or must give the same string in Node and the browser.

### 12.9 How others do it

| System | Part | Formatting | Country | What this spec takes |
| --- | --- | --- | --- | --- |
| Material Design 3 | No phone part; a text field with the phone keyboard (to verify) | None | None | |
| Carbon | No phone part (to verify) | | | |
| Atlassian | No phone part (to verify) | | | |
| Shopify Polaris | `TextField` with `type="tel"`; checkout's phone field formats per country (to verify; no public component) | Checkout: as typed (to verify) | Checkout: from the address's country | The region from context, not a flag |
| React Spectrum | No phone part; `TextField` with `type="tel"` | None | None | |
| Apple | `textContentType = .telephoneNumber`, the phone pad keyboard; Contacts formats as typed by region (to verify) | As typed, by region | The device's region | E.164 out, the region's format shown |
| GOV.UK Design System | Telephone numbers pattern: one text input, any format accepted, no masks (to verify the wording) | None | International numbers allowed with '+' | Free typing; formatting only when the reader leaves |

## 13. IconPicker (9b)

### 13.1 Basis

The parent spec names ComboBox and ListBox. A combobox's text box holds the chosen option's text, and an icon is chosen by its look, not its name; the library's `Select` already opens a popover with a search row over a list (`SelectPopover`, React Aria's `Autocomplete` with `SearchField`), which is exactly a searchable choice with a trigger that shows the value. So IconPicker is React Aria's `Select` with `SelectPopover` and a grid `ListBox` in it (open question 34).

### 13.2 API

```ts
export interface IconSet {
  /** Every icon's name, in the order the grid shows them. */
  names: readonly string[];
  /** Draws one icon. Called for the trigger and for each drawn cell. */
  render: (name: string, props: { 'aria-hidden': true; size: number; className?: string }) => ReactNode;
  /** The name a reader sees and hears. @default the kebab name in words: 'piggy-bank' is 'Piggy bank' */
  label?: (name: string) => string;
  /** Further words a search matches: { 'piggy-bank': ['savings', 'money'] }. */
  keywords?: Readonly<Record<string, readonly string[]>>;
}

/** A set from a record of components, such as named lucide-react imports. Pure; no 'use client'. */
export declare function createIconSet(
  icons: Readonly<Record<string, ComponentType<{ size?: number; className?: string; 'aria-hidden'?: boolean | 'true' }>>>,
  options?: Pick<IconSet, 'label' | 'keywords'>,
): IconSet;

export interface IconPickerLabels {
  /** The search row. @default 'Search icons' */
  search: string;
  /** The empty choice, with `allowsEmpty`. @default 'No icon' */
  none: string;
  /** While a search matches nothing. @default 'No icons match' */
  noResults: string;
  /** The count after a search settles. @default (count) => `${count} icons` */
  results: (count: string) => string;
  /** Under the trigger while the value is not in the set. @default (name) => `${name} is no longer available. Choose another icon.` */
  stale: (name: string) => string;
}

export interface IconPickerBaseProps {
  label?: ReactNode;
  description?: ReactNode;
  errorMessage?: ReactNode | ((validation: ValidationResult) => ReactNode);
  isChanged?: boolean;
  /** @default 'Changed' */
  changedLabel?: string;
  icons: IconSet;
  /** The icon's name, or null. A name the set does not hold is kept and shown as stale. */
  value?: string | null;
  defaultValue?: string | null;
  onChange?: (value: string | null) => void;
  /** Offers "No icon" first in the grid. @default false */
  allowsEmpty?: boolean;
  /** Draws only the visible cells. @default true above 200 names */
  isVirtualized?: boolean;
  /** The trigger's text with no value. @default 'Choose an icon' */
  placeholder?: string;
  /** How counts are written. @default String */
  formatCount?: (count: number) => string;
  name?: string;
  form?: string;
  isRequired?: boolean;
  isDisabled?: boolean;
  isInvalid?: boolean;
  labels?: Partial<IconPickerLabels>;
  placement?: Placement;
  className?: string;
  ref?: Ref<HTMLDivElement>;
}
export type IconPickerProps = IconPickerBaseProps & AccessibleName<'label'>;
```

### 13.3 Markup and roles

- React Aria's `Select` as `div.field.icon-picker`, the `FieldHead`, then the trigger `Button.input.icon-picker-trigger` (the frame, as Select's trigger: the 24px glyph, the icon's label, the chevron), the changed dot when unlabelled; the `Description` (with the stale sentence after the app's hint while stale); the `FieldError`; the library's hidden input under `name` holding the name, kept while stale (React Aria's hidden select would write one `option` per name, 2,141 for Lucide; to verify its cutoff to a plain input).
- **The popover** is `SelectPopover` with the search row always shown (not only past 8), then `ListBox.icon-picker-grid` with `layout="grid"` (named by the field's label, `role="listbox"`), its items `ListBoxItem.icon-picker-cell` each drawing the glyph `aria-hidden` and named by `label(name)` (`aria-label`), with `textValue` the label and the keywords so the search and the typeahead match them. Then `div.icon-picker-footer`, a line under the grid that shows the focused or hovered cell's label (`aria-hidden`: the cell's own name is what is read), so a sighted reader learns a glyph's name without a tooltip per cell. A polite `div.icon-picker-status[role="status"]` says the count after a search, once per `QUIET_MS`.
- **Virtualized,** the `ListBox` sits in React Aria's `Virtualizer` with a `GridLayout` of 40px cells (`minItemSize` and `maxItemSize` 40px, `minSpace` 4px; to verify the option names).

### 13.4 Behavior

- **Opening.** The trigger, Enter, Space or Arrow Down opens the popover; focus goes to the search row on a fine pointer and to the chosen cell (else the first) on a coarse one, Select's rule (so a phone's keyboard does not cover the grid).
- **Searching** filters by the label and the keywords, case- and accent-insensitive with React Aria's collator, as Select's filter. The grid is replaced in place; the status says the count; with nothing left, `labels.noResults` in the grid's place.
- **From the search to the grid** (decided here, item 25). React Aria's `Autocomplete` keeps focus in the search row and moves a virtual focus through the list with Arrow Up and Arrow Down. In a grid, Left and Right belong to the text's caret there, so the grid could not be walked in two directions. So the autocomplete's virtual focus is off (`disableVirtualFocus`, to verify the prop in 1.22.1): Arrow Down or Tab from the search moves real focus into the grid, where all four arrows move, and typing a character in the grid sends it to the search row with focus.
- **Choosing.** Enter, Space or a press chooses a cell, closes the popover, and gives focus back to the trigger, React Aria's rule.
- **Stale.** A value the set does not hold is kept: the trigger draws `span.icon-picker-missing` (a 24px dashed square) and `label(value)`, the field carries `data-stale`, and the description adds `labels.stale(label(value))` in slate. Nothing is chosen in the grid. The hidden input keeps the name, so a form saved without touching the field keeps it, and the app decides what a stale icon draws elsewhere. It is not invalid: the reader did nothing wrong (open question 35).
- **Empty.** With `allowsEmpty`, "No icon" is the first cell (a 24px slashed circle glyph from Lucide, `CircleOff`), choosing null.

### 13.5 Keys

| Key | Does |
| --- | --- |
| Tab, Shift+Tab | To the trigger; in the popover, between the search row and the grid. |
| Enter, Space, Arrow Down, Alt+Arrow Down | On the trigger, opens. |
| Characters | In the search, filter. In the grid, move focus to the search and type there. |
| Arrow Down | In the search, into the grid at its first cell (or the chosen one). |
| Arrow keys | In the grid, by row and column, in the drawn direction (React Aria's grid layout); Up from the first row returns to the search. |
| Home, End | In the grid, to the first or last cell (React Aria's; to verify whether a grid layout moves within the row). |
| Page Up, Page Down | In the grid, by a screenful (React Aria's virtualized listbox). |
| Enter, Space | In the grid, chooses and closes. |
| Escape | Clears the search if it holds text, else closes; focus to the trigger. |

### 13.6 Screen readers

The trigger reads "Category icon, Piggy bank, button" (Select's: the label and the value). In the grid, "Piggy bank, 3 of 24, selected" with the set size from React Aria even when virtualized (to verify in VoiceOver and NVDA, risk R8). After a search the status says "24 icons". While stale, the trigger reads its name and the description says the icon is no longer available.

### 13.7 Look and CSS

- **The trigger** is Select's frame: `.input`, the glyph 24px in ink at the start, the label in ink at 450 (taupe for the placeholder, slate while stale), the chevron in slate.
- **The popover** is `inline-size: min(22rem, 100vw - 2rem)`; the grid `max-block-size: 18rem`, scrolling inside.
- **A cell** is 40px square, the glyph 24px in ink. Hover where hover exists: the 5% ink wash. Chosen: the ink fill with the glyph in canvas, the SegmentedControl's chosen look. Keyboard focus: an inset 2px ink ring 2px inside the cell, and on the chosen cell the inset canvas ring, PositionPad's recorded deviation, since a ring outside would cover the neighbor 4px away (decided here, item 26).
- **The footer** is `--text-small` in slate, one line, ellipsized, `min-block-size` one line so the popover does not jump.

### 13.8 Forced colors, right to left, density and pointer

- **Forced colors.** Glyphs `canvastext`; the chosen cell `highlight` with a `highlighttext` glyph under `forced-color-adjust: none`; the focus ring `highlight`; the missing glyph's dashes `canvastext`.
- **Right to left.** The grid runs from the right; the arrows follow the drawn direction. Icons are not mirrored: Lucide does not mark which glyphs have a direction, and the app's set decides (the docs say to mirror arrows in the app's `render` with a class that flips them under `dir="rtl"`).
- **Compact density.** The trigger 36px; the cells stay 40px, since they are the targets.
- **Coarse pointer.** Cells 44px, the grid's columns fewer.

### 13.9 Corners

The cells fill the popover's grid and their corners at the grid's edges lie within the popover's curve, so every cell takes the popover's formula, as rows do, wherever it falls: 15px in Rounded (a rounded square on 40px), 3px in Soft, 0 in Square. The search row takes the filter row's formula already. The trigger is a field. A new row in the record's table: "Popover, an icon cell, 15px, 3px, 0".

### 13.10 Server rendering

The trigger, its glyph (the app's `render` on the server), its label, the stale sentence and the hidden input are in the server's HTML; nothing is formatted with `Intl`. The popover mounts only when opened.

### 13.11 How others do it

| System | Part | Shape | Search | Large sets | What this spec takes |
| --- | --- | --- | --- | --- | --- |
| Material, Carbon, Atlassian, Polaris, Spectrum | No icon picker part (to verify each) | | | | |
| Apple | SF Symbols app; Shortcuts' and Reminders' icon choosers (no public component; to verify) | A grid of glyphs in a popover or sheet | Search in the SF Symbols app | Categories | A grid in a popover; the name under the grid |
| Notion and Linear (no public components) | Page and project icon pickers (to verify) | A searchable grid of icons in a popover, with recent icons | Yes | Virtualized (to verify) | The search row over a grid; recent icons left out |
| WordPress | Block editor icon controls (to verify) | | | | |

## 14. MediaInput (9b)

### 14.1 Anatomy

```
Logo                                                        Changed
+-------------------------------------------------------------+
|  +--------+   acme-logo.svg                                  |
|  | image  |   SVG, 12 KB, 512 by 512                          |
|  |        |   [Replace]  [Choose from library]  [Remove]      |
|  +--------+                                                   |
+-------------------------------------------------------------+
Display   ( Fit | Fill )
Alt text
+-------------------------------------------------------------+
|  Acme, the company's logo                                    |
+-------------------------------------------------------------+

Empty:
+- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -+
|            Drag an image here or [Choose an image]           |
|                    [Choose from library]                      |
+- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -+
PNG, JPG or SVG, up to 2 MB.

Uploading:
+-------------------------------------------------------------+
|  (^) acme-logo.svg              Uploading  45%   [Cancel]    |
|      [=========              ]                               |
+-------------------------------------------------------------+
```

### 14.2 API

```ts
/** The app's record of a stored file. The library never reads or sends a file. */
export interface MediaValue {
  /** The app's id, submitted under `name`. */
  id: string;
  /** Where the preview loads it from. */
  url: string;
  /** The file's name as the reader knows it. */
  name: string;
  /** A short line under the name, in the app's words: "SVG, 12 KB, 512 by 512". */
  detail?: string;
  /** The image's alt text, edited in the field in image mode. */
  alt?: string;
}

/** The app's own media library, opened by a button the field draws. */
export interface MediaPicker {
  /** The button's words: "Choose from library". */
  label: string;
  /** Opens the app's library; resolves with the chosen media, or null when the reader cancels. */
  open: () => Promise<MediaValue | null>;
}

export interface MediaInputLabels extends Pick<FileDropZoneLabels, 'drop' | 'rejected'> {
  /** @default 'Drag an image here or' ('Drag a file here or' in file mode) */
  dragHint: string;
  /** @default 'Choose an image' ('Choose a file') */
  choose: string;
  /** @default 'Replace' */
  replace: string;
  /** @default 'Remove' */
  remove: string;
  /** The alt text field. @default 'Alt text' */
  alt: string;
  /** @default 'Describe the image for people who cannot see it. Leave it empty if the image is decoration.' */
  altHint: string;
  /** The fit choice's label and options. @default 'Display', 'Fit', 'Fill' */
  display: string;
  fit: string;
  fill: string;
  /** Said after a removal. @default (name) => `${name} removed` */
  removed: (name: string) => string;
}

export type MediaInputBaseProps = Omit<FileAcceptance, 'allowsMultiple' | 'maxFiles' | 'onFiles'> & {
  label?: ReactNode;
  description?: ReactNode;
  errorMessage?: ReactNode;
  isInvalid?: boolean;
  isChanged?: boolean;
  /** @default 'Changed' */
  changedLabel?: string;
  /** An image with a preview, alt text and fit, or any file with its name. @default 'image' */
  mode?: 'image' | 'file';
  value?: MediaValue | null;
  defaultValue?: MediaValue | null;
  /** A removal, a picked library item, or a change to the alt text. */
  onChange?: (value: MediaValue | null) => void;
  /** A file chosen, dropped or pasted, after the one check. The app uploads it and then sets `value`. */
  onFiles?: (accepted: File[], rejected: FileRejection[]) => void;
  /** The upload in progress, drawn as UploadList's row in the frame. */
  upload?: UploadItem | null;
  onCancelUpload?: () => void;
  onRetryUpload?: () => void;
  /** The app's media library. */
  picker?: MediaPicker;
  /** How the image fills its box where the app shows it, chosen in the field. Image mode only. */
  fit?: 'contain' | 'cover';
  defaultFit?: 'contain' | 'cover';
  onFitChange?: (fit: 'contain' | 'cover') => void;
  /** Shows the Fit and Fill choice. @default false */
  hasFitChoice?: boolean;
  /** Shows the alt text field. @default true in image mode */
  hasAltText?: boolean;
  /** Draws the preview, such as the app's own image component. @default an <img alt=""> of `url` */
  renderPreview?: (value: MediaValue) => ReactNode;
  /** The value's id. */
  name?: string;
  /** The alt text's and the fit's names, for a plain form. */
  altName?: string;
  fitName?: string;
  form?: string;
  isRequired?: boolean;
  isDisabled?: boolean;
  capture?: 'user' | 'environment';
  formatCount?: (count: number) => string;
  labels?: Partial<MediaInputLabels>;
  className?: string;
  ref?: Ref<HTMLDivElement>;
};
export type MediaInputProps = MediaInputBaseProps & AccessibleName<'label'>;
```

### 14.3 Markup and roles

- `div.field.media-input[data-mode][data-state]` (`empty`, `uploading`, `filled`), a `group` named by the label and described by the hint and the error line. Then `div.media-input-frame`, the size container, holding one of three faces:
  - **Empty:** FileDropZone's box by its classes (`file-drop-zone-box`, its icon, its hint and its `FileButton`), with `labels.dragHint` and `labels.choose`, and the picker's secondary `Button` after the file button when `picker` is given. A press anywhere on the box opens the file picker, FileDropZone's rule.
  - **Uploading:** one UploadList row from `upload`, through the internal `BaseUploadList`, so the status glyph, the words, the progress bar, Cancel and Retry are UploadList's.
  - **Filled:** `div.media-input-preview` (`renderPreview(value)`, or `<img alt="" src={url}>` with `object-fit` from the fit; in file mode Lucide's `FileText` glyph), `div.media-input-text` (`span.media-input-name`, the file's name, and `span.media-input-detail`), and `div.media-input-actions`: Replace (a `FileButton`), the picker's button, and Remove (a tertiary `Button`, named "Remove, acme-logo.svg").
- Then, in image mode with a value, the fit choice (a `SegmentedControl` labelled `labels.display`) when `hasFitChoice`, and the alt text `TextField` when `hasAltText`; then the `Description`, the error line (FileDropZone's refusal line or the app's), the hidden inputs (`name` with the id, `altName`, `fitName`), and the polite status host.
- **The preview is decoration** (`alt=""`): the file's name is the text beside it, and the alt text the reader writes describes the image for the app's own page, not for this field.

### 14.4 Behavior

- **Ways in.** FileDropZone's: a drop on the frame in any face, a paste on the choose or Replace button, the picker; `acceptFiles` with one file and `maxFiles` 1, so a drop of two refuses the second as "count", with FileDropZone's words. `onFiles` gets the accepted file; the app uploads it, passes `upload` while it goes, and sets `value` when it has a record. The library holds no file, as FileDropZone holds none.
- **Replace keeps the value until the app replaces it.** A file chosen through Replace goes to `onFiles`; the frame shows the upload row while `upload` is given and goes back to the old preview if the upload is cancelled or the app sets no new value. A failed upload shows UploadList's failed row with its reason and Retry, over the old value, which is kept.
- **Remove** sets null. After the commit, in a frame (the settings batch's rule), focus goes to the empty face's choose button, and the status says `labels.removed(name)`. Focus never falls to the body.
- **The library picker.** Its button calls `open()`; the app's library takes focus (its own Dialog, usually). When the promise settles, focus goes to the picker's button if it is still in the document and focus is on the body or outside every dialog, else stays where the app put it; a value resolved is passed to `onChange`.
- **Alt text** edits `value.alt` through `onChange`. Empty alt is a valid choice for a decorative image, and the hint says so; the field never requires it (open question 32).
- **Fit or fill** (the source's "fit or fill"; open question 33). With `hasFitChoice`, a SegmentedControl sets `fit`, which the preview draws and `fitName` submits; the app applies it where it shows the image.
- **Required** is a value: an empty required field fails on submit through a custom validity on the choose button, and the frame draws the error edge.
- **Changed** is the field contract: the chip, and the 1.5px light signal orange edge on the frame in the filled face.
- **Disabled** disables every button and the drop.

### 14.5 Keys and screen readers

| Key | Does |
| --- | --- |
| Tab, Shift+Tab | Empty: the choose button, the picker's button. Filled: Replace, the picker's button, Remove, then the fit choice and the alt text. Uploading: Cancel, or Retry. |
| Enter, Space | Press the focused button. |
| Ctrl+V, Cmd+V | On the choose or Replace button, pastes a copied file (FileDropZone's). |
| Arrow keys | In the fit choice, SegmentedControl's. |

The group reads "Logo, group", then each button by its name: "Replace, acme-logo.svg", "Remove, acme-logo.svg". The upload row's announcements are UploadList's (polite, not chatty). A removal is said once by the status host.

### 14.6 Look and CSS

- **The frame.** Empty, FileDropZone's box unchanged. Filled and uploading, `--radius-surface`, a 1px `--color-boundary` edge (a field frame's), Raised fill, `padding: var(--spacing-inset)`; a holder (section 16).
- **Layout, by the frame's own width** (`container: media-input / inline-size`, `contain-intrinsic-inline-size: 0`). From 28rem: a grid of `6rem 1fr`, the preview a 6rem square (`aspect-ratio: 1`, `object-fit` from the fit) beside the text and the actions under it. Under 28rem: one column, the preview the full width at `aspect-ratio: 16 / 9`, then the text, then the actions wrapping.
- **Text.** The name `--text-body` at 500 in ink, `overflow-wrap: anywhere`; the detail `--text-small` in slate.
- **Actions.** Secondary buttons for Replace and the picker, tertiary for Remove, in a wrapping row with `gap: var(--spacing-part)`.
- **The drag state** over a filled frame: FileDropZone's solid ink edge over the 5% ink wash, with `labels.drop` over the preview.
- **Invalid:** the 1.5px error edge on the frame (dashed in the empty face, FileDropZone's). A failed upload is the row's error look, UploadList's, and the frame does not turn red: the field is not invalid, the upload failed.

### 14.7 Forced colors, right to left, density and pointer

- **Forced colors.** The frame's edge `canvastext`; the preview keeps its colors (`forced-color-adjust: none` on the image only); the rest is the parts' own.
- **Right to left.** The preview at the right, logical properties throughout; a file name keeps its own direction (`unicode-bidi: plaintext`).
- **Compact density.** The buttons follow `--size-control`; the frame pads `--spacing-inset` in both.
- **Coarse pointer.** No drag hint, FileDropZone's rule; the buttons stay.

### 14.8 Corners

The frame is a holder: `--holder-radius: var(--radius-surface)`, `--holder-border: 1px`, `--holder-pad: var(--spacing-inset)`. The preview lies within its curve (17px from the frame's edges, under its 24px corner), so it takes the formula with the micro floor: 7px in Rounded, 6px in Soft, 0 in Square; the narrow face's full-width preview the same. The actions are controls: wide, they start 6rem and 16px past the preview, clear of the curve; narrow, they sit at the frame's foot and start, inside its curve, so the frame's block-end padding becomes its corner inset (23px in Rounded), "a control moves down". Two new rows in the record's tables. Empty, FileDropZone's box keeps its own rule.

### 14.9 Server rendering

The face from the value: the preview (the app's `renderPreview` or an `img`), the name, the detail, the buttons, the fit and alt fields, the hidden inputs, and the empty status host; or FileDropZone's empty box with both hint strings, the media query picking. A form submitted before hydration sends the id, the alt and the fit. The drop and paste arrive with hydration.

### 14.10 How others do it

| System | Part | One value | Preview | External library | What this spec takes |
| --- | --- | --- | --- | --- | --- |
| Material Design 3 | No file or media input (to verify) | | | | |
| Carbon | `FileUploader` and its drop container | A list of files | Names, no image preview (to verify) | No | Not the list; one value |
| Atlassian | Media picker (`@atlaskit/media-picker`; to verify its status) | Varies | Cards | Its own media service | The adapter as the app's own service |
| Shopify Polaris | `DropZone` with a file list or thumbnail, and the admin's "Select existing" image picker (to verify) | `allowMultiple` false gives one | Thumbnail in the zone | The admin's file library (no public component) | The preview in the zone; a button for the app's library |
| React Spectrum | `DropZone` with `FileTrigger` | The app's | The app's | No | The ways in, through FileDropZone |
| Apple | `PhotosPicker` and the document picker (to verify their names in SwiftUI) | Single or several | The system's | The system's library | The library opened by the platform, returning one item |
| WordPress | Featured image panel (no public component; to verify) | One | Preview with Replace and Remove | The media library | The preview with Replace and Remove, the library button |

## 15. RichTextEditor (9c, `@snapshot-ui/editor`)

### 15.1 Anatomy

```
Welcome message                                              128/2000
+-------------------------------------------------------------+
|  [Paragraph v] | B  I | link | list  1.list  quote | undo redo | </>  |
|-------------------------------------------------------------|
|  Welcome to the coach. Here is how it works:                |
|  - Set your wait tiers                                       |
|  - Turn on the weekly email                                  |
|                                                              |
+-------------------------------------------------------------+
Shown on the home page.
```

### 15.2 API

```ts
export type EditorTool =
  | 'paragraphStyle' | 'bold' | 'italic' | 'link'
  | 'bulletList' | 'orderedList' | 'blockquote'
  | 'undo' | 'redo' | 'source';

export interface RichTextEditorLabels {
  /** The toolbar's name, before the field's label. @default 'Formatting' */
  toolbar: string;
  paragraph: string;                       // 'Paragraph'
  heading: (level: 2 | 3 | 4) => string;   // 'Heading 2'
  bold: string;                            // 'Bold'
  italic: string;                          // 'Italic'
  link: string;                            // 'Link'
  bulletList: string;                      // 'Bulleted list'
  orderedList: string;                     // 'Numbered list'
  blockquote: string;                      // 'Quote'
  undo: string;                            // 'Undo'
  redo: string;                            // 'Redo'
  source: string;                          // 'HTML source'
  linkUrl: string;                         // 'Link address'
  applyLink: string;                       // 'Apply'
  removeLink: string;                      // 'Remove link'
  /** @default 'Use a web, email or phone link, like https://example.com' */
  unsafeLink: string;
  /** Said when a shortcut turns a style on or off. @default (name, on) => `${name} ${on ? 'on' : 'off'}` */
  toggled: (name: string, on: boolean) => string;
  /** Said after the source view drops what the editor cannot keep. @default 'Some formatting was removed' */
  dropped: string;
  /** Shown when the editor cannot load. @default 'The editor could not load. You can edit the HTML here.' */
  fallback: string;
}

export interface RichTextEditorHandle {
  focus: () => void;
}

export interface RichTextEditorBaseProps {
  label?: ReactNode;
  description?: ReactNode;
  errorMessage?: ReactNode | ((validation: ValidationResult) => ReactNode);
  isChanged?: boolean;
  /** @default 'Changed' */
  changedLabel?: string;
  /** HTML, in the editor's schema. '' for an empty document. */
  value?: string;
  defaultValue?: string;
  /** Called with the HTML after each change. An empty document is ''. */
  onChange?: (html: string) => void;
  validate?: (html: string) => ValidationError | true | null | undefined;
  /** The tools, in order. @default every tool */
  tools?: readonly EditorTool[];
  /** @default [2, 3] */
  headingLevels?: readonly (2 | 3 | 4)[];
  /** Taupe text in the empty document. */
  placeholder?: string;
  /** A FieldCounter of characters against this; it never blocks typing. */
  maxLength?: number;
  /** The content's height in lines before it scrolls, and at least. @default 6 and none */
  minRows?: number;
  maxRows?: number;
  /** Link protocols kept. @default ['http', 'https', 'mailto', 'tel'], and relative links */
  allowedProtocols?: readonly string[];
  name?: string;
  form?: string;
  isRequired?: boolean;
  isDisabled?: boolean;
  isReadOnly?: boolean;
  isInvalid?: boolean;
  labels?: Partial<RichTextEditorLabels>;
  className?: string;
  ref?: Ref<RichTextEditorHandle>;
}
export type RichTextEditorProps = RichTextEditorBaseProps & AccessibleName<'label'>;
```

Tiptap's `Editor` is not exposed (decided here, item 31): an app that reaches into it ties itself to the engine, which the library may change, and every value it needs is the HTML.

### 15.3 The schema

Paragraphs; headings at `headingLevels`; bold (`strong`) and italic (`em`); links (`a` with `href`, and `rel="noopener noreferrer nofollow"` on external links, to verify the default set); bulleted and numbered lists (`ul`, `ol`, `li`), nested; quotes (`blockquote`); hard breaks (`br`). Nothing else: no inline styles, classes, colors, fonts, images, tables or scripts. Pasted HTML and the source view are parsed through it, so what the schema does not hold is dropped, and the value only ever holds these tags (open question 30). The docs still say to sanitize on the server, since a value can be posted by anything.

### 15.4 Markup and roles

- `div.field.rich-text-editor`, the `FieldHead` (with `FieldCounter` when `maxLength`), then `div.rich-text-editor-frame` holding:
  - React Aria's `Toolbar.rich-text-editor-toolbar` (`role="toolbar"`, named `labels.toolbar` and the field's label, "Formatting, Welcome message", `aria-controls` the content), with the paragraph style as a `MenuTrigger` button (its text the current style) opening a `Menu` of `menuitemradio`s; bold, italic, the lists, the quote and the source view as `ToggleButton`s with `aria-pressed`; link, undo and redo as `Button`s; each an `IconButton` named by its label with a `Tooltip` holding its name and shortcut (`Kbd`); groups separated by `Separator`s (`role="separator"`, vertical).
  - `div.rich-text-editor-content.prose`, ProseMirror's `contenteditable` element, given `role="textbox"`, `aria-multiline="true"`, `aria-labelledby` the label, `aria-describedby` the hint, the counter and the error line, `aria-required` and `aria-invalid` from the field, through Tiptap's `editorProps.attributes`.
  - Or, in the source view, a `TextArea` (the library's, `dir="ltr"`, `spellCheck={false}`, the mono font) named "HTML source, Welcome message", with the highlighter's `pre` under it, `aria-hidden`.
- Then the `Description`, the `FieldError`, `input[type="hidden"]` under `name` with the HTML, and the polite status host.

### 15.5 Behavior

- **Typing, paste, undo** are Tiptap's and ProseMirror's, with the starter kit's input rules ("## " starts a heading, "- " a list), each undone by Mod+Z.
- **Toolbar state** follows the selection: a pressed button for each active style, the paragraph style button's text the current block; a tool that cannot apply (a heading inside a list) is disabled.
- **Links.** The link button or Mod+K opens `Popover.rich-text-editor-link` anchored to the link button, a `Dialog` named "Link" with a `TextField` (`labels.linkUrl`, `type="url"`) holding the current link's address, Apply (primary) and, on an existing link, Remove link (tertiary). Enter applies. An address whose protocol is not in `allowedProtocols` (a `javascript:` link) is refused with `labels.unsafeLink` in the field's error line. Closing gives focus back to the content with the selection where it was when opened by Mod+K, and to the link button when opened by it (decided here, item 32).
- **The source view** (open question 28). The source toggle swaps the content for the TextArea holding the HTML, one block per line, with the source app's highlighter drawing the tags in slate and the text in ink in a `pre` under a transparent-text TextArea (the overlay the source app uses; to verify). Every other tool is disabled while it is shown. Toggling back parses the text through the schema; if the parse drops an element the text held, the status says `labels.dropped`. Focus stays on the toggle both ways.
- **Tab leaves** (open question 31). Tab and Shift+Tab never indent or insert a tab: Tiptap's list keymap for Tab is removed, so the editor is never a keyboard trap (2.1.2). Lists nest and unnest with Mod+] and Mod+[ (to verify against Google Docs' and Word's shortcuts) and by typing at a list item's start as Tiptap allows. Alt+F10 moves focus from the content to the toolbar, and Escape in the toolbar moves it back to the content (the convention of TinyMCE and CKEditor; to verify each).
- **Announcements.** A shortcut that turns a style on or off (Mod+B) says `labels.toggled(name, on)` through the status host, since nothing else tells a screen reader user it worked (to verify CKEditor 5's practice). A toolbar press needs none: the button's pressed state is read.
- **Value.** `onChange` gets the HTML after each change, '' for an empty document; a controlled `value` that differs from the editor's HTML is set without moving the selection when only the app's copy changed, and replaces the content otherwise.
- **The counter** counts characters of text, not of HTML, against `maxLength`, and never blocks (the parent spec's FieldCounter rule); past it, the field is invalid on submit.
- **Required** is a non-empty document. **Read only** draws the content without the toolbar's tools (they are not drawn) and `contenteditable="false"`, focusable and readable. **Disabled** removes it from the tab order and draws it taupe.

### 15.6 Keys

| Key | Does |
| --- | --- |
| Tab, Shift+Tab | Into the toolbar (one stop, its last focused tool or the first), then the content, then out. Never inside the content. |
| Arrow Left, Arrow Right, Home, End | In the toolbar, between tools, in the drawn direction (React Aria's `Toolbar`). |
| Alt+F10 | From the content, to the toolbar. |
| Escape | In the toolbar, back to the content; in the link popup, closes it. |
| Mod+B, Mod+I | Bold, italic. |
| Mod+K | Link. |
| Mod+Shift+8, Mod+Shift+7 | Bulleted and numbered list (Tiptap's defaults; to verify). |
| Mod+Shift+B | Quote (Tiptap's default; to verify). |
| Mod+Alt+0, Mod+Alt+2, Mod+Alt+3 | Paragraph, Heading 2, Heading 3 (Tiptap's defaults; to verify). |
| Mod+], Mod+[ | Nest or unnest a list item. |
| Mod+Z, Mod+Shift+Z, Mod+Y | Undo, redo. |

The docs' Keys table writes "Ctrl" and "Cmd" in place of "Mod", as the CommandPalette page does.

### 15.7 Screen readers

The content reads "Welcome message, edit text, multi-line" (to verify per reader) with its hint; the text is read as a document, headings and lists included, in browse mode. The toolbar reads "Formatting, Welcome message, toolbar", each tool its name, state and shortcut ("Bold, toggle button, not pressed, Ctrl+B" through the Tooltip's description; to verify that a tooltip's text is read as the description). ProseMirror's `contenteditable` is read by VoiceOver, NVDA and JAWS in every engine at the floor, with known gaps listed in risk R11; the owner's screen reader pass is an owner action.

### 15.8 Look and CSS

- **The frame** is TextArea's: `--radius-surface`, a 1px `--color-boundary` edge, Raised fill; the focus ring on the frame while the content has focus (the 2px ink ring at 2px and the 1.5px ink edge, TextArea's); the changed and invalid edges by the field contract.
- **The toolbar** is a single row at the frame's top, `border-block-end: 1px solid var(--color-divider)`, wrapping to a second row when it does not fit (no overflow menu, which would hide tools behind a "More" button). Its tools are IconButtons at `--size-control` (40px, 36px compact with a 40px hit area, 44px compact on a coarse pointer), Lucide glyphs at 20px in ink. Pressed: the ink fill with the glyph in canvas, the SegmentedControl's chosen look, and the inset canvas ring when focused. Separators are 1px `--color-divider` lines 24px tall.
- **The content** is `Prose` (batch 6): `--text-body` at 450 in ink, headings at the `h3` and `h4` steps at 500 (an editor's `h2` draws at the `h3` step, since a field holds a section of a page, not a page; recorded), links in `--color-link` with an underline, lists and quotes Prose's. Padding `var(--spacing-inset) 1.5rem`; `min-block-size` from `minRows` lines; with `maxRows`, `max-block-size` and `overflow-y: auto`. The placeholder in taupe, drawn by Tiptap's placeholder extension on the empty first paragraph through a `::before` reading `data-placeholder`.
- **The source view** is `--font-mono` at `--text-small` with a line height that matches the `pre` under it exactly; tags slate, text ink.
- **Weights.** Body 450, headings 500, bold text 700 (the `strong` element's weight, set explicitly, since a browser's default `bolder` from 450 is 700 in Sofia Sans's variable axis but could resolve to a synthesized step elsewhere; `font-synthesis: none` from `base.css` holds). No 600.

### 15.9 Server rendering and loading

- **Two modules** (decided here, item 30). `RichTextEditor` is a small client part with the frame, the toolbar, the face and the loader; the engine (Tiptap, ProseMirror and the editor's extensions) is a separate chunk, `import()`ed in an effect after hydration, so the page's first script does not carry it and the server never imports it.
- **The face**, on the server and until the engine is ready: the label, the counter from the value's text length (a tag-stripping count with no DOM, recorded as approximate until the engine mounts), the frame at its final height, the toolbar with every tool drawn and disabled, the content as three `Skeleton` lines inside the content's padding, and the hidden input with the value. A form submitted before the engine loads sends the value unchanged. The skeleton is not the content, so nothing an app stores is ever injected as HTML by the library.
- **When the engine is ready,** Tiptap mounts with `immediatelyRender: false` (Next's hydration rule), the skeleton is replaced in place at the same height, and the tools come alive. Focus is not moved.
- **If the engine cannot load** (a network error, a blocked chunk), the content becomes the library's `TextArea` holding the HTML, with `labels.fallback` in the hint, named by the field's label and submitting under `name` (the parent spec's fallback to a plain textarea). The toolbar is not drawn. This is the only time a reader sees HTML they did not ask for.
- The engine's load is not delayed until focus (open question 29): a reader who clicks and types at once would lose the first keys.

### 15.10 Forced colors, right to left, density and pointer

- **Forced colors.** The frame's edge `canvastext`; pressed tools `highlight` with `highlighttext` glyphs under `forced-color-adjust: none`; links `linktext`; the separators `canvastext`; the skeleton's lines `graytext`.
- **Right to left.** The toolbar runs from the right, its arrows mirrored by React Aria; each paragraph takes `dir="auto"` so a Persian paragraph and an English one sit in one document each in its own direction (Tiptap's text direction option; to verify its name and version), and lists and quotes follow by logical properties. The list and quote glyphs are mirrored under `dir="rtl"`; undo and redo are not, as every system draws them (to verify).
- **Compact density.** The toolbar's tools 36px with 40px hit areas; the content's padding unchanged.
- **Coarse pointer.** Tools 44px; the content takes the platform's selection handles.

### 15.11 Corners

The frame is a holder with `--holder-radius: var(--radius-surface)`, `--holder-border: 1px`, `--holder-pad: 0` for the toolbar row. The toolbar is a single row too short to clear the frame's curve by moving down, so its tools move in: its inline padding is the frame's corner inset, 23px in Rounded, 11px in Soft, and its own padding in Square, the bulk bar's and SaveBar's rule (a new row in the record's table). The content and the source view draw no fill or corner of their own, so nothing else is concentric. The link popover is floating and starts its own ladder; its address field at its top takes the formula as the filter row does.

### 15.12 How others do it

| System | Part | Engine | Toolbar | Tab | Output | What this spec takes |
| --- | --- | --- | --- | --- | --- | --- |
| Material Design 3 | No rich text part (to verify) | | | | | |
| Carbon | No rich text part (to verify) | | | | | |
| Atlassian | Editor (`@atlaskit/editor-core`, to verify the package) | ProseMirror (to verify) | A top toolbar with a paragraph style menu, marks, lists, links, and more | Leaves the editor (to verify) | Atlassian's document format (JSON) | ProseMirror underneath; the style menu first in the toolbar |
| Shopify Polaris | No rich text part; the admin's description editor is its own (to verify) | | | | HTML | |
| React Spectrum | No rich text part (to verify) | | | | | `Toolbar` for the toolbar's keys |
| Apple | `TextEditor` (plain, and rich text with `AttributedString` from iOS 26 and macOS 26; to verify) and `UITextView` with `allowsEditingTextAttributes` | TextKit | The edit menu's Bold, Italic, Underline; the macOS font panel | Inserts a tab on macOS (to verify) | Attributed strings | Marks through shortcuts and a visible toolbar, since a web field has no system menu |
| GitHub Primer | Markdown editor (to verify its status) | A textarea | Markdown buttons | Leaves | Markdown | A source view for those who want it |
| CKEditor 5 and TinyMCE | Editors | Their own | A top toolbar; Alt+F10 to reach it (to verify) | Leaves (to verify) | HTML | Alt+F10 and Escape between toolbar and content |

## 16. The corner rule and the intrinsic size rule, together

The design record's "Nested radii, derived" and the "A width of its own" and "No width of its own" records apply to each part as follows.

| Part | Rounded parts it holds | In a holder | Size container |
| --- | --- | --- | --- |
| TimeField | The clock button, the shared field button; list rows, the popover's formula through Select's list (15px, 3px, 0) | A control: moves out of a holder's corner | No |
| TimeRangeField | Two TimeFields | A control: moves out | No: a wrapping flex row stacks the two times without containment, and each frame's `flex: 1 1 9rem` gives the row a min-content width of one frame, so a 320px column draws them stacked and an `auto` column draws them side by side |
| DateTimePicker | DatePicker's; the time field's frame at the popover's foot, inside its curve, takes `max(var(--radius-micro), calc(var(--holder-radius) - var(--holder-border) - var(--holder-pad)))` on `--input-radius`: 7px, 6px, 0 | A control: moves out | No |
| Slider, RangeSlider | The fill, flush and clipped by the rail; thumbs and marks are dots | A control: moves out | No |
| ColorField | The swatch button, a field button at the start (a circle, 6px, 0); in the picker, the area takes the formula with the micro floor (7px, 6px, 0); the strips are pills clear of the curve; the swatches are controls and the popover's foot pads to its corner inset when they are last (23px, 11px, its padding) | A control: moves out | No |
| PhoneField | The country button, a field button holding text (a stadium, 6px, 0) | A control: moves out | No |
| IconPicker | Cells take the popover's formula wherever they fall (15px, 3px, 0); the search row already does | A control: moves out | No: the grid's columns come from the popover's set width, measured by React Aria's layout only after the reader opens it |
| MediaInput | The frame is a holder: the preview takes the formula with the micro floor (7px, 6px, 0); the actions clear the curve wide and move down narrow (the foot pads to 23px, 11px, its padding) | The field is a control and moves out; its frame is a surface of its own | Yes: `media-input` switches at 28rem of its own box, with `contain-intrinsic-inline-size: 0`; a holder sized by its content gives it a width, which the docs say |
| RichTextEditor | The frame is a holder: the toolbar's tools move in by its corner inset (23px, 11px, their padding); the link popover's field takes the filter row's formula | A control: moves out | No: the toolbar wraps |

**Why only MediaInput is a size container** (decided here, item 7 and 28). Its preview beside its text needs about 28rem, and a viewport query would draw it side by side in a 24rem side panel on a wide screen; its own width decides, as DescriptionList's does. Every other part fills its column or wraps without a query, which keeps the intrinsic size rule's trap (a stand-in width that becomes its holder's min-content and pushes a 320px page sideways) out of eight of the nine. MediaInput declares `contain-intrinsic-inline-size: 0`, and its `Narrow` story and an `InAFlexRow` play hold it at 320px and in a content-sized flex row in three engines.

**New rows in the record's tables:** "Popover (DateTimePicker's), the time field, 7px, 6px, 0"; "Popover (ColorField's), the color area, 7px, 6px, 0"; "Popover, an icon cell, 15px, 3px, 0"; "MediaInput's frame, the preview, 7px, 6px, 0"; and in the table of controls that move: "ColorField's popover, the last swatch row, down, 23px"; "MediaInput's frame, the actions at its foot, down, 23px"; "RichTextEditor's frame, the toolbar's end tools, in, 23px, 11px, as before".

**The audit.** Every new story runs through `apps/storybook/tests/concentric` in Rounded, Soft and Square, the open popovers included.

## 17. Accessibility

- **Roles and names.** TimeField and DateTimePicker: a `group` of `spinbutton` segments named by the label, a clock or calendar `button`, a `listbox` of times or a `dialog` with the calendar's `grid` and a time field. TimeRangeField: a `group` named by the label holding two time groups named "Start" and "End" after it. Slider: one or two `slider`s (native range inputs) named by the label and, for a range, "Minimum" and "Maximum". ColorField: a `textbox`, a swatch `button` described by the color's name, a `dialog` holding a two-slider `group`, `slider`s and a `listbox` of swatches. PhoneField: a `textbox`, with several patterns a country `button` opening a `listbox`. IconPicker: Select's `button` and a `listbox` of named `option`s in a grid layout with a search `searchbox`. MediaInput: a `group` of buttons, an upload row, a `radiogroup` for fit, a `textbox` for alt text. RichTextEditor: a `toolbar` of `button`s and toggle `button`s with `aria-pressed`, a `menu` of `menuitemradio`s, a `textbox` with `aria-multiline`, a `dialog` for links.
- **Focus never falls to the body.** Every part names where focus goes when what holds it goes away:

| When | Focus goes to |
| --- | --- |
| A time is chosen in the list, or the list is dismissed | The clock button (React Aria) |
| DateTimePicker's popover closes | The calendar button (React Aria) |
| ColorField's picker closes | The swatch button |
| PhoneField's country list closes | The input |
| IconPicker's popover closes, chosen or not | The trigger (React Aria) |
| MediaInput's value is removed | The empty face's choose button, after the commit |
| MediaInput's upload is cancelled | Replace, or the choose button when empty |
| The app's media library resolves and focus was lost | The picker's button |
| The editor's link popup closes | The content's selection (opened by Mod+K) or the link button |
| The editor's source view is toggled either way | The toggle, which stays |
| The editor's engine replaces the face | Nothing moves; the face's tools were disabled and not focusable |
| The editor falls back to a TextArea | Nothing moves |

Each is a test that reads `document.activeElement` and fails on `body`, and the docs' end-to-end tests walk the recipes doing the same.

- **Live regions** are mounted empty from the server's first render (IconPicker's count, MediaInput's removal, the editor's toggles), polite, never inside `aria-busy`.
- **Never color alone.** A step and a range are in words in the hint; closed and overnight are words; a contrast level is words with the ratio; a stale icon is words; a failed upload is UploadList's words; a pressed tool is the ink fill and `aria-pressed`. Clay is the Changed chip and the changed edge or dot only; signal orange appears nowhere; error is an invalid value or a failed upload only; success is UploadList's saved row only; taupe is placeholders and disabled text only, never a hint, a stale icon or a closed day.
- **Targets (2.5.8).** Every field 48px (36px compact with 40px hit areas on its buttons, 44px compact on a coarse pointer); slider tracks 40px and 44px; color swatches 32px drawn with 40px hit areas, 40px on a coarse pointer; icon cells 40px and 44px; toolbar tools 40px, 36px compact with 40px hit areas. Segments are text-sized inside a 48px frame, which is the target (React Aria focuses the nearest segment).
- **No keyboard trap (2.1.2).** Tab leaves the editor's content; every popup closes on Escape.
- **Label in name (2.5.3).** Every button's name starts with its visible text ("Replace", "Remove", "Choose from library", "Choose an image"); icon-only tools' names are their tooltips' text.
- **Dragging movements (2.5.7).** Every slider, the color area and the strips move by a single press on the track and by keys; nothing needs a drag.
- **Axe** passes in light and dark for every story, the popovers open included.
- **Screen readers.** Not yet verified with VoiceOver and NVDA for the nine parts (owner action 3), with the questions marked "to verify" in sections 7 to 15.

## 18. Decided here

1. Phase 3's nine parts ship as three batches, 9a (Time), 9b (Pickers) and 9c (Rich text), each a minor release, in that order.
2. Every value is a string or a number: 'HH:mm', 'YYYY-MM-DDTHH:mm', hex, E.164, an icon's name, the app's `MediaValue`, HTML. React Aria's objects never cross the API.
3. TimeField's step is a capture-phase handler on the minute segment through `TimeFieldStateContext`; a typed minute off the step is invalid, not snapped.
4. TimeField's popup is a list of times at `listStep`; the source's sliders are not ported.
5. Where React Aria's hidden input writes seconds the library writes 'HH:mm' itself, with a reset listener.
6. TimeRangeField is two TimeFields in a group; null is closed; half a range is held and invalid when focus leaves the group; overnight by `allowsOvernight`; an end equal to the start is invalid.
7. TimeRangeField wraps with flex and is not a size container.
8. DateTimePicker and DatePicker share one internal `PickerField`; DatePicker's API, behavior and baselines do not change.
9. DateTimePicker's value is a wall time; with `timeZone` it is a UTC instant and the zone is shown, not chosen.
10. DateTimePicker's popover stays open after a day is chosen; its time field takes the popover's formula with the micro floor.
11. Slider and RangeSlider are two parts on React Aria's `Slider`, horizontal only.
12. The slider's rail and fill are ProgressBar's; the thumb is a 20px dot of Raised with a 2px ink edge (24px on a coarse pointer); the track is a 40px hit area, 44px on a coarse pointer in compact.
13. A slider's changed state is the chip, or the dot without a label; no edge.
14. Slider's face writes `formatValue` or ASCII digits for the output and the value text.
15. ColorField is React Aria's `ColorField` and `ColorPicker` parts with lowercase hex in and out; the picker is the area, the hue strip, the alpha strip and the app's swatches, with no hex box and no eyedropper.
16. The contrast chip is the WCAG 2 ratio rounded down to one decimal, the level in words, and a warning badge below `minContrast`; never error or success. `contrastRatio` is exported, pure.
17. ColorField's swatch button is a field button at the start, by the shared rule.
18. Hex is drawn in the body face with tabular figures, not the mono face.
19. PhoneField ships patterns and an adapter, with `northAmericanPattern` the one pattern; the library imports no phone library.
20. PhoneField formats on blur, paste and autofill; its value is an E.164 number or null, and text that is not a number sets the input's custom validity.
21. PhoneField draws no flags; the calling code and the region's name carry the choice.
22. IconPicker is React Aria's `Select` with `SelectPopover` and a grid `ListBox`, not ComboBox.
23. IconPicker takes an `IconSet`; `createIconSet` is the one helper; the library exports no Lucide set.
24. IconPicker's grid is virtualized above 200 names by default.
25. IconPicker's search row and grid are two focus places; the autocomplete's virtual focus is off.
26. Icon cells take the popover's formula and draw an inset focus ring, PositionPad's recorded deviation.
27. A stale icon is kept, submitted, described in slate, and not invalid.
28. MediaInput holds one value, the app's `MediaValue`, on FileDropZone's hooks and box and UploadList's row; the library never reads a file. Its frame is a size container at 28rem with an intrinsic inline size of 0.
29. After a removal, MediaInput's focus goes to the choose button; after the app's library resolves with focus lost, to the picker's button.
30. RichTextEditor ships in `@snapshot-ui/editor` on Tiptap 3; the engine is a separate chunk loaded after hydration; the face draws the frame, the disabled toolbar and Skeleton lines; a failed load falls back to a TextArea of the HTML.
31. Tiptap's `Editor` is not exposed; the ref is a handle with `focus()`.
32. The link popup gives focus back to the content's selection when opened by Mod+K and to the link button when opened by it.
33. The editor's schema is fixed (section 15.3); its value is HTML in that schema, '' when empty.
34. Tab leaves the editor; Alt+F10 and Escape move between the content and the toolbar; lists nest by Mod+] and Mod+[.
35. The editor's CSS is `rich-text-editor.css` in core, included in `styles.css`.
36. No new tokens. `--color-field-value`, `--color-field-target`, `--slider-value` and the like are component custom properties, as `--description-list-term-size` is; 9rem, 12rem, 16rem, 22rem and 28rem are literals in their files, as SidePanel's 24rem is.
37. New CSS files: `time-field.css`, `time-range-field.css`, `date-time-picker.css` (9a); `slider.css`, `color-field.css`, `phone-field.css`, `icon-picker.css`, `media-input.css` (9b); `rich-text-editor.css` (9c). Each in `@layer components`, tokens only, unprefixed kebab-case classes, states as data attributes that also match the native pseudo-class, hover in `@media (hover: hover)`, logical properties, and a forced-colors block with system colors only there; imported after the last file of the batch before.
38. Every focus move in this phase runs in a frame after its commit, never in a layout effect (the settings batch's rule, section 4 of its spec).
39. Every file that imports `react-aria-components` starts with `'use client';`; the editor's engine chunk and IconPicker's virtualized grid are only imported by client parts; the patterns, `createIconSet` and `contrastRatio` live in modules without the directive, so a server action can use them.

## 19. Testing

- **Core (`css.test.js`, `token-only.test.js`, `contrast.test.js`).** Each new file is tokens only, in `@layer components`, imported in order, with a forced-colors block, logical properties and system colors only there; MediaInput's container declares `contain-intrinsic-inline-size: 0`; the new corner rows are in the shared `CLEAR` list. Contrast pairs added: the warning badge on Raised and on Lifted in both themes (Badge's gated pairs, to confirm they cover Raised); the slider thumb's ink edge on Raised, canvas and lifted (gated already as ink on those surfaces). No color is added.
- **React (Vitest, jsdom), per batch.**
  - 9a. TimeField: ISO in and out, the warning for a bad value; the step on Arrow Up and Down from on and off the step, wrapping, from empty; an off-step typed minute invalid with the words; the list's times, bounds, chosen check, scroll target, choose and Escape with focus back to the button; Alt+Arrow Down; 12 and 24 hour; the hidden input's 'HH:mm' and reset; required; changed and unlabelled changed. TimeRangeField: closed as null and its word; half a range held and invalid only after leaving the group; overnight with and without the prop; equal times; both hidden inputs and reset; the group's name and each field's. DateTimePicker: the shared `PickerField` leaves every DatePicker test passing unchanged; date and time in and out; the year hold; the popover staying open after a day; `defaultTime`; the time field in the popover bound to the picker; `timeZone` round trips including a skipped and a repeated hour in a zone with clock changes; presets.
  - 9b. Slider and RangeSlider: values, steps, page size, Home and End, crossing prevented, `onChangeEnd`, marks' words in the value text, native inputs in a `FormData`, reset, changed. ColorField: hex forms in and out, the picker's parts and focus, swatches, live updates, `contrastRatio` against a table of known pairs (ink on canvas 16.25, white on ink, a 4.49 that writes "4.4"), the levels' words, the badge below `minContrast`, alpha composited. PhoneField: the pattern's formatting and E.164, trunk prefixes, a '+' switching region, international numbers, invalid text kept with custom validity, a paste and an autofill formatted at once, the country list, `rules` replacing every check, no formatting while typing. IconPicker: `createIconSet`, labels from kebab names, keywords in search, the count status, virtualized above 200 and not below, keys between the search and the grid, the stale face and its hidden input, `allowsEmpty`. MediaInput: the three faces, one check with FileDropZone's words, Replace keeping the old value until the app replaces it, Remove's focus and status, the picker's focus rule, alt and fit through `onChange`, the hidden inputs, required.
  - 9c. RichTextEditor: the schema's round trip of every allowed tag and the dropping of the rest (styles, scripts, images, `javascript:` links); '' for an empty document; controlled value without losing the selection; each tool's command and pressed state; shortcuts and their announcements; Tab leaving; Alt+F10 and Escape; the link popup's protocols and focus; the source view's round trip and the dropped status; the counter; required; the face's markup with no engine; the fallback when the engine's import rejects; axe on each.
  - Server suites: every part in `server-render.test.tsx`, `server-face.test.tsx` (three locales, two zones) and `hydration.test.tsx` with a mocked iPhone, `onRecoverableError` failing the test.
- **Storybook.** Section 20's stories, baselined in the four theme and shape modes and at 375px, and in compact where tagged. Plays in the four story projects (Chromium in light and dark, WebKit and Firefox): every part's keys (`no-visual`); the minute step in three engines; a slider dragged by pointer and moved by keys; the color area by keys; a phone number pasted and autofilled; the icon grid's two-dimensional keys virtualized; MediaInput's drop and paste from a `DataTransfer` and its focus after Remove; the editor's typing, composition events, paste of HTML from a `DataTransfer`, Tab leaving, and the engine's late load (a play that delays the chunk and checks the face, then the editor, at one height). The concentric audit runs every new story in three shapes. Baselines change only through `pnpm --filter @snapshot-ui/storybook visual:docker`.
- **Docs e2e.** Completeness maps for the new pages; 320px and 375px with no sideways scroll; forced colors on a focused segment, a slider, a color swatch, a chosen icon cell and a pressed tool; each batch's recipe at 375 and 1280, reading `document.activeElement` after each removal and close and failing on `body`.

## 20. Docs, stories and design record

- **Pages:** `time-field` (leading with "Steps and lists"), `time-range-field` (leading with "Closed and overnight"), `date-time-picker` (leading with "Wall time or a moment", the time zone section), `slider` (with RangeSlider), `color-field` (leading with "Contrast, in words"), `phone-field` (leading with "Patterns, and when to bring a library", with the `libphonenumber-js` recipe through `rules`), `icon-picker` (leading with "Your icons, not all of them", with the curated, full Lucide and other-set recipes), `media-input` (leading with "MediaInput, FileDropZone or UploadList"), and on the editor's own section of the site `rich-text-editor` (leading with "Installing the editor", then "What it keeps", "Sanitize on the server" and "Loading"). Each with Usage, Props, Accessibility with its Keys table, and Design rules. The `date-picker` page links DateTimePicker; `file-drop-zone` and `upload-tray` link MediaInput; `number-field` links Slider; `select` links IconPicker.
- **Recipes,** one per batch, with the Next App Router and a server action:
  - 9a, **Opening hours:** a Card "Hours" with seven TimeRangeFields (Monday to Sunday, steps of 15 minutes, Sunday closed, Friday overnight), a Card "Next event" with a DateTimePicker in the venue's zone, and a SaveBar.
  - 9b, **Branding:** a Card "Logo" with a MediaInput in image mode with the app's library and alt text, a Card "Colors" with a ColorField of the brand color checked against white text, a Card "Category icon" with an IconPicker of a curated Lucide set, a Card "Contact" with a PhoneField, and a Card "Text size" with a Slider; a SaveBar. Sample content keeps the reservations: no signal orange as a brand color in the examples, no success color for a passing contrast.
  - 9c, **Content:** a Card "Welcome message" with a RichTextEditor, its counter, and a SaveBar; the server action sanitizes the HTML before it stores it, with a sanitizer the app chooses (the docs name DOMPurify with jsdom, or `sanitize-html`, to verify both licenses).
- **Stories:**
  - 9a: `Components/TimeField`: `Default` (density), `TwelveHour`, `Steps`, `ListOpen`, `Invalid`, `Changed`, `UnlabelledChanged`, `Disabled`, `InCard` (density). `Components/TimeRangeField`: `Default` (density), `Closed`, `Overnight`, `Incomplete`, `Changed`, `Narrow`, `WeekInCard` (density). `Components/DateTimePicker`: `Default` (density), `Open`, `WithZone`, `Presets`, `Changed`, `Invalid`, `InCard` (density). `Pages/OpeningHours` (density). `rtl`: `TimeRangeField`, `DateTimePicker`. Face stories for each.
  - 9b: `Components/Slider`: `Default` (density), `Marks`, `Range`, `RangeWithMarks`, `Changed`, `Disabled`, `InCard` (density). `Components/ColorField`: `Default` (density), `PickerOpen`, `WithAlpha`, `Swatches`, `Contrast`, `LowContrast`, `Changed`, `Empty`, `Disabled`, `InCard` (density). `Components/PhoneField`: `Default` (density), `Countries`, `CountryListOpen`, `Invalid`, `International`, `Changed`, `InCard` (density). `Components/IconPicker`: `Default` (density), `Open`, `OpenVirtualized`, `Search`, `NoResults`, `Stale`, `Changed`, `Disabled`, `InCard` (density). `Components/MediaInput`: `Empty` (density), `Image`, `File`, `Uploading`, `Failed`, `WithLibrary`, `FitChoice`, `Narrow`, `Invalid`, `Changed`, `InCard` (density). `Pages/Branding` (density). `rtl`: `Slider`, `ColorField`, `PhoneField`, `IconPicker`, `MediaInput`. No-visual: `InAFlexRow` for MediaInput.
  - 9c: `Editor/RichTextEditor`: `Default` (density), `Empty`, `SomeTools`, `Headings`, `Lists`, `LinkOpen`, `SourceView`, `Face`, `Fallback`, `Invalid`, `Changed`, `Disabled`, `ReadOnly`, `InCard` (density), `Long` (`maxRows`), `Content` (the recipe's page). `rtl`: `RichTextEditor` with a Persian and an English paragraph.
- **Design record:** a section per part in Appendix B of `docs/design-system.md` before it is built (Slider first in 9b, as the parent spec requires for a new part), each with every derived value, its reason and its pairs; the rows of section 16 in "Nested radii, derived"; the icon cells' inset ring with PositionPad's deviation; the slider rail's 1.4.11 reasoning with ProgressBar's; the warning badge as the contrast chip's tone, with its reason against error and success.
- **Guides:** the forms guide gains "Times and dates" (TimeField, TimeRangeField, DatePicker, DateTimePicker and which to use), "Choosing a value on a range" (Slider or NumberField), and "Files and media" (MediaInput, FileDropZone, UploadList). The getting-started page gains "The editor package".

## 21. Risks

- **R1. The minute step over React Aria's segment.** The capture handler must run before React Aria's own keys, set the segment through its state, and leave the announcement and validation working. Mitigation: 9a's first task is a spike in three engines; the fallback is the library's own `useDateSegment` call with its keyboard props wrapped, keeping React Aria's state.
- **R2. React Aria internals by name.** `setSegment` on the time field's state, `timeValue` and `setTimeValue` on the picker's, `disableVirtualFocus` on `Autocomplete`, `GridLayout`'s options, and `SliderFill` are used by name and some are not documented. Mitigation: each is pinned by a test that fails on a React Aria upgrade that renames it; React Aria is pinned at 1.22.1 as now.
- **R3. Time zones and clock changes.** A wall time in a skipped hour does not exist and one in a repeated hour exists twice. Mitigation: `timeZone` is optional; React Aria's disambiguation is used and tested in Asia/Tehran (which has had clock changes; to verify its current rules) and in a zone with a change near the test date; the docs say a wall time is the safer value for anything a person attends in person.
- **R4. `Intl` in the server's HTML.** React Aria may write a slider's `aria-valuetext` and a swatch's color name from `Intl` on the server. Mitigation: the faces override both; the three-locale, two-zone server test catches any that slips, and runs on every React Aria upgrade.
- **R5. Native range inputs and reset.** React Aria's thumb input may not follow a form's reset, and a range's two inputs submit under their names only if React Aria passes them through. Mitigation: tests of `FormData` and reset; the library's reset listener as the fallback.
- **R6. The color picker's gradients in forced colors and right to left.** Gradients vanish in forced colors and the hue strip's direction in right to left is unspecified. Mitigation: `forced-color-adjust: none` on the color parts only; a story in each; the docs record React Aria's direction as found.
- **R7. Phone patterns and real numbers.** A pattern refuses a valid number it does not know (a new area code), and autofill writes numbers in many shapes. Mitigation: the North American pattern checks only the plan's fixed rules (no area code list); `allowsInternational` keeps '+' numbers; `rules` is the escape for apps that need more; plays autofill several shapes.
- **R8. A virtualized grid of two thousand icons.** Keyboard focus on a cell that scrolls away, the set size read by screen readers, and the first open's time on a phone. Mitigation: React Aria's virtualizer keeps focus and sizes (to verify in the spike); 200 as the threshold, measured on a mid-range phone in the spike, and the docs' advice to curate.
- **R9. MediaInput and the app's library.** The app's dialog may not return focus, and a slow `open()` may resolve after the field unmounts. Mitigation: the focus rule of section 14.4; a resolved value after unmount is dropped with a development warning.
- **R10. The editor's engine.** Its size, its server behavior in Next, and Tiptap 3's API are the largest unknowns. Mitigation: 9c's first task is a spike measuring the engine chunk with size-limit for Tiptap and Lexical side by side, loading it after hydration in the Next docs app, and checking `immediatelyRender: false`; if Tiptap's chunk is over 150 kB compressed or its server story fails, the spike's numbers go to the owner with Lexical as the alternative before any other 9c work.
- **R11. `contenteditable` and assistive technology.** Screen readers read rich text editors unevenly, Android keyboards compose in ways that confuse editors, and a Persian paragraph beside an English one tests the bidirectional rules. Mitigation: ProseMirror's maturity on these (section 6.3), plays with composition events, the Persian story, and the owner's pass with VoiceOver on iOS and macOS, NVDA and TalkBack (owner action 3).
- **R12. The source's behaviors.** `.local/SOURCE.md` was absent when this spec was written, so the time field's step and sliders, the phone mask, the color input's contrast chip, the icon picker's stale state, the media input's fit and adapter, and the editor's toolbar set and highlighter are this spec's reading of the parent spec. Mitigation: each plan reads `js/time-input.js`, `js/hours-input.js`, `js/phone-input.js`, `js/color-input.js`, `js/icon-picker.js`, `js/media-input.js`, `js/richtext.js` and `js/code-highlight.js` before the tasks that port them, and records every difference as a correction for the owner.
- **R13. HTML an app stores.** The editor's schema keeps its output clean, but a value can be posted by anything, and the app renders it elsewhere. Mitigation: the schema, the protocol check on links, and the docs' rule to sanitize on the server; the library never renders a value as HTML outside the engine.
- **R14. Three releases while three batches are in flight.** 9a starts after Insights, Settings and the choices batch merge, and baselines and versions shift with each. Mitigation: changesets name no number; each plan starts from the merged `main` and recounts the baselines.

## 22. Open questions

Each has a recommended answer.

1. **The split and the order.** Recommended: three batches, 9a Time, 9b Pickers, 9c Rich text, in that order, because the consumer named the time fields first, 9a rests on the most tested parts, and the editor's dependency decision should not hold back the rest. Alternatives: two batches (everything but the editor, then the editor), or one release of about 485 baselines; or the editor first, if a consumer needs it sooner.
2. **A typed minute off the step.** Recommended: keep it and show an error on commit, as a native `input[type="time"]` with `step` does, so nothing changes under the reader's hands. Alternative: snap it to the nearest step on blur, which never shows an error but changes what the reader typed.
3. **The source's time sliders.** Recommended: replace them with a list of times at a step, as Atlassian's TimePicker does, because a list is one press for common times, is read as a listbox, and sliders for hours and minutes are slow by keyboard. Alternatives: port the sliders in a popover (the source's look, built on 9b's Slider, which would move Slider into 9a); or no popup at all, React Aria's own TimeField.
4. **The list's default step.** Recommended: the field's step when it is 15, 20 or 30 minutes, else 30, so a 1-minute field still offers a short list. Alternative: always the field's step, which gives 1,440 rows for a 1-minute field.
5. **An end equal to the start.** Recommended: invalid, with "open all day" left to the app's own control. Alternative: equal times mean 24 hours, which a reader may also type by mistake.
6. **Emptying a day to closed.** Recommended: no button; Backspace through the segments, and the recipe's Switch "Open" per day through ConditionalFields for one action. Alternative: a "Closed" checkbox in the field, which clears both times.
7. **Overnight ranges.** Recommended: off by default, `allowsOvernight` on, since most hours end the same day and an end before the start is more often a mistake. Alternative: on by default, as late venues need.
8. **DateTimePicker's value.** Recommended: a wall time by default ('2026-10-20T14:30'), and a UTC instant with `timeZone`. Alternatives: always an instant, which forces every app to choose a zone; or always a wall time, leaving zones wholly to the app.
9. **A time zone chooser.** Recommended: not in this phase; the zone is the app's and is shown in the field. Alternative: a `timeZones` prop that adds a Select of zones beside the field, as Carbon does.
10. **DateTimePicker's popover after a day.** Recommended: it stays open for the time, with no Done button; Escape, a press outside or Tab past the time closes it. Alternative: a Done button at the popover's foot, clearer on a phone, one more stop by keyboard.
11. **Sharing DatePicker's body.** Recommended: move it into an internal `PickerField` both use, with DatePicker's tests and baselines unchanged as the proof. Alternative: DateTimePicker copies it, which is faster now and two places to fix later.
12. **Slider and RangeSlider as two parts.** Recommended: two, as React Spectrum has. Alternative: one `Slider` whose value may be a number or a pair, as Polaris' RangeSlider, one name and a union type.
13. **Vertical sliders and a number box.** Recommended: neither in this phase. Alternatives: `orientation="vertical"`, which needs its own keys and baselines; or Carbon's number input beside the track, which a NumberField beside a Slider already gives an app.
14. **The slider's rail.** Recommended: ProgressBar's 12% ink rail, with the thumb and fill carrying the value, one look for both tracks. Alternative: a rail at the boundary color, 3:1, which meets 1.4.11 for the rail too and reads heavier than any other track.
15. **Phone formatting.** Recommended: free typing, formatted on blur, paste and autofill, so the caret never jumps and screen readers never hear the text change. Alternative: the source's mask as typed, which shows the format sooner but moves the caret and fights Android's composition.
16. **A phone number library.** Recommended: none in the box; patterns and a `rules` adapter, with a `libphonenumber-js` recipe in the docs (section 6.2). Alternative: depend on `libphonenumber-js/min`, about 80 kB, for every country out of the box.
17. **Which patterns ship.** Recommended: only `northAmericanPattern`, the parent spec's row. Alternative: a small set (United Kingdom, Germany, France, India, Australia), each about 0.1 kB, which the library would then keep correct.
18. **A hex box inside the color picker.** Recommended: no; the field's own box is one Tab away. Alternative: React Spectrum's hex field under the strips, handy while dragging, a second box for one value.
19. **A Lucide set from the library.** Recommended: no; the app passes its own set, curated or all of Lucide through `lucide-react/dynamic`, and the docs show both. Alternative: export `lucideIconSet` from a separate entry, convenient, but it puts a 127 kB import map one import away from every app and has the library choose the set.
20. **When to virtualize.** Recommended: above 200 names, with a prop to force either way. Alternative: always, simpler, at the cost of a virtualizer's layout on a set of 20.
21. **MediaInput's relation to FileDropZone and UploadList.** Recommended: one value on FileDropZone's hooks and box and UploadList's row (section 6.5). Alternatives: a `variant="media"` of FileDropZone, which gives FileDropZone a value it has never had; or MediaInput with its own drop and progress, which would drift from both.
22. **The contrast chip.** Recommended: the ratio rounded down, the level in words, and a warning badge below 4.5:1 by default; never error or success. Alternative: words only with no badge, quieter, and a low contrast as easy to miss as a passing one.
23. **The editor's engine.** Recommended: Tiptap 3, the parent spec's choice, for its schema, its input method maturity and its MIT core (section 6.3). Alternative: Lexical, about half the size, with HTML handled by its own import and export.
24. **A separate package.** Recommended: yes, `@snapshot-ui/editor`, as the parent spec planned, so `@snapshot-ui/react` never depends on an editor. Alternative: a subpath of `@snapshot-ui/react` (`@snapshot-ui/react/editor`) with Tiptap as an optional peer, one package to install and a dependency list that misleads.
25. **The editor's CSS.** Recommended: in core and in `styles.css`, about 3 kB, so the one-line setup still works. Alternative: in core but outside `styles.css`, imported by the app that uses the editor.
26. **The editor's scope.** Recommended: the toolbar of section 15.2 and the schema of section 15.3; no tables, images, embeds, mentions, collaboration or Markdown. Alternative: images through MediaInput's adapter in this batch, the most asked-for addition, with its own alt text and upload story.
27. **The editor's version.** Recommended: its own versions from 0.1.0 with caret peers on core and react, as `@snapshot-ui/charts` does in practice. Alternative: join the fixed group of core and react, as the parent spec's section 10 says for every package, which starts the editor at 0.14.0 and releases it with every core change.
28. **The source view's highlighting.** Recommended: port the source app's highlighter as an overlay, as the parent spec keeps it. Alternative: a plain mono TextArea in 9c and the highlighting in a later minor, which removes the overlay's caret alignment risk.
29. **When the engine loads.** Recommended: right after hydration, so a reader can type at once. Alternatives: on first focus or hover, which saves bytes on pages where the editor is not used but loses the first keys; or bundled with the part, simplest and heaviest.
30. **The editor's value.** Recommended: HTML in the fixed schema. Alternatives: Tiptap's JSON, which is exact but ties stored content to the engine; or Markdown, which the source did not use and loses what Markdown cannot say.
31. **Tab in the editor.** Recommended: Tab always leaves; lists nest with Mod+] and Mod+[. Alternative: Tab nests list items inside a list and leaves elsewhere, as Google Docs and Word do, with Escape then Tab to leave, which is a trap for anyone who does not know it.
32. **Alt text in MediaInput.** Recommended: shown by default in image mode, never required, with a hint that says empty is right for decoration. Alternative: required unless the reader checks "Decorative", which catches more missing descriptions and adds a control.
33. **Fit or fill.** Recommended: offered by `hasFitChoice`, off by default, as part of the value the app applies. Alternative: always shown in image mode, the source's behavior as the parent spec states it.
34. **IconPicker's basis.** Recommended: Select's popover with a grid (section 13.1). Alternative: ComboBox, the parent spec's basis, with the name typed in the box.
35. **A stale icon.** Recommended: kept, submitted, described, not invalid. Alternative: invalid until the reader chooses again, which forces a fix but blocks saving any other change on the page.

## 23. Size budget

Measured as the others, without React, React Aria, Lucide and `@internationalized/date`, to start at:

| Entry | Batch | Budget | Reason |
| --- | --- | --- | --- |
| `{ TimeField }` | 9a | 3.5 kB | DatePicker's field measured 3.12 kB; a time field drops the calendar and adds the step handler and the list |
| `{ TimeRangeField }` | 9a | 4.5 kB | TimeField twice is shared code; the group, the range rules and the notes |
| `{ DateTimePicker }` | 9a | 5 kB | DatePicker's 4 kB limit, plus the time in the popover, the step and the zone conversion |
| `{ DatePicker }` | 9a | 4 kB, unchanged | The shared `PickerField` moves code, adds none |
| `{ Slider, RangeSlider }` | 9b | 2.5 kB | Marks, the face, two thumbs' names |
| `{ ColorField, contrastRatio }` | 9b | 4.5 kB | The field, the swatch button, the picker's composition and the chip |
| `{ PhoneField, northAmericanPattern }` | 9b | 3 kB | TextField, the parsing and formatting, the country list |
| `{ IconPicker, createIconSet }` | 9b | 4 kB | Select's popover, the grid, the status, the stale face; `Virtualizer` is React Aria's and not counted, and is measured with React Aria too |
| `{ MediaInput }` | 9b | 4.5 kB | FileDropZone's hooks and UploadList's row are shared; the faces, the adapter, the focus rules |
| `@snapshot-ui/editor` `{ RichTextEditor }` | 9c | 4 kB | The face, the toolbar, the loader, the fallback; the engine is not in it |
| The editor's engine chunk | 9c | Set by the spike, at most 150 kB compressed | Tiptap and ProseMirror (section 6.3); measured with everything, since it is all the editor's |

The CSS adds about 16 kB to `styles.css` before compression over the three batches: 9a about 2 kB (`time-field.css` 1 kB, `time-range-field.css` 0.6 kB, `date-time-picker.css` 0.4 kB), 9b about 8.5 kB (`slider.css` 2 kB, `color-field.css` 2.5 kB, `phone-field.css` 0.5 kB, `icon-picker.css` 1.5 kB, `media-input.css` 2 kB), 9c about 3 kB. A part over its budget is reported with the number, and the limit follows the rule: the measured entry rounded up to the next 0.5 kB, plus 0.5 kB.

## 24. Visual baseline estimate

Each visual story is baselined in five modes (Rounded light, Rounded dark, Soft light, Square light, Rounded light at 375px), and a story tagged `density` adds compact, six.

| Batch | Group | Visual stories | Of them with compact | Baselines |
| --- | --- | --- | --- | --- |
| 9a | TimeField | 9 | 2 | 47 |
| 9a | TimeRangeField | 7 | 2 | 37 |
| 9a | DateTimePicker | 7 | 2 | 37 |
| 9a | Pages/OpeningHours | 1 | 1 | 6 |
| 9a | Right to left | 2 | 0 | 10 |
| **9a** | | **26** | **7** | **137** |
| 9b | Slider | 7 | 2 | 37 |
| 9b | ColorField | 10 | 2 | 52 |
| 9b | PhoneField | 7 | 2 | 37 |
| 9b | IconPicker | 9 | 2 | 47 |
| 9b | MediaInput | 11 | 2 | 57 |
| 9b | Pages/Branding | 1 | 1 | 6 |
| 9b | Right to left | 5 | 0 | 25 |
| **9b** | | **50** | **11** | **261** |
| 9c | RichTextEditor | 16 | 2 | 82 |
| 9c | Right to left | 1 | 0 | 5 |
| **9c** | | **17** | **2** | **87** |
| **All** | | **93** | **20** | **485** |

Existing baselines: none should change. DatePicker's are the proof that the shared `PickerField` draws the same, and must stay byte-identical; `date-picker.css`'s focus rule gains selectors that match only the new frames; FileDropZone's box is reused by class with no rule changed. Face stories render to strings and are baselined like any other. Any change to an existing baseline is investigated before it is committed, and every new one goes through `pnpm --filter @snapshot-ui/storybook visual:docker`.

## 25. Release

- **Changesets,** minor for `@snapshot-ui/core` and `@snapshot-ui/react`, released together, naming no number:
  - 9a: `time-field.md`, `time-range-field.md`, `date-time-picker.md`; a charts patch for its core peer.
  - 9b: `slider.md`, `color-field.md`, `phone-field.md`, `icon-picker.md`, `media-input.md`; a charts patch.
  - 9c: `@snapshot-ui/editor` minor from 0.0.0 (its first release, 0.1.0, unless open question 27 is taken the other way); core minor for `rich-text-editor.css`; a charts patch. The release workflow gains the new package as a trusted publisher (owner action 4).
- **Release notes,** short, per batch: what each part is for, its value's format, the one prop most apps need (`step`, `allowsOvernight`, `timeZone`, `formatValue`, `contrastWith`, `patterns` and `rules`, `icons`, `onFiles` and `upload`, `tools`), and "Upgrade `@snapshot-ui/core` and `@snapshot-ui/react` together".

## Owner actions

1. **Approve this spec,** or answer the open questions of section 22 that should go another way.
2. **Merge Insights, Settings and the choices batch first,** each with its Version Packages pull request, so 9a starts from their release and the baseline count is known.
3. **Devices and screen readers before each release:** VoiceOver on macOS and iOS, NVDA on Windows and TalkBack on Android for the questions marked "to verify" in sections 7 to 15, the time segments typed on a phone, a slider and the color area by touch, a phone number autofilled on iOS and Android, and the editor with a Persian keyboard; Windows' contrast themes for every part. Recorded in each Appendix B section; until then "not yet verified".
4. **npm, for 9c:** add the GitHub repo as a trusted publisher for `@snapshot-ui/editor` before its first release (parent spec, section 10).
5. **Docker, for the baselines,** once after the last task of each batch.
6. **Ask the first consumer** which of its fields need a time zone, which countries its phone numbers come from, whether it has a media library for MediaInput's adapter, and whether it needs the editor before 9b; the answers may reorder section 2.
