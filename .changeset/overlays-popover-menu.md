---
'@snapshot-ui/core': minor
'@snapshot-ui/react': minor
---

Add Popover, the float surface a menu or a small panel opens in: the frame edge, the surface corner and the float shadow, 8px from its trigger, flipped to fit, with `isPadded` for free content and `matchTriggerWidth`. A popover opened with `isOpen` or `defaultOpen` outside a trigger needs `triggerRef`, and throws an error that names it when it has none.

Menu is a true `role="menu"` in that popover: `MenuTrigger` re-exported, `Menu`, `MenuItem` with an icon, a description, a shortcut drawn as a key and a danger variant, `MenuSection` with a heading and its own selection, and `MenuSeparator`. Single selection is the ink pill with a check and closes on a choice; multiple is the check alone. Items with `href` navigate through `RouterProvider`. `MenuItem` also takes `end`, a preformatted value drawn before the key.

`RouterProvider` and the `RouterConfig` interface are re-exported from React Aria, so an app wraps itself in the library's own copy and augments `RouterConfig` on `@snapshot-ui/react`, and Link and Menu items with `href` always navigate through its router.

`I18nProvider` and its `I18nProviderProps` are re-exported the same way. Wrap a right-to-left region, such as a guide in Persian, in it with the region's locale: a `dir` on a page section lays out the section, but a dialog, a menu, a popover or a tooltip opened from it is portaled to the body and takes its direction from the locale alone. A toast follows the locale where `ToastRegion` is mounted, so an app with a right-to-left section mounts its `ToastRegion` inside the same `I18nProvider` if it wants right-to-left toasts. The `Placement` and `Key` types that Popover, Menu, Tooltip and CommandPalette props use are exported too, so an app types them with no import from React Aria.
