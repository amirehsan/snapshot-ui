# Settings: PanelLayout, Repeater, ConditionalFields, field extras, ThemeSwitch, AccountMenu and CopyButton: design

Status: approved on 2026-10-19. Written for review the same day; the owner took every recommendation of section 21, all 26 open questions, and the consumer then answered open question 1. Section 24 records the rulings and the consumer's answers, which supersede the sections they name where they differ; everything else is decided here and listed in section 17. The plan is `docs/plans/2026-10-19-settings.md`.
Parent spec: `docs/specs/2026-10-10-snapshot-ui-design.md`. This document takes the phase 5 rows "PanelLayout", "AccountMenu, ThemeSwitch", "ConditionalFields" and "Field extras", and pulls forward the phase 4 row "Repeater". It adds CopyButton, whose design the accounts spec deferred (`docs/specs/2026-10-18-accounts-design.md`, section 5.6), and a fix to NumberField. It answers batch 7 ("Settings") of the first consumer's roadmap. The design authority remains `docs/design-system.md`.
Released before this: batch 6 ("Insights"), `@snapshot-ui/core` and `@snapshot-ui/react` 0.9.0 and `@snapshot-ui/charts` 0.2.0 (`docs/specs/2026-10-18-insights-design.md`, on `feat/insights` at the time of writing), after batch 5 ("Accounts"), 0.8.0 (on `feat/accounts`). `main` is at 0.7.0 (24d426c) as this is written; both batches merge first. This batch is the 0.10.0 minor release of core and react, with a patch to `@snapshot-ui/charts` for its core peer. Section 2 lists what it takes from batches 1 to 6.

## Summary for the owner

What this batch adds, in plain words, in the consumer's order of need:

- **PanelLayout**: a settings page with its sections (Coach, Notifications, Bank sync, Logos, Data, Danger zone) as a list on the left and the open section's form beside it. On a phone the list is the page; a section opens as its own page with a Back link at its top. Every section has its own web address, so a link, a reload or the browser's Back lands on the right section, and the server draws it right before any script runs. When a section opens, the keyboard and the screen reader land on its heading. Cards in a section may pair side by side (a half beside a half, or a third beside two thirds) on a wide screen, the rule the design record already sets.
- **Repeater**: a short list of rows the reader adds and removes, each row the app's own fields: the coach's wait tiers, "up to $50, wait 24 hours", up to six. It handles where the keyboard goes after an add or a remove (never nowhere), says what happened to a screen reader, stops at a minimum and a maximum, names each row's fields for a plain form post, and shows an error on one row or on the whole set.
- **ConditionalFields**: fields that appear when a switch turns on, such as the weekly email's status and test button, or the logo provider and its key. Hidden fields keep what the reader typed, so turning the switch back on brings it back, but they are left out of the form's submission and its checks while hidden, so a hidden field can never block a save with an error nobody can see.
- **Field extras**: a line under a field offering its default ("Default: 24 hours. Reset to default") or a suggested value ("Suggested: $40.00, from your last three months. Use"). Either is an ordinary edit: the field shows Changed and the save bar counts it, and Cancel takes it back.
- **ThemeSwitch and AccountMenu**: the account menu in the rail's foot, with the person's picture and name on its button, holding a Theme submenu (System, Light, Dark) and the app's own items; and an Appearance row in Settings with the same three choices. The app keeps the choice in a cookie; the library draws the choice it is given and reports changes. With the cookie read on the server, the first paint has the right colors with no script at all.
- **CopyButton**: a button that copies a value, an answer or a setup detail, and says "Copied" without moving the reader. The design is the one the accounts batch worked out and deferred.
- **A NumberField fix**: React logs a "flushSync" warning when focus leaves a number field while React is drawing, which a settings page makes common (section 12). Zero is not the cause; the cause is React Aria committing the value on blur inside a forced render. The fix defers that commit by one microtask, which removes the warning and keeps the commit and its announcement.

Why: the consumer's next page is Settings. Most of it is fields the library already has (Switch, Select, NumberField, TextField, SegmentedControl, SaveBar); what it lacks is the page's frame, the repeating tiers, the fields that come and go, the default and suggestion offers, the theme choice and the account menu.

