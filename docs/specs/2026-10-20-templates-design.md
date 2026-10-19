# Templates: Preview, page templates, the docs shell and 1.0: design

Status: approved on 2026-10-20. Written for the owner's review with a recommended answer to each open question of section 18; the owner took every recommendation, all 21, with one change: 1.0 ships after phase 7, not at the end of phase 5. Batch 11b is therefore the docs shell move alone and stays 0.x, and the API review, the stability promise and the 1.0.0 release move to the final "1.0" batch of `docs/specs/2026-10-20-html-design.md`. Section 22 records the rulings, which supersede the sections they name where they differ.
Date: 2026-10-20
Parent spec: `docs/specs/2026-10-10-snapshot-ui-design.md`. This document takes the phase 5 rows of the parent spec's catalog, "App shell and page layouts", that are not yet built or taken: **Preview** and **Page templates**. It also takes the two duties the parent spec puts at the end of phase 5: replacing the docs site's hand-built shell with the library's own parts (risk R8 and section 8, "Dogfooding"), and the 1.0 release (section 10, "Versions stay at 0.x until the end of phase 5, then 1.0"). The design authority remains `docs/design-system.md`.
Released before this: `main` is at 0.8.0 (batch 5, "Accounts") as this is written. In flight, in order: batch 6 ("Insights", 0.9.0, charts 0.2.0), batch 7 ("Settings", 0.10.0), the choices batch (0.11.0), the inputs phase (9a, 9b and 9c, 0.12.0 to 0.14.0) and the lists phase (10a and 10b, 0.15.0 and 0.16.0, `docs/specs/2026-10-20-lists-design.md`). This phase starts after 10b merges. It takes the shell parts from batches 1 and 4, PanelLayout, ThemeSwitch and the field extras from batch 7, and parts from every batch since for the templates. Section 2 recommends two batches, 11a and 11b.

## Summary for the owner

What this phase adds, in plain words, in the order recommended:

**Batch 11a, "Templates"** (one minor release of core and react):

- **Preview**: a framed sample of what a setting will look like, for settings whose effect is visual and cannot be read off the value: a font, a brand color, a header layout. The frame is the design record's "Previews" section made into a part: a 24px surface frame with a caption, whose inside can be pinned to light or dark and to a corner shape so it shows the reader's site rather than the settings page around it, and whose content cannot be clicked into by accident. It is not the docs site's "Preview and Code" tabs, which keep their own name inside the docs.
- **FontPreview**: the source app's font preview. It draws a sample line in the chosen font family, and only once that family has truly loaded; until then it says "Loading Poppins" in words, and if the font cannot be loaded it says so. It never draws the sample in a fallback font, because a preview must be true (the design record's rule). The app loads the font; the library never fetches anything itself.
- **Stack, Cluster and TileGrid**: three small layout parts that put the system's spacing rhythm (8, 24 and 32px) between things: a column, a wrapping row, and a grid of tiles. The docs site has had these as private classes since phase 1; the templates need them, so they move into the library and the docs use the library's.
- **Three page templates**: a settings page, a list page and a detail page, for an imaginary "Projects" workspace. Each is a set of files for the Next App Router that a developer copies into their app from the docs site: the page, its layout, its loading, empty, error and not-found states, a server action, and a data file to replace with their own. They are built only from library parts, with no CSS of their own and no inline styles, and a test enforces that. The docs show each running at phone and desktop widths, in every color mode and corner shape.

**Batch 11b, "Docs shell"** (no package release; ruling 1.0 in section 22):

- **The docs site on the library's own shell**: the rail, drawer and header the docs site has drawn by hand since phase 1 are replaced by AppShell, Sidebar, PageHeader and Breadcrumbs, as the parent spec requires before phase 5 is done.
- **The 1.0 review and release** were planned here and moved by the owner's ruling to the final "1.0" batch after phase 7 (`docs/specs/2026-10-20-html-design.md`). Section 11 stays as the input to that batch.

Why: these are the parent spec's last phase 5 rows and its two end-of-phase duties. The first consumer has asked for none of them directly; its settings, list and detail pages are what the templates are drawn from, so it can tell us where they differ from what it built (owner action 2).

How templates ship, the decision the owner asked about: **as copyable source on the docs site**, not as a package and not as a command-line tool. A template is code an app is meant to change (its routes, its data, its server action), so it belongs in the app, not behind an import; a package of whole pages would also need its own layout CSS, which the library's rule puts only in core. A command-line tool that writes the files is the copy-paste registry the parent spec defers until after 1.0. Section 5 weighs the three.

What it does not add: a sign-in or sign-up template (it would collect credentials, so it waits for an owner decision), a dashboard home template (the accounts and insights recipes cover it), a marketing page template (parent spec, section 2), a command-line tool, a downloadable starter app, color or header previews with their own logic (Preview frames what the app draws), and any new token. Section 1 lists where each is deferred.

## 1. Goal

