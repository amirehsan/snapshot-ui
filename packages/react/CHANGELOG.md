# @snapshot-ui/react

## 0.3.0

### Minor Changes

- dc43eff: Add Avatar: a person, a merchant or a bank as an image over its initials, at 24, 32 and 40px (`size` `sm`, `md`, `lg`), a circle for a person or a square for a logo (`shape`), with one neutral fallback, initials from the first two words of `name` or from `initials`, and `isDecorative` for an avatar beside its name. A failed image shows the initials; the image stays hidden until it has loaded, so the initials show before the page hydrates. A blank `name` hides the avatar from assistive technology, and its accessible name always comes from `name`: an `aria-label` or a `role` a caller passes is replaced. `AvatarProps` is exported. `avatar.css` in `styles.css`.
- cf5f1b3: Add Meter, for spending against a budget: `segments` stacked in one bar (`look` `fill` for spent, `hatched` for held), a `max`, the app's `valueLabel` as the visible text and the accessible value, a `pace` marker for where spending would be today, an optional legend (`hasLegend`), and a `label` or an `aria-label`. Over the limit both looks turn the warning color, and `valueLabel` must say "over" in words, such as "$1,340 of $1,200, $140 over": color is never the only signal. The meter is static, so a server component renders it with no client JavaScript. On a surface other than a card, set `--meter-surface` to that surface's color. Every figure, each segment's `valueLabel`, the meter's `valueLabel` and the pace's `label`, is the app's formatted string. `MeterProps` and `MeterSegment` are exported, and `MeterBaseProps` for wrappers. `meter.css` in `styles.css`.
- 5faae7a: Add StatTile: one headline figure on the Card's surface, with an overline `label`, a `numeral-sm` `value`, a `change` line (`direction` up, down or flat, the app's whole sentence as `label`, and a `tone` that is neutral by default, `gain` only for money that arrived and `warning` only for a state that needs a look, never red or green for up and down), a `caption`, a `trend` slot that moves under the caption on a narrow tile, `level` to put the label in the outline, and `href` to make the whole tile one link through `RouterProvider`. Every figure is your formatted string. A tile without `href` is a static component that a server component renders with no client JavaScript. A linked tile is named by everything it shows and must hold no link or button, and it forwards only the attributes React Aria's Link forwards, so not `title` or `role`, for example. The tile is a size container, so it takes its width from its column. `StatTileProps` and `StatTileChange` are exported. `stat-tile.css` in `styles.css`.

### Patch Changes

- Updated dependencies [dc43eff]
- Updated dependencies [4d09265]
- Updated dependencies [cf5f1b3]
- Updated dependencies [e6c2d6b]
- Updated dependencies [5faae7a]
  - @snapshot-ui/core@0.3.0

## 0.2.0

### Minor Changes

- daaeb35: Add AppShell, the frame an app runs in: a skip link, the sidebar, header and bottom bar slots, a sticky header wrapper and `<main>`, the collapsed and drawer states controlled or uncontrolled (`isSidebarCollapsed`, `defaultSidebarCollapsed`, `onSidebarCollapsedChange`, `isDrawerOpen`, `defaultDrawerOpen`, `onDrawerOpenChange`), `data-sidebar="collapsed"` on the root so a server paints the right width from a cookie, the workspace offset and the bottom reserve, and `useAppShell()`.
  
  Add Sidebar and its parts (`SidebarGroup`, `SidebarItem`, `SidebarBrand`, `SidebarSearch`, `SidebarTrigger`, `useSidebar()`): a floating rail of labelled groups of links with an icon, a label, a count and `aria-current`, collapsed to a 72px icon rail with the names as tooltips, and a drawer below 1024px on Drawer. `app-shell.css` and `sidebar.css` in `styles.css`. For an app moving from its own shell: `collapsed` is `isSidebarCollapsed` (or `defaultSidebarCollapsed`, read from the cookie) and `onCollapsedChange` is `onSidebarCollapsedChange`, both on `AppShell`. The rail's rows stay 40px under compact density and grow to 44px on touch. Anything that navigates from inside the drawer, such as a command palette's `onAction`, calls `closeDrawer()` from `useAppShell()`. `--app-shell-inset-block-end` is the workspace's bottom reserve, the one property docked chrome adds to.
