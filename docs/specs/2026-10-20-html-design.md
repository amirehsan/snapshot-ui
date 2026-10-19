# HTML: @snapshot-ui/html, and the 1.0 release: design

Status: approved on 2026-10-20. Written for the owner's review with a recommended answer to each open question of section 16; the owner took every recommendation, all 27, including the dependency-free behaviors script in place of the parent spec's Alpine plugin (recorded as an amendment in the parent spec, section 7), and approved the 1.0 batch of section 15 as written. Section 20 records the rulings.
Date: 2026-10-20
Parent spec: `docs/specs/2026-10-10-snapshot-ui-design.md`. This document takes phase 7 of the parent spec's catalog, "HTML version" (`@snapshot-ui/html`: "the Alpine plugin and copy-paste HTML for every component from phases 1 to 5", and section 7: "the source app's Alpine.js behaviors, generalized and shipped as an Alpine plugin, plus copy-paste HTML for every component on the docs site. It uses `@snapshot-ui/core` unchanged"). It then specifies the final "1.0" batch, which the owner moved to after phase 7 on 2026-10-20 (templates spec, ruling 1.0): the API review across every package, the stability promise of the templates spec's ruling 19, the deprecation policy, the docs' versions and the release steps. The design authority remains `docs/design-system.md`.
Released before this, if the roadmap holds: phases 1 to 4 through batch 10b (0.16.0); phase 5's batch 11a (0.17.0) and 11b (the docs shell, no release); phase 6's batch 12 (core and react 0.18.0, charts 0.3.0); the editor at 0.1.x from batch 9c. Everything is 0.x. This phase is batches 13a, 13b and 13c; the 1.0 batch is 14.

## Summary for the owner

What this phase adds, in plain words, in the order recommended:

**Phase 7, `@snapshot-ui/html`** (a new package, three minor releases, 0.1.0 to 0.3.0):

- **Copy-paste HTML for every component of phases 1 to 5,** on each component's docs page beside the React code, for apps that render HTML on the server without React: Rails, Django, Laravel, Phoenix, Go templates, a CMS theme, or plain files. It uses the same stylesheet, `@snapshot-ui/core`, unchanged, so an HTML button and a React button are the same button.
- **The HTML is made from the React parts,** not written twice: each docs example is rendered on the server and cleaned into a recipe, and a test fails when the React part's markup changes and the recipe was not regenerated. This is how the parent spec's promise that the two "cannot drift apart" is kept.
- **A small script for the components that need behavior,** such as a menu that opens and moves with the arrow keys, a combo box, tabs, a toast, a date picker or a list that reorders. Each behavior is a separate module of one to a few kilobytes, attached by a `data-behavior` attribute, with no other library needed. The source app's Alpine.js code is where each behavior is ported from; the recommendation is to ship it without Alpine as a dependency (open question 2, which changes a parent spec decision, so the owner must rule on it).
- **Works before the script, and without it.** Each recipe is built on the browser's own elements where one exists (a native dialog, `details`, the popover attribute, form fields that post), so a page is usable when the script is slow, blocked or fails, and the script makes it better rather than making it work.
- **In three batches:** 13a, the static parts and the native-element parts (no behavior or a tiny one); 13b, overlays and choices (menus, popovers, dialogs, tooltips, toasts, tabs, select, combo box, command palette, the sidebar); 13c, fields, data and settings (date and time, sliders, color, the data table, the lists that move, the save bar and the settings parts).

**Batch 14, "1.0"** (the 1.0.0 release):

