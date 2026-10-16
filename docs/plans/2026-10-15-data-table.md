# Data table: EmptyState, Skeleton, DataTable and SidePanel, Batch 3c, Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give the first consumer's Transactions page its list, in the spec's build order: `EmptyState` and `Skeleton`, two static parts any page can use; `DataTable`'s table face, whose first step is the spike that proves the stretched row link and the key guard in Chromium, WebKit and Firefox, then columns, the row header, sorting, the sticky header, figures, columns that leave, totals, the empty body and the loading body; selection, the bulk-action bar and the keys; the list face, the same rows grouped by day where the table's box is narrow; and `SidePanel` with `SidePanelLayout`, beside the content on a wide screen and a sheet on a phone, opened and closed by the URL. Every part's CSS ships in `@snapshot-ui/core` (`empty-state.css`, `skeleton.css`, `data-table.css`, `side-panel.css`, all imported by `styles.css` after `filter-bar.css`), every part has its own docs page, the data table page carries the Transactions recipe, and the batch ships as one release: `@snapshot-ui/core` and `@snapshot-ui/react` 0.6.0. `@snapshot-ui/charts` goes to 0.1.3 by a patch changeset, since its `@snapshot-ui/core` peer (`workspace:^`) publishes as `^0.6.0`.

**Architecture:**

- **One data source, two faces.** `DataTable` takes rows as data (`items`) and columns as definitions (`columns`) and draws both faces from them: React Aria's `Table` for the table face and React Aria's `GridList` for the list face. Both are in the server's HTML, and a container query on DataTable's own box shows one, so nothing is measured and the server's HTML is right at every width (rulings 1 and 8).
- **React Aria where it fits, guarded where it does not.** React Aria gives the grid, row and cell focus, `aria-sort`, the selection model and the checkboxes' state. Three of its defaults contradict the brief, and the library guards each in one place: a row opens through a real `Link` stretched over it and never selects on a press (ruling 2); one capture-phase key handler on DataTable's root gives J, K and X their meaning, takes Enter, and stops typeahead (ruling 3); and `onSelectionChange` maps React Aria's `'all'` to the given rows' keys (ruling 4).
- **The panel is a layout, not an overlay, where there is room.** `SidePanelLayout` is a grid of the content and, while open and from 1024px, a 24rem column holding `aside.side-panel`, a `complementary` landmark in the server's HTML. Under 1024px, after hydration, the same panel is 3b's `Sheet` (rulings 10 and 11).
- **Strings are the app's.** Every cell, amount, date, day heading and count is the app's string; the library formats nothing and writes its own words only through `labels`, English by default.
- **Client where it must be.** `EmptyState` and `Skeleton` import nothing from React Aria and stay server parts. `DataTable`, `SidePanel` and `SidePanelLayout` are client modules; DataTable takes functions in its props, so an app renders it from a client component (spec correction 11).
- Every task is one reviewable deliverable in the spec's build order, and a last task for the recipe, the guides, the changesets and charts' core requirement.

**Tech Stack:** unchanged from batch 3b: pnpm 10.10, Turborepo 2.11, Node 24.5 or later, TypeScript 7 beside the TypeScript 6 API, Lightning CSS 1.33 with the browser floor Chrome 111, Safari 16.4 and Firefox 128, Stylelint 17, Tailwind CSS 4.3, React 19.3, react-aria-components 1.22.1 (on react-aria 3.53.1 and react-stately 3.51.0), `@internationalized/date` 3.12.4, lucide-react 1.55, tsdown 0.23, Vitest 5 with jsdom 30, Testing Library, axe-core 4.14, Storybook 10.6 with the a11y and Vitest addons, Playwright 1.64 (Chromium, WebKit and Firefox story projects), Next.js 16.4 on Fumadocs 16, Changesets 3.0, publint 0.3, `@arethetypeswrong/cli` 0.18 and size-limit 14. New: nothing. React Aria parts used for the first time: `Table`, `TableHeader`, `Column`, `TableBody`, `TableFooter`, `Row`, `Cell`, `GridList`, `GridListItem`, `GridListSection`, `GridListHeader` and `Toolbar`.

**Spec:** `docs/specs/2026-10-15-data-table-design.md`, approved, with the owner's twelve rulings in its section 10.1 taken as recommended: (1) a data-driven API, `items` and `columns` with a `cell` function per column and `listSlot` for the list face; (2) a press anywhere on a row opens its detail through a real link in its row header cell, stretched over the row, and selection is only the checkbox, X and Space; (3) a capture-phase handler gives J and K the arrows' meaning and X the selection toggle, and stops every other single printable key, so the table has no typeahead; (4) select-all selects the rows given, as an array of keys, never React Aria's `'all'`; (5) the bulk-action bar sticks to the bottom of the viewport inside the table's box while any row is selected; (6) never scroll sideways: columns with `hideBelow` leave at 48rem and 40rem of the table's box, cells ellipsize, and under 40rem the list face takes over; (7) the 5% ink wash for hover, 8% plus the checked box for selected, a 3px ink bar and weight 700 for the current row; (8) a container query on DataTable's own box at 40rem switches the faces; (9) skeleton rows while there are no rows yet, pulsing over 1.6s and still under reduced motion, with one spoken "Loading", and rows already shown stay while the next page loads; (10) the panel beside the content from 1024px of viewport at 24rem, pushing the content, and a bottom sheet under it; (11) a `complementary` landmark named by its title, focus to its heading on open and back to the row on close, Escape inside it closes it, the page usable around it; (12) React Aria's sort cycle, ascending then descending, with no unsorted state. Section 10.2 lists the fourteen decisions made in the spec, followed here. The parent spec is `docs/specs/2026-10-10-snapshot-ui-design.md`; the design authority is `docs/design-system.md`, including Appendix B. Section numbers below are the data table spec's unless they say otherwise.

**Source app:** the private app this library was extracted from is never named. Its path is in the gitignored `.local/SOURCE.md`; no task opens `.local/`, and nothing it holds is copied into a committed file. The consumer is "the consumer" or "the first consumer".

**How this plan was made:** like the filters plan, this one carries no prototype-verified component code. Each task names its files, its exact public types, its numbered behaviors, its CSS, its tests and its docs, and the implementer writes the code under TDD. Code appears only where two good engineers would build a thing differently and one way is wrong: the row's stretched link and its cell, the key handler, the selection mapping, the skeleton pattern, the day grouping, and SidePanel's faces and focus. Every mechanism the plan relies on was read in the repository or in the installed packages on `feat/data-table` at e928769, and is cited where it is used; React Aria's private modules are cited by their path under the package's `dist/private/`. Four behaviors were also checked with a throwaway probe in Node 24 with `react-dom/server` at e928769 (not committed): React Aria's `Table` given `aria-busy` and `aria-current` writes neither, on the `table` or on a `Row`, while a `Row` given `data-current` writes it; a `Table` whose `TableBody` has no rows and a `TableFooter` with one row does not render `renderEmptyState`, while the same table without the footer does; a collection's hidden pass writes an empty `<template></template>` on the server, so it adds no rows to the HTML; and a two-column table writes 37,309 bytes for 50 rows and 147,459 bytes for 200. The contrast values were measured with `packages/core/scripts/contrast.js` against `tokens/tokens.json`. Test counts are "the N tests this task adds"; the implementer records the real totals in the commit's verification.

**Branch:** `feat/data-table`, from `main` after the batch 3b release (68f04ac, "Version Packages", core and react at 0.5.0, charts at 0.1.2) and three fixes on main (1df766d, 28c626b, dea7280), with the spec's two commits on top (212f987, e928769). Everything batch 3b produced exists: `Checkbox` on React Aria's `CheckboxField`, which reads the `selection` slot a `Row` and a `Column` provide (`react-aria-components` `dist/private/Table.mjs:648-656,1106-1115`); `Link` and `RouterProvider` (`link/Link.tsx`); `Sheet` (`sheet/Sheet.tsx`); `Menu`, `Button`, `IconButton`, `Badge`, `Card`; `Pagination` with its quiet status (`pagination/PaginationStatus.tsx`); `FilterBar` and `FilterChip`; `SearchField`; `useHydrated` and `useWarnOnce` (`utils/`); `QUIET_MS` (`utils/quiet.ts`); `matchesShortcut` and `parseShortcut` with the `event.code` fallback (`command-palette/shortcut.ts`); `isAnotherModalOpen` (`overlay/useOverlayStack.ts:14-17`); `present`, `cx`, `mergeRefs`, `useControllableState`, `AriaName` and `AccessibleName`; `MENU_ROW_A11Y` and the viewports (`src/stories/`); the server-face, hydration, server-render, server-components and empty-parts suites; the visual harness's tags (`density`, `viewport-phone`, `viewport-desktop`, `no-visual`, `webkit`, `firefox`); and 1739 baselines (`git ls-files apps/storybook/tests/visual/__screenshots__ | wc -l` at e928769).

## Global Constraints

### Runtime and packaging

- Node `>=24.5`, `"packageManager": "pnpm@10.10.0"`, every package `"type": "module"`, ESM only.
- No new dependency. Every React Aria value and type comes from `react-aria-components`, which exports `Table`, `TableHeader`, `Column`, `TableBody`, `TableFooter`, `Row`, `Cell` and the types `Key`, `Selection`, `SortDescriptor` (`dist/types/exports/Table.d.ts`), `GridList`, `GridListItem`, `GridListSection`, `GridListHeader` (`GridList.d.ts`) and `Toolbar` (`Toolbar.d.ts`). The library never imports `react-aria`, `react-stately` or `@react-types/shared` directly.
- Both packages build with tsdown in `unbundle` mode under `tsconfig.build.json`, which turns on `isolatedDeclarations`: every exported function and constant declares its full type, return types included.
- `tsconfig.base.json` has `types: []`, so `process` is not typed. A development warning is `useWarnOnce(message)` (`utils/useWarnOnce.ts`), once per mount, in an effect, in every build.
- **Versions.** Core and react stay a fixed group (`.changeset/config.json:5`), and the batch's four minor changesets (Task 6) take them from 0.5.0 to 0.6.0. A patch changeset (`charts-core-peer.md`, Task 6) takes `@snapshot-ui/charts` from 0.1.2 to 0.1.3, whose core peer publishes as `^0.6.0`; 0.1.2's `^0.5.0` does not admit 0.6.

### React components

