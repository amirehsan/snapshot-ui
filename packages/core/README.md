# @snapshot-ui/core

Design tokens, the Tailwind v4 theme and component CSS for Snapshot UI. No JavaScript at runtime.

## Install

```bash
pnpm add @snapshot-ui/react @snapshot-ui/core
```

## Use

Import the stylesheet once, at the root of your app. `styles.css` holds the tokens and every component. `base.css` is optional: it sets the page background, the body type, the font rendering details and an ink focus ring for your own links and fields.

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

## Components

`styles.css` draws every component below, and `@snapshot-ui/react` supplies the markup that goes with each. Every name links to its page in the documentation, with examples, props, keyboard use and design rules.

- [Badge](https://snapshotui.com/docs/components/badge)
- [Button](https://snapshotui.com/docs/components/button)
- [Card](https://snapshotui.com/docs/components/card)
- [Checkbox](https://snapshotui.com/docs/components/checkbox)
- [Collapsible card](https://snapshotui.com/docs/components/collapsible-card)
- [Command palette](https://snapshotui.com/docs/components/command-palette)
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
- [Toast](https://snapshotui.com/docs/components/toast)
- [Typography](https://snapshotui.com/docs/components/typography)

## Links

- [Documentation](https://snapshotui.com/docs)
- [GitHub](https://github.com/amirehsan/snapshot-ui)
- [Design system](https://github.com/amirehsan/snapshot-ui/blob/main/docs/design-system.md)

## License

MIT