What it does not add: drag to reorder rows (the tiers order themselves by amount), a two thirds card spanning two rows beside two stacked thirds, a library script that sets the theme before paint, a CopyButton that fetches the value it copies, or a guard that stops navigation with unsaved changes (the app's `navigate` does it, and the recipe shows how). Section 21 lists each as a question with a recommendation.

## 1. Goal

Give a settings page its parts: a frame that holds a list of sections beside the open one and turns into a list and a page on a phone, all from the URL and right in the server's HTML; a repeater for a small set of rows; fields that hide and show without losing what was typed; offers of a default and a suggestion that are ordinary edits; a theme choice and the menu it lives in; and a copy button. Ship them as the batch 7 minor release, 0.10.0.

The hard parts. Most are focus: a section that opens, a row that is removed, a field set that hides, an offer that disappears once taken, and a menu that closes all take focus away from where it was, and the design record's rule is that focus never falls to the body. Two are about the server: the split view and the phone's list and page must come from one HTML with no measurement, and the theme must paint right before any script. One is about forms: hidden and repeated fields must submit what the reader sees, under names a server action can read. And one is React's: a library part that moves focus during React's commit makes a NumberField's blur force a render inside it, which section 12 fixes at its source.

Build order, which is also the plan's order and the consumer's order of need:

1. **PanelLayout, PanelNav, PanelNavItem, PanelSection and PanelRow** (section 5).
2. **Repeater** (section 6).
3. **ConditionalFields** (section 7) and **FieldExtras** (section 8).
4. **ThemeSwitch, ThemeMenu, AccountMenu** and Menu's **SubmenuTrigger** (sections 9 and 10).
5. **CopyButton** (section 11).
6. **NumberField's deferred blur commit** (section 12). Small and independent; it may go first if the consumer is blocked by the warning.
7. **The Settings recipe, the guides, the docs header's theme switch and the changesets** (section 19).

Out of scope, each recorded where it is deferred:

- Reordering rows by drag or by buttons: ReorderList and SortableList are phase 4's (open question 7).
- PanelRow's fourth form, a two thirds card spanning two rows beside two stacked thirds (design record, "Page composition, derived"): no consumer page needs it (open question 4).
- A theme script injected by the library, and reading `matchMedia` at render: the app owns the cookie and the first paint (section 9.4, open question 19).
- Copying a value the page does not hold (an asynchronous getter): CopyButton copies a string (open question 21).
- Blocking a client navigation while a section has unsaved changes: the app's `navigate` asks, through RouterProvider (open question 24).
- Autosave. The consumer saves each section through SaveBar.
- Number, date and money formatting, as everywhere: every figure and every offered value is the app's string.

## 2. Depends on

| Part | Where it is now | Used here as |
| --- | --- | --- |
| `AppShell` with its `header` slot as `<main>`'s first child, `--page-sticky-top`, `floating`, `useAppShell().closeDrawer()` | `main` | The page around PanelLayout; the nav sticks under the header (section 5.7) |
| `Sidebar` and its `footer` slot ("the account row at the bottom"), `useSidebar().isCollapsed` | `main` | AccountMenu's place and its collapsed face (section 10) |
| `BottomTabBar` and its More sheet | `main` | The phone's destinations around the list and the page (section 5.7) |
| `SidePanel` and `SidePanelLayout`: focus to the heading on an opening, back to the opener on a close, the sticky aside under `--page-sticky-top` | `main` | PanelLayout's focus model and its sticky nav (section 5.6) |
| `PageHeader`, `PageColumn`, `Breadcrumbs` | `main` (batch 4) | The page's `h1`, "Settings", in the shell's header |
| `Card`, `CardHeader`, `CardTitle`, `CardNote`, `CardBody`, the holder properties | `main` | Sections' cards; the corner rule for a Repeater's and a field extra's controls |
| `CardActions` | `feat/accounts` (0.8.0) | A section card's header actions (Send a test) |
| `DescriptionList` | `feat/accounts` (0.8.0) | The weekly email's status rows; a setup detail with a CopyButton in its `actions` |
| `Prose` | `feat/insights` (0.9.0) | An answer with a CopyButton under it |
| `Menu`, `MenuItem`, `MenuSection`, `MenuSeparator`, `MenuTrigger`; React Aria's `SubmenuTrigger` (not yet exported) | `main` | AccountMenu, ThemeMenu, the submenu (section 10.4) |
| `RadioGroup`, `Radio`, `SegmentedControl`, `SegmentedControlItem` | `main` | ThemeSwitch's two looks |
| `Switch`, `Select`, `TextField`, `NumberField` (money mode), `TextArea` | `main` | The fields a Repeater row, a ConditionalFields group and a field extra hold |
| `Button` (tertiary, danger), `IconButton` (ghost), `Tooltip`, `Avatar` | `main` | Add and Remove, the offers' buttons, CopyButton, the account trigger |
| `Dialog`, `ConfirmDialog`, `useConfirm` | `main` | The danger zone; a navigation away from unsaved changes |
| `SaveBar`, `FieldChanged`, the changed edge and dot, `useChangedDescription` | `main` | Each section's save; the changed state of fields the extras edit (section 8.4) |
| `Link`, `RouterProvider` | `main` | Every section link and Back go through the app's router |
| `useControllableState`, `useHydrated`, `useWarnOnce`, `cx`, `present`, `AccessibleName`, the shared focus clear (`utils/focus-clear.ts`), `focusOn`, `CLEAR_OF_FOOT`, `HOLDER_CORNER` | `main` | As everywhere |
| The docs site's `useCopy` (`apps/docs/lib/use-copy.ts`) and its code copy button | `main` | CopyButton's outcome timing (section 11) |

React Aria parts used for the first time: `SubmenuTrigger`, for the Theme submenu (section 10.4). Nothing else is new. `GridList`, which the parent spec names as Repeater's basis, is not used (section 6.1).

## 3. What the consumer needs

The consumer's requests for this batch, as relayed to this spec, in its order. The consumer answered open question 1 on 2026-10-19: section 24, ruling 2, records its answers, which supersede items 1 to 6 where they differ (eight sections, zero to three tiers, a disabled Add at the maximum, a controlled Repeater, the defaults and the reproduction).

1. **A settings page.** Sections Coach, Notifications, Bank sync, Logos, Data and Danger zone, a list on the left and the form beside it. On a phone, the list first; a section opens as its own page with Back. URL-driven and server-renderable; links, not state. Focus moves to the heading on a section change. It must sit inside AppShell, with its header and its BottomTabBar.
2. **Wait tiers.** Rows of "up to $amount, wait N hours", each a money NumberField and a Select, added and removed, at most 6, with a row-level error.
3. **Fields that appear.** A weekly email Switch reveals its status and a "Send a test" button; a logo Switch reveals the provider (a Select) and its key (a TextField). Hidden fields become inert. Coach fields offer "Reset to default", and perhaps a suggested value.
4. **Theme.** The shell's account menu with a theme submenu, and a Settings "Appearance" row: System, Light, Dark. The choice is kept in a cookie, so the parts are controlled (`value`, `onChange`). The avatar and the name are in the menu's trigger. No flash of the wrong theme on load.
5. **Copy.** Copy an answer; copy setup details.
6. **A warning.** NumberField logs React's flushSync warning "when 0 is committed".

Its rules for every part, unchanged from batch 6: `'use client'` only on interactive parts; no `Intl` formatting and no `window` at render, and no first-paint measurement; no external request and no injected script; light and dark, all three shapes, right to left (the Persian guide), comfortable and compact density; WCAG 2.2 AA including 2.5.8; navigation through `RouterProvider`; everything exported from the package index, with the CSS in `core/styles.css`.

## 4. Approach

**The URL is the state.** Which section is open is the address, not a value in React: `/settings` is the list and `/settings/coach` is Coach. The layout is told which view it draws and which section is open, and it draws both faces in one HTML, one shown and one hidden by a container query on its own width. So the server's HTML is right on a phone and on a desktop, a reload keeps the place, and the browser's Back works with no code of ours (section 5.4).

**Focus goes to a named place, outside React's commit.** Every part here that removes or hides what holds focus moves focus first to a place the reader can name: a section's heading, the link of the section just left, the next row's first field, the Add button, the gate of a hidden group, the field an offer just set, the menu's trigger. And every such move runs after React has finished drawing (a frame, as the accounts recipe moves focus to Edit), never in a layout effect, because a move during the commit makes a focused NumberField force a render inside React's (section 12).

**Forms submit what the reader sees.** A hidden group is out of the submission and out of the browser's checks, though it keeps its values for when it shows again; a repeater's rows submit in the order they are drawn, under names a server action reads with `getAll`. A default or a suggestion is never applied by itself: it is an edit the reader makes, which the field's Changed chip and the SaveBar count.

**Compose the parts that exist.** The settings row is SegmentedControl; the menu's radio items are Menu's own selection; the account trigger draws an Avatar; CopyButton is an IconButton with a Tooltip; field extras put a tertiary Button under any field. No field changes its API.

**Static where nothing moves.** PanelRow and PanelSection are server parts. PanelLayout, PanelNav and the rest are client parts because they move focus or press, and each renders its whole face on the server.

| Part | In the server's HTML | After hydration |
| --- | --- | --- |
| PanelLayout, PanelNav, PanelNavItem | Both faces: the nav, the open section, the Back link, each shown or hidden by CSS from the view; `aria-current` on the open section's link | Focus moves on a section change (section 5.6) |
| PanelSection, PanelRow | Everything | Nothing changes |
| Repeater | Every row, its fields, its Remove, Add with its count, the set's error, an empty status host | Add and Remove, focus and the status (section 6.4) |
| ConditionalFields | The group, shown or hidden from its prop, with `hidden`, `inert` and `disabled` when hidden | Focus out of a group that hides (section 7.3) |
| FieldExtras | The field, the offer line and its button, or nothing when nothing is offered | Focus to the field after an offer is taken |
| ThemeSwitch | The SegmentedControl with the given choice | Choosing reports through `onChange` |
| ThemeMenu, AccountMenu | The trigger with the avatar and the name; the menu is not in the HTML until opened | The menu, the submenu, the choice |
| CopyButton | The button and an empty status host | Copying, the glyph, the status |

Rejected along the way:

- **A tabs widget for the sections** (`role="tablist"`). Tabs switch panels in place and have no addresses; the consumer asks for links, a reload must keep the section, and the phone's list is not a tab row. GitHub, Polaris and Linear use links.
- **A viewport media query for the split.** The layout beside an expanded rail at 1024px has less room than at 1024px beside a folded one; its own width decides, as DescriptionList's does.
- **Measuring the viewport to redirect `/settings` to the first section on a desktop.** The server cannot know the width, and a client redirect flashes the list first (section 5.4).
- **GridList for Repeater.** A grid's arrow keys fight a text field's caret, and editable cells need the grid pattern's edit mode; a short form of fieldsets is read and filled with Tab alone (section 6.1).
- **Clearing hidden fields.** The parent spec's carried behavior: "Conditional fields are made `inert` when hidden, never cleared or disabled" (section 6.3 of the parent spec, reconciled in section 7.4).
- **A `reset` prop on every field.** Ten fields would each grow the same three props; a wrapper serves them all (section 8).
- **A theme script in the library.** The consumer forbids injected scripts, and a cookie the server reads needs none (section 9.4).

## 5. PanelLayout

### 5.1 Reconciling the parent spec's PanelLayout

The parent spec's row reads "Side and main columns. Full, half, third and two-thirds cards that only ever pair." It is two things, and the consumer's page needs the first:

- **Side and main columns** are the frame: a list of sections in a side column beside the open section in the main one. That is `PanelLayout` with `PanelNav` in its side column and a `PanelSection` in its main column, and on a phone the two columns become a list and a page (section 5.7).
- **Cards that only ever pair** are the main column's own grid, the rule of the design record's "Page composition, derived": a card takes all of the column, half of it, or a third beside two thirds, and widths only ever pair. That is `PanelRow`, which holds exactly two cards (section 5.8). A full card is a plain Card in the section.

The record's rule engages the pairs "at 1440px". The library cannot read the viewport for it, so a row pairs by its own width, at the width that rule gives the page column beside an expanded rail at 1440px (section 5.8). Beside a section list that width is reached only on a wide monitor, which is the record's point: cards are for scanning, fields are for filling, and a settings form is one column of fields.

### 5.2 Anatomy

```
Split face (the layout 48rem or wider of its own box):

Settings                                             <- PageHeader, h1, in the shell's header
+---------------+  Coach                             <- PanelSection, h2, focus lands here
| Coach      (*)|  How the coach waits before a charge.
| Notifications |  +--------------------------------------+
| Bank sync  On |  | Wait tiers                           |
| Logos         |  | ...                                  |
| Data          |  +--------------------------------------+
| Danger zone   |  [SaveBar]
+---------------+

List face, index view (under 48rem):      List face, section view:

Settings                                   Settings
Coach                              >       < Settings                <- Back, a link to /settings
How the coach waits                        Coach                     <- h2, focus lands here
Notifications                      >       How the coach waits...
Bank sync                     On   >       [cards]
...                                        [SaveBar]
```

### 5.3 API

```ts
export type PanelLayoutView = 'index' | 'section';

export interface PanelLayoutProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  /** The section list: a PanelNav. */
  nav: ReactNode;
  /**
   * The open section, a PanelSection. In the index view, what the split face shows beside the list (the default
   * section, section 5.4); the list face does not show it.
   */
  children?: ReactNode;
  /** `index` at the list's own address, `section` at a section's. Read from the URL by the app. */
  view: PanelLayoutView;
  /** The open section's key, from the URL. A change after hydration moves focus (section 5.6). */
  sectionKey?: Key;
  /** Where the list face's Back goes: the index's address, "/settings". Through RouterProvider. */
  backHref: string;
  /** Back's text: the index's name, "Settings". It is the link's whole name. */
  backLabel: string;
  ref?: Ref<HTMLDivElement>;
}

export type PanelNavProps = Omit<HTMLAttributes<HTMLElement>, 'aria-label' | 'aria-labelledby'> &
  AriaName & {
    /** PanelNavItem elements, in order. */
    children: ReactNode;
    ref?: Ref<HTMLElement>;
  };

export interface PanelNavItemProps extends Omit<LinkProps, 'children'> {
  /** The section's address. Required: a section is a page. */
  href: string;
  /** The section's name: "Bank sync". */
  children: ReactNode;
  /** A line under the name on the list face: "Connected accounts and how often they sync". */
  description?: ReactNode;
  /** A short state at the end, on both faces: "On", "2 connected". Text, never a color. */
  end?: ReactNode;
  /** A 16px icon at the start, hidden from assistive technology. */
  icon?: ReactNode;
  /** This section is open: `aria-current="page"` and the ink pill. */
  isCurrent?: boolean;
  /**
   * This section is what the index shows on the split face: drawn as current there and only there, and never
   * `aria-current`, since on a phone the index shows the list and no section (section 5.4).
   */
  isDefault?: boolean;
}

export interface PanelSectionProps extends Omit<HTMLAttributes<HTMLElement>, 'title'> {
  /** The section's name, its heading: "Coach". Focus lands on it when the section opens. */
  title: ReactNode;
  /** A sentence under the heading, in slate. */
  description?: ReactNode;
  /** The heading's level under the page's `h1`. @default 2 */
  headingLevel?: 2 | 3;
  children: ReactNode;
  ref?: Ref<HTMLElement>;
}

export type PanelRowLayout = 'halves' | 'third-two-thirds' | 'two-thirds-third';

export interface PanelRowProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  /** Which pair. A full card is a Card outside any row. */
  layout: PanelRowLayout;
  /** Exactly two cards: widths only ever pair. */
  children: readonly [ReactNode, ReactNode];
  ref?: Ref<HTMLDivElement>;
}
```

`PanelNavItem` is a link drawn by React Aria's `Link` through the library's `Link`, so it navigates through `RouterProvider`. `PanelSection` and `PanelRow` are static.

### 5.4 The routing model

- **One address per section.** The app's routes are `/settings` (the index) and `/settings/[section]`. In the Next App Router, `app/settings/layout.tsx` renders the shell's PageHeader ("Settings") and a client wrapper that reads the open segment with `useSelectedLayoutSegment()` and renders `PanelLayout` with `view` and `sectionKey` from it; each `page.tsx` renders one `PanelSection`. A Next layout persists across its pages, so the nav is not redrawn and its scroll is kept. An app on another router passes the same two props from its own.
- **Links, not state.** Every section in the nav is a `PanelNavItem` with an `href`; the current one is the app's, from the URL, as `isCurrent`. Back on the list face is a link to `backHref`. Nothing in the layout holds which section is open.
- **The index on a desktop** (open question 2). The server cannot know the width, so `/settings` serves one HTML to both: the list face shows only the list; the split face shows the list beside a default section, which the app passes as `children` and marks in the nav with `isDefault`. It draws as current only on the split face (a CSS rule inside the split query), and no link is `aria-current`, since on a phone the index is the list and no section is open. This is what the iPad's Settings and macOS System Settings do, opening on a section (to verify for the current releases), and what Shopify's admin settings do on a desktop (to verify). The alternatives: an overview in the main column (Polaris' annotated sections as a page of links), which repeats the list beside itself; or a redirect from `/settings` to the first section, which on a phone skips the list the consumer asked for.
- **Server-renderable.** The view, the open section, `aria-current` and both faces are in the server's HTML; a container query picks the face; nothing is measured and nothing is read from `window`. A phone that loads `/settings/coach` paints Coach with Back; a desktop that loads it paints the list with Coach beside it.
- **Unsaved changes.** A section with a dirty SaveBar warns before the page unloads already; a client navigation does not unload. Every section link goes through `RouterProvider`, so the app's `navigate` can ask first with `useConfirm` while dirty, and the recipe shows it (open question 24).

### 5.5 Behavior

- **Markup.** `div.panel-layout[data-view]` is the size container (`container: panel-layout / inline-size`, `contain-intrinsic-inline-size: 0`, the library's ruling). It holds `div.panel-layout-frame`, the grid, since a container query cannot style its own container (accounts plan, correction 8). The frame holds `div.panel-layout-side` with the nav and `div.panel-layout-main` with `a.panel-layout-back` and the children.
- **The faces.** From 48rem of the layout's box (`@container panel-layout (inline-size >= 48rem)`) the frame is `16rem minmax(0, 1fr)` with a peer step between, the side and the main column side by side, and the Back link is `display: none`. Under 48rem the frame is one column: in the index view the main column is `display: none`; in the section view the side column is `display: none` and Back shows. `display: none` takes the hidden face out of the tab order and the accessibility tree, so nothing is read twice. 48rem is chosen so the main column keeps 30rem beside a 16rem nav and its gap, enough for a field and its Changed chip; 16rem holds "Notifications" and an end state at 16px, weight 500.
- **The nav.** `nav.panel-nav`, named by the app ("Settings"), a second navigation landmark after the rail's, holding a `ul` of `li.panel-nav-item` links. On the split face it is sticky a peer step under `--page-sticky-top` (SidePanel's rule), as tall as the room under the header allows, and scrolls itself when longer.
- **The open section.** `section.panel-section` named by its heading through `aria-labelledby`, so it is a region landmark; the heading `h2.panel-section-heading` takes `tabIndex={-1}` and draws no ring when focused by script, as `<main>` does; the description is a paragraph under it.
- **Back** is `PanelLayout`'s, not the section's, so every section has it without writing it: a Link with a 16px chevron that points back (mirrored in right to left), the `backLabel` text, 40px tall, at the main column's top. Its name is `backLabel` alone, "Settings": the chevron is hidden, and a "Back to" prefix would be a word the app has not written.

### 5.6 Focus

- **On a section change** (decided here, item 5; the consumer's ask). After hydration, when `sectionKey` changes, the open PanelSection's heading takes focus, on both faces. On the list face it is necessary, since the list that held focus has gone; on the split face it keeps one rule (open question 3). It moves only when focus was in the layout (the nav, Back, or the old section), or on the body, or on nothing that is still in the page: a navigation the reader started elsewhere, from the rail or the command palette, keeps its own focus. The heading's focus scrolls it into view, and the shared focus clear keeps it under the sticky header.
- **Back to the index.** When `view` turns to `index`, on the list face the link of the section just left takes focus (the layout remembers the last `sectionKey`), else the nav's first link; on the split face the default section's heading does. The browser's Back and Forward change the URL, so they follow the same rules.
- **First render.** Nothing moves on the server's render or on hydration: a page loaded at `/settings/coach` leaves focus where the browser put it, as a SidePanel hydrated open moves nothing.
- **Which face.** Read when focus moves, after the commit (whether the side column has a box, `getClientRects().length > 0`, since `checkVisibility()` is above Safari 16.4), never for the first paint.
- **When.** The move runs in a frame after the commit, not in a layout effect, so a NumberField that held focus in the section just left never commits inside React's render (section 12).
- **A layout mounted after hydration**, as a route that renders `PanelLayout` per page does, counts as a change when it mounts with a `sectionKey` and the layout before it had another.

### 5.7 The phone: the list, the page, the shell

- **The shell's header** holds the page's `h1`, "Settings", on both views and both faces; it is the PageHeader the app renders in AppShell's `header` slot. The section's name is the section's `h2`. On the list face's section view the reader sees "Settings" stuck at the top, then "< Settings", then "Coach": the first is the page, the second the way back, the third the place. An app that wants iOS's single title (the section's name as the page's title) renders PageHeader with the section's title and drops Back in its own trail; the docs show it and recommend the default.
- **The tab bar** stays. Settings is one destination (a tab, or a row of the More sheet); its tab or More stays current across the index and every section, which is the app's `aria-current` on the bar.
- **The SaveBar** of a section is the section's last child and sits above the tab bar by the shell's `--app-shell-inset-block-end`, as on any page.
- **Scroll.** Opening a section focuses its heading, which brings the top of the section into view; Back focuses the link left, which brings it into view in the list. The recipe's `navigate` passes `scroll: false` as every recipe does, and the focus does the scrolling.
- **The drawer** is not involved: on a phone the rail is a drawer, the settings list is in the page.

### 5.8 Card pairs: PanelRow

- **The rule** (design record, "Page composition, derived"). A row holds exactly two cards: two halves, or a third and two thirds in either order. The types take a tuple of two; three or one is a type error. A full card is a Card outside a row. Which width a card takes is the record's test: one column of fields is a half, two or more columns full, and a third only holds a small choice that decides what the two thirds card beside it holds.
- **When a row pairs.** From 66rem of the row's own box (`@container panel-row (inline-size >= 66rem)`), the width a page column has beside an expanded rail at a 1440px viewport (1440 - 320 - 2 x 32 = 1056px), the record's entry point; under it the two cards stack in source order. A half is then `minmax(0, 1fr) minmax(0, 1fr)`, a third and two thirds `minmax(0, 1fr) minmax(0, 2fr)`, a peer step apart. Beside a 16rem settings nav the main column reaches 66rem at a viewport of about 1720px, so on most screens a settings section is one column of cards, which the record wants for forms.
- **Heights.** `align-items: start`: cards in a row keep their own heights (the record: "not stretch").
- **Static**, no hooks. Its intrinsic inline size is 0; a row in a holder sized to its content needs a width, as a DescriptionList does.

### 5.9 Keyboard and screen readers

| Key | Does |
| --- | --- |
| Tab, Shift+Tab | Through the nav's links, then the open section, in reading order. Back comes first on the list face's section view. |
| Enter | On a link, opens its section; focus goes to the section's heading. |

- **APG.** The nav is a navigation landmark with plain links (no menu role, no tabs), the disclosure navigation menu's advice for site navigation without submenus; `aria-current="page"` marks the open section. The section is a region named by its heading. Moving focus to the new content's heading after a client-side route change is what user testing of single-page routing has recommended (the 2019 Gatsby study, to verify its conclusion), and what a whole page load gives a screen reader in effect; GitHub's settings load whole pages (to verify).
- **Names.** Each link's name is its section name; `description` and `end` describe it (React Aria's `aria-describedby` from the link to their ids), so "Bank sync, link, current page, On, Connected accounts..." is read in that order. The end state is words, never a dot.
- **On the list face's index** a screen reader hears the nav and no current item, which is true.

### 5.10 Look and CSS

- **Split face rows.** Sidebar's item: 40px (`--size-control`), 16px icon, `--text-action` label at 500, a 5% ink wash on hover, the current link an ink pill with canvas text, its icon and end state in canvas, and the focus ring inverting to canvas on the pill. The description is not drawn on the split face (16rem holds names, not sentences); the end state is `--text-small` in slate, ink-inverted on the pill. The row's corner is `min(var(--radius-pill), max(0px, calc(var(--holder-radius, var(--radius-pill)) - var(--holder-border, 0px) - var(--holder-pad, 0px))))`: a pill on the canvas, and concentric with a Card's corner when an app puts the nav in one (the concentric rule).
- **List face rows.** Each row is at least 48px (`--size-field`, 36px compact, 44px compact on a coarse pointer, the field rule) and holds the icon, the name at 16px weight 500 in ink, the description under it at 14px in slate, the end state and a 16px chevron in slate at the inline end. Rows are separated by 1px `--color-divider` rules, none above the first or under the last. No row is drawn current on the list face: a phone's list is a menu of pages, not a place.
- **Default current.** `[data-default]` draws the current pill inside the split query only.
- **Back.** A tertiary Button's look as a link: 40px tall, the chevron and `backLabel` at `--text-action`, ink. It moves down out of a card's corner if an app puts the section in one, by the record's rule; in the default page it is on the canvas.
- **Section.** The heading at the h3 step (`--text-h3`, 24px, weight 500, -2%), a part step to the description at the small step in slate, and a peer step to the first card. Cards inside are a peer step apart.
- **Contrast.** Ink and slate on the canvas and on lifted, canvas on ink: all gated already as text. The divider is a cue, as DescriptionList's is.
- **Forced colors.** The current pill is `highlight` with `highlighttext` for the label, icon, end state and chevron, as Menu's chosen row is; the rules are borders in `canvastext`; the focus ring stays.
- **Right to left.** Logical properties: the nav is on the right, the chevrons point left on the list face and Back's chevron points right, by `scale: -1 1` under `:where([dir='rtl' i])`, the charts' direction pattern. An end state in Latin digits keeps its order by the numeral rule.
- **Density and coarse pointers.** The split face's rows follow `--size-control` (36px compact, 44px compact on a coarse pointer); every target is at least 40px in comfortable and 36px compact, hit at 40px through the row's own height or a `::before` as Sidebar's items are. Compact pads cards 20px, as everywhere.
- **Motion.** None: a section change is a page.
- **Print.** The side column and Back are hidden; the section prints.

### 5.11 Server rendering

`PanelLayout`, `PanelNav` and `PanelNavItem` are client parts (they press, and the layout moves focus), each rendering its whole face on the server; `PanelSection` and `PanelRow` are static and join the server-components suite. Nothing reads `window` or measures at render; the faces are container queries; `useId` names the section by its heading. The hydration suite renders an index and a section view under `en-US`, `de-DE` and `fa-IR` in UTC and Asia/Tehran.

### 5.12 How others do it

| System | Frame | Phone | Addresses | Focus on change | What this spec takes |
| --- | --- | --- | --- | --- | --- |
| Shopify Polaris | `Layout.AnnotatedSection`: each group's title and description in a narrow column beside its card; the admin's settings have a left nav of sections (to verify for the current admin) | Annotations stack above their cards | A page per settings area | A page load | The section's description under its heading; a page per section |
| GitHub settings | A left nav list of grouped links beside the form; "Danger Zone" a separate red-edged box at the foot of repository settings | The nav stacks above the content (to verify) | `/settings/profile` and so on | A whole page load | The links, a page per section, the danger zone as its own section; not the red box (section 19, open question 25) |
| Linear settings | Settings replace the app's sidebar with their own list of sections; changes save as made (to verify) | A list, then a page | A route per section | Not observed | The list beside the form; not autosave |
| Atlassian | Product settings in a left side navigation of links, with a page per item | The navigation collapses to a menu | A route per item | Not observed | Plain links in a named navigation |
| macOS System Settings | A searchable sidebar of sections beside the open pane, which opens on a section (to verify which) | Not applicable | Not URL-based | The pane changes; focus stays in the sidebar | The split face and a default section for the index |
| iOS Settings | A grouped list of rows with icons, values and chevrons; a row pushes a page whose back button bears the list's title; iPad shows the two side by side | The list, then a page with "< Settings" | Not URL-based | VoiceOver moves to the new page's first element | The list face: rows with a value and a chevron, Back named by the list's title, the split on wide screens |

## 6. Repeater

### 6.1 What it is, and why not a grid

A Repeater is a fieldset of rows, each row a fieldset of the app's own fields, with Remove on each row and Add after the last. The parent spec named GridList as its basis; this spec does not use it:

- A grid's arrow keys move between cells, and in a cell holding a text field they fight the caret; the APG grid pattern answers that with an edit mode (Enter to edit, Escape to leave), which makes six small rows of a form harder to fill than six rows of fields read with Tab.
- GOV.UK's "add another" pattern and the MOJ Design System's "Add another" component (to verify the latter's details) are fieldsets with a legend per item and plain buttons, which every screen reader reads as a form.
- Reordering, the reason a list widget would earn its keys, is not needed here (section 6.6).

### 6.2 API

```ts
export interface RepeaterRow {
  /** Stable across adds, removes and saves: the app's id, or one made when the row was added. */
  id: Key;
}

export interface RepeaterRowRender {
  /** The row's place, from 0, as drawn now. */
  index: number;
  /** The row's legend as drawn: `rowLabel(index)`. */
  label: string;
  /** The row's error, from `rowErrors`, so its fields can mark themselves invalid. */
  error: ReactNode | undefined;
}

export interface RepeaterLabels {
  /** Add's text. @default 'Add a row' */
  add: string;
  /** Remove's visible text; its name adds the row's legend: "Remove, Tier 2". @default 'Remove' */
  remove: string;
  /** Add's count, read with it: "3 of 6". @default (count, max) => `${count} of ${max}` */
  count: (count: number, max: number) => string;
  /** In place of Add at the maximum. @default (max) => `${max} of ${max}. Remove one to add another.` */
  full: (max: number) => string;
  /** Said politely after an add. @default (label) => `${label} added` */
  added: (label: string) => string;
  /** Said politely after a remove. @default (label) => `${label} removed` */
  removed: (label: string) => string;
}

export type RepeaterBaseProps<T extends RepeaterRow> = Omit<
  HTMLAttributes<HTMLFieldSetElement>,
  'children' | 'onChange' | 'aria-label' | 'aria-labelledby'
> & {
  /** The set's legend: "Wait tiers". */
  label?: ReactNode;
  /** A hint under the legend. */
  description?: ReactNode;
  /** The rows, in order. Controlled: the app holds them. */
  rows: readonly T[];
  /** Draws one row's fields. */
  children: (row: T, render: RepeaterRowRender) => ReactNode;
  /** Each row's legend, from its place: (index) => `Tier ${index + 1}`. */
  rowLabel: (index: number) => string;
  /** Called by Add; the app appends a row. */
  onAdd: () => void;
  /** Called by a row's Remove with its id; the app removes it. */
  onRemove: (id: Key) => void;
  /** Rows that cannot be removed below. @default 0 */
  minRows?: number;
  /** Rows Add stops at. Required: a repeater is a short list. */
  maxRows: number;
  /** An error about the whole set: "Each tier must be higher than the one above it". */
  errorMessage?: ReactNode;
  /** Errors by row id, drawn under the row's fields. */
  rowErrors?: Readonly<Record<string, ReactNode>>;
  /** Whether the set differs from the saved one: the Changed chip beside the legend. */
  isChanged?: boolean;
  changedLabel?: string;
  /** Adds and removes are refused; the fields are the app's to disable. */
  isDisabled?: boolean;
  labels?: Partial<RepeaterLabels>;
  ref?: Ref<HTMLFieldSetElement>;
};

export type RepeaterProps<T extends RepeaterRow> = RepeaterBaseProps<T> & AccessibleName<'label'>;
```

The consumer's tiers: `rows` of `{ id, amount, hours }`, `rowLabel={(i) => \`Tier ${i + 1}\`}`, `maxRows={6}`, `minRows={1}`, and in each row a money `NumberField` ("Up to") and a `Select` ("Wait").

### 6.3 Behavior

- **Markup.** `fieldset.repeater` with `legend.repeater-legend` (the label and the Changed chip), the hint and the set's error under it, then `ol.repeater-rows` of `li.repeater-row`, each holding `fieldset.repeater-row-set` with `legend.repeater-row-legend` (`rowLabel(index)`), `div.repeater-row-fields` (the app's fields), the row's error line and `div.repeater-row-end` with Remove; then `div.repeater-foot` with Add and its count, or the full line; then `div.repeater-status[role="status"][aria-live="polite"]`, mounted empty in the server's HTML. An ordered list, since a tier's place is its meaning.
- **Controlled only.** The rows are the app's state (a form library's field array, or `useState`); Add and Remove call back and the app changes `rows`. A row's identity is its `id`, so a removed row's fields unmount and the rows after it keep theirs, React's `key`.
- **Row legends follow places.** Rows renumber after a remove ("Tier 3" becomes "Tier 2"), because the legend is a place; the status says which was removed by its old legend.
- **Remove** is a tertiary Button, visible text `labels.remove`, named "Remove, Tier 2" by a visually hidden comma and legend after the word (GOV.UK's hidden text, the DescriptionList actions' way; 2.5.3 holds since the name starts with the visible word). It asks nothing: the set is unsaved until the SaveBar saves it, and Cancel brings the row back.
- **Add** is a secondary Button with a Plus icon and `labels.add`, its count `labels.count(rows.length, maxRows)` in slate after it as its description, the parent spec's "Add shows n of N".
- **Disabled.** With `isDisabled`, Add and Remove are disabled; the fields are the app's.
- **Not a client of the fields.** The Repeater never reads or writes a field's value; it draws the app's nodes in each row.

### 6.4 Focus and announcements

Decided here, item 10; the standing rule that focus never falls to the body.

| After | Focus goes to | The status says |
| --- | --- | --- |
| Add | The new row's first focusable field | `labels.added(rowLabel(newIndex))`, "Tier 4 added" |
| Remove, a row with rows after it | The first focusable field of the row now in its place | `labels.removed(oldLabel)`, "Tier 2 removed" |
| Remove, the last row | The first focusable field of the new last row | "Tier 4 removed" |
| Remove, the only row (with `minRows` 0) | Add | "Tier 1 removed" |
| Add that reaches `maxRows` | The new row's first field, as any add; Add is then replaced by the full line | "Tier 6 added" |

- **Why the next row and not Remove.** Focus on the next row's Remove would let a held Enter remove row after row; focus on its first field puts the reader where the work is. The status says what left, since the row focus lands in has taken the removed one's legend.
- **Why a status as well as focus.** A screen reader entering the new row reads its legend ("Tier 4, group, Up to, edit text") in NVDA and JAWS; VoiceOver does not always read a fieldset's legend on a focus moved by script (to verify). The status says the add once, politely, and is in the page from the server's first render, so it is listening before the words arrive. It never sits inside an `aria-busy` subtree (the design record's rule): a form that sets `aria-busy` while saving sets it on its fields' container, not on the Repeater's root, and the docs say so; a development warning names a Repeater whose status has an `aria-busy="true"` ancestor when it speaks.
- **When.** Focus moves in a frame after the commit that drew the new rows, found by the row's id (`[data-row-id]`) and its first element that is focusable and not inert, never in a layout effect (section 12).
- **The first focusable field** is the row's first `input`, `select`, `textarea` or `button` not disabled, in DOM order: a money NumberField's text box, not its sign button, since the sign button comes first only with `allowsNegative`; an app that wants another passes `data-autofocus` on it.

### 6.5 Minimum and maximum

- **At `minRows`**, each row's Remove is not drawn, so nothing invites a press that cannot work; the rows keep their layout, since the end column keeps its width (GOV.UK's first item has no Remove, to verify).
- **At `maxRows`**, Add is replaced by `labels.full(maxRows)` in slate, "6 of 6. Remove one to add another." A disabled Add would leave the tab order in React Aria and say less; focus is never on Add at that moment, since the add that reached the maximum moved focus to its new row (section 6.4), and the line is in the reading order where Add was.
- **Rows passed above `maxRows`** (data saved before a limit changed) are all drawn, Add shows the full line, and nothing is cut: a static check of the app's data is the app's.

### 6.6 Reorder

Not needed (open question 7). A wait tier is "up to an amount", so the tiers' order is their amounts' order; the app sorts them when it saves, and the page drawn after the save shows them sorted. Sorting while the reader types would move a row under the caret. A row out of order before the save is a row-level error the app sets ("Must be more than Tier 1's $50.00"). Reordering by hand is ReorderList's (phase 4), with buttons and drag.

### 6.7 Form submission names

The library writes no names; the app names each row's fields. Two ways, both documented, with the recipe on the first (decided here, item 12; open question 10):

- **Repeated names.** Every row's amount is `name="tierAmount"` and every row's wait `name="tierHours"`. `FormData.getAll('tierAmount')` returns them in DOM order, which is the rows' order, so a server action zips them by index. No index in a name can go stale after a remove. A money NumberField writes minor units in its own hidden input, which `getAll` reads like any other.
- **Indexed names.** `name={\`tiers.${index}.amount\`}` for a form library's field array (React Hook Form's `useFieldArray`), from the `index` the render function passes.