- Every source file that imports `react-aria-components` starts with `'use client';` (`packages/react/scripts/check-use-client.js` fails the build otherwise), and so does every `.tsx` under `src` that uses state, an effect, a ref callback with state, or a context. `packages/react/test/server-components.test.tsx` lists every static module (`STATIC_MODULES`, `:280-292`), and its last describe fails on any `.tsx` that is neither a client module nor listed.
- The static modules of this batch: `empty-state/EmptyState.tsx` and `skeleton/Skeleton.tsx`, added to `STATIC_MODULES` and to the `STATIC` rows (`:88-131`). The client modules: `data-table/DataTable.tsx`, `data-table/TableFace.tsx`, `data-table/ListFace.tsx`, `data-table/BulkBar.tsx`, `data-table/DataTableStatus.tsx`, `side-panel/SidePanel.tsx` and `side-panel/SidePanelLayout.tsx`. Pure `.ts` modules carry no directive and are imported only by client modules: `data-table/keys.ts`, `data-table/selection.ts`, `data-table/rows.ts` and `data-table/groups.ts`.
- **Lucide only in client modules**, as 3a and 3b: `ArrowUp`, `ArrowDown` and `ArrowUpDown` (DataTable's sort marks) and `X` (SidePanel's close button). lucide-react's `Icon` is a client module (`docs/design-system.md`, "StatTile"), so `EmptyState` imports no icon: the app passes its own element.
- **Always controlled.** The sort, the selection, the open row and the panel's `isOpen` come from the app, in the URL for all but selection (spec 6.1). No part keeps a second copy.
- **Names are the library's.** Every name the library writes ("Select all", "Select", "Clear selection", "Loading", "Total", "Bulk actions", "Close") comes from a `labels` object or a label prop, English by default and every one replaceable.
- **Functions in props.** `columns` (`cell`, `textValue`), `getKey`, `getRowHref`, `getGroup` and `formatCount` are functions, which a server component cannot pass to a client one, so DataTable is rendered from the app's client component (spec correction 11). A server page passes data; server-rendered nodes reach the cells as fields of the items.
- `className` and `ref` go on the element each task names; `className` merges after the library's class through `cx`. Presence checks on rendered slots use `present()`, never `!= null`.
- **Server safety** (the consumer's rules): no `Intl` formatting and no `toLocaleString` in the library's own code, no `window`, `document` or `matchMedia` at render or import, no measurement for the first paint. A DOM read (`getComputedStyle` of a hidden cell, the visible face, `document.activeElement`) happens only in an event handler or an effect. `matchMedia` is read only in an effect, guarded (`typeof window.matchMedia === 'function'`), as `app-shell/AppShell.tsx:116-127` reads it.
- Every id the library writes comes from `useId`, or from React Aria.
- `jsx-a11y` is in its strict config. DataTable's root takes keys through `onKeyDownCapture`, which jsx-a11y does not read, so it needs no exemption, as FilterChip's pill (`filter-chip/FilterChip.tsx:386-394`); its comment says why it listens. One element carries a disable, with its reason: SidePanel's aside, whose Escape must listen in the bubble phase so an open list inside the panel closes first, `// eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions -- Escape inside the panel closes it (spec 9.2, ruling 11); the panel's own controls are the tab stops`.

### CSS

- Component CSS lives in `packages/core/src/components/<name>.css`, inside `@layer components`, imported from `src/styles.css` after `filter-bar.css`, in this order: `empty-state.css`, `skeleton.css`, `data-table.css`, `side-panel.css`.
- **Tokens only.** Stylelint's `snapshot-ui/token-only` forbids a literal color, a literal radius and any `box-shadow` that is not `none` or a `var()` (`packages/core/stylelint/token-only.js`). `z-index` is written only through a z token (`css.test.js:232-240`): the sticky header, the list's day headers and the bar sit at `calc(var(--z-header) - 1)`, under the page's chrome, and a cell's own controls at `calc(var(--z-header) - 2)` (spec correction 14). Class names are kebab-case and never start with a Tailwind namespace; `empty-state`, `skeleton`, `data-table` and `side-panel` are used by nothing in `apps/docs` or `packages` (spec 10.2 item 13, checked with a search at e928769).
- **System colors** only inside `@media (forced-colors: active)` (`css.test.js:224-229`). Every file has a forced-colors block.
- **States** are data attributes beside their native or ARIA twins: `:is(:hover, [data-hovered])`, `:is(:focus-visible, [data-focus-visible])`, `:is([data-selected], [aria-selected='true'])` on a row, `:is([data-disabled], [aria-disabled='true'])`, and the current row's `[data-current]`, whose ARIA twin is `aria-current="true"` on its link (spec correction 2). Hover rules sit inside `@media (hover: hover)`.
- **The focus ring** is `outline: var(--focus-ring-width) solid var(--focus-ring-color)`, never ink (`css.test.js:219-222`). Inside DataTable it is inset, `outline-offset: calc(-1 * var(--focus-ring-width))`, since a table can sit in a scrolling region (Menu's rule), and never shows under the pointer.
- **Motion.** Only the skeleton pulses (1.6s), and `skeleton.css` carries the reduced-motion block the shared test asks for (`css.test.js:209-213`). SidePanel's wide face does not move; its narrow face is Sheet's slide.
- **Logical properties** throughout. Nothing mirrors by attribute: the sort arrows keep up for ascending in both directions (spec 6.3), and the current bar is an inline-start border, so it sits at the right on a right-to-left page.
- **Breakpoints.** DataTable's widths are container queries on its own box, `@container data-table (width < 48rem)` and `(width < 40rem)`, which, like `stat-tile.css:121` and `pagination.css:228-245`, are not tokens (spec correction 15). SidePanel's switch is `@media (width >= 1024px)`, the `--breakpoint-md` token written out, and its test compares the text with `tokens.breakpoint.md.value`, as the sidebar's does (`css.test.js:3038-3049`).
- **The sticky offset** is `var(--page-sticky-top, 0px)`, set by the app on an ancestor to its header's height; no token is added (spec 10.2 item 4).

### Design rules

- **Theme axes:** light and dark, the three shapes, compact density. Rows read density through `--size-field` and `--size-target`: `max(var(--size-target), var(--size-field))` is 48px, 40px compact and 44px compact on a coarse pointer (`packages/core/dist/tokens.css:95-97,230-242`), so the 40px checkbox fits in every density.
- **Typography:** weights 400, 450, 500 and 700 only. A cell is `--text-small` at 450 (`--text-small--font-weight`); a row header 500; the current row's header 700; the totals 700; the column header and a day heading `--text-overline` at its token weight, 700; the empty state's title and the panel's title 700; the bar's count and a list item's title 500.
- **Reserved colors.** Signal orange appears nowhere: a selection or a bulk action is not consent, and the app's own destructive action in the bar is its `danger` Button. Clay appears nowhere: nothing here is unsaved. Error and success appear nowhere in the library's own drawing; a negative amount is ink with its sign. Taupe is only for a disabled row's text. Slate is for the column headers, the sort marks at rest, a day heading, a list item's meta line, the empty state's description and the panel's description. State is never color alone: a selected row has its checked box, the current row its bar, its weight and `aria-current`, the sorted column its arrow and `aria-sort`.
- **Surfaces:** DataTable draws none; its sticky header takes `--data-table-surface` (the canvas by default, lifted in a Card). The bulk-action bar is the float surface Popover and Toast use (`popover.css:14-17`). SidePanel's wide face is the rail's surface (`sidebar.css:21-34`): float, the hairline, the stadium corner, `--shadow-lift`.
- **Contrast records.** Ink and slate on canvas, lifted and float, and ink on float, are gated already (`CONTRAST_PAIRS`, `packages/core/scripts/contrast.js:17-140`), so no task adds to the gate. The washes are mixes and are measured and recorded, not gated: ink on the 5% wash 14.70 and 17.41 over canvas, 16.11 and 15.25 over lifted (light and dark); on the 8% wash 13.81 and 16.06 over canvas, 15.13 and 13.92 over lifted; slate on the 5% wash 4.38 and 6.93 over canvas, 4.80 and 6.41 over lifted; slate on the 8% wash 4.11 and 6.62 over canvas, 4.51 and 6.04 over lifted. Slate falls under 4.5 on a hovered or selected row over canvas in light, so the library's own slate text in a row (the list face's meta line) turns ink on a hovered or selected row on every surface (spec 6.3, "Hover"). The skeleton's fill, the divider at 10%, is 1.23 and 1.28 against canvas and 1.23 and 1.34 against lifted, and half of it 1.11 and 1.11, 1.11 and 1.14: a decoration hidden from assistive technology, recorded. Each task's `contrast.test.js` describe cites the gated pairs and recomputes, to two decimals, every value its Appendix B record states.
- **Strings.** The library writes no date, no amount, no count in a locale and no list: the app passes every cell, `getGroup`'s labels, `formatCount` and every label. React Aria's sort and selection announcements are its own and follow `I18nProvider`, with no Persian (risk R5).

### Docs site

- Component pages go in `apps/docs/content/docs/components/<slug>.mdx`, with sections, then `## Usage`, `## Props` (one `PropsTable` per type, each with a distinct `label`), `## Accessibility` (with a `Keys` table that states React Aria 1.22.1's behavior as the tests pin it, the library's handler marked; static pages have none, as `card.mdx` and `badge.mdx`), and `## Design rules` (`Rules`), each in a `Section`. Titles: "Empty state", "Skeleton", "Data table", "Side panel"; icons `Inbox`, `SquareDashed`, `Table`, `PanelRight` (all in lucide-react 1.55, resolved by `lucideIconsPlugin`, `apps/docs/lib/source.ts:2,23`).
- `content/docs/components/meta.json` and `apps/docs/examples/index.ts` stay alphabetical: `data-table` after `confirm-dialog` and before `date-range-picker`; `empty-state` after `drawer` and before `field`; `side-panel` after `sheet` and before `sidebar`; `skeleton` after `sidebar` and before `spinner`. An example with hooks, handlers or a function prop is a client file; DataTable's examples are all client files (spec correction 11). Shared example data is a `.ts` module beside the examples, as `line-chart-data.ts` is: `apps/docs/examples/transactions-data.ts`.
- A new page joins the completeness-guarded maps in `apps/docs/tests/components.spec.ts`: `LONG_TARGETS` (`:642-691`) or `NO_LONG_TEXT` (`:693-715`), and `SERVER_RENDERED` (`:804-866`). The loop there proves every page fits 320px and 375px with no sideways scroll (`:721-772`), and runs axe in light and dark (`:783-797`). Forced-colors checks go in its `test.describe('forced colors')` (`:98`).
- The homepage footer's Components column (`apps/docs/app/(home)/home-page.tsx:798-843`) lists every component page in the rail's order (`home.spec.ts:264-277`), and a catalog chip is a link exactly when its name is a page's title (`home.spec.ts:279-294`): "Empty state" (Task 1) and "Data table" (Task 2) become links, and the linked-chip count goes from 20 to 21 and then 22. "Master detail" stays text (open question 4). `packages/core/README.md` and `packages/react/README.md` list every component page in the rail's order (`scripts/readmes.test.js:28-33`).
- **URL recipes.** Every recipe reads the URL with `useSearchParams()` inside a `Suspense` whose fallback renders the same part at its first state, starts from the parameters already there, writes with `router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false })` so a bare `?` is never written and the page never jumps, and wraps a part that draws links in a `RouterProvider` whose `navigate` calls `router.push(href, { scroll: false })` (`apps/docs/examples/pagination-links.tsx`). The docs pages are statically generated (`apps/docs/app/docs/[[...slug]]/page.tsx:66`), so an example's URL state is never in the server's HTML (spec correction 12).
- **End-to-end waits.** A test that measures or shoots an open sheet first waits for `data-entering` to leave it.

### Repo, commits and releases

- **The repo is public.** Never commit the source app's name, its company, its CMS, any client name or its class prefix. `pnpm check:public` enforces this.
- **Commits:** the exact Conventional message each task gives, with no body, in the repo's style (`git log --oneline -40`). They never mention Claude or Claude Code and never carry a Co-Authored-By line. No em dashes, en dashes or emojis anywhere, in code, comments, docs or messages.
- **Markdown is never formatted.** `.prettierignore` skips `**/*.md` and `**/*.mdx`, so `pnpm format` leaves them alone; never run Prettier on a Markdown file by hand, and above all never on `docs/design-system.md`, whose wrapped records are edited by hand only.
- **Before committing:** `pnpm format`, then every gate in the task's steps, then `pnpm verify` before every commit that touches code. Visual baselines change only through `pnpm --filter @snapshot-ui/storybook visual:docker`, on the owner's machine (owner action 2), and are committed right after the task that adds the stories, in a `test: add the <part> baselines` commit, as 183bc2a added the filters'. A visual story renders a stable state: no hover, no pointer movement in its play; a play may focus by keyboard, type, press keys or call `element.click()`. Playwright's screenshots run with `animations: 'disabled'` (`apps/storybook/playwright.config.ts:20`), which stops the skeleton's infinite pulse at its first frame.
- **Tests:** unit tests in Vitest with `expectNoA11yViolations` on each state, **one test per state** through `it.each` so each axe pass has its own time limit on a slow runner, and no axe exemption beyond `MENU_ROW_A11Y`; a rule turned off anywhere else is scoped to one selector and carries its reason. Unit tests get 15s and story tests 30s on CI (`packages/react/vitest.config.ts:16`, `apps/storybook/vitest.config.ts:11`). jsdom has no layout and no container queries, so a press that lands on a stretched link, a hidden column, a sticky header or a container switch is a Storybook play in Chromium (tagged `no-visual`), and a key or press guard's play runs in WebKit and Firefox too (tags `webkit` and `firefox`). The CI story projects are `storybook`, `storybook-dark`, `storybook-webkit` (one file at a time) and `storybook-firefox` (`apps/storybook/vitest.config.ts:12-72`). **WebKit and Firefox do not run on the implementer's machine here; their plays run in CI**, which runs on pull requests (`.github/workflows/ci.yml:5-8`), so each task pushes and reads the pull request's `storybook-webkit` and `storybook-firefox` results before it is done (owner action 1). The harness's modes (`apps/storybook/tests/visual/stories.spec.ts:34-52`): an untagged story is shot in five modes (light Rounded, dark Rounded, light Soft and light Square at 1280, and light Rounded at 375); `density` adds light Rounded compact; `viewport-phone` shoots the four theme and shape modes at 375 only, and `viewport-desktop` at 1280 only. Files are `components-<component>--<story>--<theme>-<shape>[-375][-compact].png`, where `<component>` is the story title's last segment lowercased with no separator (`Components/DataTable` is `datatable`). Each part also gets a `<Part>Mirrored` story in `packages/react/src/rtl/RightToLeft.stories.tsx` (title `Checks/Right to left`, tagged `no-visual`), wrapped in `I18nProvider locale="fa-IR"` and `dir="rtl"`. The table's stories are tagged `viewport-desktop` and the list face's `viewport-phone`, so no baseline a task writes changes when a later task adds the other face.
- **Story data.** One household's transactions, shared by DataTable's and SidePanel's stories and tests, live in `packages/react/src/stories/transactions.tsx` (`TRANSACTIONS`, `COLUMNS`, `groupOf`), story code that never ships (`src/stories/viewports.ts:1-4`).
- **Changesets:** one per part, minor, for `@snapshot-ui/core` and `@snapshot-ui/react` (spec 13), all written in Task 6, once DataTable's three tasks are done: `empty-state.md`, `skeleton.md`, `data-table.md`, `side-panel.md`; and `charts-core-peer.md`, a patch for `@snapshot-ui/charts`. Each names every new export, every new CSS file and the release-note points of spec 13 that concern its part.
- **Size limits:** an entry starts at spec 10.2 item 14's budget, measured without React Aria, Lucide and `@internationalized/date` (`"ignore": ["react", "react-dom", "react-aria-components", "lucide-react", "@internationalized/date"]`), is added before the three "watch only" entries at the end of `packages/react/.size-limit.json`, and is set by the repo's rule: the measured size rounded up to the next 0.5 kB, plus 0.5 kB. An entry measures everything its import pulls in: `{ DataTable }` carries Checkbox, Link, Button and the two static parts, and `{ SidePanel, SidePanelLayout }` carries Sheet and IconButton, which have entries of their own, so a limit above the budget is recorded with that reason in the commit's verification.
- **Gates, in order, in every task:** the package builds, the core and react Vitest runs, the Storybook story tests, the docs build, typecheck and lint, the docs end-to-end run, `size`, `pnpm format`, `pnpm format:check`, `pnpm verify`, then the visual Docker step. The end-to-end run needs port 3100 free (`lsof -nP -iTCP:3100 -sTCP:LISTEN` prints nothing); if another checkout holds it, run `DOCS_E2E_PORT=3504 pnpm --filter @snapshot-ui/docs test:e2e` after checking that port is free.

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
```

`pnpm verify` runs the story projects through each package's `test` script, the WebKit and Firefox ones included where the machine has them; here they run in the pull request's CI.

### The consumer's rules (its batch 3 request and "Rules every part must follow")

`'use client'` only on interactive parts; no `Intl` formatting and no `window` at render, and no first-paint measurement; no external request and no injected script; light and dark, all three shapes, right to left (the app has a Persian guide), comfortable and compact density; WCAG 2.2 AA including 2.5.8; anything that navigates goes through `RouterProvider`; everything exported from the `@snapshot-ui/react` index, with all the CSS in `@snapshot-ui/core/styles.css`. The Transactions page keeps all its state in the URL: the sort, the page, the open transaction. Selection is the one piece of state that stays in the page, since a URL with chosen rows in it is neither shareable nor useful after the rows change.

## Review Focus

The input classes the spec implies that a part's ordinary tests would not exercise, most likely first. Each is pinned by a test in the task named.

1. **A press opens and never selects, in three engines.** A press anywhere on a row, on any cell that is not a control, lands on the row's own link and opens it through the router; the row's selection never changes; a middle click and a modifier click are the browser's; the checkbox and a cell's Menu take their own press. The traps: React Aria selects on a mouse press start once selection is on and the row has no action (`selection/useSelectableItem.mjs:170-178`), and a table row is the stretched link's containing block only where the engine makes a `tr` one. Pinned by Task 2's spike in Chromium, WebKit and Firefox, and Task 3's plays.
2. **Enter opens and never selects; letters never move focus.** Enter on a focused row opens its link, with a modifier too, and never selects (React Aria would, spec correction 6); J and K move as the arrows, X toggles, on a Persian layout by `event.code`; every other single printable key is stopped before React Aria's typeahead; and nothing is taken from an input in a cell, the bar, a key with Ctrl, Alt or Meta, a composing key, or while another modal is open. Pinned in Task 2's spike and Task 3.
3. **Select-all is the rows on the page, never `'all'`.** The header checkbox and Mod+A give `onSelectionChange` the given rows' enabled keys; the totals row is never one; stale keys are counted out of the bar and warned once (R6). Pinned in Task 3.
4. **React Aria's collection, not the DOM, decides three things.** A totals row is a row, so it keeps the empty and loading bodies away (spec correction 3); the empty body is one cell, so skeleton rows are drawn inside it (spec correction 4); and the arrows walk columns the CSS hid (spec correction 8). Pinned in Task 2.
5. **Two faces, one HTML, no hydration warning.** DataTable's server HTML holds both faces and is the same under `en-US`, `de-DE` and `fa-IR` in UTC and Asia/Tehran; hydrating it raises neither a recoverable error nor React's attribute warning. Pinned in Tasks 2 and 4 (`test/server-face.test.tsx`, `test/hydration.test.tsx`), with R3's sizes recorded in Task 4.
6. **The list groups only what is adjacent, in `items` order.** A group id that comes back after another starts a new section with a key of its own. Pinned in Task 4.
7. **The panel's faces and focus.** The aside is in the server's HTML when open; the sheet mounts only after hydration under 1024px; focus moves to the heading on an opening and back to the opener on close, and stays with the panel when the viewport crosses 1024px. Pinned in Task 5.
8. **Sticky offsets and layers.** The header cells, the list's day headers and the panel stick at `--page-sticky-top`, one layer under the page's header, and the bar at the viewport's bottom above the tab bar's reserve. Pinned in Tasks 2 to 5 by plays and the recipe's end-to-end test.
9. **Right to left.** Columns run from the right, `align: 'end'` figures sit at the left and stay left to right inside, the sort arrows are not mirrored, the current bar is at the right, the panel is on the left. Pinned in each task's `RightToLeft` story and `Mirrored` play.

## Task index

| Task | Deliverable | New baselines | Commit message |
| ---- | ----------- | ------------- | -------------- |
| 1 | `EmptyState` and `Skeleton`, static server parts, `empty-state.css` and `skeleton.css`, their stories, pages and Appendix B records | 37 | `feat: add EmptyState and Skeleton` |
| 2 | The spike (the stretched row link and the key guard in three engines, its own commit), then `DataTable`'s table face: columns, the row header, sorting, the sticky header, figures, columns that leave, totals, the empty and loading bodies, `currentKey`, `data-table.css`, its stories and page, and the "Dense data" and "DataTable" records | 45 | `test: prove the data table row link and key guard in three engines`, then `feat: add DataTable` |
| 3 | Selection, the bulk-action bar and the keys: the checkbox column, select-all as the given rows, the bar, the capture handler, the stale-key warning; in its fix round, the owner's amendments 2, 4, 5 and 6 that belong to the table | 37 | `feat: add selection, the bulk-action bar and the keys to DataTable` |
| 4 | The list face: `GridList` grouped by day, the slots, selection and keys, totals, empty and loading, the 40rem switch, R3's sizes; Select mode (amendment 3) | 33 | `feat: add the list face to DataTable` |
| 5 | `SidePanel` and `SidePanelLayout`: the aside face, the sheet face after hydration, focus, `side-panel.css`, stories and page | 24 | `feat: add SidePanel and SidePanelLayout` |
| 6 | The Transactions recipe, the five changesets, the guides that state versions and list parts, and charts' core requirement | 0 | `docs: add the data table recipe and guides, and require core 0.6 in charts` |

Order is the spec's build order (section 1): 1 makes the two static parts the table's empty and loading bodies use; 2 proves the row link and the guard before anything is built on them, then draws the table; 3 adds selection and the full key handler to it; 4 draws the same rows as a list; 5 puts a table beside a panel; 6 names what 1 to 5 made and releases it. Every commit builds: no task imports a part a later task makes.

## Spec corrections

Mismatches found while reading the spec against the repository, the installed packages and the consumer's rules, numbered in order, each naming the task that resolves it and its evidence; those marked **choice** are design decisions. A correction found while implementing is added after the last, and the records in `docs/design-system.md` cite corrections by their numbers. None changes an owner's ruling.

1. **Column widths (Task 2).** React Aria's `Column` `width` acts only inside `ResizableTableContainer` and is otherwise ignored (`Table.mjs:700-705`). The width goes on the header cell's `style`, with `table-layout: fixed`.
2. **`aria-current` and `aria-busy` (Task 2).** React Aria's `filterDOMProps` drops both from `Row` and `Table` (confirmed by a server-render probe). The current row takes `data-current` and its link `aria-current="true"`; `aria-busy` goes on `div.data-table`.
3. **Totals and the empty body (Task 2).** A `TableFooter` row counts in `collection.size`, so the empty body never renders while a footer exists (probe). Totals render only while there are items; the row has a cell per column and is `isDisabled` with `disabledBehavior="selection"`, so it takes focus and is never selected.
4. **Skeleton rows (Task 2).** React Aria's empty body is one `tr` with one spanning cell (`Table.mjs:886-904`), so the skeleton rows are flex rows inside that cell, not table rows.
5. **The row checkbox's name (Task 3, choice).** React Aria names a row checkbox by `aria-labelledby` with its own label and the row header, so `labels.selectRow(row)` would read the row twice. It becomes `labels.select`, default "Select".
6. **Enter on a row (Task 3).** With selection on, React Aria selects a row with no action on Enter (`useSelectableItem.mjs:170-178`). The capture handler takes Enter on every row, with modifiers, and dispatches a click carrying them, as React Aria's `openLink` does; WebKit ignores a synthetic modifier on that click.
7. **J and K (Task 3).** React Aria does not dispatch key events between cells; dispatching the arrows is the library's own technique.
8. **Hidden columns and the arrows (Task 2).** React Aria's keyboard delegate walks the collection, not the DOM, so an arrow can land on a `display: none` cell; the handler moves focus to the nearest visible cell. Found in review: the same holds for the column headers (Left and Right wrap around the header row, Home and End), for Arrow Up from the first row into the first column's header, and for Ctrl+Home and Ctrl+End off a Mac, so the handler covers them, with the modifiers React Aria moves with, and reads the direction from `useLocale()` as React Aria does.
9. **Announcements (Task 3).** React Aria announces a sort change assertively (`useTable.mjs:100`), where the spec's section 11 says polite, and announces every selection change itself, so the bar's polite count repeats it in the app's words.
10. **Typeahead in the list face (Task 4).** `GridList` takes `disallowTypeAhead` and `Table` strips it (`Table.mjs:376`); the list face passes it, and the capture handler covers both faces.
11. **A client component (Task 2).** DataTable's props hold functions, so it is rendered from a client component; server-rendered nodes reach cells as fields of the items.
12. **Docs and the URL (Task 6).** Docs pages are statically generated, so an `?open=` parameter is never in a docs page's server HTML; the no-script check uses an example that is open by default.
13. **The current row's bar (Task 2, choice).** A 3px inline-start border on the first cell, not a `::before`: a positioned row-header cell would become the stretched link's containing block. Found in review: on the first shown cell, so a first column with `hideBelow` that has left does not take the bar with it.
14. **Raising a cell's controls (Task 2).** The CSS tests allow only z-index tokens, so cell controls use `calc(var(--z-header) - 2)`. Found in review: every native control, `label`, `summary`, the control roles, anything in the tab order and `.field` are raised, and `.data-table-control` is the documented opt-in for anything else.
15. **`hideBelow`'s names (Task 2).** `'md'` (48rem) equals `--breakpoint-sm` and `'sm'` (40rem) matches no token: they are container widths, not breakpoints, and the docs say so.
16. **The sticky header (Task 2, choice).** The header cells stick, not `thead`; a play proves it in three engines.
17. **The phone panel's focus (Task 5).** On the narrow face focus is the Sheet's, which moves it into its dialog.
18. **The bar's keys (Task 3).** React Aria's `Toolbar` uses the arrows and Tab and has no Escape; the library adds Escape, and the Keys table gains Left and Right.
19. **The panel's landmark (Task 5).** The aside needs `aria-labelledby` to stay a `complementary` landmark inside `main`; axe's top-level landmark rule is off by default in axe-core 4.13 and 4.14.
20. **A new row, a new opening (Task 5, choice).** SidePanel cannot tell one detail from the next, so the app passes `key={openId}`, and a SidePanel mounted after hydration with `isOpen` counts as an opening.
21. **The table's name is required (Task 2, choice).** DataTable's props intersect `AriaName`, so a table with neither `aria-label` nor `aria-labelledby` does not compile.
22. **Busy and the status (Task 2, found while implementing).** Task 1's fix (3501ef9) keeps a loading status outside the `aria-busy` element and always mounted, since a screen reader may hold back what changes inside a busy part. So `aria-busy` goes on `div.data-table-grid`, the face that loads, not on `div.data-table` (Behavior 1), and `DataTableStatus` is the grid's sibling, mounted empty and given its text `QUIET_MS` after loading starts; Task 4's list face takes its own `aria-busy` the same way. React Aria's empty cell is a `rowheader`, which axe's `empty-table-header` rule fails while it holds only `aria-hidden` skeletons, so the loading body also holds `labels.loading` in a visually hidden `span.data-table-loading`.
23. **The docs stage is narrower than 40rem (Task 2, found while implementing).** At a 1440px window the docs preview stage is about 35rem wide, so every data table example on the docs site draws without its `md` and `sm` columns, and after Task 4 it would draw the list face at every window width. Resolved in Task 2's review round: `Preview` takes `wide` (`apps/docs/components/mdx/preview.tsx` and `preview-tabs.tsx`), which draws the stage as `div.stage.stage-wide` with 16px sides, and `shell.css` folds a page's side column under its content from 1440px too while the page holds a wide stage (`.panel:has(.stage-wide)`), as it does under 1440px, its outline card left out, so every column of the content grid is the stage's. The data table page's four previews are wide, and the figures example's card lost its 640px cap: a data table box is about 48.8rem at a 1280px window, 58.8rem at 1440px and 71.3rem at 1920px (about 33rem at 1024px, where the rail still stands), so "Columns that leave" draws Full, 44rem and 38rem differently from 1280px up; pages without a wide preview keep their side column. The end-to-end tests that target the table face call `expectTableFace` (`tests/support.ts`), which fails while the table's box is under 40rem; the 320px and 375px loop (`LONG_TARGETS['data-table']`) still reaches the table face only until Task 4, which must point it at the face drawn there. The docs examples give their columns percentage widths: under `table-layout: fixed` a table whose fixed widths add up to more than its box grows past it, and before Task 4's list face a 7rem and an 8rem column would push a 320px page sideways. **Amended in Task 3's fix round (amendment 6, owner):** the page-wide stage is undone. `Preview` takes no `wide` any more and `shell.css` has no `.stage-wide` or `.panel:has(.stage-wide)` rules, so the data table page keeps the docs' usual layout, its side column beside the content with "On this page" from 1440px and folded under it below, as every page. Its examples draw at the stage's width: about 48.75rem (780px) of table box at a 1280px window, 36rem (577px) at 1440px and 44.4rem (711px) at 1920px, so at 1440px the `md` columns leave. "Columns that leave" draws the table at a set width, 56rem, 44rem or 38rem, inside a frame (`role="region"`, named, a tab stop, `overflow-x: auto`) that scrolls sideways on its own, so the page never scrolls sideways at 320px and the narrower boxes keep their dashed outline, drawn inside the box's edge so the frame does not clip it, and their caption. The end-to-end tests that need the table face run at Playwright's 1280px default and still call `expectTableFace`; the tests that set a box width use the columns example's box; the test that asserted the wide stage now asserts the side column and the frame.
24. **The R1 and R2 spike (Task 2, result).** The six plays of `Checks/React Aria table` passed in Chromium, WebKit and Firefox on CI at 61e10a5 with no change: a table row is the stretched link's containing block in all three engines, a press on it opens and never selects, Enter through the capture handler opens, the checkbox and a cell's Menu take their own press, a capture listener stops typeahead, a hidden cell is stepped over, and the header cells stick. R1's fallback was not needed.
25. **The story data's file (Task 2).** The shared story data is `packages/react/src/stories/transactions.ts`, not `.tsx`: it holds no JSX, and `server-components.test.tsx` fails any `.tsx` under `src` that is neither a client module nor a listed static one. Tasks 3 to 5 import it by the same path without the extension.
26. **A column that leaves keeps its cells (Task 2, found in the docs preview).** Behavior 8's `display: none` on a hidden column's header and cells broke the table's width: React Aria's empty cell spans every column of its collection (`colSpan` is the column count), so with a hidden column's header cell gone the loading body made a column with no header at the table's end, and the header and its rule ended short of the box while the skeleton rows ran to its edge; the owner also saw a table at 38rem end about 125px short of its box. A column that leaves now keeps its header and body cells at zero width, with no inline padding or border, and `visibility: hidden`, which takes them from sight, the pointer and assistive technology as `display: none` did; only a skeleton row's cell for it is `display: none`, since a skeleton row is a flex row inside the one spanning cell. A column's `width` is written on its header cell as `--data-table-column-width`, read as the cell's `inline-size`, so the stylesheet can set a leaving column to zero. The capture handler's hidden-cell test reads `visibility`. The `FullWidth` play proves, in Chromium, WebKit and Firefox, that the table is its box's width at full, 44rem and 38rem and that each skeleton cell sits under its header cell.
27. **A repeated row key (Task 2, found in review).** React Aria throws for a repeated key outside production (`collections/Document.mjs:278-286`) before DataTable's effect can warn, and in production its collection can loop forever, so the warning alone never reached anyone. DataTable now draws only the first row for a key and warns once that the next is left out.
28. **One tab stop (Task 3, found while implementing).** React Aria's `useFocusable` sets `tabindex="0"` on every focusable it draws, for Safari (`interactions/useFocusable.mjs:64-70`), so each row link and each selection checkbox was in the page's tab order. With a real Tab key in Chromium React Aria's grid still made the table one stop (its Tab handler and its focus redirect, `selection/useSelectableCollection.mjs`), but anything that follows the DOM's tab order, as Storybook's `userEvent.tab()` does, walked every row link. The row links and the checkboxes take `excludeFromTabOrder` (spread on the library's `Link`, whose type does not name it though React Aria's `useLink` reads it); the arrows still focus them, and the link keeps its pointer, middle click and context menu. The `TabStop` play pins it in three engines, and a docs end-to-end test pins it with the real Tab key: Tab and Shift+Tab leave the table from its row and come back to it, and with a row selected the next stop is the bar.
29. **The bar's Escape and focus (Task 3).** React Aria's `Toolbar` takes no key or focus handler: `GlobalDOMEvents` leaves keyboard and focus events out (`@react-types/shared` `dom.d.ts`), and `filterDOMProps` drops them. So Behavior 6's "the bar's `onKeyDown`" is DataTable's root capture handler, which takes Escape from inside the bar's DOM, and a root focus capture records whether focus is in the bar; the layout effect that puts focus on the grid when the bar leaves acts only when focus has fallen to the page.
30. **Shift, the anchor and the selection manager (Task 3).** A controlled `selectedKeys` given as an array loses React Aria's anchor on every change (`useMultipleSelectionState.mjs`, `convertSelection`), so Shift with an arrow could only add rows. DataTable hands React Aria back its own `Selection`, anchor and all, while the app holds the same keys. Where the hidden-cell handler takes a Shift arrow or Ctrl+Shift+Home or End, it extends the selection to the shown cell's row through React Aria's selection manager, read from `TableStateContext` (exported by `react-aria-components`) in the select-all column, so a hidden cell never stops Shift from extending; X toggles through the same manager, as Space does, so it sets the anchor too. `toggled` stays the fallback. The `ShiftPastHidden` play pins Shift+Arrow Right and Left past a hidden column in three engines.
31. **The handler's order and its editable targets (Task 3).** The hidden-cell keys move with Ctrl off a Mac and Alt on one, so they run before Behavior 8's step (c), not at (f). The plan's `EDITABLE` names every `input`, which includes the row checkbox the arrows focus in its cell, so X and letters there would reach typeahead; `EDITABLE` is the inputs that take text, a text area, a select and editable content. The first test is the plan's DOM guard: a key that reached the root only through React's tree, from a portal opened in a cell, passes.
32. **The modifier Enter in a play (Task 3).** React Aria's press handling stops a link's click at React's root, so the `ModifierEnter` play records the click in the capture phase and prevents only a modifier click's default, which would open a new tab (or, in WebKit, follow the link in the same tab); what each browser would then open is not observable in a play, and the record says what reached the link per engine.
33. **The modal guard (Task 3's fix round, found in review).** Spec 7.2's `isAnotherModalOpen()`, asked with no id, is true while the table itself sits in an open Dialog, Drawer or Sheet, so every key stood down there and React Aria's own Enter, typeahead and selection came back. The overlay stack keeps each open modal's scrim, and the handler asks `isUnderModal(root)`: whether the table's root is outside the top-most open modal. A table under a modal stands down; a table inside the top-most one keeps its keys (the `InDialog` play, in three engines). Keys from a portal stay rejected by the root's DOM test.
34. **Typeahead and the page's keys (Task 3's fix round, found in review).** Stopping every single printable key also stopped it reaching the page's own listeners, a "/" shortcut on the document among them. React Aria's typeahead runs on the grid in the bubble phase and cannot be turned off or reached in it (`useTypeSelect.mjs`; Table strips `disallowTypeAhead`, spec correction 10), and stopping React's propagation stops the native event's. So the handler stops only a key the typeahead would act on: one that some row's name, a row header cell's own text, the totals row's or a header's name starts with under React Aria's search collator (`useFilter({ sensitivity: 'base' })`, the comparison `getKeyForSearch` makes). Every other key passes, and React Aria's typeahead, finding nothing, lets it through to the page; a key it would act on React Aria stops itself once it moves focus, so the handler stops nothing React Aria would have let through. Spec 7.2's last row holds: a letter never moves focus.
35. **A press on a row without a link (Task 3's fix round, found in review).** With selection on, React Aria's cell selects its row on a pointer down when the row has no action (`useSelectableItem.mjs:170-178`), so a press on a row with no `getRowHref` selected it, against ruling 2 and spec 7.1. DataTable's root stops, in its capture phase, a pointer down, a mouse down and a virtual click (`detail` 0, a screen reader's) that land in a cell on none of its controls (`press.ts`, the list spec correction 14 raises, the checkbox's field among them). React Aria's cell stops those events itself, so nothing outside the table hears less. The `PressNeverSelects` play pins it in three engines.
36. **Stale keys and React Aria (Task 3's fix round, found in review).** Handing React Aria every selected key, stale ones included, drew an indeterminate header and made Escape clear a selection with no row on screen. React Aria gets only the selected keys in `items`; each change it makes reaches the app with the stale keys after its own, as R6 keeps them until the app drops them, and Clear selection clears every key.
37. **Enter on a row's checkbox (Task 3's fix round, found in review).** React Aria's checkbox toggles its row on Enter. The handler takes Enter on a target in the checkbox column (`[data-selection]`) as on the row: it opens the row's link, or, on the select-all box or a row without a link, does nothing, so Enter never selects.
38. **Focus after a bulk action's dialog (Task 3's fix round, found in review).** Behavior 6's layout effect found focus in a confirm dialog when the bar left (its Delete cleared the selection), did nothing, and focus then fell to the body as the dialog closed, its origin gone with the bar. When the bar leaves with focus in a portal, the body's child that holds it, DataTable watches that portal (a `MutationObserver` on the body's children and a `focusin` listener) and, once it has left the page with focus on the body, focuses the grid; focus the reader moves out of the portal ends the watch, and a portal is never the app's own tree, so nothing waits for good. Focus that leaves the bar for the page, not a portal, forgets the bar. The `ConfirmClears` play pins it.
39. **A selected row in forced colors (Task 3's fix round, found in review).** Spec 6.3's `highlight` with `highlighttext` and a `highlight` ring left a focused selected row's ring invisible on its fill (WCAG 2.4.7), and inside the forced repaint Chromium draws a backplate in the system's background color behind each run of text, which can blank HighlightText. The selected row is drawn with `forced-color-adjust: none`, its text, rules and rings HighlightText, no part with a fill of its own, and a checked box inverted; a focused selected row or cell is ringed HighlightText. The docs end-to-end test reads the pixels Chromium drew. Menu's chosen item, an active FilterChip, Calendar's selected day and preset, and DateRangePicker's focused segment draw the same pair inside the repaint and are not changed here.
40. **The totals row, the status and the bar's text fields (Task 3's fix round, found in review).** React Aria writes `aria-selected="false"` on the totals row while selection is on; a ref removes it once the row is drawn (the server's HTML keeps it until hydration). The hover wash is drawn on body rows only. The count's status keeps its words through a run of changes that ends where it began, so 2, 3, 2 is not said again. Escape in a text field inside the bar is the field's.
41. **Page Up and Page Down (Task 3's fix round, amendment 5, risk R4).** React Aria measures a page against the whole table when the page scrolls, so the keys reached the first or the last row. The capture handler takes them from a body row or cell (a header's and a key with Ctrl, Alt or Meta stay React Aria's) and moves by the rows that fit in the view: the height of the nearest ancestor that scrolls, or the window, less the sticky offset and the header row and, while it shows, the bar, over the focused row's height; from a cell to the same column's cell, never past the first or the last row, and with Shift it extends the selection to the row it reaches through React Aria's manager. The `PageKeys` play pins it in three engines.
42. **A focused row under the sticky header or the bar (Task 3's fix round, amendment 5, WCAG 2.4.11).** Rows and body cells carry `scroll-margin-block` of `--page-sticky-top` plus the 40px header row above and, while the bar shows (`.data-table:has(> .data-table-bar)`), the bar's inset and height below; list items (Task 4) read the same `--data-table-scroll-start` and `--data-table-scroll-end`. A browser honors a scroll margin only when focus scrolls a row that is partly out of the view: Chromium's `scrollIntoView({ block: 'nearest' })`, which React Aria calls, leaves a row wholly inside the view and under the sticky header or the bar where it is (probed in Chromium in this round: a row whose box is in the view is not scrolled, a row partly out of it is, to its margin). So DataTable's root focus capture also scrolls a focused body row or cell clear of the header row and the bar, two frames later, after React Aria's own scroll (`scroll.ts`, `uncover`). The `ScrollClear` play walks J and K under a 64px page header with the bar shown in three engines.
43. **The header row's ends (Task 3's fix round, amendment 5).** React Aria wraps Arrow Left and Right from one end of the header row to the other; the handler stops them at the shown ends instead, as it already stepped over a header that has left (this amends correction 8's wrap). The `ArrowsSkipHidden` play pins it.
44. **Shift with a press on a row checkbox (Task 3's fix round, amendment 5).** React Aria's checkbox toggles on its label's press, and when the label never hears the click of a press it started, it clicks the label itself 80ms later (`usePress.mjs`, its pointer up). With Shift held, DataTable's root stops the press on a row's box before React Aria starts one, cancels the click, and extends the selection from the anchor through React Aria's manager, as Shift with an arrow does; the select-all box and a press without Shift are the box's. The `ShiftPressRange` play pins it in three engines.
45. **The error state (Task 3's fix round, amendment 2).** `error` is a `ReactNode`. With no rows it is React Aria's empty body in place of `emptyState`; with rows it is `div.data-table-error[role="status"]`, a polite region mounted empty between the grid and the bar, so the error is heard as it arrives, and empty it takes no room. It wins over `isLoading`: no `aria-busy`, no loading words, no skeleton rows and no reloading cue while it stands, and no warning for a missing `emptyState`. Its line is the one use of `--color-error` in `data-table.css` (6.58 and 6.36 on canvas, 7.22 and 5.73 on lifted, gated): an error is exactly that, so the Global Constraints' "error appears nowhere in the library's own drawing" holds for everything else.
46. **The reloading cue (Task 3's fix round, amendment 5).** While rows already shown load again, `QUIET_MS` after it starts, as the status speaks, `div.data-table-grid` takes `data-reloading` and every header cell draws a 2px ink line at its foot (the cells are sticky, so positioned, and each holds its part of one line), pulsing as a skeleton does over 1.6s, still under reduced motion and CanvasText in forced colors. No text dims: the body at 60% opacity measured ink at 4.62 on canvas in light and would take an app's slate text under 3, so the cue is a line, not a fade.
47. **`disabledBehavior`, `firstSortDirection`, `isHeaderHidden` and `overflow` (Task 3's fix round, amendment 5 and 4).** `disabledBehavior` goes to React Aria's Table; with `'selection'` a disabled row keeps its link, its focus and its ink, and only its box is disabled, while select-all and X skip it either way. React Aria starts every newly sorted column ascending, so DataTable maps a press that changes the sorted column to that column's `firstSortDirection`, and each later press keeps React Aria's flip: two states, ruling 12 kept. `isHeaderHidden` hides the header's label from sight only (`data-header-hidden`), the column keeping `header` as its text value and name. `overflow: 'wrap'` sets `data-overflow` on the cells and clamps their content in a `span.data-table-wrap` to two lines (`-webkit-line-clamp`, since a table cell cannot be the clamping box); a column with `align: 'end'` never wraps.
48. **The docs site's sticky offset (Task 3's fix round, amendment 5; open question 3).** The docs header sticks with no fixed height, so `DocsHeader` writes its own height to `--page-sticky-top` on the root element through a `ResizeObserver`, and a data table header stops under it; a docs end-to-end test pins it.

49. **Select mode on the list face (Task 4, amendment 3, choice).** With selection on and rows to show, `div.data-table-list-head` sits above the list and holds one tertiary `Button`, `button.data-table-list-mode` at its inline end, named `labels.selectItems` ("Select"). Pressed, it shows every item's `Checkbox slot="selection"` (out of the tab order, as the table's, so the list stays one tab stop) and, leading the head, the library's own `Checkbox` named `labels.selectAll`, checked or indeterminate from the selection, which gives every enabled row's key or none, as the table's select-all does; the button then reads `labels.doneSelecting` ("Done"), and Done hides the boxes and keeps the selection. The amendment's "select-all in the bar" is read as this bar above the list, where Select sits: iOS Mail puts Select All at the leading end of the bar whose trailing end is Done, and the bulk-action bar is shared by both faces and leaves when nothing is selected, so a select-all there could not select the first row. The button is a plain button whose name says what it does next, iOS Mail's and Photos' Select and Done, not a toggle with `aria-pressed`: a toggle button's name must not change with its state (the APG's button pattern), and "Select, pressed" says less than "Done". Focus stays on the button after Select and after Done: it is the same element, Select all is drawn before it and it keeps the inline end, so a second press undoes the first and a screen reader hears its new name on the focused element. Select mode is the list's own state, off at first, so the server's HTML draws no box, and it outlives a selection that empties, as iOS's does; with no rows the head is not drawn. The table face is unchanged. The `SelectMode` play pins it by keys in three engines, and a docs end-to-end test by taps. A tap on an item still opens it in Select mode (ruling 2; open question 8).
50. **A selection outside Select mode (Task 4, choice).** The `GridList` is `selectionMode="multiple"` whenever selection is on, in Select mode or not, so the grid stays `aria-multiselectable` and every item says whether it is selected: a screen reader's selection semantics never change with the mode. X and Space toggle the focused item whether its box shows or not, as in the table face, so one Keys table serves both faces and a keyboard or screen reader user need not find a mode first. A selected item out of Select mode keeps a mark, `span.data-table-item-mark`, the checked box's look drawn (a 20px ink box, `--radius-micro`, a canvas Lucide `Check`, `aria-hidden`), beside its 8% wash, so the selection is never color alone after Done, after X, or when the list is drawn with a selection made in the table face before the box narrowed; the bar shows the count in every case. Both faces are always mounted and a container query picks one, so the list cannot tell when it starts to show without measuring; the mark needs no such test. Rejected: turning Select mode on when the list appears with a selection, which needs a `ResizeObserver` on the box and changes the page under the reader; and drawing only the selected items' real boxes, which would unmount a box under focus as Space unchecked it.
51. **The list's markup (Task 4).** `div.data-table-list` follows `div.data-table-grid` and takes its own `aria-busy` and `data-reloading`, as correction 22 says; it holds the head, the `GridList` and, with totals and rows, `div.data-table-list-total`. Without `getGroup` the items are the `GridList`'s own children and there is no section: React Aria names a section's `rowgroup` by `aria-labelledby` to its header's id, which with no `GridListHeader` names nothing (axe's `aria-valid-attr-value`). `groupsOf` returns no group for no items, so no empty section counts in React Aria's collection and keeps the empty body away, as the footer did in correction 3. Each cell in a slot is a `span.data-table-item-part`, a part step from the next on its line; the library writes no separator. A line holding a column with `overflow: 'wrap'` clamps at two lines (amendment 4); end cells stack at the item's end; the totals line lists the end slot's totals. The skeleton items hold `labels.loading`, hidden from sight, as the table's empty cell does. The reloading cue is the header's line drawn at the foot of each day heading, or at the top of an ungrouped list, sticky there.
52. **The keys in the list (Task 4, spec correction 10 and 34).** The `GridList` takes `disallowTypeAhead`, so in the list no letter would move focus and the capture handler stops none: every letter reaches the page there. X and a Shift press on a box go through React Aria's selection manager for the list, read from an item's render values by the first item, so X sets the list's anchor and Shift with an arrow, Page Down or a press extends from it. Keys from the head are its controls' own, as the bar's are. A list item's one cell draws nothing (`display: contents`) and takes no focus, so Page Up and Page Down from a control in an item move to an item; the page height and the scroll clear read the item's own sticky day heading where the table reads its header row. An item's padding is in no cell, so a press there reached React Aria's item and selected it; the press guard takes the item as its own cell.
53. **`hideBelow: 'sm'` and the switch (Task 4).** Rulings 6 and 8 both name 40rem of the box, so under 40rem the table face is not drawn at all and an `'sm'` column is never seen leaving it; in the list, every column goes where its `listSlot` says. The prop is kept as the spec types it, the docs say what it now does, and the `FullWidth` and `CurrentBarPastHidden` plays assert the list at 38rem where they asserted the table without its `sm` columns. Open question 9.
54. **R3, measured (Task 4).** The story columns (five, the list placing three) with links and `getGroup`, `renderToString` in Node: 50 rows 127,484 bytes, the list face 48,408 of them; 200 rows 479,582 bytes, the list 171,615. With selection on, the table's checkbox column and the list's marks: 50 rows 195,052 and 200 rows 747,075. Gzipped, 200 rows are 18,315 and 26,476 bytes. Two columns, as the plan's probe: 57,289 and 224,419 bytes. The 200-row page with both faces is over 400 kB (open question 6); the list face is about a third of it and the table's selection column the larger part. Not changed here; reported.
55. **Tests and the faces (Task 4).** jsdom runs no container query, so the table face's unit tests hide the list with `showFace('table')` (`test/dom.ts`, a style element jsdom's computed style and Testing Library's queries read) and the list's tests the table. A large `Dialog`'s body is under 40rem, so the `InDialog` play now drives the list face. The list's stories take the meta's `viewport-desktop` off (`'!viewport-desktop'`) for `viewport-phone`. `BOX_WIDTHS`' 38rem asserts the list.
56. **Labels, the size and the docs (Task 4).** `DataTableLabels` gains `selectItems` ("Select") and `doneSelecting` ("Done"). The `{ DataTable }` entry measured 8.02 kB, which the rule sets at 9 kB (the list face, GridList's markup and the Select mode; Checkbox, Button and Link it already carried). The story columns and every docs example's columns gain a `listSlot`, so at 320px each example reads as a list; `LONG_TARGETS['data-table']` targets the list's title and meta lines as well as the table's cells, and `SERVER_RENDERED` the list's rows. The plan's PhoneSelected story shows marks, and a `PhoneSelecting` story shows Select mode, four more baselines (owner action 2).
57. **A selected list item in forced colors (Task 4, spec correction 39).** As a selected row: `forced-color-adjust: none`, `Highlight` with `HighlightText`, every part in the pair, the checked box and the mark drawn inverted, a focused selected item ringed `HighlightText`; a docs end-to-end test reads the pixels Chromium drew for the title, the mark and the box.

## Owner actions

These need the owner's accounts, machine or devices, so the implementer reports them rather than doing them.

1. **A pull request for CI.** CI runs on pull requests and on `main` only (`.github/workflows/ci.yml:5-8`), and the WebKit and Firefox story projects run only there for this plan. Open a draft pull request from `feat/data-table` to `main` before Task 2's spike commit is pushed (or let the implementer run `gh pr create --draft` if its `gh` is signed in), so each push runs `storybook-webkit` and `storybook-firefox`.
2. **Docker, for the baselines.** Each component task's visual step runs `pnpm --filter @snapshot-ui/storybook visual:docker`, which needs Docker and the `mcr.microsoft.com/playwright:v1.64.0-noble` image. The owner runs it once, after Task 6, on their machine and commits the new files in one baselines commit, as for 3a and 3b: Task 1, 37; Task 2, 45; Task 3, 37 (17, and 20 from its fix round: `components-datatable--{error-empty,error-with-rows,wrapping-column,header-hidden,disabled-selection}--{light-rounded,dark-rounded,light-soft,light-square}.png`); Task 4, 33 (29, and `components-datatable--phone-selecting--{light-rounded-375,dark-rounded-375,light-soft-375,light-square-375}.png`, spec correction 56); Task 5, 24. That is 176 new baselines and no changed one, 1915 in all; Task 6 adds none and runs the check only.
3. **Merges.** Merge `feat/data-table` into `main` by pull request once Task 6 is green; then merge the "Version Packages" pull request the release workflow opens, which takes `@snapshot-ui/core` and `@snapshot-ui/react` to 0.6.0 from the four minor changesets and `@snapshot-ui/charts` to 0.1.3 from its patch changeset, whose core peer becomes `^0.6.0`. All three packages already have their trusted publisher, so the release workflow publishes with provenance and no hand step.
4. **Devices and screen readers, before the release** (risks R5, R7; spec corrections 2, 5, 9). With VoiceOver on macOS and NVDA: a row reads its row header and cells, the current row's link reads as current, a row checkbox reads "Select Groceries, 12 October", the sort change and the selection count are announced and how often, the bar reads as a toolbar named "Bulk actions", and the panel reads as a complementary landmark named by its title with focus on its heading. On a real iPhone and an Android phone: the list face's items open on a tap and select on the checkbox, the bar sits above the tab bar, and the side panel opens as a sheet and closes on a swipe. Record each result in its Appendix B section; until then the records say "not yet verified".

## Open questions

Settled in this plan as the recommendation, and worth the owner's eye:

1. **Selection is announced twice** (spec correction 9). React Aria announces each selection change assertively in its own English, and the bar's status says the count politely in the app's words after `QUIET_MS`. Recommended: keep both, since only the bar's is Persian; the alternative, the bar's status only when focus is outside the grid, is one line in `DataTableStatus` once the owner's screen readers have been heard.
2. **`labels.select` instead of `labels.selectRow`** (spec correction 5). Recommended as written; the alternative, taking React Aria's `aria-labelledby` off each checkbox, needs a context override of every row's checkbox props.
3. **The docs site sets no `--page-sticky-top`.** Resolved in Task 3's fix round by the owner's amendment 5: the docs header writes it (spec correction 48). As first written: The docs shell's header is sticky with no fixed height (`apps/docs/components/shell/shell.css:150-155`), so on the data table page a scrolled example's header slides under it. Recommended: leave it; the `StickyHeader` story and the recipe's end-to-end test pin the offset, and the docs say an app sets it.
4. **The catalog's "Master detail" chip stays text.** The side panel is the detail half of a master-detail page, but the page is titled "Side panel", and a chip links only by its title. Recommended: leave it until a master-detail recipe page exists.
5. **`hideBelow: 'sm' | 'md'`** (spec correction 15) reads like the breakpoint tokens and is not. Recommended: keep the spec's names, with the widths in the prop's comment and the docs; the alternative is `hideBelow: '40rem' | '48rem'`.
6. **Two faces in the server's HTML** (R3). Task 4 measures a 50-row and a 200-row page with both faces. If the 200-row page is over 400 kB, the implementer reports the numbers before the release; the fallback, the hidden face mounted only after hydration, is a change to DataTable alone. **Measured in Task 4 (spec correction 54):** 200 rows of five columns are 479,582 bytes with both faces and 747,075 with selection on, over 400 kB, 18,315 and 26,476 gzipped; the list face is about a third. For the owner to decide before the release.
7. **Enter with a modifier in WebKit** (spec correction 6). If the spike shows WebKit ignoring the synthetic click's modifier, the record says so and the docs point to Arrow Right onto the link; nothing else changes.
8. **A tap on an item in Select mode** (spec corrections 49 and 50). Ruling 2 holds there too: a tap on an item opens it, and only its box selects. iOS Mail and Photos, Gmail and Material lists toggle an item on a tap while their selection mode is on. Recommended: keep ruling 2, since a tap meaning two things by a mode the reader may not see is what the ruling avoids; the alternative is a press guard that, in Select mode only, turns a press on an item into its toggle.
9. **`hideBelow: 'sm'`** (spec correction 53) names the width at which the table gives way to its list, so it no longer changes anything. Recommended: keep it until the API's next breaking release and drop it then; the alternative is a lower switch, such as 36rem, which ruling 8 does not name.

---

### Task 1: EmptyState and Skeleton

**Goal:** two static parts any page can use: an empty state that says what is missing, what to do, and offers one action, drawn in slate and ink and never taupe; and a skeleton, a still shape with no text that pulses gently and says nothing to a screen reader. Both import nothing from React Aria and render in a server component. Implements spec 5, 10.1 ruling 9 (the pulse), 10.2 items 1 and 2, 11 (the static parts), 12 (EmptyState and Skeleton) and 13 (the `empty-state` and `skeleton` pages and their records).

**Files:**

- Create: `packages/react/src/empty-state/EmptyState.tsx`, `packages/react/src/empty-state/index.ts`, `packages/react/src/skeleton/Skeleton.tsx`, `packages/react/src/skeleton/index.ts`
- Modify: `packages/react/src/index.ts`, `packages/react/.size-limit.json`
- Test: `packages/react/src/empty-state/EmptyState.test.tsx`, `packages/react/src/skeleton/Skeleton.test.tsx` (create), `packages/react/test/server-components.test.tsx` (`STATIC` rows, `STATIC_MODULES`), `packages/react/test/empty-parts.test.tsx` (a new describe)
- Create (stories): `packages/react/src/empty-state/EmptyState.stories.tsx`, `packages/react/src/skeleton/Skeleton.stories.tsx`; Modify: `packages/react/src/rtl/RightToLeft.stories.tsx` (`EmptyStateMirrored`)
- Create: `packages/core/src/components/empty-state.css`, `packages/core/src/components/skeleton.css`
- Modify: `packages/core/src/styles.css` (both imports after `filter-bar.css`)
- Test: `packages/core/test/css.test.js`, `packages/core/test/contrast.test.js`
- Create: `apps/docs/content/docs/components/empty-state.mdx`, `apps/docs/content/docs/components/skeleton.mdx`, `apps/docs/examples/empty-state-basic.tsx`, `apps/docs/examples/empty-state-in-card.tsx`, `apps/docs/examples/skeleton-shapes.tsx`, `apps/docs/examples/skeleton-card.tsx`
- Modify: `apps/docs/content/docs/components/meta.json` (`"empty-state"` after `"drawer"`, `"skeleton"` after `"sidebar"`), `apps/docs/examples/index.ts`, `apps/docs/app/(home)/home-page.tsx` (the footer's "Empty state" link after "Drawer" and "Skeleton" after "Sidebar"; the catalog's "Empty state" chip becomes `<Link className="chip" href="/docs/components/empty-state">`)
- Test: `apps/docs/tests/components.spec.ts`, `apps/docs/tests/home.spec.ts` (21 linked chips)
- Modify: `packages/core/README.md`, `packages/react/README.md` ("Empty state" after "Drawer", "Skeleton" after "Sidebar")
- Modify: `docs/design-system.md` (`## EmptyState` and `## Skeleton` appended to Appendix B, after `## FilterBar`; edited by hand, never with Prettier)
- Create (Docker step): 37 baselines, listed in Step 7. None changes.

**Interfaces:**

- Consumes: the library's `cx` and `present`; the tokens `--spacing-separate`, `--spacing-peer`, `--spacing-part`, `--text-h4` and its line height, `--text-small` and its line height and weight, `--color-ink`, `--color-slate`, `--color-divider`, `--radius-micro`, `--radius-control`, `--radius-dot`, `--size-field`, `--size-target`.
- Produces, two static modules exported from `@snapshot-ui/react` as `EmptyState`, `EmptyStateProps`, `Skeleton` and `SkeletonProps`, the spec's types unchanged:

```ts
// No directive: both are server parts.
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

export function EmptyState(props: EmptyStateProps): ReactElement;
export function Skeleton(props: SkeletonProps): ReactElement;
```

- Later tasks rely on: `EmptyState` as DataTable's `emptyState` in stories, docs and the recipe (Tasks 2, 4, 6); `Skeleton` in DataTable's loading body (Tasks 2 and 4).

**Behavior:**

1. **EmptyState markup, in DOM order.** `div.empty-state` (`className` merged after, `ref`) holding `span.empty-state-icon[aria-hidden="true"]` with `icon` while `present(icon)`, then `h{headingLevel}.empty-state-title` with `title`, then `p.empty-state-description` while `present(description)`, then `div.empty-state-action` while `present(action)`. No state, no effect, no context: it renders under React's server build (`server-components.test.tsx:15-28`).
2. **Skeleton markup.** `span.skeleton[data-shape][aria-hidden="true"]` with no text, `className` merged after, and an inline `style` of `{ inlineSize: width, blockSize: height }` holding only the sizes given, so a skeleton with neither writes no `style` attribute. It says nothing to a screen reader: the part that shows skeletons says "Loading" once in its own status (spec 5.2).
3. **Sizes.** A line is 100% wide and `1em` tall, sitting on the text's line box, so a row of skeleton lines is the height of a row of text; a block is a field tall (`--size-field`, 48px, 36px compact) by default, recorded as derived; a circle is the target, 40px (`--size-target`).
4. **The pulse.** Between the fill and half of it (opacity 1 to 0.5 and back) over 1.6s, ease in and out, forever; still under `prefers-reduced-motion: reduce` (ruling 9). Playwright's screenshots stop it at its first frame.
5. **Server.** Both render in a server component with no client API, and the docs pages' examples are server files.

**CSS**, the whole of `empty-state.css`:

```css
/*
 * EmptyState: what a page or a table shows where it has nothing yet, derived in docs/design-system.md
 * ("EmptyState"). A centered column: the app's icon at 24px in slate, a part step over the title; the title at
 * the h4 step at 700 in ink; a slate line, at most 32rem wide, that says what to do; and one action a peer step
 * under them. The text is slate and never taupe: the document's empty state text is slate, and the reader
 * needs to read it. Static: no state, so a server component draws it.
 */
@layer components {
  .empty-state {
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: var(--spacing-separate) var(--spacing-peer);
    color: var(--color-ink);
    text-align: center;
  }

  .empty-state-icon {
    display: inline-flex;
    margin-block-end: var(--spacing-part);
    color: var(--color-slate);
  }

  .empty-state-icon svg {
    width: 24px;
    height: 24px;
  }

  .empty-state-title {
    margin: 0;
    color: var(--color-ink);
    font-size: var(--text-h4);
    line-height: var(--text-h4--line-height);
    font-weight: 700;
    overflow-wrap: anywhere;
  }

  .empty-state-description {
    max-inline-size: 32rem;
    margin: 0;
    margin-block-start: 0.25rem;
    color: var(--color-slate);
    font-size: var(--text-small);
    line-height: var(--text-small--line-height);
    font-weight: var(--text-small--font-weight);
    overflow-wrap: anywhere;
  }

  .empty-state-action {
    margin-block-start: var(--spacing-peer);
  }

  /* The text takes the reader's colors on its own; the icon is named so it follows the text. */
  @media (forced-colors: active) {
    .empty-state-icon {
      color: CanvasText;
    }
  }
}
```

**CSS**, the whole of `skeleton.css`:

```css
/*
 * Skeleton: a still shape where content will be, derived in docs/design-system.md ("Skeleton"). The fill is the
 * divider color, ink at 10% (white at 10% in dark), which reads as a shape once it is a filled bar and not a 1px
 * rule. A line is 1em tall at the micro radius and sits on the text's line box; a block is a field tall at the
 * control radius; a circle is the 40px target at the dot radius. It pulses between the fill and half of it over
 * 1.6s and stands still under reduced motion. It is hidden from assistive technology; the part using it says
 * "Loading" once.
 */
@layer components {
  .skeleton {
    box-sizing: border-box;
    display: inline-block;
    inline-size: 100%;
    block-size: 1em;
    vertical-align: middle;
    border-radius: var(--radius-micro);
    background-color: var(--color-divider);
    animation: skeleton-pulse 1.6s ease-in-out infinite;
  }

  .skeleton[data-shape='block'] {
    display: block;
    block-size: var(--size-field);
    border-radius: var(--radius-control);
  }

  .skeleton[data-shape='circle'] {
    inline-size: var(--size-target);
    block-size: var(--size-target);
    border-radius: var(--radius-dot);
  }

  @keyframes skeleton-pulse {
    0%,
    100% {
      opacity: 1;
    }

    50% {
      opacity: 0.5;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .skeleton {
      animation: none;
    }
  }

  /* Out of the forced repaint, so the shape keeps a fill: CanvasText at 20%, or GrayText where color-mix fails. */
  @media (forced-colors: active) {
    .skeleton {
      forced-color-adjust: none;
      background-color: GrayText;
      background-color: color-mix(in srgb, CanvasText 20%, canvas);
    }
  }
}
```

**Code** (EmptyState's heading, because the level is a prop and the element must be one of three):

```tsx
// EmptyState.tsx: no directive. A server component renders it.
export function EmptyState({
  title,
  description,
  icon,
  action,
  headingLevel = 3,
  className,
  ref,
}: EmptyStateProps): ReactElement {
  const Title = `h${String(headingLevel)}` as 'h2' | 'h3' | 'h4';
  return (
    <div ref={ref} className={cx('empty-state', className)}>
      {present(icon) ? (
        <span className="empty-state-icon" aria-hidden="true">
          {icon}
        </span>
      ) : null}
      <Title className="empty-state-title">{title}</Title>
      {present(description) ? <p className="empty-state-description">{description}</p> : null}
      {present(action) ? <div className="empty-state-action">{action}</div> : null}
    </div>
  );
}
```

**Tests, written first:**

- `EmptyState.test.tsx`:
  - `it('draws the title as an h3 by default, and as an h2 or h4 at headingLevel 2 or 4')`
  - `it('draws the icon before the title, hidden from assistive technology')`
  - `it('draws the description and the action only when given')`
  - `it('passes className and ref to the root')`
  - `it.each(AXE_CASES)('has no axe violations %s')`, one test per state: the title alone; icon, title, description and action; inside a `Card` with a `CardTitle` at level 2.
  - type tests with `// @ts-expect-error`: no `title`; `headingLevel={5}`; a `title` that is an element.
- `Skeleton.test.tsx`:
  - `it('is an aria-hidden span with no text, a line by default')`
  - `it('marks its shape as data-shape line, block or circle')`
  - `it('writes width and height as inline sizes only when given, and no style attribute without them')`
  - `it('passes className')`
  - `it.each(AXE_CASES)('has no axe violations %s')`: a line, a block and a circle, each beside a status that says "Loading".
- `server-components.test.tsx`, `STATIC` rows: `['EmptyState', <EmptyState title="No transactions this month" description="Try another month." />, '<div class="empty-state"><h3 class="empty-state-title">No transactions this month</h3><p class="empty-state-description">Try another month.</p></div>']`; `['Skeleton', <Skeleton />, '<span class="skeleton" data-shape="line" aria-hidden="true"></span>']`; `['Skeleton circle', <Skeleton shape="circle" width="2rem" />, '<span class="skeleton" data-shape="circle" aria-hidden="true" style="inline-size:2rem"></span>']`; and `STATIC_MODULES` gains `'empty-state/EmptyState.tsx'` and `'skeleton/Skeleton.tsx'`.
- `empty-parts.test.tsx`, a new `describe('an empty data part slot')` (Tasks 2 to 5 add to it): `it('draws no icon, description or action in an EmptyState given false, an empty string or null')` (`<EmptyState title="Nothing" icon={false} description="" action={null} />` renders no `.empty-state-icon, .empty-state-description, .empty-state-action`).
- `css.test.js`:
  - In `describe('src/styles.css')`, `it('imports the data files after the filter files, in order')`: `empty-state.css` after `filter-bar.css`, `skeleton.css` after it, and `data-table.css` and `side-panel.css`, each checked only once it exists, follow in that order.
  - `describe('src/components/empty-state.css')`, on the closed-up source: `it('centers a column, padded a separate step by a peer step')`; `it('draws the icon 24px in slate, a part step over the title')`; `it('sets the title at the h4 step at 700 in ink')`; `it('sets the description at the small step in slate, never taupe, 32rem at most')`; `it('puts the action a peer step under the text')`; `it('draws the icon CanvasText in forced colors')`.
  - `describe('src/components/skeleton.css')`: `it('fills a line 1em tall at the micro radius with the divider color, on the line box')`; `it('draws a block a field tall at the control radius and a circle the target at the dot radius')`; `it('pulses between the fill and half of it over 1.6s, and stands still under reduced motion')`; `it('opts out of the forced repaint with GrayText and then CanvasText at 20% through color-mix')`.
- `contrast.test.js`: `describe('the empty state')`: `it('cites ink and slate on canvas, lifted and float, which the gate holds')`; `it('measures the pairs Appendix B records, in both modes')`: the title, ink on canvas 16.25 and 19.31 and on lifted 17.84 and 17.42; the description, slate on canvas 4.84 and 7.26 and on lifted 5.31 and 6.94. `describe('the skeleton')`: `it('measures the fill and its pulse against canvas and lifted, recorded and not gated')`: the divider over canvas 1.23 and 1.28, over lifted 1.23 and 1.34; half of it over canvas 1.11 and 1.11, over lifted 1.11 and 1.14.
- Stories, `EmptyState.stories.tsx`, title `Components/EmptyState`, each in a box `width: min(40rem, 100%)`:
  - `Default` (tags `['density']`): Lucide `Receipt` icon, "No transactions this month", "Transactions you add or import show here.", a secondary `Button` "Import transactions".
  - `TitleOnly`: "Nothing to review".
  - `InCard`: inside a `Card` on lifted, with `CardHeader` and `CardTitle` "Recent activity" at level 2, the empty state at level 3 with Lucide `SearchX`, "No matches", "Try fewer filters.", a tertiary `Button` "Clear filters".
  - `RightToLeft`: `dir="rtl"` in `I18nProvider locale="fa-IR"`, "تراکنشی در این ماه نیست" with a Persian line and button.
  - `no-visual`: `HeadingLevels` (play asserts the three levels' tags), `IconHidden`.
- Stories, `Skeleton.stories.tsx`, title `Components/Skeleton`:
  - `Shapes` (tags `['density']`): a line, a 12rem line, a block and a circle, in a column with the part gap.
  - `TextLines`: three lines at 100%, 90% and 60% beside a paragraph of `--text-body` text and a row of `--text-small` text, each skeleton line the height of its text's line.
  - `OnCard`: a `Card` on lifted holding a circle, two lines and a block: a card that is loading.
  - `no-visual`: `Hidden` (play asserts `aria-hidden="true"` and empty text on every skeleton), `Pulse` (play asserts the computed `animation-duration` is `1.6s`).
- `RightToLeft.stories.tsx`, `EmptyStateMirrored`: play asserts the title and the action are centered and the description's `direction` is `rtl`.
- Docs end-to-end: `components.spec.ts`: `LONG_TARGETS['empty-state'] = ['.stage .empty-state-title', '.stage .empty-state-description']`; `NO_LONG_TEXT.skeleton = 'a skeleton draws shapes and no text'`; `SERVER_RENDERED['empty-state'] = ['.stage .empty-state', '.stage .empty-state-title']`; `SERVER_RENDERED.skeleton = ['.stage .skeleton']`. In `test.describe('forced colors')`: `test('a skeleton keeps a fill and an empty state icon is CanvasText')`. `home.spec.ts`: the linked-chip count becomes 21, its comment naming Empty state.

**Docs:**

- `empty-state.mdx`, title "Empty state", description "What a page or a table shows where it has nothing yet: what is missing, what to do, and one action.", icon `Inbox`. Sections: `## Basic` (`empty-state-basic`: an icon, the title, the line and one Button; the title says what is missing in the reader's words, and the line what to do), `## In a card` (`empty-state-in-card`: `headingLevel` follows the card's title; a card's empty body), `## Usage` (static: a server component renders it with no client JavaScript; pass a Lucide icon element, which the empty state draws at 24px and hides from assistive technology; one action at most), `## Props` (table "EmptyState props", `EmptyStateProps`, from `../../packages/react/src/empty-state/EmptyState.tsx`), `## Accessibility` (a heading at `headingLevel`, so it fits the page's outline; the icon is hidden; the action is your own control), `## Design rules` (dos: say what is missing and what to do, offer the one action that fixes it, match `headingLevel` to the page; donts: never taupe or a placeholder's look for the text, never two actions, never an illustration in place of the words).
- `skeleton.mdx`, title "Skeleton", description "A still shape where content will be, so a loading page keeps its layout.", icon `SquareDashed`. Sections: `## Shapes` (`skeleton-shapes`: line, block, circle; `width` and `height` as CSS lengths), `## A card that is loading` (`skeleton-card`), `## Usage` (static; hidden from assistive technology, so say "Loading" once in your own status, as the data table does; size each shape as the content it stands for, so nothing moves when it arrives; the pulse stops under reduced motion), `## Props` (table "Skeleton props", `SkeletonProps`, from `../../packages/react/src/skeleton/Skeleton.tsx`), `## Accessibility` (aria-hidden, no focus; the loading state is the holder's to say), `## Design rules` (dos: the shape of what is coming, one status line that says Loading; donts: never a skeleton for a fetch shorter than a moment, never text inside one, never a spinner beside it).
- Examples: all four are server files.
- `docs/design-system.md`, `## EmptyState`: the column, its paddings (32px by 24px), the icon's 24px and 8px, the title at the h4 step at 700, the description's 4px, 32rem cap and slate (the table of text colors names an empty state slate, `docs/design-system.md:886`, which overrides the older "placeholder-like" line, `:42`), the action's 24px, the measured pairs (ink 16.25 and 19.31 on canvas, 17.84 and 17.42 on lifted; slate 4.84 and 7.26, 5.31 and 6.94; gated), forced colors, and where it is used (a page's card, DataTable's empty body). `## Skeleton`: the fill and why the divider color (1.23 and 1.28 on canvas, 1.23 and 1.34 on lifted, half of it 1.11 to 1.14, a decoration hidden from assistive technology, recorded), the three shapes and their tokens, the line box, the pulse and reduced motion, the forced-colors fill, and that the holder speaks.

**Steps:**

- [ ] **Step 1: Write the failing tests** listed above, stories included.
- [ ] **Step 2: Run them and watch them fail**

```bash
source /opt/nvm/nvm.sh
pnpm turbo run build --filter=@snapshot-ui/core --filter=@snapshot-ui/react
pnpm --filter @snapshot-ui/core exec vitest run test/css.test.js test/contrast.test.js
pnpm --filter @snapshot-ui/react exec vitest run
pnpm --filter @snapshot-ui/storybook exec vitest run --project=storybook --project=storybook-dark EmptyState Skeleton
pnpm turbo run build --filter=@snapshot-ui/docs
lsof -nP -iTCP:3100 -sTCP:LISTEN
pnpm --filter @snapshot-ui/docs test:e2e
```

Expected: the core run FAILS the two new describes (no files) and the import-order test, and passes the contrast describes (the pairs exist); the React run FAILS to import `./EmptyState`, `./Skeleton` and their folders, and the server-components run fails on the new rows; the Storybook run fails to import the story files; the end-to-end run FAILS the completeness guards (`+ "empty-state"`, `+ "skeleton"`), the footer and chip test, and the forced-colors test.

- [ ] **Step 3: Write the two components, the CSS, the imports, the stories, the examples, the pages, the lists, the footer and chip, and the two records.** Add the size-limit entry `{ "name": "import { EmptyState, Skeleton } from \"@snapshot-ui/react\"", "path": "dist/index.js", "import": "{ EmptyState, Skeleton }", "ignore": ["react", "react-dom", "react-aria-components", "lucide-react", "@internationalized/date"], "limit": "1 kB" }` before the watch-only entries, measure, and set the limit by the rule.
- [ ] **Step 4: Run the tests and watch them pass** (the commands of Step 2). Expected: all pass: about 13 core tests, about 10 EmptyState and 8 Skeleton tests, the three `STATIC` rows and two module rows, the empty-parts row, and the 11 stories and the mirrored check in Chromium and dark. The React build's `check-use-client` line reports no new client module.
- [ ] **Step 5: Run everything** (the Step 5 commands of Global Constraints). Expected: every gate green; two more static pages; the end-to-end run passes both pages' loop tests, the home test with 21 linked chips and the forced-colors test; `EmptyState, Skeleton` within its limit; `pnpm verify` exits 0, its root tests confirming both READMEs list the two pages.
- [ ] **Step 6: Commit and push** (owner action 1 has opened the pull request; this task adds no WebKit or Firefox play).

```bash
git add "apps/docs/app/(home)/home-page.tsx" apps/docs/content/docs/components/empty-state.mdx apps/docs/content/docs/components/meta.json apps/docs/content/docs/components/skeleton.mdx apps/docs/examples/empty-state-basic.tsx apps/docs/examples/empty-state-in-card.tsx apps/docs/examples/index.ts apps/docs/examples/skeleton-card.tsx apps/docs/examples/skeleton-shapes.tsx apps/docs/tests/components.spec.ts apps/docs/tests/home.spec.ts docs/design-system.md packages/core/README.md packages/core/src/components/empty-state.css packages/core/src/components/skeleton.css packages/core/src/styles.css packages/core/test/contrast.test.js packages/core/test/css.test.js packages/react/.size-limit.json packages/react/README.md packages/react/src/empty-state packages/react/src/index.ts packages/react/src/rtl/RightToLeft.stories.tsx packages/react/src/skeleton packages/react/test/empty-parts.test.tsx packages/react/test/server-components.test.tsx
git commit -m "feat: add EmptyState and Skeleton"
git push origin feat/data-table
```

- [ ] **Step 7: Visual baselines** (owner action 2)

```bash
source /opt/nvm/nvm.sh
pnpm --filter @snapshot-ui/storybook visual:docker
git status --short apps/storybook
```

Expected: 37 new files and no changed file: `components-emptystate--default--{light-rounded,dark-rounded,light-soft,light-square,light-rounded-375,light-rounded-compact}.png`, `components-emptystate--{title-only,in-card,right-to-left}--{light-rounded,dark-rounded,light-soft,light-square,light-rounded-375}.png`, `components-skeleton--shapes--{light-rounded,dark-rounded,light-soft,light-square,light-rounded-375,light-rounded-compact}.png` and `components-skeleton--{text-lines,on-card}--{light-rounded,dark-rounded,light-soft,light-square,light-rounded-375}.png`. What to look at: a centered slate receipt over a bold "No transactions this month", a slate line under it and a secondary button 24px below; the card's lifted fill behind the second; in right to left the same column in Persian; four faint shapes, the block a field tall (36px compact) with the shape's control corner (rounded, 10px in Soft, square in Square), the circle 40px; each line exactly the height of the text beside it; nothing mid-pulse. Then `git add "apps/storybook/tests/visual/__screenshots__/components-emptystate--*.png" "apps/storybook/tests/visual/__screenshots__/components-skeleton--*.png"` and `git commit -m "test: add the EmptyState and Skeleton baselines"`, as the earlier batches' baseline commits are.

---

### Task 2: DataTable, the table face

**Goal:** first, the spike that risks R1 and R2 require: prove in Chromium, WebKit and Firefox that a press on a row's stretched link opens and never selects, that Enter through a capture handler opens, that a cell's Menu and the checkbox still take their own press, that a capture handler stops typeahead, that a hidden column never takes the arrows' focus, and that the header sticks. Then the table face: columns from definitions, the row header, React Aria's sort cycle with `aria-sort`, the sticky header at `--page-sticky-top`, `align: 'end'` figures, `hideBelow` by container query, totals in a `tfoot` row, the empty body, the loading body of skeleton rows inside React Aria's empty state with `aria-busy` and a polite status after `QUIET_MS`, and the current row. Implements spec 6, 10.1 rulings 1, 2 (the link), 6, 7 (hover and current), 9 and 12, 10.2 items 3 to 8, 11 (the table face rows), 12 (DataTable's table face) and 13 (the `data-table` page, the "Dense data" and "DataTable" records), and risks R1, R2, R4 and R8.

**Files:**

- Create (the spike, kept): `packages/react/src/data-table/react-aria-table.test.tsx`, `packages/react/src/data-table/ReactAriaTable.stories.tsx` (title `Checks/React Aria table`)
- Create: `packages/react/src/data-table/DataTable.tsx`, `packages/react/src/data-table/TableFace.tsx`, `packages/react/src/data-table/DataTableStatus.tsx`, `packages/react/src/data-table/keys.ts`, `packages/react/src/data-table/rows.ts`, `packages/react/src/data-table/index.ts`
- Create (story data): `packages/react/src/stories/transactions.tsx`
- Modify: `packages/react/src/index.ts`, `packages/react/.size-limit.json`
- Test: `packages/react/src/data-table/DataTable.test.tsx`, `packages/react/src/data-table/keys.test.ts`, `packages/react/src/data-table/rows.test.ts` (create), `packages/react/test/server-face.test.tsx`, `packages/react/test/hydration.test.tsx`, `packages/react/test/server-render.test.tsx`, `packages/react/test/empty-parts.test.tsx`
- Create (stories): `packages/react/src/data-table/DataTable.stories.tsx`; Modify: `packages/react/src/rtl/RightToLeft.stories.tsx` (`DataTableMirrored`)
- Create: `packages/core/src/components/data-table.css`
- Modify: `packages/core/src/styles.css` (import after `skeleton.css`)
- Test: `packages/core/test/css.test.js`, `packages/core/test/contrast.test.js`
- Create: `apps/docs/content/docs/components/data-table.mdx`, `apps/docs/examples/transactions-data.ts`, `apps/docs/examples/data-table-basic.tsx`, `apps/docs/examples/data-table-figures.tsx`, `apps/docs/examples/data-table-columns.tsx`, `apps/docs/examples/data-table-states.tsx`
- Modify: `apps/docs/content/docs/components/meta.json` (`"data-table"` after `"confirm-dialog"`), `apps/docs/examples/index.ts`, `apps/docs/app/(home)/home-page.tsx` (the footer's "Data table" link after "Confirm dialog"; the catalog's "Data table" chip becomes `<Link className="chip chip-new" href="/docs/components/data-table">`), `apps/docs/content/docs/components/empty-state.mdx` (`## In a data table`, linking the page)
- Test: `apps/docs/tests/components.spec.ts`, `apps/docs/tests/docs.spec.ts`, `apps/docs/tests/home.spec.ts` (22 linked chips)
- Modify: `packages/core/README.md`, `packages/react/README.md` ("Data table" after "Confirm dialog")
- Modify: `docs/design-system.md` (`## Dense data` and `## DataTable` appended to Appendix B, by hand)
- Create (Docker step): 45 baselines, listed in Step 9. None changes.

**Interfaces:**

- Consumes: from `react-aria-components`, `Table`, `TableHeader`, `Column`, `TableBody`, `TableFooter`, `Row`, `Cell`, and the types `Key`, `SortDescriptor`, `ColumnRenderProps`; the library's `Link`, `Skeleton`, `cx`, `present`, `mergeRefs`, `useWarnOnce`, `QUIET_MS`, `AriaName`; `ArrowUp`, `ArrowDown` and `ArrowUpDown` from `lucide-react`; the tokens `--size-target`, `--size-field`, `--spacing-inset`, `--spacing-part`, `--text-small` and its line height and weight, `--text-overline` and its line height, letter spacing and weight, `--color-ink`, `--color-slate`, `--color-taupe`, `--color-divider`, `--color-frame`, `--color-canvas`, `--z-header`, the focus ring tokens.
- Produces, a client module exported from `@snapshot-ui/react` as `DataTable`, `DataTableBaseProps`, `DataTableProps`, `DataTableColumn` and `DataTableLabels`, the spec's types with spec corrections 1 and 21 and without the selection and list props, which Tasks 3 and 4 add:

```ts
'use client';

export interface DataTableColumn<T> {
  /** Unique; the sort descriptor's `column`. `__selection` is reserved. */
  id: string;
  /** The header's text, and its name. */
  header: string;
  /** The cell for a row: a string or any node. */
  cell: (item: T) => ReactNode;
  /** The row's name when the row header's cell is not a string. */
  textValue?: (item: T) => string;
  /** Exactly one column is the row header. @default the first column */
  isRowHeader?: boolean;
  /** 'end' sets figures: tabular, unbroken, at the line's end in either direction. @default 'start' */
  align?: 'start' | 'end';
  allowsSorting?: boolean;
  /** A CSS width for the column, written on its header cell: '8rem', '20%'. @default shares what is left */
  width?: string;
  /** The column leaves the table face when DataTable's box is narrower than 48rem ('md') or 40rem ('sm'). */
  hideBelow?: 'sm' | 'md';
  /** The totals row's cell for this column. */
  total?: ReactNode;
}

export interface DataTableLabels {
  /** The status while loading. @default 'Loading' */
  loading: string;
  /** The totals row's header cell. @default 'Total' */
  total: string;
}

export interface DataTableBaseProps<T> {
  items: readonly T[];
  columns: readonly DataTableColumn<T>[];
  /** Each row's key, stable across renders. `__total` is reserved. */
  getKey: (item: T) => Key;
  /** The row's detail, a URL the router opens (ruling 2). Rows without one do not open. */
  getRowHref?: (item: T) => string;
  /** The row whose detail is open: its link is aria-current and the row draws the current bar. */
  currentKey?: Key | null;
  /** Controlled from the URL: the column's id and its direction. */
  sortDescriptor?: { column: string; direction: 'ascending' | 'descending' };
  onSortChange?: (sort: { column: string; direction: 'ascending' | 'descending' }) => void;
  /** Rows that can neither be selected nor opened; they draw in taupe. */
  disabledKeys?: readonly Key[];
  /** Shows skeleton rows while there are no items, and marks the table busy (ruling 9). */
  isLoading?: boolean;
  /** @default 8 */
  loadingRowCount?: number;
  /** The empty body: an EmptyState, or any node. */
  emptyState?: ReactNode;
  labels?: Partial<DataTableLabels>;
  className?: string;
  ref?: Ref<HTMLDivElement>;
}

export type DataTableProps<T> = DataTableBaseProps<T> & AriaName;

export function DataTable<T>(props: DataTableProps<T>): ReactElement;
```

- Produces, internal: `rows.ts` (`rowHeaderOf(columns): DataTableColumn<T>`, `textOf(item, column): string`, `SKELETON_WIDTHS` and `skeletonWidth(row: number, column: number): string`); `keys.ts` (`handleTableKey(event, actions)`, Task 2's version with the hidden-cell arrows only, and `nextVisibleCell(from: Element, step: 1 | -1 | 'first' | 'last'): HTMLElement | null`); `DataTableStatus` (a visually hidden `span[role="status"]` that takes its message `QUIET_MS` after it last changed, empty at first render, as `pagination/PaginationStatus.tsx:18-45` does).
- Later tasks rely on: `TableFace`, `rows.ts`, `keys.ts`, `DataTableStatus`, the root and its `onKeyDownCapture` (Tasks 3 and 4), `src/stories/transactions.tsx` (Tasks 3 to 5), the `DataTable` page (Tasks 3, 4 and 6).

**Behavior:**

1. **Markup, in DOM order.** `div.data-table` (`className` merged after, `ref`, `aria-busy="true"` while `isLoading`, spec correction 2, and the capture handler, Behavior 13) holding `div.data-table-grid` with React Aria's `Table.data-table-table` (`aria-label` or `aria-labelledby` passed through, `sortDescriptor`, `onSortChange`, `disabledKeys`), then `DataTableStatus.data-table-status` with the loading line. The `Table` renders a real `<table>` with `thead`, `tbody` and, with totals, `tfoot` (`Table.mjs:927-937`).
2. **Columns.** `TableHeader.data-table-header` holds one `Column.data-table-column` per definition (`id`, `isRowHeader` on the row header, `allowsSorting`, `textValue={column.header}`, `data-align` for `'end'`, `data-hide-below`, and `style={{ width }}` when given, spec correction 1). The row header is the column marked `isRowHeader`, else the first; more than one marked warns once with `useWarnOnce` and the first marked wins. The header's content is `span.data-table-column-inner` holding `span.data-table-column-label` with the header and, for a sortable column, `span.data-table-sort[aria-hidden="true"]` with Lucide `ArrowUp` (ascending), `ArrowDown` (descending) or `ArrowUpDown` (not the sorted column), at 16px, from the column's render props' `sortDirection`.
3. **Sorting** (ruling 12). React Aria's press, Enter or Space on a sortable header calls `onSortChange` with that column ascending, or descending when it is the sorted column and ascending (react-stately `table/useTableState.mjs:22-25`); there is no unsorted state. The table shows what `sortDescriptor` says, and React Aria writes `aria-sort` on each sortable header and announces the change (spec correction 9). A sort that is not a column's id warns once.
4. **Rows.** `TableBody.data-table-body` holds one `Row.data-table-row` per item, `id={getKey(item)}`, `textValue` from the row header column's `textValue` or its string cell, `data-link=""` while the row has a link, `data-current=""` while its key is `currentKey`. Each column's `Cell.data-table-cell` carries `data-align` and `data-hide-below` and holds `column.cell(item)`; an end-aligned cell wraps it in `span.data-table-figure`. A row key that repeats warns once.
5. **Opening** (ruling 2). With `getRowHref`, the row header's cell holds the library's `Link` as `a.link.data-table-link` with `href={getRowHref(item)}` and `aria-current="true"` while current (spec correction 2), around the cell's content; its `::after` covers the row, whose `position: relative` makes it the containing block, so a press anywhere else on the row lands on the link and React Aria's press on the link stops there (`react-aria` `interactions/usePress.mjs:121-159`, `shouldStopPropagation`). It is a real anchor: a middle click, a modifier click and the context menu are the browser's. A disabled row and a row without a href draw no link. A cell's own controls sit above the link (spec correction 14).
6. **The sticky header** (spec correction 16). Each header cell is `position: sticky` at `var(--page-sticky-top, 0px)` with the fill `var(--data-table-surface, var(--color-canvas))` and `z-index: calc(var(--z-header) - 1)`, so it scrolls under the page's chrome and never over it (`docs/design-system.md:4650-4653`).
7. **Figures.** `align: 'end'` sets the header and the cells `text-align: end` and the figure `span.data-table-figure` tabular, unbroken, `direction: ltr` and `unicode-bidi: isolate`: right-aligned on an English page and left-aligned on a Persian one, lining up at the digits' end either way. A sign, a currency and a unit are in the app's string.
8. **Columns that leave** (ruling 6, spec correction 15). Under 48rem of DataTable's box a `hideBelow: 'md'` column's header and cells are `display: none`, and under 40rem a `'sm'` one's too. The row header never hides; a row header with `hideBelow` warns once and keeps it. The arrows never land on a hidden cell (Behavior 13).
9. **Totals** (spec correction 3). With any column's `total` and while `items` is not empty, `TableFooter.data-table-footer` holds one `Row` with `id="__total"`, `isDisabled`, `disabledBehavior="selection"` and `textValue={labels.total}`: the row header's cell writes `labels.total` (unless that column has its own `total`), each column with a `total` its node (in `span.data-table-figure` when end-aligned), the rest an empty `Cell`. It is reached by the arrows, never selected, never opened, and not sticky.
10. **Empty.** With no items and not loading, the body is React Aria's empty state (`renderEmptyState`), one row whose one cell spans every column (`Table.mjs:886-904`), holding `emptyState`. Without one the row is empty and `useWarnOnce` names `emptyState`.
11. **Loading** (ruling 9, spec correction 4). While `isLoading` and there are no items, `renderEmptyState` draws `loadingRowCount` `div.data-table-skeleton-row`s, each a flex row of one `span.data-table-skeleton-cell` per column (`data-align`, `data-hide-below`, `style={{ flexBasis, flexGrow }}` from `width`) holding a `Skeleton` at `skeletonWidth(row, column)`, a fixed pattern of 40% to 80%, never random, so the server and the browser draw the same. The grid counts only the empty row. The root is `aria-busy="true"`, and `DataTableStatus` says `labels.loading` `QUIET_MS` after loading starts and empties when it ends, so a load shorter than that says nothing. While `isLoading` with items, the rows stay; only `aria-busy` and the status change.
12. **Current.** `currentKey`'s row writes `data-current` and its link `aria-current="true"`; the CSS draws the 3px ink bar at the first cell's inline start (spec correction 13) and the row header at 700.
13. **Keys, this task's part** (spec correction 8). `div.data-table`'s `onKeyDownCapture` calls `handleTableKey`: on Arrow Left or Arrow Right from a cell or a row of the table face, and Home or End from a cell, when the cell React Aria would reach is `display: none`, it prevents the default, stops the event, and focuses `nextVisibleCell` in that direction (Arrow Right is the next cell in DOM order on a left-to-right page and the previous on a right-to-left one, read from the cell's computed `direction`), whose focus event sets React Aria's focused key. Everything else passes through to React Aria in this task; Task 3 adds the rest of spec 7.2.
14. **Disabled.** `disabledKeys` rows draw taupe with `cursor: not-allowed`, take no focus (React Aria's default `disabledBehavior`), and have no link.
15. **Server.** It renders in Node with the header, the sort marks, every row and its link, the totals, the empty or loading body and the status, one HTML in every locale and zone.

**CSS**, the whole of `data-table.css` as this task leaves it (Tasks 3 and 4 add to it):

```css
/*
 * DataTable: rows of data, derived in docs/design-system.md ("Dense data", "DataTable"). It draws no surface:
 * rows take the holder's fill, and --data-table-surface names it for the sticky header (the canvas, or lifted
 * in a card). A row is max(--size-target, --size-field) tall, ruled by the divider and never striped. The row
 * header's link is stretched over its row by ::after, the row being its containing block, so a press anywhere
 * on the row opens it; what a cell holds that takes its own press sits above the link and under the header.
 * Hover is the 5% ink wash where hover exists, focus the inset ring, the current row a 3px ink border at its
 * first cell's inline start and its row header at 700. The header cells stick at --page-sticky-top, one layer
 * under the page's header. A column with data-hide-below leaves by a container query on the table's own box,
 * 48rem for md and 40rem for sm, widths and not breakpoint tokens.
 */
@layer components {
  .data-table {
    --data-table-row: max(var(--size-target), var(--size-field));
    --data-table-fill: var(--data-table-surface, var(--color-canvas));

    container: data-table / inline-size;
    min-inline-size: 0;
    color: var(--color-ink);
    font-family: var(--font-sans);
  }

  .data-table-table {
    box-sizing: border-box;
    inline-size: 100%;
    table-layout: fixed;
    border-collapse: separate;
    border-spacing: 0;
    outline: none;
  }

  /* ---- The header ------------------------------------------------------------------------------ */
  .data-table-column {
    --data-table-pad: var(--spacing-inset);

    position: sticky;
    inset-block-start: var(--page-sticky-top, 0px);
    z-index: calc(var(--z-header) - 1);
    box-sizing: border-box;
    block-size: var(--size-target);
    padding-block: 0;
    padding-inline: var(--data-table-pad);
    border-block-end: 1px solid var(--color-divider);
    background-color: var(--data-table-fill);
    color: var(--color-slate);
    font-size: var(--text-overline);
    line-height: var(--text-overline--line-height);
    letter-spacing: var(--text-overline--letter-spacing);
    font-weight: var(--text-overline--font-weight);
    text-align: start;
    text-transform: uppercase;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    vertical-align: middle;
    outline: none;
  }

  /* The whole cell is the sort button, hit at its full 40px. */
  .data-table-column[data-allows-sorting] {
    cursor: pointer;
    -webkit-tap-highlight-color: transparent;
  }

  /* Ink while sorted: slate on the 5% wash measures 4.38 over canvas, so a header never sits in slate on it. */
  .data-table-column:is([data-sort-direction], [aria-sort='ascending'], [aria-sort='descending']) {
    color: var(--color-ink);
  }

  .data-table-column-inner {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    max-inline-size: 100%;
    vertical-align: middle;
  }

  .data-table-column-label {
    min-inline-size: 0;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .data-table-sort {
    display: inline-flex;
    flex: none;
    color: var(--color-slate);
  }

  .data-table-column[data-sort-direction] .data-table-sort {
    color: inherit;
  }

  .data-table-sort svg {
    width: 16px;
    height: 16px;
  }

  /* ---- Rows and cells -------------------------------------------------------------------------- */
  .data-table-row {
    position: relative;
    block-size: var(--data-table-row);
    outline: none;
  }

  .data-table-row[data-link] {
    cursor: pointer;
  }

  .data-table-cell {
    --data-table-pad: var(--spacing-inset);

    box-sizing: border-box;
    padding-block: 0;
    padding-inline: var(--data-table-pad);
    border-block-end: 1px solid var(--color-divider);
    font-size: var(--text-small);
    line-height: var(--text-small--line-height);
    font-weight: var(--text-small--font-weight);
    text-align: start;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    vertical-align: middle;
    outline: none;
  }

  .data-table-cell[role='rowheader'] {
    font-weight: 500;
  }

  .data-table-column[data-align='end'],
  .data-table-cell[data-align='end'] {
    text-align: end;
  }

  /* The numeral rule of copy.css: tabular, unbroken and an isolated left-to-right run. */
  .data-table-figure {
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
    direction: ltr;
    unicode-bidi: isolate;
  }

  /* The row's link: the row header's ink and no underline, one class after link.css. Its ::after covers the row,
     whose position: relative makes it the containing block; a cell is never positioned, so none clips it. */
  .data-table-link {
    color: inherit;
    text-decoration-line: none;
    overflow-wrap: normal;
  }

  .data-table-link::after {
    content: '';
    position: absolute;
    inset: 0;
  }

  .data-table-link:is(:focus-visible, [data-focus-visible]) {
    outline-offset: calc(-1 * var(--focus-ring-width));
  }

  /* What a cell holds that takes its own press: above the stretched link and under the sticky header. */
  .data-table-cell :is(button, input, select, textarea, [role='button'], a:not(.data-table-link)),
  .data-table-cell .checkbox-field {
    position: relative;
    z-index: calc(var(--z-header) - 2);
  }

  .data-table-row:is(:focus-visible, [data-focus-visible]),
  .data-table-cell:is(:focus-visible, [data-focus-visible]),
  .data-table-column:is(:focus-visible, [data-focus-visible]) {
    outline: var(--focus-ring-width) solid var(--focus-ring-color);
    outline-offset: calc(-1 * var(--focus-ring-width));
  }

  @media (hover: hover) {
    .data-table-column[data-allows-sorting]:is(:hover, [data-hovered]) {
      color: var(--color-ink);
    }

    .data-table-row:is([data-link], [data-selection-mode]):is(:hover, [data-hovered]):not([data-disabled]) {
      background-color: color-mix(in srgb, var(--color-ink) 5%, var(--data-table-fill));
    }
  }

  /* The current row: a 3px ink border at its first cell's inline start, its padding 3px less so nothing moves. */
  .data-table-row[data-current] > :first-child {
    padding-inline-start: calc(var(--data-table-pad) - 3px);
    border-inline-start: 3px solid var(--color-ink);
  }

  .data-table-row[data-current] > .data-table-cell[role='rowheader'] {
    font-weight: 700;
  }

  .data-table-row:is([data-disabled], [aria-disabled='true']) {
    color: var(--color-taupe);
    cursor: not-allowed;
  }

  /* ---- Totals ---------------------------------------------------------------------------------- */
  .data-table-footer .data-table-cell {
    border-block-start: 1px solid var(--color-frame);
    border-block-end: 0;
    font-weight: 700;
  }

  .data-table-table:has(> .data-table-footer) .data-table-body > .data-table-row:last-child > .data-table-cell {
    border-block-end: 0;
  }

  /* ---- The empty and loading bodies: React Aria's one row with one cell spanning every column ----- */
  .data-table-body[data-empty] > tr > td {
    padding: 0;
  }

  .data-table-skeleton-row {
    box-sizing: border-box;
    display: flex;
    align-items: center;
    block-size: var(--data-table-row);
    border-block-end: 1px solid var(--color-divider);
  }

  .data-table-skeleton-cell {
    box-sizing: border-box;
    flex: 1 1 0;
    min-inline-size: 0;
    padding-inline: var(--spacing-inset);
    font-size: var(--text-small);
    line-height: var(--text-small--line-height);
    text-align: start;
  }

  .data-table-skeleton-cell[data-align='end'] {
    text-align: end;
  }

  .data-table-status {
    position: absolute;
    width: 1px;
    height: 1px;
    margin: -1px;
    overflow: hidden;
    clip-path: inset(50%);
    white-space: nowrap;
  }

  /* ---- Columns that leave, by the table's own box ----------------------------------------------- */
  @container data-table (width < 48rem) {
    .data-table [data-hide-below='md'] {
      display: none;
    }
  }

  @container data-table (width < 40rem) {
    .data-table [data-hide-below='sm'] {
      display: none;
    }
  }

  @media (forced-colors: active) {
    .data-table-column,
    .data-table-cell,
    .data-table-skeleton-row {
      border-color: CanvasText;
    }

    .data-table-row[data-current] > :first-child {
      border-inline-start-color: CanvasText;
    }

    .data-table-row:is(:focus-visible, [data-focus-visible]),
    .data-table-cell:is(:focus-visible, [data-focus-visible]),
    .data-table-column:is(:focus-visible, [data-focus-visible]) {
      outline-color: Highlight;
    }

    .data-table-row:is([data-disabled], [aria-disabled='true']) {
      color: GrayText;
    }
  }
}
```

**Code** (the row and its link cell, because React Aria drops ARIA on its row and a disabled or href-less row must draw no link; the skeleton pattern, because random widths would differ between the server and the browser; and the hidden-cell arrows, because React Aria walks the collection):

```tsx
// TableFace.tsx: one row of the table face. Cells are static children, one per column, keyed by the column's id.
function TableRow<T>({ item, columns, rowHeader, href, isCurrent, isDisabled }: TableRowProps<T>): ReactElement {
  return (
    <Row
      id={item.key}
      textValue={item.text}
      className="data-table-row"
      // React Aria passes data-* to the tr and drops aria-current (spec correction 2).
      data-link={href === undefined ? undefined : ''}
      data-current={isCurrent ? '' : undefined}
    >
      {columns.map((column) => {
        const content = column.cell(item.value);
        const body = column.align === 'end' ? <span className="data-table-figure">{content}</span> : content;
        return (
          <Cell
            key={column.id}
            className="data-table-cell"
            data-align={column.align === 'end' ? 'end' : undefined}
            data-hide-below={column.hideBelow}
          >
            {column === rowHeader && href !== undefined && !isDisabled ? (
              <Link href={href} className="data-table-link" aria-current={isCurrent ? 'true' : undefined}>
                {body}
              </Link>
            ) : (
              body
            )}
          </Cell>
        );
      })}
    </Row>
  );
}
```

```ts
// rows.ts: pure.
/** The skeleton's widths, 40% to 80%, in a fixed order: the server and the browser draw the same (ruling 9). */
export const SKELETON_WIDTHS = ['72%', '48%', '64%', '56%', '80%', '40%'] as const;

/** The width of the skeleton line in `row` and `column`, cycling through the pattern. */
export const skeletonWidth = (row: number, column: number): string =>
  SKELETON_WIDTHS[(row * 2 + column) % SKELETON_WIDTHS.length] ?? '64%';
```

```ts
// keys.ts, Task 2's part: React Aria's delegate walks the collection, so it would focus a cell the container query
// hid (spec correction 8). Read at key time, in the handler, never at render.
const isShown = (cell: Element): boolean => getComputedStyle(cell).display !== 'none';

/** The nearest shown cell from `from` in DOM order (1 next, -1 previous), or the row's first or last shown one. */
export function nextVisibleCell(from: Element, step: 1 | -1 | 'first' | 'last'): HTMLElement | null {
  const row = from.closest('[role="row"]');
  if (row === null) return null;
  const cells = [...row.querySelectorAll<HTMLElement>(':scope > [role="gridcell"], :scope > [role="rowheader"]')];
  const shown = cells.filter(isShown);
  if (step === 'first') return shown[0] ?? null;
  if (step === 'last') return shown.at(-1) ?? null;
  const start = from === row ? (step === 1 ? -1 : cells.length) : cells.indexOf(from as HTMLElement);
  for (let index = start + step; index >= 0 && index < cells.length; index += step) {
    const cell = cells[index];
    if (cell !== undefined && isShown(cell)) return cell;
  }
  return null;
}
```

**Tests, written first:**

- `react-aria-table.test.tsx`, the spike's jsdom half (Step 1), on React Aria's own `Table` with the library's `Link` and `Checkbox`, no wrapper:
  - `it('drops aria-current and aria-busy given to Row and Table, and keeps data attributes')` (spec correction 2)
  - `it('renders renderEmptyState with no rows and no footer, and never with a footer row')` (spec correction 3)
  - `it('throws for a footer row with fewer cells than columns')`
  - `it('focuses a footer row that is isDisabled with disabledBehavior selection, and never selects it')`
  - `it('names a row checkbox by its own aria-label and the row header, through aria-labelledby')` (spec correction 5)
  - `it('selects a focused row on Enter when the row has no action, which the handler must stop')` (the control for spec correction 6)
  - `it('never selects a row on a click on the link in its cell')` (the link's press stops propagation)
  - `it('stops typeahead when a capture listener on an ancestor stops the letter')`
  - `it('moves to a sorted column descending on a press when it is ascending')`
- `ReactAriaTable.stories.tsx`, title `Checks/React Aria table`, the spike's browser half (Step 1), every story tagged `['no-visual', 'webkit', 'firefox']`, each a bare React Aria `Table` of five rows with selection on, the library's `Checkbox slot="selection"` and `Link` in the row header cell, a `Menu` trigger in the last cell, a `RouterProvider` whose `navigate` is a spy, and the spike's handler on a wrapping `div`:
  - `RowPressOpens`: play asserts `document.elementFromPoint` at the center of row 2's amount cell is row 2's link, clicks there with `userEvent.click`, and asserts `navigate` was called with row 2's href and no row has `aria-selected="true"`.
  - `EnterOpens`: play focuses row 2 by keyboard (Tab, Arrow Down), presses Enter, and asserts `navigate` was called and row 2 is not selected.
  - `CellControls`: play clicks row 3's checkbox (selected, `navigate` not called), then the Menu trigger in row 3 (the menu opens, `navigate` not called), then Escape.
  - `TypeaheadStopped`: rows "Alpha" to "Echo"; play focuses row 1, types "c" and asserts focus stays on row 1.
  - `HiddenCellSkipped`: the third column `display: none` by a style; play focuses row 1's row header cell with Arrow Right and asserts the next Arrow Right focuses the fourth cell.
  - `StickyHeaderEngines`: a 64px fixed fake header, `--page-sticky-top: 64px`, sixty rows; play scrolls the window by 800px and asserts each header cell's `getBoundingClientRect().top` is 64 (spec correction 16).
- `rows.test.ts`: `it('takes the column marked isRowHeader, else the first')`; `it('writes a row text from textValue, else the string cell, else the empty string')`; `it('cycles the skeleton widths through a fixed pattern of 40% to 80%')`.
- `keys.test.ts`: `it('finds the next and previous shown cell in a row, skipping cells with display none')`; `it('finds the first and last shown cell')`; `it('finds the first shown cell from the row itself')`; `it('focuses the next shown cell on Arrow Right when React Aria would reach a hidden one, and lets the key through otherwise')`; `it('reads Arrow Right as the previous cell on a right-to-left row')`.
- `DataTable.test.tsx`:
  - `it('is a grid named by aria-label or aria-labelledby, with a columnheader per column')`
  - `it('makes the column marked isRowHeader the row header, else the first, and warns once for two')`
  - `it('draws ArrowUpDown on a sortable header, and ArrowUp or ArrowDown with aria-sort on the sorted one')`
  - `it('calls onSortChange ascending on a press, Enter or Space, and descending on the sorted ascending column')`
  - `it('shows only what sortDescriptor says: a press changes nothing until the prop changes')`
  - `it('puts the library Link around the row header cell with getRowHref, and none without it or on a disabled row')`
  - `it('opens the row link through RouterProvider, and leaves a modifier click to the browser')` (a click on the link calls `navigate`; a Ctrl click does not)
  - `it('marks the current row data-current and its link aria-current true')`
  - `it('sets end-aligned headers and cells data-align end and wraps the figure in the numeral span')`
  - `it('writes a column width on its header cell style')` (spec correction 1)
  - `it('marks hideBelow headers and cells data-hide-below, and never hides the row header')`
  - `it('adds a totals row in tfoot with labels.total in the row header cell, reachable by the arrows and never selected, only while there are rows')`
  - `it('draws emptyState in the empty body, and warns once without one')`
  - `it('draws loadingRowCount skeleton rows inside the empty body while loading with no rows, the grid counting only the empty row')`
  - `it('keeps the rows while loading with rows, and marks the root aria-busy either way')`
  - `it('says labels.loading in its status QUIET_MS after loading starts, and nothing for a shorter load')` (fake timers)
  - `it('draws the same skeleton widths on every render')`
  - `it('draws disabled rows with data-disabled and no link, and skips them on the arrows')`
  - `it('passes className and ref to the root')`
  - `it.each(AXE_CASES)('has no axe violations %s')`, one test per state: sorted, current, totals, empty, loading, a disabled row, hidden columns.
  - type tests with `// @ts-expect-error`: no `aria-label` or `aria-labelledby` (spec correction 21); `align: 'center'`; `hideBelow: 'lg'`; a `sortDescriptor` with `direction: 'up'`.
- `server-face.test.tsx`, `FACES` row: `['DataTable', <DataTable aria-label="Transactions" items={FIVE} columns={COLUMNS} getKey={keyOf} getRowHref={hrefOf} currentKey="t2" sortDescriptor={{ column: 'date', direction: 'descending' }} onSortChange={noop} />]` (the columns' totals set).
- `hydration.test.tsx`, `HYDRATED` row: the same table, `after`: the current row's link has `aria-current="true"` and the header's sort mark is `ArrowDown`.
- `server-render.test.tsx`, `CLIENT` rows: `['DataTable', <same />, ['class="data-table"', 'role="grid"', 'aria-sort="descending"', 'class="link data-table-link"', 'aria-current="true"', 'data-current=""', '<tfoot', 'data-align="end"', 'class="data-table-figure"', '>Total<'], ['aria-busy']]` and `['DataTable loading', <DataTable aria-label="Transactions" items={[]} columns={COLUMNS} getKey={keyOf} isLoading />, ['aria-busy="true"', 'class="data-table-skeleton-row"', 'class="skeleton"'], ['<tfoot', 'aria-selected']]`.
- `empty-parts.test.tsx`, in `describe('an empty data part slot')`: `it('draws no empty state for an emptyState of false, an empty string or null')`.
- `css.test.js`, `describe('src/components/data-table.css')`, on the closed-up source: `it('makes the table a size container named data-table, laid out fixed at full width')`; `it('sticks the header cells at --page-sticky-top, one layer under the header token, on the surface fill')`; `it('draws the header at the overline step in slate, ink while sorted and on hover only where hover exists')`; `it('makes a row max(--size-target, --size-field) tall with a divider under each cell and no zebra')`; `it('sets cells at the small step at 450, row headers at 500, and ellipsizes on one line')`; `it('sets end columns at the line end with tabular, unbroken, isolated left-to-right figures')`; `it('stretches the row link over its row, the row positioned and no cell positioned')`; `it('raises a cell control above the link through the header token')`; `it('washes a row with a link or selection 5% ink over the fill, only where hover exists')`; `it('rings a focused row, cell or header inside, in the focus ring token')`; `it('draws the current bar as a 3px ink inline-start border on the first cell, its padding 3px less, and its row header at 700')`; `it('draws a disabled row taupe, not-allowed')`; `it('rules the totals with the frame color at 700, with no divider under the last body row')`; `it('lays out skeleton rows as flex rows a row tall')`; `it('hides md columns under 48rem and sm columns under 40rem of the table box, by container query only')`; `it('never uses signal orange, clay, error or success')`; `it('draws rules CanvasText, the current bar CanvasText, the ring Highlight and a disabled row GrayText in forced colors')`. Import order: `data-table.css` after `skeleton.css`.
- `contrast.test.js`, `describe('the data table')`: `it('cites ink and slate on canvas and lifted, which the gate holds')`; `it('measures the pairs Appendix B records, in both modes')`: a cell, ink on canvas 16.25 and 19.31 and on lifted 17.84 and 17.42; the header, slate on canvas 4.84 and 7.26 and on lifted 5.31 and 6.94; a hovered row, ink on the 5% wash over canvas 14.70 and 17.41 and over lifted 16.11 and 15.25; slate on the 5% wash over canvas 4.38 and 6.93 (under 4.5 in light, so a sorted or hovered header is ink) and over lifted 4.80 and 6.41; the divider and the frame as rules, 1.23 and 1.28 and 1.28 and 1.36 over canvas, recorded.
- Stories, `DataTable.stories.tsx`, title `Components/DataTable`, the household's transactions from `src/stories/transactions.tsx` (Date, Payee as the row header with links, Category with `hideBelow: 'md'`, Account with `hideBelow: 'sm'`, Amount `align: 'end'` with totals), each in a `width: min(60rem, 100%)` box and a `RouterProvider` with a no-op `navigate`, every story tagged `viewport-desktop` so Task 4's list face changes none of them:
  - `Default` (tags `['viewport-desktop', 'density']`): eight rows sorted by date descending.
  - `Totals` (tags `['viewport-desktop']`): the totals row under the rows, its rule the frame.
  - `Current` (tags `['viewport-desktop']`): `currentKey` the third row.
  - `Empty` (tags `['viewport-desktop']`): no items, an `EmptyState` "No transactions this month".
  - `Loading` (tags `['viewport-desktop']`): no items, `isLoading`, eight skeleton rows.
  - `InCard` (tags `['viewport-desktop']`): in a `Card` with `--data-table-surface: var(--color-lifted)`.
  - `ColumnsHidden` (tags `['viewport-desktop']`): the table in a 44rem box: Category gone, Account kept.
  - `KeyboardFocus` (tags `['viewport-desktop']`): play tabs into the table and presses Arrow Down: the inset ring on the second row.
  - `DisabledRow` (tags `['viewport-desktop']`): the fourth row disabled.
  - `RightToLeft` (tags `['viewport-desktop']`): `dir="rtl"` in `I18nProvider locale="fa-IR"`, Persian headers and payees, amounts like "-۱۲۵٬۰۰۰ تومان" from the app.
  - `StickyHeader` (tags `['viewport-desktop']`): a 64px `DemoHeader`-like bar fixed at the top, `--page-sticky-top: 64px`, sixty rows; play scrolls the window by 600px: the header cells under the bar.
  - `no-visual`: `SortCycle`, `HoverWash`, `ArrowsSkipHidden` (tags `['no-visual', 'webkit', 'firefox']`), `LoadingStatus`.
- `RightToLeft.stories.tsx`, `DataTableMirrored`: play asserts the row header is the rightmost cell, the amount column's figures are at the cell's left with `direction: ltr`, and the current bar is the first cell's right border.
- Docs end-to-end: `components.spec.ts`: `LONG_TARGETS['data-table'] = ['.stage .data-table-cell']` (a cell ellipsizes on one line, so the table stays inside 320px); `SERVER_RENDERED['data-table'] = ['.stage .data-table-table thead', '.stage .data-table-link']`; in `test.describe('forced colors')`: `test('a data table current row draws its bar in CanvasText')`. `docs.spec.ts`:
  - `test('a data table header sorts on a press, writing aria-sort')` (on `/docs/components/data-table`, the `data-table-basic` example).
  - `test('a press anywhere on a data table row opens its link, and a middle click opens a new tab')` (a click on the amount cell navigates; a middle click on it fires `context.waitForEvent('page')`).
  - `test('a data table drops its md column under 48rem of its box and its sm column under 40rem')` (the `data-table-columns` example in a resizable box).
  - `home.spec.ts`: the linked-chip count becomes 22, its comment naming Data table.

**Docs:**

- `data-table.mdx`, title "Data table", description "Rows of data with sorting, links to a detail, a sticky header, columns of figures, totals, and loading and empty states.", icon `Table`. Sections: `## Basic` (`data-table-basic`: `items`, `columns`, `getKey`; `getRowHref` makes a press anywhere on the row open it through your router, as a real link, so a middle click opens a new tab; `sortDescriptor` and `onSortChange` are controlled, ascending then descending, with no unsorted state), `## Figures and totals` (`data-table-figures`, in a Card with `--data-table-surface`: `align: 'end'` and the app's strings with their signs and currencies; `total` per column), `## Columns that leave` (`data-table-columns`: `hideBelow` at 48rem and 40rem of the table's own box, never sideways scrolling, cells ellipsize with their full text in the row's name), `## Empty and loading` (`data-table-states`: `emptyState` takes an `EmptyState`; `isLoading` with no rows draws skeleton rows and says "Loading" once; with rows it keeps them), `## Usage` (render it from a client component, since its props are functions, and pass it the rows a server page loaded; wrap the app in `RouterProvider` once; set `--page-sticky-top` to your header's height on an ancestor, once for every sticky part of the page; set `--data-table-surface` for a table in a Card; `currentKey` marks the row whose detail is open; strings are yours), `## Props` (tables "DataTable props", `Pick<DataTableBaseProps<object>, 'items' | 'columns' | 'getKey' | 'getRowHref' | 'currentKey' | 'sortDescriptor' | 'onSortChange' | 'disabledKeys' | 'isLoading' | 'loadingRowCount' | 'emptyState' | 'labels' | 'className'>`; "DataTableColumn", `DataTableColumn<object>`; "DataTableLabels", `DataTableLabels`; all from `../../packages/react/src/data-table/DataTable.tsx`), `## Accessibility` (a `grid` named by your `aria-label` or heading; `columnheader`s with `aria-sort` on the sortable ones; the row header cell a `rowheader`; the current row's link `aria-current`; React Aria announces a sort in its own words; `<Keys rows={[['Down Up', 'Move to the next or previous row; from the first row, Up reaches the headers.'], ['Right Left', 'Into and between the cells of a row, skipping a column that has left, and back to the row.'], ['Home End', 'The first or last row; in a cell, the row first or last cell.'], ['PageUp PageDown', 'The first or last row, since the page itself scrolls.'], ['Enter Space', 'On a sortable header, sorts.'], ['Tab', 'Into and out of the table, one stop.']]} />`), `## Design rules` (dos: the payee or the name as the row header, figures at the end with their sign, a totals row only for figures that add up, an empty state that says what is missing; donts: never a horizontally scrolling table, never zebra stripes, never color alone for a state, never a spinner in place of rows).
- `transactions-data.ts`: twelve transactions with ISO dates, payees, categories, accounts and amounts as minor units, and the app's own formatters (no `Intl`): `amountLabel(minor)` writing "-$125.00" by hand, `dayLabel(iso)` writing "Monday 12 October" from fixed tables.
- Examples: all four client files; `data-table-basic.tsx` keeps its sort in state and links to `#t1` and so on inside a `RouterProvider`; `data-table-states.tsx` has a SegmentedControl "Rows", "Empty", "Loading".
- `empty-state.mdx`, `## In a data table`: DataTable's `emptyState` takes one, drawn across every column.
- `docs/design-system.md`, `## Dense data`: the document's gap (`docs/design-system.md:439,448`) and the parent spec's R6, and what this batch derives for dense data: a row from `--size-target` and `--size-field`, rules from the divider and the frame and no zebra, the overline header, figures by the numeral rule, the 5% and 8% washes and why slate turns ink on them, the inset ring, the current mark, the sticky layer under `--z-header`, columns that leave by the box and never a sideways scroll. `## DataTable`, the table face: the markup, the measured pairs (above), the stretched link and its containing block, the raised controls (spec correction 14), the sticky cells (spec correction 16 and the spike's engines), totals in the collection (spec correction 3), the skeleton rows in the empty cell (spec correction 4), `aria-current` and `aria-busy` (spec correction 2), the hidden-cell arrows (spec correction 8), the sort's assertive announcement (spec correction 9), R1 and R2 with the spike's result per engine, R4, R8, the forced-colors rules, and the screen-reader check "not yet verified".

**Steps:**

- [ ] **Step 1: The spike (R1, R2).** Write the stretched-link part of `data-table.css` first (`.data-table`, `.data-table-row`, `.data-table-cell`, `.data-table-link` and its `::after`, the raised controls, the sticky header cells), import it after `skeleton.css`, and write `react-aria-table.test.tsx` and `ReactAriaTable.stories.tsx` with the spike's handler, `spikeKeys`, inside the story file (Enter on a row clicks its link and stops, a single printable key other than Space is stopped, and the hidden-cell arrows), which Task 2's and Task 3's `keys.ts` replace. Run:

```bash
source /opt/nvm/nvm.sh
pnpm turbo run build --filter=@snapshot-ui/core --filter=@snapshot-ui/react
pnpm --filter @snapshot-ui/react exec vitest run src/data-table/react-aria-table.test.tsx
pnpm --filter @snapshot-ui/storybook exec vitest run --project=storybook ReactAriaTable
```

Expected: the nine jsdom tests and the six plays pass in Chromium. Then run `pnpm verify`, commit the spike alone, and push it so CI runs the plays in WebKit and Firefox:

```bash
git add packages/core/src/components/data-table.css packages/core/src/styles.css packages/react/src/data-table/react-aria-table.test.tsx packages/react/src/data-table/ReactAriaTable.stories.tsx
git commit -m "test: prove the data table row link and key guard in three engines"
git push origin feat/data-table
```

Read the pull request's `storybook-webkit` and `storybook-firefox` results. Expected: the six plays pass in both. If `RowPressOpens` finds the link not under the point in an engine (the row is not the `::after`'s containing block there), or a press selects, use R1's fallback: React Aria's `href` on the `Row` (`RowProps` extends `LinkDOMProps`, `dist/types/src/Table.d.ts`), opened through the router by React Aria's row action, with the selection behavior held in the capture handler, so a press on a row outside its checkbox and cell controls opens and never selects, behind the same props and the same tests; the record states the loss of the anchor's middle click and context menu. If `TypeaheadStopped` fails in an engine, React's capture order differs there from R2's assumption. In either case stop and report to the controller with the engine and the play before Step 2. The spike's tests and stories stay in the suite as the record of what DataTable relies on.

- [ ] **Step 2: Write the failing tests** listed above, stories included.
- [ ] **Step 3: Run them and watch them fail** (the commands of Task 1's Step 2, with `DataTable` as the Storybook filter). Expected: the core run FAILS the data-table describe's new tests, and passes the contrast describe; the React run FAILS to import `./DataTable`, `./rows` and `../src/data-table`, and the face projects fail on the new row; the Storybook run fails to import the story file; the end-to-end run FAILS the completeness guards (`+ "data-table"`), the footer and chip test and the new tests.
- [ ] **Step 4: Write `rows.ts`, `keys.ts`, `DataTableStatus`, `TableFace`, `DataTable`, the rest of the CSS, the story data, the stories, the examples, the page, the lists, the footer and chip, the two records.** Add the size-limit entry `import { DataTable } from "@snapshot-ui/react"` (`"import": "{ DataTable }"`, the `ignore` list with `@internationalized/date`) at the spec's 4 kB, measure, and set the limit by the rule; it pulls in Link and Skeleton, and Tasks 3 and 4 re-measure it. Update the face snapshot with `pnpm --filter @snapshot-ui/react exec vitest run --project=face-utc -u`, read the new entry (`aria-sort`, the link, the totals, no `aria-busy`), and run `--project=face-tehran` against it.
- [ ] **Step 5: Run the tests and watch them pass** (the commands of Task 1's Step 2, filter `DataTable`). Expected: all pass: about 18 core tests, the 9 spike tests, about 3 rows, 5 keys and 23 DataTable tests, the face row in both zones, the hydration row, the two server rows and the empty-parts row, and the 15 stories, the 6 spike plays and the mirrored check. `check-use-client` reports three more client modules.
- [ ] **Step 6: Run everything** (the Step 5 commands). Expected: every gate green; one more static page; the end-to-end run passes the page's loop tests, the three new tests, the forced-colors test and the home test with 22 linked chips; `DataTable` within its limit; `pnpm verify` exits 0.
- [ ] **Step 7: Check the hydration in a browser.** With the end-to-end run stopped, so port 3100 is free, run `pnpm --filter @snapshot-ui/docs start`, open `/docs/components/data-table` with the console open: no hydration warning.
- [ ] **Step 8: Commit and push**, then read the pull request's `storybook-webkit` and `storybook-firefox` results for `ArrowsSkipHidden` and the spike.

```bash
git add "apps/docs/app/(home)/home-page.tsx" apps/docs/content/docs/components/data-table.mdx apps/docs/content/docs/components/empty-state.mdx apps/docs/content/docs/components/meta.json apps/docs/examples/data-table-basic.tsx apps/docs/examples/data-table-columns.tsx apps/docs/examples/data-table-figures.tsx apps/docs/examples/data-table-states.tsx apps/docs/examples/index.ts apps/docs/examples/transactions-data.ts apps/docs/tests/components.spec.ts apps/docs/tests/docs.spec.ts apps/docs/tests/home.spec.ts docs/design-system.md packages/core/README.md packages/core/src/components/data-table.css packages/core/test/contrast.test.js packages/core/test/css.test.js packages/react/.size-limit.json packages/react/README.md packages/react/src/data-table packages/react/src/index.ts packages/react/src/rtl/RightToLeft.stories.tsx packages/react/src/stories/transactions.tsx packages/react/test/__snapshots__/server-face.test.tsx.snap packages/react/test/empty-parts.test.tsx packages/react/test/hydration.test.tsx packages/react/test/server-face.test.tsx packages/react/test/server-render.test.tsx
git commit -m "feat: add DataTable"
git push origin feat/data-table
```

- [ ] **Step 9: Visual baselines** (owner action 2). Expected: 45 new files and no changed file: `components-datatable--default--{light-rounded,dark-rounded,light-soft,light-square,light-rounded-compact}.png` and `components-datatable--{totals,current,empty,loading,in-card,columns-hidden,keyboard-focus,disabled-row,right-to-left,sticky-header}--{light-rounded,dark-rounded,light-soft,light-square}.png`. What to look at: 48px rows (40px compact) with hairline rules and no stripes; slate uppercase headers 40px tall with a faint up-down mark on Date and Amount and a down arrow in ink on Date; payees at 500 in ink with no underline; amounts at the right in tabular figures with their minus signs; the totals row under a slightly stronger rule at 700; the third row's 3px ink bar at its left and bold payee; the empty state centered across the table; eight rows of faint bars of varied widths; the card's lifted fill behind the header; Category gone in the 44rem box; the inset ring on the second row; a taupe disabled row; in right to left the payee at the right, amounts at the left and the bar at the right; the header stuck under the 64px bar after the scroll. Then commit them as Task 1's Step 7 does: `git commit -m "test: add the DataTable baselines"`.

---

### Task 3: Selection, the bulk-action bar and the keys

**Goal:** selection on the table face: a first column of checkboxes named "Select all" and "Select" with the row, select-all as the rows on this page and never `'all'`, a press that still only opens, Space and X that toggle; the bulk-action bar that sticks to the viewport's bottom inside the table's box while any row is selected, with the count in the app's words, the app's actions and Clear selection; and the whole of spec 7.2 in the capture handler: J and K as the arrows, X, Enter that opens and never selects, typeahead stopped, and the keys it leaves alone. Implements spec 7, 10.1 rulings 2 to 5 and 7 (selected), 10.2 items 9 and 10, 11 (the selection rows), 12 (selection and the keys) and R6.

**Files:**

- Create: `packages/react/src/data-table/BulkBar.tsx`, `packages/react/src/data-table/selection.ts`
- Modify: `packages/react/src/data-table/DataTable.tsx`, `packages/react/src/data-table/TableFace.tsx`, `packages/react/src/data-table/keys.ts`, `packages/react/src/data-table/index.ts`, `packages/react/src/index.ts`, `packages/react/.size-limit.json` (re-measured)
- Test: `packages/react/src/data-table/selection.test.ts`, `packages/react/src/data-table/DataTable.selection.test.tsx` (create), `packages/react/src/data-table/keys.test.ts`, `packages/react/test/server-face.test.tsx`, `packages/react/test/hydration.test.tsx`, `packages/react/test/server-render.test.tsx`, `packages/react/test/empty-parts.test.tsx`
- Modify (stories): `packages/react/src/data-table/DataTable.stories.tsx`, `packages/react/src/rtl/RightToLeft.stories.tsx` (`DataTableMirrored` gains the bar)
- Modify: `packages/core/src/components/data-table.css`
- Test: `packages/core/test/css.test.js`, `packages/core/test/contrast.test.js`
- Create: `apps/docs/examples/data-table-selection.tsx`
- Modify: `apps/docs/content/docs/components/data-table.mdx`, `apps/docs/examples/index.ts`
- Test: `apps/docs/tests/components.spec.ts`, `apps/docs/tests/docs.spec.ts`
- Modify: `docs/design-system.md` (`## DataTable` gains its selection, bar and keys paragraphs, by hand)
- Create (Docker step): 17 baselines, listed in Step 7. None changes.

**Interfaces:**

- Consumes: from `react-aria-components`, `Toolbar` and the type `Selection`; the library's `Checkbox`, `Button` (tertiary), `matchesShortcut` and `parseShortcut` (`command-palette/shortcut.ts:14-71`, reused unchanged), `isAnotherModalOpen` (`overlay/useOverlayStack.ts:14-17`), `useWarnOnce`, `QUIET_MS`; the tokens `--color-float`, `--color-frame`, `--radius-surface`, `--shadow-float`, `--spacing-part`, `--spacing-inset`.
- Produces: `DataTableBaseProps` and `DataTableLabels` gain the spec's selection members with spec correction 5:

```ts
export interface DataTableLabels {
  /** The header checkbox's name. @default 'Select all' */
  selectAll: string;
  /** The first word of a row checkbox's name; React Aria adds the row's name after it (spec correction 5). @default 'Select' */
  select: string;
  /** @default 'Clear selection' */
  clearSelection: string;
  /** The bar's count, given the formatted count. @default (count) => `${count} selected` */
  selected: (count: string) => string;
  /** @default 'Loading' */
  loading: string;
  /** @default 'Total' */
  total: string;
  /** The bar's name. @default 'Bulk actions' */
  toolbar: string;
}

type Selectable =
  | { selectedKeys?: undefined; onSelectionChange?: undefined }
  | {
      /** Turns selection on (section 7). Always controlled, from the page's state. */
      selectedKeys: readonly Key[];
      /** Always the given rows' keys, never React Aria's 'all' (ruling 4). */
      onSelectionChange: (keys: Key[]) => void;
    };

// DataTableBaseProps<T> becomes DataTableShared<T> & Selectable, with DataTableShared gaining:
//   /** The bar's buttons, shown while any row is selected. */
//   bulkActions?: ReactNode;
//   /** How counts are written, such as in Persian digits. @default String */
//   formatCount?: (count: number) => string;
```

- Produces, internal: `selection.ts` (`keysOf(selection: Selection, items, getKey, disabled): Key[]`, `presentKeys(selected, present): Key[]`, `staleKeys(selected, present): Key[]`, `toggled(selected, key): Key[]`); `keys.ts`'s full `handleTableKey(event: KeyboardEvent<HTMLElement>, actions: TableKeyActions): void` with `interface TableKeyActions { keyOf: (row: Element) => Key | null; toggle: (key: Key) => void }`; `BulkBar`.
- Later tasks rely on: `handleTableKey` and the selection helpers (Task 4), the bar (Task 4's list face shares it).

**Behavior:**

1. **On.** With `selectedKeys` and `onSelectionChange`, the `Table` is `selectionMode="multiple"` with `selectionBehavior="toggle"` and `selectedKeys`, and a first `Column.data-table-column[data-selection]` (id `__selection`, 3.5rem) holds `Checkbox slot="selection" aria-label={labels.selectAll}`; each row's first `Cell[data-selection]` holds `Checkbox slot="selection" aria-label={labels.select}`, named "Select Groceries, 12 October" through React Aria's `aria-labelledby` (spec correction 5). The totals row's first cell is empty, and a skeleton row's first cell is a 3.5rem blank.
2. **Select-all** (ruling 4). `onSelectionChange` receives `keysOf(selection, ...)`: React Aria's `'all'`, from the header checkbox or Mod+A, becomes the keys of `items` not in `disabledKeys`; a `Set` becomes its keys in order. The header checkbox is checked while every enabled row is selected and indeterminate while some are (React Aria's `useTableSelectAllCheckbox`, `table/useTableSelectionCheckbox.mjs:34-45`).
3. **A press opens and never selects** (ruling 2). The row link's press stops at the link (Task 2's spike); a press on the checkbox toggles; a press on a cell's own control is the control's.
4. **The bar** (ruling 5). While `presentKeys(selectedKeys, items)` is not empty, `div.data-table-bar` follows the faces: React Aria's `Toolbar` named `labels.toolbar`, holding `span.data-table-bar-count` with `labels.selected(formatCount(count))`, `div.data-table-bar-actions` with `bulkActions` while `present(bulkActions)`, and `Button variant="tertiary"` (`data-table-bar-clear`) with `labels.clearSelection`. A second `DataTableStatus` (`data-table-count`) says the same count `QUIET_MS` after it last changed, so a run of X presses says the total once, and empties at 0. The count counts only keys present in `items` (R6).
5. **Where it sits.** `position: sticky; inset-block-end: calc(var(--app-shell-inset-block-end, 0px) + var(--spacing-inset))` inside DataTable's box, so it rides with the table, clears a bottom tab bar's reserve (`app-shell.css:13-14,86-89`), and never covers the pager under the table once the table has scrolled past.
6. **Leaving.** Clear selection calls `onSelectionChange([])` and focuses the visible face's grid. The bar's `onKeyDown` takes Escape: clears and focuses the grid (spec correction 18). When the selection empties by any other means while focus is in the bar (a bulk action that clears it), a layout effect puts focus on the grid, since the bar is leaving with the focused element. The visible face is read in the handler or the effect (`getComputedStyle(face).display !== 'none'`).
7. **Stale keys** (R6). `useWarnOnce` warns once, naming the selected keys that are not in `items`: "DataTable: selectedKeys holds keys that are not in items: t41, t42. Clear the selection when the rows change."
8. **The keys** (ruling 3, spec corrections 6 to 8). `handleTableKey` on the root's capture phase, in this order: (a) do nothing for a composing key, while `isAnotherModalOpen()`, from an editable target (`input`, `textarea`, `select`, `[contenteditable]`) or from inside `.data-table-bar`; (b) Enter on a row or one of its cells, with any modifiers, never on a control inside a cell: stop it, and open the row's link (`link.click()` without a modifier; a `MouseEvent('click')` carrying the modifiers with one); a row without a link swallows Enter, so it never selects; (c) leave every other key with Ctrl, Alt or Meta held to React Aria (Mod+A, Shift with the arrows); (d) J or K, matched by `matchesShortcut(event.nativeEvent, J)` with its `event.code` fallback: stop it and dispatch Arrow Down or Arrow Up on the focused element; (e) X: stop it and toggle the focused row's key (`keyOf` reads the row's `data-key`, `selection/useSelectableItem.mjs:193`, mapped back through the items, and returns null for the totals row, the empty row and a disabled row); (f) the hidden-cell arrows (Task 2); (g) any other single printable key except Space: stop it, so typeahead never runs.
9. **Escape** in the table is React Aria's: it clears a selection and lets the key through when there is none (`selection/useSelectableCollection.mjs:186-192`).
10. **Server.** With a selection, the server's HTML holds the checked boxes, the header's state, the bar with its count and an empty count status.

**CSS**, added to `data-table.css` before its forced-colors block:

```css
  /* ---- Selection: the 3.5rem checkbox column and the 8% wash ------------------------------------- */
  .data-table-column[data-selection],
  .data-table-cell[data-selection] {
    --data-table-pad: var(--spacing-part);

    width: 3.5rem;
  }

  .data-table-skeleton-cell[data-selection] {
    flex: 0 0 3.5rem;
  }

  /* One step over hover, and it holds under the pointer: a selected row is marked by its box, never color alone. */
  .data-table-row:is([data-selected], [aria-selected='true']),
  .data-table-row:is([data-selected], [aria-selected='true']):is(:hover, [data-hovered]) {
    background-color: color-mix(in srgb, var(--color-ink) 8%, var(--data-table-fill));
  }

  /* ---- The bulk-action bar: the float surface, stuck to the viewport's bottom inside the table's box -- */
  .data-table-bar {
    position: sticky;
    inset-block-end: calc(var(--app-shell-inset-block-end, 0px) + var(--spacing-inset));
    z-index: calc(var(--z-header) - 1);
    box-sizing: border-box;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--spacing-part);
    margin-block-start: var(--spacing-inset);
    padding-block: var(--spacing-part);
    padding-inline: var(--spacing-inset) var(--spacing-part);
    border: 1px solid var(--color-frame);
    border-radius: var(--radius-surface);
    background-color: var(--color-float);
    box-shadow: var(--shadow-float);
    color: var(--color-ink);
  }

  .data-table-bar-count {
    margin-inline-end: auto;
    font-size: var(--text-small);
    line-height: var(--text-small--line-height);
    font-weight: 500;
    font-variant-numeric: tabular-nums;
  }

  .data-table-bar-actions {
    display: flex;
    flex-wrap: wrap;
    gap: var(--spacing-part);
  }
```

and in the forced-colors block:

```css
    .data-table-row:is([data-selected], [aria-selected='true']) {
      background-color: Highlight;
      color: HighlightText;
    }

    .data-table-bar {
      border-color: CanvasText;
    }
```

The 5% hover rule in the hover block gains `:not([data-selected], [aria-selected='true'])`, so a hovered selected row stays at 8%.

**Code** (the mapping, because `'all'` must never reach the app; and the handler, because its order decides what React Aria still sees):

```ts
// selection.ts: pure.
/** React Aria's selection as the app's keys: 'all' is the given rows' enabled keys, never passed on (ruling 4). */
export function keysOf<T>(
  selection: Selection,
  items: readonly T[],
  getKey: (item: T) => Key,
  disabled: ReadonlySet<Key>,
): Key[] {
  if (selection === 'all') return items.map(getKey).filter((key) => !disabled.has(key));
  return [...selection];
}

/** The selected keys still in `present`, the ones the bar counts (R6). */
export const presentKeys = (selected: readonly Key[], present: ReadonlySet<Key>): Key[] =>
  selected.filter((key) => present.has(key));
```

```ts
// keys.ts: the table's keys (ruling 3). Matches J, K and X by event.key and then event.code, as the palette's
// shortcut does, so a Persian layout's J is J.
const J = parseShortcut('j');
const K = parseShortcut('k');
const X = parseShortcut('x');

const EDITABLE = 'input, textarea, select, [contenteditable]:not([contenteditable="false"])';
const CELL = '[role="gridcell"], [role="rowheader"]';

export function handleTableKey(event: KeyboardEvent<HTMLElement>, actions: TableKeyActions): void {
  const native = event.nativeEvent;
  const target = event.target as HTMLElement;
  if (native.isComposing || isAnotherModalOpen() || target.closest(EDITABLE) || target.closest('.data-table-bar'))
    return;
  const row = target.closest('[role="row"]');
  if (event.key === 'Enter' && row !== null && (target === row || target.matches(CELL))) {
    // React Aria would select a row with no action on Enter (spec correction 6), so Enter never reaches it.
    event.preventDefault();
    event.stopPropagation();
    const link = row.querySelector<HTMLAnchorElement>('a.data-table-link');
    if (link === null) return;
    const { ctrlKey, metaKey, shiftKey, altKey } = native;
    if (ctrlKey || metaKey || shiftKey || altKey)
      link.dispatchEvent(
        new MouseEvent('click', { ctrlKey, metaKey, shiftKey, altKey, bubbles: true, cancelable: true, detail: 1 }),
      );
    else link.click();
    return;
  }
  if (event.ctrlKey || event.metaKey || event.altKey) return;
  if (matchesShortcut(native, J) || matchesShortcut(native, K)) {
    event.preventDefault();
    event.stopPropagation();
    const key = matchesShortcut(native, J) ? 'ArrowDown' : 'ArrowUp';
    target.dispatchEvent(new KeyboardEvent('keydown', { key, code: key, bubbles: true, cancelable: true }));
    return;
  }
  if (matchesShortcut(native, X)) {
    event.preventDefault();
    event.stopPropagation();
    const key = row === null ? null : actions.keyOf(row);
    if (key !== null) actions.toggle(key);
    return;
  }
  if (hiddenCellArrow(event)) return; // Task 2's part, unchanged.
  if (event.key.length === 1 && event.key !== ' ') event.stopPropagation();
}
```

**Tests, written first:**

- `selection.test.ts`: `it('maps all to the given rows enabled keys')`; `it('passes a Set on as its keys in order')`; `it('keeps only the keys present in items for the count')`; `it('names the stale keys')`; `it('toggles a key in and out, keeping the order')`.
- `keys.test.ts`, the full handler on events built with `new KeyboardEvent` and dispatched through a rendered root: `it('dispatches Arrow Down for J and Arrow Up for K on the focused element')`; `it('matches J, K and X on a Persian layout by event.code: key ت with code KeyJ')`; `it('toggles the focused row on X, and nothing for the totals, empty or a disabled row')`; `it('clicks the row link on Enter from the row or a cell, and swallows Enter on a row without one')`; `it('dispatches a click with the modifiers on a modifier Enter')`; `it('leaves Enter on a control inside a cell to the control')`; `it('stops every other single printable key, and leaves Space, the arrows, Home, End and Escape')`; `it('leaves keys with Ctrl, Alt or Meta held to React Aria, Enter apart')`; `it('ignores a composing key, a key in an input in a cell, a key in the bar, and every key while another modal is open')`.
- `DataTable.selection.test.tsx`:
  - `it('turns selection on with selectedKeys and onSelectionChange, with a checkbox column first')`
  - `it('names the header checkbox Select all and a row checkbox Select and the row')` (`getByRole('checkbox', { name: 'Select Groceries' })`)
  - `it('gives select-all and Mod+A the enabled rows keys, never all')`
  - `it('makes the header checkbox indeterminate while some rows are selected')`
  - `it('never selects on a click on a row link')`
  - `it('toggles on Space and X, and opens on Enter, which never selects')`
  - `it('moves down and up on J and K as on the arrows')`
  - `it('keeps focus on a row when a letter is typed')`
  - `it('clears on Escape in the table, and lets Escape through with nothing selected')`
  - `it('shows the bar while a row is selected: a toolbar named Bulk actions with the count, the actions and Clear selection')`
  - `it('writes the count with formatCount and labels.selected, counting only keys in items')`
  - `it('says the count in its status once, QUIET_MS after the last change')`
  - `it('clears on Clear selection and on Escape in the bar, with focus on the table')`
  - `it('puts focus on the table when the selection empties while the bar holds focus')`
  - `it('warns once naming the selected keys that are not in items')`
  - `it('never selects the totals row, by Space, X or select-all')`
  - `it.each(AXE_CASES)('has no axe violations %s')`: some selected, all selected, the bar focused, a disabled row selected around.
  - type tests with `// @ts-expect-error`: `selectedKeys` without `onSelectionChange`; `onSelectionChange` taking a `Selection`; `labels.selectRow`.
- `server-face.test.tsx`, `FACES` row: the Task 2 table with two keys selected, `bulkActions` a `Button`, and `formatCount`.
- `hydration.test.tsx`, `HYDRATED` row: the same, `after`: the bar's count reads "2 selected" and the header checkbox is indeterminate.
- `server-render.test.tsx`, `CLIENT` row: `['DataTable selected', <same />, ['aria-multiselectable="true"', 'aria-label="Select all"', 'aria-label="Select"', 'class="data-table-bar"', 'role="toolbar"', 'aria-label="Bulk actions"', '>2 selected<'], ["'all'"]]`.
- `empty-parts.test.tsx`: `it('draws no actions in the bar for bulkActions of false, an empty string or null')` (no `.data-table-bar-actions`).
- `css.test.js`, in `describe('src/components/data-table.css')`: `it('makes the checkbox column 3.5rem with a part step of padding')`; `it('washes a selected row 8% ink over the fill, held under the pointer')`; `it('sticks the bar to the bottom above the tab bar reserve, one layer under the header token')`; `it('draws the bar on the float surface with the frame edge, the surface radius and the float shadow')`; `it('sets the count at the small step at 500, tabular, pushing the actions to the end')`; `it('draws a selected row Highlight with HighlightText and the bar edge CanvasText in forced colors')`.
- `contrast.test.js`, in `describe('the data table')`: `it('measures a selected row and the bar, in both modes')`: ink on the 8% wash over canvas 13.81 and 16.06 and over lifted 15.13 and 13.92; slate on it over canvas 4.11 and 6.62 and over lifted 4.51 and 6.04 (recorded: no slate text sits on a selected table row); the count, ink on float 18.43 and 17.42, gated.
- Stories, added to `DataTable.stories.tsx`, each with selection in local state and a bar holding a secondary "Categorize" and a `danger` "Delete":
  - `Selected` (tags `['viewport-desktop', 'density']`): three rows selected: checked boxes, an indeterminate header, the 8% rows, the bar under the table.
  - `AllSelected` (tags `['viewport-desktop']`): every row selected, the header checked.
  - `SelectedRightToLeft` (tags `['viewport-desktop']`): the right-to-left table with two selected and the count in Persian digits through `formatCount`.
  - `BarKeyboardFocus` (tags `['viewport-desktop']`): play selects two rows by X and tabs to the bar: the ring on "Categorize".
  - `no-visual`: `Keys` (tags `['no-visual', 'webkit', 'firefox']`; play presses J, J, K, X, Space, Enter and asserts focus, selection and the router spy after each), `PersianLayoutKeys` (tags `['no-visual', 'webkit', 'firefox']`; play dispatches `key: 'ت', code: 'KeyJ'` and asserts the move), `TypeaheadStopped` (tags `['no-visual', 'webkit', 'firefox']`), `ModifierEnter` (tags `['no-visual', 'webkit', 'firefox']`; play presses Control+Enter and records whether the router spy was called, with no threshold in WebKit, read by the record), `EscapeClears`, `ClearFocus`, `HoverSelected`, `StickyBar` (play scrolls so the table's end is below the viewport: the bar sits 16px over the bottom edge).
- `RightToLeft.stories.tsx`, `DataTableMirrored`: play also asserts the checkbox column is the rightmost and the bar's count is at its right.
- Docs end-to-end: `components.spec.ts`, in `test.describe('forced colors')`: `test('a selected data table row is Highlight with HighlightText')`. `docs.spec.ts`:
  - `test('a data table selects with X and Space, shows the bar with the count, and opens a row on Enter without selecting it')` (the `data-table-selection` example).
  - `test('a data table keeps focus on its row when a letter is typed')`.
  - `test('select all selects the rows on the page and Clear selection puts focus back in the table')`.

**Docs:**

- `data-table.mdx` gains `## Selection` (`data-table-selection`: `selectedKeys` and `onSelectionChange`, held in the page's state and never the URL; select-all is the rows on this page, and the app may offer more in the bar; a press opens and the checkbox, Space and X select; `bulkActions` and `formatCount`; clear the selection when the rows change), the props table's `Pick` gains `'selectedKeys' | 'onSelectionChange' | 'bulkActions' | 'formatCount'`, and the Keys table becomes spec 7.2's with the corrections: `<Keys rows={[['Down Up J K', 'Move to the next or previous row; from the first row, Up reaches the headers. J and K act as the arrows on any keyboard layout.'], ['Right Left', 'Into and between the cells of a row, skipping a column that has left, and back to the row.'], ['Home End', 'The first or last row; in a cell, the row first or last cell.'], ['PageUp PageDown', 'The first or last row, since the page itself scrolls.'], ['Enter', 'Opens the focused row, with a modifier too, and never selects it. On a sortable header, sorts.'], ['Space X', 'Toggle the focused row selection. Space on a header sorts.'], ['Shift+Down Shift+Up', 'Extend the selection.'], ['Mod+A', 'Selects every row on the page.'], ['Escape', 'Clears the selection; in the bar too, with focus back in the table.'], ['A-Z', 'Nothing: a letter never moves focus.'], ['Tab', 'Into and out of the table, one stop, then the bar, where Left and Right move between its buttons.']]} />`; the Accessibility section adds the checkbox names, `aria-selected`, the toolbar, and React Aria's own selection announcement beside the bar's (spec correction 9). Design rules add: dos, the count in the reader's words, a selection cleared with the page; donts, never selection in the URL, never a press that selects.
- `data-table-selection.tsx`: a client file with selection in state, cleared when its sort changes.
- `docs/design-system.md`, `## DataTable`, its selection paragraphs: the checkbox column and its 3.5rem, the names (spec correction 5), the 8% wash and its measured pairs, the bar's surface and place, its count and status (spec correction 9), Escape and focus (spec correction 18), the key handler's order and each key (spec corrections 6 to 8), the modifier Enter's result per engine from `ModifierEnter`, R6.

**Steps:**

- [ ] **Step 1: Write the failing tests** listed above, stories included.
- [ ] **Step 2: Run them and watch them fail** (the commands of Task 1's Step 2, with `DataTable` as the Storybook filter). Expected: the core run FAILS the new data-table tests and passes the contrast tests; the React run FAILS to import `./selection` and `./BulkBar` and the selection tests fail, and the face projects fail on the new row; the Storybook run fails the new stories; the end-to-end run FAILS the new tests.
- [ ] **Step 3: Write `selection.ts`, the rest of `keys.ts`, `BulkBar`, the selection in `TableFace` and `DataTable`, the CSS, the stories, the example, the page's sections and the record.** Re-measure `DataTable`'s size entry, which now pulls in Checkbox and Button too, and set it by the rule, recording the reason if it is above 4 kB. Update the face snapshot with `--project=face-utc -u`, read the new entry (the bar and "2 selected", no `'all'`), and run `--project=face-tehran` against it.
- [ ] **Step 4: Run the tests and watch them pass** (the commands of Task 1's Step 2, filter `DataTable`). Expected: all pass: about 6 core tests, about 5 selection, 9 keys and 20 selection tests, the face row in both zones, the hydration row, the server row and the empty-parts row, and the 12 new stories and the mirrored check. `check-use-client` reports one more client module.
- [ ] **Step 5: Run everything** (the Step 5 commands). Expected: every gate green; the end-to-end run passes the three new tests and the forced-colors test; `DataTable` within its limit; `pnpm verify` exits 0.
- [ ] **Step 6: Commit and push**, then read the pull request's `storybook-webkit` and `storybook-firefox` results for `Keys`, `PersianLayoutKeys`, `TypeaheadStopped` and `ModifierEnter`, and write `ModifierEnter`'s result per engine into the record (a follow-up `docs: record the modifier Enter per engine` commit if it lands after this one).

```bash
git add apps/docs/content/docs/components/data-table.mdx apps/docs/examples/data-table-selection.tsx apps/docs/examples/index.ts apps/docs/tests/components.spec.ts apps/docs/tests/docs.spec.ts docs/design-system.md packages/core/src/components/data-table.css packages/core/test/contrast.test.js packages/core/test/css.test.js packages/react/.size-limit.json packages/react/src/data-table packages/react/src/index.ts packages/react/src/rtl/RightToLeft.stories.tsx packages/react/test/__snapshots__/server-face.test.tsx.snap packages/react/test/empty-parts.test.tsx packages/react/test/hydration.test.tsx packages/react/test/server-face.test.tsx packages/react/test/server-render.test.tsx
git commit -m "feat: add selection, the bulk-action bar and the keys to DataTable"
git push origin feat/data-table
```

- [ ] **Step 7: Visual baselines** (owner action 2). Expected: 17 new files and no changed file, Task 2's 45 included: `components-datatable--selected--{light-rounded,dark-rounded,light-soft,light-square,light-rounded-compact}.png` and `components-datatable--{all-selected,selected-right-to-left,bar-keyboard-focus}--{light-rounded,dark-rounded,light-soft,light-square}.png`. What to look at: a 56px checkbox column with ink boxes checked on three rows, those rows a shade deeper than hover, the header box showing its dash; a float bar under the table with "3 selected" at its start and "Categorize", "Delete" and a tertiary "Clear selection" at its end; every box checked in `AllSelected`; in right to left the checkboxes at the right and "۲ انتخاب شده" at the bar's right; the ring on "Categorize". Then `git commit -m "test: add the DataTable selection baselines"`.

---

### Task 4: DataTable, the list face

**Goal:** the same rows as a list grouped by day where DataTable's box is narrower than 40rem: React Aria's `GridList` with a section per run of adjacent rows in a group, sticky day headings, items laid out from each column's `listSlot`, the same link, selection, bar, keys, totals, empty and loading bodies; and R3's measured sizes. Implements spec 8, 10.1 ruling 8, 10.2 item 9 (the list's select-all), 11 (the list face rows), 12 (the list face) and R3.

**Files:**

- Create: `packages/react/src/data-table/ListFace.tsx`, `packages/react/src/data-table/groups.ts`
- Modify: `packages/react/src/data-table/DataTable.tsx`, `packages/react/src/data-table/index.ts`, `packages/react/.size-limit.json` (re-measured)
- Test: `packages/react/src/data-table/groups.test.ts`, `packages/react/src/data-table/DataTable.list.test.tsx` (create), `packages/react/test/server-face.test.tsx`, `packages/react/test/hydration.test.tsx`, `packages/react/test/server-render.test.tsx`
- Modify (stories): `packages/react/src/data-table/DataTable.stories.tsx`, `packages/react/src/rtl/RightToLeft.stories.tsx` (`DataTableListMirrored`)
- Modify: `packages/core/src/components/data-table.css`
- Test: `packages/core/test/css.test.js`, `packages/core/test/contrast.test.js`
- Create: `apps/docs/examples/data-table-phone.tsx`
- Modify: `apps/docs/content/docs/components/data-table.mdx`, `apps/docs/examples/index.ts`
- Test: `apps/docs/tests/components.spec.ts`, `apps/docs/tests/docs.spec.ts`
- Modify: `docs/design-system.md` (`## DataTable` gains the list face and R3's sizes, by hand)
- Create (Docker step): 29 baselines, listed in Step 8. None changes.

**Interfaces:**

- Consumes: from `react-aria-components`, `GridList`, `GridListItem`, `GridListSection`, `GridListHeader`; the library's `Checkbox`, `Link`, `Skeleton`, and Task 3's `handleTableKey`, `keysOf`, `presentKeys` and `BulkBar`; the tokens of Task 2 and `--spacing-peer`.
- Produces: `DataTableColumn` gains `listSlot?: 'title' | 'meta' | 'end' | 'hidden'` (`@default 'hidden', or 'title' for the row header`), and `DataTableShared` gains `getGroup?: (item: T) => { id: Key; label: string }` (the list face's day groups; without it one ungrouped list), both as the spec writes them. Internal: `groups.ts`, `groupsOf<T>(items, getGroup?): RowGroup<T>[]` with `interface RowGroup<T> { key: string; label: string | null; items: T[] }`.
- Later tasks rely on: both faces in SidePanel's stories (Task 5) and the recipe (Task 6).

**Behavior:**

1. **When** (ruling 8). `div.data-table-list` follows `div.data-table-grid` in DataTable's root; under 40rem of the root's box the grid is `display: none` and the list `display: block`, and the other way round, by the container query, so a table beside an open panel on a small laptop is a list too.
2. **Markup.** `div.data-table-list` holds, while selection is on, `div.data-table-list-head` with the library's `Checkbox` showing `labels.selectAll` as its visible label, checked or indeterminate from the selection, calling `onSelectionChange` with every enabled row's key or `[]` (10.2 item 9); then React Aria's `GridList.data-table-grid-list`, named as the table is, `selectionMode` and `selectionBehavior` as the table's, `selectedKeys`, `onSelectionChange` through `keysOf`, `disabledKeys`, and `disallowTypeAhead` (spec correction 10); then, with totals and items, `div.data-table-list-total`.
3. **Groups.** `groupsOf(items, getGroup)` walks `items` in order and starts a group whenever the id differs from the previous row's, so only adjacent rows group; each group is a `GridListSection.data-table-section` keyed `${index}:${String(id)}`, unique even when an id returns after another, headed by `GridListHeader.data-table-section-header` with the group's `label` (React Aria names the section's `rowgroup` by it, `gridlist/useGridListSection.mjs:23,34`). Without `getGroup` there is one section with no header. The docs say to pass `getGroup` only while sorted by date.
4. **An item.** `GridListItem.data-table-item` with `id`, `textValue` as the table's row, `data-link`, `data-current`, holding, while selection is on, `Checkbox slot="selection" aria-label={labels.select}` (named with the item's text, spec correction 5); then `div.data-table-item-text` with `span.data-table-item-title` (the `title` slot's cells; the row header's holds the stretched `Link` with `aria-current` while current) and, when any `meta` cell exists, `span.data-table-item-meta` with the `meta` cells in column order and the app's own separators; then `span.data-table-item-end` with the `end` cells, each in `span.data-table-figure` when end-aligned. `hidden` cells are left out.
5. **Selection, the bar and the keys** are the table's: the same `selectedKeys`, the same bar after both faces, and the same capture handler on the root, whose `keyOf` reads the item's `data-key`; J and K dispatch the arrows on the focused item, X toggles, Enter opens, letters are stopped.
6. **Totals** show as `div.data-table-list-total`: `span` with `labels.total`, then each `end` column's `total` at 700, figures by the numeral rule.
7. **Empty and loading.** `renderEmptyState` draws `emptyState`, or while loading with no items `loadingRowCount` `div.data-table-skeleton-item`s, each a 60% line and a 40% line of `Skeleton` with an end line at 24%, so the list counts only React Aria's empty row.
8. **Server.** Both faces are in the server's HTML, one HTML in every locale and zone; R3's sizes are measured in Step 6.

**CSS**, added to `data-table.css` before its forced-colors block:

```css
  /* ---- The list face, under 40rem of the table's own box ----------------------------------------- */
  .data-table-list {
    display: none;
  }

  @container data-table (width < 40rem) {
    .data-table-grid {
      display: none;
    }

    .data-table-list {
      display: block;
    }
  }

  .data-table-grid-list {
    outline: none;
  }

  .data-table-list-head {
    display: flex;
    align-items: center;
    min-block-size: var(--size-target);
    padding-inline: var(--spacing-inset);
    border-block-end: 1px solid var(--color-divider);
  }

  .data-table-section-header {
    position: sticky;
    inset-block-start: var(--page-sticky-top, 0px);
    z-index: calc(var(--z-header) - 1);
    padding: var(--spacing-peer) var(--spacing-inset) var(--spacing-part);
    background-color: var(--data-table-fill);
    color: var(--color-slate);
    font-size: var(--text-overline);
    line-height: var(--text-overline--line-height);
    letter-spacing: var(--text-overline--letter-spacing);
    font-weight: var(--text-overline--font-weight);
    text-transform: uppercase;
  }

  .data-table-item {
    --data-table-pad: var(--spacing-inset);

    position: relative;
    box-sizing: border-box;
    display: flex;
    align-items: center;
    gap: 0.75rem;
    min-block-size: max(var(--size-target), 3.5rem);
    padding-block: 0.625rem;
    padding-inline: var(--data-table-pad);
    border-block-end: 1px solid var(--color-divider);
    font-size: var(--text-small);
    line-height: var(--text-small--line-height);
    font-weight: var(--text-small--font-weight);
    outline: none;
  }

  /* A rule between items in a group, none at its end. */
  .data-table-item:last-child {
    border-block-end: 0;
  }

  .data-table-item[data-link] {
    cursor: pointer;
  }

  .data-table-item-text {
    display: flex;
    flex: 1 1 auto;
    flex-direction: column;
    gap: 0.125rem;
    min-inline-size: 0;
  }

  .data-table-item-title,
  .data-table-item-meta {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .data-table-item-title {
    font-weight: 500;
  }

  .data-table-item-meta {
    color: var(--color-slate);
  }

  .data-table-item-end {
    display: flex;
    flex: none;
    flex-direction: column;
    align-items: flex-end;
    gap: 0.125rem;
  }

  .data-table-item .checkbox-field {
    position: relative;
    z-index: calc(var(--z-header) - 2);
  }

  .data-table-item:is(:focus-visible, [data-focus-visible]) {
    outline: var(--focus-ring-width) solid var(--focus-ring-color);
    outline-offset: calc(-1 * var(--focus-ring-width));
  }

  .data-table-item:is([data-selected], [aria-selected='true']) {
    background-color: color-mix(in srgb, var(--color-ink) 8%, var(--data-table-fill));
  }

  /* Slate falls under 4.5 on either wash over canvas, so the meta line turns ink on a hovered or selected item. */
  .data-table-item:is([data-selected], [aria-selected='true']) .data-table-item-meta {
    color: var(--color-ink);
  }

  .data-table-item[data-current] {
    padding-inline-start: calc(var(--data-table-pad) - 3px);
    border-inline-start: 3px solid var(--color-ink);
  }

  .data-table-item[data-current] .data-table-item-title {
    font-weight: 700;
  }

  .data-table-item:is([data-disabled], [aria-disabled='true']) {
    color: var(--color-taupe);
    cursor: not-allowed;
  }

  .data-table-list-total {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--spacing-part);
    min-block-size: var(--size-target);
    padding-inline: var(--spacing-inset);
    border-block-start: 1px solid var(--color-frame);
    font-size: var(--text-small);
    line-height: var(--text-small--line-height);
    font-weight: 700;
  }

  .data-table-skeleton-item {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    min-block-size: max(var(--size-target), 3.5rem);
    padding-inline: var(--spacing-inset);
    border-block-end: 1px solid var(--color-divider);
  }
```

Inside the hover block: `.data-table-item:is([data-link], [data-selection-mode]):is(:hover, [data-hovered]):not([data-disabled], [data-selected], [aria-selected='true']) { background-color: color-mix(in srgb, var(--color-ink) 5%, var(--data-table-fill)); }` and the same item's `.data-table-item-meta { color: var(--color-ink); }`. Inside the forced-colors block: `.data-table-list-head, .data-table-item, .data-table-list-total, .data-table-skeleton-item { border-color: CanvasText; }`, the selected item `Highlight` and `HighlightText`, the current item's border `CanvasText`, a focused item's outline `Highlight`.

**Code** (the grouping, because only adjacent rows group and a returning id must still be a unique section):

```ts
// groups.ts: pure.
/** Rows in runs of one group, in items order: the app sorts, the list groups only what is adjacent (spec 8.1). */
export function groupsOf<T>(items: readonly T[], getGroup?: (item: T) => { id: Key; label: string }): RowGroup<T>[] {
  if (getGroup === undefined) return [{ key: 'all', label: null, items: [...items] }];
  const groups: RowGroup<T>[] = [];
  let last: Key | undefined;
  for (const item of items) {
    const { id, label } = getGroup(item);
    const current = groups.at(-1);
    if (current !== undefined && id === last) current.items.push(item);
    // Keyed by its run, so a group id that comes back after another is a second, unique section.
    else groups.push({ key: `${String(groups.length)}:${String(id)}`, label, items: [item] });
    last = id;
  }
  return groups;
}
```

**Tests, written first:**

- `groups.test.ts`: `it('groups adjacent rows with the same id, in items order')`; `it('starts a new group when an id comes back after another, with a key of its own')`; `it('makes one ungrouped group without getGroup')`; `it('makes no group for no items')`.
- `DataTable.list.test.tsx`:
  - `it('draws a second grid named as the table, with a rowgroup per group named by its label')`
  - `it('puts title, meta and end cells in their slots, the row header the title by default, and leaves hidden cells out')`
  - `it('opens an item through its link, marks the current item, and never selects on a press')`
  - `it('selects with the item checkbox, X and Space, and the Select all checkbox above the list, never passing all')`
  - `it('takes J, K, X and Enter and stops letters, as the table does')`
  - `it('passes disallowTypeAhead to the GridList')`
  - `it('shows the totals line under the list with labels.total and the end totals')`
  - `it('draws the empty state, and two-line skeleton items while loading')`
  - `it('shares one bar and one count between the faces')`
  - `it.each(AXE_CASES)('has no axe violations %s')`: grouped, ungrouped, selected, current, empty, loading.
- `server-face.test.tsx`: the `DataTable` rows gain `getGroup`, so the snapshot holds both faces.
- `hydration.test.tsx`: the `DataTable` row's `after` also finds two `grid`s and the list's day headings.
- `server-render.test.tsx`, `CLIENT` row: `['DataTable list', <DataTable ... getGroup={groupOf} />, ['class="data-table-list"', 'class="data-table-section"', 'role="rowgroup"', 'class="data-table-item"', 'class="data-table-item-title"', '>Monday 12 October<'], []]`.
- `css.test.js`, in `describe('src/components/data-table.css')`: `it('shows the list and hides the grid under 40rem of the table box, by container query only')`; `it('sticks the day heading at --page-sticky-top on the fill, at the overline step in slate')`; `it('makes an item two lines tall at least, ruled between items and not at a group end')`; `it('sets the title at 500 and the meta slate, ellipsized, and turns the meta ink on a hovered or selected item')`; `it('marks a selected, current, focused and disabled item as the rows are')`; `it('rules the totals line with the frame color at 700')`; `it('draws the list rules CanvasText and a selected item Highlight in forced colors')`.
- `contrast.test.js`, in `describe('the data table')`: `it('measures the list face, in both modes')`: the meta line, slate on canvas 4.84 and 7.26 and on lifted 5.31 and 6.94; the same turned ink on the 5% wash over canvas 14.70 and 17.41.
- Stories, added to `DataTable.stories.tsx`, all tagged `viewport-phone` unless they say otherwise, grouped by day with `groupOf`:
  - `Phone` (tags `['viewport-phone', 'density']`): twelve rows in four days: payee and category on two lines, the amount at the end.
  - `PhoneSelected` (tags `['viewport-phone']`): two items selected, the Select all checkbox above the list indeterminate, the bar above the bottom edge.
  - `PhoneEmpty` (tags `['viewport-phone']`): the empty state.
  - `PhoneLoading` (tags `['viewport-phone']`): skeleton items.
  - `PhoneRightToLeft` (tags `['viewport-phone']`): Persian days and payees.
  - `Ungrouped` (tags `['viewport-phone']`): sorted by amount with no `getGroup`: one list with no headings.
  - `BesidePanel` (tags `['viewport-desktop']`): the table in a 36rem box at 1280: the list face.
  - `no-visual`: `ListKeys` (tags `['no-visual', 'webkit', 'firefox']`), `ListPressOpens` (tags `['no-visual', 'webkit', 'firefox']`; a press on an item's amount opens and never selects), `FaceSwitch` (play sets the box to 40rem and 39.9rem and asserts which face is shown), `StickyDay`, `R3Sizes` (play renders 50 and 200 rows with `renderToString` and records the byte counts in the story's `parameters`, with no threshold).
- `RightToLeft.stories.tsx`, `DataTableListMirrored`: play asserts the checkbox at an item's right, the amount at its left with `direction: ltr`, and the current border at its right.
- Docs end-to-end: `components.spec.ts`: `LONG_TARGETS['data-table']` becomes `['.stage .data-table-cell', '.stage .data-table-item-title', '.stage .data-table-item-meta']`; `SERVER_RENDERED['data-table']` gains `'.stage .data-table-list [role="row"]'`. `docs.spec.ts`:
  - `test.describe('the data table on a phone')`, with a 320 by 720 viewport: `test('shows the list grouped by day and never scrolls the page sideways')`; `test('opens an item on a tap and selects it on its checkbox')`.
  - `test('a data table switches to the list under 40rem of its box and back at 40rem')`.

**Docs:**

- `data-table.mdx` gains `## On a phone` (`data-table-phone`: under 40rem of the table's own box the same rows are a list, also beside an open panel on a small laptop; `listSlot` puts each column's cell on the item's first line, its second line or its end; `getGroup` groups adjacent rows, so pass it only while sorted by date; the day's label is your string), the `Pick` gains `'getGroup'`, the `DataTableColumn` table shows `listSlot`, and the Accessibility section adds the list's `grid` and its `rowgroup`s named by day.
- `data-table-phone.tsx`: a client file in a 22rem box, grouped by day.
- `docs/design-system.md`, `## DataTable`, its list paragraphs: the switch by the box and why (ruling 8), the day heading and its stickiness, the item's sizes (3.5rem, 10px by 16px, the 12px gap), the slots, the meta turned ink and its measured pairs, the totals line, the empty and loading items, `disallowTypeAhead` (spec correction 10), and R3's measured bytes for 50 and 200 rows with both faces.

**Steps:**

- [ ] **Step 1: Write the failing tests** listed above, stories included.
- [ ] **Step 2: Run them and watch them fail** (the commands of Task 1's Step 2, with `DataTable` as the Storybook filter). Expected: the core run FAILS the list tests; the React run FAILS to import `./groups` and `./ListFace` and the list tests fail, and the face projects fail on the changed rows; the Storybook run fails the new stories; the end-to-end run FAILS the new tests and the long-text targets.
- [ ] **Step 3: Write `groups.ts`, `ListFace`, the root's second face, the CSS, the stories, the example, the page's section and the record.** Re-measure `DataTable`'s size entry and set it by the rule, recording the reason if it is above 4 kB. Update the face snapshot with `--project=face-utc -u`, read the changed entry (both faces, the day headings), and run `--project=face-tehran` against it.
- [ ] **Step 4: Run the tests and watch them pass** (the commands of Task 1's Step 2, filter `DataTable`). Expected: all pass: about 7 core tests, about 4 groups and 15 list tests, the face row in both zones, the hydration row, the server row, and the 12 new stories and the mirrored check. `check-use-client` reports one more client module.
- [ ] **Step 5: Run everything** (the Step 5 commands). Expected: every gate green; the end-to-end run passes the page's loop tests with the list's long text, and the three new tests; `pnpm verify` exits 0.
- [ ] **Step 6: Record R3.** Read `R3Sizes`' byte counts from the Chromium run and write them into the `## DataTable` record. If the 200-row page with both faces is over 400 kB, say so to the controller with the numbers (open question 6) before the release.
- [ ] **Step 7: Commit and push**, then read the pull request's WebKit and Firefox results for `ListKeys` and `ListPressOpens`.

```bash
git add apps/docs/content/docs/components/data-table.mdx apps/docs/examples/data-table-phone.tsx apps/docs/examples/index.ts apps/docs/tests/components.spec.ts apps/docs/tests/docs.spec.ts docs/design-system.md packages/core/src/components/data-table.css packages/core/test/contrast.test.js packages/core/test/css.test.js packages/react/.size-limit.json packages/react/src/data-table packages/react/src/rtl/RightToLeft.stories.tsx packages/react/test/__snapshots__/server-face.test.tsx.snap packages/react/test/hydration.test.tsx packages/react/test/server-face.test.tsx packages/react/test/server-render.test.tsx
git commit -m "feat: add the list face to DataTable"
git push origin feat/data-table
```

- [ ] **Step 8: Visual baselines** (owner action 2). Expected: 29 new files and no changed file, Tasks 2 and 3's 62 included: `components-datatable--phone--{light-rounded-375,dark-rounded-375,light-soft-375,light-square-375,light-rounded-375-compact}.png`, `components-datatable--{phone-selected,phone-empty,phone-loading,phone-right-to-left,ungrouped}--{light-rounded-375,dark-rounded-375,light-soft-375,light-square-375}.png` and `components-datatable--beside-panel--{light-rounded,dark-rounded,light-soft,light-square}.png`. What to look at: slate uppercase days over their items; each item a bold payee over a slate category, the amount at the right in tabular figures; rules between items and none under a day's last; "Select all" above the list and two items a shade deeper with the bar 16px above the bottom; the empty state; two-line skeleton items; in right to left the amounts at the left; no headings in `Ungrouped`; the list in the 36rem box at 1280. Then `git commit -m "test: add the DataTable list baselines"`.

---

### Task 5: SidePanel and SidePanelLayout

**Goal:** a detail beside the content on a wide screen and a sheet on a phone, driven by one `isOpen` the app reads from the URL: `SidePanelLayout`, a grid of the content and the panel's 24rem column from 1024px; `SidePanel`'s aside face, a `complementary` landmark on the rail's surface, sticky at `--page-sticky-top`, in the server's HTML when open; its sheet face, 3b's `Sheet`, mounted only after hydration under 1024px; focus to the heading on an opening and back to the opener on close; Escape and the close button calling `onClose`; and the move across 1024px with focus kept. Implements spec 9, 10.1 rulings 10 and 11, 10.2 item 11, 11 (the SidePanel rows), 12 (SidePanel) and 13 (the `side-panel` page and its record), and R7 and R8.

**Files:**

- Create: `packages/react/src/side-panel/SidePanel.tsx`, `packages/react/src/side-panel/SidePanelLayout.tsx`, `packages/react/src/side-panel/index.ts`
- Modify: `packages/react/src/index.ts`, `packages/react/.size-limit.json`
- Test: `packages/react/src/side-panel/SidePanel.test.tsx` (create), `packages/react/test/server-face.test.tsx`, `packages/react/test/hydration.test.tsx`, `packages/react/test/server-render.test.tsx`, `packages/react/test/empty-parts.test.tsx`
- Create (stories): `packages/react/src/side-panel/SidePanel.stories.tsx`; Modify: `packages/react/src/rtl/RightToLeft.stories.tsx` (`SidePanelMirrored`)
- Create: `packages/core/src/components/side-panel.css`
- Modify: `packages/core/src/styles.css` (import after `data-table.css`)
- Test: `packages/core/test/css.test.js`, `packages/core/test/contrast.test.js`
- Create: `apps/docs/content/docs/components/side-panel.mdx`, `apps/docs/examples/side-panel-basic.tsx`, `apps/docs/examples/side-panel-footer.tsx`
- Modify: `apps/docs/content/docs/components/meta.json` (`"side-panel"` after `"sheet"`), `apps/docs/examples/index.ts`, `apps/docs/app/(home)/home-page.tsx` (the footer's "Side panel" link after "Sheet")
- Test: `apps/docs/tests/components.spec.ts`, `apps/docs/tests/docs.spec.ts`
- Modify: `packages/core/README.md`, `packages/react/README.md` ("Side panel" after "Sheet")
- Modify: `docs/design-system.md` (`## SidePanel` appended to Appendix B, by hand)
- Create (Docker step): 24 baselines, listed in Step 7. None changes.

**Interfaces:**

- Consumes: from `react-aria-components`, `VisuallyHidden`; the library's `Sheet`, `IconButton`, `useHydrated`, `cx`, `present`, `mergeRefs`; `X` from `lucide-react`; the tokens `--color-float`, `--color-hairline`, `--radius-stadium`, `--shadow-lift`, `--spacing-peer`, `--spacing-inset`, `--spacing-part`, `--text-h3` and its line height and letter spacing, `--text-small` and its line height and weight, `--color-ink`, `--color-slate`, `--color-divider`, the focus ring tokens.
- Produces, client modules exported from `@snapshot-ui/react` as `SidePanel`, `SidePanelProps`, `SidePanelLayout` and `SidePanelLayoutProps`, the spec's types unchanged:

```ts
'use client';

export interface SidePanelProps {
  /** The panel's heading, and the landmark's and the sheet's name. */
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

export function SidePanel(props: SidePanelProps): ReactElement | null;
export function SidePanelLayout(props: SidePanelLayoutProps): ReactElement;
```

- Produces, internal: `SidePanelLayoutContext` (the layout content's ref, for focus's fallback) and `useWide(): boolean` in `SidePanel.tsx`.
- Later tasks rely on: SidePanelLayout and SidePanel in the recipe (Task 6).

**Behavior:**

1. **The layout.** `div.side-panel-layout` (`className`, `ref`) holds `div.side-panel-layout-content[tabIndex=-1]` with `children`, then `panel`. It is one column, and from 1024px of viewport, while it holds an `aside.side-panel` (`:has(> .side-panel)`), `minmax(0, 1fr) 24rem` with a peer gap: the panel pushes the content and never covers it, and a DataTable in the content may become its list face by its own box (ruling 8).
2. **The wide face** (ruling 10, spec correction 19). While `isOpen` and wide, SidePanel renders `aside.side-panel` (`className`, `ref`, `aria-labelledby` its heading's id) holding `div.side-panel-header` with `div.side-panel-header-text` (`h2.side-panel-title[tabIndex=-1]` with `title`, inside `VisuallyHidden` while `isTitleHidden`, and `p.side-panel-description` while `present(description)`) and `IconButton.side-panel-close` (ghost, Lucide `X`, `aria-label={closeLabel}`, `onPress={onClose}`); then `div.side-panel-body` with `children`; then `div.side-panel-footer` while `present(footer)`. Under 1024px the aside is `display: none`. While closed it renders nothing.
3. **Which face.** `useWide()` is `true` on the server and through the hydration pass, and from its effect on, `window.matchMedia('(width >= 1024px)').matches`, guarded, subscribed to its `change` event, as `AppShell` reads it (`app-shell/AppShell.tsx:116-127`). So the server's HTML holds the aside when open, and the sheet face exists only after hydration (10.2 item 11).
4. **The narrow face** (spec correction 17). When not wide, SidePanel renders 3b's `Sheet` with `isOpen`, `title`, `isTitleHidden`, `description`, `footer`, `closeLabel`, `className={cx('side-panel-sheet', className)}` and `onOpenChange={(open) => { if (!open) onClose(); }}`, so every dismissal (the close button, Escape, a swipe, the scrim) calls `onClose`. The sheet is modal, as a phone has no room beside; focus is the Sheet's.
5. **Focus** (ruling 11, spec correction 20). An opening is `isOpen` turning true, or a SidePanel mounted after hydration with `isOpen` (`useHydrated()` true at its first render). On an opening the element that had focus is remembered, and on the wide face focus moves to the heading. When `isOpen` turns false on the wide face, focus returns to the remembered element if it is still in the document, else to the layout's content. The wide face traps nothing: Tab leaves it, the page is not inert, nothing is dimmed. A SidePanel mounted in the hydration pass never moves focus.
6. **Closing.** The close button and Escape inside the aside call `onClose`. The aside's `onKeyDown` listens in the bubble phase, so an open list or menu inside the panel takes its own Escape first (React Aria's overlay stops it), and takes only an Escape nothing handled (`!event.defaultPrevented`), stopping it. Escape in the content is the content's, so the table's Escape clears its selection and never closes the panel.
7. **Across 1024px.** When the viewport crosses 1024px with the panel open, the face changes: wide to narrow, the aside leaves and the sheet opens and takes focus into its dialog; narrow to wide, the sheet leaves and focus goes to the aside's heading, after the sheet's own hand-back (in a `requestAnimationFrame` if the hand-back lands later).
8. **Server.** It renders in Node with the layout, the aside, its heading, description, close button, body and footer when open, and nothing of the sheet, one HTML in every locale and zone. R7: a phone that opens a link to a transaction sees the list until scripts run, and the docs advise the detail page's own route for that link.

**CSS**, the whole of `side-panel.css`:

```css
/*
 * SidePanel and SidePanelLayout: a detail beside the content on a wide screen, derived in docs/design-system.md
 * ("SidePanel"). The layout is one column, and from 1024px, while it holds an open panel, the content and a 24rem
 * column. The panel is the rail's surface (float, the hairline, the stadium corner, the level 1 lift), padded a
 * peer step and sticky at --page-sticky-top, as tall as the viewport allows, its body scrolling inside it and
 * its footer pinned under a divider. It does not move: it is a column of the layout. Under 1024px it is hidden
 * and the panel is a Sheet. 1024px is the --breakpoint-md token, written out because a media query cannot read a
 * custom property; test/css.test.js keeps them equal.
 */
@layer components {
  .side-panel-layout {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: var(--spacing-peer);
    align-items: start;
  }

  /* Focus's last resort when the row that opened the panel has left the page. */
  .side-panel-layout-content {
    min-inline-size: 0;
    outline: none;
  }

  .side-panel {
    position: sticky;
    inset-block-start: var(--page-sticky-top, 0px);
    box-sizing: border-box;
    display: none;
    flex-direction: column;
    inline-size: 24rem;
    max-block-size: calc(100dvh - var(--page-sticky-top, 0px) - 2 * var(--spacing-inset));
    margin-block-start: var(--spacing-inset);
    padding: var(--spacing-peer);
    border: 1px solid var(--color-hairline);
    border-radius: var(--radius-stadium);
    background-color: var(--color-float);
    color: var(--color-ink);
    font-family: var(--font-sans);
    box-shadow: var(--shadow-lift);
  }

  .side-panel-header {
    display: flex;
    flex: none;
    align-items: flex-start;
    gap: var(--spacing-part);
  }

  .side-panel-header-text {
    flex: 1 1 auto;
    min-inline-size: 0;
  }

  .side-panel-title {
    margin: 0;
    border-radius: var(--radius-micro);
    color: var(--color-ink);
    font-size: var(--text-h3);
    line-height: var(--text-h3--line-height);
    letter-spacing: var(--text-h3--letter-spacing);
    font-weight: 700;
    overflow-wrap: anywhere;
    outline: none;
  }

  /* Focus lands here on an opening; the ring shows when the keyboard opened it. */
  .side-panel-title:focus-visible {
    outline: var(--focus-ring-width) solid var(--focus-ring-color);
    outline-offset: var(--focus-ring-offset);
  }

  .side-panel-description {
    margin: 0;
    margin-block-start: 0.25rem;
    color: var(--color-slate);
    font-size: var(--text-small);
    line-height: var(--text-small--line-height);
    font-weight: var(--text-small--font-weight);
    overflow-wrap: anywhere;
  }

  .side-panel-close {
    flex: none;
    margin-block-start: calc(-1 * var(--spacing-part));
    margin-inline-end: calc(-1 * var(--spacing-part));
  }

  .side-panel-body {
    flex: 1 1 auto;
    min-block-size: 0;
    margin-block-start: var(--spacing-inset);
    overflow: auto;
  }

  .side-panel-footer {
    display: flex;
    flex: none;
    flex-wrap: wrap;
    justify-content: flex-end;
    gap: var(--spacing-part);
    margin-block-start: var(--spacing-inset);
    padding-block-start: var(--spacing-inset);
    border-block-start: 1px solid var(--color-divider);
  }

  @media (width >= 1024px) {
    .side-panel-layout:has(> .side-panel) {
      grid-template-columns: minmax(0, 1fr) 24rem;
    }

    .side-panel {
      display: flex;
    }
  }

  @media (forced-colors: active) {
    .side-panel {
      border-color: CanvasText;
    }

    .side-panel-footer {
      border-block-start-color: CanvasText;
    }

    .side-panel-title:focus-visible {
      outline-color: Highlight;
    }
  }
}
```

**Code** (the face and the opening, because the sheet must never be in the hydration pass and an opening is not the same as a mount):

```tsx
// SidePanel.tsx
/** True on the server and through hydration; after, whether the viewport is 1024px or wider. */
function useWide(): boolean {
  const [isWide, setWide] = useState(true);
  useEffect(() => {
    // Read in an effect, never at render, and guarded: a test environment may lack matchMedia.
    if (typeof window.matchMedia !== 'function') return;
    const wide = window.matchMedia('(width >= 1024px)');
    const read = (): void => {
      setWide(wide.matches);
    };
    read();
    wide.addEventListener('change', read);
    return () => {
      wide.removeEventListener('change', read);
    };
  }, []);
  return isWide;
}

// Inside SidePanel: an opening is isOpen turning true, or a mount after hydration with isOpen (spec correction 20).
const mountedAfterHydration = useRef(useHydrated());
const wasOpen = useRef(mountedAfterHydration.current ? false : isOpen);
useEffect(() => {
  if (isOpen && !wasOpen.current) {
    opener.current = document.activeElement;
    if (isWide) heading.current?.focus();
  } else if (!isOpen && wasOpen.current && isWide) {
    const back = opener.current;
    if (back instanceof HTMLElement && back.isConnected) back.focus();
    else layoutContent?.current?.focus();
  }
  wasOpen.current = isOpen;
}, [isOpen, isWide, layoutContent]);
```

**Tests, written first:**

- `SidePanel.test.tsx`:
  - `it('renders a complementary landmark named by its heading while open, and nothing while closed')`
  - `it('draws the title as an h2 with tabIndex -1, the description, the close button named Close and the footer')`
  - `it('keeps the title for assistive technology only with isTitleHidden')`
  - `it('moves focus to the heading when isOpen turns true, and back to the opener when it turns false')`
  - `it('counts a mount after hydration with isOpen as an opening, and a mount in the hydration pass as none')`
  - `it('returns focus to the layout content when the opener has left the document')`
  - `it('calls onClose on the close button and on Escape inside it, and never on Escape in the content')`
  - `it('is a Sheet titled by title under 1024px after hydration, calling onClose on every dismissal')` (a mocked `matchMedia` that does not match)
  - `it('moves an open panel to the sheet when the viewport narrows, and back to the aside with focus on the heading when it widens')`
  - `it('lays out the content first and the panel second')` (SidePanelLayout)
  - `it('passes className and ref to the aside, and className and ref to the layout')`
  - `it.each(AXE_CASES)('has no axe violations %s')`: open beside content, with a footer, the title hidden, the sheet face open.
  - type tests with `// @ts-expect-error`: no `title`; no `isOpen`; no `onClose`; a `SidePanelLayout` with no `panel`.
- `server-face.test.tsx`, `FACES` row: `['SidePanel', <SidePanelLayout panel={<SidePanel title="Groceries" description="12 October" isOpen onClose={noop} footer={<Button>Save</Button>}>...</SidePanel>}>...</SidePanelLayout>]`.
- `hydration.test.tsx`, `HYDRATED` row: the same, `after`: the aside is present, no `dialog` is in the document, and focus has not moved.
- `server-render.test.tsx`, `CLIENT` row: `['SidePanel', <same />, ['class="side-panel-layout"', '<aside', 'class="side-panel"', 'aria-labelledby', 'class="side-panel-title"', 'tabindex="-1"', 'aria-label="Close"', 'class="side-panel-footer"'], ['role="dialog"', 'sheet']]`.
- `empty-parts.test.tsx`, in `describe('an empty data part slot')`: `it('draws no description or footer in a SidePanel given false, an empty string or null')`.
- `css.test.js`, `describe('src/components/side-panel.css')`: `it('lays the layout out as one column, and the content and a 24rem panel from 1024px while it holds a panel')`; `it('draws the panel on the rail surface: float, hairline, stadium corner, the lift shadow, padded a peer step')`; `it('sticks the panel at --page-sticky-top, as tall as the viewport allows, its body scrolling')`; `it('sets the title at the h3 step at 700 in ink and the description at the small step in slate')`; `it('pins the footer under a divider')`; `it('hides the panel under 1024px, the medium breakpoint written out', ...)` (every `@media (width ...)` in the file compares with `tokens.breakpoint.md.value`); `it('never moves')` (no `transition` or `animation`); `it('draws the edge CanvasText and the heading ring Highlight in forced colors')`. Import order: `side-panel.css` after `data-table.css`, the last of the batch.
- `contrast.test.js`, `describe('the side panel')`: `it('cites ink and slate on float, which the gate holds')`; `it('measures the pairs Appendix B records, in both modes')`: the title, ink on float 18.43 and 17.42; the description, slate on float 5.49 and 6.94; the footer's divider on float 1.23 and 1.34, a separator, recorded.
- Stories, `SidePanel.stories.tsx`, title `Components/SidePanel`, a `SidePanelLayout` holding Task 4's `DataTable` and a panel with a transaction's detail (a `TextField` "Payee", a `Select` "Category", a `NumberField` money "Amount"), open state in local state:
  - `Open` (tags `['viewport-desktop']`): the panel beside the table, the table at its list face or table face by its box.
  - `Closed` (tags `['viewport-desktop']`): the table alone at full width.
  - `WithFooter` (tags `['viewport-desktop']`): a footer with a secondary "Delete" and a primary "Save".
  - `TitleHidden` (tags `['viewport-desktop']`): `isTitleHidden`, the body opening with its own heading.
  - `PhoneSheet` (tags `['viewport-phone']`): play waits for `data-entering` to leave the sheet: the detail in a sheet over the list.
  - `RightToLeft` (tags `['viewport-desktop']`): `dir="rtl"` in `I18nProvider locale="fa-IR"`: the panel on the left.
  - `no-visual`: `FocusOnOpen` (tags `['no-visual', 'webkit', 'firefox']`; play opens a row by Enter and asserts focus on the heading, then presses Escape and asserts focus on the row's link), `EscapeInTableKeepsPanel`, `StickyPanel` (play scrolls the window: the panel's top stays at the offset), `CloseButtonHit` (40px).
- `RightToLeft.stories.tsx`, `SidePanelMirrored`: play asserts the panel is left of the content and the close button at the header's left.
- Docs end-to-end: `components.spec.ts`: `NO_LONG_TEXT['side-panel'] = 'under 1024px the panel is a sheet that opens on a press; the 1280px baselines pin the aside wrapping'`; `SERVER_RENDERED['side-panel'] = ['.stage .side-panel-layout', '.stage .side-panel']` (the `side-panel-basic` example is open by default, spec correction 12); in `test.describe('forced colors')`: `test('a side panel draws its edge in CanvasText')`. `docs.spec.ts`:
  - `test('a side panel sits beside the content from 1024px and becomes a sheet under it, keeping focus')` (open at 1280, focus the heading, resize to 800: a dialog titled the same holds focus; resize to 1280: the heading has focus).
  - `test('Escape in a side panel closes it and puts focus back on what opened it')`.

**Docs:**

- `side-panel.mdx`, title "Side panel", description "A detail beside the content on a wide screen and a sheet on a phone, opened and closed by your URL.", icon `PanelRight`. Sections: `## Basic` (`side-panel-basic`: `SidePanelLayout` holds the page's content and one `SidePanel`; beside the content from 1024px, pushing it, and a sheet under it; `isOpen` and `onClose` are yours, from the URL), `## With actions` (`side-panel-footer`: `footer` pinned under the body), `## Usage` (drive `isOpen` from a search parameter and close by removing it, so Back closes too; pass `key` with the open row's id, so another row is a new opening and focus moves to its heading; set `--page-sticky-top`; the aside is in the server's HTML, the sheet only after hydration, so give a phone link its own detail route if it must work without scripts (R7)), `## Props` (tables "SidePanel props", `SidePanelProps`, and "SidePanelLayout props", `SidePanelLayoutProps`, from `../../packages/react/src/side-panel/SidePanel.tsx` and `SidePanelLayout.tsx`), `## Accessibility` (a `complementary` landmark named by its title on a wide screen, a `dialog` titled by it on a phone; focus moves to the heading when it opens and back when it closes; the page stays usable around it; `<Keys rows={[['Enter', 'On a table row, opens its panel; focus moves to the panel heading.'], ['Tab Shift+Tab', 'Through the panel and out of it into the page on a wide screen; within the sheet on a phone.'], ['Escape', 'In the panel, closes it; focus returns to the row that opened it.']]} />`), `## Design rules` (dos: the detail of one row, the URL as its only state, Save and Delete in the footer; donts: never a scrim on a wide screen, never two panels, never a panel that opens without the reader asking).
- Examples: both client files; `side-panel-basic.tsx` starts open, with a small DataTable whose rows open the panel through state.
- `docs/design-system.md`, `## SidePanel`: the layout and the 24rem column, the rail's surface as the third use of one object (the rail, the drawer, the panel), its paddings, the title at the h3 step at 700, the measured pairs (ink 18.43 and 17.42 and slate 5.49 and 6.94 on float, gated; the divider 1.23 and 1.34, recorded), the sticky offset (R8), no motion, the 1024px switch after hydration and why (spec correction 17), the landmark's name (spec correction 19), focus and openings (spec correction 20), Escape, the move across the breakpoint, R7, forced colors, right to left, and the screen-reader and device checks "not yet verified".

**Steps:**

- [ ] **Step 1: Write the failing tests** listed above, stories included.
- [ ] **Step 2: Run them and watch them fail** (the commands of Task 1's Step 2, with `SidePanel` as the Storybook filter). Expected: the core run FAILS the side-panel describe and the import-order test, and passes the contrast describe; the React run FAILS to import `../src/side-panel`, and the face projects fail on the new row; the Storybook run fails to import the story file; the end-to-end run FAILS the completeness guards (`+ "side-panel"`) and the new tests.
- [ ] **Step 3: Write the two components, the CSS, the import, the stories, the examples, the page, the lists, the footer and the record.** Add the size-limit entry `import { SidePanel, SidePanelLayout } from "@snapshot-ui/react"` (`"import": "{ SidePanel, SidePanelLayout }"`) at the spec's 2 kB, measure, and set it by the rule; it pulls in Sheet and IconButton, so a limit above 2 kB is recorded with that reason. Update the face snapshot with `--project=face-utc -u`, read the new entry (the aside, no dialog), and run `--project=face-tehran` against it.
- [ ] **Step 4: Run the tests and watch them pass** (the commands of Task 1's Step 2, filter `SidePanel`). Expected: all pass: about 9 core tests, about 15 SidePanel tests, the face row in both zones, the hydration row, the server row and the empty-parts row, and the 10 stories and the mirrored check. `check-use-client` reports two more client modules.
- [ ] **Step 5: Run everything** (the Step 5 commands). Expected: every gate green; one more static page; the end-to-end run passes the page's loop tests, the two new tests and the forced-colors test; `SidePanel, SidePanelLayout` within its limit; `pnpm verify` exits 0.
- [ ] **Step 6: Commit and push**, then read the pull request's WebKit and Firefox results for `FocusOnOpen`.

```bash
git add "apps/docs/app/(home)/home-page.tsx" apps/docs/content/docs/components/meta.json apps/docs/content/docs/components/side-panel.mdx apps/docs/examples/index.ts apps/docs/examples/side-panel-basic.tsx apps/docs/examples/side-panel-footer.tsx apps/docs/tests/components.spec.ts apps/docs/tests/docs.spec.ts docs/design-system.md packages/core/README.md packages/core/src/components/side-panel.css packages/core/src/styles.css packages/core/test/contrast.test.js packages/core/test/css.test.js packages/react/.size-limit.json packages/react/README.md packages/react/src/index.ts packages/react/src/rtl/RightToLeft.stories.tsx packages/react/src/side-panel packages/react/test/__snapshots__/server-face.test.tsx.snap packages/react/test/empty-parts.test.tsx packages/react/test/hydration.test.tsx packages/react/test/server-face.test.tsx packages/react/test/server-render.test.tsx
git commit -m "feat: add SidePanel and SidePanelLayout"
git push origin feat/data-table
```

- [ ] **Step 7: Visual baselines** (owner action 2). Expected: 24 new files and no changed file: `components-sidepanel--{open,closed,with-footer,title-hidden,right-to-left}--{light-rounded,dark-rounded,light-soft,light-square}.png` and `components-sidepanel--phone-sheet--{light-rounded-375,dark-rounded-375,light-soft-375,light-square-375}.png`. What to look at: a 24rem float panel with the rail's hairline and 40px corner (16px in Soft, square in Square) 16px below the top, beside a table that has given up the room; the bold "Groceries" with its slate date and a ghost X; the fields in the body; Delete and Save under a hairline; the table alone at full width when closed; in right to left the panel on the left; the phone's sheet rising over the list with the same title. Then `git commit -m "test: add the SidePanel baselines"`.

---

### Task 6: The recipe, the guides and the release

**Goal:** show the whole Transactions page on the data table page; name the batch's parts wherever the guides list parts by what they do; write the batch's five changesets; take the bug report's versions to the release; and move charts' core requirement to 0.6 with the charts 0.1.3 patch changeset. No component, story or baseline. Closes the batch.

**Files:**

- Create: `apps/docs/examples/data-table-transactions.tsx`
- Modify: `apps/docs/content/docs/components/data-table.mdx` (`## The Transactions recipe`), `apps/docs/examples/index.ts`
- Modify: `apps/docs/content/docs/installation.mdx` (`## Charts`, `:29`; `## Next.js server components`, `:124-126`), `apps/docs/content/docs/index.mdx` (`## Status`, `:35-39`), `apps/docs/content/docs/routing.mdx` (`## What goes through it`, `:56-64`), `apps/docs/content/docs/charts/line-chart.mdx` (`:65`), `apps/docs/content/docs/charts/sparkline.mdx` (`:85`), `packages/charts/README.md` (`:11`), `.github/ISSUE_TEMPLATE/bug_report.yml` (the versions placeholder, `:23`)
- Create: `.changeset/empty-state.md`, `.changeset/skeleton.md`, `.changeset/data-table.md`, `.changeset/side-panel.md`, `.changeset/charts-core-peer.md`
- Test: `apps/docs/tests/docs.spec.ts`, `apps/docs/tests/components.spec.ts`
- No change: `CONTRIBUTING.md` (its browsers, commands and finished-component list are unchanged by this batch; checked at e928769).
- No story, no baseline: `pnpm --filter @snapshot-ui/storybook visual:docker -- --check` reports no difference.

**Interfaces:** consumes the four pages of Tasks 1 to 5 and every part they made. Produces nothing a later task uses.

**Behavior:**

1. **The Transactions recipe** (spec 13). `data-table-transactions.tsx`, a client file, reads `sort` (`date` or `amount`, a trailing `-` for descending), `page` and `open` with `useSearchParams()` inside a `Suspense` whose fallback is the same page at its first state; holds the selection in state and clears it in an effect whenever the visible rows' keys change (the page, the sort or a filter); and lays out, inside a `RouterProvider` whose `navigate` is `router.push(href, { scroll: false })` and a wrapper that sets `--page-sticky-top` to a fake 4rem header: a `FilterBar` with a category chip; a `SidePanelLayout` whose content is the `DataTable` (`sortDescriptor` from `sort`, `onSortChange` writing it with `router.replace`, `getRowHref` writing `open` on the current query, `currentKey` the open id, selection, `bulkActions`, `getGroup` only while sorted by date, `emptyState`) and a `Pagination` under it with `getPageHref`, and whose `panel` is a `SidePanel` with `key={openId}`, `isOpen={openId !== null}`, `onClose` deleting `open` with `router.replace`, and the transaction's fields. The page's text shows the server page an app writes instead: an `async` page that awaits `searchParams`, loads the rows for the sort, the page and the filters, and passes them to the client component, so the open transaction's detail is in the server's HTML there (spec correction 12).
2. `installation.mdx`, `## Charts`: "(0.5 for charts 0.1.2)" becomes "(0.6 for charts 0.1.3)".
3. `installation.mdx`, `## Next.js server components`: the static list gains "EmptyState, Skeleton" after "Card"; a new paragraph: "DataTable and SidePanel are client components. DataTable takes functions in its props, its columns, `getKey` and `getRowHref`, so render it from a client component and pass it the rows your server page loaded. A SidePanel open in the URL is in the server's HTML beside the table; on a phone it opens as a sheet once scripts run."
4. `index.mdx`, `## Status`, after the filters' line: "- The list itself, for the same page: a data table with a list face for phones, an empty state, a skeleton and a side panel."
5. `routing.mdx`, `## What goes through it`, after Pagination's line: "- [DataTable](/docs/components/data-table)'s row links, from `getRowHref`."
6. `line-chart.mdx`, `sparkline.mdx` and `packages/charts/README.md`: "(0.5 for charts 0.1.2)" becomes "(0.6 for charts 0.1.3)".
7. `bug_report.yml`'s placeholder becomes `'@snapshot-ui/react 0.6.0, @snapshot-ui/core 0.6.0, @snapshot-ui/charts 0.1.3'`.
8. **Changesets**, as below. `@snapshot-ui/charts`'s peer on `@snapshot-ui/core` is `workspace:^` (`packages/charts/package.json`), which publishes as `^0.6.0` once core is 0.6.0, and 0.1.2's published `^0.5.0` does not admit 0.6, so charts needs a release of its own.

**Changesets:**

`.changeset/empty-state.md`:

```markdown
---
'@snapshot-ui/core': minor
'@snapshot-ui/react': minor
---

Add EmptyState: what a page or a table shows where it has nothing yet. A `title` that says what is missing, a `description` that says what to do, your own Lucide `icon` drawn at 24px and hidden from assistive technology, and one `action`. The text is slate and ink, never a placeholder's taupe. `headingLevel` (2 to 4, 3 by default) fits it to your page's outline. It is static, so a server component renders it with no client JavaScript. `empty-state.css` in `styles.css`.
```

`.changeset/skeleton.md`:

```markdown
---
'@snapshot-ui/core': minor
'@snapshot-ui/react': minor
---

Add Skeleton: a still shape where content will be, so a loading page keeps its layout. A `line` the height of the text it stands for, a `block` or a `circle`, sized with `width` and `height` as CSS lengths. It pulses gently over 1.6s and stands still under reduced motion. It is hidden from assistive technology, so say "Loading" once in your own status. It is static, so a server component renders it. `skeleton.css` in `styles.css`.
```

`.changeset/data-table.md`:

```markdown
---
'@snapshot-ui/core': minor
'@snapshot-ui/react': minor
---

Add DataTable: rows of data from `items` and `columns`, where every cell and string is yours. Sorting is controlled (`sortDescriptor`, `onSortChange`, ascending then descending). A row opens through `getRowHref` as a real link stretched over the row, through your `RouterProvider`, so a middle click opens a new tab; a press never selects. Selection is controlled from your page (`selectedKeys`, `onSelectionChange` always receives the given rows' keys, never `'all'`), with a checkbox column, X and Space, and a bulk-action bar (`bulkActions`, the count through `formatCount`) stuck to the bottom of the viewport. J and K move as the arrows, Enter opens, and letters never move focus. The header sticks under your page's header: set `--page-sticky-top` to its height. `align: 'end'` sets figures, `total` adds a totals row, `hideBelow` drops a column at 48rem or 40rem of the table's own box, and under 40rem the rows become a list grouped by `getGroup`, which you pass only while sorted by date. `emptyState` takes an EmptyState, and `isLoading` draws skeleton rows and says "Loading" once. `currentKey` marks the row whose detail is open. Render it from a client component: its props are functions. React Aria announces sorts and selections in its own words. `data-table.css` in `styles.css`.
```

`.changeset/side-panel.md`:

```markdown
---
'@snapshot-ui/core': minor
'@snapshot-ui/react': minor
---

Add SidePanel and SidePanelLayout: a detail beside the content from 1024px, a complementary landmark named by its `title` that pushes the content and never covers it, and a bottom sheet under 1024px. `isOpen` and `onClose` are yours, from the URL, so Back closes it too. Focus moves to the panel's heading when it opens and back to the row that opened it when it closes; pass `key` with the open row's id so another row is a new opening. The panel is in the server's HTML when open; on a phone the sheet opens once scripts run. `footer` pins actions under the body. `side-panel.css` in `styles.css`.
```

`.changeset/charts-core-peer.md`:

```markdown
---
'@snapshot-ui/charts': patch
---

The `@snapshot-ui/core` peer now asks for `^0.6.0`, the release that draws the data table, so charts 0.1.3 needs core 0.6. A 0.x caret range accepts only its own minor: charts needs the same 0.x minor of `@snapshot-ui/core`, whose `styles.css` draws the charts.
```

**Tests, written first:**

- `docs.spec.ts`:
  - `test('the transactions recipe writes the sort, the page and the open row to the URL and reads them back after a reload')` (on `/docs/components/data-table`: sort by amount, go to page 2, open a row; the URL holds `sort=amount`, `page=2` and `open=`; reload; the table is sorted, the pager on page 2, and the panel open with its heading).
  - `test('Back closes the panel the recipe opened')`.
  - `test('the recipe clears its selection when the page changes')`.
  - `test('the recipe header sticks under its 4rem header')` (scroll: the header cells' top is 64px).
  - The existing `test('the installation page installs the charts package and names the core version it needs')` (`:2888-2905`) and `test('the chart pages name the core version charts needs')` (`:469-474`) expect `'0.6 for charts 0.1.3'`.
  - `test('the installation page names EmptyState and Skeleton among the static parts and DataTable among the client ones')` (the `## Next.js server components` section contains "EmptyState", "Skeleton", "DataTable" and "getRowHref").
  - The routing test (`:476-482`) also expects `a[href="/docs/components/data-table"]`.
- `components.spec.ts`: no new key; the recipe's example is on the data table page and inside its existing loop.

**Steps:**

- [ ] **Step 1: Write the failing tests** above.
- [ ] **Step 2: Run them and watch them fail**

```bash
source /opt/nvm/nvm.sh
pnpm turbo run build --filter=@snapshot-ui/docs
lsof -nP -iTCP:3100 -sTCP:LISTEN
pnpm --filter @snapshot-ui/docs test:e2e -- --grep "transactions recipe|recipe|installation page|chart pages name|routing page"
```

Expected: the build passes; the recipe tests FAIL (no example) and the version, installation and routing tests FAIL on the old text.

- [ ] **Step 3: Write the recipe, the page section, the guides' changes, the README line, the placeholder and the five changesets.**
- [ ] **Step 4: Run everything** (the Step 5 commands), then:

```bash
source /opt/nvm/nvm.sh
git fetch origin main
pnpm changeset status --verbose
pnpm --filter @snapshot-ui/storybook visual:docker -- --check
git ls-files apps/storybook/tests/visual/__screenshots__ | wc -l
git diff e928769 -U0 | LC_ALL=C.UTF-8 grep -nP '^\+.*[\x{2013}\x{2014}]' || true
```

Expected: every gate green; the end-to-end run passes the new and changed tests; `changeset status` plans `@snapshot-ui/core` and `@snapshot-ui/react` at 0.6.0 (minor) from the four part changesets, and `@snapshot-ui/charts` at 0.1.3 (patch) from `charts-core-peer.md`; the visual check (owner action 2) reports no difference; 1891 baselines; the dash search prints nothing (it reads only the lines the batch added, since older records in `docs/design-system.md` hold ranges written with an en dash).

- [ ] **Step 5: Commit and push**

```bash
git add .changeset/charts-core-peer.md .changeset/data-table.md .changeset/empty-state.md .changeset/side-panel.md .changeset/skeleton.md .github/ISSUE_TEMPLATE/bug_report.yml apps/docs/content/docs/charts/line-chart.mdx apps/docs/content/docs/charts/sparkline.mdx apps/docs/content/docs/components/data-table.mdx apps/docs/content/docs/index.mdx apps/docs/content/docs/installation.mdx apps/docs/content/docs/routing.mdx apps/docs/examples/data-table-transactions.tsx apps/docs/examples/index.ts apps/docs/tests/docs.spec.ts packages/charts/README.md
git commit -m "docs: add the data table recipe and guides, and require core 0.6 in charts"
git push origin feat/data-table
```

After this commit the batch is complete: four minor changesets (`empty-state.md`, `skeleton.md`, `data-table.md`, `side-panel.md`) release `@snapshot-ui/core` and `@snapshot-ui/react` 0.6.0, and `charts-core-peer.md` releases `@snapshot-ui/charts` 0.1.3 with its core peer at `^0.6.0`. They carry, for the consumer, the release note of spec 13: DataTable takes rows and column definitions, with every cell and string the app's; sort and the open row are controlled from the URL and selection from the page; a row opens through `getRowHref` and the router; set `--page-sticky-top` to the header's height; pass `getGroup` only while sorted by date; put `SidePanelLayout` around the content and the panel; render DataTable from a client component; React Aria's announcements stay English on a Persian page. The visual baselines number 1891 (1739 and the 152 of Tasks 1 to 5). The owner actions above come before the Version Packages pull request is merged.
