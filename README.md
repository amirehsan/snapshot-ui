# Snapshot UI

Calm interfaces for settings, dashboards and apps. Snapshot UI is an accessible
React component library in a warm, editorial design language: cream surfaces,
one typeface at a 450 body weight, corners from one scale, and colors that carry
meaning. A plain HTML version that shares the same CSS is planned.

| Package | What it is |
| --- | --- |
| `@snapshot-ui/core` | Design tokens, the Tailwind v4 theme and every component's CSS. No JavaScript. |
| `@snapshot-ui/react` | React components built on React Aria. |

## Install

```bash
pnpm add @snapshot-ui/react @snapshot-ui/core
```

```tsx
import '@snapshot-ui/core/styles.css';
import { Button } from '@snapshot-ui/react';

export function Save() {
  return <Button>Save changes</Button>;
}
```

Load Sofia Sans as a variable font so the 450 body weight renders; see the
installation guide in the docs.

## Theming

Two attributes theme any element and everything inside it:

- `data-theme="light"` or `"dark"`. With no attribute, the system setting wins.
- `data-shape="rounded"`, `"soft"` or `"square"` cuts every corner one way.

## Develop

```bash
corepack enable
pnpm install
pnpm turbo run dev --filter=@snapshot-ui/docs
```

The packages are built first, so a fresh clone runs as is. Use
`--filter=@snapshot-ui/storybook` for the component workshop.

See [CONTRIBUTING.md](CONTRIBUTING.md). The design rules live in
[docs/design-system.md](docs/design-system.md).

## License

MIT