### 6.8 Validation

- **A field's own error** is the field's: a required amount, a value out of range, through its `errorMessage` or `validate`, under the field.
- **A row's error** (`rowErrors[id]`) is a line in the error color under the row's fields, `p.repeater-row-error`, named in the row fieldset's `aria-describedby`, so it is read on entering the row (to verify in VoiceOver), and given to the render function as `error` so the app can mark the row's fields invalid with `isInvalid`. "Must be more than Tier 1's $50.00" is the consumer's case.
- **The set's error** (`errorMessage`) is a line in the error color under the legend, before the rows, named in the set's `aria-describedby`: "Add at least one tier", "Tiers must go up by amount".
- **On a failed save** focus goes to the first invalid field in the form, which is the SaveBar's app's job; a row error with no invalid field leaves focus on the row's first field.
- **Error, never clay or signal.** A row with an error has the error edge on its invalid fields and the error line, never a colored row; the Changed chip beside the legend steps aside while the set's error shows, the field rule "invalid outranks changed".

### 6.9 Keyboard and screen readers

| Key | Does |
| --- | --- |
| Tab, Shift+Tab | Through each row's fields and its Remove, row by row, then Add. |
| Enter, Space | On Remove, removes the row; on Add, adds one. |

- **APG.** No composite pattern: fieldsets, legends and buttons, so the form is read in browse mode and filled with Tab. Each row's fields keep their visible labels ("Up to", "Wait"); the row's legend gives them context, "Tier 2, group, Up to".
- **Names.** Remove: "Remove, Tier 2". Add: "Add a tier", described by "3 of 6".

### 6.10 Look and CSS