Finish phase 5: give an app the two parts the phase still lists, Preview (with FontPreview, the source's font preview) and three page templates built only from library parts; then make the docs site the library's first full user, and release 1.0. Hold every part to the bar the later batches set: React Aria's behavior where React Aria has the part, a server face that is final, right to left, compact density and a coarse pointer, forced colors, the concentric corner rule and the intrinsic size rule of the design record, and the standing rule that focus never falls to the body.

The hard parts:

- **What "Preview" means.** The parent spec's row names the source's `styles/primitives/preview.css` and `js/font-preview.js` and gives no notes. The design record's "Previews" section says what they are for: a setting whose effect is visual. The docs site also has a "Preview" (its live example frame), and its `.preview` class would collide with the library's (section 7.1).
- **A preview must be true.** The record's one rule. A font sample drawn in the fallback face while the chosen font loads is a promise the page does not keep, so FontPreview must never show it, without measuring anything before the first paint and without making a request of its own.
- **Templates are not components.** They are pages an app copies and changes. How they ship decides how they are tested, versioned and kept in step with the parts they use (section 5).
- **No CSS of their own.** "Built only from library components" means a template that needs a layout the library lacks has found a gap in the library. The recipes the docs carry today (accounts, documents, transactions) use docs-only classes (`.stack`, `.row`, `.tile-row`) and inline styles; a copied template could not.
- **A shell inside a shell.** A template is a whole page with its own AppShell. Drawn inside a docs page, it would put a second `main`, a second skip link and a second sticky header inside the first.
- **The docs shell, again.** The docs' hand-built rail differs from the library's Sidebar in the ways the app-shell spec listed (section 13.5 there); replacing it moves every docs page at once.
- **1.0 is a promise.** After it, a renamed prop, class or token is a major release. The review must decide what is public before it ships, not after.

Build order inside each batch, from the least risk to the most, so the shared rules land first:

1. **11a.** Stack, Cluster and TileGrid (section 6), since Preview's docs and every template use them; Preview (section 7); FontPreview (section 8); the shared app frame and the three templates (section 9), the list template first because it uses the most shipped parts and the fewest new ones.
2. **11b.** The docs shell (section 10), then the 1.0 review and release (section 11).

Out of scope, each recorded where it is deferred:

- **A sign-in, sign-up or password reset template.** It collects credentials, so its sample must never look like a real service's; it waits for owner action 4 (open question 9).
- **A dashboard home template.** The accounts recipe and the insights recipe are home pages already; they move onto the layout parts in 11a and stay recipes (open question 9).
- **A command-line tool or registry** (parent spec, section 12; open question 8).
- **A downloadable starter app** (open question 8).
- **Previews with their own logic:** a color contrast preview (ColorField's chip does that, inputs spec, section 11.5), a header layout preview, an email preview. Preview frames whatever the app draws inside it.
- **Virtual device frames** (a phone outline around a preview). A frame is the surface step, as the record says, never a picture of hardware.
- Number formatting, as everywhere: every figure a template shows is the app's string.

## 2. The batch split

The phase is two new parts with a third small family (the layout parts), three templates, a docs migration and a release. The templates and the docs migration both touch every docs page's frame, and the release must come last. One release would put the riskiest docs change and the 1.0 promise in the same pull request as new parts, so it is two batches.

| Batch | Contents | Package releases | Why together |
| --- | --- | --- | --- |
| **11a, Templates** | Stack, Cluster, TileGrid; Preview; FontPreview; the settings, list and detail templates; the docs' Templates section; the recipes moved onto the layout parts | core and react, minor | The templates need the layout parts and use Preview on their settings page; all are new public API reviewed once in 11b |
| **11b, Docs shell** (as ruled) | The docs site on AppShell, Sidebar, PageHeader and Breadcrumbs; the review, the promise and 1.0.0 moved to the final 1.0 batch | none: a docs-only change, 0.x unchanged | No new part; the docs change proves the shell parts, and the review needs every part, 11a's included, in place |

**Recommended order: 11a, then 11b** (open question 1).

- **11a first.** Its parts are small and its risk is the template harness (section 9.6), which needs no new behavior from the library.
- **11b second.** The 1.0 review covers 11a's new names, so they ship once as 0.x and can still be renamed in the review if the first consumer's use shows a problem.
- **Or 11b's docs shell first,** as a docs-only change with no release, if the owner wants the docs on the library's shell sooner; it has no dependency on 11a.

**Versions.** The changesets name no number, as every batch does. If nothing else releases between, after 10b (0.16.0), 11a is 0.17.0 and 11b releases nothing. `@snapshot-ui/charts` takes a patch for its core peer with 11a, as every batch since 3a has done. As ruled (section 22), 1.0.0 comes after phase 7, in the final 1.0 batch; phase 6 (batch 12) is then core and react 0.18.0. If phase 6 ships before 11a, 11a moves up by one minor.

**If a batch must shrink.** The detail template is the largest and depends on the most batches (AvatarGroup from 10b); it can follow in a minor after 11a. FontPreview is independent of the templates and can ship without them. 11b cannot shrink: the docs shell and the review are what 1.0 means here.

## 3. What it takes from earlier batches

| From an earlier batch | Used here as |
| --- | --- |
| `AppShell` (batch 1): the `sidebar`, `header`, `bottomBar` and `floating` slots, `isSidebarCollapsed` from a pre-paint value, the skip link, `mainId`, `useAppShell()` | The templates' shared frame (section 9.2); the docs site's frame (section 10) |
| `Sidebar`, `SidebarBrand`, `SidebarGroup`, `SidebarItem`, `SidebarSearch`, `SidebarTrigger` (batch 1): groups, the icon rail at 104px, tooltips while folded, the drawer below 1024px | The templates' navigation; the docs' rail (section 10) |
| `PageHeader` and `PageColumn` (batch 4): the page's one `h1`, the trail, the eyebrow, actions that wrap under the title, `--container-page` | Every template's header and column; the docs pages' header |
| `Breadcrumbs`, `Breadcrumb` (batch 4) | The detail template's trail; the docs' crumb |
| `SaveBar` (batch 4): the count, Discard that asks, the status in a live region, the corner inset at its ends | The settings template |
| `PanelLayout`, `PanelNav`, `PanelNavItem`, `PanelSection`, `PanelRow` (batch 7): two faces, one address per section, focus to the section's heading | The settings template's frame; the detail template's paired cards (`PanelRow`) |
| `ConditionalFields`, `FieldExtras` (batch 7): hidden fields inert and left out of the form; Reset to default and Use suggested | The settings template's notifications and appearance sections |
| `ThemeSwitch`, `ThemeMenu`, `AccountMenu` (batch 7): the choice from a cookie, drawn as given | The templates' account menu and appearance section; the docs' color mode control |
| `CopyButton` (batch 7) | The docs' copy button on each template file |
| `DataTable` (batch 3c), `FilterBar` and `FilterChip` (batch 3a), `SearchField`, `Pagination`, `EmptyState`, `Skeleton` | The list template |
| `DescriptionList`, `CardActions`, `StatTile`, `Avatar` (batch 5), `AvatarGroup` (10b) | The detail template |
| `Tabs` with links (batch 2), `SidePanel` (batch 3c), `ConfirmDialog` and `useConfirm`, `Dialog`, `Menu`, `Badge` | The detail template's tabs, edit panel and delete; the list template's new item dialog |
| `TextField`, `TextArea`, `Select`, `Switch`, `SegmentedControl`, `MediaInput` (9b) | The settings template's fields |
| `Card` and the holder properties (`--holder-radius`, `--holder-border`, `--holder-pad`, `--holder-corner-inset`), `packages/react/src/stories/corner.ts`, `HOLDER_CORNER`, `CLEAR_OF_FOOT`, the concentric audit (`apps/storybook/tests/concentric`) | Preview's frame in a card (section 7.7); every new story in three shapes |
| The intrinsic size rule ("A width of its own" and "No width of its own"): every size container declares `contain-intrinsic-inline-size` | TileGrid's and Preview's containers (sections 6.4 and 7.4) |
| The server face record ("The server face"), the `server-render`, `server-face` and `hydration` suites | FontPreview's face (section 8.8); the templates' routes rendered on the server |
| `RouterProvider` and the routing page (batch 2) | The templates' links through Next's router |
| The docs' `site.css` classes `.stack`, `.row`, `.spread`, `.tile-row`, `.sample-column` | Moved into core as Stack, Cluster and TileGrid (section 6); `.sample-column` stays the docs' |
| The recipes `accounts-recipe.tsx`, `documents-recipe.tsx` and the transactions recipe | Moved onto the layout parts in 11a; they stay recipes on their component pages (section 9.1) |
| `useControllableState`, `useWarnOnce`, `cx`, `present`, `mergeRefs`, `useHydrated`, the status host pattern | As everywhere |

React Aria parts used for the first time: none. Preview, Stack, Cluster and TileGrid are server parts and import nothing from React Aria; FontPreview is a client part with no React Aria import.

## 4. What this phase answers

The parent spec's phase 5 rows, as input:

| Row | Source | React Aria basis | Notes in the parent spec | Here |
| --- | --- | --- | --- | --- |
| AppShell | `partials/layouts/snapshot.hbs`, `styles/shell/` | none | Composes the parts below | Shipped (batch 1); used by the templates and the docs (11b) |
| Sidebar | `partials/shell/sidebar.hbs` and its scripts | Disclosure, Link, Tooltip | Must reproduce the docs site's phase 1 rail | Shipped (batch 1); the docs move onto it in 11b |
| PageHeader, Breadcrumbs | `partials/shell/header.hbs` | Breadcrumbs | | Shipped (batch 4) |
| SaveBar | `partials/shell/save-bar.hbs` | none | Status in a live region. Discard confirms. | Shipped (batch 4) |
| AccountMenu, ThemeSwitch | `partials/shell/account.hbs`, `js/theme.js` | Menu, RadioGroup | Light, dark and system | Batch 7 |
| PanelLayout | `styles/primitives/panel.css`, `styles/panels/index.css` | none, static | Side and main columns; cards that only ever pair | Batch 7 |
| ConditionalFields | `js/gate.js` | none | Hidden fields become inert | Batch 7 |
| Field extras | `.ry-field-offer`, `js/blueprint-status.js` | none | Reset to default and suggested value | Batch 7 |
| **Preview** | `styles/primitives/preview.css`, `js/font-preview.js` | none | (none) | **11a: Preview and FontPreview (sections 7 and 8)** |
| **Page templates** | new | none | Settings page, list page and detail page, built only from library components | **11a: three templates (section 9), with Stack, Cluster and TileGrid (section 6)** |
| (R8 and section 8) | the docs' `components/shell/*` | | Phase 5 replaces the docs shell with the library's | **11b (section 10)** |
| (section 10) | | | 0.x until the end of phase 5, then 1.0 | **11b (section 11)** |

**What "Preview" means.** Three readings were possible:

1. **The docs' live example frame** (`apps/docs/components/mdx/preview.tsx`, `<Tabs className="preview">`). It is the docs site's own and is never shipped; the parent spec's row names source files from the source app, not the docs. Not this.
2. **A generic "device preview"** that renders a page at a phone's width in an iframe. Nothing in the source or the record asks for it; the docs need one for templates, and build it as a docs part (section 9.6). Not this.
3. **The settings preview**, the record's "Previews" section: a setting whose effect is visual gets a framed sample; the font preview loads the chosen family on demand; the frame keeps the 24px surface step; sample content keeps the color reservations (record, "Accent colors carry meaning inside a panel"). The source's `preview.css` is the frame and `font-preview.js` the loader. **This.**

So the row becomes two parts: **Preview**, the frame, and **FontPreview**, the source's one preview with logic of its own (open question 2). Other previews (a brand color on a sample header, a logo on a sample card) are the app's drawing inside a Preview, reading the values from the fields being edited, as the record says.

**What the templates are.** The parent spec names three: a settings page, a list page and a detail page, "built only from library components". Section 9 draws each, and section 5 decides how they ship.

The source paths are relative to the source app, which `.local/SOURCE.md` locates. That file is gitignored and is not in the worktree this spec was written in, so this spec works from the parent spec's row, the design record's "Previews" section and the library's own records. 11a's plan reads `styles/primitives/preview.css` and `js/font-preview.js` before the tasks that port them and records every difference as a correction (risk R10). Preview, FontPreview and the three layout parts are new to the library and each gets an Appendix B section in the design record before it is built (parent spec, section 3).

The rules for every part, unchanged: `'use client'` as the first line of every file that imports `react-aria-components`, and only on interactive parts; no `Intl` formatting and no `window` at render, and no first-paint measurement; no external request and no injected script; light and dark, all three shapes, right to left (the Persian guide), comfortable and compact density; WCAG 2.2 AA including 2.5.8; weights 400, 450, 500 and 700 only; tokens only in `@layer components`, unprefixed kebab-case classes, states as data attributes that also match the native pseudo-class; every size container declares `contain-intrinsic-inline-size`; focus never falls to the body; everything exported from the package index, with the CSS in `core/styles.css`; no new tokens without a measured reason; `@snapshot-ui/react` never ships CSS.

## 5. Approach

**How templates ship.** Four ways were weighed against what a template is (a page an app changes) and the library's rules (CSS only in core; React never ships CSS; a registry only after 1.0).

| Way | What an app does | Fits "an app changes it" | CSS rule | Kept in step with the parts | Cost to the library |
| --- | --- | --- | --- | --- | --- |
| **Copyable source on the docs site** | Copies a template's files from its docs page into `app/` | Yes: the files are the app's from the first line | No CSS at all: library parts and library classes only, enforced (section 9.1) | The templates live in `apps/docs/templates/`, are type-checked, built and tested in CI against the workspace's packages, so a breaking change fails there first | A docs section and a test harness |
| A templates package (`@snapshot-ui/templates`) | Imports `<SettingsTemplate sections={...} />` | No: every change an app needs becomes a prop, and a page's routes, data and server action cannot live behind an import | A package of pages needs layout CSS somewhere; core would carry page CSS for a package it does not know, or the package would ship CSS, which the rule forbids outside core | By version | A fourth package, its API frozen at 1.0, its props growing with every app's wish |
| A command-line tool (`npx snapshot-ui add settings-page`) | Runs a command that writes the files | Yes | As the first way | By the tool's version, plus a registry format to keep | A published binary, a registry, network fetches, and the copy-paste registry the parent spec puts after 1.0 (section 12 there) |
| Folders a developer fetches with a generic tool (`degit`) | Fetches `templates/settings` from the repo | Yes | As the first way | By git ref | Folders at the repo's root with their own package files; the docs cannot show them running without the same harness |

**Decided as recommended (open question 8): copyable source on the docs site.** The template's files are shown on its docs page, each with a copy button, running beside them in a frame at phone and desktop widths. They are the same files CI builds and tests, so what a developer copies is what was tested. When the parent spec's registry comes after 1.0, each template is already a folder of files with one data file and one routes file to replace, which is what a registry entry is; nothing here has to change for it.

**Templates use only the library.** A template imports `@snapshot-ui/react` (and `@snapshot-ui/charts` only where a chart is the point, which none of the three is), `react`, `next`, `lucide-react` and its own files. It writes no CSS file, no `style` attribute and no class name that is not a documented library class. A layout the library cannot draw is a gap in the library, and this phase fills the one the recipes show: Stack, Cluster and TileGrid (section 6).

**Server first.** Every template page is a server component that renders the whole page with its data; client components are the library's interactive parts and a few small files a template marks `'use client'` for its own state (the settings form, the list's URL state). Each template has `loading.tsx`, `error.tsx` and, for the detail page, `not-found.tsx`, so the four states are routes, as the App Router draws them.

**Preview is a frame; FontPreview is the source's loader with the record's rule.** Preview is a server part with no state. FontPreview is a client part only because it must learn after mount whether the font has loaded; its server face already says "Loading" in the app's words, so it never draws an untrue sample, even for a moment.

| Part | In the server's HTML | After hydration |
| --- | --- | --- |
| Stack, Cluster, TileGrid | Everything | Nothing changes |
| Preview | Everything: the frame, the stage with its pinned theme and shape, `inert` on the stage, the caption | Nothing changes |
| FontPreview | The sample with its family set, hidden but holding its size; the status saying `labels.loading(family)`; the `noscript` note | The app's loader runs; the sample shows once the face is confirmed, or the status says it failed |
| A template | The whole page from the server component and its data | The library parts' behavior; the template's own small client files |

**Colors keep their meanings, in samples too.** Preview sets no accent color on its stage. A sample uses ink and slate for hierarchy, and the user's own colors read from the fields being edited, never the library's reserved colors; the docs' sample header uses neither clay nor signal orange (the record's "early header preview" lesson). In the templates, signal orange appears nowhere; clay is the Changed chip only; error is a failed save or load only; success is a successful save only, through SaveBar and Toast; taupe is placeholder and disabled text only.

