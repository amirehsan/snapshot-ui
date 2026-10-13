# @snapshot-ui/react

Accessible React components for Snapshot UI, built on React Aria. Needs React 19 or later.

## Install

```bash
pnpm add @snapshot-ui/react @snapshot-ui/core
```

The components carry no CSS of their own. `@snapshot-ui/core` holds the styles.

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

Every component file carries `'use client'`, so a Next.js server component can render them directly.

Body text is set at weight 450, which only a variable font has. Load Sofia Sans as one; the installation guide shows how.

## Components

Every name links to its page in the documentation, with examples, props, keyboard use and design rules.

- [Badge](https://snapshotui.com/docs/components/badge)
- [Button](https://snapshotui.com/docs/components/button)
- [Card](https://snapshotui.com/docs/components/card)
- [Checkbox](https://snapshotui.com/docs/components/checkbox)
- [Collapsible card](https://snapshotui.com/docs/components/collapsible-card)
- [Confirm dialog](https://snapshotui.com/docs/components/confirm-dialog)
- [Dialog](https://snapshotui.com/docs/components/dialog)
- [Drawer](https://snapshotui.com/docs/components/drawer)
- [Field parts](https://snapshotui.com/docs/components/field)
- [Icon button](https://snapshotui.com/docs/components/icon-button)
- [Kbd](https://snapshotui.com/docs/components/kbd)
- [Link](https://snapshotui.com/docs/components/link)
- [Menu](https://snapshotui.com/docs/components/menu)
- [Popover](https://snapshotui.com/docs/components/popover)
- [Radio group](https://snapshotui.com/docs/components/radio-group)
- [Segmented control](https://snapshotui.com/docs/components/segmented-control)
- [Sheet](https://snapshotui.com/docs/components/sheet)
- [Spinner](https://snapshotui.com/docs/components/spinner)
- [Switch](https://snapshotui.com/docs/components/switch)
- [Text area](https://snapshotui.com/docs/components/text-area)
- [Text field](https://snapshotui.com/docs/components/text-field)
- [Typography](https://snapshotui.com/docs/components/typography)

## Links

- [Documentation](https://snapshotui.com/docs)
- [GitHub](https://github.com/amirehsan/snapshot-ui)
- [Design system](https://github.com/amirehsan/snapshot-ui/blob/main/docs/design-system.md)

## License

MIT