- **The set** is a field: the legend at the h4 step (14px, 700, ink) with the Changed chip, the hint at the small step in slate, the error line in the error color, a part step apart, as Field parts draw them. The fieldset's own border, padding, margin and `min-inline-size: min-content` are reset (a fieldset's minimum width is its content's, which would push a 320px page sideways).
- **Rows** are separated by 1px `--color-divider` rules, a peer step of padding above and under each, none above the first or under the last. The row legend is `--text-small` at 500 in slate, a part step above the fields: a place, read before its fields, as a DescriptionList term is.
- **The row's fields** are `div.repeater-row-fields`, a size container: from 30rem of its box a wrapping row of the app's fields a peer step apart, each `flex: 1 1 12rem`, and under it one column. Remove sits in `div.repeater-row-end` at the row's inline end, level with the fields' controls (its block start offset by the label row's height, `calc(1lh + var(--spacing-part))` of the small step's line, so the 40px button centres on a 48px field), and under 30rem after the last field.
- **Add** is a secondary Button with a Plus icon, a peer step under the last row; the count beside it in slate.
- **The concentric rule.** A Repeater that ends a card puts Add at the card's bottom start corner: it is a control at a card's foot, so it moves down by the corner inset (`calc(var(--holder-corner-inset) - var(--holder-pad))`, 7px in Rounded, 19px compact, 0 in Soft and Square), the rule DescriptionList's last row follows, through `:is(.card, .card > .card-body:last-child, .card > .card-disclosure > .card-fold > .card-body:last-child) > .repeater:last-child > .repeater-foot`. Remove in the first row of a repeater that starts a card with no header moves down by the same. The concentric audit runs every story in three shapes.
- **Contrast.** Ink, slate and the error color on lifted and the canvas: gated already as text. Nothing new.
- **Forced colors.** The rules are borders in `canvastext`; the error line is text in the reader's colors with its words; buttons are Button's.
- **Right to left.** Logical properties; the rows read from the right, Remove at the left. A money field keeps its figure left to right by NumberField's rule.
- **Density and coarse pointers.** Fields and buttons follow `--size-field` and `--size-control`; row padding stays a peer step; compact cards pad 20px.
- **Motion.** None: a row appears and leaves at once. An eased height would need a measurement or `interpolate-size`, above the browser floor.

### 6.11 Server rendering

A client part (it presses and moves focus), rendering every row, its legend, fields, errors and Remove, Add or the full line, and the empty status in the server's HTML. Without scripts Add and Remove are `type="button"` and do nothing; a no-script add-another (GOV.UK's, posting the form to add a row) is out of scope. The hydration suite renders the consumer's three tiers under three locales and two zones.

### 6.12 How others do it

| System | Part | Rows | Focus after add, remove | Limits | What this spec takes |
| --- | --- | --- | --- | --- | --- |
| GOV.UK Design System | The "add multiple things" pattern: one thing per page with a summary list, or several on one page | A fieldset per item | A new page per item | The service's | Fieldsets, a legend per item, plain buttons |
| MOJ Design System | "Add another" | A fieldset per item with a legend and a Remove button; "Add another" after the last | To the new item's first field after an add (to verify); after a remove, to the first field of the item in its place (to verify) | None of its own | The anatomy and the focus after an add |
| Atlassian | No repeater; Jira automation's conditions and Forms' repeating sections (to verify) | Cards per item | Not observed | Not observed | Nothing beyond the anatomy |
| Polaris | No repeater; the product variants editor | A table of options | Not observed | A limit message | A count beside Add |
| Linear | Workflow states, labels | A list with an add row at the end | Into the new row's name | None | Into the new row |
| macOS System Settings | Lists with "+" and "-" under them | A table | The new row, selected | None | Nothing: the "+" and "-" are icon buttons without words |
| iOS Settings | Lists with "Add..." as the last row and swipe or Edit to delete | Rows | The new row's page | None | Nothing: swipe has no keyboard equal |

## 7. ConditionalFields

### 7.1 API

```ts
export interface ConditionalFieldsProps extends Omit<HTMLAttributes<HTMLFieldSetElement>, 'children'> {
  /** Whether the fields show: the gate's state, the app's. */
  isShown: boolean;
  /** The fields that depend on the gate. */
  children: ReactNode;
  /**
   * Whether hidden fields still submit with the form and are still checked by it. Hidden fields always keep their
   * values in the page. @default false
   */
  submitsWhenHidden?: boolean;
  /** The group's id, for the gate's `aria-controls`. Default from `useId`, readable through `ref`. */
  id?: string;
  ref?: Ref<HTMLFieldSetElement>;
}
```

The gate is the app's own control placed just before the group, with `aria-controls` naming the group's id:

```tsx
<Switch isSelected={logo} onChange={setLogo} aria-controls="logo-fields">Show bank logos</Switch>
<ConditionalFields id="logo-fields" isShown={logo}>
  <Select label="Provider" name="logoProvider" ... />
  <TextField label="API key" name="logoKey" ... />
</ConditionalFields>
```

### 7.2 Behavior

- **Markup.** `fieldset.conditional-fields[role="none"]`: a fieldset because it is the one element whose `disabled` reaches every field inside it (section 7.4); `role="none"` because a group with no legend says nothing a screen reader can use, and the gate before it names what follows. An app that wants a named group passes `aria-label` and the role is left as the fieldset's group.
- **Hidden** (`isShown` false): the group has `hidden`, `inert` and `disabled` (unless `submitsWhenHidden`), and `data-hidden`. `hidden` takes it out of the layout and the accessibility tree; `inert` is the parent spec's rule and keeps focus and the find-in-page match out during the frame a stylesheet might show it; `disabled` takes its fields out of the submission and the browser's checks.
- **Shown**: none of the three. The fields are where they were, with what the reader typed.
- **Never cleared.** The group's children stay mounted while hidden, so React keeps their state, and their DOM keeps the values; turning the gate on again shows them as they were. A field the app controls keeps the app's value, which the app does not clear either.
- **The changed state.** A hidden field that was changed keeps its Changed chip for when it shows. The SaveBar's message is the app's; the docs advise counting only what will be saved, which with the default is what shows.
- **The weekly email.** The consumer's group holds a DescriptionList of the email's status ("Last sent: Monday 9:00", "To: you@example.com") and a "Send a test" Button: not fields, so the disabled fieldset only disables the Button while hidden, which is unseen.

### 7.3 Focus

- **The gate keeps focus.** A reader who turns the Switch off is on the Switch; nothing in the group held focus, so nothing moves.
- **A group that hides while it holds focus** (the gate changed by another control, or by the app): focus goes to the gate, found by `[aria-controls~="{id}"]` in the document, else to the nearest focusable element before the group, else `<main>`; never the body. The move runs in a frame after the commit (section 12). A development warning names a group with no gate pointing at it.
- **Showing moves nothing.** The gate keeps focus and the fields follow it in the tab order, which is the disclosure pattern's behavior.

### 7.4 Kept or dropped (decided here, item 14; open question 11)

**Kept in the page, dropped from the submission and the browser's checks while hidden.**

- **Kept**, as the parent spec carries: never cleared. A reader who turns the logo off and on again finds the provider and the key they typed.
- **Dropped from the submission**, so a form submits what the reader sees. A hidden key does not overwrite the saved one, and the server reads the gate to decide what an absent field means (the consumer's action keeps the saved key while the logo is off).
- **Dropped from the checks.** A hidden field is not "barred from constraint validation" by `hidden` or `inert`, so a hidden required field would block a native submit with a bubble pointing at nothing (Chromium logs "An invalid form control is not focusable"), and React Aria's native validation behaves the same. A disabled fieldset bars its fields.
- **Reconciling "never disabled".** The parent spec's carried rule says hidden conditional fields are never cleared or disabled. Its point is the reader's: a field that comes back keeps its value and never comes back dimmed. A hidden fieldset's `disabled` is never seen, is removed as the group shows, and React Aria's fields inside it keep their own `isDisabled` false, so nothing is drawn disabled. The record states the reconciliation.
- **`submitsWhenHidden`** restores the other model, GOV.UK's for conditional reveals, where hidden answers are posted and the service ignores them by the gate (to verify GOV.UK's current guidance); the app then makes hidden fields not required itself.

### 7.5 Keyboard and screen readers

- **APG.** The disclosure pattern's spirit with a switch for the button: the gate shows and hides the content after it. `aria-expanded` is not allowed on `role="switch"` or a checkbox, so the gate says its state as checked or unchecked, and `aria-controls` names the group (GOV.UK's conditional reveal keeps `aria-controls` and dropped `aria-expanded` for that reason, to verify). The library's Switch passes `aria-controls` to its input (to verify; React Aria's toggle props include it).
- **No announcement.** The reader on the gate hears it turn on; the fields follow in the reading order. A live region would interrupt the gate's own state.

### 7.6 Look and CSS

- **Layout.** The fieldset's border, padding, margin and min-content width are reset; it is a grid whose gap is `var(--conditional-fields-gap, var(--spacing-peer))`, a form's usual gap between fields, which an app sets to its own form's, indented by nothing: the fields line up with the gate, as GOV.UK draws its reveals without the left border it once had (to verify), because an indent at 320px costs a field's width.
- **`[hidden]`** is `display: none` by an explicit rule, since a class with its own `display` beats the user agent's.
- **Motion.** None (open question 12): the fields appear at once.
- **Forced colors, right to left, density.** Nothing of its own: the fields are the fields.

### 7.7 Server rendering

A client part for its focus move, rendering the group shown or hidden from `isShown` in the server's HTML with all three attributes, so a page loaded with the logo off has no key field in its tab order or its submission before any script. React 19 writes `inert` as a boolean attribute.

### 7.8 How others do it