- **An API review of all five packages,** against one written stability promise (the templates spec's ruling 19), each package's list signed off by the owner.
- **A deprecation policy:** nothing public is removed without first being deprecated, with a development warning and a docs note, for at least one minor release.
- **Versioned docs:** the site shows the released version; the unreleased `main` lives at a separate address; the last 0.x docs are kept frozen.
- **The release:** core and react 1.0.0 after one release candidate; charts 1.0.0 beside them; the editor and the HTML package stay 0.x for one more cycle (open questions 22 and 23).

What it does not add: HTML for the charts or the rich text editor (both are React-rendered; a static chart from the server is a later question), a template-language package (no Jinja, ERB or Blade helpers), web components, a CSS-only version of the interactive parts, and a CDN the library hosts.

## 1. Goal

Give apps that do not run React the whole library from phases 1 to 5: the same markup, on the same CSS, with behaviors that meet the same WAI-ARIA keyboard patterns and the same WCAG 2.2 AA bar, shipped as a small, dependency-free script; then release 1.0 with a written promise every package is reviewed against.

The hard parts:

- **Drift.** The React parts' markup is written by React Aria, which adds roles, states and ids by itself. Hand-written HTML would be a second copy that falls behind with every fix. The recipes must come from the React parts and be checked against them (section 7).
- **React Aria's behavior, without React Aria.** React Aria carries years of screen reader and touch fixes. A behavior written for HTML must meet the same keyboard tables the React docs publish, with the same tests, or the HTML version is a lesser library under the same name (risk R1).
- **Ids and state in plain HTML.** React writes `aria-labelledby`, `aria-controls` and `aria-activedescendant` from `useId`; a template engine does not know the ids it needs. The recipes use placeholders, and the behaviors fill the missing ones (section 7.3).
- **The page changes under the script.** Server-rendered apps swap HTML in and out (HTMX, Turbo, Livewire, a CMS preview). Behaviors must attach to new markup and let go of removed markup by themselves (section 8.3).
- **Strict content security policies.** A behavior that evaluates strings from attributes fails under a CSP without `unsafe-eval`. Alpine's standard build does that; a dependency-free script need not (section 4.2).
- **No script.** Every recipe has a face that works without the script, or says plainly what needs it.
- **1.0 is a promise across five packages** with different ages: core and react are mature, charts finished in phase 6, the editor and this package are new.

Build order inside each batch, from the least risk to the most:

1. **13a.** The recipe generator and the same-markup check (section 7), the behaviors runtime (section 8), the parity harness (section 12), then the static and native parts (section 9.1 and 9.2).
2. **13b.** Popover positioning, the focus utilities, then Menu, Tooltip, Dialog and its kin, Toast, Tabs, Select, ComboBox, MultiSelect, TagInput, CommandPalette, the Sidebar and the BottomTabBar (section 9.3).
3. **13c.** NumberField and SearchField, the date and time parts, Slider, ColorField, PhoneField, IconPicker, MediaInput and FileDropZone, the DataTable, Pagination and FilterBar, SaveBar, ConditionalFields, FieldExtras, ThemeSwitch, Repeater, the lists that move, CopyButton, FontPreview (section 9.4).
4. **14.** The review, the policy, the docs' versions, the release candidate, then 1.0.0 (section 15).

Out of scope, each recorded where it is deferred:

- **Charts and the rich text editor in HTML.** Phase 6 and the editor are not in the parent spec's "phases 1 to 5". A chart rendered by React on the server is already final HTML and SVG; shipping it as a recipe is open question 18.
- **Template-language helpers** (a Jinja macro, an ERB partial, a Blade component per part). The recipes are plain HTML an app turns into its own partials (open question 6).
- **Web components** (`<snapshot-menu>`). Open question 3.
- **A hosted CDN.** The package is on npm; public npm CDNs serve it, and the docs show a pinned, integrity-checked script tag (open question 7).
- **Behaviors for the docs-only and React-only helpers:** `RouterProvider` (an HTML link is already a link), `useConfirm`, `useAppShell`.

## 2. The batch split

About 75 parts from phases 1 to 5 get a recipe; about 45 of them need a behavior. One release would be the largest in the project and would hold the static parts, which need nothing new, behind the date picker and the drag lists. So it is three batches, each a minor of the new package, and then the 1.0 batch.

| Batch | Contents | Releases | Why together |
| --- | --- | --- | --- |
| **13a, Static and native** | The generator, the same-markup check, the runtime, the parity harness; every static part; the parts built on native elements: Button, IconButton, Link, the field parts, TextField, TextArea, Checkbox and CheckboxGroup, RadioGroup, Switch, SegmentedControl, Card, CollapsibleCard and Accordion on `details`, Breadcrumbs, PageHeader, PageColumn, AppShell's frame, PanelLayout's two faces, the layout parts, Preview, Meter, ProgressBar, Spinner, Skeleton, EmptyState, StatTile, DescriptionList, Avatar, AvatarGroup, Badge, Kbd, the typography | `@snapshot-ui/html` 0.1.0 | Nothing here needs more than a few lines of script; it proves the pipeline end to end |
| **13b, Overlays and choices** | Popover, Menu, Tooltip, Dialog, ConfirmDialog, Drawer, Sheet, SidePanel, Toast, Tabs, Select, ComboBox, MultiSelect, TagInput, ChoiceCards, PositionPad, CommandPalette, Sidebar (collapse, memory, drawer), BottomTabBar, AccountMenu and ThemeMenu | html 0.2.0 | One positioning layer, one focus layer, one dismiss stack, used by every part here |
| **13c, Fields, data and settings** | NumberField, SearchField, Calendar, MonthGrid, DatePicker, DateRangePicker, DateTimePicker, TimeField, TimeRangeField, Slider, RangeSlider, ColorField, PhoneField, IconPicker, MediaInput, FileDropZone, UploadList and UploadTray, DataTable, Pagination, FilterBar, FilterChip, SaveBar, ConditionalFields, FieldExtras, ThemeSwitch, Repeater, ReorderList, TreeBuilder, MasterDetailList, TransferList, CopyButton, FontPreview | html 0.3.0 | The parts with values, formats and moves, on 13b's overlays |
| **14, 1.0** | The review, the promise, the deprecation policy, the docs' versions, the release candidate, the release | core, react and charts 1.0.0; editor and html 0.x | Section 15 |

**Recommended order: 13a, 13b, 13c, then 14** (open question 1).

**Versions.** If nothing else releases between, after batch 12 (core and react 0.18.0): 13a, 13b and 13c are `@snapshot-ui/html` 0.1.0, 0.2.0 and 0.3.0, each with a core peer of `^0.18.0`. The parent spec says the HTML version uses core "unchanged"; where the parity harness finds a core bug, the fix is a core patch released with the batch (0.18.x), and html's peer follows it. The html package joins no fixed group before 1.0 (open question 23).

**If a batch must shrink.** In 13c, TreeBuilder and TransferList are the largest behaviors and can follow in a 0.4.0; in 13b, CommandPalette can. The 1.0 batch can start once 13c is merged, whether or not those follow.

## 3. What it takes from earlier batches

| From an earlier batch | Used here as |
| --- | --- |
| `@snapshot-ui/core`: `styles.css`, every component file, the tokens, the theme axes (`data-theme`, `data-shape`, `data-density`), the holder properties, the forced-colors blocks, `charts.css` untouched | The recipes' only stylesheet |
| Every React part's server render, as the server suites already exercise it (`server-render.test.tsx`, `server-face.test.tsx`) | The source of each recipe (section 7) |
| The docs' examples (`apps/docs/examples/*.tsx`) | One recipe per example, so each docs page's HTML tab shows the example its React tab shows |
| The component roots list (`packages/core/scripts/component-roots.js`) | The classes a recipe may use, and the check that it uses only those |
| `same-markup.test.tsx` (LineChart, batch 6) | The model for the same-markup check |
| Every part's Keys table and focus table in its spec and docs page | The behaviors' contract and their tests (section 12) |
| The Storybook visual baselines, five modes and compact | The parity harness compares each recipe's screenshot to its React story's baseline (section 12) |
| The design record's rules (Escape stopped where handled, focus never to the body, live regions mounted empty, the tooltip's 400ms and its warm half second, toasts' 6 and 12 seconds, a select's filter past 8, conditional fields inert) | Each behavior's rules |
| The source app's Alpine.js behaviors (`js/*.js`, located through the gitignored `.local/SOURCE.md`) | The reference each behavior is ported from (risk R9) |
| The templates spec's section 11 and ruling 19 | The 1.0 batch's input (section 15) |

## 4. What this phase answers

### 4.1 The parent spec's row

| Row | Here |
| --- | --- |
| "`@snapshot-ui/html`: the Alpine plugin and copy-paste HTML for every component from phases 1 to 5" | Copy-paste HTML for every component of phases 1 to 5 (section 7), and the behaviors (section 8), as a dependency-free script by recommendation, with the Alpine plugin as the alternative (section 4.2) |
| "It uses `@snapshot-ui/core` unchanged" | Kept: no CSS in the html package; a core change found by parity is a core fix that serves both versions |
| "Specified in its own document" | This document |
| The parent spec's success criterion: "The React and HTML versions cannot drift apart, because they share one CSS layer and one token source" | Strengthened: they also share one markup source (section 7) |

### 4.2 Alpine, or no dependency

The parent spec chose an Alpine plugin because the source app's behaviors are Alpine. Weighed again now that the library's React parts set the bar:

| | An Alpine plugin (`Alpine.plugin(snapshot)`, `x-data="snapshotMenu"`) | A dependency-free behaviors script (`data-behavior="menu"`) |
| --- | --- | --- |
| What an app loads | Alpine (about 15 kB compressed, to verify) and the plugin | The runtime (about 1.5 kB) and only the behaviors its pages use |
| Strict CSP (no `unsafe-eval`) | Needs Alpine's separate CSP build, which drops inline expressions (to verify its current limits) | Works: nothing is evaluated from attributes |
| Apps on HTMX, Turbo, Livewire, a CMS | Alpine initializes added markup by itself (to verify with Turbo's cache) | The runtime's observer does (section 8.3) |
| Apps already on Alpine | Native fit | Works beside Alpine; a 30-line adapter in the docs registers each behavior as an Alpine directive |
| The source's code | Ported nearly as is | Ported to plain modules; the source stays the reference for each rule |
| The recipe's markup | Carries Alpine attributes (`x-data`, `@keydown`), so a recipe is Alpine-specific | Carries `data-behavior` and `data-*` options only, readable by any back end |
| Long-term cost | Tracks Alpine's majors | Tracks only the platform |

**Recommended (open question 2): a dependency-free script,** with the Alpine adapter as a documented recipe. This changes the parent spec's decision, so it is the first ruling the owner is asked for; if the owner keeps Alpine, sections 6 and 8 change their entry points and nothing else here does.

### 4.3 What each part needs

Each part of phases 1 to 5 is in one of three tiers, which set its batch:

- **Static.** The React part is a server part, so its server render is all there is. No behavior.
- **Native.** The browser's own element does the work: a `button`, a form field, `details`, `dialog`, the `popover` attribute with `popovertarget`. A behavior adds only what the element lacks (a changed chip's state, a counter, a stacked segmented control), and the recipe works without it.
- **Behavior.** A composite widget whose keys and state the browser does not give: a menu's arrows, a listbox's selection, a grid's cells, a calendar, a drag. Without the script it falls back to a native equivalent where one exists (section 9.3 and 9.4 list each), and to a plain, labelled control otherwise.

## 5. Approach

**One markup source.** A recipe is the React part's server render of its docs example, cleaned by a normalizer and checked into the package (section 7). A React change that alters the markup fails the same-markup check until the recipe is regenerated and the behavior, if any, still passes its tests against it.

**One stylesheet.** The recipes load `@snapshot-ui/core/styles.css` and nothing else. The states a behavior sets are the data attributes core already styles (`data-open`, `data-selected`, `data-focus-visible`, `data-pressed`, `data-changed`), the same ones React Aria writes, so no CSS changes.

**Behaviors as small modules.** Each behavior is one ES module that attaches to an element with `data-behavior`, reads its options from `data-*` attributes, writes ARIA states and the core's data attributes, and dispatches DOM events (`snapshot:change`, `snapshot:open`) a back end's own script can listen to. A runtime finds the elements, attaches the right module, and lets go when the element leaves the page.

**Progressive enhancement.** A recipe is useful before its behavior attaches. Where a native element can carry a widget, the recipe uses it; a behavior upgrades it to the full pattern when that pattern is better than the native one (a Select's filter past 8, a menu's typeahead). Where nothing native fits, the recipe's no-script face says so in the app's words (`labels.noScript`), as the charts do.

**The same tests.** The plays that drive the React stories drive the HTML fixtures: the same keys, the same focus assertions, the same axe run. The React part's tests are the behavior's contract.

| Tier | Before the script | After the script |
| --- | --- | --- |
| Static | Final | Unchanged |
| Native | Works: native keys, native submission | The part's extras: changed state, counters, stacking, memory |
| Behavior | The native fallback, or a labelled control that posts | The full WAI-ARIA pattern and the part's keys table |

Rejected along the way:

- **Hand-written recipes.** Two copies of every part's markup drift; the parent spec's promise depends on one source.
- **React on the client for the HTML version** (rendering the React parts into islands). It is the React package with extra steps and a large download.
- **Web components.** Shadow DOM would put the markup out of reach of core's CSS, and light-DOM custom elements add a registry and a naming layer over what `data-behavior` already does (open question 3).
- **CSS-only interactive parts** (checkbox hacks for menus and tabs). They cannot meet the keyboard patterns.

## 6. The package

### 6.1 Layout and exports

```
packages/html/
  package.json             @snapshot-ui/html, "type": "module", "sideEffects": ["./dist/auto.js"]
  src/runtime.ts           start(), attach(), detach(), the observer, the registry
  src/behaviors/*.ts       one module per behavior: menu.ts, tabs.ts, select.ts, ...
  src/auto.ts              registers every behavior and calls start(): the one-file script
  recipes/*.html           generated: one file per docs example, checked in
  scripts/generate.ts      renders the docs examples on the server and writes recipes/
  dist/                    ES modules per behavior; dist/auto.js; dist/snapshot-ui.iife.js
```

```ts
// The runtime's public API.
export interface Behavior<O = Record<string, string>> {
  /** The `data-behavior` value it attaches to: "menu". */
  name: string;
  /** Attaches to one element; returns the cleanup that detaches it. Never throws on markup it cannot use: it warns. */
  attach(element: HTMLElement, options: O, context: BehaviorContext): () => void;
}

export interface BehaviorContext {
  /** The strings this behavior writes, from the nearest `data-labels` JSON or the English defaults. */
  labels: Record<string, string>;
  /** The page's direction at attach time, read again on each key press, as the charts do. */
  isRightToLeft(): boolean;
  /** The shared dismiss stack: an Escape or a press outside closes the top layer only. */
  layers: LayerStack;
  /** Dispatches `snapshot:<type>` on the element, bubbling, with `detail`. */
  emit(type: string, detail?: unknown): void;
}

/** Registers behaviors; idempotent by name. */
export function register(...behaviors: Behavior[]): void;
/** Attaches every registered behavior under `root` and watches it for added and removed markup. @default document */
export function start(root?: ParentNode): () => void;
/** For a back end that swaps markup without the observer seeing it (rare): attach or detach a subtree by hand. */
export function attach(root: ParentNode): void;
export function detach(root: ParentNode): void;
```

- **Two ways in.** A script tag (`dist/snapshot-ui.iife.js`, every behavior, about 40 kB compressed at 13c by estimate, section 17) for a page with no build; or ES modules, importing `start`, `register` and only the behaviors used, for an app with a bundler.
- **Options are attributes.** `data-behavior="select" data-filter-from="9"`; JSON is accepted only in `data-labels`, parsed with `JSON.parse`, never evaluated.
- **Events, not callbacks.** `snapshot:change` with `detail.value`, `snapshot:open`, `snapshot:close`, `snapshot:move`; every behavior's events are listed on its page and are public API.

### 6.2 Strings

A behavior that writes words (a toast's dismiss name, a calendar's month, a list's "Pricing moved to position 2 of 6") takes them from `data-labels` on itself or the nearest ancestor, with the React part's English defaults otherwise. Dates and numbers a behavior formats in the browser use `Intl` with the page's `lang`; there is no hydration, so the server-face rule that bans `Intl` at render does not apply, but the recipe's no-script face holds the server's strings.

### 6.3 Theme axes

`data-theme`, `data-shape` and `data-density` on any element, as in React. The `theme` behavior (ThemeSwitch, ThemeMenu) writes `data-theme` on `<html>` and a cookie named by `data-cookie` (default `theme`), so a server that reads the cookie paints the right colors first, the settings spec's rule.

## 7. Recipes

### 7.1 How a recipe is made

1. `scripts/generate.ts` renders each docs example (`apps/docs/examples/*.tsx`) with `renderToStaticMarkup` in Node under `en-US`, in the docs' default theme.
2. The normalizer removes React and React Aria internals (`data-rac`, `data-react-aria-pressable` and their kin, to list from the render), React's comment markers and empty `style` attributes; replaces every generated id (`react-aria-:r1:`) with a readable placeholder (`{{id.menu}}`, `{{id.label}}`), consistently across the file; adds `data-behavior` and the behavior's option attributes where the part has a behavior; and formats the result.
3. The recipe is written to `packages/html/recipes/<example>.html` and checked in, so a reviewer sees every markup change as a diff.

### 7.2 The same-markup check

A test regenerates every recipe and fails on any difference from the checked-in file, naming the example and showing the diff, so a React change cannot ship without its recipe, and a recipe cannot be edited by hand. Its pattern is LineChart's `same-markup.test.tsx`.

### 7.3 Ids

A recipe's placeholders are its only template syntax: `{{id.<name>}}`, one per distinct id. The docs say to replace each with an id unique on the page; a behavior that finds an `aria-labelledby`, `aria-controls` or `for` pointing at nothing, or a placeholder left in, warns once in the console and generates the missing ids itself where the relation is inside its element (a menu's trigger and its list), so a copied recipe that forgot to replace them still works.

