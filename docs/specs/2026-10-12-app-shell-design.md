# App shell, Sidebar, BottomTabBar and compact density: design

Status: written for review on 2026-10-13. The rulings listed in section 10.1 were taken by the owner on 2026-10-12; everything else in this document is decided here and listed in section 10.2.
Parent spec: `docs/specs/2026-10-10-snapshot-ui-design.md`. This document pulls the phase 5 "AppShell" and "Sidebar" rows forward, adds a bottom tab bar and a density axis that the parent spec does not have, and answers the consumer's batch 1 request for its "Sidebar and AppShell", "Bottom tab bar" and "Compact density" parts. The design authority remains `docs/design-system.md`.
Sibling spec: `docs/specs/2026-10-13-shell-overlays-design.md` (the shared overlay layer, Dialog, Drawer, Sheet, Popover, Menu, Toast, CommandPalette and Tooltip). Section 2 lists what this document takes from it by name.

## 1. Goal

Give an app the frame it runs in: `AppShell`, the `Sidebar` that collapses to an icon rail and becomes a drawer on a narrow screen, `BottomTabBar` for phones, and a `data-density="compact"` axis that the shell and every control respond to. Ship it as part of the batch 1 minor release, after the overlays spec, because the Sidebar is built on its Drawer and Tooltip.

Build order inside this document, which is also the plan's order:

1. **Compact density** (section 5), first, because the shell parts read its tokens.
2. **AppShell and Sidebar** (sections 6 and 7).
3. **BottomTabBar** (section 8).

Out of scope, each recorded where it is deferred:

- Foldable sidebar groups (section 7.2, "Groups"). Static labelled groups only in this release.
- `PageHeader`, `SaveBar`, `AccountMenu` and `ThemeSwitch` (parent spec, phase 5). The shell leaves a slot for each.
- Replacing the docs site's hand-built rail (section 13.5). It stays as it is, and phase 5 replaces it under the parent spec's risk R8.
- A `SidebarAction` (an item with no `href`). `SidebarSearch` covers the one case both consumers have.
- The behavior of a fixed bar above the Android soft keyboard (section 8.2).

## 2. Depends on

These come from the overlays spec. Each is used by name, and the plan's first task for the shell checks that the names below are the ones it shipped. Where the overlays spec settled something differently, the plan adapts the one call site and records it.

| From the overlays spec | Used here as |
| --- | --- |
| `Tooltip` and `TooltipTrigger`, with `delay` 400 and `closeDelay` 120 by default, `isDisabled` on the trigger, a `shortcut` string on the tooltip, text at `--text-small` that wraps, never shown on touch, React Aria's description announcement accepted | The collapsed rail's names (section 7.2, "Collapsed") |
| `Drawer`, built on React Aria's Modal, `placement="start"` or `"end"`, a floating panel 16px from the edges, `--radius-stadium`, width `min(20rem, 100vw - 2rem)`, controlled with `isOpen` and `onOpenChange`, `isDismissable`, `hasCloseButton`, `aria-label`; focus moves to the child with `autoFocus` else the panel, Tab stays inside, Escape and a scrim press close, focus returns to the trigger, the page behind is `aria-hidden` and does not scroll | The Sidebar below 1024px (section 7.2, "The drawer") |
| `Sheet` and `SheetTrigger`, title required | The "More" story of the tab bar (section 8.2) |
| The overlay root copying `data-theme` and `data-shape` from its trigger's nearest scoped ancestor | Extended to `data-density`: the overlays spec's scope hook copies all three attributes. Only parts that read the size tokens change in a compact scope (section 5.4) |
| The `z` token group, `--z-modal` 1000 and `--z-toast` 1100 | This document adds `--z-header` 20 and `--z-chrome` 30 to the same group (section 6.3) |
| `overlay.css` and its 16px edge inset | The overlays spec's edge inset reads `var(--spacing-inset)` (section 5.1), so the rail, the drawer and the tab bar sit the same distance from the edge |
| A Drawer that renders its children edge to edge, `isPadded={false}` | The rail inside the drawer has its own paddings; it asks the Drawer for none |

From branch `feat/collapsible-card` (prototype `refs/prototype/1c`): `AriaName` in `packages/react/src/utils/accessible-name.ts`, used for every required name below.

New in this document, shared with the overlays spec if it lands first: `packages/react/src/utils/useControllableState.ts`, a hook of a dozen lines that gives a value, a default and a change callback the React Aria shape (`isX`, `defaultX`, `onXChange`). The library does not depend on `react-stately`, so it is written by hand, once, and both specs use the same file.

## 3. What the source app and the docs rail do

The parent spec says the Sidebar must reproduce the docs site's phase 1 rail (`apps/docs/components/shell/*`), and the source app's rail (`partials/shell/sidebar.hbs`, `styles/shell/sidebar.css`, `js/nav-state.js`, `js/nav-groups.js`, `js/rail-tip.js`) is where that rail came from. These are the behaviors the library keeps. Where the two disagree, the design document decides, and the departures from the docs rail are listed in section 13.5 so the phase 5 replacement knows what will move.

- **A floating rail.** Fixed, 16px clear of the viewport on three sides, the float surface with a hairline edge, the stadium corner and the level 1 lift. The workspace beside it is offset by the rail's full width, inset included.
- **Collapse to icons, remembered.** On a wide screen the rail collapses to a 72px column of 40px icons (104px with its insets), and the choice is remembered. The docs remember it in `localStorage` with a pre-paint script; the consumer app wants a cookie so the server paints the right width. Both are served by one CSS contract (section 6.2).
- **The labels stay for assistive technology.** Collapsed, a label is hidden from view and not removed, so an item's name never depends on the rail's state.
- **Names as tooltips while collapsed.** 400ms on hover, at once on keyboard focus, never on touch, Escape dismisses, and the pointer may cross onto the tip. The source also shows the search shortcut inside the search item's tip.
- **A collapse button** that is drawn small and hit at 40px, carries `aria-expanded` and `aria-controls`, and flips its name between "Collapse the menu" and "Expand the menu".
- **Group labels with a dot** that is grey until the group holds the current page, when it lights light signal orange and the label turns ink. The dot hangs into the gutter so the label text and the items share one axis.
- **The current item is an ink pill** with canvas text, marked `aria-current="page"`.
- **A drawer below 1024px.** The same rail slides in from the inline start over a scrim, opened from a menu button in the header. The docs added, by hand, everything a modal needs: focus into the current link, Tab held inside, Escape, the page behind inert and not scrolling, focus back to the menu button, and closing on any navigation, on pressing the page already open, and when the window grows past 1024px. The source drawer had none of that. The library gets it from the Drawer and keeps every rule.
- **The drawer ignores collapse.** A rail collapsed on a wide screen still opens as a full drawer with labels on a narrow one.
- **The current item is revealed on load** (source): the list is scrolled with `scrollTop`, never `scrollIntoView`, which would scroll every ancestor, and with a 40px margin.
- **Long labels wrap** (source), because truncation hides which page an item is.
- **Reduced motion stops the slide, the width change and the scrim fade.**

What the docs rail does that the design document does not, and that the library therefore does not reproduce: a 2px item gap, 15px items and 12px group labels with no token, canvas as the hover fill, and labels cut with an ellipsis. Section 7.3 gives the document's values; section 13.5 lists the diffs the docs will see.

## 4. Approach

**One density axis, not sizes.** `data-density="compact"` on any element remaps four size tokens for its subtree, exactly as `data-shape` remaps the radii. Components never know which density is active. The touch growth to 44px is one media-scoped token block, generated. The alternative, `size="sm"` props on Button, IconButton, Card, TextField and the rest, was rejected: it is a prop at every call site, a media query repeated in every component's CSS, and it cannot reach the plain-HTML version. `SegmentedControl size="sm"` stays as it is; it is a type and padding choice, and its height now comes from the axis like every other control's.

**AppShell owns layout state.** The collapsed state and the drawer state live on `AppShell`, because the workspace offset depends on the first and the header's menu button on the second. `Sidebar` reads both through context and renders the rail and, below 1024px, the drawer. Both are client components, but every prop is serializable except the callbacks, so a Next.js server layout passes the slots as elements and a thin client wrapper supplies the callbacks.

**The server paints the collapsed state from a prop.** `AppShell` sets `data-sidebar="collapsed"` on its root when collapsed, and the CSS keys on that attribute on any ancestor. Nothing is measured before first paint. The consumer reads its cookie into `defaultSidebarCollapsed`; the docs site keeps its pre-paint script and sets the attribute on `<html>`.

**Two DOMs for the drawer.** The permanent rail is in the document at every width and hidden by CSS below 1024px. The drawer is a second copy of the rail's slots, mounted inside the Drawer only while open. This costs a second render of the app's slot elements while the drawer is open, and it buys every modal behavior the docs hand-wrote. The one-DOM alternative, a CSS drawer with `visibility` tricks, `wrapTab` and `inert`, is exactly what the parent spec says the library should stop re-implementing.

**Static groups.** A `SidebarGroup` is a labelled list. The fold the source app has (a heading button, a grid-row transition, a per-browser memory) arrives in a later minor on the Disclosure mechanism the collapsible card settles, as `isCollapsible` on the same component, with no change to the markup an app writes today.

**Links go through `RouterProvider`.** Every link-bearing part is React Aria's `Link`, so one `RouterProvider` at the app's root makes every one of them navigate through the app's router, and `href` stays a real attribute that works with scripts off. The inherited `render` prop is the per-item escape hatch for an app that wants its own link element. There is no `linkComponent` prop (section 9).

**A docked tab bar.** The bar is flush with the bottom edge, with the safe area padded inside it. The document's "always floating" nav pill is a top-of-page object; a bottom bar is chrome at the device's edge, where the safe area lives, and floating it costs about 8px of label room per tab, which is what decides whether "Transactions" fits four tabs on a 375px phone (section 8.3).

Rejected along the way:

- **`NavigationTree`** (new in react-aria-components 1.22.1) for the Sidebar. It is built on `Tree`, so it is a `treegrid` with arrow-key roving focus and a collection model. A sidebar of links is `nav > ul > li > a`, read in tab order, which is what the design document and the consumer's own spec describe.
- **A `data-density="auto"` value** tied to a breakpoint. An attribute cannot respond to the viewport without script, and the server cannot know the viewport. The site sets the tokens under its own media query (section 5.4).
- **Growing comfortable controls to 44px on touch too.** It would change the published 0.1.0 sizes. The document's floor is 40px; the 44px target is the consumer's, and applies where they opt into compact.

## 5. Compact density

### 5.1 Tokens

Four new tokens carry the axis, and two more name values the shell shares. All are plain custom properties; `size` has no Tailwind namespace, so a Tailwind user writes `h-(--size-control)`, while `spacing` and `container` already flow into `tailwind.css` (`p-card`, `max-w-sidebar`).