- fc19d59: Add the `warning` tone to Badge, for a state that needs a look soon and is not a failure, such as Watch, Behind, Needs review or Out of date.
- 0d8349c: Add BottomTabBar and BottomTabBarItem: three to five destinations docked at the bottom of a phone with the safe area padded inside, each with an icon, a one-line label, a count chip and an ink-pill current state, links through React Aria's Link (so `RouterProvider` and `render` apply) and a button item a `SheetTrigger` can wrap, hidden from 1024px up by CSS. Inside an AppShell the page keeps 64px plus the safe area clear under its content. Four labels such as Home, Transactions, Goals and More fit at 375px; "Transactions" ellipsizes at 320px and its name is never cut. The safe area needs `viewportFit: 'cover'`. `tab-bar.css` in `styles.css`.
- a06299d: A pending Button named by its text now always carries the spinner's `pendingLabel` in its accessible name, so "Save" reads "Save Saving" while it waits, instead of leaving each browser to find the spinner inside the button's content. While pending it is named by its label through `aria-labelledby`, and at rest by its text again, as before. A button named by `aria-label` or `aria-labelledby` already read both and is unchanged.
- 8bf98b5: Add `isChanged` and `changedLabel` to a standalone Checkbox, which shows the clay Changed chip beside its label and has a screen reader read it with the checkbox, as a Switch does. Invalid outranks changed. A Checkbox inside a CheckboxGroup ignores `isChanged`, because the group's own chip covers it. Every standalone Checkbox with a label now renders a `div.field-head` wrapper around its row and a `.field-changed` element beside it while it is valid, changed or not (CSS hides the chip while unchanged), so CSS written for the old markup, such as `.checkbox-field > .checkbox`, and tests or snapshots of the checkbox's DOM should check that the row is now a child of `.field-head`; a checkbox in a group, or with no visible label, keeps the old markup.
- 7a8fb46: Mark a folded CollapsibleCard that holds a change, and open it for an invalid field. While folded, the card shows a clay dot after its title when a field in its body is changed, or when `isChanged` says so, and a screen reader reads `changedLabel`, "Changed" by default, with the toggle. A folded card also opens itself, at once, when a field in its body fails the browser's validation on submit, or when a script calls `checkValidity()` or `reportValidity()`, so the field is in view when it takes focus.
- f7db4af: Let a CollapsibleCard remember its fold. Given a `storageKey`, the card keeps its fold in this browser, in one `localStorage` entry, and cards with the same key fold together, on the page and in other tabs. A controlled card stores nothing. On a server-rendered page a remembered card renders open and folds as the page hydrates, with no transition.
- 6f0b952: Add CollapsibleCard, a card whose body folds under its header. The title is the toggle, a row at least 40px tall with a chevron, and the note and the actions stay in the header while the card is folded. It draws with Card's classes and is built on React Aria's Disclosure. In browsers that support `hidden="until-found"`, find-in-page can open a folded card; in others, a folded body is not searchable.
- 89ddcb5: Add the density axis: `data-density="compact"` on any element remaps `--size-control` (40px, 36px compact, 44px compact on a coarse pointer), `--size-field` (48px, 36px, 44px) and `--spacing-card` (32px, 20px) for its subtree, generated like `data-shape`; `--size-target` is the 40px floor every hit area is extended to. Add `--spacing-inset` (16px, how far floating chrome sits from the viewport edge), `--container-sidebar` (20rem, 6.5rem under `data-sidebar="collapsed"`) and the `--z-header` (20) and `--z-chrome` (30) z-index tokens. `p-card`, `gap-inset` and `max-w-sidebar` join the Tailwind theme.
  
  Button, IconButton, SegmentedControl, the text input and Card read the tokens: 36px controls, 36px fields and 20px card padding under `data-density="compact"`, 44px on a touch screen. Comfortable renders exactly as 0.1.0 at the default 16px root font size; the segmented control's heights now come from the px size tokens, as the button's already did, so a larger root font no longer grows them. The overlays' 16px edge inset is `--spacing-inset`. For compact on every phone, set the tokens in a media query of your own, as the theming page's Density section shows. A bordered compact Button or IconButton is hit at 40px: the hit area reads the control's padding box, not the token. The dialog's close button and the drawer, sheet and dialog close reserves read `--size-control`, so a compact close button keeps its title centred. IconButton is now `position: relative`; a rule that positions an icon button absolutely needs two classes, as `.icon-button.dialog-close` does, to win whatever order the files load in.