Rejected along the way:

- **A templates package.** Section above.
- **A command-line tool now.** Section above; the parent spec defers it.
- **Templates on Tailwind utilities.** The core ships a Tailwind theme, but not every app uses Tailwind, and a template on utilities would carry layout decisions the design record makes (the rhythm, the page column) as class lists an app can drift from. Layout parts carry them by name (open question 11).
- **Inline styles in templates** for the few layouts the library lacked. A copied inline style is a copied value outside the tokens.
- **The docs' Preview frame as the library's Preview.** It is a docs tool for showing code; its tabs, its stage and its sizing are the docs' (section 4).
- **A preview that draws the fallback face while the font loads.** It is the untrue preview the record warns against.
- **Templates drawn inline in a docs page.** A shell in a shell (section 9.6).

## 6. Stack, Cluster and TileGrid (11a)

### 6.1 Anatomy

```
Stack (gap="peer")           Cluster (gap="part")              TileGrid (min="16rem")
+------------------+         +------------------------------+  +----------+ +----------+ +----------+
| child            |         | [a] [b] [c] [d]              |  | tile     | | tile     | | tile     |
+------------------+  24px   | [e] [f]          (wraps)     |  +----------+ +----------+ +----------+
| child            |         +------------------------------+  +----------+
+------------------+                                            | tile     |   (auto-fit, 24px gaps)
                                                                +----------+
```

### 6.2 API

```ts
/** The design record's rhythm: 8px for parts of one thing, 24px for peers, 32px for separate things. 16 is skipped. */
export type SpaceStep = 'part' | 'peer' | 'separate';

export interface StackProps extends HTMLAttributes<HTMLElement> {
  /** @default 'peer' */
  gap?: SpaceStep;
  /** The element: a `section` with a heading, a `ul` of items, a `form`. @default 'div' */
  as?: 'div' | 'section' | 'ul' | 'ol' | 'form' | 'fieldset' | 'article';
  /** Children keep their own width at the start instead of stretching. @default 'stretch' */
  align?: 'stretch' | 'start' | 'center';
  ref?: Ref<HTMLElement>;
}

export interface ClusterProps extends HTMLAttributes<HTMLElement> {
  /** @default 'part' */
  gap?: SpaceStep;
  /** 'between' spreads the children to the two ends, the docs' `.spread`. @default 'start' */
  justify?: 'start' | 'end' | 'between';
  /** @default 'center' */
  align?: 'start' | 'center' | 'baseline';
  as?: 'div' | 'ul' | 'ol' | 'nav';
  ref?: Ref<HTMLElement>;
}

export interface TileGridProps extends HTMLAttributes<HTMLElement> {
  /** A tile's least width; the grid fits as many columns of it as its own box holds, never fewer than one. @default '16rem' */
  min?: '12rem' | '16rem' | '20rem';
  /** @default 'peer' */
  gap?: SpaceStep;
  as?: 'div' | 'ul' | 'ol' | 'section';
  ref?: Ref<HTMLElement>;
}
```

- **Steps, not numbers.** `gap` takes the three names of the rhythm, never a length, so a template cannot reach 16px or a value outside the tokens. `min` takes three lengths, recorded with their reasons (section 6.4): a 16rem tile is StatTile's, 12rem a compact figure, 20rem a card with a sentence.
- **`as` with a list.** A `ul` or `ol` resets its list style and padding, so a Stack of `li` is a list a screen reader counts, which the documents recipe did by hand.
- **Server parts.** No state, no directive, each a plain element with `className={cx('stack', className)}` and data attributes.

### 6.3 Markup and roles

`div.stack[data-gap][data-align]`, `div.cluster[data-gap][data-justify][data-align]`, `div.tile-grid[data-min][data-gap]`, or the element `as` names. No role is added: a Stack is not a group, and a list is a list by its element.

### 6.4 Look and CSS

New file `layout.css` in core, imported before the components so a component's own margin and gap rules win on order.

- **Stack.** `display: grid; gap: var(--spacing-peer)`, `--spacing-part` or `--spacing-separate` by `data-gap`; `justify-items` by `data-align`; `min-inline-size: 0` on its children, the usual cause of overflow at 320px (parent spec, section 5.7).
- **Cluster.** `display: flex; flex-wrap: wrap; align-items: center` (or `start`, `baseline`), `gap` by step, `justify-content` by `data-justify`; children `min-inline-size: 0`.
- **TileGrid.** `display: grid; grid-template-columns: repeat(auto-fit, minmax(min(var(--tile-grid-min), 100%), 1fr))`, the docs' `.tile-row` rule, with `--tile-grid-min` set from `data-min`. The `min(..., 100%)` keeps one column in a box narrower than the minimum, so nothing scrolls sideways at 320px.
- **Not a size container.** None of the three queries its own width; each takes the width its holder gives. A StatTile in a TileGrid is a size container of its own and takes its column's width, as in the docs today.
- **Weights, colors, corners.** None: the three draw nothing.
- **Tokens only.** Gaps are the three spacing tokens; the three minimums are literals in `layout.css`, as SidePanel's 24rem is, each with its reason in the record.

### 6.5 Forced colors, right to left, density and pointer

