---
'@snapshot-ui/core': minor
'@snapshot-ui/react': minor
---

Add Popover, the float surface a menu or a small panel opens in: the frame edge, the surface corner and the float shadow, 8px from its trigger, flipped to fit, with `isPadded` for free content and `matchTriggerWidth`.

Menu is a true `role="menu"` in that popover: `MenuTrigger` re-exported, `Menu`, `MenuItem` with an icon, a description, a shortcut drawn as a key and a danger variant, `MenuSection` with a heading and its own selection, and `MenuSeparator`. Single selection is the ink pill with a check and closes on a choice; multiple is the check alone. Items with `href` navigate through `RouterProvider`. `MenuItem` also takes `end`, a preformatted value drawn before the key.

`RouterProvider` and the `RouterConfig` interface are re-exported from React Aria, so an app wraps itself in the library's own copy and augments `RouterConfig` on `@snapshot-ui/react`, and Link and Menu items with `href` always navigate through its router.