- c98117e: Draw a disabled Switch's label in taupe, as a disabled Checkbox's and Radio's is, and align the radio dot, the switch track and the switch's Changed chip with the first line of a label that wraps, as the checkbox box is, so a long label no longer leaves them beside its middle.
- 03e906a: Breaking type change: every field's props now require an accessible name. TextField, TextArea, CheckboxGroup and RadioGroup need a `label`, an `aria-label` or an `aria-labelledby`, and Checkbox, Switch and Radio need their text as `children`, an `aria-label` or an `aria-labelledby`, as SegmentedControl and IconButton already did. SegmentedControlItem keeps `children` required. Code that renders a field with no visible label, `aria-label` or `aria-labelledby` stops compiling. Nothing changes at run time. Because those props types are now unions, which cannot be extended, each of these fields also exports its base props type, such as `TextFieldBaseProps`, for code that extends or omits from them.
  
  A field with no name stops compiling. TypeScript's message then either says that the props object (often `{}`) is not assignable to the field's props, or names only `aria-labelledby` as missing. Both mean the field has no accessible name. The fix is a `label` (`children` for Checkbox, Radio and Switch), an `aria-label`, or an `aria-labelledby` that points at a label shown elsewhere.
  
  The rule checks that a name key is present, not that it holds a name. A key whose value is `undefined` at run time, such as `label={undefined}`, still compiles, and so does an empty `aria-label`.
  
  To write a wrapper that passes the rule on, extend or omit from the field's base props type and intersect the result with the exported `AccessibleName<'label'>` (`AccessibleName<'children'>` for Checkbox, Radio and Switch), for example `Omit<TextFieldBaseProps, 'description'> & AccessibleName<'label'>`. `AccessibleName` and `AriaName` are exported from the package as types only, so they add nothing to the bundle.
- b152f23: Add the `warning` and `gain` colors (`--color-warning`, `--color-gain`, with `bg-warning` and `text-gain` in the Tailwind theme), the `numeral` and `numeral-sm` type steps (`--text-numeral` and `--text-numeral-sm` with their line height, tracking and weight), the `--z-modal` and `--z-toast` z-index tokens, and `Text size="numeral" | "numeral-sm"`, a tabular figure that never wraps at 56px (44px under 768px) or 32px. Warning and gain are gated on every surface in both themes.
- 6523d02: Add CommandPalette: a Cmd or Ctrl+K dialog near the top of the viewport with an input over a menu, an AND-of-words filter that ignores case and accents or a manual mode for app-driven results with a loading state, sections, recents in local storage or controlled, a status line that waits for typing to pause, and `onAction` after the palette has closed and focus has returned.
- 0c3f396: Add Dialog, a modal panel on React Aria's Modal and Dialog: a required title, a description, an icon well with a danger tone, `md` and `lg` widths, a scrolling body under a pinned action row, an optional close button, and Escape and scrim dismissal. `DialogTrigger` is re-exported. The shared overlay layer ships with it: every overlay copies its theme, shape and density from what it opened from, and one scrim paints when modals stack. ConfirmDialog is the alert dialog on top of it: a required description and tone, a confirm label that names the outcome, Cancel first, a pending state from a promise or `isPending`, and `useConfirm()`, which returns a promise that is true only when the confirm button is pressed.
- d6ef54e: Add Drawer, a floating side panel on React Aria's Modal that slides from the start or end edge over the scrim, inset 16px from the viewport, with a required title that may be visually hidden, a scrolling body, a pinned footer and a close button.
  
  Sheet is the bottom sheet for phones on React Aria's Sheet family: a grabber, a title that may be hidden, a description, a scrolling body, a safe-area footer, a close button, swipe-to-dismiss and snap points, up to 92% of the viewport. `SheetTrigger` is re-exported.
- fa88c76: Add Popover, the float surface a menu or a small panel opens in: the frame edge, the surface corner and the float shadow, 8px from its trigger, flipped to fit, with `isPadded` for free content and `matchTriggerWidth`. A popover opened with `isOpen` or `defaultOpen` outside a trigger needs `triggerRef`, and throws an error that names it when it has none.
  
  Menu is a true `role="menu"` in that popover: `MenuTrigger` re-exported, `Menu`, `MenuItem` with an icon, a description, a shortcut drawn as a key and a danger variant, `MenuSection` with a heading and its own selection, and `MenuSeparator`. Single selection is the ink pill with a check and closes on a choice; multiple is the check alone. Items with `href` navigate through `RouterProvider`. `MenuItem` also takes `end`, a preformatted value drawn before the key.
  
  `RouterProvider` and the `RouterConfig` interface are re-exported from React Aria, so an app wraps itself in the library's own copy and augments `RouterConfig` on `@snapshot-ui/react`, and Link and Menu items with `href` always navigate through its router.
  
  `I18nProvider` and its `I18nProviderProps` are re-exported the same way. Wrap a right-to-left region, such as a guide in Persian, in it with the region's locale: a `dir` on a page section lays out the section, but a dialog, a menu, a popover or a tooltip opened from it is portaled to the body and takes its direction from the locale alone. A toast follows the locale where `ToastRegion` is mounted, so an app with a right-to-left section mounts its `ToastRegion` inside the same `I18nProvider` if it wants right-to-left toasts. The `Placement` and `Key` types that Popover, Menu, Tooltip and CommandPalette props use are exported too, so an app types them with no import from React Aria.
