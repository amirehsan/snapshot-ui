# Shell overlays, batch 1: design

Status: for written review, 2026-10-13.
Parent spec: `docs/specs/2026-10-10-snapshot-ui-design.md`. This document pulls the overlay half of phase 2 forward for the library's first consumer, whose request is the driving input. The design authority remains `docs/design-system.md`; every value below that is not a token is derived there before it is built. The format follows `docs/specs/2026-10-12-collapsible-card-design.md`.

Built on react-aria-components 1.22.1 (react-aria 3.53.1, react-stately 3.51.0). Every "React Aria does X" claim below was read in that version's source; the tests in section 15 pin each one.

## 1. Goal and scope

Ship the parts the consumer's app shell is blocked on, in this build order, each as a 0.x minor with its own changeset:

1. **Foundations.** The `warning` and `gain` colors, the `numeral` and `numeral-sm` type steps with their `Text` sizes, a `warning` tone on Badge, the `--z-modal` and `--z-toast` tokens, and a shared `overlay.css` with the small runtime the overlays share.
2. **Dialog** and **ConfirmDialog**, with the `useConfirm()` hook.
3. **Drawer** (`start` and `end`) and **Sheet** (bottom). Separate exports.
4. **Popover** and **Menu**.
5. **Toast**: the `toast()` function, `toast.dismiss()`, `toast.clear()` and `<ToastRegion />`.
6. **CommandPalette**.
7. **Tooltip**.

Out of scope, each owned elsewhere:

- Sidebar, AppShell, BottomTabBar and the compact density axis: a separate spec. This one leaves three parts ready for it: the collapsed rail names its icons with Tooltip (`TooltipTrigger isDisabled` while the rail is expanded, `shortcut` on the search item's tip); the phone "More" sheet is a Sheet (`title` with `isTitleHidden`, `footer`); the navigation drawer is a Drawer (`placement="start"`, floating, closed by the shell when the viewport widens).
- Select, ComboBox and the shared listbox: the choice-controls spec. Menu rows and listbox rows share their states and radius (section 9.3), which that spec inherits.
- The docs site's own search dialog stays hand-built in this batch. Replacing it with CommandPalette is a follow-up (section 16).
- Submenus (`SubmenuTrigger` is alpha in 1.22.1), the non-modal desktop side panel (batch 3), dragging on the Sheet's Modal fallback (deferred, section 7.6), a `numeric` utility beyond the two numeral sizes, and the scorer the source app's palette used for ranking.

## 2. What the source app does

The behaviors the library keeps, by part. Section 6.3 of the parent spec already names the toast and tooltip ones.

**Dialog.** A panel up to 28rem wide with 40px corners, 32px of padding, an `h3` title and slate body text, a danger form with an error-tinted icon well. The body scrolls and the action row stays put. Escape and a backdrop press close it. There is no close button and no motion.

**Confirm.** A question resolves `true` only when the confirm button is pressed. Escape, the backdrop, the cancel button and a second question replacing the first all resolve `false`: silence is never yes. Cancel is the first thing focused in the danger form. A destructive question drawn as a harmless one is the mistake that costs something, so the danger look is the one that is easy to reach.

**Drawer.** A floating panel inset 16px from the viewport's edges, with 40px corners, the float fill, the hairline edge and a 180ms slide from the start edge, over a Deep Well scrim at 0.4 light and 0.65 dark. Escape and a scrim press close it.

**Popups** (the account menu and the three field popups). The float fill, 24px corners, a 1px ink-at-12% edge in both themes, the float shadow, 8px from the trigger, 8px of padding, 4px between rows, 40px rows, a selected row as an ink pill with a check, a group label in the eyebrow style, and a rule between groups.

**Toast.** Events, not states: "Saved" is a toast, "three fields are invalid" belongs in the save bar. Success and info stay 6 seconds, errors 12; errors are `role="alert"`; the polite host exists in the page before anything is put in it. A 4px tone stripe at the inline start, 24px corners, bottom end of the viewport, 16px in. A new save drops the last result.

**Tooltip.** Opens after 400ms on hover and at once on keyboard focus, with no delay while another tip is warm. It is hoverable, closes on Escape, on a press and on scroll, and never shows for touch. An ink tip with canvas text, 6px corners, an arrow, a 140ms fade with a 4px slide, and a key chip for the search shortcut.

**Command palette.** A dialog near the top of the viewport, opened and closed by Cmd or Ctrl+K. Focus stays in the input while arrows move the active row. Every typed word must match. The last five chosen items are remembered, and one the index no longer has is dropped rather than shown with a stale name. Escape closes at once. The dialog closes before the app navigates, so the focus it gives back lands before the app moves it on.

**Sheet** has no source. It is derived in section 7.

## 3. Approach

Every part is a thin wrapper over a react-aria-components part: the library owns the look, the strings, the scope copy, the stack and the few behaviors React Aria lacks (the toast's polite region, the palette's shortcut, recents and status line, the confirm promise). One Modal composition (`ModalOverlay`, `Modal`, `Dialog`) serves Dialog, ConfirmDialog, Drawer and CommandPalette. Sheet is built on React Aria's own `Sheet` family, behind a spike that decides it (section 7.6), with the same Modal composition as its fallback behind one public API.

One shared layer, `packages/core/src/components/overlay.css` and two private hooks, gives all of them their scrim, their z-index, their font, their theme scope, their direction and their stacking. Section 4.5 is that layer; each part's section only says what it adds.

Rejected:

- **The native `<dialog>` top layer.** React Aria's overlays are portaled `div`s ordered by z-index, so the library ships `--z-modal` and `--z-toast` instead and documents that a third-party overlay with a larger z-index can cover a library dialog.
- **React Aria's `Sheet` for the Drawer.** The drawer is a rail that slides; nobody asked it to swipe, and the Modal path has no engine risk.
- **A hand-rolled pointer drag on Modal for the Sheet in v1.** It would own scroll-chaining and iOS bugs forever; React Aria's Sheet drives the swipe with native scroll.
- **`UNSAFE_PortalProvider` as the default theme-scope answer.** It would add `react-aria` as a direct dependency and to tsdown's `neverBundle`. It stays the documented escape hatch for anything the attribute copy cannot reach.
- **A `linkComponent` prop** on Menu. `RouterProvider` is how `Link` already navigates, and React Aria's `render` prop is the per-item escape hatch.

## 4. Foundations

### 4.1 Two colors: `warning` and `gain`

`packages/core/tokens/tokens.json`, under `color`, after `success`:

```jsonc
"warning": {
  "$value": "#8a5300",
  "$description": "A state that needs a look soon and is not a failure: Watch, Behind, Needs review, Out of date. Never decoration.",
  "$extensions": { "snapshot-ui": { "theme": { "dark": "#e8b04f" } } }
},
"gain": {
  "$value": "#2a5f46",
  "$description": "Money in: an amount that arrived. Never decoration, and not the success state.",
  "$extensions": { "snapshot-ui": { "theme": { "dark": "#6cc195" } } }
}
```

The values are the consumer's, kept exactly, so its own copies delete cleanly. The generator needs no change: the names come out as `--color-warning` and `--color-gain`, with `bg-warning` and `text-gain` in `tailwind.css`.

**Measured** with `packages/core/scripts/contrast.js` against the real palette, both themes, every surface text may sit on. The last column is an ink fill, to record that neither color may sit on one.

Light (canvas `#f3f0ee`, lifted `#fcfbfa`, bone `#f4f4f4`, float and raised `#ffffff`, disabled `#f4f4f4`):

| Color | canvas | lifted | bone | float | raised | disabled | on an ink fill |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `warning` `#8a5300` | 5.58 | 6.12 | 5.75 | 6.33 | 6.33 | 5.75 | 2.91 (never) |
| `gain` `#2a5f46` | 6.55 | 7.20 | 6.76 | 7.44 | 7.44 | 6.76 | 2.48 (never) |

Dark (canvas `#0e0e0d`, lifted and float `#1a1a19`, bone and raised `#252523`, disabled `#1a1a19`):

| Color | canvas | lifted | bone | float | raised | disabled | on an ink fill |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `warning` `#e8b04f` | 9.89 | 8.92 | 7.86 | 8.92 | 7.86 | 8.92 | 1.95 (never) |
| `gain` `#6cc195` | 8.92 | 8.04 | 7.09 | 8.04 | 7.09 | 8.04 | 2.17 (never) |

Every pair clears the 4.5:1 of body text, so both work as text, as a graphic (3:1) and as a numeral. The lowest is `warning` on canvas in light, 5.58. The canvas color as text on a `warning` or `gain` fill measures 5.58 and 6.55 in light, 9.89 and 8.92 in dark, so a filled part (Alert, Meter, later) is feasible in both themes; the color as text on its own 12% wash over canvas measures 4.72 (`warning`) and 5.50 (`gain`) in light, which caps a tinted wash at about 12% on canvas.

**Keeping them apart.** By CIE76, the metric the design document uses (it calls clay and light signal orange, 28 apart in light and 29 in dark, far enough): `warning` to `clay` is 21.1 in light and 23.1 in dark, the closest pair in the system; `warning` to light signal orange 36.3 and 37.2; `warning` to `error` 35.6 and 44.6; `gain` to `success` 0.0 in light (the same value) and 7.6 in dark. By CIEDE2000 `warning` to `clay` is 13.4 and 13.8, well above the roughly 5 at which two colors are told apart at a glance. The two are kept apart by rule as well as by value: clay is only the Changed chip on a field's label, and warning is a badge, a toast stripe, later an alert or a meter fill. They never meet in one component.

Why `warning` is not light signal orange: that color measures 2.53 to 2.87 on the light surfaces, under the 3:1 a graphic needs and under any text minimum, and it is already the changed border and the eyebrow dot.

**Meaning rules**, recorded in Appendix B beside the existing reservations:

- `warning` means a state that needs the reader's eye soon and is not a failure (Watch, Behind, Needs review, Out of date). Never decoration, never unsaved (clay), never consent (signal), never a stand-in for light signal orange.
- `gain` means money that arrived. It is drawn with a plus sign, and with a word where it names a state. It is never the outcome of a save, which is `success`, even in light, where the two values are the same: the tokens differ by meaning, and sample content keeps the difference as it does for the other reservations.
- State is never color alone: the badge label, the sign and the word carry the meaning.

**What this forces.** `test/tokens.test.js`: `warning` and `gain` join the color contract list (the dark block gains both). `scripts/contrast.js`: ten pairs join `CONTRAST_PAIRS`, `warning` and `gain` text on `canvas`, `lifted`, `bone`, `float` and `raised` at `TEXT`; `test/contrast.test.js` adds both to its "gates %s text on every surface" cases. `docs/design-system.md`: "Four colors added" becomes six, with the tables and rules above.

### 4.2 Two type steps: `numeral` and `numeral-sm`

Under `text`, after `overline`:

```jsonc
"numeral": {
  "size": { "$type": "dimension", "$value": { "value": 3.5, "unit": "rem" } },
  "line-height": { "$type": "number", "$value": 1 },
  "letter-spacing": { "$type": "dimension", "$value": { "value": -0.03, "unit": "em" } },
  "font-weight": { "$type": "fontWeight", "$value": 500 }
},
"numeral-sm": {
  "size": { "$type": "dimension", "$value": { "value": 2, "unit": "rem" } },
  "line-height": { "$type": "number", "$value": 1.1 },
  "letter-spacing": { "$type": "dimension", "$value": { "value": -0.02, "unit": "em" } },
  "font-weight": { "$type": "fontWeight", "$value": 500 }
}
```

The names come out as `--text-numeral`, `--text-numeral--line-height`, `--text-numeral--letter-spacing`, `--text-numeral--font-weight`, and the same four for `numeral-sm`. The tokens stay exactly as requested. `test/tokens.test.js` adds both to `textStyles` and to `withLetterSpacing`.

**Derivation.** A hero amount wants a display size between the 64px display step and the 36px section step, which neither heading gives: 56px, and 32px for a tile beside others. Both take the headings' weight 500. Tracking is tighter than the headings' -2% at the large size because figures at display size set loosely; the small size keeps -2%. Line height is 1 and 1.1, as the display step's is 1, since a numeral is one line.

**The classes.** A text token cannot carry `font-variant-numeric`, and Sofia Sans has tabular figures (measured: "$12,345.67" at 56px is 253px proportional and 293px tabular), so the library adds two sizes to `Text`, following its class naming (`copy`, `copy-small`), in `packages/core/src/components/copy.css`:

```css
.copy-numeral,
.copy-numeral-sm {
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}
.copy-numeral { font-size: var(--text-numeral); line-height: var(--text-numeral--line-height); letter-spacing: var(--text-numeral--letter-spacing); font-weight: var(--text-numeral--font-weight); }
.copy-numeral-sm { font-size: var(--text-numeral-sm); line-height: var(--text-numeral-sm--line-height); letter-spacing: var(--text-numeral-sm--letter-spacing); font-weight: var(--text-numeral-sm--font-weight); }
@media (width < 768px) {
  .copy-numeral { font-size: 2.75rem; }
}
```

`TextSize` becomes `'body' | 'small' | 'numeral' | 'numeral-sm'`; `Text` stays static. The phone step is measured: tabular "$12,345.67" at 56px is 293px, wider than the 248px of content a 320px screen leaves inside a 20px-padded card; at 44px it is 230px. The width is written out because a media query cannot read a custom property, and `packages/core/test/css.test.js` ties it to `--breakpoint-sm` as it does for `heading.css`. `numeral-sm` fits everywhere tested ("$1,234,567.89" is 216px), so it has no step. `nowrap` beats the inherited `overflow-wrap: anywhere`: a number that breaks is a wrong number. Tailwind users have `text-numeral` and `tabular-nums`.

### 4.3 Badge: the `warning` tone

`BadgeTone` becomes `'neutral' | 'info' | 'success' | 'warning' | 'error'`. `badge.css` gains `.badge-warning { color: var(--color-warning); }` after `.badge-success`; order is irrelevant, since each tone only sets `color` and the 1px border is `currentColor`. Badge stays static.

Measured as the text color on the four surfaces a badge sits on, and bone, light then dark: canvas 5.58 / 9.89, lifted 6.12 / 8.92, float 6.33 / 8.92, raised 6.33 / 7.86, bone 5.75 / 7.86. All five are in the gate through 4.1, so Badge adds no pair. Appendix B's "Four tones" becomes five, its table gains the row, "all sixteen pairs" becomes all twenty, and the sentence on clay and signal orange gains warning's reason for existing (4.1). The docs page, its description line, `examples/badge-tones.tsx`, the story and the test gain the tone. The consumer uses it for "Watch", "Behind", "Needs review" and "Out of date".

### 4.4 Two z-index tokens

A `z` group in `tokens.json` with `$type: "number"`: `z.modal` 1000 and `z.toast` 1100, which come out as `--z-modal` and `--z-toast`. They are not in the Tailwind theme (the generator emits only the namespaces it lists, and Tailwind v4 has no z-index namespace), and they join the contract list in `test/tokens.test.js`.

| Layer | z-index | Why |
| --- | --- | --- |
| Tooltip, Popover, Menu, any positioned overlay | 100000, inline, React Aria's | `useOverlayPosition` writes it as an inline style; CSS cannot lower it |
| Toast region | `--z-toast` 1100 | above modals, so an error from an action inside a dialog is not under the scrim |
| Dialog, ConfirmDialog, Drawer, Sheet, CommandPalette and their scrims | `--z-modal` 1000 | the ladder fits under React Aria's popovers |
| App chrome (header, rail, save bar, tab bar) | below 1000, the app's own | |

Ties inside a layer break by DOM order: React Aria appends each portal after the last, so a menu opened from a dialog sits above it and a stacked dialog above the first. An app whose chrome already uses larger numbers overrides the two variables. The docs say once that the native top layer is not used, so a third-party overlay at a very large z-index can cover a library dialog.

### 4.5 The shared overlay layer

`packages/core/src/components/overlay.css`, imported in `styles.css` before the overlay files, and two private hooks in `packages/react/src/overlay/`: `useOverlayScope` and `useOverlayStack`. The derivation is recorded once, as an "Overlays" section of Appendix B, before any part is built.

**Roots.** Every overlay portals to `document.body` (React Aria's default). Every portaled root carries the class `overlay` beside its own, and `overlay.css` restates on it what `base.css` would give a page: `box-sizing: border-box`, `color: var(--color-ink)`, the font family, the body size, line height and weight, and `text-align: start`. The source app restated the font on its dialog for the same reason: a portal sits outside whatever the app styled. The class also declares `--overlay-inset: 1rem`, the 16px that the source's rail, save bar and toast all keep from the viewport's edge; there is no token for it, and this is the one place it is written. The page under an overlay never sees a library class.

**Theme, shape and density scope.** A portal leaves a nested `[data-theme]`, `[data-shape]` or `[data-density]` subtree. `useOverlayScope(rootRef, triggerRef?)` runs in a layout effect each time an overlay opens: it takes the origin element, which is `triggerRef.current` when React Aria gives the overlay its trigger (Popover and Menu through `PopoverContext`, Tooltip through its trigger context) and otherwise `document.activeElement` at that moment (the pressed trigger still holds focus during the layout effect, before React Aria's `Dialog` moves it in an effect); for each of the three attributes it reads `origin.closest('[data-theme]')` and the other two, and copies the value onto the overlay root, or removes the attribute when no ancestor carries it. For modals the root is the panel (`Modal`), not the scrim, so a light card's dialog is light while the scrim keeps the page's opacity. The toast region follows the page root. An origin outside any scope copies nothing, which is the root theme. The one escape hatch is React Aria's `UNSAFE_PortalProvider` with a container inside the scope; the docs show it and the library adds no dependency for it. Every overlay has an `InDarkScope` story that proves the copy.

**Direction.** Every overlay root sets `dir` from `useLocale().direction`. React Aria does it for `Popover` and the toast region; the wrappers do it for Tooltip, `ModalOverlay` and `SheetOverlay`. Logical properties throughout; `:dir()` is above the Chrome 111 floor and is not used. Where a physical side is needed (the Drawer's slide), the component resolves `placement` and direction into a `data-side` attribute.

**Scrim.** Only the modal surfaces have one: Dialog, ConfirmDialog, Drawer, Sheet, CommandPalette. Popover, Menu, Tooltip and Toast never dim the page; React Aria's invisible underlay only catches outside presses. The `ModalOverlay` (or `SheetOverlay` with its `SheetBackdrop`) carries `overlay-scrim` beside its own class:

```css
.overlay-scrim {
  position: fixed;
  inset: 0;
  z-index: var(--z-modal);
  display: grid;
  height: var(--visual-viewport-height, 100dvh);
  background-color: color-mix(in srgb, var(--color-scrim) calc(var(--opacity-scrim) * 100%), transparent);
  transition: background-color 180ms ease;
  forced-color-adjust: none;
}
.overlay-scrim:is([data-entering], [data-exiting], [data-stacked]) { background-color: transparent; }
```

Deep Well at 0.4 light and 0.65 dark, never ink (ink is white in dark and would lighten the page). It is a background color and not `opacity`, so it does not fade the panel with it. `forced-color-adjust: none` keeps it translucent where Windows high contrast would repaint it opaque and hide the page. `--visual-viewport-height` is the inline value React Aria writes on the overlay for the on-screen keyboard. A press on the scrim dismisses when `isDismissable`; a press on the toast region does not (below).

**One scrim when modals stack.** `useOverlayStack(id, isOpen)` keeps a module-level ordered set of the open modal overlays (a plain `Set`, safe to import on the server) and returns whether this one is the bottom-most. Every modal overlay that is not carries `data-stacked`, so only the first paints the scrim; the others still capture presses. When the first closes, the next becomes bottom-most and paints it. The same set answers two other questions: CommandPalette's shortcut is ignored while any other modal is open, and tests can read it.

**Fills, edges, shadows, corners.**

| Overlay | Fill | Edge | Shadow | Corners |
| --- | --- | --- | --- | --- |
| Dialog, ConfirmDialog | `--color-float` | `--color-hairline` | `--shadow-dramatic` | `--radius-stadium` |
| Drawer | `--color-float` | `--color-hairline` | `--shadow-dramatic` | `--radius-stadium` |
| Sheet | `--color-float` | `--color-hairline` | none | `--radius-stadium`, top corners only |
| Popover, Menu | `--color-float` | `--color-frame` | `--shadow-float` | `--radius-surface` |
| CommandPalette | `--color-float` | `--color-frame` | `--shadow-float` | `--radius-surface` |
| Toast | `--color-float` | `--color-frame`, plus a 4px tone stripe | `--shadow-float` | `--radius-surface` |
| Tooltip | `--color-ink` | a transparent 1px border, for forced colors | `--shadow-float` | `--radius-micro` |

Every overlay sits on float: the design document reserves white for floating surfaces, and the source dialog's lifted fill differs from it by one step in light and not at all in dark. A modal sits over a dimmed page and separates by tone, so it takes the hairline (nothing in light, white 12% in dark); measured against the scrimmed canvas the dialog is 3.10 in light and 1.15 in dark, where the hairline carries the edge, as the design system already accepts for cards. A non-modal float opens over any surface, another float included, so it takes the frame in both themes, which the design system already says for the menu popup. The palette is a floating surface and not a panel dialog, so it takes the popup's edge, corner and shadow. Modal surfaces take elevation level 3 and floats level 2; the sheet casts none, since its only edge is at the bottom of the viewport where a shadow shows nothing. Parts step down the nested-radii ladder: a 24px popup holds `--radius-control` rows, a 40px dialog holds 24px parts, and buttons keep `--radius-control` because a pill is a shape and not a size. Soft and Square descend by construction.

**Spacing.** List popups pad 8px (`--spacing-part`), free-content popovers 24px (`--spacing-peer`), a dialog 32px (`--spacing-separate`), a drawer and a sheet 24px (`--spacing-peer`, derived in their sections). Rows sit 4px apart, the source's list gap, kept because two hover washes need a seam.

**Motion.** All of it on `[data-entering]` and `[data-exiting]` with `transition`, which React Aria waits for through `getAnimations()` before it unmounts; with nothing running (reduced motion, jsdom) it mounts and unmounts at once.

| Overlay | Enter and exit |
| --- | --- |
| Scrim | background color, 180ms ease |
| Dialog, ConfirmDialog, CommandPalette | opacity, and `translateY(8px)` to rest, 180ms ease |
| Drawer | translate from its edge by `calc(100% + var(--overlay-inset))`, 180ms ease, by `data-side` |
| Sheet | React Aria drives the slide with scroll; the backdrop fades through its keyframes; the Modal fallback slides `translateY(100%)` in 180ms |
| Popover, Menu | opacity, and 4px toward the trigger by `data-placement`, 140ms ease-out |
| Tooltip | opacity, and 4px toward the trigger, 140ms ease-out; a warm swap opens with no animation |
| Toast | opacity and an 8px rise on enter through `@starting-style`; exit is instant |

`@media (prefers-reduced-motion: reduce)` sets `transition: none` and `animation: none` on every one of them; nothing in an overlay needs the spinner's exception. `@starting-style` is above the floor (Safari 17.5, Firefox 129), so only the toast uses it, and on the floor browsers a toast simply appears.

**Focus.** Dialog, Drawer, Sheet and CommandPalette focus the panel container, or the child with `autoFocus` (the palette's input, ConfirmDialog's Cancel or Confirm); Menu focuses its first item (or the first or last by Arrow Down or Up); a free Popover focuses its container; Tooltip and Toast never take focus. On close, focus returns to the trigger through React Aria's `FocusScope`; a toast closed while focused hands focus to its neighbor; if a confirmed action removes the trigger, the caller places focus and the docs say so. Escape closes the topmost overlay only, so a tooltip inside a dialog closes first. The `tabIndex="-1"` containers (`Dialog`, `Popover`) take `outline: none`, so opening by keyboard does not ring the whole panel; rings stay on the controls inside. A ring inside a scrolling list is inset (`outline-offset: calc(-1 * var(--focus-ring-width))`), because a scroll container clips an outset ring, and inverts to canvas on an ink-filled row, the Appendix B rule. Hover on a float is the 5% ink wash, inside `@media (hover: hover)`.

**Widths and touch.** Every width caps against the viewport so 320px never scrolls sideways: Dialog `min(28rem, 100vw - 2rem)` (`lg` 40rem), Drawer `min(20rem, 100vw - 2rem)`, Toast `min(28rem, 100vw - 2rem)`, Tooltip `min(20rem, 100vw - 2rem)`, CommandPalette `min(40rem, 100vw - 2rem)`, Popover and Menu `max-width: calc(100vw - 2rem)` inside React Aria's 12px `containerPadding`, Sheet `min(100%, 36rem)`. Dialog, drawer and sheet bodies scroll inside the panel (`min-height: 0; overflow-y: auto; overscroll-behavior: contain`) and the action row stays. Heights use `dvh`, with `--visual-viewport-height` for the soft keyboard. Targets are 40px: menu rows (44px under `pointer: coarse`), the toast dismiss (the 40px IconButton), dialog buttons (Button is 40px). Tooltips never show on touch.

**Forced colors and right to left.** Scrim `forced-color-adjust: none`; the selected menu row and the palette's active row `Highlight` with `HighlightText`; the tooltip a transparent border and no arrow; disabled rows `GrayText`; the sheet's grabber `CanvasText`. Every system color sits inside `@media (forced-colors: active)`, the one place the core test allows it. Logical properties, `dir` on every root, `start` and `end` placements, the drawer and toast mirrored.

**Strings.** English defaults, every one replaceable: ConfirmDialog `cancelLabel` ("Cancel") and the required `confirmLabel`; Dialog, Drawer and Sheet `closeLabel` ("Close"); Toast `dismissLabel` ("Dismiss"); the toast region's `aria-label` (React Aria's localized "Notifications"); CommandPalette's `labels` object (section 11). React Aria's own hidden "Dismiss" buttons follow `I18nProvider`.

**Server safety.** No `Intl` formatting during render, no `window` or `document` at render or import, no first-paint measurement, preformatted strings accepted wherever a value is shown (the palette's `end` slot, a toast's title). The toast queue and the overlay stack are module singletons that create no DOM, so they are safe to import on the server. `localStorage` is read only through `useSyncExternalStore` with an empty server snapshot. Every client file starts with `'use client'`.

## 5. Dialog and ConfirmDialog

### 5.1 Dialog API

```ts
'use client';

export interface DialogProps extends Omit<RACDialogProps, 'className' | 'children' | 'role'> {
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

export { DialogTrigger } from 'react-aria-components';
```

Exports: `Dialog`, `DialogTrigger` (React Aria's, re-exported unchanged so one trigger serves Dialog, ConfirmDialog, Drawer and a free Popover), `DialogBody`, `DialogActions` (the parts, for a custom layout inside `children` of a bare dialog). `role` is not a prop: a Dialog is `dialog`, and ConfirmDialog is the one that says `alertdialog`.

**Departure, ruled in Task 4's fix round 1:** `DialogBody` and `DialogActions` are not exported. There is no bare dialog: `children` always lands inside the dialog's own `div.dialog-body`, so the parts placed there would nest, and a nested action row would scroll away with the body. They stay internal to `Dialog.tsx`, where Dialog and ConfirmDialog use them. A form dialog puts its `<form id>` in `children` and `<Button type="submit" form={id}>` in `actions`, which is the one pinned row; Enter in a field still submits the form, because a submit button joined by the `form` attribute is the form's default button.

### 5.2 Dialog behavior

- **Markup.** `ModalOverlay.overlay-scrim.dialog-overlay` > `Modal.overlay.dialog[data-size][data-tone]` > `RACDialog.dialog-content` > the close IconButton (when asked), the icon well, `Heading slot="title"` as `h2.dialog-title`, `Text slot="description"` as `.dialog-description`, `div.dialog-body` holding `children`, `div.dialog-actions` holding `actions`. The title is React Aria's `Heading`, not the library's static one, because the slot is what wires `aria-labelledby`; it is drawn in the `--text-h3` step whatever the level, as a card title is. Parts that are not given render nothing: no empty well, body or action row (the `empty-parts` test).
- **Focus.** React Aria's `Dialog` focuses the dialog element on open unless a child already holds focus, so a child with `autoFocus` wins. Focus is contained. On close it returns to the trigger, or to whatever held it when a controlled dialog opened.
- **Escape** closes unless `isKeyboardDismissDisabled`; **a scrim press** closes when `isDismissable`, which defaults to true as the source did. A press on the toast region never closes it: every library modal passes `shouldCloseOnInteractOutside={(el) => !el.closest('.toast-region')}`.
- **The page behind.** React Aria's `useModalOverlay` runs `usePreventScroll` while open (verified in 3.53.1: it is called with `isDisabled: !state.isOpen`), hides everything outside with `aria-hidden` through `ariaHideOutside`, and writes `--visual-viewport-height` on the overlay. A test pins the scroll lock: `document.documentElement` gains the style React Aria sets while a dialog is open and loses it on close.
- **Stacking.** Allowed. A confirm opened from inside a dialog is legitimate; the second overlay is `data-stacked` and paints no scrim (4.5), Escape closes the topmost, and the first dialog keeps its focus state for when the second closes. The source replaced one dialog with the next; nothing in 6.3 depends on that, so nothing is lost.
- **`close` in render functions.** `children` and `actions` may be functions of `{ close }`, which calls the overlay state's `close()`.

### 5.3 Dialog look

`packages/core/src/components/dialog.css`.

- **Scrim grid.** `.dialog-overlay { place-items: center; padding: var(--overlay-inset); }` so the panel is centered with 16px clear on every side at 320px.
- **Panel.** `width: min(28rem, 100%)` (`[data-size='lg']` 40rem); `max-height: 100%`; `display: flex; flex-direction: column`; `padding: var(--spacing-separate)`; `border: 1px solid var(--color-hairline)`; `border-radius: var(--radius-stadium)`; `background-color: var(--color-float)`; `box-shadow: var(--shadow-dramatic)`. The inner `.dialog-content` is `display: flex; flex-direction: column; gap: var(--spacing-peer); min-height: 0; outline: none` (it is the `tabIndex="-1"` element).
- **Head.** The well, the title and the description are one block with `gap: var(--spacing-part)`: parts of one thing. The well is a 48px circle (`--radius-pill`) with `--color-bone` and an ink icon; `[data-tone='danger']` fills it with `color-mix(in srgb, var(--color-error) 14%, transparent)` and colors the icon error. Measured: ink on bone 16.76 light and 15.36 dark; error on the 14% well 5.88 and 4.72. All clear the 3:1 a graphic needs. Icons are sized to 20px as IconButton sizes its `svg`. The title is `--text-h3` ink; the description `--text-body` slate (5.49 / 6.94 on float).
- **Body.** `min-height: 0; overflow-y: auto; overscroll-behavior: contain`. A long body scrolls and the head and actions stay.
- **Actions.** `display: flex; flex-wrap: wrap; justify-content: flex-end; gap: var(--spacing-part)`. `flex-end` follows the writing direction.
- **Close button.** A ghost IconButton with Lucide `X`, `position: absolute; inset-block-start: 1.5rem; inset-inline-end: 1.5rem`, and the head takes `padding-inline-end: 2.5rem` while it is present so no title runs under it.
- **Motion.** `.dialog { transition: opacity 180ms ease, translate 180ms ease; } .dialog:is([data-entering], [data-exiting]) { opacity: 0; translate: 0 8px; }`, plus the scrim rule in `overlay.css`. Reduced motion removes both.
- **Forced colors.** The hairline is redrawn in `CanvasText`, so the panel keeps its shape; the scrim's `forced-color-adjust: none` is in `overlay.css`; the well's fills vanish and the icon stays, which is enough.

### 5.4 ConfirmDialog API

```ts
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
   * The rejection is not swallowed.
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
```

### 5.5 ConfirmDialog behavior

- **It is a Dialog** with `role="alertdialog"` (React Aria then points `aria-describedby` at the description), the `description` required, and `actions` supplied: Cancel (`Button variant="tertiary"`) then Confirm (`primary`, or `danger` in the danger tone), in that DOM order, so the safe answer comes first.
- **Initial focus.** `autoFocus` on Cancel in the danger tone and on Confirm in the default tone. The source's focus landed on Cancel by DOM order; here it is explicit.
- **Every non-confirm exit is a cancel.** Escape, a scrim press and the Cancel button all call `onCancel` and close. `isDismissable={false}` keeps the scrim press out, for a question that must be answered; Escape stays unless `isKeyboardDismissDisabled`.
- **Confirm.** Calls `onConfirm`. A `void` return closes the dialog. A promise makes the dialog pending: the confirm button takes Button's pending state (its label stays in the accessibility tree under the spinner), Cancel is disabled, `isDismissable` and keyboard dismissal are off for the duration; on resolve the dialog closes; on reject it stays open and pending clears. `isPending` does the same from outside, for a controlled caller.
- **Controlled and uncontrolled** like Dialog. A controlled caller that closes on its own terms receives `onOpenChange(false)` after the confirm resolves, as it does for any dismissal.
- **A removed trigger.** If the confirmed action unmounts the trigger, React Aria's restore has nowhere to go. The caller places focus (the docs show it with a list row).

### 5.6 `useConfirm()`

The source's whole contract was a promise, and per-row removals in the lists to come (phase 4) want it, so the hook ships now, local to the caller, with no provider.

```ts
export type ConfirmOptions = Omit<
  ConfirmDialogProps,
  'isOpen' | 'defaultOpen' | 'onOpenChange' | 'onConfirm' | 'onCancel' | 'isPending'
>;

export function useConfirm(): {
  /** Opens the dialog and resolves `true` only when the confirm button is pressed. */
  confirm: (options: ConfirmOptions) => Promise<boolean>;
  /** The dialog element. Render it once in the component that calls `confirm`. */
  dialog: ReactElement | null;
};
```

```tsx
const { confirm, dialog } = useConfirm();
async function remove(ids: string[]) {
  if (await confirm({ title: 'Delete these transactions?', description: '...', confirmLabel: `Delete ${ids.length} transactions`, tone: 'danger' })) {
    await deleteTransactions(ids);
  }
}
return <>{...}{dialog}</>;
```

- `confirm` while a question is open resolves the open one `false` and shows the new one: silence is never yes.
- Unmounting the caller resolves a pending question `false`.
- The hook resolves on the press and closes; a pending action belongs to the caller's own UI after the promise. A caller that wants the dialog itself to show pending uses `<ConfirmDialog onConfirm={async () => ...}>` directly.
- `dialog` is `null` until the first `confirm`, so a page that never asks renders nothing.

## 6. Drawer

### 6.1 API

```ts
export interface DrawerProps extends Omit<RACModalOverlayProps, 'className' | 'children' | 'style'> {
  /** Which edge the panel comes from. `start` and `end` follow the writing direction. @default 'start' */
  placement?: 'start' | 'end';
  /** The title, an h2 in the header. It names the drawer. Required. */
  title: ReactNode;
  /** Keeps the title for assistive technology only, for a drawer whose content names itself, such as a navigation list. @default false */
  isTitleHidden?: boolean;
  /** The body. It scrolls. */
  children?: ReactNode | ((opts: { close: () => void }) => ReactNode);
  /** Pinned under the body, for an account row or an action. */
  footer?: ReactNode;
  /** @default true */
  isDismissable?: boolean;
  isKeyboardDismissDisabled?: boolean;
  /** An X in the header. @default true */
  hasCloseButton?: boolean;
  /** @default 'Close' */
  closeLabel?: string;
  className?: string | ((values: ModalRenderProps & { defaultClassName: string | undefined }) => string);
  overlayClassName?: string;
  ref?: Ref<HTMLElement>;
}
```

Opened by `DialogTrigger`, or controlled with `isOpen` and `onOpenChange` (the shell's drawer is controlled, so it can be closed when the viewport widens past the breakpoint; that rule is the shell's, not the drawer's).

### 6.2 Behavior

- **Markup.** `ModalOverlay.overlay-scrim.drawer-overlay` > `Modal.overlay.drawer[data-side='left' | 'right']` > `RACDialog.drawer-content` > `div.drawer-header` (`h2.drawer-title` through `Heading slot="title"`, visually hidden when `isTitleHidden`, then the close IconButton), `div.drawer-body`, `div.drawer-footer`. `data-side` is `placement` resolved against `useLocale().direction`, so the stylesheet can slide on a physical axis.
- **The same rules as Dialog:** focus moves in and returns, Escape, scrim press when `isDismissable`, scroll lock, `aria-hidden` outside, stacking, the toast exception.
- React Aria gives it everything the source's drawer lacked: a focus trap, an inert page, a scroll lock, and unmounting when closed instead of a `visibility` trick. The docs shell's hand-written focus trap is what this replaces when the shell spec lands.

### 6.3 Look

`drawer.css`.

- **Placement.** The scrim grid aligns the panel to its side: `.drawer-overlay { align-items: stretch; padding: var(--overlay-inset); } .drawer[data-side='left'] { justify-self: start; } .drawer[data-side='right'] { justify-self: end; }`. The panel floats 16px clear of the viewport on every side, so a drawer and the rail it mirrors are one object.
- **Panel.** `width: min(20rem, 100%)`; `height: 100%`; `display: flex; flex-direction: column`; float fill; `1px solid var(--color-hairline)`; `--radius-stadium`; `--shadow-dramatic` (a modal surface is level 3; the shell may override to `--shadow-lift` on its own class when the drawer is the rail itself).
- **Padding** 24px (`--spacing-peer`), derived: a 320px panel at the dialog's 32px leaves 256px for a navigation list, and the rail it mirrors pads 24. Header `padding: var(--spacing-peer) var(--spacing-peer) 0`, a flex row with the title at the start and the close button at the end (`margin-inline-end: -0.5rem` so the icon lines up with the padding edge); body `padding: var(--spacing-peer)`, `min-height: 0; overflow-y: auto; overscroll-behavior: contain`; footer `padding: 0 var(--spacing-peer) calc(var(--spacing-peer) + env(safe-area-inset-bottom, 0px))`.
- **Title** `--text-h3` ink. Hidden title: the visually hidden pattern (React Aria's `VisuallyHidden`), so the header is just the close button, at the end.
- **Motion.** `.drawer { transition: translate 180ms ease; } .drawer[data-side='left']:is([data-entering], [data-exiting]) { translate: calc(-100% - var(--overlay-inset)) 0; } .drawer[data-side='right']:is([data-entering], [data-exiting]) { translate: calc(100% + var(--overlay-inset)) 0; }`. Off under reduced motion.
- **Forced colors and RTL** as the shared layer: the hairline survives; `start` resolves to the right edge under `dir="rtl"` and the slide follows `data-side`.

**Departure, ruled in Task 6:** the panel is placed physically. The scrim carries the locale's `dir`, and a grid's `start` and `end` follow it, so the Placement bullet's `justify-self: start` and `end` would put a start drawer, `data-side='right'` in right to left, on the left, sliding in from the right across the page. The panel takes `justify-self: left` for `data-side='left'` and `right` for `data-side='right'`, so its place and its slide both follow the resolved physical side. The panel also takes `min-height: 0`, since a grid item's automatic minimum is its content and a long list grew the scrim's row past the viewport, as the dialog's did. The fix round added: the body is a tab stop while it scrolls and holds nothing to focus, as Dialog's is, with an inset ring, and the panel clips to its corners (`overflow: clip`); with `isTitleHidden` and no close button there is no header, and the hidden title sits straight in the dialog; the title's first line is centred on the close button; the footer wraps a long word.

## 7. Sheet

A bottom sheet for phones. No source, so every value is derived here and recorded in Appendix B. The consumer's numbers (92% of the height, a grabber) are recorded as the consumer's.

### 7.1 What it is built on

React Aria 1.22.1 ships a `Sheet` family: `SheetTrigger` (a `DialogTrigger`), `SheetOverlay`, `SheetBackdrop`, `Sheet` and `SheetContent` (a `Dialog`). The swipe is native scroll: the overlay is `position: absolute` sized to the page, and inside it a `[data-sheet-scroll]` container two viewports tall with `scroll-snap-type: y mandatory` holds a stage one viewport in; an `IntersectionObserver` closes the sheet once it is scrolled out; snap points are markers. It gives swipe-to-dismiss with momentum and rubber-banding, snap points, RTL and the iOS toolbar and keyboard allowances, stacking (`data-stack-index`), `preventDismissal`, and a 300ms time-based fallback where `animation-timeline: view()` is missing (Firefox today). Modal behavior (focus, `aria-hidden`, scroll lock, Escape) is inherited from `ModalOverlay`. It renders `null` on the server and when closed. It gives no grabber, header, title, close button, footer, appearance, z-index or max height; those are the library's.

The library's `Sheet` is built on it. The first Sheet task is a spike that proves it (7.6); if an engine fails, the fallback is the Modal composition with no dragging, behind the same public API, and the spike's result is recorded in Appendix B either way.

### 7.2 API

```ts
export interface SheetProps extends Omit<RACSheetOverlayProps, 'className' | 'children' | 'position' | 'style' | 'preventDismissal'> {
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
  className?: string | ((values: SheetRenderProps & { defaultClassName: string | undefined }) => string);
  overlayClassName?: string;
  ref?: Ref<HTMLDivElement>;
}

export { SheetTrigger } from 'react-aria-components';
```

The sheet rises from the bottom only; `position` is not a prop, because the side panels are Drawer's. `SheetTrigger` is React Aria's (on the fallback it is an alias of `DialogTrigger`), so the public surface is the same on either path.

### 7.3 Behavior

- **Markup.** `SheetOverlay.overlay-scrim.sheet-overlay` (`position="bottom"`, `snapPoints`, `preventDismissal={!isDismissable}`) > `SheetBackdrop.sheet-scrim` + `Sheet.overlay.sheet` > `SheetContent.sheet-content` (a dialog named by the title) > `div.sheet-grabber[aria-hidden]`, `div.sheet-header` (`h2.sheet-title` through `Heading slot="title"`, hidden when `isTitleHidden`, `.sheet-description`, the close IconButton), `div.sheet-body`, `div.sheet-footer`.
- **The same focus rules as Dialog.** Focus moves in once the sheet has entered (React Aria defers it until the enter animation ends), stays inside, and returns to the trigger; Escape closes; a scrim press closes; the page does not scroll; everything outside is hidden.
- **Swipe.** Down to dismiss, with momentum, by touch and pointer; between snap points when given. It is an enhancement: the close button and Escape are always there when the sheet is dismissable, so a keyboard has a way out.
- **Scroll inside.** The body scrolls only while the sheet is fully open (`data-expanded`), so at a partial snap point a swipe on the content expands the sheet instead, as iOS does. With no `snapPoints` the sheet opens fully and the body scrolls at once.
- **Keyboard up.** A text field inside with the on-screen keyboard open: React Aria reads the visual viewport into `--visual-viewport-height`, and the sheet's height caps against it.
- **Stacking.** Two sheets (More, then a filter sheet) stack through React Aria's `data-stack-index`; the second carries `data-stacked` through the overlay stack, so one scrim paints.
- **Reduced motion.** React Aria switches its programmatic scrolls to instant; the library's backdrop keyframes are removed.
- **Server.** Renders nothing on the server and when closed; a controlled `isOpen` from the URL works because the sheet is only ever a client component.

### 7.4 Look

`sheet.css`. Derived, each with its rule:

| Part | Value | Derived from |
| --- | --- | --- |
| Surface | `--color-float`, `1px solid var(--color-hairline)` | white is for floating surfaces; a modal separates by tone |
| Corners | `--radius-stadium` on the top two corners, square below | a dialog is 40px; the bottom is flush with the viewport and takes no corner |
| Height | content height, `max-height: 92dvh` with a `92vh` fallback | the consumer's number, recorded as such: 8% of a 760px phone leaves about 60px of page as the reader's context |
| Width | `width: min(100%, 36rem)`, centered | no token; a phone surface that still reads on a tablet; recorded |
| Elevation | none | the only free edge is at the viewport's bottom, where a downward shadow shows nothing; the scrim and the hairline separate |
| Scrim | the shared `overlay-scrim` rules on the `SheetBackdrop` | |
| Grabber | 40px by 4px, `--radius-dot`, `--color-boundary`, `aria-hidden`, centered in a 44px-tall band above the header | dots stay round in every shape; boundary is already gated at 3:1 (3.48 on float light, 5.21 dark) |
| Header | title `--text-h3` ink, description `--text-body` slate, the close IconButton at the end, `padding-inline: var(--spacing-peer)` | the card title step; target 40px |
| Body | `min-height: 0; overflow-y: auto; overscroll-behavior: contain; padding: var(--spacing-peer)`, bottom padding plus `env(safe-area-inset-bottom, 0px)` when there is no footer | the design document asks about 24px of padding on a phone, and a sheet is only ever a phone surface, so it can take it where Card cannot |
| Footer | pinned, `padding: var(--spacing-part) var(--spacing-peer) calc(var(--spacing-part) + env(safe-area-inset-bottom, 0px))` | safe area |
| Z | `--z-modal` on the overlay | React Aria's overlay has none and would sit under a sticky header |
| Motion | React Aria drives the slide by scroll; the library adds `@keyframes sheet-scrim-fade` for the backdrop's `swipeAnimation`, resting at the scrim color, and removes it under reduced motion so the scrim is simply there | |
| Forced colors | the hairline survives; the grabber is `CanvasText` | a fill alone does not survive |

The Modal fallback draws the same classes, with the slide as a 180ms `translateY(100%)` transition on `[data-entering]` and `[data-exiting]`, `snapPoints` ignored with a development warning, and no dragging.

**Departure, ruled in Task 8:** the scrim is the backdrop's alone. 7.3's markup puts `overlay-scrim` on `SheetOverlay` and 7.4 puts the scrim on `SheetBackdrop`; on the overlay it would paint a second scrim under the backdrop's, one that does not fade with the swipe, so `SheetOverlay` carries only `sheet-overlay`, with `z-index: var(--z-modal)` and React Aria's own inline `position: absolute` (a fixed overlay drew the sheet off screen on a scrolled page in the spike), and `SheetBackdrop` carries `overlay-scrim sheet-scrim`. Three shared scrim rules give way on the backdrop, which React Aria places inside the page-sized overlay and makes inert: `z-index: auto`, so it paints under the sheet's scroller; `height: auto`, so `inset: 0` fills the overlay and covers a scrolled page's view; and no transition, with its color kept while it enters and exits, since the swipe keyframes fade it. They live in `overlay.css` as the variant `.overlay-scrim.sheet-scrim`, which outranks the shared rule in whatever order the per-component files load (the fix round), and the shared fade-out skips the sheet's scrim, so the color is written once. React Aria writes those keyframes inline whatever the motion setting, so reduced motion removes them with `animation: none !important`. The body leaves out `overscroll-behavior: contain`, which stopped a swipe on a body with nothing to scroll from reaching React Aria's scroller, so the sheet never dismissed from its middle; that scroller contains the scroll itself. Until the sheet is fully open the body is `overflow-y: clip`, so a long list at a partial stop does not paint over the footer. The content caps at 92% of `--visual-viewport-height`, which is how the sheet caps against it while the sheet's `92dvh` and `92vh` lines stay. As for the drawer: with no grabber the header takes 24px of top padding; with a hidden title, no close button and no description there is no header; the title's first line is centred on the close button; the footer wraps a long word.

### 7.5 Readiness for the shell

The phone "More" sheet is `<Sheet title="More" isTitleHidden footer={account}>` holding a link list. Nothing in the sheet navigates; the list inside does, through `RouterProvider` as every link does.

### 7.6 The spike that decides it

The first Sheet task builds a prototype story on React Aria's `Sheet` and runs it through Playwright in Chromium, WebKit and Firefox. It passes when, in all three:

1. the sheet opens from a trigger and from `isOpen`, focus moves into it and returns to the trigger on close;
2. Escape closes it, a scrim press closes it, and `isDismissable={false}` stops both;
3. a swipe down (touchscreen emulation) dismisses it, with the 300ms fallback where `animation-timeline: view()` is missing;
4. a body taller than 92dvh scrolls inside the sheet and the sheet stays put;
5. two sheets stack and one scrim paints;
6. it sits above a sticky header at z-index 20;
7. reduced motion runs it with no smooth scroll and no backdrop animation;
8. a text field inside keeps the sheet on screen with the visual viewport shrunk (WebKit, emulated).

A failure in any engine is a failure, and the fallback is the Modal composition in 7.4, behind the same API, with dragging deferred. Either outcome is recorded in Appendix B with the engine versions. jsdom has no `IntersectionObserver`, `ResizeObserver` or `scrollTo`; the unit tests stub them in `packages/react/test/setup.ts` and assert markup, names and dismissal, while the swipe lives in the play tests. A WebKit project joins the Storybook Playwright config for the sheet's stories, the first non-Chromium run in the repo.

## 8. Popover

Chrome only: the float surface the Menu, the choice controls' listboxes and the pickers to come all open in, plus a free-content form for a filter chip's panel.

### 8.1 API

```ts
export interface PopoverProps extends Omit<RACPopoverProps, 'className' | 'children' | 'style'> {
  children: ReactNode | ((values: PopoverRenderProps & { defaultChildren: ReactNode }) => ReactNode);
  /** Pads free content 24px. Lists and menus pad themselves, so it is off by default. @default false */
  isPadded?: boolean;
  /** Makes the trigger's width the popover's minimum. @default false */
  matchTriggerWidth?: boolean;
  /** @default 'bottom start' */
  placement?: Placement;
  /** The gap to the trigger. @default 8 */
  offset?: number;
  className?: string | ((values: PopoverRenderProps & { defaultClassName: string | undefined }) => string);
  ref?: Ref<HTMLElement>;
}
```

Opened by `DialogTrigger` for free content (React Aria then gives the popover `role="dialog"`, labels it from the trigger and focuses it), or by `MenuTrigger`, `Select` and `ComboBox`, which supply their own state. Classes `overlay popover`, plus `popover-padded`.

### 8.2 Behavior

- **Placement.** `bottom start`, 8px from the trigger (React Aria's default `offset`), flipped to the other side when there is no room, shifted within React Aria's 12px `containerPadding`, and capped in height by the `maxHeight` React Aria writes inline. `data-placement` says where it landed; a test places the trigger at the bottom of the viewport and asserts `data-placement="top"`.
- **Dismissal.** Outside press through React Aria's underlay, Escape, and blur (`shouldCloseOnBlur`). Focus returns to the trigger.
- **Scope.** `useOverlayScope` reads the trigger through `PopoverContext`; `dir` is React Aria's.
- **No arrow.** The source popups have none.

### 8.3 Look

`popover.css`: `box-sizing: border-box; max-width: calc(100vw - 2rem); max-height: inherit; overflow: auto; border: 1px solid var(--color-frame); border-radius: var(--radius-surface); background-color: var(--color-float); box-shadow: var(--shadow-float); outline: none`. `.popover-padded { padding: var(--spacing-peer); }`. `[data-trigger]` is left to React Aria. `matchTriggerWidth` sets `min-width: var(--trigger-width)` through a class, `popover-match-trigger`. Motion: `transition: opacity 140ms ease-out, translate 140ms ease-out`; `[data-entering]` and `[data-exiting]` are `opacity: 0` with `translate` 4px away from the trigger by `data-placement` (`top` slides from 4px below, `bottom` from 4px above, `left` and `right` likewise). Reduced motion removes it. Forced colors: the frame is redrawn in `CanvasText`, so the shape survives.

## 9. Menu

A true `role="menu"`. The source rejected the role because it had no arrow-key model and said so; React Aria supplies one, so the library accepts the upgrade and the docs say that focus now enters the menu and Tab leaves it.

### 9.1 API

```tsx
<MenuTrigger>
  <IconButton aria-label="More"><Ellipsis /></IconButton>
  <Menu onAction={(key) => ...}>
    <MenuSection title="Appearance" selectionMode="single" selectedKeys={theme} onSelectionChange={setTheme}>
      <MenuItem id="light" icon={<Sun />}>Light</MenuItem>
      <MenuItem id="dark" icon={<Moon />}>Dark</MenuItem>
    </MenuSection>
    <MenuSeparator />
    <MenuItem id="settings" href="/settings" icon={<Settings />} description="Account and billing" shortcut="Mod ,">Settings</MenuItem>
    <MenuItem id="logout" icon={<LogOut />} shortcut="Q" variant="danger">Log out</MenuItem>
  </Menu>
</MenuTrigger>
```

```ts
export { MenuTrigger } from 'react-aria-components';

export interface MenuProps<T extends object> extends Omit<RACMenuProps<T>, 'className' | 'style'> {
  /** Where the popover opens. @default 'bottom start' */
  placement?: Placement;
  /** Goes on the menu element. */
  className?: string | ((values: MenuRenderProps & { defaultClassName: string | undefined }) => string);
  /** Goes on the popover around it. */
  popoverClassName?: string;
  ref?: Ref<HTMLDivElement>;
}

export interface MenuItemProps<T extends object> extends Omit<RACMenuItemProps<T>, 'className' | 'children' | 'style'> {
  /** The label. A string is also the item's text value, for typeahead and announcement. */
  children: ReactNode;
  /** A 16px icon at the start, hidden from assistive technology. */
  icon?: ReactNode;
  /** A second line under the label, in slate. It becomes the item's accessible description. */
  description?: ReactNode;
  /** A key hint at the end, such as "Q" or "Mod ,", drawn as a key. Keys are separated by spaces. */
  shortcut?: string;
  /** `danger` draws the label and icon in the error color, for an item that loses something. @default 'default' */
  variant?: 'default' | 'danger';
  className?: string | ((values: MenuItemRenderProps & { defaultClassName: string | undefined }) => string);
}

export interface MenuSectionProps<T extends object> extends Omit<RACMenuSectionProps<T>, 'className' | 'style'> {
  /** The heading above the section's items. */
  title?: ReactNode;
  className?: string;
}

export interface MenuSeparatorProps { className?: string }
```

`Menu` renders its own Popover (`popover menu-popover`) so a caller composes only `MenuTrigger` and `Menu`, as Select will. Its accessible name comes from the trigger through `MenuTrigger` (`aria-labelledby`), so none is required in the types; `aria-label` is accepted. Selection, `disabledKeys`, `onAction`, `items` with a render function, `renderEmptyState` and `shouldCloseOnSelect` pass through under React Aria's names. The list itself is a private `MenuList` (React Aria's `Menu` wearing the `menu` class), which CommandPalette reuses inline without the popover, with `MenuItem`, `MenuSection` and `MenuSeparator`.

### 9.2 Behavior

- **Markup.** `RACMenuItem.menu-item[.menu-item-danger]` > `span.menu-item-icon[aria-hidden]`, `span.menu-item-text` (`Text slot="label"` as `.menu-item-label`, `Text slot="description"` as `.menu-item-description`), `Keyboard.menu-item-shortcut`, `span.menu-item-check[aria-hidden]` holding Lucide's 16px `Check`. A section is `MenuSection.menu-section` with `Header.menu-heading`; a separator is `Separator.menu-separator`.
- **Keys**, all React Aria's: Arrow Down and Up move (no wrap), Home and End jump, letters typeahead, Enter and Space activate, Escape closes and returns focus, Tab moves focus out and closes (blur dismissal). Opening by press focuses the first item; by Arrow Down or Up the first or last. The trigger carries `aria-haspopup`, `aria-expanded` and `data-pressed` while open.
- **Pointer.** Hover focuses the item in a React Aria menu, so `[data-focused]` is true under the pointer as well as the keyboard; the wash keys on `[data-focused]` and the ring on `[data-focus-visible]` only.
- **Selection.** A `selectionMode` of `single` makes the items `menuitemradio`, `multiple` makes them `menuitemcheckbox`, on the menu or per section. A choice in single mode closes the menu, the source's rule ("a menu that stays open after a choice makes the user wonder whether it registered"): the library sets `shouldCloseOnSelect` true on items in single mode and false in multiple, and a caller may override per item. React Aria already keeps a multiple-selection menu open on a press; the library's default also covers Space from the keyboard.
- **Links.** An item with `href` renders an anchor with `role="menuitem"`, so middle-click and the browser's own link behavior work, and a plain press navigates through React Aria's `RouterProvider`. The docs show the Next App Router wiring once, shared with `Link`: a small client component that calls `useRouter()` and renders `<RouterProvider navigate={router.push}>` around the app, with the `RouterConfig` module augmentation so `routerOptions` is typed. The per-item escape hatch for Next's own `Link` (viewport prefetch) is React Aria's inherited `render` prop, `render={(props) => <NextLink {...props} />}`, from a client component. There is no `linkComponent` prop. The docs state the one trade-off: React Aria renders a plain anchor, so Next does not prefetch on viewport entry; an app restores it with `router.prefetch(href)` from `onHoverStart` and `onFocus`, or with `render`.
- **Danger.** `variant="danger"` is a look, not a behavior; it pairs with ConfirmDialog in the docs.
- **Scope and direction.** The popover's.

### 9.3 Look

`menu.css`. The popup is the Popover's chrome plus `.menu-popover { min-width: max(var(--trigger-width), 12rem); }` (the source's two data points are 14.5rem and 15rem; 12rem is the floor and a trigger wider than it wins). The list `.menu { display: flex; flex-direction: column; gap: 0.25rem; padding: var(--spacing-part); max-height: inherit; overflow: auto; outline: none; }`: 8px of padding, 4px between rows.

Rows, shared with the listbox rows the choice-controls spec inherits:

| Part | Value | Why |
| --- | --- | --- |
| Row | `display: flex; align-items: center; gap: 0.75rem; min-height: 40px; padding: 0.5rem 0.75rem; border-radius: var(--radius-control); cursor: pointer` | the touch floor; the source's 12px gap and inline padding; the nested-radii table gives a popup's options the control step (a pill would not descend inside a 12px Soft popup) |
| Coarse pointer | `@media (pointer: coarse) { .menu-item { min-height: 44px; } }` | the consumer's 44px on touch |
| Label | `--text-action` (16px, 500, -3%), ink, `overflow-wrap: anywhere` | a menu item is an action |
| Description | `--text-small`, slate (5.49 / 6.94 on float), under the label | hints are slate |
| Icon | 16px, `flex: none`, slate at rest and ink while focused | |
| Shortcut | drawn as a key: 12px, weight 700, overline tracking, tabular figures, `--radius-micro`, `--color-bone` fill, slate; `margin-inline-start: auto` | the one key look (Kbd) |
| Check | 16px, `flex: none`, at the inline end; inside a selectable menu or section every row keeps the check's room (`visibility: hidden`) and a selected row shows it, so the width never changes | color is not the only sign |
| Hover and focused (`[data-hovered]`, `[data-focused]`) | `background-color: color-mix(in srgb, var(--color-ink) 5%, transparent)`, label and icon ink | the 5% wash rule; 1.11 light and 1.14 dark, a cue, not a boundary. Ink on the wash over float 16.65 / 15.25; slate on it 4.95 / 6.08 |
| Keyboard focus (`[data-focus-visible]`) | the ring, inset: `outline: var(--focus-ring-width) solid var(--focus-ring-color); outline-offset: calc(-1 * var(--focus-ring-width))` | a scrolling list clips an outset ring |
| Selected, single | `--color-ink` fill, `--color-canvas` label, icon and check (16.25 / 19.31); the description canvas at 70% over ink (8.34 / 7.34); the inset ring inverts to canvas; the shortcut chip becomes canvas at 20% over ink with canvas text (9.13 / 12.37) | the Appendix B inversion rule |
| Selected, multiple | the check alone, no fill | five selected rows filled with ink would shout and hide the cursor wash |
| Disabled | `--color-taupe` label, icon and shortcut; no wash; `cursor: not-allowed` | the disabled idiom |
| Danger | label and icon `--color-error` (7.46 / 5.73 on float; 6.74 / 5.02 on the wash), no fill | Button already extends error to destructive actions |
| Section heading | `--text-overline` (14px, 700, +4%, uppercase), slate, `padding: 0.5rem 0.75rem 0.25rem` | the source's group label in the eyebrow style, without its dot |
| Separator | `height: 1px; background-color: var(--color-divider); margin-block: 0.25rem` | a rule inside a surface |
| Forced colors | selected row `background-color: Highlight; color: HighlightText`; disabled `GrayText`; the ring stays | a fill alone does not survive |

Nothing animates inside a menu.

## 10. Toast

### 10.1 API

```ts
export type ToastTone = 'success' | 'info' | 'warning' | 'error';

export interface ToastOptions {
  /** The message. Say the outcome in words: the tone only repeats it. Preformatted. */
  title: ReactNode;
  /** A second line, in slate. */
  description?: ReactNode;
  tone: ToastTone;
  /** A button such as "Undo". A toast with an action stays until it is used or dismissed. */
  action?: { label: string; onAction: () => void };
  /**
   * Milliseconds before it leaves, or `null` to stay until dismissed. Unless given: 6000, 12000 for
   * `error`, and `null` with an `action`.
   */
  timeout?: number | null;
  /** Called when it leaves, however it leaves. */
  onClose?: () => void;
}

/** Shows a toast and returns its id. Callable from any client code, including after a server action returns. */
export function toast(options: ToastOptions): string;
toast.dismiss = (id: string): void => ...;
/** Drops every toast, errors included: a new save starts and the last result is stale. */
toast.clear = (): void => ...;

export interface ToastRegionProps {
  /** @default 'Notifications' (React Aria's, localized) */
  'aria-label'?: string;
  /** The dismiss button's accessible name. @default 'Dismiss' */
  dismissLabel?: string;
  /** @default 3 */
  maxVisibleToasts?: number;
  className?: string;
}

/** Mount once, at the app root. */
export function ToastRegion(props: ToastRegionProps): ReactElement;
```

React Aria's toast parts are `UNSTABLE_` in 1.22.1 and may change in a minor. They are wrapped entirely: the public contract is the four lines above, and the changeset pins `react-aria-components` at the exact version so a bump is a deliberate change with a test run behind it.

### 10.2 Behavior

- **The queue** is one `UNSTABLE_ToastQueue` created at module scope with `maxVisibleToasts: 3`, safe to import on the server (it creates no DOM). `toast()` calls `queue.add(content, { timeout, onClose })` and returns the key; `toast.dismiss(id)` calls `queue.close(id)`; `toast.clear()` calls `queue.clear()`. Insertion order is kept; React Aria hides the oldest beyond three.
- **Timing.** `success`, `info` and `warning` 6000ms; `error` 12000ms (parent spec 6.3; a warning is read, not acted on, so it takes the ordinary time); any toast with an `action` has no timeout. Hover over the region and focus inside it pause every timer (React Aria's `pauseAll` on hover and focus-within, resumed when both end), which is WCAG 2.2.1 for free.
- **The region** is `div.overlay.toast-region` carrying `data-react-aria-top-layer`, always mounted, holding two things: a visually hidden polite status element (`role="status"`, `aria-live="polite"`, `aria-atomic="true"`), and React Aria's `UNSTABLE_ToastRegion` (`toast-list-region`, a `region` landmark, F6-reachable), which mounts with the first toast. The attribute keeps the region out of `ariaHideOutside` while a modal is open (React Aria's hide pass marks `[data-react-aria-top-layer]` visible) and out of `useInteractOutside`, so a press on a toast dismisses no dialog; every library modal also passes `shouldCloseOnInteractOutside` for the region, which does not depend on the attribute.
- **Announcement.** `error` keeps React Aria's content role, `alert`, assertive, with its `aria-hidden`-then-shown trick for NVDA. Every other tone is polite and is announced through the always-mounted status element, which a screen reader can only announce reliably because it existed before its text did: when a polite toast is added, the region renders that toast's title and description inside the status element, keyed by the toast's id so each toast is a new node and a repeated "Saved" is announced again. The visible content of a polite toast is not a live region: `ToastContent` receives `role="group"` (React Aria's `useContextProps` merges its own `alert` first and the prop after), so nothing is read twice. A test asserts that a polite toast's DOM has exactly one live element, the status one, and an error toast's has exactly one, its content.
- **Each toast** is React Aria's non-modal `alertdialog` with `tabIndex="0"`, labelled by its title and described by its description. Its dismiss is a 40px ghost `IconButton` with Lucide `X` and `slot="close"`, named `dismissLabel`. Its action is a `Button variant="secondary"` that runs `onAction` and then closes the toast. A toast closed while focused hands focus to the next toast, or back to where it was.
- **Order.** React Aria lists newest first; the list is `flex-direction: column-reverse` so the newest sits nearest the corner and the oldest rises, as the source stacked them.
- **Above modals**, at `--z-toast`.
- **Server actions.** `toast()` is a plain function on a module singleton, so a client component may call it after `await action()` returns. Calling it with no `ToastRegion` mounted enqueues and shows nothing, which a development warning notes once.

### 10.3 Look

`toast.css`.

- **Region.** `position: fixed; inset-block-end: calc(var(--overlay-inset) + var(--toast-offset-block, 0px)); inset-inline-end: var(--overlay-inset); z-index: var(--z-toast); width: min(28rem, calc(100vw - 2rem)); display: flex; flex-direction: column-reverse; align-items: flex-end; gap: var(--spacing-part); pointer-events: none` (each toast sets `pointer-events: auto`). `--toast-offset-block` is 0 and exists so a save bar can lift the stack by its height in a later phase.
- **Toast.** `width: 100%; display: flex; align-items: flex-start; gap: 0.75rem; padding: 1rem var(--spacing-peer); border: 1px solid var(--color-frame); border-inline-start: 4px solid var(--toast-stripe); border-radius: var(--radius-surface); background-color: var(--color-float); box-shadow: var(--shadow-float)`. Padding is 16px by 24px, regularized from the source's 20 by 16. `--toast-stripe` is `--color-slate` for `info`, `--color-success`, `--color-warning`, `--color-error`, keyed on `data-tone`; measured against float, light / dark: slate 5.49 / 6.94, success 7.44 / 6.34, warning 6.33 / 8.92, error 7.46 / 5.73, all over the 3:1 of a graphic.
- **Text.** Title `--text-body` ink; description `--text-small` slate, 4px under it. `overflow-wrap: anywhere`, so a long word never widens the stack.
- **Controls.** The action button and the dismiss sit at the end; the dismiss takes `margin-block: -0.5rem; margin-inline-end: -0.5rem` so a one-line toast stays 56px tall while the target stays 40px.
- **Motion.** `.toast { transition: opacity 180ms ease, translate 180ms ease; } @starting-style { .toast { opacity: 0; translate: 0 8px; } }`. Exit is instant: React Aria's toast has no `data-exiting`. Reduced motion removes the transition. On the floor browsers without `@starting-style` the toast appears.
- **Forced colors.** The frame survives as `CanvasText`; the stripe is repainted too, so tone is carried only by the words, which is how the source already worked. The docs rule: the title says the outcome.
- **Right to left.** The stripe is `border-inline-start`, the region `inset-inline-end`, and React Aria sets `dir` on its region.

## 11. CommandPalette

### 11.1 API

```ts
export interface CommandPaletteItem {
  id: Key;
  /** The label, matched by the default filter and announced. */
  label: string;
  /** A subtitle under the label, matched too. */
  description?: string;
  /** Extra text that matches but is not drawn. */
  keywords?: string;
  /** A 16px icon at the start. */
  icon?: ReactNode;
  /** A preformatted value at the end, such as an amount. Never formatted here. */
  end?: ReactNode;
  /** A key hint, drawn as keys. "Mod" draws as the platform's modifier after mount and as "Mod" on the server. */
  shortcut?: string;
  /** Items with the same section are grouped under it, in first-seen order. Items without one come first. */
  section?: string;
  isDisabled?: boolean;
}

export interface CommandPaletteLabels {
  /** @default the `label` */
  placeholder: string;
  /** @default 'No results' */
  empty: string;
  /** @default 'Loading' */
  loading: string;
  /** @default 'Recent' */
  recent: string;
  /** The status line. @default (count, query) => count === 0 ? `No results for ${query}` : `${count} results` */
  status: (count: number, query: string) => string;
  /** @default 'Esc' */ escape: string;
  /** @default 'to move' */ move: string;
  /** @default 'to open' */ open: string;
}

export interface CommandPaletteProps {
  /** The dialog's and the input's accessible name, and the placeholder unless `labels.placeholder` is given. Required. */
  label: string;
  /** Every item that may show. In manual mode (`filter={null}`) the app passes the current results, already ordered and capped. */
  items: CommandPaletteItem[];
  /** Runs when an item is chosen, after the palette has closed and focus has returned. The app navigates here. */
  onAction: (item: CommandPaletteItem) => void;
  isOpen?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (isOpen: boolean) => void;
  inputValue?: string;
  defaultInputValue?: string;
  onInputChange?: (value: string) => void;
  /**
   * Keeps or drops an item for a query. Unless given: every whitespace-separated word of the query
   * appears in the label, description or keywords, case and accent insensitive. `null` is manual mode:
   * the items are shown as given, and the app filters, ranks and caps them from `inputValue`.
   */
  filter?: ((item: CommandPaletteItem, query: string) => boolean) | null;
  /** Shows the Spinner in the field row while the app loads results. The list keeps what it has. */
  isLoading?: boolean;
  /** The key that opens and closes it. `Mod` is Cmd or Ctrl, either. `false` turns it off. @default 'Mod+K' */
  shortcut?: string | false;
  /** Remembers chosen items in this browser under this key. */
  storageKey?: string;
  /** @default 5 */
  recentLimit?: number;
  /** Controlled recents, newest first. With `onRecentChange`, the palette stores nothing. */
  recentIds?: Key[];
  onRecentChange?: (ids: Key[]) => void;
  labels?: Partial<CommandPaletteLabels>;
  /** Goes on the surface. */
  className?: string;
  ref?: Ref<HTMLElement>;
}
```

There is no trigger export: the trigger is the app's own button, opening through `isOpen`, with the key hint shown by `Kbd`. There is no `href` and no routing inside: the app navigates in `onAction`.

### 11.2 Behavior

- **Composition.** `ModalOverlay.overlay-scrim.command-palette-overlay` > `Modal.overlay.command-palette` > `RACDialog` (named by `label`, `aria-label`) > `Autocomplete` wrapping a `TextField` with `Input.command-palette-input` and the private `MenuList` (`menu command-palette-list`) with `MenuItem` rows, `MenuSection`s and `renderEmptyState`. Autocomplete gives the input virtual focus: `aria-activedescendant`, `aria-controls`, `aria-autocomplete="list"`, `autoComplete="off"`, `spellCheck="false"`. The first task is a short spike in VoiceOver and NVDA: if `role="menu"` behind `aria-activedescendant` reads badly, the collection becomes React Aria's `ListBox` (`selectionMode="none"`, `onAction`) with no change to the public API, and the choice is recorded in Appendix B.
- **The shortcut.** A `keydown` listener on `document`, installed in an effect while the palette is mounted and removed on unmount. `Mod+K` matches `metaKey` or `ctrlKey` (either; no platform sniffing) with `key` K, case-insensitive, and no `altKey`; the grammar is tokens joined by `+`, modifiers `Mod`, `Shift`, `Alt`, then one key compared with `event.key`. It toggles. It is ignored when `event.defaultPrevented` (an editor that owns the key gets it), when `event.isComposing`, and while any other modal is open in the overlay stack, so a ConfirmDialog is never skipped past. When it acts it calls `preventDefault()`.
- **Open.** The input takes focus (`autoFocus`). An uncontrolled input is cleared on every open, as the source cleared it; a controlled `inputValue` is the caller's and is left as it is. The list shows: a Recent section, when the input is empty and there are recents; then every item the app passed, in its sections. The default filter applies only once there is text.
- **Typing.** In default mode the filter keeps an item when every whitespace-separated word of the query appears in its label, description or keywords, through React Aria's `useFilter({ sensitivity: 'base' }).contains`. In manual mode the list is what `items` holds. React Aria gives the first item virtual focus as the person types forward, and clears it on backspace and delete so a screen reader is not interrupted; that is accepted.
- **Keys.** Arrow Down and Up move the active row and wrap (`shouldFocusWrap`); Home, End, Page Up and Page Down reach the list; Enter runs the active item; Escape closes the palette at once, text or no text, because the input is a plain `TextField` and not a `SearchField` (which would clear first); typing filters; Tab stays in the dialog (the input is its only tab stop); Enter during an IME composition chooses nothing (React Aria checks `isComposing`).
- **Pointer.** Hover moves the active row with the wash; a press chooses. React Aria's press handling keeps focus in the input, so the blur the source worked around does not arise.
- **Choosing.** In this order: record the item in recents; close the palette (`onOpenChange(false)`, or its own state); wait for the overlay to exit (React Aria's `ModalOverlay` `onExit`) and for focus to be restored, which `FocusScope` does in the frame after unmount; then call `onAction(item)` in the next frame. The source said why: the dialog closes first so the focus it gives back lands before whatever the app moves focus on to, and the last word is the caller's. A play test in a real browser pins it: `onAction` focuses a field and the field keeps focus.
- **Recents.** With `storageKey`, one `localStorage` entry per key, `snapshot-ui:recent:<storageKey>`, a JSON list of ids as strings, newest first, cut to `recentLimit`; a chosen item moves to the front, never doubles. Read through `useSyncExternalStore` with the `storage` event for other tabs and an empty server snapshot. An id that is not in `items` at open is dropped, not shown with a stale name. Unreadable JSON, a non-list, blocked storage or a refused write mean no history and no error. With `recentIds` and `onRecentChange` the palette stores nothing and reports the new list. Only an item chosen from the palette is recorded.
- **Status.** A visually hidden `role="status"` element, mounted from the first render, says `labels.status(count, query)` 600ms after typing pauses (each keystroke cancels the pending one), and says nothing while the query is empty. While `isLoading` it waits; when results land the count is said. The same 600ms is the quiet period the Pagination digest chose, so the library has one number.
- **Loading.** `isLoading` draws the 24px `Spinner` (`size="md"`, named `labels.loading`) at the field row's end, before the Esc key. The list keeps what it has; the app decides whether stale results stay visible.
- **Empty.** With text and no items, `renderEmptyState` draws `labels.empty`.
- **Scope and direction.** `useOverlayScope` from `document.activeElement` at open (the shortcut's origin is wherever focus was, which is the page's scope); `dir` from `useLocale()` on the overlay.

### 11.3 Look

`command-palette.css`. The surface is the docs site's search dialog look, already derived on the tokens and checked in both themes, not the source's stadium panel: a floating surface takes 24px wherever it opens.

| Part | Value |
| --- | --- |
| Scrim grid | `.command-palette-overlay { align-content: start; justify-items: center; padding: 12vh var(--overlay-inset) var(--overlay-inset); }`: top-anchored, so a list that grows down from a fixed input is steady to read |
| Surface | `width: min(40rem, 100%); max-height: min(35rem, calc(88dvh - 1rem)); display: flex; flex-direction: column; overflow: hidden; border: 1px solid var(--color-frame); border-radius: var(--radius-surface); background-color: var(--color-float); box-shadow: var(--shadow-float)` |
| Field row | `display: flex; align-items: center; gap: 0.75rem; padding: 1rem var(--spacing-peer); border-block-end: 1px solid var(--color-divider)`: Lucide `Search` 20px slate (`aria-hidden`), the input, the Spinner while loading, then `Kbd` with `labels.escape` |
| Input | `flex: 1; min-width: 0; border: 0; background: transparent; color: inherit; font: inherit; font-size: var(--text-body); outline: none` |
| Focus line | while the input is `:focus-visible` the row's bottom border turns `--focus-ring-color` and gains `box-shadow: 0 1px 0 var(--focus-ring-color)`, a 2px ink line with no layout shift; in forced colors the input's own outline returns (`outline: auto`) because a border color change does not survive |
| Placeholder | `--color-slate`. The palette has no visible label, so the placeholder is the only visible name of the field and is read: 5.49 light and 6.94 dark on float. An Appendix B exception to the taupe placeholder rule, recorded with that reason |
| Body | `flex: 1 1 auto; min-height: min(20rem, 50dvh); overflow-y: auto; overscroll-behavior: contain`: the floor keeps one height while the text changes, and a longer list scrolls inside |
| List and rows | the Menu's list and rows (section 9.3), inline, with no popover around them; the `end` slot is `--text-small`, ink, tabular figures, `flex: none`, before the shortcut; the Recent heading and any section heading are the Menu's |
| Active row, keyboard (`[data-focus-visible]`) | `--color-ink` fill, `--color-canvas` label, icon and end (16.25 / 19.31), description canvas at 70% (8.34 / 7.34). DOM focus never leaves the input, so this is the keyboard user's only focus indicator and must be strong; React Aria sets `data-focus-visible` only for keyboard-driven focus |
| Active row, pointer (`[data-focused]` without focus-visible) | the 5% wash |
| Empty line | `padding: var(--spacing-peer); color: var(--color-slate); text-align: center` |
| Footer | `display: flex; gap: 1rem; padding: 0.5rem var(--spacing-peer); border-block-start: 1px solid var(--color-divider); color: var(--color-slate); font-size: var(--text-small)`: `Kbd` pairs for Up and Down with `labels.move`, Enter with `labels.open`; hidden under `@media (pointer: coarse)` because a phone has no keys to hint |
| Motion | the dialog's 180ms fade and 8px rise |
| Forced colors | the active row `Highlight` with `HighlightText`; borders survive |
| Right to left | the glass at the inline start, the Esc key at the inline end, label then end then shortcut in reading order; logical properties |

### 11.4 Docs dogfooding

The docs site keeps its hand-built search dialog in this batch. Replacing it with CommandPalette, in its own task after the component lands, is recorded as a follow-up in section 16.

## 12. Tooltip

### 12.1 API

```ts
export interface TooltipTriggerProps extends RACTooltipTriggerProps {
  /** Milliseconds of hover before it opens. @default 400 */
  delay?: number;
  /** Milliseconds after the pointer leaves before it closes, so the pointer can cross onto the tip. @default 120 */
  closeDelay?: number;
}

export interface TooltipProps extends Omit<RACTooltipProps, 'className' | 'children' | 'style'> {
  /** The text. It is the trigger's accessible description while open. */
  children: ReactNode;
  /** A key hint after the text, such as "K" or "Mod K", drawn as a key on the tip. */
  shortcut?: string;
  /** @default 'top' */
  placement?: Placement;
  /** The gap to the trigger, the arrow included. @default 12 */
  offset?: number;
  className?: string | ((values: TooltipRenderProps & { defaultClassName: string | undefined }) => string);
  ref?: Ref<HTMLDivElement>;
}
```

`TooltipTrigger` wraps React Aria's so the library's delays apply; `Tooltip` wraps `Tooltip` with `OverlayArrow`. Classes `overlay tooltip`, `tooltip-arrow`, `tooltip-shortcut`.

### 12.2 Behavior

- **Opening.** After 400ms of hover with a mouse; at once on keyboard focus (`:focus-visible` only: React Aria opens on focus only when the focus is visible, so a click's focus shows no tip). Never for touch: React Aria's trigger ignores a touch pointer, and a test with a touch pointer asserts nothing opens. A disabled trigger is not focusable and gets no tip; a static element needs React Aria's `Focusable`.
- **Warm window.** React Aria keeps a global warm-up: once a tip has opened, the next opens with no delay for `TOOLTIP_COOLDOWN`, 500ms, counted from the moment a close starts. With the 120ms close delay the next tip is warm for about 380ms after the last visibly closed. That is near the source's 300ms and not configurable without reimplementing the state hook, so it is accepted, and parent spec 6.3 is amended from "for 300ms after one closes the next opens without delay" to "and for about half a second after one closes the next opens without delay".
- **Closing.** When the pointer leaves, after 120ms, unless it moved onto the tip (the tip is hoverable, WCAG 1.4.13); on Escape, which closes the tip and not the dialog it sits in; on a press of the trigger; when a scrollable ancestor of the trigger scrolls; on window resize. Escape and the scroll and resize closes are React Aria's and a play test pins each.
- **Announcement.** The tip is `role="tooltip"` and the trigger carries `aria-describedby` while it is open. The source hid its tip from assistive technology because the item already carried the same name; the library accepts React Aria's description, and the docs say a tooltip is supplementary: on an icon button it mirrors the `aria-label`, which a screen reader may read twice. The fallback, if testing with NVDA and VoiceOver before the shell ships finds it reads badly, is `aria-hidden` on the tip, which React Aria passes through.
- **Readiness for the rail.** The collapsed rail passes `isDisabled` to `TooltipTrigger` while it is expanded, and `shortcut` on the search item's tip. Nothing in the tooltip knows about the rail.
- **Scope and direction.** `useOverlayScope` from the trigger ref React Aria gives the tip; `dir` from `useLocale()` on the tip, which React Aria does not set.

### 12.3 Look

`tooltip.css`.

| Part | Value | Why |
| --- | --- | --- |
| Surface | `background-color: var(--color-ink); color: var(--color-canvas); border: 1px solid transparent; border-radius: var(--radius-micro); box-shadow: var(--shadow-float)` | the source's ink tip; the design document lists tooltips under the 6px step; the transparent border is repainted in forced colors so the tip keeps a shape |
| Contrast | canvas on ink 16.25 light, 19.31 dark; the tip against canvas, lifted, float and raised 16.25 to 18.43 light and 15.36 to 19.31 dark | no edge needed |
| Text | `--text-small` (14px, 450), `padding: 0.375rem 0.625rem`, `max-width: min(20rem, 100vw - 2rem)`, `overflow-wrap: anywhere` | 14px is the sentence floor and 13px is under it; light on dark at 450 renders heavier than it measures; wrapping so a description tip never runs off a 320px screen |
| Arrow | an 8px `OverlayArrow` svg filled with the tip's color, placed by `data-placement` | the source has one |
| Shortcut chip | 12px, weight 700, overline tracking, tabular figures, `--radius-micro`, `background-color: color-mix(in srgb, var(--color-canvas) 20%, transparent)`, canvas text, `margin-inline-start: 0.5rem` | the one key look, inverted for the ink tip; canvas on the chip 9.13 light and 12.37 dark; the source's pill was a rail-local choice |
| Motion | `transition: opacity 140ms ease-out, translate 140ms ease-out`; `[data-entering]` and `[data-exiting]` are `opacity: 0` with a 4px `translate` toward the trigger by `data-placement`; off under reduced motion | the source's 140ms ease-out |
| Forced colors | `.tooltip-arrow { display: none; }` and the border carries the shape | an svg fill is repainted |
| Right to left | `end` resolves to the left; the chip's margin is logical | |

## 13. Decisions

The owner's rulings, now written in, and the decisions this document adds. Each is binding on the plan.

### 13.1 Ruled by the owner

**Shared layer.** The z ladder (`--z-modal` 1000, `--z-toast` 1100, React Aria's positioned overlays at 100000); one scrim when modals stack; every overlay on `--color-float` with the edges, elevations and corners of the table in 4.5; the motion table, all of it off under reduced motion; the focus rules; width caps against the viewport; the forced-colors and right-to-left rules. Each overlay root copies `data-theme`, `data-shape` and `data-density` from its trigger's nearest scoped ancestor; `UNSAFE_PortalProvider` is documented only as the escape hatch and brings no dependency. Every overlay root sets `dir` from `useLocale()`. Popup rows (menu and listbox) take `--radius-control`, never a pill. Server-safe: no `Intl` during render, no `window` or `document` at render or import, no first-paint measurement, preformatted strings accepted, module singletons safe to import on the server. Every link-bearing part navigates through `RouterProvider`, with React Aria's inherited `render` prop as the per-item escape hatch; no `linkComponent` prop.

**Foundations.** `--color-warning` (`#8a5300` / `#e8b04f`), `--color-gain` (`#2a5f46` / `#6cc195`), `--text-numeral` (3.5rem, 1, -0.03em, 500) and `--text-numeral-sm` (2rem, 1.1, -0.02em, 500) under exactly those names and values; each measured on every surface in both themes and given a derivation and a meaning rule (warning means warning only, gain means money in only), with the measurements and the warning-to-clay distance recorded. The numeral classes set the four properties plus tabular figures and `nowrap`, follow the typography class naming, and the large one steps to 2.75rem below the small breakpoint, written out and tied to the breakpoint by a test. A `warning` tone on Badge.

**Dialog.** Stacking allowed. `title` required, rendered as React Aria's `Heading slot="title"`. Width `min(28rem, 100vw - 2rem)` with `size` `md` or `lg` (40rem). 32px padding and `--radius-stadium`. `isDismissable` defaults true. The close button is opt-in. The body scrolls and the action row stays. Focus moves in and returns to the trigger, Escape closes, and the page behind does not scroll through React Aria's `usePreventScroll`, pinned by a test.

**ConfirmDialog.** `role="alertdialog"`. `confirmLabel` required and naming the outcome. `tone` is `default` or `danger` and is required; danger gets the icon well and the danger Button. `cancelLabel` defaults to "Cancel". Escape and an outside press mean cancel; `isDismissable={false}` opts out. Initial focus on Cancel for danger and on Confirm otherwise. `isPending` uses Button's pending state and ignores dismissal. `useConfirm()` ships, promise-returning, with no provider.

**Drawer.** On Modal. A floating panel 16px from the edges with `--radius-stadium`. `placement` `start` or `end`. Width `min(20rem, 100vw - 2rem)`. The close button on by default; the shadow `--shadow-dramatic`.

**Sheet.** On React Aria's `Sheet` family, decided by a spike in Chromium, WebKit and Firefox, with the Modal composition and no dragging as the fallback behind the same API. Height up to `92dvh`, recorded as the consumer's number. Only the top corners rounded, `--radius-stadium`. A decorative grabber. Safe-area padding at the bottom. `title` required, with `isTitleHidden`. The same focus rules as Dialog; Escape and a scrim press close it.

**Popover.** Chrome only; `isPadded` gives 24px. Flips to fit, React Aria's default, stated and tested.

**Menu.** A true `role="menu"`. Items carry an icon, a label, a description, a shortcut drawn as a key, sections with headings, separators and `variant="danger"` (error text, no fill). Rows at least 40px, 44px under `pointer: coarse`. Single selection gets the ink fill and the check; multiple gets the check alone. `min-width: max(var(--trigger-width), 12rem)`. 4px between rows and 8px of popup padding. Items with `href` navigate through `RouterProvider`, with the Next wiring documented.

**Toast.** Tones success, info, warning and error. A toast with an `action` has no timeout; the rest follow 6.3. Errors `role="alert"`; every other tone polite through an always-mounted polite region in `ToastRegion`. Above modals. At most 3 visible. Entry through `@starting-style`, exit instant. The 40px IconButton dismisses. Padding 16px by 24px. Hover and focus pause the timer. React Aria's `UNSTABLE_` toast API wrapped behind `toast({ title, description?, tone, action?, timeout? })`, which returns an id, `toast.dismiss(id)` and `<ToastRegion />` mounted once. Callable from any client code after a server action returns.

**CommandPalette.** Cmd or Ctrl+K, configurable through `shortcut` or `false`, ignored when `defaultPrevented`, during composition and while another modal is open. Recents through `storageKey` (ids, 5, newest first, stale dropped, silent failure, empty server snapshot) or controlled `recentIds` and `onRecentChange`. Sections. App-driven async results through controlled `inputValue` and `onInputChange`, `items` from the app, `filter={null}` for manual mode and `isLoading` with the Spinner; a case- and accent-insensitive AND-of-words default filter otherwise. Items with an icon, a label, a description, a preformatted `end` slot and a `shortcut`. Arrows, Enter and Escape, the input a plain TextField so Escape closes at once. `onAction(item)` after the palette closes and focus is restored; no `href`, no routing. The docs search dialog's look: float, `--radius-surface`, frame edge, `--shadow-float`, top 12vh, width `min(40rem, 100vw - 2rem)`. The keyboard-active row ink-filled; pointer hover the 5% wash. An always-mounted status line after typing pauses. A slate placeholder, recorded as an Appendix B exception. A `labels` object. Autocomplete plus Menu, with ListBox as the fallback at no API change. The docs site's own search dialog not replaced in this batch.

**Tooltip.** React Aria's description announcement accepted. `--text-small`, wrapping at `min(20rem, 100vw - 2rem)`. Delays derived from 6.3, with 6.3's warm-window wording amended. Never on touch. The ink surface, `--radius-micro`, a transparent 1px border for forced colors.

### 13.2 Added by this document

1. `tone` is the prop name on Dialog as well as ConfirmDialog, and Dialog takes `icon` and `tone` because ConfirmDialog is built on it; ConfirmDialog's `tone` is required (controller ruling: the source defaulted to danger on purpose, and a default either way hides a choice the caller must make), and its danger well shows Lucide's `TriangleAlert` unless `icon` is given.
2. ConfirmDialog's `description` is required, so an alert dialog is always described.
3. `onConfirm` may return a promise, which puts the dialog in the pending state until it settles; a rejection keeps it open and is not swallowed. `isPending` remains for controlled callers.
4. `useConfirm()` returns `{ confirm, dialog }`; a second `confirm` resolves the open one `false`, unmounting resolves `false`, and the hook offers no pending state (the component does).
5. Drawer's `title` is required with `isTitleHidden`, the same rule as Sheet; Drawer and Sheet take a `footer` slot; Drawer pads 24px; Drawer resolves its side into `data-side` so the slide is physical.
6. Sheet rises from the bottom only (`position` is not a prop), is `min(100%, 36rem)` wide, pads 24px by the design document's mobile padding, casts no shadow, has `hasGrabber` and `hasCloseButton` on by default, and passes `snapPoints` through.
7. Popover adds `matchTriggerWidth`, keeps React Aria's 8px `offset`, and has no arrow.
8. Menu's list is a private `MenuList` that CommandPalette reuses inline; the check is Lucide's 16px `Check` with its room reserved on every row of a selectable section; rows pad 8px by 12px with a 12px inner gap and an action-step label; the shortcut is drawn as a bone key, inverted on an ink row; `shouldCloseOnSelect` defaults true in single mode and false in multiple; section headings take `--text-overline`; `MenuSeparator` is exported.
9. `toast()`'s `tone` is required; `toast.clear()` is part of the contract (a new save drops the last result); `warning` stays 6 seconds; the action is a secondary Button that closes the toast after `onAction`; a polite toast's visible content is `role="group"` and the status element's child is keyed by the toast id so a repeat is announced; the list is `column-reverse`; `--toast-offset-block` exists for a later save bar; every library modal passes `shouldCloseOnInteractOutside` for the region in addition to the top-layer attribute.
10. CommandPalette ships no `suggestions` in v1; with an empty input it shows Recent then every item the app passed; an uncontrolled input is cleared on open and a controlled one left alone; `onAction` waits for the overlay's `onExit` and one more frame; recents live in one entry per key, `snapshot-ui:recent:<storageKey>`; the status line waits 600ms; the Spinner is the 24px size; the footer hides on coarse pointers and the Esc key sits in the field row; the focus line is a border color plus a 1px box-shadow with the input's own outline restored in forced colors; the `end` slot is small ink tabular text; the surface's height is `min(35rem, calc(88dvh - 1rem))`; React Aria's empty-input behavior (no active row until Down or typing) is accepted rather than spiked; the shortcut grammar is modifiers joined by `+` with `Mod` meaning either Cmd or Ctrl.
11. Tooltip keeps the source's arrow, an `offset` of 12 with the arrow inside it, closes on ancestor scroll and on resize as React Aria does, draws the shortcut chip in canvas at 20% over ink, and names `aria-hidden` on the tip as the fallback if the double reading proves bad.
12. The shared layer is two classes, `overlay` on every portaled root and `overlay-scrim` on every modal overlay; `--overlay-inset` is declared on `overlay`; the scope copy falls back to `document.activeElement` at open when React Aria gives no trigger ref, and lands on the panel rather than the scrim; one scrim is kept by a module-level overlay stack that marks the others `data-stacked`, and the same stack answers the palette's "another modal is open".
13. `z.modal` and `z.toast` are a `z` group in `tokens.json`, numbers, outside the Tailwind theme.
14. The numeral sizes are `Text size="numeral" | "numeral-sm"`, classes `copy-numeral` and `copy-numeral-sm`.
15. Ten pairs join the contrast gate (warning and gain on five surfaces), warning is gated on bone too, and Badge's "sixteen pairs" becomes twenty.
16. Parent spec 6.3's tooltip sentence is amended to "and for about half a second after one closes the next opens without delay".
17. One changeset per part, all minor, `core` and `react` together; the changeset for Toast pins `react-aria-components` exactly; a WebKit Playwright project joins the Storybook config for the sheet.

## 14. Accessibility

- **Axe** passes in light and dark on the open state of every story, including each overlay inside a dark scope; a tooltip needs an open story because its closed state has nothing to check.
- **Names.** Every dialog, drawer and sheet is named by its required title; a popover by its trigger; a menu by its trigger; the palette by `label`; a toast by its title; the toast region by React Aria's localized "Notifications"; a tooltip is the trigger's description.
- **Keyboard.** The Keys tables in section 16 are the contract: every overlay opens, moves and closes from the keyboard, Escape closes the topmost only, focus returns to the trigger, and the sheet's close button is always present while it is dismissable because a swipe is not a keyboard path.
- **Target size.** Menu rows 40px and 44px on touch; every button 40px; the sheet's grabber band 44px; the toast dismiss 40px.
- **Visible focus.** Rings on every control inside an overlay; the `tabIndex="-1"` containers take none; inset rings in lists invert on ink rows; the palette's keyboard-active row is an ink fill because DOM focus never leaves its input.
- **Reduced motion** stops every transition and animation in every overlay, and the sheet's programmatic scrolls become instant.
- **Forced colors.** Scrims stay translucent; ink-filled rows become `Highlight`; the tooltip keeps a border and loses its arrow; the grabber is `CanvasText`; disabled rows `GrayText`; every border survives.
- **Right to left.** Every root carries `dir`; `start` and `end` placements resolve; the drawer slides from the inline start; the toast stripe and region mirror; the palette's glass and key hint swap ends.
- **Live regions.** Errors are assertive; everything else polite through regions that exist before their text; the palette's status line and the toast region's status element are mounted from the first render.
- **Touch.** No tooltips; the palette's key hints hidden; the sheet swipes and still closes by button.

## 15. Testing

Every part has unit tests in vitest with axe (`expectNoA11yViolations` on each state), story play tests tagged `no-visual` for what needs a layout or a timer, and visual stories baselined in the five standard modes (Rounded light and dark at 1280, Soft and Square light at 1280, Rounded light at 375). Portaled content is found through `document.body` (Testing Library's `screen`, Storybook's `within(document.body)`). Visual stories render open (`defaultOpen`) and stable (`timeout: null` for toasts, no timers). jsdom has no `getAnimations`, so React Aria mounts and unmounts at once in unit tests and motion is checked in Storybook only. Every client part joins `packages/react/test/server-render.test.tsx` (closed, it renders nothing or its trigger) and `test/empty-parts.test.tsx` where it has optional parts.

**Core CSS** (`packages/core/test/css.test.js`), for every new file: `@layer components` only; tokens only (Stylelint); reduced motion wherever it moves; the focus ring token and never ink; system colors only inside the forced-colors block; hover inside `@media (hover: hover)`; `styles.css` imports it. Plus, one each: `overlay.css` declares `--overlay-inset` and the scrim's `forced-color-adjust: none`; `menu.css` has the 40px row and the 44px coarse-pointer rule; `copy.css`'s numeral step equals `--breakpoint-sm`; `tooltip.css` hides the arrow and keeps the border in forced colors. `test/tokens.test.js` holds the new contract names and the dark values; `test/contrast.test.js` holds the ten new pairs and passes in both themes.

**Foundations.** Unit: `Text size="numeral"` renders `copy copy-numeral`; Badge `tone="warning"` renders `badge badge-warning`; both stay static (`test/server-components.test.tsx`). Visual: `Text` numeral stories (a hero amount, a tile pair at `numeral-sm`), Badge `Warning`. No play tests.

**Dialog.** Unit: the title names the dialog and is an `h2`; the description describes it; the close button only when asked, named `closeLabel`; `size` sets `data-size`; `tone` sets `data-tone` and the well; parts render nothing when absent; `className` on the panel, `overlayClassName` on the scrim, `ref` on the dialog; Escape closes and `isKeyboardDismissDisabled` stops it; an outside press closes and `isDismissable={false}` stops it; a press on an element carrying the toast region's class does not close it; controlled and uncontrolled; `children` and `actions` as functions receive `close`; the scroll lock style is set while open and cleared after; axe. Play (`no-visual`): focus moves to the dialog on open and to an `autoFocus` child when given, Tab cycles inside, focus returns to the trigger; two stacked dialogs paint one scrim (the second overlay's computed background is transparent) and Escape closes the topmost first; the panel copies `data-theme` from a dark card's trigger; the body scrolls and the actions stay in view at 375px. Visual: `Default` (icon, title, description, one primary action), `Danger`, `LongBody` (scrolling, pinned actions), `Large`, `WithCloseButton`, `InDarkScope`.

**ConfirmDialog.** Unit: `role="alertdialog"`, described by the description; Cancel first in DOM order, then Confirm with `confirmLabel`; the danger tone draws the danger Button and the default well icon, the default tone the primary Button and no well; Escape, outside press and Cancel each call `onCancel` once and close; Confirm calls `onConfirm` and closes; a promise from `onConfirm` sets pending (the confirm button `data-pending`, Cancel disabled, Escape ignored) and closes on resolve, stays open on reject; `isPending` does the same; `useConfirm` resolves `true` on confirm, `false` on each other exit, `false` for a question replaced by a second `confirm`, and `false` on unmount, and `dialog` is `null` before the first call; axe in both tones. Play: focus lands on Cancel in danger and on Confirm in default. Visual: `Danger`, `Default`, `Pending`.

**Drawer.** Unit: named by the title, hidden title still names it; `placement` and direction resolve to `data-side` (`start` under `dir="rtl"` is `right`); the close button by default and off with `hasCloseButton={false}`; `footer` renders only when given; Escape and scrim press; controlled and uncontrolled; focus return; axe. Play: focus trap and restore; the scrim press closes; the body scrolls with a long list at 375; the panel sits 16px from the viewport's edges; `end` under `dir="rtl"` is on the left. Visual: `Start`, `End`, `LongList` (375), `HiddenTitle`, `InDarkScope`, and a `no-visual` RTL story in `rtl/RightToLeft.stories.tsx`.

**Sheet.** The spike in 7.6 comes first and its result is recorded. Unit (with the `IntersectionObserver`, `ResizeObserver` and `scrollTo` stubs): named by the title; `isTitleHidden`; the grabber `aria-hidden` and absent with `hasGrabber={false}`; the close button; `footer`; `isDismissable={false}` passes `preventDismissal` (or disables dismissal on the fallback); Escape; controlled from `isOpen`; renders nothing closed and on the server; axe. Play, run in Chromium and WebKit: open and focus in; Escape and scrim press close; a swipe down dismisses; the body scrolls inside at 92dvh and the sheet stays; two sheets stack with one scrim; a text field inside with a shrunk visual viewport; reduced motion; `data-theme` copied from a dark trigger. Visual, all at 375 as well as the four 1280 modes: `Basic` (title, short body, footer), `Overflowing` (a body past the cap), `HiddenTitle` (the "More" list), `Focused` (the close button ringed), `InDarkScope`.

**Popover.** Unit: opens from `DialogTrigger`, `role="dialog"` named by the trigger; `isPadded` and `matchTriggerWidth` classes; Escape and outside press close; focus returns; axe. Play: `data-placement="top"` when the trigger is at the viewport's bottom; the popover's `min-width` equals the trigger's width with `matchTriggerWidth`; the wrapper copies `data-shape` from a Soft scope. Visual: `Below`, `Flipped`, `Padded`, `MatchTriggerWidth`, `InDarkScope`.

**Menu.** Unit: `role="menu"` named by the trigger; items with icon (hidden), label, description (the item's description), shortcut (`kbd` text), danger class, disabled; sections with headings; separators; single selection renders `menuitemradio` and shows the check, multiple renders `menuitemcheckbox`; the check's room is reserved on every row of a selectable section; `onAction` with the key; a single-mode choice closes the menu and a multiple one keeps it open; an `href` item renders an anchor and calls `RouterProvider`'s `navigate`; `render` on an item is honored; axe. Play: Arrow Down and Up, Home and End, typeahead; Escape returns focus to the trigger; Tab closes; the wash on pointer hover and the inset ring on keyboard focus (computed styles against `washColor` and `tokenColor`); the min-width is the larger of the trigger and 12rem; the selected row's ring is canvas; rows are 44px under a coarse pointer (Playwright `hasTouch`). Visual: `Basic` (icons, a shortcut, a description, a disabled item, a danger item, a section heading, a separator), `SingleSelection`, `MultipleSelection`, `KeyboardFocus`, `InDarkScope`, and a `no-visual` RTL story (icon at the start, check at the end).

**Toast.** Unit (fake timers): `toast()` returns an id and the toast appears with its tone attribute and stripe class; 6000ms for success, info and warning, 12000ms for error, none with an action, `timeout` overrides; `toast.dismiss` and `toast.clear`; at most three visible, oldest hidden; a polite toast writes its title and description into the status element and has exactly one live element; an error toast has exactly one, its content, `role="alert"`; the dismiss is a 40px icon button named `dismissLabel`; the action runs `onAction` and closes; `onClose` fires; the region wrapper carries `data-react-aria-top-layer`; the module imports with no `window`; axe. Play: hover and focus pause the timer and leaving resumes it; a focused toast's dismissal moves focus to its neighbor; a dialog stays open when a toast's button is pressed. Visual: `Tones` (four stacked, each with a description, `timeout: null`), `WithAction`, `Short`, `LongText` (375), `DismissFocused`.

**CommandPalette.** Unit: named by `label`, the input by `label`, the placeholder `labels.placeholder` or the label; the status element exists from the first render and says `labels.status` after 600ms of quiet (fake timers), nothing for an empty query; the default filter ANDs words, ignores case and accents, and searches label, description and keywords; manual mode shows items as given; sections group in first-seen order after ungrouped items; Recent appears first with an empty input and holds only ids that exist, newest first, limit 5, repeats moved, blocked storage and bad JSON ignored, nothing stored when controlled; `isLoading` renders the Spinner; the empty line; Escape with text closes at once; Enter chooses the active item; Enter while composing chooses nothing; Mod+K toggles with Meta and with Ctrl, not with Alt, not when `defaultPrevented`, not while composing, not while another modal is open, and `shortcut={false}` installs nothing; `onAction` is called once with the item; axe. Play: Down wraps at the end and Up at the start; hover moves the active row with the wash and not the ink fill; keyboard focus draws the ink fill (`tokenColor('--color-ink')`); the forced-colors active row (`forcedColors: 'active'`); `onAction` focuses a field and the field keeps focus after the restore; the footer is hidden under a coarse pointer; the surface sits 12vh from the top. Visual: `Recent`, `Results` (sections, icons, ends, shortcuts, the keyboard-active row), `NoMatch`, `Loading`, `Narrow` (375), `InDarkScope`.

**Tooltip.** Unit: `role="tooltip"`; the trigger's `aria-describedby` while open; the shortcut chip's text; `isDisabled` on the trigger; the default delays are 400 and 120 (fake timers: hover opens at 400 and not at 399; leaving closes at 120); focus opens at once; axe on the open state. Play: opens on keyboard focus and not on a click's focus; a second trigger opens with no delay within the warm window; Escape closes the tip and leaves a surrounding dialog open; the tip stays while the pointer crosses onto it; a touch pointer opens nothing; scrolling an ancestor closes it; `data-placement` flips near an edge; the wrapper copies `data-theme`; `dir` is set from the locale. Visual: `Top`, `End` (with the shortcut chip and the arrow), `Wrapped` (long text), `InDarkScope`.

## 16. Docs and release

**Docs pages**, `apps/docs/content/docs/components/`: `dialog.mdx`, `confirm-dialog.mdx`, `drawer.mdx`, `sheet.mdx`, `popover.mdx`, `menu.mdx`, `toast.mdx`, `command-palette.mdx`, `tooltip.mdx`, each with Basic, States, Usage, Props (one `PropsTable` per part, with distinct labels), Accessibility with a `Keys` table, and Design rules with `Rules`; `badge.mdx` and `typography.mdx` gain the warning tone and the numeral sizes. Every page joins `meta.json` alphabetically and the per-page loops in `apps/docs/tests/` (axe, no sideways scroll, server rendering, the forced-colors and narrow-screen checks). Examples live in `apps/docs/examples/` and register in `index.ts` alphabetically. `menu.mdx` and `link.mdx` share the `RouterProvider` snippet (the client component with `useRouter`, the `RouterConfig` augmentation, the prefetch trade-off and the `render` escape hatch). `dialog.mdx` says once that the native top layer is not used and names the two z variables. `toast.mdx` shows the call after a server action, and the rule that the title says the outcome. `command-palette.mdx` shows a manual-mode async index, the recents, and that `onAction` runs after the restore. `tooltip.mdx` says a tooltip is supplementary and mirrors an icon button's label. The theming page gains the three token groups and the scope rule with `UNSAFE_PortalProvider` as the escape hatch.

Keys tables:

- Dialog, ConfirmDialog, Drawer, Sheet: Tab (cycles inside), Escape (closes), Enter and Space on the buttons.
- Popover: Escape (closes), Tab (moves through the content and out, which closes it).
- Menu: Down and Up (move), Home and End, letters (typeahead), Enter and Space (activate, or choose), Escape (closes and returns focus), Tab (closes).
- Toast: F6 (reaches the region), Tab (through a toast's action and dismiss), Enter and Space.
- CommandPalette: Cmd or Ctrl+K (opens and closes), Down and Up (move, wrap), Home and End, Enter (opens the item), Escape (closes), typing filters, Tab stays in the dialog.
- Tooltip: Tab (opens on focus), Escape (closes).

**Design record**, `docs/design-system.md`, written before each part is built: "Four colors added" becomes six with the tables and rules of 4.1; a `## Numerals` section (4.2); the Badge section's fifth tone; an `## Overlays` section (4.5) with the layer, scope, scrim, surfaces, motion and focus rules; and one section per part (Dialog and ConfirmDialog together, Drawer, Sheet with the spike's result, Popover, Menu, Toast, CommandPalette with the placeholder exception, Tooltip), each with its measured table. The "Still missing: tooltip" note is retired. Parent spec 6.3's tooltip sentence is amended (13.2, item 16).

**Packaging.** Every component exported from `packages/react/src/index.ts` with its types; its CSS in `packages/core/src/components/` and imported from `styles.css` in this order: `overlay.css`, `dialog.css`, `drawer.css`, `sheet.css`, `popover.css`, `menu.css`, `toast.css`, `command-palette.css`, `tooltip.css`. One line each in `packages/core/README.md` and `packages/react/README.md`. `.size-limit.json` entries for `Dialog`, `ConfirmDialog`, `Drawer`, `Sheet`, `Popover`, `Menu`, `toast` with `ToastRegion`, `CommandPalette` and `Tooltip`, budgets set after the first build and tightened before release; the two heavy ones (Sheet, and the palette's Autocomplete) are watched.

**Changesets**, each releasing `@snapshot-ui/core` and `@snapshot-ui/react` together as minor, in build order: `foundations.md` (the four tokens, the numeral sizes, the z variables, the contrast pairs), `badge-warning.md`, `overlays-dialog.md` (Dialog, ConfirmDialog, `useConfirm`, `DialogTrigger`), `overlays-drawer-sheet.md`, `overlays-popover-menu.md`, `overlays-toast.md` (which also pins `react-aria-components` to an exact version, since its toast API is unstable), `overlays-command-palette.md`, `overlays-tooltip.md`. Each names its new exports, so the consumer can delete its interim copies. The owner is told when the last of them is out, which starts the consumer's shell phase.

**Follow-ups recorded here, not done here:** replace the docs site's search dialog with CommandPalette; test the tooltip's double reading and the palette's `role="menu"` in NVDA and VoiceOver before the shell ships; the Select and ComboBox listbox inherits the row rules of 9.3.

## 17. Risks

- **R1: React Aria's `Sheet` is new.** Its headers carry 2026 copyrights and it cannot run in jsdom. Mitigation: the spike in 7.6 in three engines before any sheet code, the Modal fallback behind the same API, the WebKit project, and the exact version pin.
- **R2: the toast API is `UNSTABLE_`.** A minor of `react-aria-components` may change it. Mitigation: wrapped entirely, pinned exactly, with a changeset note; the public contract is four lines.
- **R3: internal attributes.** The toast region relies on `data-react-aria-top-layer` to stay announced and pressable under a modal, an internal contract. Mitigation: the modals' `shouldCloseOnInteractOutside` predicate does not depend on it, a test pins the hide behavior, and the fallback for announcement is `data-live-announcer`, also internal, named in the test.
- **R4: `role="menu"` behind `aria-activedescendant` in the palette** may read badly in a screen reader. Mitigation: the spike in 11.2 and the ListBox fallback at no API change.
- **R5: the scope copy misses.** An overlay opened with focus outside the scoped subtree (a controlled dialog opened by a keyboard shortcut from elsewhere) copies the wrong scope. Mitigation: trigger refs where React Aria gives them, `document.activeElement` otherwise, and `UNSAFE_PortalProvider` documented for the rest.
- **R6: a third-party overlay at a huge z-index** covers a library dialog. Mitigation: the two z variables are overridable and the docs say so.
- **R7: two near colors.** `warning` and `clay` are the closest pair in the system, and `gain` equals `success` in light. Mitigation: the meaning rules in 4.1 keep them out of one component and out of each other's roles; the values are the consumer's and stay.
- **R8: an error hidden behind three persistent toasts.** With `maxVisibleToasts` 3 and action toasts that never leave, a fourth toast, an error, waits unseen. Mitigation: the docs advise one action toast at a time and `toast.clear()` at the start of a new save; revisit with a priority rule if it happens.
- **R9: the browser floor.** `@starting-style` is above it, so a toast appears without its rise on Safari 16.4 and Firefox 128; the sheet's view timeline is above it too and React Aria falls back to a 300ms timer. Mitigation: both are documented and neither affects function.
- **R10: `onAction` timing.** The palette's close-then-act order only fails in a real browser. Mitigation: the play test that focuses a field.
- **R11: bundle weight.** Autocomplete, Menu and Modal ship inside the palette's entry, and Sheet is the largest single module in this batch. Mitigation: `size-limit` entries per component with budgets set from the first build.
- **R12: the warm window.** A tester may read React Aria's 380ms as a bug against the old 300ms. Mitigation: 6.3 is amended and the play test asserts "no delay within the window" rather than a number.
