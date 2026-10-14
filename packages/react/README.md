# @snapshot-ui/react

Accessible React components for Snapshot UI, built on React Aria. Needs React 19 or later.

## Install

```bash
pnpm add @snapshot-ui/react @snapshot-ui/core
```

The components carry no CSS of their own. `@snapshot-ui/core` holds the styles.

The package pins `react-aria-components` to exactly 1.22.1, since the toast parts it wraps are unstable in React Aria. If your app installs `react-aria-components` too, pin it to that same version, with no range, so there is one copy of React Aria. `RouterProvider` and `I18nProvider` come from this package, the library's own copy of React Aria's, so they always reach its parts.

For right to left, wrap the region in `I18nProvider` with its locale, such as `fa-IR`, beside its `dir="rtl"`: a `dir` on a page section does not reach a dialog, a menu, a popover or a tooltip portaled to the body, and the locale does. A toast follows the locale where `ToastRegion` is mounted, so mount it inside the same `I18nProvider` if the section should get right-to-left toasts.

## Use

Import the stylesheet once, at the root of your app. `base.css` is optional: it sets the page background, the body type, the font rendering details and an ink focus ring for your own links and fields.

```tsx
import '@snapshot-ui/core/styles.css';
import '@snapshot-ui/core/base.css';
import { Button } from '@snapshot-ui/react';

export function Save() {
  return <Button>Save changes</Button>;
}
```

Stateful or interactive components carry `'use client'`. Static ones carry none, so a server component renders them with no client JavaScript: Heading, Text, Eyebrow, Kbd, Badge, Card, the field counter and chip, Meter and a StatTile without `href`. Either kind can be rendered from a Next.js server component directly.

Body text is set at weight 450, which only a variable font has. Load Sofia Sans as one; the installation guide shows how.

## Components

Every name links to its page in the documentation, with examples, props, keyboard use and design rules.

- [App shell](https://snapshotui.com/docs/components/app-shell)
- [Avatar](https://snapshotui.com/docs/components/avatar)
- [Badge](https://snapshotui.com/docs/components/badge)
- [Bottom tab bar](https://snapshotui.com/docs/components/bottom-tab-bar)
- [Button](https://snapshotui.com/docs/components/button)
- [Calendar](https://snapshotui.com/docs/components/calendar)
- [Card](https://snapshotui.com/docs/components/card)
- [Checkbox](https://snapshotui.com/docs/components/checkbox)
- [Collapsible card](https://snapshotui.com/docs/components/collapsible-card)
- [Combo box](https://snapshotui.com/docs/components/combo-box)
- [Command palette](https://snapshotui.com/docs/components/command-palette)
- [Confirm dialog](https://snapshotui.com/docs/components/confirm-dialog)
- [Dialog](https://snapshotui.com/docs/components/dialog)
- [Drawer](https://snapshotui.com/docs/components/drawer)
- [Field parts](https://snapshotui.com/docs/components/field)
- [Icon button](https://snapshotui.com/docs/components/icon-button)
- [Kbd](https://snapshotui.com/docs/components/kbd)
- [Link](https://snapshotui.com/docs/components/link)
- [Menu](https://snapshotui.com/docs/components/menu)
- [Meter](https://snapshotui.com/docs/components/meter)
- [Multi-select](https://snapshotui.com/docs/components/multi-select)
- [Number field](https://snapshotui.com/docs/components/number-field)
- [Pagination](https://snapshotui.com/docs/components/pagination)
- [Popover](https://snapshotui.com/docs/components/popover)
- [Radio group](https://snapshotui.com/docs/components/radio-group)
- [Search field](https://snapshotui.com/docs/components/search-field)
- [Segmented control](https://snapshotui.com/docs/components/segmented-control)
- [Select](https://snapshotui.com/docs/components/select)
- [Sheet](https://snapshotui.com/docs/components/sheet)
- [Sidebar](https://snapshotui.com/docs/components/sidebar)
- [Spinner](https://snapshotui.com/docs/components/spinner)
- [Stat tile](https://snapshotui.com/docs/components/stat-tile)
- [Switch](https://snapshotui.com/docs/components/switch)
- [Tabs](https://snapshotui.com/docs/components/tabs)
- [Text area](https://snapshotui.com/docs/components/text-area)
- [Text field](https://snapshotui.com/docs/components/text-field)
- [Toast](https://snapshotui.com/docs/components/toast)
- [Tooltip](https://snapshotui.com/docs/components/tooltip)
- [Typography](https://snapshotui.com/docs/components/typography)

## Links

- [Documentation](https://snapshotui.com/docs)
- [GitHub](https://github.com/amirehsan/snapshot-ui)
- [Design system](https://github.com/amirehsan/snapshot-ui/blob/main/docs/design-system.md)

## License

MIT
