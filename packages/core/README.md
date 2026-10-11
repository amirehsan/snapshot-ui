# @snapshot-ui/core

Design tokens, the Tailwind v4 theme and component CSS for Snapshot UI. No JavaScript at runtime.

## Install

```bash
pnpm add @snapshot-ui/react @snapshot-ui/core
```

## Use

Import the stylesheet once, at the root of your app. `styles.css` holds the tokens and every component. `base.css` is optional: it sets the page background, the body type and the font rendering details.

```ts
import '@snapshot-ui/core/styles.css';
import '@snapshot-ui/core/base.css';
```

The CSS sits in cascade layers, so your own unlayered CSS always wins, and Tailwind's utilities win over the components.

With Tailwind CSS, `tailwind.css` exposes the tokens as utilities, such as `bg-canvas`, `text-slate`, `rounded-control` and `p-part`:

```css
@import 'tailwindcss';
@import '@snapshot-ui/core/tailwind.css';
@import '@snapshot-ui/core/styles.css';
```

Body text is set at weight 450, which only a variable font has. Load Sofia Sans as one; the installation guide shows how.

## Links

- [Documentation](https://snapshotui.com/docs)
- [GitHub](https://github.com/amirehsan/snapshot-ui)
- [Design system](https://github.com/amirehsan/snapshot-ui/blob/main/docs/design-system.md)

## License

MIT