### 7.4 In the docs

Each component page's example frame gains a third tab, "HTML", beside Preview and Code (`docs-preview`'s Tabs), showing the recipe with its placeholders highlighted, a CopyButton, and the behavior's import line if it has one. The Preview tab can switch to render the HTML recipe with the behaviors instead of the React part (a toggle in the frame's head), so a reader sees that both look and act the same. The installation page gains "Without React": the stylesheet, the script tag or the module import, `start()`, ids, `data-labels`, events, and the CSP note.

## 8. The behaviors runtime

### 8.1 Attaching

`start()` attaches every element under the root whose `data-behavior` names a registered behavior, in document order, and marks it `data-behavior-ready` (a hook for an app's own CSS or tests, never used by core). An element whose behavior is not registered is left as it is and warned about once in development builds.

### 8.2 Detaching

Each `attach` returns its cleanup; the runtime keeps it in a `WeakMap` and runs it when the element leaves the document. A behavior's listeners are on its element or registered through the runtime, so nothing outlives it.

### 8.3 Markup that changes

One `MutationObserver` on the root, batched to a microtask: added subtrees are attached, removed ones detached. It covers HTMX swaps, Turbo frames and visits, Livewire morphs and a CMS's live preview without an integration per library; the docs show each (to verify each library's swap events against the observer, risk R4). A behavior whose element is moved (not removed) stays attached.

### 8.4 Shared layers

- **Focus utilities:** a roving tab index, `aria-activedescendant` lists, typeahead with React Aria's 1 second buffer, focus scope and restore for dialogs, and the "focus never to the body" check in development that warns when a behavior's action leaves `document.activeElement` on `body`.
- **The dismiss stack:** the open popovers, menus and dialogs in order; Escape and a press outside close the top one only, and the Escape a layer handles is stopped, the record's rule.
- **Positioning:** a popover placed by its trigger with flip and a cap to the viewport, computed in the browser (there is no server face to agree with). CSS anchor positioning is used where the browser has it and the script's placement otherwise (to verify each engine's support at the time of 13b, risk R5).
- **Live regions:** a polite and an assertive host mounted empty by the recipe, never inside `aria-busy`, written a frame after the change.

## 9. The parts

### 9.1 Static parts (13a)

Badge, Kbd, Heading, Text, Eyebrow, Card and its parts, CardActions, EmptyState, Skeleton, Spinner, StatTile, Avatar, AvatarGroup, DescriptionList, Meter, ProgressBar, Gauge, PageHeader, PageColumn, Breadcrumbs, Prose, PanelSection, PanelRow, Stack, Cluster, TileGrid, Preview.

- **API:** the recipe; no behavior. **Markup and roles:** the React server render, unchanged in meaning. **Keys, screen readers, CSS, forced colors, right to left, density, corners:** exactly the React part's, since markup and CSS are the same; the parity harness proves it. **Server rendering:** the recipe is server HTML.
- **How others do it:** GOV.UK Frontend publishes HTML and Nunjucks macros per component (to verify); Bootstrap and USWDS publish copy-paste HTML with a script for interactive parts (to verify); Primer ViewComponents render on the server in Rails (to verify). Taken: copy-paste HTML first, from one source.

### 9.2 Native parts (13a)

| Part | Native element | The behavior adds | Without the script |
| --- | --- | --- | --- |
| Button, IconButton, Link | `button`, `a` | Pending state with its spinner and announcement (`button`, on `data-pending`) | Works; no pending face |
| TextField, TextArea, the field parts | `input`, `textarea`, `label` | `field`: the Changed chip from `data-original`, FieldCounter's count, the invalid state from the browser's validity with the part's error line | Posts; the browser's own validation bubbles |
| Checkbox, CheckboxGroup | `input[type=checkbox]` in a `fieldset` | Indeterminate from `data-indeterminate`; select-all | Works |
| RadioGroup, SegmentedControl, ChoiceCards | `input[type=radio]` in a `fieldset` | `segmented`: stacking when the row does not fit, by a `ResizeObserver` (no first-paint measurement problem: there is no server face to match) | Works; does not stack, wraps |
| Switch | `input[type=checkbox][role=switch]` | Nothing | Works |
| CollapsibleCard, Accordion | `details` and `summary` | `collapse`: the remembered fold by key in `localStorage`, the changed marker while folded, an Accordion's one-open rule through `details[name]` where supported | Works; nothing remembered |
| AppShell, PanelLayout | Landmarks and links | Nothing in 13a; the Sidebar's behaviors are 13b's | Works: PanelLayout's faces are container queries and its sections are addresses |

Each part's keys and screen reader text are the native element's, which the React part matches (React Aria renders the same elements for these). The Changed chip and the counter keep their React live-region rules.

### 9.3 Behaviors: overlays and choices (13b)