| Token | Comfortable | Compact | Compact, `(pointer: coarse)` | Read by |
| --- | --- | --- | --- | --- |
| `--size-control` | 40px | 36px | 44px | Button `min-height`; IconButton width and height; the `sm` SegmentedControl track |
| `--size-field` | 48px | 36px | 44px | the text input's height; the `md` SegmentedControl track |
| `--size-target` | 40px | 40px | 40px | the floor every hit area is extended to. It has no density modes |
| `--spacing-card` | 32px | 20px | 20px | Card padding, the header band's bleed, and the docs' section band |
| `--spacing-inset` | 16px | | | how far floating chrome sits clear of the viewport edge: the rail, the drawer, the skip link, and the overlays spec's edge inset |
| `--container-sidebar` | 20rem | | | the rail's full width, insets included; 6.5rem under `data-sidebar="collapsed"` (section 6.2) |

In `tokens.json`:

```jsonc
"size": {
  "$type": "dimension",
  "control": {
    "$value": { "value": 40, "unit": "px" },
    "$description": "A control's height: buttons, icon buttons, the compact segmented track. The document's touch floor.",
    "$extensions": { "snapshot-ui": { "density": {
      "compact": { "value": 36, "unit": "px" },
      "compact-coarse": { "value": 44, "unit": "px" }
    } } }
  },
  "field": {
    "$value": { "value": 48, "unit": "px" },
    "$description": "A field's height: the text input, the segmented track.",
    "$extensions": { "snapshot-ui": { "density": {
      "compact": { "value": 36, "unit": "px" },
      "compact-coarse": { "value": 44, "unit": "px" }
    } } }
  },
  "target": {
    "$value": { "value": 40, "unit": "px" },
    "$description": "The floor a hit area is extended to. Not density-driven: nothing interactive drops below it."
  }
},
// under "spacing", after "page"
"card": {
  "$value": { "value": 32, "unit": "px" },
  "$description": "A card's own padding, and the bleed of its header band.",
  "$extensions": { "snapshot-ui": { "density": { "compact": { "value": 20, "unit": "px" } } } }
},
"inset": {
  "$value": { "value": 16, "unit": "px" },
  "$description": "How far floating chrome sits clear of the viewport edge: the rail, a drawer, the skip link."
},
// under "container", after "field"
"sidebar": {
  "$value": { "value": 20, "unit": "rem" },
  "$description": "The rail's full width, insets included. The workspace is offset by it.",
  "$extensions": { "snapshot-ui": { "sidebar": { "collapsed": { "value": 6.5, "unit": "rem" } } } }
}
```

Why these numbers, recorded in Appendix B (section 13.2):

- **40 and 48 are today's literals.** Button `min-height: 40px`, IconButton `40px`, the input `48px`, the `md` segmented option `2.5rem` in a track of `option + 0.5rem` (48px) and the `sm` option `2rem` (40px track). The two existing segmented sizes are exactly `--size-field` and `--size-control`, so today's rendering does not change.
- **36, not 32.** The consumer's table says toolbar controls 34 to 36px. 36 also keeps the hit-area extension at 2px a side, so two controls 8px apart never overlap: 32 would need 4px a side, which touches at an 8px gap and overlaps under it.
- **44 under `(pointer: coarse)`** is the consumer's number and WCAG 2.5.5. It applies only within compact. Consequence, stated plainly in the docs: on a touch screen a compact control is taller than a comfortable one. Comfortable keeps the document's 40px floor and does not change on touch.
- **20px card padding** is the consumer's number, and the value the docs site already hand-writes at 768px and below (`.card { padding: 24px 20px }`). The docs override and the "card does not narrow on a phone" rule in Appendix B both collapse into this one token.
- **16px inset** is the skipped step of the spacing rhythm. It is used here because it is what the docs rail, the source rail and the source save bar all use, and because chrome clear of the edge is a different thing from the space between two parts of a page. Recorded as the rhythm's one exception.
- **20rem and 6.5rem** are the docs rail's 320px and 104px. Rem, so that a larger root font widens the expanded rail and gives wrapped labels room; the collapsed rail gains room it does not need, which is harmless.

### 5.2 Generator

`build-tokens.js` gains two axes and one new feature, refinements:

```js
density: {
  attr: 'data-density', base: 'comfortable', caseInsensitive: true, variants: ['compact'],
  // A refinement writes one variant's values again, under a media query.
  refinements: { 'compact-coarse': { of: 'compact', media: '(pointer: coarse)' } },
},
sidebar: { attr: 'data-sidebar', base: 'expanded', caseInsensitive: true, variants: ['collapsed'] },
```

- The preprocessor accepts a refinement's name wherever it accepts a variant's.
- The CSS format emits, per axis and in `AXES` order (theme, shape, density, sidebar; the format iterates `AXES`, not the order tokens happen to appear in), each variant's block, then each refinement as `@media <media> { [attr="<of>" i] { ... } }`, then the base variant's block. For density: `[data-density="compact" i] { ... }`, `@media (pointer: coarse) { [data-density="compact" i] { ... } }`, `[data-density="comfortable" i] { ... }`, inside `@layer theme` after the shape blocks.
- A refinement block holds only the tokens that give the refinement a value; a token with a `compact` value and no `compact-coarse` value (`spacing.card`) keeps its `compact` value on touch. A token with a refinement value and no value for the refinement's `of` variant fails the build, naming the token, because the media block would then change a value that nothing set.
- `tokens.js` exposes `tokens.size.control.modes.density.compact` (`'36px'`) and `tokens.size.control.modes.density['compact-coarse']` (`'44px'`), and `tokens.container.sidebar.modes.sidebar.collapsed` (`'6.5rem'`).
- The base reset blocks, `[data-density="comfortable" i]` and `[data-sidebar="expanded" i]`, exist for a nested subtree that needs the base values back, as `[data-shape="rounded" i]` does. `AppShell` never writes `expanded` (section 6.2).

Tests that change: the cascade-order list and the `:root` variable contract in `tokens.test.js` (the six new variables, plus the overlays spec's two `z` tokens), the `axes.keys()` list in the followers test (`data-density`, `data-shape`, `data-sidebar`, `data-theme`), new `tokens.js` assertions for the density and sidebar modes, a refinement fixture next to `builds a fixture whose references it can follow`, and a refusal fixture for a refinement without its base variant. `tailwind.test.js` gains `--spacing-card`, `--spacing-inset` and `--container-sidebar`, and asserts that `size` and `z` do not appear.

### 5.3 Components

Every change below leaves comfortable rendering byte-for-byte as it is, which the existing visual baselines confirm: no baseline outside the new density mode changes in this task.

| File | Change |
| --- | --- |
| `button.css` | `min-height: var(--size-control)`. A hit-area pseudo-element, since the button is already `position: relative`: `.button::before { content: ''; position: absolute; inset-inline: 0; inset-block: calc(-1 * max(0px, (var(--size-target) - var(--size-control)) / 2)); }`. It reaches 2px a side in compact and 0 otherwise. |
| `icon-button.css` | `width` and `height: var(--size-control)`; `position: relative` and the same pseudo-element. The icon stays 20px. |
| `segmented.css` | `.segmented-track { --segmented-option-height: calc(var(--size-field) - 0.5rem); }` and `.segmented-sm .segmented-track { --segmented-option-height: calc(var(--size-control) - 0.5rem); }`. The track height stays `calc(option + 0.5rem)`. One hit-area rule for both sizes replaces the `sm`-only one: `.segmented:not([data-stacked]) .segmented-option::before { content: ''; position: absolute; inset-inline: 0; inset-block: calc(-1 * max(0px, (var(--size-target) - var(--segmented-option-height)) / 2)); }`, which is today's 4px for `sm` and 0 for `md` in comfortable, and 6px in compact (2px past the track, as the Button's). Stacked rows are `max(var(--size-target), var(--size-control))` tall in both sizes: 40, and 44 in compact on touch, so neighboring rows' hit areas never overlap. |
| `input.css` | `height: var(--size-field)` and `padding-block: 0`. The browser centers an input's text in its content box whatever the padding, so comfortable draws the same, and at 36px the 22px line is no longer taller than the content box. `textarea.css` restates its own `padding-block`, so the textarea is untouched. |
| `card.css` | The uses of `--spacing-separate` that mean the card's own padding read `--spacing-card`: the box padding, the header's negative bleed margins and inline padding, and the header's bottom margin. The header's bottom padding (title to rule) becomes `min(var(--spacing-peer), var(--spacing-card))`: 24px in comfortable, 20px in compact, so the rule is "20px everywhere inside the card" without a second token. The body's row gap stays `--spacing-peer` and its column gap `--spacing-separate`. |
| `checkbox.css`, `radio.css`, `switch.css`, `link.css`, `badge.css`, `kbd.css` | No change. Rows are 40px reading targets; a select-all checkbox in a 56px table row is fine. |
| `apps/docs/components/shell/shell.css` | The `.card` and `.card-header` phone overrides go; `site.css` sets `--spacing-card: 20px` under `@media (width < 768px)` instead (section 5.4). The `.docs-section > h2 + p` band reads `--spacing-card` for its bleed. |

Button's inline padding (24px) is left alone: the pill reads from its radius, not its padding.

### 5.4 Scope rules

- **Regions.** `data-density="compact"` on any element compacts its subtree; `data-density="comfortable"` inside it restores the defaults. Matching ignores case. A missing or unknown value is comfortable, with no script.
- **Phone-wide compact is the site's rule, not an axis value.** The tokens are public, so a site sets them where it knows the width:

  ```css
  @media (width < 768px) {
    :root {
      --spacing-card: 20px;
    }
  }
  ```

  The docs site does exactly this for its cards. A site that wants every control compact on a phone sets `--size-control` and `--size-field` the same way. This is documented on the theming page and nowhere else.
- **Popups keep their trigger's density.** A menu, a select popup or a tooltip portals to `body`, outside the region it opened from. The overlays spec's scope hook copies `data-density` from the trigger's nearest scoped ancestor, as it copies theme and shape. Only parts that read the size tokens change in a compact scope; a menu row's own 40px and 44px minimums are the overlays spec's and are not density-driven.
- **Comfortable does not change on touch.** A touch screen with no `data-density` draws 40px controls, as 0.1.0 does.

### 5.5 Storybook, baselines and docs

