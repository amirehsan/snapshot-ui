# Documents: ProgressBar, FileDropZone, UploadTray, DatePicker, SaveBar, PageHeader and Breadcrumbs, Batch 4, Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give the first consumer's documents flow its parts, in the spec's build order: `ProgressBar`, a static part, Meter's sibling, determinate and indeterminate; `FileButton`, `FileDropZone` and `PageDropZone` on one acceptance check, whose first step is the spike that proves a drop, a paste and the drag counter in Chromium, WebKit and Firefox; `UploadList` and `UploadTray` with AppShell's new `floating` slot and the bottom edge's stacking order; `DatePicker` on the shared date frame, with the changed dot for a field with no label; `SaveBar`; `PageHeader` and `Breadcrumbs`; and the two DataTable follow-ups from 0.6.0, the `listBelow` prop and the bulk-action bar's More menu. Every part's CSS ships in `@snapshot-ui/core` (`progress-bar.css`, `file-drop-zone.css`, `upload-tray.css`, `date-picker.css`, `save-bar.css`, `page-header.css`, `breadcrumbs.css`, imported by `styles.css` after `side-panel.css`), every part has its own docs page, the upload tray page carries the Documents recipe, and the batch ships as one release: `@snapshot-ui/core` and `@snapshot-ui/react` 0.7.0. `@snapshot-ui/charts` goes to 0.1.4 by a patch changeset, since its `@snapshot-ui/core` peer (`workspace:^`) publishes as `^0.7.0`.

**Architecture:**

- **The app does the work; the parts say what is happening.** The library never reads a file's bytes, never sends one and never formats a size, a date or a count. A drop zone hands the app `File` objects and the reasons it refused the rest; the app uploads them and gives the tray each file's status, progress and words; the tray draws and announces (spec 4, ruling 5).
- **One acceptance check, three ways in.** A drop on the page, a drop or a paste on an inline zone and a choice through a button all run `acceptFiles` (`file-drop-zone/accept.ts`) against the same props and reach the app through the same `onFiles(accepted, rejected)` (rulings 1 and 2).
- **Long-lived parts live in the shell.** `UploadTray` is mounted once, in AppShell's new `floating` slot, outside `<main>`, from the app's root layout, which a client navigation keeps (ruling 6).
- **One bottom edge, measured by nothing a first paint waits on.** The tab bar, a save bar or a bulk-action bar, the tray and the toasts stack from the bottom through custom properties: the shell's `--app-shell-inset-block-end`, the root's `--toast-offset-block`, and two new ones, `--save-bar-offset` (declared from tokens, then written by a `ResizeObserver` after hydration) and `--upload-tray-offset` (written only once the tray draws, which it never does on the server) (spec 12).
- **Server where it can be.** `ProgressBar` and `PageHeader` import nothing from React Aria and stay server parts. The drop zones, the button, the tray and its list, `DatePicker`, `SaveBar` and `Breadcrumbs` are client modules, each with the server face spec 4's table states.
- **Strings are the app's.** Every file name, status reason, size, date, count and sentence is the app's string; the library writes its own words only through `labels`, English by default.
- Every task is one reviewable deliverable in the spec's build order, and a last task for the recipe, the guides, the changesets, charts' core requirement and the batch's design record.