| Part | Behavior | Pattern and keys | Without the script |
| --- | --- | --- | --- |
| Popover | `popover` | The `popover` attribute and `popovertarget` open and dismiss natively; the behavior places it and joins the dismiss stack | Opens and light-dismisses natively, unplaced (top layer, centered by the browser, to verify) |
| Menu, AccountMenu, ThemeMenu | `menu` | WAI-ARIA menu button: Enter, Space and Arrow Down open on the first item, Arrow Up on the last; arrows, Home, End, typeahead; Escape closes and returns focus; submenus by Arrow Right in the drawn direction | A `popover` list of links and `button`s in a form: usable, without arrow keys |
| Tooltip | `tooltip` | 400ms on hover, at once on focus, the warm half second; Escape hides; never on a disabled trigger | The trigger's accessible name (always present) carries the words |
| Dialog, ConfirmDialog | `dialog` | Native `dialog.showModal()`; the behavior adds focus to the first field or the heading, restore to the opener, the danger icon and the `alertdialog` role for ConfirmDialog, and a confirm event | A `dialog` opened by `command="show-modal"` where supported (to verify), else a link to a page with the same form |
| Drawer, Sheet, SidePanel | `dialog` with the part's `data-variant` | As Dialog; Sheet's snap points and drag (with its buttons as the single-pointer path) | As Dialog |
| Toast | `toast` | A region with `snapshot.toast({ tone, message, action })` from the app's script; 6 seconds, 12 for errors, `role="alert"` for errors; pause on hover and focus | A server-rendered toast in the same region stays until dismissed by its link |
| Tabs | `tabs` | WAI-ARIA tabs: arrows in the drawn direction, Home, End, automatic activation; links as tabs when `href` is set | Every panel shown under its heading (the tablist hidden) |
| Select | `select` | The library's listbox Select: filter past 8 options, hints, typeahead; posts through a hidden input | A native `select` with the same options and name, which the recipe carries and the behavior replaces |
| ComboBox, MultiSelect, TagInput, IconPicker (13c) | `combobox`, `multi-select`, `tag-input` | WAI-ARIA combobox with `aria-activedescendant`; MultiSelect's tags; TagInput's paste split and Backspace | An `input` with a `datalist` (ComboBox), checkboxes in a `fieldset` (MultiSelect), a text field split on the server (TagInput) |
| PositionPad | `position-pad` | Two-dimensional arrows over a radio group | The radio group, one arrow axis |
| CommandPalette | `command-palette` | Cmd or Ctrl+K, the filter, recent items from `localStorage`, the app's index from a `data-src` JSON URL or inline `script[type="application/json"]` | A link to the app's search page |
| Sidebar, BottomTabBar | `sidebar` | The fold at 104px remembered in a cookie (`data-cookie`), names as tooltips while folded, the drawer below 1024px on Dialog's behavior | Unfolded on wide screens; the drawer opens as a `popover` |

**Markup and roles** are the React render's, so each has the roles React Aria writes. **Screen readers:** the React part's notes, verified with the same pass (owner action 2). **CSS, forced colors, right to left, density and corners** are core's, unchanged; the behaviors read the direction at each key press and write the same data attributes. **Server rendering:** the recipe's closed state is final; nothing is measured until a part opens. **How others do it:** Bootstrap's dropdown and modal scripts by data attribute (to verify current keyboard support); GOV.UK Frontend's `data-module` attribute and `initAll()` (to verify); GitHub's Catalyst and its `details-menu-element` (to verify); Headless UI and Radix are React-only (to verify any HTML versions). Taken: GOV.UK's `data-module` model, as `data-behavior`.

### 9.4 Behaviors: fields, data and settings (13c)

| Part | Behavior | Without the script |
| --- | --- | --- |
| NumberField | `number-field`: the steppers, the money mode, arrows by step, parsing the page's locale | An `input[type=text][inputmode=decimal]` that posts the typed value |
| SearchField | `search-field`: the clear button, Escape clears | `input[type=search]` |
| Calendar, MonthGrid | `calendar`: the grid's arrows, Page for months, Shift+Page for years, Home and End by week, the Persian calendar from `data-calendar` | MonthGrid's static grid is final; Calendar shows its month and links to the previous and next as addresses |
| DatePicker, DateRangePicker, DateTimePicker, TimeField, TimeRangeField | `date-field`, `time-field` and their pickers: segments typed in the page's order, the popover calendar, the minute step, the time list | `input[type=date]`, `type=time`, `type=datetime-local`, each posting ISO values, the same values the React parts post |
| Slider, RangeSlider | `slider`: arrows, Page, Home and End; pointer drag | `input[type=range]` (one or two), posting the same values |
| ColorField | `color-field`: the hex box, the swatch picker, the contrast chip | `input[type=text]` with a hex pattern, and `input[type=color]` beside it |
| PhoneField | `phone-field`: the pattern on blur, the E.164 value | `input[type=tel]` posting what was typed |
| MediaInput, FileDropZone, UploadList, UploadTray | `drop-zone`, `upload-list`: drop, paste, the checks, the progress rows from the app's events | `input[type=file]` that posts with the form |
| DataTable | `data-table`: sorting by header (or by address), selection with the bulk bar, the list face's switch is CSS | The table sorts by links to sorted addresses; selection by checkboxes that post |
| Pagination, FilterBar, FilterChip | `filter-bar`: the chips' popovers and the address | Links and a GET form: already the recommended server pattern |
| SaveBar | `save-bar`: the count from the form's changed fields, Discard that asks, the status | The form's submit and reset buttons, always visible |
| ConditionalFields | `conditional`: `hidden`, `inert` and the disabled fieldset from its gate | The fields always shown, the server ignoring a gated group whose gate is off |
| FieldExtras | `field-extras`: Reset to default and Use suggested as edits | Buttons that post a reset |
| ThemeSwitch | `theme` (section 6.3) | Radios that post the choice; the server sets the cookie |
| Repeater | `repeater`: add, remove, focus to the new row and to the row now in place, the status, the minimum and maximum | Rows rendered by the server, with Add and Remove as submit buttons |
| ReorderList, TreeBuilder, TransferList, MasterDetailList | `reorder-list`, `tree-builder`, `transfer-list`, `master-detail-list`: the lists spec's move model, buttons and Alt with the arrows, keyboard drag, pointer drag, announcements | Move up and Move down as submit buttons (ReorderList, TreeBuilder); checkboxes and Remove that post (TransferList); links per record (MasterDetailList) |
| CopyButton | `copy`: the Clipboard API, the announcement | The value in a read-only field, selectable |
| FontPreview | `font-preview`: `document.fonts.check` after the app's loader (a module the app registers) | The status's loading words and the `noscript` note, never the fallback face |

The lists' drag uses Pointer Events and the HTML drag API where React Aria does; its keyboard path and its buttons carry WCAG 2.5.7, as in React.

## 10. Accessibility

- **The same contract.** Every behavior meets its React part's Keys table and focus table; the plays are shared (section 12).
- **Focus never falls to the body.** Each behavior names where focus goes; the development check warns when it lands on `body`.
- **No script is not broken.** Each part's face without the script is usable and labelled, or says what it needs.
- **Live regions** mounted empty in the recipe, polite, never inside `aria-busy`.
- **Never color alone; reserved colors** as in React: the markup and CSS are the same.
- **Axe** on every HTML fixture in light and dark, with and without the script.
- **Screen readers.** Not yet verified; the 13b and 13c parts get the same VoiceOver, NVDA and TalkBack pass as their React twins (owner action 2).

## 11. Decided here