- **Toolbar global** `density` (Comfortable, Compact), written to `<html>` by `withTokens` as `data-density`, beside theme and shape. The story URL carries `globals=theme:light;shape:rounded;density:compact`.
- **Story tag `density`** adds one screenshot mode, light, Rounded, compact, to the tagged stories only. It runs at the story's width: 1280, or 375 for a story tagged `viewport-phone` (section 12.4). Tagged: Button `Primary` and `Secondary`, IconButton `Ghost` and `Outline`, SegmentedControl `Default` and `Compact`, Card `Parts`, TextField `Default`, and the shell stories named in sections 12.1 to 12.3. The screenshot file suffix is `-compact`.
- **A computed-height check** in `apps/storybook/tests/visual/cascade.spec.ts` opens the `Checks/Density` story (a Button, an IconButton, a `md` and a `sm` SegmentedControl, a TextField and a Card) with `density:compact` and reads heights: 36px for every control and 20px of card padding under the default desktop project, and 44px under a second `test.use` block with `devices['Pixel 7']` (`hasTouch`, `isMobile`). That block first asserts `matchMedia('(pointer: coarse)').matches` is true, so an emulation that does not report a coarse pointer fails loudly rather than passing an empty check. A third read with no density global confirms 40, 48 and 32.
- **`theming.mdx`** gains a "Density" section after "Corner shape": what compact changes (controls 36px, 44px on touch; cards 20px; nothing else), the nesting rule, the phone media-query pattern above, the popup rule, and the `<Preview name="density-controls" />` example.

## 6. AppShell

### 6.1 API

```ts
'use client';

export interface AppShellProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  /** The rail: a Sidebar. Fixed and floating; the workspace is offset by its width from 1024px up. */
  sidebar?: ReactNode;
  /** The page header, above the main content and outside it. Sticky to the top. */
  header?: ReactNode;
  /** The bottom tab bar. Below 1024px the workspace reserves room under its content for it. */
  bottomBar?: ReactNode;
  /** The page, rendered inside `<main>`. */
  children: ReactNode;
  /** Controlled: whether the rail is collapsed to icons. Pair it with `onSidebarCollapsedChange`. */
  isSidebarCollapsed?: boolean;
  /** Uncontrolled: the first value. A server layout passes what its cookie says, so the first paint is right. Default false. */
  defaultSidebarCollapsed?: boolean;
  onSidebarCollapsedChange?: (isCollapsed: boolean) => void;
  /** Controlled: whether the rail is open as a drawer. Only meaningful below 1024px. */
  isDrawerOpen?: boolean;
  /** Uncontrolled: the first value. Default false. */
  defaultDrawerOpen?: boolean;
  onDrawerOpenChange?: (isOpen: boolean) => void;
  /** The skip link's text. @default 'Skip to content' */
  skipLinkLabel?: string;
  /** The id of `<main>`, which the skip link targets. Default from `useId`. */
  mainId?: string;
  ref?: Ref<HTMLDivElement>;
}

export interface AppShellState {
  isSidebarCollapsed: boolean;
  setSidebarCollapsed: (isCollapsed: boolean) => void;
  isDrawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
  /** The id of `<main>`. */
  mainId: string;
}

/** The shell's state, for the parts and for an app's own header or palette. Throws outside an AppShell. */
export function useAppShell(): AppShellState;
```

- **Names.** The consumer asked for `collapsed` and `onCollapsedChange`. The library's React Aria naming gives `isSidebarCollapsed`, `defaultSidebarCollapsed` and `onSidebarCollapsedChange`, and the release note says so (section 13.4). Both states are controlled or uncontrolled through `useControllableState`.
- **`className` and `ref`** go on the root, and `className` merges after `app-shell`.
- **Slots render only when present** (`present()` from `utils/present.ts`): no empty header wrapper, no `data-has-sidebar` for a `false` slot.

A Next.js App Router layout:

```tsx
// app/(app)/layout.tsx, a server component
export default async function Layout({ children }) {
  const collapsed = (await cookies()).get('sidebar')?.value === 'collapsed';
  return (
    <Shell defaultSidebarCollapsed={collapsed} sidebar={<AppNav />} header={<AppHeader />} bottomBar={<AppTabs />}>
      {children}
    </Shell>
  );
}

// shell.tsx
'use client';
export function Shell(props: Omit<AppShellProps, 'onSidebarCollapsedChange'>) {
  return <AppShell {...props} onSidebarCollapsedChange={(collapsed) => { document.cookie = `sidebar=${collapsed ? 'collapsed' : 'expanded'}; path=/; max-age=31536000`; }} />;
}
```

The shell is uncontrolled with the cookie as its default: a full page load reads the cookie again, and in between the shell's own state is right. The docs site, which is static and has no cookie, feeds `isSidebarCollapsed` from `useSyncExternalStore` over its pre-paint attribute, as its `useRailCollapsed` does today.

### 6.2 Behavior

- **DOM order.** The skip link, then the `sidebar` slot, then the workspace (the header wrapper, then `<main>`), then the `bottomBar` slot. The Drawer the Sidebar opens is a portal and lands at the end of `body`.
- **The skip link** is the first tab stop: an `<a class="app-shell-skip" href="#<mainId>">`. `<main id tabIndex={-1} class="app-shell-main">` takes the focus it sends. Nothing else about `<main>` is styled.
- **The collapsed attribute.** The root carries `data-sidebar="collapsed"` while collapsed and no attribute otherwise. It never writes `"expanded"`, so an attribute set higher up, on `<html>` by a pre-paint script, is not reset by the root's base block. The CSS contract is "`data-sidebar="collapsed"` on any ancestor of the rail", and the generated token block (section 5.2) is what turns it into a width.
- **The workspace offset** is `--app-shell-sidebar`: `var(--container-sidebar)` when there is a sidebar and the viewport is 1024px or wider, else `0px`. The token itself is never overridden by a media query; the shell's own property is.
- **The bottom reserve** is `--app-shell-inset-block-end`, read by the workspace as `padding-block-end`. It is `calc(4rem + env(safe-area-inset-bottom, 0px))` below 1024px when there is a bottom bar, and `0px` otherwise. A future `SaveBar` adds its height to the same property, so the two never fight over the bottom edge; the overlays and phase 5 specs write to it, nothing reads any other.
- **The drawer closes** when the viewport grows to 1024px or wider (a `matchMedia('(width >= 1024px)')` change listener in an effect, guarded with `typeof window.matchMedia === 'function'` for test environments that lack it), on `popstate` (Back and Forward), when the Drawer reports `onOpenChange(false)` (Escape, a scrim press), and when a `SidebarItem` inside it is pressed (section 7.2). Anything else that navigates while the drawer is open, such as a command palette opened from the drawer, calls `closeDrawer()` from `useAppShell()`: the shell cannot see the router. An app may also call it from an effect on `usePathname()`.
- **Nothing runs at render that needs a browser.** `matchMedia` and `popstate` are effects. The first paint needs only `data-sidebar` and CSS.

### 6.3 Look and CSS

`packages/core/src/components/app-shell.css`, in `@layer components`, tokens only.

- **Root:** `.app-shell { --app-shell-sidebar: 0px; --app-shell-inset-block-end: 0px; }`, and `.app-shell[data-has-sidebar] { --app-shell-sidebar: var(--container-sidebar); }`. Under `@media (width < 1024px)`: `--app-shell-sidebar: 0px` again, and `.app-shell[data-has-bottom-bar] { --app-shell-inset-block-end: calc(4rem + env(safe-area-inset-bottom, 0px)); }`. The `4rem` is the tab bar's height, written in both files and tied by a test (section 12.3). `1024px` is `--breakpoint-md`, written out because a media query cannot read a variable, and tied by a test as `heading.css` is.
- **Workspace:** `.app-shell-workspace { margin-inline-start: var(--app-shell-sidebar); min-height: 100dvh; padding-block-end: var(--app-shell-inset-block-end); transition: margin-inline-start 200ms ease; }`. Reduced motion removes the transition.
- **Header wrapper:** `.app-shell-header { position: sticky; inset-block-start: 0; z-index: var(--z-header); }`. The look (fill, translucency) is the header's own, and `PageHeader` supplies it in phase 5. An app that does not want a sticky header puts it in `children` instead.
- **Main:** `.app-shell-main { outline: none; }`, so the skip link's landing never rings the whole page.
- **Skip link:** visually hidden (the clip pattern) until `:focus`, then `position: fixed; inset-block-start: var(--spacing-inset); inset-inline-start: var(--spacing-inset); z-index: calc(var(--z-chrome) + 1); min-height: var(--size-target); padding-inline: 1.25rem;` an ink pill (`--radius-pill`) with canvas text at `--text-action`, and an inset canvas ring (`outline: var(--focus-ring-width) solid var(--color-canvas); outline-offset: -4px`), the inverted ring an ink fill takes. Above the chrome, since it sits where the rail's corner is.
- **Z ladder.** Two tokens added to the overlays spec's `z` group: `--z-header: 20` for a sticky page header and `--z-chrome: 30` for fixed chrome (the rail, the collapse button, the tab bar, a save bar). Both sit under `--z-modal` 1000. A page's own sticky elements use `--z-header` or less; a test fails any `z-index` in core that is not a `var(--z-*)` or a `calc()` on one.
- **Forced colors:** nothing is a fill except the skip link, whose outline survives, so no block is needed.
- **Right to left:** every offset is logical, so the rail and the workspace mirror with `dir="rtl"`.

## 7. Sidebar

### 7.1 API