**Tech Stack:** unchanged from batch 3c: pnpm 10.10, Turborepo 2.11, Node 24.5 or later, TypeScript 7 beside the TypeScript 6 API, Lightning CSS 1.33 with the browser floor Chrome 111, Safari 16.4 and Firefox 128, Stylelint 17, Tailwind CSS 4.3, React 19.3, react-aria-components 1.22.1 (on react-aria 3.53.1 and react-stately 3.51.0), `@internationalized/date` 3.12.4, lucide-react 1.55, tsdown 0.23, Vitest 5 with jsdom 30, Testing Library, axe-core 4.14, Storybook 10.6 with the a11y and Vitest addons, Playwright 1.64 (Chromium, WebKit and Firefox story projects), Next.js 16.4 on Fumadocs 16, Changesets 3.0, publint 0.3, `@arethetypeswrong/cli` 0.18 and size-limit 14. New: nothing. React Aria used for the first time: `FileTrigger`, `useDrop` with `isFileDropItem` and `isDirectoryDropItem` (or `DropZone`, as Task 2's spike decides, spec correction 5), and `DatePicker`. React Aria's `Breadcrumbs` is not used (spec correction 8).

**Spec:** `docs/specs/2026-10-16-documents-design.md`, approved, with the owner's twenty-five rulings in its section 13.1 taken as recommended and the answers in its section 13.3: (1) two drop zones and FileButton on one acceptance contract; (2) a partial drop accepts what passes and reports each refusal; (3) one tab stop in the inline zone, the button, which also takes a paste; (4) one drop look for every drag holding files, the check on the drop, and a missed drop that does nothing while a zone is mounted; (5) the app holds the uploads as controlled `items`; (6) the tray in AppShell's `floating` slot; (7) the bottom end corner, 28rem, the toasts above it; (8) a docked bar and a Sheet on a phone; (9) a plain `ul`; (10) three polite announcements; (11) a close that asks before cancelling; (12) `beforeunload` warnings on by default, no client navigation guard; (13) ProgressBar a static server part with the role by hand; (14) a 40% segment over 1.6s, slowed and never stopped under reduced motion; (15) DatePicker a popover on a phone; (16) the changed dot for an unlabelled field; (17) SaveBar sticky at the bottom of its holder; (18) always shown; (19) one Cancel, guarded while dirty; (20) PageHeader sticks only in the shell's header slot; (21) the current page as the last crumb; (22) one back link on a phone; (23) header actions wrap; (24) `listBelow: '40rem' | '32rem'`; (25) bulk actions as data with up to three promoted and a More menu. The answers: folders refused; FileButton takes `capture`; on a phone the tray's bar and the save bar stack, revisited after use; no client navigation guard; no Mod+S; the docs header moves to PageHeader in the next batch; `listBelow` keeps its two values; ProgressBar's ends follow Meter's `--radius-pill`, square under Square. Section 13.2 lists the twenty-two decisions made in the spec, followed here. The parent spec is `docs/specs/2026-10-10-snapshot-ui-design.md`; the design authority is `docs/design-system.md`, including Appendix B. Section numbers below are the documents spec's unless they say otherwise.

**Source app:** the private app this library was extracted from is never named. Its path is in the gitignored `.local/SOURCE.md`; no task opens `.local/`, and nothing it holds is copied into a committed file. The consumer is "the consumer" or "the first consumer".

**How this plan was made:** like the data table plan, this one carries no prototype-verified component code. Each task names its files, its exact public types, its numbered behaviors, its CSS where it is short or easy to get wrong, its tests and its docs, and the implementer writes the code under TDD. Code appears only where two good engineers would build a thing differently and one way is wrong: the acceptance check, the page zone's drag counter, the tray's announcements and the bottom edge's offsets. Every mechanism the plan relies on was read in the repository or in the installed packages on `feat/documents` at 1a1ad4b and is cited where it is used; React Aria's private modules are cited by their path under the package's `dist/private/`. Three behaviors were checked with a throwaway probe in Node 24 with `react-dom/server` (not committed): React Aria's `Breadcrumbs` writes the `ol` itself, with `aria-label="Breadcrumbs"`, and its last crumb's `Link` without `href` as `span[role="link"][aria-disabled="true"][aria-current="page"]`; `DropZone` writes its visually hidden button with `tabindex="0"`, `aria-label="DropZone"` and `aria-labelledby` its own id and the zone's text; and `FileTrigger` writes a hidden `input[type="file"]` with `accept` and `capture`, beside its child button. The contrast values were measured with `packages/core/scripts/contrast.js` against `tokens/tokens.json` (`paletteFor`, `composite`, `contrastRatio`). The two open pull requests that merge before this batch were read at their heads: #24 (`fix/patch-0.6.1`, 645f81d) and #25 (`fix/table-spacing-pagination`, 77ac766). Test counts are "the N tests this task adds"; the implementer records the real totals in the commit's verification.

**Branch:** `feat/documents`, from `origin/docs/documents-spec` at 1a1ad4b, which is `main` at 42fd2a8 (the 0.6.0 release, 2a5eafa, and a test-only Firefox fix, 42fd2a8) with the spec's commit on top. Everything batch 3c produced exists: `Meter` (`meter/Meter.tsx`, `meter.css`); `Button` with `isPending` and `pendingLabel`, `IconButton`, `Link` and `RouterProvider`; `Sheet`; `Tooltip`, `Menu`; `useConfirm` and `ConfirmDialog` (`dialog/useConfirm.tsx`, `ConfirmDialog.tsx:19-50`); the calendar parts (`calendar/CalendarParts.tsx`: `CalendarHeader`, `CalendarDays`, `CalendarPresets` reading `RangeCalendarStateContext` at `:198-241`, `useCalendarDates`, `DEFAULT_CALENDAR_LABELS`, `invalidDate`) and `iso.ts`; `DateRangePicker`'s frame and faces (`date-range-picker/DateRangePicker.tsx:199-228`); the field parts (`FieldHead`, `FieldChanged`, `useChangedDescription`, `Description`, `FieldError`, `Label`); `ToastRegion`'s status host (`toast/ToastRegion.tsx:137-146`); `AppShell` and `useAppShell` (`app-shell/AppShell.tsx:22-46,82-87,201-233`); `DataTable` with `BulkBar` (`data-table/BulkBar.tsx`) and its container queries (`data-table.css:482,548`); `isAnotherModalOpen` and `isUnderModal` (`overlay/useOverlayStack.ts:16-30`); `useHydrated`, `useWarnOnce`, `useControllableState`, `present`, `cx`, `mergeRefs`, `AriaName`, `AccessibleName`; `QUIET_MS` (`utils/quiet.ts`, 600); `focusOn` (`src/stories/focus.ts`); the shell fixture (`src/stories/shell-fixture.tsx`) and the viewports (`src/stories/viewports.ts`); the server-face, hydration, server-render, server-components and empty-parts suites; the visual harness's tags; and 1919 baselines (`git ls-files apps/storybook/tests/visual/__screenshots__ | wc -l` at 42fd2a8; #24 and #25 add none).

## Global Constraints

### Runtime and packaging

- Node `>=24.5`, `"packageManager": "pnpm@10.10.0"`, every package `"type": "module"`, ESM only.
- No new dependency. Every React Aria value and type comes from `react-aria-components`, which exports `FileTrigger` (`dist/types/exports/FileTrigger.d.ts`), `DropZone` (`DropZone.d.ts`), `useDrop`, `isFileDropItem`, `isDirectoryDropItem` and `DIRECTORY_DRAG_TYPE` (`dist/types/exports/index.d.ts:71`), `DatePicker`, `DatePickerStateContext`, `DateInput`, `DateSegment`, `Group`, `Calendar` and its grid parts (`DatePicker.d.ts`), `CalendarStateContext`, `VisuallyHidden`, `Toolbar`, `MenuTrigger`. The library never imports `react-aria`, `react-stately` or `@react-types/shared` directly.
- Both packages build with tsdown in `unbundle` mode under `tsconfig.build.json`, which turns on `isolatedDeclarations`: every exported function and constant declares its full type, return types included.
- `tsconfig.base.json` has `types: []`, so `process` is not typed. A development warning is `useWarnOnce(message)` (`utils/useWarnOnce.ts`), once per mount, in an effect, in every build. A static part cannot warn (it has no effect); ProgressBar draws a range it cannot use as empty and says nothing.
- **Versions.** Core and react stay a fixed group (`.changeset/config.json:5`), and the batch's minor changesets (Task 8) take them to 0.7.0, from 0.6.0 or from the 0.6.1 that #24's patch changesets may publish first. A patch changeset (`charts-core-peer.md`, Task 8) takes `@snapshot-ui/charts` from 0.1.3 to 0.1.4, whose core peer publishes as `^0.7.0`; 0.1.3's `^0.6.0` does not admit 0.7.

### React components

- Every source file that imports `react-aria-components` starts with `'use client';` (`packages/react/scripts/check-use-client.js` fails the build otherwise), and so does every `.tsx` under `src` that uses state, an effect, a ref callback with state, or a context. `packages/react/test/server-components.test.tsx` lists every static module (`STATIC_MODULES`, `:294`), and its last describe fails on any `.tsx` that is neither a client module nor listed.
- The static modules of this batch: `progress-bar/ProgressBar.tsx` and `page-header/PageHeader.tsx`, added to `STATIC_MODULES` and to the `STATIC` rows (`:90`). The client modules: `file-drop-zone/FileButton.tsx`, `file-drop-zone/FileDropZone.tsx`, `file-drop-zone/PageDropZone.tsx`, `upload-tray/UploadList.tsx`, `upload-tray/UploadTray.tsx`, `date-picker/DatePicker.tsx`, `calendar/DateFrame.tsx`, `field/FieldChangedMark.tsx`, `save-bar/SaveBar.tsx`, `breadcrumbs/Breadcrumbs.tsx` and `data-table/BulkMenu.tsx`. Pure `.ts` modules carry no directive and are imported only by client modules: `file-drop-zone/accept.ts`, `file-drop-zone/missed-drop.ts`, `upload-tray/counts.ts`, `upload-tray/useUploadAnnouncements.ts`, `utils/useBeforeUnload.ts`, `utils/useBottomBarOffset.ts` and `data-table/bulk-actions.ts`.
- **Lucide only in client modules**, as before: `Upload` (both zones), `Clock`, `ArrowUp`, `ScanText`, `CircleCheck`, `CircleAlert`, `CircleX`, `RotateCw`, `X` (the list's rows), `ChevronDown`, `ChevronUp`, `X` (the tray), `CalendarDays` (DatePicker), `CircleAlert` (SaveBar's error status), `ChevronRight`, `ChevronLeft` (Breadcrumbs), `X`, `Ellipsis` (the bulk-action bar). All are in lucide-react 1.55 (`dist/lucide-react.d.ts`). ProgressBar and PageHeader draw no icon.
- **Always controlled where the app owns the state.** The uploads (`items`), a DatePicker's `value` when given, SaveBar's `isDirty`, `isPending` and `status`, and DataTable's selection come from the app. The tray's collapsed state is controlled or uncontrolled, React Aria's way.
- **Names are the library's.** Every name the library writes ("Choose files", "Drop to upload", "Upload details", "Close", "Retry invoice.pdf", "Choose date", "Unsaved changes", "Cancel", "Saving", "Breadcrumbs", "Back to Documents", "More actions") comes from a `labels` object or a label prop, English by default and every one replaceable.
- `className` and `ref` go on the element each task names; `className` merges after the library's class through `cx`. Presence checks on rendered slots use `present()`, never `!= null`.
- **Server safety** (the consumer's rules): no `Intl` formatting and no `toLocaleString` in the library's own code, no `window`, `document` or `matchMedia` at render or import, no measurement for the first paint. A DOM read (a `ResizeObserver` entry, `getClientRects()`, `document.activeElement`) happens only in an event handler or an effect. `matchMedia` is read only in an effect, guarded (`typeof window.matchMedia === 'function'`), as `app-shell/AppShell.tsx` reads it; `ResizeObserver` likewise (`typeof ResizeObserver === 'function'`), since jsdom has none.
- Every id the library writes comes from `useId`, or from React Aria.
- `jsx-a11y` is in its strict config. A `paste` handler on the zone's box and the document listeners are not jsx-a11y's concern; if the rule flags the box's `onPaste`, the disable is one line with its reason: `// eslint-disable-next-line jsx-a11y/no-static-element-interactions -- a paste on the zone's button bubbles here (ruling 3); the button is the tab stop`.
- **No collection is drawn on the server in this batch.** #24's press-across-hydration helper (`utils/press-across-redraw.ts`) is for parts React Aria draws again after hydration (Tabs, a row's link); Breadcrumbs is written by hand (spec correction 8), the tray's list is a plain `ul` (ruling 9), and the bulk bar's Menu opens only after hydration, so no part here needs it.

### CSS

- Component CSS lives in `packages/core/src/components/<name>.css`, inside `@layer components`, imported from `src/styles.css` after `side-panel.css`, in this order: `progress-bar.css`, `file-drop-zone.css`, `upload-tray.css`, `date-picker.css`, `save-bar.css`, `page-header.css`, `breadcrumbs.css`. `file-drop-zone.css` draws the inline zone, the page overlay and FileButton's nothing (it is a Button); `upload-tray.css` draws the list and the tray.
- **Tokens only.** Stylelint's `snapshot-ui/token-only` forbids a literal color, a literal radius and any `box-shadow` that is not `none` or a `var()` (`packages/core/stylelint/token-only.js`). `z-index` is written only through a z token (`css.test.js:247-260`): the page overlay at `calc(var(--z-chrome) + 1)`, the tray and its narrow bar at `var(--z-chrome)`, the save bar at `calc(var(--z-header) - 1)` (the bulk-action bar's), PageHeader none of its own. Class names are kebab-case and never start with a Tailwind namespace; `file-drop-zone`, `page-drop-zone`, `upload-tray`, `upload-list`, `upload-row`, `progress-bar`, `date-picker`, `save-bar`, `page-header` and `breadcrumbs` are used by nothing in `apps/docs` or `packages` (spec 13.2 item 21; checked with a search at 1a1ad4b: only a story's `data-testid="page-header"` in `data-table/ReactAriaTable.stories.tsx:354`, which is not a class).
- **System colors** only inside `@media (forced-colors: active)` (`css.test.js:239-245`), and every file has a forced-colors block. This plan writes them in lowercase (`canvas`, `canvastext`, `linktext`, `highlight`); the files may follow the case their neighbors use.
- **States** are data attributes beside their native or ARIA twins: `:is(:hover, [data-hovered])`, `:is(:focus-visible, [data-focus-visible])`, `:is([data-disabled], [aria-disabled='true'])`, the zone's `[data-drop-target]`, a field's `[data-changed]`, `[data-invalid]` and `[data-unlabelled]`, the tray's `[data-collapsed]`, the progress bar's `[data-indeterminate]`, the current crumb's `[aria-current='page']`. Hover rules sit inside `@media (hover: hover)`.
- **The focus ring** is `outline: var(--focus-ring-width) solid var(--focus-ring-color)`, never ink (`css.test.js`).
- **Motion.** The determinate fill moves over 200ms; the indeterminate segment slides over 1.6s and over `calc(1.6s * 8 / 3)` under reduced motion (the spinner's 900ms to 2400ms, `spinner.css:33,52`), never still; the page overlay fades in over 120ms; the tray rises 8px and fades in over 200ms through `@starting-style`, which is above the floor and simply does not run there, as the toast's rise (`toast.css:1-6`). Each file with motion carries the reduced-motion block the shared test asks for (`css.test.js:226`).
- **Logical properties** throughout. What mirrors: the indeterminate slide (a `--progress-bar-slide` of 1 or -1 under `[dir='rtl']`, since `:dir()` is above the Chrome 111 floor), the breadcrumb chevrons (`scale: -1 1` under `[dir='rtl']`), the back link's chevron. What does not: the file name's extension stays at its end in either direction (`unicode-bidi: isolate` on its spans).
- **Breakpoints.** The tray's faces and the breadcrumb faces switch at `@media (width < 768px)` and `(width >= 768px)`, the `--breakpoint-sm` token written out, and their tests compare the text with `tokens.breakpoint.sm.value`, as `css.test.js:465-471` does. PageHeader's phone padding uses the same query. Container queries, which like `stat-tile.css` and `data-table.css` are widths and not tokens: the zone's box at `20rem` (`container: file-drop-zone / inline-size`), the save bar at `36rem` and `24rem` (`save-bar`), the table at `32rem` under `[data-list-below='32rem']` (`data-table`), and the bulk bar at `40rem` and `24rem` (`data-table-bar`).
- **The bottom edge** is written with custom properties only (spec 12, Task 3 and Task 5 below): no part measures anything for its first paint.

### Design rules

- **Theme axes:** light and dark, the three shapes, compact density. The zone's button, the tray's and rows' icon buttons, SaveBar's buttons and the bulk bar's X and More are 40px targets in every density; the tray's narrow bar is `--size-field` tall and never under 44px on a coarse pointer.
- **Typography:** weights 400, 450, 500 and 700 only. The progress label 500 and its value 450; the zone's hint 450 and its drop line 500; a row's name 500 and its status line 450; the tray's title 500; the save bar's message 450; the page title 500 at `--text-h2`; the description 450; a crumb 450 and the current crumb 500.
- **Reserved colors.** Signal orange appears nowhere: no part here asks for consent. Clay is SaveBar's Unsaved chip and the changed dot of a field with no label (spec correction 2), both meaning exactly unsaved. Error is a failed upload's icon and word, an invalid zone's edge and line, and SaveBar's error status. Success is a saved upload's icon and word. Warning is a needs-review upload's icon and word. Taupe is only a disabled zone's text, edge and icon, and a disabled DatePicker's segments. Slate is the hints, descriptions, the waiting, uploading and reading words, every reason line, the breadcrumb links and separators, and a progress value. State is never color alone: each upload status has a word and an icon; a changed field has its chip or its dot and hidden word; an invalid zone has its line; the current crumb has `aria-current` and its weight.
- **Surfaces:** the tray, its narrow bar, the overlay's card, SaveBar and the bulk-action bar are the float surface (`--color-float`, a 1px `--color-frame` edge, `--radius-surface`, `--shadow-float`), the toast's and Popover's. The zone draws no fill of its own. PageHeader's fill is the canvas at 80% with a blur, the docs header's.
- **Contrast records**, measured with `contrast.js` (light, then dark). Gated already (`CONTRAST_PAIRS`, `contrast.js:17-140`): ink, slate, link, clay, error, success and warning as text on canvas, lifted, float and raised, and the boundary against canvas and lifted. On float: success 7.44 and 6.34, warning 6.33 and 8.92, error 7.46 and 5.73, slate 5.49 and 6.94, ink 18.43 and 17.42, clay 7.04 and 6.82, link 5.86 and 5.46. Clay on raised (the changed dot on a field's fill) 7.04 and 6.02. The boundary, the zone's dashed edge, 3.38 and 5.34 on canvas, 3.45 and 5.21 on lifted (spec correction 6). Measured and recorded, not gated: ink on the 5% ink wash (the drop target) 14.70 and 17.41 over canvas, 16.11 and 15.25 over lifted; slate on the canvas at 80% (the header's fill) 4.84 and 7.26 over canvas, 4.93 and 7.22 over lifted, and 3.16 and 5.03 over solid ink, the worst case, which the 20px blur averages away before it is read (Task 6 records it). Light signal orange measures 2.87 on raised in light, under the 3:1 a graphic needs, which is why the dot is clay (spec correction 2). Each task's `contrast.test.js` describe cites the gated pairs and recomputes, to two decimals, every value its Appendix B record states.
- **Strings.** The library writes no date, size, count in a locale or list: the app passes every name, reason, progress label, value label, message, status and count through `formatCount`. React Aria's own strings (the date segments' and calendar's announcements) follow `I18nProvider` and have no Persian (risk R9).

### Docs site

- Component pages go in `apps/docs/content/docs/components/<slug>.mdx`, with sections, then `## Usage`, `## Props` (one `PropsTable` per type, each with a distinct `label`), `## Accessibility` (with a `Keys` table that states React Aria 1.22.1's behavior as the tests pin it, the library's handler marked; static pages have none), and `## Design rules` (`Rules`), each in a `Section`. Titles and icons: "Progress bar" `Loader`, "File drop zone" `FileUp`, "Upload tray" `Upload`, "Date picker" `CalendarDays`, "Save bar" `Save`, "Page header" `PanelTop`, "Breadcrumbs" `ChevronsRight` (all in lucide-react 1.55).
- `content/docs/components/meta.json`, `apps/docs/examples/index.ts`, the homepage footer's Components column (`apps/docs/app/(home)/home-page.tsx`) and both READMEs stay in the rail's alphabetical order: `breadcrumbs` after `bottom-tab-bar`; `date-picker` after `data-table`; `file-drop-zone` after `field`; `page-header` after `number-field`; `progress-bar` after `popover`; `save-bar` after `radio-group`; `upload-tray` after `typography` (the last). An example with hooks, handlers or a function prop is a client file; ProgressBar's, PageHeader's static examples and Breadcrumbs' plain trail are server files.
- A new page joins the completeness-guarded maps in `apps/docs/tests/components.spec.ts`: `LONG_TARGETS` (`:815`) or `NO_LONG_TEXT` (`:871`), and `SERVER_RENDERED` (`:985`). The loop there proves every page fits 320px and 375px with no sideways scroll and runs axe in light and dark. Forced-colors checks go in its `test.describe('forced colors')` (`:126`).
- The homepage catalog: a chip is a link exactly when its name is a page's title (`home.spec.ts:264-296`). "Date picker" (Task 4) and "Save bar" (Task 5) become links, and the linked-chip count goes from 22 to 23 and then 24. No other new page has a chip; "Media input" stays text.
- **URL recipes**, as before: `useSearchParams()` inside a `Suspense` whose fallback renders the first state, `router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false })` so a bare `?` is never written, and a `RouterProvider` whose `navigate` is `router.push(href, { scroll: false })`. The docs pages are statically generated, so an example's URL state is never in the server's HTML.
- **One page zone and one tray per docs page.** A docs page that shows inline zones mounts its page-zone example's `PageDropZone` only while a Switch, "Drop anywhere on this page", is on (off by default), so a drop has one meaning on the page (spec 13.2 item 9). Only the upload tray page's recipe mounts an `UploadTray`; every other tray picture is an `UploadList` in a Card.
- **End-to-end waits.** A test that measures or shoots an open sheet first waits for `data-entering` to leave it.

### Repo, commits and releases

- **The repo is public.** Never commit the source app's name, its company, its CMS, any client name or its class prefix, not even in a test or a story. `pnpm check:public` enforces this with the names in `.local/private-names.txt`.
- **Commits:** the exact Conventional message each task gives, with no body and no trailer of any kind (no Co-Authored-By), in the repo's style (`git log --oneline -40`). They never mention Claude or Claude Code. No em dashes, en dashes or emojis anywhere, in code, comments, docs or messages.
- **Never commit scratch files or screenshots.** Probes, spike notes and Playwright screenshots stay outside the repository or are deleted before `git add`; every task adds its files by path, never with `git add -A` or `git add .` (b6941a6 removed a probe screenshot committed by mistake).
- **Markdown is never formatted.** `.prettierignore` skips `**/*.md` and `**/*.mdx`; never run Prettier on a Markdown file by hand, above all never on `docs/design-system.md`, whose records are edited by hand only.
- **Before committing:** `pnpm format`, then every gate in the task's steps, then `pnpm verify` before every commit that touches code. Visual baselines change only through `pnpm --filter @snapshot-ui/storybook visual:docker`, on the owner's machine, once after Task 8 (owner action 2). A visual story renders a stable state: no hover, no pointer movement in its play; a play may focus by keyboard, type, press keys, call `element.click()`, or dispatch a drag event holding a `DataTransfer` (the drop look). Playwright's screenshots run with `animations: 'disabled'` (`apps/storybook/playwright.config.ts:20`), which stops the indeterminate slide at its first frame.
- **Tests:** unit tests in Vitest with `expectNoA11yViolations` on each state, **one test per state** through `it.each`, and no axe exemption beyond `MENU_ROW_A11Y`; a rule turned off anywhere else is scoped to one selector and carries its reason. **jsdom has no layout, no container queries, no `ResizeObserver`, no `DataTransfer`, no `DragEvent` and no `ClipboardEvent.clipboardData`**: a drop, a paste, a drag counter, a container switch, a sticky offset and a measured offset are Storybook plays in Chromium (tagged `no-visual`), and a drop, a paste or a key's play also runs in WebKit and Firefox (tags `webkit` and `firefox`). In jsdom a choice reaches FileButton through `userEvent.upload(input, files)` under `userEvent.setup({ applyAccept: false })`, since user-event otherwise filters the files by `accept` before the library's check sees them; a document listener is tested with a plain `Event` given a `dataTransfer` property by `Object.defineProperty`; and `ResizeObserver` is stubbed per test where a part writes an offset.
- **CI, and what it taught batch 3c.** CI runs four story browser projects side by side with the unit tests: `storybook`, `storybook-dark`, `storybook-webkit` (one file at a time) and `storybook-firefox` (`apps/storybook/vitest.config.ts:12-75`), on pull requests and on `main` only (`.github/workflows/ci.yml:5-8`). **WebKit and Firefox do not run on the implementer's machine here; their plays run in CI**, so each task pushes and reads the draft pull request's `storybook-webkit` and `storybook-firefox` results before it is done (owner action 1). On CI a story gets 30s and a unit test 15s (`apps/storybook/vitest.config.ts:11`, `packages/react/vitest.config.ts:16`), and a busy runner is slow: a play draws the least that proves its point (thirty rows, not sixty, as 006dfc4 learned), polls with `waitFor` for what follows a key rather than reading it at once, and puts the page's scroll back in `finally`. **Firefox can let a play's early focus go unheard** on a busy runner (42fd2a8): a play whose story is about the keys that follow focuses its control with `focusOn(element)` (`src/stories/focus.ts`), which focuses directly and polls until focus holds; a play that checks a press or Tab moving focus makes that move itself and waits for its result. **Every play that types is guarded**, so one that outlived its time limit cannot type into the next story: it sends each key through a local `press(keys)` that throws `new Error('The story has gone')` once its first element is no longer `isConnected` (`data-table/DataTable.stories.tsx`, `PageKeys`). The harness's modes (`apps/storybook/tests/visual/stories.spec.ts:34-52`): an untagged story is shot in five modes (light Rounded, dark Rounded, light Soft and light Square at 1280, and light Rounded at 375); `density` adds light Rounded compact; `viewport-phone` shoots the four theme and shape modes at 375 only, and `viewport-desktop` at 1280 only. Files are `components-<component>--<story>--<theme>-<shape>[-375][-compact].png`, where `<component>` is the story title's last segment lowercased with no separator (`Components/FileDropZone` is `filedropzone`). Each part also gets a `<Part>Mirrored` story in `packages/react/src/rtl/RightToLeft.stories.tsx` (title `Checks/Right to left`, tagged `no-visual`), wrapped in `I18nProvider locale="fa-IR"` and `dir="rtl"`. The CI visual job fails for a new story until the owner commits its baselines, as in every batch.
- **Changesets:** written in Task 8, one per part, minor, for `@snapshot-ui/core` and `@snapshot-ui/react` (spec 16): `progress-bar.md`, `file-drop-zone.md`, `upload-tray.md`, `app-shell-floating.md`, `date-picker.md`, `field-changed-mark.md`, `save-bar.md`, `page-header.md`, `breadcrumbs.md`, `data-table-list-below.md`, `data-table-bulk-actions.md`; and `charts-core-peer.md`, a patch for `@snapshot-ui/charts`.
- **Size limits:** an entry starts at spec 16's budget, measured without React Aria, Lucide and `@internationalized/date` (`"ignore": ["react", "react-dom", "react-aria-components", "lucide-react", "@internationalized/date"]`), is added before the three "watch only" entries at the end of `packages/react/.size-limit.json`, and is set by the repo's rule: the measured size rounded up to the next 0.5 kB, plus 0.5 kB. An entry measures everything its import pulls in, so a limit above the budget is recorded with its reason in the commit's verification, as 3c's SidePanel was.
- **Gates, in order, in every task:** the package builds, the core and react Vitest runs, the Storybook story tests, the docs build, typecheck and lint, the docs end-to-end run, `size`, `pnpm format`, `pnpm format:check`, `pnpm verify`. The end-to-end run needs port 3100 free (`lsof -nP -iTCP:3100 -sTCP:LISTEN` prints nothing); if another checkout holds it, run `DOCS_E2E_PORT=3504 pnpm --filter @snapshot-ui/docs test:e2e` after checking that port is free.

**Step 5, "Run everything"** (every task refers to these commands):

```bash
source /opt/nvm/nvm.sh
pnpm format
pnpm format:check
pnpm turbo run build lint typecheck test check:package --filter=@snapshot-ui/core --filter=@snapshot-ui/react
pnpm turbo run build --filter=@snapshot-ui/storybook
pnpm --filter @snapshot-ui/storybook exec vitest run --project=storybook --project=storybook-dark
pnpm turbo run build typecheck lint --filter=@snapshot-ui/docs
lsof -nP -iTCP:3100 -sTCP:LISTEN
pnpm --filter @snapshot-ui/docs test:e2e
pnpm --filter @snapshot-ui/react size
pnpm verify
pnpm check:public
```

`pnpm verify` runs the story projects through each package's `test` script, the WebKit and Firefox ones included where the machine has them; here they run in the pull request's CI.

### Merging main

Two pull requests against `main` merge before this batch's pull request:

- **#24, 0.6.1** (`fix/patch-0.6.1`): Tabs' tab stop in the server's HTML and the press-across-hydration helper `packages/react/src/utils/press-across-redraw.ts`; forced-colors fixes in ten parts (among them `calendar.css`, `date-range-picker.css`, `data-table.css`, `menu.css`, `pagination.css`); DataTable's 3% hover wash and granite slate in selected rows (`TableFace.tsx`, `ListFace.tsx`); Sidebar's server toggle names; the docs shell (`shell.css`, `docs-shell.tsx`); `css.test.js`, `contrast.test.js`, `.size-limit.json`, `server-render.test.tsx`, `docs/design-system.md`.
- **#25** (`fix/table-spacing-pagination`): Pagination's inner `pagination-box` container and `data-range`; DataTable's and StatTile's flex-item fallbacks; DataTable's two-line cell block padding `--data-table-pad-block` and the `data-table-cell-meta` class; `data-table.css`, `DataTable.stories.tsx`, `server-components.test.tsx`, `examples/index.ts`, `data-table.mdx`, `css.test.js`, `docs/design-system.md`.

Both touch files this batch touches. The rule:

1. At every task boundary, `git fetch origin main`. If #24 or #25 has merged since the last merge, `git merge origin/main` into `feat/documents` (a merge commit with git's own message; never a rebase, never a force-push), resolve, run Step 5 in full, and push before the next task starts. Conflicts in `css.test.js`, `contrast.test.js`, `server-components.test.tsx`, `components.spec.ts`, `examples/index.ts`, `.size-limit.json` and `docs/design-system.md` keep both sides.
2. **Task 4 prefers #24 merged first**, since DatePicker shares `date-range-picker.css`'s frame and `calendar.css`'s popover and #24 rewrites their forced-colors blocks; if #24 has not merged, Task 4 follows the files as they are and the merge reconciles them.
3. **Task 7 does not start until both have merged** and `origin/main` is merged into `feat/documents` (its Step 0): `listBelow` and the bar's overflow edit `data-table.css`, `DataTable.tsx`, `BulkBar.tsx` and `DataTable.stories.tsx`, which both pull requests change. If either is still open when Tasks 1 to 6 are done, the implementer reports and waits (owner action 3).

### The consumer's rules (its batch 4 request and "Rules every part must follow")

`'use client'` only on interactive parts; no `Intl` formatting and no `window` at render, and no first-paint measurement; no external request and no injected script; light and dark, all three shapes, right to left (the app has a Persian guide), comfortable and compact density; WCAG 2.2 AA including 2.5.7 and 2.5.8; anything that navigates goes through `RouterProvider`; everything exported from the `@snapshot-ui/react` index, with all the CSS in `@snapshot-ui/core/styles.css`. A documents flow keeps the document's identity and the review position in the URL; the uploads in flight are the one piece of state that outlives every page, so they live in the app's root layout, never in the URL.

## Review Focus

The input classes the spec implies that a part's ordinary tests would not exercise, most likely first. Each is pinned by a test in the task named.

1. **One check for every way in, in three engines.** A drop on the zone, a paste on its button, a drop on the page overlay and a choice through the button give `onFiles` the same accepted and refused files for the same input, in order, never both empty; a file with an empty MIME type falls to its extension; a folder is refused as `'type'`; the drop look shows for every drag holding files, since Safari exposes no types during a drag. Pinned by Task 2's spike and plays in Chromium, WebKit and Firefox, and `accept.test.ts`.
2. **A missed drop does nothing, and only while a zone is mounted.** A file dropped beside the zone, or on the rail beside the page overlay, never opens in the tab; after the last zone unmounts the page is the browser's again; a drop into an editable element or a native file input is left alone. Pinned in Task 2.
3. **The page overlay's lifetime.** It shows only for a drag holding files, never for a row or a tag dragged inside the page; it leaves on the drop, on `dragend` and when the drag leaves the window, through a counter that survives Firefox's `dragleave` on every child boundary; it stands down under a modal and for a second page zone. Pinned in Task 2.
4. **The tray speaks three things only.** The start of a batch, failures and needs-review gathered over `QUIET_MS`, and one summary once all have settled, never a percentage, never a row turning saved; a retry that starts at once hears no summary first; the same sentence twice is said twice. Pinned in Task 3 with fake timers.
5. **The tray outlives its page.** It is outside `<main>` in the shell's `floating` slot, keeps its collapsed state and its items across a client navigation, and gives focus to `<main>` when it leaves. Pinned in Task 3 and the recipe's end-to-end test in Task 8.
6. **The bottom edge.** The tab bar, a sticky bar, the tray and the toasts stack in that order at 375 and at 1280 with no measurement before the first paint, and a focused field is never under the save bar in three engines (WCAG 2.4.11). Pinned in Tasks 3 and 5 (`BottomEdge` stories, the `FocusClear` play).
7. **Server faces with no hydration warning.** DatePicker writes its frame, its button, `valueLabel` and its hidden ISO input on the server and React Aria's segments after; FileDropZone writes its label, both lines, its button and its hidden input; ProgressBar and PageHeader write everything; Breadcrumbs writes real `<a href>` links. All under `en-US`, `de-DE` and `fa-IR` in UTC and Asia/Tehran. Pinned in each task's server-face and hydration rows.
8. **The changed dot reaches every framed field.** An unlabelled changed TextField, TextArea, NumberField, Select, ComboBox, MultiSelect, DateRangePicker and DatePicker draws the clay dot and is described by a hidden "Changed", which leaves while invalid. Pinned in Task 4.
9. **The More menu reads the screen at the press.** Its items are the actions whose promoted buttons are not drawn when it opens, so a narrow bar's More holds every action and a wide one's the rest; `bulkActions` as a node is unchanged but for the Clear selection icon. Pinned in Task 7 in three engines.
10. **Right to left.** The overlay leaves the rail on the right, the tray sits bottom left, a file name keeps its extension at its end, the slide and the chevrons mirror, DatePicker writes Persian digits after hydration. Pinned in each task's `RightToLeft` story and `Mirrored` play.

## Task index

| Task | Deliverable | New baselines | Commit message |
| ---- | ----------- | ------------- | -------------- |
| 1 | `ProgressBar`, a static server part, `progress-bar.css`, its stories, page and Appendix B record | 21 | `feat: add ProgressBar` |
| 2 | The spike (a drop, a paste, the drag counter and a missed drop in three engines, its own commit), then the acceptance check, `FileButton`, `FileDropZone` and `PageDropZone`, `file-drop-zone.css`, stories, page and record | 49 | `test: prove the file drop zone's drop, paste and drag counter in three engines`, then `feat: add FileDropZone, PageDropZone and FileButton` |
| 3 | `UploadList` and `UploadTray`, AppShell's `floating` slot, the tray's bottom-edge offsets and the toasts lifted above it, `upload-tray.css`, stories, page and record | 39 | `feat: add UploadList and UploadTray, and AppShell's floating slot` |
| 4 | The shared date frame, `DatePicker` with single-day presets, `date-picker.css`, and the changed dot for every framed field with no label, stories, page and records | 42 | `feat: add DatePicker, and mark a changed field that has no label` |
| 5 | `SaveBar` with its guard, pending state, status and unload warning, `--save-bar-offset`, the scroll clear, `save-bar.css`, the `BottomEdge` stories, page and record | 52 | `feat: add SaveBar` |
| 6 | `PageHeader` (static) and `Breadcrumbs` (by hand, with the phone's back link), `page-header.css` and `breadcrumbs.css`, stories, pages and records | 40 | `feat: add PageHeader and Breadcrumbs` |
| 7 | After merging `origin/main`: DataTable's `listBelow`, the bulk-action bar's data form with promoted buttons and a More menu, `selectAllMatching`, Clear selection as an icon, the bar's `--save-bar-offset` | 20 (and about 21 changed) | `feat: keep the data table's table face beside a panel, and move its bulk actions into a More menu` |
| 8 | The Documents recipe, the guides, the twelve changesets, charts' core requirement, and the batch's "Bottom edge" record | 0 | `docs: add the documents recipe and guides, and require core 0.7 in charts` |

Order is the spec's build order (section 1): 1 makes the bar the upload rows draw; 2 proves the drag events before anything is built on them, then makes the three ways in; 3 follows the files it accepts to their fate, in the shell; 4 makes the date field a review grid needs and marks its changes; 5 puts a save bar under that grid and completes the bottom edge; 6 makes the page's header and trail; 7 fixes the table beside a panel once #24 and #25 are in; 8 names what 1 to 7 made and releases it. Every commit builds: no task imports a part a later task makes. Task 5's `BottomEdge` stories use Task 3's tray; Task 6 updates Task 2's page-zone example to put its FileButton in a PageHeader.

## Spec corrections

Mismatches found while reading the spec against the repository, the installed packages, the measurements and the owner's answers, numbered in order, each naming the task that resolves it and its evidence; those marked **choice** are design decisions. A correction found while implementing is added after the last, and the records in `docs/design-system.md` cite corrections by their numbers. None changes an owner's ruling.

1. **`capture`, not `defaultCamera` (Tasks 2 and 8; choice).** The owner's answer to open question 2 names the option `capture`, the HTML attribute's name, which React Aria's `FileTrigger` writes from its `defaultCamera` prop (`dist/private/FileTrigger.mjs`: `capture: defaultCamera`). `FileButtonProps` and `FileDropZoneBaseProps` take `capture?: 'user' | 'environment'` in place of the spec's `defaultCamera`, and both pass it to `FileTrigger`'s `defaultCamera`; FileDropZone takes the same name because it hands it to its own FileButton. The examples pair "Choose files" with a "Take a photo" FileButton (`capture="environment"`, `acceptedFileTypes={['image/*']}`) shown only under `(hover: none) and (pointer: coarse)` by the example's own class, since a desktop browser ignores `capture` and opens the file picker.
2. **The changed dot is clay (Tasks 4 and 5; choice).** Spec 8.3, 9.3 and 15 call the Changed chip's dot light signal orange. The chip's dot is `currentcolor` (`field.css:119-128`), which is clay (`field.css:101-108`), and light signal orange measures 2.87 on the raised fill in light, under the 3:1 a graphic needs (design record, "Six colors added": 2.53 to 2.87 on the light surfaces). The unlabelled field's dot is clay, the color that means exactly unsaved, 7.04 and 6.02 on raised (gated as clay on raised); the changed edge stays light signal orange (`input.css:66-68`). SaveBar's chip is the field's chip unchanged: clay with its clay dot.
3. **How every framed field draws the dot (Task 4).** Spec 8.3 writes the dot "once in `field.css` for every field with a frame". Two facts stop a stylesheet doing it alone: TextField's frame is the `<input>` itself (`text-field/TextField.tsx:110`, `.input` on the input), which draws no pseudo-element, and TextField, TextArea and Select write no `data-unlabelled` (only MultiSelect, SearchField, ComboBox, NumberField and DateRangePicker do). So each framed field with `isChanged` (TextField, TextArea, NumberField, Select, ComboBox, MultiSelect, DateRangePicker, DatePicker) writes `data-unlabelled` when it has no label and renders one internal `FieldChangedMark` while changed and unlabelled: `span.field-changed-mark` holding `changedLabel`, drawn by `field.css` as the 6px clay dot on the frame's first line with its text clipped, as `.toast-status-host` clips (`toast.css:11-20`), named in the control's `aria-describedby` through `useChangedDescription`, and gone while the field is invalid by any cause, as `FieldHead` reads `FieldErrorContext` (`field/FieldHead.tsx:33-40`). The frame's inline-end padding grows by the dot and a part step while it shows, so typed text never runs under it.
4. **A placeholder segment is slate, labelled or not (Task 4).** Spec 8.3 says taupe under a visible label. DateRangePicker's shipped rule is slate either way, since axe measures an empty segment as text (`date-range-picker.css:64-69`, de8178d); DatePicker shares it, and taupe stays for a disabled field's segments.
5. **`useDrop` with no drop button, rather than `DropZone` (Task 2; choice, settled by the spike).** Ruling 3 takes React Aria's hidden drop button out of the tab order, which `DropZone` offers no prop for (`dist/private/DropZone.mjs`: `useDrop({ ...props, hasDropButton: true })`). The server probe shows the cost of setting `tabIndex` through a ref: the button is `tabindex="0"` in the server's HTML, so it is a tab stop until hydration, and it is named `aria-label="DropZone"` in React Aria's English. `useDrop` with `hasDropButton: false`, exported by `react-aria-components` (`index.d.ts:71`), puts the drop props on the library's own box with no hidden button, and the library's paste listener (ruling 3) needs nothing of `DropZone`'s clipboard props. The spike proves both in three engines and the task builds on `useDrop` unless the spike finds a difference in what reaches `onDrop`; R2's fallback becomes the build.
6. **The boundary's measured contrast (Task 2).** Spec 6.3 gives 3.06 on canvas and 3.36 on lifted for the zone's dashed edge. `contrast.js` measures the boundary at 3.38 on canvas and 3.45 on lifted in light, 5.34 and 5.21 in dark; the record states these.
7. **The overlay's description is on the float card (Task 2).** Spec 15 measures "slate on the canvas at 92% (the overlay's description)". The description sits in the float card at the overlay's center (spec 6.3), so it is slate on float, 5.49 and 6.94, gated; the 92% fill holds no text. Over solid ink, slate on that fill would be 4.11 in light, which is why no text sits on it.
8. **Breadcrumbs are written by hand, on the library's Link (Task 6; choice).** Spec 10.1 and 10.2 build on React Aria's `Breadcrumbs` and `Breadcrumb`. The server probe and the source show three conflicts with the spec: React Aria's `Breadcrumbs` is the `ol` itself and names it with its own English "Breadcrumbs" (`react-aria` `dist/private/breadcrumbs/useBreadcrumbs.mjs`: `'aria-label': ariaLabel || strings.format('breadcrumbs')`), so the library's `nav` and the list would both be named; its last crumb's `Link` is a disabled `span[role="link"][aria-disabled="true"]` (`dist/private/Breadcrumbs.mjs`, `isDisabled: isDisabled || isCurrent`), where ruling 21 wants text; and it is a collection, which React Aria draws again after hydration, the redraw #24 had to carry presses across for Tabs. A trail has no keyboard model beyond Tab. So `Breadcrumbs` writes `nav.breadcrumbs[aria-label]` holding `ol.breadcrumbs-list` of `li.breadcrumbs-item`, each a library `Link` and the last a `span.breadcrumbs-current[aria-current="page"]`, reading its `Breadcrumb` children's props; `BreadcrumbsProps` no longer extends React Aria's (it drops `items`, `onAction`, `isDisabled` and `dependencies`) and `BreadcrumbProps` is `{ href?: string; children: string; className?: string }`. It stays a client module, since it renders `Link`.
9. **The page zone asks whether any modal is open (Task 2).** Spec 6.2 stands it down by `isUnderModal` of the workspace. PageDropZone renders nothing until a drag, so it holds no element to ask about; it asks `isAnotherModalOpen()` (`overlay/useOverlayStack.ts:16-18`) at each `dragenter`. A page zone inside a modal is not a pattern the docs show.
10. **The tray's column is the toasts' expressions (Task 3).** Spec 7.4 writes the tray's inset as `--spacing-inset` and its width as `min(28rem, 100vw - 2 * var(--spacing-inset))`. The toast region uses `var(--overlay-inset)` (which is `--spacing-inset`, `overlay.css:16`) and `min(28rem, calc(100vw - 2rem))` (`toast.css:25-29`); the tray writes the same two expressions, so the two stay one column if either changes.
11. **Focus after the tray leaves, outside a shell (Task 3; choice).** Spec 7.3 sends it to the shell's `mainId`. `useAppShell()` throws outside an AppShell (`AppShell.tsx:82-87`), and the tray may be mounted outside one (spec 7.3). The tray reads the shell's context through an internal `useOptionalAppShell()` (exported from `AppShell.tsx`, not from the package) and focuses `document.getElementById(mainId)`; outside a shell it focuses the first `main` element when it has a `tabindex`, and otherwise leaves focus where the browser puts it, which the docs say.
12. **The root's scroll padding reads the tab bar's reserve from `--toast-offset-block` (Task 5).** Spec 9.2 adds "the shell's bottom reserve" to the root's `scroll-padding-block-end`. That reserve, `--app-shell-inset-block-end`, is declared on `.app-shell` (`app-shell.css:14-17,116-119`), which the root cannot read. The root's copy of the tab bar's height is `--toast-offset-block`, declared on `:root:has(.tab-bar)` under 1024px (`tab-bar.css:187-188`); `save-bar.css` writes `scroll-padding-block-end: calc(var(--toast-offset-block, 0px) + var(--save-bar-offset))` on `:root:has(.save-bar)`.
13. **`--save-bar-offset` is written on the root and on the shell (Task 5).** `save-bar.css` declares it from tokens on both `:root:has(.save-bar)` and `.app-shell:has(.save-bar)` (spec 12). A measured height written only on the root does not reach the shell's own declaration, which the tray inside the shell reads; `useBottomBarOffset` writes the measured value as an inline custom property on both the root and the closest `.app-shell`, and removes both when the bar unmounts.
14. **`checkVisibility()` is above the Safari floor (Task 7).** Spec 11.2 reads which promoted buttons are drawn with `checkVisibility()`, which Safari ships from 17.4, above the 16.4 floor, and jsdom lacks. `bulk-actions.ts` exports `isDrawn(element)`, `element.getClientRects().length > 0`, which is false for an element under `display: none` in every engine.
15. **FileDropZone's head is not `FieldHead` (Task 2).** `FieldHead` always renders a Changed chip and React Aria's `Label`, which belongs inside a React Aria field (`field/FieldHead.tsx`, `field/Label.tsx`). The zone is no React Aria field and holds no value, so it writes `div.field-head` holding the library's `Label` with `elementType="span"` and an id, and its root is a `group` named by it.
16. **A refused folder carries an empty File (Task 2).** `FileRejection` holds a `File`, and a dropped folder is a `DirectoryDropItem` with a `name` and no `File`. The refusal carries `new File([], item.name)` with reason `'type'`, and the item's entries are never read (spec 13.2 item 3); the docs say so.
17. **React Aria clears the input at the press (Task 2).** Spec 6.2 clears FileButton's input after each choice. `FileTrigger` already clears it as the button is pressed, before the picker opens (`dist/private/FileTrigger.mjs`: `if (inputRef.current?.value) inputRef.current.value = ''`), so the same file chosen again fires again; the library adds nothing, and a unit test pins it.
18. **Telling the data form of `bulkActions` from a node (Task 7).** `ReactNode` includes arrays, so `bulkActions?: ReactNode | readonly DataTableBulkAction[]` cannot be told apart by `Array.isArray`. The data form is an array whose every entry is a plain object, not a React element (`!isValidElement(entry)`), with a string `id`, a string `label` and a function `onAction`; anything else is a node, drawn as 0.6.0 drew it.
19. **ProgressBar's limit, its props table and two guards (Task 1).** The size entry measured 653 B, so the rule sets 1.5 kB, above spec 16's 1 kB budget, as Meter's 795 B did; since the commit carries no body, the design record states it. The docs page's props table is `Pick<ProgressBarProps, ...>` of the bar's own props, as Meter's page picks, rather than `ProgressBarBaseProps`, which would list every inherited DOM attribute. Two guards the plan does not state: a bar that the types forbid but an empty label reaches (no label, no `aria-label`, no `aria-labelledby`) shows its value text even under `showValueLabel={false}`, so the fallback name points at an element that is drawn; and a `value` that is not a finite number is the start of the range.
20. **The slide animates the logical inset (Task 1, review fix round).** The Global Constraints ("Logical properties") and Task 1's CSS mirror the slide by a `--progress-bar-slide` of -1 under `[dir='rtl']` multiplied into a `translate`. The fill is placed by `inset-inline-start`, which follows the track's own direction, while the sign followed any rtl ancestor, so a nested `dir="ltr"` inside a Persian page, or `dir="auto"` either way, slid the segment backward, from the end toward the start (a Chromium probe at e492904: the nested ltr segment started at 160px to 320px of 400px and moved left). The keyframes animate `inset-inline-start` from `-40%` to `100%`; the custom property and the `[dir='rtl']` rule are gone. `ProgressBarMirrored` pauses each slide through `getAnimations()[0]`, sets `currentTime` to 0 and to half the duration, and checks the segment against its track (wholly before the start, then 30% in, since ease-in-out is half done at half time) for ltr, rtl, a nested opposite `dir` each way and `dir="auto"` reading Persian and Latin; it is tagged `webkit` and `firefox`, so the logical keyframes are proven in three engines in CI. An animated inset is laid out each frame rather than composited; for one 8px segment the cost is small.
21. **The indeterminate segment rests before the track (Task 1, review fix round).** Task 1 Step 7 and the record say Playwright's `animations: 'disabled'` holds the segment at its first frame. It cancels an infinite animation instead, so the segment's own rule draws it, and that rule kept the determinate fill's `inset-inline-start: 0`: a stopped bar showed a 40% segment at the start and read 40% done. The indeterminate rule writes `inset-inline-start: -40%`, the first keyframe's place, so with animations off (Playwright's screenshots, a reader's `animation: none`) the track reads empty, as Step 7 expects; the `Indeterminate` play cancels the slide and checks. No committed baseline changes, since none exist yet for ProgressBar. Reduced motion still slows the slide to `calc(1.6s * 8 / 3)` and never stops it (probed at 4.26667s, moving).
22. **An indeterminate bar that nothing names is "Loading" (Task 1, review fix round; choice).** Behavior 2 says the value's id keeps the bar from being unnamed, but an indeterminate bar has no value text unless one is given, so a `label=""`, which `AccessibleName<'label'>` admits, left it with no name; and a `valueLabel=""` drew an empty value that named and valued the bar with nothing. A blank `valueLabel` now counts as absent (the percentage stands while determinate), and an indeterminate bar with no non-blank `aria-labelledby`, `aria-label`, label or value text takes `aria-label="Loading"`, Spinner's own default (`spinner/Spinner.tsx`), English and replaced by any name of the caller's. A warning is not possible, since a static part has no effect (Global Constraints, "Runtime and packaging"). A label node that renders nothing and an `aria-labelledby` that points at nothing are beyond what the bar can see, so the docs and the record no longer say "never unnamed". Unit rows pin an empty label while indeterminate and `valueLabel=""`, with axe on each.
23. **The headless bar's value text, the lifted surface and NVDA's tones (Task 1, review fix round).** The track measures 1.28 to 1.43 against its surface, a cue and not a boundary, so the page's usage and Design rules and the record say a bar with no head needs its value shown in text beside it, as the upload row's status line does. The fill on lifted (a Card holding the upload list) joins the contrast test and the record: 13.88 in light and 12.19 in dark, the track 1.28 and 1.43. The page and the record say the bar "speaks nothing as it moves" rather than "announces nothing", so NVDA's progress beeps, the reader's own setting, are not recorded as a failure in owner action 4.
24. **Spike results (Task 2), and correction 5 decided.** `DropSpike.stories.tsx` (3256b3b, its facts recorded in 3f9f2b6), every story green in Chromium, WebKit and Firefox in CI. (a) `UseDropFiles`: a box with `useDrop({ hasDropButton: false })` turns drop target on a synthetic files `dragenter`, its `dragover` and `drop` have their default prevented, and the native transfer holds both files at the drop, in all three. (b) `DropZoneFiles`: `DropZone` with its hidden button's `tabIndex` set to -1 by a ref is skipped by Tab and takes the drop, in all three; its button is still named "DropZone" in React Aria's English. (c) `PasteOnButton`: a paste on a focused button reaches the box's `onPaste` with its file and the box prevents its default, and a paste of text is left alone, in all three. (d) `Counter`: the document counter reads 1, 2, 1, 2, 1, 2, 1 over a parent and two children in Firefox's order, returns to zero on the last leave, and resets on a drop and on `dragend`; `types` includes `'Files'` on every synthetic files `dragenter`, in all three. (e) `MissedDrop`: a document listener's `preventDefault()` holds on a files `dragover` and `drop` beside the box and is left off a text field, a file input and a drag of text, in all three. (f) `DrawnMidDrag`: a target drawn by a document `dragenter` takes the enter, over and drop that follow, in all three, for events a script dispatches; a real drop runs the microtasks between listeners, which a dispatched one does not, and there the page zone's own capture listener took the overlay away before its drop handler ran, which no play could see (correction 30). How each engine builds the events: `DragEvent`'s constructor keeps its `dataTransfer` in all three; `ClipboardEvent`'s keeps `clipboardData` in Chromium and WebKit and drops it in Firefox, so the paste plays define it on the event; a script's `DataTransfer` reports `effectAllowed` `'none'` in all three, and Chromium and WebKit ignore its setter, where React Aria cancels a drag that allows nothing, so the plays define `effectAllowed` as `'all'`, as a drag from another app allows. **The one difference in what reaches `onDrop`:** React Aria reads a dropped file only through `webkitGetAsEntry()` and skips an item with no entry, and Chromium gives a file a script made no entry (WebKit and Firefox give one), so React Aria's `onDrop` holds no file for a synthetic drop in Chromium while the native transfer holds both. **Decision:** `useDrop` with no drop button, as correction 5 says, for the drop look, the operation and the event plumbing; the files are read from the native transfer during the drop by the library's `filesOf` (`accept.ts`): each file item in order, a folder named as a directory by its entry becoming `new File([], name)` (correction 16), an item with no entry read with `getAsFile()`, and `dataTransfer.files` where the items hold no file. A play's drop and a real one then take one path, and a paste is read the same way.
25. **The page zone counts in the capture phase (Task 2).** The plan's counter listens on the document in the bubble phase. `useDrop` stops the propagation of every drag event its target takes (`dist/private/dnd/useDrop.mjs`: `e.stopPropagation()` in each handler), and the overlay is such a target, drawn under the pointer: the enter on the overlay would go uncounted and the leave of the element under it would bring the count to zero, so the overlay would leave as soon as it came. The four listeners are added with `capture: true`, so the count sees every event, and a drop on the overlay resets it before the overlay's own handler runs (the hide that went with the reset is deferred by correction 30, and the count is a set by correction 31). The missed-drop hold stays in the bubble phase, so a drop a part took is never seen by it. Pinned by `DragCounter` and `OverlayDrop` in three engines and by the jsdom counter test that enters the overlay.
26. **A disabled zone writes `aria-disabled` (Task 2).** The zone's disabled look is taupe text, which axe measures as text (3.78 in dark) unless the element is disabled. The group writes `aria-disabled="true"` beside `data-disabled` while disabled, which is what it is, and the stylesheet matches both, `:is([data-disabled], [aria-disabled='true'])`, as a state's data attribute and its ARIA twin.
27. **Two internal modules and one helper the plan does not list (Task 2).** `file-drop-zone/useFileDrop.ts`, a client module (`'use client'`, since it imports `useDrop`), is the drop target both zones share: `useDrop` with no drop button, the capture-phase note of whether the drag holds files (React Aria's `DragTypes` does not say), and the drop handler that reads the transfer with `filesOf` before React Aria's. `accept.ts` also exports `filesOf` and `holdsFiles`, and `acceptFiles` takes a third argument, the set of files that stand for folders, refused as `'type'` before any other check. The stories share `src/stories/drag.ts`, story code only, which builds the events as the spike found each engine takes them.
28. **The zone's status line (Task 2).** The status is mounted empty and, like the field counter, clipped while empty so it takes no row and no gap; its line is keyed by the round of drops, so a second refusal of the same count is said again. A zone given an `errorMessage` shows it only while invalid, by its own refusals or the app's `isInvalid`.
29. **Size limits above the budget, and the docs' touch class (Task 2).** `{ FileDropZone, FileButton }` measured 2.23 kB and `{ PageDropZone }` 1.56 kB, so the rule sets 3 kB and 2.5 kB, above spec 16's 2.5 kB and 1.5 kB: each carries the check, the transfer reader, the missed-drop hold and the drop hook's glue; the design record states it. The receipt example's "Take a photo" button shows only under `(hover: none) and (pointer: coarse)` through a `touch-only` class added to `apps/docs/app/site.css`, and the example writes its refusal line for one file in the singular through `labels.rejected` (no longer needed after correction 33).
30. **A real drop on the page overlay reaches `onFiles` (Task 2, review fix round).** The capture-phase `drop` listener of correction 25 hid the overlay at once. A browser dispatching a real drop runs the microtask checkpoint after each listener, and React 19 commits a state set outside its own handlers in a microtask, so the overlay unmounted between the document's capture listener and React's root listener: the overlay's drop handler never ran, the missed-drop hold prevented the drop, and the files were lost in silence. Every play and jsdom test passed, since a script's `dispatchEvent` runs every listener before any microtask. Found with the DevTools protocol's `Input.dispatchDragEvent` holding real files from disk, the only harness that runs Chromium's own drag and drop processing. The `drop` listener now clears the set and hides the overlay in a `setTimeout` of 0, after the drop has been dispatched; `dragend` still hides it at once, and a new enter cancels the pending hide. `apps/docs/tests/components.spec.ts` gains `test.describe('a real drop')`, Chromium only, through `page.context().newCDPSession(page)`: a real PDF, an empty file and a folder dropped on the receipt field, and a PDF, a program and a folder dropped on the page overlay, each reaching its example with its refusals, the overlay gone and the page not navigated, so this cannot regress. The page example now shows its refusals in a `page-zone-refused` line. The design record's spike paragraph no longer says a target drawn mid-drag takes the drop without saying it was a dispatched one (correction 24).
31. **The overlay never sticks (Task 2, review fix round).** The counter of correction 25 counted enters and leaves, and an element removed from the document under the pointer, such as a toast that leaves, never gets its `dragleave`, so the count never came back to zero and the overlay stayed after the drag left the window, until a reload. The zone keeps a set of the elements the drag has entered, as React Aria's `useDrop` does, and forgets every element no longer `isConnected` on each enter and leave, so the last leave hides it. A backstop for a leave that goes missing in an engine (an Escape cancel the engine never reports): a `pointermove` or `pointerdown` on the document, which no engine sends during a native drag, hides it, except a touch, since a second finger may hold an iPad's drag. A heartbeat timeout on `dragover` was considered and not taken: how often an engine repeats `dragover` while the pointer rests is the platform's, and a heartbeat that missed would hide the overlay under a file held still and lose its drop. The real-drop tests pin a drag cancelled as with Escape and a toast removed mid-drag; `NeverSticks` pins the set and the backstop in three engines.
32. **A file dropped on a form's text field is held (Task 2, review fix round).** The missed-drop hold of behavior 9 exempted every `input`, `textarea` and editable element, so a file dropped on a text field beside a zone opened in the tab and lost the form. A native file input is always exempt; a text field, a text area or editable content is exempt only while the drag also holds `text/plain` or `text/uri-list`, which it inserts; a checkbox, a radio, a range and every other input that takes no text is never exempt. An editor that takes files prevents the default itself, and the hold never touches a prevented event. A held `dragover` sets `dropEffect` to `'none'`, so the pointer shows that nothing drops there, beside a zone and on a disabled one. `missed-drop.ts` exports `isTextEntry`, which the page zone's paste reads (correction 39).
33. **The default refusal line is singular for one file and names the reason (Task 2, review fix round).** `labels.rejected` took the count only as `formatCount` wrote it, a string, so the default could not tell one from many and said "1 files were not added". It is now `(count: number, formatted: string, rejected: readonly FileRejection[]) => string`, and the default says "1 file was not added" or "3 files were not added" and, where every refusal shares one reason, why, as the GOV.UK Design System and Carbon state it: "its type is not accepted", "it is too large", "it is empty", "too many files at once" (with "their" and "they are" for several). The receipt example drops its own singular line.
34. **The overlay is drawn in the closest AppShell (Task 2, review fix round).** Behavior 13 rendered the overlay in place, so a `position: fixed` overlay inside an ancestor with `transform`, `filter`, `backdrop-filter` or `contain` was confined to that ancestor's box, and PageHeader's fill has a backdrop blur (Task 6) where the plan puts FileButton. While shown, the zone renders a hidden mark in place and portals the overlay into the mark's closest `.app-shell`, or the body outside one; the shell declares `--app-shell-sidebar`, which the overlay inherits, so it still clears the rail. The overlay copies the theme, shape and density scope of its mark through `copyScope` (`overlay/useOverlayScope.ts`) and writes the mark's computed direction as `dir`. The docs' snippet mounts PageDropZone at the page's root, and the JSDoc and the page say why. `OverlayLeavesItsHolder` pins it under a blurred, transformed holder.
35. **Forced colors: a disabled zone in GrayText, and the drop target over invalid (Task 2, review fix round).** A disabled zone's edge, hint and icon stayed `canvastext`, while its button is GrayText. They are `graytext` in the forced-colors block. And invalid outranked the drop target's `highlight` edge in forced colors too, where the error color is gone and the edge is the only sign of a drag: the forced-colors rule for the drop target is as specific as the invalid rule and after it, and solid. The docs' forced-colors test drags over an invalid receipt field.
36. **`capture` guidance, extensions beside MIME types, and the receipt's words (Task 2, review fix round).** On iOS and Android `capture` makes a file input camera-only, so a FileDropZone given `capture` has a button that can no longer choose a PDF. The JSDoc of both props and the page prefer a second FileButton with `capture` beside the zone, as the receipt example has, and say to list an image type. They also advise listing an extension beside each MIME type, since Windows reports a `.csv` as `application/vnd.ms-excel`; the examples and the snippet do. The receipt example says "PDF, JPG, PNG or HEIC, up to 10 MB", as it accepts. Owner action 4 adds Safari's Cmd+V paste on a focused button and what iOS does with a HEIC photo.
37. **A stale comment on `filesOf` (Task 2, review fix round).** It said a file a script puts in a transfer has no entry in Chromium and WebKit; only Chromium gives it none (correction 24).
38. **A click on the box opens the picker (Task 2, review fix round; choice).** Behavior 5 said a press on the box's empty space does nothing. Carbon's drop container and react-dropzone open the picker on a click anywhere on the box, a larger pointer target, and the owner's standing instruction is the industry's practice. A click on the box outside the button is forwarded to the button's input (cleared first, as React Aria clears it at a press), so the box adds no tab stop and no role, and the button stays the keyboard's one stop (ruling 3); the box takes `cursor: pointer`, and not while disabled. jsx-a11y's two rules are disabled on the box's line with that reason. `BoxClickOpensPicker` pins it in three engines.
39. **A page with a page zone takes a paste of files anywhere (Task 2, review fix round; choice).** As GitHub and Slack do, a `paste` on the document holding files, with focus outside a text field (`isTextEntry`), not already prevented and with no modal open, runs the page zone's check and reaches `onFiles`, and has its default prevented; a paste into a text field and a paste with no files are left alone. `PasteOnPage` pins it in three engines; the docs' Keys table says so. After the round, `{ FileDropZone, FileButton }` measures 2.61 kB and `{ PageDropZone }` 2.17 kB, within the 3 kB and 2.5 kB limits of correction 29, which stay.
40. **Both tray faces carry the `overlay` class (Task 3).** Spec correction 10 has the tray write `var(--overlay-inset)`, which `overlay.css` declares on `.overlay` and `.overlay-scrim` alone, and `css.test.js` forbids any other file to declare it. The tray is not portaled, so it is in no overlay root: the wide face and the phone's bar each carry `overlay`, as the toast region does (`toast/ToastRegion.tsx`), which also restates the page's type on them. No other rule of `overlay.css` matches them.
41. **The phone's bar is a region named by `labels.region` (Task 3; choice).** Spec 7.3 names the bar's region by its title, and spec 7.1's `labels.region` ("Uploads", "the tray's landmark name") is otherwise used by nothing. A region named by the same words as its only button is read twice ("Uploading 2 of 5, region, Uploading 2 of 5, button"), and a title that counts renames the landmark as files arrive. The bar's region is `aria-label={labels.region}`; the wide face stays a `section` named by its title (`aria-labelledby`), as spec 7.3 says, and its sheet a dialog titled by it.
42. **The phone's bar never under the 40px target (Task 3).** The plan sizes the bar `block-size: var(--size-field)` with a 44px floor on a coarse pointer. `--size-field` is 36px in compact density with a fine pointer, under `--size-target`, the floor "nothing interactive drops below" (`tokens.json`); the bar, which is its button, also takes `min-block-size: var(--size-target)`. It is 48px in comfortable density, 40px in compact, 44px on a coarse pointer.
43. **What the title and the announcements count (Task 3; open question 7 as settled).** The default title while anything is in flight is "Uploading N of M", where M is every row and N the settled rows plus the one in hand, capped at M, so one settled of five reads "Uploading 2 of 5"; then "M uploads complete". A batch is the set of rows in flight when it starts, joined by every row that arrives or changes while it runs; `started` speaks with the counts of the batch's rows still listed, and says nothing if none is still in flight by then, since the summary follows; `settled` counts the batch's rows still listed; `attention` counts the rows that turned failed or needs review since it last spoke and are still so when it speaks, so a row retried meanwhile is not reported. A row that arrives already failed with no batch running is said as an attention. The defaults write English singulars for a count of one.
44. **Three small API facts (Task 3).** `UploadTrayProps` omits the list's `className` and `ref` as well as its labels and names: `className` goes on both faces, and there is no `ref`, since the tray draws two faces and a sheet. The list carries `tabindex="-1"` from the server on, so a list whose last row leaves in a page takes focus rather than the body, and never rings (`outline: none` on `:focus`). The name's element writes `dir="auto"`, so a Latin name on a Persian page keeps its extension at its own end and a Persian name has it at its left; the list follows focus through `focusin` and `focusout` listeners on itself, and the tray through one on the document while it draws.
45. **The status host and the sheet's close (Task 3).** The tray's host writes `data-react-aria-top-layer="true"`, as the toasts' host does, so a failure said while the phone's sheet or the Cancel all question is open is not hidden from a screen reader with the page. The one `matchMedia` read (behavior 9) is at the sheet's close: a sheet left open while the window widened past 768px closes onto the wide face, whose fold button takes focus once the sheet has left, since the bar it opened from is hidden; a few animation frames are waited for focus to fall, as after the Cancel all question, whose dialog plays its exit before the tray it asked from can give focus to `<main>`.
46. **Size limits above the budget (Task 3).** `{ UploadList }` measured 2.43 kB and `{ UploadTray }` 7.48 kB, so the rule sets 3 kB and 8 kB, above spec 16's 2.5 kB and 4.5 kB: the list carries ProgressBar, IconButton and Link, and the tray adds Sheet (1.79 kB alone), ConfirmDialog through `useConfirm` (2.99 kB alone) and the announcements. `{ AppShell }` measured 934 B with the `floating` slot and keeps its 1.5 kB. The design record states it.
47. **Concentric corners (Task 3, owner rule of 2026-10-17).** The owner's new rule for every part: a rounded element inside a rounded element takes the outer radius less the gap between them, the outer's border and the smaller side of its padding, `max(0px, calc(var(--holder-radius) - var(--holder-border) - var(--holder-pad)))`, never a copy of the parent's, square once the gap reaches the radius, and subtracted again at each level, from the radius and spacing tokens so it holds in Rounded, Soft and Square. `upload-tray.css` names three holders in those properties: the panel (`--radius-surface`, 1px, no padding, since the body has none), the phone's bar (`--radius-pill`, 1px, none) and the sheet (`--radius-stadium`, 1px, none, since the rows run to its sides). The list subtracts its holder's gap as `--upload-list-radius`, and each row its smaller padding, the block's 0.625rem, as `--upload-row-radius`, which the row's icon buttons and its bar's track and fill take; the header's buttons take the panel's radius less its edge and the header's part step; the bar's button, which had `border-radius: inherit`, takes the pill less its edge. In Rounded that is 15px for the header's buttons, 13px for a row's buttons and bar (the 8px bar still reads as a pill), 998px for the bar's button and 29px for a row's buttons in the sheet; in Soft 3px, 1px, 11px and 5px; in Square 0. With no holder named, as for a list an app draws in its own box, `--upload-list-radius` is invalid and the rows' parts keep their own `--radius-pill`; an app's rounded holder names its own corner, as the docs example's and the stories' Card do. `css.test.js` pins the holder properties and every nested formula, and the `Open`, `PhoneBar` and `Statuses` plays read the computed radii. The repo-wide rule lands in CLAUDE.md and `docs/design-system.md` by a separate pull request.

## Owner actions

These need the owner's accounts, machine or devices, so the implementer reports them rather than doing them.

1. **The draft pull request for CI.** A draft pull request from `feat/documents` to `main` was opened with this plan's commit, so every push runs `storybook-webkit` and `storybook-firefox`; it stays a draft until Task 8 is green. Its visual job fails for each new story until the baselines are committed (action 2).
2. **Docker, for the baselines, once after Task 8.** `pnpm --filter @snapshot-ui/storybook visual:docker` needs Docker and the `mcr.microsoft.com/playwright:v1.64.0-noble` image. The owner runs it once, after Task 8, on their machine, and commits the new and changed files in one commit, `test: add the documents baselines`: Task 1, 21; Task 2, 49; Task 3, 39; Task 4, 42; Task 5, 52; Task 6, 40; Task 7, 20 new and about 21 changed (every DataTable picture with the bulk-action bar in view: `components-datatable--{all-selected,bar-keyboard-focus,selected-right-to-left}--{light-rounded,dark-rounded,light-soft,light-square}.png`, `components-datatable--phone-selected--{light-rounded-375,dark-rounded-375,light-soft-375,light-square-375}.png` and the five `components-datatable--selected--*.png`, and any other the run reports with the bar in view, each checked by eye). That is 263 new baselines, 2182 in all (1919 at 42fd2a8; #24 and #25 add none). Each task's Step 7 lists its files.
3. **Merges.** Merge #24 and #25 into `main` before Task 7 starts (Global Constraints, "Merging main"). Merge `feat/documents` into `main` by pull request once Task 8 is green and the baselines are in; then merge the "Version Packages" pull request the release workflow opens, which takes `@snapshot-ui/core` and `@snapshot-ui/react` to 0.7.0 from the eleven minor changesets and `@snapshot-ui/charts` to 0.1.4 from its patch changeset, whose core peer becomes `^0.7.0`. All three packages have their trusted publisher, so the release workflow publishes with provenance and no hand step.
4. **Devices and screen readers, before the release** (risks R1, R5, R7, R9). With VoiceOver on macOS and NVDA: the zone reads as a group named by its label with one button, "Choose files", described by its rules, and a refusal is spoken politely once; the overlay is never announced; the tray reads as a region named by its title, its fold button's expanded state, each row's link, status word, reason and buttons ("Retry invoice.pdf"), and its three announcements, and how often; a progress bar reads its name and value when reached, and nothing while it moves; DatePicker's segments, its button "Choose date" and the calendar; an unlabelled changed field in a grid reads "Changed" after its name; the save bar reads as a group named by its message, its status politely, and the discard question as an alert dialog; the trail as a navigation landmark with the current page, and on a phone the one back link. On a real iPhone and an Android phone: the zone shows no drag hint; "Take a photo" opens the camera and the photo reaches `onFiles`; a HEIC photo from the library with an empty type passes when `.heic` is listed, and whether iOS hands it over as HEIC or converts it to a JPEG (which it may do when the input's `accept` lists no HEIC type), each passing the receipt field; in Safari on macOS, Cmd+V with focus on the zone's button adds a copied file, and so does Cmd+V on a page with a page zone; the tray's bar sits above the tab bar and above a save bar, opens its sheet, and the sheet closes on a link and on a swipe; a focused field scrolls clear of the save bar; `beforeunload` (which iOS Safari does not show, R5). On iPadOS: a file dragged from the Files app into Safari onto the zone and onto the page overlay. Record each result in its Appendix B section; until then the records say "not yet verified".

## Open questions

Settled in this plan as the recommendation, and worth the owner's eye. **Settled by the owner, 2026-10-16:** all seven as recommended. Breadcrumbs are written by hand (1); `capture` goes on FileDropZone too, handed to its button (2); `useDrop` over React Aria's `DropZone` unless Task 2's spike shows a reason (3); the changed dot is clay (4); the new Clear selection X icon shows also when `bulkActions` is a node, for consistency, accepting the about 21 changed pictures (5); toasts lift above a SaveBar on wide screens too (6); and the tray's "started" announcement counts the files in the batch that just started (7).

1. **Breadcrumbs by hand** (spec correction 8). Recommended as written; the alternative keeps React Aria's `Breadcrumbs` and accepts a list named twice, a current crumb read as a dimmed link, and #24's press helper on every crumb.
2. **`capture` on FileDropZone too** (spec correction 1). The owner named it for FileButton; the zone passes it to its own button under the same name. Recommended; the alternative is no camera option on the zone, where an app needing the camera puts a FileButton beside it.
3. **`useDrop` rather than `DropZone`** (spec correction 5). Recommended unless the spike finds a difference; the cost is React Aria's keyboard drag and drop between parts, which no consumer uses for files.
4. **The dot in clay** (spec correction 2). Recommended, since light signal orange fails 3:1 as a graphic on the light fill; the alternative is the spec's color with a 1px ink ring to reach 3:1, which adds a second mark to the field.
5. **The node form of `bulkActions` changes its pictures** (Task 7). The spec puts the new Clear selection icon at the start of every bar, so about 21 existing DataTable baselines change. Recommended as the spec says; the alternative keeps the tertiary "Clear selection" text button while `bulkActions` is a node, which changes no picture but draws two bars two ways.
6. **Toasts lift above a save bar on a wide screen too** (spec 12). The save bar is in its form's column and the toasts in the end corner, so on a wide screen they rarely meet; one sum for every width keeps the stack one rule. Recommended; the alternative adds `--save-bar-offset` to the toasts only under 768px.
7. **What the tray's `started` counts.** It speaks `QUIET_MS` after a batch starts, with the counts at that moment, so a drop of five files in quick succession says "Uploading 5 files" once. Recommended; the alternative counts only the first drop.

---

### Task 1: ProgressBar

**Goal:** a static progress bar, Meter's sibling: a label and a value text in Meter's head, Meter's 8px track, an ink fill that moves to each new value over 200ms, and an indeterminate segment that slides over 1.6s and never stops. The WAI-ARIA `progressbar` role is written by hand on the track, valued while determinate and unvalued while indeterminate, never live. It imports nothing from React Aria and renders in a server component. Implements spec 5, rulings 13 and 14, section 13.2 items 5 to 7, section 13.3 item 9, and the `progress-bar` page and record.

**Files:**

- Create: `packages/react/src/progress-bar/ProgressBar.tsx`, `packages/react/src/progress-bar/index.ts`
- Modify: `packages/react/src/index.ts`, `packages/react/.size-limit.json`
- Test: `packages/react/src/progress-bar/ProgressBar.test.tsx` (create), `packages/react/test/server-components.test.tsx` (`STATIC` rows, `STATIC_MODULES`), `packages/react/test/empty-parts.test.tsx` (a new describe, `an empty documents part slot`, which later tasks add to)
- Create (stories): `packages/react/src/progress-bar/ProgressBar.stories.tsx`; Modify: `packages/react/src/rtl/RightToLeft.stories.tsx` (`ProgressBarMirrored`)
- Create: `packages/core/src/components/progress-bar.css`; Modify: `packages/core/src/styles.css` (after `side-panel.css`)
- Test: `packages/core/test/css.test.js`, `packages/core/test/contrast.test.js`
- Create: `apps/docs/content/docs/components/progress-bar.mdx`, `apps/docs/examples/progress-bar-basic.tsx`, `apps/docs/examples/progress-bar-indeterminate.tsx`
- Modify: `apps/docs/content/docs/components/meta.json`, `apps/docs/examples/index.ts`, `apps/docs/app/(home)/home-page.tsx` (the footer's "Progress bar" after "Popover")
- Test: `apps/docs/tests/components.spec.ts`
- Modify: `packages/core/README.md`, `packages/react/README.md` ("Progress bar" after "Popover")
- Modify: `docs/design-system.md` (`## ProgressBar` appended to Appendix B after `## SidePanel`)
- Create (Docker step): 21 baselines, listed in Step 7. None changes.

**Interfaces:**

- Consumes: `cx`, `present`, `AccessibleName`; the tokens `--spacing-part`, `--text-small` and its line height and weight, `--color-ink`, `--color-slate`, `--color-frame`, `--radius-pill`, `--font-sans`.
- Produces, exported from `@snapshot-ui/react`: `ProgressBar`, `ProgressBarProps`, `ProgressBarBaseProps`, spec 5.1's types unchanged.

```ts
// No directive: a server part.
export function ProgressBar(props: ProgressBarProps): ReactElement;
```

- Later tasks rely on: `ProgressBar` with `aria-label` and no head in an upload row (Task 3).

**Behavior:**

1. **Markup, in DOM order.** `div.progress-bar` (the rest props, `className` merged after, `ref`), holding `div.progress-bar-head` only while it has something to show (a present `label`, or the value shown), with `span.progress-bar-label[id]` and `span.progress-bar-value[aria-hidden="true"]`; then `div.progress-bar-track[role="progressbar"]` holding `span.progress-bar-fill`. The track carries `data-indeterminate` while indeterminate.
2. **The name**, exactly as Meter's (`meter/Meter.tsx`, the `named` and `name` logic): a non-blank `aria-labelledby`, else a non-blank `aria-label`, else the label's id, else the value's id, so the bar is never unnamed. The caller's `aria-describedby` moves to the track.
3. **Values while determinate.** `aria-valuemin={minValue}`, `aria-valuemax={maxValue}`, `aria-valuenow` clamped to them, `aria-valuetext` the value text. A range with `maxValue <= minValue` draws an empty track and reports `minValue`, with no warning (a static part has no effect).
4. **The default value text** is the percentage in ASCII digits, `${String(Math.round(((clamped - minValue) * 100) / (maxValue - minValue)))}%`, never `Intl`, so the server and the browser write the same; `valueLabel` replaces it in the head and in `aria-valuetext`.
5. **Indeterminate.** None of the four values; `showValueLabel` defaults to false; a `valueLabel` shown on purpose (`showValueLabel`) describes the track through `aria-describedby` on the value's id, since `aria-valuetext` is withheld.
6. **The fill's size** is `--progress-bar-value` on the track's inline `style`, the percentage with at most three decimals (Meter's `percent`), so the stylesheet draws it and forced colors can redraw it. Indeterminate writes no `style`.
7. **Never live.** No `role="status"`, no `aria-live`; the part that owns the work speaks (spec 13.2 item 6).
8. **Static.** No directive, no state, `useId` its one hook; it renders under React's server build.

**CSS**, the whole of `progress-bar.css`:

```css
/*
 * ProgressBar: work getting done, derived in docs/design-system.md ("ProgressBar"). One object with Meter: the
 * head is Meter's row, the label at the small step at 500 in ink and the value slate in tabular figures at the
 * line's end; the track is Meter's 8px of the frame color at the pill radius, square under Square; the fill is
 * ink at the same radius, moving to a new value over 200ms. Indeterminate, a 40% segment slides from the inline
 * start to the end over 1.6s, the skeleton's rhythm; under reduced motion the determinate move stops and the
 * slide slows by the spinner's ratio, 900ms to 2400ms, and never stops, since a still segment reads as an amount.
 * The slide's direction is a custom property, -1 under [dir='rtl'], since :dir() is above the browser floor.
 */
@layer components {
  .progress-bar {
    display: grid;
    gap: var(--spacing-part);
    min-width: 0;
    font-family: var(--font-sans);
    color: var(--color-ink);
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  .progress-bar-head {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    column-gap: var(--spacing-part);
    font-size: var(--text-small);
    line-height: var(--text-small--line-height);
    overflow-wrap: anywhere;
  }

  .progress-bar-label {
    min-width: 0;
    font-weight: 500;
    color: var(--color-ink);
  }

  .progress-bar-value {
    min-width: 0;
    margin-inline-start: auto;
    font-weight: var(--text-small--font-weight);
    font-variant-numeric: tabular-nums;
    color: var(--color-slate);
  }

  .progress-bar-track {
    --progress-bar-slide: 1;

    position: relative;
    height: 0.5rem;
    overflow: hidden;
    border-radius: var(--radius-pill);
    background-color: var(--color-frame);
  }

  [dir='rtl'] .progress-bar-track {
    --progress-bar-slide: -1;
  }

  .progress-bar-fill {
    position: absolute;
    inset-block: 0;
    inset-inline-start: 0;
    inline-size: var(--progress-bar-value, 0%);
    border-radius: var(--radius-pill);
    background-color: var(--color-ink);
    transition: inline-size 200ms ease;
  }

  .progress-bar-track[data-indeterminate] .progress-bar-fill {
    inline-size: 40%;
    transition: none;
    animation: progress-bar-slide 1.6s ease-in-out infinite;
  }

  /* From wholly before the track's start to wholly past its end: the segment is 40% of the track, so the track
     is 250% of the segment. */
  @keyframes progress-bar-slide {
    from {
      translate: calc(-100% * var(--progress-bar-slide)) 0;
    }

    to {
      translate: calc(250% * var(--progress-bar-slide)) 0;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .progress-bar-fill {
      transition: none;
    }

    .progress-bar-track[data-indeterminate] .progress-bar-fill {
      animation-duration: calc(1.6s * 8 / 3);
    }
  }

  @media (forced-colors: active) {
    .progress-bar-track {
      outline: 1px solid canvastext;
    }

    .progress-bar-fill {
      background-color: canvastext;
    }
  }
}
```

**Tests, written first:**

- `ProgressBar.test.tsx`:
  - `it('puts the progressbar role on the track, with the label in the head')`
  - `it('values the track while determinate: min, max, now clamped, and the value text')` (`value={140}` reports 100; `value={-5}` reports 0; `minValue={10} maxValue={20} value={15}` writes "50%")
  - `it('writes the default value text as an ASCII percentage, rounded to a whole number')` (`value={33.333}` writes "33%", under `I18nProvider locale="fa-IR"` too)
  - `it('takes valueLabel in the head and as aria-valuetext, hidden from the head itself')`
  - `it('writes no value attributes while indeterminate, and describes the track by a valueLabel shown on purpose')`
  - `it('draws an empty track and reports minValue when maxValue is not above minValue')`
  - `it('names the track in every branch: aria-labelledby, aria-label, the label, else the value text')`
  - `it('draws no head with an aria-label and showValueLabel false')`
  - `it('sets --progress-bar-value on the track only while determinate')`
  - `it('is never a live region')`
  - `it('passes className, ref and the rest props to the root, and aria-describedby to the track')`
  - `it.each(AXE_CASES)('has no axe violations %s')`: labelled at 45%; `aria-label` with no head; with a `valueLabel`; indeterminate with a label.
  - type tests with `// @ts-expect-error`: no name at all (no `label`, `aria-label` or `aria-labelledby`); `value` as a string.
- `server-components.test.tsx`, `STATIC` rows: `['ProgressBar', <ProgressBar label="Uploading" value={45} />, ...]` and `['ProgressBar indeterminate', <ProgressBar aria-label="Reading" isIndeterminate />, ...]`, with their markup written as the Meter rows write theirs; `STATIC_MODULES` gains `'progress-bar/ProgressBar.tsx'`.
- `empty-parts.test.tsx`, `describe('an empty documents part slot')`: `it('draws no label span for a ProgressBar given an empty label and an aria-label')`.
- `css.test.js`:
  - In `describe('src/styles.css')`, `it('imports the documents files after the data files, in order')`: `progress-bar.css` after `side-panel.css`, and `file-drop-zone.css`, `upload-tray.css`, `date-picker.css`, `save-bar.css`, `page-header.css` and `breadcrumbs.css`, each checked only once it exists, follow in that order.
  - `describe('src/components/progress-bar.css')`: `it('draws the head as Meter draws its own')`; `it('draws an 8px frame track at the pill radius and an ink fill at the same radius')`; `it('sizes the fill by --progress-bar-value and moves it over 200ms')`; `it('slides a 40% segment over 1.6s, mirrored by --progress-bar-slide under [dir=rtl]')`; `it('stops the move and slows the slide to 8/3 of 1.6s under reduced motion, never to none')`; `it('outlines the track and fills with canvastext in forced colors')`.
- `contrast.test.js`, `describe('the progress bar')`: `it('cites ink and slate on canvas, lifted and float, which the gate holds')`; `it('measures ink against the frame track, recorded and not gated')` (the fill against the track as it composites on canvas and on float, both modes, stated in the record).
- Stories, `ProgressBar.stories.tsx`, title `Components/ProgressBar`, each in a box `width: min(28rem, 100%)`:
  - `Default` (tags `['density']`): "Uploading invoice.pdf" at 45.
  - `States`: a column at 0, 45 and 100, one with `valueLabel="1.2 of 4 MB"`, and one indeterminate labelled "Reading receipt.jpg".
  - `NoHead`: `aria-label="Uploading invoice.pdf"` at 60 in a 20rem box, the upload row's use.
  - `RightToLeft`: `dir="rtl"` in `I18nProvider locale="fa-IR"`, "در حال بارگذاری فاکتور" with `valueLabel="۴۵٪"`, and an indeterminate bar.
  - `no-visual`: `Values` (play asserts the role, the four values and the clamping), `Indeterminate` (play asserts no `aria-valuenow` and the computed `animation-duration` `1.6s`).
- `RightToLeft.stories.tsx`, `ProgressBarMirrored`: play asserts the fill's right edge is the track's right edge at 45.
- Docs end-to-end, `components.spec.ts`: `LONG_TARGETS['progress-bar'] = ['.stage .progress-bar-label']`; `SERVER_RENDERED['progress-bar'] = ['.stage .progress-bar-track[role="progressbar"]']`; in `test.describe('forced colors')`, `test('a progress bar keeps its track outline and fill')`.

**Docs:**

- `progress-bar.mdx`, title "Progress bar", description "Work getting done: how far an upload has come, or that a reading is under way.", icon `Loader`. Sections: `## Determinate` (`progress-bar-basic`: a label and a value; `valueLabel` in the app's words, "1.2 of 4 MB"), `## Indeterminate` (`progress-bar-indeterminate`: work of unknown length, such as reading a document), `## Usage` (static: a server component renders it; never a live region, so say what matters once in your own status, as the upload tray does; the default value text is ASCII, so a Persian page passes `valueLabel` in its digits; a meter measures against a limit, a progress bar measures work getting done), `## Props` (table "ProgressBar props", `ProgressBarBaseProps`), `## Accessibility` (the role on the track, named by the label; values while determinate, none while indeterminate, which is how the role says "unknown"; not live), `## Design rules` (dos: name what is being done, give the value in your words when a percentage says too little; donts: never announce each step, never a progress bar for a wait shorter than a moment, never signal orange).
- Examples: both are server files.
- `docs/design-system.md`, `## ProgressBar`: one object with Meter (the head, the 8px track, `--radius-pill` round in Rounded and Soft and square under Square, the owner's answer, spec 13.3 item 9); the ink fill; 200ms; the 40% segment, 1.6s, and why it never stops (the spinner's rule); `calc(1.6s * 8 / 3)` under reduced motion; the slide's direction property; why the role is on the track; why it is never live; the ASCII default; forced colors; the measured pairs.

**Steps:**

- [ ] **Step 1: Write the failing tests** listed above, stories included.
- [ ] **Step 2: Run them and watch them fail**

```bash
source /opt/nvm/nvm.sh
pnpm turbo run build --filter=@snapshot-ui/core --filter=@snapshot-ui/react
pnpm --filter @snapshot-ui/core exec vitest run test/css.test.js test/contrast.test.js
pnpm --filter @snapshot-ui/react exec vitest run
pnpm --filter @snapshot-ui/storybook exec vitest run --project=storybook --project=storybook-dark ProgressBar
pnpm turbo run build --filter=@snapshot-ui/docs
lsof -nP -iTCP:3100 -sTCP:LISTEN
pnpm --filter @snapshot-ui/docs test:e2e
```

Expected: the core run FAILS the new describe (no file) and the import-order test; the React run FAILS to import `./ProgressBar`, and the server-components run fails on the new rows; the Storybook run fails to import the story file; the end-to-end run FAILS the completeness guard (`+ "progress-bar"`) and the forced-colors test.

- [ ] **Step 3: Write the component, the CSS, the import, the stories, the examples, the page, the lists, the footer link and the record.** Add the size-limit entry `{ "name": "import { ProgressBar } from \"@snapshot-ui/react\"", "path": "dist/index.js", "import": "{ ProgressBar }", "ignore": ["react", "react-dom", "react-aria-components", "lucide-react", "@internationalized/date"], "limit": "1 kB" }`, measure, and set the limit by the rule.
- [ ] **Step 4: Run the tests and watch them pass** (the commands of Step 2). Expected: all pass: about 8 core tests, about 15 ProgressBar tests, two `STATIC` rows and a module row, the empty-parts row, and the stories and the mirrored check in Chromium and dark. The build's `check-use-client` line reports no new client module.
- [ ] **Step 5: Run everything** (the Step 5 commands). Expected: every gate green; one more static page; `ProgressBar` within its limit; `pnpm verify` exits 0, its root tests confirming both READMEs list the page.
- [ ] **Step 6: Commit and push** (owner action 1 has opened the pull request; this task adds no WebKit or Firefox play).

```bash
git add "apps/docs/app/(home)/home-page.tsx" apps/docs/content/docs/components/meta.json apps/docs/content/docs/components/progress-bar.mdx apps/docs/examples/index.ts apps/docs/examples/progress-bar-basic.tsx apps/docs/examples/progress-bar-indeterminate.tsx apps/docs/tests/components.spec.ts docs/design-system.md packages/core/README.md packages/core/src/components/progress-bar.css packages/core/src/styles.css packages/core/test/contrast.test.js packages/core/test/css.test.js packages/react/.size-limit.json packages/react/README.md packages/react/src/index.ts packages/react/src/progress-bar packages/react/src/rtl/RightToLeft.stories.tsx packages/react/test/empty-parts.test.tsx packages/react/test/server-components.test.tsx
git commit -m "feat: add ProgressBar"
git push origin feat/documents
```

- [ ] **Step 7: Visual baselines** (owner action 2, after Task 8). Expected: 21 new files and no changed file: `components-progressbar--default--{light-rounded,dark-rounded,light-soft,light-square,light-rounded-375,light-rounded-compact}.png` and `components-progressbar--{states,no-head,right-to-left}--{light-rounded,dark-rounded,light-soft,light-square,light-rounded-375}.png`. What to look at: an 8px track in the frame color with an ink fill to 45%, round in Rounded and Soft and square in Square; the head as Meter's; the indeterminate segment at its first frame, before the track's start, so the track reads empty; in right to left the fill grows from the right.

---

### Task 2: FileButton, FileDropZone and PageDropZone

**Goal:** first, the spike risks R1 and R2 require: prove in Chromium, WebKit and Firefox that a drop holding files reaches the library's handler through React Aria's `useDrop` with no drop button (and, for the record, through `DropZone` with its hidden button's `tabIndex` set to -1), that a paste on the zone's focused button reaches the zone's listener with its files, that a document-level counter of `dragenter` and `dragleave` returns to zero across child boundaries, that a missed drop's default is prevented, and that a drop target drawn mid-drag takes the drop. Then the parts: the one acceptance check; `FileButton`, React Aria's `FileTrigger` around the library's `Button`; `FileDropZone`, the inline field with one tab stop, paste, the drop look, refusals in a polite line and the touch rule; and `PageDropZone`, the overlay that exists only while files are dragged over the page. Implements spec 6, rulings 1 to 4, section 13.2 items 2 to 4 and 8 to 10, section 13.3 items 2 and 3, spec corrections 1, 5 to 7, 9, 15 to 17, risks R1 to R3, and the `file-drop-zone` page and record.

**Files:**

- Create (spike, its own commit): `packages/react/src/file-drop-zone/DropSpike.stories.tsx` (title `Checks/Drop spike`, every story `no-visual`, `webkit`, `firefox`), as `data-table/ReactAriaTable.stories.tsx` was for 3c
- Create: `packages/react/src/file-drop-zone/accept.ts`, `missed-drop.ts`, `FileButton.tsx`, `FileDropZone.tsx`, `PageDropZone.tsx`, `index.ts`
- Modify: `packages/react/src/index.ts`, `packages/react/.size-limit.json`
- Test: `packages/react/src/file-drop-zone/accept.test.ts`, `missed-drop.test.ts`, `FileButton.test.tsx`, `FileDropZone.test.tsx`, `PageDropZone.test.tsx` (create); `packages/react/test/server-face.test.tsx`, `hydration.test.tsx`, `server-render.test.tsx` (rows for FileDropZone and FileButton), `empty-parts.test.tsx`
- Create (stories): `packages/react/src/file-drop-zone/FileDropZone.stories.tsx` (title `Components/FileDropZone`, holding the zone's, the overlay's and FileButton's stories); Modify: `packages/react/src/rtl/RightToLeft.stories.tsx` (`FileDropZoneMirrored`, `PageDropZoneMirrored`)
- Create: `packages/core/src/components/file-drop-zone.css`; Modify: `packages/core/src/styles.css`
- Test: `packages/core/test/css.test.js`, `packages/core/test/contrast.test.js`
- Create: `apps/docs/content/docs/components/file-drop-zone.mdx`, `apps/docs/examples/file-drop-zone-receipt.tsx`, `file-drop-zone-errors.tsx`, `file-drop-zone-page.tsx`, `file-button-basic.tsx`
- Modify: `meta.json`, `examples/index.ts`, `home-page.tsx` (the footer's "File drop zone" after "Field"), both READMEs
- Test: `apps/docs/tests/components.spec.ts`
- Modify: `docs/design-system.md` (`## FileDropZone`, covering PageDropZone and FileButton)
- Create (Docker step): 49 baselines. None changes.

**Interfaces:**

- Consumes: `Button` and `ButtonProps`, `Label`, `Description`, `useWarnOnce`, `isAnotherModalOpen`, `cx`, `present`, `AccessibleName`; React Aria's `FileTrigger`, `useDrop`, `isFileDropItem`, `isDirectoryDropItem`; Lucide `Upload`.
- Produces, exported from `@snapshot-ui/react`: `FileButton`, `FileButtonProps`, `FileDropZone`, `FileDropZoneProps`, `FileDropZoneBaseProps`, `FileDropZoneLabels`, `PageDropZone`, `PageDropZoneProps`, `FileAcceptance`, `FileRejection`, `FileRejectionReason`. Spec 6.1's types, with spec correction 1: `capture?: 'user' | 'environment'` in place of `defaultCamera` on `FileButtonProps` and `FileDropZoneBaseProps`, documented as "On a phone, opens the camera instead of the file picker: `environment` the back camera, `user` the front. A desktop browser ignores it."
- Internal: `acceptFiles` and its types, `holdMissedDrops(): () => void`.
- Later tasks rely on: `FileButton` in PageHeader's actions (Task 6) and the recipe (Task 8); `PageDropZone` in the recipe.

**Code** (the check, because its order of reasons and its type matching are where two builds differ):

```ts
// accept.ts: no directive; imported only by the client parts.
export interface AcceptResult {
  accepted: File[];
  rejected: FileRejection[];
}

/** Whether a file's MIME type or extension matches an `accept` entry, case-insensitively. */
export function matchesType(file: File, types: readonly string[]): boolean {
  const entries = types.map((type) => type.trim().toLowerCase()).filter((type) => type !== '');
  if (entries.length === 0) return true;
  const mime = (file.type.split(';')[0] ?? '').trim().toLowerCase();
  const name = file.name.toLowerCase();
  return entries.some((entry) => {
    if (entry.startsWith('.')) return name.endsWith(entry);
    // An empty type, as a browser gives a file it does not know (a HEIC photo on some systems), matches no
    // MIME entry: the extension entries decide it.
    if (mime === '') return false;
    if (entry.endsWith('/*')) return mime.startsWith(entry.slice(0, -1));
    return mime === entry;
  });
}

/**
 * The one check every way in runs (rulings 1 and 2): each file in order, refused for the first reason that
 * holds, type, then empty, then size, then count, which counts only the files accepted so far.
 */
export function acceptFiles(
  files: Iterable<File>,
  { acceptedFileTypes = [], maxFileSize, allowsMultiple = false, maxFiles }: Omit<FileAcceptance, 'onFiles'>,
): AcceptResult {
  const limit = maxFiles ?? (allowsMultiple ? Number.POSITIVE_INFINITY : 1);
  const accepted: File[] = [];
  const rejected: FileRejection[] = [];
  for (const file of files) {
    const reason: FileRejectionReason | null = !matchesType(file, acceptedFileTypes)
      ? 'type'
      : file.size === 0
        ? 'empty'
        : maxFileSize !== undefined && file.size > maxFileSize
          ? 'size'
          : accepted.length >= limit
            ? 'count'
            : null;
    if (reason === null) accepted.push(file);
    else rejected.push({ file, reason });
  }
  return { accepted, rejected };
}
```

**Code** (the page zone's counter, because `relatedTarget` is null in Safari's `dragleave` and Firefox fires one per child boundary):

```ts
// PageDropZone.tsx, inside the effect that runs while this is the page's one zone and it is not disabled.
let depth = 0;
const holdsFiles = (event: DragEvent): boolean => event.dataTransfer?.types.includes('Files') === true;
const enter = (event: DragEvent): void => {
  // A row or a tag dragged inside the page never holds 'Files'; a modal open over the page stands it down.
  if (!holdsFiles(event) || isAnotherModalOpen()) return;
  depth += 1;
  if (depth === 1) setShown(true);
};
const leave = (): void => {
  if (depth === 0) return;
  depth -= 1;
  if (depth === 0) setShown(false);
};
const end = (): void => {
  depth = 0;
  setShown(false);
};
document.addEventListener('dragenter', enter);
document.addEventListener('dragleave', leave);
document.addEventListener('drop', end);
document.addEventListener('dragend', end);
return () => {
  document.removeEventListener('dragenter', enter);
  document.removeEventListener('dragleave', leave);
  document.removeEventListener('drop', end);
  document.removeEventListener('dragend', end);
};
```

**Behavior:**

1. **The spike** (Step 1, its own commit, before any part). `DropSpike.stories.tsx` holds one story per claim, each a guarded play: (a) `UseDropFiles`: a box with `useDrop({ hasDropButton: false, getDropOperation, onDrop })` receives a dispatched `dragenter`, `dragover` and `drop` whose `DataTransfer` holds two `File`s, and `onDrop` sees two items for which `isFileDropItem` is true and whose `getFile()` resolves to the files; (b) `DropZoneFiles`: the same through `DropZone`, with its hidden button's `tabIndex` set to -1 by a ref, and Tab from a button before it skips to the button after it; (c) `PasteOnButton`: a `paste` event whose `clipboardData` holds a file, dispatched on a focused button inside a box, reaches the box's `onPaste` with the file (where the engine's `ClipboardEvent` constructor drops `clipboardData`, the play defines it with `Object.defineProperty` and says so); (d) `Counter`: dispatched `dragenter` and `dragleave` pairs across a parent and two children bring the counter back to zero, and `types` includes `'Files'` on a synthetic `dragenter` in each engine; (e) `MissedDrop`: a document listener that calls `preventDefault()` on a files `dragover` and `drop` leaves `defaultPrevented` true on a drop beside the box; (f) `DrawnMidDrag`: a `dragenter` on the document draws a `useDrop` target, and a `dragenter`, `dragover` and `drop` dispatched on it reach its `onDrop`. Each result, per engine, goes into spec corrections as "Spike results (Task 2)", with the decision of correction 5; if WebKit's `DragEvent` constructor drops the `DataTransfer`, the plays build the event with `new Event` and a defined `dataTransfer` and the record says so.
2. **The check** is `acceptFiles` above, called with the part's acceptance props on every drop, paste and choice. `onFiles(accepted, rejected)` is called once per drop, paste or choice, never with both empty: a drop of text or a paste with no files calls nothing. A dropped folder (`isDirectoryDropItem`) is refused as `'type'` with `new File([], item.name)` (spec correction 16), never read; a `'text'` item is skipped.
3. **FileButton.** `FileTrigger` (`acceptedFileTypes`, `allowsMultiple`, `defaultCamera={capture}`) around `Button` (every other `ButtonProps`, `children` its text, the variant `Button`'s own default). `onSelect(list)` runs `acceptFiles([...(list ?? [])])` and calls `onFiles` unless both lists are empty. React Aria clears the input at the press, so the same file chosen twice fires twice (spec correction 17). A disabled button opens nothing. Its `ref` is the button's.
4. **FileDropZone markup, in DOM order.** `div.file-drop-zone.field[role="group"]` (`className` merged after, `ref`; `aria-labelledby` the label's id while labelled, else the caller's name; `data-invalid` while invalid; `data-disabled`; `data-drop-target` mirrored from the box), holding `div.field-head` with the library's `Label elementType="span"` while `present(label)` (spec correction 15); then `div.file-drop-zone-box` (the drop props of `useDrop` with `hasDropButton: false`, `data-drop-target` while a drag holding files is over it, and an `onPaste` listener), holding `span.file-drop-zone-icon[aria-hidden="true"]` (Lucide `Upload`), and `div.file-drop-zone-line` with `span.file-drop-zone-hint` (`labels.dragHint`), `span.file-drop-zone-drop[aria-hidden="true"]` (`labels.drop`, drawn only as a drop target), and a `FileButton variant="secondary"` (`labels.choose`, `aria-describedby` the description's id and, while invalid, the status's id); then the `Description` while `present(description)`; then `div.file-drop-zone-status.field-error[role="status"]`, mounted empty, holding the error line while invalid.
5. **One tab stop** (ruling 3): the button. The box has no hidden button (spec correction 5); a pointer press on the box's empty space does nothing.
6. **Dragging.** `getDropOperation` answers `'copy'` for any drag whose types include `'Files'` and `'cancel'` otherwise, whatever the files' types (ruling 4). While a drag holding files is over the box the zone draws its drop look and `labels.drop` replaces the hint; the check runs on the drop.
7. **Paste.** A `paste` on the box (bubbling from the focused button) whose `clipboardData.files` is not empty runs the check and calls `onFiles`, and has its default prevented; a paste with no files is left alone.
8. **Refusals.** After a drop, paste or choice with refused files, the zone is invalid until the next drop, paste or choice, and the status says `labels.rejected(formatCount(rejected.length))`. `errorMessage` replaces that line; `isInvalid` makes the zone invalid by the app's word, showing `errorMessage`. A later drop with no refusals clears the library's invalid state, never the app's.
9. **A missed drop** (ruling 4). `holdMissedDrops()` adds, once for every mounted zone and page zone (a module-level count), document listeners for `dragover` and `drop` that call `preventDefault()` when the drag holds files, the event's default is not already prevented, and the target is not editable (`input`, `textarea`, `[contenteditable]`) or a native file input; it returns the release, which removes them when the last holder unmounts. A disabled zone still holds.
10. **Touch.** Under `(hover: none) and (pointer: coarse)` the hint is not drawn; both strings are in the HTML and the media query picks.
11. **Disabled.** The button is disabled, `useDrop` is disabled, a paste is ignored, and the zone draws its disabled look.
12. **The server's HTML** is the label, the box with the icon, both lines and the button, FileTrigger's hidden input, the description and the empty status; no `name`, no native submission (spec 13.2 item 8).
13. **PageDropZone.** It renders nothing on the server or while idle. Mounted, it registers in a module-level list; the first mounted is the page's zone, and a second warns once in development (`"PageDropZone: a page has one page drop zone; this one stays idle while another is mounted."`) and stays idle until the first unmounts. While it is the page's zone and not disabled, it holds missed drops (behavior 9) and runs the counter above. While shown it renders, in place (not portaled, so it keeps the shell's custom properties and the scope), `div.page-drop-zone[aria-hidden="true"]` with the drop props of `useDrop({ hasDropButton: false })`, holding `div.page-drop-zone-card` with `span.page-drop-zone-icon` (Lucide `Upload`), `p.page-drop-zone-title` and `p.page-drop-zone-description`. A drop on it runs the check and calls `onFiles`, and the counter's `drop` listener hides it; `dragend`, and the `dragleave` that brings the counter to zero (an external drag cancelled with Escape fires one), hide it too. Its keyboard twin is the app's FileButton; the overlay is pointer-only and hidden from assistive technology (spec 14).
14. **Client navigation.** Every document listener is added in an effect and removed on unmount, so a zone never outlives its page.

**CSS** (`file-drop-zone.css`), as spec 6.3 with spec corrections 6 and 7: the box (`container: file-drop-zone / inline-size`, `--radius-surface`, `border: 2px dashed var(--color-boundary)`, no fill, `padding: var(--spacing-peer)`, `min-block-size: 8rem`, a centered column with `gap: var(--spacing-part)`, the icon 24px slate, the hint at `--text-body` 450 ink); `@container file-drop-zone (width < 20rem)` one row; the drop target (`border-style: solid; border-color: var(--color-ink)`, `background-color: color-mix(in srgb, var(--color-ink) 5%, transparent)`, the drop line at 500 in ink, the hint hidden); invalid (`border-color: var(--color-error)`, dashed, declared after the drop target so it wins); disabled (taupe edge, text and icon, `cursor: not-allowed`); `@media (hover: none) and (pointer: coarse) { .file-drop-zone-hint { display: none } }`; the overlay (`position: fixed; inset: var(--spacing-inset); inset-inline-start: calc(var(--app-shell-sidebar, 0px) + var(--spacing-inset)); z-index: calc(var(--z-chrome) + 1)`, `border: 2px dashed var(--color-ink)`, `--radius-stadium`, `background-color: color-mix(in srgb, var(--color-canvas) 92%, transparent)`, a centered flex, the float card with `padding: var(--spacing-peer) var(--spacing-separate)`, the icon 40px ink, the title `--text-h3` at 500, the description slate), its 120ms fade in through `@starting-style` and none under reduced motion; forced colors (dashed edges `canvastext`, the drop target's edge `highlight`, the overlay's fill `canvas` with no transparency, the card's edge `canvastext`).

**Keys** (the page's table): Tab, to the zone's button, one stop; Enter and Space on it open the picker; Ctrl+V or Cmd+V with focus on it adds the clipboard's files; Escape during a drag, the browser cancels it and the overlay leaves.

**Tests, written first:**

- `accept.test.ts`: `it.each` over the cases: a MIME type; a wildcard; an extension, any case; an entry with spaces; an empty MIME type matched by its extension and refused by a MIME entry alone; a type with parameters; no entries takes any file; `'empty'` for no bytes; `'size'` over `maxFileSize` and not at it; `'count'` past `maxFiles`, counting accepted files only; one file by default and no limit with `allowsMultiple`; the order of reasons (a zero-byte file of the wrong type is `'type'`); the order of both lists kept.
- `missed-drop.test.ts`: `it('prevents a files dragover and drop on the document while held, and not after the last release')`; `it('leaves a drop whose default is already prevented, a drop into an input or editable element, and a drag without files')`; `it('adds one listener pair for two holders and removes it after both release')`.
- `FileButton.test.tsx` (user-event with `applyAccept: false`): `it('writes accept, multiple and capture on its hidden input')`; `it('calls onFiles once with the accepted and refused files of a choice')`; `it('calls nothing for an empty choice')`; `it('fires again when the same file is chosen twice')`; `it('opens nothing while disabled')`; `it.each(AXE_CASES)` for primary and secondary.
- `FileDropZone.test.tsx`: `it('is a group named by its label, with one tab stop, the button')`; `it('describes the button by the description, and by the status while invalid')`; `it('reaches onFiles through a choice')`; `it('says the refusals in the status after a choice, as labels.rejected writes them with formatCount')`; `it('puts errorMessage in place of the library line')`; `it('clears its own invalid state on a clean choice and keeps the app's isInvalid')`; `it('draws both lines in the server HTML')`; `it('holds missed drops while mounted, disabled too, and releases them on unmount')`; `it('uses "Drag a file here or" and "Choose a file" without allowsMultiple')`; `it.each(AXE_CASES)`: idle, invalid, disabled, unlabelled with `aria-label`.
- `PageDropZone.test.tsx` (events built with `Object.defineProperty`): `it('renders nothing on the server and while idle')`; `it('shows the overlay on a dragenter holding Files, and not for text')`; `it('keeps it through child boundaries and hides it when the counter returns to zero')`; `it('hides it on drop and on dragend')`; `it('stands down while a modal is open')`; `it('warns once for a second page zone and leaves it idle until the first unmounts')`; `it('removes its listeners on unmount')`; `it('stays idle while disabled')`; `it.each(AXE_CASES)`: the overlay shown.
- Server suites: FileDropZone and FileButton in `server-face.test.tsx` (the label, both lines, the button, the hidden input), in `hydration.test.tsx` and `server-render.test.tsx` under the three locales and two zones; PageDropZone's server HTML is empty.
- `empty-parts.test.tsx`: `it('draws no label row or description for a FileDropZone given an empty label and description')`.
- `css.test.js`, `describe('src/components/file-drop-zone.css')`: the box's radius, dashed boundary edge, padding and height; the 20rem container row; the drop target's ink edge and 5% wash; invalid after drop target; disabled taupe; the coarse-pointer rule; the overlay's insets past the rail, its z-index `calc(var(--z-chrome) + 1)`, its stadium radius and 92% canvas; the 120ms fade and reduced motion; the forced-colors block.
- `contrast.test.js`, `describe('the file drop zone')`: cites the boundary on canvas and lifted (3.38, 3.45; 5.34, 5.21), slate on float (the overlay's description, 5.49, 6.94) and ink on float, gated; measures ink on the 5% wash over canvas and lifted (14.70, 17.41; 16.11, 15.25), recorded.
- Stories (`Components/FileDropZone`), every zone in a box `width: min(32rem, 100%)`:
  - `Default` (tags `['density']`): "Receipts", "PDF, JPG or PNG, up to 10 MB", `allowsMultiple`.
  - `Single`: "Receipt", one file.
  - `DropTarget`: play dispatches `dragenter` and `dragover` with a files `DataTransfer` on the box; the drop look.
  - `Refused`: play dispatches a drop of an empty file and a `.exe`; "2 files were not added".
  - `Disabled`.
  - `Narrow`: in an 18rem box, one row.
  - `RightToLeft`: Persian label, hint and button.
  - `PageOverlay` (tags `['viewport-desktop']`): the shell fixture (`DemoNav`, `DemoHeader`) with a PageDropZone; play dispatches `dragenter` with Files on the document; the overlay over the workspace and not the rail.
  - `PageOverlayPhone` (tags `['viewport-phone']`): the same at 375, the overlay inset 16px from every edge.
  - `FileButtons`: a primary "Upload", a secondary "Choose files" and a secondary "Take a photo" with `capture="environment"`.
  - `no-visual`, tagged `webkit` and `firefox` too: `DropReachesOnFiles`, `PasteReachesOnFiles` (focuses the button with `focusOn`), `OneTabStop`, `MissedDrop`, `DragCounter`, `OverlayDrop`; Chromium only: `StandsDownUnderModal`. The coarse-pointer rule is pinned by `css.test.js`, since a play cannot emulate the pointer.
- `RightToLeft.stories.tsx`: `FileDropZoneMirrored` (the icon and button order mirrors in the narrow row); `PageDropZoneMirrored` (the overlay's right inset clears the rail, which is on the right).
- Docs end-to-end, `components.spec.ts`: `LONG_TARGETS['file-drop-zone'] = ['.stage .file-drop-zone .field-label', '.stage .file-drop-zone .field-description']`; `SERVER_RENDERED['file-drop-zone'] = ['.stage .file-drop-zone-box', '.stage .file-drop-zone button']`; `test('a choice through the receipt field reaches the example and a refusal is said')` (`setInputFiles` on the hidden input with a PDF and an empty file); `test('the page zone example shows its overlay only while its switch is on')` (a dispatched `dragenter` with Files on the document); in `test.describe('forced colors')`, `test('a drop zone keeps its dashed edge and its drop target edge')`.

**Docs:**

- `file-drop-zone.mdx`, title "File drop zone", description "Files dropped on a field or on the whole page, with a button for the keyboard and for touch, checked against your types and sizes.", icon `FileUp`. Sections: `## A field` (`file-drop-zone-receipt`: one receipt; "Take a photo" beside it on a phone with `capture`), `## Errors in your words` (`file-drop-zone-errors`: `errorMessage` naming each refused file in GOV.UK's words, "The selected file must be smaller than 10 MB"), `## The whole page` (`file-drop-zone-page`: a PageDropZone and an Upload FileButton beside the title, mounted while the "Drop anywhere on this page" Switch is on; one pattern: every page zone has a button), `## A button alone` (`file-button-basic`), `## Usage` (the library never reads or sends a file: `onFiles` gives you `File` objects and refusals with reasons; check again on your server, since a renamed file passes any check by name (OWASP's File Upload Cheat Sheet); `acceptedFileTypes` takes MIME types, wildcards and extensions, and lists `.heic` for a phone's photos, whose type a browser may not know; `maxFiles` counts per drop; folders are refused; a page has a page zone or inline zones, never both; `capture` and when a desktop ignores it), `## Props` (tables "FileDropZone props", "FileButton props", "PageDropZone props", "FileDropZoneLabels"), `## Accessibility` (one tab stop that also takes a paste; WCAG 2.5.7: a drag always has a single-pointer twin; refusals said politely once; the overlay is for the pointer and hidden from assistive technology; the Keys table), `## Design rules` (dos: say the rules in the description, pair a page zone with a button, name refusals in the reader's words; donts: never hide the button on a desktop, never signal orange or link blue for the drop look, never an inline zone under a page zone).
- Examples: all four are client files.
- `docs/design-system.md`, `## FileDropZone`: the box's radius step and why (the nested-radii table's drop zone), the 2px dashed boundary and its measured contrast (spec correction 6), the drop look's ink and wash and their measures, invalid over drop, disabled, the touch rule, the 20rem row, the overlay's insets past the rail, its stadium step, its 92% canvas and why no text sits on it (spec correction 7), its layer, the fade; the spike's results; `useDrop` over `DropZone` (spec correction 5); the missed-drop hold.

**Steps:**

- [ ] **Step 1: The spike.** Write `DropSpike.stories.tsx` (behavior 1), run it in Chromium (`pnpm --filter @snapshot-ui/storybook exec vitest run --project=storybook DropSpike`), commit it alone and push, then read the pull request's `storybook-webkit` and `storybook-firefox` results. Record each claim's result per engine and the decision of spec correction 5 in this plan's spec corrections, in the same commit or a `docs(plans)` commit after it.

```bash
git add packages/react/src/file-drop-zone/DropSpike.stories.tsx
git commit -m "test: prove the file drop zone's drop, paste and drag counter in three engines"
git push origin feat/documents
```

- [ ] **Step 2: Write the failing tests** listed above, stories included, and run them (as Task 1's Step 2, with `FileDropZone` as the Storybook filter). Expected: the core run FAILS the new describe; the React run FAILS to import the new modules; the Storybook run fails to import the story file; the end-to-end run FAILS the completeness guard (`+ "file-drop-zone"`), the two example tests and the forced-colors test.
- [ ] **Step 3: Write the check, the hold, the three parts, the CSS, the import, the stories, the examples, the page, the lists, the footer link and the record.** Size-limit entries `{ FileDropZone, FileButton }` at 2.5 kB and `{ PageDropZone }` at 1.5 kB, measured and set by the rule.
- [ ] **Step 4: Run the tests and watch them pass.** Expected: all pass, about 14 core tests and about 45 React tests, and the stories in Chromium and dark.
- [ ] **Step 5: Run everything.** Expected: every gate green; both entries within their limits.
- [ ] **Step 6: Commit and push**, then read the pull request's WebKit and Firefox results for the six `webkit`/`firefox` plays.

```bash
git add "apps/docs/app/(home)/home-page.tsx" apps/docs/content/docs/components/file-drop-zone.mdx apps/docs/content/docs/components/meta.json apps/docs/examples/file-button-basic.tsx apps/docs/examples/file-drop-zone-errors.tsx apps/docs/examples/file-drop-zone-page.tsx apps/docs/examples/file-drop-zone-receipt.tsx apps/docs/examples/index.ts apps/docs/tests/components.spec.ts docs/design-system.md docs/plans/2026-10-16-documents.md packages/core/README.md packages/core/src/components/file-drop-zone.css packages/core/src/styles.css packages/core/test/contrast.test.js packages/core/test/css.test.js packages/react/.size-limit.json packages/react/README.md packages/react/src/file-drop-zone packages/react/src/index.ts packages/react/src/rtl/RightToLeft.stories.tsx packages/react/test/empty-parts.test.tsx packages/react/test/hydration.test.tsx packages/react/test/server-face.test.tsx packages/react/test/server-render.test.tsx
git commit -m "feat: add FileDropZone, PageDropZone and FileButton"
git push origin feat/documents
```

- [ ] **Step 7: Visual baselines** (owner action 2). Expected: 49 new files: `components-filedropzone--default--{light-rounded,dark-rounded,light-soft,light-square,light-rounded-375,light-rounded-compact}.png`, `components-filedropzone--{single,drop-target,refused,disabled,narrow,right-to-left,file-buttons}--{light-rounded,dark-rounded,light-soft,light-square,light-rounded-375}.png`, `components-filedropzone--page-overlay--{light-rounded,dark-rounded,light-soft,light-square}.png` and `components-filedropzone--page-overlay-phone--{light-rounded-375,dark-rounded-375,light-soft-375,light-square-375}.png`. What to look at: a dashed boundary box with a slate upload icon over "Drag files here or" and a secondary button; at 375 the hint is still drawn (the harness's pointer is fine), so the picture is the desktop's at a phone's width; the drop target solid ink on a faint wash with "Drop to upload"; the refused zone's red dashed edge and its line; the overlay covering the workspace and not the rail, its card centered.

---

### Task 3: UploadList and UploadTray, and AppShell's floating slot

**Goal:** follow each file from waiting to saved, needs review or failed. `UploadList` is a plain list of rows, each with an icon, the name (a link once it has a document), a status word, a reason, a bar while uploading or reading, and Retry, Remove or Cancel where they apply. `UploadTray` holds it: a floating panel in the bottom end corner from 768px, a docked bar that opens a Sheet under it, mounted once in AppShell's new `floating` slot so it survives client navigation, saying three things politely, asking before it cancels, and warning before the page unloads while anything is in flight. The toasts lift above it. Implements spec 7 and 12 (the tray's part), rulings 5 to 12, section 13.2 items 11 to 13, section 13.3 items 4 and 5, spec corrections 10 and 11, risks R4, R5 and R7, and the `upload-tray` page and record.

**Files:**

- Create: `packages/react/src/upload-tray/UploadList.tsx`, `UploadTray.tsx`, `counts.ts`, `useUploadAnnouncements.ts`, `index.ts`; `packages/react/src/utils/useBeforeUnload.ts`
- Modify: `packages/react/src/app-shell/AppShell.tsx` (`floating`, `useOptionalAppShell`), `packages/react/src/index.ts`, `packages/react/.size-limit.json`
- Test: `packages/react/src/upload-tray/UploadList.test.tsx`, `UploadTray.test.tsx`, `counts.test.ts`, `useUploadAnnouncements.test.tsx`, `packages/react/src/utils/useBeforeUnload.test.tsx` (create); `packages/react/src/app-shell/AppShell.test.tsx`; the server suites (UploadTray's empty host, UploadList's rows); `empty-parts.test.tsx`
- Create (stories): `packages/react/src/upload-tray/UploadList.stories.tsx` (`Components/UploadList`), `UploadTray.stories.tsx` (`Components/UploadTray`); Modify: `RightToLeft.stories.tsx` (`UploadTrayMirrored`)
- Create: `packages/core/src/components/upload-tray.css`; Modify: `styles.css`, `packages/core/src/components/toast.css` (the lift)
- Test: `css.test.js`, `contrast.test.js`
- Create: `apps/docs/content/docs/components/upload-tray.mdx`, `apps/docs/examples/upload-list-statuses.tsx`, `apps/docs/examples/uploads-data.ts`
- Modify: `apps/docs/content/docs/components/app-shell.mdx` (`## Floating`), `meta.json`, `examples/index.ts`, `home-page.tsx` (the footer's "Upload tray" last), both READMEs
- Test: `components.spec.ts`
- Modify: `docs/design-system.md` (`## UploadTray`, covering UploadList; `## Floating chrome and the shell` gains the slot's line)
- Create (Docker step): 39 baselines. None changes.

**Interfaces:**

- Consumes: `ProgressBar` (Task 1), `Link`, `IconButton`, `Sheet`, `useConfirm`, `useControllableState`, `useHydrated`, `useWarnOnce`, `QUIET_MS`, `useAppShell`'s context; Lucide icons as listed.
- Produces, exported from `@snapshot-ui/react`: `UploadList`, `UploadListProps`, `UploadListLabels`, `UploadTray`, `UploadTrayProps`, `UploadTrayLabels`, `UploadItem`, `UploadStatus`, `UploadCounts`, spec 7.1's types unchanged; `AppShellProps` gains:

```ts
/**
 * Floating chrome that outlives every page, such as an UploadTray: rendered after the workspace and the tab bar,
 * outside `<main>`, so a client navigation keeps it and it is never a landmark inside main.
 */
floating?: ReactNode;
```

- Internal: `countUploads(items): UploadCounts`, `isInFlight(status): boolean` (`waiting`, `uploading`, `reading`); `useOptionalAppShell(): AppShellState | null`; `useBeforeUnload(isOn: boolean): void`; `useUploadAnnouncements(items, labels, formatCount): { key: number; text: string } | null`.
- Later tasks rely on: `useBeforeUnload` (Task 5); the tray in the `BottomEdge` stories (Task 5) and the recipe (Task 8); `--upload-tray-offset` in `toast.css`.

**Code** (the announcements, because their timing is the ruling):

```ts
// useUploadAnnouncements.ts: what the tray says, and when (ruling 10). Each message is keyed, so the status host
// says the same words twice when they come twice, as the toast host does.
// - started: once, QUIET_MS after a batch starts (something goes in flight with no batch running), with the
//   counts at that moment, so files added during the pause are in it; later additions are silent.
// - attention: rows that turned failed or review since the last time it spoke, gathered by a timer that waits
//   QUIET_MS after the last such change, so a burst is one sentence; a row that arrives already failed counts.
// - settled: once nothing is in flight, QUIET_MS after the last row settles; anything going in flight before it
//   speaks cancels it and the batch runs on, with no new started. A pending attention is dropped when settled
//   speaks, since the summary says it. Settled ends the batch.
// Statuses seen on the first render are the baseline: a tray mounted over settled items says nothing, and one
// mounted mid-batch starts one. Never a percentage, never uploading, reading or saved on its own.
```

**Behavior:**

1. **UploadList markup** (ruling 9): `ul.upload-list` (named by `aria-label` or `aria-labelledby` when given; `className`, `ref`) of `li.upload-row[data-status]`: `span.upload-row-icon[aria-hidden="true"]`; `div.upload-row-text` with the name, `div.upload-row-status` (`span.upload-row-word`, then for `failed` and `review` `span.upload-row-reason`, and for `uploading` `span.upload-row-progress` at its end), and under it, for `uploading` and `reading`, a `ProgressBar` with `aria-label` `${word} ${name}` and no head, determinate from `progress` (0 to 1, as `value={progress * 100}`, `valueLabel` the `progressLabel`) or indeterminate without it and for `reading`; then `div.upload-row-actions`.
2. **Statuses**, spec 7.2's table: the icon, the word and its color, the bar, the buttons. A button shows only when its handler is given; buttons are ghost `IconButton`s named `labels.retry(name)`, `labels.remove(name)`, `labels.cancel(name)` (Lucide `RotateCw`, `X`, `X`).
3. **The name** keeps its extension: two spans, `span.upload-row-stem` (ellipsized) and `span.upload-row-ext` (`flex: none`), split at the last dot when it is not the first character; the full name is the link's or the row's text. With `href` the name is a library `Link` (through the router).
4. **Focus after a row leaves.** When Remove or Cancel takes a row away (its id is gone from `items` in the next render while focus was in it), focus moves to the same button of the next row, else the previous one, else the tray's heading (`tabIndex={-1}`) or the list itself in a page; never the body. Retry keeps focus on the row's first control as its status changes.
5. **Development warnings**: a `failed` item without `reason`; a repeated `id`; `progress` outside 0 to 1. Each once.
6. **AppShell's `floating`** renders after `{bottomBar}` inside `.app-shell`, outside the workspace and `<main>`, with no wrapper of its own, so the tray inherits `--app-shell-sidebar`, `--app-shell-inset-block-end` and the scope. `useOptionalAppShell` returns the context or `null`; `useAppShell` keeps throwing.
7. **The tray with no items** renders only `div.upload-tray-status[role="status"]`, empty, clipped as `.toast-status-host` is, in the server's HTML. With items, both faces render, and a media query shows one.
8. **The wide face** (from 768px, ruling 7): `section.upload-tray[aria-labelledby]` with `data-collapsed` while folded, holding `div.upload-tray-header` (`h2.upload-tray-title[id][tabindex="-1"]` with `labels.title(counts, formatCount)`, `p.upload-tray-description` when given, the fold `IconButton` (`labels.details`, `aria-expanded`, `aria-controls` the body's id, Lucide `ChevronDown` turned 180 degrees while folded), and the close `IconButton` (`labels.close`, Lucide `X`) when it applies), and `div.upload-tray-body[id]` (`hidden` while folded) holding the `UploadList` named by the title.
9. **The narrow face** (under 768px, ruling 8): `div.upload-tray-bar[role="region"][aria-labelledby]` holding one `button.upload-tray-bar-button` whose text is the title, with Lucide `ChevronUp`, opening a `Sheet` titled with the title, holding the description and the `UploadList`. The sheet closes on a link press in a row (the router navigates), on Back and every way a sheet closes; focus returns to the bar's button. An open sheet stays open when the window widens past 768px until it closes; this is the one `matchMedia` read, after hydration.
10. **Close** (ruling 11). Nothing in flight: the button calls `onClear`. In flight with `onCancelAll`: it asks through `useConfirm` (`labels.cancelAllTitle(formatCount(inFlight))`, `cancelAllDescription`, `cancelAllConfirm`, `cancelAllKeep`, tone `danger`) and calls `onCancelAll` on yes. In flight without it: no close button. When the tray leaves with focus inside it, focus goes to `<main>` (spec correction 11).
11. **Announcements**: `useUploadAnnouncements`, its text in the status host keyed as `ToastRegion`'s is (`<div key={message.key}>`).
12. **Leaving the page** (ruling 12): `useBeforeUnload(warnsOnUnload && inFlight > 0)`, which adds a `beforeunload` listener that calls `event.preventDefault()` and sets `event.returnValue = ''` while on, and removes it when off or unmounted.
13. **`--upload-tray-offset`.** While the tray draws a face, a `ResizeObserver` on the shown face writes its border-box height plus `var(--spacing-inset)` as `--upload-tray-offset` on `document.documentElement`, and removes it when the tray draws nothing or unmounts. Nothing writes it on the server.
14. **Scope and direction**: the tray takes the shell's theme, shape and density; the sheet copies the scope; in right to left it sits bottom left.

**The bottom edge, this task's part** (spec 12): `upload-tray.css` places both faces at `inset-block-end: calc(var(--app-shell-inset-block-end, 0px) + var(--overlay-inset) + var(--save-bar-offset, 0px))`, with `--save-bar-offset` unset until Task 5 declares it; `toast.css`'s region becomes `inset-block-end: calc(var(--overlay-inset) + var(--toast-offset-block, 0px) + var(--save-bar-offset, 0px) + var(--upload-tray-offset, 0px))`, its comment naming the stack's order. The tray's width is `min(28rem, calc(100vw - 2rem))` and its inline end `var(--overlay-inset)`, the toast region's (spec correction 10).

**CSS** (`upload-tray.css`), as spec 7.4 with spec correction 10: the list (no bullets, a `--color-divider` rule between rows, the row grid `24px minmax(0, 1fr) auto` with `column-gap: 0.75rem`, `min-block-size: max(var(--size-target), 3.5rem)`, `padding: 0.625rem var(--spacing-inset)`, the name at `--text-small` 500, the status at `--text-small` 450, the word in its color, the reason slate, the bar `var(--spacing-part)` under the status spanning the text column, the icons in their status colors); the wide face (`position: fixed`, the float surface, `z-index: var(--z-chrome)`, the header's padding and its divider while the body shows, the body `max-block-size: min(24rem, 50dvh)` scrolling with the library's thin scrollbar colors); the narrow bar (`inset-inline: var(--overlay-inset)`, `block-size: var(--size-field)`, `min-block-size: 44px` under `(pointer: coarse)`, `--radius-pill`, the float surface, the title at `--text-small` 500, the chevron 16px at the end); `@media (width < 768px)` and `(width >= 768px)` choosing the face; the rise through `@starting-style` and none under reduced motion; forced colors (the surface's edge `canvastext`, icons `canvastext`).

**Keys** (the page's table): Tab and Shift+Tab through the header's buttons, then each row's link and buttons; Enter or Space on the fold button folds or unfolds, on a link opens the document, on Retry, Remove or Cancel does it; Escape in the narrow face's sheet closes it and focus returns to the bar. The wide face is not modal and takes no Escape.

**Tests, written first:**

- `counts.test.ts`: the seven counts; `isInFlight` for each status.
- `UploadList.test.tsx`: `it.each(STATUSES)('draws %s with its icon, word, bar and buttons')`; `it('draws a button only when its handler is given')`; `it('links the name through the router when the item has href')` (a mocked `RouterProvider`); `it('keeps the extension in its own span, also for a name with no extension or a leading dot')`; `it('draws a determinate bar from progress, an indeterminate one without it and while reading')`; `it('moves focus to the next row's same button after Remove, else the previous, never the body')`; `it('keeps focus on the row through Retry')`; `it('warns once for a failed item without reason, a repeated id and progress outside 0 to 1')`; `it.each(AXE_CASES)`: each status, and a list named by `aria-labelledby`.
- `useUploadAnnouncements.test.tsx` (fake timers): `it('says started once, QUIET_MS after a batch starts, with the counts then')`; `it('adds files during a batch silently')`; `it('gathers failures and reviews over QUIET_MS into one sentence')`; `it('counts a row that arrives already failed')`; `it('says settled once, QUIET_MS after the last row settles, and drops a pending attention')`; `it('cancels settled when a retry starts before it speaks, with no new started')`; `it('says nothing for items settled on the first render')`; `it('never says a percentage, or a row turning uploading, reading or saved')`; `it('says the same words twice when they come twice')`.
- `UploadTray.test.tsx` (a stubbed `matchMedia` and `ResizeObserver`): `it('renders only the empty status host with no items, on the server too')`; `it('draws the wide face as a region named by its title, and the bar as a region holding one button')`; `it('folds the body, keeps the title and the button name, and sets aria-expanded')` (controlled and uncontrolled); `it('calls onClear from the close button once nothing is in flight')`; `it('asks before onCancelAll while in flight, and shows no close button without it')`; `it('opens the sheet from the bar and closes it on a row link')`; `it('gives focus to main when it leaves with focus inside, and to the first focusable main outside a shell')`; `it('warns before unload only while in flight and warnsOnUnload')`; `it('writes --upload-tray-offset while it draws and removes it after')`; `it.each(AXE_CASES)`: open, folded, settled with close, the bar, the open sheet.
- `useBeforeUnload.test.tsx`: the listener is present only while on; the event's default is prevented and `returnValue` set.
- `AppShell.test.tsx`: `it('renders floating after the workspace and the bottom bar, outside main')`; `it('lets useOptionalAppShell read null outside a shell')`.
- Server suites: UploadList with every status, UploadTray with and without items.
- `css.test.js`, `describe('src/components/upload-tray.css')`: the row grid and its metrics; the status colors by `data-status`; the reason slate; the wide face's float surface, width and inline end as the toast region's, its bottom offset expression, `z-index: var(--z-chrome)`; the narrow bar's height and coarse floor; the 768px literals equal to `tokens.breakpoint.sm.value`; the rise and reduced motion; forced colors. `describe('src/components/toast.css')`: the region's bottom offset adds `--save-bar-offset` and `--upload-tray-offset`.
- `contrast.test.js`, `describe('the upload tray')`: cites success, warning, error, slate, ink and link on float (7.44, 6.34; 6.33, 8.92; 7.46, 5.73; 5.49, 6.94; 18.43, 17.42; 5.86, 5.46), gated.
- Stories. `Components/UploadList`, in a Card `width: min(28rem, 100%)`: `Statuses` (tags `['density']`): the six statuses with every handler; `LongNames`: "Receipt-2026-10-14-corner-mart-and-the-long-weekend.pdf" in a 22rem card. `Components/UploadTray`, every story in the shell fixture: `Open` (tags `['viewport-desktop']`), five items in mixed states; `Collapsed` (`viewport-desktop`); `Settled` (`viewport-desktop`), three saved, one needs review, one failed, the close button; `PhoneBar` (`viewport-phone`), with a BottomTabBar, the bar above it; `PhoneSheet` (`viewport-phone`), play presses the bar and waits for `data-entering` to leave the sheet; `WithToasts` (`viewport-desktop`), the tray and two toasts in one column; `RightToLeft` (`viewport-desktop`). `no-visual`: `FoldKeys` (tagged `webkit`, `firefox`; `focusOn` the fold button, Enter and Space), `FocusAfterRemove` (`webkit`, `firefox`), `FocusAfterLeave`, `OutsideMain`, `OffsetWritten` (asserts `--upload-tray-offset` on the root and the toast region's bottom above the tray's top).
- `RightToLeft.stories.tsx`, `UploadTrayMirrored`: the tray's left edge is 16px from the window's left; a name's extension is at its left end in a Persian row.
- Docs end-to-end, `components.spec.ts`: `LONG_TARGETS['upload-tray'] = ['.stage .upload-row-stem']`; `SERVER_RENDERED['upload-tray'] = ['.stage .upload-list', '.stage .upload-row']`; in forced colors, `test('a failed row keeps its icon and word')`.

**Docs:**

- `upload-tray.mdx`, title "Upload tray", description "Each file from waiting to saved, needs review or failed, in a panel that stays across pages.", icon `Upload`. Sections: `## The six statuses` (`upload-list-statuses`: an UploadList in a Card, from `uploads-data.ts`), `## Usage` (the library never uploads: your app holds `items` in a provider in its root layout and mounts `<UploadTray>` in AppShell's `floating` slot, so a client navigation keeps it; the statuses and what each means; `progress` from 0 to 1 and `progressLabel` in your words; `reason` is required for `failed`; `href` links the name through your RouterProvider; `onRetry`, `onRemove`, `onCancel`, `onClear`, `onCancelAll`; `warnsOnUnload` and its limit, since iOS Safari shows no warning; the Documents recipe below, Task 8), `## Props` (tables "UploadTray props", "UploadList props", "UploadItem", "UploadTrayLabels"), `## Accessibility` (a region named by its title; three polite announcements and what they say; a plain list in the page's tab order; the Keys table), `## Design rules` (dos: say why a file failed in the reader's words, link a saved file to its document; donts: never percentages in words, never a modal for uploads, never signal orange or clay in a row).
- `app-shell.mdx`, `## Floating`: the slot, where it renders, why outside `<main>`, the tray as its use.
- `docs/design-system.md`, `## UploadTray`: the column shared with the toasts and why (spec correction 10), the surface, the header, the body's height, the row's metrics, the status table with icons, words and measured colors, the reason's slate, the name's extension, the narrow bar and its 48px, the faces' 768px switch, the rise, forced colors, the offsets this task adds; `## Floating chrome and the shell` gains the `floating` slot.

**Steps:**

- [ ] **Step 1: Write the failing tests**, stories included. **Step 2:** run them (Task 1's commands, filters `UploadList UploadTray`). Expected: imports fail; the AppShell tests fail on `floating`; the core describes fail; the end-to-end guard fails on `+ "upload-tray"`.
- [ ] **Step 3: Write the parts, the hooks, the slot, the CSS and the toast lift, the stories, the example, the pages, the lists, the footer link and the records.** Size-limit entries `{ UploadList }` at 2.5 kB and `{ UploadTray }` at 4.5 kB (it carries Sheet, IconButton, useConfirm and UploadList), measured and set by the rule; AppShell's entry is measured again and its limit kept or raised by the rule with the reason.
- [ ] **Step 4: Run the tests and watch them pass.** Expected: about 12 core tests and about 55 React tests, and the stories in Chromium and dark.
- [ ] **Step 5: Run everything.** Expected: every gate green; existing toast and AppShell baselines are not affected (the new properties are unset there), which Task 8's visual check confirms.
- [ ] **Step 6: Commit and push**, then read the WebKit and Firefox results for `FoldKeys` and `FocusAfterRemove`.

```bash
git add "apps/docs/app/(home)/home-page.tsx" apps/docs/content/docs/components/app-shell.mdx apps/docs/content/docs/components/meta.json apps/docs/content/docs/components/upload-tray.mdx apps/docs/examples/index.ts apps/docs/examples/upload-list-statuses.tsx apps/docs/examples/uploads-data.ts apps/docs/tests/components.spec.ts docs/design-system.md packages/core/README.md packages/core/src/components/toast.css packages/core/src/components/upload-tray.css packages/core/src/styles.css packages/core/test/contrast.test.js packages/core/test/css.test.js packages/react/.size-limit.json packages/react/README.md packages/react/src/app-shell/AppShell.test.tsx packages/react/src/app-shell/AppShell.tsx packages/react/src/index.ts packages/react/src/rtl/RightToLeft.stories.tsx packages/react/src/upload-tray packages/react/src/utils/useBeforeUnload.test.tsx packages/react/src/utils/useBeforeUnload.ts packages/react/test/empty-parts.test.tsx packages/react/test/hydration.test.tsx packages/react/test/server-face.test.tsx packages/react/test/server-render.test.tsx
git commit -m "feat: add UploadList and UploadTray, and AppShell's floating slot"
git push origin feat/documents
```

- [ ] **Step 7: Visual baselines** (owner action 2). Expected: 39 new files: `components-uploadlist--statuses--{light-rounded,dark-rounded,light-soft,light-square,light-rounded-375,light-rounded-compact}.png`, `components-uploadlist--long-names--{light-rounded,dark-rounded,light-soft,light-square,light-rounded-375}.png`, `components-uploadtray--{open,collapsed,settled,with-toasts,right-to-left}--{light-rounded,dark-rounded,light-soft,light-square}.png` and `components-uploadtray--{phone-bar,phone-sheet}--{light-rounded-375,dark-rounded-375,light-soft-375,light-square-375}.png`. What to look at: a 28rem float panel 16px from the bottom right, "Uploading 2 of 5" over the rows; each status's icon and word in its color and the reason in slate; the extension kept after an ellipsis; folded, the header alone; at 375 a pill bar above the tab bar; the sheet with the list; the toasts above the tray in the same column; in right to left the panel at the bottom left.

---

### Task 4: DatePicker, and the changed dot for a field with no label

**Goal:** one date, typed into React Aria's segments or chosen on the Calendar in a popover, with the app's single-day presets, ISO strings in and out, its frame, button and `valueLabel` on the server and its segments after hydration, drawn on DateRangePicker's frame now shared; and, for every framed field, a clay dot and a hidden "Changed" when it is changed and has no label, so a review grid of unlabelled fields says which changed in words as well as in the edge. Implements spec 8, rulings 15 and 16, section 13.2 item 19, spec corrections 2 to 4, risk R8, and the `date-picker` page and records. **Before it starts**, apply "Merging main" rule 2.

**Files:**

- Create: `packages/react/src/calendar/DateFrame.tsx` (`DateFrame`, `drawSegment`, `noSegment`, moved from `DateRangePicker.tsx:199-228` and generalized by a `className` prop), `packages/react/src/date-picker/DatePicker.tsx`, `index.ts`, `packages/react/src/field/FieldChangedMark.tsx`
- Modify: `packages/react/src/date-range-picker/DateRangePicker.tsx` (imports the frame, no change in behavior), `packages/react/src/calendar/CalendarParts.tsx` (`CalendarDatePresets`, the single-day form reading `CalendarStateContext`, beside `CalendarPresets`), `packages/react/src/field/useChangedDescription.ts` (`isLabelled`), and the framed fields: `text-field/TextField.tsx`, `text-area/TextArea.tsx`, `number-field/NumberField.tsx`, `select/Select.tsx`, `combo-box/ComboBox.tsx`, `multi-select/MultiSelect.tsx`, `date-range-picker/DateRangePicker.tsx`
- Modify: `packages/react/src/index.ts`, `.size-limit.json`
- Test: `packages/react/src/date-picker/DatePicker.test.tsx`, `packages/react/src/field/FieldChangedMark.test.tsx` (create); `useChangedDescription.test.tsx`, each framed field's test (a row: changed and unlabelled draws the mark and is described by it; invalid removes it), `DateRangePicker.test.tsx` (unchanged, still passing), the server suites
- Create (stories): `packages/react/src/date-picker/DatePicker.stories.tsx`; Modify: `RightToLeft.stories.tsx` (`DatePickerMirrored`)
- Create: `packages/core/src/components/date-picker.css`; Modify: `styles.css`, `packages/core/src/components/field.css` (the mark), the framed fields' files only where the mark's inline-end offset or the frame's padding needs their own value (`input.css`, `textarea.css`, `number-field.css`, `select.css`, `combo-box.css`, `multi-select.css`, `date-range-picker.css`)
- Test: `css.test.js`, `contrast.test.js`
- Create: `apps/docs/content/docs/components/date-picker.mdx`, `apps/docs/examples/date-picker-basic.tsx`, `date-picker-presets.tsx`, `date-picker-review-grid.tsx`, `field-changed-unlabelled.tsx`
- Modify: `apps/docs/content/docs/components/field.mdx` (`## Changed, with no label`), `meta.json`, `examples/index.ts`, `home-page.tsx` (the footer's "Date picker" after "Data table"; the catalog's "Date picker" chip becomes `<Link className="chip" href="/docs/components/date-picker">`), both READMEs
- Test: `components.spec.ts`, `home.spec.ts` (23 linked chips)
- Modify: `docs/design-system.md` (`## DatePicker`; `## Field parts` gains "The changed dot")
- Create (Docker step): 42 baselines. None changes: the fields gain an attribute and a mark only while changed and unlabelled, which no existing story draws.

**Interfaces:**

- Consumes: React Aria's `DatePicker`, `DateInput`, `DateSegment`, `Group` context, `Calendar`, `Dialog`, `Button`, `CalendarStateContext` (the mark clips its own text, so no `VisuallyHidden`); `CalendarHeader`, `CalendarDays`, `useCalendarDates`, `DEFAULT_CALENDAR_LABELS`, `invalidDate`, `parseIso`, `toIso`; `FieldHead`, `Description`, `FieldError`, `useChangedDescription`; `Popover` with `isPadded`; Lucide `CalendarDays`.
- Produces, exported from `@snapshot-ui/react`: `DatePicker`, `DatePickerProps`, `DatePickerBaseProps`, `DatePickerLabels`, `DatePreset`, spec 8.1's types unchanged (with `labels.open` defaulting to 'Choose date').
- Internal: `DateFrame({ className, isDisabled, children })`; `CalendarDatePresets({ presets, label, bounds })`; `FieldChangedMark({ id, label })`; `useChangedDescription({ isChanged, isInvalid, describedBy, isLabelled })` returning `{ chipId, markId, describedBy }`, where `describedBy` adds `chipId` while changed, valid and labelled, and `markId` while changed, valid and unlabelled.
- Later tasks rely on: the review grid example (Task 5 adds a SaveBar under it; Task 8's recipe).

**Behavior:**

1. **The shared frame.** `DateFrame` is `DateRangeFrame` (the picker's group props from `GroupContext` on a plain `div`, less the ref and the states) with `className` `input ${className}`; DateRangePicker passes `date-range-control` and DatePicker `date-picker-control`. `drawSegment` and `noSegment` move with it. DateRangePicker's tests pass unchanged.
2. **DatePicker markup**, spec 8.2: `RACDatePicker.field.date-picker` (`data-changed`, `data-unlabelled`), the `FieldHead` while labelled, `DateFrame` holding `DateInput.date-picker-input` of `drawSegment` after hydration and `span.date-picker-face` with `valueLabel` before it, and `Button.input-button.date-picker-button` (`labels.open`, Lucide `CalendarDays`) and, inside the frame after the button, the `FieldChangedMark` while changed, valid and unlabelled; then `Description`; `FieldError`; `Popover.date-picker-popover` (`isPadded`, `placement` default `'bottom start'`) holding `Dialog` holding `RACCalendar.calendar` with `CalendarHeader`, `CalendarDatePresets` and `CalendarDays`.
3. **Values**: `value` and `defaultValue` parsed with `parseIso`, an invalid one warned through `invalidDate('DatePicker', ...)` and read as none; `onChange` with `toIso(date)` once complete and valid, `null` when cleared; `validate` given ISO; `minValue`, `maxValue`, `isDateUnavailable` and `today` through `useCalendarDates`; `placeholderValue` the app's today so the calendar opens on the value's month, else today's; `granularity="day"`; the hidden input holds the ISO date in both passes (React Aria's).
4. **Presets**: `CalendarDatePresets` reads `CalendarStateContext`, draws `ToggleButton.calendar-preset`s in a `group` named `labels.presets`, pressed for the chosen day, disabled out of bounds or unavailable, and a press sets the value and the focused date (closing the popover through `shouldCloseOnSelect`); an invalid preset date warns once and is left out.
5. **Closing** returns focus to the button (React Aria's), on a choice, a preset and Escape.
6. **In a grid**: named by `aria-label` or `aria-labelledby`; compact density draws the 36px field; inside a DataTable cell the segments are editable spinbuttons, which DataTable's guard leaves alone (R8).
7. **The changed mark**, every framed field: the field writes `data-unlabelled` while it has no label (TextField, TextArea and Select gain it); while changed and unlabelled it renders `FieldChangedMark` (`span.field-changed-mark[id]` holding `changedLabel`, default 'Changed', inside the frame where the frame is an element that can hold one, and as the field root's next child after the control where the control is the frame, TextField's `input` and TextArea's `textarea`), which returns `null` while `FieldErrorContext` says invalid; `useChangedDescription` names it in `aria-describedby`.
8. **The face's size**: the frame is at its final size before hydration, so nothing moves when the segments arrive.

**CSS:** `date-picker.css`: `.date-picker-control` as `.date-range-control` (flex, `padding-inline: 1.5rem 3rem`, `cursor: text`) with `min-inline-size: 12rem` and the field's `inline-size: 100%` up to `--container-field`; `.date-picker-input` as `.date-range-input`; the segment rules are `date-range-picker.css`'s (`.date-segment`), shared, not repeated; the face's padding; disabled taupe; the popover's inset as `.date-range-popover`'s; forced colors as DateRangePicker's. `field.css`: `.field-changed-mark` (`position: absolute`, `inline-size: 0.375rem`, `block-size: 0.375rem`, `inset-block-start: calc((var(--size-field) - 0.375rem) / 2)`, `inset-inline-end: var(--field-changed-mark-end, 1.5rem)`, `border-radius: var(--radius-dot)`, `background-color: var(--color-clay)`, `overflow: hidden`, `color: transparent`, `white-space: nowrap`, `pointer-events: none`); `.field:has(> .field-changed-mark)` and each frame that holds one `position: relative`; each field's file sets `--field-changed-mark-end` (a field with an end button: `calc(0.375rem + 2.25rem + var(--spacing-part))`, past the 36px button inset 6px; a field without one: its text's own inline padding) and grows the frame's inline-end padding by `calc(0.375rem + var(--spacing-part))` under `.field[data-changed][data-unlabelled]`; forced colors, `forced-color-adjust: none; background-color: canvastext`.

**Keys** (the page's table): spec 8.2's.

**Tests, written first:**

- `DatePicker.test.tsx`: `it('commits a typed complete date as ISO and null when cleared')`; `it('opens the calendar on Alt+Arrow Down and on the button, on the value's month else today's')`; `it('closes on a day and on a preset, with focus on the button')`; `it('draws presets pressed for the chosen day and disabled out of bounds')`; `it('writes the hidden ISO input')`; `it('shows valueLabel and no segments on the server, and segments after hydration')`; `it('warns once for an invalid value, defaultValue or preset date')`; `it('passes validate an ISO date')`; `it('draws the chip with a label, and the mark and its description without one')`; `it.each(AXE_CASES)`: default, with a value, invalid, disabled, open, open with presets, unlabelled and changed.
- `FieldChangedMark.test.tsx`: renders its label with its id; renders nothing inside an invalid field.
- `useChangedDescription.test.tsx`: the four combinations of labelled and changed, and invalid.
- Each framed field's test, one row each: `it('marks a changed field with no label, and reads the mark after its name')`, and `it('drops the mark while invalid')`.
- Server suites: DatePicker under the three locales and two zones, its face and its hidden input; hydration with no recoverable error.
- `css.test.js`: `describe('src/components/date-picker.css')` (the frame's padding and minimum, no segment rule of its own, disabled, forced colors); `describe('src/components/field.css')` gains `it('draws the changed mark as a 6px clay dot on the frame's first line, its text clipped')` and `it('draws the mark canvastext in forced colors')`; each framed field's describe gains its offset and padding.
- `contrast.test.js`, `describe('the changed dot')`: cites clay on raised (7.04, 6.02) and on float, gated; measures light signal orange on raised (2.87 in light) and records why it is not used.
- Stories, `Components/DatePicker`: `Default` (tags `['density']`), "Date", a description; `WithValue` (`2026-10-14`); `Open` (play presses the button with `today="2026-10-16"`); `WithPresets` (open, "Today" and "Yesterday"); `Invalid`; `Disabled`; `ReviewGrid` (tags `['density']`): three rows, each an unlabelled DatePicker, NumberField, TextField and Select named by `aria-labelledby` of the column's header and the row's name, two changed, one invalid; `RightToLeft` (`fa-IR`, Persian digits after hydration). `no-visual`: `Keys` (`webkit`, `firefox`; `focusOn` the first segment, guarded `press`), `InTableCell` (`webkit`, `firefox`; a DataTable of three rows with a DatePicker column: Arrow Up changes the focused segment, Arrow Right moves between segments, digits type, J types nothing and moves no row), `CloseReturnsFocus`.
- `RightToLeft.stories.tsx`, `DatePickerMirrored`: the button is at the frame's left; the segments keep the locale's order.
- Docs end-to-end: `LONG_TARGETS['date-picker'] = ['.stage .date-picker .field-label']`; `SERVER_RENDERED['date-picker'] = ['.stage .date-picker-control', '.stage .date-picker-button']`; `test('the date picker example opens on today and closes with focus on its button')`; `home.spec.ts`: 23 linked chips, its comment naming Date picker.

**Docs:**

- `date-picker.mdx`, title "Date picker", description "One date, typed or chosen on a calendar, in and out as an ISO date.", icon `CalendarDays`. Sections: `## Basic` (`date-picker-basic`), `## Presets` (`date-picker-presets`: days you name, computed from your own today), `## In a review grid` (`date-picker-review-grid`: a field per cell named by its column and row; the changed dot), `## Usage` (ISO in and out, Gregorian whatever the calendar shown; `today` from your user's time zone; `valueLabel` for the server's HTML; `aria-label` or `aria-labelledby` in a grid), Props, Accessibility (the group, the segments, the button, the calendar; React Aria's announcements are English, R9; the Keys table), Design rules.
- `field.mdx`, `## Changed, with no label` (`field-changed-unlabelled`).
- `docs/design-system.md`, `## DatePicker`: the shared frame, the minimum width, the face, the popover, the presets, forced colors; `## Field parts`, "The changed dot": clay and why (spec correction 2), its measured pairs, its place and the frame's padding, the hidden word, why it leaves while invalid.

**Steps:** as Task 1, with the Storybook filter `DatePicker TextField NumberField Select ComboBox MultiSelect DateRangePicker TextArea`. Size-limit `{ DatePicker }` at 4 kB; the framed fields' entries measured again and kept or raised by the rule with the reason. Step 6 reads the WebKit and Firefox results for `Keys` and `InTableCell`.

```bash
git add "apps/docs/app/(home)/home-page.tsx" apps/docs/content/docs/components/date-picker.mdx apps/docs/content/docs/components/field.mdx apps/docs/content/docs/components/meta.json apps/docs/examples/date-picker-basic.tsx apps/docs/examples/date-picker-presets.tsx apps/docs/examples/date-picker-review-grid.tsx apps/docs/examples/field-changed-unlabelled.tsx apps/docs/examples/index.ts apps/docs/tests/components.spec.ts apps/docs/tests/home.spec.ts docs/design-system.md packages/core/README.md packages/core/src/components/combo-box.css packages/core/src/components/date-picker.css packages/core/src/components/date-range-picker.css packages/core/src/components/field.css packages/core/src/components/input.css packages/core/src/components/multi-select.css packages/core/src/components/number-field.css packages/core/src/components/select.css packages/core/src/components/textarea.css packages/core/src/styles.css packages/core/test/contrast.test.js packages/core/test/css.test.js packages/react/.size-limit.json packages/react/README.md packages/react/src/calendar packages/react/src/combo-box packages/react/src/date-picker packages/react/src/date-range-picker packages/react/src/field packages/react/src/index.ts packages/react/src/multi-select packages/react/src/number-field packages/react/src/rtl/RightToLeft.stories.tsx packages/react/src/select packages/react/src/text-area packages/react/src/text-field packages/react/test/hydration.test.tsx packages/react/test/server-face.test.tsx packages/react/test/server-render.test.tsx
git commit -m "feat: add DatePicker, and mark a changed field that has no label"
git push origin feat/documents
```

- [ ] **Step 7: Visual baselines** (owner action 2). Expected: 42 new files: `components-datepicker--{default,review-grid}--{light-rounded,dark-rounded,light-soft,light-square,light-rounded-375,light-rounded-compact}.png` and `components-datepicker--{with-value,open,with-presets,invalid,disabled,right-to-left}--{light-rounded,dark-rounded,light-soft,light-square,light-rounded-375}.png`, and no changed file. What to look at: the pill frame with the segments and the calendar button; the popover on October 2026 with the 16th marked; the presets above the grid; the grid's changed fields with the light signal orange edge and a clay dot before the button or at the text's end, never under typed text; the invalid one with its red edge and no dot.

---

### Task 5: SaveBar

**Goal:** a sticky footer for a form or a review: a sentence about what will be saved, the clay chip while dirty, a status said politely, Cancel guarded by a discard question while dirty, the app's secondary actions, and a primary action whose label the app writes and whose promise keeps the bar pending; it rides inside its holder at the viewport's bottom, keeps a focused field clear of itself, warns before an unload while dirty, and lifts the tray and the toasts by `--save-bar-offset`. Implements spec 9 and 12 (the save bar's part), rulings 12 and 17 to 19, section 13.2 items 14 to 16, section 13.3 items 4 to 6, spec corrections 12 and 13, risks R6, R7 and R10, and the `save-bar` page and record.

**Files:**

- Create: `packages/react/src/save-bar/SaveBar.tsx`, `index.ts`, `packages/react/src/utils/useBottomBarOffset.ts`
- Modify: `packages/react/src/index.ts`, `.size-limit.json`
- Test: `packages/react/src/save-bar/SaveBar.test.tsx`, `packages/react/src/utils/useBottomBarOffset.test.tsx` (create); the server suites; `empty-parts.test.tsx`
- Create (stories): `packages/react/src/save-bar/SaveBar.stories.tsx`; Modify: `RightToLeft.stories.tsx` (`SaveBarMirrored`)
- Create: `packages/core/src/components/save-bar.css`; Modify: `styles.css`
- Test: `css.test.js`, `contrast.test.js`
- Create: `apps/docs/content/docs/components/save-bar.mdx`, `apps/docs/examples/save-bar-form.tsx`, `save-bar-in-side-panel.tsx`
- Modify: `apps/docs/examples/date-picker-review-grid.tsx` (a SaveBar under the grid: "Confirm and review next (2 left)"), `meta.json`, `examples/index.ts`, `home-page.tsx` (the footer's "Save bar" after "Radio group"; the catalog's "Save bar" chip becomes a link), both READMEs
- Test: `components.spec.ts`, `home.spec.ts` (24 linked chips)
- Modify: `docs/design-system.md` (`## SaveBar`)
- Create (Docker step): 52 baselines. None changes.

**Interfaces:**

- Consumes: `Button` (`isPending`, `pendingLabel`), `FieldChanged`, `useConfirm`, `useBeforeUnload` (Task 3), `QUIET_MS`, `UploadTray` and `BottomTabBar` in stories; Lucide `CircleAlert`.
- Produces, exported from `@snapshot-ui/react`: `SaveBar`, `SaveBarProps`, `SaveBarLabels`, spec 9.1's types unchanged.
- Internal: `useBottomBarOffset(ref)`: while the element is mounted and `ResizeObserver` exists, writes `calc(${height}px + var(--spacing-inset))` as `--save-bar-offset` inline on `document.documentElement` and on `element.closest('.app-shell')`, and removes both on unmount (spec correction 13).
- Later tasks rely on: `useBottomBarOffset` for DataTable's bar (Task 7); SaveBar in the recipe (Task 8).

**Behavior:**

1. **Markup**, spec 9.2: `div.save-bar[role="group"][aria-labelledby]` (`className`, `ref`), holding `div.save-bar-text` (`FieldChanged` with `labels.unsaved` while dirty, its class `save-bar-chip` beside `field-changed`, then `span.save-bar-message[id]`), `div.save-bar-status[role="status"]` (mounted empty), and `div.save-bar-actions` (the tertiary Cancel while `onCancel` is given, `secondaryActions`, the primary `Button` with `actionLabel`). DOM order is the reading and tab order.
2. **The action.** A press calls `onAction`; a returned promise shows the action's pending spinner (`pendingLabel`, default 'Saving') and disables Cancel until it settles; a rejection keeps the bar and is reported through `reportError`, as ConfirmDialog's `onConfirm` (`dialog/ConfirmDialog.tsx`). `isPending` does the same for work the app tracks. The library never disables the action.
3. **The status host** says each change of `status` politely, and `labels.pending` once the pending state has held for `QUIET_MS`; a fast save says nothing. `statusTone="error"` draws `--color-error` with a 16px `CircleAlert`.
4. **Cancel and the guard.** Clean: a press calls `onCancel`. Dirty: a press asks through the bar's own `useConfirm` (`discardTitle`, `discardDescription`, tone `danger`, `discardConfirm`, `discardKeep`), and yes calls `onCancel`; no returns focus to Cancel (useConfirm's run).
5. **Leaving the page**: `useBeforeUnload(warnsOnUnload && isDirty)`.
6. **The offsets.** `save-bar.css` declares, on `:root:has(.save-bar)` and on `.app-shell:has(.save-bar)`, `--save-bar-offset: calc(var(--size-control) + 2 * var(--spacing-part) + 2px + var(--spacing-inset))`, the one-line bar's height plus the inset; `useBottomBarOffset` writes the measured height after hydration. On `:root:has(.save-bar)` it also sets `scroll-padding-block-end: calc(var(--toast-offset-block, 0px) + var(--save-bar-offset))` (spec correction 12).
7. **Focus not obscured** (R6). The `FocusClear` play focuses a field that sits under the bar, with Tab and with `focus()`, in three engines, and asserts the field's bottom is above the bar's top. Where an engine leaves it covered, the bar adds the two-frame scroll clear DataTable uses for its bar (`data-table/scroll.ts`), in a `focusin` listener on its holder, and the record says which engine needed it.
8. **Mod+S** is not taken (section 13.3 item 6).

**CSS** (`save-bar.css`), spec 9.3: the float surface, `padding-block: var(--spacing-part)`, `padding-inline: var(--spacing-inset) var(--spacing-part)`, `margin-block-start: var(--spacing-peer)`; `position: sticky; inset-block-end: calc(var(--app-shell-inset-block-end, 0px) + var(--spacing-inset)); z-index: calc(var(--z-header) - 1)`; `container: save-bar / inline-size`; one row, the text and status `flex: 1`, the message clamped to two lines (`-webkit-line-clamp: 2`); `@container save-bar (width < 36rem)` two lines, the actions at the end; `(width < 24rem)` each button full width, stacked in DOM order; the message at `--text-small` 450 ink; the status `--text-small`, slate, or error with its icon; the offsets and the scroll padding above; forced colors (the edge `canvastext`).

**Keys** (the page's table): spec 9.2's.

**Tests, written first:**

- `SaveBar.test.tsx`: `it('is a group named by its message, in reading order: chip, message, status, Cancel, secondary, action')`; `it('shows the chip only while dirty')`; `it('calls onCancel at once while clean')`; `it('asks before onCancel while dirty, and gives focus back to Cancel on no')`; `it('keeps the action pending while its promise runs and disables Cancel')`; `it('reports a rejected action through reportError and stays')`; `it('honors isPending')`; `it('says labels.pending only after QUIET_MS of pending')` (fake timers); `it('says each change of status politely')`; `it('draws the error tone with its icon')`; `it('never disables the action')`; `it('warns before unload only while dirty and warnsOnUnload')`; `it.each(AXE_CASES)`: clean, dirty, pending, error status, the discard question.
- `useBottomBarOffset.test.tsx` (a stubbed `ResizeObserver`): writes on the root and the closest shell, and removes both on unmount.
- Server suites: SaveBar's bar, sentence, chip, buttons and empty status in the server's HTML.
- `empty-parts.test.tsx`: no secondary wrapper for `secondaryActions={null}`; no status text for `status=""`.
- `css.test.js`, `describe('src/components/save-bar.css')`: the surface; the sticky offset and z-index as the bulk bar's; the 36rem and 24rem container rules; `--save-bar-offset` from tokens on the root and the shell; the root's scroll padding; forced colors.
- `contrast.test.js`, `describe('the save bar')`: cites ink, slate, clay and error on float, gated.
- Stories, `Components/SaveBar`, each under a short form in a box `width: min(48rem, 100%)`: `Default` (tags `['density']`), "2 changes to Corner Mart, 14 Oct", Cancel and Save; `Dirty`; `Review` ("Confirm and review next (2 left)" with a secondary "Skip"); `Pending`; `ErrorStatus` ("Couldn't save. Try again."); `Narrow` (a 30rem and a 22rem box, one above the other); `RightToLeft`; `InForm` (`viewport-desktop`): a form taller than the window, the bar stuck at the bottom over its fields; `Phone` (`viewport-phone`): in the shell fixture with a BottomTabBar; `BottomEdge` (`viewport-phone`) and `BottomEdgeWide` (`viewport-desktop`): the tab bar (phone), a save bar, the tray (Task 3) with three items, and two toasts, stacked in spec 12's order. `no-visual`: `CancelGuard` (`webkit`, `firefox`), `FocusClear` (`webkit`, `firefox`; R6, scroll put back in `finally`), `PendingStatus`, `OffsetMeasured` (asserts `--save-bar-offset` on the root after a two-line wrap is taller than the token's value).
- `RightToLeft.stories.tsx`, `SaveBarMirrored`: the actions at the bar's left.
- Docs end-to-end: `LONG_TARGETS['save-bar'] = ['.stage .save-bar-message']`; `SERVER_RENDERED['save-bar'] = ['.stage .save-bar', '.stage .save-bar-status[role="status"]']`; `test('Cancel on a dirty save bar asks, and Keep editing returns focus to Cancel')`; `test('a focused last field scrolls clear of the save bar')`; `home.spec.ts`: 24 linked chips.

**Docs:**

- `save-bar.mdx`, title "Save bar", description "A sticky footer for a form or a review: what will be saved, a guarded Cancel and your action.", icon `Save`. Sections: `## A form` (`save-bar-form`), `## A review` (the review grid example, now with its bar), `## In a side panel` (`save-bar-in-side-panel`: SidePanel's `onCloseRequest` refuses a close while dirty), `## Usage` (the last child of the form's holder; always shown, dirty adds the chip and the guard; `status` is for states and a successful save is a `toast({ tone: 'success' })`; the action is never disabled: answer the press with a `status`; `beforeunload` and that client links are not guarded (section 13.3 item 5); one sticky bar per page; sticking inside a scrolling ancestor, R10; a Mod+S shortcut is your own listener that calls your action, with a short code block), Props, Accessibility (a group named by its message; the polite status; the discard question; focus not obscured; the Keys table), Design rules (dos: say what will be saved, name the action's outcome; donts: never signal orange, never "OK", never disable the action).
- `docs/design-system.md`, `## SaveBar`: one object with the bulk bar, the float level and why, the sticky rule, the two container widths, the chip, the status, the offset and the scroll padding (spec corrections 12 and 13), R6's per-engine result, forced colors.

**Steps:** as Task 1, with the Storybook filter `SaveBar`. Size-limit `{ SaveBar }` at 3 kB. Step 6 reads the WebKit and Firefox results for `CancelGuard` and `FocusClear`.

```bash
git add "apps/docs/app/(home)/home-page.tsx" apps/docs/content/docs/components/meta.json apps/docs/content/docs/components/save-bar.mdx apps/docs/examples/date-picker-review-grid.tsx apps/docs/examples/index.ts apps/docs/examples/save-bar-form.tsx apps/docs/examples/save-bar-in-side-panel.tsx apps/docs/tests/components.spec.ts apps/docs/tests/home.spec.ts docs/design-system.md packages/core/README.md packages/core/src/components/save-bar.css packages/core/src/styles.css packages/core/test/contrast.test.js packages/core/test/css.test.js packages/react/.size-limit.json packages/react/README.md packages/react/src/index.ts packages/react/src/rtl/RightToLeft.stories.tsx packages/react/src/save-bar packages/react/src/utils/useBottomBarOffset.test.tsx packages/react/src/utils/useBottomBarOffset.ts packages/react/test/empty-parts.test.tsx packages/react/test/hydration.test.tsx packages/react/test/server-face.test.tsx packages/react/test/server-render.test.tsx
git commit -m "feat: add SaveBar"
git push origin feat/documents
```

- [ ] **Step 7: Visual baselines** (owner action 2). Expected: 52 new files: `components-savebar--default--{light-rounded,dark-rounded,light-soft,light-square,light-rounded-375,light-rounded-compact}.png`, `components-savebar--{dirty,review,pending,error-status,narrow,right-to-left}--{light-rounded,dark-rounded,light-soft,light-square,light-rounded-375}.png`, `components-savebar--{in-form,bottom-edge-wide}--{light-rounded,dark-rounded,light-soft,light-square}.png` and `components-savebar--{phone,bottom-edge}--{light-rounded-375,dark-rounded-375,light-soft-375,light-square-375}.png`. What to look at: the float bar under the form with the sentence at the start and the ink action at the end; the clay chip only while dirty; the pending spinner; the red status with its icon; two lines under 36rem and stacked buttons under 24rem; at 375, from the bottom: the tab bar, the save bar, the tray's pill bar, the toasts; at 1280, the tray above the save bar's offset and the toasts above the tray.

---

### Task 6: PageHeader and Breadcrumbs

**Goal:** a page's header, static, in the docs header's layout on tokens: breadcrumbs, an eyebrow, the page's one `h1`, a sentence and actions that wrap under the title; and a trail of links written by hand, the current page as text, one "Back to" link on a phone. Implements spec 10, rulings 20 to 23, section 13.2 items 17 and 18, section 13.3 item 7, spec correction 8, and the `page-header` and `breadcrumbs` pages and records.

**Files:**

- Create: `packages/react/src/page-header/PageHeader.tsx`, `index.ts`; `packages/react/src/breadcrumbs/Breadcrumbs.tsx`, `index.ts`
- Modify: `packages/react/src/index.ts`, `.size-limit.json`
- Test: `packages/react/src/page-header/PageHeader.test.tsx`, `packages/react/src/breadcrumbs/Breadcrumbs.test.tsx` (create); `server-components.test.tsx` (PageHeader's `STATIC` rows and module); the server suites (Breadcrumbs); `empty-parts.test.tsx`
- Create (stories): `PageHeader.stories.tsx`, `Breadcrumbs.stories.tsx`; Modify: `RightToLeft.stories.tsx` (`PageHeaderMirrored`, `BreadcrumbsMirrored`)
- Create: `packages/core/src/components/page-header.css`, `breadcrumbs.css`; Modify: `styles.css`
- Test: `css.test.js`, `contrast.test.js`
- Create: `apps/docs/content/docs/components/page-header.mdx`, `breadcrumbs.mdx`, `apps/docs/examples/page-header-basic.tsx`, `page-header-documents.tsx`, `breadcrumbs-basic.tsx`
- Modify: `apps/docs/examples/file-drop-zone-page.tsx` (its FileButton moves into a PageHeader's actions), `meta.json`, `examples/index.ts`, `home-page.tsx` (the footer's "Breadcrumbs" after "Bottom tab bar" and "Page header" after "Number field"), both READMEs
- Test: `components.spec.ts`
- Modify: `docs/design-system.md` (`## PageHeader`, `## Breadcrumbs`)
- No change: the docs site's own header (section 13.3 item 7).
- Create (Docker step): 40 baselines. None changes.

**Interfaces:**

- Consumes: `Heading`, `Eyebrow`, `Text`, `Link`, `useWarnOnce`; Lucide `ChevronRight`, `ChevronLeft`.
- Produces, exported from `@snapshot-ui/react`: `PageHeader`, `PageHeaderProps` (spec 10.1 unchanged); `Breadcrumbs`, `BreadcrumbsProps`, `Breadcrumb`, `BreadcrumbProps`, with spec correction 8:

```ts
export interface BreadcrumbsProps {
  /** Breadcrumb elements, from the top of the trail to the current page. */
  children: ReactNode;
  /** The navigation landmark's name. @default 'Breadcrumbs' */
  'aria-label'?: string;
  /** The narrow face's link name, given the parent's text (ruling 22). @default (parent) => `Back to ${parent}` */
  backLabel?: (parent: string) => string;
  className?: string;
  ref?: Ref<HTMLElement>;
}

export interface BreadcrumbProps {
  /** The page's URL. The last crumb, the current page, takes none and draws as text (ruling 21). */
  href?: string;
  /** The crumb's text. */
  children: string;
  className?: string;
}
```

**Behavior:**

1. **PageHeader** (static, no directive): `header.page-header` (rest props, `className`, `ref`) holding `div.page-header-titles` (the `breadcrumbs` node, `Eyebrow` while present, `Heading level={1} size={2} className="page-header-title"`, and `Text` muted `className="page-header-description"` while present) and `div.page-header-actions` while `present(actions)`. It never sticks by itself (ruling 20).
2. **Breadcrumbs** (client): reads its children with `Children.toArray` and keeps the `Breadcrumb` elements; writes `nav.breadcrumbs[aria-label]` (`ref`, `className`) holding `ol.breadcrumbs-list` of `li.breadcrumbs-item` (each crumb's `className`), each but the last a `Link.breadcrumbs-link` to its `href` with its text in `span.breadcrumbs-text[title]` and then `span.breadcrumbs-separator[aria-hidden="true"]` (Lucide `ChevronRight`), and the last `span.breadcrumbs-current[aria-current="page"]`. A crumb before the last without `href` is text and warns once. Then, with two crumbs or more, `Link.breadcrumbs-back` to the parent's `href`, with Lucide `ChevronLeft`, named and written `backLabel(parent)`. `Breadcrumb` renders nothing by itself and warns once when rendered outside `Breadcrumbs`.
3. **The faces** switch by `@media (width < 768px)`; the hidden one is `display: none`, out of the accessibility tree. With one crumb the narrow face draws nothing.
4. **Server rendering.** Both faces are real `<a href>` links in the server's HTML, so the trail works before hydration and with scripts off; the library's Link takes the click through the router once hydrated. Nothing is a collection, so nothing is drawn again after hydration.

**CSS:** `page-header.css`, spec 10.3: the flex row, its padding (`var(--spacing-separate) var(--spacing-separate) var(--spacing-peer)`, and `var(--spacing-inset)` under 768px), the titles' grid, the title's `--text-h2` at 500 with -2% tracking and wrapping, the description's measure `var(--container-field)` and slate, the actions' wrap and their own line at the inline start under 768px, no rule beneath, the fill `color-mix(in srgb, var(--color-canvas) 80%, transparent)` with the blur under `@supports (backdrop-filter: blur(1px))` else the canvas, forced colors (`canvas`, no blur). `breadcrumbs.css`, spec 10.3: `--text-small` 450; links slate and underlined, ink on hover inside `@media (hover: hover)`; the current crumb ink at 500, not underlined; separators 16px slate with `var(--spacing-part)` either side, `scale: -1 1` under `[dir='rtl']`; each crumb's text ellipsized past 16rem; a 40px hit through `::after` extended by `calc((40px - 1lh) / 2)`, the menu row buttons' technique; the back link likewise, its chevron mirrored; the 768px switch; forced colors (`linktext`, `canvastext`).

**Keys** (Breadcrumbs' table): Tab through each crumb's link, the current page not a stop; Enter on a crumb follows it through the router.

**Tests, written first:**

- `PageHeader.test.tsx`: the `h1` at size 2; the slots' order (breadcrumbs, eyebrow, title, description) and the actions after; no wrapper for absent slots; `className`, `ref` and rest props; `it.each(AXE_CASES)`: the title alone; every slot; inside `<main>`.
- `server-components.test.tsx`: `STATIC` rows for PageHeader with a title and with every static slot; `STATIC_MODULES` gains `'page-header/PageHeader.tsx'`.
- `Breadcrumbs.test.tsx`: `it('is a navigation landmark named Breadcrumbs, holding a list')`; `it('links every crumb but the last, through the router')`; `it('writes the last crumb as text with aria-current page, not a tab stop')`; `it('writes a separator after every crumb but the last, hidden from assistive technology')`; `it('draws the back link to the parent, named by backLabel')`; `it('draws no back link with one crumb')`; `it('keeps the full text in a title')`; `it('warns once for a crumb without href before the last, and for a Breadcrumb outside Breadcrumbs')`; `it('writes real links in the server HTML')`; `it.each(AXE_CASES)`: three crumbs; one crumb; inside a PageHeader.
- `css.test.js`: `describe('src/components/page-header.css')` (the padding steps, the phone padding at the 768px literal, the title's step and tracking, the description's measure, no border, the fill and its `@supports`, forced colors); `describe('src/components/breadcrumbs.css')` (the link and current colors, the separator and its mirroring, the 16rem ellipsis, the 40px hit, the 768px switch, forced colors).
- `contrast.test.js`, `describe('the page header')`: cites slate and ink on canvas and lifted, gated; measures slate on the canvas at 80% over canvas (4.84, 7.26), over lifted (4.93, 7.22) and over solid ink (3.16, 5.03), recorded with the blur's reason.
- Stories, `Components/PageHeader`: `Full` (tags `['density']`): a trail, "Documents", "Receipts, 2026", a sentence, an Upload FileButton and a Menu; `TitleOnly`; `LongTitle` (wraps, the actions under it); `RightToLeft`; `InAppShell` (`viewport-desktop`): in the shell fixture's header slot, the page scrolled under it. `Components/Breadcrumbs`: `Trail` (three crumbs; at 375 the back link); `LongTrail` (six crumbs, one past 16rem); `RightToLeft`. `no-visual`: `CurrentNotAStop`, `BackLinkName`, `RouterNavigation`.
- `RightToLeft.stories.tsx`: `PageHeaderMirrored` (actions at the left), `BreadcrumbsMirrored` (separators point left).
- Docs end-to-end: `LONG_TARGETS['page-header'] = ['.stage .page-header-title', '.stage .page-header-description']`; `LONG_TARGETS.breadcrumbs = ['.stage .breadcrumbs-text']`; `SERVER_RENDERED['page-header'] = ['.stage .page-header h1']`; `SERVER_RENDERED.breadcrumbs = ['.stage .breadcrumbs a[href]']`; `test('a crumb navigates through the router, and at 375 the trail is one back link')`; in forced colors, `test('the current crumb is canvastext and the links linktext')`.

**Docs:**

- `page-header.mdx`, title "Page header", description "A page's title, with its trail, category, a sentence and actions.", icon `PanelTop`. Sections: `## Basic` (`page-header-basic`, a server file), `## A documents page` (`page-header-documents`: a trail, an Upload FileButton in the actions, the pair with a PageDropZone), `## Usage` (static; the page's one `h1`; sticky only in AppShell's `header` slot, and then without a description on a phone; actions wrap, and many actions end with a Menu), Props, Accessibility (a `header`, its `h1`; a banner only outside `main`), Design rules.
- `breadcrumbs.mdx`, title "Breadcrumbs", description "Where a page sits, as links to the pages above it, and one back link on a phone.", icon `ChevronsRight`. Sections: `## Basic` (`breadcrumbs-basic`, a server file), `## Usage` (the current page last, without `href`; links through your RouterProvider; long trails wrap; the narrow face), Props, Accessibility (a navigation landmark, `aria-current`, the back link's name, the Keys table), Design rules.
- `docs/design-system.md`, `## PageHeader` (the docs header on tokens, its paddings and where 20px became the peer step, the title's step, the fill and its measured pairs, no rule beneath, ruling 20, the next batch's dogfooding, section 13.3 item 7) and `## Breadcrumbs` (slate links and why not link blue, the current crumb, separators and mirroring, the 40px hit, the back link, why it is written by hand, spec correction 8).

**Steps:** as Task 1, with the Storybook filter `PageHeader Breadcrumbs`. Size-limit `{ PageHeader }` at 1 kB and `{ Breadcrumbs, Breadcrumb }` at 1.5 kB (it carries Link).

```bash
git add "apps/docs/app/(home)/home-page.tsx" apps/docs/content/docs/components/breadcrumbs.mdx apps/docs/content/docs/components/meta.json apps/docs/content/docs/components/page-header.mdx apps/docs/examples/breadcrumbs-basic.tsx apps/docs/examples/file-drop-zone-page.tsx apps/docs/examples/index.ts apps/docs/examples/page-header-basic.tsx apps/docs/examples/page-header-documents.tsx apps/docs/tests/components.spec.ts docs/design-system.md packages/core/README.md packages/core/src/components/breadcrumbs.css packages/core/src/components/page-header.css packages/core/src/styles.css packages/core/test/contrast.test.js packages/core/test/css.test.js packages/react/.size-limit.json packages/react/README.md packages/react/src/breadcrumbs packages/react/src/index.ts packages/react/src/page-header packages/react/src/rtl/RightToLeft.stories.tsx packages/react/test/empty-parts.test.tsx packages/react/test/hydration.test.tsx packages/react/test/server-components.test.tsx packages/react/test/server-face.test.tsx packages/react/test/server-render.test.tsx
git commit -m "feat: add PageHeader and Breadcrumbs"
git push origin feat/documents
```

- [ ] **Step 7: Visual baselines** (owner action 2). Expected: 40 new files: `components-pageheader--full--{light-rounded,dark-rounded,light-soft,light-square,light-rounded-375,light-rounded-compact}.png`, `components-pageheader--{title-only,long-title,right-to-left}--{light-rounded,dark-rounded,light-soft,light-square,light-rounded-375}.png`, `components-pageheader--in-app-shell--{light-rounded,dark-rounded,light-soft,light-square}.png`, and `components-breadcrumbs--{trail,long-trail,right-to-left}--{light-rounded,dark-rounded,light-soft,light-square,light-rounded-375}.png`. What to look at: the docs header's layout, a 36px title (28px at 375) with the actions at its end or wrapped under it, no rule beneath; the trail in slate with chevrons and the current page in ink; at 375 one "Back to" link; in right to left the chevrons point left.

---

### Task 7: DataTable follow-ups: the table face beside a panel, and the bulk-action bar's overflow

**Goal:** keep the table face at 1440px beside an open SidePanel with `listBelow="32rem"`, and stop the bulk-action bar wrapping: Clear selection as an X icon at the bar's start, a place for the app's "Select all N matching", up to three promoted actions as buttons and the rest in a More menu, read at the press, with every action in More on a narrow bar. The bar writes `--save-bar-offset` as SaveBar does. Implements spec 11 and 12 (the bulk bar's part), rulings 24 and 25, section 13.2 item 20, section 13.3 item 8, spec corrections 14 and 18.

**Files:**

- Step 0 only: the merge of `origin/main` (Global Constraints, "Merging main", rule 3).
- Create: `packages/react/src/data-table/bulk-actions.ts`, `packages/react/src/data-table/BulkMenu.tsx`
- Modify: `packages/react/src/data-table/DataTable.tsx` (`listBelow`, `data-list-below`, the `bulkActions` union, `selectAllMatching`, `labels.moreActions`), `BulkBar.tsx` (the X icon with its Tooltip, `selectAllMatching`, the data form through `BulkMenu`, `useBottomBarOffset`), `packages/react/src/data-table/index.ts`, `packages/react/src/index.ts` (`DataTableBulkAction`), `.size-limit.json`
- Test: `packages/react/src/data-table/DataTable.bulk.test.tsx`, `bulk-actions.test.ts` (create); `DataTable.selection.test.tsx` (the Clear selection button is now an icon named the same; its assertions by name still hold, and one by text changes)
- Modify (stories): `packages/react/src/data-table/DataTable.stories.tsx`; `RightToLeft.stories.tsx` (`BulkBarMirrored`)
- Modify: `packages/core/src/components/data-table.css` (the 32rem block, the bar's layout and container rules)
- Test: `css.test.js`
- Modify: `apps/docs/content/docs/components/data-table.mdx` (`## Beside a side panel`, `## Bulk actions`), `apps/docs/examples/data-table-transactions.tsx` (`listBelow="32rem"`, the data form), Create: `apps/docs/examples/data-table-bulk-actions.tsx`; Modify: `examples/index.ts`
- Test: `components.spec.ts`, `apps/docs/tests/docs.spec.ts` (the recipe's bar)
- Modify: `docs/design-system.md` (`## DataTable`: the two follow-ups)
- Create (Docker step): 20 baselines; about 21 change (owner action 2).

**Interfaces:**

- Produces: spec 11's types: `DataTableBulkAction` (exported), `DataTableProps` gains `listBelow?: '40rem' | '32rem'` (default `'40rem'`), `bulkActions?: ReactNode | readonly DataTableBulkAction[]`, `selectAllMatching?: ReactNode`; `DataTableLabels` gains `moreActions` (default 'More actions').
- Internal: `isBulkActionData(value): value is readonly DataTableBulkAction[]` (spec correction 18); `isDrawn(element): boolean` (spec correction 14).

**Behavior:**

0. **Step 0.** Both #24 and #25 have merged; `git fetch origin main && git merge origin/main`; resolve; run Step 5; push. If either is open, stop and report (owner action 3).
1. **`listBelow`.** DataTable writes `data-list-below="32rem"` on its root for `'32rem'` and nothing for the default; `data-table.css` adds `@container data-table (width < 32rem)` rules equal to the 40rem block's face switch under `.data-table[data-list-below='32rem']`, and the 40rem block's switch is scoped to `:not([data-list-below='32rem'])`. The select mode, the scroll clears and the sticky offsets follow the face drawn, since DataTable reads the drawn face's computed `display` (`DataTable.tsx:213`). A `hideBelow: 'md'` column still leaves under 48rem.
2. **The bar's layout**, spec 11.2: `Toolbar.data-table-bar` (`container: data-table-bar / inline-size`) holding the X `IconButton` (ghost, Lucide `X`, `labels.clearSelection`, in a `TooltipTrigger` with a Tooltip of the same words), the count, `selectAllMatching` in `div.data-table-bar-select-all` while present, and then the actions: the node as 0.6.0 drew it in `div.data-table-bar-actions`, or the data form: the promoted actions (`isPromoted`, at most three; a fourth and later are not promoted and warn once) as secondary `Button`s with their icons, `data-action-id` on each, and `BulkMenu`.
3. **BulkMenu.** A `MenuTrigger` with an ellipsis `IconButton` named `labels.moreActions` and a `Menu` of `MenuItem`s. Its items are computed in `onOpenChange(true)` from the actions whose promoted button is not drawn at that moment (`isDrawn` on each `[data-action-id]` button in the bar) plus every unpromoted action; with none, More is not drawn. An item's `onAction` and a button's press call `action.onAction(keys)` with the selected keys present in `items`; focus after an action follows 3c's correction 38.
4. **Narrow bars.** `@container data-table-bar (width < 40rem)` hides the promoted buttons (`display: none`), so More holds every action; `(width < 24rem)` puts `selectAllMatching` on its own line.
5. **Keys.** Still React Aria's Toolbar: Arrow Left and Right move through X, `selectAllMatching`'s control, the buttons and More; Escape clears through DataTable's root as before; Enter or Space on More opens the menu.
6. **The offset.** `useBottomBarOffset` on the bar (Task 5); `data-table.css` declares `--save-bar-offset` on `:root:has(.data-table-bar)` and `.app-shell:has(.data-table-bar)` from tokens, as `save-bar.css` does.

**Tests, written first:**

- `bulk-actions.test.ts`: data arrays, node arrays, elements, strings, null; `isDrawn` for a `display: none` element (stubbed `getClientRects`).
- `DataTable.bulk.test.tsx`: `it('writes data-list-below only for 32rem')`; `it('draws Clear selection as an icon named labels.clearSelection, first in the bar')`; `it('draws selectAllMatching after the count')`; `it('draws up to three promoted actions as buttons and warns once for a fourth')`; `it('puts the unpromoted actions in More, and the promoted ones whose buttons are not drawn when it opens')`; `it('calls onAction with the selected keys present in items')`; `it('draws no More with nothing to put in it')`; `it('draws a node bulkActions as 0.6.0 did, beside the icon')`; `it('moves through the bar with the arrows, and clears on Escape')`; `it.each(AXE_CASES)`: the data bar; the menu open; the node bar.
- `css.test.js`, `describe('src/components/data-table.css')` gains: the 32rem block under `[data-list-below='32rem']` and the 40rem block scoped away from it; the bar's container rules at 40rem and 24rem; `--save-bar-offset` declared for the bar.
- Stories (`Components/DataTable`): `ListBelow32` (`viewport-desktop`): a 34rem box with `listBelow="32rem"`, the table face with its `hideBelow: 'md'` column gone; `ListBelow32Phone` (`viewport-phone`): the same table at 375, the list face; `BulkActionsData` (`viewport-desktop`): three selected, "Select all 1,240 matching", two promoted and More; `BulkMoreOpen` (`viewport-desktop`): play opens More with Enter after `focusOn`; `BulkNarrowBar` (`viewport-phone`): Select mode with two selected, More holding every action. `no-visual`: `MoreReadsDrawnButtons` (`webkit`, `firefox`; the box narrowed under 40rem, More opened: every action; widened, opened again: the unpromoted ones; guarded, scroll put back in `finally`), `BarArrows` (`webkit`, `firefox`), `ListBelowSwitch` (resizes the box across 32rem).
- `RightToLeft.stories.tsx`, `BulkBarMirrored`: X at the bar's right, More at its left.
- Docs end-to-end: `test('the bulk actions example puts the rest in More, and every action in More at 375')`; the recipe's existing tests pass with the data form; `docs.spec.ts`'s recipe keeps the table face at 1440 with the panel open.

**Docs:** `data-table.mdx`, `## Beside a side panel` (`listBelow="32rem"`, when the columns that stay under 48rem fit in 32rem; the recipe uses it), `## Bulk actions` (`data-table-bulk-actions`: the data form, `isPromoted`, `selectAllMatching`, `labels.moreActions`, and that a node still works); `docs/design-system.md`, `## DataTable` gains both follow-ups with rulings 24 and 25, spec corrections 14 and 18, and the bar's offset.

**Steps:** Step 0, then as Task 1 with the Storybook filter `DataTable`. Size-limit `{ DataTable }` from 9 kB to its measured value by the rule, expected about 10 kB (spec 16). Step 6 reads the WebKit and Firefox results for `MoreReadsDrawnButtons` and `BarArrows`.

```bash
git add apps/docs/content/docs/components/data-table.mdx apps/docs/examples/data-table-bulk-actions.tsx apps/docs/examples/data-table-transactions.tsx apps/docs/examples/index.ts apps/docs/tests/components.spec.ts apps/docs/tests/docs.spec.ts docs/design-system.md packages/core/src/components/data-table.css packages/core/test/css.test.js packages/react/.size-limit.json packages/react/src/data-table packages/react/src/index.ts packages/react/src/rtl/RightToLeft.stories.tsx
git commit -m "feat: keep the data table's table face beside a panel, and move its bulk actions into a More menu"
git push origin feat/documents
```

- [ ] **Step 7: Visual baselines** (owner action 2). Expected: 20 new files, `components-datatable--{list-below-32,bulk-actions-data,bulk-more-open}--{light-rounded,dark-rounded,light-soft,light-square}.png` and `components-datatable--{list-below-32-phone,bulk-narrow-bar}--{light-rounded-375,dark-rounded-375,light-soft-375,light-square-375}.png`, and the changed pictures of every story with the bar in view (owner action 2's list), each checked by eye: the X at the bar's start, the count after it, one line.

---

### Task 8: The Documents recipe, the guides and the release

**Goal:** show the whole documents flow on the upload tray page; name the batch's parts wherever the guides list parts; write the batch's twelve changesets; take the bug report's versions to the release; move charts' core requirement to 0.7; and write the batch's design record for the bottom edge and confirm every part's record. No component, story or baseline. Closes the batch.

**Files:**

- Create: `apps/docs/examples/documents-recipe.tsx`, `apps/docs/examples/documents-data.ts`
- Modify: `apps/docs/content/docs/components/upload-tray.mdx` (`## The Documents recipe`), `apps/docs/examples/index.ts`
- Modify: `apps/docs/content/docs/installation.mdx` (`## Charts`, `:29`; `## Next.js server components`, `:120-126`), `apps/docs/content/docs/index.mdx` (`## Status`, `:37-42`), `apps/docs/content/docs/routing.mdx` (`## What goes through it`, `:54-65`), `apps/docs/content/docs/charts/line-chart.mdx` (`:65`), `apps/docs/content/docs/charts/sparkline.mdx` (`:85`), `packages/charts/README.md` (`:11`), `.github/ISSUE_TEMPLATE/bug_report.yml` (`:23`)
- Create: `.changeset/progress-bar.md`, `file-drop-zone.md`, `upload-tray.md`, `app-shell-floating.md`, `date-picker.md`, `field-changed-mark.md`, `save-bar.md`, `page-header.md`, `breadcrumbs.md`, `data-table-list-below.md`, `data-table-bulk-actions.md`, `charts-core-peer.md`
- Modify: `docs/design-system.md` (`## The bottom edge`, after the last part's section)
- Test: `apps/docs/tests/docs.spec.ts`
- No change: `CONTRIBUTING.md`, unless its finished-component list names parts by batch (check at the task's start and add the seven if it does).
- No story, no baseline: `pnpm --filter @snapshot-ui/storybook visual:docker -- --check` reports only the new and changed files of Tasks 1 to 7 until the owner commits them.

**Behavior:**

1. **The recipe** (spec 16), `documents-recipe.tsx`, a client file: an example-local uploads provider holding the items and a simulated upload (timers stand in for `XMLHttpRequest`'s upload progress and the server's reading; the page makes no request), a `RouterProvider` whose `navigate` is `router.push(href, { scroll: false })`, and two views chosen by the URL with `useSearchParams()` inside a `Suspense`: the Documents view (a `PageHeader` with a trail, an Upload `FileButton` and a `PageDropZone` mounted while the recipe's own Switch is on, and a list of documents) and a document view (`?doc=`; a `PageHeader`, a review grid of DatePicker, NumberField and TextField per row, and a `SaveBar` whose action moves to the next document with `router.push` and then focuses its heading). The `UploadTray` is mounted at the example's root, outside both views, so a client navigation between them keeps it, as a root layout keeps it in an app; files end saved, needs review ("The total could not be read") or failed ("Over 10 MB") by name, and Retry starts a failed one again. The page's text shows the app's real structure: `app/layout.tsx` holding the provider and `<AppShell floating={<UploadTray ... />}>`, the upload code with `XMLHttpRequest`'s `upload.onprogress`, and a server check again (OWASP).
2. `installation.mdx`: "(0.6 for charts 0.1.3)" becomes "(0.7 for charts 0.1.4)"; the static list gains "ProgressBar, PageHeader" after "Pagination"; a paragraph: "FileDropZone, PageDropZone, FileButton, UploadTray, DatePicker, SaveBar and Breadcrumbs are client components. FileDropZone and DatePicker render their label, frame and button on the server; Breadcrumbs renders real links. Mount UploadTray once, in AppShell's `floating` slot in your root layout, so it outlives every page; the library never uploads, so give it your items."
3. `index.mdx`, `## Status`, after the data table's line: "- A documents flow, for receipts and statements: a file drop zone, an upload tray, a progress bar, a date picker, a save bar, a page header and breadcrumbs."
4. `routing.mdx`: after DataTable's line, "- [Breadcrumbs](/docs/components/breadcrumbs), and the back link a phone draws." and "- [UploadTray](/docs/components/upload-tray)'s rows, once a file has its document's `href`."; "Breadcrumbs will too, when they ship." is removed.
5. `line-chart.mdx`, `sparkline.mdx` and `packages/charts/README.md`: "(0.6 for charts 0.1.3)" becomes "(0.7 for charts 0.1.4)".
6. `bug_report.yml`'s placeholder becomes `'@snapshot-ui/react 0.7.0, @snapshot-ui/core 0.7.0, @snapshot-ui/charts 0.1.4'`.
7. **The changesets**, below.
8. `docs/design-system.md`, `## The bottom edge`: spec 12's table with the custom properties as built (`--app-shell-inset-block-end`, `--toast-offset-block`, `--save-bar-offset` and its token value, `--upload-tray-offset`), when each is written and that none is in a first paint's measurement, the `BottomEdge` stories, spec corrections 12 and 13, section 13.3 item 4 (revisit after use) and R7. Each part section of Tasks 1 to 7 is checked to state its measured pairs, its spec corrections by number and "not yet verified" for owner action 4.

**Changesets:**

`.changeset/progress-bar.md`:

```markdown
---
'@snapshot-ui/core': minor
'@snapshot-ui/react': minor
---

Add ProgressBar: work getting done, Meter's sibling. A `label`, a `value` from `minValue` to `maxValue`, and `valueLabel` in your words ("1.2 of 4 MB"), the default an ASCII percentage. `isIndeterminate` slides a segment for work of unknown length, such as reading a document; it slows under reduced motion and never stops. It is never a live region: say what matters once in your own status. It is static, so a server component renders it. `progress-bar.css` in `styles.css`.
```

`.changeset/file-drop-zone.md`:

```markdown
---
'@snapshot-ui/core': minor
'@snapshot-ui/react': minor
---

Add FileDropZone, PageDropZone and FileButton: three ways in for files, with one check. `acceptedFileTypes` (MIME types, wildcards and extensions), `maxFileSize`, `allowsMultiple` and `maxFiles` are checked the same on a drop, a paste and a choice, and `onFiles(accepted, rejected)` gives you the files that passed and each refusal with its reason (`type`, `size`, `count`, `empty`). FileDropZone is a field with one tab stop, its button, which also takes a paste; PageDropZone shows an overlay only while files are dragged over the page, and pairs with a FileButton for the keyboard. `capture` opens a phone's camera. A drop that misses a zone does nothing while one is mounted. Folders are refused. The library never reads or sends a file: check again on your server. `file-drop-zone.css` in `styles.css`.
```

`.changeset/upload-tray.md`:

```markdown
---
'@snapshot-ui/core': minor
'@snapshot-ui/react': minor
---

Add UploadList and UploadTray: each file from waiting, uploading and reading to saved, needs review or failed, with its reason, a progress bar, a link to its document and Retry, Remove or Cancel where they apply. The tray floats in the bottom end corner on a wide screen and is a bar that opens a sheet on a phone; it says when a batch starts, which files failed or need review, and a summary once all have settled, politely and never a percentage. Its close asks before `onCancelAll`, and it warns before the page unloads while files are in flight. The library never uploads: hold the items in your root layout and mount the tray in AppShell's `floating` slot. The toasts sit above it. `upload-tray.css` in `styles.css`.
```

`.changeset/app-shell-floating.md`:

```markdown
---
'@snapshot-ui/core': minor
'@snapshot-ui/react': minor
---

AppShell takes `floating`: chrome that outlives every page, rendered after the workspace and the tab bar, outside `<main>`. Put an UploadTray there from your root layout, so a client navigation keeps it.
```

`.changeset/date-picker.md`:

```markdown
---
'@snapshot-ui/core': minor
'@snapshot-ui/react': minor
---

Add DatePicker: one date, typed into segments or chosen on the calendar in a popover, with your named `presets`. ISO dates in and out (`value`, `onChange` with null when cleared), a hidden input under `name`, bounds and unavailable days, and `today` from your user's time zone. Before hydration it shows `valueLabel` in its frame, so pass the date as you write it; in a grid name it with `aria-label` or `aria-labelledby`. It shares DateRangePicker's frame. `date-picker.css` in `styles.css`.
```

`.changeset/field-changed-mark.md`:

```markdown
---
'@snapshot-ui/core': minor
'@snapshot-ui/react': minor
---

A changed field with no label now says so: TextField, TextArea, NumberField, Select, ComboBox, MultiSelect, DateRangePicker and DatePicker draw a clay dot inside the frame and read "Changed" (`changedLabel`) after their name, so a review grid of unlabelled fields shows which changed in words as well as in the edge. TextField, TextArea and Select now write `data-unlabelled` without a label, as the others did.
```

`.changeset/save-bar.md`:

```markdown
---
'@snapshot-ui/core': minor
'@snapshot-ui/react': minor
---

Add SaveBar: a sticky footer for a form or a review. Your `message` says what will be saved, `isDirty` adds the Unsaved changes chip and a discard question before `onCancel`, `actionLabel` and `onAction` are your primary action (a returned promise keeps it pending), and `status` is a state said politely, such as a failed save. It is always shown, never disables its action, keeps a focused field clear of itself, warns before the page unloads while dirty, and lifts the upload tray and the toasts. A successful save is your own success toast. Client links are not guarded. `save-bar.css` in `styles.css`.
```

`.changeset/page-header.md`:

```markdown
---
'@snapshot-ui/core': minor
'@snapshot-ui/react': minor
---

Add PageHeader: a page's `title` as its one h1, with `breadcrumbs`, an `eyebrow`, a `description` and `actions` that wrap under the title when they do not fit. It sticks only in AppShell's `header` slot. It is static, so a server component renders it. `page-header.css` in `styles.css`.
```

`.changeset/breadcrumbs.md`:

```markdown
---
'@snapshot-ui/core': minor
'@snapshot-ui/react': minor
---

Add Breadcrumbs and Breadcrumb: a navigation landmark of links to the pages above this one, through your RouterProvider, with the current page last as text marked current. On a phone the trail is one "Back to" link to the parent (`backLabel`). Real links in the server's HTML. `breadcrumbs.css` in `styles.css`.
```

`.changeset/data-table-list-below.md`:

```markdown
---
'@snapshot-ui/core': minor
'@snapshot-ui/react': minor
---

DataTable takes `listBelow`: `'32rem'` keeps the table face down to 32rem of its own box, so a table beside an open SidePanel at 1440px stays a table while a phone still gets the list. The default, `'40rem'`, is 0.6.0's.
```

`.changeset/data-table-bulk-actions.md`:

```markdown
---
'@snapshot-ui/core': minor
'@snapshot-ui/react': minor
---

DataTable's bulk-action bar stays on one line: `bulkActions` also takes data (`id`, `label`, `icon`, `onAction(keys)`, `isPromoted`), up to three promoted actions are buttons and the rest are in a More menu (`labels.moreActions`), which holds every action on a narrow bar. `selectAllMatching` places your "Select all N matching" after the count. Clear selection is now an X icon at the bar's start, with a tooltip, also when `bulkActions` is a node.
```

`.changeset/charts-core-peer.md`:

```markdown
---
'@snapshot-ui/charts': patch
---

The `@snapshot-ui/core` peer now asks for `^0.7.0`, the release that draws the documents parts, so charts 0.1.4 needs core 0.7. A 0.x caret range accepts only its own minor: charts needs the same 0.x minor of `@snapshot-ui/core`, whose `styles.css` draws the charts.
```

**Tests, written first:**

- `docs.spec.ts`:
  - `test('the documents recipe uploads chosen files to saved, needs review and failed, and retries one')` (on `/docs/components/upload-tray`: `setInputFiles` through the Upload button with three files; the tray's rows reach their statuses with the simulated timings; Retry on the failed row starts it again).
  - `test('a file dropped on the recipe page joins the tray')` (the Switch on, a dispatched `dragenter`, `dragover` and `drop` with a files `DataTransfer` built in the page).
  - `test('the tray survives a client navigation to a document and back')` (a row's link or the list's link pushes `?doc=`; the tray, its items and its folded state are unchanged; Back returns).
  - `test('the tray is a bar on a phone that opens its sheet')` (375 by 667; waits for `data-entering` to leave).
  - `test('the review page's save bar asks before Cancel while dirty, and its action moves to the next document and its heading')`.
  - `test('closing the page while files upload asks first')` (`page.on('dialog')` with `page.close({ runBeforeUnload: true })`; the dialog's type is `beforeunload`).
  - The existing version tests (`'0.7 for charts 0.1.4'`), the installation test (names ProgressBar, PageHeader, UploadTray and `floating`), the routing test (links to `/docs/components/breadcrumbs` and `/docs/components/upload-tray`, and no "when they ship").
  - In `components.spec.ts`'s forced colors: `test('the recipe's failed row and current crumb keep their words and colors')`.

**Steps:**

- [ ] **Step 1: Write the failing tests** above. **Step 2:** run them (`pnpm --filter @snapshot-ui/docs test:e2e -- --grep "documents recipe|recipe page|tray survives|tray is a bar|review page|closing the page|installation page|chart pages name|routing page"`). Expected: the recipe tests FAIL (no example); the version, installation and routing tests FAIL on the old text.
- [ ] **Step 3: Write the recipe, the page section, the guides' changes, the README line, the placeholder, the twelve changesets and the bottom edge record.**
- [ ] **Step 4: Run everything** (the Step 5 commands), then:

```bash
source /opt/nvm/nvm.sh
git fetch origin main
pnpm changeset status --verbose
pnpm --filter @snapshot-ui/storybook visual:docker -- --check
git ls-files apps/storybook/tests/visual/__screenshots__ | wc -l
git diff 1a1ad4b -U0 | LC_ALL=C.UTF-8 grep -nP '^\+.*[\x{2013}\x{2014}]' || true
```

Expected: every gate green; `changeset status` plans `@snapshot-ui/core` and `@snapshot-ui/react` at 0.7.0 (minor) from the eleven part changesets, and `@snapshot-ui/charts` at 0.1.4 (patch) from `charts-core-peer.md`; the visual check (owner action 2) reports the 263 new and about 21 changed files of Tasks 1 to 7 and nothing else; 1919 baselines committed, 2182 once the owner adds the batch's; the dash search prints nothing (it reads only the lines the batch added, since older records hold ranges written with an en dash).

- [ ] **Step 5: Commit and push**

```bash
git add .changeset/app-shell-floating.md .changeset/breadcrumbs.md .changeset/charts-core-peer.md .changeset/data-table-bulk-actions.md .changeset/data-table-list-below.md .changeset/date-picker.md .changeset/field-changed-mark.md .changeset/file-drop-zone.md .changeset/page-header.md .changeset/progress-bar.md .changeset/save-bar.md .changeset/upload-tray.md .github/ISSUE_TEMPLATE/bug_report.yml apps/docs/content/docs/charts/line-chart.mdx apps/docs/content/docs/charts/sparkline.mdx apps/docs/content/docs/components/upload-tray.mdx apps/docs/content/docs/index.mdx apps/docs/content/docs/installation.mdx apps/docs/content/docs/routing.mdx apps/docs/examples/documents-data.ts apps/docs/examples/documents-recipe.tsx apps/docs/examples/index.ts apps/docs/tests/components.spec.ts apps/docs/tests/docs.spec.ts docs/design-system.md packages/charts/README.md
git commit -m "docs: add the documents recipe and guides, and require core 0.7 in charts"
git push origin feat/documents
```

After this commit the batch is complete: eleven minor changesets release `@snapshot-ui/core` and `@snapshot-ui/react` 0.7.0, and `charts-core-peer.md` releases `@snapshot-ui/charts` 0.1.4 with its core peer at `^0.7.0`. They carry, for the consumer, spec 16's release note: the library never uploads, so pass the app's items to `UploadTray` and mount it in AppShell's `floating` slot from the root layout; pair every PageDropZone with a FileButton; check files again on the server; `DatePicker` takes and gives ISO dates, with `valueLabel` for the server's HTML and `aria-label` in a grid; SaveBar's status is for states and a successful save is a toast; pass `listBelow="32rem"` to a table beside a SidePanel; move bulk actions to the data form to get the More menu. The owner actions above come before the Version Packages pull request is merged.
