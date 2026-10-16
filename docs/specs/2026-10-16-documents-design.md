# Documents: FileDropZone, UploadTray, ProgressBar, DatePicker, SaveBar, PageHeader and Breadcrumbs: design

Status: written for review on 2026-10-16. The twenty-five rulings in section 13.1 wait for the owner; everything else is decided here and listed in section 13.2, and what this document cannot settle is in section 18.
Parent spec: `docs/specs/2026-10-10-snapshot-ui-design.md`. This document pulls forward the phase 3 rows "FileDropZone" and "DatePicker, DateTimePicker, Calendar" (its DatePicker only), the phase 4 row "ProgressBar, Meter" (its ProgressBar only) and the phase 5 rows "PageHeader, Breadcrumbs" and "SaveBar". It adds UploadList and UploadTray, which the parent spec does not list, and two follow-ups to DataTable from the consumer's use of 0.6.0. It answers batch 4 ("Documents") of the first consumer's roadmap. The design authority remains `docs/design-system.md`.
Released before this: batch 3c, `@snapshot-ui/core` and `@snapshot-ui/react` 0.6.0 and `@snapshot-ui/charts` 0.1.3 (the data table). Section 2 lists what this document takes from batches 1 to 3c.

## 1. Goal

Give a documents flow its parts: a place to drop files, on the whole page or in a form, with a button for the keyboard and for touch; a tray that follows each file from waiting to saved, needs review or failed, across client navigation; a progress bar for the upload and for the reading after it; a date field for a review grid; a save bar that says what will be saved and guards a cancel; and a page header with breadcrumbs. Fix the two places DataTable fell short in the consumer's hands. Ship them as the batch 4 minor release, 0.7.0.

The hard part of batch 4 is that most of it is about time and place rather than looks. A drag of files is a browser event no React Aria part owns at the page's scale; an upload outlives the page that started it; the save bar, the upload tray, the bulk-action bar, the tab bar and the toasts all want the bottom of the screen. Rulings 1 to 12 and section 12 are the calls on each.

Build order, which is also the plan's order. It is the consumer's order, with ProgressBar moved first because the upload list draws it, so every commit builds:

1. **ProgressBar** (section 5): a static part, the Meter's sibling, determinate and indeterminate.
2. **FileDropZone, PageDropZone and FileButton** (section 6): the inline zone, the page-wide zone and the button both rely on, with one acceptance contract.
3. **UploadList and UploadTray** (section 7): the rows, and the floating panel on a wide screen that is a sheet on a phone, mounted in the shell.
4. **DatePicker** (section 8): one date, on 3b's Calendar, its segments and its server face.
5. **SaveBar** (section 9): a sticky footer for a form or a review, with its guard and its status.
6. **PageHeader and Breadcrumbs** (section 10): Breadcrumbs last, as the consumer ranks it.
7. **DataTable follow-ups** (section 11): the table face beside an open panel, and the bulk-action bar's overflow.

Out of scope, each recorded where it is deferred:

- `DateTimePicker`, `TimeField`, `MediaInput` and `Slider` (parent spec, phases 3 and 4): the consumer's batch 4 names them as later. MediaInput's image mode, its fit or fill and its adapter for an external picker build on this batch's FileDropZone when their batch comes.
- Uploading. The library makes no request (the consumer's rule): the app sends the bytes, tracks the progress and tells the tray. The docs recipe shows one way with `XMLHttpRequest`'s upload progress, simulated on the docs site.
- Previews of a dropped file (thumbnails, a PDF's first page) and cropping. The tray says a file's name and fate; the document page shows the document.
- Folders dropped whole, as Google Drive and Dropbox take them (open question 1).
- A navigation guard for client-side links (ruling 12, open question 4).
- Replacing the docs site's hand-built header with PageHeader (parent spec risk R8; open question 6).

## 2. Depends on

| From batch 3c or earlier | Used here as |
| --- | --- |
| `Button` (`button/Button.tsx`) with `isPending` and `pendingLabel`, and `IconButton` (ghost) | FileButton's face, the tray's row and header controls, SaveBar's Cancel and primary action, the bulk-action bar's Clear selection |
| `Link` and `RouterProvider` (`link/Link.tsx`) | A tray row's link to its document and every breadcrumb, through the app's router |
| `Sheet` (`sheet/Sheet.tsx`) | The upload tray on a phone |
| `Tooltip`, `TooltipTrigger` | The bulk-action bar's Clear selection once it is an icon (ruling 25) |
| `Menu`, `MenuTrigger`, `MenuItem` | The bulk-action bar's More menu (ruling 25) |
| `useConfirm` (`dialog/useConfirm.tsx`) and `ConfirmDialog` | SaveBar's discard guard (ruling 19) and the tray's Cancel all (ruling 11) |
| `Calendar`'s parts (`calendar/CalendarParts.tsx`): `CalendarHeader`, `CalendarDays`, `CalendarPresets`, `CalendarFace`, `useCalendarDates`, `DEFAULT_CALENDAR_LABELS`, `invalidDate`; `iso.ts`'s `parseIso` and `toIso` | DatePicker's calendar, its presets, its bounds, its ISO values |
| `DateRangePicker`'s frame, segments and server face (`date-range-picker/DateRangePicker.tsx`, `date-range-picker.css`): the `.input` frame on a plain `div` holding React Aria's group props, `drawSegment` and `noSegment`, `span.date-range-face`, the popover's `isPadded` inset | DatePicker's frame, drawn the same way with one `DateInput` |
| The field parts: `FieldHead`, `Description`, `FieldError`, `useChangedDescription`, `FieldChanged`, `data-unlabelled` | FileDropZone's and DatePicker's label, hint, error and Changed chip; SaveBar's Unsaved chip; the changed dot of an unlabelled field (ruling 16) |
| `Meter`'s track (`meter.css`): 8px, the frame color, `--radius-pill`, the ink fill, the head row of label and value | ProgressBar's track, fill and head |
| `ToastRegion`'s status host (`toast/ToastRegion.tsx`): a polite region in the server's HTML, hidden by clipping, keyed by its message | The tray's announcements (ruling 10) and SaveBar's status |
| `--toast-offset-block` (`toast.css`), set by the tab bar while it shows | Lifted again by the tray and the save bar (section 12) |
| `AppShell` (`app-shell/AppShell.tsx`): the `header` slot's sticky wrapper at `--z-header`, `--app-shell-sidebar`, `--app-shell-inset-block-end`, `useAppShell().mainId` | The tray's slot and offsets (ruling 6), PageHeader's sticky place, the page drop overlay's inset |
| DataTable (`data-table/`): `BulkBar`, the container queries on `data-table` at 48rem and 40rem, `DataTableLabels`, `formatCount` | The two follow-ups (section 11) |
| `SidePanel`'s `onCloseRequest` | The docs pattern for a panel holding a form with a SaveBar |
| `Eyebrow`, `Heading`, `Text` | PageHeader's eyebrow, title and description |
| `QUIET_MS` (`utils/quiet.ts`) | When the tray and the save bar speak |
| `useHydrated`, `useControllableState`, `useWarnOnce`, `present`, `cx`, `mergeRefs`, `composeRenderProps`, `AccessibleName`, `AriaName` | As everywhere |
| `isUnderModal` (`overlay/useOverlayStack.ts`) | The page drop zone stands down under an open modal |

React Aria 1.22.1 parts used for the first time: `DropZone`, `FileTrigger`, `DatePicker`, `Breadcrumbs` and `Breadcrumb`. `DateInput`, `DateSegment`, `Calendar`, `Toolbar` and `GridList` are already in use. Every React Aria entry imports `client-only`, so FileDropZone, PageDropZone, FileButton, UploadTray, UploadList, DatePicker, SaveBar and Breadcrumbs are client parts. ProgressBar and PageHeader import nothing from React Aria and stay server parts (ruling 13 for ProgressBar).

## 3. What the consumer needs

The consumer's batch 4 request, in its build order, as input:

1. **FileDropZone**, page-wide (a drop anywhere on the page) and inline, with a file trigger button for the keyboard and for touch; it accepts types and size limits; it works with React Aria's DropZone and FileTrigger.
2. **An upload list**: a list of files with a status each (waiting, uploading with a progress bar, reading, saved, needs review, failed with a reason), each linking to its document once it has one, with retry and remove where they make sense. On a desktop it sits in the bottom end corner as a floating panel; on a phone it is a sheet. It survives client navigation, so it lives in the app shell or a provider, not in the page. Its announcements are polite and not chatty.
3. **ProgressBar**: determinate, and indeterminate for "reading".
4. **DatePicker**: one date, built on the Calendar and DateRangePicker foundations; the consumer uses it as a field in a review grid built of fields per row.
5. **SaveBar**: a sticky footer for a form or a review: a sentence about what will be saved, Cancel with an unsaved-changes guard through `useConfirm`, and a primary action whose label the app sets, such as "Confirm and review next (2 left)". Status in a live region; Discard confirms (the parent spec's catalog note).
6. **PageHeader** (title, eyebrow, description, actions) and **Breadcrumbs**, the second at low priority, last in the batch.
7. **Two follow-ups from 0.6.0.** With SidePanelLayout open at a 1440px window, DataTable's box falls under 40rem and it draws its list face; the app needs a way to keep the table face there. And the bulk-action bar wraps to two lines at 1440px holding "Select all N matching", four actions and Clear selection; lower-priority actions should overflow into a More menu, or another pattern.

Its rules for every part, unchanged from batch 3: `'use client'` only on interactive parts; no `Intl` formatting and no `window` at render, and no first-paint measurement; no external request and no injected script; light and dark, all three shapes, right to left (the Persian guide), comfortable and compact density; WCAG 2.2 AA including 2.5.8; navigation through `RouterProvider`; everything exported from the react index, with the CSS in `core/styles.css`. A documents flow keeps the document's identity and the review position in the URL; the uploads in flight are the one piece of state that outlives every page, so they live in the app's root layout, never in the URL.

## 4. Approach

**The app does the work; the parts say what is happening.** The library never reads a file's bytes, never sends one and never formats a size, a date or a count. A drop zone hands the app `File` objects and the reasons it refused the rest; the app uploads them and tells the tray each file's status, progress and words; the tray draws and announces. This is the line DataTable drew for rows and cells, and it keeps the consumer's "no external request" rule without a transport option in the library (ruling 5).

**One acceptance contract, three ways in.** A drop on the page, a drop on an inline zone and a press on a button reach the app through the same `onFiles(accepted, rejected)`, checked by one internal function against the same props (`acceptedFileTypes`, `maxFileSize`, `maxFiles`, `allowsMultiple`), so a file the button would refuse is refused on a drop for the same reason (rulings 1 and 2). WCAG 2.2's 2.5.7 (Dragging Movements) asks that anything done by dragging can also be done with a single pointer without dragging; FileButton is that, and every docs example pairs a drop with a button.

**Long-lived parts live in the shell.** The tray is mounted once, in a new AppShell slot outside `<main>`, in the app's root layout, which a client navigation keeps (ruling 6). It inherits the shell's offsets, so it clears the rail, the tab bar and a save bar without a measurement before the first paint.

**One bottom edge.** The tab bar, a save bar or a bulk-action bar, the tray and the toasts stack in a fixed order from the bottom, each lifting the next through a custom property the shell or the root carries (section 12), as `--toast-offset-block` already does for the tab bar.

**Client where it must be.** ProgressBar and PageHeader are static server parts. The drop zones, the button, the tray and its list, DatePicker, SaveBar and Breadcrumbs take focus or events and are client parts; each draws its server face from the same tree, as the table below states, and nothing needs `window` before hydration.

| Part | In the server's HTML | After hydration |
| --- | --- | --- |
| ProgressBar | Everything: the role, the values, the app's value text, the fill's width | Nothing changes |
| FileDropZone | The label, the hint, the description, the button and React Aria's hidden file input | Drag and drop and paste |
| PageDropZone | Nothing | Listeners on the document; the overlay while files are dragged over the page |
| FileButton | The button and the hidden file input | The picker opens |
| UploadTray | The polite status host, empty | The panel or the phone's bar, once the app gives it an item |
| DatePicker | The frame, the button, the app's `valueLabel`, the hidden ISO input | React Aria's segments, as DateRangePicker |
| SaveBar | The bar, its sentence, its chip, its buttons, the empty status host | The guard, the pending state |
| PageHeader | Everything | Nothing changes |
| Breadcrumbs | The `nav`, the list and real `<a href>` links | Router navigation |

Rejected along the way:

- **An upload transport in the library** (an `upload(url)` option, presigned URLs, retries with backoff): the consumer's rule forbids requests, and every backend uploads differently (ruling 5).
- **A drop zone that hides its button on a desktop.** A drag is not available to a keyboard, a switch or a screen reader user, and WCAG 2.5.7 asks for a single-pointer way.
- **The tray inside the page.** It would unmount on every navigation and take the uploads' progress with it.
- **The native `<input type="date">`** for DatePicker, rejected for DateRangePicker in 3b for the same reasons: no Persian calendar in most engines, no styling, no presets.
- **A save bar at the top of the page,** Shopify Polaris' contextual save bar (ruling 17).
- **A measured overflow** of the page header's actions and of the breadcrumb trail (rulings 22 and 23), as FilterBar's ruling 8 rejected for the filter row; the bulk-action bar's More menu reads which buttons are hidden at the press, never at render (ruling 25).

## 5. ProgressBar

### 5.1 API

```ts
export type ProgressBarBaseProps = Omit<
  HTMLAttributes<HTMLDivElement>,
  'children' | 'aria-label' | 'aria-labelledby'
> & {
  /** The visible label, such as "Uploading invoice.pdf". Without it, `aria-label` or `aria-labelledby` names the bar. */
  label?: ReactNode;
  /** How far along, from `minValue` to `maxValue`, clamped to them. Ignored while indeterminate. @default 0 */
  value?: number;
  /** @default 0 */
  minValue?: number;
  /** @default 100 */
  maxValue?: number;
  /** Work of unknown length, such as reading a document: a sliding segment and no value. @default false */
  isIndeterminate?: boolean;
  /**
   * The value in the app's words, shown at the head's end and given as the bar's value text: "45%", "1.2 of 4 MB".
   * @default the percentage in ASCII digits, rounded to a whole number: "45%"
   */
  valueLabel?: string;
  /** Shows `valueLabel` at the head's end. @default true while determinate */
  showValueLabel?: boolean;
  ref?: Ref<HTMLDivElement>;
};

/** A name is required: a visible `label`, an `aria-label` or an `aria-labelledby`. */
export type ProgressBarProps = ProgressBarBaseProps & AccessibleName<'label'>;
```

The names are React Aria's (`value`, `minValue`, `maxValue`, `isIndeterminate`, `valueLabel`, `showValueLabel`), so an app that knows React Aria's ProgressBar reads this one.

### 5.2 Behavior

- **Markup** (ruling 13). `div.progress-bar` holding `div.progress-bar-head` (the label in `span.progress-bar-label` and the value in `span.progress-bar-value[aria-hidden="true"]`) and `div.progress-bar-track[role="progressbar"]` with `span.progress-bar-fill`. The role sits on the track, as Meter's sits on its bar, so the head beside it is not lost to the role's presentational children. The track carries `aria-valuemin`, `aria-valuemax`, `aria-valuenow` (clamped) and `aria-valuetext` (`valueLabel`) while determinate, and none of the four while indeterminate, which is how the WAI-ARIA progressbar role says "unknown". It is named as Meter is: `aria-labelledby` the label, else the caller's name, else the value text, so it is never unnamed.
- **Static.** No `'use client'`, no state, `useId` its one hook. The default value text is written with integer arithmetic in ASCII digits, never `Intl`, so the server and the browser write the same; a Persian page passes `valueLabel` in Persian digits, as it passes every other string.
- **Not live.** A progress bar is never a live region: a value that changes every 100ms would be read out every 100ms. The part that owns the work says what matters once (the tray's announcements, ruling 10). A screen reader user who moves to the bar hears its current value.
- **The fill** is `inline-size` of the percentage, set as a custom property on the track (`--progress-bar-value`), so the stylesheet draws it and a forced-colors block can redraw it.
- **Indeterminate** (ruling 14). The fill is a segment 40% of the track wide that slides from the inline start to the end over 1.6s and starts again.

### 5.3 Look and CSS

- **One object with Meter.** The track is Meter's: 0.5rem tall, `--color-frame`, `--radius-pill`; the fill is ink with the track's radius at its ends; the head is Meter's row, the label at `--text-small` weight 500 in ink, the value at `--text-small` in slate with tabular figures at the line's end. The two read as one family: a meter measures against a limit, a progress bar measures work getting done, and the role says which.
- **Motion.** A determinate fill moves to a new value over 200ms (`transition: inline-size 200ms ease`), so a run of small steps reads as one movement. The indeterminate slide takes 1.6s, the skeleton's pulse, so the library's two loading rhythms are one number.
- **Reduced motion** (ruling 14). The determinate transition stops. The indeterminate slide slows by the spinner's own ratio (0.9s to 2.4s), from 1.6s to about 4.3s, and never stops: the design record's rule for the spinner, "a still spinner reads as finished", holds for a bar, where a still segment at 40% reads as 40% done.
- **Right to left.** The fill grows from the right and the segment slides from right to left; both are drawn in logical properties and the slide's keyframes read a direction custom property set under `[dir="rtl"]`, since `:dir()` is above the browser floor.
- **Forced colors.** The track takes a 1px `canvastext` outline and the fill `canvastext`, as Meter's do.
- **Square shape.** The radius is `--radius-pill`, which is 0 under `data-shape="square"`, as Meter's is (decided here, item 5).

## 6. FileDropZone, PageDropZone and FileButton

### 6.1 API

```ts
/** Why a file was refused. */
export type FileRejectionReason = 'type' | 'size' | 'count' | 'empty';

export interface FileRejection {
  file: File;
  reason: FileRejectionReason;
}

/** What every way in accepts. The same props, checked by the same function, on a drop, a paste and a press. */
export interface FileAcceptance {
  /**
   * MIME types, wildcards and extensions, as an `<input accept>` takes them: 'application/pdf', 'image/*', '.heic'.
   * Absent or empty takes any file.
   */
  acceptedFileTypes?: readonly string[];
  /** The largest file, in bytes. */
  maxFileSize?: number;
  /** Several files at once. @default false */
  allowsMultiple?: boolean;
  /** The most files one drop, paste or choice may add; the rest are refused as 'count'. @default 1, or no limit with `allowsMultiple` */
  maxFiles?: number;
  /**
   * Called once per drop, paste or choice, with the files that passed and those that did not, each in the order given.
   * Never called with both empty.
   */
  onFiles: (accepted: File[], rejected: FileRejection[]) => void;
}

export interface FileDropZoneLabels {
  /** The line beside the button where a pointer can drag. @default 'Drag files here or' ('Drag a file here or' without allowsMultiple) */
  dragHint: string;
  /** The button. @default 'Choose files' ('Choose a file') */
  choose: string;
  /** The line while files are over the zone. @default 'Drop to upload' */
  drop: string;
  /** The error line after a drop with refusals, given the count as `formatCount` writes it. @default (count) => `${count} files were not added` */
  rejected: (count: string) => string;
}

export type FileDropZoneBaseProps = FileAcceptance & {
  /** The field's name, above the zone. */
  label?: ReactNode;
  /** The rules, in the app's words, under the zone: "PDF, JPG or PNG, up to 10 MB". */
  description?: ReactNode;
  /** The error line. Replaces the library's line about refused files. */
  errorMessage?: ReactNode;
  isInvalid?: boolean;
  isDisabled?: boolean;
  /** On a phone, opens the camera instead of the file picker. React Aria's FileTrigger prop. */
  defaultCamera?: 'user' | 'environment';
  /** How counts are written, such as in Persian digits. @default String */
  formatCount?: (count: number) => string;
  labels?: Partial<FileDropZoneLabels>;
  className?: string;
  ref?: Ref<HTMLDivElement>;
};

export type FileDropZoneProps = FileDropZoneBaseProps & AccessibleName<'label'>;

export type PageDropZoneProps = FileAcceptance & {
  /** The overlay's line. Required: it says what a drop does. "Drop files to upload" */
  title: string;
  /** Where the files go, in slate: "To Documents, 2026". */
  description?: string;
  isDisabled?: boolean;
};

export type FileButtonProps = FileAcceptance &
  Omit<ButtonProps, 'onPress' | 'children'> & {
    /** The button's text: "Upload", "Choose files". */
    children: ReactNode;
    defaultCamera?: 'user' | 'environment';
  };
```

### 6.2 Behavior

- **The check.** One internal `acceptFiles(files, acceptance)` returns the accepted and the refused, in order. A file is `'type'` when neither its MIME type nor its extension matches an accepted entry (case-insensitive; `image/*` matches any `image/` type; an empty MIME type, which a browser gives a file whose type it does not know, such as a HEIC photo on some systems, falls back to the extension); `'size'` when over `maxFileSize`; `'empty'` when it has no bytes; `'count'` once `maxFiles` files have been accepted. The checks are a courtesy: the docs say the server must check again (OWASP's File Upload Cheat Sheet), since a renamed file passes any check by name.
- **Partial drops** (ruling 2). A drop of five files with one too large accepts four and refuses one, as Google Drive, Carbon's file uploader and Polaris' `DropZone` (which reports accepted and rejected files apart) do; nothing is refused because a sibling was.
- **FileButton.** React Aria's `FileTrigger` around the library's `Button`, with `acceptedFileTypes`, `allowsMultiple` and `defaultCamera` passed through to the hidden `<input type="file">` (whose `accept` is a hint the picker honors and a drag never reads). React Aria's `onSelect` runs the check and calls `onFiles`. The input is cleared after each choice, so choosing the same file again after a failure fires again.
- **FileDropZone.** `div.file-drop-zone.field`, holding the `FieldHead` with its label (and no Changed chip, since a zone holds no value), then the zone's box: React Aria's `DropZone` with the drag hint, the drop line, and a `FileButton` (secondary) inside it, then the `Description` and the error line.
  - **One tab stop** (ruling 3): the button. React Aria's `DropZone` draws a visually hidden button of its own for keyboard drag and drop and paste; the zone takes it out of the tab order, and a paste reaches the zone from the focused button instead, through a `paste` listener on the zone's box that hands the clipboard's files to the same check. GitHub's comment box ("Attach files by dragging and dropping, selecting or pasting them") takes all three ways the same.
  - **Dragging.** While files are over the box React Aria sets `data-drop-target`, and the box draws its drop look (section 6.3) with `labels.drop` in place of the hint. `getDropOperation` answers `'copy'` for any drag that holds files and `'cancel'` for one that holds none (text, a link, a row), whatever the files' types: Safari exposes no file types during a drag, so the zone never claims a refusal it cannot see, and the check runs on the drop (ruling 4).
  - **Refusals.** After a drop, paste or choice with refused files, the zone's error line says `labels.rejected(formatCount(n))` in a polite status (`div.file-drop-zone-status[role="status"]`, mounted empty), and the zone is invalid until the next drop, paste or choice. An `errorMessage` from the app replaces the line; the docs show one that names each file and its reason, in GOV.UK's words ("The selected file must be smaller than 10 MB", "The selected file must be a PDF, JPG or PNG").
  - **A missed drop** (ruling 4). While a zone is mounted, a `dragover` and a `drop` that land anywhere else on the page have their default prevented, so a file dropped beside the zone does nothing rather than open in the tab and leave the app with its form unsaved: a browser opens a dropped file whose drop no page cancels.
  - **Touch.** Under `(hover: none) and (pointer: coarse)` the drag hint is not drawn: a phone cannot drag a file into a page, and "Drag files here" on one is a false promise. The button stays. Both strings are in the server's HTML and the media query picks, so nothing is measured.
  - **Disabled.** The button is disabled, the box takes no drop, and a missed drop is still prevented.
- **PageDropZone** (ruling 1). Mounted in a page, it draws nothing until a drag holding files enters the window (`dragenter` on the document whose `dataTransfer.types` includes `'Files'`). Then `div.page-drop-zone` appears: a React Aria `DropZone` covering the workspace, with the title and the description. A drop on it runs the check and calls `onFiles`; the overlay leaves on the drop, on `dragend`, and when the drag leaves the window (a counter of `dragenter` and `dragleave` on the document, the reliable test across engines, since `relatedTarget` is null in Safari's `dragleave`). It stands down while a modal is open (`isUnderModal` of the workspace), when `isDisabled`, and for a drag that started inside the page (a row, a tag), whose types never include `'Files'`. A page has one page zone; a second mounted at once warns in development and the first one mounted wins. A page with a page zone has no inline zone: a drop has one meaning on a page, and the page zone's overlay would cover the inline one (decided here, item 9). The keyboard's way in is a FileButton the app puts in its PageHeader's actions; the docs page states the pair as one pattern.
- **Server rendering.** FileDropZone's server HTML is the label, the box with both lines, the button and React Aria's hidden input, so the page is laid out before scripts run; the button does nothing until hydration. No `name` and no native form submission: the files reach the app through `onFiles` only (decided here, item 8). PageDropZone renders nothing on the server.
- **Client navigation.** The document listeners are added in an effect and removed when the page unmounts, so a page zone never outlives its page.

| Key | Does |
| --- | --- |
| Tab | To the zone's button: one stop (ruling 3). |
| Enter, Space | On the button, opens the file picker. |
| Ctrl+V, Cmd+V | With focus on the button, adds the clipboard's files, as a drop would. |
| Escape | During a drag, the browser cancels it and the overlay leaves. |

### 6.3 Look and CSS

- **The inline box.** `--radius-surface`, the step the design record's nested-radii table gives "a dialog's ... drop zone" inside a 40px holder; a 2px dashed `--color-boundary` edge (3.06 on the canvas, 3.36 on lifted, above WCAG 1.4.11's 3:1 for a control's edge); no fill of its own, so it takes its holder's; `padding: var(--spacing-peer)`; `min-block-size: 8rem`. Its content centered in a column: a 24px Lucide `Upload` in slate, `var(--spacing-part)` over a line holding the hint at `--text-body` weight 450 in ink and the button. The description under the box is the field's, slate. Under 20rem of its own box (a container query) the content lays out as one row, the icon, the hint and the button, for a zone in a narrow form column.
- **Drop target.** The edge turns solid 2px ink and the box takes the 5% ink wash, the hover wash of a float surface, inside the same radius; the hint is replaced by `labels.drop` in ink at weight 500. Never signal orange, which is consent, and never link blue.
- **Invalid.** The edge turns `--color-error`, dashed, as a field's invalid edge; the error line is the field's. Invalid outranks the drop look's edge color, as it outranks changed.
- **Disabled.** The edge and the text taupe, the icon taupe, `cursor: not-allowed`.
- **The page overlay.** `position: fixed`, inset `var(--spacing-inset)` from the viewport's edges and from the rail (`inset-inline-start: calc(var(--app-shell-sidebar, 0px) + var(--spacing-inset))`), so it covers the workspace and leaves the rail in view, as Google Drive covers its file list and not its navigation. Its edge is 2px dashed ink at `--radius-stadium`, the panel step, since it is a page-sized object; its fill the canvas at 92% (`color-mix` on the token), so the page shows faintly through and the reader keeps their place. At its center a float card (`--color-float`, the frame edge, `--radius-surface`, `--shadow-float`, `padding: var(--spacing-peer) var(--spacing-separate)`) holds a 40px Lucide `Upload` in ink, the title at `--text-h3` weight 500 and the description in slate. Its layer is `calc(var(--z-chrome) + 1)`: over the tab bar, the tray and a save bar, under every modal and the toasts.
- **Motion.** The overlay fades in over 120ms; none under reduced motion.
- **Forced colors.** The dashed edges `canvastext`; the drop target's edge `highlight`; the overlay's fill the system's background color with no transparency, its card's edge `canvastext`.
- **Right to left.** Logical properties throughout; the overlay leaves the rail on the right.

## 7. UploadList and UploadTray

### 7.1 API

```ts
export type UploadStatus = 'waiting' | 'uploading' | 'reading' | 'saved' | 'review' | 'failed';

export interface UploadItem {
  /** Stable across updates. */
  id: Key;
  /** The file's name, as the reader chose it. */
  name: string;
  status: UploadStatus;
  /** From 0 to 1 while uploading. Without it an uploading row draws an indeterminate bar. */
  progress?: number;
  /** The progress in the app's words: "1.2 of 4 MB". @default the percentage, "45%" */
  progressLabel?: string;
  /** Why it failed or what needs review, in the app's words: "Over 10 MB", "The total could not be read". Required for 'failed'. */
  reason?: string;
  /** The document the file became. The name links there, through the router. */
  href?: string;
}

export interface UploadCounts {
  total: number;
  waiting: number;
  uploading: number;
  reading: number;
  saved: number;
  review: number;
  failed: number;
}

export interface UploadListLabels {
  /** The status words. @default 'Waiting', 'Uploading', 'Reading', 'Saved', 'Needs review', 'Failed' */
  status: Record<UploadStatus, string>;
  /** The row buttons' names, given the file's name. @default (name) => `Retry ${name}`, `Remove ${name}`, `Cancel ${name}` */
  retry: (name: string) => string;
  remove: (name: string) => string;
  cancel: (name: string) => string;
}

export interface UploadListProps {
  items: readonly UploadItem[];
  /** Shows Retry on failed rows. */
  onRetry?: (id: Key) => void;
  /** Shows Remove on waiting, failed, saved and needs-review rows. */
  onRemove?: (id: Key) => void;
  /** Shows Cancel on uploading rows. */
  onCancel?: (id: Key) => void;
  labels?: Partial<UploadListLabels>;
  'aria-label'?: string;
  'aria-labelledby'?: string;
  className?: string;
  ref?: Ref<HTMLUListElement>;
}

export interface UploadTrayLabels extends UploadListLabels {
  /** The heading, from the counts as `formatCount` writes them. @default "Uploading 2 of 5", then "5 uploads complete" */
  title: (counts: UploadCounts, format: (count: number) => string) => string;
  /** Said once as a batch starts. @default "Uploading 5 files" */
  started: (counts: UploadCounts, format: (count: number) => string) => string;
  /** Said for rows that turned failed or needs review, gathered over QUIET_MS. @default "1 upload failed" */
  attention: (counts: { failed: number; review: number }, format: (count: number) => string) => string;
  /** Said once every row has settled. @default "5 uploads finished: 3 saved, 1 needs review, 1 failed" */
  settled: (counts: UploadCounts, format: (count: number) => string) => string;
  /** The fold button's name, the same open or folded; `aria-expanded` says which. @default 'Upload details' */
  details: string;
  /** @default 'Close' */
  close: string;
  /** The Cancel all question (ruling 11). @default 'Cancel 3 uploads?', 'Files still uploading will not be saved.', 'Cancel uploads', 'Keep uploading' */
  cancelAllTitle: (inFlight: string) => string;
  cancelAllDescription: string;
  cancelAllConfirm: string;
  cancelAllKeep: string;
  /** The tray's landmark name. @default 'Uploads' */
  region: string;
}

export interface UploadTrayProps extends Omit<UploadListProps, 'labels' | 'aria-label' | 'aria-labelledby'> {
  /** A line under the title in slate, the app's: "About a minute left". */
  description?: string;
  /** Folded to its header on a wide screen. Controlled and uncontrolled. @default false */
  isCollapsed?: boolean;
  defaultCollapsed?: boolean;
  onCollapsedChange?: (isCollapsed: boolean) => void;
  /** The close button once nothing is in flight: the app clears its settled items. */
  onClear?: () => void;
  /** The close button while files are in flight, after a confirm (ruling 11). Without it the button shows only once all have settled. */
  onCancelAll?: () => void;
  /** Warns before the page unloads while anything is in flight (ruling 12). @default true */
  warnsOnUnload?: boolean;
  /** @default String */
  formatCount?: (count: number) => string;
  labels?: Partial<UploadTrayLabels>;
  className?: string;
}
```

`waiting`, `uploading` and `reading` are in flight; `saved`, `review` and `failed` have settled.

### 7.2 UploadList behavior

- **Markup** (ruling 9). `ul.upload-list` of `li.upload-row`, a plain list in the page's tab order, named by `aria-label` or `aria-labelledby` when given. Each row: `span.upload-row-icon[aria-hidden="true"]`, the status icon; `div.upload-row-text` with the name (a library `Link` to `href` when the item has one, otherwise text) and `div.upload-row-status`, the status word and, for `failed` and `review`, the reason after it, and for `uploading` the progress label at its end; under the text, for `uploading` and `reading`, a ProgressBar named `${status word} ${name}`, with no head; then `div.upload-row-actions`.
- **Statuses.** Each has an icon, a word and a color with its reserved meaning (decided here, item 11):

| Status | Icon (Lucide) | Word and color | Bar | Actions |
| --- | --- | --- | --- | --- |
| `waiting` | `Clock` | "Waiting", slate | none | Remove |
| `uploading` | `ArrowUp` | "Uploading", slate, with the progress label | determinate, or indeterminate without `progress` | Cancel |
| `reading` | `ScanText` | "Reading", slate | indeterminate | none: the server holds the file |
| `saved` | `CircleCheck` | "Saved", success | none | Remove |
| `review` | `CircleAlert` | "Needs review", warning, then the reason in slate | none | Remove |
| `failed` | `CircleX` | "Failed", error, then the reason in slate | none | Retry, Remove |

  A row's button shows only when its handler is given; `onRetry` without `onRemove` shows Retry alone. The word carries the status, so the color never carries it alone; the reason is slate, not the tone, since it is a sentence the reader has to read.
- **The name.** The file name keeps its extension in view: the part before the last dot ellipsizes and the extension does not, so "Receipt-2026-10-14-corner-mart....pdf" still says it is a PDF (two spans, the second `flex: none`). The full name is the link's or the row's text, so nothing is lost to a screen reader.
- **Links.** A row with `href` links its name to the document through the router, saved and needs-review rows usually; a reader opens a document and the tray stays, since it is in the shell.
- **Focus after a row leaves.** When Remove or Cancel takes a row away, focus moves to the same button on the next row, or the previous one, or the list's heading in the tray, never to the body. Retry keeps focus on the row's first control as the row changes status.
- **Development warnings.** A `failed` item without `reason`, a repeated `id`, and `progress` outside 0 to 1 each warn once.

### 7.3 UploadTray behavior

- **Where it lives** (ruling 6). AppShell takes a new slot, `floating`, rendered after the workspace and the tab bar, outside `<main>`. The app mounts `<UploadTray>` there from its root layout, inside the provider that holds its uploads; a client navigation keeps the layout, so the tray, its scroll and its collapsed state stay. Outside an AppShell the tray can be mounted anywhere near the root and draws with offsets of zero.
- **When it shows.** With no items the tray draws nothing but its status host (`div.upload-tray-status[role="status"]`, polite, clipped from sight, in the server's HTML, as ToastRegion's host is). With the first item it draws its face.
- **Wide face** (from 768px of viewport, ruling 7). `section.upload-tray`, a `region` landmark named by its heading (`aria-labelledby`), reachable by a screen reader's landmark keys, holding `div.upload-tray-header` (the `h2` title, the description, the fold `IconButton` (Lucide `ChevronDown`, turned while folded) with `aria-expanded` and `aria-controls`, and the close `IconButton` when it applies) and `div.upload-tray-body`, which scrolls and holds the UploadList. Not modal, never a dialog: the reader works on the page while files upload, as with Google Drive's upload panel.
- **Collapsed.** The body is hidden (`hidden`), the header stays with its title, so "Uploading 2 of 5" stays in view. The fold button's name stays the same (`labels.details`) and `aria-expanded` says the state, the WAI-ARIA disclosure pattern.
- **Narrow face** (under 768px, ruling 8). `div.upload-tray-bar`, a docked bar holding one button, named by the title, with a Lucide `ChevronUp`, which opens the library's `Sheet` titled with the title and holding the description and the UploadList. The bar is the same region landmark, named by its title. The sheet is modal, as every sheet is; the bar is not, so the page stays usable under it. The sheet closes on a link press in a row (the router navigates), on Back, and on every way a sheet closes. A tray collapsed on a wide screen stays a bar on a narrow one; the collapsed state is the wide face's.
- **The faces switch** by a media query on the viewport at 768px (`--breakpoint-sm`), both in the HTML once the tray draws, as FilterBar's row and button are, so nothing is measured. An open sheet stays open if the window widens past 768px until it is closed, then the wide face shows; the switch reads `matchMedia` after hydration only for that case.
- **Close** (ruling 11). With nothing in flight, the close button calls `onClear` and the app drops its settled items; the tray leaves with its last item. With files in flight and `onCancelAll` given, the button asks through `useConfirm` ("Cancel 3 uploads?", "Cancel uploads", "Keep uploading", the danger tone) and calls `onCancelAll` on yes; without `onCancelAll` the button is not drawn until every row has settled. Focus after the tray leaves goes to `<main>` (the shell's `mainId`, which takes focus), never to the body.
- **Announcements** (ruling 10). The status host says, in the app's words through `labels`:
  1. `started`, once, `QUIET_MS` after a batch starts: the first item arrives, or items arrive after every earlier one had settled. A second drop during a batch adds to it silently; the title shows the new total.
  2. `attention`, for rows that turned `failed` or `review`, gathered over `QUIET_MS` so five failures in a burst are one sentence.
  3. `settled`, once, when no row is in flight any more, `QUIET_MS` after the last one settles, so a retry that starts at once does not hear a summary first.
  Never a percentage, never a row turning `uploading`, `reading` or `saved` on its own: the summary says them. Each message is keyed, so the same words twice are said twice, as the toast host does.
- **Leaving the page** (ruling 12). While any row is in flight and `warnsOnUnload` is true, a `beforeunload` listener asks the browser to warn before the tab closes or reloads. Client navigation keeps the shell and needs no warning.
- **Scope and direction.** The tray is in the shell's tree, so it takes the shell's theme, shape and density; its sheet copies the scope as every overlay does. In right to left it sits in the bottom left corner.

| Key | Does |
| --- | --- |
| Tab, Shift+Tab | Through the header's buttons, then each row's link and buttons, in order. |
| Enter, Space | On the fold button, folds or unfolds the body; on a link, opens the document; on Retry, Remove or Cancel, does it. |
| Escape | In the narrow face's sheet, closes it; focus returns to the bar. The wide face is not modal and takes no Escape. |

### 7.4 Look and CSS

- **Wide surface.** `position: fixed`; `inset-inline-end: var(--spacing-inset)`; `inset-block-end` per section 12; `inline-size: min(28rem, 100vw - 2 * var(--spacing-inset))`, the toast region's width, so the bottom end corner is one column whether it holds toasts, the tray or both; the float fill, a 1px `--color-frame` edge, `--radius-surface` (a floating surface takes 24px wherever it opens), `--shadow-float`, `z-index: var(--z-chrome)`.
- **Header.** `padding: var(--spacing-part) var(--spacing-part) var(--spacing-part) var(--spacing-inset)`, the title at `--text-body` weight 500 in ink with tabular figures, the description `--text-small` slate, the two 40px ghost icon buttons at the inline end. A `--color-divider` rule under it while the body shows.
- **Body.** `max-block-size: min(24rem, 50dvh)`, scrolling, with the library's thin scrollbar colors.
- **Row.** `min-block-size: max(var(--size-target), 3.5rem)`, `padding: 0.625rem var(--spacing-inset)` (the list face's item), a grid of the 24px icon, the text and the actions with `column-gap: 0.75rem`; a `--color-divider` rule between rows. The name at `--text-small` weight 500 in ink, or the Link look (link blue, underlined) when it links; the status line at `--text-small` weight 450; the bar `var(--spacing-part)` under the status line, spanning the text column. Icons take their status color: slate, success, warning or error, each measured on float in both themes before use (section 15). Row buttons are 40px ghost icon buttons (Lucide `RotateCw` for Retry, `X` for Remove and Cancel).
- **Narrow bar.** `inset-inline: var(--spacing-inset)`, block end per section 12, `block-size: var(--size-field)`, and never under 44px on a coarse pointer, as DataTable's Select head, `--radius-pill`, the float fill, the frame edge, `--shadow-float`; the title at `--text-small` weight 500, a 16px chevron at the inline end, the whole bar its button.
- **Motion.** The wide face rises 8px and fades in over 200ms when it first appears, and folds with no animation; none under reduced motion. The narrow face's sheet is Sheet's.
- **Forced colors.** The surface's edge `canvastext`; status icons keep their shapes in `canvastext`; the words carry the status, as the toasts' tones are carried by their titles.
- **Right to left.** `inset-inline-end` puts the tray at the left; the row grid and the name's ellipsis mirror; the extension stays at the name's end in either direction (the name's two spans are isolated, `unicode-bidi: isolate`).

## 8. DatePicker

### 8.1 API

```ts
export interface DatePickerLabels extends CalendarLabels {
  /** The calendar button's name; the field's label follows it. @default 'Choose date' */
  open: string;
}

/** A day the app names, shown above the calendar: "Today", "Yesterday". */
export interface DatePreset {
  id: Key;
  /** The preset's words, the app's: "Yesterday". */
  label: string;
  /** Its day as an ISO date, computed by the app from its own today. */
  date: string;
}

export interface DatePickerBaseProps extends Omit<
  RACDatePickerProps<CalendarDate>,
  | 'children' | 'className' | 'value' | 'defaultValue' | 'onChange' | 'validate' | 'minValue' | 'maxValue'
  | 'placeholderValue' | 'isDateUnavailable' | 'granularity' | 'hourCycle' | 'hideTimeZone'
  | 'shouldForceLeadingZeros'
> {
  label?: ReactNode;
  description?: ReactNode;
  errorMessage?: ReactNode | ((validation: ValidationResult) => ReactNode);
  /** Whether the value differs from the saved one: the Changed chip with a label, the changed dot without one (ruling 16). */
  isChanged?: boolean;
  /** @default 'Changed' */
  changedLabel?: string;
  /** The day as an ISO date, 'YYYY-MM-DD', or null for none. Gregorian whatever the calendar shown. */
  value?: string | null;
  defaultValue?: string | null;
  /** Called with the Gregorian ISO date once complete and valid, and with null when cleared. */
  onChange?: (value: string | null) => void;
  validate?: (value: string | null) => ReturnType<NonNullable<RACDatePickerProps<CalendarDate>['validate']>>;
  minValue?: string;
  maxValue?: string;
  isDateUnavailable?: (date: string) => boolean;
  /** Today in the app's time zone, as an ISO date. @default the device's today */
  today?: string;
  presets?: readonly DatePreset[];
  /** The day as the app writes it, shown on the server and until hydration: "14 Oct 2026". */
  valueLabel?: string;
  labels?: Partial<DatePickerLabels>;
  /** @default 'bottom start' */
  placement?: Placement;
  popoverClassName?: string;
  className?: string | ((values: DatePickerRenderProps & { defaultClassName: string | undefined }) => string);
  ref?: Ref<HTMLDivElement>;
}

/** A name is required: its `label`, an `aria-label` or an `aria-labelledby`. */
export type DatePickerProps = DatePickerBaseProps & AccessibleName<'label'>;
```

`name` (a hidden input holding the ISO date), `isRequired`, `isDisabled`, `isReadOnly`, `isInvalid`, `firstDayOfWeek`, `isOpen`, `onOpenChange`, `shouldCloseOnSelect` and `autoFocus` are React Aria's.

### 8.2 Behavior

- **Markup.** `RACDatePicker.field.date-picker` holding the `FieldHead` with its Changed chip, then the frame, `div.input.date-picker-control` on React Aria's group props (DateRangePicker's `DateRangeFrame`, generalized and shared), holding `DateInput.date-picker-input` of `DateSegment.date-segment`s and `Button.input-button.date-picker-button` (Lucide `CalendarDays`, named `labels.open`); then `Description`, `FieldError`, and `Popover.date-picker-popover` holding React Aria's `Dialog` with React Aria's `Calendar` drawn with the shared `CalendarHeader` and `CalendarDays`, and the presets above it when given. `CalendarPresets` reads the range calendar's state today; it gains a single-day form that reads React Aria's `CalendarStateContext`, with the same disabled rule for a day out of bounds or unavailable, and the same pressed look for the chosen day's preset.
- **The face.** As DateRangePicker's: on the server and through hydration the `DateInput` renders no segments and `span.date-picker-face` shows `valueLabel`, in a frame at its final size, so nothing moves when the segments arrive. The hidden input holds the ISO date in both passes.
- **Typing.** React Aria's segments: digits type, the arrows change the focused segment, Backspace clears it, and the next takes focus when one is full. Day granularity only. A typed date commits when complete and valid; a cleared one sends `null`.
- **Choosing** (ruling 15). The button or Alt+Arrow Down opens the calendar on the value's month, else `today`'s; choosing a day or a preset closes it (`shouldCloseOnSelect`, true) and focus returns to the button. The calendar stays a popover on a phone, as DateRangePicker's does: one month fits 320px.
- **In a review grid.** A field per cell is named by `aria-label` or by `aria-labelledby` pointing at the column's header and the row's name together ("Date, Corner Mart"); the docs show the pattern. Compact density draws the 36px field. Inside a DataTable cell the segments are spinbuttons that React Aria makes editable, so DataTable's key guard leaves their keys alone (its `EDITABLE` test includes editable content, plan correction 31); the plan checks the arrows in a cell in three engines (R8).
- **A changed field with no label** (ruling 16) draws the changed dot and is described by a visually hidden `changedLabel`, so a grid of changed fields says which changed in words as well as in the edge.

| Key | Does |
| --- | --- |
| Tab | Into the segments, then the button. |
| Arrow Left, Arrow Right | Between segments, in the drawn direction. |
| Arrow Up, Arrow Down | Change the focused segment. |
| Digits, Backspace | Type into or clear the focused segment. |
| Alt+Arrow Down | Opens the calendar. |
| Escape | Closes the calendar; focus returns to the button. |

### 8.3 Look and CSS

- **The frame** is DateRangePicker's `.input` pill with the segments in one `DateInput`, `padding-inline: 1.5rem 3rem` and the calendar button at the inline end; segments ink with tabular figures, isolated so a right-to-left page keeps the date in its locale's order; a placeholder segment taupe under a visible label and slate under `data-unlabelled` (the reader must read it there, since nothing else says what the field holds); the focused segment the ink fill with canvas text on `--radius-micro`. `inline-size: 100%` up to `--container-field`, with a minimum of `12rem` so a full date and the button fit at the compact size.
- **The popover** is DateRangePicker's: `isPadded` stepping down to `--spacing-inset`, one month, the presets as a row of the calendar's preset pills above it.
- **The changed dot** (ruling 16). Under `[data-changed][data-unlabelled]`, a 6px light signal orange dot (`--radius-dot`, the Changed chip's own dot) sits in the frame `var(--spacing-part)` before the calendar button, beside the light signal orange edge every changed field draws. Written once in `field.css` for every field with a frame, so TextField, NumberField and Select in the same grid draw it too.
- **Forced colors.** As DateRangePicker; the changed dot `canvastext`.

## 9. SaveBar

### 9.1 API

```ts
export interface SaveBarLabels {
  /** The clay chip while there are unsaved changes. @default 'Unsaved changes' */
  unsaved: string;
  /** @default 'Cancel' */
  cancel: string;
  /** Said while the action is pending, after QUIET_MS. @default 'Saving' */
  pending: string;
  /** The discard question (ruling 19). @default 'Discard changes?', 'The changes you made here will be lost.', 'Discard changes', 'Keep editing' */
  discardTitle: string;
  discardDescription: string;
  discardConfirm: string;
  discardKeep: string;
}

export interface SaveBarProps {
  /** What will be saved, in the app's words: "2 changes to Corner Mart, 14 Oct". Not live: it changes as the reader types. */
  message: ReactNode;
  /** Unsaved changes exist: the clay chip shows, Cancel asks first, and the page warns before unloading. @default false */
  isDirty?: boolean;
  /** The primary action's text, the app's: "Save", "Confirm and review next (2 left)". */
  actionLabel: string;
  /** A returned promise keeps the bar pending until it settles. On reject the bar stays and reports the error through `reportError`. */
  onAction: () => void | Promise<void>;
  /** Pending for work the app tracks itself: the action shows its spinner and Cancel is disabled. */
  isPending?: boolean;
  /** The spinner's name, read with the action's. @default 'Saving' */
  pendingLabel?: string;
  /** Shows Cancel. Called at once when clean, and after the discard question when dirty. */
  onCancel?: () => void;
  /** Buttons between Cancel and the action, such as "Skip" in a review. */
  secondaryActions?: ReactNode;
  /** A state line, spoken politely as it changes: "3 fields need attention", "Couldn't save. Try again." */
  status?: ReactNode;
  /** `error` draws the status in the error color with an icon. @default 'neutral' */
  statusTone?: 'neutral' | 'error';
  /** Warns before the page unloads while dirty (ruling 12). @default true */
  warnsOnUnload?: boolean;
  labels?: Partial<SaveBarLabels>;
  className?: string;
  ref?: Ref<HTMLDivElement>;
}
```

### 9.2 Behavior

- **Where it goes** (ruling 17). The app puts it as the last child of the form's or the review's holder. It is `position: sticky` at the viewport's bottom while its holder is in view, inside the holder's box, as DataTable's bulk-action bar is (3c's ruling 5): it rides with the form, never covers what follows it, and rests at the form's end when the reader scrolls there. It works the same in a page, a SidePanel's body and a Dialog.
- **Always there** (ruling 18). It draws whether or not anything is dirty; the dirty state adds the chip and the guard. A review's primary action means something with no edit ("Confirm and review next"), and a bar that appears and leaves moves the page under the reader.
- **Markup.** `div.save-bar[role="group"]` named by its message (`aria-labelledby`), holding, in order: `div.save-bar-text` (the `FieldChanged` chip with `labels.unsaved` while dirty, then `span.save-bar-message`), `div.save-bar-status[role="status"]` (mounted empty, in the server's HTML), then `div.save-bar-actions` with the tertiary Cancel, the app's `secondaryActions`, and the primary `Button` labelled `actionLabel`. DOM order is the reading and tab order: the sentence, the status, then the buttons, so a keyboard reader reaches the actions after the fields they act on.
- **The action.** A press calls `onAction`; a returned promise shows the button's pending spinner (`pendingLabel`) and disables Cancel until it settles, as ConfirmDialog's `onConfirm` does. While pending longer than `QUIET_MS` the status says `labels.pending`, so a fast save says nothing. The action is never disabled by the library: the GOV.UK Design System advises against disabled buttons, which leave the tab order and say nothing of why; an app that cannot save yet answers the press with a `status`.
- **Status.** A state, not an event (decided here, item 14): the design record's Toast section keeps "Saved" as a toast and "three fields are invalid" in the save bar. The app writes `status` for a state the reader must act on, such as invalid fields or a failed save, and raises `toast({ tone: 'success' })` for a save that worked. The host speaks each change of `status` politely.
- **Cancel and the guard** (ruling 19). With `onCancel`, Cancel shows. Clean, a press calls it. Dirty, a press asks through the bar's own `useConfirm`: `labels.discardTitle`, `labels.discardDescription`, a danger-toned `labels.discardConfirm` and `labels.discardKeep`; yes calls `onCancel`, no returns focus to Cancel. The confirm names its outcome, never "OK".
- **Leaving the page** (ruling 12). While `isDirty` and `warnsOnUnload`, a `beforeunload` listener asks the browser to warn on close or reload. A client-side link is not guarded by the library (open question 4); a SidePanel holding the form refuses a close through `onCloseRequest`, as 3c's docs show.
- **Focus after the action.** The bar keeps focus on its action. A review that moves to the next document is the app's navigation; the docs advise moving focus to the next document's heading, as SidePanel does on a new row, so the reader lands at the top of what they review next.
- **Kept clear of focus** (WCAG 2.4.11). A focused field must not sit under the bar. `save-bar.css` sets `scroll-padding-block-end` on the root while a save bar is on the page (`:root:has(.save-bar)`), to the bar's height plus its inset and the shell's bottom reserve, from tokens, so the browser scrolls a focused field clear of it from the server's HTML on; the plan proves which engines honor it for focus scrolling and adds the scroll clear DataTable uses where one does not (R6).

| Key | Does |
| --- | --- |
| Tab | From the last field to Cancel, the app's buttons, then the action. |
| Enter, Space | On a button, presses it. |
| Escape | In the discard question, keeps editing; focus returns to Cancel. |

### 9.3 Look and CSS

- **Surface.** One object with DataTable's bulk-action bar: the float fill, a 1px `--color-frame` edge, `--radius-surface`, `--shadow-float`, `padding-block: var(--spacing-part)`, `padding-inline: var(--spacing-inset) var(--spacing-part)`; `margin-block-start: var(--spacing-peer)`. The source app's save bar sat at elevation 1; the library's bars sit at the float level because they cross rows and fields as the page scrolls under them, where the lift's 4% halo does not part them from what is under.
- **Sticky.** `position: sticky; inset-block-end: calc(var(--app-shell-inset-block-end, 0px) + var(--spacing-inset)); z-index: calc(var(--z-header) - 1)`, the bulk-action bar's values: above the page it scrolls over, under the page header and every piece of fixed chrome.
- **Layout.** One row: the text and status take the room (`flex: 1`; the message wraps to two lines at most and then ellipsizes, its full text kept as the group's name), the actions at the inline end. Under 36rem of its own box (a container query) the text and status take their own line and the actions a second line at the inline end, the action last, so a long label ("Confirm and review next (2 left)") never squeezes the sentence; under 24rem each button takes the full width, stacked in DOM order with the action last, nearest a phone's thumb, so the visual order never differs from the focus order.
- **Text.** The message at `--text-small` weight 450 in ink; the chip the field's Changed chip, clay with the light signal orange dot, the one place the bar uses clay, which means exactly unsaved; the status at `--text-small`, slate when neutral, `--color-error` with a 16px Lucide `CircleAlert` when `error`.
- **Buttons.** Cancel tertiary, the app's secondary actions as given, the action primary: ink, never signal orange, which is consent only.
- **Forced colors.** The edge `canvastext`; the chip and the status keep their words.
- **Right to left.** Logical properties; the actions sit at the left.

## 10. PageHeader and Breadcrumbs

### 10.1 API

```ts
export interface PageHeaderProps extends Omit<HTMLAttributes<HTMLElement>, 'title'> {
  /** The page's title, its h1. */
  title: ReactNode;
  /** A Breadcrumbs, above everything else. */
  breadcrumbs?: ReactNode;
  /** The category above the title, as an Eyebrow draws it: "Documents". */
  eyebrow?: ReactNode;
  /** A sentence under the title, in slate. */
  description?: ReactNode;
  /** Buttons at the title's end: a FileButton, a primary Button, a Menu. */
  actions?: ReactNode;
  ref?: Ref<HTMLElement>;
}

export interface BreadcrumbsProps extends Omit<RACBreadcrumbsProps<object>, 'className'> {
  /** The navigation landmark's name. @default 'Breadcrumbs' */
  'aria-label'?: string;
  /** The narrow face's link name, given the parent's text (ruling 22). @default (parent) => `Back to ${parent}` */
  backLabel?: (parent: string) => string;
  className?: string;
  ref?: Ref<HTMLElement>;
}

export interface BreadcrumbProps extends Omit<RACBreadcrumbProps, 'className' | 'children'> {
  /** The page's URL. The last crumb, the current page, takes none (ruling 21). */
  href?: string;
  /** The crumb's text. */
  children: string;
  className?: string;
}
```

### 10.2 Behavior

- **PageHeader markup.** `header.page-header` (a `banner` landmark where it is not inside `<main>` or a sectioning element, as in AppShell's header slot, and a plain `header` at the top of `<main>`), holding `div.page-header-titles` (the breadcrumbs, the `Eyebrow`, the `Heading level={1} size={2}` with the title, and the description as `Text` in slate) and `div.page-header-actions`. Static: no `'use client'`, no state. The title is always an `h1`; a page has one.
- **Sticky or not** (ruling 20). PageHeader does not stick by itself. Put in AppShell's `header` slot it sticks with the shell's wrapper at `--z-header`, as the docs site's header does; put at the top of the page's content it scrolls away. It never condenses on scroll. The docs advise the slot for a header without a description, since a sticky block of title, sentence and actions takes a phone's screen.
- **Actions** (ruling 23) wrap under the titles when they do not fit beside them: the header's row wraps, and under 768px of viewport the actions take their own line at the inline start, the docs header's own behavior today. Nothing is measured and nothing moves into a menu; an app with many actions passes a Menu as the last one.
- **Breadcrumbs markup.** `nav.breadcrumbs[aria-label]` holding React Aria's `Breadcrumbs` (`ol.breadcrumbs-list`) of `Breadcrumb` (`li.breadcrumbs-item`), each holding a library `Link` (`a.breadcrumbs-link`) to its `href`, through the router, and a separator (`span.breadcrumbs-separator[aria-hidden="true"]`, Lucide `ChevronRight`) after every crumb but the last. React Aria marks the last crumb current and gives its link `aria-current="page"`; it takes no `href` and draws as text (ruling 21).
- **The narrow face** (ruling 22). Under 768px of viewport the list is not drawn and `a.breadcrumbs-back` is: one link to the parent (the second to last crumb), a Lucide `ChevronLeft` before its text, named `backLabel(parent)`. Both faces are in the server's HTML and the media query picks one, so nothing is measured; the hidden face is `display: none`, out of the accessibility tree. With one crumb there is no parent and the narrow face draws nothing.
- **Long trails** wrap to a second line on a wide screen; each crumb's text ellipsizes past `16rem` with its full text in a `title` and the link's name. Nothing collapses into a menu.
- **Server rendering.** Both are in the server's HTML with real `<a href>` links, so the trail works before hydration and with scripts off; React Aria's Link takes over the click through the router once hydrated.

| Key | Does |
| --- | --- |
| Tab | Through each crumb's link; the current page is not a stop. |
| Enter | On a crumb, follows its link through the router. |

### 10.3 Look and CSS

- **PageHeader** reproduces the docs site's header (parent spec risk R8), on tokens. `display: flex; flex-wrap: wrap; align-items: flex-end; justify-content: space-between; gap: var(--spacing-peer)`; `padding: var(--spacing-separate) var(--spacing-separate) var(--spacing-peer)` (the docs' 32px top, and the peer step where the docs wrote 20px, which no token holds), the phone's `var(--spacing-inset)` all round under 768px. The titles a grid with `gap: var(--spacing-part)` between the breadcrumbs, the eyebrow and the title; the title at `--text-h2` (36px, 28px under 768px by the type tokens' own rule), weight 500, -2% tracking, wrapping and never truncated, as the rail's labels wrap; the description at `--text-body` weight 450 in slate, `max-inline-size: 44rem` (`--container-field`, a reading measure).
- **No rule beneath** (the design record's Appendix A: "The page header has no rule beneath it").
- **Fill.** The canvas at 80% (`color-mix` on the token) with `backdrop-filter: blur(20px) saturate(140%)` under `@supports`, else the canvas, so content scrolling under a sticky header stays legible and the page keeps its paper. This is the docs header's fill, recorded as a token-built mix.
- **Breadcrumbs.** `--text-small` weight 450; links in slate, underlined, ink on hover where hover exists; the current page in ink at weight 500, not underlined; separators 16px slate, `var(--spacing-part)` either side, mirrored in right to left (`scale: -1 1` under `[dir="rtl"]`), since they point along the trail. Slate, not link blue: link blue is for links inside text, and a trail is navigation, as the rail's items are ink and slate. Each link is drawn at its text's height and hit at 40px tall by a `::after` that extends its box by `(40px - 1lh) / 2` above and below, the menu row buttons' technique, so the 40px target holds without moving the line.
- **The back link** (narrow face) as a crumb, with the 16px chevron before it, hit at 40px.
- **Forced colors.** Links `linktext`, the current page `canvastext`, separators `canvastext`; the header's fill the system's background color with no blur.

## 11. DataTable follow-ups

### 11.1 The table face beside an open panel

At a 1440px window the rail stands expanded (3c's fold acts under 1440px only), and the 24rem panel leaves the consumer's table box under 40rem, so DataTable draws its list face beside the panel. The list face was meant for a phone and for a small laptop; at 1440px the reader expects the table.

**Ruling 24.** DataTable takes `listBelow?: '40rem' | '32rem'` (default `'40rem'`, 0.6.0's behavior). `'32rem'` moves the switch to 32rem of the table's own box: every phone held upright (a 430px phone's box is about 25rem) still draws the list, and a table beside an open panel at 1440px draws the table with its `hideBelow: 'md'` columns gone. A second container block in `data-table.css`, keyed on `data-list-below="32rem"`, does it; the server's HTML is right at every width, as before.

- The value is a container width, written as one, not a breakpoint name (3c's spec correction 15).
- `listBelow` changes the switch for both faces at once; the select mode, the scroll clears and the sticky offsets follow the face drawn.
- The docs recipe passes `'32rem'` to the table beside its SidePanel and says when: when the columns that stay under 48rem fit in 32rem (a row header, a date, an amount and the checkbox column do).

### 11.2 The bulk-action bar's overflow

At 1440px the bar held the count, "Select all N matching", four actions and Clear selection, and wrapped to two lines.

**Ruling 25.** `bulkActions` also takes data, and the bar gains a place for "select all matching":

```ts
export interface DataTableBulkAction {
  id: string;
  label: string;
  /** A 16px Lucide icon, drawn before the label on a button and in the menu. */
  icon?: ReactNode;
  /** Receives the selected keys present in `items`. */
  onAction: (keys: Key[]) => void;
  /** A button in the bar; the rest are in More. At most three are promoted; a fourth warns. @default false */
  isPromoted?: boolean;
  isDisabled?: boolean;
}

// DataTableProps gains:
/** The bar's actions: buttons as before, or data the bar lays out with a More menu. */
bulkActions?: ReactNode | readonly DataTableBulkAction[];
/** After the count: the app's "Select all 1,240 matching" button. */
selectAllMatching?: ReactNode;
// DataTableLabels gains:
/** The More menu's button. @default 'More actions' */
moreActions: string;
```

- **Layout.** `[X] 3 selected, Select all 1,240 matching ........ [Promoted] [Promoted] [More]`. Clear selection becomes a 40px ghost `IconButton` (Lucide `X`) at the bar's inline start, named `labels.clearSelection`, with a Tooltip of the same words, as Material's contextual action bar puts its close control first; the count follows, then `selectAllMatching`, then the promoted actions as secondary Buttons and a `MenuTrigger` with an ellipsis `IconButton` named `labels.moreActions` holding the rest as `MenuItem`s.
- **Narrow bars.** Under 40rem of the bar's own box (a container query) the promoted buttons are not drawn and More holds every action; under 24rem `selectAllMatching` takes its own line. The menu's items are built when it opens, from which promoted buttons are drawn at that moment (`checkVisibility()` on each), a read at a press, never at render.
- **A node still works.** `bulkActions` as a `ReactNode` draws as in 0.6.0 beside the new Clear selection icon, so nothing breaks; the docs move to the data form.
- **Keys.** The bar is still React Aria's `Toolbar`: Arrow Left and Right move through the clear button, `selectAllMatching`, the buttons and More; Escape clears, DataTable's root handler as before; Enter or Space on More opens the menu, and an item's action keeps focus where 3c's correction 38 puts it when the bar leaves.

## 12. The bottom edge

Five parts can want the bottom of the screen at once on a phone: the tab bar, a save bar or a bulk-action bar, the tray's bar and the toasts. They stack in one order, from the bottom up, each lifting the next, and none is measured before the first paint.

| From the bottom | Part | Its own offset | What lifts it |
| --- | --- | --- | --- |
| 1 | BottomTabBar (under 1024px) | 0 | nothing |
| 2 | SaveBar or DataTable's bulk-action bar (sticky in their holders) | `--app-shell-inset-block-end` + the inset | the tab bar's reserve, which the shell already declares |
| 3 | UploadTray (fixed) | the shell's reserve + the inset | `--save-bar-offset`: a sticky bar's height plus the inset while one is on the page |
| 4 | Toasts (fixed, at the root) | `--toast-offset-block` | the tab bar's 4rem (today), plus `--save-bar-offset`, plus the tray's height plus the inset while it shows |

- **`--save-bar-offset`.** `save-bar.css` declares it on `.app-shell:has(.save-bar)` and on `:root:has(.save-bar)` from tokens (the bar's 40px buttons, two part steps, its 2px of edge, and the inset), which is the one-line bar's height, so before hydration a bar laid out on two lines lifts the tray a little short; after hydration the SaveBar writes its border-box height there through a `ResizeObserver`, a measurement that no first paint waits on. DataTable's bar does the same under the same name.
- **The tray's height for the toasts.** The tray writes `--upload-tray-offset` on the root through a `ResizeObserver` once it draws; it is never in the server's HTML, so this measures nothing a first paint shows. `toast.css` adds it to `--toast-offset-block`.
- **The wide screen** has no tab bar; the tray sits 16px above the viewport's bottom, or above a save bar while one shows, and the toasts above the tray. The bottom end corner is one 28rem column (section 7.4).
- **A page shows one sticky action bar at a time.** A list with a selection and a form with unsaved changes on one page is not a pattern the docs show; if both show, the second in DOM order sits above the first's top edge only by their own sticky offsets, and the docs say to avoid it.

## 13. Decisions

### 13.1 Rulings for the owner

1. **One drop zone or two.** Recommended: two parts with one acceptance contract, `FileDropZone` (the inline box, a field with a label, a hint and a button) and `PageDropZone` (an overlay that exists only while files are dragged over the page), plus `FileButton` for a page whose drop target is the page, because the two have different lifecycles and different keyboard paths: Google Drive, Dropbox and Slack accept a drop anywhere on the view and show an overlay only during the drag, while a form's attachment field (GOV.UK's file upload, Carbon's `FileUploaderDropContainer`) is a visible field. Alternative: one `FileDropZone` with a `dropOnPage` prop, Shopify Polaris' `DropZone` shape, which keeps one component but draws an inline box a page-wide target does not want.
2. **What a drop with some bad files does.** Recommended: accept the files that pass and refuse the rest with a reason each (`'type'`, `'size'`, `'count'`, `'empty'`), reported to the app in one call and summarized in the inline zone's error line, because a reader who drops ten receipts and one video should get ten uploads and one clear sentence, as Google Drive, Carbon's file uploader (`invalid` per item with its reason) and Polaris' `onDrop(files, acceptedFiles, rejectedFiles)` do. Alternative: refuse the whole drop when any file fails, simpler to explain and what some single-file forms do, but it punishes nine good files for one.
3. **The inline zone's tab stops.** Recommended: one stop, the Choose files button, which also takes a paste, with React Aria's hidden drop button taken out of the tab order, because a stop that does nothing on Enter confuses keyboard and screen reader users and the button already offers every way in (GitHub's comment box attaches by drag, choice or paste from one place). Alternative: React Aria's documented composition, a `DropZone` with a `FileTrigger` inside, which gives two stops, the first a hidden button announced as the drop target.
4. **Feedback during a drag, and a drop that misses.** Recommended: the drop look is the same for every drag that holds files ("Drop to upload"), the check runs on the drop, and a drop that misses the zone does nothing while a zone is mounted, because Safari exposes no file types during a drag, so a "this file is not accepted" look would work in two engines and lie in the third, and a missed drop that opens the file in the tab loses the reader's form, since a browser opens a dropped file whose drop no page cancels. Alternative: show a refusal look during the drag where the engine exposes types, and leave a missed drop to the browser.
5. **Who holds the uploads.** Recommended: the app, as controlled `items` on UploadTray and UploadList, because the app owns the transport, the server's reading and the "needs review" verdict, and a second store in the library would be a copy to keep in step; this is DataTable's rule for rows and selection. Alternative: a module store like `toast()` (`uploads.add(file)`, `uploads.update(id, changes)`), which any client code could call without a provider, as Uppy's store does for its Dashboard, at the cost of the library holding application state for the first time.
6. **Where the tray lives.** Recommended: a new AppShell slot, `floating`, rendered after the workspace outside `<main>`, so the tray persists in the root layout across client navigation, inherits the shell's offsets for the rail, the tab bar and a save bar without a measurement, and is not a landmark nested in `main`. Alternative: mount it anywhere near the root, portaled to the body like `ToastRegion`, which needs no shell but must read every offset from the root, where the shell does not write them.
7. **The tray's corner and the toasts.** Recommended: the bottom end corner, 28rem wide, with the toasts lifted above it in the same column, because that is where Google Drive's upload panel and Gmail's compose windows sit and where the library's toasts already are, so one corner holds every report on background work. Alternative: the bottom start corner, as Google Drive puts its snackbars apart from its upload panel, which avoids stacking but puts the tray beside the rail on a wide screen and under the reader's thumb on a phone.
8. **The tray on a phone.** Recommended: a docked bar above the tab bar that says the title ("Uploading 2 of 5") and opens a Sheet with the list on a press, because a modal sheet always up would block the page the reader is uploading from, and a docked summary that opens a full sheet is the phone pattern readers already know from the mini player of Apple Music and Spotify. Alternative: the Sheet itself, opened as uploads start and resting at a low snap point, which shows more at once but is modal and covers the page.
9. **The list's semantics.** Recommended: a plain `ul` with each row's link and buttons in the page's tab order, because it reads in a screen reader's browse mode with no keys to learn, works before hydration, and matches Carbon's file uploader, whose items are a plain list with their own buttons; the tray is a landmark, so a reader skips it with the landmark keys. Alternative: React Aria's `GridList`, one tab stop with arrow keys, as DataTable's list face, fewer stops in a long batch but a focus-mode widget for what is mostly text.
10. **What the tray says.** Recommended: politely, three things only: the batch's start, rows that turned failed or needs review (gathered over `QUIET_MS`), and a summary once all have settled, never a percentage, because a failure needs the reader while the rest can wait for the summary, and WCAG 4.1.3 asks that status reach the reader without interrupting. Alternative: only the start and the settled summary, the quietest, which leaves a failure in a long batch unspoken until the end.
11. **Closing the tray with uploads in flight.** Recommended: the close button asks "Cancel 3 uploads?" through `useConfirm` and cancels on yes when the app passes `onCancelAll`, and shows only once all have settled when it does not, because a close button that does nothing or silently abandons work breaks trust; Google Drive asks exactly this. Alternative: no close while in flight, only collapse, which needs no cancel support from the app but leaves a reader no way to stop a mistaken batch from the tray.
12. **Leaving the page with work at risk.** Recommended: UploadTray (while in flight) and SaveBar (while dirty) each add a `beforeunload` warning, on by default with `warnsOnUnload` to turn it off, and client-side links are not guarded by the library, because the browser's warning is the only one that survives a closing tab and Google Drive uses it while files upload, while Next's App Router has no API to block a client navigation. Alternative: no unload warning in the library, leaving it to the app, which is one line for the app but easy to forget.
13. **How ProgressBar is built.** Recommended: a static server part with the WAI-ARIA `progressbar` role written by hand, as Meter is, with the value text the app's (default an ASCII percentage), because React Aria's ProgressBar formats its percentage with `Intl` at render and is a client part, and a bar is drawn on servers in lists and pages. Alternative: React Aria's `ProgressBar`, as Spinner uses it, with `valueLabel` always passed to keep `Intl` out of the HTML.
14. **The indeterminate look and reduced motion.** Recommended: a 40% ink segment sliding across the track over 1.6s, slowed to about 4.3s and never stopped under reduced motion, because Material 3's and Carbon's indeterminate bars move a segment, and the library's spinner rule ("a still spinner reads as finished") applies: a still segment reads as a fixed amount done. Alternative: a still track with Meter's hatching under reduced motion, calmer, but it reads as a value.
15. **DatePicker on a phone.** Recommended: the popover, as DateRangePicker (3a's ruling 2 kept popovers on phones), because one month fits 320px, the segments stay in view while the calendar is open, and Carbon's and Atlassian's date pickers keep the popover at every size. Alternative: a Sheet under 768px, Material 3's modal date picker for mobile, roomier for the thumb but modal over the review grid the reader is comparing against.
16. **A changed field with no label.** Recommended: an unlabelled field with `isChanged` draws the Changed chip's light signal orange dot inside its frame and is described by a hidden "Changed", for every field through `field.css`, because a review grid has no label rows, so the chip cannot show, and the changed edge alone is a change of hue, which WCAG 1.4.1 forbids as the only cue. Alternative: the app draws a row-level "Changed" marker in its grid and the library adds nothing.
17. **Where SaveBar sits.** Recommended: at the bottom, sticky inside the form's holder, because the action is in reach of a phone's thumb, the source app's save bar was at the bottom, DataTable's bulk-action bar already works this way, and the shell already reserves the bottom edge for it. Alternative: Shopify Polaris' contextual save bar at the top of the page, which replaces the app's top bar while changes are unsaved and cannot be missed, but sits far from a form's last field and from the thumb.
18. **When SaveBar shows.** Recommended: always, where the app puts it, with the clay chip and the guard added while dirty, because a review's primary action means something with no edits ("Confirm and review next"), and a bar that appears with the first keystroke moves the page and is easy for a screen reader user to miss. Alternative: only while dirty, Polaris' contextual behavior, which suits a settings form and keeps the screen quieter.
19. **Cancel and Discard.** Recommended: one Cancel that leaves at once when clean and asks first when dirty ("Discard changes?", "Discard changes", "Keep editing", the danger tone), because the parent spec's "Discard confirms" and the consumer's "Cancel with an unsaved-changes guard" are the same act, and a confirm whose buttons name their outcomes is what Nielsen Norman Group and the GOV.UK Design System advise over "OK". Alternative: separate buttons, a Discard that confirms (Polaris' save bar names its button Discard, with an optional confirmation) and a Cancel that leaves without asking, which spends a button on a rare act.
20. **Whether PageHeader sticks.** Recommended: PageHeader is a page part that sticks only when the app puts it in AppShell's `header` slot, never condensing on scroll, because condensing needs a scroll listener and moves the page as it shrinks, and GOV.UK's and Atlassian's page headers scroll with the content. Alternative: a header that condenses to the title on scroll, the large-title pattern of iOS and Material 3's large top app bar.
21. **The current page in the trail.** Recommended: include it as the last crumb, as text with `aria-current="page"`, because the WAI-ARIA Authoring Practices' breadcrumb pattern and Nielsen Norman Group's guidelines do and React Aria's Breadcrumbs marks the last crumb current. Alternative: GOV.UK's rule that the trail ends at the parent, since the `h1` under it names the page, which saves a repeated word but leaves a screen reader user without "current page" in the trail.
22. **Breadcrumbs on a phone.** Recommended: under 768px the trail becomes one "Back to <parent>" link, because GitHub's Primer `PageHeader` shows only its parent link (`ContextArea`) on narrow screens, Polaris replaced breadcrumbs with a `backAction`, and iOS shows the parent as its back button, so a phone gets the one step it can use. Alternative: Adobe Spectrum's and Carbon's trail that collapses its middle crumbs into a menu, which needs a measurement and a menu on a small screen.
23. **Page header actions that do not fit.** Recommended: they wrap under the title, no menu, because nothing is measured and the docs header already wraps this way, and FilterBar's ruling 8 rejected measured overflow for the same reason. Alternative: Carbon's page header, which moves actions into an overflow menu as room runs out.
24. **Keeping the table face beside an open panel.** Recommended: a threshold prop, `listBelow: '40rem' | '32rem'`, because only the app knows whether its columns fit in 32rem, the switch stays a container query that the server's HTML gets right, and Shopify Polaris' `IndexTable` likewise leaves its condensed list to the app (`condensed`). Alternative: a face override, `face: 'auto' | 'table' | 'list'`, the most direct, but an app that sets it from the viewport needs `matchMedia`, which the server cannot answer, so the wrong face shows until hydration.
25. **The bulk-action bar's overflow.** Recommended: actions as data with up to three `isPromoted` as buttons and the rest in a More menu, Clear selection as a 40px X icon at the bar's start, and a `selectAllMatching` place after the count, because Polaris' `IndexTable` splits `promotedBulkActions` from `bulkActions` in a "More actions" menu, Material's contextual action bar keeps a few actions and an overflow menu with its close control first, as Gmail's selection toolbar keeps a few actions and puts the rest under More, and a bar that never wraps keeps the rows under it where they were. Alternative: keep the node slot and lay the bar out on two intended lines (the count and select-all on the first, the actions on the second), which needs no menu but takes a second line from the rows at every width.

### 13.2 Decided here

1. ProgressBar and PageHeader are server parts; every other new part is a client part with its server face stated in section 4's table.
2. One internal acceptance check serves the drop, the paste and the press; the check is a courtesy and the docs say the server checks again.
3. A dropped folder is refused as `'type'` in this batch (open question 1); its `DirectoryDropItem` is never read.
4. The drag hint is not drawn on a coarse pointer without hover; both strings are in the HTML and a media query picks.
5. ProgressBar is one object with Meter: the same track, fill, radius and head. The parent spec's "the ends of a progress stroke take `--radius-dot`" is read as the spinner's stroke caps, whose ends are dots; a linear bar takes `--radius-pill` as Meter does, square under Square, so a meter and a progress bar never differ by shape.
6. ProgressBar is never a live region; the part that owns the work speaks.
7. The determinate fill moves over 200ms; the indeterminate slide takes 1.6s, the skeleton's rhythm.
8. FileDropZone has no `name` and no native form submission: files reach the app through `onFiles`.
9. A page has a page zone or inline zones, never both, and one page zone at a time.
10. The page overlay covers the workspace, not the rail, at `calc(var(--z-chrome) + 1)`, and stands down under a modal.
11. Upload statuses keep the colors' reserved meanings: saved is success (a document saved), failed is error (a save that failed), needs review is warning (the design record names "Needs review" as warning's), and waiting, uploading and reading are slate. Signal orange and clay are not used. Each status has an icon and a word.
12. A file name keeps its extension in view; the reason is slate, not the tone.
13. The tray's wide face is the toast column's 28rem; its switch is the viewport at 768px.
14. SaveBar's status is for states; a successful save is a toast the app raises, the design record's split between events and states.
15. SaveBar never disables its action; GOV.UK's advice against disabled buttons, as 3c's correction 87 applied it to SidePanel's footer.
16. SaveBar and the bulk-action bar share one surface and one sticky rule; a page shows one at a time.
17. Breadcrumbs are slate links, underlined, with mirrored chevrons, and hit at 40px tall.
18. PageHeader reproduces the docs header's layout and fill on tokens; its padding takes the peer step where the docs wrote 20px.
19. DatePicker shares DateRangePicker's frame, its face and its popover; presets are single days the app names.
20. `listBelow` is a container width; `bulkActions` keeps its node form.
21. The docs site has no `.file-drop-zone`, `.page-drop-zone`, `.upload-tray`, `.upload-list`, `.upload-row`, `.progress-bar`, `.date-picker`, `.save-bar`, `.page-header` or `.breadcrumbs` classes to collide with; its own `.header` is not `.page-header`. The plan checks again.
22. One 0.7.0 minor release of core and react, with the size budgets in section 16.

## 14. Accessibility

- **Roles and names.** ProgressBar: `progressbar` on the track, named by its label, valued while determinate. FileDropZone: a field named by its label, its one stop a `button` named "Choose files" and described by the zone's description; refusals in a polite `status`. PageDropZone: no role while idle; its overlay is a drop target for the pointer only, and its keyboard twin is the app's FileButton. UploadTray: a `region` named by its title on a wide screen; on a phone, a `region` holding one `button` that opens a `dialog` titled by the same title. UploadList: a `list` of `listitem`s, each with its link or name, its status in words, its `progressbar` while uploading or reading, and buttons named "Retry invoice.pdf", "Remove invoice.pdf", "Cancel invoice.pdf". DatePicker: React Aria's `group` named by its label, `spinbutton` segments, a button opening a `dialog` with the calendar's `application` and `grid`. SaveBar: a `group` named by its message, a polite `status`, and buttons; the discard question an `alertdialog`. PageHeader: a `header` holding the page's one `h1`. Breadcrumbs: a `navigation` landmark named "Breadcrumbs" holding a list with the current page `aria-current="page"`; on a phone, the same landmark holding one link named "Back to Documents".
- **Dragging (2.5.7).** Every drop has a single-pointer twin: the inline zone's button, and a FileButton beside any page zone, which the docs require.
- **Never color alone.** Each upload status has a word and an icon; a changed field has its chip, or its dot and its hidden word (ruling 16); an invalid zone has its error line; the current crumb has `aria-current` and its weight; an indeterminate bar has no value, which the role says.
- **Targets (2.5.8).** The zone's button, every tray and row button, the tray's bar (the field's height, never under 44px on a coarse pointer), the bulk bar's X and More, SaveBar's buttons and every crumb are hit at 40px or more in every density.
- **Focus not obscured (2.4.11).** SaveBar's scroll padding (section 9.2); the tray and the toasts never take focus on their own, and a focused control under the tray is the tray's own risk (R7), mitigated by its 28rem column and its collapse.
- **Announcements.** The tray (ruling 10), the zone's refusals, SaveBar's status: all polite, all from hosts mounted before their text. React Aria's DropZone label and the date segments' names have no Persian (R9); the library's `labels` name everything it draws.
- **Axe** passes in light and dark for every state, one test per state: each upload status, the tray collapsed and open, the narrow bar and its sheet, the zone idle, as a drop target, invalid and disabled, the overlay, the bar dirty, pending and with an error status, the header with and without each slot, the trail and its back link, DatePicker open and in a grid, the bulk bar with its menu open.

## 15. Testing

- **Core (`css.test.js`, `token-only.test.js`, `contrast.test.js`).** Each new file (`progress-bar.css`, `file-drop-zone.css`, `upload-tray.css`, `date-picker.css`, `save-bar.css`, `page-header.css`, `breadcrumbs.css`) is tokens only, in `@layer components`, imported by `styles.css` after `side-panel.css`, with hover in `@media (hover: hover)`, a forced-colors block and logical properties; the 768px literals in `upload-tray.css` and `breadcrumbs.css` are compared with `--breakpoint-sm`; z-indexes are only `var(--z-*)` or a `calc()` on one; `data-table.css`'s new 32rem container block and `field.css`'s changed dot are covered. Pairs pinned or measured and recorded: success, warning, error and slate as text on float in both themes (the tray's rows), slate on the canvas at 92% (the overlay's description), ink on the 5% wash over canvas and lifted (the drop target), the boundary as a dashed edge on canvas and lifted (3:1), clay on float (SaveBar's chip), slate links on canvas at 80% (the header's fill), light signal orange against a field's raised fill (the changed dot, 3:1 as a graphic).
- **React (Vitest, jsdom).**
  - ProgressBar: the role and values, clamping, the ASCII default value text, `valueLabel`, no values while indeterminate, a name in every branch, and a server render with no client code.
  - The acceptance check: MIME types, wildcards, extensions, empty MIME types, size, empty files, `maxFiles`, order kept, never both lists empty.
  - FileDropZone: a drop, a paste and a choice reach `onFiles` with the same results; one tab stop; refusals in the status; `errorMessage` replaces it; disabled; a missed drop prevented while mounted and not after unmount.
  - PageDropZone: shown only for a drag holding files, hidden on drop, `dragend` and leaving the window (the counter), standing down under a modal; a second page zone warns.
  - UploadList: each status's word, icon, bar and buttons; buttons only with their handlers; the name's link through a mocked router; focus after Remove; the warnings.
  - UploadTray: nothing but the host with no items; the two faces with a mocked `matchMedia`; collapse and `aria-expanded`; close calling `onClear`, and asking before `onCancelAll`; the three announcements and their timing with fake timers, never a percentage; `beforeunload` while in flight only; the `floating` slot outside `<main>`.
  - DatePicker: typing commits an ISO date; null on clear; the calendar opens on Alt+Arrow Down and closes on a choice with focus on the button; presets; the hidden input; the face's `valueLabel`; the changed dot and its description when unlabelled.
  - SaveBar: the chip only while dirty; Cancel clean calls at once and dirty asks; the promise's pending state; the status host speaks `status` and `labels.pending` after `QUIET_MS`; `beforeunload` while dirty only.
  - PageHeader and Breadcrumbs: the `h1`; the slots' order; the current crumb's `aria-current` and no link; the back link's name and target; links through the router.
  - DataTable: `listBelow` writes its attribute; the bulk bar's data form, promotion, the More menu's items at the press, the warning past three promoted, `selectAllMatching`, Clear selection as an icon, and the node form unchanged.
  - Server render and hydration: every part in the server-render and hydration suites, under `en-US`, `de-DE` and `fa-IR` in UTC and Asia/Tehran, with React's `onRecoverableError` failing the test; ProgressBar and PageHeader in the server-components suite.
- **Storybook.** Each part's states as stories, baselined in the four theme and shape modes and in compact, with the tray and the date popover open; a 375px story for every part, the tray's bar and its sheet among them; right-to-left stories in `rtl/RightToLeft.stories.tsx` for the zone, the overlay, the tray, the bars, DatePicker in Persian digits, the header and the trail; a `BottomEdge` story at 375px and 1280px with a tab bar, a save bar, the tray and two toasts, pinning section 12's order. Play tests run in the four story projects (Chromium in light and in dark, WebKit and Firefox): the keys of every part (`no-visual`); a synthetic drop with a `DataTransfer` of files on the zone and the overlay, and the drag counter, in all three engines (R1); the zone's single tab stop and paste; the tray's focus after Remove and after it leaves; SaveBar's scroll clear for a focused last field; the bulk bar's More menu at a narrow box. Baselines change only through `pnpm --filter @snapshot-ui/storybook visual:docker`.
- **Docs e2e.** The completeness maps for each new page; 320px with no sideways scroll for every part; the Documents recipe: files chosen through the button (`setInputFiles`) and dropped on the page (a dispatched drop), the tray following each to saved, needs review and failed with simulated timings, Retry, the tray surviving a client navigation to a second page of the recipe and back, the phone's bar opening its sheet, a review page with DatePicker fields in a grid and a SaveBar whose Cancel asks while dirty, and a `beforeunload` dialog while uploads run; forced colors on the drop target, a failed row and the current crumb.

## 16. Docs, size budgets and release

- **Pages:** `progress-bar`, `file-drop-zone` (with PageDropZone and FileButton), `upload-tray` (with UploadList), `date-picker`, `save-bar`, `page-header` and `breadcrumbs`, each with Usage, Props, Accessibility with its Keys table, and Design rules; the `data-table` page gains "Beside a side panel" (`listBelow`) and "Bulk actions" (the data form); the `app-shell` page gains the `floating` slot. Examples: a form field that attaches one receipt; a Documents page with a page zone and an Upload button in its header; the tray's six statuses; a review grid with DatePicker, NumberField and TextField per row and a SaveBar under it.
- **The Documents recipe**, with the Next App Router: an uploads provider in the root layout holding the items and the `XMLHttpRequest` upload code (simulated with timers on the docs site, which makes no request), `UploadTray` in AppShell's `floating` slot, a Documents page with PageHeader, a FileButton and a PageDropZone, a document page whose review is in the URL, and a SaveBar whose action moves to the next document and focus to its heading.
- **Design record:** a section per part in Appendix B of `docs/design-system.md`, written by the plan, with every derived value, its reason and the measured pairs, and a section "The bottom edge" for section 12.
- **Size budgets**, measured as the others, without React Aria, Lucide and `@internationalized/date`, to start at: ProgressBar 1 kB; FileDropZone with FileButton 2.5 kB; PageDropZone 1.5 kB; UploadList 2.5 kB; UploadTray with UploadList 4.5 kB (it carries Sheet, IconButton and useConfirm, as SidePanel's entry carries Sheet); DatePicker 4 kB (DateRangePicker's budget); SaveBar 3 kB (with useConfirm); PageHeader 1 kB; Breadcrumbs 1.5 kB; DataTable from 9 kB to 10 kB for the More menu and the data form. A part over its budget is reported with the number, as 3c's SidePanel was.
- **Changesets:** one per part, minor, for `@snapshot-ui/core` and `@snapshot-ui/react`, and one each for AppShell's `floating` slot, the unlabelled changed dot in `field.css` and the two DataTable follow-ups, released together as 0.7.0. `@snapshot-ui/charts`'s `@snapshot-ui/core` peer (`workspace:^`) publishes as `^0.7.0`, and 0.1.3's `^0.6.0` does not admit 0.7, so a patch changeset takes it to 0.1.4, as 3a's, 3b's and 3c's did.
- **Release note for the consumer:** the library never uploads: pass the app's items to `UploadTray` and mount it in AppShell's `floating` slot from the root layout; pair every PageDropZone with a FileButton; check files again on the server; `DatePicker` takes and gives ISO dates, with `valueLabel` for the server's HTML and `aria-label` in a grid; SaveBar's status is for states and a successful save is a toast; pass `listBelow="32rem"` to a table beside a SidePanel; move bulk actions to the data form to get the More menu.

## 17. Risks

- **R1. Drag and drop of files differs by engine.** Safari gives no file types and a null `relatedTarget` during a drag, Firefox fires `dragleave` on every child boundary, and iPadOS drags files from another app into Safari. Mitigation: the plan's first FileDropZone step is a spike that proves, in Chromium, WebKit and Firefox, a drop on the zone and on the overlay, the drag counter, the missed drop prevented, and React Aria's `DropZone` receiving a drag that began before it was drawn (the overlay appears under the pointer mid-drag); the fallback is React Aria's `useDrop` hook on the library's own element behind the same props.
- **R2. React Aria's hidden drop button.** Ruling 3 takes it out of the tab order, which `DropZone` offers no prop for. Mitigation: the spike tries `DropZone` with the button's `tabIndex` set through a ref; the fallback is `useDrop` with `hasDropButton: false` and the library's own paste listener, which loses React Aria's keyboard drag and drop between parts, a path no consumer uses for files.
- **R3. Page-wide listeners meet other drop targets.** A rich text editor or a reorderable list on the same page takes its own drops. Mitigation: the overlay shows only for drags holding files, never for one that began in the page, and a drop on an element that handles it (`[data-drop-target]`, editable content) is left alone; a story puts a DataTable and the page zone together.
- **R4. The app's states can contradict.** A row `saved` with no `href`, `uploading` at 100% for a minute, a `failed` with no reason. Mitigation: the development warnings in section 7.2; an uploading row without `progress` draws an indeterminate bar rather than a stuck one.
- **R5. `beforeunload` is unreliable.** Mobile Safari does not show it, and every browser shows its own words. Mitigation: recorded; the tray and the bar still say what is at risk on the page, and the docs say the warning is a last resort.
- **R6. Scroll padding and focus.** `scroll-padding-block-end` governs `scrollIntoView` in every engine, but whether a focused element that is already in view under the bar is scrolled clear differs, as 3c's correction 42 found for the bulk-action bar. Mitigation: the plan's SaveBar play focuses the last field under the bar in three engines and adds DataTable's two-frame scroll clear where an engine leaves it covered.
- **R7. The bottom edge on a short phone.** A tab bar, a save bar, the tray's bar and a toast can take a third of a 640px-tall screen. Mitigation: the tray's bar is 48px and the toasts sit above it only while they show; the `BottomEdge` story pins the stack at 375 by 667, and open question 3 holds the alternative if review finds the stack too tall.
- **R8. A date field in a grid.** React Aria's segments are editable spinbuttons whose arrows change values, inside a DataTable whose capture handler moves rows on J and K and between cells on the arrows. Mitigation: DataTable's guard already ignores editable targets; a play puts DatePicker in a cell and checks every key in its table in three engines.
- **R9. React Aria's strings.** DropZone's default label ("DropZone") and the segments' and calendar's announcements have no Persian, as 3a's to 3c's records say. The library names everything it draws through `labels`; React Aria's remaining strings stay English until a string table goes upstream.
- **R10. Sticky inside an element that scrolls.** A SaveBar in a holder whose ancestor sets `overflow` sticks inside that ancestor, as 3c's correction 68 found for a table's header. Mitigation: the docs say so, and the SidePanel and Dialog examples hold a SaveBar in their scrolling bodies, which is where it should stick.

## 18. Open questions

1. **Folders.** A folder dropped on a zone is refused as a wrong type (decided here, item 3). Google Drive and Dropbox take folders and keep their structure. Does the consumer need folders? If so, a later `acceptsDirectories` flattens a `DirectoryDropItem` into its files, with each file's path in the app's hands.
2. **A camera button on a phone.** FileButton takes `defaultCamera`, which makes the picker the camera. Does the consumer want "Take a photo" beside "Choose files" on a phone for receipts, as a second FileButton in its examples, or one button whose picker offers both (the browser's default)?
3. **The tray's bar and the save bar on a phone.** With both on a review page, the reader sees two docked bars above the tab bar. One alternative is a small uploads badge inside the save bar while a SaveBar shows. Recommended: keep them apart until the consumer's review page has been seen on a phone.
4. **Guarding client navigation.** Every library link (the rail, the tab bar, breadcrumbs, the tray's rows) navigates through `RouterProvider`'s `navigate`, so the library could offer a guard that wraps it and asks before leaving unsaved changes. The app's own Next `<Link>`s would bypass it, so the guard would be partial. Recommended: not in this batch; reconsider when Next offers a blocking API.
5. **A save shortcut.** Many editors take Mod+S for save. A SaveBar on the page could take it, at the cost of the browser's own Save page. Recommended: not by default; an app adds it with its own key listener, and the docs show one that calls the bar's action.
6. **Dogfooding PageHeader in the docs.** The parent spec's R8 says phase 5 replaces the docs header with the library's. PageHeader reproduces it here; replacing it in this batch adds a docs task and a baseline round for every docs page's header. Recommended: replace it in the batch after this, once the consumer has used PageHeader.
7. **`listBelow`'s second value.** 32rem is chosen from a phone held upright and the consumer's 1440px layout as reported. If the consumer's columns do not fit at 32rem, the value moves before the release; measuring its Transactions page beside the panel settles it.