```ts
'use client';

export type SidebarProps = Omit<HTMLAttributes<HTMLDivElement>, 'children' | 'aria-label' | 'aria-labelledby'> &
  AriaName & {
    /** The brand row at the top: a SidebarBrand, or anything. */
    brand?: ReactNode;
    /** The search action under the brand: a SidebarSearch, or anything. */
    search?: ReactNode;
    /** SidebarGroup elements. */
    children: ReactNode;
    /** The account row at the bottom, ruled off from the list. The app reads `useSidebar().isCollapsed` to draw it icon-only. */
    footer?: ReactNode;
    /** @default 'Collapse the menu' */
    collapseLabel?: string;
    /** @default 'Expand the menu' */
    expandLabel?: string;
    /** The drawer's accessible name. @default 'Menu' */
    drawerLabel?: string;
    /** The drawer's close button. @default 'Close menu' */
    closeLabel?: string;
    ref?: Ref<HTMLDivElement>;
  };

export interface SidebarState {
  /** Whether this copy of the rail is collapsed to icons. Always false inside the drawer. */
  isCollapsed: boolean;
  /** Whether this copy is the drawer. */
  inDrawer: boolean;
}
/** For the brand, search and footer slots. Throws outside a Sidebar. */
export function useSidebar(): SidebarState;

export interface SidebarGroupProps extends HTMLAttributes<HTMLDivElement> {
  /** The group's label, drawn as an overline with a dot, and the list's accessible name. */
  label: ReactNode;
  /** Whether the group holds the current page: lights the dot and turns the label ink. */
  isCurrent?: boolean;
  /** SidebarItem elements. */
  children: ReactNode;
  ref?: Ref<HTMLDivElement>;
}

/** A count and the words that make it a name: "12" and "to review" read "Transactions, 12 to review". */
type ItemCount = { count?: undefined; countLabel?: undefined } | { count: number | string; countLabel: string };

export type SidebarItemProps = Omit<RACLinkProps, 'children' | 'className' | 'aria-current' | 'href'> &
  ItemCount & {
    href: NonNullable<RACLinkProps['href']>;
    /** The icon, 20px, hidden from assistive technology. */
    icon: ReactNode;
    /** The label. It is the accessible name, and it wraps when long. */
    children: ReactNode;
    /** Whether this is the page shown: sets `aria-current="page"` and draws the ink pill. */
    isCurrent?: boolean;
    className?: string | ((values: LinkRenderProps & { defaultClassName: string | undefined }) => string);
    ref?: Ref<HTMLAnchorElement>;
  };

export interface SidebarBrandProps extends Omit<RACLinkProps, 'children' | 'className'> {
  href: NonNullable<RACLinkProps['href']>;
  /** The mark, shown in both states. A 24px box. */
  mark: ReactNode;
  /** The name, shown beside the mark and hidden from view when collapsed. */
  children: ReactNode;
  className?: string;
  ref?: Ref<HTMLAnchorElement>;
}

export interface SidebarSearchProps extends Omit<RACButtonProps, 'children' | 'className'> {
  /** The label, such as "Search or jump to". */
  children: ReactNode;
  /** The shortcut as text, such as "Cmd K" or "Ctrl K", drawn in a Kbd and shown in the collapsed tooltip. */
  shortcut?: string;
  className?: string;
  ref?: Ref<HTMLButtonElement>;
}

export interface SidebarTriggerProps extends Omit<RACButtonProps, 'children' | 'aria-label' | 'aria-labelledby' | 'className'> {
  /** The accessible name. @default 'Open the menu' */
  label?: string;
  /** The IconButton look. @default 'outline' */
  variant?: IconButtonVariant;
  className?: string;
  ref?: Ref<HTMLButtonElement>;
}
```

- **`aria-label` is required** on `Sidebar`, through `AriaName`: it names the `<nav>` ("Main"). A sidebar that names nothing does not compile.
- **`count` and `countLabel` come together**, in the types. A count without its words would read "Transactions 12".
- **The current state is the app's.** The library cannot read the pathname: a Next layout does not re-render on navigation. The app's client component calls `usePathname()` and passes `isCurrent` to the item and to its group. No prefix-match helper ships; nested routes are the app's rule.
- **`render`, `routerOptions`, `onHoverStart` and `onFocus`** are inherited from React Aria's `Link` on `SidebarItem` and `SidebarBrand` (section 9).
- **Strings** have English defaults and a prop each.
- **The shortcut is a string the app chooses.** The server cannot know the platform. An app that wants "Cmd K" on Apple devices and "Ctrl K" elsewhere renders the server's choice and changes it after hydration, in state, never during the first render.
- `Sidebar` throws outside an `AppShell`: the collapsed and drawer states live there.

### 7.2 Behavior

**Markup.** The rail root is a `div.sidebar` with no landmark role. Inside, in order: the head (`brand`, and in the drawer the close button), the collapse button (after the brand, so the tab order matches where it sits), the `search` slot, `nav.sidebar-nav[aria-label]`, then the footer. Each `SidebarGroup` is a `div.sidebar-group` holding `p.sidebar-group-label[id]` and `ul.sidebar-list[aria-labelledby]`; each item is `li > a.sidebar-item`. The label is a paragraph and not a heading: it names the list, and a heading in every group would add six entries to the page's outline.

**Items.** A `SidebarItem` is React Aria's `Link`: an `<a>` with its `href`, press, hover and focus states, and `data-current` from React Aria while `aria-current` is set. The library sets `aria-current="page"` only when `isCurrent` is true, because React Aria treats any truthy `aria-current`, the string `"false"` included, as current. The icon is `aria-hidden`. The accessible name is the label's text, then, with a count, the count and a visually hidden `countLabel`: "Transactions, 12 to review". Enter follows the link; Space does nothing, as on any anchor. Tab walks the brand, the collapse button, the search action, every item in DOM order, then the footer. There is no roving focus and no arrow-key handling: a list of links is read in tab order.

**Groups.** Static. `isCurrent` on the group lights its dot and turns its label ink; the library does not inspect children to find out, because the app's items are often wrapped in the app's own components. Foldable groups come later as `isCollapsible` on this same component, on the Disclosure mechanism the collapsible card settles, with the inset ring the fold's clipping then needs (section 7.3, "Focus").

**Collapse.** The collapse button is React Aria's `Button` with `aria-expanded={!isCollapsed}`, `aria-controls` pointing at the rail's `useId`, and a visually hidden label that is `collapseLabel` while expanded and `expandLabel` while collapsed. Enter and Space toggle it through `setSidebarCollapsed`. It is not drawn below 1024px, and the drawer has none.

**Collapsed.** From 1024px up, under `data-sidebar="collapsed"` on any ancestor:

- Every label (brand name, search label, group labels, item labels, the count's number) is hidden from view with the clip pattern and stays in the accessibility tree, so no name changes.
- Items become 40px squares holding the icon, centered in the 72px rail. Every one is still a tab stop.
- Each item's count becomes an 8px dot at the icon's top-end corner, ink, and canvas on the current item. The number stays in the name and in the tooltip.
- `SidebarBrand`, `SidebarSearch`, every `SidebarItem` and the collapse button are wrapped in a `TooltipTrigger` whose `isDisabled` is `!isCollapsed`, so no tooltip exists while the rail is expanded or in the drawer. The tooltip's text is the label; with a count, the count and `countLabel` follow on a second line ("Transactions" over "12 to review"); the search tooltip passes `shortcut`. Delays, focus behavior, Escape, hoverability and the touch rule are the Tooltip's. React Aria announces a tooltip as its trigger's description, so a screen reader may hear an item's name twice; the overlays spec accepts that, and this document does too.
- The footer is centered and the app draws its account row icon-only by reading `useSidebar().isCollapsed`.

**The drawer.** Below 1024px the rail is `display: none`, so it leaves the tab order and the accessibility tree, and `Sidebar` renders the overlays spec's `Drawer` with `placement="start"`, `aria-label={drawerLabel}`, `isOpen={isDrawerOpen}`, `onOpenChange`, `hasCloseButton={false}` and `isPadded={false}`. Inside it, a second copy of the rail: `div.sidebar.sidebar-drawer` with the same slots and children, rendered under a `SidebarContext` of `{ isCollapsed: false, inDrawer: true }`, so the drawer ignores collapse whatever the attribute above says, including one on `<html>`. The head gets a close `IconButton` (Lucide `X`, `aria-label={closeLabel}`) at its end, drawn only here. The current `SidebarItem` in the drawer copy carries `autoFocus`, so focus lands on it when the drawer opens; with no current item the Drawer focuses its panel. Pressing any item in the drawer calls `closeDrawer()` in `onPress`, which also covers pressing the page already open, a case a path-change effect misses. The Drawer supplies the scrim, focus containment, `aria-hidden` outside, the scroll lock, Escape, the scrim press, focus restore to `SidebarTrigger`, the slide and its reduced-motion rule. `AppShell` closes it on widening and on `popstate` (section 6.2).

The cost: the app's slot elements render twice while the drawer is open. An app whose brand or footer carries a hard-coded `id` would duplicate it; the docs say to use `useId` there. The library's own ids all come from `useId`.

**`SidebarTrigger`.** An outline `IconButton` with Lucide's `Menu` icon, `aria-label={label}`, `aria-haspopup="dialog"` and `aria-expanded={isDrawerOpen}`, calling `openDrawer()`. No `aria-controls`: the drawer is not in the DOM while closed, and a reference to nothing is worse than none. The app places it in its header. CSS hides it from 1024px up.

**Reveal on mount.** In an effect on mount, the rail finds its `[aria-current="page"]` item; if the nav has a height (`clientHeight > 0`, which it does not while hidden below 1024px) and the item's bottom is below the nav's visible bottom, it sets `nav.scrollTop = item.offsetTop - 40`, clamped at 0. `scrollTop` only, never `scrollIntoView`, which scrolls every ancestor. Once, on mount: after that the reader chose the item and can see it. The drawer copy runs the same effect when it mounts, so a long list opened as a drawer also shows its current item.

**Server rendering.** The rail renders at every width; the Drawer renders nothing on the server and while closed. No `window`, `Intl`, `matchMedia` or measurement runs during render; the reveal and the media listener are effects.

**Right to left.** Every inset, margin and padding is logical. The chevron on the collapse button is mirrored with `scale: -1 1` under `[dir='rtl']`, after its rotation, so it points at the rail in both states. Tooltips take `placement="end"`. The Drawer resolves `start` from the locale.

### 7.3 Look and CSS

`packages/core/src/components/sidebar.css`, in `@layer components`, tokens only. The rail-local constants are custom properties on `.sidebar`:

```css
.sidebar {
  --sidebar-icon: 1.25rem;                                               /* 20px, the navigation icon */
  --sidebar-gutter: 0.75rem;                                             /* 12px, the one off-rhythm inset the rail uses */
  --sidebar-pill-inset: calc((var(--size-target) - var(--sidebar-icon)) / 2); /* 10px */
  --sidebar-row: max(var(--size-target), var(--size-control));          /* 40px; 44px in compact on touch */
}
```

Why: 12px is half the peer step and is the gutter the docs rail and the source both use for every inset inside the rail, so one constant serves the nav's padding, the search pill's margin, the icon-to-label gap and the group label's inset, and the head and foot sit at two gutters (24px, the peer step). 10px centers a 20px icon in a 40px pill, so the group label's first letter, an expanded item's icon and a collapsed item's icon share one axis. Items never shrink in compact: a navigation item is a reading target and the document's 40px floor holds; in compact on a touch screen it grows to 44px with every other control.

| Part | Rule |
| --- | --- |
| Rail | `position: fixed; inset-block: var(--spacing-inset); inset-inline-start: var(--spacing-inset); z-index: var(--z-chrome); display: flex; flex-direction: column; width: calc(var(--container-sidebar) - 2 * var(--spacing-inset));` (288px, 72px collapsed), `border: 1px solid var(--color-hairline); border-radius: var(--radius-stadium); background-color: var(--color-float); box-shadow: var(--shadow-lift);` `transition: width 200ms ease`. No `overflow: hidden`: the nav is the scroll container, and the collapse button hangs past the rail's edge. |
| Head | `display: flex; align-items: center; gap: var(--spacing-part); padding: var(--spacing-peer) calc(var(--sidebar-gutter) * 2) var(--sidebar-gutter);`. Collapsed: `justify-content: center; padding-inline: 0`. |
| Brand | `display: flex; align-items: center; gap: var(--sidebar-gutter); position: relative; color: var(--color-ink); text-decoration: none;` the mark a `1.5rem` box, the name at `--text-action`; `::after { content: ''; position: absolute; inset: -0.5rem }` brings the 24px row to a 40px target. Focus: the standard ring. |
| Collapse button | `position: absolute; inset-block-start: var(--spacing-peer); inset-inline-end: -1rem; z-index: 1; display: grid; place-items: center; width: 2rem; height: 2rem; padding: 0; border: 1px solid var(--color-frame); border-radius: var(--radius-pill); background-color: var(--color-float); color: var(--color-slate); box-shadow: var(--shadow-lift); cursor: pointer;` centered on the rail's end edge, with `::before { content: ''; position: absolute; inset: calc(-1 * (var(--size-target) - 2rem) / 2) }` for the 40px hit. The chevron is Lucide `ChevronLeft` at 16px, `rotate: 180deg` when collapsed, `transition: rotate 200ms ease`; hover (inside `@media (hover: hover)`) turns it ink; the standard focus ring. Hidden below 1024px. |
| Search | `display: flex; align-items: center; gap: var(--sidebar-gutter); margin: var(--spacing-part) var(--sidebar-gutter) 0; min-height: var(--sidebar-row); padding-inline: var(--sidebar-pill-inset); border: 1px solid var(--color-hairline); border-radius: var(--radius-pill); background-color: var(--color-canvas); color: var(--color-slate);` label at `--text-action` weight 500, `flex: 1; text-align: start`; the Kbd at the end. Hover: the 5% ink wash over canvas and ink text; press the same; the standard ring. Collapsed: `width: var(--size-target); margin-inline: auto; padding: 0; justify-content: center`, the Kbd hidden. |
| Nav | `flex: 1; min-height: 0; overflow-y: auto; padding: var(--spacing-peer) var(--sidebar-gutter);`. Collapsed: `padding-inline: 1rem; scrollbar-width: none`. (The icon moves 4px inward as the rail collapses, hidden by the width transition; under reduced motion it is an instant 4px step.) |
| Group | `.sidebar-group + .sidebar-group { margin-block-start: var(--spacing-peer); }` |
| Group label | `display: flex; align-items: center; gap: var(--spacing-part); margin: 0; padding: 0 var(--sidebar-pill-inset) var(--spacing-part); color: var(--color-slate); font-family: var(--font-sans); font-size: var(--text-overline); line-height: var(--text-overline--line-height); letter-spacing: var(--text-overline--letter-spacing); font-weight: var(--text-overline--font-weight); text-transform: uppercase; overflow-wrap: anywhere;` and the dot `::before { content: ''; flex: none; width: 6px; height: 6px; margin-inline-start: calc(-1 * (6px + var(--spacing-part))); border-radius: var(--radius-dot); background-color: color-mix(in srgb, var(--color-ink) 25%, transparent); }`. `.sidebar-group[data-current] .sidebar-group-label { color: var(--color-ink); }` and its dot `var(--color-signal-light)`. Collapsed: the text is clipped, the dot is centered with `margin-inline-start: 0`, and the row keeps `padding-block: var(--spacing-part)`. 14px is the document's minimum for sentences and above its 12px floor for short uppercase labels; `--text-overline` is the token for uppercase column headers, which a group label is. |
| List | `display: grid; gap: var(--spacing-part); margin: 0; padding: 0; list-style: none;` 8px: the document's "one nav item to the next". |
| Item | `display: flex; align-items: flex-start; gap: var(--sidebar-gutter); min-height: var(--sidebar-row); padding-block: calc((var(--sidebar-row) - 1.25rem) / 2); padding-inline: var(--sidebar-pill-inset); border-radius: var(--radius-pill); color: var(--color-ink); font-family: var(--font-sans); font-size: var(--text-action); letter-spacing: var(--text-action--letter-spacing); font-weight: var(--text-action--font-weight); line-height: 1.25; text-decoration: none; cursor: pointer; -webkit-tap-highlight-color: transparent;`. The icon is `flex: none; width: var(--sidebar-icon); height: var(--sidebar-icon); position: relative;` with its `svg` filling it. The label is `flex: 1; min-width: 0; overflow-wrap: anywhere;` and wraps; a 20px line at 16px type aligns with the 20px icon, so the icon sits beside the first line and a wrapped label grows the item. The count is `margin-inline-start: auto; color: var(--color-slate); font-size: var(--text-small); font-weight: 700; font-variant-numeric: tabular-nums;` plain text, no outline and no fill: at the end of a row the number reads as a count, and an outline inside a pill would be a pill in a pill. Collapsed: `width: var(--size-target); margin-inline: auto; padding: 0; justify-content: center;` and the count becomes `position: absolute; inset-block-start: -0.25rem; inset-inline-end: -0.25rem; width: 0.5rem; height: 0.5rem; border-radius: var(--radius-dot); background-color: currentColor;` on the icon's box with its number clipped. |
| Hover | Inside `@media (hover: hover)`, and not on the current item: `background-color: color-mix(in srgb, var(--color-ink) 5%, transparent)`, the document's hover on a float surface. The docs rail used the canvas fill, which measures the same strength (1.13 light, 1.11 dark); the wash is the rule in Appendix B. Press shows the same wash. |
| Current | `[aria-current='page'], [data-current]`: `background-color: var(--color-ink); color: var(--color-canvas);` and the count `color: inherit`. Written after hover, so it holds under the pointer. canvas on ink is gated at 16.25 and 19.31. |
| Focus | `outline: var(--focus-ring-width) solid var(--focus-ring-color); outline-offset: var(--focus-ring-offset);` outside the pill on every item, the current one included: an ink ring outside an ink pill reads against the float surface behind it, and nothing in a static group clips it (12px of nav padding, 16px collapsed, against a 4px ring). The document's inset ring exists for a foldable group whose fold clips, and arrives with `isCollapsible`, inverted to canvas on the current item as the segmented control's is. |
| Footer | `display: flex; align-items: center; justify-content: space-between; gap: var(--spacing-part); padding: var(--sidebar-gutter) calc(var(--sidebar-gutter) * 2); border-block-start: 1px solid var(--color-divider);`. Collapsed: `justify-content: center; padding-inline: 0`. |
| In the drawer | `.sidebar-drawer { position: static; inset: auto; width: auto; height: 100%; border: 0; border-radius: 0; background-color: transparent; box-shadow: none; }`: the Drawer draws the panel. Every collapsed rule is scoped `[data-sidebar='collapsed' i] .sidebar:not(.sidebar-drawer)`, so the drawer copy never collapses. The close button is `margin-inline-start: auto`. |
| Trigger | `.sidebar-trigger` hidden with `display: none` under `@media (width >= 1024px)`. |
| Below 1024px | `@media (width < 1024px) { .sidebar:not(.sidebar-drawer) { display: none; } }` |
| Motion | The rail's width, the chevron's rotation and the hover wash; all removed under `@media (prefers-reduced-motion: reduce)` in this file. Corners never animate: the docs recut theirs in `site.css`, which stays docs-only. |
| Forced colors | In `@media (forced-colors: active)`: the current item `background-color: Highlight; color: HighlightText;`, the collapsed count dot and the group dot `CanvasText`, the current group's dot `Highlight`. The rail's edge, the collapse button's edge and every outline survive on their own. |

Contrast, measured with `contrast.js` and recorded in Appendix B: ink on float 18.43 light, 17.42 dark; slate on float 5.49 light, 6.44 dark (the count, the group label, the search label); canvas on ink 16.25 and 19.31 (the current item); ink at 25% as a 6px graphic is a navigation cue beside a label that carries the words, recorded and not gated; the ink wash 1.10 and 1.14, a cue; the collapse button's frame edge on float 1.28 and 1.43, a cue, since the button's shadow and chevron show it.

## 8. BottomTabBar

### 8.1 API

```ts
'use client';

export type BottomTabBarProps = Omit<HTMLAttributes<HTMLElement>, 'children' | 'aria-label' | 'aria-labelledby'> &
  AriaName & {
    /** Three to five BottomTabBarItem elements. Development warns outside that range. */
    children: ReactNode;
    ref?: Ref<HTMLElement>;
  };

type TabCount = { count?: undefined; countLabel?: undefined } | { count: number | string; countLabel: string };

interface TabItemShared {
  /** The icon, 20px, hidden from assistive technology. */
  icon: ReactNode;
  /** The label, one line at the small step. It is the accessible name. */
  children: ReactNode;
  /** Draws the ink pill. On a link it also sets `aria-current="page"`. */
  isCurrent?: boolean;
}

/** A destination: an anchor through React Aria's Link. */
type TabItemLink = Omit<RACLinkProps, 'children' | 'className' | 'aria-current' | 'href'> & {
  href: NonNullable<RACLinkProps['href']>;
  className?: string | ((values: LinkRenderProps & { defaultClassName: string | undefined }) => string);
  ref?: Ref<HTMLAnchorElement>;
};

/** An action, such as "More": a button through React Aria's Button, which a SheetTrigger can wrap. */
type TabItemButton = Omit<RACButtonProps, 'children' | 'className'> & {
  href?: undefined;
  className?: string | ((values: ButtonRenderProps & { defaultClassName: string | undefined }) => string);
  ref?: Ref<HTMLButtonElement>;
};

export type BottomTabBarItemProps = TabItemShared & TabCount & (TabItemLink | TabItemButton);
```

- **`aria-label` is required** on the bar, through `AriaName`. The rail's nav and the bar's nav are never both in the tree, so both may be "Main".
- **`count` and `countLabel` come together**, as on the rail.
- **A button item** has no `href`. Wrapped in the overlays spec's `SheetTrigger`, it opens the sheet and carries `aria-haspopup` and `aria-expanded` from React Aria; given `onPress`, the app controls the sheet itself. `isCurrent` on a button draws the pill and sets no `aria-current`: a button is not the current page, and the sheet it opens carries its own current link.

### 8.2 Behavior

- **Markup.** `nav.tab-bar[aria-label] > ul.tab-bar-list > li > a.tab-bar-item` (or `button.tab-bar-item`). No tab roles: these are page links read in tab order, and "tab bar" is the part's name in prose only.
- **Links** are React Aria's `Link`, so `RouterProvider` and `render` apply (section 9). `aria-current="page"` only when `isCurrent`.
- **Names.** The label is the name; with a count, "Transactions, 12 to review" through a visually hidden `countLabel`. The icon is `aria-hidden`.
- **Hidden at 1024px and up** by `display: none`, with no script, so it also leaves the accessibility tree there.
- **Three to five items.** In development (`process.env.NODE_ENV !== 'production'`) the bar warns once per mount with `console.warn` when `Children.count(children)` is outside 3 to 5. It still renders. The warning runs on the server too, where `console.warn` is harmless.
- **Labels fit or ellipsize.** One line, `--text-small` size, and an ellipsis as a last resort; the accessible name always holds the full label. Section 8.3 gives the measured room.
- **Safe areas need `viewport-fit=cover`.** Without it iOS letterboxes the page and `env(safe-area-inset-bottom)` is 0. In Next.js: `export const viewport = { viewportFit: 'cover' }`. The docs page says so.
- **Server rendering.** Pure CSS and links; nothing is measured. It is a client component only because it is built on React Aria's `Link` and `Button`.
- **Not in this release:** when the Android soft keyboard opens, the layout viewport shrinks and a fixed bar rides above the keyboard. Recorded for a later minor.

### 8.3 Look and CSS

`packages/core/src/components/tab-bar.css`, in `@layer components`, tokens only.

| Part | Rule |
| --- | --- |
| Bar | `position: fixed; inset-block-end: 0; inset-inline: 0; z-index: var(--z-chrome); box-sizing: border-box; --tab-bar-height: 4rem; min-height: calc(var(--tab-bar-height) + env(safe-area-inset-bottom, 0px)); padding-top: 0.25rem; padding-bottom: calc(0.25rem + env(safe-area-inset-bottom, 0px)); padding-left: max(0.25rem, env(safe-area-inset-left, 0px)); padding-right: max(0.25rem, env(safe-area-inset-right, 0px)); border-block-start: 1px solid var(--color-hairline); background-color: var(--color-float);`. Docked and flush: no radius, and no shadow, because the shadow tokens cast downward and show nothing at a bottom edge; the float fill on canvas separates by tone in light and the hairline in dark. The safe-area insets are physical, so the two inline paddings are physical too. |
| List | `display: flex; margin: 0; padding: 0; list-style: none;` and `li { display: flex; flex: 1 1 0; min-width: 0; }` |
| Item | `display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 0.25rem; width: 100%; min-height: 3.5rem; margin: 0; padding-inline: 0.5rem; border: 0; border-radius: var(--radius-pill); background-color: transparent; color: var(--color-slate); font-family: var(--font-sans); font-size: var(--text-small); line-height: var(--text-small--line-height); font-weight: 500; text-decoration: none; cursor: pointer; -webkit-tap-highlight-color: transparent;`. 56px is over the consumer's 44px target and gives the icon, the gap and the label 20 + 4 + 20 with 6px above and below; the bar is 64px, which is `--tab-bar-height`. The label takes the small step's size and line height with the action weight, 500: 450 at 14px on a white bar reads light, and a destination's name is an action. |
| Icon | `.tab-bar-item-icon { position: relative; flex: none; width: 1.25rem; height: 1.25rem; }` with its `svg` filling it. |
| Label | `max-width: 100%; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;` |
| Count | `position: absolute; inset-block-start: -0.5rem; inset-inline-start: 0.75rem; display: inline-flex; align-items: center; justify-content: center; min-width: 1.125rem; height: 1.125rem; padding-inline: 0.25rem; border: 2px solid var(--color-float); border-radius: var(--radius-pill); background-color: var(--color-ink); color: var(--color-canvas); font-size: 0.75rem; line-height: 1; font-weight: 700; font-variant-numeric: tabular-nums;`. A solid disc at the icon's top-end corner, because a number cannot sit beside a stacked label. The 2px float border cuts it from the icon (a border, not a box-shadow, which the token rule forbids). 12px numerals are the Badge's and Kbd's size. It is a chip and takes the pill radius, so it follows the shape; a dot is only the collapsed rail's 8px mark. On the current item it inverts: `background-color: var(--color-canvas); color: var(--color-ink); border-color: var(--color-ink);`. |
| Hover | Inside `@media (hover: hover)`, not on the current item: the 5% ink wash and ink text. Press the same. |
| Current | `[aria-current='page'], [data-current], [data-current-action]`: `background-color: var(--color-ink); color: var(--color-canvas);`. A button item with `isCurrent` carries `data-current-action`, since React Aria's `data-current` belongs to links. Written after hover. |
| Focus | The standard ring outside every item; on the current item an inset canvas ring, `outline-color: var(--color-canvas); outline-offset: calc(-1 * (var(--focus-ring-width) + var(--focus-ring-offset)));`, the segmented control's rule, because an ink ring inside an ink pill is 1:1. |
| Wide | `@media (width >= 1024px) { .tab-bar { display: none; } }`, `1024px` tied to `--breakpoint-md` by a test. |
| Motion | None. The bar does not transition, so no reduced-motion block is needed; the test that asks for one only triggers on `transition` or `animation`. |
| Forced colors | In `@media (forced-colors: active)`: the current item `background-color: Highlight; color: HighlightText;` and its ring `outline-color: HighlightText;`; the count `background-color: CanvasText; color: canvas; border-color: canvas;` and on the current item `background-color: HighlightText; color: Highlight; border-color: Highlight;`. |
| Right to left | Logical insets; the count sits at the icon's inline-end corner; the order mirrors by itself. |

**Capacity, measured.** Sofia Sans at 14px, weight 500, in headless Chromium: "Transactions" 77.3px, "Documents" 70.4, "Accounts" 57.5, "Settings" 50.9, "Insights" 48.4, "Home" 35.9, "Goals" 33.5, "More" 30.6. Room per label in a docked bar with 4px of bar padding each side and 8px inside each item is `(width - 8) / n - 8`: 70px for four tabs at 320px, 83.8px at 375px, 87.5px at 390px; 54, 65 and 68px for five. So four tabs hold "Transactions" from 349px and never at 320px, where it ellipsizes; five tabs hold labels up to about 60px at 375px. A floating bar would have cost 8px per tab and missed "Transactions" at 375px by 1.5px, which is why the bar is docked. The docs page says "four short labels; five at most, each under about 60px at 375px", and the release note tells the consumer that its own four labels fit at 375px and that "Transactions" ellipsizes at 320px.

Contrast: slate on float 5.49 light and 6.44 dark (the resting label and icon, over 4.5 for text and 3 for an icon); canvas on ink and ink on canvas for the current item and the count, 16.25 and 19.31, gated already; the wash is a cue.

## 9. Navigation and routing

Documented once, on a new docs page, `apps/docs/content/docs/routing.mdx` ("Routing"), which `link.mdx`, `app-shell.mdx`, `sidebar.mdx` and `bottom-tab-bar.mdx` link to.

**`RouterProvider` is the way.** Every link-bearing part (Link, IconButton with `href`, SidebarItem, SidebarBrand, BottomTabBarItem, and later Breadcrumbs and Menu items) is React Aria's `Link`. With no provider, a click follows the `href` natively, so the server HTML is a real link and works with scripts off. With one provider at the app's root, a plain click calls the app's router, and a modified click (a modifier key, `target`, `download`, another origin) still falls through to the browser. For the Next.js App Router:

```tsx
'use client';
import { useRouter } from 'next/navigation';
import { RouterProvider } from 'react-aria-components';

declare module 'react-aria-components' {
  interface RouterConfig {
    routerOptions: NonNullable<Parameters<ReturnType<typeof useRouter>['push']>[1]>;
  }
}

export function ClientRouter({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  return <RouterProvider navigate={(href, options) => router.push(href, options)}>{children}</RouterProvider>;
}
```

**The trade-off.** React Aria renders a plain `<a>`, so Next does not prefetch these links when they enter the viewport; navigation then costs a request on press. An always-visible navigation is where prefetch pays. Two ways back, both documented:

1. **Prefetch on intent.** `onHoverStart` and `onFocus` pass through every item: `<SidebarItem href="/goals" onHoverStart={() => router.prefetch('/goals')} onFocus={() => router.prefetch('/goals')}>`.
2. **The `render` prop,** inherited from React Aria's `Link`, for Next's own `<Link>` and its viewport prefetch: `<SidebarItem href="/goals" render={(props) => <NextLink {...props} href="/goals" />}>`. A render function cannot cross a server-to-client boundary, so it is used from a client component, which the app needs anyway for `usePathname()`.

**No `linkComponent` prop.** It would be a second spelling of `render`, it cannot be serialized either, and it would have to be threaded through groups, items, the brand and the bar.

## 10. Decisions

### 10.1 Rulings taken by the owner

Density: a `data-density="compact"` axis built like `data-shape`, with `size.control`, `size.field`, `size.target` and `spacing.card`; 36px controls and fields with a mouse, 44px under `(pointer: coarse)`, generated; 20px card padding everywhere inside the card with the body row gap at 24px; comfortable unchanged, on touch too, and the inversion recorded; the site media-query pattern for phone-wide compact and no `auto` value; overlay roots copy `data-density`; a `density` story tag adding one mode for tagged stories; a computed-height test for both pointers; a Storybook toolbar global and a "Density" section on the theming page.

Navigation: `RouterProvider` as the way, the Next App Router snippet once, `render` as the per-item escape hatch with the prefetch trade-off and the `onHoverStart` and `onFocus` tip, no `linkComponent`.

Sidebar and AppShell: the collapsed state on AppShell as `isSidebarCollapsed`, `defaultSidebarCollapsed` and `onSidebarCollapsedChange`, with the consumer's names mapped in the release note; the server painting from the prop with no measurement; `data-sidebar="collapsed"` on an ancestor as the CSS contract; the rail snapped to the document (8px item gap, `--text-action` items, `--text-overline` group labels, the float surface, an outset ring while groups are static); static groups only; items with an icon, a label, a count and `aria-current="page"` with an ink pill; the collapsed rail with Tooltips, 8px count dots that are canvas on the current item, and a 40px-hit collapse button; wrapping labels; the current item revealed on mount through `scrollTop` in an effect; footer, brand and search slots; a Drawer below 1024px from a menu button AppShell exposes, with BottomTabBar as the other option and both in stories; the docs rail not replaced.

BottomTabBar: docked and flush with safe-area padding inside; 3 to 5 items with an icon, a `--text-small` label with no 12px exception, a solid-disc count and an ink pill current state; targets of at least 44px; hidden at 1024px and up by CSS; links through `RouterProvider` and `render`; "More" as a button the app wires to a Sheet, shown in a story; one shell property for the bottom reserve shared with a future SaveBar.

Everything: server-safe, light and dark, three shapes, right to left, WCAG 2.2 AA, reduced motion, `'use client'` only where interactive, exported from the react index with CSS in core and listed in `styles.css`, stories, baselines, docs pages, Appendix B derivations, minor changesets.

### 10.2 Decided here

1. Two tokens beyond the four: `--spacing-inset` (16px, the rhythm's recorded exception) and `--container-sidebar` (20rem, 6.5rem collapsed) with a generated `sidebar` axis, so the collapsed width is in `tokens.js` and `AppShell` writes only `collapsed`, never `expanded`.
2. `--z-header` 20 and `--z-chrome` 30 join the overlays spec's `z` group; the skip link sits at chrome plus one.
3. Generator refinements (`compact-coarse` under `(pointer: coarse)`), emitted in `AXES` order; a refinement without its base variant fails the build.
4. `--size-target` has no density modes.
5. One hit-area formula from `--size-target` for Button, IconButton and both segmented sizes; stacked segmented rows are `max(target, control)`.
6. The input's `padding-block` becomes 0 with `height: var(--size-field)`; the card's under-title padding is `min(peer, card)`.
7. The rail's hover is the 5% ink wash, not the docs' canvas fill.
8. A 12px rail gutter used for every inset in the rail; a 10px pill inset derived from the target and the icon; items at `--text-action` with a 1.25 line height, the icon beside the first line.
9. Rail items and the search action never shrink in compact and grow to 44px in compact on touch.
10. The expanded count is slate 14px/700 tabular text at the row's end; the tab bar's count is a chip with the pill radius and a 2px float border.
11. The collapse button straddles the rail's end edge, 24px from the top, after the brand in DOM order; the rail has no `overflow: hidden`.
12. `SidebarGroup` takes `isCurrent` explicitly; no child inspection.
13. `SidebarBrand`, `SidebarSearch` and `SidebarTrigger` ship as parts; `SidebarSearch.shortcut` is a string drawn in a Kbd and passed to the collapsed tooltip.
14. The drawer copy uses the Drawer with `hasCloseButton={false}` and `isPadded={false}`, draws its own close button in the brand row, gives the current item `autoFocus`, and keeps the Drawer's elevation.
15. `SidebarTrigger` is an outline IconButton with `aria-haspopup="dialog"` and `aria-expanded`, and no `aria-controls`.
16. The reveal runs once on mount and skips a nav with no height; the drawer copy reveals on its own mount.
17. `Sidebar` throws outside `AppShell`; `BottomTabBar` works anywhere, and only its reserve needs the shell.
18. The header slot's wrapper is sticky at `--z-header`; `<main>` has `tabIndex={-1}` and no outline.
19. The tab bar has no shadow and no radius; items are 56px; the label is the small step's size at weight 500; a development warning outside 3 to 5 items; the bar's `4rem` is written in both files and tied by a test.
20. `isCurrent` on a button item draws the pill through `data-current-action` and sets no `aria-current`.
21. The collapsed tooltip shows the count and its words on a second line.
22. Story tags `viewport-phone` (the four theme and shape modes at 375px) and `viewport-desktop` (the four at 1280px); `density` adds its mode at the story's width.
23. Docs: a "Routing" page; `app-shell.mdx`, `sidebar.mdx` and `bottom-tab-bar.mdx`; shell examples in a `contain: layout` frame and the tab bar example in a phone-width frame that forces the bar visible with an unlayered docs rule.
24. `useControllableState` in `utils`, shared with the overlays spec.
25. One batch 1 minor release with three changesets; size budgets to start at 2 kB for AppShell, 3 kB for Sidebar and 1.5 kB for BottomTabBar.

## 11. Accessibility

- **Landmarks.** `AppShell` renders one `<main>` and the skip link to it. The rail's `<nav>` and the bar's `<nav>` are each named by a required `aria-label`, and never both in the tree. The rail root and the groups carry no landmark role; each group's list is named by its label.
- **Keys, Sidebar.**

  | Key | Does |
  | --- | --- |
  | Tab, Shift+Tab | Walks the brand, the collapse button, the search action, every item in order, then the footer. Collapsed, every icon is still a stop. |
  | Enter | Follows the item's link, or opens the search. Space does nothing on a link. |
  | Enter, Space on the collapse button | Toggles the rail; its name flips between the two labels. |
  | Escape | Closes an open tooltip without moving focus. In the drawer, closes the drawer and returns focus to the menu button. |

- **Keys, BottomTabBar.** Tab and Shift+Tab walk the items; Enter follows a link or presses the "More" button; Space presses a button only.
- **The drawer** opens with focus on the current item, holds Tab inside, hides the page behind it from assistive technology, locks its scroll, and returns focus to `SidebarTrigger`; all from the Drawer.
- **Names never depend on state.** A collapsed label is clipped, not removed; a count's words are always in the name.
- **Axe** passes in light and dark for the expanded rail, the collapsed rail, the open drawer, the tab bar, and a shell with all three slots.
- **Targets.** Nothing under 40px: items, the brand, the search, the collapse button and the tab items are at or over it, and the tab items at 56px are over the consumer's 44px.
- **Contrast** is listed in sections 7.3 and 8.3, and every new pair is in Appendix B.
- **Right to left, forced colors and reduced motion** are covered part by part above.

## 12. Testing

### 12.1 Compact density

**Core tests.**

- `tokens.test.js`: the cascade order with the density and sidebar blocks; the `:root` contract; `tokens.js` modes for `size.control`, `size.field`, `spacing.card` and `container.sidebar`; a fixture with a refinement, asserting the `@media (pointer: coarse)` block and its position; a fixture with a refinement and no base variant value, asserting the build fails and names the token.
- `css.test.js`: `button.css` has `min-height: var(--size-control)` and the hit-area pseudo-element; `icon-button.css` reads `--size-control` for both dimensions; `segmented.css` derives both option heights from the size tokens and has the one hit-area rule; `input.css` has `height: var(--size-field)`; `card.css` reads `--spacing-card` for its padding and bleed and `min(var(--spacing-peer), var(--spacing-card))` under the title; none of the five files has a literal `40px`, `48px` or `32px` height or padding left.
- `tailwind.test.js`: `--spacing-card`, `--spacing-inset` and `--container-sidebar` are in the theme; `--size-*` and `--z-*` are not.

**Storybook.** `Checks/Density` renders the controls and the card; the `cascade.spec.ts` test reads their heights under both pointer projects (section 5.5). The existing Button, IconButton, SegmentedControl, TextField and Card baselines must not change; the `density` tag adds the compact ones.

**Docs e2e.** The theming page's new example is part of the docs page loops already (axe, no sideways scroll, server render).

### 12.2 AppShell and Sidebar

**Unit tests (React).**

- `AppShell`: the skip link is the first focusable and targets `<main>`'s id; `mainId` is honored; `data-sidebar="collapsed"` is present with `defaultSidebarCollapsed` and with `isSidebarCollapsed`, and absent otherwise, and never `"expanded"`; `data-has-sidebar` and `data-has-bottom-bar` follow the slots and a `false` slot renders no wrapper (`empty-parts.test.tsx`); pressing the collapse button calls `onSidebarCollapsedChange` and, uncontrolled, toggles the attribute; `useAppShell` throws outside; a `popstate` event closes an open drawer; a `matchMedia` change to wide (mocked) closes it; `className` and `ref` reach the root.
- `Sidebar`: the `<nav>` is named by `aria-label`; each list is named by its group's label through `aria-labelledby`; an item has `aria-current="page"` and `data-current` only when `isCurrent`; an item with a count has the name "Transactions, 12 to review" and the words are not visible; the collapse button carries `aria-expanded`, `aria-controls` pointing at the rail, and flips its name; collapsed, every label still gives its item its name (`toHaveAccessibleName`); hovering an item while collapsed shows the tooltip after the delay (fake timers), and never while expanded; the drawer copy renders inside a `dialog` named `drawerLabel` when `isDrawerOpen`, its current item has focus, its close button calls `onDrawerOpenChange(false)`, pressing an item calls it too, pressing the current item too; with the attribute on `<html>`, the drawer copy still shows its labels; a `RouterProvider` receives the item's `href` on click; `render` reaches the anchor; the reveal sets `scrollTop` when the current item lies below the nav's visible bottom (`clientHeight` and `offsetTop` stubbed) and not otherwise; `useSidebar` reports `isCollapsed` and `inDrawer`; `className` and `ref` plumbing on every part; a type test that a `Sidebar` without a name, and a `SidebarItem` with `count` and no `countLabel`, do not compile.
- `server-render.test.tsx`: an `AppShell` with all three slots, collapsed and expanded, renders in Node with the attribute right and no `dialog`; `Sidebar`, `SidebarGroup`, `SidebarItem` with a count, `SidebarBrand`, `SidebarSearch` and `SidebarTrigger` each render.
- **Axe** on every state above.

**Core tests** (`css.test.js`, a `describe` per file for `app-shell.css` and `sidebar.css`): in the layer; reduced motion present; no system color outside the forced-colors block; the forced-colors block gives the current item `Highlight` and `HighlightText`; hover only inside `@media (hover: hover)`; the focus ring in the token and never ink; `z-index` only through `var(--z-*)` or a `calc()` on one; the written `1024px` equals `--breakpoint-md` in both files; `.sidebar:not(.sidebar-drawer)` is `display: none` in the narrow block and `.sidebar-trigger` in the wide one; every collapsed rule is scoped with `:not(.sidebar-drawer)`; the rail's width is `calc(var(--container-sidebar) - 2 * var(--spacing-inset))`.

**Stories.** `Components/AppShell`: `Desktop` (tags `viewport-desktop`, `density`: the rail with three groups and a footer, a header, a card and a button in the page), `Collapsed` (`viewport-desktop`), `Phone` (`viewport-phone`: a header with the trigger, the page, a tab bar), `PhoneDrawerOpen` (`viewport-phone`, `defaultDrawerOpen`), `RightToLeft` (`viewport-desktop`, English labels under `dir="rtl"`), and `no-visual` plays: `CollapseToggle` (press, `aria-expanded`, the attribute), `DrawerKeyboard` (open from the trigger, focus on the current item, Escape closes, focus returns), `DrawerClosesOnItemPress`, `CollapsedTooltip` (hover an icon, the tooltip appears in `document.body` after 400ms), `RevealsCurrent` (a long list, `scrollTop` is over 0 after mount). `Components/Sidebar`, each inside an `AppShell` decorator: `Expanded`, `Collapsed`, `LongLabels` (a label that wraps to two lines, expanded and collapsed), `Counts` (expanded number and collapsed dot, one on the current item), `KeyboardFocus` (a play that tabs to an item), `KeyboardFocusOnCurrent`, `Drawer` (`viewport-phone`), `DrawerRightToLeft` (`viewport-phone`, `dir="rtl"`).

**Docs e2e.** `app-shell` and `sidebar` join `components/meta.json` and so the loops: axe in both themes, no sideways scroll at 320 and 375, the long-text check (`LONG_TARGETS`: `['.stage .sidebar-item-label']` for sidebar, `['.stage .app-shell-main p']` for app-shell), and the server-rendered check (`['.stage .sidebar']`, `['.stage .app-shell']`). The docs' own rail tests are untouched (section 13.5).

### 12.3 BottomTabBar

**Unit tests (React).** The `<nav>` is named; items are `ul > li > a` or `li > button`; a link item has `aria-current="page"` only when `isCurrent`, and a button item never does; a count is in the name and its words are not visible; `console.warn` is called for two and six items and not for three, four or five, and only outside production; a `RouterProvider` receives the `href`; `render` reaches the anchor; a button item inside a `DialogTrigger` carries `aria-expanded`; `className` and `ref` on the bar and on both item forms; a type test that a bar without a name does not compile; a server render in Node; axe.

**Core tests** (`describe` for `tab-bar.css`): in the layer; no system color outside the forced-colors block; the block gives the current item `Highlight` and `HighlightText` and the ring `HighlightText`; hover inside `@media (hover: hover)`; the focus ring token, with the inset canvas inversion on the current item; `z-index` through the token; `display: none` in the `@media (width >= 1024px)` block with `1024px` equal to `--breakpoint-md`; `env(safe-area-inset-bottom` present in the bar's padding; `--tab-bar-height: 4rem` here equals the `4rem` in `app-shell.css`'s reserve; no `box-shadow` on the bar; `font-size: var(--text-small)` on the item.

**Stories.** `Components/BottomTabBar`, all `viewport-phone`: `Default` (also `density`: Home current, Transactions with a count of 12, Goals, More as a button), `FiveItems`, `LongLabel` (one label that ellipsizes at 375px), `CountOnCurrent`, `KeyboardFocusOnCurrent` (a play that tabs to the current item; the inset canvas ring), `RightToLeft`; and `no-visual`: `MoreOpensSheet` (a `SheetTrigger` around the More item, a Sheet titled "More" holding Accounts, Documents, Insights, Ask and Settings as links; the play presses More, asserts the dialog, presses Escape, asserts focus back on More), `Hover`.

**Docs e2e.** `bottom-tab-bar` joins the loops; it is listed in `NO_LONG_TEXT` ("a tab label is one word on one line and ellipsizes as a last resort; the name holds the full label"); server rendered as `['.stage .tab-bar']`.

### 12.4 Harness changes

`apps/storybook/tests/visual/stories.spec.ts` reads each entry's tags: `viewport-phone` runs the four theme and shape modes at 375px (light and dark Rounded, light Soft, light Square) and no 1280px mode; `viewport-desktop` runs the four at 1280px and no 375px mode; `density` adds `{ light, rounded, compact }` at the story's width, with the `-compact` suffix; untagged stories keep the five modes. The decorator writes `data-density` from the global. Baselines are generated in the Docker image as always.

## 13. Docs and release

### 13.1 Pages

- `apps/docs/content/docs/components/app-shell.mdx`: the layout and its slots, the collapsed state and the cookie pattern with the server-layout snippet, the skip link and `<main>`, the drawer and the trigger, the bottom reserve, `useAppShell`, props tables for `AppShell`, the Accessibility section with the keys, and the design rules. Examples: `app-shell-basic`, `app-shell-collapsed`, `app-shell-phone`, each inside a `.stage-shell` frame (`width: 100%; height: 30rem; contain: layout; overflow: hidden; position: relative`, which makes the frame the containing block for the fixed rail) and the phone one inside a `.stage-phone` frame (375px wide) whose unlayered docs rule forces `.tab-bar` visible.
- `apps/docs/content/docs/components/sidebar.mdx`: groups, items, counts, the brand and search slots, collapse and tooltips, the drawer, `isCurrent` from `usePathname()`, `useSidebar`, props tables for every part, the keys, and the design rules (four short groups; counts only for things that need review; never a prefix match without a rule). Examples: `sidebar-groups`, `sidebar-collapsed`, `sidebar-drawer` (a button that opens the real drawer over the docs page), `sidebar-long-labels`.
- `apps/docs/content/docs/components/bottom-tab-bar.mdx`: items and counts, the More button with a Sheet, capacity and the label rule, `viewportFit`, the hide rule, props tables for the bar and both item forms, the keys, and the design rules. Examples: `bottom-tab-bar-basic`, `bottom-tab-bar-more`.
- `apps/docs/content/docs/routing.mdx`: section 9, with the snippet, the trade-off, the two ways back, and a line on `routerOptions`.
- `apps/docs/content/docs/theming.mdx`: the "Density" section, with `density-controls`.
- `components/meta.json` lists the three pages alphabetically; `examples/index.ts` registers every example; the docs `meta.json` adds "routing" after "theming".

### 13.2 Design record

New sections in `docs/design-system.md`, Appendix B, written before each part is built, measured with `contrast.js`:

- **"Compact density"**: the four tokens and their numbers (section 5.1), the touch inversion, the hit-area formula, the card's `min()` rule, and the site media-query pattern.
- **"Floating chrome and the shell"**: `--spacing-inset` as the rhythm's exception, `--container-sidebar` and the sidebar axis, `--z-header` and `--z-chrome` under the overlays' ladder, the sticky header wrapper, the skip link.
- **"Sidebar"**: every value in section 7.3 with its rule, the measured pairs, the four departures from the docs rail and the wash, the outset ring and the reason it stays outset until groups fold, the 4px icon travel.
- **"BottomTabBar"**: docked against the document's floating nav pill and why, the 56px item, the label at the small step's size and the action weight, the chip, the capacity table, the forced-colors rules.
- The "Still missing" note on navigation state is updated, and the Card section's "does not narrow on a phone" paragraph points at `--spacing-card`.

### 13.3 Changesets and packaging

- `.changeset/density.md`: core and react, minor. The axis, the four tokens, the generator's refinements, and the component CSS that now reads them; comfortable unchanged.
- `.changeset/app-shell.md`: core and react, minor. `AppShell`, `useAppShell`, `Sidebar`, `SidebarGroup`, `SidebarItem`, `SidebarBrand`, `SidebarSearch`, `SidebarTrigger`, `useSidebar`; `--spacing-inset`, `--container-sidebar`, `--z-header`, `--z-chrome`; `app-shell.css` and `sidebar.css`.
- `.changeset/bottom-tab-bar.md`: core and react, minor. `BottomTabBar`, `BottomTabBarItem`; `tab-bar.css`.
- Exports from `packages/react/src/index.ts` with their prop types; the three CSS files in `styles.css` after `card.css` and the overlays' files, since `sidebar.css` and `tab-bar.css` assume the overlay layer's z tokens exist.
- `.size-limit.json` entries: `AppShell` 2 kB, `Sidebar` 3 kB (it pulls Link, Button, Tooltip, Drawer and IconButton), `BottomTabBar` 1.5 kB. Raised only with the reason in the pull request.
- `test/server-render.test.tsx` lists every new client part; `test/server-components.test.tsx` gains nothing, since none of this batch is static.

### 13.4 Release note

In the batch 1 release notes, for the consumer:

- The names: `collapsed` is `isSidebarCollapsed` (or `defaultSidebarCollapsed` from the cookie) and `onCollapsedChange` is `onSidebarCollapsedChange`, both on `AppShell`.
- The rail is navigation and keeps its 40px rows in compact; it grows to 44px in compact on touch like every control.
- The tab bar: Home, Transactions, Goals and More fit at 375px; "Transactions" ellipsizes at 320px, and the name is never cut.
- `viewportFit: 'cover'` is needed for the safe area.
- The drawer and a command palette: call `closeDrawer()` from `onAction`.
- The theming page's "Density" section for the phone-wide pattern.

### 13.5 The docs site's rail, not replaced

The docs keep `apps/docs/components/shell/*` as they are, with `data-rail` on `<html>` and the hand-written drawer. Under the parent spec's R8, phase 5 replaces `DocsShell` with `AppShell` and `Sidebar`, feeds `isSidebarCollapsed` from `useSyncExternalStore` over a pre-paint attribute renamed to `data-sidebar`, drops `lib/focus-trap.ts`, and turns `apps/docs/tests/docs.spec.ts`'s rail tests (collapse and memory, the closed rail out of the tree, the drawer's focus and Escape, search's Escape, widening, the close button, the current page closing the drawer, Back and Forward) into tests of the library parts. The diffs the docs will see then, each a snap to the design document and recorded here so nobody takes them for regressions: item gap 2px to 8px (six pixels per item), item type 15px to 16px, group label 12px to 14px, hover from the canvas fill to the ink wash, the collapse button moving from beside the rail to straddling its edge, labels wrapping instead of ellipsizing, and every corner transition gone from the rail. The only docs change in this batch is the card padding override moving to `--spacing-card` (section 5.3).

## 14. Risks

- **R1: the Drawer's shape.** The Sidebar is built on the overlays spec's Drawer and Tooltip, and both are being written in parallel. Mitigation: section 2 names every dependency; the plan's first shell task reads the shipped Drawer and Tooltip and adapts the two call sites before the Sidebar is written. If the Drawer cannot render edge to edge, the rail's drawer copy sets its own negative margins against the Drawer's padding, and the record says so.
- **R2: two copies of the app's slots.** While the drawer is open the brand, search and footer render twice; a hard-coded id in them would collide. Mitigation: the docs say to use `useId`; the library's ids all do. Fallback, if a consumer cannot: the one-DOM CSS drawer behind the same API, which is what the docs have today.
- **R3: coarse-pointer emulation in CI.** The 44px check depends on Playwright's touch emulation reporting `(pointer: coarse)`. Mitigation: the test asserts the media query before the heights, so a silent emulation failure cannot pass.
- **R4: the density change touches five shipped files.** Button, IconButton, SegmentedControl, the input and Card now read tokens where they had literals. Mitigation: comfortable values are the same numbers, and the existing baselines, which must not change, prove it.
- **R5: tab bar labels at 320px.** Four tabs hold 70px each at 320px and "Transactions" is 77px. Mitigation: the ellipsis, the full name in the accessible name, the documented limit, and the release note.
- **R6: a second axis in the generator.** The `sidebar` axis adds blocks to `tokens.css` for one token. Mitigation: it reuses the shape axis's machinery and its tests; if the generator's `AXES` order ever fails to match the cascade test, the test names it.
- **R7: prefetch lost through `RouterProvider`.** An always-visible nav is where Next's prefetch pays. Mitigation: the two documented ways back (section 9).
- **R8: the docs rail diverges further from the library until phase 5.** Mitigation: section 13.5 lists the diffs, and the phase 5 definition of done includes the replacement, as the parent spec's R8 says.