| System | Part | Hidden values | Focus and state | What this spec takes |
| --- | --- | --- | --- | --- |
| GOV.UK Design System | Conditional reveal on radios and checkboxes | Submitted; the service ignores them (to verify) | `aria-controls` on the input; the reveal follows it | The gate before the group and `aria-controls`; not the posting of hidden answers by default |
| Polaris | No part; settings forms reveal fields under a checkbox (to verify) | Not specified | None | Nothing |
| Atlassian | Forms' conditional questions (to verify) | Not specified | None | Nothing |
| GitHub settings | Options revealed under a checkbox, such as a branch rule's settings | Posted with the form (to verify) | None | Nothing |
| iOS Settings | A switch reveals rows under it (Wi-Fi's networks, Personal Hotspot's options) | Kept for when the switch turns on | VoiceOver stays on the switch | Kept, shown at once under the gate, focus on the gate |
| macOS System Settings | A switch enables, not reveals, rows under it (dimmed) | Kept | Stays on the switch | Kept; not dimming (hidden instead, the consumer's ask) |

## 8. Field extras: the default and the suggestion

### 8.1 API

```ts
export interface FieldOffer {
  /** The offered value as the app writes it: "24 hours", "$40.00". */
  value: string;
  /** Whether the field already holds it. The offer is drawn only when it does not. */
  isCurrent: boolean;
  /** Sets the field to the offered value. The app's setter; nothing is saved. */
  onTake: () => void;
  /** Why it is offered, after the value: "from your last three months". Suggestion only. */
  reason?: ReactNode;
}

export interface FieldExtrasLabels {
  /** @default (value) => `Default: ${value}` */
  default: (value: string) => string;
  /** @default 'Reset to default' */
  reset: string;
  /** @default (value) => `Suggested: ${value}` */
  suggested: (value: string) => string;
  /** @default 'Use' */
  use: string;
}

export interface FieldExtrasProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  /** One field: a NumberField, a Select, a TextField, a Switch, a SegmentedControl. */
  children: ReactNode;
  /** The field's label as text, which ends each button's name: "Reset to default, Wait". */
  fieldLabel: string;
  /** The control that takes focus after an offer is taken: the field's input or button. */
  controlRef: RefObject<HTMLElement | null>;
  /** The default, and Reset to default. */
  defaultOffer?: FieldOffer;
  /** A suggested value, and Use. */
  suggestion?: FieldOffer;
  labels?: Partial<FieldExtrasLabels>;
  ref?: Ref<HTMLDivElement>;
}
```

### 8.2 Behavior

- **Markup.** `div.field-extras` holding the field and, when an offer is drawn, `p.field-offer[data-kind]` per offer: the words (`labels.default(value)` or `labels.suggested(value)` and the reason) in a span with an id, and a tertiary Button (`labels.reset` or `labels.use`). The button's name is its visible word, a visually hidden comma and `fieldLabel`: "Reset to default, Wait"; it is described by the words' span, "Default: 24 hours".
- **Drawn only when useful.** An offer whose `isCurrent` is true is not drawn. When the suggestion's value equals the default's and neither is current, only the default is drawn, since "the default" is the plainer reason.
- **Order.** The suggestion first, then the default, when both show: a suggestion is about this reader, the default about everyone.
- **An edit, not a save.** `onTake` is the app's setter, the same one the field's `onChange` calls. The field then differs from the saved value or not by the app's comparison, so its Changed chip and the SaveBar's dirty state follow as for any typing (section 8.4). Nothing is applied by itself: a suggestion is never prefilled into the field, and never shown as the field's placeholder, since taupe is for placeholders and a suggestion is words the reader must read.
- **The parent spec's "suggested value, generalized"** is this offer: a value the app computes and the reader accepts with one press.
- **Any field.** The wrapper reads no value; it holds a field and draws offers under it.

### 8.3 Focus

When an offer is taken it is no longer drawn (the field now holds it), so the button that held focus leaves. Focus goes to `controlRef`'s element in a frame after the commit, never the body: the reader hears the field with its new value, which is the confirmation, and needs no live region. A pointer press moves focus there too, so a reader who reset a field can type in it at once. If `controlRef` is empty the wrapper's first focusable element takes focus.

### 8.4 With the changed state and the SaveBar

- **Changed** means differs from the saved value (clay, the chip and the dot). **Default** means the product's value. They are independent: a field saved at its default shows no offer and no chip; edited away from it, the chip and the Reset offer show; reset, the chip leaves and the offer leaves; a field saved away from its default shows the Reset offer and no chip, and after a reset shows the chip (it now differs from what is saved) and no offer.
- **The SaveBar** counts a reset or a use as one change, by the app's message; Cancel restores the saved values, offers included.
- **Colors.** The offer is slate words and a tertiary button in ink. Never clay (an offer is not unsaved work), never signal orange (it is not consent), never success or gain (a suggestion is not a good outcome), never info (nothing is being reported).

### 8.5 Keyboard and screen readers

| Key | Does |
| --- | --- |
| Tab | From the field to its offers' buttons, in order. |
| Enter, Space | Takes the offer; focus goes to the field. |

The button is read "Reset to default, Wait, button, Default: 24 hours"; after the press, the field "Wait, 24 hours, button".

### 8.6 Look and CSS

- **The line.** `--text-small` in slate, a part step under the field's last part (its hint or error), wrapping. The button sits at the line's end, its 40px box level with the line by `margin-block: min(0px, calc((1lh - var(--size-control)) / 2))`, so the line does not grow for its target, the DescriptionList actions' technique. Two offers are two lines.
- **The field's measure.** The wrapper stops at `--container-field`, as a field does, so an offer ends under the control's end.
- **The concentric rule.** A field with an offer that ends a card puts the button in the card's bottom end corner region; it moves down by the corner inset as a foot control (the rule above), through `:is(.card, ...) > .field-extras:last-child .field-offer:last-child`.
- **Forced colors.** Text and Button's rules; nothing of its own.
- **Right to left.** Logical properties; a money value keeps its order by the numeral rule in the app's string (`isNumeric` is not needed: the value sits in a sentence, so the app wraps figures in `bdi` where they mix scripts, which the docs show).
- **Density.** The button follows `--size-control`.

### 8.7 Server rendering

A client part for its focus move; the offers are in the server's HTML from the props.

### 8.8 How others do it

| System | Default | Suggestion | What this spec takes |
| --- | --- | --- | --- |
| macOS System Settings | "Restore Defaults" buttons per pane (to verify which panes) | None | A reset, but per field |
| iOS Settings | "Reset" pages that reset whole groups | Siri suggestions, not in fields | Nothing |
| GitHub settings | The default stated in a hint ("Default: main") | None | The default in words |
| Polaris | Help text under a field | None | A slate line under the field |
| Atlassian | Inline "Reset to default" links in admin settings (to verify) | None | A reset beside the field |
| Linear | None observed | None | Nothing |

## 9. ThemeSwitch

### 9.1 The value

```ts
export type ThemeChoice = 'system' | 'light' | 'dark';

export interface ThemeLabels {
  /** The control's or the submenu's name. @default 'Theme' */
  label: string;
  /** @default 'System' */
  system: string;
  /** @default 'Light' */
  light: string;
  /** @default 'Dark' */
  dark: string;
}
```

`system` is the absence of a choice: the page follows `prefers-color-scheme`, which core's tokens already do with no attribute on `html` (`@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) }`). `light` and `dark` are `data-theme` on `html`.

### 9.2 The Settings row: ThemeSwitch

```ts
export interface ThemeSwitchProps extends Omit<SegmentedControlBaseProps, 'value' | 'defaultValue' | 'onChange' | 'children' | 'isChanged'> {
  /** Controlled: the choice, from the app's cookie. */
  value?: ThemeChoice;
  /** Uncontrolled: the first choice. @default 'system' */
  defaultValue?: ThemeChoice;
  onChange?: (choice: ThemeChoice) => void;
  /** `segmented` is a SegmentedControl; `radio` a RadioGroup of rows. @default 'segmented' */
  look?: 'segmented' | 'radio';
  /** Icons before each choice (Monitor, Sun, Moon). @default true */
  hasIcons?: boolean;
  labels?: Partial<ThemeLabels>;
}
```

- **A SegmentedControl by default** (open question 16): three short choices of one setting, applied at once, the look a mode switch has (the docs header's own color switch is one). It is React Aria's RadioGroup underneath, so it is a `radiogroup` named "Theme" (or the app's "Appearance") and stacks one choice per row when its row does not fit, the parent spec's carried behavior. `look="radio"` draws RadioGroup's full-pill rows instead, the account menu's original drawing, for a page with room and a wish for words under each choice.
- **Applied at once, outside the form** (decided here, item 19). A theme is the reader's device preference, not a setting the SaveBar saves: choosing it changes the page at once, writes the cookie through `onChange`, shows no Changed chip and never makes a SaveBar dirty. The docs put Appearance in its own card, not inside a section's form.
- **Order.** System, Light, Dark: the default first, as Atlassian and GitHub list theirs (to verify).
- **Icons.** Lucide's `Monitor`, `Sun` and `Moon` at 16px before each word, hidden from assistive technology; words always shown.

### 9.3 The menu's choice: ThemeMenu

```ts
export interface ThemeMenuProps {
  value: ThemeChoice;
  onChange: (choice: ThemeChoice) => void;
  /** `submenu` is a "Theme" item opening the three; `section` puts them in the menu under a "Theme" heading. @default 'submenu' */
  display?: 'submenu' | 'section';
  labels?: Partial<ThemeLabels>;
}
```

- **Submenu** (the consumer's ask; open question 17): a `MenuItem` "Theme" whose end value is the current choice's word ("System"), with a chevron, opening a submenu of three `menuitemradio` items through React Aria's `SubmenuTrigger` (section 10.4), a single-selection `Menu` whose `selectedKeys` is `[value]`. Choosing closes the whole menu (the library's single-selection default; to verify that React Aria closes the root from a submenu) and calls `onChange`.
- **Section**: the same three items in a `MenuSection` with `selectionMode="single"` and the title "Theme", in the account menu itself, one level and three rows taller.
- Each item has its icon; the chosen one shows Menu's check and the ink fill of a single selection.

### 9.4 No flash of the wrong theme: the library's part and the app's

**The library's part:**

1. **System needs nothing.** With no `data-theme` on `html`, core's tokens follow the system's setting in CSS, and `color-scheme` follows it too, so form controls and scrollbars match. A page whose choice is System paints right with no script and no cookie.
2. **The parts read nothing at render.** ThemeSwitch and ThemeMenu draw the `value` they are given; they never read `matchMedia`, `localStorage`, `document.cookie` or `data-theme`, so the server's HTML and the first client render agree.
3. **No script.** The library injects none, the consumer's rule.

**The app's part** (the recipe, with the Next App Router):

1. **Read the cookie on the server.** The root layout reads the theme cookie with `cookies()` and writes `data-theme="light"` or `data-theme="dark"` on `<html>`, or nothing for System. The first paint is right: no script, no flash, no hydration warning.
2. **Write it on change.** `onChange` sets `document.documentElement.dataset.theme` (or removes it for System) at once, so the page changes in the same frame, and writes the cookie, by `document.cookie` or a server action, for the next request.
3. **The cost.** Reading a cookie in the root layout makes every route render per request in Next (to verify for Next 16's caching). A site that serves static pages, as the docs site does, cannot read the cookie on the server; it needs a pre-paint inline script that reads its own storage, which is what `next-themes` does, with `suppressHydrationWarning` on `<html>`. That script is the app's, not the library's.
4. **Other tabs** keep their theme until they reload; an app that wants them to follow listens for a `storage` event of its own.

### 9.5 Keyboard and screen readers

| Where | Key | Does |
| --- | --- | --- |
| ThemeSwitch | Tab | Into the group, on the chosen choice. |
| | Arrows | Move to and choose the next or previous choice, applying it (the APG radio group). |
| ThemeMenu, submenu | Enter, Space, Arrow Right (Arrow Left in right to left) | On "Theme", opens the submenu with focus on the chosen item. |
| | Arrow Up, Down | Between the three. |
| | Enter, Space | Chooses, closes every menu, focus back to the account trigger. |
| | Arrow Left (Right in right to left), Escape | Closes the submenu, focus back to "Theme". |

- **APG.** ThemeSwitch is a radio group; ThemeMenu is the menu pattern's `menuitemradio` group, `aria-checked` on the chosen one, inside a submenu opened by a `menuitem` with `aria-haspopup` and `aria-expanded`. Arrows applying the choice is the radio group's rule; a theme switch is cheap to undo, so applying on arrow is right.
- **Right to left.** React Aria takes the submenu's open and close arrows from its locale, not the `dir` attribute (to verify for `SubmenuTrigger`), so a Persian page sets `I18nProvider` with a right-to-left locale, which the Persian guide already does.

### 9.6 Look

SegmentedControl's and RadioGroup's own; Menu's own with the submenu's chevron (section 10.4). Forced colors, density and right to left are theirs. No new CSS but the submenu's chevron and the icons' room in `menu.css`.

### 9.7 How others do it

| System | Where | Choices | Applied | What this spec takes |
| --- | --- | --- | --- | --- |
| GitHub | Settings, Appearance: a theme mode (single theme or sync with the system) and theme cards (to verify) | Light, dark and their variants, or System | At once | System as a choice; at once |
| Linear | Preferences: an interface theme select (to verify) | System, light, dark and more | At once | At once |
| Atlassian | The profile menu's Theme item opening Light, Dark and Match browser (to verify) | Three | At once | A submenu in the account menu |
| Polaris | The admin follows the system; no switch (to verify) | None | Not applicable | Nothing |
| macOS System Settings | Appearance: Light, Dark, Auto, as pictures | Three | At once | System as "Auto" with a word |
| iOS Settings | Display and Brightness: Light and Dark pictures with an Automatic switch | Two and a switch | At once | Three choices rather than two and a switch |

## 10. AccountMenu

### 10.1 API

```ts
export interface AccountMenuProps<T extends object = object> extends Omit<MenuProps<T>, 'placement' | 'aria-label'> {
  /** The person's name: on the trigger, and the trigger's name. */
  name: string;
  /** A second line on the trigger, in slate: an email, a workspace. */
  detail?: ReactNode;
  /** The avatar's image; initials from `name` without it. */
  avatarSrc?: string;
  /**
   * Avatar only, the name in a Tooltip and the trigger's name. Inside a Sidebar it follows `useSidebar().isCollapsed`
   * unless given. @default false
   */
  isCompact?: boolean;
  /** Where the menu opens. @default 'top start' in a Sidebar's footer, 'bottom end' elsewhere */
  placement?: Placement;
  /** The menu's name. @default 'Account' */
  menuLabel?: string;
  /** MenuItem, MenuSection, MenuSeparator and ThemeMenu elements. */
  children: ReactNode;
}
```

### 10.2 The trigger

- **Markup.** React Aria's `MenuTrigger` with a `Button.account-menu-trigger`: an `Avatar` (`size="sm"`, 32px, `isDecorative`, since the name is beside it), the name at `--text-action` in ink, the detail under it at `--text-small` in slate, and Lucide's `ChevronsUpDown` at 16px in slate at the inline end, hidden. React Aria writes `aria-haspopup` and `aria-expanded`.
- **Its name** is the visible name, "Ada Lovelace", which a voice user can say (2.5.3); the detail describes it. "Account" alone would hide whose account it is.
- **Compact** (a folded rail, a header): the Avatar alone in a 40px circle, its `aria-label` the name, with a Tooltip showing the name, as a folded rail's items show theirs.
- **In the rail's footer**, the trigger fills the row (`flex: 1`, `min-inline-size: 0`), the name and detail wrap at any character (`overflow-wrap: anywhere`) and never push the rail wider, and the menu opens upward (`top start`). On the phone the rail is a drawer and the trigger sits in its footer the same way; in the More sheet it is a row of the sheet.
- **In a header** (an app with no rail), compact, at the actions' end, opening `bottom end`.

### 10.3 The menu

- The app's items: Settings (a link), the ThemeMenu, Help, a separator, Sign out. Sign out is not `danger`: it loses nothing.
- **Choosing an item** closes the menu and focus returns to the trigger (React Aria's), unless the item navigates, in which case the destination's own focus rule applies (a settings section's heading, section 5.6).
- **A trigger that leaves**: a rail that folds while its menu is open keeps the trigger (it changes face), so focus has somewhere to return.

### 10.4 Menu gains SubmenuTrigger

`Menu` exports `SubmenuTrigger`, React Aria's, re-exported with the library's classes, as `MenuTrigger` is:

- The parent `MenuItem` draws a 16px `ChevronRight` at its inline end in the shortcut's place, slate, mirrored in right to left by `scale: -1 1`, hidden; `[data-has-submenu]` keeps its room. Its `end` value ("System") sits before the chevron.
- The submenu is a `Menu` in a `Popover` placed `end top`, offset so its first row lines up with the parent row (a negative offset of the list's padding, 8px), flipping to `start top` where it does not fit, React Aria's placement. On a 320px phone it opens over the parent menu (to verify React Aria's placement there).
- An open submenu's parent row keeps the hover wash (`[data-open]`), so the reader sees which row it came from.
- Forced colors, density and the coarse pointer's 44px rows are Menu's.

### 10.5 Keyboard and screen readers

| Key | Does |
| --- | --- |
| Enter, Space, Arrow Down | On the trigger, opens the menu with focus on its first item (Arrow Up: its last). |
| Arrows, Home, End, letters | React Aria's menu keys. |
| Arrow Right (Left in right to left) | On "Theme", opens the submenu. |
| Escape | Closes the open menu level, focus to its trigger. |
| Tab | Closes the whole menu, focus moves on from the trigger. |

APG's menu button pattern, with the submenu's keys from its menu pattern.

### 10.6 Look and CSS

- **Trigger.** A row as tall as its two lines or 48px (`--size-field`), whichever is more, padded a part step, `--radius-control`, the 5% wash on hover and while its menu is open, the focus ring. In the rail's footer it keeps the footer's padding. Compact: 40px, `--radius-pill`.
- **The concentric rule.** The rail's footer is in the rail's bottom corners; the footer's padding already clears them (Sidebar's footer record), and the trigger's corner inside it is `min(var(--radius-control), max(0px, calc(var(--sidebar-corner) - var(--sidebar-nav-inset))))`, the rail items' formula, so its wash follows the rail's corner.
- **Forced colors.** The trigger is a button with a `canvastext` edge when open; the chevron and detail `canvastext`; the Avatar's own rules.
- **Right to left.** Logical properties; the chevron is symmetric and does not mirror.
- **Density and coarse pointers.** The row follows `--size-field`; compact 36px, 44px on a coarse pointer.

### 10.7 Server rendering

A client part. The trigger, its avatar and name are in the server's HTML; the menu is not until opened, as Menu's never is. A collapsed rail from the server's cookie draws the compact trigger from the first paint, through `useSidebar()`.

### 10.8 How others do it

| System | Trigger | Menu | What this spec takes |
| --- | --- | --- | --- |
| GitHub | The avatar alone, top end | A panel with the name and handle at its top, then links (to verify) | Avatar-only compact face in a header |
| Linear | Workspace name and avatar at the sidebar's top | Preferences, theme items, sign out (to verify) | Name and avatar together on the trigger |
| Atlassian | The avatar, top end | Profile, Theme submenu, log out (to verify) | The Theme submenu |
| Polaris (Shopify admin) | Store name and avatar, top end | Store switcher, help, log out (to verify) | The name with a second line |
| macOS | The Apple menu and the account in System Settings' sidebar top | Not a menu | Nothing |
| iOS Settings | The account row at the list's top, avatar and name | A page | The account row's look in a list |

## 11. CopyButton

The design deferred in the accounts spec (section 5.6), taken as written there, with the API it needs now.

### 11.1 API

```ts
export interface CopyButtonLabels {
  /** The button's name, unchanged by its outcome. @default 'Copy' */
  copy: string;
  /** @default 'Copied' */
  copied: string;
  /** @default 'Copy failed' */
  failed: string;
}

export interface CopyButtonProps extends Omit<ButtonProps, 'onPress' | 'children' | 'variant'> {
  /** The text to copy. In the page's HTML and its server payload: never a value the page may not hold. */
  value: string;
  /** `icon` is a ghost IconButton with a Tooltip; `button` a secondary Button with the icon and the word. @default 'icon' */
  look?: 'icon' | 'button';
  /** Called after each copy, with whether it worked. */
  onCopy?: (copied: boolean) => void;
  labels?: Partial<CopyButtonLabels>;
}
```

### 11.2 Behavior

- **The copy.** A press calls `navigator.clipboard.writeText(value)` synchronously in the press handler, a user activation that Safari requires, with no `execCommand` fallback. Where the Clipboard API is missing (an insecure context) or refuses, the outcome is a failure, not an error.
- **The outcome** is held two seconds (the docs site's `useCopy`, Carbon's copy button feedback timeout): the glyph swaps from `Copy` to `Check` on success and stays on failure; the Tooltip's text and the status say "Copied" or "Copy failed". The button's name never changes: a name that changes under focus is read again by some screen readers and not by others.
- **The status** is a polite `role="status"` host beside the button, in the server's HTML and empty, so a screen reader is listening before the words arrive; it is cleared after two seconds. It never sits in an `aria-busy` subtree: an answer streaming with `aria-busy` on its body puts its CopyButton in the answer's footer, outside the busy part, and a development warning names a CopyButton whose status has an `aria-busy="true"` ancestor when it speaks.
- **Names.** An icon button's name is `labels.copy` plus what it copies, given by the app: `labels={{ copy: 'Copy answer' }}` or "Copy webhook address". In a DescriptionList row the button goes in `actions`, named "Copy" and the term (the DescriptionList actions' rule): no `copyValue` prop is added to the list, which stays a server part (open question 22).
- **What the page holds.** `value` is in the HTML and in the React Server Components payload. A masked value that copies its whole digits would put the digits in the page; the docs say so, and an asynchronous getter that fetches the value on press is open question 21.
- **Focus** stays on the button; nothing leaves.

### 11.3 Keyboard and screen readers

| Key | Does |
| --- | --- |
| Enter, Space | Copies; "Copied" is said politely. |

A button, named and described as above; the Tooltip shows its name on hover and focus, and the outcome while it holds.

### 11.4 Look and CSS

IconButton's ghost look (40px, `--radius-pill`) or Button's secondary look; the check glyph in ink, never success's color (a copy is not a save); the failure keeps the copy glyph and says its words. Forced colors, density and right to left are the buttons'; the glyphs are symmetric enough not to mirror. `copy-button.css` holds only the status host's clip and the glyph swap.

### 11.5 Server rendering

A client part: the button and the empty status in the server's HTML; nothing reads the clipboard until a press.

### 11.6 How others do it

| System | Part | Feedback | What this spec takes |
| --- | --- | --- | --- |
| GitHub Primer | `ClipboardCopyButton` (to verify the name); copy buttons beside clone addresses | The icon turns to a check; "Copied!" tooltip | The glyph swap and a short word |
| IBM Carbon | `CopyButton` with `feedback` and `feedbackTimeout` (2000ms default) | A "Copied!" tooltip | The two-second hold |
| Atlassian | Copy buttons in code blocks | A tooltip | The tooltip |
| Polaris | No part; the admin copies by buttons beside values (to verify) | A toast | Not a toast: it moves nothing and needs no region of its own |
| Linear | "Copy link" items in menus | A toast | Not a toast |
| macOS, iOS | The system's Copy | None | Nothing |

## 12. NumberField's flushSync warning

### 12.1 What is logged, and where

React logs "flushSync was called from inside a lifecycle method. React cannot flush when React is already rendering", in development only. The call is React Aria's, not the library's: `useNumberField` commits the typed text on blur inside `flushSync` (`react-aria` 3.53.1, `dist/private/numberfield/useNumberField.mjs:60-76`: `commitAndAnnounce` wraps `commit()` in `flushSync` so it can read the formatted text back and announce it; the Enter shortcut does the same at `:167-175`, from a key handler, where it is harmless). When the browser sends that blur while React is committing, `flushSync` is called inside React's commit and React logs. That happens when something moves focus from a layout effect or a passive effect, or disables, removes or makes inert the focused field while React draws. The design record already records it (NumberField, "A known React Aria warning", patch 0.6.1) and `NumberField.test.tsx` pins it as `it.fails('logs nothing when focus leaves the field during a commit ...')`.

### 12.2 What zero has to do with it

Nothing in React Aria or the wrapper treats 0 differently on a commit. Measured for this spec in jsdom against `main` at 24d426c: committing 0 eleven ways (a money field controlled from 500, typing 0 then Tab, and then Enter; from 0; from empty; typing "0.00"; the sign button at 0 and on an empty field; the sign, then 0, then Tab, which commits -0; a plain field from 5; an app that maps 0 to null; an uncontrolled field) logs nothing. The wrapper's own `flushSync` (the sign button at 0 or empty, `NumberField.tsx:321`) runs in a press handler, where it is allowed.

Zero matters to what the app does when it commits, and a settings page makes that common: 0 is often a field's default or its saved value, so committing it is when the app's state changes most. The field stops being changed and a Reset offer leaves, a SaveBar turns clean, a ConditionalFields group gated on "more than 0" hides, a Repeater row of $0 is dropped. If any of those moves focus in a layout effect, or removes, disables or makes inert the focused field, during the commit that the blur or Enter started, React logs. The consumer's exact path is to verify from its reproduction (owner action 4); the fix below does not depend on it.

### 12.3 The fix (decided here, item 25; open question 23)

**NumberField defers React Aria's blur handler by one microtask**, keeping the call and its announcement:

- The wrapper already re-provides React Aria's input props through `InputContext` (`NumberFieldInput`, `NumberField.tsx:215-240`) to drop the role description. It replaces `onBlur` there with a handler that captures the event's `target` and `currentTarget` (React clears `currentTarget` after dispatch, and React Aria's `useFocus` compares the two, `useFocus.mjs`) on an object whose prototype is the event, and calls React Aria's handler with it in `queueMicrotask`.
- **Why a microtask is enough.** After a browser-dispatched blur the script stack is empty when the listener returns, so the microtask runs at once, before the focus event on the next element and before a click on a submit button (pointer down moves focus, the click follows). When the blur is dispatched by script inside React's commit, the stack is React's, so the microtask runs after the commit finishes: exactly React's advice in its message ("Consider moving this call to a scheduler task or micro task").
- **What changes for an app.** The app's `onBlur` and `onFocusChange(false)`, which React Aria chains into the same handler, run one microtask later. A form submitted by a script in the same task as the blur (a `requestSubmit()` from a focus handler) could read the value before the commit; a pointer or keyboard submit cannot.
- **Measured for this spec in jsdom** (the change applied locally and reverted): the 51 other tests in `src/number-field` pass, the body of the expected-to-fail test passes (so `it.fails` reports the fix), and the 138 tests of the server-render, hydration, form-reset and empty-parts suites, which hold NumberFields, pass.
- **To verify in three engines**: a play that presses a submit button from a focused money field and reads the committed minor units in the `FormData`; a play that moves focus from a layout effect and reads no console error; the announcement of a corrected value ("1,234.50") in VoiceOver after Tab.
- **The record** loses "the library cannot reach the call without taking React Aria's blur from it": it can delay it without taking it. The `it.fails` becomes `it`. A patch changeset, `number-field-blur.md`, for react: "NumberField no longer makes React log a flushSync warning when focus leaves it while React draws".
- **Upstream.** The same deferral belongs in React Aria's `commitAndAnnounce`; the plan files an issue with the reproduction (to verify whether one exists), and the wrapper's deferral is removed when a React Aria release has it.

### 12.4 This batch's own rule

Every part in this batch moves focus in a frame after its commit (sections 5.6, 6.4, 7.3, 8.3), so none makes a focused NumberField blur inside React's commit even before the fix, and the recipe's own moves do the same.

## 13. Accessibility

- **Landmarks.** The settings nav is a named navigation inside `main`; the open section a region named by its heading; the shell's header holds the page's one `h1`.
- **Focus never falls to the body.** Every removal and every hide in this batch names where focus goes (sections 5.6, 6.4, 7.3, 8.3, 10.3), and the docs' end-to-end tests read `document.activeElement` after each and fail on `body`.
- **Live regions** are mounted empty from the server's first render (Repeater, CopyButton), polite, and never inside `aria-busy`.
- **Never color alone.** A nav item's state is words ("On"); a row's error has words; an offer has words; a theme choice has its word and its check. Clay stays the Changed chip and the changed edge; signal orange appears nowhere; error is a field's, a row's or a set's invalid value only; taupe is placeholders and disabled text only, never a suggestion.
- **Targets (2.5.8).** Every control is at least 40px, 36px compact with 40px hit areas, 44px on a coarse pointer in compact.
- **Label in name (2.5.3).** "Remove, Tier 2"; "Reset to default, Wait"; "Use, Up to"; "Ada Lovelace" on the trigger; "Settings" on Back.
- **Screen readers.** Not yet verified with VoiceOver and NVDA (owner action 3): a section's heading read on a section change; a Repeater's legends on focus moved by script; a disabled hidden fieldset absent from the reading order; the submenu's radio items; the CopyButton's status.
- **Axe** passes in light and dark for every story.

## 14. Responsive, right to left, density and forced colors, together

- **320px.** The list face at 320px: rows 288px wide, names and descriptions wrapping; a section's cards stacked; a Repeater's rows one field per line (its row container under 30rem) with Remove after them; an offer's line wrapping with its button at its end; the account trigger's name wrapping in a drawer's footer. No part scrolls sideways; a docs test checks each page at 320px and 375px.
- **Size containers** (`panel-layout`, `panel-row`, `repeater-row-fields`) declare `contain-intrinsic-inline-size: 0`; a holder sized to its content gives them a width, which the docs say.
- **Right to left.** Columns by logical properties; the chevrons of the list face, Back and the submenu mirror; a figure keeps its order by the numeral rule. Stories in `rtl/RightToLeft.stories.tsx` show PanelLayout, a Repeater of tiers in tomans and the AccountMenu with its submenu open, in Persian.
- **Compact and coarse.** Rows, fields and buttons follow `--size-control` and `--size-field`; cards pad 20px; touch keeps 44px.
- **Forced colors.** The nav's current item and the menu's chosen item are `highlight`; rules are `canvastext` borders; every state has words.

## 15. Server rendering

| Part | Directive | In the server's HTML |
| --- | --- | --- |
| PanelLayout, PanelNav, PanelNavItem | `'use client'` | Both faces, `aria-current`, Back |
| PanelSection, PanelRow | none | Everything |
| Repeater | `'use client'` | Every row, Add or the full line, the empty status |
| ConditionalFields | `'use client'` | The group with `hidden`, `inert` and `disabled` from `isShown` |
| FieldExtras | `'use client'` | The field and its offers |
| ThemeSwitch, ThemeMenu | `'use client'` | The control with its choice; the menu when open |
| AccountMenu | `'use client'` | The trigger |
| CopyButton | `'use client'` | The button and the empty status |

No part reads `window`, formats with `Intl` or measures before the first paint. Every focus move and every face check is after hydration. Each part joins `server-render.test.tsx`, `server-face.test.tsx` (three locales, two zones) and `hydration.test.tsx`; PanelSection and PanelRow join the server-components suite's static rows.

## 16. Industry grounding, in one place

Sections 5.12, 6.12, 7.8, 8.8, 9.7, 10.8 and 11.6 hold the comparisons. In short: the frame is GitHub's and Linear's list of linked sections beside the form, turning into iOS Settings' list and page on a phone with a Back named by the list's title, with the split face opening on a default section as the iPad and macOS do; the repeater is GOV.UK's and MOJ's fieldsets with a legend per item, not a grid; the hidden fields are iOS's switch that reveals rows, kept but not posted; the offers are a reset per field, as Atlassian's admin pages draw them; the theme is three choices, System first, as GitHub, macOS and Atlassian offer them, in a submenu of the account menu as Atlassian's; the copy button is Primer's glyph swap with Carbon's two-second hold.

## 17. Decided here

1. PanelLayout is the parent spec's "side and main columns"; PanelRow is its "cards that only ever pair". Both ship in 0.10.0.
2. One address per section; the layout takes `view` and `sectionKey` from the URL and holds no section state.
3. Both faces are in one HTML; a container query on the layout's own box picks one at 48rem; the side column is 16rem.
4. The index's split face shows a default section, marked `isDefault`, drawn current only there and never `aria-current`.
5. A section change after hydration moves focus to the section's heading on both faces; back to the index, to the link of the section left on the list face; nothing moves on first render.
6. The shell's header keeps the page's `h1`; sections are `h2`; Back is the layout's, on the list face only, named by `backLabel` alone.
7. PanelRow takes exactly two children, pairs from 66rem of its own box, and keeps each card's height.
8. Repeater is fieldsets in an ordered list, not GridList, controlled, with a row legend from its place.
9. Remove and Add are plain buttons; Remove asks nothing; Remove is not drawn at `minRows`; Add is replaced by a line at `maxRows`; Add shows "n of N".
10. After an add, focus to the new row's first field; after a remove, to the first field of the row in its place, else the new last row's, else Add; a polite status says what was added or removed.
11. No reorder; tiers sort by amount at save.
12. The library writes no field names; repeated names read with `getAll` are the recipe's way.
13. Errors: a field's own, a row's line in the row's description, a set's line under its legend.
14. ConditionalFields keeps hidden values in the page and drops them from the submission and the browser's checks through a hidden disabled fieldset; `submitsWhenHidden` restores posting.
15. The gate is the app's, before the group, with `aria-controls`; a group that hides while holding focus gives it to the gate.
16. FieldExtras wraps any field and draws a default offer, a suggestion, or both, only when not current; taking one is an edit, never a save.
17. After an offer is taken, focus goes to the field's control.
18. ThemeChoice is `system`, `light` or `dark`; System is no attribute.
19. ThemeSwitch is a SegmentedControl by default, applies at once, never marks changed and is outside the SaveBar.
20. ThemeMenu is a submenu by default, a section by option; Menu exports `SubmenuTrigger`.
21. The library injects no script and reads no theme at render; the app writes `data-theme` from its cookie on the server.
22. AccountMenu's trigger is the Avatar, the name and a detail, named by the name; compact in a folded rail with a Tooltip.
23. CopyButton is accounts spec 5.6's design: a synchronous `writeText`, two seconds of outcome, a polite status, an unchanged name; it copies a string.
24. Every focus move in this batch runs in a frame after its commit.
25. NumberField defers React Aria's blur handler by a microtask; the `it.fails` test becomes a passing test; a react patch changeset.
26. No new tokens: 16rem, 48rem, 66rem and 30rem are literals in their files, as SidePanel's 24rem is.
27. New CSS files: `panel-layout.css`, `repeater.css`, `field-extras.css` (with ConditionalFields' reset), `account-menu.css`, `copy-button.css`; `menu.css` gains the submenu's chevron; each in `@layer components`, tokens only, with a forced-colors block, imported after the last file of batch 6.
28. One 0.10.0 minor release of core and react, and a patch to `@snapshot-ui/charts` for its core peer.

## 18. Testing

- **Core (`css.test.js`, `token-only.test.js`, `contrast.test.js`).** The new files are tokens only, in `@layer components`, imported in order after batch 6's last, each with a forced-colors block and logical properties; system colors only in that block; every size container declares `contain-intrinsic-inline-size: 0`; the corner rules for a Repeater's foot and a field extra's last offer are in the shared `CLEAR` list. No new contrast pair: every text color is gated already on its surfaces.
- **React (Vitest, jsdom).**
  - PanelLayout: both faces' markup in each view; `aria-current` only from `isCurrent`; `isDefault` writes `data-default` and no `aria-current`; Back's name and `href`; a `sectionKey` change moves focus to the heading after a frame, and not on first render; back to the index moves it to the link left; a navigation started outside the layout moves nothing. PanelRow's two children and its `data-layout`; the tuple type refuses three (`@ts-expect-error`).
  - Repeater: the fieldset, legends, ordered list and buttons; names "Remove, Tier 2"; Add's description "3 of 6"; Remove absent at `minRows`; the full line at `maxRows`; focus after each case of section 6.4's table; the status's words; row and set errors in descriptions; `FormData.getAll` in row order with money minor units; the warning for an `aria-busy` ancestor.
  - ConditionalFields: `hidden`, `inert` and `disabled` when hidden and none when shown; values kept across hide and show; `FormData` without hidden fields, and with them under `submitsWhenHidden`; a hidden required field does not block `requestSubmit()`; focus to the gate when a group hides holding focus.
  - FieldExtras: offers drawn only when not current; the equal-values rule; names and descriptions; focus to `controlRef` after a take; a NumberField, a Select and a Switch inside.
  - ThemeSwitch and ThemeMenu: the three choices, controlled and uncontrolled; `onChange`; no Changed chip; the submenu's `menuitemradio` items with `aria-checked`; the section display; nothing read from `window` at render.
  - AccountMenu: the trigger's name and description; compact with a Tooltip; the folded rail's face from `useSidebar()`; focus back to the trigger after a choice.
  - CopyButton: `writeText` called in the press with the value; "Copied" and "Copy failed" in the status and cleared after two seconds (fake timers); the unchanged name; the glyph swap; a missing clipboard is a failure.
  - NumberField: the `it.fails` turns to `it`; a commit on blur lands before a following click; the announcement still fires.
  - Server suites: every part as section 15 lists.
- **Storybook.** Section 19's stories, baselined in the four theme and shape modes and at 375px, and in compact where tagged. Plays in the four story projects: the face switching at 48rem in a resizable frame; focus on the heading after a nav press and on the link after Back, in three engines; the Repeater's focus after add and remove and its status, in three engines; a hidden group's absence from the tab order; the submenu's keys in left to right and right to left; a copy in Chromium with the clipboard permission granted (WebKit and Firefox read the status only, since their clipboard needs a real gesture, to verify); NumberField's submit play (section 12.3). The concentric audit runs every new story in three shapes.
- **Docs e2e.** Completeness maps for the new pages; 320px and 375px with no sideways scroll; forced colors on the nav's current item and the submenu's chosen item; the Settings recipe at 375 and 1280, walking the list, a section, Back, an add and a remove of a tier, a gate off and on, a reset, and a theme change, reading `document.activeElement` after each and failing on `body`.

## 19. Docs, stories and release

- **Pages:** `panel-layout` (leading with "One address per section", then "On a phone", "Card pairs" and the Settings recipe), `repeater`, `conditional-fields` (leading with "Kept, but not sent"), `field-extras`, `theme-switch` (leading with "No flash: your part and ours"), `account-menu`, `copy-button`. Each with Usage, Props, Accessibility with its Keys table, and Design rules. The `menu` page gains "Submenus"; `number-field` replaces its known warning with the fix; `description-list` gains "A value to copy"; `prose` gains "Copy an answer".
- **The docs header's theme switch** becomes ThemeSwitch (`size="sm"`, `hasIcons`), still driven by `next-themes` and its pre-paint script, since the docs are static pages (open question 20). The shape switch stays the docs' own.
- **The Settings recipe**, with the Next App Router, in the docs as `?section=` search parameters (the docs site is one route per page) and as code for `app/settings/[section]`:
  - PageHeader "Settings" in the shell's header; PanelLayout with a PanelNav of Coach, Notifications, Bank sync ("2 connected"), Logos ("Off"), Data and Danger zone; the index's default section Coach.
  - Coach: a Card "Wait tiers" with a Repeater of up to six tiers (a money NumberField "Up to" and a Select "Wait", hours 0 to 72), a row error when a tier is not above the one before, FieldExtras with a default on the first tier's wait and a suggestion on its amount; a SaveBar.
  - Notifications: a weekly email Switch gating a DescriptionList of its status and CardActions' "Send a test" (a toast on success).
  - Logos: a Switch gating a provider Select and a key TextField (password type) with a CopyButton for the setup address in a DescriptionList row.
  - Appearance (in Data or its own card): ThemeSwitch, applied at once, writing a cookie.
  - Danger zone: a Card with a danger Button "Delete all data" and a ConfirmDialog in the danger tone. No red card: error means a failure or an invalid value (open question 25).
  - The rail's footer holds the AccountMenu with ThemeMenu as a submenu, Settings and Sign out.
  - The recipe's `navigate` asks before leaving a dirty section with `useConfirm` (open question 24).
- **Stories:**
  - `Components/PanelLayout`: `Default` (density; split, Coach open), `IndexSplit` (the default section), `ListFaceIndex` (a 375px frame), `ListFaceSection` (375px, Back), `CardPairs` (density; halves and a third beside two thirds at 70rem), `LongNames`, `InAppShell` (density).
  - `Components/Repeater`: `Default` (density; three tiers), `AtMaximum` (six), `AtMinimum` (one, no Remove), `RowError`, `SetError`, `Empty` (`minRows` 0), `Narrow` (a 20rem frame), `InCard` (density; Add at the card's foot).
  - `Components/ConditionalFields`: `Shown`, `Hidden`, `LogoProvider` (density).
  - `Components/FieldExtras`: `ResetToDefault`, `Suggestion`, `Both`, `OnSelectAndSwitch` (density), `InCard`.
  - `Components/ThemeSwitch`: `Segmented` (density), `Radio`, `MenuSection`.
  - `Components/AccountMenu`: `InRail` (density), `Compact`, `Open`, `ThemeSubmenuOpen`, `InHeader`.
  - `Components/Menu`: `Submenu`.
  - `Components/CopyButton`: `Icon`, `WithWord`, `InDescriptionList`, `UnderAnAnswer`.
  - `Pages/Settings` (density).
  - `rtl/RightToLeft.stories.tsx`: `PanelLayout`, `Repeater` and `AccountMenu` in Persian.
  - No-visual plays: `FaceAtItsWidth`, `FocusOnSectionChange`, `RepeaterFocus`, `HiddenNotSubmitted`, `SubmenuKeys`, `CopyStatus`, `NumberFieldSubmitAfterBlur`, `OnANarrowPhone` for each size container.
- **Design record:** a section per part in Appendix B (PanelLayout, Repeater, ConditionalFields, FieldExtras, ThemeSwitch, AccountMenu, CopyButton); "Page composition, derived" gains PanelRow's 66rem and the reason; "Nested radii, derived" gains the Repeater's foot and the last offer in its table of controls that move; NumberField's known warning becomes the fix; the reconciliation of "never disabled" (section 7.4).
- **Changesets:** minor, for `@snapshot-ui/core` and `@snapshot-ui/react`: `panel-layout.md`, `repeater.md`, `conditional-fields.md`, `field-extras.md`, `theme-switch.md`, `account-menu.md`, `menu-submenu.md`, `copy-button.md`; patch for react: `number-field-blur.md`; patch for charts: `charts-core-peer.md`, its core peer to `^0.10.0`, since 0.2.0's `^0.9.0` does not admit 0.10.
- **Release note for the consumer:**
  - Upgrade `@snapshot-ui/core` and `@snapshot-ui/react` to 0.10.0 and `@snapshot-ui/charts` to its patch together.
  - Settings: one route per section; pass `view` and `sectionKey` from the URL; mark the open section `isCurrent` and the index's section `isDefault`; render each section as a PanelSection; keep "Settings" as the page's `h1` in the shell's header. Guard dirty sections in your `navigate`.
  - Wait tiers: hold the rows with stable ids; name every row's fields the same and read them with `getAll`; sort tiers by amount when you save; set row errors by row id.
  - Hidden fields are kept but not sent: an absent field under an off gate means "unchanged"; pass `submitsWhenHidden` only if your action wants them.
  - Reset and Use are edits: compare to the saved value for `isChanged` and the SaveBar, as for typing; pass the field's control as `controlRef`.
  - Theme: read your cookie in the root layout and write `data-theme` on `<html>` (nothing for System); in `onChange` set the attribute at once and write the cookie. Keep Appearance out of a section's form.
  - CopyButton copies what the page holds; never pass a value the page should not have.
  - NumberField's flushSync warning is gone; if you still see one, send the reproduction.

## 20. Risks

- **R1. Two faces in one HTML.** The hidden face's HTML costs bytes and its links exist in the DOM. Mitigation: `display: none` takes it out of the tab order and the accessibility tree; the nav is short; the index's default section is the only duplicate.
- **R2. Focus moved by a frame.** A frame after the commit is a visible moment with focus where it was, and a slow device may paint the new section before focus lands. Mitigation: the move is within one frame, as the accounts recipe's; plays read focus in three engines with `waitFor`.
- **R3. A disabled fieldset and React Aria.** React Aria's fields inside a disabled fieldset are disabled natively without knowing it: a field's own `isDisabled` stays false, so a field that is somehow shown while the fieldset is still disabled would accept no input and look enabled. Mitigation: the fieldset's `disabled` and `hidden` are set and removed together in one render; a test checks a shown group has no `disabled`.
- **R4. Fieldset legends read on script focus.** VoiceOver may not read a row's legend when focus is moved into it. Mitigation: the status says the add; the fields' labels stand alone; a VoiceOver pass (owner action 3).
- **R5. The microtask deferral.** An app's `onBlur` now runs a microtask later; a script submit in the same task as a blur could miss the commit. Mitigation: the plays of section 12.3 in three engines; the changeset says it; the deferral leaves when React Aria fixes its call.
- **R6. A submenu at 320px.** A submenu beside its menu does not fit a phone. Mitigation: React Aria flips and overlaps it (to verify); `display="section"` for an app that prefers one level; a story at 320px.
- **R7. The cookie and static rendering.** Reading the cookie makes the root layout dynamic in Next. Mitigation: the docs explain the trade and show the pre-paint script alternative the docs site itself uses.
- **R8. `isDefault` as a visual-only current.** A sighted reader on the split index sees Coach current while a screen reader hears no current page. Mitigation: the section's heading is the main column's first thing; the docs say why.
- **R9. The 0 reproduction.** The consumer's exact path is not known. Mitigation: the fix removes the warning for every path that moves focus during a commit; owner action 4 asks for the reproduction to add as a test.

## 21. Open questions

Each has a recommended answer.

1. **The consumer's Settings page.** Recommended: take section 3 as the consumer's request, and ask the consumer to confirm the six sections, a maximum of six tiers with at least one, and which coach fields have defaults and suggestions. Alternative: build from section 3 alone.
2. **What `/settings` shows on a desktop.** Recommended: the list beside a default section (`isDefault`), as the iPad and macOS do, with the list alone on a phone. Alternatives: an overview of the sections in the main column, which repeats the list; or a redirect to the first section, which loses the phone's list.
3. **Focus on a section change on the split face.** Recommended: the heading, as on the phone, one rule. Alternative: keep focus on the nav's link on the split face, so a keyboard reader can browse sections with Tab and Shift+Tab less, at the cost of two rules and a screen reader hearing nothing of the new section.
4. **PanelRow in this batch.** Recommended: yes, the two forms that pair and their mirror, static and small, completing the parent spec's row; the spanning form (two thirds beside two stacked thirds) later. Alternative: defer PanelRow until a consumer page pairs cards.
5. **The side column's width and the split's width.** Recommended: 16rem and 48rem, so the main column keeps 30rem. Alternative: 20rem (the rail's) and 52rem, roomier names and a later split.
6. **Repeater's basis.** Recommended: fieldsets and buttons. Alternative: GridList, the parent spec's basis, which gains arrow keys between rows and a reorder path, and costs an edit mode in every row with a text field.
7. **Reorder.** Recommended: none; tiers sort by amount at save. Alternative: up and down buttons per row, which ReorderList will own.
8. **Focus after a remove.** Recommended: the first field of the row now in its place, with the status saying what left. Alternatives: Add, which is far from the reader's place; the previous row's Remove, which invites a run of removals.
9. **At the maximum.** Recommended: Add replaced by "6 of 6. Remove one to add another." Alternative: Add disabled with `aria-disabled` and kept focusable, which needs a Button that does not exist yet.
10. **Field names.** Recommended: repeated names with `getAll` in the recipe, indexed names documented for form libraries. Alternative: the Repeater writes names from a `name` prop and a field key, which it cannot do for the app's own fields.
11. **Hidden fields' values.** Recommended: kept in the page, not submitted and not checked, by a hidden disabled fieldset, with `submitsWhenHidden` for the other model. Alternative: kept and submitted (GOV.UK's), with the app making hidden fields not required and its server ignoring them.
12. **Reveal motion.** Recommended: none. Alternative: a 150ms fade under `prefers-reduced-motion: no-preference`, with no height animation.
13. **Field extras' API.** Recommended: the `FieldExtras` wrapper around any field. Alternative: `defaultOffer` and `suggestion` props on every field, which reads closer to the field and grows ten APIs.
14. **The suggested value.** Recommended: in this batch, beside the default, since it is the same line. Alternative: the default only, the suggestion when the consumer's coach computes one.
15. **Focus after an offer is taken.** Recommended: the field's control. Alternative: keep a "Default" line with no button and leave focus on its words, which a script cannot focus without a `tabIndex`.
16. **The Appearance row's look.** Recommended: SegmentedControl, with RadioGroup rows as `look="radio"`. Alternative: RadioGroup by default, roomier and closer to the account menu's original rows.
17. **The theme in the account menu.** Recommended: a submenu, the consumer's ask and Atlassian's, with `display="section"` for one level. Alternative: a section by default, one level and better on a phone.
18. **Theme and the SaveBar.** Recommended: applied at once, outside every form, never Changed. Alternative: part of a section's form, saved with it, which delays seeing the choice until Save.
19. **A theme script.** Recommended: none from the library; the server writes `data-theme` from the cookie, and a static site uses its own pre-paint script. Alternative: a `ThemeScript` part that renders an inline script, which the consumer's rule against injected scripts forbids for it.
20. **The docs header's color switch.** Recommended: ThemeSwitch, in this batch, so the docs draw the part they document. Alternative: keep the docs' own `Choice`.
21. **CopyButton's value.** Recommended: a string only, the page's own value. Alternative: an asynchronous getter through `navigator.clipboard.write` with a `ClipboardItem` of a promise, which keeps a masked value out of the page but depends on each engine's support for promised clipboard items (to verify in Safari 16.4, Chrome 111 and Firefox 128).
22. **Copy in a DescriptionList.** Recommended: a CopyButton in the row's `actions`, which keeps DescriptionList a server part. Alternative: a `copyValue` prop, shorter, which makes the row a client part.
23. **The NumberField warning.** Recommended: defer React Aria's blur handler by a microtask now, as a patch, and report it upstream. Alternative: keep the known warning and document that apps move focus in a frame, which leaves every app to find it.
24. **Leaving a dirty section.** Recommended: the app's `navigate` asks with `useConfirm`, shown in the recipe. Alternative: a library `useUnsavedChangesGuard` that wraps RouterProvider's `navigate`, which needs the router's own interception for Back and Forward, which Next does not offer.
25. **The danger zone's look.** Recommended: a plain Card with danger Buttons and a ConfirmDialog, since error means a failure or an invalid value. Alternative: GitHub's red-edged box, which would read as a card in error.
26. **PanelNavItem's description on the split face.** Recommended: not drawn there (16rem holds names), drawn on the list face. Alternative: drawn on both, a taller nav.

## 22. Size budget

Measured as the others, without React, React Aria, Lucide and `@internationalized/date`, to start at:

| Entry | Budget | Reason |
| --- | --- | --- |
| `{ PanelLayout, PanelNav, PanelNavItem, PanelSection, PanelRow }` | 2.5 kB | Two faces by CSS; the focus move, the remembered key and the face check; Link |
| `{ Repeater }` | 3 kB | Rows, legends, Add and Remove, the count and full line, the status, the focus table, the busy warning; Button |
| `{ ConditionalFields }` | 1 kB | Three attributes and a focus move |
| `{ FieldExtras }` | 1.5 kB | Two offers, their names and the focus move; Button |
| `{ ThemeSwitch, ThemeMenu }` | 2 kB | SegmentedControl or RadioGroup, the menu's section or submenu |
| `{ AccountMenu }` | 2 kB | The trigger, Avatar, Tooltip, the rail's face |
| `{ Menu, MenuItem, MenuSection, MenuSeparator, SubmenuTrigger }` | 2.5 kB | Menu's 2 kB entry and the submenu's re-export and chevron |
| `{ CopyButton }` | 2 kB | IconButton, Tooltip, the status and the timer |
| `{ NumberField }` | 3 kB, unchanged | The deferral adds about 0.1 kB |

The CSS adds about 6 kB to `styles.css` before compression: `panel-layout.css` about 2 kB (two faces, rows, Back, PanelRow), `repeater.css` about 1.5 kB, `field-extras.css` about 0.8 kB with ConditionalFields' reset, `account-menu.css` about 0.8 kB, `copy-button.css` about 0.3 kB, `menu.css` about 0.3 kB more. A part over its budget is reported with the number, as SidePanel's was, and the limit follows the rule: the measured entry rounded up to the next 0.5 kB, plus 0.5 kB; each entry is measured also with React Aria not ignored, and the commit records both.

## 23. Visual baseline estimate

Each visual story is baselined in five modes (Rounded light, Rounded dark, Soft light, Square light, Rounded light at 375px), and a story tagged `density` adds compact, six.

| Group | Visual stories | Of them with compact | Baselines |
| --- | --- | --- | --- |
| PanelLayout | 7 | 3 (`Default`, `CardPairs`, `InAppShell`) | 38 |
| Repeater | 8 | 2 (`Default`, `InCard`) | 42 |
| ConditionalFields | 3 | 1 (`LogoProvider`) | 16 |
| FieldExtras | 5 | 1 (`OnSelectAndSwitch`) | 26 |
| ThemeSwitch | 3 | 1 (`Segmented`) | 16 |
| AccountMenu | 5 | 1 (`InRail`) | 26 |
| Menu (`Submenu`) | 1 | 0 | 5 |
| CopyButton | 4 | 0 | 20 |
| Pages/Settings | 1 | 1 | 6 |
| Right to left (`PanelLayout`, `Repeater`, `AccountMenu`) | 3 | 0 | 15 |
| **New** | **40** | **10** | **210** |

Existing baselines: none should change. `menu.css` gains rules that match only `[data-has-submenu]`, which no existing story draws; NumberField's fix changes no pixel; the docs header's switch has no screenshot baselines. Starting from batch 6's count (2570 by its plan, to verify after both merges), expect 195 to 225 new files, depending on how the plan splits the faces and the menu's open states into stories. Any change to an existing baseline is investigated before it is committed, and every new one goes through `pnpm --filter @snapshot-ui/storybook visual:docker`.

## 24. Owner rulings and the consumer's answers (owner, 2026-10-19)

The owner approved this spec on 2026-10-19 and took every recommendation of section 21, all 26 open questions. The consumer then answered open question 1, and its answers change six earlier decisions; rulings 2 to 6 record them and name the sections they supersede. Each ruling names what it settles; the plan, `docs/plans/2026-10-19-settings.md`, names the task that builds it.

1. **Scope, release and order.** Every part of section 1 ships in one release, `@snapshot-ui/core` and `@snapshot-ui/react` 0.10.0, with a patch to `@snapshot-ui/charts` that moves its core peer to `^0.10.0`, after batches 5 (0.8.0) and 6 (0.9.0, charts 0.2.0) have merged and released. The plan builds the small independent parts first, as section 1 item 6 allows for the NumberField fix, so every later task composes parts that already exist: the NumberField fix, CopyButton, ConditionalFields, FieldExtras, Repeater, PanelLayout and PanelRow, then ThemeSwitch, ThemeMenu, AccountMenu and Menu's SubmenuTrigger with the docs header's switch, and last the Settings recipe, the guides and the changesets.
2. **The consumer's page** (open question 1, answered). Section 3 is the input as the consumer answered it, with these changes:
   1. **Eight sections, in an order the owner may change.** Coach, Notifications, Bank sync, AI assistant (an API key and a choice of model), Logos, Appearance, Data and Danger zone. The library's docs and examples call the fourth by a generic name, "AI assistant", and never name a product. Nothing in the library, the recipe or the tests depends on how many sections there are or in which order: the recipe holds them in one array and its tests walk the nav it draws. On a desktop `/settings` shows the list beside the first section (`isDefault` on whichever is first); on a phone the list alone; each section has its own address. This confirms open questions 2 and 3 and decided items 2 to 5. Appearance is now a section of its own (section 19's "in Data or its own card").
   2. **Zero to the app's maximum.** A Repeater's `minRows` is 0 by default and the consumer passes 0; `maxRows` is the app's. The consumer's form allows 0 to 3 tiers and its store accepts up to 5, so the recipe passes 3. Zero rows is a state of its own: the Repeater draws an empty line in the rows' place (`labels.empty`, the app's sentence, "No tiers. The coach never waits.") with Add under it. "All rows empty means none": the app drops a row whose fields are all empty when it saves; the Repeater reads no value (section 6.3). Revises section 6.2's `minRows` comment and 6.5's first item for the consumer's case; `minRows` above 0 still hides Remove at the minimum.
   3. **At the maximum, Add stays, disabled, with the reason.** Add is drawn disabled and a sentence after it says why, `labels.full(maxRows)`: "3 of 3. Remove a tier to add another." This reverses section 6.5's second item, decided item 9's "Add is replaced by a line at `maxRows`" and open question 9's recommendation. The library's Button does not keep a disabled button focusable: `isDisabled` writes the native `disabled`, which takes it out of the tab order (`Button.test.tsx`, "does not fire onPress when disabled"); only a pending Button stays focusable with `aria-disabled`, and React Aria's `allowFocusWhenDisabled` is undocumented and gives `tabIndex={-1}` only. So the reason is reachable three ways: the sentence is visible text in the reading order beside Add; Add's `aria-describedby` names it, so a screen reader reaches the disabled button in browse mode and hears "Add a tier, button, unavailable, 3 of 3. Remove a tier to add another."; and the add that reaches the maximum, which leaves focus in the new row, says it in the status: "Tier 3 added. 3 of 3. Remove a tier to add another." A focusable disabled Button is not built in this batch (the plan's open question 1).
   4. **No reorder.** Confirms open question 7. The app sorts the tiers by amount when it saves and refuses a repeated amount with a row error on the later row ("Another tier waits from $500.00").
   5. **A controlled Repeater and an uncontrolled one.** The app's forms are controlled and send typed objects to server actions, so the Repeater takes its rows as a value: `value` and `onChange(rows)` controlled, `defaultValue` uncontrolled, and `createRow()`, which makes a new row with its own id. They replace section 6.2's `rows`, `onAdd` and `onRemove`. The render function also receives `update(row)`, which writes one row back into the value. Controlled, the app reads its typed rows from its state and sends them; uncontrolled, the Repeater holds the rows' ids and order, the fields hold their values, and repeated names read with `FormData.getAll` stay the path of section 6.7. Both are documented and tested. Revises decided items 8 and 12.
   6. **The defaults.** The tiers default to $100 waits 3 days, $500 waits a week and $1,500 waits a month, and "Reset to default" applies to the tiers as a group: `FieldExtras` takes `scope="group"` and wraps a Repeater, its offer line under the whole set, its button named "Reset to default, Wait tiers", and after it is taken focus goes to the first field of the set, else Add (section 8). `controlRef` becomes optional for that reason. The cushion defaults to empty, which means one month of fixed bills, and offers a suggestion: "Suggested: $2,340, a month of your fixed bills", with Use. Push amounts default to off and the weekly email to on. These are the recipe's values; revises section 19's Coach item ("a default on the first tier's wait and a suggestion on its amount").
3. **Hidden fields** (open question 11, confirmed). Kept in the page and never submitted, by the hidden disabled fieldset of section 7.4: a secret key typed and then hidden is not sent, which a test proves. The weekly email's gate hides only a status line and "Send a test", with no inputs (section 7.2's last item, without the DescriptionList).
4. **The theme** (open questions 16 to 20, confirmed). Applied at once and outside every SaveBar. The app writes a cookie through a server action and the server renders `data-theme` on `<html>`, none for System. The library takes a controlled value and `onChange` only: ThemeSwitch drops section 9.2's `defaultValue`, and its `value` is `ThemeChoice | null`, where `null` shows no choice, for a value the browser learns only after hydration (the docs header's case). The library writes no storage and injects no script: the consumer's content security policy is nonce-locked (section 9.4).
5. **Confirmed as drafted.** One address per section and focus to the section's heading (decided items 2 and 5); focus to the next row's first field after a remove (decided item 10); CopyButton copies a string (decided item 23, open question 21).
6. **The NumberField reproduction** (section 12.2, risk R9, owner action 4, answered). A NumberField in plain mode with `minValue={0}`, inside a Dialog titled "Add a plan", the field labelled "Payments made": type 0, then press the next field or Save. The value saves and the console warns. The app moves no focus itself; the Dialog's focus handling may run on Save. The plan reproduces exactly this, a NumberField in a Dialog, typing 0, then pressing Save and, separately, the next field, in a play in Chromium, WebKit and Firefox, watches it fail before the fix where the engine logs the warning, and confirms that the microtask deferral of section 12.3 removes it; the case joins the unit tests too.
7. **Open questions 2 to 26** as recommended, except where ruling 2 changes them (questions 7 and 9) or ruling 4 confirms them:
   1. Question 2: the index shows the list beside a default section on a desktop, the list alone on a phone.
   2. Question 3: focus to the heading on both faces.
   3. Question 4: PanelRow in this batch, two pairs and the mirror; the spanning form later.
   4. Question 5: a 16rem side column and the split at 48rem.
   5. Question 6: fieldsets and buttons, not GridList.
   6. Question 7: no reorder (ruling 2.4).
   7. Question 8: after a remove, the first field of the row now in its place, with the status saying what left.
   8. Question 9: taken the other way by the consumer (ruling 2.3).
   9. Question 10: repeated names with `getAll` for the uncontrolled path, indexed names documented for form libraries; the controlled path of ruling 2.5 needs neither.
   10. Question 11: kept, not submitted, not checked (ruling 3).
   11. Question 12: no reveal motion.
   12. Question 13: the `FieldExtras` wrapper, now with a group scope (ruling 2.6).
   13. Question 14: the suggestion in this batch, beside the default.
   14. Question 15: after an offer is taken, focus to the field's control, or the group's first field.
   15. Question 16: SegmentedControl by default, RadioGroup rows as `look="radio"`.
   16. Question 17: a submenu by default, `display="section"` for one level.
   17. Question 18: applied at once, never Changed, outside every form.
   18. Question 19: no theme script from the library.
   19. Question 20: the docs header's color switch becomes ThemeSwitch in this batch.
   20. Question 21: a string only.
   21. Question 22: a CopyButton in a DescriptionList row's `actions`.
   22. Question 23: defer React Aria's blur handler by a microtask, as a patch, and report it upstream.
   23. Question 24: the app's `navigate` asks with `useConfirm` before leaving a dirty section.
   24. Question 25: the danger zone is a plain Card with danger Buttons and a ConfirmDialog.
   25. Question 26: PanelNavItem's description on the list face only.

## Owner actions

1. **Merge batches 5 and 6 first**, each with its Version Packages pull request, so this batch starts from 0.9.0 and the baseline count is known.
2. **Docker, for the baselines,** once after the last task.
3. **Devices and screen readers before the release:** VoiceOver on macOS and iOS and NVDA on Windows for section 13's list; a real iPhone and an Android phone at 320px to 430px for the list face, a section with Back, a Repeater's rows, the AccountMenu in the drawer with its submenu, and a CopyButton's status; Windows' contrast themes for the nav's current item and the submenu's chosen item. Recorded in each Appendix B section; until then "not yet verified".
4. **Ask the consumer for its NumberField reproduction** (section 12.2), to add as a test of the fix. Answered on 2026-10-19: section 24, ruling 6.
