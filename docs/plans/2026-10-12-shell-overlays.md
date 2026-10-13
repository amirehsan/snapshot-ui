# Shell Overlays, Batch 1, Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the overlays the library's first consumer's app shell is blocked on, in build order: the `warning` and `gain` colors, the `numeral` type steps, a `warning` Badge tone and the two z-index tokens; a shared overlay layer; then Dialog, ConfirmDialog with `useConfirm()`, Drawer, Sheet (behind a spike), Popover, Menu, Toast, CommandPalette and Tooltip. Each part is a client component on react-aria-components 1.22.1, exported from `@snapshot-ui/react`, drawn by CSS in `@snapshot-ui/core`, documented on its own page, and released by its own changeset.

**Architecture:**
- **Foundations** are token and CSS changes in `packages/core`, plus two sizes on the static `Text` and one tone on the static `Badge`.
- **The shared overlay layer** is one stylesheet, `packages/core/src/components/overlay.css`, and private hooks in `packages/react/src/overlay/`: `useOverlayScope` (copies `data-theme`, `data-shape` and `data-density` from the trigger's nearest scoped ancestor onto a portaled root), `useOverlayStack` (a module-level ordered list of the open modal overlays, so one scrim paints when modals stack and the palette's shortcut can tell another modal is open), and a `mergeRefs` utility.
- **One Modal composition** (React Aria's `ModalOverlay`, `Modal`, `Dialog`) serves Dialog, ConfirmDialog, Drawer and CommandPalette. **Sheet** is built on React Aria's `Sheet` family once a spike has passed it in three engines, with the Modal composition as the fallback behind the same public API. **Popover** is the chrome Menu opens in. **Toast** wraps React Aria's `UNSTABLE_` toast parts entirely behind `toast()` and `<ToastRegion />`. **Tooltip** wraps `TooltipTrigger` and `Tooltip`.
- Every task is one reviewable deliverable: a component with its CSS, tests, stories, docs page, design record and changeset. The foundations and the shared layer are their own tasks, and the Sheet spike is its own task with pass criteria and a written fallback.

**Tech Stack:** the phase 1 stack, unchanged: pnpm 10.10, Turborepo 2.11, Node 24.5 or later, TypeScript 7 beside the TypeScript 6 API, Style Dictionary 5.6, Lightning CSS 1.33 with the browser floor Chrome 111, Safari 16.4 and Firefox 128, Stylelint 17, Tailwind CSS 4.3, React 19.3, react-aria-components 1.22.1 (react-aria 3.53.1, react-stately 3.51.0), lucide-react 1.55, tsdown, Vitest 5 with jsdom 30, Testing Library, axe-core 4.14, Storybook 10.6 with the a11y and Vitest addons, Playwright 1.64, Next.js 16.4 on Fumadocs, Changesets 3.0 and size-limit.

**Spec:** `docs/specs/2026-10-12-shell-overlays-design.md`, with the parent spec `docs/specs/2026-10-10-snapshot-ui-design.md` (sections 6.3 and 11) and the consumer's request, which the spec's section 1 answers. The design authority is `docs/design-system.md`, including Appendix B. Section numbers below are the overlay spec's unless they say otherwise.

**Source app:** the private app this library is extracted from. Its path is in the gitignored `.local/SOURCE.md`. Never open the library's `.local/` folder from a task, and never copy the app's name, its class prefix or its class names into a committed file. Everything a task needs from the source is already in the spec's section 2.

**How this plan was made:** unlike the collapsible card plan, this one carries no prototype-verified code. Each task names its files, its exact public types, its numbered behaviors, its CSS values, its tests and its docs, and the implementer writes the code under TDD. Code appears only where two good engineers would build a thing differently and one way is wrong: the overlay stack, the scope copy, `useConfirm`, the toast module, the recents store, the shortcut matcher and the palette's close-then-act sequence. Every React Aria claim a task relies on was read in 1.22.1's source before this plan was written; the file is named where it matters, so a task can check it. Test counts are "the N tests this task adds"; the totals rise by that much and the implementer records the real totals in the commit's verification.

**Branch:** `feat/shell-overlays`, stacked on `feat/collapsible-card`. Everything that branch produced exists when a task starts: `CollapsibleCard`, `packages/react/src/utils/accessible-name.ts`, the docs tests' `axeViolations` with `label-content-name-mismatch` on, the `collapsible-card` docs page in every docs loop, and 53 sources of which 19 are client modules in `packages/react/src`.

## Global Constraints

### Runtime and packaging

- Node `>=24.5`, `"packageManager": "pnpm@10.10.0"`, every package `"type": "module"`, ESM only.
- React and React DOM are peers at `^19.0.0`. `react-aria-components` and `lucide-react` are dependencies of `@snapshot-ui/react`, and `@snapshot-ui/core` is an optional peer of it. No task adds a dependency. `react-aria` and `react-stately` are never imported directly: everything comes from `react-aria-components`, which re-exports `useLocale`, `useFilter`, `I18nProvider`, `RouterProvider`, `VisuallyHidden`, `Focusable`, `Keyboard`, `Header`, `Separator`, `Text`, `Heading`, `Collection`, `OverlayArrow`, `DialogTrigger`, `MenuTrigger`, `SheetTrigger`, the `Sheet` family, the `UNSTABLE_Toast` parts and `UNSTABLE_ToastQueue`. `UNSAFE_PortalProvider` is not re-exported; the docs show it imported from `react-aria`, and the library never uses it.
- `packages/react` builds with tsdown in `unbundle` mode under `tsconfig.build.json`, which turns on `isolatedDeclarations`: every exported function, constant and hook declares its full type explicitly. A function with properties (`toast.dismiss`) is declared through an interface and built with `Object.assign` typed as that interface.
- `tsconfig.base.json` has `types: []`, so `process` is not typed in `packages/react/src`. A development warning uses a module-level `let warned = false` and `console.warn` once; it never reads `process.env`.

### React components

- Every source file that imports `react-aria-components` starts with `'use client';`. The private hooks in `packages/react/src/overlay/` carry it too, since they touch `document`. Static modules (`Text`, `Badge`, `Kbd`, `Heading`, `Eyebrow`, `Card`, `FieldCounter`, `FieldChanged`) import no React Aria and carry no directive; `packages/react/test/server-components.test.tsx` guards both and lists every static module, so a new `.tsx` in `src` is either a client module or listed there.
- Use React Aria 1.22's current compositions, named in each task. Never the alpha `SubmenuTrigger`.
- `className` and `ref` go on the element each task names. `className` takes a string, or React Aria's render function where the element is a React Aria one, and merges after the library's classes through `composeRenderProps` and `cx` from `packages/react/src/utils/cx.ts`.
- Presence checks on rendered parts use `present()` from `packages/react/src/utils/present.ts`, never `!= null`. A part given `false`, `null`, `undefined`, `true` or `''` renders nothing.
- Server safety (spec 4.5): no `Intl` formatting during render, no `window` or `document` at render or at import, no first-paint measurement, preformatted strings accepted wherever a value is shown. Module singletons (the toast queue, the overlay stack) create no DOM, so they are safe to import on the server. `localStorage` is read only through `useSyncExternalStore` with an empty server snapshot. Every client part joins `packages/react/test/server-render.test.tsx`, where it renders in Node with no window: closed, it renders nothing or its trigger.
- `jsx-a11y/no-autofocus` is on in the strict config and flags `autoFocus` on components as well as elements. The three places that need it (ConfirmDialog's buttons, CommandPalette's input) carry one `// eslint-disable-next-line jsx-a11y/no-autofocus -- <reason>` each, where the reason says initial focus inside a modal is the dialog pattern. Nowhere else.
- Every overlay root portals to `document.body` (React Aria's default) and carries the class `overlay` beside its own. For a modal the root is the panel (`Modal`), not the scrim. Every overlay root sets `dir` from `useLocale().direction` unless React Aria already does (Popover and the toast region do).

### CSS

- Component CSS lives in `packages/core/src/components/<name>.css`, inside `@layer components`, imported from `src/styles.css` in this order after `card.css`: `overlay.css`, `dialog.css`, `drawer.css`, `sheet.css`, `popover.css`, `menu.css`, `toast.css`, `command-palette.css`, `tooltip.css`. It uses only tokens: Stylelint's `snapshot-ui/token-only` rule forbids a literal color, radius or shadow, and `light-dark()`. Lengths such as `40px`, `0.75rem`, `calc(100vw - 2rem)` and `92dvh` are allowed. Class names are kebab-case and never start with a Tailwind namespace (`text-`, `bg-`, `z-`, `p-` and the rest of the list in `packages/core/stylelint.config.js`).
- **Non-token colors:** CSS system colors are the only ones allowed, and only inside `@media (forced-colors: active)`. A core test fails any other use.
- **State selectors.** States are data attributes with React Aria's names, and each also matches its native twin where one exists (`:focus-visible`, `:hover`, `:active`, `:disabled`). Hover rules sit inside `@media (hover: hover)`. A press shows the hover look, because touch has no hover.
- **The focus ring** is `outline: var(--focus-ring-width) solid var(--focus-ring-color); outline-offset: var(--focus-ring-offset);`. An inset ring (`outline-offset: calc(-1 * var(--focus-ring-width))`) is used inside a scroll container, and inverts to `var(--color-canvas)` on an ink fill. The `tabIndex="-1"` containers React Aria focuses (`Dialog`, `Popover`, `Menu`) take `outline: none`.
- **Cursor:** `pointer` on every interactive control, and `not-allowed` when disabled.
- **Motion:** every `transition` and `animation` is turned off under `@media (prefers-reduced-motion: reduce)`, in a block that comes after the rules it overrides. Core components never animate their shape. Enter and exit motion keys on React Aria's `[data-entering]` and `[data-exiting]`, which React Aria waits for through `getAnimations()`; with nothing running (reduced motion, jsdom) it mounts and unmounts at once.
- **Text a person writes** wraps at 320px with no sideways scroll (`overflow-wrap: anywhere`, `min-width: 0` on flex and grid children). Every overlay width caps against the viewport: `min(<width>, 100vw - 2rem)` or `max-width: calc(100vw - 2rem)`.
- **The z ladder (spec 4.4):** modal surfaces and their scrims at `var(--z-modal)` (1000), the toast region at `var(--z-toast)` (1100), and React Aria's positioned overlays (Popover, Menu, Tooltip) at the inline 100000 React Aria writes, which CSS cannot lower. Ties inside a layer break by DOM order.
- **Forced colors and right to left:** scrims keep `forced-color-adjust: none`; ink-filled rows become `Highlight` with `HighlightText`; disabled rows `GrayText`; borders survive because the browser redraws them in `CanvasText`. Logical properties throughout; `:dir()` is above the browser floor and is never used; where a physical side is needed the component resolves `placement` and `useLocale().direction` into a `data-side` attribute.

### Design rules

- **Theme axes:** `data-theme="light" | "dark"`, `data-shape="rounded" | "soft" | "square"`, and `data-density` (reserved for the shell spec), on any element. An overlay copies all three from the nearest scoped ancestor of its origin (spec 4.5).
- **Typography:** weights 400, 450, 500 and 700 only. 14px is the minimum for sentences, and 12px for short uppercase labels and key chips.
- **Touch targets:** every one is at least 40px. Menu rows grow to 44px under `pointer: coarse`. A control drawn smaller extends its hit area with a pseudo-element.
- **Reserved colors:** signal orange is for consent only; light signal orange is the attention cue; clay is for the Changed chip only; error means invalid or failed; success means success; taupe is for placeholders and disabled text only, with one recorded exception (the palette's placeholder is slate, Task 12). New in this plan: `warning` means a state that needs a look soon and is not a failure, never decoration, never unsaved, never consent; `gain` means money that arrived, drawn with a plus sign or a word, never the outcome of a save. State is never color alone.
- **Surfaces (spec 4.5):** every overlay sits on `--color-float`. Modal panels (Dialog, ConfirmDialog, Drawer, Sheet) take `--color-hairline`, `--radius-stadium` and `--shadow-dramatic` (the sheet casts none). Floats (Popover, Menu, CommandPalette, Toast) take `--color-frame`, `--radius-surface` and `--shadow-float`. The tooltip is ink with a transparent 1px border and `--radius-micro`. Parts step down the nested-radii ladder; buttons keep `--radius-control`.
- **Contrast records.** A new text-on-ground or edge-on-ground pair goes into `CONTRAST_PAIRS` in `packages/core/scripts/contrast.js` with a test in `packages/core/test/contrast.test.js`, and its measurement goes into the component's Appendix B section. Pairs the gate already holds are cited, not added.
- **Strings:** English defaults, every one replaceable through a prop. React Aria's own localized strings ("Notifications", its hidden "Dismiss" buttons) follow `I18nProvider`.

### Docs site

- Component pages go in `apps/docs/content/docs/components/<slug>.mdx` with the sections Basic (or the part's own first section), States, Usage, Props (one `PropsTable` per part, each with a distinct `label` when a page has several), Accessibility with a `Keys` table, and Design rules with `Rules`. Pages are titled in sentence case ("Confirm dialog", "Command palette").
- `components/meta.json` and `apps/docs/examples/index.ts` are kept alphabetical. Examples that use hooks or event handlers are client files (`'use client'`); the rest are server files, so each page shows a client component rendered by a server component.
- A new page is added to the completeness-guarded maps in `apps/docs/tests/components.spec.ts`: `LONG_TARGETS` or `NO_LONG_TEXT`, and `SERVER_RENDERED`. An overlay page goes in `NO_LONG_TEXT` with the reason that its text lives in a portal that opens on a press, and its 320px wrapping is pinned by the part's 375px stories; `SERVER_RENDERED` lists what the page draws before any script runs (the trigger, the toast status host).
- The homepage footer's Components column (`apps/docs/app/(home)/home-page.tsx`) and the component lists in `packages/core/README.md` and `packages/react/README.md` gain one link per new page, alphabetically, titled as the page is.

### Repo, commits and releases

- **The repo is public.** Never commit the source company's name, its CMS's name, any client name or the source app's class prefix. `pnpm check:public` enforces this.
- **Commits:** messages follow Conventional Commits, use the exact message each task gives, and have no body. They never mention Claude Code and never carry a Co-Authored-By line. No em dashes or emojis anywhere, in code, comments, docs or messages.
- **Before committing:** run `pnpm format`, then every gate in the task's steps. Generate visual baselines only with `pnpm --filter @snapshot-ui/storybook visual:docker`, and commit them in the task that adds or changes the stories. A visual story renders its overlay open (`defaultOpen`) and stable (no timers, no pointer interaction in its play function, because a hover look would land in the baseline); interaction goes in `no-visual` stories.
- **Tests:** every part has unit tests in vitest with `expectNoA11yViolations` (from `packages/react/test/a11y.ts`) on each state, run against `document.body` for portaled content; story play tests tagged `no-visual` for what needs layout or a timer; visual stories baselined in the five standard modes (Rounded light and dark at 1280, Soft and Square light at 1280, Rounded light at 375), 5 PNGs per visual story, named `components-<component>--<story>--<theme>-<shape>[-375].png`. Portaled content is found through `document.body` (Testing Library's `screen`, Storybook's `within(document.body)`). The Storybook a11y addon runs axe against `document.body`, so an open overlay is checked in both the `storybook` and the `storybook-dark` project.
- **Changesets:** every task that ships a public change adds or extends a changeset releasing `@snapshot-ui/core` and `@snapshot-ui/react` together as minor, named as spec 16 names them, and naming every new export so the consumer can delete its interim copies. The Changesets action versions them all together on the next release.
- **Gates, in order, in every task:** the package build (`pnpm turbo run build --filter=@snapshot-ui/core --filter=@snapshot-ui/react`), the Storybook story tests, the docs build, typecheck and lint, the docs end-to-end run, `size`, `pnpm format`, `pnpm format:check`, `pnpm verify`, then the visual Docker step. The docs end-to-end run needs port 3100 free (`lsof -nP -iTCP:3100 -sTCP:LISTEN` prints nothing); if another checkout holds it, run `DOCS_E2E_PORT=3504 pnpm --filter @snapshot-ui/docs test:e2e` after checking that port is free.

## Review Focus

The input classes or conditions the spec implies that a single component's ordinary tests would not exercise, most likely first. Each one is pinned by a test in the task named.

1. **A modal opened from inside a modal.** A ConfirmDialog opened from a Dialog, or a second Sheet over a first: one scrim paints (the second overlay's computed background is transparent), Escape closes the topmost only, the first keeps its focus state, and when the second closes focus returns into the first. Pinned in Task 4 (two stacked dialogs) and Task 8 (two sheets).
2. **The toast region under a modal.** A toast's action pressed while a dialog is open does not close the dialog, a polite toast added while a dialog is open is announced (its status host is kept out of `aria-hidden`), and the region sits above the scrim. Pinned in Task 11.
3. **Theme scope.** An overlay opened from a trigger inside a dark card is dark while the page stays light and the scrim keeps the page's opacity; an overlay opened by a keyboard shortcut from the page root copies nothing and is the root theme; a confirm opened from inside a dark dialog is dark. Pinned in Task 3 (the hook) and by the `InDarkScope` story of every part (Tasks 4 to 13).
4. **The palette's close-then-act order.** `onAction` runs after the overlay has unmounted and React Aria has restored focus, so a field that `onAction` focuses keeps focus. This only fails in a real browser. Pinned in Task 12.
5. **A 320px screen.** Every overlay fits with no sideways scroll; a dialog, drawer or sheet body taller than the viewport scrolls inside the panel while the head and the action row stay; the sheet caps at `92dvh`; the palette and the toast never widen past the viewport less 2rem. Pinned by the 375px and `LongBody`, `LongList`, `Overflowing`, `LongText` and `Narrow` stories in Tasks 4, 6, 8, 11 and 12.

## Task index

| Task | Deliverable | Commit message |
| --- | --- | --- |
| 1 | Tokens: `warning`, `gain`, `numeral`, `numeral-sm`, `z.modal`, `z.toast`; `Text` numeral sizes; contrast pairs | `feat: add the warning and gain colors, the numeral steps and the z tokens` |
| 2 | Badge `warning` tone | `feat: add the warning tone to Badge` |
| 3 | The shared overlay layer: `overlay.css`, `useOverlayScope`, `useOverlayStack`, `mergeRefs` | `feat: add the shared overlay layer` |
| 4 | Dialog, `DialogTrigger`, `DialogBody`, `DialogActions` | `feat: add Dialog` |
| 5 | ConfirmDialog and `useConfirm()` | `feat: add ConfirmDialog and useConfirm` |
| 6 | Drawer | `feat: add Drawer` |
| 7 | The Sheet spike, recorded | `docs: record the sheet spike` |
| 8 | Sheet and the WebKit story project | `feat: add Sheet` |
| 9 | Popover | `feat: add Popover` |
| 10 | Menu, `MenuTrigger`, `MenuItem`, `MenuSection`, `MenuSeparator` | `feat: add Menu` |
| 11 | Toast: `toast()`, `ToastRegion`, the exact version pin | `feat: add Toast` |
| 12 | CommandPalette | `feat: add CommandPalette` |
| 13 | Tooltip and `TooltipTrigger` | `feat: add Tooltip` |

Order is by dependency: 3 needs 1 (the z tokens); 4 needs 3; 5 needs 4; 6 needs 3; 8 needs 7 and 3; 10 needs 9; 11 needs 1 (the warning stripe) and 3; 12 needs 4's composition, 10's `MenuList` and 3's stack; 13 needs 3 and 10's shortcut chip. The shell spec that follows this plan depends on Tooltip (13), Drawer (6) and Sheet (8).

## Spec corrections

Defects found while reading the spec against react-aria-components 1.22.1, the repository and the consumer's request. Each is resolved in the task named; the ones marked **choice** are design decisions the controller should see.

1. **The toast region cannot be one element (spec 10.2).** React Aria's `UNSTABLE_ToastRegion` portals itself to `document.body` and renders nothing until the first toast (`dist/private/Toast.mjs`: `return state.visibleToasts.length > 0 && portalContainer ? createPortal(region, portalContainer) : null`), so it cannot sit inside an always-mounted wrapper. Fix (Task 11): `ToastRegion` renders two things: an always-mounted, visually hidden status host in place, `div.toast-status-host[data-react-aria-top-layer]` holding the polite `role="status"` element, and React Aria's region as the portaled `div.overlay.toast-region`, which React Aria already marks `data-react-aria-top-layer`. The modals' predicate names `.toast-region`, and `--toast-offset-block` lives on the region. **Choice:** the status element holds only the latest polite toast, keyed by its id, so with `aria-atomic="true"` a new toast never re-reads the older ones.
2. **`onExit` fires when the exit starts, not when it ends (spec 11.2).** `ModalOverlayProps.onExit` is "callback when the modal starts exiting; return a promise to indicate when the exit animation has completed". Fix (Task 12): the palette waits for the overlay to unmount through an exit sentinel, a child of `Modal` whose effect cleanup runs at unmount, after React Aria's exit animation; React Aria's `FocusScope` then restores focus in a `requestAnimationFrame` (`dist/private/focus/FocusScope.mjs` line 290), so `onAction` runs two frames later. The play test in a real browser pins it.
3. **The palette's screen-reader spike contradicts section 16 (spec 11.2 vs 16).** 11.2 asks for a VoiceOver and NVDA spike before the palette is built; 16 defers that test to "before the shell ships". An implementer cannot run a screen reader. **Choice** (Task 12): section 16 wins; the Menu path ships, the ListBox fallback is written into the docs and Appendix B at no API change, and the test is recorded as the owner's, pending. The tooltip's double reading (12.2) is already deferred by 16 and is treated the same way (Task 13).
4. **"A WebKit project joins the Storybook Playwright config" (spec 7.6, 15).** The Storybook Playwright config is the visual-regression runner, which only ever runs in the CI image and takes screenshots; story play tests run through the Vitest browser mode in `apps/storybook/vitest.config.ts`, Chromium only. Fix (Tasks 7 and 8): the spike runs a throwaway Playwright script in Chromium, WebKit and Firefox against the built Storybook; the lasting WebKit run is a third Vitest project, `storybook-webkit`, filtered to stories tagged `webkit` through the addon's `tags.include`, so only the sheet's stories run there.
5. **Forced-colors play tests (spec 15, CommandPalette and Menu).** Vitest browser mode cannot emulate `forced-colors` per story. Fix: forced-colors checks join the `forced colors` describe in `apps/docs/tests/components.spec.ts`, which already runs with `forcedColors: 'active'`, opening the part on its docs page (Tasks 4, 8, 10, 12, 13).
6. **"The rejection is not swallowed" (spec 5.4, 5.5) is untestable as an unhandled rejection.** Vitest fails a run on any unhandled rejection, and jsdom routes none to `window`. **Choice** (Task 5): on a rejected `onConfirm` the dialog clears pending, stays open and hands the error to `reportError()`, the standard "as if uncaught" path every floor browser has; the test stubs `reportError` and asserts it received the error. Nothing is logged twice and nothing is dropped.
7. **A warm tooltip "opens with no animation" (spec 4.5 motion table, 12.3).** React Aria's warm-up state is module-private (`globalWarmedUp` in `useTooltipTriggerState`), so the wrapper cannot tell a warm open from a cold one. **Choice** (Task 13): the 140ms fade runs on every open; the play test asserts "no delay within the warm window", not the absence of the fade, as spec 17 R12 already prefers.
   **Superseded in the Tooltip review:** the warm state is not private in react-stately 3.51.0. `useTooltipTriggerState` returns `shouldSkipAnimation`, and React Aria's `Tooltip` writes no `data-entering` on a tip that opens inside the warm window and no exit on the tip it replaces, so a warm swap is instant, as the 4.5 motion table asked, with nothing in the wrapper. The `WarmWindow` story asserts no delay and no `data-entering`.
8. **Spec 4.1 says the generator needs no change, and it does not**, but `test/tokens.test.js` holds an exact contract list: `--color-warning`, `--color-gain`, the eight `--text-numeral*` variables and `--z-modal`, `--z-toast` must join it or the build's own test fails (Task 1).
9. **Spec 5.1's `DialogTrigger` re-export** cannot live in `packages/react/src/index.ts`, which carries no client directive and may not import `react-aria-components` (the `check-use-client` guard fails a source that does). Fix (Task 4): `Dialog.tsx` re-exports it, and the index re-exports from there; `MenuTrigger` and `SheetTrigger` follow the same path (Tasks 10 and 8).
10. **Spec 9.2's "the library sets `shouldCloseOnSelect` true in single mode and false in multiple"** is set per item in the spec; React Aria's item reads its default from the section or menu through `MenuItemContext`, and the item itself cannot see a section's `selectionMode`. Fix (Task 10): the library's `Menu` and `MenuSection` wrappers set the default from their own `selectionMode`, and an item's own `shouldCloseOnSelect` still overrides.
11. **The palette's focus line (spec 11.3)** is "a border color change plus a 1px box-shadow". Stylelint's `snapshot-ui/token-only` rule rejects any `box-shadow` with literal lengths, even in a token color. Fix (Task 12): the line is a 2px pseudo-element over the divider in `--focus-ring-color`, the way the docs site's search field already draws it; no layout shift, and `outline: auto` returns in forced colors as the spec asks.
12. **Three API shapes are tightened, not changed.** Drawer and Sheet list their props instead of extending React Aria's `ModalOverlayProps` and `SheetOverlayProps` (spec 6.1, 7.2), because `ModalFrame` forwards a fixed set and a type should promise only what reaches React Aria; every prop the spec names is present. A shortcut is one key chip holding its space-separated keys (spec 9.3 "drawn as a key"), shared by Menu, CommandPalette and Tooltip, with `Mod` resolved to the platform's modifier after mount. The `Dialog`'s `role` is a private prop ConfirmDialog sets, so `role` stays off the public type as spec 5.1 wants.
13. **The consumer's request** (its batch 1 and its tokens table, dated 2026-10-12, which spec 1 answers) is covered: every requirement under Dialog, Drawer and Sheet, Menu and Popover, Toast, Command palette and Tooltip maps to a task, the tokens T1, T2 and T4 are Task 1 under exactly the requested names and values, the Badge tone is Task 2, and the rules (client directive, server safety, the strict content security policy with no injected script or external request, themes, shapes, `dir="rtl"`, reduced motion, WCAG 2.2 AA with 2.5.8 targets, navigation through `RouterProvider` documented in `menu.mdx`, exports from the index with CSS in `styles.css`) are Global Constraints. The one note: the request asks for "dragging optional" on the sheet, which the spec answers with a swipe that is an enhancement beside an always-present close button (Task 8). Nothing is missed. The request's last line, telling the owner when the batch is out, is the release step after Task 13 and is not a task.
14. **`--overlay-inset` is declared on the scrim as well as the panel (controller correction, found while planning the shell).** A modal's scrim (`ModalOverlay`, class `overlay-scrim`) is the panel's parent and reads `var(--overlay-inset)` for its own padding; a declaration on `.overlay` (the panel) alone never reaches it, and the scrim would have no padding. Task 3 declares it in one `.overlay, .overlay-scrim` rule. Task 4's Dialog play test asserts the scrim's computed `padding-top` is 16px, so the fix stays.

---
### Task 1: The warning and gain colors, the numeral steps and the z tokens

**Goal:** add the six tokens the consumer holds copies of, under exactly its names and values, gate the two colors on every surface, and give `Text` the two numeral sizes. Implements spec 4.1, 4.2 and 4.4, and the token half of 13.2 items 13, 14 and 15.

**Files:**
- Modify: `packages/core/tokens/tokens.json`, `packages/core/scripts/contrast.js`, `packages/core/src/components/copy.css`
- Modify: `packages/react/src/typography/Text.tsx`
- Test: `packages/core/test/tokens.test.js`, `packages/core/test/tailwind.test.js`, `packages/core/test/contrast.test.js`, `packages/core/test/css.test.js`, `packages/react/src/typography/Text.test.tsx`, `packages/react/test/server-components.test.tsx`
- Test (stories): `packages/react/src/typography/Text.stories.tsx`
- Create: `apps/docs/examples/text-numerals.tsx`
- Modify: `apps/docs/content/docs/components/typography.mdx`, `apps/docs/content/docs/theming.mdx`, `apps/docs/examples/index.ts`, `apps/docs/tests/components.spec.ts` (the `typography` row of `SERVER_RENDERED` gains `.stage .copy-numeral`)
- Modify: `docs/design-system.md`
- Create: `.changeset/foundations.md`
- Create (Docker step): 10 baselines, `apps/storybook/tests/visual/__screenshots__/components-text--numeral--*.png` and `components-text--numeral-tiles--*.png`. None changes.

**Interfaces:**
- Consumes: the token build (`packages/core/scripts/build-tokens.js`), which names `text.<name>.size` as `--text-<name>` and the other three properties as `--text-<name>--<property>`, joins every other path by dashes (`z.modal` is `--z-modal`), emits only the namespaces its `TAILWIND` table lists into `dist/tailwind.css` (`color` and `text` are listed, `z` is not), and reads a dark value from `$extensions["snapshot-ui"].theme.dark`. `cx` from `packages/react/src/utils/cx.ts`.
- Produces in `tokens.json`, under `color` directly after `success`, the two colors exactly as spec 4.1 writes them (`warning` `#8a5300` light and `#e8b04f` dark; `gain` `#2a5f46` light and `#6cc195` dark, with their `$description` lines); under `text` directly after `overline`, `numeral` (size 3.5rem, line-height 1, letter-spacing -0.03em, font-weight 500) and `numeral-sm` (size 2rem, line-height 1.1, letter-spacing -0.02em, font-weight 500) exactly as spec 4.2 writes them; and a new top-level group after `focus-ring`:

```jsonc
"z": {
  "$type": "number",
  "modal": { "$value": 1000, "$description": "Dialogs, drawers, sheets, the palette and their scrims. Below React Aria's positioned overlays, which sit at 100000 inline." },
  "toast": { "$value": 1100, "$description": "The toast region, above every modal, so an error raised from inside a dialog is not under the scrim." }
}
```

- Produces in `Text.tsx`:

```ts
export type TextSize = 'body' | 'small' | 'numeral' | 'numeral-sm';

export interface TextProps extends HTMLAttributes<HTMLElement> {
  as?: TextElement; // unchanged
  /**
   * `body` is 16px; `small` is 14px, for hints and helper lines. `numeral` is a 56px figure (44px under
   * 768px) and `numeral-sm` a 32px one, both with tabular digits and no wrapping, for an amount or a
   * count that is the point of a tile. Give a figure its sign and unit in the string; nothing is
   * formatted here.
   * @default 'body'
   */
  size?: TextSize;
  tone?: TextTone; // unchanged
  ref?: Ref<HTMLElement>;
}
```

  `Text` stays static: no directive, no React Aria. Its class is `copy`, plus `copy-small`, `copy-numeral` or `copy-numeral-sm` by size, plus `copy-muted` by tone, then `className`.
- Produces in `contrast.js`: ten entries in `CONTRAST_PAIRS`, `warning` and `gain` as `text` on each of `canvas`, `lifted`, `bone`, `float` and `raised` at `minimum: TEXT`, with `shows` strings `a warning badge or stripe on ${ground}` and `an amount that arrived on ${ground}`.
- Later tasks rely on: `--color-warning` (Task 2's badge tone, Task 11's toast stripe), `--z-modal` and `--z-toast` (Task 3's scrim and Task 11's region), and the numeral classes (the consumer's hero amounts; no task here).

**Behavior:**
1. `dist/tokens.css` declares on `:root`: `--color-warning: #8a5300;`, `--color-gain: #2a5f46;`, `--text-numeral: 3.5rem;`, `--text-numeral--line-height: 1;`, `--text-numeral--letter-spacing: -0.03em;`, `--text-numeral--font-weight: 500;`, `--text-numeral-sm: 2rem;`, `--text-numeral-sm--line-height: 1.1;`, `--text-numeral-sm--letter-spacing: -0.02em;`, `--text-numeral-sm--font-weight: 500;`, `--z-modal: 1000;`, `--z-toast: 1100;`. In `[data-theme="dark"]` and `:root:not([data-theme="light"])`: `--color-warning: #e8b04f;`, `--color-gain: #6cc195;`. No shape block mentions any of them.
2. `dist/tailwind.css` carries `--color-warning: var(--color-warning);`, `--color-gain: var(--color-gain);` and the eight `--text-numeral*` lines, so `bg-warning`, `text-gain` and `text-numeral` compile; it carries no `--z-` line.
3. `Text size="numeral"` renders `class="copy copy-numeral"`; `size="numeral-sm"` with `tone="muted"` renders `copy copy-numeral-sm copy-muted`. `body` and `small` are unchanged.
4. The numeral classes set tabular figures and `white-space: nowrap`, and each sets the four properties of its token. The large step is `2.75rem` under 768px; the small step has no media step.
5. The ten new contrast pairs pass in both themes. Their measured values (spec 4.1): light `warning` 5.58, 6.12, 5.75, 6.33, 6.33 and `gain` 6.55, 7.20, 6.76, 7.44, 7.44 on canvas, lifted, bone, float, raised; dark `warning` 9.89, 8.92, 7.86, 8.92, 7.86 and `gain` 8.92, 8.04, 7.09, 8.04, 7.09. Neither color is gated on an ink fill, where they measure 2.91 and 2.48 (light), 1.95 and 2.17 (dark).

**CSS** (`copy.css`, after `.copy-muted`, inside the layer; the media query uses the `--breakpoint-sm` value written out, as `heading.css` does):

```css
  /* A figure that is the point of a tile: tabular digits so a column of amounts lines up, and
     no wrapping, because a number that breaks is a wrong number. The phone step is measured:
     "$12,345.67" is 293px at 56px and 230px at 44px, and a 320px screen leaves 248px inside a
     20px-padded card. The width is the --breakpoint-sm token, written out because a media query
     cannot read a custom property; test/css.test.js keeps them equal. */
  .copy-numeral,
  .copy-numeral-sm {
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
  }

  .copy-numeral {
    font-size: var(--text-numeral);
    line-height: var(--text-numeral--line-height);
    letter-spacing: var(--text-numeral--letter-spacing);
    font-weight: var(--text-numeral--font-weight);
  }

  .copy-numeral-sm {
    font-size: var(--text-numeral-sm);
    line-height: var(--text-numeral-sm--line-height);
    letter-spacing: var(--text-numeral-sm--letter-spacing);
    font-weight: var(--text-numeral-sm--font-weight);
  }

  @media (width < 768px) {
    .copy-numeral {
      font-size: 2.75rem;
    }
  }
```

No forced-colors block (text only), no motion, nothing directional.

**Tests, written first:**
- `packages/core/test/tokens.test.js`, in `declares exactly the variables the components rely on, on :root`: `textStyles` gains `'numeral'` and `'numeral-sm'`, `withLetterSpacing` gains both, the color list gains `'warning'` and `'gain'` after `'success'`, and the contract gains `'--z-modal'` and `'--z-toast'` after `'--focus-ring-color'`. In `declares the light values on :root`: `expect(root).toContain('--color-warning: #8a5300;')`, `'--color-gain: #2a5f46;'`, `'--text-numeral: 3.5rem;'`, `'--text-numeral--letter-spacing: -0.03em;'`, `'--text-numeral-sm--line-height: 1.1;'`, `'--z-modal: 1000;'`, `'--z-toast: 1100;'`. In `keeps the alpha of translucent dark colors` or a new `it('gives warning and gain their dark values')`: `block('[data-theme="dark"]')` contains `'--color-warning: #e8b04f;'` and `'--color-gain: #6cc195;'`. In `remaps only the radius scale for each shape`: the existing loop already asserts no `--color-`; add `expect(shape).not.toContain('--z-')` and `not.toContain('--text-numeral')`.
- `packages/core/test/tailwind.test.js`, in `builds utilities that read the runtime tokens`: `expect(out).toMatch(/\.text-gain \{\s*color: var\(--color-gain\);/)`, `expect(out).toMatch(/\.bg-warning \{\s*background-color: var\(--color-warning\);/)`, `expect(out).toMatch(/\.text-numeral \{\s*font-size: var\(--text-numeral\);/)`; a new `it('keeps the z tokens out of the theme, which Tailwind has no namespace for')`: the built `dist/tailwind.css` does not contain `--z-`.
- `packages/core/test/contrast.test.js`: the `gates %s text on every surface` cases gain `'warning'` and `'gain'` (each must be gated on exactly `canvas`, `lifted`, `bone`, `float`, `raised` at `TEXT`); the describe `the text colors Link and Badge draw` lists the ten new `warning on <ground>` and `gain on <ground>` strings; a new `describe('the warning and gain colors')` with `it('never gates either on an ink fill')` (no pair has `text` warning or gain with `ground` ink) and `it('measures under the text minimum on an ink fill in both themes, which is why')` (compute `contrastRatio(parseColor(palette.warning), parseColor(palette.ink))` with `paletteFor(tokens, mode)` for both modes and assert each is below `TEXT`).
- `packages/core/test/css.test.js`: a new `describe('src/components/copy.css, the numerals')` after `type components`: `it('sets tabular digits and no wrapping on both sizes')` (`blockAfter(css, '.copy-numeral, .copy-numeral-sm {')` contains `font-variant-numeric: tabular-nums;` and `white-space: nowrap;`), `it.each(['numeral', 'numeral-sm'])('draws copy-%s from its own type token')` (the four `var(--text-<name>...)` declarations in `blockAfter(css, '.copy-<name> {')`), and `it('steps the large numeral to 2.75rem under the small breakpoint, written out, and leaves the small one alone')` on `dist/components/copy.css` using the same `tokens.breakpoint.sm.value` query the heading describe builds: `blockAfter(built, phone)` matches `/\.copy-numeral\s*\{\s*font-size:\s*2\.75rem;\s*\}/` and does not contain `.copy-numeral-sm`.
- `packages/react/src/typography/Text.test.tsx`: the `it.each` of size and tone gains `['numeral', 'default', 'copy copy-numeral']` and `['numeral-sm', 'muted', 'copy copy-numeral-sm copy-muted']`.
- `packages/react/test/server-components.test.tsx`: a `STATIC` row `['Text numeral', <Text as="span" size="numeral">$12,345.67</Text>, '<span class="copy copy-numeral">$12,345.67</span>']`. The `STATIC_MODULES` list is unchanged.
- Stories, `Text.stories.tsx`: `Numeral` (`args: { size: 'numeral', children: '$12,345.67' }`) and `NumeralTiles` (a `render` with a 2-column grid of two tiles, each an `Eyebrow` label over a `Text size="numeral-sm"`: "Spent" over "$4,210.00" and "Arrived" over `+$1,980.00` drawn with `style={{ color: 'var(--color-gain)' }}`, the plus sign and the word carrying the meaning). Both visual, no play function. 10 baselines.
- Docs end-to-end: the typography page's existing loops (axe light and dark, 320px and 375px, props, server rendering, now with `.stage .copy-numeral`).

**Docs:**
- `typography.mdx`: a `## Numerals` section after `## Text`: a hero amount is `size="numeral"`, 56px with tabular digits, dropping to 44px under 768px so "$12,345.67" fits a 320px screen; a tile beside others is `numeral-sm`, 32px; a numeral never wraps, so keep it to one figure; give it its sign and unit in the string, since nothing is formatted here. `<Preview name="text-numerals" />`. The Accessibility section gains: a numeral is read as the digits it shows, so the sign and the unit belong in the text, and a change line beside it says the direction in a word, never color alone. The Text props table already lists `size`.
- `text-numerals.tsx`: a server file; a grid with a hero amount and the two tiles of the story.
- `theming.mdx`, `## Tokens`: one sentence after the existing paragraph naming the groups added here: `--color-warning` and `--color-gain` (a warning state and money in, each with its rule), the `--text-numeral` and `--text-numeral-sm` steps, and `--z-modal` and `--z-toast`, which an app whose chrome uses larger numbers may override.
- `docs/design-system.md`, Appendix B: rename `## Four colors added` to `## Six colors added` and every citation of the old heading in the file (`"Four colors added"` appears in the TextField, Switch and SegmentedControl sections; replace all), then append to that section the two colors: their roles, the two measurement tables of spec 4.1 exactly, the sentence that every pair clears 4.5:1 with 5.58 the lowest, the CIE76 distances (warning to clay 21.1 and 23.1, to light signal orange 36.3 and 37.2, to error 35.6 and 44.6; gain to success 0.0 and 7.6) with the CIEDE2000 warning-to-clay 13.4 and 13.8, why warning is not light signal orange (2.53 to 2.87 on the light surfaces), and the three meaning rules. Under `## Token names`, the "Three values have no name" list gains `--z-modal` and `--z-toast` with the ladder of spec 4.4 (100000 inline for positioned overlays, 1100 toasts, 1000 modals, app chrome below). After `## Typography`, a new `## Numerals` section with the derivation of spec 4.2: the sizes, weight, tracking and line height, the measured widths (253px proportional versus 293px tabular at 56px, 230px at 44px, 248px available, "$1,234,567.89" 216px at 32px), and why `nowrap`.

**Changeset** `.changeset/foundations.md`:

```markdown
---
'@snapshot-ui/core': minor
'@snapshot-ui/react': minor
---

Add the `warning` and `gain` colors (`--color-warning`, `--color-gain`, with `bg-warning` and `text-gain` in the Tailwind theme), the `numeral` and `numeral-sm` type steps (`--text-numeral` and `--text-numeral-sm` with their line height, tracking and weight), the `--z-modal` and `--z-toast` z-index tokens, and `Text size="numeral" | "numeral-sm"`, a tabular figure that never wraps at 56px (44px under 768px) or 32px. Warning and gain are gated on every surface in both themes.
```

**Steps:**

- [ ] **Step 1: Write the failing tests** listed above, in the order listed.
- [ ] **Step 2: Run them and watch them fail**

```bash
pnpm turbo run build --filter=@snapshot-ui/core --filter=@snapshot-ui/react
pnpm --filter @snapshot-ui/core exec vitest run
pnpm --filter @snapshot-ui/react exec vitest run src/typography test/server-components.test.tsx
```

Expected: the core run FAILS in `tokens.test.js` (the contract reports the twelve new names as `missing`, and the light and dark value checks fail), `tailwind.test.js` (`text-gain` and the others are not built), `contrast.test.js` (`warning` and `gain` are gated on nothing) and `css.test.js` (every numeral block is empty). The React run FAILS the two new `Text` cases and the new `STATIC` row with the old class string `copy`.

- [ ] **Step 3: Write the tokens, the pairs, the CSS, the component, the stories, the docs, the record and the changeset** as specified above.
- [ ] **Step 4: Run the tests and watch them pass**

```bash
pnpm turbo run build --filter=@snapshot-ui/core --filter=@snapshot-ui/react
pnpm --filter @snapshot-ui/core exec vitest run
pnpm --filter @snapshot-ui/react exec vitest run
pnpm --filter @snapshot-ui/storybook exec vitest run --project=storybook --project=storybook-dark Text
```

Expected: every core file passes with the 8 tests this task adds; the React run passes with the 3 it adds; the two `Text` stories pass in both projects (4 story runs). `node packages/core/scripts/check-contrast.js` prints no failure.

- [ ] **Step 5: Run everything**

```bash
pnpm format
pnpm format:check
pnpm turbo run build lint typecheck test check:package --filter=@snapshot-ui/core --filter=@snapshot-ui/react
pnpm turbo run build test --filter=@snapshot-ui/storybook
pnpm turbo run build typecheck lint --filter=@snapshot-ui/docs
lsof -nP -iTCP:3100 -sTCP:LISTEN
pnpm --filter @snapshot-ui/docs test:e2e
pnpm --filter @snapshot-ui/react size
pnpm verify
```

Expected: `pnpm format` changes no file and `format:check` prints `All matched files use Prettier code style!`; the Turborepo runs report every task successful; the docs build lists the same number of static pages as before (no page was added); the end-to-end run passes with the typography page's new `SERVER_RENDERED` selector found; `size` shows every entry within its limit, `Text` still under 1 kB; `pnpm verify` exits 0.

- [ ] **Step 6: Visual baselines**

```bash
pnpm --filter @snapshot-ui/storybook visual:docker
git status --short apps/storybook
```

Expected: 10 new files, `components-text--numeral--{light-rounded,dark-rounded,light-soft,light-square,light-rounded-375}.png` and the same five for `components-text--numeral-tiles--`, and no changed file. What to look at: the hero amount is 56px at 1280 and 44px at 375, with aligned digits; the tiles show the plus sign and the gain color on the second.

- [ ] **Step 7: Commit**

```bash
git add .changeset/foundations.md apps/docs/content/docs/components/typography.mdx apps/docs/content/docs/theming.mdx apps/docs/examples/index.ts apps/docs/examples/text-numerals.tsx apps/docs/tests/components.spec.ts docs/design-system.md packages/core/scripts/contrast.js packages/core/src/components/copy.css packages/core/test/contrast.test.js packages/core/test/css.test.js packages/core/test/tailwind.test.js packages/core/test/tokens.test.js packages/core/tokens/tokens.json packages/react/src/typography/Text.stories.tsx packages/react/src/typography/Text.test.tsx packages/react/src/typography/Text.tsx packages/react/test/server-components.test.tsx "apps/storybook/tests/visual/__screenshots__/components-text--numeral*.png"
git commit -m "feat: add the warning and gain colors, the numeral steps and the z tokens"
```

---

### Task 2: The warning tone on Badge

**Goal:** a fifth Badge tone, `warning`, for "Watch", "Behind", "Needs review" and "Out of date". Implements spec 4.3 and 13.2 item 15's Badge half.

**Files:**
- Modify: `packages/react/src/badge/Badge.tsx`, `packages/core/src/components/badge.css`
- Test: `packages/react/src/badge/Badge.test.tsx`, `packages/core/test/css.test.js`
- Test (stories): `packages/react/src/badge/Badge.stories.tsx`
- Modify: `apps/docs/content/docs/components/badge.mdx`, `apps/docs/examples/badge-tones.tsx`
- Modify: `docs/design-system.md` (the `## Badge` section of Appendix B)
- Create: `.changeset/badge-warning.md`
- Create (Docker step): 5 baselines, `apps/storybook/tests/visual/__screenshots__/components-badge--warning--*.png`. None changes.

**Interfaces:**
- Consumes: `--color-warning` from Task 1, gated on canvas, lifted, bone, float and raised already, so no pair is added.
- Produces in `Badge.tsx`:

```ts
/**
 * What a badge means. Error means invalid or failed, success means success, and warning means a
 * state that needs a look soon and is not a failure (Watch, Behind, Needs review, Out of date), so
 * none is ever decoration, in sample content included.
 */
export type BadgeTone = 'neutral' | 'info' | 'success' | 'warning' | 'error';
```

  The `tone` JSDoc on `BadgeProps` names the fifth tone the same way. `Badge` stays static and keeps its class rule: `badge`, then `badge-<tone>` for every tone but neutral, then `className`.

**Behavior:**
1. `<Badge tone="warning">Needs review</Badge>` renders `<span class="badge badge-warning">Needs review</span>`.
2. `.badge-warning` sets only `color: var(--color-warning)`; the 1px `currentColor` border follows it. Measured as text, light then dark: canvas 5.58 / 9.89, lifted 6.12 / 8.92, float 6.33 / 8.92, raised 6.33 / 7.86, bone 5.75 / 7.86.
3. Nothing else about Badge changes; the four existing baselines are untouched.

**CSS** (`badge.css`, after `.badge-success`): `.badge-warning { color: var(--color-warning); }`. The file's header comment lists the five tones.

**Tests, written first:**
- `Badge.test.tsx`: the `it.each(['info', 'success', 'error'])` case gains `'warning'` (it asserts `badge badge-<tone>` and runs axe).
- `css.test.js`, in `describe('src/components/badge.css')`: `it('draws the warning tone in the warning color and nothing else')`: `blockAfter(css, '.badge-warning {')` equals, after `closeUp`, `color: var(--color-warning);`. The existing `is never clay or signal` test still passes.
- `Badge.stories.tsx`: `argTypes.tone.options` gains `'warning'`; `export const Warning: Story = { args: { tone: 'warning', children: 'Needs review' } }` between `Success` and `ErrorTone`. Visual, no play.
- Docs end-to-end: the badge page's existing loops.

**Docs:**
- `badge.mdx`: the front-matter description becomes "A short outlined label for a state or a count, in neutral, info, success, warning or error. Static, with no fill."; the Tones section says warning means a state that needs a look soon and is not a failure, named by the label, never decoration and never a stand-in for the attention cue; `badge-tones.tsx` gains `<Badge tone="warning">Needs review</Badge>` between the success and error badges.
- `docs/design-system.md`, `## Badge`: "**Four tones.**" becomes "**Five tones.**" and names warning as the warning color with its reason (spec 4.1: light signal orange measures under 3:1 and is already the changed edge and the eyebrow dot); the measurement table gains the row `| Warning | Warning | 5.58, 6.12, 6.33, 6.33 | 9.89, 8.92, 8.92, 7.86 |`; "All sixteen pairs are in the contrast gate already" becomes "All twenty pairs", and the sentence about Bone says warning is gated there too (5.75 and 7.86).

**Changeset** `.changeset/badge-warning.md`:

```markdown
---
'@snapshot-ui/core': minor
'@snapshot-ui/react': minor
---

Add the `warning` tone to Badge, for a state that needs a look soon and is not a failure, such as Watch, Behind, Needs review or Out of date.
```

**Steps:**

- [ ] **Step 1: Write the failing tests** listed above.
- [ ] **Step 2: Run them and watch them fail**

```bash
pnpm turbo run build --filter=@snapshot-ui/core --filter=@snapshot-ui/react
pnpm --filter @snapshot-ui/core exec vitest run test/css.test.js
pnpm --filter @snapshot-ui/react exec vitest run src/badge
```

Expected: the core run FAILS one test (`.badge-warning` has no block). The React case passes already: `Badge` renders `badge-${tone}` for any string, and Vitest does not typecheck; what the task adds there is the type, which `pnpm typecheck` in Step 5 fails on until `BadgeTone` includes `'warning'` (run `pnpm --filter @snapshot-ui/react typecheck` now to see that failure).

- [ ] **Step 3: Write the tone, the CSS, the story, the docs, the record and the changeset.**
- [ ] **Step 4: Run the tests and watch them pass**

```bash
pnpm turbo run build --filter=@snapshot-ui/core --filter=@snapshot-ui/react
pnpm --filter @snapshot-ui/core exec vitest run test/css.test.js
pnpm --filter @snapshot-ui/react exec vitest run src/badge
pnpm --filter @snapshot-ui/storybook exec vitest run --project=storybook --project=storybook-dark Badge
```

Expected: all pass, with the 1 core test and the 1 React case this task adds, and the `Warning` story in both projects.

- [ ] **Step 5: Run everything** (the same nine commands as Task 1's Step 5). Expected: every gate green; `Badge` stays under 1 kB; the docs build page count is unchanged.
- [ ] **Step 6: Visual baselines** (`pnpm --filter @snapshot-ui/storybook visual:docker`, then `git status --short apps/storybook`). Expected: 5 new `components-badge--warning--*.png`, no changed file. What to look at: a warning-colored outline and uppercase "NEEDS REVIEW", amber in dark.
- [ ] **Step 7: Commit**

```bash
git add .changeset/badge-warning.md apps/docs/content/docs/components/badge.mdx apps/docs/examples/badge-tones.tsx docs/design-system.md packages/core/src/components/badge.css packages/core/test/css.test.js packages/react/src/badge/Badge.stories.tsx packages/react/src/badge/Badge.test.tsx packages/react/src/badge/Badge.tsx "apps/storybook/tests/visual/__screenshots__/components-badge--warning--*.png"
git commit -m "feat: add the warning tone to Badge"
```

---
### Task 3: The shared overlay layer

**Goal:** the one stylesheet and the private hooks every overlay shares: the `overlay` root class that restates the page's type and declares `--overlay-inset`, the `overlay-scrim` rules, the scope copy, the modal stack that keeps one scrim when modals stack, and a `mergeRefs` utility. Implements spec 4.5 and 13.2 item 12. Nothing public is exported; Task 4 is the first consumer and its changeset names this layer.

**Files:**
- Create: `packages/core/src/components/overlay.css`
- Modify: `packages/core/src/styles.css` (import `./components/overlay.css` directly after `card.css`)
- Test: `packages/core/test/css.test.js`
- Create: `packages/react/src/overlay/useOverlayScope.ts`, `packages/react/src/overlay/useOverlayStack.ts`, `packages/react/src/utils/merge-refs.ts`
- Test: `packages/react/src/overlay/useOverlayScope.test.tsx`, `packages/react/src/overlay/useOverlayStack.test.tsx`, `packages/react/src/utils/merge-refs.test.tsx` (create)
- Modify: `docs/design-system.md` (an `## Overlays` section appended to Appendix B, after the file's last line)
- No story, no docs page, no changeset, no baseline.

**Interfaces:**
- Consumes: `--z-modal` from Task 1; the tokens `--color-ink`, `--font-sans`, `--text-body`, `--text-body--line-height`, `--text-body--font-weight`, `--color-scrim`, `--opacity-scrim`; React Aria's `--visual-viewport-height`, which `ModalOverlay` writes inline on the overlay element (`dist/private/Modal.mjs` line 150); React Aria's `[data-entering]` and `[data-exiting]`.
- Produces `packages/react/src/overlay/useOverlayScope.ts` (a client module):

```ts
'use client';

import { useLayoutEffect, type RefObject } from 'react';

/** The three attributes a scope may carry, copied in this order. */
export const SCOPE_ATTRIBUTES: readonly ['data-theme', 'data-shape', 'data-density'];

/**
 * Copies each scope attribute from the nearest ancestor of `origin` that carries it onto `root`, and
 * removes from `root` the ones no ancestor carries. An origin of null copies nothing and removes all
 * three, which is the root theme. Exported for the test; the hook is what components call.
 */
export function copyScope(root: Element, origin: Element | null | undefined): void;

/**
 * Copies the theme, shape and density scope of the element an overlay opened from onto the
 * overlay's root, in a layout effect at mount. The origin is `originRef.current` when React Aria
 * gives the overlay its trigger (Popover and Menu through `PopoverContext`, Tooltip through
 * `TooltipContext`), and otherwise `document.activeElement` at that moment: the pressed trigger
 * still holds focus during the layout effect, before React Aria's Dialog moves it in an effect.
 * An overlay root mounts when it opens, since React Aria unmounts a closed overlay, so mount is open.
 */
export function useOverlayScope(
  rootRef: RefObject<Element | null>,
  originRef?: RefObject<Element | null>,
): void;
```

- Produces `packages/react/src/overlay/useOverlayStack.ts` (a client module; the list is a module singleton that creates no DOM):

```ts
'use client';

import { useLayoutEffect, useState, type RefObject } from 'react';

/** Whether a modal overlay other than `id` is open. CommandPalette's shortcut asks this. */
export function isAnotherModalOpen(id?: string): boolean;

/** The ids of the open modal overlays, bottom-most first. For tests. */
export function openModals(): readonly string[];

/**
 * Registers a modal overlay in the module-level stack while `isOpen`, and returns whether it is the
 * bottom-most open one, which is the one that paints the scrim. While it is not, the element in
 * `scrimRef` carries `data-stacked`, set and removed straight on the element in a layout effect so
 * React never has to re-render React Aria's overlay for it. When the bottom-most closes, the next
 * becomes bottom-most and paints. `isOpen` is the overlay state's `isOpen`, not whether the overlay
 * is mounted: an exiting overlay has left the stack.
 */
export function useOverlayStack(
  id: string,
  isOpen: boolean,
  scrimRef: RefObject<HTMLElement | null>,
): boolean;
```

- Produces `packages/react/src/utils/merge-refs.ts` (no directive; it touches no DOM API):

```ts
import type { Ref, RefCallback } from 'react';

/**
 * One callback ref that feeds every ref given: an object ref is set and cleared, a callback ref is
 * called with the element and, if it returned a cleanup, that cleanup runs on detach, otherwise it is
 * called with null. Undefined refs are skipped.
 */
export function mergeRefs<T>(...refs: (Ref<T> | undefined)[]): RefCallback<T>;
```

- Produces `overlay.css` with the classes `overlay` and `overlay-scrim`, the custom property `--overlay-inset`, and the attribute `data-stacked` on a scrim.
- Later tasks rely on: every overlay root carrying `overlay`; every modal's scrim carrying `overlay-scrim`; `useOverlayScope`, `useOverlayStack`, `isAnotherModalOpen` and `mergeRefs`; `--overlay-inset` for the 16px every floating panel keeps from the viewport's edge.

**Behavior:**
1. `.overlay` and `.overlay-scrim` both declare `--overlay-inset: 1rem`, in one rule (a modal's scrim is the panel's parent and reads the inset for its own padding, so a declaration on the panel alone never reaches it; controller correction). `.overlay` restates what `base.css` gives a page: `box-sizing: border-box`, `color: var(--color-ink)`, the font family, the body size, line height and weight, and `text-align: start`. The page under an overlay never sees a library class.
2. `.overlay-scrim` is `position: fixed; inset: 0; z-index: var(--z-modal); display: grid; height: var(--visual-viewport-height, 100dvh)`, filled with Deep Well at the theme's scrim opacity through `color-mix(in srgb, var(--color-scrim) calc(var(--opacity-scrim) * 100%), transparent)`, a background color and not `opacity` so it never fades the panel with it, with `transition: background-color 180ms ease` and `forced-color-adjust: none` so Windows high contrast does not repaint it opaque.
3. A scrim that is entering, exiting or stacked (`[data-entering]`, `[data-exiting]`, `[data-stacked]`) is transparent. Reduced motion removes the transition.
4. `copyScope`: for each attribute, `origin.closest('[attr]')` decides: a value is copied, no ancestor removes the attribute. Order of attributes is `data-theme`, `data-shape`, `data-density`.
5. `useOverlayScope` runs once per mount, in a layout effect, reading `originRef.current ?? document.activeElement`. A `document.activeElement` of `document.body` (nothing focused) copies nothing.
6. `useOverlayStack`: the first registered open overlay is bottom-most; each later one is not and its scrim carries `data-stacked`; removing the bottom-most promotes the next; unmounting removes the id; two registrations of the same id (Strict Mode's double effect) leave one entry after cleanup. `isAnotherModalOpen(id)` is true while any id other than `id` is registered; with no argument it is true while anything is registered.
7. `mergeRefs(a, b)` returns a function; given an element it sets object refs and calls callback refs; given null (or on cleanup) it clears object refs, runs the cleanups callback refs returned, and calls the others with null.

**CSS**, the whole of `overlay.css`:

```css
/*
 * The layer every overlay shares. A portaled root sits outside whatever the app styled, so `overlay`
 * restates on it what base.css gives a page, and declares the 16px every floating panel keeps from
 * the viewport's edge; there is no token for it, and this is the one place it is written. The scrim
 * is Deep Well at the theme's opacity, as a background color and not `opacity`, so it never fades the
 * panel with it. One scrim paints when modals stack: every modal overlay that is not the bottom-most
 * carries data-stacked and goes transparent while it still catches presses. Derived in
 * docs/design-system.md ("Overlays").
 */
@layer components {
  /* Declared on both roots: a modal's scrim is the panel's parent and reads the inset for its own
     padding, so a declaration on the panel alone would never reach it. */
  .overlay,
  .overlay-scrim {
    --overlay-inset: 1rem;
  }

  .overlay {
    box-sizing: border-box;
    color: var(--color-ink);
    font-family: var(--font-sans);
    font-size: var(--text-body);
    line-height: var(--text-body--line-height);
    font-weight: var(--text-body--font-weight);
    text-align: start;
  }

  .overlay-scrim {
    position: fixed;
    inset: 0;
    z-index: var(--z-modal);
    display: grid;
    /* The inline value React Aria writes on the overlay for the on-screen keyboard. */
    height: var(--visual-viewport-height, 100dvh);
    background-color: color-mix(in srgb, var(--color-scrim) calc(var(--opacity-scrim) * 100%), transparent);
    transition: background-color 180ms ease;
    /* Windows high contrast would repaint the scrim opaque and hide the page. */
    forced-color-adjust: none;
  }

  .overlay-scrim:is([data-entering], [data-exiting], [data-stacked]) {
    background-color: transparent;
  }

  @media (prefers-reduced-motion: reduce) {
    .overlay-scrim {
      transition: none;
    }
  }
}
```

No forced-colors block beyond `forced-color-adjust: none` (no system color is written); nothing directional.

**Code** (the two hooks, because the registration and the attribute must be done one way):

```ts
// useOverlayStack.ts
'use client';

import { useLayoutEffect, useState, type RefObject } from 'react';

/** The open modal overlays, bottom-most first. A singleton that creates no DOM, so it imports on the server. */
const open: string[] = [];
const listeners = new Set<() => void>();

function tell(): void {
  for (const listener of listeners) listener();
}

export function isAnotherModalOpen(id?: string): boolean {
  return open.some((each) => each !== id);
}

export function openModals(): readonly string[] {
  return [...open];
}

export function useOverlayStack(
  id: string,
  isOpen: boolean,
  scrimRef: RefObject<HTMLElement | null>,
): boolean {
  const [isBottom, setBottom] = useState(true);
  useLayoutEffect(() => {
    if (!isOpen) return;
    open.push(id);
    tell();
    return () => {
      const index = open.indexOf(id);
      if (index >= 0) open.splice(index, 1);
      tell();
    };
  }, [id, isOpen]);
  useLayoutEffect(() => {
    const update = (): void => {
      setBottom(open[0] === id || !open.includes(id));
    };
    listeners.add(update);
    update();
    return () => {
      listeners.delete(update);
    };
  }, [id]);
  useLayoutEffect(() => {
    const scrim = scrimRef.current;
    if (!scrim) return;
    if (isBottom) scrim.removeAttribute('data-stacked');
    else scrim.setAttribute('data-stacked', '');
  }, [isBottom, scrimRef]);
  return isBottom;
}
```

```ts
// useOverlayScope.ts
'use client';

import { useLayoutEffect, type RefObject } from 'react';

export const SCOPE_ATTRIBUTES = ['data-theme', 'data-shape', 'data-density'] as const;

export function copyScope(root: Element, origin: Element | null | undefined): void {
  for (const name of SCOPE_ATTRIBUTES) {
    const value = origin?.closest(`[${name}]`)?.getAttribute(name);
    if (value == null) root.removeAttribute(name);
    else root.setAttribute(name, value);
  }
}

export function useOverlayScope(
  rootRef: RefObject<Element | null>,
  originRef?: RefObject<Element | null>,
): void {
  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    copyScope(root, originRef?.current ?? document.activeElement);
    // Once, at mount: an overlay root mounts when it opens.
  }, [rootRef, originRef]);
}
```

**Tests, written first:**
- `css.test.js`, a new `describe('src/components/overlay.css')`: `it('declares the overlay inset once, here, and restates the page type on every overlay root')` (`blockAfter(css, '.overlay,\n  .overlay-scrim {')` contains `--overlay-inset: 1rem;`, `blockAfter(css, '.overlay {')` contains the seven type declarations of Behavior 1, and no other file under `src/components` contains `--overlay-inset:` as a declaration, checked by looping `components`); `it('paints the scrim in Deep Well at the theme opacity as a background color, fixed at the modal layer, and keeps it translucent in forced colors')` (the `.overlay-scrim {` block contains each declaration of Behavior 2, with the exact `color-mix` string); `it('goes transparent while entering, exiting or stacked, and stops the transition under reduced motion, after it')` (the `:is(...)` block contains `background-color: transparent;`; `blockAfter(blockAfter(css, '@media (prefers-reduced-motion: reduce)'), '.overlay-scrim {')` contains `transition: none;`; the reduced-motion index is greater than the index of `transition: background-color`). In `describe('src/styles.css')`: `it('imports the overlay layer before every overlay file and after card.css')`: the index of `./components/overlay.css` is greater than `./components/card.css` and less than every later overlay import that exists (a list the later tasks extend: `dialog.css`, `drawer.css`, `sheet.css`, `popover.css`, `menu.css`, `toast.css`, `command-palette.css`, `tooltip.css`, each checked only when the file exists).
- `useOverlayScope.test.tsx` (jsdom, Testing Library): `copyScope` copies all three from the nearest ancestors (a root inside `<div data-theme="dark" data-shape="soft"><div data-density="compact"><button/></div></div>` gets all three); a nearer ancestor wins over a farther one; an attribute no ancestor carries is removed from a root that had it; a null origin removes all three; the hook, rendered in a probe component whose root is a portaled `div` and whose origin is a focused button inside a dark scope, sets `data-theme="dark"` on the root at mount; with `originRef` given, the ref wins over `document.activeElement`; with nothing focused (`document.body`) nothing is copied.
- `useOverlayStack.test.tsx`: a probe component `<Member id isOpen scrim />` that renders a `div` as its scrim and calls the hook; one open member is bottom and its scrim has no `data-stacked`; a second is not bottom and its scrim carries `data-stacked=""`; unmounting the first promotes the second (its attribute is removed and `openModals()` is `['b']`); an `isOpen={false}` member registers nothing; `isAnotherModalOpen('a')` is false with only `a` open and true once `b` opens; `isAnotherModalOpen()` is false when nothing is open; the list is empty after every member unmounts (also under `React.StrictMode`, which runs each effect twice).
- `merge-refs.test.tsx`: an object ref and a callback ref both receive the element on render and null (or their cleanup) on unmount; a callback ref that returns a cleanup has it called once on unmount and is not called with null; `undefined` entries are skipped; the returned ref is usable as a `ref` on a `div` in a render.

**Docs:** `docs/design-system.md` gains `## Overlays` at the end of Appendix B, written before any part is built, recording spec 4.5 in full: the roots and the two classes, why the type is restated, `--overlay-inset` and its 16px; the scope copy (origin from the trigger ref or `document.activeElement`, the three attributes, the panel and not the scrim, the toast region following the page root, `UNSAFE_PortalProvider` as the one escape hatch with no dependency added); direction (`dir` from `useLocale`, logical properties, `:dir()` above the floor, `data-side` where a physical side is needed); the scrim (Deep Well 0.4 and 0.65, never ink because ink is white in dark, a color not an opacity, `forced-color-adjust: none`, `--visual-viewport-height`); one scrim when modals stack; the surfaces table of 4.5 with the measurement that a dialog against the scrimmed canvas is 3.10 in light and 1.15 in dark where the hairline carries the edge, and why floats take the frame; the spacing rule (8px list popups, 24px free popovers, 32px dialogs, 24px drawers and sheets, 4px between rows); the motion table and the reduced-motion rule, with `@starting-style` named as above the floor and used only by the toast; the focus rules (which parts focus what, `FocusScope` restore, Escape closes the topmost only, `outline: none` on the `tabIndex="-1"` containers, inset rings in scrolling lists, the 5% wash under `(hover: hover)`); the width caps and the 40px and 44px targets; the forced-colors and right-to-left rules; the replaceable strings; server safety; and the z ladder of 4.4 by reference to the token names section.

**Steps:**

- [ ] **Step 1: Write the failing tests** listed above.
- [ ] **Step 2: Run them and watch them fail**

```bash
pnpm turbo run build --filter=@snapshot-ui/core --filter=@snapshot-ui/react
pnpm --filter @snapshot-ui/core exec vitest run test/css.test.js
pnpm --filter @snapshot-ui/react exec vitest run src/overlay src/utils
```

Expected: the core run FAILS the three overlay tests and the import-order test (no `overlay.css`); the React run FAILS to import the three new modules (`Cannot find module`).

- [ ] **Step 3: Write the stylesheet, the import, the hooks, the utility and the record.**
- [ ] **Step 4: Run the tests and watch them pass**

```bash
pnpm turbo run build --filter=@snapshot-ui/core --filter=@snapshot-ui/react
pnpm --filter @snapshot-ui/core exec vitest run
pnpm --filter @snapshot-ui/react exec vitest run
```

Expected: all pass, with the 4 core tests and the 3 new React test files (about 18 tests) this task adds. The React build's `check-use-client` line reports two more client modules (the hooks) and three more sources.

- [ ] **Step 5: Run everything** (the nine commands of Task 1's Step 5). Expected: every gate green; no size entry changes (nothing new is exported); the Storybook and docs runs are unchanged, since no story or page was added.
- [ ] **Step 6: Visual baselines**: none. Run `pnpm --filter @snapshot-ui/storybook visual:docker -- --check` and expect no difference, since `overlay.css` matches nothing on the page yet.
- [ ] **Step 7: Commit**

```bash
git add docs/design-system.md packages/core/src/components/overlay.css packages/core/src/styles.css packages/core/test/css.test.js packages/react/src/overlay/useOverlayScope.test.tsx packages/react/src/overlay/useOverlayScope.ts packages/react/src/overlay/useOverlayStack.test.tsx packages/react/src/overlay/useOverlayStack.ts packages/react/src/utils/merge-refs.test.tsx packages/react/src/utils/merge-refs.ts
git commit -m "feat: add the shared overlay layer"
```

---
### Task 4: Dialog

**Goal:** the modal panel: a required title, a description, an icon well with a danger tone, two widths, a scrolling body under a pinned action row, an optional close button, Escape and scrim dismissal, stacking, and the private `ModalFrame` composition that Drawer and CommandPalette reuse. Implements spec 5.1, 5.2, 5.3, the Dialog rulings of 13.1, and 13.2 item 1's Dialog half.

**Files:**
- Create: `packages/react/src/overlay/ModalFrame.tsx`, `packages/react/src/dialog/Dialog.tsx`, `packages/react/src/dialog/index.ts`
- Modify: `packages/react/src/index.ts`, `packages/react/.size-limit.json`
- Test: `packages/react/src/overlay/ModalFrame.test.tsx` (create), `packages/react/src/dialog/Dialog.test.tsx` (create), `packages/react/test/server-render.test.tsx`, `packages/react/test/empty-parts.test.tsx`
- Test (stories): `packages/react/src/dialog/Dialog.stories.tsx` (create)
- Create: `packages/core/src/components/dialog.css`
- Modify: `packages/core/src/styles.css` (import after `overlay.css`)
- Test: `packages/core/test/css.test.js`, `packages/core/test/contrast.test.js`
- Create: `apps/docs/content/docs/components/dialog.mdx`, `apps/docs/examples/dialog-basic.tsx`, `apps/docs/examples/dialog-danger.tsx`, `apps/docs/examples/dialog-long.tsx`
- Modify: `apps/docs/content/docs/components/meta.json`, `apps/docs/examples/index.ts`, `apps/docs/app/(home)/home-page.tsx`, `apps/docs/content/docs/theming.mdx`
- Test: `apps/docs/tests/components.spec.ts`, `apps/docs/tests/docs.spec.ts`
- Modify: `packages/core/README.md`, `packages/react/README.md`
- Modify: `docs/design-system.md` (a `## Dialog and ConfirmDialog` section appended to Appendix B; Task 5 appends to it)
- Create: `.changeset/overlays-dialog.md`
- Create (Docker step): 30 baselines, `apps/storybook/tests/visual/__screenshots__/components-dialog--*.png`. None changes.

**Interfaces:**
- Consumes:
  - From `react-aria-components` 1.22.1: `ModalOverlay` (props `isDismissable`, `isKeyboardDismissDisabled`, `isOpen`, `defaultOpen`, `onOpenChange`, `shouldCloseOnInteractOutside`, a render-function `className` with `{ isEntering, isExiting, state }`; it renders `data-entering` and `data-exiting`, writes `--visual-viewport-height` inline, provides `OverlayTriggerStateContext` to its children, runs `usePreventScroll` while open, which sets `overflow: hidden` on `document.documentElement`, and hides everything outside with `aria-hidden` while keeping `[data-react-aria-top-layer]` visible), `Modal` (the panel, same render props and data attributes), `Dialog` (a `section` with `role`, `tabIndex="-1"`, focused on open unless a child holds focus; its children may be a function of `{ close }`; it provides `HeadingContext` with a `title` slot at level 2 that wires `aria-labelledby`, `TextContext` with a `description` slot that wires `aria-describedby`, and `ButtonContext` with a `close` slot whose press closes), `DialogTrigger`, `Heading`, `Text`, `OverlayTriggerStateContext`, `useLocale`, `composeRenderProps`.
  - From `lucide-react`: `X`.
  - `IconButton` (its `slot` and `aria-label` pass through to React Aria's Button), `cx`, `present`, `mergeRefs`, `useOverlayScope`, `useOverlayStack` and `isAnotherModalOpen` from Task 3, and `overlay.css`.
  - Test helpers: `expectNoA11yViolations`, `root`, `tokenColor` and `washColor` from `packages/react/src/stories/paint.ts`, `visit`, `axeViolations`, `paint` and the maps in the docs tests.
- Produces `packages/react/src/overlay/ModalFrame.tsx`, private, the composition Drawer (Task 6) and CommandPalette (Task 12) reuse:

```ts
'use client';

export interface ModalFrameProps {
  /** The scrim's own class, beside `overlay-scrim`: `dialog-overlay`, `drawer-overlay`, `command-palette-overlay`. */
  overlayClass: string;
  /** The panel's own class, beside `overlay`: `dialog`, `drawer`, `command-palette`. */
  panelClass: string;
  /** Data attributes for the panel, such as `data-size`, `data-tone`, `data-side`. */
  panelAttributes?: Record<`data-${string}`, string | undefined>;
  /** Goes on the panel, merged after the library's classes. */
  className?: string | ((values: ModalRenderProps & { defaultClassName: string | undefined }) => string);
  /** Goes on the scrim, after its classes. */
  overlayClassName?: string;
  /** A ref to the panel element. */
  panelRef?: Ref<HTMLDivElement>;
  /** @default true */
  isDismissable?: boolean;
  isKeyboardDismissDisabled?: boolean;
  isOpen?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (isOpen: boolean) => void;
  /** Called when the panel has left the page, after React Aria's exit animation. Task 12 uses it. */
  onUnmount?: () => void;
  children: ReactNode;
}

/** A press outside the panel closes it unless it lands in the toast region. Every library modal passes this. */
export function isOutsideToastRegion(element: Element): boolean;

export function ModalFrame(props: ModalFrameProps): ReactElement;
```

  It renders `ModalOverlay` with `ref` to its own scrim ref, `className` `overlay-scrim <overlayClass> <overlayClassName>`, `dir` from `useLocale().direction`, `isDismissable` defaulting to true, `shouldCloseOnInteractOutside={isOutsideToastRegion}`, and the open props; inside, `Modal` with `ref={mergeRefs(panelRef, ownPanelRef)}`, `className` composed as `overlay <panelClass> <user>`, and the data attributes; inside that, a private `<FrameEffects id scrimRef rootRef onUnmount />` (renders null, reads `useContext(OverlayTriggerStateContext)?.isOpen`, calls `useOverlayStack(id, isOpen, scrimRef)` and `useOverlayScope(rootRef)`, and runs `onUnmount` from an effect cleanup), then `children`. `id` is `useId()`.
- Produces `packages/react/src/dialog/Dialog.tsx`, a client module, exported from `@snapshot-ui/react` with `DialogBody`, `DialogActions` and the re-exported `DialogTrigger`:

```ts
'use client';

export interface DialogProps extends Omit<RACDialogProps, 'className' | 'children' | 'role' | 'style'> {
  /** The title, an h2 drawn in the card title step. It names the dialog. Required. */
  title: ReactNode;
  /** A line under the title, in slate. It becomes the dialog's accessible description. */
  description?: ReactNode;
  /** A 20px icon in a 48px well above the title. */
  icon?: ReactNode;
  /**
   * `danger` tints the icon well with error, for a question that loses something. The actions are
   * the caller's: a danger dialog usually ends in a danger Button.
   * @default 'default'
   */
  tone?: 'default' | 'danger';
  /** The panel width: `md` is 28rem, `lg` is 40rem, both capped at the viewport less 2rem. @default 'md' */
  size?: 'md' | 'lg';
  /** The body, under the description. It scrolls when it is taller than the viewport allows. */
  children?: ReactNode | ((opts: { close: () => void }) => ReactNode);
  /** The action row, pinned under the body, aligned to the inline end. */
  actions?: ReactNode | ((opts: { close: () => void }) => ReactNode);
  /** A press on the scrim closes the dialog. @default true */
  isDismissable?: boolean;
  /** Escape no longer closes it. @default false */
  isKeyboardDismissDisabled?: boolean;
  /** An X in the top end corner. Escape and the scrim already close a dialog, so this is for long ones. @default false */
  hasCloseButton?: boolean;
  /** The close button's accessible name. @default 'Close' */
  closeLabel?: string;
  /** Open state, for a dialog without a DialogTrigger. Controlled and uncontrolled. */
  isOpen?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (isOpen: boolean) => void;
  /** Goes on the panel, merged after the library's classes. */
  className?: string | ((values: ModalRenderProps & { defaultClassName: string | undefined }) => string);
  /** Goes on the scrim. */
  overlayClassName?: string;
  /** A ref to the dialog element, the one React Aria focuses. */
  ref?: Ref<HTMLElement>;
}

export function Dialog(props: DialogProps): ReactElement;

export interface DialogBodyProps extends HTMLAttributes<HTMLDivElement> { ref?: Ref<HTMLDivElement> }
/** The scrolling body, for a custom layout inside a bare dialog's children. */
export function DialogBody(props: DialogBodyProps): ReactElement;

export interface DialogActionsProps extends HTMLAttributes<HTMLDivElement> { ref?: Ref<HTMLDivElement> }
/** The action row, pinned under the body, for a custom layout. */
export function DialogActions(props: DialogActionsProps): ReactElement;

export { DialogTrigger, type DialogTriggerProps } from 'react-aria-components';
```

  `role` is not a prop: a Dialog is `dialog`; Task 5's ConfirmDialog passes `role="alertdialog"` through a private prop, `role?: 'dialog' | 'alertdialog'`, that `Dialog.tsx` accepts in an internal `DialogInternalProps` type and the public `DialogProps` omits. `DialogBody` and `DialogActions` are `div.dialog-body` and `div.dialog-actions`, with `className` merged after.
- Later tasks rely on: `ModalFrame`, `isOutsideToastRegion`, the `Dialog` internals (`role`, the head, the well), `DialogActions` (Task 5), the classes `dialog-well` and `dialog-close` (Task 5's danger well), and the `Default` story's shape (the `InDarkScope` pattern every later part repeats).

**Behavior:**
1. **Markup.** `div.overlay-scrim.dialog-overlay[dir]` (`ModalOverlay`) > `div.overlay.dialog[data-size="md" | "lg"][data-tone="default" | "danger"]` (`Modal`) > `section.dialog-content[role="dialog"][tabindex="-1"]` (`RACDialog`) > in order: the close `IconButton` (`button.icon-button.dialog-close`, `slot="close"`, `aria-label={closeLabel}`, Lucide `X`) when `hasCloseButton`; `div.dialog-head` (plus the class `dialog-head-with-close` while the close button is present) holding `span.dialog-well[aria-hidden="true"]` with the icon when `icon` is present, `h2.dialog-title` (React Aria's `Heading slot="title"`), and `p.dialog-description` (React Aria's `Text slot="description"` with `elementType="p"`) when `description` is present; `div.dialog-body` with `children` when present; `div.dialog-actions` with `actions` when present. A part given nothing renders nothing.
2. **Names.** The dialog is named by the title (`aria-labelledby` points at the `h2`) and described by the description when there is one.
3. **Focus.** On open, React Aria focuses the dialog element unless a child already holds focus, so a child with `autoFocus` wins. Focus is contained. On close it returns to the trigger, or to whatever held it when a controlled dialog opened.
4. **Escape** closes unless `isKeyboardDismissDisabled`. **A press on the scrim** closes when `isDismissable` (default true). A press on an element inside `.toast-region` never closes it.
5. **The page behind:** `document.documentElement` carries `overflow: hidden` while open and loses it on close; everything outside is `aria-hidden`.
6. **Stacking.** A second modal over the first paints no scrim (its scrim is `data-stacked`); Escape closes the topmost; when it closes, the first keeps its state and focus returns into it.
7. **`close` in render functions.** `children` and `actions` as functions receive `{ close }`, which closes through the overlay state.
8. **`className`** goes on the panel after `overlay dialog`; **`overlayClassName`** on the scrim after `overlay-scrim dialog-overlay`; **`ref`** reaches the `section`.
9. **Scope.** The panel copies `data-theme`, `data-shape` and `data-density` from the trigger's nearest scoped ancestor; the scrim copies nothing.
10. **Server.** Closed, a dialog renders nothing; its `DialogTrigger` renders the trigger.

**CSS**, the whole of `dialog.css`:

```css
/*
 * Dialog and ConfirmDialog: a float panel centred on the scrim with 16px clear on every side, the
 * stadium corner, 32px of padding and the dramatic shadow. The head is one block, the body scrolls
 * and the action row stays. Derived in docs/design-system.md ("Dialog and ConfirmDialog").
 */
@layer components {
  .dialog-overlay {
    place-items: center;
    padding: var(--overlay-inset);
  }

  .dialog {
    position: relative;
    display: flex;
    flex-direction: column;
    width: min(28rem, 100%);
    max-height: 100%;
    padding: var(--spacing-separate);
    border: 1px solid var(--color-hairline);
    border-radius: var(--radius-stadium);
    background-color: var(--color-float);
    box-shadow: var(--shadow-dramatic);
    transition:
      opacity 180ms ease,
      translate 180ms ease;
  }

  .dialog[data-size='lg'] {
    width: min(40rem, 100%);
  }

  .dialog:is([data-entering], [data-exiting]) {
    opacity: 0;
    translate: 0 8px;
  }

  /* The tabIndex="-1" element React Aria focuses: no ring on the whole panel. */
  .dialog-content {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-peer);
    min-height: 0;
    outline: none;
  }

  .dialog-close {
    position: absolute;
    inset-block-start: 1.5rem;
    inset-inline-end: 1.5rem;
  }

  /* The well, the title and the description are parts of one thing. */
  .dialog-head {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-part);
  }

  .dialog-head-with-close {
    padding-inline-end: 2.5rem;
  }

  .dialog-well {
    display: grid;
    flex: none;
    place-items: center;
    width: 48px;
    height: 48px;
    border-radius: var(--radius-pill);
    background-color: var(--color-bone);
    color: var(--color-ink);
  }

  .dialog-well svg {
    width: 20px;
    height: 20px;
  }

  .dialog[data-tone='danger'] .dialog-well {
    background-color: color-mix(in srgb, var(--color-error) 14%, transparent);
    color: var(--color-error);
  }

  .dialog-title {
    margin: 0;
    font-family: var(--font-sans);
    font-size: var(--text-h3);
    line-height: var(--text-h3--line-height);
    letter-spacing: var(--text-h3--letter-spacing);
    font-weight: var(--text-h3--font-weight);
    color: var(--color-ink);
    overflow-wrap: anywhere;
  }

  .dialog-description {
    margin: 0;
    font-size: var(--text-body);
    line-height: var(--text-body--line-height);
    font-weight: var(--text-body--font-weight);
    color: var(--color-slate);
    overflow-wrap: anywhere;
  }

  .dialog-body {
    flex: 1 1 auto;
    min-height: 0;
    overflow-y: auto;
    overscroll-behavior: contain;
    overflow-wrap: anywhere;
  }

  .dialog-actions {
    display: flex;
    flex: none;
    flex-wrap: wrap;
    justify-content: flex-end;
    gap: var(--spacing-part);
  }

  /* The hairline is transparent in light; forced colors redraws it, so the panel keeps its shape. */
  @media (forced-colors: active) {
    .dialog {
      border-color: CanvasText;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .dialog {
      transition: none;
    }
  }
}
```

Right to left: `flex-end` and the logical insets follow the writing direction; nothing else is physical.

**Tests, written first:**
- `ModalFrame.test.tsx`: renders the scrim with `overlay-scrim dialog-overlay extra` and the panel with `overlay dialog extra` from `overlayClass="dialog-overlay" panelClass="dialog" overlayClassName="extra" className="extra"`; `panelAttributes` land on the panel; `panelRef` reaches the panel; `dir="rtl"` under `I18nProvider locale="ar-EG"`; `isOutsideToastRegion` is false for an element inside `.toast-region` and true otherwise; two open frames: the second's scrim carries `data-stacked`; `onUnmount` is called once after `isOpen` turns false; the panel copies `data-theme="dark"` from a focused trigger inside a dark scope; axe on `document.body` with a `Dialog` inside.
- `Dialog.test.tsx` (every query on `document.body` through `screen`): the title names the dialog and is an `h2` (`getByRole('dialog', { name: 'Rename the workspace' })` and `getByRole('heading', { level: 2 })`); the description describes it (`aria-describedby` resolves to the `p.dialog-description` text); the close button renders only with `hasCloseButton`, named `closeLabel` (default `Close`), and a press closes; `size` sets `data-size` (`md` by default); `tone` sets `data-tone` and the danger well has `data-tone="danger"` on the panel; `icon` renders `.dialog-well[aria-hidden]` only when given; `.dialog-body` and `.dialog-actions` render only when given; `className` on the panel after `overlay dialog`, `overlayClassName` on the scrim after `overlay-scrim dialog-overlay`, `ref` on the `section`; Escape closes and `isKeyboardDismissDisabled` stops it; a pointer down on the scrim closes and `isDismissable={false}` stops it; a press on a `button` inside a `div.toast-region` appended to `document.body` does not close it; controlled (`isOpen` with `onOpenChange` called with `false` on Escape) and uncontrolled (`defaultOpen`); `children` and `actions` as functions receive `close` and calling it closes; `document.documentElement.style.overflow` is `hidden` while open and `''` after; axe on the open state in the default and danger tones; `data-theme` copied from a trigger inside `<div data-theme="dark">`.
- `server-render.test.tsx`: the `CLIENT` tuple gains an optional fourth element, `excludes: string[]`, and the row `['Dialog, closed', <DialogTrigger><Button>Rename</Button><Dialog title="Rename the workspace" /></DialogTrigger>, ['<button', '>Rename<'], ['dialog-content']]`.
- `empty-parts.test.tsx`: a second table, `EMPTY_OVERLAYS`, rendered with the overlay open and queried on `document.body`: `['Dialog', <Dialog isOpen title="Rename" description="" icon={false} actions={null}>{''}</Dialog>]` finds none of `.dialog-well, .dialog-description, .dialog-body, .dialog-actions`. Later tasks add rows.
- `css.test.js`, a new `describe('src/components/dialog.css')`: the overlay centres with the inset padding; the panel's width caps (`width: min(28rem, 100%);` and the `lg` block `min(40rem, 100%)`), its fill, edge, corner and shadow are the four tokens of spec 4.5's table; the content's `outline: none;` and `min-height: 0;`; the body's three scroll declarations; the actions' `justify-content: flex-end;`; the danger well's `color-mix(in srgb, var(--color-error) 14%, transparent)`; the entering and exiting rule sets `opacity: 0;` and `translate: 0 8px;` and the reduced-motion block after it sets `transition: none;`; the forced-colors block redraws the border in `CanvasText`. Plus the import-order list from Task 3 now finds `dialog.css` after `overlay.css`.
- `contrast.test.js`, a new `describe('the dialog')`: `it('cites ink on bone and slate on float, which the gate already holds, for the well and the description')` (both pairs are in `CONTRAST_PAIRS` at `TEXT`); `it('measures the error icon on the 14% error well over float above the 3:1 a graphic needs in both themes, recorded and not gated')` (compose the well as `composite({ ...parseColor(error), a: 0.14 }, parseColor(float))` per mode and assert `contrastRatio(error, well) >= NON_TEXT`; expect about 5.88 light and 4.72 dark).
- Stories, `Dialog.stories.tsx`, title `Components/Dialog`, every story rendering `DialogTrigger` with a `Button` and the dialog `defaultOpen`:
  - `Default` (visual): icon (Lucide `Pencil`), title "Rename the workspace", description, a one-field body (`TextField`) and one primary action. Play: the scrim's computed `padding-top` is `16px` (the inset reaches the scrim, header correction 14); the dialog is named by the title, `data-size="md"`.
  - `Danger` (visual): `tone="danger"`, the `TriangleAlert` icon, a danger `Button` after a tertiary Cancel in `actions`. Play: the well has the error color (`tokenColor('--color-error')` against the well's computed `color`).
  - `LongBody` (visual): twenty paragraphs. Play: the body's `scrollHeight` exceeds its `clientHeight`, the actions row's bottom is within the viewport, the panel's bottom is at most `innerHeight - 16`.
  - `Large` (visual): `size="lg"`. Play: the panel is 640px wide at 1280.
  - `WithCloseButton` (visual): `hasCloseButton`. Play: a button named Close is in the top end corner (its right edge within 24px of the panel's right edge).
  - `InDarkScope` (visual): the trigger inside a `Card` wrapped in `<div data-theme="dark">`; the page light. Play: `.dialog` has `data-theme="dark"`, `.dialog-overlay` has no `data-theme`, the panel's computed background is `tokenColor('--color-float', darkScope)`.
  - `FocusAndRestore` (`no-visual`): starts closed; play opens by keyboard (Tab to the trigger, Enter), expects focus on the dialog element, Tab moves to the first control and cycles back, Escape closes and focus returns to the trigger.
  - `Stacked` (`no-visual`): a dialog whose body holds a second `DialogTrigger` and `Dialog`, the outer `defaultOpen`; play opens the inner, expects two dialogs, the second overlay's computed `backgroundColor` to be `rgba(0, 0, 0, 0)`, Escape to close only the inner (one dialog left, focus back on the inner trigger), the outer scrim's computed background to be the scrim color (parse the alpha: about 0.4 light, 0.65 dark).
  - `ScrollsAt375` (`no-visual`): the long body in a 375px-wide wrapper; play asserts no sideways scroll (`document.documentElement.scrollWidth <= innerWidth`) and the actions visible.
- Docs end-to-end, `docs.spec.ts`: `test('the dialog page opens its dialog, holds focus, locks the page and gives focus back')`: click "Rename the workspace" (the basic example's trigger), expect the dialog visible and named, `html` to have `overflow: hidden`, Tab from the last control to land back inside, Escape to close it and focus the trigger. `components.spec.ts`, in the `forced colors` describe: `test('a dialog keeps a translucent scrim and a drawn edge')`: open it, read `paint(page.locator('.dialog-overlay'))`: the fill's alpha is below 1; `paint(page.locator('.dialog'))`'s edge is the CanvasText probe color (probe as the link test does, with `CanvasText`). `components.spec.ts` maps: `'dialog'` in `NO_LONG_TEXT` ("its text is in a portal that opens on a press; the 375px stories pin its wrapping") and `SERVER_RENDERED: ['.stage .button']`.

**Docs:**
- `dialog.mdx`, title "Dialog", description "A modal panel on the scrim with a title, a description, an optional icon well and a pinned action row. Escape and a press on the scrim close it.", icon `MessageSquare`. Sections: `## Basic` (the parts, with `<Preview name="dialog-basic" />`), `## Danger` (the tone tints the well with error and the caller ends the row with a danger Button, `dialog-danger`), `## Long content` (the body scrolls, the head and the actions stay, the close button is opt-in, `dialog-long`), `## Usage` (open from `DialogTrigger` or control with `isOpen`; `children` and `actions` may be functions of `close`; a confirm opened from a dialog stacks and one scrim paints; the native top layer is not used, overlays are ordered by `--z-modal` 1000 and `--z-toast` 1100 which an app with larger chrome numbers overrides, and a third-party overlay at a very large z-index can cover a dialog; if the confirmed action removes the trigger, place focus yourself), `## Props` (one `PropsTable` for `Pick<DialogProps, 'title' | 'description' | 'icon' | 'tone' | 'size' | 'children' | 'actions' | 'isDismissable' | 'isKeyboardDismissDisabled' | 'hasCloseButton' | 'closeLabel' | 'isOpen' | 'defaultOpen' | 'onOpenChange' | 'className' | 'overlayClassName'>`), `## Accessibility` (named by its title, described by its description; focus moves in, is contained and returns; the page behind is hidden from assistive technology and does not scroll; `<Keys rows={[['Tab', 'Cycles through the controls inside.'], ['Escape', 'Closes the dialog.'], ['Enter Space', 'Press a button.']]} />`), `## Design rules` (dos: title the dialog with what it does, put the primary action last, keep the body to one task; donts: never open a dialog on page load, never stack more than a confirm over a dialog, never hide the only way out behind a disabled button).
- Examples: `dialog-basic.tsx` (server file: `DialogTrigger` with a `Button` "Rename the workspace", the dialog with the `Pencil` icon, title, description, a `TextField` body and a primary action), `dialog-danger.tsx` (server file: danger tone with `TriangleAlert`, Cancel and a danger Button), `dialog-long.tsx` (server file: `hasCloseButton`, `size="lg"`, a long body).
- `theming.mdx`: a `## Overlays` section after `## Nesting`: a portaled overlay (dialog, menu, tooltip, toast) copies `data-theme`, `data-shape` and `data-density` from the nearest scoped ancestor of the element it opened from, so a dialog opened from a dark card is dark while the page stays light; an overlay opened by a keyboard shortcut copies from the focused element; for anything that cannot reach, React Aria's `UNSAFE_PortalProvider` from `react-aria` with a container inside the scope (a six-line snippet); the two z variables.
- `meta.json`: `"dialog"` after `"collapsible-card"`. `examples/index.ts`: the three imports and keys, alphabetical. The homepage footer and both READMEs: a "Dialog" link after Collapsible card.
- `docs/design-system.md`, `## Dialog and ConfirmDialog` appended: what the source dialog was (spec 2) and what changed (float instead of lifted, the `h2`, the close button opt-in, motion added, stacking allowed); the measured head: ink on bone 16.76 light and 15.36 dark, error on the 14% error well 5.88 and 4.72 (over 3:1, recorded, not gated because the wash is not a token), slate on float 5.49 and 6.94; the panel against the scrimmed canvas 3.10 and 1.15 and why the hairline carries the edge; the widths and caps; 32px padding; the stadium corner and the parts a step down; the 180ms fade and 8px rise; what React Aria gives (focus, `aria-hidden`, scroll lock); the toast-region predicate.

**Changeset** `.changeset/overlays-dialog.md` (Task 5 appends a sentence):

```markdown
---
'@snapshot-ui/core': minor
'@snapshot-ui/react': minor
---

Add Dialog, a modal panel on React Aria's Modal and Dialog: a required title, a description, an icon well with a danger tone, `md` and `lg` widths, a scrolling body under a pinned action row, an optional close button, and Escape and scrim dismissal. `DialogTrigger` is re-exported, and `DialogBody` and `DialogActions` are the parts for a custom layout. The shared overlay layer ships with it: every overlay copies its theme, shape and density from what it opened from, one scrim paints when modals stack, and `--z-modal` and `--z-toast` order the layers.
```

**Steps:**

- [ ] **Step 1: Write the failing tests** listed above, stories included.
- [ ] **Step 2: Run them and watch them fail**

```bash
pnpm turbo run build --filter=@snapshot-ui/core --filter=@snapshot-ui/react
pnpm --filter @snapshot-ui/core exec vitest run test/css.test.js test/contrast.test.js
pnpm --filter @snapshot-ui/react exec vitest run
pnpm --filter @snapshot-ui/storybook exec vitest run --project=storybook --project=storybook-dark Dialog
pnpm turbo run build --filter=@snapshot-ui/docs
lsof -nP -iTCP:3100 -sTCP:LISTEN
pnpm --filter @snapshot-ui/docs test:e2e
```

Expected: the core run FAILS every dialog CSS test (no file) and the dialog contrast describe passes (it measures tokens); the React run FAILS to import `./Dialog` and `../src/dialog`; the Storybook run, narrowed to `Dialog` because Vite's overlay for a missing module breaks the stories beside it, FAILS to import the story file; the docs build fails on the missing `dialog-basic` example or passes with the page absent, and the end-to-end run FAILS the two completeness guards (`+ "dialog"`) and the new dialog tests.

- [ ] **Step 3: Write `ModalFrame`, `Dialog`, the CSS, the stories, the examples, the page, the record and the changeset.** Add the size-limit entry last: add `{ "name": "import { Dialog } from \"@snapshot-ui/react\"", "path": "dist/index.js", "import": "{ Dialog }", "ignore": ["react", "react-dom", "react-aria-components", "lucide-react"], "limit": "4 kB" }` after the `Card` entry, run `pnpm --filter @snapshot-ui/react size`, read the measured size, and set `limit` by the plan's rule: round up to the next half kilobyte, then add half a kilobyte.
- [ ] **Step 4: Run the tests and watch them pass**

```bash
pnpm turbo run build --filter=@snapshot-ui/core --filter=@snapshot-ui/react
pnpm --filter @snapshot-ui/core exec vitest run
pnpm --filter @snapshot-ui/react exec vitest run
pnpm --filter @snapshot-ui/storybook exec vitest run --project=storybook --project=storybook-dark Dialog
```

Expected: all pass: the 11 core tests, the ModalFrame file (about 9 tests) and the Dialog file (about 24 tests) plus the two shared rows, and the 9 stories in both projects (18 runs). The build's `check-use-client` line counts two more client modules (`ModalFrame`, `Dialog`) and three more sources.

- [ ] **Step 5: Run everything** (the nine commands of Task 1's Step 5). Expected: every gate green; the docs build lists one more static page; the end-to-end run passes with the dialog page's 4 loop tests, the new dialog test in `docs.spec.ts` and the forced-colors test; `size` shows `Dialog` within its limit and every other entry unchanged; `pnpm verify` exits 0.
- [ ] **Step 6: Visual baselines** (`pnpm --filter @snapshot-ui/storybook visual:docker`, then `git status --short apps/storybook`). Expected: 30 new files, the six visual stories (`default`, `danger`, `long-body`, `large`, `with-close-button`, `in-dark-scope`) in the five modes, and no changed file. What to look at: a white panel with 40px corners centred on a dimmed page (16px clear at 375); the danger well tinted red with the red triangle; the long body scrolling with the action row pinned and the X in the corner; the large panel 640px; the dark-scope dialog dark on a light page with the scrim the page's opacity.
- [ ] **Step 7: Commit**

```bash
git add .changeset/overlays-dialog.md "apps/docs/app/(home)/home-page.tsx" apps/docs/content/docs/components/dialog.mdx apps/docs/content/docs/components/meta.json apps/docs/content/docs/theming.mdx apps/docs/examples/dialog-basic.tsx apps/docs/examples/dialog-danger.tsx apps/docs/examples/dialog-long.tsx apps/docs/examples/index.ts apps/docs/tests/components.spec.ts apps/docs/tests/docs.spec.ts docs/design-system.md packages/core/README.md packages/core/src/components/dialog.css packages/core/src/styles.css packages/core/test/contrast.test.js packages/core/test/css.test.js packages/react/.size-limit.json packages/react/README.md packages/react/src/dialog/Dialog.stories.tsx packages/react/src/dialog/Dialog.test.tsx packages/react/src/dialog/Dialog.tsx packages/react/src/dialog/index.ts packages/react/src/index.ts packages/react/src/overlay/ModalFrame.test.tsx packages/react/src/overlay/ModalFrame.tsx packages/react/test/empty-parts.test.tsx packages/react/test/server-render.test.tsx "apps/storybook/tests/visual/__screenshots__/components-dialog--*.png"
git commit -m "feat: add Dialog"
```

---
### Task 5: ConfirmDialog and useConfirm

**Goal:** the alert dialog that asks one question and resolves `true` only when the confirm button is pressed, with a required tone, a pending state, and the promise-returning `useConfirm()` hook. Implements spec 5.4, 5.5, 5.6, the ConfirmDialog rulings of 13.1, and 13.2 items 1 to 4. `tone` is required, with no default (controller ruling).

**Files:**
- Create: `packages/react/src/dialog/ConfirmDialog.tsx`, `packages/react/src/dialog/useConfirm.tsx`
- Modify: `packages/react/src/dialog/Dialog.tsx` (the private `role` prop), `packages/react/src/dialog/index.ts`, `packages/react/src/index.ts`, `packages/react/.size-limit.json`
- Test: `packages/react/src/dialog/ConfirmDialog.test.tsx`, `packages/react/src/dialog/useConfirm.test.tsx` (create), `packages/react/test/server-render.test.tsx`
- Test (stories): `packages/react/src/dialog/ConfirmDialog.stories.tsx` (create)
- Create: `apps/docs/content/docs/components/confirm-dialog.mdx`, `apps/docs/examples/confirm-dialog-basic.tsx`, `apps/docs/examples/confirm-dialog-danger.tsx`, `apps/docs/examples/confirm-dialog-hook.tsx`
- Modify: `apps/docs/content/docs/components/meta.json`, `apps/docs/examples/index.ts`, `apps/docs/app/(home)/home-page.tsx`
- Test: `apps/docs/tests/components.spec.ts`, `apps/docs/tests/docs.spec.ts`
- Modify: `packages/core/README.md`, `packages/react/README.md`
- Modify: `docs/design-system.md` (the `## Dialog and ConfirmDialog` section gains its ConfirmDialog half)
- Modify: `.changeset/overlays-dialog.md`
- Create (Docker step): 15 baselines, `apps/storybook/tests/visual/__screenshots__/components-confirmdialog--*.png`. None changes.
- No new CSS: ConfirmDialog draws with `dialog.css`.

**Interfaces:**
- Consumes: `Dialog` and `DialogProps` from Task 4, including its private `role` prop (`'dialog' | 'alertdialog'`, internal, omitted from the public `DialogProps`); `Button` (its `isPending`, which renders `data-pending`, keeps the label in the tree under the spinner, and ignores presses; `isDisabled`; `autoFocus`, which React Aria's `useFocusable` honors on mount); `IconButton`; Lucide `TriangleAlert`; `present`.
- Produces `ConfirmDialog.tsx`, a client module:

```ts
'use client';

export interface ConfirmDialogProps
  extends Omit<DialogProps, 'actions' | 'children' | 'hasCloseButton' | 'closeLabel' | 'description'> {
  /** What the question does, under the title. Required: an alert dialog is described by it. */
  description: ReactNode;
  /** The confirm button's label. It names the outcome, "Delete 3 transactions", never "OK". Required. */
  confirmLabel: string;
  /** The cancel button's label. @default 'Cancel' */
  cancelLabel?: string;
  /**
   * `danger` draws the error icon well and the danger Button, for a question that loses something.
   * `default` draws no well unless `icon` is given, and a primary Button.
   * Required, with no default: a destructive question drawn as a harmless one is the costly mistake,
   * and a harmless one drawn as destructive teaches people to ignore the warning, so the caller chooses.
   */
  tone: 'default' | 'danger';
  /** The well's icon. In the danger tone it is Lucide's TriangleAlert unless given. */
  icon?: ReactNode;
  /**
   * Called when the confirm button is pressed. If it returns a promise, the dialog is pending until it
   * settles: it closes when the promise resolves, and stays open, no longer pending, when it rejects.
   * The rejection is reported through `reportError`, as if uncaught, never swallowed.
   */
  onConfirm?: () => void | Promise<void>;
  /** Called on every other way out: Cancel, Escape, a scrim press. */
  onCancel?: () => void;
  /**
   * Pending from outside: the confirm button shows Button's pending state, Cancel is disabled, and
   * Escape and the scrim are ignored, so a half-finished action cannot be abandoned.
   */
  isPending?: boolean;
}

export function ConfirmDialog(props: ConfirmDialogProps): ReactElement;
```

- Produces `useConfirm.tsx`, a client module:

```ts
'use client';

export type ConfirmOptions = Omit<
  ConfirmDialogProps,
  'isOpen' | 'defaultOpen' | 'onOpenChange' | 'onConfirm' | 'onCancel' | 'isPending'
>;

export interface ConfirmHandle {
  /** Opens the dialog and resolves `true` only when the confirm button is pressed. */
  confirm: (options: ConfirmOptions) => Promise<boolean>;
  /** The dialog element. Render it once in the component that calls `confirm`. `null` until the first call. */
  dialog: ReactElement | null;
}

export function useConfirm(): ConfirmHandle;
```

- Later tasks rely on: nothing. The shell spec and the consumer rely on `useConfirm` for per-row removals.

**Behavior:**
1. **It is a Dialog** with `role="alertdialog"`: React Aria points `aria-labelledby` at the title and `aria-describedby` at the required description. The `tone`, `icon`, `size`, `isDismissable`, `isKeyboardDismissDisabled`, `isOpen`, `defaultOpen`, `onOpenChange`, `className`, `overlayClassName` and `ref` props pass to Dialog. There is no close button and no `children`.
2. **Actions.** Cancel (`Button variant="tertiary"`, label `cancelLabel`, default "Cancel") then Confirm (`Button variant="primary"` in the default tone, `variant="danger"` in danger, label `confirmLabel`), in that DOM order, inside Dialog's action row.
3. **The well.** In the danger tone the well shows Lucide's `TriangleAlert` unless `icon` is given; in the default tone it shows only when `icon` is given.
4. **Initial focus.** `autoFocus` on Cancel in the danger tone and on Confirm in the default tone. React Aria's Dialog then leaves focus where it is.
5. **Every non-confirm exit is a cancel.** Escape, a scrim press and Cancel each call `onCancel` exactly once and close. `isDismissable={false}` keeps the scrim press out; Escape stays unless `isKeyboardDismissDisabled`. The component tells a confirm close from a cancel close with a ref set before the confirm close, read and reset in its `onOpenChange` wrapper, so a confirm never calls `onCancel`.
6. **Confirm.** Calls `onConfirm`. A non-promise return closes. A promise makes the dialog pending: Confirm takes `isPending` (its label stays in the accessibility tree under the spinner), Cancel takes `isDisabled`, the scrim press and Escape are off for the duration (`isDismissable={false}` and `isKeyboardDismissDisabled` passed down while pending); on resolve the dialog closes; on reject it stays open, pending clears, and the error goes to `reportError(error)` (when `typeof reportError === 'function'`; otherwise it is re-thrown in a `queueMicrotask`).
7. **`isPending`** from outside does the same as Behavior 6's pending state, for a controlled caller, and nothing closes until the caller says so.
8. **Controlled and uncontrolled** like Dialog: a controlled caller receives `onOpenChange(false)` after the confirm resolves, as for any dismissal.
9. **`useConfirm`:** `dialog` is `null` until the first `confirm`; `confirm(options)` renders `<ConfirmDialog {...options} isOpen onOpenChange onConfirm onCancel />` and returns a promise; the confirm press resolves `true` and closes; Escape, the scrim, Cancel resolve `false`; a second `confirm` while one is open resolves the open one `false` and shows the new question; unmounting the caller resolves a pending question `false`. The hook offers no pending state: a pending action belongs to the caller's UI after the promise, and a caller that wants the dialog itself pending renders `ConfirmDialog` directly.
10. **A removed trigger.** If the confirmed action unmounts the trigger, focus has nowhere to return; the docs show the caller placing it on a list row.
11. **Server.** Closed, a ConfirmDialog renders nothing; `useConfirm` renders `null` before its first call.

**CSS:** none. The danger well and the action row are `dialog.css`'s.

**Code** (`useConfirm`, because the resolver must be owned one way):

```tsx
'use client';

import { useCallback, useEffect, useRef, useState, type ReactElement } from 'react';
import { ConfirmDialog, type ConfirmDialogProps } from './ConfirmDialog';

export type ConfirmOptions = Omit<
  ConfirmDialogProps,
  'isOpen' | 'defaultOpen' | 'onOpenChange' | 'onConfirm' | 'onCancel' | 'isPending'
>;

export interface ConfirmHandle {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
  dialog: ReactElement | null;
}

interface Question {
  options: ConfirmOptions;
  resolve: (answer: boolean) => void;
}

export function useConfirm(): ConfirmHandle {
  const [question, setQuestion] = useState<Question | null>(null);
  // The open question, readable from callbacks without a render: a second `confirm` must answer the
  // first `false` before it is replaced, and unmounting must answer whatever is still open.
  const pending = useRef<Question | null>(null);

  const settle = useCallback((answer: boolean): void => {
    const open = pending.current;
    if (!open) return;
    pending.current = null;
    setQuestion(null);
    open.resolve(answer);
  }, []);

  const confirm = useCallback(
    (options: ConfirmOptions): Promise<boolean> =>
      new Promise<boolean>((resolve) => {
        pending.current?.resolve(false);
        const next = { options, resolve };
        pending.current = next;
        setQuestion(next);
      }),
    [],
  );

  useEffect(
    () => () => {
      pending.current?.resolve(false);
      pending.current = null;
    },
    [],
  );

  const dialog =
    question === null ? null : (
      <ConfirmDialog
        {...question.options}
        isOpen
        onOpenChange={(isOpen) => {
          if (!isOpen) settle(false);
        }}
        onConfirm={() => {
          settle(true);
        }}
        onCancel={() => {
          settle(false);
        }}
      />
    );

  return { confirm, dialog };
}
```

`settle` is idempotent, because a confirm press reaches it through `onConfirm` and then through `onOpenChange(false)`.

**Tests, written first:**
- `ConfirmDialog.test.tsx` (queries on `document.body`): `role="alertdialog"` named by the title and `aria-describedby` resolving to the description; Cancel is first in DOM order and Confirm second, with `confirmLabel` and the default "Cancel", and `cancelLabel` replaces it; the danger tone renders `button.button-danger` and a well with an `svg.lucide-triangle-alert`, the default tone `button.button-primary` and no well; `icon` replaces the danger well's icon and adds a well in the default tone; Escape, a scrim pointer down and a Cancel press each call `onCancel` once and close, and `onConfirm` is not called; Confirm calls `onConfirm` once, closes, and `onCancel` is not called; `isDismissable={false}` keeps the scrim press from closing or cancelling; a promise from `onConfirm` sets pending (Confirm has `data-pending` and its label is still in the tree, Cancel is `disabled`, Escape does nothing) and resolving closes; rejecting keeps it open, clears pending, and `reportError` (stubbed with `vi.stubGlobal('reportError', vi.fn())`) is called once with the error; `isPending` renders the same state and never closes on its own; a controlled dialog receives `onOpenChange(false)` once after a confirm resolves; axe on the open state in both tones; the `autoFocus` is on Cancel in danger and Confirm in default (`document.activeElement` after render, which jsdom honours).
- `useConfirm.test.tsx` (a probe component that calls the hook and renders `dialog` beside a button that calls `confirm`): `dialog` is `null` before the first call; a call opens an alert dialog with the options; a confirm press resolves `true`; Escape, the scrim and Cancel each resolve `false`; a second call while open resolves the first `false` and shows the second's title; unmounting the probe resolves a pending call `false`; the dialog is `null` again after an answer.
- `server-render.test.tsx`: `['ConfirmDialog, closed', <DialogTrigger><Button>Delete</Button><ConfirmDialog title="Delete these?" description="They go for good." confirmLabel="Delete 3 transactions" tone="danger" /></DialogTrigger>, ['<button', '>Delete<'], ['alertdialog']]`.
- Stories, `ConfirmDialog.stories.tsx`, title `Components/ConfirmDialog`, each with a `DialogTrigger` and `defaultOpen`:
  - `Danger` (visual): title "Delete these transactions?", description, `confirmLabel="Delete 3 transactions"`, `tone="danger"`. Play: `document.activeElement` is the Cancel button; the confirm button is `button-danger`.
  - `Default` (visual): "Send the invoice now?", `tone="default"`, `confirmLabel="Send invoice"`. Play: focus on Confirm; no well.
  - `Pending` (visual): `tone="danger" isPending`. Play: Confirm has `data-pending`, Cancel is disabled, Escape leaves it open.
  - `FromADialog` (`no-visual`): a Dialog `defaultOpen` whose action row holds a `DialogTrigger` with a danger ConfirmDialog; play opens the confirm by keyboard, expects two dialogs, the confirm's scrim transparent, focus on Cancel, Escape to close only the confirm and return focus to its trigger inside the dialog, which stays open.
  - `HookFlow` (`no-visual`): a list of three rows each with a Delete button calling `confirm`; play presses the second row's Delete, expects the alert dialog, presses Cancel, expects three rows and focus back on that Delete; presses Delete again and then the confirm button, expects two rows and focus on the next row's Delete, placed by the caller.
- Docs end-to-end, `docs.spec.ts`: `test('the confirm dialog page asks, cancels, confirms and places focus')`: on the hook example, Delete on a row, Cancel keeps the row and focus; Delete then the confirm button removes the row and focus lands on the next row's Delete. `components.spec.ts` maps: `'confirm-dialog'` in `NO_LONG_TEXT` and `SERVER_RENDERED: ['.stage .button']`.

**Docs:**
- `confirm-dialog.mdx`, title "Confirm dialog", description "An alert dialog that asks one question. It resolves yes only when the confirm button is pressed; Escape, the scrim and Cancel are no.", icon `CircleHelp`. Sections: `## Basic` (default tone, `confirm-dialog-basic`), `## Danger` (the tone is required; danger draws the error well and the danger Button; the confirm label names the outcome, never "OK", `confirm-dialog-danger`), `## Asking from code` (`useConfirm()`: `confirm(options)` returns a promise, render `dialog` once; a second question answers the first no; unmounting answers no; if the action removes the trigger, place focus yourself, as the example does; `confirm-dialog-hook`), `## Usage` (the pending states: a promise from `onConfirm` or `isPending`; a rejection keeps the dialog open and is reported as if uncaught; `isDismissable={false}` for a question that must be answered), `## Props` (two tables with distinct labels: "ConfirmDialog props" for `Pick<ConfirmDialogProps, 'title' | 'description' | 'confirmLabel' | 'cancelLabel' | 'tone' | 'icon' | 'onConfirm' | 'onCancel' | 'isPending' | 'isDismissable' | 'isKeyboardDismissDisabled' | 'isOpen' | 'defaultOpen' | 'onOpenChange' | 'size' | 'className' | 'overlayClassName'>` and "useConfirm" for `ConfirmHandle` from `useConfirm.tsx`), `## Accessibility` (`alertdialog`, described by the description, initial focus on the safe answer in danger; `<Keys rows={[['Tab', 'Moves between Cancel and the confirm button.'], ['Escape', 'Cancels.'], ['Enter Space', 'Press the focused button.']]} />`), `## Design rules` (dos: name the outcome on the button, use danger for anything that cannot be undone, keep the description to what will happen; donts: never "OK" or "Yes", never confirm a reversible action, never default the tone).
- Examples: `confirm-dialog-basic.tsx` (server file), `confirm-dialog-danger.tsx` (server file), `confirm-dialog-hook.tsx` (client file: three rows, `useConfirm`, removal, focus placed on the next row's button through a ref).
- `meta.json`: `"confirm-dialog"` after `"collapsible-card"` and before `"dialog"`. Index, footer and READMEs: "Confirm dialog".
- `docs/design-system.md`, appended to `## Dialog and ConfirmDialog`: the source's rule that silence is never yes, the DOM order Cancel then Confirm, initial focus by tone, why `tone` has no default, the pending state and `reportError`, the hook's contract (replacement and unmount answer no), and that nothing new is measured (the danger well and the buttons are Dialog's and Button's).

**Changeset:** append to `.changeset/overlays-dialog.md`: "ConfirmDialog is the alert dialog on top of it: a required description and tone, a confirm label that names the outcome, Cancel first, a pending state from a promise or `isPending`, and `useConfirm()`, which returns a promise that is true only when the confirm button is pressed."

**Steps:**

- [ ] **Step 1: Write the failing tests** listed above, stories included.
- [ ] **Step 2: Run them and watch them fail**

```bash
pnpm turbo run build --filter=@snapshot-ui/core --filter=@snapshot-ui/react
pnpm --filter @snapshot-ui/react exec vitest run
pnpm --filter @snapshot-ui/storybook exec vitest run --project=storybook --project=storybook-dark ConfirmDialog
pnpm turbo run build --filter=@snapshot-ui/docs
lsof -nP -iTCP:3100 -sTCP:LISTEN
pnpm --filter @snapshot-ui/docs test:e2e
```

Expected: the React run FAILS to import `./ConfirmDialog` and `./useConfirm`; the Storybook run fails to import the story file; the end-to-end run FAILS the two completeness guards (`+ "confirm-dialog"`) and the new test.

- [ ] **Step 3: Write the component, the hook, the private `role` on Dialog, the stories, the examples, the page, the record and the changeset.** Add the `ConfirmDialog` size-limit entry after `Dialog`'s with a 4 kB placeholder, measure, and set the limit by the rule (round up to the next half kilobyte, then add half a kilobyte).
- [ ] **Step 4: Run the tests and watch them pass**

```bash
pnpm turbo run build --filter=@snapshot-ui/core --filter=@snapshot-ui/react
pnpm --filter @snapshot-ui/react exec vitest run
pnpm --filter @snapshot-ui/storybook exec vitest run --project=storybook --project=storybook-dark ConfirmDialog
```

Expected: all pass: about 20 ConfirmDialog tests, 7 hook tests, 1 server row, and the 5 stories in both projects.

- [ ] **Step 5: Run everything** (the nine commands of Task 1's Step 5). Expected: every gate green; one more static page; the end-to-end run passes with the page's 4 loop tests and the new one; `ConfirmDialog` within its limit; `pnpm verify` exits 0. The lint passes with exactly two `jsx-a11y/no-autofocus` disables in `ConfirmDialog.tsx`, each with its reason.
- [ ] **Step 6: Visual baselines.** Expected: 15 new files for `danger`, `default` and `pending`, no changed file. What to look at: Cancel then the red Delete button; the red triangle in its tinted well; the spinner in the pending button with Cancel dimmed.
- [ ] **Step 7: Commit**

```bash
git add .changeset/overlays-dialog.md "apps/docs/app/(home)/home-page.tsx" apps/docs/content/docs/components/confirm-dialog.mdx apps/docs/content/docs/components/meta.json apps/docs/examples/confirm-dialog-basic.tsx apps/docs/examples/confirm-dialog-danger.tsx apps/docs/examples/confirm-dialog-hook.tsx apps/docs/examples/index.ts apps/docs/tests/components.spec.ts apps/docs/tests/docs.spec.ts docs/design-system.md packages/core/README.md packages/react/.size-limit.json packages/react/README.md packages/react/src/dialog/ConfirmDialog.stories.tsx packages/react/src/dialog/ConfirmDialog.test.tsx packages/react/src/dialog/ConfirmDialog.tsx packages/react/src/dialog/Dialog.tsx packages/react/src/dialog/index.ts packages/react/src/dialog/useConfirm.test.tsx packages/react/src/dialog/useConfirm.tsx packages/react/src/index.ts packages/react/test/server-render.test.tsx "apps/storybook/tests/visual/__screenshots__/components-confirmdialog--*.png"
git commit -m "feat: add ConfirmDialog and useConfirm"
```

---
### Task 6: Drawer

**Goal:** the floating side panel, inset 16px from the viewport on every side, sliding from the start or end edge over the scrim, with a required title that may be visually hidden, a scrolling body and a pinned footer. Implements spec 6.1, 6.2, 6.3, the Drawer rulings of 13.1 and 13.2 item 5.

**Files:**
- Create: `packages/react/src/drawer/Drawer.tsx`, `packages/react/src/drawer/index.ts`
- Modify: `packages/react/src/index.ts`, `packages/react/.size-limit.json`
- Test: `packages/react/src/drawer/Drawer.test.tsx` (create), `packages/react/test/server-render.test.tsx`, `packages/react/test/empty-parts.test.tsx`
- Test (stories): `packages/react/src/drawer/Drawer.stories.tsx` (create), `packages/react/src/rtl/RightToLeft.stories.tsx`
- Create: `packages/core/src/components/drawer.css`
- Modify: `packages/core/src/styles.css` (import after `dialog.css`)
- Test: `packages/core/test/css.test.js`
- Create: `apps/docs/content/docs/components/drawer.mdx`, `apps/docs/examples/drawer-navigation.tsx`, `apps/docs/examples/drawer-end.tsx`
- Modify: `apps/docs/content/docs/components/meta.json`, `apps/docs/examples/index.ts`, `apps/docs/app/(home)/home-page.tsx`
- Test: `apps/docs/tests/components.spec.ts`, `apps/docs/tests/docs.spec.ts`
- Modify: `packages/core/README.md`, `packages/react/README.md`
- Modify: `docs/design-system.md` (a `## Drawer` section appended to Appendix B)
- Create: `.changeset/overlays-drawer-sheet.md` (Task 8 appends)
- Create (Docker step): 25 baselines, `apps/storybook/tests/visual/__screenshots__/components-drawer--*.png`. None changes.

**Interfaces:**
- Consumes: `ModalFrame` and `isOutsideToastRegion` from Task 4 (`overlayClass`, `panelClass`, `panelAttributes`, `className`, `overlayClassName`, `panelRef`, `isDismissable`, `isKeyboardDismissDisabled`, `isOpen`, `defaultOpen`, `onOpenChange`, `children`; it renders the scrim with `dir`, the panel with `overlay <panelClass>`, registers in the stack and copies the scope); React Aria's `Dialog`, `Heading`, `VisuallyHidden`, `DialogTrigger`, `useLocale`; `IconButton`, Lucide `X`, `cx`, `present`; `overlay.css` (`--overlay-inset`).
- Produces `Drawer.tsx`, a client module, exported from `@snapshot-ui/react`:

```ts
'use client';

export type DrawerPlacement = 'start' | 'end';

export interface DrawerProps {
  /** Which edge the panel comes from. `start` and `end` follow the writing direction. @default 'start' */
  placement?: DrawerPlacement;
  /** The title, an h2 in the header. It names the drawer. Required. */
  title: ReactNode;
  /** Keeps the title for assistive technology only, for a drawer whose content names itself, such as a navigation list. @default false */
  isTitleHidden?: boolean;
  /** The body. It scrolls. */
  children?: ReactNode | ((opts: { close: () => void }) => ReactNode);
  /** Pinned under the body, for an account row or an action. */
  footer?: ReactNode;
  /** A press on the scrim closes the drawer. @default true */
  isDismissable?: boolean;
  /** Escape no longer closes it. @default false */
  isKeyboardDismissDisabled?: boolean;
  /** An X in the header. @default true */
  hasCloseButton?: boolean;
  /** The close button's accessible name. @default 'Close' */
  closeLabel?: string;
  isOpen?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (isOpen: boolean) => void;
  /** Goes on the panel, merged after the library's classes. */
  className?: string | ((values: ModalRenderProps & { defaultClassName: string | undefined }) => string);
  /** Goes on the scrim. */
  overlayClassName?: string;
  /** A ref to the dialog element, the one React Aria focuses. */
  ref?: Ref<HTMLElement>;
}

export function Drawer(props: DrawerProps): ReactElement;
```

  The props are listed rather than extended from React Aria's `ModalOverlayProps` (spec 6.1), so nothing `ModalFrame` does not forward is promised; every prop the spec names is here. It is opened by `DialogTrigger` (Task 4's re-export) or controlled with `isOpen`.
- Later tasks rely on: nothing in this plan. The shell spec's navigation drawer is `<Drawer placement="start" title="Menu" isTitleHidden>` controlled by the shell, which closes it when the viewport widens; that rule is the shell's.

**Behavior:**
1. **Markup.** `div.overlay-scrim.drawer-overlay[dir]` > `div.overlay.drawer[data-side="left" | "right"]` > `section.drawer-content[role="dialog"][tabindex="-1"]` > `div.drawer-header` holding `h2.drawer-title` (React Aria's `Heading slot="title"`; wrapped in `VisuallyHidden` when `isTitleHidden`, so it still names the dialog) and the close `IconButton` (`button.icon-button.drawer-close`, `slot="close"`, `aria-label={closeLabel}`) when `hasCloseButton`; `div.drawer-body` with `children` (a function receives `{ close }`); `div.drawer-footer` with `footer` when present.
2. **`data-side`** is `placement` resolved against `useLocale().direction`: `start` is `left` in `ltr` and `right` in `rtl`; `end` the other way.
3. **The same rules as Dialog:** named by the title, focus moves in and returns, Escape and the scrim press (when `isDismissable`), the scroll lock, `aria-hidden` outside, stacking (a drawer under a dialog paints the one scrim), the toast-region exception.
4. **Scope:** the panel copies the trigger's scope; **right to left:** `start` is the right edge and the slide follows `data-side`.
5. **Server:** closed, it renders nothing; its trigger renders.

**CSS**, the whole of `drawer.css`:

```css
/*
 * Drawer: a float panel inset 16px from every edge of the viewport, with the stadium corner, the
 * hairline and the dramatic shadow, sliding in from its edge in 180ms over the scrim. The header
 * holds the title and the close button, the body scrolls, and the footer stays. Derived in
 * docs/design-system.md ("Drawer").
 */
@layer components {
  .drawer-overlay {
    align-items: stretch;
    padding: var(--overlay-inset);
  }

  .drawer {
    display: flex;
    flex-direction: column;
    width: min(20rem, 100%);
    height: 100%;
    border: 1px solid var(--color-hairline);
    border-radius: var(--radius-stadium);
    background-color: var(--color-float);
    box-shadow: var(--shadow-dramatic);
    transition: translate 180ms ease;
  }

  .drawer[data-side='left'] {
    justify-self: start;
  }

  .drawer[data-side='right'] {
    justify-self: end;
  }

  .drawer[data-side='left']:is([data-entering], [data-exiting]) {
    translate: calc(-100% - var(--overlay-inset)) 0;
  }

  .drawer[data-side='right']:is([data-entering], [data-exiting]) {
    translate: calc(100% + var(--overlay-inset)) 0;
  }

  .drawer-content {
    display: flex;
    flex: 1 1 auto;
    flex-direction: column;
    min-height: 0;
    outline: none;
  }

  /* 24px, not the dialog's 32: a 320px panel at 32px leaves 256px for a list, and the rail it mirrors pads 24. */
  .drawer-header {
    display: flex;
    flex: none;
    align-items: flex-start;
    justify-content: space-between;
    gap: var(--spacing-part);
    padding: var(--spacing-peer) var(--spacing-peer) 0;
  }

  .drawer-title {
    margin: 0;
    font-family: var(--font-sans);
    font-size: var(--text-h3);
    line-height: var(--text-h3--line-height);
    letter-spacing: var(--text-h3--letter-spacing);
    font-weight: var(--text-h3--font-weight);
    color: var(--color-ink);
    overflow-wrap: anywhere;
  }

  /* The icon lines up with the padding edge. */
  .drawer-close {
    flex: none;
    margin-inline-start: auto;
    margin-inline-end: -0.5rem;
  }

  .drawer-body {
    flex: 1 1 auto;
    min-height: 0;
    padding: var(--spacing-peer);
    overflow-y: auto;
    overscroll-behavior: contain;
    overflow-wrap: anywhere;
  }

  .drawer-footer {
    flex: none;
    padding: 0 var(--spacing-peer) calc(var(--spacing-peer) + env(safe-area-inset-bottom, 0px));
  }

  @media (forced-colors: active) {
    .drawer {
      border-color: CanvasText;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .drawer {
      transition: none;
    }
  }
}
```

**Tests, written first:**
- `Drawer.test.tsx` (queries on `document.body`): named by the title, which is an `h2`; `isTitleHidden` keeps the name and the heading is inside a visually hidden wrapper (not visible, still in the tree); `placement` and direction resolve to `data-side`: default `left`, `end` is `right`, under `I18nProvider locale="ar-EG"` `start` is `right` and `end` is `left`; the close button renders by default, named `closeLabel` (default "Close"), closes on press, and is absent with `hasCloseButton={false}`; `footer` renders `.drawer-footer` only when given; `children` as a function receives `close`; Escape closes and `isKeyboardDismissDisabled` stops it; a scrim pointer down closes and `isDismissable={false}` stops it; a press inside `.toast-region` does not close it; controlled and uncontrolled; `className` on the panel after `overlay drawer`, `overlayClassName` on the scrim, `ref` on the `section`; `document.documentElement.style.overflow` is `hidden` while open; focus returns to the trigger on close; the panel copies `data-theme` from a dark trigger; axe on the open state with a visible and with a hidden title.
- `server-render.test.tsx`: `['Drawer, closed', <DialogTrigger><Button>Menu</Button><Drawer title="Menu" isTitleHidden>...</Drawer></DialogTrigger>, ['<button', '>Menu<'], ['drawer-content']]`.
- `empty-parts.test.tsx`, `EMPTY_OVERLAYS` row: `['Drawer', <Drawer isOpen title="Menu" footer={false}>{''}</Drawer>]` finds no `.drawer-footer` (the body is always rendered; it may be empty, since a drawer is its body).
- `css.test.js`, `describe('src/components/drawer.css')`: the overlay stretches and pads the inset; the panel's width cap, height, fill, edge, corner and shadow tokens; the two `justify-self` rules; the two slide rules with the exact `calc` strings; the header, body and footer paddings as written (the footer's `env(safe-area-inset-bottom, 0px)`); the body's scroll declarations; the forced-colors border; the reduced-motion block after the transition. Import order: `drawer.css` after `dialog.css`.
- Stories, `Drawer.stories.tsx`, title `Components/Drawer`, each with a `DialogTrigger` and `defaultOpen`:
  - `Start` (visual): a navigation list of six `Link`s in the body, title "Menu", a footer with an account row. Play: `data-side="left"`, the panel's left edge is 16px from the viewport's, its top 16px and its bottom `innerHeight - 16`.
  - `End` (visual): `placement="end"`, title "Filters", a form body. Play: `data-side="right"`, the right edge 16px from the viewport's.
  - `LongList` (visual): forty links. Play: the body's `scrollHeight` exceeds its `clientHeight`, the footer is in view, no sideways scroll at 375.
  - `HiddenTitle` (visual): `isTitleHidden`, the header is just the close button at the end. Play: the dialog is still named "Menu"; the close button's right edge is within 24px of the panel's.
  - `InDarkScope` (visual): the trigger in a dark card. Play: `.drawer` has `data-theme="dark"`, the scrim has none.
  - `FocusTrap` (`no-visual`): starts closed; play opens by keyboard, expects focus inside, Tab to cycle through the close button and the links back to the close button, Escape to close and focus to return to the trigger; then opens by click and presses the scrim to close.
- `RightToLeft.stories.tsx`: `DrawerMirrored` under the file's `Rtl` wrapper, two drawers (`start` and `end`) opened in turn by its play: the `start` drawer has `data-side="right"` and its right edge is 16px from the viewport's right; the `end` drawer `data-side="left"`; the close button is at the left end of the header in both.
- Docs end-to-end, `docs.spec.ts`: `test('the drawer page opens a navigation drawer that locks the page and closes on Escape')`. `components.spec.ts` maps: `'drawer'` in `NO_LONG_TEXT`, `SERVER_RENDERED: ['.stage .button']`.

**Docs:**
- `drawer.mdx`, title "Drawer", description "A floating side panel over the scrim, from the start or end edge, with a title, a scrolling body and a pinned footer.", icon `PanelLeft`. Sections: `## Navigation` (`placement="start"`, a list of links, `isTitleHidden` because the list names itself, a footer account row; `drawer-navigation`), `## From the end` (`placement="end"` with a form; `drawer-end`), `## Usage` (open from `DialogTrigger` or control with `isOpen`; a shell closes a navigation drawer when the viewport widens, and that is the shell's rule; the panel floats 16px from every edge and takes the dramatic shadow; `start` and `end` follow the writing direction), `## Props` (`Pick<DrawerProps, 'placement' | 'title' | 'isTitleHidden' | 'children' | 'footer' | 'isDismissable' | 'isKeyboardDismissDisabled' | 'hasCloseButton' | 'closeLabel' | 'isOpen' | 'defaultOpen' | 'onOpenChange' | 'className' | 'overlayClassName'>`), `## Accessibility` (a dialog named by its title even when the title is hidden; focus moves in, is contained and returns; the page behind is hidden and does not scroll; `<Keys rows={[['Tab', 'Cycles through the controls inside.'], ['Escape', 'Closes the drawer.'], ['Enter Space', 'Press a button or follow a link.']]} />`), `## Design rules` (dos: use a drawer for navigation or a filter form, hide the title when the content names itself, keep the close button; donts: never a drawer for a question (that is ConfirmDialog), never wider than 20rem, never two drawers at once).
- Examples: `drawer-navigation.tsx` (server file), `drawer-end.tsx` (server file with a `Switch` and a `Button` in the footer).
- `meta.json`: `"drawer"` after `"dialog"`. Index, footer and READMEs: "Drawer".
- `docs/design-system.md`, `## Drawer`: the source's drawer (spec 2), the 16px inset and why the drawer and the rail it mirrors are one object, the 24px padding derivation (256px left at 32px on a 320px panel), `min(20rem, 100vw - 2rem)`, the slide by `data-side` and why the side is physical, the hidden title, the dramatic shadow and that the shell may override it to `--shadow-lift` on its own class, and that nothing new is measured (float, hairline, ink and slate pairs are the dialog's).

**Changeset** `.changeset/overlays-drawer-sheet.md`:

```markdown
---
'@snapshot-ui/core': minor
'@snapshot-ui/react': minor
---

Add Drawer, a floating side panel on React Aria's Modal that slides from the start or end edge over the scrim, inset 16px from the viewport, with a required title that may be visually hidden, a scrolling body, a pinned footer and a close button.
```

**Steps:**

- [ ] **Step 1: Write the failing tests** listed above, stories included.
- [ ] **Step 2: Run them and watch them fail**

```bash
pnpm turbo run build --filter=@snapshot-ui/core --filter=@snapshot-ui/react
pnpm --filter @snapshot-ui/core exec vitest run test/css.test.js
pnpm --filter @snapshot-ui/react exec vitest run
pnpm --filter @snapshot-ui/storybook exec vitest run --project=storybook --project=storybook-dark Drawer RightToLeft
pnpm turbo run build --filter=@snapshot-ui/docs
lsof -nP -iTCP:3100 -sTCP:LISTEN
pnpm --filter @snapshot-ui/docs test:e2e
```

Expected: the core run FAILS every drawer CSS test; the React run FAILS to import `./Drawer`; the Storybook run fails to import both story files; the end-to-end run FAILS the completeness guards (`+ "drawer"`) and the new test.

- [ ] **Step 3: Write the component, the CSS, the stories, the examples, the page, the record and the changeset.** Add the `Drawer` size-limit entry with a 4 kB placeholder, measure, and set the limit by the rule.
- [ ] **Step 4: Run the tests and watch them pass**

```bash
pnpm turbo run build --filter=@snapshot-ui/core --filter=@snapshot-ui/react
pnpm --filter @snapshot-ui/core exec vitest run
pnpm --filter @snapshot-ui/react exec vitest run
pnpm --filter @snapshot-ui/storybook exec vitest run --project=storybook --project=storybook-dark Drawer RightToLeft
```

Expected: all pass: the 9 core tests, about 22 Drawer tests plus the two shared rows, the 6 drawer stories and the mirrored story in both projects.

- [ ] **Step 5: Run everything** (the nine commands of Task 1's Step 5). Expected: every gate green; one more static page; the end-to-end run passes with the page's 4 loop tests and the new one; `Drawer` within its limit; `pnpm verify` exits 0.
- [ ] **Step 6: Visual baselines.** Expected: 25 new files for `start`, `end`, `long-list`, `hidden-title` and `in-dark-scope`, no changed file. What to look at: a white panel with 40px corners floating 16px inside the left (or right) edge, its full height; the list scrolling with the footer pinned; the hidden-title header holding only the X; the dark panel on the light page.
- [ ] **Step 7: Commit**

```bash
git add .changeset/overlays-drawer-sheet.md "apps/docs/app/(home)/home-page.tsx" apps/docs/content/docs/components/drawer.mdx apps/docs/content/docs/components/meta.json apps/docs/examples/drawer-end.tsx apps/docs/examples/drawer-navigation.tsx apps/docs/examples/index.ts apps/docs/tests/components.spec.ts apps/docs/tests/docs.spec.ts docs/design-system.md packages/core/README.md packages/core/src/components/drawer.css packages/core/src/styles.css packages/core/test/css.test.js packages/react/.size-limit.json packages/react/README.md packages/react/src/drawer/Drawer.stories.tsx packages/react/src/drawer/Drawer.test.tsx packages/react/src/drawer/Drawer.tsx packages/react/src/drawer/index.ts packages/react/src/index.ts packages/react/src/rtl/RightToLeft.stories.tsx packages/react/test/empty-parts.test.tsx packages/react/test/server-render.test.tsx "apps/storybook/tests/visual/__screenshots__/components-drawer--*.png"
git commit -m "feat: add Drawer"
```

---
### Task 7: The Sheet spike

**Goal:** decide whether Sheet is built on React Aria's `Sheet` family or on the Modal composition, by running a prototype through Chromium, WebKit and Firefox against the eight criteria of spec 7.6, and record the outcome with the engine versions in Appendix B before any sheet code is written. Implements spec 7.1 and 7.6, and the Sheet ruling of 13.1. A spike: throwaway code, a lasting record.

**Files:**
- Create, temporarily: `packages/react/src/sheet/SheetSpike.stories.tsx` (title `Checks/Sheet spike`, `tags: ['no-visual']`), deleted before the commit.
- Create, outside the repository (the session's scratch folder, never committed): `sheet-spike.mjs`, a Playwright script.
- Modify: `docs/design-system.md` (a `## Sheet` section appended to Appendix B, holding the spike's record; Task 8 appends the derivation)
- No component, no CSS, no test, no changeset, no baseline. The commit touches `docs/design-system.md` only.

**Interfaces:**
- Consumes, from `react-aria-components` 1.22.1 (`dist/private/Sheet.mjs`, read before building): `SheetTrigger` (a `DialogTrigger`), `SheetOverlay` (`position`, `swipeDirection`, `snapPoints`, `preventDismissal`, `isOpen`, `defaultOpen`, `onOpenChange`; it renders `ModalOverlay` with `isDismissable: !preventDismissal`, `isKeyboardDismissDisabled: preventDismissal` and `UNSTABLE_deferUntilEntered: true`, positions itself `absolute` sized to the page, writes `--sheet-scroll-padding-x` and `-y` from the visual viewport variables, and closes through an `IntersectionObserver` once the sheet is scrolled out), `SheetBackdrop` (`swipeAnimation`, `swipeAnimationRange`), `Sheet` (`swipeAnimation`, `stackAnimation`, `overscrollPadding`; it renders `data-position`, `data-swipe-direction`, `data-stack-index`, `data-has-descendants` and `data-expanded`, and a `[data-sheet-scroll]` container with `scroll-snap-type: <axis> mandatory` whose programmatic scrolls go instant under `(prefers-reduced-motion: reduce)`), `SheetContent` (a `Dialog`). Where `animation-timeline: view()` is unsupported (`CSS.supports` is false in Firefox 153), the swipe animation falls back to a 300ms `animationDuration`.
- Produces: the record. Task 8 relies on its verdict.

**Behavior (the pass criteria, spec 7.6).** The spike passes when, in all three engines:
1. the sheet opens from a `SheetTrigger` and from a controlled `isOpen`, focus moves into it (the `SheetContent` element or its first `autoFocus` child), and returns to the trigger on close;
2. Escape closes it, a press on the backdrop closes it, and `preventDismissal` stops both;
3. a swipe down dismisses it, with the 300ms fallback where `animation-timeline: view()` is missing. React Aria drives the swipe with native scroll of `[data-sheet-scroll]`, so a pointer swipe is a wheel scroll: in every engine, under `hasTouch: true`, `page.mouse.move` to the sheet's middle and `page.mouse.wheel(0, delta)` in the direction that carries the sheet toward its edge (Playwright has no touch drag). In Chromium also a real touch drag through a CDP session (`page.context().newCDPSession(page)`, then `Input.dispatchTouchEvent` with `touchStart`, eight `touchMove`s 40px apart and `touchEnd`), the one engine whose protocol can send one; the record names it as the touch proof;
4. a body taller than `92dvh` scrolls inside the sheet (the body's `scrollTop` changes) while the sheet's own box stays put;
5. two sheets stack (the second has `data-stack-index="1"`) and one scrim paints (the second backdrop's computed background is transparent once `data-stacked` is set, or, in the spike, the second backdrop is rendered transparent by a prototype rule keyed on `[data-stack-index="1"]`);
6. the sheet sits above a sticky header with `z-index: 20` (the header is not hit at a point inside the sheet: `document.elementFromPoint` returns a sheet descendant);
7. under reduced motion (`reducedMotion: 'reduce'`) it opens with no smooth scroll (`scroll-behavior` of `[data-sheet-scroll]` is not `smooth`, and the open settles within one frame) and no backdrop animation (`animationName` of the backdrop is `none`);
8. a text field inside keeps the sheet on screen when the visual viewport shrinks (WebKit, emulated by resizing the viewport to 375 by 400 while the field is focused: the field's bottom stays above `innerHeight`).

A failure in any engine is a failure. The spike never changes a criterion to pass.

**The prototype story**, `SheetSpike.stories.tsx`: one story, `Spike`, rendering, in order, a sticky header `div` with `position: sticky; top: 0; z-index: 20` and a `data-testid="header"`, a `SheetTrigger` with a `Button` and a `SheetOverlay position="bottom"` holding a `SheetBackdrop` and a `Sheet` with a `SheetContent` that holds a heading, a `TextField`, twenty paragraphs and a second `SheetTrigger` opening a second sheet; the same again controlled by a `useState` for criterion 1; and a third pair with `preventDismissal` for criterion 2. Inline styles only (it is thrown away): the overlay `position: fixed; inset: 0; z-index: 1000`, the backdrop `position: absolute; inset: 0; background: rgb(5 5 5 / 0.4)`, the sheet `background: white; border-radius: 40px 40px 0 0; max-height: 92dvh; display: flex; flex-direction: column`, the content `overflow-y: auto; min-height: 0`, and the backdrop's `swipeAnimation` set to a `@keyframes` declared in a `<style>` element the story renders (opacity 0 to 1). Every element the script needs carries a `data-testid`.

**The script**, `sheet-spike.mjs`, run with `node` from the scratch folder against the built Storybook served by `http-server` on 6007 (the visual config's server): for each of `chromium`, `webkit`, `firefox` from `playwright` (installed with `pnpm --filter @snapshot-ui/storybook exec playwright install webkit firefox`; chromium is installed already), launch, open `http://127.0.0.1:6007/iframe.html?id=checks-sheet-spike--spike&viewMode=story`, wait for Storybook's render phase as `apps/storybook/tests/visual/ready.ts` does, and run the eight criteria as functions that return `{ criterion, pass, detail }`. Print a table per engine with `browser.version()`. Criteria 3 and 8 use a context created with `hasTouch: true` and `viewport: { width: 375, height: 760 }`; criterion 7 a context with `reducedMotion: 'reduce'`.

**Tests:** the script is the test. Its output is pasted into the record. Nothing is added to the repository's suites in this task; Task 8 writes the lasting ones.

**Docs:** `docs/design-system.md`, `## Sheet` appended to Appendix B, beginning with the record: the date, the versions (`react-aria-components 1.22.1`, Playwright 1.64.0 and each engine's `browser.version()`), a table of the eight criteria by engine with pass or fail and the measured detail (how long the 300ms fallback took to dismiss in Firefox, the scroll travel, the stack index), the verdict (React Aria's `Sheet` family, or the Modal fallback with dragging deferred), and anything the spike learned that Task 8 must honour (for example, which element React Aria focuses after `UNSTABLE_deferUntilEntered`, whether the `IntersectionObserver` close fires with `preventDismissal`, and the exact `[data-sheet-scroll]` scroll behavior under reduced motion). It also records, for jsdom: that `IntersectionObserver`, `ResizeObserver` and `Element.prototype.scrollTo` are absent there and must be stubbed in `packages/react/test/setup.ts` for the unit tests, which is Task 8's.

**Fallback.** If any criterion fails in any engine, the record says which, with the detail, and the verdict is the Modal composition: Task 8 then builds `Sheet` on `ModalFrame` with no dragging, `snapPoints` ignored with a development warning, the slide as a 180ms `translateY(100%)` transition on `[data-entering]` and `[data-exiting]`, and the same public API; dragging is deferred to a follow-up recorded in the same section. Either way the public surface is spec 7.2.

**Steps:**

- [ ] **Step 1: Read `dist/private/Sheet.mjs`** in `node_modules/.pnpm/react-aria-components@1.22.1*/node_modules/react-aria-components/`, start to end, and note what the record must honour.
- [ ] **Step 2: Write the prototype story and build Storybook**

```bash
pnpm --filter @snapshot-ui/storybook exec playwright install webkit firefox
pnpm turbo run build --filter=@snapshot-ui/storybook
```

Expected: the build lists `checks-sheet-spike--spike` in `storybook-static/index.json`.

- [ ] **Step 3: Write and run the script**

```bash
cd apps/storybook && node node_modules/http-server/bin/http-server storybook-static -a 127.0.0.1 -p 6007 -s -c-1 &
node <scratch>/sheet-spike.mjs
```

Expected: three tables, one per engine, eight rows each. Run it twice; a criterion that flips between runs is a failure.

- [ ] **Step 4: Record the outcome** in `docs/design-system.md` as specified, stop the server, delete `SheetSpike.stories.tsx` and the script.
- [ ] **Step 5: Run everything**

```bash
pnpm format
pnpm format:check
pnpm turbo run build test --filter=@snapshot-ui/storybook
pnpm verify
```

Expected: no file changed by `format`; the Storybook build no longer lists the spike story and every story test passes as before; `pnpm verify` exits 0; `git status --short` shows only `docs/design-system.md`.

- [ ] **Step 6: Visual baselines:** none (`pnpm --filter @snapshot-ui/storybook visual:docker -- --check` reports no difference).
- [ ] **Step 7: Commit**

```bash
git add docs/design-system.md
git commit -m "docs: record the sheet spike"
```

---
### Task 8: Sheet

**Goal:** the bottom sheet for phones: a float panel rising from the bottom edge, content-high up to `92dvh`, with a grabber, a header whose title may be hidden, a description, a scrolling body, a safe-area footer, a close button, swipe-to-dismiss and snap points through React Aria's `Sheet` family, or the Modal fallback if Task 7's record says so, behind the same public API. Implements spec 7.2 to 7.5, the Sheet ruling of 13.1, 13.2 item 6 and item 17's WebKit project.

**Read first:** the `## Sheet` record in `docs/design-system.md` (Task 7). It says which path this task builds and what React Aria does that the code must honour. The default below is React Aria's `Sheet` family; the fallback is in its own subsection at the end.

**Files:**
- Create: `packages/react/src/sheet/Sheet.tsx`, `packages/react/src/sheet/index.ts`
- Modify: `packages/react/src/overlay/ModalFrame.tsx` (export `FrameEffects`, so a non-`ModalFrame` overlay registers in the stack and copies its scope), `packages/react/src/index.ts`, `packages/react/.size-limit.json`, `packages/react/test/setup.ts`
- Test: `packages/react/src/sheet/Sheet.test.tsx` (create), `packages/react/test/server-render.test.tsx`, `packages/react/test/empty-parts.test.tsx`
- Test (stories): `packages/react/src/sheet/Sheet.stories.tsx` (create)
- Modify: `apps/storybook/vitest.config.ts`, `apps/storybook/package.json` (the `test` script), `.github/workflows/ci.yml` (the browser install step gains `webkit`)
- Create: `packages/core/src/components/sheet.css`
- Modify: `packages/core/src/styles.css` (import after `drawer.css`)
- Test: `packages/core/test/css.test.js`, `packages/core/test/contrast.test.js`
- Create: `apps/docs/content/docs/components/sheet.mdx`, `apps/docs/examples/sheet-basic.tsx`, `apps/docs/examples/sheet-more.tsx`, `apps/docs/examples/sheet-snap-points.tsx`
- Modify: `apps/docs/content/docs/components/meta.json`, `apps/docs/examples/index.ts`, `apps/docs/app/(home)/home-page.tsx`
- Test: `apps/docs/tests/components.spec.ts`, `apps/docs/tests/docs.spec.ts`
- Modify: `packages/core/README.md`, `packages/react/README.md`
- Modify: `docs/design-system.md` (the `## Sheet` section gains the derivation after the record)
- Modify: `.changeset/overlays-drawer-sheet.md`
- Create (Docker step): 25 baselines, `apps/storybook/tests/visual/__screenshots__/components-sheet--*.png`. None changes.

**Interfaces:**
- Consumes: from `react-aria-components` 1.22.1, `SheetTrigger`, `SheetOverlay`, `SheetBackdrop`, `Sheet` as `RACSheet`, `SheetContent`, `Heading`, `Text`, `VisuallyHidden`, `OverlayTriggerStateContext`, `useLocale` (their contracts are in Task 7's record and spec 7.1); `useOverlayStack`, `useOverlayScope`, `mergeRefs` and `FrameEffects` (Task 3 and 4); `IconButton`, Lucide `X`, `cx`, `present`; `overlay.css`.
- Produces `Sheet.tsx`, a client module, exported from `@snapshot-ui/react` with `SheetTrigger` re-exported:

```ts
'use client';

export interface SheetProps {
  /** The title, an h2 in the header. It names the sheet. Required. */
  title: ReactNode;
  /** Keeps the title for assistive technology only, for a sheet whose content names itself, such as a "More" list. @default false */
  isTitleHidden?: boolean;
  /** A line under the title, in slate. */
  description?: ReactNode;
  /** The body. It scrolls once the sheet is fully open. */
  children?: ReactNode | ((opts: { close: () => void }) => ReactNode);
  /** Pinned under the body, padded for the safe area. */
  footer?: ReactNode;
  /** Heights the sheet rests at, in px or as percentages of the sheet. It opens at the first. Passed through to React Aria. */
  snapPoints?: Array<number | string>;
  /** A swipe, Escape or a scrim press closes it. `false` keeps it open until a button closes it (React Aria's `preventDismissal`). @default true */
  isDismissable?: boolean;
  /** The decorative handle above the title. @default true */
  hasGrabber?: boolean;
  /** An X in the header, the keyboard's way out. @default true */
  hasCloseButton?: boolean;
  /** @default 'Close' */
  closeLabel?: string;
  isOpen?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (isOpen: boolean) => void;
  /** Goes on the sheet panel, merged after the library's classes. */
  className?: string | ((values: SheetRenderProps & { defaultClassName: string | undefined }) => string);
  /** Goes on the backdrop. */
  overlayClassName?: string;
  /** A ref to the content element, the dialog React Aria focuses. */
  ref?: Ref<HTMLDivElement>;
}

export function Sheet(props: SheetProps): ReactElement;

export { SheetTrigger, type SheetTriggerProps } from 'react-aria-components';
```

  The sheet rises from the bottom only; `position` is not a prop. The re-export goes through `Sheet.tsx`, a client module, as `DialogTrigger` does.
- Produces in `ModalFrame.tsx` the named export `FrameEffects({ id, scrimRef, rootRef, onUnmount })`, unchanged in behavior from Task 4.
- Later tasks rely on: nothing in this plan. The shell spec's "More" sheet is `<Sheet title="More" isTitleHidden footer={account}>`.

**Behavior (the React Aria path):**
1. **Markup.** `div.sheet-overlay[dir]` (`SheetOverlay` with `position="bottom"`, `snapPoints`, `preventDismissal={!isDismissable}`, `isOpen`, `defaultOpen`, `onOpenChange`; React Aria positions it, the class gives it `z-index: var(--z-modal)`) > `div.overlay-scrim.sheet-scrim` (`SheetBackdrop` with `swipeAnimation="sheet-scrim-fade"`, `ref` to the stack's scrim ref) + `div.overlay.sheet` (`RACSheet`, with `className` merged after) > `div.sheet-content[role="dialog"]` (`SheetContent`, `ref`) > `FrameEffects`, then `div.sheet-grabber-band` holding `div.sheet-grabber[aria-hidden="true"]` when `hasGrabber`, `div.sheet-header` holding `div.sheet-header-text` (`h2.sheet-title` through `Heading slot="title"`, inside `VisuallyHidden` when `isTitleHidden`; `p.sheet-description` through `Text slot="description" elementType="p"` when present) and the close `IconButton` (`button.icon-button.sheet-close`, `slot="close"`) when `hasCloseButton`; `div.sheet-body` with `children` (a function receives `{ close }`); `div.sheet-footer` with `footer` when present.
2. **Focus** moves in once the sheet has entered (React Aria defers it through `UNSTABLE_deferUntilEntered`; in jsdom at once), stays inside, returns to the trigger on close. Escape closes; a scrim press closes; `isDismissable={false}` stops swipe, Escape and the scrim press. The page does not scroll; everything outside is hidden.
3. **Swipe.** Down to dismiss with momentum, by touch and pointer, through React Aria's native scroll; between snap points when given. An enhancement: the close button and Escape are always there while dismissable.
4. **Scroll inside.** The body scrolls once the sheet is fully open (`data-expanded` on the sheet); at a partial snap point a swipe on the content expands the sheet instead. Task 7's record says whether React Aria sets `data-expanded` for a sheet with no `snapPoints` once it has entered; if it does, the body's `overflow-y: auto` is keyed on `.sheet[data-expanded]`; if it does not, the body scrolls always and the record says so.
5. **Keyboard up.** React Aria writes the visual viewport into `--visual-viewport-height`; the sheet's height caps against it.
6. **Stacking.** A second sheet carries `data-stack-index="1"` from React Aria and `data-stacked` on its backdrop from the stack, so one scrim paints.
7. **Reduced motion.** React Aria's programmatic scrolls go instant; the backdrop's keyframes are removed by the stylesheet.
8. **Scope and direction.** The sheet copies the trigger's scope; `dir` from `useLocale()` goes on the overlay.
9. **Server.** Renders nothing closed and on the server; the trigger renders.

**CSS**, the whole of `sheet.css` (React Aria path; the fallback's differences follow):

```css
/*
 * Sheet: the bottom sheet for phones, derived in docs/design-system.md ("Sheet"). A float panel with
 * the stadium corner on its top edge only, content-high up to 92dvh (the consumer's number), 36rem
 * wide at most, no shadow because its only free edge is at the viewport's bottom, a 40px by 4px
 * grabber in a 44px band, the card title step, 24px of padding, and a safe-area bottom. React Aria
 * drives the slide with scroll; the backdrop fades through sheet-scrim-fade over the swipe.
 */
@layer components {
  .sheet-overlay {
    z-index: var(--z-modal);
  }

  .sheet {
    display: flex;
    flex-direction: column;
    width: min(100%, 36rem);
    max-height: 92vh;
    max-height: 92dvh;
    margin-inline: auto;
    border: 1px solid var(--color-hairline);
    border-start-start-radius: var(--radius-stadium);
    border-start-end-radius: var(--radius-stadium);
    background-color: var(--color-float);
  }

  .sheet-content {
    display: flex;
    flex-direction: column;
    min-height: 0;
    outline: none;
  }

  /* Dots stay round in every shape, and boundary is gated at 3:1 on float already. */
  .sheet-grabber-band {
    display: grid;
    flex: none;
    place-items: center;
    height: 44px;
  }

  .sheet-grabber {
    width: 40px;
    height: 4px;
    border-radius: var(--radius-dot);
    background-color: var(--color-boundary);
  }

  .sheet-header {
    display: flex;
    flex: none;
    align-items: flex-start;
    gap: var(--spacing-part);
    padding-inline: var(--spacing-peer);
  }

  .sheet-header-text {
    display: flex;
    flex: 1 1 auto;
    flex-direction: column;
    gap: var(--spacing-part);
    min-width: 0;
  }

  .sheet-title {
    margin: 0;
    font-family: var(--font-sans);
    font-size: var(--text-h3);
    line-height: var(--text-h3--line-height);
    letter-spacing: var(--text-h3--letter-spacing);
    font-weight: var(--text-h3--font-weight);
    color: var(--color-ink);
    overflow-wrap: anywhere;
  }

  .sheet-description {
    margin: 0;
    font-size: var(--text-body);
    line-height: var(--text-body--line-height);
    font-weight: var(--text-body--font-weight);
    color: var(--color-slate);
    overflow-wrap: anywhere;
  }

  .sheet-close {
    flex: none;
    margin-inline-start: auto;
    margin-inline-end: -0.5rem;
  }

  .sheet-body {
    flex: 1 1 auto;
    min-height: 0;
    padding: var(--spacing-peer);
    overscroll-behavior: contain;
    overflow-wrap: anywhere;
  }

  .sheet[data-expanded] .sheet-body {
    overflow-y: auto;
  }

  /* With no footer the body takes the safe area. */
  .sheet-body:last-child {
    padding-block-end: calc(var(--spacing-peer) + env(safe-area-inset-bottom, 0px));
  }

  .sheet-footer {
    flex: none;
    padding: var(--spacing-part) var(--spacing-peer) calc(var(--spacing-part) + env(safe-area-inset-bottom, 0px));
  }

  @keyframes sheet-scrim-fade {
    from {
      opacity: 0;
    }

    to {
      opacity: 1;
    }
  }

  @media (forced-colors: active) {
    .sheet {
      border-color: CanvasText;
    }

    .sheet-grabber {
      background-color: CanvasText;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .sheet-scrim {
      animation: none;
    }
  }
}
```

If Task 7's record says `data-expanded` is never set without snap points, the `.sheet[data-expanded] .sheet-body` rule becomes `.sheet-body { overflow-y: auto; }` in the body block. If React Aria positions the sheet with inline `position: absolute`, `margin-inline: auto` centres it only with `inset-inline: 0`; add that declaration and note it in the record. Right to left: the two start radii are logical; nothing else is directional.

**The WebKit project.** `apps/storybook/vitest.config.ts` gains a third project after `storybook-dark`:

```ts
      {
        // The sheet's stories again in WebKit, the engine a phone runs: only stories tagged webkit.
        extends: true,
        plugins: [storybookTest({ configDir, tags: { include: ['webkit'] } })],
        test: {
          name: 'storybook-webkit',
          browser: {
            enabled: true,
            headless: true,
            provider: playwright({}),
            instances: [{ browser: 'webkit' }],
          },
        },
      },
```

`apps/storybook/package.json`'s `test` becomes `vitest run --project=storybook --project=storybook-dark --project=storybook-webkit`. Every Sheet story carries `tags: ['webkit']` (on the meta). `.github/workflows/ci.yml`'s step "Install Chromium for story and end-to-end tests" (`pnpm --filter @snapshot-ui/storybook exec playwright install --with-deps chromium`) becomes "Install Chromium and WebKit for story and end-to-end tests" with `chromium webkit`; the visual job runs in the Playwright image, which has every browser, and is unchanged.

**jsdom stubs**, `packages/react/test/setup.ts`, before the cleanup hook, each only when absent: `IntersectionObserver` and `ResizeObserver` as classes with no-op `observe`, `unobserve`, `disconnect` and `takeRecords`; `Element.prototype.scrollTo` and `scrollBy` as no-ops; `window.matchMedia` returning `{ matches: false, media, onchange: null, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {}, dispatchEvent: () => false }`. A comment says React Aria's Sheet needs them and jsdom has none.

**Tests, written first:**
- `Sheet.test.tsx` (queries on `document.body`): named by the title (`h2`), still named with `isTitleHidden`; `description` renders `.sheet-description` and describes the dialog; the grabber is `aria-hidden` and absent with `hasGrabber={false}`; the close button by default, named `closeLabel`, closes, absent with `hasCloseButton={false}`; `footer` only when given; `isDismissable={false}` renders React Aria's non-dismissable overlay (Escape leaves it open and a backdrop press does nothing); Escape closes otherwise; a scrim pointer down closes; controlled from `isOpen` with `onOpenChange(false)` on Escape; `children` as a function receives `close`; `className` on `.sheet`, `overlayClassName` on the backdrop, `ref` on `.sheet-content`; the backdrop carries `overlay-scrim`; `snapPoints` reach React Aria (the sheet renders one `DetentPoint` marker per entry, found by its inline `scroll-snap-align` or by the count of absolutely positioned markers inside the sheet; the record names the selector); the sheet copies `data-theme` from a dark trigger; `document.documentElement.style.overflow` is `hidden` while open; axe on the open state with and without the title hidden.
- `server-render.test.tsx`: `['Sheet, closed', <SheetTrigger><Button>More</Button><Sheet title="More" isTitleHidden>...</Sheet></SheetTrigger>, ['<button', '>More<'], ['sheet-content']]`.
- `empty-parts.test.tsx`, `EMPTY_OVERLAYS` row: `['Sheet', <Sheet isOpen title="More" description="" footer={false}>{''}</Sheet>]` finds no `.sheet-description` and no `.sheet-footer`.
- `css.test.js`, `describe('src/components/sheet.css')`: the overlay's `z-index: var(--z-modal);`; the panel's width cap, both `max-height` lines in order (`92vh` then `92dvh`), the two start radii and no end radius, the float fill, the hairline, and no `box-shadow`; the grabber band's 44px and the grabber's 40px by 4px in `--radius-dot` and `--color-boundary`; the header's inline padding; the body's padding and the safe-area rules with the exact `env()` strings; the keyframes exist; the forced-colors block gives the grabber `CanvasText`; the reduced-motion block removes the backdrop animation. Import order: `sheet.css` after `drawer.css`.
- `contrast.test.js`, `describe('the sheet')`: `boundary` on `float` at `NON_TEXT` is in the gate already (3.48 light, 5.21 dark), cited for the grabber.
- Stories, `Sheet.stories.tsx`, title `Components/Sheet`, meta `tags: ['webkit']`, each with a `SheetTrigger` and `defaultOpen`, and every visual story also asserting its layout in a play function with no pointer interaction:
  - `Basic` (visual): title "Filter transactions", a description, a short form body, a footer with a primary Button. Play: `.sheet` bottom is at `innerHeight`, its top corners are `--radius-stadium` (`tokenPixels`) and its bottom corners 0, the grabber is 40 by 4.
  - `Overflowing` (visual): forty rows. Play: the sheet's height is at most `0.92 * innerHeight`, the body's `scrollHeight` exceeds its `clientHeight`, the footer is in view.
  - `HiddenTitle` (visual): `isTitleHidden`, the "More" list of links, a footer account row. Play: the dialog is named "More"; no visible heading.
  - `Focused` (visual): play Tabs once from the dialog to the close button and expects the ring (`outlineStyle` solid, 2px). Keyboard only.
  - `InDarkScope` (visual): the trigger in a dark card. Play: `.sheet` has `data-theme="dark"`, the backdrop none.
  - `ScrollToDismiss` (`no-visual`): play scrolls `[data-sheet-scroll]` to the position a downward swipe reaches (the record gives it: the scroll end that carries the sheet out, along the overlay's swipe axis) and expects the sheet to close within 1500ms (`waitFor` on `queryByRole('dialog')` being null). This is the mechanism a swipe drives; the touch gesture itself is the spike's record and the docs test below.
  - `Stacked` (`no-visual`): a sheet whose body opens a second sheet; play opens it, expects `data-stack-index="1"` on the second, the second backdrop's computed background transparent, Escape to close only the second.
  - `NotDismissable` (`no-visual`): `isDismissable={false}`; play presses Escape and the backdrop and expects the sheet open, then presses the close button and expects it closed.
  - `KeyboardUp` (`no-visual`, 375 wide wrapper): a `TextField` in the body; play focuses it and asserts the field's bottom is above `innerHeight` (the shrunk visual viewport is the spike's and WebKit's).
- Docs end-to-end, `docs.spec.ts`: `test('the sheet page opens a sheet that a wheel swipe, Escape and its button close')` at 375 by 760 with `hasTouch: true`: open the basic example, `page.mouse.move` to the sheet's middle and `page.mouse.wheel(0, <delta from the record>)`, expect it closed; reopen, Escape; reopen, the close button; `test('a sheet caps at 92% of the viewport and scrolls inside')` on the overflowing example. `components.spec.ts`, forced colors: `test('a sheet keeps its edge and its grabber')` (border and grabber fill are the CanvasText probe). Maps: `'sheet'` in `NO_LONG_TEXT`, `SERVER_RENDERED: ['.stage .button']`.

**Docs:**
- `sheet.mdx`, title "Sheet", description "A bottom sheet for phones that rises from the edge, swipes away, and still closes from the keyboard.", icon `PanelBottom`. Sections: `## Basic` (`sheet-basic`), `## A list that names itself` (`isTitleHidden`, a footer, `sheet-more`), `## Stop points` (`snapPoints={['40%', '100%']}`, the body scrolls once fully open, `sheet-snap-points`), `## Usage` (open from `SheetTrigger` or control with `isOpen`; the swipe is an enhancement and the close button and Escape are always there while dismissable; `isDismissable={false}` for a sheet a button must close; it is a phone surface that still reads on a tablet at 36rem; drag on a mouse is a wheel scroll), `## Props` (`Pick<SheetProps, 'title' | 'isTitleHidden' | 'description' | 'children' | 'footer' | 'snapPoints' | 'isDismissable' | 'hasGrabber' | 'hasCloseButton' | 'closeLabel' | 'isOpen' | 'defaultOpen' | 'onOpenChange' | 'className' | 'overlayClassName'>`), `## Accessibility` (a dialog named by its title; focus moves in once the sheet has entered and returns; the grabber is decoration; the page behind does not scroll; `<Keys rows={[['Tab', 'Cycles through the controls inside.'], ['Escape', 'Closes the sheet.'], ['Enter Space', 'Press a button or follow a link.']]} />`), `## Design rules` (dos: use a sheet on a phone for a list or a short form, keep the close button, give a long list snap points; donts: never a sheet on desktop where a dialog or a drawer fits, never hide the close button on a dismissable sheet, never taller than 92% of the screen).
- Examples: `sheet-basic.tsx`, `sheet-more.tsx`, `sheet-snap-points.tsx` (server files).
- `meta.json`: `"sheet"` after `"segmented-control"`. Index, footer and READMEs: "Sheet".
- `docs/design-system.md`, `## Sheet`, after the record: the derivation table of spec 7.4 with each value's rule, the 92dvh as the consumer's number, `min(100%, 36rem)`, no shadow, the grabber (boundary on float 3.48 and 5.21), the header and body padding, the safe area, `--z-modal` on the overlay, the motion and the keyframes, the forced-colors rules, the WebKit project, the jsdom stubs, and the fallback's status (built or not).

**Changeset:** append to `.changeset/overlays-drawer-sheet.md`: "Sheet is the bottom sheet for phones on React Aria's Sheet family: a grabber, a title that may be hidden, a description, a scrolling body, a safe-area footer, a close button, swipe-to-dismiss and snap points, up to 92% of the viewport. `SheetTrigger` is re-exported." (If the fallback was built: "on React Aria's Modal, with no dragging yet".)

**The fallback (only if Task 7's record says so).** `Sheet` renders `ModalFrame` with `overlayClass="sheet-overlay" panelClass="sheet"` and the same parts inside a `RACDialog.sheet-content`; `snapPoints` is accepted and ignored with one development warning per page (`let warned = false; console.warn(...)`), and `isDismissable` maps to the frame's props. `sheet.css` then also has `.sheet-overlay { align-content: end; justify-items: center; padding: 0; }` and `.sheet { transition: translate 180ms ease; } .sheet:is([data-entering], [data-exiting]) { translate: 0 100%; }` with `transition: none` under reduced motion, no keyframes, and the body scrolls always. The `ScrollToDismiss` story is not written; the WebKit project is still added, since the fallback is the first phone surface too. The record says dragging is deferred.

**Steps:**

- [ ] **Step 1: Write the failing tests** listed above, stories and the WebKit project included.
- [ ] **Step 2: Run them and watch them fail**

```bash
pnpm turbo run build --filter=@snapshot-ui/core --filter=@snapshot-ui/react
pnpm --filter @snapshot-ui/core exec vitest run test/css.test.js test/contrast.test.js
pnpm --filter @snapshot-ui/react exec vitest run
pnpm --filter @snapshot-ui/storybook exec vitest run --project=storybook --project=storybook-dark --project=storybook-webkit Sheet
pnpm turbo run build --filter=@snapshot-ui/docs
lsof -nP -iTCP:3100 -sTCP:LISTEN
pnpm --filter @snapshot-ui/docs test:e2e
```

Expected: the core run FAILS every sheet CSS test; the React run FAILS to import `./Sheet`; the Storybook run fails to import the story file in all three projects (the WebKit project runs, which proves the browser is installed: `pnpm --filter @snapshot-ui/storybook exec playwright install webkit` if it is not); the end-to-end run FAILS the completeness guards (`+ "sheet"`) and the new tests.

- [ ] **Step 3: Write the component, the stubs, the CSS, the stories, the examples, the page, the record and the changeset.** Add the `Sheet` size-limit entry with an 8 kB placeholder (spec 16 names it as one of the two heavy entries), measure, and set the limit by the rule.
- [ ] **Step 4: Run the tests and watch them pass**

```bash
pnpm turbo run build --filter=@snapshot-ui/core --filter=@snapshot-ui/react
pnpm --filter @snapshot-ui/core exec vitest run
pnpm --filter @snapshot-ui/react exec vitest run
pnpm --filter @snapshot-ui/storybook exec vitest run --project=storybook --project=storybook-dark --project=storybook-webkit Sheet
```

Expected: all pass: the 10 core tests, about 22 Sheet tests plus the two shared rows, and the 9 stories in three projects (27 runs).

- [ ] **Step 5: Run everything** (the nine commands of Task 1's Step 5; the Storybook `test` now runs three projects). Expected: every gate green; one more static page; the end-to-end run passes with the page's 4 loop tests, the two new sheet tests and the forced-colors one; `Sheet` within its limit; `pnpm verify` exits 0.
- [ ] **Step 6: Visual baselines.** Expected: 25 new files for `basic`, `overflowing`, `hidden-title`, `focused` and `in-dark-scope`, no changed file. What to look at: a white panel flush with the bottom edge, 40px top corners, the grabber centred above the title; at 375 the full width, at 1280 a 576px panel centred; the overflowing one capped under the top of the viewport with the footer pinned; the ring on the close button in `focused`.
- [ ] **Step 7: Commit**

```bash
git add .changeset/overlays-drawer-sheet.md .github/workflows/ci.yml "apps/docs/app/(home)/home-page.tsx" apps/docs/content/docs/components/meta.json apps/docs/content/docs/components/sheet.mdx apps/docs/examples/index.ts apps/docs/examples/sheet-basic.tsx apps/docs/examples/sheet-more.tsx apps/docs/examples/sheet-snap-points.tsx apps/docs/tests/components.spec.ts apps/docs/tests/docs.spec.ts apps/storybook/package.json apps/storybook/vitest.config.ts docs/design-system.md packages/core/README.md packages/core/src/components/sheet.css packages/core/src/styles.css packages/core/test/contrast.test.js packages/core/test/css.test.js packages/react/.size-limit.json packages/react/README.md packages/react/src/index.ts packages/react/src/overlay/ModalFrame.tsx packages/react/src/sheet/Sheet.stories.tsx packages/react/src/sheet/Sheet.test.tsx packages/react/src/sheet/Sheet.tsx packages/react/src/sheet/index.ts packages/react/test/empty-parts.test.tsx packages/react/test/server-render.test.tsx packages/react/test/setup.ts "apps/storybook/tests/visual/__screenshots__/components-sheet--*.png"
git commit -m "feat: add Sheet"
```

---
### Task 9: Popover

**Goal:** the float chrome a Menu opens in, and a free-content form for a filter chip's panel: the frame edge, the surface corner, the float shadow, 8px from the trigger, flipped and shifted to fit, with a padded variant and a trigger-width floor. Implements spec 8.1 to 8.3, the Popover ruling of 13.1 and 13.2 item 7.

**Files:**
- Create: `packages/react/src/popover/Popover.tsx`, `packages/react/src/popover/index.ts`
- Modify: `packages/react/src/index.ts`, `packages/react/.size-limit.json`
- Test: `packages/react/src/popover/Popover.test.tsx` (create), `packages/react/test/server-render.test.tsx`
- Test (stories): `packages/react/src/popover/Popover.stories.tsx` (create)
- Create: `packages/core/src/components/popover.css`
- Modify: `packages/core/src/styles.css` (import after `sheet.css`)
- Test: `packages/core/test/css.test.js`
- Create: `apps/docs/content/docs/components/popover.mdx`, `apps/docs/examples/popover-basic.tsx`, `apps/docs/examples/popover-match-width.tsx`
- Modify: `apps/docs/content/docs/components/meta.json`, `apps/docs/examples/index.ts`, `apps/docs/app/(home)/home-page.tsx`
- Test: `apps/docs/tests/components.spec.ts`, `apps/docs/tests/docs.spec.ts`
- Modify: `packages/core/README.md`, `packages/react/README.md`
- Modify: `docs/design-system.md` (a `## Popover` section appended to Appendix B)
- Create: `.changeset/overlays-popover-menu.md` (Task 10 appends)
- Create (Docker step): 25 baselines, `apps/storybook/tests/visual/__screenshots__/components-popover--*.png`. None changes.

**Interfaces:**
- Consumes: from `react-aria-components` 1.22.1, `Popover` as `RACPopover` (`placement`, `offset` defaulting to 8, `shouldFlip` default true, `containerPadding` default 12, `triggerRef`, `isNonModal`, `shouldCloseOnBlur`, a render-function `className` with `{ trigger, placement, isEntering, isExiting }`; it sets `dir` from the locale, `data-trigger`, `data-placement`, writes `--trigger-width` and the inline `maxHeight` and z-index 100000, renders `role="dialog"` with a hidden dismiss button unless `isNonModal`, and reads `PopoverContext` for its `triggerRef` when a trigger component opened it), `PopoverContext`, `useSlottedContext`, `DialogTrigger`, `composeRenderProps`, the `Placement` type; `useOverlayScope` and `mergeRefs` (Task 3); `cx`; `overlay.css`.
- Produces `Popover.tsx`, a client module, exported from `@snapshot-ui/react`:

```ts
'use client';

export interface PopoverProps extends Omit<RACPopoverProps, 'className' | 'children' | 'style'> {
  children: ReactNode | ((values: PopoverRenderProps & { defaultChildren: ReactNode | undefined }) => ReactNode);
  /** Pads free content 24px. Lists and menus pad themselves, so it is off by default. @default false */
  isPadded?: boolean;
  /** Makes the trigger's width the popover's minimum. @default false */
  matchTriggerWidth?: boolean;
  /** @default 'bottom start' */
  placement?: Placement;
  /** The gap to the trigger. @default 8 */
  offset?: number;
  /** Goes on the popover element, merged after the library's classes. */
  className?: string | ((values: PopoverRenderProps & { defaultClassName: string | undefined }) => string);
  ref?: Ref<HTMLElement>;
}

export function Popover(props: PopoverProps): ReactElement;
```

- Later tasks rely on: `Popover` as Menu's chrome (Task 10 passes `className="menu-popover"`), and its scope copy from `PopoverContext`'s `triggerRef`.

**Behavior:**
1. **Markup.** React Aria's popover element with the classes `overlay popover`, plus `popover-padded` with `isPadded`, plus `popover-match-trigger` with `matchTriggerWidth`, then `className`. Opened by `DialogTrigger` it is `role="dialog"`, named by the trigger (`aria-labelledby`), and React Aria focuses it; opened by `MenuTrigger` (Task 10) the menu inside takes focus.
2. **Placement.** `bottom start` 8px from the trigger by default, flipped to the other side when there is no room, shifted inside React Aria's 12px `containerPadding`, height-capped by the inline `maxHeight`. `data-placement` says where it landed.
3. **Dismissal.** Outside press, Escape, and blur. Focus returns to the trigger.
4. **Scope.** The root copies the scope from the trigger React Aria gives through `PopoverContext` (`useSlottedContext(PopoverContext)?.triggerRef`, or the `triggerRef` prop when given), not from `document.activeElement`. `dir` is React Aria's.
5. **No arrow.**
6. **Server.** Closed, nothing renders; the trigger does.

**CSS**, the whole of `popover.css`:

```css
/*
 * Popover, the float surface a menu, a listbox or a free-content panel opens in: the float fill, the
 * frame in both themes because a float can open over another float, the surface corner, the float
 * shadow, 8px from the trigger, no arrow. Derived in docs/design-system.md ("Popover").
 */
@layer components {
  .popover {
    box-sizing: border-box;
    max-width: calc(100vw - 2rem);
    max-height: inherit;
    overflow: auto;
    border: 1px solid var(--color-frame);
    border-radius: var(--radius-surface);
    background-color: var(--color-float);
    box-shadow: var(--shadow-float);
    outline: none;
    transition:
      opacity 140ms ease-out,
      translate 140ms ease-out;
  }

  .popover-padded {
    padding: var(--spacing-peer);
  }

  .popover-match-trigger {
    min-width: var(--trigger-width);
  }

  /* 4px toward the trigger: a popover under its trigger rises from 4px lower, one above sinks from 4px higher. */
  .popover:is([data-entering], [data-exiting]) {
    opacity: 0;
  }

  .popover[data-placement='bottom']:is([data-entering], [data-exiting]) {
    translate: 0 -4px;
  }

  .popover[data-placement='top']:is([data-entering], [data-exiting]) {
    translate: 0 4px;
  }

  .popover[data-placement='right']:is([data-entering], [data-exiting]) {
    translate: -4px 0;
  }

  .popover[data-placement='left']:is([data-entering], [data-exiting]) {
    translate: 4px 0;
  }

  @media (forced-colors: active) {
    .popover {
      border-color: CanvasText;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .popover {
      transition: none;
    }
  }
}
```

Right to left: `start` placements resolve through React Aria; nothing here is physical.

**Tests, written first:**
- `Popover.test.tsx` (queries on `document.body`): opens from `DialogTrigger` as `role="dialog"` named by the trigger's text; the root has `overlay popover`; `isPadded` adds `popover-padded` and `matchTriggerWidth` adds `popover-match-trigger`; `className` as a string and as a function merges after; `ref` reaches the element; Escape closes and focus returns to the trigger; an outside pointer down closes; `data-placement` is `bottom` by default (jsdom has no layout, so React Aria reports the requested side); the root copies `data-theme` from a trigger inside a dark scope even when focus is elsewhere (focus a button outside the scope first, then open the popover through a controlled `isOpen` with a `triggerRef` inside the scope); `dir` is `rtl` under `I18nProvider locale="ar-EG"`; axe on the open state.
- `server-render.test.tsx`: `['Popover, closed', <DialogTrigger><Button>Filter</Button><Popover isPadded>Panel</Popover></DialogTrigger>, ['<button', '>Filter<'], ['popover']]`.
- `css.test.js`, `describe('src/components/popover.css')`: the base block's width cap, `overflow: auto;`, the frame, the surface corner, the float fill and shadow, `outline: none;`; `popover-padded` pads `--spacing-peer`; `popover-match-trigger` reads `--trigger-width`; the four placement slides with their exact `translate` values; the forced-colors border; the reduced-motion block after the transition. Import order: `popover.css` after `sheet.css`.
- Stories, `Popover.stories.tsx`, title `Components/Popover`, each with a `DialogTrigger` and `defaultOpen`:
  - `Below` (visual): a padded panel with a `CheckboxGroup` of three and a primary Button. Play: `data-placement="bottom"`, the popover's top is 8px below the trigger's bottom (within 1px).
  - `Flipped` (visual): the trigger in a wrapper with `position: fixed; bottom: 16px; left: 50%`. Play: `data-placement="top"`, the popover's bottom is 8px above the trigger's top.
  - `Padded` (visual): a paragraph in a padded popover. Play: the computed padding is `tokenPixels('--spacing-peer')`.
  - `MatchTriggerWidth` (visual): a 240px-wide trigger. Play: the popover's width is at least the trigger's.
  - `InDarkScope` (visual): the trigger in a dark card. Play: the root has `data-theme="dark"` and `data-shape` copied from a `data-shape="soft"` wrapper around the trigger.
  - `Dismissal` (`no-visual`): starts closed; play opens by keyboard, expects focus on the popover, Tab to reach the controls, Escape to close and return focus; then opens by click and clicks outside.
- Docs end-to-end, `docs.spec.ts`: `test('the popover page opens a padded panel that flips near the bottom of the window')` (open at 1280 by 720 with the page scrolled so the trigger is near the bottom; expect `data-placement="top"`; Escape returns focus). `components.spec.ts` maps: `'popover'` in `NO_LONG_TEXT`, `SERVER_RENDERED: ['.stage .button']`.

**Docs:**
- `popover.mdx`, title "Popover", description "The float surface a menu, a listbox or a small panel opens in, 8px from its trigger, flipped to fit.", icon `MessageSquareMore`. Sections: `## Free content` (`isPadded`, a filter panel, `popover-basic`), `## Matching the trigger` (`matchTriggerWidth`, `popover-match-width`), `## Usage` (open from `DialogTrigger`; Menu, Select and ComboBox bring their own; `placement` and `offset`; it flips and shifts to stay on screen; no arrow), `## Props` (`Pick<PopoverProps, 'children' | 'isPadded' | 'matchTriggerWidth' | 'placement' | 'offset' | 'isOpen' | 'defaultOpen' | 'onOpenChange' | 'className'>`), `## Accessibility` (a dialog named by its trigger when opened from `DialogTrigger`; focus moves in and returns; `<Keys rows={[['Escape', 'Closes the popover.'], ['Tab', 'Moves through the content and out, which closes it.']]} />`), `## Design rules` (dos: keep it to one small task, pad free content, let a list pad itself; donts: never a popover for a question or a form that saves, never wider than the viewport less 2rem, never an arrow).
- Examples: `popover-basic.tsx` (server file), `popover-match-width.tsx` (server file).
- `meta.json`: `"popover"` after `"link"`. Index, footer and READMEs: "Popover".
- `docs/design-system.md`, `## Popover`: the source popups (spec 2), why the frame in both themes, the surface corner and the float shadow, the 8px offset and the 12px container padding, the width cap, the 140ms ease-out fade with the 4px slide by placement, no arrow, and that nothing new is measured (float, frame, ink and slate pairs are gated).

**Changeset** `.changeset/overlays-popover-menu.md`:

```markdown
---
'@snapshot-ui/core': minor
'@snapshot-ui/react': minor
---

Add Popover, the float surface a menu or a small panel opens in: the frame edge, the surface corner and the float shadow, 8px from its trigger, flipped to fit, with `isPadded` for free content and `matchTriggerWidth`.
```

**Steps:**

- [ ] **Step 1: Write the failing tests** listed above, stories included.
- [ ] **Step 2: Run them and watch them fail** (the seven commands of Task 4's Step 2, with `Popover` as the Storybook filter). Expected: the core run FAILS every popover CSS test; the React run FAILS to import `./Popover`; the Storybook run fails to import the story file; the end-to-end run FAILS the completeness guards (`+ "popover"`) and the new test.
- [ ] **Step 3: Write the component, the CSS, the stories, the examples, the page, the record and the changeset.** Add the `Popover` size-limit entry with a 2 kB placeholder, measure, and set the limit by the rule.
- [ ] **Step 4: Run the tests and watch them pass** (the four commands of Task 4's Step 4, with `Popover` as the filter). Expected: all pass: the 8 core tests, about 14 Popover tests plus the server row, and the 6 stories in both projects.
- [ ] **Step 5: Run everything** (the nine commands of Task 1's Step 5). Expected: every gate green; one more static page; the end-to-end run passes with the page's 4 loop tests and the new one; `Popover` within its limit; `pnpm verify` exits 0.
- [ ] **Step 6: Visual baselines.** Expected: 25 new files for `below`, `flipped`, `padded`, `match-trigger-width` and `in-dark-scope`, no changed file. What to look at: a white 24px-cornered panel with a faint frame and a soft shadow 8px under its button; the flipped one above its button at the bottom of the frame; the dark one dark on a light page.
- [ ] **Step 7: Commit**

```bash
git add .changeset/overlays-popover-menu.md "apps/docs/app/(home)/home-page.tsx" apps/docs/content/docs/components/meta.json apps/docs/content/docs/components/popover.mdx apps/docs/examples/index.ts apps/docs/examples/popover-basic.tsx apps/docs/examples/popover-match-width.tsx apps/docs/tests/components.spec.ts apps/docs/tests/docs.spec.ts docs/design-system.md packages/core/README.md packages/core/src/components/popover.css packages/core/src/styles.css packages/core/test/css.test.js packages/react/.size-limit.json packages/react/README.md packages/react/src/index.ts packages/react/src/popover/Popover.stories.tsx packages/react/src/popover/Popover.test.tsx packages/react/src/popover/Popover.tsx packages/react/src/popover/index.ts packages/react/test/server-render.test.tsx "apps/storybook/tests/visual/__screenshots__/components-popover--*.png"
git commit -m "feat: add Popover"
```

---
### Task 10: Menu

**Goal:** a true `role="menu"` in a Popover: items with an icon, a label, a description, a shortcut drawn as a key and a danger variant; sections with headings and their own selection; separators; single selection as the ink pill with a check and multiple as the check alone; links through `RouterProvider`; and the private `MenuList` the CommandPalette reuses. Implements spec 9.1 to 9.3, the Menu ruling of 13.1 and 13.2 item 8.

**Files:**
- Create: `packages/react/src/menu/Menu.tsx`, `packages/react/src/menu/MenuItem.tsx`, `packages/react/src/menu/MenuSection.tsx`, `packages/react/src/menu/MenuSeparator.tsx`, `packages/react/src/menu/index.ts`, `packages/react/src/overlay/Shortcut.tsx`
- Modify: `packages/react/src/index.ts`, `packages/react/.size-limit.json`
- Test: `packages/react/src/menu/Menu.test.tsx`, `packages/react/src/overlay/Shortcut.test.tsx` (create), `packages/react/test/server-render.test.tsx`, `packages/react/test/empty-parts.test.tsx`
- Test (stories): `packages/react/src/menu/Menu.stories.tsx` (create), `packages/react/src/rtl/RightToLeft.stories.tsx`
- Create: `packages/core/src/components/menu.css`
- Modify: `packages/core/src/styles.css` (import after `popover.css`)
- Test: `packages/core/test/css.test.js`, `packages/core/test/contrast.test.js`
- Create: `apps/docs/content/docs/components/menu.mdx`, `apps/docs/examples/menu-basic.tsx`, `apps/docs/examples/menu-selection.tsx`, `apps/docs/examples/menu-links.tsx`
- Modify: `apps/docs/content/docs/components/link.mdx` (the shared `RouterProvider` snippet), `apps/docs/content/docs/components/meta.json`, `apps/docs/examples/index.ts`, `apps/docs/app/(home)/home-page.tsx`
- Test: `apps/docs/tests/components.spec.ts`, `apps/docs/tests/docs.spec.ts`
- Modify: `packages/core/README.md`, `packages/react/README.md`
- Modify: `docs/design-system.md` (a `## Menu` section appended to Appendix B)
- Modify: `.changeset/overlays-popover-menu.md`
- Create (Docker step): 25 baselines, `apps/storybook/tests/visual/__screenshots__/components-menu--*.png`. None changes.

**Interfaces:**
- Consumes: from `react-aria-components` 1.22.1, `MenuTrigger` (gives the trigger `aria-haspopup`, `aria-expanded` and `data-pressed`, and the popover its `triggerRef`, `trigger: 'MenuTrigger'` and state), `Menu` as `RACMenu` (`role="menu"`, `shouldFocusWrap`, `shouldCloseOnSelect`, `renderEmptyState`, `items`, selection props, `disabledKeys`, `onAction`; it focuses its first item on open by press, the first or last by Arrow Down or Up, moves with the arrows without wrapping, Home and End, letters for typeahead, closes on Escape and on Tab), `MenuItem` as `RACMenuItem` (renders an `a` with `role="menuitem"` when `href` is given, otherwise a `div`; `menuitemradio` or `menuitemcheckbox` under a selection mode; `data-hovered`, `data-focused`, `data-focus-visible`, `data-selected`, `data-selection-mode`, `data-disabled`; `shouldCloseOnSelect` per item, falling back to its section's or menu's through `MenuItemContext`; `textValue`; the inherited `render` prop; it provides `TextContext` with `label` and `description` slots that wire `aria-labelledby` and `aria-describedby`, and `KeyboardContext`), `MenuSection` as `RACMenuSection` (`selectionMode`, `selectedKeys`, `onSelectionChange`, `shouldCloseOnSelect`, `items`; provides `HeaderContext`), `Header`, `Separator`, `Keyboard`, `Text`, `Collection`, `composeRenderProps`, the `Placement` and `Key` types; `Popover` (Task 9); Lucide `Check`; `cx`, `present`.
- Produces `Menu.tsx`, a client module:

```ts
'use client';

export { MenuTrigger, type MenuTriggerProps } from 'react-aria-components';

export interface MenuProps<T extends object> extends Omit<RACMenuProps<T>, 'className' | 'style'> {
  /** Where the popover opens. @default 'bottom start' */
  placement?: Placement;
  /** Goes on the menu element. */
  className?: string | ((values: MenuRenderProps & { defaultClassName: string | undefined }) => string);
  /** Goes on the popover around it. */
  popoverClassName?: string;
  ref?: Ref<HTMLDivElement>;
}

/** A menu in its popover. Compose `MenuTrigger`, a button and a `Menu`. */
export function Menu<T extends object>(props: MenuProps<T>): ReactElement;

/** Internal: React Aria's Menu wearing the `menu` class with the library's close-on-select default. CommandPalette renders it inline. Not exported from the package index. */
export interface MenuListProps<T extends object> extends Omit<RACMenuProps<T>, 'className' | 'style'> {
  className?: string | ((values: MenuRenderProps & { defaultClassName: string | undefined }) => string);
  ref?: Ref<HTMLDivElement>;
}
export function MenuList<T extends object>(props: MenuListProps<T>): ReactElement;
```

- Produces `MenuItem.tsx`, `MenuSection.tsx`, `MenuSeparator.tsx`, client modules:

```ts
export interface MenuItemProps<T extends object = object>
  extends Omit<RACMenuItemProps<T>, 'className' | 'children' | 'style'> {
  /** The label. A string is also the item's text value, for typeahead and announcement. */
  children: ReactNode;
  /** A 16px icon at the start, hidden from assistive technology. */
  icon?: ReactNode;
  /** A second line under the label, in slate. It becomes the item's accessible description. */
  description?: ReactNode;
  /** A key hint at the end, such as "Q" or "Mod ,", drawn as a key. Keys are separated by spaces; "Mod" is the platform's modifier after mount. */
  shortcut?: string;
  /** `danger` draws the label and icon in the error color, for an item that loses something. @default 'default' */
  variant?: 'default' | 'danger';
  className?: string | ((values: MenuItemRenderProps & { defaultClassName: string | undefined }) => string);
  ref?: Ref<HTMLDivElement>;
}
export function MenuItem<T extends object = object>(props: MenuItemProps<T>): ReactElement;

export interface MenuSectionProps<T extends object = object>
  extends Omit<RACMenuSectionProps<T>, 'className' | 'style'> {
  /** The heading above the section's items, in the overline style. */
  title?: ReactNode;
  className?: string;
  ref?: Ref<HTMLElement>;
}
export function MenuSection<T extends object = object>(props: MenuSectionProps<T>): ReactElement;

export interface MenuSeparatorProps {
  className?: string;
  ref?: Ref<HTMLElement>;
}
export function MenuSeparator(props: MenuSeparatorProps): ReactElement;
```

- Produces `packages/react/src/overlay/Shortcut.tsx`, a client module, internal (used by MenuItem here, CommandPalette in Task 12 and Tooltip in Task 13):

```ts
'use client';

export interface ShortcutProps {
  /** Keys separated by spaces, such as "Q", "Mod ," or "Mod K". */
  keys: string;
  /** The chip's class, after nothing: each part names its own (`menu-item-shortcut`, `tooltip-shortcut`). */
  className: string;
}

/** The platform's modifier for "Mod": "Mod" on the server and the first render, then the Command symbol on Apple platforms and "Ctrl" elsewhere, set in an effect so hydration matches. */
export function useModifierKey(): string;

/** One key chip (React Aria's `Keyboard`, a `kbd`) holding the keys with "Mod" resolved, space-separated. */
export function Shortcut(props: ShortcutProps): ReactElement;
```

- Later tasks rely on: `MenuList`, `MenuItem`, `MenuSection` and `MenuSeparator` inline without a popover (Task 12), the row classes and states of `menu.css` (Task 12 and the choice-controls spec), and `Shortcut` (Tasks 12 and 13).

**Behavior:**
1. **Markup.** `Menu` renders `<Popover className="menu-popover" placement={placement}>` (so the popover is `overlay popover menu-popover <popoverClassName>`) holding `MenuList`, which is `RACMenu.menu`. An item is `div.menu-item` (or `a.menu-item[role="menuitem"][href]`), plus `menu-item-danger` for the danger variant, holding in order: `span.menu-item-icon[aria-hidden="true"]` with the icon when given; `span.menu-item-text` holding `Text slot="label"` as `span.menu-item-label` and `Text slot="description"` as `span.menu-item-description` when given; the `Shortcut` as `kbd.menu-item-shortcut` when `shortcut` is given; and, only inside a selection mode (`selectionMode` on the item's render props is `single` or `multiple`), `span.menu-item-check[aria-hidden="true"]` holding Lucide's `Check`. A section is `section.menu-section` holding `header.menu-heading` with the title when given, then its items through `Collection`; a separator is `hr`-role `div.menu-separator` (React Aria's `Separator`).
2. **Text value.** A string `children` is the item's `textValue`; otherwise the caller's `textValue` passes through.
3. **Keys**, all React Aria's: Arrow Down and Up move without wrapping, Home and End jump, letters typeahead, Enter and Space activate, Escape closes and returns focus, Tab moves focus out and closes. Opening by press focuses the first item; by Arrow Down or Up the first or last. The trigger carries `aria-haspopup`, `aria-expanded` and `data-pressed` while open.
4. **Pointer.** Hover sets `data-focused` on the item; the wash keys on `data-focused`, the ring on `data-focus-visible` only.
5. **Selection.** `selectionMode="single"` makes the items `menuitemradio`, `multiple` makes them `menuitemcheckbox`, on the menu or per section. `Menu` and `MenuSection` pass `shouldCloseOnSelect` as the caller's value, else `true` for `single` and `false` for `multiple` (and `true` with no selection), so a choice in single mode closes and a multiple one stays open, Space from the keyboard included; an item's own `shouldCloseOnSelect` overrides.
6. **Links.** An item with `href` renders an anchor with `role="menuitem"`, so middle-click works, and a plain press navigates through React Aria's `RouterProvider`. The inherited `render` prop is honoured, for Next's own `Link`.
7. **Danger** is a look, not a behavior.
8. **Scope and direction** are the popover's.
9. **Server.** Closed, nothing renders; the trigger does.
10. **`Shortcut`:** renders `Mod` as "Mod" on the server and the first client render, then the platform modifier (`⌘` when `navigator.platform` starts with `Mac`, `iPhone`, `iPad` or `iPod`, else `Ctrl`), from an effect.

**CSS**, the whole of `menu.css`:

```css
/*
 * Menu: the rows every list popup shares (the listbox of the choice controls inherits them). A
 * 24px popup holds 20px rows: the control step, 40px tall (44px on touch), 8px by 12px of padding,
 * 4px apart so two washes keep a seam, an action-step label, a slate description, a 16px icon, a
 * key chip at the end and a check whose room every row of a selectable list keeps. Single selection
 * is the ink pill with a check; multiple is the check alone. Derived in docs/design-system.md ("Menu").
 */
@layer components {
  /* The source's popups are 14.5 and 15rem; 12rem is the floor and a wider trigger wins. */
  .menu-popover {
    min-width: max(var(--trigger-width), 12rem);
  }

  .menu {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    max-height: inherit;
    padding: var(--spacing-part);
    overflow: auto;
    outline: none;
  }

  .menu-section {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .menu-heading {
    padding: 0.5rem 0.75rem 0.25rem;
    font-size: var(--text-overline);
    line-height: var(--text-overline--line-height);
    letter-spacing: var(--text-overline--letter-spacing);
    font-weight: var(--text-overline--font-weight);
    text-transform: uppercase;
    color: var(--color-slate);
  }

  .menu-separator {
    flex: none;
    height: 1px;
    margin-block: 0.25rem;
    border: 0;
    background-color: var(--color-divider);
  }

  .menu-item {
    display: flex;
    flex: none;
    align-items: center;
    gap: 0.75rem;
    min-height: 40px;
    padding: 0.5rem 0.75rem;
    border-radius: var(--radius-control);
    color: var(--color-ink);
    text-decoration: none;
    cursor: pointer;
    outline: none;
  }

  .menu-item-icon {
    display: inline-flex;
    flex: none;
    color: var(--color-slate);
  }

  .menu-item-icon svg,
  .menu-item-check svg {
    width: 16px;
    height: 16px;
  }

  .menu-item-text {
    display: flex;
    flex: 1 1 auto;
    flex-direction: column;
    gap: 0.125rem;
    min-width: 0;
  }

  .menu-item-label {
    font-size: var(--text-action);
    line-height: var(--text-action--line-height);
    letter-spacing: var(--text-action--letter-spacing);
    font-weight: var(--text-action--font-weight);
    overflow-wrap: anywhere;
  }

  .menu-item-description {
    font-size: var(--text-small);
    line-height: var(--text-small--line-height);
    font-weight: var(--text-small--font-weight);
    color: var(--color-slate);
    overflow-wrap: anywhere;
  }

  /* The one key look (Kbd), at the row's end. */
  .menu-item-shortcut {
    flex: none;
    margin-inline-start: auto;
    padding: 0.125rem 0.375rem;
    border-radius: var(--radius-micro);
    background-color: var(--color-bone);
    color: var(--color-slate);
    font-family: var(--font-sans);
    font-size: 0.75rem;
    line-height: 1;
    letter-spacing: var(--text-overline--letter-spacing);
    font-weight: var(--text-overline--font-weight);
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
  }

  /* Every row of a selectable list keeps the check's room, so the width never changes. */
  .menu-item-check {
    display: inline-flex;
    flex: none;
    visibility: hidden;
  }

  .menu-item[data-selected] .menu-item-check {
    visibility: visible;
  }

  @media (hover: hover) {
    .menu-item[data-hovered] {
      background-color: color-mix(in srgb, var(--color-ink) 5%, transparent);
    }
  }

  /* Hover focuses the item in a React Aria menu, so one state carries the pointer and the keyboard. */
  .menu-item[data-focused] {
    background-color: color-mix(in srgb, var(--color-ink) 5%, transparent);
  }

  .menu-item[data-focused] .menu-item-icon {
    color: var(--color-ink);
  }

  /* Inset: a scrolling list clips an outset ring. */
  .menu-item[data-focus-visible] {
    outline: var(--focus-ring-width) solid var(--focus-ring-color);
    outline-offset: calc(-1 * var(--focus-ring-width));
  }

  .menu-item-danger {
    color: var(--color-error);
  }

  .menu-item-danger .menu-item-icon {
    color: var(--color-error);
  }

  /* Single selection: the ink pill, with every part inverted to canvas. */
  .menu-item[data-selection-mode='single'][data-selected] {
    background-color: var(--color-ink);
    color: var(--color-canvas);
  }

  .menu-item[data-selection-mode='single'][data-selected] :is(.menu-item-icon, .menu-item-check) {
    color: var(--color-canvas);
  }

  .menu-item[data-selection-mode='single'][data-selected] .menu-item-description {
    color: color-mix(in srgb, var(--color-canvas) 70%, transparent);
  }

  .menu-item[data-selection-mode='single'][data-selected] .menu-item-shortcut {
    background-color: color-mix(in srgb, var(--color-canvas) 20%, transparent);
    color: var(--color-canvas);
  }

  .menu-item[data-selection-mode='single'][data-selected][data-focus-visible] {
    outline-color: var(--color-canvas);
  }

  .menu-item[data-disabled] {
    background-color: transparent;
    color: var(--color-taupe);
    cursor: not-allowed;
  }

  .menu-item[data-disabled] :is(.menu-item-icon, .menu-item-shortcut, .menu-item-description) {
    color: var(--color-taupe);
  }

  @media (pointer: coarse) {
    .menu-item {
      min-height: 44px;
    }
  }

  @media (forced-colors: active) {
    .menu-item[data-selected] {
      background-color: Highlight;
      color: HighlightText;
    }

    .menu-item[data-disabled] {
      color: GrayText;
    }
  }
}
```

Nothing animates inside a menu, so there is no reduced-motion block. Right to left: `margin-inline-start: auto` puts the chip at the inline end; the icon leads and the check trails by DOM order.

**Tests, written first:**
- `Shortcut.test.tsx`: renders a `kbd` with the given class and text `Q`; `Mod ,` renders `Mod ,` (`renderToString` in a node-environment case, and the first client render); after effects it is `⌘ ,` with `navigator.platform` stubbed to `MacIntel` and `Ctrl ,` with `Win32` (`vi.spyOn(navigator, 'platform', 'get')`).
- `Menu.test.tsx` (queries on `document.body`): `role="menu"` named by the trigger (`aria-labelledby`), `aria-label` accepted; an item renders its icon hidden, its label as the item's name, its description as the item's description (`aria-describedby` resolves), its shortcut as a `kbd` with the text, `menu-item-danger` for danger, `data-disabled` and `aria-disabled` for `isDisabled`; a section renders `.menu-section` with its `header.menu-heading`; a separator renders `role="separator"`; `selectionMode="single"` renders `menuitemradio` and a selected item shows its check (`visibility` is a CSS matter; assert `data-selected` and `.menu-item-check` presence on every row of the section); `multiple` renders `menuitemcheckbox`; a non-selectable menu renders no `.menu-item-check`; `onAction` receives the key; a single-mode choice calls `onSelectionChange` and closes the menu, a multiple-mode Space keeps it open; an `href` item renders an `a[role="menuitem"]` and a press calls `RouterProvider`'s `navigate` with the href; `render` on an item is honoured (the rendered element is the one returned); Arrow Down and Up move focus, Home and End, typeahead by a letter; Escape closes and returns focus to the trigger; Tab closes; the popover copies `data-shape="soft"` from a trigger inside a soft scope; axe on the open state with a section, a separator, a selected row and a disabled row.
- `server-render.test.tsx`: `['Menu, closed', <MenuTrigger><IconButton aria-label="More"><svg /></IconButton><Menu><MenuItem id="a">Settings</MenuItem></Menu></MenuTrigger>, ['<button', 'aria-label="More"', 'aria-haspopup="menu"'], ['role="menu"']]`.
- `empty-parts.test.tsx`, `EMPTY_OVERLAYS` row: `['MenuItem', <MenuTrigger isOpen><Button>More</Button><Menu><MenuItem id="a" icon={false} description="">Settings</MenuItem></Menu></MenuTrigger>]` finds no `.menu-item-icon` and no `.menu-item-description`.
- `css.test.js`, `describe('src/components/menu.css')`: the popover floor `max(var(--trigger-width), 12rem)`; the list's 8px padding, 4px gap and `outline: none;`; the row's `min-height: 40px;`, `padding: 0.5rem 0.75rem;`, `border-radius: var(--radius-control);` and `cursor: pointer;`; the coarse-pointer block sets `min-height: 44px;`; hover is only inside `@media (hover: hover)` and the `[data-focused]` wash is outside it with the exact `color-mix`; the inset ring with the negative offset and the canvas inversion on the selected row; the single-selection fill and the three inverted parts; the disabled row in taupe with `cursor: not-allowed;`; the danger label in `--color-error`; the heading's overline token and uppercase; the separator's divider; the forced-colors block with `Highlight`, `HighlightText` and `GrayText`; no `transition` or `animation` anywhere. Import order: `menu.css` after `popover.css`.
- `contrast.test.js`, `describe('the menu')`: the gated pairs it cites (ink, slate and error on float at `TEXT`; canvas on ink at `TEXT`); and the composites recorded, not gated, each computed with `composite` and `contrastRatio` in both modes: ink over the 5% ink wash on float at or above `TEXT` (16.65 light, 15.25 dark), slate over it (4.95, 6.08), error over it (6.74, 5.02), canvas at 70% over ink against ink (8.34, 7.34), canvas against canvas at 20% over ink (9.13, 12.37); and the wash itself against float below `NON_TEXT` (1.11, 1.14), a cue, not a boundary.
- Stories, `Menu.stories.tsx`, title `Components/Menu`, each a `MenuTrigger` with an `IconButton aria-label="More"` or a `Button`, the menu `isOpen` through `MenuTrigger`'s `defaultOpen`:
  - `Basic` (visual): items with icons, one with a shortcut `Mod ,`, one with a description, a disabled one, a danger "Log out" with shortcut `Q`, a section heading and a separator. Play: the first item is focused, rows are at least 40px tall, the shortcut chip reads `⌘ ,` or `Ctrl ,`, the list's width is at least `12rem` in px.
  - `SingleSelection` (visual): a section `selectionMode="single"` with Light, Dark, System, "Dark" selected. Play: the selected row's computed background is `tokenColor('--color-ink')` and its label `tokenColor('--color-canvas')`; every row has a `.menu-item-check`; the unselected ones' checks are `visibility: hidden`.
  - `MultipleSelection` (visual): three `menuitemcheckbox` items, two selected. Play: the selected rows have no ink fill (computed background transparent), checks visible on two.
  - `KeyboardFocus` (visual): the second item focused by Arrow Down in the play (keyboard only). Play: `data-focus-visible` on it, the ring inset (`outlineOffset` negative), background the wash (`washColor()`).
  - `InDarkScope` (visual): the trigger in a dark card. Play: the popover has `data-theme="dark"`.
  - `Keys` (`no-visual`): starts closed; play opens by Arrow Down (first item focused), Arrow Up from the first stays (no wrap), End and Home, a letter moves to the matching item, Escape closes and focuses the trigger, Arrow Up opens with the last item focused, Tab closes.
  - `PointerWash` (`no-visual`): play hovers an item and expects the wash and no ring; presses a single-mode item and expects the menu closed; opens again, presses a multiple-mode item and expects it open.
  - `TouchRows` (`no-visual`): asserts the 44px rule's selector is in the stylesheet (`document.styleSheets` search for `(pointer: coarse)`) and the row is at least 40px; the 44px measurement itself is the docs test under `hasTouch`.
  - `FromADialog` (`no-visual`): a menu opened from inside a `Dialog`; play opens it, expects the menu above the dialog (the popover's z-index 100000 and `document.elementFromPoint` at its centre inside the menu), Escape closes the menu only.
- `RightToLeft.stories.tsx`: `MenuMirrored`: under `Rtl`, the menu open; play asserts the icon's box is to the right of the label's and the check's (or the shortcut's) to the left.
- Docs end-to-end, `docs.spec.ts`: `test('the menu page opens a menu from the keyboard, moves with the arrows and returns focus on Escape')`; `test('a menu link navigates through the router')` (on the links example, press "Button" and expect the button page's URL); `test('menu rows are 44px on a touch screen')` with `test.use({ hasTouch: true, viewport: { width: 375, height: 760 } })` reading a row's height. `components.spec.ts`, forced colors: `test('a selected menu row is drawn in Highlight')` (open the selection example, read the selected row's fill against a `Highlight` probe). Maps: `'menu'` in `NO_LONG_TEXT`, `SERVER_RENDERED: ['.stage .button, .stage .icon-button']`.

**Docs:**
- `menu.mdx`, title "Menu", description "A menu of actions and choices in a popover: icons, descriptions, key hints, sections, separators, a danger item, and links through your router.", icon `EllipsisVertical`. Sections: `## Basic` (`menu-basic`), `## Selection` (single is the ink pill with a check and closes on a choice; multiple is the check alone and stays open; per section or on the menu; `menu-selection`), `## Links` (an item with `href` is a real link with `role="menuitem"`; it navigates through React Aria's `RouterProvider`, which Link uses too; the Next App Router wiring once, in full: a client component that calls `useRouter()` and renders `<RouterProvider navigate={router.push}>` around the app, with the `RouterConfig` module augmentation so `routerOptions` is typed; the trade-off: React Aria renders a plain anchor, so Next does not prefetch on viewport entry; restore it with `router.prefetch(href)` from `onHoverStart` and `onFocus`, or render Next's own `Link` per item with the inherited `render` prop from a client component; `menu-links`), `## Usage` (focus enters the menu and Tab leaves it, which the source app's list did not do; `placement`; `onAction` with the key; the danger variant pairs with ConfirmDialog), `## Props` (four tables with labels "Menu props", "MenuItem props", "MenuSection props", "MenuSeparator props"), `## Accessibility` (a true `role="menu"` named by its trigger; `<Keys rows={[['Down Up', 'Move between items.'], ['Home End', 'Jump to the first or last item.'], ['A-Z', 'Jump to an item by its first letters.'], ['Enter Space', 'Activate the item, or choose it.'], ['Escape', 'Closes the menu and returns focus.'], ['Tab', 'Closes the menu.']]} />`), `## Design rules` (dos: say the action in a verb, group with sections, put a danger item last after a separator; donts: never a submenu, never a menu for navigation that a list could be, never color alone for danger).
- `link.mdx`: the "For client-side routing" paragraph becomes the same `RouterProvider` snippet with a sentence that Menu's links go through it too.
- Examples: `menu-basic.tsx` (client: `onAction` logs to a `Text` line), `menu-selection.tsx` (client: state for the theme and two toggles), `menu-links.tsx` (client: `RouterProvider` with `useRouter().push`, items linking to docs pages).
- `meta.json`: `"menu"` after `"link"` and before `"popover"`. Index, footer and READMEs: "Menu".
- `docs/design-system.md`, `## Menu`: the source popups, the row table of spec 9.3 with each "why", every measurement above, the check's reserved room, the close-on-select rule, the links through `RouterProvider`, and that the listbox of the choice controls inherits the rows.

**Changeset:** append to `.changeset/overlays-popover-menu.md`: "Menu is a true `role=\"menu\"` in that popover: `MenuTrigger` re-exported, `Menu`, `MenuItem` with an icon, a description, a shortcut drawn as a key and a danger variant, `MenuSection` with a heading and its own selection, and `MenuSeparator`. Single selection is the ink pill with a check and closes on a choice; multiple is the check alone. Items with `href` navigate through `RouterProvider`."

**Steps:**

- [ ] **Step 1: Write the failing tests** listed above, stories included.
- [ ] **Step 2: Run them and watch them fail** (the seven commands of Task 4's Step 2, with `Menu RightToLeft` as the Storybook filter). Expected: the core run FAILS every menu CSS test and passes the menu contrast describe; the React run FAILS to import the menu modules and `../overlay/Shortcut`; the Storybook run fails to import both story files; the end-to-end run FAILS the completeness guards (`+ "menu"`) and the new tests.
- [ ] **Step 3: Write the components, `Shortcut`, the CSS, the stories, the examples, the pages, the record and the changeset.** Add the `Menu` size-limit entry (`"import": "{ Menu, MenuItem, MenuSection, MenuSeparator }"`) with a 4 kB placeholder, measure, and set the limit by the rule.
- [ ] **Step 4: Run the tests and watch them pass** (the four commands of Task 4's Step 4, filter `Menu RightToLeft`). Expected: all pass: the 14 core tests, about 30 Menu tests, 4 Shortcut tests, the two shared rows, and the 9 menu stories and the mirrored story in both projects.
- [ ] **Step 5: Run everything** (the nine commands of Task 1's Step 5). Expected: every gate green; one more static page; the end-to-end run passes with the page's 4 loop tests, the three new menu tests and the forced-colors one; `Menu` within its limit; `pnpm verify` exits 0.
- [ ] **Step 6: Visual baselines.** Expected: 25 new files for `basic`, `single-selection`, `multiple-selection`, `keyboard-focus` and `in-dark-scope`, no changed file. What to look at: a 24px-cornered white popup under its button with 20px-cornered rows, icons at the start, a key chip at the end, a red "Log out" after a rule; the ink pill with a white check on "Dark"; two checks and no fill in the multiple one; the wash and inset ring on the focused row.
- [ ] **Step 7: Commit**

```bash
git add .changeset/overlays-popover-menu.md "apps/docs/app/(home)/home-page.tsx" apps/docs/content/docs/components/link.mdx apps/docs/content/docs/components/menu.mdx apps/docs/content/docs/components/meta.json apps/docs/examples/index.ts apps/docs/examples/menu-basic.tsx apps/docs/examples/menu-links.tsx apps/docs/examples/menu-selection.tsx apps/docs/tests/components.spec.ts apps/docs/tests/docs.spec.ts docs/design-system.md packages/core/README.md packages/core/src/components/menu.css packages/core/src/styles.css packages/core/test/contrast.test.js packages/core/test/css.test.js packages/react/.size-limit.json packages/react/README.md packages/react/src/index.ts packages/react/src/menu/Menu.stories.tsx packages/react/src/menu/Menu.test.tsx packages/react/src/menu/Menu.tsx packages/react/src/menu/MenuItem.tsx packages/react/src/menu/MenuSection.tsx packages/react/src/menu/MenuSeparator.tsx packages/react/src/menu/index.ts packages/react/src/overlay/Shortcut.test.tsx packages/react/src/overlay/Shortcut.tsx packages/react/src/rtl/RightToLeft.stories.tsx packages/react/test/empty-parts.test.tsx packages/react/test/server-render.test.tsx "apps/storybook/tests/visual/__screenshots__/components-menu--*.png"
git commit -m "feat: add Menu"
```

---
### Task 11: Toast

**Goal:** `toast()`, `toast.dismiss()`, `toast.clear()` and `<ToastRegion />`: events in the bottom end corner above every modal, four tones with a stripe, an action that keeps the toast until it is used, errors assertive and everything else polite through a status host that exists before its text, React Aria's `UNSTABLE_` toast parts wrapped entirely, and the exact version pin. Implements spec 10.1 to 10.3, the Toast ruling of 13.1, 13.2 item 9 and item 17's pin.

**Files:**
- Create: `packages/react/src/toast/toast.ts`, `packages/react/src/toast/ToastRegion.tsx`, `packages/react/src/toast/index.ts`
- Modify: `packages/react/src/index.ts`, `packages/react/.size-limit.json`, `packages/react/package.json` (`"react-aria-components": "1.22.1"`), `pnpm-lock.yaml`
- Test: `packages/react/src/toast/toast.test.tsx`, `packages/react/src/toast/toast.node.test.ts` (create), `packages/react/test/server-render.test.tsx`
- Test (stories): `packages/react/src/toast/Toast.stories.tsx` (create)
- Create: `packages/core/src/components/toast.css`
- Modify: `packages/core/src/styles.css` (import after `menu.css`)
- Test: `packages/core/test/css.test.js`, `packages/core/test/contrast.test.js`
- Create: `apps/docs/content/docs/components/toast.mdx`, `apps/docs/examples/toast-basic.tsx`, `apps/docs/examples/toast-action.tsx`
- Modify: `apps/docs/content/docs/components/meta.json`, `apps/docs/examples/index.ts`, `apps/docs/app/(home)/home-page.tsx`
- Test: `apps/docs/tests/components.spec.ts`, `apps/docs/tests/docs.spec.ts`
- Modify: `packages/core/README.md`, `packages/react/README.md`
- Modify: `docs/design-system.md` (a `## Toast` section appended to Appendix B)
- Create: `.changeset/overlays-toast.md`
- Create (Docker step): 25 baselines, `apps/storybook/tests/visual/__screenshots__/components-toast--*.png`. None changes.

**Interfaces:**
- Consumes: from `react-aria-components` 1.22.1, `UNSTABLE_ToastQueue` (a class: `new ToastQueue<T>({ maxVisibleToasts })`, `add(content, { timeout, onClose })` returning the key and putting the toast first, `close(key)` calling its `onClose`, `clear()`, `pauseAll()`, `resumeAll()`, `subscribe(fn)` returning an unsubscribe, `visibleToasts` (a new array per change, the first `maxVisibleToasts` of the queue), and the public field `maxVisibleToasts`), `UNSTABLE_ToastRegion` (portals itself to `document.body`, renders nothing with no toasts or on the server; its element is `role="region"` named "Notifications" through React Aria's strings unless `aria-label` is given, `tabIndex="-1"`, `dir` from the locale, `data-react-aria-top-layer`; hover and focus-within pause every timer and resume when both end; a focused toast that is removed hands focus to the next or previous one, or back to where it was), `UNSTABLE_ToastList` (an `ol`; with a function child it renders each toast), `UNSTABLE_Toast` (`role="alertdialog"`, `tabIndex="0"`, labelled by its title and described by its description; `data-focused`, `data-focus-visible`), `UNSTABLE_ToastContent` (`role="alert"` with `aria-hidden` until visible, merged first so a `role` prop wins), `Text` (slots `title` and `description`), `Button` context slot `close` (named "close" through React Aria's strings unless `aria-label` is given); `VisuallyHidden` is not needed (the status host is hidden by CSS). `Button`, `IconButton`, Lucide `X`, `cx`, `present`; `--color-warning` (Task 1), `--z-toast` (Task 1), `overlay.css`.
- Produces `toast.ts`, a client module (it imports `react-aria-components`; the queue creates no DOM):

```ts
'use client';

export type ToastTone = 'success' | 'info' | 'warning' | 'error';

export interface ToastAction {
  /** The button's label, such as "Undo". */
  label: string;
  /** Runs on press; the toast then closes. */
  onAction: () => void;
}

export interface ToastOptions {
  /** The message. Say the outcome in words: the tone only repeats it. Preformatted. */
  title: ReactNode;
  /** A second line, in slate. */
  description?: ReactNode;
  tone: ToastTone;
  /** A button such as "Undo". A toast with an action stays until it is used or dismissed. */
  action?: ToastAction;
  /**
   * Milliseconds before it leaves, or `null` to stay until dismissed. Unless given: 6000, 12000 for
   * `error`, and `null` with an `action`.
   */
  timeout?: number | null;
  /** Called when it leaves, however it leaves. */
  onClose?: () => void;
}

/** What the queue holds for each toast. */
export type ToastContent = Omit<ToastOptions, 'timeout' | 'onClose'>;

export interface ToastFunction {
  /** Shows a toast and returns its id. Callable from any client code, including after a server action returns. */
  (options: ToastOptions): string;
  /** Closes one toast by id. */
  dismiss: (id: string) => void;
  /** Drops every toast, errors included: a new save starts and the last result is stale. */
  clear: () => void;
}

export const toast: ToastFunction;

/** Internal: the one queue, and the region's registration. */
export const queue: UNSTABLE_ToastQueue<ToastContent>;
export function markRegion(delta: 1 | -1): void;
```

- Produces `ToastRegion.tsx`, a client module:

```ts
'use client';

export interface ToastRegionProps {
  /** @default 'Notifications' (React Aria's, localized) */
  'aria-label'?: string;
  /** The dismiss button's accessible name. @default 'Dismiss' */
  dismissLabel?: string;
  /** How many toasts show at once; the rest wait. Applies from the next toast. @default 3 */
  maxVisibleToasts?: number;
  /** Goes on the region, after its classes. */
  className?: string;
}

/** Mount once, at the app root. */
export function ToastRegion(props: ToastRegionProps): ReactElement;
```

  Exports from the package index: `toast`, `ToastRegion`, and the types `ToastTone`, `ToastAction`, `ToastOptions`, `ToastRegionProps`.
- Later tasks rely on: the class `toast-region`, which every modal's `isOutsideToastRegion` predicate already names (Task 4).

**Behavior:**
1. **The queue** is one `UNSTABLE_ToastQueue` at module scope with `maxVisibleToasts: 3`. `toast(options)` calls `queue.add(content, { timeout, onClose })` and returns the key; `toast.dismiss(id)` calls `queue.close(id)`; `toast.clear()` closes every open toast one by one (so each `onClose` fires) through a module registry of open keys, then `queue.clear()`. Insertion order is kept; React Aria hides the oldest beyond three.
2. **Timing.** `success`, `info` and `warning` 6000ms; `error` 12000ms; any toast with an `action` has no timeout; `timeout` overrides, `null` meaning never. Hover over the region and focus inside it pause every timer; leaving resumes.
3. **The region** is two things: `div.toast-status-host[role="status"][aria-live="polite"][aria-atomic="true"][data-react-aria-top-layer="true"]`, rendered in place where `ToastRegion` is mounted, always present, visually hidden by its class, holding the latest polite toast's title and description in a `span` keyed by the toast's key; and React Aria's region, `div.overlay.toast-region[role="region"][data-react-aria-top-layer]`, portaled by React Aria, holding `ol.toast-list` and each toast. The attribute keeps both out of `aria-hidden` while a modal is open and out of `useInteractOutside`, so a press on a toast dismisses no dialog; every library modal also names `.toast-region` in its predicate.
4. **Announcement.** An `error` toast keeps React Aria's content role, `alert`. Every other tone's `ToastContent` gets `role="group"`, so its visible content is not a live region, and it is announced through the status host instead: a repeated "Saved" is a new `span` and is announced again. A polite toast's DOM has exactly one live element (the host); an error toast's region has exactly one (its content) besides the host.
5. **Each toast** is React Aria's non-modal `alertdialog` with `tabIndex="0"`, `data-tone`, labelled by `Text slot="title"` and described by `Text slot="description"` when present. Its dismiss is a 40px ghost `IconButton` with Lucide `X`, `slot="close"`, named `dismissLabel`. Its action is a `Button variant="secondary"` that runs `onAction` and then closes the toast. A toast closed while focused hands focus to its neighbor.
6. **Order.** React Aria lists newest first; the list is `column-reverse`, so the newest sits nearest the corner and the oldest rises.
7. **Above modals**, at `--z-toast`.
8. **Server actions.** `toast()` is a plain function on a module singleton. Calling it with no `ToastRegion` mounted enqueues and shows nothing, and warns once per page in development (`console.warn`, guarded by a module `let`).
9. **`maxVisibleToasts`** sets the queue's public field in a layout effect; it applies from the next toast.
10. **Server.** `ToastRegion` renders the status host on the server (empty) and React Aria's region renders nothing there. `toast.ts` imports with no `window` or `document`.

**CSS**, the whole of `toast.css`:

```css
/*
 * Toast: an event in the bottom end corner, 16px in, above every modal. A float with the frame, a
 * 4px tone stripe at the inline start, the surface corner and the float shadow; 16px by 24px of
 * padding; an 8px rise on enter through @starting-style, which is above the floor and simply does
 * not run there; an instant exit. Derived in docs/design-system.md ("Toast").
 */
@layer components {
  /* The polite live region, present before its text, hidden from sight and kept out of aria-hidden. */
  .toast-status-host {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip-path: inset(50%);
    white-space: nowrap;
  }

  /* --toast-offset-block is 0 and exists so a save bar can lift the stack by its height later. */
  .toast-region {
    position: fixed;
    inset-block-end: calc(var(--overlay-inset) + var(--toast-offset-block, 0px));
    inset-inline-end: var(--overlay-inset);
    z-index: var(--z-toast);
    width: min(28rem, calc(100vw - 2rem));
    outline: none;
    pointer-events: none;
  }

  .toast-list {
    display: flex;
    flex-direction: column-reverse;
    align-items: flex-end;
    gap: var(--spacing-part);
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .toast-list > li {
    display: contents;
  }

  .toast {
    --toast-stripe: var(--color-slate);

    display: flex;
    align-items: flex-start;
    gap: 0.75rem;
    width: 100%;
    padding: 1rem var(--spacing-peer);
    border: 1px solid var(--color-frame);
    border-inline-start: 4px solid var(--toast-stripe);
    border-radius: var(--radius-surface);
    background-color: var(--color-float);
    box-shadow: var(--shadow-float);
    pointer-events: auto;
    transition:
      opacity 180ms ease,
      translate 180ms ease;
  }

  .toast[data-tone='success'] {
    --toast-stripe: var(--color-success);
  }

  .toast[data-tone='warning'] {
    --toast-stripe: var(--color-warning);
  }

  .toast[data-tone='error'] {
    --toast-stripe: var(--color-error);
  }

  @starting-style {
    .toast {
      opacity: 0;
      translate: 0 8px;
    }
  }

  .toast:is(:focus-visible, [data-focus-visible]) {
    outline: var(--focus-ring-width) solid var(--focus-ring-color);
    outline-offset: var(--focus-ring-offset);
  }

  .toast-content {
    display: flex;
    flex: 1 1 auto;
    flex-direction: column;
    gap: 0.25rem;
    min-width: 0;
  }

  .toast-title {
    margin: 0;
    font-size: var(--text-body);
    line-height: var(--text-body--line-height);
    font-weight: var(--text-body--font-weight);
    color: var(--color-ink);
    overflow-wrap: anywhere;
  }

  .toast-description {
    margin: 0;
    font-size: var(--text-small);
    line-height: var(--text-small--line-height);
    font-weight: var(--text-small--font-weight);
    color: var(--color-slate);
    overflow-wrap: anywhere;
  }

  /* The 40px dismiss pulls in by 8px so a one-line toast stays 56px tall while the target stays 40px. */
  .toast-controls {
    display: flex;
    flex: none;
    align-items: center;
    gap: var(--spacing-part);
    margin-block: -0.5rem;
    margin-inline-end: -0.5rem;
  }

  /* The frame and the stripe are redrawn in the reader's color, so the words carry the tone. */
  @media (forced-colors: active) {
    .toast {
      border-color: CanvasText;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .toast {
      transition: none;
    }
  }
}
```

If React Aria's list renders no `li`, drop the `.toast-list > li` rule. Right to left: the stripe is `border-inline-start`, the region `inset-inline-end`, and React Aria sets `dir` on the region.

**Code** (`toast.ts`, because the registry, the defaults and the typed function must be done one way):

```ts
'use client';

import type { ReactNode } from 'react';
import { UNSTABLE_ToastQueue } from 'react-aria-components';

export type ToastTone = 'success' | 'info' | 'warning' | 'error';
export interface ToastAction { label: string; onAction: () => void }
export interface ToastOptions { /* as above */ }
export type ToastContent = Omit<ToastOptions, 'timeout' | 'onClose'>;
export interface ToastFunction { /* as above */ }

const TIMEOUT: Record<ToastTone, number> = { success: 6000, info: 6000, warning: 6000, error: 12000 };

/** The one queue. It creates no DOM, so this module imports on the server. */
export const queue: UNSTABLE_ToastQueue<ToastContent> = new UNSTABLE_ToastQueue<ToastContent>({
  maxVisibleToasts: 3,
});

/** The open toasts, so clear() can close each one and fire its onClose, which React Aria's clear() does not. */
const open = new Set<string>();

let regions = 0;
let warned = false;

export function markRegion(delta: 1 | -1): void {
  regions += delta;
}

function show({ timeout, onClose, ...content }: ToastOptions): string {
  if (regions === 0 && !warned) {
    warned = true;
    console.warn('toast() was called with no <ToastRegion /> mounted, so nothing will show. Mount one at the app root.');
  }
  const ms = timeout === undefined ? (content.action ? null : TIMEOUT[content.tone]) : timeout;
  let key = '';
  key = queue.add(content, {
    timeout: ms ?? undefined,
    onClose: () => {
      open.delete(key);
      onClose?.();
    },
  });
  open.add(key);
  return key;
}

export const toast: ToastFunction = Object.assign(show, {
  dismiss: (id: string): void => {
    queue.close(id);
  },
  clear: (): void => {
    for (const key of [...open]) queue.close(key);
    queue.clear();
  },
});
```

The `key` closure is assigned before `onClose` can run: React Aria never calls `onClose` from `add`.

**Tests, written first** (`toast.test.tsx`, `vi.useFakeTimers()` with `shouldAdvanceTime: false`, every render mounting `<ToastRegion />` and calling `toast()` inside `act`; queries on `document.body`; `toast.clear()` in `afterEach`):
- `toast()` returns a string id and a `role="alertdialog"` appears, named by the title, with `data-tone` and the stripe class on `.toast`; `description` renders `.toast-description` and describes the toast, and nothing when absent.
- Timing: success, info and warning close after 6000ms and not at 5999; error after 12000; a toast with an `action` is still there after 60000; `timeout: 2000` closes at 2000; `timeout: null` never.
- `toast.dismiss(id)` closes that one and calls its `onClose`; `toast.clear()` closes all and calls every `onClose`, hidden ones included (add four, clear, expect four `onClose` calls).
- At most three are visible with four added; the oldest is the hidden one; dismissing one shows it.
- Announcement: a polite toast writes its title and description into the status host (`getByRole('status')` has the text), the host is the only element with `aria-live` or a live role in `document.body`, and the toast's content has `role="group"`; an error toast leaves the host empty of its text and its content is `role="alert"`; two polite toasts in a row with the same title give the host a new `span` (the first `span` element is no longer connected).
- The dismiss is a 40px icon button named `dismissLabel` (default "Dismiss") and a press closes; the action button is `button-secondary`, runs `onAction` once and closes.
- The region wrapper and the status host both carry `data-react-aria-top-layer`; the region has the classes `overlay toast-region`; `aria-label` replaces the region's name; `maxVisibleToasts={1}` shows one of two added after mount.
- `toast()` with no region mounted warns once (`console.warn` spied) and a second call does not; after a region mounts the toast shows.
- Hover over the region pauses the timer (hover at 1000ms, advance 10000, still there, unhover, advance 5000, gone) and focus inside does the same.
- A dialog open while a toast's button is pressed stays open (render a `Dialog defaultOpen`, add a toast, press its dismiss, the dialog is still there).
- A focused toast's dismissal moves focus to the neighbor (two toasts, focus the first's dismiss, press it, `document.activeElement` is inside the remaining toast).
- `import('../src/toast/toast')` in a `// @vitest-environment node` test file (`toast.node.test.ts`, 1 test) resolves with no window and `toast` is a function.
- Axe on a region holding one toast of each tone.
- `server-render.test.tsx`: `['ToastRegion', <ToastRegion />, ['class="toast-status-host"', 'role="status"', 'aria-live="polite"', 'data-react-aria-top-layer'], ['toast-region']]`.
- `css.test.js`, `describe('src/components/toast.css')`: the host's hidden-but-present declarations; the region's fixed corner with the exact `inset-block-end` calc, `z-index: var(--z-toast);`, the width cap and `pointer-events: none;`; the list's `column-reverse` and gap; the toast's `pointer-events: auto;`, the frame, the 4px inline-start stripe reading `--toast-stripe`, the surface corner, the float fill and shadow, `padding: 1rem var(--spacing-peer);`; the three tone rules set `--toast-stripe` to the three tokens and `info` has none (the base is slate); `@starting-style` holds `opacity: 0;` and `translate: 0 8px;`; no `[data-exiting]` rule; the controls' negative margins; the forced-colors border; the reduced-motion block after the transition. Import order: `toast.css` after `menu.css`.
- `contrast.test.js`, `describe('the toast')`: the four stripe colors (`slate`, `success`, `warning`, `error`) are gated on `float` at `TEXT`, over the 3:1 a graphic needs (5.49/6.94, 7.44/6.34, 6.33/8.92, 7.46/5.73).
- Stories, `Toast.stories.tsx`, title `Components/Toast`, each rendering a `ToastRegion` and adding its toasts in a `useEffect` on mount (so the baselines are stable) with `timeout: null`, and clearing in a cleanup:
  - `Tones` (visual): four toasts, one per tone, each with a description. Play: four alert dialogs, the newest nearest the bottom corner (its box's bottom is the greatest), each stripe's computed `borderInlineStartColor` equals its token (`tokenColor`).
  - `WithAction` (visual): one success toast with an Undo action. Play: the action button is `button-secondary`; the toast is still there after 7000ms real time is not waited; assert no timer by reading nothing (the story is static), and that the dismiss is 40 by 40.
  - `Short` (visual): one-line "Saved". Play: the toast is 56px tall (within 1px) and the dismiss 40px.
  - `LongText` (visual): a title with a 60-letter unbroken word and a long description. Play: at 375 the region's right edge is 16px from the viewport's and no sideways scroll.
  - `DismissFocused` (visual): play Tabs into the region (F6 is not available to a play function: focus the dismiss directly with `focus()`) and expects the ring on the toast's dismiss. Keyboard only.
  - `AboveADialog` (`no-visual`): a `Dialog defaultOpen` and a toast; play asserts the toast is hit by `document.elementFromPoint` at its centre (above the scrim), presses its dismiss, and the dialog is still open and still focused-within.
  - `PauseOnHover` (`no-visual`): an info toast with the default timeout; play hovers it, waits 7000ms (`new Promise(r => setTimeout(r, 7000))`), expects it present, unhovers, `waitFor` it gone within 7000ms.
  - `InDarkScope` (`no-visual`): the region follows the page root, not a trigger; play asserts the region has no copied `data-theme` when the button that fired the toast sits in a dark card, and the toast's background is the page theme's float.
- Docs end-to-end, `docs.spec.ts`: `test('the toast page shows a toast that is announced politely and dismissed')` (press "Saved", the alert dialog appears, the status host holds its title, Dismiss closes it); `test('an error toast is an alert')`. `components.spec.ts` maps: `'toast'` in `NO_LONG_TEXT`, `SERVER_RENDERED: ['.stage .button', '.stage .toast-status-host']`.

**Docs:**
- `toast.mdx`, title "Toast", description "A brief notice of an event in the corner, above everything: four tones, an optional action, and a polite announcement.", icon `BellRing`. Sections: `## Tones` (`toast-basic`: four buttons), `## With an action` (a toast with an action stays until it is used or dismissed; `toast-action`), `## Usage` (mount `<ToastRegion />` once at the app root, in a client component; call `toast({ title, tone })` from any client code, including after `await action()` from a server action, shown in a snippet; `toast.dismiss(id)`; `toast.clear()` at the start of a new save, since the last result is stale; timeouts; hover and focus pause; the rule that the title says the outcome, because the stripe is repainted in forced colors; one action toast at a time, since a fourth toast waits unseen behind three persistent ones), `## Props` (two tables: "toast options" for `ToastOptions` from `toast.ts`, "ToastRegion props" for `ToastRegionProps`), `## Accessibility` (each toast is an alert dialog named by its title; errors are announced assertively, everything else politely through a status region mounted with the region; dismissal moves focus to the neighbor; reduced motion stops the rise; `<Keys rows={[['F6', 'Reaches the toast region.'], ['Tab', 'Moves through a toast, its action and its dismiss.'], ['Enter Space', 'Press the action or the dismiss.']]} />`), `## Design rules` (dos: say the outcome in words, keep one action toast at a time, clear at a new save; donts: never a toast for a state a form should show, never color alone, never a toast that needs a decision).
- Examples: `toast-basic.tsx` (client: a `ToastRegion` and four buttons), `toast-action.tsx` (client: an Undo that restores a removed row).
- `meta.json`: `"toast"` after `"text-field"`. Index, footer and READMEs: "Toast".
- `docs/design-system.md`, `## Toast`: the source's toast (spec 2), the two-element region and why (React Aria's portals itself), the status host and the latest-toast rule, the timings, the stripe and its measurements, the 16px by 24px padding regularized from 20 by 16, `column-reverse`, the 56px one-line height, `@starting-style` above the floor, no exit, `--toast-offset-block`, the top-layer attribute and the predicate, and the pin.

**The pin.** `packages/react/package.json`: `"react-aria-components": "1.22.1"` (no caret). Then `pnpm install --lockfile-only`, which updates the specifier in `pnpm-lock.yaml` and nothing else.

**Changeset** `.changeset/overlays-toast.md`:

```markdown
---
'@snapshot-ui/core': minor
'@snapshot-ui/react': minor
---

Add Toast: `toast({ title, description, tone, action, timeout })` returns an id, `toast.dismiss(id)` and `toast.clear()`, and `<ToastRegion />`, mounted once at the app root. Four tones with a stripe, 6 seconds (12 for errors), a toast with an action stays until it is used, errors are assertive and the rest are announced politely through a status region that exists before its text, hover and focus pause the timers, and the region sits above every modal. React Aria's toast parts are `UNSTABLE_` in react-aria-components 1.22, so `@snapshot-ui/react` now pins it to exactly 1.22.1; a bump is a deliberate change with a test run behind it.
```

**Steps:**

- [ ] **Step 1: Write the failing tests** listed above, stories included.
- [ ] **Step 2: Run them and watch them fail** (the seven commands of Task 4's Step 2, with `Toast` as the Storybook filter). Expected: the core run FAILS every toast CSS test and passes the toast contrast describe; the React run FAILS to import `../src/toast`; the Storybook run fails to import the story file; the end-to-end run FAILS the completeness guards (`+ "toast"`) and the new tests.
- [ ] **Step 3: Write the module, the region, the CSS, the stories, the examples, the page, the record, the pin and the changeset.** Add the size-limit entry `{ "name": "import { toast, ToastRegion } from \"@snapshot-ui/react\"", "import": "{ toast, ToastRegion }", ... }` with a 4 kB placeholder, measure, and set the limit by the rule.
- [ ] **Step 4: Run the tests and watch them pass** (the four commands of Task 4's Step 4, filter `Toast`). Expected: all pass: the 13 core tests, about 24 toast tests, the node import test, the server row, and the 8 stories in both projects.
- [ ] **Step 5: Run everything** (the nine commands of Task 1's Step 5). Expected: every gate green; `pnpm install --lockfile-only` changed only the specifier line; one more static page; the end-to-end run passes with the page's 4 loop tests and the two new toast tests; the `toast, ToastRegion` entry within its limit; `pnpm verify` exits 0.
- [ ] **Step 6: Visual baselines.** Expected: 25 new files for `tones`, `with-action`, `short`, `long-text` and `dismiss-focused`, no changed file. What to look at: four white cards stacked in the bottom right, the newest lowest, each with a colored stripe on its left (slate, green, amber, red); the Undo button and the X; a 56px one-liner; the long word broken inside the card at 375 with the card 16px from the right edge; the ring on the X.
- [ ] **Step 7: Commit**

```bash
git add .changeset/overlays-toast.md "apps/docs/app/(home)/home-page.tsx" apps/docs/content/docs/components/meta.json apps/docs/content/docs/components/toast.mdx apps/docs/examples/index.ts apps/docs/examples/toast-action.tsx apps/docs/examples/toast-basic.tsx apps/docs/tests/components.spec.ts apps/docs/tests/docs.spec.ts docs/design-system.md packages/core/README.md packages/core/src/components/toast.css packages/core/src/styles.css packages/core/test/contrast.test.js packages/core/test/css.test.js packages/react/.size-limit.json packages/react/README.md packages/react/package.json packages/react/src/index.ts packages/react/src/toast/Toast.stories.tsx packages/react/src/toast/ToastRegion.tsx packages/react/src/toast/index.ts packages/react/src/toast/toast.node.test.ts packages/react/src/toast/toast.test.tsx packages/react/src/toast/toast.ts packages/react/test/server-render.test.tsx pnpm-lock.yaml "apps/storybook/tests/visual/__screenshots__/components-toast--*.png"
git commit -m "feat: add Toast"
```

---
### Task 12: CommandPalette

**Goal:** the Cmd or Ctrl+K dialog near the top of the viewport: an input with virtual focus over a menu, an AND-of-words filter or an app-driven manual mode with a loading state, sections, recents in `localStorage`, a status line that waits for typing to pause, and `onAction` after the palette has closed and focus has returned. Implements spec 11.1 to 11.3, the CommandPalette ruling of 13.1 and 13.2 item 10.

**Files:**
- Create: `packages/react/src/command-palette/CommandPalette.tsx`, `packages/react/src/command-palette/recentsStore.ts`, `packages/react/src/command-palette/shortcut.ts`, `packages/react/src/command-palette/index.ts`
- Modify: `packages/react/src/overlay/ModalFrame.tsx` (an optional `id` prop, `useId()` when absent), `packages/react/src/index.ts`, `packages/react/.size-limit.json`
- Test: `packages/react/src/command-palette/CommandPalette.test.tsx`, `packages/react/src/command-palette/recentsStore.test.ts`, `packages/react/src/command-palette/shortcut.test.ts` (create), `packages/react/test/server-render.test.tsx`
- Test (stories): `packages/react/src/command-palette/CommandPalette.stories.tsx` (create)
- Create: `packages/core/src/components/command-palette.css`
- Modify: `packages/core/src/styles.css` (import after `toast.css`)
- Test: `packages/core/test/css.test.js`, `packages/core/test/contrast.test.js`
- Create: `apps/docs/content/docs/components/command-palette.mdx`, `apps/docs/examples/command-palette-basic.tsx`, `apps/docs/examples/command-palette-async.tsx`
- Modify: `apps/docs/content/docs/components/meta.json`, `apps/docs/examples/index.ts`, `apps/docs/app/(home)/home-page.tsx`
- Test: `apps/docs/tests/components.spec.ts`, `apps/docs/tests/docs.spec.ts`
- Modify: `packages/core/README.md`, `packages/react/README.md`
- Modify: `docs/design-system.md` (a `## CommandPalette` section appended to Appendix B)
- Create: `.changeset/overlays-command-palette.md`
- Create (Docker step): 30 baselines, `apps/storybook/tests/visual/__screenshots__/components-commandpalette--*.png`. None changes.

**Interfaces:**
- Consumes: from `react-aria-components` 1.22.1, `Autocomplete` (`filter(textValue, inputValue, node)`, `inputValue`, `defaultInputValue`, `onInputChange`, `disableAutoFocusFirst`; it wires the `TextField` and `Input` beneath it through its contexts, giving the input `aria-activedescendant`, `aria-controls`, `aria-autocomplete="list"`, `autoComplete="off"` and `spellCheck="false"`, forwards Arrow, Home, End, Page, Enter and Escape to the collection with virtual focus, gives the first item virtual focus as the person types forward, clears it on deletion, and ignores Enter during an IME composition; read `dist/private/Autocomplete.mjs` and `react-aria`'s `useAutocomplete.mjs` for which contexts it provides and what Escape does when an item is virtually focused), `TextField` as `RACTextField`, `Input` as `RACInput`, `Dialog` as `RACDialog`, `useFilter`, `useLocale`, the `Key` type; `ModalFrame` with its `onUnmount` and the new `id` prop, `isAnotherModalOpen` (Task 3), `useOverlayScope` through the frame; `MenuList`, `MenuItem`, `MenuSection` and the row classes (Task 10); `Shortcut` (Task 10); `Kbd`, `Spinner`; Lucide `Search`; `cx`, `present`; `overlay.css`, `menu.css`.
- Produces `CommandPalette.tsx`, a client module, exported from `@snapshot-ui/react` with the types `CommandPaletteItem`, `CommandPaletteLabels` and `CommandPaletteProps`, exactly as spec 11.1 writes them (copy the three declarations and their JSDoc verbatim). No trigger is exported: the app's own button opens it through `isOpen`.
- Produces `recentsStore.ts` (no directive; it reads `window` only inside functions called from hooks and effects) and `shortcut.ts` (no directive, pure):

```ts
// recentsStore.ts
/** The entry for a storage key: `snapshot-ui:recent:<storageKey>`. */
export function entryFor(storageKey: string): string;
/** The stored ids, newest first: a JSON list of strings, else []. Unreadable JSON, a non-list, blocked storage all read as []. Non-strings are left out. */
export function read(storage: Pick<Storage, 'getItem'> | null, storageKey: string): string[];
/** Writes the list; a full or refusing storage keeps nothing. */
export function write(ids: readonly string[], storage: Pick<Storage, 'setItem'> | null, storageKey: string): void;
/** `id` moved to the front, never doubled, cut to `limit`. */
export function push(stored: readonly string[], id: string, limit: number): string[];
/**
 * The remembered ids for `storageKey` through `useSyncExternalStore` (the `storage` event for other
 * tabs, an empty server snapshot), and a recorder. With no key: an empty list and a recorder that
 * stores nothing.
 */
export function useRecents(
  storageKey: string | undefined,
  limit: number,
): [ids: readonly string[], record: (id: string) => void];

// shortcut.ts
export interface ParsedShortcut { mod: boolean; shift: boolean; alt: boolean; key: string }
/** Tokens joined by `+`: the modifiers `Mod`, `Shift`, `Alt` in any order and case, then one key. Throws on no key or an unknown modifier. */
export function parseShortcut(shortcut: string): ParsedShortcut;
/**
 * Whether a keydown is the shortcut: `Mod` is `metaKey` or `ctrlKey` (either, no platform sniffing);
 * every listed modifier is down and every unlisted one is up; `key` compares case-insensitively.
 * False when `defaultPrevented` or `isComposing`.
 */
export function matchesShortcut(event: KeyboardEvent, parsed: ParsedShortcut): boolean;
```

- Later tasks rely on: nothing in this plan. Spec 16's follow-up replaces the docs site's search with this component.

**Behavior:**
1. **Composition.** `ModalFrame` with `overlayClass="command-palette-overlay"`, `panelClass="command-palette"`, `id` the palette's own, `isOpen` always controlled from the palette's resolved open state, `onOpenChange` to its setter, `isDismissable` (true), `onUnmount` (Behavior 9), `className` on the panel; inside, `RACDialog` with `aria-label={label}` and `className="command-palette-content"`; inside, `Autocomplete` with the filter (Behavior 5) and the input props; inside, in order: `div.command-palette-field` holding Lucide `Search` as `svg.command-palette-glass[aria-hidden]`, `RACTextField` (`aria-label={label}`, `className="command-palette-textfield"`) holding `RACInput.command-palette-input` (`placeholder` from `labels.placeholder` or `label`, `autoFocus` with the lint disable), the `Spinner size="md"` as `.command-palette-spinner` named `labels.loading` while `isLoading`, then `Kbd` with `labels.escape`; `div.command-palette-body` holding `MenuList` (`className="command-palette-list"`, `aria-label={label}`, `shouldFocusWrap`, `onAction`, `renderEmptyState` drawing `labels.empty` in `div.command-palette-empty`) with its sections and items; `div.command-palette-status[role="status"]` (visually hidden by its class, mounted from the first render of the open palette); `div.command-palette-footer` holding `Kbd` pairs for Up and Down with `labels.move` and Enter with `labels.open`.
2. **The shortcut.** A `keydown` listener on `document`, installed in an effect while the palette is mounted (open or closed) and removed on unmount, parsed once from `shortcut` (default `'Mod+K'`; `false` installs nothing). It toggles the open state. It does nothing when `matchesShortcut` is false (which covers `defaultPrevented` and `isComposing`) or while `isAnotherModalOpen(ownId)`, so a ConfirmDialog is never skipped past. When it acts it calls `preventDefault()`.
3. **Open.** The input takes focus. An uncontrolled input is empty on every open (the overlay remounts, so `defaultInputValue` is `''` each time); a controlled `inputValue` is left as it is. The list shows: a Recent section (`labels.recent`) when the input is empty and there are recents, holding the items whose ids are remembered, newest first, with composite keys `recent:<id>` so the collection's keys stay unique; then every ungrouped item; then every section in first-seen order of `item.section`.
4. **Items.** Each `MenuItem` gets `id`, `icon`, `description`, `shortcut`, `isDisabled`, a `textValue` of the label, the description and the keywords joined by newlines (the filter reads it; the accessible name is the label through the `label` slot), and an `end` slot drawn as `span.command-palette-end` before the shortcut when present.
5. **Typing.** Default mode: the filter keeps an item when every whitespace-separated word of the query appears in its `textValue`, through `useFilter({ sensitivity: 'base' }).contains`, so case and accents are ignored; it applies only once there is text, and a section with no kept items is hidden (React Aria's collection filter). Manual mode (`filter={null}`): no filter is passed; the list is what `items` holds. A caller's `filter` function is wrapped to receive `(node.value, inputValue)`.
6. **Keys.** Arrow Down and Up move the active row and wrap; Home, End, Page Up and Page Down reach the list; Enter runs the active item; Escape closes the palette at once, text or no text, active row or none, in one press (if React Aria's Autocomplete consumes the first Escape to clear virtual focus, the dialog element carries a capturing `onKeyDown` that closes on Escape and prevents default; the test for one press decides); typing filters; Tab stays in the dialog; Enter during composition chooses nothing.
7. **Pointer.** Hover moves the active row with the wash; a press chooses. Focus stays in the input.
8. **Choosing**, in this order: record the item's id in recents (storage, or `onRecentChange` when controlled); close the palette (set the open state false, which calls `onOpenChange(false)`); then Behavior 9.
9. **After the close.** `ModalFrame`'s `onUnmount` fires when the panel has left the page, after React Aria's exit animation; React Aria's `FocusScope` restores focus in a `requestAnimationFrame` after that unmount; so the palette calls `onAction(item)` from a second `requestAnimationFrame` queued inside a first one. `onAction` is called once per choice, with the item as the app passed it (not the Recent copy), and is read through a ref so the latest callback runs.
10. **Recents.** With `storageKey`, one entry `snapshot-ui:recent:<storageKey>`, a JSON list of ids as strings, newest first, cut to `recentLimit` (5); a chosen item moves to the front, never doubles; an id not in `items` at open is dropped; unreadable JSON, a non-list, blocked storage or a refused write mean no history and no error; other tabs' writes arrive through the `storage` event. With `recentIds` and `onRecentChange` the palette stores nothing and reports the new list. Only an item chosen from the palette is recorded.
11. **Status.** The status element says `labels.status(count, query)` 600ms after typing pauses (each keystroke cancels the pending one), nothing while the query is empty, and waits while `isLoading`, saying the count when results land. `count` is the number of items the default filter keeps, or `items.length` in manual mode.
12. **Loading.** `isLoading` draws the 24px Spinner at the field row's end, before the Esc key; the list keeps what it has.
13. **Empty.** With text and no items, `renderEmptyState` draws `labels.empty`.
14. **Scope and direction.** The frame copies the scope from `document.activeElement` at open (the shortcut's origin is wherever focus was) and sets `dir`.
15. **Controlled and uncontrolled** open state and input value; `labels` merge over the English defaults; `className` goes on the panel; `ref` reaches the dialog element.
16. **Server.** Closed, nothing renders; the shortcut listener is an effect, so the module imports and renders with no `document`.

**CSS**, the whole of `command-palette.css`:

```css
/*
 * CommandPalette: the docs site's search dialog look on the tokens, a float at 12vh with the frame,
 * the surface corner and the float shadow; a field row with the glass, the input, the spinner and
 * the Esc key; a body with a floor so the height holds while the text changes; the Menu's rows with
 * the keyboard-active row filled in ink, because DOM focus never leaves the input; a footer of key
 * hints hidden on touch. Derived in docs/design-system.md ("CommandPalette").
 */
@layer components {
  .command-palette-overlay {
    align-content: start;
    justify-items: center;
    padding: 12vh var(--overlay-inset) var(--overlay-inset);
  }

  .command-palette {
    display: flex;
    flex-direction: column;
    width: min(40rem, 100%);
    max-height: min(35rem, calc(88dvh - 1rem));
    overflow: hidden;
    border: 1px solid var(--color-frame);
    border-radius: var(--radius-surface);
    background-color: var(--color-float);
    box-shadow: var(--shadow-float);
    transition:
      opacity 180ms ease,
      translate 180ms ease;
  }

  .command-palette:is([data-entering], [data-exiting]) {
    opacity: 0;
    translate: 0 8px;
  }

  .command-palette-content {
    display: flex;
    flex: 1 1 auto;
    flex-direction: column;
    min-height: 0;
    outline: none;
  }

  .command-palette-field {
    position: relative;
    display: flex;
    flex: none;
    align-items: center;
    gap: 0.75rem;
    padding: 1rem var(--spacing-peer);
    border-block-end: 1px solid var(--color-divider);
  }

  /* The focus line: a 2px ink line over the divider, with no layout shift. The token-only rule forbids
     a literal shadow, so it is a pseudo-element and not a box-shadow. */
  .command-palette-field::after {
    content: '';
    position: absolute;
    inset-block-end: -1px;
    inset-inline: 0;
    height: var(--focus-ring-width);
    background-color: transparent;
  }

  .command-palette-field:has(.command-palette-input:focus-visible)::after {
    background-color: var(--focus-ring-color);
  }

  .command-palette-glass {
    flex: none;
    width: 20px;
    height: 20px;
    color: var(--color-slate);
  }

  /* React Aria's TextField is a div; the row lays out its input directly. */
  .command-palette-textfield {
    display: contents;
  }

  .command-palette-input {
    flex: 1 1 auto;
    min-width: 0;
    margin: 0;
    padding: 0;
    border: 0;
    background-color: transparent;
    color: inherit;
    font: inherit;
    font-size: var(--text-body);
    outline: none;
  }

  /* Slate, not taupe: the placeholder is the only visible name of this field. Recorded in Appendix B. */
  .command-palette-input::placeholder {
    color: var(--color-slate);
    opacity: 1;
  }

  .command-palette-spinner {
    flex: none;
    color: var(--color-slate);
  }

  .command-palette-body {
    flex: 1 1 auto;
    min-height: min(20rem, 50dvh);
    overflow-y: auto;
    overscroll-behavior: contain;
  }

  /* The body scrolls, not the list. */
  .command-palette-list {
    max-height: none;
    overflow: visible;
  }

  .command-palette-end {
    flex: none;
    color: var(--color-ink);
    font-size: var(--text-small);
    line-height: var(--text-small--line-height);
    font-variant-numeric: tabular-nums;
  }

  /* The keyboard-active row is the only focus indicator, so it is the ink fill; the pointer keeps the wash. */
  .command-palette-list .menu-item[data-focus-visible] {
    background-color: var(--color-ink);
    color: var(--color-canvas);
    outline: none;
  }

  .command-palette-list .menu-item[data-focus-visible] :is(.menu-item-icon, .command-palette-end) {
    color: var(--color-canvas);
  }

  .command-palette-list .menu-item[data-focus-visible] .menu-item-description {
    color: color-mix(in srgb, var(--color-canvas) 70%, transparent);
  }

  .command-palette-list .menu-item[data-focus-visible] .menu-item-shortcut {
    background-color: color-mix(in srgb, var(--color-canvas) 20%, transparent);
    color: var(--color-canvas);
  }

  .command-palette-empty {
    padding: var(--spacing-peer);
    color: var(--color-slate);
    text-align: center;
  }

  .command-palette-status {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip-path: inset(50%);
    white-space: nowrap;
  }

  .command-palette-footer {
    display: flex;
    flex: none;
    gap: 1rem;
    padding: 0.5rem var(--spacing-peer);
    border-block-start: 1px solid var(--color-divider);
    color: var(--color-slate);
    font-size: var(--text-small);
    line-height: var(--text-small--line-height);
  }

  /* A phone has no keys to hint. */
  @media (pointer: coarse) {
    .command-palette-footer {
      display: none;
    }
  }

  @media (forced-colors: active) {
    .command-palette {
      border-color: CanvasText;
    }

    /* A background change does not survive; the input's own outline returns. */
    .command-palette-input:focus-visible {
      outline: auto;
    }

    .command-palette-list .menu-item[data-focus-visible] {
      background-color: Highlight;
      color: HighlightText;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .command-palette {
      transition: none;
    }
  }
}
```

Right to left: the glass is first in DOM and the Esc key last, so they swap ends; the label, the end slot and the shortcut keep reading order; everything is logical.

**Code** (the close-then-act sequence and the shortcut listener, because the order is the point):

```tsx
// Inside CommandPalette, after the open state is resolved into `isOpen` and `setOpen`:
const onActionRef = useRef(onAction);
useEffect(() => {
  onActionRef.current = onAction;
}, [onAction]);
const chosen = useRef<CommandPaletteItem | null>(null);

const choose = (item: CommandPaletteItem): void => {
  record(String(item.id));
  chosen.current = item;
  setOpen(false);
};

// Given to ModalFrame as onUnmount. The panel has left the page; React Aria restores focus in the
// next frame; the app moves it after that, so the last word is the caller's.
const afterClose = (): void => {
  const item = chosen.current;
  if (!item) return;
  chosen.current = null;
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      onActionRef.current(item);
    });
  });
};

// The shortcut: installed while mounted, parsed once, ignored under another modal.
const parsed = useMemo(() => (shortcut === false ? null : parseShortcut(shortcut)), [shortcut]);
useEffect(() => {
  if (!parsed) return;
  const onKeyDown = (event: KeyboardEvent): void => {
    if (!matchesShortcut(event, parsed) || isAnotherModalOpen(id)) return;
    event.preventDefault();
    setOpen(!isOpenRef.current);
  };
  document.addEventListener('keydown', onKeyDown);
  return () => {
    document.removeEventListener('keydown', onKeyDown);
  };
}, [parsed, id, setOpen]);
```

```ts
// shortcut.ts
export function parseShortcut(shortcut: string): ParsedShortcut {
  const tokens = shortcut.split('+').map((token) => token.trim());
  const key = tokens.pop();
  if (!key) throw new Error(`The shortcut "${shortcut}" names no key.`);
  const parsed: ParsedShortcut = { mod: false, shift: false, alt: false, key };
  for (const token of tokens) {
    const name = token.toLowerCase();
    if (name === 'mod') parsed.mod = true;
    else if (name === 'shift') parsed.shift = true;
    else if (name === 'alt') parsed.alt = true;
    else throw new Error(`The shortcut "${shortcut}" has an unknown modifier "${token}".`);
  }
  return parsed;
}

export function matchesShortcut(event: KeyboardEvent, parsed: ParsedShortcut): boolean {
  if (event.defaultPrevented || event.isComposing) return false;
  const mod = event.metaKey || event.ctrlKey;
  return (
    mod === parsed.mod &&
    event.shiftKey === parsed.shift &&
    event.altKey === parsed.alt &&
    event.key.toLowerCase() === parsed.key.toLowerCase()
  );
}
```

`recentsStore.ts` follows `packages/react/src/collapsible-card/foldStore.ts` line for line in shape (the `read`, `write`, `next` trio, the `local()` guard, the listener set, the `storage` event, `useSyncExternalStore` with an empty server snapshot), keyed per `storageKey` instead of one entry; read it first.

**Tests, written first:**
- `shortcut.test.ts`: `parseShortcut('Mod+K')` is `{ mod: true, shift: false, alt: false, key: 'K' }`; `'mod+shift+p'` parses case-insensitively; `'K'` has no modifier; `'Mod+'` and `'Ctrl+K'` throw; `matchesShortcut` is true for `metaKey` and for `ctrlKey` with `k` or `K`, false with `altKey`, with `shiftKey` unlisted, with the wrong key, when `defaultPrevented`, when `isComposing`, and when no modifier is down.
- `recentsStore.test.ts`: `entryFor('x')` is `snapshot-ui:recent:x`; `read` returns `[]` for a missing entry, bad JSON, a non-list, a throwing storage and `null` storage, and drops non-strings; `write` swallows a throwing storage; `push` moves to the front, deduplicates and cuts to the limit; `useRecents` in a probe reads the entry, records to the front, writes the entry, hears another tab's `storage` event for its key and ignores one for another key, and with no key reads nothing and stores nothing.
- `CommandPalette.test.tsx` (queries on `document.body`; a fixture of eight items across three sections and two ungrouped, with icons, descriptions, keywords, ends and a shortcut; `vi.useFakeTimers()` where a timer matters): the dialog is named by `label`, the input by `label`, the placeholder is `labels.placeholder` or the label; the input has `aria-autocomplete="list"`, `autocomplete="off"` and `spellcheck="false"`; the input has focus on open; the status element exists from the first render, is empty with an empty query, says `labels.status(count, query)` 600ms after typing and not at 599, says nothing new for a keystroke 300ms later until 600ms after it, waits while `isLoading` and speaks when it turns false; the default filter keeps an item when every word matches, in any order, ignoring case and accents (`"café"` matches `"cafe"`), and searches the label, the description and the keywords; a section with no match is hidden; manual mode shows the items as given whatever the input holds; sections group in first-seen order after the ungrouped items; Recent appears first with an empty input, holds only ids that exist in `items`, newest first, at most `recentLimit`, and disappears once there is text; choosing records to storage at the front and a repeat moves rather than doubles; a controlled `recentIds` with `onRecentChange` stores nothing and reports the new list; blocked storage and bad JSON give no Recent and no error; `isLoading` renders the Spinner named `labels.loading`; the empty line shows `labels.empty` with text and no match; Escape with text and an active row closes in one press; Enter chooses the active item; Enter while composing (`keyDown` with `isComposing: true`) chooses nothing; Mod+K toggles with `metaKey` and with `ctrlKey`, not with `altKey`, not when `defaultPrevented`, not while composing, not while a `Dialog` is open, and `shortcut={false}` installs nothing (a spy on `document.addEventListener` sees no `keydown`); `shortcut="Mod+J"` works and Mod+K does not; `onAction` is called once with the original item (not the Recent copy) after the palette has closed (`waitFor`, with `requestAnimationFrame` real or faked through `vi.useFakeTimers({ toFake: ['requestAnimationFrame', ...] })`); `onOpenChange(false)` is called before `onAction`; the panel copies `data-theme` from a focused trigger inside a dark scope; `className` on the panel, `ref` on the dialog element; axe on the open state with results, with the empty line and with the spinner.
- `server-render.test.tsx`: `['CommandPalette, closed', <CommandPalette label="Search" items={[]} onAction={() => undefined} />, [], ['command-palette']]` (renders nothing, and the module imported without a document).
- `css.test.js`, `describe('src/components/command-palette.css')`: the overlay's `12vh` top and `align-content: start;`; the surface's width cap and `max-height: min(35rem, calc(88dvh - 1rem));`, the frame, corner, fill and shadow; the field's divider and the focus line as a pseudo-element reading `--focus-ring-color` with no `box-shadow` in the file but the surface's; the placeholder in `--color-slate` with `opacity: 1;` (an exception, so the `type components` taupe test does not cover this file); the body's floor `min(20rem, 50dvh)`; the active row's ink fill with `outline: none;` and the three inverted parts; the coarse-pointer block hides the footer; the forced-colors block restores `outline: auto` on the input and paints the active row `Highlight`; the reduced-motion block. Import order: `command-palette.css` after `toast.css`.
- `contrast.test.js`, `describe('the command palette')`: slate on float at `TEXT` is in the gate (the placeholder, 5.49 and 6.94); canvas on ink at `TEXT` (the active row); the end slot is ink on float, gated.
- Stories, `CommandPalette.stories.tsx`, title `Components/CommandPalette`, each rendering a `Button` "Search" that opens the palette through state and the palette `defaultOpen` for the visual ones, with the fixture items and `storageKey` unset unless named:
  - `Recent` (visual): `recentIds={['transactions', 'budgets']}` controlled, empty input. Play: the first section is named `Recent`, the surface's top is 12vh from the viewport's top (within 1px), the input is focused.
  - `Results` (visual): `defaultInputValue="re"`, sections, icons, ends, shortcuts; play presses Arrow Down once (keyboard only) so the first row is keyboard-active. Play: the active row's computed background is `tokenColor('--color-ink')`, its end slot `tokenColor('--color-canvas')`.
  - `NoMatch` (visual): `defaultInputValue="zzzzqx"`. Play: the empty line reads "No results", the body is at least `min(20rem, 50dvh)` tall.
  - `Loading` (visual): `isLoading` with `defaultInputValue="tr"`. Play: the spinner is named "Loading" and sits before the Esc key.
  - `Narrow` (visual): a 375px frame (the mode does the rest; also a wrapper that forces 375 at 1280). Play: no sideways scroll, the surface is `innerWidth - 32` wide at 375.
  - `InDarkScope` (visual): the opening button inside a dark card, opened by the play (keyboard: Tab to the button, Enter). Play: `.command-palette` has `data-theme="dark"`, the scrim none.
  - `Keys` (`no-visual`): play presses Arrow Down past the last row and expects the first active, Arrow Up from the first and expects the last; Home and End; Enter chooses; Escape closes at once with text.
  - `PointerWash` (`no-visual`): play hovers a row and expects the wash (`washColor()`) and not the ink fill; presses it and expects the palette closed.
  - `OnActionKeepsFocus` (`no-visual`): a `TextField` beside the button; `onAction` focuses it; play opens, presses Enter on a row, `waitFor` the field to be `document.activeElement`, then waits two more frames and asserts it still is (Review Focus 4).
  - `ShortcutUnderADialog` (`no-visual`): a `Dialog defaultOpen` and the palette closed; play presses Mod+K and expects no palette; closes the dialog, presses Mod+K and expects it open, presses again and expects it closed.
  - `Sections` (`no-visual`): play types "b" and expects only the matching sections, in first-seen order.
- Docs end-to-end, `docs.spec.ts`: `test('the command palette page opens on its shortcut, filters, moves, and acts after the close')` (press `ControlOrMeta+j`, since the docs site's own search owns Cmd+K and the examples use `Mod+J` and say so; type "bud", Arrow Down, Enter, expect the page's result line to show the chosen item and the trigger button focused first); `test('the palette hides its key hints on a touch screen')` with `test.use({ hasTouch: true, viewport: { width: 375, height: 760 } })` (the footer is hidden); `test('the palette remembers recents across a reload')` (choose an item, reload, open, expect a Recent section with it). `components.spec.ts`, forced colors: `test('the palette active row is drawn in Highlight')`. Maps: `'command-palette'` in `NO_LONG_TEXT`, `SERVER_RENDERED: ['.stage .button']`.

**Docs:**
- `command-palette.mdx`, title "Command palette", description "A search-and-jump dialog on Cmd or Ctrl+K: type to filter, arrows to move, Enter to go, with recents and an app-driven async mode.", icon `Command`. Sections: `## Basic` (`command-palette-basic`: items with icons, descriptions, ends and shortcuts, sections, `storageKey`, `shortcut="Mod+J"` because this site's own search owns Cmd+K), `## Async results` (manual mode: `filter={null}`, controlled `inputValue` and `onInputChange`, the app filters, ranks and caps, `isLoading` while it does; `command-palette-async`), `## Usage` (no trigger export: the app's button opens it through `isOpen`, with `Kbd` showing the key; `onAction` runs after the palette has closed and focus has returned, so navigate there and nothing fights the restore; no `href` and no routing inside; `labels` for other words; `recentIds` and `onRecentChange` to own the history), `## Props` (three tables: "CommandPalette props" for `Pick<CommandPaletteProps, 'label' | 'items' | 'onAction' | 'isOpen' | 'defaultOpen' | 'onOpenChange' | 'inputValue' | 'defaultInputValue' | 'onInputChange' | 'filter' | 'isLoading' | 'shortcut' | 'storageKey' | 'recentLimit' | 'recentIds' | 'onRecentChange' | 'labels' | 'className'>`, "Item" for `CommandPaletteItem`, "Labels" for `CommandPaletteLabels`), `## Accessibility` (a dialog named by `label`; the input keeps DOM focus and the list has virtual focus, so the active row is the ink fill; the status line says the count after typing pauses; `<Keys rows={[['Mod K', 'Opens and closes the palette (Mod is Cmd or Ctrl).'], ['Down Up', 'Move the active row, wrapping.'], ['Home End', 'Jump to the first or last row.'], ['Enter', 'Opens the active item.'], ['Escape', 'Closes the palette.'], ['Tab', 'Stays in the dialog.']]} />`; a follow-up for the owner: the `role="menu"` behind `aria-activedescendant` is to be checked in VoiceOver and NVDA before the shell ships; the fallback is React Aria's ListBox at no API change), `## Design rules` (dos: label every item with what it opens, give amounts preformatted in `end`, keep sections few; donts: never route inside the palette, never a `suggestions` list in the empty state yet, never more than one shortcut listener on a page).
- Examples: `command-palette-basic.tsx` (client: a button, the palette, a result line), `command-palette-async.tsx` (client: a fake index searched on a 400ms timer with `isLoading`).
- `meta.json`: `"command-palette"` after `"collapsible-card"` and before `"confirm-dialog"`. Index, footer and READMEs: "Command palette".
- `docs/design-system.md`, `## CommandPalette`: the source palette (spec 2) and what is kept; the surface values from the docs search dialog and the measurements (the placeholder exception: slate 5.49 and 6.94 on float because the placeholder is the field's only visible name; the active row 16.25 and 19.31; the description 8.34 and 7.34); the focus line as a pseudo-element because the token-only rule forbids a literal shadow; the 12vh anchor and the body floor; the 600ms quiet period shared with Pagination; the shortcut grammar; the close-then-act order and why; the recents entry; the Menu-with-ListBox-fallback decision and the pending screen-reader check as the owner's.

**Changeset** `.changeset/overlays-command-palette.md`:

```markdown
---
'@snapshot-ui/core': minor
'@snapshot-ui/react': minor
---

Add CommandPalette: a Cmd or Ctrl+K dialog near the top of the viewport with an input over a menu, an AND-of-words filter that ignores case and accents or a manual mode for app-driven results with a loading state, sections, recents in local storage or controlled, a status line that waits for typing to pause, and `onAction` after the palette has closed and focus has returned.
```

**Steps:**

- [ ] **Step 1: Write the failing tests** listed above, stories included.
- [ ] **Step 2: Run them and watch them fail** (the seven commands of Task 4's Step 2, with `CommandPalette` as the Storybook filter). Expected: the core run FAILS every palette CSS test; the React run FAILS to import the three modules; the Storybook run fails to import the story file; the end-to-end run FAILS the completeness guards (`+ "command-palette"`) and the new tests.
- [ ] **Step 3: Write the modules, the `id` prop on `ModalFrame`, the CSS, the stories, the examples, the page, the record and the changeset.** Add the `CommandPalette` size-limit entry with an 8 kB placeholder (spec 16's second heavy entry), measure, and set the limit by the rule.
- [ ] **Step 4: Run the tests and watch them pass** (the four commands of Task 4's Step 4, filter `CommandPalette`). Expected: all pass: the 12 core tests, 12 shortcut tests, 12 store tests, about 40 palette tests, the server row, and the 11 stories in both projects.
- [ ] **Step 5: Run everything** (the nine commands of Task 1's Step 5). Expected: every gate green; one more static page; the end-to-end run passes with the page's 4 loop tests, the three new palette tests and the forced-colors one; `CommandPalette` within its limit; `pnpm verify` exits 0; lint passes with one `jsx-a11y/no-autofocus` disable in `CommandPalette.tsx`.
- [ ] **Step 6: Visual baselines.** Expected: 30 new files for `recent`, `results`, `no-match`, `loading`, `narrow` and `in-dark-scope`, no changed file. What to look at: a 640px white surface 12vh from the top with a glass, an input, an Esc key, a list of rows with icons and tabular amounts at the end, the first row filled in ink with white text in `results`, the "No results" line centred in a tall empty body, the spinner before Esc, the 343px surface at 375 with no footer, the dark surface on the light page.
- [ ] **Step 7: Commit**

```bash
git add .changeset/overlays-command-palette.md "apps/docs/app/(home)/home-page.tsx" apps/docs/content/docs/components/command-palette.mdx apps/docs/content/docs/components/meta.json apps/docs/examples/command-palette-async.tsx apps/docs/examples/command-palette-basic.tsx apps/docs/examples/index.ts apps/docs/tests/components.spec.ts apps/docs/tests/docs.spec.ts docs/design-system.md packages/core/README.md packages/core/src/components/command-palette.css packages/core/src/styles.css packages/core/test/contrast.test.js packages/core/test/css.test.js packages/react/.size-limit.json packages/react/README.md packages/react/src/command-palette/CommandPalette.stories.tsx packages/react/src/command-palette/CommandPalette.test.tsx packages/react/src/command-palette/CommandPalette.tsx packages/react/src/command-palette/index.ts packages/react/src/command-palette/recentsStore.test.ts packages/react/src/command-palette/recentsStore.ts packages/react/src/command-palette/shortcut.test.ts packages/react/src/command-palette/shortcut.ts packages/react/src/index.ts packages/react/src/overlay/ModalFrame.tsx packages/react/test/server-render.test.tsx "apps/storybook/tests/visual/__screenshots__/components-commandpalette--*.png"
git commit -m "feat: add CommandPalette"
```

---
### Task 13: Tooltip

**Goal:** the ink tip with canvas text: 400ms on hover, at once on keyboard focus, warm for about half a second after one closes, hoverable, closed by Escape, a press, a scroll and a resize, never on touch, with an arrow and a key chip for a shortcut. Implements spec 12.1 to 12.3, the Tooltip ruling of 13.1, 13.2 items 11 and 16, and retires the "Still missing: tooltip" note. The shell spec's collapsed rail depends on it.

**Files:**
- Create: `packages/react/src/tooltip/Tooltip.tsx`, `packages/react/src/tooltip/index.ts`
- Modify: `packages/react/src/index.ts`, `packages/react/.size-limit.json`
- Test: `packages/react/src/tooltip/Tooltip.test.tsx` (create), `packages/react/test/server-render.test.tsx`
- Test (stories): `packages/react/src/tooltip/Tooltip.stories.tsx` (create)
- Create: `packages/core/src/components/tooltip.css`
- Modify: `packages/core/src/styles.css` (import after `command-palette.css`, the last import)
- Test: `packages/core/test/css.test.js`, `packages/core/test/contrast.test.js`
- Create: `apps/docs/content/docs/components/tooltip.mdx`, `apps/docs/examples/tooltip-basic.tsx`, `apps/docs/examples/tooltip-shortcut.tsx`
- Modify: `apps/docs/content/docs/components/meta.json`, `apps/docs/examples/index.ts`, `apps/docs/app/(home)/home-page.tsx`
- Test: `apps/docs/tests/components.spec.ts`, `apps/docs/tests/docs.spec.ts`
- Modify: `packages/core/README.md`, `packages/react/README.md`
- Modify: `docs/design-system.md` (a `## Tooltip` section appended to Appendix B; the "Still missing" paragraph of Appendix A), `docs/specs/2026-10-10-snapshot-ui-design.md` (one sentence in section 6.3)
- Create: `.changeset/overlays-tooltip.md`
- Create (Docker step): 20 baselines, `apps/storybook/tests/visual/__screenshots__/components-tooltip--*.png`. None changes.

**Interfaces:**
- Consumes: from `react-aria-components` 1.22.1, `TooltipTrigger` as `RACTooltipTrigger` (`delay` default 1500, `closeDelay` default 500, `isDisabled`, `trigger`, `isOpen`, `defaultOpen`, `onOpenChange`; it gives the trigger `aria-describedby` while open, opens on hover with a mouse after `delay`, at once on focus only when the focus is visible, closes on a pointer down or key down of the trigger, on blur, and after `closeDelay` when the pointer leaves; React Aria's `useHover` ignores touch pointers; a module-level warm-up means that for `TOOLTIP_COOLDOWN` of 500ms after a close starts the next tip opens with no delay, read in `react-stately`'s `useTooltipTriggerState.mjs`; a document-level `keydown` listener closes on Escape; `useOverlayPosition` closes on an ancestor scroll and on resize), `Tooltip` as `RACTooltip` (`placement`, `offset`, `triggerRef`, a render-function `className` with `{ placement, isEntering, isExiting }`; `role="tooltip"`, `data-placement`, the inline z-index 100000; it does not set `dir`), `TooltipContext`, `OverlayArrow` (carries `data-placement`), `useSlottedContext`, `useLocale`, `composeRenderProps`, the `Placement` type; `useOverlayScope` and `mergeRefs` (Task 3); `Shortcut` (Task 10); `cx`, `present`; `overlay.css`.
- Produces `Tooltip.tsx`, a client module, exported from `@snapshot-ui/react` as `Tooltip` and `TooltipTrigger`:

```ts
'use client';

export interface TooltipTriggerProps extends RACTooltipTriggerComponentProps {
  /** Milliseconds of hover before it opens. @default 400 */
  delay?: number;
  /** Milliseconds after the pointer leaves before it closes, so the pointer can cross onto the tip. @default 120 */
  closeDelay?: number;
}

/** Wraps a trigger element and a Tooltip. Built on React Aria's TooltipTrigger with the library's delays. */
export function TooltipTrigger(props: TooltipTriggerProps): ReactElement;

export interface TooltipProps extends Omit<RACTooltipProps, 'className' | 'children' | 'style'> {
  /** The text. It is the trigger's accessible description while open. */
  children: ReactNode;
  /** A key hint after the text, such as "K" or "Mod K", drawn as a key on the tip. */
  shortcut?: string;
  /** @default 'top' */
  placement?: Placement;
  /** The gap to the trigger, the arrow included. @default 12 */
  offset?: number;
  /** Goes on the tip, merged after the library's classes. */
  className?: string | ((values: TooltipRenderProps & { defaultClassName: string | undefined }) => string);
  ref?: Ref<HTMLDivElement>;
}

export function Tooltip(props: TooltipProps): ReactElement;
```

- Later tasks rely on: nothing in this plan. The shell spec's collapsed rail passes `isDisabled` to `TooltipTrigger` while the rail is expanded and `shortcut` on the search item's tip.

**Behavior:**
1. **Markup.** `div.overlay.tooltip[role="tooltip"][data-placement][dir]` holding `div.tooltip-arrow` (React Aria's `OverlayArrow`, with an 8px `svg[aria-hidden]` path), the `children`, and `kbd.tooltip-shortcut` (the `Shortcut`) when `shortcut` is given.
2. **Opening.** After 400ms of hover with a mouse; at once on keyboard focus (focus-visible only: a click's focus shows no tip). Never for touch. A disabled trigger is not focusable and gets no tip; a static element needs React Aria's `Focusable`, which the docs say.
3. **Warm window.** Once a tip has opened, the next opens with no delay for about half a second after the last close started (React Aria's 500ms cooldown less the 120ms close delay). Not configurable; the fade still runs.
4. **Closing.** When the pointer leaves, after 120ms, unless it moved onto the tip, which is hoverable; on Escape, which closes the tip and not a dialog it sits in; on a press of the trigger; when a scrollable ancestor scrolls; on window resize.
5. **Announcement.** `role="tooltip"`; the trigger carries `aria-describedby` while it is open. On an icon button the tip mirrors the `aria-label`, which a screen reader may read twice; the docs say a tooltip is supplementary, and the fallback, `aria-hidden` on the tip (which passes through), is named there and in Appendix B for the owner's screen-reader check before the shell ships.
6. **Scope and direction.** The tip copies the scope from the trigger ref React Aria gives through `TooltipContext` (or the `triggerRef` prop); `dir` from `useLocale()` on the tip.
7. **Placement.** `top` by default, 12px from the trigger with the arrow inside that, flipped near an edge; `data-placement` says where.
8. **Server.** Closed, nothing renders; the trigger does.

**CSS**, the whole of `tooltip.css`:

```css
/*
 * Tooltip: the source's ink tip with canvas text, the 6px step the design document gives tooltips,
 * the float shadow, an 8px arrow, 14px text (the sentence floor; light on dark at 450 renders heavier
 * than it measures), wrapping at 20rem, a 140ms ease-out fade with a 4px slide toward the trigger,
 * and a key chip in canvas at 20% over ink. The transparent border is repainted in forced colors so
 * the tip keeps a shape when the arrow is hidden. Derived in docs/design-system.md ("Tooltip").
 */
@layer components {
  .tooltip {
    max-width: min(20rem, calc(100vw - 2rem));
    padding: 0.375rem 0.625rem;
    border: 1px solid transparent;
    border-radius: var(--radius-micro);
    background-color: var(--color-ink);
    color: var(--color-canvas);
    box-shadow: var(--shadow-float);
    font-size: var(--text-small);
    line-height: var(--text-small--line-height);
    font-weight: var(--text-small--font-weight);
    overflow-wrap: anywhere;
    transition:
      opacity 140ms ease-out,
      translate 140ms ease-out;
  }

  .tooltip:is([data-entering], [data-exiting]) {
    opacity: 0;
  }

  .tooltip[data-placement='top']:is([data-entering], [data-exiting]) {
    translate: 0 4px;
  }

  .tooltip[data-placement='bottom']:is([data-entering], [data-exiting]) {
    translate: 0 -4px;
  }

  .tooltip[data-placement='left']:is([data-entering], [data-exiting]) {
    translate: 4px 0;
  }

  .tooltip[data-placement='right']:is([data-entering], [data-exiting]) {
    translate: -4px 0;
  }

  .tooltip-arrow svg {
    display: block;
    width: 8px;
    height: 8px;
    fill: var(--color-ink);
  }

  .tooltip-arrow[data-placement='bottom'] svg {
    rotate: 180deg;
  }

  .tooltip-arrow[data-placement='left'] svg {
    rotate: -90deg;
  }

  .tooltip-arrow[data-placement='right'] svg {
    rotate: 90deg;
  }

  /* The one key look, inverted for the ink tip. */
  .tooltip-shortcut {
    margin-inline-start: 0.5rem;
    padding: 0.125rem 0.375rem;
    border-radius: var(--radius-micro);
    background-color: color-mix(in srgb, var(--color-canvas) 20%, transparent);
    color: var(--color-canvas);
    font-family: var(--font-sans);
    font-size: 0.75rem;
    line-height: 1;
    letter-spacing: var(--text-overline--letter-spacing);
    font-weight: var(--text-overline--font-weight);
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
  }

  /* An svg fill is repainted, so the arrow goes and the border carries the shape. */
  @media (forced-colors: active) {
    .tooltip {
      border-color: CanvasText;
    }

    .tooltip-arrow {
      display: none;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .tooltip {
      transition: none;
    }
  }
}
```

The arrow's svg is `<svg viewBox="0 0 8 8"><path d="M0 0 4 4 8 0" /></svg>` drawn point-down for the `top` placement; React Aria positions the arrow element. Right to left: `end` placements resolve through React Aria; the chip's margin is logical.

**Tests, written first:**
- `Tooltip.test.tsx` (queries on `document.body`; `vi.useFakeTimers()` for the delays; `userEvent` with `advanceTimers`): a trigger with a tip renders `role="tooltip"` only while open; the trigger's `aria-describedby` resolves to the tip's text while open and is absent when closed; hover opens at 400ms and not at 399 (default delay) and `delay={100}` at 100; leaving closes at 120ms and not at 119, and `closeDelay={0}` at once; keyboard focus (`userEvent.tab()`) opens at once; `isDisabled` on the trigger opens nothing on hover or focus; the shortcut chip renders `kbd.tooltip-shortcut` with the resolved text; `placement` and `offset` reach React Aria (`data-placement` is the requested side in jsdom); `dir` is `rtl` under `I18nProvider locale="ar-EG"`; the tip copies `data-theme` from a trigger inside a dark scope; Escape closes it; a press on the trigger closes it; `className` on the tip, `ref` on it; axe on the open state (a `Button` trigger with a tip).
- `server-render.test.tsx`: `['Tooltip, closed', <TooltipTrigger><IconButton aria-label="Search"><svg /></IconButton><Tooltip>Search</Tooltip></TooltipTrigger>, ['<button', 'aria-label="Search"'], ['role="tooltip"']]`.
- `css.test.js`, `describe('src/components/tooltip.css')`: the ink fill and canvas text, the transparent 1px border, `--radius-micro`, `--shadow-float`, the width cap, the small-step font, `overflow-wrap: anywhere;`; the four placement slides; the arrow's 8px and `fill: var(--color-ink);` with the three rotations; the chip's `color-mix(in srgb, var(--color-canvas) 20%, transparent)` and its 12px overline look; the forced-colors block hides `.tooltip-arrow` and sets the border `CanvasText`; the reduced-motion block after the transition. Import order: `tooltip.css` last.
- `contrast.test.js`, `describe('the tooltip')`: canvas on ink at `TEXT` is in the gate (16.25 and 19.31); the chip's canvas on canvas at 20% over ink (9.13 and 12.37) is the menu's recorded composite, computed again here in both modes; the tip against canvas, lifted, float and raised is ink on those surfaces, gated at `TEXT` already.
- Stories, `Tooltip.stories.tsx`, title `Components/Tooltip`, the visual ones controlled open with `isOpen` on the trigger (stable, no timers) and keyboard-only plays:
  - `Top` (visual): an `IconButton aria-label="Edit"` with the tip "Edit". Play: `role="tooltip"` above the button (its bottom is above the button's top by at least 12px), `data-placement="top"`.
  - `End` (visual): `placement="end"` with `shortcut="Mod K"` on "Search". Play: the chip reads `⌘ K` or `Ctrl K`; the arrow exists and is 8px; the tip is to the right of the button.
  - `Wrapped` (visual): a 90-word description. Play: the tip's width is at most 320px and its height holds several lines.
  - `InDarkScope` (visual): the trigger in a dark card, the page light. Play: the tip has `data-theme="dark"` and the computed background is the dark ink (white).
  - `OpensOnFocusNotClick` (`no-visual`): play Tabs to the button and expects the tip at once; blurs; clicks the button and expects no tip (a click's focus is not visible).
  - `WarmWindow` (`no-visual`): two buttons; play hovers the first, `waitFor` the tip (within 1000ms), moves to the second and expects its tip within 50ms (no delay within the window), not asserting a number for the window itself.
  - `EscapeInsideDialog` (`no-visual`): a `Dialog defaultOpen` with a tooltipped button; play focuses the button (tip opens), presses Escape, expects the tip gone and the dialog still open; presses Escape again and expects the dialog gone.
  - `HoverableTip` (`no-visual`): play hovers the trigger, waits for the tip, moves the pointer onto the tip, waits 300ms, expects it still open; moves away, expects it closed.
  - `TouchOpensNothing` (`no-visual`): play uses `userEvent.pointer({ keys: '[TouchA]', target: button })` and waits 600ms; no tip.
  - `ScrollCloses` (`no-visual`): the trigger inside a 200px scrolling box; play opens by focus, scrolls the box by 10px, expects the tip gone.
  - `FlipNearEdge` (`no-visual`): the trigger at the top of the viewport (`position: fixed; top: 8px`); play opens by focus, expects `data-placement="bottom"`.
  - `DirFromLocale` (`no-visual`): under `I18nProvider locale="ar-EG"`, the tip has `dir="rtl"` and `placement="end"` lands on the left.
- Docs end-to-end, `docs.spec.ts`: `test('the tooltip page shows a tip on hover after a pause and at once on focus')` (hover an icon button, `expect(page.getByRole('tooltip')).toBeVisible()` within the default timeout, move away, Tab to it and expect the tip at once). `components.spec.ts`, forced colors: `test('a tooltip keeps a border and loses its arrow')` (open by focus, the tip's border is the CanvasText probe, `.tooltip-arrow` is hidden). Maps: `'tooltip'` in `NO_LONG_TEXT`, `SERVER_RENDERED: ['.stage .icon-button']`.

**Docs:**
- `tooltip.mdx`, title "Tooltip", description "A short ink label that names an icon or adds a hint, on hover after a pause and at once on keyboard focus, never on touch.", icon `MessageCircle`. Sections: `## Basic` (`tooltip-basic`: a row of icon buttons), `## With a shortcut` (`tooltip-shortcut`), `## Usage` (wrap the trigger and the tip in `TooltipTrigger`; a trigger must be focusable, so a static element needs React Aria's `Focusable`; `isDisabled` while the label is visible anyway, as a rail does when expanded; the delays; it closes on Escape, a press, a scroll and a resize; it never shows for touch, so nothing a touch user needs may live only in a tip), `## Props` (two tables: "TooltipTrigger props" for `Pick<TooltipTriggerProps, 'delay' | 'closeDelay' | 'isDisabled' | 'trigger' | 'isOpen' | 'defaultOpen' | 'onOpenChange'>`, "Tooltip props" for `Pick<TooltipProps, 'children' | 'shortcut' | 'placement' | 'offset' | 'className'>`), `## Accessibility` (a tooltip is supplementary: it is the trigger's description while open, and on an icon button it mirrors the `aria-label`, which a screen reader may read twice; never the only name of anything; `<Keys rows={[['Tab', 'Opens the tip on focus.'], ['Escape', 'Closes it.']]} />`), `## Design rules` (dos: one short line, name the action on an icon button, put a shortcut in `shortcut`; donts: never put essential information in a tip, never a tip on a disabled control, never interactive content inside).
- Examples: `tooltip-basic.tsx` (server file), `tooltip-shortcut.tsx` (server file).
- `meta.json`: `"tooltip"` after `"toast"`. Index, footer and READMEs: "Tooltip".
- `docs/design-system.md`: `## Tooltip` with the source's tip (spec 2), the delays and the warm window as React Aria gives them (500ms cooldown, 120ms close delay, about 380ms warm), the surface and its measurements (canvas on ink 16.25 and 19.31; the tip against canvas, lifted, float and raised 16.25 to 18.43 light and 15.36 to 19.31 dark; the chip 9.13 and 12.37), 14px and why, the width cap, the arrow and the 12px offset, the 140ms ease-out fade with the 4px slide and that it runs on a warm open too (React Aria's warm state is private), the forced-colors rule, React Aria's description announcement accepted with `aria-hidden` as the named fallback, and the owner's pending screen-reader check. In Appendix A's "Still missing" paragraph, "No specification for: tooltip, empty state, or loading state." becomes "No specification for: empty state or loading state. The tooltip is derived in Appendix B."
- `docs/specs/2026-10-10-snapshot-ui-design.md`, section 6.3: "A tooltip opens after 400ms on hover and at once on focus, and for 300ms after one closes the next opens without delay." becomes "A tooltip opens after 400ms on hover and at once on focus, and for about half a second after one closes the next opens without delay."

**Changeset** `.changeset/overlays-tooltip.md`:

```markdown
---
'@snapshot-ui/core': minor
'@snapshot-ui/react': minor
---

Add Tooltip and TooltipTrigger: an ink tip with canvas text that opens after 400ms of hover and at once on keyboard focus, stays warm for about half a second after one closes, is hoverable, closes on Escape, a press, a scroll and a resize, never shows for touch, and can carry a key chip through `shortcut`.
```

**Steps:**

- [ ] **Step 1: Write the failing tests** listed above, stories included.
- [ ] **Step 2: Run them and watch them fail** (the seven commands of Task 4's Step 2, with `Tooltip` as the Storybook filter). Expected: the core run FAILS every tooltip CSS test and passes the tooltip contrast describe; the React run FAILS to import `./Tooltip`; the Storybook run fails to import the story file; the end-to-end run FAILS the completeness guards (`+ "tooltip"`) and the new tests.
- [ ] **Step 3: Write the component, the CSS, the stories, the examples, the page, the record, the two amendments and the changeset.** Add the `Tooltip` size-limit entry (`"import": "{ Tooltip, TooltipTrigger }"`) with a 2 kB placeholder, measure, and set the limit by the rule.
- [ ] **Step 4: Run the tests and watch them pass** (the four commands of Task 4's Step 4, filter `Tooltip`). Expected: all pass: the 9 core tests, about 20 Tooltip tests, the server row, and the 12 stories in both projects.
- [ ] **Step 5: Run everything** (the nine commands of Task 1's Step 5). Expected: every gate green; one more static page; the end-to-end run passes with the page's 4 loop tests, the new tooltip test and the forced-colors one; `Tooltip` within its limit; `pnpm verify` exits 0.
- [ ] **Step 6: Visual baselines.** Expected: 20 new files for `top`, `end`, `wrapped` and `in-dark-scope`, no changed file. What to look at: a small black (white in dark) 6px-cornered tip above its icon button with a down-pointing arrow; the `end` one to the right with a translucent key chip reading the modifier and K; the wrapped one 320px wide over several lines; the dark-scope tip white with black text on a light page.
- [ ] **Step 7: Commit**

```bash
git add .changeset/overlays-tooltip.md "apps/docs/app/(home)/home-page.tsx" apps/docs/content/docs/components/meta.json apps/docs/content/docs/components/tooltip.mdx apps/docs/examples/index.ts apps/docs/examples/tooltip-basic.tsx apps/docs/examples/tooltip-shortcut.tsx apps/docs/tests/components.spec.ts apps/docs/tests/docs.spec.ts docs/design-system.md docs/specs/2026-10-10-snapshot-ui-design.md packages/core/README.md packages/core/src/components/tooltip.css packages/core/src/styles.css packages/core/test/contrast.test.js packages/core/test/css.test.js packages/react/.size-limit.json packages/react/README.md packages/react/src/index.ts packages/react/src/tooltip/Tooltip.stories.tsx packages/react/src/tooltip/Tooltip.test.tsx packages/react/src/tooltip/Tooltip.tsx packages/react/src/tooltip/index.ts packages/react/test/server-render.test.tsx "apps/storybook/tests/visual/__screenshots__/components-tooltip--*.png"
git commit -m "feat: add Tooltip"
```

After this commit every changeset of spec 16 exists, and the owner is told the batch is ready to release, which starts the consumer's shell phase.