Nothing is drawn, so forced colors change nothing. Right to left follows from grid and flex with logical properties. Compact density changes no gap: the rhythm is the same in both densities (the record's compact density section changes controls and card padding only). A coarse pointer changes nothing.

### 6.6 Corners

The three have no corner. A Card inside a Stack is a full card and keeps its own corner; a StatTile in a TileGrid is the same.

### 6.7 Server rendering

Static parts, in the server components suite. `server-render.test.tsx` renders each with every step.

### 6.8 How others do it

| System | Parts | Steps | What this spec takes |
| --- | --- | --- | --- |
| Every Layout (to verify current names) | Stack, Cluster, Grid, Switcher | A modular scale by custom property | The three names and the auto-fit grid |
| Shopify Polaris | `BlockStack`, `InlineStack`, `InlineGrid` (to verify) | Space tokens by name | Gaps by token name only |
| Atlassian | `Stack`, `Inline` primitives (to verify) | Space tokens by name | The same |
| GitHub Primer | `Stack` with `direction` and `gap` names (to verify) | `condensed`, `normal`, `spacious` | Named steps rather than lengths |
| Radix Themes | `Flex`, `Grid` with a numeric scale (to verify) | 1 to 9 | Not taken: a numeric scale reaches values the rhythm skips |

## 7. Preview (11a)

### 7.1 Anatomy and name

```
+---------------------------------------------------------------+   <- the frame: --radius-surface, 1px frame edge
|                                                               |
|      (the app's sample, drawn on the stage's own canvas,      |   <- the stage: inert, pinned theme and shape
|       in the theme and shape the preview is pinned to)        |
|                                                               |
+---------------------------------------------------------------+
  PREVIEW  How your site's header will look                        <- the caption: an eyebrow and a sentence
```

**The name.** The part is `Preview` and its class `preview`, the parent spec's name. The docs site uses `.preview` and `.preview-head` for its own example frame (`apps/docs/components/shell/shell.css`, `preview-tabs.tsx`), so 11a renames the docs' to `docs-preview` and `docs-preview-head` in the same commit that adds the library's, as the pickers batch moved the docs' `.tabs` onto the library's (open question 3).

### 7.2 API

```ts
export interface PreviewProps extends Omit<HTMLAttributes<HTMLElement>, 'children'> {
  /** The sample: the app's drawing of the setting's effect. */
  children: ReactNode;
  /** The eyebrow over or under the stage: "Preview". Always visible, so the frame never reads as a live control. */
  label?: ReactNode;
  /** A sentence after the label: "How your site's header will look". Also the figure's description. */
  description?: ReactNode;
  /** Pins the stage's color mode, so a light site previews light inside a dark settings page. @default the page's */
  theme?: 'light' | 'dark';
  /** Pins the stage's corner shape, so a site set to Square previews square. @default the page's */
  shape?: 'rounded' | 'soft' | 'square';
  /** Lets the reader reach and press what the sample holds. Off, the stage is inert: a picture, not a page. @default false */
  isInteractive?: boolean;
  /** The caption's place. @default 'bottom' */
  captionPlacement?: 'top' | 'bottom';
  ref?: Ref<HTMLElement>;
}
```

- **A frame for what the app draws.** Preview holds any children. The docs show three samples: a font (FontPreview, section 8), a sample header reading the brand color and logo from the fields being edited, and a sample card in the chosen corner shape.
- **`theme` and `shape`** write `data-theme` and `data-shape` on the stage, the same attributes the library's theme axes already switch per subtree (parent spec, section 2, "Shape"). The stage's tokens resolve in the pinned mode, so its canvas, ink and edges are the pinned mode's. Without them the stage follows the page.
- **Inert by default** (open question 4). A sample header has links and a sample form has fields; a reader who tabs into them is in a picture. The stage takes `inert`, so its contents are neither focusable nor read; the caption says what the picture shows. An app that previews something to try (a button's hover state) passes `isInteractive`, and the stage then is a `group` named by the label.
- **Required words.** In development, a Preview with neither `label` nor `description` warns once: the caption is the only accessible account of an inert sample.

### 7.3 Markup and roles

- `figure.preview[data-caption]` holding `div.preview-stage` and `figcaption.preview-caption`, in DOM order caption-last by default (a `figure`'s caption may come first or last; `captionPlacement="top"` moves it first).
- `div.preview-stage[inert][data-theme][data-shape]`: `inert` unless `isInteractive`; with `isInteractive`, `role="group"` and `aria-labelledby` the caption's label id instead.
- `figcaption.preview-caption` holding `span.preview-label` (the eyebrow) and `span.preview-description`. The figure's accessible name is its caption, which every engine computes for `figure` (to verify in WebKit with VoiceOver).

### 7.4 Look and CSS

New file `preview.css` in core.

- **The frame.** `border: 1px solid var(--color-frame)`, `border-radius` per section 7.7, `overflow: clip` so the sample is cut by the frame's corner, `background-color: var(--color-canvas)` resolved on the stage (so a light stage in a dark page is the light canvas). The frame is a surface step, never the section's 40px (the record).
- **The stage.** `padding: var(--spacing-peer)`, 24px, `container-type: inline-size` with `contain-intrinsic-inline-size: 20rem`, so a sample can respond to the stage's width rather than the viewport's, and a Preview in a shrink-to-fit holder is 20rem wide rather than nothing (the intrinsic size rule). The stage sets `color: var(--color-ink)` and `font-family: var(--font-sans)` afresh, so a sample does not inherit a caption's slate.
- **The caption.** `margin-block-start: var(--spacing-part)` (8px, parts of one thing), the label in the Eyebrow's look (14px, 700, uppercase, its accent dot hung in the gutter: the one uppercase the record allows) in slate, never taupe (the record's "Where each text color may go": a preview's eyebrow was once set in taupe and had to be fixed), the description `--text-small` at 450 in slate.
- **No accent on the frame.** No signal, clay, error or success anywhere in `preview.css`; the CSS test fails one.
- **Weights.** 700 for the eyebrow, 450 for the description.

### 7.5 Keys and screen readers

- **Inert (the default).** No key reaches the stage; Tab passes the whole Preview. A screen reader in browse mode reads the figure and its caption: "Preview, How your site's header will look, figure". The sample's own text is not read, by design: it is a picture whose words are sample words (open question 4 records the alternative).
- **Interactive.** Tab enters the stage's controls in DOM order; the stage is announced as a group named "Preview".

### 7.6 Forced colors, right to left, density and pointer

- **Forced colors.** The frame's edge is `CanvasText`; the stage's background is the system's `canvas`, since a pinned theme cannot hold in forced colors (the reader's colors win, as everywhere); the sample draws in system colors through its own parts' forced-color blocks. The docs say a color preview cannot show its colors under forced colors, and FontPreview's sample keeps its family, which forced colors do not change.
- **Right to left.** Logical properties; the eyebrow's dot hangs into the inline-start gutter, as Eyebrow's does. A pinned stage keeps the page's direction unless the app sets `dir` on its sample.
- **Compact density.** The stage padding stays the peer step; the caption is unchanged.
- **Coarse pointer.** Nothing to press unless `isInteractive`, and then the sample's own parts keep their 40px and 44px targets.

### 7.7 Corners

The frame is a nested surface: `--radius-surface` (24px Rounded, 12px Soft, 0 Square) where it stands clear of a holder's curve. Where a corner of the frame lies within a Card's curve (the Preview is the card body's first or last child), that corner takes the holder formula with the micro floor: 7px in Rounded (19px compact), 6px in Soft, 0 in Square, the record's "Previews" rule ("where it meets the section's corner it takes the section's radius less the gap") and the row "Card ... a card or tile in it" of "Nested radii, derived". It is written per corner with logical properties, through `:is(.card-body:first-child, ...) > .preview:first-child` and its last-child twin, so a Preview in the middle of a card keeps the surface step at all four corners. The stage's own content starts a new ladder: a Card drawn as a sample on the stage is a stadium on the stage, not a step down from the frame (the sample is a picture of another page). The concentric audit runs every Preview story in three shapes.

### 7.8 Server rendering

A server part: everything is in the server's HTML, `inert` included. It joins the server components suite and `server-render.test.tsx`.

### 7.9 How others do it

| System | What it previews | How | What this spec takes |
| --- | --- | --- | --- |
| WordPress Customizer (to verify current behavior) | The whole site | A live iframe beside the settings | The reason to pin theme and shape: the preview is the site, not the panel |
| Shopify theme editor (to verify) | The storefront | A live iframe with device widths | Not taken: a whole-page preview is the app's iframe, not a frame part |
| Google Fonts specimen pages (to verify) | A font | The sample drawn only in the loaded face | FontPreview's rule |
| Figma and Webflow font menus (to verify) | Font names | Each name drawn in its face, loaded lazily | The lazy load; not the menu |
| Atlassian, Polaris, Carbon, Material (to verify each) | No preview frame part found | | Nothing; the part is the record's own |

## 8. FontPreview (11a)

### 8.1 Anatomy

```
+---------------------------------------------------------------+
|  Poppins                                                       |   <- the family's name, in the panel's face
|  The quick brown fox jumps over the lazy dog                   |   <- the sample, in Poppins, only once loaded
+---------------------------------------------------------------+
  PREVIEW  Headings will use Poppins at 500

Before the face is confirmed:  the sample's line is held at its height, empty, and the status says "Loading Poppins".
If loading fails:              the status says "Poppins could not be loaded".
```

### 8.2 API

```ts
export interface FontPreviewLabels {
  /** The polite status while the face loads. @default (family) => `Loading ${family}` */
  loading: (family: string) => string;
  /** Drawn when the loader fails or the face is never confirmed. @default (family) => `${family} could not be loaded` */
  failed: (family: string) => string;
  /** With scripts off. @default 'Font previews need scripts to load the font.' */
  noScript: string;
}

export interface FontPreviewProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  /** The CSS family name the setting holds: "Poppins". */
  family: string;
  /**
   * Loads the face: a FontFace you build and add, a stylesheet you insert, anything that resolves once the face
   * is in `document.fonts`. Absent, the face must already be loaded by the app (next/font, a stylesheet).
   */
  load?: () => Promise<unknown>;
  /** @default 450 */
  weight?: 400 | 450 | 500 | 700;
  /** @default 'normal' */
  style?: 'normal' | 'italic';
  /** The sample line, in the reader's language. @default 'The quick brown fox jumps over the lazy dog' */
  sample?: string;
  /** Shows the family's name over the sample, in the panel's own face. @default true */
  showsName?: boolean;
  /** @default 'heading' */
  size?: 'body' | 'heading';
  labels?: Partial<FontPreviewLabels>;
  ref?: Ref<HTMLDivElement>;
}
```

- **The app loads; the library confirms.** The library makes no request and names no font service (the standing rule). `load` is the app's: the docs show a self-hosted `FontFace` with a `woff2` URL the app serves, and the note that `next/font` loads at build time, so a picker of many families uses `FontFace`. After `load` resolves, or at once with no `load`, the part asks `document.fonts.check('<weight> <style> 1em "<family>"')`; true shows the sample.
- **Weights are the system's.** 400, 450, 500 and 700, so a preview never asks for a 600 that the system bans. A family without the weight is drawn in the weight the browser picks, without synthesis (`base.css` sets `font-synthesis: none`), which is what the site will draw: true.
- **A family name is data.** It is written into an inline custom property, `--font-preview-family`, quoted and with every `"` and `\` escaped, never into a style rule; `font-family: var(--font-preview-family), var(--font-sans)` on the sample.
- **One preview per family change.** A new `family` resets to loading and runs `load` again; a stale promise that resolves after a change is ignored.

### 8.3 Markup and roles

- `div.font-preview[data-state][data-size]`, in a Preview's stage or alone.
- `p.font-preview-name` (the family's name, in `--font-sans`, ink, 500), when `showsName`.
- `p.font-preview-sample[lang]`, the sample, `lang` from the nearest ancestor unless the app sets it; `aria-hidden` while not ready, so a screen reader never reads a line that is not drawn.
- `span.font-preview-status[role="status"]`, mounted from the first render, polite: the loading words while `data-state="loading"`, the failed words on `failed`, empty when `ready`.
- `<noscript><p class="font-preview-status">{labels.noScript}</p></noscript>`.

### 8.4 Behavior

- **States.** `data-state` is `loading` from the server and the first client render, then `ready` or `failed`. A face already in `document.fonts` turns `ready` in the first effect, before the browser's next paint in practice (to verify that no frame of the empty line is visible in three engines; risk R2).
- **Loading.** The sample is `visibility: hidden`, so it holds its line's height and the frame does not jump; the status says the loading words once.
- **Failed.** When `load` rejects, or resolves but `check` is false 3 seconds after it resolved (a font that loads the wrong face), the sample stays hidden and the status says the failed words in `--color-error`: a failed load is a failure, the meaning the insights spec gave the chart's error face. The words carry it.
- **Ready.** The sample is shown; the status empties.
- **Inert stage.** Inside a default Preview the status is also inert, so not announced; the Preview's description should then name the font ("Headings will use Poppins at 500"), which the docs show. A FontPreview whose loading matters to a screen reader is placed outside an inert stage or in an interactive one (open question 7).

### 8.5 Keys and screen readers

No keys. The sample is read once shown, in its `lang`; the status speaks once per state.

### 8.6 Look and CSS

In `preview.css`.

- **Sample.** `size="heading"`: `--text-h3` (24px), 500, -2%, the heading step a font setting usually governs; `size="body"`: `--text-body`, 450. Ink. Two lines at most with an ellipsis (`-webkit-line-clamp: 2`), so a long sample cannot grow the frame. Its line box reserved by `min-block-size: calc(var(--text-h3--line-height) * 1em)`.
- **Name.** `--text-small`, 500, ink, `--font-sans`: the name is the panel's words, not the sample.
- **Status.** `--text-small`, 450, slate; `--color-error` under `[data-state='failed']`.
- **Weights.** 450, 500, and the sample's own weight from the setting, which is one of the four.

### 8.7 Forced colors, right to left, density and pointer

Forced colors repaint the text in `CanvasText`; the family is kept, which is the point. Right to left: the sample's `lang` and the page's `dir`; a Persian app passes a Persian sample and Persian `labels`. Compact density: unchanged. Pointer: nothing to press.

### 8.8 Server rendering

A client part (`'use client'`) for its one effect. The server and the first client render agree: `data-state="loading"`, the sample hidden with its family set, the status with the loading words, the `noscript` note. No `Intl`, no `window` and no `document.fonts` at render. It joins `server-render.test.tsx`, `server-face.test.tsx` (three locales, two zones; the face is the same string in each) and `hydration.test.tsx` with a mocked iPhone, `onRecoverableError` failing the test.

### 8.9 How others do it

| System | Before the face loads | What this spec takes |
| --- | --- | --- |
| The source's `js/font-preview.js` (to verify in the plan) | Loads the family on demand (the record) | The on-demand load, moved to the app's `load` |
| Google Fonts' specimen and picker (to verify) | Draws names and samples after the face loads | Never draw the fallback |
| CSS `font-display: block` | Text invisible for a short block period, then the fallback | The invisible hold, without the fallback after it |
| Shopify's font picker in the theme editor (to verify) | Lazy loads each family's preview image | Not taken: images of type are not the face |

## 9. The page templates (11a)

### 9.1 What a template is

- **A folder of Next App Router files** under `apps/docs/templates/projects/`, one app with three areas, so the three share one frame as a real app's pages do:

```
apps/docs/templates/projects/
  routes.ts                  every href the templates write, from one base path: the one file to change on copying
  data.ts                    the sample workspace and its projects: the file to replace with real data
  actions.ts                 'use server': the settings save, the new project, the archive and delete
  layout.tsx                 the shared frame: AppShell, Sidebar, AccountMenu with ThemeMenu (section 9.2)
  shell-state.tsx            'use client': the folded rail's cookie and the drawer
  settings/layout.tsx        PanelLayout and its PanelNav (section 9.3)
  settings/[section]/page.tsx
  settings/settings-form.tsx 'use client': the form, its changed state and the SaveBar
  projects/page.tsx          the list (section 9.4)
  projects/loading.tsx       projects/error.tsx       projects/list-state.tsx ('use client')
  projects/[id]/layout.tsx   the detail's header and tabs (section 9.5)
  projects/[id]/page.tsx     projects/[id]/activity/page.tsx      projects/[id]/not-found.tsx
  projects/[id]/edit-panel.tsx ('use client')
```

- **Copied whole or in part.** The docs page of each template lists the files it needs; the shared frame, `routes.ts`, `data.ts` and `actions.ts` are listed on all three.
- **The rules, enforced by `templates.test.ts`** (open question 11):
  - no `style` attribute, no `.css` import, no `<style>` element;
  - every `className` string is a documented library class, read from core's component roots list (`packages/core/scripts/component-roots.js`) and the layout parts;
  - imports only from `@snapshot-ui/react`, `react`, `react-dom`, `next/*`, `lucide-react` and the template's own files;
  - no `'use client'` on a `page.tsx` or `layout.tsx`;
  - every `href` comes from `routes.ts`;
  - no em dash, no emoji and no private or consumer name in sample content (the repo's rules), and no signal orange or clay in sample content (the record's reservations).
- **Neutral sample content.** An imaginary "Larkspur" workspace with projects named after places ("Harbor", "Meridian", "Saltmarsh"), people with generic names, and dates in the app's strings. No real company's name, logo or branding (risk R7).
- **Recipes are not templates.** The accounts, documents and transactions recipes stay on their component pages as demonstrations; 11a moves them onto Stack, Cluster and TileGrid so the docs carry no private layout classes, but they keep their inline chart wrappers, which are docs sizing for a stage, not page layout.

### 9.2 The shared frame

```tsx
// layout.tsx: a server component.
<AppShell
  sidebar={
    <Sidebar label="Larkspur">
      <SidebarBrand ... />
      <SidebarGroup label="Work">
        <SidebarItem href={routes.projects} icon={<FolderKanban />}>Projects</SidebarItem>
      </SidebarGroup>
      <SidebarGroup label="Workspace">
        <SidebarItem href={routes.settings} icon={<Settings />}>Settings</SidebarItem>
      </SidebarGroup>
    </Sidebar>
  }
  defaultSidebarCollapsed={collapsedFromCookie}
>
  {children}
</AppShell>
```

- **The rail's memory** is a cookie read on the server, so the first paint has the right rail (the app-shell spec's pre-paint rule); `shell-state.tsx` writes it.
- **AccountMenu** in the Sidebar's footer with the ThemeMenu submenu; the theme cookie read on the server writes `data-theme` on `<html>` in the app's root layout, which the docs page shows as a snippet since the root layout is the app's.
- **RouterProvider** with Next's `useRouter().push`, the routing page's recipe.

### 9.3 The settings template

```
+------------+  Settings                                              <- PageHeader h1
| Projects   |  +---------------+  Workspace                          <- PanelSection h2, focus lands here
| Settings   |  | Workspace   > |  +----------------------------------------------+
|            |  | Notifications |  | Name           [Larkspur              ]     |
|            |  | Appearance    |  | Address        larkspur.example/[ harbor ]  |
|            |  | Danger zone   |  | Logo           [ MediaInput             ]    |
|            |  +---------------+  +----------------------------------------------+
|            |                     2 changes            [Discard]  [Save]   <- SaveBar
+------------+
```

- **Sections** (each its own address, PanelLayout's rule): **Workspace** (TextField name, TextField with a prefix for the address, MediaInput for the logo); **Notifications** (Switch "Email me a weekly summary" gating ConditionalFields with a Select for the day and a SegmentedControl for the format); **Appearance** (ThemeSwitch for the workspace's default, a Select of six fonts with FieldExtras "Default: Sofia Sans. Reset to default", and a **Preview** holding a **FontPreview** of the chosen family, pinned to the workspace's chosen theme; a SegmentedControl for the corner shape with a Preview of a sample card pinned to that shape); **Danger zone** (a Card whose danger Button opens a ConfirmDialog that asks for the workspace's name).
- **One form per section,** a `form` with the server action `saveSection`; `settings-form.tsx` keeps the changed state, passes `isChanged` to each field and drives the SaveBar's count; Discard asks (SaveBar's rule); a save shows SaveBar's saved status, a failed save its error and the field errors from the action's result under their fields.
- **Leaving with changes.** The template does not block navigation (no `beforeunload` prompt); SaveBar's count and the Changed chips say what is unsaved, and the docs say how an app adds a guard if it wants one (open question 14).

### 9.4 The list template

```
Projects                                              [New project]  [...]
+------------------------------------------------------------------------+
| [Search projects     ]  (Status: Active v) (Owner v)   Clear filters    |   <- FilterBar
+------------------------------------------------------------------------+
| [ ] Name           Owner          Status     Updated          ...      |   <- DataTable, sortable
| [ ] Harbor         Ana Ruiz       Active     12 Oct                    |
| [ ] Meridian       Ben Okafor     Paused     9 Oct                     |
+------------------------------------------------------------------------+
  1 to 20 of 64                                   < 1 2 3 4 >   20 per page   <- Pagination
```

- **The address holds the state.** Search, filters, sort, page and page size live in the search params (the FilterBar URL recipe's way), so a reload, a shared link and Back keep the view; `list-state.tsx` writes them with `router.replace` and the server page reads them and queries `data.ts`.
- **Rows link.** Each name is a Link to the project's detail; DataTable's list face below its breakpoint.
- **Selection and bulk actions.** Selecting rows shows DataTable's bulk bar with Archive, which calls the `archive` action and reports through a Toast.
- **New project** opens a Dialog with a form (TextField name, Select owner) posting to `createProject`, then navigates to the new detail page; focus goes to its `h1` (PageHeader's).
- **States, each a route or a branch:** `loading.tsx` draws the PageHeader and DataTable's skeleton rows; no projects at all draws an EmptyState "No projects yet" with New project; no matches draws an EmptyState "No projects match these filters" with Clear filters; `error.tsx` draws an EmptyState with the error words and Retry (`reset()`).

### 9.5 The detail template

```
Projects / Harbor
Harbor  [Active]                                       [Edit]  [...]
Overview   Activity                                                      <- Tabs as links
+----------------+ +----------------+ +----------------+                 <- TileGrid of StatTiles
| Open tasks  14 | | Due this week 3| | Members      6 |
+----------------+ +----------------+ +----------------+
+------------------------------------------+ +-------------------+       <- PanelRow: two thirds and a third
| Details                          [Edit]  | | Members           |
| Owner      Ana Ruiz                      | | (AvatarGroup)     |
| Started    2 Sep                         | | Ana, Ben, +4      |
| Summary    ...                           | |                   |
+------------------------------------------+ +-------------------+
```

- **Header** in `projects/[id]/layout.tsx`: PageHeader with Breadcrumbs (Projects, Harbor), the title, a Badge for the status (neutral or info tone, never success for "active": success means a save), and actions: Edit (opens the SidePanel) and a Menu with Archive and Delete.
- **Tabs as links,** Overview and Activity, each its own route, the selected tab from the segment.
- **Overview:** a TileGrid of three StatTiles; a PanelRow of a two-thirds Card with a DescriptionList and CardActions (Edit), and a third Card with an AvatarGroup and a link to manage members.
- **Activity:** a Card with DataTable's list face of recent events, paged.
- **Edit** opens a SidePanel with the project's fields and a footer Save; focus moves to its heading and back to Edit on close (SidePanel's rule).
- **Delete** asks with a danger ConfirmDialog, then calls `deleteProject` and navigates to the list with a Toast; focus lands on the list's `h1`.
- **Not found:** `not-found.tsx` draws an EmptyState "This project does not exist" with a link back to Projects.

### 9.6 How the docs show a template

- **A docs group, "Templates,"** after "Getting started" in `content/docs/meta.json`: `templates/index` (what a template is, what to copy, the rules of section 9.1, how to change `routes.ts` and `data.ts`), `templates/settings`, `templates/list`, `templates/detail`.
- **Running in a frame.** Each page shows its template in an `iframe` (`title` "Settings template, running"), pointed at a docs route that renders the template outside the docs shell: `apps/docs/app/(templates)/templates/run/[...path]/` mounts the template's files under a base path. So the template's AppShell, skip link, `main` and sticky header are the only ones in their document (section 1's shell-in-shell problem). A SegmentedControl over the frame sets its width (Phone, 375px; Desktop, the column's width), and "Open in a new tab" links the route itself.
- **The site's switches follow.** The frame's URL carries `?theme=&shape=&density=` from the docs' header switches; a docs-only wrapper in the run route applies them, and it is not one of the copied files.
- **The code.** Under the frame, a file list: each file's path, its role in a sentence, its source in the docs' code block with a CopyButton. The source shown is read from the same files the run route imports, at build time, so the shown code and the running code cannot differ.

### 9.7 Keys, focus and screen readers

The templates add no keys of their own: every key is a library part's. What a template owns is where focus goes between its parts, and each is a test:

| When | Focus goes to |
| --- | --- |
| A settings section opens | Its heading (PanelLayout's) |
| A settings save fails with field errors | The first invalid field |
| The list's filters change | Stays in the control used; the polite status says the new count (DataTable's) |
| A new project is created | The detail page's `h1` |
| A bulk archive finishes | The table; the Toast is polite |
| The edit panel closes | Edit |
| A project is deleted | The list's `h1` |
| A not-found page renders | Its `h1` in the EmptyState, as the page's first heading |

Every template page has one `h1` (PageHeader's), landmarks from AppShell (`nav` for the rail, `main`), and a title per route through Next's `metadata`.

### 9.8 Forced colors, right to left, density, corners and server rendering

- **Forced colors, density, corners:** each part's own; the templates add no CSS. The concentric audit runs the three page stories in three shapes.
- **Right to left.** A Persian run of each template is a story (section 16) with Persian sample strings in `data.ts`'s Persian twin; `routes.ts` and the code are unchanged.
- **Server rendering.** The pages are server components; the docs' e2e loads each route with scripts off and checks that the page, its table and its form are drawn (the form posts without scripts, through the server action).

### 9.9 How others do it

| System | Page templates | How they ship | What this spec takes |
| --- | --- | --- | --- |
| shadcn/ui blocks (to verify current scope) | Dashboards, sign-in, sidebars | Copied by a CLI from a registry | The copy model; the CLI after 1.0 |
| Tailwind Plus application UI (to verify) | Page shells, lists, detail screens | Copy-paste from a paid site | Pages shown running at device widths |
| GOV.UK Design System and Prototype Kit (to verify) | Patterns and page templates | Copy-paste HTML; the kit's templates | Patterns as whole pages, plain first |
| GitHub Primer (to verify) | `PageLayout` and documented patterns | A component plus guidance | Layout as parts, pages as guidance |
| Atlassian (to verify) | Page layout components and templates in its design site | Components plus examples | The same split |
| Refine, React-admin (to verify) | CRUD list, show and edit pages | Generated by a CLI into the app | List and detail as the core pair |

## 10. The docs site on the library's shell (11b)

The parent spec's R8 and the app-shell spec's section 13.5, done.

- **What changes.** `apps/docs/components/shell/docs-shell.tsx`, `rail.tsx` and `header.tsx` are replaced by `AppShell`, `Sidebar` (its groups from the Fumadocs page tree, the separators as `SidebarGroup` labels), `SidebarSearch` opening the docs' search in `CommandPalette`, `PageHeader` with `Breadcrumbs`, and, in the header, the color mode and corner switches as a ThemeMenu and a SegmentedControl. The table of contents stays the docs' own (Fumadocs'), in the side column, which is page content and not shell.
- **The pre-paint value.** `data-rail` on `<html>` becomes `data-sidebar`, read into `isSidebarCollapsed` through `useSyncExternalStore`, as section 13.5 there planned; `lib/focus-trap.ts` goes, since the Drawer traps focus.
- **The diffs a reader will see,** each a snap to the record and listed so nobody takes them for regressions (app-shell spec, 13.5): item gap 2px to 8px, item type 15px to 16px, group label 12px to 14px, hover from the canvas fill to the ink wash, the collapse button straddling the rail's edge, labels wrapping instead of ellipsizing, no corner transitions.
- **The tests move.** `apps/docs/tests/docs.spec.ts`'s rail tests (collapse and memory, the closed rail out of the tree, the drawer's focus and Escape, search's Escape, widening, the close button, the current page closing the drawer, Back and Forward) are rewritten against the library's parts and keep every assertion; the 320px and 375px no-sideways-scroll checks run on every page.
- **The docs' private CSS shrinks.** `shell.css` loses its rail, drawer and header rules; what remains is the docs' own (the stage, the code block's Shiki mapping until Prose's move, the table of contents).

## 11. The 1.0 review and the stability promise (moved to the final 1.0 batch)

As ruled (section 22), this section is carried out after phase 7, in the final "1.0" batch of `docs/specs/2026-10-20-html-design.md`, which takes it as its input and covers all five packages. Its content stands as written, with "11b" read as that batch and charts' peer moved there.

**The promise,** written on a new docs page, "Versioning," and in each package's README (open question 19):

- **Public, under semantic versioning:** every export of `@snapshot-ui/react` and its props types; every token in `tokens.json` and its CSS custom property; every class and data attribute the docs name on a component page (the CSS contract the HTML version will share); the component roots list; the `labels` keys of each part.
- **Not public:** classes and custom properties the docs do not name (the corner helpers' internals, `--*-internal` names), DOM structure beyond the documented classes, the exact text of development warnings, and visual values that follow a token (a token's value may change in a minor when the record measures a reason; its name may not).
- **What is a major:** removing or renaming any public name; changing a prop's meaning or default in a way an app can see; raising the React or browser floor.

**The review,** one task per package, each producing a list the owner signs off:

1. Every export documented, typed, and named in React Aria's vocabulary (`isDisabled`, `onChange`, `selectedKey`).
2. Every deprecated alias since 0.1 removed, each listed in the release note with its replacement.
3. Every `labels` type complete and every English default listed on its page.
4. Every documented class and data attribute present in the component roots list, and nothing undocumented in it.
5. Peer ranges: React `^19.0.0`; `@snapshot-ui/core` and `@snapshot-ui/react` in the fixed group; charts' peer on core moved to `^1.0.0`.
6. The browser floor written down (the one the records cite: the three engines' versions at the time of writing, to verify).

**Charts and the editor stay 0.x** (open question 20). Phase 6 is not finished and the editor is new; each reaches 1.0 when its own phase ends. Charts' peer on core becomes `^1.0.0`, which accepts every 1.x core, so from 1.0 a core minor no longer forces a charts patch unless charts needs that minor's CSS (the 0.x caret's chore ends).

## 12. The corner rule and the intrinsic size rule, together

| Part | Rounded parts it holds | In a holder | Size container |
| --- | --- | --- | --- |
| Stack, Cluster, TileGrid | None | Content an app places | No |
| Preview | The frame: the surface step, or the holder formula with the micro floor at a corner within a Card's curve (7px, 6px, 0; 19px compact); the stage starts a new ladder | A part of a card's body | Yes: the stage, with `contain-intrinsic-inline-size: 20rem` |
| FontPreview | None | In a Preview's stage | No |
| Templates | Their parts' own | Pages | Their parts' own |

## 13. Accessibility

- **Roles and names.** Preview: a `figure` named by its `figcaption`, its stage `inert` or a `group`. FontPreview: a `status`, a sample with `lang`. Templates: AppShell's landmarks, one `h1` per page, a `title` per route.
- **Focus never falls to the body.** Section 9.7's table, each a test in the docs' e2e that reads `document.activeElement` and fails on `body`.
- **Never color alone.** FontPreview's failure is words; a project's status is a Badge's words; Changed is a chip with its word; the SaveBar's count is words.
- **Targets (2.5.8).** Every control in a template is a library part at 40px (44px compact on a coarse pointer).
- **Inert samples.** A sample that is inert is not read; its caption says what it shows, and the development warning catches a Preview with no caption.
- **Axe** passes in light and dark for every story and on every template route at 375px and 1280px.
- **Screen readers.** Not yet verified with VoiceOver, NVDA and TalkBack for Preview, FontPreview or the templates (owner action 3).

## 14. Decided here

1. Phase 5's remaining rows and duties ship as two batches: 11a (Templates: layout parts, Preview, FontPreview, three templates) and 11b (the docs shell, no release), in that order; the review and 1.0.0 follow phase 7 (ruling 1.0).
2. "Preview" is the record's settings preview: a frame part, `Preview`, and the source's font preview, `FontPreview`. The docs' example frame is not it and takes the names `docs-preview` and `docs-preview-head`.
3. Preview's stage is `inert` by default, `isInteractive` turns it into a named group; `theme` and `shape` pin the stage's axes with the existing attributes.
4. Preview's frame takes the surface step, and the holder formula with the micro floor at any corner within a Card's curve.
5. FontPreview never draws the sample before `document.fonts.check` confirms the face; the app's `load` loads it; the library makes no request.
6. FontPreview's weights are 400, 450, 500 and 700 only.
7. Templates ship as copyable source on the docs site, in `apps/docs/templates/projects/`, type-checked, built and tested in CI.
8. Templates are Next App Router files with server components, server actions and route states (`loading`, `error`, `not-found`).
9. Templates use no CSS, no `style` attribute and only documented library classes, enforced by `templates.test.ts`.
10. The three templates are one sample app, "Larkspur" projects, sharing one frame, `routes.ts`, `data.ts` and `actions.ts`.
11. Stack, Cluster and TileGrid join core and react; the docs' `.stack`, `.row`, `.spread` and `.tile-row` are removed in their favor.
12. The docs show templates in an iframe on a run route outside the docs shell, at phone and desktop widths, following the site's switches.
13. The docs site moves onto AppShell, Sidebar, PageHeader and Breadcrumbs in 11b, keeping its table of contents.
14. 1.0 promises semantic versioning over exports, props, tokens, documented classes and data attributes, the component roots list and `labels` keys.
15. Charts and the editor stay 0.x at 1.0; charts' core peer moves to `^1.0.0`.
16. No new tokens. `--tile-grid-min` and `--font-preview-family` are component custom properties; 12rem, 16rem and 20rem are literals in `layout.css`.
17. New CSS files: `layout.css` (before the components), `preview.css`. Each in `@layer components`, tokens only, unprefixed kebab-case classes, states as data attributes that also match the native pseudo-class where one exists, logical properties, and a forced-colors block where anything is drawn.
18. Preview, Stack, Cluster and TileGrid have no directive; FontPreview starts with `'use client';` and imports nothing from React Aria.

## 15. Testing

- **Core (`css.test.js`, `token-only.test.js`, `contrast.test.js`).** `layout.css` and `preview.css` are tokens only, in `@layer components`, in import order (`layout.css` before the components); `preview.css` has no reserved color and a forced-colors block; the stage declares `contain-intrinsic-inline-size`; the new corner rows join the shared `CLEAR` list. No new contrast pair: the eyebrow and description are slate on canvas and lifted, gated already.
- **React (Vitest, jsdom).** Stack, Cluster, TileGrid: every step and `as`, list resets. Preview: the figure and caption, `inert` by default, `group` with `isInteractive`, `data-theme` and `data-shape`, the warning with no caption. FontPreview: `loading` on the server and first render, `ready` after a `load` that resolves with `check` true, `failed` after a rejection and after a `check` that stays false, a family change resetting and ignoring the stale promise, the escaped family in the custom property, the status's words, `aria-hidden` on the unready sample.
- **Server suites.** All five parts in `server-render.test.tsx`; FontPreview in `server-face.test.tsx` and `hydration.test.tsx`.
- **Templates (`templates.test.ts`).** The rules of section 9.1 over every file; `tsc` over the folder; `next build` of the docs builds every run route.
- **Storybook.** Section 16's stories, baselined in the four theme and shape modes and at 375px, and compact where tagged; FontPreview's plays use a local test font served by Storybook, in three engines, checking that no screenshot shows the fallback face. The concentric audit runs every new story. Baselines change only through `pnpm --filter @snapshot-ui/storybook visual:docker`.
- **Docs e2e.** The Templates pages: the frame loads, the width switch, the site's switches reaching the frame; each run route at 375px and 1280px with no sideways scroll, axe, scripts off, and the focus table of section 9.7; 11b's rail tests rewritten against the library parts.

## 16. Docs, stories and design record

- **Pages.** `layout` (Stack, Cluster, TileGrid; leading with "The rhythm, by name"), `preview` (leading with "A preview must be true", then "Pinning the theme and shape", "Interactive previews" and the font section), `templates/index`, `templates/settings`, `templates/list`, `templates/detail`, and in 11b `versioning`. The `card` page links Preview; `stat-tile` links TileGrid; the theming page links Preview's pinning.
- **Stories:**
  - 11a: `Components/Layout`: `Stack`, `Cluster`, `TileGrid`. `Components/Preview`: `Default`, `InCard` (density), `PinnedDark`, `PinnedSquare`, `Interactive`, `CaptionTop`. `Components/FontPreview`: `Ready`, `Loading`, `Failed`, `Body`. `Pages/SettingsTemplate` (density), `Pages/ListTemplate` (density), `Pages/ListTemplateEmpty`, `Pages/DetailTemplate` (density), `Pages/DetailTemplateNotFound`. `rtl`: `Preview`, `SettingsTemplate`, `ListTemplate`, `DetailTemplate`.
  - 11b: no stories; the docs' e2e carries the shell change.
- **Design record.** Appendix B sections before each part is built: "Layout parts" (the three steps, the three minimums and their reasons), "Preview" (the frame, the stage, the caption, the corner row, the inert rule), "FontPreview" (the loading rule, the weights, the failure words); the "Nested radii, derived" table gains Preview's row; the "Previews" section gains a line pointing to the parts.

## 17. Risks

- **R1. Class collisions.** `.preview`, `.stack` and `.cluster` are common names in apps. Mitigation: `@layer components`, so an app's unlayered CSS wins (parent spec R1); the docs rename their own `.preview`; the getting-started page lists the generic class names the library takes; open question 12 offers prefixed names.
- **R2. A flash of the empty line.** FontPreview starts `loading` on every render, so even a loaded face draws one frame without its sample before the effect turns it `ready`. Mitigation: the effect checks synchronously at mount; the plays measure in three engines whether a frame is painted; if one is, the status words are what shows, which is true, and the docs say so.
- **R3. `document.fonts.check` false positives.** Some engines answer true for a family with no face loaded when no matching `@font-face` exists at all (to verify). Mitigation: with `load`, the part checks after the app's promise; the test font plays cover a family that does not exist.
- **R4. Templates drift from the parts.** A part's change can break a template no one opens. Mitigation: the templates are built and type-checked in CI, their routes run in the docs' e2e, and three page stories baseline them.
- **R5. Templates that teach the wrong thing.** A template is copied more than any docs example. Mitigation: each page states what is sample (`data.ts`) and what is pattern; the server action validates on the server; the owner reviews the three before 11a merges (owner action 1).
- **R6. The iframe harness.** A run route under the docs app shares its root layout and global CSS. Mitigation: the run route has its own route group with a root layout that loads only `@snapshot-ui/core/styles.css`; a test asserts no docs class is in the frame's document.
- **R7. Sample content that names someone.** A template's sample could echo a real company or the first consumer. Mitigation: invented names only, listed in `data.ts`; `templates.test.ts` runs the repo's public check over the folder; no logo resembles a real one.
- **R8. The docs shell change moves every page.** Mitigation: 11b's first task is the migration alone, with the diffs listed in section 10 and every docs e2e passing before the review starts.
- **R9. 1.0 freezes a mistake.** Mitigation: the review's lists go to the owner before the release; 11a's names ship as 0.17.0 first, so a consumer can report trouble for one cycle.
- **R10. The source's preview.** `.local/SOURCE.md` was absent when this was written, so Preview and FontPreview are this spec's reading of the record. Mitigation: 11a's plan reads `styles/primitives/preview.css` and `js/font-preview.js` first and records every difference as a correction for the owner.
- **R11. Persian and the sample.** The default pangram is English and a Persian face has no Latin glyphs in some families. Mitigation: `sample` is the app's string; the right-to-left story passes a Persian sample; the docs say to pass one in the reader's language.

## 18. Open questions

Each has a recommended answer.

1. **The split and the order.** Recommended: 11a Templates, then 11b 1.0. Alternatives: one release; or 11b's docs shell first as a docs-only change.
2. **What Preview is.** Recommended: the record's settings preview, as two parts, the `Preview` frame and `FontPreview`. Alternatives: only the frame, with font loading left to the app; or no part, the record's rule left as guidance.
3. **The class name.** Recommended: `preview`, the parent spec's name, with the docs' own renamed to `docs-preview`. Alternative: `setting-preview`, free of the collision but unlike every other part's name.
4. **An inert stage.** Recommended: inert by default, `isInteractive` to allow use. Alternative: interactive by default, with the app making samples inert.
5. **Pinning the stage.** Recommended: `theme` and `shape` props writing the existing attributes. Alternative: no pinning; the app writes the attributes on its sample.
6. **How FontPreview loads.** Recommended: the app's `load` function; the library never holds a URL. Alternative: a `src` prop with a font file URL, simpler to call but a request the library starts.
7. **Before the face loads.** Recommended: hide the sample, keep its height, say "Loading" in words. Alternative: draw the sample in the fallback with a "Loading" note, which shows something sooner but is the untrue preview the record forbids.
8. **How templates ship.** Recommended: copyable source on the docs site, tested in CI. Alternatives: a templates package; a command-line tool and registry now; folders fetched with `degit`; a downloadable starter app.
9. **Which templates.** Recommended: settings, list and detail, the parent spec's three. Alternatives: add a dashboard home (the recipes cover it) or sign-in pages (owner action 4).
10. **The framework.** Recommended: the Next App Router with server actions, the path the library tests. Alternative: plain React with a router-agnostic data layer, wider but untested end to end.
11. **Layout parts.** Recommended: Stack, Cluster and TileGrid in the library, the docs' classes made public. Alternatives: templates on Tailwind utilities; or a documented `.stack` class with no React part.
12. **Their names.** Recommended: `Stack`, `Cluster`, `TileGrid` (classes `stack`, `cluster`, `tile-grid`). Alternatives: `Stack`, `Row`, `Grid`, closer to the docs' names but `row` and `grid` collide with common CSS; or prefixed `layout-stack` and friends.
13. **The sample app.** Recommended: one invented workspace, "Larkspur" projects, shared by all three. Alternative: three unrelated samples, each simpler alone.
14. **Unsaved changes on navigation.** Recommended: no guard in the template; SaveBar and the chips say what is unsaved, and the docs show an optional guard. Alternative: a `beforeunload` prompt and a router guard in the template.
15. **Template states.** Recommended: loading, empty, no matches, error and not found, each drawn. Alternative: the ready state only, smaller files.
16. **Showing templates.** Recommended: an iframe on a run route, at phone and desktop widths. Alternative: inline on the docs page with the shell's landmarks turned off, which the library parts do not support.
17. **Baselines for templates.** Recommended: three page stories with density, plus two state stories and three right-to-left runs. Alternative: docs e2e screenshots only, outside the baseline pipeline.
18. **The docs shell in 11b.** Recommended: yes, before 1.0, as the parent spec's definition of done says. Alternatives: in 11a; or after 1.0.
19. **What 1.0 promises.** Recommended: semantic versioning over exports, props, tokens, documented classes and data attributes and `labels` keys. Alternative: the JavaScript API only, with CSS classes free to change in minors, which the HTML version could not rely on.
20. **Charts and the editor at 1.0.** Recommended: they stay 0.x outside the fixed group until their phases finish. Alternative: join the fixed group at 1.0.0 now.
21. **When 1.0 ships.** Recommended: at the end of 11b. Alternatives: after phase 6 too; or after the first consumer has run 0.17.0 for one cycle.

## 19. Size budget

Measured as the others, without React, React Aria, Lucide and `@internationalized/date`, to start at:

| Entry | Batch | Budget | Reason |
| --- | --- | --- | --- |
| `{ Stack, Cluster, TileGrid }` | 11a | 0.5 kB | Three elements with data attributes |
| `{ Preview }` | 11a | 0.5 kB | A figure, a stage, a caption and one warning |
| `{ FontPreview }` | 11a | 1 kB | One effect, a stale-promise guard, the escaping, the status |

The templates have no size entry; the plan records each run route's first load JavaScript from `next build` as a reference for the docs. The CSS adds about 1.5 kB to `styles.css` before compression: `layout.css` about 0.5 kB, `preview.css` about 1 kB. 11b adds nothing to the packages. A part over its budget is reported with the number, and the limit follows the rule: the measured entry rounded up to the next 0.5 kB, plus 0.5 kB.

## 20. Baseline estimate

Each visual story is baselined in five modes (Rounded light, Rounded dark, Soft light, Square light, Rounded light at 375px), and a story tagged `density` adds compact, six.

| Batch | Group | Visual stories | Of them with compact | Baselines |
| --- | --- | --- | --- | --- |
| 11a | Layout parts | 3 | 0 | 15 |
| 11a | Preview | 6 | 1 | 31 |
| 11a | FontPreview | 4 | 0 | 20 |
| 11a | Pages (three templates and two states) | 5 | 3 | 28 |
| 11a | Right to left | 4 | 0 | 20 |
| **11a** | | **22** | **4** | **114** |
| 11b | None | 0 | 0 | 0 |
| **All** | | **22** | **4** | **114** |

Existing baselines: none should change in 11a, since the layout parts are new classes and no shipped story uses the docs' `.stack`. The docs have no Storybook baselines, so 11b's shell change shows in the docs' e2e, not here. Any change to an existing baseline is investigated before it is committed, and every new one goes through `pnpm --filter @snapshot-ui/storybook visual:docker`.

## 21. Release

- **Changesets.** 11a, minor for `@snapshot-ui/core` and `@snapshot-ui/react` (fixed group), naming no number: `layout.md` (Stack, Cluster, TileGrid, `layout.css`), `preview.md` (Preview, FontPreview, `preview.css`); a patch for `@snapshot-ui/charts` moving its core peer. 11b: no changeset; it changes only the docs app. The `one-point-oh.md` changeset moves to the final 1.0 batch.
- **Versions,** if nothing else releases between: 11a is 0.17.0; 11b releases nothing; charts is 0.2.x (0.3.0 if phase 6 ships first). Everything stays 0.x until the final 1.0 batch after phase 7.
- **Release notes, short.** 11a: what Preview and FontPreview are for, that a preview never shows the fallback face, the three layout parts and their steps, where the templates are and what to copy, "Upgrade `@snapshot-ui/core` and `@snapshot-ui/react` together". 11b: the promise in five lines, the removed aliases, the browser floor, and that charts and the editor stay 0.x.

## 22. Owner rulings (owner, 2026-10-20)

The owner approved this spec on 2026-10-20 and took every recommendation of section 18, all 21, with one change to the 1.0 timing. Each ruling names the open question it settles.

**1.0. The timing (changes questions 1, 18 and 21).** 1.0 ships after phase 7, not at the end of phase 5. Batch 11b is the docs shell move alone (section 10) and releases nothing, so core and react stay 0.x. The API review, the stability promise (section 11) and the 1.0.0 release move to a final "1.0" batch after phase 7, specified in `docs/specs/2026-10-20-html-design.md`. Every version in this spec is read accordingly: 11a is 0.17.0, 11b has no release, and charts' peer stays a 0.x caret until that batch.

1. **The split and the order** (question 1). 11a Templates, then 11b, with 11b now the docs shell only.
2. **What Preview is** (question 2). The record's settings preview, as two parts: `Preview` and `FontPreview`.
3. **The class name** (question 3). `preview`; the docs' own classes become `docs-preview` and `docs-preview-head`.
4. **An inert stage** (question 4). Inert by default; `isInteractive` allows use.
5. **Pinning the stage** (question 5). `theme` and `shape` props writing the existing attributes.
6. **How FontPreview loads** (question 6). The app's `load` function; the library holds no URL.
7. **Before the face loads** (question 7). The sample hidden at its height, "Loading" in words; never the fallback face.
8. **How templates ship** (question 8). Copyable source on the docs site, tested in CI.
9. **Which templates** (question 9). Settings, list and detail.
10. **The framework** (question 10). The Next App Router with server actions.
11. **Layout parts** (question 11). Stack, Cluster and TileGrid in the library.
12. **Their names** (question 12). `Stack`, `Cluster`, `TileGrid`; classes `stack`, `cluster`, `tile-grid`.
13. **The sample app** (question 13). One invented workspace, "Larkspur" projects.
14. **Unsaved changes on navigation** (question 14). No guard in the template; the docs show an optional one.
15. **Template states** (question 15). Loading, empty, no matches, error and not found.
16. **Showing templates** (question 16). An iframe on a run route outside the docs shell.
17. **Baselines for templates** (question 17). Page stories in Storybook, as section 20.
18. **The docs shell** (question 18). In 11b, as a docs-only batch, before 1.0, which now comes after phase 7.
19. **What 1.0 promises** (question 19). Semantic versioning over exports, props, tokens, documented classes and data attributes, the component roots list and `labels` keys; written and applied in the final 1.0 batch.
20. **Charts and the editor at 1.0** (question 20). Outside the fixed group until their phases finish; the final 1.0 batch decides each package's version (html spec).
21. **When 1.0 ships** (question 21). Changed: after phase 7, in the final 1.0 batch, not at the end of 11b.

## Owner actions

1. Review the three templates, running, before 11a merges: they are the pages most copied.
2. Ask the first consumer to compare its settings, list and detail pages with the templates and report differences.
3. A VoiceOver, NVDA and TalkBack pass over Preview, FontPreview and one template, before 1.0.
4. Decide whether a sign-in template belongs in the library at all, and if so with what sample content.
5. Sign off the 1.0 review's lists before the release pull request merges (now in the final 1.0 batch).