- 35f3c01: Add Toast: `toast({ title, description, tone, action, timeout })` returns an id, `toast.dismiss(id)` and `toast.clear()`, and `<ToastRegion />`, mounted once at the app root. Four tones with a stripe, 6 seconds (12 for errors), a toast with an action stays until it is used, errors are assertive and the rest are announced politely through a status region that exists before its text, hover and focus pause the timers, and the region sits above every modal. React Aria's toast parts are `UNSTABLE_` in react-aria-components 1.22, so `@snapshot-ui/react` now pins it to exactly 1.22.1; a bump is a deliberate change with a test run behind it. If your app installs `react-aria-components` itself, pin it to exactly 1.22.1 too, with no range, so the app and the library share one copy of React Aria.
- 8fe0ed1: Add Tooltip and TooltipTrigger: an ink tip with canvas text that opens after 400ms of hover and at once on keyboard focus, stays warm for about half a second after one closes, is hoverable, closes on Escape, a press, a scroll and a resize, never shows for touch, and can carry a key chip through `shortcut`.

### Patch Changes

- Updated dependencies [daaeb35]
- Updated dependencies [fc19d59]
- Updated dependencies [0d8349c]
- Updated dependencies [a06299d]
- Updated dependencies [8bf98b5]
- Updated dependencies [7a8fb46]
- Updated dependencies [f7db4af]
- Updated dependencies [6f0b952]
- Updated dependencies [89ddcb5]
- Updated dependencies [c98117e]
- Updated dependencies [03e906a]
- Updated dependencies [b152f23]
- Updated dependencies [6523d02]
- Updated dependencies [0c3f396]
- Updated dependencies [d6ef54e]
- Updated dependencies [fa88c76]
- Updated dependencies [35f3c01]
- Updated dependencies [8fe0ed1]
  - @snapshot-ui/core@0.2.0

## 0.1.0

### Minor Changes

- d030c30: Add Card, a static lifted surface with CardHeader, CardTitle, CardNote and CardBody parts.
- d9924f7: Add Checkbox and CheckboxGroup: a 20px box in a 40px row that is the whole label, with an ink fill and a canvas mark that reads in both themes, and a group that follows the field contract.
- d3e6e6c: Add the field parts: Label, Description, FieldError, FieldCounter and FieldChanged, with the `field` classes and the `data-changed` state.
- bd4637d: First release. Design tokens with the color mode and corner shape axes, the Tailwind v4 theme, and the Button and Spinner components.
- f117ed7: Add the `--focus-ring-color` token, which every focus ring now reads, so a theme can recolor all rings from one variable. Declare `@snapshot-ui/core` as an optional peer of `@snapshot-ui/react`, so an install that includes both keeps them on matching versions.
- 34cc6ca: Add IconButton.
- 28971f6: Add Link, Kbd and Badge. Link is an inline link in Link Blue with hover, press and focus states. Kbd is a key hint. Badge is a short outlined label in neutral, info, success or error.
- 97aafd5: Add RadioGroup and Radio: full-pill option rows with the chosen row as the ink pill and a check in its ring, a label row with the Changed chip, a hint, an error line, and an error edge on the rows.
- d6f8c03: Add SegmentedControl and SegmentedControlItem: a few short options in a 48px pill track, stacked one per row when the row does not fit.
- 891cf04: Add Switch: the 52px track and round thumb with its label, optional hint and Changed chip, whose thumb keeps the same gap at both ends and whose disabled look differs when it is on.
- 12620fe: Add TextArea: the multi-line field, with the label row, hint, error line, changed and invalid edges and optional length count of TextField on a 6rem box that resizes vertically.
- a61167d: Add TextField and Input: the 48px pill input with its label row, hint, error line, changed and invalid edges and optional length count.
- f156054: Add Heading, Text and Eyebrow.

### Patch Changes

- 922e069: List the components in the READMEs.
- Updated dependencies [d030c30]
- Updated dependencies [d9924f7]
- Updated dependencies [d3e6e6c]
- Updated dependencies [bd4637d]
- Updated dependencies [f117ed7]
- Updated dependencies [34cc6ca]
- Updated dependencies [28971f6]
- Updated dependencies [97aafd5]
- Updated dependencies [922e069]
- Updated dependencies [d6f8c03]
- Updated dependencies [891cf04]
- Updated dependencies [12620fe]
- Updated dependencies [a61167d]
- Updated dependencies [f156054]
  - @snapshot-ui/core@0.1.0