1. Phase 7 ships as three batches, 13a (static and native), 13b (overlays and choices), 13c (fields, data and settings), as `@snapshot-ui/html` 0.1.0 to 0.3.0.
2. Recipes are generated from the React parts' server render of the docs examples, normalized, checked in, and enforced by a same-markup check.
3. Ids in recipes are `{{id.<name>}}` placeholders; behaviors generate missing internal ids and warn.
4. The package ships no CSS; core is the only stylesheet; core fixes found by parity are core patches.
5. Behaviors are dependency-free ES modules attached by `data-behavior`, with options as `data-*` attributes and strings from `data-labels` JSON; nothing is evaluated (subject to open question 2).
6. One runtime with a mutation observer attaches and detaches behaviors for markup that changes.
7. Behaviors write the same ARIA states and core data attributes React Aria writes, and dispatch `snapshot:*` events.
8. Every recipe has a working face without the script, a native element where one fits.
9. The React plays, keys tables and focus tables are the behaviors' contract and tests.
10. Parity screenshots compare each HTML fixture to its React story's existing baseline; no second set of baselines.
11. The docs show an HTML tab on every component page, and the installation page gains "Without React".
12. Charts and the editor have no HTML recipes in this phase.

## 12. Testing

- **Same-markup check** (section 7.2), per recipe.
- **Behaviors (Vitest, jsdom):** attach and detach, idempotence, the observer's batched adds and removes, options parsing, `data-labels`, events, the dismiss stack, focus restore, the body check; each behavior's keys against its React part's Keys table, case by case.
- **Plays (Playwright, Chromium, WebKit, Firefox):** a fixture page per recipe served by Storybook's static server with core's CSS and the behaviors; the React stories' interaction tests are parameterized by a fixture loader so the same test drives both; axe in light and dark; every fixture with scripts off.
- **Parity screenshots:** each fixture is captured in the five modes (and compact where its React story is tagged) and compared to the React story's committed baseline with the same threshold the visual tests use; a difference fails as a parity bug, fixed in the recipe generator, the behavior or core.
- **Integration fixtures:** an HTMX swap, a Turbo visit and a plain `innerHTML` replacement, each attaching and detaching correctly.
- **Size:** size-limit per behavior and for `auto.js` (section 17).

## 13. Docs

