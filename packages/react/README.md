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

## Links

- [Documentation](https://snapshotui.com/docs)
- [GitHub](https://github.com/amirehsan/snapshot-ui)
- [Design system](https://github.com/amirehsan/snapshot-ui/blob/main/docs/design-system.md)

## License

MIT