- **Every component page:** the HTML tab, the behavior's name, its options, its events, its fallback without script.
- **Installation, "Without React":** section 7.4.
- **A guide, "Server-rendered apps":** partials from recipes in four template languages as examples (Jinja, ERB, Blade, Go templates), ids, labels in other languages, theme cookies, HTMX and Turbo, CSP.
- **The Alpine adapter** as a recipe on that guide (or the package's entry point, if open question 2 keeps Alpine).
- **The templates of phase 5** get no HTML versions: they are Next App Router files (templates spec, ruling 10).

## 14. Risks

- **R1. Behaviors fall short of React Aria.** React Aria's handling of screen readers, touch and virtual cursors is deep. Mitigation: the shared plays; the screen reader pass per batch; the native fallbacks where the platform is better; a part whose behavior cannot pass its React tests ships with its native fallback only, recorded, rather than a lesser widget.
- **R2. The normalizer drops something meaningful.** Mitigation: the normalizer has an allow list of attributes to drop, not a pattern; its test renders every example and fails on any unlisted `data-` attribute it would remove.
- **R3. React Aria's markup changes on upgrade.** Mitigation: React Aria is pinned; an upgrade regenerates recipes, and the diffs are reviewed with the behaviors' tests.
- **R4. Swap libraries the observer misses.** Turbo's snapshot cache restores markup with stale `data-behavior-ready`. Mitigation: the runtime re-checks attachment by its `WeakMap`, not by the attribute; integration fixtures per library.
- **R5. Platform features at the browser floor.** `popover`, `command` invokers, `details[name]`, anchor positioning and `dialog` focus rules vary by version (to verify each at 13b). Mitigation: each is used only where the floor supports it; the script's own placement and focus as the fallback.
- **R6. Copied recipes with unreplaced ids.** Mitigation: section 7.3's warning and generation.
- **R7. The script tag's size.** Every behavior in one file is large. Mitigation: per-behavior modules for apps with bundlers; the docs' script tag example loads only the behaviors a page uses as modules from the CDN.
- **R8. A changed parent decision.** Dropping Alpine changes the parent spec. Mitigation: open question 2 first; the adapter keeps Alpine apps served.
- **R9. The source's Alpine code.** `.local/SOURCE.md` was absent when this was written. Mitigation: each plan reads the source behavior before porting it and records differences as corrections.
- **R10. 1.0 across packages of different ages.** Mitigation: section 15's per-package versions and the release candidate.

## 15. The final batch: 1.0 (batch 14)

The owner moved 1.0 to after phase 7 (templates spec, ruling 1.0). This batch adds no part. Its input is the templates spec's section 11; its scope is all five packages.

### 15.1 The API review

One list per package, each item a decision the owner signs off (keep, rename, deprecate, remove):

| Package | What the review covers |
| --- | --- |
| `@snapshot-ui/core` | Every token name and its CSS custom property; the Tailwind theme names; every documented class and data attribute (the component roots list); the CSS entry points (`styles.css` and any partial ones); the holder custom properties parts may read; the cascade layer names |
| `@snapshot-ui/react` | Every export, its props type and defaults; names in React Aria's vocabulary (`isDisabled`, `onChange`, `selectedKey`); every `labels` type complete with its English defaults listed; the hooks (`useAppShell`, `useConfirm`, `useSidebar`); controlled and uncontrolled pairs complete; deprecated aliases since 0.1 |
| `@snapshot-ui/charts` | Every export and type; `ChartColor`, `AreaColor`, `DonutColor`; `labels` and `statusLabels`; the core peer range; the BarChart, AreaChart and DonutChart link and press props aligned |
| `@snapshot-ui/editor` | Its exports, its Tiptap peer range, its form value; whether its API is ready (section 15.5) |
| `@snapshot-ui/html` | Behavior names, `data-*` options, `snapshot:*` events, the runtime API, the recipe placeholder syntax |
| All | The browser floor written down (each engine's version, to verify at the time), the React floor (`^19.0.0`), Node for the build only, ES modules only |

### 15.2 The stability promise

The templates spec's ruling 19, extended to every package. Written on a docs page, "Versioning," and in each README:

- **Public, under semantic versioning:** every export and its props or types; every token and its CSS custom property; every class and data attribute a docs page names; the component roots list; every `labels` key; the html package's behavior names, options, events and runtime API.
- **Not public:** undocumented classes and custom properties, DOM structure beyond the documented classes and roles, the text of development warnings, and token values (a value may change in a minor when the design record measures a reason; a name may not).
- **A major release** is needed to remove or rename a public name, to change a prop's meaning or default in a way an app can see, to change a default English string's meaning, or to raise the React or browser floor.
- **A minor** may add, and may deprecate (section 15.3). **A patch** fixes without changing a public name or behavior an app relies on.
- **Visual changes** that follow the design record (a measured contrast fix, a spacing correction) ship in minors and are listed in the release notes with their baselines.

### 15.3 The deprecation policy

1. **Deprecate in a minor.** The old name keeps working; a development-only warning names the replacement (`useWarnOnce`, once per page); the type carries `@deprecated` with the replacement, so editors strike it through; the component page and a "Deprecations" docs page list it with the version it was deprecated in.
2. **For at least one minor release, and at least 90 days,** whichever is longer, before the next major may remove it.
3. **Remove only in a major,** listed in the upgrade guide with a before and after for each.
4. **CSS names follow the same rule:** a renamed class keeps the old one as an alias in core (a selector list) until the next major, with the docs saying which is current.
5. **A codemod** is written for any rename that touches more than a handful of call sites in the first consumer's code (open question 21).
6. **Security and accessibility fixes** may change behavior in a minor or patch when the old behavior failed WCAG 2.2 AA or was unsafe; the release notes say so plainly.

### 15.4 The docs' versions

- **`snapshotui.com`** shows the latest release, deployed from the release tag by the release workflow, not on every merge to `main`.
- **`next.snapshotui.com`** shows `main`, with a banner that it is unreleased.
- **`v0.snapshotui.com`** keeps the last 0.x docs, frozen, with a banner pointing to the upgrade guide; each later major gets the same (`v1.` when 2.0 ships).
- **Every page** states the version it documents in its footer, and a part added in a minor says "Since 1.x".
- The owner's Vercel project gains the two subdomains (owner action 4).

### 15.5 Which packages go to 1.0

| Package | At batch 14 | Why |
| --- | --- | --- |
| `@snapshot-ui/core` | 1.0.0 | Phases 1 to 5 are complete and the HTML version depends on its classes being stable |
| `@snapshot-ui/react` | 1.0.0, fixed with core | As the parent spec planned |
| `@snapshot-ui/charts` | 1.0.0, independent, core peer `^1.0.0` | Phase 6 is complete; the screen reader pass (charts spec owner action 1) is a condition; ruling 26 there keeps it outside the fixed group |
| `@snapshot-ui/editor` | Stays 0.x | One minor cycle old at most, and tied to Tiptap's majors; 1.0 when a consumer has shipped it for a cycle (open question 22) |
| `@snapshot-ui/html` | Stays 0.x for one more cycle | Its 0.3.0 is the newest code in the project; its contract (classes and data attributes) is already covered by core's 1.0 promise (open question 23) |

### 15.6 The release steps

1. **Freeze.** Feature merges stop on `main`; fixes continue.
2. **The review lists** (15.1) are written and signed off by the owner.
3. **Deprecations land** for every rename the review decided, in a final 0.x minor, so 1.0 removes nothing an app has not been warned about for a cycle.
4. **The upgrade guide,** "Upgrading from 0.x," lists every removal and rename with a before and after.
5. **Release candidate.** Changesets' pre mode: core, react and charts `1.0.0-rc.0`, published under the `next` dist-tag; the first consumer upgrades and reports (owner action 3).
6. **Fixes** go out as further release candidates; no new names.
7. **Exit pre mode;** the release pull request bumps core and react to 1.0.0 (a major from 0.x), charts to 1.0.0 with its peer `^1.0.0`, and moves the editor's and html's core peers to `^1.0.0` in patches.
8. **Publish** through the existing trusted-publishing workflow with provenance; the `latest` dist-tag moves.
9. **Docs:** freeze `v0.`, deploy `snapshotui.com` from the tag, publish "Versioning" and "Deprecations".
10. **After:** the 0.x caret chore ends for charts, the editor and html, whose `^1.0.0` peers accept every 1.x minor.

## 16. Open questions

Each has a recommended answer.

1. **The split and the order.** Recommended: 13a, 13b, 13c, then 14. Alternative: two batches (static and native, then all behaviors).
2. **Alpine or no dependency.** Recommended: a dependency-free behaviors script, with an Alpine adapter recipe; this changes the parent spec's decision. Alternative: the Alpine plugin, as the parent spec says, nearer the source's code but with a dependency and a CSP build.
3. **Web components.** Recommended: no; `data-behavior` on the recipe's own markup. Alternative: light-DOM custom elements (`<snapshot-menu>`), a familiar boundary at the cost of a second naming layer.
4. **Where markup comes from.** Recommended: generated from the React parts and checked. Alternative: hand-written recipes with a structural comparison test, freer to tune per part but two sources.
5. **Ids.** Recommended: `{{id.<name>}}` placeholders, with generation and a warning for internal relations left unreplaced. Alternative: no ids in recipes, every relation built by the behavior, which leaves the no-script face without its labels.
6. **Template-language helpers.** Recommended: none in the package; the guide shows four as examples. Alternative: a package of macros per language, each a maintained project.
7. **Distribution.** Recommended: npm only, with a pinned and integrity-checked public CDN script tag in the docs. Alternative: a CDN the project hosts, which is a request the library would then own.
8. **Without the script.** Recommended: every recipe has a usable native face. Alternative: script required for behavior parts, simpler recipes but broken pages when a script fails.
9. **Select's fallback.** Recommended: a native `select` replaced by the listbox. Alternative: a native `select` styled with `appearance: base-select` where supported, with no listbox behavior at all (to verify support at 13b).
10. **Date and time fallbacks.** Recommended: the native date and time inputs posting the same ISO values. Alternative: text fields with a pattern, which keep the library's look before the script but lose the native picker.
11. **Strings.** Recommended: `data-labels` JSON with English defaults. Alternative: one global `snapshot.labels({ ... })` call per page, simpler for one language per page.
12. **Events.** Recommended: `snapshot:*` DOM events, public API. Alternative: callbacks registered in script per element.
13. **Toasts from the server.** Recommended: a server-rendered toast in the region, dismissed by link without script, auto-timed with it. Alternative: script-only toasts.
14. **Parity testing.** Recommended: compare to the React baselines, no second set. Alternative: separate HTML baselines, which can drift apart without failing.
15. **Charts in HTML.** Recommended: not in this phase. Alternative: recipes of server-rendered charts with a small behavior for focus and the table toggle, which the charts' server output makes possible.
16. **The docs' HTML tab.** Recommended: on every component page, with the Preview tab able to render the HTML version. Alternative: a separate "HTML" section of the site.
17. **Swap libraries.** Recommended: one mutation observer, no per-library integration. Alternative: integrations for HTMX, Turbo and Livewire events, more exact but three things to maintain.
18. **A static chart recipe later.** Recommended: decide after 1.0, when a consumer without React asks. Alternative: plan it now as 13d.
19. **The promise's scope.** Recommended: the templates spec's ruling 19, extended to every package and to the html package's behavior names, options and events. Alternative: core and react only, other packages exempt until their own 1.0.
20. **The deprecation window.** Recommended: at least one minor and at least 90 days. Alternatives: one minor only; or two minors.
21. **Codemods.** Recommended: only for renames that touch many call sites in the first consumer. Alternative: a codemod for every rename.
22. **The editor at 1.0.** Recommended: stays 0.x until a consumer has shipped it for a cycle. Alternative: 1.0.0 with core.
23. **html at 1.0.** Recommended: stays 0.x for one cycle after 0.3.0; core's promise already covers the classes it depends on. Alternative: 1.0.0 with core, joining the fixed group.
24. **Charts at 1.0.** Recommended: 1.0.0 at batch 14, independent of the fixed group, after the screen reader pass. Alternative: join the fixed group, so every core release releases charts.
25. **A release candidate.** Recommended: one or more `1.0.0-rc` releases under `next` with the first consumer before 1.0.0. Alternative: release 1.0.0 directly after the review.
26. **The docs' versions.** Recommended: latest release at the root, `next.` for `main`, `v0.` frozen. Alternative: path prefixes (`/docs/v0/`) on one deployment, one project but every link gaining a prefix.
27. **Removing deprecated aliases at 1.0.** Recommended: deprecate in the last 0.x minor, remove in 1.0.0. Alternative: keep them through 1.x and remove in 2.0, gentler but carrying 0.x names into the promise.

## 17. Size budget

Measured with size-limit, compressed, per behavior module with the runtime counted once:

| Entry | Batch | Budget | Reason |
| --- | --- | --- | --- |
| `{ start, register }` (the runtime) | 13a | 1.5 kB | The registry, the observer, the WeakMap, labels parsing, events |
| A native behavior (`field`, `segmented`, `collapse`) | 13a | 1 kB each | A listener and a few states |
| The shared layers (focus, dismiss stack, positioning, live regions) | 13b | 3 kB | Counted once, shared by every overlay |
| An overlay or choice behavior (`menu`, `tabs`, `select`, `combobox`) | 13b | 1.5 to 3 kB each, set per behavior from its measure | Keys, typeahead, states |
| `command-palette` | 13b | 4 kB | Filter, recent items, index loading |
| A field behavior (`number-field`, `slider`, `phone-field`) | 13c | 1.5 to 3 kB each | Parsing and keys |
| `calendar` with `date-field` | 13c | 7 kB | Calendar arithmetic, segments, the Persian calendar (through `Intl` in the browser) |
| `reorder-list`, `tree-builder`, `transfer-list` | 13c | 4 to 6 kB each | The move model, drag, announcements |
| `auto.js` (every behavior) | 13c | 45 kB | The sum, for the script tag |

Each limit follows the rule: the measured entry rounded up to the next 0.5 kB, plus 0.5 kB. The package ships no CSS; core's size does not change unless parity finds a fix.

## 18. Baseline estimate

No new visual baselines: the parity harness compares each HTML fixture to the React story's existing baseline (open question 14). About 75 parts' fixtures are compared in the five modes, and in compact where their React stories are tagged: by estimate about 900 comparisons across the three batches (13a about 300, 13b about 300, 13c about 300), each a test, none a new file. The 1.0 batch changes no baseline; a deprecation alias in CSS draws the same. Any baseline change in these batches is a core fix and goes through `pnpm --filter @snapshot-ui/storybook visual:docker`.

## 19. Release

- **13a, 13b, 13c:** changesets for `@snapshot-ui/html`, minor, naming no number: 0.1.0, 0.2.0, 0.3.0 if nothing else releases between, each with a core peer of `^0.18.0` (or the core patch a parity fix needed). Release notes: what the batch's recipes and behaviors are, how to load them, the no-script faces, and for 13a "the package is new".
- **14:** section 15.6. Core and react 1.0.0 (fixed group); charts 1.0.0 (independent, peer `^1.0.0`); editor and html patches moving their peers to `^1.0.0` and staying 0.x.
- **Release notes for 1.0:** the promise in five lines, the link to "Upgrading from 0.x" and "Deprecations", the browser and React floors, the docs' new addresses, and which packages are 1.0 and which stay 0.x.

## 20. Owner rulings (owner, 2026-10-20)

The owner approved this spec on 2026-10-20 and took every recommendation of section 16, all 27, as written, and approved the 1.0 batch of section 15 as written. Each ruling names the open question it settles.

**Alpine.** Ruling 2 reverses the parent spec's choice of an Alpine plugin: `@snapshot-ui/html` ships dependency-free behaviors attached by `data-behavior`, and Alpine apps use the documented adapter recipe. The parent spec records this as an amendment in its section 7.

1. **The split and the order** (question 1). 13a, 13b, 13c, then 14.
2. **Alpine or no dependency** (question 2). A dependency-free behaviors script, with an Alpine adapter recipe; this changes the parent spec's decision, recorded there as an amendment.
3. **Web components** (question 3). No; `data-behavior` on the recipe's own markup.
4. **Where markup comes from** (question 4). Generated from the React parts and checked.
5. **Ids** (question 5). `{{id.<name>}}` placeholders, with generation and a warning for internal relations left unreplaced.
6. **Template-language helpers** (question 6). None in the package; the guide shows four as examples.
7. **Distribution** (question 7). Npm only, with a pinned and integrity-checked public CDN script tag in the docs.
8. **Without the script** (question 8). Every recipe has a usable native face.
9. **Select's fallback** (question 9). A native `select` replaced by the listbox.
10. **Date and time fallbacks** (question 10). The native date and time inputs posting the same ISO values.
11. **Strings** (question 11). `data-labels` JSON with English defaults.
12. **Events** (question 12). `snapshot:*` DOM events, public API.
13. **Toasts from the server** (question 13). A server-rendered toast in the region, dismissed by link without script, auto-timed with it.
14. **Parity testing** (question 14). Compare to the React baselines, no second set.
15. **Charts in HTML** (question 15). Not in this phase.
16. **The docs' HTML tab** (question 16). On every component page, with the Preview tab able to render the HTML version.
17. **Swap libraries** (question 17). One mutation observer, no per-library integration.
18. **A static chart recipe later** (question 18). Decide after 1.0, when a consumer without React asks.
19. **The promise's scope** (question 19). The templates spec's ruling 19, extended to every package and to the html package's behavior names, options and events.
20. **The deprecation window** (question 20). At least one minor and at least 90 days.
21. **Codemods** (question 21). Only for renames that touch many call sites in the first consumer.
22. **The editor at 1.0** (question 22). Stays 0.x until a consumer has shipped it for a cycle.
23. **html at 1.0** (question 23). Stays 0.x for one cycle after 0.3.0; core's promise already covers the classes it depends on.
24. **Charts at 1.0** (question 24). 1.0.0 at batch 14, independent of the fixed group, after the screen reader pass.
25. **A release candidate** (question 25). One or more `1.0.0-rc` releases under `next` with the first consumer before 1.0.0.
26. **The docs' versions** (question 26). Latest release at the root, `next.` for `main`, `v0.` frozen.
27. **Removing deprecated aliases at 1.0** (question 27). Deprecate in the last 0.x minor, remove in 1.0.0.

## Owner actions

1. Done: open question 2 ruled on 2026-10-20 (no dependency, with an Alpine adapter recipe).
2. A VoiceOver, NVDA and TalkBack pass over 13b's and 13c's behaviors, beside their React twins.
3. Ask the first consumer to run the 1.0 release candidate for one cycle and report.
4. Add `next.snapshotui.com` and `v0.snapshotui.com` to the Vercel project before batch 14.
5. Sign off each package's review list (section 15.1) before the release pull request merges.
